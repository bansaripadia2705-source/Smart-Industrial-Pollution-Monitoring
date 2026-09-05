const express = require('express');
const router  = express.Router();
const db      = require('../services/database');
const { authenticateToken } = require('../middleware/auth');

function computeRiskLevel(aqi, codValue, violationCount) {
  const score = (aqi / 150) * 0.4 + (codValue / 400) * 0.3 + (Math.min(violationCount, 10) / 10) * 0.3;
  if (score >= 0.75) return 'critical';
  if (score >= 0.50) return 'high';
  if (score >= 0.25) return 'medium';
  return 'low';
}

// GET /api/risk
router.get('/', authenticateToken, async (req, res) => {
  try {
    const risks = await db.find('riskAssessments', {});
    const sorted = risks.sort((a, b) => new Date(b.assessedAt) - new Date(a.assessedAt));

    const industries = await db.find('industries', {});
    const industryMap = Object.fromEntries(industries.map(i => [i._id, i.name]));

    const enriched = sorted.map(r => ({
      ...r,
      industryName: industryMap[r.industryId] || 'Unknown'
    }));

    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/risk/:industryId
router.get('/:industryId', authenticateToken, async (req, res) => {
  try {
    const risks = await db.find('riskAssessments', { industryId: req.params.industryId });
    const latest = risks.sort((a, b) => new Date(b.assessedAt) - new Date(a.assessedAt))[0];
    if (!latest) return res.status(404).json({ success: false, message: 'No risk assessment found' });
    res.json({ success: true, data: latest });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/risk/assess — run risk assessment for an industry
router.post('/assess', authenticateToken, async (req, res) => {
  try {
    const { industryId } = req.body;
    if (!industryId) return res.status(400).json({ success: false, message: 'industryId required' });

    const [readings, violations] = await Promise.all([
      db.find('readings', {}),
      db.find('violations', { industryId })
    ]);

    const airReadings   = readings.filter(r => r.type === 'air').slice(-10);
    const waterReadings = readings.filter(r => r.type === 'water').slice(-10);

    const avgAQI = airReadings.length
      ? airReadings.reduce((s, r) => s + (r.aqi || 0), 0) / airReadings.length : 0;
    const avgCOD = waterReadings.length
      ? waterReadings.reduce((s, r) => s + (r.cod || 0), 0) / waterReadings.length : 0;

    const openViolations = violations.filter(v => v.status === 'open').length;
    const riskLevel = computeRiskLevel(avgAQI, avgCOD, openViolations);

    const assessment = await db.insert('riskAssessments', {
      industryId,
      riskLevel,
      avgAQI: Math.round(avgAQI),
      avgCOD: Math.round(avgCOD),
      openViolations,
      affectedPopulation: Math.floor(Math.random() * 50000 + 5000),
      recommendations: riskLevel === 'critical'
        ? 'Immediate shutdown and GPCB inspection required'
        : riskLevel === 'high'
        ? 'Urgent corrective action and compliance report within 48 hrs'
        : riskLevel === 'medium'
        ? 'Review ETP performance and submit improvement plan'
        : 'Maintain current controls; schedule quarterly review',
      assessedAt: new Date().toISOString()
    });

    res.json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
