import React, { useState, useEffect } from 'react'
import './App.css'
import logoImg from './assets/images/logos/ca2e-removebg-preview.png'
import Login from './components//login/Login'
import ResetPassword from './components/login/ResetPassword'
import Admin from './components/Admin/Admin'
import Superviseur from './components/Gestionnaire/superviseur/Superviseur'
import Responsable from './components/Gestionnaire/responsable/Responsable'
import Notification from './components/Notification/Notification'
import Parametre from './components/Parametre/Parametre'

function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showResetPassword, setShowResetPassword] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setShowResetPassword(true);
    }
    // No longer checking localStorage on startup to ensure login page is always first
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleResetComplete = () => {
    setShowResetPassword(false);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  if (showResetPassword) {
    return <ResetPassword onResetComplete={handleResetComplete} />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logoImg} alt="Logo" className="logo-icon" style={{ height: '66px', width: 'auto', objectFit: 'contain' }} />
          {/* <span>Pointage Manager</span> */}
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <span></span>
            <span>Dashboard</span>
          </div>
          {/* <div className="nav-item">
            <span>👥</span>
            <span>Équipes</span>
          </div>
          <div className="nav-item">
            <span>📅</span>
            <span>Rapports</span>
          </div> */}
          {user.role === 'admin' && (
            <div 
              className={`nav-item ${currentPage === 'parametre' ? 'active' : ''}`}
              onClick={() => setCurrentPage('parametre')}
              style={{ cursor: 'pointer' }}
            >
              <span>⚙️</span>
              <span>Paramètres</span>
            </div>
          )}
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
          {currentPage === 'parametre' && user.role === 'admin' ? (
            <Parametre />
          ) : (
            <>
              {user.role === 'admin' && <Admin />}
              {user.role === 'superviseur' && <Superviseur user={user} />}
              {user.role === 'Responsable' && <Responsable user={user} />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
