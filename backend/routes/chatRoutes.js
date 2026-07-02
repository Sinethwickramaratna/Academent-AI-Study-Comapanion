import {generateResponse} from '../services/chatService.js';

import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  try {

    const {message} = req.body;

    if(!message){
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const reply = await generateResponse(message);

    res.status(200).json({
      success: true,
      response: reply,
    });

  }catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while generating the response",
    })
  }
});

export default router;