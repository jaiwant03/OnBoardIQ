import React, { useState, useEffect } from 'react';
import { Search, Bell, Calendar, Menu } from 'lucide-react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/navbar.css';

const Navbar = ({ title }) => {
  const { user } = useAuth();
  const [aiOnline, setAiOnline] = useState(true);
  const [aiModel, setAiModel] = useState('qwen2.5:7b');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await aiAPI.getHealth();
        if (res.data && res.data.status === 'healthy') {
          setAiOnline(true);
          setAiModel(res.data.active_model || 'qwen2.5:7b');
        } else {
          setAiOnline(false);
        }
      } catch (err) {
        setAiOnline(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'JK';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format today's date like "Thu, Sep 11, 2025"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-menu-toggle" title="Toggle Navigation">
          <Menu size={18} />
        </button>
        <h2 className="navbar-page-title">{title}</h2>
        <div className="ai-status-pill">
          <span className={`ai-status-dot ${aiOnline ? 'online' : 'offline'}`} />
          <span>{aiOnline ? `AI Agent Online (${aiModel})` : 'AI Standby Mode'}</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-search">
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search policies, tasks, learning..."
          />
          <span className="navbar-search-shortcut">Ctrl K</span>
        </div>

        <button className="navbar-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-badge-count">1</span>
        </button>

        <div className="navbar-user-avatar">
          {getInitials(user?.name)}
        </div>

        {/* Date & Weather Widget */}
        <div className="navbar-date-widget">
          <Calendar size={16} className="date-widget-icon" />
          <div className="date-widget-text">
            <span className="date-text-primary">{formattedDate}</span>
            <span className="date-text-secondary">Have a productive day! ☀️</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
