import React, { useState, useRef, useEffect } from 'react';

const MultiSelect = ({ options = [], value = [], onChange, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  // Filter existing options
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase()) && !value.includes(opt)
  );

  const exactMatchExists = options.some(o => o.toLowerCase() === search.toLowerCase());

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onChange([...value, item]);
    setSearch('');
  };

  const handleRemove = (item) => {
    onChange(value.filter(v => v !== item));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedSearch = search.trim();
      if (!trimmedSearch) return;

      const exactMatch = filteredOptions.find(opt => opt.toLowerCase() === trimmedSearch.toLowerCase());
      
      if (exactMatch) {
        handleSelect(exactMatch);
      } else if (!value.some(v => v.toLowerCase() === trimmedSearch.toLowerCase())) {
        handleSelect(trimmedSearch);
      }
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 50 : 1 }}>
      <div 
        className="input" 
        style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '42px', padding: '6px 10px', cursor: 'text', alignItems: 'center' }}
        onClick={() => setIsOpen(true)}
      >
        {value.map(item => (
          <span key={item} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            padding: '2px 8px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
            color: 'var(--text-primary)'
          }}>
            {item}
            <span 
              style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '10px', height: '10px' }} 
              onClick={(e) => { e.stopPropagation(); handleRemove(item); }}
              title="Remove"
            >
              ×
            </span>
          </span>
        ))}
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, minWidth: '100px', color: 'var(--text-primary)', fontSize: '14px' }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px',
          marginTop: '6px', maxHeight: '200px', overflowY: 'auto', zIndex: 100,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
        }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <div 
                key={opt}
                style={{ padding: '10px 14px', cursor: 'pointer', transition: 'background 0.2s', fontSize: '14px' }}
                onMouseEnter={e => e.target.style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </div>
            ))
          ) : (
            search.trim() === '' && <div style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '14px' }}>No remaining options</div>
          )}
          
          {search.trim() !== '' && !exactMatchExists && !value.some(v => v.toLowerCase() === search.trim().toLowerCase()) && (
            <div 
              style={{ padding: '10px 14px', cursor: 'pointer', color: '#10b981', fontWeight: 600, borderTop: filteredOptions.length > 0 ? '1px solid var(--border)' : 'none', fontSize: '14px' }}
              onMouseEnter={e => e.target.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
              onClick={() => handleSelect(search.trim())}
            >
              + Add new platform: "{search.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
