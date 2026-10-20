/*
 * Minijuego: Word Match
 * Juego de memoria: encontrar los pares inglés-español en el menor número de movimientos.
 */

let wm = null;
const WM_PAIRS = 8;

// Crea el tablero con 8 pares inglés-español de la ruta actual.
function initWordMatch() {
    const cat = currentCat || 'Inicial';
    const pool = shuffle([...CATS[cat].pool]).slice(0, WM_PAIRS);
    const cards = [];
    pool.forEach((p, idx) => {
        cards.push({ text: p[0], pairId: idx, flipped: false, matched: false });
        cards.push({ text: p[1], pairId: idx, flipped: false, matched: false });
    });
    wm = {
        cards: shuffle(cards),
        firstIdx: null,
        lock: false,
        moves: 0,
        matched: 0,
        startTime: Date.now()
    };
    $('wm-msg').textContent = 'Encuentra los pares inglés ↔ español.';
    $('wm-msg').className = 'feedback';
    renderWM();
}

// Redibuja las tarjetas y las estadísticas del tablero.
function renderWM() {
    const grid = $('wm-grid');
    grid.innerHTML = '';
    wm.cards.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = 'wm-card';
        if (c.flipped || c.matched) {
            div.classList.add('flipped');
            div.textContent = c.text;
        }
        if (c.matched) div.classList.add('matched');
        div.addEventListener('click', () => clickWM(i));
        grid.appendChild(div);
    });
    $('wm-stats').textContent = `Movimientos: ${wm.moves} · Pares: ${wm.matched}/${WM_PAIRS}`;
}

// Voltea una tarjeta, compara pares y entrega la recompensa al completar el tablero.
function clickWM(i) {
    if (!wm || wm.lock) return;
    const card = wm.cards[i];
    if (card.flipped || card.matched) return;

    card.flipped = true;
    renderWM();

    if (wm.firstIdx === null) {
        wm.firstIdx = i;
        return;
    }

    const first = wm.cards[wm.firstIdx];
    wm.moves++;
    renderWM();

    if (first.pairId === card.pairId) {
        first.matched = true;
        card.matched = true;
        wm.matched++;
        wm.firstIdx = null;
        renderWM();

        if (wm.matched === WM_PAIRS) {
            const elapsed = Math.floor((Date.now() - wm.startTime) / 1000);
            const bonus = Math.max(0, 40 - wm.moves * 2);
            const coins = 20 + bonus;
            const xp = 15 + bonus;
            save.coins += coins; save.xp += xp;
            persist(); updateStats();
            $('wm-msg').textContent = `¡Completado en ${elapsed}s con ${wm.moves} movimientos! +${coins} monedas +${xp} XP`;
            $('wm-msg').className = 'feedback ok';
        }
    } else {
        wm.lock = true;
        const currentWm = wm;
        setTimeout(() => {
            if (wm !== currentWm) return;
            first.flipped = false;
            card.flipped = false;
            wm.firstIdx = null;
            wm.lock = false;
            renderWM();
        }, 900);
    }
}

$('abrir-wordmatch').addEventListener('click', () => {
    showScreen('wordmatch-screen');
    initWordMatch();
});
$('btn-exit-wordmatch').addEventListener('click', () => {
    wm = null;
    showScreen('main-app-screen');
});
