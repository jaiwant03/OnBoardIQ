import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  User,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Briefcase,
  Network,
  BarChart2,
  BookOpen,
  Code2,
  Users,
  Check,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import officeHeroImg from '../assets/office_hero.jpg';
import '../styles/auth.css';

// Exact Botanical Sprout Logo
const SproutLogo = ({ size = 38, variant = 'white' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sproutGradSignupA" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00A86B" />
          <stop offset="100%" stopColor="#00E599" />
        </linearGradient>
        <linearGradient id="sproutGradSignupB" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#008055" />
          <stop offset="100%" stopColor="#00F5A0" />
        </linearGradient>
      </defs>
      {/* Center upright leaf */}
      <path d="M20 6 C20 6 24.5 13.5 24.5 20.5 C24.5 25 22.5 27.5 20 27.5 C17.5 27.5 15.5 25 15.5 20.5 C15.5 13.5 20 6 20 6Z" fill="url(#sproutGradSignupB)" />
      {/* Left curving leaf */}
      <path d="M19 22.5 C19 22.5 11 20.5 7.5 15.5 C5.5 12.5 7.5 8.5 9.5 8.5 C13.5 8.5 18 15.5 19 22.5Z" fill="url(#sproutGradSignupA)" />
      {/* Right curving leaf */}
      <path d="M21 22.5 C21 22.5 29 20.5 32.5 15.5 C34.5 12.5 32.5 8.5 30.5 8.5 C26.5 8.5 22 15.5 21 22.5Z" fill="url(#sproutGradSignupA)" />
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
        fontWeight: 600,
        fontSize: '0.62rem',
        letterSpacing: '0.18em',
        color: '#00E599',
        textTransform: 'uppercase'
      }}>
        AI ONBOARDING AGENT
      </span>
    </div>
  </div>
);

// Custom Luxury Dropdown Component ("New Model Design - Options")
const ModernSelect = ({
  label,
  value,
  options,
  name,
  icon: Icon,
  isOpen,
  onToggle,
  onSelect
}) => (
  <div className="signup-field-group">
    <label className="signup-input-label">{label}</label>
    <div className="signup-custom-dropdown-wrap">
      <button
        type="button"
        className={`signup-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="signup-dropdown-left">
          {Icon && <Icon size={16} className="signup-input-icon-modern" />}
          <span className="signup-dropdown-value">{value}</span>
        </div>
        <ChevronDown
          size={16}
          className={`signup-dropdown-chevron ${isOpen ? 'rotate' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="signup-dropdown-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option === value;
            return (
              <div
                key={option}
                className={`signup-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(name, option)}
                role="option"
                aria-selected={isSelected}
              >
                <span>{option}</span>
                {isSelected && <Check size={14} className="signup-dropdown-item-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

const Signup = () => {
  const [userType, setUserType] = useState('employee'); // 'employee' | 'admin'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Software Developer',
    department: 'Engineering',
    experience: 'Fresher / Graduate',
    skills: 'JavaScript, React, Node.js, Git',
    preferredLearningStyle: 'Hands-on Projects & Code'
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'role' | 'department' | 'experience' | 'learningStyle' | null

  const { register } = useAuth();
  const navigate = useNavigate();

  // Ensure right-side scrollbar is hidden and background is anchored to theme dark green
  useEffect(() => {
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    const originalBodyBg = document.body.style.backgroundColor;
    const originalOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.backgroundColor = '#021c14';
    document.body.style.backgroundColor = '#021c14';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';

    document.documentElement.classList.add('hide-scrollbar');
    document.body.classList.add('hide-scrollbar');

    return () => {
      document.documentElement.style.backgroundColor = originalHtmlBg;
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.overscrollBehavior = originalOverscroll;
      document.body.style.overscrollBehavior = originalOverscroll;

      document.documentElement.classList.remove('hide-scrollbar');
      document.body.classList.remove('hide-scrollbar');
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.signup-custom-dropdown-wrap')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setOpenDropdown(null);
    if (type === 'admin') {
      setFormData((prev) => ({
        ...prev,
        role: 'HR Administrator',
        department: 'People & HR',
        experience: 'Senior (5+ yrs)',
        skills: 'HR Operations, People Management, Compliance, Policy',
        preferredLearningStyle: 'Reading Documentation & Guides'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        role: 'Software Developer',
        department: 'Engineering',
        experience: 'Fresher / Graduate',
        skills: 'JavaScript, React, Node.js, Git',
        preferredLearningStyle: 'Hands-on Projects & Code'
      }));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectOption = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setOpenDropdown(null);
  };

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const userData = await register({
        ...formData,
        name: formData.name.trim(),
        email: cleanEmail,
        password: cleanPassword,
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

  // Modern Dropdown Options
  const roleOptions =
    userType === 'admin'
      ? [
          'HR Administrator',
          'People Operations Lead',
          'IT & Security Administrator',
          'Compliance Officer',
          'Executive Director'
        ]
      : [
          'Software Developer',
          'Product Manager',
          'UI/UX Designer',
          'Data Scientist',
          'Marketing Specialist',
          'Sales Executive',
          'HR Specialist',
          'Financial Analyst'
        ];

  const departmentOptions = [
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'People & HR',
    'Finance',
    'Operations'
  ];

  const experienceOptions = [
    'Fresher / Graduate',
    'Junior (1-2 yrs)',
    'Mid-Level (3-5 yrs)',
    'Senior (5+ yrs)',
    'Lead / Executive'
  ];

  const learningStyleOptions = [
    'Hands-on Projects & Code',
    'Visual & Interactive Diagrams',
    'Reading Documentation & Guides',
    'Video Walkthroughs & Demos',
    'Audio / Conversational AI'
  ];

  return (
    <div
      className="exact-signup-page"
      style={{
        backgroundColor: '#021c14',
        backgroundImage: `linear-gradient(135deg, rgba(2, 28, 20, 0.94) 0%, rgba(2, 36, 26, 0.88) 42%, rgba(3, 44, 32, 0.72) 100%), url(${officeHeroImg})`
      }}
    >
      {/* Background radial ambient glow */}
      <div className="login-ambient-sweep" />

      {/* TOP NAVIGATION BAR */}
      <header className="exact-signup-topbar">
        <SproutLogo size={36} variant="white" />
        <div className="exact-signup-top-nav">
          <span className="exact-signup-already-text">Already have an account?</span>
          <Link to="/login" className="exact-signup-signin-pill">
            <span>Sign In</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT GRID (HERO LEFT + SIGNUP FORM RIGHT) */}
      <div className="exact-signup-main-container">
        {/* LEFT COLUMN: HERO VALUE PROPOSITION */}
        <div className="exact-hero-panel exact-signup-hero-panel">
          {/* Main Hero Body: Vertically centered on the left side, exactly like login page */}
          <div className="exact-hero-body exact-signup-hero-body">
            {/* Tracking Header */}
            <div className="exact-signup-tracking">
              <span className="exact-pill-line" />
              <span>BUILD &nbsp; LEARN &nbsp; GROW &nbsp; BELONG</span>
            </div>

            {/* Big Headline with Handwriting Motion on "Starts Here." */}
            <h1 className="exact-hero-headline exact-signup-headline">
              <span className="exact-headline-line">Your Journey</span>
              <br />
              <span className="handwriting-wrap exact-spatial-word">
                <span className="exact-signup-accent-word">Starts Here.</span>
                <span className="handwriting-pen pen-starts-here" aria-hidden="true" />
              </span>
            </h1>

            {/* Subtitle Paragraph */}
            <p className="exact-hero-subtext exact-signup-subtext">
              Join a workplace where people, technology and opportunities come together. Create
              your account and experience an AI-powered onboarding journey designed for your growth.
            </p>

            {/* 4 Feature Items */}
            <div className="exact-features-list exact-signup-features-list">
              <div className="exact-feature-item">
                <div className="exact-feature-icon-wrap">
                  <User size={18} color="#00E599" />
                </div>
                <div className="exact-feature-text">
                  <div className="exact-feature-title">Personalized Onboarding</div>
                  <div className="exact-feature-desc">Tailored to your role and goals</div>
                </div>
              </div>

              <div className="exact-feature-item">
                <div className="exact-feature-icon-wrap">
                  <BookOpen size={18} color="#00E599" />
                </div>
                <div className="exact-feature-text">
                  <div className="exact-feature-title">Learn &amp; Grow</div>
                  <div className="exact-feature-desc">Access curated learning paths</div>
                </div>
              </div>

              <div className="exact-feature-item">
                <div className="exact-feature-icon-wrap">
                  <Sparkles size={18} color="#00E599" />
                </div>
                <div className="exact-feature-text">
                  <div className="exact-feature-title">Get Instant Support</div>
                  <div className="exact-feature-desc">AI answers from company knowledge</div>
                </div>
              </div>

              <div className="exact-feature-item">
                <div className="exact-feature-icon-wrap">
                  <Users size={18} color="#00E599" />
                </div>
                <div className="exact-feature-text">
                  <div className="exact-feature-title">Be Part of Something Bigger</div>
                  <div className="exact-feature-desc">Build, collaborate and make an impact</div>
                </div>
              </div>
            </div>

            {/* Testimonial Quote Box */}
            <div className="exact-quote-card exact-signup-quote-card">
              <div className="exact-quote-mark">“</div>
              <div className="exact-quote-content">
                <p className="exact-quote-text">
                  Great teams build <span className="exact-quote-cursive">greater tomorrows.</span>
                </p>
                <span className="exact-quote-author">— ONBOARDIQ</span>
              </div>
            </div>
          </div>

          {/* Bottom Indicators & Metrics Footer - Positioned at bottom of left panel like Login page */}
          <div className="exact-hero-footer exact-signup-footer">
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

        {/* RIGHT COLUMN: NEW MODEL WHITE SIGNUP CARD */}
        <div className="exact-signup-card">
          {/* Card Header with Modern Pill Badge */}
          <div className="signup-card-header">
            <div className="signup-pill-badge">
              <Sparkles size={12} />
              <span>Enterprise Registration</span>
            </div>
            <h2 className="signup-card-title">Create Your OnboardIQ Account</h2>
            <p className="signup-card-subtitle">
              Enterprise AI-Driven Employee Onboarding &amp; Compliance Management
            </p>
          </div>

          {/* Account Type Selector (New Model Cards) */}
          <div className="signup-account-selector">
            <div
              className={`signup-type-card ${userType === 'employee' ? 'active' : ''}`}
              onClick={() => handleUserTypeChange('employee')}
              role="button"
              tabIndex={0}
            >
              <div className="signup-type-icon employee">
                <User size={18} />
              </div>
              <div className="signup-type-content">
                <div className="signup-type-title">Employee Account</div>
                <div className="signup-type-desc">Join as a new team member with autonomous AI onboarding.</div>
              </div>
              {userType === 'employee' && (
                <div className="signup-type-check-badge">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>

            <div
              className={`signup-type-card ${userType === 'admin' ? 'active' : ''}`}
              onClick={() => handleUserTypeChange('admin')}
              role="button"
              tabIndex={0}
            >
              <div className="signup-type-icon admin">
                <Shield size={18} />
              </div>
              <div className="signup-type-content">
                <div className="signup-type-title">Administrator Account</div>
                <div className="signup-type-desc">Manage organization onboarding, analytics and policy health.</div>
              </div>
              {userType === 'admin' && (
                <div className="signup-type-check-badge">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="signup-notice-banner error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form with New Model Inputs & Floating Dropdowns */}
          <form onSubmit={handleSubmit}>
            <div className="signup-form-grid">
              {/* Row 1: Full Name & Corporate Email */}
              <div className="signup-field-group">
                <label className="signup-input-label">Full Name</label>
                <div className="signup-input-wrap">
                  <User size={16} className="signup-input-icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="signup-field-input"
                    required
                  />
                </div>
              </div>

              <div className="signup-field-group">
                <label className="signup-input-label">Corporate Email Address</label>
                <div className="signup-input-wrap">
                  <Mail size={16} className="signup-input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="john.doe@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="signup-field-input"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Password & Confirm Password */}
              <div className="signup-field-group">
                <label className="signup-input-label">Password</label>
                <div className="signup-input-wrap">
                  <Lock size={16} className="signup-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="signup-field-input"
                    required
                  />
                  <button
                    type="button"
                    className="signup-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="signup-field-group">
                <label className="signup-input-label">Confirm Password</label>
                <div className="signup-input-wrap">
                  <Lock size={16} className="signup-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="signup-field-input"
                    required
                  />
                  <button
                    type="button"
                    className="signup-eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Row 3: Role & Department (Custom Floating Dropdowns) */}
              <ModernSelect
                label={userType === 'admin' ? 'Administrator Role' : 'Employee Role'}
                value={formData.role}
                options={roleOptions}
                name="role"
                icon={Briefcase}
                isOpen={openDropdown === 'role'}
                onToggle={() => toggleDropdown('role')}
                onSelect={handleSelectOption}
              />

              <ModernSelect
                label="Department"
                value={formData.department}
                options={departmentOptions}
                name="department"
                icon={Network}
                isOpen={openDropdown === 'department'}
                onToggle={() => toggleDropdown('department')}
                onSelect={handleSelectOption}
              />

              {/* Row 4: Experience Level & Preferred Learning Style (Custom Floating Dropdowns) */}
              <ModernSelect
                label="Experience Level"
                value={formData.experience}
                options={experienceOptions}
                name="experience"
                icon={BarChart2}
                isOpen={openDropdown === 'experience'}
                onToggle={() => toggleDropdown('experience')}
                onSelect={handleSelectOption}
              />

              <ModernSelect
                label="Preferred Learning Style"
                value={formData.preferredLearningStyle}
                options={learningStyleOptions}
                name="preferredLearningStyle"
                icon={BookOpen}
                isOpen={openDropdown === 'preferredLearningStyle'}
                onToggle={() => toggleDropdown('preferredLearningStyle')}
                onSelect={handleSelectOption}
              />

              {/* Row 5: Primary Skills (Full Width) */}
              <div className="signup-field-group signup-field-span-2">
                <label className="signup-input-label">Primary Skills (comma-separated)</label>
                <div className="signup-input-wrap">
                  <Code2 size={16} className="signup-input-icon" />
                  <input
                    type="text"
                    name="skills"
                    placeholder="JavaScript, React, Node.js, Git"
                    value={formData.skills}
                    onChange={handleChange}
                    className="signup-field-input"
                  />
                </div>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="signup-agreement-row">
              <label className="signup-checkbox-label">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="signup-real-checkbox"
                />
                <span className="signup-checkbox-custom">
                  {agreedToTerms && <Check size={12} strokeWidth={3} />}
                </span>
                <span>
                  I agree to the{' '}
                  <a href="#terms" className="signup-green-link" onClick={(e) => e.preventDefault()}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" className="signup-green-link" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* New Model Primary Submit Button */}
            <button
              type="submit"
              className="signup-submit-button"
              disabled={loading}
            >
              {loading ? (
                <span className="exact-spinner" />
              ) : (
                <>
                  <span>Create {userType === 'admin' ? 'Administrator' : 'Employee'} Account &amp; Start</span>
                  <ArrowRight size={17} className="submit-arrow" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Signup;
