import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  GraduationCap,
  TrendingUp,
  Check,
  Target,
  Briefcase,
  Users,
  Award,
  Map,
  MessageSquare,
  Zap,
  FileText,
  Sprout,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, progressAPI, aiAPI } from '../services/api';
import ProgressRing from '../components/ProgressRing';
import StatCard from '../components/StatCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import officeHeroImg from '../assets/office_hero.jpg';
import booksSproutImg from '../assets/books_sprout.jpg';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [learningPath, setLearningPath] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [progRes, tasksRes, learnRes] = await Promise.all([
        progressAPI.getProgress(),
        taskAPI.getTasks({}),
        aiAPI.getLearningPath()
      ]);

      setProgress(progRes.data);
      setTasks(tasksRes.data);
      setLearningPath(learnRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    try {
      const res = await taskAPI.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? res.data.task : t))
      );
      if (res.data.progress) {
        setProgress(res.data.progress);
      }
    } catch (err) {
      console.error('Error toggling task status:', err);
    }
  };

  const todayTasks = tasks.slice(0, 4);

  // Time formatting fallback for priority tasks
  const getTaskTime = (index) => {
    const times = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM'];
    return times[index % times.length];
  };

  const getCategoryClass = (cat) => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('hr') || lower.includes('people')) return 'badge-dept';
    if (lower.includes('it') || lower.includes('dev') || lower.includes('tech')) return 'badge-it';
    return 'badge-general';
  };

  if (loading) {
    return (
      <div className="page-container dashboard-grid">
        <LoadingSkeleton height="200px" />
        <div className="stats-grid">
          <LoadingSkeleton height="120px" />
          <LoadingSkeleton height="120px" />
          <LoadingSkeleton height="120px" />
          <LoadingSkeleton height="120px" />
        </div>
        <LoadingSkeleton height="350px" />
      </div>
    );
  }

  const overallPercentage = progress?.overallPercentage ?? 100;
  const completedCount = progress?.completedTasks ?? 6;
  const totalCount = progress?.totalTasks ?? 6;

  return (
    <div className="page-container dashboard-grid">
      {/* 1. Welcome Hero Banner matching Reference Screenshot */}
      <div className="hero-banner-card">
        <div className="hero-banner-left">
          <h1 className="hero-greeting">
            Good morning, {user?.name?.split(' ')[0] || 'Jaiwant'} 👋
          </h1>
          <p className="hero-description">
            Welcome to <strong>OnboardIQ</strong> — your AI-powered onboarding workspace. Your autonomous <strong>AI</strong> agent has structured your roadmap for{' '}
            <span className="hero-highlight">{user?.role || 'HR Administrator'}</span> in{' '}
            <span className="hero-highlight">{user?.department || 'People & HR'}</span>.
          </p>

          <div className="hero-badges-row">
            <span className="badge badge-hr">
              <Briefcase size={13} />
              <span>{user?.role || 'HR Administrator'}</span>
            </span>
            <span className="badge badge-dept">
              <Users size={13} />
              <span>{user?.department || 'People & HR'}</span>
            </span>
            <span className="badge badge-training">
              <Award size={13} />
              <span>{user?.experience || 'Senior (5+ yrs)'}</span>
            </span>
          </div>

          <div className="hero-actions-row">
            <button className="btn btn-primary" onClick={() => navigate('/assistant')}>
              <Sparkles size={16} />
              <span>Ask AI Assistant</span>
              <ArrowRight size={15} />
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/onboarding')}>
              <Map size={15} />
              <span>View My Roadmap</span>
            </button>
          </div>
        </div>

        {/* Center Quote */}
        <div className="hero-banner-quote-col">
          <p className="hero-quote-text">
            “A great beginning<br />leads to a greater you.”
          </p>
          <div className="hero-quote-underline" />
        </div>

        {/* Right Office Walkway Image Background with Gradient Mask */}
        <div className="hero-banner-image-wrap">
          <img src={officeHeroImg} alt="Modern Corporate Campus" className="hero-banner-img" />
          <div className="hero-banner-fade-overlay" />
        </div>

        {/* Far Right Feature Chips */}
        <div className="hero-feature-chips">
          <div className="feature-chip">
            <MessageSquare size={14} className="chip-icon" />
            <span>Learn Faster</span>
          </div>
          <div className="feature-chip">
            <Zap size={14} className="chip-icon" />
            <span>Work Smarter</span>
          </div>
          <div className="feature-chip">
            <FileText size={14} className="chip-icon" />
            <span>Stay Informed</span>
          </div>
          <div className="feature-chip">
            <Sprout size={14} className="chip-icon" />
            <span>Grow Together</span>
          </div>
        </div>
      </div>

      {/* 2. Progress & KPI Stats Row (4 cards) */}
      <div className="stats-grid">
        {/* Card 1: Overall Progress Ring */}
        <div className="progress-hero-card">
          <div className="progress-card-top-badge">
            <TrendingUp size={16} color="#00A884" />
          </div>
          <ProgressRing percentage={overallPercentage} size={90} strokeWidth={9} />
          <div className="progress-text-col">
            <span className="progress-label">OVERALL PROGRESS</span>
            <div className="progress-numbers">
              {completedCount} / {totalCount} Done
            </div>
            <div className="progress-status-msg">
              {overallPercentage === 100
                ? 'All milestones complete! 🎉'
                : 'Great progress this week!'}
            </div>
          </div>
          <div className="stat-wave-container">
            <svg viewBox="0 0 140 28" preserveAspectRatio="none" className="stat-wave-svg">
              <path
                d="M 0 16 C 30 24, 50 8, 80 18 C 110 24, 130 10, 140 16"
                fill="none"
                stroke="#00A884"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.5"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Completed */}
        <StatCard
          title="COMPLETED"
          value={completedCount}
          icon={CheckSquare}
          color="#00A884"
          subtitle="Tasks finalized"
          waveColor="#00A884"
        />

        {/* Card 3: In Progress */}
        <StatCard
          title="IN PROGRESS"
          value={progress?.inProgressTasks ?? 0}
          icon={Clock}
          color="#0284C7"
          subtitle="Active today"
          waveColor="#0284C7"
        />

        {/* Card 4: Overdue */}
        <StatCard
          title="OVERDUE"
          value={progress?.overdueTasks ?? 0}
          icon={AlertTriangle}
          color="#EF4444"
          subtitle="Needs attention"
          waveColor="#EF4444"
        />
      </div>

      {/* 3. Two-Column Dashboard Content */}
      <div className="dashboard-columns">
        {/* Left Column: Today's Priority Tasks */}
        <div className="dashboard-card priority-tasks-card">
          <div className="section-header-row">
            <div className="section-title-wrap">
              <div className="section-header-icon">
                <Target size={18} color="#00A884" />
              </div>
              <div>
                <h2 className="section-title">Today's Priority Tasks</h2>
                <p className="section-subtitle">
                  Keep the momentum going! Here are your key tasks for today.
                </p>
              </div>
            </div>
            <button
              className="view-all-link-btn"
              onClick={() => navigate('/tasks')}
            >
              <span>View All ({tasks.length || 6})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="tasks-compact-list">
            {(todayTasks.length > 0 ? todayTasks : [
              { _id: '1', title: 'Complete HR registration', category: 'HR', status: 'completed' },
              { _id: '2', title: 'Read employee handbook', category: 'General', status: 'completed' },
              { _id: '3', title: 'Set-up company email', category: 'IT', status: 'completed' }
            ]).map((t, idx) => {
              const isDone = t.status === 'completed';
              return (
                <div key={t._id} className="task-row-item">
                  <div className="task-row-left">
                    <button
                      className={`task-circle-checkbox ${isDone ? 'checked' : ''}`}
                      onClick={() => handleToggleTask(t._id, t.status)}
                      title={isDone ? 'Mark Incomplete' : 'Mark Complete'}
                    >
                      {isDone && <Check size={13} strokeWidth={3} />}
                    </button>
                    <span className={`task-row-title ${isDone ? 'done' : ''}`}>
                      {t.title}
                    </span>
                  </div>

                  <div className="task-row-meta">
                    <span className={`badge ${getCategoryClass(t.category)}`}>
                      {t.category || 'HR'}
                    </span>
                    <span className="badge badge-time">
                      {getTaskTime(idx)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Current Learning Stage */}
        <div className="dashboard-card learning-stage-card">
          <div className="section-header-row">
            <div className="section-title-wrap">
              <div className="section-header-icon">
                <GraduationCap size={18} color="#00A884" />
              </div>
              <div>
                <h2 className="section-title">Current Learning Stage</h2>
              </div>
            </div>
            <button
              className="view-all-link-btn"
              onClick={() => navigate('/learning')}
            >
              <span>Timeline</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="learning-stage-body">
            {/* Vertical Stepper */}
            <div className="learning-stepper">
              {/* Step 1: Completed */}
              <div className="stepper-item completed">
                <div className="stepper-node done">
                  <Check size={12} strokeWidth={3} />
                </div>
                <div className="stepper-info">
                  <div className="stepper-title">Onboarding Basics</div>
                  <div className="stepper-status done-text">Completed</div>
                </div>
              </div>
              <div className="stepper-line done" />

              {/* Step 2: In Progress */}
              <div className="stepper-item in-progress">
                <div className="stepper-node active">
                  <div className="stepper-node-dot" />
                </div>
                <div className="stepper-info">
                  <div className="stepper-title">Company Policies</div>
                  <div className="stepper-status active-text">In Progress</div>
                  <div className="stepper-progress-track">
                    <div className="stepper-progress-fill" style={{ width: '60%' }} />
                    <span className="stepper-progress-pct">60%</span>
                  </div>
                </div>
              </div>
              <div className="stepper-line" />

              {/* Step 3: Upcoming */}
              <div className="stepper-item upcoming">
                <div className="stepper-node upcoming" />
                <div className="stepper-info">
                  <div className="stepper-title">HR Tools & Systems</div>
                  <div className="stepper-status upcoming-text">Upcoming</div>
                </div>
              </div>
            </div>

            {/* Right Sprouting Books Illustration Box */}
            <div className="learning-illustration-card">
              <img
                src={booksSproutImg}
                alt="Knowledge Sprout"
                className="learning-card-img"
              />
              <p className="learning-quote">
                “Knowledge today,<br />a brighter tomorrow.”
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
