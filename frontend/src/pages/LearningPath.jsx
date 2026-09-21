import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Clock,
  Check,
  Lock,
  Sparkles,
  Zap,
  BookOpen,
  Award,
  Layers,
  ArrowRight,
  ChevronRight,
  Bot,
  UploadCloud,
  FileText,
  Lightbulb,
  Target
} from 'lucide-react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProgressRing from '../components/ProgressRing';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/learning.css';

const LearningPath = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

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
      // Optimistic update
      setLearningPath((prev) => {
        if (!prev || !prev.stages) return prev;
        const newStages = [...prev.stages];
        const newStage = { ...newStages[stageIdx] };
        const newModules = [...newStage.modules];
        newModules[modIdx] = {
          ...newModules[modIdx],
          completed: !newModules[modIdx].completed
        };
        newStage.modules = newModules;
        newStages[stageIdx] = newStage;
        return { ...prev, stages: newStages };
      });

      const res = await aiAPI.toggleLearningModule(stageIdx, modIdx);
      if (res.data) {
        setLearningPath(res.data);
      }
    } catch (err) {
      console.error('Failed to toggle module:', err);
      fetchLearningPath();
    }
  };

  const scrollToStage = (stageIdx) => {
    const el = document.getElementById(`stage-card-${stageIdx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleAskAITutor = (stageTitle) => {
    navigate('/assistant', {
      state: {
        initialQuery: `Can you explain the key concepts and requirements for "${stageTitle}" in my onboarding learning path?`
      }
    });
  };

  if (loading) {
    return (
      <div className="page-container learning-page-wrapper">
        <LoadingSkeleton height="180px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginTop: '1.5rem' }}>
          <LoadingSkeleton height="95px" />
          <LoadingSkeleton height="95px" />
          <LoadingSkeleton height="95px" />
          <LoadingSkeleton height="95px" />
        </div>
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <LoadingSkeleton height="260px" />
          <LoadingSkeleton height="260px" />
        </div>
      </div>
    );
  }

  const stages = learningPath?.stages || [];

  // Compute live statistics
  const totalStages = stages.length;
  const completedStages = stages.filter((s) => s.status === 'completed').length;
  const allModules = stages.flatMap((s) => s.modules || []);
  const totalModules = allModules.length;
  const completedModules = allModules.filter((m) => m.completed).length;
  const overallPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const totalHours = stages.reduce((acc, s) => acc + (s.estimatedHours || 0), 0);
  const currentStage = stages.find((s) => s.status === 'in_progress') || stages[0];

  // Filtering
  const filteredStages = stages.filter((s) => {
    if (activeFilter === 'completed') return s.status === 'completed';
    if (activeFilter === 'in_progress') return s.status === 'in_progress';
    if (activeFilter === 'upcoming') return s.status === 'upcoming' || s.status === 'locked';
    return true;
  });

  return (
    <div className="page-container learning-page-wrapper">
      {/* 1. Hero Overview & Roadmap Banner */}
      <div className="learning-hero-banner">
        <div className="learning-hero-left">
          <div className="learning-pretitle-badge">
            <Sparkles size={13} />
            <span>AUTONOMOUS CURRICULUM</span>
          </div>

          <h1 className="learning-main-title">
            AI Learning Path <span className="learning-title-gradient">&amp; Skills Roadmap</span>
          </h1>

          <p className="learning-subtitle">
            Progressive technical milestones and compliance frameworks synthesized from uploaded
            enterprise documentation to take you from foundational setup to production readiness.
          </p>

          <div className="learning-hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => handleAskAITutor(currentStage?.title || 'Core Foundations')}
            >
              <Bot size={16} />
              <span>Ask AI Tutor</span>
              <ArrowRight size={14} />
            </button>

            <button className="btn btn-outline" onClick={() => navigate('/documents')}>
              <UploadCloud size={15} />
              <span>Upload More Knowledge</span>
            </button>
          </div>
        </div>

        {/* Right Circular Progress Card */}
        <div className="learning-hero-progress-widget">
          <ProgressRing percentage={overallPercentage} size={90} strokeWidth={9} />
          <div className="progress-widget-info">
            <span className="progress-widget-label">Curriculum Mastery</span>
            <span className="progress-widget-value">{overallPercentage}%</span>
            <span className="progress-widget-subtext">
              {completedModules} of {totalModules} modules finished
            </span>
          </div>
        </div>
      </div>

      {/* 2. 4 Modern High-Impact KPI Metric Cards */}
      <div className="learning-metrics-grid">
        <div className="learning-metric-card">
          <div className="metric-icon-box green">
            <Compass size={22} color="#00A884" />
          </div>
          <div className="metric-content">
            <span className="metric-title">Curriculum Stages</span>
            <span className="metric-number">{totalStages} Stages</span>
            <span className="metric-sub">{completedStages} completed</span>
          </div>
        </div>

        <div className="learning-metric-card">
          <div className="metric-icon-box blue">
            <CheckCircle2 size={22} color="#0284C7" />
          </div>
          <div className="metric-content">
            <span className="metric-title">Completed Modules</span>
            <span className="metric-number">
              {completedModules} / {totalModules}
            </span>
            <span className="metric-sub">{overallPercentage}% total progress</span>
          </div>
        </div>

        <div className="learning-metric-card">
          <div className="metric-icon-box purple">
            <Clock size={22} color="#7C3AED" />
          </div>
          <div className="metric-content">
            <span className="metric-title">Estimated Effort</span>
            <span className="metric-number">{totalHours} Hours</span>
            <span className="metric-sub">Self-paced technical modules</span>
          </div>
        </div>

        <div className="learning-metric-card">
          <div className="metric-icon-box amber">
            <Award size={22} color="#D97706" />
          </div>
          <div className="metric-content">
            <span className="metric-title">Active Milestone</span>
            <span className="metric-number">
              {currentStage ? (currentStage.stageLabel || 'STAGE 01') : 'Ready'}
            </span>
            <span className="metric-sub">In progress roadmap</span>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Visual Stepper Roadmap */}
      {stages.length > 0 && (
        <div className="roadmap-stepper-container">
          {stages.map((stg, sIdx) => {
            const isDone = stg.status === 'completed';
            const isActive = stg.status === 'in_progress';
            const isLocked = stg.status === 'locked';
            const stageNum = String(sIdx + 1).padStart(2, '0');

            return (
              <React.Fragment key={stg.stage || sIdx}>
                <div className="stepper-stage-node" onClick={() => scrollToStage(sIdx)}>
                  <div
                    className={`stepper-node-circle ${
                      isDone ? 'completed' : isActive ? 'active' : isLocked ? 'locked' : 'upcoming'
                    }`}
                  >
                    {isDone ? <Check size={16} strokeWidth={3} /> : stageNum}
                  </div>
                  <div className="stepper-node-details">
                    <span
                      className={`stepper-node-label ${
                        isDone ? 'completed' : isActive ? 'active' : isLocked ? 'locked' : 'upcoming'
                      }`}
                    >
                      {isDone ? 'Done' : isActive ? 'Current' : isLocked ? 'Locked' : 'Upcoming'}
                    </span>
                    <span className="stepper-node-title">{stg.title.split(':')[0]}</span>
                  </div>
                </div>

                {sIdx < stages.length - 1 && (
                  <ChevronRight size={18} className="stepper-connector-arrow" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 4. Filter Controls & Stages Timeline */}
      <div className="learning-filter-row">
        <div className="filter-pills-group">
          <button
            className={`filter-pill-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Stages <span className="filter-count-badge">{stages.length}</span>
          </button>
          <button
            className={`filter-pill-btn ${activeFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setActiveFilter('in_progress')}
          >
            In Progress{' '}
            <span className="filter-count-badge">
              {stages.filter((s) => s.status === 'in_progress').length}
            </span>
          </button>
          <button
            className={`filter-pill-btn ${activeFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('completed')}
          >
            Completed{' '}
            <span className="filter-count-badge">
              {stages.filter((s) => s.status === 'completed').length}
            </span>
          </button>
          <button
            className={`filter-pill-btn ${activeFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveFilter('upcoming')}
          >
            Upcoming{' '}
            <span className="filter-count-badge">
              {stages.filter((s) => s.status === 'upcoming' || s.status === 'locked').length}
            </span>
          </button>
        </div>

        <span className="learning-curriculum-badge-tag">
          Configured for <strong>{user?.role || 'Full Stack Developer'}</strong> in{' '}
          <strong>{user?.department || 'Engineering'}</strong>
        </span>
      </div>

      {/* 5. Stages List with Vertical Connected Spine */}
      {stages.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            background: '#FFFFFF',
            borderRadius: '20px'
          }}
        >
          <Compass size={48} color="#00A884" style={{ margin: '0 auto 1.25rem', opacity: 0.8 }} />
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              color: '#0F172A',
              marginBottom: '0.5rem'
            }}
          >
            No Learning Path Synthesized Yet
          </h3>
          <p
            style={{
              color: '#64748B',
              fontSize: '0.92rem',
              maxWidth: '480px',
              margin: '0 auto 1.5rem',
              lineHeight: 1.5
            }}
          >
            Upload your company employee handbook or technical documentation in the Knowledge Center
            to automatically synthesize your personalized onboarding roadmap.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/documents')}>
            <UploadCloud size={16} />
            <span>Upload Company Document</span>
          </button>
        </div>
      ) : (
        <div className="learning-timeline-container">
          {filteredStages.map((stage, stageIdx) => {
            const isDone = stage.status === 'completed';
            const isActive = stage.status === 'in_progress';
            const isLocked = stage.status === 'locked';

            const stageModules = stage.modules || [];
            const stageCompletedMods = stageModules.filter((m) => m.completed).length;
            const stagePercent =
              stageModules.length > 0
                ? Math.round((stageCompletedMods / stageModules.length) * 100)
                : 0;

            const stageNumberStr = String(stageIdx + 1).padStart(2, '0');

            return (
              <div
                key={stage.stage || stageIdx}
                id={`stage-card-${stageIdx}`}
                className="timeline-stage-wrapper"
              >
                {/* Timeline Node Circle on the Spine */}
                <div
                  className={`timeline-stage-node-icon ${
                    isDone ? 'completed' : isActive ? 'active' : isLocked ? 'locked' : 'upcoming'
                  }`}
                >
                  {isDone ? (
                    <Check size={18} strokeWidth={3} />
                  ) : isLocked ? (
                    <Lock size={15} />
                  ) : (
                    stageNumberStr
                  )}
                </div>

                {/* Stage Card */}
                <div className={`modern-stage-card ${isActive ? 'is-active' : ''}`}>
                  {/* Top Bar */}
                  <div className="stage-card-top">
                    <div className="stage-card-meta-left">
                      <span className={`stage-tag-badge ${stage.stage || 'foundation'}`}>
                        {stage.stageLabel || `STAGE ${stageNumberStr}`}
                      </span>

                      <div className="stage-hours-pill">
                        <Clock size={12} />
                        <span>{stage.estimatedHours} Hours Estimated</span>
                      </div>
                    </div>

                    <div className="stage-card-meta-right">
                      {isDone ? (
                        <span className="stage-status-badge completed">
                          <CheckCircle2 size={13} /> Stage Completed
                        </span>
                      ) : isActive ? (
                        <span className="stage-status-badge active">
                          <Zap size={13} /> Active Learning Stage
                        </span>
                      ) : isLocked ? (
                        <span className="stage-status-badge locked">
                          <Lock size={13} /> Locked (Requires Prior Stages)
                        </span>
                      ) : (
                        <span className="stage-status-badge upcoming">Upcoming Stage</span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h2 className="stage-card-title">{stage.title}</h2>
                  <p className="stage-card-desc">{stage.description}</p>

                  {/* Stage Progress Bar */}
                  <div className="stage-progress-container">
                    <div className="stage-progress-bar-bg">
                      <div
                        className="stage-progress-bar-fill"
                        style={{ width: `${stagePercent}%` }}
                      />
                    </div>
                    <span className="stage-progress-text">
                      {stageCompletedMods} of {stageModules.length} Modules ({stagePercent}%)
                    </span>
                  </div>

                  {/* Modern Modular Checklist Grid */}
                  {stageModules.length > 0 && (
                    <div className="modern-modules-grid">
                      {stageModules.map((mod, modIdx) => {
                        const isModDone = mod.completed;
                        return (
                          <div
                            key={modIdx}
                            className={`modern-module-item ${isModDone ? 'completed' : ''}`}
                            onClick={() => handleToggleModule(stageIdx, modIdx)}
                          >
                            <div className={`module-custom-checkbox ${isModDone ? 'completed' : ''}`}>
                              {isModDone && <Check size={13} strokeWidth={3} />}
                            </div>

                            <div className="module-info-wrap">
                              <span className={`module-item-title ${isModDone ? 'completed' : ''}`}>
                                {mod.title}
                              </span>
                              <span className="module-sub-tag">
                                <FileText size={11} />
                                {isModDone ? 'Milestone Mastered' : 'Interactive Reading & Practice'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Card Bottom Footer */}
                  <div className="stage-card-footer">
                    <div className="stage-tip-note">
                      <Lightbulb size={14} color="#00A884" />
                      <span>
                        Click modules to track mastery. Active progress syncs to your personal roadmap.
                      </span>
                    </div>

                    <button
                      className="stage-ai-tutor-btn"
                      onClick={() => handleAskAITutor(stage.title)}
                    >
                      <Bot size={14} />
                      <span>Ask AI about this stage</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearningPath;
