-- Table for storing life skills assessment results
CREATE TABLE life_skills_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(255) NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    assessment_date DATE NOT NULL,
    self_awareness_score INTEGER CHECK (self_awareness_score BETWEEN 1 AND 5),
    empathy_score INTEGER CHECK (empathy_score BETWEEN 1 AND 5),
    friendship_and_healthy_relationships_score INTEGER CHECK (friendship_and_healthy_relationships_score BETWEEN 1 AND 5),
    effective_communication_score INTEGER CHECK (effective_communication_score BETWEEN 1 AND 5),
    creative_thinking_score INTEGER CHECK (creative_thinking_score BETWEEN 1 AND 5),
    problem_solving_score INTEGER CHECK (problem_solving_score BETWEEN 1 AND 5),
    decision_making_score INTEGER CHECK (decision_making_score BETWEEN 1 AND 5),
    critical_thinking_score INTEGER CHECK (critical_thinking_score BETWEEN 1 AND 5),
    emotion_management_score INTEGER CHECK (emotion_management_score BETWEEN 1 AND 5),
    self_confidence_score INTEGER CHECK (self_confidence_score BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES users(national_id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Table for storing active life standardization assessment results
CREATE TABLE active_life_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(255) NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    assessment_date DATE NOT NULL,
    belief_religious_ethical_score INTEGER CHECK (belief_religious_ethical_score BETWEEN 0 AND 3),
    social_political_score INTEGER CHECK (social_political_score BETWEEN 0 AND 3),
    biological_physical_score INTEGER CHECK (biological_physical_score BETWEEN 0 AND 3),
    aesthetic_artistic_score INTEGER CHECK (aesthetic_artistic_score BETWEEN 0 AND 3),
    economic_professional_score INTEGER CHECK (economic_professional_score BETWEEN 0 AND 3),
    scientific_technological_score INTEGER CHECK (scientific_technological_score BETWEEN 0 AND 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES users(national_id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Table for storing growth and development assessment results
CREATE TABLE growth_development_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(255) NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    assessment_date DATE NOT NULL,
    linguistic_verbal_score INTEGER CHECK (linguistic_verbal_score BETWEEN 1 AND 5),
    logical_mathematical_score INTEGER CHECK (logical_mathematical_score BETWEEN 1 AND 5),
    visual_spatial_score INTEGER CHECK (visual_spatial_score BETWEEN 1 AND 5),
    musical_score INTEGER CHECK (musical_score BETWEEN 1 AND 5),
    existential_score INTEGER CHECK (existential_score BETWEEN 1 AND 5),
    bodily_kinesthetic_score INTEGER CHECK (bodily_kinesthetic_score BETWEEN 1 AND 5),
    interpersonal_score INTEGER CHECK (interpersonal_score BETWEEN 1 AND 5),
    intrapersonal_score INTEGER CHECK (intrapersonal_score BETWEEN 1 AND 5),
    naturalistic_score INTEGER CHECK (naturalistic_score BETWEEN 1 AND 5),
    moral_spiritual_score INTEGER CHECK (moral_spiritual_score BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES users(national_id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Indexes for better query performance
CREATE INDEX idx_life_skills_student_id ON life_skills_assessments(student_id);
CREATE INDEX idx_life_skills_class_id ON life_skills_assessments(class_id);
CREATE INDEX idx_life_skills_subject_id ON life_skills_assessments(subject_id);
CREATE INDEX idx_life_skills_assessment_date ON life_skills_assessments(assessment_date);

CREATE INDEX idx_active_life_student_id ON active_life_assessments(student_id);
CREATE INDEX idx_active_life_class_id ON active_life_assessments(class_id);
CREATE INDEX idx_active_life_subject_id ON active_life_assessments(subject_id);
CREATE INDEX idx_active_life_assessment_date ON active_life_assessments(assessment_date);

CREATE INDEX idx_growth_dev_student_id ON growth_development_assessments(student_id);
CREATE INDEX idx_growth_dev_class_id ON growth_development_assessments(class_id);
CREATE INDEX idx_growth_dev_subject_id ON growth_development_assessments(subject_id);
CREATE INDEX idx_growth_dev_assessment_date ON growth_development_assessments(assessment_date);