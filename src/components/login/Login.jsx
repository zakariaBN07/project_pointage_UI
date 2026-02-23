import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ name: '', password: '' });
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotData, setForgotData] = useState({ username: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const API_URL = import.meta.env.VITE_APP_API_BASE_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotData({ ...forgotData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotData),
      });

      if (response.ok) {
        setSuccess('Un lien de réinitialisation a été envoyé à votre adresse e-mail.');
        setForgotData({ username: '', email: '' });
        setTimeout(() => {
          setForgotPassword(false);
          setSuccess('');
        }, 3000);
      } else if (response.status === 404) {
        setError('Utilisateur ou e-mail non trouvé.');
      } else {
        setError('Erreur serveur.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Erreur lors de la réinitialisation.');
    }
  };

  const toggleForgotPassword = () => {
    setForgotPassword(!forgotPassword);
    setError('');
    setSuccess('');
    setCredentials({ name: '', password: '' });
    setForgotData({ username: '', email: '' });
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {!forgotPassword ? (
          <>
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
            <div className="forgot-link">
              <button 
                type="button" 
                className="forgot-btn"
                onClick={toggleForgotPassword}
              >
                Mot de passe oublié ?
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Réinitialiser le mot de passe</h2>
            <form onSubmit={handleForgotSubmit}>
              <div className="login-group">
                <label>Nom / Utilisateur</label>
                <input 
                  type="text" 
                  name="username" 
                  value={forgotData.username} 
                  onChange={handleForgotChange} 
                  required 
                />
              </div>
              <div className="login-group">
                <label>Adresse e-mail</label>
                <input 
                  type="email" 
                  name="email" 
                  value={forgotData.email} 
                  onChange={handleForgotChange} 
                  required 
                />
              </div>
              {error && <p className="login-error">{error}</p>}
              {success && <p className="login-success">{success}</p>}
              <button type="submit" className="login-submit">Envoyer le lien</button>
            </form>
            <div className="forgot-link">
              <button 
                type="button" 
                className="forgot-btn"
                onClick={toggleForgotPassword}
              >
                Retour à la connexion
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;