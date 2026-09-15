import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Check
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { taskAPI, progressAPI, aiAPI } from '../services/api';
import ProgressRing from '../components/ProgressRing';
import StatCard from '../components/StatCard';
import NextActionBanner from '../components/NextActionBanner';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [nextAction, setNextAction] = useState(null);
  const [learningPath, setLearningPath] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [progRes, tasksRes, actionRes, learnRes] = await Promise.all([
        progressAPI.getProgress(),
        taskAPI.getTasks({}),
        aiAPI.getNextAction(),
        aiAPI.getLearningPath()
      ]);

      setProgress(progRes.data);
      setTasks(tasksRes.data);
      setNextAction(actionRes.data);
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

  const handleToggleTask = async (taskId, newStatus) => {
    try {
      const res = await taskAPI.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? res.data.task : t))
      );
      if (res.data.progress) {
        setProgress(res.data.progress);
      }
      // Refresh next best action
      const actionRes = await aiAPI.getNextAction();
      setNextAction(actionRes.data);
    } catch (err) {
      console.error('Error toggling task status:', err);
    }
  };

  const todayTasks = tasks.slice(0, 5);

  const activityData = [
    { day: 'Mon', completed: 2, queries: 4 },
    { day: 'Tue', completed: 3, queries: 6 },
    { day: 'Wed', completed: 4, queries: 7 },
    { day: 'Thu', completed: 2, queries: 5 },
    { day: 'Fri', completed: 2, queries: 8 }
  ];

  if (loading) {
    return (
      <div className="page-container dashboard-grid">
        <LoadingSkeleton height="150px" />
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

  const currentLearningStage =
    learningPath?.stages?.find((s) => s.status === 'in_progress') ||
    learningPath?.stages?.[0];

  return (
    <div className="page-container dashboard-grid">
      {/* 1. Welcome Section */}
      <div className="welcome-card">
        <div className="welcome-text">
          <h1>
            Good morning, {user?.name?.split(' ')[0] || 'Team Member'} 👋
          </h1>
          <p>
            Welcome to your onboarding workspace. Your autonomous AI agent has
            structured your roadmap for <strong>{user?.role}</strong> in{' '}
            <strong>{user?.department}</strong>.
          </p>
          <div className="welcome-badges">
            <span className="badge badge-it">{user?.role}</span>
            <span className="badge badge-engineering">{user?.department}</span>
            <span className="badge badge-training">{user?.experience}</span>
          </div>
        </div>
        <div style={{ zIndex: 2 }}>
          <button className="btn btn-primary" onClick={() => navigate('/assistant')}>
            <Sparkles size={16} />
            <span>Ask AI Assistant</span>
          </button>
        </div>
      </div>

      {/* 2. Autonomous Next Best Action Banner */}
      <NextActionBanner
        nextAction={nextAction}
        onComplete={(id) => handleToggleTask(id, 'completed')}
      />

      {/* 3. Progress & KPI Stats Row */}
      <div className="stats-grid">
        <div className="progress-hero-card">
          <ProgressRing percentage={progress?.overallPercentage ?? 0} size={100} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Overall Progress
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
              {progress?.completedTasks ?? 0} / {progress?.totalTasks ?? 0} Done
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
              {progress?.overallPercentage === 100
                ? 'All milestones complete! 🎉'
                : progress?.overallPercentage >= 50
                ? 'On track for milestone checklist'
                : 'Getting started with onboarding'}
            </div>
          </div>
        </div>

        <StatCard
          title="Completed"
          value={progress?.completedTasks ?? 0}
          icon={CheckCircle2}
          color="var(--success)"
          subtitle="Tasks finalized"
        />

        <StatCard
          title="In Progress"
          value={progress?.inProgressTasks ?? 0}
          icon={Clock}
          color="var(--accent-primary)"
          subtitle="Active today"
        />

        <StatCard
          title="Overdue"
          value={progress?.overdueTasks ?? 0}
          icon={AlertTriangle}
          color="var(--danger)"
          subtitle="Needs attention"
        />
      </div>

      {/* 4. Two-Column Detailed Dashboard Section */}
      <div className="dashboard-columns">
        {/* Left Column: Today's Tasks */}
        <div className="card">
          <div className="section-card-header">
            <h2 className="section-card-title">
              <CheckCircle2 size={18} color="var(--accent-primary)" />
              <span>Today's Priority Tasks</span>
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/tasks')}
            >
              <span>View All ({tasks.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="tasks-compact-list">
            {todayTasks.map((t) => {
              const isDone = t.status === 'completed';
              return (
                <div key={t._id} className="task-compact-item">
                  <div className="task-compact-left">
                    <button
                      className={`task-checkbox ${isDone ? 'completed' : ''}`}
                      onClick={() =>
                        handleToggleTask(t._id, isDone ? 'not_started' : 'completed')
                      }
                    >
                      {isDone && <Check size={12} />}
                    </button>
                    <div>
                      <span className={`task-compact-title ${isDone ? 'completed' : ''}`}>
                        {t.title}
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                        <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>
                          Day {t.dayNumber}
                        </span>
                        <span className="badge badge-it" style={{ fontSize: '0.7rem' }}>
                          {t.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      t.priority === 'high' ? 'badge-high' : 'badge-medium'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Learning Stage & Activity Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Learning Stage Card */}
          <div className="card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <BookOpen size={18} color="var(--accent-primary)" />
                <span>Current Learning Stage</span>
              </h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/learning')}
              >
                <span>Timeline</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {currentLearningStage && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-it">
                    {currentLearningStage.stageLabel}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Est. {currentLearningStage.estimatedHours}h
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {currentLearningStage.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {currentLearningStage.description}
                </p>
              </div>
            )}
          </div>

          {/* Activity Chart */}
          <div className="card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <TrendingUp size={18} color="var(--accent-primary)" />
                <span>Weekly Activity</span>
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Tasks & AI Sessions
              </span>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorQueries" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stopColor="#FF5722" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#FF5722" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: 8,
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: 12
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="queries"
                    stroke="#FF5722"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorQueries)"
                    name="AI Queries"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#E11D48"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    name="Tasks Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
