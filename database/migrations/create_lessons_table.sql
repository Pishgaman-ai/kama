-- Create lessons table for managing curriculum lessons by grade level
-- This allows school managers to define and edit lessons for each grade

CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    grade_level VARCHAR(50) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, title, grade_level)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_lessons_school_id ON lessons(school_id);
CREATE INDEX IF NOT EXISTS idx_lessons_grade_level ON lessons(grade_level);
CREATE INDEX IF NOT EXISTS idx_lessons_school_grade ON lessons(school_id, grade_level);
CREATE INDEX IF NOT EXISTS idx_lessons_created_by ON lessons(created_by);

-- Add comment
COMMENT ON TABLE lessons IS 'Curriculum lessons managed by school principals, organized by grade level';
COMMENT ON COLUMN lessons.school_id IS 'Reference to the school that owns this lesson';
COMMENT ON COLUMN lessons.title IS 'Lesson title';
COMMENT ON COLUMN lessons.description IS 'Detailed description of the lesson content';
COMMENT ON COLUMN lessons.grade_level IS 'Grade level this lesson is for (e.g., اول, دوم, etc.)';
COMMENT ON COLUMN lessons.created_by IS 'Principal who created this lesson';

-- Display confirmation
SELECT 'Migration completed: lessons table created' as message;
