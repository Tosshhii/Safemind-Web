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
    limit  
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"; // <-- THIS WAS THE BROKEN LINE
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


// --- (UPDATED) Load appointments for Dashboard ---
async function loadAppointments() {
    const tableBody = document.getElementById('schedule-table-body');
    if (!tableBody) return; // Stop if we're not on the dashboard page

    tableBody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
    
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

        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="3">No appointments found for today (${todaysDateString}).</td></tr>`;
            return;
        }

        // 3. Create promises for each appointment to fetch user data
        const appointmentPromises = querySnapshot.docs.map(async (apptDoc) => {
            const appt = apptDoc.data();
            const patientId = appt.userId;
            let patientName = "Unknown Patient";
            let patientURL = '#';

            if (patientId) {
                // --- THIS IS THE NEW PART ---
                // For each appointment, fetch the patient's name from the 'users' collection
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
                // --- END NEW PART ---
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

        // 4. Wait for all the user fetches and HTML creation to complete
        const htmlRows = await Promise.all(appointmentPromises);

        // 5. Join all the HTML rows and set the table body
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


// --- (LATEST) Calendar state & functions ---
let currentViewDate = new Date();
// --- **** TIME CHANGE #1: New 8am-6pm map **** ---
// This maps our database time (08:00) to a grid row number (1)
const timeToRow = {
    '08:00': 1, '09:00': 2, '10:00': 3, '11:00': 4, '12:00': 5,
    '13:00': 6, '14:00': 7, '15:00': 8, '16:00': 9, '17:00': 10
};
// --- **** TIME CHANGE #2: New 8am-5pm labels (for 10 slots) **** ---
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

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

// --- **** LATEST CALENDAR FUNCTION (WITH NAME FETCHING) **** ---
async function initializeCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    if (!calendarBody) return;

    // 1. Render the background grid first
    renderWeeklyCalendar(currentViewDate);

    const weekStart = getSunday(currentViewDate);
    weekStart.setHours(0, 0, 0, 0); // Normalize to start of Sunday

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); 
    weekEnd.setHours(23, 59, 59, 999); // Normalize to end of Saturday

    try {
        // 2. Fetch all appointments
        const q = query(collectionGroup(db, "bookedSlots"), orderBy("time"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("No appointments found for calendar.");
        }

        // 3. Loop through docs and place them on the grid
        //    (Using async forEach to fetch names)
        querySnapshot.forEach(async (apptDoc) => {
            const appt = apptDoc.data();
            const patientId = appt.userId; // Get the ID

            // A. Format Date (DD/MM/YYYY -> Date object)
            const dateParts = appt.date.split('/'); 
            if (dateParts.length !== 3) {
                console.warn("Skipping appointment with malformed date:", appt.date);
                return;
            }
            const day = dateParts[0].trim();
            const month = dateParts[1].trim();
            const year = dateParts[2].trim();
            const isoDateStr = `${year}-${month}-${day}T00:00:00`;
            const apptDate = new Date(isoDateStr);

            if (isNaN(apptDate.getTime())) {
                console.warn("Skipping appointment with invalid date:", appt.date, "Parsed as:", isoDateStr);
                return;
            }
            
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
            
            const rawStartTime = timeParts[0].trim(); 
            const endTimePart = timeParts[1].trim(); 
            
            const startTime = normalizeStartTime(rawStartTime);
            const endTime = normalizeStartTime(endTimePart.split(':')[0] + ':00');

            const rowStart = timeToRow[startTime];
            const rowEnd = timeToRow[endTime] ? timeToRow[endTime] : (timeToRow[startTime] + 1); 
            
            if (!rowStart) {
                console.warn("Skipping appointment. Could not find row for start time:", startTime, "(Original:", rawStartTime, ")");
                return;
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
                <a href="patient-profile.html?id=${encodeURIComponent(patientId)}" class="patient-appointment">
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
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null; // Invalid format

    let hour = parseInt(parts[0], 10);
    const minute = parts[1];

    if (isNaN(hour)) return null;

    // Convert 12-hour PM times (1-5) to 24-hour
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

// --- **** (THIS IS THE UPDATED FUNCTION) **** ---
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

    // --- Get all NEW modal elements ---
    const modalPatientName = document.getElementById('modal-patient-name');
    const modalPatientAge = document.getElementById('modal-patient-age');
    const modalPatientLocation = document.getElementById('modal-patient-location');
    const modalPatientEmail = document.getElementById('modal-patient-email');
    const modalSeverityText = document.getElementById('modal-severity-text');
    const modalSeverityPercent = document.getElementById('modal-severity-percent');
    const modalRecommendation = document.getElementById('modal-recommendation');
    const qaContainer = document.getElementById('modal-qa-container');
    // --- End modal elements ---

    if (!patientId) {
        if (nameElement) nameElement.textContent = "No Patient ID Provided";
        return;
    }

    try {
        // --- FETCH 1: Get User Info from 'users' collection ---
        const userDocRef = doc(db, "users", patientId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            // Populate main page
            if (nameElement) nameElement.textContent = userData.name || "Unknown Patient";
            if (ageElement) ageElement.textContent = userData.age ? `${userData.age} yrs Old` : '-- yrs Old';
            if (locationElement) locationElement.textContent = userData.city || "Unknown Location";

            // --- Populate modal with user data ---
            if (modalPatientName) modalPatientName.textContent = userData.name || "Unknown Patient";
            if (modalPatientAge) modalPatientAge.textContent = userData.age || "--";
            if (modalPatientLocation) modalPatientLocation.textContent = userData.city || "Unknown Location";
            if (modalPatientEmail) modalPatientEmail.textContent = userData.email || "No email provided";
            
        } else {
            console.log("Patient document not found in 'users' collection");
            if (nameElement) nameElement.textContent = "Patient Not Found";
        }

        // --- FETCH 2: Get Latest Prediction from 'api_predictions' ---
        const predictionsRef = collection(db, "api_predictions");
        const q = query(
            predictionsRef,
            where("userId", "==", patientId),    // Find reports for this user
            orderBy("timestamp", "desc"), // Get the most recent one
            limit(1)                      // Only get one
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const predictionData = querySnapshot.docs[0].data();
            
            // --- Logic for severity and gauge ---
            const severityCategory = parseFloat(predictionData.severity_numeric) || 0;
            const severityText = predictionData.severity || 'unknown';
            const categoryMap = {
                "0.0": 15, "1.0": 35, "2.0": 65, "3.0": 85
            };
            const categoryString = severityCategory.toFixed(1);
            const displayPercent = categoryMap[categoryString] || 10; 
            
            // --- Populate main page ---
            if (severityElement) severityElement.textContent = displayPercent + '%';
            if (severityTextElement) severityTextElement.textContent = severityText;
            if (descriptionElement) {
                descriptionElement.innerHTML = `Based on SafeMind's analysis, the level of severity of the patient's depression is <strong>${severityText}</strong>, which indicates a <strong>${severityText}</strong> level of depression.`;
            }
            if (needle) {
                let angle = ((displayPercent / 100) * 180) - 90;
                needle.style.transform = `rotate(${angle}deg)`;
            }

            // --- Populate modal with analysis data ---
            if (modalSeverityText) modalSeverityText.textContent = severityText;
            if (modalSeverityPercent) modalSeverityPercent.textContent = displayPercent + '%';
            if (modalRecommendation) modalRecommendation.textContent = predictionData.recommendation || "No recommendation provided.";

            // --- **** UPDATED Q&A LOGIC **** ---
            if (qaContainer) {
                qaContainer.innerHTML = ''; // Clear any old data
                
                // Get the input_data map, or use the root document as a fallback
                const answersData = predictionData.input_data || predictionData;

                // Loop through all keys in the answers data
                Object.keys(answersData)
                    .filter(key => key.startsWith('text_') || key.startsWith('rating_')) // Get all 'text_' and 'rating_' keys
                    .sort((a, b) => {
                        // Sort keys numerically (e.g., rating_1, text_1, rating_2, text_2)
                        const numA = parseInt(a.split('_')[1], 10);
                        const numB = parseInt(b.split('_')[1], 10);
                        if (numA !== numB) {
                            return numA - numB;
                        }
                        // If number is same, put 'rating_' before 'text_'
                        return a.localeCompare(b);
                    })
                    .forEach(key => {
                        // Use the key (e.g., 'text_1') to get the question from our map
                        const questionText = QUESTION_MAP[key] || key; // Use key as fallback
                        const answer = answersData[key];
                        
                        // Create and append the HTML for this Q&A
                        const item = document.createElement('li');
                        item.className = 'qa-item';
                        
                        // --- NEW LOGIC: Check if it's a rating or text ---
                        if (key.startsWith('rating_')) {
                            item.innerHTML = `
                                <strong>${questionText}</strong>
                                <p class="rating-answer">Rating: <strong>${answer}</strong> / 5</p>
                            `;
                        } else {
                            item.innerHTML = `
                                <strong>${questionText}</strong>
                                <p>${answer}</p>
                            `;
                        }
                        qaContainer.appendChild(item);
                    });
                
                if (qaContainer.children.length === 0) {
                    qaContainer.innerHTML = '<li>No Q&A data found for this report.</li>';
                }
            }
            // --- **** END OF UPDATED Q&A LOGIC **** ---

        } else {
            // This runs if the user exists but has no analysis reports
            console.log("No prediction found for this user.");
            if (severityElement) severityElement.textContent = '--%';
            if (severityTextElement) severityTextElement.textContent = 'No analysis';
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

        // Add click events
        reportButton.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
        
        modalClose.addEventListener('click', closeModal);
        modalScrim.addEventListener('click', closeModal);
    }
    // --- **** END OF NEW MODAL HANDLERS **** ---

}); // End of DOMContentLoaded