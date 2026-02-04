require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTable() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking if activity_types table exists...\n');

    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'activity_types'
      );
    `);

    if (result.rows[0].exists) {
      console.log('✅ Table activity_types EXISTS\n');

      // Check count
      const countResult = await client.query('SELECT COUNT(*) FROM activity_types');
      console.log(`📊 Total activity types: ${countResult.rows[0].count}\n`);

      // Show sample
      const sampleResult = await client.query('SELECT * FROM activity_types LIMIT 5');
      if (sampleResult.rows.length > 0) {
        console.log('📋 Sample data:');
        sampleResult.rows.forEach(row => {
          console.log(`   - ${row.persian_name} (${row.type_key})`);
        });
      }
    } else {
      console.log('❌ Table activity_types DOES NOT EXIST');
      console.log('   Need to run migration first!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable();
