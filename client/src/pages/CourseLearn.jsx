import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Film, Paperclip, FileDown, Package, Link2, BookOpen, ChevronUp, ChevronDown, Play, ArrowLeft, Clock, Loader, Shield, CheckCircle, Check } from 'lucide-react';

const CourseLearn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [completedLessons, setCompletedLessons] = useState([]);
  const [togglingProgress, setTogglingProgress] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        // Step 1: Verify enrollment
        if (!user || !token) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        const enrollCheck = await axios.get(
          `http://localhost:5000/api/enrollments/check/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!enrollCheck.data.enrolled) {
          setAccessDenied(true);
          setLoading(false);
          return;
        } else {
          let cl = enrollCheck.data.enrollment?.completed_lessons || [];
          if (typeof cl === 'string') cl = JSON.parse(cl);
          setCompletedLessons(cl);
        }

        // Step 2: Fetch course data
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`);
        setCourse(res.data);

        // Auto-expand all modules
        const expanded = {};
        (res.data.modules || []).forEach(m => { expanded[m.id] = true; });
        setExpandedModules(expanded);

        // Auto-select first lesson
        if (res.data.modules && res.data.modules.length > 0) {
          const firstModule = res.data.modules[0];
          if (firstModule.lessons && firstModule.lessons.length > 0) {
            setActiveLesson(firstModule.lessons[0]);
          }
        }
      } catch (err) {
        console.error('Error loading course:', err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id, user, token]);

  // --- Access Denied Screen ---
  if (accessDenied) {
    return (
      <div className="learn-access-denied">
        <div className="learn-access-denied__card">
          <Shield size={48} className="learn-access-denied__icon" />
          <h2>Access Restricted</h2>
          <p>You need to be enrolled in this course to access the learning content.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/courses/${id}`)} style={{ marginTop: '1.5rem', padding: '0.85rem 2rem', borderRadius: '14px', fontWeight: 800 }}>
            Go to Course Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <Loader size={32} className="spin-animation" />
        <span style={{ marginLeft: '1rem', fontWeight: 700 }}>Loading Learning Environment...</span>
      </div>
    );
  }

  if (!course) return null;

  const hasModules = course.modules && course.modules.length > 0;

  // --- Video Renderer ---
  const renderVideo = () => {
    const videoFile = activeLesson?.video_file;
    const videoUrl = activeLesson?.video_url;

    if (videoFile) {
      return (
        <video
          key={videoFile}
          controls
          autoPlay
          controlsList="nodownload"
          className="learn-video__player"
          src={`http://localhost:5000${videoFile}`}
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
          title={activeLesson?.title || course.title}
          src={embedUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="learn-video__player"
        />
      );
    }

    return (
      <div className="learn-video__empty">
        <Film size={48} />
        <p>No video for this lesson</p>
      </div>
    );
  };

  const toggleLessonStatus = async () => {
    if (!activeLesson) return;
    setTogglingProgress(true);
    const isCompleted = completedLessons.includes(activeLesson.id);
    try {
      const res = await axios.post(`http://localhost:5000/api/enrollments/progress`, {
        courseId: parseInt(id),
        lessonId: activeLesson.id,
        completed: !isCompleted
      }, { headers: { Authorization: `Bearer ${token}` } });
      let cl = res.data.completed_lessons || [];
      if (typeof cl === 'string') cl = JSON.parse(cl);
      setCompletedLessons(cl);
    } catch (err) {
      console.error(err);
      showToast('Error updating progress', 'error');
    } finally {
      setTogglingProgress(false);
    }
  };

  // Flattened lesson list for prev/next navigation
  const allLessons = hasModules
    ? course.modules.flatMap(m => m.lessons || [])
    : [];
  const currentIdx = allLessons.findIndex(l => l.id === activeLesson?.id);

  return (
    <div className="learn-page">
      {/* Top Bar */}
      <div className="learn-topbar">
        <button className="learn-topbar__back" onClick={() => navigate(`/courses/${id}`)}>
          <ArrowLeft size={16} /> Back to Course
        </button>
        <h3 className="learn-topbar__title">{course.title}</h3>
        <div className="learn-topbar__progress" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {currentIdx >= 0 && (
            <span className="learn-topbar__counter" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Lesson {currentIdx + 1} of {allLessons.length}
            </span>
          )}
          <div style={{ width: '150px', height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ height: '100%', width: `${Math.round((completedLessons.length / Math.max(allLessons.length, 1)) * 100)}%`, background: '#10b981', transition: 'width 0.3s ease' }}></div>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981' }}>{Math.round((completedLessons.length / Math.max(allLessons.length, 1)) * 100)}%</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="learn-layout">

        {/* Video + Lesson Info Area */}
        <div className="learn-main">
          {/* Video Container */}
          <div className="learn-video">
            {renderVideo()}
          </div>

          {/* Lesson Info */}
          {activeLesson && (
            <div className="learn-lesson-info">
              <div className="learn-lesson-info__header">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <span className="learn-badge learn-badge--playing">Now Playing</span>
                  {activeLesson.duration && (
                    <span className="learn-badge learn-badge--meta"><Clock size={12} /> {activeLesson.duration}</span>
                  )}
                </div>
                <h2 className="learn-lesson-info__title">{activeLesson.title}</h2>
                {activeLesson.description && (
                  <p className="learn-lesson-info__desc">{activeLesson.description}</p>
                )}
              </div>

              {/* Resources */}
              {((activeLesson.pdf_url) || (activeLesson.zip_url) || (activeLesson.resources && activeLesson.resources.length > 0)) && (
                <div className="learn-lesson-resources">
                  <h4><Paperclip size={16} /> Lesson Resources</h4>
                  <div className="learn-lesson-resources__list">
                    {activeLesson.pdf_url && (
                      <a href={`http://localhost:5000${activeLesson.pdf_url}`} target="_blank" rel="noreferrer" className="learn-resource-link learn-resource-link--pdf">
                        <FileDown size={16} /> Download PDF
                      </a>
                    )}
                    {activeLesson.zip_url && (
                      <a href={`http://localhost:5000${activeLesson.zip_url}`} target="_blank" rel="noreferrer" className="learn-resource-link learn-resource-link--zip">
                        <Package size={16} /> Download ZIP
                      </a>
                    )}
                    {(activeLesson.resources || []).map((r, i) => (
                      <a key={i} href={r.url} target="_blank" rel="noreferrer" className="learn-resource-link learn-resource-link--link">
                        <Link2 size={16} /> {r.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Prev / Next Navigation */}
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <button 
                  onClick={toggleLessonStatus}
                  disabled={togglingProgress}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '0.85rem 1.5rem', borderRadius: '12px', fontWeight: 700,
                    background: completedLessons.includes(activeLesson.id) ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-primary)',
                    color: completedLessons.includes(activeLesson.id) ? '#10b981' : 'var(--text-primary)',
                    border: `1px solid ${completedLessons.includes(activeLesson.id) ? '#10b981' : 'var(--border)'}`,
                    cursor: togglingProgress ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: togglingProgress ? 0.7 : 1
                  }}
                >
                  {togglingProgress ? <Loader size={16} className="spin-animation" /> : <CheckCircle size={18} fill={completedLessons.includes(activeLesson.id) ? '#10b981' : 'none'} color={completedLessons.includes(activeLesson.id) ? '#fff' : 'currentColor'} />}
                  {completedLessons.includes(activeLesson.id) ? 'Completed' : 'Mark as Complete'}
                </button>
  
                <div className="learn-nav-buttons" style={{ margin: 0, padding: 0, border: 'none' }}>
                  <button
                    className="learn-nav-btn"
                    disabled={currentIdx <= 0}
                    onClick={() => setActiveLesson(allLessons[currentIdx - 1])}
                  >
                    <ArrowLeft size={14} /> Previous
                  </button>
                  <button
                    className="learn-nav-btn learn-nav-btn--next"
                    disabled={currentIdx >= allLessons.length - 1}
                    onClick={() => setActiveLesson(allLessons[currentIdx + 1])}
                  >
                    Next <Play size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Lesson List */}
        <div className="learn-sidebar">
          <div className="learn-sidebar__header">
            <BookOpen size={18} />
            <h4>Course Content</h4>
          </div>
          <div className="learn-sidebar__modules">
            {hasModules && course.modules.map((mod, modIdx) => {
              const isExpanded = expandedModules[mod.id];
              return (
                <div key={mod.id} className="learn-module">
                  <button
                    className="learn-module__header"
                    onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                  >
                    <span className="learn-module__number">{modIdx + 1}</span>
                    <span className="learn-module__title">{mod.title}</span>
                    <span className="learn-module__count">{mod.lessons?.length || 0}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && mod.lessons && mod.lessons.length > 0 && (
                    <div className="learn-module__lessons">
                      {mod.lessons.map((lesson, lIdx) => {
                        const isActive = activeLesson?.id === lesson.id;
                        const isCompleted = completedLessons.includes(lesson.id);
                        return (
                          <button
                            key={lesson.id}
                            className={`learn-lesson-item ${isActive ? 'learn-lesson-item--active' : ''}`}
                            onClick={() => setActiveLesson(lesson)}
                          >
                            {isCompleted ? (
                               <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} strokeWidth={4} /></span>
                            ) : (
                               <span className={`learn-lesson-item__number ${isActive ? 'learn-lesson-item__number--active' : ''}`}>{lIdx + 1}</span>
                            )}
                            <span className="learn-lesson-item__title" style={{ color: isCompleted ? 'var(--text-primary)' : 'inherit' }}>{lesson.title}</span>
                            {(lesson.video_url || lesson.video_file) && (
                              <Play size={10} className="learn-lesson-item__play" style={{ color: isCompleted ? '#10b981' : 'inherit' }} />
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
      </div>
    </div>
  );
};

export default CourseLearn;
