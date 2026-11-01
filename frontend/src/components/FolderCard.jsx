import { Folder, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FOLDER_COLORS = [
  { bg: 'bg-primary/10', icon: 'text-primary', ring: 'ring-primary/20' },
  { bg: 'bg-accent/10', icon: 'text-accent-dark', ring: 'ring-accent/20' },
  { bg: 'bg-rose-100', icon: 'text-rose', ring: 'ring-rose/20' },
  { bg: 'bg-sky-100', icon: 'text-sky', ring: 'ring-sky/20' },
  { bg: 'bg-emerald-100', icon: 'text-emerald', ring: 'ring-emerald/20' },
];

export default function FolderCard({ folder, index = 0 }) {
  const navigate = useNavigate();
  const color = FOLDER_COLORS[index % FOLDER_COLORS.length];

  return (
    <div
      id={`folder-card-${folder.id}`}
      onClick={() => navigate(`/folder/${folder.id}`)}
      className="bg-white rounded-3xl shadow-clay p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-clay-violet group"
    >
      {/* Icon */}
      <div className={`w-12 h-12 ${color.bg} rounded-2xl flex items-center justify-center mb-4 ring-2 ${color.ring} transition-transform group-hover:scale-110`}>
        <Folder size={22} className={color.icon} />
      </div>

      {/* Info */}
      <h3 className="font-bold text-gray-800 text-base leading-tight mb-1 truncate">{folder.name}</h3>
      {folder.subject && (
        <p className="text-xs text-gray-400 font-medium mb-3 truncate">{folder.subject}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
          <FileText size={12} />
          {folder.documentCount ?? 0} docs
        </span>
        <ChevronRight size={14} className="text-primary-light opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
