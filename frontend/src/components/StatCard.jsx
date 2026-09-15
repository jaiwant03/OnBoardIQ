import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'var(--accent-primary)', subtitle }) => {
  return (
    <div className="stat-kpi-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className="stat-icon-wrap" style={{ background: `${color}20`, color: color }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-footer-text">{subtitle}</div>}
    </div>
  );
};

export default StatCard;
