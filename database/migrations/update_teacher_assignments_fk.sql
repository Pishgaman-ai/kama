-- Migration: Update teacher_assignments foreign key from subjects to lessons
-- Date: 2025-12-28

-- Drop the old foreign key constraint
ALTER TABLE teacher_assignments
DROP CONSTRAINT IF EXISTS teacher_assignments_subject_id_fkey;

-- Add new foreign key constraint pointing to lessons table
ALTER TABLE teacher_assignments
ADD CONSTRAINT teacher_assignments_subject_id_fkey
FOREIGN KEY (subject_id) REFERENCES lessons(id) ON DELETE CASCADE;
