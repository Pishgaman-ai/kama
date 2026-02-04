-- Script to create the class_grades table
-- Run this script directly in your PostgreSQL database

CREATE TABLE IF NOT EXISTS class_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
);