import rateLimit from "express-rate-limit";

export const quizLimiter = rateLimit({
  windowsMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: "Quiz generation limit reached. Please try again after an hour.",
  }
});

export const chatLimiter = rateLimit({
  windowsMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: "Too many requests. Please try again later."
  }
})

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  }
});