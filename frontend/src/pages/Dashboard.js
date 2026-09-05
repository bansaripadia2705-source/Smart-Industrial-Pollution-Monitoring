import React, { useState, useEffect, useCallback } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { dashboardAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartOpts = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, title: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', maxRotation: 0, font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', font: { size: 10 } } }
  }
});

function StatCard({ icon, value, label, variant, unit }) {
  return (
    <div className={`stat-card ${variant || ''}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-value">{value}{unit && <span style={{ fontSize: 14, marginLeft: 4 }}>{unit}</span>}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats]   = useState(null);
  const [chart, setChart]   = useState(null);
  const [incidents, setInc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      const [s, c, i] = await Promise.all([
        dashboardAPI.stats(),
        dashboardAPI.chartData(),
        dashboardAPI.recentIncidents()
      ]);
      setStats(s.data.data);
      setChart(c.data.data);
      setInc(i.data.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); const id = setInterval(loadData, 30000); return () => clearInterval(id); }, [loadData]);

  if (loading) return <div className="full-loader"><div className="spinner" /></div>;

  const aqiColor = (stats?.currentAQI || 0) < 50 ? '#2da44e' : (stats?.currentAQI || 0) < 100 ? '#d29922' : '#f85149';

  const lineData = chart ? {
    labels: chart.labels,
    datasets: [
      { label: 'PM2.5', data: chart.pm25, borderColor: '#f85149', backgroundColor: 'rgba(248,81,73,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 2 },
      { label: 'SO₂',   data: chart.so2,  borderColor: '#d29922', backgroundColor: 'rgba(210,153,34,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 2 },
      { label: 'NO₂',   data: chart.no2,  borderColor: '#1f6feb', backgroundColor: 'rgba(31,111,235,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 2 },
    ]
  } : null;

  const waterData = chart ? {
    labels: chart.labels,
    datasets: [
      { label: 'COD', data: chart.cod, borderColor: '#2da44e', tension: 0.4, borderWidth: 2, pointRadius: 2 },
      { label: 'BOD', data: chart.bod, borderColor: '#1f6feb', tension: 0.4, borderWidth: 2, pointRadius: 2 },
    ]
  } : null;

  const doughnutData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{ data: [stats?.criticalAlerts || 0, 4, 8, 12], backgroundColor: ['#f85149','#d29922','#1f6feb','#2da44e'], borderWidth: 0 }]
  };

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1>🏠 {t('dashboard')}</h1>
          <p>Vapi–Ankleshwar–Vatva Industrial Corridor · Last updated: {lastUpdate.toLocaleTimeString()}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>🔄 Refresh</button>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <StatCard icon="🏭" value={stats?.totalIndustries || 0} label={t('totalIndustries')} variant="info" />
        <StatCard icon="📡" value={stats?.activeSensors || 0} label={t('activeSensors')} variant="success" />
        <StatCard icon="💨" value={stats?.currentAQI || 0} label={t('currentAQI')} unit="AQI" variant={stats?.currentAQI > 100 ? 'danger' : 'warning'} />
        <StatCard icon="⚠️" value={stats?.activeViolations || 0} label={t('activeViolations')} variant="danger" />
        <StatCard icon="🚨" value={stats?.criticalAlerts || 0} label={t('criticalAlerts')} variant="danger" />
        <StatCard icon="🏥" value={stats?.highRiskZones || 0} label={t('highRiskZones')} variant="warning" />
        <StatCard icon="✅" value={`${stats?.avgComplianceScore || 0}%`} label={t('complianceScore')} variant="success" />
        <StatCard icon="📊" value={stats?.totalReadings || 0} label="Total Readings" variant="info" />
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-20">
        <div className="card">
          <div className="flex-between mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>📈 Air Quality Trend (24h)</h3>
            <div style={{ display:'flex', gap:8, fontSize:11, color:'var(--text-muted)' }}>
              <span style={{color:'#f85149'}}>● PM2.5</span>
              <span style={{color:'#d29922'}}>● SO₂</span>
              <span style={{color:'#1f6feb'}}>● NO₂</span>
            </div>
          </div>
          {lineData && <div style={{ height: 200 }}><Line data={lineData} options={chartOpts('Air')} /></div>}
        </div>
        <div className="card">
          <div className="flex-between mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>💧 Water Quality Trend (24h)</h3>
            <div style={{ display:'flex', gap:8, fontSize:11, color:'var(--text-muted)' }}>
              <span style={{color:'#2da44e'}}>● COD</span>
              <span style={{color:'#1f6feb'}}>● BOD</span>
            </div>
          </div>
          {waterData && <div style={{ height: 200 }}><Line data={waterData} options={chartOpts('Water')} /></div>}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-2">
        {/* Recent incidents */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🚨 {t('recentIncidents')}</h3>
          {incidents.length === 0 ? <p style={{ color:'var(--text-muted)', fontSize:13 }}>{t('noData')}</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Parameter</th><th>Severity</th><th>Status</th><th>Detected</th></tr></thead>
                <tbody>
                  {incidents.slice(0, 8).map(v => (
                    <tr key={v._id}>
                      <td><strong>{v.parameter}</strong><br /><span style={{ fontSize:11, color:'var(--text-muted)' }}>{v.measuredValue} vs {v.threshold}</span></td>
                      <td><span className={`badge badge-${v.severity}`}>{v.severity}</span></td>
                      <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                      <td style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(v.detectedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alert distribution + compliance */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card" style={{ flex:1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🍩 Alert Distribution</h3>
            <div style={{ height: 160 }}><Doughnut data={doughnutData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:'#8b949e', font:{size:11} } } } }} /></div>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>✅ {t('complianceScore')}</h3>
            <div style={{ marginBottom: 6, fontSize: 13, display:'flex', justifyContent:'space-between' }}>
              <span>Industry Average</span>
              <strong style={{ color: aqiColor }}>{stats?.avgComplianceScore || 0}%</strong>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${stats?.avgComplianceScore || 0}%`,
                background: (stats?.avgComplianceScore || 0) >= 70 ? 'var(--accent)' : (stats?.avgComplianceScore || 0) >= 40 ? 'var(--warning)' : 'var(--danger)'
              }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
              <span>{stats?.compliantIndustries || 0} compliant</span>
              <span>{(stats?.totalIndustries || 0) - (stats?.compliantIndustries || 0)} need action</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
