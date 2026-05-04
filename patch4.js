const fs = require('fs');

let content = fs.readFileSync('client/src/pages/PropFirmList.jsx', 'utf8');

const lines = content.split('\\n');

const keep = [];
let i = 0;
while (i < lines.length) {
  // Activation Fee
  if (i >= 405 && i <= 417) { i++; continue; }
  // Discount
  if (i >= 441 && i <= 453) { i++; continue; }
  // Eval Type (we will move it)
  if (i >= 471 && i <= 479) { i++; continue; }
  // Daily Loss Limit
  if (i >= 501 && i <= 509) { i++; continue; }
  // Buffer Support
  if (i >= 521 && i <= 535) { i++; continue; }
  // Payout Header
  if (i >= 537 && i <= 538) { i++; continue; }
  // Max Withdrawal to Max Accounts
  if (i >= 551 && i <= 579) { i++; continue; }
  // Trading features old block
  if (i >= 581 && i <= 604) { i++; continue; }

  keep.push(lines[i]);
  i++;
}

let newContent = keep.join('\\n');

const evalTypeBlock = 
  '              {/* Eval */}\\n' +
  '              <tr className="cmp-row">\\n' +
  '                <td className="pf-compare-label"><ClipboardList size={14} /> Eval Type</td>\\n' +
  '                {firms.map(f => (\\n' +
  '                  <td key={f.id} style={{ textAlign: \\'center\\', fontWeight: 700 }}>\\n' +
  '                    {f.eval || <span style={{ color: \\'var(--text-secondary)\\' }}>N/A</span>}\\n' +
  '                  </td>\\n' +
  '                ))}\\n' +
  '              </tr>';

newContent = newContent.replace(
  '<SectionRow icon={<Settings size={14} />} title="Trading Rules & Metrics" />',
  '<SectionRow icon={<Settings size={14} />} title="Trading Rules & Metrics" />\\n' + evalTypeBlock
);

const featuresBlock = 
  '              {/* Trading Features (Condensed) */}\\n' +
  '              <tr className="cmp-row">\\n' +
  '                <td className="pf-compare-label"><Wrench size={14} /> Allowed Features</td>\\n' +
  '                {firms.map(f => {\\n' +
  '                  const allowed = [\\n' +
  '                    f.copy_trade && \\'Copy Trade\\',\\n' +
  '                    f.news && \\'News\\',\\n' +
  '                    f.bots && \\'Bots\\',\\n' +
  '                    f.vpn && \\'VPN\\'\\n' +
  '                  ].filter(Boolean);\\n' +
  '                  return (\\n' +
  '                    <td key={f.id} style={{ textAlign: \\'center\\', fontSize: \\'0.75rem\\', color: \\'var(--text-secondary)\\', lineHeight: 1.4, paddingBottom: \\'1.5rem\\' }}>\\n' +
  '                      {allowed.length > 0 ? (\\n' +
  '                        <div style={{ display: \\'flex\\', flexWrap: \\'wrap\\', gap: \\'4px\\', justifyContent: \\'center\\' }}>\\n' +
  '                          {allowed.map(a => (\\n' +
  '                            <span key={a} style={{ background: \\'var(--bg-primary)\\', padding: \\'2px 6px\\', borderRadius: \\'4px\\', border: \\'1px solid var(--border-color)\\', whiteSpace: \\'nowrap\\' }}>{a}</span>\\n' +
  '                          ))}\\n' +
  '                        </div>\\n' +
  '                      ) : \\'None\\'}\\n' +
  '                    </td>\\n' +
  '                  );\\n' +
  '                })}\\n' +
  '              </tr>';

newContent = newContent.replace(
  '            </tbody>',
  featuresBlock + '\\n            </tbody>'
);

fs.writeFileSync('client/src/pages/PropFirmList.jsx', newContent);
console.log('Line-based patch complete.');
