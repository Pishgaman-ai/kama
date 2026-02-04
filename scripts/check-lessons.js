const { Pool } = require('pg');
const path = require('path');

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

async function checkLessons() {
  const client = await pool.connect();

  try {
    // Get school
    const schoolResult = await client.query('SELECT id, name FROM schools LIMIT 1');
    if (schoolResult.rows.length === 0) {
      console.log('❌ No schools found');
      return;
    }
    const school = schoolResult.rows[0];
    console.log(`\n📚 School: ${school.name} (${school.id})\n`);

    // Get grade levels with lesson count
    const gradeLevelsResult = await client.query(
      `
      SELECT DISTINCT grade_level, COUNT(*) as lesson_count
      FROM lessons
      WHERE school_id = $1
      GROUP BY grade_level
      ORDER BY grade_level
      `,
      [school.id]
    );

    console.log('📊 Grade Levels and Lesson Counts:');
    console.log('─'.repeat(50));

    if (gradeLevelsResult.rows.length === 0) {
      console.log('❌ No lessons found for this school!');
    } else {
      gradeLevelsResult.rows.forEach(row => {
        console.log(`  ${row.grade_level.padEnd(25)} → ${row.lesson_count} درس`);
      });
      console.log('─'.repeat(50));
      console.log(`\nTotal grade levels: ${gradeLevelsResult.rows.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkLessons();
