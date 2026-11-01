import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  ArrowLeft, Plus, BookOpen, Loader2, MoreVertical,
  Edit2, Trash2, FileText, Upload, Zap, CheckCircle,
  X, AlertCircle, Sparkles
} from 'lucide-react';

export default function FolderView() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null | 'uploading' | 'processing' | 'done'
  const [editingDoc, setEditingDoc] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [folderId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setMenuOpenFor(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const docsRes = await api.get(`/api/documents/folder/${folderId}`);
      setDocuments(docsRes.data.content || docsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Only PDF files are supported.');
      return;
    }
    setUploading(true);
    setUploadProgress('uploading');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId);

    try {
      const res = await api.post('/api/documents/upload', formData);
      setUploadProgress('processing');

      // If server auto-extracts topics, wait; otherwise just refresh
      const docId = res.data?.id;
      if (docId) {
        // Trigger topic extraction automatically
        try {
          const jobRes = await api.post(`/api/study/documents/${docId}/extract-topics`);
          pollForCompletion(jobRes.data.id, docId);
        } catch {
          setUploadProgress('done');
          fetchData();
        }
      } else {
        setUploadProgress('done');
        fetchData();
      }
    } catch (err) {
      setErrorMsg('Upload failed: ' + (err.response?.data?.message || err.message));
      setUploadProgress(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const pollForCompletion = async (jobId, docId) => {
    try {
      const res = await api.get(`/api/jobs/${jobId}`);
      if (res.data.status === 'COMPLETED') {
        setUploadProgress('done');
        fetchData();
        setTimeout(() => setUploadProgress(null), 3000);
      } else if (res.data.status === 'FAILED') {
        setUploadProgress('done');
        fetchData();
        setTimeout(() => setUploadProgress(null), 2000);
      } else {
        setTimeout(() => pollForCompletion(jobId, docId), 2000);
      }
    } catch {
      setUploadProgress('done');
      fetchData();
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      await api.put(`/api/documents/${editingDoc.id}`, { title: editTitle });
      setEditingDoc(null);
      fetchData();
    } catch {
      setErrorMsg('Failed to rename document');
    }
  };

  const confirmDelete = async () => {
    if (!deletingDoc) return;
    try {
      await api.delete(`/api/documents/${deletingDoc.id}`);
      setDeletingDoc(null);
      fetchData();
    } catch {
      setErrorMsg('Failed to delete document');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-[100dvh] relative" style={{ background: '#050508' }}>
      {/* Orbs */}
      <div className="orb orb-indigo" style={{ opacity: 0.06 }} />

      {/* Nav */}
      <nav className="sticky top-0 z-50 px-4 py-3">
        <div className="max-w-5xl mx-auto nav-island rounded-2xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              <Zap size={15} className="text-white" />
            </div>
            <h1 className="font-black text-text-primary text-sm tracking-tight">Folder Documents</h1>
          </div>

          {/* Upload button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleUpload(e.target.files[0])}
            accept="application/pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          >
            {uploading ? <Loader2 size={14} className="animate-spin-slow" /> : <Plus size={14} />}
            Upload PDF
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">

        {/* Upload progress banner */}
        {uploadProgress && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3 animate-in"
            style={{
              background: uploadProgress === 'done' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
              border: `1px solid ${uploadProgress === 'done' ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`,
            }}
          >
            {uploadProgress === 'uploading' && <Loader2 size={18} className="animate-spin-slow text-indigo-light shrink-0" />}
            {uploadProgress === 'processing' && <Sparkles size={18} className="text-indigo-light shrink-0 animate-pulse" />}
            {uploadProgress === 'done' && <CheckCircle size={18} className="text-emerald shrink-0" />}
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {uploadProgress === 'uploading' && 'Uploading PDF…'}
                {uploadProgress === 'processing' && 'AI is extracting topics from your document…'}
                {uploadProgress === 'done' && 'Document ready! Topics extracted successfully.'}
              </p>
              {uploadProgress === 'processing' && (
                <p className="text-2xs text-text-muted mt-0.5">This may take 30–60 seconds</p>
              )}
            </div>
          </div>
        )}

        {/* Drag-and-drop zone */}
        <div
          className={`rounded-2xl border-2 border-dashed p-8 text-center mb-8 cursor-pointer transition-all duration-300 ${
            dragOver ? 'opacity-100' : 'opacity-40 hover:opacity-70'
          }`}
          style={{
            borderColor: dragOver ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.12)',
            background: dragOver ? 'rgba(99,102,241,0.06)' : 'transparent',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={24} className="mx-auto mb-2 text-indigo-light" />
          <p className="text-sm font-semibold text-text-secondary">Drop a PDF here or click to upload</p>
          <p className="text-2xs text-text-muted mt-1">AI will extract topics automatically</p>
        </div>

        {/* Documents */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-indigo-light animate-spin-slow" />
          </div>
        ) : documents.length === 0 ? (
          <div
            className="rounded-3xl p-12 text-center"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}
            >
              <FileText size={24} className="text-indigo-light" />
            </div>
            <h3 className="font-bold text-text-primary mb-1">No documents yet</h3>
            <p className="text-text-muted text-sm">Upload a PDF to generate AI flashcards and summaries.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group relative rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: 'rgba(18,18,28,0.8)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
                }}
                onClick={() => navigate(`/study/${doc.id}`)}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
                >
                  <BookOpen size={20} className="text-indigo-light" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-text-primary text-sm truncate pr-6">{doc.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {doc.topicsExtracted && (
                      <span
                        className="text-2xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                      >
                        Topics extracted
                      </span>
                    )}
                    {doc.fileSizeBytes && (
                      <span className="text-2xs text-text-muted">{formatSize(doc.fileSizeBytes)}</span>
                    )}
                  </div>
                </div>

                {/* Context menu */}
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenFor(menuOpenFor === doc.id ? null : doc.id);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <MoreVertical size={15} />
                  </button>

                  {menuOpenFor === doc.id && (
                    <div
                      className="absolute right-0 top-full mt-1 w-36 rounded-xl py-1 z-50"
                      style={{
                        background: 'rgba(18,18,28,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      <button
                        onClick={() => { setEditingDoc(doc); setEditTitle(doc.title); setMenuOpenFor(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                      >
                        <Edit2 size={13} /> Rename
                      </button>
                      <button
                        onClick={() => { setDeletingDoc(doc); setMenuOpenFor(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-light hover:bg-rose-DEFAULT/10 transition-colors"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Rename Modal */}
      {editingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-7 animate-in"
            style={{
              background: 'rgba(18,18,28,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            }}
          >
            <h3 className="text-base font-bold text-text-primary mb-5">Rename Document</h3>
            <form onSubmit={handleRename}>
              <input
                type="text"
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="field-input mb-5"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingDoc(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={!editTitle.trim()} className="btn-primary flex-1">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-7 text-center animate-in"
            style={{
              background: 'rgba(18,18,28,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.25)' }}
            >
              <Trash2 size={22} className="text-rose-light" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">Delete Document?</h3>
            <p className="text-text-muted text-sm mb-6">
              &ldquo;{deletingDoc.title}&rdquo; will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingDoc(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={confirmDelete} className="btn-rose flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorMsg && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl animate-in"
          style={{
            background: 'rgba(244,63,94,0.15)',
            border: '1px solid rgba(244,63,94,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <AlertCircle size={16} className="text-rose-light shrink-0" />
          <p className="text-sm font-medium text-rose-light">{errorMsg}</p>
          <button onClick={() => setErrorMsg('')} className="text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
