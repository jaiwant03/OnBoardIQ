import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Calendar, Sparkles, Check, ChevronRight } from 'lucide-react';
import { taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/onboarding.css';

const Onboarding = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await taskAPI.getTasks({});
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    try {
      const res = await taskAPI.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? res.data.task : t))
      );
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSkeleton height="60px" width="300px" />
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <LoadingSkeleton height="160px" />
          <LoadingSkeleton height="160px" />
          <LoadingSkeleton height="160px" />
        </div>
      </div>
    );
  }

  // Group tasks by Day Number
  const days = [1, 2, 3, 4, 5];
  const grouped = {};
  days.forEach((d) => {
    grouped[d] = tasks.filter((t) => (t.dayNumber || 1) === d);
  });

  return (
    <div className="page-container">
      <div className="onboarding-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span className="badge badge-it">AI GENERATED ROADMAP</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Personalized for {user?.role} ({user?.experience})
          </span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          My Onboarding Journey
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Follow your step-by-step milestone checklist. Complete activities to unlock access and advance through your first 30 days.
        </p>
      </div>

      <div className="roadmap-timeline-container">
        {days.map((dayNum) => {
          const dayTasks = grouped[dayNum] || [];
          if (dayTasks.length === 0) return null;

          const allDayCompleted = dayTasks.every((t) => t.status === 'completed');

          return (
            <div key={dayNum} className="roadmap-day-section">
              <div className={`day-marker-node ${allDayCompleted ? 'completed' : ''}`}>
                {allDayCompleted ? <Check size={20} /> : `D${dayNum}`}
              </div>

              <div className="day-content-card">
                <div className="day-header-row">
                  <div>
                    <h2 className="day-title">Day {dayNum} Milestones</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {dayTasks.filter((t) => t.status === 'completed').length} of{' '}
                      {dayTasks.length} tasks completed
                    </span>
                  </div>
                  {allDayCompleted && (
                    <span className="badge badge-success">
                      ✓ All Tasks Verified
                    </span>
                  )}
                </div>

                <div className="day-tasks-grid">
                  {dayTasks.map((task) => {
                    const isDone = task.status === 'completed';
                    const isInProgress = task.status === 'in_progress';

                    return (
                      <div
                        key={task._id}
                        className="task-compact-item"
                        style={{
                          background: isDone
                            ? 'rgba(16, 185, 129, 0.05)'
                            : isInProgress
                            ? 'rgba(255, 87, 34, 0.05)'
                            : 'var(--bg-surface)'
                        }}
                      >
                        <div className="task-compact-left">
                          <button
                            className={`task-checkbox ${isDone ? 'completed' : ''}`}
                            onClick={() => handleToggleTask(task._id, task.status)}
                          >
                            {isDone && <Check size={12} />}
                          </button>
                          <div>
                            <div
                              className={`task-compact-title ${isDone ? 'completed' : ''}`}
                              style={{ fontSize: '0.88rem' }}
                            >
                              {task.title}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                              <span
                                className={`badge ${
                                  task.category === 'HR'
                                    ? 'badge-hr'
                                    : task.category === 'IT'
                                    ? 'badge-it'
                                    : task.category === 'Security'
                                    ? 'badge-security'
                                    : 'badge-engineering'
                                }`}
                                style={{ fontSize: '0.65rem' }}
                              >
                                {task.category}
                              </span>
                              {task.priority === 'high' && (
                                <span className="badge badge-high" style={{ fontSize: '0.65rem' }}>
                                  HIGH
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: isDone
                              ? 'var(--success)'
                              : isInProgress
                              ? 'var(--accent-primary)'
                              : 'var(--text-muted)',
                            fontWeight: 600
                          }}
                        >
                          {isDone ? '✓ Completed' : isInProgress ? '→ In Progress' : '○ Not Started'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Onboarding;
