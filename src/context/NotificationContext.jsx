import React, { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', data = null) => {
    const id = Date.now();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date(),
      data,
    };
    setNotifications(prev => [notification, ...prev]);
    return id;
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      dismissNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
