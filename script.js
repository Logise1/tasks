/* --- STATE --- */
let ALL_MISSIONS = [];
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || null;

/* --- ELEMENTS --- */
const onboardingView = document.getElementById('onboarding');
const mainAppView = document.getElementById('mainApp');
const settingsMenu = document.getElementById('settingsMenu');

const userNameInput = document.getElementById('userName');
const tagSelector = document.getElementById('tagSelector');

const greeting = document.getElementById('greeting');
const dateBadge = document.getElementById('dateBadge');
const missionList = document.getElementById('missionList');
const allCompleteMessage = document.getElementById('allCompleteMessage');

const btnSettings = document.getElementById('btnSettings');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnResetProfile = document.getElementById('btnResetProfile');

/* --- INIT --- */
async function init() {
    try {
        const response = await fetch('tasks.json');
        ALL_MISSIONS = await response.json();
    } catch (e) {
        console.error("Failed to load missions", e);
        // Fallback minimal tasks if fetch fails
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

    // Tag Selection
    const tagButtons = tagSelector.querySelectorAll('.tag');
    tagButtons.forEach(btn => {
        btn.onclick = () => btn.classList.toggle('selected');
    });

    // Enter key
    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') goToStep2();
    });
}

// Navigation Handlers
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

/* --- MENU / SETTINGS --- */
if (btnSettings) {
    btnSettings.onclick = () => {
        settingsMenu.classList.remove('hidden');
    };
}

if (btnCloseSettings) {
    btnCloseSettings.onclick = () => {
        settingsMenu.classList.add('hidden');
    };
}

if (btnResetProfile) {
    btnResetProfile.onclick = () => {
        if (confirm('¿Estás seguro? Se borrará todo tu progreso y perfil.')) {
            localStorage.clear();
            location.reload();
        }
    };
}

/* --- MISSION ENGINE --- */
function getTodayString() {
    return new Date().toISOString().split('T')[0];
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

function getMissionsForDay() {
    const today = getTodayString();
    let seed = 0;
    for (let i = 0; i < today.length; i++) seed = ((seed << 5) - seed) + today.charCodeAt(i);
    seed |= 0;

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
        for (let i = 0; i < 30; i++) {
            const idx = Math.floor(rng.next() * poolPrimary.length);
            // Avoid duplicates by simple index check (flawed if pools change, but acceptable for MVP)
            // Ideally we check text uniqueness
            if (!usedIndicesPrimary.has(idx)) {
                usedIndicesPrimary.add(idx);
                return poolPrimary[idx];
            }
        }
        return poolPrimary[0];
    }

    selected.push(pickUniquePrimary());
    selected.push(pickUniquePrimary());

    // 30% Wildcard
    if (rng.next() > 0.70) {
        const m = rng.pick(poolSecondary);
        if (m) {
            m.isWildcard = true;
            selected.push(m);
        } else {
            selected.push(pickUniquePrimary());
        }
    } else {
        selected.push(pickUniquePrimary());
    }

    return selected;
}

function renderMissions() {
    const today = getTodayString();
    const todaysMissions = getMissionsForDay();
    const savedStatus = JSON.parse(localStorage.getItem(`status_${today}`)) || [false, false, false];

    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    dateBadge.textContent = new Date().toLocaleDateString('es-ES', options);

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
            localStorage.setItem(`status_${today}`, JSON.stringify(savedStatus));
            renderMissions();
        };

        missionList.appendChild(item);
    });

    if (savedStatus.every(Boolean)) {
        allCompleteMessage.classList.remove('hidden');
    } else {
        allCompleteMessage.classList.add('hidden');
    }
}

// Start
init();
