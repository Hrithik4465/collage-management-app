const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply Admin / Co-Admin Role Check to all routes in this file
router.use(authenticateJWT);
router.use(requireRole(['ADMIN', 'CO_ADMIN']));

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

// --- ADVANCED USER MANAGEMENT (ALL USERS, PASSWORD RESET, ACTIVATION, BULK IMPORT) ---

// 1. Get All Users Across All Roles
router.get('/all-users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: {
          include: {
            department: true,
            course: true,
            semester: true,
          },
        },
        faculty: {
          include: {
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Fetch all users error:', error);
    res.status(500).json({ error: 'Failed to fetch user directory' });
  }
});

// 2. Reset User Password
router.put('/users/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword },
    });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// 3. Activate / Deactivate Account
router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: req.body.isActive !== undefined ? req.body.isActive : !user.isActive },
    });

    res.json({ message: `Account ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`, user: updatedUser });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ error: 'Failed to update account status' });
  }
});

// 4. Bulk Import Users from Excel / CSV
router.post('/users/bulk-import', async (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'No user records provided for bulk import' });
  }

  try {
    const departments = await prisma.department.findMany();
    const courses = await prisma.course.findMany();
    const semesters = await prisma.semester.findMany();

    const defaultDept = departments[0];
    const defaultCourse = courses[0];
    const defaultSem = semesters[0];

    let createdCount = 0;
    const errors = [];

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (!u.email || !u.name) {
        errors.push(`Row ${i + 1}: Name and Email are required`);
        continue;
      }

      const role = (u.role || 'STUDENT').toUpperCase();
      const rawPass = u.password || 'college123';
      const hashedPassword = await bcrypt.hash(rawPass, 10);

      try {
        await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name: u.name,
              email: u.email.toLowerCase().trim(),
              password: hashedPassword,
              role,
              isActive: u.isActive !== undefined ? Boolean(u.isActive) : true,
            },
          });

          if (role === 'STUDENT') {
            const dept = departments.find(d => d.code === (u.departmentCode || '').toUpperCase()) || defaultDept;
            const crs = courses.find(c => c.code === (u.courseCode || '').toUpperCase()) || defaultCourse;
            const sem = semesters.find(s => s.number === parseInt(u.semesterNumber)) || defaultSem;

            await tx.student.create({
              data: {
                userId: newUser.id,
                rollNumber: u.rollNumber || `ROLL${Date.now()}${i}`,
                phone: u.phone || null,
                section: u.section || 'A',
                departmentId: dept.id,
                courseId: crs.id,
                semesterId: sem.id,
              },
            });
          } else if (role === 'FACULTY') {
            const dept = departments.find(d => d.code === (u.departmentCode || '').toUpperCase()) || defaultDept;
            await tx.faculty.create({
              data: {
                userId: newUser.id,
                phone: u.phone || null,
                departmentId: dept.id,
              },
            });
          }
        });
        createdCount++;
      } catch (err) {
        console.error(`Import row ${i + 1} failed:`, err);
        errors.push(`Row ${i + 1} (${u.email}): Email or Roll Number already exists`);
      }
    }

    res.json({
      message: `Bulk import completed: ${createdCount} accounts created successfully.`,
      createdCount,
      errors,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Bulk import process failed' });
  }
});

// 5. Attendance Reports Analytics & Low Attendance Watchlist
router.get('/reports/attendance', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true, email: true } },
        department: true,
        semester: true,
        attendances: {
          include: {
            subject: true,
          },
        },
      },
    });

    const report = students.map((s) => {
      const total = s.attendances.length;
      const present = s.attendances.filter((a) => a.status === 'PRESENT').length;
      const absent = total - present;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

      return {
        studentId: s.id,
        rollNumber: s.rollNumber,
        name: s.user?.name || 'Student',
        email: s.user?.email || '',
        department: s.department?.code || '',
        semester: s.semester?.name || '',
        totalClasses: total,
        presentClasses: present,
        absentClasses: absent,
        percentage,
        isWarning: percentage < 75,
      };
    });

    const overallAttendance = report.length > 0
      ? Math.round(report.reduce((acc, r) => acc + r.percentage, 0) / report.length)
      : 100;

    const lowAttendanceWatchlist = report.filter((r) => r.percentage < 75);

    res.json({
      overallAttendance,
      studentsReport: report,
      lowAttendanceWatchlist,
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ error: 'Failed to generate attendance reports' });
  }
});

// 6. Assignment Monitoring Metrics
router.get('/assignments/monitoring', async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        subject: true,
        faculty: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalStudents = await prisma.student.count();

    const monitoringData = assignments.map((a) => {
      const submissionCount = a.submissions.length;
      const gradedCount = a.submissions.filter((sub) => sub.status === 'GRADED').length;
      const pendingCount = submissionCount - gradedCount;
      const submissionRate = totalStudents > 0 ? Math.round((submissionCount / totalStudents) * 100) : 0;

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        deadline: a.deadline,
        subjectName: a.subject?.name || '',
        subjectCode: a.subject?.code || '',
        facultyName: a.faculty?.user?.name || '',
        submissionCount,
        gradedCount,
        pendingCount,
        submissionRate,
      };
    });

    res.json(monitoringData);
  } catch (error) {
    console.error('Assignment monitoring error:', error);
    res.status(500).json({ error: 'Failed to fetch assignment monitoring metrics' });
  }
});

// 7. Bulk Publish Exam Results
router.post('/publish-results', async (req, res) => {
  const { results } = req.body;
  if (!Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: 'No exam results provided to publish' });
  }

  try {
    const published = [];
    for (const r of results) {
      if (!r.studentId || !r.subjectId || r.marks === undefined) continue;

      const numericMarks = parseFloat(r.marks);
      const maxMarks = parseFloat(r.maxMarks || 100);
      const percentage = (numericMarks / maxMarks) * 100;

      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';

      const result = await prisma.result.create({
        data: {
          studentId: r.studentId,
          subjectId: r.subjectId,
          examId: r.examId || null,
          marks: numericMarks,
          maxMarks,
          grade,
          remarks: r.remarks || 'Exam result published',
        },
      });

      // Notify student
      const student = await prisma.student.findUnique({
        where: { id: r.studentId },
        select: { userId: true },
      });
      if (student) {
        await prisma.notification.create({
          data: {
            title: 'Exam Result Published',
            message: `Your result for ${r.subjectName || 'Subject'} has been published. Score: ${numericMarks}/${maxMarks} (${grade}).`,
            userId: student.userId,
          },
        });
      }
      published.push(result);
    }

    res.json({ message: `Successfully published ${published.length} exam results.`, publishedCount: published.length });
  } catch (error) {
    console.error('Publish results error:', error);
    res.status(500).json({ error: 'Failed to publish exam results' });
  }
});

// 8. Fee Status Management (Fetch All & Create/Update)
router.get('/fee-status', async (req, res) => {
  try {
    const fees = await prisma.feeStatus.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: true,
            course: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(fees);
  } catch (error) {
    console.error('Fetch fee status error:', error);
    res.status(500).json({ error: 'Failed to fetch fee status records' });
  }
});

router.post('/fee-status', async (req, res) => {
  const { studentId, title, amount, dueDate, status, paymentDate, transactionId, remarks } = req.body;

  if (!studentId || !title || !amount || !dueDate) {
    return res.status(400).json({ error: 'Student, Title, Amount, and Due Date are required' });
  }

  try {
    const feeRecord = await prisma.feeStatus.create({
      data: {
        studentId,
        title,
        amount: parseFloat(amount),
        dueDate,
        status: status || 'PENDING',
        paymentDate: status === 'PAID' ? (paymentDate || new Date().toISOString().split('T')[0]) : (paymentDate || null),
        transactionId: status === 'PAID' ? (transactionId || `TXN${Date.now()}`) : (transactionId || null),
        remarks: remarks || '',
      },
    });

    // Notify student of fee record update
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true, user: { select: { name: true } } },
    });

    if (student) {
      await prisma.notification.create({
        data: {
          title: `Fee Notice: ${title}`,
          message: `Fee record updated. Amount: ₹${amount}, Status: ${status || 'PENDING'}, Due: ${dueDate}.`,
          userId: student.userId,
        },
      });
    }

    res.status(201).json(feeRecord);
  } catch (error) {
    console.error('Create fee status error:', error);
    res.status(500).json({ error: 'Failed to record fee status' });
  }
});

module.exports = router;
