const fs   = require('fs');
const path = require('path');

const file = path.join(__dirname, '../../client/src/pages/Home.jsx');
let txt = fs.readFileSync(file, 'utf8');

// Normalise to LF for easy manipulation, write back with original endings
const hasCRLF = txt.includes('\r\n');
txt = txt.replace(/\r\n/g, '\n');

// ── 1. Framer-motion import ──────────────────────────────────────────────────
txt = txt.replace(
  "import { motion } from 'framer-motion';",
  "import { motion, useInView, useAnimation } from 'framer-motion';"
);

// ── 2. Add helpers before AnimatedBlob ──────────────────────────────────────
const helpers = `
/* ── Animation variants ─────────────────────────────────── */
const vFadeLeft  = { hidden:{opacity:0,x:-70},  visible:{opacity:1,x:0,  transition:{duration:0.75,ease:[0.16,1,0.3,1]}} };
const vFadeRight = { hidden:{opacity:0,x:70},   visible:{opacity:1,x:0,  transition:{duration:0.75,ease:[0.16,1,0.3,1]}} };
const vFadeUp2   = { hidden:{opacity:0,y:60},   visible:{opacity:1,y:0,  transition:{duration:0.75,ease:[0.16,1,0.3,1]}} };
const vStagger   = { visible:{ transition:{ staggerChildren:0.13 }} };
const vPop       = { hidden:{opacity:0,scale:0.5,y:20}, visible:{opacity:1,scale:1,y:0,transition:{type:'spring',stiffness:300,damping:20}} };

/* ── Floating glow orb ──────────────────────────────────── */
const FloatOrb = ({ color, size='400px', style={} }) => (
  <motion.div
    animate={{ y:[0,-22,0], scale:[1,1.07,1] }}
    transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
    style={{ position:'absolute', width:size, height:size, borderRadius:'50%',
      background:\`radial-gradient(circle, \${color}, transparent 70%)\`,
      filter:'blur(60px)', pointerEvents:'none', zIndex:0, ...style }}
  />
);

/* ── Shimmer divider ────────────────────────────────────── */
const ShimmerDiv = () => (
  <div style={{ position:'relative', height:'1px', margin:'0 5%', overflow:'hidden' }}>
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }}/>
    <motion.div
      animate={{ x:['-100%','200%'] }}
      transition={{ duration:2.8, repeat:Infinity, ease:'linear', repeatDelay:1.5 }}
      style={{ position:'absolute', top:0, left:0, width:'35%', height:'100%',
        background:'linear-gradient(90deg,transparent,rgba(37,99,235,0.55),transparent)' }}
    />
  </div>
);

`;

txt = txt.replace('/* ── Animated background blob', helpers + '/* ── Animated background blob');

// ── 3. ShimmerDiv for dividers ───────────────────────────────────────────────
txt = txt.replace(
  /\{\/\* Divider \*\/\}\n\s*<div style=\{\{ height: '1px'[^\n]+\/>/g,
  '<ShimmerDiv />'
);

// ── Helper: wrap a Reveal block ──────────────────────────────────────────────
// replaces:  <Reveal direction="X" style={{ flex: '1 1 340px' }}>
// with:      <motion.div initial="hidden" whileInView... variants={vX}>
function wrapReveal(t, direction, extra='') {
  const attr = direction === 'left'  ? 'vFadeLeft'
             : direction === 'right' ? 'vFadeRight'
             : 'vFadeUp2';
  const re = new RegExp(
    `<Reveal\\s+direction="${direction}"\\s+style=\\{\\{[^}]+\\}\\}>`,
    'g'
  );
  return t.replace(re, `<motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={${attr}} style={{ flex:'1 1 340px' }}${extra}>`);
}

// Replace ALL Reveal opens in the 4 sections
const s1Start = txt.indexOf('SECTION 1');
const beforeS1 = txt.substring(0, s1Start);
let sectionsBlock = txt.substring(s1Start);

// Replace opening Reveal tags
sectionsBlock = sectionsBlock
  .replace(/<Reveal direction="left"\s+style=\{\{ flex: '1 1 340px' \}\}>/g,
    `<motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vFadeLeft} style={{ flex:'1 1 340px' }}>`)
  .replace(/<Reveal direction="right"\s+style=\{\{ flex: '1 1 340px' \}\}>/g,
    `<motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vFadeRight} style={{ flex:'1 1 340px' }}>`)
  .replace(/<Reveal direction="up">/g,
    `<motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vFadeUp2}>`)
  // Close all Reveal tags
  .replace(/<\/Reveal>/g, `</motion.div>`);

// ── 4. Replace static glow blobs with FloatOrbs ─────────────────────────────
// Section 1 YT - remove old static div blob
sectionsBlock = sectionsBlock.replace(
  /\{\/\* Red glow blob \*\/\}\n\s*<div style=\{\{ position: 'absolute'[^\n]+\n\s*pointerEvents: 'none' \}\} \/>/,
  `<FloatOrb color="rgba(255,0,0,0.13)" size="480px" style={{ top:'0%', left:'-6%' }} />\n        <FloatOrb color="rgba(255,80,0,0.07)" size="250px" style={{ bottom:'5%', right:'-3%' }} />`
);

// Section 2 Courses - remove old static div blob
sectionsBlock = sectionsBlock.replace(
  /<div style=\{\{ position: 'absolute', top: '20%', right: '[^']+', width: '500px'[^\n]+pointerEvents: 'none' \}\} \/>/,
  `<FloatOrb color="rgba(37,99,235,0.12)" size="500px" style={{ top:'10%', right:'-6%' }} />\n        <FloatOrb color="rgba(139,92,246,0.08)" size="300px" style={{ bottom:'0%', left:'20%' }} />`
);

// Section 3 Prop Firms - remove old static div blob
sectionsBlock = sectionsBlock.replace(
  /<div style=\{\{ position: 'absolute', bottom: '0'[^\n]+pointerEvents: 'none' \}\} \/>/,
  `<FloatOrb color="rgba(16,185,129,0.1)" size="500px" style={{ bottom:'-10%', left:'25%' }} />`
);

// Section 4 Blog - remove old static div blob
sectionsBlock = sectionsBlock.replace(
  /<div style=\{\{ position: 'absolute', top: '0'[^\n]+pointerEvents: 'none' \}\} \/>/,
  `<FloatOrb color="rgba(99,102,241,0.1)" size="600px" style={{ top:'-20%', left:'50%', transform:'translateX(-50%)' }} />`
);

// Add zIndex:1 to containers in sections for layering above orbs
sectionsBlock = sectionsBlock.replace(
  /<div className="container">\n(\s+)<div style=\{\{ display: 'flex', alignItems: 'center'/g,
  `<div className="container" style={{ position:'relative', zIndex:1 }}>\n$1<div style={{ display: 'flex', alignItems: 'center'`
);

// ── 5. Stagger the course topic cards ────────────────────────────────────────
sectionsBlock = sectionsBlock.replace(
  `              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { icon: '📈', label: 'Market Structure', color: 'rgba(37,99,235,0.15)' },
                  { icon: '⚡', label: 'Scalping Mastery', color: 'rgba(139,92,246,0.15)' },
                  { icon: '🎯', label: 'Entry & Exit', color: 'rgba(16,185,129,0.15)' },
                  { icon: '🛡️', label: 'Risk Management', color: 'rgba(245,158,11,0.15)' },
                ].map(({ icon, label, color }) => (
                  <div key={label} style={{ background: color, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '1.5rem', textAlign: 'center', transition: 'transform 0.25s' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</div>
                  </div>
                ))}
              </div>`,
  `              <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vStagger}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
              >
                {[
                  { icon: '📈', label: 'Market Structure', color: 'rgba(37,99,235,0.15)' },
                  { icon: '⚡', label: 'Scalping Mastery', color: 'rgba(139,92,246,0.15)' },
                  { icon: '🎯', label: 'Entry & Exit', color: 'rgba(16,185,129,0.15)' },
                  { icon: '🛡️', label: 'Risk Management', color: 'rgba(245,158,11,0.15)' },
                ].map(({ icon, label, color }) => (
                  <motion.div key={label} variants={vPop} whileHover={{ y:-6, scale:1.05, boxShadow:'0 14px 32px rgba(0,0,0,0.2)' }}
                    style={{ background: color, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '1.5rem', textAlign: 'center', cursor:'default' }}
                  >
                    <motion.div animate={{ rotate:[0,10,-10,0] }} transition={{ duration:3, repeat:Infinity, repeatDelay:2 }}
                      style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >{icon}</motion.div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</div>
                  </motion.div>
                ))}
              </motion.div>`
);

// ── 6. Stagger the prop firm step cards ──────────────────────────────────────
sectionsBlock = sectionsBlock.replace(
  `              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { step: '01', title: 'Browse Firms', desc: 'Compare rules, fees, and payout structures side by side.' },
                  { step: '02', title: 'Pick Your Eval', desc: 'Choose the challenge that fits your trading style.' },
                  { step: '03', title: 'Get Funded', desc: 'Pass the eval and start trading with real capital.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.25rem 1.5rem', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='rgba(16,185,129,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
                  >
                    <div style={{ flexShrink: 0, width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.78rem', color: '#10b981' }}>{step}</div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>`,
  `              <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vStagger}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {[
                  { step: '01', title: 'Browse Firms', desc: 'Compare rules, fees, and payout structures side by side.' },
                  { step: '02', title: 'Pick Your Eval', desc: 'Choose the challenge that fits your trading style.' },
                  { step: '03', title: 'Get Funded', desc: 'Pass the eval and start trading with real capital.' },
                ].map(({ step, title, desc }) => (
                  <motion.div key={step} variants={vFadeLeft}
                    whileHover={{ x:6, boxShadow:'0 8px 28px rgba(16,185,129,0.12)' }}
                    style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.25rem 1.5rem' }}
                  >
                    <motion.div whileHover={{ rotate:360 }} transition={{ duration:0.5 }}
                      style={{ flexShrink: 0, width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.78rem', color: '#10b981' }}
                    >{step}</motion.div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>`
);

// ── 7. Blog — animated tag pills ─────────────────────────────────────────────
sectionsBlock = sectionsBlock.replace(
  `            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
              {['📊 Market Structure', '📰 Economic Calendar', '🎯 Trade Ideas', '⚡ Scalping Setups', '🌍 Global Macro'].map(tag => (
                <span key={tag} style={{ padding: '6px 18px', borderRadius: '99px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 700, fontSize: '0.82rem' }}>{tag}</span>
              ))}
            </div>`,
  `            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-40px' }} variants={vStagger}
              style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '3rem' }}
            >
              {['📊 Market Structure', '📰 Economic Calendar', '🎯 Trade Ideas', '⚡ Scalping Setups', '🌍 Global Macro'].map(tag => (
                <motion.span key={tag} variants={vPop} whileHover={{ scale:1.12, y:-3, background:'rgba(99,102,241,0.22)' }}
                  style={{ padding: '6px 18px', borderRadius: '99px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 700, fontSize: '0.82rem', cursor:'default', display:'inline-block' }}
                >{tag}</motion.span>
              ))}
            </motion.div>`
);

txt = beforeS1 + sectionsBlock;

// Restore CRLF if needed
if (hasCRLF) txt = txt.replace(/\n/g, '\r\n');

fs.writeFileSync(file, txt, 'utf8');

// Verify
const remaining = (txt.match(/<Reveal/g) || []).length;
const wiv = (txt.match(/whileInView/g) || []).length;
console.log(`Remaining <Reveal> in file: ${remaining} (should be 0 in sections)`);
console.log(`whileInView usages: ${wiv}`);
console.log('Done!');
