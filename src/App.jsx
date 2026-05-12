import { useState, useEffect } from "react";
import "./App.css";

const API = "https://quiz-backend-pmfo.onrender.com/api";

// ─── Student Form ───────────────────────────────────────────
function StudentForm({ onStart }) {
  const [form, setForm] = useState({ name: "", age: "", roll: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};

    if (!form.name.trim()) {
      e.name = "Name is required";
    }

    if (!form.age || +form.age < 1 || +form.age > 100) {
      e.age = "Enter a valid age (1-100)";
    }

    if (!form.roll.trim()) {
      e.roll = "Roll number is required";
    }

    return e;
  };

  const handleSubmit = async () => {
    const e = validate();

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const res = await fetch(`${API}/students/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          age: parseInt(form.age),
          roll_number: form.roll.trim(),
        }),
      });

      if (res.ok) {
        onStart(form.name.trim());
      } else {
        const data = await res.json();

        setApiError(
          data.roll_number?.[0] ||
            "Something went wrong. Please try again."
        );
      }
    } catch {
      setApiError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="shell">
        <div className="header">
          <div className="badge">Student Registration</div>

          <h1 className="title">Join the Quiz</h1>

          <p className="subtitle">
            Fill in your details first
          </p>
        </div>

        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                display: "block",
                marginBottom: 6,
              }}
            >
              👤 STUDENT NAME
            </label>

            <input
              className="student-input"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={(e) => {
                setForm({
                  ...form,
                  name: e.target.value,
                });

                setErrors({
                  ...errors,
                  name: "",
                });
              }}
            />

            {errors.name && (
              <p className="field-error">
                ⚠ {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                display: "block",
                marginBottom: 6,
              }}
            >
              🎂 AGE
            </label>

            <input
              className="student-input"
              placeholder="e.g. 18"
              type="number"
              value={form.age}
              onChange={(e) => {
                setForm({
                  ...form,
                  age: e.target.value,
                });

                setErrors({
                  ...errors,
                  age: "",
                });
              }}
            />

            {errors.age && (
              <p className="field-error">
                ⚠ {errors.age}
              </p>
            )}
          </div>

          <div>
            <label
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                display: "block",
                marginBottom: 6,
              }}
            >
              🎓 ROLL NUMBER
            </label>

            <input
              className="student-input"
              placeholder="e.g. CS-2024-001"
              value={form.roll}
              onChange={(e) => {
                setForm({
                  ...form,
                  roll: e.target.value,
                });

                setErrors({
                  ...errors,
                  roll: "",
                });
              }}
            />

            {errors.roll && (
              <p className="field-error">
                ⚠ {errors.roll}
              </p>
            )}
          </div>

          {apiError && (
            <p className="field-error">
              ❌ {apiError}
            </p>
          )}

          <button
            className="restart-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Start Quiz →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Option Button ──────────────────────────────────────────
function OptionButton({
  option,
  index,
  selected,
  revealed,
  correct,
  onSelect,
}) {
  const letters = ["A", "B", "C", "D"];

  const isSelected = selected === option.id;
  const isCorrect = revealed && option.id === correct;
  const isWrong =
    revealed && isSelected && option.id !== correct;

  let className = "option-btn";

  if (!revealed && isSelected) {
    className += " selected";
  }

  if (isCorrect) {
    className += " correct revealed";
  }

  if (isWrong) {
    className += " wrong revealed";
  }

  if (revealed && !isCorrect && !isWrong) {
    className += " revealed";
  }

  return (
    <button
      className={className}
      onClick={() =>
        !revealed && onSelect(option.id)
      }
    >
      <span className="option-bullet">
        {letters[index]}
      </span>

      <span className="option-text">
        {option.text}
      </span>

      {isCorrect && (
        <span className="option-icon">✓</span>
      )}

      {isWrong && (
        <span className="option-icon">✗</span>
      )}
    </button>
  );
}

function NavBtn({
  onClick,
  disabled,
  primary,
  children,
}) {
  return (
    <button
      className={`nav-btn ${
        primary ? "primary" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ─── Main Quiz App ──────────────────────────────────────────
export default function App() {
  const [studentName, setStudentName] =
    useState(null);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [current, setCurrent] = useState(0);

  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});

  const [finished, setFinished] =
    useState(false);

  // Fetch Questions
  useEffect(() => {
    if (!studentName) return;

    setLoading(true);

    fetch(`${API}/questions/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Server error: ${res.status}`
          );
        }

        return res.json();
      })
      .then((data) => {
        setQuestions(
          data.map((q) => ({
            ...q,
            correct_option: q.options.find(
              (o) => o.is_correct
            )?.id,
          }))
        );
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [studentName]);

  // Show Student Form
  if (!studentName) {
    return (
      <StudentForm
        onStart={(name) =>
          setStudentName(name)
        }
      />
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="app">
        <div className="shell">
          <div className="card load-box">
            <div className="spinner" />

            <p className="load-text">
              Loading questions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="app">
        <div className="shell">
          <div className="card">
            <div className="error-box">
              <strong>
                ⚠️ Could not connect to Django API
              </strong>

              <code>{error}</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];

  const totalQ = questions.length;

  const progress = totalQ
    ? ((current + 1) / totalQ) * 100
    : 0;

  const score = questions.filter(
    (qq) =>
      answers[qq.id] === qq.correct_option
  ).length;

  const pct = totalQ
    ? Math.round((score / totalQ) * 100)
    : 0;

  const grade =
    pct >= 80
      ? "Excellent! 🎉"
      : pct >= 60
      ? "Good Job! 👍"
      : "Keep Practicing 💪";

  const ringClass =
    pct >= 80
      ? "high"
      : pct >= 60
      ? "medium"
      : "low";

  // Result Screen
  if (finished) {
    return (
      <div className="app">
        <div className="shell">
          <div className="header">
            <div className="badge">
              Quiz Complete
            </div>

            <h1 className="title">
              {studentName}'s Result 🎓
            </h1>
          </div>

          <div className="result-card">
            <div
              className={`score-ring ${ringClass}`}
            >
              <span className="score-pct">
                {pct}%
              </span>

              <span className="score-label-sm">
                Score
              </span>
            </div>

            <h2 className="result-title">
              {grade}
            </h2>

            <p className="result-sub">
              You answered {score} out of{" "}
              {totalQ} correctly.
            </p>

            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-num green">
                  {score}
                </div>

                <div className="stat-lbl">
                  Correct
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-num red">
                  {totalQ - score}
                </div>

                <div className="stat-lbl">
                  Wrong
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-num blue">
                  {totalQ}
                </div>

                <div className="stat-lbl">
                  Total
                </div>
              </div>
            </div>

            <button
              className="restart-btn"
              onClick={() => {
                setAnswers({});
                setRevealed({});
                setCurrent(0);
                setFinished(false);
                setStudentName(null);
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isRevealed = revealed[q?.id];

  const hasSelected =
    answers[q?.id] !== undefined;

  return (
    <div className="app">
      <div className="shell">
        <div className="header">
          <div className="badge">
            👋 {studentName}
          </div>

          <h1 className="title">
            Test Your Knowledge
          </h1>

          <p className="subtitle">
            React + Django REST Framework
          </p>
        </div>

        <div className="card">
          <div className="progress-row">
            <span className="progress-label">
              Question {current + 1} of{" "}
              {totalQ}
            </span>

            <span className="progress-pill">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="question-number">
            Q{current + 1}
          </div>

          <div className="question-text">
            {q?.text}
          </div>

          <div className="options-grid">
            {q?.options.map((opt, i) => (
              <OptionButton
                key={opt.id}
                option={opt}
                index={i}
                selected={answers[q.id]}
                revealed={isRevealed}
                correct={q.correct_option}
                onSelect={(id) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [q.id]: id,
                  }))
                }
              />
            ))}
          </div>

          {isRevealed && (
            <div
              className={`feedback ${
                answers[q.id] ===
                q.correct_option
                  ? "correct"
                  : "wrong"
              }`}
            >
              {answers[q.id] ===
              q.correct_option
                ? "✅ Correct! Well done."
                : `❌ Incorrect. Right answer: ${
                    q.options.find(
                      (o) =>
                        o.id ===
                        q.correct_option
                    )?.text
                  }`}
            </div>
          )}
        </div>

        <div className="nav-row">
          <NavBtn
            onClick={() =>
              setCurrent((c) =>
                Math.max(0, c - 1)
              )
            }
            disabled={current === 0}
          >
            ← Previous
          </NavBtn>

          {!isRevealed ? (
            <NavBtn
              primary
              onClick={() =>
                setRevealed((prev) => ({
                  ...prev,
                  [q.id]: true,
                }))
              }
              disabled={!hasSelected}
            >
              Check Answer
            </NavBtn>
          ) : (
            <NavBtn
              primary
              onClick={() => {
                if (current < totalQ - 1) {
                  setCurrent((c) => c + 1);
                } else {
                  setFinished(true);
                }
              }}
            >
              {current === totalQ - 1
                ? "See Results →"
                : "Next →"}
            </NavBtn>
          )}
        </div>

        <div className="dots-row">
          {questions.map((_, i) => {
            const done =
              revealed[questions[i].id];

            const correct =
              done &&
              answers[questions[i].id] ===
                questions[i].correct_option;

            let dotClass = "dot";

            if (i === current) {
              dotClass += " active";
            } else if (done && correct) {
              dotClass += " correct";
            } else if (done && !correct) {
              dotClass += " wrong";
            } else {
              dotClass += " default";
            }

            return (
              <div
                key={i}
                className={dotClass}
                onClick={() => setCurrent(i)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
