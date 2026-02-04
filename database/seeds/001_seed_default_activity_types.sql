-- Seed: Default activity types for all schools
-- Date: 2025-12-29
-- Description: Populates default activity types (7 types) for all existing schools

-- Insert default activity types for each school
-- This uses a DO block to iterate over all schools

DO $$
DECLARE
  school_record RECORD;
BEGIN
  -- Loop through all schools
  FOR school_record IN SELECT id FROM schools
  LOOP
    -- Insert default activity types for this school (if not exists)

    -- 1. Midterm Exam
    INSERT INTO activity_types (school_id, type_key, persian_name, requires_quantitative_score, requires_qualitative_evaluation, display_order, is_active)
    VALUES (school_record.id, 'midterm_exam', 'آزمون میان‌ترم', true, false, 1, true)
    ON CONFLICT (school_id, type_key) DO NOTHING;

    -- 2. Monthly Exam
    INSERT INTO activity_types (school_id, type_key, persian_name, requires_quantitative_score, requires_qualitative_evaluation, display_order, is_active)
    VALUES (school_record.id, 'monthly_exam', 'آزمون ماهیانه', true, false, 2, true)
    ON CONFLICT (school_id, type_key) DO NOTHING;

    -- 3. Weekly Exam
    INSERT INTO activity_types (school_id, type_key, persian_name, requires_quantitative_score, requires_qualitative_evaluation, display_order, is_active)
    VALUES (school_record.id, 'weekly_exam', 'آزمون هفتگی', true, false, 3, true)
    ON CONFLICT (school_id, type_key) DO NOTHING;

    -- 4. Final Exam (NEW)
    INSERT INTO activity_types (school_id, type_key, persian_name, requires_quantitative_score, requires_qualitative_evaluation, display_order, is_active)
    VALUES (school_record.id, 'final_exam', 'آزمون پایان ترم', true, false, 4, true)
    ON CONFLICT (school_id, type_key) DO NOTHING;

    -- 5. Class Activity
    INSERT INTO activity_types (school_id, type_key, persian_name, requires_quantitative_score, requires_qualitative_evaluation, display_order, is_active)
    VALUES (school_record.id, 'class_activity', 'فعالیت کلاسی', true, true, 5, true)
    ON CONFLICT (school_id, type_key) DO NOTHING;

    -- 6. Class Homework
    INSERT INTO activity_types (school_id, type_key, persian_name, requires_quantitative_score, requires_qualitative_evaluation, display_order, is_active)
    VALUES (school_record.id, 'class_homework', 'تکلیف کلاسی', true, true, 6, true)
    ON CONFLICT (school_id, type_key) DO NOTHING;

    -- 7. Home Homework
    INSERT INTO activity_types (school_id, type_key, persian_name, requires_quantitative_score, requires_qualitative_evaluation, display_order, is_active)
    VALUES (school_record.id, 'home_homework', 'تکلیف منزل', true, false, 7, true)
    ON CONFLICT (school_id, type_key) DO NOTHING;

  END LOOP;

  RAISE NOTICE 'Default activity types seeded for % school(s)', (SELECT COUNT(*) FROM schools);
END $$;

-- Show summary
SELECT
  s.name as school_name,
  COUNT(at.id) as activity_types_count
FROM schools s
LEFT JOIN activity_types at ON s.id = at.school_id
GROUP BY s.id, s.name
ORDER BY s.name;
