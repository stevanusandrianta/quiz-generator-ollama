import express from 'express';
import cors from 'cors';
import path from 'path';
import quizRoutes from './routes/quizRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/quiz', quizRoutes);

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Multiple Choice Quiz Simulator running on port ${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api/quiz`);
  console.log(`🌐 Frontend available at http://localhost:${PORT}`);
}); 