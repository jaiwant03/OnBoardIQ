import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

const Signup = () => {
  const [userType, setUserType] = useState('employee'); // 'employee' | 'admin'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Software Developer',
    department: 'Engineering',
    experience: 'Fresher',
    skills: 'JavaScript, React, Node.js, Git',
    preferredLearningStyle: 'Hands-on Projects & Code'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleUserTypeChange = (type) => {
    setUserType(type);
    if (type === 'admin') {
      setFormData((prev) => ({
        ...prev,
        role: 'HR Administrator',
        department: 'People & HR',
        experience: 'Senior (5+ yrs)',
        skills: 'HR Operations, People Management, Compliance, Policy'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        role: 'Software Developer',
        department: 'Engineering',
        experience: 'Fresher',
        skills: 'JavaScript, React, Node.js, Git'
      }));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const userData = await register({
        ...formData,
        userType,
        skills: skillsArray
      });

      if (userData?.userType === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card auth-card-wide">
        <div className="auth-brand">
          <div className="auth-logo-icon">
            <Sparkles size={26} />
          </div>
          <h1 className="auth-title">Create OnboardIQ Account</h1>
          <p className="auth-subtitle">
            Enterprise AI-Driven Employee Onboarding & Compliance Management
          </p>
        </div>

        {/* Real-time Account Type Selector */}
        <div className="account-type-grid">
          <div
            className={`account-type-card ${userType === 'employee' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('employee')}
            role="button"
            tabIndex={0}
          >
            <div className="account-type-header">
              <User size={16} color={userType === 'employee' ? '#0284C7' : 'var(--text-secondary)'} />
              <span>Employee Account</span>
            </div>
            <div className="account-type-desc">
              Join as a new team member with autonomous AI checklist, daily roadmap, and skills curriculum.
            </div>
          </div>

          <div
            className={`account-type-card ${userType === 'admin' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('admin')}
            role="button"
            tabIndex={0}
          >
            <div className="account-type-header">
              <ShieldCheck size={16} color={userType === 'admin' ? '#7C3AED' : 'var(--text-secondary)'} />
              <span>Administrator Account</span>
            </div>
            <div className="account-type-desc">
              Manage organization onboarding, view employee analytics, track overdue tasks, and policy health.
            </div>
          </div>
        </div>

        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@company.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          {userType === 'employee' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Employee Role</label>
                  <select
                    name="role"
                    className="form-select"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="Software Developer">Software Developer</option>
                    <option value="Frontend Engineer">Frontend Engineer</option>
                    <option value="Backend Engineer">Backend Engineer</option>
                    <option value="DevOps Specialist">DevOps Specialist</option>
                    <option value="QA / Test Engineer">QA / Test Engineer</option>
                    <option value="Product Designer">Product Designer</option>
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="HR Associate">HR Associate</option>
                    <option value="Marketing Specialist">Marketing Specialist</option>
                    <option value="Sales Executive">Sales Executive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    name="department"
                    className="form-select"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="IT">IT & Security</option>
                    <option value="HR">People & HR</option>
                    <option value="Product">Product & Design</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Experience Level</label>
                  <select
                    name="experience"
                    className="form-select"
                    value={formData.experience}
                    onChange={handleChange}
                  >
                    <option value="Fresher">Fresher / Graduate</option>
                    <option value="Junior (1-2 yrs)">Junior (1-2 yrs)</option>
                    <option value="Mid-Level (3-5 yrs)">Mid-Level (3-5 yrs)</option>
                    <option value="Senior (5+ yrs)">Senior (5+ yrs)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Learning Style</label>
                  <select
                    name="preferredLearningStyle"
                    className="form-select"
                    value={formData.preferredLearningStyle}
                    onChange={handleChange}
                  >
                    <option value="Hands-on Projects & Code">Hands-on Projects & Code</option>
                    <option value="Interactive Tutorials">Interactive Tutorials</option>
                    <option value="Documentation & Deep Reading">Documentation & Deep Reading</option>
                    <option value="Mentorship & Pair Programming">Mentorship & Pair Programming</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Skills (comma-separated)</label>
                <input
                  type="text"
                  name="skills"
                  className="form-input"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g. JavaScript, React, Node.js, Python, Git"
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Admin Role Title</label>
                  <select
                    name="role"
                    className="form-select"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="HR Administrator">HR Administrator</option>
                    <option value="People Operations Lead">People Operations Lead</option>
                    <option value="Head of People & Culture">Head of People & Culture</option>
                    <option value="Engineering Manager">Engineering Manager</option>
                    <option value="IT & Security Director">IT & Security Director</option>
                    <option value="Operations Lead">Operations Lead</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Administrative Department</label>
                  <select
                    name="department"
                    className="form-select"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="People & HR">People & HR</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Operations">Operations</option>
                    <option value="Engineering Leadership">Engineering Leadership</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: '#7C3AED', marginBottom: '0.2rem' }}>
                  <CheckCircle2 size={14} />
                  <span>Full Administrative Privileges</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Admin accounts receive access to organization analytics, company-wide completion rates, overdue milestone tracking, and employee roster management.
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            <span>
              {loading
                ? userType === 'admin'
                  ? 'Provisioning Admin Access...'
                  : 'Generating Personalized AI Roadmap...'
                : userType === 'admin'
                ? 'Register as Administrator'
                : 'Create Employee Account & Start'}
            </span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
