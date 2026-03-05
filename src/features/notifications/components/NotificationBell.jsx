import React, { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { NotificationContext } from '../NotificationContext';
import './Notification.css';
import { FaBell, FaRegBell } from "react-icons/fa";

const NotificationPanel = ({ user }) => {
  const { notifications, dismissNotification, clearAll, addNotification } = useContext(NotificationContext);
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;

  // Filter notifications based on user role and specific recipient ID
  const visibleNotifications = notifications.filter(n => {
    if (n.recipientRole !== user.role) return false;
    // If targeted to a specific user ID, only show if it matches
    if (n.recipientId && n.recipientId !== user.id) return false;
    return true;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return `Il y a ${Math.floor(seconds / 86400)}j`;
  };

  const handleImportToSupervisor = async () => {
    if (!selectedNotification || !selectedNotification.data || isUploading) return;

    if (!window.confirm(`Voulez-vous importer ces ${selectedNotification.data.length} employés dans votre liste de pointage ?`)) {
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch(`${API_EMPLOYEE}/employees`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des employés");
      const dbEmployees = await response.json();

      let successCount = 0;
      for (const row of selectedNotification.data) {
        const matricule = String(row['Matricule'] || '').trim();
        const empInDb = dbEmployees.find(e => String(e.matricule || '').trim() === matricule);

        if (empInDb) {
          await fetch(`${API_EMPLOYEE}/employees/${empInDb.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...empInDb,
              pointageEntree: row['Pointage d\'entrée'] || '-',
              pointageSortie: row['Pointage de sortie'] || '-',
              status: row['Statut'] || 'En attente',
              totHrsTravaillees: (typeof row['Hrs travailées'] === 'string')
                ? parseFloat(row['Hrs travailées'].replace('h', ''))
                : (row['Hrs travailées'] || 0),
              nbrJrsTravaillees: row['Jrs travaillés'] || 0,
              affaireNumero: row['Affaire N°'] || '-',
              client: row['Client'] || '-',
              site: row['Site'] || '-',
              plannedHours: row['Planned Hours'] || row['Heures Planifiées'] || 0,
              supervisorId: user.id // Assign to current supervisor
            })
          });
          successCount++;
        }
      }

      alert(`Importation terminée : ${successCount} employé(s) ajoutés à votre liste.`);
      dismissNotification(selectedNotification.id);
      setSelectedNotification(null);
    } catch (error) {
      console.error("Error importing to supervisor:", error);
      alert("Une erreur est survenue lors de l'importation.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="notification-widget">
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <span className="bell-icon">
          {visibleNotifications.length > 0 ? <FaBell /> : <FaRegBell />}
        </span>
        {visibleNotifications.length > 0 && (
          <span className="notification-badge">{visibleNotifications.length}</span>
        )}
      </button>

      {isOpen && createPortal(
        <div className="notification-modal-overlay" role="dialog" aria-modal="true">
          <div className="notification-modal">
            <div className="notification-modal-header">
              <h2>📬 Notifications</h2>
              <button
                className="notification-modal-close"
                onClick={() => setIsOpen(false)}
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="notification-modal-toolbar">
              {visibleNotifications.length > 0 && (
                <button className="clear-btn" onClick={clearAll}>
                  🗑️ Effacer tout
                </button>
              )}
            </div>

            <div className="notification-modal-content">
              {visibleNotifications.length === 0 ? (
                <div className="empty-notifications-large">
                  <span>✓</span>
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="notifications-grid">
                  {visibleNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-card notification-${notification.type} ${notification.data ? 'has-action' : ''}`}
                      onClick={() => notification.data && setSelectedNotification(notification)}
                    >
                      <div className="notification-card-header">
                        <h3>{notification.message}</h3>
                        <button
                          className="card-dismiss-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          title="Fermer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="notification-card-footer">
                        <span className="card-time">{getTimeAgo(notification.timestamp)}</span>
                        {notification.data && (
                          <span className="card-action-badge">📊 {user.role === 'superviseur' ? 'Vérifier & Importer' : 'Voir détail'}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedNotification && selectedNotification.data && createPortal(
        <div className="notification-detail-overlay" onClick={() => setSelectedNotification(null)} role="dialog" aria-modal="true">
          <div className="notification-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div className="detail-modal-header-info">
                <h2>📊 Détail de l'Exportation</h2>
                <p>{selectedNotification.message}</p>
              </div>
              <button
                className="detail-modal-close"
                onClick={() => setSelectedNotification(null)}
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="detail-modal-content">
              <div className="detail-table-container">
                <table className="detail-table">
                  <thead>
                    <tr>
                      {selectedNotification.data.length > 0 && Object.keys(selectedNotification.data[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedNotification.data.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="detail-modal-footer">
              <span className="detail-total-count">
                Total: {selectedNotification.data.length} employé(s)
              </span>

              {user?.role === 'superviseur' && (
                <button
                  className="transmit-btn"
                  onClick={handleImportToSupervisor}
                  disabled={isUploading}
                >
                  {isUploading ? '⏳ Importation...' : '📥 Importer vers ma liste'}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationPanel;
