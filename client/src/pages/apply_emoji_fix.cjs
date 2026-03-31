const fs = require('fs');

const filePath = 'AdminDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Strategy: Find and replace the TABS array block entirely.
// We'll locate the block by searching for the identifiable ASCII parts.

const tabsStart = content.indexOf("const TABS = [");
if (tabsStart < 0) {
    process.stdout.write('ERROR: Could not find TABS array!\n');
    process.exit(1);
}

const tabsEnd = content.indexOf("];", tabsStart) + 2;
const oldTabs = content.substring(tabsStart, tabsEnd);

process.stdout.write('Found TABS block from index ' + tabsStart + ' to ' + tabsEnd + '\n');
process.stdout.write('Old block length: ' + oldTabs.length + '\n');

// The new TABS block with correct Unicode emoji
// Using Unicode escape sequences to ensure they are stored correctly
const newTabs = `const TABS = [
  { id: 'users',      label: '\u{1F465} Users' },
  { id: 'posts',      label: '\u{1F4DD} Blog Posts' },
  { id: 'courses',    label: '\u{1F393} Courses' },
  { id: 'prop-firms', label: '\u{1F4BC} Prop Firms' },
  { id: 'promos',     label: '\u{1F389} Promotions' },
  { id: 'branding',   label: '\u{1F3A8} Branding' },
];`;

// Replace the old block with the new one
const fixedContent = content.substring(0, tabsStart) + newTabs + content.substring(tabsEnd);

// Also fix the layout toggle button (line with 'Vertical Layout' / 'Horizontal Layout')
// Find the broken text around ðŸ"± Vertical Layout and ðŸ'» Horizontal Layout
// We need to find it by surrounding text
const vertLayoutIdx = fixedContent.indexOf("Vertical Layout'");
const horizLayoutIdx = fixedContent.indexOf("Horizontal Layout'");
if (vertLayoutIdx < 0 || horizLayoutIdx < 0) {
    process.stdout.write('Warning: Could not find layout toggle text\n');
    process.stdout.write('vertLayoutIdx=' + vertLayoutIdx + ' horizLayoutIdx=' + horizLayoutIdx + '\n');
}

// The pattern is: ? 'xxx Layout' : '??? Horizontal Layout'}
// Let's find by searching for unique surrounding text
const layoutLineIdx = fixedContent.indexOf("? '");
process.stdout.write('Looking for layout toggle...\n');

// Search for the layout buttons more specifically
const layoutSearchStr = "layout === 'horizontal' ? '";
const layoutMatchIdx = fixedContent.indexOf(layoutSearchStr);
if (layoutMatchIdx >= 0) {
    // Find the end of the ternary expression
    const afterSearch = layoutMatchIdx + layoutSearchStr.length;
    // Find next } at end  
    const singleQuoteEnd = fixedContent.indexOf("'}", afterSearch + 5);
    process.stdout.write('Found layout toggle at ' + layoutMatchIdx + '\n');
    
    // Replace the whole ternary
    const toFind = fixedContent.substring(layoutMatchIdx, singleQuoteEnd + 2);
    process.stdout.write('Layout toggle text: ' + toFind.length + ' chars\n');
    
    const fixedLayout = `layout === 'horizontal' ? '\u{1F4F1} Vertical Layout' : '\u{1F4BB} Horizontal Layout'}`;
    const finalContent = fixedContent.substring(0, layoutMatchIdx) + fixedLayout + fixedContent.substring(singleQuoteEnd + 2);
    
    fs.writeFileSync(filePath, finalContent, 'utf8');
    process.stdout.write('SUCCESS: Fixed TABS and layout toggle, saved file.\n');
} else {
    // Just save with fixed TABS at least
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    process.stdout.write('SUCCESS: Fixed TABS array (layout toggle not found, may need manual fix).\n');
}
