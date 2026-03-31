const fs = require('fs');
const filePath = 'AdminDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// List all characters in a specific region to understand what's there
// Check the area around line 384 (the 📚 books emoji)
// We know it appears in: <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>???</div>

const marker = 'fontSize: \'4rem\', marginBottom: \'1.5rem\'';
const idx = content.indexOf(marker);
if (idx >= 0) {
    // Get the next 50 chars after the closing >
    const closeTag = content.indexOf('>', idx);
    const region = content.substring(closeTag + 1, closeTag + 20);
    
    let output = 'Region after close tag (char codes):\n';
    for (let i = 0; i < region.length; i++) {
        const cp = region.codePointAt(i);
        if (cp > 0xFFFF) {
            output += '[U+' + cp.toString(16) + ']';
            i++;
        } else if (cp > 127) {
            output += '[0x' + cp.toString(16) + '(' + cp + ')]';
        } else if (cp === 60) { // <
            output += '<';
            break; // stop at next tag
        } else {
            output += region[i];
        }
    }
    
    // Those char code points ARE the broken emoji in the string
    // Capture all high chars in that region
    const emojiChars = [];
    for (let i = closeTag + 1; i < idx + marker.length + 100; i++) {
        const cp = content.codePointAt(i);
        if (cp > 0x7F && content[i] !== '<') {
            emojiChars.push(content[i]);
        } else if (cp === 60) { // <
            break;
        }
    }
    
    const brokenEmoji = emojiChars.join('');
    output += '\nBroken emoji string: ' + JSON.stringify(brokenEmoji);
    output += '\nCode points: ' + Array.from(brokenEmoji).map(c => '0x' + c.codePointAt(0).toString(16)).join(', ');
    
    fs.writeFileSync('emoji_chars.txt', output, 'ascii');
    process.stdout.write('Written to emoji_chars.txt\n');
} else {
    process.stdout.write('Marker not found!\n');
}
