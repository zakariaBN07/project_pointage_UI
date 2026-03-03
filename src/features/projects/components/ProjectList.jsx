import React from 'react';
import '../styles/ProjectList.css';

function ProjectList({ projects, user, onView, onEdit, onDelete }) {
  const canEdit = user.role === 'Responsable';

  return (
    <div className="project-list-container">
      <h2>Projects ({projects.length})</h2>

      <div className="projects-grid">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            user={user}
            canEdit={canEdit}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, user, canEdit, onView, onEdit, onDelete }) {
  const progressPercentage = project.progress || 0;
  const progressColor = getProgressColor(progressPercentage);

  const isAssignedToUser = project.assignedToSupervisor === user.id;
  const isCreatedByUser = project.createdBy === user.id;

  // Check if user can view this project based on role
  const canView = 
    user.role === 'Admin' || 
    (user.role === 'Responsable' && isCreatedByUser) ||
    (user.role === 'Superviseur' && isAssignedToUser);

  if (!canView) {
    return null;
  }

  return (
    <div className="project-card">
      <div className="card-header">
        <div className="card-title">
          <h3>{project.numeroAffaire}</h3>
          <p className="client-name">{project.client}</p>
        </div>
        <span className={`status-badge ${project.status.toLowerCase()}`}>
          {project.status}
        </span>
      </div>

      <div className="card-progress">
        <div className="progress-label">
          <span>Progress</span>
          <span className="progress-value">{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
      </div>

      <div className="card-details">
        <div className="detail">
          <span className="label">Budget:</span>
          <span className="value">${project.budget?.toLocaleString()}</span>
        </div>
        <div className="detail">
          <span className="label">Period:</span>
          <span className="value">
            {new Date(project.startDate).toLocaleDateString()} - {new Date(project.estimatedEndDate).toLocaleDateString()}
          </span>
        </div>
        {project.tasks && (
          <div className="detail">
            <span className="label">Tasks:</span>
            <span className="value">
              {project.tasks.filter(t => t.completed).length}/{project.tasks.length}
            </span>
          </div>
        )}
        {project.milestones && (
          <div className="detail">
            <span className="label">Milestones:</span>
            <span className="value">
              {project.milestones.filter(m => m.completed).length}/{project.milestones.length}
            </span>
          </div>
        )}
      </div>

      <div className="card-actions">
        <button
          className="btn-view"
          onClick={() => onView(project)}
          title="View project details"
        >
          👁️ View
        </button>

        {canEdit && (
          <>
            <button
              className="btn-edit"
              onClick={() => onEdit(project)}
              title="Edit project"
            >
              ✏️ Edit
            </button>
            <button
              className="btn-delete"
              onClick={() => onDelete(project.id)}
              title="Delete project"
            >
              🗑️ Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Helper function to determine progress color based on percentage
 */
function getProgressColor(percentage) {
  if (percentage === 0) {
    return '#ff6b6b'; // Red - Planning
  } else if (percentage < 100) {
    return '#ffd93d'; // Yellow - In Progress
  } else {
    return '#51cf66'; // Green - Completed
  }
}

export default ProjectList;
