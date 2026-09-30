const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const quizzes = await prisma.quiz.findMany({
    include: { subject: true, faculty: true }
  });
  console.log('--- QUIZZES IN DB ---', quizzes.length);
  console.log(JSON.stringify(quizzes, null, 2));

  const students = await prisma.student.findMany({
    include: { user: true }
  });
  console.log('--- STUDENTS IN DB ---');
  students.forEach(s => console.log('Student:', s.id, s.user.name, 'Course:', s.courseId, 'Dept:', s.departmentId, 'Sem:', s.semesterId));

  const subjects = await prisma.subject.findMany();
  console.log('--- SUBJECTS IN DB ---');
  subjects.forEach(sub => console.log('Subject:', sub.id, sub.name, 'Course:', sub.courseId, 'Faculty:', sub.facultyId));
}

check().then(() => prisma.$disconnect()).catch(console.error);
