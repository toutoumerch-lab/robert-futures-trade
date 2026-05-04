import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import { Film, Paperclip, FileDown, Package, Link2, Lock, BookOpen, ChevronUp, ChevronDown, Play, ArrowLeft, Clock, Loader } from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Enrollment state
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get(`${import.meta.env.VITE_API_URL}/api/courses/${id}`, { headers })
      .then(res => {
        setCourse(res.data);
        // Auto-expand all modules
        const expanded = {};
        (res.data.modules || []).forEach(m => { expanded[m.id] = true; });
        setExpandedModules(expanded);
      })
      .catch(err => {
        console.error(err);
        navigate('/courses');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Check enrollment status when user is logged in
  useEffect(() => {
    if (user && token && id) {
      setCheckingEnrollment(true);
      axios.get(`${import.meta.env.VITE_API_URL}/api/enrollments/check/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setIsEnrolled(res.data.enrolled);
        })
        .catch(() => {
          setIsEnrolled(false);
        })
        .finally(() => setCheckingEnrollment(false));
    }
  }, [user, token, id]);

  // Handle enrollment / Checkout payment
  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/checkouts/create-session`,
        { courseId: parseInt(id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Backend bypasses Stripe if course is free
      if (res.data.freeBypass) {
        // Execute manual direct-enrollment because price <= 0
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/enrollments`,
          { courseId: parseInt(id) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast('Enrolled successfully for Free! Redirecting...', 'success');
        setIsEnrolled(true);
        setTimeout(() => {
          navigate(`/course/${id}/learn`);
        }, 800);
      } else if (res.data.url) {
        // Redirect to standard Stripe Session
        window.location.href = res.data.url;
      }
    } catch (err) {
      // It considers 409 naturally if backend was structured to throw it, but currently create-session might not.
      if (err.response?.status === 409) {
        setIsEnrolled(true);
        navigate(`/course/${id}/learn`);
      } else {
        showToast('Something went wrong preparing checkout. Please try again.', 'error');
        setEnrolling(false);
      }
    }
  };

  if (loading) return <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Course Environment...</div>;
  if (!course) return null;

  const hasModules = course.modules && course.modules.length > 0;
  const totalLessons = hasModules ? course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) : 0;

  // Get video to display: either active lesson video or course intro video
  const renderVideoEngine = () => {
    if (!isEnrolled && activeLesson && activeLesson.is_locked) {
      return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: 'white' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '50%', marginBottom: '1rem' }}>
              <Lock size={40} style={{ color: '#fff' }} />
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>This Lesson is Locked</h3>
            <p style={{ color: '#cbd5e1', marginBottom: '2rem', fontSize: '1.1rem' }}>Enroll in the course to unlock full access.</p>
            <Button 
              style={{ padding: '1rem 2rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)', border: 'none' }} 
              onClick={handleEnroll}
            >
              {enrolling ? 'Processing...' : 'Enroll Now to Access'}
            </Button>
          </div>
          {/* Dummy blurred background visual */}
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }} />
        </div>
      );
    }

    const videoUrl = activeLesson ? activeLesson.video_url : course.video_url;
    const videoFile = activeLesson ? activeLesson.video_file : course.video_file;

    if (videoFile) {
      return (
        <video 
          key={videoFile}
          controls 
          controlsList="nodownload"
          style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
          src={`${import.meta.env.VITE_API_URL}${videoFile}`}
        >
          Your browser does not support the video tag.
        </video>
      );
    } 
    
    if (videoUrl) {
      let embedUrl = videoUrl;
      if (embedUrl.includes('youtube.com/watch?v=')) {
        embedUrl = embedUrl.replace('watch?v=', 'embed/');
      } else if (embedUrl.includes('youtu.be/')) {
        embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
      }
      return (
        <iframe 
          key={embedUrl}
          title={activeLesson ? activeLesson.title : course.title}
          src={embedUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
        />
      );
    }

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))', color: 'var(--text-secondary)' }}>
        <Film size={48} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }} />
        <p style={{ fontWeight: 800 }}>{activeLesson ? 'No Video for This Lesson' : 'Video Content Not Attached'}</p>
      </div>
    );
  };

  // Render the enrollment button with proper states
  const renderEnrollButton = () => {
    // Not logged in
    if (!user) {
      return (
        <Button 
          style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800 }} 
          onClick={() => navigate('/login')}
        >
          Login to Enroll
        </Button>
      );
    }

    // Still checking enrollment status
    if (checkingEnrollment) {
      return (
        <Button 
          style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, opacity: 0.7 }} 
          disabled
        >
          <Loader size={18} className="spin-animation" style={{ marginRight: '8px' }} /> Checking...
        </Button>
      );
    }

    // Already enrolled → Go to Course
    if (isEnrolled) {
      return (
        <Button 
          style={{ 
            width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
          }} 
          onClick={() => navigate(`/course/${id}/learn`)}
        >
          <Play size={18} style={{ marginRight: '8px' }} /> Go to Course
        </Button>
      );
    }

    // Enrolling in progress
    if (enrolling) {
      return (
        <Button 
          style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, opacity: 0.8 }} 
          disabled
        >
          <Loader size={18} className="spin-animation" style={{ marginRight: '8px' }} /> Processing...
        </Button>
      );
    }

    // Default → Enroll Now
    return (
      <Button 
        style={{ 
          width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800,
          background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))',
          boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)'
        }} 
        onClick={handleEnroll}
      >
        Enroll Now
      </Button>
    );
  };

  return (
    <div style={{ padding: '0 0 6rem 0' }}>
       {/* Breadcrumbs Header */}
       <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '1.5rem 0' }}>
         <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <Button variant="outline" onClick={() => navigate('/courses')} style={{ padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem' }}><ArrowLeft size={14} /> Library</Button>
           {activeLesson && (
             <button 
               onClick={() => setActiveLesson(null)} 
               style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
             >
               <ArrowLeft size={14} /> Back to Intro
             </button>
           )}
         </div>
       </div>

       <div className="container" style={{ paddingTop: '3rem' }}>
         
         <div style={{ display: 'grid', gridTemplateColumns: hasModules ? 'minmax(0, 2fr) minmax(0, 1fr)' : 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2.5rem', alignItems: 'start' }} className="md:grid-cols-1 md:gap-2">
           
           {/* Main Content Area */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Video Canvas */}
              <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}>
                 {renderVideoEngine()}
              </div>

              {/* Now Playing Info */}
              {activeLesson ? (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', padding: '2.5rem' }}>
                   <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                     <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 12px', borderRadius: '99px', color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase' }}>Now Playing</span>
                     {activeLesson.duration && <span style={{ fontSize: '0.75rem', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: '99px', color: 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border)' }}><Clock size={12} /> {activeLesson.duration}</span>}
                   </div>
                   <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.5px' }}>{activeLesson.title}</h2>
                   {activeLesson.description && (
                     <>
                       <div style={{ height: '1px', width: '100%', background: 'var(--border)', marginBottom: '1.5rem' }} />
                       <div style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                          {activeLesson.description}
                       </div>
                     </>
                   )}

                   {/* Lesson Resources */}
                   {((activeLesson.pdf_url) || (activeLesson.zip_url) || (activeLesson.resources && activeLesson.resources.length > 0)) && (
                     <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                       <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}><Paperclip size={16} /> Lesson Resources</h4>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         {activeLesson.pdf_url && (
                           <a href={`${import.meta.env.VITE_API_URL}${activeLesson.pdf_url}`} target="_blank" rel="noreferrer" style={{
                             display: 'flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1.25rem',
                             background: 'var(--bg-primary)', borderRadius: '14px', border: '1px solid var(--border)',
                             textDecoration: 'none', color: '#8b5cf6', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s'
                           }}>
                             <FileDown size={16} /> Download PDF
                           </a>
                         )}
                         {activeLesson.zip_url && (
                           <a href={`${import.meta.env.VITE_API_URL}${activeLesson.zip_url}`} target="_blank" rel="noreferrer" style={{
                             display: 'flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1.25rem',
                             background: 'var(--bg-primary)', borderRadius: '14px', border: '1px solid var(--border)',
                             textDecoration: 'none', color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s'
                           }}>
                             <Package size={16} /> Download ZIP Bundle
                           </a>
                         )}
                         {(activeLesson.resources || []).map((r, i) => (
                           <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{
                             display: 'flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1.25rem',
                             background: 'var(--bg-primary)', borderRadius: '14px', border: '1px solid var(--border)',
                             textDecoration: 'none', color: '#10b981', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s'
                           }}>
                             <Link2 size={16} /> {r.label}
                           </a>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              ) : (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', padding: '3rem' }}>
                   <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '6px 14px', borderRadius: '99px', color: 'var(--accent-primary)', fontWeight: 800, border: '1px solid var(--border)', textTransform: 'uppercase' }}>{course.category}</span>
                      {course.is_free && <span style={{ fontSize: '0.8rem', background: '#10b981', padding: '6px 14px', borderRadius: '99px', color: '#fff', fontWeight: 800 }}>FREE</span>}
                   </div>
                   
                   <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: 1.2, letterSpacing: '-1px' }}>{course.title}</h1>
                   
                   <div style={{ height: '1px', width: '100%', background: 'var(--border)', marginBottom: '2rem' }} />

                   <div style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {course.description}
                   </div>
                </div>
              )}

           </div>

           {/* Sidebar */}
           <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             
             {/* Payment & Enroll Logic */}
             <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', padding: '2rem', boxShadow: '0 15px 35px -5px rgba(0,0,0,0.1)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>Course Access</h4>
                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1.5rem', letterSpacing: '-2px' }}>
                  {course.is_free ? 'FREE' : `$${course.price}`}
                </div>

                {renderEnrollButton()}
             </div>

             {/* Course Blueprint */}
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
                  {hasModules && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '1.25rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Modules</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{course.modules.length}</span>
                    </div>
                  )}
                  {totalLessons > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '1.25rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Lessons</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{totalLessons}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Category</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{course.category || 'General'}</span>
                  </div>
                </div>
             </div>

             {/* Course Content Sidebar - Module/Lesson Navigator */}
             {hasModules && (
               <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', padding: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
                 <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={18} /> Course Content</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   {course.modules.map((mod, modIdx) => {
                     const isExpanded = expandedModules[mod.id];
                     return (
                       <div key={mod.id}>
                         <div 
                           onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                           style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem', cursor: 'pointer', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', userSelect: 'none' }}
                         >
                           <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.7rem', flexShrink: 0 }}>{modIdx + 1}</span>
                           <span style={{ flex: 1, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{mod.title}</span>
                           <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{mod.lessons?.length || 0}</span>
                           <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                         </div>
                         {isExpanded && mod.lessons && mod.lessons.length > 0 && (
                           <div style={{ marginLeft: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                             {mod.lessons.map((lesson, lIdx) => {
                               const isActive = activeLesson?.id === lesson.id;
                               return (
                                 <button 
                                   key={lesson.id}
                                   onClick={() => setActiveLesson(lesson)}
                                   style={{
                                     display: 'flex', alignItems: 'center', gap: '8px',
                                     padding: '0.6rem 0.75rem', borderRadius: '10px', border: 'none',
                                     background: isActive ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))' : 'transparent',
                                     cursor: 'pointer', width: '100%', textAlign: 'left',
                                     transition: 'all 0.15s'
                                   }}
                                 >
                                   <span style={{ width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0, background: isActive ? '#3b82f6' : 'var(--border)', color: isActive ? '#fff' : 'var(--text-secondary)' }}>{lIdx + 1}</span>
                                   <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#3b82f6' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</span>
                                   {(!isEnrolled && lesson.is_locked) ? (
                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}><Lock size={12} /></span>
                                   ) : (
                                      (lesson.video_url || lesson.video_file) && <span style={{ fontSize: '0.65rem', color: '#3b82f6' }}><Play size={10} fill="#3b82f6" /></span>
                                   )}
                                 </button>
                               );
                             })}
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}

             {/* PDF Downloads Module (course-level) */}
             {course.pdf_url && !activeLesson && (
               <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', padding: '2rem' }}>
                  <FileDown size={32} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>Course Resources</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Download the official study guide & cheat sheet.</p>
                  
                  {user ? (
                    <a href={`${import.meta.env.VITE_API_URL}${course.pdf_url}`} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                      <Button style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontWeight: 800 }}>Download PDF</Button>
                    </a>
                  ) : (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                      <Lock size={16} /> Login to download
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
