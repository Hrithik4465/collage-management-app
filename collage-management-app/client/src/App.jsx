import React, { useState, useEffect } from 'react';
import api from './utils/api';
import AdminPortal from './components/AdminPortal';
import FacultyPortal from './components/FacultyPortal';
import StudentPortal from './components/StudentPortal';
import { 
  ShieldAlert, LogOut, Bell, Info, Shield, CheckCircle, ChevronDown, ChevronUp, User, Lock, Sun, Moon, Search,
  X, Award, Folder, ClipboardList, Newspaper, Wrench, Mail, ExternalLink, ArrowLeftRight, ChevronRight, GraduationCap,
  Settings, Phone, HelpCircle, Send, Check
} from 'lucide-react';

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 m-4 shadow-sm">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/60 text-orange-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">⚠️</div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Unable to display this view</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{this.state.error?.message || 'A minor interface error occurred.'}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Student portal navigation tab controlled from user account menu
  const [studentTab, setStudentTab] = useState('dashboard');

  // Interactive Modals triggered from User Account Drawer
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSwitchAccountModal, setShowSwitchAccountModal] = useState(false);
  const [supportTicket, setSupportTicket] = useState({ category: 'Technical Issue', subject: '', message: '' });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Global Theme State ('light' | 'dark' - defaulting to clean LMS light mode)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

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

    // Apply saved accent, font scaling and high contrast preferences
    const savedAccent = localStorage.getItem('accent_color') || 'orange';
    const savedFont = localStorage.getItem('font_size') || 'normal';
    const savedContrast = localStorage.getItem('high_contrast') === 'true';
    root.setAttribute('data-accent', savedAccent);
    root.setAttribute('data-font-scale', savedFont);
    if (savedContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
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
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          {/* Header Bar - Safe from camera notch with generous breathing margins matching LMS reference */}
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 pt-safe px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between shadow-xs transition-colors duration-300">
            <div className="flex items-center space-x-3 text-left">
              <div className="bg-orange-500 sm:bg-brand-600 text-white rounded-xl w-8 h-8 sm:w-9 sm:h-9 font-black font-heading text-xs sm:text-sm leading-none flex items-center justify-center shadow-xs">
                CMS
              </div>
              <div>
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white font-heading leading-tight tracking-tight">
                  Academy Portal
                </h1>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider font-mono hidden sm:inline-block">
                  {user.role} PORTAL
                </span>
              </div>
            </div>

            {/* Header Actions matching Image 1: Search, Theme, Notifications & Circular Avatar Initial */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Search Icon Button */}
              <button
                onClick={() => {
                  const searchInput = document.getElementById('course-search-input');
                  if (searchInput) {
                    searchInput.focus();
                  } else {
                    addNotification('Search', 'Explore courses, tests, and academic materials', 'info');
                  }
                }}
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Search courses"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Mode Toggle Button */}
              <button
                onClick={toggleTheme}
                className="text-slate-700 dark:text-amber-400 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-700" />
                )}
              </button>

              {/* Notification icon & dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    if (!showNotifDropdown) markAllNotificationsRead();
                  }}
                  className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative flex-shrink-0"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute 1 top-1 right-1 w-4 h-4 bg-orange-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden z-50 text-left">
                    <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">Notifications</span>
                      {unreadCount > 0 && <span className="text-[10px] bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded">New</span>}
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

              {/* User Circular Avatar (Exact MSSU LMS Style: 'H' / user initial) */}
              <div>
                <button
                  onClick={() => setIsUserMenuOpen(true)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-500 dark:bg-slate-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center hover:ring-2 hover:ring-slate-400 transition-all shadow-xs"
                  title="User account"
                >
                  {user.name ? user.name[0].toUpperCase() : 'H'}
                </button>
              </div>
            </div>
          </header>

          {/* -------------------------------------------------------------
              MSSU LMS "USER ACCOUNT" RIGHT SLIDE-OVER DRAWER
              Matching exact screenshot media_1793647277310_2d2d9235.jpg
              ------------------------------------------------------------- */}
          {isUserMenuOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
                onClick={() => setIsUserMenuOpen(false)}
              />

              {/* Drawer Container */}
              <div className="relative w-full max-w-[340px] sm:max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 border-l border-slate-200 dark:border-slate-800 animate-slide-left p-5 text-slate-800 dark:text-slate-100">
                <div>
                  {/* Top Header: "User account" and Close "X" */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading">User account</h2>
                    <button 
                      onClick={() => setIsUserMenuOpen(false)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Academy Portal Branding Header */}
                  <div className="py-5 text-center flex flex-col items-center border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-center space-x-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-orange-500/20">
                        CMS
                      </div>
                      <span className="text-xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                        Academy Portal
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      Campus Learning & Management System
                    </div>
                  </div>

                  {/* Menu Items List */}
                  <div className="py-2 divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {/* Item 1: Profile row */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-9 h-9 rounded-full bg-slate-500 dark:bg-slate-600 text-white font-bold text-sm flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs flex-shrink-0">
                          {user.name ? user.name[0].toUpperCase() : 'H'}
                        </div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {user.name || 'Hrithik Chafe'}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>

                    {/* Item 2: Grades */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setStudentTab('results');
                        addNotification('Grades', 'Viewing Grades & Report card', 'info');
                      }}
                      className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex items-center space-x-3.5">
                        <Award className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">Grades</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>

                    {/* Item 3: Files */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setStudentTab('courses');
                        addNotification('Files', 'Viewing Course Files & Study Materials', 'info');
                      }}
                      className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex items-center space-x-3.5">
                        <Folder className="w-5 h-5 text-slate-600 dark:text-slate-400 fill-slate-500/20 flex-shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">Files</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>

                    {/* Item 4: Reports */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setStudentTab('attendance');
                        addNotification('Reports', 'Viewing Attendance & Academic Reports', 'info');
                      }}
                      className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex items-center space-x-3.5">
                        <ClipboardList className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">Reports</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>

                    {/* Item 5: Blog entries */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setStudentTab('notices');
                        addNotification('Blog entries', 'Viewing Campus Notices & Blog Entries', 'info');
                      }}
                      className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex items-center space-x-3.5">
                        <Newspaper className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">Blog entries</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>

                    {/* Item 6: Preferences */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setStudentTab('settings');
                        addNotification('Preferences', 'Opened Settings & Preferences', 'info');
                      }}
                      className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex items-center space-x-3.5">
                        <Wrench className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">Preferences</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>

                    {/* Item 7: Contact site support */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setShowSupportModal(true);
                      }}
                      className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex items-center space-x-3.5">
                        <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">Contact site support</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white flex-shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Bottom Footer Section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  {/* Item 8: Switch account */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setShowSwitchAccountModal(true);
                    }}
                    className="w-full flex items-center justify-between py-2 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left"
                  >
                    <div className="flex items-center space-x-3.5">
                      <ArrowLeftRight className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">Switch account</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>

                  {/* Item 9: Big Red Log Out Button */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#c82333] hover:bg-[#bd2130] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-98"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Dashboard body with generous gutters away from edges */}
          <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 pb-28 sm:pb-8 flex justify-center items-start overflow-y-auto w-full">
            <div className="w-full max-w-7xl">
              <DashboardErrorBoundary>
                {(user.role === 'ADMIN' || user.role === 'CO_ADMIN') && (
                  <AdminPortal user={user} addNotification={addNotification} theme={theme} toggleTheme={toggleTheme} />
                )}
                {user.role === 'FACULTY' && (
                  <FacultyPortal facultyProfile={user.profile} addNotification={addNotification} theme={theme} toggleTheme={toggleTheme} />
                )}
                {user.role === 'STUDENT' && (
                  <StudentPortal 
                    studentProfile={user.profile} 
                    addNotification={addNotification} 
                    theme={theme} 
                    toggleTheme={toggleTheme} 
                    activeTab={studentTab}
                    setActiveTab={setStudentTab}
                  />
                )}
              </DashboardErrorBoundary>
            </div>
          </main>

          {/* -------------------------------------------------------------
              INTERACTIVE MODAL 1: STUDENT PROFILE DOSSIER
              ------------------------------------------------------------- */}
          {showProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setShowProfileModal(false)}
              />
              <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-fade-in-up text-left max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-orange-500/20">
                      {user.name ? user.name[0].toUpperCase() : 'H'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">{user.name || 'Hrithik Chafe'}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Student ID: {user.profile?.rollNumber || 'STU-2024-001'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Department</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{user.profile?.department?.name || 'Computer Science & Engineering'}</div>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Current Term</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                        {user.profile?.semester?.name || (typeof user.profile?.semester === 'object' ? user.profile?.semester?.name : user.profile?.semester) || 'Semester 4'}
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Cumulative GPA</div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-1">8.92 / 10.0 (Distinction)</div>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Attendance Rate</div>
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400 mt-1">92.4% (Eligible for Exams)</div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500">Official Email</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{user.email || 'hrithik@college.edu'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500">Phone Number</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">+91 98765 43210</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500">Campus Location</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">Main Campus - Sector 12, Kharghar</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400 dark:text-slate-500">Academic Standing</span>
                      <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">Active & Verified</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      setStudentTab('results');
                    }}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-colors text-center"
                  >
                    View Academic Transcript
                  </button>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              INTERACTIVE MODAL 2: CONTACT SITE SUPPORT & HELPDESK
              ------------------------------------------------------------- */}
          {showSupportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setShowSupportModal(false)}
              />
              <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-fade-in-up text-left max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading">Campus Helpdesk Support</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Direct technical assistance & academic inquiries</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSupportModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-4 space-y-4">
                  {/* Direct Contact Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <a
                      href="mailto:support@college.edu"
                      className="p-3.5 bg-slate-50 dark:bg-slate-850 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center space-x-3 transition-colors group"
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-200">Email IT Desk</div>
                        <div className="text-[11px] text-slate-500 truncate group-hover:text-blue-600">support@college.edu</div>
                      </div>
                    </a>

                    <a
                      href="tel:+9102227745000"
                      className="p-3.5 bg-slate-50 dark:bg-slate-850 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center space-x-3 transition-colors group"
                    >
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-200">Student Helpline</div>
                        <div className="text-[11px] text-slate-500 truncate group-hover:text-emerald-600">+91 (022) 2774-5000</div>
                      </div>
                    </a>
                  </div>

                  {/* Submit Ticket Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmittingTicket(true);
                      setTimeout(() => {
                        setSubmittingTicket(false);
                        setShowSupportModal(false);
                        setSupportTicket({ category: 'Technical Issue', subject: '', message: '' });
                        addNotification('Support Ticket Created', 'Ticket #CMS-9841 submitted. Our IT desk will respond within 2 hours.', 'success');
                      }, 700);
                    }}
                    className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">Submit a Support Ticket</div>
                    
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Issue Category</label>
                      <select
                        value={supportTicket.category}
                        onChange={(e) => setSupportTicket({ ...supportTicket, category: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option>Technical Issue</option>
                        <option>LMS Portal & Login Access</option>
                        <option>Exams, Tests & Grading</option>
                        <option>Course Study Materials & Files</option>
                        <option>Fee Payment & Invoices</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Subject</label>
                      <input
                        type="text"
                        required
                        placeholder="Brief summary of inquiry..."
                        value={supportTicket.subject}
                        onChange={(e) => setSupportTicket({ ...supportTicket, subject: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Detailed Description</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Please describe what you need help with..."
                        value={supportTicket.message}
                        onChange={(e) => setSupportTicket({ ...supportTicket, message: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingTicket}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:bg-blue-400"
                    >
                      {submittingTicket ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch Ticket to IT Desk</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              INTERACTIVE MODAL 3: ONE-CLICK SWITCH ACCOUNT
              ------------------------------------------------------------- */}
          {showSwitchAccountModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setShowSwitchAccountModal(false)}
              />
              <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-fade-in-up text-left">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading">Switch Account</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Select an identity to login immediately</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSwitchAccountModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-4 space-y-2.5 text-xs">
                  {/* Account 1: Student */}
                  <button
                    onClick={() => {
                      setShowSwitchAccountModal(false);
                      triggerSandboxLogin('student@college.com', 'student123');
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      user.role === 'STUDENT'
                        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800'
                        : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-slate-500 text-white font-bold text-sm flex items-center justify-center">
                        H
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>Hrithik Chafe</span>
                          {user.role === 'STUDENT' && (
                            <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.2 rounded-full font-bold">Current</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">student@college.com • B.Tech CS</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Account 2: Faculty */}
                  <button
                    onClick={() => {
                      setShowSwitchAccountModal(false);
                      triggerSandboxLogin('faculty@college.com', 'faculty123');
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      user.role === 'FACULTY'
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
                        : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                        R
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>Dr. Ramesh Verma</span>
                          {user.role === 'FACULTY' && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-bold">Current</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">faculty@college.com • Professor & HOD</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Account 3: Admin */}
                  <button
                    onClick={() => {
                      setShowSwitchAccountModal(false);
                      triggerSandboxLogin('admin@college.com', 'admin123');
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      user.role === 'ADMIN'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                        A
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>System Administrator</span>
                          {user.role === 'ADMIN' && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">Current</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">admin@college.com • Full Campus Control</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
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
