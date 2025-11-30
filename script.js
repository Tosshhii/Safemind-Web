// --- START: Firebase v12 (Modular) Initialization ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";

// Auth imports
import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// Firestore imports
import { 
    getFirestore, 
    collection, 
    collectionGroup, 
    getDocs,
    query,
    orderBy,
    where, 
    doc,     
    getDoc,  
    limit, 
    addDoc, 
    updateDoc, 
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"; 

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

// 1. Initialize the app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app); 

// --- QUESTION MAP ---
const QUESTION_MAP = {
    "rating_1": "I easily get irritated or frustrated with others.",
    "rating_2": "I have little interest or pleasure in doing things I used to enjoy.",
    "text_1": "How would you describe your emotional state during the past two weeks?",
    "text_2": "What situations or experiences make you feel most hopeless or disinterested?",
    "rating_3": "I avoid situations that make me feel anxious.",
    "rating_4": "I frequently feel nervous, anxious, or on edge.",
    "text_3": "What kinds of things make you feel anxious or worried, and how do you handle them?",
    "text_4": "How has the anxiety affected your daily activities or interactions with others?",
    "rating_5": "I start more projects or take more risks than usual.",
    "rating_6": "I sleep less but still have a lot of energy.",
    "text_5": "Can you describe times when you felt unusually energetic or driven to take on new activities?",
    "text_6": "How do these changes in energy or activity level affect your relationships or responsibilities?",
    "rating_7": "I experience unexplained aches or pains such as headaches, back pain, or stomach pain.",
    "rating_8": "I feel my medical problems or symptoms are not taken seriously enough by others.",
    "text_7": "Have you noticed any recurring physical discomfort (such as headaches or body pain)? What do you think causes them?",
    "text_8": "How do your physical sensations or health concerns influence your emotions or thoughts?",
    "rating_9": "I have trouble sleeping, or my sleep does not feel restful.",
    "rating_10": "I often feel too tired to complete my usual tasks.",
    "text_9": "How has your sleep pattern changed recently, and what do you think is affecting it?",
    "text_10": "What do you notice about your energy or motivation during the day?"
};

// --- AUTH LISTENER ---
onAuthStateChanged(auth, (user) => {
    const navActionLink = document.getElementById('nav-action-link');
    const navHomeLink = document.getElementById('nav-home-link');

    if (user) {
        // Logged In
        const emailDisplay = document.getElementById('user-email-display');
        if (emailDisplay) emailDisplay.textContent = user.displayName || user.email;

        if (navActionLink) {
            navActionLink.textContent = 'Dashboard';
            navActionLink.href = 'confirmed-consultations.html'; 
            navActionLink.onclick = null;
            navActionLink.style.display = 'inline-flex';
            navActionLink.style.visibility = 'visible'; 
        }
        if (navHomeLink) navHomeLink.href = 'index.html';

    } else {
        // Logged Out
        if (navActionLink) {
            navActionLink.textContent = 'Login';
            navActionLink.href = '#';
            navActionLink.style.display = 'inline-flex';
            navActionLink.style.visibility = 'visible'; 
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
        if (navHomeLink) navHomeLink.href = 'index.html';

        const path = window.location.pathname;
        const publicPages = ['index.html', 'about.html', '/', ''];
        const isPublic = publicPages.some(p => path.endsWith(p));

        if (!isPublic && !path.includes('index.html')) {
            console.log('Access denied. Redirecting.');
            window.location.href = 'index.html';
        }
    }
});

// --- HELPER: Date Parser ---
function parseDateTime(dateStr, timeStr) {
    if (!dateStr || typeof dateStr !== 'string') return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date(0);
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; 
    const year = parseInt(parts[2], 10);
    
    let hour = 0;
    if (timeStr && typeof timeStr === 'string') {
        const start = timeStr.split('-')[0].trim(); 
        const isPM = start.toLowerCase().includes('pm');
        const isAM = start.toLowerCase().includes('am');

        const tParts = start.split(':');
        if (tParts.length >= 1) hour = parseInt(tParts[0], 10);

        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;
    }
    return new Date(year, month, day, hour);
}

// --- FUNCTION 1: LOAD CONFIRMED APPOINTMENTS (TABLE) ---
async function loadAppointments() {
    const tableBody = document.getElementById('schedule-table-body');
    if (!tableBody) return; 

    tableBody.innerHTML = '<tr><td colspan="3">Loading confirmed consultations...</td></tr>';
    
    try {
        const q = query(collectionGroup(db, "bookedSlots"), where("status", "==", "confirmed"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="3">No confirmed consultations found.</td></tr>`;
            return;
        }

        const appointments = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                sortDate: parseDateTime(data.date, data.time) 
            };
        });

        // Sort Ascending (Oldest First)
        appointments.sort((a, b) => a.sortDate - b.sortDate);

        const htmlPromises = appointments.map(async (appt) => {
            const patientId = appt.userId;
            let patientName = "Unknown Patient";
            let patientURL = '#';

            if (patientId) {
                try {
                    const uSnap = await getDoc(doc(db, 'users', patientId));
                    if (uSnap.exists()) patientName = uSnap.data().name || "Unknown Patient";
                } catch (e) { console.error(e); }
                patientURL = `patient-profile.html?id=${encodeURIComponent(patientId)}`;
            }

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

        const htmlRows = await Promise.all(htmlPromises);
        tableBody.innerHTML = htmlRows.join('');

    } catch (error) {
        console.error("Error loading appointments: ", error);
        tableBody.innerHTML = '<tr><td colspan="3">Error loading data. Check console.</td></tr>';
    }
}

// --- FUNCTION 2: LOAD PENDING REQUESTS (TABLE) ---
async function loadPendingRequests() {
    const tableBody = document.getElementById('pending-table-body');
    if (!tableBody) return; 

    tableBody.innerHTML = '<tr><td colspan="4">Loading pending requests...</td></tr>';

    try {
        console.log("Fetching consultationRequests...");
        const reqCol = collection(db, 'consultationRequests');
        const snapshot = await getDocs(reqCol);
        
        // 1. Filter docs
        const pendingDocs = snapshot.docs.filter(doc => {
            const data = doc.data();
            return data.status === 'pending' || data.status === undefined;
        });

        console.log(`Found ${pendingDocs.length} pending requests.`);

        if (!pendingDocs.length) {
            tableBody.innerHTML = '<tr><td colspan="4">No pending consultation requests.</td></tr>';
            return;
        }

        // 2. Map to objects with sortDate
        const pendingRequests = pendingDocs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                sortDate: parseDateTime(data.date, data.time) 
            };
        });

        // 3. Sort Ascending (Oldest First)
        pendingRequests.sort((a, b) => a.sortDate - b.sortDate);

        // 4. Generate HTML
        const rows = await Promise.all(pendingRequests.map(async (req) => {
            const patientId = req.userId || req.userUID || null;
            let patientName = req.name || 'Unknown Patient';

            if (patientId) {
                try {
                    const uSnap = await getDoc(doc(db, 'users', patientId));
                    if (uSnap.exists()) patientName = uSnap.data().name || patientName;
                } catch (e) { console.error(e); }
            }

            const date = req.date || '--/--/----';
            const time = req.time || '--:--';

            return `
                <tr class="pending-item" data-request-id="${req.id}">
                    <td data-label="Date">${date}</td>
                    <td data-label="Time">${time}</td>
                    <td data-label="Patient">
                        <strong>${patientName}</strong>
                    </td>
                    <td data-label="Actions">
                        <button class="btn confirm-request" type="button" style="width: auto; padding: 5px 10px; margin-right: 5px;">Confirm</button>
                        <button class="btn decline-request" type="button" style="background:#e74c3c; width: auto; padding: 5px 10px;">Decline</button>
                    </td>
                </tr>
            `;
        }));

        tableBody.innerHTML = rows.join('');

        // Attach Event Listeners
        const confirmBtns = tableBody.querySelectorAll('.confirm-request');
        confirmBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                const item = e.target.closest('.pending-item');
                const id = item.getAttribute('data-request-id');
                confirmRequest(id);
            });
        });

        const declineBtns = tableBody.querySelectorAll('.decline-request');
        declineBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                const item = e.target.closest('.pending-item');
                const id = item.getAttribute('data-request-id');
                declineRequest(id);
            });
        });

    } catch (error) {
        console.error('Error loading pending:', error);
        tableBody.innerHTML = '<tr><td colspan="4">Error loading requests. Check console.</td></tr>';
    }
}

async function confirmRequest(requestId) {
    if (!confirm('Confirm this consultation?')) return;
    try {
        const reqRef = doc(db, 'consultationRequests', requestId);
        const reqSnap = await getDoc(reqRef);
        if (!reqSnap.exists()) return alert('Request not found.');

        const req = reqSnap.data();

        // Add to bookedSlots
        await addDoc(collection(db, 'bookedSlots'), {
            date: req.date, 
            time: req.time, 
            userId: req.userId || req.userUID || null,
            status: 'confirmed',
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser ? auth.currentUser.uid : 'admin'
        });

        // Update request status
        await updateDoc(reqRef, {
            status: 'confirmed',
            confirmedAt: serverTimestamp()
        });

        loadPendingRequests(); 
        alert('Confirmed and added to calendar.');
    } catch (error) {
        console.error(error);
        alert('Failed to confirm. See console.');
    }
}

async function declineRequest(requestId) {
    const reason = prompt('Reason for declining (optional):');
    try {
        const reqRef = doc(db, 'consultationRequests', requestId);
        await updateDoc(reqRef, {
            status: 'declined',
            declinedAt: serverTimestamp(),
            declineReason: reason || ''
        });
        
        loadPendingRequests();
        alert('Request declined.');
    } catch (error) {
        console.error(error);
        alert('Failed to decline.');
    }
}

// --- FUNCTION 3: CALENDAR ---
let currentViewDate = new Date();
const timeToRow = {
    '08:00': 1, '09:00': 2, '10:00': 3, '11:00': 4, '12:00': 5,
    '13:00': 6, '14:00': 7, '15:00': 8, '16:00': 9, '17:00': 10
};
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function getSunday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function renderWeeklyCalendar(date) {
    const calendarTitle = document.getElementById('calendar-title');
    const calendarHeader = document.getElementById('calendar-header');
    const calendarBody = document.getElementById('calendar-body');
    if (!calendarTitle || !calendarHeader || !calendarBody) return;

    calendarHeader.innerHTML = ''; 
    calendarBody.innerHTML = '';   

    const sunday = getSunday(date);
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

    calendarTitle.textContent = `${monthFormatter.format(sunday).toUpperCase()} ${sunday.getFullYear()}`;

    calendarHeader.innerHTML = '<div class="time-column">Time</div>';
    for (let i = 0; i < 7; i++) { 
        const currentDay = new Date(sunday);
        currentDay.setDate(sunday.getDate() + i);
        const dayName = dayFormatter.format(currentDay).toUpperCase();
        const dayNum = currentDay.getDate();
        calendarHeader.innerHTML += `<div class="day-header">${dayName} ${dayNum}</div>`;
    }

    for (let i = 0; i < timeSlots.length; i++) {
        const label = document.createElement('div');
        label.className = 'time-label';
        const [h] = timeSlots[i].split(':');
        const hInt = parseInt(h);
        const ampm = hInt >= 12 ? 'PM' : 'AM';
        const disp = hInt > 12 ? hInt - 12 : hInt;
        label.textContent = `${disp} ${ampm}`;
        label.style.gridRow = i + 1;
        label.style.gridColumn = 1;  
        calendarBody.appendChild(label);
    }
    for (let i = 0; i < 7; i++) { 
        const dayCol = document.createElement('div');
        dayCol.className = 'day-bg-col';
        dayCol.style.gridColumn = i + 2; 
        calendarBody.appendChild(dayCol);
    }
}

function normalizeStartTime(timeStr) {
    const isPM = timeStr.toLowerCase().includes('pm');
    const isAM = timeStr.toLowerCase().includes('am');

    // Clean AM/PM from the string to parse numbers
    const cleanTimeStr = timeStr.replace(/am|pm/gi, '').trim();

    const parts = cleanTimeStr.split(':');
    if (parts.length !== 2) return null;
    let hour = parseInt(parts[0], 10);
    let minute = parts[1].trim(); // trim potential spaces

    if (isNaN(hour)) return null;

    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    return `${String(hour).padStart(2, '0')}:${minute}`;
}

async function initializeCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    if (!calendarBody) return;

    renderWeeklyCalendar(currentViewDate);

    const weekStart = getSunday(currentViewDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); 
    weekEnd.setHours(23, 59, 59, 999);

    try {
        const q = query(collectionGroup(db, "bookedSlots"), where('status', '==', 'confirmed'));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(async (apptDoc) => {
            const appt = apptDoc.data();
            const patientId = appt.userId;

            if (!appt.date || typeof appt.date !== 'string') return;
            const dParts = appt.date.split('/'); 
            if (dParts.length !== 3) return;
            
            const apptDate = new Date(
                parseInt(dParts[2], 10),     // Year
                parseInt(dParts[1], 10) - 1, // Month
                parseInt(dParts[0], 10)      // Day
            );

            if (apptDate < weekStart || apptDate > weekEnd) return;
            
            const apptDay = apptDate.getDay(); 
            const colStart = apptDay + 2;      

            const tParts = appt.time.split('-');
            if (tParts.length !== 2) return;
            
            const startTime = normalizeStartTime(tParts[0].trim()); 
            const endRaw = tParts[1].trim().split(':')[0] + ':00';  
            const endTime = normalizeStartTime(endRaw);             

            const rowStart = timeToRow[startTime];
            const rowEnd = timeToRow[endTime] ? timeToRow[endTime] : (rowStart + 1);
            
            if (!rowStart) return;

            let patientName = "Unknown";
            if (patientId) {
                try {
                    const uSnap = await getDoc(doc(db, 'users', patientId));
                    if (uSnap.exists()) patientName = uSnap.data().name || "Unknown";
                } catch (e) {}
            }

            const el = document.createElement('div');
            el.className = 'appointment';
            el.style.setProperty('--col-start', colStart);
            el.style.setProperty('--row-start', rowStart);
            el.style.setProperty('--row-end', rowEnd);
            
            el.innerHTML = `
                <a href="patient-profile.html?id=${encodeURIComponent(patientId)}" class="patient-appointment">
                    ${patientName}
                    <span class="appt-time">${appt.time}</span>
                </a>
            `;
            calendarBody.appendChild(el);
        });
    } catch (error) {
        console.error("Calendar Error: ", error);
    }
}


// --- FUNCTION 4: PATIENT PROFILE ---
async function loadPatientProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');

    const nameElement = document.getElementById('patient-name');
    const ageElement = document.getElementById('patient-age');
    const locationElement = document.getElementById('patient-location');
    const severityElement = document.getElementById('severity-value');
    const severityTextElement = document.getElementById('severity-text');
    const descriptionElement = document.querySelector('.severity-description p');
    const needle = document.getElementById('gauge-needle');

    const modalPatientName = document.getElementById('modal-patient-name');
    const modalPatientAge = document.getElementById('modal-patient-age');
    const modalPatientLocation = document.getElementById('modal-patient-location');
    const modalPatientEmail = document.getElementById('modal-patient-email');
    const modalSeverityText = document.getElementById('modal-severity-text');
    const modalSeverityPercent = document.getElementById('modal-severity-percent');
    const modalRecommendation = document.getElementById('modal-recommendation');
    const qaContainer = document.getElementById('modal-qa-container');

    if (!patientId) return;

    try {
        const userSnap = await getDoc(doc(db, "users", patientId));
        if (userSnap.exists()) {
            const u = userSnap.data();
            if (nameElement) nameElement.textContent = u.name || "Unknown";
            if (ageElement) ageElement.textContent = u.age ? `${u.age} yrs Old` : '-- yrs Old';
            if (locationElement) locationElement.textContent = u.city || "Unknown Location";

            if (modalPatientName) modalPatientName.textContent = u.name || "Unknown";
            if (modalPatientAge) modalPatientAge.textContent = u.age || "--";
            if (modalPatientLocation) modalPatientLocation.textContent = u.city || "Unknown";
            if (modalPatientEmail) modalPatientEmail.textContent = u.email || "No email";
        }

        const predQ = query(
            collectionGroup(db, "api_predictions"),
            where("userId", "==", patientId),
            orderBy("timestamp", "desc"),
            limit(1)
        );
        const predSnap = await getDocs(predQ);

        if (!predSnap.empty) {
            const pred = predSnap.docs[0].data();
            
            let rawScore = parseFloat(pred.severity_numeric);
            if (isNaN(rawScore)) rawScore = 1.0;
            let pct = ((rawScore - 1.0) / 2.0) * 100;
            pct = Math.max(0, Math.min(100, pct));
            const dispPct = Math.round(pct);
            
            if (severityElement) severityElement.textContent = dispPct + '%';
            if (severityTextElement) severityTextElement.textContent = pred.severity || 'unknown';
            if (descriptionElement) {
                descriptionElement.innerHTML = `Based on SafeMind's analysis, the level of severity is <strong>${dispPct}%</strong> (${pred.severity}).`;
            }
            if (needle) {
                const angle = ((dispPct / 100) * 180) - 90;
                needle.style.transform = `rotate(${angle}deg)`;
            }

            if (modalSeverityText) modalSeverityText.textContent = pred.severity;
            if (modalSeverityPercent) modalSeverityPercent.textContent = dispPct + '%';
            if (modalRecommendation) modalRecommendation.textContent = pred.recommendation || "None.";

            if (qaContainer) {
                qaContainer.innerHTML = '';
                let ratings = [], texts = [];
                const input = pred.input_data || {};

                if (pred.ratings && Array.isArray(pred.ratings)) {
                    ratings = pred.ratings; texts = pred.texts || [];
                } else if (input.answers && Array.isArray(input.answers)) {
                    ratings = input.answers; texts = input.texts || [];
                } else {
                    for (let i = 1; i <= 10; i++) {
                        if (input[`rating_${i}`]) {
                            ratings.push(input[`rating_${i}`]);
                            texts.push(input[`text_${i}`] || "");
                        }
                    }
                }

                if (ratings.length > 0) {
                    ratings.forEach((r, idx) => {
                        const qNum = idx + 1;
                        const qLabel = QUESTION_MAP[`rating_${qNum}`] || `Question ${qNum}`;
                        
                        const li = document.createElement('li');
                        li.className = 'qa-item';
                        li.innerHTML = `<strong>Q${qNum}: ${qLabel}</strong><p class="rating-answer">Rating: ${r}/5</p>`;
                        qaContainer.appendChild(li);

                        if (texts[idx]) {
                            const ctxDiv = document.createElement('div');
                            ctxDiv.style.cssText = "margin:5px 0 15px 15px; border-left:3px solid #eee; padding-left:15px; color:#555;";
                            ctxDiv.innerHTML = `<small><em>${QUESTION_MAP[`text_${qNum}`]||"Context"}</em></small><br>"${texts[idx]}"`;
                            qaContainer.appendChild(ctxDiv);
                        }
                    });
                } else {
                    qaContainer.innerHTML = '<li>No Q&A data.</li>';
                }
            }
        }
    } catch (error) {
        console.error("Profile Error:", error);
    }
}


// --- DOM EVENTS ROUTER ---
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Page Specific Loading
    if (document.getElementById('schedule-table-body')) {
        loadAppointments(); // Confirmed Page
    }
    // Changed this to check for the new table body ID
    if (document.getElementById('pending-table-body')) {
        loadPendingRequests(); // Pending Page
    }
    if (document.getElementById('calendar-body')) {
        initializeCalendar(); // Calendar Page
    }
    if (document.querySelector('.patient-profile-content')) {
        loadPatientProfile(); // Profile Page
    }

    // 2. Calendar Buttons
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => {
        currentViewDate.setDate(currentViewDate.getDate() - 7);
        initializeCalendar();
    });
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => {
        currentViewDate.setDate(currentViewDate.getDate() + 7);
        initializeCalendar();
    });

    // 3. Mobile Navigation
    const mobileHamburger = document.getElementById('mobile-hamburger');
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (mobileHamburger && sidebar) {
        mobileHamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    const mainHamburger = document.getElementById('mobile-hamburger-main');
    const mainNav = document.getElementById('primary-navigation');
    if (mainHamburger && mainNav) {
        mainHamburger.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('open');
            mainHamburger.setAttribute('aria-expanded', isOpen);
            document.body.classList.toggle('nav-open');
        });
    }

    // 4. Auth & UI
    const loginForm = document.querySelector('.form-box.login form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const remember = document.querySelector('.form-box.login input[name="remember"]')?.checked;

            if (email !== 'atchazoj6@gmail.com') return alert('Unauthorized email.');

            const persist = remember ? browserLocalPersistence : browserSessionPersistence;
            setPersistence(auth, persist)
                .then(() => signInWithEmailAndPassword(auth, email, password))
                .then(() => {
                    closeOverlays();
                    window.location.href = 'confirmed-consultations.html';
                })
                .catch(err => alert(err.message));
        });
    }

    const forgotLink = document.querySelector('.remember-forgot a');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value.trim();
            if (!email) return alert('Enter email first.');
            sendPasswordResetEmail(auth, email)
                .then(() => alert('Reset email sent.'))
                .catch(err => alert(err.message));
        });
    }

    const userAvatar = document.querySelector('.user-avatar');
    const dropdown = document.querySelector('.profile-dropdown');
    if (userAvatar && dropdown) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!userAvatar.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('show');
        });
    }

    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => window.location.href = 'index.html');
        });
    }

    const closeIcon = document.querySelector('.icon-close');
    const scrim = document.querySelector('.scrim'); 
    const loginLink = document.querySelector('.login-link');
    const wrapper = document.querySelector('.wrapper');

    if (closeIcon) closeIcon.addEventListener('click', closeOverlays);
    if (scrim) scrim.addEventListener('click', closeOverlays);
    if (loginLink && wrapper) loginLink.addEventListener('click', () => wrapper.classList.remove('active'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlays(); });

    // Report Modal
    const reportBtn = document.querySelector('.view-report-link');
    const rModal = document.querySelector('.report-modal-wrapper');
    const rScrim = document.querySelector('.report-scrim');
    const rClose = document.querySelector('.report-modal-close');

    if (reportBtn && rModal && rScrim && rClose) {
        const closeReport = () => {
            rModal.classList.remove('show');
            rScrim.classList.remove('show');
            document.body.style.overflow = '';
        };
        reportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            rModal.classList.add('show');
            rScrim.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
        rClose.addEventListener('click', closeReport);
        rScrim.addEventListener('click', closeReport);
    }
}); // End of DOMContentLoaded

// --- Helper Functions ---
function closeOverlays(){
    const wrapper = document.querySelector('.wrapper');
    const body = document.querySelector('body');
    const nav = document.getElementById('primary-navigation');
    const scrim = document.querySelector('.scrim');
    const navToggle = document.getElementById('mobile-hamburger-main');

    if (wrapper) wrapper.classList.remove('active-popup');
    if (body) body.classList.remove('login-active');
    if (nav) {
        nav.classList.remove('open');
        document.body.classList.remove('nav-open');
    }
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    if (scrim) scrim.classList.remove('visible');
}

function showScrim(show){
    const scrim = document.querySelector('.scrim'); 
    if (!scrim) return;
    if (show) scrim.classList.add('visible'); else scrim.classList.remove('visible');
}