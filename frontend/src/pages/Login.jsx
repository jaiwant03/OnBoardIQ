import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-icon">
            <Sparkles size={26} />
          </div>
          <h1 className="auth-title">Welcome to OnboardIQ</h1>
          <p className="auth-subtitle">Autonomous AI Employee Onboarding Platform</p>
        </div>

        {/* 1-Click Demo Login Box */}
        <div className="auth-demo-box">
          <div className="auth-demo-label">
            <Sparkles size={13} />
            <span>Hackathon Quick Demo Logins</span>
          </div>
          <div className="auth-demo-btns">
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => handleDemoLogin('rahul@company.com', 'password123')}
            >
              <User size={13} style={{ display: 'inline', marginRight: 4 }} />
              Rahul Kumar (Employee)
            </button>
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => handleDemoLogin('admin@company.com', 'admin123')}
            >
              <Shield size={13} style={{ display: 'inline', marginRight: 4 }} />
              Sarah (HR Admin)
            </button>
          </div>
        </div>

        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Corporate Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account yet?
          <Link to="/signup" className="auth-link">
            Create Onboarding Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
