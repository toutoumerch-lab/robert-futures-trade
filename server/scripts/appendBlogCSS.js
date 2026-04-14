
const fs = require('fs');
const cssFile = 'c:/Users/noure/Documents/trades/client/src/index.css';

const blogCSS = `

/* ============================================================
   BLOG SYSTEM — Complete Styles
   ============================================================ */

/* ── Page wrapper ─────────────────────────────────────────── */
.blog-page {
  min-height: 100vh;
}

/* ── Hero section ─────────────────────────────────────────── */
.blog-hero-bg {
  background: linear-gradient(160deg, var(--bg-secondary) 0%, var(--bg-primary) 60%);
  border-bottom: 1px solid var(--border);
  padding: 5rem 0 3.5rem;
  position: relative;
  overflow: hidden;
}

.blog-hero-bg::before {
  content: '';
  position: absolute;
  top: -80px;
  right: -80px;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%);
  pointer-events: none;
}

.blog-hero-inner {
  max-width: 680px;
}

.blog-hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-primary);
  background: rgba(37,99,235,0.08);
  border: 1px solid rgba(37,99,235,0.2);
  padding: 0.4rem 1rem;
  border-radius: 99px;
  margin-bottom: 1.5rem;
}

.blog-hero-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin: 0 0 1rem;
  color: var(--text-primary);
}

.blog-hero-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 2rem;
  max-width: 520px;
}

/* ── Search ───────────────────────────────────────────────── */
.blog-search-wrap {
  position: relative;
  max-width: 440px;
}

.blog-search-icon {
  position: absolute;
  left: 1.1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.blog-search-input {
  width: 100%;
  padding: 0.875rem 1.25rem 0.875rem 3rem;
  background: var(--bg-primary);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  color: var(--text-primary);
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.blog-search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}

.blog-search-input::placeholder {
  color: var(--text-secondary);
}

/* ── Category tabs ─────────────────────────────────────────── */
.blog-category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 2rem 0 1.5rem;
}

.blog-cat-tab {
  padding: 0.5rem 1.1rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.blog-cat-tab:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: rgba(37,99,235,0.04);
}

.blog-cat-tab.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(37,99,235,0.3);
}

/* ── Featured card ─────────────────────────────────────────── */
.blog-featured-card {
  display: block;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 2.5rem;
  text-decoration: none;
  box-shadow: 0 20px 60px -15px rgba(0,0,0,0.25);
  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease;
}

.blog-featured-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 70px -15px rgba(0,0,0,0.35);
}

.blog-featured-img {
  position: relative;
  width: 100%;
  height: 420px;
  background-color: var(--bg-tertiary);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
}

.blog-featured-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
  opacity: 0.3;
}

.blog-featured-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
}

.blog-featured-content {
  position: relative;
  z-index: 1;
  padding: 2.5rem;
  width: 100%;
}

.blog-featured-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.blog-featured-title {
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 900;
  color: #fff;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0 0 0.75rem;
}

.blog-featured-excerpt {
  color: rgba(255,255,255,0.8);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1.25rem;
  max-width: 600px;
}

.blog-featured-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: rgba(255,255,255,0.7);
  font-size: 0.85rem;
}

/* ── Badges ───────────────────────────────────────────────── */
.blog-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.3rem 0.85rem;
  border-radius: 99px;
  background: rgba(37,99,235,0.85);
  color: #fff;
  letter-spacing: 0.02em;
  backdrop-filter: blur(4px);
}

.blog-badge-featured {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.blog-badge-cat {
  background: rgba(37,99,235,0.1);
  color: var(--accent-primary);
  border: 1px solid rgba(37,99,235,0.2);
  margin-bottom: 1rem;
}

/* ── Grid ─────────────────────────────────────────────────── */
.blog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.75rem;
  padding-bottom: 4rem;
}

@media (max-width: 1024px) {
  .blog-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .blog-grid { grid-template-columns: 1fr; }
  .blog-featured-img { height: 280px; }
}

/* ── Post card ────────────────────────────────────────────── */
.blog-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--border);
  text-decoration: none;
  transition: transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s ease, border-color 0.2s;
  box-shadow: 0 4px 16px -4px rgba(0,0,0,0.12);
  height: 100%;
}

.blog-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 48px -12px rgba(0,0,0,0.25);
  border-color: rgba(37,99,235,0.2);
}

.blog-card-img {
  height: 200px;
  background-color: var(--bg-tertiary);
  background-size: cover;
  background-position: center;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.blog-card-img-placeholder {
  color: var(--accent-primary);
  opacity: 0.3;
}

.blog-card-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.3rem 0.75rem;
  border-radius: 99px;
  background: rgba(37,99,235,0.9);
  color: #fff;
  backdrop-filter: blur(4px);
  letter-spacing: 0.03em;
}

.blog-card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  flex: 1;
}

.blog-card-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.35;
  letter-spacing: -0.01em;
  margin: 0;
  transition: color 0.2s;
}

.blog-card:hover .blog-card-title {
  color: var(--accent-primary);
}

.blog-card-excerpt {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.blog-card-meta-right {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.blog-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  font-size: 0.8rem;
}

.blog-date { color: var(--text-secondary); }

.blog-read-link {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--accent-primary);
  font-weight: 700;
  transition: gap 0.2s;
}

.blog-card:hover .blog-read-link {
  gap: 0.5rem;
}

/* ── Author chip ──────────────────────────────────────────── */
.blog-author-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.blog-author-chip.small { font-size: 0.78rem; gap: 0.4rem; }

.blog-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));
  color: #fff;
  font-weight: 800;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.blog-avatar.small { width: 26px; height: 26px; font-size: 0.75rem; }
.blog-avatar.large { width: 40px; height: 40px; font-size: 1rem; }

/* ── Meta dot ─────────────────────────────────────────────── */
.blog-meta-dot { color: var(--text-secondary); opacity: 0.4; }

/* ── Skeletons ────────────────────────────────────────────── */
.blog-loading {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.75rem;
  padding: 2rem 0 4rem;
}
@media (max-width: 1024px) { .blog-loading { grid-template-columns: repeat(2,1fr); } }
@media (max-width:  640px) { .blog-loading { grid-template-columns: 1fr; } }

.blog-skeleton {
  background: var(--bg-secondary);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.blog-skeleton-img {
  height: 200px;
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, rgba(255,255,255,0.03) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.blog-skeleton-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
.blog-skeleton-line {
  height: 14px;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, rgba(255,255,255,0.03) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.blog-skeleton-line.short { width: 35%; }
.blog-skeleton-line.med { width: 65%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Empty state ──────────────────────────────────────────── */
.blog-empty {
  text-align: center;
  padding: 5rem 2rem 4rem;
  color: var(--text-secondary);
}
.blog-empty h3 { color: var(--text-primary); font-size: 1.5rem; margin-bottom: 0.5rem; }

/* ─────────────────────────────────────────────────────────── */
/*   BLOG DETAIL PAGE                                          */
/* ─────────────────────────────────────────────────────────── */

/* ── Reading progress ─────────────────────────────────────── */
.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  z-index: 99999;
  transition: width 0.1s linear;
  border-radius: 0 2px 2px 0;
}

/* ── Cover ─────────────────────────────────────────────────── */
.blog-detail-cover {
  width: 100%;
  max-height: 480px;
  overflow: hidden;
  position: relative;
}

.blog-detail-cover-img {
  width: 100%;
  height: 480px;
  object-fit: cover;
  display: block;
}

.blog-detail-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 50%, var(--bg-primary) 100%);
}

/* ── Layout wrap ───────────────────────────────────────────── */
.blog-detail-wrap {
  max-width: 800px;
  padding-top: 2.5rem;
  padding-bottom: 5rem;
}

/* ── Back link ─────────────────────────────────────────────── */
.blog-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 2.5rem;
  padding: 0.5rem 1rem;
  border-radius: 99px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  transition: all 0.2s;
}

.blog-back-link:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: rgba(37,99,235,0.04);
}

/* ── Article ───────────────────────────────────────────────── */
.blog-article {
  margin-bottom: 4rem;
}

.blog-article-title {
  font-size: clamp(1.8rem, 4vw, 2.75rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--text-primary);
  margin: 0 0 1.5rem;
}

.blog-article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.blog-article-meta-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.blog-author-name { font-weight: 700; color: var(--text-primary); font-size: 0.9rem; }
.blog-author-sub  { font-size: 0.75rem; color: var(--text-secondary); }

.blog-divider {
  height: 1px;
  background: var(--border);
  margin: 2rem 0;
}

/* ── Prose ─────────────────────────────────────────────────── */
.blog-prose {
  margin-bottom: 3rem;
}

.blog-prose-para {
  font-size: 1.1rem;
  line-height: 1.85;
  color: var(--text-secondary);
  margin: 0 0 1.5rem;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* ── Reactions bar ─────────────────────────────────────────── */
.blog-reactions-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.25rem 1.5rem;
}

.blog-reactions-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.blog-reactions-btns {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.blog-reaction-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: 99px;
  border: 1.5px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
  position: relative;
  overflow: hidden;
}

.blog-reaction-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: rgba(37,99,235,0.05);
  transform: translateY(-2px);
}

.blog-reaction-btn.active {
  background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 18px rgba(37,99,235,0.35);
  transform: translateY(-2px);
}

.blog-reaction-btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.reaction-emoji { font-size: 1rem; }
.reaction-label { letter-spacing: 0.01em; }

.reaction-count {
  background: rgba(255,255,255,0.2);
  padding: 0.1rem 0.45rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 800;
  min-width: 20px;
  text-align: center;
}

.blog-reaction-btn:not(.active) .reaction-count {
  background: rgba(37,99,235,0.08);
  color: var(--accent-primary);
}

/* ── Comments section ──────────────────────────────────────── */
.blog-comments-section {
  margin-top: 0;
}

.blog-comments-header {
  margin-bottom: 2rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
}

.blog-comments-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

/* ── Comment form ──────────────────────────────────────────── */
.blog-comment-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
  align-items: flex-start;
}

.blog-comment-input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.blog-comment-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--bg-secondary);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}

.blog-comment-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}

.blog-comment-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-end;
  padding: 0.7rem 1.5rem;
  border-radius: 99px;
  border: none;
  background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(37,99,235,0.3);
}

.blog-comment-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.blog-comment-submit:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37,99,235,0.4);
}

/* ── Login prompt ──────────────────────────────────────────── */
.blog-comment-login-prompt {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 14px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 2.5rem;
}

/* ── Comment list ──────────────────────────────────────────── */
.blog-comment-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.blog-comment-item {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
}

.blog-comment-body {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1rem 1.25rem;
  transition: border-color 0.2s;
}

.blog-comment-body:hover {
  border-color: rgba(37,99,235,0.2);
}

.blog-comment-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.blog-comment-author {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.blog-comment-date {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.blog-comment-delete {
  margin-left: auto;
  padding: 0.25rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.blog-comment-body:hover .blog-comment-delete {
  opacity: 1;
}

.blog-comment-delete:hover {
  background: rgba(239,68,68,0.1);
  color: #ef4444;
}

.blog-comment-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.65;
}

.blog-comment-empty {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-secondary);
}

/* ── Link style ────────────────────────────────────────────── */
.blog-link {
  color: var(--accent-primary);
  font-weight: 700;
  text-decoration: none;
}
.blog-link:hover { text-decoration: underline; }

/* ── Loading skeletons (detail page) ──────────────────────── */
.blog-detail-loading { padding: 3rem 0 5rem; }
.blog-detail-skeleton { display: flex; flex-direction: column; gap: 1rem; }
.bds-line {
  height: 16px;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, rgba(255,255,255,0.03) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  width: 100%;
}
.bds-line-short  { width: 20%; }
.bds-line-title  { height: 48px; width: 80%; border-radius: 12px; }
.bds-line-meta   { width: 50%; }
.bds-img {
  height: 360px;
  border-radius: 20px;
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, rgba(255,255,255,0.03) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  margin: 1rem 0;
}

/* ============================================================
   END BLOG SYSTEM STYLES
   ============================================================ */
`;

const current = fs.readFileSync(cssFile, 'utf8');
fs.writeFileSync(cssFile, current + blogCSS, 'utf8');
console.log('Blog CSS appended successfully!');
