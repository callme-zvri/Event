// script.js
// This script handles the main logic for the Event Reminder Manager,
// including form submission, displaying reminders, and interacting with Firestore.

document.addEventListener('DOMContentLoaded', () => {
    // Access Firebase instances and Firestore functions from the window object,
    // which are exposed by database.js after Firebase initialization.
    const db = window.db;
    const auth = window.auth;
    const appId = window.appId;
    const { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } = window.firebaseFirestore;

    // Get references to various HTML elements
    const successMsg = document.getElementById('successMsg');
    const deleteMsg = document.getElementById('deleteMsg');
    const updateMsg = document.getElementById('updateMsg');
    const errorMsg = document.getElementById('errorMsg'); // New element for error messages
    const form = document.getElementById('reminderForm');
    const list = document.getElementById('reminderList');
    const editModal = document.getElementById('editModal');

    let currentEditId = null; // Stores the Firestore document ID of the reminder being edited

    // Helper function to display messages temporarily
    function showMessage(element, message = '', duration = 3000) {
        element.textContent = message;
        element.classList.remove('hidden'); // Show the element
        setTimeout(() => {
            element.classList.add('hidden'); // Hide after duration
            element.textContent = ''; // Clear message
        }, duration);
    }


    /**
     * Checks for time overlaps with existing reminders on the same date.
     * @param {string} newDate - The date of event (YYYY-MM-DD).
     * @param {string} newTime - The time of event (HH:MM).
     * @param {string} [excludeId=null] 
     * @returns {Promise<boolean>} - True if an overlap is found, false otherwise.
     */
    async function checkOverlap(newDate, newTime, excludeId = null) {
        const remindersRef = getRemindersCollection();
        // Query for reminders on the same date
        const q = query(remindersRef, where('date', '==', newDate));
        const querySnapshot = await getDocs(q);

        const newReminderDateTime = new Date(`${newDate}T${newTime}`);

        for (const docSnapshot of querySnapshot.docs) {
            // If we're editing, skip the current reminder being edited
            if (excludeId && docSnapshot.id === excludeId) {
                continue;
            }

            const existingReminder = docSnapshot.data();
            const existingReminderDateTime = new Date(`${existingReminder.date}T${existingReminder.time}`);

            // Simple overlap check: if dates are the same and times are identical.
            // For more robust overlap, you'd need to consider duration if your reminders had one.
            if (newReminderDateTime.getTime() === existingReminderDateTime.getTime()) {
                return true; // Overlap detected
            }
        }
        return false; // No overlap
    }

    // ✅ Add Reminder
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;

        // Create the new reminder object
        const newReminder = {
            title: title,
            description: description,
            date: date,
            time: time,
            completed: false, // New reminders are not completed by default
            createdAt: new Date() // Timestamp for ordering
        };

        try {
            // Check for overlap before adding
            const isOverlapping = await checkOverlap(date, time);
            if (isOverlapping) {
                showMessage(errorMsg, 'Error: An event already exists at this exact date and time. Please choose a different time.');
                return; // Stop the function if overlap detected
            }

            const remindersRef = getRemindersCollection();
            await addDoc(remindersRef, newReminder); // Add document to Firestore
            showMessage(successMsg, 'Reminder added successfully!');
        } catch (error) {
            console.error('Error adding reminder to Firestore:', error);
            showMessage(errorMsg, 'Failed to add reminder. Please try again.');
        }

        form.reset(); // Clear form fields
        loadReminders(); // Reload reminders to display the new one
    });

    // Load Reminders
    window.loadReminders = async () => { 
        try {
            const remindersRef = getRemindersCollection();
            // Order by date and then time to display chronologically
            const q = query(remindersRef, orderBy('date'), orderBy('time'));
            const querySnapshot = await getDocs(q);

            list.innerHTML = ''; // Clear existing reminders before loading new ones
            querySnapshot.forEach(docSnapshot => {
                const rem = { _id: docSnapshot.id, ...docSnapshot.data() }; // Get doc ID and data
                const li = document.createElement('li');
                li.className = 'bg-white p-4 rounded-lg shadow-sm flex items-center justify-between flex-wrap'; // Tailwind classes

                // to handle special characters correctly in HTML attributes.
                li.innerHTML = `
                    <div class="flex items-center flex-grow min-w-0 pr-4">
                        <input type="checkbox" ${rem.completed ? 'checked' : ''} onchange="toggleCompleted('${rem._id}', this.checked)"
                               class="mr-3 h-5 w-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300">
                        <div class="flex-grow">
                            <strong class="text-lg font-semibold ${rem.completed ? 'line-through text-gray-500' : 'text-purple-800'}">
                                ${rem.title}
                            </strong>
                            <p class="text-gray-600 text-sm">${rem.description}</p>
                            <small class="text-gray-500 text-xs">${rem.date} at ${rem.time}</small>
                        </div>
                    </div>
                    <div class="flex-shrink-0 mt-2 sm:mt-0">
                        <button onclick="editReminder('${rem._id}', '${encodeURIComponent(rem.title)}', '${encodeURIComponent(rem.description)}', '${rem.date}', '${rem.time}')"
                                class="bg-purple-400 text-white px-3 py-1 rounded-md hover:bg-purple-500 transition duration-300 mr-2">Edit</button>
                        <button onclick="deleteReminder('${rem._id}')"
                                class="bg-red-400 text-white px-3 py-1 rounded-md hover:bg-red-500 transition duration-300">Delete</button>
                    </div>
                `;
                list.appendChild(li);
            });
        } catch (error) {
            console.error('Error loading reminders from Firestore:', error);
            showMessage(errorMsg, 'Failed to load reminders. Please check your Firestore connection or security rules.');
            list.innerHTML = ''; // Clear list if loading fails
        }
    };

    // Completed Status
    window.toggleCompleted = async (id, status) => {
        try {
            const reminderDocRef = doc(getRemindersCollection(), id);
            await updateDoc(reminderDocRef, { completed: status });
            loadReminders(); // Reload to reflect changes
        } catch (error) {
            console.error('Error toggling completed status in Firestore:', error);
            showMessage(errorMsg, 'Failed to update reminder status.');
        }
    };

    // Delete Reminder
    window.deleteReminder = async (id) => {
        if (!confirm('Are you sure you want to delete this reminder?')) {
            return;
        }
        try {
            const reminderDocRef = doc(getRemindersCollection(), id);
            await deleteDoc(reminderDocRef);
            showMessage(deleteMsg, 'Reminder deleted successfully!');
            loadReminders(); // Reload to remove the deleted item
        } catch (error) {
            console.error('Error deleting reminder from Firestore:', error);
            showMessage(errorMsg, 'Failed to delete reminder. Please try again.');
        }
    };

    // ✅ Edit Reminder - Opens the modal and populates fields
    window.editReminder = (id, title, description, date, time) => {
        editModal.classList.remove('hidden'); // Show modal using Tailwind class
        document.getElementById('editTitle').value = decodeURIComponent(title);
        document.getElementById('editDescription').value = decodeURIComponent(description);
        document.getElementById('editDate').value = date;
        document.getElementById('editTime').value = time;
        currentEditId = id;
    };

    // Cancel Edit - Closes the modal
    window.cancelEdit = () => {
        editModal.classList.add('hidden'); // Hide modal using Tailwind class
        currentEditId = null;
    };

    // Submit Edited Reminder
    window.submitEdit = async () => {
        if (!currentEditId) return; // Should not happen if edit flow is correct

        const updated = {
            title: document.getElementById('editTitle').value,
            description: document.getElementById('editDescription').value,
            date: document.getElementById('editDate').value,
            time: document.getElementById('editTime').value
        };

        try {
            // Check for overlap before updating, excluding the current reminder being edited
            const isOverlapping = await checkOverlap(updated.date, updated.time, currentEditId);
            if (isOverlapping) {
                showMessage(errorMsg, 'Error: An event already exists at this exact date and time. Please choose a different time.');
                return;
            }

            const reminderDocRef = doc(getRemindersCollection(), currentEditId);
            await updateDoc(reminderDocRef, updated);
            showMessage(updateMsg, 'Reminder updated successfully!');
        } catch (error) {
            console.error('Error updating reminder in Firestore:', error);
            showMessage(errorMsg, 'Failed to update reminder. Please try again.');
        }

        cancelEdit(); // Close the editor
        loadReminders(); // to show updated reminder
    };

  
});
