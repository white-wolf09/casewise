import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Calendar, AlertTriangle, Check, Sparkles, ChevronRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { Card, CardHeader, Tag, Avatar, Bar, Loading, STATUS_TONE } from '../components/ui.jsx';

const TONE = { green: ['var(--g100)', 'var(--g700)'], red: ['var(--redbg)', 'var(--red)'], amber: ['var(--amberbg)', 'var(--amber)'] };

function greeting(firstName) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${firstName}.`;
}

export default function Overview() {
  const { user } = useAuth();
  const { version } = useData();
  const [data, setData] = useState(null);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => { api.dashboard().then(setData).catch(() => setData({ stats: null })); }, [version]);
  if (!data) return <Loading />;
  if (!data.stats) return <div className="empty">Could not load the dashboard. Refresh the page.</div>;

  const s = data.stats;
  const stats = [
    { label: 'Active cases', value: s.activeCases, note: `${s.activeAdded} added this week`, Icon: Briefcase, tone: 'green', to: '/cases' },
    { label: 'Deadlines this week', value: s.deadlinesWeek, note: `${s.dueIn48h} due in 48 hours`, Icon: Calendar, tone: 'red', to: '/cases' },
    { label: 'Open flags', value: s.openFlags, note: `${s.critical} critical · ${s.important} important`, Icon: AlertTriangle, tone: 'amber', to: '/cases' },
    { label: 'Pending review', value: s.pendingReview, note: `${s.returned} returned to you`, Icon: Check, tone: 'green', to: '/review' },
  ];

  return (
    <>
      <div className="eyebrow">{today}</div>
      <h1 style={{ marginTop: 8 }}>{greeting(user.name.split(' ')[0])}</h1>
      <p className="sub">Here's what needs your attention across your caseload.</p>

      <div className="grid g4" style={{ marginTop: 24 }}>
        {stats.map(({ label, value, note, Icon, tone, to }) => (
          <Link key={label} to={to} className="card stat">
            <div className="sl">
              <span className="ico" style={{ background: TONE[tone][0], color: TONE[tone][1] }}><Icon size={16} /></span>
              {label}
              <ChevronRight size={16} className="muted" style={{ marginLeft: 'auto' }} />
            </div>
            <div className="sv">{value}</div>
            <div className="sm">{note}</div>
          </Link>
        ))}
      </div>

      <div className="two" style={{ marginTop: 20 }}>
        <Card>
          <CardHeader
            title="Priority cases"
            sub="Deadlines, critical flags, and recent activity."
            action={<Link className="link" to="/cases">View all cases →</Link>}
          />
          {data.cases.map((c) => (
            <Link key={c.caseId} to={`/cases/${c.caseId}`} className="row" style={{ gridTemplateColumns: '2fr 1.1fr 1.4fr 1fr 16px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                <Avatar ini={c.ini} tone={c.tone} />
                <div>
                  <div style={{ fontWeight: 600 }}>{c.clientName}</div>
                  <div className="sm">{c.caseId} · {c.type}</div>
                </div>
              </div>
              <div>
                <div className="sm">Next deadline</div>
                <div style={{ fontWeight: 600 }} className={c.status === 'Urgent' ? 'red' : ''}>{c.deadline}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Bar value={c.health} />
                <span style={{ fontSize: 12, fontWeight: 600, width: 36 }}>{c.health}%</span>
              </div>
              <div><Tag tone={STATUS_TONE[c.status]}>{c.status}</Tag></div>
              <ChevronRight size={16} className="muted" />
            </Link>
          ))}
        </Card>

        <div className="col">
          <Card>
            <CardHeader title="Upcoming deadlines" sub="Next 7 days" />
            {data.deadlines.map((d) => (
              <div key={d.id} className="row" style={{ gridTemplateColumns: '46px 1fr auto' }}>
                <div className="dd"><b>{d.day}</b><span>{d.month}</span></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{d.title}</div>
                  <div className="sm">{d.subtitle}</div>
                </div>
                {d.tag && <Tag tone={d.tone}>{d.tag}</Tag>}
              </div>
            ))}
          </Card>

          <Card className="assist">
            <div className="ai"><Sparkles size={18} /></div>
            <div className="eyebrow" style={{ color: 'var(--g700)' }}>Casewise Assist</div>
            <h3 style={{ margin: '6px 0 4px' }}>Ask across your cases</h3>
            <div className="sm">Find facts and evidence without opening every file.</div>
            <Link className="link" to="/cases" style={{ display: 'inline-block', marginTop: 12 }}>Start an evidence search →</Link>
          </Card>
        </div>
      </div>
    </>
  );
}
