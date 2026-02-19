import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './Superviseur.css';

const Superviseur = () => {
  const API_URL = import.meta.env.VITE_APP_API_BASE_URL;
  const [pointage, setPointage] = useState([]);
  const [status, setStatus] = useState('En attente');
  const [employeesPointage, setEmployeesPointage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmployee, setNewEmployee] = useState({ name: '', matricule: '', role: 'employé' });
  const [editingId, setEditingId] = useState(null);
  const [editEmployee, setEditEmployee] = useState({ name: '', matricule: '', role: 'employé' });

  // Filter for only regular employees
  const supervisedEmployees = employeesPointage.filter(emp => emp.role === 'employé' || !emp.role);

  // Fetch employees to supervise from API
  const fetchEmployeesToSupervise = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/employees`);
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
        const response = await fetch(`${API_URL}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newEmployee, status: 'En attente', pointageEntree: '-', pointageSortie: '-' }),
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
        const response = await fetch(`${API_URL}/employees/${id}`, {
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
      const response = await fetch(`${API_URL}/employees/${id}`, {
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
  }, []);

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
    const timeString = now.toLocaleTimeString();
    
    // Find current employee data
    const emp = employeesPointage.find(e => e.id === id);
    if (!emp) return;

    // Optimistic Update
    let updatedEntree = emp.pointageEntree || '-';
    let updatedSortie = emp.pointageSortie || '-';

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
      const response = await fetch(`${API_URL}/employees/${id}`, {
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
        // Rollback on error
        fetchEmployeesToSupervise();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      fetchEmployeesToSupervise();
    }
  };

  const handleExportFinalExcel = () => {
    const dataToExport = employeesPointage.map(({ name, matricule, pointageEntree, pointageSortie, status }) => ({
      'Nom de l\'employé': name,
      'Matricule': matricule,
      'Pointage d\'entrée': pointageEntree,
      'Pointage de sortie': pointageSortie,
      'Statut': status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pointage Final");
    XLSX.writeFile(workbook, "Pointage_Final_Employees.xlsx");
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
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Gestion des Employés</h2>
          <button 
            onClick={handleExportFinalExcel} 
            className="export-btn" 
            disabled={supervisedEmployees.length === 0}
            style={{ backgroundColor: '#217346', color: 'white', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: supervisedEmployees.length === 0 ? 0.5 : 1 }}
          >
            Exporter Excel Final
          </button>
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
    </div>
  );
};

export default Superviseur;
