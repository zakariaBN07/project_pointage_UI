import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './Admin.css';

const Admin = () => {
  const API_ADMIN  = import.meta.env.VITE_APP_API_ADMIN_URL;
  const [gestionnaires, setGestionnaires] = useState([]);
  const [importedPointage, setImportedPointage] = useState([]);
  const [newGestionnaire, setNewGestionnaire] = useState({ name: '', role: 'superviseur', password: '' });
  const [editingId, setEditingId] = useState(null);
  const [editGestionnaire, setEditGestionnaire] = useState({ name: '', role: 'superviseur', password: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredGestionnaires = gestionnaires.filter(
    g => g.role.toLowerCase() === 'superviseur' || g.role.toLowerCase() === 'responsable'
  );

  const fetchGestionnaires = async () => {
    try {
      const response = await fetch(`${API_ADMIN}/gestionnaires`);
      if (response.ok) {
        const data = await response.json();
        setGestionnaires(data);
      }
    } catch (error) {
      console.error("Error fetching gestionnaires:", error);
    }
  };

  useEffect(() => {
    fetchGestionnaires();
  }, []);

  const handleAddGestionnaire = async (e) => {
    e.preventDefault();
    if (newGestionnaire.name.trim()) {
      try {
        const response = await fetch(`${API_ADMIN}/gestionnaires`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGestionnaire),
        });
        if (response.ok) {
          fetchGestionnaires();
          setNewGestionnaire({ name: '', role: 'superviseur', password: '' });
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

  const startEditing = (g) => {
    setEditingId(g.id);
    setEditGestionnaire({ name: g.name, role: g.role, password: g.password || '' });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditGestionnaire({ ...editGestionnaire, [name]: value });
  };

  const saveEdit = async (id) => {
    const g = gestionnaires.find(e => e.id === id);
    try {
      const response = await fetch(`${API_ADMIN}/gestionnaires/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...g, ...editGestionnaire }),
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

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const bstr = event.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      setImportedPointage(data);
      fetchGestionnaires();
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="admin-view">
      <div className="admin-header">
        <h1>Tableau de Bord Admin</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <span>+</span> Ajouter Superviseur / Responsable
        </button>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Liste des Gestionnaires</h2>
          {gestionnaires.length > 0 && (
            <button onClick={handleExportToExcel} className="btn" style={{ background: '#f1f5f9', color: '#475569' }}>
              📥 Exporter Excel
            </button>
          )}
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
                  <th>Mot de passe</th>
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
                      <code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        ********
                      </code>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
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

      <div className="card">
        <div className="section-title">
          <h2>Importation du Pointage Final</h2>
        </div>
        <div className="import-zone">
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
            Glissez-déposez le fichier Excel final du superviseur ici
          </p>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleImportExcel}
            id="file-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
            Sélectionner un fichier
          </label>
        </div>

        {importedPointage.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Aperçu des données importées</h3>
            <table className="gestionnaires-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Pointage</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {importedPointage.map((row, index) => (
                  <tr key={index}>
                    <td>{row['Nom de l\'employé']}</td>
                    <td>{row['Pointage']}</td>
                    <td>
                      <span className={`badge ${row['Statut'] === 'Présent' ? 'badge-success' : 'badge-warning'}`}>
                        {row['Statut']}
                      </span>
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
                  placeholder="ex: Jean Dupont"
                  required
                />
              </div>
              <div className="form-group">
                <label>Rôle</label>
                <select
                  value={newGestionnaire.role}
                  onChange={(e) => setNewGestionnaire({ ...newGestionnaire, role: e.target.value })}
                >
                  <option value="superviseur">Superviseur</option>
                  <option value="Responsable">Responsable</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mot de passe initial</label>
                <input
                  type="password"
                  value={newGestionnaire.password}
                  onChange={(e) => setNewGestionnaire({ ...newGestionnaire, password: e.target.value })}
                  required
                />
              </div>
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
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="text"
                name="password"
                value={editGestionnaire.password}
                onChange={handleEditChange}
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>
            <div className="modal-footer">
              <button type="button" onClick={cancelEdit} className="btn" style={{ background: '#f1f5f9' }}>
                Annuler
              </button>
              <button type="button" onClick={() => saveEdit(editingId)} className="btn btn-primary">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;