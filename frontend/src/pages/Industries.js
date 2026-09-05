import React, { useState, useEffect } from 'react';
import { industriesAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const ZONES = ['All', 'Vapi', 'Ankleshwar', 'Vatva'];
const TYPES  = ['All', 'Chemical', 'Pharmaceutical', 'Textile', 'Petrochemical', 'Fertilizer', 'Plastics', 'Agrochemical', 'Metal Processing', 'Dye & Chemical'];

export default function Industries() {
  const { t } = useLanguage();
  const [industries, setIndustries] = useState([]);
  const [zone, setZone] = useState('All');
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    industriesAPI.getAll()
      .then(r => setIndustries(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = industries.filter(i =>
    (zone === 'All' || i.zone === zone) &&
    (type === 'All' || i.industryType === type) &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.licenseNo?.toLowerCase().includes(search.toLowerCase()))
  );

  const scoreColor = s => s >= 70 ? 'var(--accent)' : s >= 40 ? 'var(--warning)' : 'var(--danger)';
  const scoreClass = s => s >= 70 ? 'success' : s >= 40 ? 'warning' : 'danger';

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>🏭 {t('industries')}</h1><p>{industries.length} registered industrial units across all zones</p></div>
      </div>

      {/* KPIs */}
      <div className="stat-grid mb-20" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
        <div className="stat-card info"><div className="stat-card-icon">🏭</div><div className="stat-card-value">{industries.length}</div><div className="stat-card-label">Total Units</div></div>
        <div className="stat-card success"><div className="stat-card-icon">✅</div><div className="stat-card-value">{industries.filter(i=>i.complianceScore>=70).length}</div><div className="stat-card-label">Compliant</div></div>
        <div className="stat-card warning"><div className="stat-card-icon">⚠️</div><div className="stat-card-value">{industries.filter(i=>i.complianceScore>=40&&i.complianceScore<70).length}</div><div className="stat-card-label">At Risk</div></div>
        <div className="stat-card danger"><div className="stat-card-icon">🚨</div><div className="stat-card-value">{industries.filter(i=>i.complianceScore<40).length}</div><div className="stat-card-label">Non-Compliant</div></div>
      </div>

      {/* Filters */}
      <div className="card mb-20">
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div className="search-bar" style={{ maxWidth:260 }}>
            🔍 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('search')} />
          </div>
          <select className="form-control" style={{ width:'auto' }} value={zone} onChange={e=>setZone(e.target.value)}>
            {ZONES.map(z => <option key={z}>{z}</option>)}
          </select>
          <select className="form-control" style={{ width:'auto' }} value={type} onChange={e=>setType(e.target.value)}>
            {TYPES.map(tp => <option key={tp}>{tp}</option>)}
          </select>
          <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:'auto' }}>
            {filtered.length} of {industries.length} industries
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Industry Name</th>
                <th>Zone</th>
                <th>Type</th>
                <th>License No.</th>
                <th>Contact Person</th>
                <th>Compliance Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ind, i) => (
                <tr key={ind._id}>
                  <td style={{ color:'var(--text-muted)', fontSize:11 }}>{i+1}</td>
                  <td><strong>{ind.name}</strong></td>
                  <td><span className="badge badge-info" style={{ background:'rgba(31,111,235,0.15)', color:'#1f6feb' }}>{ind.zone}</span></td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>{ind.industryType}</td>
                  <td style={{ fontSize:11, fontFamily:'monospace' }}>{ind.licenseNo}</td>
                  <td style={{ fontSize:12 }}>{ind.contactPerson}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="progress-bar" style={{ width:80 }}>
                        <div className={`progress-fill ${scoreClass(ind.complianceScore)}`} style={{ width:`${ind.complianceScore}%` }} />
                      </div>
                      <strong style={{ color:scoreColor(ind.complianceScore), fontSize:13 }}>{ind.complianceScore}%</strong>
                    </div>
                  </td>
                  <td><span className={`badge badge-${ind.status}`}>{ind.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--text-muted)', padding:32 }}>No industries found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
