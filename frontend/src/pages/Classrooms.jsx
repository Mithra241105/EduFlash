import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  Users, Plus, ArrowLeft, Loader2, X, Share2, Copy, CheckCircle
} from 'lucide-react';

export default function Classrooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For Teacher: Create
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // For Student: Join
  const [sectionCode, setSectionCode] = useState('');

  // For copying code
  const [copiedCode, setCopiedCode] = useState(null);

  const isTeacher = user?.role === 'TEACHER';

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/classrooms/my-classes');
      setClassrooms(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/classrooms', null, { params: { name, description } });
      setShowModal(false);
      setName('');
      setDescription('');
      fetchClassrooms();
    } catch (err) {
      console.error(err);
      alert(err.response?.data || 'Failed to create classroom');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/api/classrooms/join/${sectionCode}`);
      setShowModal(false);
      setSectionCode('');
      fetchClassrooms();
    } catch (err) {
      console.error(err);
      alert(err.response?.data || 'Failed to join classroom');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span className="font-semibold">Back to Dashboard</span>
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800">Classrooms</h1>
            <p className="text-gray-500 mt-1">Manage your educational spaces</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-white rounded-2xl shadow-clay-violet px-5 py-3 font-bold hover:bg-primary-dark transition-all hover:-translate-y-0.5"
          >
            <Plus size={18} />
            <span>{isTeacher ? 'Create Classroom' : 'Join Classroom'}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="text-primary animate-spin-slow" />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl shadow-clay">
            <div className="w-20 h-20 bg-background rounded-4xl shadow-clay flex items-center justify-center mb-4">
              <Users size={32} className="text-primary-light" />
            </div>
            <h4 className="font-bold text-gray-600 text-lg mb-2">No Classrooms Yet</h4>
            <p className="text-gray-400 text-sm max-w-xs">
              {isTeacher
                ? 'Create a classroom to share folders and documents with your students.'
                : 'Join a classroom using the section code provided by your teacher.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((c) => (
              <div key={c.id} className="bg-white rounded-3xl shadow-clay p-6 flex flex-col relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-light opacity-10 rounded-full blur-2xl" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">{c.name}</h3>
                <p className="text-gray-500 text-sm flex-grow mb-4">{c.description || 'No description provided.'}</p>
                
                {isTeacher && (
                  <div className="mt-auto bg-background rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Section Code</p>
                      <p className="font-bold text-gray-700 tracking-wider">{c.sectionCode}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(c.sectionCode)}
                      className="w-8 h-8 bg-white rounded-xl shadow-clay-pressed flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                      title="Copy Code"
                    >
                      {copiedCode === c.sectionCode ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                )}
                {!isTeacher && (
                  <div className="mt-auto bg-background rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                      <div className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {c.teacher?.fullName?.[0] || 'T'}
                      </div>
                      <span className="text-sm">{c.teacher?.fullName}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-clay p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {isTeacher ? 'Create New Classroom' : 'Join Classroom'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 bg-background rounded-xl shadow-clay-pressed flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={isTeacher ? handleCreate : handleJoin} className="space-y-4">
              {isTeacher ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Name *</label>
                    <div className="bg-background rounded-2xl shadow-clay-pressed px-4 py-3">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. CS 101"
                        required
                        className="bg-transparent outline-none text-gray-700 text-sm w-full placeholder-gray-400 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
                    <div className="bg-background rounded-2xl shadow-clay-pressed px-4 py-3">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional"
                        className="bg-transparent outline-none text-gray-700 text-sm w-full placeholder-gray-400 font-medium resize-none"
                        rows="3"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Section Code *</label>
                  <div className="bg-background rounded-2xl shadow-clay-pressed px-4 py-3">
                    <input
                      type="text"
                      value={sectionCode}
                      onChange={(e) => setSectionCode(e.target.value)}
                      placeholder="Enter code"
                      required
                      className="bg-transparent outline-none text-gray-700 text-sm w-full placeholder-gray-400 font-medium tracking-wider"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary rounded-2xl shadow-clay-violet text-white font-bold py-3 mt-2 flex items-center justify-center gap-2 transition-all hover:bg-primary-dark disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin-slow" /> : <Plus size={16} />}
                {isSubmitting ? 'Processing...' : isTeacher ? 'Create Classroom' : 'Join'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
