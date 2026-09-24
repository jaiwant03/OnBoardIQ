import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  BookOpen,
  FileText,
  Bot,
  RefreshCw,
  Info,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import '../styles/navbar.css';
import '../styles/notifications.css';

const formatNotificationTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'task':
      return <CheckCircle2 size={16} className="notif-type-icon task" />;
    case 'learning':
      return <BookOpen size={16} className="notif-type-icon learning" />;
    case 'document':
      return <FileText size={16} className="notif-type-icon document" />;
    case 'assistant':
      return <Bot size={16} className="notif-type-icon assistant" />;
    case 'sync':
      return <RefreshCw size={16} className="notif-type-icon sync" />;
    default:
      return <Info size={16} className="notif-type-icon info" />;
  }
};

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'task' | 'learning' | 'system'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'task') return n.type === 'task' || n.type === 'sync';
    if (filter === 'learning') return n.type === 'learning';
    if (filter === 'system') return n.type === 'document' || n.type === 'assistant' || n.type === 'info';
    return true;
  });

  const handleItemClick = (item) => {
    markAsRead(item.id);
    if (item.link) {
      setIsOpen(false);
      navigate(item.link);
    }
  };

  return (
    <div className="navbar-notification-container" ref={dropdownRef}>
      <button
        className={`navbar-icon-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Activity Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-panel" role="dialog" aria-label="Notifications panel">
          {/* Header */}
          <div className="notif-panel-header">
            <div className="notif-header-left">
              <span className="notif-header-title">Notifications</span>
              {unreadCount > 0 && (
                <span className="notif-unread-pill">{unreadCount} new</span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  className="notif-header-btn"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} style={{ marginRight: 4 }} />
                  Mark read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="notif-header-btn danger"
                  onClick={clearAllNotifications}
                  title="Clear all notifications"
                >
                  <Trash2 size={13} style={{ marginRight: 3 }} />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="notif-filter-tabs">
            <button
              className={`notif-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`notif-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`notif-tab ${filter === 'task' ? 'active' : ''}`}
              onClick={() => setFilter('task')}
            >
              Tasks
            </button>
            <button
              className={`notif-tab ${filter === 'learning' ? 'active' : ''}`}
              onClick={() => setFilter('learning')}
            >
              Learning
            </button>
          </div>

          {/* List */}
          <div className="notif-panel-body">
            {filteredNotifications.length === 0 ? (
              <div className="notif-empty-state">
                <Bell size={32} color="#CBD5E1" />
                <p className="notif-empty-title">All caught up!</p>
                <p className="notif-empty-sub">
                  Any project updates, task completions, and AI activity will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleItemClick(notif)}
                >
                  <div className="notif-item-icon-wrap">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-header">
                      <span className="notif-item-title">{notif.title}</span>
                      <span className="notif-item-time">
                        {formatNotificationTime(notif.timestamp)}
                      </span>
                    </div>
                    <p className="notif-item-message">{notif.message}</p>
                    {notif.link && (
                      <span className="notif-item-link">
                        View item <ChevronRight size={11} style={{ marginLeft: 2 }} />
                      </span>
                    )}
                  </div>
                  <button
                    className="notif-item-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notif.id);
                    }}
                    title="Remove notification"
                  >
                    <X size={12} />
                  </button>
                  {!notif.read && <span className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="notif-panel-footer">
            <span>Project Action Monitor Active</span>
            <span className="notif-footer-sub">Real-time sync</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
