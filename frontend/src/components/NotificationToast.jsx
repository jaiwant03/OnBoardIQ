import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  BookOpen,
  FileText,
  Bot,
  RefreshCw,
  Info,
  X,
  ExternalLink
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import '../styles/notifications.css';

const getToastIcon = (type) => {
  switch (type) {
    case 'task':
      return <CheckCircle2 size={18} className="toast-icon task" />;
    case 'learning':
      return <BookOpen size={18} className="toast-icon learning" />;
    case 'document':
      return <FileText size={18} className="toast-icon document" />;
    case 'assistant':
      return <Bot size={18} className="toast-icon assistant" />;
    case 'sync':
      return <RefreshCw size={18} className="toast-icon sync" />;
    default:
      return <Info size={18} className="toast-icon info" />;
  }
};

const NotificationToast = () => {
  const { activeToast, dismissToast, markAsRead } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const handleClick = () => {
    if (activeToast.id) {
      markAsRead(activeToast.id);
    }
    if (activeToast.link) {
      navigate(activeToast.link);
    }
    dismissToast();
  };

  return (
    <div className="notification-toast-container" role="alert" aria-live="assertive">
      <div className={`notification-toast toast-${activeToast.type || 'info'}`} onClick={handleClick}>
        <div className="toast-icon-wrap">
          {getToastIcon(activeToast.type)}
        </div>
        <div className="toast-body">
          <div className="toast-header-row">
            <span className="toast-title">{activeToast.title}</span>
            <span className="toast-time">Just now</span>
          </div>
          <p className="toast-message">{activeToast.message}</p>
          {activeToast.link && (
            <span className="toast-link-hint">
              Click to view <ExternalLink size={11} style={{ marginLeft: 3 }} />
            </span>
          )}
        </div>
        <button
          className="toast-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            dismissToast();
          }}
          title="Dismiss notification"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
