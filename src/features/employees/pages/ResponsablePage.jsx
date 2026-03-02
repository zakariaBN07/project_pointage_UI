import React, { useState, useEffect, useContext, useRef } from 'react';
import * as XLSX from 'xlsx';
import { NotificationContext } from '../../notifications/NotificationContext';
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaSync,
  FaPlus,
  FaFileExport,
  FaFileImport,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaUserTie,
  FaClipboardList,
  FaCalendarAlt,
  FaHardHat
} from 'react-icons/fa';
import './Responsable.css';

const ResponsablePage = ({ user }) => {
  const { addNotification } = useContext(NotificationContext);
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;
  const API_ADMIN = import.meta.env.VITE_APP_API_ADMIN_URL;
  const [employeesPointage, setEmployeesPointage] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [responsableName] = useState(user?.name || '');
  const [responsableSiege, setResponsableSiege] = useState(user?.siege || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    matricule: '',
    role: 'employé',
    affaireNumero: '',
    client: '',
    site: '',
    supervisorId: '',
    nbrJrsAbsence: 0,
    totHrsDimanche: 0,
    nbrJrsFeries: 0,
    nbrJrsFeriesTravailes: 0,
    nbrJrsConges: 0,
    nbrJrsDeplacementsMaroc: 0,
    nbrJrsPaniers: 0,
    nbrJrsDetente: 0,
    nbrJrsDeplacementsExpatrie: 0,
    nbrJrsRecuperation: 0,
    nbrJrsMaladie: 0,
    chantierAtelier: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editEmployee, setEditEmployee] = useState({
    name: '',
    matricule: '',
    role: 'employé',
    affaireNumero: '',
    client: '',
    site: '',
    supervisorId: '',
    nbrJrsAbsence: 0,
    totHrsDimanche: 0,
    nbrJrsFeries: 0,
    nbrJrsFeriesTravailes: 0,
    nbrJrsConges: 0,
    nbrJrsDeplacementsMaroc: 0,
    nbrJrsPaniers: 0,
    nbrJrsDetente: 0,
    nbrJrsDeplacementsExpatrie: 0,
    nbrJrsRecuperation: 0,
    nbrJrsMaladie: 0,
    chantierAtelier: ''
  });
  const [activeActivityModal, setActiveActivityModal] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  const hasNotifiedRef = useRef(false);

  // Filter for only regular employees and by selected supervisor
  const supervisedEmployees = employeesPointage.filter(emp => {
    const isRegular = emp.role === 'employé' || !emp.role;
    const matchesSupervisor = selectedSupervisorId ? String(emp.supervisorId) === String(selectedSupervisorId) : true;
    return isRegular && matchesSupervisor;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = supervisedEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(supervisedEmployees.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end === totalPages) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  // Count employees with status "En attente"
  const unmarkedEmployees = supervisedEmployees.filter(emp => emp.status === 'En attente');
  const unmarkedCount = unmarkedEmployees.length;

  // Fetch employees to supervise from API
  const fetchEmployeesToSupervise = async () => {
    try {
      setLoading(true);
      const url = user?.id
        ? `${API_EMPLOYEE}/employees?responsableId=${user.id}`
        : `${API_EMPLOYEE}/employees`;
      const response = await fetch(url);
      if (response.ok) {
        const rawData = await response.json();
        // Initialize with default status if not present and remove sensitive data
        const initializedData = rawData.map(({ password, ...emp }) => ({
          ...emp,
          pointageEntree: emp.pointageEntree || '-',
          pointageSortie: emp.pointageSortie || '-',
          status: emp.status || 'En attente'
        }));
        setEmployeesPointage(initializedData);
      }
    } catch (error) {
      console.error("Error fetching employees for supervision:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (newEmployee.name.trim() && newEmployee.matricule.trim()) {
      // Prevent duplicates
      const isDuplicate = employeesPointage.some(emp =>
        emp.name.toLowerCase().trim() === newEmployee.name.toLowerCase().trim() &&
        emp.matricule.toLowerCase().trim() === newEmployee.matricule.toLowerCase().trim()
      );

      if (isDuplicate) {
        addNotification(`L'employé "${newEmployee.name}" avec le matricule "${newEmployee.matricule}" existe déjà.`, 'warning');
        return;
      }

      try {
        const response = await fetch(`${API_EMPLOYEE}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newEmployee,
            responsableId: user?.id,
            supervisorId: newEmployee.supervisorId || selectedSupervisorId,
            status: 'En attente',
            pointageEntree: '-',
            pointageSortie: '-'
          }),
        });
        if (response.ok) {
          fetchEmployeesToSupervise();
          setNewEmployee({
            name: '',
            site: '',
            supervisorId: '',
            nbrJrsAbsence: 0,
            totHrsDimanche: 0,
            nbrJrsFeries: 0,
            nbrJrsFeriesTravailes: 0,
            nbrJrsConges: 0,
            nbrJrsDeplacementsMaroc: 0,
            nbrJrsPaniers: 0,
            nbrJrsDetente: 0,
            nbrJrsDeplacementsExpatrie: 0,
            nbrJrsRecuperation: 0,
            nbrJrsMaladie: 0,
            chantierAtelier: ''
          });
        }
      } catch (error) {
        console.error("Error adding employee:", error);
      }
    }
  };

  const handleDeleteList = async () => {
    if (!selectedSupervisorId) {
      alert("Veuillez sélectionner un superviseur.");
      return;
    }

    if (!window.confirm("Supprimer tous les employés de ce superviseur ?")) return;

    const employeesToDelete = supervisedEmployees;

    try {
      await Promise.all(
        employeesToDelete.map(emp =>
          fetch(`${API_EMPLOYEE}/employees/${emp.id}`, {
            method: "DELETE"
          })
        )
      );

      fetchEmployeesToSupervise();
      addNotification("Liste supprimée avec succès.", "success");
    } catch (error) {
      console.error("Erreur suppression liste:", error);
    }
  };

  const startEditing = (emp) => {
    setEditingId(emp.id);
    setEditEmployee({
      name: emp.name,
      matricule: emp.matricule,
      role: emp.role || 'employé',
      affaireNumero: emp.affaireNumero || '',
      client: emp.client || '',
      site: emp.site || '',
      supervisorId: emp.supervisorId || '',
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
      chantierAtelier: emp.chantierAtelier || ''
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditEmployee({ ...editEmployee, [name]: value });
  };

  const saveEdit = async (id) => {
    const emp = employeesPointage.find(e => e.id === id);
    try {
      const response = await fetch(`${API_EMPLOYEE}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emp, ...editEmployee }),
      });
      if (response.ok) {
        fetchEmployeesToSupervise();
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const fetchSupervisors = async () => {
    try {
      const response = await fetch(`${API_ADMIN}/gestionnaires`);
      if (response.ok) {
        const data = await response.json();
        setSupervisors(data.filter(g => g.role === 'superviseur'));
      }
    } catch (error) {
      console.error("Error fetching supervisors:", error);
    }
  };

  useEffect(() => {
    fetchEmployeesToSupervise();
    fetchSupervisors();
  }, [user?.id]);

  // ─── Helper: parse "HH:MM:SS" → decimal hours ───────────────────────────
  const timeStrToHours = (str) => {
    if (!str || str === '-') return null;
    const parts = str.split(':').map(Number);
    if (parts.length < 2 || parts.some(isNaN)) return null;
    return parts[0] + parts[1] / 60 + (parts[2] || 0) / 3600;
  };

  // ─── Formatting Helpers ───────────────────────────────────────────────
  const formatHours = (h) => (h == null || parseFloat(h) === 0) ? '0h' : `${Math.round(h)}h`;
  const formatDays = (d) => (d == null || parseFloat(d) === 0) ? 0 : Math.max(1, Math.round(d));

  const markStatus = async (id, newStatus) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', { hour12: false });

    const emp = employeesPointage.find(e => e.id === id);
    if (!emp) return;

    let updatedEntree = emp.pointageEntree;
    let updatedSortie = emp.pointageSortie;
    let updatedTotHrsTravaillees = emp.totHrsTravaillees || 0;
    let updatedNbrJrsTravaillees = emp.nbrJrsTravaillees || 0;

    if (newStatus === 'Présent') {
      updatedEntree = timeString;
      updatedSortie = '-';
    } else if (newStatus === 'Sortie') {
      if (!updatedEntree || updatedEntree === '-') {
        alert("Veuillez marquer d'abord l'entrée avant la sortie !");
        return;
      }
      updatedSortie = timeString;

      const entreeHours = timeStrToHours(updatedEntree);
      const sortieHours = timeStrToHours(updatedSortie);

      if (entreeHours !== null && sortieHours !== null && sortieHours > entreeHours) {
        const sessionHours = sortieHours - entreeHours;
        updatedTotHrsTravaillees += sessionHours;
        updatedNbrJrsTravaillees += 1;
      }
    } else if (newStatus === 'Absent') {
      updatedEntree = '-';
      updatedSortie = '-';
    }

    // Update UI first
    setEmployeesPointage(prev =>
      prev.map(e =>
        e.id === id
          ? {
            ...e,
            status: newStatus,
            pointageEntree: updatedEntree,
            pointageSortie: updatedSortie,
            totHrsTravaillees: updatedTotHrsTravaillees,
            nbrJrsTravaillees: updatedNbrJrsTravaillees,
          }
          : e
      )
    );

    // Update backend
    try {
      await fetch(`${API_EMPLOYEE}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emp,
          status: newStatus,
          pointageEntree: updatedEntree,
          pointageSortie: updatedSortie,
          totHrsTravaillees: updatedTotHrsTravaillees,
          nbrJrsTravaillees: updatedNbrJrsTravaillees,
        }),
      });
    } catch (error) {
      console.error('Failed to update hours:', error);
      fetchEmployeesToSupervise(); // rollback
    }
  };

  const handleExportEmployees = () => {
    const dataToExport = supervisedEmployees.map(({ name, matricule, affaireNumero, client, site }) => ({
      'Nom': name,
      'Matricule': matricule,
      'Affaire N°': affaireNumero || '-',
      'Client': client || '-',
      'Site': site || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employés");
    XLSX.writeFile(workbook, "List_Employees.xlsx");
  };

  const handleImportEmployees = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedSupervisorId) {
      alert("Veuillez sélectionner un superviseur avant d'importer le fichier !");
      if (e.target) e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const bstr = event.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(rows.length, 100); i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row)) continue;

        const isHeaderRow = row.some(cell => {
          const s = String(cell || '').toLowerCase().trim();
          return s.includes('nom') || s.includes('matricule') || s.includes('employé');
        });

        if (isHeaderRow) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        alert("Erreur: Impossible de localiser la ligne d'en-tête. Assurez-vous que votre fichier contient une colonne 'Nom complet' ou 'Matricule'.");
        return;
      }

      const rawData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });

      for (const row of rawData) {
        const keys = Object.keys(row);
        const nameKey = keys.find(k => {
          const s = k.toLowerCase().trim();
          return s.includes('nom complet') || s === 'nom' || s.includes('nom de l\'employé');
        });
        const matriculeKey = keys.find(k => k.toLowerCase().trim().includes('matricule'));
        const affaireKey = keys.find(k => k.toLowerCase().trim().includes('affaire'));
        const clientKey = keys.find(k => k.toLowerCase().trim().includes('client'));
        const siteKey = keys.find(k => k.toLowerCase().trim().includes('site'));

        const name = nameKey ? row[nameKey] : null;
        const matricule = matriculeKey ? row[matriculeKey] : null;
        const affaireNumero = affaireKey ? row[affaireKey] : '-';
        const client = clientKey ? row[clientKey] : '-';
        const site = siteKey ? row[siteKey] : '-';

        if (!name ||
          String(name).toLowerCase().trim() === 'nom complet' ||
          String(name).toLowerCase().trim() === 'nom' ||
          String(name).toLowerCase().trim().includes('total')) continue;

        const normalizedName = String(name).trim();
        const normalizedMatricule = matricule ? String(matricule).trim() : '';

        // Prevent duplicates from spreadsheet or already in system
        const alreadyExists = employeesPointage.some(emp =>
          emp.name.toLowerCase().trim() === normalizedName.toLowerCase() &&
          emp.matricule.toLowerCase().trim() === normalizedMatricule.toLowerCase()
        );

        if (alreadyExists) {
          console.warn(`Skipping duplicate: ${normalizedName} (${normalizedMatricule})`);
          continue;
        }

        try {
          await fetch(`${API_EMPLOYEE}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: normalizedName,
              matricule: normalizedMatricule,
              responsableId: user?.id,
              supervisorId: selectedSupervisorId || '',
              role: 'employé',
              status: 'En attente',
              pointageEntree: '-',
              pointageSortie: '-',
              affaireNumero: String(affaireNumero).trim(),
              client: String(client).trim(),
              site: String(site).trim()
            }),
          });
        } catch (error) {
          console.error("Error importing employee:", error);
        }
      }
      fetchEmployeesToSupervise();
    };
    reader.readAsBinaryString(file);
  };

  const handleExportFinalExcel = async () => {
    if (!selectedSupervisorId) {
      alert("Veuillez sélectionner un superviseur avant d'envoyer le rapport !");
      return;
    }

    if (hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;

    setIsExporting(true);

    try {
      const url = user?.id
        ? `${API_EMPLOYEE}/employees?responsableId=${user.id}`
        : `${API_EMPLOYEE}/employees`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch latest employee data');
        return;
      }

      const latestEmployeesRaw = await response.json();

      // Filter and Deduplicate based on name + matricule just in case
      const seen = new Set();
      const latestEmployees = latestEmployeesRaw
        .map(({ password, ...rest }) => rest)
        .filter(emp => {
          const isEligible = (emp.role === 'employé' || !emp.role) && String(emp.supervisorId) === String(selectedSupervisorId);
          if (!isEligible) return false;

          const key = `${emp.name.toLowerCase().trim()}_${(emp.matricule || '').toLowerCase().trim()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      const targetSupervisor = supervisors.find(s => String(s.id) === String(selectedSupervisorId));
      const supervisorName = targetSupervisor ? targetSupervisor.name : 'Superviseur';
      const fileName = `exel_to_${supervisorName.replace(/\s+/g, '_')}.xlsx`;

      const notificationTitle = `${responsableName || 'Responsable'} a envoyé un rapport à ${supervisorName} (${latestEmployees.length} employé(s))`;
      const excelTitle = `${responsableName || 'Non spécifié'} a exporté la liste de pointage final (${latestEmployees.length} employé(s))`;

      const headers = [
        'Nom complet', 'Matricule', 'Affaire N°', 'Client', 'Site',
        "Pointage d'entrée", 'Pointage de sortie', 'Statut',
        'Hrs travailées', 'Jrs travaillés', 'Jrs Absence', 'Hrs Dimanche',
        'Jrs Fériés', 'Jrs Fériés Trav.', 'Jrs Congés', 'Jrs Dépl. Maroc',
        'Jrs Paniers', 'Jrs Détente', 'Jrs Dépl. Expat', 'Jrs Récup',
        'Jrs Maladie', 'Chantier/Atelier'
      ];
      const rows = latestEmployees.map(({
        name, matricule, affaireNumero, client, site, pointageEntree, pointageSortie, status,
        totHrsTravaillees, nbrJrsTravaillees, nbrJrsAbsence, totHrsDimanche,
        nbrJrsFeries, nbrJrsFeriesTravailes, nbrJrsConges, nbrJrsDeplacementsMaroc,
        nbrJrsPaniers, nbrJrsDetente, nbrJrsDeplacementsExpatrie, nbrJrsRecuperation,
        nbrJrsMaladie, chantierAtelier
      }) => [
          name, matricule, affaireNumero || '-', client || '-', site || '-',
          pointageEntree || '-', pointageSortie || '-', status || 'En attente',
          formatHours(totHrsTravaillees),
          formatDays(nbrJrsTravaillees),
          formatDays(nbrJrsAbsence),
          formatHours(totHrsDimanche),
          formatDays(nbrJrsFeries),
          formatDays(nbrJrsFeriesTravailes),
          formatDays(nbrJrsConges),
          formatDays(nbrJrsDeplacementsMaroc),
          formatDays(nbrJrsPaniers),
          formatDays(nbrJrsDetente),
          formatDays(nbrJrsDeplacementsExpatrie),
          formatDays(nbrJrsRecuperation),
          formatDays(nbrJrsMaladie),
          chantierAtelier || '-'
        ]);

      const aoa = [
        [excelTitle],
        [],
        headers,
        ...rows
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pointage Final");
      XLSX.writeFile(workbook, fileName);

      const dataToExport = latestEmployees.map((emp) => ({
        'Nom complet': emp.name,
        'Matricule': emp.matricule,
        'Affaire N°': emp.affaireNumero || '-',
        'Client': emp.client || '-',
        'Site': emp.site || '-',
        'Pointage d\'entrée': emp.pointageEntree || '-',
        'Pointage de sortie': emp.pointageSortie || '-',
        'Statut': emp.status || 'En attente',
        'Hrs travailées': formatHours(emp.totHrsTravaillees),
        'Jrs travaillés': formatDays(emp.nbrJrsTravaillees),
        'Jrs Absence': formatDays(emp.nbrJrsAbsence),
        'Hrs Dimanche': formatHours(emp.totHrsDimanche),
        'Jrs Fériés': formatDays(emp.nbrJrsFeries),
        'Jrs Fériés Trav.': formatDays(emp.nbrJrsFeriesTravailes),
        'Jrs Congés': formatDays(emp.nbrJrsConges),
        'Jrs Dépl. Maroc': formatDays(emp.nbrJrsDeplacementsMaroc),
        'Jrs Paniers': formatDays(emp.nbrJrsPaniers),
        'Jrs Détente': formatDays(emp.nbrJrsDetente),
        'Jrs Dépl. Expat': formatDays(emp.nbrJrsDeplacementsExpatrie),
        'Jrs Récup': formatDays(emp.nbrJrsRecuperation),
        'Jrs Maladie': formatDays(emp.nbrJrsMaladie),
        'Chantier/Atelier': emp.chantierAtelier || '-'
      }));

      addNotification(
        notificationTitle,
        'success',
        dataToExport,
        'superviseur',
        selectedSupervisorId
      );

    } catch (error) {
      console.error("Error exporting pointage:", error);
    } finally {
      setIsExporting(false);
      hasNotifiedRef.current = false;
    }
  };

  return (
    <div className="responsable-view">
      <div className="view-header">
        <div className="header-info">
          <h1><FaUserTie /> Espace Responsable</h1>
          <p className="subtitle">Gérez le pointage et transmettez les listes aux superviseurs</p>
        </div>
        <div className="responsable-badge">
          <span className="badge-name">{responsableName}</span>
          <span className="badge-siege">{responsableSiege}</span>
        </div>
      </div>

      <div className="workflow-container">
        {/* STEP 1: SELECT SUPERVISOR */}
        <div className={`workflow-step ${!selectedSupervisorId ? 'active' : 'completed'}`}>
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>Choisir le Superviseur</h3>
            <p>Sélectionnez le destinataire du rapport</p>
            <select
              className="supervisor-selector-main"
              value={selectedSupervisorId}
              onChange={(e) => setSelectedSupervisorId(e.target.value)}
            >
              <option value="">-- Sélectionnez un superviseur --</option>
              {supervisors.map(sup => (
                <option key={sup.id} value={sup.id}>{sup.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* STEP 2: LOAD DATA */}
        <div className={`workflow-step ${selectedSupervisorId ? 'active' : 'disabled'}`}>
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>Charger les Employés</h3>
            <p>Importez votre fichier Excel pour {supervisors.find(s => String(s.id) === String(selectedSupervisorId))?.name || '...'}</p>
            <div className="step-actions">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportEmployees}
                id="import-employees-responsable"
                style={{ display: 'none' }}
                disabled={!selectedSupervisorId}
              />
              <label htmlFor="import-employees-responsable" className="action-btn-primary">
                <FaFileImport /> Importer Excel
              </label>
              <button
                className="action-btn-secondary"
                onClick={() => setShowAddForm(!showAddForm)}
                disabled={!selectedSupervisorId}
              >
                <FaPlus /> {showAddForm ? 'Fermer' : 'Ajout Manuel'}
              </button>
            </div>
          </div>
        </div>

        {/* STEP 3: TRANSMIT */}
        <div className={`workflow-step ${selectedSupervisorId && supervisedEmployees.length > 0 ? 'active' : 'disabled'}`}>
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>Transmettre</h3>
            <p>Envoyez la liste finalisée au superviseur</p>
            <button
              onClick={handleExportFinalExcel}
              className="transmit-btn"
              disabled={!selectedSupervisorId || supervisedEmployees.length === 0 || isExporting}
            >
              {isExporting ? <FaSync className="fa-spin" /> : <FaCheckCircle />}
              {isExporting ? ' Envoi...' : ' Envoyer Rapport'}
            </button>
          </div>
        </div>
      </div>

      <div className="stats-dashboard-responsable">
        <div className="dashboard-card">
          <div className="card-icon blue"><FaUsers /></div>
          <div className="card-data">
            <span className="data-label">Effectif Total</span>
            <span className="data-value">{supervisedEmployees.length}</span>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon green"><FaUserCheck /></div>
          <div className="card-data">
            <span className="data-label">Présents</span>
            <span className="data-value">{supervisedEmployees.filter(e => e.status === 'Présent').length}</span>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon orange"><FaSync /></div>
          <div className="card-data">
            <span className="data-label">À Pointer</span>
            <span className="data-value">{supervisedEmployees.filter(e => e.status === 'En attente').length}</span>
          </div>
        </div>
      </div>

      {showAddForm && (
        <section className="add-employee-card card animate-slide-down">
          <div className="card-header">
            <h3><FaPlus /> Nouvel Employé</h3>
            <button className="close-btn" onClick={() => setShowAddForm(false)}><FaTimes /></button>
          </div>
          <form onSubmit={handleAddEmployee} className="modern-form">
            <div className="form-grid">
              <div className="input-group">
                <label>Nom Complet</label>
                <input
                  type="text"
                  placeholder="Ex: Jean Dupont"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Matricule</label>
                <input
                  type="text"
                  placeholder="Ex: MTR-2024"
                  value={newEmployee.matricule}
                  onChange={(e) => setNewEmployee({ ...newEmployee, matricule: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Affaire N°</label>
                <input
                  type="text"
                  placeholder="N° Affaire"
                  value={newEmployee.affaireNumero}
                  onChange={(e) => setNewEmployee({ ...newEmployee, affaireNumero: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Client</label>
                <input
                  type="text"
                  placeholder="Nom Client"
                  value={newEmployee.client}
                  onChange={(e) => setNewEmployee({ ...newEmployee, client: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Site</label>
                <input
                  type="text"
                  placeholder="Lieu de mission"
                  value={newEmployee.site}
                  onChange={(e) => setNewEmployee({ ...newEmployee, site: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="submit-btn"><FaPlus /> Enregistrer cet employé</button>
          </form>
        </section>
      )}

      <section className="main-table-card card">
        <div className="table-header">
          <h2><FaFileImport /> Liste des Employés : <span>{supervisors.find(s => String(s.id) === String(selectedSupervisorId))?.name || 'Veuillez choisir un superviseur'}</span></h2>
          <div className="table-actions" style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportEmployees} className="btn-icon-label" title="Exporter Liste">
              <FaFileExport /> <span>Liste Excel</span>
            </button>
            {/* <button onClick={fetchEmployeesToSupervise} className="btn-icon" title="Actualiser">
              <FaSync /> 
            </button> */}
            <button
              onClick={handleDeleteList}
              className="btn-icon-label"
              title="Supprimer Liste"
            >
              <FaTrash /> <span>Supprimer Liste</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Matricule</th>
                <th>Affaire</th>
                <th>Site</th>
                <th>Hrs trav.</th>
                <th>Jrs trav.</th>
                <th>Entrée</th>
                <th>Sortie</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-msg">Aucun employé assigné.</td>
                </tr>
              ) : (
                currentItems.map((emp, idx) => (
                  <tr key={emp.id} className={emp.status !== 'En attente' ? 'row-marked' : ''}>
                    {/* <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem' }}>
                      {indexOfFirstItem + idx + 1}
                    </td> */}
                    <td data-label="Nom" style={{ fontWeight: 600 }}>
                      {editingId === emp.id ? (
                        <input name="name" value={editEmployee.name} onChange={handleEditChange} />
                      ) : emp.name}
                    </td>
                    <td data-label="Matricule">
                      {editingId === emp.id ? (
                        <input name="matricule" value={editEmployee.matricule} onChange={handleEditChange} />
                      ) : emp.matricule}
                    </td>
                    <td data-label="Affaire N°">
                      {editingId === emp.id ? (
                        <input name="affaireNumero" value={editEmployee.affaireNumero} onChange={handleEditChange} />
                      ) : emp.affaireNumero || '-'}
                    </td>

                    <td data-label="Site">
                      {editingId === emp.id ? (
                        <input name="site" value={editEmployee.site} onChange={handleEditChange} />
                      ) : emp.site || '-'}
                    </td>
                    <td data-label="Hrs" style={{ fontWeight: 600, color: '#4f46e5' }}>{formatHours(emp.totHrsTravaillees)}</td>
                    <td data-label="Jrs" style={{ fontWeight: 600, color: '#10b981' }}>{formatDays(emp.nbrJrsTravaillees)}</td>
                    <td data-label="Entrée"><span className="time-cell">{emp.pointageEntree}</span></td>
                    <td data-label="Sortie"><span className="time-cell">{emp.pointageSortie}</span></td>
                    <td data-label="Statut">
                      <div className="status-pills">
                        <button
                          onClick={() => markStatus(emp.id, 'Présent')}
                          className={`pill present ${emp.status === 'Présent' ? 'active' : ''}`}
                        >
                          Présent
                        </button>
                        <button
                          onClick={() => markStatus(emp.id, 'Sortie')}
                          className={`pill sortie ${emp.status === 'Sortie' ? 'active' : ''}`}
                        >
                          Sortie
                        </button>
                        <button
                          onClick={() => markStatus(emp.id, 'Absent')}
                          className={`pill absent ${emp.status === 'Absent' ? 'active' : ''}`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td data-label="Actions">
                      {editingId === emp.id ? (
                        <div className="row-actions">
                          <button onClick={() => saveEdit(emp.id)} className="save-btn" title="Sauvegarder"><FaSave /></button>
                          <button onClick={cancelEdit} className="cancel-btn" title="Annuler"><FaTimes /></button>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button onClick={() => startEditing(emp)} className="edit-btn" title="Modifier"><FaEdit /></button>
                          <button onClick={() => setActiveActivityModal(emp)} className="activity-btn" title="Activité Détaillée"><FaClipboardList /></button>
                          <button onClick={() => handleDeleteEmployee(emp.id)} className="delete-btn" title="Supprimer"><FaTrash /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODERN ACTIVITY MODAL */}
        {activeActivityModal && (
          <div className="activity-modal-overlay">
            <div className="activity-modal animate-slide-up">
              <div className="modal-header">
                <div>
                  <h2><FaClipboardList /> Activité Détaillée</h2>
                  <p>{activeActivityModal.name} - {activeActivityModal.matricule}</p>
                </div>
                <button className="close-btn" onClick={() => setActiveActivityModal(null)}><FaTimes /></button>
              </div>

              <div className="modal-content-grid">
                <div className="activity-section">
                  <h4><FaCalendarAlt /> Absences & Congés</h4>
                  <div className="activity-fields">
                    <div className="num-field">
                      <label>Jrs Absence</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.nbrJrsAbsence || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, nbrJrsAbsence: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, nbrJrsAbsence: val });
                        }}
                      />
                    </div>
                    <div className="num-field">
                      <label>Jrs Congés</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.nbrJrsConges || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, nbrJrsConges: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, nbrJrsConges: val });
                        }}
                      />
                    </div>
                    <div className="num-field">
                      <label>Jrs Maladie</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.nbrJrsMaladie || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, nbrJrsMaladie: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, nbrJrsMaladie: val });
                        }}
                      />
                    </div>
                    <div className="num-field">
                      <label>Jrs Récup.</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.nbrJrsRecuperation || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, nbrJrsRecuperation: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, nbrJrsRecuperation: val });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="activity-section">
                  <h4><FaSync /> Heures & Fériés</h4>
                  <div className="activity-fields">
                    <div className="num-field">
                      <label>Hrs Dimanche</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.totHrsDimanche || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, totHrsDimanche: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, totHrsDimanche: val });
                        }}
                      />
                    </div>
                    <div className="num-field">
                      <label>Jrs Fériés</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.nbrJrsFeries || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, nbrJrsFeries: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, nbrJrsFeries: val });
                        }}
                      />
                    </div>
                    <div className="num-field">
                      <label>Jrs Fériés Trav.</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.nbrJrsFeriesTravailes || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, nbrJrsFeriesTravailes: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, nbrJrsFeriesTravailes: val });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="activity-section">
                  <h4><FaHardHat /> Logistique & Terrain</h4>
                  <div className="activity-fields">
                    <div className="num-field">
                      <label>Jrs Dépl. Maroc</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.nbrJrsDeplacementsMaroc || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, nbrJrsDeplacementsMaroc: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, nbrJrsDeplacementsMaroc: val });
                        }}
                      />
                    </div>
                    <div className="num-field">
                      <label>Jrs Dépl. Expat</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.nbrJrsDeplacementsExpatrie || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, nbrJrsDeplacementsExpatrie: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, nbrJrsDeplacementsExpatrie: val });
                        }}
                      />
                    </div>
                    <div className="num-field">
                      <label>Jrs Paniers</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.nbrJrsPaniers || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, nbrJrsPaniers: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, nbrJrsPaniers: val });
                        }}
                      />
                    </div>
                    <div className="num-field">
                      <label>Jrs Détente</label>
                      <input
                        type="number"
                        step="1"
                        value={activeActivityModal.nbrJrsDetente || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, nbrJrsDetente: val } : emp));
                          setActiveActivityModal({ ...activeActivityModal, nbrJrsDetente: val });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="activity-section-full">
                  <div className="text-field">
                    <label>Chantier / Atelier</label>
                    <input
                      type="text"
                      placeholder="Commentaire ou lieu spécifique..."
                      value={activeActivityModal.chantierAtelier || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmployeesPointage(prev => prev.map(emp => emp.id === activeActivityModal.id ? { ...emp, chantierAtelier: val } : emp));
                        setActiveActivityModal({ ...activeActivityModal, chantierAtelier: val });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn-alt" onClick={() => setActiveActivityModal(null)}>Annuler</button>
                <button className="save-btn-alt" onClick={async () => {
                  try {
                    await fetch(`${API_EMPLOYEE}/employees/${activeActivityModal.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(activeActivityModal)
                    });
                    setActiveActivityModal(null);
                  } catch (e) { console.error(e); }
                }}><FaSave /> Sauvegarder l'Activité</button>
              </div>
            </div>
          </div>
        )}
        {supervisedEmployees.length > itemsPerPage && (
          <div className="pagination-container">
            <div className="pagination-info">
              Affichage de <strong>{indexOfFirstItem + 1}</strong> à{' '}
              <strong>{Math.min(indexOfLastItem, supervisedEmployees.length)}</strong> sur{' '}
              <strong>{supervisedEmployees.length}</strong> employés
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className="pagination-btn first"
                title="Première page"
              >
                <FaAngleDoubleLeft />
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn prev"
                title="Précédent"
              >
                <FaChevronLeft />
              </button>

              <div className="pagination-pages">
                {renderPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn next"
                title="Suivant"
              >
                <FaChevronRight />
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn last"
                title="Dernière page"
              >
                <FaAngleDoubleRight />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ResponsablePage;
