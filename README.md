Secure Biometric Online Voting System

React | Node.js | Express | MongoDB | Face Recognition | JWT

Project Overview

This is a secure web-based voting platform designed for educational institutions. It integrates biometric face recognition and token-based authentication & authorization to ensure each vote is cast securely and transparently.

The system includes a user login, voting dashboard, and admin panel for monitoring real-time election results.

Features

Biometric Face Authentication – Ensures only authorized users can vote.

Token-Based Voting (JWT) – Prevents duplicate voting and ensures secure vote submission.

Admin Dashboard – Monitor and manage ongoing elections in real time.

RESTful API Integration – Connects frontend with backend services for login, voting, and results.

Responsive Design – Fully functional on desktop and mobile devices.

Secure Data Handling – Sensitive user data and votes are encrypted in storage and transit.

Tech Stack

Frontend: React, HTML5, CSS3, JavaScript

Backend: Node.js, Express.js

Database: MongoDB

Authentication & Security: JWT, Face Recognition API

Version Control: Git & GitHub

Installation & Setup

Clone the repository

git clone https://github.com/mariontamnai/Secure-online-voting-sysstem.git
cd Secure-online-voting-sysstem.git


Install frontend dependencies

cd frontend
npm install


Run the development server

npm start


Note: Backend services (API endpoints) must be running for full functionality.

frontend/                  # React frontend
├─ src/
│  ├─ components/          # Reusable React components
│  ├─ pages/               # Login, Voting, Dashboard
│  ├─ styles/              # CSS and styling files
│  └─ api/                 # API calls via Axios
├─ public/
│  └─ screenshots/         # App screenshots and previews
backend/                   # Backend API services (Node.js/Express)

Screenshots

![Login Page](Frontend/screenshots/login.png)
![Voting Dashboard](Frontend/screenshots/voting.png)
![Admin Panel](Frontend/screenshots/admin.png)

Contribution

Built the frontend independently using React.

Integrated with backend APIs for login, voting, and dashboard management.

Managed version control using Git and implemented branching workflows.

Followed best practices for code structure, responsiveness, and accessibility.

Demo

(Optional: add link if deployed on Netlify / Vercel)

Key Learnings & Skills

React component-based architecture

Frontend-backend integration using Axios

Token-based authentication & authorization with JWT

Biometric security implementation

Collaborative Git workflow and branch management

Responsive web design and accessibility considerations