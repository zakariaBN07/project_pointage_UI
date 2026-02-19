import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const API_URL = import.meta.env.VITE_APP_API_BASE_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Handle Admin login (hardcoded for now as requested or common practice)
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      onLogin({ username: 'admin', role: 'admin' });
      return;
    }

    try {
      // Fetch employees to find the one with matching matricule (username) and password
      const response = await fetch(`${API_URL}/employees`);
      if (response.ok) {
        const employees = await response.json();
        const user = employees.find(emp => emp.matricule === credentials.username && emp.password === credentials.password);
        
        if (user && (user.role === 'superviseur' || user.role === 'Responsable')) {
          onLogin({ ...user });
        } else {
          setError('Identifiants invalides ou accès non autorisé.');
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Erreur lors de la connexion au serveur.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Système de Pointage - Connexion</h2>
        <form onSubmit={handleSubmit}>
          <div className="login-group">
            <label>Matricule / Utilisateur</label>
            <input 
              type="text" 
              name="username" 
              value={credentials.username} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="login-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              name="password" 
              value={credentials.password} 
              onChange={handleChange} 
              required 
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-submit">Se connecter</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
