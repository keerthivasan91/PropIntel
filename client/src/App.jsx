import React, { useCallback, useEffect, useState } from 'react';
import {
  analyzeLead,
  checkAdminSession,
  createLead,
  loginAdmin,
  logoutAdmin,
  submitPublicEnquiry,
  fetchLead,
  fetchLeadAnalyses,
  fetchLeadConversation,
  fetchLeadSummary,
  fetchLeads,
  fetchLeadTasks,
  fetchLeadActivities,
  fetchTasks,
  fetchTaskSummary,
  createTask,
  updateTask,
  sendLeadMessage,
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

function getInitialSidebarCollapsed() {
  try { return localStorage.getItem('propintel-sidebar-collapsed') === 'true'; }
  catch { return false; }
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

const policyLabels = {
  company_profile: 'Company profile',
  sales_policies: 'Sales policies',
  communication_guidelines: 'Communication guidelines',
  escalation_rules: 'Escalation rules'
};

function LeadChat({ leadId }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [latestReply, setLatestReply] = useState(null);

  useEffect(() => {
    let active = true;
    setLoadingHistory(true);
    setError('');
    setLatestReply(null);

    fetchLeadConversation(leadId)
      .then((result) => {
        if (active) setMessages(result.messages ?? []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [leadId]);

  async function submitMessage(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;

    setSending(true);
    setError('');

    try {
      const result = await sendLeadMessage(leadId, message);
      setMessages((current) => [...current, ...result.messages]);
      setLatestReply(result.reply);
      setDraft('');
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat-panel" aria-labelledby="lead-chat-title">
      <div className="chat-header">
        <div className="chat-title-wrap">
          <span className="chat-icon"><Icon name="sparkles" size={17} /></span>
          <div>
            <span className="eyebrow">LEAD-SPECIFIC CONTEXT</span>
            <h3 id="lead-chat-title">PropIntel assistant</h3>
            <p>Uses this lead, the latest analysis and Northstar Homes demo policies.</p>
          </div>
        </div>
        <span className="chat-memory-label">SAVED HISTORY</span>
      </div>

      <div className="chat-messages" role="log" aria-live="polite" aria-label="Conversation history">
        {loadingHistory ? (
          <div className="chat-empty"><span className="loader" /> Loading conversation…</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <strong>Start with this lead</strong>
            <p>Ask about the customer's requirements, a sales policy or a suitable follow-up. The conversation is saved against this lead.</p>
            <div className="chat-suggestions">
              <button type="button" onClick={() => setDraft('What are the customer’s main requirements?')}>Summarize requirements</button>
              <button type="button" onClick={() => setDraft('Can we promise this customer a discount?')}>Check discount policy</button>
              <button type="button" onClick={() => setDraft('What should I clarify in the next call?')}>Prepare next call</button>
            </div>
          </div>
        ) : (
          messages.map((item) => (
            <div className={'chat-message-row ' + (item.role === 'user' ? 'from-user' : 'from-assistant')} key={item.id}>
              <span className="chat-message-role">{item.role === 'user' ? 'YOU' : 'PROPINTEL'}</span>
              <div className="chat-message-bubble">{item.message}</div>
            </div>
          ))
        )}
        {sending && <div className="chat-thinking"><span className="loader" /> Reviewing lead and company context…</div>}
      </div>

      {latestReply && (
        <div className="chat-reply-meta">
          <span className={'chat-decision decision-' + latestReply.decision}>{latestReply.decision.replaceAll('_', ' ')}</span>
          {latestReply.supporting_policy_ids?.length > 0 && (
            <div className="chat-policy-sources">
              <span>Context:</span>
              {latestReply.supporting_policy_ids.map((id) => <span className="chat-policy-chip" key={id}>{policyLabels[id] ?? id}</span>)}
            </div>
          )}
          {latestReply.missing_information?.length > 0 && (
            <div className="chat-missing-info"><strong>Information to confirm:</strong> {latestReply.missing_information.join('; ')}</div>
          )}
          {latestReply.suggested_action && <div className="chat-suggested-action"><strong>Suggested action:</strong> {latestReply.suggested_action}</div>}
        </div>
      )}

      {error && <div className="inline-error" role="alert">{error}</div>}

      <form className="chat-compose" onSubmit={submitMessage}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Ask about this lead or the demo company's sales policies…"
          aria-label="Message the PropIntel assistant"
          disabled={sending || loadingHistory}
        />
        <div className="chat-compose-footer">
          <span>{draft.length}/2000 · Responses are suggestions for salesperson review</span>
          <button className="button-primary" type="submit" disabled={sending || loadingHistory || !draft.trim()}>
            {sending ? 'Sending…' : 'Send message'} <Icon name="arrow" size={14} />
          </button>
        </div>
      </form>
      <p className="chat-disclaimer">The assistant is restricted to real-estate sales support. It may be inaccurate; verify facts and follow authorized company processes.</p>
    </section>
  );
}

function formatDateTime(value) {
  if (!value) return 'No due date';
  const raw = String(value);
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z';
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function taskIsOverdue(task) {
  if (!task.due_at || task.status !== 'pending') return false;
  const raw = String(task.due_at);
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z';
  const due = new Date(normalized);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

function TaskStatus({ status, overdue = false }) {
  const label = overdue ? 'Overdue' : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={'task-status task-' + (overdue ? 'overdue' : status)}>{label}</span>;
}

function LeadTaskSection({ leadId, recommendedAction = '' }) {
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [usingRecommendation, setUsingRecommendation] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [taskResult, activityResult] = await Promise.all([
        fetchLeadTasks(leadId),
        fetchLeadActivities(leadId)
      ]);
      setTasks(taskResult.tasks ?? []);
      setActivities(activityResult.activities ?? []);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function submitTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createTask(leadId, {
        title: title.trim(),
        description: description.trim() || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null
      });
      setTitle('');
      setDescription('');
      setDueAt('');
      setShowComposer(false);
      setUsingRecommendation(false);
      await refresh();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeTaskStatus(id, status) {
    setUpdatingId(id);
    setError('');
    try {
      await updateTask(id, { status });
      await refresh();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId('');
    }
  }

  const activityLabel = (type) => String(type).replaceAll('_', ' ');

  return (
    <section className="lead-task-section">
      <div className="lead-task-heading">
        <div>
          <span className="eyebrow">SALES ACTION WORKSPACE</span>
          <h3>Follow-ups & activity</h3>
          <p>Tasks are saved against this lead and appear in the sales workspace.</p>
        </div>
        <div className="lead-task-heading-actions">
          {recommendedAction.trim() && (
            <button
              className="button-secondary"
              type="button"
              disabled={saving}
              onClick={() => {
                setTitle('Follow up on AI recommendation');
                setDescription(recommendedAction);
                setDueAt('');
                setUsingRecommendation(true);
                setShowComposer(true);
              }}
            >
              Use AI recommendation
            </button>
          )}
          <button
            className="button-primary"
            type="button"
            onClick={() => {
              if (showComposer) {
                setShowComposer(false);
                setUsingRecommendation(false);
              } else {
                setTitle('');
                setDescription('');
                setDueAt('');
                setUsingRecommendation(false);
                setShowComposer(true);
              }
            }}
          >
            <Icon name="plus" size={15} /> {showComposer ? 'Close' : 'Add task'}
          </button>
        </div>
      </div>

      {showComposer && (
        <form className="task-composer" onSubmit={submitTask}>
          {usingRecommendation && (
            <p className="task-recommendation-note">
              AI recommendation copied into this draft. Review or edit the details before creating the task.
            </p>
          )}
          <label>Task title
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength="180" required placeholder="e.g. Call customer to confirm site visit" />
          </label>
          <label>Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength="2000" rows="2" placeholder="Optional notes for the salesperson" />
          </label>
          <label>Due date and time
            <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          </label>
          <div className="task-composer-actions">
            <button className="button-secondary" type="button" onClick={() => { setShowComposer(false); setUsingRecommendation(false); }} disabled={saving}>Cancel</button>
            <button className="button-primary" type="submit" disabled={saving || !title.trim()}>{saving ? 'Saving…' : 'Create task'}</button>
          </div>
        </form>
      )}

      {error && <div className="inline-error" role="alert">{error}</div>}

      <div className="lead-task-columns">
        <div className="lead-task-list">
          <div className="subsection-heading"><strong>Tasks</strong><span>{tasks.length}</span></div>
          {loading ? <div className="task-small-state"><span className="loader" /> Loading tasks…</div> :
            tasks.length === 0 ? <div className="task-small-state">No follow-up tasks created for this lead.</div> :
              tasks.map((task) => (
                <article className="lead-task-row" key={task.id}>
                  <div className="lead-task-main">
                    <strong>{task.title}</strong>
                    {task.description && <p>{task.description}</p>}
                    <small>{formatDateTime(task.due_at)}</small>
                  </div>
                  <div className="lead-task-actions">
                    <TaskStatus status={task.status} overdue={taskIsOverdue(task)} />
                    {task.status === 'pending' && (
                      <button className="task-complete-button" type="button" disabled={updatingId === task.id} onClick={() => changeTaskStatus(task.id, 'completed')}>
                        <Icon name="check" size={13} /> Complete
                      </button>
                    )}
                  </div>
                </article>
              ))
          }
        </div>

        <div className="lead-activity-list">
          <div className="subsection-heading"><strong>Activity timeline</strong><span>{activities.length}</span></div>
          {loading ? <div className="task-small-state">Loading activity…</div> :
            activities.length === 0 ? <div className="task-small-state">No activity recorded yet.</div> :
              <div className="activity-timeline">
                {activities.map((activity) => (
                  <div className="activity-item" key={activity.id}>
                    <span className="activity-marker" />
                    <div><strong>{activityLabel(activity.activity_type)}</strong><p>{activity.description}</p><small>{formatDateTime(activity.created_at)}</small></div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </section>
  );
}

function SalesWorkspace({ onOpenLead }) {
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState('pending');
  const [due, setDue] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [taskResult, summaryResult] = await Promise.all([
        fetchTasks({ status, due, search, page, limit: 20 }),
        fetchTaskSummary()
      ]);
      setTasks(taskResult.tasks ?? []);
      setPagination(taskResult.pagination);
      setSummary(summaryResult);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [status, due, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  function applySearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  async function updateStatus(id, nextStatus) {
    setUpdatingId(id);
    setError('');
    try {
      await updateTask(id, { status: nextStatus });
      await load();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <>
      <section className="lead-page-header">
        <div>
          <div className="eyebrow">EXECUTION & FOLLOW-UP</div>
          <h1>Sales Action Workspace</h1>
          <p className="page-subtitle">Turn customer conversations into owned, trackable next steps.</p>
        </div>
      </section>

      <section className="task-metric-grid">
        <article className="task-metric-card"><span>OPEN TASKS</span><strong>{summary?.pending ?? '—'}</strong><small>Awaiting action</small></article>
        <article className="task-metric-card overdue-metric"><span>OVERDUE</span><strong>{summary?.overdue ?? '—'}</strong><small>Past their due date</small></article>
        <article className="task-metric-card"><span>COMPLETED</span><strong>{summary?.completed ?? '—'}</strong><small>Marked complete</small></article>
        <article className="task-metric-card"><span>CANCELLED</span><strong>{summary?.cancelled ?? '—'}</strong><small>No longer required</small></article>
      </section>

      <section className="content-card sales-workspace-card">
        <div className="lead-toolbar">
          <form className="lead-search" onSubmit={applySearch}>
            <Icon name="search" size={17} />
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search task or customer…" aria-label="Search tasks" />
            <button type="submit">Search</button>
          </form>
          <div className="task-filters">
            <label>Status
              <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>Due
              <select value={due} onChange={(event) => { setDue(event.target.value); setPage(1); }}>
                <option value="">Any due date</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due today</option>
                <option value="upcoming">Upcoming</option>
                <option value="no_date">No due date</option>
              </select>
            </label>
          </div>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}
        {loading ? <div className="table-state"><span className="loader" /> Loading tasks…</div> :
          tasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon"><Icon name="checklist" size={24} /></span>
              <h2>No tasks match this view</h2>
              <p>Create a follow-up from a lead record, then manage it here. Tasks remain linked to their customer.</p>
            </div>
          ) : (
            <div className="workspace-task-list">
              {tasks.map((task) => (
                <article className="workspace-task-row" key={task.id}>
                  <div className="workspace-task-date">
                    <span>{task.due_at ? formatDate(task.due_at) : 'No date'}</span>
                    <small>{task.due_at ? formatDateTime(task.due_at).split(', ').slice(-1)[0] : 'Unscheduled'}</small>
                  </div>
                  <div className="workspace-task-copy">
                    <strong>{task.title}</strong>
                    {task.description && <p>{task.description}</p>}
                    <button type="button" className="task-lead-link" onClick={() => onOpenLead(task.lead_id)}>{task.lead_name} · {task.lead_location}</button>
                  </div>
                  <div className="workspace-task-right">
                    <TaskStatus status={task.status} overdue={taskIsOverdue(task)} />
                    {task.status === 'pending' && (
                      <div className="task-row-buttons">
                        <button className="task-complete-button" type="button" disabled={updatingId === task.id} onClick={() => updateStatus(task.id, 'completed')}><Icon name="check" size={13} /> Complete</button>
                        <button className="task-cancel-button" type="button" disabled={updatingId === task.id} onClick={() => updateStatus(task.id, 'cancelled')}>Cancel</button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        <div className="table-footer">
          <span>{pagination.total} tasks</span>
          <div className="pagination-actions">
            <button className="icon-button" type="button" disabled={pagination.page <= 1 || loading} onClick={() => setPage((value) => value - 1)} aria-label="Previous page"><Icon name="chevronLeft" size={16} /></button>
            <span>Page {pagination.page || 1} of {Math.max(1, pagination.totalPages || 0)}</span>
            <button className="icon-button" type="button" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><Icon name="chevronRight" size={16} /></button>
          </div>
        </div>
      </section>
    </>
  );
}

function AssistantWorkspace({ initialLeadId, onOpenLead }) {
  const [leads, setLeads] = useState([]);
  const [selectedId, setSelectedId] = useState(initialLeadId ? String(initialLeadId) : '');
  const [selectedLead, setSelectedLead] = useState(null);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingLead, setLoadingLead] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchLeads({ page: 1, limit: 50 })
      .then((result) => {
        if (!active) return;
        const items = result.leads ?? [];
        setLeads(items);
        if (!selectedId && items.length) setSelectedId(String(items[0].id));
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoadingLeads(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) { setSelectedLead(null); return undefined; }
    let active = true;
    setLoadingLead(true);
    fetchLead(selectedId)
      .then((result) => { if (active) setSelectedLead(result.lead); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoadingLead(false); });
    return () => { active = false; };
  }, [selectedId]);

  return (
    <>
      <section className="lead-page-header">
        <div><div className="eyebrow">LEAD-SCOPED CONVERSATIONS</div><h1>AI Assistant</h1><p className="page-subtitle">Ask questions using one selected lead, its latest analysis and Northstar Homes demo policies.</p></div>
      </section>
      <section className="content-card assistant-workspace-card">
        <div className="assistant-lead-picker">
          <label htmlFor="assistant-lead-select">Select a lead</label>
          <select id="assistant-lead-select" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setError(''); }} disabled={loadingLeads || leads.length === 0}>
            <option value="">Choose a customer enquiry</option>
            {leads.map((item) => <option key={item.id} value={String(item.id)}>{item.name} · {item.location}</option>)}
          </select>
          {selectedLead && <button className="button-secondary" type="button" onClick={() => onOpenLead(selectedLead.id)}>View lead details</button>}
        </div>
        {error && <div className="error-banner" role="alert">{error}</div>}
        {loadingLeads || loadingLead ? <div className="table-state"><span className="loader" /> Loading lead context…</div> :
          selectedLead ? <>
            <div className="assistant-context-card">
              <div><span className="eyebrow">CURRENT CUSTOMER CONTEXT</span><strong>{selectedLead.name}</strong><p>{selectedLead.property_requirement} · {selectedLead.location}</p></div>
              <div><small>Budget</small><strong>{formatBudget(selectedLead.budget_min, selectedLead.budget_max)}</strong></div>
              <div><small>Buying timeline</small><strong>{selectedLead.buying_timeline}</strong></div>
            </div>
            <LeadChat key={selectedId} leadId={selectedId} />
          </> : <div className="empty-state"><span className="empty-icon"><Icon name="sparkles" size={24} /></span><h2>{leads.length ? 'Choose a lead to begin' : 'No leads available yet'}</h2><p>{leads.length ? 'Conversation history is stored separately for each customer.' : 'Customer enquiries submitted through the public page will appear here.'}</p></div>}
      </section>
    </>
  );
}

function LeadDetails({ lead, onClose, onStatusChange, updating, onAnalysisSaved, onOpenAssistant }) {
  const [analyses, setAnalyses] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

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
      onAnalysisSaved?.();
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
    <main className="lead-detail-page">
      <section className="detail-page-card" aria-labelledby="lead-detail-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">LEAD DETAILS · #{lead.id}</span>
            <h2 id="lead-detail-title">{lead.name}</h2>
            <p>{lead.property_requirement} · {lead.location}</p>
          </div>
          <div className="detail-heading-actions">
            <button className="button-secondary" type="button" onClick={() => onOpenAssistant(lead.id)}><Icon name="sparkles" size={15} /> Ask AI</button>
            <button className="icon-button" type="button" onClick={onClose} aria-label="Back to leads" disabled={analysisLoading}><Icon name="chevronLeft" /></button>
          </div>
        </div>

        <div className="detail-grid">
          <div><small>Budget</small><strong>{formatBudget(lead.budget_min, lead.budget_max)}</strong></div>
          <div><small>Buying timeline</small><strong>{lead.buying_timeline}</strong></div>
          <div><small>Created</small><strong>{formatDate(lead.created_at)}</strong></div>
          <div><small>Current status</small><StatusBadge status={lead.status} /></div>
        </div>

        <div className="detail-tabs" role="tablist" aria-label="Lead sections">
          <button type="button" role="tab" aria-selected={activeTab === 'overview'} className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
          <button type="button" role="tab" aria-selected={activeTab === 'analysis'} className={activeTab === 'analysis' ? 'active' : ''} onClick={() => setActiveTab('analysis')}>AI Analysis</button>
          <button type="button" role="tab" aria-selected={activeTab === 'activity'} className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>Activity & follow-ups</button>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="message-panel">
              <span className="eyebrow">CUSTOMER MESSAGE</span>
              <p>{lead.customer_message}</p>
            </div>
            <label className="detail-status-label">Update lead status
              <select value={lead.status} disabled={updating} onChange={(event) => onStatusChange(lead.id, event.target.value)}>
                {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </>
        )}

        {activeTab === 'analysis' && (
        <section className="analysis-panel">
          <div className="analysis-header">
            <div>
              <span className="eyebrow">GEMINI-POWERED · HUMAN REVIEW</span>
              <h3>AI lead intelligence</h3>
              <p>Analysis is grounded in the lead and the fictional Northstar Homes demo policies.</p>
              <p className="analysis-repeat-note">Re-analysing unchanged lead information can produce the same result. Versions are retained for traceability; update the lead when new customer information is available.</p>
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
                      <div><strong>Version {item.analysis_version}</strong><small>{formatDate(item.created_at)} · {item.model_name}</small><small className="history-summary">{item.summary}</small></div>
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
        )}

        {activeTab === 'activity' && (
          <LeadTaskSection key={'tasks-' + lead.id} leadId={lead.id} recommendedAction={latest?.recommended_action ?? ''} />
        )}
      </section>
    </main>
  );
}

function AdminWorkspace({ onLogout }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [page, setPage] = useState('overview');
  const [assistantLeadId, setAssistantLeadId] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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

  useEffect(() => {
    try { localStorage.setItem('propintel-sidebar-collapsed', String(sidebarCollapsed)); }
    catch { /* Keep the current-session layout when storage is unavailable. */ }
  }, [sidebarCollapsed]);

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
      setPage('lead');
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  function openAssistant(leadId = '') {
    setAssistantLeadId(leadId ? String(leadId) : '');
    setPage('assistant');
    setSelectedLead(null);
    setMobileSidebarOpen(false);
  }

  function navigate(nextPage) {
    setPage(nextPage);
    setNotice('');
    setMobileSidebarOpen(false);
  }

  function toggleSidebar() {
    if (window.matchMedia('(max-width: 800px)').matches) setMobileSidebarOpen((current) => !current);
    else setSidebarCollapsed((current) => !current);
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
    <div className={'app-shell' + (sidebarCollapsed ? ' sidebar-collapsed' : '') + (mobileSidebarOpen ? ' mobile-sidebar-open' : '')}>
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
          <button className={'nav-item ' + (page === 'overview' ? 'active' : '')} onClick={() => navigate('overview')} type="button"><Icon name="grid" /> <span>Overview</span></button>
          <button className={'nav-item ' + ((page === 'leads' || page === 'lead') ? 'active' : '')} onClick={() => navigate('leads')} type="button"><Icon name="users" /> <span>Leads</span></button>
          <button className={'nav-item ' + (page === 'assistant' ? 'active' : '')} onClick={() => openAssistant()} type="button"><Icon name="sparkles" /> <span>AI Assistant</span></button>
          <button className={'nav-item ' + (page === 'sales' ? 'active' : '')} onClick={() => navigate('sales')} type="button"><Icon name="checklist" /> <span>Sales workspace</span></button>
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
          <button className="sidebar-logout" type="button" onClick={onLogout}>Sign out</button>
          <div className="sidebar-footnote">PropIntel · Lead management</div>
        </div>
      </aside>
      {mobileSidebarOpen && <button className="sidebar-backdrop" type="button" onClick={() => setMobileSidebarOpen(false)} aria-label="Close navigation" />}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-leading">
            <button className="sidebar-toggle" type="button" onClick={toggleSidebar} aria-label="Toggle navigation" title="Toggle navigation"><Icon name="grid" size={17} /></button>
            <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{page === 'overview' ? 'Overview' : page === 'leads' ? 'Leads' : page === 'lead' ? 'Lead details' : page === 'assistant' ? 'AI Assistant' : 'Sales Action Workspace'}</strong></div>
          </div>
          <div className="topbar-actions">
            <span className="demo-tag"><span /> DEMO WORKSPACE</span>
            <button className="theme-toggle" onClick={toggleTheme} type="button" aria-label={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'} title="Toggle theme"><Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} /></button>
            <div className="profile-avatar" aria-label="Demo user">D</div>
          </div>
        </header>

        <div className="page-content">
          {notice && <div className="notice-banner" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice" type="button"><Icon name="close" size={15} /></button></div>}
          {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error" type="button"><Icon name="close" size={15} /></button></div>}

          {page === 'lead' && selectedLead ? (
            <LeadDetails lead={selectedLead} onClose={() => { setSelectedLead(null); setPage('leads'); }} onStatusChange={handleStatusChange} updating={updating} onAnalysisSaved={loadLeads} onOpenAssistant={openAssistant} />
          ) : page === 'assistant' ? (
            <AssistantWorkspace initialLeadId={assistantLeadId} onOpenLead={openLead} />
          ) : page === 'overview' ? (
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
                  <p>Capture customer requirements, review Gemini-powered lead analysis and use the lead-specific assistant to prepare the next sales action.</p>
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
          ) : page === 'leads' ? (
            <>
              <section className="lead-page-header">
                <div><div className="eyebrow">CUSTOMER PIPELINE</div><h1>Leads</h1><p className="page-subtitle">Manage enquiries, review AI priority and open any lead for its analysis and contextual assistant.</p></div>
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
                          <thead><tr><th>Customer</th><th>AI priority</th><th>Requirement</th><th>Budget</th><th>Timeline</th><th>Status</th><th>Added</th></tr></thead>
                          <tbody>
                            {leads.map((lead) => (
                              <tr key={lead.id}>
                                <td><button className="customer-link" onClick={() => openLead(lead.id)} type="button"><strong>{lead.name}</strong><small><Icon name="pin" size={12} /> {lead.location}</small></button></td>
                                <td>
                                  {lead.priority ? (
                                    <div className="lead-priority-cell" title="Priority is calculated from timeline, budget clarity, requirement clarity and engagement signals.">
                                      <span className={'priority-label priority-' + lead.priority}>{lead.priority.toUpperCase()}</span>
                                      <strong className="lead-score-value">{lead.lead_score}/100</strong>
                                    </div>
                                  ) : (
                                    <span className="priority-not-analysed">Not analysed</span>
                                  )}
                                </td>
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
          ) : <SalesWorkspace onOpenLead={openLead} />}

          <footer className="page-footer"><span>PropIntel · AI-powered real-estate sales workspace</span><span>Fictional demo company · Synthetic data only</span></footer>
        </div>
      </main>

      {formOpen && <LeadForm onClose={() => setFormOpen(false)} onSubmit={handleCreateLead} saving={saving} />}
    </div>
  );
}



function PublicEnquiryPage() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.budget_min && form.budget_max && Number(form.budget_min) > Number(form.budget_max)) {
      setError('Minimum budget cannot be greater than maximum budget.');
      return;
    }
    setSaving(true);
    try {
      const result = await submitPublicEnquiry({
        ...form,
        budget_min: form.budget_min === '' ? null : Number(form.budget_min),
        budget_max: form.budget_max === '' ? null : Number(form.budget_max)
      });
      setReference(result.reference);
      setForm(emptyForm);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="public-site">
      <header className="public-header">
        <a className="public-brand" href="/" aria-label="Northstar Homes home">
          <span className="brand-mark"><Icon name="building" size={20} /></span>
          <span><strong>Northstar Homes</strong><small>PROPERTY ENQUIRIES</small></span>
        </a>
        <a className="public-admin-link" href="/admin">Sales team sign in <Icon name="arrow" size={15} /></a>
      </header>
      <main className="public-main">
        <section className="public-hero">
          <span className="public-kicker">A MORE CONSIDERED WAY TO FIND HOME</span>
          <h1>Tell us what you’re looking for.</h1>
          <p>Share your location, budget and property requirements. Our sales team can review your enquiry and follow up with relevant information.</p>
          <div className="public-proof-row"><span><Icon name="check" size={14} /> Personal follow-up</span><span><Icon name="check" size={14} /> Your requirements, clearly captured</span></div>
        </section>
        {reference ? (
          <section className="public-success-card" role="status">
            <span className="public-success-icon"><Icon name="check" size={24} /></span>
            <span className="eyebrow">ENQUIRY RECEIVED</span>
            <h2>Thank you for getting in touch.</h2>
            <p>Your property enquiry has been submitted to the Northstar Homes demo team.</p>
            <div className="public-reference"><small>REFERENCE NUMBER</small><strong>#{reference}</strong></div>
            <button className="button-primary" type="button" onClick={() => setReference('')}>Submit another enquiry</button>
          </section>
        ) : (
          <section className="public-form-card">
            <div className="public-form-heading">
              <div><span className="eyebrow">PROPERTY ENQUIRY</span><h2>What does your next home look like?</h2><p>Fields marked with * are required.</p></div>
              <span className="public-form-step">01 <small>/ 01</small></span>
            </div>
            <form className="lead-form public-lead-form" onSubmit={submit}>
              <div className="form-grid">
                <label>Full name *
                  <input name="name" autoComplete="name" maxLength="120" value={form.name} onChange={updateField} required placeholder="Your full name" />
                </label>
                <label>Preferred location *
                  <input name="location" maxLength="160" value={form.location} onChange={updateField} required placeholder="e.g. Whitefield, Bengaluru" />
                </label>
                <label>Property requirement *
                  <input name="property_requirement" maxLength="160" value={form.property_requirement} onChange={updateField} required placeholder="e.g. 3BHK apartment" />
                </label>
                <label>Buying timeline *
                  <select name="buying_timeline" value={form.buying_timeline} onChange={updateField} required>
                    <option>Immediately</option><option>Within 2 months</option><option>3 to 6 months</option><option>More than 6 months</option><option>Just exploring</option><option>Not specified</option>
                  </select>
                </label>
                <label>Minimum budget (₹)
                  <input name="budget_min" type="number" min="0" step="1" value={form.budget_min} onChange={updateField} placeholder="e.g. 9000000" />
                </label>
                <label>Maximum budget (₹)
                  <input name="budget_max" type="number" min="0" step="1" value={form.budget_max} onChange={updateField} placeholder="e.g. 12000000" />
                </label>
                <label className="form-full">Tell us more *
                  <textarea name="customer_message" maxLength="5000" value={form.customer_message} onChange={updateField} required rows="4" placeholder="Describe your preferences, requirements or questions…" />
                  <small>{form.customer_message.length}/5000 characters</small>
                </label>
              </div>
              {error && <div className="inline-error" role="alert">{error}</div>}
              <div className="public-form-footer">
                <p>Your information is used only to respond to this enquiry in this demo.</p>
                <button className="button-primary" type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit enquiry'} <Icon name="arrow" size={15} /></button>
              </div>
            </form>
          </section>
        )}
        <section className="public-how">
          <div><span className="public-step-number">1</span><strong>Share your requirements</strong><p>Tell us your preferred area, budget and timeline.</p></div>
          <div><span className="public-step-number">2</span><strong>Our team reviews your enquiry</strong><p>The sales team can assess the details and prepare a follow-up.</p></div>
          <div><span className="public-step-number">3</span><strong>Continue the conversation</strong><p>A team member can contact you to clarify your needs.</p></div>
        </section>
        <p className="public-demo-note">Northstar Homes is a fictional demonstration company. This page does not represent live property inventory or a real estate booking service.</p>
      </main>
      <footer className="public-footer"><span>© Northstar Homes · PropIntel demo</span><span>Enquiry management powered by PropIntel</span></footer>
    </div>
  );
}

function AdminLogin({ configured, initialError = '', onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(initialError);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onLogin({ username, password });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <a className="auth-brand" href="/"><span className="brand-mark"><Icon name="building" size={20} /></span><span><strong>PropIntel</strong><small>NORTHSTAR HOMES · ADMIN</small></span></a>
      <main className="auth-card">
        <div className="auth-icon"><Icon name="building" size={22} /></div>
        <span className="eyebrow">RESTRICTED WORKSPACE</span>
        <h1>Sign in to PropIntel</h1>
        <p>Access lead records, AI analysis and sales follow-ups.</p>
        {!configured && <div className="auth-config-message">Admin sign-in is not configured. Add <strong>ADMIN_USERNAME</strong>, <strong>ADMIN_PASSWORD</strong> (12+ characters) and <strong>SESSION_SECRET</strong> (32+ random characters) to <code>server/.env</code>, then restart the API.</div>}
        <form onSubmit={submit} className="auth-form">
          <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required disabled={!configured} /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required disabled={!configured} /></label>
          {error && <div className="inline-error" role="alert">{error}</div>}
          <button className="button-primary" type="submit" disabled={!configured || submitting || !username.trim() || !password}>{submitting ? 'Signing in…' : 'Sign in'} <Icon name="arrow" size={15} /></button>
        </form>
        <a className="auth-back-link" href="/">Return to customer enquiry page</a>
      </main>
      <p className="auth-demo-note">Single administrator account · Fictional demo workspace</p>
    </div>
  );
}

function AdminGate() {
  const [session, setSession] = useState({ status: 'checking', authenticated: false, configured: false });
  const [initialError, setInitialError] = useState('');

  useEffect(() => {
    let active = true;
    checkAdminSession()
      .then((result) => { if (active) setSession({ status: 'ready', ...result }); })
      .catch((error) => {
        if (active) {
          setInitialError(error.message);
          setSession({ status: 'ready', authenticated: false, configured: false });
        }
      });
    return () => { active = false; };
  }, []);

  async function handleLogin(credentials) {
    const result = await loginAdmin(credentials);
    setSession({ status: 'ready', ...result, configured: true });
  }

  async function handleLogout() {
    try { await logoutAdmin(); }
    finally { window.history.replaceState({}, '', '/'); setSession({ status: 'ready', authenticated: false, configured: true }); }
  }

  if (session.status === 'checking') return <div className="auth-loading"><span className="loader" /> Checking administrator session…</div>;
  if (!session.authenticated) return <AdminLogin configured={session.configured} initialError={initialError} onLogin={handleLogin} />;
  return <AdminWorkspace onLogout={handleLogout} />;
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path === '/admin' || path.startsWith('/admin/')
    ? <AdminGate />
    : <PublicEnquiryPage />;
}
