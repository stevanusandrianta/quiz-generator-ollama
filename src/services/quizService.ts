import { Question, QuizSession, GradeLevel } from '../types';
import { OllamaService } from './ollamaService';
import { StorageService } from './storageService';

export class QuizService {
  private ollamaService: OllamaService;
  private storageService: StorageService;
  private sessions: Map<string, QuizSession> = new Map();

  constructor() {
    this.ollamaService = new OllamaService();
    this.storageService = new StorageService();
  }

  async createSession(topic: string, subtopic?: string, gradeLevel?: string, curriculum?: string, questionCount: number = 5): Promise<QuizSession> {
    const sessionId = this.generateSessionId();
    const questions: Question[] = [];

    // Try to get existing questions from storage
    const storedQuestions = await this.storageService.getQuestions(topic, subtopic, gradeLevel, curriculum);
    
    // Generate additional questions if needed
    const remainingCount = questionCount - storedQuestions.length;
    
    if (remainingCount > 0) {
      // Generate questions using Ollama or fallback to predefined questions
      for (let i = 0; i < remainingCount; i++) {
        try {
          console.log(`Generating question ${i + 1} for topic: ${topic}${subtopic ? `, subtopic: ${subtopic}` : ''}, grade: ${gradeLevel || 'any'}`);
          const ollamaResponse = await this.ollamaService.generateQuestion(topic, subtopic, gradeLevel, curriculum);
          console.log(`Ollama response for question ${i + 1}:`, ollamaResponse);
          
          const questionData = JSON.parse(ollamaResponse);
          console.log(`Parsed question data for question ${i + 1}:`, questionData);
          
          const newQuestion = {
            id: `q${storedQuestions.length + i + 1}`,
            question: questionData.question,
            options: questionData.options,
            correctAnswer: questionData.correctAnswer,
            explanation: questionData.explanation,
            gradeLevel: (questionData.gradeLevel || gradeLevel || 'general') as GradeLevel,
            curriculum: questionData.curriculum || curriculum
          };
          
          questions.push(newQuestion);
          // Store the new question
          await this.storageService.storeQuestion(topic, subtopic, newQuestion, gradeLevel || 'general', curriculum);
        } catch (error) {
          console.log(`Ollama failed for question ${i + 1}, using fallback:`, error);
          console.log(`Calling Ollama service fallback for index ${i} and topic ${topic}`);
          // Use Ollama service's topic-specific fallback
          const fallbackResponse = this.ollamaService.getTopicSpecificFallback(topic);
          const questionData = JSON.parse(fallbackResponse);
          const fallbackQuestion = {
            id: `q${storedQuestions.length + i + 1}`,
            question: questionData.question,
            options: questionData.options,
            correctAnswer: questionData.correctAnswer,
            explanation: questionData.explanation,
            gradeLevel: (gradeLevel || 'general') as GradeLevel,
            curriculum: curriculum
          };
          questions.push(fallbackQuestion);
          // Store the fallback question
          await this.storageService.storeQuestion(topic, subtopic, fallbackQuestion, gradeLevel || 'general', curriculum);
        }
      }
    }
    
    // Combine stored and new questions, and shuffle them
    const allQuestions = [...storedQuestions, ...questions];
    const shuffledQuestions = this.shuffleArray(allQuestions.slice(0, questionCount));

    const session: QuizSession = {
      id: sessionId,
      topic,
      subtopic,
      gradeLevel: (gradeLevel || 'general') as GradeLevel,
      curriculum,
      questions: shuffledQuestions,
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      totalQuestions: questionCount
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): QuizSession | undefined {
    return this.sessions.get(sessionId);
  }

  submitAnswer(sessionId: string, questionId: string, answerIndex: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    session.answers[questionId] = answerIndex;
    
    if (answerIndex === question.correctAnswer) {
      session.score++;
    }

    return answerIndex === question.correctAnswer;
  }

  getCurrentQuestion(sessionId: string): Question | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.currentQuestionIndex >= session.questions.length) {
      return null;
    }
    return session.questions[session.currentQuestionIndex];
  }

  nextQuestion(sessionId: string): Question | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.currentQuestionIndex++;
    return this.getCurrentQuestion(sessionId);
  }

  getSessionResults(sessionId: string): { score: number; total: number; percentage: number } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return {
      score: session.score,
      total: session.totalQuestions,
      percentage: Math.round((session.score / session.totalQuestions) * 100)
    };
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getFallbackQuestion(index: number, topic: string, gradeLevel: GradeLevel = 'general'): Question {
    const fallbackQuestions = [
      {
        question: `What is the capital of France?`,
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2,
        explanation: 'Paris is the capital and largest city of France.',
        gradeLevel: gradeLevel
      },
      {
        question: `Which planet is known as the Red Planet?`,
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 1,
        explanation: 'Mars is called the Red Planet due to its reddish appearance.',
        gradeLevel: gradeLevel
      },
      {
        question: `What is the largest ocean on Earth?`,
        options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
        correctAnswer: 3,
        explanation: 'The Pacific Ocean is the largest and deepest ocean on Earth.',
        gradeLevel: gradeLevel
      },
      {
        question: `Who wrote "Romeo and Juliet"?`,
        options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
        correctAnswer: 1,
        explanation: 'William Shakespeare wrote the famous tragedy "Romeo and Juliet".',
        gradeLevel: gradeLevel
      },
      {
        question: `What is the chemical symbol for gold?`,
        options: ['Ag', 'Au', 'Fe', 'Cu'],
        correctAnswer: 1,
        explanation: 'Au is the chemical symbol for gold, from the Latin word "aurum".',
        gradeLevel: gradeLevel
      },
      {
        question: `What is the largest planet in our solar system?`,
        options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 2,
        explanation: 'Jupiter is the largest planet in our solar system.',
        gradeLevel: gradeLevel
      },
      {
        question: `Which element has the chemical symbol 'O'?`,
        options: ['Oxygen', 'Osmium', 'Oganesson', 'Osmium'],
        correctAnswer: 0,
        explanation: 'Oxygen has the chemical symbol O.',
        gradeLevel: gradeLevel
      },
      {
        question: `What year did World War II end?`,
        options: ['1943', '1944', '1945', '1946'],
        correctAnswer: 2,
        explanation: 'World War II ended in 1945.',
        gradeLevel: gradeLevel
      },
      {
        question: `What is the square root of 64?`,
        options: ['6', '7', '8', '9'],
        correctAnswer: 2,
        explanation: 'The square root of 64 is 8.',
        gradeLevel: gradeLevel
      },
      {
        question: `Which country is home to the kangaroo?`,
        options: ['New Zealand', 'Australia', 'South Africa', 'India'],
        correctAnswer: 1,
        explanation: 'Kangaroos are native to Australia.',
        gradeLevel: gradeLevel
      }
    ];

    // Use the index to get a different question each time
    const questionIndex = index % fallbackQuestions.length;
    const question = fallbackQuestions[questionIndex];
    
    console.log(`Using fallback question ${questionIndex + 1} for index ${index}: ${question.question}`);
    
    return {
      id: `q${index + 1}`,
      ...question,
      gradeLevel: gradeLevel
    };
  }
} 