import React from 'react';

const LoadingSkeleton = ({ height = '120px', width = '100%', borderRadius = 'var(--radius-lg)' }) => {
  return (
    <div
      style={{
        height,
        width,
        borderRadius,
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s infinite',
        border: '1px solid var(--border-subtle)'
      }}
    />
  );
};

export default LoadingSkeleton;
