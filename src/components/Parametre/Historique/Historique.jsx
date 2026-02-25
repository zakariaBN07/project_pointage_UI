import React, { useContext, useState } from 'react';
import { NotificationContext } from '../../../context/NotificationContext';

const Historique = () => {
  const { history, clearHistory, deleteFromHistory } = useContext(NotificationContext);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState('all');

  const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'Date inconnue';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Date inconnue';
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds <= 5) return 'À l\'instant'; // anything within 5 seconds
  if (seconds < 60) return 'À l\'instant';
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
  return `Il y a ${Math.floor(seconds / 604800)}sem`;
};

  const filteredHistory = filter === 'all' ? history : history.filter(n => n.type === filter);

  const handleClearHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      clearHistory();
    }
  };

  return (
    <div className="historique-container">
      <div className="historique-header">
        <h2>📜 Historique des Notifications</h2>
        {history.length > 0 && (
          <button onClick={handleClearHistory} className="clear-history-btn" style={{ 
            padding: '0.5rem 1rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            🗑️ Effacer l'historique
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#999',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <p>Aucune notification dans l'historique</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filter === 'all' ? '#217346' : '#f1f5f9',
                color: filter === 'all' ? 'white' : '#475569',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: filter === 'all' ? 'bold' : 'normal'
              }}
            >
              Tous ({history.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filter === 'success' ? '#16a34a' : '#f1f5f9',
                color: filter === 'success' ? 'white' : '#475569',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: filter === 'success' ? 'bold' : 'normal'
              }}
            >
              Succès ({history.filter(n => n.type === 'success').length})
            </button>
            <button
              onClick={() => setFilter('warning')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filter === 'warning' ? '#ea580c' : '#f1f5f9',
                color: filter === 'warning' ? 'white' : '#475569',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: filter === 'warning' ? 'bold' : 'normal'
              }}
            >
              Avertissements ({history.filter(n => n.type === 'warning').length})
            </button>
            <button
              onClick={() => setFilter('error')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filter === 'error' ? '#dc2626' : '#f1f5f9',
                color: filter === 'error' ? 'white' : '#475569',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: filter === 'error' ? 'bold' : 'normal'
              }}
            >
              Erreurs ({history.filter(n => n.type === 'error').length})
            </button>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredHistory.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#999',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px'
              }}>
                <p>Aucune notification de ce type</p>
              </div>
            ) : (
              filteredHistory.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '1rem',
                    border: `1px solid ${
                      notification.type === 'success' ? '#dcfce7' :
                      notification.type === 'warning' ? '#fef3c7' :
                      notification.type === 'error' ? '#fee2e2' : '#e2e8f0'
                    }`,
                    backgroundColor: `${
                      notification.type === 'success' ? '#f0fdf4' :
                      notification.type === 'warning' ? '#fffbeb' :
                      notification.type === 'error' ? '#fef2f2' : '#f8fafc'
                    }`,
                    borderRadius: '8px',
                    cursor: notification.data ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => notification.data && setSelectedNotification(notification)}
                  onMouseEnter={(e) => {
                    if (notification.data) {
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{notification.message}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#999',
                        backgroundColor: '#e2e8f0',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {getTimeAgo(notification.timestamp)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Supprimer cette notification ?')) {
                            deleteFromHistory(notification.id);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          fontSize: '1rem'
                        }}
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.85rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}>
                      {notification.type}
                    </span>
                    {notification.data && (
                      <span style={{
                        fontSize: '0.85rem',
                        color: '#0284c7',
                        fontWeight: '500'
                      }}>
                        📊 Voir détail
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
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
          zIndex: 1000
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
            <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>📊 Détail de l'Exportation</h2>
            <p style={{ color: '#999', marginBottom: '1rem' }}>{selectedNotification.message}</p>
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

export default Historique;
