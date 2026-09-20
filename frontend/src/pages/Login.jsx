import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import '../styles/auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot / Reset Password state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const userData = await login(cleanEmail, cleanPassword);
      if (userData?.userType === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    const cleanEmail = resetEmail.trim().toLowerCase();
    const cleanPass = resetNewPassword.trim();
    const cleanConfirm = resetConfirmPassword.trim();

    if (!cleanEmail) {
      setResetError('Please enter your corporate email address.');
      return;
    }

    if (cleanPass.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    setResetLoading(true);

    try {
      await authAPI.resetPassword({
        email: cleanEmail,
        newPassword: cleanPass
      });

      setResetSuccess('Password updated successfully! You can now sign in.');
      setEmail(cleanEmail);
      setPassword('');
      setIsResetMode(false);
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset password. Please check your email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-icon">
            <Sparkles size={26} />
          </div>
          <h1 className="auth-title">
            {isResetMode ? 'Reset Account Password' : 'Welcome to OnboardIQ'}
          </h1>
          <p className="auth-subtitle">
            {isResetMode
              ? 'Enter your corporate email and choose a new secure password'
              : 'Enterprise Autonomous AI Onboarding Platform'}
          </p>
        </div>

        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="auth-success-alert">
            <CheckCircle2 size={16} />
            <span>{resetSuccess}</span>
          </div>
        )}

        {isResetMode ? (
          /* Password Reset Form */
          <form className="auth-form" onSubmit={handleResetSubmit}>
            {resetError && (
              <div className="auth-error-alert">
                <AlertCircle size={16} />
                <span>{resetError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Registered Corporate Email Address</label>
              <input
                type="email"
                className="form-input"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  className="form-input"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  title={showResetPassword ? 'Hide password' : 'Show password'}
                >
                  {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type={showResetPassword ? 'text' : 'password'}
                className="form-input"
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem' }}
              disabled={resetLoading}
            >
              <span>{resetLoading ? 'Updating Password...' : 'Save New Password & Continue'}</span>
              <KeyRound size={16} />
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}
              onClick={() => {
                setIsResetMode(false);
                setResetError('');
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </button>
          </form>
        ) : (
          /* Standard Sign In Form */
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Corporate Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="auth-forgot-link-wrap">
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => {
                    setResetEmail(email);
                    setIsResetMode(true);
                    setError('');
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.25rem' }}
              disabled={loading}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="auth-footer">
          Don't have an account yet?
          <Link to="/signup" className="auth-link">
            Register as Employee or Admin
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
