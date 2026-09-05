import React, { useState, useEffect } from 'react';
import { sensorsAPI } from '../services/api';

export default function Sensors() {
  const [sensors, setSensors]   = useState([]);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    sensorsAPI.getAll()
      .then(r => setSensors(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = sensors.filter(s =>
    (filter === 'all' || s.status === filter || s.sensorType === filter) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>📟 Sensors</h1><p>{sensors.length} sensors registered across {[...new Set(sensors.map(s=>s.industryId))].length} industries</p></div>
      </div>

      <div className="stat-grid mb-20" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
        <div className="stat-card success"><div className="stat-card-icon">📡</div><div className="stat-card-value">{sensors.filter(s=>s.status==='active').length}</div><div className="stat-card-label">Active</div></div>
        <div className="stat-card danger"><div className="stat-card-icon">❌</div><div className="stat-card-value">{sensors.filter(s=>s.status==='offline').length}</div><div className="stat-card-label">Offline</div></div>
        <div className="stat-card info"><div className="stat-card-icon">🌬️</div><div className="stat-card-value">{sensors.filter(s=>s.sensorType==='air').length}</div><div className="stat-card-label">Air Sensors</div></div>
        <div className="stat-card info"><div className="stat-card-icon">💧</div><div className="stat-card-value">{sensors.filter(s=>s.sensorType==='water').length}</div><div className="stat-card-label">Water Sensors</div></div>
      </div>

      <div className="card mb-20">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div className="search-bar">🔍 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sensors..." /></div>
          {['all','active','offline','air','water'].map(f => (
            <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
          <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:'auto' }}>{filtered.length} sensors</span>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Sensor Name</th><th>Type</th><th>Parameters</th><th>Status</th><th>Last Reading</th></tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s._id}>
                  <td style={{ fontSize:11, color:'var(--text-muted)' }}>{i+1}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span>{s.sensorType === 'air' ? '🌬️':'💧'}</span>
                      <strong style={{ fontSize:13 }}>{s.name}</strong>
                    </div>
                  </td>
                  <td><span className="badge" style={{ background:'rgba(31,111,235,0.15)', color:'#1f6feb' }}>{s.sensorType}</span></td>
                  <td style={{ fontSize:11, color:'var(--text-muted)' }}>{(s.parameters || []).join(', ')}</td>
                  <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                  <td style={{ fontSize:11, color:'var(--text-muted)' }}>
                    {s.lastReading ? new Date(s.lastReading).toLocaleString() : 'No data yet'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-muted)', padding:32 }}>No sensors found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
