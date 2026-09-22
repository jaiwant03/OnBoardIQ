import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, User, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import '../styles/navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { showHistory, toggleHistory, setShowHistory } = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  const [aiOnline, setAiOnline] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  const handleMenuToggle = () => {
    if (location.pathname !== '/assistant') {
      setShowHistory(true);
      navigate('/assistant');
    } else {
      toggleHistory();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };
    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAccountMenu]);

  const handleLogout = () => {
    setShowAccountMenu(false);
    logout();
    navigate('/login');
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

        {/* Account Menu & Logout */}
        <div className="navbar-account-container" ref={accountMenuRef}>
          <button
            type="button"
            className={`navbar-user-avatar-btn ${showAccountMenu ? 'active' : ''}`}
            onClick={() => setShowAccountMenu((prev) => !prev)}
            title="Account & Logout"
            aria-haspopup="true"
            aria-expanded={showAccountMenu}
          >
            <div className="navbar-user-avatar">
              {getInitials(user?.name)}
            </div>
          </button>

          {showAccountMenu && (
            <div className="navbar-account-dropdown">
              <div className="navbar-dropdown-header">
                <div className="navbar-dropdown-avatar">
                  {getInitials(user?.name)}
                </div>
                <div className="navbar-dropdown-user-info">
                  <span className="navbar-dropdown-name">{user?.name || 'User'}</span>
                  <span className="navbar-dropdown-email">{user?.email || 'user@company.com'}</span>
                </div>
              </div>

              <div className="navbar-dropdown-divider" />

              <div className="navbar-dropdown-menu">
                <button
                  type="button"
                  className="navbar-dropdown-item"
                  onClick={() => {
                    setShowAccountMenu(false);
                    navigate('/profile');
                  }}
                >
                  <User size={15} />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  className="navbar-dropdown-item logout"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
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
