const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get Departments
router.get('/departments', authenticateJWT, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(departments);
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get Semesters
router.get('/semesters', authenticateJWT, async (req, res) => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: { number: 'asc' },
    });
    res.json(semesters);
  } catch (error) {
    console.error('Fetch semesters error:', error);
    res.status(500).json({ error: 'Failed to fetch semesters' });
  }
});

// Get Courses
router.get('/courses', authenticateJWT, async (req, res) => {
  const { departmentId } = req.query;
  try {
    const query = {};
    if (departmentId) {
      query.departmentId = departmentId;
    }
    const courses = await prisma.course.findMany({
      where: query,
      include: { department: true },
      orderBy: { name: 'asc' },
    });
    res.json(courses);
  } catch (error) {
    console.error('Fetch courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get Subjects
router.get('/subjects', authenticateJWT, async (req, res) => {
  const { courseId, semesterId, facultyId } = req.query;
  try {
    const query = {};
    if (courseId) query.courseId = courseId;
    if (semesterId) query.semesterId = semesterId;
    if (facultyId) query.facultyId = facultyId;

    const subjects = await prisma.subject.findMany({
      where: query,
      include: {
        course: true,
        semester: true,
        faculty: {
          include: { user: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(subjects);
  } catch (error) {
    console.error('Fetch subjects error:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get Timetable (Dynamic query)
router.get('/timetables', authenticateJWT, async (req, res) => {
  const { semesterId, section, facultyId } = req.query;
  try {
    const query = {};
    if (semesterId) query.semesterId = semesterId;
    if (section) query.section = section;
    if (facultyId) {
      // Find subjects taught by this faculty member
      query.subject = {
        facultyId: facultyId,
      };
    }

    const timetable = await prisma.timetable.findMany({
      where: query,
      include: {
        subject: {
          include: {
            faculty: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
        semester: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
    res.json(timetable);
  } catch (error) {
    console.error('Fetch timetables error:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// Get Announcements (Filter based on role)
router.get('/announcements', authenticateJWT, async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = {};

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: id },
      });
      if (student) {
        query = {
          OR: [
            { category: 'GENERAL' },
            {
              category: 'DEPARTMENT',
              departmentId: student.departmentId,
            },
            {
              category: 'COURSE',
              courseId: student.courseId,
            },
          ],
        };
      }
    } else if (role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: id },
      });
      if (faculty) {
        query = {
          OR: [
            { category: 'GENERAL' },
            {
              category: 'DEPARTMENT',
              departmentId: faculty.departmentId,
            },
          ],
        };
      }
    }

    const announcements = await prisma.announcement.findMany({
      where: query,
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(announcements);
  } catch (error) {
    console.error('Fetch announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get User Notifications
router.get('/notifications', authenticateJWT, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark Notification as Read
router.put('/notifications/:id/read', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const notif = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notif || notif.userId !== req.user.id) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Get Exam Schedule
router.get('/exams', authenticateJWT, async (req, res) => {
  const { semesterId } = req.query;
  try {
    const query = {};
    if (semesterId) {
      query.semesterId = semesterId;
    } else if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user.id },
      });
      if (student) {
        query.semesterId = student.semesterId;
      }
    }

    const exams = await prisma.exam.findMany({
      where: query,
      include: {
        subject: {
          include: {
            faculty: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
        semester: true,
      },
      orderBy: { date: 'asc' },
    });
    res.json(exams);
  } catch (error) {
    console.error('Fetch exams error:', error);
    res.status(500).json({ error: 'Failed to fetch examinations schedule' });
  }
});

// Mark All Notifications as Read
router.put('/notifications/read-all', authenticateJWT, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Clear Notifications
router.delete('/notifications/clear', authenticateJWT, async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id },
    });
    res.json({ message: 'Notifications cleared' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

module.exports = router;
