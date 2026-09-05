const express = require('express');
const router  = express.Router();
const db      = require('../services/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/industries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { zone, type, compliance } = req.query;
    let query = {};
    if (zone)       query.zone = zone;
    if (type)       query.industryType = type;
    if (compliance === 'compliant')     query.complianceScore = { $gte: 70 };
    if (compliance === 'non-compliant') query.complianceScore = { $lt: 70 };

    const industries = await db.find('industries', query);
    res.json({ success: true, data: industries, total: industries.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/industries/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const industries = await db.find('industries', { _id: req.params.id });
    if (!industries.length) return res.status(404).json({ success: false, message: 'Industry not found' });
    res.json({ success: true, data: industries[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/industries
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, industryType, zone, location, licenseNo, contactPerson, contactEmail } = req.body;
    if (!name || !industryType || !zone) {
      return res.status(400).json({ success: false, message: 'name, industryType and zone are required' });
    }
    const industry = await db.insert('industries', {
      name, industryType, zone, location,
      licenseNo, contactPerson, contactEmail,
      complianceScore: 100,
      status: 'active',
      registeredAt: new Date().toISOString()
    });
    res.status(201).json({ success: true, data: industry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/industries/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await db.update('industries', { _id: req.params.id }, { $set: req.body });
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/industries/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.remove('industries', { _id: req.params.id });
    res.json({ success: true, message: 'Industry deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
