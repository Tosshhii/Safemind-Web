// Appointment list
const allAppointments = [
    { date: '2025-04-21', time: '10:00', patient: 'Nat Jalando-on' },
    { date: '2025-04-21', time: '13:00', patient: 'Kenneth Quiballo' },
    { date: '2025-04-21', time: '14:30', patient: 'Rye Cois' },
    { date: '2025-04-21', time: '16:00', patient: 'Ezaiah Azir' },
    { date: '2025-04-21', time: '17:30', patient: 'Elijah Reign' },
    { date: '2025-04-22', time: '12:00', patient: 'Kenneth James' }
];

const wrapper = document.querySelector('.wrapper');
const loginlink = document.querySelector('.login-link');
const regsiterlink = document.querySelector('.register-link');
const btnPopup = document.querySelector('.btnLogin-popup');
const iconClose = document.querySelector('.icon-close');
const body = document.querySelector('body');

const nav = document.getElementById('primary-navigation');
const navToggle = document.querySelector('.nav-toggle');
const scrim = document.querySelector('.scrim');

// Toggle between login/register views
if (regsiterlink) {
    regsiterlink.addEventListener('click', ()=> {
        wrapper.classList.add('active');
    });
}
if (loginlink) {
    loginlink.addEventListener('click', ()=> {
        wrapper.classList.remove('active');
    });
}

// Open login modal
if (btnPopup) {
    btnPopup.addEventListener('click', ()=> {
        wrapper.classList.add('active-popup');
        body.classList.add('login-active');
        showScrim(true);
    });
}

// Close modal
if (iconClose) {
    iconClose.addEventListener('click', ()=> {
        closeOverlays();
    });
}

// Mobile nav toggle
if (navToggle && nav) {
    navToggle.addEventListener('click', ()=> {
        const open = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
        showScrim(open);
    });
}

// Scrim click closes overlays
if (scrim) {
    scrim.addEventListener('click', ()=> {
        closeOverlays();
    });
}

// ESC closes overlays
document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') {
        closeOverlays();
    }
});

// Close all overlays and hide scrim
function closeOverlays(){
    if (wrapper) wrapper.classList.remove('active-popup');
    body.classList.remove('login-active');
    if (nav) nav.classList.remove('open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    showScrim(false);
}

// Show or hide the page scrim
function showScrim(show){
    if (!scrim) return;
    if (show) scrim.classList.add('visible');
    else scrim.classList.remove('visible');
}

// Validate login credentials (simple admin check)
function validateLogin(email, password) {
    return email === 'Admin@gmail.com' && password === '1234';
}

// Handle login form submission and optional "remember me"
const loginForm = document.querySelector('.form-box.login form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.querySelector('input[name="remember"]').checked;
        
        if (validateLogin(email, password)) {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedPassword', password);
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
                localStorage.removeItem('rememberMe');
            }
            closeOverlays();
            window.location.href = 'dashboard.html';
        } else {
            alert('Invalid credentials. Please try again.');
        }
    });
}

// Load saved credentials into the login form if present
function loadRememberedCredentials() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    const rememberMe = localStorage.getItem('rememberMe');
    
    if (rememberedEmail && rememberedPassword && rememberMe === 'true') {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const rememberCheckbox = document.querySelector('input[name="remember"]');
        
        if (emailInput && passwordInput && rememberCheckbox) {
            emailInput.value = rememberedEmail;
            passwordInput.value = rememberedPassword;
            rememberCheckbox.checked = true;
        }
    }
}

document.addEventListener('DOMContentLoaded', loadRememberedCredentials);

// Toggle hidden nav items in dashboard hamburger
const hamburgerMenu = document.querySelector('.hamburger-menu');
const hiddenNavItems = document.querySelectorAll('.nav-item.hidden');

if (hamburgerMenu && hiddenNavItems.length > 0) {
    hamburgerMenu.addEventListener('click', function() {
        hiddenNavItems.forEach(item => {
            item.classList.toggle('show');
        });
    });
}

// Load patient profile and update gauge and text
function loadPatientProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientName = urlParams.get('patient');
    
    if (patientName) {
        const nameElement = document.getElementById('patient-name');
        if (nameElement) nameElement.textContent = patientName + ' /M';
        
        // Deterministic severity values for demo purposes
        let severity = 92;
        if (patientName.includes('Kenneth')) severity = 45;
        else if (patientName.includes('Rye')) severity = 25;
        else if (patientName.includes('Ezaiah')) severity = 78;
        else if (patientName.includes('Elijah')) severity = 35;
        
        // Map percentage to descriptive buckets (33.33% ranges)
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
            // Map 0-100% to -90 to +90 degrees
            let angle = ((severity / 100) * 180) - 90;
            needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadPatientProfile();
});

// Respect reduced motion preference
const mediaReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (mediaReduceMotion.matches) {
    document.documentElement.classList.add('reduce-motion');
}

// Calendar state: start on week containing this date
let currentViewDate = new Date('2025-04-21T00:00:00');

// Time slots shown in the weekly calendar
const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// Format a 24h time string into an AM/PM label (e.g., '13:00' -> '1 PM')
function formatTimeLabel(time) {
    const [hour] = time.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour} ${ampm}`;
}

// Return the Monday of the week for a given date
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon, ...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// Render the weekly calendar (Monday-Saturday) and populate appointments
function renderWeeklyCalendar(date) {
    const calendarTitle = document.getElementById('calendar-title');
    const calendarHeader = document.getElementById('calendar-header');
    const calendarBody = document.getElementById('calendar-body');

    if (!calendarTitle || !calendarHeader || !calendarBody) return;

    calendarHeader.innerHTML = '';
    calendarBody.innerHTML = '';

    const monday = getMonday(date);
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

    const endOfWeek = new Date(monday);
    endOfWeek.setDate(monday.getDate() + 5); // Saturday
    calendarTitle.textContent = `${monthFormatter.format(monday).toUpperCase()} ${monday.getFullYear()}`;

    let headerHTML = '<div class="time-column">Time</div>';
    const weekDates = [];

    for (let i = 0; i < 6; i++) {
        const currentDay = new Date(monday);
        currentDay.setDate(monday.getDate() + i);
        const dayName = dayFormatter.format(currentDay).toUpperCase();
        const dayNum = currentDay.getDate();
        const dateString = currentDay.toISOString().split('T')[0];
        weekDates.push(dateString);
        headerHTML += `<div class="day-header">${dayName} ${dayNum}</div>`;
    }
    calendarHeader.innerHTML = headerHTML;

    let bodyHTML = '';
    for (const time of timeSlots) {
        bodyHTML += '<div class="time-slot">';
        bodyHTML += `<div class="time-label">${formatTimeLabel(time)}</div>`;
        for (let i = 0; i < 6; i++) {
            const cellDate = weekDates[i];
            const cellId = `cell-${cellDate}-${time}`;
            bodyHTML += `<div class="day-cell" id="${cellId}"></div>`;
        }
        bodyHTML += '</div>';
    }
    calendarBody.innerHTML = bodyHTML;

    // Place each appointment into the nearest hour cell
    for (const appt of allAppointments) {
        const apptHour = appt.time.split(':')[0] + ':00'; // e.g., '14:30' -> '14:00'
        const cellId = `cell-${appt.date}-${apptHour}`;
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.innerHTML += `
                <div class="appointment">
                    <a href="patient-profile.html?patient=${encodeURIComponent(appt.patient)}" class="patient-appointment">
                        ${appt.patient}
                        <span class="appt-time">${formatTimeLabel(appt.time)}</span>
                    </a>
                </div>
            `;
        }
    }
}

// Initialize calendar and week navigation buttons
document.addEventListener('DOMContentLoaded', function() {
    renderWeeklyCalendar(currentViewDate);

    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');

    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentViewDate.setDate(currentViewDate.getDate() - 7);
            renderWeeklyCalendar(currentViewDate);
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentViewDate.setDate(currentViewDate.getDate() + 7);
            renderWeeklyCalendar(currentViewDate);
        });
    }
});
