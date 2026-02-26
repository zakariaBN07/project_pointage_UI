import React, { useState, useEffect, useContext , useRef  } from 'react';
import * as XLSX from 'xlsx';
import { NotificationContext } from '../../../context/NotificationContext';
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
  FaAngleDoubleRight
} from 'react-icons/fa';
import './Responsable.css';

const Responsable = ({ user }) => {
  const { addNotification } = useContext(NotificationContext);
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;
  const [pointage, setPointage] = useState([]);
  const [status, setStatus] = useState('En attente');
  const [employeesPointage, setEmployeesPointage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [responsableName] = useState(user?.name || '');
  const [responsableSiege, setResponsableSiege] = useState(user?.siege || '');
  const [newEmployee, setNewEmployee] = useState({ 
    name: '', 
    matricule: '', 
    role: 'employé',
    affaireNumber: '',
    client: '',
    site: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editEmployee, setEditEmployee] = useState({ 
    name: '', 
    matricule: '', 
    role: 'employé',
    affaireNumber: '',
    client: '',
    site: ''
  });
  const [showWarning, setShowWarning] = useState(false);
  
  const hasNotifiedRef = useRef(false);

  // Filter for only regular employees
  const supervisedEmployees = employeesPointage.filter(emp => emp.role === 'employé' || !emp.role);

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
      try {
        const response = await fetch(`${API_EMPLOYEE}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...newEmployee, 
            responsableId: user?.id,
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
            affaireNumber: '',
            client: '',
            site: ''
          });
        }
      } catch (error) {
        console.error("Error adding employee:", error);
      }
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      try {
        const response = await fetch(`${API_EMPLOYEE}/employees/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchEmployeesToSupervise();
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  const startEditing = (emp) => {
    setEditingId(emp.id);
    setEditEmployee({ 
      name: emp.name, 
      matricule: emp.matricule, 
      role: emp.role || 'employé',
      affaireNumber: emp.affaireNumber || '',
      client: emp.client || '',
      site: emp.site || ''
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

  useEffect(() => {
    fetchEmployeesToSupervise();
  }, [user?.id]);

  const markStatus = async (id, newStatus) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Find current employee data
    const emp = employeesPointage.find(e => e.id === id);
    if (!emp) return;

    // Optimistic Update
    let updatedEntree = emp.pointageEntree;
    let updatedSortie = emp.pointageSortie;

    if (newStatus === 'Présent') {
      updatedEntree = timeString;
      updatedSortie = '-';
    } else if (newStatus === 'Sortie') {
      updatedSortie = timeString;
    } else if (newStatus === 'Absent') {
      updatedEntree = '-';
      updatedSortie = '-';
    }

    setEmployeesPointage(prev => prev.map(e => 
      e.id === id ? { ...e, status: newStatus, pointageEntree: updatedEntree, pointageSortie: updatedSortie } : e
    ));

    try {
      const response = await fetch(`${API_EMPLOYEE}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...emp,
          status: newStatus, 
          pointageEntree: updatedEntree,
          pointageSortie: updatedSortie
        }),
      });
      
      if (!response.ok) {
        console.error("Failed to update employee status");
        // Rollback on error
        fetchEmployeesToSupervise();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      fetchEmployeesToSupervise();
    }
  };

  const handleExportEmployees = () => {
    const dataToExport = supervisedEmployees.map(({ name, matricule, affaireNumber, client, site }) => ({ 
      'Nom': name, 
      'Matricule': matricule,
      'Affaire N°': affaireNumber || '-',
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
        const affaireNumber = affaireKey ? row[affaireKey] : '-';
        const client = clientKey ? row[clientKey] : '-';
        const site = siteKey ? row[siteKey] : '-';

        if (!name || 
            String(name).toLowerCase().trim() === 'nom complet' || 
            String(name).toLowerCase().trim() === 'nom' ||
            String(name).toLowerCase().trim().includes('total')) continue;

        try {
          await fetch(`${API_EMPLOYEE}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: String(name).trim(),
              matricule: matricule ? String(matricule).trim() : '',
              responsableId: user?.id,
              role: 'employé',
              status: 'En attente',
              pointageEntree: '-',
              pointageSortie: '-',
              affaireNumber: String(affaireNumber).trim(),
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

      const rawData = await response.json();
      const latestEmployees = rawData
        .map(({ password, ...rest }) => rest)
        .filter(emp => emp.role === 'employé' || !emp.role);

      if (!latestEmployees.length) {
        alert("Aucun employé à exporter !");
        return;
      }

      const title = `${responsableName || 'Non spécifié'} (${responsableSiege || 'Non spécifié'}) a exporté la liste de pointage final (${latestEmployees.length} employé(s))`;

      const headers = ['Nom complet', 'Matricule', 'Affaire N°', 'Client', 'Site', "Pointage d'entrée", 'Pointage de sortie', 'Statut'];
      const rows = latestEmployees.map(({ name, matricule, affaireNumber, client, site, pointageEntree, pointageSortie, status }) => [
        name,
        matricule,
        affaireNumber || '-',
        client || '-',
        site || '-',
        pointageEntree || '-',
        pointageSortie || '-',
        status || 'En attente'
      ]);

      const aoa = [
        [title],
        [],
        headers,
        ...rows
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pointage Final");
      XLSX.writeFile(workbook, "Pointage_Final_Employees.xlsx");

      const dataToExport = latestEmployees.map(({ name, matricule, affaireNumber, client, site, pointageEntree, pointageSortie, status }) => ({
        'Nom complet': name,
        'Matricule': matricule,
        'Affaire N°': affaireNumber || '-',
        'Client': client || '-',
        'Site': site || '-',
        'Pointage d\'entrée': pointageEntree || '-',
        'Pointage de sortie': pointageSortie || '-',
        'Statut': status || 'En attente'
      }));

      addNotification(
        `Responsable : ${responsableName || 'Un responsable'} 
de siège : ${responsableSiege || 'Non spécifié'} 
a exporté la liste de pointage final (${latestEmployees.length} employé(s))`,
        'success',
        dataToExport
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
        <h1><FaUsers style={{marginRight: '10px'}} /> Espace Responsable</h1>
      </div>
      
      <div className="stats-container">
        <div className="stat-card">
          <span className="stat-label">Total Employés</span>
          <span className="stat-value">{supervisedEmployees.length}</span>
          <span className="stat-trend trend-up"><FaUsers /> Effectif</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Présents</span>
          <span className="stat-value" style={{ color: '#22c55e' }}>
            {supervisedEmployees.filter(e => e.status === 'Présent').length}
          </span>
          <span className="stat-trend trend-up"><FaUserCheck /> En poste</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">En attente</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>{unmarkedCount}</span>
          <span className="stat-trend" style={{ background: '#fef3c7', color: '#92400e' }}><FaSync className="fa-spin" /> À pointer</span>
        </div>
      </div>
      
      <section className="employees-management card">
        <div className="section-title">
          <h2><FaEdit /> Gestion des Employés</h2>
          <div className="actions-group">
            <button onClick={handleExportEmployees} className="refresh-btn">
              <FaFileExport /> Liste
            </button>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleImportEmployees}
              id="import-employees-responsable"
              style={{ display: 'none' }}
            />
            <label htmlFor="import-employees-responsable" className="refresh-btn">
              <FaFileImport /> Importer
            </label>
            <button 
              onClick={handleExportFinalExcel} 
              className="refresh-btn"
              disabled={isExporting}
              style={{ background: '#10b981', color: 'white', border: 'none' }}
            >
              {isExporting ? <FaSync className="fa-spin" /> : <FaCheckCircle />} 
              {isExporting ? ' Export...' : ' Rapport Final'}
            </button>
          </div>
        </div>

        <form onSubmit={handleAddEmployee} className="add-employee-form">
          <input
            type="text"
            placeholder="Nom complet"
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Matricule"
            value={newEmployee.matricule}
            onChange={(e) => setNewEmployee({ ...newEmployee, matricule: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Affaire N°"
            value={newEmployee.affaireNumber}
            onChange={(e) => setNewEmployee({ ...newEmployee, affaireNumber: e.target.value })}
          />
          <input
            type="text"
            placeholder="Client"
            value={newEmployee.client}
            onChange={(e) => setNewEmployee({ ...newEmployee, client: e.target.value })}
          />
          <input
            type="text"
            placeholder="Site"
            value={newEmployee.site}
            onChange={(e) => setNewEmployee({ ...newEmployee, site: e.target.value })}
          />
          <button type="submit" className="add-btn"><FaPlus /> Ajouter</button>
        </form>

        <div className="table-responsive">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Matricule</th>
                <th>Affaire N°</th>
                <th>Client</th>
                <th>Site</th>
                <th>Entrée</th>
                <th>Sortie</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-msg">Aucun employé assigné.</td>
                </tr>
              ) : (
                currentItems.map((emp) => (
                  <tr key={emp.id} className={emp.status !== 'En attente' ? 'row-marked' : ''}>
                    <td style={{ fontWeight: 600 }}>
                      {editingId === emp.id ? (
                        <input name="name" value={editEmployee.name} onChange={handleEditChange} />
                      ) : emp.name}
                    </td>
                    <td>
                      {editingId === emp.id ? (
                        <input name="matricule" value={editEmployee.matricule} onChange={handleEditChange} />
                      ) : emp.matricule}
                    </td>
                    <td>
                      {editingId === emp.id ? (
                        <input name="affaireNumber" value={editEmployee.affaireNumber} onChange={handleEditChange} />
                      ) : emp.affaireNumber || '-'}
                    </td>
                    <td>
                      {editingId === emp.id ? (
                        <input name="client" value={editEmployee.client} onChange={handleEditChange} />
                      ) : emp.client || '-'}
                    </td>
                    <td>
                      {editingId === emp.id ? (
                        <input name="site" value={editEmployee.site} onChange={handleEditChange} />
                      ) : emp.site || '-'}
                    </td>
                    <td><span className="time-cell">{emp.pointageEntree}</span></td>
                    <td><span className="time-cell">{emp.pointageSortie}</span></td>
                    <td>
                      <div className="status-actions">
                        <button 
                          onClick={() => markStatus(emp.id, 'Présent')}
                          className={`status-btn present ${emp.status === 'Présent' ? 'active' : ''}`}
                          title="Présent"
                        >
                          P
                        </button>
                        <button 
                          onClick={() => markStatus(emp.id, 'Sortie')}
                          className={`status-btn sortie ${emp.status === 'Sortie' ? 'active' : ''}`}
                          title="Sortie"
                        >
                          S
                        </button>
                        <button 
                          onClick={() => markStatus(emp.id, 'Absent')}
                          className={`status-btn absent ${emp.status === 'Absent' ? 'active' : ''}`}
                          title="Absent"
                        >
                          A
                        </button>
                      </div>
                    </td>
                    <td>
                      {editingId === emp.id ? (
                        <div className="row-actions">
                          <button onClick={() => saveEdit(emp.id)} className="save-btn" title="Sauvegarder"><FaSave /></button>
                          <button onClick={cancelEdit} className="cancel-btn" title="Annuler"><FaTimes /></button>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button onClick={() => startEditing(emp)} className="edit-btn" title="Modifier"><FaEdit /></button>
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
        {supervisedEmployees.length > itemsPerPage && (
          <div className="pagination-container">
            <div className="pagination-info">
              Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, supervisedEmployees.length)} sur {supervisedEmployees.length} employés
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

export default Responsable;
