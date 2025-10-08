#!/usr/bin/env node

/**
 * Migration Application Script
 * 
 * This script helps apply Supabase migrations programmatically.
 * Requires the Supabase service role key (not the anon key).
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/apply-migrations.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://htxtlyouzyxmbfbotbvf.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/apply-migrations.js');
  console.error('');
  console.error('Get your service role key from:');
  console.error('  https://app.supabase.com/project/htxtlyouzyxmbfbotbvf/settings/api');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

// Read all migration files
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort(); // They're already named with timestamps

console.log(`📦 Found ${migrationFiles.length} migration files`);
console.log('');

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function applyMigration(filename) {
  const filepath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filepath, 'utf8');
  
  console.log(`🔄 Applying: ${filename}`);
  
  try {
    await executeSql(sql);
    console.log(`✅ Success: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${filename}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting migration process...');
  console.log('📍 Target: ' + SUPABASE_URL);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const file of migrationFiles) {
    const success = await applyMigration(file);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log(''); // Empty line between migrations
  }

  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📦 Total: ${migrationFiles.length}`);
  
  if (failCount > 0) {
    console.log('');
    console.log('⚠️  Some migrations failed. This may be normal if tables already exist.');
    console.log('    Check the errors above for details.');
  }
  
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
