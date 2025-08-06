class QuizApp {
    constructor() {
        this.currentSession = null;
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.apiBase = '/api/quiz';
        this.loadPreviousTopics();
        this.toggleLearningType();
    }

    toggleLearningType() {
        const learningType = document.getElementById('learningType').value;
        const curriculumSection = document.getElementById('curriculumSection');
        const generalSection = document.getElementById('generalSection');
        
        if (learningType === 'curriculum') {
            curriculumSection.style.display = 'block';
            generalSection.style.display = 'none';
        } else {
            curriculumSection.style.display = 'none';
            generalSection.style.display = 'block';
        }
    }

    async loadPreviousTopics() {
        try {
            const response = await fetch(`${this.apiBase}/topics`);
            if (!response.ok) {
                throw new Error('Failed to load topics');
            }
            
            const topics = await response.json();
            this.displayPreviousTopics(topics);
        } catch (error) {
            console.error('Error loading topics:', error);
        }
    }

    displayPreviousTopics(topics) {
        const topicsList = document.getElementById('topicsList');
        topicsList.innerHTML = '';

        if (topics.length === 0) {
            topicsList.innerHTML = '<p>No previous topics found</p>';
            return;
        }

        topics.forEach(topic => {
            const topicElement = document.createElement('div');
            topicElement.className = 'topic-item';
            topicElement.onclick = () => this.startQuizFromTopic(topic);

            topicElement.innerHTML = `
                <div class="topic-info">
                    <div class="topic-title">${topic.topic}</div>
                    ${topic.subtopic ? `<div class="topic-subtitle">${topic.subtopic}</div>` : ''}
                </div>
                <span class="topic-count">${topic.questionCount} questions</span>
            `;

            topicsList.appendChild(topicElement);
        });
    }

    async startQuizFromTopic(topicInfo) {
        document.getElementById('topic').value = topicInfo.topic;
        if (topicInfo.subtopic) {
            document.getElementById('subtopic').value = topicInfo.subtopic;
        }
        if (topicInfo.gradeLevel) {
            document.getElementById('gradeLevel').value = topicInfo.gradeLevel;
        }
        if (topicInfo.curriculum) {
            document.getElementById('curriculum').value = topicInfo.curriculum;
        }
        await this.startQuiz();
    }

    async startQuiz() {
        const topic = document.getElementById('topic').value.trim();
        const subtopic = document.getElementById('subtopic').value.trim();
        const learningType = document.getElementById('learningType').value;
        const questionCount = parseInt(document.getElementById('questionCount').value);

        let gradeLevel = 'general';
        let curriculum = undefined;

        if (learningType === 'curriculum') {
            gradeLevel = document.getElementById('gradeLevel').value;
            curriculum = document.getElementById('curriculum').value;
        } else {
            // Map difficulty levels to grade levels for consistent storage
            const difficultyMap = {
                'beginner': 'elementary_3',     // Around 3rd grade level
                'intermediate': 'junior_7',      // Around 7th grade level
                'advanced': 'senior_10',         // Around 10th grade level
                'expert': 'senior_12'           // Around 12th grade level
            };
            gradeLevel = difficultyMap[document.getElementById('difficultyLevel').value] || 'general';
        }

        if (!topic) {
            this.showError('Please enter a topic for the quiz.');
            return;
        }

        this.showLoading(true);
        this.hideError();

        try {
            const response = await fetch(`${this.apiBase}/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    topic, 
                    subtopic, 
                    gradeLevel,
                    curriculum: curriculum || undefined,
                    questionCount 
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create quiz session');
            }

            this.currentSession = await response.json();
            this.showQuizSection();
            this.loadCurrentQuestion();
        } catch (error) {
            console.error('Error starting quiz:', error);
            this.showError('Failed to start quiz. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async loadCurrentQuestion() {
        if (!this.currentSession) return;

        try {
            const response = await fetch(`${this.apiBase}/session/${this.currentSession.id}/current`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    this.showResults();
                    return;
                }
                throw new Error('Failed to load question');
            }

            this.currentQuestion = await response.json();
            this.displayQuestion();
            this.updateProgress();
        } catch (error) {
            console.error('Error loading question:', error);
            this.showError('Failed to load question. Please try again.');
        }
    }

    displayQuestion() {
        if (!this.currentQuestion) {
            console.log('No current question to display');
            return;
        }

        console.log('Displaying question:', this.currentQuestion);
        document.getElementById('questionText').textContent = this.currentQuestion.question;
        
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';

        this.currentQuestion.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
            optionElement.onclick = () => this.selectOption(index);
            optionsContainer.appendChild(optionElement);
        });

        this.selectedAnswer = null;
        document.getElementById('explanationContainer').style.display = 'none';

        document.getElementById('submitBtn').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('finishBtn').style.display = 'none';
    }

    selectOption(index) {
        // Remove previous selection
        const options = document.querySelectorAll('.option');
        options.forEach(option => option.classList.remove('selected'));

        // Select new option
        options[index].classList.add('selected');
        this.selectedAnswer = index;
        
        // Show submit button when an option is selected
        document.getElementById('submitBtn').style.display = 'inline-block';
    }

    async submitAnswer() {
        if (this.selectedAnswer === null) {
            this.showError('Please select an answer.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/session/${this.currentSession.id}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionId: this.currentQuestion.id,
                    answerIndex: this.selectedAnswer,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit answer');
            }

            const result = await response.json();
            this.showAnswerResult(result.isCorrect);
        } catch (error) {
            console.error('Error submitting answer:', error);
            this.showError('Failed to submit answer. Please try again.');
        }
    }

    showAnswerResult(isCorrect) {
        const options = document.querySelectorAll('.option');
        const correctIndex = this.currentQuestion.correctAnswer;

        // Mark correct and incorrect answers
        options.forEach((option, index) => {
            if (index === correctIndex) {
                option.classList.add('correct');
            } else if (index === this.selectedAnswer && !isCorrect) {
                option.classList.add('incorrect');
            }
        });

        // Show explanation if available
        if (this.currentQuestion.explanation) {
            const explanationContainer = document.getElementById('explanationContainer');
            explanationContainer.textContent = this.currentQuestion.explanation;
            explanationContainer.style.display = 'block';
        }

        // Auto-advance after 3 seconds, or show manual buttons
        const isLastQuestion = this.currentSession.currentQuestionIndex >= this.currentSession.totalQuestions - 1;
        
        if (isLastQuestion) {
            // For the last question, show finish button
            document.getElementById('finishBtn').style.display = 'inline-block';
        } else {
            // For other questions, show next button
            document.getElementById('nextBtn').style.display = 'inline-block';
        }
    }

    async nextQuestion() {
        try {
            const response = await fetch(`${this.apiBase}/session/${this.currentSession.id}/next`, {
                method: 'POST',
            });

            if (!response.ok) {
                if (response.status === 404) {
                    this.showResults();
                    return;
                }
                throw new Error('Failed to load next question');
            }

            this.currentQuestion = await response.json();
            
            // Update the session's current question index
            this.currentSession.currentQuestionIndex++;
            
            console.log('Next question loaded:', this.currentQuestion);
            console.log('Session state:', this.currentSession);
            
            this.displayQuestion();
            this.updateProgress();
        } catch (error) {
            console.error('Error loading next question:', error);
            this.showError('Failed to load next question. Please try again.');
        }
    }

    async showResults() {
        try {
            const response = await fetch(`${this.apiBase}/session/${this.currentSession.id}/results`);
            
            if (!response.ok) {
                throw new Error('Failed to load results');
            }

            const results = await response.json();
            this.displayResults(results);
        } catch (error) {
            console.error('Error loading results:', error);
            this.showError('Failed to load results. Please try again.');
        }
    }

    displayResults(results) {
        document.getElementById('quizSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';

        const scoreDisplay = document.getElementById('scoreDisplay');
        const resultMessage = document.getElementById('resultMessage');

        scoreDisplay.textContent = `${results.score}/${results.total}`;
        
        let message = '';
        if (results.percentage >= 80) {
            message = 'Excellent! You did great! 🎉';
        } else if (results.percentage >= 60) {
            message = 'Good job! You passed! 👍';
        } else if (results.percentage >= 40) {
            message = 'Not bad, but you can do better! 💪';
        } else {
            message = 'Keep studying and try again! 📚';
        }
        
        resultMessage.textContent = `${message} (${results.percentage}%)`;
    }

    updateProgress() {
        if (!this.currentSession) return;
        
        const progress = (this.currentSession.currentQuestionIndex / this.currentSession.totalQuestions) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
    }

    resetQuiz() {
        this.currentSession = null;
        this.currentQuestion = null;
        this.selectedAnswer = null;
        
        document.getElementById('setupForm').style.display = 'block';
        document.getElementById('quizSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('errorContainer').style.display = 'none';
        
        // Clear form fields
        document.getElementById('topic').value = '';
        document.getElementById('subtopic').value = '';
        document.getElementById('learningType').value = 'curriculum';
        document.getElementById('gradeLevel').value = 'elementary_1';
        document.getElementById('curriculum').value = '';
        document.getElementById('difficultyLevel').value = 'beginner';
        document.getElementById('questionCount').value = '5';
        
        // Reset sections visibility
        this.toggleLearningType();
        
        // Refresh the topics list
        this.loadPreviousTopics();
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.getElementById('setupForm').style.display = show ? 'none' : 'block';
    }

    showQuizSection() {
        document.getElementById('setupForm').style.display = 'none';
        document.getElementById('quizSection').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorContainer').style.display = 'none';
    }


}

// Initialize the app
const app = new QuizApp();

// Global functions for HTML onclick handlers
function startQuiz() {
    app.startQuiz();
}

function submitAnswer() {
    app.submitAnswer();
}

function nextQuestion() {
    app.nextQuestion();
}

function finishQuiz() {
    app.showResults();
}

function resetQuiz() {
    app.resetQuiz();
}

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '4') {
        const index = parseInt(event.key) - 1;
        app.selectOption(index);
    } else if (event.key === 'Enter') {
        if (document.getElementById('nextBtn').style.display !== 'none') {
            app.nextQuestion();
        } else if (document.getElementById('finishBtn').style.display !== 'none') {
            app.showResults();
        } else if (document.getElementById('submitBtn').style.display !== 'none') {
            app.submitAnswer();
        }
    }
}); 