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

async function checkTeacherAssignments() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking teacher assignments...\n');

    // Get all teachers
    const teachersResult = await client.query(`
      SELECT id, name, email, school_id
      FROM users
      WHERE role = 'teacher'
      ORDER BY name
      LIMIT 10
    `);

    console.log(`Found ${teachersResult.rows.length} teachers:\n`);

    for (const teacher of teachersResult.rows) {
      console.log(`\n📚 Teacher: ${teacher.name} (${teacher.email})`);
      console.log(`   ID: ${teacher.id}`);

      // Check teacher_assignments
      const assignmentsResult = await client.query(`
        SELECT
          ta.id,
          c.name as class_name,
          s.name as subject_name,
          ta.removed_at
        FROM teacher_assignments ta
        LEFT JOIN classes c ON ta.class_id = c.id
        LEFT JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.teacher_id = $1
      `, [teacher.id]);

      if (assignmentsResult.rows.length === 0) {
        console.log('   ⚠️  NO assignments found in teacher_assignments table');
      } else {
        console.log(`   ✅ ${assignmentsResult.rows.length} assignments found:`);
        assignmentsResult.rows.forEach((assignment, index) => {
          const status = assignment.removed_at ? '❌ Removed' : '✅ Active';
          console.log(`      ${index + 1}. ${assignment.class_name} - ${assignment.subject_name} ${status}`);
        });
      }

      // Check class_memberships
      const membershipsResult = await client.query(`
        SELECT
          cm.id,
          c.name as class_name,
          cm.role
        FROM class_memberships cm
        JOIN classes c ON cm.class_id = c.id
        WHERE cm.user_id = $1 AND cm.role = 'teacher'
      `, [teacher.id]);

      if (membershipsResult.rows.length === 0) {
        console.log('   ⚠️  NO class memberships found');
      } else {
        console.log(`   ✅ ${membershipsResult.rows.length} class memberships found:`);
        membershipsResult.rows.forEach((membership, index) => {
          console.log(`      ${index + 1}. ${membership.class_name}`);
        });
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('Summary:');
    console.log('─'.repeat(80));

    // Get teachers without assignments
    const noAssignmentsResult = await client.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        s.name as school_name
      FROM users u
      JOIN schools s ON u.school_id = s.id
      LEFT JOIN teacher_assignments ta ON u.id = ta.teacher_id AND ta.removed_at IS NULL
      WHERE u.role = 'teacher'
      GROUP BY u.id, u.name, u.email, s.name
      HAVING COUNT(ta.id) = 0
    `);

    if (noAssignmentsResult.rows.length > 0) {
      console.log(`\n⚠️  ${noAssignmentsResult.rows.length} teachers have NO active assignments:`);
      noAssignmentsResult.rows.forEach((teacher, index) => {
        console.log(`   ${index + 1}. ${teacher.name} (${teacher.email}) - ${teacher.school_name}`);
      });
    } else {
      console.log('\n✅ All teachers have active assignments!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run check
checkTeacherAssignments()
  .then(() => {
    console.log('\n✨ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error.message);
    process.exit(1);
  });
