import React from 'react';
import '../styles/MetricsDisplay.css';

/**
 * Displays project metrics: planned/consumed/remaining hours, progress%, time%, and alert badge
 */
const MetricsDisplay = ({ metrics }) => {
  if (!metrics) return <div className="metrics-loading">Loading metrics...</div>;

  const {
    plannedHours,
    consumedHours,
    remainingHours,
    progressPercent,
    timePercent,
    timeExceedsProgress,
  } = metrics;

  return (
    <div className="metrics-container">
      <div className="metrics-row">
        <div className="metric-box">
          <label>Planned Hours</label>
          <p className="metric-value">{plannedHours ? Number(plannedHours).toFixed(2) : '0.00'} h</p>
        </div>
        <div className="metric-box">
          <label>Consumed Hours</label>
          <p className="metric-value">{consumedHours ? Number(consumedHours).toFixed(2) : '0.00'} h</p>
        </div>
        <div className="metric-box">
          <label>Remaining Hours</label>
          <p className="metric-value">{remainingHours ? Number(remainingHours).toFixed(2) : '0.00'} h</p>
        </div>
      </div>

      <div className="metrics-row">
        <div className="metric-box">
          <label>Progress %</label>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(Number(progressPercent), 100)}%` }}
            />
          </div>
          <p className="metric-value">{Number(progressPercent).toFixed(2)}%</p>
        </div>

        <div className="metric-box">
          <label>Time Consumption %</label>
          <div className="progress-bar">
            <div
              className={`progress-fill ${timeExceedsProgress ? 'alert' : 'normal'}`}
              style={{ width: `${Math.min(Number(timePercent), 100)}%` }}
            />
          </div>
          <p className="metric-value">{Number(timePercent).toFixed(2)}%</p>
        </div>
      </div>

      {timeExceedsProgress && (
        <div className="alert-banner">
          <span className="alert-icon">⚠️</span>
          <span>Behind schedule: Time consumption is greater than progress</span>
        </div>
      )}
    </div>
  );
};

export default MetricsDisplay;
