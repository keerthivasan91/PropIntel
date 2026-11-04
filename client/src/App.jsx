import React, { useCallback, useEffect, useState } from 'react';
import {
  analyzeLead,
  createLead,
  fetchLead,
  fetchLeadAnalyses,
  fetchLeadSummary,
  fetchLeads,
  updateLead
} from './services/api.js';

const statuses = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['qualified', 'Qualified'],
  ['site_visit', 'Site visit'],
  ['negotiation', 'Negotiation'],
  ['won', 'Won'],
  ['lost', 'Lost']
];

const emptyForm = {
  name: '',
  location: '',
  property_requirement: '',
  budget_min: '',
  budget_max: '',
  buying_timeline: 'Within 2 months',
  customer_message: ''
};

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true
  };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    checklist: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" /></>,
    sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>
  };
  return <svg {...common}>{paths[name] ?? paths.building}</svg>;
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('propintel-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage may be unavailable.
  }
  return 'light';
}

function formatBudget(minimum, maximum) {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  if (minimum == null && maximum == null) return 'Not specified';
  if (minimum != null && maximum != null) {
    return formatter.format(minimum) + ' – ' + formatter.format(maximum);
  }
  return minimum != null ? 'From ' + formatter.format(minimum) : 'Up to ' + formatter.format(maximum);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function StatusBadge({ status }) {
  const label = statuses.find(([value]) => value === status)?.[1] ?? status;
  return <span className={'status-badge status-' + status}>{label}</span>;
}

function LeadForm({ onClose, onSubmit, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setFormError('');

    if (form.budget_min && form.budget_max &&
        Number(form.budget_min) > Number(form.budget_max)) {
      setFormError('Minimum budget cannot be greater than maximum budget.');
      return;
    }

    try {
      await onSubmit({
        ...form,
        budget_min: form.budget_min === '' ? null : Number(form.budget_min),
        budget_max: form.budget_max === '' ? null : Number(form.budget_max)
      });
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="lead-form-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">LEAD INTAKE</span>
            <h2 id="lead-form-title">Add a new lead</h2>
            <p>Capture the customer's requirement and enquiry.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close form"><Icon name="close" /></button>
        </div>

        <form onSubmit={submit} className="lead-form">
          <div className="form-grid">
            <label>Customer name
              <input name="name" value={form.name} onChange={updateField} maxLength="120" required placeholder="e.g. Aarav Mehta" />
            </label>
            <label>Location
              <input name="location" value={form.location} onChange={updateField} maxLength="160" required placeholder="e.g. Whitefield, Bengaluru" />
            </label>
            <label>Property requirement
              <input name="property_requirement" value={form.property_requirement} onChange={updateField} maxLength="160" required placeholder="e.g. 3BHK apartment" />
            </label>
            <label>Buying timeline
              <select name="buying_timeline" value={form.buying_timeline} onChange={updateField} required>
                <option>Immediately</option>
                <option>Within 2 months</option>
                <option>3 to 6 months</option>
                <option>More than 6 months</option>
                <option>Just exploring</option>
                <option>Not specified</option>
              </select>
            </label>
            <label>Minimum budget (₹)
              <input name="budget_min" type="number" min="0" step="1" value={form.budget_min} onChange={updateField} placeholder="e.g. 9000000" />
            </label>
            <label>Maximum budget (₹)
              <input name="budget_max" type="number" min="0" step="1" value={form.budget_max} onChange={updateField} placeholder="e.g. 12000000" />
            </label>
            <label className="form-full">Customer message
              <textarea name="customer_message" value={form.customer_message} onChange={updateField} maxLength="5000" required rows="4" placeholder="Paste the customer's enquiry or conversation summary…" />
              <small>{form.customer_message.length}/5000 characters</small>
            </label>
          </div>

          {formError && <div className="inline-error" role="alert">{formError}</div>}

          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="button-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : <><Icon name="plus" size={16} /> Save lead</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function LeadDetails({ lead, onClose, onStatusChange, updating }) {
  const [analyses, setAnalyses] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    let active = true;
    setHistoryLoading(true);
    fetchLeadAnalyses(lead.id)
      .then((result) => {
        if (active) setAnalyses(result.analyses ?? []);
      })
      .catch((error) => {
        if (active) setAnalysisError(error.message);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lead.id]);

  async function runAnalysis() {
    setAnalysisLoading(true);
    setAnalysisError('');
    try {
      const result = await analyzeLead(lead.id);
      setAnalyses((current) => [result.analysis, ...current]);
    } catch (error) {
      setAnalysisError(error.message);
    } finally {
      setAnalysisLoading(false);
    }
  }

  const latest = analyses[0] ?? null;
  const scoreRows = latest ? [
    ['timeline', 'Buying timeline'],
    ['budget', 'Budget clarity'],
    ['requirement', 'Requirement clarity'],
    ['engagement', 'Engagement signals']
  ] : [];

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !analysisLoading) onClose();
    }}>
      <section className="modal-card detail-modal" role="dialog" aria-modal="true" aria-labelledby="lead-detail-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">LEAD DETAILS · #{lead.id}</span>
            <h2 id="lead-detail-title">{lead.name}</h2>
            <p>{lead.property_requirement} · {lead.location}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close details" disabled={analysisLoading}><Icon name="close" /></button>
        </div>

        <div className="detail-grid">
          <div><small>Budget</small><strong>{formatBudget(lead.budget_min, lead.budget_max)}</strong></div>
          <div><small>Buying timeline</small><strong>{lead.buying_timeline}</strong></div>
          <div><small>Created</small><strong>{formatDate(lead.created_at)}</strong></div>
          <div><small>Current status</small><StatusBadge status={lead.status} /></div>
        </div>

        <div className="message-panel">
          <span className="eyebrow">CUSTOMER MESSAGE</span>
          <p>{lead.customer_message}</p>
        </div>

        <section className="analysis-panel">
          <div className="analysis-header">
            <div>
              <span className="eyebrow">GEMINI-POWERED · HUMAN REVIEW</span>
              <h3>AI lead intelligence</h3>
              <p>Analysis is grounded in the lead and the fictional Northstar Homes demo policies.</p>
            </div>
            <button className="button-primary" type="button" onClick={runAnalysis} disabled={analysisLoading || historyLoading}>
              <Icon name="sparkles" size={15} />
              {analysisLoading ? 'Analysing…' : latest ? 'Re-analyse' : 'Analyse lead'}
            </button>
          </div>

          {analysisError && <div className="inline-error" role="alert">{analysisError}</div>}

          {historyLoading ? (
            <div className="analysis-empty"><span className="loader" /> Loading saved analysis…</div>
          ) : latest ? (
            <>
              <div className="analysis-score-row">
                <div className={'analysis-score score-' + latest.priority}>
                  <strong>{latest.lead_score}</strong><small>/100</small>
                  <span>Priority score</span>
                </div>
                <div className="analysis-priority-copy">
                  <span className={'priority-label priority-' + latest.priority}>{latest.priority.toUpperCase()} PRIORITY</span>
                  <strong>{latest.customer_intent}</strong>
                  <small>Analysis v{latest.analysis_version} · {latest.model_name} · {formatDate(latest.created_at)}</small>
                </div>
              </div>

              <div className="analysis-content-grid">
                <article className="analysis-content-block">
                  <h4>Lead summary</h4>
                  <p>{latest.summary}</p>
                </article>
                <article className="analysis-content-block">
                  <h4>Recommended next action</h4>
                  <p>{latest.recommended_action}</p>
                </article>
              </div>

              <div className="analysis-content-block analysis-list-block">
                <h4>Key requirements</h4>
                {latest.key_requirements.length ? (
                  <ul>{latest.key_requirements.map((item, index) => <li key={index}>{item}</li>)}</ul>
                ) : <p>No additional requirements were stated.</p>}
              </div>

              <div className="analysis-content-block analysis-list-block">
                <h4>Objections and concerns</h4>
                {latest.objections.length ? (
                  <ul>{latest.objections.map((item, index) => <li key={index}>{item}</li>)}</ul>
                ) : <p>No explicit objections were identified in the customer message.</p>}
              </div>

              <div className="suggested-response">
                <div className="suggested-response-heading"><h4>Suggested customer response</h4><span>Draft for review</span></div>
                <p>{latest.suggested_response}</p>
              </div>

              <details className="score-breakdown">
                <summary>Why this lead received {latest.lead_score}/100</summary>
                <div className="score-breakdown-list">
                  {scoreRows.map(([key, label]) => {
                    const item = latest.score_breakdown[key];
                    return (
                      <div className="score-breakdown-row" key={key}>
                        <div><strong>{label}</strong><small>{item.reason}</small></div>
                        <span>{item.score}/{item.maximum}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="score-disclaimer">{latest.score_breakdown.interpretation}</p>
              </details>

              {analyses.length > 1 && (
                <details className="analysis-history">
                  <summary>Previous analyses ({analyses.length - 1})</summary>
                  {analyses.slice(1).map((item) => (
                    <div className="analysis-history-row" key={item.id}>
                      <div><strong>Version {item.analysis_version}</strong><small>{formatDate(item.created_at)} · {item.model_name}</small></div>
                      <span className={'priority-label priority-' + item.priority}>{item.priority.toUpperCase()} · {item.lead_score}/100</span>
                    </div>
                  ))}
                </details>
              )}
            </>
          ) : (
            <div className="analysis-empty">
              <span className="empty-icon"><Icon name="sparkles" size={23} /></span>
              <strong>No AI analysis yet</strong>
              <p>Generate an analysis to extract the customer's intent, requirements, concerns and a recommended next action.</p>
            </div>
          )}

          <p className="analysis-disclaimer">AI output may be inaccurate. Verify property facts and review suggested responses before using them. The priority score is an internal sorting aid, not a probability of purchase.</p>
        </section>

        <label className="detail-status-label">Update lead status
          <select value={lead.status} disabled={updating} onChange={(event) => onStatusChange(lead.id, event.target.value)}>
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <div className="modal-actions">
          <button className="button-secondary" onClick={onClose} type="button">Close</button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [page, setPage] = useState('overview');
  const [apiStatus, setApiStatus] = useState('checking');
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('propintel-theme', theme);
    } catch {
      // Current session theme remains active.
    }
  }, [theme]);

  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchLeadSummary();
      setSummary(data);
      setApiStatus('connected');
    } catch (loadError) {
      setApiStatus('unavailable');
      setError(loadError.message);
    }
  }, []);

  const loadLeads = useCallback(async (options = {}) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchLeads({
        search: options.search ?? search,
        status: options.status ?? statusFilter,
        page: options.page ?? pagination.page,
        limit: 10
      });
      setLeads(result.leads);
      setPagination(result.pagination);
      setApiStatus('connected');
    } catch (loadError) {
      setError(loadError.message);
      setApiStatus('unavailable');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.page]);

  useEffect(() => {
    loadSummary();
    loadLeads({ page: 1 });
  }, []); // Initial data load only.

  useEffect(() => {
    if (page === 'leads') loadLeads();
  }, [page, loadLeads]);

  function applyFilters(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPagination((current) => ({ ...current, page: 1 }));
  }

  async function handleCreateLead(payload) {
    setSaving(true);
    try {
      await createLead(payload);
      setFormOpen(false);
      setNotice('Lead saved successfully.');
      setSearch('');
      setSearchInput('');
      setStatusFilter('');
      setPagination((current) => ({ ...current, page: 1 }));
      await Promise.all([loadSummary(), loadLeads({ search: '', status: '', page: 1 })]);
    } finally {
      setSaving(false);
    }
  }

  async function openLead(id) {
    setError('');
    try {
      const result = await fetchLead(id);
      setSelectedLead(result.lead);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function handleStatusChange(id, status) {
    setUpdating(true);
    try {
      const result = await updateLead(id, { status });
      setSelectedLead(result.lead);
      setNotice('Lead status updated.');
      await Promise.all([loadSummary(), loadLeads()]);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdating(false);
    }
  }

  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light');
  const totalLeads = summary?.total ?? '—';
  const newLeads = summary?.byStatus?.new ?? 0;
  const activeLeads = summary
    ? ['contacted', 'qualified', 'site_visit', 'negotiation'].reduce((sum, key) => sum + (summary.byStatus[key] ?? 0), 0)
    : '—';
  const wonLeads = summary?.byStatus?.won ?? '—';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setPage('overview')} aria-label="PropIntel home">
          <span className="brand-mark"><Icon name="building" size={20} /></span>
          <span className="brand-copy"><strong>PropIntel</strong><small>SALES INTELLIGENCE</small></span>
        </a>

        <div className="workspace-switcher">
          <span className="workspace-avatar">N</span>
          <span className="workspace-copy"><strong>Northstar Homes</strong><small>Demo workspace</small></span>
          <span className="workspace-chevron">⌄</span>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Main navigation">
          <button className={'nav-item ' + (page === 'overview' ? 'active' : '')} onClick={() => { setPage('overview'); setNotice(''); }} type="button">
            <Icon name="grid" /> <span>Overview</span>
          </button>
          <button className={'nav-item ' + (page === 'leads' ? 'active' : '')} onClick={() => { setPage('leads'); setNotice(''); }} type="button">
            <Icon name="users" /> <span>Leads</span>
          </button>
          <div className="nav-item disabled" title="Planned for the next milestone"><Icon name="checklist" /> <span>Sales workspace</span><small>SOON</small></div>
          <div className="nav-item disabled" title="Planned for the next milestone"><Icon name="sparkles" /> <span>AI assistant</span><small>SOON</small></div>
        </nav>

        <div className="sidebar-bottom">
          <div className="environment-card">
            <span className="environment-icon"><Icon name="building" size={17} /></span>
            <div><strong>Demo environment</strong><p>Sample data only</p></div>
          </div>
          <div className="connection-row">
            <span className={'connection-dot ' + apiStatus} />
            <span>{apiStatus === 'checking' ? 'Checking API…' : apiStatus === 'connected' ? 'API connected' : 'API unavailable'}</span>
          </div>
          <div className="sidebar-footnote">PropIntel · Lead management</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{page === 'overview' ? 'Overview' : 'Leads'}</strong></div>
          <div className="topbar-actions">
            <span className="demo-tag"><span /> DEMO WORKSPACE</span>
            <button className="theme-toggle" onClick={toggleTheme} type="button" aria-label={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'} title="Toggle theme"><Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} /></button>
            <div className="profile-avatar" aria-label="Demo user">D</div>
          </div>
        </header>

        <div className="page-content">
          {notice && <div className="notice-banner" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice" type="button"><Icon name="close" size={15} /></button></div>}
          {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error" type="button"><Icon name="close" size={15} /></button></div>}

          {page === 'overview' ? (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">YOUR SALES WORKSPACE</div>
                  <h1>A clearer view of every opportunity.</h1>
                  <p className="page-subtitle">Track customer enquiries and keep the next sales action visible.</p>
                </div>
                <button className="button-primary" onClick={() => { setPage('leads'); setFormOpen(true); }} type="button"><Icon name="plus" size={16} /> Add a lead</button>
              </section>

              <section className="intro-panel">
                <div className="intro-copy">
                  <div className="intro-kicker"><Icon name="sparkles" size={15} /> BUILT FOR REAL ESTATE SALES TEAMS</div>
                  <h2>Turn customer enquiries into meaningful next steps.</h2>
                  <p>Capture the customer's requirements, keep lead information organized and prepare for AI-assisted sales decisions in the next milestone.</p>
                  <div className="intro-note"><span className="note-check"><Icon name="check" size={13} /></span> Human decisions stay in control. AI recommendations are suggestions, not commitments.</div>
                </div>
                <div className="intro-illustration" aria-hidden="true">
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                  <div className="illustration-card"><span className="illustration-icon"><Icon name="building" size={27} /></span><span className="illustration-lines"><i /><i /><i /></span><span className="illustration-badge"><Icon name="sparkles" size={13} /> AI-ready workflow</span></div>
                  <span className="floating-dot dot-one" /><span className="floating-dot dot-two" />
                </div>
              </section>

              <section className="section-heading">
                <div><h2>Lead overview</h2><p>Metrics are retrieved from the MySQL-backed lead records.</p></div>
                <span className="module-status">LIVE DATA</span>
              </section>

              <section className="metric-grid" aria-label="Lead metrics">
                <article className="metric-card"><div className="metric-top"><span className="metric-icon blue"><Icon name="users" /></span><span className="metric-label">TOTAL LEADS</span></div><div className="metric-value">{totalLeads}</div><div className="metric-foot">All saved enquiries</div></article>
                <article className="metric-card"><div className="metric-top"><span className="metric-icon violet"><Icon name="sparkles" /></span><span className="metric-label">NEW LEADS</span></div><div className="metric-value">{summary ? newLeads : '—'}</div><div className="metric-foot">Awaiting first contact</div></article>
                <article className="metric-card"><div className="metric-top"><span className="metric-icon amber"><Icon name="clock" /></span><span className="metric-label">ACTIVE PIPELINE</span></div><div className="metric-value">{activeLeads}</div><div className="metric-foot">Contacted through negotiation</div></article>
                <article className="metric-card"><div className="metric-top"><span className="metric-icon green"><Icon name="check" /></span><span className="metric-label">WON</span></div><div className="metric-value">{wonLeads}</div><div className="metric-foot">Marked as won</div></article>
              </section>

              <section className="content-card recent-leads-card">
                <div className="card-heading">
                  <div><h2>Recent leads</h2><p>Latest customer enquiries in this workspace</p></div>
                  <button className="text-button" onClick={() => setPage('leads')} type="button">View all <Icon name="arrow" size={15} /></button>
                </div>
                {leads.length === 0 ? <div className="small-empty">No leads are available yet. Add your first customer enquiry to get started.</div> : (
                  <div className="recent-list">
                    {leads.slice(0, 4).map((lead) => (
                      <button className="recent-row" key={lead.id} onClick={() => openLead(lead.id)} type="button">
                        <span className="lead-avatar">{lead.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
                        <span className="recent-copy"><strong>{lead.name}</strong><small>{lead.property_requirement} · {lead.location}</small></span>
                        <StatusBadge status={lead.status} />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              <section className="lead-page-header">
                <div><div className="eyebrow">CUSTOMER PIPELINE</div><h1>Leads</h1><p className="page-subtitle">Manage incoming customer enquiries and keep their status up to date.</p></div>
                <button className="button-primary" onClick={() => setFormOpen(true)} type="button"><Icon name="plus" size={16} /> Add lead</button>
              </section>

              <section className="content-card leads-card">
                <div className="lead-toolbar">
                  <form className="lead-search" onSubmit={applyFilters}>
                    <Icon name="search" size={17} />
                    <input aria-label="Search leads" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by customer, location or requirement…" />
                    <button type="submit">Search</button>
                  </form>
                  <label className="status-filter">Status
                    <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }}>
                      <option value="">All statuses</option>
                      {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>

                {loading ? <div className="table-state"><span className="loader" /> Loading leads…</div> :
                  leads.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon"><Icon name="users" size={24} /></span>
                      <h2>{search || statusFilter ? 'No matching leads' : 'No leads yet'}</h2>
                      <p>{search || statusFilter ? 'Try changing your search or status filter.' : 'Add a customer enquiry to start building your sales pipeline.'}</p>
                      <button className="button-primary" onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter(''); setFormOpen(true); }} type="button"><Icon name="plus" size={16} /> Add first lead</button>
                    </div>
                  ) : (
                    <>
                      <div className="table-scroll">
                        <table className="leads-table">
                          <thead><tr><th>Customer</th><th>Requirement</th><th>Budget</th><th>Timeline</th><th>Status</th><th>Added</th></tr></thead>
                          <tbody>
                            {leads.map((lead) => (
                              <tr key={lead.id}>
                                <td><button className="customer-link" onClick={() => openLead(lead.id)} type="button"><strong>{lead.name}</strong><small><Icon name="pin" size={12} /> {lead.location}</small></button></td>
                                <td>{lead.property_requirement}</td>
                                <td className="budget-cell">{formatBudget(lead.budget_min, lead.budget_max)}</td>
                                <td>{lead.buying_timeline}</td>
                                <td><select className={'status-select status-' + lead.status} aria-label={'Status for ' + lead.name} value={lead.status} onChange={(event) => handleStatusChange(lead.id, event.target.value)}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
                                <td className="date-cell">{formatDate(lead.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="table-footer">
                        <span>Showing {leads.length} of {pagination.total} leads</span>
                        <div className="pagination-actions">
                          <button className="icon-button" type="button" disabled={pagination.page <= 1 || loading} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} aria-label="Previous page"><Icon name="chevronLeft" size={16} /></button>
                          <span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span>
                          <button className="icon-button" type="button" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} aria-label="Next page"><Icon name="chevronRight" size={16} /></button>
                        </div>
                      </div>
                    </>
                  )}
              </section>
            </>
          )}

          <footer className="page-footer"><span>PropIntel · AI-powered real-estate sales workspace</span><span>Fictional demo company · Synthetic data only</span></footer>
        </div>
      </main>

      {formOpen && <LeadForm onClose={() => setFormOpen(false)} onSubmit={handleCreateLead} saving={saving} />}
      {selectedLead && <LeadDetails lead={selectedLead} onClose={() => setSelectedLead(null)} onStatusChange={handleStatusChange} updating={updating} />}
    </div>
  );
}
