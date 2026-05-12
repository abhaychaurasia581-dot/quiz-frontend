import { useState, useEffect } from "react";
import "./App.css";

function OptionButton({ option, index, selected, revealed, correct, onSelect }) {
  const letters = ["A", "B", "C", "D"];
  const isSelected = selected === option.id;
  const isCorrect = revealed && option.id === correct;
  const isWrong = revealed && isSelected && option.id !== correct;

  let className = "option-btn";
  if (!revealed && isSelected) className += " selected";
  if (isCorrect) className += " correct revealed";
  if (isWrong) className += " wrong revealed";
  if (revealed && !isCorrect && !isWrong) className += " revealed";

  return (
    <button className={className} onClick={() => !revealed && onSelect(option.id)}>
      <span className="option-bullet">{letters[index]}</span>
      <span className="option-text">{option.text}</span>
      {isCorrect && <span className="option-icon">✓</span>}
      {isWrong && <span className="option-icon">✗</span>}
    </button>
  );
}

function NavBtn({ onClick, disabled, primary, children }) {
  return (
    <button
      className={`nav-btn ${primary ? "primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function QuizApp() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/questions/");
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        const transformed = data.map(q => ({
          ...q,
          correct_option: q.options.find(o => o.is_correct)?.id
        }));
        setQuestions(transformed);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const q = questions[current];
  const totalQ = questions.length;
  const progress = totalQ ? ((current + 1) / totalQ) * 100 : 0;
  const score = questions.filter(qq => answers[qq.id] === qq.correct_option).length;
  const pct = totalQ ? Math.round((score / totalQ) * 100) : 0;
  const grade = pct >= 80 ? "Excellent! 🎉" : pct >= 60 ? "Good Job! 👍" : "Keep Practising 💪";
  const ringClass = pct >= 80 ? "high" : pct >= 60 ? "medium" : "low";

  if (loading) return (
    <div className="app">
      <div className="shell">
        <div className="card load-box">
          <div className="spinner" />
          <p className="load-text">Loading questions from Django...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="app">
      <div className="shell">
        <div className="card">
          <div className="error-box">
            <strong>⚠️ Could not connect to Django API</strong>
            <code>{error}</code>
            <p>Make sure Django is running at http://127.0.0.1:8000</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="app">
      <div className="shell">
        <div className="card load-box">
          <p className="load-text">⚠️ No questions found!</p>
          <p className="load-text">Add questions at http://127.0.0.1:8000/admin</p>
        </div>
      </div>
    </div>
  );

  if (finished) return (
    <div className="app">
      <div className="shell">
        <div className="header">
          <div className="badge">Quiz Complete</div>
          <h1 className="title">Your Results</h1>
        </div>
        <div className="result-card">
          <div className={`score-ring ${ringClass}`}>
            <span className="score-pct">{pct}%</span>
            <span className="score-label-sm">Score</span>
          </div>
          <h2 className="result-title">{grade}</h2>
          <p className="result-sub">You answered {score} out of {totalQ} correctly.</p>
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-num green">{score}</div>
              <div className="stat-lbl">Correct</div>
            </div>
            <div className="stat-box">
              <div className="stat-num red">{totalQ - score}</div>
              <div className="stat-lbl">Wrong</div>
            </div>
            <div className="stat-box">
              <div className="stat-num blue">{totalQ}</div>
              <div className="stat-lbl">Total</div>
            </div>
          </div>
          <button className="restart-btn"
            onClick={() => { setAnswers({}); setRevealed({}); setCurrent(0); setFinished(false); }}>
            Restart Quiz
          </button>
        </div>
      </div>
    </div>
  );

  const isRevealed = revealed[q.id];
  const hasSelected = answers[q.id] !== undefined;

  return (
    <div className="app">
      <div className="shell">
        <div className="header">
          <div className="badge">Full-Stack Quiz App</div>
          <h1 className="title">Test Your Knowledge</h1>
          <p className="subtitle">React + Django REST Framework</p>
        </div>
        <div className="card">
          <div className="progress-row">
            <span className="progress-label">Question {current + 1} of {totalQ}</span>
            <span className="progress-pill">{Math.round(progress)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="question-number">Q{current + 1}</div>
          <div className="question-text">{q.text}</div>
          <div className="options-grid">
            {q.options.map((opt, i) => (
              <OptionButton
                key={opt.id}
                option={opt}
                index={i}
                selected={answers[q.id]}
                revealed={isRevealed}
                correct={q.correct_option}
                onSelect={(id) => setAnswers(prev => ({ ...prev, [q.id]: id }))}
              />
            ))}
          </div>
          {isRevealed && (
            <div className={`feedback ${answers[q.id] === q.correct_option ? "correct" : "wrong"}`}>
              {answers[q.id] === q.correct_option
                ? "✅ Correct! Well done."
                : `❌ Incorrect. Right answer: ${q.options.find(o => o.id === q.correct_option)?.text}`}
            </div>
          )}
        </div>
        <div className="nav-row">
          <NavBtn onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
            ← Previous
          </NavBtn>
          {!isRevealed
            ? <NavBtn primary onClick={() => setRevealed(prev => ({ ...prev, [q.id]: true }))} disabled={!hasSelected}>
                Check Answer
              </NavBtn>
            : <NavBtn primary onClick={() => { if (current < totalQ - 1) setCurrent(c => c + 1); else setFinished(true); }}>
                {current === totalQ - 1 ? "See Results →" : "Next →"}
              </NavBtn>
          }
        </div>
        <div className="dots-row">
          {questions.map((_, i) => {
            const done = revealed[questions[i].id];
            const correct = done && answers[questions[i].id] === questions[i].correct_option;
            let dotClass = "dot";
            if (i === current) dotClass += " active";
            else if (done && correct) dotClass += " correct";
            else if (done && !correct) dotClass += " wrong";
            else dotClass += " default";
            return <div key={i} className={dotClass} onClick={() => setCurrent(i)} />;
          })}
        </div>
      </div>
    </div>
  );
}