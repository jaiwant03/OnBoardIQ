import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Map,
  CheckSquare,
  GraduationCap,
  FileText,
  User,
  BarChart3,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'JK';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="sidebar">
      {/* Brand Header with Dual-Leaf Sprout Logo */}
      <div className="sidebar-header">
        <div className="sidebar-brand-link" onClick={() => navigate('/dashboard')}>
          <div className="sidebar-leaf-logo">
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Seed / Sprout Dot */}
              <circle cx="18" cy="7" r="2.8" fill="#00E599" />
              {/* Left Leaf - Peacock Blue */}
              <path
                d="M17.5 10C17.5 10 9 12.5 7.5 21C6.2 27.8 13.2 29.5 17.5 27.5C17.5 24 17.5 14 17.5 10Z"
                fill="#00C49F"
              />
              {/* Right Leaf - Rama Green */}
              <path
                d="M18.5 10C18.5 10 27 12.5 28.5 21C29.8 27.8 22.8 29.5 18.5 27.5C18.5 24 18.5 14 18.5 10Z"
                fill="#00E599"
              />
            </svg>
          </div>
          <div className="sidebar-title-group">
            <span className="sidebar-title">ONBOARD<span className="sidebar-title-iq">IQ</span></span>
            <span className="sidebar-subtitle">AI ONBOARDING AGENT</span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-title">MAIN</span>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <div className="nav-link-content">
            <LayoutDashboard className="nav-icon" />
            <span>Dashboard</span>
          </div>
        </NavLink>

        <NavLink to="/assistant" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <div className="nav-link-content">
            <MessageSquare className="nav-icon" />
            <span>AI Assistant</span>
          </div>
        </NavLink>

        <NavLink to="/onboarding" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <div className="nav-link-content">
            <Map className="nav-icon" />
            <span>My Onboarding</span>
          </div>
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <div className="nav-link-content">
            <CheckSquare className="nav-icon" />
            <span>Tasks</span>
          </div>
        </NavLink>

        <NavLink to="/learning" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <div className="nav-link-content">
            <GraduationCap className="nav-icon" />
            <span>Learning Path</span>
          </div>
        </NavLink>

        <NavLink to="/documents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <div className="nav-link-content">
            <FileText className="nav-icon" />
            <span>Documents</span>
          </div>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <div className="nav-link-content">
            <User className="nav-icon" />
            <span>Profile</span>
          </div>
        </NavLink>

        <span className="sidebar-section-title" style={{ marginTop: '0.85rem' }}>ADMIN</span>

        <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <div className="nav-link-content">
            <BarChart3 className="nav-icon" />
            <span>Admin Dashboard</span>
          </div>
        </NavLink>
      </nav>

      {/* User Profile Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-preview" onClick={() => navigate('/profile')}>
          <div className="user-avatar-circle">
            {getInitials(user?.name)}
          </div>
          <div className="user-info-text">
            <div className="user-name-text">{user?.name || 'Jaiwant Karrun SA'}</div>
            <div className="user-role-text">{user?.role || 'HR Administrator'}</div>
          </div>
          <ChevronRight size={16} className="user-profile-arrow" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
