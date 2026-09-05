import React, { useState, useEffect } from 'react';
import { readingsAPI, aiAPI } from '../services/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function WaterQuality() {
  const [readings, setReadings] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readingsAPI.getAll({ type:'water', limit:100 })
      .then(r => setReadings(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const latest = readings[0] || {};

  const barData = {
    labels: ['pH (×10)', 'COD', 'BOD', 'TDS (/10)', 'Temp', 'Turbidity'],
    datasets: [{
      label: 'Current Value',
      data: [(latest.ph||0)*10, latest.cod||0, latest.bod||0, (latest.tds||0)/10, latest.temperature||0, latest.turbidity||0],
      backgroundColor: [
        (latest.ph < 6.5 || latest.ph > 8.5) ? 'rgba(248,81,73,0.7)':'rgba(45,164,78,0.7)',
        (latest.cod||0) > 200 ? 'rgba(248,81,73,0.7)':'rgba(45,164,78,0.7)',
        (latest.bod||0) > 60  ? 'rgba(248,81,73,0.7)':'rgba(45,164,78,0.7)',
        (latest.tds||0) > 1000 ? 'rgba(248,81,73,0.7)':'rgba(45,164,78,0.7)',
        (latest.temperature||0) > 40 ? 'rgba(248,81,73,0.7)':'rgba(45,164,78,0.7)',
        (latest.turbidity||0) > 30 ? 'rgba(248,81,73,0.7)':'rgba(45,164,78,0.7)',
      ],
      borderRadius: 4
    }, {
      label: 'GPCB Limit',
      data: [65, 200, 60, 100, 40, 30],
      backgroundColor: 'rgba(31,111,235,0.3)',
      borderRadius: 4
    }]
  };

  const getAISummary = async () => {
    setAiLoading(true);
    try {
      const res = await aiAPI.summarize({ type:'water_quality', data: latest });
      setAiSummary(res.data.summary);
    } catch { setAiSummary('AI service unavailable.'); }
    finally { setAiLoading(false); }
  };

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  const phOk = latest.ph >= 6.5 && latest.ph <= 8.5;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>💧 Water / Effluent Monitoring</h1><p>Industrial effluent discharge monitoring per GPCB/CPCB norms</p></div>
        <button className="btn btn-primary btn-sm" onClick={getAISummary} disabled={aiLoading}>
          {aiLoading ? '⏳...' : '🤖 AI Analysis'}
        </button>
      </div>

      {/* Latest readings hero */}
      <div className="stat-grid mb-20">
        {[
          { label:'pH', value:latest.ph||0, unit:'', ok: phOk, low:6.5, high:8.5 },
          { label:'COD', value:latest.cod||0, unit:'mg/L', ok:(latest.cod||0)<=200, thresh:200 },
          { label:'BOD', value:latest.bod||0, unit:'mg/L', ok:(latest.bod||0)<=60, thresh:60 },
          { label:'TDS', value:latest.tds||0, unit:'mg/L', ok:(latest.tds||0)<=1000, thresh:1000 },
          { label:'Temperature', value:latest.temperature||0, unit:'°C', ok:(latest.temperature||0)<=40, thresh:40 },
          { label:'Turbidity', value:latest.turbidity||0, unit:'NTU', ok:(latest.turbidity||0)<=30, thresh:30 },
        ].map(m => (
          <div key={m.label} className={`stat-card ${m.ok ? 'success':'danger'}`}>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase' }}>{m.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color: m.ok ? 'var(--accent)':'var(--danger)' }}>{m.value}<span style={{ fontSize:12, marginLeft:3 }}>{m.unit}</span></div>
            <div style={{ fontSize:11, color: m.ok ? 'var(--accent)':'var(--danger)' }}>{m.ok ? '✓ Within limit':'⚠ Exceeded'}</div>
            {m.thresh && <div style={{ fontSize:10, color:'var(--text-muted)' }}>Limit: {m.thresh} {m.unit}</div>}
          </div>
        ))}
      </div>

      {aiSummary && (
        <div className="card mb-20">
          <div className="ai-badge">🤖 IBM Granite AI Analysis</div>
          <div className="ai-box">{aiSummary}</div>
        </div>
      )}

      <div className="grid-2 mb-20">
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>📊 vs GPCB Limits</h3>
          <div style={{ height:220 }}><Bar data={barData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#8b949e', font:{size:11} } } }, scales:{ x:{ticks:{color:'#8b949e'}}, y:{ticks:{color:'#8b949e'}} } }} /></div>
        </div>
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>🏭 ETP Performance Indicators</h3>
          {[['COD Removal Efficiency', 72, 'green'], ['BOD Removal Efficiency', 85, 'green'], ['pH Neutralization', phOk ? 95:45, phOk?'green':'red'], ['TDS Reduction', (latest.tds||0)<=1000 ? 80:35, (latest.tds||0)<=1000?'green':'red'], ['Overall ETP Score', 74, 'green']].map(([label, pct, clr]) => (
            <div key={label} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                <span>{label}</span><strong>{pct}%</strong>
              </div>
              <div className="progress-bar"><div className={`progress-fill ${clr}`} style={{ width:`${pct}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>📋 Recent Water Readings</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Timestamp</th><th>pH</th><th>COD</th><th>BOD</th><th>TDS</th><th>Temp °C</th><th>Turbidity</th><th>Status</th></tr></thead>
            <tbody>
              {readings.slice(0, 15).map(r => (
                <tr key={r._id}>
                  <td style={{ fontSize:11 }}>{new Date(r.timestamp).toLocaleString()}</td>
                  <td style={{ color:(r.ph<6.5||r.ph>8.5)?'var(--danger)':'' }}>{r.ph}</td>
                  <td style={{ color:r.cod>200?'var(--danger)':'' }}>{r.cod}</td>
                  <td style={{ color:r.bod>60?'var(--danger)':'' }}>{r.bod}</td>
                  <td style={{ color:r.tds>1000?'var(--danger)':'' }}>{r.tds}</td>
                  <td style={{ color:r.temperature>40?'var(--danger)':'' }}>{r.temperature}</td>
                  <td style={{ color:r.turbidity>30?'var(--danger)':'' }}>{r.turbidity}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
