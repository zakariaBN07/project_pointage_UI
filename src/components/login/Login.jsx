import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ name: '', password: '' });
  const [error, setError] = useState('');
  const API_URL = import.meta.env.VITE_APP_API_BASE_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Handle Admin login (hardcoded)
    if (credentials.name === 'admin' && credentials.password === 'admin123') {
      onLogin({ name: 'admin', role: 'admin' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const user = await response.json();
        onLogin(user);
      } else if (response.status === 401) {
        setError('Identifiants invalides.');
      } else {
        setError('Erreur serveur.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur lors de la connexion.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Système de Pointage - Connexion</h2>
        <form onSubmit={handleSubmit}>
          <div className="login-group">
            <label>Nom / Utilisateur</label>
            <input 
              type="text" 
              name="name" 
              value={credentials.name} 
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