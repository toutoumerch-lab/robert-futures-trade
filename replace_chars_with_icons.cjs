/**
 * Replace ALL remaining Unicode special characters with Lucide React icons
 * or clean ASCII alternatives. This is the final pass.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname);

// ═══════════════════════════════════════════
// PropFirmList.jsx replacements
// ═══════════════════════════════════════════
function fixPropFirmList() {
  const f = path.join(ROOT, 'client/src/pages/PropFirmList.jsx');
  let c = fs.readFileSync(f, 'utf8');

  // Import: add missing icons
  c = c.replace(
    "import { LayoutGrid, List, Search, SlidersHorizontal, X, Star, ExternalLink, Copy, Check, Filter, Heart, GitCompareArrows, Zap, TrendingUp, ChevronDown, ChevronRight, Shield, DollarSign, Activity, Clock, Bot, Newspaper, Globe, BarChart3, Trophy, Gem, Tag, Ticket, Target, TrendingDown, Calendar, User, ClipboardList, Wrench, Lock, Banknote, Building2, FileText, Pencil, Landmark } from 'lucide-react';",
    "import { LayoutGrid, List, Search, SlidersHorizontal, X, Star, ExternalLink, Copy, Check, Filter, Heart, GitCompareArrows, Zap, TrendingUp, ChevronDown, ChevronRight, Shield, DollarSign, Activity, Clock, Bot, Newspaper, Globe, BarChart3, Trophy, Gem, Tag, Ticket, Target, TrendingDown, Calendar, User, ClipboardList, Wrench, Lock, Banknote, Building2, FileText, Pencil, Landmark, ChevronUp, Settings, Timer } from 'lucide-react';"
  );

  // ★ → <Star> in search suggestions and featured badge  
  c = c.replace(/\u2605 \$\{firm\.rating\}/g, '<Star size={12} fill="#f59e0b" stroke="#f59e0b" /> ${firm.rating}');
  c = c.replace(/>\u2605 \{firm\.rating\}/g, '><Star size={12} fill="#f59e0b" stroke="#f59e0b" /> {firm.rating}');
  c = c.replace(/>\u2605 Featured</g, '><Star size={12} fill="#f97316" stroke="#f97316" /> Featured<');
  c = c.replace(/<span style={{ color: '#f59e0b' }}>\u2605<\/span>/g, '<Star size={16} fill="#f59e0b" stroke="#f59e0b" />');

  // ⚡ in badges
  c = c.replace(/'\u26A1 Fast Payout \(Tied\)'/g, "'Fast Payout (Tied)'");
  c = c.replace(/'\u26A1 Fastest Payout'/g, "'Fastest Payout'");
  c = c.replace(/'\u26A1 Micro Scalping'/g, "'Micro Scalping'");
  c = c.replace(/>\u26A1 Payout Speed</g, '><Zap size={14} /> Payout Speed<');

  // ✕ close buttons → <X> icon 
  c = c.replace(/>\u2715<\/button>/g, '><X size={16} /></button>');

  // ✓ and ✗ check/cross marks
  c = c.replace(/FREE \u2713<\/span>/g, 'FREE <Check size={14} /></span>');
  c = c.replace(/\u2713 \{f\.buffer_amount/g, '<Check size={14} /> {f.buffer_amount');
  c = c.replace(/>\u2713 Yes</g, '><Check size={14} /> Yes<');
  c = c.replace(/\u2717 No</g, '<X size={14} /> No');
  c = c.replace(/isComparing \? '\u2713' : '\+'/g, "isComparing ? <Check size={12} /> : '+'");

  // ⚙️ section rows and headings
  c = c.replace(/<SectionRow icon="\u2699\uFE0F" title="Trading Rules/g, '<SectionRow icon={<Settings size={14} />} title="Trading Rules');
  c = c.replace(/<SectionRow icon="\u2699" title="Trading Rules/g, '<SectionRow icon={<Settings size={14} />} title="Trading Rules');
  c = c.replace(/>\u2699\uFE0F Trading Rules/g, '><Settings size={20} style={{ color: "var(--accent-primary)" }} /> Trading Rules');
  c = c.replace(/>\u2699 Trading Rules/g, '><Settings size={20} style={{ color: "var(--accent-primary)" }} /> Trading Rules');

  // ⏱️ section row
  c = c.replace(/<SectionRow icon="\u23F1\uFE0F" title="Payout/g, '<SectionRow icon={<Timer size={14} />} title="Payout');
  c = c.replace(/<SectionRow icon="\u23F1" title="Payout/g, '<SectionRow icon={<Timer size={14} />} title="Payout');

  // ✓/✗ in feature support detail modal
  c = c.replace(/\{isEnabled \? '\u2713' : '\u2717'\}/g, '{isEnabled ? <Check size={14} /> : <X size={14} />}');
  // Also handle ✔/✗ variant
  c = c.replace(/\{isEnabled \? '\u2714' : '\u2717'\}/g, '{isEnabled ? <Check size={14} /> : <X size={14} />}');

  fs.writeFileSync(f, c, 'utf8');
  console.log('FIXED: PropFirmList.jsx');
}

// ═══════════════════════════════════════════
// CourseDetail.jsx replacements
// ═══════════════════════════════════════════
function fixCourseDetail() {
  const f = path.join(ROOT, 'client/src/pages/CourseDetail.jsx');
  let c = fs.readFileSync(f, 'utf8');

  // Add ChevronUp, ChevronDown, Play, ArrowLeft, Clock to imports
  c = c.replace(
    "import { Film, Paperclip, FileDown, Package, Link2, Lock, BookOpen } from 'lucide-react';",
    "import { Film, Paperclip, FileDown, Package, Link2, Lock, BookOpen, ChevronUp, ChevronDown, Play, ArrowLeft, Clock } from 'lucide-react';"
  );

  // ← arrows in navigation  
  c = c.replace(/>\u2190 Library</g, '><ArrowLeft size={14} /> Library<');
  c = c.replace(/\u2190 Back to Intro/g, '<ArrowLeft size={14} /> Back to Intro');

  // ⏱ timer
  c = c.replace(/>\u23F1 \{activeLesson\.duration\}/g, '><Clock size={12} /> {activeLesson.duration}');
  c = c.replace(/>\u23F1\uFE0F \{activeLesson\.duration\}/g, '><Clock size={12} /> {activeLesson.duration}');

  // ▲ / ▼ expand/collapse
  c = c.replace(/\{isExpanded \? '\u25B2' : '\u25BC'\}/g, '{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}');

  // ▶ play indicator
  c = c.replace(/>\u25B6</g, '><Play size={10} fill="#3b82f6" /><');

  fs.writeFileSync(f, c, 'utf8');
  console.log('FIXED: CourseDetail.jsx');
}

// ═══════════════════════════════════════════
// CourseList.jsx replacements
// ═══════════════════════════════════════════
function fixCourseList() {
  const f = path.join(ROOT, 'client/src/pages/CourseList.jsx');
  let c = fs.readFileSync(f, 'utf8');

  // Add Clock, ArrowRight to imports
  c = c.replace(
    "import { BookOpen, SearchX, Bookmark } from 'lucide-react';",
    "import { BookOpen, SearchX, Bookmark, Clock, ArrowRight } from 'lucide-react';"
  );

  // ⏱ timer
  c = c.replace(/>\u23F1 \{course\.duration/g, '><Clock size={12} /> {course.duration');
  c = c.replace(/>\u23F1\uFE0F \{course\.duration/g, '><Clock size={12} /> {course.duration');

  // → arrow in button
  c = c.replace(/View Course \u2192/g, 'View Course <ArrowRight size={14} />');

  fs.writeFileSync(f, c, 'utf8');
  console.log('FIXED: CourseList.jsx');
}

// ═══════════════════════════════════════════
// BlogDetail.jsx replacements
// ═══════════════════════════════════════════
function fixBlogDetail() {
  const f = path.join(ROOT, 'client/src/pages/BlogDetail.jsx');
  let c = fs.readFileSync(f, 'utf8');

  // Add ArrowLeft to import
  c = c.replace(
    "import { ThumbsUp, Flame, Rocket } from 'lucide-react';",
    "import { ThumbsUp, Flame, Rocket, ArrowLeft } from 'lucide-react';"
  );

  // ← arrows
  c = c.replace(/>\u2190 Back to Blog</g, '><ArrowLeft size={14} /> Back to Blog<');
  // Also in the inline link
  c = c.replace(/\u2190 Back to Blog/g, '<ArrowLeft size={14} /> Back to Blog');

  fs.writeFileSync(f, c, 'utf8');
  console.log('FIXED: BlogDetail.jsx');
}

// ═══════════════════════════════════════════
// BlogList.jsx replacements
// ═══════════════════════════════════════════
function fixBlogList() {
  const f = path.join(ROOT, 'client/src/pages/BlogList.jsx');
  let c = fs.readFileSync(f, 'utf8');

  // Add ArrowRight to import
  c = c.replace(
    "import { Search, Sparkles } from 'lucide-react';",
    "import { Search, Sparkles, ArrowRight } from 'lucide-react';"
  );

  // → arrow
  c = c.replace(/Read Full Article \u2192/g, 'Read Full Article <ArrowRight size={14} />');

  fs.writeFileSync(f, c, 'utf8');
  console.log('FIXED: BlogList.jsx');
}

// ═══════════════════════════════════════════
// Home.jsx replacements
// ═══════════════════════════════════════════
function fixHome() {
  const f = path.join(ROOT, 'client/src/pages/Home.jsx');
  let c = fs.readFileSync(f, 'utf8');

  // Add ArrowRight to import
  c = c.replace(
    "import { Scale, Gem, Newspaper, Sparkles } from 'lucide-react';",
    "import { Scale, Gem, Newspaper, Sparkles, ArrowRight } from 'lucide-react';"
  );

  // → arrow in FeatureCard link
  c = c.replace(/\{linkText\} \u2192/g, '{linkText} <ArrowRight size={14} />');

  fs.writeFileSync(f, c, 'utf8');
  console.log('FIXED: Home.jsx');
}

// ═══════════════════════════════════════════
// AdminDashboard.jsx replacements
// ═══════════════════════════════════════════
function fixAdmin() {
  const f = path.join(ROOT, 'client/src/pages/AdminDashboard.jsx');
  let c = fs.readFileSync(f, 'utf8');

  // Add Clock, ExternalLink, ArrowUpRight to imports if not present
  if (!c.includes('Clock,')) {
    c = c.replace(
      "  Monitor, Smartphone, ChevronDown, ChevronRight, Layers, Upload,\n  BookOpen, Camera, Film, FileDown, CircleDot\n} from 'lucide-react';",
      "  Monitor, Smartphone, ChevronDown, ChevronRight, Layers, Upload,\n  BookOpen, Camera, Film, FileDown, CircleDot, Clock, ArrowUpRight\n} from 'lucide-react';"
    );
  }

  // ✕ close/delete buttons  
  c = c.replace(/>\u2715<\/button>/g, '><X size={14} /></button>');
  
  // ↗ external link arrows
  c = c.replace(/View active image \u2197/g, 'View active image <ArrowUpRight size={12} />');
  c = c.replace(/Verify PDF \u2197/g, 'Verify PDF <ArrowUpRight size={12} />');

  // ⏱ timer for course duration  
  c = c.replace(/>\u23F1 \{c\.duration/g, '><Clock size={12} /> {c.duration');
  c = c.replace(/>\u23F1\uFE0F \{c\.duration/g, '><Clock size={12} /> {c.duration');

  // ✓ and ✗
  c = c.replace(/\u2713 Raw MP4/g, '<Check size={14} /> Raw MP4');
  
  fs.writeFileSync(f, c, 'utf8');
  console.log('FIXED: AdminDashboard.jsx');
}

// Run all fixes
fixPropFirmList();
fixCourseDetail();
fixCourseList();
fixBlogDetail();
fixBlogList();
fixHome();
fixAdmin();

console.log('\nAll files updated with Lucide icons!');
