import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Lock,
  FileText,
  CheckSquare,
  Sprout,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import officeHeroImg from '../assets/office_hero.jpg';
import '../styles/auth.css';

// Exact Botanical Sprout Logo
const SproutLogo = ({ size = 38, variant = 'white' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sproutGradA" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00A86B" />
          <stop offset="100%" stopColor="#00E599" />
        </linearGradient>
        <linearGradient id="sproutGradB" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#008055" />
          <stop offset="100%" stopColor="#00F5A0" />
        </linearGradient>
      </defs>
      {/* Center upright leaf */}
      <path d="M20 6 C20 6 24.5 13.5 24.5 20.5 C24.5 25 22.5 27.5 20 27.5 C17.5 27.5 15.5 25 15.5 20.5 C15.5 13.5 20 6 20 6Z" fill="url(#sproutGradB)" />
      {/* Left curving leaf */}
      <path d="M19 22.5 C19 22.5 11 20.5 7.5 15.5 C5.5 12.5 7.5 8.5 9.5 8.5 C13.5 8.5 18 15.5 19 22.5Z" fill="url(#sproutGradA)" />
      {/* Right curving leaf */}
      <path d="M21 22.5 C21 22.5 29 20.5 32.5 15.5 C34.5 12.5 32.5 8.5 30.5 8.5 C26.5 8.5 22 15.5 21 22.5Z" fill="url(#sproutGradA)" />
      {/* Base stem */}
      <path d="M19 26.5 C19 26.5 19.5 31.5 20 33.5 C20.5 31.5 21 26.5 21 26.5 Z" fill="#00A86B" />
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{
        fontFamily: 'var(--font-tech, "Space Grotesk", sans-serif)',
        fontWeight: 700,
        fontSize: size > 32 ? '1.25rem' : '1.1rem',
        letterSpacing: '0.06em',
        color: variant === 'white' ? '#FFFFFF' : '#0F172A',
        lineHeight: 1.15
      }}>
        ONBOARD<span style={{ color: '#00E599' }}>IQ</span>
      </span>
      <span style={{
        fontFamily: 'var(--font-tech, "Space Grotesk", sans-serif)',
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: variant === 'white' ? 'rgba(255, 255, 255, 0.75)' : '#64748B'
      }}>
        AI ONBOARDING AGENT
      </span>
    </div>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('onboardiq_remember_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('onboardiq_remember_email'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Forgot / Reset Password modal state
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

  useEffect(() => {
    // Prevent white bleed/rubber-banding by anchoring root backgrounds to theme green
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    const originalBodyBg = document.body.style.backgroundColor;
    const originalOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.backgroundColor = '#021c14';
    document.body.style.backgroundColor = '#021c14';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.documentElement.style.backgroundColor = originalHtmlBg;
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.overscrollBehavior = originalOverscroll;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (rememberMe) {
      localStorage.setItem('onboardiq_remember_email', cleanEmail);
    } else {
      localStorage.removeItem('onboardiq_remember_email');
    }

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
      setResetError('Passwords do not match. Please verify both fields.');
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
    <div
      className="exact-login-page"
      style={{
        backgroundColor: '#021c14',
        backgroundImage: `linear-gradient(135deg, rgba(2, 28, 20, 0.94) 0%, rgba(2, 36, 26, 0.88) 42%, rgba(3, 44, 32, 0.72) 100%), url(${officeHeroImg})`
      }}
    >
      {/* Background radial ambient glow & architectural sweep */}
      <div className="login-ambient-sweep" />

      <div className="exact-login-container">
        {/* LEFT COLUMN: HERO INFORMATION PANEL */}
        <div className="exact-hero-panel">
          {/* Top Brand Header */}
          <div className="exact-hero-header">
            <SproutLogo size={36} variant="white" />
            <div className="exact-hero-tagline-right">
              Smarter Onboarding. Stronger Teams.
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="exact-hero-body">
            {/* Welcome Pill */}
            <div className="exact-welcome-pill">
              <span className="exact-pill-line" />
              <span>WELCOME TO ONBOARDIQ</span>
            </div>

            {/* Big Headline with Spatial Motion & Cursive Elegance */}
            <h1 className="exact-hero-headline">
              <span className="exact-headline-line">
                People <span className="exact-headline-cursive-accent">grow</span>
              </span>
              <br />
              <span className="exact-headline-line">when they feel</span>
              <br />
              <span className="exact-spatial-word">
                <span className="exact-spatial-cursive">supported.</span>
                <span className="exact-spatial-aura" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="exact-hero-subtext">
              An autonomous AI onboarding platform that helps new employees get up to speed faster,
              with personalized guidance, company knowledge, and AI-powered support.
            </p>

            {/* Feature Items List */}
            <div className="exact-features-list">
              <div className="exact-feature-item">
                <div className="exact-feature-icon-wrap">
                  <FileText size={18} color="#00E599" />
                </div>
                <div className="exact-feature-text">
                  <div className="exact-feature-title">Personalized Onboarding</div>
                  <div className="exact-feature-desc">Role-based plans for faster productivity</div>
                </div>
              </div>

              <div className="exact-feature-item">
                <div className="exact-feature-icon-wrap">
                  <Sparkles size={18} color="#00E599" />
                </div>
                <div className="exact-feature-text">
                  <div className="exact-feature-title">AI-Powered Assistance</div>
                  <div className="exact-feature-desc">Instant answers from company knowledge</div>
                </div>
              </div>

              <div className="exact-feature-item">
                <div className="exact-feature-icon-wrap">
                  <CheckSquare size={18} color="#00E599" />
                </div>
                <div className="exact-feature-text">
                  <div className="exact-feature-title">Track Progress</div>
                  <div className="exact-feature-desc">Stay on top of your onboarding journey</div>
                </div>
              </div>

              <div className="exact-feature-item">
                <div className="exact-feature-icon-wrap">
                  <Sprout size={18} color="#00E599" />
                </div>
                <div className="exact-feature-text">
                  <div className="exact-feature-title">Learn &amp; Grow</div>
                  <div className="exact-feature-desc">Curated learning paths for your role</div>
                </div>
              </div>
            </div>

            {/* Testimonial Quote Box */}
            <div className="exact-quote-card">
              <div className="exact-quote-mark">“</div>
              <div className="exact-quote-body">
                <p className="exact-quote-text">
                  “A great onboarding experience builds a brighter tomorrow.”
                </p>
                <div className="exact-quote-author">— ONBOARDIQ</div>
              </div>
            </div>
          </div>

          {/* Bottom Indicators & Metrics Footer */}
          <div className="exact-hero-footer">
            <div className="exact-carousel-indicators">
              <span className="exact-indicator-dash active" />
              <span className="exact-indicator-dot" />
              <span className="exact-indicator-dot" />
            </div>

            <div className="exact-stats-group">
              <div className="exact-stat-item">
                <span className="exact-stat-number">500+</span>
                <span className="exact-stat-label">Companies</span>
              </div>
              <div className="exact-stat-item">
                <span className="exact-stat-number">50K+</span>
                <span className="exact-stat-label">Employees</span>
              </div>
              <div className="exact-stat-item">
                <span className="exact-stat-number">98%</span>
                <span className="exact-stat-label">Satisfaction</span>
              </div>
            </div>

            <div className="exact-ai-label-group">
              <div className="exact-three-dots">•••</div>
              <div className="exact-ai-title">
                Human Potential<br />
                Powered by AI
              </div>
              <div className="exact-ai-underline" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FLOATING LOGIN CARD */}
        <div className="exact-card-panel">
          <div className={`exact-floating-card ${isDarkMode ? 'dark-mode' : ''}`}>
            {/* Card Top Row: Dark / Light Toggle */}
            <div className="exact-card-topbar">
              <div
                className="exact-theme-toggle"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                role="button"
                tabIndex={0}
              >
                <Sun size={13} color={isDarkMode ? '#64748B' : '#00A86B'} />
                <div className={`exact-toggle-slider ${isDarkMode ? 'dark' : 'light'}`}>
                  <div className="exact-slider-thumb" />
                </div>
                <Moon size={13} color={isDarkMode ? '#00E599' : '#94A3B8'} />
              </div>
            </div>

            {/* Centered Sprout Logo & Brand Name inside Card */}
            <div className="exact-card-brand">
              <SproutLogo size={36} variant={isDarkMode ? 'white' : 'dark'} />
            </div>

            {/* Headings */}
            <div className="exact-card-headings">
              <h2 className="exact-card-title">
                {isResetMode ? 'Reset Password' : 'Welcome Back'}
              </h2>
              <p className="exact-card-subtitle">
                {isResetMode
                  ? 'Enter your registered email and choose a new secure password.'
                  : 'Sign in to your workspace and continue your onboarding journey.'}
              </p>
            </div>

            {/* Error or Success Alerts */}
            {error && (
              <div className="exact-alert exact-alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="exact-alert exact-alert-success">
                <CheckCircle2 size={16} />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* Reset Password Form Mode */}
            {isResetMode ? (
              <form onSubmit={handleResetSubmit} className="exact-card-form">
                {resetError && (
                  <div className="exact-alert exact-alert-error">
                    <AlertCircle size={16} />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="exact-field-group">
                  <label className="exact-field-label">Corporate Email Address</label>
                  <div className="exact-input-wrap">
                    <Mail size={16} className="exact-input-icon" />
                    <input
                      type="email"
                      className="exact-field-input"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="exact-field-group">
                  <label className="exact-field-label">New Password</label>
                  <div className="exact-input-wrap">
                    <Lock size={16} className="exact-input-icon" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      className="exact-field-input has-action-btn"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="exact-eye-btn"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      title={showResetPassword ? 'Hide password' : 'Show password'}
                    >
                      {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="exact-field-group">
                  <label className="exact-field-label">Confirm New Password</label>
                  <div className="exact-input-wrap">
                    <Lock size={16} className="exact-input-icon" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      className="exact-field-input"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="exact-submit-btn"
                  disabled={resetLoading}
                  style={{ marginTop: '0.75rem' }}
                >
                  <span>{resetLoading ? 'Updating Password...' : 'Save New Password & Continue'}</span>
                  <KeyRound size={16} />
                </button>

                <button
                  type="button"
                  className="exact-back-btn"
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
              /* Standard Login Form */
              <form onSubmit={handleSubmit} className="exact-card-form">
                {/* Email Input */}
                <div className="exact-field-group">
                  <label className="exact-field-label">Corporate Email Address</label>
                  <div className="exact-input-wrap">
                    <Mail size={16} className="exact-input-icon" />
                    <input
                      type="email"
                      className="exact-field-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="exact-field-group">
                  <label className="exact-field-label">Password</label>
                  <div className="exact-input-wrap">
                    <Lock size={16} className="exact-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="exact-field-input has-action-btn"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="exact-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="exact-actions-row">
                  <label className="exact-remember-label">
                    <input
                      type="checkbox"
                      className="exact-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="exact-forgot-btn"
                    onClick={() => {
                      setResetEmail(email);
                      setIsResetMode(true);
                      setError('');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Main Submit Button with Arrow */}
                <button
                  type="submit"
                  className="exact-submit-btn"
                  disabled={loading}
                  style={{ marginBottom: '1.75rem' }}
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Footer Registration Link */}
            <div className="exact-card-footer">
              Don't have an account yet?{' '}
              <Link to="/signup" className="exact-register-link">
                Register as Employee or Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

