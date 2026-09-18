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
import { taskAPI, progressAPI, aiAPI } from '../services/api';
import ProgressRing from '../components/ProgressRing';
import officeHeroImg from '../assets/office_hero.jpg';
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

  const todayTasksList = [
    { _id: '1', title: 'Complete HR registration', category: 'HR', time: '09:00 AM', status: 'completed' },
    { _id: '2', title: 'Read employee handbook', category: 'General', time: '10:00 AM', status: 'completed' },
    { _id: '3', title: 'Set-up company email', category: 'IT', time: '11:00 AM', status: 'completed' },
    { _id: '4', title: 'Explore company policies', category: 'General', time: '01:00 PM', status: 'completed' }
  ];

  const getCategoryBadgeClass = (cat) => {
    const lower = (cat || '').toLowerCase();
    if (lower === 'hr') return 'cat-badge-hr';
    if (lower === 'it') return 'cat-badge-it';
    return 'cat-badge-general';
  };

  const overallPercentage = progress?.overallPercentage ?? 100;
  const completedCount = progress?.completedTasks ?? 6;
  const totalCount = progress?.totalTasks ?? 6;

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
            <div className="kpi-subtext">All milestones complete! 🎉</div>
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
              <span>View All ({tasks.length || 6})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="tasks-rows-container">
            {todayTasksList.map((t) => (
              <div key={t._id} className="priority-task-row">
                <div className="task-row-left">
                  <div className="task-checked-circle">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="task-row-title-text">{t.title}</span>
                </div>

                <div className="task-row-right">
                  <span className={`task-cat-pill ${getCategoryBadgeClass(t.category)}`}>
                    {t.category}
                  </span>
                  <span className="task-time-pill">{t.time}</span>
                  <button className="task-row-more-btn">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            ))}
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
            {/* Step 1: Onboarding Basics */}
            <div className="stepper-item-row">
              <div className="stepper-icon-node done">
                <Check size={12} strokeWidth={3} />
              </div>
              <div className="stepper-content">
                <div className="stepper-heading">Onboarding Basics</div>
                <div className="stepper-sub done">Completed</div>
              </div>
            </div>
            <div className="stepper-connector done" />

            {/* Step 2: Company Policies */}
            <div className="stepper-item-row">
              <div className="stepper-icon-node active">
                <div className="stepper-active-dot" />
              </div>
              <div className="stepper-content">
                <div className="stepper-heading">Company Policies</div>
                <div className="stepper-sub active">In Progress</div>
                <div className="stepper-progress-wrapper">
                  <div className="stepper-progress-fill" style={{ width: '60%' }} />
                  <span className="stepper-progress-percent">60%</span>
                </div>
              </div>
            </div>
            <div className="stepper-connector" />

            {/* Step 3: HR Tools & Systems */}
            <div className="stepper-item-row">
              <div className="stepper-icon-node upcoming" />
              <div className="stepper-content">
                <div className="stepper-heading">HR Tools & Systems</div>
                <div className="stepper-sub upcoming">Upcoming</div>
              </div>
            </div>
            <div className="stepper-connector" />

            {/* Step 4: People Management */}
            <div className="stepper-item-row">
              <div className="stepper-icon-node upcoming" />
              <div className="stepper-content">
                <div className="stepper-heading">People Management</div>
                <div className="stepper-sub upcoming">Upcoming</div>
              </div>
            </div>
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
            {/* Event 1 */}
            <div className="schedule-event-item teal-stripe">
              <span className="schedule-time">10:00 AM</span>
              <div className="schedule-icon-box blue">
                <Users size={16} color="#0284C7" />
              </div>
              <div className="schedule-info">
                <h4 className="schedule-title">Team Introduction</h4>
                <div className="schedule-location">
                  <MapPin size={11} />
                  <span>Conference Room A</span>
                </div>
              </div>
            </div>

            {/* Event 2 */}
            <div className="schedule-event-item purple-stripe">
              <span className="schedule-time">02:00 PM</span>
              <div className="schedule-icon-box blue">
                <FileText size={16} color="#0284C7" />
              </div>
              <div className="schedule-info">
                <h4 className="schedule-title">HR Orientation Session</h4>
                <div className="schedule-location">
                  <Video size={11} />
                  <span>Online (Teams)</span>
                </div>
              </div>
            </div>

            {/* Event 3 */}
            <div className="schedule-event-item amber-stripe">
              <span className="schedule-time">04:00 PM</span>
              <div className="schedule-icon-box green">
                <MessagesSquare size={16} color="#00A884" />
              </div>
              <div className="schedule-info">
                <h4 className="schedule-title">Q&A with Team Lead</h4>
                <div className="schedule-location">
                  <Video size={11} />
                  <span>Google Meet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
