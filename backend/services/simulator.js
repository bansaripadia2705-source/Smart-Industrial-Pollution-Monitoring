/**
 * Real-time data simulator — generates mock sensor readings
 * with normal, warning, high-risk and critical scenarios
 */

const THRESHOLDS = {
  air: {
    pm25:  { good: 30, warning: 60, critical: 120 },
    pm10:  { good: 60, warning: 100, critical: 200 },
    co:    { good: 2,  warning: 6,   critical: 10  },
    so2:   { good: 40, warning: 80,  critical: 150 },
    no2:   { good: 40, warning: 80,  critical: 150 },
    vocs:  { good: 0.5,warning: 1.5, critical: 3.0 }
  },
  water: {
    ph:    { good: [6.5, 8.5], warning: [6.0, 9.0], critical: [5.5, 9.5] },
    cod:   { good: 100, warning: 200, critical: 400 },
    bod:   { good: 30,  warning: 60,  critical: 100 },
    tds:   { good: 500, warning: 1000,critical: 2000 },
    temperature: { good: 30, warning: 40, critical: 50 },
    turbidity:   { good: 10, warning: 30, critical: 50 }
  }
};

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getStatus(param, value, type = 'air') {
  if (type === 'water' && param === 'ph') {
    const t = THRESHOLDS.water.ph;
    if (value >= t.good[0] && value <= t.good[1])    return 'normal';
    if (value >= t.warning[0] && value <= t.warning[1]) return 'warning';
    if (value >= t.critical[0] && value <= t.critical[1]) return 'high';
    return 'critical';
  }
  const t = (THRESHOLDS[type] || {})[param];
  if (!t) return 'normal';
  if (value <= t.good)    return 'normal';
  if (value <= t.warning) return 'warning';
  if (value <= t.critical) return 'high';
  return 'critical';
}

/**
 * Generate a single air quality reading
 */
function generateAirReading(scenario = 'normal') {
  const multipliers = { normal: 1, warning: 1.8, high: 2.8, critical: 4.2 };
  const m = multipliers[scenario] || 1;

  const pm25 = randomBetween(10 * m, 40 * m);
  const pm10 = randomBetween(20 * m, 70 * m);
  const co   = randomBetween(0.5 * m, 2.5 * m);
  const so2  = randomBetween(10 * m, 50 * m);
  const no2  = randomBetween(10 * m, 50 * m);
  const vocs = randomBetween(0.1 * m, 0.8 * m);

  return {
    pm25, pm10, co, so2, no2, vocs,
    aqi: Math.round((pm25 * 1.5 + pm10 * 0.5 + so2 * 0.8 + no2 * 0.8) / 3),
    status: getStatus('pm25', pm25, 'air'),
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate a single water quality reading
 */
function generateWaterReading(scenario = 'normal') {
  const multipliers = { normal: 1, warning: 1.8, high: 2.8, critical: 4.2 };
  const m = multipliers[scenario] || 1;

  const ph          = scenario === 'normal' ? randomBetween(6.8, 7.8) :
                      scenario === 'warning' ? randomBetween(6.0, 9.0) :
                      randomBetween(4.5, 10.5);
  const cod         = randomBetween(50 * m, 150 * m);
  const bod         = randomBetween(15 * m, 45 * m);
  const tds         = randomBetween(200 * m, 600 * m);
  const temperature = randomBetween(20 + 5 * (m - 1), 28 + 10 * (m - 1));
  const turbidity   = randomBetween(2 * m, 12 * m);

  return {
    ph, cod, bod, tds, temperature, turbidity,
    status: getStatus('cod', cod, 'water'),
    timestamp: new Date().toISOString()
  };
}

/**
 * Pick a random scenario weighted toward normal
 */
function randomScenario() {
  const r = Math.random();
  if (r < 0.55) return 'normal';
  if (r < 0.80) return 'warning';
  if (r < 0.93) return 'high';
  return 'critical';
}

/**
 * Generate a batch of historical readings for a sensor
 */
function generateHistoricalReadings(sensorId, sensorType, count = 24) {
  const readings = [];
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const ts = new Date(now - i * 3600 * 1000).toISOString();
    const scenario = randomScenario();
    const data = sensorType === 'air'
      ? generateAirReading(scenario)
      : generateWaterReading(scenario);
    readings.push({ ...data, sensorId, timestamp: ts, scenario });
  }
  return readings;
}

module.exports = {
  generateAirReading,
  generateWaterReading,
  generateHistoricalReadings,
  randomScenario,
  THRESHOLDS
};
