import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, RotateCcw,
  Trophy, ChevronRight, Sparkles, BookOpen, AlertCircle,
  Check, Timer, HelpCircle, Search, FileText
} from 'lucide-react';

/*
  Quiz Mode:
  - User selects topics (with no-repeat: topic combos already fully attempted show a warning)
  - Cards shown one by one with 4 options generated from the pool
  - No flip — just pick the answer
  - Score saved to history
*/
export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState('select'); // select | session | result
  const [allTopics, setAllTopics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState(location.state?.selectedTopics || []);
  const [questions, setQuestions] = useState([]); // derived from flashcards
  const [loadingCards, setLoadingCards] = useState(false);
  const [current, setCurrent] = useState(0);
  const [chosenIdx, setChosenIdx] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [error, setError] = useState('');
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (location.state?.selectedTopics?.length > 0) {
      handleStartSessionWith(location.state.selectedTopics);
    } else {
      fetchTopics();
    }
  }, []);

  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const res = await api.get('/api/study/topics');
      setAllTopics(res.data || []);
    } catch {
      setError('Could not load topics.');
    } finally {
      setLoadingTopics(false);
    }
  };

  const toggleTopic = (id) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /**
   * Build multiple-choice questions from flashcards.
   * Each question shows the flashcard question + 4 options (1 correct, 3 distractors from other cards).
   */
  const buildQuestions = (cards) => {
    const shuffled = shuffleArray(cards);
    return shuffled.map((card, idx) => {
      const others = shuffled.filter((_, i) => i !== idx);
      const distractors = shuffleArray(others)
        .slice(0, 3)
        .map((c) => c.answer);
      const allOptions = shuffleArray([card.answer, ...distractors]);
      return {
        id: card.id,
        question: card.question,
        correctAnswer: card.answer,
        options: allOptions,
        difficulty: card.difficulty,
      };
    });
  };

  const handleStartSessionWith = async (topicsToUse) => {
    setLoadingCards(true);
    setError('');
    try {
      const params = topicsToUse.map((id) => `topicIds=${id}`).join('&');
      const res = await api.get(`/api/sessions/flashcards?${params}`);
      const cards = res.data || [];
      if (cards.length < 2) {
        setError('Need at least 2 flashcards to run quiz mode. Generate more flashcards first.');
        setLoadingCards(false);
        return;
      }
      const qs = buildQuestions(cards);
      setQuestions(qs);
      setCurrent(0);
      setChosenIdx(null);
      setRevealed(false);
      setScore({ correct: 0, incorrect: 0 });
      startTimeRef.current = Date.now();
      setPhase('session');
    } catch {
      setError('Failed to load flashcards.');
    } finally {
      setLoadingCards(false);
    }
  };

  const handleStartSession = () => handleStartSessionWith(selectedTopics);

  const handleChoose = (idx) => {
    if (revealed) return;
    setChosenIdx(idx);
    setRevealed(true);
    const q = questions[current];
    const isCorrect = q.options[idx] === q.correctAnswer;
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      incorrect: s.incorrect + (!isCorrect ? 1 : 0),
    }));
  };

  const handleNext = async () => {
    const q = questions[current];
    const isCorrect = questions[current].options[chosenIdx] === q.correctAnswer;
    // submit review to backend
    try {
      await api.post(`/api/practice/flashcards/${q.id}/review`, { isCorrect });
    } catch {}

    if (current + 1 >= questions.length) {
      const finalScore = {
        correct: score.correct,
        incorrect: score.incorrect,
      };
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      await saveSession(finalScore, duration);
      setPhase('result');
    } else {
      setCurrent((c) => c + 1);
      setChosenIdx(null);
      setRevealed(false);
    }
  };

  const saveSession = async (finalScore, duration) => {
    try {
      await api.post('/api/sessions/complete', {
        topicIds: selectedTopics,
        sessionType: 'QUIZ',
        correctCount: finalScore.correct,
        incorrectCount: finalScore.incorrect,
        durationSeconds: duration,
      });
    } catch {}
  };

  const handleRestart = () => {
    setPhase('select');
    setSelectedTopics([]);
    setQuestions([]);
    setScore({ correct: 0, incorrect: 0 });
    setCurrent(0);
    setChosenIdx(null);
    setRevealed(false);
  };

  // ──────────────────────────────────────────
  // PHASE: SELECT TOPICS
  // ──────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="min-h-[100dvh] relative" style={{ background: '#050508' }}>
        <div className="orb orb-indigo" style={{ opacity: 0.08 }} />
        <div className="orb orb-rose" style={{ opacity: 0.05 }} />

        <nav className="sticky top-0 z-50 px-4 py-3">
          <div className="max-w-3xl mx-auto nav-island rounded-2xl px-5 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={15} />
            </button>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', boxShadow: '0 4px 12px rgba(192,132,252,0.4)' }}
            >
              <Sparkles size={15} className="text-white" />
            </div>
            <h1 className="font-black text-text-primary text-sm">Quiz Mode</h1>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-8 relative z-10">
          <div className="animate-in mb-8">
            <h2 className="text-2xl font-black text-text-primary mb-1">Choose Quiz Topics</h2>
            <p className="text-text-muted text-sm">Pick topics for a multiple-choice quiz. Mix topics for an extra challenge.</p>
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-sm font-medium text-rose-light animate-in"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
            >
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {loadingTopics ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="text-indigo-light animate-spin-slow" />
            </div>
          ) : allTopics.length === 0 ? (
            <div className="rounded-3xl p-12 text-center" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <BookOpen size={32} className="text-text-muted mx-auto mb-4" />
              <h3 className="font-bold text-text-primary mb-2">No topics yet</h3>
              <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">Upload PDFs and extract topics from the folder view first.</p>
              <button onClick={() => navigate('/dashboard')} className="btn-primary mx-auto">Go to Dashboard</button>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search topics or documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="field-input !pl-11"
                  style={{ background: 'rgba(18,18,28,0.8)' }}
                />
              </div>

              {/* Group by document name */}
              <div className="mb-8 space-y-6">
                {(() => {
                  const filtered = allTopics.filter(t => 
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    (t.documentTitle && t.documentTitle.toLowerCase().includes(searchQuery.toLowerCase()))
                  );

                  if (filtered.length === 0) {
                    return <p className="text-center text-text-muted py-8">No topics match your search.</p>;
                  }

                  const grouped = filtered.reduce((acc, topic) => {
                    const doc = topic.documentTitle || 'Other Topics';
                    if (!acc[doc]) acc[doc] = [];
                    acc[doc].push(topic);
                    return acc;
                  }, {});

                  return Object.entries(grouped).map(([docTitle, docTopics]) => (
                    <div key={docTitle} className="animate-in">
                      <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2 px-1">
                        <FileText size={14} className="text-indigo-light" />
                        {docTitle}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {docTopics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className="text-left rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: isSelected ? 'rgba(192,132,252,0.12)' : 'rgba(18,18,28,0.8)',
                        border: `1px solid ${isSelected ? 'rgba(192,132,252,0.35)' : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: isSelected ? '0 4px 20px rgba(192,132,252,0.15)' : '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">{topic.name}</p>
                          {topic.category && (
                            <p className="text-2xs text-text-muted mt-0.5">{topic.category}</p>
                          )}
                        </div>
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background: isSelected ? 'linear-gradient(135deg, #818cf8, #c084fc)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isSelected ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
                          }}
                        >
                          {isSelected && <Check size={11} className="text-white" />}
                        </div>
                      </div>
                      <div className="progress-track mt-3">
                        <div className="progress-fill" style={{ width: `${topic.masteryLevel ?? 0}%` }} />
                      </div>
                      <p className="text-2xs text-text-muted mt-1">{topic.masteryLevel ?? 0}% mastery</p>
                    </button>
                  );
                })}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="sticky bottom-6">
                <div
                  className="rounded-2xl p-4 flex items-center justify-between gap-4"
                  style={{
                    background: 'rgba(13,13,20,0.9)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      {selectedTopics.length === 0 ? 'Select at least one topic' : `${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''} selected`}
                    </p>
                  </div>
                  <button
                    id="start-quiz-btn"
                    onClick={handleStartSession}
                    disabled={selectedTopics.length === 0 || loadingCards}
                    className="btn-primary shrink-0"
                    style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', boxShadow: '0 4px 16px rgba(192,132,252,0.35)' }}
                  >
                    {loadingCards ? <Loader2 size={15} className="animate-spin-slow" /> : <Sparkles size={15} />}
                    {loadingCards ? 'Loading…' : 'Start Quiz'}
                    {!loadingCards && <ChevronRight size={15} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // PHASE: SESSION (MCQ)
  // ──────────────────────────────────────────
  if (phase === 'session') {
    const q = questions[current];
    const progress = (current / questions.length) * 100;

    return (
      <div className="min-h-[100dvh] relative flex flex-col" style={{ background: '#050508' }}>
        <div className="orb orb-indigo" style={{ opacity: 0.06 }} />

        <nav className="sticky top-0 z-50 px-4 py-3">
          <div className="max-w-2xl mx-auto nav-island rounded-2xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', boxShadow: '0 4px 12px rgba(192,132,252,0.4)' }}
              >
                <Sparkles size={15} className="text-white" />
              </div>
              <h1 className="font-black text-text-primary text-sm">Quiz Mode</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
                <CheckCircle size={11} /> {score.correct}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold" style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185' }}>
                <XCircle size={11} /> {score.incorrect}
              </div>
              <span className="text-2xs font-bold text-text-muted ml-1">{current + 1}/{questions.length}</span>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col relative z-10">
          {/* Progress */}
          <div className="progress-track w-full mb-8">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Question card */}
          <div
            className="rounded-3xl p-7 mb-6 animate-in"
            style={{
              background: 'rgba(18,18,28,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle size={14} className="text-indigo-light shrink-0" />
              <p className="text-2xs font-semibold text-indigo-light uppercase tracking-widest">Question {current + 1}</p>
              {q.difficulty && (
                <span
                  className="ml-auto px-2 py-0.5 rounded-full text-2xs font-bold"
                  style={{
                    background: q.difficulty === 'EASY' ? 'rgba(16,185,129,0.15)' : q.difficulty === 'HARD' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)',
                    color: q.difficulty === 'EASY' ? '#34d399' : q.difficulty === 'HARD' ? '#fb7185' : '#fbbf24',
                  }}
                >
                  {q.difficulty}
                </span>
              )}
            </div>
            <p className="text-base font-bold text-text-primary leading-relaxed">{q.question}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((option, idx) => {
              const isChosen = chosenIdx === idx;
              const isCorrect = option === q.correctAnswer;
              let style = {
                background: 'rgba(18,18,28,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              };
              if (revealed) {
                if (isCorrect) {
                  style = {
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.4)',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.15)',
                  };
                } else if (isChosen && !isCorrect) {
                  style = {
                    background: 'rgba(244,63,94,0.15)',
                    border: '1px solid rgba(244,63,94,0.4)',
                    boxShadow: '0 4px 16px rgba(244,63,94,0.12)',
                  };
                } else {
                  style.opacity = '0.4';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleChoose(idx)}
                  disabled={revealed}
                  className="rounded-xl p-4 text-left flex items-center gap-3 transition-all duration-200 disabled:cursor-default"
                  style={{
                    ...style,
                    transform: !revealed ? undefined : 'none',
                  }}
                  onMouseEnter={e => { if (!revealed) e.currentTarget.style.borderColor = 'rgba(129,140,248,0.3)'; }}
                  onMouseLeave={e => { if (!revealed) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      background: revealed && isCorrect ? 'rgba(16,185,129,0.3)' : revealed && isChosen && !isCorrect ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.06)',
                      color: revealed && isCorrect ? '#34d399' : revealed && isChosen && !isCorrect ? '#fb7185' : '#9898b8',
                    }}
                  >
                    {revealed && isCorrect ? <CheckCircle size={14} /> : revealed && isChosen && !isCorrect ? <XCircle size={14} /> : String.fromCharCode(65 + idx)}
                  </div>
                  <p className="text-sm font-medium text-text-primary">{option}</p>
                </button>
              );
            })}
          </div>

          {/* Next button */}
          {revealed && (
            <div className="mt-6 flex justify-end animate-in">
              <button
                id="next-question-btn"
                onClick={handleNext}
                className="btn-primary"
              >
                {current + 1 >= questions.length ? 'See Results' : 'Next Question'}
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // PHASE: RESULT
  // ──────────────────────────────────────────
  if (phase === 'result') {
    const total = score.correct + score.incorrect;
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0;
    const circumference = 2 * Math.PI * 44;
    const strokeDash = (pct / 100) * circumference;

    return (
      <div className="min-h-[100dvh] relative flex items-center justify-center p-4" style={{ background: '#050508' }}>
        <div className="orb orb-indigo" style={{ opacity: 0.1 }} />
        <div className="orb orb-emerald" style={{ opacity: 0.08 }} />

        <div
          className="w-full max-w-sm rounded-3xl p-8 text-center animate-in relative z-10"
          style={{
            background: 'rgba(13,13,20,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            <Trophy size={26} style={{ color: '#fbbf24' }} />
          </div>
          <h2 className="text-xl font-black text-text-primary mb-1">Quiz Complete!</h2>
          <p className="text-text-muted text-sm mb-6">{total} questions answered</p>

          <div className="score-ring mx-auto mb-6">
            <svg width="120" height="120" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="48" cy="48" r="44" fill="none" stroke="url(#scoreGrad2)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`} />
              <defs>
                <linearGradient id="scoreGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="score-ring-text">
              <span className="text-2xl font-black text-text-primary">{pct}%</span>
              <span className="text-2xs text-text-muted">score</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-7">
            <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-2xl font-black" style={{ color: '#34d399' }}>{score.correct}</p>
              <p className="text-2xs font-semibold" style={{ color: '#34d399' }}>Correct</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <p className="text-2xl font-black" style={{ color: '#fb7185' }}>{score.incorrect}</p>
              <p className="text-2xs font-semibold" style={{ color: '#fb7185' }}>Wrong</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button id="quiz-restart-btn" onClick={handleRestart} className="btn-primary w-full">
              <RotateCcw size={15} />
              Try Again
            </button>
            <button id="quiz-history-btn" onClick={() => navigate('/history')} className="btn-secondary w-full">
              View History
            </button>
            <button id="quiz-dashboard-btn" onClick={() => navigate('/dashboard')} className="btn-secondary w-full">
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
