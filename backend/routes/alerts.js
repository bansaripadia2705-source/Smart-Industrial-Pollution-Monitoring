const express = require('express');
const router  = express.Router();
const db      = require('../services/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, severity } = req.query;
    let query = {};
    if (status)   query.status   = status;
    if (severity) query.severity = severity;
    const alerts = await db.find('alerts', query);
    const sorted = alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: sorted, total: sorted.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/alerts
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, message, severity, type, industryId, violationId } = req.body;
    if (!title || !severity) {
      return res.status(400).json({ success: false, message: 'title and severity required' });
    }
    const alert = await db.insert('alerts', {
      title, message, severity, type,
      industryId, violationId,
      status: 'active',
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
      resolvedAt: null
    });
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    await db.update('alerts', { _id: req.params.id }, {
      $set: { status: 'acknowledged', acknowledgedAt: new Date().toISOString(), acknowledgedBy: req.user.name }
    });
    res.json({ success: true, message: 'Alert acknowledged' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    await db.update('alerts', { _id: req.params.id }, {
      $set: { status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: req.user.name }
    });
    res.json({ success: true, message: 'Alert resolved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.remove('alerts', { _id: req.params.id });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
