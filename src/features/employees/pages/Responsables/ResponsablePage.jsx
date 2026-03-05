import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { NotificationContext } from '../../../notifications/NotificationContext';
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
  const API_PROJECT = import.meta.env.VITE_APP_API_PROJECTS_URL;
  const [employeesPointage, setEmployeesPointage] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [projectPages, setProjectPages] = useState({});
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
    plannedHours: 0,
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
    plannedHours: 0,
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

  // ─── Project-level planned hours ─────────────────────────────────────
  // Map of affaireNumero → input value (local UI state, ephemeral until applied)
  const [projectPlannedHours, setProjectPlannedHours] = useState({});
  const [applyingProject, setApplyingProject] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);

  const toggleProjectExpand = (affaire) =>
    setExpandedProject(prev => prev === affaire ? null : affaire);

  const hasNotifiedRef = useRef(false);

  // Filter for only regular employees and by selected supervisor
  const supervisedEmployees = employeesPointage.filter(emp => {
    const isRegular = emp.role === 'employé' || !emp.role;
    const matchesSupervisor = selectedSupervisorId ? String(emp.supervisorId) === String(selectedSupervisorId) : true;
    return isRegular && matchesSupervisor;
  });

  // ─── Group supervised employees by affaireNumero ──────────────────────
  const employeesByProject = useMemo(() => {
    const groups = {};
    supervisedEmployees.forEach(emp => {
      const key = emp.affaireNumero || 'Sans Affaire';
      if (!groups[key]) groups[key] = [];
      groups[key].push(emp);
    });
    return groups;
  }, [supervisedEmployees]);

  // Sorted list of distinct project keys
  const projectKeys = useMemo(() => Object.keys(employeesByProject).sort(), [employeesByProject]);

  // ─── Bulk apply planned hours to all employees in a project ───────────
  const applyPlannedHoursToProject = async (affaireNumero) => {
    const hours = parseFloat(projectPlannedHours[affaireNumero]) || 0;
    const employees = employeesByProject[affaireNumero] || [];
    if (employees.length === 0) return;
    setApplyingProject(affaireNumero);
    try {
      await Promise.all(
        employees.map(emp =>
          fetch(`${API_EMPLOYEE}/employees/${emp.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...emp, plannedHours: hours })
          })
        )
      );
      // Update local state so table reflects new value immediately
      setEmployeesPointage(prev =>
        prev.map(e =>
          (e.affaireNumero || 'Sans Affaire') === affaireNumero
            ? { ...e, plannedHours: hours }
            : e
        )
      );
    } catch (err) {
      console.error('applyPlannedHoursToProject error:', err);
      alert('Erreur lors de la mise à jour des heures planifiées.');
    } finally {
      setApplyingProject(null);
    }
  };

  // ─── Pagination helpers for project groups ────────────────────────────
  const handleProjectPageChange = (affaire, newPage) => {
    setProjectPages(prev => ({ ...prev, [affaire]: newPage }));
  };

  const getPaginatedItems = (items, page) => {
    const start = (page - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  const renderProjectPageNumbers = (totalItems, currentPage, affaire) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end === totalPages) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="pagination-container" style={{ marginTop: '1.5rem', borderTop: '1px solid #eef2ff', paddingTop: '1.5rem' }}>
        <div className="pagination-info" style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong> ({totalItems} employés)
        </div>
        <div className="pagination-controls">
          <button
            onClick={() => handleProjectPageChange(affaire, 1)}
            disabled={currentPage === 1}
            className="pagination-btn first"
          >
            <FaAngleDoubleLeft />
          </button>
          <button
            onClick={() => handleProjectPageChange(affaire, currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn prev"
          >
            <FaChevronLeft />
          </button>

          <div className="pagination-pages">
            {pages.map(p => (
              <button
                key={p}
                onClick={() => handleProjectPageChange(affaire, p)}
                className={`pagination-number ${currentPage === p ? 'active' : ''}`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleProjectPageChange(affaire, currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn next"
          >
            <FaChevronRight />
          </button>
          <button
            onClick={() => handleProjectPageChange(affaire, totalPages)}
            disabled={currentPage === totalPages}
            className="pagination-btn last"
          >
            <FaAngleDoubleRight />
          </button>
        </div>
      </div>
    );
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
        // Filter client-side to ensure only employees for this responsable are shown.
        // Some backends may not support the ?responsableId= query reliably,
        // so enforce the restriction locally to avoid showing the full list.
        const visible = user?.id
          ? initializedData.filter(emp => String(emp.responsableId) === String(user.id))
          : initializedData;
        setEmployeesPointage(visible);
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
        alert(`L'employé "${newEmployee.name}" avec le matricule "${newEmployee.matricule}" existe déjà.`);
        return;
      }

      try {
        const projectId = getProjectIdByAffaire(newEmployee.affaireNumero);
        const response = await fetch(`${API_EMPLOYEE}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newEmployee,
            responsableId: user?.id,
            supervisorId: newEmployee.supervisorId || selectedSupervisorId,
            projectId: projectId,
            status: 'En attente',
            pointageEntree: '-',
            pointageSortie: '-'
          }),
        });
        if (response.ok) {
          fetchEmployeesToSupervise();
          setNewEmployee({
            name: '',
            matricule: '',
            role: 'employé',
            affaireNumero: '',
            client: '',
            site: '',
            plannedHours: 0,
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
            chantierAtelier: '',
            projectProgress: 0
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
    } catch (error) {
      console.error("Erreur suppression liste:", error);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet employé ?")) {
      try {
        const response = await fetch(`${API_EMPLOYEE}/employees/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchEmployeesToSupervise();
          alert("Employé supprimé avec succès.");
        } else {
          alert("Erreur lors de la suppression.");
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Erreur de connexion au serveur.");
      }
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
      // plannedHours is now project-level only — not editable per row
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

  // Fetch all projects to link employees by affaireNumero
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_PROJECT}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Helper: find projectId by affaireNumero
  const getProjectIdByAffaire = (affaireNumero) => {
    if (!affaireNumero) return null;
    const project = projects.find(p => String(p.affaireNumero) === String(affaireNumero));
    return project?.id || null;
  };

  useEffect(() => {
    document.title = "Espace Responsable | Pointage SI";
    fetchEmployeesToSupervise();
    fetchSupervisors();
    fetchProjects();
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

      if (entreeHours !== null && sortieHours !== null) {
        let sessionHours = sortieHours - entreeHours;
        if (sessionHours < 0) {
          sessionHours += 24; // Handle overnight shift
        }
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

  // mark all supervised employees as present
  const markAllPresent = () => {
    supervisedEmployees.forEach(emp => {
      if (emp.status !== 'Présent') {
        markStatus(emp.id, 'Présent');
      }
    });
  };

  const markAllSortie = () => {
    supervisedEmployees.forEach(emp => {
      if (emp.status !== 'Sortie') {
        markStatus(emp.id, 'Sortie');
      }
    });
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
        const plannedHoursKey = keys.find(k => k.toLowerCase().trim().includes('planned hours'));

        const name = nameKey ? row[nameKey] : null;
        const matricule = matriculeKey ? row[matriculeKey] : null;
        const affaireNumero = affaireKey ? row[affaireKey] : '-';
        const client = clientKey ? row[clientKey] : '-';
        const site = siteKey ? row[siteKey] : '-';
        const plannedHours = plannedHoursKey ? row[plannedHoursKey] : 0;

        if (!name ||
          String(name).toLowerCase().trim() === 'nom complet' ||
          String(name).toLowerCase().trim() === 'nom' ||
          String(name).toLowerCase().trim().includes('total')) continue;

        const normalizedName = String(name).trim();
        const normalizedMatricule = matricule ? String(matricule).trim() : '';

        // Prevent duplicates within the same supervisor only
        // (other supervisors may legitimately have the same employee)
        const existingUnderSupervisor = employeesPointage
          .filter(emp => String(emp.supervisorId) === String(selectedSupervisorId))
          .some(emp =>
            emp.name.toLowerCase().trim() === normalizedName.toLowerCase() &&
            emp.matricule.toLowerCase().trim() === normalizedMatricule.toLowerCase()
          );

        if (existingUnderSupervisor) {
          console.warn(`Skipping duplicate for this supervisor: ${normalizedName} (${normalizedMatricule})`);
          continue;
        }

        try {
          const normalizedAffaire = String(affaireNumero).trim();
          const projectId = getProjectIdByAffaire(normalizedAffaire);
          await fetch(`${API_EMPLOYEE}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: normalizedName,
              matricule: normalizedMatricule,
              responsableId: user?.id,
              supervisorId: selectedSupervisorId || '',
              projectId: projectId,
              role: 'employé',
              status: 'En attente',
              pointageEntree: '-',
              pointageSortie: '-',
              affaireNumero: normalizedAffaire,
              client: String(client).trim(),
              site: String(site).trim(),
              plannedHours: plannedHours || 0,
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
        'Nom complet', 'Matricule', 'Affaire N°', 'Client', 'Site', 'Heures Planifiées',
        "Pointage d'entrée", 'Pointage de sortie', 'Statut',
        'Hrs travailées', 'Jrs travaillés', 'Jrs Absence', 'Hrs Dimanche',
        'Jrs Fériés', 'Jrs Fériés Trav.', 'Jrs Congés', 'Jrs Dépl. Maroc',
        'Jrs Paniers', 'Jrs Détente', 'Jrs Dépl. Expat', 'Jrs Récup',
        'Jrs Maladie', 'Chantier/Atelier'
      ];
      const rows = latestEmployees.map(({
        name, matricule, affaireNumero, client, site, plannedHours, pointageEntree, pointageSortie, status,
        totHrsTravaillees, nbrJrsTravaillees, nbrJrsAbsence, totHrsDimanche,
        nbrJrsFeries, nbrJrsFeriesTravailes, nbrJrsConges, nbrJrsDeplacementsMaroc,
        nbrJrsPaniers, nbrJrsDetente, nbrJrsDeplacementsExpatrie, nbrJrsRecuperation,
        nbrJrsMaladie, chantierAtelier
      }) => [
          name, matricule, affaireNumero || '-', client || '-', site || '-',
          plannedHours || 0,
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
        'Planned Hours': emp.plannedHours || 0,
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
              <div className="input-group">
                <label> Planifier </label>
                <input type="number"
                  placeholder=' Ex:2000h '
                  min={0}
                  value={newEmployee.plannedHours}
                  onChange={(e) => setNewEmployee({ ...newEmployee, plannedHours: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="submit-btn"><FaPlus /> Enregistrer cet employé</button>
          </form>
        </section>
      )}

      {/* ── Project Planning Panel (accordion) ────────────────────── */}
      {projectKeys.length > 0 && (
        <section className="project-planning-panel card animate-slide-down">
          <div className="ppp-header">
            <div className="ppp-title">
              <FaHardHat />
              <span>Heures Planifiées par Projet</span>
              <span className="ppp-badge">{projectKeys.length} projet{projectKeys.length > 1 ? 's' : ''}</span>
            </div>

            <p className="ppp-hint">Cliquez sur un projet pour voir ses employés. Définissez les heures planifiées et cliquez <strong>Appliquer</strong>.</p>
          </div>

          <button onClick={markAllPresent} className="btn-icon-label" title="Marquer tous présents">
            <FaUserCheck /> <span>Tous Présents</span>
          </button>
          <button onClick={markAllSortie} className="btn-icon-label" title="Marquer tous en sortie">
            <FaUserTimes /> <span>Tous en Sortie</span>
          </button>

          <div className="ppp-rows">
            {projectKeys.map(affaire => {
              const emps = employeesByProject[affaire] || [];
              const totalWorked = emps.reduce((sum, e) => sum + (e.totHrsTravaillees || 0), 0);
              const currentPlanned = emps[0]?.plannedHours || 0;
              const inputVal = projectPlannedHours[affaire] !== undefined
                ? projectPlannedHours[affaire]
                : currentPlanned;
              const isApplying = applyingProject === affaire;
              const isExpanded = expandedProject === affaire;

              return (
                <div key={affaire} className={`ppp-group ${isExpanded ? 'ppp-group-expanded' : ''}`}>

                  {/* Clickable header row */}
                  <div
                    className="ppp-row"
                    onClick={e => {
                      // Don't collapse when clicking inputs/buttons
                      if (e.target.closest('.ppp-input-group') || e.target.closest('.ppp-apply-btn')) return;
                      toggleProjectExpand(affaire);
                    }}
                  >
                    <div className="ppp-affaire">
                      <span className="ppp-num">#{affaire}</span>
                    </div>

                    <div className="ppp-stat">
                      <span className="ppp-stat-label">SUPERVISEUR</span>
                      <span className="ppp-stat-value">
                        {supervisors.find(s => String(s.id) === String(emps[0]?.supervisorId))?.name || '—'}
                      </span>
                    </div>

                    <div className="ppp-stat">
                      <span className="ppp-stat-label">EFFECTIF</span>
                      <span className="ppp-stat-value">{emps.length}</span>
                    </div>

                    <div className="ppp-stat">
                      <span className="ppp-stat-label">HRS TRAVAILLÉES</span>
                      <span className="ppp-stat-value highlight">{formatHours(totalWorked)}</span>
                    </div>

                    <div className="ppp-stat">
                      <span className="ppp-stat-label">PLANIFIÉ ACTUEL</span>
                      <span className="ppp-stat-value">{currentPlanned ? `${currentPlanned}h` : '—'}</span>
                    </div>

                    <div className="ppp-input-group" onClick={e => e.stopPropagation()}>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={inputVal === 0 && projectPlannedHours[affaire] === undefined ? '' : inputVal}
                        onChange={e => setProjectPlannedHours(prev => ({ ...prev, [affaire]: e.target.value }))}
                        className="ppp-input"
                        disabled={isApplying}
                      />
                      <span className="ppp-unit">h</span>
                    </div>

                    <button
                      className={`ppp-apply-btn ${isApplying ? 'loading' : ''}`}
                      onClick={e => { e.stopPropagation(); applyPlannedHoursToProject(affaire); }}
                      disabled={isApplying || projectPlannedHours[affaire] === undefined || String(projectPlannedHours[affaire]).trim() === ''}
                    >
                      {isApplying ? (
                        <FaSync className="fa-spin" />
                      ) : (
                        <><FaArrowRight /> Appliquer à tous</>
                      )}
                    </button>

                    <div className="ppp-expand-icon">
                      {isExpanded ? <FaTimes /> : <FaPlus />}
                    </div>
                  </div>

                  {/* Expandable employee sub-table */}
                  {isExpanded && (
                    <div className="ppp-details animate-slide-down">
                      <div className="table-responsive">
                        <table className="employees-table ppp-sub-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Nom</th>
                              <th>Matricule</th>
                              <th>Affaire</th>
                              <th>Site</th>
                              <th>Planned Hours</th>
                              <th>Hrs trav.</th>
                              <th>Jrs trav.</th>
                              <th>Entrée</th>
                              <th>Sortie</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const currentPage = projectPages[affaire] || 1;
                              const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
                              const currentProjectItems = getPaginatedItems(emps, currentPage);

                              if (currentProjectItems.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan="12" className="empty-msg">Aucun employé assigné.</td>
                                  </tr>
                                );
                              }

                              return currentProjectItems.map((emp, idx) => (
                                <tr key={emp.id} className={emp.status !== 'En attente' ? 'row-marked' : ''}>
                                  <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem' }}>
                                    {indexOfFirstItem + idx + 1}
                                  </td>
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
                                  <td data-label="Planned Hours">
                                    <span className="planned-hours-badge">
                                      {emp.plannedHours ? `${emp.plannedHours}h` : '—'}
                                    </span>
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
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>


                      {/* Pagination for this project group */}
                      {renderProjectPageNumbers(emps.length, projectPages[affaire] || 1, affaire)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default ResponsablePage;
