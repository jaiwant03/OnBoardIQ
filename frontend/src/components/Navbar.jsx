import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import '../styles/navbar.css';

const Navbar = () => {
  const { user } = useAuth();
  const { showHistory, toggleHistory, setShowHistory } = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  const [aiOnline, setAiOnline] = useState(true);

  const handleMenuToggle = () => {
    if (location.pathname !== '/assistant') {
      setShowHistory(true);
      navigate('/assistant');
    } else {
      toggleHistory();
    }
  };

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await aiAPI.getHealth();
        if (res.data && res.data.status === 'healthy') {
          setAiOnline(true);
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

  // Format date like "Thu, Sep 11, 2025"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const isAssistantPage = location.pathname === '/assistant';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className={`navbar-menu-toggle ${showHistory && isAssistantPage ? 'active' : ''}`}
          onClick={handleMenuToggle}
          title={isAssistantPage ? (showHistory ? 'Hide Chat History' : 'Show Chat History') : 'View Chat History'}
        >
          <Menu size={18} />
        </button>

        <div className="navbar-search">
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search policies, tasks, learning resources..."
          />
        </div>
      </div>

      <div className="navbar-right">
        <div className="ai-status-pill">
          <span className={`ai-status-dot ${aiOnline ? 'online' : 'offline'}`} />
          <span>{aiOnline ? 'AI Agent Online' : 'AI Standby'}</span>
        </div>

        <button className="navbar-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-badge-count">1</span>
        </button>

        <div className="navbar-user-avatar">
          {getInitials(user?.name)}
        </div>

        {/* Date Widget */}
        <div className="navbar-date-widget">
          <span className="date-text-primary">{formattedDate}</span>
          <span className="date-text-secondary">Have a productive day!</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
