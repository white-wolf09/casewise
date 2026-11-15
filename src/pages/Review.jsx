import { useEffect, useState } from 'react';
import { Check, X, Eye, AlertTriangle, Shield, ChevronRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useData } from '../context/DataContext.jsx';
import { Card, Empty, Loading } from '../components/ui.jsx';

export default function Review() {
  const { version, bump, toast } = useData();
  const [items, setItems] = useState(null);
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.reviews().then((list) => {
      setItems(list);
      setIndex((i) => Math.min(i, Math.max(0, list.length - 1)));
    }).catch(() => setItems([]));
  }, [version]);

  const q = items && items.length ? items[Math.min(index, items.length - 1)] : null;

  useEffect(() => {
    setFull(null);
    setNote('');
    if (q) api.reviewDetail(q.id).then(setFull).catch(() => setFull(null));
  }, [q?.id, version]);

  const header = (
    <div className="ph">
      <div>
        <h1>Review queue</h1>
        <p className="sub">High-impact outputs awaiting attorney oversight.</p>
      </div>
      {items && <span className="tag tag-amber">{items.length} pending</span>}
    </div>
  );

  if (!items) return <>{header}<Loading /></>;
  if (!items.length) return <>{header}<Card><Empty>All caught up. No outputs are waiting for review.</Empty></Card></>;

  const decide = async (decision) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.decideReview(q.id, decision, note);
      toast(decision === 'approve' ? 'Approved and filed to the case' : 'Returned to the preparer');
      bump();
    } catch (err) {
      toast(err.errors ? Object.values(err.errors)[0] : 'Could not save the decision. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {header}
      <div className="rv">
        <Card style={{ overflow: 'hidden' }}>
          {items.map((item, i) => (
            <button key={item.id} className={`qi ${i === index ? 'on' : ''}`} onClick={() => setIndex(i)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={`pri ${item.priority.startsWith('Critical') ? 'red' : 'amb'}`}>{item.priority.toUpperCase()}</div>
                <div className="qt">{item.title}</div>
                <div className="sm">{item.who} · Submitted {item.submitted}</div>
              </div>
              <ChevronRight size={16} className="muted" />
            </button>
          ))}
        </Card>

        <Card className="rd">
          <div className="eyebrow">Deadline proposal</div>
          <div className="rt">
            <h2>{q.title}</h2>
            <span className="tag tag-amber">Pending review</span>
          </div>
          <div className="sm">{q.who} · {q.caseId}</div>

          {full ? (
            <>
              <div className="prop">
                <div className="eyebrow">Proposed deadline</div>
                <div className="pd">{full.date}</div>
                <div className="sm">{full.note}</div>
              </div>
              <div className="eyebrow" style={{ margin: '20px 0 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <Shield size={14} /> Supporting evidence
              </div>
              {full.evidence.map(([source, quote], i) => (
                <div key={source} className="evr">
                  <span className="n">{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{source}</div>
                    <div className="sm">{quote}</div>
                  </div>
                  <Eye size={16} className="muted" />
                </div>
              ))}
              {full.conflict && (
                <div className="conf">
                  <AlertTriangle size={16} />
                  <div>
                    <b style={{ fontSize: 13 }}>Open critical conflict</b>
                    <div className="sm" style={{ color: 'var(--amber)' }}>{full.conflict}</div>
                  </div>
                </div>
              )}
            </>
          ) : <Loading />}

          <label className="lab" style={{ marginTop: 20 }}>Reviewer note <span className="sm">(required to return)</span></label>
          <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note or reason for your decision…" />

          <div className="acts2">
            <button className="btn btn-danger" disabled={busy} onClick={() => decide('return')}><X size={15} /> Return</button>
            <button className="btn btn-primary" disabled={busy} onClick={() => decide('approve')}><Check size={15} /> Approve</button>
          </div>
        </Card>
      </div>
    </>
  );
}
