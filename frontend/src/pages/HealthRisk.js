import React, { useState, useEffect } from 'react';
import { riskAPI, aiAPI } from '../services/api';

const RISK_ICON = { critical:'🔴', high:'🟠', medium:'🟡', low:'🟢' };

export default function HealthRisk() {
  const [risks, setRisks]     = useState([]);
  const [aiText, setAiText]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    riskAPI.getAll()
      .then(r => setRisks(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getAI = async (risk) => {
    setAiLoading(true);
    try {
      const res = await aiAPI.summarize({ type:'health_risk', data: risk });
      setAiText(res.data.summary);
    } catch { setAiText('AI unavailable.'); }
    finally { setAiLoading(false); }
  };

  const counts = { critical:0, high:0, medium:0, low:0 };
  risks.forEach(r => { if (counts[r.riskLevel] !== undefined) counts[r.riskLevel]++; });

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>🏥 Public Health Risk Assessment</h1><p>AI-powered community health risk evaluation for affected zones</p></div>
      </div>

      <div className="stat-grid mb-20" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
        <div className="stat-card danger"><div className="stat-card-icon">🔴</div><div className="stat-card-value">{counts.critical}</div><div className="stat-card-label">Critical Risk</div></div>
        <div className="stat-card warning"><div className="stat-card-icon">🟠</div><div className="stat-card-value">{counts.high}</div><div className="stat-card-label">High Risk</div></div>
        <div className="stat-card info"><div className="stat-card-icon">🟡</div><div className="stat-card-value">{counts.medium}</div><div className="stat-card-label">Medium Risk</div></div>
        <div className="stat-card success"><div className="stat-card-icon">🟢</div><div className="stat-card-value">{counts.low}</div><div className="stat-card-label">Low Risk</div></div>
      </div>

      {aiText && (
        <div className="card mb-20">
          <div className="ai-badge">🤖 IBM Granite AI Health Advisory</div>
          <div className="ai-box">{aiText}</div>
        </div>
      )}

      <div className="grid-auto">
        {risks.map(r => (
          <div key={r._id} className={`card risk-card`} style={{ borderLeft:`4px solid ${r.riskLevel==='critical'?'#ff6b6b':r.riskLevel==='high'?'var(--danger)':r.riskLevel==='medium'?'var(--warning)':'var(--accent)'}` }}>
            <div className="flex-between mb-16">
              <div>
                <div style={{ fontSize:18 }}>{RISK_ICON[r.riskLevel]} <strong>{r.industryName || 'Industry'}</strong></div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Risk Assessment</div>
              </div>
              <span className={`badge badge-${r.riskLevel}`}>{r.riskLevel?.toUpperCase()}</span>
            </div>

            <div className="metric-row"><span className="metric-label">Avg AQI</span><span className="metric-value" style={{ color: r.avgAQI > 100 ? 'var(--danger)':'' }}>{r.avgAQI}</span></div>
            <div className="metric-row"><span className="metric-label">Avg COD (mg/L)</span><span className="metric-value" style={{ color: r.avgCOD > 200 ? 'var(--danger)':'' }}>{r.avgCOD}</span></div>
            <div className="metric-row"><span className="metric-label">Open Violations</span><span className="metric-value">{r.openViolations}</span></div>
            <div className="metric-row"><span className="metric-label">Affected Population</span><span className="metric-value">{(r.affectedPopulation||0).toLocaleString()}</span></div>

            <div style={{ marginTop:12, padding:'8px 10px', background:'var(--bg3)', borderRadius:6, fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>
              💡 {r.recommendations}
            </div>

            <button className="btn btn-secondary btn-sm" style={{ marginTop:12, width:'100%', justifyContent:'center' }}
              onClick={() => getAI(r)} disabled={aiLoading}>
              {aiLoading ? '⏳ Analyzing...' : '🤖 Get AI Health Advisory'}
            </button>

            <div style={{ marginTop:8, fontSize:10, color:'var(--text-muted)', textAlign:'right' }}>
              Assessed: {new Date(r.assessedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
