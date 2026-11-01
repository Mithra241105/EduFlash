import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Mail, Lock, User, Loader2, Zap, ArrowRight } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  // Role is always STUDENT - teacher registration is hidden
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'STUDENT' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.fullName, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full relative flex items-center justify-center p-4 overflow-hidden" style={{ background: '#050508' }}>
      {/* Ambient orbs */}
      <div className="orb orb-indigo" />
      <div className="orb orb-emerald" />

      <div className="relative z-10 w-full max-w-sm animate-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 animate-float"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">EduFlash</h1>
          <p className="text-text-muted text-sm mt-1 font-medium">Start your learning journey.</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(13,13,20,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Student badge */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.25)', color: '#a5b4fc' }}
            >
              <BookOpen size={12} />
              Student Account
            </div>
          </div>

          <h2 className="text-lg font-bold text-text-primary mb-6">Create your account</h2>

          {error && (
            <div
              className="rounded-xl px-4 py-3 mb-5 text-sm font-medium text-rose-light"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-2xs font-semibold text-text-muted uppercase tracking-widest mb-2">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="register-fullname"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Ada Lovelace"
                  required
                  className="field-input !pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-text-muted uppercase tracking-widest mb-2">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="field-input !pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-text-muted uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="field-input !pl-10"
                />
              </div>
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin-slow" /> : null}
              {loading ? 'Creating account…' : 'Get Started'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-light font-semibold hover:text-indigo-DEFAULT transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
