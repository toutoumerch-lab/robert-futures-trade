const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'AdminDashboard.jsx');

// Read the file as a buffer to work with raw bytes
let content = fs.readFileSync(filePath, 'latin1'); // read as binary to preserve bytes

// The file was saved with correct UTF-8 bytes but the editor's view showed them as mojibake.
// What we need to do is read the raw bytes and re-interpret them properly.

// Actually, let's read as UTF-8 first and see what we get
let utf8Content = fs.readFileSync(filePath, 'utf8');

// The corrupted sequences are the UTF-8 multi-byte sequences (4 bytes) for emoji
// being displayed as if each byte was a Latin-1 character. This means the file
// IS saved as UTF-8 with proper emoji bytes.
// 
// So the file is ACTUALLY correctly UTF-8 encoded - the issue is just that
// some IDEs/editors are showing the corruption incorrectly.
//
// Let's verify by checking what characters are at the TABS area

const lines = utf8Content.split('\n');
for (let i = 1468; i < 1480; i++) {
  const line = lines[i];
  if (line) {
    // Print with char codes for the first 60 chars
    console.log(`Line ${i+1}: ${line.substring(0, 80)}`);
    // Check for any characters above ASCII 127
    for (let j = 0; j < Math.min(line.length, 80); j++) {
      const code = line.charCodeAt(j);
      if (code > 127) {
        process.stdout.write(`  [pos ${j}] charCode: ${code} (0x${code.toString(16)}) char: ${line[j]}\n`);
      }
    }
  }
}
