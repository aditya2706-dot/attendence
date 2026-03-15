import { NavLink, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  UserPlus, 
  Camera, 
  Users, 
  History, 
  LogOut,
  ScanFace,
  Settings
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', icon: BarChart3, path: '/' },
  { name: 'Register Client', icon: UserPlus, path: '/register' },
  { name: 'Live Attendance', icon: Camera, path: '/live-attendance' },
  { name: 'Client Management', icon: Users, path: '/clients' },
  { name: 'Attendance History', icon: History, path: '/history' },
  { name: 'System Settings', icon: Settings, path: '/settings' },
];

function Sidebar({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary-500 p-2 rounded-xl text-white">
          <ScanFace size={24} />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-slate-800">
          AI <span className="text-primary-600">Secure</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-600 hover:bg-slate-50 hover:text-primary-600",
              isActive && "bg-primary-50 text-primary-600 border border-primary-100"
            )}
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
