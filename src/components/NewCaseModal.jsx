import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CASE_TYPES, LANGUAGES, TEAM } from '../utils/validation.js';

export default function NewCaseModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const workers = [user.name, ...TEAM.filter((w) => w !== user.name)];
  const [form, setForm] = useState({
    clientFirst: '', clientLast: '', type: CASE_TYPES[0], language: LANGUAGES[0], assignee: user.name,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const created = await api.createCase(form);
      onCreated(created);
    } catch (err) {
      setErrors(err.errors || { form: 'Could not create the case. Try again.' });
      setBusy(false);
    }
  };

  const Err = ({ name }) => (errors[name] ? <div className="ferr">{errors[name]}</div> : null);

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} noValidate>
        <div className="mh">
          <div>
            <div className="eyebrow">Intake</div>
            <h2 style={{ marginTop: 6 }}>Create a new case</h2>
            <p className="sm" style={{ marginTop: 4 }}>Start with the essentials. Sensitive details can be added after assignment.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-ghost"><X size={18} /></button>
        </div>

        <div className="mb">
          <div className="grid g2">
            <div>
              <label className="lab">Client first name</label>
              <input value={form.clientFirst} onChange={set('clientFirst')} maxLength={50} aria-invalid={!!errors.clientFirst} />
              <Err name="clientFirst" />
            </div>
            <div>
              <label className="lab">Client last name</label>
              <input value={form.clientLast} onChange={set('clientLast')} maxLength={50} aria-invalid={!!errors.clientLast} />
              <Err name="clientLast" />
            </div>
          </div>
          <div className="grid g2">
            <div>
              <label className="lab">Case type</label>
              <select value={form.type} onChange={set('type')}>{CASE_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              <Err name="type" />
            </div>
            <div>
              <label className="lab">Primary language</label>
              <select value={form.language} onChange={set('language')}>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select>
              <Err name="language" />
            </div>
          </div>
          <div>
            <label className="lab">Assigned case worker</label>
            <select value={form.assignee} onChange={set('assignee')}>{workers.map((w) => <option key={w}>{w}</option>)}</select>
            <Err name="assignee" />
          </div>
          <Err name="form" />
        </div>

        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create secure case'}</button>
        </div>
      </form>
    </div>
  );
}
