import React, { useState, useEffect, useContext } from 'react';
import * as XLSX from 'xlsx';
import { NotificationContext } from '../../../context/NotificationContext';
import { 
  FaSync, 
  FaFileExport, 
  FaFileImport, 
  FaClipboardList,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaArrowRight
} from 'react-icons/fa';
import './Superviseur.css';

const Superviseur = ({ user }) => {
  const { addNotification } = useContext(NotificationContext);
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchReports = async () => {
    try {
      setLoading(true);
      const url = user?.id 
        ? `${API_EMPLOYEE}/employees?supervisorId=${user.id}`
        : `${API_EMPLOYEE}/employees`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map(emp => ({
          id: emp.id,
          name: emp.name,
          status: emp.status || 'En attente',
          arrivee: emp.pointageEntree || '-',
          depart: emp.pointageSortie || '-',
          affaireNumber: emp.affaireNumber || '-',
          client: emp.client || '-',
          site: emp.site || '-'
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
  }, [user?.id]);

  const handleExportEmployees = () => {
    const dataToExport = reports.map(({ name, affaireNumber, client, site }) => ({ 
      'Nom': name,
      'Affaire N°': affaireNumber,
      'Client': client,
      'Site': site
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
      
      // Convert to array of arrays to find the header row accurately
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      let headerRowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row && Array.isArray(row)) {
          // Check if any cell in this row looks like a "Name" header
          const hasNameHeader = row.some(cell => {
            const s = String(cell || '').toLowerCase().trim();
            return s.includes('nom complet') || s === 'nom' || s.includes('nom de l\'employé');
          });
          
          if (hasNameHeader) {
            headerRowIndex = i;
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        alert("Impossible de trouver la colonne 'Nom complet' ou 'Nom' dans votre fichier Excel. Vérifiez l'en-tête de votre fichier.");
        return;
      }

      // Read data from the detected header row
      const rawData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
      
      for (const row of rawData) {
        // Dynamically find the right keys in case of small spelling/space differences
        const keys = Object.keys(row);
        const nameKey = keys.find(k => {
          const s = k.toLowerCase().trim();
          return s.includes('nom complet') || s === 'nom' || s.includes('nom de l\'employé');
        });
        const affaireKey = keys.find(k => k.toLowerCase().trim().includes('affaire'));
        const clientKey = keys.find(k => k.toLowerCase().trim().includes('client'));
        const siteKey = keys.find(k => k.toLowerCase().trim().includes('site'));

        const name = nameKey ? row[nameKey] : null;
        const affaireNumber = affaireKey ? row[affaireKey] : '-';
        const client = clientKey ? row[clientKey] : '-';
        const site = siteKey ? row[siteKey] : '-';

        // Skip header duplicates or empty names
        if (!name || String(name).toLowerCase().trim().includes('nom complet')) continue;

        try {
          await fetch(`${API_EMPLOYEE}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: String(name).trim(),
              supervisorId: user?.id,
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
      fetchReports();
    };
    reader.readAsBinaryString(file);
  };

  const handleExportReports = async () => {
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
      const formattedData = latestData.map(emp => ({
        id: emp.id,
        name: emp.name,
        status: emp.status || 'En attente',
        arrivee: emp.pointageEntree || '-',
        depart: emp.pointageSortie || '-',
        affaireNumber: emp.affaireNumber || '-',
        client: emp.client || '-',
        site: emp.site || '-'
      }));

      const dataToExport = formattedData.map(report => ({
        'Superviseur': user?.name || 'Non spécifié',
        'Nom complet': report.name,
        'Affaire N°': report.affaireNumber,
        'Client': report.client,
        'Site': report.site,
        'Heure d\'Entrée': report.arrivee,
        'Heure de Sortie': report.depart,
        'Statut': report.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rapport Journalier");
      XLSX.writeFile(workbook, "Rapport_Journalier.xlsx");

      addNotification(
        `${user?.name || 'Un superviseur'} a exporté le rapport journalier (${dataToExport.length} employé(s))`,
        'success',
        dataToExport
      );
    } catch (error) {
      console.error("Error exporting reports:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const stats = {
    total: reports.length,
    present: reports.filter(r => r.status === 'Présent').length,
    absent: reports.filter(r => r.status === 'Absent').length
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reports.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="superviseur-container">
      <div className="view-header">
        <h1>Espace Superviseur</h1>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Rapport Journalier de Pointage</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={fetchReports} className="refresh-btn">
              🔄 Actualiser
            </button>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleImportEmployees}
              id="import-employees-superviseur"
              style={{ display: 'none' }}
            />
            <label htmlFor="import-employees-superviseur" className="refresh-btn" style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', margin: 0, padding: '0.5rem 0.75rem' }}>
              📤 Importer
            </label>
            <button 
              onClick={handleExportEmployees}
              className="refresh-btn"
              disabled={reports.length === 0}
              style={{ background: '#f1f5f9', color: '#475569', opacity: reports.length === 0 ? 0.5 : 1, cursor: reports.length === 0 ? 'not-allowed' : 'pointer' }}
            >
              📥 Exporter
            </button>
            <button 
              onClick={handleExportReports} 
              className="refresh-btn"
              disabled={reports.length === 0 || isExporting}
              style={{ background: '#10b981', color: 'white', opacity: reports.length === 0 || isExporting ? 0.5 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}
            >
              {isExporting ? '⏳ Export...' : '📊 Rapport'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement des rapports...</div>
        ) : (
          <>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Nom de l'Employé</th>
                    <th>Affaire N°</th>
                    <th>Client</th>
                    <th>Site</th>
                    <th>Heure d'Entrée</th>
                    <th>Heure de Sortie</th>
                    <th style={{ textAlign: 'right' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun rapport disponible.</td>
                    </tr>
                  ) : (
                    currentItems.map((report) => (
                      <tr key={report.id}>
                        <td style={{ fontWeight: 600 }}>{report.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.affaireNumber}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.client}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.site}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.arrivee}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{report.depart}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${report.status === 'Présent' ? 'badge-success' : 'badge-warning'}`}>
                            {report.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {reports.length > itemsPerPage && (
              <div className="pagination">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Précédent
                </button>
                <div className="pagination-pages">
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i + 1} 
                      onClick={() => paginate(i + 1)}
                      className={`pagination-number ${currentPage === i + 1 ? 'active' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Superviseur;
