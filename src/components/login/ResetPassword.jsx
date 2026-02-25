import React, { useState, useEffect } from 'react';
import './ResetPassword.css';
import logoImg from '../../assets/images/logos/ca2e-removebg-preview.png';

const ResetPassword = ({ onResetComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const API_URL = import.meta.env.VITE_APP_API_BASE_URL;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (!tokenFromUrl) {
      setError('Token de réinitialisation manquant. Veuillez vérifier le lien dans votre e-mail.');
    } else {
      setToken(tokenFromUrl);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      if (response.ok) {
        setSuccess('Mot de passe réinitialisé avec succès. Redirection vers la connexion...');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onResetComplete();
        }, 2000);
      } else if (response.status === 400) {
        setError('Token invalide ou expiré. Veuillez demander une nouvelle réinitialisation.');
      } else {
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Erreur lors de la réinitialisation du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="reset-wrapper">
        <div className="reset-card">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-wrapper">
      <div className="reset-card">
        <div className="login-logo">
          <img src={logoImg} alt="Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <h2>Réinitialiser le mot de passe</h2>
        {error && !success && <p className="reset-error">{error}</p>}
        {success && <p className="reset-success">{success}</p>}
        
        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="reset-group">
              <label>Nouveau mot de passe</label>
              <div className="password-input-wrapper">
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="reset-group">
              <label>Confirmer le mot de passe</label>
              <div className="password-input-wrapper">
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="reset-submit"
              disabled={loading}
            >
              {loading ? 'Traitement...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
