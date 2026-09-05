import React, { useState, useEffect } from 'react';
import { industriesAPI } from '../services/api';

const ZONE_COORDS = {
  Vapi:       { x: 20, y: 75, color: '#f85149' },
  Ankleshwar: { x: 50, y: 45, color: '#d29922' },
  Vatva:      { x: 78, y: 20, color: '#1f6feb' }
};

export default function PollutionMap() {
  const [industries, setIndustries] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    industriesAPI.getAll()
      .then(r => setIndustries(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  const zoneGroups = { Vapi:[], Ankleshwar:[], Vatva:[] };
  industries.forEach(i => { if (zoneGroups[i.zone]) zoneGroups[i.zone].push(i); });

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>🗺️ Pollution Map</h1><p>Geographic distribution of industrial units and pollution hotspots</p></div>
      </div>

      {/* SVG Map */}
      <div className="card mb-20">
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>📍 Vapi–Ankleshwar–Vatva Industrial Corridor</h3>
        <div style={{ position:'relative', background:'linear-gradient(135deg, #0d2b1d 0%, #0a1f2d 100%)', borderRadius:10, overflow:'hidden', height:400 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid lines */}
            {[20,40,60,80].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3"/>)}
            {[20,40,60,80].map(y => <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3"/>)}
            {/* Corridor road */}
            <path d="M 15 80 Q 48 48 82 18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" strokeDasharray="2,1"/>
            {/* River */}
            <path d="M 5 85 Q 20 75 30 80 Q 45 88 55 82 Q 65 76 75 80" stroke="rgba(30,100,220,0.4)" strokeWidth="1.5" fill="none"/>
            {/* Zone circles */}
            {Object.entries(ZONE_COORDS).map(([zone, c]) => (
              <circle key={zone} cx={c.x} cy={c.y} r="12" fill={c.color} fillOpacity="0.15" stroke={c.color} strokeWidth="0.5"/>
            ))}
            {/* Industry dots */}
            {industries.map((ind, i) => {
              const zc = ZONE_COORDS[ind.zone] || { x:50, y:50 };
              const angle = (i * 137.5) % 360;
              const radius = 6 + (i % 3) * 3;
              const px = zc.x + Math.cos(angle * Math.PI/180) * radius * 0.8;
              const py = zc.y + Math.sin(angle * Math.PI/180) * radius * 0.5;
              const dotColor = ind.complianceScore >= 70 ? '#2da44e' : ind.complianceScore >= 40 ? '#d29922' : '#f85149';
              return (
                <g key={ind._id} style={{ cursor:'pointer' }} onClick={() => setSelected(ind)}>
                  <circle cx={px} cy={py} r="1.5" fill={dotColor} opacity="0.9"/>
                  {ind.complianceScore < 50 && <circle cx={px} cy={py} r="3" fill="none" stroke={dotColor} strokeWidth="0.4" opacity="0.5"/>}
                </g>
              );
            })}
            {/* Zone labels */}
            {Object.entries(ZONE_COORDS).map(([zone, c]) => (
              <text key={zone+'lbl'} x={c.x} y={c.y+18} textAnchor="middle" fill={c.color} fontSize="2.5" fontWeight="bold">{zone}</text>
            ))}
          </svg>

          {/* Legend */}
          <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.7)', padding:'8px 12px', borderRadius:8, fontSize:11 }}>
            <div style={{ color:'#2da44e', marginBottom:4 }}>● Compliant (&gt;70%)</div>
            <div style={{ color:'#d29922', marginBottom:4 }}>● At Risk (40–70%)</div>
            <div style={{ color:'#f85149' }}>● Non-Compliant (&lt;40%)</div>
          </div>
          {/* Corridor label */}
          <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.6)', padding:'4px 10px', borderRadius:6, fontSize:11, color:'rgba(255,255,255,0.7)' }}>
            Golden Corridor – National Highway 48
          </div>
        </div>
      </div>

      {/* Selected industry panel */}
      {selected && (
        <div className="card mb-20" style={{ borderLeft:'3px solid var(--accent2)' }}>
          <div className="flex-between mb-12">
            <h3 style={{ fontSize:14, fontWeight:600 }}>📌 {selected.name}</h3>
            <button className="btn btn-xs btn-secondary" onClick={()=>setSelected(null)}>✕</button>
          </div>
          <div className="grid-3">
            <div><div className="metric-label">Zone</div><div className="metric-value">{selected.zone}</div></div>
            <div><div className="metric-label">Type</div><div className="metric-value">{selected.industryType}</div></div>
            <div><div className="metric-label">License</div><div className="metric-value">{selected.licenseNo}</div></div>
            <div><div className="metric-label">Contact</div><div className="metric-value">{selected.contactPerson}</div></div>
            <div><div className="metric-label">Compliance</div><div className="metric-value" style={{ color: selected.complianceScore >= 70 ? 'var(--accent)' : 'var(--danger)' }}>{selected.complianceScore}%</div></div>
            <div><div className="metric-label">Status</div><div className="metric-value"><span className={`badge badge-${selected.status}`}>{selected.status}</span></div></div>
          </div>
        </div>
      )}

      {/* Zone summary cards */}
      <div className="grid-3">
        {Object.entries(zoneGroups).map(([zone, inds]) => {
          const zc = ZONE_COORDS[zone];
          const avgScore = inds.length ? Math.round(inds.reduce((s,i)=>s+(i.complianceScore||0),0)/inds.length) : 0;
          return (
            <div key={zone} className="card" style={{ borderTop:`3px solid ${zc.color}` }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:zc.color, marginBottom:12 }}>{zone} Zone</h3>
              <div className="metric-row"><span className="metric-label">Industries</span><span className="metric-value">{inds.length}</span></div>
              <div className="metric-row"><span className="metric-label">Avg Compliance</span><span className="metric-value" style={{ color: avgScore>=70?'var(--accent)':'var(--danger)' }}>{avgScore}%</span></div>
              <div className="metric-row"><span className="metric-label">Compliant</span><span className="metric-value" style={{ color:'var(--accent)' }}>{inds.filter(i=>i.complianceScore>=70).length}</span></div>
              <div className="metric-row"><span className="metric-label">Non-Compliant</span><span className="metric-value" style={{ color:'var(--danger)' }}>{inds.filter(i=>i.complianceScore<40).length}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
