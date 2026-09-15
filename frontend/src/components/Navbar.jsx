import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles } from 'lucide-react';
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
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2 className="navbar-page-title">{title}</h2>
        <div className="ai-status-pill">
          <span className={`ai-status-dot ${aiOnline ? 'online' : 'offline'}`} />
          <span>{aiOnline ? `AI Agent Online (${aiModel})` : 'AI Standby Mode'}</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-search">
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search policies, tasks..."
          />
        </div>

        <button className="navbar-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-badge-dot" />
        </button>

        <div className="user-avatar-circle" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
