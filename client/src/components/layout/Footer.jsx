import { useBranding } from '../../context/BrandingContext';

const Footer = () => {
  const { siteName } = useBranding();
  
  return (
    <footer className="glass" style={{ padding: '3rem 0', marginTop: 'auto', borderTop: '1px solid var(--border-color)' }}>
      <div className="container flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="nav-brand flex items-center gap-2 mb-4">
            <span className="text-gradient">{siteName}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '300px' }}>
            Empowering traders with premium education, insights, and prop firm comparisons.
          </p>
        </div>
        <div className="flex gap-8">
          <div className="flex-col gap-2">
            <h4 className="mb-4">Resources</h4>
            <a href="/courses">Courses</a>
            <a href="/prop-firms">Prop Firms</a>
            <a href="/blog">Blog</a>
          </div>
          <div className="flex-col gap-2">
            <h4 className="mb-4">Company</h4>
            <a href="#">About</a>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </div>
      <div className="container mt-8" style={{ textAlign: 'center', color: 'var(--text-secondary)', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
