const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply Admin Role Check to all routes in this file
router.use(authenticateJWT);
router.use(requireRole(['ADMIN']));

// --- STATISTICS ---
router.get('/stats', async (req, res) => {
  try {
    const studentCount = await prisma.student.count();
    const facultyCount = await prisma.faculty.count();
    const courseCount = await prisma.course.count();
    const departmentCount = await prisma.department.count();

    // Attendance summary
    const totalAttendance = await prisma.attendance.count();
    const presentAttendance = await prisma.attendance.count({
      where: { status: 'PRESENT' },
    });

    const attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 100;

    res.json({
      students: studentCount,
      faculty: facultyCount,
      courses: courseCount,
      departments: departmentCount,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// --- DEPARTMENT MANAGEMENT ---
router.post('/departments', async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });

  try {
    const dept = await prisma.department.create({ data: { name, code: code.toUpperCase() } });
    res.status(201).json(dept);
  } catch (error) {
    console.error('Create dept error:', error);
    res.status(500).json({ error: 'Failed to create department. Code might be duplicate.' });
  }
});

router.put('/departments/:id', async (req, res) => {
  const { name, code } = req.body;
  try {
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: { name, code: code ? code.toUpperCase() : undefined },
    });
    res.json(dept);
  } catch (error) {
    console.error('Update dept error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete dept error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// --- COURSE MANAGEMENT ---
router.post('/courses', async (req, res) => {
  const { name, code, departmentId } = req.body;
  if (!name || !code || !departmentId) return res.status(400).json({ error: 'Name, code, and departmentId are required' });

  try {
    const course = await prisma.course.create({ data: { name, code: code.toUpperCase(), departmentId } });
    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course. Code might be duplicate.' });
  }
});

router.put('/courses/:id', async (req, res) => {
  const { name, code, departmentId } = req.body;
  try {
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { name, code: code ? code.toUpperCase() : undefined, departmentId },
    });
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// --- SUBJECT MANAGEMENT ---
router.post('/subjects', async (req, res) => {
  const { name, code, credits, courseId, semesterId, facultyId } = req.body;
  if (!name || !code || !credits || !courseId || !semesterId) {
    return res.status(400).json({ error: 'Name, code, credits, courseId, and semesterId are required' });
  }

  try {
    const subject = await prisma.subject.create({
      data: {
        name,
        code: code.toUpperCase(),
        credits: parseInt(credits),
        courseId,
        semesterId,
        facultyId: facultyId || null,
      },
    });
    res.status(201).json(subject);
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Failed to create subject. Code might be duplicate.' });
  }
});

router.put('/subjects/:id', async (req, res) => {
  const { name, code, credits, courseId, semesterId, facultyId } = req.body;
  try {
    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data: {
        name,
        code: code ? code.toUpperCase() : undefined,
        credits: credits ? parseInt(credits) : undefined,
        courseId,
        semesterId,
        facultyId: facultyId || null,
      },
    });
    res.json(subject);
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

router.delete('/subjects/:id', async (req, res) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// --- STUDENT MANAGEMENT ---
router.get('/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true, email: true } },
        department: true,
        course: true,
        semester: true,
      },
    });
    res.json(students);
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.post('/students', async (req, res) => {
  const { name, email, password, rollNumber, phone, section, departmentId, courseId, semesterId } = req.body;

  if (!name || !email || !password || !rollNumber || !section || !departmentId || !courseId || !semesterId) {
    return res.status(400).json({ error: 'All fields except phone are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'STUDENT',
        },
      });

      const profile = await tx.student.create({
        data: {
          userId: user.id,
          rollNumber,
          phone,
          section,
          departmentId,
          courseId,
          semesterId,
        },
      });

      // Welcome Notification
      await tx.notification.create({
        data: {
          title: 'Welcome to Academic Portal',
          message: `Hello ${name}, your academic profile has been created successfully. Welcome aboard!`,
          userId: user.id,
        },
      });

      return profile;
    });

    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student. Email or Roll Number may already exist.' });
  }
});

router.put('/students/:id', async (req, res) => {
  const { name, email, rollNumber, phone, section, departmentId, courseId, semesterId } = req.body;
  try {
    const existingStudent = await prisma.student.findUnique({
      where: { id: req.params.id },
    });

    if (!existingStudent) return res.status(404).json({ error: 'Student not found' });

    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: req.params.id },
        data: {
          rollNumber,
          phone,
          section,
          departmentId,
          courseId,
          semesterId,
        },
      });

      await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          name,
          email,
        },
      });
    });

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student profile' });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    await prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id: student.id } });
      await tx.user.delete({ where: { id: student.userId } });
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// --- FACULTY MANAGEMENT ---
router.get('/faculty', async (req, res) => {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        user: { select: { name: true, email: true } },
        department: true,
      },
    });
    res.json(faculty);
  } catch (error) {
    console.error('Fetch faculty error:', error);
    res.status(500).json({ error: 'Failed to fetch faculty list' });
  }
});

router.post('/faculty', async (req, res) => {
  const { name, email, password, phone, departmentId } = req.body;

  if (!name || !email || !password || !departmentId) {
    return res.status(400).json({ error: 'Name, email, password, and departmentId are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const faculty = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'FACULTY',
        },
      });

      return await tx.faculty.create({
        data: {
          userId: user.id,
          phone,
          departmentId,
        },
      });
    });

    res.status(201).json(faculty);
  } catch (error) {
    console.error('Create faculty error:', error);
    res.status(500).json({ error: 'Failed to create faculty. Email may already exist.' });
  }
});

router.put('/faculty/:id', async (req, res) => {
  const { name, email, phone, departmentId } = req.body;
  try {
    const existingFaculty = await prisma.faculty.findUnique({
      where: { id: req.params.id },
    });

    if (!existingFaculty) return res.status(404).json({ error: 'Faculty not found' });

    await prisma.$transaction(async (tx) => {
      await tx.faculty.update({
        where: { id: req.params.id },
        data: {
          phone,
          departmentId,
        },
      });

      await tx.user.update({
        where: { id: existingFaculty.userId },
        data: {
          name,
          email,
        },
      });
    });

    res.json({ message: 'Faculty updated successfully' });
  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({ error: 'Failed to update faculty profile' });
  }
});

router.delete('/faculty/:id', async (req, res) => {
  try {
    const faculty = await prisma.faculty.findUnique({ where: { id: req.params.id } });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    await prisma.$transaction(async (tx) => {
      await tx.faculty.delete({ where: { id: faculty.id } });
      await tx.user.delete({ where: { id: faculty.userId } });
    });

    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    console.error('Delete faculty error:', error);
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
});

// --- TIMETABLE GENERATION ---
router.post('/timetables', async (req, res) => {
  const { dayOfWeek, startTime, endTime, room, section, subjectId, semesterId } = req.body;

  if (!dayOfWeek || !startTime || !endTime || !room || !section || !subjectId || !semesterId) {
    return res.status(400).json({ error: 'All fields are required to create timetable' });
  }

  try {
    // Check room conflicts
    const conflict = await prisma.timetable.findFirst({
      where: {
        dayOfWeek,
        startTime,
        room,
      },
    });

    if (conflict) {
      return res.status(400).json({ error: `Room conflict! ${room} is already booked on ${dayOfWeek} at ${startTime}` });
    }

    const slot = await prisma.timetable.create({
      data: {
        dayOfWeek,
        startTime,
        endTime,
        room,
        section,
        subjectId,
        semesterId,
      },
    });
    res.status(201).json(slot);
  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({ error: 'Failed to create timetable slot' });
  }
});

router.delete('/timetables/:id', async (req, res) => {
  try {
    await prisma.timetable.delete({ where: { id: req.params.id } });
    res.json({ message: 'Timetable slot deleted successfully' });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ error: 'Failed to delete timetable slot' });
  }
});

// --- ANNOUNCEMENT ---
router.post('/announcements', async (req, res) => {
  const { title, content, category, departmentId, courseId } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, content, and category are required' });
  }

  try {
    const ann = await prisma.announcement.create({
      data: {
        title,
        content,
        category,
        departmentId: departmentId || null,
        courseId: courseId || null,
        createdById: req.user.id,
      },
    });

    // Notify users
    let usersToNotify = [];
    if (category === 'GENERAL') {
      usersToNotify = await prisma.user.findMany({ select: { id: true } });
    } else if (category === 'DEPARTMENT' && departmentId) {
      const studs = await prisma.student.findMany({ where: { departmentId }, select: { userId: true } });
      const facs = await prisma.faculty.findMany({ where: { departmentId }, select: { userId: true } });
      usersToNotify = [
        ...studs.map((s) => ({ id: s.userId })),
        ...facs.map((f) => ({ id: f.userId })),
      ];
    }

    if (usersToNotify.length > 0) {
      await prisma.notification.createMany({
        data: usersToNotify.map((u) => ({
          title: `New Notice: ${title}`,
          message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          userId: u.id,
        })),
      });
    }

    res.status(201).json(ann);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// --- EXAMS ---
router.post('/exams', async (req, res) => {
  const { title, date, time, room, subjectId, semesterId } = req.body;

  if (!title || !date || !time || !room || !subjectId || !semesterId) {
    return res.status(400).json({ error: 'All exam details are required' });
  }

  try {
    const exam = await prisma.exam.create({
      data: {
        title,
        date,
        time,
        room,
        subjectId,
        semesterId,
      },
    });

    // Notify students of this semester
    const students = await prisma.student.findMany({
      where: { semesterId },
      select: { userId: true },
    });

    if (students.length > 0) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      await prisma.notification.createMany({
        data: students.map((s) => ({
          title: 'Exam Scheduled',
          message: `New Exam scheduled: ${title} for ${subject ? subject.name : 'Subject'} on ${date} at ${time}.`,
          userId: s.userId,
        })),
      });
    }

    res.status(201).json(exam);
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: 'Failed to create exam schedule' });
  }
});

module.exports = router;
