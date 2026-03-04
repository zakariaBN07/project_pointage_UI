import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MetricsDisplay from '../components/MetricsDisplay';
import TaskList from '../components/TaskList';
import { projectsApi } from '../../../services/projects';
import '../styles/ProjectDetail.css';

/**
 * Detailed project view showing full metrics, tasks, and completion options
 */
const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [superviseurId] = useState(localStorage.getItem('userId')); // Get current user

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const metricsData = await projectsApi.getMetrics(projectId);
        setMetrics(metricsData);
        // In a full implementation, fetch tasks from backend (GET /api/projects/{id}/tasks)
        // For now, tasks would be included in metrics or fetched separately
        setTasks(metricsData.tasks || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchMetrics();
    }
  }, [projectId]);

  const handleTaskComplete = (taskId) => {
    // Refetch metrics after task completion to update progress
    projectsApi.getMetrics(projectId).then(setMetrics).catch(setError);
  };

  if (loading) return <div className="loading">Loading project details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!metrics) return <div>Project not found</div>;

  return (
    <div className="project-detail-page">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/projects')}>← Back</button>
        <div>
          <h1>{metrics.name}</h1>
          <p className="project-number">#{metrics.affaireNumero}</p>
        </div>
      </div>

      <MetricsDisplay metrics={metrics} />

      <div className="tasks-section">
        <h2>Tasks & Progress</h2>
        {tasks.length > 0 && (
          <TaskList 
            tasks={tasks} 
            onTaskComplete={handleTaskComplete}
            superviseurId={superviseurId}
          />
        )}
        {tasks.length === 0 && (
          <div className="no-tasks">
            <p>No tasks assigned yet</p>
          </div>
        )}
      </div>

      <div className="superviseurs-section">
        <h2>Assigned Superviseurs</h2>
        {metrics.superviseurIds && metrics.superviseurIds.length > 0 ? (
          <ul className="superviseur-list">
            {metrics.superviseurIds.map(id => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        ) : (
          <p>No superviseurs assigned</p>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
