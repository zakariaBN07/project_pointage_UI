import React, { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import Admin from './components/Admin/Admin'
import Superviseur from './components/superviseur/Superviseur'
import Responsable from './components/Responsable'

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
    <div className="app-main">
      <nav className="app-nav" style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ marginRight: '1rem', fontWeight: 'bold' }}>Session: {user.name || user.username} ({user.role})</span>
        </div>
        <button onClick={handleLogout} style={{ cursor: 'pointer', padding: '0.5rem 1rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}>Déconnexion</button>
      </nav>

      <main>
        {user.role === 'admin' && <Admin />}
        {user.role === 'superviseur' && <Superviseur user={user} />}
        {user.role === 'Responsable' && <Responsable user={user} />}
      </main>
    </div>
  )
}

export default App
