const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function checkSchema() {
  const client = await pool.connect();

  try {
    console.log('🔍 بررسی schema جدول educational_activities...\n');

    const schemaResult = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'educational_activities'
      ORDER BY ordinal_position
    `);

    console.log('📋 ستون‌های جدول educational_activities:\n');
    schemaResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.column_name}`);
      console.log(`   Type: ${row.data_type}`);
      console.log(`   Nullable: ${row.is_nullable}`);
    });

    // Get sample record
    console.log('\n═'.repeat(70));
    console.log('نمونه رکورد:\n');

    const sampleResult = await client.query(`
      SELECT * FROM educational_activities LIMIT 1
    `);

    if (sampleResult.rows.length > 0) {
      const sample = sampleResult.rows[0];
      Object.keys(sample).forEach((key) => {
        console.log(`${key}: ${sample[key]}`);
      });
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
