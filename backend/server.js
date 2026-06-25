import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from 'express-rate-limit';

import quizRoutes from "./routes/quizRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

import {quizLimiter, chatLimiter, globalLimiter} from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(globalLimiter); // Apply the rate limiter to all requests

app.use("/api/quiz/", quizLimiter, quizRoutes);
app.use("/api/chat/", chatLimiter, chatRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
