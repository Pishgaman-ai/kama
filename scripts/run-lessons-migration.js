const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting lessons table migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'create_lessons_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    console.log('📊 Creating lessons table...');
    await client.query(migrationSQL);

    console.log('\n✅ Lessons table migration completed successfully!');
    console.log('\n📋 Important Notes:');
    console.log('   - New table "lessons" has been created');
    console.log('   - School managers can now create and manage lessons by grade level');
    console.log('   - Each lesson is linked to a school and grade level');
    console.log('   - Indexes have been created for optimal query performance');

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
