import React, { useState, useEffect } from 'react';
import { violationsAPI, aiAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Violations() {
  const { t } = useLanguage();
  const [violations, setViolations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState({ status:'', severity:'' });
  const [search, setSearch] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    Promise.all([violationsAPI.getAll(), violationsAPI.summary()])
      .then(([v, s]) => { setViolations(v.data.data || []); setSummary(s.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await violationsAPI.updateStatus(id, status);
    setViolations(prev => prev.map(v => v._id === id ? {...v, status} : v));
  };

  const getAI = async (v) => {
    setAiLoading(true);
    try {
      const res = await aiAPI.summarize({ type:'violation', data: v });
      setAiText(res.data.summary);
    } catch { setAiText('AI service unavailable.'); }
    finally { setAiLoading(false); }
  };

  const filtered = violations.filter(v =>
    (!filter.status || v.status === filter.status) &&
    (!filter.severity || v.severity === filter.severity) &&
    (!search || v.parameter?.toLowerCase().includes(search.toLowerCase()) || v.industryName?.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>⚠️ {t('violations')}</h1><p>Threshold exceedances and compliance violations</p></div>
      </div>

      {summary && (
        <div className="stat-grid mb-20" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
          <div className="stat-card danger"><div className="stat-card-icon">🚨</div><div className="stat-card-value">{summary.critical}</div><div className="stat-card-label">Critical</div></div>
          <div className="stat-card warning"><div className="stat-card-icon">⚠️</div><div className="stat-card-value">{summary.high}</div><div className="stat-card-label">High</div></div>
          <div className="stat-card info"><div className="stat-card-icon">📋</div><div className="stat-card-value">{summary.open}</div><div className="stat-card-label">Open</div></div>
          <div className="stat-card success"><div className="stat-card-icon">✅</div><div className="stat-card-value">{summary.resolved}</div><div className="stat-card-label">Resolved</div></div>
        </div>
      )}

      {aiText && (
        <div className="card mb-20">
          <div className="ai-badge">🤖 IBM Granite AI Analysis</div>
          <div className="ai-box">{aiText}</div>
        </div>
      )}

      <div className="card mb-20">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div className="search-bar">🔍 <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search parameter / industry..." /></div>
          <select className="form-control" style={{ width:'auto' }} value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))}>
            <option value="">All Status</option>
            {['open','acknowledged','escalated','resolved'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{ width:'auto' }} value={filter.severity} onChange={e=>setFilter(f=>({...f,severity:e.target.value}))}>
            <option value="">All Severity</option>
            {['critical','high','medium','low'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:'auto' }}>{filtered.length} violations</span>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Parameter</th><th>Industry</th><th>Measured / Limit</th><th>Exceed %</th><th>Severity</th><th>Status</th><th>Detected</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paged.map((v, i) => (
                <tr key={v._id}>
                  <td style={{ fontSize:11 }}>{(page-1)*PER_PAGE+i+1}</td>
                  <td><strong>{v.parameter}</strong><br/><span style={{ fontSize:10, color:'var(--text-muted)' }}>{v.type}</span></td>
                  <td style={{ fontSize:12 }}>{v.industryName || '–'}</td>
                  <td>
                    <span style={{ color:'var(--danger)', fontWeight:600 }}>{v.measuredValue}</span>
                    <span style={{ color:'var(--text-muted)', fontSize:11 }}> / {v.threshold}</span>
                  </td>
                  <td style={{ color: (v.exceedancePercent||0)>100?'var(--danger)':'var(--warning)', fontWeight:600 }}>+{v.exceedancePercent||0}%</td>
                  <td><span className={`badge badge-${v.severity}`}>{v.severity}</span></td>
                  <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                  <td style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(v.detectedAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {v.status==='open' && <button className="btn btn-xs btn-secondary" onClick={()=>updateStatus(v._id,'acknowledged')}>Ack</button>}
                      {v.status==='acknowledged' && <button className="btn btn-xs btn-primary" onClick={()=>updateStatus(v._id,'resolved')}>Resolve</button>}
                      {v.status==='open' && <button className="btn btn-xs btn-danger" onClick={()=>updateStatus(v._id,'escalated')}>Escalate</button>}
                      <button className="btn btn-xs btn-secondary" onClick={()=>getAI(v)} disabled={aiLoading}>🤖</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length===0 && <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-muted)', padding:32 }}>No violations match filters</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length:totalPages },(_,i)=>i+1).map(p=>(
              <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={()=>setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
