import React, { useState, useEffect, useRef, useMemo } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './Vue_Globale_du_Pointage.css';

const Vue_Globale_du_Pointage = () => {
  const API_ADMIN = import.meta.env.VITE_APP_API_ADMIN_URL;
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;
  const [gestionnaires, setGestionnaires] = useState([]);
  const [allPointage, setAllPointage] = useState([]);
  const [pointageLoading, setPointageLoading] = useState(false);

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
            totalHoursWorked: emp.totalHoursWorked || 0,
            daysWorked: emp.daysWorked || 0,
            daysAbsent: emp.daysAbsent || 0,
            totalSundayHours: emp.totalSundayHours || 0,
            holidaysCount: emp.holidaysCount || 0,
            workedHolidaysCount: emp.workedHolidaysCount || 0,
            leaveDays: emp.leaveDays || 0,
            moroccoTravelDays: emp.moroccoTravelDays || 0,
            mealVoucherDays: emp.mealVoucherDays || 0,
            restDays: emp.restDays || 0,
            expatTravelDays: emp.expatTravelDays || 0,
            recoveryDays: emp.recoveryDays || 0,
            sickLeaveDays: emp.sickLeaveDays || 0,
            siteWorkshop: emp.siteWorkshop || '-',
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
    () => [...new Set(allPointage.map(r => r.supervisorName).filter(Boolean))].sort(),
    [allPointage]
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
      if (filterSiteWorkshop && !row.siteWorkshop.toLowerCase().includes(filterSiteWorkshop.toLowerCase())) return false;
      if (filterMinHours && row.totalHoursWorked < parseFloat(filterMinHours)) return false;
      if (filterMinDays && row.daysWorked < parseFloat(filterMinDays)) return false;
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setCurrentPage(1); }, [filterSupervisors, filterEntreeFrom, filterEntreeTo, filterSortieFrom, filterSortieTo, filterStatus, filterSiteWorkshop, filterMinHours, filterMinDays]);

  const totalPages = Math.max(1, Math.ceil(filteredPointage.length / pageSize));
  const paginatedPointage = useMemo(
    () => filteredPointage.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredPointage, currentPage, pageSize]
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
          <>
            <div className="table-responsive">
              <table className="gestionnaires-table pointage-table">
                <thead>
                  <tr>
                    <th>Superviseur</th>
                    <th>Employé</th>
                    <th>Matricule</th>
                    <th>Chantier/Atelier</th>
                    <th>Pointage d'entrée</th>
                    <th>Pointage de sortie</th>
                    <th>Statut</th>
                    <th>Tot.Hrs travaillées</th>
                    <th>Nbr.jrs travaillés</th>
                    <th>Nbr.Jrs Absence</th>
                    <th>Tot.Hrs Dimanche</th>
                    <th>Nbr.Jrs fériés</th>
                    <th>Nbr.Jrs Fériés Travaillés</th>
                    <th>Nbr.Jrs Congés</th>
                    <th>Nbr.Jrs déplacements Maroc</th>
                    <th>Nbr.Jrs paniers</th>
                    <th>Nbr.Jrs détente</th>
                    <th>Nbr.Jrs déplacements expatrié</th>
                    <th>Nbr.Jrs récupération</th>
                    <th>Nbr.Jrs maladie</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPointage.length === 0 ? (
                    <tr>
                      <td colSpan={20} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        {allPointage.length === 0
                          ? 'Aucune donnée de pointage disponible.'
                          : 'Aucun enregistrement ne correspond aux filtres sélectionnés.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedPointage.map(row => (
                      <tr key={row.id}>
                        <td><span className="supervisor-name-cell">{row.supervisorName}</span></td>
                        <td style={{ fontWeight: 600, transition: 'color 0.2s' }}>{row.name}</td>
                        <td><code className="matricule-code">{row.matricule}</code></td>
                        <td>{row.siteWorkshop}</td>
                        <td>{row.pointageEntree}</td>
                        <td>{row.pointageSortie}</td>
                        <td>
                          <span className={`badge ${row.status === 'Présent' ? 'badge-success' :
                            row.status === 'Absent' ? 'badge-danger' :
                              row.status === 'Sortie' ? 'badge-warning' :
                                'badge-info'
                            }`}>
                            {row.status}
                          </span>
                        </td>
                        <td>{row.totalHoursWorked}</td>
                        <td>{row.daysWorked}</td>
                        <td>{row.daysAbsent}</td>
                        <td>{row.totalSundayHours}</td>
                        <td>{row.holidaysCount}</td>
                        <td>{row.workedHolidaysCount}</td>
                        <td>{row.leaveDays}</td>
                        <td>{row.moroccoTravelDays}</td>
                        <td>{row.mealVoucherDays}</td>
                        <td>{row.restDays}</td>
                        <td>{row.expatTravelDays}</td>
                        <td>{row.recoveryDays}</td>
                        <td>{row.sickLeaveDays}</td>
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
    </div>
  );
};

export default Vue_Globale_du_Pointage;
