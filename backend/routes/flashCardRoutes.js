import express from 'express';
import { generateFlashCards } from '../services/flashCardAiService.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { sources, preferences } = req.body;
    const data = await generateFlashCards({ sources, preferences });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error generating flash cards:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating flash cards',
    });
  }
});

export default router;
