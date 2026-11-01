import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  ArrowLeft, History, Loader2, Trophy, CheckCircle,
  XCircle, Layers, Sparkles, Calendar, Clock
} from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchHistory(0);
  }, []);

  const fetchHistory = async (pageNum) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/sessions/history?page=${pageNum}&size=15&sort=completedAt,desc`);
      setSessions(pageNum === 0 ? res.data.content || [] : (prev) => [...prev, ...(res.data.content || [])]);
      setTotalPages(res.data.totalPages ?? 0);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (secs) => {
    if (!secs) return '';
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const getPctColor = (pct) => {
    if (pct >= 80) return { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' };
    if (pct >= 50) return { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' };
    return { color: '#fb7185', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.25)' };
  };

  return (
    <div className="min-h-[100dvh] relative" style={{ background: '#050508' }}>
      <div className="orb orb-indigo" style={{ opacity: 0.06 }} />

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
            <History size={15} className="text-white" />
          </div>
          <h1 className="font-black text-text-primary text-sm">Session History</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        <div className="animate-in mb-8">
          <h2 className="text-2xl font-black text-text-primary mb-1">Your Progress</h2>
          <p className="text-text-muted text-sm">All completed flashcard and quiz sessions.</p>
        </div>

        {loading && sessions.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="text-indigo-light animate-spin-slow" />
          </div>
        ) : sessions.length === 0 ? (
          <div
            className="rounded-3xl p-12 text-center"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
          >
            <Trophy size={32} className="text-text-muted mx-auto mb-4" />
            <h3 className="font-bold text-text-primary mb-2">No sessions yet</h3>
            <p className="text-text-muted text-sm mb-6">Complete a flashcard or quiz session to see your history here.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/practice')} className="btn-primary">
                <Layers size={14} />
                Flashcards
              </button>
              <button onClick={() => navigate('/quiz')} className="btn-secondary">
                <Sparkles size={14} />
                Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s, i) => {
              const pctStyle = getPctColor(s.scorePercent);
              return (
                <div
                  key={s.id}
                  className="rounded-2xl p-5 flex items-center gap-4 animate-in"
                  style={{
                    background: 'rgba(18,18,28,0.8)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    animationDelay: `${i * 0.04}s`,
                  }}
                >
                  {/* Type icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: s.sessionType === 'QUIZ' ? 'rgba(192,132,252,0.12)' : 'rgba(99,102,241,0.12)',
                      border: s.sessionType === 'QUIZ' ? '1px solid rgba(192,132,252,0.25)' : '1px solid rgba(99,102,241,0.25)',
                    }}
                  >
                    {s.sessionType === 'QUIZ'
                      ? <Sparkles size={18} className="text-purple-300" />
                      : <Layers size={18} className="text-indigo-light" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{s.topicNames}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-2xs text-text-muted flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(s.completedAt)}
                      </span>
                      {s.durationSeconds && (
                        <span className="text-2xs text-text-muted flex items-center gap-1">
                          <Clock size={11} />
                          {formatDuration(s.durationSeconds)}
                        </span>
                      )}
                      <span
                        className="text-2xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: s.sessionType === 'QUIZ' ? 'rgba(192,132,252,0.12)' : 'rgba(99,102,241,0.12)', color: s.sessionType === 'QUIZ' ? '#c084fc' : '#818cf8' }}
                      >
                        {s.sessionType === 'QUIZ' ? 'Quiz' : 'Flashcards'}
                      </span>
                    </div>

                    {/* Correct/Incorrect */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-2xs font-bold" style={{ color: '#34d399' }}>
                        <CheckCircle size={11} /> {s.correctCount}
                      </span>
                      <span className="flex items-center gap-1 text-2xs font-bold" style={{ color: '#fb7185' }}>
                        <XCircle size={11} /> {s.incorrectCount}
                      </span>
                      <span className="text-2xs text-text-muted">of {s.totalCards} cards</span>
                    </div>
                  </div>

                  {/* Score badge */}
                  <div
                    className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
                    style={{ background: pctStyle.bg, border: `1px solid ${pctStyle.border}` }}
                  >
                    <span className="text-lg font-black" style={{ color: pctStyle.color }}>{s.scorePercent}%</span>
                  </div>
                </div>
              );
            })}

            {/* Load more */}
            {page + 1 < totalPages && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => fetchHistory(page + 1)}
                  disabled={loading}
                  className="btn-secondary"
                >
                  {loading ? <Loader2 size={14} className="animate-spin-slow" /> : null}
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
