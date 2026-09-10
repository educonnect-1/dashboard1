import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { notificationsService, searchService } from '../services';
import {
  LayoutDashboard, Users, UserPlus, MessageSquare, BookOpen, ClipboardList,
  FileText, Calendar, Video, Bell, Search, LogOut, Settings, ChevronDown,
  Menu, X, GraduationCap, BarChart3, Library, Megaphone, CheckCircle,
} from 'lucide-react';
import type { Notification } from '../types';

// ==================== UI COMPONENTS ====================

export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, ...props }: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost: 'text-gray-600 hover:bg-gray-100',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
      {children}
    </button>
  );
}

export function Card({ children, className = '', padding = true }: { children: React.ReactNode; className?: string; padding?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Input({ label, error, className = '', ...props }: {
  label?: string;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-300' : 'border-gray-300'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }: {
  label?: string;
  error?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-300' : 'border-gray-300'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }: {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-300' : 'border-gray-300'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-fade-in`}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <svg className={`animate-spin ${sizes[size]} text-primary-600`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}

// ==================== SEARCH COMPONENT ====================

function SearchDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchService.search(query);
        setResults(res);
      } catch (e) { console.error(e); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl animate-fade-in">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students, groups, assignments..."
              className="flex-1 text-lg outline-none"
            />
          </div>
        </div>
        {results && (
          <div className="p-4 max-h-96 overflow-y-auto">
            {results.students.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Students</h4>
                {results.students.map((s: any) => (
                  <button key={s.id} onClick={() => { navigate(`/students/${s.id}`); onClose(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">{s.full_name} - {s.email}</button>
                ))}
              </div>
            )}
            {results.groups.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Groups</h4>
                {results.groups.map((g: any) => (
                  <button key={g.id} onClick={() => { navigate(`/groups/${g.id}`); onClose(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">{g.name}</button>
                ))}
              </div>
            )}
            {results.assignments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Assignments</h4>
                {results.assignments.map((a: any) => (
                  <button key={a.id} onClick={() => { navigate('/assignments'); onClose(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">{a.title}</button>
                ))}
              </div>
            )}
            {results.exams.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Exams</h4>
                {results.exams.map((e: any) => (
                  <button key={e.id} onClick={() => { navigate('/exams'); onClose(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">{e.title}</button>
                ))}
              </div>
            )}
            {Object.values(results).every((arr: any) => arr.length === 0) && (
              <p className="text-center text-gray-500 py-4">No results found</p>
            )}
          </div>
        )}
        {loading && <LoadingSpinner size="sm" />}
      </div>
    </div>
  );
}

// ==================== NOTIFICATION PANEL ====================

function NotificationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      notificationsService.getTeacherNotifications().then(data => {
        setNotifications(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    await notificationsService.markAllAsRead();
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md shadow-xl h-full overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            <button onClick={handleMarkAllRead} className="text-sm text-primary-600 hover:text-primary-700">Mark all read</button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
          </div>
        </div>
        <div className="p-4">
          {loading ? <LoadingSpinner /> : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-lg border ${n.is_read ? 'bg-white' : 'bg-primary-50 border-primary-200'}`}>
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== SIDEBAR ====================

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/groups', icon: Users, label: 'Groups' },
  { path: '/students', icon: GraduationCap, label: 'Students' },
  { path: '/invitations', icon: UserPlus, label: 'Invitations' },
  { path: '/assignments', icon: ClipboardList, label: 'Assignments' },
  { path: '/exams', icon: FileText, label: 'Exams' },
  { path: '/attendance', icon: CheckCircle, label: 'Attendance' },
  { path: '/announcements', icon: Megaphone, label: 'Announcements' },
  { path: '/resources', icon: Library, label: 'Resources' },
  { path: '/grades', icon: BarChart3, label: 'Grades' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/jitsi', icon: Video, label: 'Live Sessions' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

// ==================== LAYOUT ====================

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsService.getUnreadCount().then(setUnreadCount);
    const interval = setInterval(() => {
      notificationsService.getUnreadCount().then(setUnreadCount);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="px-6 py-5 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm">Teacher Dashboard</h1>
                <p className="text-xs text-gray-500">الأستاذ مروان الجنيدي</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {navItems.map(item => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">{user?.full_name?.[0] || 'M'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <Menu size={20} />
              </button>
              <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-500 hover:bg-gray-100 w-64">
                <Search size={16} />
                <span>Search...</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setNotifOpen(true)} className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Search Dialog */}
      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Notification Panel */}
      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
