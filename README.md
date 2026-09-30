# 🎓 College Management System

A full-stack College Management Platform built with React, Node.js, Express, Prisma, and SQLite/PostgreSQL. It features specialized portals for **Admins**, **Faculty**, and **Students**.

---

## 🌟 Key Features

### 👑 Admin Portal
- **User Management**: Create, view, update, and manage accounts for Admin, Co-Admin, Faculty, and Students.
- **Department & Course Management**: Add and organize departments, courses, and subjects.
- **System Announcements**: Broadcast announcements across specific departments, courses, or college-wide.
- **Fee Management**: Track and manage student fee statuses.

### 👨‍🏫 Faculty Portal
- **Attendance Management**: Mark and update attendance for students by subject and section.
- **Assignments & Submissions**: Post assignments, set deadlines, upload reference files, and grade student submissions.
- **Quizzes & Online Testing**: Create interactive quizzes with timed deadlines and automatically record quiz scores.
- **Result Publishing**: Upload and publish exam marks and semester results.

### 🎓 Student Portal
- **Personal Dashboard**: View enrolled courses, subjects, timetables, and overall performance.
- **Attendance Tracker**: Real-time breakdown of subject-wise attendance percentage.
- **Assignments & Quizzes**: Submit assignments before deadlines and attempt online quizzes.
- **Results & Fee Status**: Access exam grades, report cards, and fee payment statuses.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Axios, XLSX (Excel Exports)
- **Backend**: Node.js, Express 5, JWT Authentication, Multer (File Uploads), BcryptJS
- **Database & ORM**: Prisma ORM with SQLite (Local) / PostgreSQL (Cloud Ready)
- **Mobile App**: React Native / Expo (`/mobile-app`)

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/college-management-app.git
cd college-management-app
```

### 2. Setup Server
```bash
cd server
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

### 3. Setup Client
Open a new terminal tab:
```bash
cd client
npm install
npm run dev
```

---

## 📁 Project Structure

```
collage-management-app/
├── client/          # React Frontend (Vite + Tailwind CSS)
├── server/          # Express Backend API + Prisma Schema & Seed
├── mobile-app/      # React Native Mobile Application
├── start_app.bat    # Windows 1-click startup script
└── README.md
```

---

## 📄 License

This project is open-source and available under the [ISC License](LICENSE).
