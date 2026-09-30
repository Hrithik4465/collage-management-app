import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Calendar, CheckSquare, FileText, Award, AlertCircle, Plus, ChevronRight, Download, Send, Check,
  Users, History, BarChart3, HelpCircle, FileSpreadsheet, Search, Trash2, Eye, AlertTriangle, TrendingUp, CheckCircle, CheckCircle2, Sparkles, Filter, Clock, PanelLeftClose, PanelLeftOpen, Menu
} from 'lucide-react';

export default function FacultyPortal({ facultyProfile, addNotification }) {
  const [activeTab, setActiveTab] = useState('students');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  
  // Timetable
  const [schedule, setSchedule] = useState([]);
  
  // Attendance state
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isAttendanceEditable, setIsAttendanceEditable] = useState(true);

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', deadline: '', subjectId: '', filePath: '' });
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradingForm, setGradingForm] = useState({ grade: '', remarks: '' });

  // Marks upload state
  const [selectedSubjectForMarks, setSelectedSubjectForMarks] = useState('');
  const [studentsForMarks, setStudentsForMarks] = useState([]);
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState('');
  const [marksForm, setMarksForm] = useState({ marks: '', maxMarks: '100', examId: '', remarks: '' });
  const [examsList, setExamsList] = useState([]);

  // --- NEW FEATURE STATES ---
  // 1. Student List
  const [studentListExtended, setStudentListExtended] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

  // 2. Attendance History
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historySubjectFilter, setHistorySubjectFilter] = useState('');
  const [expandedHistoryKey, setExpandedHistoryKey] = useState(null);

  // 3. Performance Analytics
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsSubjectFilter, setAnalyticsSubjectFilter] = useState('');

  // 4. Quiz Creator & Online Tests
  const [quizzesList, setQuizzesList] = useState([]);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    duration: 30,
    totalMarks: 100,
    deadline: '',
    subjectId: '',
    questions: [
      { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', marks: 10 }
    ]
  });
  const [selectedQuizSubmissions, setSelectedQuizSubmissions] = useState(null);
  const [quizSubmissionsList, setQuizSubmissionsList] = useState([]);

  // 5. Gradebook
  const [gradebookSubjectId, setGradebookSubjectId] = useState('');
  const [gradebookSearch, setGradebookSearch] = useState('');
  const [gradebookData, setGradebookData] = useState({ subjects: [], gradebook: [] });

  const autoFillSampleQuiz = () => {
    const defaultSubId = subjects.length > 0 ? subjects[0].id : '';
    setQuizForm({
      title: 'Data Structures & Algorithms Midterm Quiz',
      description: 'Comprehensive online assessment covering Binary Trees, Sorting Algorithms, and Graph Traversals.',
      duration: 20,
      totalMarks: 30,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      subjectId: defaultSubId,
      questions: [
        {
          questionText: 'What is the time complexity of searching in a balanced Binary Search Tree (BST)?',
          optionA: 'O(1)',
          optionB: 'O(log N)',
          optionC: 'O(N)',
          optionD: 'O(N log N)',
          correctOption: 'B',
          marks: 10
        },
        {
          questionText: 'Which data structure follows the LIFO (Last In First Out) principle?',
          optionA: 'Queue',
          optionB: 'Stack',
          optionC: 'Array',
          optionD: 'Priority Queue',
          correctOption: 'B',
          marks: 10
        },
        {
          questionText: 'Which algorithm is guaranteed to produce an optimal MST (Minimum Spanning Tree)?',
          optionA: 'Kruskal\'s Algorithm',
          optionB: 'Breadth-First Search',
          optionC: 'Linear Search',
          optionD: 'Depth-First Search',
          correctOption: 'A',
          marks: 10
        }
      ]
    });
    if (addNotification) addNotification('Quick Preset', 'Sample quiz questions loaded! Click Save & Publish Quiz.', 'info');
  };

  useEffect(() => {
    fetchFacultySubjects();
    fetchFacultySchedule();
  }, []);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudentListExtended();
    } else if (activeTab === 'history') {
      fetchAttendanceHistory();
    } else if (activeTab === 'analytics') {
      fetchPerformanceAnalytics();
    } else if (activeTab === 'quizzes' || activeTab === 'quiz_creator') {
      fetchQuizzes();
    } else if (activeTab === 'gradebook') {
      fetchGradebook();
    } else if (activeTab === 'assignments') {
      fetchAssignments();
    } else if (activeTab === 'marks') {
      fetchExams();
    }
  }, [activeTab, studentSearch, historySubjectFilter, analyticsSubjectFilter, gradebookSubjectId]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchAttendanceStudents();
    }
  }, [selectedSubjectId, attendanceDate]);

  useEffect(() => {
    if (selectedSubjectForMarks) {
      fetchMarksStudents();
    }
  }, [selectedSubjectForMarks]);

  const fetchFacultySubjects = async () => {
    try {
      const res = await api.get('/faculty/my-subjects');
      setSubjects(res.data);
      if (res.data.length > 0) {
        setSelectedSubjectId(res.data[0].id);
        setSelectedSubjectForMarks(res.data[0].id);
        setGradebookSubjectId(res.data[0].id);
        setQuizForm(prev => ({ ...prev, subjectId: res.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFacultySchedule = async () => {
    try {
      const res = await api.get(`/common/timetables?facultyId=${facultyProfile.id}`);
      setSchedule(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await api.get('/common/exams');
      setExamsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Fetch Student List Extended
  const fetchStudentListExtended = async () => {
    try {
      const res = await api.get(`/faculty/student-list-extended?search=${encodeURIComponent(studentSearch)}`);
      setStudentListExtended(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Fetch Attendance History
  const fetchAttendanceHistory = async () => {
    try {
      const res = await api.get(`/faculty/attendance-history?subjectId=${historySubjectFilter}`);
      setAttendanceHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Fetch Performance Analytics
  const fetchPerformanceAnalytics = async () => {
    try {
      const res = await api.get(`/faculty/performance-analytics?subjectId=${analyticsSubjectFilter}`);
      setAnalyticsData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Quizzes
  const fetchQuizzes = async () => {
    try {
      const res = await api.get('/faculty/quizzes');
      setQuizzesList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!quizForm.subjectId || !quizForm.title) {
      addNotification('Warning', 'Please enter quiz title and select subject', 'warning');
      return;
    }
    try {
      await api.post('/faculty/quizzes', quizForm);
      addNotification('Success', 'Online Quiz created and published to students!', 'success');
      setQuizForm({
        title: '',
        description: '',
        duration: 30,
        totalMarks: 100,
        deadline: '',
        subjectId: subjects[0]?.id || '',
        questions: [{ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', marks: 10 }]
      });
      setActiveTab('quizzes');
      fetchQuizzes();
    } catch (err) {
      addNotification('Error', 'Failed to create quiz', 'error');
    }
  };

  const addQuestionField = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', marks: 10 }
      ]
    }));
  };

  const removeQuestionField = (index) => {
    if (quizForm.questions.length <= 1) return;
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const toggleQuizPublish = async (quizId, currentStatus) => {
    try {
      await api.put(`/faculty/quizzes/${quizId}/publish`, { isPublished: !currentStatus });
      addNotification('Success', `Quiz status updated to ${!currentStatus ? 'Published' : 'Draft'}`, 'success');
      fetchQuizzes();
    } catch (err) {
      addNotification('Error', 'Failed to update quiz status', 'error');
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    try {
      await api.delete(`/faculty/quizzes/${quizId}`);
      setQuizzesList(prev => prev.filter(q => q.id !== quizId));
      addNotification('Success', 'Quiz deleted successfully', 'success');
      fetchQuizzes();
    } catch (err) {
      console.error('Delete quiz error:', err);
      addNotification('Error', err.response?.data?.error || 'Failed to delete quiz', 'error');
    }
  };

  const viewQuizSubmissions = async (quiz) => {
    setSelectedQuizSubmissions(quiz);
    try {
      const res = await api.get(`/faculty/quizzes/${quiz.id}/submissions`);
      setQuizSubmissionsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Gradebook
  const fetchGradebook = async () => {
    try {
      const res = await api.get(`/faculty/gradebook?subjectId=${gradebookSubjectId}`);
      setGradebookData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const exportGradebookCSV = () => {
    if (!gradebookData.gradebook || gradebookData.gradebook.length === 0) {
      addNotification('Warning', 'No gradebook data available to export', 'warning');
      return;
    }
    const headers = ['Roll Number', 'Student Name', 'Email', 'Section', 'Exam Score', 'Quiz Score', 'Assignments', 'Overall %', 'Grade', 'GPA'];
    const csvRows = [headers.join(',')];

    gradebookData.gradebook.forEach(row => {
      csvRows.push([
        `"${row.rollNumber}"`,
        `"${row.name}"`,
        `"${row.email}"`,
        `"${row.section}"`,
        `"${row.examScore}"`,
        `"${row.quizScore}"`,
        `"${row.assignmentsCount}"`,
        `"${row.overallPct}%"`,
        `"${row.grade}"`,
        `"${row.gpa}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Gradebook_Subject_${gradebookSubjectId}.csv`);
    a.click();
    addNotification('Success', 'Gradebook CSV exported successfully', 'success');
  };

  // Attendance logic
  const fetchAttendanceStudents = async () => {
    try {
      const studRes = await api.get(`/faculty/subjects/${selectedSubjectId}/students`);
      setStudents(studRes.data);

      const todayStr = new Date().toISOString().split('T')[0];
      setIsAttendanceEditable(attendanceDate === todayStr);

      const recordsRes = await api.get(`/faculty/attendance-records?subjectId=${selectedSubjectId}&date=${attendanceDate}`);
      
      const recordMap = {};
      recordsRes.data.forEach(r => {
        recordMap[r.studentId] = r.status;
      });

      studRes.data.forEach(s => {
        if (!recordMap[s.id]) {
          recordMap[s.id] = 'PRESENT';
        }
      });

      setAttendanceRecords(recordMap);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAttendance = (studentId) => {
    if (!isAttendanceEditable) {
      addNotification('Locked', 'Attendance edits are locked for past dates. Same-day only.', 'warning');
      return;
    }
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const saveAttendance = async () => {
    try {
      const recordsArray = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status
      }));

      await api.post('/faculty/attendance', {
        subjectId: selectedSubjectId,
        date: attendanceDate,
        records: recordsArray
      });

      addNotification('Success', 'Attendance marked successfully', 'success');
    } catch (err) {
      addNotification('Error', err.response?.data?.error || 'Failed to save attendance', 'error');
    }
  };

  // Assignments logic
  const fetchAssignments = async () => {
    try {
      const res = await api.get('/faculty/assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.subjectId) {
      addNotification('Warning', 'Please select a subject', 'warning');
      return;
    }
    try {
      await api.post('/faculty/assignments', newAssignment);
      addNotification('Success', 'Assignment posted successfully', 'success');
      setNewAssignment({ title: '', description: '', deadline: '', subjectId: '', filePath: '' });
      fetchAssignments();
    } catch (err) {
      addNotification('Error', 'Failed to create assignment', 'error');
    }
  };

  const viewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    try {
      const res = await api.get(`/faculty/assignments/${assignment.id}/submissions`);
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const submitGrading = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/faculty/submissions/${gradingSubmission.id}/grade`, gradingForm);
      addNotification('Success', 'Submission graded successfully', 'success');
      setGradingSubmission(null);
      setGradingForm({ grade: '', remarks: '' });
      viewSubmissions(selectedAssignment);
    } catch (err) {
      addNotification('Error', 'Failed to submit grade', 'error');
    }
  };

  // Marks logic
  const fetchMarksStudents = async () => {
    try {
      const res = await api.get(`/faculty/subjects/${selectedSubjectForMarks}/students`);
      setStudentsForMarks(res.data);
      if (res.data.length > 0) {
        setSelectedStudentForMarks(res.data[0].id);
      } else {
        setSelectedStudentForMarks('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadMarks = async (e) => {
    e.preventDefault();
    if (!selectedStudentForMarks) {
      addNotification('Error', 'Please select a student', 'error');
      return;
    }
    try {
      await api.post('/faculty/results', {
        studentId: selectedStudentForMarks,
        subjectId: selectedSubjectForMarks,
        marks: parseFloat(marksForm.marks),
        maxMarks: parseFloat(marksForm.maxMarks),
        examId: marksForm.examId || null,
        remarks: marksForm.remarks
      });
      addNotification('Success', 'Student marks uploaded and notification sent', 'success');
      setMarksForm({ marks: '', maxMarks: '100', examId: '', remarks: '' });
    } catch (err) {
      addNotification('Error', 'Failed to upload marks', 'error');
    }
  };

  const facultyNavTabs = [
    { id: 'students', label: 'Student List', icon: Users },
    { id: 'attendance', label: 'Mark Attendance', icon: CheckSquare },
    { id: 'history', label: 'Attendance History', icon: History },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
    { id: 'quiz_creator', label: 'Quiz Creator', icon: Plus },
    { id: 'quizzes', label: 'Online Tests', icon: HelpCircle },
    { id: 'gradebook', label: 'Gradebook', icon: FileSpreadsheet },
    { id: 'assignments', label: 'Assignments Review', icon: FileText },
    { id: 'marks', label: 'Upload Marks', icon: Award },
    { id: 'schedule', label: 'Teaching Schedule', icon: Calendar }
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
          <span>Faculty Navigation</span>
        </button>
        <span className="text-xs font-bold text-brand-600 font-mono">
          {facultyNavTabs.find(t => t.id === activeTab)?.label}
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
                <Award className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider font-heading">Faculty Desk</span>
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
            {facultyNavTabs.map((tab) => {
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

      {/* --- TAB 1: STUDENT LIST --- */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Enrolled Students Roster</h2>
              <p className="text-slate-400 text-xs text-left mt-0.5">View enrolled student profiles, attendance metrics, and academic risk status</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {[
                  { id: 'ALL', label: `All (${studentListExtended.length})` },
                  { id: 'AT_RISK', label: `⚠️ At Risk (${studentListExtended.filter(s => s.status === 'AT_RISK').length})` },
                  { id: 'HEALTHY', label: `Healthy (${studentListExtended.filter(s => s.status === 'GOOD').length})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStudentStatusFilter(f.id)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      studentStatusFilter === f.id
                        ? 'bg-white text-slate-800 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name or roll no..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 w-56 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-3.5">Roll Number</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Department & Course</th>
                  <th className="p-3.5 text-center">Attendance %</th>
                  <th className="p-3.5 text-center">Average Grade</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {studentListExtended.filter(s => {
                  if (studentStatusFilter === 'AT_RISK') return s.status === 'AT_RISK';
                  if (studentStatusFilter === 'HEALTHY') return s.status === 'GOOD';
                  return true;
                }).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No matching student records found.
                    </td>
                  </tr>
                ) : (
                  studentListExtended.filter(s => {
                    if (studentStatusFilter === 'AT_RISK') return s.status === 'AT_RISK';
                    if (studentStatusFilter === 'HEALTHY') return s.status === 'GOOD';
                    return true;
                  }).map((stud) => (
                    <tr key={stud.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-mono font-semibold text-slate-600">{stud.rollNumber}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{stud.name}</div>
                        <div className="text-slate-400 text-[11px] font-mono">{stud.email}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-700">{stud.department}</div>
                        <div className="text-slate-400 text-[11px]">{stud.course} ({stud.semester})</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          stud.attendancePct >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {stud.attendancePct}% ({stud.presentClasses}/{stud.totalClasses})
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700">
                        {stud.averageMarksPct > 0 ? `${stud.averageMarksPct}%` : 'N/A'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          stud.status === 'AT_RISK' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {stud.status === 'AT_RISK' ? '⚠️ At Risk' : 'Healthy'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedStudentProfile(stud)}
                          className="bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: ATTENDANCE HISTORY --- */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Attendance Register History</h2>
              <p className="text-slate-400 text-xs text-left mt-0.5">Review past attendance logs, date-wise statistics, and student turnout rates</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={historySubjectFilter}
                onChange={(e) => setHistorySubjectFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          {attendanceHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No historical attendance logs recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceHistory.map((item, idx) => {
                const key = `${item.date}_${item.subjectId}`;
                const isExpanded = expandedHistoryKey === key;
                const turnOutPct = item.totalStudents > 0 ? Math.round((item.presentCount / item.totalStudents) * 100) : 0;

                return (
                  <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
                    <div 
                      onClick={() => setExpandedHistoryKey(isExpanded ? null : key)}
                      className="p-4 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm text-left">{item.subjectName} ({item.subjectCode})</div>
                          <div className="text-xs text-slate-400 font-mono text-left">{item.date}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Total Enrolled</span>
                          <span className="font-bold text-slate-700">{item.totalStudents}</span>
                        </div>
                        <div>
                          <span className="text-emerald-600 block text-[10px]">Present</span>
                          <span className="font-bold text-emerald-700">{item.presentCount}</span>
                        </div>
                        <div>
                          <span className="text-rose-600 block text-[10px]">Absent</span>
                          <span className="font-bold text-rose-700">{item.absentCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Turnout Rate</span>
                          <span className={`font-bold ${turnOutPct >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {turnOutPct}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-slate-100 space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 text-left uppercase tracking-wider">Student Log Breakdown</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {item.students.map((st) => (
                            <div key={st.attendanceId} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold text-slate-800 block text-left">{st.studentName}</span>
                                <span className="text-[10px] text-slate-400 font-mono text-left block">{st.rollNumber}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                st.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {st.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: PERFORMANCE ANALYTICS --- */}
      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Academic Performance & Analytics</h2>
              <p className="text-slate-400 text-xs text-left mt-0.5">Real-time statistics, score distribution, top performers, and at-risk student monitoring</p>
            </div>

            <select
              value={analyticsSubjectFilter}
              onChange={(e) => setAnalyticsSubjectFilter(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            >
              <option value="">All Assigned Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {analyticsData && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl">
                  <span className="text-xs font-bold text-indigo-600 block uppercase">Class Average</span>
                  <span className="text-3xl font-extrabold text-indigo-900 mt-1 block">{analyticsData.classAverage}%</span>
                  <span className="text-[11px] text-indigo-500 mt-1 block">Across all graded assessments</span>
                </div>

                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-600 block uppercase">Highest Score</span>
                  <span className="text-3xl font-extrabold text-emerald-900 mt-1 block">{analyticsData.highestMark}%</span>
                  <span className="text-[11px] text-emerald-500 mt-1 block">Top student score in course</span>
                </div>

                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl">
                  <span className="text-xs font-bold text-amber-600 block uppercase">Lowest Score</span>
                  <span className="text-3xl font-extrabold text-amber-900 mt-1 block">{analyticsData.lowestMark}%</span>
                  <span className="text-[11px] text-amber-500 mt-1 block">Minimum mark recorded</span>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl">
                  <span className="text-xs font-bold text-purple-600 block uppercase">Total Graded</span>
                  <span className="text-3xl font-extrabold text-purple-900 mt-1 block">{analyticsData.totalGraded}</span>
                  <span className="text-[11px] text-purple-500 mt-1 block">Total student submissions</span>
                </div>
              </div>

              {/* Grade Distribution & At Risk Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution */}
                <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 text-left font-heading">GPA Grade Distribution</h3>
                  
                  <div className="space-y-2.5">
                    {Object.entries(analyticsData.gradeDistribution).map(([grade, count]) => {
                      const total = analyticsData.totalGraded || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={grade} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>Grade {grade}</span>
                            <span>{count} students ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                grade === 'A+' || grade === 'A' ? 'bg-emerald-500' :
                                grade === 'B' ? 'bg-brand-500' :
                                grade === 'C' ? 'bg-indigo-400' : 'bg-rose-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* At Risk Alert Panel */}
                <div className="p-5 border border-amber-100 rounded-2xl bg-amber-50/30 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <h3 className="text-sm font-bold font-heading text-left">At-Risk Students Watchlist ({analyticsData.atRiskStudents.length})</h3>
                  </div>
                  
                  {analyticsData.atRiskStudents.length === 0 ? (
                    <p className="text-xs text-slate-500 text-left">All enrolled students have satisfactory attendance and marks!</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {analyticsData.atRiskStudents.map((s) => (
                        <div key={s.id} className="p-3 bg-white border border-amber-100 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                          <div>
                            <span className="font-bold text-slate-800 block text-left">{s.name} ({s.rollNumber})</span>
                            <span className="text-[11px] text-amber-700 block text-left mt-0.5">{s.reason}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] block font-mono text-slate-500">Att: {s.attendancePct}%</span>
                            <span className="text-[11px] block font-mono text-slate-500">Marks: {s.marksPct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: QUIZ CREATOR --- */}
      {activeTab === 'quiz_creator' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Online Quiz & Test Builder</h2>
              <p className="text-slate-400 text-xs text-left mt-0.5">Create timed online multiple-choice quizzes and exams for your courses</p>
            </div>
            <button
              type="button"
              onClick={autoFillSampleQuiz}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Auto-fill Sample Quiz</span>
            </button>
          </div>

          <form onSubmit={handleCreateQuiz} className="space-y-6 text-xs text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Target Subject</label>
                <select
                  required
                  value={quizForm.subjectId}
                  onChange={(e) => setQuizForm({ ...quizForm, subjectId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Quiz - Data Structures"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min="5"
                  max="180"
                  value={quizForm.duration}
                  onChange={(e) => setQuizForm({ ...quizForm, duration: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800 font-heading">Multiple-Choice Questions ({quizForm.questions.length})</h3>
                <button
                  type="button"
                  onClick={addQuestionField}
                  className="bg-brand-50 hover:bg-brand-100 text-brand-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              {quizForm.questions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-xs">Question {qIdx + 1}</span>
                    {quizForm.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestionField(qIdx)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Enter question text..."
                    value={q.questionText}
                    onChange={(e) => {
                      const updated = [...quizForm.questions];
                      updated[qIdx].questionText = e.target.value;
                      setQuizForm({ ...quizForm, questions: updated });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <input
                        key={opt}
                        type="text"
                        required
                        placeholder={`Option ${opt}`}
                        value={q[`option${opt}`]}
                        onChange={(e) => {
                          const updated = [...quizForm.questions];
                          updated[qIdx][`option${opt}`] = e.target.value;
                          setQuizForm({ ...quizForm, questions: updated });
                        }}
                        className="p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
                      />
                    ))}
                  </div>

                  <div className="flex items-center space-x-4 pt-1">
                    <div>
                      <span className="font-semibold text-slate-600 mr-2">Correct Option:</span>
                      <select
                        value={q.correctOption}
                        onChange={(e) => {
                          const updated = [...quizForm.questions];
                          updated[qIdx].correctOption = e.target.value;
                          setQuizForm({ ...quizForm, questions: updated });
                        }}
                        className="p-1.5 border border-slate-200 rounded-lg bg-white font-bold text-brand-600"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-brand-100 flex items-center space-x-2 transition-all text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Publish Quiz</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- TAB 5: ONLINE TESTS --- */}
      {activeTab === 'quizzes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Active Online Tests</h2>
              <p className="text-slate-400 text-xs text-left mt-0.5">Manage created tests, view student submissions, and auto-graded results</p>
            </div>
            
            <button
              onClick={() => setActiveTab('quiz_creator')}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Quiz</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzesList.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-slate-400">
                No online tests published yet. Click "Create New Quiz" to add one!
              </div>
            ) : (
              quizzesList.map((quiz) => (
                <div key={quiz.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-3 text-left">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{quiz.title}</h3>
                      <span className="text-xs text-slate-400">{quiz.subject?.name}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      quiz.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {quiz.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-500 font-mono">
                    <span>⏳ {quiz.duration} mins</span>
                    <span>📝 {quiz.questions?.length || 0} Questions</span>
                    <span>👥 {quiz.submissionCount} Submissions</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-xs">
                    <button
                      onClick={() => viewQuizSubmissions(quiz)}
                      className="text-brand-600 font-semibold hover:underline flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Results ({quiz.submissionCount})</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleQuizPublish(quiz.id, quiz.isPublished)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg hover:bg-slate-200/50"
                        title="Toggle Publish"
                      >
                        {quiz.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuiz(quiz.id);
                        }}
                        className="p-1.5 text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 6: GRADEBOOK --- */}
      {activeTab === 'gradebook' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Comprehensive Course Gradebook</h2>
              <p className="text-slate-400 text-xs text-left mt-0.5">Calculated GPA scores, weighted evaluation breakdown, and exportable grade reports</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search gradebook..."
                  value={gradebookSearch}
                  onChange={(e) => setGradebookSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 w-44 font-medium"
                />
              </div>

              <select
                value={gradebookSubjectId}
                onChange={(e) => setGradebookSubjectId(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                ))}
              </select>

              <button
                onClick={exportGradebookCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-3.5">Roll Number</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Section</th>
                  <th className="p-3.5 text-center">Exams Score</th>
                  <th className="p-3.5 text-center">Quiz Score</th>
                  <th className="p-3.5 text-center">Assignments</th>
                  <th className="p-3.5 text-center">Overall %</th>
                  <th className="p-3.5 text-center">Grade</th>
                  <th className="p-3.5 text-center">GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {gradebookData.gradebook.filter(row => 
                  !gradebookSearch || 
                  row.name.toLowerCase().includes(gradebookSearch.toLowerCase()) || 
                  row.rollNumber.toLowerCase().includes(gradebookSearch.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No gradebook data recorded for this subject yet.
                    </td>
                  </tr>
                ) : (
                  gradebookData.gradebook.filter(row => 
                    !gradebookSearch || 
                    row.name.toLowerCase().includes(gradebookSearch.toLowerCase()) || 
                    row.rollNumber.toLowerCase().includes(gradebookSearch.toLowerCase())
                  ).map((row) => (
                    <tr key={row.studentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-mono font-semibold text-slate-600">{row.rollNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{row.name}</td>
                      <td className="p-3.5 text-slate-600">Sec {row.section}</td>
                      <td className="p-3.5 text-center font-mono font-medium text-slate-700">{row.examScore}</td>
                      <td className="p-3.5 text-center font-mono font-medium text-slate-700">{row.quizScore}</td>
                      <td className="p-3.5 text-center text-slate-600">{row.assignmentsCount}</td>
                      <td className="p-3.5 text-center font-bold text-brand-600">{row.overallPct}%</td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-extrabold ${
                          row.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                          row.grade === 'B' ? 'bg-brand-100 text-brand-700' :
                          row.grade === 'C' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {row.grade}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{row.gpa.toFixed(1)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB: ATTENDANCE ROLL CALL --- */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in-up transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Roll Call Registrar</h2>
            
            <div className="flex flex-wrap gap-3">
              <div>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-700"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-slate-700"
                />
              </div>
            </div>
          </div>

          {!isAttendanceEditable && (
            <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-4 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Attendance Record Locked:</strong> Edits are permitted on the same day only. Viewing historical records for <strong>{attendanceDate}</strong>.
              </div>
            </div>
          )}

          {students.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No students enrolled in this course semester.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                      <th className="p-4">Roll Number</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Toggle Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {students.map((stud) => {
                      const isPresent = attendanceRecords[stud.id] === 'PRESENT';
                      return (
                        <tr key={stud.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-semibold text-slate-600">{stud.rollNumber}</td>
                          <td className="p-4 text-slate-800 font-semibold">{stud.user?.name}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              isPresent ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {isPresent ? 'PRESENT' : 'ABSENT'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              disabled={!isAttendanceEditable}
                              onClick={() => toggleAttendance(stud.id)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                !isAttendanceEditable
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : isPresent 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
                              }`}
                            >
                              {isPresent ? 'Mark Absent' : 'Mark Present'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {isAttendanceEditable && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={saveAttendance}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-brand-100 flex items-center space-x-2 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Save Attendance Sheet</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 text-left transition-colors">
            <h3 className="text-lg font-bold font-heading text-slate-800">Publish New Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                <select
                  required
                  value={newAssignment.subjectId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Programming Assignment 1"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description / Instructions</label>
                <textarea
                  rows={4}
                  placeholder="Outline submission steps, grading rubric..."
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={newAssignment.deadline}
                    onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Attachment (Mock)</label>
                  <input
                    type="text"
                    placeholder="e.g. guide.pdf"
                    value={newAssignment.filePath}
                    onChange={(e) => setNewAssignment({ ...newAssignment, filePath: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Assignment</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
              <h3 className="text-lg font-bold font-heading text-slate-800 text-left">Active Assignments</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
                {assignments.length === 0 ? (
                  <div className="col-span-2 p-8 text-center text-slate-400">
                    No active assignments published.
                  </div>
                ) : (
                  assignments.map((assign) => (
                    <div 
                      key={assign.id} 
                      onClick={() => viewSubmissions(assign)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                        selectedAssignment?.id === assign.id
                          ? 'border-brand-500 bg-brand-50/20'
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{assign.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{assign.subject?.name}</div>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{assign.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100/50 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-mono">Due: {assign.deadline}</span>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold flex items-center space-x-1">
                          <span>Review submissions</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedAssignment && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 animate-fade-in-up transition-colors">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-md font-bold text-slate-800 font-heading text-left">
                      Submissions: {selectedAssignment.title}
                    </h4>
                    <span className="text-xs text-slate-400">{selectedAssignment.subject?.name}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Received: {submissions.length}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                        <th className="p-3">Student</th>
                        <th className="p-3">File Submitted</th>
                        <th className="p-3">Submitted At</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Grade</th>
                        <th className="p-3 text-center">Grade Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            No student submissions received yet
                          </td>
                        </tr>
                      ) : (
                        submissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <div className="font-semibold text-slate-700">{sub.student?.user?.name}</div>
                              <div className="text-slate-400 font-mono">{sub.student?.rollNumber}</div>
                            </td>
                            <td className="p-3">
                              <a 
                                href="#"
                                onClick={(e) => { e.preventDefault(); addNotification('Downloaded', `Downloading ${sub.filePath}`, 'success'); }}
                                className="text-brand-600 hover:underline flex items-center space-x-1 font-semibold"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{sub.filePath}</span>
                              </a>
                            </td>
                            <td className="p-3 font-mono text-slate-500">
                              {new Date(sub.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex px-2 py-0.5 rounded font-semibold ${
                                sub.status === 'GRADED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{sub.grade || '-'}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => { setGradingSubmission(sub); setGradingForm({ grade: sub.grade || '', remarks: sub.remarks || '' }); }}
                                className="bg-indigo-50 hover:bg-brand-600 hover:text-white text-brand-600 font-semibold px-2.5 py-1 rounded transition-all"
                              >
                                {sub.status === 'GRADED' ? 'Change Grade' : 'Assign Grade'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: UPLOAD MARKS */}
      {activeTab === 'marks' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 text-left transition-colors">
            <h3 className="text-lg font-bold font-heading text-slate-800">Publish Examination Grade</h3>
            <form onSubmit={handleUploadMarks} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                  <select
                    value={selectedSubjectForMarks}
                    onChange={(e) => setSelectedSubjectForMarks(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Student</label>
                  <select
                    value={selectedStudentForMarks}
                    onChange={(e) => setSelectedStudentForMarks(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                  >
                    <option value="">Select Student</option>
                    {studentsForMarks.map((s) => (
                      <option key={s.id} value={s.id}>{s.user?.name} ({s.rollNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Link to Exam Schedule (Optional)</label>
                <select
                  value={marksForm.examId}
                  onChange={(e) => setMarksForm({ ...marksForm, examId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">General Assessment / Class Work</option>
                  {examsList.filter(e => e.subjectId === selectedSubjectForMarks).map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Marks Obtained</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 85"
                    value={marksForm.marks}
                    onChange={(e) => setMarksForm({ ...marksForm, marks: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 100"
                    value={marksForm.maxMarks}
                    onChange={(e) => setMarksForm({ ...marksForm, maxMarks: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Instructor Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Great reasoning in code, minor syntax errors."
                  value={marksForm.remarks}
                  onChange={(e) => setMarksForm({ ...marksForm, remarks: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Publish Student Marks</span>
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between transition-colors">
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-heading text-slate-800 text-left">GPA Grading Rubrics</h3>
              <p className="text-slate-500 text-sm leading-relaxed text-left">
                Marks uploaded are automatically converted by the backend into GPA letter grades based on percentage performance:
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-0.5">Marks &ge; 90%</span>
                  <span className="text-emerald-600 font-bold">Grade A+ (Excellent)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-0.5">Marks &ge; 80%</span>
                  <span className="text-emerald-500 font-bold">Grade A (Very Good)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-0.5">Marks &ge; 70%</span>
                  <span className="text-indigo-600 font-bold">Grade B (Good)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-0.5">Marks &ge; 60%</span>
                  <span className="text-indigo-500 font-bold">Grade C (Satisfactory)</span>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 mt-6 text-center text-xs text-slate-400">
              Students receive live notification alerts immediately upon grade uploads.
            </div>
          </div>
        </div>
      )}

      {/* TAB: TEACHING SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 animate-fade-in-up transition-colors">
          <h2 className="text-xl font-bold font-heading text-slate-800 text-left">Weekly Lectures Timetable</h2>
          
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Day</th>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Semester & Section</th>
                  <th className="p-4">Lecture Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {schedule.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No teaching classes scheduled.
                    </td>
                  </tr>
                ) : (
                  schedule.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-700">{slot.dayOfWeek}</td>
                      <td className="p-4 font-mono text-slate-600">{slot.startTime} - {slot.endTime}</td>
                      <td className="p-4 font-semibold text-indigo-600">{slot.subject?.name} <span className="text-xs text-slate-400 font-normal">({slot.subject?.code})</span></td>
                      <td className="p-4 text-slate-600">{slot.semester?.name} • Sec {slot.section}</td>
                      <td className="p-4 font-medium text-slate-600">{slot.room}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- STUDENT PROFILE MODAL --- */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4 relative animate-fade-in-up text-left transition-colors">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-800">{selectedStudentProfile.name}</h3>
                <span className="text-xs font-mono text-slate-400">Roll: {selectedStudentProfile.rollNumber}</span>
              </div>
              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-semibold">Email</span>
                <span className="font-mono text-slate-800 block mt-0.5">{selectedStudentProfile.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-semibold">Phone</span>
                <span className="font-mono text-slate-800 block mt-0.5">{selectedStudentProfile.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-semibold">Department</span>
                <span className="font-bold text-slate-800 block mt-0.5">{selectedStudentProfile.department}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-semibold">Course & Semester</span>
                <span className="font-bold text-slate-800 block mt-0.5">{selectedStudentProfile.course} ({selectedStudentProfile.semester})</span>
              </div>
            </div>

            <div className="p-4 border border-slate-100 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider">Performance Metrics</h4>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Attendance Percentage:</span>
                <span className="font-bold text-emerald-600">{selectedStudentProfile.attendancePct}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Classes Attended:</span>
                <span className="font-bold text-slate-700">{selectedStudentProfile.presentClasses} / {selectedStudentProfile.totalClasses}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Submissions Completed:</span>
                <span className="font-bold text-brand-600">{selectedStudentProfile.submissionsCount} Assignments</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- QUIZ SUBMISSIONS MODAL --- */}
      {selectedQuizSubmissions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-2xl w-full p-6 space-y-4 relative animate-fade-in-up text-left transition-colors">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-800">Quiz Submissions: {selectedQuizSubmissions.title}</h3>
                <span className="text-xs text-slate-400">{selectedQuizSubmissions.subject?.name} • Duration: {selectedQuizSubmissions.duration} mins</span>
              </div>
              <button
                onClick={() => setSelectedQuizSubmissions(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-96">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Roll Number</th>
                    <th className="p-3">Score Obtained</th>
                    <th className="p-3">Percentage</th>
                    <th className="p-3">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizSubmissionsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No student test submissions received yet.
                      </td>
                    </tr>
                  ) : (
                    quizSubmissionsList.map((sub) => {
                      const pct = Math.round((sub.score / sub.maxScore) * 100);
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800">{sub.student?.user?.name}</td>
                          <td className="p-3 font-mono text-slate-500">{sub.student?.rollNumber}</td>
                          <td className="p-3 font-bold text-brand-600">{sub.score} / {sub.maxScore}</td>
                          <td className="p-3 font-bold text-slate-700">{pct}%</td>
                          <td className="p-3 font-mono text-slate-400">{new Date(sub.submittedAt).toLocaleTimeString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedQuizSubmissions(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM OVERLAY: GRADING SUBMISSION */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4 relative animate-fade-in-up text-left transition-colors">
            <h3 className="text-lg font-bold font-heading text-slate-800">
              Grade Assignment Submission
            </h3>
            <div className="text-xs text-slate-400">
              Student: {gradingSubmission.student?.user?.name} ({gradingSubmission.student?.rollNumber})
            </div>

            <form onSubmit={submitGrading} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 font-heading">Letter Grade</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B+, F"
                  value={gradingForm.grade}
                  onChange={(e) => setGradingForm({ ...gradingForm, grade: e.target.value.toUpperCase() })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks & Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Add grading feedback..."
                  value={gradingForm.remarks}
                  onChange={(e) => setGradingForm({ ...gradingForm, remarks: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-sm flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Assign Grade</span>
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
