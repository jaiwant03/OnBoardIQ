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
  FileText,
  Calendar,
  ChevronRight,
  CheckSquare,
  Compass,
  ArrowUpRight,
  MoreVertical,
  MapPin,
  Video,
  MessagesSquare,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { taskAPI, progressAPI, aiAPI } from '../services/api';
import ProgressRing from '../components/ProgressRing';
import officeHeroImg from '../assets/office_hero.jpg';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

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
    const targetTask = tasks.find((t) => t._id === taskId);
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    try {
      const res = await taskAPI.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? res.data.task : t))
      );
      if (res.data.progress) {
        setProgress(res.data.progress);
      }
      addNotification({
        title: newStatus === 'completed' ? 'Priority Task Completed 🎉' : 'Task Status Updated',
        message: `"${targetTask?.title || 'Task'}" marked as ${newStatus === 'completed' ? 'Completed' : 'Pending'}.`,
        type: 'task',
        link: '/onboarding'
      });
    } catch (err) {
      console.error('Error toggling task status:', err);
    }
  };

  const getCategoryBadgeClass = (cat) => {
    const lower = (cat || '').toLowerCase();
    if (lower === 'hr') return 'cat-badge-hr';
    if (lower === 'it') return 'cat-badge-it';
    return 'cat-badge-general';
  };

  const overallPercentage = progress?.overallPercentage ?? 0;
  const completedCount = progress?.completedTasks ?? 0;
  const totalCount = progress?.totalTasks ?? 0;
  const displayTasks = tasks.slice(0, 5);

  return (
    <div className="page-container dashboard-page-wrapper">
      {/* 1. Top Section: Hero Card + Right Quick Nav Cards */}
      <div className="dashboard-top-row">
        {/* Left Hero Card */}
        <div className="hero-main-card">
          <div className="hero-content-col">
            <span className="hero-pretitle">WELCOME TO ONBOARDIQ</span>
            <h1 className="hero-main-greeting">
              Good morning, {user?.name?.split(' ')[0] || 'Jaiwant'} 👋
            </h1>
            <p className="hero-sub-description">
              Your AI-powered onboarding workspace. Your autonomous AI agent has structured your roadmap for{' '}
              <strong>{user?.role || 'HR Administrator'}</strong> in{' '}
              <strong>{user?.department || 'People & HR'}</strong>.
            </p>

            {/* Badges with Role / Department / Experience Labels */}
            <div className="hero-meta-grid">
              <div className="hero-meta-item">
                <div className="hero-meta-top">
                  <Briefcase size={14} color="#00A884" />
                  <span className="hero-meta-val">{user?.role || 'HR Administrator'}</span>
                </div>
                <span className="hero-meta-label">Role</span>
              </div>

              <div className="hero-meta-item">
                <div className="hero-meta-top">
                  <Users size={14} color="#0284C7" />
                  <span className="hero-meta-val">{user?.department || 'People & HR'}</span>
                </div>
                <span className="hero-meta-label">Department</span>
              </div>

              <div className="hero-meta-item">
                <div className="hero-meta-top">
                  <Award size={14} color="#00A884" />
                  <span className="hero-meta-val">{user?.experience || 'Senior (5+ yrs)'}</span>
                </div>
                <span className="hero-meta-label">Experience</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="hero-cta-buttons">
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

          {/* Quote Column */}
          <div className="hero-quote-block">
            <span className="quote-tag">— A GREAT START</span>
            <p className="quote-body">
              “People grow when they feel supported.”
            </p>
            <span className="quote-brand">O N B O A R D I Q</span>
          </div>

          {/* Office Image with Fade */}
          <div className="hero-office-bg">
            <img src={officeHeroImg} alt="Corporate Office" className="hero-office-photo" />
            <div className="hero-office-overlay" />
          </div>
        </div>

        {/* Right Quick Nav Cards Column (4 Cards) */}
        <div className="quick-actions-column">
          <div className="quick-action-card" onClick={() => navigate('/documents')}>
            <div className="quick-action-icon-box">
              <FileText size={18} color="#00A884" />
            </div>
            <div className="quick-action-text">
              <h4 className="quick-action-title">Explore Policies</h4>
              <p className="quick-action-subtitle">Find answers instantly</p>
            </div>
            <ChevronRight size={16} className="quick-action-arrow" />
          </div>

          <div className="quick-action-card" onClick={() => navigate('/learning')}>
            <div className="quick-action-icon-box">
              <GraduationCap size={18} color="#00A884" />
            </div>
            <div className="quick-action-text">
              <h4 className="quick-action-title">Continue Learning</h4>
              <p className="quick-action-subtitle">Boost your skills</p>
            </div>
            <ChevronRight size={16} className="quick-action-arrow" />
          </div>

          <div className="quick-action-card" onClick={() => navigate('/onboarding')}>
            <div className="quick-action-icon-box">
              <TrendingUp size={18} color="#00A884" />
            </div>
            <div className="quick-action-text">
              <h4 className="quick-action-title">Track Progress</h4>
              <p className="quick-action-subtitle">Stay on course</p>
            </div>
            <ChevronRight size={16} className="quick-action-arrow" />
          </div>

          <div className="quick-action-card" onClick={() => navigate('/assistant')}>
            <div className="quick-action-icon-box">
              <HelpCircle size={18} color="#00A884" />
            </div>
            <div className="quick-action-text">
              <h4 className="quick-action-title">Contact HR</h4>
              <p className="quick-action-subtitle">Get help when needed</p>
            </div>
            <ChevronRight size={16} className="quick-action-arrow" />
          </div>
        </div>
      </div>

      {/* 2. Progress & KPI Stats Row (4 Cards) */}
      <div className="kpi-metrics-grid">
        {/* Card 1: Overall Progress */}
        <div className="kpi-card progress-kpi-card">
          <ProgressRing percentage={overallPercentage} size={88} strokeWidth={9} />
          <div className="progress-kpi-info">
            <div className="kpi-header-flex">
              <span className="kpi-small-label">Overall Progress</span>
              <div className="kpi-icon-pill green">
                <ArrowUpRight size={14} color="#00A884" />
              </div>
            </div>
            <div className="kpi-big-value">
              {completedCount} / {totalCount}
            </div>
            <div className="kpi-milestone-tag">Milestones Completed</div>
            <div className="kpi-subtext">
              {totalCount === 0
                ? 'Awaiting company documents'
                : overallPercentage === 100
                ? 'All milestones complete! 🎉'
                : `${overallPercentage}% completed`}
            </div>
          </div>
        </div>

        {/* Card 2: Completed Tasks */}
        <div className="kpi-card" onClick={() => navigate('/tasks')}>
          <div className="kpi-header-flex">
            <div className="kpi-square-icon green">
              <CheckSquare size={18} color="#00A884" />
            </div>
            <div className="kpi-circular-btn">
              <ArrowRight size={14} />
            </div>
          </div>
          <span className="kpi-small-label">Completed Tasks</span>
          <div className="kpi-big-value">{completedCount}</div>
          <div className="kpi-subtext">Tasks finalized</div>
        </div>

        {/* Card 3: In Progress */}
        <div className="kpi-card" onClick={() => navigate('/tasks')}>
          <div className="kpi-header-flex">
            <div className="kpi-square-icon blue">
              <Clock size={18} color="#0284C7" />
            </div>
            <div className="kpi-circular-btn">
              <ArrowRight size={14} />
            </div>
          </div>
          <span className="kpi-small-label">In Progress</span>
          <div className="kpi-big-value">{progress?.inProgressTasks ?? 0}</div>
          <div className="kpi-subtext">Active today</div>
        </div>

        {/* Card 4: Overdue */}
        <div className="kpi-card" onClick={() => navigate('/tasks')}>
          <div className="kpi-header-flex">
            <div className="kpi-square-icon red">
              <AlertTriangle size={18} color="#EF4444" />
            </div>
            <div className="kpi-circular-btn">
              <ArrowRight size={14} />
            </div>
          </div>
          <span className="kpi-small-label">Overdue</span>
          <div className="kpi-big-value">{progress?.overdueTasks ?? 0}</div>
          <div className="kpi-subtext">Needs attention</div>
        </div>
      </div>

      {/* 3. Bottom 3-Column Section */}
      <div className="dashboard-bottom-grid">
        {/* Column 1: Today's Priority Tasks */}
        <div className="dashboard-panel priority-tasks-panel">
          <div className="panel-header">
            <div className="panel-header-left">
              <CheckSquare size={18} color="#00A884" />
              <div>
                <h3 className="panel-title">Today's Priority Tasks</h3>
                <p className="panel-subtext">Keep the momentum going! Here are your key tasks for today.</p>
              </div>
            </div>
            <button className="panel-link-btn" onClick={() => navigate('/tasks')}>
              <span>View All ({tasks.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="tasks-rows-container">
            {displayTasks.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CheckSquare size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  No onboarding tasks generated yet. Upload a company document in Knowledge Center to extract and assign your personalized milestones.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/documents')}>
                  Upload Document
                </button>
              </div>
            ) : (
              displayTasks.map((t) => {
                const isDone = t.status === 'completed';
                return (
                  <div key={t._id} className="priority-task-row">
                    <div className="task-row-left">
                      <button
                        onClick={() => handleToggleTask(t._id, t.status)}
                        className={`task-checked-circle ${isDone ? 'completed' : ''}`}
                        style={{
                          background: isDone ? '#00A884' : 'transparent',
                          borderColor: isDone ? '#00A884' : '#CBD5E1',
                          cursor: 'pointer'
                        }}
                      >
                        {isDone && <Check size={12} strokeWidth={3} color="#fff" />}
                      </button>
                      <span
                        className={`task-row-title-text ${isDone ? 'completed' : ''}`}
                        style={{ textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}
                      >
                        {t.title}
                      </span>
                    </div>

                    <div className="task-row-right">
                      <span className={`task-cat-pill ${getCategoryBadgeClass(t.category)}`}>
                        {t.category}
                      </span>
                      <span className="task-time-pill">Day {t.dayNumber || 1}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Current Learning Stage */}
        <div className="dashboard-panel learning-stage-panel">
          <div className="panel-header">
            <div className="panel-header-left">
              <GraduationCap size={18} color="#00A884" />
              <h3 className="panel-title">Current Learning Stage</h3>
            </div>
            <button className="panel-link-btn" onClick={() => navigate('/learning')}>
              <span>View Learning Path</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="learning-stepper-list">
            {(!learningPath?.stages || learningPath.stages.length === 0) ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <GraduationCap size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  No learning curriculum generated yet. Upload company documentation to dynamically generate an onboarding learning path.
                </p>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/documents')}>
                  Upload Policy Document
                </button>
              </div>
            ) : (
              learningPath.stages.map((stage, idx) => {
                const isDone = stage.status === 'completed';
                const isActive = stage.status === 'in_progress';
                const isLast = idx === learningPath.stages.length - 1;

                return (
                  <React.Fragment key={stage.stage || idx}>
                    <div className="stepper-item-row">
                      <div className={`stepper-icon-node ${isDone ? 'done' : isActive ? 'active' : 'upcoming'}`}>
                        {isDone ? <Check size={12} strokeWidth={3} /> : isActive ? <div className="stepper-active-dot" /> : null}
                      </div>
                      <div className="stepper-content">
                        <div className="stepper-heading">{stage.title}</div>
                        <div className={`stepper-sub ${isDone ? 'done' : isActive ? 'active' : 'upcoming'}`}>
                          {isDone ? 'Completed' : isActive ? 'In Progress' : 'Upcoming'}
                        </div>
                      </div>
                    </div>
                    {!isLast && <div className={`stepper-connector ${isDone ? 'done' : ''}`} />}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Upcoming Schedule */}
        <div className="dashboard-panel upcoming-schedule-panel">
          <div className="panel-header">
            <div className="panel-header-left">
              <Calendar size={18} color="#00A884" />
              <h3 className="panel-title">Upcoming</h3>
            </div>
            <button className="panel-link-btn" onClick={() => navigate('/onboarding')}>
              <span>View Calendar</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="schedule-items-list">
            {tasks.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Calendar size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  No upcoming orientation sessions scheduled yet. Milestones will appear once documents are uploaded.
                </p>
              </div>
            ) : (
              tasks.filter(t => t.status !== 'completed').slice(0, 3).map((t, idx) => {
                const stripes = ['teal-stripe', 'purple-stripe', 'amber-stripe'];
                const stripeClass = stripes[idx % stripes.length];
                return (
                  <div key={t._id} className={`schedule-event-item ${stripeClass}`}>
                    <span className="schedule-time">Day {t.dayNumber || 1}</span>
                    <div className="schedule-icon-box blue">
                      <FileText size={16} color="#0284C7" />
                    </div>
                    <div className="schedule-info">
                      <h4 className="schedule-title">{t.title}</h4>
                      <div className="schedule-location">
                        <Clock size={11} />
                        <span>Est. {t.estimatedMinutes || 30} mins • {t.priority?.toUpperCase()} Priority</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
