import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import FolderCard from '../components/FolderCard';
import {
  Flame, Star, Plus, LogOut, Zap, FolderPlus,
  BookOpen, Users, Loader2, X
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: '', subject: '', colorCode: '#7C3AED' });
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
      setNewFolder({ name: '', subject: '', colorCode: '#7C3AED' });
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

  return (
    <div className="bg-background min-h-screen">
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-80 h-80 bg-primary-light opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 left-0 w-64 h-64 bg-accent-light opacity-10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-2xl shadow-clay-violet flex items-center justify-center">
              <Zap className="text-white" size={18} />
            </div>
            <span className="font-black text-gray-800 text-lg tracking-tight">EduFlash</span>
          </div>

          {/* Right: Stats + User */}
          <div className="flex items-center gap-3">
            {/* Streak Pill */}
            <div
              id="streak-pill"
              className="flex items-center gap-2 bg-white rounded-2xl shadow-clay-gold px-4 py-2"
            >
              <Flame size={16} className="text-accent" />
              <span className="font-bold text-gray-700 text-sm">{user?.learningStreak ?? 0}</span>
              <span className="text-gray-400 text-xs font-medium hidden sm:block">streak</span>
            </div>

            {/* XP Pill */}
            <div
              id="xp-pill"
              className="flex items-center gap-2 bg-white rounded-2xl shadow-clay-gold px-4 py-2"
            >
              <Star size={16} className="text-accent" />
              <span className="font-bold text-gray-700 text-sm">{user?.totalXp ?? 0}</span>
              <span className="text-gray-400 text-xs font-medium hidden sm:block">XP</span>
            </div>

            {/* User */}
            <div className="flex items-center gap-2 bg-background rounded-2xl shadow-clay-pressed px-4 py-2">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.fullName?.[0] ?? 'U'}
              </div>
              <span className="text-gray-700 text-sm font-semibold hidden sm:block truncate max-w-[120px]">
                {user?.fullName}
              </span>
            </div>

            {/* Logout */}
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="w-9 h-9 bg-background rounded-2xl shadow-clay-pressed flex items-center justify-center text-gray-400 hover:text-rose transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-4xl shadow-clay p-6 mb-8 flex items-center justify-between overflow-hidden relative">
          <div className="absolute right-0 top-0 w-40 h-40 bg-primary-light opacity-10 rounded-full blur-2xl" />
          <div>
            <p className="text-sm font-semibold text-primary-light mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h2 className="text-2xl font-black text-gray-800 mb-1">
              Hey, {user?.fullName?.split(' ')[0]}
            </h2>
            <p className="text-gray-500 text-sm">
              Manage your classrooms and study materials.
            </p>
          </div>

          {/* Quick action chips */}
          <div className="flex flex-col gap-2 shrink-0">
              <button
                id="classrooms-btn"
                onClick={() => navigate('/classrooms')}
                className="flex items-center gap-2 bg-primary text-white rounded-2xl shadow-clay-violet px-4 py-2.5 text-sm font-bold hover:bg-primary-dark transition-all hover:-translate-y-0.5"
              >
                <Users size={15} />
                <span className="hidden sm:block">Classrooms</span>
              </button>
          </div>
        </div>

        {/* Folders Section */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-gray-800">My Study Folders</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {folders.length} folder{folders.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-3xl shadow-clay-violet flex items-center justify-center">
                <Loader2 size={24} className="text-white animate-spin-slow" />
              </div>
              <p className="text-gray-400 text-sm font-medium">Loading foldersâ€¦</p>
            </div>
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-background rounded-4xl shadow-clay flex items-center justify-center mb-4 animate-float">
              <FolderPlus size={32} className="text-primary-light" />
            </div>
            <h4 className="font-bold text-gray-600 text-lg mb-2">No folders yet</h4>
            <p className="text-gray-400 text-sm max-w-xs">
              Create your first study folder to organize your documents and flashcards.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {folders.map((folder, i) => (
              <FolderCard key={folder.id} folder={folder} index={i} />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        id="create-folder-fab"
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary rounded-2xl shadow-clay-violet flex items-center justify-center text-white z-50 transition-all hover:scale-110 hover:bg-primary-dark active:scale-95"
      >
        <Plus size={26} />
      </button>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-clay p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">New Study Folder</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 bg-background rounded-xl shadow-clay-pressed flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Folder Name *</label>
                <div className="bg-background rounded-2xl shadow-clay-pressed px-4 py-3">
                  <input
                    id="folder-name-input"
                    type="text"
                    value={newFolder.name}
                    onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                    placeholder="e.g. Organic Chemistry"
                    required
                    className="bg-transparent outline-none text-gray-700 text-sm w-full placeholder-gray-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Subject</label>
                <div className="bg-background rounded-2xl shadow-clay-pressed px-4 py-3">
                  <input
                    id="folder-subject-input"
                    type="text"
                    value={newFolder.subject}
                    onChange={(e) => setNewFolder({ ...newFolder, subject: e.target.value })}
                    placeholder="e.g. Chemistry"
                    className="bg-transparent outline-none text-gray-700 text-sm w-full placeholder-gray-400 font-medium"
                  />
                </div>
              </div>

              <button
                id="create-folder-submit"
                type="submit"
                disabled={creating}
                className="w-full bg-primary rounded-2xl shadow-clay-violet text-white font-bold py-3 flex items-center justify-center gap-2 transition-all hover:bg-primary-dark disabled:opacity-60"
              >
                {creating ? <Loader2 size={16} className="animate-spin-slow" /> : <FolderPlus size={16} />}
                {creating ? 'Creatingâ€¦' : 'Create Folder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
