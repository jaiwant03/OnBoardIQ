import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'var(--accent-primary)', subtitle, waveColor }) => {
  const strokeColor = waveColor || color;

  return (
    <div className="stat-kpi-card">
      <div className="stat-top-row">
        {Icon && (
          <div className="stat-icon-wrap" style={{ background: `${color}18`, color: color }}>
            <Icon size={18} />
          </div>
        )}
        <span className="stat-title">{title}</span>
      </div>

      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-footer-text">{subtitle}</div>}

      {/* Decorative Wave Sparkline matching reference UI */}
      <div className="stat-wave-container">
        <svg viewBox="0 0 140 28" preserveAspectRatio="none" className="stat-wave-svg">
          <path
            d="M 0 18 C 20 24, 40 10, 70 16 C 100 22, 120 8, 140 14"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>
    </div>
  );
};

export default StatCard;
