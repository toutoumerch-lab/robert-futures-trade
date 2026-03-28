import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    axios.get('http://localhost:5000/api/courses')
      .then(res => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <section className="page-hero">
        <div className="page-hero-bg" />
        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Trading Education <span className="text-gradient">Library</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto' }}>
            Structured, in-depth courses by Robert — from price action fundamentals to advanced prop firm strategies.
          </p>
        </div>
      </section>

      <div className="container py-16">
        {loading ? (
          <div className="loading-state">Loading courses…</div>
        ) : courses.length === 0 ? (
          <div className="empty-state-page">
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</p>
            <h3 className="mb-2">Coming Soon</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Premium courses are being prepared. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.map(course => (
              <Card key={course.id} className="course-card">
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} className="course-img" />
                ) : (
                  <div className="course-img-placeholder">🎓</div>
                )}
                <div className="course-body">
                  <h3 className="mb-2" style={{ fontSize: '1.15rem' }}>{course.title}</h3>
                  <p className="mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                    {course.description}
                  </p>
                </div>
                <div className="course-footer">
                  <div className="course-price">
                    {parseFloat(course.price) === 0
                      ? <span className="price-free">Free</span>
                      : <span>${parseFloat(course.price).toFixed(2)}</span>
                    }
                  </div>
                  <Button style={{ flex: 1 }}>
                    {user ? 'Enroll Now' : 'Get Access'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
