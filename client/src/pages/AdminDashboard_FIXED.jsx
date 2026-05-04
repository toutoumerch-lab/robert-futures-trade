ï¿½import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import BrandingManager from '../components/admin/BrandingManager';
import MultiSelect from '../components/common/MultiSelect';
import Toggle from '../components/common/Toggle';

// ──────────────────── Generic Modal ────────────────────
const Modal = ({ title, onClose, hideHeader, style, children }) => {
  useEffect(() => {
    // Lock body scroll and prevent layout shift from scrollbar disappearing
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
    
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `calc(${originalPaddingRight} + ${scrollbarWidth}px)`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 999999, pointerEvents: 'auto' }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ position: 'relative', cursor: 'auto', ...style }}>
        {!hideHeader && (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close" onClick={onClose}>ï¿½S"</button>
          </div>
        )}
        {hideHeader && (
          <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 100, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', width: '36px', height: '36px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>ï¿½S"</button>
        )}
        <div className="modal-body" style={{ padding: hideHeader ? '0' : '1.5rem' }}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

// ──────────────────── FormField helper ────────────────────
const Field = ({ label, type = 'text', value, onChange, placeholder, as, ...rest }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {as === 'textarea' ? (
      <textarea className="input" rows={4} value={value} onChange={onChange} placeholder={placeholder} {...rest} />
    ) : (
      <input className="input" type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest} />
    )}
  </div>
);

// ──────────────────── Users Tab ────────────────────
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_URL}/api/users`)
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchUsers, [fetchUsers]);

  const promoteUser = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await axios.patch(`${import.meta.env.VITE_API_URL}/api/users/${id}/role`, { role: newRole });
    fetchUsers();
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${id}`);
    fetchUsers();
  };

  if (loading) return <div className="tab-loading">Loading usersâ¬¦</div>;

  return (
    <div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="table-actions">
                  <button className="action-btn" onClick={() => promoteUser(u.id, u.role)}>
                    {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                  </button>
                  <button className="action-btn danger" onClick={() => deleteUser(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="empty-state">No users found.</p>}
      </div>
    </div>
  );
};

// ──────────────────── Posts Tab ────────────────────
const PostsTab = ({ adminUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });

  const fetchPosts = useCallback(() => {
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_URL}/api/posts`)
      .then(res => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchPosts, [fetchPosts]);

  const openCreate = () => { setEditing(null); setForm({ title: '', content: '' }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ title: p.title, content: p.content }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/posts/${editing.id}`, form);
    } else {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/posts`, form);
    }
    setShowModal(false);
    fetchPosts();
  };

  const deletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/posts/${id}`);
    fetchPosts();
  };

  if (loading) return <div className="tab-loading">Loading postsâ¬¦</div>;

  return (
    <div>
      <div className="tab-toolbar">
        <Button onClick={openCreate}>+ New Post</Button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Author</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.author_name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="table-actions">
                  <button className="action-btn" onClick={() => openEdit(p)}>Edit</button>
                  <button className="action-btn danger" onClick={() => deletePost(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <p className="empty-state">No posts yet. Create your first one!</p>}
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Post' : 'New Post'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="modal-form">
            <Field label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Post titleâ¬¦" />
            <Field label="Content" as="textarea" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your postâ¬¦" />
            <div className="modal-footer">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save Changes' : 'Publish Post'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ──────────────────── Courses Tab ────────────────────
const CoursesTab = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  const initialForm = {
    title: '', description: '', price: '', 
    level: 'Beginner', duration: '', category: 'Futures Trading', 
    is_free: false, video_url: '',
    image: null, pdf_file: null, video_file: null
  };
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const fetchCourses = useCallback(() => {
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_URL}/api/courses`)
      .then(res => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchCategories = useCallback(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/categories`)
      .then(res => setCategories(res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, [fetchCourses, fetchCategories]);

  const handleCreateCategory = async (catName, e = null) => {
    if (!catName || catName.trim() === '') return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/categories`, { name: catName.trim() });
      if (res.data) {
        setCategories(prev => {
          const exists = prev.find(c => c.name.toLowerCase() === res.data.name.toLowerCase());
          if (exists) return prev;
          return [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name));
        });
        setForm(prev => ({ ...prev, category: res.data.name }));
        alert(`Category "${res.data.name}" bound successfully!`);
        if (e && e.target) e.target.blur();
      }
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Failed to create custom category.');
    }
  };

  const handleDeleteCategory = async (catId, catName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the category "${catName}"?`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${catId}`);
      setCategories(prev => prev.filter(c => c.id !== catId));
      // Clear selection if the deleted category was selected
      if (form.category === catName) {
        setForm(prev => ({ ...prev, category: '' }));
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  const openCreate = () => { setEditing(null); setForm(initialForm); setActiveTab('basic'); setShowModal(true); };
  
  const openEdit = (c) => { 
    setEditing(c); 
    setForm({ 
      title: c.title || '', 
      description: c.description || '', 
      price: c.price || '', 
      level: c.level || 'Beginner',
      duration: c.duration || '',
      category: c.category || 'Futures Trading',
      is_free: c.is_free || false,
      video_url: c.video_url || '',
      image: null, pdf_file: null, video_file: null
    }); 
    setActiveTab('basic'); 
    setShowModal(true); 
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Front-end Form Validation preventing phantom 400 Bad Requests
    if (!form.title || form.title.trim() === '') {
      alert("Missing Required Payload: Please provide a Course Title securely under the BASIC INFO tab.");
      setActiveTab('basic');
      return;
    }
    
    // Convert to multipart/form-data payload
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('price', form.is_free ? 0 : form.price);
    formData.append('level', form.level);
    formData.append('duration', form.duration);
    formData.append('category', form.category);
    formData.append('is_free', form.is_free);
    formData.append('video_url', form.video_url);

    if (form.image) formData.append('image', form.image);
    if (form.pdf_file) formData.append('pdf_file', form.pdf_file);
    if (form.video_file) formData.append('video_file', form.video_file);

    try {
      if (editing) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/courses/${editing.id}`, formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/courses`, formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving course. Please verify core fields.');
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/courses/${id}`);
    fetchCourses();
  };

  if (loading) return <div className="tab-loading">Loading coursesâ¬¦</div>;

  return (
    <div>
      <div className="tab-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Course Directory</h2>
        <Button onClick={openCreate} style={{ padding: '0.8rem 1.75rem', borderRadius: '99px', fontWeight: 700, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)', background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))' }}>+ Add Course Entry</Button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {courses.map(c => (
          <div key={c.id} style={{ background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)' }} className="hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.15)] hover:border-[var(--accent-primary)]">
            <div style={{ height: '180px', width: '100%', background: c.image_url ? `url(http://localhost:5001${c.image_url}) center/cover` : 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.02))', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: c.is_free ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, var(--bg-primary), var(--bg-secondary))', border: c.is_free ? 'none' : '1px solid var(--border)', padding: '6px 16px', borderRadius: '99px', color: c.is_free ? 'white' : 'var(--text-primary)', fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                {c.is_free ? 'FREE' : `$${c.price}`}
              </div>
            </div>
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: '99px', color: 'var(--accent-primary)', fontWeight: 800, border: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.level || 'Beginner'}</span>
                <span style={{ fontSize: '0.75rem', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: '99px', color: 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '4px' }}>⏱ {c.duration || 'N/A'}</span>
              </div>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.5px' }}>{c.title}</h3>
              
              <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                <button onClick={() => openEdit(c)} style={{ flex: 1, background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '0.7rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-[var(--accent-primary)] hover:text-white hover:border-transparent">Edit Course</button>
                <button onClick={() => deleteCourse(c.id)} style={{ padding: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:bg-red-500 hover:text-white" title="Delete Course">ï¿½S</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {courses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-secondary)', borderRadius: '32px', border: '1px dashed var(--border)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>ï¿½xa</div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 800 }}>No courses available</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>Get started by building your first premium trading course.</p>
          <Button onClick={openCreate} style={{ padding: '0.8rem 2rem', borderRadius: '99px', fontSize: '1.1rem', fontWeight: 700 }}>Deploy First Course</Button>
        </div>
      )}

      {showModal && (
        <Modal hideHeader title={editing ? 'Edit Course' : 'New Course'} onClose={() => setShowModal(false)} style={{ maxWidth: '850px', width: '95%' }}>
          <div style={{ padding: '0 1rem 1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
               <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                 {editing ? 'Edit Course Setup' : 'Create Course Engine'}
               </h2>
             </div>
             
             <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="form-tabs">
               {['basic', 'details', 'pricing', 'media'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
                   style={{ 
                     background: activeTab === tab ? 'var(--accent-primary)' : 'transparent', 
                     color: activeTab === tab ? '#fff' : 'var(--text-secondary)', 
                     padding: '0.75rem 1.5rem', 
                     borderRadius: '99px', 
                     border: activeTab === tab ? 'none' : '1px solid var(--border)', 
                     fontWeight: 800, 
                     cursor: 'pointer',
                     textTransform: 'uppercase',
                     letterSpacing: '1px',
                     fontSize: '0.85rem',
                     transition: 'all 0.2s',
                     boxShadow: activeTab === tab ? '0 4px 15px rgba(37, 99, 235, 0.3)' : 'none'
                   }}
                 >
                   {tab} Info
                 </button>
               ))}
             </div>

             <form onSubmit={handleSave} className="modal-form">
               
               {activeTab === 'basic' && (
                 <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                   <Field label="Course Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. The Masterclass: Advanced Futures Trading" required />
                   <Field label="Course Description" as="textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Provide a highly converting deep dive into what this course accomplishes..." rows={8} />
                 </div>
               )}

               {activeTab === 'details' && (
                 <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                     <div className="form-group">
                       <label className="form-label">Difficulty Level</label>
                       <select className="input" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                         <option>Beginner</option>
                         <option>Intermediate</option>
                         <option>Advanced</option>
                         <option>Masterclass</option>
                       </select>
                     </div>
                     <Field label="Total Duration" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 5h 30m" />
                   </div>
                   <div className="form-group" style={{ marginTop: '2rem' }}>
                     <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        Primary Category
                        {user?.role === 'admin' && <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 800 }}>ADMIN MODE ACTIVE</span>}
                     </label>
                     {user?.role === 'admin' ? (
                        <>
                          <div style={{ position: 'relative' }}>
                            <input
                              className="input"
                              value={form.category}
                              onChange={e => {
                                setForm({ ...form, category: e.target.value });
                                setShowCategoryDropdown(true);
                              }}
                              onFocus={() => setShowCategoryDropdown(true)}
                              onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateCategory(form.category, e);
                                  setShowCategoryDropdown(false);
                                }
                              }}
                              placeholder="Type a custom category and hit Enter..."
                            />
                            {showCategoryDropdown && categories.length > 0 && (
                              <ul style={{
                                position: 'absolute', zIndex: 50, width: '100%', top: '100%',
                                marginTop: '4px', maxHeight: '240px', overflowY: 'auto',
                                overflowX: 'hidden', borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                backgroundColor: 'var(--bg-primary)',
                                listStyle: 'none', padding: 0
                              }}>
                                {categories
                                  .filter(cat => !form.category || cat.name.toLowerCase().includes(form.category.toLowerCase()))
                                  .map(cat => {
                                    const isSelected = form.category === cat.name;
                                    return (
                                      <li
                                        key={cat.id || cat.name}
                                        onClick={() => { setForm({ ...form, category: cat.name }); setShowCategoryDropdown(false); }}
                                        style={{
                                          padding: '10px 16px', cursor: 'pointer', fontSize: '0.9rem',
                                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                                          background: isSelected ? 'var(--accent-primary)' : 'transparent',
                                          transition: 'all 0.15s ease',
                                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                                          fontWeight: isSelected ? 600 : 400
                                        }}
                                        onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                                        onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                      >
                                        {cat.name}
                                      </li>
                                    );
                                  })}
                              </ul>
                            )}
                          </div>
                          <small style={{ display: 'block', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Select from the list or type a new category and press Enter to create it.
                          </small>
                        </>
                     ) : (
                       <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                         {categories.length > 0 ? (
                           categories.map(cat => (
                             <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                           ))
                         ) : (
                           <option value="General/Other">General/Other</option>
                         )}
                       </select>
                     )}
                     
                     <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                       {categories.map((cat) => {
                         const isActive = form.category?.toLowerCase() === cat.name?.toLowerCase();
                         return (
                           <div
                             key={cat.id || cat.name}
                             style={{
                               display: 'flex',
                               alignItems: 'center',
                               gap: '6px',
                               padding: '6px 12px 6px 14px',
                               borderRadius: '99px',
                               fontSize: '0.85rem',
                               fontWeight: 600,
                               transition: 'all 0.2s ease',
                               border: isActive ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                               background: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                               color: isActive ? '#fff' : 'var(--text-secondary)',
                               boxShadow: isActive ? '0 0 10px rgba(124, 58, 237, 0.4)' : 'none'
                             }}
                           >
                             <span onClick={() => setForm({ ...form, category: cat.name })} style={{ cursor: 'pointer' }}>{cat.name}</span>                           {user?.role === 'admin' && (<button type="button" onClick={e => handleDeleteCategory(cat.id, cat.name, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)', fontSize: '0.75rem', lineHeight: 1, padding: '0 0 0 2px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }} onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; }} onMouseOut={e => { e.currentTarget.style.color = isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)'; }} title={`Delete "${cat.name}"`}></button>)}                           </div>
                         );
                       })}
                     </div>
                   </div>
                 </div>
               )}

               {activeTab === 'pricing' && (
                 <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="form-group" style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '1.25rem', fontWeight: 800 }}>Universal Free Access</label>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Toggle this to completely bypass the paywall logic and offer this course to the public.</span>
                        </div>
                        <Toggle checked={form.is_free} onChange={() => setForm({...form, is_free: !form.is_free})} />
                      </div>
                      
                      {!form.is_free && (
                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                          <Field label="Enrollment Fee (USD)" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Format: 199.99" />
                        </div>
                      )}
                    </div>
                 </div>
               )}

               {activeTab === 'media' && (
                 <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                   
                   {/* Thumbnail Upload */}
                   <div className="form-group" style={{ border: '2px dashed var(--border)', padding: '2.5rem 2rem', borderRadius: '24px', textAlign: 'center', background: 'var(--bg-secondary)' }}>
                     <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>ï¿½xï¿½</div>
                     <label className="form-label text-center" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 800 }}>Course Cover Art</label>
                     <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Upload a high-quality 16:9 thumbnail image (JPG/PNG)</p>
                     
                     <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                       <input type="file" accept="image/*" onChange={e => setForm({...form, image: e.target.files[0]})} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '12px', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                     </div>
                     {editing && editing.image_url && !form.image && (
                       <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current banner: <a href={`${import.meta.env.VITE_API_URL}${editing.image_url}`} target="_blank" rel="noreferrer" style={{color: 'var(--accent-secondary)', fontWeight: 700}}>View active image ï¿½ </a></div>
                     )}
                   </div>

                   {/* Video Options */}
                   <div style={{ background: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                       <div style={{ fontSize: '2rem' }}>ï¿½x}ï¿½</div>
                       <div>
                         <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>Video Engine</h4>
                         <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>We support either YouTube links or secure raw MP4 uploads. Do not use both simultaneously.</span>
                       </div>
                     </div>
                     
                     <div className="form-group" style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px dashed var(--border)' }}>
                       <label className="form-label" style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>A) YouTube / Vimeo URL Path</label>
                       <input className="input" type="text" value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/..." />
                     </div>

                     <div className="form-group">
                       <label className="form-label" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>B) Upload Raw MP4 Object</label>
                       <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '-0.25rem 0 1rem 0' }}>Max Size: 500MB payload limit injected directly to Node relay.</p>
                       <input type="file" accept="video/mp4,video/webm" onChange={e => setForm({...form, video_file: e.target.files[0]})} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                       {editing && editing.video_file && !form.video_file && (
                         <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>ï¿½S& Raw MP4 actively streaming from server.</div>
                       )}
                     </div>
                   </div>

                   {/* PDF Upload */}
                   <div className="form-group" style={{ border: '2px dashed var(--border)', padding: '2.5rem', borderRadius: '24px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>ï¿½x</div>
                     <label className="form-label" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Supporting Documentation</label>
                     <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Attach any PDF cheatsheets or study guides associated with this course.</p>
                     <input type="file" accept="application/pdf" onChange={e => setForm({...form, pdf_file: e.target.files[0]})} style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                     {editing && editing.pdf_url && !form.pdf_file && (
                       <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>PDF Payload Active: <a href={`${import.meta.env.VITE_API_URL}${editing.pdf_url}`} target="_blank" rel="noreferrer" style={{color: 'var(--accent-primary)', fontWeight: 700}}>Verify PDF ï¿½ </a></div>
                     )}
                   </div>

                 </div>
               )}

               <div className="modal-footer" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                 <Button type="button" variant="outline" onClick={() => setShowModal(false)} style={{ padding: '0.9rem 2.5rem', borderRadius: '99px', fontWeight: 700 }}>Cancel Workflow</Button>
                 <Button type="submit" style={{ padding: '0.9rem 2.5rem', borderRadius: '99px', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)' }}>{editing ? 'Commit Changes' : 'Publish Course Live'}</Button>
               </div>
             </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ──────────────────── Prop Firms Tab ────────────────────
const PropFirmsTab = () => {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingFirm, setViewingFirm] = useState(null);
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);

  const initialFormState = {
    name: '', importance: 'Medium', featured: false, rating: '', website: '', affiliate_link: '',
    twitter: '', discord: '', last_checked: '', is_affiliate: false,
    discount_code: '', overall_score: '', platforms: [], account_category: '', price: '',
    activation_fee: '', profit_split: '', max_withdrawal: '',
    profit_target: '', drawdown_limit: '', days_to_pass: '', days_to_payout: '', notes: '',
    status_color: 'green', buffer: false, eval: '', pa: '', reset_fee: '', 
    copy_trade: false, vpn: false, max_accounts: '', dll: '',
    fifty_k_all_in: '', fifty_k_initial_cost: '', without_discount_usd: '', 
    discount_usd: '', discount_percent: '', dca: false, news: false, 
    bots: false, micro_scalping: false, logo_url: '', imageFile: null
  };
  const [form, setForm] = useState(initialFormState);

  const fetchFirms = useCallback(() => {
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_URL}/api/prop-firms/admin`)
      .then(res => setFirms(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFirms();
    axios.get(`${import.meta.env.VITE_API_URL}/api/prop-firms/platforms`)
      .then(res => setAvailablePlatforms(res.data))
      .catch(console.error);
  }, [fetchFirms]);

  const openCreate = () => { setEditing(null); setForm(initialFormState); setShowModal(true); };
  
  const openEdit = (f) => { 
    setEditing(f); 
    setForm({
      name: f.name || '', importance: f.importance || 'Medium', featured: f.featured || false,
      rating: f.rating || '', website: f.website || '', affiliate_link: f.affiliate_link || '',
      twitter: f.twitter || '', discord: f.discord || '',
      last_checked: f.last_checked ? new Date(f.last_checked).toISOString().split('T')[0] : '',
      is_affiliate: f.is_affiliate || false,
      discount_code: f.discount_code || '', overall_score: f.overall_score || '',
      platforms: Array.isArray(f.platforms) ? f.platforms : [], account_category: f.account_category || '',
      price: f.price || '',
      activation_fee: f.activation_fee || '', profit_split: f.profit_split || '',
      max_withdrawal: f.max_withdrawal || '', profit_target: f.profit_target || '',
      drawdown_limit: f.drawdown_limit || '', days_to_pass: f.days_to_pass || '',
      days_to_payout: f.days_to_payout || '', notes: f.notes || '',
      status_color: f.status_color || 'green',
      buffer: f.buffer || false, eval: f.eval || '', pa: f.pa || '', 
      reset_fee: f.reset_fee || '', copy_trade: f.copy_trade || false, vpn: f.vpn || false,
      max_accounts: f.max_accounts || '', dll: f.dll || '',
      fifty_k_all_in: f.fifty_k_all_in || '', fifty_k_initial_cost: f.fifty_k_initial_cost || '', 
      without_discount_usd: f.without_discount_usd || '', discount_usd: f.discount_usd || '', 
      discount_percent: f.discount_percent || '', dca: f.dca || false, news: f.news || false, 
      bots: f.bots || false, micro_scalping: f.micro_scalping || false,
      logo_url: f.logo_url || '', imageFile: null
    }); 
    setShowModal(true); 
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const mappedData = data.map(row => {
          const mapped = { ...initialFormState };
          for (const key in row) {
            const k = key.toLowerCase().trim();
            if (k.includes('name')) mapped.name = row[key];
            if (k.includes('split') || k.includes('profit')) mapped.profit_split = row[key];
            if (k.includes('cost') || k.includes('price')) mapped.price = row[key];
          }
          return mapped;
        }).filter(item => item.name);

        setImportPreview(mappedData);
      } catch (err) {
        alert("Error parsing file. Please make sure it is a valid Excel or CSV file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/prop-firms/bulk`, importPreview);
      setImportPreview(null);
      fetchFirms();
      alert("Successfully imported records!");
    } catch (err) {
      alert("Error importing records.");
    }
  };

  const formRef = React.useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Sanitize numeric fields to prevent 500 API errors from string mismatches
    const cleanNumeric = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const numText = String(val).replace(/[^0-9.-]/g, '');
      return numText === '' ? null : Number(numText);
    };

    const latest = formRef.current;
    
    // Construct sanitized payload matching backend expectations perfectly
    const sanitizePayload = {
      ...latest,
      importance: cleanNumeric(latest.importance),
      rating: cleanNumeric(latest.rating),
      overall_score: cleanNumeric(latest.overall_score),
      price: cleanNumeric(latest.price),
      activation_fee: cleanNumeric(latest.activation_fee),
      reset_fee: cleanNumeric(latest.reset_fee),
      fifty_k_all_in: cleanNumeric(latest.fifty_k_all_in),
      fifty_k_initial_cost: cleanNumeric(latest.fifty_k_initial_cost),
      without_discount_usd: cleanNumeric(latest.without_discount_usd),
      discount_usd: cleanNumeric(latest.discount_usd),
      discount_percent: cleanNumeric(latest.discount_percent),
      
      // Kept faithfully as text (will not treat as numbers)
      drawdown_limit: latest.drawdown_limit,
      profit_target: latest.profit_target,
      max_withdrawal: latest.max_withdrawal
    };

    const formData = new FormData();
    Object.keys(sanitizePayload).forEach(key => {
      // 1. Convert platforms array to JSON so it transits as a unified string
      if (key === 'platforms') {
        formData.append(key, JSON.stringify(sanitizePayload[key]));
      } 
      // 2. Attach physical file binary to "logo" property
      else if (key === 'imageFile') {
        if (sanitizePayload[key] instanceof File) {
          formData.append('logo', sanitizePayload[key]);
        }
      } 
      // 3. Stringify standard empty strings nicely or append valid data
      else {
        let val = sanitizePayload[key];
        if (val === null || val === undefined) val = ''; 
        formData.append(key, val);
      }
    });

    console.log("Submitting FormData Payload to API:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? value.name : value);
    }

    try {
      if (editing) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/prop-firms/${editing.id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/prop-firms`, formData);
      }
      setShowModal(false);
      fetchFirms();
    } catch (err) {
      console.error("API Save Error:", err);
      alert('Failed to save. Check the browser console for exact error details.');
    }
  };

  const deleteFirm = async (id) => {
    if (!window.confirm('Delete this prop firm?')) return;
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/prop-firms/${id}`);
    fetchFirms();
  };

  const getStatusTheme = (status) => {
    switch (status) {
      case 'green': return {
        bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%)',
        text: 'linear-gradient(to right, #34d399, #10b981)',
        border: 'rgba(16, 185, 129, 0.3)',
        shadow: '0 8px 20px rgba(16, 185, 129, 0.2)'
      };
      case 'blue': return {
        bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.03) 100%)',
        text: 'linear-gradient(to right, #93c5fd, #3b82f6)',
        border: 'rgba(59, 130, 246, 0.3)',
        shadow: '0 8px 20px rgba(59, 130, 246, 0.2)'
      };
      case 'yellow': return {
        bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)',
        text: 'linear-gradient(to right, #fcd34d, #f59e0b)',
        border: 'rgba(245, 158, 11, 0.3)',
        shadow: '0 8px 20px rgba(245, 158, 11, 0.2)'
      };
      case 'red': return {
        bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.03) 100%)',
        text: 'linear-gradient(to right, #fca5a5, #ef4444)',
        border: 'rgba(239, 68, 68, 0.3)',
        shadow: '0 8px 20px rgba(239, 68, 68, 0.2)'
      };
      default: return {
        bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
        text: 'linear-gradient(to right, #818cf8, #f472b6)',
        border: 'rgba(59, 130, 246, 0.2)',
        shadow: '0 8px 20px rgba(37,99,235,0.3)'
      };
    }
  };

  const StatBox = ({ label, value }) => (
    <div style={{
      background: 'var(--bg-secondary)',
      border: 'none',
      borderRadius: '24px',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: '0.5rem',
      boxShadow: '0 8px 25px -5px rgba(0,0,0,0.03)',
      transition: 'transform 0.2s ease-out'
    }} className="hover:-translate-y-1">
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{value || '-'}</span>
    </div>
  );

  if (loading) return <div className="tab-loading">Loading prop firmsâ¬¦</div>;

  return (
    <div>
      <div className="tab-toolbar" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Button onClick={openCreate}>+ Add Prop Firm</Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          Import Excel/CSV
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
          style={{ display: 'none' }} 
        />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Rating</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {firms.map(f => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600 }}>{f.name} {f.featured && <span style={{fontSize:'12px'}}>⭐ï¸</span>}</td>
                <td>{f.rating ? `${f.rating} / 5` : '-'}</td>
                <td>
                  <span 
                    style={{ 
                      display: 'inline-block',
                      width: '12px', height: '12px',
                      borderRadius: '50%',
                      backgroundColor: f.status_color === 'green' ? '#10b981' : f.status_color === 'blue' ? '#3b82f6' : f.status_color === 'yellow' ? '#f59e0b' : '#ef4444',
                      boxShadow: '0 0 5px rgba(0,0,0,0.2)'
                    }} 
                    title={f.status_color === 'green' ? 'Top Ranked' : f.status_color === 'blue' ? 'Community Trusted' : f.status_color === 'yellow' ? 'New / Building Trust' : 'Avoid / Possible Scam'}
                  />
                </td>
                <td className="table-actions">
                  <button className="action-btn" style={{backgroundColor: 'var(--bg-tertiary)'}} onClick={() => setViewingFirm(f)}>View</button>
                  <button className="action-btn" onClick={() => openEdit(f)}>Edit</button>
                  <button className="action-btn danger" onClick={() => deleteFirm(f.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {firms.length === 0 && <p className="empty-state">No prop firms listed yet.</p>}
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Prop Firm' : 'New Prop Firm'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="modal-form" style={{ position: 'relative' }}>
            <div style={{ paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              
              <div className="form-section">
                <h3 className="form-section-title">ï¿½xï¿½ï¸ Branding</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ 
                    border: '2px dashed var(--border-color)', 
                    borderRadius: 'var(--radius)', 
                    padding: '1.5rem', 
                    textAlign: 'center', 
                    position: 'relative',
                    overflow: 'hidden' 
                  }}>
                    <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>Prop Firm Logo (SVG, PNG, JPG, WebP)</label>
                    
                    {(form.imageFile || form.logo_url) ? (
                      <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={form.imageFile ? URL.createObjectURL(form.imageFile) : `${import.meta.env.VITE_API_URL}${form.logo_url}`} 
                          alt="Logo Preview" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); setForm({ ...form, imageFile: null, logo_url: '' }) }}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                        >ï¿½S"</button>
                      </div>
                    ) : (
                      <div style={{ margin: '1rem 0', pointerEvents: 'none' }}>
                        <svg style={{ width: '48px', height: '48px', color: 'var(--text-secondary)', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Click to upload or drag and drop</p>
                      </div>
                    )}
                    
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setForm({ ...form, imageFile: e.target.files[0] });
                        }
                      }}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
              <div className="form-section">
                <h3 className="form-section-title">ï¿½xï¿½ï¿½ Basic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <Field label="Name (required)" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Firm nameâ¬¦" />
                  <div className="form-group">
                    <label className="form-label">Internal Status (Admin Only)</label>
                    <select className="input" required value={form.status_color} onChange={e => setForm({ ...form, status_color: e.target.value })}>
                      <option value="green">ï¿½xxï¿½ Green (Top Ranked)</option>
                      <option value="blue">ï¿½xï¿½ Blue (Community Trusted)</option>
                      <option value="yellow">ï¿½xxï¿½ Yellow (New / Building Trust)</option>
                      <option value="red">ï¿½xï¿½ Red (Avoid / Possible Scam)</option>
                    </select>
                  </div>
                  <Field label="Account Category" value={form.account_category} onChange={e => setForm({ ...form, account_category: e.target.value })} placeholder="e.g. Futures, Forex" />
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Supported Platforms</label>
                    <MultiSelect options={availablePlatforms} value={form.platforms} onChange={newVal => setForm({ ...form, platforms: newVal })} placeholder="Select or type to add new platform..." />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">ï¿½xï¿½ Pricing Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

                  <Field label="Activation Fee (USD)" type="number" value={form.activation_fee} onChange={e => setForm({ ...form, activation_fee: e.target.value })} placeholder="e.g. 140" />
                  <Field label="Reset Fee (USD)" type="number" value={form.reset_fee} onChange={e => setForm({ ...form, reset_fee: e.target.value })} placeholder="e.g. 50" />
                  <Field label="50k All In (USD)" type="number" value={form.fifty_k_all_in} onChange={e => setForm({ ...form, fifty_k_all_in: e.target.value })} placeholder="e.g. 200" />
                  <Field label="50k Initial Cost (USD)" type="number" value={form.fifty_k_initial_cost} onChange={e => setForm({ ...form, fifty_k_initial_cost: e.target.value })} placeholder="e.g. 99" />
                  <Field label="Without Discount (USD)" type="number" value={form.without_discount_usd} onChange={e => setForm({ ...form, without_discount_usd: e.target.value })} placeholder="e.g. 199" />
                  <Field label="Discount (USD)" type="number" value={form.discount_usd} onChange={e => setForm({ ...form, discount_usd: e.target.value })} placeholder="e.g. 20" />
                  <Field label="Discount (%)" type="number" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} placeholder="e.g. 15" />
                  <Field label="Discount Code" value={form.discount_code} onChange={e => setForm({ ...form, discount_code: e.target.value })} placeholder="e.g. SAVE20" />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">ï¿½a"ï¸ Trading Rules & Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <Field label="Profit Target" type="text" value={form.profit_target} onChange={e => setForm({ ...form, profit_target: e.target.value })} placeholder="e.g. $4,000 for max withdrawal, $1,000 for min" />
                  <Field label="Profit Split" type="text" value={form.profit_split} onChange={e => setForm({ ...form, profit_split: e.target.value })} placeholder="e.g. EOD, $2,000" />
                  <Field label="Drawdown & Amt" type="text" value={form.drawdown_limit} onChange={e => setForm({ ...form, drawdown_limit: e.target.value })} placeholder="e.g. EOD, $2,000, Trailing" />
                  <Field label="DLL (Daily Loss Limit)" type="text" value={form.dll} onChange={e => setForm({ ...form, dll: e.target.value })} placeholder="e.g. $1,200 until $52,100 then 60% of highest day profit after" />
                  <Field label="Max Withdrawal" type="text" value={form.max_withdrawal} onChange={e => setForm({ ...form, max_withdrawal: e.target.value })} placeholder="e.g. (1-6) $2,000" />
                  <Field label="Days to Pass" type="text" value={form.days_to_pass} onChange={e => setForm({ ...form, days_to_pass: e.target.value })} placeholder="e.g. N/A" />
                  <Field label="Days to Payout" type="text" value={form.days_to_payout} onChange={e => setForm({ ...form, days_to_payout: e.target.value })} placeholder="e.g. N/A" />
                  <Field label="Maximum of Accounts" type="text" value={form.max_accounts} onChange={e => setForm({ ...form, max_accounts: e.target.value })} placeholder="e.g. 20" />
                  <Field label="Eval (%)" type="text" value={form.eval} onChange={e => setForm({ ...form, eval: e.target.value })} placeholder="e.g. 1 Step, 2 Step (%)" />
                  <Field label="PA (%)" type="text" value={form.pa} onChange={e => setForm({ ...form, pa: e.target.value })} placeholder="e.g. Trailing, EOD (%)" />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">ï¿½x Socials, Links & Ratings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <Field label="Overall Score" type="number" step="0.1" value={form.overall_score} onChange={e => setForm({ ...form, overall_score: e.target.value })} placeholder="e.g. 9.5" />
                  <Field label="Rating (Trustpilot)" type="number" step="0.1" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} placeholder="e.g. 4.8" />
                  <Field label="Website URL" type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">ï¿½xï¿½ Toggles & Settings</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <Toggle label="Feature in Banner" checked={form.featured} onChange={val => setForm({ ...form, featured: val })} />
                  <Toggle label="Is Affiliate Link" checked={form.is_affiliate} onChange={val => setForm({ ...form, is_affiliate: val })} />
                  <Toggle label="Buffer Support" checked={form.buffer} onChange={val => setForm({ ...form, buffer: val })} />
                  <Toggle label="Copy Trade Allowed" checked={form.copy_trade} onChange={val => setForm({ ...form, copy_trade: val })} />
                  <Toggle label="VPN Allowed" checked={form.vpn} onChange={val => setForm({ ...form, vpn: val })} />
                  <Toggle label="DCA Allowed" checked={form.dca} onChange={val => setForm({ ...form, dca: val })} />
                  <Toggle label="News Trading" checked={form.news} onChange={val => setForm({ ...form, news: val })} />
                  <Toggle label="Bots Allowed" checked={form.bots} onChange={val => setForm({ ...form, bots: val })} />
                  <Toggle label="MicroScalping" checked={form.micro_scalping} onChange={val => setForm({ ...form, micro_scalping: val })} />
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <Field label="Administrative Notes" as="textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional internal information..." />
                </div>
              </div>

            </div>

            <div className="modal-footer" style={{ 
              position: 'sticky', 
              bottom: '-24px', 
              background: 'var(--bg-secondary)', 
              zIndex: 100, 
              marginTop: '1.5rem', 
              paddingTop: '1rem', 
              paddingBottom: '1rem',
              borderTop: '1px solid var(--border)' 
            }}>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save Changes' : 'Add Firm'}</Button>
            </div>
          </form>
        </Modal>
      )}
      {importPreview && (
        <Modal title="Import Preview" onClose={() => setImportPreview(null)}>
          <div className="modal-body">
            <p>Ready to import <strong>{importPreview.length}</strong> prop firms.</p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table className="admin-table" style={{ margin: 0 }}>
                <thead>
                  <tr><th>Name</th><th>Split</th><th>Price</th></tr>
                </thead>
                <tbody>
                  {importPreview.map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td>{item.profit_split}</td>
                      <td>{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <Button type="button" variant="outline" onClick={() => setImportPreview(null)}>Cancel</Button>
              <Button type="button" onClick={confirmImport}>Confirm Import</Button>
            </div>
          </div>
        </Modal>
      )}
      {viewingFirm && (() => {
        const theme = getStatusTheme(viewingFirm.status_color);
        return (
        <Modal hideHeader onClose={() => setViewingFirm(null)} style={{ background: 'var(--bg-primary)', backgroundImage: 'var(--gradient-mesh)', borderColor: theme.border, maxWidth: '950px', width: '95%' }}>
          <div className="view-firm-details" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '3rem', maxHeight: '85vh', overflowY: 'auto', scrollbarWidth: 'none', borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}>
            
            {/* Hero Banner Component */}
            <div style={{
               background: theme.bg,
               padding: '3rem 2rem 2rem 2rem',
               borderBottom: `1px solid ${theme.border}`,
               position: 'relative',
               marginTop: '0'
            }}>
               <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {viewingFirm.logo_url && (
                      <div style={{ background: '#fff', padding: '0.25rem', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <img 
                          src={`${import.meta.env.VITE_API_URL}${viewingFirm.logo_url}`} 
                          alt="Logo" 
                          style={{ width: '48px', height: '48px', objectFit: 'contain', display: 'block' }} 
                        />
                      </div>
                    )}
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, paddingBottom: '0.25em', lineHeight: 1.4, background: theme.text, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                      {viewingFirm.name}
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge`} style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff'}}>
                       {viewingFirm.status_color === 'green' ? 'ï¿½xxï¿½ Top Ranked' : viewingFirm.status_color === 'blue' ? 'ï¿½xï¿½ Trusted' : viewingFirm.status_color === 'yellow' ? 'ï¿½xxï¿½ New / Warning' : 'ï¿½xï¿½ Avoid'}
                    </span>
                    {viewingFirm.featured && <span style={{fontSize: '13px', color: '#f59e0b', fontWeight: 600}}>⭐ï¸ Featured Firm</span>}
                    {viewingFirm.is_affiliate && <span style={{fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 600}}>ï¿½x Affiliate Partner</span>}
                  </div>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '0 2rem' }}>
                {/* General Info */}
                <div>
                   <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                     ï¿½xï¿½ï¿½ Basic Information
                   </h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                     
                     <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Account Category</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>{viewingFirm.account_category || '-'}</span>
                     </div>
                     
                     <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Trustpilot Rating</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>⭐ {viewingFirm.rating ? `${viewingFirm.rating} / 5` : '-'}</span>
                     </div>

                     <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Supported Platforms</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {(viewingFirm.platforms && viewingFirm.platforms.length > 0) ? viewingFirm.platforms.map(p => (
                               <span key={p} style={{ background: 'var(--bg-primary)', padding: '0.6rem 1.2rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 700, border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>{p}</span>
                          )) : <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No platforms listed</span>}
                        </div>
                     </div>

                     {viewingFirm.website && (
                       <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Affiliate / Website URL</span>
                          <a href={viewingFirm.website} target="_blank" rel="noreferrer" style={{color: 'var(--accent-blue)', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 700, wordBreak: 'break-all'}} className="hover:underline">{viewingFirm.website}</a>
                       </div>
                     )}

                   </div>
                </div>

                {/* Pricing Details */}
                <div>
                   <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                     ï¿½xï¿½ Pricing Details
                   </h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                     <StatBox label="Activation Fee" value={viewingFirm.activation_fee != null && viewingFirm.activation_fee !== '' ? `$${viewingFirm.activation_fee}` : '-'} />
                     <StatBox label="Reset Fee" value={viewingFirm.reset_fee != null && viewingFirm.reset_fee !== '' ? `$${viewingFirm.reset_fee}` : '-'} />
                     <StatBox label="50K All In" value={viewingFirm.fifty_k_all_in != null && viewingFirm.fifty_k_all_in !== '' ? `$${viewingFirm.fifty_k_all_in}` : '-'} />
                     <StatBox label="50K Initial Cost" value={viewingFirm.fifty_k_initial_cost != null && viewingFirm.fifty_k_initial_cost !== '' ? `$${viewingFirm.fifty_k_initial_cost}` : '-'} />
                     <StatBox label="Without Discount" value={viewingFirm.without_discount_usd != null && viewingFirm.without_discount_usd !== '' ? `$${viewingFirm.without_discount_usd}` : '-'} />
                     <StatBox label="Discount Applied" value={viewingFirm.discount_usd != null && viewingFirm.discount_usd !== '' ? `$${viewingFirm.discount_usd} ${viewingFirm.discount_percent ? '('+viewingFirm.discount_percent+'%)' : ''}` : '-'} />
                     <StatBox label="Discount Code" value={viewingFirm.discount_code} />
                   </div>
                </div>

                {/* Trading Metrics */}
                <div>
                   <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                     ï¿½a"ï¸ Trading Rules & Metrics
                   </h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                     <StatBox label="Profit Target" value={viewingFirm.profit_target} />
                     <StatBox label="Profit Split" value={viewingFirm.profit_split} />
                     <StatBox label="Daily Loss Limit (DLL)" value={viewingFirm.dll} />
                     <StatBox label="Max Withdrawal" value={viewingFirm.max_withdrawal} />
                     <StatBox label="Drawdown & Amt" value={viewingFirm.drawdown_limit} />
                     <StatBox label="Days to Pass" value={viewingFirm.days_to_pass} />
                     <StatBox label="Days to Payout" value={viewingFirm.days_to_payout} />
                     <StatBox label="Eval (%)" value={viewingFirm.eval} />
                     <StatBox label="PA (%)" value={viewingFirm.pa} />
                     <StatBox label="Max Accounts" value={viewingFirm.max_accounts} />
                   </div>
                </div>

                {/* Badges / Toggles Block */}
                <div style={{ paddingBottom: '2rem' }}>
                   <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                     ï¿½xï¿½ Feature Support
                   </h4>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {['buffer', 'copy_trade', 'vpn', 'dca', 'news', 'bots', 'micro_scalping'].map(feat => (
                         <span key={feat} style={{ 
                           padding: '0.5rem 1rem', 
                           background: viewingFirm[feat] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', 
                           color: viewingFirm[feat] ? '#10b981' : 'var(--text-secondary)', 
                           borderRadius: '10px', 
                           fontSize: '13px', 
                           fontWeight: 600, 
                           border: viewingFirm[feat] ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)'
                         }}>
                           {viewingFirm[feat] ? 'ï¿½S' : 'ï¿½S'} {feat.replace('_', ' ').toUpperCase()}
                         </span>
                      ))}
                   </div>
                   
                   {viewingFirm.notes && (
                     <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid var(--accent-blue)', borderRadius: '0 12px 12px 0', fontSize: '14px', lineHeight: 1.6, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                       <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', marginBottom: '0.75rem', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          <i className="fi fi-rr-document"></i> Administrative Notes
                       </strong>
                       {viewingFirm.notes}
                     </div>
                   )}
                </div>
            </div>

          </div>
          <div className="modal-footer" style={{ 
              position: 'sticky', 
              bottom: '0', 
              background: 'linear-gradient(to top, var(--bg-primary) 80%, transparent)', 
              zIndex: 100, 
              marginTop: '0', 
              padding: '2rem 2rem', 
              display: 'flex',
              justifyContent: 'flex-end',
              pointerEvents: 'none'
            }}>
            <Button onClick={() => setViewingFirm(null)} variant="primary" style={{ borderRadius: '8px', padding: '0.75rem 2.5rem', pointerEvents: 'auto', boxShadow: theme.shadow }}>Close Summary</Button>
          </div>
        </Modal>
        );
      })()}
    </div>
  );
};

// ──────────────────── Promotions Tab ────────────────────
const PromotionsTab = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', code: '', status: 'inactive', expires_at: '', ticker_speed: 40 });

  // Always keep a ref in sync with form so handleSave never reads stale closure
  const formRef = React.useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  const fetchPromos = useCallback(() => {
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_URL}/api/promotions`)
      .then(res => setPromos(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchPromos, [fetchPromos]);

  const openCreate = () => { 
    setEditing(null); 
    setForm({ title: '', code: '', status: 'inactive', expires_at: '', ticker_speed: 40 }); 
    setShowModal(true); 
  };
  
  const openEdit = (p) => { 
    setEditing(p); 
    setForm({ 
      title: p.title, 
      code: p.code, 
      status: p.status, 
      expires_at: p.expires_at ? new Date(p.expires_at).toISOString().slice(0, 16) : '',
      ticker_speed: Number(p.ticker_speed) || 40,
    }); 
    setShowModal(true); 
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Read from ref to always get the latest values (avoids stale closure)
    const latest = formRef.current;
    const payload = {
      title:        latest.title,
      code:         latest.code,
      status:       latest.status,
      expires_at:   latest.expires_at || null,
      ticker_speed: Number(latest.ticker_speed) || 40,
    };
    try {
      if (editing) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/promotions/${editing.id}`, payload);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/promotions`, payload);
      }
      setShowModal(false);
      fetchPromos();
    } catch (err) {
      alert(err.response?.data?.error || `Save failed (${err.message}). Make sure you're logged in as admin.`);
    }
  };

  const deletePromo = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/promotions/${id}`);
    fetchPromos();
  };

  if (loading) return <div className="tab-loading">Loading promotionsâ¬¦</div>;

  return (
    <div>
      <div className="tab-toolbar">
        <Button onClick={openCreate}>+ New Promotion</Button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Code</th><th>Status</th><th>Speed</th><th>Expires At</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.title}</td>
                <td><code className="promo-code-display">{p.code}</code></td>
                <td>
                  <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-user'}`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: (p.ticker_speed ?? 40) <= 20 ? '#3b82f6' : (p.ticker_speed ?? 40) <= 60 ? '#3b82f6' : '#10b981',
                  }}>
                    {(p.ticker_speed ?? 40) <= 20 ? 'ï¿½xï¿½' : (p.ticker_speed ?? 40) <= 60 ? 'ï¿½aï¿½' : 'ï¿½xï¿½ï¿½'} {p.ticker_speed ?? 40}s
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {p.expires_at ? new Date(p.expires_at).toLocaleString() : 'Never'}
                </td>
                <td className="table-actions">
                  <button className="action-btn" onClick={() => openEdit(p)}>Edit</button>
                  <button className="action-btn danger" onClick={() => deletePromo(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {promos.length === 0 && <p className="empty-state">No promotions found.</p>}
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Promotion' : 'New Promotion'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="modal-form">
            <Field label="Promotion Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. 20% Off All Courses!" />
            <Field label="Promo Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. SAVE20" />
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <Field label="Expiration Date" type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />

            {/* ï¿½ï¿½ï¿½ï¿½ Ticker Speed ï¿½ï¿½ï¿½ï¿½ */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Banner Scroll Speed</span>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '1px 8px',
                  borderRadius: '100px',
                  background: form.ticker_speed <= 20
                    ? 'rgba(59,130,246,0.12)'
                    : form.ticker_speed <= 60
                    ? 'rgba(59,130,246,0.12)'
                    : 'rgba(16,185,129,0.12)',
                  color: form.ticker_speed <= 20
                    ? '#3b82f6'
                    : form.ticker_speed <= 60
                    ? '#3b82f6'
                    : '#10b981',
                  border: '1px solid currentColor',
                }}>
                  {form.ticker_speed <= 20 ? 'ï¿½xï¿½ Fast' : form.ticker_speed <= 60 ? 'ï¿½aï¿½ Medium' : 'ï¿½xï¿½ï¿½ Slow'} &nbsp;Â·&nbsp; {form.ticker_speed}s
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Fast (5s)</span>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={form.ticker_speed}
                   onChange={e => { const v = Number(e.target.value); setForm(prev => ({ ...prev, ticker_speed: v })); }}
                  style={{
                    flex: 1,
                    accentColor: 'var(--accent-primary)',
                    cursor: 'pointer',
                    height: '4px',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Slow (120s)</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Lower = faster scrolling. Changes apply live when saved.
              </p>
            </div>

            <div className="modal-footer">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save Changes' : 'Create Promotion'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ──────────────────── Main Admin Dashboard ────────────────────
const TABS = [
  { id: 'users',      label: 'ï¿½xï¿½ Users' },
  { id: 'posts',      label: 'ï¿½xï¿½ Blog Posts' },
  { id: 'courses',    label: 'ï¿½x} Courses' },
  { id: 'prop-firms', label: 'ï¿½xï¿½ï¿½ Prop Firms' },
  { id: 'promos',     label: 'ï¿½x}ï¿½ Promotions' },
  { id: 'branding',   label: 'ï¿½x}ï¿½ Branding' },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [layout, setLayout] = useState(() => localStorage.getItem('adminLayout') || 'horizontal');

  useEffect(() => {
    localStorage.setItem('adminLayout', layout);
  }, [layout]);

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <h2>Please log in</h2>
        <Button className="mt-4" onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="container py-16 text-center">
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>You need admin privileges to view this page.</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className={`container py-16 admin-dashboard-root ${layout === 'vertical' ? 'is-vertical' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage your platform content</p>
        </div>
        <div className="flex gap-4 items-center">
          <Button variant="outline" onClick={() => setLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            {layout === 'horizontal' ? 'ï¿½xï¿½ Vertical Layout' : 'ï¿½xï¿½ Horizontal Layout'}
          </Button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.name}</span>
          <Button variant="outline" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
        </div>
      </div>

      <div className="admin-layout-wrapper">
        <div className="admin-navigation">
          {/* Tab Bar */}
          <div className="admin-tabs mb-6 md:mb-0">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`admin-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-workspace flex-1">
          {/* Stats Row */}
          <div className="admin-stats-row mb-8">
            {TABS.map(t => (
              <Card key={t.id} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab(t.id)}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t.label.split(' ')[0]}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.label.split(' ').slice(1).join(' ')}</div>
              </Card>
            ))}
          </div>

          {/* Tab Content */}
          <Card className="admin-tab-content">
            {activeTab === 'users'      && <UsersTab />}
            {activeTab === 'posts'      && <PostsTab adminUser={user} />}
            {activeTab === 'courses'    && <CoursesTab />}
            {activeTab === 'prop-firms' && <PropFirmsTab />}
            {activeTab === 'promos'     && <PromotionsTab />}
            {activeTab === 'branding'   && <BrandingManager />}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

