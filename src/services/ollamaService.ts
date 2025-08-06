import { Ollama } from 'ollama';
import { OllamaRequest, OllamaResponse } from '../types';

interface GradeLevelInfo {
  description: string;
  age: number;
  complexity: string;
}

export class OllamaService {
  private client: Ollama;
  private gradeLevelMap: Record<string, GradeLevelInfo> = {
    'elementary_1': {
      description: 'First Grade Elementary School',
      age: 6,
      complexity: 'basic concepts with simple vocabulary and direct questions'
    },
    'elementary_2': {
      description: 'Second Grade Elementary School',
      age: 7,
      complexity: 'foundational concepts with clear, straightforward questions'
    },
    'elementary_3': {
      description: 'Third Grade Elementary School',
      age: 8,
      complexity: 'developing concepts with some problem-solving elements'
    },
    'elementary_4': {
      description: 'Fourth Grade Elementary School',
      age: 9,
      complexity: 'intermediate concepts with multi-step thinking'
    },
    'elementary_5': {
      description: 'Fifth Grade Elementary School',
      age: 10,
      complexity: 'advanced elementary concepts with analytical thinking'
    },
    'elementary_6': {
      description: 'Sixth Grade Elementary School',
      age: 11,
      complexity: 'complex elementary concepts with logical reasoning'
    },
    'junior_7': {
      description: 'Seventh Grade Junior High School',
      age: 12,
      complexity: 'introductory secondary concepts with abstract thinking'
    },
    'junior_8': {
      description: 'Eighth Grade Junior High School',
      age: 13,
      complexity: 'intermediate secondary concepts with analytical reasoning'
    },
    'junior_9': {
      description: 'Ninth Grade Junior High School',
      age: 14,
      complexity: 'advanced secondary concepts with critical analysis'
    },
    'senior_10': {
      description: 'Tenth Grade Senior High School',
      age: 15,
      complexity: 'foundational high school concepts with complex problem-solving'
    },
    'senior_11': {
      description: 'Eleventh Grade Senior High School',
      age: 16,
      complexity: 'advanced high school concepts with deep analytical thinking'
    },
    'senior_12': {
      description: 'Twelfth Grade Senior High School',
      age: 17,
      complexity: 'college-preparatory concepts with sophisticated reasoning'
    }
  };

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.client = new Ollama({ host: baseUrl });
  }

  private getGradeLevelInfo(gradeLevel: string): GradeLevelInfo {
    return this.gradeLevelMap[gradeLevel] || {
      description: 'General Student Level',
      age: 12,
      complexity: 'moderate difficulty with clear explanations'
    };
  }

  async generateQuestion(topic: string, subtopic?: string, gradeLevel?: string, curriculum?: string): Promise<string> {
    const gradeInfo = this.getGradeLevelInfo(gradeLevel || '');
    const curriculumInfo = curriculum ? ` following the ${curriculum} curriculum` : '';

    const prompt = `Generate a unique multiple choice question about ${topic}${subtopic ? ` focusing on the subtopic of ${subtopic}` : ''}. 
  The question should be appropriate for ${gradeInfo.description}${curriculumInfo}.
  
  Consider these grade-level guidelines:
  - Vocabulary and language complexity should be appropriate for ${gradeInfo.age}-year-old students
  - Concepts should align with ${gradeInfo.description} learning objectives
  - Question complexity should match ${gradeInfo.complexity}
  
  Format the response as JSON with the following structure:
  {
    "question": "Your unique question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct",
    "gradeLevel": "${gradeLevel || ''}",
    "curriculum": "${curriculum || ''}"
  }
  
  Make sure:
  - The question is educational and aligns with standard curriculum objectives
  - The options are plausible and grade-appropriate
  - The explanation is clear and helps student understanding
  - The question is unique and encourages critical thinking at the appropriate level
  ${subtopic ? `\n  The question must be specifically about ${subtopic} within the broader topic of ${topic}.` : ''}`;
  
    try {
      const result = await this.client.generate({
        model: 'gemma3n:e2b',
        prompt,
        stream: false,
      });
  
      if (!result.response) {
        throw new Error('No response field in Ollama response');
      }
  
      // Strip markdown formatting if present
      const cleaned = result.response.trim().replace(/^```json\s*|\s*```$/g, '');
      const parsed = JSON.parse(cleaned) as OllamaResponse;
  
      return JSON.stringify(parsed);
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      console.log('Using topic-specific fallback for topic:', topic);
      return this.getTopicSpecificFallback(topic);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const tags = await this.client.list();
      return Array.isArray(tags.models);
    } catch {
      return false;
    }
  }

  public getTopicSpecificFallback(topic: string): string {
    const topicLower = topic.toLowerCase();

    const seed = Date.now() + topicLower.charCodeAt(0) + Math.random() * 1000000;
    let seedValue = seed;
    const random = () => {
      const x = Math.sin(seedValue++) * 10000;
      return x - Math.floor(x);
    };

    const fallbackQuestions = {
      science: [
        {
          question: "What is the chemical symbol for oxygen?",
          options: ["O", "Ox", "O2", "Oxy"],
          correctAnswer: 0,
          explanation: "O is the chemical symbol for oxygen."
        },
        {
          question: "Which planet is closest to the Sun?",
          options: ["Venus", "Mercury", "Earth", "Mars"],
          correctAnswer: 1,
          explanation: "Mercury is the closest planet to the Sun."
        },
        {
          question: "What is the largest organ in the human body?",
          options: ["Heart", "Brain", "Liver", "Skin"],
          correctAnswer: 3,
          explanation: "The skin is the largest organ in the human body."
        }
      ],
      history: [
        {
          question: "In what year did World War II end?",
          options: ["1943", "1944", "1945", "1946"],
          correctAnswer: 2,
          explanation: "World War II ended in 1945."
        },
        {
          question: "Who was the first President of the United States?",
          options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
          correctAnswer: 2,
          explanation: "George Washington was the first President of the United States."
        },
        {
          question: "What year did Columbus discover America?",
          options: ["1490", "1491", "1492", "1493"],
          correctAnswer: 2,
          explanation: "Columbus discovered America in 1492."
        }
      ],
      geography: [
        {
          question: "What is the capital of Japan?",
          options: ["Tokyo", "Kyoto", "Osaka", "Yokohama"],
          correctAnswer: 0,
          explanation: "Tokyo is the capital of Japan."
        },
        {
          question: "Which is the largest country in South America?",
          options: ["Argentina", "Brazil", "Peru", "Colombia"],
          correctAnswer: 1,
          explanation: "Brazil is the largest country in South America."
        },
        {
          question: "What is the longest river in the world?",
          options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
          correctAnswer: 1,
          explanation: "The Nile is the longest river in the world."
        }
      ],
      math: [
        {
          question: "What is 15 + 27?",
          options: ["40", "41", "42", "43"],
          correctAnswer: 2,
          explanation: "15 + 27 = 42"
        },
        {
          question: "What is the square root of 81?",
          options: ["7", "8", "9", "10"],
          correctAnswer: 2,
          explanation: "The square root of 81 is 9."
        },
        {
          question: "How many sides does a hexagon have?",
          options: ["5", "6", "7", "8"],
          correctAnswer: 1,
          explanation: "A hexagon has 6 sides."
        }
      ]
    };

    let bestMatch = 'science';
    for (const key of Object.keys(fallbackQuestions)) {
      if (topicLower.includes(key)) {
        bestMatch = key;
        break;
      }
    }

    const questions = fallbackQuestions[bestMatch as keyof typeof fallbackQuestions];
    const randomIndex = Math.floor(random() * questions.length);
    const question = questions[randomIndex];

    console.log(`Using ${bestMatch} fallback question ${randomIndex + 1} for topic: ${topic}`);
    console.log(`Question: ${question.question}`);

    return JSON.stringify(question);
  }
}
