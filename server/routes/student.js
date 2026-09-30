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
      where: {
        subject: {
          courseId: student.courseId,
          semesterId: student.semesterId,
        },
      },
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

module.exports = router;
