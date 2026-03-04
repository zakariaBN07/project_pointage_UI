import React, { useState } from 'react';
import { tasksApi } from '../../../services/tasks';
import '../styles/TaskList.css';

/**
 * Displays list of tasks with completion status and complete button
 * Only superviseurs can mark tasks complete
 */
const TaskList = ({ tasks, onTaskComplete, superviseurId }) => {
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  const handleCompleteTask = async (taskId) => {
    setLoading(prev => ({ ...prev, [taskId]: true }));
    setError(null);
    try {
      await tasksApi.completeTask(taskId, superviseurId);
      if (onTaskComplete) {
        onTaskComplete(taskId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  if (!tasks || tasks.length === 0) {
    return <div className="task-list-empty">No tasks yet</div>;
  }

  return (
    <div className="task-list">
      {error && <div className="task-error">{error}</div>}
      {tasks.map((task) => (
        <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
          <div className="task-header">
            <span className="task-name">{task.name}</span>
            <span className="task-weight">{Number(task.weightPercent).toFixed(1)}%</span>
          </div>
          <div className="task-footer">
            <span className={`task-status ${task.completed ? 'completed' : 'pending'}`}>
              {task.completed ? '✓ Completed' : 'Pending'}
            </span>
            {superviseurId && !task.completed && (
              <button
                className="btn-complete task-complete-btn"
                onClick={() => handleCompleteTask(task.id)}
                disabled={loading[task.id]}
              >
                {loading[task.id] ? 'Completing...' : 'Mark Complete'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
