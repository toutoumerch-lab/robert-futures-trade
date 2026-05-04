const fs = require('fs');

let content = fs.readFileSync('client/src/pages/PropFirmList.jsx', 'utf8');

const lines = content.split('\\n');

// The lines we want to KEEP
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

// Insert Eval Type right after Promo Code (which is before Trading Rules)
// Wait, Promo Code ends with </tr> at line 467. Then SectionRow for Trading Rules is line 469.
// So let's insert it right after the Trading Rules section row.
const evalTypeBlock = \`
              {/* Eval */}
              <tr className="cmp-row">
                <td className="pf-compare-label"><ClipboardList size={14} /> Eval Type</td>
                {firms.map(f => (
                  <td key={f.id} style={{ textAlign: 'center', fontWeight: 700 }}>
                    {f.eval || <span style={{ color: 'var(--text-secondary)' }}>N/A</span>}
                  </td>
                ))}
              </tr>\`;

newContent = newContent.replace(
  '<SectionRow icon={<Settings size={14} />} title="Trading Rules & Metrics" />',
  '<SectionRow icon={<Settings size={14} />} title="Trading Rules & Metrics" />\\n' + evalTypeBlock
);

// Insert Condensed features right before </tbody>
const featuresBlock = \`
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
              </tr>\`;

newContent = newContent.replace(
  '            </tbody>',
  featuresBlock + '\\n            </tbody>'
);

fs.writeFileSync('client/src/pages/PropFirmList.jsx', newContent);
console.log('Line-based patch complete.');
