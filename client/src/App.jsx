
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [quiz, setQuiz] = useState(null);
  const [topic, setTopic] = useState("JavaScript");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateQuiz(event) {
    if (event) event.preventDefault();

    setLoading(true);
    setError("");
    setSubmitted(false);
    setAnswers({});

    try {
      const response = await fetch(
        "http://localhost:5000/api/generate-quiz",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate quiz.");
      }

      setQuiz(data);
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("http://localhost:5000/api/quiz")
      .then(response => {
        if (!response.ok) throw new Error("Quiz request failed");
        return response.json();
      })
      .then(setQuiz)
      .catch(() => {
        setError("Cannot connect to the backend. Check port 5000.");
      });
  }, []);

  const score = quiz
    ? quiz.questions.reduce(
        (total, question, index) =>
          total + (answers[index] === question.answer ? 1 : 0),
        0
      )
    : 0;

  return (
    <main className="container">
      <header className="hero">
        <span className="tag">YOUR PERSONAL LEARNING SPACE</span>
        <h1>SmartStudy AI <span>✦</span></h1>
        <p>Learn smarter. Practice consistently. Improve every day.</p>
      </header>

      <form className="quiz-card generator" onSubmit={generateQuiz}>
        <label htmlFor="topic"><strong>What do you want to learn?</strong></label>
        <div className="topic-row">
          <input
            id="topic"
            value={topic}
            maxLength={100}
            onChange={event => setTopic(event.target.value)}
            placeholder="e.g. Data Structures, DBMS, React"
            required
          />
          <button className="primary-button" disabled={loading}>
            {loading ? "Generating..." : "Generate AI Quiz"}
          </button>
        </div>
        <p className="hint">
          Gemini creates five multiple-choice questions for your topic.
        </p>
      </form>

      {error && <p className="error-message">{error}</p>}

      {quiz && (
        <>
          <section className="stats">
            <article className="stat-card">
              <span>📚</span>
              <p>Current topic</p>
              <h3>{quiz.topic}</h3>
            </article>
            <article className="stat-card">
              <span>📝</span>
              <p>Total questions</p>
              <h3>{quiz.questions.length}</h3>
            </article>
            <article className="stat-card">
              <span>🎯</span>
              <p>Your score</p>
              <h3>
                {submitted
                  ? `${score}/${quiz.questions.length}`
                  : "—"}
              </h3>
            </article>
          </section>

          <section className="quiz-card">
            <span className="tag">PRACTICE MODE</span>
            <h2>Knowledge Check</h2>

            {quiz.questions.map((question, index) => (
              <article className="question" key={index}>
                <h3>{index + 1}. {question.question}</h3>

                <div className="options">
                  {question.options.map(option => {
                    let className = "option";

                    if (submitted && option === question.answer) {
                      className += " correct";
                    } else if (
                      submitted &&
                      answers[index] === option &&
                      option !== question.answer
                    ) {
                      className += " incorrect";
                    }

                    return (
                      <label className={className} key={option}>
                        <input
                          type="radio"
                          name={`question-${index}`}
                          checked={answers[index] === option}
                          disabled={submitted}
                          onChange={() =>
                            setAnswers({
                              ...answers,
                              [index]: option
                            })
                          }
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>

                {submitted && (
                  <p className="explanation">
                    Correct answer: {question.answer}
                  </p>
                )}
              </article>
            ))}

            {!submitted ? (
              <button
                className="primary-button"
                disabled={
                  Object.keys(answers).length !== quiz.questions.length
                }
                onClick={() => setSubmitted(true)}
              >
                Submit answers →
              </button>
            ) : (
              <div className="result">
                <h3>Quiz completed!</h3>
                <p>
                  You scored {score} out of {quiz.questions.length}.
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    setAnswers({});
                    setSubmitted(false);
                  }}
                >
                  Try again
                </button>
              </div>
            )}
          </section>
        </>
      )}

      <footer>SmartStudy AI · Practice today, progress tomorrow.</footer>
    </main>
  );
}

export default App;
