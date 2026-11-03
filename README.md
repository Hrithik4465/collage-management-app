# 🎓 CMS Academy Portal - College Management System

A full-stack, enterprise-grade College Management Platform and LMS designed for **Administrators**, **Faculty**, and **Students**. Built with React, Node.js, Express, Prisma ORM, and React Native / Android.

---

## 🌟 Key Features

### 👑 Admin Portal
- **User Management**: Create, update, and manage accounts for Administrators, Faculty, and Students.
- **Department & Course Management**: Organize academic departments, degree programs, and curriculum subjects.
- **Announcements**: Campus-wide broadcasts with category tagging and real-time alerts.
- **Fee Management**: Track and manage student tuition dues and payment receipts.

### 👨‍🏫 Faculty Portal
- **Attendance Management**: Mark and update attendance for students by subject and section.
- **Study Materials Repository**: Upload, categorize (Syllabus, Notes, Lecture Slides, Reference Books), and share lecture notes with students.
- **Assignments & Grading**: Issue homework, set deadlines, upload reference files, and review student submissions.
- **Online Tests / Quizzes**: Build timed quizzes with automated scoring and instant feedback.
- **Marks & Report Cards**: Publish semester examination results.

### 🎓 Student Portal & LMS
- **MSSU LMS / Moodle Style Dashboard**:
  - **Recently Accessed Items**: Horizontal carousel with 1-tap resume for recent courses and tests.
  - **Course Overview with Progress Line**: Visual progress completion line, filter pills, search, sort, and card/list views.
  - **Study Materials Library**: Instant access to course notes, PPTs, syllabi, and reference guides.
- **Mobile-First Responsive Design**: Optimized across mobile phones (iPhones & Android), tablets/iPads, laptops, and PCs.
- **Native Navigation**: Mobile bottom navigation bar and slide-over menu drawer.
- **Academic Performance**: Real-time attendance percentage ring, grade transcripts, and exam timetable.

### 📱 Android Mobile App (Google Play Store Ready)
- Native React Native / Expo application (`com.cms.academyportal`).
- Production signed with RSA 2048-bit release keystore (`release.keystore`).
- Hardware back-button handling, safe-area insets, pull-to-refresh, and offline error screens.
- Automated Google Play Store Bundle (`.aab`) and standalone APK build generators.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Axios, XLSX (Excel Exports)
- **Backend**: Node.js, Express 5, JWT Authentication, Multer (File Uploads), BcryptJS
- **Database & ORM**: Prisma ORM with SQLite (Local) / PostgreSQL (Cloud Ready)
- **Mobile App**: React Native, Expo SDK 58, Android Native Gradle Project (`.aab` / `.apk`)
- **CI/CD**: GitHub Actions automated Android build workflow

---

## 🚀 Quick Start (Windows 1-Click)

Double-click **`start_app.bat`** in the root directory. It automatically starts:
1. The Backend API Server on `http://localhost:5000`
2. The Frontend Web App on `http://localhost:5173`
3. Launches the portal in your default browser.

---

## 💻 Manual Setup

### 1. Backend Server Setup
```bash
cd collage-management-app/server
npm install
npx prisma db push
node prisma/seed.js
node index.js
```

### 2. Frontend Web Setup
In a new terminal:
```bash
cd collage-management-app/client
npm install
npm run dev
```

### 3. Android Mobile App Build
In a new terminal:
```bash
cd collage-management-app/mobile-app
# Run 1-click build script
./build_android_app.bat
```
Refer to [`PLAY_STORE_PUBLISHING_GUIDE.md`](collage-management-app/mobile-app/PLAY_STORE_PUBLISHING_GUIDE.md) for Google Play Store upload instructions.

---

## 📁 Project Structure

```
collage-management-app/
├── .github/
│   └── workflows/
│       └── build-android.yml         # Automated GitHub Actions Android build CI/CD
├── collage-management-app/
│   ├── client/                       # React 19 + Vite Frontend Application
│   │   ├── src/
│   │   │   ├── components/           # AdminPortal, FacultyPortal, StudentPortal, CourseOverview
│   │   │   ├── App.jsx               # Main application container & theme switcher
│   │   │   └── index.css             # Executive theme design system & mobile utilities
│   │   └── package.json
│   ├── server/                       # Node.js + Express Backend API
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Prisma data models (StudyMaterial, CourseOverview, etc.)
│   │   │   └── dev.db                # SQLite database
│   │   ├── routes/                   # auth, admin, faculty, student, common routes
│   │   └── index.js                  # Server entry point (Port 5000)
│   ├── mobile-app/                   # React Native & Native Android App (Google Play Store)
│   │   ├── android/                  # Native Android Studio / Gradle 9.4 Project
│   │   ├── App.js                    # Mobile WebView container & hardware navigation
│   │   ├── app.json                  # Android package configuration (com.cms.academyportal)
│   │   ├── build_android_app.bat     # 1-click AAB & APK build generator
│   │   ├── release.keystore          # Production release signing key
│   │   └── PLAY_STORE_PUBLISHING_GUIDE.md
│   ├── docs/                         # Architecture plans & task checklists
│   └── start_app.bat
├── start_app.bat                     # Root 1-click Windows launcher
├── package.json                      # Root scripts for cloud deployment
├── .gitignore
└── README.md
```

---

## 📄 Default Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@college.com` | `admin123` |
| **Faculty (CS)** | `faculty@college.com` | `admin123` |
| **Student** | `student@college.com` | `admin123` |
