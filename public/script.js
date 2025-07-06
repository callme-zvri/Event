document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Initializing script.js...");

    // Access Firebase instances and Firestore functions from the window object,
    // which are exposed by database.js after Firebase initialization.
    const db = window.db;
    const auth = window.auth;
    const appId = window.appId;
    const firebaseFirestore = window.firebaseFirestore;

    if (!db || !auth || !appId || !firebaseFirestore) {
        console.error("Firebase initialization failed. Check database.js and its loading order.");
        showMessage(document.getElementById('errorMsg'), 'Firebase not initialized. Please check console for details.');
        return; // Stop execution if Firebase isn't ready
    }

    const { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } = firebaseFirestore;

    // Get references to various HTML elements
    const successMsg = document.getElementById('successMsg');
    const deleteMsg = document.getElementById('deleteMsg');
    const updateMsg = document.getElementById('updateMsg');
    const errorMsg = document.getElementById('errorMsg'); // New element for error messages
    const form = document.getElementById('reminderForm');
    const list = document.getElementById('reminderList');
    const editModal = document.getElementById('editModal');

    // Calendar elements are removed, so no references needed here.

    let currentEditId = null; // Stores the Firestore document ID of the reminder being edited

    let allReminders = []; // To store all fetched reminders for the list

    // Helper function to display messages temporarily
    function showMessage(element, message = '', duration = 3000) {
        if (!element) {
            console.error("Attempted to show message but target element is null:", message);
            return;
        }
        element.textContent = message;
        element.classList.remove('hidden'); // Show the element
        setTimeout(() => {
            element.classList.add('hidden'); // Hide after duration
            element.textContent = ''; // Clear message
        }, duration);
    }

    //to get Firestore collection path
    // Data is stored in a public collection as per instructions.
    function getRemindersCollection() {
        // Ensure auth.currentUser is available before accessing uid
        const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous';
        console.log("Firestore Collection Path:", `artifacts/${appId}/public/data/reminders`);
        return collection(db, `artifacts/${appId}/public/data/reminders`);
    }

    /**
     * Checks for time overlaps with existing reminders on the same date.
     * @param {string} newDate - The date of event (YYYY-MM-DD).
     * @param {string} newTime - The start time of event (HH:MM).
     * @param {string} newEndTime - The end time of event (HH:MM).
     * @param {string} [excludeId=null] - ID of the reminder being edited, to exclude from overlap check.
     * @returns {Promise<boolean>} - True if an overlap is found, false otherwise.
     */
    async function checkOverlap(newDate, newTime, newEndTime, excludeId = null) {
        console.log(`Checking overlap for: ${newDate} ${newTime}-${newEndTime}, excluding ID: ${excludeId}`);
        try {
            const remindersRef = getRemindersCollection();
            const q = query(remindersRef, where('date', '==', newDate));
            const querySnapshot = await getDocs(q);

            const newStart = new Date(`${newDate}T${newTime}`);
            const newEnd = new Date(`${newDate}T${newEndTime}`);

            if (newStart >= newEnd) {
                showMessage(errorMsg, 'Error: End time must be after start time.');
                return true; // Invalid time range, treat as overlap to prevent adding
            }

            for (const docSnapshot of querySnapshot.docs) {
                if (excludeId && docSnapshot.id === excludeId) {
                    continue; // Skip the reminder being edited
                }

                const existing = docSnapshot.data();
                const existingStart = new Date(`${existing.date}T${existing.time}`);
                const existingEnd = new Date(`${existing.date}T${existing.endTime}`);

                // Check for overlap: (StartA < EndB) && (EndA > StartB)
                if (newStart < existingEnd && newEnd > existingStart) {
                    console.warn("Overlap detected with existing reminder:", existing);
                    return true; // Overlap detected
                }
            }
            console.log("No overlap detected.");
            return false; // No overlap
        } catch (error) {
            console.error("Error during overlap check:", error);
            showMessage(errorMsg, 'Error checking for overlaps. Please try again.');
            return true; // Assume overlap or error to prevent data corruption
        }
    }

    // ✅ Add Reminder
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Add Reminder form submitted.");

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const endTime = document.getElementById('endTime').value; // Get end time

        // Create the new reminder object
        const newReminder = {
            title: title,
            description: description,
            date: date,
            time: time,
            endTime: endTime, // Save end time
            completed: false, // New reminders are not completed by default
            createdAt: new Date() // Timestamp for ordering
        };
        console.log("New reminder data:", newReminder);

        try {
            // Check for overlap before adding
            const isOverlapping = await checkOverlap(date, time, endTime);
            if (isOverlapping) {
                // Message already shown by checkOverlap
                return; // Stop the function if overlap detected
            }

            const remindersRef = getRemindersCollection();
            await addDoc(remindersRef, newReminder); // Add document to Firestore
            showMessage(successMsg, 'Reminder added successfully!');
            console.log("Reminder added to Firestore.");
        } catch (error) {
            console.error('Error adding reminder to Firestore:', error);
            showMessage(errorMsg, 'Failed to add reminder. Please try again.');
        }

        form.reset(); // Clear form fields
        loadReminders(); // Reload reminders for the list
    });

    // Load Reminders (only for the list, calendar removed)
    window.loadReminders = async () => { 
        console.log("Loading reminders for the list...");
        try {
            const remindersRef = getRemindersCollection();
            // Order by date and then time to display chronologically
            const q = query(remindersRef, orderBy('date'), orderBy('time'));
            const querySnapshot = await getDocs(q);

            allReminders = querySnapshot.docs.map(docSnapshot => ({
                _id: docSnapshot.id,
                ...docSnapshot.data()
            }));
            console.log("Fetched reminders:", allReminders);

            renderReminderList(); // Update the list
        } catch (error) {
            console.error('Error loading reminders from Firestore:', error);
            showMessage(errorMsg, 'Failed to load reminders. Please check your Firestore connection or security rules.');
            if (list) list.innerHTML = ''; // Clear list if loading fails
            allReminders = []; // Clear reminders data
        }
    };

    // Render the reminder list
    function renderReminderList() {
        console.log("Rendering reminder list...");
        if (!list) {
            console.error("Reminder list element not found.");
            return;
        }
        list.innerHTML = ''; // Clear existing reminders before loading new ones
        if (allReminders.length === 0) {
            list.innerHTML = '<li class="text-center text-gray-500">No reminders yet. Add one above!</li>';
        }
        allReminders.forEach(rem => {
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
                        <small class="text-gray-500 text-xs">${rem.date} from ${rem.time} to ${rem.endTime}</small>
                    </div>
                </div>
                <div class="flex-shrink-0 mt-2 sm:mt-0">
                    <button onclick="editReminder('${rem._id}', '${encodeURIComponent(rem.title)}', '${encodeURIComponent(rem.description)}', '${rem.date}', '${encodeURIComponent(rem.time)}', '${encodeURIComponent(rem.endTime)}')"
                            class="bg-purple-400 text-white px-3 py-1 rounded-md hover:bg-purple-500 transition duration-300 mr-2">Edit</button>
                    <button onclick="deleteReminder('${rem._id}')"
                            class="bg-red-400 text-white px-3 py-1 rounded-md hover:bg-red-500 transition duration-300">Delete</button>
                </div>
            `;
            list.appendChild(li);
        });
    }

    // Completed Status
    window.toggleCompleted = async (id, status) => {
        console.log(`Toggling completed status for ID: ${id} to ${status}`);
        try {
            const reminderDocRef = doc(getRemindersCollection(), id);
            await updateDoc(reminderDocRef, { completed: status });
            showMessage(updateMsg, 'Reminder status updated successfully!');
            loadReminders(); // Reload to reflect changes in list
        } catch (error) {
            console.error('Error toggling completed status in Firestore:', error);
            showMessage(errorMsg, 'Failed to update reminder status.');
        }
    };

    // Delete Reminder
    window.deleteReminder = async (id) => {
        console.log(`Attempting to delete reminder with ID: ${id}`);
        // Replace confirm() with a custom modal for better UX and compliance
        showCustomConfirm('Are you sure you want to delete this reminder?', async () => {
            try {
                const reminderDocRef = doc(getRemindersCollection(), id);
                await deleteDoc(reminderDocRef);
                showMessage(deleteMsg, 'Reminder deleted successfully!');
                console.log("Reminder deleted from Firestore.");
                loadReminders(); // Reload to remove the deleted item from list
            } catch (error) {
                console.error('Error deleting reminder from Firestore:', error);
                showMessage(errorMsg, 'Failed to delete reminder. Please try again.');
            }
        });
    };

    // Custom Confirmation Modal (replaces alert/confirm)
    function showCustomConfirm(message, onConfirm) {
        console.log("Showing custom confirmation modal.");
        // Create modal elements
        const modalDiv = document.createElement('div');
        modalDiv.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50';
        modalDiv.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-xs text-center">
                <p class="mb-4 text-gray-800">${message}</p>
                <div class="flex justify-center space-x-4">
                    <button id="confirmYes" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300">Yes</button>
                    <button id="confirmNo" class="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-300">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);

        document.getElementById('confirmYes').onclick = () => {
            onConfirm();
            modalDiv.remove();
        };
        document.getElementById('confirmNo').onclick = () => {
            modalDiv.remove();
        };
    }

    // ✅ Edit Reminder - Opens the modal and populates fields
    window.editReminder = (id, title, description, date, time, endTime) => {
        console.log(`Opening edit modal for ID: ${id}`);
        if (!editModal) {
            console.error("Edit modal element not found.");
            return;
        }
        editModal.classList.remove('hidden'); // Show modal using Tailwind class
        document.getElementById('editTitle').value = decodeURIComponent(title);
        document.getElementById('editDescription').value = decodeURIComponent(description);
        document.getElementById('editDate').value = date;
        document.getElementById('editTime').value = decodeURIComponent(time);
        document.getElementById('editEndTime').value = decodeURIComponent(endTime); // Populate end time
        currentEditId = id;
    };

    // Cancel Edit - Closes the modal
    window.cancelEdit = () => {
        console.log("Cancelling edit.");
        if (editModal) editModal.classList.add('hidden'); // Hide modal using Tailwind class
        currentEditId = null;
    };

    // Submit Edited Reminder
    window.submitEdit = async () => {
        if (!currentEditId) {
            console.warn("No currentEditId found when submitting edit.");
            return; // Should not happen if edit flow is correct
        }
        console.log(`Submitting edit for ID: ${currentEditId}`);

        const updated = {
            title: document.getElementById('editTitle').value,
            description: document.getElementById('editDescription').value,
            date: document.getElementById('editDate').value,
            time: document.getElementById('editTime').value,
            endTime: document.getElementById('editEndTime').value // Get updated end time
        };
        console.log("Updated reminder data:", updated);

        try {
            // Check for overlap before updating, excluding the current reminder being edited
            const isOverlapping = await checkOverlap(updated.date, updated.time, updated.endTime, currentEditId);
            if (isOverlapping) {
                // Message already shown by checkOverlap
                return;
            }

            const reminderDocRef = doc(getRemindersCollection(), currentEditId);
            await updateDoc(reminderDocRef, updated);
            showMessage(updateMsg, 'Reminder updated successfully!');
            console.log("Reminder updated in Firestore.");
        } catch (error) {
            console.error('Error updating reminder in Firestore:', error);
            showMessage(errorMsg, 'Failed to update reminder. Please try again.');
        }

        cancelEdit(); // Close the editor
        loadReminders(); // to show updated reminder in list
    };

    // Initial load of reminders when the page loads
    loadReminders();
});
