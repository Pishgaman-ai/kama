import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

import pkg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pkg;

// Database configuration
const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log("Starting database seeding...");

    // Check if schools already exist
    const schoolCount = await client.query("SELECT COUNT(*) FROM schools");
    if (parseInt(schoolCount.rows[0].count) > 0) {
      console.log(
        "Schools already exist in the database. Skipping school creation."
      );
    } else {
      // Insert sample schools
      await client.query(`
        INSERT INTO schools (id, name, address, phone, principal_name, established_date) VALUES
        ('550e8400-e29b-41d4-a716-446655440000', 'دبیرستان شهید بهشتی', 'تهران، خیابان بهشتی', '22334455', 'علی محمدی', '2005-09-01'),
        ('550e8400-e29b-41d4-a716-446655440001', 'دبیرستان تیزهوشان', 'تهران، شهرک غرب', '22556677', 'مریم رضوی', '2010-03-15'),
        ('550e8400-e29b-41d4-a716-446655440002', 'مدرسه نمونه دولتی', 'اصفهان، میدان نقش جهان', '33445566', 'حسین عبداللهی', '1998-05-20')
      `);
      console.log("Sample schools inserted");
    }

    // Check if users already exist
    const userCount = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCount.rows[0].count) > 1) {
      // More than 1 because we have the system admin now
      console.log(
        "Users already exist in the database. Skipping user creation."
      );
    } else {
      // Insert sample users with hashed passwords
      const users = [
        {
          id: "11111111-1111-1111-1111-111111111111",
          name: "احمد رضایی",
          email: "ahmad.rezaei@school1.ir",
          phone: "09121111111",
          national_id: "1234567890",
          role: "principal",
          password_hash: await bcrypt.hash("password123", 10),
          school_id: "550e8400-e29b-41d4-a716-446655440000",
        },
        {
          id: "22222222-2222-2222-2222-222222222222",
          name: "فاطمه احمدی",
          email: "fateme.ahmadi@school1.ir",
          phone: "09122222222",
          national_id: "1234567891",
          role: "teacher",
          password_hash: await bcrypt.hash("password123", 10),
          school_id: "550e8400-e29b-41d4-a716-446655440000",
        },
        {
          id: "33333333-3333-3333-3333-333333333333",
          name: "محمد حسنی",
          email: "mohammad.hasani@school1.ir",
          phone: "09123333333",
          national_id: "1234567892",
          role: "student",
          password_hash: await bcrypt.hash("password123", 10),
          school_id: "550e8400-e29b-41d4-a716-446655440000",
        },
        {
          id: "44444444-4444-4444-4444-444444444444",
          name: "زهرا محمدی",
          email: "zahra.mohammadi@school2.ir",
          phone: "09124444444",
          national_id: "1234567893",
          role: "principal",
          password_hash: await bcrypt.hash("password123", 10),
          school_id: "550e8400-e29b-41d4-a716-446655440001",
        },
      ];

      for (const user of users) {
        await client.query(
          `
          INSERT INTO users (id, name, email, phone, national_id, role, password_hash, school_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `,
          [
            user.id,
            user.name,
            user.email,
            user.phone,
            user.national_id,
            user.role,
            user.password_hash,
            user.school_id,
          ]
        );
      }
      console.log("Sample users inserted");
    }

    // Check if classrooms already exist
    const classroomCount = await client.query(
      "SELECT COUNT(*) FROM classrooms"
    );
    if (parseInt(classroomCount.rows[0].count) > 0) {
      console.log(
        "Classrooms already exist in the database. Skipping classroom creation."
      );
    } else {
      // Insert sample classrooms
      await client.query(`
        INSERT INTO classrooms (id, name, grade_level, capacity, school_id, teacher_id) VALUES
        ('660e8400-e29b-41d4-a716-446655440000', 'کلاس اول ۱', 1, 30, '550e8400-e29b-41d4-a716-446655440000', '22222222-2222-2222-2222-222222222222'),
        ('660e8400-e29b-41d4-a716-446655440001', 'کلاس دوم ۱', 2, 25, '550e8400-e29b-41d4-a716-446655440000', '22222222-2222-2222-2222-222222222222')
      `);
      console.log("Sample classrooms inserted");
    }

    // Check if subjects already exist
    const subjectCount = await client.query("SELECT COUNT(*) FROM subjects");
    if (parseInt(subjectCount.rows[0].count) > 0) {
      console.log(
        "Subjects already exist in the database. Skipping subject creation."
      );
    } else {
      // Insert sample subjects
      await client.query(`
        INSERT INTO subjects (id, name, grade_level, school_id) VALUES
        ('770e8400-e29b-41d4-a716-446655440000', 'ریاضی', 1, '550e8400-e29b-41d4-a716-446655440000'),
        ('770e8400-e29b-41d4-a716-446655440001', 'علوم', 1, '550e8400-e29b-41d4-a716-446655440000'),
        ('770e8400-e29b-41d4-a716-446655440002', 'ادبیات فارسی', 1, '550e8400-e29b-41d4-a716-446655440000')
      `);
      console.log("Sample subjects inserted");
    }

    // Check if enrollments already exist
    const enrollmentCount = await client.query(
      "SELECT COUNT(*) FROM enrollments"
    );
    if (parseInt(enrollmentCount.rows[0].count) > 0) {
      console.log(
        "Enrollments already exist in the database. Skipping enrollment creation."
      );
    } else {
      // Insert sample enrollments
      await client.query(`
        INSERT INTO enrollments (id, student_id, classroom_id, enrollment_date, status) VALUES
        ('880e8400-e29b-41d4-a716-446655440000', '33333333-3333-3333-3333-333333333333', '660e8400-e29b-41d4-a716-446655440000', '2024-09-01', 'active')
      `);
      console.log("Sample enrollments inserted");
    }

    // Check if lessons already exist
    const lessonCount = await client.query("SELECT COUNT(*) FROM lessons");
    if (parseInt(lessonCount.rows[0].count) > 0) {
      console.log(
        "Lessons already exist in the database. Skipping lesson creation."
      );
    } else {
      // Insert sample lessons
      await client.query(`
        INSERT INTO lessons (id, subject_id, teacher_id, classroom_id, scheduled_time, duration_minutes, description) VALUES
        ('990e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', '22222222-2222-2222-2222-222222222222', '660e8400-e29b-41d4-a716-446655440000', '2024-09-15 08:00:00', 90, 'فصل اول ریاضی')
      `);
      console.log("Sample lessons inserted");
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Call the seed function
seedDatabase().catch(console.error);
