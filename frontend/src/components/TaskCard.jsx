import React from 'react';
import { Check, Clock, Calendar, Trash2 } from 'lucide-react';

const TaskCard = ({ task, onToggleStatus, onDelete }) => {
  const isDone = task.status === 'completed';

  const getCategoryClass = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'hr': return 'badge-hr';
      case 'it': return 'badge-it';
      case 'security': return 'badge-security';
      case 'engineering': return 'badge-engineering';
      case 'training': return 'badge-training';
      default: return 'badge-engineering';
    }
  };

  const getPriorityClass = (prio) => {
    switch (prio?.toLowerCase()) {
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  return (
    <div className={`task-item-card ${isDone ? 'is-completed' : ''}`}>
      <div className="task-main-col">
        <button
          className={`task-checkbox-lg ${isDone ? 'completed' : ''}`}
          onClick={() => onToggleStatus(task._id, isDone ? 'not_started' : 'completed')}
          title={isDone ? 'Mark Incomplete' : 'Mark Completed'}
        >
          {isDone && <Check size={16} />}
        </button>

        <div className="task-details-col">
          <h3 className={isDone ? 'strikethrough' : ''}>{task.title}</h3>
          {task.description && <p>{task.description}</p>}

          <div className="task-meta-tags">
            <span className={`badge ${getCategoryClass(task.category)}`}>
              {task.category}
            </span>
            <span className={`badge ${getPriorityClass(task.priority)}`}>
              {task.priority?.toUpperCase()}
            </span>
            <span className="badge badge-low">
              <Calendar size={11} /> Day {task.dayNumber || 1}
            </span>
            {task.estimatedMinutes && (
              <span className="badge badge-low">
                <Clock size={11} /> {task.estimatedMinutes}m
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="task-actions-col">
        <select
          className="status-select-badge"
          value={task.status}
          onChange={(e) => onToggleStatus(task._id, e.target.value)}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {task.isCustom && onDelete && (
          <button
            onClick={() => onDelete(task._id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem'
            }}
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
