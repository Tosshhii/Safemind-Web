// --- START: Firebase v12 (Modular) Initialization ---

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";

// Auth imports (Email/Password, Remember Me, Forgot Password)
import {
    getAuth,
    // createUserWithEmailAndPassword, // No longer needed
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile,
    // "Remember Me" functions:
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
    inMemoryPersistence,
    // Forgot Password
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// --- (UPDATED) FIRESTORE IMPORTS ---
import { 
    getFirestore, 
    collection, 
    collectionGroup, // For our nested query
    getDocs,
    query,
    orderBy,
    where, // Added for dashboard query
    doc,     
    getDoc,  
    limit,
    onSnapshot,
    addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"; 
// --- END FIRESTORE IMPORTS ---


// Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkkJgfiD4NAViHyx61qBmrOP3EPyFhp_I",
  authDomain: "safemind-66843.firebaseapp.com",
  projectId: "safemind-66843",
  storageBucket: "safemind-66843.firebasestorage.app",
  messagingSenderId: "599736481065",
  appId: "1:599736481065:web:fcbb630f1e58cd39f57338",
  measurementId: "G-GMJ1ZME9PP"
};

// EmailJS configuration (set these with your EmailJS dashboard values)
const EMAILJS_CONFIG = {
    publicKey: 'jmItGItu0nibZ2mAX',
    serviceId: 'service_q79gyg4',
    templateId: 'template_o2b1yac',
    declineTemplateId: 'template_achwxe5'
};

let emailJsModulePromise = null;

function isEmailJsConfigured() {
    return Boolean(
        EMAILJS_CONFIG.publicKey.trim() &&
        EMAILJS_CONFIG.serviceId.trim() &&
        EMAILJS_CONFIG.templateId.trim()
    );
}

async function getEmailJsClient() {
    if (!isEmailJsConfigured()) {
        throw new Error('EmailJS is not configured. Please set publicKey, serviceId, and templateId in EMAILJS_CONFIG.');
    }

    if (!emailJsModulePromise) {
        emailJsModulePromise = import('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm')
            .then((emailjs) => {
                emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
                return emailjs;
            });
    }

    return emailJsModulePromise;
}

// --- CORRECTED INITIALIZATION ORDER ---
// 1. Initialize the app
const app = initializeApp(firebaseConfig);

// 2. Get services *from* the app
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Initialize Firestore
// --- END: Firebase Initialization ---

// --- Service Worker Registration (site-wide caching) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch((error) => {
                console.warn('Service Worker registration failed:', error);
            });
    });
}


// --- **** NEW QUESTION MAP (FROM YOUR LIST) **** ---
const QUESTION_MAP = {
    // Section 1
    "rating_1": "I easily get irritated or frustrated with others.",
    "rating_2": "I have little interest or pleasure in doing things I used to enjoy.",
    "text_1": "How would you describe your emotional state during the past two weeks?",
    "text_2": "What situations or experiences make you feel most hopeless or disinterested?",
    // Section 2
    "rating_3": "I avoid situations that make me feel anxious.",
    "rating_4": "I frequently feel nervous, anxious, or on edge.",
    "text_3": "What kinds of things make you feel anxious or worried, and how do you handle them?",
    "text_4": "How has the anxiety affected your daily activities or interactions with others?",
    // Section 3
    "rating_5": "I start more projects or take more risks than usual.",
    "rating_6": "I sleep less but still have a lot of energy.",
    "text_5": "Can you describe times when you felt unusually energetic or driven to take on new activities?",
    "text_6": "How do these changes in energy or activity level affect your relationships or responsibilities?",
    // Section 4
    "rating_7": "I experience unexplained aches or pains such as headaches, back pain, or stomach pain.",
    "rating_8": "I feel my medical problems or symptoms are not taken seriously enough by others.",
    "text_7": "Have you noticed any recurring physical discomfort (such as headaches or body pain)? What do you think causes them?",
    "text_8": "How do your physical sensations or health concerns influence your emotions or thoughts?",
    // Section 5
    "rating_9": "I have trouble sleeping, or my sleep does not feel restful.",
    "rating_10": "I often feel too tired to complete my usual tasks.",
    "text_9": "How has your sleep pattern changed recently, and what do you think is affecting it?",
    "text_10": "What do you notice about your energy or motivation during the day?"
};
// --- **** END OF NEW MAP **** ---


// --- (UPDATED) Auth State Listener ---
onAuthStateChanged(auth, (user) => {
    // Get references to header elements
    const navActionLink = document.getElementById('nav-action-link');
    const navHomeLink = document.getElementById('nav-home-link');

    if (user) {
        // --- User is LOGGED IN ---
        console.log('User logged in:', user.displayName || user.email);

        // Update dashboard dropdown if it exists
        const emailDisplay = document.getElementById('user-email-display');
        if (emailDisplay) {
            emailDisplay.textContent = user.displayName || user.email; // Prioritize displayName
        }

        // Update header nav link/button on landing/about pages
        if (navActionLink) {
            navActionLink.textContent = 'Dashboard';
            // --- FIX: Redirect to Confirmed Page by default ---
            navActionLink.href = 'confirmed-consultations.html'; 
            navActionLink.onclick = null; // Remove popup click handler
            navActionLink.style.display = 'inline-flex';
            
            // Make the button visible AFTER setting its content
            navActionLink.style.visibility = 'visible'; 
        }
        if (navHomeLink) {
             navHomeLink.href = 'index.html'; // Keep Home pointing to index
        }

    } else {
        // --- User is LOGGED OUT ---
        console.log('No user signed in.');

        // Update header nav link/button on landing/about pages
        if (navActionLink) {
            navActionLink.textContent = 'Login';
            navActionLink.href = '#';
            navActionLink.style.display = 'inline-flex';

            // Make the button visible AFTER setting its content
            navActionLink.style.visibility = 'visible'; 

            // Add click handler to open the modal
            navActionLink.onclick = (e) => {
                e.preventDefault();
                const wrapper = document.querySelector('.wrapper');
                const body = document.querySelector('body');
                if (wrapper && body) {
                    wrapper.classList.add('active-popup');
                    body.classList.add('login-active');
                    showScrim(true);
                }
            };
        }
        if (navHomeLink) {
            navHomeLink.href = 'index.html';
        }

        // --- Redirect check for protected pages ---
        const path = window.location.pathname;
        const onAuthPage = path.endsWith('index.html') || path === '/' || path.endsWith('about.html');
        // Only redirect if NOT on an auth page and NOT in the middle of login
        if (!onAuthPage && !path.includes('index.html')) {
            console.log('Access denied. Redirecting to login.');
            window.location.href = 'index.html';
        }
    }
});
// --- END: Auth State Listener ---


// --- NEW HELPER: Parse "DD/MM/YYYY" and times like "4:00-6:00" or "4:00 PM-6:00 PM" ---
// This ensures sorting works for your specific string format, with optional AM/PM
function parseDateTime(dateStr, timeStr) {
    if (!dateStr || typeof dateStr !== 'string') return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date(0);
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; 
    const year = parseInt(parts[2], 10);
    
    let hour = 0;
    if (timeStr && typeof timeStr === 'string') {
        // Extract start time from "4:00-6:00" or "4:00 PM-6:00 PM" -> "4:00" or "4:00 PM"
        const start = timeStr.split('-')[0].trim(); 
        const isPM = start.toLowerCase().includes('pm');
        const isAM = start.toLowerCase().includes('am');

        const tParts = start.replace(/am|pm/gi, '').trim().split(':');
        if (tParts.length >= 1) hour = parseInt(tParts[0], 10);

        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;
    }
    return new Date(year, month, day, hour);
}
// --- END NEW HELPER ---


let confirmedSortMode = 'newest'; // 'newest' | 'oldest'

// --- (UPDATED) Load appointments for Confirmed Consultations Page ---
async function loadAppointments() {
    const tableBody = document.getElementById('schedule-table-body');
    if (!tableBody) return; // Stop if we're not on the confirmed page

    tableBody.innerHTML = '<tr><td colspan="3">Loading confirmed consultations...</td></tr>';
    
    try {
        // 1. Get ALL bookings where status is "confirmed"
        const q = query(
            collectionGroup(db, "bookedSlots"), 
            where("status", "==", "confirmed")
        );

        // 2. Fetch the documents
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="3">No confirmed consultations found.</td></tr>`;
            return;
        }

        // 3. Map docs to objects and create a sortable Date
        const appointments = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Prefer createdAt timestamp if available, otherwise fall back to date/time fields
            let sortDate;
            if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
                sortDate = new Date(data.createdAt.toMillis());
            } else {
                sortDate = parseDateTime(data.date, data.time);
            }
            return {
                id: doc.id,
                ...data,
                sortDate 
            };
        });

        // 4. Sort according to current mode
        if (confirmedSortMode === 'oldest') {
            appointments.sort((a, b) => a.sortDate - b.sortDate);
        } else { // default: newest first
            appointments.sort((a, b) => b.sortDate - a.sortDate);
        }

        // 5. Create promises for each appointment to fetch user data
        const appointmentPromises = appointments.map(async (appt) => {
            const patientId = appt.userId;
            let patientName = "Unknown Patient";
            let patientURL = '#';

            if (patientId) {
                try {
                    const userDocRef = doc(db, 'users', patientId); // 'doc' is imported
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        patientName = userDocSnap.data().name || "Unknown Patient";
                    }
                } catch (userError) {
                    console.error("Error fetching patient name for", patientId, userError);
                }
                patientURL = `patient-profile.html?id=${encodeURIComponent(patientId)}`;
            }

            // Return the HTML row for this appointment
            return `
                <tr>
                    <td data-label="Date">${appt.date}</td>
                    <td data-label="Time">${appt.time}</td>
                    <td data-label="Patient">
                        <a href="${patientURL}" class="patient-link">${patientName}</a>
                    </td>
                </tr>
            `;
        });

        // 6. Wait for all the user fetches and HTML creation to complete
        const htmlRows = await Promise.all(appointmentPromises);

        // 7. Join all the HTML rows and set the table body
        tableBody.innerHTML = htmlRows.join('');

    } catch (error) {
        console.error("Error loading appointments: ", error);

        // Check if the error is a "missing index" error
        if (error.code === 'failed-precondition') {
            tableBody.innerHTML = `<tr><td colspan="3"><strong>Error:</strong> This query needs a database index. Check the console (press F12) for a link to create it.</td></tr>`;
            console.warn("You must create a Firestore index. Firebase should have logged a link below this message. Click it to create the index automatically.");
        } else {
            tableBody.innerHTML = '<tr><td colspan="3">Error loading appointments.</td></tr>';
        }
    }
}
// --- END UPDATED FUNCTION ---

let pendingSortMode = 'newest'; // 'oldest' | 'newest'

// --- Pending consultation requests (Admin confirmation) ---
// Supports BOTH layouts:
//  - Old table layout:   <tbody id="pending-table-body">...</tbody>
//  - New card layout:    <div class="pending-list">...</div>
async function loadPendingRequests() {
    const tableBody = document.getElementById('pending-table-body');
    const pendingList = document.querySelector('.pending-list');

    // Decide which container to use based on the current HTML
    const useTable = !!tableBody;
    const container = tableBody || pendingList;
    if (!container) return; // Not on a pending-requests page

    // Initial loading state
    if (useTable) {
        container.innerHTML = '<tr><td colspan="4">Loading pending requests...</td></tr>';
    } else {
        container.innerHTML = '<p>Loading...</p>';
    }

    try {
        const reqCol = collection(db, 'consultationRequests');
        const snapshot = await getDocs(reqCol);
        console.log('All consultation requests found:', snapshot.size);
        
        // Filter for pending/unconfirmed requests (status == 'pending' OR status field missing)
        const pendingDocs = snapshot.docs.filter(doc => {
            const status = doc.data().status;
            return status === 'pending' || status === undefined;
        });
        console.log('Pending requests after filter:', pendingDocs.length);

        if (!pendingDocs.length) {
            if (useTable) {
                container.innerHTML = '<tr><td colspan="4">No pending consultation requests.</td></tr>';
            } else {
                container.innerHTML = '<p>No pending consultation requests.</p>';
            }
            return;
        }
        
        // Attach sortDate and sort according to current mode
        const pendingItems = pendingDocs.map(docSnap => {
            const data = docSnap.data();
            // Prefer createdAt timestamp if available, otherwise fall back to date/time fields
            let sortDate;
            if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
                sortDate = new Date(data.createdAt.toMillis());
            } else {
                const dateStr = data.date || data.requestDate;
                const timeStr = data.time || data.requestTime;
                sortDate = parseDateTime(dateStr, timeStr);
            }
            return {
                id: docSnap.id,
                data,
                sortDate
            };
        });

        if (pendingSortMode === 'newest') {
            pendingItems.sort((a, b) => b.sortDate - a.sortDate);
        } else {
            pendingItems.sort((a, b) => a.sortDate - b.sortDate);
        }

        const rows = await Promise.all(pendingItems.map(async (item) => {
            const req = item.data;
            const patientId = req.userId || req.userUID || null;
            let patientName = req.name || 'Unknown Patient';
            let patientEmail = (req.email || req.userEmail || req.patientEmail || '').trim();

            if (patientId) {
                try {
                    const uRef = doc(db, 'users', patientId);
                    const uSnap = await getDoc(uRef);
                    if (uSnap.exists()) {
                        const userData = uSnap.data();
                        patientName = userData.name || patientName;
                        patientEmail = (userData.email || patientEmail || '').trim();
                    }
                } catch (e) {
                    console.error('Failed to fetch patient data for pending request', e);
                }
            }

            const date = req.date || req.requestDate || '--/--/----';
            const time = req.time || req.requestTime || '--:--';

            // Render as table row or card depending on layout
            // Added data-patient-email and data-patient-name attributes
            if (useTable) {
                return `
                    <tr class="pending-item" data-request-id="${item.id}" data-patient-email="${patientEmail}" data-patient-name="${patientName}">
                        <td data-label="Date">${date}</td>
                        <td data-label="Time">${time}</td>
                        <td data-label="Patient"><strong>${patientName}</strong></td>
                        <td data-label="Actions">
                            <button class="btn confirm-request" type="button" style="width:auto;padding:5px 10px;margin-right:5px;">Confirm</button>
                            <button class="btn decline-request" type="button" style="background:#e74c3c;width:auto;padding:5px 10px;">Decline</button>
                        </td>
                    </tr>
                `;
            } else {
                return `
                    <div class="pending-item" data-request-id="${item.id}" data-patient-email="${patientEmail}" data-patient-name="${patientName}">
                        <div class="pending-meta"><strong>${patientName}</strong> — ${date} ${time}</div>
                        <div class="pending-actions">
                            <button class="btn confirm-request">Confirm</button>
                            <button class="btn decline-request" style="background:#e74c3c;border:none">Decline</button>
                        </div>
                    </div>
                `;
            }
        }));

        container.innerHTML = rows.join('');

        // Wire up confirm / decline buttons (works for both layouts)
        container.querySelectorAll('.confirm-request').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const item = e.target.closest('.pending-item');
                const requestId = item.getAttribute('data-request-id');
                const patientEmail = item.getAttribute('data-patient-email');
                const patientName = item.getAttribute('data-patient-name');
                await confirmRequest(requestId, patientEmail, patientName);
            });
        });
        
        container.querySelectorAll('.decline-request').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const item = e.target.closest('.pending-item');
                const id = item.getAttribute('data-request-id');
                const patientEmail = item.getAttribute('data-patient-email');
                const patientName = item.getAttribute('data-patient-name');
                await declineRequest(id, patientEmail, patientName);
            });
        });

    } catch (error) {
        console.error('Error loading pending requests', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (container) {
            if (error.code === 'failed-precondition') {
                if (useTable) {
                    container.innerHTML = '<tr><td colspan="4">Database index required. Check F12 console for link.</td></tr>';
                } else {
                    container.innerHTML = '<p>Database index required. Check F12 console for link.</p>';
                }
            } else if (error.code === 'permission-denied') {
                if (useTable) {
                    container.innerHTML = '<tr><td colspan="4">Permission denied reading requests. Check Firestore rules.</td></tr>';
                } else {
                    container.innerHTML = '<p>Permission denied reading requests. Check Firestore rules.</p>';
                }
            } else {
                if (useTable) {
                    container.innerHTML = '<tr><td colspan="4">Error loading pending requests.</td></tr>';
                } else {
                    container.innerHTML = '<p>Error loading pending requests.</p>';
                }
            }
        }
    }
}

// Send confirmation email using EmailJS
async function sendConfirmationEmail(email, name) {
    const recipientEmail = String(email || '').trim();
    if (!recipientEmail) {
        throw new Error('Missing recipient email.');
    }

    const recipientName = String(name || '').trim() || 'Patient';

    // Basic format guard to avoid calling EmailJS with invalid input.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        throw new Error(`Invalid recipient email: ${recipientEmail}`);
    }

    const subject = "Consultation Confirmed - SafeMind";
    const body = `Dear ${recipientName},\n\nYour consultation request has been successfully confirmed and your consultation schedule is now booked.\n\nThank you,\nThe SafeMind Team`;

    const emailjs = await getEmailJsClient();
    await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        {
            to_email: recipientEmail,
            email: recipientEmail,
            user_email: recipientEmail,
            recipient_email: recipientEmail,
            to_name: recipientName,
            name: recipientName,
            user_name: recipientName,
            recipient_name: recipientName,
            subject,
            message: body
        }
    );

    return true;
}

async function sendDeclineEmail(email, name, reason) {
    const recipientEmail = String(email || '').trim();
    if (!recipientEmail) {
        throw new Error('Missing recipient email.');
    }

    const recipientName = String(name || '').trim() || 'Patient';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        throw new Error(`Invalid recipient email: ${recipientEmail}`);
    }

    const safeReason = String(reason || '').trim();
    const subject = 'Consultation Request Update - SafeMind';
    const message = safeReason
        ? `Your consultation request was declined at this time. Reason: ${safeReason}`
        : 'Your consultation request was declined at this time.';

    const emailjs = await getEmailJsClient();
    const declineTemplateId = String(EMAILJS_CONFIG.declineTemplateId || '').trim();
    if (!declineTemplateId) {
        throw new Error('EmailJS declineTemplateId is not configured.');
    }

    await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        declineTemplateId,
        {
            to_email: recipientEmail,
            email: recipientEmail,
            user_email: recipientEmail,
            recipient_email: recipientEmail,
            to_name: recipientName,
            name: recipientName,
            user_name: recipientName,
            recipient_name: recipientName,
            subject,
            message,
            decline_reason: safeReason || 'Not specified'
        }
    );

    return true;
}

async function confirmRequest(requestId, patientEmail, patientName) {
    if (!confirm('Confirm this consultation and add to calendar?')) return;
    
    try {
        const reqRef = doc(db, 'consultationRequests', requestId);
        const reqSnap = await getDoc(reqRef);
        if (!reqSnap.exists()) return alert('Request not found.');

        const req = reqSnap.data();
        const resolvedPatientName = String(
            patientName || req.name || req.patientName || req.fullName || 'Patient'
        ).trim() || 'Patient';

        // Add to bookedSlots with explicit strings
        await addDoc(collection(db, 'bookedSlots'), {
            date: req.date, // "28/11/2025"
            time: req.time, // "4:00-6:00"
            userId: req.userId || req.userUID || null,
            status: 'confirmed',
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser ? auth.currentUser.uid : null
        });

        await updateDoc(reqRef, {
            status: 'confirmed',
            confirmedAt: serverTimestamp(),
            confirmedBy: auth.currentUser ? auth.currentUser.uid : null
        });

        if (String(patientEmail || '').trim()) {
            try {
                await sendConfirmationEmail(patientEmail, resolvedPatientName);
                alert('Confirmation email sent.');
            } catch (emailError) {
                console.error('Email send failed', emailError);
                alert('Consultation confirmed, but email failed to send. Check EmailJS settings and console logs.');
            }
        } else {
            console.warn('No patient email available, skipping notification.');
        }

        loadPendingRequests(); // Reload list

        alert('Consultation confirmed and added to calendar.');
    } catch (error) {
        console.error('Error confirming request', error);
        alert('Failed to confirm request. See console for details.');
    }
}

async function declineRequest(requestId, patientEmail, patientName) {
    const reason = prompt('Optional: enter a reason for declining (or leave empty):');
    try {
        const reqRef = doc(db, 'consultationRequests', requestId);
        const reqSnap = await getDoc(reqRef);
        if (!reqSnap.exists()) return alert('Request not found.');
        const req = reqSnap.data();

        let resolvedPatientName = String(
            patientName || req.name || req.patientName || req.fullName || 'Patient'
        ).trim() || 'Patient';
        let resolvedPatientEmail = String(
            patientEmail || req.email || req.userEmail || req.patientEmail || ''
        ).trim();

        if (!resolvedPatientEmail && (req.userId || req.userUID)) {
            try {
                const userRef = doc(db, 'users', req.userId || req.userUID);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    resolvedPatientName = String(userData.name || resolvedPatientName).trim() || 'Patient';
                    resolvedPatientEmail = String(userData.email || '').trim();
                }
            } catch (lookupError) {
                console.error('Failed to fetch user for decline email', lookupError);
            }
        }

        await updateDoc(reqRef, {
            status: 'declined',
            declinedAt: serverTimestamp(),
            declinedBy: auth.currentUser ? auth.currentUser.uid : null,
            declineReason: reason || ''
        });

        if (resolvedPatientEmail) {
            try {
                await sendDeclineEmail(resolvedPatientEmail, resolvedPatientName, reason);
                alert('Decline email sent.');
            } catch (emailError) {
                console.error('Decline email send failed', emailError);
                alert('Request declined, but decline email failed to send. Check EmailJS settings and console logs.');
            }
        } else {
            console.warn('No patient email available, skipping decline notification.');
        }

        loadPendingRequests();
        alert('Consultation request declined.');
    } catch (error) {
        console.error('Error declining request', error);
        alert('Failed to decline request. See console for details.');
    }
}

// --- End pending-request functions ---

// --- User Profiles (Admin view) ---
let userProfilesSortMode = 'name'; // 'name' | 'latest'

function buildUserProfileCard({
    userId,
    name,
    age,
    sex,
    email,
    location,
    scheduledText,
    statusType = 'scheduled',
    statusLabel
}) {
    const resolvedLabel = statusLabel || ({
        scheduled: 'With Schedule',
        unscheduled: 'No Schedule',
        today: 'Scheduled Today',
        future: 'Upcoming',
        finished: 'Finished'
    }[statusType] || 'Status');

    return `
        <article class="user-card user-card--${statusType}">
            <div class="user-card-image user-card-image--${statusType}">
                <span class="user-card-status user-card-status--${statusType}">${escapeHtml(resolvedLabel)}</span>
            </div>
            <div class="user-card-content">
                <a href="patient-profile.html?id=${encodeURIComponent(userId)}" class="user-card-title-link">
                    <span class="user-card-title">${escapeHtml(name)}</span>
                </a>
                <p class="user-card-desc">
                    <span class="user-card-desc-line"><strong>Consultation Status:</strong> ${escapeHtml(scheduledText)}</span>
                    <span class="user-card-desc-line"><strong>Age/Sex:</strong> ${escapeHtml(age)} • ${escapeHtml(sex)}</span>
                    <span class="user-card-desc-line"><strong>Location:</strong> ${escapeHtml(location)}</span>
                    <span class="user-card-desc-line"><strong>Email:</strong> ${escapeHtml(email)}</span>
                </p>
                <a href="patient-profile.html?id=${encodeURIComponent(userId)}" class="user-card-action">
                    View Profile &amp; Report
                    <span aria-hidden="true">→</span>
                </a>
            </div>
        </article>
    `;
}

async function loadUserProfiles() {
    const scheduledGrid = document.getElementById('user-profiles-scheduled');
    const unscheduledGrid = document.getElementById('user-profiles-unscheduled');
    if (!scheduledGrid || !unscheduledGrid) return;

    scheduledGrid.innerHTML = '<p>Loading user profiles...</p>';
    unscheduledGrid.innerHTML = '';

    try {
        const usersCol = collection(db, 'users');
        const snapshot = await getDocs(usersCol);

        if (snapshot.empty) {
            scheduledGrid.innerHTML = '<p>No users found.</p>';
            unscheduledGrid.innerHTML = '';
            return;
        }

        let users = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data
            };
        });

        // Sort: by name A–Z or latest (by createdAt or timestamp if available)
        if (userProfilesSortMode === 'latest') {
            users.sort((a, b) => {
                const aTs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const bTs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return bTs - aTs;
            });
        } else {
            users.sort((a, b) => {
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                return aName.localeCompare(bName);
            });
        }

        const scheduledUsers = [];
        const unscheduledUsers = [];

        // Process each user
        for (const user of users) {
            const name = user.name || 'Unknown';
            const age = user.age ? `${user.age} yrs Old` : 'Age not set';
            const sex = user.sex || '--';
            const email = user.email || 'No email';
            const city = user.city || '--';
            const barangay = user.barangay || '--';
            const province = user.province || '--';
            const region = user.region || '--';

            // Build location string
            const locationParts = [barangay, city, province, region].filter(p => p !== '--');
            const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown Location';

            // Fetch the most recently created confirmed consultation for this user
            let scheduledText = 'No confirmed consultations yet';
            let hasScheduledConsultation = false;
            
            try {
                const bookingsQ = query(
                    collection(db, 'bookedSlots'),
                    where('userId', '==', user.id),
                    where('status', '==', 'confirmed'),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                const bookingSnap = await getDocs(bookingsQ);
                if (!bookingSnap.empty) {
                    const booking = bookingSnap.docs[0].data();
                    const bDate = booking.date || '--/--/----';
                    const bTime = booking.time || '--:--';
                    scheduledText = `Last scheduled: ${bDate} at ${bTime}`;
                    hasScheduledConsultation = true;
                }
            } catch (e) {
                console.error('Error loading latest booking for user', user.id, e);
            }

            const userCard = buildUserProfileCard({
                userId: user.id,
                name,
                age,
                sex,
                email,
                location,
                scheduledText,
                statusType: hasScheduledConsultation ? 'scheduled' : 'unscheduled'
            });

            if (hasScheduledConsultation) {
                scheduledUsers.push(userCard);
            } else {
                unscheduledUsers.push(userCard);
            }
        }

        // Display scheduled users
        if (scheduledUsers.length > 0) {
            scheduledGrid.innerHTML = scheduledUsers.join('');
        } else {
            scheduledGrid.innerHTML = '<p>No users with scheduled consultations.</p>';
        }

        // Display unscheduled users
        if (unscheduledUsers.length > 0) {
            unscheduledGrid.innerHTML = unscheduledUsers.join('');
        } else {
            unscheduledGrid.innerHTML = '<p>No users without scheduled consultations.</p>';
        }
        // Handle URL hash navigation and active-sub highlighting for User Profiles sub-links
        const handleUserProfilesHash = () => {
            const hash = window.location.hash;
            const scheduledNav = document.querySelector('a[href$="#scheduled"]');
            const unscheduledNav = document.querySelector('a[href$="#unscheduled"]');

            if (scheduledNav) scheduledNav.classList.remove('active-sub');
            if (unscheduledNav) unscheduledNav.classList.remove('active-sub');

            if (hash === '#scheduled') {
                const el = document.getElementById('user-profiles-scheduled');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (scheduledNav) scheduledNav.classList.add('active-sub');
            } else if (hash === '#unscheduled') {
                const el = document.getElementById('user-profiles-unscheduled');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (unscheduledNav) unscheduledNav.classList.add('active-sub');
            } else {
                // No hash; leave both un-highlighted (or highlight default if needed)
            }
        };
        // Run once and attach listener for later hash changes
        handleUserProfilesHash();
        window.addEventListener('hashchange', handleUserProfilesHash);
    } catch (error) {
        console.error('Error loading user profiles', error);
        scheduledGrid.innerHTML = '<p>Error loading user profiles. Check console for details.</p>';
        unscheduledGrid.innerHTML = '';
    }
}

// Load only scheduled or unscheduled user profiles into a single grid (used by separate pages)
async function loadUserProfilesFiltered(filter) {
    // filter: 'scheduled' | 'unscheduled'
    const scheduledGrid = document.getElementById('user-profiles-grid-scheduled');
    const unscheduledGrid = document.getElementById('user-profiles-grid-unscheduled');
    const targetGrid = filter === 'scheduled' ? scheduledGrid : unscheduledGrid;
    if (!targetGrid) return;

    targetGrid.innerHTML = '<p>Loading user profiles...</p>';

    try {
        const usersCol = collection(db, 'users');
        const snapshot = await getDocs(usersCol);

        if (snapshot.empty) {
            targetGrid.innerHTML = '<p>No users found.</p>';
            return;
        }

        let users = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data
            };
        });

        // Sort as in loadUserProfiles
        if (userProfilesSortMode === 'latest') {
            users.sort((a, b) => {
                const aTs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const bTs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return bTs - aTs;
            });
        } else {
            users.sort((a, b) => {
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                return aName.localeCompare(bName);
            });
        }

        const cards = [];

        for (const user of users) {
            const name = user.name || 'Unknown';
            const age = user.age ? `${user.age} yrs Old` : 'Age not set';
            const sex = user.sex || '--';
            const email = user.email || 'No email';
            const city = user.city || '--';
            const barangay = user.barangay || '--';
            const province = user.province || '--';
            const region = user.region || '--';

            const locationParts = [barangay, city, province, region].filter(p => p !== '--');
            const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown Location';

            // Check for latest confirmed booking
            let scheduledText = 'No confirmed consultations yet';
            let hasScheduledConsultation = false;
            try {
                const bookingsQ = query(
                    collection(db, 'bookedSlots'),
                    where('userId', '==', user.id),
                    where('status', '==', 'confirmed'),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                const bookingSnap = await getDocs(bookingsQ);
                if (!bookingSnap.empty) {
                    const booking = bookingSnap.docs[0].data();
                    const bDate = booking.date || '--/--/----';
                    const bTime = booking.time || '--:--';
                    scheduledText = `Last scheduled: ${bDate} at ${bTime}`;
                    hasScheduledConsultation = true;
                }
            } catch (e) {
                console.error('Error loading latest booking for user', user.id, e);
            }

            // Only include users that match the filter
            if ((filter === 'scheduled' && hasScheduledConsultation) || (filter === 'unscheduled' && !hasScheduledConsultation)) {
                // This user matches the filter, so include them
            } else {
                continue;
            }

            const userCard = buildUserProfileCard({
                userId: user.id,
                name,
                age,
                sex,
                email,
                location,
                scheduledText,
                statusType: hasScheduledConsultation ? 'scheduled' : 'unscheduled'
            });

            cards.push(userCard);
        }

        if (cards.length > 0) {
            targetGrid.innerHTML = cards.join('');
        } else {
            targetGrid.innerHTML = '<p>No users found for this filter.</p>';
        }
    } catch (error) {
        console.error('Error loading user profiles (filtered)', error);
        targetGrid.innerHTML = '<p>Error loading user profiles. Check console for details.</p>';
    }
}

// Load users grouped by consultation date status: 'today', 'finished', or 'future'
async function loadUserProfilesByConsultationStatus(status) {
    // status: 'today' | 'finished' | 'future'
    const gridId = {
        'today': 'user-profiles-grid-today',
        'finished': 'user-profiles-grid-finished',
        'future': 'user-profiles-grid-future'
    }[status];
    const targetGrid = document.getElementById(gridId);
    if (!targetGrid) return;

    targetGrid.innerHTML = '<p>Loading user profiles...</p>';

    try {
        const usersCol = collection(db, 'users');
        const snapshot = await getDocs(usersCol);

        if (snapshot.empty) {
            targetGrid.innerHTML = '<p>No users found.</p>';
            return;
        }

        let users = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return { id: docSnap.id, ...data };
        });

        // Sort by name or latest
        if (userProfilesSortMode === 'latest') {
            users.sort((a, b) => {
                const aTs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const bTs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return bTs - aTs;
            });
        } else {
            users.sort((a, b) => {
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                return aName.localeCompare(bName);
            });
        }

        const cards = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        for (const user of users) {
            const name = user.name || 'Unknown';
            const age = user.age ? `${user.age} yrs Old` : 'Age not set';
            const sex = user.sex || '--';
            const email = user.email || 'No email';
            const city = user.city || '--';
            const barangay = user.barangay || '--';
            const province = user.province || '--';
            const region = user.region || '--';

            const locationParts = [barangay, city, province, region].filter(p => p !== '--');
            const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown Location';

            // Fetch latest confirmed booking
            let latestBooking = null;
            try {
                const bookingsQ = query(
                    collection(db, 'bookedSlots'),
                    where('userId', '==', user.id),
                    where('status', '==', 'confirmed'),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                const bookingSnap = await getDocs(bookingsQ);
                if (!bookingSnap.empty) {
                    latestBooking = bookingSnap.docs[0].data();
                }
            } catch (e) {
                console.error('Error loading booking for user', user.id, e);
            }

            if (!latestBooking) continue; // Skip users without confirmed bookings

            // Parse booking date
            const dParts = latestBooking.date ? latestBooking.date.split('/') : [];
            let bookingDate = null;
            if (dParts.length === 3) {
                bookingDate = new Date(
                    parseInt(dParts[2], 10),
                    parseInt(dParts[1], 10) - 1,
                    parseInt(dParts[0], 10)
                );
                bookingDate.setHours(0, 0, 0, 0);
            }

            if (!bookingDate) continue;

            // Filter by status
            let matchesStatus = false;
            if (status === 'today' && bookingDate.getTime() === today.getTime()) {
                matchesStatus = true;
            } else if (status === 'finished' && bookingDate < today) {
                matchesStatus = true;
            } else if (status === 'future' && bookingDate >= tomorrow) {
                matchesStatus = true;
            }

            if (!matchesStatus) continue;

            const scheduledText = `Scheduled: ${latestBooking.date} at ${latestBooking.time || '--:--'}`;

            const statusTypeByPage = {
                today: 'today',
                finished: 'finished',
                future: 'future'
            };
            const userCard = buildUserProfileCard({
                userId: user.id,
                name,
                age,
                sex,
                email,
                location,
                scheduledText,
                statusType: statusTypeByPage[status] || 'scheduled'
            });

            cards.push(userCard);
        }

        if (cards.length > 0) {
            targetGrid.innerHTML = cards.join('');
        } else {
            const statusLabel = { 'today': 'scheduled today', 'finished': 'with finished consultations', 'future': 'with future consultations' }[status];
            targetGrid.innerHTML = `<p>No users ${statusLabel}.</p>`;
        }
    } catch (error) {
        console.error('Error loading user profiles by status', error);
        targetGrid.innerHTML = '<p>Error loading user profiles. Check console for details.</p>';
    }
}

// --- (LATEST) Calendar state & functions ---
let currentViewDate = new Date();
// --- **** TIME CHANGE #1: New 8am-6pm map **** ---
// This maps our database time (08:00) to a grid row number (1)
const timeToRow = {
    // 24-hour format
    '08:00': 1, '09:00': 2, '10:00': 3, '11:00': 4, '12:00': 5,
    '13:00': 6, '14:00': 7, '15:00': 8, '16:00': 9, '17:00': 10, '18:00': 11,
    
    // 12-hour format handling (maps 1-6 to the afternoon rows)
    '01:00': 6, '02:00': 7, '03:00': 8, '04:00': 9, '05:00': 10, '06:00': 11
};
// --- **** TIME CHANGE #2: New 8am-5pm labels (for 10 slots) **** ---
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00' ,'18:00'];

// This function now *only* draws the background grid and labels
function renderWeeklyCalendar(date) {
    const calendarTitle = document.getElementById('calendar-title');
    const calendarHeader = document.getElementById('calendar-header');
    const calendarBody = document.getElementById('calendar-body');
    if (!calendarTitle || !calendarHeader || !calendarBody) return;

    calendarHeader.innerHTML = ''; // Clear header
    calendarBody.innerHTML = '';   // Clear body

    const sunday = getSunday(date);
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

    calendarTitle.textContent = `${monthFormatter.format(sunday).toUpperCase()} ${sunday.getFullYear()}`;

    // 1. Build Header
    calendarHeader.innerHTML = '<div class="time-column">Time</div>';
    for (let i = 0; i < 7; i++) { // SUN - SAT
        const currentDay = new Date(sunday);
        currentDay.setDate(sunday.getDate() + i);
        const dayName = dayFormatter.format(currentDay).toUpperCase();
        const dayNum = currentDay.getDate();
        calendarHeader.innerHTML += `<div class="day-header">${dayName} ${dayNum}</div>`;
    }

    // 2. Build Body (Time labels and background columns)
    // Add time labels
    for (let i = 0; i < timeSlots.length; i++) {
        const time = timeSlots[i];
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = formatTimeLabel(time);
        label.style.gridRow = i + 1; // Place it in the correct row
        label.style.gridColumn = 1;  
        calendarBody.appendChild(label);
    }
    
    // Add 7 day columns
    for (let i = 0; i < 7; i++) { // 7 day columns
        const dayCol = document.createElement('div');
        dayCol.className = 'day-bg-col';
        dayCol.style.gridColumn = i + 2; // Start from 2nd grid column
        calendarBody.appendChild(dayCol);
    }
}

// --- **** LATEST CALENDAR FUNCTION (WITH NAME FETCHING AND DD/MM/YYYY FIX) **** ---
async function initializeCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    if (!calendarBody) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Render the background grid first
    renderWeeklyCalendar(currentViewDate);

    // Calculate Week Boundaries (Start of Sunday to End of Saturday)
    const weekStart = getSunday(currentViewDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); 
    weekEnd.setHours(23, 59, 59, 999);

    try {
        // 2. Fetch all appointments
        // Only show bookings that have been confirmed by an admin
        const q = query(collectionGroup(db, "bookedSlots"), where('status', '==', 'confirmed'), orderBy("time"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("No appointments found for calendar.");
        }

        // 3. Loop through docs and place them on the grid
        querySnapshot.forEach(async (apptDoc) => {
            const appt = apptDoc.data();
            const patientId = appt.userId; // Get the ID

            // --- FIXED: Format Date (DD/MM/YYYY -> Date object) ---
            if (!appt.date || typeof appt.date !== 'string') return;
            const dParts = appt.date.split('/'); 
            if (dParts.length !== 3) {
                console.warn("Skipping appointment with malformed date:", appt.date);
                return;
            }
            // Manual construction: new Date(Year, MonthIndex, Day)
            const apptDate = new Date(
                parseInt(dParts[2], 10),     // Year
                parseInt(dParts[1], 10) - 1, // Month (0-indexed)
                parseInt(dParts[0], 10)      // Day
            );

            // B. Check if this appointment is in the currently displayed week
            if (apptDate < weekStart || apptDate > weekEnd) {
                return; // Skip this appointment, it's not for this week
            }
            
            // C. Get Day of Week (0=Sun, 1=Mon...).
            const apptDay = apptDate.getDay();
            const colStart = apptDay + 2; // Sun=2, Mon=3...

            // D. Get Time Info
            const timeParts = appt.time.split('-');
            if (timeParts.length !== 2) return;
            
            const rawStartTime = timeParts[0].trim(); // e.g. "4:00"
            const endTimePart = timeParts[1].trim(); // e.g. "6:00"
            
            // Use helper to convert "4:00" to "16:00"
            const startTime = normalizeStartTime(rawStartTime);
            // Use helper to convert "6:00" to "18:00"
            const endTime = normalizeStartTime(endTimePart.split(':')[0] + ':00');

            const rowStart = timeToRow[startTime];
            const rowEnd = timeToRow[endTime] ? timeToRow[endTime] : (timeToRow[startTime] ? timeToRow[startTime] + 1 : null); 
            
            if (!rowStart) {
                console.warn("Skipping appointment. Could not find row for start time:", startTime, "(Original:", rawStartTime, ")");
                return;
            }

            let appointmentStatus = 'scheduled';
            if (apptDate.getTime() === today.getTime()) {
                appointmentStatus = 'today';
            } else if (apptDate < today) {
                appointmentStatus = 'finished';
            } else {
                appointmentStatus = 'future';
            }

            // --- **** NEW: Fetch Patient Name **** ---
            let patientName = "Unknown Patient";
            if (patientId) {
                try {
                    const userDocRef = doc(db, 'users', patientId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        patientName = userDocSnap.data().name || "Unknown Patient";
                    }
                } catch (e) {
                    console.error("Error fetching name for calendar", e);
                }
            }
            // --- **** END: Fetch Patient Name **** ---

            // E. Create the appointment element
            const apptElement = document.createElement('div');
            apptElement.className = 'appointment';
            
            // Set grid position via CSS variables
            apptElement.style.setProperty('--col-start', colStart);
            apptElement.style.setProperty('--row-start', rowStart);
            apptElement.style.setProperty('--row-end', rowEnd);
            
            // Create the inner link (use the new patientName)
            apptElement.innerHTML = `
                <a href="patient-profile.html?id=${encodeURIComponent(patientId)}" class="patient-appointment patient-appointment--${appointmentStatus}">
                    ${patientName}
                    <span class="appt-time">${appt.time}</span>
                </a>
            `;
            
            // F. Add to calendar body
            calendarBody.appendChild(apptElement);
        });

    } catch (error) {
        console.error("Error initializing calendar: ", error);
    }
}
// --- END LATEST CALENDAR FUNCTION ---

function formatTimeLabel(time) {
    const [hour] = time.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour} ${ampm}`;
}

// --- CHANGE #8: This function now gets SUNDAY ---
function getSunday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const diff = d.getDate() - day; // Subtract the day number to get to Sunday
    return new Date(d.setDate(diff));
}

// --- NEW HELPER: Normalizes time from DB to match timeToRow map ---
function normalizeStartTime(timeStr) {
    // Accepts "4:00", "08:00", "4:00 PM", etc.
    const isPM = timeStr.toLowerCase().includes('pm');
    const isAM = timeStr.toLowerCase().includes('am');

    // Strip AM/PM before parsing
    const cleanTimeStr = timeStr.replace(/am|pm/gi, '').trim();
    const parts = cleanTimeStr.split(':');
    if (parts.length !== 2) return null;

    let hour = parseInt(parts[0], 10);
    let minute = parts[1].trim();
    
    if (isNaN(hour)) return null;

    // Standard 12h -> 24h conversion
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    return `${String(hour).padStart(2, '0')}:${minute}`;
}
// --- END NEW HELPER ---

// --- END (LATEST) Calendar functions ---


// This array is no longer used by the new calendar
let allAppointments = [];

// UI selectors (Define these once if needed globally)
const wrapper = document.querySelector('.wrapper');
const loginlink = document.querySelector('.login-link');
// const regsiterlink = document.querySelector('.register-link'); // No longer needed
const iconClose = document.querySelector('.icon-close');
const body = document.querySelector('body');
const nav = document.getElementById('primary-navigation'); // Might be null
const navToggle = document.querySelector('.nav-toggle'); // Might be null
const scrim = document.querySelector('.scrim'); // Might be null

// Toggle login/register view
// if (regsiterlink && wrapper) regsiterlink.addEventListener('click', ()=> wrapper.classList.add('active')); // No longer needed
if (loginlink && wrapper) loginlink.addEventListener('click', ()=> wrapper.classList.remove('active'));

// Close modal
if (iconClose) iconClose.addEventListener('click', closeOverlays);

// Mobile nav toggle (check elements)
if (navToggle && nav) {
    navToggle.addEventListener('click', ()=> {
        const open = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
        showScrim(open);
    });
}

// Scrim click closes overlays
if (scrim) scrim.addEventListener('click', closeOverlays);

// ESC closes overlays
document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') closeOverlays();
});

// --- Helper Functions ---
function closeOverlays(){
    if (wrapper) wrapper.classList.remove('active-popup');
    if (body) body.classList.remove('login-active');
    if (nav) nav.classList.remove('open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    
    // Also close the new main nav
    const mainNav = document.getElementById('primary-navigation');
    const mainHamburger = document.getElementById('mobile-hamburger-main');
    if (mainNav && mainNav.classList.contains('open')) {
        mainNav.classList.remove('open');
        if (mainHamburger) mainHamburger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
    }

    showScrim(false);
}

function showScrim(show){
    if (!scrim) return;
    if (show) scrim.classList.add('visible'); else scrim.classList.remove('visible');
}

// --- Helpers: Swipeable Progress Cards ---
function toJsDate(value) {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
        const raw = value.trim();

        // Supports values like "2025-11-17T16:34:10.597002" (microseconds, no timezone).
        const microsecondIsoMatch = raw.match(
            /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?$/
        );

        if (microsecondIsoMatch) {
            const [, year, month, day, hour, minute, second, fraction = '0'] = microsecondIsoMatch;
            const milliseconds = Number(fraction.slice(0, 3).padEnd(3, '0'));
            // API timestamps in this format are interpreted as UTC.
            // Example: "2026-04-24T06:18:29.326181" => 06:18 UTC.
            return new Date(Date.UTC(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hour),
                Number(minute),
                Number(second),
                milliseconds
            ));
        }

        const parsedString = new Date(raw);
        return Number.isNaN(parsedString.getTime()) ? null : parsedString;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value) {
    const date = toJsDate(value);
    if (!date) return '—';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDisplayTime(value) {
    const date = toJsDate(value);
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
}

function toLocalInputDate(value) {
    const date = toJsDate(value);
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseInputDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function isDateBefore(candidateDate, minimumDate) {
    const candidate = parseInputDate(candidateDate);
    const minimum = parseInputDate(minimumDate);
    if (!candidate || !minimum) return false;
    return candidate.getTime() < minimum.getTime();
}

function toDdMmYyyy(inputDate) {
    const parsed = parseInputDate(inputDate);
    if (!parsed) return '';
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function ddMmYyyyToInputDate(value) {
    if (typeof value !== 'string') return '';
    const parts = value.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    if (!day || !month || !year) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function normalizeTimeSlot(value) {
    if (!value || typeof value !== 'string') return '';
    return value
        .toLowerCase()
    .replace(/[\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/\s+/g, '')
    .replace(/(am|pm)/g, '');
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function parsePredictionQa(predictionData) {
    const inputData = predictionData.input_data || {};
    let finalRatings = [];
    let finalTexts = [];

    if (predictionData.ratings && Array.isArray(predictionData.ratings)) {
        finalRatings = predictionData.ratings;
        finalTexts = predictionData.texts || [];
    } else if (inputData.answers && Array.isArray(inputData.answers)) {
        finalRatings = inputData.answers;
        finalTexts = inputData.texts || [];
    } else {
        for (let i = 1; i <= 10; i++) {
            if (inputData[`rating_${i}`]) {
                finalRatings.push(inputData[`rating_${i}`]);
                finalTexts.push(inputData[`text_${i}`] || "");
            }
        }
    }

    const ratings = finalRatings.map((rating, index) => {
        const qNum = index + 1;
        const questionKey = `rating_${qNum}`;
        const questionLabel = QUESTION_MAP[questionKey] || `Question ${qNum}`;
        return {
            qNum,
            questionLabel,
            rating
        };
    });

    const sentences = finalTexts
        .map((text, index) => {
            const qNum = index + 1;
            const textKey = `text_${qNum}`;
            const textLabel = QUESTION_MAP[textKey] || `Context ${qNum}`;
            return {
                qNum,
                textLabel,
                text: text || ''
            };
        })
        .filter((entry) => entry.text.trim() !== '');

    return { ratings, sentences };
}

function buildProgressFullReportHtml(fullReport) {
    const ratingItems = (fullReport.qa?.ratings || []).map((entry) => `
        <li>
            <strong>Q${entry.qNum}:</strong> ${escapeHtml(entry.questionLabel)}
            <div>Rating: <span class="highlight">${escapeHtml(entry.rating)} / 5</span></div>
        </li>
    `).join('');

    const sentenceItems = (fullReport.qa?.sentences || []).map((entry) => `
        <li>
            <strong>${escapeHtml(entry.textLabel)}</strong>
            <div>"${escapeHtml(entry.text)}"</div>
        </li>
    `).join('');

    return `
        <div class="progress-report-section">
            <h5>Patient</h5>
            <p>${escapeHtml(fullReport.name)} • ${escapeHtml(fullReport.age)} • ${escapeHtml(fullReport.sex)}</p>
            <p>${escapeHtml(fullReport.location)}</p>
            <p>${escapeHtml(fullReport.email)}</p>
        </div>
        <div class="progress-report-section">
            <h5>Analysis Result</h5>
            <p>Severity: <strong>${escapeHtml(fullReport.severityText)}</strong> (${escapeHtml(String(fullReport.severityPercent))}%)</p>
            <p>${escapeHtml(fullReport.recommendation || 'No recommendation provided.')}</p>
        </div>
        <div class="progress-report-section">
            <h5>Rating Questions & Answers</h5>
            <ul class="progress-report-list">
                ${ratingItems || '<li>No rating answers found.</li>'}
            </ul>
        </div>
        <div class="progress-report-section">
            <h5>Sentence Questions & Answers</h5>
            <ul class="progress-report-list">
                ${sentenceItems || '<li>No sentence answers found.</li>'}
            </ul>
        </div>
    `;
}

function renderProgressCards(cardsTrack, cardsData, handlers = {}) {
    const { onEditFollowUp, onDeleteFollowUp } = handlers;
    if (!cardsTrack) return;

    cardsTrack.innerHTML = '';

    if (!Array.isArray(cardsData) || cardsData.length === 0) {
        cardsTrack.innerHTML = '<tr><td colspan="6" class="progress-card-empty">No reports available yet.</td></tr>';
        return;
    }

    cardsData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = 'progress-history-row';
        row.dataset.rowIndex = String(index);
        const cardType = item.type || (index === 0 ? 'initial' : 'followup');

        const severityValue = Number(item.score);
        const scoreText = Number.isFinite(severityValue) ? `${Math.round(severityValue)}%` : '—';
        const descriptionText = item.notes || item.summary || 'No notes available.';
        const canExpandFullReport = cardType === 'initial' && item.fullReport;
        const reportLabel = item.label || `Report ${index + 1}`;
        const resolvedTimeText = cardType === 'initial'
            ? (formatDisplayTime(item.timestamp) || item.consultationTimeSlot || 'Initial AI Assessment')
            : (item.consultationTimeSlot || '—');

        let actionsSection = '';
        if (canExpandFullReport) {
            actionsSection += '<button type="button" class="progress-table-btn progress-table-btn--view" data-action="toggle-report">View Full Report</button>';
        }
        if (cardType === 'followup' && item.id) {
            actionsSection += `
                <button type="button" class="progress-table-btn progress-table-btn--edit" data-action="edit-followup">Edit</button>
                <button type="button" class="progress-table-btn progress-table-btn--delete" data-action="delete-followup">Delete</button>
            `;
        }

        row.innerHTML = `
            <td>
                <span class="progress-table-status progress-table-status--${escapeHtml(cardType)}">${escapeHtml(reportLabel)}</span>
            </td>
            <td>${escapeHtml(item.consultationDate || formatDisplayDate(item.timestamp))}</td>
            <td>${escapeHtml(resolvedTimeText)}</td>
            <td class="progress-notes-cell">${escapeHtml(descriptionText)}</td>
            <td>
                <span class="progress-severity-pill">${escapeHtml(scoreText)}</span>
            </td>
            <td>
                <div class="progress-table-actions">${actionsSection || '<span class="progress-table-no-action">-</span>'}</div>
            </td>
        `;

        cardsTrack.appendChild(row);

        let detailsRow = null;
        if (canExpandFullReport) {
            detailsRow = document.createElement('tr');
            detailsRow.className = 'progress-history-details-row hidden';
            detailsRow.innerHTML = `
                <td colspan="6">
                    <div class="progress-card-full-report">
                        ${buildProgressFullReportHtml(item.fullReport)}
                    </div>
                </td>
            `;
            cardsTrack.appendChild(detailsRow);
        }

        const viewBtn = row.querySelector('[data-action="toggle-report"]');
        if (viewBtn && detailsRow) {
            viewBtn.addEventListener('click', () => {
                const isHidden = detailsRow.classList.toggle('hidden');
                viewBtn.textContent = isHidden ? 'View Full Report' : 'Hide Full Report';
            });
        }

        if (cardType === 'followup' && item.id) {
            const editBtn = row.querySelector('[data-action="edit-followup"]');
            const deleteBtn = row.querySelector('[data-action="delete-followup"]');

            if (editBtn && typeof onEditFollowUp === 'function') {
                editBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    onEditFollowUp(item);
                });
            }

            if (deleteBtn && typeof onDeleteFollowUp === 'function') {
                deleteBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    onDeleteFollowUp(item);
                });
            }
        }
    });
}

function updateFocusedCard(cardsScroll, cardsTrack) {
    if (!cardsScroll || !cardsTrack) return;
    // Retained for backward compatibility after moving from cards to table layout.
}
// --- End Helper Functions ---


// --- Login logic with persistence (MODIFIED) ---
const loginForm = document.querySelector('.form-box.login form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMeInput = document.querySelector('.form-box.login input[name="remember"]');
        const rememberMe = rememberMeInput ? rememberMeInput.checked : false;

        // --- NEW: Admin-only check ---
        if (email !== 'atchazoj6@gmail.com') {
            alert('This email address is not authorized for login.');
            return; // Stop the login process
        }
        // --- END: Admin-only check ---

        console.log("Remember Me:", rememberMe);
        const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        console.log("Setting persistence to:", persistenceType === browserLocalPersistence ? "Local" : "Session");

        setPersistence(auth, persistenceType)
            .then(() => {
                console.log("Persistence set.");
                return signInWithEmailAndPassword(auth, email, password);
            })
            .then((userCredential) => {
                console.log("Login successful.");
                closeOverlays();
                // --- FIX: Redirect to confirmed consultations ---
                window.location.href = 'confirmed-consultations.html';
            })
            .catch((error) => {
                console.error("Login error:", error);
                const errorCode = error.code;
                if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
                    alert('Invalid email or password. Please try again.');
                } else {
                    alert(error.message);
                }
            });
    });
}

// --- Registration logic (REMOVED) ---
// const registerForm = document.querySelector('.form-box.register form');
// ... all registration logic removed ...

// --- Sidebar hidden nav toggle ---
const sidebarHamburger = document.querySelector('.sidebar-header .hamburger-menu');
const hiddenNavItems = document.querySelectorAll('.nav-item.hidden');
if (sidebarHamburger && hiddenNavItems.length > 0) {
    sidebarHamburger.addEventListener('click', function() {
        hiddenNavItems.forEach(item => item.classList.toggle('show'));
    });
}

// --- **** (THIS IS THE UPDATED FUNCTION with PERCENTAGE CALC & NEW Q&A) **** ---
async function loadPatientProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');

    // --- Get all page elements ---
    const nameElement = document.getElementById('patient-name');
    const ageElement = document.getElementById('patient-age');
    const locationElement = document.getElementById('patient-location');
    const severityElement = document.getElementById('severity-value');
    const severityTextElement = document.getElementById('severity-text');
    const descriptionElement = document.querySelector('.severity-description p');
    const needle = document.getElementById('gauge-needle');

    // --- Get Progress elements ---
    const progressSummary = document.getElementById('progress-summary');
    const progressCardsScroll = document.getElementById('progress-cards-scroll');
    const progressCardsTrack = document.getElementById('progress-cards-track');
    const addFindingsBtn = document.getElementById('add-findings-btn');
    const finishProgressBtn = document.getElementById('finish-progress-btn');

    // Findings Card elements
    const findingsCard = document.getElementById('consultation-findings-card');
    const saveEntryBtn = document.getElementById('save-entry-btn');
    const cancelEntryBtn = document.getElementById('cancel-entry-btn');
    const findingsLog = document.getElementById('findings-log');
    const consultationDate = document.getElementById('consultation-date');
    const consultationTime = document.getElementById('consultation-time');
    const reopenCaseBtn = document.getElementById('reopen-case-btn');
    let latestSeverityScore = 0;
    let firstAnalysisDateIso = '';
    let followUpEntriesCount = 0;
    let firstLockedConsultationSlot = null;

    const validTimeSlots = ["8:00-10:00", "10:00-12:00", "2:00-4:00", "4:00-6:00"];

    const isSlotInUse = async (dateValue, timeSlot) => {
        const slotDate = toDdMmYyyy(dateValue);
        if (!slotDate) return true;

        const bookedSlotQuery = query(
            collection(db, 'bookedSlots'),
            where('status', '==', 'confirmed'),
            where('date', '==', slotDate)
        );
        const requestSlotQuery = query(
            collection(db, 'consultationRequests'),
            where('status', '==', 'confirmed'),
            where('date', '==', slotDate)
        );

        const [bookedSlotSnapshot, requestSlotSnapshot] = await Promise.all([
            getDocs(bookedSlotQuery),
            getDocs(requestSlotQuery)
        ]);

        const allSlots = [
            ...bookedSlotSnapshot.docs,
            ...requestSlotSnapshot.docs
        ];

        if (allSlots.length === 0) return false;

        const normalizedSelectedSlot = normalizeTimeSlot(timeSlot);
        return allSlots.some((slotDoc) => {
            const slotData = slotDoc.data();
            return normalizeTimeSlot(slotData.time) === normalizedSelectedSlot;
        });
    };

    const applyFollowUpSchedulingMode = () => {
        const isFirstFollowUp = followUpEntriesCount === 0;
        const hasLockedSlot = Boolean(firstLockedConsultationSlot);

        if (!consultationDate || !consultationTime) return;

        if (isFirstFollowUp && hasLockedSlot) {
            consultationDate.value = firstLockedConsultationSlot.dateInput;
            consultationTime.value = firstLockedConsultationSlot.timeSlot;
            consultationDate.disabled = true;
            consultationTime.disabled = true;
        } else {
            consultationDate.disabled = false;
            consultationTime.disabled = false;
        }
    };

    // Add loading state to cards
    if (progressCardsTrack) {
        progressCardsTrack.innerHTML = '<tr><td colspan="6" class="progress-card-empty">Loading reports...</td></tr>';
    }

    // --- Get all NEW modal elements ---
    const modalPatientName = document.getElementById('modal-patient-name');
    const modalPatientAge = document.getElementById('modal-patient-age');
    const modalPatientSex = document.getElementById('modal-patient-sex');
    const modalPatientLocation = document.getElementById('modal-patient-location');
    const modalPatientEmail = document.getElementById('modal-patient-email');
    const modalSeverityText = document.getElementById('modal-severity-text');
    const modalSeverityPercent = document.getElementById('modal-severity-percent');
    const modalRecommendation = document.getElementById('modal-recommendation');
    const modalRatingQaContainer = document.getElementById('modal-rating-qa-container');
    const modalSentenceQaContainer = document.getElementById('modal-sentence-qa-container');
    const legacyQaContainer = document.getElementById('modal-qa-container');
    // --- End modal elements ---

    if (!patientId) {
        if (nameElement) nameElement.textContent = "No Patient ID Provided";
        return;
    }

    let patientReportSnapshot = {
        name: 'Unknown Patient',
        age: 'Age not set',
        sex: '--',
        location: 'Unknown Location',
        email: 'No email provided'
    };

    try {
        // --- FETCH 1: Get User Info from 'users' collection ---
        const userDocRef = doc(db, "users", patientId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            // Build full location string
            const locationParts = [];
            if (userData.barangay) locationParts.push(userData.barangay);
            if (userData.city) locationParts.push(userData.city);
            if (userData.province) locationParts.push(userData.province);
            if (userData.region) locationParts.push(userData.region);
            const fullLocation = locationParts.length > 0 ? locationParts.join(', ') : (userData.city || "Unknown Location");
            
            // Populate main page
            const sexElement = document.getElementById('patient-sex');
            if (nameElement) nameElement.textContent = userData.name || "Unknown Patient";
            if (ageElement) ageElement.textContent = userData.age ? `${userData.age} yrs Old` : 'Age not set';
            if (sexElement) sexElement.textContent = userData.sex || '--';
            if (locationElement) locationElement.textContent = fullLocation;

            // --- Populate modal with user data ---
            if (modalPatientName) modalPatientName.textContent = userData.name || "Unknown Patient";
            if (modalPatientAge) modalPatientAge.textContent = userData.age || "--";
            if (modalPatientSex) modalPatientSex.textContent = userData.sex || "--";
            if (modalPatientLocation) modalPatientLocation.textContent = fullLocation;
            if (modalPatientEmail) modalPatientEmail.textContent = userData.email || "No email provided";

            patientReportSnapshot = {
                name: userData.name || 'Unknown Patient',
                age: userData.age ? `${userData.age} yrs Old` : 'Age not set',
                sex: userData.sex || '--',
                location: fullLocation,
                email: userData.email || 'No email provided'
            };
            
            // --- Check case status and manage button visibility ---
            const caseStatus = userData.caseStatus || 'open';
            if (caseStatus === 'finished') {
                // Case is finished
                if (addFindingsBtn) {
                    addFindingsBtn.disabled = true;
                    addFindingsBtn.style.opacity = '0.5';
                    addFindingsBtn.style.cursor = 'not-allowed';
                }
                if (finishProgressBtn) {
                    finishProgressBtn.style.display = 'none';
                }
                if (reopenCaseBtn) {
                    reopenCaseBtn.style.display = 'inline-block';
                }
            } else {
                // Case is open
                if (addFindingsBtn) {
                    addFindingsBtn.disabled = false;
                    addFindingsBtn.style.opacity = '1';
                    addFindingsBtn.style.cursor = 'pointer';
                }
                if (finishProgressBtn) {
                    finishProgressBtn.style.display = 'inline-block';
                }
                if (reopenCaseBtn) {
                    reopenCaseBtn.style.display = 'none';
                }
            }
            
        } else {
            console.log("Patient document not found in 'users' collection");
            if (nameElement) nameElement.textContent = "Patient Not Found";
        }

        const lockedSlotQueries = [
            query(
                collection(db, 'bookedSlots'),
                where('userId', '==', patientId),
                where('status', '==', 'confirmed')
            ),
            query(
                collection(db, 'bookedSlots'),
                where('userUID', '==', patientId),
                where('status', '==', 'confirmed')
            ),
            query(
                collection(db, 'consultationRequests'),
                where('userId', '==', patientId),
                where('status', '==', 'confirmed')
            ),
            query(
                collection(db, 'consultationRequests'),
                where('userUID', '==', patientId),
                where('status', '==', 'confirmed')
            )
        ];

        const lockedSlotSnapshots = await Promise.all(lockedSlotQueries.map((lockedQuery) => getDocs(lockedQuery)));
        const lockedSlotDocs = lockedSlotSnapshots.flatMap((snapshot) => snapshot.docs);

        if (lockedSlotDocs.length > 0) {
            const normalizedSlots = lockedSlotDocs
                .map((slotDoc) => {
                    const slotData = slotDoc.data();
                    const inputDate = ddMmYyyyToInputDate(slotData.date);
                    const normalizedSlot = validTimeSlots.find(
                        (slot) => normalizeTimeSlot(slot) === normalizeTimeSlot(slotData.time)
                    ) || '';
                    const sortDate = parseDateTime(slotData.date, slotData.time);
                    return {
                        dateInput: inputDate,
                        timeSlot: normalizedSlot,
                        sortDate
                    };
                })
                .filter((entry) => entry.dateInput && entry.timeSlot)
                .filter((entry, index, entries) => {
                    const key = `${entry.dateInput}|${entry.timeSlot}`;
                    return entries.findIndex((candidate) => `${candidate.dateInput}|${candidate.timeSlot}` === key) === index;
                })
                .sort((a, b) => a.sortDate - b.sortDate);

            if (normalizedSlots.length > 0) {
                firstLockedConsultationSlot = {
                    dateInput: normalizedSlots[0].dateInput,
                    timeSlot: normalizedSlots[0].timeSlot
                };
            }
        }

        // --- FETCH 2: Get all predictions from 'api_predictions' ---
        const predictionsRef = collectionGroup(db, "api_predictions");

        const predictionsQuery = query(
            predictionsRef,
            where("userId", "==", patientId),    // Find reports for this user
            orderBy("timestamp", "asc")
        );

        const querySnapshot = await getDocs(predictionsQuery);

        if (!querySnapshot.empty) {
            const predictionDataList = querySnapshot.docs.map((predictionDoc) => predictionDoc.data());
            const latestPredictionData = predictionDataList[predictionDataList.length - 1];
            const firstPredictionData = predictionDataList[0];

            firstAnalysisDateIso = toLocalInputDate(firstPredictionData.timestamp);
            if (firstAnalysisDateIso && consultationDate) {
                consultationDate.min = firstAnalysisDateIso;
            }

            if (!firstAnalysisDateIso) {
                firstAnalysisDateIso = toLocalInputDate(latestPredictionData.timestamp);
                if (firstAnalysisDateIso && consultationDate) {
                    consultationDate.min = firstAnalysisDateIso;
                }
            }
            
            // --- UPDATED Logic for severity and gauge ---
            // 1. Get raw numeric score (e.g., 1.6, 2.8)
            let rawScore = parseFloat(latestPredictionData.severity_numeric);
            if (isNaN(rawScore)) rawScore = 1.0;

            // 2. Convert Scale: (1.0 - 3.0) to (0% - 100%)
            // Formula: ((Score - 1.0) / 2.0) * 100
            let calculatedPercent = ((rawScore - 1.0) / 2.0) * 100;

            // 3. Clamp to ensure 0-100 range
            calculatedPercent = Math.max(0, Math.min(100, calculatedPercent));

            const displayPercent = Math.round(calculatedPercent);
            const severityText = latestPredictionData.severity || 'unknown';
            const parsedQa = parsePredictionQa(latestPredictionData);
            latestSeverityScore = displayPercent;
            
            // --- Populate main page ---
            if (severityElement) severityElement.textContent = displayPercent + '%';
            if (severityTextElement) severityTextElement.textContent = severityText;
            if (descriptionElement) {
                descriptionElement.innerHTML = `Based on SafeMind's analysis, the level of severity of the patient's depression is <strong>${displayPercent}%</strong> (${severityText}), which indicates a <strong>${severityText}</strong> level of depression.`;
            }
            if (needle) {
                // -90deg is 0%, 90deg is 100%
                let angle = ((displayPercent / 100) * 180) - 90;
                needle.style.transform = `rotate(${angle}deg)`;
            }

            // --- Populate Progress Monitoring Card ---
            if (progressSummary) {
                progressSummary.textContent = `${displayPercent}% (${severityText})`;
            }

            // --- DYNAMIC SWIPE-CARD LOGIC ---
            // First card is the initial AI analysis; follow-ups are subsequent cards.
            if (progressCardsTrack) {
                progressCardsTrack.innerHTML = '';

                const onEditFollowUp = async (followUpItem) => {
                    const existingNotes = followUpItem.notes || '';
                    const existingDate = followUpItem.consultationDate || '';
                    const existingTimeSlot = followUpItem.consultationTimeSlot || '8:00-10:00';

                    const updatedNotes = prompt('Edit findings notes:', existingNotes);
                    if (updatedNotes === null) return;

                    const updatedDate = prompt('Edit consultation date (YYYY-MM-DD):', existingDate);
                    if (updatedDate === null) return;
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedDate)) {
                        alert('Invalid date format. Please use YYYY-MM-DD.');
                        return;
                    }
                    if (firstAnalysisDateIso && isDateBefore(updatedDate, firstAnalysisDateIso)) {
                        alert(`Consultation date cannot be before the first AI analysis date (${firstAnalysisDateIso}).`);
                        return;
                    }

                    const updatedTimeSlot = prompt(
                        'Edit consultation time slot:\n8:00-10:00 | 10:00-12:00 | 2:00-4:00 | 4:00-6:00',
                        existingTimeSlot
                    );
                    if (updatedTimeSlot === null) return;
                    if (!validTimeSlots.includes(updatedTimeSlot)) {
                        alert('Invalid time slot. Use one of: 8:00-10:00, 10:00-12:00, 2:00-4:00, 4:00-6:00');
                        return;
                    }

                    try {
                        const timeSlotMap = {
                            "8:00-10:00": "08:00",
                            "10:00-12:00": "10:00",
                            "2:00-4:00": "14:00",
                            "4:00-6:00": "16:00"
                        };
                        const startTime = timeSlotMap[updatedTimeSlot] || '08:00';
                        const consultationDateTime = new Date(`${updatedDate}T${startTime}:00`);

                        const historyDocRef = doc(db, 'users', patientId, 'progress_history', followUpItem.id);
                        await updateDoc(historyDocRef, {
                            notes: updatedNotes.trim(),
                            consultationDate: updatedDate,
                            consultationTimeSlot: updatedTimeSlot,
                            timestamp: Timestamp.fromDate(consultationDateTime)
                        });

                        alert('Follow-up updated successfully.');
                    } catch (error) {
                        console.error('Error updating follow-up:', error);
                        alert('Failed to update follow-up. See console for details.');
                    }
                };

                const onDeleteFollowUp = async (followUpItem) => {
                    const confirmed = confirm('Are you sure you want to delete this follow-up entry?');
                    if (!confirmed) return;

                    try {
                        const historyDocRef = doc(db, 'users', patientId, 'progress_history', followUpItem.id);
                        await deleteDoc(historyDocRef);
                        alert('Follow-up deleted successfully.');
                    } catch (error) {
                        console.error('Error deleting follow-up:', error);
                        alert('Failed to delete follow-up. See console for details.');
                    }
                };

                const aiAnalysisData = predictionDataList.map((analysisItem, analysisIndex) => {
                    let analysisRawScore = parseFloat(analysisItem.severity_numeric);
                    if (isNaN(analysisRawScore)) analysisRawScore = 1.0;
                    let analysisPercent = ((analysisRawScore - 1.0) / 2.0) * 100;
                    analysisPercent = Math.max(0, Math.min(100, analysisPercent));
                    const roundedPercent = Math.round(analysisPercent);
                    const analysisSeverityText = analysisItem.severity || 'unknown';

                    return {
                        label: `AI Analysis #${analysisIndex + 1}`,
                        score: roundedPercent,
                        type: 'initial',
                        timestamp: analysisItem.timestamp || new Date(),
                        consultationDate: formatDisplayDate(analysisItem.timestamp || new Date()),
                        consultationTimeSlot: 'Initial AI Assessment',
                        notes: analysisItem.recommendation || 'Initial AI analysis from SafeMind.',
                        summary: `Severity classification: ${analysisSeverityText}`,
                        fullReport: {
                            ...patientReportSnapshot,
                            severityText: analysisSeverityText,
                            severityPercent: roundedPercent,
                            recommendation: analysisItem.recommendation || 'No recommendation provided.',
                            qa: parsePredictionQa(analysisItem)
                        }
                    };
                });

                let allProgressData = [...aiAnalysisData];
                renderProgressCards(progressCardsTrack, allProgressData, {
                    onEditFollowUp,
                    onDeleteFollowUp
                });
                if (progressCardsScroll) {
                    updateFocusedCard(progressCardsScroll, progressCardsTrack);
                }

                const historyRef = collection(db, "users", patientId, "progress_history");
                const qHistory = query(historyRef, orderBy("timestamp", "asc"));

                onSnapshot(qHistory, (snapshot) => {
                    followUpEntriesCount = snapshot.docs.length;
                    const historyData = snapshot.docs.map((historyDoc, index) => {
                        const d = historyDoc.data();
                        const numericSeverity = Number(d.severity);
                        const resolvedSeverity = Number.isFinite(numericSeverity) ? numericSeverity : latestSeverityScore;
                        return {
                            id: historyDoc.id,
                            label: `Follow-up #${index + 1}`,
                            score: resolvedSeverity,
                            type: 'followup',
                            timestamp: d.timestamp,
                            notes: d.notes,
                            consultationDate: d.consultationDate,
                            consultationTimeSlot: d.consultationTimeSlot
                        };
                    });

                    const combinedData = [...aiAnalysisData, ...historyData].sort((a, b) => {
                        const dateA = toJsDate(a.timestamp);
                        const dateB = toJsDate(b.timestamp);
                        const timeA = dateA ? dateA.getTime() : 0;
                        const timeB = dateB ? dateB.getTime() : 0;
                        return timeA - timeB;
                    });
                    renderProgressCards(progressCardsTrack, combinedData, {
                        onEditFollowUp,
                        onDeleteFollowUp
                    });

                    if (progressCardsScroll) {
                        updateFocusedCard(progressCardsScroll, progressCardsTrack);
                    }

                    if (combinedData.length > 0) {
                        const latest = combinedData[combinedData.length - 1];
                        latestSeverityScore = Number(latest.score) || latestSeverityScore;
                        if (progressSummary) {
                            progressSummary.textContent = `${Math.round(Number(latest.score) || 0)}% (${latest.label})`;
                        }
                    }

                    applyFollowUpSchedulingMode();
                }, (error) => {
                    console.error("Error listening to progress history:", error);
                });

                if (progressCardsScroll) {
                    progressCardsScroll.addEventListener('scroll', () => {
                        updateFocusedCard(progressCardsScroll, progressCardsTrack);
                    }, { passive: true });
                }
            }
            // --- END DYNAMIC SWIPE-CARD LOGIC ---

            // --- Populate modal with analysis data ---
            if (modalSeverityText) modalSeverityText.textContent = severityText;
            if (modalSeverityPercent) modalSeverityPercent.textContent = displayPercent + '%';
            if (modalRecommendation) modalRecommendation.textContent = latestPredictionData.recommendation || "No recommendation provided.";

            
            // --- **** NEW ROBUST Q&A LOGIC (Universal Adapter) **** ---
            if (modalRatingQaContainer || modalSentenceQaContainer || legacyQaContainer) {
                if (modalRatingQaContainer) modalRatingQaContainer.innerHTML = '';
                if (modalSentenceQaContainer) modalSentenceQaContainer.innerHTML = '';
                if (legacyQaContainer) legacyQaContainer.innerHTML = '';

                if (parsedQa.ratings.length > 0) {
                    parsedQa.ratings.forEach((entry) => {
                        const ratingItem = document.createElement('li');
                        ratingItem.className = 'qa-item';
                        ratingItem.innerHTML = `
                            <strong>Q${entry.qNum}: ${entry.questionLabel}</strong>
                            <p class="rating-answer">Rating: <span class="highlight">${entry.rating} / 5</span></p>
                        `;
                        if (modalRatingQaContainer) {
                            modalRatingQaContainer.appendChild(ratingItem);
                        }
                        if (legacyQaContainer) {
                            legacyQaContainer.appendChild(ratingItem.cloneNode(true));
                        }
                    });
                } else if (modalRatingQaContainer) {
                    modalRatingQaContainer.innerHTML = '<li class="qa-empty">No rating answers found for this report.</li>';
                }

                if (parsedQa.sentences.length > 0) {
                    parsedQa.sentences.forEach((entry) => {
                        const textItem = document.createElement('li');
                        textItem.className = 'qa-item qa-text-context';
                        textItem.innerHTML = `
                            <strong>${entry.textLabel}</strong>
                            <p>"${entry.text}"</p>
                        `;
                        if (modalSentenceQaContainer) {
                            modalSentenceQaContainer.appendChild(textItem);
                        }
                        if (legacyQaContainer) {
                            legacyQaContainer.appendChild(textItem.cloneNode(true));
                        }
                    });
                } else if (modalSentenceQaContainer) {
                    modalSentenceQaContainer.innerHTML = '<li class="qa-empty">No sentence answers found for this report.</li>';
                }

                if (legacyQaContainer && legacyQaContainer.children.length === 0) {
                    legacyQaContainer.innerHTML = '<li class="qa-empty">No Q&A data found for this report.</li>';
                }
            }
            // --- **** END OF NEW ROBUST LOGIC **** ---


        } else {
            // This runs if the user exists but has no analysis reports
            console.log("No prediction found for this user.");
            if (severityElement) severityElement.textContent = '--%';
            if (severityTextElement) severityTextElement.textContent = 'No analysis';
        }

        // --- Setup Progress Card Event Listeners ---
        
        // 1. Show Form
        if (addFindingsBtn && findingsCard) {
            addFindingsBtn.addEventListener('click', () => {
                if (consultationDate && firstAnalysisDateIso) {
                    consultationDate.min = firstAnalysisDateIso;
                }

                applyFollowUpSchedulingMode();

                if (followUpEntriesCount === 0 && !firstLockedConsultationSlot) {
                    alert('No locked consultation schedule found for this patient. Please select date and time manually.');
                }

                findingsCard.classList.remove('hidden');
                // Scroll to form
                findingsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }

        // 2. Hide Form (Cancel)
        if (cancelEntryBtn && findingsCard) {
            cancelEntryBtn.addEventListener('click', () => {
                findingsCard.classList.add('hidden');
                if (findingsLog) findingsLog.value = '';
                if (consultationDate) consultationDate.value = '';
                if (consultationTime) consultationTime.value = '';
                if (consultationDate) consultationDate.disabled = false;
                if (consultationTime) consultationTime.disabled = false;
            });
        }

        // 3. Save Entry
        if (saveEntryBtn) {
            saveEntryBtn.addEventListener('click', async () => {
                const notes = findingsLog ? findingsLog.value.trim() : '';
                const score = Number.isFinite(latestSeverityScore) ? latestSeverityScore : 0;
                const dateValue = consultationDate ? consultationDate.value : '';
                const timeSlot = consultationTime ? consultationTime.value : '';

                if (!dateValue || !timeSlot) {
                    alert("Please enter consultation date and time slot.");
                    return;
                }

                const isFirstFollowUp = followUpEntriesCount === 0;
                if (isFirstFollowUp && firstLockedConsultationSlot) {
                    const dateMismatch = dateValue !== firstLockedConsultationSlot.dateInput;
                    const timeMismatch = normalizeTimeSlot(timeSlot) !== normalizeTimeSlot(firstLockedConsultationSlot.timeSlot);
                    if (dateMismatch || timeMismatch) {
                        alert(`First follow-up must use the locked consultation schedule: ${firstLockedConsultationSlot.dateInput} (${firstLockedConsultationSlot.timeSlot}).`);
                        return;
                    }
                }

                if (!isFirstFollowUp) {
                    const slotAlreadyUsed = await isSlotInUse(dateValue, timeSlot);
                    if (slotAlreadyUsed) {
                        alert('Selected consultation date and time slot is already occupied. Please choose a free consultation time.');
                        return;
                    }
                }

                if (firstAnalysisDateIso && isDateBefore(dateValue, firstAnalysisDateIso)) {
                    alert(`Consultation date cannot be before the first AI analysis date (${firstAnalysisDateIso}).`);
                    return;
                }

                if (!patientId) {
                    alert("Error: No patient ID found.");
                    return;
                }

                try {
                    // Convert time slot to 24-hour format for timestamp
                    const timeSlotMap = {
                        "8:00-10:00": "08:00",
                        "10:00-12:00": "10:00",
                        "2:00-4:00": "14:00",
                        "4:00-6:00": "16:00"
                    };
                    const startTime = timeSlotMap[timeSlot] || "08:00";
                    const consultationDateTime = new Date(`${dateValue}T${startTime}:00`);
                    
                    // Add to followUps collection in the main database
                    const followUpsRef = collection(db, "followUps");
                    await addDoc(followUpsRef, {
                        userId: patientId,
                        severity: score,
                        notes: notes,
                        consultationDate: dateValue,
                        consultationTimeSlot: timeSlot,
                        timestamp: Timestamp.fromDate(consultationDateTime),
                        recordedBy: auth.currentUser ? auth.currentUser.uid : null,
                        createdAt: serverTimestamp()
                    });

                    // Also add to user's progress_history subcollection for real-time card updates
                    const historyRef = collection(db, "users", patientId, "progress_history");
                    await addDoc(historyRef, {
                        severity: score,
                        notes: notes,
                        consultationDate: dateValue,
                        consultationTimeSlot: timeSlot,
                        timestamp: Timestamp.fromDate(consultationDateTime),
                        recordedBy: auth.currentUser ? auth.currentUser.uid : null
                    });

                    alert("Findings recorded successfully!");

                    // Hide and Clear
                    if (findingsCard) findingsCard.classList.add('hidden');
                    if (findingsLog) findingsLog.value = '';
                    if (consultationDate) consultationDate.value = '';
                    if (consultationTime) consultationTime.value = '';

                } catch (error) {
                    console.error("Error saving findings:", error);
                    alert("Failed to save findings. See console for details.");
                }
            });
        }

        // 4. Finish Progress
        if (finishProgressBtn) {
            finishProgressBtn.addEventListener('click', async () => {
                if(confirm("Are you sure you want to finish patient progress monitoring?")) {
                    try {
                        // Update patient document with caseStatus = 'finished'
                        const userDocRef = doc(db, "users", patientId);
                        await updateDoc(userDocRef, {
                            caseStatus: 'finished'
                        });
                        
                        alert("Patient progress marked as finished.");
                        
                        // Disable add findings button and show reopen button
                        if (addFindingsBtn) {
                            addFindingsBtn.disabled = true;
                            addFindingsBtn.style.opacity = '0.5';
                            addFindingsBtn.style.cursor = 'not-allowed';
                        }
                        if (finishProgressBtn) {
                            finishProgressBtn.style.display = 'none';
                        }
                        if (reopenCaseBtn) {
                            reopenCaseBtn.style.display = 'inline-block';
                        }
                    } catch (error) {
                        console.error('Error finishing patient progress:', error);
                        alert('Failed to finish patient progress. See console for details.');
                    }
                }
            });
        }
        
        // 5. Reopen Case
        if (reopenCaseBtn) {
            reopenCaseBtn.addEventListener('click', async () => {
                if(confirm("Are you sure you want to reopen this patient case?")) {
                    try {
                        // Update patient document with caseStatus = 'open'
                        const userDocRef = doc(db, "users", patientId);
                        await updateDoc(userDocRef, {
                            caseStatus: 'open'
                        });
                        
                        alert("Patient case reopened.");
                        
                        // Enable add findings button and hide reopen button
                        if (addFindingsBtn) {
                            addFindingsBtn.disabled = false;
                            addFindingsBtn.style.opacity = '1';
                            addFindingsBtn.style.cursor = 'pointer';
                        }
                        if (finishProgressBtn) {
                            finishProgressBtn.style.display = 'inline-block';
                        }
                        if (reopenCaseBtn) {
                            reopenCaseBtn.style.display = 'none';
                        }
                    } catch (error) {
                        console.error('Error reopening patient case:', error);
                        alert('Failed to reopen patient case. See console for details.');
                    }
                }
            });
        }

    } catch (error) {
        console.error("Error fetching patient data: ", error);
        if (error.code === 'failed-precondition') {
            console.warn("QUERY FAILED: This query requires a composite index. Check the console for a link to create it.");
            if (nameElement) nameElement.textContent = "Database Index Error";
            if (descriptionElement) descriptionElement.innerHTML = "This page failed to load due to a database configuration error. <strong>Check the F12 console for a link to create the required index.</strong>";
        } else {
            if (nameElement) nameElement.textContent = "Error loading profile.";
        }
    }
}
// --- END UPDATED FUNCTION ---


// --- Respect reduced motion ---
const mediaReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (mediaReduceMotion.matches) document.documentElement.classList.add('reduce-motion');


// --- DOMContentLoaded listener ---
document.addEventListener('DOMContentLoaded', function() {
    
    // --- UPDATED: Page specific initializations ---
    // 1. Calendar
    if (document.getElementById('calendar-body')) {
        initializeCalendar();
    }
    // 2. Patient Profile
    if (document.querySelector('.patient-profile-content')) {
        loadPatientProfile();
    }
    // 3. Confirmed Consultations Table (New)
    if (document.getElementById('schedule-table-body')) {
        loadAppointments(); 
    }
    // 4. Pending Requests (supports both table + card layouts)
    const hasPendingTable = document.getElementById('pending-table-body');
    const hasPendingList = document.querySelector('.pending-list');
    if (hasPendingTable || hasPendingList) {
        loadPendingRequests();
    }
    // 5. User Profiles grid (support separate pages: by status or scheduled/unscheduled)
    if (document.getElementById('user-profiles-grid-today')) {
        loadUserProfilesByConsultationStatus('today');
    }
    if (document.getElementById('user-profiles-grid-finished')) {
        loadUserProfilesByConsultationStatus('finished');
    }
    if (document.getElementById('user-profiles-grid-future')) {
        loadUserProfilesByConsultationStatus('future');
    }
    if (document.getElementById('user-profiles-grid-scheduled')) {
        loadUserProfilesFiltered('scheduled');
    }
    if (document.getElementById('user-profiles-grid-unscheduled')) {
        loadUserProfilesFiltered('unscheduled');
    }
    // --- END UPDATED ---

    // --- UPDATED: Calendar navigation ---
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => {
        currentViewDate.setDate(currentViewDate.getDate() - 7);
        initializeCalendar(); // Re-fetches and re-renders all
     });
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => {
        currentViewDate.setDate(currentViewDate.getDate() + 7);
        initializeCalendar(); // Re-fetches and re-renders all
     });
    // --- END UPDATED ---

    // Mobile sidebar toggle (Dashboard)
    const mobileHamburger = document.getElementById('mobile-hamburger');
    const dashboardSidebar = document.querySelector('.dashboard-sidebar');
    if (mobileHamburger && dashboardSidebar) {
        mobileHamburger.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent immediate closing due to document click
            dashboardSidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', function(e) {
            if (dashboardSidebar.classList.contains('open')) {
                // Check if click is outside sidebar and not on the hamburger button
                if (!dashboardSidebar.contains(e.target) && !mobileHamburger.contains(e.target)) {
                    dashboardSidebar.classList.remove('open');
                }
            }
        });
     }

    // --- SIDEBAR DROPDOWNS (Consultations, Patient Profiles, User Profiles) ---
    // Select all buttons that are intended to be dropdown triggers
    const dropdownTriggers = document.querySelectorAll('button.sidebar-category');

    dropdownTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            // Find the next sibling which should be the UL menu
            const menu = this.nextElementSibling;
            if (menu && menu.classList.contains('dropdown-menu')) {
                // Toggle visibility
                menu.classList.toggle('hidden');

                // Optional: Toggle active state on button for styling (e.g. arrow rotation)
                this.classList.toggle('active');
            }
        });
    });

    // --- NEW: Mobile Nav Toggle (Main Site) ---
    const mainHamburger = document.getElementById('mobile-hamburger-main');
    const mainNav = document.getElementById('primary-navigation'); 

    if (mainHamburger && mainNav) {
        mainHamburger.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('open');
            mainHamburger.setAttribute('aria-expanded', isOpen);
            // Also toggle body class to prevent scrolling
            document.body.classList.toggle('nav-open'); 
        });
    }
    // --- END NEW ---


    // Profile dropdown & logout
    const userAvatar = document.querySelector('.user-avatar');
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (userAvatar && profileDropdown) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!userAvatar.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = 'index.html';
            }).catch((error) => console.error('Signout error', error));
        });
    }

    // Improved back-link behavior: prefer history.back() to preserve user context (e.g. Calendar)
    const backLinks = document.querySelectorAll('.back-link');
    backLinks.forEach((bl) => {
        bl.addEventListener('click', (e) => {
            // Only intercept left-clicks without modifier keys
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            // If there's a history entry to go back to, use it to preserve the previous page state
            try {
                if (window.history.length > 1) {
                    window.history.back();
                    return;
                }
            } catch (err) {
                // ignore and fallback
            }

            // Fallback: navigate to the href on the anchor (default page)
            const href = bl.getAttribute('href') || 'confirmed-consultations.html';
            window.location.href = href;
        });
    });

    // --- Forgot Password Logic ---
    const forgotPasswordLink = document.querySelector('.remember-forgot a');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('login-email');
            const email = emailInput ? emailInput.value.trim() : null;

            if (!email) {
                alert('Please enter your email address in the email field first, then click "Forgot Password?".');
                return;
            }

            sendPasswordResetEmail(auth, email)
                .then(() => {
                    alert('Password reset email sent! Please check your inbox (and spam folder).');
                      closeOverlays();
                })
                .catch((error) => {
                    const errorCode = error.code;
                    console.error("Password Reset Error:", errorCode, error.message);
                    if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-email') {
                        alert('Could not send reset email. Please ensure the email address is correct and registered.');
                    } else {
                        alert(`Error sending reset email: ${error.message}`);
                    }
                });
        });
    }

    // --- Sort controls for tables ---
    const confirmedSortSelect = document.getElementById('confirmed-sort');
    if (confirmedSortSelect) {
        confirmedSortMode = confirmedSortSelect.value || 'newest';
        confirmedSortSelect.addEventListener('change', () => {
            confirmedSortMode = confirmedSortSelect.value || 'newest';
            loadAppointments();
        });
    }

    const pendingSortSelect = document.getElementById('pending-sort');
    if (pendingSortSelect) {
        pendingSortMode = pendingSortSelect.value || 'newest';
        pendingSortSelect.addEventListener('change', () => {
            pendingSortMode = pendingSortSelect.value || 'newest';
            loadPendingRequests();
        });
    }

    const userProfilesSortSelect = document.getElementById('user-profiles-sort');
    if (userProfilesSortSelect) {
        userProfilesSortMode = userProfilesSortSelect.value || 'name';
        userProfilesSortSelect.addEventListener('change', () => {
            userProfilesSortMode = userProfilesSortSelect.value || 'name';
            
            // Determine which loader to call based on which grid exists
            if (document.getElementById('user-profiles-grid')) {
                loadUserProfiles();
            } else if (document.getElementById('user-profiles-grid-today')) {
                loadUserProfilesByConsultationStatus('today');
            } else if (document.getElementById('user-profiles-grid-finished')) {
                loadUserProfilesByConsultationStatus('finished');
            } else if (document.getElementById('user-profiles-grid-future')) {
                loadUserProfilesByConsultationStatus('future');
            } else if (document.getElementById('user-profiles-grid-unscheduled')) {
                loadUserProfilesFiltered('unscheduled');
            }
        });
    }

    // --- **** NEW MODAL CLICK HANDLERS **** ---
    const reportButton = document.querySelector('.view-report-link');
    const modalWrapper = document.querySelector('.report-modal-wrapper');
    const modalScrim = document.querySelector('.report-scrim');
    const modalClose = document.querySelector('.report-modal-close');

    if (reportButton && modalWrapper && modalScrim && modalClose) {
        // Function to open the modal
        const openModal = () => {
            modalWrapper.classList.add('show');
            modalScrim.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        };

        // Function to close the modal
        const closeModal = () => {
            modalWrapper.classList.remove('show');
            modalScrim.classList.remove('show');
            document.body.style.overflow = ''; // Allow background scroll
        };

        // click events
        reportButton.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
        
        modalClose.addEventListener('click', closeModal);
        modalScrim.addEventListener('click', closeModal);
    }
    // --- **** END OF NEW MODAL HANDLERS **** ---

}); // End of DOMContentLoaded