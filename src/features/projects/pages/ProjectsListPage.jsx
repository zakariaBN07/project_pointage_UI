import React, { useEffect, useState } from 'react';
import ProjectCard from '../components/ProjectCard';
import { projectsApi } from '../../../services/projects';
import '../styles/ProjectsList.css';

/**
 * Admin/Responsable page showing all projects with metrics and alerts
 */
const ProjectsListPage = ({ setCurrentPage, onSelectProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, behind

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await projectsApi.listProjects();
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = filter === 'behind'
    ? projects.filter(p => p.timeExceedsProgress)
    : projects;

  return (
    <div className="projects-page">
      {/* <div className="page-header">
        <h1>Project Monitoring</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setCurrentPage('create-project')}
        >
          + New Project
        </button>
      </div> */}

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Projects ({projects.length})
        </button>
        <button
          className={`filter-btn ${filter === 'behind' ? 'active' : ''}`}
          onClick={() => setFilter('behind')}
        >
          Behind Schedule ({projects.filter(p => p.timeExceedsProgress).length})
        </button>
      </div>

      {loading && <div className="loading">Loading projects...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && filteredProjects.length === 0 && (
        <div className="empty-state">
          <p>No projects {filter === 'behind' ? 'behind schedule' : 'yet'}</p>
          {filter === 'all' && (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentPage('create-project')}
            >
              Create First Project
            </button>
          )}
        </div>
      )}

      <div className="projects-grid">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.projectId}
            project={project}
            onSelect={onSelectProject}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectsListPage;
