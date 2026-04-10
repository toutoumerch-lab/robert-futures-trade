/**
 * Replace all emoji characters with Lucide React icon components.
 * This script performs targeted string replacements in each file.
 * Run: node replace_emoji_with_icons.cjs
 */

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname);

function fix(filePath, replacements) {
  const full = path.join(ROOT, filePath);
  if (!fs.existsSync(full)) { console.log('SKIP: ' + filePath); return; }
  let content = fs.readFileSync(full, 'utf8');
  const original = content;
  let count = 0;
  for (const [search, replace] of replacements) {
    if (content.includes(search)) {
      content = content.split(search).join(replace);
      count++;
    }
  }
  if (content !== original) {
    fs.writeFileSync(full, content, 'utf8');
    console.log('FIXED: ' + filePath + ' (' + count + ' replacements)');
  } else {
    console.log('OK: ' + filePath + ' (no changes)');
  }
}

// ═══════════════════════════════════════════
// 1. PropFirmList.jsx
// ═══════════════════════════════════════════

// First update the import line
fix('client/src/pages/PropFirmList.jsx', [
  // Add new needed icons to import
  [
    "import { LayoutGrid, List, Search, SlidersHorizontal, X, Star, ExternalLink, Copy, Check, Filter, Heart, GitCompareArrows, Zap, TrendingUp, ChevronDown, ChevronRight, Shield, DollarSign, Activity, Clock, Bot, Newspaper, Globe, BarChart3 } from 'lucide-react';",
    "import { LayoutGrid, List, Search, SlidersHorizontal, X, Star, ExternalLink, Copy, Check, Filter, Heart, GitCompareArrows, Zap, TrendingUp, ChevronDown, ChevronRight, Shield, DollarSign, Activity, Clock, Bot, Newspaper, Globe, BarChart3, Trophy, Gem, Tag, Ticket, Target, TrendingDown, Calendar, User, ClipboardList, Wrench, Lock, Banknote, Building2, FileText, Pencil, Landmark } from 'lucide-react';"
  ],
  // Smart badges - comparison modal
  ["'💰 Low Price (Tied)'", "'Low Price (Tied)'"],
  ["'💰 Cheapest'", "'Cheapest'"],
  ["'🆓 Free Start'", "'Free Start'"],
  ["'⭐ Top Rated'", "'Top Rated'"],
  ["'🏆 Best Rated'", "'Best Rated'"],
  ["'💎 Best Value'", "'Best Value'"],
  // WinnerBadge
  ["'⭐ TOP'", "'TOP'"],
  ["'🏆 BEST'", "'BEST'"],
  // SectionRow icons - pass components now
  ['<SectionRow icon="💰" title="Pricing & Savings" />', '<SectionRow icon={<DollarSign size={14} />} title="Pricing & Savings" />'],
  ['<SectionRow icon="🔧" title="Trading Features" />', '<SectionRow icon={<Wrench size={14} />} title="Trading Features" />'],
  // Compare table labels
  ['<td className="pf-compare-label">⭐ Rating</td>', '<td className="pf-compare-label"><Star size={14} style={{ color: "#f59e0b" }} /> Rating</td>'],
  ['<td className="pf-compare-label">🔓 Activation Fee</td>', '<td className="pf-compare-label"><Lock size={14} /> Activation Fee</td>'],
  ['<td className="pf-compare-label">💲 Final Price</td>', '<td className="pf-compare-label"><DollarSign size={14} /> Final Price</td>'],
  ['<td className="pf-compare-label">🏷️ Discount</td>', '<td className="pf-compare-label"><Tag size={14} /> Discount</td>'],
  ['<td className="pf-compare-label">🎟️ Promo Code</td>', '<td className="pf-compare-label"><Ticket size={14} /> Promo Code</td>'],
  ['<td className="pf-compare-label">📊 Profit Split</td>', '<td className="pf-compare-label"><BarChart3 size={14} /> Profit Split</td>'],
  ['<td className="pf-compare-label">🎯 Profit Target</td>', '<td className="pf-compare-label"><Target size={14} /> Profit Target</td>'],
  ['<td className="pf-compare-label">📉 Daily Loss Limit</td>', '<td className="pf-compare-label"><TrendingDown size={14} /> Daily Loss Limit</td>'],
  ['<td className="pf-compare-label">📉 Drawdown Rules</td>', '<td className="pf-compare-label"><TrendingDown size={14} /> Drawdown Rules</td>'],
  ['<td className="pf-compare-label">🛡️ Buffer</td>', '<td className="pf-compare-label"><Shield size={14} /> Buffer</td>'],
  ['<td className="pf-compare-label">💸 Max Withdrawal</td>', '<td className="pf-compare-label"><Banknote size={14} /> Max Withdrawal</td>'],
  ['<td className="pf-compare-label">📅 Days to Pass</td>', '<td className="pf-compare-label"><Calendar size={14} /> Days to Pass</td>'],
  ['<td className="pf-compare-label">👤 Max Accounts</td>', '<td className="pf-compare-label"><User size={14} /> Max Accounts</td>'],
  ['<td className="pf-compare-label">📋 Eval</td>', '<td className="pf-compare-label"><ClipboardList size={14} /> Eval</td>'],
  // Feature labels in compare
  ["{ key: 'copy_trade', label: '📋 Copy Trading' }", "{ key: 'copy_trade', label: 'Copy Trading' }"],
  ["{ key: 'news', label: '📰 News Trading' }", "{ key: 'news', label: 'News Trading' }"],
  ["{ key: 'bots', label: '🤖 Bots Allowed' }", "{ key: 'bots', label: 'Bots Allowed' }"],
  ["{ key: 'vpn', label: '🌐 VPN Allowed' }", "{ key: 'vpn', label: 'VPN Allowed' }"],
  ["{ key: 'dca', label: '📈 DCA Allowed' }", "{ key: 'dca', label: 'DCA Allowed' }"],
  // Empty state
  ['<p style={{ fontSize: \'3rem\', marginBottom: \'1rem\' }}>🏦</p>', '<Landmark size={48} style={{ marginBottom: \'1rem\', color: \'var(--accent-primary)\' }} />'],
  // Detail modal section headings
  ['>🏢 Basic Information</h4>', '><Building2 size={20} style={{ color: "var(--accent-primary)" }} /> Basic Information</h4>'],
  ['>⭐ {viewingFirm.rating', '><Star size={18} fill="#f59e0b" stroke="#f59e0b" /> {viewingFirm.rating'],
  ['>💲 Pricing Details</h4>', '><DollarSign size={20} style={{ color: "var(--accent-primary)" }} /> Pricing Details</h4>'],
  ['>🔧 Feature Support</h4>', '><Wrench size={20} style={{ color: "var(--accent-primary)" }} /> Feature Support</h4>'],
  ['>📝 Author Notes</strong>', '><Pencil size={18} style={{ color: "var(--accent-primary)" }} /> Author Notes</strong>'],
]);

// ═══════════════════════════════════════════
// 2. AdminDashboard.jsx
// ═══════════════════════════════════════════
fix('client/src/pages/AdminDashboard.jsx', [
  // Add new icons to import  
  [
    "  Users, FileText, GraduationCap, Briefcase, PartyPopper, Palette,\n  Monitor, Smartphone, ChevronDown, ChevronRight, Layers, Upload\n} from 'lucide-react';",
    "  Users, FileText, GraduationCap, Briefcase, PartyPopper, Palette,\n  Monitor, Smartphone, ChevronDown, ChevronRight, Layers, Upload,\n  BookOpen, Camera, Film, FileDown, CircleDot\n} from 'lucide-react';"
  ],
  // Empty courses state
  ["<div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📚</div>", "<BookOpen size={48} style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }} />"],
  // Thumbnail upload icon
  ["<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>", "<Camera size={40} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />"],
  // Video engine icon
  ["<div style={{ fontSize: '2rem' }}>🎬</div>", "<Film size={28} style={{ color: 'var(--accent-primary)' }} />"],
  // PDF upload icon
  ["<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>", "<FileDown size={40} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />"],
  // Status color select options - use colored circles via inline spans
  ["<option value=\"green\">🟢 Green (Top Ranked)</option>", "<option value=\"green\">\u25CF Green (Top Ranked)</option>"],
  ["<option value=\"blue\">🔵 Blue (Community Trusted)</option>", "<option value=\"blue\">\u25CF Blue (Community Trusted)</option>"],
  ["<option value=\"yellow\">🟡 Yellow (New / Building Trust)</option>", "<option value=\"yellow\">\u25CF Yellow (New / Building Trust)</option>"],
  ["<option value=\"red\">🔴 Red (Avoid / Possible Scam)</option>", "<option value=\"red\">\u25CF Red (Avoid / Possible Scam)</option>"],
]);

// ═══════════════════════════════════════════
// 3. CourseDetail.jsx
// ═══════════════════════════════════════════
fix('client/src/pages/CourseDetail.jsx', [
  // Add lucide-react import
  [
    "import Button from '../components/common/Button';",
    "import Button from '../components/common/Button';\nimport { Film, Paperclip, FileDown, Package, Link2, Lock, BookOpen } from 'lucide-react';"
  ],
  // No video placeholder
  ["<div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎬</div>", "<Film size={48} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }} />"],
  // Resources heading
  [">📎 Lesson Resources</h4>", "><Paperclip size={16} /> Lesson Resources</h4>"],
  // Download PDF
  ["              📄 Download PDF", "              <FileDown size={16} /> Download PDF"],
  // Download ZIP
  ["              📦 Download ZIP Bundle", "              <Package size={16} /> Download ZIP Bundle"],
  // External links
  ["              🔗 {r.label}", "              <Link2 size={16} /> {r.label}"],
  // Course content heading
  [">📚 Course Content</h4>", "><BookOpen size={18} /> Course Content</h4>"],
  // PDF resource section icon
  ["<div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>", "<FileDown size={32} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />"],
  // Login to download
  ["                      🔒 Login to download", "                      <Lock size={16} /> Login to download"],
]);

// ═══════════════════════════════════════════
// 4. CourseList.jsx
// ═══════════════════════════════════════════
fix('client/src/pages/CourseList.jsx', [
  // Add lucide-react import
  [
    "import Button from '../components/common/Button';",
    "import Button from '../components/common/Button';\nimport { BookOpen, SearchX, Bookmark } from 'lucide-react';"
  ],
  // No courses empty state
  ["<p style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📚</p>", "<BookOpen size={48} style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }} />"],
  // No filtered result
  ["<p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>", "<SearchX size={40} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }} />"],
  // Category badge on card
  ["                        🔖 {course.category || 'General'}", "                        <Bookmark size={12} /> {course.category || 'General'}"],
]);

// ═══════════════════════════════════════════
// 5. BlogDetail.jsx
// ═══════════════════════════════════════════
fix('client/src/pages/BlogDetail.jsx', [
  // Add lucide-react import
  [
    "import { useAuth } from '../context/AuthContext';",
    "import { useAuth } from '../context/AuthContext';\nimport { ThumbsUp, Flame, Rocket } from 'lucide-react';"
  ],
  // Reaction buttons
  ["<button className=\"reaction-btn\" onClick={() => handleReaction('like')}>👍 Like</button>", "<button className=\"reaction-btn\" onClick={() => handleReaction('like')}><ThumbsUp size={16} /> Like</button>"],
  ["<button className=\"reaction-btn\" onClick={() => handleReaction('fire')}>🔥 Fire</button>", "<button className=\"reaction-btn\" onClick={() => handleReaction('fire')}><Flame size={16} /> Fire</button>"],
  ["<button className=\"reaction-btn\" onClick={() => handleReaction('rocket')}>🚀 Rocket</button>", "<button className=\"reaction-btn\" onClick={() => handleReaction('rocket')}><Rocket size={16} /> Rocket</button>"],
]);

// ═══════════════════════════════════════════
// 6. BlogList.jsx
// ═══════════════════════════════════════════
fix('client/src/pages/BlogList.jsx', [
  // Add lucide-react import
  [
    "import Card from '../components/common/Card';",
    "import Card from '../components/common/Card';\nimport { Search, Sparkles } from 'lucide-react';"
  ],
  // Search placeholder (remove emoji from placeholder text)
  ['placeholder="🔍  Search posts…"', 'placeholder="Search posts\u2026"'],
  // Latest badge
  ["<span className=\"badge badge-featured mb-4\">✨ Latest</span>", "<span className=\"badge badge-featured mb-4\"><Sparkles size={14} /> Latest</span>"],
]);

// ═══════════════════════════════════════════
// 7. Home.jsx
// ═══════════════════════════════════════════
fix('client/src/pages/Home.jsx', [
  // Add lucide-react import
  [
    "import { useBranding } from '../context/BrandingContext';",
    "import { useBranding } from '../context/BrandingContext';\nimport { Scale, Gem, Newspaper } from 'lucide-react';"
  ],
  // FeatureCard icons - these pass icon as a prop rendered in a div
  // The FeatureCard component renders {icon} in a div with fontSize set
  // We need to pass JSX icon components instead of emoji strings
  ['icon="⚖️"', 'icon={<Scale size={36} style={{ color: "var(--accent-primary)" }} />}'],
  ['icon="💎"', 'icon={<Gem size={36} style={{ color: "var(--accent-primary)" }} />}'],
  ['icon="🗞️"', 'icon={<Newspaper size={36} style={{ color: "var(--accent-primary)" }} />}'],
]);

// ═══════════════════════════════════════════
// 8. BrandingManager.jsx
// ═══════════════════════════════════════════
fix('client/src/components/admin/BrandingManager.jsx', [
  // Replace theme preset emoji icons with plain text names (already have the color swatches)
  ["icon: '💎',", "icon: 'diamond',"],
  ["icon: '🌙',", "icon: 'moon',"],
  ["icon: '🍀',", "icon: 'clover',"],
  ["icon: '🌅',", "icon: 'sunset',"],
  ["icon: '👑',", "icon: 'crown',"],
  ["icon: '⚡',", "icon: 'bolt',"],
  // Layout icons
  ["icon: '📐'", "icon: 'layout'"],
  ["icon: '📱'", "icon: 'compact'"],
  ["icon: '✨'", "icon: 'sparkle'"],
]);

console.log('\nDone! All emoji replaced with Lucide icons.');
