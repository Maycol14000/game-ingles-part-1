/*
 * Núcleo de la aplicación
 * Estado global, utilidades, progreso del jugador, sesión, ranking y navegación.
 */

// Estado global
let userName = '';
let selectedAvatarSrc = '';
let save = { xp: 0, coins: 0, progress: {} };
let currentCat = null;   // ruta de niveles seleccionada
let lvl = null;          // nivel en curso

const SAVE_PREFIX = 'ea_save_';
const XP_PER_LEVEL = 100;
const CATEGORIES = ['Inicial', 'Intermedio', 'Avanzado'];

// Utilidades
const $ = id => document.getElementById(id);
const appContainer = $('app-container');
const toggleViewBtn = $('toggle-view-btn');
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const rand = n => Math.floor(Math.random() * n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Muestra una pantalla; el botón PC/Móvil solo es visible en el login y el menú principal.
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
    toggleViewBtn.classList.toggle('hidden', !['login-screen', 'main-app-screen'].includes(id));
}

// Crea los botones de opciones de una pregunta de selección múltiple.
function crearOpciones(contenedor, opciones, alElegir) {
    contenedor.innerHTML = '';
    opciones.forEach(texto => {
        const b = document.createElement('button');
        b.className = 'opt-btn';
        b.textContent = texto;
        b.addEventListener('click', () => alElegir(texto));
        contenedor.appendChild(b);
    });
}

// Bloquea las opciones y marca la correcta y la elegida.
function marcarOpciones(contenedor, correcta, elegida) {
    contenedor.querySelectorAll('.opt-btn').forEach(b => {
        b.disabled = true;
        if (b.textContent === correcta) b.classList.add('correct');
        else if (b.textContent === elegida) b.classList.add('wrong');
    });
}

// Progreso del jugador (se guarda por nombre en localStorage)
const saveKey = () => SAVE_PREFIX + userName.toLowerCase();
const playerLevel = (xp = save.xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

function loadSave() {
    save = { xp: 0, coins: 0, progress: {} };
    try { Object.assign(save, JSON.parse(localStorage.getItem(saveKey())) || {}); } catch (e) { /* datos corruptos: se parte de cero */ }
    CATEGORIES.forEach(c => save.progress[c] = save.progress[c] || {});
}

function persist() {
    save.name = userName;
    save.avatar = selectedAvatarSrc;
    try { localStorage.setItem(saveKey(), JSON.stringify(save)); } catch (e) { /* almacenamiento no disponible */ }
}

// Actualiza la barra de perfil: nivel, monedas y barra de experiencia.
function updateStats() {
    const actual = save.xp % XP_PER_LEVEL;
    $('stats-text').textContent = `Nivel ${playerLevel()} | ${save.coins} monedas`;
    $('xp-fill').style.width = (actual / XP_PER_LEVEL * 100) + '%';
    $('xp-text').textContent = `${actual}/${XP_PER_LEVEL} XP para el nivel ${playerLevel() + 1}`;
}

// Suma monedas y XP, guarda y devuelve true si el jugador subió de nivel.
function recompensar(coins, xp) {
    const antes = playerLevel();
    save.coins += coins;
    save.xp += xp;
    persist();
    updateStats();
    return playerLevel() > antes;
}

// Login, avatares y cambio de jugador
const avatars = document.querySelectorAll('.avatar-option');
selectedAvatarSrc = document.querySelector('.active-avatar').src;
avatars.forEach(avatar => avatar.addEventListener('click', e => {
    avatars.forEach(a => a.classList.remove('active-avatar'));
    e.target.classList.add('active-avatar');
    selectedAvatarSrc = e.target.src;
}));

function procesarLogin() {
    const name = $('username').value.trim();
    if (!name) { alert('Por favor ingresa tu nombre.'); return; }
    userName = name;
    loadSave();
    $('welcome-text').textContent = userName;
    $('user-avatar-display').src = selectedAvatarSrc;
    persist();
    updateStats();
    showScreen('main-app-screen');
}

function cerrarSesion() {
    persist();
    userName = '';
    currentCat = null;
    $('username').value = '';
    showScreen('login-screen');
}

$('btn-start').addEventListener('click', procesarLogin);
$('username').addEventListener('keypress', e => { if (e.key === 'Enter') procesarLogin(); });
$('btn-logout').addEventListener('click', cerrarSesion);

// Clasificación: lee todos los perfiles guardados en este navegador.
function obtenerRanking() {
    const lista = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith(SAVE_PREFIX)) continue;
        try {
            const d = JSON.parse(localStorage.getItem(key));
            const completados = CATEGORIES.reduce((n, c) => n + Object.keys((d.progress || {})[c] || {}).length, 0);
            lista.push({ key, name: d.name || key.slice(SAVE_PREFIX.length), avatar: d.avatar || '', xp: d.xp || 0, completados });
        } catch (e) { /* se ignora el perfil dañado */ }
    }
    return lista.sort((a, b) => b.xp - a.xp || b.completados - a.completados);
}

function renderRanking() {
    $('ranking-body').innerHTML = obtenerRanking().map((p, i) => `
        <tr class="${p.key === saveKey() ? 'me' : ''}">
            <td>${i + 1}</td>
            <td class="rk-name"><img src="${esc(p.avatar)}" alt="">${esc(p.name)}</td>
            <td>${playerLevel(p.xp)}</td>
            <td>${p.xp}</td>
            <td>${p.completados}/${CATEGORIES.length * 50}</td>
        </tr>`).join('');
}

// Navegación principal
const navButtons = document.querySelectorAll('.main-navbar .nav-btn');
const appSections = document.querySelectorAll('.app-section');
navButtons.forEach(btn => btn.addEventListener('click', e => {
    const target = e.currentTarget.dataset.target;
    navButtons.forEach(b => b.classList.remove('active'));
    appSections.forEach(s => s.classList.remove('active-section'));
    e.currentTarget.classList.add('active');
    $(target).classList.add('active-section');
    if (target === 'seccion-ranking') renderRanking();
}));

// Alternar vista PC / Móvil
toggleViewBtn.addEventListener('click', () => {
    const pc = appContainer.classList.contains('pc-mode');
    appContainer.classList.toggle('pc-mode', !pc);
    appContainer.classList.toggle('mobile-mode', pc);
    toggleViewBtn.textContent = pc ? 'Cambiar a PC' : 'Cambiar a Móvil';
});
