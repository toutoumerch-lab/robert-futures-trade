import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Plus, Trash2, Copy, ChevronDown, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

// ─── Constants ───────────────────────────────────────────────────────────────
const PLATFORMS = [
  'NinjaTrader', 'Tradovate', 'TradingView', 'Rithmic', 'Quantower',
  'TradeStation', 'Sierra Chart', 'ATAS', 'Bookmap', 'MetaTrader 4',
  'MetaTrader 5', 'cTrader', 'Webull', 'Interactive Brokers','MotiveWave', 'Jigsaw','R|Trader Pro','Multicharts' 
];

const SIZE_PRESETS = ['10K', '25K', '50K', '100K', '150K', '200K', '250K', '300K'];

const uid = () => Math.random().toString(36).slice(2, 9);

const makeSize = (label = '') => ({
  _key: uid(), _dbId: null, label, expanded: true,
  price_no_discount: '', discount_percent: '', activation_fee: '', reset_fee: '',
  eval_min_days: '', eval_dll: '', eval_profit_target: '', eval_max_loss: '',
  eval_drawdown_type: 'EOD', eval_max_mini: '', eval_max_micro: '',
  eval_max_allocation: '', eval_max_inactive_days: '', eval_consistency_percent: '',
  funded_min_days: '', funded_winning_day: '', funded_max_withdrawal: '',
  funded_max_loss: '', funded_dll: '', funded_consistency_percent: '',
  funded_max_mini: '', funded_max_micro: '', funded_max_allocation: '',
  funded_max_inactive_days: '', funded_hold_news: 'Yes', funded_profit_split: '',
});

// Convert one DB row → a size object (preserving _dbId for PUT/DELETE)
const rowToSize = (row) => {
  let notes = {};
  try { notes = JSON.parse(row.notes || '{}'); } catch (_) {}
  const dl = row.drawdown_limit || '';
  return {
    ...makeSize(row.plan_size || ''),
    _dbId:                    row.id,
    price_no_discount:        String(row.without_discount_usd || ''),
    discount_percent:         String(row.discount_percent || ''),
    activation_fee:           String(row.activation_fee || ''),
    reset_fee:                String(row.reset_fee || ''),
    eval_profit_target:       String(row.profit_target || ''),
    eval_dll:                 String(row.dll || ''),
    eval_max_loss:            dl.includes('$') ? dl.replace(/^.*\$/, '').trim() : '',
    eval_drawdown_type:       dl.startsWith('Trailing') ? 'Trailing' : dl.startsWith('Static') ? 'Static' : 'EOD',
    eval_min_days:            String(row.days_to_pass || ''),
    funded_min_days:          String(row.days_to_payout || ''),
    funded_max_withdrawal:    String(row.max_withdrawal || ''),
    funded_profit_split:      String((row.profit_split || '').replace('%', '')),
    eval_max_mini:            notes.eval_max_mini || '',
    eval_max_micro:           notes.eval_max_micro || '',
    eval_consistency_percent: notes.eval_consistency || '',
    eval_max_inactive_days:   notes.eval_max_inactive || '',
    funded_dll:               notes.funded_dll || '',
    funded_max_loss:          notes.funded_max_loss || '',
    funded_consistency_percent: notes.funded_consistency || '',
    funded_winning_day:       notes.funded_winning_day || '',
    funded_hold_news:         notes.funded_hold_news || 'Yes',
    funded_max_inactive_days: notes.funded_max_inactive || '',
    funded_max_allocation:    notes.funded_max_allocation || '',
    eval_max_allocation:      String(row.max_accounts || ''),
  };
};

const makePlan = () => ({
  _key: uid(), name: '', variant: 'no_variant',
  type: 'evaluation_funded', expanded: true,
  sizes: [makeSize('50K')],
});

const calcPricing = (s) => {
  const base = parseFloat(s.price_no_discount) || 0;
  const pct  = parseFloat(s.discount_percent) || 0;
  const savings      = base > 0 ? +(base * pct / 100).toFixed(2) : 0;
  const afterDiscount = base > 0 ? +(base - savings).toFixed(2) : 0;
  return { savings, afterDiscount };
};

// ─── Field Components ─────────────────────────────────────────────────────────
const Inp = ({ label, value, onChange, prefix, suffix, type = 'text', placeholder, readOnly, onCopyAll }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '18px' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {onCopyAll && (
        <button type="button" onClick={onCopyAll}
          style={{ fontSize: '0.62rem', color: '#3b82f6', background: 'rgba(59,130,246,0.12)', border: 'none', borderRadius: '4px', padding: '1px 6px', cursor: 'pointer', fontWeight: 800, lineHeight: 1.6 }}>
          all
        </button>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', background: readOnly ? 'rgba(255,255,255,0.02)' : 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
      {prefix && <span style={{ padding: '0 8px', color: 'var(--text-secondary)', fontSize: '0.82rem', borderRight: '1px solid var(--border-color)', flexShrink: 0, alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>{prefix}</span>}
      <input
        type={type} value={value}
        onChange={onChange} placeholder={placeholder}
        readOnly={readOnly}
        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '7px 9px', fontSize: '0.85rem', color: readOnly ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: readOnly ? 'not-allowed' : 'text', minWidth: 0 }}
      />
      {suffix && <span style={{ padding: '0 8px', color: 'var(--text-secondary)', fontSize: '0.78rem', borderLeft: '1px solid var(--border-color)', flexShrink: 0, alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>{suffix}</span>}
    </div>
  </div>
);

const Sel = ({ label, value, onChange, options, onCopyAll }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '18px' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {onCopyAll && (
        <button type="button" onClick={onCopyAll}
          style={{ fontSize: '0.62rem', color: '#3b82f6', background: 'rgba(59,130,246,0.12)', border: 'none', borderRadius: '4px', padding: '1px 6px', cursor: 'pointer', fontWeight: 800, lineHeight: 1.6 }}>
          all
        </button>
      )}
    </div>
    <select value={value} onChange={onChange}
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '7px 9px', fontSize: '0.85rem', color: 'var(--text-primary)', outline: 'none', width: '100%' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
    {children}
  </div>
);

// ─── Size Fields (rendered inside the tab panel) ─────────────────────────────
const SizeFields = ({ size, onUpdate, onCopyAll, showEval }) => {
  const { savings, afterDiscount } = calcPricing(size);
  const u = (patch) => onUpdate(patch);
  const cp = (field) => onCopyAll(field, size[field]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* PRICING */}
      <div>
        <SectionLabel>Pricing</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
          <Inp label="Price (no discount)" value={size.price_no_discount} onChange={e => u({ price_no_discount: e.target.value })} prefix="$" />
          <Inp label="Discount %" value={size.discount_percent} onChange={e => u({ discount_percent: e.target.value })} suffix="%" onCopyAll={() => cp('discount_percent')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savings</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '7px 9px', minHeight: '35px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10b981' }}>${savings.toFixed(2)}</span>
              {size.discount_percent > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>at {size.discount_percent}%</span>}
            </div>
          </div>
          <Inp label="Price after discount" value={afterDiscount > 0 ? afterDiscount.toFixed(2) : ''} readOnly prefix="$" placeholder="—" />
          <Inp label="Activation fee" value={size.activation_fee} onChange={e => u({ activation_fee: e.target.value })} prefix="$" onCopyAll={() => cp('activation_fee')} />
          <Inp label="Reset fee" value={size.reset_fee} onChange={e => u({ reset_fee: e.target.value })} prefix="$" onCopyAll={() => cp('reset_fee')} />
        </div>
      </div>

      {/* EVALUATION RULES */}
      {showEval && (
        <div>
          <SectionLabel>Evaluation Rules (Challenge)</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
            <Inp label="Min days to pass" value={size.eval_min_days} onChange={e => u({ eval_min_days: e.target.value })} onCopyAll={() => cp('eval_min_days')} />
            <Inp label="Daily Loss Limit (DLL)" value={size.eval_dll} onChange={e => u({ eval_dll: e.target.value })} prefix="$" onCopyAll={() => cp('eval_dll')} />
            <Inp label="Profit target" value={size.eval_profit_target} onChange={e => u({ eval_profit_target: e.target.value })} prefix="$" />
            <Inp label="Max loss limit" value={size.eval_max_loss} onChange={e => u({ eval_max_loss: e.target.value })} prefix="$" onCopyAll={() => cp('eval_max_loss')} />
            <Sel label="Drawdown type" value={size.eval_drawdown_type} onChange={e => u({ eval_drawdown_type: e.target.value })} onCopyAll={() => cp('eval_drawdown_type')}
              options={[{ value: 'EOD', label: 'EOD' }, { value: 'Trailing', label: 'Trailing' }, { value: 'Static', label: 'Static' }]} />
            <Inp label="Max Mini contracts" value={size.eval_max_mini} onChange={e => u({ eval_max_mini: e.target.value })} onCopyAll={() => cp('eval_max_mini')} />
            <Inp label="Max Micro contracts" value={size.eval_max_micro} onChange={e => u({ eval_max_micro: e.target.value })} onCopyAll={() => cp('eval_max_micro')} />
            <Inp label="Max Allocation" value={size.eval_max_allocation} onChange={e => u({ eval_max_allocation: e.target.value })} suffix="acct" onCopyAll={() => cp('eval_max_allocation')} />
            <Inp label="Max inactive days" value={size.eval_max_inactive_days} onChange={e => u({ eval_max_inactive_days: e.target.value })} suffix="days" />
            <Inp label="Consistency rule %" value={size.eval_consistency_percent} onChange={e => u({ eval_consistency_percent: e.target.value })} suffix="%" />
          </div>
        </div>
      )}

      {/* FUNDED RULES */}
      <div>
        <SectionLabel>Funded</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
          <Inp label="Min trading days for payout" value={size.funded_min_days} onChange={e => u({ funded_min_days: e.target.value })} onCopyAll={() => cp('funded_min_days')} />
          <Inp label="Winning day (min profit)" value={size.funded_winning_day} onChange={e => u({ funded_winning_day: e.target.value })} prefix="$" onCopyAll={() => cp('funded_winning_day')} />
          <Inp label="Max Withdrawl" value={size.funded_max_withdrawal} onChange={e => u({ funded_max_withdrawal: e.target.value })} prefix="$" onCopyAll={() => cp('funded_max_withdrawal')} />
          <Inp label="Max loss limit" value={size.funded_max_loss} onChange={e => u({ funded_max_loss: e.target.value })} prefix="$" onCopyAll={() => cp('funded_max_loss')} />
          <Inp label="Daily Loss Limit" value={size.funded_dll} onChange={e => u({ funded_dll: e.target.value })} prefix="$" />
          <Inp label="Consistency rule %" value={size.funded_consistency_percent} onChange={e => u({ funded_consistency_percent: e.target.value })} suffix="%" />
          <Inp label="Max Mini contracts" value={size.funded_max_mini} onChange={e => u({ funded_max_mini: e.target.value })} onCopyAll={() => cp('funded_max_mini')} />
          <Inp label="Max Micro contracts" value={size.funded_max_micro} onChange={e => u({ funded_max_micro: e.target.value })} onCopyAll={() => cp('funded_max_micro')} />
          <Inp label="Max Allocation" value={size.funded_max_allocation} onChange={e => u({ funded_max_allocation: e.target.value })} suffix="acct" onCopyAll={() => cp('funded_max_allocation')} />
          <Inp label="Max inactive days" value={size.funded_max_inactive_days} onChange={e => u({ funded_max_inactive_days: e.target.value })} suffix="days" onCopyAll={() => cp('funded_max_inactive_days')} />
          <Sel label="Hold through news" value={size.funded_hold_news} onChange={e => u({ funded_hold_news: e.target.value })} onCopyAll={() => cp('funded_hold_news')}
            options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]} />
          <Inp label="Profit split (trader %)" value={size.funded_profit_split} onChange={e => u({ funded_profit_split: e.target.value })} suffix="%" onCopyAll={() => cp('funded_profit_split')} />
        </div>
      </div>

    </div>
  );
};

// ─── Plan Card (tabs for each size, all in ONE card) ──────────────────────────
const PlanCard = ({ plan, onUpdate, onRemove, onCopy }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  const updateSize = (sIdx, patch) =>
    onUpdate({ sizes: plan.sizes.map((s, i) => i === sIdx ? { ...s, ...patch } : s) });

  const removeSize = (sIdx) => {
    if (plan.sizes.length === 1) return;
    const next = plan.sizes.filter((_, i) => i !== sIdx);
    setActiveTab(Math.min(activeTab, next.length - 1));
    onUpdate({ sizes: next });
  };

  const addSize = (label = '') => {
    const next = [...plan.sizes, makeSize(label)];
    onUpdate({ sizes: next });
    setActiveTab(next.length - 1); // jump to new tab
    setShowSizeMenu(false);
  };

  const copyAll = (sIdx, field, value) =>
    onUpdate({ sizes: plan.sizes.map((s, i) => i === sIdx ? s : { ...s, [field]: value }) });

  // Only show eval rules for plans that have an evaluation/challenge phase
  const showEval = ['evaluation_funded', 'one_step', 'two_step'].includes(plan.type);
  const safeTab = Math.min(activeTab, plan.sizes.length - 1);
  const activeSize = plan.sizes[safeTab];

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '0.85rem', overflow: 'visible' }}>

      {/* Plan header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: '12px 12px 0 0', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)' }}>
        <input className="input" value={plan.name} onChange={e => onUpdate({ name: e.target.value })}
          placeholder="Plan name..." style={{ width: '150px', fontWeight: 700, fontSize: '0.88rem', padding: '5px 9px' }} />

        <select value={plan.variant} onChange={e => onUpdate({ variant: e.target.value })}
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '5px 8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}>
          <option value="no_variant">— No variant</option>
          <option value="with_activation">With Activation Fee</option>
          <option value="without_activation">Without Activation Fee</option>
        </select>

        <select value={plan.type} onChange={e => onUpdate({ type: e.target.value })}
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '5px 8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}>
          <option value="evaluation_funded">Eval + Funded</option>
          <option value="straight_funded">Straight Funded</option>
          <option value="one_step">1-Step Evaluation</option>
          <option value="two_step">2-Step Evaluation</option>
          <option value="instant_funded">Instant Funded / Exhibition</option>
        </select>

        <div style={{ flex: 1 }} />
        <button type="button" onClick={onCopy}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          <Copy size={13} />
        </button>
        <button type="button" onClick={onRemove}
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
          <Trash2 size={13} />
        </button>
      </div>

      {/* Size tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem 0.85rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
        {plan.sizes.map((size, sIdx) => (
          <div key={size._key} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button
              type="button"
              onClick={() => setActiveTab(sIdx)}
              style={{
                padding: '4px 12px', borderRadius: plan.sizes.length > 1 ? '6px 0 0 6px' : '6px',
                border: `1px solid ${safeTab === sIdx ? 'rgba(59,130,246,0.5)' : 'var(--border-color)'}`,
                background: safeTab === sIdx ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
                color: safeTab === sIdx ? '#3b82f6' : 'var(--text-secondary)',
                fontWeight: safeTab === sIdx ? 800 : 600, fontSize: '0.8rem', cursor: 'pointer',
                borderRight: plan.sizes.length > 1 ? 'none' : undefined,
              }}>
              ${size.label || `Size ${sIdx + 1}`}
            </button>
            {plan.sizes.length > 1 && (
              <button type="button" onClick={() => removeSize(sIdx)}
                style={{
                  padding: '4px 6px', borderRadius: '0 6px 6px 0',
                  border: `1px solid ${safeTab === sIdx ? 'rgba(59,130,246,0.5)' : 'var(--border-color)'}`,
                  background: safeTab === sIdx ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
                  color: safeTab === sIdx ? '#ef4444' : 'var(--text-secondary)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}>
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        {/* + size button with preset dropdown */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(59,130,246,0.3)' }}>
            <button type="button" onClick={() => addSize()}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
              <Plus size={12} /> size
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); setShowSizeMenu(m => !m); }}
              style={{ padding: '4px 7px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', borderLeft: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronDown size={12} />
            </button>
          </div>
          {showSizeMenu && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 9999, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.4rem', minWidth: '110px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
              {SIZE_PRESETS.map(s => (
                <button key={s} type="button" onClick={() => addSize(s)}
                  style={{ textAlign: 'center', padding: '5px 8px', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.82rem', cursor: 'pointer', borderRadius: '6px', fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  ${s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active size fields — rendered inside the SAME card */}
      {activeSize && (
        <div style={{ padding: '1rem 0.85rem' }}>
          {/* Size label input */}
          <div style={{ marginBottom: '0.85rem' }}>
            <Inp
              label="Account Size Label (e.g. 50K, 100K)"
              value={activeSize.label}
              onChange={e => updateSize(safeTab, { label: e.target.value })}
              placeholder="e.g. 50K"
            />
          </div>
          <SizeFields
            size={activeSize}
            onUpdate={patch => updateSize(safeTab, patch)}
            onCopyAll={(field, value) => copyAll(safeTab, field, value)}
            showEval={showEval}
          />
        </div>
      )}

    </div>
  );
};





// ─── Main Modal ───────────────────────────────────────────────────────────────
const PropFirmFormModal = ({ onClose, onSaved, availableGroups = [], editing = null }) => {
  const [firmName,     setFirmName]     = useState(editing?.name || '');
  const [trustpilot,   setTrustpilot]   = useState(editing?.rating || '');
  const [platforms,    setPlatforms]    = useState(
    Array.isArray(editing?.platforms) ? editing.platforms : []
  );
  const [statusColor,  setStatusColor]  = useState(editing?.status_color || 'green');
  const [discountCode, setDiscountCode] = useState(editing?.discount_code || '');
  const [website,      setWebsite]      = useState(editing?.website || '');
  const [groupName,    setGroupName]    = useState(editing?.group_name || '');
  const [logo,         setLogo]         = useState(null);
  const [logoUrl,      setLogoUrl]      = useState(editing?.logo_url || '');
  const [saving,       setSaving]       = useState(false);
  const [loadingRows,  setLoadingRows]  = useState(!!editing);
  // Track IDs of rows that existed at open time (to detect deletes)
  const [originalDbIds, setOriginalDbIds] = useState([]);

  // One plan grouping all sizes – each size carries _dbId to know PUT vs POST
  const [plans, setPlans] = useState([makePlan()]);

  // On edit: fetch ALL sibling rows by firm name, hydrate every size
  useEffect(() => {
    if (!editing) return;
    setLoadingRows(true);
    axios.get(`${API}/api/prop-firms/admin-by-name/${encodeURIComponent(editing.name)}`)
      .then(res => {
        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length === 0) { setLoadingRows(false); return; }
        const first = rows[0];
        // Firm-level fields from first row
        setFirmName(first.name || '');
        setTrustpilot(String(first.rating || ''));
        setPlatforms(Array.isArray(first.platforms) ? first.platforms : []);
        setStatusColor(first.status_color || 'green');
        setDiscountCode(first.discount_code || '');
        setWebsite(first.website || '');
        setGroupName(first.group_name || '');
        setLogoUrl(first.logo_url || '');
        // Build sizes from every DB row
        setOriginalDbIds(rows.map(r => r.id));

        // ── Group rows into distinct plans by (plan_name + plan_type + plan_variant) ──
        const planMap = new Map();   // key → { name, type, variant, sizes[] }
        rows.forEach(r => {
          let notes = {};
          try { notes = JSON.parse(r.notes || '{}'); } catch (_) {}
          const planName    = r.plan_name          || '';
          const planType    = notes.plan_type       || 'evaluation_funded';
          const planVariant = notes.plan_variant    || 'no_variant';
          const groupKey    = `${planName}||${planType}||${planVariant}`;

          if (!planMap.has(groupKey)) {
            planMap.set(groupKey, {
              ...makePlan(),
              name:    planName,
              type:    planType,
              variant: planVariant,
              sizes:   [],
            });
          }
          planMap.get(groupKey).sizes.push(rowToSize(r));
        });

        const hydratedPlans = Array.from(planMap.values());
        setPlans(hydratedPlans.length > 0 ? hydratedPlans : [makePlan()]);
      })
      .catch(() => {
        // Fallback: use the single editing row
        setPlans([{ ...makePlan(), sizes: [rowToSize(editing)] }]);
        setOriginalDbIds([editing.id]);
      })
      .finally(() => setLoadingRows(false));
  }, []);

  const togglePlatform = (p) =>
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const updatePlan = (pIdx, patch) =>
    setPlans(prev => prev.map((pl, i) => i === pIdx ? { ...pl, ...patch } : pl));

  const copyPlan = (pIdx) => {
    const copy = JSON.parse(JSON.stringify(plans[pIdx]));
    copy._key = uid();
    copy.name = copy.name + ' (copy)';
    copy.sizes = copy.sizes.map(s => ({ ...s, _key: uid() }));
    setPlans(prev => [...prev, copy]);
  };

  const handleSave = async () => {
    if (!firmName.trim()) { alert('Firm name is required.'); return; }
    setSaving(true);
    try {
      // Build FormData for one plan + one size
      const buildFd = (plan, size) => {
        const { savings, afterDiscount } = calcPricing(size);
        const fd = new FormData();
        fd.append('name',                 firmName.trim());
        fd.append('rating',               trustpilot);
        fd.append('platforms',            JSON.stringify(platforms));
        fd.append('status_color',         statusColor);
        fd.append('discount_code',        discountCode);
        fd.append('website',              website);
        fd.append('group_name',           groupName);
        // Plan + size identifiers stored in dedicated DB columns
        fd.append('plan_name',            plan.name || '');
        fd.append('plan_size',            size.label || '');
        // Pricing
        fd.append('without_discount_usd', size.price_no_discount);
        fd.append('discount_percent',     size.discount_percent);
        fd.append('discount_usd',         savings);
        fd.append('price',                afterDiscount > 0 ? afterDiscount : size.price_no_discount);
        fd.append('activation_fee',       size.activation_fee);
        fd.append('reset_fee',            size.reset_fee);
        fd.append('fifty_k_all_in',       afterDiscount > 0 ? +(afterDiscount + (parseFloat(size.activation_fee) || 0)).toFixed(2) : '');
        fd.append('fifty_k_initial_cost', afterDiscount > 0 ? afterDiscount : size.price_no_discount);
        // Trading rules
        fd.append('profit_target',        size.eval_profit_target);
        fd.append('dll',                  size.eval_dll);
        // drawdown_limit: only append amount when max_loss is actually set
        fd.append('drawdown_limit',       size.eval_max_loss
          ? `${size.eval_drawdown_type} $${size.eval_max_loss}`
          : (size.eval_drawdown_type || ''));
        fd.append('days_to_pass',         size.eval_min_days);
        fd.append('days_to_payout',       size.funded_min_days);
        fd.append('max_withdrawal',       size.funded_max_withdrawal);
        fd.append('profit_split',         size.funded_profit_split ? `${size.funded_profit_split}%` : '');
        fd.append('eval',                 [size.eval_max_mini && `${size.eval_max_mini} Mini`, size.eval_max_micro && `${size.eval_max_micro} Micro`].filter(Boolean).join(' / '));
        fd.append('pa',                   [size.funded_max_mini && `${size.funded_max_mini} Mini`, size.funded_max_micro && `${size.funded_max_micro} Micro`].filter(Boolean).join(' / '));
        fd.append('max_accounts',         size.eval_max_allocation || size.funded_max_allocation || '');
        fd.append('notes',                JSON.stringify({
          plan_type:             plan.type,
          plan_variant:          plan.variant,
          eval_consistency:      size.eval_consistency_percent,
          eval_max_inactive:     size.eval_max_inactive_days,
          funded_dll:            size.funded_dll,
          funded_max_loss:       size.funded_max_loss,
          funded_consistency:    size.funded_consistency_percent,
          funded_winning_day:    size.funded_winning_day,
          funded_hold_news:      size.funded_hold_news,
          funded_max_inactive:   size.funded_max_inactive_days,
          funded_max_allocation: size.funded_max_allocation,
        }));
        if (logo) fd.append('logo', logo);
        return fd;
      };

      if (editing) {
        // EDIT: PUT existing rows, POST new ones, DELETE removed ones
        const currentIds = [];
        for (const plan of plans) {
          for (const size of plan.sizes) {
            if (size._dbId) {
              // Existing row — update it
              await axios.put(`${API}/api/prop-firms/${size._dbId}`, buildFd(plan, size));
              currentIds.push(size._dbId);
            } else {
              // New size added during edit — create a new row
              await axios.post(`${API}/api/prop-firms`, buildFd(plan, size));
            }
          }
        }
        // Delete rows that were removed
        for (const oldId of originalDbIds) {
          if (!currentIds.includes(oldId)) {
            await axios.delete(`${API}/api/prop-firms/${oldId}`);
          }
        }
      } else {
        // CREATE: one DB row per plan × size
        for (const plan of plans) {
          for (const size of plan.sizes) {
            await axios.post(`${API}/api/prop-firms`, buildFd(plan, size));
          }
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loadingRows) return createPortal(
    <div className="modal-overlay" style={{ zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: '2rem 3rem', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
        Loading firm data…
      </div>
    </div>,
    document.body
  );

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 999999 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-primary)', borderRadius: '16px',
        border: '1px solid var(--border-color)',
        width: '96vw', maxWidth: '860px', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>
            {editing ? `Edit firm "${editing.name}"` : 'Add New Prop Firm'}
          </h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* General Info */}
          <div>
            <SectionLabel>General Information</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Firm Name *</label>
                <input className="input" required value={firmName} onChange={e => setFirmName(e.target.value)} placeholder="e.g. Alpha Futures" style={{ padding: '7px 9px', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Trustpilot Score</label>
                <input className="input" type="number" min="0" max="5" step="0.1" value={trustpilot} onChange={e => setTrustpilot(e.target.value)} placeholder="e.g. 4.5" style={{ padding: '7px 9px', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Status</label>
                <select className="input" value={statusColor} onChange={e => setStatusColor(e.target.value)} style={{ padding: '7px 9px', fontSize: '0.85rem' }}>
                  <option value="green">● Green (Top Ranked)</option>
                  <option value="blue">● Blue (Community Trusted)</option>
                  <option value="yellow">● Yellow (New / Building Trust)</option>
                  <option value="red">● Red (Avoid / Possible Scam)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Group</label>
                <input className="input" list="pfm-groups" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name..." style={{ padding: '7px 9px', fontSize: '0.85rem' }} />
                <datalist id="pfm-groups">{availableGroups.map(g => <option key={g.name} value={g.name} />)}</datalist>
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Discount Code</label>
                <input className="input" value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="e.g. RTF20" style={{ padding: '7px 9px', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Website</label>
                <input className="input" type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." style={{ padding: '7px 9px', fontSize: '0.85rem' }} />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div>
            <SectionLabel>Logo</SectionLabel>
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{
                position: 'relative', border: '2px dashed var(--border-color)', borderRadius: '12px',
                padding: '1.25rem', textAlign: 'center', transition: 'border-color 0.15s',
                background: (logo || logoUrl) ? 'rgba(37,99,235,0.04)' : 'var(--bg-secondary)',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {(logo || logoUrl) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '80px', height: '80px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      <img src={logo ? URL.createObjectURL(logo) : `${API}${logoUrl}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Logo preview" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                        {logo ? logo.name : 'Current logo'}
                      </p>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                        Click to replace
                      </p>
                      <button type="button" onClick={e => { e.preventDefault(); setLogo(null); setLogoUrl(''); }}
                        style={{ fontSize: '0.74rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '2px 10px', cursor: 'pointer', fontWeight: 700 }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', margin: '0 auto 0.6rem', display: 'block' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 3px' }}>Upload firm logo</p>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0 }}>PNG, JPG, SVG, WebP</p>
                  </div>
                )}
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) { setLogo(e.target.files[0]); setLogoUrl(''); } }} />
              </div>
            </label>
          </div>

          {/* Platforms */}
          <div>
            <SectionLabel>Platforms Supported</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.45rem' }}>
              {PLATFORMS.map(p => {
                const active = platforms.includes(p);
                return (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 11px', background: active ? 'rgba(37,99,235,0.12)' : 'var(--bg-secondary)', border: `1px solid ${active ? 'rgba(37,99,235,0.45)' : 'var(--border-color)'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.12s', userSelect: 'none' }}>
                    <div style={{ width: '15px', height: '15px', borderRadius: '4px', border: `2px solid ${active ? '#2563eb' : 'var(--border-color)'}`, background: active ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s' }}>
                      {active && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <input type="checkbox" checked={active} onChange={() => togglePlatform(p)} style={{ display: 'none' }} />
                    {p}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Plans */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <SectionLabel>Plans</SectionLabel>
              <button type="button" onClick={() => setPlans(prev => [...prev, makePlan()])}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(37,99,235,0.1)', color: '#3b82f6', border: '1px dashed rgba(37,99,235,0.4)', borderRadius: '7px', padding: '4px 12px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                <Plus size={13} /> Add plan
              </button>
            </div>
            {plans.map((plan, pIdx) => (
              <PlanCard
                key={plan._key}
                plan={plan}
                onUpdate={patch => updatePlan(pIdx, patch)}
                onRemove={() => setPlans(prev => prev.length > 1 ? prev.filter((_, i) => i !== pIdx) : prev)}
                onCopy={() => copyPlan(pIdx)}
              />
            ))}
          </div>

        </div>

        {/* Sticky footer */}
        <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', flexShrink: 0, background: 'var(--bg-secondary)' }}>
          <button type="button" onClick={onClose} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.45rem 1.1rem' }}>Cancel</button>
          <button type="button" onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ fontSize: '0.85rem', padding: '0.45rem 1.25rem' }}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Firm'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default PropFirmFormModal;
