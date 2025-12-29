/* --- STATE --- */
let ALL_MISSIONS = [];
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || null;

// Calendar State
let currentCalendarDate = new Date(); // Tracks the month being viewed
let selectedDate = new Date(); // Tracks the selected day for details

/* --- ELEMENTS --- */
const onboardingView = document.getElementById('onboarding');
const mainAppView = document.getElementById('mainApp');

// Modals
const settingsMenu = document.getElementById('settingsMenu');
const calendarOverlay = document.getElementById('calendarOverlay');

const userNameInput = document.getElementById('userName');
const tagSelector = document.getElementById('tagSelector');

const greeting = document.getElementById('greeting');
const dateBadge = document.getElementById('dateBadge');
const missionList = document.getElementById('missionList');
const allCompleteMessage = document.getElementById('allCompleteMessage');

// Buttons
const btnSettings = document.getElementById('btnSettings');
const btnCalendar = document.getElementById('btnCalendar');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnCloseCalendar = document.getElementById('btnCloseCalendar');
const btnResetProfile = document.getElementById('btnResetProfile');
const btnPrevMonth = document.getElementById('prevMonth');
const btnNextMonth = document.getElementById('nextMonth');

// Calendar Elements
const calendarMonthTitle = document.getElementById('calendarMonthTitle');
const fullCalendarGrid = document.getElementById('fullCalendarGrid');
const selectedDayDetails = document.getElementById('selectedDayDetails');
const selectedDayDate = document.getElementById('selectedDayDate');
const selectedDayMissions = document.getElementById('selectedDayMissions');

const confettiCanvas = document.getElementById('confettiCanvas');

/* --- INIT --- */
async function init() {
    try {
        const response = await fetch('tasks.json');
        ALL_MISSIONS = await response.json();
    } catch (e) {
        console.error("Failed to load missions", e);
        ALL_MISSIONS = [
            { text: "Beber agua", tags: ["health"] },
            { text: "Leer un poco", tags: ["mind"] },
            { text: "Ordenar algo", tags: ["productivity"] }
        ];
    }

    if (!userProfile) {
        showOnboarding();
    } else {
        showApp();
    }
}

/* --- ONBOARDING LOGIC --- */
function showOnboarding() {
    onboardingView.classList.remove('hidden');
    mainAppView.classList.add('hidden');

    const tagButtons = tagSelector.querySelectorAll('.tag');
    tagButtons.forEach(btn => {
        btn.onclick = () => btn.classList.toggle('selected');
    });

    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') goToStep2();
    });
}

const btnToStep2 = document.getElementById('btnToStep2');
if (btnToStep2) btnToStep2.onclick = goToStep2;

const btnBackToStep1 = document.getElementById('btnBackToStep1');
if (btnBackToStep1) btnBackToStep1.onclick = goToStep1;

const btnFinishSetup = document.getElementById('btnFinishSetup');
if (btnFinishSetup) btnFinishSetup.onclick = finishSetup;

function goToStep2() {
    const name = userNameInput.value.trim();
    if (!name) {
        userNameInput.style.borderBottomColor = '#ef4444';
        setTimeout(() => userNameInput.style.borderBottomColor = '#333', 1000);
        return;
    }

    document.getElementById('step1').classList.remove('active-step');
    document.getElementById('step1').classList.add('hidden-step');

    setTimeout(() => {
        document.getElementById('step2').classList.remove('hidden-step');
        document.getElementById('step2').classList.add('active-step');
    }, 100);
}

function goToStep1() {
    document.getElementById('step2').classList.remove('active-step');
    document.getElementById('step2').classList.add('hidden-step');

    setTimeout(() => {
        document.getElementById('step1').classList.remove('hidden-step');
        document.getElementById('step1').classList.add('active-step');
    }, 100);
}

function finishSetup() {
    const name = userNameInput.value.trim() || "Viajero";
    const selectedTags = Array.from(tagSelector.querySelectorAll('.tag.selected'))
        .map(btn => btn.dataset.value);

    const tags = selectedTags.length > 0 ? selectedTags : ['health', 'mind', 'productivity'];

    userProfile = {
        name: name,
        interests: tags,
        joinedDate: new Date().toISOString()
    };

    localStorage.setItem('userProfile', JSON.stringify(userProfile));

    onboardingView.style.opacity = '0';
    setTimeout(() => {
        onboardingView.classList.add('hidden');
        showApp();
    }, 500);
}

/* --- APP LOGIC --- */
function showApp() {
    onboardingView.classList.add('hidden');
    mainAppView.classList.remove('hidden');
    greeting.textContent = `Misiones para ${userProfile.name}`;
    renderMissions();
}

/* --- NAVIGATION LISTENERS --- */
if (btnSettings) {
    btnSettings.onclick = (e) => {
        settingsMenu.classList.remove('hidden');
    };
}

if (btnCloseSettings) {
    btnCloseSettings.onclick = () => {
        settingsMenu.classList.add('hidden');
    };
}

if (btnCalendar) {
    btnCalendar.onclick = () => {
        calendarOverlay.classList.remove('hidden');
        renderFullCalendar();
        // Automatically select "today" when opening if in current month
        const today = new Date();
        if (currentCalendarDate.getMonth() === today.getMonth() && currentCalendarDate.getFullYear() === today.getFullYear()) {
            renderDayDetails(today);
        } else {
            // Or clear selection
            // selectedDayDetails.classList.add('hidden');
        }
    };
}

if (btnCloseCalendar) {
    btnCloseCalendar.onclick = () => {
        calendarOverlay.classList.add('hidden');
    };
}

if (btnPrevMonth) {
    btnPrevMonth.onclick = () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderFullCalendar();
    };
}

if (btnNextMonth) {
    btnNextMonth.onclick = () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderFullCalendar();
    };
}

/* --- RESET PROFILE --- */
let resetConfirmTimer = null;
if (btnResetProfile) {
    btnResetProfile.onclick = () => {
        if (btnResetProfile.dataset.confirming === 'true') {
            localStorage.clear();
            location.reload();
        } else {
            btnResetProfile.dataset.confirming = 'true';
            btnResetProfile.textContent = '¿Seguro? Pulsa de nuevo';
            btnResetProfile.style.borderColor = '#ef4444';
            btnResetProfile.style.background = '#331111';

            if (resetConfirmTimer) clearTimeout(resetConfirmTimer);
            resetConfirmTimer = setTimeout(() => {
                btnResetProfile.dataset.confirming = 'false';
                btnResetProfile.textContent = 'Reiniciar Perfil';
                btnResetProfile.style.borderColor = '';
                btnResetProfile.style.background = '';
            }, 3000);
        }
    };
}

/* --- MISSION ENGINE --- */
function getDateString(dateObj) {
    // Return YYYY-MM-DD local
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

class Random {
    constructor(seed) { this.state = seed; }
    next() {
        this.state |= 0;
        this.state = this.state + 0x9e3779b9 | 0;
        let t = this.state ^ (this.state >>> 16);
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ (t >>> 15);
        t = Math.imul(t, 0x735a2d97);
        return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
    }
    pick(array) {
        if (!array || !array.length) return null;
        return array[Math.floor(this.next() * array.length)];
    }
}

// Rewritten to accept any Date object
function getMissionsForDate(dateObj) {
    const dateStr = getDateString(dateObj);

    // Seed generation
    const userSalt = userProfile.joinedDate || userProfile.name || "default";
    const seedString = dateStr + userSalt;

    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
        seed = ((seed << 5) - seed) + seedString.charCodeAt(i);
        seed |= 0;
    }

    const rng = new Random(seed);

    const interestMissions = ALL_MISSIONS.filter(m =>
        m.tags.some(t => userProfile.interests.includes(t))
    );
    const outsideMissions = ALL_MISSIONS.filter(m =>
        !m.tags.some(t => userProfile.interests.includes(t))
    );

    const poolPrimary = interestMissions.length > 0 ? interestMissions : ALL_MISSIONS;
    const poolSecondary = outsideMissions.length > 0 ? outsideMissions : ALL_MISSIONS;

    const selected = [];
    const usedIndicesPrimary = new Set();

    function pickUniquePrimary() {
        if (poolPrimary.length === 0) return { text: "Descanso", tags: ["comfort"] };
        for (let i = 0; i < 30; i++) {
            const idx = Math.floor(rng.next() * poolPrimary.length);
            if (!usedIndicesPrimary.has(idx)) {
                usedIndicesPrimary.add(idx);
                return poolPrimary[idx];
            }
        }
        return poolPrimary[0];
    }

    selected.push(pickUniquePrimary());
    selected.push(pickUniquePrimary());

    // 30% Wildcard chance
    if (rng.next() > 0.70) {
        const m = rng.pick(poolSecondary);
        if (m) {
            // Clone to not mutate original
            selected.push({ ...m, isWildcard: true });
        } else {
            selected.push(pickUniquePrimary());
        }
    } else {
        selected.push(pickUniquePrimary());
    }

    return selected;
}

function renderMissions() {
    const todayDate = new Date();
    const todayStr = getDateString(todayDate);
    const todaysMissions = getMissionsForDate(todayDate);
    const savedStatus = JSON.parse(localStorage.getItem(`status_${todayStr}`)) || [false, false, false];

    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    dateBadge.textContent = todayDate.toLocaleDateString('es-ES', options);

    missionList.innerHTML = '';

    todaysMissions.forEach((mission, index) => {
        const isCompleted = savedStatus[index];
        const categoryLabel = mission.isWildcard ? "NUEVO RETO" : mission.tags[0];

        const item = document.createElement('div');
        item.className = `mission-item ${isCompleted ? 'completed' : ''}`;

        item.innerHTML = `
            <div class="checkbox-container">
                <div class="checkbox-custom"></div>
            </div>
            <div class="mission-content">
                <div class="mission-meta">${categoryLabel.toUpperCase()}</div>
                <span class="mission-text">${mission.text}</span>
            </div>
        `;

        item.onclick = () => {
            savedStatus[index] = !savedStatus[index];
            localStorage.setItem(`status_${todayStr}`, JSON.stringify(savedStatus));
            renderMissions();

            // Trigger Confetti if all complete
            if (savedStatus.every(Boolean)) {
                triggerConfetti();
            }
        };

        missionList.appendChild(item);
    });

    if (savedStatus.every(Boolean)) {
        allCompleteMessage.classList.remove('hidden');
    } else {
        allCompleteMessage.classList.add('hidden');
    }
}

/* --- CALENDAR LOGIC --- */
function renderFullCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // Title
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    calendarMonthTitle.textContent = `${monthNames[month]} ${year}`;

    fullCalendarGrid.innerHTML = '';

    // First day of month (0=Sun, 1=Mon...)
    // We want Monday start? Spanish standard is Monday.
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Convert to Monday-start: 0->6, 1->0, 2->1 ...
    const startOffset = (firstDay === 0) ? 6 : firstDay - 1;

    // Days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty Slots
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'full-calendar-day empty';
        fullCalendarGrid.appendChild(empty);
    }

    // Days
    const todayStr = getDateString(new Date());

    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        const dateStr = getDateString(dateObj);
        const status = JSON.parse(localStorage.getItem(`status_${dateStr}`)) || [false, false, false];

        const isToday = (dateStr === todayStr);
        const isSelected = (dateStr === getDateString(selectedDate));

        const dayEl = document.createElement('div');
        dayEl.className = `full-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`;

        // Dots
        let dotsHtml = '';
        status.forEach(done => {
            dotsHtml += `<div class="mini-dot ${done ? 'done' : ''}"></div>`;
        });

        dayEl.innerHTML = `
            <span>${i}</span>
            <div class="mini-dots">${dotsHtml}</div>
        `;

        dayEl.onclick = () => {
            selectedDate = dateObj;
            renderFullCalendar(); // to update selection style
            renderDayDetails(dateObj);
        };

        fullCalendarGrid.appendChild(dayEl);
    }
}

function renderDayDetails(dateObj) {
    const dateStr = getDateString(dateObj);
    const missions = getMissionsForDate(dateObj);
    const status = JSON.parse(localStorage.getItem(`status_${dateStr}`)) || [false, false, false];

    // Format Title
    const options = { day: 'numeric', month: 'long' };
    selectedDayDate.textContent = dateObj.toLocaleDateString('es-ES', options);

    selectedDayDetails.classList.remove('hidden');
    selectedDayMissions.innerHTML = '';

    missions.forEach((m, idx) => {
        const isDone = status[idx];
        const row = document.createElement('div');
        row.className = `mini-mission-item ${isDone ? 'completed' : ''}`;
        row.innerHTML = `
            <div class="mini-check"></div>
            <span>${m.text}</span>
        `;
        selectedDayMissions.appendChild(row);
    });
}

/* --- CONFETTI ENGINE (Minimal) --- */
function triggerConfetti() {
    const canvas = confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ffffff', '#eeeeee', '#cccccc'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height, // Start above
            r: Math.random() * 4 + 1,
            d: Math.random() * 10 + 10, // density
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngle: 0,
            tiltAngleIncremental: (Math.random() * 0.07) + 0.05
        });
    }

    let angle = 0;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        angle += 0.01;

        particles.forEach((p, i) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(angle + p.d) + 3 + p.r / 2) / 2;
            p.x += Math.sin(angle);
            p.tilt = Math.sin(p.tiltAngle) * 15;

            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();
        });

        // Continue until they all fall off screen
        if (particles.some(p => p.y < canvas.height)) {
            requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    draw();
}

// Start
init();
