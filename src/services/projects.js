const API_BASE = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8081/api';
const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL || `${API_BASE}/supervisor`;

export const projectsApi = {
  // GET projects derived from employees table grouped by affaireNumero
  listProjects: async () => {
    const response = await fetch(`${API_EMPLOYEE}/employees`);
    if (!response.ok) throw new Error('Failed to fetch projects (from employees)');
    const employees = await response.json();

    // Group employees by affaireNumero to derive project metrics
    const projectsMap = {};
    employees.forEach(emp => {
      const affaire = emp.affaireNumero || 'Sans Affaire';
      if (!projectsMap[affaire]) {
        projectsMap[affaire] = {
          projectId: affaire, // Using affaireNumero as ID
          affaireNumero: affaire,
          name: `Projet ${affaire}`, // Using a generic name with affaire number
          username: emp.client || 'Client Inconnu', // Client name
          plannedHours: 0,
          consumedHours: 0,
          progressPercent: emp.projectProgress || 0,
        };
      }

      // Sum up planned and consumed hours from all employees in this project
      projectsMap[affaire].plannedHours += (Number(emp.plannedHours) || 0);
      projectsMap[affaire].consumedHours += (Number(emp.totHrsTravaillees) || 0);
      
      // Use the maximum progress reported among employees for this project
      if (emp.projectProgress > projectsMap[affaire].progressPercent) {
        projectsMap[affaire].progressPercent = emp.projectProgress;
      }
    });

    return Object.values(projectsMap).map(p => {
      const ph = p.plannedHours || 0;
      const ch = p.consumedHours || 0;
      const tp = ph > 0 ? (ch / ph) * 100 : 0;
      
      return {
        ...p,
        remainingHours: Math.max(0, ph - ch),
        timePercent: tp,
        timeExceedsProgress: tp > (p.progressPercent || 0)
      };
    });
  },

  // GET project metrics by ID (using affaireNumero as ID)
  getMetrics: async (projectId) => {
    // projectId is expected to be the affaireNumero
    const response = await fetch(`${API_EMPLOYEE}/employees`);
    if (!response.ok) throw new Error('Failed to fetch project metrics (from employees)');
    const employees = await response.json();

    const projectEmployees = employees.filter(emp => (emp.affaireNumero || 'Sans Affaire') === projectId);
    
    if (projectEmployees.length === 0) {
      throw new Error('Project not found');
    }

    const firstEmp = projectEmployees[0];
    const metrics = {
      projectId: projectId,
      affaireNumero: projectId,
      name: `Projet ${projectId}`,
      username: firstEmp.client || 'Client Inconnu',
      plannedHours: 0,
      consumedHours: 0,
      progressPercent: 0,
      supervisorName: [...new Set(projectEmployees.map(emp => emp.supervisorId || emp.responsableId).filter(Boolean))],
    };

    projectEmployees.forEach(emp => {
      metrics.plannedHours += (Number(emp.plannedHours) || 0);
      metrics.consumedHours += (Number(emp.totHrsTravaillees) || 0);
      if (emp.projectProgress > metrics.progressPercent) {
        metrics.progressPercent = emp.projectProgress;
      }
    });

    const ph = metrics.plannedHours || 0;
    const ch = metrics.consumedHours || 0;
    const tp = ph > 0 ? (ch / ph) * 100 : 0;

    return {
      ...metrics,
      remainingHours: Math.max(0, ph - ch),
      timePercent: tp,
      timeExceedsProgress: tp > (metrics.progressPercent || 0)
    };
  },

  // POST create new project
  createProject: async (project) => {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },

  // PUT update project
  updateProject: async (projectId, project) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
  },

  // DELETE project
  deleteProject: async (projectId) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete project');
  },
};
