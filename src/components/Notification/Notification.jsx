import React, { useContext, useState } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import './Notification.css';

const Notification = () => {
  const { notifications, dismissNotification, clearAll } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return `Il y a ${Math.floor(seconds / 86400)}j`;
  };

  return (
    <div className="notification-widget">
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
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
              {notifications.length > 0 && (
                <button className="clear-btn" onClick={clearAll}>
                  🗑️ Effacer tout
                </button>
              )}
            </div>

            <div className="notification-modal-content">
              {notifications.length === 0 ? (
                <div className="empty-notifications-large">
                  <span>✓</span>
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="notifications-grid">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`notification-card notification-${notification.type} ${notification.data ? 'has-action' : ''}`}
                      onClick={() => notification.data && setSelectedNotification(notification)}
                    >
                      <div className="notification-card-header">
                        <h3>
                          {notification.data && notification.data[0] ? (() => {
                            const sup = notification.data[0]['Superviseur'] || '';
                            const sig = notification.data[0]['Siège'] || '';
                            return (
                              <>
                                Superviseur <strong>{sup}</strong> — Siège <strong>{sig}</strong> a exporté la liste de pointage final ({notification.data.length} employé(s))
                              </>
                            );
                          })() : notification.message}
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
                          <span className="card-action-badge">📊 Voir détail</span>
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

      {selectedNotification && selectedNotification.data && (() => {
        const firstRow = selectedNotification.data[0] || {};
        const excludedKeys = new Set(['Superviseur', 'Siège']);
        const tableKeys = Object.keys(firstRow).filter(k => !excludedKeys.has(k));
        return (
          <div className="excel-preview-modal">
            <div className="excel-preview-content" style={{ position: 'relative', padding: '2rem', backgroundColor: 'white', borderRadius: '8px' }}>
              <button 
                className="close-btn"
                onClick={() => setSelectedNotification(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>📊 Détail de l'Exportation</h2>
              <p style={{ color: '#999', marginBottom: '1rem' }}>
                {selectedNotification.message}
              </p>
              <div className="excel-preview-table" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                      {tableKeys.map((key) => (
                        <th key={key} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedNotification.data.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        {tableKeys.map((key, i) => (
                          <td key={i} style={{ padding: '0.75rem' }}>{row[key]}</td>
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
        );
      })()}
    </div>
  );
};

export default Notification;
