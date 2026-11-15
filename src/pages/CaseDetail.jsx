import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Upload, MoreHorizontal, Eye, AlertTriangle, FileText, Check, Check as Tick } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { UploadModal, AskModal } from '../components/CaseModals.jsx';
import { Card, CardHeader, Avatar, Empty, Loading, who } from '../components/ui.jsx';

export default function CaseDetail() {
  const { caseId } = useParams();
  const { user } = useAuth();
  const { version, bump, toast } = useData();
  const [c, setC] = useState(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(null); // 'upload' | 'ask' | null
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setC(null); setMissing(false); setTab('overview'); setMenu(false);
    api.caseDetail(caseId).then(setC).catch(() => setMissing(true));
  }, [caseId]);

  useEffect(() => {
    api.caseDetail(caseId).then(setC).catch(() => {});
  }, [version]);

  if (missing) {
    return (
      <Card><div className="empty" style={{ padding: 40, textAlign: 'center' }}>
        Case not found. <Link className="link" to="/cases">Back to all cases</Link>
      </div></Card>
    );
  }
  if (!c) return <Loading />;

  const act = async (fn, msg) => {
    try { await fn(); bump(); if (msg) toast(msg); }
    catch (err) { toast(err.errors ? Object.values(err.errors)[0] : 'Something went wrong. Try again.'); }
  };
  const resolve = (f) => act(() => api.resolveFlag(c.caseId, f.id), 'Flag marked resolved');
  const toggle = (item) => act(() => api.toggleChecklist(c.caseId, item.label), item.done ? 'Marked as missing' : 'Marked as complete');
  const copyId = () => {
    navigator.clipboard?.writeText(c.caseId).then(() => toast('Case ID copied')).catch(() => toast(c.caseId));
    setMenu(false);
  };

  const hasDetail = c.documents.length > 0 || c.flags.length > 0 || c.checklist.length > 0;
  const done = c.checklist.filter((x) => x.done).length;
  const pct = c.checklist.length ? Math.round((done / c.checklist.length) * 100) : 0;

  const flagsList = c.flags.map((f) => (
    <div key={f.id} className={`flag flag-${f.kind}`}>
      <div style={{ marginTop: 2 }}>{f.kind === 'crit' ? <AlertTriangle size={16} color="var(--red)" /> : <FileText size={16} />}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className={`tag tag-${f.kind === 'crit' ? 'red' : 'amber'}`}>{f.label}</span>
        <div style={{ fontWeight: 600, margin: '8px 0 3px' }}>{f.title}</div>
        <div style={{ fontSize: 12.5, color: '#4f5b56' }}>{f.body}</div>
        <button className="btn" onClick={() => resolve(f)}><Check size={13} /> Mark resolved</button>
      </div>
    </div>
  ));

  const docsList = c.documents.length ? c.documents.map((d) => (
    <div key={d.name + d.date} className="drow">
      <FileText size={16} className="muted" />
      <div><div style={{ fontWeight: 600 }}>{d.name}</div><div className="sm">{d.meta}</div></div>
      <span className="sm">{d.date}</span>
      <Eye size={16} className="muted" />
    </div>
  )) : <Empty>No documents uploaded yet. Use Upload to add files.</Empty>;

  const factsGrid = c.facts.length ? (
    <div className="facts">
      {c.facts.map((f) => (
        <div key={f.label + f.value}>
          <span className="lbl">{f.label}</span>
          <b style={{ fontSize: 13.5 }}>{f.value}</b>
          <span className="sm">{f.source}</span>
        </div>
      ))}
    </div>
  ) : <Empty>Facts appear after documents are processed.</Empty>;

  const checklist = c.checklist.length ? (
    <Card>
      <CardHeader title="Checklist" sub={`${done} of ${c.checklist.length} complete`} action={<b style={{ fontSize: 18 }}>{pct}%</b>} />
      <div style={{ padding: '0 18px' }}><div className="bar" style={{ width: '100%' }}><i style={{ width: `${pct}%` }} /></div></div>
      <div style={{ padding: '8px 18px 14px' }}>
        {c.checklist.map((x) => (
          <button key={x.label} className="cl-btn" onClick={() => toggle(x)} aria-pressed={x.done}>
            <span className={`ck ${x.done ? 'on' : ''}`}>{x.done && <Tick size={11} strokeWidth={2.4} />}</span>
            <span style={{ flex: 1 }}>{x.label}</span>
            {!x.done && <span className="tag tag-red" style={{ fontSize: 10 }}>Missing</span>}
          </button>
        ))}
      </div>
    </Card>
  ) : null;

  let content;
  if (tab === 'overview') {
    content = (
      <div className="two">
        <div className="col">
          <Card>
            <CardHeader title="Needs attention" sub="Issues that may affect this case."
              action={<button className="link" onClick={() => setTab('flags')}>View all {c.flags.length} flags</button>} />
            {c.flags.length ? <div style={{ paddingTop: 4 }}>{flagsList}</div> : <Empty>No open flags.</Empty>}
          </Card>
          <Card>
            <CardHeader title="Case facts" sub="Auto-extracted facts with source-level provenance." />
            {factsGrid}
          </Card>
        </div>
        <div className="col">
          {checklist}
          <Card>
            <CardHeader title="Documents" sub={`${c.documents.length} file${c.documents.length === 1 ? '' : 's'}`}
              action={<button className="link" onClick={() => setTab('docs')}>View all</button>} />
            {docsList}
          </Card>
        </div>
      </div>
    );
  } else if (tab === 'docs') {
    content = <Card><CardHeader title="Documents" sub="Source files for this case" />{docsList}</Card>;
  } else if (tab === 'facts') {
    content = (
      <div className="col">
        <Card><CardHeader title="Case facts" />{factsGrid}</Card>
        <Card>
          <CardHeader title="Recent timeline" sub="Newest first" />
          {c.timeline.length ? (
            <div className="tl">{c.timeline.map((t, i) => (
              <div key={i} style={{ display: 'contents' }}><div>{t.date}</div><div>{t.text}</div></div>
            ))}</div>
          ) : <Empty>No timeline yet.</Empty>}
        </Card>
      </div>
    );
  } else if (tab === 'flags') {
    content = <Card><CardHeader title="Flags" sub="Issues that may affect this case." />{c.flags.length ? flagsList : <Empty>No open flags.</Empty>}</Card>;
  } else {
    content = <Card><CardHeader title="Drafts" sub="Outputs prepared for attorney review" /><Empty>No drafts yet. Use Ask evidence to find what you need for one.</Empty></Card>;
  }

  const tabs = [
    ['overview', 'Overview'],
    ['docs', 'Documents'],
    ['facts', 'Facts & timeline'],
    ['flags', `Flags${c.flags.length ? ` (${c.flags.length})` : ''}`],
    ['drafts', 'Drafts'],
  ];

  return (
    <>
      {modal === 'upload' && <UploadModal caseId={c.caseId} onClose={() => setModal(null)} />}
      {modal === 'ask' && <AskModal caseId={c.caseId} onClose={() => setModal(null)} />}

      <Link to="/cases" className="back"><ArrowLeft size={14} /> All cases</Link>

      <div className="dh">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Avatar ini={c.ini} tone={c.tone} />
          <div>
            <div className="eyebrow">{c.caseId} · {c.type.toUpperCase()}</div>
            <h1 style={{ fontSize: 26, marginTop: 4 }}>{c.clientName}</h1>
            <div className="sm" style={{ marginTop: 4 }}>
              {hasDetail ? `Opened ${c.meta.opened}` : 'Opened recently'} · Assigned to {who(c.assignee, user)}
            </div>
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setModal('ask')}><Sparkles size={15} /> Ask evidence</button>
          <button className="btn btn-primary" onClick={() => setModal('upload')}><Upload size={15} /> Upload</button>
          <div className="more">
            <button className="btn" aria-label="More actions" onClick={() => setMenu((m) => !m)}><MoreHorizontal size={16} /></button>
            {menu && (
              <div className="dropdown">
                <button onClick={copyId}><b>Copy case ID</b></button>
                <button onClick={() => { setMenu(false); setTab('facts'); }}><b>View timeline</b></button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="meta">
        <div><span>Primary worker</span><b>{who(c.assignee, user)}</b></div>
        <div><span>Supervisor</span><b>{c.meta.supervisor}</b></div>
        <div><span>Next deadline</span><b className={c.meta.nextDeadline.includes('Tomorrow') ? 'red' : ''}>{c.meta.nextDeadline}</b></div>
        <div><span>Case health</span><b className={c.health < 80 ? 'amb' : ''}>{c.health}%{c.health < 80 ? ' · Needs attention' : ''}</b></div>
      </div>

      <div className="tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {content}
    </>
  );
}
