const fs = require('fs');

const filePath = 'AdminDashboard.jsx';

// Read as binary/latin1 to get raw bytes
const raw = fs.readFileSync(filePath, 'latin1');

// Find the TABS section
const idx = raw.indexOf("const TABS");
if (idx < 0) {
    process.stdout.write('TABS not found!\n');
    process.exit(1);
}

// Print raw bytes of the region
const region = raw.substring(idx, idx + 400);
let output = 'RAW BYTES around TABS:\n';
for (let i = 0; i < region.length; i++) {
    const code = region.charCodeAt(i);
    if (code > 127) {
        output += '[0x' + code.toString(16).toUpperCase() + ']';
    } else if (code === 10) {
        output += '\\n\n';
    } else if (code === 13) {
        output += '\\r';
    } else {
        output += region[i];
    }
}

fs.writeFileSync('bytes_output.txt', output, 'ascii');
process.stdout.write('Done. Check bytes_output.txt\n');
