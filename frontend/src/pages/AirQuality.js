import React, { useState, useEffect } from 'react';
import { readingsAPI, aiAPI } from '../services/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const THRESHOLDS = { pm25:60, pm10:100, co:6, so2:80, no2:80, vocs:1.5 };
const PARAMS = ['pm25','pm10','co','so2','no2','vocs'];

export default function AirQuality() {
  const [readings, setReadings] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readingsAPI.getAll({ type:'air', limit:100 })
      .then(r => setReadings(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const latest = readings[0] || {};
  const labels = readings.slice(0, 12).reverse().map(r => new Date(r.timestamp).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }));

  const barData = {
    labels: ['PM2.5', 'PM10', 'CO×10', 'SO₂', 'NO₂', 'VOCs×40'],
    datasets: [{
      label: 'Current (µg/m³)',
      data: [latest.pm25 || 0, latest.pm10 || 0, (latest.co || 0)*10, latest.so2 || 0, latest.no2 || 0, (latest.vocs || 0)*40],
      backgroundColor: PARAMS.map((p, i) => {
        const val = [latest.pm25,latest.pm10,latest.co,latest.so2,latest.no2,latest.vocs][i] || 0;
        const thresh = Object.values(THRESHOLDS)[i];
        return val > thresh ? 'rgba(248,81,73,0.7)' : 'rgba(45,164,78,0.7)';
      }),
      borderRadius: 4
    }, {
      label: 'NAAQS Limit',
      data: [60, 100, 60, 80, 80, 60],
      backgroundColor: 'rgba(31,111,235,0.3)',
      borderRadius: 4
    }]
  };

  const trendData = {
    labels,
    datasets: [
      { label:'PM2.5', data: readings.slice(0,12).reverse().map(r=>r.pm25||0), borderColor:'#f85149', backgroundColor:'rgba(248,81,73,0.1)', fill:true, tension:0.4, borderWidth:2, pointRadius:2 },
      { label:'SO₂',   data: readings.slice(0,12).reverse().map(r=>r.so2||0),  borderColor:'#d29922', tension:0.4, borderWidth:2, pointRadius:2 }
    ]
  };

  const getAISummary = async () => {
    setAiLoading(true);
    try {
      const res = await aiAPI.summarize({ type:'air_quality', data: latest });
      setAiSummary(res.data.summary);
    } catch { setAiSummary('AI service unavailable.'); }
    finally { setAiLoading(false); }
  };

  const aqiStatus = (latest.aqi||0) < 50 ? 'Good' : (latest.aqi||0) < 100 ? 'Moderate' : (latest.aqi||0) < 150 ? 'Unhealthy' : 'Hazardous';
  const aqiColor  = (latest.aqi||0) < 50 ? '#2da44e' : (latest.aqi||0) < 100 ? '#d29922' : '#f85149';

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>🌬️ Air Quality Monitoring</h1><p>Stack emissions & ambient air monitoring across all zones</p></div>
        <button className="btn btn-primary btn-sm" onClick={getAISummary} disabled={aiLoading}>
          {aiLoading ? '⏳ Analyzing...' : '🤖 AI Analysis'}
        </button>
      </div>

      {/* AQI hero */}
      <div className="card mb-20" style={{ borderLeft:`4px solid ${aqiColor}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>Current AQI</div>
            <div style={{ fontSize:64, fontWeight:800, lineHeight:1, color:aqiColor }}>{latest.aqi || 0}</div>
            <div style={{ fontSize:14, color:aqiColor, fontWeight:600 }}>{aqiStatus}</div>
          </div>
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, minWidth:240 }}>
            {[['PM2.5', latest.pm25, 'µg/m³', 60], ['PM10', latest.pm10, 'µg/m³', 100], ['CO', latest.co, 'mg/m³', 6], ['SO₂', latest.so2, 'µg/m³', 80], ['NO₂', latest.no2, 'µg/m³', 80], ['VOCs', latest.vocs, 'ppm', 1.5]].map(([label, val, unit, thresh]) => (
              <div key={label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:700, color: (val||0) > thresh ? 'var(--danger)':'var(--text)' }}>{val || 0}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{label} {unit}</div>
                <div style={{ fontSize:9, color: (val||0) > thresh ? 'var(--danger)':'var(--accent)' }}>Limit: {thresh}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="card mb-20">
          <div className="ai-badge">🤖 IBM Granite AI Analysis</div>
          <div className="ai-box">{aiSummary}</div>
        </div>
      )}

      <div className="grid-2 mb-20">
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>📊 vs NAAQS Thresholds</h3>
          <div style={{ height:220 }}><Bar data={barData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#8b949e', font:{size:11} } } }, scales:{ x:{ticks:{color:'#8b949e', font:{size:11}}}, y:{ticks:{color:'#8b949e'}} } }} /></div>
        </div>
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>📈 12-Hour Trend</h3>
          <div style={{ height:220 }}><Bar data={trendData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#8b949e', font:{size:11} } } }, scales:{ x:{ticks:{color:'#8b949e', font:{size:11}}}, y:{ticks:{color:'#8b949e'}} } }} /></div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-16">
          <h3 style={{ fontSize:14, fontWeight:600 }}>📋 Recent Air Readings</h3>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>Last {readings.length} readings</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Timestamp</th><th>PM2.5</th><th>PM10</th><th>SO₂</th><th>NO₂</th><th>CO</th><th>AQI</th><th>Status</th></tr></thead>
            <tbody>
              {readings.slice(0, 15).map(r => (
                <tr key={r._id}>
                  <td style={{ fontSize:11 }}>{new Date(r.timestamp).toLocaleString()}</td>
                  <td style={{ color: r.pm25 > 60 ? 'var(--danger)':'' }}>{r.pm25}</td>
                  <td style={{ color: r.pm10 > 100 ? 'var(--danger)':'' }}>{r.pm10}</td>
                  <td style={{ color: r.so2 > 80 ? 'var(--danger)':'' }}>{r.so2}</td>
                  <td style={{ color: r.no2 > 80 ? 'var(--danger)':'' }}>{r.no2}</td>
                  <td style={{ color: r.co > 6 ? 'var(--danger)':'' }}>{r.co}</td>
                  <td style={{ fontWeight:600 }}>{r.aqi || 0}</td>
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
