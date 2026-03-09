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

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', weightPercent: '' });

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

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.name || !newTask.weightPercent) return;
    
    setLoading(true);
    try {
      const updatedTasks = [...tasks, { 
        name: newTask.name, 
        weightPercent: parseFloat(newTask.weightPercent) 
      }];
      
      // Check weight sum
      const sum = updatedTasks.reduce((s, t) => s + parseFloat(t.weightPercent), 0);
      if (Math.abs(sum - 100) > 0.01) {
        setError(`Total weight must be 100% (current: ${sum.toFixed(1)}%)`);
        setLoading(false);
        return;
      }

      await tasksApi.createTasks(projectId, updatedTasks);
      const tasksData = await tasksApi.getTasksForProject(projectId);
      setTasks(tasksData || []);
      setMetrics(await projectsApi.getMetrics(projectId));
      setNewTask({ name: '', weightPercent: '' });
      setShowAddTask(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) return <div className="loading">Loading project details...</div>;
  if (error && !metrics) return <div className="error-message">{error}</div>;
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

      {error && <div className="error-message">{error}</div>}

      <MetricsDisplay metrics={metrics} />

      <div className="tasks-section">
        <div className="section-header">
          <h2>Tasks & Progress</h2>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowAddTask(!showAddTask)}
          >
            {showAddTask ? 'Cancel' : '+ Add Task'}
          </button>
        </div>

        {showAddTask && (
          <form onSubmit={handleAddTask} className="add-task-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Task Name"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Weight %"
                value={newTask.weightPercent}
                onChange={(e) => setNewTask({ ...newTask, weightPercent: e.target.value })}
                min="0"
                max="100"
                step="0.1"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
            <p className="hint">Note: Adding a task requires re-balancing weights to sum to 100%</p>
          </form>
        )}

        {tasks.length > 0 && (
          <TaskList
            tasks={tasks}
            onTaskComplete={handleTaskComplete}
            superviseurId={localStorage.getItem('userId')}
          />
        )}
        {tasks.length === 0 && (
          <div className="no-tasks">
            <p>No tasks assigned yet</p>
          </div>
        )}
      </div>

      {/* <div className="superviseurs-section">
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
      </div> */}
    </div>
  );
};

export default ProjectDetailPage;
