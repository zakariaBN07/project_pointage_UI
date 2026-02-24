import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import './Admin.css';

const Admin = () => {
  const API_ADMIN    = import.meta.env.VITE_APP_API_ADMIN_URL;
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;
  const [gestionnaires, setGestionnaires] = useState([]);
  const [allPointage, setAllPointage] = useState([]);
  const [pointageLoading, setPointageLoading] = useState(false);
  const [newGestionnaire, setNewGestionnaire] = useState({ name: '', role: 'superviseur', password: '', siege: '' });
  const [editingId, setEditingId] = useState(null);
  const [editGestionnaire, setEditGestionnaire] = useState({ name: '', role: 'superviseur', password: '', siege: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [filterSupervisors, setFilterSupervisors] = useState([]);
  const [filterEntreeFrom, setFilterEntreeFrom] = useState('');
  const [filterEntreeTo, setFilterEntreeTo] = useState('');
  const [filterSortieFrom, setFilterSortieFrom] = useState('');
  const [filterSortieTo, setFilterSortieTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [supervisorDropdownOpen, setSupervisorDropdownOpen] = useState(false);
  const supervisorDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (supervisorDropdownRef.current && !supervisorDropdownRef.current.contains(e.target)) {
        setSupervisorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllPointage = async (gestList) => {
    try {
      setPointageLoading(true);
      const response = await fetch(`${API_EMPLOYEE}/employees`);
      if (response.ok) {
        const data = await response.json();
        const supervisorMap = Object.fromEntries((gestList || gestionnaires).map(g => [g.id, g.name]));
        const enriched = data
          .filter(emp => emp.role === 'employé' || !emp.role)
          .map(emp => ({
            id: emp.id,
            supervisorName: supervisorMap[emp.supervisorId] || 'Inconnu',
            name: emp.name,
            matricule: emp.matricule,
            pointageEntree: emp.pointageEntree || '-',
            pointageSortie: emp.pointageSortie || '-',
            status: emp.status || 'En attente',
            date: emp.date || null,
          }));
        setAllPointage(enriched);
      }
    } catch (error) {
      console.error("Error fetching all pointage:", error);
    } finally {
      setPointageLoading(false);
    }
  };

  const allSupervisors = useMemo(
    () => [...new Set(allPointage.map(r => r.supervisorName).filter(Boolean))].sort(),
    [allPointage]
  );

  const allStatuses = useMemo(
    () => [...new Set(allPointage.map(r => r.status).filter(Boolean))].sort(),
    [allPointage]
  );

  const timeToMinutes = (t) => {
    if (!t || t === '-') return null;
    const parts = t.split(':');
    if (parts.length < 2) return null;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const filteredPointage = useMemo(() => {
    return allPointage.filter(row => {
      if (filterSupervisors.length > 0 && !filterSupervisors.includes(row.supervisorName)) return false;
      if (filterStatus && row.status !== filterStatus) return false;
      if (filterEntreeFrom || filterEntreeTo) {
        const entree = timeToMinutes(row.pointageEntree);
        if (entree === null) return false;
        if (filterEntreeFrom && entree < timeToMinutes(filterEntreeFrom)) return false;
        if (filterEntreeTo  && entree > timeToMinutes(filterEntreeTo))   return false;
      }
      if (filterSortieFrom || filterSortieTo) {
        const sortie = timeToMinutes(row.pointageSortie);
        if (sortie === null) return false;
        if (filterSortieFrom && sortie < timeToMinutes(filterSortieFrom)) return false;
        if (filterSortieTo   && sortie > timeToMinutes(filterSortieTo))   return false;
      }
      return true;
    });
  }, [allPointage, filterSupervisors, filterEntreeFrom, filterEntreeTo, filterSortieFrom, filterSortieTo, filterStatus]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setCurrentPage(1); }, [filterSupervisors, filterEntreeFrom, filterEntreeTo, filterSortieFrom, filterSortieTo, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredPointage.length / pageSize));
  const paginatedPointage = useMemo(
    () => filteredPointage.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredPointage, currentPage, pageSize]
  );

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);
    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const toggleSupervisor = (name) => {
    setFilterSupervisors(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const resetFilters = () => {
    setFilterSupervisors([]);
    setFilterEntreeFrom('');
    setFilterEntreeTo('');
    setFilterSortieFrom('');
    setFilterSortieTo('');
    setFilterStatus('');
  };

  const filteredGestionnaires = gestionnaires.filter(
    g => g.role.toLowerCase() === 'superviseur' || g.role.toLowerCase() === 'responsable'
  );

  const fetchGestionnaires = async () => {
    try {
      const response = await fetch(`${API_ADMIN}/gestionnaires`);
      if (response.ok) {
        const data = await response.json();
        setGestionnaires(data);
        return data;
      }
    } catch (error) {
      console.error("Error fetching gestionnaires:", error);
    }
    return [];
  };

  useEffect(() => {
    fetchGestionnaires().then(data => fetchAllPointage(data));
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleImportGestionnaires}
              id="import-gestionnaires"
              style={{ display: 'none' }}
            />
            {/* <label htmlFor="import-gestionnaires" className="btn" style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', margin: 0 }}>
              📤 Importer Excel
            </label> */}
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
                      {g.role.toLowerCase() === 'superviseur' && g.siege ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{g.siege}</span>
                      ) : (
                        <span style={{ color: 'var(--border-color)' }}>—</span>
                      )}
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
          <h2>Vue Globale du Pointage</h2>
          <button
            onClick={() => fetchAllPointage()}
            className="btn"
            style={{ background: '#f1f5f9', color: '#475569' }}
            disabled={pointageLoading}
          >
            {pointageLoading ? '⏳ Chargement...' : '🔄 Actualiser'}
          </button>
        </div>

        <div className="pointage-filters">
          <div className="filter-group" ref={supervisorDropdownRef}>
            <label className="filter-label">Superviseur</label>
            <div className="multiselect-wrapper">
              <button
                type="button"
                className="multiselect-trigger"
                onClick={() => setSupervisorDropdownOpen(o => !o)}
                disabled={allSupervisors.length === 0}
              >
                {filterSupervisors.length === 0
                  ? 'Tous les superviseurs'
                  : filterSupervisors.length === 1
                    ? filterSupervisors[0]
                    : `${filterSupervisors.length} sélectionnés`}
                <span className="multiselect-caret">{supervisorDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {supervisorDropdownOpen && (
                <div className="multiselect-dropdown">
                  {allSupervisors.map(sup => (
                    <label key={sup} className="multiselect-option">
                      <input
                        type="checkbox"
                        checked={filterSupervisors.includes(sup)}
                        onChange={() => toggleSupervisor(sup)}
                      />
                      {sup}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filter-group filter-group-time">
            <label className="filter-label">Heure d'entrée</label>
            <div className="time-range-inputs">
              <input
                type="time"
                className="filter-input"
                value={filterEntreeFrom}
                onChange={e => setFilterEntreeFrom(e.target.value)}
                title="De"
              />
              <span className="time-range-sep">→</span>
              <input
                type="time"
                className="filter-input"
                value={filterEntreeTo}
                onChange={e => setFilterEntreeTo(e.target.value)}
                title="À"
              />
            </div>
          </div>

          <div className="filter-group filter-group-time">
            <label className="filter-label">Heure de sortie</label>
            <div className="time-range-inputs">
              <input
                type="time"
                className="filter-input"
                value={filterSortieFrom}
                onChange={e => setFilterSortieFrom(e.target.value)}
                title="De"
              />
              <span className="time-range-sep">→</span>
              <input
                type="time"
                className="filter-input"
                value={filterSortieTo}
                onChange={e => setFilterSortieTo(e.target.value)}
                title="À"
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Statut</label>
            <select
              className="filter-input"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              {allStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="filter-group filter-reset-group">
            <button type="button" className="btn filter-reset-btn" onClick={resetFilters}>
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="filter-summary">
          <span>
            {filteredPointage.length} enregistrement{filteredPointage.length !== 1 ? 's' : ''}
            {filteredPointage.length > 0 && (
              <> — page {currentPage}/{totalPages}</>
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {(filterSupervisors.length > 0 || filterEntreeFrom || filterEntreeTo || filterSortieFrom || filterSortieTo || filterStatus) && (
              <span className="filter-active-badge">Filtres actifs</span>
            )}
            <label className="filter-label" style={{ margin: 0 }}>Lignes :</label>
            <select
              className="filter-input"
              style={{ width: 'auto', padding: '0.2rem 0.4rem' }}
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {pointageLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            ⏳ Chargement des données de pointage...
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="gestionnaires-table pointage-table">
                <thead>
                  <tr>
                    <th>Superviseur</th>
                    <th>Employé</th>
                    <th>Matricule</th>
                    <th>Pointage d'entrée</th>
                    <th>Pointage de sortie</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPointage.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        {allPointage.length === 0
                          ? 'Aucune donnée de pointage disponible.'
                          : 'Aucun enregistrement ne correspond aux filtres sélectionnés.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedPointage.map(row => (
                      <tr key={row.id}>
                        <td><span className="supervisor-name-cell">{row.supervisorName}</span></td>
                        <td style={{ fontWeight: 600 }}>{row.name}</td>
                        <td><code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>{row.matricule}</code></td>
                        <td>{row.pointageEntree}</td>
                        <td>{row.pointageSortie}</td>
                        <td>
                          <span className={`badge ${
                            row.status === 'Présent' ? 'badge-success' :
                            row.status === 'Absent'  ? 'badge-danger'  :
                            row.status === 'Sortie'  ? 'badge-warning' :
                            'badge-info'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ‹ Préc.
                </button>
                {getPageNumbers().map((p, i) =>
                  p === '...'
                    ? <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
                    : <button
                        key={p}
                        className={`pagination-btn${currentPage === p ? ' active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                )}
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suiv. ›
                </button>
              </div>
            )}
          </>
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
                <label>Mot de passe initial</label>
                <div className="password-input-wrapper">
                  <input
                    type={showAddPassword ? "text" : "password"}
                    value={newGestionnaire.password}
                    onChange={(e) => setNewGestionnaire({ ...newGestionnaire, password: e.target.value })}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    aria-label={showAddPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    <span className="material-symbols-outlined">
                      {showAddPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
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
                  type={showEditPassword ? "text" : "password"}
                  name="password"
                  value={editGestionnaire.password}
                  onChange={handleEditChange}
                  placeholder="Laisser vide pour ne pas changer"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  aria-label={showEditPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  <span className="material-symbols-outlined">
                    {showEditPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
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