/*
 * Niveles de aprendizaje
 * Tres rutas (Inicial, Intermedio y Avanzado) de 50 niveles. Cada nivel genera 5 ejercicios
 * a partir de un banco de vocabulario y otorga estrellas, monedas y XP.
 * Para ampliar el contenido, agregar pares "inglés|español" a los bancos de CATS.
 */

// Bancos de vocabulario y tipos de ejercicio de cada ruta
const CATS = {
    Inicial: {
        types: ['en2es', 'es2en', 'en2es', 'type', 'es2en'],
        pool: `red|rojo,blue|azul,green|verde,yellow|amarillo,black|negro,white|blanco,one|uno,two|dos,three|tres,four|cuatro,five|cinco,cat|gato,dog|perro,bird|pájaro,fish|pez,horse|caballo,mother|madre,father|padre,brother|hermano,sister|hermana,apple|manzana,bread|pan,water|agua,milk|leche,rice|arroz,house|casa,school|escuela,book|libro,table|mesa,chair|silla,sun|sol,moon|luna,star|estrella,rocket|cohete,up|arriba,down|abajo,left|izquierda,right|derecha,hello|hola,goodbye|adiós,friend|amigo`
    },
    Intermedio: {
        types: ['en2es', 'type', 'es2en', 'type', 'en2es'],
        pool: `to eat|comer,to drink|beber,to run|correr,to walk|caminar,to sleep|dormir,to read|leer,to write|escribir,to speak|hablar,to listen|escuchar,to open|abrir,to close|cerrar,to buy|comprar,to sell|vender,to play|jugar,to work|trabajar,to study|estudiar,to travel|viajar,to cook|cocinar,always|siempre,never|nunca,sometimes|a veces,tomorrow|mañana,yesterday|ayer,today|hoy,because|porque,but|pero,airport|aeropuerto,street|calle,weather|clima,hungry|hambriento,tired|cansado,happy|feliz,sad|triste,cheap|barato,expensive|caro,near|cerca,far|lejos,early|temprano,late|tarde`
    },
    Avanzado: {
        types: ['type', 'es2en', 'type', 'type', 'en2es'],
        pool: `although|aunque,however|sin embargo,achieve|lograr,improve|mejorar,challenge|desafío,knowledge|conocimiento,environment|medio ambiente,development|desarrollo,behavior|comportamiento,experience|experiencia,opportunity|oportunidad,responsibility|responsabilidad,government|gobierno,society|sociedad,research|investigación,decision|decisión,relationship|relación,available|disponible,reliable|confiable,necessary|necesario,enough|suficiente,throughout|a lo largo de,struggle|luchar,overcome|superar,afford|permitirse,deadline|fecha límite,requirement|requisito,benefit|beneficio,strength|fortaleza,weakness|debilidad,increase|aumentar,reduce|reducir,achievement|logro,skill|habilidad,goal|meta,effort|esfuerzo`
    }
};
Object.values(CATS).forEach(c => c.pool = c.pool.split(',').map(p => p.split('|')));

const gridNiveles = $('grid-50-niveles'), tituloCategoria = $('titulo-categoria-actual');

// Dibuja la cuadrícula de 50 niveles de una ruta; marca los completados y bloquea los siguientes.
function renderLevels(cat) {
    currentCat = cat;
    const prog = save.progress[cat];
    const hechos = Object.keys(prog).length;
    tituloCategoria.textContent = `Niveles: ${cat} · ${hechos}/50 completados`;
    tituloCategoria.classList.remove('hidden');
    gridNiveles.innerHTML = "";
    for (let i = 1; i <= 50; i++) {
        const stars = prog[i] || 0, unlocked = i === 1 || prog[i - 1];
        const b = document.createElement('div');
        b.className = 'level-bubble' + (stars === 3 ? ' gold' : stars ? ' done' : unlocked ? '' : ' locked');
        b.textContent = i;
        b.title = stars ? `${stars} de 3 estrellas` : unlocked ? 'Jugar' : 'Completa el nivel anterior';
        if (unlocked) b.addEventListener('click', () => startLevel(cat, i));
        gridNiveles.appendChild(b);
    }
}
document.querySelectorAll('.btn-category').forEach(btn =>
    btn.addEventListener('click', e => renderLevels(e.target.getAttribute('data-category'))));

// Genera las 5 preguntas de un nivel a partir del banco de vocabulario de la ruta.
function buildQuestions(cat, n) {
    const { pool, types } = CATS[cat];
    return types.map((t, k) => {
        const w = pool[((n - 1) * 3 + k) % pool.length];
        const ans = t === 'en2es' ? w[1] : w[0];
        const prompt = t === 'en2es' ? `¿Qué significa "${w[0]}"?`
            : t === 'es2en' ? `¿Cómo se dice "${w[1]}" en inglés?`
            : `Escribe en inglés: "${w[1]}"`;
        let opts = null;
        if (t !== 'type') {
            const wrong = shuffle(pool.filter(p => p !== w)).slice(0, 3).map(p => t === 'en2es' ? p[1] : p[0]);
            opts = shuffle([ans, ...wrong]);
        }
        return { prompt, ans, opts };
    });
}

// Inicia un nivel y muestra su primer ejercicio.
function startLevel(cat, n) {
    lvl = { cat, n, qs: buildQuestions(cat, n), i: 0, score: 0, answered: false };
    $('lvl-title').textContent = `${cat} · Nivel ${n}`;
    $('reward-modal').classList.add('hidden');
    showScreen('level-screen');
    renderQ();
}

// Muestra el ejercicio actual (opciones o campo de texto).
function renderQ() {
    const q = lvl.qs[lvl.i];
    lvl.answered = false;
    $('lvl-bar').style.width = (lvl.i / lvl.qs.length * 100) + '%';
    $('lvl-count').textContent = `Ejercicio ${lvl.i + 1}/${lvl.qs.length} · Aciertos: ${lvl.score}`;
    $('lvl-prompt').textContent = q.prompt;
    $('lvl-feedback').textContent = ''; $('lvl-feedback').className = 'feedback';
    $('btn-next').classList.add('hidden');
    const box = $('lvl-answer'); box.innerHTML = '';
    if (q.opts) {
        q.opts.forEach(o => {
            const b = document.createElement('button');
            b.className = 'opt-btn'; b.textContent = o;
            b.addEventListener('click', () => answer(o));
            box.appendChild(b);
        });
    } else {
        box.innerHTML = '<input type="text" id="lvl-input" placeholder="Escribe aquí..." autocomplete="off"><br><button class="btn-primary" id="btn-check">Comprobar</button>';
        $('btn-check').addEventListener('click', () => answer($('lvl-input').value));
        $('lvl-input').addEventListener('keypress', e => { if (e.key === 'Enter') answer($('lvl-input').value); });
        $('lvl-input').focus();
    }
}

const norm = s => s.toLowerCase().trim().replace(/^to /, '').replace(/\s+/g, ' ');

// Valida la respuesta, actualiza el puntaje y muestra la retroalimentación.
function answer(val) {
    if (lvl.answered) return;
    lvl.answered = true;
    const q = lvl.qs[lvl.i], ok = norm(val) === norm(q.ans);
    if (ok) lvl.score++;
    $('lvl-feedback').textContent = ok ? '¡Correcto!' : `La respuesta era: ${q.ans}`;
    $('lvl-feedback').className = 'feedback ' + (ok ? 'ok' : 'bad');
    document.querySelectorAll('.opt-btn').forEach(b => {
        b.disabled = true;
        if (b.textContent === q.ans) b.classList.add('correct');
        else if (b.textContent === val) b.classList.add('wrong');
    });
    const inp = $('lvl-input'); if (inp) inp.disabled = true;
    const last = lvl.i === lvl.qs.length - 1;
    $('btn-next').textContent = last ? 'Ver resultado' : 'Siguiente';
    $('btn-next').classList.remove('hidden');
}

$('btn-next').addEventListener('click', () => {
    if (lvl.i < lvl.qs.length - 1) { lvl.i++; renderQ(); } else finishLevel();
});
$('btn-exit-level').addEventListener('click', () => { showScreen('main-app-screen'); renderLevels(lvl.cat); });
// Muestra la ventana de resultado con las recompensas obtenidas.
function showModal(icon, title, lines, mainText, mainFn) {
    $('rw-icon').textContent = icon;
    $('rw-title').textContent = title;
    $('rw-body').innerHTML = lines.map(l => `<p>${l}</p>`).join('');
    $('rw-main').textContent = mainText;
    $('rw-main').onclick = mainFn;
    $('rw-map').onclick = () => { $('reward-modal').classList.add('hidden'); showScreen('main-app-screen'); renderLevels(lvl.cat); };
    $('reward-modal').classList.remove('hidden');
}

// Calcula estrellas, monedas y XP al terminar un nivel y guarda el progreso.
function finishLevel() {
    const { cat, n, score } = lvl;
    const stars = score === 5 ? 3 : score === 4 ? 2 : score === 3 ? 1 : 0;
    $('lvl-bar').style.width = '100%';
    if (!stars) {
        showModal('', '¡Casi!', [`Acertaste ${score}/5.`, 'Necesitas al menos 3 para pasar.'], 'Reintentar', () => startLevel(cat, n));
        return;
    }
    const prog = save.progress[cat], primera = !prog[n];
    prog[n] = Math.max(prog[n] || 0, stars);
    let coins = 5 + stars * 5, xp = 10 + stars * 5;
    if (!primera) { coins = Math.floor(coins / 2); xp = Math.floor(xp / 2); }
    const extras = [];
    if (primera && n % 10 === 0) { coins += 50; extras.push(`¡Cofre del nivel ${n}! +50 monedas`); }
    const antes = playerLevel();
    save.xp += xp; save.coins += coins;
    if (playerLevel() > antes) { save.coins += 25; extras.push(`¡Subiste al nivel ${playerLevel()} de jugador! +25 monedas`); }
    if (primera && n === 50) extras.push(`¡Completaste toda la ruta ${cat}!`);
    persist(); updateStats();
    const sig = n < 50 ? () => startLevel(cat, n + 1) : () => { $('rw-map').click(); };
    showModal('★'.repeat(stars), '¡Nivel superado!',
        [`${score}/5 aciertos`, `+${coins} monedas · +${xp} XP`, ...extras],
        n < 50 ? 'Siguiente nivel' : 'Volver al mapa', sig);
}
