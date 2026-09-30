const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database...');
  await prisma.feeStatus.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.result.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.course.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding initial data...');

  // 1. Create Semesters
  const sem1 = await prisma.semester.create({
    data: { number: 1, name: 'Semester 1' },
  });
  const sem2 = await prisma.semester.create({
    data: { number: 2, name: 'Semester 2' },
  });
  console.log('Semesters created.');

  // 2. Create Departments
  const csDept = await prisma.department.create({
    data: { name: 'Computer Science & Engineering', code: 'CS' },
  });
  const eeDept = await prisma.department.create({
    data: { name: 'Electrical Engineering', code: 'EE' },
  });
  console.log('Departments created.');

  // 3. Create Courses
  const csCourse = await prisma.course.create({
    data: { name: 'B.Tech Computer Science', code: 'BTECH-CS', departmentId: csDept.id },
  });
  const eeCourse = await prisma.course.create({
    data: { name: 'B.Tech Electrical Engineering', code: 'BTECH-EE', departmentId: eeDept.id },
  });
  console.log('Courses created.');

  // 4. Create Subjects (without faculty first)
  const cs101 = await prisma.subject.create({
    data: { name: 'Introduction to Programming', code: 'CS101', credits: 4, courseId: csCourse.id, semesterId: sem1.id },
  });
  const cs102 = await prisma.subject.create({
    data: { name: 'Data Structures & Algorithms', code: 'CS102', credits: 4, courseId: csCourse.id, semesterId: sem1.id },
  });
  const ee101 = await prisma.subject.create({
    data: { name: 'Basic Electrical Engineering', code: 'EE101', credits: 4, courseId: eeCourse.id, semesterId: sem1.id },
  });
  const ee102 = await prisma.subject.create({
    data: { name: 'Network Analysis', code: 'EE102', credits: 4, courseId: eeCourse.id, semesterId: sem1.id },
  });
  console.log('Subjects created.');

  // Hash password helper
  const hashPassword = async (pass) => {
    return await bcrypt.hash(pass, 10);
  };

  // 5. Create Users
  // Admin
  const adminPassword = await hashPassword('admin123');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@college.com',
      password: adminPassword,
      name: 'Rajesh Sharma',
      role: 'ADMIN',
    },
  });

  // Co-Admin
  const coAdminPassword = await hashPassword('coadmin123');
  const coAdminUser = await prisma.user.create({
    data: {
      email: 'coadmin@college.com',
      password: coAdminPassword,
      name: 'Priya Patel',
      role: 'CO_ADMIN',
    },
  });

  // Faculty
  const facultyPassword = await hashPassword('faculty123');
  const f1User = await prisma.user.create({
    data: {
      email: 'faculty1@college.com',
      password: facultyPassword,
      name: 'Dr. Ramesh Verma',
      role: 'FACULTY',
    },
  });
  const f1Profile = await prisma.faculty.create({
    data: {
      userId: f1User.id,
      departmentId: csDept.id,
      phone: '9876543210',
    },
  });

  const f2User = await prisma.user.create({
    data: {
      email: 'faculty2@college.com',
      password: facultyPassword,
      name: 'Prof. Sunita Rao',
      role: 'FACULTY',
    },
  });
  const f2Profile = await prisma.faculty.create({
    data: {
      userId: f2User.id,
      departmentId: eeDept.id,
      phone: '9876543211',
    },
  });

  // Assign faculty to subjects
  await prisma.subject.update({
    where: { id: cs101.id },
    data: { facultyId: f1Profile.id },
  });
  await prisma.subject.update({
    where: { id: cs102.id },
    data: { facultyId: f1Profile.id },
  });
  await prisma.subject.update({
    where: { id: ee101.id },
    data: { facultyId: f2Profile.id },
  });
  await prisma.subject.update({
    where: { id: ee102.id },
    data: { facultyId: f2Profile.id },
  });

  // Students
  const studentPassword = await hashPassword('student123');
  const s1User = await prisma.user.create({
    data: {
      email: 'student1@college.com',
      password: studentPassword,
      name: 'Aarav Gupta',
      role: 'STUDENT',
    },
  });
  const s1Profile = await prisma.student.create({
    data: {
      userId: s1User.id,
      rollNumber: 'CS202601',
      phone: '9998887771',
      section: 'A',
      departmentId: csDept.id,
      courseId: csCourse.id,
      semesterId: sem1.id,
    },
  });

  const s2User = await prisma.user.create({
    data: {
      email: 'student2@college.com',
      password: studentPassword,
      name: 'Ananya Iyer',
      role: 'STUDENT',
    },
  });
  const s2Profile = await prisma.student.create({
    data: {
      userId: s2User.id,
      rollNumber: 'EE202601',
      phone: '9998887772',
      section: 'A',
      departmentId: eeDept.id,
      courseId: eeCourse.id,
      semesterId: sem1.id,
    },
  });
  console.log('Users (Admin, Co-Admin, Faculty, Students) and Profiles created.');

  // 6. Create Timetables
  // CS Semester 1 (Section A) Timetable
  await prisma.timetable.createMany({
    data: [
      {
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '09:50',
        room: 'Room 101',
        section: 'A',
        subjectId: cs101.id,
        semesterId: sem1.id,
      },
      {
        dayOfWeek: 'Monday',
        startTime: '10:00',
        endTime: '10:50',
        room: 'Room 101',
        section: 'A',
        subjectId: cs102.id,
        semesterId: sem1.id,
      },
      {
        dayOfWeek: 'Wednesday',
        startTime: '09:00',
        endTime: '09:50',
        room: 'Room 101',
        section: 'A',
        subjectId: cs101.id,
        semesterId: sem1.id,
      },
      {
        dayOfWeek: 'Friday',
        startTime: '11:00',
        endTime: '11:50',
        room: 'Room 102',
        section: 'A',
        subjectId: cs102.id,
        semesterId: sem1.id,
      },
    ],
  });

  // EE Semester 1 (Section A) Timetable
  await prisma.timetable.createMany({
    data: [
      {
        dayOfWeek: 'Tuesday',
        startTime: '09:00',
        endTime: '09:50',
        room: 'Room 201',
        section: 'A',
        subjectId: ee101.id,
        semesterId: sem1.id,
      },
      {
        dayOfWeek: 'Thursday',
        startTime: '10:00',
        endTime: '10:50',
        room: 'Room 201',
        section: 'A',
        subjectId: ee102.id,
        semesterId: sem1.id,
      },
    ],
  });
  console.log('Timetable created.');

  // 7. Create Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Welcome to the New Academic Portal!',
        content: 'We are thrilled to launch the new College Management System. Students, faculty, and administrators can now access schedules, marks, attendance, and assignments digitally.',
        category: 'GENERAL',
        createdById: adminUser.id,
      },
      {
        title: 'Midterm Examination Schedule Released',
        content: 'The Midterm examinations are scheduled to start from July 10, 2026. Please check the Examination tab in your student portal for subject-wise details.',
        category: 'GENERAL',
        createdById: adminUser.id,
      },
      {
        title: 'Python Workshop Registration',
        content: 'The CS Department is organizing a 2-day hands-on Python Workshop. Register before June 30.',
        category: 'DEPARTMENT',
        departmentId: csDept.id,
        createdById: adminUser.id,
      },
    ],
  });
  console.log('Announcements created.');

  // 8. Create Exams
  const csExam = await prisma.exam.create({
    data: {
      title: 'CS101 Midterm Examination',
      date: '2026-07-10',
      time: '10:00 AM',
      room: 'Exam Hall 1',
      subjectId: cs101.id,
      semesterId: sem1.id,
    },
  });

  const eeExam = await prisma.exam.create({
    data: {
      title: 'EE101 Midterm Examination',
      date: '2026-07-11',
      time: '10:00 AM',
      room: 'Exam Hall 2',
      subjectId: ee101.id,
      semesterId: sem1.id,
    },
  });
  console.log('Exams created.');

  // 9. Create Results (Pre-populate with previous quiz results)
  await prisma.result.createMany({
    data: [
      {
        studentId: s1Profile.id,
        subjectId: cs101.id,
        marks: 85,
        maxMarks: 100,
        grade: 'A',
        remarks: 'Excellent performance in Programming fundamentals.',
      },
      {
        studentId: s2Profile.id,
        subjectId: ee101.id,
        marks: 92,
        maxMarks: 100,
        grade: 'A+',
        remarks: 'Outstanding performance.',
      },
    ],
  });
  console.log('Results created.');

  // 10. Create Fee Status records
  await prisma.feeStatus.createMany({
    data: [
      {
        title: 'Semester 1 Tuition & Academic Fee',
        amount: 45000,
        dueDate: '2026-06-30',
        status: 'PAID',
        paymentDate: '2026-06-15',
        transactionId: 'TXN984210543',
        remarks: 'Paid via Online Banking',
        studentId: s1Profile.id,
      },
      {
        title: 'Semester 2 Tuition & Exam Fee',
        amount: 48000,
        dueDate: '2026-11-30',
        status: 'PENDING',
        remarks: 'Upcoming installment due',
        studentId: s1Profile.id,
      },
      {
        title: 'Semester 1 Tuition & Lab Fee',
        amount: 45000,
        dueDate: '2026-06-15',
        status: 'OVERDUE',
        remarks: 'Late payment alert generated',
        studentId: s2Profile.id,
      },
    ],
  });
  console.log('Fee Status records created.');

  // 11. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: 'Welcome!',
        message: 'Welcome to your student portal, Aarav. Check your timetable and announcements.',
        userId: s1User.id,
      },
      {
        title: 'Welcome!',
        message: 'Welcome to your student portal, Ananya. Check your timetable and announcements.',
        userId: s2User.id,
      },
      {
        title: 'Welcome!',
        message: 'Welcome to the Faculty dashboard, Dr. Ramesh. You can manage your classes and grading here.',
        userId: f1User.id,
      },
      {
        title: 'Welcome!',
        message: 'Welcome to the Administration portal, Priya. You can manage academic operations here.',
        userId: coAdminUser.id,
      },
    ],
  });
  console.log('Notifications created.');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
