/*
 * Minijuego: Final Sentence
 * Completar oraciones eligiendo la palabra correcta antes de que termine el tiempo.
 */

const FS_TIME = 15;     // segundos por pregunta
const FS_ROUNDS = 8;    // preguntas por partida

// Formato de cada línea: oración con ___ | respuesta | distractores
const FS_BANK = {
    Inicial: `She ___ my sister.|is|am,are,have;
        The sky is ___.|blue|eat,run,table;
        I drink ___ every day.|water|chair,run,red;
        We ___ to school.|go|eats,is,reads;
        I ___ a cat.|have|is,are,goes;
        Two plus two is ___.|four|red,cat,milk;
        The dog is ___ the table.|under|eat,blue,happy;
        Good ___, mom!|morning|apple,run,blue`,
    Intermedio: `Yesterday I ___ to the market.|went|go,going,goes;
        She ___ studying right now.|is|are,do,have;
        I have ___ been to Cusco.|never|yesterday,tomorrow,because;
        He is ___ than his brother.|taller|tall,tallest,more tall;
        I usually ___ up at six.|wake|woke,waking,wakes;
        If it rains, we ___ at home.|will stay|stayed,staying,stays;
        This book is ___ interesting than that one.|more|most,much,many;
        I am ___ because I did not sleep.|tired|cheap,early,far`,
    Avanzado: `She has lived here ___ 2015.|since|for,during,from;
        I wish I ___ more time.|had|have,has,will have;
        Despite ___ tired, he finished the report.|being|be,been,was;
        The manager asked me to ___ the deadline.|meet|meeting,met,meets;
        By next year, I ___ my degree.|will have finished|finish,finished,am finishing;
        He suggested ___ earlier.|leaving|to leave,left,leaves;
        Not only ___ late, but he also forgot the files.|was he|he was,is he,he is;
        The results were ___ better than expected.|much|very,many,more`
};
Object.keys(FS_BANK).forEach(k => {
    FS_BANK[k] = FS_BANK[k].split(';').map(fila => {
        const [s, a, w] = fila.trim().split('|');
        return { s, a, w: w.split(',') };
    });
});

let fs = null;

// Crea una partida nueva con preguntas al azar de la ruta actual.
function initFinalSentence() {
    stopFinalSentence();
    fs = { items: shuffle([...FS_BANK[currentCat || 'Inicial']]).slice(0, FS_ROUNDS), i: 0, score: 0, left: FS_TIME, timer: null, answered: false };
    $('fs-again').classList.add('hidden');
    renderFS();
}

// Detiene el cronómetro de la partida en curso.
function stopFinalSentence() {
    if (fs) clearInterval(fs.timer);
}

// Muestra la oración actual y arranca su cronómetro.
function renderFS() {
    if (fs.i >= fs.items.length) return endFS();
    const q = fs.items[fs.i];
    fs.answered = false;
    fs.left = FS_TIME;
    $('fs-stats').textContent = `Pregunta ${fs.i + 1}/${fs.items.length} | Aciertos: ${fs.score}`;
    $('fs-sentence').innerHTML = esc(q.s).replace('___', '<span class="blank"></span>');
    $('fs-msg').textContent = '';
    $('fs-msg').className = 'feedback';
    crearOpciones($('fs-options'), shuffle([q.a, ...q.w]), answerFS);
    tickFS();
    clearInterval(fs.timer);
    fs.timer = setInterval(() => {
        fs.left--;
        tickFS();
        if (fs.left <= 0) answerFS(null);
    }, 1000);
}

// Actualiza la barra y el texto del cronómetro.
function tickFS() {
    $('fs-bar').style.width = (fs.left / FS_TIME * 100) + '%';
    $('fs-bar').classList.toggle('danger', fs.left <= 5);
    $('fs-time').textContent = `Tiempo: ${fs.left}s`;
    $('fs-time').classList.toggle('danger', fs.left <= 5);
}

// Evalúa la respuesta (null indica que se agotó el tiempo) y pasa a la siguiente pregunta.
function answerFS(val) {
    if (!fs || fs.answered) return;
    fs.answered = true;
    clearInterval(fs.timer);
    const q = fs.items[fs.i], ok = val === q.a;
    if (ok) fs.score++;
    marcarOpciones($('fs-options'), q.a, val);
    $('fs-msg').textContent = ok ? 'Correcto' : val === null ? `Tiempo agotado. Respuesta: ${q.a}` : `Incorrecto. Respuesta: ${q.a}`;
    $('fs-msg').className = 'feedback ' + (ok ? 'ok' : 'bad');
    const partida = fs;
    setTimeout(() => { if (fs === partida) { fs.i++; renderFS(); } }, 1200);
}

// Cierra la partida, entrega la recompensa y ofrece jugar de nuevo.
function endFS() {
    const coins = fs.score * 4;
    const xp = fs.score * 3 + (fs.score === fs.items.length ? 10 : 0);
    const subio = recompensar(coins, xp);
    $('fs-sentence').textContent = 'Resultado final';
    $('fs-options').innerHTML = '';
    $('fs-time').textContent = '';
    $('fs-msg').textContent = `${fs.score}/${fs.items.length} aciertos. +${coins} monedas, +${xp} XP` + (subio ? '. Subiste de nivel.' : '');
    $('fs-msg').className = 'feedback ok';
    $('fs-again').classList.remove('hidden');
}

$('abrir-finalsentence').addEventListener('click', () => {
    showScreen('finalsentence-screen');
    initFinalSentence();
});
$('fs-again').addEventListener('click', initFinalSentence);
$('btn-exit-finalsentence').addEventListener('click', () => {
    stopFinalSentence();
    fs = null;
    showScreen('main-app-screen');
});
