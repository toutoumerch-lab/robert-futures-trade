const fs = require('fs');

const filePath = 'c:/Users/noure/Documents/trades/client/src/pages/AdminDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix duration clock icon
content = content.replace(
  /gap: '4px' }}>.*? \{c\.duration \|\| 'N\/A'\}<\/span>/,
  `gap: '4px' }}><Clock size={12} /> {c.duration || 'N/A'}</span>`
);

// 2. Fix trash icon
content = content.replace(
  /title="Delete Course">.*?<\/button>/,
  `title="Delete Course"><Trash2 size={16} /></button>`
);

// 3. Fix checkmark icon for MP4
content = content.replace(
  /fontWeight: 600 }}>.*? Raw MP4 actively streaming from server.<\/div>/,
  `fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> Raw MP4 actively streaming from server.</div>`
);

// Add Clock to lucide-react imports if it's missing
if (!content.includes('Clock')) {
  content = content.replace(/ExternalLink\r?\n\} from 'lucide-react';/, "ExternalLink, Clock\n} from 'lucide-react';");
}


fs.writeFileSync(filePath, content, 'utf8');
console.log('Done fixing mojibakes using regex');
