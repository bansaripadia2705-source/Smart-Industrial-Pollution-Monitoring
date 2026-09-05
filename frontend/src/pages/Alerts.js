import React, { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    alertsAPI.getAll()
      .then(r => setAlerts(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const act = async (id, action) => {
    if (action === 'acknowledge') await alertsAPI.acknowledge(id);
    else if (action === 'resolve') await alertsAPI.resolve(id);
    else if (action === 'delete')  await alertsAPI.delete(id);
    setAlerts(prev => action === 'delete' ? prev.filter(a => a._id !== id) : prev.map(a => a._id === id ? {...a, status: action === 'acknowledge' ? 'acknowledged' : 'resolved'} : a));
  };

  const filtered = alerts.filter(a => !filter || a.status === filter || a.severity === filter);

  const counts = { active:0, acknowledged:0, resolved:0, critical:0 };
  alerts.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; if (a.severity === 'critical') counts.critical++; });

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>🚨 Alerts</h1><p>Regulatory alerts and system notifications</p></div>
      </div>

      <div className="stat-grid mb-20" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
        <div className="stat-card danger"><div className="stat-card-icon">🔴</div><div className="stat-card-value">{counts.critical}</div><div className="stat-card-label">Critical</div></div>
        <div className="stat-card warning"><div className="stat-card-icon">🟡</div><div className="stat-card-value">{counts.active}</div><div className="stat-card-label">Active</div></div>
        <div className="stat-card info"><div className="stat-card-icon">👁️</div><div className="stat-card-value">{counts.acknowledged}</div><div className="stat-card-label">Acknowledged</div></div>
        <div className="stat-card success"><div className="stat-card-icon">✅</div><div className="stat-card-value">{counts.resolved}</div><div className="stat-card-label">Resolved</div></div>
      </div>

      <div className="card mb-20">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['','active','acknowledged','resolved','critical','high','medium','low'].map(f => (
            <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(f)}>
              {f || 'All'} {f && <span className={`badge badge-${f}`} style={{ marginLeft:4 }}>{alerts.filter(a=>a.status===f||a.severity===f).length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0 && <div className="card" style={{ textAlign:'center', color:'var(--text-muted)', padding:40 }}>No alerts found</div>}
        {filtered.map(alert => (
          <div key={alert._id} className="card" style={{ borderLeft:`3px solid ${alert.severity==='critical'?'var(--danger)':alert.severity==='high'?'#f85149':alert.severity==='medium'?'var(--warning)':'var(--border)'}`, padding:'14px 18px' }}>
            <div className="flex-between">
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20 }}>{alert.severity==='critical'?'🔴':alert.severity==='high'?'🟠':alert.severity==='medium'?'🟡':'🟢'}</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{alert.title}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{alert.message}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                <span className={`badge badge-${alert.status}`}>{alert.status}</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(alert.createdAt).toLocaleDateString()}</span>
                {alert.status === 'active' && <button className="btn btn-xs btn-secondary" onClick={()=>act(alert._id,'acknowledge')}>✓ Ack</button>}
                {alert.status === 'acknowledged' && <button className="btn btn-xs btn-primary" onClick={()=>act(alert._id,'resolve')}>✅ Resolve</button>}
                <button className="btn btn-xs btn-danger" onClick={()=>act(alert._id,'delete')}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
