const fs   = require('fs');
const path = require('path');

const file = path.join(__dirname, '../../client/src/pages/Home.jsx');
let txt = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// 1. Add youtubeWatchUrl + youtubeSubscribeUrl to useBranding destructure
txt = txt.replace(
  'const { siteLogo } = useBranding();',
  'const { siteLogo, youtubeWatchUrl, youtubeSubscribeUrl } = useBranding();'
);

// 2. Replace all occurrences of the hardcoded YouTube URL
//    First = Watch Live Now button, Second = Subscribe Free button
let count = 0;
txt = txt.replace(
  /href="https:\/\/www\.youtube\.com\/@RobertFuturesTrades"/g,
  () => {
    count++;
    return count === 1 ? 'href={youtubeWatchUrl}' : 'href={youtubeSubscribeUrl}';
  }
);

fs.writeFileSync(file, txt, 'utf8');
console.log(`Done. Replaced ${count} YouTube href(s) in Home.jsx`);
