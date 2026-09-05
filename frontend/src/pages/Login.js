import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail]   = useState('admin@ecoguard.ai');
  const [password, setPass] = useState('Admin@123');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>EcoGuard AI</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Smart Industrial Pollution Monitoring
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
            Vapi – Ankleshwar – Vatva Corridor
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            🔐 {t('login')}
          </h2>

          {error && <div className="alert-bar danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('email')}</label>
              <input
                className="form-control"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@ecoguard.ai"
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('password')}</label>
              <input
                className="form-control"
                type="password"
                value={password}
                onChange={e => setPass(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              {loading ? '⏳ Signing in...' : `🔑 ${t('login')}`}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: 12, background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <strong>Demo credentials:</strong><br />
            👤 admin@ecoguard.ai / Admin@123
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-muted)' }}>
          IBM Agentic AI Workshop 2026<br />
          Smart Industrial Pollution Monitoring for Golden Corridor (Vapi–Ankleshwar)<br />
          Created by Tech Titans + IBM Cloud
        </div>
      </div>
    </div>
  );
}
