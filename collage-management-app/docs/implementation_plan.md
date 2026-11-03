# Implementation Plan - College Management System (MVP)

We will build a responsive web application that implements the College Management System MVP. To deliver a premium experience, the application will include:
1. **Interactive Multi-Role Sandbox**: A floating controller on the side that lets you instantly switch between Administrator, Faculty, and Student roles to explore their respective views and dashboards.
2. **Mobile Frame Emulator**: An embedded interactive mobile viewport option. Since the SRS specifies mobile application features for Students and Faculty, we can display a mock mobile phone interface inside the web app, allowing you to preview the responsive mobile layouts in real time.
3. **Rich Visual Styling**: Curated color palettes, modern fonts (e.g., Inter/Outfit), subtle gradients, card hover animations, and dynamic statistics charts.

---

## User Review Required

> [!IMPORTANT]
> Please review the **Open Questions** below and provide your preferences. Your response will guide the next step of scaffolding and writing code.

---

## Open Questions

> [!IMPORTANT]
> ### 1. Tailwind CSS Version
> The SRS specifies using Tailwind CSS. Which version of Tailwind CSS would you prefer to use?
> - **Tailwind CSS v4** (Latest, faster compilation, uses CSS-first configuration)
> - **Tailwind CSS v3** (Traditional configuration via `tailwind.config.js`)
>
> ### 2. Backend & Persistence Architecture
> We can build this MVP in one of two ways:
> - **Option A: Client-Side Interactive MVP (Recommended for Demo/Testing)**
>   - Built as a React SPA running completely in the browser.
>   - All database state is simulated using an in-memory or `localStorage` database.
>   - **Pros**: Zero installation required for databases or servers; works instantly on any machine; allows seamless role switching without auth session friction; highly interactive and reliable for UX evaluation.
> - **Option B: Full-Stack React + Express + Prisma + SQLite/PostgreSQL**
>   - Separate `client` (Vite + React) and `server` (Node + Express + Prisma ORM) directories.
>   - Uses SQLite (or PostgreSQL) as the database.
>   - **Pros**: Ready for production deployment with actual DB storage and API endpoints.
>   - **Cons**: Requires running multiple servers locally and ensuring PostgreSQL/database configuration matches your local machine.

---

## Proposed Changes

We will scaffold a project named `college-management-app` inside the workspace. The file layout below assumes a React-based client workspace.

### Core Modules & Components

#### [NEW] [index.css](file:///c:/Users/vipno/OneDrive/Desktop/collage-management-app/src/index.css)
Core stylesheet setting up Tailwind CSS, CSS variables for our color system (sleek dark/indigo theme, brand colors), custom animation keyframes, and custom font definitions.

#### [NEW] [App.jsx](file:///c:/Users/vipno/OneDrive/Desktop/collage-management-app/src/App.jsx)
Main router and layout shell. Implements:
- Multi-role sandbox header/switcher.
- Role-based routing (Admin, Faculty, Student routes).
- Shared notifications context provider to send real-time toast alerts across roles.

#### [NEW] [db.js](file:///c:/Users/vipno/OneDrive/Desktop/collage-management-app/src/utils/db.js)
The data access layer.
- If Option A is chosen: Holds initial mock data (departments, courses, timetables, assignments, exam schedules) and implements CRUD operations reading/writing to `localStorage`.
- If Option B is chosen: Contains Axios client configs pointing to the Node/Express backend APIs.

#### [NEW] [AdminDashboard.jsx](file:///c:/Users/vipno/OneDrive/Desktop/collage-management-app/src/components/admin/AdminDashboard.jsx)
Admin view displaying:
- Dynamic counters (Students, Faculty, Courses).
- User Management Panel (Add/Edit/Delete Student, Faculty, Departments).
- Timetable Editor: Grid interface to assign subjects, faculty, and rooms to days/hours.
- Announcement Creator.

#### [NEW] [FacultyDashboard.jsx](file:///c:/Users/vipno/OneDrive/Desktop/collage-management-app/src/components/faculty/FacultyDashboard.jsx)
Faculty view displaying:
- Teaching timetable for the day.
- Attendance Sheet: Checkboxes to mark students present/absent for specific course sections.
- Assignment Manager: Form to create assignments, define deadlines, and grade submitted student assignments with remarks.
- Result Publisher: Enter exam scores for students in assigned courses.

#### [NEW] [StudentDashboard.jsx](file:///c:/Users/vipno/OneDrive/Desktop/collage-management-app/src/components/student/StudentDashboard.jsx)
Student view displaying:
- Animated attendance percentage (overall and course-wise).
- Timetable for the student's semester/section.
- Assignments checklist with download, submission form, and submission status.
- Exam Schedule and Grades/Marks viewer.
- Announcements feed.

---

## Verification Plan

### Automated Tests
- Verification of Vite build configuration: Run `npm run build` to ensure code compiles.
- Basic component rendering checks if testing environment is configured.

### Manual Verification
1. **Multi-Role Scenarios**:
   - Act as Admin: Create a new Subject and assign a Faculty member. Create an Announcement.
   - Act as Faculty: View the new subject in the timetable. Mark attendance for a lecture. Post an Assignment.
   - Act as Student: View the posted assignment. Upload a dummy submission. Check updated attendance percentage.
   - Act as Faculty: Grade the student's submission. Add remarks.
   - Act as Student: View graded assignment and final marks.
2. **Responsiveness / Mobile View Check**:
   - Shrink browser or toggle the mobile frame layout to verify mobile navigation and dashboard cards.
