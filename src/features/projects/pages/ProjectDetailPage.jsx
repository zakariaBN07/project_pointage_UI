import React, { useEffect, useState } from 'react';
import MetricsDisplay from '../components/MetricsDisplay';
import TaskList from '../components/TaskList';
import { projectsApi } from '../../../services/projects';
import { tasksApi } from '../../../services/tasks';
import '../styles/ProjectDetail.css';

/**
 * Detailed project view showing full metrics, tasks, and completion options
 */
const ProjectDetailPage = ({ projectId, onBack }) => {
  const [metrics, setMetrics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [superviseurId] = useState(localStorage.getItem('userId')); // Get current user
  const [supervisorName] = useState(localStorage.getItem('userName')); 

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const metricsData = await projectsApi.getMetrics(projectId);
        setMetrics(metricsData);

        // Fetch tasks from backend for this project
        const tasksData = await tasksApi.getTasksForProject(projectId);
        setTasks(tasksData || []);
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
        <button className="btn-back" onClick={onBack}>← Back</button>
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
            supervisorName={supervisorName}
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
        {metrics.supervisorName && metrics.supervisorName.length > 0 ? (
          <ul className="superviseur-list">
            {metrics.supervisorName.map(id => (
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
