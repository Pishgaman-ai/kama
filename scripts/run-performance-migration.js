const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting performance optimization migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_performance_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    console.log('📊 Creating indexes...');
    await client.query(migrationSQL);

    console.log('\n✅ Performance optimization migration completed successfully!');
    console.log('\n📈 Database indexes have been created.');
    console.log('⚡ Your API queries should now be significantly faster!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
