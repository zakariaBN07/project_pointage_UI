import React, { useContext, useState } from 'react';
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

  const handleUploadToAdmin = async () => {
    if (!selectedNotification || !selectedNotification.data || isUploading) return;

    if (!window.confirm(`Voulez-vous vraiment transmettre ces ${selectedNotification.data.length} pointages à l'Admin ? Cela mettra à jour la vue globale.`)) {
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
              totalHoursWorked: row['Hrs travailées'] || 0,
              daysWorked: row['Jrs travaillés'] || 0,
              affaireNumero: row['Affaire N°'] || '-',
              client: row['Client'] || '-',
              site: row['Site'] || '-'
            })
          });
          successCount++;
        }
      }

      alert(`Succès ! ${successCount} pointages ont été transmis à l'Admin.`);

      // Notify Admin that the Superviseur has uploaded the data
      addNotification(
        `Superviseur ${user.name} a validé et transmis le rapport de pointage final (${successCount} employé(s)) à la vue globale.`,
        'success',
        selectedNotification.data,
        'admin' // Target Admin
      );

      dismissNotification(selectedNotification.id);
      setSelectedNotification(null);
    } catch (error) {
      console.error("Error uploading to admin:", error);
      alert("Une erreur est survenue lors de la transmission.");
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

      {isOpen && (
        <div className="notification-modal-overlay">
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
                        <h3>
                          {notification.recipientRole === 'admin' ?
                            notification.message :
                            (notification.data && notification.data[0] ? (() => {
                              const sup = notification.data[0]['Superviseur'] || '';
                              const sig = notification.data[0]['Siège'] || '';
                              return (
                                <>
                                  <strong>{user.name}</strong> — Rapport de pointage final ({notification.data.length} employé(s))
                                </>
                              );
                            })() : notification.message)
                          }
                        </h3>
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
                          <span className="card-action-badge">📊 {user.role === 'superviseur' ? 'Vérifier & Transmettre' : 'Voir détail'}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedNotification && selectedNotification.data && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 11000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedNotification(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '2rem' }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: '0.25rem' }}>📊 Détail de l'Exportation</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{selectedNotification.message}</p>
              </div>

              {user?.role === 'superviseur' && (
                <button
                  onClick={handleUploadToAdmin}
                  disabled={isUploading}
                  style={{
                    backgroundColor: isUploading ? '#cbd5e1' : '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  {isUploading ? '⏳ Transmission...' : '📤 Transmettre à l\'Admin'}
                </button>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    {selectedNotification.data.length > 0 && Object.keys(selectedNotification.data[0]).map((key) => (
                      <th key={key} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedNotification.data.map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} style={{ padding: '0.75rem' }}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: '1rem', color: '#999', textAlign: 'right' }}>
              Total: {selectedNotification.data.length} employé(s)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
