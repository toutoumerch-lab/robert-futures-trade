const fs = require('fs');
const file = 'c:/Users/noure/Documents/trades/client/src/pages/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = '// ──────────────────── Posts Tab ────────────────────';
const endMarker   = '// ──────────────────── Courses Tab ────────────────────';

const startIdx = content.indexOf(startMarker);
const endIdx   = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const newPostsTab = `// ──────────────────── Posts Tab (Blog Management) ────────────────────
const BLOG_CATEGORIES = [
  'General', 'Market Analysis', 'Trading Psychology',
  'Futures', 'Risk Management', 'Strategy', 'Macroeconomics',
];

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

  useEffect(fetchPosts, [fetchPosts]);

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
    setPreview(p.image_url ? \`http://localhost:5000\${p.image_url}\` : null);
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
    const fd = new FormData();
    fd.append('title',        form.title);
    fd.append('content',      form.content);
    fd.append('excerpt',      form.excerpt);
    fd.append('category',     form.category);
    fd.append('read_time',    form.read_time);
    fd.append('is_published', form.is_published);
    if (form.image) fd.append('image', form.image);
    try {
      if (editing) {
        await axios.put(\`http://localhost:5000/api/posts/\${editing.id}\`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('http://localhost:5000/api/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowModal(false);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving post');
    }
  };

  const togglePublish = async (post) => {
    setPubLoad(post.id);
    try {
      const res = await axios.patch(\`http://localhost:5000/api/posts/\${post.id}/publish\`);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_published: res.data.is_published } : p));
    } catch (err) { console.error(err); }
    finally { setPubLoad(null); }
  };

  const deletePost = async (id) => {
    if (!window.confirm('Permanently delete this post?')) return;
    await axios.delete(\`http://localhost:5000/api/posts/\${id}\`);
    fetchPosts();
  };

  const openComments = async (post) => {
    setCommModal(post);
    setComLoad(true);
    try {
      const res = await axios.get(\`http://localhost:5000/api/posts/\${post.id}\`);
      setComments(res.data.comments || []);
    } catch (err) { console.error(err); }
    finally { setComLoad(false); }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    await axios.delete(\`http://localhost:5000/api/posts/\${commentsModal.id}/comments/\${commentId}\`);
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
              <div style={{ height: '160px', background: p.image_url ? \`url(http://localhost:5000\${p.image_url}) center/cover\` : 'linear-gradient(135deg, var(--bg-tertiary), rgba(37,99,235,0.08))', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>JPG, PNG or WebP — max 10 MB</p>
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
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {BLOG_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
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

      {commentsModal && (
        <Modal title={\`Comments — \${commentsModal.title}\`} onClose={() => { setCommModal(null); setComments([]); }} style={{ maxWidth: '640px', width: '95%' }}>
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

`;

// Splice out the old PostsTab and insert the new one
const before = content.slice(0, startIdx);
const after  = content.slice(endIdx);
const result = before + newPostsTab + after;

fs.writeFileSync(file, result, 'utf8');
console.log('PostsTab replaced successfully!');
