import React, { useState, useEffect } from 'react';
import { readingsAPI, violationsAPI } from '../services/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#8b949e', font:{size:11} } } },
  scales: { x:{ ticks:{ color:'#8b949e', font:{size:10} } }, y:{ ticks:{ color:'#8b949e', font:{size:10} } } }
};

export default function Analytics() {
  const [airReadings,   setAir]   = useState([]);
  const [waterReadings, setWater] = useState([]);
  const [violations,    setViol]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      readingsAPI.getAll({ type:'air', limit:200 }),
      readingsAPI.getAll({ type:'water', limit:200 }),
      violationsAPI.getAll()
    ]).then(([a, w, v]) => {
      setAir(a.data.data || []);
      setWater(w.data.data || []);
      setViol(v.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  // Last 24 hourly buckets
  const hours = Array.from({length:24}, (_, i) => {
    const d = new Date(); d.setHours(d.getHours()-23+i); return d;
  });
  const labels = hours.map(h => h.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }));

  const avgByHour = (readings, field) =>
    hours.map(h => {
      const bucket = readings.filter(r => {
        const rt = new Date(r.timestamp);
        return rt.getHours() === h.getHours();
      });
      if (!bucket.length) return 0;
      return Math.round(bucket.reduce((s, r) => s + (r[field]||0), 0) / bucket.length * 10) / 10;
    });

  const pm25Trend  = { labels, datasets: [{ label:'PM2.5 avg', data:avgByHour(airReadings,'pm25'), borderColor:'#f85149', backgroundColor:'rgba(248,81,73,0.1)', fill:true, tension:0.4, borderWidth:2, pointRadius:1 }, { label:'NAAQS Limit', data:Array(24).fill(60), borderColor:'#1f6feb', borderDash:[5,5], borderWidth:1.5, pointRadius:0 }] };
  const codTrend   = { labels, datasets: [{ label:'COD avg', data:avgByHour(waterReadings,'cod'), borderColor:'#2da44e', backgroundColor:'rgba(45,164,78,0.1)', fill:true, tension:0.4, borderWidth:2, pointRadius:1 }, { label:'GPCB Limit', data:Array(24).fill(200), borderColor:'#d29922', borderDash:[5,5], borderWidth:1.5, pointRadius:0 }] };

  const vBySeverity = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{ data: [violations.filter(v=>v.severity==='critical').length, violations.filter(v=>v.severity==='high').length, violations.filter(v=>v.severity==='medium').length, violations.filter(v=>v.severity==='low').length], backgroundColor:['#f85149','#d29922','#1f6feb','#2da44e'], borderWidth:0 }]
  };

  const vByType = {
    labels: ['Air','Water'],
    datasets: [{ label:'Violations', data:[violations.filter(v=>v.type==='air').length, violations.filter(v=>v.type==='water').length], backgroundColor:['rgba(248,81,73,0.7)','rgba(31,111,235,0.7)'], borderRadius:4 }]
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>📈 Historical Analytics</h1>
        <p>24-hour trend analysis and statistical overview</p>
      </div>

      {/* Summary KPIs */}
      <div className="stat-grid mb-20">
        <div className="stat-card info"><div className="stat-card-icon">📊</div><div className="stat-card-value">{airReadings.length}</div><div className="stat-card-label">Air Readings</div></div>
        <div className="stat-card info"><div className="stat-card-icon">💧</div><div className="stat-card-value">{waterReadings.length}</div><div className="stat-card-label">Water Readings</div></div>
        <div className="stat-card danger"><div className="stat-card-icon">⚠️</div><div className="stat-card-value">{violations.length}</div><div className="stat-card-label">Total Violations</div></div>
        <div className="stat-card warning"><div className="stat-card-icon">🔴</div><div className="stat-card-value">{violations.filter(v=>v.severity==='critical').length}</div><div className="stat-card-label">Critical</div></div>
        <div className="stat-card success"><div className="stat-card-icon">📉</div><div className="stat-card-value">{airReadings.length ? Math.round(airReadings.reduce((s,r)=>s+(r.pm25||0),0)/airReadings.length) : 0}</div><div className="stat-card-label">Avg PM2.5</div></div>
        <div className="stat-card success"><div className="stat-card-icon">💧</div><div className="stat-card-value">{waterReadings.length ? Math.round(waterReadings.reduce((s,r)=>s+(r.cod||0),0)/waterReadings.length) : 0}</div><div className="stat-card-label">Avg COD</div></div>
      </div>

      <div className="grid-2 mb-20">
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>📈 PM2.5 – 24h Trend vs NAAQS</h3>
          <div style={{ height:220 }}><Line data={pm25Trend} options={CHART_OPTIONS} /></div>
        </div>
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>💧 COD – 24h Trend vs GPCB Limit</h3>
          <div style={{ height:220 }}><Line data={codTrend} options={CHART_OPTIONS} /></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>🍩 Violations by Severity</h3>
          <div style={{ height:220 }}><Doughnut data={vBySeverity} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:'#8b949e', font:{size:11} } } } }} /></div>
        </div>
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>📊 Violations by Type</h3>
          <div style={{ height:220 }}><Bar data={vByType} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ticks:{color:'#8b949e'}}, y:{ticks:{color:'#8b949e'}} } }} /></div>
        </div>
      </div>
    </div>
  );
}
