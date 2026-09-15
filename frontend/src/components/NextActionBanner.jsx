import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NextActionBanner = ({ nextAction, onComplete }) => {
  const navigate = useNavigate();

  if (!nextAction || !nextAction.task_title) return null;

  return (
    <div className="next-action-banner">
      <div className="next-action-content">
        <div className="next-action-icon">
          <Sparkles size={22} />
        </div>
        <div>
          <div className="next-action-label">
            <Sparkles size={12} />
            <span>AI Autonomous Next Best Action</span>
          </div>
          <h3 className="next-action-title">{nextAction.task_title}</h3>
          <p className="next-action-reason">
            <strong>Reasoning:</strong> {nextAction.reason}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
        {nextAction.task_id && onComplete && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onComplete(nextAction.task_id)}
          >
            <CheckCircle2 size={15} color="var(--success)" />
            <span>Mark Done</span>
          </button>
        )}
        <button
          className="btn btn-cyan btn-sm"
          onClick={() => navigate('/tasks')}
        >
          <span>View in Roadmap</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default NextActionBanner;
