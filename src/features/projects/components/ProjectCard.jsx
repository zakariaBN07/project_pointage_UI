import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ProjectCard.css';

/**
 * Card component showing project summary with metrics
 * Used on project list/dashboard pages
 */
const ProjectCard = ({ project }) => {
  if (!project) return null;

  const {
    projectId,
    affaireNumero,
    name,
    plannedHours,
    consumedHours,
    remainingHours,
    progressPercent,
    timePercent,
    timeExceedsProgress,
  } = project;

  return (
    <Link to={`/projects/${projectId}`} className="project-card-link">
      <div className={`project-card ${timeExceedsProgress ? 'alert' : ''}`}>
        <div className="card-header">
          <div>
            <h3 className="project-name">{name}</h3>
            <p className="project-number">#{affaireNumero}</p>
          </div>
          {timeExceedsProgress && <span className="alert-badge">⚠️ Behind</span>}
        </div>

        <div className="card-metrics">
          <div className="metric-item">
            <span className="metric-label">Hours</span>
            <span className="metric-content">
              {Number(consumedHours).toFixed(1)}/{Number(plannedHours).toFixed(1)} h
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Progress</span>
            <span className="metric-content">{Number(progressPercent).toFixed(0)}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Time %</span>
            <span className={`metric-content ${timePercent > progressPercent ? 'warning' : ''}`}>
              {Number(timePercent).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="card-progress">
          <div className="progress-track">
            <div
              className="progress-indicator"
              style={{ width: `${Math.min(Number(progressPercent), 100)}%` }}
            />
          </div>
          <span className="remaining">
            {Number(remainingHours).toFixed(1)} h remaining
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
