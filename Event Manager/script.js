import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCTx70cmqX8T1fGAS1DzQZbO8ITbFTp_bU",
  authDomain: "personal-event-manager.firebaseapp.com",
  projectId: "personal-event-manager",
  storageBucket: "personal-event-manager.appspot.com",
  messagingSenderId: "1058517133087",
  appId: "1:1058517133087:web:e2af835617d22b7fd1322a",
  measurementId: "G-HS77HYCPL9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load saved name
const savedName = localStorage.getItem('username');
const usernameInput = document.getElementById('username');
const welcome = document.getElementById('welcome-msg');
if (savedName) {
  usernameInput.value = savedName;
  welcome.textContent = `Welcome, ${savedName}!`;
}

// Save name
document.getElementById('user-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = usernameInput.value;
  localStorage.setItem('username', name);
  welcome.textContent = `Welcome, ${name}!`;
});

// Display Events with proximity styling
async function displayEvents() {
  const list = document.getElementById('event-list');
  list.innerHTML = '';
  const snapshot = await getDocs(collection(db, 'events'));
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  snapshot.forEach(docSnap => {
    const event = docSnap.data();
    const eventDate = new Date(event.date);
    const diffDays = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
    
    // Determine background color
    let color = '#c8f7c5'; // green
    if (diffDays <= 3 && diffDays > 1) color = '#fff7a2'; // yellow
    else if (diffDays === 1) {
      color = '#ffd2a6'; // soft orange
      alert(`🗓️ Reminder: "${event.title}" is happening tomorrow! Time to prepare, ${savedName || 'friend'}!`);
    }

    const div = document.createElement('div');
    div.className = 'event';
    div.style.backgroundColor = color;
    div.innerHTML = `
      <strong>${event.title}</strong> - ${event.date}<br />
      <p>${event.description}</p>
      <button onclick="editEvent('${docSnap.id}')">Edit</button>
      <button onclick="deleteEvent('${docSnap.id}')">Delete</button>
    `;
    list.appendChild(div);
  });
}

// Create new event
document.getElementById('event-form').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const date = document.getElementById('date').value;
  const description = document.getElementById('description').value;

  await addDoc(collection(db, 'events'), { title, date, description });
  displayEvents();
  e.target.reset();
});

// Delete event
window.deleteEvent = async (id) => {
  await deleteDoc(doc(db, 'events', id));
  displayEvents();
};

// Edit event (load it into form)
window.editEvent = async (id) => {
  const docRef = doc(db, 'events', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const event = docSnap.data();
    document.getElementById('title').value = event.title;
    document.getElementById('date').value = event.date;
    document.getElementById('description').value = event.description;
    await deleteEvent(id); // delete old version
  }
};

displayEvents();
