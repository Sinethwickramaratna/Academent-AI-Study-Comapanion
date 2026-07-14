import express from 'express'
import { evaluateShortAnswer, extractKnowledge, generateQuiz } from '../services/chatService.js'
import rateLimit from 'express-rate-limit'
import { getPublicErrorMessage } from '../utils/apiErrors.js'

const router = express.Router()

router.post('/generate-quiz', async function generateQuizRoute(req, res) {
  try {
    const { knowledge, numQuestions, difficulty } = req.body

    if (!difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Difficulty level is required (easy, medium, hard)',
      })
    }

    const quiz = await generateQuiz(knowledge, numQuestions, difficulty)
    res.json({
      success: true,
      difficulty,
      data: quiz,
    })
  } catch (error) {
    console.error('Error generating quiz:', error)
    res.status(500).json({
      success: false,
      error: getPublicErrorMessage(error, 'An error occurred while generating the quiz'),
    })
  }
})

router.post('/extract-knowledge', async function extractKnowledgeRoute(req, res) {
  try {
    const { content } = req.body

    const knowledge = await extractKnowledge(content)

    res.json({
      success: true,
      data: knowledge,
    })
  } catch (error) {
    console.error('Error extracting knowledge:', error)
    res.status(500).json({
      success: false,
      error: getPublicErrorMessage(error, 'An error occurred while extracting knowledge'),
    })
  }
})

router.post('/evaluate-short-answer', async function evaluateShortAnswerRoute(req, res) {
  try {
    const { question, correctAnswer, userAnswer } = req.body

    if (!question || !correctAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Question and correctAnswer are required',
      })
    }

    const evaluation = await evaluateShortAnswer({ question, correctAnswer, userAnswer })

    res.json({
      success: true,
      data: evaluation,
    })
  } catch (error) {
    console.error('Error evaluating short answer:', error)
    res.status(500).json({
      success: false,
      error: getPublicErrorMessage(error, 'An error occurred while evaluating the short answer'),
    })
  }
})

export default router
