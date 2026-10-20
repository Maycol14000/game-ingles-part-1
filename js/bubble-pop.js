/*
 * Minijuego: Bubble Pop
 * Explotar la burbuja con la traducción correcta antes de que salga de la pantalla.
 */

let bp = null;
const BP_W = 500, BP_H = 350;
let bpCtx = null;

// Crea una partida con 3 vidas y lanza la primera oleada.
function initBubblePop() {
    const cat = currentCat || 'Inicial';
    bp = {
        cat,
        bubbles: [],
        score: 0,
        lives: 3,
        wave: 0,
        running: true,
        transitioning: false
    };
    bpCtx = $('bpCanvas').getContext('2d');
    $('bp-msg').textContent = 'Toca la burbuja con la traducción correcta.';
    $('bp-msg').className = 'feedback';
    updateBPStats();
    nextBPWave();
    requestAnimationFrame(bpLoop);
}

// Genera una oleada: una burbuja correcta y tres distractores que suben por la pantalla.
function nextBPWave() {
    if (!bp || !bp.running) return;
    bp.wave++;
    bp.transitioning = false;

    const pool = CATS[bp.cat].pool;
    const shuffled = shuffle([...pool]);
    const target = shuffled[0];
    const distractors = shuffled.slice(1, 4);
    bp.targetWord = target[0];
    bp.prompt = target[1];

    const words = [target[0], ...distractors.map(d => d[0])];
    bp.bubbles = shuffle(words).map((w, i) => ({
        word: w,
        correct: w === target[0],
        x: 65 + (i % 4) * 115,
        y: BP_H + 40 + Math.random() * 60,
        vy: 1 + Math.random() * 0.5,
        r: 36 + Math.random() * 4,
        popped: false
    }));

    $('bp-prompt').innerHTML = `Explota la burbuja que significa: <strong>"${bp.prompt}"</strong>`;
    updateBPStats();
}

// Muestra puntos y vidas.
function updateBPStats() {
    if (!bp) return;
    $('bp-stats').textContent = `Puntos: ${bp.score} · Vidas: ${bp.lives}/3`;
}

// Bucle de animación: mueve las burbujas y descuenta una vida si la correcta se escapa.
function bpLoop() {
    if (!bp || !bp.running) return;
    const ctx = bpCtx;
    ctx.clearRect(0, 0, BP_W, BP_H);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 12; i++) {
        const px = (i * 97 + (Date.now() / 40)) % BP_W;
        const py = BP_H - ((Date.now() / 25 + i * 80) % (BP_H + 60));
        ctx.beginPath();
        ctx.arc(px, py, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
    }

    bp.bubbles.forEach(b => {
        if (b.popped) return;
        b.y -= b.vy;
        drawBubble(ctx, b);
    });
    const target = bp.bubbles.find(b => b.correct);
    if (target && !target.popped && target.y + target.r < 0 && !bp.transitioning) {
        bp.lives--;
        updateBPStats();
        showBPMsg('¡La correcta se escapó!', 'bad');
        if (bp.lives <= 0) { endBubblePop(); return; }
        bp.transitioning = true;
        setTimeout(() => { if (bp && bp.running) nextBPWave(); }, 900);
    }

    requestAnimationFrame(bpLoop);
}

// Dibuja una burbuja con su palabra.
function drawBubble(ctx, b) {
    const grad = ctx.createRadialGradient(
        b.x - b.r / 3, b.y - b.r / 3, b.r / 4,
        b.x, b.y, b.r
    );
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.4, 'rgba(180,220,255,0.7)');
    grad.addColorStop(1, 'rgba(100,180,240,0.55)');
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#1a4a7a';
    ctx.font = 'bold 13px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.word, b.x, b.y);
}

// Detecta qué burbuja se tocó y aplica acierto o error.
function bpClick(e) {
    if (!bp || !bp.running || bp.transitioning) return;
    const rect = e.target.getBoundingClientRect();
    const scaleX = BP_W / rect.width;
    const scaleY = BP_H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (const b of bp.bubbles) {
        if (b.popped) continue;
        if (Math.hypot(mx - b.x, my - b.y) <= b.r) {
            b.popped = true;
            if (b.correct) {
                bp.score += 10;
                save.coins += 2; save.xp += 2;
                persist(); updateStats(); updateBPStats();
                showBPMsg('¡Correcto! +10 pts', 'ok');
                bp.transitioning = true;
                setTimeout(() => { if (bp && bp.running) nextBPWave(); }, 600);
            } else {
                bp.lives--;
                updateBPStats();
                showBPMsg('Esa no era...', 'bad');
                if (bp.lives <= 0) endBubblePop();
            }
            return;
        }
    }
}

// Muestra un mensaje de estado.
function showBPMsg(txt, cls) {
    $('bp-msg').textContent = txt;
    $('bp-msg').className = 'feedback ' + cls;
}

// Termina la partida y vuelve al menú tras mostrar la puntuación.
function endBubblePop() {
    if (!bp) return;
    bp.running = false;
    showBPMsg(`¡Fin del juego! Puntuación final: ${bp.score}`, '');
    setTimeout(() => {
        if ($('bubblepop-screen').classList.contains('active')) showScreen('main-app-screen');
    }, 2500);
}

$('abrir-bubblepop').addEventListener('click', () => {
    showScreen('bubblepop-screen');
    initBubblePop();
});
$('btn-exit-bubblepop').addEventListener('click', () => {
    if (bp) bp.running = false;
    bp = null;
    showScreen('main-app-screen');
});
$('bpCanvas').addEventListener('pointerdown', bpClick);
