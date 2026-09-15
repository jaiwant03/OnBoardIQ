import React, { useState, useEffect } from 'react';
import { Compass, CheckCircle2, Clock, Check, Lock, Sparkles } from 'lucide-react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/learning.css';

const LearningPath = () => {
  const { user } = useAuth();
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningPath();
  }, []);

  const fetchLearningPath = async () => {
    try {
      setLoading(true);
      const res = await aiAPI.getLearningPath();
      setLearningPath(res.data);
    } catch (err) {
      console.error('Failed to load learning path:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = async (stageIdx, modIdx) => {
    try {
      const res = await aiAPI.toggleLearningModule(stageIdx, modIdx);
      setLearningPath(res.data);
    } catch (err) {
      console.error('Failed to toggle module:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSkeleton height="60px" width="350px" />
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <LoadingSkeleton height="180px" />
          <LoadingSkeleton height="180px" />
          <LoadingSkeleton height="180px" />
        </div>
      </div>
    );
  }

  const stages = learningPath?.stages || [];

  return (
    <div className="page-container">
      <div className="learning-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span className="badge badge-it">AUTONOMOUS CURRICULUM</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Configured for {user?.role || 'Software Developer'} ({user?.experience || 'Fresher'})
          </span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          AI Learning Path & Skills Roadmap
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Progressive technical milestones structured to take you from foundational setup to production readiness.
        </p>
      </div>

      <div className="learning-stages-timeline">
        {stages.map((stage, stageIdx) => {
          const isDone = stage.status === 'completed';
          const isActive = stage.status === 'in_progress';
          const isLocked = stage.status === 'locked';

          return (
            <div
              key={stage.stage || stageIdx}
              className={`learning-stage-card ${isActive ? 'is-active' : ''}`}
            >
              <div className="stage-top-bar">
                <div className="stage-badge-group">
                  <span
                    className="stage-indicator-pill"
                    style={{
                      background: isDone
                        ? 'rgba(16, 185, 129, 0.1)'
                        : isActive
                        ? 'rgba(255, 87, 34, 0.1)'
                        : 'rgba(0, 0, 0, 0.03)',
                      color: isDone
                        ? 'var(--success)'
                        : isActive
                        ? 'var(--accent-primary)'
                        : 'var(--text-muted)',
                      border: `1px solid ${
                        isDone
                          ? 'rgba(16, 185, 129, 0.25)'
                          : isActive
                          ? 'rgba(255, 87, 34, 0.25)'
                          : 'var(--border-subtle)'
                      }`
                    }}
                  >
                    {stage.stageLabel || stage.stage.toUpperCase()}
                  </span>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={12} /> {stage.estimatedHours} Hours
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isDone ? (
                    <span className="badge badge-success">
                      ✓ Stage Completed
                    </span>
                  ) : isActive ? (
                    <span className="badge badge-it">
                      → Current Stage
                    </span>
                  ) : isLocked ? (
                    <span className="badge badge-low">
                      <Lock size={11} /> Locked
                    </span>
                  ) : (
                    <span className="badge badge-training">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>

              <h2 className="stage-title">{stage.title}</h2>
              <p className="stage-desc">{stage.description}</p>

              {/* Modules Checklist */}
              {stage.modules && stage.modules.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Curriculum Modules ({stage.modules.filter((m) => m.completed).length} / {stage.modules.length} Completed)
                  </div>
                  <div className="modules-checklist">
                    {stage.modules.map((mod, modIdx) => (
                      <div
                        key={modIdx}
                        className="module-item"
                        onClick={() => handleToggleModule(stageIdx, modIdx)}
                      >
                        <div
                          className={`task-checkbox ${mod.completed ? 'completed' : ''}`}
                          style={{ width: 18, height: 18 }}
                        >
                          {mod.completed && <Check size={11} />}
                        </div>
                        <span className={`module-title ${mod.completed ? 'completed' : ''}`}>
                          {mod.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningPath;
