export interface Test {
  id: string;
  name: string;
  question_count: number;
  duration_minutes: number;
  year: number | null;
  created_at: string;
}

export interface Question {
  id: string;
  test_id: string;
  question_number: number;
  question_text: string;
  set_name: string | null;
  passage_text: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string | null;
  correct_answer: string;
  explanation: string | null;
}

export interface ExamAttempt {
  id: string;
  test_id: string;
  start_time: string;
  end_time: string | null;
  duration_allocated_minutes: number;
  duration_spent_seconds: number;
  is_submitted: boolean;
  is_timeout: boolean;
}

export interface ExamResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer: string | null;
  is_marked_for_review: boolean;
  time_spent_seconds: number;
}

export interface ExamResult {
  id: string;
  attempt_id: string;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  total_score: number;
  max_score: number;
  percentile: number | null;
}

export type QuestionStatus = 'unanswered' | 'visited' | 'answered' | 'marked';

export interface CSVQuestion {
  question_id?: string;
  question_number: string;
  set_name?: string;
  passage_text?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e?: string;
  correct_answer: string;
  explanation?: string;
}
