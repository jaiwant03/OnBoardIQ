import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Map,
  CheckSquare,
  Compass,
  FileText,
  User,
  ShieldCheck,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Sparkles size={20} />
        </div>
        <div className="sidebar-title-group">
          <span className="sidebar-title">ONBOARDIQ</span>
          <span className="sidebar-subtitle">AI ONBOARDING AGENT</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-title">Navigation</span>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/assistant" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Bot className="nav-icon" />
          <span>AI Assistant</span>
        </NavLink>

        <NavLink to="/onboarding" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Map className="nav-icon" />
          <span>My Onboarding</span>
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CheckSquare className="nav-icon" />
          <span>Tasks</span>
        </NavLink>

        <NavLink to="/learning" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Compass className="nav-icon" />
          <span>Learning Path</span>
        </NavLink>

        <NavLink to="/documents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText className="nav-icon" />
          <span>Documents</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <User className="nav-icon" />
          <span>Profile</span>
        </NavLink>

        {user && user.userType === 'admin' && (
          <>
            <span className="sidebar-section-title" style={{ marginTop: '0.75rem' }}>Administration</span>
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShieldCheck className="nav-icon" />
              <span>Admin Dashboard</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-preview">
          <div className="user-avatar-circle">
            {getInitials(user?.name)}
          </div>
          <div className="user-info-text">
            <div className="user-name-text">{user?.name || 'Employee'}</div>
            <div className="user-role-text">{user?.role || 'Staff'}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
