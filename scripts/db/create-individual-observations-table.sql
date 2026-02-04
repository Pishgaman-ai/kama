-- Drop the table if it exists
DROP TABLE IF EXISTS individual_observations;

-- Create individual_observations table
CREATE TABLE individual_observations (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL,
    subject_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    observation_date DATE NOT NULL,
    teacher_id VARCHAR(10) NOT NULL,
    class_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(national_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES users(national_id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- Add indexes for better query performance
CREATE INDEX idx_individual_observations_student_id ON individual_observations(student_id);
CREATE INDEX idx_individual_observations_subject_id ON individual_observations(subject_id);
CREATE INDEX idx_individual_observations_class_id ON individual_observations(class_id);
CREATE INDEX idx_individual_observations_teacher_id ON individual_observations(teacher_id);
CREATE INDEX idx_individual_observations_date ON individual_observations(observation_date);