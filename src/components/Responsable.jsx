import React, { useState, useEffect } from 'react';
import './Responsable.css';

const Responsable = () => {
  const API_URL = import.meta.env.VITE_APP_API_BASE_URL;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/employees`);
      if (response.ok) {
        const data = await response.json();
        // Map API data to our report format
        const formattedData = data.map(emp => ({
          id: emp.id,
          name: emp.name,
          status: emp.status || 'En attente',
          arrivee: emp.pointageEntree || '-',
          depart: emp.pointageSortie || '-'
        }));
        setReports(formattedData);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const stats = {
    total: reports.length,
    present: reports.filter(r => r.status === 'Présent').length,
    absent: reports.filter(r => r.status === 'Absent').length
  };

  return (
    <div className="responsable-container">
      <h1>Espace Responsable</h1>
      <p>Consultation des rapports de pointage et présence.</p>

      <div className="reports-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Rapport Journalier</h2>
          <button onClick={fetchReports} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Actualiser</button>
        </div>
        
        {loading ? (
          <p>Chargement des rapports...</p>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Nom de l'Employé</th>
                <th>Statut</th>
                <th>Heure d'Entrée</th>
                <th>Heure de Sortie</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>Aucun rapport disponible.</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.name}</td>
                    <td><span className={`badge ${report.status === 'Présent' ? 'success' : 'warning'}`}>{report.status}</span></td>
                    <td>{report.arrivee}</td>
                    <td>{report.depart}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="stats-section">
        <h3>Statistiques Rapides</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Employés</h4>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card">
            <h4>Présents Aujourd'hui</h4>
            <p>{stats.present}</p>
          </div>
          <div className="stat-card">
            <h4>Absences</h4>
            <p>{stats.absent}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Responsable;
