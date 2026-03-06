const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081/api';

export const tasksApi = {
  // GET tasks for a project
  getTasksForProject: async (projectId) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  // POST create tasks for a project (validates sum of weights = 100%)
  createTasks: async (projectId, tasks) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create tasks');
    }
    return response.json();
  },

  // POST mark task as complete
  completeTask: async (taskId, superviseurId = null) => {
    const url = new URL(`${API_BASE}/projects/tasks/${taskId}/complete`);
    if (superviseurId) {
      url.searchParams.append('superviseurId', superviseurId);
    }
    const response = await fetch(url.toString(), {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to complete task');
    return response.json();
  },
};
