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
import Liste_des_Gestionnaires from './Lists/Liste_des_Gestionnaires/Liste_des_Gestionnaires'
import Vue_Globale_du_Pointage from './Lists/Liste_vue_globale_du_pointage/Vue_Globale_du_Pointage'
import { MdHome, MdPeople, MdEventNote, MdSettings } from "react-icons/md";

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
          <img
            src={logoImg}
            alt="Logo"
            className="logo-icon"
            style={{ height: '66px', width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
            onClick={() => setCurrentPage('dashboard')}
          />
        </div>
        <nav className="sidebar-nav">
          <div
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <MdHome size={20} />
            <span>Tableau de bord</span>
          </div>

          {user.role === 'admin' && (
            <>
              <div
                className={`nav-item ${currentPage === 'lists' ? 'active' : ''}`}
                onClick={() => setCurrentPage('lists')}
                style={{ cursor: 'pointer' }}
              >
                <MdPeople size={20} />
                <span>Gestionnaires</span>
              </div>
              <div
                className={`nav-item ${currentPage === 'pointage' ? 'active' : ''}`}
                onClick={() => setCurrentPage('pointage')}
                style={{ cursor: 'pointer' }}
              >
                <MdEventNote size={20} />
                <span>Pointages</span>
              </div>
              <div
                className={`nav-item ${currentPage === 'parametre' ? 'active' : ''}`}
                onClick={() => setCurrentPage('parametre')}
                style={{ cursor: 'pointer' }}
              >
                <MdSettings size={20} />
                <span>Paramètres</span>
              </div>
            </>
          )}
        </nav>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-actions">
            {(user.role === 'admin' || user.role === 'superviseur') && (
              <Notification user={user} />
            )}
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{user.name || user.username}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        <main className="content-body">
          {currentPage === 'parametre' && user.role === 'admin' ? (
            <Parametre />
          ) : currentPage === 'lists' && user.role === 'admin' ? (
            <Liste_des_Gestionnaires />
          ) : currentPage === 'pointage' && user.role === 'admin' ? (
            <Vue_Globale_du_Pointage />
          ) : (
            <>
              {user.role === 'admin' && <Admin />}
              {user.role === 'superviseur' && <Superviseur user={user} />}
              {user.role === 'Responsable' && <Responsable user={user} />}
            </>
          )}
        </main>
      </div>
    </div >
  )
}

export default App
