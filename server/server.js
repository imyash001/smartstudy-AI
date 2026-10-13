
const express = require("express");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const Quiz = require("./models/Quiz");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "SmartStudy AI backend is running!"
  });
});

// Existing sample quiz
app.get("/api/quiz", (req, res) => {
  res.json({
    topic: "JavaScript",
    questions: [
      {
        question: "Which keyword declares a block-scoped variable?",
        options: ["var", "let", "print", "echo"],
        answer: "let"
      },
      {
        question: "Which method parses JSON text?",
        options: [
          "JSON.stringify()",
          "JSON.parse()",
          "JSON.convert()",
          "JSON.object()"
        ],
        answer: "JSON.parse()"
      }
    ]
  });
});

// New Gemini-powered quiz endpoint
app.post("/api/generate-quiz", authMiddleware, async (req, res) => {
  try {
    const topic = String(req.body.topic || "").trim();

    if (!topic || topic.length > 100) {
      return res.status(400).json({
        error: "Enter a topic between 1 and 100 characters."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured on the server."
      });
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Create exactly 5 multiple-choice quiz questions about "${topic}".

Return only valid JSON in this format:
{
  "topic": "${topic}",
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer": "Exact text of the correct option"
    }
  ]
}

Every question must have exactly four options.
The answer must exactly match one of the options.
Questions should be accurate and appropriate for a student.`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
        maxOutputTokens: 3000
      }
    });

    const quiz = JSON.parse(response.text);

    if (
      !quiz ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length !== 5 ||
      quiz.questions.some(q =>
        typeof q.question !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !q.options.includes(q.answer)
      )
    ) {
      throw new Error("Gemini returned an invalid quiz format.");
    }

  const savedQuiz = await Quiz.create({
  topic,
  questions: quiz.questions,
  user: req.user.userId
});
res.json({
  quizId: savedQuiz._id,
  topic,
  questions: quiz.questions
});
  } catch (error) {
    console.error("Quiz generation failed:", error.message);
    res.status(500).json({
      error: "Quiz generation failed. Check your API key, model access, and server logs."
    });
  }
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

 const uri = process.env.MONGODB_URI;

console.log("URI present:", Boolean(uri));
console.log("URI starts correctly:", uri?.startsWith("mongodb+srv://"));
console.log("Contains placeholder:", /[<>]/.test(uri || ""));
console.log("Contains whitespace:", /\s/.test(uri || ""));
console.log("Contains username/password section:", /mongodb\+srv:\/\/[^/@:]+:[^/@]+@/.test(uri || ""));
console.log("Contains cluster hostname:", /@[^/]+\.mongodb\.net/.test(uri || ""));

await mongoose.connect(uri);
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`SmartStudy AI server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

app.get("/api/quiz/history", authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      user: req.user.userId
    })
      .select("-questions.answer")
      .sort({ createdAt: -1 });

    res.json({ quizzes });
  } catch (error) {
    console.error("Quiz history error:", error.message);
    res.status(500).json({
      message: "Unable to retrieve quiz history"
    });
  }
});


startServer();