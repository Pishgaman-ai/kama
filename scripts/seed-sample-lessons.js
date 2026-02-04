const { Pool } = require('pg');
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

// Sample lessons for different grade levels
const sampleLessons = [
  // دبستان
  { title: 'فارسی', grade_level: 'اول', description: 'آموزش خواندن و نوشتن فارسی' },
  { title: 'ریاضی', grade_level: 'اول', description: 'آموزش مفاهیم ابتدایی ریاضی' },
  { title: 'علوم', grade_level: 'اول', description: 'آشنایی با مفاهیم علوم طبیعی' },

  { title: 'فارسی', grade_level: 'دوم', description: 'ادامه آموزش فارسی' },
  { title: 'ریاضی', grade_level: 'دوم', description: 'ادامه آموزش ریاضی' },
  { title: 'علوم', grade_level: 'دوم', description: 'ادامه آموزش علوم' },

  { title: 'فارسی', grade_level: 'سوم', description: 'آموزش پیشرفته فارسی' },
  { title: 'ریاضی', grade_level: 'سوم', description: 'آموزش پیشرفته ریاضی' },
  { title: 'علوم', grade_level: 'سوم', description: 'آموزش پیشرفته علوم' },

  // متوسطه اول
  { title: 'فارسی', grade_level: 'هفتم', description: 'ادبیات فارسی' },
  { title: 'ریاضی', grade_level: 'هفتم', description: 'ریاضی متوسطه اول' },
  { title: 'علوم', grade_level: 'هفتم', description: 'علوم تجربی' },
  { title: 'مطالعات اجتماعی', grade_level: 'هفتم', description: 'تاریخ و جغرافیا' },
  { title: 'زبان انگلیسی', grade_level: 'هفتم', description: 'آموزش زبان انگلیسی' },

  { title: 'فارسی', grade_level: 'هشتم', description: 'ادبیات فارسی' },
  { title: 'ریاضی', grade_level: 'هشتم', description: 'ریاضی متوسطه اول' },
  { title: 'علوم', grade_level: 'هشتم', description: 'علوم تجربی' },
  { title: 'مطالعات اجتماعی', grade_level: 'هشتم', description: 'تاریخ و جغرافیا' },
  { title: 'زبان انگلیسی', grade_level: 'هشتم', description: 'آموزش زبان انگلیسی' },

  { title: 'فارسی', grade_level: 'نهم', description: 'ادبیات فارسی' },
  { title: 'ریاضی', grade_level: 'نهم', description: 'ریاضی متوسطه اول' },
  { title: 'علوم', grade_level: 'نهم', description: 'علوم تجربی' },
  { title: 'مطالعات اجتماعی', grade_level: 'نهم', description: 'تاریخ و جغرافیا' },
  { title: 'زبان انگلیسی', grade_level: 'نهم', description: 'آموزش زبان انگلیسی' },

  // متوسطه دوم
  { title: 'فارسی', grade_level: 'دهم', description: 'ادبیات فارسی' },
  { title: 'ریاضی', grade_level: 'دهم', description: 'ریاضی و آمار' },
  { title: 'زیست‌شناسی', grade_level: 'دهم', description: 'علوم زیستی' },
  { title: 'فیزیک', grade_level: 'دهم', description: 'فیزیک پایه' },
  { title: 'شیمی', grade_level: 'دهم', description: 'شیمی پایه' },
  { title: 'زبان انگلیسی', grade_level: 'دهم', description: 'زبان خارجی' },
];

async function seedLessons() {
  const client = await pool.connect();

  try {
    console.log('🚀 شروع ایجاد دروس نمونه...\n');

    // Get the first school and principal from the database
    const schoolResult = await client.query('SELECT id FROM schools LIMIT 1');
    if (schoolResult.rows.length === 0) {
      console.log('❌ هیچ مدرسه‌ای یافت نشد. لطفاً ابتدا یک مدرسه ایجاد کنید.');
      return;
    }
    const schoolId = schoolResult.rows[0].id;

    const principalResult = await client.query(
      "SELECT id FROM users WHERE role = 'principal' AND school_id = $1 LIMIT 1",
      [schoolId]
    );
    if (principalResult.rows.length === 0) {
      console.log('❌ هیچ مدیری یافت نشد. لطفاً ابتدا یک مدیر ایجاد کنید.');
      return;
    }
    const principalId = principalResult.rows[0].id;

    console.log(`📚 ایجاد ${sampleLessons.length} درس برای مدرسه با شناسه: ${schoolId}\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const lesson of sampleLessons) {
      try {
        // Check if lesson already exists
        const existingLesson = await client.query(
          'SELECT id FROM lessons WHERE school_id = $1 AND title = $2 AND grade_level = $3',
          [schoolId, lesson.title, lesson.grade_level]
        );

        if (existingLesson.rows.length > 0) {
          console.log(`⏭️  رد شد: ${lesson.title} - ${lesson.grade_level} (قبلاً وجود دارد)`);
          skipCount++;
          continue;
        }

        await client.query(
          `INSERT INTO lessons (school_id, title, description, grade_level, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [schoolId, lesson.title, lesson.description, lesson.grade_level, principalId]
        );

        console.log(`✅ ایجاد شد: ${lesson.title} - ${lesson.grade_level}`);
        successCount++;
      } catch (error) {
        console.error(`❌ خطا در ایجاد درس ${lesson.title} - ${lesson.grade_level}:`, error.message);
      }
    }

    console.log(`\n📊 خلاصه:`);
    console.log(`   ✅ ${successCount} درس با موفقیت ایجاد شد`);
    console.log(`   ⏭️  ${skipCount} درس از قبل وجود داشت`);
    console.log(`   ❌ ${sampleLessons.length - successCount - skipCount} درس با خطا مواجه شد`);

  } catch (error) {
    console.error('❌ خطا:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedLessons()
  .then(() => {
    console.log('\n✅ کار تمام شد!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
