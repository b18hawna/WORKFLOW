import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  RiDashboardLine, RiFolderLine, RiTaskLine,
  RiUserLine, RiLogoutBoxLine, RiCheckboxCircleLine,
  RiCalendarCheckLine,
} from 'react-icons/ri';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',  icon: RiDashboardLine,    label: 'Dashboard'  },
  { to: '/projects',   icon: RiFolderLine,        label: 'Projects'   },
  { to: '/tasks',      icon: RiTaskLine,          label: 'Tasks'      },
  { to: '/attendance', icon: RiCalendarCheckLine, label: 'Attendance' },
  { to: '/profile',    icon: RiUserLine,          label: 'Profile'    },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30
      w-64 flex flex-col
      bg-surface-900 text-white
      transform transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
          <RiCheckboxCircleLine className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">Workflow</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
               ${isActive
                 ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                 : 'text-slate-400 hover:text-white hover:bg-white/10'
               }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(user?.name)}`}>
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <RiLogoutBoxLine className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}