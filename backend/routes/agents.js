const express = require('express');
const router  = express.Router();
const db      = require('../services/database');
const { authenticateToken } = require('../middleware/auth');

const AGENTS = [
  {
    id: 'monitoring-agent',
    name: 'Emission & Effluent Monitoring Agent',
    description: 'Continuously monitors air and water sensor data, detects abnormal pollution levels and stores readings in IBM Cloud.',
    icon: '🔬',
    status: 'active'
  },
  {
    id: 'violation-agent',
    name: 'Violation Detection & Compliance Agent',
    description: 'Compares pollution readings with configured environmental limits, detects potential violations and assigns severity levels.',
    icon: '⚠️',
    status: 'active'
  },
  {
    id: 'regulatory-agent',
    name: 'Regulatory Alert & Escalation Agent',
    description: 'Generates regulatory alerts for high-severity violations, escalates unresolved incidents and creates compliance reports.',
    icon: '📋',
    status: 'active'
  },
  {
    id: 'health-agent',
    name: 'Public Health Risk Assessment Agent',
    description: 'Analyzes pollution levels, duration and location to estimate public-health risk and generates simple risk alerts.',
    icon: '🏥',
    status: 'active'
  },
  {
    id: 'investigation-agent',
    name: 'Pollution Investigation Agent',
    description: 'Investigates pollution spikes using historical sensor data and generates possible-cause summaries.',
    icon: '🔍',
    status: 'active'
  },
  {
    id: 'dashboard-agent',
    name: 'Industrial Pollution Dashboard Agent',
    description: 'Shows live pollution readings, trends, violations, risk levels, industry compliance and alerts.',
    icon: '📊',
    status: 'active'
  }
];

// GET /api/agents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const activities = await db.find('agentActivities', {});
    const agentsWithStats = AGENTS.map(agent => {
      const agentActivities = activities.filter(a => a.agentId === agent.id);
      const recentActivity = agentActivities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      return {
        ...agent,
        totalActivities: agentActivities.length,
        lastActivity: recentActivity?.timestamp || null,
        lastAction: recentActivity?.action || 'Idle'
      };
    });
    res.json({ success: true, data: agentsWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/agents/:id/activities
router.get('/:id/activities', authenticateToken, async (req, res) => {
  try {
    const activities = await db.find('agentActivities', { agentId: req.params.id });
    const sorted = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
    res.json({ success: true, data: sorted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/agents/:id/trigger
router.post('/:id/trigger', authenticateToken, async (req, res) => {
  try {
    const { action, details } = req.body;
    const activity = await db.insert('agentActivities', {
      agentId: req.params.id,
      action: action || 'Manual trigger',
      details,
      triggeredBy: req.user.name,
      status: 'completed',
      timestamp: new Date().toISOString()
    });
    res.json({ success: true, data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
