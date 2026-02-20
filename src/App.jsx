import React, { useState, useEffect } from 'react'
import './App.css'
import Login from './components//login/Login'
import Admin from './components/Admin/Admin'
import Superviseur from './components/superviseur/Superviseur'
import Responsable from './components/Responsable'
import Notification from './components/Notification'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-icon">📊</span>
          <span>Pointage Manager</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span>🏠</span>
            <span>Dashboard</span>
          </div>
          <div className="nav-item">
            <span>👥</span>
            <span>Équipes</span>
          </div>
          <div className="nav-item">
            <span>📅</span>
            <span>Rapports</span>
          </div>
          <div className="nav-item">
            <span>⚙️</span>
            <span>Paramètres</span>
          </div>
        </nav>
        {user.role === 'admin' && (
          <div className="sidebar-notifications">
            <Notification />
          </div>
        )}
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="user-profile">
            <div className="user-info">
              <span className="user-name">{user.name || user.username}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Déconnexion
            </button>
          </div>
        </header>

        <main className="content-body">
          {user.role === 'admin' && <Admin />}
          {user.role === 'superviseur' && <Superviseur user={user} />}
          {user.role === 'Responsable' && <Responsable user={user} />}
        </main>
      </div>
    </div>
  )
}

export default App
