import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './Superviseur.css';

const Superviseur = () => {
  const API_URL = import.meta.env.VITE_APP_API_BASE_URL;
  const [pointage, setPointage] = useState([]);
  const [status, setStatus] = useState('En attente');
  const [employeesPointage, setEmployeesPointage] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch employees to supervise from API
  const fetchEmployeesToSupervise = async () => {
    try {
      setLoading(true);
      // Assuming there's an endpoint to get employees for this supervisor
      // For now we fetch all and can filter or just use them as mock if API doesn't support specific supervisor list yet
      const response = await fetch(`${API_URL}/employees`);
      if (response.ok) {
        const data = await response.json();
        // Initialize with default status if not present
        const initializedData = data.map(emp => ({
          ...emp,
          pointage: emp.pointage || '-',
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
    
    // Find current employee data to send full object for PUT
    const emp = employeesPointage.find(e => e.id === id);
    if (!emp) return;

    try {
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...emp,
          status: newStatus, 
          pointage: newStatus === 'Présent' ? timeString : '-' 
        }),
      });
      
      if (response.ok) {
        fetchEmployeesToSupervise(); // Refresh list from DB
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleExportFinalExcel = () => {
    const dataToExport = employeesPointage.map(({ name, matricule, pointage, status }) => ({
      'Nom de l\'employé': name,
      'Matricule': matricule,
      'Pointage': pointage,
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
          <h2>Pointage des Employés sous ma supervision</h2>
          <button 
            onClick={handleExportFinalExcel} 
            className="export-btn" 
            disabled={employeesPointage.length === 0}
            style={{ backgroundColor: '#217346', color: 'white', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: employeesPointage.length === 0 ? 0.5 : 1 }}
          >
            Exporter Excel Final
          </button>
        </div>

        {loading ? (
          <p>Chargement des employés...</p>
        ) : employeesPointage.length === 0 ? (
          <p>Aucun employé à superviser.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Matricule</th>
                <th>Pointage</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeesPointage.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.matricule}</td>
                  <td>{emp.pointage}</td>
                  <td>
                    <span className={`status-badge ${emp.status === 'Présent' ? 'present' : 'absent'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button 
                        onClick={() => markStatus(emp.id, 'Présent')} 
                        className="status-btn present-btn"
                        disabled={emp.status === 'Présent'}
                      >
                        Présent
                      </button>
                      <button 
                        onClick={() => markStatus(emp.id, 'Absent')} 
                        className="status-btn absent-btn"
                        disabled={emp.status === 'Absent'}
                      >
                        Absent
                      </button>
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
