/* --- DATA POOL --- */
const ALL_MISSIONS = [
    // Health
    { text: "Beber 2.5 litros de agua hoy", tags: ["health"] },
    { text: "Hacer 20 flexiones", tags: ["health"] },
    { text: "Caminar 30 minutos", tags: ["health"] },
    { text: "Comer una ensalada", tags: ["health"] },
    { text: "No comer azúcar hoy", tags: ["health"] },
    { text: "Dormir 8 horas esta noche", tags: ["health"] },
    { text: "Hacer 5 minutos de estiramientos", tags: ["health"] },
    { text: "Subir solo por escaleras hoy", tags: ["health"] },
    { text: "Hacer 30 sentadillas", tags: ["health"] },
    { text: "Desayunar sin mirar el móvil", tags: ["health"] },

    // Mind
    { text: "Meditar 5 minutos", tags: ["mind"] },
    { text: "Leer 10 páginas de un libro", tags: ["mind"] },
    { text: "Escribir 3 cosas que agradeces", tags: ["mind"] },
    { text: "No quejarte en voz alta hoy", tags: ["mind"] },
    { text: "Estar 30 min sin pantallas", tags: ["mind"] },
    { text: "Escuchar música clásica/lofi", tags: ["mind"] },
    { text: "Observar el atardecer", tags: ["mind"] },
    { text: "Respirar profundo en 4-7-8 x3", tags: ["mind"] },

    // Productivity
    { text: "Ordenar tu escritorio", tags: ["productivity"] },
    { text: "Hacer la tarea más difícil primero", tags: ["productivity"] },
    { text: "Borrar 50 emails antiguos", tags: ["productivity"] },
    { text: "Planificar el día de mañana", tags: ["productivity"] },
    { text: "Limpiar archivos del escritorio PC", tags: ["productivity"] },
    { text: "Lavar los platos inmediatamente", tags: ["productivity"] },

    // Social
    { text: "Llamar a un familiar", tags: ["social"] },
    { text: "Enviar mensaje a un amigo lejano", tags: ["social"] },
    { text: "Hacer un cumplido genuino", tags: ["social"] },
    { text: "Escuchar activamente a alguien", tags: ["social"] },
    { text: "Sonreír a un desconocido", tags: ["social"] },

    // Creativity
    { text: "Dibujar algo (aunque sea mal)", tags: ["creativity"] },
    { text: "Escribir un poema corto", tags: ["creativity"] },
    { text: "Tomar una foto artística", tags: ["creativity"] },
    { text: "Escuchar un álbum nuevo entero", tags: ["creativity"] },

    // Comfort Zone
    { text: "Ducharse con agua fría", tags: ["comfort"] },
    { text: "Hablar con alguien nuevo", tags: ["comfort"] },
    { text: "Aprender una palabra rara", tags: ["comfort"] },
    { text: "Cocinar algo nuevo", tags: ["comfort"] }
];

/* --- ELEMENTS --- */
const onboardingView = document.getElementById('onboarding');
const mainAppView = document.getElementById('mainApp');

// Inputs
const userNameInput = document.getElementById('userName');
const tagSelector = document.getElementById('tagSelector');

// Display
const greeting = document.getElementById('greeting');
const dateBadge = document.getElementById('dateBadge');
const missionList = document.getElementById('missionList');
const allCompleteMessage = document.getElementById('allCompleteMessage');
const btnReset = document.getElementById('btnReset');

/* --- STATE MANAGEMENT --- */
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || null;

/* --- INIT --- */
function init() {
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

    // Tag Selection Logic
    const tagButtons = tagSelector.querySelectorAll('.tag');
    tagButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
        });
    });

    // Enter key on input to go next
    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') goToStep2();
    });
}

// Step 1 -> Step 2
const btnToStep2 = document.getElementById('btnToStep2');
if (btnToStep2) {
    btnToStep2.addEventListener('click', goToStep2);
}

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

// Step 2 -> Step 1
const btnBackToStep1 = document.getElementById('btnBackToStep1');
if (btnBackToStep1) {
    btnBackToStep1.addEventListener('click', () => {
        document.getElementById('step2').classList.remove('active-step');
        document.getElementById('step2').classList.add('hidden-step');

        setTimeout(() => {
            document.getElementById('step1').classList.remove('hidden-step');
            document.getElementById('step1').classList.add('active-step');
        }, 100);
    });
}

// Step 2 -> Finish
const btnFinishSetup = document.getElementById('btnFinishSetup');
if (btnFinishSetup) {
    btnFinishSetup.addEventListener('click', finishSetup);
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

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

class Random {
    constructor(seed) {
        this.state = seed;
    }
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
        if (!array.length) return null;
        return array[Math.floor(this.next() * array.length)];
    }
}

function getMissionsForDay() {
    const today = getTodayString();
    let seed = 0;
    for (let i = 0; i < today.length; i++) {
        seed = ((seed << 5) - seed) + today.charCodeAt(i);
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
        for (let i = 0; i < 20; i++) {
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

/* --- RESET --- */
btnReset.addEventListener('click', () => {
    if (confirm('¿Reiniciar tu perfil y empezar de cero?')) {
        localStorage.removeItem('userProfile');
        location.reload();
    }
});

// Run
init();
