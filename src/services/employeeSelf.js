const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081/api';

export const employeeSelfApi = {
  // GET current employee pointage info by matricule
  getMyPointage: async (matricule) => {
    if (!matricule) throw new Error('Matricule manquant');
    const params = new URLSearchParams({ matricule });
    const response = await fetch(`${API_BASE}/employee/me?${params.toString()}`);
    if (!response.ok) throw new Error('Impossible de charger vos données de pointage');
    return response.json();
  },

  // PUT update current employee pointage record
  updateMyPointage: async (record) => {
    if (!record?.id) throw new Error("Identifiant d'employé manquant");
    const response = await fetch(`${API_BASE}/employee/me/${record.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error('Impossible de mettre à jour votre pointage');
    return response.json();
  },
};

