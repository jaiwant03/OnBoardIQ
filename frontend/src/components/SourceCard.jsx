import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

const SourceCard = ({ source }) => {
  const [expanded, setExpanded] = useState(false);

  if (!source) return null;

  const confidenceColor =
    source.confidence === 'High'
      ? 'var(--success)'
      : source.confidence === 'Medium'
      ? 'var(--warning)'
      : 'var(--danger)';

  return (
    <div className="source-card-widget">
      <div className="source-card-header">
        <div className="source-card-docname">
          <FileText size={14} color="var(--accent-primary)" />
          <span>{source.document || 'Company Document'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className="badge"
            style={{
              background: `${confidenceColor}20`,
              color: confidenceColor,
              borderColor: `${confidenceColor}40`,
              fontSize: '0.7rem',
              padding: '0.15rem 0.5rem'
            }}
          >
            <ShieldCheck size={11} />
            {source.confidence || 'Verified'}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <div className="source-card-section">
        Section: <strong>{source.section || 'General'}</strong>
      </div>

      {source.snippet && (
        <div className="source-card-snippet">
          "{expanded ? source.snippet : `${source.snippet.slice(0, 140)}...`}"
        </div>
      )}
    </div>
  );
};

export default SourceCard;
