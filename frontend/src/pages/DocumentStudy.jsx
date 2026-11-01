import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import {
  Upload, Zap, Loader2, FileText, CheckCircle,
  ArrowLeft, BookOpen, ChevronRight, AlertCircle,
  Sparkles, Layers, Brain, Check, X, Library,
  RotateCcw
} from "lucide-react";

const IMPORTANCE_COLORS = {
  CRITICAL: { bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.25)", color: "#fb7185" },
  HIGH:     { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.25)",  color: "#818cf8" },
  MEDIUM:   { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)",  color: "#fbbf24" },
  LOW:      { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)",  color: "#9898b8" },
};

const TAB = { DETAILS: "details", FLASHCARDS: "flashcards", QUIZ: "quiz", SUMMARY: "summary" };

export default function DocumentStudy() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [uploading,   setUploading]   = useState(false);
  const [extracting,  setExtracting]  = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [topics,      setTopics]      = useState([]);
  const [error,       setError]       = useState("");
  const [loadingDoc,  setLoadingDoc]  = useState(!!documentId);

  const [selectedTopics,        setSelectedTopics]        = useState([]);
  const [selectedTopicForModal, setSelectedTopicForModal] = useState(null);
  const [activeTab,             setActiveTab]             = useState(TAB.DETAILS);

  const [fcState,      setFcState]      = useState({});
  const [summaryState, setSummaryState] = useState({});

  const [bulkSummaryStatus, setBulkSummaryStatus] = useState("idle");
  const [bulkSummaryText,   setBulkSummaryText]   = useState("");
  const [showBulkSummary,   setShowBulkSummary]   = useState(false);

  useEffect(() => { if (documentId) fetchDocumentDetails(); }, [documentId]);
  useEffect(() => { setActiveTab(TAB.DETAILS); }, [selectedTopicForModal?.id]);

  const fetchDocumentDetails = async () => {
    setLoadingDoc(true);
    try {
      const res = await api.get(`/api/documents/${documentId}`);
      setUploadedDoc(res.data);
      if (res.data.topicsExtracted) {
        const topicsRes = await api.get(`/api/study/documents/${documentId}/topics`);
        setTopics(topicsRes.data?.topics || topicsRes.data || []);
      }
    } catch { setError("Failed to load document details"); }
    finally { setLoadingDoc(false); }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file) return; await uploadFile(file);
  }, []);

  const uploadFile = async (file) => {
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name.replace(/\.[^.]+$/, ""));
      const res = await api.post("/api/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadedDoc(res.data);
    } catch (err) { setError("Upload failed: " + (err.response?.data || err.message)); }
    finally { setUploading(false); }
  };

  const handleExtractTopics = async () => {
    const id = documentId || uploadedDoc?.id; if (!id) return;
    setExtracting(true); setError("");
    try {
      const res = await api.post(`/api/study/documents/${id}/extract-topics`);
      pollJob(res.data.id, async () => {
        const topicsRes = await api.get(`/api/study/documents/${id}/topics`);
        setTopics(topicsRes.data?.topics || topicsRes.data || []);
        setExtracting(false);
      }, () => setExtracting(false));
    } catch (err) { setError("Topic extraction failed: " + (err.response?.data?.message || err.message)); setExtracting(false); }
  };

  const pollJob = async (jobId, onComplete, onFail) => {
    try {
      const res = await api.get(`/api/jobs/${jobId}`);
      if (res.data.status === "COMPLETED") { onComplete(res.data); }
      else if (res.data.status === "FAILED") { setError("AI job failed: " + (res.data.resultMessage || "Unknown error")); onFail?.(); }
      else { setTimeout(() => pollJob(jobId, onComplete, onFail), 2000); }
    } catch (err) { setError("Job polling error: " + err.message); onFail?.(); }
  };

  const handleGenerateFlashcards = async (topicId) => {
    setFcState(p => ({ ...p, [topicId]: "generating" }));
    try {
      const res = await api.post(`/api/study/topics/${topicId}/flashcards`);
      pollJob(res.data.id,
        () => setFcState(p => ({ ...p, [topicId]: "done" })),
        () => setFcState(p => ({ ...p, [topicId]: "error" }))
      );
    } catch (err) { setError("Flashcard generation failed: " + (err.response?.data?.message || err.message)); setFcState(p => ({ ...p, [topicId]: "error" })); }
  };

  const handleQuickQuiz = (topicId) => navigate("/quiz", { state: { selectedTopics: [topicId] } });

  const handleGenerateSummary = async (topicIds, onDone) => {
    const docId = documentId || uploadedDoc?.id; if (!docId) return;
    const key = topicIds.join(",");
    setSummaryState(p => ({ ...p, [key]: { status: "loading", text: "" } }));
    try {
      const params = new URLSearchParams({ readingLevel: "INTERMEDIATE" });
      topicIds.forEach(id => params.append("topicIds", id));
      const res = await api.post(`/api/study/documents/${docId}/summarize?${params.toString()}`);
      pollJob(res.data.id,
        async () => {
          const sumRes = await api.get(`/api/study/documents/${docId}/summary`);
          const text = sumRes.data?.summaryMarkdown || "Summary generated.";
          setSummaryState(p => ({ ...p, [key]: { status: "done", text } }));
          onDone?.(text);
        },
        () => setSummaryState(p => ({ ...p, [key]: { status: "error", text: "Summary generation failed." } }))
      );
    } catch (err) { setSummaryState(p => ({ ...p, [key]: { status: "error", text: err.message } })); }
  };

  const handleBulkGenerate = () =>
    selectedTopics.forEach(id => { if (fcState[id] !== "generating" && fcState[id] !== "done") handleGenerateFlashcards(id); });

  const handleBulkSummary = () => {
    if (selectedTopics.length === 0) return;
    setBulkSummaryStatus("loading"); setShowBulkSummary(true);
    handleGenerateSummary(selectedTopics, (text) => { setBulkSummaryText(text); setBulkSummaryStatus("done"); });
  };

  const topic = selectedTopicForModal;
  const topicFcState = topic ? (fcState[topic.id] || "idle") : "idle";
  const summaryKey   = topic ? String(topic.id) : "";
  const topicSummary = summaryState[summaryKey];

  return (
    <div className="min-h-[100dvh] relative" style={{ background: "#050508" }}>
      <div className="orb orb-indigo" style={{ opacity: 0.07 }} />

      <nav className="sticky top-0 z-50 px-4 py-3">
        <div className="max-w-4xl mx-auto nav-island rounded-2xl px-5 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={15} />
          </button>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>
            <Brain size={15} className="text-white" />
          </div>
          <h1 className="font-black text-text-primary text-sm flex-1">Document Study</h1>
          <button onClick={() => navigate("/flashcards")} className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Library size={13} /> My Flashcards
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {error && (
          <div className="rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-sm font-medium text-rose-light animate-in" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <AlertCircle size={15} className="shrink-0" />{error}
            <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {loadingDoc ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={32} className="text-indigo-light animate-spin-slow mb-4" />
            <p className="text-text-muted font-medium">Loading document...</p>
          </div>
        ) : (
          <>
            {!uploadedDoc && !documentId && (
              <div className="mb-8 animate-in">
                <h2 className="text-xl font-black text-text-primary mb-1">Upload a Document</h2>
                <p className="text-text-muted text-sm mb-5">Drop a PDF to begin AI-powered analysis.</p>
                <label id="upload-dropzone" htmlFor="file-upload-input" onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} className="flex flex-col items-center justify-center rounded-3xl p-16 cursor-pointer transition-all duration-300 border-2 border-dashed" style={{ borderColor: dragOver ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.1)", background: dragOver ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)" }}>
                  <input id="file-upload-input" type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => uploadFile(e.target.files[0])} />
                  {uploading ? (
                    <><div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}><Loader2 size={28} className="text-white animate-spin-slow" /></div><p className="font-semibold text-indigo-light">Uploading...</p></>
                  ) : (
                    <><div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: dragOver ? "linear-gradient(135deg, #6366f1, #818cf8)" : "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}><Upload size={28} className={dragOver ? "text-white" : "text-indigo-light"} /></div><p className="font-bold text-text-primary mb-1">{dragOver ? "Drop it here!" : "Drag & drop or click to upload"}</p><p className="text-text-muted text-xs">PDF, DOC, DOCX, TXT supported</p></>
                  )}
                </label>
              </div>
            )}

            {uploadedDoc && (
              <div className="rounded-2xl p-5 mb-6 flex items-center gap-4 animate-in" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}><CheckCircle size={22} className="text-emerald" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary truncate">{uploadedDoc.title || uploadedDoc.fileName}</p>
                  <p className="text-2xs text-text-muted">{uploadedDoc.fileSizeBytes ? `${(uploadedDoc.fileSizeBytes / 1024).toFixed(1)} KB` : "Uploaded successfully"}</p>
                </div>
              </div>
            )}

            {(uploadedDoc || documentId) && topics.length === 0 && (
              <button id="extract-topics-btn" onClick={handleExtractTopics} disabled={extracting} className="btn-primary w-full mb-8" style={{ padding: "1rem", fontSize: "0.95rem", justifyContent: "center" }}>
                {extracting ? <><Loader2 size={18} className="animate-spin-slow" />Analysing with AI...</> : <><Zap size={18} />Extract Topics with AI</>}
              </button>
            )}

            {topics.length > 0 && (
              <div className="mb-8 animate-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><BookOpen size={18} className="text-indigo-light" /><h3 className="text-base font-black text-text-primary">Extracted Topics ({topics.length})</h3></div>
                  {selectedTopics.length > 0 && <button onClick={() => setSelectedTopics([])} className="text-xs text-text-muted hover:text-white transition-colors flex items-center gap-1"><X size={12} /> Clear</button>}
                </div>
                <p className="text-xs text-text-muted mb-4">
                  <span className="font-semibold text-indigo-400">Click a card</span> to open details, generate flashcards, quiz, or summary.
                  Use the <span className="font-semibold text-indigo-400">checkbox</span> to select multiple for bulk actions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  {topics.map((t, i) => {
                    const impStyle = IMPORTANCE_COLORS[t.importance] || IMPORTANCE_COLORS.LOW;
                    const isSel    = selectedTopics.includes(t.id);
                    const tFcState = fcState[t.id] || "idle";
                    return (
                      <div key={t.id || i} id={`topic-card-${i}`} className="group rounded-2xl transition-all duration-300 hover:-translate-y-0.5" style={{ background: isSel ? "rgba(99,102,241,0.1)" : "rgba(18,18,28,0.8)", border: `1px solid ${isSel ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}` }}>
                        <div className="p-5 flex items-start gap-3">
                          <button className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all border" style={{ background: isSel ? "linear-gradient(135deg,#6366f1,#818cf8)" : "rgba(255,255,255,0.05)", borderColor: isSel ? "transparent" : "rgba(255,255,255,0.15)" }} onClick={() => setSelectedTopics(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}>
                            {isSel && <Check size={12} className="text-white" />}
                          </button>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTopicForModal(t)}>
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-2xs font-bold px-2 py-0.5 rounded-full" style={{ background: impStyle.bg, border: `1px solid ${impStyle.border}`, color: impStyle.color }}>{t.importance}</span>
                              <div className="flex items-center gap-1.5">
                                {tFcState === "done" && <CheckCircle size={13} className="text-emerald-400" />}
                                {tFcState === "generating" && <Loader2 size={13} className="text-indigo-400 animate-spin-slow" />}
                                <ChevronRight size={15} className="text-text-muted group-hover:text-indigo-light transition-colors" />
                              </div>
                            </div>
                            <h4 className="font-bold text-text-primary text-sm mb-1 leading-tight">{t.name}</h4>
                            {t.description && <p className="text-2xs text-text-muted line-clamp-2">{t.description}</p>}
                            {t.category && <span className="mt-2 inline-block text-2xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>{t.category}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3" style={{ background: selectedTopics.length > 0 ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${selectedTopics.length > 0 ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                  <div className="flex items-center gap-2">
                    {selectedTopics.length > 0 ? <><CheckCircle size={16} className="text-indigo-400" /><span className="text-sm font-bold text-indigo-400">{selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} selected</span></> : <span className="text-xs text-text-muted">Check topics above for bulk actions</span>}
                  </div>
                  {selectedTopics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleBulkGenerate} className="btn-primary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.8rem" }}><Zap size={13} />Generate Flashcards</button>
                      <button onClick={() => navigate("/quiz", { state: { selectedTopics } })} className="btn-secondary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.8rem" }}><Sparkles size={13} />Quiz Mode</button>
                      <button onClick={handleBulkSummary} className="btn-secondary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.8rem", background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)", color: "#fbbf24" }}><FileText size={13} />Summarise</button>
                    </div>
                  )}
                </div>

                {showBulkSummary && (
                  <div className="mt-4 rounded-2xl p-5 animate-in" style={{ background: "rgba(18,18,28,0.9)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><FileText size={15} style={{ color: "#fbbf24" }} /><span className="text-sm font-bold text-text-primary">AI Summary — {selectedTopics.length} Topics</span></div>
                      <button onClick={() => setShowBulkSummary(false)} className="text-text-muted hover:text-white"><X size={15} /></button>
                    </div>
                    {bulkSummaryStatus === "loading" ? (
                      <div className="flex items-center gap-3 py-6 justify-center"><Loader2 size={20} className="text-yellow-400 animate-spin-slow" /><span className="text-text-muted text-sm">AI is writing the summary...</span></div>
                    ) : bulkSummaryStatus === "done" ? (
                      <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{bulkSummaryText}</p>
                    ) : (
                      <p className="text-rose-400 text-sm">Summary failed. Please try again.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {topic && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(5,5,8,0.85)", backdropFilter: "blur(16px)" }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedTopicForModal(null); }}>
          <div className="w-full max-w-xl rounded-3xl overflow-hidden flex flex-col" style={{ background: "rgba(12,12,20,0.98)", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }}>

            <div className="px-6 pt-6 pb-4 border-b flex items-start justify-between gap-4 shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-full" style={{ background: IMPORTANCE_COLORS[topic.importance]?.bg || IMPORTANCE_COLORS.LOW.bg, border: `1px solid ${IMPORTANCE_COLORS[topic.importance]?.border || IMPORTANCE_COLORS.LOW.border}`, color: IMPORTANCE_COLORS[topic.importance]?.color || IMPORTANCE_COLORS.LOW.color }}>{topic.importance || "LOW"}</span>
                  {topic.category && <span className="text-2xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>{topic.category}</span>}
                </div>
                <h3 className="text-lg font-black text-white leading-snug">{topic.name}</h3>
              </div>
              <button onClick={() => setSelectedTopicForModal(null)} className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={17} /></button>
            </div>

            <div className="flex border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              {[
                { id: TAB.DETAILS,    label: "Details",    icon: <BookOpen size={13} /> },
                { id: TAB.FLASHCARDS, label: "Flashcards", icon: <Layers size={13} /> },
                { id: TAB.QUIZ,       label: "Quick Quiz", icon: <Sparkles size={13} /> },
                { id: TAB.SUMMARY,    label: "Summary",    icon: <FileText size={13} /> },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all" style={{ color: activeTab === tab.id ? "#818cf8" : "#6b7280", borderBottom: activeTab === tab.id ? "2px solid #6366f1" : "2px solid transparent", background: activeTab === tab.id ? "rgba(99,102,241,0.05)" : "transparent" }}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {activeTab === TAB.DETAILS && (
                <div>
                  <h5 className="text-xs font-bold text-indigo-light mb-3">Content & Subtopics</h5>
                  <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap p-4 rounded-2xl" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>{topic.description || "No description provided."}</div>
                </div>
              )}

              {activeTab === TAB.FLASHCARDS && (
                <div>
                  <p className="text-sm text-text-muted mb-5">Generate AI flashcards for <span className="font-bold text-white">"{topic.name}"</span>. They will be saved to your <span className="font-bold text-indigo-300">Flashcards Library</span>.</p>
                  {(topicFcState === "idle" || topicFcState === "error") && (
                    <button onClick={() => handleGenerateFlashcards(topic.id)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
                      <Zap size={17} />{topicFcState === "error" ? "Retry Generation" : "Generate Flashcards with AI"}
                    </button>
                  )}
                  {topicFcState === "generating" && <div className="flex flex-col items-center gap-3 py-8"><Loader2 size={32} className="text-indigo-400 animate-spin-slow" /><p className="text-text-muted text-sm">AI is creating flashcards...</p></div>}
                  {topicFcState === "done" && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                        <CheckCircle size={22} className="text-emerald-400 shrink-0" />
                        <div><p className="font-bold text-white text-sm">Flashcards Generated!</p><p className="text-xs text-text-muted">Now available in your library and practice sessions.</p></div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => navigate("/flashcards")} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}><Library size={15} />View Library</button>
                        <button onClick={() => navigate("/practice", { state: { selectedTopics: [topic.id] } })} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff" }}><Layers size={15} />Practice Now</button>
                      </div>
                      <button onClick={() => handleGenerateFlashcards(topic.id)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-text-muted hover:text-white transition-colors"><RotateCcw size={13} />Regenerate</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === TAB.QUIZ && (
                <div>
                  <p className="text-sm text-text-muted mb-5">
                    Instant MCQ quiz on <span className="font-bold text-white">"{topic.name}"</span> - built from your stored flashcards.
                    {topicFcState !== "done" && <><br /><br /><span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}><AlertCircle size={13} />Generate flashcards first (Flashcards tab) to enable quiz.</span></>}
                  </p>
                  <button onClick={() => handleQuickQuiz(topic.id)} disabled={topicFcState !== "done"} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all" style={topicFcState === "done" ? { background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" } : { background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)", cursor: "not-allowed" }}>
                    <Sparkles size={17} />{topicFcState === "done" ? "Start Quick Quiz" : "Quiz Unavailable - Generate Flashcards First"}
                  </button>
                </div>
              )}

              {activeTab === TAB.SUMMARY && (
                <div>
                  <p className="text-sm text-text-muted mb-5">Generate an AI summary for <span className="font-bold text-white">"{topic.name}"</span>.</p>
                  {(!topicSummary || topicSummary.status === "idle") && (
                    <button onClick={() => handleGenerateSummary([topic.id])} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "#fff", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}><Zap size={17} />Generate Summary</button>
                  )}
                  {topicSummary?.status === "loading" && <div className="flex flex-col items-center gap-3 py-8"><Loader2 size={32} className="text-yellow-400 animate-spin-slow" /><p className="text-text-muted text-sm">AI is writing the summary...</p></div>}
                  {topicSummary?.status === "done" && (
                    <div>
                      <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap p-4 rounded-2xl mb-4" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245,158,11,0.1)" }}>{topicSummary.text}</div>
                      <button onClick={() => handleGenerateSummary([topic.id])} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-text-muted hover:text-white transition-colors"><RotateCcw size={13} />Regenerate Summary</button>
                    </div>
                  )}
                  {topicSummary?.status === "error" && (
                    <div><p className="text-rose-400 text-sm mb-3">Summary generation failed.</p><button onClick={() => handleGenerateSummary([topic.id])} className="btn-secondary text-sm">Retry</button></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
