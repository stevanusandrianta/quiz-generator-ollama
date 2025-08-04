import { Ollama } from 'ollama';
import { OllamaRequest, OllamaResponse } from '../types';

export class OllamaService {
  private client: Ollama;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.client = new Ollama({ host: baseUrl });
  }

  async generateQuestion(topic: string): Promise<string> {
    const prompt = `Generate a unique multiple choice question about ${topic}. 
  The question should be different from typical questions and should test understanding.
  Format the response as JSON with the following structure:
  {
    "question": "Your unique question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct"
  }
  
  Make sure the question is educational, the options are plausible, and the question is unique and interesting.`;
  
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
