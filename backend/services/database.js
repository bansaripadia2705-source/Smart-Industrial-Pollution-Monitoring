/**
 * EcoGuard AI – NeDB Database Service
 * Wraps @seald-io/nedb with a simple Promise-based API
 * Collections: users, industries, sensors, readings, violations, alerts,
 *              riskAssessments, reports, agentActivities
 */
const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs   = require('fs');

const dbDir = process.env.DB_PATH || path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

function createStore(name) {
  return new Datastore({ filename: path.join(dbDir, `${name}.db`), autoload: true });
}

const stores = {
  users:           createStore('users'),
  industries:      createStore('industries'),
  sensors:         createStore('sensors'),
  readings:        createStore('readings'),
  violations:      createStore('violations'),
  alerts:          createStore('alerts'),
  riskAssessments: createStore('riskAssessments'),
  reports:         createStore('reports'),
  agentActivities: createStore('agentActivities')
};

// Indexes
stores.users.ensureIndex({ fieldName: 'email', unique: true });
stores.sensors.ensureIndex({ fieldName: 'industryId' });
stores.readings.ensureIndex({ fieldName: 'sensorId' });
stores.violations.ensureIndex({ fieldName: 'industryId' });
stores.alerts.ensureIndex({ fieldName: 'industryId' });

function getStore(name) {
  if (!stores[name]) throw new Error(`Unknown collection: ${name}`);
  return stores[name];
}

/**
 * Find documents matching query
 */
const find = (collection, query = {}) =>
  new Promise((resolve, reject) => {
    getStore(collection).find(query, (err, docs) => err ? reject(err) : resolve(docs));
  });

/**
 * Find one document
 */
const findOne = (collection, query = {}) =>
  new Promise((resolve, reject) => {
    getStore(collection).findOne(query, (err, doc) => err ? reject(err) : resolve(doc));
  });

/**
 * Insert one document
 */
const insert = (collection, doc) =>
  new Promise((resolve, reject) => {
    getStore(collection).insert(doc, (err, newDoc) => err ? reject(err) : resolve(newDoc));
  });

/**
 * Update documents matching query
 * @param {object} update - MongoDB-style update ({$set: {...}} or replacement)
 * @param {object} options - { multi: true } to update multiple
 */
const update = (collection, query, update, options = {}) =>
  new Promise((resolve, reject) => {
    getStore(collection).update(query, update, options, (err, numAffected) =>
      err ? reject(err) : resolve(numAffected)
    );
  });

/**
 * Remove documents matching query
 */
const remove = (collection, query, options = {}) =>
  new Promise((resolve, reject) => {
    getStore(collection).remove(query, options, (err, numRemoved) =>
      err ? reject(err) : resolve(numRemoved)
    );
  });

/**
 * Count documents matching query
 */
const count = (collection, query = {}) =>
  new Promise((resolve, reject) => {
    getStore(collection).count(query, (err, n) => err ? reject(err) : resolve(n));
  });

module.exports = { find, findOne, insert, update, remove, count, stores };
