const fs = require('fs');

const filePath = 'AdminDashboard.jsx';
const content = fs.readFileSync(filePath, 'utf8');

// Find the TABS block and print exact char codes for each label char
const tabsIdx = content.indexOf('const TABS');
const tabsEnd = content.indexOf('];', tabsIdx) + 2;
const tabsBlock = content.substring(tabsIdx, tabsEnd);

// Print each character in the block as its code point
let charCodesOutput = '';
for (let i = 0; i < tabsBlock.length; i++) {
    const cp = tabsBlock.codePointAt(i);
    if (cp > 0xFFFF) {
        charCodesOutput += '[U+' + cp.toString(16).toUpperCase() + ']';
        i++; // surrogate pair
    } else if (cp > 127) {
        charCodesOutput += '[' + cp.toString(16).toUpperCase() + ']';
    } else if (cp === 39) {
        charCodesOutput += "'";
    } else if (cp === 10) {
        charCodesOutput += '\n';
    } else if (cp === 13) {
        charCodesOutput += '';
    } else {
        charCodesOutput += tabsBlock[i];
    }
}

fs.writeFileSync('tabs_chars.txt', charCodesOutput, 'ascii');
process.stdout.write('Done. Check tabs_chars.txt\n');
