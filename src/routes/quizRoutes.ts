import { Router, Request, Response } from 'express';
import { QuizService } from '../services/quizService';
import { StorageService } from '../services/storageService';

const router = Router();
const quizService = new QuizService();
const storageService = new StorageService();

// Create a new quiz session
router.post('/session', async (req: Request, res: Response) => {
  try {
    const { topic, subtopic, gradeLevel, curriculum, questionCount = 5 } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const session = await quizService.createSession(topic, subtopic, gradeLevel, curriculum, questionCount);
    res.json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get current question for a session
router.get('/session/:sessionId/current', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const question = quizService.getCurrentQuestion(sessionId);
    
    if (!question) {
      return res.status(404).json({ error: 'No more questions or session not found' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error getting current question:', error);
    res.status(500).json({ error: 'Failed to get current question' });
  }
});

// Submit an answer
router.post('/session/:sessionId/answer', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answerIndex } = req.body;
    
    if (typeof answerIndex !== 'number' || answerIndex < 0 || answerIndex > 3) {
      return res.status(400).json({ error: 'Invalid answer index' });
    }
    
    const isCorrect = quizService.submitAnswer(sessionId, questionId, answerIndex);
    res.json({ isCorrect });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Move to next question
router.post('/session/:sessionId/next', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const nextQuestion = quizService.nextQuestion(sessionId);
    
    if (!nextQuestion) {
      return res.status(404).json({ error: 'No more questions' });
    }
    
    res.json(nextQuestion);
  } catch (error) {
    console.error('Error moving to next question:', error);
    res.status(500).json({ error: 'Failed to move to next question' });
  }
});

// Get session results
router.get('/session/:sessionId/results', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const results = quizService.getSessionResults(sessionId);
    res.json(results);
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

// Get session details
router.get('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = quizService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Get available topics
router.get('/topics', async (req: Request, res: Response) => {
  try {
    const topics = await storageService.listTopics();
    res.json(topics);
  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({ error: 'Failed to get topics' });
  }
});

export default router; 