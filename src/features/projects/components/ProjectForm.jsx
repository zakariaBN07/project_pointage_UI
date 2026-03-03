import React, { useState } from 'react';
import '../styles/ProjectForm.css';

function ProjectForm({ user, project, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    project ? {
      numeroAffaire: project.numeroAffaire,
      client: project.client,
      budget: project.budget,
      startDate: project.startDate,
      estimatedEndDate: project.estimatedEndDate,
      assignedToSupervisor: project.assignedToSupervisor,
      description: project.description,
    } : {
      numeroAffaire: '',
      client: '',
      budget: '',
      startDate: '',
      estimatedEndDate: '',
      assignedToSupervisor: '',
      description: '',
    }
  );

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.numeroAffaire.trim()) {
      newErrors.numeroAffaire = 'Project number is required';
    }
    if (!formData.client.trim()) {
      newErrors.client = 'Client is required';
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Budget must be a positive number';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.estimatedEndDate) {
      newErrors.estimatedEndDate = 'Estimated end date is required';
    }
    if (new Date(formData.startDate) >= new Date(formData.estimatedEndDate)) {
      newErrors.estimatedEndDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      budget: parseFloat(formData.budget),
    };

    onSubmit(submitData);
  };

  return (
    <div className="project-form-container">
      <div className="project-form-header">
        <h2>{project ? 'Edit Project' : 'Create New Project'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="numeroAffaire">Project Number (N° d'affaire) *</label>
            <input
              type="text"
              id="numeroAffaire"
              name="numeroAffaire"
              value={formData.numeroAffaire}
              onChange={handleChange}
              placeholder="e.g., PROJ-001"
              className={errors.numeroAffaire ? 'error' : ''}
            />
            {errors.numeroAffaire && <span className="error-message">{errors.numeroAffaire}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="client">Client *</label>
            <input
              type="text"
              id="client"
              name="client"
              value={formData.client}
              onChange={handleChange}
              placeholder="Client name"
              className={errors.client ? 'error' : ''}
            />
            {errors.client && <span className="error-message">{errors.client}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="budget">Budget ($) *</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="50000"
              step="0.01"
              className={errors.budget ? 'error' : ''}
            />
            {errors.budget && <span className="error-message">{errors.budget}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={errors.startDate ? 'error' : ''}
            />
            {errors.startDate && <span className="error-message">{errors.startDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="estimatedEndDate">Estimated End Date *</label>
            <input
              type="date"
              id="estimatedEndDate"
              name="estimatedEndDate"
              value={formData.estimatedEndDate}
              onChange={handleChange}
              className={errors.estimatedEndDate ? 'error' : ''}
            />
            {errors.estimatedEndDate && <span className="error-message">{errors.estimatedEndDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="assignedToSupervisor">Assign to Supervisor (Optional)</label>
            <input
              type="text"
              id="assignedToSupervisor"
              name="assignedToSupervisor"
              value={formData.assignedToSupervisor}
              onChange={handleChange}
              placeholder="Supervisor ID"
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Project description"
            rows="5"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">
            {project ? 'Update Project' : 'Create Project'}
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjectForm;
