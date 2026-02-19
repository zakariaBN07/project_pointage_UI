import React, { useState } from 'react'
import './App.css'
import Admin from './components/Admin/Admin'
import Superviseur from './components/superviseur/Superviseur'
import Responsable from './components/Responsable'

function App() {
  const [view, setView] = useState('admin')

  return (
    <div className="app-main">
      <nav className="app-nav" style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <button onClick={() => setView('admin')} style={{ marginRight: '1rem', cursor: 'pointer', padding: '0.5rem 1rem' }}>Admin</button>
        <button onClick={() => setView('superviseur')} style={{ marginRight: '1rem', cursor: 'pointer', padding: '0.5rem 1rem' }}>Superviseur</button>
        {/* <button onClick={() => setView('responsable')} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }}>Responsable</button> */}
      </nav>

      <main>
        {view === 'admin' && <Admin />}
        {view === 'superviseur' && <Superviseur />}
        {view === 'responsable' && <Responsable />}
      </main>
    </div>
  )
}

export default App
