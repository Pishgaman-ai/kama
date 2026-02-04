const { Pool } = require('pg');

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

async function syncTeacherAssignments() {
  const client = await pool.connect();

  try {
    console.log('🔄 Syncing teacher assignments from class_memberships...\n');

    // Start transaction
    await client.query('BEGIN');

    // Get all teachers from class_memberships who don't have teacher_assignments
    const result = await client.query(`
      INSERT INTO teacher_assignments (class_id, teacher_id, subject, assigned_at)
      SELECT DISTINCT
        cm.class_id,
        cm.user_id as teacher_id,
        c.subject,
        cm.joined_at as assigned_at
      FROM class_memberships cm
      JOIN classes c ON cm.class_id = c.id
      JOIN users u ON cm.user_id = u.id
      LEFT JOIN teacher_assignments ta ON (
        ta.class_id = cm.class_id
        AND ta.teacher_id = cm.user_id
        AND ta.removed_at IS NULL
      )
      WHERE cm.role = 'teacher'
        AND u.role = 'teacher'
        AND ta.id IS NULL
      ON CONFLICT DO NOTHING
      RETURNING *
    `);

    console.log(`✅ Created ${result.rowCount} teacher assignment records\n`);

    // Update subject_id where possible
    const updateResult = await client.query(`
      UPDATE teacher_assignments ta
      SET subject_id = s.id
      FROM subjects s
      JOIN classes c ON s.school_id = c.school_id
      WHERE ta.subject_id IS NULL
        AND ta.class_id = c.id
        AND (
          ta.subject = s.name
          OR c.subject = s.name
        )
    `);

    console.log(`✅ Updated ${updateResult.rowCount} assignments with subject_id\n`);

    // Commit transaction
    await client.query('COMMIT');

    // Show summary
    console.log('📊 Summary:');
    console.log('─'.repeat(80));

    const summaryResult = await client.query(`
      SELECT
        u.name as teacher_name,
        u.email,
        c.name as class_name,
        COALESCE(s.name, ta.subject, c.subject) as subject_name
      FROM teacher_assignments ta
      JOIN users u ON ta.teacher_id = u.id
      JOIN classes c ON ta.class_id = c.id
      LEFT JOIN subjects s ON ta.subject_id = s.id
      WHERE ta.removed_at IS NULL
      ORDER BY u.name, c.name
    `);

    let currentTeacher = '';
    summaryResult.rows.forEach((row) => {
      if (row.teacher_name !== currentTeacher) {
        if (currentTeacher !== '') console.log('');
        console.log(`👨‍🏫 ${row.teacher_name} (${row.email})`);
        currentTeacher = row.teacher_name;
      }
      console.log(`   - ${row.class_name}: ${row.subject_name || 'بدون درس'}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`Total active assignments: ${summaryResult.rows.length}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run sync
syncTeacherAssignments()
  .then(() => {
    console.log('\n✨ Sync complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Sync failed:', error.message);
    process.exit(1);
  });
