const express = require('express');
const router  = express.Router();
const db      = require('../services/database');
const { authenticateToken } = require('../middleware/auth');
const { generateAirReading, generateWaterReading } = require('../services/simulator');

const THRESHOLDS = {
  air:   { pm25: 60, pm10: 100, co: 6, so2: 80, no2: 80, vocs: 1.5 },
  water: { ph_low: 6.5, ph_high: 8.5, cod: 200, bod: 60, tds: 1000, temperature: 40, turbidity: 30 }
};

function detectViolation(reading, type) {
  if (type === 'air') {
    if (reading.pm25  > THRESHOLDS.air.pm25)  return { param: 'PM2.5', value: reading.pm25,  threshold: THRESHOLDS.air.pm25  };
    if (reading.pm10  > THRESHOLDS.air.pm10)  return { param: 'PM10',  value: reading.pm10,  threshold: THRESHOLDS.air.pm10  };
    if (reading.co    > THRESHOLDS.air.co)    return { param: 'CO',    value: reading.co,    threshold: THRESHOLDS.air.co    };
    if (reading.so2   > THRESHOLDS.air.so2)   return { param: 'SO₂',   value: reading.so2,   threshold: THRESHOLDS.air.so2   };
    if (reading.no2   > THRESHOLDS.air.no2)   return { param: 'NO₂',   value: reading.no2,   threshold: THRESHOLDS.air.no2   };
    if (reading.vocs  > THRESHOLDS.air.vocs)  return { param: 'VOCs',  value: reading.vocs,  threshold: THRESHOLDS.air.vocs  };
  } else {
    if (reading.ph < THRESHOLDS.water.ph_low || reading.ph > THRESHOLDS.water.ph_high)
      return { param: 'pH', value: reading.ph, threshold: `${THRESHOLDS.water.ph_low}–${THRESHOLDS.water.ph_high}` };
    if (reading.cod  > THRESHOLDS.water.cod)  return { param: 'COD',         value: reading.cod,         threshold: THRESHOLDS.water.cod         };
    if (reading.bod  > THRESHOLDS.water.bod)  return { param: 'BOD',         value: reading.bod,         threshold: THRESHOLDS.water.bod         };
    if (reading.tds  > THRESHOLDS.water.tds)  return { param: 'TDS',         value: reading.tds,         threshold: THRESHOLDS.water.tds         };
    if (reading.temperature > THRESHOLDS.water.temperature)
      return { param: 'Temperature', value: reading.temperature, threshold: THRESHOLDS.water.temperature };
    if (reading.turbidity > THRESHOLDS.water.turbidity)
      return { param: 'Turbidity', value: reading.turbidity, threshold: THRESHOLDS.water.turbidity };
  }
  return null;
}

// GET /api/readings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { sensorId, type, limit = 50 } = req.query;
    let query = {};
    if (sensorId) query.sensorId = sensorId;
    if (type)     query.type = type;
    const readings = await db.find('readings', query);
    const sorted = readings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, Number(limit));
    res.json({ success: true, data: sorted, total: readings.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/readings — ingest new sensor reading
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { sensorId, type, ...values } = req.body;
    if (!sensorId || !type) {
      return res.status(400).json({ success: false, message: 'sensorId and type required' });
    }

    const reading = await db.insert('readings', {
      sensorId, type, ...values,
      timestamp: new Date().toISOString()
    });

    // Update sensor lastReading
    await db.update('sensors', { _id: sensorId }, { $set: { lastReading: reading.timestamp } });

    // Auto-detect violation
    const violation = detectViolation(values, type);
    if (violation) {
      const exceedPercent = typeof violation.threshold === 'number'
        ? Math.round((violation.value / violation.threshold - 1) * 100) : 0;
      const severity = exceedPercent > 100 ? 'critical' : exceedPercent > 50 ? 'high' : 'medium';

      // Get industry for sensor
      const sensors = await db.find('sensors', { _id: sensorId });
      const industryId = sensors[0]?.industryId;

      await db.insert('violations', {
        sensorId, industryId, readingId: reading._id,
        parameter: violation.param,
        measuredValue: violation.value,
        threshold: violation.threshold,
        exceedancePercent: exceedPercent,
        severity,
        type,
        status: 'open',
        detectedAt: new Date().toISOString()
      });
    }

    res.status(201).json({ success: true, data: reading, violationDetected: !!violation });
  } catch (err) {
    console.error('[readings/post]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/readings/live — generate live simulated reading
router.get('/live', authenticateToken, async (req, res) => {
  try {
    const { type = 'air' } = req.query;
    const reading = type === 'air' ? generateAirReading() : generateWaterReading();
    res.json({ success: true, data: reading });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
