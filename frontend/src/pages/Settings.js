import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, changeLang } = useLanguage();
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>🔧 Settings</h1><p>System configuration and preferences</p></div>
        {saved && <span className="badge badge-normal">✓ Settings saved</span>}
      </div>

      <div className="grid-2">
        {/* User profile */}
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>👤 User Profile</h3>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#fff', fontWeight:700 }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>{user?.name}</div>
              <div style={{ color:'var(--text-muted)', fontSize:12 }}>{user?.email}</div>
              <span className="badge badge-normal" style={{ marginTop:4 }}>{user?.role}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" defaultValue={user?.name} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" defaultValue={user?.email} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input className="form-control" value={user?.role} disabled />
          </div>
          <button className="btn btn-primary" onClick={save}>💾 Save Profile</button>
        </div>

        {/* Appearance */}
        <div>
          <div className="card mb-20">
            <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>🎨 Appearance</h3>
            <div className="form-group">
              <label className="form-label">Theme</label>
              <div style={{ display:'flex', gap:10 }}>
                <button className={`btn ${theme==='dark'?'btn-primary':'btn-secondary'}`} onClick={() => theme!=='dark' && toggleTheme()}>🌙 Dark Mode</button>
                <button className={`btn ${theme==='light'?'btn-primary':'btn-secondary'}`} onClick={() => theme!=='light' && toggleTheme()}>☀️ Light Mode</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <div style={{ display:'flex', gap:10 }}>
                {[['en','🇬🇧 English'], ['hi','🇮🇳 हिंदी'], ['gu','🇮🇳 ગુજરાતી']].map(([code, label]) => (
                  <button key={code} className={`btn ${lang===code?'btn-primary':'btn-secondary'}`} onClick={() => changeLang(code)}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="card mb-20">
            <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>🔔 Alert Thresholds</h3>
            {[['PM2.5 Alert (µg/m³)', '60'], ['SO₂ Alert (µg/m³)', '80'], ['COD Alert (mg/L)', '200'], ['pH Min', '6.5'], ['pH Max', '8.5']].map(([label, def]) => (
              <div className="form-group" key={label}>
                <label className="form-label">{label}</label>
                <input className="form-control" type="number" defaultValue={def} />
              </div>
            ))}
            <button className="btn btn-primary btn-sm" onClick={save}>💾 Save Thresholds</button>
          </div>

          <div className="card">
            <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>🤖 AI Configuration</h3>
            <div className="form-group">
              <label className="form-label">WatsonX Project ID</label>
              <input className="form-control" defaultValue="29f2b75e-ec3e-463c-b6de-aefa520a2d81" type="password" />
            </div>
            <div className="form-group">
              <label className="form-label">Granite Model</label>
              <select className="form-control">
                <option>ibm/granite-13b-instruct-v2</option>
                <option>ibm/granite-20b-instruct-v1</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sensor Refresh Interval</label>
              <select className="form-control">
                <option value="5000">5 seconds (Live)</option>
                <option value="15000">15 seconds</option>
                <option value="30000">30 seconds</option>
                <option value="60000">1 minute</option>
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={save}>💾 Save AI Config</button>
          </div>
        </div>
      </div>

      {/* IBM Credentials info */}
      <div className="card" style={{ marginTop:20, borderLeft:'3px solid var(--accent2)' }}>
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>🔑 IBM Cloud Credentials</h3>
        <div className="grid-3">
          <div><div className="metric-label">Project ID</div><div style={{ fontFamily:'monospace', fontSize:12, color:'var(--text-muted)', wordBreak:'break-all' }}>29f2b75e-ec3e-463c-b6de-aefa520a2d81</div></div>
          <div><div className="metric-label">IBM Orchestrate URL</div><div style={{ fontFamily:'monospace', fontSize:11, color:'var(--text-muted)', wordBreak:'break-all' }}>api.au-syd.watson-orchestrate.cloud.ibm.com</div></div>
          <div><div className="metric-label">Status</div><div><span className="badge badge-active">● Connected</span></div></div>
        </div>
      </div>
    </div>
  );
}
