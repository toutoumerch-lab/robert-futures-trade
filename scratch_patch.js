const fs = require('fs');
let content = fs.readFileSync('client/src/pages/PropFirmList.jsx', 'utf8');

// 1. Fix tracking
content = content.replace(
  'const CompareModal = ({ firms: initialFirms, onClose, onRemoveFirm }) => {',
  'const CompareModal = ({ firms: initialFirms, onClose, onRemoveFirm, onTrackWebsite }) => {'
);
content = content.replace(
  '<a key={f.id} href={f.website} target="_blank" rel="noreferrer" style={{',
  '<a key={f.id} href={f.website} target="_blank" rel="noreferrer" onClick={() => onTrackWebsite?.(f.id)} style={{'
);
content = content.replace(
  'const FirmGridCard = ({ firm, onClick, isComparing, onToggleCompare, isFav, onToggleFav, compareDisabled }) => (',
  'const FirmGridCard = ({ firm, onClick, isComparing, onToggleCompare, isFav, onToggleFav, compareDisabled, onTrackWebsite }) => ('
);
content = content.replace(
  'const FirmListRow = ({ firm, onClick, isComparing, onToggleCompare, isFav, onToggleFav, compareDisabled }) => (',
  'const FirmListRow = ({ firm, onClick, isComparing, onToggleCompare, isFav, onToggleFav, compareDisabled, onTrackWebsite }) => ('
);
content = content.replace(
  `{showCompare && <CompareModal firms={compareFirms} onClose={() => setShowCompare(false)} onRemoveFirm={(id) => setCompareIds(prev => prev.filter(x => x !== id))} />}`,
  `{showCompare && <CompareModal firms={compareFirms} onClose={() => setShowCompare(false)} onRemoveFirm={(id) => setCompareIds(prev => prev.filter(x => x !== id))} onTrackWebsite={(id) => trackClick(id, 'website')} />}`
);
content = content.replace(
  `{viewingFirm.website && (\n                    <a href={viewingFirm.website} target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '99px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 25px -5px rgba(59,130,246,0.4)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>\n                      Visit Official Site <ExternalLink size={15} />\n                    </a>\n                  )}`,
  `{viewingFirm.website && (\n                    <a href={viewingFirm.website} target="_blank" rel="noreferrer" onClick={() => trackClick(viewingFirm.id, 'website')} style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '99px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 25px -5px rgba(59,130,246,0.4)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>\n                      Visit Official Site <ExternalLink size={15} />\n                    </a>\n                  )}`
);

// 2. Remove rows
const rowsToRemove = [
  'Activation Fee',
  'Discount',
  'Daily Loss Limit',
  'Buffer',
  'Max Withdrawal',
  'Days to Pass',
  'Max Accounts'
];

rowsToRemove.forEach(rowName => {
  const regex = new RegExp(`\\\\s*\\\\{\\\\/\\\\* \\\\b` + rowName + `\\\\b \\\\*\\\\/\\\\}\\\\s*<tr className="cmp-row">[\\\\s\\\\S]*?<\\\\/tr>`, 'g');
  content = content.replace(regex, '');
});

// Remove Payout section header
content = content.replace(/\s*\{\/\* â══•  PAYOUT SECTION â══•  \*\/\}\s*<SectionRow icon=\{\<Timer size=\{14\} \/\>\} title="Payout & Accounts" \/>/g, '');

// 3. Replace Trading Features section
const oldFeaturesRegex = /\s*\{\/\* â══•  TRADING FEATURES SECTION â══•  \*\/\}[\s\S]*?\}\)\)\s*\}\)\}/g;

const newFeatures = `
              {/* Trading Features (Condensed) */}
              <tr className="cmp-row">
                <td className="pf-compare-label"><Wrench size={14} /> Allowed Features</td>
                {firms.map(f => {
                  const allowed = [
                    f.copy_trade && 'Copy Trade',
                    f.news && 'News',
                    f.bots && 'Bots',
                    f.vpn && 'VPN'
                  ].filter(Boolean);
                  return (
                    <td key={f.id} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, paddingBottom: '1.5rem' }}>
                      {allowed.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                          {allowed.map(a => (
                            <span key={a} style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{a}</span>
                          ))}
                        </div>
                      ) : 'None'}
                    </td>
                  );
                })}
              </tr>`;

content = content.replace(oldFeaturesRegex, newFeatures);

// 4. Move Eval Type under Promo Code
const evalRegex = /\s*\{\/\* Eval \*\/\}\s*<tr className="cmp-row">[\s\S]*?<\/tr>/g;
const evalMatch = content.match(evalRegex);
if(evalMatch) {
  content = content.replace(evalRegex, '');
  content = content.replace(
    '<SectionRow icon={<Settings size={14} />} title="Trading Rules & Metrics" />',
    '<SectionRow icon={<Settings size={14} />} title="Trading Rules & Metrics" />\n' + evalMatch[0]
  );
}

fs.writeFileSync('client/src/pages/PropFirmList.jsx', content);
console.log('Patch complete!');
