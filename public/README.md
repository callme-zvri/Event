# 🗓️ Event Reminder Manager

A full-stack web application to manage personal reminders — such as appointments, meetings, and daily tasks.
 Built with **Node.js**, **Express**, **MongoDB**, and a simple, elegant frontend using **HTML, CSS, and JavaScript**.
## ✅ Features
- 📌 Add new event reminders with date and time
- ✏️ Edit existing events using a popup modal
- ✅ Mark tasks as completed (with checkbox + line-through)
- ❌ Delete events with a success notification
- 📦 Stores all data in **MongoDB** (locally)
- 🌈 Responsive and styled with a lavender-themed UI
## 🛠️ Tech Stack

| Layer      | Technology            |
|------------|------------------------|
| Backend    | Node.js, Express       |
| Database   | MongoDB, Mongoose      |
| Frontend   | HTML, CSS, JavaScript  |
| Styling    | Custom CSS (Lavender)  |
Folder Structure:
  
event-reminder-manager/
│
├── public/
│ ├── index.html
│ ├── style.css
│ └── script.js
│
├── models/
│ └── Reminder.js
│
├── controllers/
│ └── reminderController.js
│
├── routes/
│ └── reminders.js
│
├── .env
├── .gitignore
├── package.json
└── server.js
🚀 Quick Setup Guide (Step-by-Step)

### 📁 1. Create Project Folder
-> mkdir event-reminder-manager && cd event-reminder-manager
-> npm init -y
->npm install express mongoose dotenv
By inititalizing npm init -y a file package.json and package-lock.json
To run ,enter node server.js