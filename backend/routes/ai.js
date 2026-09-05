const express = require('express');
const router  = express.Router();
const db      = require('../services/database');
const { authenticateToken } = require('../middleware/auth');
const { generateText } = require('../services/watsonx');

// POST /api/ai/summarize
router.post('/summarize', authenticateToken, async (req, res) => {
  try {
    const { type, data } = req.body;
    let prompt = '';

    if (type === 'violation') {
      prompt = `You are an environmental compliance expert for the Vapi–Ankleshwar–Vatva industrial corridor in Gujarat, India.\nAnalyze this pollution violation and provide a concise 3-paragraph compliance report:\n- Parameter: ${data.parameter}\n- Measured Value: ${data.measuredValue}\n- Threshold: ${data.threshold}\n- Severity: ${data.severity}\n- Industry: ${data.industryName || 'Unknown'}\n- Date: ${data.detectedAt}\nProvide: 1) Summary, 2) Health/environmental impact, 3) Recommended action.`;
    } else if (type === 'health_risk') {
      prompt = `You are a public health expert analyzing industrial pollution risk in Gujarat, India.\nAssess this risk data and write a 2-paragraph public health advisory:\n- Risk Level: ${data.riskLevel}\n- Average AQI: ${data.avgAQI}\n- Average COD: ${data.avgCOD}\n- Open Violations: ${data.openViolations}\n- Affected Population: ${data.affectedPopulation}\nInclude health impacts and citizen advisories.`;
    } else if (type === 'air_quality') {
      prompt = `You are an air quality expert for the Vapi–Ankleshwar industrial corridor.\nSummarize this air quality data in 2 paragraphs:\n- AQI: ${data.aqi}\n- PM2.5: ${data.pm25} µg/m³\n- PM10: ${data.pm10} µg/m³\n- SO₂: ${data.so2} µg/m³\n- NO₂: ${data.no2} µg/m³\n- CO: ${data.co} mg/m³\nComment on compliance with NAAQS standards and recommend actions.`;
    } else if (type === 'water_quality') {
      prompt = `You are a water quality expert analyzing industrial effluent in Gujarat.\nSummarize this effluent data in 2 paragraphs:\n- pH: ${data.ph}\n- COD: ${data.cod} mg/L\n- BOD: ${data.bod} mg/L\n- TDS: ${data.tds} mg/L\n- Temperature: ${data.temperature}°C\n- Turbidity: ${data.turbidity} NTU\nComment on compliance with CPCB/GPCB norms and ETP performance.`;
    } else if (type === 'incident') {
      prompt = `Summarize this pollution incident for a regulatory report:\n${JSON.stringify(data, null, 2)}\nProvide a clear, professional summary in 3 sentences.`;
    } else {
      prompt = `You are EcoGuard AI, an environmental monitoring assistant for the Vapi–Ankleshwar–Vatva industrial corridor.\nAnswer this query based on industrial pollution monitoring context:\n${data.query || JSON.stringify(data)}`;
    }

    const summary = await generateText(prompt, 400);
    res.json({ success: true, summary });
  } catch (err) {
    console.error('[ai/summarize]', err);
    res.status(500).json({ success: false, message: 'AI service error' });
  }
});

// POST /api/ai/report
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const { reportType, dateRange, industryId } = req.body;

    const [violations, alerts, readings, industries] = await Promise.all([
      db.find('violations', industryId ? { industryId } : {}),
      db.find('alerts', {}),
      db.find('readings', {}),
      db.find('industries', industryId ? { _id: industryId } : {})
    ]);

    const industryName = industries[0]?.name || 'All Industries';
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const openCount     = violations.filter(v => v.status === 'open').length;
    const airCount      = readings.filter(r => r.type === 'air').length;
    const waterCount    = readings.filter(r => r.type === 'water').length;

    const prompt = `You are an environmental compliance officer generating an official ${reportType || 'monthly'} report for the Gujarat Pollution Control Board.\n\nReport for: ${industryName}\nPeriod: ${dateRange || 'Last 30 days'}\n\nData Summary:\n- Total Violations: ${violations.length} (${criticalCount} critical, ${openCount} open)\n- Active Alerts: ${alerts.filter(a => a.status === 'active').length}\n- Air Quality Readings: ${airCount}\n- Water Quality Readings: ${waterCount}\n\nGenerate a professional environmental compliance report with:\n1. Executive Summary\n2. Air Quality Analysis\n3. Water/Effluent Analysis\n4. Violation Summary\n5. Recommendations\n6. Conclusion\n\nUse formal regulatory language appropriate for GPCB submission.`;

    const reportContent = await generateText(prompt, 700);

    const report = await db.insert('reports', {
      reportType: reportType || 'monthly',
      industryId,
      industryName,
      dateRange: dateRange || 'Last 30 days',
      content: reportContent,
      generatedBy: req.user.name,
      generatedAt: new Date().toISOString(),
      stats: { violations: violations.length, criticalCount, openCount, airCount, waterCount }
    });

    res.json({ success: true, data: report });
  } catch (err) {
    console.error('[ai/report]', err);
    res.status(500).json({ success: false, message: 'Report generation error' });
  }
});

// GET /api/ai/reports
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const reports = await db.find('reports', {});
    const sorted = reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    res.json({ success: true, data: sorted, total: sorted.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/ai/query — natural language query
router.post('/query', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'question required' });

    const prompt = `You are EcoGuard AI, an intelligent assistant for the Vapi–Ankleshwar–Vatva industrial pollution monitoring system.\nAnswer this question concisely and accurately:\n\n${question}\n\nProvide a helpful, factual response in 2-3 sentences.`;
    const answer = await generateText(prompt, 256);
    res.json({ success: true, answer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI query error' });
  }
});

module.exports = router;
