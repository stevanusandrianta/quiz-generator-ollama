import fs from 'fs';
import path from 'path';
import { Question } from '../types';

interface TopicInfo {
  topic: string;
  subtopic?: string;
  questionCount: number;
}

export class StorageService {
  private storagePath: string;

  constructor() {
    this.storagePath = path.join(process.cwd(), 'data', 'questions');
    this.ensureStorageDirectory();
    // Run migration in the background
    this.migrateOldFiles().catch(error => {
      console.error('Failed to migrate old files:', error);
    });
  }

  private ensureStorageDirectory() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  private sanitizeText(text: string | undefined | null): string {
    if (!text) return '';
    return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
  }

  private getFilePath(topic: string, subtopic?: string, gradeLevel?: string, curriculum?: string): string {
    const sanitizedTopic = this.sanitizeText(topic);
    const sanitizedSubtopic = subtopic ? this.sanitizeText(subtopic) : '';
    const sanitizedGrade = gradeLevel ? this.sanitizeText(gradeLevel) : '';
    const sanitizedCurriculum = curriculum ? this.sanitizeText(curriculum) : '';
    
    // Create a unique filename that includes all components
    const parts = [sanitizedTopic];
    if (sanitizedSubtopic) parts.push(sanitizedSubtopic);
    if (sanitizedGrade) parts.push(sanitizedGrade);
    if (sanitizedCurriculum) parts.push(sanitizedCurriculum);
    
    const fileName = `${parts.join('__')}.json`;
    return path.join(this.storagePath, fileName);
  }

  private async migrateOldFiles(): Promise<void> {
    try {
      const files = fs.readdirSync(this.storagePath);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.storagePath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const questions = JSON.parse(content) as Question[];
        
        // Skip empty files
        if (questions.length === 0) continue;

        // Extract topic and subtopic from old filename
        const fileName = file.slice(0, -5); // Remove .json
        const parts = fileName.split('_');
        
        if (parts.length > 0) {
          const topic = parts[0].replace(/_/g, ' ');
          const subtopic = parts.length > 1 ? parts.slice(1).join(' ').replace(/_/g, ' ') : undefined;
          
          // Generate new filename
          const newFilePath = this.getFilePath(topic, subtopic);
          
          // If the file would be renamed to itself, skip it
          if (filePath === newFilePath) continue;
          
          // Move to new filename if it doesn't exist
          if (!fs.existsSync(newFilePath)) {
            fs.renameSync(filePath, newFilePath);
          } else {
            // If new file exists, merge questions
            const existingContent = fs.readFileSync(newFilePath, 'utf-8');
            const existingQuestions = JSON.parse(existingContent) as Question[];
            
            // Merge and deduplicate questions
            const mergedQuestions = [...existingQuestions];
            for (const question of questions) {
              if (!mergedQuestions.some(q => q.question === question.question)) {
                mergedQuestions.push(question);
              }
            }
            
            // Save merged questions and delete old file
            fs.writeFileSync(newFilePath, JSON.stringify(mergedQuestions, null, 2));
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Error migrating old files:', error);
    }
  }

  async storeQuestion(topic: string, subtopic: string | undefined, question: Question, gradeLevel: string, curriculum?: string): Promise<void> {
    const filePath = this.getFilePath(topic, subtopic, gradeLevel, curriculum);
    let questions: Question[] = [];

    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        questions = JSON.parse(content);
      }
    } catch (error) {
      console.error('Error reading questions file:', error);
    }

    // Check if question already exists to avoid duplicates
    const isDuplicate = questions.some(q => q.question === question.question);
    if (!isDuplicate) {
      questions.push(question);
      fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
    }
  }

  async getQuestions(topic: string, subtopic?: string, gradeLevel?: string, curriculum?: string): Promise<Question[]> {
    const filePath = this.getFilePath(topic, subtopic, gradeLevel, curriculum);
    
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error reading questions file:', error);
    }

    return [];
  }

  async listTopics(): Promise<TopicInfo[]> {
    const topics: TopicInfo[] = [];
    
    try {
      const files = fs.readdirSync(this.storagePath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.storagePath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const questions = JSON.parse(content) as Question[];
          
          // Extract topic and subtopic from filename
          const fileName = file.slice(0, -5); // Remove .json
          const parts = fileName.split('__'); // Split on double underscore for new format
          
          if (parts.length > 0) {
            const topic = parts[0].replace(/_/g, ' ');
            const subtopic = parts.length > 1 ? parts[1].replace(/_/g, ' ') : undefined;
            
            topics.push({
              topic,
              subtopic,
              questionCount: questions.length
            });
          }
        }
      }

      // Sort topics by name and subtopic
      topics.sort((a, b) => {
        const topicCompare = a.topic.localeCompare(b.topic);
        if (topicCompare !== 0) return topicCompare;
        
        if (!a.subtopic && !b.subtopic) return 0;
        if (!a.subtopic) return -1;
        if (!b.subtopic) return 1;
        return a.subtopic.localeCompare(b.subtopic);
      });
    } catch (error) {
      console.error('Error listing topics:', error);
    }
    
    return topics;
  }
}