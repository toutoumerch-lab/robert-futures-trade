const fs = require('fs');
const file = 'src/pages/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// The literal regex to match the end of the admin-tabs loop
const regex = /\}\)\}\r?\n\s+<\/div>\r?\n\s+<\/div>\r?\n\r?\n\s+<div className="admin-workspace flex-1">/;
const replacement = `})}\n              <button\n                className="admin-tab"\n                onClick={() => navigate('/admin/revenue')}\n                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}\n              >\n                <DollarSign size={18} style={{ color: '#10b981' }} /> Revenue\n              </button>\n            </div>\n          </div>\n\n          <div className="admin-workspace flex-1">`;

if(regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Patched sidebar successfully");
} else {
    console.log("Could not find regex target for sidebar.");
}
