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
      where: {
        courseId: subject.courseId,
        semesterId: subject.semesterId,
      },
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

module.exports = router;
