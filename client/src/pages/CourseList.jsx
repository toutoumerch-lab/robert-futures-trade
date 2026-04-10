import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { BookOpen, SearchX, Bookmark, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:5000/api/courses'),
      axios.get('http://localhost:5000/api/categories')
    ])
      .then(([coursesRes, categoriesRes]) => {
        setCourses(coursesRes.data);
        setCategories(categoriesRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = selectedCategory === 'All' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

  return (
    <div>
      {/* Hero Banner */}
      <section className="page-hero" style={{ padding: '6rem 0', position: 'relative', overflow: 'hidden' }}>
        <div className="page-hero-bg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.05) 0%, transparent 100%)', zIndex: 0 }} />
        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.25rem', fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text-primary)' }}>
            Trading Education <span className="text-gradient">Library</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.15rem', lineHeight: 1.6 }}>
            Structured, in-depth frameworks engineered by Robert — scaling from fundamental price action structures directly to advanced prop firm liquidity management.
          </p>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: '6rem' }}>
        
        {/* Category Filters Matrix */}
        {!loading && courses.length > 0 && categories.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }} className="scrollbar-hide">
             <button 
               onClick={() => setSelectedCategory('All')}
               style={{ 
                 padding: '0.6rem 1.5rem', 
                 borderRadius: '99px', 
                 fontWeight: 800, 
                 whiteSpace: 'nowrap',
                 background: selectedCategory === 'All' ? 'var(--accent-primary)' : 'var(--bg-secondary)', 
                 color: selectedCategory === 'All' ? '#fff' : 'var(--text-secondary)',
                 border: selectedCategory === 'All' ? 'none' : '1px solid var(--border)',
                 transition: 'all 0.2s',
                 boxShadow: selectedCategory === 'All' ? '0 4px 15px rgba(37, 99, 235, 0.3)' : 'none'
               }}
             >
               All Masterclasses
             </button>
             {categories.map(cat => (
               <button 
                 key={cat.id || cat.name}
                 onClick={() => setSelectedCategory(cat.name)}
                 style={{ 
                   padding: '0.6rem 1.5rem', 
                   borderRadius: '99px', 
                   fontWeight: 800, 
                   whiteSpace: 'nowrap',
                   background: selectedCategory === cat.name ? 'var(--accent-primary)' : 'var(--bg-secondary)', 
                   color: selectedCategory === cat.name ? '#fff' : 'var(--text-secondary)',
                   border: selectedCategory === cat.name ? 'none' : '1px solid var(--border)',
                   transition: 'all 0.2s',
                   boxShadow: selectedCategory === cat.name ? '0 4px 15px rgba(37, 99, 235, 0.3)' : 'none'
                 }}
               >
                 {cat.name}
               </button>
             ))}
          </div>
        )}

        {loading ? (
          <div className="loading-state" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading course matrix…</div>
        ) : courses.length === 0 ? (
          <div className="empty-state-page" style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-secondary)', borderRadius: '32px', border: '1px dashed var(--border)', maxWidth: '800px', margin: '0 auto' }}>
            <BookOpen size={48} style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }} />
            <h3 className="mb-2" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Coming Soon</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Premium courses are actively being compiled. Check back within 48 hours.</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)' }}>
             <SearchX size={40} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }} />
             <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.5rem' }}>No modules found</h3>
             <p style={{ color: 'var(--text-secondary)' }}>We couldn't locate any active courses strictly tagged under "{selectedCategory}".</p>
             <Button style={{ marginTop: '1.5rem' }} variant="outline" onClick={() => setSelectedCategory('All')}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => (
                 <div 
                   key={course.id} 
                   onClick={() => navigate(`/courses/${course.id}`)}
                   style={{ 
                     background: 'var(--bg-secondary)', 
                     borderRadius: '24px', 
                     overflow: 'hidden', 
                     border: '1px solid var(--border)', 
                     display: 'flex', 
                     flexDirection: 'column', 
                     transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                     boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)',
                     cursor: 'pointer'
                   }} 
                   className="hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.15)] hover:border-[var(--accent-primary)]"
                 >
                   <div style={{ height: '220px', width: '100%', background: course.image_url ? `url(http://localhost:5000${course.image_url}) center/cover` : 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.02))', position: 'relative' }}>
                     <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '99px', color: 'white', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bookmark size={12} /> {course.category || 'General'}
                     </div>
                     <div style={{ position: 'absolute', top: '16px', right: '16px', background: course.is_free ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))', border: course.is_free ? 'none' : '1px solid var(--border)', padding: '6px 16px', borderRadius: '99px', color: course.is_free ? 'white' : 'var(--text-primary)', fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                       {course.is_free ? 'FREE' : `$${course.price}`}
                     </div>
                   </div>
                   <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                     <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                       <span style={{ fontSize: '0.75rem', background: 'var(--bg-primary)', padding: '6px 14px', borderRadius: '99px', color: 'var(--accent-primary)', fontWeight: 800, border: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{course.level || 'Beginner'}</span>
                       <span style={{ fontSize: '0.75rem', background: 'var(--bg-primary)', padding: '6px 14px', borderRadius: '99px', color: 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {course.duration || 'N/A'}</span>
                     </div>
                     <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.5px' }}>{course.title}</h3>
                     <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem', flex: 1 }}>{course.description && course.description.length > 120 ? course.description.substring(0, 120) + '...' : course.description}</p>
                     
                     <div style={{ marginTop: 'auto' }}>
                       <Button style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)' }}>
                         View Course <ArrowRight size={14} />
                       </Button>
                     </div>
                   </div>
                 </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
