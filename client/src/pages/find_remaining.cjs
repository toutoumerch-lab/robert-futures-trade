const fs = require('fs');
const filePath = 'AdminDashboard.jsx';
const rawBytes = fs.readFileSync(filePath);

// Find ALL C3 B0 patterns and print full sequences
let pos = 0;
const found = [];
while (pos < rawBytes.length) {
    if (rawBytes[pos] === 0xC3 && rawBytes[pos+1] === 0xB0) {
        // Read the full sequence
        let seq = [0xC3, 0xB0];
        let j = pos + 2;
        while (j < rawBytes.length && rawBytes[j] >= 0x80) {
            seq.push(rawBytes[j]);
            j++;
        }
        // Get context: what's around it
        const ctxStart = Math.max(0, pos - 30);
        const ctxBytes = rawBytes.slice(ctxStart, pos).toString('ascii').replace(/[^\x20-\x7E]/g, '?');
        found.push({ pos, seq: seq.slice(0,12), ctx: ctxBytes });
        pos = j;
    } else {
        pos++;
    }
}

let output = 'Found ' + found.length + ' patterns:\n\n';
for (const {pos, seq, ctx} of found) {
    const hexSeq = seq.map(b => b.toString(16).padStart(2,'0')).join(' ');
    output += 'pos=' + pos + ' seq=[' + hexSeq + '] ctx="' + ctx.slice(-25) + '"\n';
}

fs.writeFileSync('remaining_patterns.txt', output, 'ascii');
process.stdout.write('Done. Check remaining_patterns.txt\n');
