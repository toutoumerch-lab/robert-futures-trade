import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import BrandingManager from '../components/admin/BrandingManager';

// ── Generic Modal ──────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

// ── FormField helper ───────────────────────────────────────────────────────────
const Field = ({ label, type = 'text', value, onChange, placeholder, as }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {as === 'textarea' ? (
      <textarea className="input" rows={4} value={value} onChange={onChange} placeholder={placeholder} />
    ) : (
      <input className="input" type={type} value={value} onChange={onChange} placeholder={placeholder} />
    )}
  </div>
);

// ── Users Tab ──────────────────────────────────────────────────────────────────
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

  if (loading) return <div className="tab-loading">Loading users…</div>;

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

// ── Posts Tab ──────────────────────────────────────────────────────────────────
const PostsTab = ({ adminUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });

  const fetchPosts = useCallback(() => {
    setLoading(true);
    axios.get('http://localhost:5000/api/posts')
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
      await axios.put(`http://localhost:5000/api/posts/${editing.id}`, form);
    } else {
      await axios.post('http://localhost:5000/api/posts', form);
    }
    setShowModal(false);
    fetchPosts();
  };

  const deletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    await axios.delete(`http://localhost:5000/api/posts/${id}`);
    fetchPosts();
  };

  if (loading) return <div className="tab-loading">Loading posts…</div>;

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
            <Field label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Post title…" />
            <Field label="Content" as="textarea" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your post…" />
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

// ── Courses Tab ────────────────────────────────────────────────────────────────
const CoursesTab = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', image_url: '' });

  const fetchCourses = useCallback(() => {
    setLoading(true);
    axios.get('http://localhost:5000/api/courses')
      .then(res => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchCourses, [fetchCourses]);

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', price: '', image_url: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ title: c.title, description: c.description, price: c.price, image_url: c.image_url || '' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`http://localhost:5000/api/courses/${editing.id}`, form);
    } else {
      await axios.post('http://localhost:5000/api/courses', form);
    }
    setShowModal(false);
    fetchCourses();
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    await axios.delete(`http://localhost:5000/api/courses/${id}`);
    fetchCourses();
  };

  if (loading) return <div className="tab-loading">Loading courses…</div>;

  return (
    <div>
      <div className="tab-toolbar">
        <Button onClick={openCreate}>+ Add Course</Button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Price</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td style={{ color: 'var(--accent-tertiary)', fontWeight: 600 }}>${c.price}</td>
                <td className="table-actions">
                  <button className="action-btn" onClick={() => openEdit(c)}>Edit</button>
                  <button className="action-btn danger" onClick={() => deleteCourse(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && <p className="empty-state">No courses yet.</p>}
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Course' : 'New Course'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="modal-form">
            <Field label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Course title…" />
            <Field label="Description" as="textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Course description…" />
            <Field label="Price (USD)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
            <Field label="Image URL (optional)" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />
            <div className="modal-footer">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save Changes' : 'Create Course'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ── Prop Firms Tab ─────────────────────────────────────────────────────────────
const PropFirmsTab = () => {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', max_allocation: '', profit_split: '', cost: '' });

  const fetchFirms = useCallback(() => {
    setLoading(true);
    axios.get('http://localhost:5000/api/prop-firms')
      .then(res => setFirms(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchFirms, [fetchFirms]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', max_allocation: '', profit_split: '', cost: '' }); setShowModal(true); };
  const openEdit = (f) => { setEditing(f); setForm({ name: f.name, description: f.description, max_allocation: f.max_allocation, profit_split: f.profit_split, cost: f.cost }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`http://localhost:5000/api/prop-firms/${editing.id}`, form);
    } else {
      await axios.post('http://localhost:5000/api/prop-firms', form);
    }
    setShowModal(false);
    fetchFirms();
  };

  const deleteFirm = async (id) => {
    if (!window.confirm('Delete this prop firm?')) return;
    await axios.delete(`http://localhost:5000/api/prop-firms/${id}`);
    fetchFirms();
  };

  if (loading) return <div className="tab-loading">Loading prop firms…</div>;

  return (
    <div>
      <div className="tab-toolbar">
        <Button onClick={openCreate}>+ Add Prop Firm</Button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Max Allocation</th><th>Profit Split</th><th>Cost</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {firms.map(f => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600 }}>{f.name}</td>
                <td>${f.max_allocation?.toLocaleString()}</td>
                <td style={{ color: 'var(--success)' }}>{f.profit_split}</td>
                <td>${f.cost}</td>
                <td className="table-actions">
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
          <form onSubmit={handleSave} className="modal-form">
            <Field label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Firm name…" />
            <Field label="Description" as="textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description…" />
            <Field label="Max Allocation (USD)" type="number" value={form.max_allocation} onChange={e => setForm({ ...form, max_allocation: e.target.value })} placeholder="200000" />
            <Field label="Profit Split (e.g. 80%)" value={form.profit_split} onChange={e => setForm({ ...form, profit_split: e.target.value })} placeholder="80%" />
            <Field label="Evaluation Cost (USD)" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="149" />
            <div className="modal-footer">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save Changes' : 'Add Firm'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ── Promotions Tab ─────────────────────────────────────────────────────────────
const PromotionsTab = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', code: '', status: 'inactive', expires_at: '' });

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
    setForm({ title: '', code: '', status: 'inactive', expires_at: '' }); 
    setShowModal(true); 
  };
  
  const openEdit = (p) => { 
    setEditing(p); 
    setForm({ 
      title: p.title, 
      code: p.code, 
      status: p.status, 
      expires_at: p.expires_at ? new Date(p.expires_at).toISOString().slice(0, 16) : '' 
    }); 
    setShowModal(true); 
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`http://localhost:5000/api/promotions/${editing.id}`, form);
      } else {
        await axios.post('http://localhost:5000/api/promotions', form);
      }
      setShowModal(false);
      fetchPromos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving promotion');
    }
  };

  const deletePromo = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    await axios.delete(`http://localhost:5000/api/promotions/${id}`);
    fetchPromos();
  };

  if (loading) return <div className="tab-loading">Loading promotions…</div>;

  return (
    <div>
      <div className="tab-toolbar">
        <Button onClick={openCreate}>+ New Promotion</Button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Code</th><th>Status</th><th>Expires At</th><th>Actions</th></tr>
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

// ── Main Admin Dashboard ───────────────────────────────────────────────────────
const TABS = [
  { id: 'users',      label: '👥 Users' },
  { id: 'posts',      label: '📝 Blog Posts' },
  { id: 'courses',    label: '🎓 Courses' },
  { id: 'prop-firms', label: '🏦 Prop Firms' },
  { id: 'promos',     label: '🎁 Promotions' },
  { id: 'branding',   label: '🎨 Branding' },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

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
    <div className="container py-16">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage your platform content</p>
        </div>
        <div className="flex gap-4 items-center">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.name}</span>
          <Button variant="outline" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="admin-stats-row mb-8">
        {TABS.map(t => (
          <Card key={t.id} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab(t.id)}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t.label.split(' ')[0]}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.label.split(' ').slice(1).join(' ')}</div>
          </Card>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="admin-tabs">
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
  );
};

export default AdminDashboard;
