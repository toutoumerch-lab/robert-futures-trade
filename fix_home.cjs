const fs = require('fs');
const f = 'client/src/pages/Home.jsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Replace ✨ emoji with Sparkles component ref (text only)
c = c.replace('\u2728 Precision', '<Sparkles size={16} style={{ color: "var(--accent-primary)" }} /> Precision');

// 2. Add display:inline-flex to the hero badge div
c = c.replace(
  "fontSize: '0.9rem' }}>",
  "fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>"
);

// 3. Replace ⚖️ string with Scale component
c = c.replace(
  'icon="\u2696\uFE0F"',
  'icon={<Scale size={36} style={{ color: "var(--accent-primary)" }} />}'
);

// Also check for ⚖ without VS16
c = c.replace(
  'icon="\u2696"',
  'icon={<Scale size={36} style={{ color: "var(--accent-primary)" }} />}'
);

fs.writeFileSync(f, c, 'utf8');
console.log('Home.jsx updated successfully');
