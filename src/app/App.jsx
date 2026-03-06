import React, { useState, useEffect } from 'react'
import './App.css'
import logoImg from '../assets/images/logos/ca2e-removebg-preview.png'
import LoginPage from '../features/auth/pages/LoginPage'
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage'
import AdminPage from '../features/dashboard/pages/AdminPage'
import SuperviseurPage from '../features/employees/pages/Superviseurs/SuperviseurPage'
import ResponsablePage from '../features/employees/pages/Responsables/ResponsablePage'
import EmployeePage from '../features/employees/pages/EmployeePage'
import NotificationPanel from '../features/notifications/components/NotificationBell'
import SettingsPage from '../features/settings/pages/SettingsPage'
import GestionnairesPage from '../features/employees/pages/GestionnairesPage'
import VueGlobalePage from '../features/employees/pages/VueGlobalePage'
import ProjectsListPage from '../features/projects/pages/ProjectsListPage'
import CreateProjectPage from '../features/projects/pages/CreateProjectPage'
import ProjectDetailPage from '../features/projects/pages/ProjectDetailPage'
import { MdHome, MdPeople, MdEventNote, MdSettings, MdAssignment } from "react-icons/md";


function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)

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
    return <ResetPasswordPage onResetComplete={handleResetComplete} />;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
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

          {/* Projects - Available for Responsable */}
          {user.role?.toLowerCase() === 'responsable' && (
            <div
              className={`nav-item ${currentPage === 'projects' ? 'active' : ''}`}
              onClick={() => setCurrentPage('projects')}
              style={{ cursor: 'pointer' }}
            >
              <MdAssignment size={20} />
              <span>Projets</span>
            </div>
          )}

          {/* Espace Employé */}
          {user.role?.toLowerCase() === 'employé' && (
            <div
              className={`nav-item ${currentPage === 'employee' ? 'active' : ''}`}
              onClick={() => setCurrentPage('employee')}
              style={{ cursor: 'pointer' }}
            >
              <MdPeople size={20} />
              <span>Espace Employé</span>
            </div>
          )}

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
              <NotificationPanel user={user} />
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
          {currentPage === 'projects' && user.role?.toLowerCase() === 'responsable' ? (
            <ProjectsListPage
              setCurrentPage={setCurrentPage}
              onSelectProject={(projectId) => {
                setSelectedProjectId(projectId)
                setCurrentPage('project-detail')
              }}
            />
          ) : currentPage === 'create-project' && user.role?.toLowerCase() === 'responsable' ? (
            <CreateProjectPage setCurrentPage={setCurrentPage} />
          ) : currentPage === 'project-detail' && user.role?.toLowerCase() === 'responsable' && selectedProjectId ? (
            <ProjectDetailPage
              projectId={selectedProjectId}
              onBack={() => setCurrentPage('projects')}
            />
          ) : currentPage === 'parametre' && user.role === 'admin' ? (
            <SettingsPage />
          ) : currentPage === 'lists' && user.role === 'admin' ? (
            <GestionnairesPage />
          ) : currentPage === 'pointage' && user.role === 'admin' ? (
            <VueGlobalePage />
          ) : (
            <>
              {user.role === 'admin' && <AdminPage />}
              {user.role === 'superviseur' && <SuperviseurPage user={user} />}
              {user.role === 'Responsable' && <ResponsablePage user={user} />}
              {user.role?.toLowerCase() === 'employé' && <EmployeePage user={user} />}
            </>
          )}
        </main>
      </div>
    </div >

  )
}

export default App
