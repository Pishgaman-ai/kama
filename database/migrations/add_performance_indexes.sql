-- Performance Optimization Indexes
-- Run this file to improve database query performance

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_school_id_role ON users(school_id, role);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(national_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Indexes for classes table
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON classes(grade_level);

-- Indexes for class_memberships table
CREATE INDEX IF NOT EXISTS idx_class_memberships_class_id ON class_memberships(class_id);
CREATE INDEX IF NOT EXISTS idx_class_memberships_user_id ON class_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_class_memberships_role ON class_memberships(role);
CREATE INDEX IF NOT EXISTS idx_class_memberships_class_user ON class_memberships(class_id, user_id);

-- Indexes for teacher_assignments table
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject_id ON teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_removed_at ON teacher_assignments(removed_at);

-- Indexes for parent_student_relations table
CREATE INDEX IF NOT EXISTS idx_parent_student_relations_parent_id ON parent_student_relations(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_relations_student_id ON parent_student_relations(student_id);

-- Indexes for subjects table
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_grade_level ON subjects(grade_level);

-- Analyze tables to update statistics
ANALYZE users;
ANALYZE classes;
ANALYZE class_memberships;
ANALYZE teacher_assignments;
ANALYZE parent_student_relations;
ANALYZE subjects;

-- Display index information
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
