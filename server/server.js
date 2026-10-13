
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
app.post("/api/generate-quiz", async (req, res) => {
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

    res.json({
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

app.listen(PORT, () => {
  console.log(`SmartStudy AI server running on port ${PORT}`);
});
