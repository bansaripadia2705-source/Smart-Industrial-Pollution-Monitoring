const express = require('express');
const router  = express.Router();
const db      = require('../services/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [industries, sensors, violations, alerts, readings, risks] = await Promise.all([
      db.find('industries', {}),
      db.find('sensors', {}),
      db.find('violations', {}),
      db.find('alerts', {}),
      db.find('readings', {}),
      db.find('riskAssessments', {})
    ]);

    const activeSensors    = sensors.filter(s => s.status === 'active').length;
    const activeViolations = violations.filter(v => v.status === 'open' || v.status === 'escalated').length;
    const criticalAlerts   = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
    const compliantCount   = industries.filter(i => i.complianceScore >= 70).length;
    const avgCompliance    = industries.length
      ? Math.round(industries.reduce((s, i) => s + (i.complianceScore || 0), 0) / industries.length)
      : 0;

    // Latest air reading for AQI
    const airReadings = readings.filter(r => r.type === 'air').slice(-1);
    const currentAQI  = airReadings[0]?.aqi || 0;

    // High-risk zones
    const highRiskZones = risks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length;

    res.json({
      success: true,
      data: {
        totalIndustries:    industries.length,
        activeSensors,
        totalSensors:       sensors.length,
        currentAQI,
        aqiStatus:          currentAQI < 50 ? 'Good' : currentAQI < 100 ? 'Moderate' : currentAQI < 150 ? 'Unhealthy' : 'Hazardous',
        activeViolations,
        totalViolations:    violations.length,
        criticalAlerts,
        totalAlerts:        alerts.length,
        highRiskZones,
        avgComplianceScore: avgCompliance,
        compliantIndustries: compliantCount,
        totalReadings:      readings.length
      }
    });
  } catch (err) {
    console.error('[dashboard/stats]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/recent-incidents
router.get('/recent-incidents', authenticateToken, async (req, res) => {
  try {
    const violations = await db.find('violations', {});
    const recent = violations
      .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))
      .slice(0, 10);
    res.json({ success: true, data: recent });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/chart-data
router.get('/chart-data', authenticateToken, async (req, res) => {
  try {
    const readings = await db.find('readings', {});
    const airReadings   = readings.filter(r => r.type === 'air').slice(-24);
    const waterReadings = readings.filter(r => r.type === 'water').slice(-24);

    const labels = airReadings.map(r =>
      new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );

    res.json({
      success: true,
      data: {
        labels,
        pm25:  airReadings.map(r => r.pm25 || 0),
        so2:   airReadings.map(r => r.so2  || 0),
        no2:   airReadings.map(r => r.no2  || 0),
        cod:   waterReadings.map(r => r.cod || 0),
        bod:   waterReadings.map(r => r.bod || 0),
        ph:    waterReadings.map(r => r.ph  || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
