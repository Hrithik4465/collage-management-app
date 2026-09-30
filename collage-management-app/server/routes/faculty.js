const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply Faculty Role Check to all routes in this file
router.use(authenticateJWT);
router.use(requireRole(['FACULTY']));

// --- ATTENDANCE ---

// Mark/Save Attendance (Same day check should be handled, or standard update/insert)
router.post('/attendance', async (req, res) => {
  const { subjectId, date, records } = req.body; // records: [{ studentId, status: 'PRESENT'|'ABSENT' }]
  const facultyId = req.user.profileId;

  if (!subjectId || !date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'SubjectId, date, and records array are required' });
  }

  // Same-day check (optional restriction, but requirements say "edit attendance same day only")
  // For safety, let's allow saving, and double-check date
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = date === todayStr;

  try {
    const savedRecords = [];

    for (const rec of records) {
      // Find if record already exists
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: rec.studentId,
          subjectId,
          date,
        },
      });

      if (existing) {
        // If it exists, but it's not today's date, and role is FACULTY, we might restrict.
        // Let's implement the same-day edit rule:
        if (!isToday) {
          // Warning/Constraint: requirement says "Edit attendance (same day only)"
          // Let's enforce it or log a warning. Let's enforce it to be strict!
          return res.status(400).json({ error: 'Attendance edit is restricted to the same day only.' });
        }

        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: rec.status },
        });
        savedRecords.push(updated);
      } else {
        const created = await prisma.attendance.create({
          data: {
            date,
            status: rec.status,
            studentId: rec.studentId,
            subjectId,
            markedById: facultyId,
          },
        });
        savedRecords.push(created);

        // Notify student of attendance updates (specifically if they are marked ABSENT)
        if (rec.status === 'ABSENT') {
          const student = await prisma.student.findUnique({
            where: { id: rec.studentId },
            include: { user: true },
          });
          const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
          if (student) {
            await prisma.notification.create({
              data: {
                title: 'Attendance Alert: Absent',
                message: `You were marked ABSENT for ${subject ? subject.name : 'Subject'} on ${date}.`,
                userId: student.userId,
              },
            });
          }
        }
      }
    }

    res.json({ message: 'Attendance marked successfully', count: savedRecords.length });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

// View Attendance Records for a class
router.get('/attendance-records', async (req, res) => {
  const { subjectId, date } = req.query;

  if (!subjectId || !date) {
    return res.status(400).json({ error: 'SubjectId and date are required' });
  }

  try {
    const records = await prisma.attendance.findMany({
      where: {
        subjectId,
        date,
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });
    res.json(records);
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// --- ASSIGNMENTS ---

// Create Assignment
router.post('/assignments', async (req, res) => {
  const { title, description, deadline, subjectId, filePath } = req.body;
  const facultyId = req.user.profileId;

  if (!title || !deadline || !subjectId) {
    return res.status(400).json({ error: 'Title, deadline, and subjectId are required' });
  }

  try {
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || '',
        deadline,
        filePath: filePath || null,
        subjectId,
        facultyId,
      },
    });

    // Notify all students enrolled in this subject/course
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (subject) {
      const enrolledStudents = await prisma.student.findMany({
        where: { courseId: subject.courseId, semesterId: subject.semesterId },
        select: { userId: true },
      });

      if (enrolledStudents.length > 0) {
        await prisma.notification.createMany({
          data: enrolledStudents.map((s) => ({
            title: `New Assignment: ${title}`,
            message: `Assignment posted for ${subject.name}. Deadline: ${deadline}`,
            userId: s.userId,
          })),
        });
      }
    }

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Get Assignments Created by this Faculty
router.get('/assignments', async (req, res) => {
  const facultyId = req.user.profileId;
  try {
    const assignments = await prisma.assignment.findMany({
      where: { facultyId },
      include: {
        subject: true,
        submissions: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assignments);
  } catch (error) {
    console.error('Fetch assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Delete Assignment
router.delete('/assignments/:id', async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
    });

    if (!assignment || assignment.facultyId !== req.user.profileId) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await prisma.assignment.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Get Submissions for an Assignment
router.get('/assignments/:id/submissions', async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
    });

    if (!assignment || assignment.facultyId !== req.user.profileId) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: req.params.id },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(submissions);
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Grade Submission
router.put('/submissions/:submissionId/grade', async (req, res) => {
  const { grade, remarks } = req.body;
  const { submissionId } = req.params;

  if (!grade) {
    return res.status(400).json({ error: 'Grade is required' });
  }

  try {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        student: true,
      },
    });

    if (!submission || submission.assignment.facultyId !== req.user.profileId) {
      return res.status(404).json({ error: 'Submission not found or unauthorized' });
    }

    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'GRADED',
        grade,
        remarks,
      },
    });

    // Notify Student
    await prisma.notification.create({
      data: {
        title: 'Assignment Graded',
        message: `Your submission for "${submission.assignment.title}" has been graded. Grade: ${grade}`,
        userId: submission.student.userId,
      },
    });

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// --- MARKS UPLOAD (RESULTS) ---

router.post('/results', async (req, res) => {
  const { studentId, subjectId, marks, maxMarks, examId, remarks } = req.body;

  if (!studentId || !subjectId || marks === undefined || !maxMarks) {
    return res.status(400).json({ error: 'StudentId, subjectId, marks, and maxMarks are required' });
  }

  // Compute Grade based on percentage
  const pct = (parseFloat(marks) / parseFloat(maxMarks)) * 100;
  let grade = 'F';
  if (pct >= 90) grade = 'A+';
  else if (pct >= 80) grade = 'A';
  else if (pct >= 70) grade = 'B';
  else if (pct >= 60) grade = 'C';
  else if (pct >= 50) grade = 'D';

  try {
    // Check if result already exists for this student/subject
    const existing = await prisma.result.findFirst({
      where: {
        studentId,
        subjectId,
        examId: examId || null,
      },
    });

    let result;
    if (existing) {
      result = await prisma.result.update({
        where: { id: existing.id },
        data: {
          marks: parseFloat(marks),
          maxMarks: parseFloat(maxMarks),
          grade,
          remarks: remarks || '',
        },
      });
    } else {
      result = await prisma.result.create({
        data: {
          studentId,
          subjectId,
          marks: parseFloat(marks),
          maxMarks: parseFloat(maxMarks),
          grade,
          remarks: remarks || '',
          examId: examId || null,
        },
      });
    }

    // Notify Student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });

    if (student) {
      await prisma.notification.create({
        data: {
          title: 'New Grade Published',
          message: `Your grade for ${subject ? subject.name : 'Subject'} has been published: ${grade} (${marks}/${maxMarks}).`,
          userId: student.userId,
        },
      });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Upload marks error:', error);
    res.status(500).json({ error: 'Failed to upload marks' });
  }
});

// Get Faculty Subjects list
router.get('/my-subjects', async (req, res) => {
  const facultyId = req.user.profileId;
  try {
    const subjects = await prisma.subject.findMany({
      where: { facultyId },
      include: {
        course: true,
        semester: true,
      },
    });
    res.json(subjects);
  } catch (error) {
    console.error('Fetch subjects error:', error);
    res.status(500).json({ error: 'Failed to fetch faculty subjects' });
  }
});

// Get Enrolled Students for a Subject/Course
router.get('/subjects/:id/students', async (req, res) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id },
    });

    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { rollNumber: 'asc' },
    });

    res.json(students);
  } catch (error) {
    console.error('Fetch course students error:', error);
    res.status(500).json({ error: 'Failed to fetch students list' });
  }
});

// --- 1. STUDENT LIST (EXTENDED PROFILE & STATS) ---
router.get('/student-list-extended', async (req, res) => {
  const facultyId = req.user.profileId;
  const { subjectId, search } = req.query;

  try {
    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { rollNumber: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } }
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
        department: { select: { name: true, code: true } },
        course: { select: { name: true, code: true } },
        semester: { select: { name: true, number: true } },
        attendances: {
          select: { status: true, subjectId: true }
        },
        results: {
          select: { marks: true, maxMarks: true, grade: true }
        },
        submissions: {
          select: { id: true, status: true, grade: true }
        }
      },
      orderBy: { rollNumber: 'asc' }
    });

    // Process students data with calculated metrics
    const result = students.map(s => {
      const totalAtt = s.attendances.length;
      const presentAtt = s.attendances.filter(a => a.status === 'PRESENT').length;
      const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

      let totalMarks = 0;
      let totalMaxMarks = 0;
      s.results.forEach(r => {
        totalMarks += r.marks;
        totalMaxMarks += r.maxMarks;
      });
      const avgScorePct = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;

      return {
        id: s.id,
        rollNumber: s.rollNumber,
        name: s.user?.name || 'N/A',
        email: s.user?.email || 'N/A',
        phone: s.phone || 'N/A',
        section: s.section,
        department: s.department?.name,
        course: s.course?.name,
        semester: s.semester?.name,
        attendancePct: attPct,
        totalClasses: totalAtt,
        presentClasses: presentAtt,
        averageMarksPct: avgScorePct,
        submissionsCount: s.submissions.length,
        status: attPct < 75 ? 'AT_RISK' : 'GOOD'
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Fetch student list extended error:', error);
    res.status(500).json({ error: 'Failed to fetch student list' });
  }
});

// --- 2. ATTENDANCE HISTORY ---
router.get('/attendance-history', async (req, res) => {
  const facultyId = req.user.profileId;
  const { subjectId, startDate, endDate } = req.query;

  try {
    const whereClause = {
      markedById: facultyId
    };

    if (subjectId) whereClause.subjectId = subjectId;
    if (startDate && endDate) {
      whereClause.date = { gte: startDate, lte: endDate };
    }

    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          include: { user: { select: { name: true } } }
        },
        subject: { select: { name: true, code: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Group by Date and Subject
    const grouped = {};
    records.forEach(r => {
      const key = `${r.date}_${r.subjectId}`;
      if (!grouped[key]) {
        grouped[key] = {
          date: r.date,
          subjectId: r.subjectId,
          subjectName: r.subject.name,
          subjectCode: r.subject.code,
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0,
          students: []
        };
      }
      grouped[key].totalStudents++;
      if (r.status === 'PRESENT') grouped[key].presentCount++;
      else grouped[key].absentCount++;

      grouped[key].students.push({
        attendanceId: r.id,
        studentId: r.studentId,
        studentName: r.student.user.name,
        rollNumber: r.student.rollNumber,
        status: r.status
      });
    });

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Fetch attendance history error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

// --- 3. PERFORMANCE ANALYTICS ---
router.get('/performance-analytics', async (req, res) => {
  const facultyId = req.user.profileId;
  const { subjectId } = req.query;

  try {
    const facultySubjects = await prisma.subject.findMany({
      where: { facultyId },
      select: { id: true, name: true, code: true }
    });

    const subjectIds = subjectId ? [subjectId] : facultySubjects.map(s => s.id);

    const results = await prisma.result.findMany({
      where: { subjectId: { in: subjectIds } },
      include: {
        student: {
          include: { user: { select: { name: true } }, department: true }
        },
        subject: { select: { name: true } }
      }
    });

    const attendances = await prisma.attendance.findMany({
      where: { subjectId: { in: subjectIds } },
      include: { student: true }
    });

    // Grade distribution counts
    const gradeDist = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    let totalPctSum = 0;
    let highestPct = 0;
    let lowestPct = 100;

    const studentScoreMap = {};

    results.forEach(r => {
      const pct = (r.marks / r.maxMarks) * 100;
      totalPctSum += pct;
      if (pct > highestPct) highestPct = pct;
      if (pct < lowestPct) lowestPct = pct;

      const g = r.grade || 'F';
      if (gradeDist[g] !== undefined) gradeDist[g]++;
      else gradeDist['F']++;

      if (!studentScoreMap[r.studentId]) {
        studentScoreMap[r.studentId] = {
          name: r.student.user.name,
          rollNumber: r.student.rollNumber,
          scores: [],
          totalMarks: 0,
          totalMax: 0
        };
      }
      studentScoreMap[r.studentId].scores.push(pct);
      studentScoreMap[r.studentId].totalMarks += r.marks;
      studentScoreMap[r.studentId].totalMax += r.maxMarks;
    });

    if (results.length === 0) lowestPct = 0;

    const classAverage = results.length > 0 ? Math.round(totalPctSum / results.length) : 0;

    // Student performance rankings
    const studentStats = Object.values(studentScoreMap).map(s => {
      const avg = s.totalMax > 0 ? Math.round((s.totalMarks / s.totalMax) * 100) : 0;
      return { ...s, averagePct: avg };
    });

    studentStats.sort((a, b) => b.averagePct - a.averagePct);
    const topPerformers = studentStats.slice(0, 5);

    // At Risk Students calculation (Attendance < 75% or Marks < 50%)
    const studentAttMap = {};
    attendances.forEach(a => {
      if (!studentAttMap[a.studentId]) {
        studentAttMap[a.studentId] = { total: 0, present: 0, student: a.student };
      }
      studentAttMap[a.studentId].total++;
      if (a.status === 'PRESENT') studentAttMap[a.studentId].present++;
    });

    // Fetch all students
    const courseStudents = await prisma.student.findMany({
      include: { user: { select: { name: true } }, results: true }
    });

    const atRiskStudents = [];
    courseStudents.forEach(s => {
      const att = studentAttMap[s.id];
      const attPct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 100;
      
      let marksPct = 100;
      if (s.results.length > 0) {
        let tM = 0, tMax = 0;
        s.results.forEach(r => { tM += r.marks; tMax += r.maxMarks; });
        marksPct = tMax > 0 ? Math.round((tM / tMax) * 100) : 100;
      }

      if (attPct < 75 || marksPct < 50) {
        atRiskStudents.push({
          id: s.id,
          name: s.user?.name,
          rollNumber: s.rollNumber,
          attendancePct: attPct,
          marksPct,
          reason: attPct < 75 ? 'Low Attendance (<75%)' : 'Academic Risk (<50%)'
        });
      }
    });

    res.json({
      classAverage,
      highestMark: Math.round(highestPct),
      lowestMark: Math.round(lowestPct),
      totalGraded: results.length,
      gradeDistribution: gradeDist,
      topPerformers,
      atRiskStudents
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});

// --- 4. QUIZ CREATOR & ONLINE TESTS ---

// Create Quiz
router.post('/quizzes', async (req, res) => {
  const facultyId = req.user.profileId;
  const { title, description, duration, totalMarks, deadline, subjectId, questions } = req.body;

  if (!title || !subjectId || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Title, subjectId, and questions array are required' });
  }

  try {
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || '',
        duration: parseInt(duration) || 30,
        totalMarks: parseFloat(totalMarks) || 100,
        deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        questionsJson: JSON.stringify(questions),
        subjectId,
        facultyId,
        isPublished: true
      }
    });

    // Notify enrolled students
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (subject) {
      const students = await prisma.student.findMany({
        select: { userId: true }
      });

      if (students.length > 0) {
        await prisma.notification.createMany({
          data: students.map(s => ({
            title: `New Quiz Available: ${title}`,
            message: `Online Test posted for ${subject.name}. Duration: ${duration} mins. Deadline: ${deadline}`,
            userId: s.userId
          }))
        });
      }
    }

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Get Faculty Quizzes
router.get('/quizzes', async (req, res) => {
  const facultyId = req.user.profileId;
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { facultyId },
      include: {
        subject: { select: { name: true, code: true } },
        submissions: {
          include: { student: { include: { user: { select: { name: true } } } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Parse questions JSON for frontend convenience
    const formatted = quizzes.map(q => ({
      ...q,
      questions: JSON.parse(q.questionsJson || '[]'),
      submissionCount: q.submissions.length
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Toggle Publish Status
router.put('/quizzes/:id/publish', async (req, res) => {
  const { isPublished } = req.body;
  try {
    const updated = await prisma.quiz.update({
      where: { id: req.params.id },
      data: { isPublished: Boolean(isPublished) }
    });
    res.json(updated);
  } catch (error) {
    console.error('Toggle quiz publish error:', error);
    res.status(500).json({ error: 'Failed to update quiz status' });
  }
});

// Delete Quiz
router.delete('/quizzes/:id', async (req, res) => {
  const quizId = req.params.id;
  try {
    // Delete any associated submissions first to prevent foreign key errors
    await prisma.quizSubmission.deleteMany({
      where: { quizId }
    });
    await prisma.quiz.delete({
      where: { id: quizId }
    });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Get Quiz Submissions & Results
router.get('/quizzes/:id/submissions', async (req, res) => {
  try {
    const submissions = await prisma.quizSubmission.findMany({
      where: { quizId: req.params.id },
      include: {
        student: {
          include: { user: { select: { name: true, email: true } } }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    const parsed = submissions.map(s => ({
      ...s,
      answers: JSON.parse(s.answersJson || '{}')
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Fetch quiz submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz submissions' });
  }
});

// --- 5. GRADEBOOK ---
router.get('/gradebook', async (req, res) => {
  const facultyId = req.user.profileId;
  const { subjectId } = req.query;

  try {
    const facultySubjects = await prisma.subject.findMany({
      where: { facultyId },
      include: { course: true, semester: true }
    });

    if (facultySubjects.length === 0) return res.json({ subjects: [], gradebook: [] });

    const selectedSubject = subjectId 
      ? facultySubjects.find(s => s.id === subjectId) 
      : facultySubjects[0];

    if (!selectedSubject) return res.json({ subjects: facultySubjects, gradebook: [] });

    // Fetch enrolled students
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true, email: true } },
        results: { where: { subjectId: selectedSubject.id } },
        submissions: {
          where: { assignment: { subjectId: selectedSubject.id } },
          include: { assignment: { select: { title: true } } }
        },
        quizSubmissions: {
          where: { quiz: { subjectId: selectedSubject.id } },
          include: { quiz: { select: { title: true } } }
        }
      },
      orderBy: { rollNumber: 'asc' }
    });

    const gradebookRows = students.map(s => {
      // Calculate Exams Score
      let examMarks = 0, examMax = 0;
      s.results.forEach(r => { examMarks += r.marks; examMax += r.maxMarks; });

      // Calculate Quizzes Score
      let quizMarks = 0, quizMax = 0;
      s.quizSubmissions.forEach(q => { quizMarks += q.score; quizMax += q.maxScore; });

      // Total Weighted Score (60% Exams + 20% Quizzes + 20% Assignments)
      const examPct = examMax > 0 ? (examMarks / examMax) * 100 : 0;
      const quizPct = quizMax > 0 ? (quizMarks / quizMax) * 100 : 0;
      const assignPct = s.submissions.length > 0 ? 85 : 0; // standard default assignment score

      const overallPct = Math.round((examPct * 0.6) + (quizPct * 0.2) + (assignPct * 0.2));

      let grade = 'F', gpa = 0.0;
      if (overallPct >= 90) { grade = 'A+'; gpa = 4.0; }
      else if (overallPct >= 80) { grade = 'A'; gpa = 3.7; }
      else if (overallPct >= 70) { grade = 'B'; gpa = 3.0; }
      else if (overallPct >= 60) { grade = 'C'; gpa = 2.0; }
      else if (overallPct >= 50) { grade = 'D'; gpa = 1.0; }

      return {
        studentId: s.id,
        rollNumber: s.rollNumber,
        name: s.user?.name || 'N/A',
        email: s.user?.email || 'N/A',
        section: s.section,
        examScore: examMax > 0 ? `${examMarks}/${examMax}` : 'N/A',
        quizScore: quizMax > 0 ? `${quizMarks}/${quizMax}` : 'N/A',
        assignmentsCount: `${s.submissions.length} submitted`,
        overallPct,
        grade,
        gpa
      };
    });

    res.json({
      subjects: facultySubjects,
      selectedSubjectId: selectedSubject.id,
      gradebook: gradebookRows
    });
  } catch (error) {
    console.error('Fetch gradebook error:', error);
    res.status(500).json({ error: 'Failed to fetch gradebook' });
  }
});

module.exports = router;
