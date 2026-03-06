import React, { useEffect, useState } from 'react';
import { FaSignInAlt, FaSignOutAlt, FaClock, FaCalendarAlt, FaUserCircle } from 'react-icons/fa';
import { employeeSelfApi } from '../../../services/employeeSelf';
import './EmployeePage.css';

const formatHours = (h) => (h == null || parseFloat(h) === 0) ? '0h' : `${Math.round(h)}h`;
const formatDays = (d) => (d == null || parseFloat(d) === 0) ? 0 : Math.max(1, Math.round(d));

// Helper: parse "HH:MM:SS" → decimal hours (same logic as Responsable page)
const timeStrToHours = (str) => {
  if (!str || str === '-') return null;
  const parts = str.split(':').map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  return parts[0] + parts[1] / 60 + (parts[2] || 0) / 3600;
};

const EmployeePage = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.matricule) {
        setError("Votre matricule n'est pas défini dans le profil.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await employeeSelfApi.getMyPointage(user.matricule);
        setRecords(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.matricule]);

  const primary = records[0] || null;

  const handlePointage = async (newStatus) => {
    if (!primary) return;
    setUpdating(true);
    setError(null);

    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('fr-FR', { hour12: false });

      let updatedEntree = primary.pointageEntree;
      let updatedSortie = primary.pointageSortie;
      let updatedTotHrsTravaillees = primary.totHrsTravaillees || 0;
      let updatedNbrJrsTravaillees = primary.nbrJrsTravaillees || 0;

      if (newStatus === 'Présent') {
        updatedEntree = timeString;
        updatedSortie = '-';
      } else if (newStatus === 'Sortie') {
        if (!updatedEntree || updatedEntree === '-') {
          setError("Veuillez marquer d'abord l'entrée avant la sortie.");
          setUpdating(false);
          return;
        }
        updatedSortie = timeString;

        const entreeHours = timeStrToHours(updatedEntree);
        const sortieHours = timeStrToHours(updatedSortie);

        if (entreeHours !== null && sortieHours !== null) {
          let sessionHours = sortieHours - entreeHours;
          if (sessionHours < 0) {
            sessionHours += 24; // overnight shift
          }
          updatedTotHrsTravaillees += sessionHours;
          updatedNbrJrsTravaillees += 1;
        }
      } else if (newStatus === 'Absent') {
        updatedEntree = '-';
        updatedSortie = '-';
      }

      const updatedRecord = {
        ...primary,
        status: newStatus,
        pointageEntree: updatedEntree,
        pointageSortie: updatedSortie,
        totHrsTravaillees: updatedTotHrsTravaillees,
        nbrJrsTravaillees: updatedNbrJrsTravaillees,
      };

      const saved = await employeeSelfApi.updateMyPointage(updatedRecord);

      setRecords((prev) =>
        prev.map((r) => (r.id === saved.id ? saved : r))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="employee-page">
      <div className="employee-header card">
        <div className="employee-header-main">
          <div className="avatar-wrapper">
            <div className="avatar-circle">
              <FaUserCircle />
            </div>
            <div>
              <h1 className="employee-name">{user?.name || user?.username}</h1>
              <p className="employee-matricule">Matricule : {user?.matricule || '—'}</p>
            </div>
          </div>
          <div className="employee-meta">
            <div>
              <span className="meta-label">Client</span>
              <span className="meta-value">{primary?.client || '—'}</span>
            </div>
            <div>
              <span className="meta-label">Site</span>
              <span className="meta-value">{primary?.site || '—'}</span>
            </div>
            <div>
              <span className="meta-label">Chantier / Atelier</span>
              <span className="meta-value">{primary?.chantierAtelier || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="employee-grid">
        <div className="card action-card">
          <h2>Mon Pointage</h2>
          <p className="card-subtitle">
            Utilisez ces actions pour pointer votre présence conformément au cahier de charge.
          </p>

          <div className="action-buttons">
            <button
              className="btn-action present"
              onClick={() => handlePointage('Présent')}
              disabled={updating}
            >
              <FaSignInAlt />
              <span>Pointer entrée</span>
            </button>
            <button
              className="btn-action sortie"
              onClick={() => handlePointage('Sortie')}
              disabled={updating}
            >
              <FaSignOutAlt />
              <span>Pointer sortie</span>
            </button>
          </div>

          <div className="current-status">
            <div className="status-row">
              <span className="status-label">Statut actuel</span>
              <span className={`status-pill status-${(primary?.status || 'en-attente').toLowerCase()}`}>
                {primary?.status || 'En attente'}
              </span>
            </div>
            <div className="status-row">
              <span className="status-label">Dernière entrée</span>
              <span className="status-value">
                <FaClock /> {primary?.pointageEntree || '-'}
              </span>
            </div>
            <div className="status-row">
              <span className="status-label">Dernière sortie</span>
              <span className="status-value">
                <FaClock /> {primary?.pointageSortie || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="card stats-card">
          <h2>Mon Historique de Présence</h2>
          <p className="card-subtitle">
            Synthèse de vos jours travaillés, absences et heures effectuées.
          </p>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Jours travaillés</span>
              <span className="stat-value">{formatDays(primary?.nbrJrsTravaillees)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Jours d'absence</span>
              <span className="stat-value">{formatDays(primary?.nbrJrsAbsence)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Heures travaillées</span>
              <span className="stat-value">{formatHours(primary?.totHrsTravaillees)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Heures dimanche</span>
              <span className="stat-value">{formatHours(primary?.totHrsDimanche)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card history-card">
        <div className="history-header">
          <h2>
            <FaCalendarAlt /> Détails de présence
          </h2>
          <p className="card-subtitle">
            Vue détaillée de vos compteurs d'activité utilisés par l'admin dans la vue globale.
          </p>
        </div>

        {loading ? (
          <div className="history-loading">Chargement de vos données...</div>
        ) : error ? (
          <div className="history-error">{error}</div>
        ) : records.length === 0 ? (
          <div className="history-empty">
            Aucune donnée de pointage trouvée pour votre matricule.
          </div>
        ) : (
          <div className="table-responsive employee-history-table-wrapper">
            <table className="employee-history-table">
              <thead>
                <tr>
                  <th>Affaire N°</th>
                  <th>Client</th>
                  <th>Site</th>
                  <th>Planifié</th>
                  <th>Hrs trav.</th>
                  <th>Jrs trav.</th>
                  <th>Jrs Abs.</th>
                  <th>Jrs Congés</th>
                  <th>Jrs Maladie</th>
                  <th>Jrs Récup.</th>
                  <th>Jrs Dépl. Maroc</th>
                  <th>Jrs Dépl. Expat.</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.id}>
                    <td>{row.affaireNumero || '-'}</td>
                    <td>{row.client || '-'}</td>
                    <td>{row.site || '-'}</td>
                    <td>{row.plannedHours ? `${row.plannedHours}h` : '—'}</td>
                    <td>{formatHours(row.totHrsTravaillees)}</td>
                    <td>{formatDays(row.nbrJrsTravaillees)}</td>
                    <td>{formatDays(row.nbrJrsAbsence)}</td>
                    <td>{formatDays(row.nbrJrsConges)}</td>
                    <td>{formatDays(row.nbrJrsMaladie)}</td>
                    <td>{formatDays(row.nbrJrsRecuperation)}</td>
                    <td>{formatDays(row.nbrJrsDeplacementsMaroc)}</td>
                    <td>{formatDays(row.nbrJrsDeplacementsExpatrie)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePage;

