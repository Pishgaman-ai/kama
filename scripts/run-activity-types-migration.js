const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration (matching src/lib/database.ts)
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
    console.log('🚀 Starting activity_types migration...');

    // Read migration SQL file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_create_activity_types_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');

    // Read seed SQL file
    const seedPath = path.join(__dirname, '..', 'database', 'seeds', '001_seed_default_activity_types.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    console.log('🌱 Seeding default activity types...');

    // Execute seed
    await client.query(seedSQL);
    console.log('✅ Seeding completed successfully!');

    // Verify
    const result = await client.query(`
      SELECT
        s.name as school_name,
        COUNT(at.id) as activity_types_count
      FROM schools s
      LEFT JOIN activity_types at ON s.id = at.school_id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    console.log('\n📊 Summary:');
    console.log('─'.repeat(50));
    result.rows.forEach(row => {
      console.log(`${row.school_name}: ${row.activity_types_count} activity types`);
    });
    console.log('─'.repeat(50));

  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  });
