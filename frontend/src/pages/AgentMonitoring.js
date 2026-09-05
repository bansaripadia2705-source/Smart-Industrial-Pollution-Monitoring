import React, { useState, useEffect } from 'react';
import { agentsAPI } from '../services/api';

const AGENT_ICONS = {
  'monitoring-agent':  '🔬',
  'violation-agent':   '⚠️',
  'regulatory-agent':  '📋',
  'health-agent':      '🏥',
  'investigation-agent':'🔍',
  'dashboard-agent':   '📊'
};

export default function AgentMonitoring() {
  const [agents, setAgents]   = useState([]);
  const [activities, setActivities] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [triggering, setTriggering] = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    agentsAPI.getAll()
      .then(r => setAgents(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadActivities = async (agentId) => {
    setSelected(agentId);
    const res = await agentsAPI.getActivities(agentId);
    setActivities(res.data.data || []);
  };

  const trigger = async (agentId) => {
    setTriggering(agentId);
    try {
      await agentsAPI.trigger(agentId, { action:'Manual trigger from dashboard' });
      await loadActivities(agentId);
    } catch { alert('Trigger failed'); }
    finally { setTriggering(''); }
  };

  if (loading) return <div className="full-loader"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙️ Agent Monitoring</h1>
        <p>Status and activity log of all EcoGuard AI agents</p>
      </div>

      <div className="grid-2">
        <div>
          {/* Agent cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {agents.map(agent => (
              <div
                key={agent.id}
                className="agent-card"
                style={{ borderLeft:`3px solid ${agent.status==='active'?'var(--accent)':'var(--border)'}`, cursor:'pointer', background: selected===agent.id ? 'rgba(45,164,78,0.05)':'' }}
                onClick={() => loadActivities(agent.id)}
              >
                <div className="flex-between">
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:28 }}>{AGENT_ICONS[agent.id] || '🤖'}</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{agent.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{agent.description}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <span className={`badge badge-${agent.status}`}>{agent.status}</span>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                      {agent.totalActivities} activities
                    </div>
                  </div>
                </div>
                <div style={{ marginTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                    Last: {agent.lastActivity ? new Date(agent.lastActivity).toLocaleTimeString() : 'No activity'}<br/>
                    Action: {agent.lastAction}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={e => { e.stopPropagation(); trigger(agent.id); }}
                    disabled={triggering === agent.id}
                  >
                    {triggering === agent.id ? '⏳' : '▶️ Trigger'}
                  </button>
                </div>
                {/* Activity bar */}
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:3 }}>Activity Level</div>
                  <div className="progress-bar">
                    <div className="progress-fill green" style={{ width:`${Math.min(100, agent.totalActivities * 10)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity log */}
        <div className="card" style={{ height:'fit-content', position:'sticky', top:72 }}>
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>
            📋 Activity Log {selected && `– ${agents.find(a=>a.id===selected)?.name.split(' ')[0]}`}
          </h3>
          {!selected && <p style={{ color:'var(--text-muted)', fontSize:13 }}>Click an agent to view its activity log.</p>}
          {activities.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:500, overflowY:'auto' }}>
              {activities.map((act, i) => (
                <div key={act._id || i} style={{ padding:'8px 12px', background:'var(--bg3)', borderRadius:6, fontSize:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                    <span>✓ {act.action}</span>
                    <span style={{ fontSize:10, color:'var(--text-muted)', flexShrink:0 }}>{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {act.triggeredBy && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>By: {act.triggeredBy}</div>}
                </div>
              ))}
            </div>
          )}
          {selected && activities.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:13 }}>No activities yet.</p>}
        </div>
      </div>
    </div>
  );
}
