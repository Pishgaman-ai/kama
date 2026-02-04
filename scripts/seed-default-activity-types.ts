import { Client } from 'pg';

/**
 * Seed script to populate default activity types for all schools
 * Includes all 6 existing types + final_exam
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Default activity types configuration
const DEFAULT_ACTIVITY_TYPES = [
  {
    type_key: 'midterm_exam',
    persian_name: 'آزمون میان‌ترم',
    requires_quantitative_score: true,
    requires_qualitative_evaluation: false,
    display_order: 1
  },
  {
    type_key: 'monthly_exam',
    persian_name: 'آزمون ماهیانه',
    requires_quantitative_score: true,
    requires_qualitative_evaluation: false,
    display_order: 2
  },
  {
    type_key: 'weekly_exam',
    persian_name: 'آزمون هفتگی',
    requires_quantitative_score: true,
    requires_qualitative_evaluation: false,
    display_order: 3
  },
  {
    type_key: 'final_exam',
    persian_name: 'آزمون پایان ترم',
    requires_quantitative_score: true,
    requires_qualitative_evaluation: false,
    display_order: 4
  },
  {
    type_key: 'class_activity',
    persian_name: 'فعالیت کلاسی',
    requires_quantitative_score: true,
    requires_qualitative_evaluation: true,
    display_order: 5
  },
  {
    type_key: 'class_homework',
    persian_name: 'تکلیف کلاسی',
    requires_quantitative_score: true,
    requires_qualitative_evaluation: true,
    display_order: 6
  },
  {
    type_key: 'home_homework',
    persian_name: 'تکلیف منزل',
    requires_quantitative_score: true,
    requires_qualitative_evaluation: false,
    display_order: 7
  }
];

async function seedDefaultActivityTypes() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get all schools
    const schoolsResult = await client.query(`
      SELECT id, name FROM schools ORDER BY name
    `);

    const schools = schoolsResult.rows;
    console.log(`Found ${schools.length} school(s)`);

    if (schools.length === 0) {
      console.log('⚠️  No schools found. Please create schools first.');
      return;
    }

    // For each school, insert default activity types
    for (const school of schools) {
      console.log(`\nProcessing school: ${school.name} (${school.id})`);

      for (const activityType of DEFAULT_ACTIVITY_TYPES) {
        try {
          // Check if activity type already exists for this school
          const existingResult = await client.query(
            `SELECT id FROM activity_types WHERE school_id = $1 AND type_key = $2`,
            [school.id, activityType.type_key]
          );

          if (existingResult.rows.length > 0) {
            console.log(`  ⏭️  ${activityType.persian_name} already exists, skipping`);
            continue;
          }

          // Insert activity type
          await client.query(
            `INSERT INTO activity_types (
              school_id,
              type_key,
              persian_name,
              requires_quantitative_score,
              requires_qualitative_evaluation,
              display_order,
              is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              school.id,
              activityType.type_key,
              activityType.persian_name,
              activityType.requires_quantitative_score,
              activityType.requires_qualitative_evaluation,
              activityType.display_order,
              true
            ]
          );

          console.log(`  ✅ Added: ${activityType.persian_name}`);
        } catch (error) {
          console.error(`  ❌ Error adding ${activityType.persian_name}:`, error);
        }
      }
    }

    // Display summary
    const summaryResult = await client.query(`
      SELECT
        s.name as school_name,
        COUNT(at.id) as activity_types_count
      FROM schools s
      LEFT JOIN activity_types at ON s.id = at.school_id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    console.log('\n📊 Summary:');
    console.log('═══════════════════════════════════════');
    summaryResult.rows.forEach(row => {
      console.log(`${row.school_name}: ${row.activity_types_count} activity types`);
    });
    console.log('═══════════════════════════════════════');

    console.log('\n🎉 Default activity types seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding activity types:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run seed script
seedDefaultActivityTypes()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
