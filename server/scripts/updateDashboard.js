const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'client', 'src', 'pages', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace Field helper
content = content.replace(
  /const Field = \(\{ label, type = 'text', value, onChange, placeholder, as \}\) => \([\s\S]*?\n\);/,
`const Field = ({ label, type = 'text', value, onChange, placeholder, as, ...rest }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {as === 'textarea' ? (
      <textarea className="input" rows={4} value={value} onChange={onChange} placeholder={placeholder} {...rest} />
    ) : (
      <input className="input" type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest} />
    )}
  </div>
);`
);

// Replace PropFirmsTab
const newPropFirmsTab = `// ── Prop Firms Tab ─────────────────────────────────────────────────────────────
const PropFirmsTab = () => {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null);

  const initialFormState = {
    name: '', importance: 'Medium', featured: false, rating: '', website: '', affiliate_link: '',
    twitter: '', discord: '', last_checked: '', promo_frequency: '', is_affiliate: false,
    discount_code: '', overall_score: '', platforms: '', account_category: '', price: '',
    evaluation_fee: '', activation_fee: '', profit_split: '', max_withdrawal: '',
    profit_target: '', drawdown_limit: '', days_to_pass: '', days_to_payout: '', notes: ''
  };
  const [form, setForm] = useState(initialFormState);

  const fetchFirms = useCallback(() => {
    setLoading(true);
    axios.get('http://localhost:5000/api/prop-firms')
      .then(res => setFirms(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchFirms, [fetchFirms]);

  const openCreate = () => { setEditing(null); setForm(initialFormState); setShowModal(true); };
  
  const openEdit = (f) => { 
    setEditing(f); 
    setForm({
      name: f.name || '', importance: f.importance || 'Medium', featured: f.featured || false,
      rating: f.rating || '', website: f.website || '', affiliate_link: f.affiliate_link || '',
      twitter: f.twitter || '', discord: f.discord || '',
      last_checked: f.last_checked ? new Date(f.last_checked).toISOString().split('T')[0] : '',
      promo_frequency: f.promo_frequency || '', is_affiliate: f.is_affiliate || false,
      discount_code: f.discount_code || '', overall_score: f.overall_score || '',
      platforms: f.platforms || '', account_category: f.account_category || '',
      price: f.price || '', evaluation_fee: f.evaluation_fee || '',
      activation_fee: f.activation_fee || '', profit_split: f.profit_split || '',
      max_withdrawal: f.max_withdrawal || '', profit_target: f.profit_target || '',
      drawdown_limit: f.drawdown_limit || '', days_to_pass: f.days_to_pass || '',
      days_to_payout: f.days_to_payout || '', notes: f.notes || ''
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await axios.put(\`http://localhost:5000/api/prop-firms/\${editing.id}\`, form);
    } else {
      await axios.post('http://localhost:5000/api/prop-firms', form);
    }
    setShowModal(false);
    fetchFirms();
  };

  const deleteFirm = async (id) => {
    if (!window.confirm('Delete this prop firm?')) return;
    await axios.delete(\`http://localhost:5000/api/prop-firms/\${id}\`);
    fetchFirms();
  };

  if (loading) return <div className="tab-loading">Loading prop firms…</div>;

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
            <tr><th>Name</th><th>Rating</th><th>Importance</th><th>Price</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {firms.map(f => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600 }}>{f.name} {f.featured && <span style={{fontSize:'12px'}}>⭐️</span>}</td>
                <td>{f.rating ? \`\${f.rating} / 5\` : '-'}</td>
                <td>
                  <span className={\`badge \${f.importance === 'High' ? 'badge-admin' : f.importance === 'Medium' ? 'badge-user' : ''}\`}>
                    {f.importance || 'Medium'}
                  </span>
                </td>
                <td>{f.price ? \`$\${f.price}\` : '-'}</td>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem' }}>
              <Field label="Name (required)" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Firm name…" />
              
              <div className="form-group">
                <label className="form-label">Importance</label>
                <select className="input" value={form.importance} onChange={e => setForm({ ...form, importance: e.target.value })}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', minHeight: '100%', paddingTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} style={{ accentColor: 'var(--accent-purple)' }} />
                  Feature in Banner
                </label>
              </div>

              <Field label="Rating (Trustpilot)" type="number" step="0.1" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} placeholder="e.g. 4.8" />
              <Field label="Website URL" type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
              <Field label="Affiliate Link" type="url" value={form.affiliate_link} onChange={e => setForm({ ...form, affiliate_link: e.target.value })} placeholder="https://..." />
              
              <Field label="X (Twitter) URL" type="url" value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} placeholder="https://x.com/..." />
              <Field label="Discord URL" type="url" value={form.discord} onChange={e => setForm({ ...form, discord: e.target.value })} placeholder="https://discord.gg/..." />
              <Field label="Last Checked" type="date" value={form.last_checked} onChange={e => setForm({ ...form, last_checked: e.target.value })} />

              <Field label="Promo Frequency" value={form.promo_frequency} onChange={e => setForm({ ...form, promo_frequency: e.target.value })} placeholder="e.g. Monthly, Rare..." />
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', minHeight: '100%', paddingTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_affiliate} onChange={e => setForm({ ...form, is_affiliate: e.target.checked })} style={{ accentColor: 'var(--accent-purple)' }} />
                  Is Affiliate Link?
                </label>
              </div>

              <Field label="Discount Code" value={form.discount_code} onChange={e => setForm({ ...form, discount_code: e.target.value })} placeholder="e.g. SAVE20" />
              <Field label="Overall Score" type="number" step="0.1" value={form.overall_score} onChange={e => setForm({ ...form, overall_score: e.target.value })} placeholder="e.g. 9.5" />
              <Field label="Platforms" value={form.platforms} onChange={e => setForm({ ...form, platforms: e.target.value })} placeholder="e.g. NinjaTrader, TradeStation" />
              <Field label="Account Category" value={form.account_category} onChange={e => setForm({ ...form, account_category: e.target.value })} placeholder="e.g. Futures, Forex" />

              <Field label="Price 50k (USD)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 149" />
              <Field label="Evaluation Fee (USD)" type="number" value={form.evaluation_fee} onChange={e => setForm({ ...form, evaluation_fee: e.target.value })} placeholder="e.g. 49" />
              <Field label="Activation Fee (USD)" type="number" value={form.activation_fee} onChange={e => setForm({ ...form, activation_fee: e.target.value })} placeholder="e.g. 140" />

              <Field label="Profit Split" value={form.profit_split} onChange={e => setForm({ ...form, profit_split: e.target.value })} placeholder="e.g. 90/10" />
              <Field label="Max Withdrawal" type="number" value={form.max_withdrawal} onChange={e => setForm({ ...form, max_withdrawal: e.target.value })} placeholder="e.g. 2000" />
              <Field label="Profit Target" type="number" value={form.profit_target} onChange={e => setForm({ ...form, profit_target: e.target.value })} placeholder="e.g. 3000" />
              
              <Field label="Drawdown Limit" type="number" value={form.drawdown_limit} onChange={e => setForm({ ...form, drawdown_limit: e.target.value })} placeholder="e.g. 2500" />
              <Field label="Days to Pass" type="number" value={form.days_to_pass} onChange={e => setForm({ ...form, days_to_pass: e.target.value })} placeholder="e.g. 5" />
              <Field label="Days to Payout" type="number" value={form.days_to_payout} onChange={e => setForm({ ...form, days_to_payout: e.target.value })} placeholder="e.g. 14" />
              
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Notes" as="textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional information..." />
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
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
    </div>
  );
};`;

content = content.replace(
  /\/\/ ── Prop Firms Tab ─────────────────────────────────────────────────────────────[\s\S]*?(?=\/\/ ── Promotions Tab ─────────────────────────────────────────────────────────────)/,
  newPropFirmsTab + "\n\n"
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated AdminDashboard.jsx');
