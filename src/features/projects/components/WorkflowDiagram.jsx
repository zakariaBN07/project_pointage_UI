import React from 'react';
import '../styles/WorkflowDiagram.css';

const WorkflowDiagram = () => {
  return (
    <div className="workflow-container">
      <h1 className="workflow-title">Project Management Workflow</h1>
      
      {/* Main Workflow */}
      <div className="workflow-grid">
        
        {/* ADMIN SECTION */}
        <div className="workflow-column">
          <div className="role-header admin-header">
            <div className="role-icon">👤</div>
            <h2>Admin</h2>
            <p className="role-subtitle">System Administrator</p>
          </div>
          
          <div className="tasks-container">
            <div className="task-box admin-task">
              <div className="task-number">1</div>
              <h3>Create User Roles</h3>
              <p>Setup system roles and permissions</p>
              <div className="task-details">
                <span className="badge">Users</span>
              </div>
            </div>
            
            <div className="arrow-down">↓</div>
            
            <div className="task-box admin-task">
              <div className="task-number">2</div>
              <h3>Assign Users to Roles</h3>
              <p>Assign Responsable and Superviseur</p>
              <div className="task-details">
                <span className="badge">Permissions</span>
              </div>
            </div>
            
            <div className="arrow-down">↓</div>
            
            <div className="task-box admin-task">
              <div className="task-number">3</div>
              <h3>Monitor All Projects</h3>
              <p>View-only access to all projects &amp; progress</p>
              <div className="task-details">
                <span className="badge">Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* RESPONSABLE SECTION */}
        <div className="workflow-column">
          <div className="role-header responsable-header">
            <div className="role-icon">📋</div>
            <h2>Responsable</h2>
            <p className="role-subtitle">Project Owner/Manager</p>
          </div>
          
          <div className="tasks-container">
            <div className="task-box responsable-task">
              <div className="task-number">1</div>
              <h3>Create Project</h3>
              <p>Define project scope and budget</p>
              <div className="task-details">
                <span className="detail-item">N° d'affaire</span>
                <span className="detail-item">Client</span>
                <span className="detail-item">Budget</span>
                <span className="detail-item">Dates</span>
              </div>
            </div>
            
            <div className="arrow-down">↓</div>
            
            <div className="task-box responsable-task">
              <div className="task-number">2</div>
              <h3>Add Tasks &amp; Milestones</h3>
              <p>Break down work into tasks</p>
              <div className="task-details">
                <span className="detail-item">Task Duration</span>
                <span className="detail-item">Weight %</span>
                <span className="detail-item">Milestones</span>
              </div>
            </div>
            
            <div className="arrow-down">↓</div>
            
            <div className="task-box responsable-task">
              <div className="task-number">3</div>
              <h3>Assign to Superviseur</h3>
              <p>Delegate tasks to team members</p>
              <div className="task-details">
                <span className="badge">Team Assignment</span>
              </div>
            </div>

            <div className="arrow-down">↓</div>
            
            <div className="task-box responsable-task">
              <div className="task-number">4</div>
              <h3>Validate Completion</h3>
              <p>Review and approve completed tasks</p>
              <div className="task-details">
                <span className="badge">Quality Check</span>
              </div>
            </div>
          </div>
        </div>

        {/* SUPERVISEUR SECTION */}
        <div className="workflow-column">
          <div className="role-header superviseur-header">
            <div className="role-icon">✓</div>
            <h2>Superviseur</h2>
            <p className="role-subtitle">Team Member / Executor</p>
          </div>
          
          <div className="tasks-container">
            <div className="task-box superviseur-task">
              <div className="task-number">1</div>
              <h3>View Assigned Tasks</h3>
              <p>See all tasks assigned to them</p>
              <div className="task-details">
                <span className="badge">View Only</span>
              </div>
            </div>
            
            <div className="arrow-down">↓</div>
            
            <div className="task-box superviseur-task">
              <div className="task-number">2</div>
              <h3>Execute Tasks</h3>
              <p>Complete assigned work items</p>
              <div className="task-details">
                <span className="detail-item">Follow Schedule</span>
                <span className="detail-item">Track Hours</span>
              </div>
            </div>
            
            <div className="arrow-down">↓</div>
            
            <div className="task-box superviseur-task">
              <div className="task-number">3</div>
              <h3>Mark as Complete</h3>
              <p>Submit completed tasks for review</p>
              <div className="task-details">
                <span className="badge">Status Update</span>
              </div>
            </div>

            <div className="arrow-down">↓</div>
            
            <div className="task-box superviseur-task">
              <div className="task-number">4</div>
              <h3>View Progress</h3>
              <p>Monitor overall project progress</p>
              <div className="task-details">
                <span className="badge">Read-Only</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS CALCULATION SECTION */}
      <div className="progress-section">
        <h2 className="section-title">📊 Automatic Progress Calculation</h2>
        
        <div className="calculation-grid">
          
          <div className="calc-item">
            <div className="calc-header">
              <span className="calc-icon">📝</span>
              <h3>Tasks Completion</h3>
            </div>
            <div className="calc-formula">
              <p className="formula-text">Completed Tasks / Total Tasks</p>
              <p className="formula-weight">Weight: <strong>40%</strong></p>
              <div className="example">
                <small>Example: 4/10 tasks = 40% × 0.4 = <strong>16%</strong></small>
              </div>
            </div>
          </div>

          <div className="calc-item">
            <div className="calc-header">
              <span className="calc-icon">🎯</span>
              <h3>Milestones</h3>
            </div>
            <div className="calc-formula">
              <p className="formula-text">Completed Milestones / Total Milestones</p>
              <p className="formula-weight">Weight: <strong>30%</strong></p>
              <div className="example">
                <small>Example: 2/4 milestones = 50% × 0.3 = <strong>15%</strong></small>
              </div>
            </div>
          </div>

          <div className="calc-item">
            <div className="calc-header">
              <span className="calc-icon">💰</span>
              <h3>Budget Spent</h3>
            </div>
            <div className="calc-formula">
              <p className="formula-text">Amount Spent / Total Budget</p>
              <p className="formula-weight">Weight: <strong>20%</strong></p>
              <div className="example">
                <small>Example: 25k/50k DH = 50% × 0.2 = <strong>10%</strong></small>
              </div>
            </div>
          </div>

          <div className="calc-item">
            <div className="calc-header">
              <span className="calc-icon">📦</span>
              <h3>Work Packages</h3>
            </div>
            <div className="calc-formula">
              <p className="formula-text">Completed Packages / Total Packages</p>
              <p className="formula-weight">Weight: <strong>10%</strong></p>
              <div className="example">
                <small>Example: 3/5 packages = 60% × 0.1 = <strong>6%</strong></small>
              </div>
            </div>
          </div>

        </div>

        {/* FORMULA DISPLAY */}
        <div className="formula-box">
          <h3>📐 Complete Formula</h3>
          <div className="formula-display">
            <p>Total Progress % = </p>
            <p className="formula-line">
              (Tasks% × 0.4) + (Milestones% × 0.3) + (Budget% × 0.2) + (Packages% × 0.1)
            </p>
            <p className="formula-example">
              = (40% × 0.4) + (50% × 0.3) + (50% × 0.2) + (60% × 0.1)
            </p>
            <p className="formula-example">
              = 16% + 15% + 10% + 6% = <span className="result">47%</span>
            </p>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR EXAMPLE */}
      <div className="progress-display-section">
        <h2 className="section-title">📈 Project Progress Display</h2>
        
        <div className="progress-example">
          <div className="project-info">
            <div className="info-row">
              <span className="label">Project:</span>
              <span className="value">PROJ-2026-001</span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span className="value status-in-progress">In Progress</span>
            </div>
            <div className="info-row">
              <span className="label">Progress:</span>
              <span className="value"><strong>47%</strong></span>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '47%' }}>
                <span className="progress-text">47%</span>
              </div>
            </div>
          </div>

          <div className="progress-details">
            <div className="detail">
              <span className="detail-label">Tasks:</span>
              <span className="detail-value">4/10 (40%)</span>
            </div>
            <div className="detail">
              <span className="detail-label">Milestones:</span>
              <span className="detail-value">2/4 (50%)</span>
            </div>
            <div className="detail">
              <span className="detail-label">Budget Used:</span>
              <span className="detail-value">25k/50k (50%)</span>
            </div>
            <div className="detail">
              <span className="detail-label">Packages:</span>
              <span className="detail-value">3/5 (60%)</span>
            </div>
          </div>

          <div className="remaining-info">
            <div className="remaining-item">
              <span className="remaining-label">⏱️ Remaining Hours:</span>
              <span className="remaining-value">180 hours</span>
            </div>
            <div className="remaining-item">
              <span className="remaining-label">💰 Remaining Budget:</span>
              <span className="remaining-value">25,000 DH</span>
            </div>
            <div className="remaining-item">
              <span className="remaining-label">📅 Days Remaining:</span>
              <span className="remaining-value">45 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* PERMISSION MATRIX */}
      <div className="permissions-section">
        <h2 className="section-title">🔐 Role Permissions Matrix</h2>
        
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Action</th>
              <th className="admin-col">Admin</th>
              <th className="responsable-col">Responsable</th>
              <th className="superviseur-col">Superviseur</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Create Project</td>
              <td>❌</td>
              <td>✅</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Edit Project Details</td>
              <td>❌</td>
              <td>✅</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Add Tasks</td>
              <td>❌</td>
              <td>✅</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Mark Task Complete</td>
              <td>❌</td>
              <td>✅</td>
              <td>✅</td>
            </tr>
            <tr>
              <td>Validate Tasks</td>
              <td>❌</td>
              <td>✅</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>View All Projects</td>
              <td>✅</td>
              <td>✅</td>
              <td>⚠️ (Assigned)</td>
            </tr>
            <tr>
              <td>Edit Progress</td>
              <td>❌</td>
              <td>✅</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Modify Budget</td>
              <td>❌</td>
              <td>✅</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>View Remaining Hours</td>
              <td>✅</td>
              <td>✅</td>
              <td>✅</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default WorkflowDiagram;
