const fs = require('fs');

const filePath = 'AdminDashboard.jsx';

const utf8 = fs.readFileSync(filePath, 'utf8');

const lines = utf8.split('\n');
for (let i = 1469; i <= 1478; i++) {
    const line = lines[i] || '';
    // write each char code
    let codes = '';
    for (let j = 0; j < Math.min(line.length, 50); j++) {
        const cp = line.codePointAt(j);
        if (cp > 127) codes += `[U+${cp.toString(16).toUpperCase()}]`;
        else codes += line[j];
    }
    process.stdout.write('L' + (i+1) + ': ' + codes + '\n');
}
