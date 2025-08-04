# Multiple Choice Quiz Simulator

A TypeScript application that simulates multiple choice questions with AI-powered question generation using Ollama. The app features a modern, responsive web interface and can generate questions on any topic.

## Features

- 🎓 **AI-Powered Questions**: Uses Ollama to generate questions on any topic
- 📱 **Responsive Design**: Modern, mobile-friendly UI
- ⚡ **Real-time Feedback**: Immediate feedback on answers with explanations
- 🎯 **Progress Tracking**: Visual progress bar and score tracking
- ⌨️ **Keyboard Shortcuts**: Use number keys (1-4) to select answers, Enter to submit
- 🔄 **Fallback System**: Predefined questions when Ollama is unavailable

## Tech Stack

- **Backend**: TypeScript, Express.js, Node.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: Ollama (local LLM)
- **Containerization**: Docker, Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Ollama installed locally (https://ollama.ai)
- At least 4GB of RAM (for Ollama)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multiple-choice-simulator
   ```

2. **Start Ollama locally**
   ```bash
   # Install Ollama from https://ollama.ai
   ollama pull gemma3n:e2b
   ollama serve
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - The API is available at `http://localhost:3000/api/quiz`

## Usage

1. **Start a Quiz**: Enter a topic (e.g., "Science", "History", "Geography") and select the number of questions
2. **Answer Questions**: Click on an option or use number keys (1-4) to select answers
3. **Get Feedback**: See immediate feedback with explanations
4. **View Results**: Get your final score and performance analysis

## API Endpoints

- `POST /api/quiz/session` - Create a new quiz session
- `GET /api/quiz/session/:sessionId/current` - Get current question
- `POST /api/quiz/session/:sessionId/answer` - Submit an answer
- `POST /api/quiz/session/:sessionId/next` - Move to next question
- `GET /api/quiz/session/:sessionId/results` - Get session results
- `GET /api/quiz/session/:sessionId` - Get session details

## Development

### Local Development (without Docker)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Ollama locally**
   ```bash
   # Install Ollama from https://ollama.ai
   ollama pull gemma3n:e2b
   ollama serve
   ```

3. **Build and run**
   ```bash
   npm run build
   npm start
   ```

## Configuration

### Environment Variables

- `PORT`: Application port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `OLLAMA_HOST`: Ollama service URL (default: http://ollama:11434)

### Ollama Models

The application uses the `gemma3n:e2b` model by default. You can change this in `src/services/ollamaService.ts`:

```typescript
body: JSON.stringify({
  model: 'gemma3n:e2b', // Change this to use a different model
  prompt,
  stream: false,
} as OllamaRequest),
```

## Troubleshooting

### Ollama Issues

1. **Model not found**: Pull the required model
   ```bash
   ollama pull gemma3n:e2b
   ```

2. **Out of memory**: Increase Docker memory allocation or use a smaller model

3. **Slow responses**: The first question generation may take longer as the model loads

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Ollama](https://ollama.ai) for providing local LLM capabilities
- [Express.js](https://expressjs.com) for the web framework
- [Docker](https://docker.com) for containerization 