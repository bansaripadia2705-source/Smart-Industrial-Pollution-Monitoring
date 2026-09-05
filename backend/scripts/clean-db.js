/**
 * clean-db.js — Deletes all .db FILES (skips directories) and re-seeds fresh
 */
const fs   = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

console.log('🧹 Removing .db files from', dataDir);
if (fs.existsSync(dataDir)) {
  fs.readdirSync(dataDir).forEach(f => {
    const full = path.join(dataDir, f);
    // Only delete files, not directories (ecoguard.db is a legacy folder)
    if (f.endsWith('.db') && fs.statSync(full).isFile()) {
      fs.unlinkSync(full);
      console.log('   Deleted:', f);
    }
  });
}
console.log('✅ All .db files removed — run: node scripts/seed.js');
