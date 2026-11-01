import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
  ArrowLeft, Layers, Loader2, AlertCircle, Search,
  BookOpen, FileText, ChevronLeft, ChevronRight,
  RotateCcw, Trophy
} from "lucide-react";

export default function FlashcardsLibrary() {
  const navigate = useNavigate();
  const [topics,         setTopics]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [flashcardsByTopic, setFlashcardsByTopic] = useState({});
  const [loadingCards,   setLoadingCards]   = useState({});
  const [expandedTopic,  setExpandedTopic]  = useState(null);
  const [flipStates,     setFlipStates]     = useState({});

  useEffect(() => { fetchTopics(); }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/study/topics");
      const topicsData = res.data || [];
      setTopics(topicsData);
      
      // Preload flashcards in background to get accurate counts immediately
      topicsData.forEach(t => loadCardsForTopic(t.id));
    } catch { setError("Could not load topics."); }
    finally { setLoading(false); }
  };

  const loadCardsForTopic = async (topicId) => {
    if (flashcardsByTopic[topicId]) return;
    setLoadingCards(p => ({ ...p, [topicId]: true }));
    try {
      const res = await api.get(`/api/sessions/flashcards?topicIds=${topicId}`);
      setFlashcardsByTopic(p => ({ ...p, [topicId]: res.data || [] }));
    } catch { 
      // silent fail for preloading
    } finally { 
      setLoadingCards(p => ({ ...p, [topicId]: false })); 
    }
  };

  const toggleTopic = async (topicId) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
    } else {
      setExpandedTopic(topicId);
      await loadCardsForTopic(topicId);
    }
  };

  const toggleFlip = (cardId) => setFlipStates(p => ({ ...p, [cardId]: !p[cardId] }));

  const filtered = topics.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.documentTitle || "").toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, t) => {
    const doc = t.documentTitle || "Other Topics";
    if (!acc[doc]) acc[doc] = [];
    acc[doc].push(t);
    return acc;
  }, {});

  return (
    <div className="min-h-[100dvh] relative" style={{ background: "#050508" }}>
      <div className="orb orb-indigo" style={{ opacity: 0.06 }} />

      <nav className="sticky top-0 z-50 px-4 py-3">
        <div className="max-w-5xl mx-auto nav-island rounded-2xl px-5 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={15} />
          </button>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>
            <Layers size={15} className="text-white" />
          </div>
          <h1 className="font-black text-text-primary text-sm flex-1">Flashcards Library</h1>
          <button onClick={() => navigate("/practice")} className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff" }}>
            <Trophy size={13} /> Practice All
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {error && (
          <div className="rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-sm font-medium text-rose-light" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <AlertCircle size={15} className="shrink-0" />{error}
          </div>
        )}

        <div className="mb-6 animate-in">
          <h2 className="text-2xl font-black text-text-primary mb-1">My Flashcard Library</h2>
          <p className="text-text-muted text-sm">All your AI-generated flashcards, organized by topic and document.</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search topics or documents..." value={search} onChange={e => setSearch(e.target.value)} className="field-input !pl-11" style={{ background: "rgba(18,18,28,0.8)" }} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="text-indigo-light animate-spin-slow" /></div>
        ) : topics.length === 0 ? (
          <div className="rounded-3xl p-16 text-center" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <Layers size={36} className="text-text-muted mx-auto mb-4" />
            <h3 className="font-bold text-text-primary mb-2">No flashcards yet</h3>
            <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">Upload a PDF, extract topics, and generate flashcards from the Document Study page.</p>
            <button onClick={() => navigate("/dashboard")} className="btn-primary mx-auto">Go to Dashboard</button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([docTitle, docTopics]) => (
              <div key={docTitle} className="animate-in">
                <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 px-1">
                  <FileText size={14} className="text-indigo-light" />{docTitle}
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full ml-1" style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>{docTopics.length} topics</span>
                </h3>

                <div className="space-y-3">
                  {docTopics.map(topic => {
                    const cards    = flashcardsByTopic[topic.id] || [];
                    const isOpen   = expandedTopic === topic.id;
                    const isLoading = loadingCards[topic.id];

                    return (
                      <div key={topic.id} className="rounded-2xl overflow-hidden transition-all" style={{ background: "rgba(18,18,28,0.8)", border: `1px solid ${isOpen ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                        {/* Topic Header */}
                        <button className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors" onClick={() => toggleTopic(topic.id)}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: isOpen ? "linear-gradient(135deg,#6366f1,#818cf8)" : "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                            <BookOpen size={14} className={isOpen ? "text-white" : "text-indigo-light"} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-text-primary text-sm">{topic.name}</p>
                          </div>
                          
                          <div className="shrink-0 hidden sm:flex items-center">
                            <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#9ca3af" }}>
                              {topic.flashcardCount || cards.length || 0} Cards
                            </span>
                          </div>
                          {isLoading ? <Loader2 size={16} className="text-indigo-light animate-spin-slow shrink-0" /> : (
                            <div className="shrink-0 text-text-muted" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                              <ChevronRight size={16} />
                            </div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); navigate("/practice", { state: { selectedTopics: [topic.id] } }); }} className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>Practice</button>
                        </button>

                        {/* Flashcards Grid */}
                        {isOpen && (
                          <div className="px-4 pb-4">
                            {cards.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-text-muted text-sm mb-3">No flashcards generated yet for this topic.</p>
                                <button onClick={() => navigate(`/study/${topic.documentId}`)} className="btn-primary text-xs" style={{ padding: "0.5rem 1rem" }}>Generate Flashcards</button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {cards.map(card => (
                                  <div
                                    key={card.id}
                                    className="flip-card h-40 cursor-pointer"
                                    onClick={() => toggleFlip(card.id)}
                                  >
                                    <div className={`flip-card-inner ${flipStates[card.id] ? "flipped" : ""}`}>
                                      <div className="flip-card-front rounded-xl p-4 flex flex-col justify-between" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                                        <span className="text-2xs font-bold text-indigo-400 uppercase tracking-wider">Question</span>
                                        <p className="text-sm font-semibold text-text-primary leading-snug text-center">{card.question}</p>
                                        <div className="flex items-center justify-center gap-1 text-2xs text-text-muted">
                                          <RotateCcw size={11} /><span>Tap to flip</span>
                                        </div>
                                      </div>
                                      <div className="flip-card-back rounded-xl p-4 flex flex-col justify-between" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                                        <span className="text-2xs font-bold text-emerald-400 uppercase tracking-wider">Answer</span>
                                        <p className="text-sm text-text-secondary leading-snug text-center">{card.answer}</p>
                                        <div className="flex items-center justify-center gap-1 text-2xs text-text-muted">
                                          <RotateCcw size={11} /><span>Tap to flip back</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
