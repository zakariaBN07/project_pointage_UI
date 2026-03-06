import React, { createContext, useState, useCallback, useEffect } from 'react';

export const NotificationContext = createContext();

const STORAGE_KEY = 'notifications';
const HISTORY_KEY = 'notifications_history';

// Save notifications to history with deduplication
const saveToHistorique = (notifications) => {
  try {
    const storedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const newHistory = [
      ...notifications.map(n => ({
        ...n,
        timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
      })),
      ...storedHistory,
    ].filter((v, i, a) => a.findIndex(n => n.id === v.id) === i); // Remove duplicates by id

    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (err) {
    console.error('Error saving to notification history:', err);
    return [];
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(n => ({
          ...n,
          timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
        }));
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
    return [];
  });
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        const historyWithDates = parsed.map(n => ({
          ...n,
          timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
        }));
        setHistory(historyWithDates);
      } catch (err) {
        console.error('Error loading history from localStorage:', err);
      }
    }

    // Move active notifications to history before page unload/refresh
    const handleBeforeUnload = () => {
      const currentNotifications = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (currentNotifications.length > 0) {
        const updatedHistory = saveToHistorique(currentNotifications);
        localStorage.removeItem(STORAGE_KEY);
        setHistory(updatedHistory);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Listen to localStorage changes for cross-tab synchronization
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          const stored = e.newValue;
          if (stored) {
            const parsed = JSON.parse(stored);
            setNotifications(parsed.map(n => ({
              ...n,
              timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
            })));
          } else {
            setNotifications([]);
          }
        } catch (err) {
          console.error('Error in storage event for notifications:', err);
        }
      } else if (e.key === HISTORY_KEY) {
        try {
          const stored = e.newValue;
          if (stored) {
            const parsed = JSON.parse(stored);
            setHistory(parsed.map(n => ({
              ...n,
              timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
            })));
          } else {
            setHistory([]);
          }
        } catch (err) {
          console.error('Error in storage event for history:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Keep active notifications in localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Add a new notification
  const addNotification = useCallback((message, type = 'info', data = null, recipientRole = 'admin', recipientId = null) => {
    const id = Date.now();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date(),
      data,
      recipientRole,
      recipientId,
    };
    setNotifications(prev => [notification, ...prev]);
    return id;
  }, []);

  // Dismiss a single notification
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => {
      const dismissed = prev.find(n => n.id === id);
      if (dismissed) {
        const updatedHistory = saveToHistorique([dismissed]);
        setHistory(updatedHistory);
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  // Clear all active notifications
  const clearAll = useCallback(() => {
    setNotifications(prev => {
      if (prev.length > 0) {
        const updatedHistory = saveToHistorique(prev);
        setHistory(updatedHistory);
      }
      return [];
    });
  }, []);

  // Clear history completely
  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  // Delete a single notification from history
  const deleteFromHistory = useCallback((id) => {
    setHistory(prev => {
      const updatedHistory = prev.filter(n => n.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      history,
      addNotification,
      dismissNotification,
      clearAll,
      clearHistory,
      deleteFromHistory,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}; 