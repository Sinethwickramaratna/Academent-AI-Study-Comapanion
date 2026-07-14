import { generateResponse } from '../services/chatService.js'
import express from "express"
import { getPublicErrorMessage } from '../utils/apiErrors.js'

const router = express.Router()

router.post("/", async function chatRoute(req, res) {
  try {
    const { message, contextMaterials = [], history = [] } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      })
    }

    const reply = await generateResponse(message, { contextMaterials, history })

    res.status(200).json({
      success: true,
      response: reply,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      message: getPublicErrorMessage(error, "An error occurred while generating the response"),
    })
  }
})

export default router
