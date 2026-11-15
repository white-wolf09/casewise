import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const { toast } = useData();
  const navigate = useNavigate();
  const [email, setEmail] = useState('maya@communitylegal.org');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/overview" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await login(email, password, remember);
      navigate('/overview');
    } catch (err) {
      setErrors(err.errors || { form: 'Incorrect email or password.' });
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login-l">
        <div className="brand"><div className="logo"><Shield size={18} /></div>Case<span>wise</span></div>
        <div className="eyebrow" style={{ marginTop: 'auto', color: '#8fb3a3' }}>Evidence, not assumptions</div>
        <h2>Every case fact. Grounded in evidence.</h2>
        <p style={{ color: '#b8cfc6', fontSize: 16, maxWidth: 480, margin: '0 0 26px' }}>
          Find answers across scattered case files, verify every claim at its source, and move clients forward with confidence.
        </p>
        <div style={{ display: 'flex', gap: 22, fontSize: 13, color: '#d7e7df' }}>
          <span className="row-inline"><Lock size={14} /> Encrypted</span>
          <span className="row-inline"><Shield size={14} /> Role protected</span>
          <span className="row-inline"><Eye size={14} /> Fully auditable</span>
        </div>
      </section>

      <section className="login-r">
        <form className="login-f" onSubmit={submit} noValidate>
          <div className="eyebrow">Secure staff portal</div>
          <h1 style={{ margin: '8px 0 6px' }}>Welcome back</h1>
          <p className="sub">Sign in to continue to your case workspace.</p>

          <div style={{ marginTop: 28 }}>
            <label className="lab">Email address</label>
            <input type="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
            {errors.email && <div className="ferr">{errors.email}</div>}
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="lab">Password</label>
            <input type="password" autoComplete="current-password" maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" aria-invalid={!!errors.password} />
            {errors.password && <div className="ferr">{errors.password}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 22px', fontSize: 12.5 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Keep me signed in
            </label>
            <button type="button" className="link" onClick={() => toast('Ask your administrator to reset your password.')}>Forgot password?</button>
          </div>

          <button className="btn btn-primary" disabled={busy} style={{ width: '100%', height: 44, justifyContent: 'center' }}>
            {busy ? 'Signing in…' : 'Sign in securely'}
          </button>
          <div className="or">or continue with</div>
          <button type="button" className="btn" style={{ width: '100%', height: 44, justifyContent: 'center' }}
            onClick={() => toast('Organisation SSO is not configured in this demo.')}>Organisation SSO</button>
          {errors.form && <div className="err">{errors.form}</div>}
        </form>
      </section>
    </div>
  );
}
