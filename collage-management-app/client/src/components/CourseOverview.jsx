import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Clock, CheckCircle, AlertCircle, Star, LayoutGrid, List, Search, 
  ArrowRight, ChevronRight, GraduationCap, TrendingUp, BarChart2, FileText, 
  HelpCircle, Sparkles, X, ExternalLink, Calendar, User, History, Check,
  MoreVertical, ArrowUpDown, ChevronDown, ShieldCheck, UploadCloud
} from 'lucide-react';

export default function CourseOverview({
  subjects = [],
  assignments = [],
  quizzes = [],
  studyMaterials = [],
  attendance = {},
  schedule = [],
  studentProfile = {},
  starredCourses = [],
  onToggleStarCourse,
  onNavigateTab,
  onOpenAssignment,
  onOpenQuiz,
  recentItems = [],
  onRecentItemClick,
  onClearRecent
}) {
  const [activeSubTab, setActiveSubTab] = useState('courses'); // 'courses' | 'timeline'
  const [filter, setFilter] = useState('in_progress'); // 'all' | 'in_progress' | 'starred'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'progress'
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'list'
  const [selectedSubject, setSelectedSubject] = useState(null);

  // States: Orientation, Upcoming Events & Card Actions
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(false);
  const [showOrientationModal, setShowOrientationModal] = useState(false);
  const [undertakingDone, setUndertakingDone] = useState(() => {
    try {
      return localStorage.getItem(`undertaking_${studentProfile?.id}`) === 'true';
    } catch {
      return false;
    }
  });
  const [activeMenuCourseId, setActiveMenuCourseId] = useState(null);

  // Helper: compute completion percentage for a subject (the progress line)
  const getSubjectMetrics = (subjectId) => {
    const subAssignments = assignments.filter(a => a.subjectId === subjectId);
    const subQuizzes = quizzes.filter(q => q.subjectId === subjectId);
    
    const completedAssignments = subAssignments.filter(
      a => a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'GRADED'
    ).length;
    const completedQuizzes = subQuizzes.filter(q => q.isSubmitted).length;

    const totalTasks = subAssignments.length + subQuizzes.length;
    const completedTasks = completedAssignments + completedQuizzes;

    // Attendance for this subject
    const attRecord = attendance.subjects?.find(s => s.subjectId === subjectId);
    const attPercentage = attRecord ? attRecord.percentage : (attendance.overallPercentage || 100);

    let progress = 100;
    if (totalTasks > 0) {
      progress = Math.round((completedTasks / totalTasks) * 100);
    } else if (attRecord && attRecord.total > 0) {
      progress = attPercentage;
    }

    return {
      progress,
      totalAssignments: subAssignments.length,
      completedAssignments,
      totalQuizzes: subQuizzes.length,
      completedQuizzes,
      attendancePercentage: attPercentage,
      subAssignments,
      subQuizzes
    };
  };

  // Color gradient generator based on subject code or index
  const getSubjectGradient = (index) => {
    const gradients = [
      'from-blue-600 via-indigo-600 to-indigo-800',
      'from-emerald-600 via-teal-600 to-teal-800',
      'from-purple-600 via-violet-600 to-indigo-900',
      'from-amber-600 via-orange-600 to-red-700',
      'from-cyan-600 via-blue-600 to-blue-900',
      'from-rose-600 via-pink-600 to-purple-900'
    ];
    return gradients[index % gradients.length];
  };

  // Filter & Sort subjects
  const filteredSubjects = useMemo(() => {
    let list = [...subjects];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        s => s.name?.toLowerCase().includes(q) || 
             s.code?.toLowerCase().includes(q) ||
             s.faculty?.user?.name?.toLowerCase().includes(q)
      );
    }

    // Category / status filter
    if (filter === 'starred') {
      list = list.filter(s => starredCourses.includes(s.id));
    } else if (filter === 'in_progress') {
      list = list.filter(s => {
        const { progress } = getSubjectMetrics(s.id);
        return progress < 100;
      });
    } else if (filter === 'past') {
      list = []; // Academic term in progress
    } else if (filter === 'future') {
      list = [];
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'progress') {
        const progA = getSubjectMetrics(a.id).progress;
        const progB = getSubjectMetrics(b.id).progress;
        return progB - progA;
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    return list;
  }, [subjects, searchQuery, filter, sortBy, starredCourses, assignments, quizzes, attendance]);

  // Generate Timeline Items (sorted by deadline)
  const timelineItems = useMemo(() => {
    const items = [];

    assignments.forEach(a => {
      const isDone = a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'GRADED';
      items.push({
        id: `ass-${a.id}`,
        type: 'assignment',
        title: a.title,
        subjectName: a.subject?.name || 'General Course',
        subjectCode: a.subject?.code || 'ASG',
        deadline: a.deadline,
        isCompleted: isDone,
        original: a
      });
    });

    quizzes.forEach(q => {
      items.push({
        id: `quiz-${q.id}`,
        type: 'quiz',
        title: q.title,
        subjectName: q.subject?.name || 'General Course',
        subjectCode: q.subject?.code || 'TEST',
        deadline: q.deadline,
        isCompleted: q.isSubmitted,
        original: q
      });
    });

    return items.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  }, [assignments, quizzes]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in-up text-left">
      
      {/* =========================================================================
          MSSU LMS CARD 1: ORIENTATION (Matching user reference Image 1)
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 transition-all">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Orientation</h3>
          {undertakingDone && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              <Check className="w-3 h-3" />
              <span>Completed</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setShowOrientationModal(true)}
          className="mt-2 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left leading-relaxed block"
        >
          Click here to enter Orientation section and upload all your undertakings
        </button>
      </div>

      {/* =========================================================================
          UPCOMING EVENTS CARD (EXPANDABLE & DIRECT NAVIGATION)
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all overflow-hidden text-left">
        <button 
          onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-orange-100 dark:bg-orange-950/60 text-orange-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Upcoming events</span>
                {timelineItems.filter(t => !t.isCompleted).length > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                    {timelineItems.filter(t => !t.isCompleted).length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isUpcomingExpanded ? 'Tap to collapse deadlines' : 'View pending submissions, tests & dates'}
              </p>
            </div>
          </div>
          <div className="p-1 text-slate-400">
            {isUpcomingExpanded ? (
              <ChevronDown className="w-5 h-5 text-orange-500 transition-transform" />
            ) : (
              <ChevronRight className="w-5 h-5 transition-transform" />
            )}
          </div>
        </button>

        {/* Expanded Events List */}
        {isUpcomingExpanded && (
          <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-between pt-3 pb-1 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Active Deadlines & Schedule</span>
              <button
                onClick={() => onNavigateTab && onNavigateTab('assignments')}
                className="text-orange-600 dark:text-orange-400 hover:underline font-bold text-xs flex items-center space-x-1"
              >
                <span>All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {timelineItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
                <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                <div className="font-bold text-slate-700 dark:text-slate-300">All caught up!</div>
                <p>No pending assignment deadlines or online tests right now.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {timelineItems.map((item) => {
                  const isDone = item.isCompleted;
                  const isQuiz = item.type === 'quiz';

                  return (
                    <div
                      key={item.id}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-slate-50 dark:bg-slate-850/50 border-slate-200/60 dark:border-slate-800 opacity-75'
                          : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isDone 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : isQuiz 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                        }`}>
                          {isDone ? <Check className="w-4 h-4" /> : isQuiz ? <HelpCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                              {item.subjectCode}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.subjectName}</span>
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">
                            {item.title}
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Due: {item.deadline ? new Date(item.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Continuous Evaluation'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        {isDone ? (
                          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Submitted</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              if (isQuiz) {
                                onOpenQuiz ? onOpenQuiz(item.original) : onNavigateTab('quizzes');
                              } else {
                                onOpenAssignment ? onOpenAssignment(item.original) : onNavigateTab('assignments');
                              }
                            }}
                            className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1"
                          >
                            <span>{isQuiz ? 'Attempt Quiz' : 'Submit Task'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          MSSU LMS CARD 3: COURSE OVERVIEW (Matching user reference Image 1)
          ========================================================================= */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-6 transition-colors space-y-4">
        
        {/* Title */}
        <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white">
          Course overview
        </h2>

        {/* Image 1 Search Bar: 'Filter my courses' */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="course-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter my courses"
            className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Image 1 Filter Bar: In progress ▾ (Left) | Sort ⇅ & View ⊞ (Right) */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer shadow-xs"
            >
              <option value="in_progress">In progress</option>
              <option value="all">All ({subjects.length})</option>
              <option value="starred">Starred ({starredCourses.length})</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center space-x-2">
            {/* Sort toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'name' ? 'progress' : 'name')}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
              title={`Sort by ${sortBy === 'name' ? 'Progress %' : 'Course Name'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* View mode toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
              title="Toggle Grid / List layout"
            >
              {viewMode === 'card' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* -------------------- COURSES LIST (EXACT IMAGE 1 CARD SHAPE) -------------------- */}
        {filteredSubjects.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No courses match your filter</h4>
            <p className="text-xs text-slate-400">Try adjusting your search query or switching to All courses</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredSubjects.map((sub, index) => {
              const isStarred = starredCourses.includes(sub.id);
              const metrics = getSubjectMetrics(sub.id);

              return (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all p-3.5 sm:p-4 relative space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Left Thumbnail / Badge (Matching Image 1's mock test banner) */}
                    <div className="w-12 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 text-center overflow-hidden">
                      <span className="text-[8px] font-black font-mono tracking-tighter text-slate-600 dark:text-slate-300 leading-none">MOCK</span>
                      <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 font-mono leading-none mt-0.5">TEST</span>
                    </div>

                    {/* Center Course Info */}
                    <div className="flex-1 min-w-0">
                      <h3 
                        onClick={() => setSelectedSubject(sub)}
                        className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-tight line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        {sub.name}
                      </h3>

                      {/* Image 1 Soft Peach Pill Badge */}
                      <div className="mt-2 inline-flex items-center">
                        <span className="bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-200/70 dark:border-amber-800/60 px-3 py-0.5 rounded-full text-[11px] font-semibold line-clamp-1">
                          {sub.code ? `Mock Test : ${sub.code} - ${sub.name}` : `Mock Test : ${sub.name}`}
                        </span>
                      </div>
                    </div>

                    {/* Right 3-dots Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuCourseId(activeMenuCourseId === sub.id ? null : sub.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Course actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuCourseId === sub.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 text-xs animate-fade-in-up">
                          <button
                            onClick={() => { setSelectedSubject(sub); setActiveMenuCourseId(null); }}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                          >
                            View Course Details
                          </button>
                          <button
                            onClick={() => { onToggleStarCourse && onToggleStarCourse(sub.id); setActiveMenuCourseId(null); }}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium flex items-center justify-between"
                          >
                            <span>{isStarred ? 'Unstar Course' : 'Star Course'}</span>
                            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                          </button>
                          <button
                            onClick={() => { onNavigateTab && onNavigateTab('assignments'); setActiveMenuCourseId(null); }}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                          >
                            Go to Assignments
                          </button>
                          <button
                            onClick={() => { onNavigateTab && onNavigateTab('quizzes'); setActiveMenuCourseId(null); }}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                          >
                            Take Online Tests
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course Progress Line */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex-1 mr-3">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                          style={{ width: `${metrics.progress}%` }} 
                        />
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                      {metrics.progress}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 4: RECENTLY ACCESSED ITEMS STRIP
          ========================================================================= */}
      {recentItems.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 transition-colors">
          <div className="flex items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-orange-600" />
              <h2 className="text-sm sm:text-base font-bold font-heading text-slate-900 dark:text-white">
                Recently accessed items
              </h2>
            </div>
            {onClearRecent && (
              <button
                onClick={onClearRecent}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-1 no-scrollbar scroll-smooth scroll-snap-x">
            {recentItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onRecentItemClick && onRecentItemClick(item)}
                className="shrink-0 w-64 scroll-snap-align-start bg-slate-50/80 hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 cursor-pointer shadow-xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-bold text-orange-600 uppercase font-mono">{item.type}</span>
                  <span>{item.timestamp || 'Just now'}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1.5 line-clamp-1">{item.title}</h4>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-orange-600">
                  <span>Resume</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          ORIENTATION & UNDERTAKING MODAL
          ========================================================================= */}
      {showOrientationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowOrientationModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 z-10 animate-fade-in-up text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-orange-100 dark:bg-orange-950/60 text-orange-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">Orientation & Undertakings</h3>
                  <p className="text-xs text-slate-500">Academic Year 2026-2027 Declarations</p>
                </div>
              </div>
              <button onClick={() => setShowOrientationModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 max-h-72 overflow-y-auto pr-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">1. Academic Honesty & Code of Conduct</div>
                <p className="mt-1 leading-relaxed">Students must uphold the highest standards of integrity. Plagiarism, collusion, or unauthorized assistance in online tests and submissions is strictly prohibited.</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">2. Mandatory Attendance Requirement</div>
                <p className="mt-1 leading-relaxed">A minimum of 75% attendance in theory and laboratory practicals is required to qualify for end-semester evaluations.</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">3. Zero-Tolerance Campus Safety Policy</div>
                <p className="mt-1 leading-relaxed">Ragging or harassment of any form is an offense subject to immediate expulsion and regulatory reporting.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {undertakingDone ? '✓ Undertaking Signed' : 'Status: Pending submission'}
              </span>
              <button
                onClick={() => {
                  setUndertakingDone(true);
                  try {
                    localStorage.setItem(`undertaking_${studentProfile?.id}`, 'true');
                  } catch (e) {}
                  setShowOrientationModal(false);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>{undertakingDone ? 'Update Undertaking' : 'Sign & Submit Undertaking'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SUBJECT DETAILS & PROGRESS BREAKDOWN
          ========================================================================= */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs">
                    {selectedSubject.code}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {selectedSubject.credits || 4} Credits • Semester {studentProfile.semester?.number || 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                  {selectedSubject.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Faculty: <strong className="text-slate-800 dark:text-slate-200">{selectedSubject.faculty?.user?.name || 'Assigned Instructor'}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedSubject(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detailed Progress Line Breakdown */}
            {(() => {
              const metrics = getSubjectMetrics(selectedSubject.id);
              return (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-200">Overall Course Progress</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {metrics.progress}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-brand-500 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${metrics.progress}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                        <span className="block text-[10px] text-slate-400">Assignments</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {metrics.completedAssignments} / {metrics.totalAssignments} Submitted
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                        <span className="block text-[10px] text-slate-400">Online Tests</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {metrics.completedQuizzes} / {metrics.totalQuizzes} Attempted
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                        <span className="block text-[10px] text-slate-400">Attendance</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {metrics.attendancePercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assignments for this subject */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Subject Assignments ({metrics.subAssignments.length})
                    </h4>
                    {metrics.subAssignments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No assignments posted for this course yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {metrics.subAssignments.map((a) => (
                          <div 
                            key={a.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-800 dark:text-white">{a.title}</div>
                              <span className="text-[10px] text-slate-400">Due: {a.deadline}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'GRADED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {a.submissionStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quizzes for this subject */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Online Tests & Quizzes ({metrics.subQuizzes.length})
                    </h4>
                    {metrics.subQuizzes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No online quizzes scheduled for this course.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {metrics.subQuizzes.map((q) => (
                          <div 
                            key={q.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-800 dark:text-white">{q.title}</div>
                              <span className="text-[10px] text-slate-400">Duration: {q.duration} mins</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.isSubmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {q.isSubmitted ? 'Attempted' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Study Materials for this subject */}
                  {(() => {
                    const subMaterials = studyMaterials.filter(m => m.subjectId === selectedSubject.id);
                    return (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Study Materials & Notes ({subMaterials.length})
                        </h4>
                        {subMaterials.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No study materials shared by teacher for this course yet.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {subMaterials.map((m) => (
                              <div 
                                key={m.id}
                                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono">
                                      {m.fileType}
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-white">{m.title}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">{m.unit} • {m.description}</div>
                                </div>
                                {m.fileUrl && (
                                  <a
                                    href={m.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 shrink-0"
                                  >
                                    <span>Open</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedSubject(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close Course Overview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

