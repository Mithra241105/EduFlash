import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentStudy from './pages/DocumentStudy';
import Practice from './pages/Practice';
import Quiz from './pages/Quiz';
import History from './pages/History';
import FolderView from './pages/FolderView';
import FlashcardsLibrary from './pages/FlashcardsLibrary';
import { Sun, Moon } from 'lucide-react';

function ThemeToggle() {
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLight]);

  return (
    <button
      onClick={() => setIsLight(!isLight)}
      className="fixed bottom-6 right-6 z-[999] w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-110"
      style={{
        background: 'rgba(18,18,28,0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {isLight ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-indigo-400" />
      )}
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeToggle />
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Folder View */}
          <Route
            path="/folder/:folderId"
            element={
              <ProtectedRoute>
                <FolderView />
              </ProtectedRoute>
            }
          />

          {/* Document Study */}
          <Route
            path="/study"
            element={
              <ProtectedRoute>
                <DocumentStudy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study/:documentId"
            element={
              <ProtectedRoute>
                <DocumentStudy />
              </ProtectedRoute>
            }
          />

          {/* Flashcard Practice */}
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <Practice />
              </ProtectedRoute>
            }
          />

          {/* Quiz Mode */}
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />

          {/* Session History */}
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />

          {/* Flashcards Library */}
          <Route
            path="/flashcards"
            element={
              <ProtectedRoute>
                <FlashcardsLibrary />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
