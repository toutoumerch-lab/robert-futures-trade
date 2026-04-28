import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import {
  Image, Building2, DollarSign, Settings, Link2, Wrench,
  Star, Check, X, Zap, Flame, Turtle,
  Users, FileText, GraduationCap, Briefcase, PartyPopper, Palette,
  Monitor, Smartphone, ChevronDown, ChevronRight, Layers, Upload,
  Video, BookOpen, Plus, Trash2, Edit3, ChevronUp, ExternalLink, Clock, MessageSquare, BarChart3, ThumbsUp
} from 'lucide-react';

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
            <button className="modal-close" onClick={onClose}><X size={16} /></button>
          </div>
        )}
        {hideHeader && (
          <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 100, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', width: '36px', height: '36px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}><X size={16} /></button>
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
    axios.get('http://localhost:5000/api/users')
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchUsers, [fetchUsers]);

  const promoteUser = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await axios.patch(`http://localhost:5000/api/users/${id}/role`, { role: newRole });
    fetchUsers();
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await axios.delete(`http://localhost:5000/api/users/${id}`);
    fetchUsers();
  };

  if (loading) return <div className="tab-loading">Loading users...</div>;

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

// ──────────────────── Posts Tab (Blog Management) ────────────────────

const PostsTab = ({ adminUser }) => {
  const [posts, setPosts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [activeTab, setActiveTab]     = useState('content');
  const [editing, setEditing]         = useState(null);
  const [imagePreview, setPreview]    = useState(null);
  const [pubLoading, setPubLoad]      = useState(null);
  const [commentsModal, setCommModal] = useState(null);
  const [comments, setComments]       = useState([]);
  const [comLoading, setComLoad]      = useState(false);

  // ── Category state ──
  const [categories, setCategories]         = useState([]);
  const [catLoading, setCatLoading]         = useState(false);
  const [newCatName, setNewCatName]         = useState('');
  const [addingCat, setAddingCat]           = useState(false);
  const [catSaving, setCatSaving]           = useState(false);
  const [editingCatId, setEditingCatId]     = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [showCatPanel, setShowCatPanel]     = useState(false);

  const [form, setForm] = useState({
    title: '', content: '', excerpt: '',
    category: 'General', read_time: '',
    is_published: false, image: null,
  });

  const fetchPosts = useCallback(() => {
    setLoading(true);
    axios.get('http://localhost:5000/api/posts')
      .then(res => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchCategories = useCallback(() => {
    setCatLoading(true);
    axios.get('http://localhost:5000/api/categories')
      .then(res => setCategories(res.data || []))
      .catch(console.error)
      .finally(() => setCatLoading(false));
  }, []);

  useEffect(() => { fetchPosts(); fetchCategories(); }, [fetchPosts, fetchCategories]);

  // ── Category actions ──
  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name || catSaving) return;
    setCatSaving(true);
    try {
      const res = await axios.post('http://localhost:5000/api/categories', { name });
      const created = res.data;
      setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(f => ({ ...f, category: created.name }));
      setNewCatName('');
      setAddingCat(false);
    } catch (err) {
      if (err.response?.status === 409) {
        const existing = err.response.data.category;
        if (existing) {
          setCategories(prev =>
            prev.find(c => c.id === existing.id)
              ? prev
              : [...prev, existing].sort((a, b) => a.name.localeCompare(b.name))
          );
          setForm(f => ({ ...f, category: existing.name }));
        }
        setNewCatName('');
        setAddingCat(false);
      } else {
        alert(err.response?.data?.message || 'Error creating category');
      }
    } finally { setCatSaving(false); }
  };

  const handleRenameCategory = async (id) => {
    const name = editingCatName.trim();
    if (!name) return;
    try {
      const res = await axios.patch(`http://localhost:5000/api/categories/${id}`, { name });
      const updated = res.data;
      setCategories(prev => prev.map(c => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
      // If the form currently has the old name selected, update it
      setForm(f => f.category === categories.find(c => c.id === id)?.name ? { ...f, category: updated.name } : f);
    } catch (err) {
      alert(err.response?.data?.message || 'Error renaming category');
    } finally { setEditingCatId(null); setEditingCatName(''); }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"? Posts using it will fall back to General.`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/categories/${cat.id}`);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      if (form.category === cat.name) setForm(f => ({ ...f, category: 'General' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting category');
    }
  };


  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', excerpt: '', category: 'General', read_time: '', is_published: false, image: null });
    setPreview(null);
    setActiveTab('content');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title || '', content: p.content || '',
      excerpt: p.excerpt || '', category: p.category || 'General',
      read_time: p.read_time || '', is_published: p.is_published || false,
      image: null,
    });
    setPreview(p.image_url ? `http://localhost:5000${p.image_url}` : null);
    setActiveTab('content');
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { alert('Title is required'); return; }
    const token = localStorage.getItem('token');
    const fd = new FormData();
    fd.append('title',        form.title);
    fd.append('content',      form.content);
    fd.append('excerpt',      form.excerpt);
    fd.append('category',     form.category);
    fd.append('read_time',    form.read_time);
    fd.append('is_published', form.is_published);
    if (form.image) fd.append('image', form.image);
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      };
      if (editing) {
        await axios.put(`http://localhost:5000/api/posts/${editing.id}`, fd, config);
      } else {
        await axios.post('http://localhost:5000/api/posts', fd, config);
      }
      setShowModal(false);
      fetchPosts();
    } catch (err) {
      const msg = err.response?.data?.error
                || err.response?.data?.message
                || err.message
                || 'Error saving post';
      alert(`Save failed: ${msg}`);
    }
  };

  const togglePublish = async (post) => {
    setPubLoad(post.id);
    try {
      const res = await axios.patch(`http://localhost:5000/api/posts/${post.id}/publish`);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_published: res.data.is_published } : p));
    } catch (err) { console.error(err); }
    finally { setPubLoad(null); }
  };

  const deletePost = async (id) => {
    if (!window.confirm('Permanently delete this post?')) return;
    await axios.delete(`http://localhost:5000/api/posts/${id}`);
    fetchPosts();
  };

  const openComments = async (post) => {
    setCommModal(post);
    setComLoad(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/posts/${post.id}`);
      setComments(res.data.comments || []);
    } catch (err) { console.error(err); }
    finally { setComLoad(false); }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    await axios.delete(`http://localhost:5000/api/posts/${commentsModal.id}/comments/${commentId}`);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  if (loading) return <div className="tab-loading">Loading blog posts…</div>;

  return (
    <div>
      <div className="tab-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Blog Management</h2>
        <Button onClick={openCreate} style={{ padding: '0.8rem 1.75rem', borderRadius: '99px', fontWeight: 700, boxShadow: '0 8px 20px rgba(37,99,235,0.3)', background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))' }}>
          + New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
          <FileText size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1.25rem' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No posts yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Create your first blog post to start publishing.</p>
          <Button onClick={openCreate}>Create First Post</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {posts.map(p => (
            <div key={p.id} style={{ background: 'var(--bg-secondary)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', boxShadow: '0 8px 24px -8px rgba(0,0,0,0.15)' }}>
              <div style={{ height: '160px', background: p.image_url ? `url(http://localhost:5000${p.image_url}) center/cover` : 'linear-gradient(135deg, var(--bg-tertiary), rgba(37,99,235,0.08))', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!p.image_url && <FileText size={36} style={{ color: 'var(--accent-primary)', opacity: 0.4 }} />}
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: '99px', background: p.is_published ? 'rgba(16,185,129,0.9)' : 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                    {p.is_published ? 'Published' : 'Draft'}
                  </span>
                  {p.category && <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', background: 'rgba(37,99,235,0.85)', color: '#fff', backdropFilter: 'blur(4px)' }}>{p.category}</span>}
                </div>
              </div>
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>{p.title}</h3>
                {p.excerpt && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.excerpt.substring(0, 100)}{p.excerpt.length > 100 ? '…' : ''}</p>}
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', alignItems: 'center' }}>
                  <Clock size={11} /><span>{p.read_time || '—'}</span>
                  <span>{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => togglePublish(p)} disabled={pubLoading === p.id} style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', border: 'none', background: p.is_published ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: p.is_published ? '#ef4444' : '#10b981', transition: 'all 0.2s' }}>
                  {pubLoading === p.id ? '…' : (p.is_published ? 'Unpublish' : 'Publish')}
                </button>
                <button onClick={() => openComments(p)} style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageSquare size={13} />{p.comment_count || 0}
                </button>
                <button onClick={() => openEdit(p)} style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  <Edit3 size={13} />
                </button>
                <button onClick={() => deletePost(p.id)} style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal hideHeader onClose={() => setShowModal(false)} style={{ maxWidth: '780px', width: '95%' }}>
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                {editing ? 'Edit Post' : 'New Blog Post'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
              {['content', 'media', 'settings'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '0.6rem 1.25rem', borderRadius: '99px', border: activeTab === t ? 'none' : '1px solid var(--border)', background: activeTab === t ? 'var(--accent-primary)' : 'transparent', color: activeTab === t ? '#fff' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', fontSize: '0.85rem', transition: 'all 0.2s', boxShadow: activeTab === t ? '0 4px 12px rgba(37,99,235,0.3)' : 'none' }}>
                  {t}
                </button>
              ))}
            </div>
            <form onSubmit={handleSave} className="modal-form">
              {activeTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
                  <div className="form-group">
                    <label className="form-label">Post Title *</label>
                    <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter a compelling title…" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Short Excerpt</label>
                    <textarea className="input" rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="A brief description shown in the blog grid (auto-generated if left empty)…" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Post Content</label>
                    <textarea className="input" rows={14} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your full article here. Use blank lines to separate paragraphs…" style={{ fontFamily: 'Georgia, serif', lineHeight: 1.8, fontSize: '1rem' }} />
                  </div>
                </div>
              )}
              {activeTab === 'media' && (
                <div style={{ animation: 'fadeIn 0.25s ease' }}>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center', background: 'var(--bg-secondary)' }}>
                    <Upload size={40} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontWeight: 800 }}>Cover Image</h4>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>JPG, PNG, WebP, GIF or SVG — max 10 MB</p>
                    {imagePreview && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <img src={imagePreview} alt="preview" style={{ width: '100%', maxWidth: '420px', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '16px', border: '2px solid var(--accent-primary)', boxShadow: '0 10px 30px rgba(37,99,235,0.2)' }} />
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ width: '100%', maxWidth: '360px', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '12px', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                  </div>
                </div>
              )}
              {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>

                  {/* ── Category field with inline Add ── */}
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Category</span>
                      <button type="button" onClick={() => { setAddingCat(v => !v); setNewCatName(''); }}
                        style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {addingCat ? '✕ Cancel' : '+ New Category'}
                      </button>
                    </label>

                    {addingCat ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          className="input" autoFocus placeholder="e.g. Options Trading"
                          value={newCatName} onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } if (e.key === 'Escape') { setAddingCat(false); setNewCatName(''); } }}
                          style={{ flex: 1 }} disabled={catSaving}
                        />
                        <button type="button" onClick={handleAddCategory}
                          disabled={!newCatName.trim() || catSaving}
                          style={{ padding: '0 1.25rem', borderRadius: '10px', fontWeight: 700, border: 'none', background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer', opacity: (!newCatName.trim() || catSaving) ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                          {catSaving ? '…' : 'Add'}
                        </button>
                      </div>
                    ) : (
                      <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                        {catLoading && <option value="">Loading…</option>}
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        {/* Preserve current value even if not in the fetched list yet */}
                        {form.category && !categories.find(c => c.name === form.category) && (
                          <option value={form.category}>{form.category}</option>
                        )}
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Read Time</label>
                    <input className="input" value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time: e.target.value }))} placeholder="e.g. 5 min read (auto-calculated if blank)" />
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Publish Post</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Toggle to make this post visible to the public</div>
                    </div>
                    <Toggle checked={form.is_published} onChange={() => setForm(f => ({ ...f, is_published: !f.is_published }))} />
                  </div>
                </div>
              )}
              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                  {editing ? 'Save Changes' : (form.is_published ? 'Publish Post' : 'Save as Draft')}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ─── Manage Blog Categories Panel ──────────────────────────────────────── */}
      <div style={{ marginTop: '3rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <button type="button" onClick={() => setShowCatPanel(v => !v)}
          style={{ width: '100%', padding: '1.25rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
            Manage Blog Categories
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '2px 10px', borderRadius: '99px', border: '1px solid var(--border)' }}>
              {categories.length}
            </span>
          </span>
          {showCatPanel ? <ChevronUp size={18} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />}
        </button>

        {showCatPanel && (
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            {/* Add new category */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
              <input
                className="input" placeholder="New category name…"
                value={newCatName} onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                style={{ flex: 1 }} disabled={catSaving}
              />
              <button type="button" onClick={handleAddCategory}
                disabled={!newCatName.trim() || catSaving}
                style={{ padding: '0 1.25rem', borderRadius: '10px', fontWeight: 700, border: 'none', background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', opacity: (!newCatName.trim() || catSaving) ? 0.5 : 1 }}>
                {catSaving ? '…' : '+ Add'}
              </button>
            </div>

            {catLoading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Loading…</p>
            ) : categories.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No categories yet. Add one above.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {categories.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'all 0.2s' }}>
                    {editingCatId === cat.id ? (
                      <>
                        <input autoFocus className="input"
                          value={editingCatName} onChange={e => setEditingCatName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleRenameCategory(cat.id); } if (e.key === 'Escape') setEditingCatId(null); }}
                          style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.9rem' }}
                        />
                        <button type="button" onClick={() => handleRenameCategory(cat.id)}
                          style={{ padding: '4px 12px', borderRadius: '8px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Save</button>
                        <button type="button" onClick={() => setEditingCatId(null)}
                          style={{ padding: '4px 10px', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{cat.name}</span>
                        <button type="button" title="Rename"
                          onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                          style={{ padding: '4px 8px', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Edit3 size={13} />
                        </button>
                        <button type="button" title="Delete"
                          onClick={() => handleDeleteCategory(cat)}
                          style={{ padding: '4px 8px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {commentsModal && (
        <Modal title={`Comments — ${commentsModal.title}`} onClose={() => { setCommModal(null); setComments([]); }} style={{ maxWidth: '640px', width: '95%' }}>
          {comLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading comments…</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No comments on this post yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {comments.map(c => (
                <div key={c.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{c.author_name}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.9rem' }}>{c.content}</p>
                  </div>
                  <button onClick={() => deleteComment(c.id)} style={{ padding: '0.4rem', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
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

  // ── Content (Modules/Lessons) state ──
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [editingModule, setEditingModule] = useState(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDesc, setEditModuleDesc] = useState('');
  const [addingLessonTo, setAddingLessonTo] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [editingLesson, setEditingLesson] = useState(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonDesc, setEditLessonDesc] = useState('');
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState('');
  const [editLessonDuration, setEditLessonDuration] = useState('');
  const [newLessonVideoFile, setNewLessonVideoFile] = useState(null);
  const [newLessonPdfFile, setNewLessonPdfFile] = useState(null);
  const [newLessonZipFile, setNewLessonZipFile] = useState(null);
  const [editLessonVideoFile, setEditLessonVideoFile] = useState(null);
  const [editLessonPdfFile, setEditLessonPdfFile] = useState(null);
  const [editLessonZipFile, setEditLessonZipFile] = useState(null);

  const fetchModules = useCallback(async (courseId) => {
    if (!courseId) { setModules([]); return; }
    setModulesLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/courses/${courseId}/modules`);
      setModules(res.data || []);
    } catch (e) { console.error('Error fetching modules:', e); }
    finally { setModulesLoading(false); }
  }, []);

  const handleAddModule = async (courseId) => {
    if (!newModuleTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/courses/${courseId}/modules`, 
        { title: newModuleTitle.trim(), description: newModuleDesc.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModules(prev => [...prev, res.data]);
      setNewModuleTitle(''); setNewModuleDesc(''); setAddingModule(false);
    } catch (e) { alert(e.response?.data?.message || 'Error adding module'); }
  };

  const handleUpdateModule = async (modId) => {
    if (!editModuleTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/modules/${modId}`,
        { title: editModuleTitle.trim(), description: editModuleDesc.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModules(prev => prev.map(m => m.id === modId ? { ...m, title: editModuleTitle.trim(), description: editModuleDesc.trim() } : m));
      setEditingModule(null);
    } catch (e) { alert(e.response?.data?.message || 'Error updating module'); }
  };

  const handleDeleteModule = async (modId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/modules/${modId}`, { headers: { Authorization: `Bearer ${token}` } });
      setModules(prev => prev.filter(m => m.id !== modId));
    } catch (e) { alert('Error deleting module'); }
  };

  const handleAddLesson = async (moduleId) => {
    if (!newLessonTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', newLessonTitle.trim());
      formData.append('description', newLessonDesc.trim());
      formData.append('video_url', newLessonVideoUrl.trim());
      formData.append('duration', newLessonDuration.trim());
      if (newLessonVideoFile) formData.append('video_file', newLessonVideoFile);
      if (newLessonPdfFile) formData.append('pdf_file', newLessonPdfFile);
      if (newLessonZipFile) formData.append('zip_file', newLessonZipFile);
      const res = await axios.post(`http://localhost:5000/api/modules/${moduleId}/lessons`, formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: [...(m.lessons || []), res.data] } : m));
      setNewLessonTitle(''); setNewLessonDesc(''); setNewLessonVideoUrl(''); setNewLessonDuration('');
      setNewLessonVideoFile(null); setNewLessonPdfFile(null); setNewLessonZipFile(null);
      setAddingLessonTo(null);
    } catch (e) { alert(e.response?.data?.message || 'Error adding lesson'); }
  };

  const handleUpdateLesson = async (lessonId, moduleId) => {
    if (!editLessonTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', editLessonTitle.trim());
      formData.append('description', editLessonDesc.trim());
      formData.append('video_url', editLessonVideoUrl.trim());
      formData.append('duration', editLessonDuration.trim());
      if (editLessonVideoFile) formData.append('video_file', editLessonVideoFile);
      if (editLessonPdfFile) formData.append('pdf_file', editLessonPdfFile);
      if (editLessonZipFile) formData.append('zip_file', editLessonZipFile);
      const res = await axios.put(`http://localhost:5000/api/lessons/${lessonId}`, formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      setModules(prev => prev.map(m => m.id === moduleId
        ? { ...m, lessons: (m.lessons || []).map(l => l.id === lessonId ? { ...l, ...res.data } : l) }
        : m
      ));
      setEditingLesson(null);
      setEditLessonVideoFile(null); setEditLessonPdfFile(null); setEditLessonZipFile(null);
    } catch (e) { alert(e.response?.data?.message || 'Error updating lesson'); }
  };

  const handleDeleteLesson = async (lessonId, moduleId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/lessons/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } });
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: (m.lessons || []).filter(l => l.id !== lessonId) } : m));
    } catch (e) { alert('Error deleting lesson'); }
  };

  const toggleModuleExpand = (modId) => setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));

  const fetchCourses = useCallback(() => {
    setLoading(true);
    axios.get('http://localhost:5000/api/courses')
      .then(res => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchCategories = useCallback(() => {
    axios.get('http://localhost:5000/api/categories')
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
      const res = await axios.post('http://localhost:5000/api/categories', { name: catName.trim() });
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
      await axios.delete(`http://localhost:5000/api/categories/${catId}`);
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

  const openCreate = () => { setEditing(null); setForm(initialForm); setActiveTab('basic'); setModules([]); setShowModal(true); };
  
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
    fetchModules(c.id);
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

    // Pass existing media URLs back so the backend preserves them if no new file
    if (editing) {
      if (editing.image_url) formData.append('image_url', editing.image_url);
      if (editing.pdf_url) formData.append('pdf_url', editing.pdf_url);
      if (editing.video_file) formData.append('video_file', editing.video_file);
    }

    // Override with new files if user uploaded replacements
    if (form.image) formData.append('image', form.image);
    if (form.pdf_file) formData.append('pdf_file', form.pdf_file);
    if (form.video_file) formData.append('video_file', form.video_file);

    try {
      if (editing) {
        await axios.put(`http://localhost:5000/api/courses/${editing.id}`, formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:5000/api/courses', formData, {
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
    await axios.delete(`http://localhost:5000/api/courses/${id}`);
    fetchCourses();
  };

  if (loading) return <div className="tab-loading">Loading courses...</div>;

  return (
    <div>
      <div className="tab-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Course Directory</h2>
        <Button onClick={openCreate} style={{ padding: '0.8rem 1.75rem', borderRadius: '99px', fontWeight: 700, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)', background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))' }}>+ Add Course Entry</Button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {courses.map(c => (
          <div key={c.id} style={{ background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)' }}>
            <div style={{ height: '180px', width: '100%', backgroundImage: c.image_url ? `url(http://localhost:5000${c.image_url})` : 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.02))', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: c.is_free ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, var(--bg-primary), var(--bg-secondary))', border: c.is_free ? 'none' : '1px solid var(--border)', padding: '6px 16px', borderRadius: '99px', color: c.is_free ? 'white' : 'var(--text-primary)', fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                {c.is_free ? 'FREE' : `$${c.price}`}
              </div>
            </div>
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: '99px', color: 'var(--accent-primary)', fontWeight: 800, border: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.level || 'Beginner'}</span>
                <span style={{ fontSize: '0.75rem', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: '99px', color: 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {c.duration || 'N/A'}</span>
              </div>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.5px' }}>{c.title}</h3>
              
              <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                <button onClick={() => openEdit(c)} style={{ flex: 1, background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '0.7rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>Edit Course</button>
                <button onClick={() => deleteCourse(c.id)} style={{ padding: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Course"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {courses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-secondary)', borderRadius: '32px', border: '1px dashed var(--border)' }}>
          <BookOpen size={48} style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }} />
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
               {['basic', 'details', 'pricing', 'media', 'content'].map(tab => (
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
                               display: 'flex', alignItems: 'center', gap: '6px',
                               padding: '6px 12px 6px 14px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600,
                               transition: 'all 0.2s ease',
                               border: isActive ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                               background: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                               color: isActive ? '#fff' : 'var(--text-secondary)',
                               boxShadow: isActive ? '0 0 10px rgba(124, 58, 237, 0.4)' : 'none'
                             }}
                           >
                             <span onClick={() => setForm({ ...form, category: cat.name })} style={{ cursor: 'pointer' }}>{cat.name}</span>
                             {user?.role === 'admin' && (<button type="button" onClick={e => handleDeleteCategory(cat.id, cat.name, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)', fontSize: '0.75rem', lineHeight: 1, padding: '0 0 0 2px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }} title={`Delete "${cat.name}"`}><X size={14} /></button>)}
                           </div>
                         );
                       })}
            <Card style={{ textAlign: 'center', cursor: 'pointer', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }} onClick={() => navigate('/admin/revenue')}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'center' }}><DollarSign size={24} style={{ color: '#10b981' }} /></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 800 }}>Revenue ✨</div>
            </Card>
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
                     <Upload size={40} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />
                     <label className="form-label text-center" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 800 }}>Course Cover Art</label>
                     <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Upload a high-quality 16:9 thumbnail image (JPG/PNG)</p>
                     
                     {/* Current thumbnail preview */}
                     {editing && editing.image_url && !form.image && (
                       <div style={{ marginBottom: '1.5rem' }}>
                         <img src={`http://localhost:5000${editing.image_url}`} alt="Current cover" style={{ width: '100%', maxWidth: '360px', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '16px', border: '2px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} />
                         <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Check size={14} /> Current cover image active</div>
                       </div>
                     )}
                     {form.image && (
                       <div style={{ marginBottom: '1.5rem' }}>
                         <img src={URL.createObjectURL(form.image)} alt="New cover preview" style={{ width: '100%', maxWidth: '360px', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '16px', border: '2px solid var(--accent-primary)', boxShadow: '0 10px 25px rgba(37,99,235,0.2)' }} />
                         <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Upload size={14} /> New image selected (will replace on save)</div>
                       </div>
                     )}

                     <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                       <input type="file" accept="image/*" onChange={e => setForm({...form, image: e.target.files[0]})} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '12px', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                     </div>
                   </div>

                   {/* Video Options */}
                   <div style={{ background: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                       <Video size={28} style={{ color: 'var(--accent-primary)' }} />
                       <div>
                         <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>Video Engine</h4>
                         <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>We support either YouTube links or secure raw MP4 uploads. Do not use both simultaneously.</span>
                       </div>
                     </div>
                     
                     <div className="form-group" style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px dashed var(--border)' }}>
                       <label className="form-label" style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>A) YouTube / Vimeo URL Path</label>
                       <input className="input" type="text" value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/..." />
                       {editing && editing.video_url && !form.video_url && (
                         <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> YouTube URL saved</div>
                       )}
                     </div>

                     <div className="form-group">
                       <label className="form-label" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>B) Upload Raw MP4 Object</label>
                       <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '-0.25rem 0 1rem 0' }}>Max Size: 500MB payload limit injected directly to Node relay.</p>
                       <input type="file" accept="video/mp4,video/webm" onChange={e => setForm({...form, video_file: e.target.files[0]})} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                       {editing && editing.video_file && !form.video_file && (
                         <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> MP4 file saved: {editing.video_file}</div>
                       )}
                       {form.video_file && (
                         <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(37,99,235,0.1)', color: 'var(--accent-primary)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Upload size={14} /> New MP4 selected: {form.video_file.name} (will replace on save)</div>
                       )}
                     </div>
                   </div>

                   {/* PDF Upload */}
                   <div className="form-group" style={{ border: '2px dashed var(--border)', padding: '2.5rem', borderRadius: '24px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <FileText size={40} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />
                     <label className="form-label" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Supporting Documentation</label>
                     <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Attach any PDF cheatsheets or study guides associated with this course.</p>
                     
                     {editing && editing.pdf_url && !form.pdf_file && (
                       <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem', background: 'rgba(16,185,129,0.08)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '400px' }}>
                         <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                         <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>PDF uploaded</span>
                         <a href={`http://localhost:5000${editing.pdf_url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>View <ExternalLink size={12} /></a>
                       </div>
                     )}
                     {form.pdf_file && (
                       <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem', background: 'rgba(37,99,235,0.08)', borderRadius: '12px', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '400px' }}>
                         <Upload size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                         <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>New PDF: {form.pdf_file.name}</span>
                       </div>
                     )}

                     <input type="file" accept="application/pdf" onChange={e => setForm({...form, pdf_file: e.target.files[0]})} style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                   </div>

                 </div>
               )}

               {activeTab === 'content' && (
                 <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                   {!editing ? (
                     <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
                       <BookOpen size={48} style={{ marginBottom: '1rem', color: 'var(--accent-primary)', opacity: 0.6 }} />
                       <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Save Course First</h3>
                       <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Please publish the course first, then reopen it to add modules and lessons.</p>
                     </div>
                   ) : (
                     <div>
                       {/* Header */}
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                         <div>
                           <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>Course Content</h3>
                           <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                             {modules.length} module{modules.length !== 1 ? 's' : ''} &middot; {modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)} lesson{modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) !== 1 ? 's' : ''}
                           </p>
                         </div>
                         <button type="button" onClick={() => { setAddingModule(true); setNewModuleTitle(''); setNewModuleDesc(''); }}
                           style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '99px', background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))', color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
                           <Plus size={16} /> Add Module
                         </button>
                       </div>

                       {modulesLoading && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading modules...</div>}

                       {/* Add Module Form */}
                       {addingModule && (
                         <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem', animation: 'fadeIn 0.25s ease-out' }}>
                           <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Layers size={16} /> New Module</h4>
                           <input className="input" placeholder="Module title..." value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} style={{ marginBottom: '0.75rem' }} />
                           <textarea className="input" placeholder="Module description (optional)..." value={newModuleDesc} onChange={e => setNewModuleDesc(e.target.value)} rows={2} style={{ marginBottom: '1rem' }} />
                           <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                             <button type="button" onClick={() => setAddingModule(false)} style={{ padding: '0.5rem 1.25rem', borderRadius: '99px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                             <button type="button" onClick={() => handleAddModule(editing.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '99px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Add Module</button>
                           </div>
                         </div>
                       )}

                       {/* Modules List */}
                       {!modulesLoading && modules.length === 0 && !addingModule && (
                         <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
                           <Layers size={40} style={{ marginBottom: '1rem', color: 'var(--text-secondary)', opacity: 0.4 }} />
                           <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No modules yet. Click "Add Module" to get started.</p>
                         </div>
                       )}

                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                         {modules.map((mod, modIndex) => (
                           <div key={mod.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                             {/* Module Header */}
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', cursor: 'pointer', userSelect: 'none' }}
                               onClick={() => toggleModuleExpand(mod.id)}>
                               <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
                                 {modIndex + 1}
                               </div>
                               <div style={{ flex: 1, minWidth: 0 }}>
                                 {editingModule === mod.id ? (
                                   <div onClick={e => e.stopPropagation()}>
                                     <input className="input" value={editModuleTitle} onChange={e => setEditModuleTitle(e.target.value)} style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }} />
                                     <textarea className="input" value={editModuleDesc} onChange={e => setEditModuleDesc(e.target.value)} rows={2} style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }} />
                                     <div style={{ display: 'flex', gap: '0.4rem' }}>
                                       <button type="button" onClick={() => handleUpdateModule(mod.id)} style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>Save</button>
                                       <button type="button" onClick={() => setEditingModule(null)} style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                                     </div>
                                   </div>
                                 ) : (
                                   <>
                                     <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</h4>
                                     {mod.description && <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.description}</p>}
                                   </>
                                 )}
                               </div>
                               <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>
                                 {(mod.lessons?.length || 0)} lesson{(mod.lessons?.length || 0) !== 1 ? 's' : ''}
                               </span>
                               <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                 <button type="button" onClick={() => { setEditingModule(mod.id); setEditModuleTitle(mod.title); setEditModuleDesc(mod.description || ''); }} style={{ padding: '0.35rem', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit module"><Edit3 size={14} /></button>
                                 <button type="button" onClick={() => handleDeleteModule(mod.id)} style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete module"><Trash2 size={14} /></button>
                               </div>
                               <div style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s', transform: expandedModules[mod.id] ? 'rotate(180deg)' : 'rotate(0)' }}>
                                 <ChevronDown size={16} />
                               </div>
                             </div>

                             {/* Expanded: Lessons */}
                             {expandedModules[mod.id] && (
                               <div style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem 1.25rem 1rem', background: 'var(--bg-tertiary)', animation: 'fadeIn 0.2s ease-out' }}>
                                 {(mod.lessons || []).length === 0 && addingLessonTo !== mod.id && (
                                   <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem 0' }}>No lessons in this module yet.</p>
                                 )}

                                 {(mod.lessons || []).map((lesson, lessonIdx) => (
                                   <div key={lesson.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 0', borderBottom: lessonIdx < (mod.lessons.length - 1) ? '1px solid var(--border-color)' : 'none' }}>
                                     <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0, marginTop: '0.1rem' }}>
                                       {lessonIdx + 1}
                                     </div>
                                     {editingLesson === lesson.id ? (
                                       <div style={{ flex: 1 }}>
                                         <input className="input" value={editLessonTitle} onChange={e => setEditLessonTitle(e.target.value)} placeholder="Lesson title" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }} />
                                         <textarea className="input" value={editLessonDesc} onChange={e => setEditLessonDesc(e.target.value)} placeholder="Description (optional)" rows={2} style={{ marginBottom: '0.5rem', fontSize: '0.82rem' }} />
                                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                           <input className="input" value={editLessonVideoUrl} onChange={e => setEditLessonVideoUrl(e.target.value)} placeholder="YouTube/Vimeo URL (optional)" style={{ fontSize: '0.82rem' }} />
                                           <input className="input" value={editLessonDuration} onChange={e => setEditLessonDuration(e.target.value)} placeholder="Duration (e.g. 15m)" style={{ fontSize: '0.82rem' }} />
                                         </div>
                                         {/* File Uploads */}
                                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.6rem', padding: '0.6rem', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                             <Video size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                             <div style={{ flex: 1 }}>
                                               <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>Upload MP4{lesson.video_file ? ' (has existing)' : ''}</label>
                                               <input type="file" accept="video/mp4,video/webm" onChange={e => setEditLessonVideoFile(e.target.files[0] || null)} style={{ width: '100%', fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
                                             </div>
                                           </div>
                                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                             <FileText size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                             <div style={{ flex: 1 }}>
                                               <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>PDF Resource{lesson.pdf_url ? ' (has existing)' : ''}</label>
                                               <input type="file" accept=".pdf,application/pdf" onChange={e => setEditLessonPdfFile(e.target.files[0] || null)} style={{ width: '100%', fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
                                             </div>
                                           </div>
                                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                             <Upload size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                                             <div style={{ flex: 1 }}>
                                               <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>ZIP Resources{lesson.zip_url ? ' (has existing)' : ''}</label>
                                               <input type="file" accept=".zip,application/zip,application/x-zip-compressed" onChange={e => setEditLessonZipFile(e.target.files[0] || null)} style={{ width: '100%', fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
                                             </div>
                                           </div>
                                         </div>
                                         <div style={{ display: 'flex', gap: '0.4rem' }}>
                                           <button type="button" onClick={() => handleUpdateLesson(lesson.id, mod.id)} style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>Save</button>
                                           <button type="button" onClick={() => { setEditingLesson(null); setEditLessonVideoFile(null); setEditLessonPdfFile(null); setEditLessonZipFile(null); }} style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                                         </div>
                                       </div>
                                     ) : (
                                       <>
                                         <div style={{ flex: 1, minWidth: 0 }}>
                                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                             {(lesson.video_url || lesson.video_file) ? <Video size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} /> : <FileText size={13} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />}
                                             <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
                                           </div>
                                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                                             {lesson.duration && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lesson.duration}</span>}
                                             {lesson.video_file && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(37,99,235,0.12)', color: 'var(--accent-primary)', fontWeight: 700 }}>MP4</span>}
                                             {lesson.pdf_url && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 700 }}>PDF</span>}
                                             {lesson.zip_url && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 700 }}>ZIP</span>}
                                           </div>
                                         </div>
                                         <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                                           <button type="button" onClick={() => { setEditingLesson(lesson.id); setEditLessonTitle(lesson.title); setEditLessonDesc(lesson.description || ''); setEditLessonVideoUrl(lesson.video_url || ''); setEditLessonDuration(lesson.duration || ''); }} style={{ padding: '0.3rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }} title="Edit lesson"><Edit3 size={13} /></button>
                                           <button type="button" onClick={() => handleDeleteLesson(lesson.id, mod.id)} style={{ padding: '0.3rem', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', display: 'flex' }} title="Delete lesson"><Trash2 size={13} /></button>
                                         </div>
                                       </>
                                     )}
                                   </div>
                                 ))}

                                 {/* Add Lesson Form */}
                                 {addingLessonTo === mod.id ? (
                                   <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                     <h5 style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Video size={14} /> New Lesson</h5>
                                     <input className="input" placeholder="Lesson title..." value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }} />
                                     <textarea className="input" placeholder="Lesson description (optional)..." value={newLessonDesc} onChange={e => setNewLessonDesc(e.target.value)} rows={2} style={{ marginBottom: '0.5rem', fontSize: '0.82rem' }} />
                                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                       <input className="input" placeholder="YouTube/Vimeo URL (optional)" value={newLessonVideoUrl} onChange={e => setNewLessonVideoUrl(e.target.value)} style={{ fontSize: '0.82rem' }} />
                                       <input className="input" placeholder="Duration (e.g. 15m)" value={newLessonDuration} onChange={e => setNewLessonDuration(e.target.value)} style={{ fontSize: '0.82rem' }} />
                                     </div>
                                     {/* File Uploads */}
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                         <Video size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                         <div style={{ flex: 1 }}>
                                           <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Upload MP4 Video</label>
                                           <input type="file" accept="video/mp4,video/webm" onChange={e => setNewLessonVideoFile(e.target.files[0] || null)} style={{ width: '100%', fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
                                         </div>
                                       </div>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                         <FileText size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                         <div style={{ flex: 1 }}>
                                           <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>PDF Resource</label>
                                           <input type="file" accept=".pdf,application/pdf" onChange={e => setNewLessonPdfFile(e.target.files[0] || null)} style={{ width: '100%', fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
                                         </div>
                                       </div>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                         <Upload size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                                         <div style={{ flex: 1 }}>
                                           <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>ZIP Resources</label>
                                           <input type="file" accept=".zip,application/zip,application/x-zip-compressed" onChange={e => setNewLessonZipFile(e.target.files[0] || null)} style={{ width: '100%', fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
                                         </div>
                                       </div>
                                     </div>
                                     <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                       <button type="button" onClick={() => { setAddingLessonTo(null); setNewLessonVideoFile(null); setNewLessonPdfFile(null); setNewLessonZipFile(null); }} style={{ padding: '0.4rem 1rem', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                                       <button type="button" onClick={() => handleAddLesson(mod.id)} style={{ padding: '0.4rem 1rem', borderRadius: '8px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Add Lesson</button>
                                     </div>
                                   </div>
                                 ) : (
                                   <button type="button" onClick={() => { setAddingLessonTo(mod.id); setNewLessonTitle(''); setNewLessonDesc(''); setNewLessonVideoUrl(''); setNewLessonDuration(''); setNewLessonVideoFile(null); setNewLessonPdfFile(null); setNewLessonZipFile(null); }}
                                     style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 1rem', borderRadius: '99px', background: 'transparent', color: 'var(--accent-primary)', border: '1px dashed var(--accent-primary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }}
                                     onMouseOver={e => e.currentTarget.style.opacity = '1'}
                                     onMouseOut={e => e.currentTarget.style.opacity = '0.8'}>
                                     <Plus size={14} /> Add Lesson
                                   </button>
                                 )}
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
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
  const [availableGroups, setAvailableGroups] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Group assignment modal
  const [groupingFirm, setGroupingFirm] = useState(null);
  const [groupModalValue, setGroupModalValue] = useState('');
  const [groupModalMode, setGroupModalMode] = useState('existing'); // 'existing' | 'new'
  const [groupLogoFile, setGroupLogoFile] = useState(null);
  const [groupLogoPreview, setGroupLogoPreview] = useState(null);
  const groupLogoInputRef = useRef(null);

  // Helper to get group image
  const getGroupImage = (groupName) => {
    const g = availableGroups.find(gr => gr.name === groupName);
    return g ? g.image_url : null;
  };

  const initialFormState = {
    name: '', importance: 'Medium', featured: false, rating: '', website: '', affiliate_link: '',
    twitter: '', discord: '', last_checked: '', is_affiliate: false,
    discount_code: '', overall_score: '', platforms: [], account_category: '', price: '',
    activation_fee: '', profit_split: '', max_withdrawal: '',
    profit_target: '', drawdown_limit: '', days_to_pass: '', days_to_payout: '', notes: '',
    status_color: 'green', buffer: false, buffer_amount: '', eval: '', pa: '', reset_fee: '', 
    copy_trade: false, vpn: false, max_accounts: '', dll: '',
    fifty_k_all_in: '', fifty_k_initial_cost: '', without_discount_usd: '', 
    discount_usd: '', discount_percent: '', dca: false, news: false, 
    bots: false, micro_scalping: false, logo_url: '', imageFile: null,
    group_name: ''
  };
  const [form, setForm] = useState(initialFormState);

  const fetchFirms = useCallback(() => {
    setLoading(true);
    axios.get('http://localhost:5000/api/prop-firms/admin')
      .then(res => setFirms(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFirms();
    axios.get('http://localhost:5000/api/prop-firms/platforms')
      .then(res => setAvailablePlatforms(res.data))
      .catch(console.error);
    axios.get('http://localhost:5000/api/prop-firms/groups')
      .then(res => setAvailableGroups(res.data))
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
      buffer: !!f.buffer, buffer_amount: (f.buffer_amount != null ? String(f.buffer_amount) : ''), eval: f.eval || '', pa: f.pa || '', 
      reset_fee: (f.reset_fee != null ? String(f.reset_fee) : ''), copy_trade: !!f.copy_trade, vpn: !!f.vpn,
      max_accounts: f.max_accounts || '', dll: f.dll || '',
      fifty_k_all_in: f.fifty_k_all_in || '', fifty_k_initial_cost: f.fifty_k_initial_cost || '', 
      without_discount_usd: f.without_discount_usd || '', discount_usd: f.discount_usd || '', 
      discount_percent: f.discount_percent || '', dca: f.dca || false, news: f.news || false, 
      bots: f.bots || false, micro_scalping: f.micro_scalping || false,
      logo_url: f.logo_url || '', imageFile: null,
      group_name: f.group_name || ''
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
      await axios.post('http://localhost:5000/api/prop-firms/bulk', importPreview);
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

    const latest = formRef.current;
    
    // Build FormData — let the backend handle all type coercion
    const formData = new FormData();
    
    Object.keys(latest).forEach(key => {
      // 1. Convert platforms array to JSON string
      if (key === 'platforms') {
        formData.append(key, JSON.stringify(latest[key]));
      } 
      // 2. Attach physical file binary as "logo"
      else if (key === 'imageFile') {
        if (latest[key] instanceof File) {
          formData.append('logo', latest[key]);
        }
      } 
      // 3. Append all other values (empty strings are fine — backend converts them to null)
      else {
        let val = latest[key];
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
        await axios.put(`http://localhost:5000/api/prop-firms/${editing.id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/prop-firms', formData);
      }
      setShowModal(false);
      fetchFirms();
      // Refresh available groups in case a new group name was entered
      axios.get('http://localhost:5000/api/prop-firms/groups')
        .then(res => setAvailableGroups(res.data))
        .catch(console.error);
    } catch (err) {
      console.error("API Save Error:", err);
      const serverMsg = err.response?.data?.message || err.message || 'Unknown error';
      alert('Failed to save: ' + serverMsg);
    }
  };


  const deleteFirm = async (id) => {
    if (!window.confirm('Delete this prop firm?')) return;
    await axios.delete(`http://localhost:5000/api/prop-firms/${id}`);
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

  if (loading) return <div className="tab-loading">Loading prop firms...</div>;

  return (
    <div>
      <div className="tab-toolbar" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Button onClick={openCreate}>+ Add Prop Firm</Button>
      </div>
      <div className="admin-table-wrap">
        {(() => {
          // Group firms by group_name
          const grouped = {};
          const order = [];
          firms.forEach(f => {
            const key = f.group_name || '__ungrouped__';
            if (!grouped[key]) { grouped[key] = []; order.push(key); }
            grouped[key].push(f);
          });
          // Sort: named groups first, ungrouped last
          order.sort((a, b) => {
            if (a === '__ungrouped__') return 1;
            if (b === '__ungrouped__') return -1;
            return a.localeCompare(b);
          });

          const toggleGroup = (key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

          return order.map(key => {
            const isUngrouped = key === '__ungrouped__';
            const groupFirms = grouped[key];
            const isCollapsed = collapsedGroups[key];
            const label = isUngrouped ? 'Ungrouped' : key;
            const groupImg = !isUngrouped ? getGroupImage(key) : null;

            return (
              <div key={key} style={{ marginBottom: '1rem' }}>
                {/* Group Header */}
                <div
                  onClick={() => toggleGroup(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none',
                    background: isUngrouped ? 'var(--bg-secondary)' : 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(59,130,246,0.08))',
                    borderRadius: '12px', border: '1px solid var(--border)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isCollapsed ? <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />}
                  {/* Group Logo or Letter Avatar */}
                  {groupImg ? (
                    <img src={`http://localhost:5000${groupImg}`} alt={label} style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(37,99,235,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0 }} />
                  ) : !isUngrouped ? (
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.85rem', flexShrink: 0 }}>{label.charAt(0).toUpperCase()}</div>
                  ) : null}
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{label}</span>
                  <span style={{
                    background: isUngrouped ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(59,130,246,0.15))',
                    color: isUngrouped ? 'var(--text-secondary)' : '#2563eb',
                    padding: '2px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800
                  }}>
                    {groupFirms.length} firm{groupFirms.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Group Items */}
                {!isCollapsed && (
                  <table className="admin-table" style={{ marginTop: '0.25rem' }}>
                    <thead>
                      <tr><th>Name</th><th>Rating</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {groupFirms.map(f => (
                        <tr key={f.id}>
                          <td style={{ fontWeight: 600 }}>
                            {f.name}
                            {f.featured && <Star size={14} style={{ display: 'inline', color: '#f59e0b', fill: '#f59e0b', verticalAlign: 'middle', marginLeft: '4px' }} />}
                            {f.group_name && <span style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', fontWeight: 700 }}>{f.group_name}</span>}
                          </td>
                          <td>{f.rating ? `${f.rating} / 5` : '-'}</td>
                          <td>
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: f.status_color === 'green' ? '#10b981' : f.status_color === 'blue' ? '#3b82f6' : f.status_color === 'yellow' ? '#f59e0b' : '#ef4444', boxShadow: '0 0 5px rgba(0,0,0,0.2)' }}
                              title={f.status_color === 'green' ? 'Top Ranked' : f.status_color === 'blue' ? 'Community Trusted' : f.status_color === 'yellow' ? 'New / Building Trust' : 'Avoid / Possible Scam'} />
                          </td>
                          <td className="table-actions">
                            <button className="action-btn" style={{backgroundColor: 'var(--bg-tertiary)'}} onClick={() => setViewingFirm(f)}>View</button>
                            <button className="action-btn" onClick={() => openEdit(f)}>Edit</button>
                            <button className="action-btn" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(59,130,246,0.12))', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)' }} onClick={() => { setGroupingFirm(f); setGroupModalValue(f.group_name || ''); setGroupModalMode(f.group_name ? 'existing' : 'existing'); }}><Layers size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />Group</button>
                            <button className="action-btn danger" onClick={() => deleteFirm(f.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          });
        })()}
        {firms.length === 0 && <p className="empty-state">No prop firms listed yet.</p>}

        {/* ── Group Assignment Modal ── */}
        {groupingFirm && (
          <Modal title={`Assign Group — ${groupingFirm.name}`} onClose={() => { setGroupingFirm(null); setGroupLogoFile(null); setGroupLogoPreview(null); }}>
            <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Current Group */}
              {groupingFirm.group_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(59,130,246,0.08))', borderRadius: '12px', border: '1px solid rgba(37,99,235,0.15)' }}>
                  {(() => { const img = getGroupImage(groupingFirm.group_name); return img ? <img src={`http://localhost:5000${img}`} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} /> : <Layers size={16} style={{ color: '#2563eb' }} />; })()}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current group:</span>
                  <span style={{ fontWeight: 800, color: '#2563eb' }}>{groupingFirm.group_name}</span>
                </div>
              )}

              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '4px' }}>
                <button type="button" onClick={() => setGroupModalMode('existing')} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s', background: groupModalMode === 'existing' ? 'var(--bg-primary)' : 'transparent', color: groupModalMode === 'existing' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: groupModalMode === 'existing' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>Select Existing</button>
                <button type="button" onClick={() => { setGroupModalMode('new'); setGroupModalValue(''); }} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s', background: groupModalMode === 'new' ? 'var(--bg-primary)' : 'transparent', color: groupModalMode === 'new' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: groupModalMode === 'new' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>Create New</button>
              </div>

              {/* Existing Group Dropdown */}
              {groupModalMode === 'existing' && (
                <div>
                  <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Select a group</label>
                  <select className="input" value={groupModalValue} onChange={e => setGroupModalValue(e.target.value)} style={{ width: '100%' }}>
                    <option value="">-- No Group (Remove) --</option>
                    {availableGroups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                  </select>
                  {/* Show current group logo if selected */}
                  {groupModalValue && (() => { const g = availableGroups.find(gr => gr.name === groupModalValue); return g?.image_url ? <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}><img src={`http://localhost:5000${g.image_url}`} alt="" style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(37,99,235,0.2)' }} /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current logo for {g.name}</span></div> : null; })()}
                </div>
              )}

              {/* New Group Name Input */}
              {groupModalMode === 'new' && (
                <div>
                  <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>New group name</label>
                  <input className="input" value={groupModalValue} onChange={e => setGroupModalValue(e.target.value)} placeholder="e.g. Lucid Trading" style={{ width: '100%' }} autoFocus />
                </div>
              )}

              {/* Group Logo Upload */}
              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Group Logo (optional)</label>
                <div
                  onClick={() => groupLogoInputRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(37,99,235,0.3)', borderRadius: '14px', padding: '1rem',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    background: groupLogoPreview ? 'transparent' : 'var(--bg-secondary)'
                  }}
                >
                  {groupLogoPreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={groupLogoPreview} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(37,99,235,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{groupLogoFile?.name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '0.5rem' }}>
                      <Upload size={20} style={{ color: '#2563eb' }} />
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click to upload group logo</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.6 }}>PNG, JPG, SVG • Max 2MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={groupLogoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setGroupLogoFile(file);
                      setGroupLogoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => { setGroupingFirm(null); setGroupLogoFile(null); setGroupLogoPreview(null); }}>Cancel</Button>
                <Button
                  onClick={async () => {
                    try {
                      const newGroup = groupModalMode === 'new' ? groupModalValue.trim() : groupModalValue;
                      // 1. Assign group name
                      await axios.patch(`http://localhost:5000/api/prop-firms/${groupingFirm.id}/group`, { group_name: newGroup || null });
                      // 2. Upload group logo if selected
                      if (groupLogoFile && newGroup) {
                        const logoFormData = new FormData();
                        logoFormData.append('logo', groupLogoFile);
                        await axios.post(`http://localhost:5000/api/prop-firms/groups/${encodeURIComponent(newGroup)}/image`, logoFormData);
                      }
                      setGroupingFirm(null);
                      setGroupLogoFile(null);
                      setGroupLogoPreview(null);
                      fetchFirms();
                      // Refresh groups list
                      axios.get('http://localhost:5000/api/prop-firms/groups').then(res => setAvailableGroups(res.data)).catch(console.error);
                    } catch (err) {
                      alert('Failed to update group: ' + (err.response?.data?.message || err.message));
                    }
                  }}
                  disabled={groupModalMode === 'new' && !groupModalValue.trim()}
                >
                  {groupModalValue ? 'Save Group' : 'Remove from Group'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Prop Firm' : 'New Prop Firm'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="modal-form" style={{ position: 'relative' }}>
            <div style={{ paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              
              <div className="form-section">
                <h3 className="form-section-title"><Image size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Branding</h3>
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
                          src={form.imageFile ? URL.createObjectURL(form.imageFile) : `http://localhost:5000${form.logo_url}`} 
                          alt="Logo Preview" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); setForm({ ...form, imageFile: null, logo_url: '' }) }}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                        ><X size={12} /></button>
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
                <h3 className="form-section-title"><Building2 size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Basic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <Field label="Name (required)" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Firm name..." />
                  <div className="form-group">
                    <label className="form-label">Internal Status (Admin Only)</label>
                    <select className="input" required value={form.status_color} onChange={e => setForm({ ...form, status_color: e.target.value })}>
                      <option value="green">● Green (Top Ranked)</option>
                      <option value="blue">● Blue (Community Trusted)</option>
                      <option value="yellow">● Yellow (New / Building Trust)</option>
                      <option value="red">● Red (Avoid / Possible Scam)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Group Name (optional)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="input"
                        list="group-name-list"
                        value={form.group_name}
                        onChange={e => setForm({ ...form, group_name: e.target.value })}
                        placeholder="Select or type a new group..."
                      />
                      <datalist id="group-name-list">
                        {availableGroups.map(g => <option key={g.name} value={g.name} />)}
                      </datalist>
                    </div>
                    <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Firms with the same group name will be grouped together in the admin table and public page.</small>
                  </div>
                  <Field label="Account Category" value={form.account_category} onChange={e => setForm({ ...form, account_category: e.target.value })} placeholder="e.g. Futures, Forex" />
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Supported Platforms</label>
                    <MultiSelect options={availablePlatforms} value={form.platforms} onChange={newVal => setForm({ ...form, platforms: newVal })} placeholder="Select or type to add new platform..." />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title"><DollarSign size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Pricing Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

                  <Field label="Activation Fee (USD)" type="number" value={form.activation_fee} onChange={e => setForm({ ...form, activation_fee: e.target.value })} placeholder="e.g. 140" />
                  <Field label="Reset Fee (USD)" type="text" value={form.reset_fee} onChange={e => setForm({ ...form, reset_fee: e.target.value })} placeholder="e.g. 50" />
                  <Field label="50k All In (USD)" type="number" value={form.fifty_k_all_in} onChange={e => setForm({ ...form, fifty_k_all_in: e.target.value })} placeholder="e.g. 200" />
                  <Field label="50k Initial Cost (USD)" type="number" value={form.fifty_k_initial_cost} onChange={e => setForm({ ...form, fifty_k_initial_cost: e.target.value })} placeholder="e.g. 99" />
                  <Field label="Without Discount (USD)" type="number" value={form.without_discount_usd} onChange={e => setForm({ ...form, without_discount_usd: e.target.value })} placeholder="e.g. 199" />
                  <Field label="Discount (USD)" type="number" value={form.discount_usd} onChange={e => setForm({ ...form, discount_usd: e.target.value })} placeholder="e.g. 20" />
                  <Field label="Discount (%)" type="number" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} placeholder="e.g. 15" />
                  <Field label="Discount Code" value={form.discount_code} onChange={e => setForm({ ...form, discount_code: e.target.value })} placeholder="e.g. SAVE20" />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title"><Settings size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Trading Rules & Metrics</h3>
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
                <h3 className="form-section-title"><Link2 size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Socials, Links & Ratings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <Field label="Overall Score" type="number" step="0.1" value={form.overall_score} onChange={e => setForm({ ...form, overall_score: e.target.value })} placeholder="e.g. 9.5" />
                  <Field label="Rating (Trustpilot)" type="number" step="0.1" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} placeholder="e.g. 4.8" />
                  <Field label="Website URL" type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title"><Wrench size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Toggles & Settings</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <Toggle label="Feature in Banner" checked={form.featured} onChange={val => setForm({ ...form, featured: val })} />
                  <Toggle label="Is Affiliate Link" checked={form.is_affiliate} onChange={val => setForm({ ...form, is_affiliate: val })} />
                  <Toggle label="Buffer Support" checked={form.buffer} onChange={val => { setForm({ ...form, buffer: val, buffer_amount: val ? form.buffer_amount : '' }); }} />
                  {form.buffer && (
                    <div style={{ width: '100%', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                      <Field 
                        label="Buffer Amount" 
                        type="text" 
                        value={form.buffer_amount} 
                        onChange={e => setForm({ ...form, buffer_amount: e.target.value })} 
                        placeholder="Enter buffer amount (e.g. $1000 or 10%)" 
                        required 
                      />
                    </div>
                  )}
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
                          src={`http://localhost:5000${viewingFirm.logo_url}`} 
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
                       <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: viewingFirm.status_color === 'green' ? '#10b981' : viewingFirm.status_color === 'blue' ? '#3b82f6' : viewingFirm.status_color === 'yellow' ? '#f59e0b' : '#ef4444', marginRight: '6px' }} />
                       {viewingFirm.status_color === 'green' ? 'Top Ranked' : viewingFirm.status_color === 'blue' ? 'Trusted' : viewingFirm.status_color === 'yellow' ? 'New / Warning' : 'Avoid'}
                    </span>
                    {viewingFirm.featured && <span style={{fontSize: '13px', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'}}><Star size={14} style={{ fill: '#f59e0b', color: '#f59e0b' }} /> Featured Firm</span>}
                    {viewingFirm.is_affiliate && <span style={{fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'}}><Link2 size={14} /> Affiliate Partner</span>}
                  </div>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '0 2rem' }}>
                {/* General Info */}
                <div>
                   <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                     <Building2 size={20} /> Basic Information
                   </h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                     
                     <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Account Category</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>{viewingFirm.account_category || '-'}</span>
                     </div>
                     
                     <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Trustpilot Rating</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={18} style={{ color: '#f59e0b', fill: '#f59e0b' }} /> {viewingFirm.rating ? `${viewingFirm.rating} / 5` : '-'}</span>
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
                     <DollarSign size={20} /> Pricing Details
                   </h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                     <StatBox label="Activation Fee" value={viewingFirm.activation_fee != null && viewingFirm.activation_fee !== '' ? `$${viewingFirm.activation_fee}` : '-'} />
                     <StatBox label="Reset Fee" value={viewingFirm.reset_fee != null && viewingFirm.reset_fee !== '' ? (isNaN(viewingFirm.reset_fee) ? viewingFirm.reset_fee : `$${viewingFirm.reset_fee}`) : '-'} />
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
                     <Settings size={20} /> Trading Rules & Metrics
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
                     <Wrench size={20} /> Feature Support
                   </h4>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {['buffer', 'copy_trade', 'vpn', 'dca', 'news', 'bots', 'micro_scalping'].map(feat => {
                        const isEnabled = viewingFirm[feat];
                        const label = feat === 'buffer' && isEnabled
                          ? `BUFFER (${viewingFirm.buffer_amount || 'N/A'})`
                          : feat.replace(/_/g, ' ').toUpperCase();
                        return (
                          <span key={feat} style={{ 
                            padding: '0.5rem 1rem', 
                            background: isEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', 
                            color: isEnabled ? '#10b981' : 'var(--text-secondary)', 
                            borderRadius: '10px', 
                            fontSize: '13px', 
                            fontWeight: 600, 
                            border: isEnabled ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)'
                          }}>
                            {isEnabled ? <Check size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> : <X size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />} {label}
                          </span>
                        );
                      })}
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
    axios.get('http://localhost:5000/api/promotions')
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
        await axios.put(`http://localhost:5000/api/promotions/${editing.id}`, payload);
      } else {
        await axios.post('http://localhost:5000/api/promotions', payload);
      }
      setShowModal(false);
      fetchPromos();
    } catch (err) {
      alert(err.response?.data?.error || `Save failed (${err.message}). Make sure you're logged in as admin.`);
    }
  };

  const deletePromo = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    await axios.delete(`http://localhost:5000/api/promotions/${id}`);
    fetchPromos();
  };

  if (loading) return <div className="tab-loading">Loading promotions...</div>;

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
                    {(p.ticker_speed ?? 40) <= 20 ? <Flame size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> : (p.ticker_speed ?? 40) <= 60 ? <Zap size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> : <Turtle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />} {p.ticker_speed ?? 40}s
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

            {/* ── Ticker Speed ── */}
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
                  {form.ticker_speed <= 20 ? <><Flame size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Fast</> : form.ticker_speed <= 60 ? <><Zap size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Medium</> : <><Turtle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Slow</>} &nbsp;&middot;&nbsp; {form.ticker_speed}s
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

// ──────────────────── Reviews Tab ────────────────────
const ReviewsTab = () => {
  const [reviews, setReviews]   = useState([]);
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [courseFilter, setCourseFilter] = useState('');
  const [stats, setStats]       = useState(null);

  const fetchReviews = useCallback((cid = '') => {
    setLoading(true);
    const url = cid
      ? `http://localhost:5000/api/reviews/admin?course_id=${cid}&limit=200`
      : 'http://localhost:5000/api/reviews/admin?limit=200';
    const token = localStorage.getItem('token');
    Promise.all([
      axios.get(url, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('http://localhost:5000/api/reviews/satisfaction'),
    ])
      .then(([rRes, sRes]) => {
        setReviews(rRes.data.reviews || []);
        setStats(sRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchCourses = useCallback(() => {
    axios.get('http://localhost:5000/api/courses')
      .then(res => setCourses(res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => { fetchReviews(); fetchCourses(); }, [fetchReviews, fetchCourses]);

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setCourseFilter(val);
    fetchReviews(val);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/reviews/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchReviews(courseFilter);
  };

  const StarRow = ({ rating }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={13}
          fill={n <= rating ? '#f59e0b' : 'none'}
          color={n <= rating ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );

  return (
    <div>
      {/* Header + Satisfaction summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Lesson Reviews</h2>
        {stats && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={16} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{stats.avg_rating ?? '—'}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>avg rating</span>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ThumbsUp size={16} color="#10b981" />
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{stats.satisfaction_rate !== null ? `${stats.satisfaction_rate}%` : '—'}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>satisfaction</span>
            </div>
            <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '12px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={16} color="#60a5fa" />
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total_reviews}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>total reviews</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '1.25rem' }}>
        <select
          className="input"
          value={courseFilter}
          onChange={handleFilterChange}
          style={{ maxWidth: '320px' }}
        >
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="tab-loading">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
          <MessageSquare size={40} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No reviews yet.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Course</th>
                <th>Lesson</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{r.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.user_email}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.course_title}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.lesson_title}</td>
                  <td><StarRow rating={r.rating} /></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '220px' }}>
                    {r.comment ? (
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.comment}</span>
                    ) : (
                      <span style={{ opacity: 0.4, fontStyle: 'italic' }}>No comment</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="table-actions">
                    <button className="action-btn danger" onClick={() => handleDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ──────────────────── Main Admin Dashboard ────────────────────
const TABS = [
  { id: 'users',      label: 'Users',      Icon: Users,         color: '#8b5cf6' },
  { id: 'posts',      label: 'Blog Posts',  Icon: FileText,     color: '#3b82f6' },
  { id: 'courses',    label: 'Courses',     Icon: GraduationCap, color: '#10b981' },
  { id: 'prop-firms', label: 'Prop Firms',  Icon: Briefcase,     color: '#f59e0b' },
  { id: 'promos',     label: 'Promotions',  Icon: PartyPopper,   color: '#3b82f6' },
  { id: 'branding',   label: 'Branding',    Icon: Palette,       color: '#06b6d4' },
  { id: 'reviews',    label: 'Reviews',     Icon: Star,          color: '#f59e0b' },
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
          <Button variant="outline" onClick={() => setLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {layout === 'horizontal' ? <><Smartphone size={14} /> Vertical Layout</> : <><Monitor size={14} /> Horizontal Layout</>}
          </Button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.name}</span>
          <Button variant="outline" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
        </div>
      </div>

      <div className="admin-layout-wrapper">
        <div className="admin-navigation">
          {/* Tab Bar */}
          <div className="admin-tabs mb-6 md:mb-0">
            {TABS.map(t => {
              const TabIcon = t.Icon;
              return (
              <button
                key={t.id}
                className={`admin-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <TabIcon size={18} style={{ color: activeTab === t.id ? 'currentColor' : t.color }} /> {t.label}
              </button>
              );
            })}
              <button
                className="admin-tab"
                onClick={() => navigate('/admin/revenue')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <DollarSign size={18} style={{ color: '#10b981' }} /> Revenue
              </button>
              <button
                className="admin-tab"
                onClick={() => navigate('/admin/analytics')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <BarChart3 size={18} style={{ color: '#3b82f6' }} /> Analytics
              </button>
            </div>
          </div>

          <div className="admin-workspace flex-1">
          {/* Stats Row */}
          <div className="admin-stats-row mb-8">
            {TABS.map(t => {
              const TabIcon = t.Icon;
              return (
              <Card key={t.id} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab(t.id)}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'center' }}><TabIcon size={24} style={{ color: t.color }} /></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.label}</div>
              </Card>
              );
            })}
          </div>

          {/* Tab Content */}
          <Card className="admin-tab-content">
            {activeTab === 'users'      && <UsersTab />}
            {activeTab === 'posts'      && <PostsTab adminUser={user} />}
            {activeTab === 'courses'    && <CoursesTab />}
            {activeTab === 'prop-firms' && <PropFirmsTab />}
            {activeTab === 'promos'     && <PromotionsTab />}
            {activeTab === 'branding'   && <BrandingManager />}
            {activeTab === 'reviews'    && <ReviewsTab />}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

