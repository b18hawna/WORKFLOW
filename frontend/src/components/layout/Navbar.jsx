import { useLocation } from 'react-router-dom';
import { RiMenuLine, RiBellLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/profile': 'Profile',
};

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();

  const title = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'Task-Manager';

  return (
    <header className="flex items-center px-4 lg:px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
      <div className="flex items-center justify-center w-full gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <RiMenuLine className="w-5 h-5" />
        </button>
        
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      </div>


    </header>
  );
}
