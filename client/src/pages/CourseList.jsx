import React, { useState, useEffect, useRef } from 'react';
import SEO from '../components/common/SEO';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import {
  BookOpen, SearchX, Bookmark, Clock, ArrowRight,
  Search, X, Loader, LayoutGrid, List,
  ChevronLeft, ChevronRight, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COURSES_PER_PAGE = 6;

/* ─── tiny view-toggle button ─────────────────────────────────── */
const ViewBtn = ({ active, onClick, children, title }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '36px', height: '36px', borderRadius: '10px',
      border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
      background: active ? 'rgba(37,99,235,0.12)' : 'var(--bg-secondary)',
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      cursor: 'pointer', transition: 'all 0.2s',
    }}
  >
    {children}
  </button>
);

/* ─── pagination button ─────────────────────────────────────────── */
const PageBtn = ({ active, disabled, onClick, children }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    style={{
      minWidth: '36px', height: '36px', padding: '0 10px',
      borderRadius: '10px', fontWeight: 800, fontSize: '0.82rem',
      border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
      background: active ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'var(--bg-secondary)',
      color: active ? '#fff' : disabled ? 'rgba(161,161,170,0.4)' : 'var(--text-secondary)',
      cursor: disabled ? 'default' : 'pointer',
      transition: 'all 0.2s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
    }}
  >
    {children}
  </button>
);

/* ─── Star rating badge ─────────────────────────────────────────── */
const StarBadge = ({ ratings, courseId }) => {
  const r = ratings?.[courseId];
  if (!r) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b' }}>
      <Star size={11} fill="#f59e0b" />
      <span>{r.avg.toFixed(1)}</span>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>({r.count})</span>
    </div>
  );
};

/* ─── Course card — GRID mode ───────────────────────────────────── */
const GridCard = ({ course, navigate, ratings }) => (
  <div
    onClick={() => navigate(`/courses/${course.id}`)}
    style={{
      background: 'var(--bg-secondary)', borderRadius: '20px',
      overflow: 'hidden', border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      boxShadow: '0 6px 24px -8px rgba(0,0,0,0.2)', cursor: 'pointer',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 20px 40px -8px rgba(59,130,246,0.2)';
      e.currentTarget.style.borderColor = 'var(--accent-primary)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 6px 24px -8px rgba(0,0,0,0.2)';
      e.currentTarget.style.borderColor = 'var(--border)';
    }}
  >
    {/* Thumbnail */}
    <div style={{
      height: '200px', width: '100%', position: 'relative',
      backgroundImage: course.image_url
        ? `url(${import.meta.env.VITE_API_URL}${course.image_url})`
        : 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.02))',
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{ position:'absolute', top:'12px', left:'12px', background:'rgba(0,0,0,0.52)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.12)', padding:'3px 10px', borderRadius:'99px', color:'#fff', fontWeight:700, fontSize:'0.68rem', display:'flex', alignItems:'center', gap:'5px' }}>
        <Bookmark size={10}/> {course.category || 'General'}
      </div>
      <div style={{ position:'absolute', top:'12px', right:'12px', background: course.is_free ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', border: course.is_free ? 'none' : '1px solid rgba(255,255,255,0.12)', padding:'4px 12px', borderRadius:'99px', color:'#fff', fontWeight:800, fontSize:'0.78rem' }}>
        {course.is_free ? 'FREE' : `$${course.price}`}
      </div>
    </div>
    {/* Body */}
    <div style={{ padding:'1.5rem', flex:1, display:'flex', flexDirection:'column', gap:'0.5rem' }}>
      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:'0.68rem', background:'var(--bg-primary)', padding:'3px 10px', borderRadius:'99px', color:'var(--accent-primary)', fontWeight:800, border:'1px solid var(--border)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{course.level || 'Beginner'}</span>
        <span style={{ fontSize:'0.68rem', background:'var(--bg-primary)', padding:'3px 10px', borderRadius:'99px', color:'var(--text-secondary)', fontWeight:700, border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'4px' }}><Clock size={10}/> {course.duration || 'N/A'}</span>
        <StarBadge ratings={ratings} courseId={course.id} />
      </div>
      <h3 style={{ margin:0, fontSize:'1.15rem', fontWeight:900, color:'var(--text-primary)', lineHeight:1.3, letterSpacing:'-0.3px' }}>{course.title}</h3>
      <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem', lineHeight:1.6, margin:0, flex:1 }}>{course.description && course.description.length > 110 ? course.description.substring(0,110)+'...' : course.description}</p>
      <div style={{ marginTop:'0.75rem' }}>
        <Button style={{ width:'100%', padding:'0.75rem', borderRadius:'12px', fontSize:'0.88rem', fontWeight:800, background:'linear-gradient(135deg,var(--accent-secondary),var(--accent-primary))', boxShadow:'0 6px 16px rgba(37,99,235,0.3)' }}>
          View Course <ArrowRight size={13}/>
        </Button>
      </div>
    </div>
  </div>
);

/* ─── Course card — LIST mode ───────────────────────────────────── */
const ListCard = ({ course, navigate, ratings }) => (
  <div
    onClick={() => navigate(`/courses/${course.id}`)}
    style={{
      background:'var(--bg-secondary)', borderRadius:'18px',
      overflow:'hidden', border:'1px solid var(--border)',
      display:'flex', flexDirection:'row',
      transition:'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      boxShadow:'0 4px 18px -6px rgba(0,0,0,0.18)', cursor:'pointer', minHeight:'150px',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 14px 32px -6px rgba(59,130,246,0.18)';
      e.currentTarget.style.borderColor = 'var(--accent-primary)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 18px -6px rgba(0,0,0,0.18)';
      e.currentTarget.style.borderColor = 'var(--border)';
    }}
  >
    {/* Thumbnail */}
    <div style={{
      width:'220px', minWidth:'220px', flexShrink:0, position:'relative',
      backgroundImage: course.image_url
        ? `url(${import.meta.env.VITE_API_URL}${course.image_url})`
        : 'linear-gradient(135deg,var(--bg-tertiary),rgba(255,255,255,0.02))',
      backgroundSize:'cover', backgroundPosition:'center',
    }}>
      <div style={{ position:'absolute', top:'10px', left:'10px', background:'rgba(0,0,0,0.52)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.12)', padding:'2px 9px', borderRadius:'99px', color:'#fff', fontWeight:700, fontSize:'0.65rem', display:'flex', alignItems:'center', gap:'4px' }}>
        <Bookmark size={9}/> {course.category || 'General'}
      </div>
      <div style={{ position:'absolute', top:'10px', right:'10px', background: course.is_free ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', border: course.is_free ? 'none' : '1px solid rgba(255,255,255,0.12)', padding:'3px 10px', borderRadius:'99px', color:'#fff', fontWeight:800, fontSize:'0.75rem' }}>
        {course.is_free ? 'FREE' : `$${course.price}`}
      </div>
    </div>
    {/* Content */}
    <div style={{ padding:'1.25rem 1.75rem', flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:'0.4rem' }}>
      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:'0.65rem', background:'var(--bg-primary)', padding:'3px 10px', borderRadius:'99px', color:'var(--accent-primary)', fontWeight:800, border:'1px solid var(--border)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{course.level || 'Beginner'}</span>
        <span style={{ fontSize:'0.65rem', background:'var(--bg-primary)', padding:'3px 10px', borderRadius:'99px', color:'var(--text-secondary)', fontWeight:700, border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'3px' }}><Clock size={10}/> {course.duration || 'N/A'}</span>
        <StarBadge ratings={ratings} courseId={course.id} />
      </div>
      <h3 style={{ margin:0, fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)', lineHeight:1.3, letterSpacing:'-0.3px' }}>{course.title}</h3>
      <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', lineHeight:1.6, margin:0 }}>{course.description && course.description.length > 160 ? course.description.substring(0,160)+'...' : course.description}</p>
      <div style={{ marginTop:'0.5rem' }}>
        <Button style={{ padding:'0.55rem 1.5rem', borderRadius:'10px', fontSize:'0.85rem', fontWeight:800, background:'linear-gradient(135deg,var(--accent-secondary),var(--accent-primary))', boxShadow:'0 5px 14px rgba(37,99,235,0.3)' }}>
          View Course <ArrowRight size={12}/>
        </Button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */
const CourseList = () => {
  const [courses, setCourses]               = useState([]);
  const [categories, setCategories]         = useState([]);
  const [ratings, setRatings]               = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading]               = useState(true);
  const [viewMode, setViewMode]             = useState('list');   // 'list' | 'grid'
  const [currentPage, setCurrentPage]       = useState(1);

  // Search states
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [isSearching, setIsSearching]       = useState(false);
  const [hasQueried, setHasQueried]         = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);
  const searchContainerRef = useRef(null);

  const { user } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/courses`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/categories`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/reviews/course-ratings`),
    ]).then(([coursesRes, categoriesRes, ratingsRes]) => {
      setCourses(coursesRes.data);
      setCategories(categoriesRes.data || []);
      setRatings(ratingsRes.data || {});
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]); setIsSearching(false);
      setHasQueried(false); setShowDropdown(false);
      return;
    }
    setIsSearching(true); setHasQueried(true); setShowDropdown(true);
    const timeout = setTimeout(() => {
      axios.get(`${import.meta.env.VITE_API_URL}/api/courses/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => setSearchResults(res.data))
        .catch(err => console.error('Search error:', err))
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset page on filter/category change
  useEffect(() => { setCurrentPage(1); }, [selectedCategory]);

  const filteredCourses = selectedCategory === 'All'
    ? courses
    : courses.filter(c => c.category === selectedCategory);

  // Pagination
  const totalPages   = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const pageStart    = (currentPage - 1) * COURSES_PER_PAGE;
  const pageCourses  = filteredCourses.slice(pageStart, pageStart + COURSES_PER_PAGE);

  const goToPage = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 420, behavior: 'smooth' });
  };

  // Build page number array with ellipsis
  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (currentPage > 3)  pages.push('...');
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) pages.push(p);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  })();

  return (
    <div>
      <SEO
        title="Futures Trading Courses — Learn to Trade Like a Pro"
        description="Explore Robert Trades' futures trading courses. From beginner fundamentals to advanced strategies — step-by-step video lessons built for results."
        url="/courses"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Futures Trading Courses by Robert Trades',
          url: 'https://roberttrades.com/courses',
        }}
      />
      {/* ── Hero Banner ──────────────────────────────────────────── */}
      <section className="page-hero" style={{ padding: '6rem 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(37,99,235,0.05) 0%, transparent 100%)', zIndex: 0 }} />
        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.25rem', fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text-primary)' }}>
            Trading Education <span className="text-gradient">Library</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem auto', fontSize: '1.15rem', lineHeight: 1.6 }}>
            Structured, in-depth frameworks engineered by Robert — scaling from fundamental price action structures directly to advanced prop firm liquidity management.
          </p>

          {/* ── Search bar ─────────────────────────────────────────── */}
          <div ref={searchContainerRef} style={{ position: 'relative', maxWidth: '640px', margin: '0 auto', zIndex: 50 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={20} style={{ position: 'absolute', left: '18px', color: 'var(--text-secondary)', zIndex: 1, flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search masterclasses, strategies, concepts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => { if (hasQueried) setShowDropdown(true); }}
                style={{ width: '100%', padding: '1.1rem 3rem 1.1rem 3.25rem', borderRadius: '99px', border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', transition: 'all 0.25s', boxShadow: '0 8px 25px rgba(0,0,0,0.2)' }}
                onFocusCapture={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlurCapture={e  => e.target.style.borderColor = 'var(--border)'}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowDropdown(false); }} style={{ position: 'absolute', right: '18px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '50%' }}>
                  <X size={18}/>
                </button>
              )}
            </div>

            {/* Suggestions dropdown */}
            {showDropdown && hasQueried && (
              <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, right: 0, background: 'var(--bg-primary)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden', textAlign: 'left' }}>
                {isSearching ? (
                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }}/> Searching courses...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div style={{ padding: '0.75rem 1.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Top Results</div>
                    {searchResults.map(res => (
                      <div
                        key={res.id}
                        onClick={() => { setSearchQuery(''); setShowDropdown(false); navigate(`/courses/${res.id}`); }}
                        style={{ padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'background 0.15s', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: res.image_url ? `url(${import.meta.env.VITE_API_URL}${res.image_url}) center/cover` : 'var(--bg-secondary)', flexShrink: 0, border: '1px solid var(--border)' }}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{res.category || 'General'} · {res.level || 'Beginner'} · {res.is_free ? 'FREE' : `$${res.price}`}</div>
                        </div>
                        <ArrowRight size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }}/>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    <SearchX size={20}/>
                    No courses found for "<strong style={{ color: 'var(--text-primary)' }}>{searchQuery}</strong>"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: '6rem' }}>

        {/* ── Category filters ────────────────────────────────────── */}
        {!loading && courses.length > 0 && categories.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }} className="scrollbar-hide">
            {[{ id: 'all', name: 'All Masterclasses' }, ...categories].map(cat => {
              const name  = cat.id === 'all' ? 'All' : cat.name;
              const label = cat.id === 'all' ? 'All Masterclasses' : cat.name;
              const isAct = selectedCategory === name;
              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => setSelectedCategory(name)}
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '99px', fontWeight: 800, whiteSpace: 'nowrap', background: isAct ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: isAct ? '#fff' : 'var(--text-secondary)', border: isAct ? 'none' : '1px solid var(--border)', transition: 'all 0.2s', boxShadow: isAct ? '0 4px 15px rgba(37,99,235,0.3)' : 'none', cursor: 'pointer' }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Toolbar: count + view toggle ────────────────────────── */}
        {!loading && filteredCourses.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{Math.min(pageStart + COURSES_PER_PAGE, filteredCourses.length)}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{filteredCourses.length}</strong> courses
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <ViewBtn active={viewMode === 'list'} onClick={() => setViewMode('list')} title="List view">
                <List size={16}/>
              </ViewBtn>
              <ViewBtn active={viewMode === 'grid'} onClick={() => setViewMode('grid')} title="Grid view">
                <LayoutGrid size={16}/>
              </ViewBtn>
            </div>
          </div>
        )}

        {/* ── States ──────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading course matrix…</div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-secondary)', borderRadius: '32px', border: '1px dashed var(--border)', maxWidth: '800px', margin: '0 auto' }}>
            <BookOpen size={48} style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}/>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Coming Soon</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Premium courses are actively being compiled. Check back within 48 hours.</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <SearchX size={40} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}/>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.5rem' }}>No modules found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>We couldn't locate any active courses strictly tagged under "{selectedCategory}".</p>
            <Button style={{ marginTop: '1.5rem' }} variant="outline" onClick={() => setSelectedCategory('All')}>Clear Filters</Button>
          </div>
        ) : (
          <>
            {/* ── Course list/grid ─────────────────────────────────── */}
            {viewMode === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pageCourses.map(course => (
                  <ListCard key={course.id} course={course} navigate={navigate} ratings={ratings}/>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {pageCourses.map(course => (
                  <GridCard key={course.id} course={course} navigate={navigate} ratings={ratings}/>
                ))}
              </div>
            )}

            {/* ── Pagination ───────────────────────────────────────── */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '3rem', flexWrap: 'wrap' }}>
                {/* Prev */}
                <PageBtn disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                  <ChevronLeft size={14}/> Prev
                </PageBtn>

                {/* Page numbers */}
                {pageNumbers.map((p, i) =>
                  p === '...'
                    ? <span key={`e${i}`} style={{ color: 'var(--text-secondary)', padding: '0 4px', fontSize: '0.9rem' }}>…</span>
                    : <PageBtn key={p} active={p === currentPage} onClick={() => goToPage(p)}>{p}</PageBtn>
                )}

                {/* Next */}
                <PageBtn disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
                  Next <ChevronRight size={14}/>
                </PageBtn>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CourseList;
