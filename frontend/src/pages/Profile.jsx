import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Briefcase,
  Users,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Code2,
  Zap,
  FileText,
  GraduationCap,
  CheckSquare,
  BookOpen,
  Target,
  Shield,
  TrendingUp,
  Edit3,
  Plus,
  X,
  Save,
  LogOut
} from 'lucide-react';
import { employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProgressRing from '../components/ProgressRing';
import LoadingSkeleton from '../components/LoadingSkeleton';
import officeHeroImg from '../assets/office_hero.jpg';
import '../styles/profile.css';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [experience, setExperience] = useState('Senior (5+ yrs)');
  const [preferredLearningStyle, setPreferredLearningStyle] = useState('Reading Documentation & Guides');
  const [learningGoals, setLearningGoals] = useState('Stay updated with HR policies and compliance');
  const [skillsList, setSkillsList] = useState(['HR Operations', 'People Management', 'Compliance', 'Policy']);
  const [newSkillInput, setNewSkillInput] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await employeeAPI.getProfile();
      const u = res.data.user || user;
      setProfileData(res.data);
      setName(u.name || '');
      setRole(u.role || 'HR Administrator');
      setDepartment(u.department || 'People & HR');
      setExperience(u.experience || 'Senior (5+ yrs)');
      setPreferredLearningStyle(u.preferredLearningStyle || 'Reading Documentation & Guides');
      setLearningGoals(u.learningGoals || 'Stay updated with HR policies and compliance');

      if (Array.isArray(u.skills) && u.skills.length > 0) {
        setSkillsList(u.skills);
      } else {
        setSkillsList(['HR Operations', 'People Management', 'Compliance', 'Policy']);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Fallback from auth context
      if (user) {
        setName(user.name || '');
        setRole(user.role || 'HR Administrator');
        setDepartment(user.department || 'People & HR');
        setExperience(user.experience || 'Senior (5+ yrs)');
        if (Array.isArray(user.skills) && user.skills.length > 0) {
          setSkillsList(user.skills);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleOpenEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleAddSkill = (e) => {
    e?.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await employeeAPI.updateProfile({
        name,
        role,
        department,
        experience,
        skills: skillsList,
        preferredLearningStyle,
        learningGoals
      });

      if (res.data) {
        updateUser(res.data);
        if (profileData) {
          setProfileData({
            ...profileData,
            user: { ...profileData.user, ...res.data }
          });
        }
      }

      setIsEditModalOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setIsEditModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container profile-page-wrapper">
        <LoadingSkeleton height="350px" />
      </div>
    );
  }

  const u = profileData?.user || user || {};
  const progress = profileData?.progress || {
    overallPercentage: 65,
    completedTasks: 13,
    totalTasks: 74,
    inProgressTasks: 45,
    overdueTasks: 16
  };

  // Extract initials (e.g. "Test UserAdmin User" -> "TU")
  const getInitials = (fullName) => {
    if (!fullName) return 'TU';
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(u.name || name || 'Test User');
  const employeeId = u.employeeId || `JK2026${String(u._id || '001').slice(-3).padStart(3, '0')}`;
  const displayRole = u.role || role || 'HR Administrator';
  const displayDept = u.department || department || 'People & HR';
  const displayExp = u.experience || experience || 'Senior (5+ yrs)';
  const displayStyle = u.preferredLearningStyle || preferredLearningStyle;
  const displayGoals = u.learningGoals || learningGoals;
  const displayEmail = u.email || 'admin.user@company.com';
  const isUserAdmin = u.userType === 'admin' || user?.userType === 'admin';

  // Overall milestone numbers
  const completedCount = progress.completedTasks ?? 13;
  const totalCount = progress.totalTasks ?? 74;
  const pendingCount = progress.inProgressTasks ?? 45;
  const overdueCount = progress.overdueTasks ?? 16;
  const percentage = progress.overallPercentage ?? 65;

  return (
    <div className="page-container profile-page-wrapper">
      {/* Top Header */}
      <div className="profile-page-header">
        <div className="profile-header-left">
          <span className="profile-pretitle">PROFILE</span>
          <h1 className="profile-main-title">
            <span className="handwriting-wrap profile-handwriting-wrap">
              <span className="profile-cursive-heading">Employee Profile</span>
              <span className="handwriting-pen pen-profile" aria-hidden="true" />
            </span>
          </h1>
          <p className="profile-subtitle">
            Manage your personal information, role details, and onboarding preferences.
          </p>
        </div>

        <div className="profile-header-actions">
          <button className="profile-edit-btn" onClick={handleOpenEdit}>
            <Edit3 size={15} />
            <span>Edit Profile</span>
          </button>
          <button className="profile-logout-btn" onClick={handleLogout} title="Log out of account">
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div
          className="badge badge-success"
          style={{
            padding: '0.65rem 1.25rem',
            fontSize: '0.86rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={16} />
          <span>Profile changes updated successfully!</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="profile-main-grid">
        {/* ================= LEFT COLUMN ================= */}
        <div className="profile-col-left">
          {/* 1. Profile Hero Card */}
          <div className="profile-hero-card">
            <div className="profile-hero-content">
              <div className="profile-hero-top-flex">
                <div className="profile-avatar-box">
                  <span className="profile-avatar-text">{initials}</span>
                  <div className="profile-online-badge" />
                </div>

                <div className="profile-hero-name-col">
                  <h2 className="profile-hero-name">{u.name || 'Test UserAdmin User'}</h2>
                  <span className="profile-hero-role">{displayRole}</span>
                </div>
              </div>

              {/* Badges Row */}
              <div className="profile-meta-pills-row">
                <div className="profile-meta-pill department">
                  <Users size={13} color="#00A884" />
                  <span>{displayDept}</span>
                </div>

                <div className="profile-meta-pill experience">
                  <TrendingUp size={13} color="#15803D" />
                  <span>{displayExp}</span>
                </div>

                {isUserAdmin && (
                  <div className="profile-meta-pill admin">
                    <Shield size={13} color="#00A884" />
                    <span>Admin</span>
                  </div>
                )}
              </div>

              {/* Quote Block */}
              <div className="profile-hero-quote">
                <p className="profile-quote-text">“People grow when they feel supported.”</p>
                <span className="profile-quote-author">— JK TECH SOLUTIONS</span>
              </div>
            </div>

            {/* Office Walkway Photo Background with Gradient Fade & Glass Typography */}
            <div className="profile-hero-bg">
              <img src={officeHeroImg} alt="Corporate Office" className="profile-hero-photo" />
              <div className="profile-hero-overlay" />
              <div className="profile-glass-sign">
                <span className="glass-sign-line">PEOPLE</span>
                <span className="glass-sign-line">IDEAS</span>
                <span className="glass-sign-line">TECHNOLOGY</span>
                <span className="glass-sign-line">A BRIGHTER</span>
                <span className="glass-sign-line">TOMORROW</span>
              </div>
            </div>
          </div>

          {/* 2. Personal Information Card */}
          <div className="profile-panel">
            <div className="panel-header-row">
              <div className="panel-header-left">
                <div className="panel-header-icon-box">
                  <User size={18} color="#00A884" />
                </div>
                <h3 className="panel-header-title">Personal Information</h3>
              </div>
            </div>

            <div className="personal-info-grid">
              <div className="info-item-col">
                <span className="info-label">Full Name</span>
                <span className="info-value">{u.name || 'Test UserAdmin User'}</span>
              </div>

              <div className="info-item-col">
                <span className="info-label">Employee ID</span>
                <span className="info-value">{employeeId}</span>
              </div>

              <div className="info-item-col">
                <span className="info-label">Corporate Email</span>
                <span className="info-value">{displayEmail}</span>
              </div>

              <div className="info-item-col">
                <span className="info-label">Role</span>
                <span className="info-value">{displayRole}</span>
              </div>

              <div className="info-item-col">
                <span className="info-label">Department</span>
                <span className="info-value">{displayDept}</span>
              </div>

              <div className="info-item-col">
                <span className="info-label">Account Type</span>
                <span className="info-value account-badge">
                  {u.userType?.toUpperCase() || 'ADMIN'}
                </span>
              </div>

              <div className="info-item-col">
                <span className="info-label">Experience Level</span>
                <span className="info-value">{displayExp}</span>
              </div>

              <div className="info-item-col">
                <span className="info-label">Joining Date</span>
                <div className="info-value with-calendar">
                  <Calendar size={15} color="#0F172A" />
                  <span>21 Sep 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Learning Preferences Card */}
          <div className="profile-panel">
            <div className="panel-header-row">
              <div className="panel-header-left">
                <div className="panel-header-icon-box">
                  <BookOpen size={18} color="#00A884" />
                </div>
                <h3 className="panel-header-title">Learning Preferences</h3>
              </div>
              <button className="panel-action-edit-btn" onClick={handleOpenEdit}>
                Edit
              </button>
            </div>

            <div className="learning-pref-grid">
              <div className="learning-pref-tile">
                <div className="learning-pref-icon">
                  <FileText size={18} color="#00A884" />
                </div>
                <div className="learning-pref-info">
                  <span className="learning-pref-label">Preferred Learning Style</span>
                  <span className="learning-pref-value">{displayStyle}</span>
                </div>
              </div>

              <div className="learning-pref-tile">
                <div className="learning-pref-icon">
                  <Target size={18} color="#00A884" />
                </div>
                <div className="learning-pref-info">
                  <span className="learning-pref-label">Learning Goals</span>
                  <span className="learning-pref-value">{displayGoals}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="profile-col-right">
          {/* 1. Onboarding Health Score Card */}
          <div className="health-score-panel">
            <h3 className="health-score-header">Onboarding Health Score</h3>

            <div className="health-score-main-flex">
              <ProgressRing percentage={percentage} size={110} strokeWidth={11} />

              <div className="health-score-breakdown-list">
                <div className="health-score-stat-row">
                  <CheckCircle2 size={16} color="#00A884" />
                  <span>
                    <strong>{completedCount}</strong> Completed
                  </span>
                </div>

                <div className="health-score-stat-row">
                  <Clock size={16} color="#0284C7" />
                  <span>
                    <strong>{pendingCount}</strong> Pending
                  </span>
                </div>

                <div className="health-score-stat-row">
                  <AlertCircle size={16} color="#EF4444" />
                  <span>
                    <strong>{overdueCount}</strong> Overdue
                  </span>
                </div>
              </div>
            </div>

            <span className="health-score-subtext">
              Completed {completedCount} of {totalCount} milestones.
            </span>

            <div className="health-tip-banner">
              <Sparkles size={15} color="#00A884" />
              <span className="health-tip-text">Keep going! You're making great progress.</span>
            </div>
          </div>

          {/* 2. Technical Skills Card */}
          <div className="profile-panel">
            <div className="panel-header-row">
              <div className="panel-header-left">
                <div className="panel-header-icon-box">
                  <Code2 size={18} color="#00A884" />
                </div>
                <h3 className="panel-header-title">Technical Skills</h3>
              </div>
              <button className="panel-action-edit-btn" onClick={handleOpenEdit}>
                Edit
              </button>
            </div>

            <div className="skills-tags-container">
              {skillsList.map((skill, idx) => (
                <div key={idx} className="skill-badge-pill">
                  <span>{skill}</span>
                </div>
              ))}
              <button className="add-skill-pill-btn" onClick={handleOpenEdit}>
                <Plus size={13} />
                <span>Add Skill</span>
              </button>
            </div>
          </div>

          {/* 3. Quick Actions Card */}
          <div className="profile-panel">
            <div className="panel-header-row">
              <div className="panel-header-left">
                <div className="panel-header-icon-box" style={{ background: '#E0F2FE' }}>
                  <Zap size={18} color="#0284C7" />
                </div>
                <h3 className="panel-header-title">Quick Actions</h3>
              </div>
            </div>

            <div className="quick-actions-row">
              <div className="quick-action-tile" onClick={() => navigate('/documents')}>
                <div className="tile-icon-box blue">
                  <FileText size={18} color="#0284C7" />
                </div>
                <span className="tile-title">View Documents</span>
                <span className="tile-subtitle">Access company resources</span>
              </div>

              <div className="quick-action-tile" onClick={() => navigate('/learning')}>
                <div className="tile-icon-box green">
                  <GraduationCap size={18} color="#00A884" />
                </div>
                <span className="tile-title">My Learning Path</span>
                <span className="tile-subtitle">Continue learning</span>
              </div>

              <div className="quick-action-tile" onClick={() => navigate('/tasks')}>
                <div className="tile-icon-box green">
                  <CheckSquare size={18} color="#00A884" />
                </div>
                <span className="tile-title">View My Tasks</span>
                <span className="tile-subtitle">Track progress</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Employee Profile</h2>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="modal-form">
              <div className="form-two-cols">
                <div className="modal-field-group">
                  <label className="modal-field-label">Full Name</label>
                  <input
                    type="text"
                    className="modal-field-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-field-label">Role</label>
                  <input
                    type="text"
                    className="modal-field-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-two-cols">
                <div className="modal-field-group">
                  <label className="modal-field-label">Department</label>
                  <input
                    type="text"
                    className="modal-field-input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-field-label">Experience Level</label>
                  <input
                    type="text"
                    className="modal-field-input"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-field-group">
                <label className="modal-field-label">Preferred Learning Style</label>
                <input
                  type="text"
                  className="modal-field-input"
                  value={preferredLearningStyle}
                  onChange={(e) => setPreferredLearningStyle(e.target.value)}
                />
              </div>

              <div className="modal-field-group">
                <label className="modal-field-label">Learning Goals</label>
                <input
                  type="text"
                  className="modal-field-input"
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                />
              </div>

              <div className="modal-field-group">
                <label className="modal-field-label">Technical Skills (Click X to remove)</label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  {skillsList.map((skill, idx) => (
                    <span key={idx} className="skill-badge-pill">
                      {skill}
                      <button
                        type="button"
                        className="skill-remove-btn"
                        onClick={() => handleRemoveSkill(skill)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="modal-field-input"
                    placeholder="Type a skill and click Add"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flexShrink: 0, padding: '0 1rem' }}
                    onClick={handleAddSkill}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
