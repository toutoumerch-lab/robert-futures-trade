import React from 'react';

const Toggle = ({ label, checked, onChange, tooltip }) => {
  return (
    <label 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        cursor: 'pointer',
        padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        transition: 'background 0.2s',
        gap: '1rem',
        userSelect: 'none',
        flex: 1,
        minWidth: '200px'
      }}
      title={tooltip}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    >
      <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {label}
      </span>
      
      <div 
        style={{
          position: 'relative',
          width: '40px',
          height: '24px',
          borderRadius: '12px',
          background: checked ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
          transition: 'background 0.3s ease',
          flexShrink: 0
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '18px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        />
      </div>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        style={{ display: 'none' }}
      />
    </label>
  );
};

export default Toggle;
