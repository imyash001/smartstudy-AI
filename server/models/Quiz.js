
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true
  },
  answer: {
    type: String,
    required: true,
    select: false
  }
});


const quizSchema = new mongoose.Schema({
  topic: { type: String, required: true, trim: true },
  questions: { type: [questionSchema], required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    index: true
  }
}, { timestamps: true });


module.exports = mongoose.model("Quiz", quizSchema);
