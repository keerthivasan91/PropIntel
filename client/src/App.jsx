import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

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
    arrowUpRight: <><path d="M7 17 17 7M7 7h10v10" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    building: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    circle: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2" /></>
  };

  return <svg {...common}>{paths[name] ?? paths.circle}</svg>;
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('propintel-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
  return 'light';
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('propintel-theme', theme);
    } catch {
      // The theme still works for the current session.
    }
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();

    async function checkApi() {
      try {
        const response = await fetch(API_BASE_URL + '/api/health', {
          signal: controller.signal
        });
        if (!response.ok) throw new Error('API health check failed');
        const result = await response.json();
        setApiStatus(result.status === 'ok' ? 'connected' : 'unavailable');
      } catch (error) {
        if (error.name !== 'AbortError') setApiStatus('unavailable');
      }
    }

    checkApi();
    return () => controller.abort();
  }, []);

  const toggleTheme = () => {
    setTheme((current) => current === 'light' ? 'dark' : 'light');
  };

  const statusLabel = apiStatus === 'checking'
    ? 'Checking'
    : apiStatus === 'connected'
      ? 'Online'
      : 'Offline';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="PropIntel home">
          <span className="brand-mark"><Icon name="building" size={20} /></span>
          <span className="brand-copy">
            <strong>PropIntel</strong>
            <small>SALES INTELLIGENCE</small>
          </span>
        </a>

        <div className="workspace-switcher">
          <span className="workspace-avatar">N</span>
          <span className="workspace-copy">
            <strong>Northstar Homes</strong>
            <small>Demo workspace</small>
          </span>
          <span className="workspace-chevron">⌄</span>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Main navigation">
          <a className="nav-item active" href="#overview" aria-current="page">
            <Icon name="grid" /> <span>Overview</span>
          </a>
          <div className="nav-item disabled" title="Planned for the next milestone">
            <Icon name="users" /> <span>Leads</span><small>SOON</small>
          </div>
          <div className="nav-item disabled" title="Planned for the next milestone">
            <Icon name="checklist" /> <span>Sales workspace</span><small>SOON</small>
          </div>
          <div className="nav-item disabled" title="Planned for the next milestone">
            <Icon name="sparkles" /> <span>AI assistant</span><small>SOON</small>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="environment-card">
            <span className="environment-icon"><Icon name="building" size={17} /></span>
            <div>
              <strong>Demo environment</strong>
              <p>Sample data only</p>
            </div>
          </div>
          <div className="connection-row">
            <span className={'connection-dot ' + apiStatus} />
            <span>{apiStatus === 'checking' ? 'Checking API…' : apiStatus === 'connected' ? 'API connected' : 'API unavailable'}</span>
          </div>
          <div className="sidebar-footnote">PropIntel · Initial foundation</div>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>Overview</strong></div>
          <div className="topbar-actions">
            <span className="demo-tag"><span /> DEMO WORKSPACE</span>
            <button className="theme-toggle" onClick={toggleTheme} type="button" aria-label={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'} title="Toggle theme">
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} />
            </button>
            <div className="profile-avatar" aria-label="Demo user">D</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">YOUR SALES WORKSPACE</div>
              <h1>A clearer view of every opportunity.</h1>
              <p className="page-subtitle">Bring lead context, AI insights and follow-up actions into one place.</p>
            </div>
            <div className="date-chip"><Icon name="circle" size={15} /> Project foundation</div>
          </section>

          <section className="intro-panel">
            <div className="intro-copy">
              <div className="intro-kicker"><Icon name="sparkles" size={15} /> BUILT FOR REAL ESTATE SALES TEAMS</div>
              <h2>Turn customer enquiries into meaningful next steps.</h2>
              <p>PropIntel is being built around a simple workflow: understand the customer, prioritize the opportunity and make the next action clear.</p>
              <div className="intro-note"><span className="note-check"><Icon name="check" size={13} /></span> Human decisions stay in control. AI recommendations are suggestions, not commitments.</div>
            </div>
            <div className="intro-illustration" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="illustration-card">
                <span className="illustration-icon"><Icon name="building" size={27} /></span>
                <span className="illustration-lines"><i /><i /><i /></span>
                <span className="illustration-badge"><Icon name="sparkles" size={13} /> AI-ready workflow</span>
              </div>
              <span className="floating-dot dot-one" />
              <span className="floating-dot dot-two" />
            </div>
          </section>

          <section className="section-heading">
            <div>
              <h2>Workspace at a glance</h2>
              <p>Live metrics will appear as lead and task workflows are implemented.</p>
            </div>
            <span className="module-status">FOUNDATION STAGE</span>
          </section>

          <section className="metric-grid" aria-label="Workspace metrics">
            <article className="metric-card">
              <div className="metric-top"><span className="metric-icon blue"><Icon name="users" /></span><span className="metric-label">LEADS</span></div>
              <div className="metric-value">—</div>
              <div className="metric-foot">Lead management is next</div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-icon violet"><Icon name="sparkles" /></span><span className="metric-label">AI ANALYSES</span></div>
              <div className="metric-value">—</div>
              <div className="metric-foot">Gemini integration is planned</div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-icon amber"><Icon name="checklist" /></span><span className="metric-label">OPEN TASKS</span></div>
              <div className="metric-value">—</div>
              <div className="metric-foot">Sales workspace is planned</div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-icon green"><Icon name="circle" /></span><span className="metric-label">API STATUS</span></div>
              <div className="metric-value metric-value-status">{statusLabel}</div>
              <div className="metric-foot">{apiStatus === 'connected' ? 'Express health check passed' : 'Connect the local backend to verify'}</div>
            </article>
          </section>

          <section className="bottom-grid">
            <article className="content-card next-card">
              <div className="card-heading">
                <div><h2>Coming into focus</h2><p>What the next milestones will add</p></div>
                <span className="subtle-icon"><Icon name="arrowUpRight" /></span>
              </div>
              <div className="roadmap-row">
                <span className="roadmap-number">01</span>
                <span className="roadmap-copy"><strong>Lead intelligence</strong><small>Capture, understand and prioritize enquiries.</small></span>
                <span className="roadmap-state">NEXT</span>
              </div>
              <div className="roadmap-row">
                <span className="roadmap-number">02</span>
                <span className="roadmap-copy"><strong>Context-aware AI</strong><small>Use company policy, lead details and chat history.</small></span>
                <span className="roadmap-state">PLANNED</span>
              </div>
              <div className="roadmap-row">
                <span className="roadmap-number">03</span>
                <span className="roadmap-copy"><strong>Sales Action Workspace</strong><small>Track follow-ups and customer activity.</small></span>
                <span className="roadmap-state">PLANNED</span>
              </div>
            </article>

            <article className="content-card principle-card">
              <div className="principle-icon"><Icon name="checklist" size={21} /></div>
              <div className="principle-label">PRODUCT PRINCIPLE</div>
              <h2>Useful AI. Visible reasoning. Human control.</h2>
              <p>Recommendations should be grounded in the information available. Unknown details stay unknown, and salespeople decide what action to take.</p>
              <div className="principle-footer"><span className="principle-line" /><span>PROPINTEL DESIGN STANDARD</span></div>
            </article>
          </section>

          <footer className="page-footer">
            <span>PropIntel · AI-powered real-estate sales workspace</span>
            <span>Fictional demo company · Not affiliated with Northstar Homes</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
