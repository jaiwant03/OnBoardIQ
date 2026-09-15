import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, Building, Award, Calendar, CheckCircle2, Save } from 'lucide-react';
import { employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProgressRing from '../components/ProgressRing';
import LoadingSkeleton from '../components/LoadingSkeleton';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [skills, setSkills] = useState('');
  const [preferredLearningStyle, setPreferredLearningStyle] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await employeeAPI.getProfile();
      const u = res.data.user;
      setProfileData(res.data);
      setName(u.name || '');
      setRole(u.role || '');
      setDepartment(u.department || '');
      setSkills(Array.isArray(u.skills) ? u.skills.join(', ') : '');
      setPreferredLearningStyle(u.preferredLearningStyle || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await employeeAPI.updateProfile({
        name,
        role,
        department,
        skills: skillsArray,
        preferredLearningStyle
      });
      updateUser(res.data);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSkeleton height="300px" />
      </div>
    );
  }

  const u = profileData?.user || user;
  const progress = profileData?.progress || { overallPercentage: 0, completedTasks: 0, totalTasks: 0 };

  return (
    <div className="page-container" style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Employee Profile
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Your employee records, assigned role, learning preferences, and onboarding progress metrics.
          </p>
        </div>

        <button
          className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      {saveSuccess && (
        <div className="badge badge-success" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', marginBottom: '1.5rem', width: '100%', justifyContent: 'center' }}>
          <CheckCircle2 size={16} />
          <span>Profile successfully updated</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        {/* Left Card: Information Form / View */}
        <div className="card">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              ) : (
                <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{u.name}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Email</label>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{u.email}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Role</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  />
                ) : (
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{u.role}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                ) : (
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{u.department}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level</label>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                {u.experience || 'Fresher'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Technical Skills</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Comma-separated skills"
                />
              ) : (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {(u.skills || []).map((s, idx) => (
                    <span key={idx} className="badge badge-it">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Learning Style</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={preferredLearningStyle}
                  onChange={(e) => setPreferredLearningStyle(e.target.value)}
                />
              ) : (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {u.preferredLearningStyle || 'Hands-on Projects & Pair Programming'}
                </div>
              )}
            </div>

            {isEditing && (
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '1rem', width: '100%' }}
              >
                <Save size={16} />
                <span>Save Profile Changes</span>
              </button>
            )}
          </form>
        </div>

        {/* Right Card: Onboarding Metric Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              Onboarding Health Score
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <ProgressRing percentage={progress.overallPercentage || 65} size={130} strokeWidth={12} />
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Completed <strong>{progress.completedTasks || 13}</strong> of{' '}
              <strong>{progress.totalTasks || 20}</strong> milestones.
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Calendar size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Joining Details
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Joined on: <strong>{new Date(u.joiningDate || Date.now()).toLocaleDateString()}</strong>
              <br />
              Status: <span style={{ color: 'var(--success)' }}>● Active Onboarding</span>
              <br />
              Account Type: <strong>{u.userType?.toUpperCase() || 'EMPLOYEE'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
