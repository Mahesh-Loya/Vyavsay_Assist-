import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  QrCode,
  MessageSquare,
  Users,
  CheckSquare,
  CalendarDays,
  Brain,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: QrCode, label: 'Connect WhatsApp', path: '/qr-scanner' },
  { icon: MessageSquare, label: 'Conversations', path: '/conversations' },
  { icon: Users, label: 'Leads', path: '/leads' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: CalendarDays, label: 'Appointments', path: '/appointments' },
  { icon: Brain, label: 'AI Brain', path: '/ai-brain' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
] as const;

export default function DesktopSidebar() {
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const email = user?.email || '';

  return (
    <aside className="sticky top-0 h-screen w-60 shrink-0 flex flex-col bg-cream-50 border-r border-cream-200">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
        <div className="w-9 h-9 rounded-full bg-pastel-lavender flex items-center justify-center">
          <span className="font-display font-bold text-soft-lavender text-sm">V</span>
        </div>
        <span className="font-display text-lg font-bold text-ink-400">Vyavsay</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-2 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-pastel-lavender text-ink-400 font-semibold'
                  : 'text-ink-100 hover:bg-cream-100 hover:text-ink-300'
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="mt-auto border-t border-cream-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-pastel-peach flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-soft-peach text-sm">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink-400 truncate">{displayName}</p>
            <p className="text-[11px] text-ink-50 truncate">{email}</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-success shrink-0" title="Online" />
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 mb-2 mx-0 text-[13px] font-medium text-error hover:bg-error/5 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
