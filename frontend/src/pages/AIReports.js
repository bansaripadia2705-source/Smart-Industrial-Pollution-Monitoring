import React, { useState, useEffect } from 'react';
import { aiAPI } from '../services/api';

export default function AIReports() {
  const [reports, setReports]   = useState([]);
  const [genType, setGenType]   = useState('monthly');
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [generating, setGenerating] = useState(false);
  const [querying,   setQuerying]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    aiAPI.getReports()
      .then(r => setReports(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await aiAPI.generateReport({ reportType: genType });
      setReports(prev => [res.data.data, ...prev]);
      setSelected(res.data.data);
    } catch (err) {
      alert('Report generation failed: ' + (err.response?.data?.message || err.message));
    } finally { setGenerating(false); }
  };

  const askAI = async () => {
    if (!question.trim()) return;
    setQuerying(true);
    try {
      const res = await aiAPI.query(question);
      setAiAnswer(res.data.answer);
    } catch { setAiAnswer('AI query failed. Please try again.'); }
    finally { setQuerying(false); }
  };

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1>🤖 AI Reports</h1><p>IBM Granite LLM–powered environmental compliance reports</p></div>
      </div>

      {/* AI Query box */}
      <div className="card mb-20">
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>💬 Ask EcoGuard AI</h3>
        <div style={{ display:'flex', gap:10 }}>
          <input
            className="form-control"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="e.g. What are the main air pollutants in Vapi? What action should be taken for COD violations?"
            onKeyDown={e => e.key==='Enter' && askAI()}
          />
          <button className="btn btn-primary" onClick={askAI} disabled={querying || !question.trim()}>
            {querying ? '⏳ Thinking...' : '🤖 Ask AI'}
          </button>
        </div>
        {aiAnswer && (
          <div style={{ marginTop:12 }}>
            <div className="ai-badge">🤖 IBM Granite Response</div>
            <div className="ai-box" style={{ marginTop:6 }}>{aiAnswer}</div>
          </div>
        )}
      </div>

      {/* Generate Report */}
      <div className="card mb-20">
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>📋 Generate Compliance Report</h3>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <select className="form-control" style={{ width:'auto' }} value={genType} onChange={e=>setGenType(e.target.value)}>
            <option value="monthly">Monthly Report</option>
            <option value="weekly">Weekly Report</option>
            <option value="incident">Incident Report</option>
            <option value="annual">Annual Summary</option>
          </select>
          <button className="btn btn-primary" onClick={generateReport} disabled={generating}>
            {generating ? '⏳ Generating...' : '📄 Generate with IBM Granite'}
          </button>
        </div>
      </div>

      {/* Report list + viewer */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>📚 Report Archive ({reports.length})</h3>
          {reports.length === 0 ? <p style={{ color:'var(--text-muted)', fontSize:13 }}>No reports yet. Generate your first report above.</p> : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {reports.map(r => (
                <div key={r._id}
                  onClick={() => setSelected(r)}
                  style={{ padding:'10px 14px', borderRadius:8, background: selected?._id===r._id ? 'rgba(45,164,78,0.1)':'var(--bg3)', border:`1px solid ${selected?._id===r._id ? 'var(--accent)':'var(--border)'}`, cursor:'pointer' }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{r.reportType?.toUpperCase()} Report</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.industryName} · {new Date(r.generatedAt).toLocaleString()}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>By {r.generatedBy}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>📄 Report Content</h3>
          {selected ? (
            <>
              <div style={{ marginBottom:8, display:'flex', gap:8, flexWrap:'wrap' }}>
                <span className="badge" style={{ background:'rgba(45,164,78,0.15)', color:'var(--accent)' }}>{selected.reportType}</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(selected.generatedAt).toLocaleString()}</span>
              </div>
              <div className="ai-box" style={{ maxHeight:400, overflowY:'auto' }}>{selected.content}</div>
              {selected.stats && (
                <div style={{ marginTop:12, display:'flex', gap:12, flexWrap:'wrap', fontSize:11, color:'var(--text-muted)' }}>
                  <span>Violations: {selected.stats.violations}</span>
                  <span>Critical: {selected.stats.criticalCount}</span>
                  <span>Air readings: {selected.stats.airCount}</span>
                  <span>Water readings: {selected.stats.waterCount}</span>
                </div>
              )}
            </>
          ) : <p style={{ color:'var(--text-muted)', fontSize:13 }}>Select a report from the archive or generate a new one.</p>}
        </div>
      </div>
    </div>
  );
}
