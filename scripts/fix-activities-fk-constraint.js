const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function fixForeignKeyConstraint() {
  const client = await pool.connect();

  try {
    console.log('🔍 بررسی constraint های جدول educational_activities...\n');

    // Check current constraints
    const constraintsResult = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'educational_activities'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);

    console.log('📋 Foreign key constraints موجود:');
    constraintsResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.constraint_name}`);
      console.log(`   ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    console.log('');

    await client.query('BEGIN');

    // Find the constraint that references subjects table
    const subjectFkConstraint = constraintsResult.rows.find(
      row => row.foreign_table_name === 'subjects' && row.column_name === 'subject_id'
    );

    if (subjectFkConstraint) {
      console.log(`🔧 حذف constraint قدیمی: ${subjectFkConstraint.constraint_name}`);

      await client.query(`
        ALTER TABLE educational_activities
        DROP CONSTRAINT ${subjectFkConstraint.constraint_name}
      `);

      console.log('✅ Constraint قدیمی حذف شد\n');
    } else {
      console.log('⚠️  Constraint مربوط به subjects یافت نشد\n');
    }

    // Add new constraint referencing lessons table
    console.log('➕ افزودن constraint جدید به lessons...');

    await client.query(`
      ALTER TABLE educational_activities
      ADD CONSTRAINT educational_activities_lesson_id_fkey
      FOREIGN KEY (subject_id)
      REFERENCES lessons(id)
      ON DELETE CASCADE
    `);

    console.log('✅ Constraint جدید اضافه شد\n');

    await client.query('COMMIT');

    // Verify the new constraint
    console.log('═'.repeat(70));
    console.log('✅ تکمیل شد! بررسی نهایی:\n');

    const finalCheck = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'educational_activities'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'subject_id'
    `);

    console.log('📋 Foreign key constraints جدید برای subject_id:');
    finalCheck.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.constraint_name}`);
      console.log(`   ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطا:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixForeignKeyConstraint()
  .then(() => {
    console.log('\n✨ Done!');
    console.log('\nحالا معلمان می‌توانند فعالیت ثبت کنند بدون خطای foreign key');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
