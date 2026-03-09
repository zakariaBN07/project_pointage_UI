import React, { useState, useEffect, useContext, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { NotificationContext } from '../../../notifications/NotificationContext';
import {
  FaSync,
  FaFileExport,
  FaClipboardList,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaCalendarAlt,
  FaHardHat
} from 'react-icons/fa';
import './Superviseur.css';

const formatHours = (h) => (h == null || parseFloat(h) === 0) ? '0h' : `${Math.round(h)}h`;
const formatDays = (d) => (d == null || parseFloat(d) === 0) ? 0 : Math.max(1, Math.round(d));

const SuperviseurPage = ({ user }) => {
  const { addNotification } = useContext(NotificationContext);
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeActivityModal, setActiveActivityModal] = useState(null);
  const [editingProgress, setEditingProgress] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const url = user?.id
        ? `${API_EMPLOYEE}/employees?supervisorId=${user.id}`
        : `${API_EMPLOYEE}/employees`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map(emp => ({
          ...emp,
          arrivee: emp.pointageEntree || '-',
          depart: emp.pointageSortie || '-',
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

  const handleExportEmployees = () => {
    const dataToExport = reports.map((emp) => ({
      'Nom': emp.name,
      'Matricule': emp.matricule,
      'Affaire N°': emp.affaireNumero,
      'Client': emp.client,
      'Site': emp.site,
      'Heures Planifiées': emp.plannedHours || 0,
      'Tot.Hrs trav.': formatHours(emp.totHrsTravaillees),
      'Jrs trav.': formatDays(emp.nbrJrsTravaillees),
      'Jrs Absence': formatDays(emp.nbrJrsAbsence),
      'Hrs Dimanche': formatHours(emp.totHrsDimanche),
      'Jrs Fériés': formatDays(emp.nbrJrsFeries),
      'Jrs Fériés Trav.': formatDays(emp.nbrJrsFeriesTravailes),
      'Jrs Congés': formatDays(emp.nbrJrsConges),
      'Jrs Dépl. Maroc': formatDays(emp.nbrJrsDeplacementsMaroc),
      'Jrs Paniers': formatDays(emp.nbrJrsPaniers),
      'Jrs Détente': formatDays(emp.nbrJrsDetente),
      'Jrs Dépl. Expat': formatDays(emp.nbrJrsDeplacementsExpatrie),
      'Jrs Récup': formatDays(emp.nbrJrsRecuperation),
      'Jrs Maladie': formatDays(emp.nbrJrsMaladie),
      'Chantier/Atelier': emp.chantierAtelier || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employés");
    XLSX.writeFile(workbook, "List_Employees.xlsx");
  };


  const handleExportReports = async () => {
    setIsExporting(true);
    try {
      const url = user?.id
        ? `${API_EMPLOYEE}/employees?supervisorId=${user.id}`
        : `${API_EMPLOYEE}/employees`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch latest employee data');
        setIsExporting(false);
        return;
      }

      const latestDataRaw = await response.json();

      const seen = new Set();
      const formattedData = latestDataRaw
        .filter(emp => {
          const key = `${emp.name.toLowerCase().trim()}_${(emp.matricule || '').toLowerCase().trim()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map(emp => ({
          ...emp,
          arrivee: emp.pointageEntree || '-',
          depart: emp.pointageSortie || '-',
        }));

      const dataToExport = formattedData.map(emp => ({
        // 'Superviseur': user?.name || 'Non spécifié',
        'Nom complet': emp.name,
        'Matricule': emp.matricule,
        'Affaire N°': emp.affaireNumero || '-',
        'Client': emp.client || '-',
        'Site': emp.site || '-',
        'Heures Planifiées': emp.plannedHours || 0,
        'Heure d\'Entrée': emp.arrivee,
        'Heure de Sortie': emp.depart,
        'Statut': emp.status,
        'Hrs travailées': formatHours(emp.totHrsTravaillees),
        'Jrs travaillés': formatDays(emp.nbrJrsTravaillees),
        'Jrs Absence': formatDays(emp.nbrJrsAbsence),
        'Hrs Dimanche': formatHours(emp.totHrsDimanche),
        'Jrs Fériés': formatDays(emp.nbrJrsFeries),
        'Jrs Fériés Trav.': formatDays(emp.nbrJrsFeriesTravailes),
        'Jrs Congés': formatDays(emp.nbrJrsConges),
        'Jrs Dépl. Maroc': formatDays(emp.nbrJrsDeplacementsMaroc),
        'Jrs Paniers': formatDays(emp.nbrJrsPaniers),
        'Jrs Détente': formatDays(emp.nbrJrsDetente),
        'Jrs Dépl. Expat': formatDays(emp.nbrJrsDeplacementsExpatrie),
        'Jrs Récup': formatDays(emp.nbrJrsRecuperation),
        'Jrs Maladie': formatDays(emp.nbrJrsMaladie),
        'Chantier/Atelier': emp.chantierAtelier || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rapport Journalier");
      XLSX.writeFile(workbook, "Rapport_Journalier.xlsx");

      // Notify ADMIN that data is ready
      addNotification(
        `Rapport de pointage validé et transmis par le Superviseur ${user.name} (${dataToExport.length} employés).`,
        'success',
        dataToExport,
        'admin' // Target Admin
      );

      alert("Rapport transmis à l'Admin avec succès.");

    } catch (error) {
      console.error("Error exporting reports:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateProgress = async (empId, progress) => {
    try {
      const emp = reports.find(e => e.id === empId);
      const response = await fetch(`${API_EMPLOYEE}/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emp, projectProgress: parseInt(progress, 10) })
      });

      if (response.ok) {
        fetchReports();
        if (activeActivityModal && activeActivityModal.id === empId) {
          setActiveActivityModal(prev => ({ ...prev, projectProgress: parseInt(progress, 10) }));
        }
      } else {
        alert("Erreur lors de la mise à jour de la progression");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      alert("Erreur serveur");
    }
  };

  const handleDeleteAll = async () => {
    if (reports.length === 0) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer TOUS les ${reports.length} employés de votre liste ? Cette action est irréversible.`)) {
      try {
        setLoading(true);
        // Delete each employee one by one as the current API supports single deletes
        await Promise.all(reports.map(emp =>
          fetch(`${API_EMPLOYEE}/employees/${emp.id}`, { method: 'DELETE' })
        ));

        // Refresh the list after all deletions are done
        fetchReports();
      } catch (error) {
        console.error("Error deleting all employees:", error);
        alert("Une erreur est survenue lors de la suppression.");
      } finally {
        setLoading(false);
      }
    }
  };

  const projectStats = useMemo(() => {
    const groups = {};
    reports.forEach(emp => {
      const key = emp.affaireNumero || 'Sans Affaire';
      if (!groups[key]) {
        groups[key] = {
          name: key,
          progress: emp.projectProgress || 0,
          employeeCount: 0,
          presentCount: 0
        };
      }
      groups[key].employeeCount++;
      if (emp.status === 'Présent' || emp.status === 'Sortie') groups[key].presentCount++;
      if ((emp.projectProgress || 0) > groups[key].progress) groups[key].progress = emp.projectProgress;
    });
    return Object.values(groups);
  }, [reports]);

  const stats = {
    total: reports.length,
    present: reports.filter(r => r.status === 'Présent' || r.status === 'Sortie').length,
    absent: reports.filter(r => r.status === 'Absent').length
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reports.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end === totalPages) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="superviseur-container">
      <div className="view-header">
        <h1>Espace Superviseur</h1>
      </div>

      <div className="superviseur-stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FaUsers /></div>
          <div className="stat-content">
            <span className="stat-label">Total Employés</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaUserCheck /></div>
          <div className="stat-content">
            <span className="stat-label">Présents</span>
            <span className="stat-value">{stats.present}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FaUserTimes /></div>
          <div className="stat-content">
            <span className="stat-label">Absents</span>
            <span className="stat-value">{stats.absent}</span>
          </div>
        </div>
      </div>

      {/* <div className="projects-summary-section">
        <div className="section-title">
          <h2><FaHardHat style={{ marginRight: '10px' }} /> Mes Projets & Avancement</h2>
        </div>
        <div className="projects-grid">
          {projectStats.length === 0 ? (
            <div className="empty-projects">Aucun projet actif.</div>
          ) : (
            projectStats.map(project => (
              <div key={project.name} className="project-summary-card">
                <div className="project-header">
                  <span className="project-name">Projet #{project.name}</span>
                  <span className="project-badge">{project.employeeCount} employés</span>
                </div>
                <div className="project-progress-area">
                  <div className="progress-info">
                    <span>Avancement</span>
                    <span className="progress-val">{project.progress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${project.progress}%`,
                        background: project.progress > 70 ? '#10b981' : project.progress > 30 ? '#4f46e5' : '#f59e0b'
                      }}
                    ></div>
                  </div>
                </div>
                <div className="project-footer">
                  <span className="presence-info">
                    <strong>{project.presentCount}</strong> présents aujourd'hui
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div> */}

      <div className="card">
        <div className="section-title">
          <h2>Rapport Journalier de Pointage</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={fetchReports} className="refresh-btn">
              <FaSync /> Actualiser
            </button>
            <button
              onClick={handleDeleteAll}
              className="refresh-btn delete-all-btn"
              disabled={reports.length === 0 || loading}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                borderColor: '#fca5a5',
                opacity: (reports.length === 0 || loading) ? 0.5 : 1
              }}
            >
              <FaTrash /> Vider la liste
            </button>
            <button
              onClick={handleExportEmployees}
              className="refresh-btn"
              disabled={reports.length === 0}
              style={{ background: '#f1f5f9', color: '#475569', opacity: reports.length === 0 ? 0.5 : 1, cursor: reports.length === 0 ? 'not-allowed' : 'pointer' }}
            >
              <FaFileExport /> Télécharger Excel
            </button>
            <button
              onClick={handleExportReports}
              className="refresh-btn"
              disabled={reports.length === 0 || isExporting}
              style={{ background: '#10b981', color: 'white', opacity: reports.length === 0 || isExporting ? 0.5 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}
            >
              <FaClipboardList /> {isExporting ? '⏳ Transmission...' : '📊 Transmettre à l\'Admin'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement des rapports...</div>
        ) : (
          <>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Nom de l'Employé</th>
                    <th>Matricule</th>
                    <th>Affaire N°</th>
                    <th>Client</th>
                    <th>Site</th>
                    <th>Heure d'Entrée</th>
                    <th>Heure de Sortie</th>
                    <th style={{ textAlign: 'center' }}>Statut</th>
                    <th style={{ textAlign: 'center' }}>Planifié</th>
                    <th style={{ textAlign: 'center' }}>Détails</th>
                    {/* <th style={{ textAlign: 'center' }}>Tot.Hrs trav.</th>
                    <th style={{ textAlign: 'center' }}>Jrs trav.</th> */}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun rapport disponible.</td>
                    </tr>
                  ) : (
                    currentItems.map((report) => (
                      <tr key={report.id}>
                        <td style={{ fontWeight: 600 }}>{report.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.matricule}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.affaireNumero}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.client}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.site}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.arrivee}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.depart}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${report.status === 'Présent' ? 'badge-success' : 'badge-warning'}`}>
                            {report.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="planned-hours-badge">
                            {report.plannedHours ? `${report.plannedHours}h` : '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => setActiveActivityModal(report)} className="activity-btn-small" title="Voir l'activité">
                            <FaClipboardList />
                          </button>
                        </td>
                        {/* <td style={{ textAlign: 'center', fontWeight: 600, color: '#4f46e5' }}>{formatHours(report.totHrsTravaillees)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#10b981' }}>{formatDays(report.nbrJrsTravaillees)}</td> */}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {reports.length > 0 && (
              <div className="pagination">
                <div className="pagination-info">
                  Affichage de <strong>{indexOfFirstItem + 1}</strong> à <strong>{Math.min(indexOfLastItem, reports.length)}</strong> sur <strong>{reports.length}</strong> employés
                </div>

                <div className="pagination-pills">
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                    className="pagination-pill btn-icon"
                    title="Première page"
                  >
                    <FaAngleDoubleLeft />
                  </button>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-pill btn-icon"
                    title="Précédent"
                  >
                    <FaChevronLeft />
                  </button>

                  <div className="pagination-numbers">
                    {renderPageNumbers().map(number => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                      >
                        {number}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-pill btn-icon"
                    title="Suivant"
                  >
                    <FaChevronRight />
                  </button>
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                    className="pagination-pill btn-icon"
                    title="Dernière page"
                  >
                    <FaAngleDoubleRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {activeActivityModal && (
        <div className="activity-modal-overlay">
          <div className="activity-modal animate-slide-up">
            <div className="modal-header">
              <div>
                <h2><FaClipboardList /> Activité Détaillée</h2>
                <p>{activeActivityModal.name} - {activeActivityModal.matricule}</p>
              </div>
              <button className="close-btn" onClick={() => setActiveActivityModal(null)}><FaTimes /></button>
            </div>

            <div className="modal-content-grid">
              <div className="activity-section">
                <h4><FaCalendarAlt /> Absences & Congés</h4>
                <div className="activity-fields">
                  <div className="num-field">
                    <label>Jrs Absence</label>
                    <input type="number" value={activeActivityModal.nbrJrsAbsence || 0} readOnly disabled />
                  </div>
                  <div className="num-field">
                    <label>Jrs Congés</label>
                    <input type="number" value={activeActivityModal.nbrJrsConges || 0} readOnly disabled />
                  </div>
                  <div className="num-field">
                    <label>Jrs Maladie</label>
                    <input type="number" value={activeActivityModal.nbrJrsMaladie || 0} readOnly disabled />
                  </div>
                  <div className="num-field">
                    <label>Jrs Récup.</label>
                    <input type="number" value={activeActivityModal.nbrJrsRecuperation || 0} readOnly disabled />
                  </div>
                </div>
              </div>

              <div className="activity-section">
                <h4><FaSync /> Heures & Fériés</h4>
                <div className="activity-fields">
                  <div className="num-field">
                    <label>Hrs Dimanche</label>
                    <input type="number" value={activeActivityModal.totHrsDimanche || 0} readOnly disabled />
                  </div>
                  <div className="num-field">
                    <label>Jrs Fériés</label>
                    <input type="number" value={activeActivityModal.nbrJrsFeries || 0} readOnly disabled />
                  </div>
                  <div className="num-field">
                    <label>Jrs Fériés Trav.</label>
                    <input type="number" value={activeActivityModal.nbrJrsFeriesTravailes || 0} readOnly disabled />
                  </div>
                </div>
              </div>

              <div className="activity-section">
                <h4><FaHardHat /> Logistique & Terrain</h4>
                <div className="activity-fields">
                  <div className="num-field">
                    <label>Jrs Dépl. Maroc</label>
                    <input type="number" value={activeActivityModal.nbrJrsDeplacementsMaroc || 0} readOnly disabled />
                  </div>
                  <div className="num-field">
                    <label>Jrs Dépl. Expat</label>
                    <input type="number" value={activeActivityModal.nbrJrsDeplacementsExpatrie || 0} readOnly disabled />
                  </div>
                  <div className="num-field">
                    <label>Jrs Paniers</label>
                    <input type="number" value={activeActivityModal.nbrJrsPaniers || 0} readOnly disabled />
                  </div>
                  <div className="num-field">
                    <label>Jrs Détente</label>
                    <input type="number" value={activeActivityModal.nbrJrsDetente || 0} readOnly disabled />
                  </div>
                </div>
              </div>

              <div className="activity-section">
                <h4 style={{ color: '#4f46e5' }}><FaSync /> Avancement Projet (%)</h4>
                <div className="activity-fields">
                  <div className="num-field" style={{ flex: '1' }}>
                    <label>Progression Actuelle</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={activeActivityModal.projectProgress || 0}
                        onChange={(e) => setEditingProgress(e.target.value)}
                        style={{ borderColor: '#818cf8', fontWeight: 'bold' }}
                      />
                      <button
                        className="save-btn-small"
                        onClick={() => handleUpdateProgress(activeActivityModal.id, editingProgress || activeActivityModal.projectProgress || 0)}
                        style={{
                          padding: '0.6rem 1rem',
                          background: '#4f46e5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontWeight: '600'
                        }}
                      >
                        <FaSave /> Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="activity-section-full">
                <div className="text-field">
                  <label>Chantier / Atelier</label>
                  <input type="text" value={activeActivityModal.chantierAtelier || '-'} readOnly disabled />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="save-btn-alt" onClick={() => setActiveActivityModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperviseurPage;
