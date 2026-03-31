const fs = require('fs');

const filePath = 'AdminDashboard.jsx';

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Strategy: Replace every known mojibake sequence with the correct emoji.
// These mojibake strings are what you get when UTF-8 emoji bytes are decoded as Latin-1/Windows-1252.
// 
// For example, 👥 (U+1F465) has UTF-8 bytes: F0 9F 91 A5
// Decoded as Latin-1: ð Ÿ ' ¥ -> combined: ðŸ'¥
//
// We replace the Latin-1 decoded strings with proper Unicode characters.

const replacements = [
    // 👥 U+1F465 two people silhouette
    ['\u00F0\u009F\u0091\u00A5', '\uD83D\uDC65'],
    // 📝 U+1F4DD memo
    ['\u00F0\u009F\u0094\u009D', '\uD83D\uDCDD'],
    // 🎓 U+1F393 graduation cap
    ['\u00F0\u009F\u008E\u0093', '\uD83C\uDF93'],
    // 💼 U+1F4BC briefcase
    ['\u00F0\u009F\u0092\u00BC', '\uD83D\uDCBC'],
    // 🎉 U+1F389 party popper
    ['\u00F0\u009F\u008E\u0089', '\uD83C\uDF89'],
    // 🎨 U+1F3A8 artist palette
    ['\u00F0\u009F\u008E\u00A8', '\uD83C\uDFA8'],
    // 📱 U+1F4F1 mobile phone
    ['\u00F0\u009F\u0094\u00B1', '\uD83D\uDCF1'],
    // 💻 U+1F4BB laptop
    ['\u00F0\u009F\u0092\u00BB', '\uD83D\uDCBB'],
    // 📸 U+1F4F8 camera with flash
    ['\u00F0\u009F\u0094\u00B8', '\uD83D\uDCF8'],
    // 🎬 U+1F3AC clapper board
    ['\u00F0\u009F\u008E\u00AC', '\uD83C\uDFAC'],
    // 📄 U+1F4C4 page facing up
    ['\u00F0\u009F\u0094\u0084', '\uD83D\uDCC4'],
    // 📚 U+1F4DA books
    ['\u00F0\u009F\u0094\u009A', '\uD83D\uDCDA'],
    // 🏦 U+1F3E6 bank building (alternative for prop firms if that was intended)
    ['\u00F0\u009F\u008F\u00A6', '\uD83C\uDFE6'],
    // 🎁 U+1F381 gift (alternative for promotions if that was intended)
    ['\u00F0\u009F\u008E\u0081', '\uD83C\uDF81'],
];

let changed = 0;
for (const [broken, fixed] of replacements) {
    const before = content;
    content = content.split(broken).join(fixed);
    if (content !== before) {
        changed++;
        process.stdout.write('Replaced: ' + JSON.stringify(broken) + ' -> ' + fixed + '\n');
    }
}

if (changed > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    process.stdout.write('DONE: Fixed ' + changed + ' emoji sequences and saved file.\n');
} else {
    process.stdout.write('No changes made - attempting direct line replacement...\n');
    
    // Direct replacement approach - replace entire TABS block
    const brokenBlock = "const TABS = [\n  { id: 'users',      label: '\u00F0\u009F\u0091\u00A5 Users' },\n  { id: 'posts',      label: '\u00F0\u009F\u0094\u009D Blog Posts' },\n  { id: 'courses',    label: '\u00F0\u009F\u008E\u0093 Courses' },\n  { id: 'prop-firms', label: '\u00F0\u009F\u00A6\u009C Prop Firms' },\n  { id: 'promos',     label: '\u00F0\u009F\u008E\u0081 Promotions' },\n  { id: 'branding',   label: '\u00F0\u009F\u008E\u00A8 Branding' },\n];";
    
    const fixedBlock = "const TABS = [\n  { id: 'users',      label: '\uD83D\uDC65 Users' },\n  { id: 'posts',      label: '\uD83D\uDCDD Blog Posts' },\n  { id: 'courses',    label: '\uD83C\uDF93 Courses' },\n  { id: 'prop-firms', label: '\uD83D\uDCBC Prop Firms' },\n  { id: 'promos',     label: '\uD83C\uDF89 Promotions' },\n  { id: 'branding',   label: '\uD83C\uDFA8 Branding' },\n];";
    
    process.stdout.write('Trying direct block replacement...\n');
    
    // Show first 200 chars of actual content at that region to debug
    const idx = content.indexOf("const TABS");
    if (idx >= 0) {
        process.stdout.write('Found TABS at index ' + idx + '\n');
        const region = content.substring(idx, idx + 300);
        for (let i = 0; i < region.length; i++) {
            const cp = region.codePointAt(i);
            if (cp > 127) {
                process.stdout.write('[U+' + cp.toString(16) + ']');
                if (cp > 0xFFFF) i++; // skip surrogate pair
            } else {
                process.stdout.write(region[i]);
            }
        }
        process.stdout.write('\n');
    }
}
