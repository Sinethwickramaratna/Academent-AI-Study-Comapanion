import express from 'express';
import { extractKnowledge, generateQuiz } from '../services/geminiService.js';

const router = express.Router();

router.post('/generate-quiz', async (req, res) => {
  try {
    const { knowledge, numQuestions, difficulty } = req.body;
    
    if(!difficulty) {
      return res.status(400).json({
        success: false,
        error: "Difficulty level is required (easy, medium, hard)",
      });
    }

    const quiz = await generateQuiz(knowledge, numQuestions, difficulty);
    res.json({
      success: true,
      difficulty,
      data: quiz,
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating the quiz' ,
    });
  }
});

router.post('/extract-knowledge', async (req, res) => {
  try {
    const { content } = req.body;
    
    const knowledge = await extractKnowledge(content);

    res.json({
      success: true,
      data: knowledge,
    });
  } catch (error) {
    console.error('Error extracting knowledge:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while extracting knowledge' ,
    });
  }
});

export default router;