const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081/api';

export const projectsApi = {
  // GET all projects with metrics
  listProjects: async () => {
    const response = await fetch(`${API_BASE}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  // GET project metrics by ID
  getMetrics: async (projectId) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}/metrics`);
    if (!response.ok) throw new Error('Failed to fetch project metrics');
    return response.json();
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
