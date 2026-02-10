import { Pool } from "pg";

// Database utility functions and types
export interface User {
  id: string;
  school_id: string;
  email: string;
  name: string;
  national_id?: string;
  role: "school_admin" | "teacher" | "student" | "parent" | "principal";
  profile: Record<string, unknown>;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Principal {
  id: string;
  school_id: string;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface School {
  id: string;
  name: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  established_year?: number;
  latitude?: number;
  longitude?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Class {
  id: string;
  school_id: string;
  name: string;
  grade_level?: string;
  section?: string;
  academic_year?: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Exam {
  id: string;
  school_id: string;
  class_id: string;
  subject_id?: string;
  teacher_id: string;
  title: string;
  description?: string;
  instructions?: string;
  duration_minutes?: number;
  total_points: number;
  starts_at?: Date;
  ends_at?: Date;
  status: "draft" | "published" | "active" | "ended" | "archived";
  settings: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

const databaseUrl = process.env.DATABASE_URL;
const databaseHost = process.env.DATABASE_HOST || "localhost";
const databasePort = parseInt(process.env.DATABASE_PORT || "5432");

const isLocalhost =
  databaseHost === "localhost" ||
  databaseHost === "127.0.0.1" ||
  databaseHost === "::1";

const sslEnabled =
  process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";

const sslConfig = sslEnabled
  ? {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    }
  : false;

const pool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: sslConfig,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: databaseHost,
        port: databasePort,
        database: process.env.DATABASE_NAME || "postgres",
        user: process.env.DATABASE_USER || "postgres",
        password: process.env.DATABASE_PASSWORD || "",
        ssl: sslConfig,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);

export default pool;

// Test connection function
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    console.log("Database connected successfully:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// Initialize comprehensive database schema based on PRD
export async function initializeDatabase() {
  try {
    const client = await pool.connect();

    // Enable UUID extension if not already enabled
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // Enable pgcrypto extension for password hashing
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    // Create ENUMs if they don't exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('school_admin', 'teacher', 'student', 'parent', 'principal');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add 'principal' to existing enum if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'principal' AND enumtypid = 'user_role'::regtype) THEN
          ALTER TYPE user_role ADD VALUE 'principal';
        END IF;
      EXCEPTION
        WHEN others THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE exam_status AS ENUM ('draft', 'published', 'active', 'ended', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE question_type AS ENUM ('mcq', 'descriptive', 'true_false', 'short_answer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE answer_status AS ENUM ('submitted', 'ai_graded', 'teacher_reviewed', 'finalized');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Schools table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        postal_code VARCHAR(10),
        phone VARCHAR(20),
        email VARCHAR(255),
        established_year INTEGER,
        grade_level VARCHAR(50),
        region VARCHAR(10),
        gender_type VARCHAR(10),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add latitude and longitude columns if they don't exist (for existing databases)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='schools' AND column_name='latitude') THEN
          ALTER TABLE schools ADD COLUMN latitude DECIMAL(10, 8);
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='schools' AND column_name='longitude') THEN
          ALTER TABLE schools ADD COLUMN longitude DECIMAL(11, 8);
        END IF;
      END $$;
    `);

    // Add postal_code column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='schools' AND column_name='postal_code') THEN
          ALTER TABLE schools ADD COLUMN postal_code VARCHAR(10);
        END IF;
      END $$;
    `);

    // Add grade_level column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='schools' AND column_name='grade_level') THEN
          ALTER TABLE schools ADD COLUMN grade_level VARCHAR(50);
        END IF;
      END $$;
    `);

    // Add region column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='schools' AND column_name='region') THEN
          ALTER TABLE schools ADD COLUMN region VARCHAR(10);
        END IF;
      END $$;
    `);

    // Add gender_type column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='schools' AND column_name='gender_type') THEN
          ALTER TABLE schools ADD COLUMN gender_type VARCHAR(10);
        END IF;
      END $$;
    `);

    // Users table (updated with school_id and enhanced structure)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        phone VARCHAR(20) UNIQUE, -- Phone number for OTP login
        name VARCHAR(255),
        national_id VARCHAR(10) UNIQUE, -- Iranian National ID (کد ملی)
        role user_role NOT NULL DEFAULT 'teacher',
        profile JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add phone column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='phone') THEN
          ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE;
        END IF;
      END $$;
    `);

    // Make email and password_hash nullable for OTP-based logins
    await client.query(`
      DO $$ 
      BEGIN
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
        ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
      EXCEPTION
        WHEN others THEN null;
      END $$;
    `);

    // Classes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        grade_level VARCHAR(10),
        section VARCHAR(10),
        academic_year VARCHAR(20),
        description TEXT,
        subject VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add subject column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='classes' AND column_name='subject') THEN
          ALTER TABLE classes ADD COLUMN subject VARCHAR(100);
        END IF;
      END $$;
    `);

    // Class memberships (many-to-many between users and classes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS class_memberships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL, -- 'teacher', 'student'
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(class_id, user_id)
      )
    `);

    // Parent-student relationships
    await client.query(`
      CREATE TABLE IF NOT EXISTS parent_student_relations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        relationship VARCHAR(50), -- 'father', 'mother', 'guardian'
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(parent_id, student_id)
      )
    `);

    // Subjects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        description TEXT,
        grade_level VARCHAR(10),  -- Added grade level field
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add unique constraint for school_id and name combination
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'subjects_school_id_name_key'
        ) THEN
          ALTER TABLE subjects 
          ADD CONSTRAINT subjects_school_id_name_key 
          UNIQUE (school_id, name);
        END IF;
      EXCEPTION
        WHEN others THEN null;
      END $$;
    `);

    // Teacher assignments table (missing table that caused the error)
    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
        subject TEXT,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        removed_at TIMESTAMPTZ
      )
    `);

    // Exams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        instructions TEXT,
        duration_minutes INTEGER,
        total_points NUMERIC DEFAULT 0,
        starts_at TIMESTAMPTZ,
        ends_at TIMESTAMPTZ,
        status exam_status DEFAULT 'draft',
        settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        question_order INTEGER NOT NULL,
        type question_type NOT NULL,
        content TEXT NOT NULL,
        choices JSONB, -- For MCQ questions
        correct_answer JSONB,
        points NUMERIC DEFAULT 1,
        explanation TEXT,
        difficulty_level INTEGER DEFAULT 1, -- 1-5
        tags TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Student answers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
        question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        answer JSONB NOT NULL,
        ai_score NUMERIC,
        ai_confidence NUMERIC,
        ai_feedback JSONB,
        teacher_score NUMERIC,
        final_score NUMERIC,
        graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        graded_at TIMESTAMPTZ,
        status answer_status NOT NULL DEFAULT 'submitted',
        remarks TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        UNIQUE(exam_id, question_id, student_id)
      )
    `);

    // Exam grades (final grades for each student per exam)
    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_grades (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        total_score NUMERIC,
        max_score NUMERIC,
        percentage NUMERIC,
        grade_letter VARCHAR(5),
        is_released BOOLEAN DEFAULT FALSE,
        computed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (exam_id, student_id)
      )
    `);

    // General class grades (for regular subject grades)
    await client.query(`
      CREATE TABLE IF NOT EXISTS class_grades (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        subject_name VARCHAR(255) NOT NULL,
        grade_value NUMERIC NOT NULL,
        max_score NUMERIC DEFAULT 100,
        percentage NUMERIC,
        grade_letter VARCHAR(5),
        term VARCHAR(50),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (class_id, student_id, subject_name, term)
      )
    `);

    // AI processing logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
        request_payload JSONB,
        response_payload JSONB,
        processing_time_ms INTEGER,
        success BOOLEAN,
        error_message TEXT,
        ai_model_version VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50), -- 'exam_published', 'grade_released', 'assignment_due', etc.
        data JSONB DEFAULT '{}'::jsonb,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Password reset tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // OTP tokens table for phone verification
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        phone VARCHAR(20) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Teacher reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // AI reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        analysis_points JSONB DEFAULT '{}'::jsonb, -- { strengths, weaknesses, recommendations, progress }
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Behavioral reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS behavioral_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_school_role ON users (school_id, role);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
      CREATE INDEX IF NOT EXISTS idx_users_national_id ON users (national_id);
      CREATE INDEX IF NOT EXISTS idx_class_memberships_user ON class_memberships (user_id);
      CREATE INDEX IF NOT EXISTS idx_class_memberships_class ON class_memberships (class_id);
      CREATE INDEX IF NOT EXISTS idx_exams_class_status ON exams (class_id, status);
      CREATE INDEX IF NOT EXISTS idx_questions_exam_order ON questions (exam_id, question_order);
      CREATE INDEX IF NOT EXISTS idx_answers_student_exam ON answers (student_id, exam_id);
      CREATE INDEX IF NOT EXISTS idx_answers_status ON answers (status);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_otp_tokens_phone_verified ON otp_tokens (phone, verified);
      CREATE INDEX IF NOT EXISTS idx_teacher_reports_teacher_student ON teacher_reports (teacher_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_teacher_reports_class ON teacher_reports (class_id);
      CREATE INDEX IF NOT EXISTS idx_ai_reports_student_class ON ai_reports (student_id, class_id);
      CREATE INDEX IF NOT EXISTS idx_behavioral_reports_teacher_student ON behavioral_reports (teacher_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_behavioral_reports_class ON behavioral_reports (class_id);
      CREATE INDEX IF NOT EXISTS idx_behavioral_reports_category ON behavioral_reports (category);
    `);

    // Create logs table for professional logging system
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        meta JSONB,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        url TEXT,
        method VARCHAR(10),
        status_code INTEGER,
        response_time INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes for logs table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs (timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs (level);
      CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_logs_url ON logs (url);
    `);

    // Create trigger function for updating updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
      CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
      CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_exams_updated_at ON exams;
      CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_teacher_reports_updated_at ON teacher_reports;
      CREATE TRIGGER update_teacher_reports_updated_at BEFORE UPDATE ON teacher_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_behavioral_reports_updated_at ON behavioral_reports;
      CREATE TRIGGER update_behavioral_reports_updated_at BEFORE UPDATE ON behavioral_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create educational_activities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS educational_activities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL, -- 'midterm_exam', 'monthly_exam', 'weekly_exam', 'class_activity', 'class_homework', 'home_homework'
        activity_title VARCHAR(255) NOT NULL,
        activity_date DATE NOT NULL,
        quantitative_score NUMERIC, -- For activities that have quantitative evaluation
        qualitative_evaluation TEXT, -- For activities that have qualitative evaluation
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes for educational_activities
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_educational_activities_class_id ON educational_activities(class_id);
      CREATE INDEX IF NOT EXISTS idx_educational_activities_subject_id ON educational_activities(subject_id);
      CREATE INDEX IF NOT EXISTS idx_educational_activities_student_id ON educational_activities(student_id);
      CREATE INDEX IF NOT EXISTS idx_educational_activities_teacher_id ON educational_activities(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_educational_activities_activity_date ON educational_activities(activity_date);
      CREATE INDEX IF NOT EXISTS idx_educational_activities_activity_type ON educational_activities(activity_type);
    `);

    // Add comments to describe the activity types and evaluation rules
    await client.query(`
      COMMENT ON COLUMN educational_activities.activity_type IS 'Allowed values: midterm_exam, monthly_exam, weekly_exam, class_activity, class_homework, home_homework';
      COMMENT ON COLUMN educational_activities.quantitative_score IS 'Required for: midterm_exam, monthly_exam, weekly_exam, class_activity, class_homework, home_homework';
      COMMENT ON COLUMN educational_activities.qualitative_evaluation IS 'Required for: class_activity, class_homework';
    `);

    // Create trigger function for updating educational_activities updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_educational_activities_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for educational_activities updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_educational_activities_updated_at ON educational_activities;
      CREATE TRIGGER update_educational_activities_updated_at 
      BEFORE UPDATE ON educational_activities 
      FOR EACH ROW 
      EXECUTE FUNCTION update_educational_activities_updated_at_column();
    `);

    console.log("Database schema initialized successfully");
    client.release();
    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  }
}

// Utility function to seed sample data for testing
export async function seedSampleData() {
  try {
    const client = await pool.connect();

    // Check if we already have sample data
    const existingSchool = await client.query("SELECT id FROM schools LIMIT 1");
    if (existingSchool.rows.length > 0) {
      console.log("Sample data already exists, skipping seed");
      client.release();
      return true;
    }

    // Create sample school
    const schoolResult = await client.query(`
      INSERT INTO schools (name, address, phone, email, established_year)
      VALUES ('دبیرستان نمونه شهید بهشتی', 'تهران، خیابان ولیعصر، شماره ۱۲۳', '02122334455', 'info@sample-school.ir', 1990)
      RETURNING id
    `);
    const schoolId = schoolResult.rows[0].id;

    // Create sample teacher
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash("123456", 12);

    const teacherResult = await client.query(
      `
      INSERT INTO users (school_id, email, password_hash, name, role, profile)
      VALUES ($1, 'teacher@example.com', $2, 'احمد محمدی', 'teacher', '{"subject": "ریاضی", "experience_years": 10}'::jsonb)
      RETURNING id
    `,
      [schoolId, hashedPassword]
    );
    const teacherId = teacherResult.rows[0].id;

    // Create sample subject
    const subjectResult = await client.query(
      `
      INSERT INTO subjects (school_id, name, code)
      VALUES ($1, 'ریاضی', 'MATH')
      RETURNING id
    `,
      [schoolId]
    );
    const subjectId = subjectResult.rows[0].id;

    // Create sample classes
    const classResult = await client.query(
      `
      INSERT INTO classes (school_id, name, grade_level, section, academic_year)
      VALUES ($1, 'دهم - الف', '10', 'A', '1403-1404')
      RETURNING id
    `,
      [schoolId]
    );
    const classId = classResult.rows[0].id;

    // Add teacher to class
    await client.query(
      `
      INSERT INTO class_memberships (class_id, user_id, role)
      VALUES ($1, $2, 'teacher')
    `,
      [classId, teacherId]
    );

    // Create sample students
    const students = [
      { name: "علی احمدی", email: "ali@example.com" },
      { name: "فاطمه رضایی", email: "fateme@example.com" },
      { name: "محمد کریمی", email: "mohammad@example.com" },
      { name: "زهرا محمودی", email: "zahra@example.com" },
      { name: "حسین جعفری", email: "hossein@example.com" },
    ];

    for (const student of students) {
      const studentResult = await client.query(
        `
        INSERT INTO users (school_id, email, password_hash, name, role, profile)
        VALUES ($1, $2, $3, $4, 'student', '{"grade": "10", "student_id": "${Math.floor(
          Math.random() * 10000
        )}"}'::jsonb)
        RETURNING id
      `,
        [schoolId, student.email, hashedPassword, student.name]
      );

      const studentId = studentResult.rows[0].id;

      // Add student to class
      await client.query(
        `
        INSERT INTO class_memberships (class_id, user_id, role)
        VALUES ($1, $2, 'student')
      `,
        [classId, studentId]
      );
    }

    // Create sample exams
    const examResult = await client.query(
      `
      INSERT INTO exams (school_id, class_id, subject_id, teacher_id, title, description, duration_minutes, total_points, status, starts_at, ends_at)
      VALUES ($1, $2, $3, $4, 'آزمون میان‌ترم ریاضی', 'آزمون شامل مباحث فصل ۱ تا ۳', 90, 20, 'active', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day')
      RETURNING id
    `,
      [schoolId, classId, subjectId, teacherId]
    );
    const examId = examResult.rows[0].id;

    // Create sample questions
    const questions = [
      {
        content: "۲ + ۲ چند است؟",
        type: "mcq",
        choices: JSON.stringify([
          { id: "a", text: "۳" },
          { id: "b", text: "۴" },
          { id: "c", text: "۵" },
        ]),
        correct_answer: JSON.stringify("b"),
        points: 2,
      },
      {
        content: "x + 5 = 10 را حل کنید.",
        type: "short_answer",
        correct_answer: JSON.stringify("5"),
        points: 3,
      },
    ];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      await client.query(
        `
        INSERT INTO questions (exam_id, author_id, question_order, type, content, choices, correct_answer, points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          examId,
          teacherId,
          i + 1,
          question.type,
          question.content,
          question.choices,
          question.correct_answer,
          question.points,
        ]
      );
    }

    // Create sample teacher reports
    const sampleStudents = await client.query(
      "SELECT id FROM users WHERE role = 'student' AND school_id = $1 LIMIT 2",
      [schoolId]
    );

    if (sampleStudents.rows.length >= 2) {
      // Add a teacher report for the first student
      await client.query(
        `
        INSERT INTO teacher_reports (teacher_id, student_id, class_id, content)
        VALUES ($1, $2, $3, $4)
      `,
        [
          teacherId,
          sampleStudents.rows[0].id,
          classId,
          "دانش‌آموز در درس ریاضی پیشرفت چشمگیری داشته است. تمرکز و توجه به مسائل پیچیده‌تر نسبت به ترم قبل بهبود یافته است.",
        ]
      );

      // Add an AI report for the first student
      await client.query(
        `
        INSERT INTO ai_reports (student_id, class_id, content, analysis_points)
        VALUES ($1, $2, $3, $4)
      `,
        [
          sampleStudents.rows[0].id,
          classId,
          "تحلیل عملکرد دانش‌آموز در درس ریاضی",
          JSON.stringify({
            strengths: [
              "درک خوب مفاهیم جبری",
              "توانایی حل مسائل پیچیده",
              "پیشرفت در نمرات آزمون‌ها",
            ],
            weaknesses: [
              "ضعف در مباحث هندسه",
              "سرعت پایین در حل مسائل زمان‌دار",
            ],
            recommendations: [
              "تمرین بیشتر در مباحث هندسی",
              "شرکت در جلسات تقویتی",
              "استفاده از نرم‌افزارهای آموزشی",
            ],
            progress: "پیشرفت ۲۰٪ نسبت به ترم قبل",
          }),
        ]
      );

      // Add a teacher report for the second student
      await client.query(
        `
        INSERT INTO teacher_reports (teacher_id, student_id, class_id, content)
        VALUES ($1, $2, $3, $4)
      `,
        [
          teacherId,
          sampleStudents.rows[1].id,
          classId,
          "دانش‌آموز در برخی مباحث دچار مشکل است و نیاز به حمایت بیشتر دارد. با این حال، انگیزه و تلاش او قابل تحسین است.",
        ]
      );
    }

    console.log("Sample data seeded successfully");
    client.release();
    return true;
  } catch (error) {
    console.error("Sample data seeding failed:", error);
    return false;
  }
}

// Utility function to fix data inconsistencies between teacher_assignments and class_memberships
export async function fixTeacherClassMemberships() {
  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Add teachers from teacher_assignments to class_memberships
      // This will fix existing data inconsistencies
      const result = await client.query(`
        INSERT INTO class_memberships (class_id, user_id, role)
        SELECT DISTINCT ta.class_id, ta.teacher_id, 'teacher'
        FROM teacher_assignments ta
        LEFT JOIN class_memberships cm ON ta.class_id = cm.class_id AND ta.teacher_id = cm.user_id
        WHERE cm.user_id IS NULL AND ta.removed_at IS NULL
        ON CONFLICT (class_id, user_id) DO NOTHING
      `);

      await client.query("COMMIT");

      console.log(`Fixed ${result.rowCount} teacher class membership records`);
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error in fixTeacherClassMemberships transaction:", error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Fixing teacher class memberships failed:", error);
    return false;
  }
}
