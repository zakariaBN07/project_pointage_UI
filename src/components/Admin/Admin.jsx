import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './Admin.css'; // Import the CSS file

const Admin = () => {
  const API_URL = import.meta.env.VITE_APP_API_BASE_URL;
  const [employees, setEmployees] = useState([]);
  const [importedPointage, setImportedPointage] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', matricule: '', role: 'superviseur', password: '' });
  const [editingId, setEditingId] = useState(null);
  const [editEmployee, setEditEmployee] = useState({ name: '', matricule: '', role: 'superviseur', password: '' });

  // Filter for only Superviseurs and Responsables
  const filteredEmployees = employees.filter(emp => emp.role === 'superviseur' || emp.role === 'Responsable');

  // Fetch all employees from API
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (newEmployee.name.trim() && newEmployee.matricule.trim()) {
      try {
        const response = await fetch(`${API_URL}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEmployee),
        });
        if (response.ok) {
          fetchEmployees();
          setNewEmployee({ name: '', matricule: '', role: 'superviseur', password: '' });
        }
      } catch (error) {
        console.error("Error adding employee:", error);
      }
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchEmployees();
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const startEditing = (emp) => {
    setEditingId(emp.id);
    setEditEmployee({ name: emp.name, matricule: emp.matricule, role: emp.role, password: emp.password || '' });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditEmployee({ ...editEmployee, [name]: value });
  };

  const saveEdit = async (id) => {
    // Find current employee to preserve non-editable fields (like supervisorId)
    const emp = employees.find(e => e.id === id);
    try {
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emp, ...editEmployee }),
      });
      if (response.ok) {
        fetchEmployees();
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleExportToExcel = () => {
    const dataToExport = filteredEmployees.map(({ name, role }) => ({ 'Nom': name, 'Rôle': role }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Superviseurs et Responsables");
    XLSX.writeFile(workbook, "List_Superviseurs_Responsables.xlsx");
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const bstr = event.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      setImportedPointage(data);

      // Sync imported data with the DB
      for (const record of data) {
        // Find employee by matricule to get the ID if not in the Excel
        const emp = employees.find(e => e.matricule === record['Matricule']);
        if (emp) {
          try {
            await fetch(`${API_URL}/employees/${emp.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                ...emp, 
                status: record['Statut'], 
                pointage: record['Pointage'] 
              }),
            });
          } catch (error) {
            console.error(`Error syncing ${record['Matricule']}:`, error);
          }
        }
      }
      fetchEmployees(); // Refresh list to reflect changes
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      <p>Welcome to the Admin Panel. Here you can manage your employees and their roles.</p>
      
      <section className="admin-section">
        <h2>Import Final Pointage</h2>
        <div className="import-container" style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '4px', border: '1px dashed #ccc' }}>
          <p>Import the final Excel file from the supervisor:</p>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleImportExcel}
            style={{ padding: '0.5rem' }}
          />
        </div>

        {importedPointage.length > 0 && (
          <div className="imported-data" style={{ marginTop: '1.5rem' }}>
            <h3>Imported Pointage Data</h3>
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Nom de l'employé</th>
                  <th>Matricule</th>
                  <th>Pointage</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {importedPointage.map((row, index) => (
                  <tr key={index}>
                    <td>{row['Nom de l\'employé']}</td>
                    <td>{row['Matricule']}</td>
                    <td>{row['Pointage']}</td>
                    <td>
                      <span className={`badge ${row['Statut'] === 'Présent' ? 'success' : 'warning'}`}>
                        {row['Statut']}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>Add Superviseur or Responsable</h2>
        <form onSubmit={handleAddEmployee} className="employee-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              placeholder="Full Name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="matricule">Matricule:</label>
            <input
              type="text"
              id="matricule"
              value={newEmployee.matricule}
              onChange={(e) => setNewEmployee({ ...newEmployee, matricule: e.target.value })}
              placeholder="Matricule"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role:</label>
            <select
              id="role"
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
            >
              <option value="superviseur">superviseur</option>
              <option value="Responsable">Responsable</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={newEmployee.password}
              onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
              placeholder="Initial Password"
              required
            />
          </div>
          <button type="submit" className="add-btn">Add User</button>
        </form>
      </section>

      <section className="admin-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Superviseurs & Responsables List</h2>
          {employees.length > 0 && (
            <button 
              onClick={handleExportToExcel}
              className="export-btn"
              style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#217346', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Export to Excel (.xlsx)
            </button>
          )}
        </div>
        {filteredEmployees.length === 0 ? (
          <p>No superviseurs or responsables found.</p>
        ) : (
          <table className="employee-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Matricule</th>
                <th>Role</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    {editingId === emp.id ? (
                      <input
                        type="text"
                        name="name"
                        value={editEmployee.name}
                        onChange={handleEditChange}
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
                      />
                    ) : (
                      emp.matricule
                    )}
                  </td>
                  <td>
                    {editingId === emp.id ? (
                      <select
                        name="role"
                        value={editEmployee.role}
                        onChange={handleEditChange}
                      >
                        <option value="superviseur">superviseur</option>
                        <option value="Responsable">Responsable</option>
                      </select>
                    ) : (
                      emp.role
                    )}
                  </td>
                  <td>
                    {editingId === emp.id ? (
                      <input
                        type="text"
                        name="password"
                        value={editEmployee.password}
                        onChange={handleEditChange}
                      />
                    ) : (
                      '********'
                    )}
                  </td>
                  <td>
                    {editingId === emp.id ? (
                      <>
                        <button onClick={() => saveEdit(emp.id)} className="save-btn">Save</button>
                        <button onClick={cancelEdit} className="cancel-btn">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditing(emp)} className="edit-btn">Edit</button>
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="delete-btn">Delete</button>
                      </>
                    )}
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

export default Admin;
