import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import quizRoutes from "./routes/quizRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"
import noteRoutes from "./routes/noteRoutes.js"
import flashCardRoutes from "./routes/flashCardRoutes.js"
import profileRoutes from "./routes/profileRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"

import { quizLimiter, chatLimiter, flashCardLimiter, globalLimiter } from "./middleware/rateLimiter.js"
import { getPublicErrorMessage, INVALID_JSON_REQUEST_MESSAGE, isRequestJsonParseError } from "./utils/apiErrors.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json({ limit: "2mb" }))

app.use(function handleJsonParseError(error, req, res, next) {
  if (!isRequestJsonParseError(error)) {
    next(error)
    return
  }

  console.error("Invalid JSON request body:", error)
  res.status(400).json({
    success: false,
    message: INVALID_JSON_REQUEST_MESSAGE,
  })
})

app.use(globalLimiter)

app.use("/api/quiz/", quizLimiter, quizRoutes)
app.use("/api/chat/", chatLimiter, chatRoutes)
app.use("/api/notes", noteRoutes)
app.use("/api/flashcards", flashCardLimiter, flashCardRoutes)
app.use("/api/profile", profileRoutes)
app.use("/api/notifications", notificationRoutes)

app.use(function handleUnhandledApiError(error, req, res, next) {
  console.error("Unhandled API error:", error)
  if (res.headersSent) {
    next(error)
    return
  }

  const statusCode = Number.isFinite(Number(error.status)) ? Number(error.status) : 500
  res.status(statusCode).json({
    success: false,
    message: getPublicErrorMessage(error),
  })
})

const PORT = process.env.PORT ? process.env.PORT : 5000
app.listen(PORT, function handleListen() {
  console.log("Server is running on port " + PORT)
})


