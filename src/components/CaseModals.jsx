import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { api } from '../services/api.js';
import { useData } from '../context/DataContext.jsx';

const fmt = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function Shell({ eyebrow, title, sub, onClose, children, footer }) {
  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="mh">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h2 style={{ marginTop: 6 }}>{title}</h2>
            <p className="sm" style={{ marginTop: 4 }}>{sub}</p>
          </div>
          <button className="btn-ghost" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="mb">{children}</div>
        <div className="mf">{footer}</div>
      </div>
    </div>
  );
}

export function UploadModal({ caseId, onClose }) {
  const { bump, toast } = useData();
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const toBase64 = (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result || '';
            const b64 = typeof res === 'string' && res.includes(',') ? res.split(',')[1] : '';
            resolve(b64);
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });

      const filePayloads = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          size: f.size,
          base64: await toBase64(f),
        }))
      );

      const res = await api.uploadDocuments(caseId, filePayloads);
      bump();
      toast(`${res.added} file${res.added > 1 ? 's' : ''} uploaded`);
      onClose();
    } catch (err) {
      setError(err.errors ? Object.values(err.errors)[0] : 'Upload failed. Try again.');
      setBusy(false);
    }
  };

  return (
    <Shell eyebrow="Documents" title="Upload documents" sub="Files are indexed and linked to their source for every fact." onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!files.length || busy} onClick={submit}>{busy ? 'Uploading…' : 'Upload'}</button>
      </>}>
      <label className="drop">
        <Upload size={26} />
        <b style={{ color: 'var(--ink)' }}>Choose files</b>
        <span className="sm">PDF, DOCX, XLSX, JPG or PNG · up to 25 MB each</span>
        <input type="file" multiple accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" hidden
          onChange={(e) => { setError(''); setFiles(Array.from(e.target.files)); }} />
      </label>
      {files.length > 0 && (
        <ul className="fl">
          {files.map((f) => (
            <li key={f.name + f.size}><FileText size={15} />{f.name}<span className="sm" style={{ marginLeft: 'auto' }}>{fmt(f.size)}</span></li>
          ))}
        </ul>
      )}
      {error && <div className="err">{error}</div>}
    </Shell>
  );
}

export function AskModal({ caseId, onClose }) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const ask = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      setResult(await api.askEvidence(caseId, question));
    } catch (err) {
      setResult(null);
      setError(err.errors ? Object.values(err.errors)[0] : 'Could not search this case.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell eyebrow="Casewise Assist" title="Ask evidence" sub="Search facts and documents in this case without opening every file." onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn btn-primary" form="ask-form" disabled={busy}>{busy ? 'Searching…' : 'Search'}</button>
      </>}>
      <form id="ask-form" onSubmit={ask} noValidate>
        <textarea rows={2} maxLength={300} placeholder="For example: What is the monthly rent?" value={question} onChange={(e) => setQuestion(e.target.value)} />
      </form>
      {error && <div className="err">{error}</div>}
      {result && (
        <div className="ans">
          <div style={{ fontWeight: 600 }}>{result.answer}</div>
          {result.facts.map((f) => (
            <div key={f.label} className="evr"><div style={{ flex: 1 }}><b>{f.label}: {f.value}</b><div className="sm">{f.source}</div></div></div>
          ))}
          {result.documents.map((d) => (
            <div key={d.name} className="evr"><FileText size={15} /><div style={{ flex: 1 }}><b>{d.name}</b><div className="sm">{d.meta}</div></div></div>
          ))}
        </div>
      )}
    </Shell>
  );
}
