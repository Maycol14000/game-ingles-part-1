/*
 * Minijuego: Listening Quiz
 * Reproduce una palabra en inglés con la voz del navegador (Web Speech API) y el jugador
 * elige su significado o la palabra escrita. Las preguntas alternan entre ambos modos.
 */

const LQ_ROUNDS = 8;
let lq = null;

// Reproduce un texto en inglés; devuelve false si el navegador no admite síntesis de voz.
function hablar(texto) {
    if (!('speechSynthesis' in window)) return false;
    speechSynthesis.cancel();
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = 'en-US';
    voz.rate = 0.85;
    speechSynthesis.speak(voz);
    return true;
}

// Crea una partida con palabras al azar de la ruta actual.
function initListening() {
    const pool = CATS[currentCat || 'Inicial'].pool;
    lq = { pool, items: shuffle([...pool]).slice(0, LQ_ROUNDS), i: 0, score: 0, answered: false, correct: '', spoken: '' };
    $('lq-again').classList.add('hidden');
    $('lq-listen').classList.remove('hidden');
    renderLQ();
}

// Prepara la pregunta actual: modo 'es' pide el significado, modo 'en' pide la palabra escrita.
function renderLQ() {
    if (lq.i >= lq.items.length) return endLQ();
    const w = lq.items[lq.i];
    const modo = lq.i % 2 === 0 ? 'es' : 'en';
    const idx = modo === 'es' ? 1 : 0;
    const distractores = shuffle(lq.pool.filter(p => p !== w)).slice(0, 3).map(p => p[idx]);
    lq.answered = false;
    lq.correct = w[idx];
    lq.spoken = w[0].replace(/^to /, '');
    $('lq-stats').textContent = `Pregunta ${lq.i + 1}/${lq.items.length} | Aciertos: ${lq.score}`;
    $('lq-prompt').textContent = modo === 'es' ? 'Escucha y elige el significado en español.' : 'Escucha y elige la palabra que oíste.';
    $('lq-msg').textContent = '';
    $('lq-msg').className = 'feedback';
    crearOpciones($('lq-options'), shuffle([lq.correct, ...distractores]), answerLQ);
    if (!hablar(lq.spoken)) $('lq-msg').textContent = 'Este navegador no admite audio. Prueba con Chrome, Edge o Safari.';
}

// Evalúa la respuesta y avanza a la siguiente pregunta.
function answerLQ(val) {
    if (!lq || lq.answered) return;
    lq.answered = true;
    const ok = val === lq.correct;
    if (ok) lq.score++;
    marcarOpciones($('lq-options'), lq.correct, val);
    $('lq-msg').textContent = ok ? 'Correcto' : `Incorrecto. Respuesta: ${lq.correct}`;
    $('lq-msg').className = 'feedback ' + (ok ? 'ok' : 'bad');
    const partida = lq;
    setTimeout(() => { if (lq === partida) { lq.i++; renderLQ(); } }, 1300);
}

// Cierra la partida y entrega la recompensa.
function endLQ() {
    const coins = lq.score * 4;
    const xp = lq.score * 3 + (lq.score === lq.items.length ? 10 : 0);
    const subio = recompensar(coins, xp);
    $('lq-prompt').textContent = 'Resultado final';
    $('lq-options').innerHTML = '';
    $('lq-listen').classList.add('hidden');
    $('lq-msg').textContent = `${lq.score}/${lq.items.length} aciertos. +${coins} monedas, +${xp} XP` + (subio ? '. Subiste de nivel.' : '');
    $('lq-msg').className = 'feedback ok';
    $('lq-again').classList.remove('hidden');
}

$('abrir-listening').addEventListener('click', () => {
    showScreen('listening-screen');
    initListening();
});
$('lq-listen').addEventListener('click', () => { if (lq) hablar(lq.spoken); });
$('lq-again').addEventListener('click', initListening);
$('btn-exit-listening').addEventListener('click', () => {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    lq = null;
    showScreen('main-app-screen');
});
