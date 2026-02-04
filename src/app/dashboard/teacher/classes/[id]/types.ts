export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: Date;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  national_id: string;
  is_active: boolean;
  joined_at: string;
  created_at: string;
}

export interface ClassData {
  id: string;
  name: string;
  grade_level: string;
  section?: string;
  academic_year: string;
  description?: string;
  school_name?: string;
  created_at: string;
}

export interface ClassDetailsData {
  class: ClassData;
  subject: {
    id: string;
    name: string;
  };
  students: Student[];
}

// Educational activity types
export interface EducationalActivity {
  id: string;
  student_id: string;
  activity_type: string;
  activity_title: string;
  activity_date: string;
  quantitative_score: number | null;
  qualitative_evaluation: string | null;
  created_at: string;
  updated_at: string;
  ai_score: number | null;
}

export interface ActivityType {
  id: string;
  name: string;
  requires_quantitative_score?: boolean;
  requires_qualitative_evaluation?: boolean;
}

// Individual observation types
export interface IndividualObservation {
  id: string;
  student_id: string;
  subject_id: string;
  title: string;
  description: string;
  date: string;
  created_at: string;
}
