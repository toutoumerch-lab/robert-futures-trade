const fs = require('fs');
const file = 'src/pages/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\}\)\}\r?\n\s+<\/div>/;
const replacement = `})}\n            <Card style={{ textAlign: 'center', cursor: 'pointer', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }} onClick={() => navigate('/admin/revenue')}>\n                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'center' }}><DollarSign size={24} style={{ color: '#10b981' }} /></div>\n                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 800 }}>Revenue</div>\n            </Card>\n          </div>`;

if(regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Patched successfully");
} else {
    console.log("Could not find regex target.");
}
