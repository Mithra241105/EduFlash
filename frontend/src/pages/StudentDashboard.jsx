import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  Flame, Star, Plus, LogOut, Zap, FolderPlus,
  BookOpen, Layers, History, ChevronRight,
  Loader2, X, Folder, Sparkles
} from 'lucide-react';

const FOLDER_COLORS = [
  '#6366f1', '#818cf8', '#a78bfa', '#c084fc',
  '#10b981', '#34d399', '#f59e0b', '#f43f5e',
  '#3b82f6', '#22d3ee',
];

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: '', subject: '', colorCode: '#6366f1' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/folders');
      setFolders(res.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/folders', newFolder);
      setShowCreateModal(false);
      setNewFolder({ name: '', subject: '', colorCode: '#6366f1' });
      fetchFolders();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="min-h-[100dvh] relative" style={{ background: '#050508' }}>
      {/* Ambient orbs */}
      <div className="orb orb-indigo" style={{ opacity: 0.08 }} />
      <div className="orb orb-emerald" style={{ opacity: 0.06 }} />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto nav-island rounded-2xl px-5 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
            >
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-black text-text-primary text-base tracking-tight">EduFlash</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Streak */}
            <div className="stat-pill" style={{ color: '#fbbf24', borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.08)' }}>
              <Flame size={14} />
              <span>{user?.learningStreak ?? 0}</span>
              <span className="text-text-muted hidden sm:inline text-2xs">streak</span>
            </div>

            {/* XP */}
            <div className="stat-pill" style={{ color: '#a5b4fc', borderColor: 'rgba(129,140,248,0.2)', background: 'rgba(129,140,248,0.08)' }}>
              <Star size={14} />
              <span>{user?.totalXp ?? 0}</span>
              <span className="text-text-muted hidden sm:inline text-2xs">XP</span>
            </div>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
              title={user?.fullName}
            >
              {initials}
            </div>

            {/* Logout */}
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-rose-light transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              title="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Welcome hero */}
        <div className="animate-in mb-8">
          <div
            className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(13,13,20,0.9) 60%)',
              border: '1px solid rgba(99,102,241,0.2)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Decorative glow */}
            <div
              className="absolute right-0 top-0 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', transform: 'translate(30%, -30%)' }}
            />
            <div className="relative">
              <p className="text-2xs font-semibold text-indigo-light uppercase tracking-widest mb-2">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-text-primary mb-1">
                Hey, {user?.fullName?.split(' ')[0]} 👋
              </h2>
              <p className="text-text-secondary text-sm mb-6 max-w-xs">
                Ready to level up your knowledge today?
              </p>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  id="practice-btn"
                  onClick={() => navigate('/practice')}
                  className="btn-primary"
                >
                  <Layers size={15} />
                  Flashcards
                </button>
                <button
                  id="quiz-btn"
                  onClick={() => navigate('/quiz')}
                  className="btn-secondary"
                >
                  <Sparkles size={15} />
                  Quiz Mode
                </button>
                <button
                  id="history-btn"
                  onClick={() => navigate('/history')}
                  className="btn-secondary"
                >
                  <History size={15} />
                  History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Folders section */}
        <div className="animate-in animate-in-delay-1">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-black text-text-primary">My Study Folders</h3>
              <p className="text-2xs text-text-muted font-medium mt-0.5">
                {folders.length} folder{folders.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              id="create-folder-btn"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              <Plus size={14} />
              New Folder
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}
                >
                  <Loader2 size={22} className="text-white animate-spin-slow" />
                </div>
                <p className="text-text-muted text-sm font-medium">Loading folders…</p>
              </div>
            </div>
          ) : folders.length === 0 ? (
            <div
              className="rounded-3xl p-12 text-center"
              style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float"
                style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}
              >
                <FolderPlus size={28} className="text-indigo-light" />
              </div>
              <h4 className="font-bold text-text-primary text-base mb-2">No folders yet</h4>
              <p className="text-text-muted text-sm max-w-xs mx-auto">
                Create your first study folder to organise your PDFs and generate AI flashcards.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary mt-6 mx-auto"
              >
                <Plus size={15} />
                Create Folder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map((folder, i) => (
                <button
                  key={folder.id}
                  id={`folder-${folder.id}`}
                  onClick={() => navigate(`/folder/${folder.id}`)}
                  className="group text-left rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'rgba(18,18,28,0.8)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    animationDelay: `${i * 0.05}s`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${folder.colorCode}40`;
                    e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 24px ${folder.colorCode}20`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${folder.colorCode}20`,
                        border: `1px solid ${folder.colorCode}30`,
                        boxShadow: `0 4px 12px ${folder.colorCode}20`,
                      }}
                    >
                      <Folder size={20} style={{ color: folder.colorCode }} />
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <h4 className="font-bold text-text-primary text-sm leading-tight mb-1 truncate">{folder.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    {folder.subject && (
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#9898b8' }}>
                        {folder.subject}
                      </span>
                    )}
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${folder.colorCode}15`, color: folder.colorCode, border: `1px solid ${folder.colorCode}30` }}>
                      {folder.documentCount || 0} file{folder.documentCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-7 animate-in"
            style={{
              background: 'rgba(18,18,28,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-text-primary">New Study Folder</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-2xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                  Folder Name *
                </label>
                <input
                  id="folder-name-input"
                  type="text"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                  placeholder="e.g. Organic Chemistry"
                  required
                  className="field-input"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                  Subject
                </label>
                <input
                  id="folder-subject-input"
                  type="text"
                  value={newFolder.subject}
                  onChange={(e) => setNewFolder({ ...newFolder, subject: e.target.value })}
                  placeholder="e.g. Chemistry"
                  className="field-input"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-2xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolder({ ...newFolder, colorCode: c })}
                      className="w-8 h-8 rounded-full transition-all duration-200"
                      style={{
                        background: c,
                        transform: newFolder.colorCode === c ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: newFolder.colorCode === c ? `0 0 12px ${c}80` : 'none',
                        border: newFolder.colorCode === c ? '2px solid white' : '2px solid transparent',
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                id="create-folder-submit"
                type="submit"
                disabled={creating || !newFolder.name.trim()}
                className="btn-primary w-full mt-2"
              >
                {creating ? <Loader2 size={16} className="animate-spin-slow" /> : <FolderPlus size={16} />}
                {creating ? 'Creating…' : 'Create Folder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
