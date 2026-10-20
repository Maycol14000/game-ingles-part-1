/*
 * Minijuego: Hangman (ahorcado)
 * Adivinar palabras en inglés letra por letra con la traducción como pista.
 * Se puede jugar con los botones o con el teclado físico.
 */

const HM_ROUNDS = 5;        // palabras por partida
const HM_MAX_ERRORS = 6;    // errores permitidos por palabra
let hm = null;

// Crea una partida; solo usa palabras formadas por letras (sin espacios ni símbolos).
function initHangman() {
    const palabras = CATS[currentCat || 'Inicial'].pool
        .map(p => ({ word: p[0].replace(/^to /, '').toLowerCase(), hint: p[1] }))
        .filter(p => /^[a-z]+$/.test(p.word));
    hm = { items: shuffle(palabras).slice(0, HM_ROUNDS), i: 0, won: 0, word: '', used: new Set(), errors: 0, over: false };
    $('hm-again').classList.add('hidden');
    renderHM();
}

// Prepara la palabra actual y genera el teclado en pantalla.
function renderHM() {
    if (hm.i >= hm.items.length) return endHM();
    const item = hm.items[hm.i];
    Object.assign(hm, { word: item.word, used: new Set(), errors: 0, over: false });
    $('hm-hint').textContent = `Pista: significa "${item.hint}"`;
    $('hm-msg').textContent = '';
    $('hm-msg').className = 'feedback';
    const teclado = $('hm-keys');
    teclado.innerHTML = '';
    'abcdefghijklmnopqrstuvwxyz'.split('').forEach(letra => {
        const b = document.createElement('button');
        b.className = 'hm-key';
        b.textContent = letra;
        b.dataset.letter = letra;
        b.addEventListener('click', () => guessHM(letra));
        teclado.appendChild(b);
    });
    updateHM();
}

// Refresca estadísticas, palabra oculta y dibujo.
function updateHM() {
    $('hm-stats').textContent = `Palabra ${hm.i + 1}/${hm.items.length} | Aciertos: ${hm.won} | Errores: ${hm.errors}/${HM_MAX_ERRORS}`;
    $('hm-word').textContent = hm.word.split('').map(l => (hm.used.has(l) || hm.over) ? l : '_').join(' ');
    dibujarHorca(hm.errors);
}

// Procesa una letra: marca la tecla, cuenta errores y resuelve victoria o derrota.
function guessHM(letra) {
    if (!hm || hm.over || hm.used.has(letra)) return;
    hm.used.add(letra);
    const acierto = hm.word.includes(letra);
    const tecla = document.querySelector(`#hm-keys [data-letter="${letra}"]`);
    tecla.disabled = true;
    tecla.classList.add(acierto ? 'ok' : 'no');
    if (!acierto) hm.errors++;

    const completa = hm.word.split('').every(l => hm.used.has(l));
    if (completa || hm.errors >= HM_MAX_ERRORS) {
        hm.over = true;
        if (completa) { hm.won++; recompensar(8, 6); }
        $('hm-msg').textContent = completa ? 'Palabra completada. +8 monedas, +6 XP' : `Perdiste. La palabra era "${hm.word}"`;
        $('hm-msg').className = 'feedback ' + (completa ? 'ok' : 'bad');
        document.querySelectorAll('#hm-keys .hm-key').forEach(b => b.disabled = true);
        const partida = hm;
        setTimeout(() => { if (hm === partida) { hm.i++; renderHM(); } }, 1600);
    }
    updateHM();
}

// Dibuja la horca y las partes del cuerpo según el número de errores.
function dibujarHorca(errores) {
    const c = $('hmCanvas').getContext('2d');
    const linea = (x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
    c.clearRect(0, 0, 220, 240);
    c.strokeStyle = '#333';
    c.lineWidth = 4;
    c.lineCap = 'round';
    linea(20, 225, 120, 225);   // base
    linea(50, 225, 50, 20);     // poste
    linea(50, 20, 140, 20);     // viga
    linea(140, 20, 140, 45);    // cuerda
    if (errores > 0) { c.beginPath(); c.arc(140, 62, 17, 0, Math.PI * 2); c.stroke(); }  // cabeza
    if (errores > 1) linea(140, 79, 140, 140);    // torso
    if (errores > 2) linea(140, 92, 115, 120);    // brazo izquierdo
    if (errores > 3) linea(140, 92, 165, 120);    // brazo derecho
    if (errores > 4) linea(140, 140, 118, 180);   // pierna izquierda
    if (errores > 5) linea(140, 140, 162, 180);   // pierna derecha
}

// Cierra la partida y muestra el resultado.
function endHM() {
    $('hm-keys').innerHTML = '';
    $('hm-hint').textContent = 'Resultado final';
    $('hm-word').textContent = '';
    $('hm-msg').textContent = `${hm.won}/${hm.items.length} palabras adivinadas.`;
    $('hm-msg').className = 'feedback ok';
    $('hm-again').classList.remove('hidden');
}

$('abrir-hangman').addEventListener('click', () => {
    showScreen('hangman-screen');
    initHangman();
});
$('hm-again').addEventListener('click', initHangman);
$('btn-exit-hangman').addEventListener('click', () => {
    hm = null;
    showScreen('main-app-screen');
});
document.addEventListener('keydown', e => {
    if (hm && $('hangman-screen').classList.contains('active') && /^[a-z]$/i.test(e.key)) guessHM(e.key.toLowerCase());
});
