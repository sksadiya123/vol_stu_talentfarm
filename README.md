# 🎓 EduConnect – Bridging Education for All

**EduConnect** is a full-stack educational platform that connects students who lack access to formal education with volunteers who want to teach. Built with React+TypeScript, Node.js, and PostgreSQL, the platform includes custom authentication, session management, file uploads, and an AI-powered chatbot assistant.

---

## 📌 Problem Statement

To provide accessible, structured, and volunteer-driven education for individuals with no access to formal academic institutions.

---

## 🚀 Features

### ✅ Core Features

- **Landing Page**: Colorful, responsive homepage with login/signup options
- **Dual User System**:
  - **Students**: Basic registration with profile description
  - **Volunteers**: Detailed registration with education, subjects, experience, and resume upload
- **Dashboards**:
  - **Student Dashboard**: Browse and book sessions, view booked sessions, edit profile
  - **Volunteer Dashboard**: Overview panel, create/manage sessions, view student bookings, edit profile
- **Custom Local Authentication**: Built using Node.js, bcrypt, and PostgreSQL
- **Session Management**: Full booking system with session creation, viewing, and storage
- **File Uploads**: Profile pictures and resumes handled using Multer
- **Edit Profile**: With change profile picture support for both roles

### 🤖 EduBot Chatbot

- Integrated using **Claude 3.5 Sonnet** via **OpenRouter API**
- Embedded in landing page and dashboards
- Can answer:
  - General education-related questions
  - Platform-specific queries (signup, session booking, uploading resumes)
- Secure backend proxy via `/api/chat` to protect API key

---

## 🛠️ Tech Stack

| Layer       | Technologies                                      |
|-------------|---------------------------------------------------|
| **Frontend**| React.js, TypeScript, Tailwind CSS, Axios         |
| **Backend** | Node.js, Express.js, TypeScript, bcrypt, Multer   |
| **Database**| PostgreSQL, Drizzle ORM        |
| **Chatbot** | Claude 3.5 Sonnet (OpenRouter API)                |
| **Auth**    | auth with PostgreSQL & bcrypt        |

---



