import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

const Signup = () => {
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

      await register({
        ...formData,
        skills: skillsArray
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create onboarding account');
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
          <h1 className="auth-title">Join OnboardIQ</h1>
          <p className="auth-subtitle">
            Autonomous AI will generate your personalized onboarding journey
          </p>
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
                placeholder="e.g. Alex Morgan"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@company.com"
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
              <label className="form-label">Learning Style</label>
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
            <label className="form-label">Primary Technical Skills (comma-separated)</label>
            <input
              type="text"
              name="skills"
              className="form-input"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. JavaScript, React, Node.js, Python, Git"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={loading}
          >
            <span>{loading ? 'Generating Personalized Plan with AI...' : 'Create Account & Generate Roadmap'}</span>
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
