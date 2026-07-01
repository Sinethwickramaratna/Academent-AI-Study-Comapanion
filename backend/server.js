import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import quizRoutes from "./routes/quizRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";

import { quizLimiter, chatLimiter, globalLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(globalLimiter);

app.use("/api/quiz/", quizLimiter, quizRoutes);
app.use("/api/chat/", chatLimiter, chatRoutes);
app.use("/api/notes", noteRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
