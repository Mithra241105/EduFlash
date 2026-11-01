import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import {
  ArrowLeft, Zap, Loader2, CheckCircle, XCircle,
  RotateCcw, Trophy, ChevronRight, Layers, Check,
  BookOpen, AlertCircle, Sparkles, Search, FileText
} from 'lucide-react';

/* ============================================================
   PHASE: select → session → result
   ============================================================ */
export default function Practice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState('select'); // select | session | result
  const [allTopics, setAllTopics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState(location.state?.selectedTopics || []);
  const [flashcards, setFlashcards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);
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

  const toggleTopic = (topicId) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const handleStartSessionWith = async (topicsToUse) => {
    setLoadingCards(true);
    setError('');
    try {
      const params = topicsToUse.map((id) => `topicIds=${id}`).join('&');
      const res = await api.get(`/api/sessions/flashcards?${params}`);
      const cards = res.data || [];
      if (cards.length === 0) {
        setError('No flashcards found for selected topics. Generate flashcards first from the document study page.');
        setLoadingCards(false);
        return;
      }
      setFlashcards(cards);
      setCurrent(0);
      setFlipped(false);
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

  const handleReview = async (isCorrect) => {
    if (reviewing) return;
    const card = flashcards[current];
    setReviewing(true);
    try {
      await api.post(`/api/practice/flashcards/${card.id}/review`, { isCorrect });
      const newScore = {
        correct: score.correct + (isCorrect ? 1 : 0),
        incorrect: score.incorrect + (!isCorrect ? 1 : 0),
      };
      setScore(newScore);
      if (current + 1 >= flashcards.length) {
        // Session complete — save
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        await saveSession(newScore, duration);
        setPhase('result');
      } else {
        setCurrent((c) => c + 1);
        setFlipped(false);
      }
    } catch (err) {
      console.error('Review error:', err);
    } finally {
      setReviewing(false);
    }
  };

  const saveSession = async (finalScore, duration) => {
    try {
      await api.post('/api/sessions/complete', {
        topicIds: selectedTopics,
        sessionType: 'FLASHCARD',
        correctCount: finalScore.correct,
        incorrectCount: finalScore.incorrect,
        durationSeconds: duration,
      });
    } catch (err) {
      console.error('Session save error:', err);
    }
  };

  const handleRestart = () => {
    setPhase('select');
    setSelectedTopics([]);
    setFlashcards([]);
    setScore({ correct: 0, incorrect: 0 });
    setCurrent(0);
    setFlipped(false);
  };

  // ──────────────────────────────────────────
  // PHASE: SELECT TOPICS
  // ──────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="min-h-[100dvh] relative" style={{ background: '#050508' }}>
        <div className="orb orb-indigo" style={{ opacity: 0.08 }} />

        {/* Nav */}
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
              style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
            >
              <Layers size={15} className="text-white" />
            </div>
            <h1 className="font-black text-text-primary text-sm">Flashcard Practice</h1>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-8 relative z-10">
          <div className="animate-in mb-8">
            <h2 className="text-2xl font-black text-text-primary mb-1">Choose Topics</h2>
            <p className="text-text-muted text-sm">Select one or more topics to practice. Combine topics for a mixed session.</p>
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
            <div
              className="rounded-3xl p-12 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <BookOpen size={32} className="text-text-muted mx-auto mb-4" />
              <h3 className="font-bold text-text-primary mb-2">No topics yet</h3>
              <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">
                Upload PDFs and extract topics from the folder view first.
              </p>
              <button onClick={() => navigate('/dashboard')} className="btn-primary mx-auto">
                Go to Dashboard
              </button>
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
                        background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(18,18,28,0.8)',
                        border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: isSelected ? '0 4px 20px rgba(99,102,241,0.2)' : '0 4px 12px rgba(0,0,0,0.3)',
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
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all"
                          style={{
                            background: isSelected ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isSelected ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
                          }}
                        >
                          {isSelected && <Check size={11} className="text-white" />}
                        </div>
                      </div>
                      {/* Mastery bar */}
                      <div className="progress-track mt-3">
                        <div
                          className="progress-fill"
                          style={{ width: `${topic.masteryLevel ?? 0}%` }}
                        />
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

              {/* Start button */}
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
                      {selectedTopics.length === 0
                        ? 'Select at least one topic'
                        : `${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''} selected`}
                    </p>
                    {selectedTopics.length > 0 && (
                      <p className="text-2xs text-text-muted mt-0.5">Ready to practice</p>
                    )}
                  </div>
                  <button
                    id="start-session-btn"
                    onClick={handleStartSession}
                    disabled={selectedTopics.length === 0 || loadingCards}
                    className="btn-primary shrink-0"
                  >
                    {loadingCards ? <Loader2 size={15} className="animate-spin-slow" /> : <Sparkles size={15} />}
                    {loadingCards ? 'Loading…' : 'Start Session'}
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
  // PHASE: SESSION (flashcard flip)
  // ──────────────────────────────────────────
  if (phase === 'session') {
    const card = flashcards[current];
    const progress = (current / flashcards.length) * 100;

    return (
      <div className="min-h-[100dvh] relative flex flex-col" style={{ background: '#050508' }}>
        <div className="orb orb-indigo" style={{ opacity: 0.08 }} />

        {/* Nav */}
        <nav className="sticky top-0 z-50 px-4 py-3">
          <div className="max-w-2xl mx-auto nav-island rounded-2xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPhase('select')}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <ArrowLeft size={15} />
              </button>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
              >
                <Layers size={15} className="text-white" />
              </div>
              <h1 className="font-black text-text-primary text-sm">Practice</h1>
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(129,140,248,0.12)', color: '#a5b4fc', border: '1px solid rgba(129,140,248,0.2)' }}
            >
              {current + 1} / {flashcards.length}
            </span>
          </div>
        </nav>

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col items-center relative z-10">
          {/* Progress */}
          <div className="progress-track w-full mb-6">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Score chips */}
          <div className="flex gap-3 mb-8">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <CheckCircle size={13} />
              {score.correct}
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.2)' }}
            >
              <XCircle size={13} />
              {score.incorrect}
            </div>
            {card.difficulty && (
              <div
                className="px-3 py-1.5 rounded-full text-2xs font-bold"
                style={{
                  background: card.difficulty === 'EASY' ? 'rgba(16,185,129,0.12)' : card.difficulty === 'HARD' ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)',
                  color: card.difficulty === 'EASY' ? '#34d399' : card.difficulty === 'HARD' ? '#fb7185' : '#fbbf24',
                  border: `1px solid ${card.difficulty === 'EASY' ? 'rgba(16,185,129,0.25)' : card.difficulty === 'HARD' ? 'rgba(244,63,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
                }}
              >
                {card.difficulty}
              </div>
            )}
          </div>

          {/* Flip Card */}
          <div
            id="flashcard-flip"
            className="flip-card w-full mb-6"
            style={{ height: '300px', maxWidth: '560px' }}
            onClick={() => setFlipped((f) => !f)}
          >
            <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
              {/* Front */}
              <div
                className="flip-card-front flex flex-col items-center justify-center p-10"
                style={{
                  background: 'rgba(18,18,28,0.9)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <p
                  className="text-2xs font-semibold uppercase tracking-widest mb-5"
                  style={{ color: '#a5b4fc' }}
                >
                  Question
                </p>
                <p className="text-lg font-bold text-text-primary text-center leading-relaxed">{card.question}</p>
                <p className="text-2xs text-text-muted mt-8 flex items-center gap-1">
                  Tap to reveal <ChevronRight size={11} />
                </p>
              </div>

              {/* Back */}
              <div
                className="flip-card-back flex flex-col items-center justify-center p-10"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(18,18,28,0.95) 100%)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  boxShadow: '0 8px 40px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <p
                  className="text-2xs font-semibold uppercase tracking-widest mb-5"
                  style={{ color: '#a5b4fc' }}
                >
                  Answer
                </p>
                <p className="text-lg font-bold text-text-primary text-center leading-relaxed">{card.answer}</p>
              </div>
            </div>
          </div>

          {!flipped && (
            <p className="text-2xs text-text-muted animate-pulse">Click the card to flip</p>
          )}

          {/* Action buttons — only after flip */}
          {flipped && (
            <div className="grid grid-cols-2 gap-4 w-full mt-4" style={{ maxWidth: '560px' }}>
              <button
                id="incorrect-btn"
                onClick={() => handleReview(false)}
                disabled={reviewing}
                className="btn-rose"
                style={{ padding: '1rem', fontSize: '0.95rem' }}
              >
                <XCircle size={18} />
                Missed It
              </button>
              <button
                id="correct-btn"
                onClick={() => handleReview(true)}
                disabled={reviewing}
                className="btn-emerald"
                style={{ padding: '1rem', fontSize: '0.95rem' }}
              >
                {reviewing ? <Loader2 size={18} className="animate-spin-slow" /> : <CheckCircle size={18} />}
                Got It
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

          <h2 className="text-xl font-black text-text-primary mb-1">Session Complete!</h2>
          <p className="text-text-muted text-sm mb-6">
            {selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''} reviewed
          </p>

          {/* Score ring */}
          <div className="score-ring mx-auto mb-6">
            <svg width="120" height="120" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="48" cy="48" r="44"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a5b4fc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="score-ring-text">
              <span className="text-2xl font-black text-text-primary">{pct}%</span>
              <span className="text-2xs text-text-muted">score</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-7">
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <p className="text-2xl font-black" style={{ color: '#34d399' }}>{score.correct}</p>
              <p className="text-2xs font-semibold" style={{ color: '#34d399' }}>Correct</p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
            >
              <p className="text-2xl font-black" style={{ color: '#fb7185' }}>{score.incorrect}</p>
              <p className="text-2xs font-semibold" style={{ color: '#fb7185' }}>Missed</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button id="restart-btn" onClick={handleRestart} className="btn-primary w-full">
              <RotateCcw size={15} />
              Practice Again
            </button>
            <button id="dashboard-btn" onClick={() => navigate('/dashboard')} className="btn-secondary w-full">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
