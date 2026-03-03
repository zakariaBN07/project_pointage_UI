import React, { useState, useEffect, useRef, useMemo } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './VueGlobale.css';

const VueGlobalePage = () => {
  const API_ADMIN = import.meta.env.VITE_APP_API_ADMIN_URL;
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;
  const [gestionnaires, setGestionnaires] = useState([]);
  const [allPointage, setAllPointage] = useState([]);
  const [pointageLoading, setPointageLoading] = useState(false);

  // ─── Formatting Helpers ───────────────────────────────────────────────
  const formatHours = (h) => (h == null || parseFloat(h) === 0) ? '0h' : `${Math.round(h)}h`;
  const formatDays = (d) => (d == null || parseFloat(d) === 0) ? 0 : Math.max(1, Math.round(d));

  const [filterSupervisors, setFilterSupervisors] = useState([]);
  const [filterEntreeFrom, setFilterEntreeFrom] = useState(null);
  const [filterEntreeTo, setFilterEntreeTo] = useState(null);
  const [filterSortieFrom, setFilterSortieFrom] = useState(null);
  const [filterSortieTo, setFilterSortieTo] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSiteWorkshop, setFilterSiteWorkshop] = useState('');
  const [filterMinHours, setFilterMinHours] = useState('');
  const [filterMinDays, setFilterMinDays] = useState('');
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

  const fetchAllPointage = async (gestList) => {
    try {
      setPointageLoading(true);
      const response = await fetch(`${API_EMPLOYEE}/employees`);
      if (response.ok) {
        const data = await response.json();
        const supervisorMap = Object.fromEntries((gestList || gestionnaires).map(g => [g.id, g.name]));
        const seen = new Set();
        const enriched = data
          .filter(emp => {
            if (emp.role !== 'employé' && emp.role) return false;
            const key = `${emp.name.toLowerCase().trim()}_${(emp.matricule || '').toLowerCase().trim()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map(emp => ({
            id: emp.id,
            // Check both supervisorId and responsableId to find the manager's name
            supervisorName: supervisorMap[emp.supervisorId] || supervisorMap[emp.responsableId] || 'Inconnu',
            name: emp.name,
            matricule: emp.matricule,
            pointageEntree: emp.pointageEntree || '-',
            pointageSortie: emp.pointageSortie || '-',
            status: emp.status || 'En attente',
            date: emp.date || null,
            totHrsTravaillees: emp.totHrsTravaillees || 0,
            nbrJrsTravaillees: emp.nbrJrsTravaillees || 0,
            nbrJrsAbsence: emp.nbrJrsAbsence || 0,
            totHrsDimanche: emp.totHrsDimanche || 0,
            nbrJrsFeries: emp.nbrJrsFeries || 0,
            nbrJrsFeriesTravailes: emp.nbrJrsFeriesTravailes || 0,
            nbrJrsConges: emp.nbrJrsConges || 0,
            nbrJrsDeplacementsMaroc: emp.nbrJrsDeplacementsMaroc || 0,
            nbrJrsPaniers: emp.nbrJrsPaniers || 0,
            nbrJrsDetente: emp.nbrJrsDetente || 0,
            nbrJrsDeplacementsExpatrie: emp.nbrJrsDeplacementsExpatrie || 0,
            nbrJrsRecuperation: emp.nbrJrsRecuperation || 0,
            nbrJrsMaladie: emp.nbrJrsMaladie || 0,
            chantierAtelier: emp.chantierAtelier || emp.siteWorkshop || '-',
            affaireNumero: emp.affaireNumero || '-',
            client: emp.client || '-',
            site: emp.site || '-',
          }));
        setAllPointage(enriched);
      }
    } catch (error) {
      console.error("Error fetching all pointage:", error);
    } finally {
      setPointageLoading(false);
    }
  };

  useEffect(() => {
    fetchGestionnaires().then(data => fetchAllPointage(data));
  }, []);

  const allSupervisors = useMemo(
    () => gestionnaires
      .filter(g => g.role === 'superviseur')
      .map(g => g.name)
      .sort(),
    [gestionnaires]
  );

  const allStatuses = useMemo(
    () => [...new Set(allPointage.map(r => r.status).filter(Boolean))].sort(),
    [allPointage]
  );

  const timeToMinutes = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
      return value.getHours() * 60 + value.getMinutes();
    }
    if (typeof value === "string" && value !== "-") {
      const parts = value.split(":");
      if (parts.length >= 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }
    }
    return null;
  };
  const filteredPointage = useMemo(() => {
    return allPointage.filter(row => {
      if (filterSupervisors.length > 0 && !filterSupervisors.includes(row.supervisorName)) return false;
      if (filterStatus && row.status !== filterStatus) return false;
      if (filterSiteWorkshop && !row.chantierAtelier.toLowerCase().includes(filterSiteWorkshop.toLowerCase())) return false;
      if (filterMinHours && row.totHrsTravaillees < parseFloat(filterMinHours)) return false;
      if (filterMinDays && row.nbrJrsTravaillees < parseFloat(filterMinDays)) return false;
      if (filterEntreeFrom || filterEntreeTo) {
        const entree = timeToMinutes(row.pointageEntree);
        if (entree === null) return false;
        if (filterEntreeFrom && entree < timeToMinutes(filterEntreeFrom)) return false;
        if (filterEntreeTo && entree > timeToMinutes(filterEntreeTo)) return false;
      }
      if (filterSortieFrom || filterSortieTo) {
        const sortie = timeToMinutes(row.pointageSortie);
        if (sortie === null) return false;
        if (filterSortieFrom && sortie < timeToMinutes(filterSortieFrom)) return false;
        if (filterSortieTo && sortie > timeToMinutes(filterSortieTo)) return false;
      }
      return true;
    });
  }, [allPointage, filterSupervisors, filterEntreeFrom, filterEntreeTo, filterSortieFrom, filterSortieTo, filterStatus, filterSiteWorkshop, filterMinHours, filterMinDays]);

  // ─── Grouping and Metrics ───────────────────────────────────────────────
  const groupedPointage = useMemo(() => {
    const groups = {};

    filteredPointage.forEach(emp => {
      const groupKey = `${emp.affaireNumero || 'Sans Affaire'}_${emp.supervisorName}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          affaireNumero: emp.affaireNumero || '-',
          supervisorName: emp.supervisorName,
          totalHours: 0,
          totalAbsences: 0,
          totalSundayHours: 0,
          presentCount: 0,
          projectProgress: emp.projectProgress || 0,
          employees: []
        };
      }

      groups[groupKey].employees.push(emp);
      // Use the max progress found for the project (or assume it's synced)
      if ((emp.projectProgress || 0) > groups[groupKey].projectProgress) {
        groups[groupKey].projectProgress = emp.projectProgress;
      }
      groups[groupKey].totalHours += (emp.totHrsTravaillees || 0);
      groups[groupKey].totalAbsences += (emp.nbrJrsAbsence || 0);
      groups[groupKey].totalSundayHours += (emp.totHrsDimanche || 0);
      if (emp.status === 'Présent' || emp.status === 'Sortie') {
        groups[groupKey].presentCount += 1;
      }
    });

    return Object.values(groups).map(group => ({
      ...group,
      presenceRate: group.employees.length > 0
        ? Math.round((group.presentCount / group.employees.length) * 100)
        : 0
    }));
  }, [filteredPointage]);

  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedId(null);
  }, [filterSupervisors, filterEntreeFrom, filterEntreeTo, filterSortieFrom, filterSortieTo, filterStatus, filterSiteWorkshop, filterMinHours, filterMinDays]);

  const totalPages = Math.ceil(groupedPointage.length / pageSize);
  const paginatedGroups = useMemo(
    () => groupedPointage.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [groupedPointage, currentPage, pageSize]
  );

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);
    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const toggleSupervisor = (name) => {
    setFilterSupervisors(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const resetFilters = () => {
    setFilterSupervisors([]);
    setFilterEntreeFrom(null);
    setFilterEntreeTo(null);
    setFilterSortieFrom(null);
    setFilterSortieTo(null);
    setFilterStatus('');
    setFilterSiteWorkshop('');
    setFilterMinHours('');
    setFilterMinDays('');
  };

  return (
    <div className="vue-pointage-container">
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
              <DatePicker
                selected={filterEntreeFrom}
                onChange={(date) => setFilterEntreeFrom(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={5}
                timeCaption="Heure"
                dateFormat="HH:mm"
                placeholderText="De"
                className="filter-input"
              />
              <span className="time-range-sep">→</span>
              <DatePicker
                selected={filterEntreeTo}
                onChange={(date) => setFilterEntreeTo(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={5}
                timeCaption="Heure"
                dateFormat="HH:mm"
                placeholderText="À"
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-group filter-group-time">
            <label className="filter-label">Heure de sortie</label>
            <div className="time-range-inputs">
              <DatePicker
                selected={filterSortieFrom}
                onChange={(date) => setFilterSortieFrom(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={5}
                timeCaption="Heure"
                dateFormat="HH:mm"
                placeholderText="De"
                className="filter-input"
              />
              <span className="time-range-sep">→</span>
              <DatePicker
                selected={filterSortieTo}
                onChange={(date) => setFilterSortieTo(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={5}
                timeCaption="Heure"
                dateFormat="HH:mm"
                placeholderText="À"
                className="filter-input"
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

          <div className="filter-group">
            <label className="filter-label">Chantier/Atelier</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Rechercher..."
              value={filterSiteWorkshop}
              onChange={e => setFilterSiteWorkshop(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Min. Hrs Trav.</label>
            <input
              type="number"
              className="filter-input"
              placeholder="Ex: 8"
              value={filterMinHours}
              onChange={e => setFilterMinHours(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Min. Jrs Trav.</label>
            <input
              type="number"
              className="filter-input"
              placeholder="Ex: 5"
              value={filterMinDays}
              onChange={e => setFilterMinDays(e.target.value)}
            />
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
            {(filterSupervisors.length > 0 || filterEntreeFrom || filterEntreeTo || filterSortieFrom || filterSortieTo || filterStatus || filterSiteWorkshop || filterMinHours || filterMinDays) && (
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
          <div className="grouped-pointage-list">
            {paginatedGroups.length === 0 ? (
              <div className="empty-state">
                {allPointage.length === 0
                  ? 'Aucune donnée de pointage disponible.'
                  : 'Aucun enregistrement ne correspond aux filtres sélectionnés.'}
              </div>
            ) : (
              paginatedGroups.map(group => (
                <div
                  key={group.id}
                  className={`group-container ${expandedId === group.id ? 'expanded' : ''}`}
                >
                  <div
                    className="group-summary-row"
                    onClick={() => toggleExpand(group.id)}
                  >
                    <div className="group-info">
                      <div className="project-badge">#{group.affaireNumero}</div>
                      <div className="supervisor-info">
                        <span className="label">Superviseur</span>
                        <span className="name">{group.supervisorName}</span>
                      </div>
                    </div>

                    <div className="project-progress-container">
                      <div className="progress-header">
                        <span className="label">Avancement Projet</span>
                        <span className="value">{group.projectProgress}%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${group.projectProgress}%`,
                            background: group.projectProgress > 70 ? '#10b981' : group.projectProgress > 30 ? '#3b82f6' : '#f59e0b'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="group-stats">
                      <div className="stat-pill">
                        <span className="stat-label">Hrs Totales</span>
                        <span className="stat-value">{formatHours(group.totalHours)}</span>
                      </div>
                      <div className="stat-pill">
                        <span className="stat-label">Absences</span>
                        <span className="stat-value">{group.totalAbsences} jrs</span>
                      </div>
                      <div className="stat-pill">
                        <span className="stat-label">Taux Présence</span>
                        <span className={`stat-value ${group.presenceRate > 80 ? 'good' : group.presenceRate > 50 ? 'avg' : 'low'}`}>
                          {group.presenceRate}%
                        </span>
                      </div>
                    </div>

                    <div className="expand-icon">
                      {expandedId === group.id ? '−' : '+'}
                    </div>
                  </div>

                  {expandedId === group.id && (
                    <div className="group-details-section animate-slide-down">
                      <div className="details-kpi-grid">
                        <div className="kpi-card">
                          <span className="kpi-label">Effectif</span>
                          <span className="kpi-value">{group.employees.length}</span>
                        </div>
                        <div className="kpi-card">
                          <span className="kpi-label">Hrs Dimanche</span>
                          <span className="kpi-value">{formatHours(group.totalSundayHours)}</span>
                        </div>
                        <div className="kpi-card">
                          <span className="kpi-label">Présents</span>
                          <span className="kpi-value">{group.presentCount}</span>
                        </div>
                        <div className="kpi-card">
                          <span className="kpi-label">Moyenne / Emp</span>
                          <span className="kpi-value">{formatHours(group.totalHours / group.employees.length)}</span>
                        </div>
                      </div>

                      <div className="table-responsive detail-table-wrapper">
                        <table className="gestionnaires-table pointage-table detail-table">
                          <thead>
                            <tr>
                              <th style={{ width: '160px' }}>Nom complet</th>
                              <th style={{ width: '100px' }}>Matricule</th>
                              <th style={{ width: '100px' }}>Site</th>
                              <th style={{ width: '110px' }}>Chantier</th>
                              <th style={{ width: '80px' }}>Hrs</th>
                              <th style={{ width: '75px' }}>Jrs</th>
                              <th style={{ width: '75px' }}>Abs.</th>
                              <th style={{ width: '75px' }}>Dim.</th>
                              <th style={{ width: '75px' }}>Fériés</th>
                              <th style={{ width: '90px' }}>Dpl. Maroc</th>
                              <th style={{ width: '90px' }}>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.employees.map(row => (
                              <tr key={row.id}>
                                <td style={{ fontWeight: 600 }}>{row.name}</td>
                                <td><code className="matricule-code">{row.matricule}</code></td>
                                <td>{row.site}</td>
                                <td>{row.chantierAtelier}</td>
                                <td style={{ fontWeight: 600, color: '#4f46e5' }}>{formatHours(row.totHrsTravaillees)}</td>
                                <td style={{ fontWeight: 600, color: '#10b981' }}>{formatDays(row.nbrJrsTravaillees)}</td>
                                <td>{formatDays(row.nbrJrsAbsence)}</td>
                                <td style={{ color: '#4f46e5' }}>{formatHours(row.totHrsDimanche)}</td>
                                <td>{formatDays(row.nbrJrsFeries)}</td>
                                <td>{formatDays(row.nbrJrsDeplacementsMaroc)}</td>
                                <td>
                                  <span className={`badge ${row.status === 'Présent' ? 'badge-success' :
                                    row.status === 'Absent' ? 'badge-danger' :
                                      row.status === 'Sortie' ? 'badge-warning' :
                                        'badge-info'
                                    }`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

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
          </div>
        )}
      </div>
    </div>
  );
};

export default VueGlobalePage;
