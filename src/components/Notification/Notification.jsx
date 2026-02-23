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

      {selectedNotification && selectedNotification.data && (
        <div className="excel-preview-modal">
          <div className="excel-preview-content">
            <div className="excel-preview-header">
              <div>
                <h2>📊 Détail de l'Exportation</h2>
                <p className="excel-preview-subtitle">{selectedNotification.message}</p>
              </div>
              <button 
                className="close-btn"
                onClick={() => setSelectedNotification(null)}
              >
                ✕
              </button>
            </div>
            <div className="excel-preview-table">
              <table>
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
            <div className="excel-preview-footer">
              <p>Total: {selectedNotification.data.length} employé(s)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
