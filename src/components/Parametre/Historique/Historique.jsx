import React, { useContext, useState } from 'react';
import { NotificationContext } from '../../../context/NotificationContext';
import './Historique.css';

const Historique = () => {
  const { history, clearHistory, deleteFromHistory } = useContext(NotificationContext);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState('all');

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Date inconnue';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds <= 5) return 'À l\'instant';
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

  const FILTERS = [
    { key: 'all', label: 'Tous', cls: '' },
    { key: 'success', label: 'Succès', cls: 'success' },
    { key: 'warning', label: 'Avertissements', cls: 'warning' },
    { key: 'error', label: 'Erreurs', cls: 'error' },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════
          MAIN CONTAINER
      ═══════════════════════════════════════════ */}
      <div className="historique-container">

        {/* ── Header ───────────────────────────────── */}
        <div className="historique-header">
          <h2>📜 Historique des Notifications</h2>
          {history.length > 0 && (
            <button onClick={handleClearHistory} className="clear-history-btn">
              🗑️ Effacer l'historique
            </button>
          )}
        </div>

        {/* ── Empty state ───────────────────────────── */}
        {history.length === 0 ? (
          <div className="hist-empty">
            <p>Aucune notification dans l'historique</p>
          </div>
        ) : (
          <>
            {/* ── Filter tab bar ───────────────────── */}
            <div className="hist-filter-bar">
              {FILTERS.map(({ key, label, cls }) => {
                const count = key === 'all' ? history.length : history.filter(n => n.type === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`hist-filter-btn ${cls} ${filter === key ? 'active' : ''}`}
                  >
                    {label} <span style={{ opacity: 0.7 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* ── Notification list ─────────────────── */}
            <div className="hist-list">
              {filteredHistory.length === 0 ? (
                <div className="hist-empty">
                  <p>Aucune notification de ce type</p>
                </div>
              ) : (
                filteredHistory.map((notification) => (
                  <div
                    key={notification.id}
                    className={`hist-card type-${notification.type} ${notification.data ? 'clickable' : ''}`}
                    onClick={() => notification.data && setSelectedNotification(notification)}
                  >
                    {/* Top row: message + meta */}
                    <div className="hist-card-top">
                      <h3 className="hist-card-message">{notification.message}</h3>
                      <div className="hist-card-meta">
                        <span className="hist-time-badge">{getTimeAgo(notification.timestamp)}</span>
                        <button
                          className="hist-delete-btn"
                          title="Supprimer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Supprimer cette notification ?')) {
                              deleteFromHistory(notification.id);
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Footer row: type badge + detail link */}
                    <div className="hist-card-footer">
                      <span className={`hist-type-badge ${notification.type}`}>
                        {notification.type}
                      </span>
                      {notification.data && (
                        <span className="hist-detail-link">📊 Voir détail</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          MODAL — rendered OUTSIDE .historique-container
          so that position:fixed covers the full viewport
          and is never clipped by the container's stacking context.
      ═══════════════════════════════════════════ */}
      {selectedNotification && selectedNotification.data && (
        <div className="hist-modal-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="hist-modal" onClick={(e) => e.stopPropagation()}>
            <button className="hist-modal-close" onClick={() => setSelectedNotification(null)}>✕</button>
            <h2>📊 Détail de l'Exportation</h2>
            <span className="hist-modal-subtitle">{selectedNotification.message}</span>

            <div className="hist-detail-table-wrap">
              <table className="hist-detail-table">
                <thead>
                  <tr>
                    {selectedNotification.data.length > 0 &&
                      Object.keys(selectedNotification.data[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))
                    }
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

            <div className="hist-modal-footer">
              Total : <strong>{selectedNotification.data.length}</strong> employé(s)
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Historique;
