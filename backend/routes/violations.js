const express = require('express');
const router  = express.Router();
const db      = require('../services/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/violations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, severity, industryId, type } = req.query;
    let query = {};
    if (status)     query.status     = status;
    if (severity)   query.severity   = severity;
    if (industryId) query.industryId = industryId;
    if (type)       query.type       = type;

    const violations = await db.find('violations', query);
    const sorted = violations.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));

    // Enrich with industry names
    const industries = await db.find('industries', {});
    const industryMap = Object.fromEntries(industries.map(i => [i._id, i.name]));

    const enriched = sorted.map(v => ({
      ...v,
      industryName: industryMap[v.industryId] || 'Unknown'
    }));

    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/violations/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const violations = await db.find('violations', { _id: req.params.id });
    if (!violations.length) return res.status(404).json({ success: false, message: 'Violation not found' });
    res.json({ success: true, data: violations[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/violations/:id/status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['open', 'acknowledged', 'resolved', 'escalated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }
    await db.update('violations', { _id: req.params.id }, {
      $set: { status, notes, updatedAt: new Date().toISOString() }
    });
    res.json({ success: true, message: 'Violation status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/violations/stats/summary
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const violations = await db.find('violations', {});
    const summary = {
      total:    violations.length,
      open:     violations.filter(v => v.status === 'open').length,
      resolved: violations.filter(v => v.status === 'resolved').length,
      escalated:violations.filter(v => v.status === 'escalated').length,
      critical: violations.filter(v => v.severity === 'critical').length,
      high:     violations.filter(v => v.severity === 'high').length,
      medium:   violations.filter(v => v.severity === 'medium').length,
      low:      violations.filter(v => v.severity === 'low').length
    };
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
