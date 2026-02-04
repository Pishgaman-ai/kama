const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function checkLessonsSchema() {
  const client = await pool.connect();

  try {
    console.log('🔍 بررسی schema جدول lessons...\n');

    const schemaResult = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'lessons'
      ORDER BY ordinal_position
    `);

    console.log('📋 ستون‌های جدول lessons:\n');
    schemaResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.column_name}`);
      console.log(`   Type: ${row.data_type}`);
      console.log(`   Nullable: ${row.is_nullable}`);
      console.log(`   Default: ${row.column_default || 'none'}`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

checkLessonsSchema()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
