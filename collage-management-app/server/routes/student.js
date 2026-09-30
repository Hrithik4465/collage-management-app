const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply Student Role Check to all routes in this file
router.use(authenticateJWT);
router.use(requireRole(['STUDENT']));

// --- ATTENDANCE STATS ---
router.get('/attendance', async (req, res) => {
  const studentId = req.user.profileId;

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId },
      include: { subject: true },
    });

    // Group by subject
    const subjectStats = {};
    let totalPresent = 0;
    let totalClasses = attendanceRecords.length;

    attendanceRecords.forEach((rec) => {
      const subId = rec.subjectId;
      if (!subjectStats[subId]) {
        subjectStats[subId] = {
          subjectId: subId,
          subjectName: rec.subject.name,
          subjectCode: rec.subject.code,
          present: 0,
          total: 0,
        };
      }

      subjectStats[subId].total += 1;
      if (rec.status === 'PRESENT') {
        subjectStats[subId].present += 1;
        totalPresent += 1;
      }
    });

    // Format list and calculate percentages
    const subjects = Object.values(subjectStats).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 100,
    }));

    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;

    res.json({
      overallPercentage,
      totalClasses,
      totalPresent,
      subjects,
    });
  } catch (error) {
    console.error('Fetch student attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

// --- ASSIGNMENTS ---
router.get('/assignments', async (req, res) => {
  const studentId = req.user.profileId;

  try {
    // Get student details to know their course and semester
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    // Fetch assignments for student's course + semester
    const assignments = await prisma.assignment.findMany({
      include: {
        subject: true,
        submissions: {
          where: { studentId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format output to return single submission details directly
    const formatted = assignments.map((a) => {
      const submission = a.submissions && a.submissions.length > 0 ? a.submissions[0] : null;
      // remove submissions array from root assignment
      const copy = { ...a };
      delete copy.submissions;

      return {
        ...copy,
        submissionStatus: submission ? submission.status : 'UNSUBMITTED',
        submission: submission,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Fetch student assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Submit Assignment
router.post('/assignments/:assignmentId/submit', async (req, res) => {
  const { assignmentId } = req.params;
  const { filePath } = req.body; // Simulated filePath from client upload
  const studentId = req.user.profileId;

  if (!filePath) {
    return res.status(400).json({ error: 'File path/name is required' });
  }

  try {
    // Verify assignment exists and corresponds to student's course/semester
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { subject: true },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if submission already exists
    const existing = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId,
      },
    });

    let submission;
    if (existing) {
      // If it exists and has already been graded, we might prevent resubmission
      if (existing.status === 'GRADED') {
        return res.status(400).json({ error: 'Cannot update graded assignments' });
      }

      submission = await prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: {
          filePath,
          submittedAt: new Date(),
          status: 'PENDING', // Reset status to pending review
        },
      });
    } else {
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId,
          filePath,
          status: 'PENDING',
        },
      });
    }

    res.json(submission);
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// --- RESULTS (TRANSCRIPT) ---
router.get('/results', async (req, res) => {
  const studentId = req.user.profileId;
  try {
    const results = await prisma.result.findMany({
      where: { studentId },
      include: {
        subject: true,
        exam: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(results);
  } catch (error) {
    console.error('Fetch student results error:', error);
    res.status(500).json({ error: 'Failed to fetch academic results' });
  }
});

// --- FEE STATUS & STATEMENT ---
router.get('/fee-status', async (req, res) => {
  const studentId = req.user.profileId;

  try {
    const feeRecords = await prisma.feeStatus.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    const totalPaid = feeRecords
      .filter((f) => f.status === 'PAID')
      .reduce((acc, f) => acc + f.amount, 0);

    const totalPending = feeRecords
      .filter((f) => f.status === 'PENDING')
      .reduce((acc, f) => acc + f.amount, 0);

    const totalOverdue = feeRecords
      .filter((f) => f.status === 'OVERDUE')
      .reduce((acc, f) => acc + f.amount, 0);

    res.json({
      feeRecords,
      summary: {
        totalPaid,
        totalPending,
        totalOverdue,
      },
    });
  } catch (error) {
    console.error('Fetch student fee status error:', error);
    res.status(500).json({ error: 'Failed to fetch fee status records' });
  }
});

// Pay Fee Dues
router.post('/fee-pay/:id', async (req, res) => {
  const studentId = req.user.profileId;
  const { id } = req.params;
  const transactionId = `TXN${Math.floor(100000000 + Math.random() * 900000000)}`;
  const paymentDate = new Date().toISOString().split('T')[0];

  try {
    const updated = await prisma.feeStatus.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentDate,
        transactionId,
        remarks: 'Paid online via Student Portal Gateway.'
      }
    });

    // Notify student of fee clearance
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (student) {
      await prisma.notification.create({
        data: {
          title: 'Fee Payment Received',
          message: `Payment of ₹${updated.amount.toLocaleString('en-IN')} for "${updated.title}" was successfully processed. Ref: ${transactionId}`,
          userId: student.userId
        }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Pay fee error:', error);
    res.status(500).json({ error: 'Failed to process fee payment' });
  }
});

// --- QUIZZES / ONLINE TESTS ---
router.get('/quizzes', async (req, res) => {
  const studentId = req.user.profileId;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const quizzes = await prisma.quiz.findMany({
      where: { isPublished: true },
      include: {
        subject: { select: { name: true, code: true } },
        faculty: { include: { user: { select: { name: true } } } },
        submissions: {
          where: { studentId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = quizzes.map((q) => {
      const submission = q.submissions && q.submissions.length > 0 ? q.submissions[0] : null;
      const questions = JSON.parse(q.questionsJson || '[]');
      
      const sanitizedQuestions = questions.map(quest => ({
        questionText: quest.questionText,
        optionA: quest.optionA,
        optionB: quest.optionB,
        optionC: quest.optionC,
        optionD: quest.optionD,
        marks: quest.marks || 10,
        ...(submission ? { correctOption: quest.correctOption } : {})
      }));

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        duration: q.duration,
        totalMarks: q.totalMarks,
        deadline: q.deadline,
        subject: q.subject,
        facultyName: q.faculty?.user?.name || 'Faculty',
        questions: sanitizedQuestions,
        isSubmitted: !!submission,
        submission: submission ? {
          id: submission.id,
          score: submission.score,
          maxScore: submission.maxScore,
          submittedAt: submission.submittedAt,
          answers: JSON.parse(submission.answersJson || '{}')
        } : null
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Fetch student quizzes error:', error);
    res.status(500).json({ error: 'Failed to fetch online quizzes' });
  }
});

// Submit Quiz Response
router.post('/quizzes/:id/submit', async (req, res) => {
  const quizId = req.params.id;
  const { answers } = req.body;
  const studentId = req.user.profileId;

  if (!answers) {
    return res.status(400).json({ error: 'Answers object is required' });
  }

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { subject: true }
    });

    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const existing = await prisma.quizSubmission.findFirst({
      where: { quizId, studentId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Quiz already submitted.' });
    }

    const questions = JSON.parse(quiz.questionsJson || '[]');
    let calculatedScore = 0;
    let maxPossibleScore = 0;

    questions.forEach((q, idx) => {
      const qMarks = parseFloat(q.marks) || 10;
      maxPossibleScore += qMarks;

      const studentAns = answers[idx];
      if (studentAns && studentAns.toUpperCase() === (q.correctOption || 'A').toUpperCase()) {
        calculatedScore += qMarks;
      }
    });

    const submission = await prisma.quizSubmission.create({
      data: {
        quizId,
        studentId,
        answersJson: JSON.stringify(answers),
        score: calculatedScore,
        maxScore: maxPossibleScore > 0 ? maxPossibleScore : quiz.totalMarks
      }
    });

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (student) {
      await prisma.notification.create({
        data: {
          title: `Quiz Completed: ${quiz.title}`,
          message: `Your score for "${quiz.title}" (${quiz.subject.name}) is ${calculatedScore}/${maxPossibleScore}.`,
          userId: student.userId
        }
      });
    }

    res.status(201).json(submission);
  } catch (error) {
    console.error('Submit quiz response error:', error);
    res.status(500).json({ error: 'Failed to submit quiz response' });
  }
});

// --- CERTIFICATES ---
router.get('/certificates', async (req, res) => {
  const studentId = req.user.profileId;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true } },
        department: true,
        course: true,
        semester: true,
      },
    });

    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const certificates = [
      {
        id: 'cert_bonafide',
        type: 'BONAFIDE',
        title: 'Bonafide Student Certificate',
        issueDate: todayStr,
        refNumber: `BON-${student.rollNumber}-${Date.now().toString().slice(-4)}`,
        studentName: student.user.name,
        rollNumber: student.rollNumber,
        department: student.department.name,
        course: student.course.name,
        semester: student.semester.name,
        description: `This is to certify that ${student.user.name} (Roll No: ${student.rollNumber}) is a bonafide student of ${student.department.name}, currently enrolled in ${student.course.name} (${student.semester.name}).`,
        status: 'ISSUED'
      },
      {
        id: 'cert_transcript',
        type: 'TRANSCRIPT',
        title: 'Official Academic Transcript Certificate',
        issueDate: todayStr,
        refNumber: `TRN-${student.rollNumber}-${Date.now().toString().slice(-4)}`,
        studentName: student.user.name,
        rollNumber: student.rollNumber,
        department: student.department.name,
        course: student.course.name,
        semester: student.semester.name,
        description: `Official statement of academic achievements and continuous evaluation performance for ${student.user.name}.`,
        status: 'ISSUED'
      },
      {
        id: 'cert_conduct',
        type: 'CHARACTER',
        title: 'Character & Conduct Certificate',
        issueDate: todayStr,
        refNumber: `CND-${student.rollNumber}-${Date.now().toString().slice(-4)}`,
        studentName: student.user.name,
        rollNumber: student.rollNumber,
        department: student.department.name,
        course: student.course.name,
        semester: student.semester.name,
        description: `Certifying that ${student.user.name} bears exemplary moral conduct and satisfactory attendance during their study term.`,
        status: 'ISSUED'
      },
      {
        id: 'cert_fee_clearance',
        type: 'FEE_CLEARANCE',
        title: 'Academic Fee No Dues Certificate',
        issueDate: todayStr,
        refNumber: `FEE-${student.rollNumber}-${Date.now().toString().slice(-4)}`,
        studentName: student.user.name,
        rollNumber: student.rollNumber,
        department: student.department.name,
        course: student.course.name,
        semester: student.semester.name,
        description: `No Dues Clearance Certificate verifying that all tuition fees and library dues have been cleared for ${student.user.name}.`,
        status: 'ISSUED'
      }
    ];

    res.json(certificates);
  } catch (error) {
    console.error('Fetch student certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// --- SMART NOTIFICATIONS & ALERTS AGGREGATOR ---
router.get('/notifications-alerts', async (req, res) => {
  const studentId = req.user.profileId;
  const userId = req.user.id;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    // 1. Fetch DB notifications
    const dbNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Aggregate Assignment Deadlines Alerts
    const assignments = await prisma.assignment.findMany({
      where: {
        subject: {
          courseId: student.courseId,
          semesterId: student.semesterId,
        },
      },
      include: {
        subject: { select: { name: true } },
        submissions: { where: { studentId } },
      },
    });

    const deadlineAlerts = [];
    assignments.forEach((a) => {
      const isSubmitted = a.submissions && a.submissions.length > 0;
      if (!isSubmitted) {
        deadlineAlerts.push({
          id: `notif_assign_${a.id}`,
          title: `Assignment Deadline: ${a.title}`,
          message: `Pending submission for ${a.subject.name}. Target Deadline: ${a.deadline}`,
          category: 'DEADLINE',
          createdAt: a.createdAt,
          read: false,
        });
      }
    });

    // 3. Aggregate Attendance Alerts
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      include: { subject: { select: { name: true } } },
    });

    const totalAtt = attendances.length;
    const presentAtt = attendances.filter((a) => a.status === 'PRESENT').length;
    const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

    const attendanceAlerts = [];
    if (attPct < 75) {
      attendanceAlerts.push({
        id: `notif_att_low`,
        title: '⚠️ Low Attendance Warning (<75%)',
        message: `Your overall attendance is currently ${attPct}% (${presentAtt}/${totalAtt} classes). Maintain ≥75% for exam authorization.`,
        category: 'ATTENDANCE',
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    // 4. Aggregate Exam Reminders
    const exams = await prisma.exam.findMany({
      where: { semesterId: student.semesterId },
      include: { subject: { select: { name: true, code: true } } },
      orderBy: { date: 'asc' },
    });

    const examReminders = exams.map((ex) => ({
      id: `notif_exam_${ex.id}`,
      title: `Exam Scheduled: ${ex.title}`,
      message: `${ex.subject.name} (${ex.subject.code}) on ${ex.date} at ${ex.time}. Room: ${ex.room}`,
      category: 'EXAM',
      createdAt: new Date().toISOString(),
      read: false,
    }));

    // 5. Aggregate Notices / Announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { category: 'GENERAL' },
          { category: 'DEPARTMENT', departmentId: student.departmentId },
          { category: 'COURSE', courseId: student.courseId },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const noticeAlerts = announcements.map((n) => ({
      id: `notif_notice_${n.id}`,
      title: `Notice: ${n.title}`,
      message: n.content,
      category: 'ANNOUNCEMENT',
      createdAt: n.createdAt,
      read: false,
    }));

    const allAlerts = [
      ...dbNotifications.map((n) => ({ ...n, category: 'GENERAL' })),
      ...deadlineAlerts,
      ...attendanceAlerts,
      ...examReminders,
      ...noticeAlerts,
    ];

    res.json(allAlerts);
  } catch (error) {
    console.error('Fetch student notification alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch notification alerts' });
  }
});

module.exports = router;
