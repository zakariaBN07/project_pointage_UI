import React, { useState } from 'react';
import Historique from '../components/History/Historique';
import './Settings.css';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('historique');

  return (
    <div className="parametre-container">
      <div className="parametre-sidebar">
        <h2>Paramètres</h2>
        <nav className="parametre-nav">
          <button
            className={`parametre-nav-item ${activeTab === 'historique' ? 'active' : ''}`}
            onClick={() => setActiveTab('historique')}
          >
            <span>📜</span>
            <span>Historique</span>
          </button>
        </nav>
      </div>

      <div className="parametre-content">
        {activeTab === 'historique' && <Historique />}
      </div>
    </div>
  );
};

export default SettingsPage;
