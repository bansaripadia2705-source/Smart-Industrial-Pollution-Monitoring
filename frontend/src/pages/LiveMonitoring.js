import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { readingsAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function Gauge({ value, max, label, unit, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ textAlign:'center', padding: '8px 4px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}<span style={{ fontSize: 12 }}> {unit}</span></div>
      <div className="progress-bar" style={{ marginTop: 6, marginBottom: 4 }}>
        <div className="progress-fill" style={{ width:`${pct}%`, background: color }} />
      </div>
      <div style={{ fontSize: 11, color:'var(--text-muted)' }}>{label} / {max}{unit}</div>
    </div>
  );
}

export default function LiveMonitoring() {
  const [air,   setAir]   = useState(null);
  const [water, setWater] = useState(null);
  const [labels,    setLabels]    = useState([]);
  const [pm25Hist,  setPm25Hist]  = useState([]);
  const [so2Hist,   setSo2Hist]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLive = useCallback(async () => {
    try {
      const [a, w] = await Promise.all([readingsAPI.live('air'), readingsAPI.live('water')]);
      setAir(a.data.data);
      setWater(w.data.data);
      const ts = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      setLabels(prev => [...prev.slice(-19), ts]);
      setPm25Hist(prev => [...prev.slice(-19), a.data.data.pm25]);
      setSo2Hist(prev  => [...prev.slice(-19), a.data.data.so2]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLive(); const id = setInterval(fetchLive, 5000); return () => clearInterval(id); }, [fetchLive]);

  const airStatus = (air?.status || 'normal');
  const waterStatus = (water?.status || 'normal');

  const lineData = {
    labels,
    datasets: [
      { label: 'PM2.5 (µg/m³)', data: pm25Hist, borderColor: '#f85149', backgroundColor: 'rgba(248,81,73,0.15)', fill:true, tension: 0.4, borderWidth: 2, pointRadius: 2 },
      { label: 'SO₂ (µg/m³)',   data: so2Hist,  borderColor: '#d29922', backgroundColor: 'rgba(210,153,34,0.1)',  fill:true, tension: 0.4, borderWidth: 2, pointRadius: 2 },
    ]
  };

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1>📡 Live Monitoring</h1>
          <p><span className="live-dot"/>Real-time sensor data refreshes every 5 seconds</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchLive}>🔄 Refresh Now</button>
      </div>

      {loading ? <div className="full-loader"><div className="spinner"/></div> : (
        <>
          <div className="grid-2 mb-20">
            {/* Air panel */}
            <div className="card">
              <div className="flex-between mb-16">
                <h3 style={{ fontSize:14, fontWeight:600 }}>🌬️ Air Quality – Live</h3>
                <span className={`badge badge-${airStatus}`}>{airStatus}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                <Gauge value={air?.pm25  || 0} max={150} label="PM2.5" unit="µg/m³" color={air?.pm25 > 60 ? '#f85149':'#2da44e'} />
                <Gauge value={air?.pm10  || 0} max={200} label="PM10"  unit="µg/m³" color={air?.pm10 > 100 ? '#f85149':'#2da44e'} />
                <Gauge value={air?.co    || 0} max={10}  label="CO"    unit="mg/m³" color={air?.co > 6 ? '#f85149':'#2da44e'} />
                <Gauge value={air?.so2   || 0} max={150} label="SO₂"   unit="µg/m³" color={air?.so2 > 80 ? '#f85149':'#d29922'} />
                <Gauge value={air?.no2   || 0} max={150} label="NO₂"   unit="µg/m³" color={air?.no2 > 80 ? '#f85149':'#d29922'} />
                <Gauge value={air?.vocs  || 0} max={3}   label="VOCs"  unit="ppm"   color={air?.vocs > 1.5 ? '#f85149':'#2da44e'} />
              </div>
              <div style={{ marginTop:12, padding:'8px 12px', background:'var(--bg3)', borderRadius:8, fontSize:13 }}>
                <strong>AQI: </strong>
                <span style={{ color: air?.aqi > 100 ? 'var(--danger)' : air?.aqi > 50 ? 'var(--warning)' : 'var(--accent)', fontWeight:700, fontSize:18 }}>{air?.aqi || 0}</span>
                <span style={{ color:'var(--text-muted)', marginLeft:8, fontSize:12 }}>
                  {air?.aqi < 50 ? 'Good' : air?.aqi < 100 ? 'Moderate' : air?.aqi < 150 ? 'Unhealthy' : 'Hazardous'}
                </span>
              </div>
            </div>

            {/* Water panel */}
            <div className="card">
              <div className="flex-between mb-16">
                <h3 style={{ fontSize:14, fontWeight:600 }}>💧 Water Quality – Live</h3>
                <span className={`badge badge-${waterStatus}`}>{waterStatus}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                <Gauge value={water?.ph  || 7}   max={14}   label="pH"          unit=""       color={(water?.ph < 6.5 || water?.ph > 8.5) ? '#f85149':'#2da44e'} />
                <Gauge value={water?.cod || 0}   max={400}  label="COD"         unit="mg/L"   color={water?.cod > 200 ? '#f85149':'#2da44e'} />
                <Gauge value={water?.bod || 0}   max={100}  label="BOD"         unit="mg/L"   color={water?.bod > 60 ? '#f85149':'#2da44e'} />
                <Gauge value={water?.tds || 0}   max={2000} label="TDS"         unit="mg/L"   color={water?.tds > 1000 ? '#f85149':'#d29922'} />
                <Gauge value={water?.temperature||25} max={50} label="Temp"     unit="°C"     color={water?.temperature > 40 ? '#f85149':'#2da44e'} />
                <Gauge value={water?.turbidity||0}   max={50}  label="Turbidity" unit="NTU"  color={water?.turbidity > 30 ? '#f85149':'#2da44e'} />
              </div>
              <div style={{ marginTop:12, padding:'8px 12px', background:'var(--bg3)', borderRadius:8, fontSize:12, color:'var(--text-muted)' }}>
                Updated: {water?.timestamp ? new Date(water.timestamp).toLocaleTimeString() : '–'}
              </div>
            </div>
          </div>

          {/* Live chart */}
          <div className="card">
            <div className="flex-between mb-16">
              <h3 style={{ fontSize:14, fontWeight:600 }}>📈 PM2.5 & SO₂ – Rolling 20 readings</h3>
              <span style={{ fontSize:11, color:'var(--text-muted)' }}><span className="live-dot"/>Auto-refresh 5s</span>
            </div>
            <div style={{ height: 200 }}>
              <Line data={lineData} options={{
                responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{ labels:{ color:'#8b949e', font:{size:11} } } },
                scales:{
                  x:{ grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#8b949e', font:{size:10}} },
                  y:{ grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#8b949e', font:{size:10}} }
                }
              }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
