import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Inbox, BarChart3, Search, Bell, Plus, LogOut, Shield, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { api } from '../services/api.js';

const NAV = [
  ['/overview', 'Overview', Home],
  ['/cases', 'Cases', Briefcase],
  ['/review', 'Review queue', Inbox],
  ['/reports', 'Reports', BarChart3],
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { version, toast } = useData();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [pending, setPending] = useState(0);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [notes, setNotes] = useState(null);

  useEffect(() => {
    api.reviews().then((r) => setPending(r.length)).catch(() => {});
  }, [version]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    let live = true;
    api.search(q).then((r) => live && setResults(r)).catch(() => live && setResults([]));
    return () => { live = false; };
  }, [q, version]);

  useEffect(() => {
    if (!bellOpen) return;
    api.notifications().then(setNotes).catch(() => setNotes({ reviews: 0, deadlines: [] }));
  }, [bellOpen, version]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openCase = (id) => { setQ(''); setResults([]); navigate(`/cases/${id}`); };
  const caseIdIn = (text) => (text.match(/LA-\d{4}/) || [])[0];
  const initials = user.name.split(' ').map((s) => s[0]).join('');

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><div className="logo"><Shield size={18} /></div>Case<span>wise</span></div>

        <nav className="nav">
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to}>
              <Icon size={16} />
              {label}
              {to === '/review' && pending > 0 && <span className="badge">{pending}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="priv">
          <b><Lock size={13} /> Private by design</b>
          Client data never trains external models.
        </div>

        <div className="me">
          <div className="av av-green">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{user.name}</b>
            <div className="sm">{user.role}</div>
          </div>
          <button title="Sign out" onClick={() => { logout(); navigate('/login'); }}><LogOut size={16} /></button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="search">
            <Search size={16} />
            <input
              ref={inputRef}
              value={q}
              maxLength={100}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setQ(''); if (e.key === 'Enter' && results[0]) openCase(results[0].caseId); }}
              placeholder="Search cases, clients, documents…"
              aria-label="Search cases"
            />
            {q.trim() && (
              <div className="dropdown">
                {results.length
                  ? results.map((c) => (
                      <button key={c.caseId} onClick={() => openCase(c.caseId)}>
                        <b>{c.clientName}</b><span>{c.caseId} · {c.type}</span>
                      </button>
                    ))
                  : <div className="dd-empty">No cases match “{q}”.</div>}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button className="ib" aria-label="Notifications" onClick={() => setBellOpen((o) => !o)}>
              <Bell size={16} />
              {pending > 0 && <i className="dot" />}
            </button>
            {bellOpen && (
              <div className="dropdown right">
                {!notes ? <div className="dd-empty">Loading…</div> : (
                  <>
                    <div className="dd-head">Notifications</div>
                    {notes.reviews > 0 && (
                      <button onClick={() => { setBellOpen(false); navigate('/review'); }}>
                        <b>{notes.reviews} output{notes.reviews > 1 ? 's' : ''} awaiting review</b><span>Open review queue</span>
                      </button>
                    )}
                    {notes.deadlines.map((d) => (
                      <button key={d.id} onClick={() => { setBellOpen(false); const id = caseIdIn(d.subtitle); if (id) navigate(`/cases/${id}`); }}>
                        <b>{d.title}</b><span>{d.subtitle} · {d.tag || `${d.day} ${d.month}`}</span>
                      </button>
                    ))}
                    {notes.reviews === 0 && notes.deadlines.length === 0 && <div className="dd-empty">You're all caught up.</div>}
                  </>
                )}
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => navigate('/cases?new=1')}>
            <Plus size={16} /> New case
          </button>
        </header>
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
