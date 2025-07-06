const successMsg = document.getElementById('successMsg');
const deleteMsg = document.getElementById('deleteMsg');
const updateMsg = document.getElementById('updateMsg');
const form = document.getElementById('reminderForm');
const list = document.getElementById('reminderList');

let currentEditId = null;

// ✅ Add Reminder
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const reminder = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
  };

  const res = await fetch('/api/reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder)
  });

  if (res.ok) {
    successMsg.style.display = 'block';
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 2000);
  }

  form.reset();
  loadReminders();
});

// ✅ Load Reminders
async function loadReminders() {
  const res = await fetch('/api/reminders');
  const data = await res.json();

  list.innerHTML = '';
  data.forEach(rem => {
    const li = document.createElement('li');

    li.innerHTML = `
      <input type="checkbox" ${rem.completed ? 'checked' : ''} onchange="toggleCompleted('${rem._id}', this.checked)" />
      <strong style="text-decoration: ${rem.completed ? 'line-through' : 'none'}; color: ${rem.completed ? 'gray' : 'black'};">
        ${rem.title}
      </strong> — ${rem.description}
      <br><small>${rem.date} at ${rem.time}</small>
      <br>
      <button onclick="editReminder('${rem._id}', '${rem.title}', '${rem.description}', '${rem.date}', '${rem.time}')">Edit</button>
      <button onclick="deleteReminder('${rem._id}')">Delete</button>
    `;

    list.appendChild(li);
  });
}

// ✅ Toggle Completed
async function toggleCompleted(id, status) {
  await fetch(`/api/reminders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: status })
  });
  loadReminders();
}

// ✅ Delete Reminder
async function deleteReminder(id) {
  await fetch(`/api/reminders/${id}`, { method: 'DELETE' });

  deleteMsg.style.display = 'block';
  setTimeout(() => {
    deleteMsg.style.display = 'none';
  }, 2000);

  loadReminders();
}

// ✅ Edit Reminder
function editReminder(id, title, description, date, time) {
  document.getElementById('editModal').style.display = 'block';
  document.getElementById('editTitle').value = title;
  document.getElementById('editDescription').value = description;
  document.getElementById('editDate').value = date;
  document.getElementById('editTime').value = time;
  currentEditId = id;
}

function cancelEdit() {
  document.getElementById('editModal').style.display = 'none';
  currentEditId = null;
}

// ✅ Submit Edited Reminder
async function submitEdit() {
  const updated = {
    title: document.getElementById('editTitle').value,
    description: document.getElementById('editDescription').value,
    date: document.getElementById('editDate').value,
    time: document.getElementById('editTime').value
  };

  await fetch(`/api/reminders/${currentEditId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  });

  updateMsg.style.display = 'block';
  setTimeout(() => {
    updateMsg.style.display = 'none';
  }, 2000);

  document.getElementById('editModal').style.display = 'none';
  currentEditId = null;
  loadReminders();
}

// 🔁 Load reminders on page open
loadReminders();
