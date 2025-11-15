// --- START: Firebase v12 (Modular) Initialization ---

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";

// Auth imports (Email/Password, Remember Me, Forgot Password)
import {
    getAuth,
    createUserWithEmailAndPassword,
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

// --- ADDED: FIRESTORE IMPORTS ---
import { 
    getFirestore, 
    collection, 
    collectionGroup, // For our nested query
    getDocs,
    query,
    orderBy,
    where // Added for dashboard query
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

// --- CORRECTED INITIALIZATION ORDER ---
// 1. Initialize the app
const app = initializeApp(firebaseConfig);

// 2. Get services *from* the app
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Initialize Firestore
// --- END: Firebase Initialization ---


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
            navActionLink.href = 'dashboard.html';
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
        if (!onAuthPage) {
            console.log('Access denied. Redirecting to login.');
            window.location.href = 'index.html';
        }
    }
});
// --- END: Auth State Listener ---


// --- UPDATED FUNCTION: Load appointments for Dashboard ---
async function loadAppointments() {
    const tableBody = document.getElementById('schedule-table-body');
    if (!tableBody) return; // Stop if we're not on the dashboard page

    tableBody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
    let html = '';
    let appointmentsFound = false; // Flag to check if we find any appointments

    // --- FIX: Get today's date in "DD/MM/YYYY" format ---
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
    const y = today.getFullYear();
    const todaysDateString = `${d}/${m}/${y}`;
    console.log("Fetching appointments for:", todaysDateString);
    // --- END FIX ---

    try {
        // 1. Create a query to get docs from "bookedSlots"
        //    WHERE the date matches today
        //    ORDERED by the time.
        const q = query(
            collectionGroup(db, "bookedSlots"), 
            where("date", "==", todaysDateString), 
            orderBy("time")
        );

        // 2. Fetch the documents
        const querySnapshot = await getDocs(q);

        // 3. Loop through each document and build an HTML row
        querySnapshot.forEach((doc) => {
            appointmentsFound = true; // Set flag to true
            const appt = doc.data(); 
            
            // Use .userId (lowercase 'd')
            const patientName = appt.patient || appt.bookedBy || appt.userId || "Unknown Patient";
            const patientURL = `patient-profile.html?patient=${encodeURIComponent(patientName)}`;

            html += `
                <tr>
                    <td data-label="Date">${appt.date}</td>
                    <td data-label="Time">${appt.time}</td>
                    <td data-label="Patient">
                        <a href="${patientURL}" class="patient-link">${patientName}</a>
                    </td>
                </tr>
            `;
        });

        // 4. Check if we found anything
        if (!appointmentsFound) {
            tableBody.innerHTML = `<tr><td colspan="3">No appointments found for today (${todaysDateString}).</td></tr>`;
        } else {
            tableBody.innerHTML = html;
        }

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
// --- END NEW FUNCTION ---


// --- (LATEST) Calendar state & functions ---
let currentViewDate = new Date();
// This maps our database time (07:00) to a grid row number (1)
const timeToRow = {
    '07:00': 1, '08:00': 2, '09:00': 3, '10:00': 4, '11:00': 5, '12:00': 6,
    '13:00': 7, '14:00': 8, '15:00': 9, '16:00': 10, '17:00': 11
};
const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// This function now *only* draws the background grid and labels
function renderWeeklyCalendar(date) {
    const calendarTitle = document.getElementById('calendar-title');
    const calendarHeader = document.getElementById('calendar-header');
    const calendarBody = document.getElementById('calendar-body');
    if (!calendarTitle || !calendarHeader || !calendarBody) return;

    calendarHeader.innerHTML = ''; // Clear header
    calendarBody.innerHTML = '';   // Clear body

    const monday = getMonday(date);
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

    calendarTitle.textContent = `${monthFormatter.format(monday).toUpperCase()} ${monday.getFullYear()}`;

    // 1. Build Header
    calendarHeader.innerHTML = '<div class="time-column">Time</div>';
    for (let i = 0; i < 6; i++) { // MON - SAT
        const currentDay = new Date(monday);
        currentDay.setDate(monday.getDate() + i);
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
        calendarBody.appendChild(label);
    }
    
    // Add day background columns
    for (let i = 0; i < 6; i++) { // 6 day columns
        const dayCol = document.createElement('div');
        dayCol.className = 'day-bg-col';
        dayCol.style.gridColumn = i + 2; // Start from 2nd grid column
        calendarBody.appendChild(dayCol);
    }
}

// --- LATEST CALENDAR FUNCTION ---
// This function now fetches AND places the appointments
async function initializeCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    if (!calendarBody) return;

    // 1. Render the background grid first
    renderWeeklyCalendar(currentViewDate);

    // --- Define the date range for the current view ---
    const weekStart = getMonday(currentViewDate);
    weekStart.setHours(0, 0, 0, 0); // Normalize to start of Monday

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 5); // Go to Saturday
    weekEnd.setHours(23, 59, 59, 999); // Normalize to end of Saturday
    // --- END ---

    try {
        // 2. Fetch all appointments
        const q = query(collectionGroup(db, "bookedSlots"), orderBy("time"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("No appointments found for calendar.");
        }

        // 3. Loop through docs and place them on the grid
        querySnapshot.forEach((doc) => {
            const appt = doc.data();
            
            // --- FIX 1: Changed .userID to .userId (lowercase 'd') ---
            const patientName = appt.patient || appt.bookedBy || appt.userId || "Unknown";

            // A. Format Date (DD/MM/YYYY -> Date object)
            const dateParts = appt.date.split('/'); 
            if (dateParts.length !== 3) {
                console.warn("Skipping appointment with malformed date:", appt.date);
                return;
            }

            // Trim whitespace from date parts
            const day = dateParts[0].trim();
            const month = dateParts[1].trim();
            const year = dateParts[2].trim();
            
            // Create date string in YYYY-MM-DD format
            const isoDateStr = `${year}-${month}-${day}T00:00:00`;
            const apptDate = new Date(isoDateStr);

            // Check for Invalid Date
            if (isNaN(apptDate.getTime())) {
                console.warn("Skipping appointment with invalid date:", appt.date, "Parsed as:", isoDateStr);
                return;
            }
            
            // B. Check if this appointment is in the currently displayed week
            if (apptDate < weekStart || apptDate > weekEnd) {
                return; // Skip this appointment, it's not for this week
            }
            
            // C. Get Day of Week (0=Sun, 1=Mon...). We ignore Sunday (0).
            const apptDay = apptDate.getDay();
            if (apptDay === 0) return; // Skip Sundays
            const colStart = apptDay + 1; // Mon=2, Tue=3...

            // D. Get Time Info
            const timeParts = appt.time.split('-');
            if (timeParts.length !== 2) return;
            
            // Trim whitespace from time parts
            const rawStartTime = timeParts[0].trim(); 
            const endTimePart = timeParts[1].trim(); 
            
            // --- FIX 2: Use the new helper function to normalize time ---
            const startTime = normalizeStartTime(rawStartTime); // "8:00" -> "08:00", "2:00" -> "14:00"
            const endTime = normalizeStartTime(endTimePart.split(':')[0] + ':00');

            const rowStart = timeToRow[startTime];
            
            // rowEnd should be the row *after* the appointment ends
            const rowEnd = timeToRow[endTime] ? timeToRow[endTime] : (timeToRow[startTime] + 1); 
            
            // Skip if time is not in our grid
            if (!rowStart) {
                console.warn("Skipping appointment. Could not find row for start time:", startTime, "(Original:", rawStartTime, ")");
                return;
            }

            // E. Create the appointment element
            const apptElement = document.createElement('div');
            apptElement.className = 'appointment';
            
            // Set grid position via CSS variables
            apptElement.style.setProperty('--col-start', colStart);
            apptElement.style.setProperty('--row-start', rowStart);
            apptElement.style.setProperty('--row-end', rowEnd); // Spans *until* this row
            
            // Create the inner link
            apptElement.innerHTML = `
                <a href="patient-profile.html?patient=${encodeURIComponent(patientName)}" class="patient-appointment">
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

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// --- NEW HELPER: Normalizes time from DB to match timeToRow map ---
function normalizeStartTime(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null; // Invalid format

    let hour = parseInt(parts[0], 10);
    const minute = parts[1];

    if (isNaN(hour)) return null;

    // Convert 12-hour PM times (1-5) to 24-hour
    // This assumes 1:00-5:00 are PM. If you have AM times like 1AM, this logic needs to be smarter.
    if (hour >= 1 && hour <= 5) {
        hour += 12; // "2:00" becomes 14
    }
    
    // Add leading zero for AM times (7-9)
    const hourStr = String(hour).padStart(2, '0'); // "8" becomes "08"
    
    return `${hourStr}:${minute}`;
}
// --- END NEW HELPER ---

// --- END (LATEST) Calendar functions ---


// This array is no longer used by the new calendar
let allAppointments = [];

// UI selectors (Define these once if needed globally)
const wrapper = document.querySelector('.wrapper');
const loginlink = document.querySelector('.login-link');
const regsiterlink = document.querySelector('.register-link');
// btnPopup is effectively replaced by navActionLink logic
const iconClose = document.querySelector('.icon-close');
const body = document.querySelector('body');
const nav = document.getElementById('primary-navigation'); // Might be null
const navToggle = document.querySelector('.nav-toggle'); // Might be null
const scrim = document.querySelector('.scrim'); // Might be null

// Toggle login/register view
if (regsiterlink && wrapper) regsiterlink.addEventListener('click', ()=> wrapper.classList.add('active'));
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
// --- End Helper Functions ---


// --- Login logic with persistence ---
const loginForm = document.querySelector('.form-box.login form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMeInput = document.querySelector('.form-box.login input[name="remember"]');
        const rememberMe = rememberMeInput ? rememberMeInput.checked : false;

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
                window.location.href = 'dashboard.html';
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

// --- Registration logic (with setting displayName) ---
const registerForm = document.querySelector('.form-box.register form');
if (registerForm) {
     registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const username = document.getElementById('register-username').value; // Get username

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('Registered user:', user);
                // Update profile with display name
                return updateProfile(user, {
                    displayName: username
                });
            })
            .then(() => {
                console.log('Display name set to:', username);
                alert('Registration successful! Please login.');
                if (wrapper) wrapper.classList.remove('active');
            })
            .catch((error) => {
                const errorCode = error.code;
                console.error("Registration error:", errorCode, error.message);
                if (errorCode === 'auth/weak-password') {
                    alert('The password is too weak (must be at least 6 characters).');
                } else if (errorCode === 'auth/email-already-in-use') {
                    alert('This email address is already in use.');
                } else if (errorCode === 'auth/operation-not-allowed') {
                     alert('Error setting display name. Please contact support.');
                } else {
                    alert(error.message);
                }
            });
     });
}

// --- Sidebar hidden nav toggle ---
const sidebarHamburger = document.querySelector('.sidebar-header .hamburger-menu');
const hiddenNavItems = document.querySelectorAll('.nav-item.hidden');
if (sidebarHamburger && hiddenNavItems.length > 0) {
    sidebarHamburger.addEventListener('click', function() {
        hiddenNavItems.forEach(item => item.classList.toggle('show'));
    });
}

// --- Load patient profile and update gauge ---
function loadPatientProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientName = urlParams.get('patient');

    if (patientName) {
        const nameElement = document.getElementById('patient-name');
        
        // Use .userId (lowercase 'd')
        if (nameElement) nameElement.textContent = patientName + ' /M';

        let severity = 92; // Default or fetch actual data
        if (patientName.includes('Kenneth')) severity = 45;
        else if (patientName.includes('Rye')) severity = 25;
        else if (patientName.includes('Ezaiah')) severity = 78;
        else if (patientName.includes('Elijah')) severity = 35;
        else if (patientName.includes('guest')) severity = 68; // Added 'guest'

        let severityText;
        if (severity <= 33.33) severityText = 'mild';
        else if (severity <= 66.66) severityText = 'moderate';
        else severityText = 'severe';

        const severityElement = document.getElementById('severity-value');
        const severityTextElement = document.getElementById('severity-text');
        const descriptionElement = document.querySelector('.severity-description p');

        if (severityElement) severityElement.textContent = severity + '%';
        if (severityTextElement) severityTextElement.textContent = severity + '%';
        if (descriptionElement) {
            descriptionElement.innerHTML = `Based on SafeMind's analysis, the level of severity of the patient's depression is <strong>${severity}%</strong>, which indicates a <strong>${severityText}</strong> level of depression.`;
        }

        const needle = document.getElementById('gauge-needle');
        if (needle) {
            let angle = ((severity / 100) * 180) - 90;
            needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
        }
    }
}

// --- Respect reduced motion ---
const mediaReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (mediaReduceMotion.matches) document.documentElement.classList.add('reduce-motion');


// --- DOMContentLoaded listener ---
document.addEventListener('DOMContentLoaded', function() {
    
    // --- UPDATED: Page specific initializations ---
    if (document.querySelector('.calendar-content')) {
        initializeCalendar(); // Fetches data AND renders
    }
    if (document.querySelector('.patient-profile-content')) {
        loadPatientProfile();
    }
    if (document.querySelector('.schedule-table-container')) {
        loadAppointments(); // Fetches data for dashboard
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
        mobileHamburger.addEventListener('click', function() {
            dashboardSidebar.classList.toggle('open');
        });
     }

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

}); // End of DOMContentLoaded