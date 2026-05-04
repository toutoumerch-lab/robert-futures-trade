const fs = require('fs');
let content = fs.readFileSync('client/src/pages/PropFirmList.jsx', 'utf8');

const rowsToRemove = ['Activation Fee', 'Discount', 'Daily Loss Limit', 'Buffer', 'Max Withdrawal', 'Days to Pass', 'Max Accounts'];
rowsToRemove.forEach(rowName => {
  const regex = new RegExp('\\\\s*\\\\{\\\\/\\\\*\\\\s*' + rowName + '\\\\s*\\\\*\\\\/\\\\}\\\\s*<tr className=\"cmp-row\">[\\\\s\\\\S]*?<\\\\/tr>', 'g');
  const count = (content.match(regex) || []).length;
  console.log(rowName + ' matched: ' + count);
  content = content.replace(regex, '');
});

fs.writeFileSync('client/src/pages/PropFirmList.jsx', content);
