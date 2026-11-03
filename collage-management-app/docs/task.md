# Task Checklist: College Management System MVP

## 1. Backend Setup (Server)
- [x] Initialize `server` directory and npm packages (`express`, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `multer`, `prisma`, `@prisma/client`)
- [x] Configure Prisma schema (`schema.prisma`) with SQLite database provider
- [x] Define database models:
  - `User` (Roles: Admin, Faculty, Student)
  - `Student` & `Faculty` profiles
  - `Department`, `Course`, `Subject`
  - `Timetable`
  - `Attendance`
  - `Assignment` & `AssignmentSubmission`
  - `Announcement`
  - `Exam` & `Result`
  - `Notification`
- [x] Run Prisma migrations to initialize SQLite database
- [x] Create a DB seeding script (`seed.js`) to prepopulate Admin, Faculty, Student, Departments, Courses, Subjects, and Timetable data
- [x] Implement backend server modules:
  - `server.js` (Express configuration)
  - Middleware: role-based JWT authentication (`auth.js`), file upload helper (`upload.js`)
  - Controllers/Routes for:
    - Auth (login, credentials verification)
    - Students / Faculty (CRUD, department assignments)
    - Timetable (generation, retrieval)
    - Attendance (marking and statistics query)
    - Assignments (creation, submission upload, grading)
    - Announcements / Notices
    - Exams & Results (grades upload, publishing)

## 2. Frontend Setup (Client)
- [x] Scaffold Vite React application in `client` folder
- [x] Install CSS and UI packages (Tailwind CSS, PostCSS, Autoprefixer, `lucide-react`, `axios`)
- [x] Configure Tailwind CSS configuration and setup `index.css` design system (modern color palette, fonts, global styles)
- [x] Set up layout structure and role sandbox selector (Admin, Faculty, Student)
- [x] Implement Authentication system (Login screen, role routing)
- [x] Implement Admin Dashboard & Management views:
  - User CRUD panels
  - Timetable creator grid
  - Announcement poster
- [x] Implement Faculty Dashboard & Management views:
  - Teaching schedule list
  - Student attendance checker grid
  - Assignment creator & grader list
  - Exam marks publisher
- [x] Implement Student Dashboard & Portal:
  - Animated attendance widget
  - Timetable grid
  - Assignment submission panel (with simulated file upload)
  - Result transcript / report card
  - Notices list
- [x] Incorporate Live Notification / Toast Notification overlay

## 3. Integration & Verification
- [x] Connect client Axios calls to Express API endpoints
- [x] Verify role switching functions dynamically update dashboards
- [x] Test the entire academic workflow:
  - Admin adds Course/Subject and assigns Faculty -> Timetable shows update.
  - Faculty marks Student as present/absent -> Student attendance percentage updates immediately.
  - Faculty publishes Assignment -> Student receives Notification and submits -> Faculty grades submission -> Student views grades.
- [x] Run production builds and ensure zero compilation errors

