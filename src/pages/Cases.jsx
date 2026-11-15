import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Calendar, AlertTriangle, ChevronRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import NewCaseModal from '../components/NewCaseModal.jsx';
import { Card, Tag, Avatar, Bar, Loading, STATUS_TONE, who } from '../components/ui.jsx';

const COLS = '2.6fr 1fr 1.1fr 1.5fr 1fr 1.1fr 16px';
const STATUSES = ['All', 'Urgent', 'Active', 'Review'];

export default function Cases() {
  const { user } = useAuth();
  const { version, bump, toast } = useData();
  const [params, setParams] = useSearchParams();
  const [cases, setCases] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [open, setOpen] = useState(false);

  useEffect(() => { api.cases().then(setCases).catch(() => setCases([])); }, [version]);
  useEffect(() => { if (params.get('new') === '1') setOpen(true); }, [params]);

  const closeModal = () => { setOpen(false); if (params.get('new')) setParams({}); };
  const term = query.trim().toLowerCase();
  const shown = (cases || []).filter((c) =>
    (status === 'All' || c.status === status) &&
    `${c.clientName} ${c.caseId} ${c.type} ${who(c.assignee, user)}`.toLowerCase().includes(term)
  );

  return (
    <>
      <div className="ph">
        <div>
          <h1>Cases</h1>
          <p className="sub">Manage assignments, monitor health, and keep every matter moving.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Create case</button>
      </div>

      <Card>
        <div className="tools">
          <div className="search">
            <Search size={16} />
            <input placeholder="Search by client, case ID, type, or assignee" value={query} maxLength={100} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto', minWidth: 170 }} aria-label="Filter by status">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>)}
          </select>
        </div>

        <div className="hrow" style={{ gridTemplateColumns: COLS }}>
          <div>Client / case</div><div>Assignee</div><div>Next deadline</div><div>Health</div><div>Flags</div><div>Status</div><div />
        </div>

        {!cases ? <Loading /> : shown.length ? shown.map((c) => (
          <Link key={c.caseId} to={`/cases/${c.caseId}`} className="row" style={{ gridTemplateColumns: COLS }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
              <Avatar ini={c.ini} tone={c.tone} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{c.clientName}</div>
                <div className="sm">{c.caseId} · {c.type}</div>
              </div>
            </div>
            <div>{who(c.assignee, user)}</div>
            <div className="dl"><Calendar size={14} />{c.deadline}</div>
            <div className="hl"><Bar value={c.health} /><span>{c.health}%</span></div>
            <div className={c.openFlags ? 'red' : 'muted'} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {c.openFlags ? <><AlertTriangle size={14} />{c.openFlags} open</> : 'None'}
            </div>
            <div><Tag tone={STATUS_TONE[c.status]}>{c.status}</Tag></div>
            <ChevronRight size={16} className="muted" />
          </Link>
        )) : <div className="empty">No cases match these filters.</div>}

        {cases && <div className="foot sm">Showing {shown.length} of {cases.length} cases</div>}
      </Card>

      {open && (
        <NewCaseModal
          onClose={closeModal}
          onCreated={(c) => { closeModal(); bump(); toast(`Case ${c.caseId} created`); }}
        />
      )}
    </>
  );
}
