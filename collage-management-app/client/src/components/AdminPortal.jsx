import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { 
  Users, GraduationCap, Building2, BookOpen, Calendar, Bell, Plus, Edit2, Trash2, Search, Filter, Book, Save, CheckSquare, Shield, Key, Power, FileSpreadsheet, Download, Upload, CheckCircle, AlertCircle, X, BarChart2, FileText, CreditCard, DollarSign, PanelLeftClose, PanelLeftOpen, Menu
} from 'lucide-react';

export default function AdminPortal({ user, addNotification }) {
  const [activeTab, setActiveTab] = useState('users');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [stats, setStats] = useState({ students: 0, faculty: 0, courses: 0, departments: 0, attendanceRate: 100 });
  
  // Lists
  const [allUsers, setAllUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [exams, setExams] = useState([]);
  
  // Modules data states
  const [attendanceReport, setAttendanceReport] = useState({ overallAttendance: 100, studentsReport: [], lowAttendanceWatchlist: [] });
  const [assignmentMonitoring, setAssignmentMonitoring] = useState([]);
  const [feeRecords, setFeeRecords] = useState([]);

  // Filter states
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Form visibility
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Reset Password Modal State
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Excel Bulk Import Modal State
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelParsedData, setExcelParsedData] = useState([]);
  const [importingExcel, setImportingExcel] = useState(false);
  const [excelImportErrors, setExcelImportErrors] = useState([]);

  // Fee Record Modal State
  const [showRecordFeeModal, setShowRecordFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({
    studentId: '', title: 'Semester 1 Tuition Fee', amount: '', dueDate: '', status: 'PENDING', remarks: ''
  });

  // Publish Results Modal State
  const [showPublishResultModal, setShowPublishResultModal] = useState(false);
  const [publishResultForm, setPublishResultForm] = useState({
    studentId: '', subjectId: '', examId: '', marks: '', maxMarks: '100', remarks: ''
  });

  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [academicModalType, setAcademicModalType] = useState('department');

  // Form states
  const [userForm, setUserForm] = useState({
    name: '', email: '', password: '', role: 'STUDENT',
    rollNumber: '', phone: '', section: 'A',
    departmentId: '', courseId: '', semesterId: ''
  });
  
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', departmentId: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', credits: 4, courseId: '', semesterId: '', facultyId: '' });
  
  const [timetableForm, setTimetableForm] = useState({
    dayOfWeek: 'Monday', startTime: '09:00', endTime: '09:50', room: '', section: 'A', subjectId: '', semesterId: ''
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '', content: '', category: 'GENERAL', departmentId: ''
  });

  const [examForm, setExamForm] = useState({
    title: '', date: '', time: '10:00 AM', room: '', subjectId: '', semesterId: ''
  });

  // Semesters
  const [semesters, setSemesters] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchAllUsers();
      fetchStudents();
      fetchFaculty();
    } else if (activeTab === 'attendance_reports') {
      fetchAttendanceReports();
    } else if (activeTab === 'assignment_monitoring') {
      fetchAssignmentMonitoring();
    } else if (activeTab === 'exams') {
      fetchExams();
      fetchStudents();
      fetchAcademics();
    } else if (activeTab === 'fees') {
      fetchFeeStatusRecords();
      fetchStudents();
    } else if (activeTab === 'academics') {
      fetchAcademics();
    } else if (activeTab === 'timetable') {
      fetchTimetableSlots();
    }
  }, [activeTab]);

  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/admin/all-users');
      setAllUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBaseData = async () => {
    try {
      const semRes = await api.get('/common/semesters');
      setSemesters(semRes.data);
      const deptRes = await api.get('/common/departments');
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await api.get('/admin/faculty');
      setFaculty(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Password Reset Handler
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPasswordTarget || !newPasswordInput) return;
    try {
      await api.put(`/admin/users/${resetPasswordTarget.id}/reset-password`, { newPassword: newPasswordInput });
      addNotification('Password Reset', `Successfully updated password for ${resetPasswordTarget.name}`, 'success');
      setShowResetPasswordModal(false);
      setResetPasswordTarget(null);
      setNewPasswordInput('');
    } catch (err) {
      addNotification('Error', err.response?.data?.error || 'Failed to reset password', 'error');
    }
  };

  // 2. Toggle Status (Activate / Deactivate) Handler
  const handleToggleUserStatus = async (targetUser) => {
    const actionName = targetUser.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${actionName} account for ${targetUser.name}?`)) return;

    try {
      const res = await api.put(`/admin/users/${targetUser.id}/toggle-status`, { isActive: !targetUser.isActive });
      addNotification('Account Status Updated', res.data.message, 'success');
      fetchAllUsers();
      fetchStudents();
      fetchFaculty();
    } catch (err) {
      addNotification('Error', 'Failed to update account status', 'error');
    }
  };

  // 3. Download Sample Excel Template
  const downloadSampleTemplate = () => {
    const sampleRows = [
      {
        Name: "Vikram Malhotra",
        Email: "vikram.m@college.com",
        Role: "STUDENT",
        Password: "student123",
        RollNumber: "CS202610",
        Phone: "9876500001",
        Section: "A",
        DepartmentCode: "CS",
        CourseCode: "BTECH-CS",
        SemesterNumber: 1
      },
      {
        Name: "Dr. Neha Agarwal",
        Email: "neha.a@college.com",
        Role: "FACULTY",
        Password: "faculty123",
        RollNumber: "",
        Phone: "9876500002",
        Section: "",
        DepartmentCode: "CS",
        CourseCode: "",
        SemesterNumber: ""
      },
      {
        Name: "Sanjay Kumar",
        Email: "sanjay.k@college.com",
        Role: "CO_ADMIN",
        Password: "coadmin123",
        RollNumber: "",
        Phone: "9876500003",
        Section: "",
        DepartmentCode: "",
        CourseCode: "",
        SemesterNumber: ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CMS_Users");
    XLSX.writeFile(workbook, "CMS_Users_Import_Template.xlsx");
    addNotification('Template Downloaded', 'Sample Excel template downloaded successfully', 'info');
  };

  // 4. Excel File Parser
  const handleExcelFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExcelImportErrors([]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          addNotification('Error', 'Uploaded file contains no rows', 'error');
          return;
        }

        const normalized = rawData.map((row) => ({
          name: row.Name || row.name || '',
          email: row.Email || row.email || '',
          role: (row.Role || row.role || 'STUDENT').toUpperCase(),
          password: row.Password || row.password || 'college123',
          rollNumber: row.RollNumber || row.rollNumber || '',
          phone: String(row.Phone || row.phone || ''),
          section: row.Section || row.section || 'A',
          departmentCode: row.DepartmentCode || row.departmentCode || 'CS',
          courseCode: row.CourseCode || row.courseCode || 'BTECH-CS',
          semesterNumber: row.SemesterNumber || row.semesterNumber || 1
        }));

        setExcelParsedData(normalized);
        addNotification('Excel File Parsed', `Found ${normalized.length} user records ready for bulk import.`, 'success');
      } catch (err) {
        console.error(err);
        addNotification('Parsing Error', 'Failed to parse file. Please ensure valid Excel format.', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  // 5. Execute Bulk Excel Import
  const executeBulkImport = async () => {
    if (excelParsedData.length === 0) return;
    setImportingExcel(true);
    setExcelImportErrors([]);

    try {
      const res = await api.post('/admin/users/bulk-import', { users: excelParsedData });
      addNotification('Bulk Import Success', res.data.message, 'success');
      if (res.data.errors && res.data.errors.length > 0) {
        setExcelImportErrors(res.data.errors);
      } else {
        setShowExcelModal(false);
        setExcelParsedData([]);
      }
      fetchAllUsers();
      fetchStudents();
      fetchFaculty();
      fetchStats();
    } catch (err) {
      addNotification('Bulk Import Failed', err.response?.data?.error || 'Import error', 'error');
    } finally {
      setImportingExcel(false);
    }
  };

  // 6. Attendance Reports Fetcher
  const fetchAttendanceReports = async () => {
    try {
      const res = await api.get('/admin/reports/attendance');
      setAttendanceReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Assignment Monitoring Fetcher
  const fetchAssignmentMonitoring = async () => {
    try {
      const res = await api.get('/admin/assignments/monitoring');
      setAssignmentMonitoring(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 8. Exams Fetcher
  const fetchExams = async () => {
    try {
      const res = await api.get('/common/exams');
      setExams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 9. Fee Status Fetcher & Handlers
  const fetchFeeStatusRecords = async () => {
    try {
      const res = await api.get('/admin/fee-status');
      setFeeRecords(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordFeeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/fee-status', feeForm);
      addNotification('Fee Recorded', 'Student fee status updated successfully', 'success');
      setShowRecordFeeModal(false);
      setFeeForm({ studentId: '', title: 'Semester 1 Tuition Fee', amount: '', dueDate: '', status: 'PENDING', remarks: '' });
      fetchFeeStatusRecords();
    } catch (err) {
      addNotification('Error', err.response?.data?.error || 'Failed to record fee status', 'error');
    }
  };

  // 10. Publish Exam Results Handler
  const handlePublishResultsSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/publish-results', { results: [publishResultForm] });
      addNotification('Result Published', 'Exam result published to student portal', 'success');
      setShowPublishResultModal(false);
      setPublishResultForm({ studentId: '', subjectId: '', examId: '', marks: '', maxMarks: '100', remarks: '' });
    } catch (err) {
      addNotification('Error', err.response?.data?.error || 'Failed to publish exam result', 'error');
    }
  };

  const fetchAcademics = async () => {
    try {
      const d = await api.get('/common/departments');
      const c = await api.get('/common/courses');
      const s = await api.get('/common/subjects');
      setDepartments(d.data);
      setCourses(c.data);
      setSubjects(s.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetableSlots = async () => {
    try {
      const res = await api.get('/common/timetables');
      setTimetables(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // User CRUD handlers
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        if (editingUser.role === 'STUDENT') {
          await api.put(`/admin/students/${editingUser.id}`, {
            name: userForm.name,
            email: userForm.email,
            rollNumber: userForm.rollNumber,
            phone: userForm.phone,
            section: userForm.section,
            departmentId: userForm.departmentId,
            courseId: userForm.courseId,
            semesterId: userForm.semesterId
          });
        } else {
          await api.put(`/admin/faculty/${editingUser.id}`, {
            name: userForm.name,
            email: userForm.email,
            phone: userForm.phone,
            departmentId: userForm.departmentId
          });
        }
        addNotification('Success', 'User profile updated successfully', 'success');
      } else {
        if (userForm.role === 'STUDENT') {
          await api.post('/admin/students', userForm);
        } else {
          await api.post('/admin/faculty', {
            name: userForm.name,
            email: userForm.email,
            password: userForm.password,
            phone: userForm.phone,
            departmentId: userForm.departmentId
          });
        }
        addNotification('Success', 'New user registered successfully', 'success');
      }
      setShowAddUserModal(false);
      setEditingUser(null);
      resetUserForm();
      fetchStudents();
      fetchFaculty();
      fetchStats();
    } catch (err) {
      addNotification('Error', err.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const startEditUser = (user, role) => {
    setEditingUser({ ...user, role });
    setUserForm({
      name: role === 'STUDENT' ? user.user.name : user.user.name,
      email: role === 'STUDENT' ? user.user.email : user.user.email,
      password: '', // blank on edit
      role: role,
      rollNumber: user.rollNumber || '',
      phone: user.phone || '',
      section: user.section || 'A',
      departmentId: user.departmentId || '',
      courseId: user.courseId || '',
      semesterId: user.semesterId || ''
    });
    setShowAddUserModal(true);
  };

  const deleteUser = async (id, role) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    try {
      if (role === 'STUDENT') {
        await api.delete(`/admin/students/${id}`);
      } else {
        await api.delete(`/admin/faculty/${id}`);
      }
      addNotification('Success', 'User deleted successfully', 'success');
      fetchStudents();
      fetchFaculty();
      fetchStats();
    } catch (err) {
      addNotification('Error', 'Failed to delete user', 'error');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      name: '', email: '', password: '', role: 'STUDENT',
      rollNumber: '', phone: '', section: 'A',
      departmentId: '', courseId: '', semesterId: ''
    });
  };

  // Academics Form Handlers
  const handleAcademicSubmit = async (e) => {
    e.preventDefault();
    try {
      if (academicModalType === 'department') {
        await api.post('/admin/departments', deptForm);
        addNotification('Success', 'Department created successfully', 'success');
        setDeptForm({ name: '', code: '' });
      } else if (academicModalType === 'course') {
        await api.post('/admin/courses', courseForm);
        addNotification('Success', 'Course created successfully', 'success');
        setCourseForm({ name: '', code: '', departmentId: '' });
      } else if (academicModalType === 'subject') {
        await api.post('/admin/subjects', subjectForm);
        addNotification('Success', 'Subject created successfully', 'success');
        setSubjectForm({ name: '', code: '', credits: 4, courseId: '', semesterId: '', facultyId: '' });
      }
      setShowAcademicModal(false);
      fetchAcademics();
      fetchStats();
    } catch (err) {
      addNotification('Error', err.response?.data?.error || 'Failed to create academic entity', 'error');
    }
  };

  // Timetable scheduling
  const handleTimetableSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/timetables', timetableForm);
      addNotification('Success', 'Timetable slot created successfully', 'success');
      setTimetableForm({
        dayOfWeek: 'Monday', startTime: '09:00', endTime: '09:50', room: '', section: 'A', subjectId: '', semesterId: ''
      });
      fetchTimetableSlots();
    } catch (err) {
      addNotification('Conflict/Error', err.response?.data?.error || 'Failed to schedule class', 'error');
    }
  };

  const deleteTimetableSlot = async (id) => {
    if (!confirm('Remove this schedule slot?')) return;
    try {
      await api.delete(`/admin/timetables/${id}`);
      addNotification('Success', 'Schedule slot removed', 'success');
      fetchTimetableSlots();
    } catch (err) {
      addNotification('Error', 'Failed to remove schedule slot', 'error');
    }
  };

  // Announcements
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/announcements', announcementForm);
      addNotification('Success', 'Notice board updated and notification broadcasted', 'success');
      setAnnouncementForm({ title: '', content: '', category: 'GENERAL', departmentId: '' });
    } catch (err) {
      addNotification('Error', 'Announcement publish failed', 'error');
    }
  };

  // Exams
  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/exams', examForm);
      addNotification('Success', 'Exam schedule created and notified', 'success');
      setExamForm({ title: '', date: '', time: '10:00 AM', room: '', subjectId: '', semesterId: '' });
    } catch (err) {
      addNotification('Error', 'Exam scheduling failed', 'error');
    }
  };

  // Local drop filter lists
  const filteredUsers = (userRoleFilter === 'STUDENT' ? students : faculty).filter(item => {
    const name = item.user?.name || '';
    const email = item.user?.email || '';
    const roll = item.rollNumber || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           roll.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const adminNavTabs = [
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'attendance_reports', label: 'Attendance Reports', icon: BarChart2 },
    { id: 'assignment_monitoring', label: 'Assignment Monitor', icon: FileText },
    { id: 'exams', label: 'Exam Management', icon: Book },
    { id: 'fees', label: 'Fee Status', icon: CreditCard },
    { id: 'academics', label: 'Academics Config', icon: BookOpen },
    { id: 'timetable', label: 'Timetable Builder', icon: Calendar },
    { id: 'notices', label: 'Notices', icon: Bell }
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
          <span>Admin Modules Navigation</span>
        </button>
        <span className="text-xs font-bold text-brand-600 font-mono">
          {adminNavTabs.find(t => t.id === activeTab)?.label}
        </span>
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
                <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider font-heading">Admin Modules</span>
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
            {adminNavTabs.map((tab) => {
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
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 w-full space-y-6 min-w-0">
      {/* Co-Admin status header banner */}
      {user?.role === 'CO_ADMIN' && (
        <div className="bg-purple-900 text-white rounded-2xl p-5 shadow-lg flex items-center justify-between border border-purple-700/50">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-500/20 text-purple-300 p-3 rounded-xl border border-purple-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold font-heading">Co-Administrator Operations Portal</h2>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">CO-ADMIN RIGHTS</span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">Welcome, <span className="font-semibold text-white">{user.name}</span> ({user.email}). You have full access to manage students, faculty, timetables, notice boards, and exam schedules.</p>
            </div>
          </div>
        </div>
      )}

      {/* Top dashboard summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4 glow-border transition-all">
          <div className="bg-indigo-50 text-indigo-600 rounded-xl p-3">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Students</div>
            <div className="text-2xl font-bold font-heading text-slate-800">{stats.students}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4 glow-border transition-all">
          <div className="bg-emerald-50 text-emerald-600 rounded-xl p-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Faculty</div>
            <div className="text-2xl font-bold font-heading text-slate-800">{stats.faculty}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4 glow-border transition-all">
          <div className="bg-amber-50 text-amber-600 rounded-xl p-3">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Departments</div>
            <div className="text-2xl font-bold font-heading text-slate-800">{stats.departments}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4 glow-border transition-all">
          <div className="bg-sky-50 text-sky-600 rounded-xl p-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Courses</div>
            <div className="text-2xl font-bold font-heading text-slate-800">{stats.courses}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4 col-span-2 lg:col-span-1 glow-border transition-all">
          <div className="bg-pink-50 text-pink-600 rounded-xl p-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Attendance</div>
            <div className="text-2xl font-bold font-heading text-slate-800">{stats.attendanceRate}%</div>
          </div>
        </div>
      </div>



      {/* Tab Panels */}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800">User Management Directory</h2>
              <p className="text-xs text-slate-500">Manage all accounts, reset passwords, toggle active status, and bulk import users.</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => { setShowExcelModal(true); setExcelParsedData([]); setExcelImportErrors([]); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import via Excel</span>
              </button>
              
              <button 
                onClick={() => { resetUserForm(); setEditingUser(null); setShowAddUserModal(true); }}
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Register User</span>
              </button>
            </div>
          </div>

          {/* Role Filter & Search Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50 overflow-x-auto text-xs font-semibold">
              {[
                { id: 'ALL', label: `All Users (${allUsers.length})` },
                { id: 'STUDENT', label: `Students (${students.length})` },
                { id: 'FACULTY', label: `Faculty (${faculty.length})` },
                { id: 'CO_ADMIN', label: `Co-Admins (${allUsers.filter(u => u.role === 'CO_ADMIN').length})` },
                { id: 'ADMIN', label: `Admins (${allUsers.filter(u => u.role === 'ADMIN').length})` },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setUserRoleFilter(rf.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    userRoleFilter === rf.id ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name, email, or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Unified User Directory Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Academic Context</th>
                  <th className="p-4 text-center">Account Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {allUsers
                  .filter(u => {
                    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
                    const q = searchQuery.toLowerCase();
                    const nameMatch = (u.name || '').toLowerCase().includes(q);
                    const emailMatch = (u.email || '').toLowerCase().includes(q);
                    const rollMatch = u.student?.rollNumber ? u.student.rollNumber.toLowerCase().includes(q) : false;
                    return nameMatch || emailMatch || rollMatch;
                  })
                  .map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{usr.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{usr.id.substring(0, 8)}...</div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono uppercase font-bold border ${
                          usr.role === 'ADMIN'
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                            : usr.role === 'CO_ADMIN'
                              ? 'bg-purple-50 text-purple-600 border-purple-200'
                              : usr.role === 'FACULTY'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        <div className="font-semibold text-slate-700">{usr.email}</div>
                        <div className="text-slate-400">{usr.student?.phone || usr.faculty?.phone || 'No phone'}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        {usr.role === 'STUDENT' && usr.student ? (
                          <div>
                            <span className="font-bold font-mono text-slate-800">{usr.student.rollNumber}</span>
                            <div className="text-slate-400">{usr.student.department?.code} - {usr.student.semester?.name} (Sec {usr.student.section})</div>
                          </div>
                        ) : usr.role === 'FACULTY' && usr.faculty ? (
                          <div>
                            <span className="font-bold text-slate-700">{usr.faculty.department?.name}</span>
                            <div className="text-slate-400">Dept Code: {usr.faculty.department?.code}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">System Administrator</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          usr.isActive !== false
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${usr.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{usr.isActive !== false ? 'Active' : 'Deactivated'}</span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Reset Password Button */}
                          <button
                            onClick={() => { setResetPasswordTarget(usr); setNewPasswordInput(''); setShowResetPasswordModal(true); }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Toggle Active Status Button */}
                          <button
                            onClick={() => handleToggleUserStatus(usr)}
                            className={`p-1.5 rounded-lg transition-all ${
                              usr.isActive !== false
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={usr.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => {
                              if (usr.role === 'STUDENT' && usr.student) {
                                deleteUser(usr.student.id, 'STUDENT');
                              } else if (usr.role === 'FACULTY' && usr.faculty) {
                                deleteUser(usr.faculty.id, 'FACULTY');
                              } else {
                                addNotification('Notice', 'Admin accounts cannot be deleted directly here.', 'info');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Attendance Reports */}
      {activeTab === 'attendance_reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800">Attendance Analytics & Reports</h2>
              <p className="text-xs text-slate-500">Monitor overall college attendance, subject attendance rates, and low attendance alerts (&lt;75%).</p>
            </div>

            <button
              onClick={() => {
                const rows = attendanceReport.studentsReport.map(r => ({
                  RollNumber: r.rollNumber,
                  Name: r.name,
                  Department: r.department,
                  Semester: r.semester,
                  Present: r.presentClasses,
                  Total: r.totalClasses,
                  Percentage: `${r.percentage}%`,
                }));
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Report');
                XLSX.writeFile(wb, 'College_Attendance_Report.xlsx');
                addNotification('Exported', 'Attendance report exported as Excel sheet', 'success');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all max-w-max"
            >
              <Download className="w-4 h-4" />
              <span>Export Report (Excel)</span>
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center space-x-3">
              <div className="bg-indigo-600 text-white p-3 rounded-xl">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Overall College Attendance</div>
                <div className="text-2xl font-bold text-indigo-950 font-heading">{attendanceReport.overallAttendance}%</div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center space-x-3">
              <div className="bg-amber-600 text-white p-3 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Total Tracked Students</div>
                <div className="text-2xl font-bold text-amber-950 font-heading">{attendanceReport.studentsReport?.length || 0}</div>
              </div>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3">
              <div className="bg-rose-600 text-white p-3 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-900 uppercase tracking-wider">Low Attendance Watchlist (&lt;75%)</div>
                <div className="text-2xl font-bold text-rose-950 font-heading">{attendanceReport.lowAttendanceWatchlist?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Low Attendance Watchlist Banner */}
          {attendanceReport.lowAttendanceWatchlist && attendanceReport.lowAttendanceWatchlist.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Low Attendance Warning Alert (&lt;75%)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {attendanceReport.lowAttendanceWatchlist.map((st) => (
                  <div key={st.studentId} className="bg-white p-2.5 rounded-xl border border-rose-200 text-xs flex justify-between items-center shadow-sm">
                    <div>
                      <div className="font-bold text-slate-800">{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{st.rollNumber} &bull; {st.department}</div>
                    </div>
                    <span className="font-extrabold text-rose-600 bg-rose-100 px-2 py-0.5 rounded font-mono">{st.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Student Attendance Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Student</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Department / Sem</th>
                  <th className="p-4">Attended / Total</th>
                  <th className="p-4">Percentage</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceReport.studentsReport && attendanceReport.studentsReport.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{st.name}</td>
                    <td className="p-4 font-mono text-slate-600">{st.rollNumber}</td>
                    <td className="p-4 text-slate-600">{st.department} - {st.semester}</td>
                    <td className="p-4 text-slate-700 font-semibold">{st.presentClasses} / {st.totalClasses} classes</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3 max-w-xs">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              st.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${st.percentage}%` }}
                          />
                        </div>
                        <span className="font-extrabold font-mono text-xs text-slate-800">{st.percentage}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        st.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {st.percentage >= 75 ? 'Eligible' : 'Warning'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Assignment Monitoring */}
      {activeTab === 'assignment_monitoring' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800">Centralized Assignment Monitoring</h2>
              <p className="text-xs text-slate-500">Track assignment creation, submission progress across departments, and faculty grading completion.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-center space-x-3">
              <div className="bg-sky-600 text-white p-3 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-sky-900 uppercase tracking-wider">Total Active Assignments</div>
                <div className="text-2xl font-bold text-sky-950 font-heading">{assignmentMonitoring.length}</div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-3">
              <div className="bg-emerald-600 text-white p-3 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">Total Submissions Received</div>
                <div className="text-2xl font-bold text-emerald-950 font-heading">
                  {assignmentMonitoring.reduce((acc, a) => acc + a.submissionCount, 0)}
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center space-x-3">
              <div className="bg-amber-600 text-white p-3 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Pending Faculty Grading</div>
                <div className="text-2xl font-bold text-amber-950 font-heading">
                  {assignmentMonitoring.reduce((acc, a) => acc + a.pendingCount, 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Assignment Title</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Faculty Author</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Submissions Received</th>
                  <th className="p-4 text-center">Graded Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignmentMonitoring.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No active assignments monitored</td>
                  </tr>
                ) : (
                  assignmentMonitoring.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{asg.title}</div>
                        <div className="text-xs text-slate-400 truncate max-w-xs">{asg.description}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-700">{asg.subjectName}</span>
                        <div className="text-xs font-mono text-slate-400">{asg.subjectCode}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{asg.facultyName}</td>
                      <td className="p-4 font-mono text-xs text-slate-600">{asg.deadline}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{asg.submissionCount} submissions</div>
                        <div className="text-xs text-slate-400">Rate: {asg.submissionRate}%</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          asg.pendingCount === 0 && asg.submissionCount > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {asg.gradedCount} Graded / {asg.pendingCount} Pending
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Fee Status */}
      {activeTab === 'fees' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800">Fee Status & Revenue Management</h2>
              <p className="text-xs text-slate-500">Record tuition fee demands, track payment receipts, and manage overdue alerts.</p>
            </div>

            <button
              onClick={() => setShowRecordFeeModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all max-w-max"
            >
              <Plus className="w-4 h-4" />
              <span>Record Fee Demand / Payment</span>
            </button>
          </div>

          {/* Fee Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-3">
              <div className="bg-emerald-600 text-white p-3 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">Total Fees Collected</div>
                <div className="text-2xl font-bold text-emerald-950 font-heading">
                  ₹{feeRecords.filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center space-x-3">
              <div className="bg-amber-600 text-white p-3 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Pending Tuition Fees</div>
                <div className="text-2xl font-bold text-amber-950 font-heading">
                  ₹{feeRecords.filter(f => f.status === 'PENDING').reduce((acc, f) => acc + f.amount, 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3">
              <div className="bg-rose-600 text-white p-3 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-900 uppercase tracking-wider">Overdue Fees</div>
                <div className="text-2xl font-bold text-rose-950 font-heading">
                  ₹{feeRecords.filter(f => f.status === 'OVERDUE').reduce((acc, f) => acc + f.amount, 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Fee Records Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Student</th>
                  <th className="p-4">Fee Title</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Transaction / Date</th>
                  <th className="p-4 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No fee records found</td>
                  </tr>
                ) : (
                  feeRecords.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{fee.student?.user?.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{fee.student?.rollNumber} &bull; {fee.student?.department?.code}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{fee.title}</td>
                      <td className="p-4 font-bold text-slate-900 font-mono">₹{fee.amount.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-xs font-mono text-slate-600">{fee.dueDate}</td>
                      <td className="p-4 text-xs text-slate-500">
                        {fee.paymentDate ? (
                          <div>
                            <div className="font-mono text-slate-700">{fee.paymentDate}</div>
                            <div className="text-[10px] font-mono text-slate-400">{fee.transactionId}</div>
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Unpaid</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase font-mono ${
                          fee.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : fee.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Academics Config */}
      {activeTab === 'academics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {/* Departments list */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-slate-800">Departments</h3>
              <button 
                onClick={() => { setAcademicModalType('department'); setShowAcademicModal(true); }}
                className="p-1 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {departments.map((dept) => (
                <div key={dept.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-700">{dept.name}</div>
                    <div className="text-xs font-mono text-slate-400">{dept.code}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Courses list */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-slate-800">Courses</h3>
              <button 
                onClick={() => { setAcademicModalType('course'); setShowAcademicModal(true); }}
                className="p-1 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {courses.map((course) => (
                <div key={course.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-700">{course.name}</div>
                    <div className="text-xs text-slate-400">{course.code} • {course.department?.code}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects list */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-slate-800">Subjects</h3>
              <button 
                onClick={() => { setAcademicModalType('subject'); setShowAcademicModal(true); }}
                className="p-1 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {subjects.map((sub) => (
                <div key={sub.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-700">{sub.name}</div>
                    <div className="text-xs text-slate-400">
                      Code: {sub.code} • Credits: {sub.credits} • {sub.semester?.name}
                    </div>
                    {sub.faculty && (
                      <div className="text-xs text-indigo-500 font-semibold mt-1">
                        Assigned: {sub.faculty.user?.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Timetable Builder */}
      {activeTab === 'timetable' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {/* Scheduling Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
            <h3 className="text-lg font-bold font-heading text-slate-800">Schedule Lecture Slot</h3>
            <form onSubmit={handleTimetableSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Semester</label>
                <select
                  required
                  value={timetableForm.semesterId}
                  onChange={(e) => setTimetableForm({ ...timetableForm, semesterId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                <select
                  required
                  value={timetableForm.subjectId}
                  onChange={(e) => setTimetableForm({ ...timetableForm, subjectId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A"
                    value={timetableForm.section}
                    onChange={(e) => setTimetableForm({ ...timetableForm, section: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Classroom</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 101"
                    value={timetableForm.room}
                    onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Day of Week</label>
                <select
                  value={timetableForm.dayOfWeek}
                  onChange={(e) => setTimetableForm({ ...timetableForm, dayOfWeek: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={timetableForm.startTime}
                    onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={timetableForm.endTime}
                    onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Schedule Slot</span>
              </button>
            </form>
          </div>

          {/* Timetable schedule grid view */}
          <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
            <h3 className="text-lg font-bold font-heading text-slate-800 text-left">Master Schedule List</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3">Day</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Semester/Sec</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Faculty</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timetables.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No scheduled classes yet
                      </td>
                    </tr>
                  ) : (
                    timetables.map((slot) => (
                      <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-700">{slot.dayOfWeek}</td>
                        <td className="p-3 font-mono text-slate-600">{slot.startTime} - {slot.endTime}</td>
                        <td className="p-3 font-semibold text-indigo-600">{slot.subject?.name} <span className="text-xs text-slate-400 font-normal">({slot.subject?.code})</span></td>
                        <td className="p-3 text-slate-500">{slot.semester?.name} (Sec {slot.section})</td>
                        <td className="p-3 text-slate-600">{slot.room}</td>
                        <td className="p-3 text-slate-500">{slot.subject?.faculty?.user?.name || 'Unassigned'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => deleteTimetableSlot(slot.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Notices / Announcements */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
            <h3 className="text-lg font-bold font-heading text-slate-800">Publish Notice</h3>
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                <select
                  value={announcementForm.category}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="GENERAL">GENERAL (All)</option>
                  <option value="DEPARTMENT">DEPARTMENT SPECIFIC</option>
                </select>
              </div>

              {announcementForm.category === 'DEPARTMENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Department</label>
                  <select
                    required
                    value={announcementForm.departmentId}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, departmentId: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="Enter notice title"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Content Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type notice details here..."
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <Bell className="w-4 h-4" />
                <span>Broadcast Notice</span>
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between transition-colors">
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-heading text-slate-800 text-left">Broadcast Scope</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                When you post announcements, the system pushes notifications in real time to the dashboard of targeted students and faculty.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3 p-3 bg-indigo-50/50 rounded-xl text-indigo-900 border border-indigo-100">
                  <Bell className="w-5 h-5 mt-0.5 text-indigo-600 flex-shrink-0" />
                  <div className="text-xs">
                    <strong className="block mb-0.5">GENERAL NOTICES</strong>
                    Visible to all registered students and teachers immediately on dashboard.
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-emerald-50/50 rounded-xl text-emerald-900 border border-emerald-100">
                  <Building2 className="w-5 h-5 mt-0.5 text-emerald-600 flex-shrink-0" />
                  <div className="text-xs">
                    <strong className="block mb-0.5">DEPARTMENT NOTICES</strong>
                    Filtered in database to match departmentId matching students and faculty.
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 mt-6 text-center text-xs text-slate-400">
              Notice board entries populate the homepage notifications widget.
            </div>
          </div>
        </div>
      )}

      {/* Tab: Exams Config */}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
            <h3 className="text-lg font-bold font-heading text-slate-800">Schedule Examination</h3>
            <form onSubmit={handleExamSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Examination 2026"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Semester</label>
                  <select
                    required
                    value={examForm.semesterId}
                    onChange={(e) => setExamForm({ ...examForm, semesterId: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                  <select
                    required
                    value={examForm.subjectId}
                    onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={examForm.date}
                    onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={examForm.time}
                    onChange={(e) => setExamForm({ ...examForm, time: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Exam Venue</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Hall 3, Block B"
                  value={examForm.room}
                  onChange={(e) => setExamForm({ ...examForm, room: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Schedule Exam</span>
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
            <h3 className="text-lg font-bold font-heading text-slate-800 text-left">Exam Dashboard Notifications</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Upon scheduling, exams automatically reflect in targeted student portals. Here are the core notifications linked with scheduling:
            </p>
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100 text-xs">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Notification Alert Dispatch</span>
                <span className="text-brand-600">Active</span>
              </div>
              <p className="text-slate-400">
                "New Exam scheduled: Midterm Examination for Basic Electrical Engineering on 2026-07-11 at 10:00 AM."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: REGISTER USER --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4 relative animate-fade-in-up transition-colors">
            <h3 className="text-lg font-bold font-heading text-slate-800">
              {editingUser ? 'Modify User Profile' : 'Register New User Account'}
            </h3>
            
            <form onSubmit={handleUserSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Default Password</label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">User Account Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="FACULTY">FACULTY</option>
                  </select>
                </div>
              )}

              {/* Department Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Department Scope</label>
                <select
                  required
                  value={userForm.departmentId}
                  onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Student specific fields */}
              {userForm.role === 'STUDENT' && (
                <div className="space-y-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Roll Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CS202615"
                        value={userForm.rollNumber}
                        onChange={(e) => setUserForm({ ...userForm, rollNumber: e.target.value.toUpperCase() })}
                        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Contact</label>
                      <input
                        type="text"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Course Assignment</label>
                      <select
                        required
                        value={userForm.courseId}
                        onChange={(e) => setUserForm({ ...userForm, courseId: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Select Course</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Section</label>
                      <input
                        type="text"
                        required
                        value={userForm.section}
                        onChange={(e) => setUserForm({ ...userForm, section: e.target.value.toUpperCase() })}
                        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Academic Semester</label>
                    <select
                      required
                      value={userForm.semesterId}
                      onChange={(e) => setUserForm({ ...userForm, semesterId: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Select Semester</option>
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {userForm.role === 'FACULTY' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Contact</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  {editingUser ? 'Save Changes' : 'Register Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: ACADEMICS CONFIG --- */}
      {showAcademicModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4 relative animate-fade-in-up transition-colors">
            <h3 className="text-lg font-bold font-heading text-slate-800 capitalize">
              Add {academicModalType}
            </h3>

            <form onSubmit={handleAcademicSubmit} className="space-y-4 text-sm">
              {academicModalType === 'department' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Department Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Short Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS"
                      value={deptForm.code}
                      onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </>
              )}

              {academicModalType === 'course' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Course Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Tech Computer Science"
                      value={courseForm.name}
                      onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Course Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BTECH-CS"
                        value={courseForm.code}
                        onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
                      <select
                        required
                        value={courseForm.departmentId}
                        onChange={(e) => setCourseForm({ ...courseForm, departmentId: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Select Dept</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {academicModalType === 'subject' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Database Systems"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CS202"
                        value={subjectForm.code}
                        onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Credits</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={6}
                        value={subjectForm.credits}
                        onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Course</label>
                      <select
                        required
                        value={subjectForm.courseId}
                        onChange={(e) => setSubjectForm({ ...subjectForm, courseId: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Select Course</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Semester</label>
                      <select
                        required
                        value={subjectForm.semesterId}
                        onChange={(e) => setSubjectForm({ ...subjectForm, semesterId: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Select Sem</option>
                        {semesters.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Assign Faculty</label>
                    <select
                      value={subjectForm.facultyId}
                      onChange={(e) => setSubjectForm({ ...subjectForm, facultyId: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Unassigned</option>
                      {faculty.map((f) => (
                        <option key={f.id} value={f.id}>{f.user?.name} ({f.department?.code})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAcademicModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: RESET PASSWORD --- */}
      {showResetPasswordModal && resetPasswordTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4 relative animate-fade-in-up transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="bg-amber-50 text-amber-600 p-2 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-800">Reset User Password</h3>
                  <p className="text-xs text-slate-500">{resetPasswordTarget.name} ({resetPasswordTarget.email})</p>
                </div>
              </div>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">New Secret Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (e.g. college2026)"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600">
                <span>Quick Preset:</span>
                <button
                  type="button"
                  onClick={() => setNewPasswordInput('college123')}
                  className="text-brand-600 font-bold hover:underline font-mono"
                >
                  Set 'college123'
                </button>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm flex items-center space-x-1.5"
                >
                  <Key className="w-4 h-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: EXCEL / CSV BULK IMPORT --- */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-2xl w-full p-6 space-y-4 relative animate-fade-in-up max-h-[90vh] flex flex-col transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-800">Bulk Import Users via Excel / CSV</h3>
                  <p className="text-xs text-slate-500">Upload a structured spreadsheet to batch register Students, Faculty & Co-Admins.</p>
                </div>
              </div>
              <button
                onClick={() => setShowExcelModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Template Download Option */}
              <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-emerald-900">Need the correct column structure?</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">Download our pre-formatted Excel template with sample data rows.</div>
                </div>
                <button
                  onClick={downloadSampleTemplate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg flex items-center space-x-1.5 transition-all flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 p-6 rounded-2xl text-center bg-slate-50/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <label className="cursor-pointer">
                  <span className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl inline-block shadow-sm">
                    Select Excel / CSV File
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">Supports .xlsx, .xls, and .csv formats</p>
              </div>

              {/* Error messages if any */}
              {excelImportErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Import Issues Detected:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 max-h-24 overflow-y-auto">
                    {excelImportErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Data Preview Table */}
              {excelParsedData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Parsed Preview ({excelParsedData.length} rows):</span>
                    <span className="text-slate-400">Review column mappings before uploading</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-48">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2 border-b border-slate-200">#</th>
                          <th className="p-2 border-b border-slate-200">Name</th>
                          <th className="p-2 border-b border-slate-200">Email</th>
                          <th className="p-2 border-b border-slate-200">Role</th>
                          <th className="p-2 border-b border-slate-200">Roll/Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {excelParsedData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-semibold text-slate-800">{row.name}</td>
                            <td className="p-2 text-slate-600 font-mono">{row.email}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono uppercase font-bold">{row.role}</span>
                            </td>
                            <td className="p-2 text-slate-500 font-mono">{row.rollNumber || row.phone || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowExcelModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={excelParsedData.length === 0 || importingExcel}
                onClick={executeBulkImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-sm flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importingExcel ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Import {excelParsedData.length} Accounts</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: RECORD FEE PAYMENT / DEMAND --- */}
      {showRecordFeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full p-6 space-y-4 relative animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-800">Record Fee Demand / Payment</h3>
                  <p className="text-xs text-slate-500">Record tuition or lab fee status for a student.</p>
                </div>
              </div>
              <button
                onClick={() => setShowRecordFeeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordFeeSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Student</label>
                <select
                  required
                  value={feeForm.studentId}
                  onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Student</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.user?.name} ({st.rollNumber} - {st.department?.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Fee Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Semester 1 Tuition Fee"
                  value={feeForm.title}
                  onChange={(e) => setFeeForm({ ...feeForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="45000"
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={feeForm.dueDate}
                    onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Status</label>
                  <select
                    value={feeForm.status}
                    onChange={(e) => setFeeForm({ ...feeForm, status: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Online Transfer"
                    value={feeForm.remarks}
                    onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordFeeModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-sm flex items-center space-x-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Save Fee Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: PUBLISH EXAM RESULT --- */}
      {showPublishResultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full p-6 space-y-4 relative animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                  <Book className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-800">Publish Exam Result</h3>
                  <p className="text-xs text-slate-500">Publish student score with automatic letter grade calculation.</p>
                </div>
              </div>
              <button
                onClick={() => setShowPublishResultModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishResultsSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Student</label>
                <select
                  required
                  value={publishResultForm.studentId}
                  onChange={(e) => setPublishResultForm({ ...publishResultForm, studentId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Student</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.user?.name} ({st.rollNumber} - {st.department?.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Subject</label>
                <select
                  required
                  value={publishResultForm.subjectId}
                  onChange={(e) => setPublishResultForm({ ...publishResultForm, subjectId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Marks Obtained</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    placeholder="e.g. 88"
                    value={publishResultForm.marks}
                    onChange={(e) => setPublishResultForm({ ...publishResultForm, marks: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={publishResultForm.maxMarks}
                    onChange={(e) => setPublishResultForm({ ...publishResultForm, maxMarks: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks / Feedback</label>
                <input
                  type="text"
                  placeholder="e.g. Outstanding performance in midterm"
                  value={publishResultForm.remarks}
                  onChange={(e) => setPublishResultForm({ ...publishResultForm, remarks: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPublishResultModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs shadow-sm flex items-center space-x-1.5"
                >
                  <Book className="w-4 h-4" />
                  <span>Publish Result</span>
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
