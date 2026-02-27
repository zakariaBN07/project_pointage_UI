import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './Liste_des_Gestionnaires.css';

const Liste_des_Gestionnaires = () => {
  const API_ADMIN = import.meta.env.VITE_APP_API_ADMIN_URL;
  const [gestionnaires, setGestionnaires] = useState([]);
  const [newGestionnaire, setNewGestionnaire] = useState({ name: '', email: '', role: 'superviseur', password: '', siege: '' });
  const [editingId, setEditingId] = useState(null);
  const [editGestionnaire, setEditGestionnaire] = useState({ name: '', role: 'superviseur', password: '', siege: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');

  const fetchGestionnaires = async () => {
    try {
      const response = await fetch(`${API_ADMIN}/gestionnaires`);
      if (response.ok) {
        const data = await response.json();
        const sanitizedData = data.map(({ password, ...rest }) => rest);
        setGestionnaires(sanitizedData);
        return sanitizedData;
      }
    } catch (error) {
      console.error("Error fetching gestionnaires:", error);
    }
    return [];
  };

  useEffect(() => {
    fetchGestionnaires();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(''), 8000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const filteredGestionnaires = gestionnaires.filter(g => {
    const isBaseRole = g.role.toLowerCase() === 'superviseur' || g.role.toLowerCase() === 'responsable';
    if (!isBaseRole) return false;

    if (roleFilter === 'Tous') return true;
    return g.role.toLowerCase() === roleFilter.toLowerCase();
  });

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewGestionnaire(prev => ({ ...prev, password }));
  };

  const handleAddGestionnaire = async (e) => {
    e.preventDefault();
    if (newGestionnaire.name.trim()) {
      try {
        const payload = {
          name: newGestionnaire.name.trim(),
          email: newGestionnaire.email.trim(),
          role: newGestionnaire.role,
          password: newGestionnaire.password,
          siege: newGestionnaire.role === 'superviseur' ? newGestionnaire.siege : '',
        };
        const response = await fetch(`${API_ADMIN}/gestionnaires`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          let generatedPassword = null;
          try {
            const responseData = await response.json();
            generatedPassword = responseData?.generatedPassword || responseData?.password;
          } catch {
            generatedPassword = null;
          }
          const message = generatedPassword
            ? `Mot de passe généré : ${generatedPassword}`
            : 'Mot de passe généré et communiqué par e-mail.';
          setSuccessMessage(message);
          fetchGestionnaires();
          setNewGestionnaire({ name: '', email: '', role: 'superviseur', password: '', siege: '' });
          setIsAddModalOpen(false);
        }
      } catch (error) {
        console.error("Error adding gestionnaire:", error);
      }
    }
  };

  const handleDeleteGestionnaire = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        const response = await fetch(`${API_ADMIN}/gestionnaires/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchGestionnaires();
        }
      } catch (error) {
        console.error("Error deleting gestionnaire:", error);
      }
    }
  };

  const handleResetPassword = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ? Un nouveau mot de passe lui sera envoyé par e-mail.")) {
      try {
        const response = await fetch(`${API_ADMIN}/gestionnaires/${id}/reset-password`, {
          method: 'POST',
        });
        if (response.ok) {
          setSuccessMessage('Un nouveau mot de passe a été généré et envoyé par e-mail.');
        } else {
          console.error("Failed to reset password");
        }
      } catch (error) {
        console.error("Error resetting password:", error);
      }
    }
  };

  const startEditing = (g) => {
    setEditingId(g.id);
    setEditGestionnaire({ name: g.name, email: g.email, role: g.role, password: g.password || '', siege: g.siege || '' });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditGestionnaire({ ...editGestionnaire, [name]: value });
  };

  const saveEdit = async (id) => {
    const g = gestionnaires.find(e => e.id === id);
    try {
      const payload = { ...g, ...editGestionnaire };
      if (!editGestionnaire.password) {
        delete payload.password;
      }
      const response = await fetch(`${API_ADMIN}/gestionnaires/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        fetchGestionnaires();
        setEditingId(null);
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Error updating gestionnaire:", error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsEditModalOpen(false);
  };

  const handleExportToExcel = () => {
    const dataToExport = filteredGestionnaires.map(({ name, role }) => ({ 'Nom': name, 'Rôle': role }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Superviseurs et Responsables");
    XLSX.writeFile(workbook, "List_Gestionnaires.xlsx");
  };

  const handleImportGestionnaires = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const bstr = event.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      for (const row of data) {
        try {
          await fetch(`${API_ADMIN}/gestionnaires`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: row['Nom'],
              role: row['Rôle'] || 'superviseur',
              email: row['Email'] || '',
              password: row['Mot de passe'] || Math.random().toString(36).slice(-8),
            }),
          });
        } catch (error) {
          console.error("Error importing gestionnaire:", error);
        }
      }
      fetchGestionnaires();
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="liste-gestionnaires-container">
      <div className="admin-header">
        <h1>Gestion des Utilisateurs</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <span>+</span> Ajouter Superviseur / Responsable
        </button>
      </div>

      {successMessage && (
        <div className="success-toast">
          {successMessage}
        </div>
      )}

      <div className="role-filter-tabs">
        {['Tous', 'Superviseur', 'Responsable'].map((role) => (
          <button
            key={role}
            className={`filter-tab ${roleFilter === role ? 'active' : ''}`}
            onClick={() => setRoleFilter(role)}
          >
            {role === 'Tous' ? 'Tous les Utilisateurs' : (role + 's')}
            <span className="count-badge">
              {role === 'Tous'
                ? gestionnaires.filter(g => g.role.toLowerCase() === 'superviseur' || g.role.toLowerCase() === 'responsable').length
                : gestionnaires.filter(g => g.role.toLowerCase() === role.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Liste des Gestionnaires</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImportGestionnaires}
              id="import-gestionnaires"
              style={{ display: 'none' }}
            />
            {gestionnaires.length > 0 && (
              <button onClick={handleExportToExcel} className="btn" style={{ background: '#f1f5f9', color: '#475569' }}>
                📥 Exporter Excel
              </button>
            )}
          </div>
        </div>

        {filteredGestionnaires.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Aucun superviseur ou responsable trouvé.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="gestionnaires-table">
              <thead>
                <tr>
                  <th>Nom complet</th>
                  <th>Rôle</th>
                  <th>Siège</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGestionnaires.map((g) => (
                  <tr key={g.id}>
                    <td><div style={{ fontWeight: 600 }}>{g.name}</div></td>
                    <td>
                      <span className={`role-badge role-${g.role.toLowerCase()}`}>
                        {g.role}
                      </span>
                    </td>
                    <td>
                      {g.role.toLowerCase() === 'superviseur' && g.siege ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{g.siege}</span>
                      ) : (
                        <span style={{ color: 'var(--border-color)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button onClick={() => handleResetPassword(g.id)} className="btn-icon reset" title="Réinitialiser le mot de passe">🔄</button>
                        <button onClick={() => startEditing(g)} className="btn-icon edit" title="Modifier">✏️</button>
                        <button onClick={() => handleDeleteGestionnaire(g.id)} className="btn-icon delete" title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nouvel Utilisateur</h3>
            </div>
            <form onSubmit={handleAddGestionnaire}>
              <div className="form-group">
                <label>Nom Complet</label>
                <input
                  type="text"
                  value={newGestionnaire.name}
                  onChange={(e) => setNewGestionnaire({ ...newGestionnaire, name: e.target.value })}
                  placeholder=""
                  required
                />
              </div>
              <div className="form-group">
                <label>Adresse e-mail</label>
                <input
                  type="email"
                  value={newGestionnaire.email}
                  onChange={(e) => setNewGestionnaire({ ...newGestionnaire, email: e.target.value })}
                  placeholder=""
                  required
                />
              </div>
              <div className="form-group">
                <label>Rôle</label>
                <select
                  value={newGestionnaire.role}
                  onChange={(e) => setNewGestionnaire({ ...newGestionnaire, role: e.target.value, siege: e.target.value !== 'superviseur' ? '' : newGestionnaire.siege })}
                >
                  <option value="superviseur">Superviseur</option>
                  <option value="Responsable">Responsable</option>
                </select>
              </div>
              {newGestionnaire.role === 'superviseur' && (
                <div className="form-group">
                  <label>Siège</label>
                  <input
                    type="text"
                    value={newGestionnaire.siege}
                    onChange={(e) => setNewGestionnaire({ ...newGestionnaire, siege: e.target.value })}
                    placeholder="Ex: Alger, Oran..."
                  />
                </div>
              )}
              <div className="form-group">
                <label>Mot de passe</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="password"
                    value={newGestionnaire.password}
                    onChange={(e) => setNewGestionnaire({ ...newGestionnaire, password: e.target.value })}
                    placeholder="Mot de passe"
                    required
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={generatePassword}
                    style={{ background: '#f1f5f9', whiteSpace: 'nowrap' }}
                  >
                    Générer
                  </button>
                </div>
              </div>
              <p className="form-note">
                Le mot de passe sera envoyé automatiquement à l’utilisateur.
              </p>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn" style={{ background: '#f1f5f9' }}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer l'utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Modifier l'utilisateur</h3>
            </div>
            <div className="form-group">
              <label>Nom Complet</label>
              <input
                type="text"
                name="name"
                value={editGestionnaire.name}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Rôle</label>
              <select
                name="role"
                value={editGestionnaire.role}
                onChange={handleEditChange}
              >
                <option value="superviseur">Superviseur</option>
                <option value="Responsable">Responsable</option>
              </select>
            </div>
            {editGestionnaire.role === 'superviseur' && (
              <div className="form-group">
                <label>Siège</label>
                <input
                  type="text"
                  name="siege"
                  value={editGestionnaire.siege}
                  onChange={handleEditChange}
                  placeholder="Ex: Alger, Oran..."
                />
              </div>
            )}
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <div className="password-input-wrapper">
                <input
                  type="password"
                  name="password"
                  value={editGestionnaire.password}
                  onChange={handleEditChange}
                  placeholder="Laisser vide pour ne pas changer"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={cancelEdit} className="btn" style={{ background: '#f1f5f9' }}>
                Annuler
              </button>
              <button type="button" onClick={() => saveEdit(editingId)} className="btn btn-primary">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Liste_des_Gestionnaires;
