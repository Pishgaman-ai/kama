export interface ActivityDetails {
  id: string;
  class_id: string;
  subject_id: string;
  student_id: string;
  teacher_id: string;
  activity_type: string;
  activity_title: string;
  activity_date: string;
  quantitative_score: number | null;
  qualitative_evaluation: string | null;
  created_at: string;
  updated_at: string;
  ai_score: number | null;
  ai_results: Record<string, unknown> | null;
  question_file_url: string | null;
  answer_file_url: string | null;
  teacher_note: string | null;
  status: string | null;
  student_name: string;
  class_name: string;
  subject_name: string;
}

export interface AiQuestionResult {
  id: string;
  educational_activity_id: string;
  question_number: number;
  question_text: string;
  student_answer: string;
  score: number;
  max_score: number | string; // Can be either number or string
  analysis: {
    positives: string[];
    negatives: string[];
    mistakes: string[];
    corrected_version: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ActivityType {
  id: string;
  name: string;
}
