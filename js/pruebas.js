/*
 * Pruebas de integridad de las preguntas
 * Se ejecutan al abrir la página con el parámetro ?test (por ejemplo index.html?test)
 * y muestran el resultado en la consola del navegador.
 */

// Valida que cada nivel genere 5 preguntas completas, con 4 opciones únicas que incluyan la respuesta.
function testearPreguntas() {
    const errores = [];
    let nivelesRevisados = 0;
    let preguntasRevisadas = 0;

    Object.keys(CATS).forEach(cat => {
        for (let n = 1; n <= 50; n++) {
            nivelesRevisados++;
            const qs = buildQuestions(cat, n);

            if (qs.length !== 5) {
                errores.push(`${cat} N${n}: se esperaban 5 preguntas y hay ${qs.length}`);
            }

            qs.forEach((q, i) => {
                preguntasRevisadas++;
                const referencia = `${cat} N${n} Q${i + 1}`;

                if (!q.prompt || !q.prompt.trim() || q.ans == null || !String(q.ans).trim()) {
                    errores.push(`${referencia}: pregunta o respuesta vacía`);
                }

                if (q.opts) {
                    if (q.opts.length !== 4) {
                        errores.push(`${referencia}: se esperaban 4 opciones y hay ${q.opts.length}`);
                    }
                    if (!q.opts.includes(q.ans)) {
                        errores.push(`${referencia}: la respuesta "${q.ans}" no está entre las opciones`);
                    }
                    if (new Set(q.opts).size !== q.opts.length) {
                        errores.push(`${referencia}: hay opciones duplicadas`);
                    }
                }
            });
        }
    });

    if (errores.length === 0) {
        console.info(`Prueba superada: ${nivelesRevisados} niveles y ${preguntasRevisadas} preguntas revisados sin errores.`);
    } else {
        console.error(`Prueba fallida: ${errores.length} problema(s) en ${nivelesRevisados} niveles y ${preguntasRevisadas} preguntas.`);
        errores.forEach(error => console.error(`${error}`));
    }
}

if (location.search.includes('test')) testearPreguntas();
