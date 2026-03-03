import React, { useState, useEffect } from 'react';
import '../styles/ProjectManagement.css';
import ProjectList from '../components/ProjectList';
import ProjectForm from '../components/ProjectForm';

function ProjectManagementPage({ user }) {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  // Fetch projects from backend
  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8081/api/projects', {
        method: 'GET',
        headers: {
          'X-User-Id': user.id,
          'X-User-Role': user.role,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const response = await fetch('http://localhost:8081/api/projects', {
        method: 'POST',
        headers: {
          'X-User-Id': user.id,
          'X-User-Role': user.role,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const newProject = await response.json();
      setProjects([...projects, newProject]);
      setShowForm(false);
      alert('Project created successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdateProject = async (projectData) => {
    try {
      const response = await fetch(`http://localhost:8081/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'X-User-Id': user.id,
          'X-User-Role': user.role,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      const updatedProject = await response.json();
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
      setEditingProject(null);
      setShowForm(false);
      alert('Project updated successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8081/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': user.id,
          'X-User-Role': user.role,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      setProjects(projects.filter(p => p.id !== projectId));
      alert('Project deleted successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="project-management-page">
      <h1>📊 Project Management</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Show form or list based on state */}
      {showForm ? (
        <ProjectForm
          user={user}
          project={editingProject}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
          onCancel={handleCloseForm}
        />
      ) : selectedProject ? (
        <ProjectDetail
          project={selectedProject}
          user={user}
          onBack={() => setSelectedProject(null)}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
          onRefresh={fetchProjects}
        />
      ) : (
        <>
          {/* Create button - only for Responsable */}
          {user.role === 'Responsable' && (
            <button 
              className="btn-create-project" 
              onClick={() => setShowForm(true)}
            >
              ➕ Create New Project
            </button>
          )}

          {/* Projects list */}
          {projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects found</p>
              {user.role === 'Responsable' && <p>Create your first project to get started</p>}
            </div>
          ) : (
            <ProjectList
              projects={projects}
              user={user}
              onView={handleViewProject}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          )}
        </>
      )}
    </div>
  );
}

export default ProjectManagementPage;

/**
 * ProjectDetail Component - Shows detailed view of a single project
 */
function ProjectDetail({ project, user, onBack, onEdit, onDelete, onRefresh }) {
  return (
    <div className="project-detail">
      <button className="btn-back" onClick={onBack}>← Back to Projects</button>

      <div className="project-header">
        <div className="project-title-section">
          <h2>{project.numeroAffaire} - {project.client}</h2>
          <span className={`project-status ${project.status.toLowerCase()}`}>
            {project.status}
          </span>
        </div>

        {/* Edit/Delete buttons - only for Responsable */}
        {user.role === 'Responsable' && (
          <div className="project-actions">
            <button 
              className="btn-edit" 
              onClick={() => onEdit(project)}
            >
              ✏️ Edit
            </button>
            <button 
              className="btn-delete" 
              onClick={() => onDelete(project.id)}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      {/* Progress section */}
      <div className="project-progress-section">
        <h3>Project Progress</h3>
        <ProgressTracker project={project} />
      </div>

      {/* Project details */}
      <div className="project-details-grid">
        <div className="detail-item">
          <label>Budget</label>
          <p>${project.budget?.toLocaleString()}</p>
        </div>
        <div className="detail-item">
          <label>Start Date</label>
          <p>{new Date(project.startDate).toLocaleDateString()}</p>
        </div>
        <div className="detail-item">
          <label>Estimated End Date</label>
          <p>{new Date(project.estimatedEndDate).toLocaleDateString()}</p>
        </div>
        <div className="detail-item">
          <label>Created By</label>
          <p>{project.createdBy}</p>
        </div>
      </div>

      {project.description && (
        <div className="project-description">
          <h3>Description</h3>
          <p>{project.description}</p>
        </div>
      )}

      {/* Tasks, Milestones, Work Packages sections */}
      <div className="project-sub-sections">
        {project.tasks && project.tasks.length > 0 && (
          <SubSection title="Tasks" items={project.tasks} />
        )}
        {project.milestones && project.milestones.length > 0 && (
          <SubSection title="Milestones" items={project.milestones} />
        )}
        {project.workPackages && project.workPackages.length > 0 && (
          <SubSection title="Work Packages" items={project.workPackages} />
        )}
      </div>
    </div>
  );
}

/**
 * SubSection Component - Display tasks, milestones, or work packages
 */
function SubSection({ title, items }) {
  return (
    <div className="sub-section">
      <h4>{title}</h4>
      <table className="sub-items-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            {title === 'Tasks' && <th>Due Date</th>}
            {title === 'Milestones' && <th>Target Date</th>}
            {title === 'Work Packages' && <th>Budget</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>
                <span className={item.completed ? 'status-completed' : 'status-pending'}>
                  {item.completed ? '✓ Completed' : '⏳ Pending'}
                </span>
              </td>
              {title === 'Tasks' && <td>{new Date(item.dueDate).toLocaleDateString()}</td>}
              {title === 'Milestones' && <td>{new Date(item.targetDate).toLocaleDateString()}</td>}
              {title === 'Work Packages' && <td>${item.allocatedBudget?.toLocaleString()}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * ProgressTracker Component - Display progress bar
 */
function ProgressTracker({ project }) {
  const progress = project.progress || 0;
  const progressColor = progress < 33 ? '#ff6b6b' : progress < 66 ? '#ffd93d' : '#51cf66';

  return (
    <div className="progress-tracker">
      <div className="progress-info">
        <span className="progress-percentage">{progress.toFixed(1)}%</span>
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{
            width: `${progress}%`,
            backgroundColor: progressColor,
          }}
        />
      </div>
      <div className="progress-legend">
        <div className="legend-item planning">
          <span className="legend-color" style={{ backgroundColor: '#ff6b6b' }}></span>
          Planning
        </div>
        <div className="legend-item in-progress">
          <span className="legend-color" style={{ backgroundColor: '#ffd93d' }}></span>
          In Progress
        </div>
        <div className="legend-item completed">
          <span className="legend-color" style={{ backgroundColor: '#51cf66' }}></span>
          Completed
        </div>
      </div>
    </div>
  );
}
