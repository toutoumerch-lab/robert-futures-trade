const fs = require('fs');

const content = fs.readFileSync('client/src/pages/PropFirmList.jsx', 'utf8');
const newBody = fs.readFileSync('new_tbody.txt', 'utf8');

const lines = content.split('\n');

const newLines = [];
let skip = false;
let foundTbody = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (!foundTbody && line.includes('<tbody>') && i > 300 && i < 500) {
    newLines.push(newBody);
    skip = true;
    foundTbody = true;
    continue;
  }

  if (skip) {
    if (line.includes('</tbody>')) {
      skip = false;
    }
    continue;
  }

  newLines.push(line);
}

fs.writeFileSync('client/src/pages/PropFirmList.jsx', newLines.join('\n'));
console.log('Patch complete!');
