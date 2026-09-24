import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bot,
  Search,
  X,
  Filter,
  UploadCloud,
  Target,
  Award,
  AlertTriangle,
  TrendingUp,
  CheckSquare,
  Briefcase,
  Users,
  RefreshCw,
  FileText,
  Flame,
  Layers,
  ArrowRight
} from 'lucide-react';
import { taskAPI, progressAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProgressRing from '../components/ProgressRing';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/onboarding.css';

// Day Themes for standard corporate ramp-up
const DAY_THEMES = {
  1: 'Orientation & Workspace Credentials',
  2: 'Tools, Hardware & Environment Setup',
  3: 'Security Compliance & Team Introductions',
  4: 'Architecture, Repos & Core Workflows',
  5: 'First Milestone Review & Contribution'
};

// Highlight matching search words in text
const highlightMatch = (text, query) => {
  if (!text || !query || !query.trim()) return text;
  const terms = query
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (terms.length === 0) return text;
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="search-highlight-text">{part}</mark>
    ) : (
      part
    )
  );
};

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotification();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDayTab, setActiveDayTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collapsedDays, setCollapsedDays] = useState({});

  // Sync with URL query parameters from Global Search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get('q');
    const dayParam = params.get('day');
    if (qParam !== null) {
      setSearchQuery(qParam);
    }
    if (dayParam) {
      setActiveDayTab(dayParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await taskAPI.getTasks({});
      setTasks(res.data || []);
    } catch (err) {
      console.error('Error fetching onboarding tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await taskAPI.syncTasks();
      if (res.data?.tasks) {
        setTasks(res.data.tasks);
      } else {
        await fetchTasks();
      }
      addNotification({
        title: 'Roadmap Synchronized',
        message: 'Onboarding milestones, tasks, and curriculum synced with enterprise documents.',
        type: 'sync',
        link: '/onboarding'
      });
    } catch (err) {
      console.error('Error syncing roadmap tasks:', err);
      await fetchTasks();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const targetTask = tasks.find((t) => t._id === taskId);
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? { ...t, status: newStatus, completedAt: newStatus === 'completed' ? new Date() : null }
            : t
        )
      );

      const res = await taskAPI.updateTask(taskId, { status: newStatus });
      if (res.data?.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.task : t))
        );
      }
      addNotification({
        title: newStatus === 'completed' ? 'Task Completed 🎉' : 'Task Status Updated',
        message: `"${targetTask?.title || 'Milestone Task'}" marked as ${newStatus === 'completed' ? 'Completed' : 'Pending'}.`,
        type: 'task',
        link: '/onboarding'
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      fetchTasks(); // Revert on failure
    }
  };

  const handleSetStatus = async (taskId, newStatus) => {
    const targetTask = tasks.find((t) => t._id === taskId);
    try {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? { ...t, status: newStatus, completedAt: newStatus === 'completed' ? new Date() : null }
            : t
        )
      );

      const res = await taskAPI.updateTask(taskId, { status: newStatus });
      if (res.data?.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.task : t))
        );
      }
      addNotification({
        title: 'Task Status Updated',
        message: `"${targetTask?.title || 'Milestone Task'}" status set to ${newStatus.replace('_', ' ')}.`,
        type: 'task',
        link: '/onboarding'
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      fetchTasks();
    }
  };

  const handleAskAIAboutTask = (task) => {
    navigate('/assistant', {
      state: {
        initialQuery: `Can you guide me through my Day ${task.dayNumber || 1} onboarding milestone: "${task.title}"? Please provide steps, best practices, and relevant resources.`
      }
    });
  };

  const toggleCollapseDay = (dayNum) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
  };

  const handleToggleAllCollapse = () => {
    const allCollapsed = days.every((d) => collapsedDays[d]);
    const newState = {};
    days.forEach((d) => {
      newState[d] = !allCollapsed;
    });
    setCollapsedDays(newState);
  };

  const scrollToDay = (dayNum) => {
    setActiveDayTab('all');
    setTimeout(() => {
      const el = document.getElementById(`day-section-${dayNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Derive all dynamic days available in tasks
  const days = useMemo(() => {
    if (!tasks || tasks.length === 0) return [1, 2, 3, 4, 5];
    const extracted = [...new Set(tasks.map((t) => t.dayNumber || 1))].sort((a, b) => a - b);
    return extracted.length > 0 ? extracted : [1, 2, 3, 4, 5];
  }, [tasks]);

  // Overall Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const notStartedTasks = tasks.filter((t) => t.status === 'not_started' || !t.status).length;
  const overallPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const highPriorityPending = tasks.filter(
    (t) => t.priority === 'high' && t.status !== 'completed'
  ).length;

  const totalMinutes = tasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  // Active current day (first day with uncompleted tasks)
  const currentDay = useMemo(() => {
    for (const d of days) {
      const dayTasks = tasks.filter((t) => (t.dayNumber || 1) === d);
      if (dayTasks.some((t) => t.status !== 'completed')) {
        return d;
      }
    }
    return days[days.length - 1] || 1;
  }, [days, tasks]);

  // Grouped tasks by day with applied search and filters
  const groupedTasks = useMemo(() => {
    const grouped = {};
    const searchTokens = searchQuery
      .toLowerCase()
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);

    days.forEach((d) => {
      grouped[d] = tasks.filter((t) => {
        const matchesDay = (t.dayNumber || 1) === d;
        if (!matchesDay) return false;

        // Search Filter: Multi-token search across title, description, category, priority, doc & theme
        if (searchTokens.length > 0) {
          const dayTheme = DAY_THEMES[t.dayNumber || 1] || '';
          const dayStr = `day ${t.dayNumber || 1} d${t.dayNumber || 1}`;
          const priorityStr = `${t.priority || ''} priority`;
          const categoryStr = `${t.category || ''}`;
          const sourceStr = `${t.sourceDocument || ''}`;
          const titleStr = `${t.title || ''}`;
          const descStr = `${t.description || ''}`;

          const fullCorpus = `${titleStr} ${descStr} ${categoryStr} ${priorityStr} ${sourceStr} ${dayStr} ${dayTheme}`.toLowerCase();

          const allTokensMatch = searchTokens.every((token) => fullCorpus.includes(token));
          if (!allTokensMatch) return false;
        }

        // Category Filter
        if (categoryFilter !== 'all' && (t.category || '').toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }

        // Status Filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'completed' && t.status !== 'completed') return false;
          if (statusFilter === 'in_progress' && t.status !== 'in_progress') return false;
          if (statusFilter === 'not_started' && t.status !== 'not_started') return false;
        }

        return true;
      });
    });
    return grouped;
  }, [days, tasks, searchQuery, categoryFilter, statusFilter]);

  // Total filtered tasks matching current search & filters
  const totalFilteredTasks = useMemo(() => {
    return Object.values(groupedTasks).reduce((sum, dayArr) => sum + dayArr.length, 0);
  }, [groupedTasks]);

  // Categories extracted from tasks
  const availableCategories = useMemo(() => {
    const cats = [...new Set(tasks.map((t) => t.category).filter(Boolean))];
    return ['all', ...cats];
  }, [tasks]);

  if (loading) {
    return (
      <div className="page-container onboarding-page-wrapper">
        <LoadingSkeleton height="200px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginTop: '1.5rem' }}>
          <LoadingSkeleton height="95px" />
          <LoadingSkeleton height="95px" />
          <LoadingSkeleton height="95px" />
          <LoadingSkeleton height="95px" />
        </div>
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <LoadingSkeleton height="220px" />
          <LoadingSkeleton height="220px" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container onboarding-page-wrapper">
      {/* 1. Hero Overview & Status Banner */}
      <div className="onboarding-hero-banner">
        <div className="onboarding-hero-left">
          <div className="onboarding-pretitle-row">
            <span className="onboarding-pretitle-badge">
              <Sparkles size={13} />
              AI AUTONOMOUS ROADMAP
            </span>
            <span className="onboarding-user-tag">
              <Briefcase size={12} color="#00A884" />
              {user?.role || 'New Team Member'}
            </span>
            {user?.department && (
              <span className="onboarding-user-tag">
                <Users size={12} color="#0284C7" />
                {user?.department}
              </span>
            )}
            {user?.experience && (
              <span className="onboarding-user-tag">
                <Award size={12} color="#7C3AED" />
                {user?.experience}
              </span>
            )}
          </div>

          <h1 className="onboarding-main-title">
            My Onboarding Journey <span className="onboarding-title-gradient">&amp; Milestone Roadmap</span>
          </h1>

          <p className="onboarding-subtitle">
            Step-by-step verified checklist personalized for your role. Advance through your first 30 days,
            gain essential workspace credentials, and achieve complete productivity.
          </p>

          <div className="onboarding-hero-actions">
            <button
              className="btn btn-primary"
              onClick={() =>
                navigate('/assistant', {
                  state: {
                    initialQuery: `What are my recommended top priorities for today (Day ${currentDay}) in my onboarding journey?`
                  }
                })
              }
            >
              <Bot size={16} />
              <span>Ask AI Mentor</span>
              <ArrowRight size={14} />
            </button>

            <button className="btn btn-outline" onClick={() => navigate('/documents')}>
              <UploadCloud size={15} />
              <span>Upload Company Docs</span>
            </button>

            <button
              className="toolbar-action-btn"
              onClick={handleRefresh}
              title="Refresh Roadmap"
            >
              <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Right Circular Progress Card */}
        <div className="onboarding-hero-progress-widget">
          <ProgressRing percentage={overallPercentage} size={92} strokeWidth={9} />
          <div className="progress-widget-info">
            <span className="progress-widget-label">Roadmap Mastery</span>
            <span className="progress-widget-value">{overallPercentage}%</span>
            <span className="progress-widget-subtext">
              {completedTasks} of {totalTasks} milestones completed
            </span>
          </div>
        </div>
      </div>

      {/* 2. 4 Modern High-Impact KPI Metric Cards */}
      <div className="onboarding-metrics-grid">
        <div className="onboarding-metric-card">
          <div className="metric-icon-box green">
            <CheckSquare size={22} color="#00A884" />
          </div>
          <div className="metric-content">
            <span className="metric-title">Journey Mastery</span>
            <span className="metric-number">{overallPercentage}%</span>
            <span className="metric-sub">{completedTasks} of {totalTasks} finished</span>
          </div>
        </div>

        <div className="onboarding-metric-card">
          <div className="metric-icon-box blue">
            <Target size={22} color="#0284C7" />
          </div>
          <div className="metric-content">
            <span className="metric-title">Current Focus</span>
            <span className="metric-number">Day {currentDay}</span>
            <span className="metric-sub">
              {tasks.filter((t) => (t.dayNumber || 1) === currentDay && t.status !== 'completed').length} tasks pending
            </span>
          </div>
        </div>

        <div className="onboarding-metric-card">
          <div className="metric-icon-box amber">
            <Flame size={22} color="#D97706" />
          </div>
          <div className="metric-content">
            <span className="metric-title">High Priority</span>
            <span className="metric-number">{highPriorityPending} Urgent</span>
            <span className="metric-sub">Action required today</span>
          </div>
        </div>

        <div className="onboarding-metric-card">
          <div className="metric-icon-box purple">
            <Clock size={22} color="#7C3AED" />
          </div>
          <div className="metric-content">
            <span className="metric-title">Estimated Effort</span>
            <span className="metric-number">{totalHours} Hours</span>
            <span className="metric-sub">Self-paced modules</span>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Visual Stepper Roadmap Tracker */}
      {totalTasks > 0 && (
        <div className="onboarding-stepper-container">
          <div
            className={`stepper-day-node ${activeDayTab === 'all' ? 'active-tab' : ''}`}
            onClick={() => setActiveDayTab('all')}
          >
            <div className={`stepper-day-circle ${activeDayTab === 'all' ? 'active' : 'upcoming'}`}>
              <Layers size={16} />
            </div>
            <div className="stepper-day-details">
              <span className="stepper-day-tag active">ALL DAYS</span>
              <span className="stepper-day-title">Full Timeline</span>
              <span className="stepper-day-sub">{totalTasks} milestones</span>
            </div>
          </div>

          <ChevronRight size={16} className="stepper-connector-arrow" />

          {days.map((d, index) => {
            const dayTasks = tasks.filter((t) => (t.dayNumber || 1) === d);
            const dayCompleted = dayTasks.length > 0 && dayTasks.every((t) => t.status === 'completed');
            const isCurrent = d === currentDay && !dayCompleted;
            const isSelected = activeDayTab === d;

            return (
              <React.Fragment key={d}>
                <div
                  className={`stepper-day-node ${isSelected ? 'active-tab' : ''}`}
                  onClick={() => {
                    if (activeDayTab === d) {
                      setActiveDayTab('all');
                    } else {
                      setActiveDayTab(d);
                      scrollToDay(d);
                    }
                  }}
                >
                  <div
                    className={`stepper-day-circle ${
                      dayCompleted ? 'completed' : isCurrent ? 'active' : 'upcoming'
                    }`}
                  >
                    {dayCompleted ? <Check size={16} strokeWidth={3} /> : `D${d}`}
                  </div>
                  <div className="stepper-day-details">
                    <span
                      className={`stepper-day-tag ${
                        dayCompleted ? 'completed' : isCurrent ? 'active' : 'upcoming'
                      }`}
                    >
                      {dayCompleted ? 'Done' : isCurrent ? 'Active' : 'Upcoming'}
                    </span>
                    <span className="stepper-day-title">Day {d}</span>
                    <span className="stepper-day-sub">
                      {dayTasks.filter((t) => t.status === 'completed').length}/{dayTasks.length} done
                    </span>
                  </div>
                </div>

                {index < days.length - 1 && (
                  <ChevronRight size={16} className="stepper-connector-arrow" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 4. Toolbar: Search, Filters & Collapse Controls */}
      <div className="onboarding-toolbar">
        <div className="toolbar-left">
          {/* Search Box */}
          <div className="onboarding-search-box">
            <Search size={15} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search milestones, tools, requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="filter-pills-group">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'not_started', label: 'Pending', count: notStartedTasks },
              { id: 'in_progress', label: 'In Progress', count: inProgressTasks },
              { id: 'completed', label: 'Completed', count: completedTasks }
            ].map((st) => (
              <button
                key={st.id}
                className={`filter-pill-btn ${statusFilter === st.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(st.id)}
              >
                <span>{st.label}</span>
                {st.count !== undefined && (
                  <span className="filter-count-badge">{st.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Category Filters */}
          {availableCategories.length > 2 && (
            <div className="filter-pills-group">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-pill-btn ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  <span>{cat === 'all' ? 'All Roles' : cat}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-right">
          <button className="toolbar-action-btn" onClick={handleToggleAllCollapse}>
            {days.every((d) => collapsedDays[d]) ? (
              <>
                <ChevronDown size={14} />
                <span>Expand All</span>
              </>
            ) : (
              <>
                <ChevronUp size={14} />
                <span>Collapse All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Search & Filter Banner */}
      {searchQuery.trim() && (
        <div className="search-active-banner">
          <div className="search-active-info">
            <Search size={14} className="search-active-icon" />
            <span>
              Found <strong>{totalFilteredTasks}</strong> {totalFilteredTasks === 1 ? 'milestone' : 'milestones'} matching "<strong>{searchQuery.trim()}</strong>"
              {categoryFilter !== 'all' && ` in ${categoryFilter}`}
              {statusFilter !== 'all' && ` (${statusFilter.replace('_', ' ')})`}
            </span>
          </div>
          <button
            className="btn-clear-search-pill"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            <X size={13} />
            <span>Clear Search</span>
          </button>
        </div>
      )}

      {/* 5. 100% Completion Celebration Banner */}
      {overallPercentage === 100 && totalTasks > 0 && (
        <div className="onboarding-completion-banner">
          <div className="completion-banner-left">
            <div className="completion-trophy-icon">
              <Award size={28} color="#00A884" />
            </div>
            <div>
              <h3 className="completion-banner-title">🎉 Onboarding Roadmap Completed!</h3>
              <p className="completion-banner-sub">
                Congratulations! You have verified all Day 1 through Day {days[days.length - 1]} milestones.
                Your workspace permissions, tools, and technical ramp-up are verified.
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/learning')}>
            <span>Explore Skills Path</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* 6. Empty State if No Tasks Exist in System */}
      {totalTasks === 0 ? (
        <div className="onboarding-empty-card">
          <div className="empty-icon-circle">
            <CheckCircle2 size={36} color="#00A884" />
          </div>
          <h3 className="empty-title">No Onboarding Roadmap Generated Yet</h3>
          <p className="empty-description">
            Upload company policies, IT setup guides, or onboarding handbooks in the Knowledge Center
            to autonomously structure your personalized Day 1 through Day 30 milestones.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/documents')}>
            <UploadCloud size={16} />
            <span>Upload Company Document</span>
          </button>
        </div>
      ) : totalFilteredTasks === 0 ? (
        /* Empty State specifically when search or filter returns 0 results */
        <div className="onboarding-empty-card" style={{ padding: '3.5rem 2rem' }}>
          <div className="empty-icon-circle" style={{ background: '#F1F5F9' }}>
            <Search size={32} color="#64748B" />
          </div>
          <h3 className="empty-title">
            No milestones found matching "{searchQuery || categoryFilter || statusFilter}"
          </h3>
          <p className="empty-description">
            We couldn't find any onboarding milestones matching your current search.
            Try checking for spelling, using broader keywords, or resetting your active filters.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setStatusFilter('all');
              setActiveDayTab('all');
            }}
          >
            <X size={15} />
            <span>Clear Search &amp; Filters</span>
          </button>
        </div>
      ) : (
        /* 7. Roadmap Timeline & Day Sections */
        <div className="roadmap-timeline-container">
          {days.map((dayNum) => {
            // If filtering to a specific day, skip others
            if (activeDayTab !== 'all' && activeDayTab !== dayNum) {
              return null;
            }

            const dayTasks = groupedTasks[dayNum] || [];
            // When search or filter is active, hide empty day sections
            if ((searchQuery.trim() || categoryFilter !== 'all' || statusFilter !== 'all') && dayTasks.length === 0) {
              return null;
            }

            const allDayTasks = tasks.filter((t) => (t.dayNumber || 1) === dayNum);
            if (allDayTasks.length === 0) return null;

            const allDayCompleted = allDayTasks.length > 0 && allDayTasks.every((t) => t.status === 'completed');
            const dayCompletedCount = allDayTasks.filter((t) => t.status === 'completed').length;
            const dayPercent = allDayTasks.length > 0 ? Math.round((dayCompletedCount / allDayTasks.length) * 100) : 0;
            const isCollapsed = !!collapsedDays[dayNum];
            const isCurrent = dayNum === currentDay && !allDayCompleted;

            return (
              <div key={dayNum} id={`day-section-${dayNum}`} className="roadmap-day-section">
                {/* Timeline Marker Node */}
                <div
                  className={`day-marker-node ${
                    allDayCompleted ? 'completed' : isCurrent ? 'in-progress' : ''
                  }`}
                >
                  {allDayCompleted ? <Check size={22} strokeWidth={3} /> : `D${dayNum}`}
                </div>

                {/* Day Content Card */}
                <div className="day-content-card">
                  {/* Header Row */}
                  <div className="day-header-row">
                    <div className="day-header-left">
                      <div className="day-header-title-flex">
                        <h2 className="day-title">Day {dayNum} Milestones</h2>
                        <span className="day-theme-tag">
                          {DAY_THEMES[dayNum] || `Phase 0${dayNum} Ramp-Up`}
                        </span>
                      </div>
                      <div className="day-progress-subtext">
                        <span>
                          {dayCompletedCount} of {allDayTasks.length} milestones verified ({dayPercent}%)
                        </span>
                      </div>
                    </div>

                    <div className="day-header-right">
                      {/* Day Mini Progress Bar */}
                      <div className="day-progress-bar-container" title={`${dayPercent}% complete`}>
                        <div
                          className="day-progress-bar-fill"
                          style={{ width: `${dayPercent}%` }}
                        />
                      </div>

                      {allDayCompleted && (
                        <span className="badge badge-success">
                          ✓ All Milestones Verified
                        </span>
                      )}

                      <button
                        className="day-collapse-btn"
                        onClick={() => toggleCollapseDay(dayNum)}
                        title={isCollapsed ? 'Expand Day Milestones' : 'Collapse Day Milestones'}
                      >
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Day Tasks List / Grid */}
                  {!isCollapsed && (
                    <>
                      {dayTasks.length === 0 ? (
                        <div
                          style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            background: '#F8FAFC',
                            borderRadius: '12px',
                            color: '#64748B',
                            fontSize: '0.86rem'
                          }}
                        >
                          No milestones match your current filters for Day {dayNum}.
                        </div>
                      ) : (
                        <div className="day-tasks-grid">
                          {dayTasks.map((task) => {
                            const isDone = task.status === 'completed';
                            const isInProgress = task.status === 'in_progress';

                            const categoryLower = (task.category || '').toLowerCase();
                            const categoryBadgeClass =
                              categoryLower === 'hr'
                                ? 'badge-hr'
                                : categoryLower === 'it'
                                ? 'badge-it'
                                : categoryLower === 'security'
                                ? 'badge-security'
                                : categoryLower === 'engineering'
                                ? 'badge-engineering'
                                : 'badge-general';

                            return (
                              <div
                                key={task._id}
                                className={`task-modern-card ${
                                  isDone ? 'completed' : isInProgress ? 'in-progress' : ''
                                }`}
                              >
                                <div className="task-top-row">
                                  {/* Interactive Checkbox */}
                                  <button
                                    className={`task-checkbox-modern ${isDone ? 'completed' : ''}`}
                                    onClick={() => handleToggleTask(task._id, task.status)}
                                    title={isDone ? 'Mark Incomplete' : 'Mark Completed'}
                                  >
                                    {isDone && <Check size={14} strokeWidth={3} />}
                                  </button>

                                  {/* Task Info */}
                                  <div className="task-info-block">
                                    <div
                                      className={`task-title-text ${isDone ? 'completed' : ''}`}
                                    >
                                      {highlightMatch(task.title, searchQuery)}
                                    </div>

                                    {task.description && (
                                      <p className="task-description-text">
                                        {highlightMatch(task.description, searchQuery)}
                                      </p>
                                    )}

                                    {/* Meta Tags */}
                                    <div className="task-tags-row">
                                      <span className={`badge ${categoryBadgeClass}`}>
                                        {task.category || 'General'}
                                      </span>

                                      {task.priority === 'high' && (
                                        <span className="badge badge-high">
                                          HIGH PRIORITY
                                        </span>
                                      )}

                                      {task.estimatedMinutes && (
                                        <span className="badge badge-low">
                                          <Clock size={11} /> {task.estimatedMinutes}m
                                        </span>
                                      )}

                                      {task.sourceDocument && (
                                        <span
                                          className="badge badge-low"
                                          title={`Sourced from ${task.sourceDocument}`}
                                        >
                                          <FileText size={10} /> Doc Ref
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom Actions Row */}
                                <div className="task-bottom-row">
                                  <span
                                    className={`task-status-pill ${
                                      isDone
                                        ? 'completed'
                                        : isInProgress
                                        ? 'in-progress'
                                        : 'not-started'
                                    }`}
                                  >
                                    {isDone ? '✓ Completed' : isInProgress ? '→ In Progress' : '○ Not Started'}
                                  </span>

                                  <div className="task-actions-flex">
                                    {/* Quick AI Help for this task */}
                                    <button
                                      className="task-ai-help-btn"
                                      onClick={() => handleAskAIAboutTask(task)}
                                      title="Ask AI Assistant for guidance on this milestone"
                                    >
                                      <Bot size={13} />
                                      <span>Ask AI</span>
                                    </button>

                                    {/* 1-Click Status Progression */}
                                    <button
                                      className="task-toggle-btn"
                                      onClick={() => {
                                        if (task.status === 'not_started' || !task.status) {
                                          handleSetStatus(task._id, 'in_progress');
                                        } else if (task.status === 'in_progress') {
                                          handleSetStatus(task._id, 'completed');
                                        } else {
                                          handleSetStatus(task._id, 'not_started');
                                        }
                                      }}
                                      title="Cycle Status"
                                    >
                                      {task.status === 'in_progress' ? 'Mark Done' : isDone ? 'Reset' : 'Start'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Onboarding;
