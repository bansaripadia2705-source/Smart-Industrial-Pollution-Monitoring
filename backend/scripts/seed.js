/**
 * EcoGuard AI – Database Seeder
 * Seeds realistic demo data: industries, sensors, readings, violations, alerts, risk assessments
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// ── Delete all .db files FIRST to prevent NeDB unique-constraint crashes ──────
const fs   = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '../data');
if (fs.existsSync(dataDir)) {
  fs.readdirSync(dataDir).forEach(f => {
    const full = path.join(dataDir, f);
    if (f.endsWith('.db') && fs.statSync(full).isFile()) {
      fs.unlinkSync(full);
    }
  });
}
// Re-require database AFTER files are deleted so NeDB starts with clean files
// (database.js is already required below via db, force fresh module)
Object.keys(require.cache).forEach(k => { if (k.includes('database')) delete require.cache[k]; });

const bcrypt = require('bcryptjs');
const db     = require('../services/database');
const { generateAirReading, generateWaterReading, randomScenario } = require('../services/simulator');

const INDUSTRIES = [
  { name: 'Vapi Chemical Works Ltd',          zone: 'Vapi',      industryType: 'Chemical',       licenseNo: 'GPCB-V-001', contactPerson: 'Rajesh Shah',    lat: 20.3718, lng: 72.9059, complianceScore: 45 },
  { name: 'Ankleshwar Dye Intermediates',      zone: 'Ankleshwar',industryType: 'Dye & Chemical',  licenseNo: 'GPCB-A-002', contactPerson: 'Priya Mehta',    lat: 21.6267, lng: 72.9961, complianceScore: 72 },
  { name: 'Gujarat Pharma Solutions',          zone: 'Vapi',      industryType: 'Pharmaceutical',  licenseNo: 'GPCB-V-003', contactPerson: 'Amit Patel',     lat: 20.3789, lng: 72.9123, complianceScore: 88 },
  { name: 'Vatva Textile Processing',          zone: 'Vatva',     industryType: 'Textile',         licenseNo: 'GPCB-T-004', contactPerson: 'Sunita Joshi',   lat: 22.9862, lng: 72.6112, complianceScore: 61 },
  { name: 'Ankleshwar Petrochemicals',         zone: 'Ankleshwar',industryType: 'Petrochemical',   licenseNo: 'GPCB-A-005', contactPerson: 'Vikram Singh',   lat: 21.6312, lng: 72.9876, complianceScore: 55 },
  { name: 'Vapi Plastics & Polymers',          zone: 'Vapi',      industryType: 'Plastics',        licenseNo: 'GPCB-V-006', contactPerson: 'Deepak Rathod',  lat: 20.3654, lng: 72.9201, complianceScore: 79 },
  { name: 'Golden Corridor Solvents',          zone: 'Ankleshwar',industryType: 'Chemical',        licenseNo: 'GPCB-A-007', contactPerson: 'Nandita Verma',  lat: 21.6189, lng: 72.9934, complianceScore: 33 },
  { name: 'Vatva Fertilizers India Ltd',       zone: 'Vatva',     industryType: 'Fertilizer',      licenseNo: 'GPCB-T-008', contactPerson: 'Ravi Kumar',     lat: 22.9912, lng: 72.6078, complianceScore: 91 },
  { name: 'Vapi Agrochemicals Pvt Ltd',        zone: 'Vapi',      industryType: 'Agrochemical',    licenseNo: 'GPCB-V-009', contactPerson: 'Monika Trivedi', lat: 20.3701, lng: 72.9145, complianceScore: 68 },
  { name: 'Ankleshwar Metal Finishing Works',  zone: 'Ankleshwar',industryType: 'Metal Processing',licenseNo: 'GPCB-A-010', contactPerson: 'Suresh Naik',   lat: 21.6345, lng: 73.0012, complianceScore: 42 }
];

const SENSOR_TEMPLATES = [
  { sensorType: 'air', name: 'Stack Emission Monitor',   parameters: ['PM2.5','PM10','SO2','NOx','CO','VOCs'] },
  { sensorType: 'air', name: 'Ambient Air Monitor',      parameters: ['PM2.5','PM10','CO','SO2','NO2'] },
  { sensorType: 'water', name: 'Effluent Discharge Monitor', parameters: ['pH','COD','BOD','TDS','Temperature','Turbidity'] },
  { sensorType: 'water', name: 'Inlet Water Monitor',    parameters: ['pH','TDS','Temperature','Turbidity'] },
  { sensorType: 'water', name: 'Process Wastewater Monitor', parameters: ['pH','COD','BOD','TDS'] }
];

const VIOLATION_SCENARIOS = [
  { parameter: 'PM2.5', measuredValue: 185, threshold: 60,  severity: 'critical', type: 'air'   },
  { parameter: 'SO₂',   measuredValue: 210, threshold: 80,  severity: 'critical', type: 'air'   },
  { parameter: 'COD',   measuredValue: 520, threshold: 200, severity: 'critical', type: 'water' },
  { parameter: 'pH',    measuredValue: 4.2, threshold: '6.5–8.5', severity: 'high', type: 'water' },
  { parameter: 'NO₂',   measuredValue: 130, threshold: 80,  severity: 'high',     type: 'air'   },
  { parameter: 'BOD',   measuredValue: 145, threshold: 60,  severity: 'high',     type: 'water' },
  { parameter: 'PM10',  measuredValue: 160, threshold: 100, severity: 'medium',   type: 'air'   },
  { parameter: 'TDS',   measuredValue: 1450,threshold: 1000,severity: 'medium',   type: 'water' },
  { parameter: 'CO',    measuredValue: 8.5, threshold: 6,   severity: 'medium',   type: 'air'   },
  { parameter: 'Turbidity', measuredValue: 45, threshold: 30, severity: 'medium', type: 'water' }
];

const ALERT_TEMPLATES = [
  { title: 'Critical SO₂ Spike Detected',        severity: 'critical', type: 'emission'   },
  { title: 'Effluent COD Exceeded 2.5× Limit',   severity: 'critical', type: 'effluent'   },
  { title: 'GPCB Inspection Notice Pending',      severity: 'high',    type: 'regulatory' },
  { title: 'Multiple Violations in 24 Hours',     severity: 'high',    type: 'compliance' },
  { title: 'pH Level Out of Permissible Range',   severity: 'high',    type: 'effluent'   },
  { title: 'Sensor Offline – Stack Monitor V-04', severity: 'medium',  type: 'system'     },
  { title: 'PM2.5 Above Warning Threshold',       severity: 'medium',  type: 'emission'   },
  { title: 'Monthly Compliance Report Due',       severity: 'low',     type: 'compliance' },
  { title: 'Scheduled ETP Maintenance Alert',     severity: 'low',     type: 'maintenance'},
  { title: 'Air Quality Index in Moderate Range', severity: 'low',     type: 'advisory'   }
];

async function seedUsers() {
  console.log('👤 Seeding users...');
  const password = await bcrypt.hash('Admin@123', 10);
  await db.insert('users', {
    name: 'Admin User', email: 'admin@ecoguard.ai',
    password, role: 'admin',
    createdAt: new Date().toISOString()
  });
  const viewerPass = await bcrypt.hash('Viewer@123', 10);
  await db.insert('users', {
    name: 'GPCB Inspector', email: 'inspector@gpcb.gov.in',
    password: viewerPass, role: 'inspector',
    createdAt: new Date().toISOString()
  });
  console.log('   ✓ Admin: admin@ecoguard.ai / Admin@123');
  console.log('   ✓ Inspector: inspector@gpcb.gov.in / Viewer@123');
}

async function seedIndustries() {
  console.log('🏭 Seeding industries...');
  const docs = [];
  for (const ind of INDUSTRIES) {
    const doc = await db.insert('industries', {
      ...ind,
      status: 'active',
      registeredAt: new Date(Date.now() - Math.random() * 365 * 24 * 3600 * 1000).toISOString()
    });
    docs.push(doc);
  }
  console.log(`   ✓ ${docs.length} industries created`);
  return docs;
}

async function seedSensors(industries) {
  console.log('📡 Seeding sensors...');
  const sensors = [];
  for (const industry of industries) {
    // Each industry gets 2 air sensors + 2 water sensors
    const templates = [
      SENSOR_TEMPLATES[0], SENSOR_TEMPLATES[1],
      SENSOR_TEMPLATES[2], SENSOR_TEMPLATES[3]
    ];
    for (const tmpl of templates) {
      const sensor = await db.insert('sensors', {
        name: `${tmpl.name} – ${industry.name.split(' ')[0]}`,
        sensorType: tmpl.sensorType,
        industryId: industry._id,
        parameters: tmpl.parameters,
        location: { lat: industry.lat + (Math.random() - 0.5) * 0.01, lng: industry.lng + (Math.random() - 0.5) * 0.01 },
        status: Math.random() > 0.1 ? 'active' : 'offline',
        lastReading: null,
        registeredAt: new Date().toISOString()
      });
      sensors.push({ ...sensor, industryId: industry._id });
    }
  }
  console.log(`   ✓ ${sensors.length} sensors created`);
  return sensors;
}

async function seedReadings(sensors) {
  console.log('📊 Seeding readings (this may take a moment)...');
  let count = 0;
  for (const sensor of sensors.filter(s => s.status !== 'offline')) {
    // 24 hours of hourly readings
    for (let h = 23; h >= 0; h--) {
      const ts = new Date(Date.now() - h * 3600 * 1000).toISOString();
      const scenario = randomScenario();
      const data = sensor.sensorType === 'air'
        ? generateAirReading(scenario)
        : generateWaterReading(scenario);
      await db.insert('readings', {
        ...data,
        sensorId: sensor._id,
        industryId: sensor.industryId,
        type: sensor.sensorType,
        scenario,
        timestamp: ts
      });
      count++;
    }
  }
  console.log(`   ✓ ${count} readings created`);
}

async function seedViolations(industries) {
  console.log('⚠️  Seeding violations...');
  const violations = [];
  for (let i = 0; i < 40; i++) {
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const scenario = VIOLATION_SCENARIOS[i % VIOLATION_SCENARIOS.length];
    const daysAgo  = Math.floor(Math.random() * 30);
    const statuses = ['open','open','open','acknowledged','resolved','escalated'];
    const status   = statuses[Math.floor(Math.random() * statuses.length)];

    const v = await db.insert('violations', {
      ...scenario,
      industryId: industry._id,
      sensorId: null,
      status,
      exceedancePercent: typeof scenario.threshold === 'number'
        ? Math.round((scenario.measuredValue / scenario.threshold - 1) * 100) : 0,
      detectedAt: new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    });
    violations.push(v);

    // Reduce compliance score for violating industries
    if (scenario.severity === 'critical' || scenario.severity === 'high') {
      await db.update('industries', { _id: industry._id }, {
        $set: { complianceScore: Math.max(10, industry.complianceScore - 5) }
      });
    }
  }
  console.log(`   ✓ ${violations.length} violations created`);
  return violations;
}

async function seedAlerts(industries, violations) {
  console.log('🚨 Seeding alerts...');
  let count = 0;
  for (let i = 0; i < 25; i++) {
    const tmpl     = ALERT_TEMPLATES[i % ALERT_TEMPLATES.length];
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const violation= violations[Math.floor(Math.random() * violations.length)];
    const statuses = ['active','active','acknowledged','resolved'];
    const status   = statuses[Math.floor(Math.random() * statuses.length)];
    const daysAgo  = Math.floor(Math.random() * 14);

    await db.insert('alerts', {
      ...tmpl,
      message: `${tmpl.title} at ${industry.name}. Immediate action required.`,
      industryId: industry._id,
      violationId: violation._id,
      status,
      createdAt: new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString()
    });
    count++;
  }
  console.log(`   ✓ ${count} alerts created`);
}

async function seedRiskAssessments(industries) {
  console.log('🏥 Seeding risk assessments...');
  const levels = ['critical','high','high','medium','medium','medium','low','low','low','low'];
  for (let i = 0; i < industries.length; i++) {
    const industry = industries[i];
    const riskLevel = levels[i % levels.length];
    await db.insert('riskAssessments', {
      industryId: industry._id,
      industryName: industry.name,
      riskLevel,
      avgAQI: Math.floor(Math.random() * 200 + 50),
      avgCOD: Math.floor(Math.random() * 400 + 50),
      openViolations: Math.floor(Math.random() * 8),
      affectedPopulation: Math.floor(Math.random() * 50000 + 5000),
      recommendations: riskLevel === 'critical'
        ? 'Immediate shutdown and GPCB inspection required.'
        : riskLevel === 'high'
        ? 'Urgent corrective action and compliance report within 48 hrs.'
        : riskLevel === 'medium'
        ? 'Review ETP performance and submit improvement plan.'
        : 'Maintain current controls; schedule quarterly review.',
      assessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000).toISOString()
    });
  }
  console.log(`   ✓ ${industries.length} risk assessments created`);
}

async function seedAgentActivities() {
  console.log('🤖 Seeding agent activities...');
  const agentIds = ['monitoring-agent','violation-agent','regulatory-agent','health-agent','investigation-agent','dashboard-agent'];
  const actions  = [
    'Sensor data ingested and validated',
    'Anomaly detected – reading flagged for review',
    'Violation threshold check completed',
    'Compliance report generated',
    'Health risk assessment updated',
    'Pollution spike investigated – cause identified',
    'Dashboard metrics refreshed',
    'GPCB alert notification dispatched',
    'Historical data analysis completed',
    'Real-time monitoring cycle completed'
  ];
  let count = 0;
  for (const agentId of agentIds) {
    for (let i = 0; i < 10; i++) {
      await db.insert('agentActivities', {
        agentId,
        action: actions[Math.floor(Math.random() * actions.length)],
        status: 'completed',
        timestamp: new Date(Date.now() - Math.random() * 24 * 3600 * 1000).toISOString()
      });
      count++;
    }
  }
  console.log(`   ✓ ${count} agent activities created`);
}

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  EcoGuard AI – Database Seeder             ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log('🧹 Old .db files deleted (fresh start)');

  await seedUsers();
  const industries = await seedIndustries();
  const sensors    = await seedSensors(industries);
  await seedReadings(sensors);
  const violations = await seedViolations(industries);
  await seedAlerts(industries, violations);
  await seedRiskAssessments(industries);
  await seedAgentActivities();

  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('  Login: admin@ecoguard.ai / Admin@123');
  console.log('');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
