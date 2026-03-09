import React, { useState } from 'react';
import { projectsApi } from '../../../services/projects';
import { tasksApi } from '../../../services/tasks';
import '../styles/CreateProject.css';

/**
 * Form page for Responsables to create projects with tasks
 * Validates that task weights sum to exactly 100%
 */
const CreateProjectPage = ({ setCurrentPage }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [project, setProject] = useState({
    affaireNumero: '',
    name: '',
    currentPlanned: '',
    deadline: '',
  });

  const [tasks, setTasks] = useState([
    { name: '', weightPercent: '' },
  ]);

  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
    setError(null);
  };

  const addTask = () => {
    setTasks([...tasks, { name: '', weightPercent: '' }]);
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const calculateWeightSum = () => {
    return tasks.reduce((sum, task) => {
      const weight = parseFloat(task.weightPercent) || 0;
      return sum + weight;
    }, 0);
  };

  const weightSum = calculateWeightSum();
  const isWeightValid = Math.abs(weightSum - 100) < 0.01;
  const canSubmit = isWeightValid && project.name && project.affaireNumero;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert planned hours to BigDecimal format (number)
      const projectData = {
        affaireNumero: project.affaireNumero,
        name: project.name,
        currentPlanned: project.currentPlanned
          ? parseFloat(project.currentPlanned)
          : null,
        deadline: project.deadline || null,
      };

      // Create project first
      const createdProject = await projectsApi.createProject(projectData);

      // Prepare tasks with BigDecimal format
      const tasksData = tasks.map(t => ({
        name: t.name,
        weightPercent: parseFloat(t.weightPercent),
      }));

      // Create tasks for the project
      await tasksApi.createTasks(createdProject.id, tasksData);

      // Success
      setCurrentPage('projects');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-project-page">
      <div className="form-header">
        <h1>Create New Project</h1>
        <p>Define project parameters and tasks with weight distribution</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-section">
          <h2>Project Information</h2>

          <div className="form-group">
            <label htmlFor="affaireNumero">Project Number (Affaire) *</label>
            <input
              id="affaireNumero"
              type="text"
              name="affaireNumero"
              value={project.affaireNumero}
              onChange={handleProjectChange}
              required
              placeholder="e.g., AFF-2024-001"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={project.name}
              onChange={handleProjectChange}
              required
              placeholder="e.g., Website Redesign"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plannedHours">Planned Hours</label>
              <input
                id="plannedHours"
                type="number"
                name="plannedHours"
                value={project.currentPlanned}
                onChange={handleProjectChange}
                min="0"
                step="0.5"
                placeholder="e.g., 2000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="deadline">Deadline</label>
              <input
                id="deadline"
                type="date"
                name="deadline"
                value={project.deadline}
                onChange={handleProjectChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="tasks-header">
            <h2>Project Tasks</h2>
            <p className="weight-sum">
              Total Weight: <span className={isWeightValid ? 'valid' : 'invalid'}>
                {weightSum.toFixed(1)}%
              </span>
              {isWeightValid ? ' ✓' : ' (Must equal 100%)'}
            </p>
          </div>

          <div className="tasks-list">
            {tasks.map((task, index) => (
              <div key={index} className="task-input-row">
                <input
                  type="text"
                  placeholder="Task name"
                  value={task.name}
                  onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                  className="task-name-input"
                />
                <input
                  type="number"
                  placeholder="Weight %"
                  value={task.weightPercent}
                  onChange={(e) => handleTaskChange(index, 'weightPercent', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="task-weight-input"
                />
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="btn-remove"
                    aria-label="Remove task"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addTask}
            className="btn btn-secondary add-task-btn"
          >
            + Add Task
          </button>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => setCurrentPage('projects')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canSubmit || loading}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
