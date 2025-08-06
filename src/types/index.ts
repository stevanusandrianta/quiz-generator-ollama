export type GradeLevel = 
  | 'elementary_1'
  | 'elementary_2'
  | 'elementary_3'
  | 'elementary_4'
  | 'elementary_5'
  | 'elementary_6'
  | 'junior_7'
  | 'junior_8'
  | 'junior_9'
  | 'senior_10'
  | 'senior_11'
  | 'senior_12'
  | 'general';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  gradeLevel: GradeLevel;
  curriculum?: string; // e.g., "National", "Cambridge", "IB"
}

export interface QuizSession {
  id: string;
  topic: string;
  subtopic?: string;
  gradeLevel: GradeLevel;
  curriculum?: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, number>;
  score: number;
  totalQuestions: number;
}

export interface OllamaResponse {
  response: string;
  done: boolean;
  model?: string;
  created_at?: string;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
} 