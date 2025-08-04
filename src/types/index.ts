export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizSession {
  id: string;
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