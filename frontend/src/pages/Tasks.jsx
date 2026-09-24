import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, CheckSquare, Search, Filter, X } from 'lucide-react';
import { taskAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import TaskCard from '../components/TaskCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/tasks.css';

const Tasks = () => {
  const location = useLocation();
  const { addNotification } = useNotification();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Engineering');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDay, setNewTaskDay] = useState(1);

  // Sync with Global Search query parameter ?q=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get('q');
    if (qParam !== null) {
      setSearchQuery(qParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await taskAPI.getTasks({});
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (taskId, newStatus) => {
    const targetTask = tasks.find((t) => t._id === taskId);
    try {
      const res = await taskAPI.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? res.data.task : t))
      );
      addNotification({
        title: newStatus === 'completed' ? 'Task Completed 🎉' : 'Task Status Updated',
        message: `"${targetTask?.title || 'Task'}" marked as ${newStatus.replace('_', ' ')}.`,
        type: 'task',
        link: '/tasks'
      });
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const targetTask = tasks.find((t) => t._id === taskId);
    try {
      await taskAPI.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      addNotification({
        title: 'Task Removed',
        message: `"${targetTask?.title || 'Task'}" removed from tasks list.`,
        type: 'task',
        link: '/tasks'
      });
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await taskAPI.createTask({
        title: newTaskTitle,
        category: newTaskCategory,
        priority: newTaskPriority,
        dayNumber: Number(newTaskDay)
      });
      setTasks((prev) => [...prev, res.data.task]);
      const createdTitle = newTaskTitle;
      const createdDay = newTaskDay;
      setNewTaskTitle('');
      setShowAddModal(false);

      addNotification({
        title: 'New Task Created ✨',
        message: `Added "${createdTitle}" for Day ${createdDay} (${newTaskCategory}).`,
        type: 'task',
        link: '/tasks'
      });
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'completed' && t.status !== 'completed') return false;
    if (activeFilter === 'in_progress' && t.status !== 'in_progress') return false;
    if (activeFilter === 'not_started' && t.status !== 'not_started') return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

    if (searchQuery.trim()) {
      const searchTokens = searchQuery.toLowerCase().trim().split(/[\s,]+/).filter(Boolean);
      const corpus = `${t.title || ''} ${t.description || ''} ${t.category || ''} ${t.priority || ''} ${t.sourceDocument || ''} day ${t.dayNumber || ''}`.toLowerCase();
      if (!searchTokens.every((tok) => corpus.includes(tok))) return false;
    }

    return true;
  });

  return (
    <div className="page-container">
      <div className="tasks-page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Onboarding Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Manage and track all checklist activities assigned for your role.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="onboarding-search-box" style={{ minWidth: '220px', maxWidth: '300px' }}>
            <Search size={15} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search tasks, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="tasks-filter-bar">
            <button
              className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Tasks ({tasks.length})
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'in_progress' ? 'active' : ''}`}
              onClick={() => setActiveFilter('in_progress')}
            >
              In Progress ({tasks.filter((t) => t.status === 'in_progress').length})
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'not_started' ? 'active' : ''}`}
              onClick={() => setActiveFilter('not_started')}
            >
              Pending ({tasks.filter((t) => t.status === 'not_started').length})
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              Completed ({tasks.filter((t) => t.status === 'completed').length})
            </button>
          </div>
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.45rem 1rem' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="HR">HR Policies</option>
          <option value="IT">IT Setup</option>
          <option value="Security">Security & Compliance</option>
          <option value="Engineering">Engineering & Code</option>
          <option value="Training">Training & Culture</option>
        </select>
      </div>

      {/* Task Cards List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <LoadingSkeleton height="85px" />
          <LoadingSkeleton height="85px" />
          <LoadingSkeleton height="85px" />
          <LoadingSkeleton height="85px" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <CheckSquare size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No onboarding tasks yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
            Tasks are dynamically generated when company policies and onboarding guides are uploaded. You can also add a custom task.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => window.location.href = '/documents'}>
              Upload Company Document
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add Custom Task
            </button>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckSquare size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No tasks found in this view
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Switch filters or add a new custom onboarding task.
          </p>
        </div>
      ) : (
        <div className="tasks-grid-list">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Add Custom Task Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Create Custom Onboarding Task
            </h2>

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Schedule pairing session on GraphQL"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="IT">IT Setup</option>
                    <option value="Security">Security</option>
                    <option value="HR">HR</option>
                    <option value="Training">Training</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign to Day Number</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="form-input"
                  value={newTaskDay}
                  onChange={(e) => setNewTaskDay(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
