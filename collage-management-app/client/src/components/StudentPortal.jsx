import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Calendar, CheckSquare, FileText, Award, Bell, Upload, BookOpen, AlertCircle, RefreshCw, Send, Check, CreditCard,
  HelpCircle, Clock, CheckCircle, Eye, Sparkles, Download, Printer, Search, Filter, ShieldCheck, QrCode, X, Trash2, AlertTriangle, FileBadge, PanelLeftClose, PanelLeftOpen, Menu, Target
} from 'lucide-react';

export default function StudentPortal({ studentProfile, addNotification }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Dashboard states
  const [attendance, setAttendance] = useState({ overallPercentage: 100, totalClasses: 0, totalPresent: 0, subjects: [] });
  const [schedule, setSchedule] = useState([]);
  const [notices, setNotices] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [feeData, setFeeData] = useState({ feeRecords: [], summary: { totalPaid: 0, totalPending: 0, totalOverdue: 0 } });
  const [payingFee, setPayingFee] = useState(null);

  // Quizzes state
  const [quizzes, setQuizzes] = useState([]);
  const [takingQuiz, setTakingQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(0);
  const [viewingQuizResult, setViewingQuizResult] = useState(null);

  // Certificate state
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Notices state
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('ALL');

  // Smart Notifications Center state
  const [notificationsList, setNotificationsList] = useState([]);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState('ALL');

  // Submission overlay
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submitForm, setSubmitForm] = useState({ filePath: '' });

  useEffect(() => {
    fetchDashboardData();
    fetchNotificationAlerts();
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
      fetchQuizzes();
    } else if (activeTab === 'assignments') {
      fetchAssignments();
    } else if (activeTab === 'quizzes') {
      fetchQuizzes();
    } else if (activeTab === 'results') {
      fetchResults();
    } else if (activeTab === 'exams') {
      fetchExams();
    } else if (activeTab === 'fees') {
      fetchFeeStatus();
    } else if (activeTab === 'certificates') {
      fetchCertificates();
    } else if (activeTab === 'notices') {
      fetchNotices();
    }
  }, [activeTab]);

  const fetchQuizzes = async () => {
    try {
      const res = await api.get('/student/quizzes');
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startQuiz = (quiz) => {
    setTakingQuiz(quiz);
    setQuizAnswers({});
    setQuizTimeRemaining(quiz.duration * 60);
  };

  useEffect(() => {
    let timer;
    if (takingQuiz && quizTimeRemaining > 0) {
      timer = setInterval(() => {
        setQuizTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (takingQuiz && quizTimeRemaining === 0) {
      submitQuizResponse();
    }
    return () => clearInterval(timer);
  }, [takingQuiz, quizTimeRemaining]);

  const submitQuizResponse = async () => {
    if (!takingQuiz) return;
    try {
      const res = await api.post(`/student/quizzes/${takingQuiz.id}/submit`, { answers: quizAnswers });
      addNotification('Test Submitted', `Your score: ${res.data.score}/${res.data.maxScore}`, 'success');
      setTakingQuiz(null);
      fetchQuizzes();
    } catch (err) {
      addNotification('Error', err.response?.data?.error || 'Failed to submit quiz', 'error');
    }
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch attendance
      const attRes = await api.get('/student/attendance');
      setAttendance(attRes.data);

      // 2. Fetch timetable
      const ttRes = await api.get(`/common/timetables?semesterId=${studentProfile.semesterId}&section=${studentProfile.section}`);
      setSchedule(ttRes.data);

      // 3. Fetch announcements
      const noteRes = await api.get('/common/announcements');
      setNotices(noteRes.data.slice(0, 5)); // top 5 notices

      // 4. Fetch assignments
      const assRes = await api.get('/student/assignments');
      setAssignments(assRes.data);

      // 5. Fetch exams
      const examRes = await api.get('/common/exams');
      setExams(examRes.data);

      // 6. Fetch Quizzes for Dashboard widget
      fetchQuizzes();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/student/certificates');
      setCertificates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await api.get('/common/announcements');
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotificationAlerts = async () => {
    try {
      const res = await api.get('/student/notifications-alerts');
      setNotificationsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.put('/common/notifications/read-all');
      setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
      addNotification('Success', 'All notifications marked as read', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const clearNotifications = async () => {
    try {
      await api.delete('/common/notifications/clear');
      setNotificationsList([]);
      addNotification('Cleared', 'Notification alerts history cleared', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const printCertificate = () => {
    window.print();
  };

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/student/assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await api.get('/student/results');
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await api.get('/common/exams');
      setExams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeeStatus = async () => {
    try {
      const res = await api.get('/student/fee-status');
      setFeeData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayFee = async (feeId) => {
    try {
      await api.post(`/student/fee-pay/${feeId}`);
      addNotification('Payment Successful', 'Fee dues cleared. Receipt generated.', 'success');
      setPayingFee(null);
      fetchFeeStatus();
      fetchNotificationAlerts();
    } catch (err) {
      addNotification('Error', 'Failed to process payment', 'error');
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!submitForm.filePath) {
      addNotification('Error', 'Please input a filename or paste a link', 'error');
      return;
    }
    try {
      await api.post(`/student/assignments/${submittingAssignment.id}/submit`, submitForm);
      addNotification('Success', 'Assignment submitted successfully for review', 'success');
      setSubmittingAssignment(null);
      setSubmitForm({ filePath: '' });
      fetchAssignments();
      fetchDashboardData();
    } catch (err) {
      addNotification('Error', err.response?.data?.error || 'Failed to submit assignment', 'error');
    }
  };

  const studentNavTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'results', label: 'Grades & Report', icon: Award },
    { id: 'exams', label: 'Exam Schedule', icon: Calendar },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'quizzes', label: 'Online Tests', icon: HelpCircle },
    { id: 'notices', label: 'Notice Board', icon: Bell },
    { id: 'certificates', label: 'Certificates', icon: FileBadge },
    { id: 'fees', label: 'Fee Status', icon: CreditCard }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen gap-6 items-start text-left relative">
      {/* Mobile Nav Bar Toggle */}
      <div className="lg:hidden w-full bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="flex items-center space-x-2 text-slate-700 font-bold text-xs"
        >
          <Menu className="w-5 h-5 text-brand-600" />
          <span>Student Menu</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNotificationDrawer(true)}
            className="relative bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
          >
            <Bell className="w-4 h-4 text-brand-600" />
            {notificationsList.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
            )}
          </button>
          <span className="text-xs font-bold text-brand-600 font-mono">
            {studentNavTabs.find(t => t.id === activeTab)?.label}
          </span>
        </div>
      </div>

      {/* Collapsible Left Sidebar */}
      <aside className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 flex flex-col justify-between p-3 shrink-0 ${
        isMobileNavOpen ? 'block w-full' : 'hidden lg:flex'
      } ${
        isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      } sticky top-6 z-30`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider font-heading">Student Portal</span>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all hidden lg:block mx-auto lg:mx-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>

          <nav className="space-y-1">
            {studentNavTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileNavOpen(false);
                  }}
                  title={isSidebarCollapsed ? tab.label : ''}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'lg:justify-center px-3 py-3' : 'space-x-3 px-3 py-2.5'
                  } text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {(!isSidebarCollapsed || isMobileNavOpen) && (
                    <span className="truncate">{tab.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Notifications Drawer Toggle in Sidebar */}
        <div className="pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={() => setShowNotificationDrawer(true)}
            title="Notification Center"
            className={`w-full bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-slate-700 flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            } text-xs font-bold transition-all`}
          >
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-brand-600 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Notifications</span>}
            </div>
            {notificationsList.filter(n => !n.read).length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                {notificationsList.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 w-full space-y-6 min-w-0">


      {/* Tab Panels */}

      {/* Tab: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          
          {/* Main content grid */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Row 1: Profile & Attendance Widget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between text-left relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-950/40 rounded-full translate-x-8 -translate-y-8 flex-shrink-0" />
                <div className="relative">
                  <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/50 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    {studentProfile.rollNumber}
                  </span>
                  <h3 className="text-xl font-bold font-heading text-slate-800 dark:text-white mt-3">{studentProfile.user?.name}</h3>
                  <div className="text-sm text-slate-400 dark:text-slate-400 mt-1">{studentProfile.user?.email}</div>
                  
                  <div className="mt-6 space-y-2 text-xs text-slate-500 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Course:</span> {studentProfile.course?.name}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Section:</span> {studentProfile.section}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Semester:</span> {studentProfile.semester?.name}
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Status: Active Academic Term
                </div>
              </div>

              {/* Overall Attendance Circle Widget */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex items-center justify-between text-left transition-colors">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-heading text-slate-800 dark:text-white">Overall Attendance</h3>
                  <p className="text-slate-400 dark:text-slate-400 text-xs leading-relaxed">
                    Requirement is &ge;75% for exam authorization.
                  </p>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-300 pt-2">
                    Attended: {attendance.totalPresent} / {attendance.totalClasses} classes
                  </div>
                </div>

                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${
                        attendance.overallPercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'
                      } transition-all duration-1000`}
                      strokeDasharray={`${attendance.overallPercentage}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-xl font-extrabold text-slate-800 dark:text-white font-heading">
                    {attendance.overallPercentage}%
                  </div>
                </div>
              </div>
            </div>

            {/* Timetable schedule lists */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 text-left space-y-4 transition-colors">
              <h3 className="text-lg font-bold font-heading text-slate-800 dark:text-white">Today's Class Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedule.length === 0 ? (
                  <div className="col-span-2 p-6 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No classes scheduled for today. Enjoy your day!
                  </div>
                ) : (
                  schedule.map((slot) => (
                    <div key={slot.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                          {slot.dayOfWeek}
                        </span>
                        <div className="font-semibold text-slate-800 dark:text-white">{slot.subject?.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-400">Room: {slot.room} • Faculty: {slot.subject?.faculty?.user?.name || 'Assigned'}</div>
                      </div>
                      <span className="text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                        {slot.startTime}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar widgets */}
          <div className="space-y-6">
            {/* Active Online Tests Alert Widget */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-md space-y-3 text-left relative overflow-hidden border border-indigo-800/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded font-mono">
                  Online Tests Portal
                </span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-sm">Active Online Tests ({quizzes.length})</h4>
                <p className="text-[11px] text-slate-300">
                  {quizzes.filter(q => !q.isSubmitted).length > 0
                    ? `You have ${quizzes.filter(q => !q.isSubmitted).length} pending test(s) ready to take!`
                    : 'All online tests for your term are up to date.'}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('quizzes')}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Go to Online Tests ({quizzes.length})</span>
              </button>
            </div>

            {/* Notice Board announcements widget */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 text-left space-y-4 transition-colors">
              <h3 className="text-lg font-bold font-heading text-slate-800 dark:text-white flex items-center space-x-2">
                <Bell className="w-5 h-5 text-indigo-500" />
                <span>Recent Notice Board</span>
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {notices.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 dark:text-slate-500">
                    Notice board is empty.
                  </div>
                ) : (
                  notices.map((n) => (
                    <div key={n.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-slate-400 dark:text-slate-400 font-semibold">
                        <span>By {n.createdBy?.name}</span>
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white">{n.title}</div>
                      <p className="text-slate-500 dark:text-slate-300 leading-relaxed text-[11px]">{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab: Attendance Detailed */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-fade-in-up">
          <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Academic Attendance Record</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {attendance.subjects.length === 0 ? (
              <div className="col-span-3 p-8 text-center text-slate-400">
                No attendance sheets marked for this term yet.
              </div>
            ) : (
              attendance.subjects.map((sub) => (
                <div key={sub.subjectId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between text-left space-y-4">
                  <div>
                    <span className="text-[10px] font-mono bg-white border border-slate-100 px-2 py-0.5 rounded text-slate-400 uppercase font-bold">
                      {sub.subjectCode}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-2 line-clamp-1">{sub.subjectName}</h3>
                    <div className="text-xs text-slate-400 mt-1">
                      Marked Classes: {sub.total} (Attended: {sub.present})
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-md font-extrabold ${
                      sub.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {sub.percentage}%
                    </span>
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                        style={{ width: `${sub.percentage}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Assignments Submission */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-fade-in-up">
          <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Academic Assignments Checklist</h2>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Assignment & Subject</th>
                  <th className="p-4">Instructions</th>
                  <th className="p-4 font-mono">Deadline</th>
                  <th className="p-4">Review Status</th>
                  <th className="p-4">Grade & Remarks</th>
                  <th className="p-4 text-center">Submission Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No assignments published for this semester.
                    </td>
                  </tr>
                ) : (
                  assignments.map((assign) => {
                    const isGraded = assign.submissionStatus === 'GRADED';
                    const isSubmitted = assign.submissionStatus === 'PENDING' || isGraded;
                    return (
                      <tr key={assign.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{assign.title}</div>
                          <div className="text-xs text-slate-400">{assign.subject?.name}</div>
                        </td>
                        <td className="p-4">
                          <p className="text-xs text-slate-500 max-w-xs">{assign.description || 'No instruction attached.'}</p>
                          {assign.filePath && (
                            <a 
                              href="#"
                              onClick={(e) => { e.preventDefault(); addNotification('Downloaded', `Downloading study resources: ${assign.filePath}`, 'success'); }}
                              className="text-xs text-brand-600 hover:underline inline-flex items-center space-x-1 font-semibold mt-1.5"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{assign.filePath}</span>
                            </a>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-500 text-xs">{assign.deadline}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold ${
                            assign.submissionStatus === 'GRADED' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : assign.submissionStatus === 'PENDING'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {assign.submissionStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          {isGraded ? (
                            <div>
                              <div className="font-bold text-slate-800 text-xs">Grade: {assign.submission?.grade}</div>
                              <div className="text-slate-400 text-[10px] italic leading-normal">{assign.submission?.remarks}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {isGraded ? (
                            <span className="text-slate-400 text-xs font-semibold flex items-center justify-center space-x-1">
                              <Check className="w-4 h-4 text-emerald-500" />
                              <span>Graded Locked</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => { setSubmittingAssignment(assign); setSubmitForm({ filePath: assign.submission?.filePath || '' }); }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                isSubmitted 
                                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                  : 'bg-brand-600 text-white hover:bg-brand-700'
                              }`}
                            >
                              {isSubmitted ? 'Resubmit Work' : 'Upload Submission'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Exams list */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-fade-in-up">
          <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Upcoming Examination Schedule</h2>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Exam Details</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4 font-mono">Date</th>
                  <th className="p-4">Session Time</th>
                  <th className="p-4">Location Venue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No exam timetables published.
                    </td>
                  </tr>
                ) : (
                  exams.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">{ex.title}</td>
                      <td className="p-4">
                        <div className="font-semibold text-indigo-600">{ex.subject?.name}</div>
                        <div className="text-slate-400 text-xs font-mono">{ex.subject?.code}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{ex.date}</td>
                      <td className="p-4 font-medium text-slate-500">{ex.time}</td>
                      <td className="p-4 font-medium text-slate-600">{ex.room}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Results Transcript */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-fade-in-up">
          <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Academic Transcript Results</h2>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Subject</th>
                  <th className="p-4 font-mono">Assessment</th>
                  <th className="p-4">Marks Obtained</th>
                  <th className="p-4">GPA Grade</th>
                  <th className="p-4">Instructor Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No results published yet.
                    </td>
                  </tr>
                ) : (
                  results.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{res.subject?.name}</div>
                        <div className="text-slate-400 text-xs font-mono">{res.subject?.code}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-500">
                        {res.exam?.title || 'Continuous Class Assessment'}
                      </td>
                      <td className="p-4 font-bold text-slate-700">
                        {res.marks} <span className="text-slate-400 font-normal">/ {res.maxMarks}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-extrabold ${
                          res.grade === 'F' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {res.grade}
                        </span>
                      </td>
                      <td className="p-4 text-xs italic text-slate-500">{res.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* Tab: Online Tests */}
      {activeTab === 'quizzes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 dark:text-white text-left">Online Tests & Quizzes</h2>
              <p className="text-slate-400 text-xs text-left mt-0.5">Take active course tests, view auto-graded results and immediate feedback</p>
            </div>
            <button
              onClick={fetchQuizzes}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 self-start sm:self-auto transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Tests</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {quizzes.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-slate-400 dark:text-slate-500">
                No active online tests available for your course semester right now.
              </div>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/90 space-y-4 relative flex flex-col justify-between shadow-sm hover:border-indigo-500/50 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg uppercase border border-indigo-200/80 dark:border-indigo-800/60">
                        {quiz.subject?.name}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        quiz.isSubmitted 
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' 
                          : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                      }`}>
                        {quiz.isSubmitted ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight mt-1">{quiz.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{quiz.description || 'Continuous academic online evaluation test.'}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200/60 dark:border-slate-700/60">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>{quiz.duration} mins</span>
                      </span>
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200/60 dark:border-slate-700/60">
                        <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>{quiz.questions?.length || 0} Qs</span>
                      </span>
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200/60 dark:border-slate-700/60">
                        <Target className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>{quiz.totalMarks} Marks</span>
                      </span>
                    </div>

                    {quiz.isSubmitted ? (
                      <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider">Test Score Obtained</span>
                          <span className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 font-mono mt-0.5 block">
                            {quiz.submission?.score} / {quiz.submission?.maxScore} ({Math.round((quiz.submission?.score / quiz.submission?.maxScore) * 100)}%)
                          </span>
                        </div>
                        <button
                          onClick={() => setViewingQuizResult(quiz)}
                          className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-700 flex items-center space-x-1.5 shadow-md transition-all"
                        >
                          <Eye className="w-4 h-4 text-emerald-400" />
                          <span>View Review</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startQuiz(quiz)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2 text-xs tracking-wider uppercase transition-all transform hover:-translate-y-0.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Start Online Test Now</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAKE ONLINE QUIZ MODAL --- */}
      {takingQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-6 relative animate-fade-in-up text-left max-h-[90vh] flex flex-col transition-colors">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-800 dark:text-white">{takingQuiz.title}</h3>
                <span className="text-xs text-slate-400 font-medium">{takingQuiz.subject?.name} • Faculty: {takingQuiz.facultyName}</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 px-3 py-1.5 rounded-xl font-mono text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>
                  Time Remaining: {Math.floor(quizTimeRemaining / 60)}:{(quizTimeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto space-y-6 pr-2 flex-grow">
              {takingQuiz.questions.map((q, idx) => (
                <div key={idx} className="p-4 bg-slate-50/70 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs text-left">
                      Question {idx + 1}: {q.questionText}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                      {q.marks || 10} Marks
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {['A', 'B', 'C', 'D'].map((optKey) => {
                      const isSelected = quizAnswers[idx] === optKey;
                      const optText = q[`option${optKey}`];
                      return (
                        <label
                          key={optKey}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [idx]: optKey }))}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-2 transition-all ${
                            isSelected 
                              ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-900 dark:text-brand-300 font-semibold shadow-2xs' 
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${idx}`}
                            checked={isSelected}
                            onChange={() => {}}
                            className="text-brand-600 focus:ring-brand-500"
                          />
                          <span className="font-bold text-slate-400 dark:text-slate-500">{optKey}.</span>
                          <span>{optText}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 flex-shrink-0">
              <span className="text-xs text-slate-400 font-mono">
                Answered {Object.keys(quizAnswers).length} of {takingQuiz.questions.length} Questions
              </span>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setTakingQuiz(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitQuizResponse}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-500/20 flex items-center space-x-1"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Answers</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- REVIEW QUIZ RESULTS MODAL --- */}
      {viewingQuizResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4 relative animate-fade-in-up text-left">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-800 dark:text-white">{viewingQuizResult.title}</h3>
                <span className="text-xs text-slate-400">{viewingQuizResult.subject?.name}</span>
              </div>
              <button
                onClick={() => setViewingQuizResult(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold block uppercase text-[10px]">Your Score</span>
                <span className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-300">
                  {viewingQuizResult.submission?.score} / {viewingQuizResult.submission?.maxScore}
                </span>
              </div>
              <div className="text-right">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold block text-[10px]">Submitted Date</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {new Date(viewingQuizResult.submission?.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingQuizResult(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Notice Board */}
      {activeTab === 'notices' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 dark:text-white text-left">Campus Notice Board</h2>
              <p className="text-slate-400 text-xs text-left mt-0.5">Official circulars, department announcements, and course notices</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                {['ALL', 'GENERAL', 'DEPARTMENT', 'COURSE'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNoticeCategory(cat)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      noticeCategory === cat 
                        ? 'bg-white dark:bg-indigo-600 text-slate-800 dark:text-white font-bold shadow-2xs' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search notices..."
                  value={noticeSearch}
                  onChange={(e) => setNoticeSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 w-48 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {notices.filter(n => {
              if (noticeCategory !== 'ALL' && n.category !== noticeCategory) return false;
              if (noticeSearch && !n.title.toLowerCase().includes(noticeSearch.toLowerCase()) && !n.content.toLowerCase().includes(noticeSearch.toLowerCase())) return false;
              return true;
            }).length === 0 ? (
              <div className="col-span-2 p-8 text-center text-slate-400 dark:text-slate-500">
                No matching notices found.
              </div>
            ) : (
              notices.filter(n => {
                if (noticeCategory !== 'ALL' && n.category !== noticeCategory) return false;
                if (noticeSearch && !n.title.toLowerCase().includes(noticeSearch.toLowerCase()) && !n.content.toLowerCase().includes(noticeSearch.toLowerCase())) return false;
                return true;
              }).map((n) => (
                <div key={n.id} className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-850/60 space-y-3 relative flex flex-col justify-between transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded text-[10px] uppercase border border-indigo-200 dark:border-indigo-800/50">
                        {n.category}
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-white text-base">{n.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{n.content}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                    <span>Issued By: {n.createdBy?.name || 'College Administration'}</span>
                    <span className="capitalize">{n.createdBy?.role || 'Notice Board'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Certificates */}
      {activeTab === 'certificates' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 dark:text-white text-left">Official Student Certificates</h2>
              <p className="text-slate-400 text-xs text-left mt-0.5">Generate, view, and download official institutional certificates with QR verification</p>
            </div>
            <button
              onClick={fetchCertificates}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 self-start sm:self-auto transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Certificates</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {certificates.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-slate-400">
                Loading official certificates...
              </div>
            ) : (
              certificates.map((cert) => (
                <div key={cert.id} className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 space-y-4 flex flex-col justify-between shadow-2xs transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {cert.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Ref: {cert.refNumber}</span>
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center space-x-2">
                      <FileBadge className="w-5 h-5 text-brand-600 dark:text-amber-400 flex-shrink-0" />
                      <span>{cert.title}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">{cert.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">Issued: {cert.issueDate}</span>
                    <button
                      onClick={() => setSelectedCertificate(cert)}
                      className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View & Download Certificate</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB: FEE STATUS & FINANCIAL STATEMENT --- */}
      {activeTab === 'fees' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 dark:text-white text-left">Academic Fee Status & Statement</h2>
              <p className="text-slate-400 text-xs text-left mt-0.5">Track semester tuition fees, dues clearance, transaction history, and online payments</p>
            </div>
            <button
              onClick={fetchFeeStatus}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 self-start sm:self-auto transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Records</span>
            </button>
          </div>

          {/* Fee Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-left space-y-1">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Total Fees Cleared</span>
              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
                ₹{(feeData.summary?.totalPaid || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">All paid invoices & receipts</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-left space-y-1">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Pending Dues</span>
              <div className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono">
                ₹{(feeData.summary?.totalPending || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">Upcoming fee payment due</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-left space-y-1">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Overdue Dues</span>
              <div className="text-2xl font-black text-rose-900 dark:text-rose-200 font-mono">
                ₹{(feeData.summary?.totalOverdue || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">Action required immediately</span>
            </div>
          </div>

          {/* Fee Statement Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4">Fee Item / Particulars</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Payment Ref / Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {(!feeData.feeRecords || feeData.feeRecords.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      No fee records found for your student profile.
                    </td>
                  </tr>
                ) : (
                  feeData.feeRecords.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-semibold text-slate-800 dark:text-white">
                        <div>{fee.title}</div>
                        {fee.remarks && <div className="text-[10px] text-slate-400 font-normal mt-0.5">{fee.remarks}</div>}
                      </td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{fee.dueDate}</td>
                      <td className="p-4 font-bold font-mono text-slate-900 dark:text-white text-sm">
                        ₹{fee.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          fee.status === 'PAID' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                          fee.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-500 dark:text-slate-400">
                        {fee.status === 'PAID' ? (
                          <div>
                            <div className="font-semibold text-slate-700 dark:text-slate-200">{fee.transactionId || 'ONLINE'}</div>
                            <div className="text-[10px] text-slate-400">{fee.paymentDate}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unpaid</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {fee.status === 'PAID' ? (
                          <button
                            onClick={() => addNotification('Receipt', `Downloading fee receipt for ${fee.title}`, 'success')}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center space-x-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setPayingFee(fee)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all inline-flex items-center space-x-1"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay Dues</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {payingFee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 space-y-4 relative animate-fade-in-up text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold font-heading text-slate-800 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-brand-600" />
                <span>Online Fee Payment Gateway</span>
              </h3>
              <button
                onClick={() => setPayingFee(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Fee Particulars:</span>
                <span className="font-bold text-slate-800">{payingFee.title}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Due Date:</span>
                <span className="font-mono text-slate-700">{payingFee.dueDate}</span>
              </div>
              <div className="flex justify-between text-slate-800 text-sm font-bold border-t border-slate-200 pt-2">
                <span>Total Amount Due:</span>
                <span className="text-brand-600 font-mono text-base">₹{payingFee.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span>256-Bit SSL Encrypted Instant Payment Simulation. Click confirm to process dues clearance.</span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setPayingFee(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayFee(payingFee.id)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-100 flex items-center space-x-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Payment (₹{payingFee.amount.toLocaleString('en-IN')})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- OFFICIAL CERTIFICATE PRINTABLE MODAL --- */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-8 space-y-6 relative animate-fade-in-up text-center transition-colors">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 no-print">
              <span className="text-xs font-bold text-slate-400 font-mono">DOCUMENT PREVIEW • {selectedCertificate.refNumber}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={printCertificate}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-8 border-8 border-double border-brand-900 dark:border-amber-600 bg-amber-50/20 dark:bg-slate-950 rounded-xl space-y-6 relative text-slate-900 dark:text-slate-100 shadow-inner">
              <div className="space-y-1">
                <ShieldCheck className="w-12 h-12 text-brand-700 dark:text-amber-400 mx-auto" />
                <h2 className="text-2xl font-extrabold font-heading uppercase tracking-widest text-slate-900 dark:text-white">College of Engineering & Technology</h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-amber-300">Accredited Grade A+ Institute • Official Academic Document</p>
                <div className="w-32 h-0.5 bg-brand-600 dark:bg-amber-500 mx-auto my-2" />
              </div>

              <h3 className="text-xl font-bold font-serif italic text-brand-900 dark:text-amber-400 underline underline-offset-4 uppercase tracking-wide">
                {selectedCertificate.title}
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-serif max-w-lg mx-auto">
                <p>
                  This is to officially certify that <strong className="text-slate-900 dark:text-white font-sans text-base block my-1 font-extrabold uppercase tracking-wide">{selectedCertificate.studentName}</strong>
                  bearing Roll Number <strong className="font-mono text-slate-900 dark:text-amber-300">{selectedCertificate.rollNumber}</strong> is a registered student in the Department of <strong>{selectedCertificate.department}</strong>.
                </p>

                <p>
                  Program of Study: <strong>{selectedCertificate.course}</strong> ({selectedCertificate.semester}).
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                  "{selectedCertificate.description}"
                </p>
              </div>

              <div className="pt-6 border-t border-slate-300 dark:border-slate-800 flex items-end justify-between text-left text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">Date of Issuance</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{selectedCertificate.issueDate}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">Ref: {selectedCertificate.refNumber}</span>
                </div>

                <div className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 flex items-center space-x-2 shadow-2xs">
                  <QrCode className="w-10 h-10 text-slate-800 dark:text-amber-400" />
                  <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                    <div>AUTHENTICATED</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">VERIFIED OFFICIAL</div>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <div className="font-serif italic font-bold text-brand-900 dark:text-amber-400 text-sm">Registrar Academic</div>
                  <div className="w-24 h-0.5 bg-slate-400 dark:bg-slate-700 mx-auto" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-sans">Authorized Seal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SMART NOTIFICATION DRAWER --- */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 space-y-6 flex flex-col animate-slide-in-right text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-bold font-heading text-slate-800">Notification Center</h3>
                {notificationsList.filter(n => !n.read).length > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {notificationsList.filter(n => !n.read).length} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowNotificationDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="flex items-center justify-between text-xs flex-shrink-0">
              <button
                onClick={markAllNotificationsRead}
                className="text-brand-600 font-semibold hover:underline flex items-center space-x-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>

              <button
                onClick={clearNotifications}
                className="text-rose-600 font-semibold hover:underline flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="flex overflow-x-auto gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold flex-shrink-0">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'DEADLINE', label: 'Deadlines ⏰' },
                { id: 'ANNOUNCEMENT', label: 'Notices 📢' },
                { id: 'ATTENDANCE', label: 'Attendance ⚠️' },
                { id: 'EXAM', label: 'Exams 📅' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setNotifCategoryFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                    notifCategoryFilter === f.id ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto space-y-3 flex-grow pr-1">
              {notificationsList.filter(n => {
                if (notifCategoryFilter !== 'ALL' && n.category !== notifCategoryFilter) return false;
                return true;
              }).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No notifications recorded right now.
                </div>
              ) : (
                notificationsList.filter(n => {
                  if (notifCategoryFilter !== 'ALL' && n.category !== notifCategoryFilter) return false;
                  return true;
                }).map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border transition-all text-xs space-y-1 ${
                      n.read ? 'bg-slate-50/50 border-slate-100 text-slate-600' : 'bg-brand-50/40 border-brand-100 text-slate-900 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                        n.category === 'DEADLINE' ? 'bg-amber-100 text-amber-800' :
                        n.category === 'ATTENDANCE' ? 'bg-rose-100 text-rose-800' :
                        n.category === 'EXAM' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {n.category || 'NOTIFICATION'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-bold text-slate-800">{n.title}</div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono flex-shrink-0">
              Live College Notification Feed Active
            </div>
          </div>
        </div>
      )}

      {/* --- MOCK FILE UPLOAD OVERLAY --- */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 space-y-4 relative animate-fade-in-up">
            <h3 className="text-lg font-bold font-heading text-slate-800">
              Submit Homework Solution
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Task: {submittingAssignment.title} ({submittingAssignment.subject?.name})
            </p>

            <form onSubmit={handleAssignmentSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Simulated File Upload</label>
                <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 items-center">
                  <span className="p-2 text-slate-400 border-r border-slate-200">
                    <Upload className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter file name (e.g., solution_v1.pdf)"
                    value={submitForm.filePath}
                    onChange={(e) => setSubmitForm({ ...submitForm, filePath: e.target.value })}
                    className="w-full p-2 bg-transparent focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Type any filename to simulate uploading PDF solutions.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-sm flex items-center space-x-1"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Solution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
