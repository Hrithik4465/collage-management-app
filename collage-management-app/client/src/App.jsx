import React, { useState, useEffect } from 'react';
import api from './utils/api';
import AdminPortal from './components/AdminPortal';
import FacultyPortal from './components/FacultyPortal';
import StudentPortal from './components/StudentPortal';
import { 
  ShieldAlert, LogOut, Bell, Info, Shield, CheckCircle, ChevronDown, ChevronUp, User, Lock, Sun, Moon
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  // Global Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };
  
  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Toasts
  const [notifications, setNotifications] = useState([]);

  // Live Alerts count from notices/notifications
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);

  useEffect(() => {
    if (token) {
      fetchSession();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchLiveNotifications();
      const interval = setInterval(fetchLiveNotifications, 10000); // Poll notifications every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  const addNotification = (title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setNotifications((prev) => [...prev, { id, title, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveNotifications = async () => {
    try {
      const res = await api.get('/common/notifications');
      setRecentNotifs(res.data.slice(0, 5));
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      // Mark each unread notification as read
      const unreads = recentNotifs.filter(n => !n.read);
      for (const n of unreads) {
        await api.put(`/common/notifications/${n.id}/read`);
      }
      fetchLiveNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setSubmittingLogin(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      addNotification('Logged In', `Welcome back, ${res.data.user.name}!`, 'success');
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setSubmittingLogin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setEmail('');
    setPassword('');
  };

  // Sandbox shortcut login helper
  const triggerSandboxLogin = async (roleEmail, rolePassword) => {
    setLoading(true);
    setLoginError('');
    try {
      const res = await api.post('/auth/login', { email: roleEmail, password: rolePassword });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      addNotification('Sandbox Switch', `Switched role to: ${res.data.user.role} (${res.data.user.name})`, 'success');
    } catch (err) {
      console.error(err);
      addNotification('Error', 'Sandbox login failed. Has database seed run?', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-heading text-sm font-semibold tracking-wide">Syncing Session Profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Toast notifications center */}
      <div className="fixed top-6 right-6 z-50 flex flex-col space-y-3 w-80">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl shadow-xl flex items-start space-x-3 text-white transition-all transform animate-fade-in-up border ${
              n.type === 'success' 
                ? 'bg-emerald-600 border-emerald-500' 
                : n.type === 'error' 
                  ? 'bg-rose-600 border-rose-500' 
                  : n.type === 'warning' 
                    ? 'bg-amber-600 border-amber-500' 
                    : 'bg-indigo-600 border-indigo-500'
            }`}
          >
            {n.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {n.type === 'error' && <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {n.type === 'warning' && <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {n.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <div>
              <div className="font-bold text-sm font-heading">{n.title}</div>
              <div className="text-xs opacity-90 mt-0.5 leading-normal">{n.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      {!user ? (
        // LOGIN CARD (Rendered if not authenticated)
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
          {/* Top Theme Switcher for Login Screen */}
          <div className="absolute top-6 right-6 z-30">
            <button
              onClick={toggleTheme}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-400 px-3.5 py-2 rounded-2xl shadow-md font-semibold text-xs flex items-center space-x-2 transition-all hover:scale-105"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Visual decorative circles */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500/10 dark:bg-brand-950 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-950 rounded-full blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />

          <div className="max-w-md w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 relative z-10 shadow-2xl space-y-6 transition-colors duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex bg-brand-500/10 text-brand-500 dark:text-brand-400 p-3 rounded-2xl border border-brand-500/20">
                <Shield className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">CMS Academy Portal</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Secure sign-in for Students, Faculty & Administrators</p>
            </div>

            {loginError && (
              <div className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="flex bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden items-center focus-within:border-brand-500 transition-colors">
                  <span className="p-3 text-slate-400 dark:text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="Enter email (e.g. admin@college.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-3 pr-4 bg-transparent text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Secret Password</label>
                <div className="flex bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden items-center focus-within:border-brand-500 transition-colors">
                  <span className="p-3 text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3 pr-4 bg-transparent text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingLogin}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 disabled:bg-brand-800 disabled:cursor-not-allowed"
              >
                {submittingLogin ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        // DASHBOARD FRAMEWORK (Rendered if authenticated)
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          {/* Header Bar */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm relative z-20 transition-colors duration-300">
            <div className="flex items-center space-x-3 text-left">
              <div className="bg-brand-600 text-white rounded-xl p-2 font-black font-heading text-lg leading-none flex items-center justify-center">
                CMS
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-slate-900 dark:text-white font-heading">Academy Portal</h1>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider font-mono">
                  {user.role} View
                </span>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              
              {/* Theme Mode Toggle Button */}
              <button
                onClick={toggleTheme}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center shadow-sm"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4.5 h-4.5 text-amber-400" />
                ) : (
                  <Moon className="w-4.5 h-4.5 text-slate-700" />
                )}
              </button>

              {/* Notification icon & dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    if (!showNotifDropdown) markAllNotificationsRead();
                  }}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 transition-all relative flex-shrink-0"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center pulse-glow">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden z-50 text-left">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">Notifications</span>
                      {unreadCount > 0 && <span className="text-[10px] bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold px-2 py-0.5 rounded">New</span>}
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto text-xs">
                      {recentNotifs.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">No new updates</div>
                      ) : (
                        recentNotifs.map((n) => (
                          <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{n.title}</div>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 leading-normal">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Info & Logout */}
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-800 text-left">
                <div className="hidden sm:block">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white rounded-xl p-2.5 transition-all border border-rose-200 dark:border-rose-900/50"
                  title="Sign Out"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Dashboard body */}
          <main className="flex-1 p-6 flex justify-center items-start overflow-y-auto">
            <div className="w-full max-w-7xl">
              {(user.role === 'ADMIN' || user.role === 'CO_ADMIN') && (
                <AdminPortal user={user} addNotification={addNotification} theme={theme} toggleTheme={toggleTheme} />
              )}
              {user.role === 'FACULTY' && (
                <FacultyPortal facultyProfile={user.profile} addNotification={addNotification} theme={theme} toggleTheme={toggleTheme} />
              )}
              {user.role === 'STUDENT' && (
                <StudentPortal studentProfile={user.profile} addNotification={addNotification} theme={theme} toggleTheme={toggleTheme} />
              )}
            </div>
          </main>
        </div>
      )}

      {/* --- FLOATING COLLAPSIBLE SANDBOX PANEL --- */}
      <div className="fixed bottom-6 left-6 z-40 hidden md:block">
        {isSandboxOpen ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl max-w-xs space-y-3 text-left animate-fade-in-up">
            <div className="flex items-center justify-between text-white border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span className="font-bold font-heading text-xs uppercase tracking-wider">CMS Role Sandbox</span>
              </div>
              <button
                onClick={() => setIsSandboxOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Collapse Panel"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Click any preset role button below to perform an instant JWT login and hot-swap dashboard contexts.
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                onClick={() => { triggerSandboxLogin('admin@college.com', 'admin123'); setIsSandboxOpen(false); }}
                className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-between transition-all ${
                  user && user.role === 'ADMIN'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>Rajesh Sharma</span>
                <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded font-mono uppercase font-bold text-indigo-400">ADMIN</span>
              </button>
              
              <button
                onClick={() => { triggerSandboxLogin('coadmin@college.com', 'coadmin123'); setIsSandboxOpen(false); }}
                className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-between transition-all ${
                  user && user.role === 'CO_ADMIN'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>Priya Patel</span>
                <span className="text-[9px] bg-purple-500/20 px-1.5 py-0.5 rounded font-mono uppercase font-bold text-purple-300 border border-purple-500/30">CO-ADMIN</span>
              </button>

              <button
                onClick={() => { triggerSandboxLogin('faculty1@college.com', 'faculty123'); setIsSandboxOpen(false); }}
                className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-between transition-all ${
                  user && user.role === 'FACULTY'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>Dr. Ramesh Verma</span>
                <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded font-mono uppercase font-bold text-emerald-400 font-semibold">FACULTY</span>
              </button>

              <button
                onClick={() => { triggerSandboxLogin('student1@college.com', 'student123'); setIsSandboxOpen(false); }}
                className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-between transition-all ${
                  user && user.role === 'STUDENT'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>Aarav Gupta</span>
                <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded font-mono uppercase font-bold text-amber-400">STUDENT</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsSandboxOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 shadow-2xl rounded-2xl py-2.5 px-4 flex items-center space-x-3 transition-all transform hover:scale-105 group"
            title="Open Role Switcher Sandbox"
          >
            <div className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-lg group-hover:bg-indigo-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold font-heading flex items-center space-x-1.5">
                <span>Role Sandbox</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {user ? `Active: ${user.role}` : 'Quick Switch'}
              </span>
            </div>
          </button>
        )}
      </div>
      
    </div>
  );
}
