import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/courses/${id}`)
      .then(res => setCourse(res.data))
      .catch(err => {
        console.error(err);
        navigate('/courses');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Course Environment...</div>;
  if (!course) return null;

  // Render video logic optimally
  const renderVideoEngine = () => {
    if (course.video_file) {
      return (
        <video 
          controls 
          controlsList="nodownload"
          style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
          src={`http://localhost:5000${course.video_file}`}
        >
          Your browser does not support the video tag.
        </video>
      );
    } 
    
    if (course.video_url) {
      // Basic youtube/vimeo assumption formatting
      let embedUrl = course.video_url;
      if (embedUrl.includes('youtube.com/watch?v=')) {
        embedUrl = embedUrl.replace('watch?v=', 'embed/');
      } else if (embedUrl.includes('youtu.be/')) {
        embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
      }
      return (
        <iframe 
          title={course.title}
          src={embedUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
        />
      );
    }

    // Fallback if no video format is loaded
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎬</div>
        <p style={{ fontWeight: 800 }}>Video Content Not Attached</p>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 0 6rem 0' }}>
       {/* Breadcrumbs Header */}
       <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '1.5rem 0' }}>
         <div className="container">
           <Button variant="outline" onClick={() => navigate('/courses')} style={{ padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem' }}>← Library</Button>
         </div>
       </div>

       <div className="container" style={{ paddingTop: '3rem' }}>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '4rem', alignItems: 'start' }} className="md:grid-cols-1 md:gap-2">
           
           {/* Navigation Left Content */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Massive 16:9 Video Canvas */}
              <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}>
                 {renderVideoEngine()}
              </div>

              {/* Title & Description Flow */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', padding: '3rem' }}>
                 <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '6px 14px', borderRadius: '99px', color: 'var(--accent-purple)', fontWeight: 800, border: '1px solid var(--border)', textTransform: 'uppercase' }}>{course.category}</span>
                    {course.is_free && <span style={{ fontSize: '0.8rem', background: '#10b981', padding: '6px 14px', borderRadius: '99px', color: '#fff', fontWeight: 800 }}>FREE</span>}
                 </div>
                 
                 <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: 1.2, letterSpacing: '-1px' }}>{course.title}</h1>
                 
                 <div style={{ height: '1px', width: '100%', background: 'var(--border)', marginBottom: '2rem' }} />

                 <div style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {course.description}
                 </div>
              </div>

           </div>

           {/* Sidebar Right Info Module */}
           <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             
             {/* Payment & Enroll Logic */}
             <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', padding: '2rem', boxShadow: '0 15px 35px -5px rgba(0,0,0,0.1)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>Course Access</h4>
                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1.5rem', letterSpacing: '-2px' }}>
                  {course.is_free ? 'FREE' : `$${course.price}`}
                </div>

                {!user && !course.is_free ? (
                   <Button style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800 }} onClick={() => navigate('/login')}>Login to Enroll</Button>
                ) : (
                   <Button style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))', boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)' }} onClick={() => alert("Enrollment processing logic to tie to your Stripe or access tables.")}>Enroll Now</Button>
                )}
             </div>

             {/* Meta Details List */}
             <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', padding: '2rem' }}>
                <h4 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>Course Blueprint</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '1.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Level</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{course.level || 'Beginner'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '1.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Duration</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{course.duration || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Category</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{course.category || 'General'}</span>
                  </div>
                </div>
             </div>

             {/* PDF Downloads Module */}
             {course.pdf_url && (
               <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', padding: '2rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>Course Resources</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Download the official study guide & cheat sheet.</p>
                  
                  {user ? (
                    <a href={`http://localhost:5000${course.pdf_url}`} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                      <Button style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontWeight: 800 }}>Download PDF</Button>
                    </a>
                  ) : (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                      🔒 Login to download
                    </div>
                  )}
               </div>
             )}

           </div>

         </div>
       </div>
    </div>
  );
};

export default CourseDetail;
