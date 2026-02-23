import React, { useState, useEffect, useContext } from 'react';
import * as XLSX from 'xlsx';
import { NotificationContext } from '../../../context/NotificationContext';
import './Superviseur.css';

const Superviseur = ({ user }) => {
  const { addNotification } = useContext(NotificationContext);
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;
  const [pointage, setPointage] = useState([]);
  const [status, setStatus] = useState('En attente');
  const [employeesPointage, setEmployeesPointage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [supervisorName, setSupervisorName] = useState(user?.name || '');
  const [newEmployee, setNewEmployee] = useState({ name: '', matricule: '', role: 'employé' });
  const [editingId, setEditingId] = useState(null);
  const [editEmployee, setEditEmployee] = useState({ name: '', matricule: '', role: 'employé' });
  const [showWarning, setShowWarning] = useState(false);

  // Filter for only regular employees
  const supervisedEmployees = employeesPointage.filter(emp => emp.role === 'employé' || !emp.role);
  
  // Count employees with status "En attente"
  const unmarkedEmployees = supervisedEmployees.filter(emp => emp.status === 'En attente');
  const unmarkedCount = unmarkedEmployees.length;

  // Fetch employees to supervise from API
  const fetchEmployeesToSupervise = async () => {
    try {
      setLoading(true);
      const url = user?.id 
        ? `${API_EMPLOYEE}/employees?supervisorId=${user.id}`
        : `${API_EMPLOYEE}/employees`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Initialize with default status if not present
        const initializedData = data.map(emp => ({
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
            supervisorId: user?.id,
            status: 'En attente', 
            pointageEntree: '-', 
            pointageSortie: '-' 
          }),
        });
        if (response.ok) {
          fetchEmployeesToSupervise();
          setNewEmployee({ name: '', matricule: '', role: 'employé' });
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
    setEditEmployee({ name: emp.name, matricule: emp.matricule, role: emp.role || 'employé' });
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

  const handlePointage = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    const newRecord = { date: dateString, time: timeString, action: status === 'En attente' ? 'Entrée' : 'Sortie' };
    setPointage([...pointage, newRecord]);
    setStatus(status === 'En attente' ? 'Pointé' : 'En attente');
  };

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

  const handleExportFinalExcel = async () => {
    setIsExporting(true);
    try {
      const url = user?.id 
        ? `${API_EMPLOYEE}/employees?supervisorId=${user.id}`
        : `${API_EMPLOYEE}/employees`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch latest employee data');
        setIsExporting(false);
        return;
      }

      const latestData = await response.json();
      const latestEmployees = latestData.filter(emp => emp.role === 'employé' || !emp.role);

      const dataToExport = latestEmployees.map(({ name, matricule, pointageEntree, pointageSortie, status }) => ({
        'Superviseur': supervisorName || 'Non spécifié',
        'Nom de l\'employé': name,
        'Matricule': matricule,
        'Pointage d\'entrée': pointageEntree || '-',
        'Pointage de sortie': pointageSortie || '-',
        'Statut': status || 'En attente'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pointage Final");
      XLSX.writeFile(workbook, "Pointage_Final_Employees.xlsx");

      addNotification(
        `${user.name || 'Un superviseur'} a exporté la liste de pointage final (${latestEmployees.length} employé(s))`,
        'success',
        dataToExport
      );
    } catch (error) {
      console.error("Error exporting pointage:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="superviseur-container">
      <h1>Espace Superviseur</h1>
      
      <section className="own-pointage">
        <h2>Mon Pointage Personnel</h2>
        <div className="status-section">
          <h3>Statut Actuel: <span className={status === 'Pointé' ? 'status-active' : 'status-inactive'}>{status}</span></h3>
          <button onClick={handlePointage} className="pointage-btn">
            {status === 'En attente' ? 'Marquer l\'entrée' : 'Marquer la sortie'}
          </button>
        </div>

        <div className="history-section">
          <h3>Mon Historique</h3>
          {pointage.length === 0 ? (
            <p>Aucun pointage enregistré pour le moment.</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pointage.map((record, index) => (
                  <tr key={index}>
                    <td>{record.date}</td>
                    <td>{record.time}</td>
                    <td>{record.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <hr className="divider" />

      <section className="employees-management">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Gestion des Employés</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Votre nom (Superviseur)" 
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={() => unmarkedCount > 0 ? setShowWarning(true) : handleExportFinalExcel()} 
                className="export-btn" 
                disabled={supervisedEmployees.length === 0 || isExporting}
                style={{ backgroundColor: unmarkedCount > 0 ? '#f59e0b' : '#217346', color: 'white', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '4px', cursor: isExporting ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: supervisedEmployees.length === 0 || isExporting ? 0.5 : 1 }}
              >
                {isExporting ? '⏳ Export en cours...' : 'Exporter Excel Final'}
              </button>
              {unmarkedCount > 0 && (
                <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: '500' }}>
                  ⚠️ {unmarkedCount} employé(s) non marqué(s)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="add-employee-form" style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3>Ajouter un nouvel employé</h3>
          <form onSubmit={handleAddEmployee} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Nom de l'employé"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              required
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="Matricule"
              value={newEmployee.matricule}
              onChange={(e) => setNewEmployee({ ...newEmployee, matricule: e.target.value })}
              required
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button type="submit" className="pointage-btn" style={{ padding: '0.5rem 1rem' }}>Ajouter</button>
          </form>
        </div>

        {loading ? (
          <p>Chargement des employés...</p>
        ) : supervisedEmployees.length === 0 ? (
          <p>Aucun employé à superviser.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Matricule</th>
                <th>Pointage d'entrée</th>
                <th>Pointage de sortie</th>
                <th>Statut</th>
                <th>Actions de Pointage</th>
                <th>Actions de Gestion</th>
              </tr>
            </thead>
            <tbody>
              {supervisedEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    {editingId === emp.id ? (
                      <input
                        type="text"
                        name="name"
                        value={editEmployee.name}
                        onChange={handleEditChange}
                        style={{ width: '100%', padding: '4px' }}
                      />
                    ) : (
                      emp.name
                    )}
                  </td>
                  <td>
                    {editingId === emp.id ? (
                      <input
                        type="text"
                        name="matricule"
                        value={editEmployee.matricule}
                        onChange={handleEditChange}
                        style={{ width: '100%', padding: '4px' }}
                      />
                    ) : (
                      emp.matricule
                    )}
                  </td>
                  <td>{emp.pointageEntree}</td>
                  <td>{emp.pointageSortie}</td>
                  <td>
                    <span className={`status-badge ${
                      emp.status === 'Présent' ? 'present' : 
                      emp.status === 'Absent' ? 'absent' : 
                      emp.status === 'Sortie' ? 'absent' : 'pending'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button 
                        onClick={() => markStatus(emp.id, 'Présent')} 
                        className="status-btn present-btn"
                        disabled={emp.status === 'Présent' || editingId === emp.id}
                      >
                        Entrée
                      </button>
                      <button 
                        onClick={() => markStatus(emp.id, 'Sortie')} 
                        className="status-btn"
                        style={{ backgroundColor: '#FF9800', color: 'white' }}
                        disabled={emp.status !== 'Présent' || editingId === emp.id}
                      >
                        Sortie
                      </button>
                      <button 
                        onClick={() => markStatus(emp.id, 'Absent')} 
                        className="status-btn absent-btn"
                        disabled={emp.status === 'Absent' || editingId === emp.id}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="action-btns">
                      {editingId === emp.id ? (
                        <>
                          <button onClick={() => saveEdit(emp.id)} className="status-btn present-btn" style={{ backgroundColor: '#2196F3' }}>Enregistrer</button>
                          <button onClick={cancelEdit} className="status-btn" style={{ backgroundColor: '#757575', color: 'white' }}>Annuler</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(emp)} className="status-btn" style={{ backgroundColor: '#FF9800', color: 'white' }}>Modifier</button>
                          <button onClick={() => handleDeleteEmployee(emp.id)} className="status-btn" style={{ backgroundColor: '#f44336', color: 'white' }}>Supprimer</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>⚠️ Attention</h3>
            <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
              {unmarkedCount} employé(s) n'ont pas encore été marqué(s) avec un statut (Entrée, Sortie ou Absent).
            </p>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
              Voulez-vous continuer l'exportation malgré tout ?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowWarning(false)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#f9fafb', cursor: 'pointer', fontWeight: '500' }}
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  setShowWarning(false);
                  handleExportFinalExcel();
                }}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', background: '#f59e0b', color: 'white', cursor: 'pointer', fontWeight: '500' }}
              >
                Exporter quand même
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Superviseur;
