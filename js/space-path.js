/*
 * Minijuego: Space Path
 * Guiar la nave hasta la meta con comandos en inglés (up, down, left, right y diagonales),
 * esquivando asteroides y contra un cronómetro. Nave, meta y asteroides se dibujan con emojis. Admite repeticiones, por ejemplo "right 3".
 */

const CELL = 50, COLS = 10, ROWS = 6;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
    'up-left': [-1, -1], 'up-right': [1, -1], 'down-left': [-1, 1], 'down-right': [1, 1] };
const EMOJI = { nave: '🚀', meta: '⭐', roca: '☄️' };   // únicos emojis de la app: solo se usan en Space Path
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const canvas = $('gameCanvas'), ctx = canvas.getContext('2d');
let mision = 1, inicio, cohete, estrella, rocas = [], cola = [], timer = null;
let gameTimer = null;
let tiempoRestante = 30;

// Reinicia el cronómetro de la misión; el tiempo disponible baja 2 s por misión (mínimo 12 s).
function iniciarTemporizador() {
    detenerTemporizador();
    tiempoRestante = Math.max(12, 30 - (mision - 1) * 2);
    actualizarTimerUI();
    gameTimer = setInterval(() => {
        tiempoRestante--;
        actualizarTimerUI();
        if (tiempoRestante <= 0) {
            detenerTemporizador();
            if (timer) { clearInterval(timer); timer = null; }
            cohete = { ...inicio }; dibujar();
            $('game-msg').textContent = '¡Se acabó el tiempo! Reiniciando misión...';
            setTimeout(() => {
                if ($('game-canvas-screen').classList.contains('active')) nuevaMision();
            }, 1500);
        }
    }, 1000);
}

// Detiene el cronómetro de la misión.
function detenerTemporizador() {
    if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
}

// Muestra el tiempo restante y activa el estilo de alerta en los últimos 10 segundos.
function actualizarTimerUI() {
    const el = $('game-timer');
    if (!el) return;
    el.textContent = `Tiempo: ${tiempoRestante}s`;
    el.classList.toggle('danger', tiempoRestante <= 10);
}

// Comprueba con búsqueda en anchura que exista una ruta del inicio a la meta sin atravesar asteroides.
function hayCamino() {
    const seen = new Set([inicio.c + ',' + inicio.r]), q = [[inicio.c, inicio.r]];
    while (q.length) {
        const [c, r] = q.shift();
        if (c === estrella.c && r === estrella.r) return true;
        Object.values(DIRS).forEach(([dx, dy]) => {
            const nc = c + dx, nr = r + dy, k = nc + ',' + nr;
            if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS || seen.has(k)) return;
            if (rocas.some(o => o.c === nc && o.r === nr)) return;
            seen.add(k); q.push([nc, nr]);
        });
    }
    return false;
}

// Genera una misión con asteroides aleatorios (más cada misión) y reinicia el cronómetro.
function nuevaMision() {
    let intentos = 0;
    do {
        inicio = { c: 0, r: rand(ROWS) };
        estrella = { c: COLS - 1 - rand(2), r: rand(ROWS) };
        rocas = [];
        const n = Math.min(3 + mision, 14);
        while (rocas.length < n) {
            const o = { c: 1 + rand(COLS - 2), r: rand(ROWS) };
            if (!(o.c === estrella.c && o.r === estrella.r) && !rocas.some(x => x.c === o.c && x.r === o.r)) rocas.push(o);
        }
    } while (!hayCamino() && ++intentos < 200);
    cohete = { ...inicio }; cola = []; mostrarCola();
    $('game-msg').textContent = `Misión ${mision}: lleva la nave hasta la estrella sin chocar con los asteroides`;
    dibujar();
    iniciarTemporizador();
}

// Dibuja la cuadrícula, los asteroides, la meta y la nave con emojis centrados en cada casilla.
function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const emoji = (o, icono) => {
        ctx.font = `32px ${EMOJI_FONT}`;
        ctx.fillText(icono, o.c * CELL + CELL / 2, o.r * CELL + CELL / 2 + 2);
    };
    rocas.forEach(o => emoji(o, EMOJI.roca));
    emoji(estrella, EMOJI.meta);
    emoji(cohete, EMOJI.nave);
}

// Convierte el texto de comandos en una lista de direcciones; devuelve un error si algún comando no es válido.
function parsear(txt) {
    const cmds = [];
    for (const raw of txt.toLowerCase().split(/[,;]+/)) {
        const t = raw.trim(); if (!t) continue;
        const m = t.match(/^(?:diagonal[- ])?(up|down|left|right)(?:[- ]+(up|down|left|right))?(?:\s*x?(\d+))?$/);
        let key = m && m[1];
        if (m && m[2]) {
            const v = [m[1], m[2]].find(x => x === 'up' || x === 'down');
            const h = [m[1], m[2]].find(x => x === 'left' || x === 'right');
            key = v && h ? v + '-' + h : null;
        }
        if (!key) return { error: `No entiendo "${t}". Prueba: up, down, left, right, diagonal-up-right...` };
        for (let k = 0; k < Math.min(+m[3] || 1, 10); k++) cmds.push(key);
    }
    return { cmds };
}

// Ejecuta los comandos paso a paso y resuelve choques, salidas del mapa y llegada a la meta.
function lanzar(res) {
    if (timer) return;
    if (res.error) { $('game-msg').textContent = '' + res.error; return; }
    if (!res.cmds.length) { $('game-msg').textContent = 'Escribe al menos una dirección.'; return; }
    cohete = { ...inicio }; dibujar();
    let i = 0;
    const fallo = msg => {
        clearInterval(timer); timer = null;
        $('game-msg').textContent = msg;
        setTimeout(() => { cohete = { ...inicio }; dibujar(); }, 900);
    };
    timer = setInterval(() => {
        if (i >= res.cmds.length) return fallo('Tus comandos terminaron antes de llegar a la estrella. ¡Inténtalo otra vez!');
        const [dx, dy] = DIRS[res.cmds[i++]];
        cohete.c += dx; cohete.r += dy;
        if (cohete.c < 0 || cohete.r < 0 || cohete.c >= COLS || cohete.r >= ROWS) return fallo('Saliste del mapa.');
        dibujar();
        if (rocas.some(o => o.c === cohete.c && o.r === cohete.r)) return fallo('¡Chocaste con un asteroide!');
        if (cohete.c === estrella.c && cohete.r === estrella.r) {
        clearInterval(timer); timer = null;
        detenerTemporizador();
        const bonus = Math.floor(tiempoRestante / 3);
        const coins = 15 + bonus;
        const xp = 10 + bonus;
        save.coins += coins; save.xp += xp; persist(); updateStats();
        $('game-msg').textContent = `¡Misión ${mision} completada! +${coins} monedas +${xp} XP (bonus tiempo +${bonus})`;
        mision++;
        setTimeout(() => {
            if ($('game-canvas-screen').classList.contains('active')) nuevaMision();
        }, 1600);
        }
    }, 350);
}

// Muestra en pantalla la trayectoria armada con los botones.
function mostrarCola() { $('comando-actual').textContent = 'Trayectoria: ' + cola.join(' → '); }

$('abrir-graphwar').addEventListener('click', () => {
    showScreen('game-canvas-screen');
    nuevaMision();
});
$('btn-exit-game').addEventListener('click', () => {
    clearInterval(timer); timer = null;
    detenerTemporizador();
    showScreen('main-app-screen');
});
$('btn-fire-text').addEventListener('click', () => lanzar(parsear($('command-input').value)));
$('command-input').addEventListener('keypress', e => { if (e.key === 'Enter') lanzar(parsear($('command-input').value)); });
document.querySelectorAll('.dir-btn[data-dir]').forEach(b => b.addEventListener('click', () => {
    if (cola.length < 30) { cola.push(b.dataset.dir); mostrarCola(); }
}));
$('btn-fire-pad').addEventListener('click', () => lanzar(parsear(cola.join(','))));
$('btn-clear-pad').addEventListener('click', () => { cola = []; mostrarCola(); });

$('toggle-input-mode').addEventListener('change', e => {
    $('text-input-mode').classList.toggle('hidden', e.target.checked);
    $('btn-input-mode').classList.toggle('hidden', !e.target.checked);
});
