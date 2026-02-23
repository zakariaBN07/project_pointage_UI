import React, { useState, useEffect, useContext } from 'react';
import * as XLSX from 'xlsx';
import { NotificationContext } from '../../../context/NotificationContext';
import './Responsable.css';

const Responsable = ({ user }) => {
  const { addNotification } = useContext(NotificationContext);
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const url = user?.id 
        ? `${API_EMPLOYEE}/employees?responsableId=${user.id}`
        : `${API_EMPLOYEE}/employees`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map(emp => ({
          id: emp.id,
          name: emp.name,
          status: emp.status || 'En attente',
          arrivee: emp.pointageEntree || '-',
          depart: emp.pointageSortie || '-'
        }));
        setReports(formattedData);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user?.id]);

  const handleExportReports = async () => {
    setIsExporting(true);
    try {
      const url = user?.id 
        ? `${API_EMPLOYEE}/employees?responsableId=${user.id}`
        : `${API_EMPLOYEE}/employees`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch latest employee data');
        setIsExporting(false);
        return;
      }

      const latestData = await response.json();
      const formattedData = latestData.map(emp => ({
        id: emp.id,
        name: emp.name,
        status: emp.status || 'En attente',
        arrivee: emp.pointageEntree || '-',
        depart: emp.pointageSortie || '-'
      }));

      const dataToExport = formattedData.map(report => ({
        'Responsable': user?.name || 'Non spécifié',
        'Nom de l\'Employé': report.name,
        'Heure d\'Entrée': report.arrivee,
        'Heure de Sortie': report.depart,
        'Statut': report.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rapport Journalier");
      XLSX.writeFile(workbook, "Rapport_Journalier.xlsx");

      addNotification(
        `${user?.name || 'Un responsable'} a exporté le rapport journalier (${dataToExport.length} employé(s))`,
        'success',
        dataToExport
      );
    } catch (error) {
      console.error("Error exporting reports:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const stats = {
    total: reports.length,
    present: reports.filter(r => r.status === 'Présent').length,
    absent: reports.filter(r => r.status === 'Absent').length
  };

  return (
    <div className="responsable-view">
      <div className="view-header">
        <h1>Espace Responsable</h1>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <span className="stat-label">Total Employés</span>
          <span className="stat-value">{stats.total}</span>
          <span className="stat-trend trend-up">Actifs</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Présents Aujourd'hui</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.present}</span>
          <span className="stat-trend trend-up">En poste</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Absences</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>{stats.absent}</span>
          <span className="stat-trend" style={{ background: '#fee2e2', color: '#991b1b' }}>Aujourd'hui</span>
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Rapport Journalier de Pointage</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={fetchReports} className="refresh-btn">
              🔄 Actualiser
            </button>
            <button 
              onClick={handleExportReports} 
              className="refresh-btn"
              disabled={reports.length === 0 || isExporting}
              style={{ background: '#10b981', color: 'white', opacity: reports.length === 0 || isExporting ? 0.5 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}
            >
              {isExporting ? '⏳ Export...' : '📥 Exporter'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement des rapports...</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nom de l'Employé</th>
                  <th>Heure d'Entrée</th>
                  <th>Heure de Sortie</th>
                  <th style={{ textAlign: 'right' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun rapport disponible.</td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id}>
                      <td style={{ fontWeight: 600 }}>{report.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{report.arrivee}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{report.depart}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${report.status === 'Présent' ? 'badge-success' : 'badge-warning'}`}>
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Responsable;
