const express = require('express');
const router  = express.Router();
const db      = require('../services/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/sensors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { industryId, type, status } = req.query;
    let query = {};
    if (industryId) query.industryId = industryId;
    if (type)       query.sensorType = type;
    if (status)     query.status = status;
    const sensors = await db.find('sensors', query);
    res.json({ success: true, data: sensors, total: sensors.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/sensors/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sensors = await db.find('sensors', { _id: req.params.id });
    if (!sensors.length) return res.status(404).json({ success: false, message: 'Sensor not found' });
    res.json({ success: true, data: sensors[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/sensors
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, sensorType, industryId, location, parameters } = req.body;
    if (!name || !sensorType || !industryId) {
      return res.status(400).json({ success: false, message: 'name, sensorType and industryId are required' });
    }
    const sensor = await db.insert('sensors', {
      name, sensorType, industryId, location, parameters,
      status: 'active',
      lastReading: null,
      registeredAt: new Date().toISOString()
    });
    res.status(201).json({ success: true, data: sensor });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/sensors/:id/status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    await db.update('sensors', { _id: req.params.id }, { $set: { status } });
    res.json({ success: true, message: 'Sensor status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
