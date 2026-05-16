// ============================================================
// Motor de Inferencia Lógica como Servicio
// Paradigmas: Lógico (Prolog/Tau), Funcional (JS), Asíncrono (Node.js)
// ============================================================

const express = require('express');
const pl = require('tau-prolog');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

const KB_PATH = path.join(__dirname, 'knowledge_base.pl');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.static(PUBLIC_DIR));

const SERVICE_INFO = {
  service: 'Motor de Inferencia Lógica como Servicio',
  version: '1.0.0',
  endpoints: {
    'GET /': 'Interfaz web para visualizar y probar el motor',
    'GET /api': 'Resumen del servicio y consultas de ejemplo',
    'POST /query': 'Ejecuta una consulta Prolog sobre la base de conocimiento',
    'GET /facts': 'Lista todos los hechos cargados',
    'GET /health': 'Estado del servicio',
  },
  example_queries: [
    { query: 'penalty_applicable(contract1).' },
    { query: 'penalty_applicable(X).' },
    { query: 'at_risk(X).' },
    { query: 'valid_contract(X).' },
    { query: 'client_penalized(X).' },
    { query: 'applicable_penalty_amount(X, Y).' },
    { query: 'same_type(contract1, X).' },
  ],
};

// ============================================================
// CAPA FUNCIONAL: Funciones puras de transformación
// ============================================================

/**
 * Normaliza una consulta Prolog:
 * - Elimina espacios innecesarios
 * - Asegura que termine con punto
 */
const normalizeQuery = (raw) => {
  const trimmed = String(raw).trim();
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
};

/**
 * Formatea una respuesta de éxito de forma consistente
 */
const buildSuccessResponse = (query, answers) => ({
  status: 'ok',
  query,
  satisfiable: answers.length > 0,
  answers,
  count: answers.length,
});

/**
 * Formatea una respuesta de error de forma consistente
 */
const buildErrorResponse = (message, details = null) => ({
  status: 'error',
  message,
  ...(details && { details }),
});

/**
 * Convierte un término Prolog a representación JS legible (recursivo)
 */
const termToJS = (term) => {
  if (!term) return null;
  if (term.id === 'true') return true;
  if (term.id === 'false') return false;

  // Átomo o número
  if (term.args === undefined || term.args.length === 0) {
    return term.toJavaScript ? term.toJavaScript() : term.id;
  }

  // Estructura compuesta: functor(arg1, arg2, ...)
  return {
    functor: term.id,
    args: term.args.map(termToJS),
  };
};

// ============================================================
// MOTOR LÓGICO: Interfaz con Tau Prolog (asíncrona)
// ============================================================

/**
 * Carga la base de conocimiento y ejecuta una consulta.
 * Retorna una Promise que resuelve a un array de respuestas.
 * 
 * @param {string} kbSource  - Código Prolog de la base de conocimiento
 * @param {string} queryStr  - Consulta Prolog normalizada
 * @param {number} maxSols   - Máximo de soluciones a recuperar
 * @returns {Promise<Array>} - Lista de bindings o ["true"] si no hay variables
 */
const runPrologQuery = (kbSource, queryStr, maxSols = 20) => {
  return new Promise((resolve, reject) => {
    const session = pl.create(maxSols);

    // Paso 1: Consultar (cargar) la base de conocimiento
    session.consult(kbSource, {
      success: () => {
        // Paso 2: Lanzar la consulta
        session.query(queryStr, {
          success: () => {
            const answers = [];

            // Paso 3: Iterar sobre soluciones (lazy evaluation de Prolog)
            const getNextAnswer = () => {
              session.answer({
                // Solución encontrada
                success: (answer) => {
                  if (answer === true || (answer && answer.id === 'true')) {
                    // Consulta satisfecha sin variables libres
                    answers.push({ result: true });
                  } else {
                    // Extraer bindings de variables
                    const bindings = {};
                    if (answer && answer.links) {
                      for (const [varName, term] of Object.entries(answer.links)) {
                        bindings[varName] = termToJS(term);
                      }
                    }
                    answers.push(
                      Object.keys(bindings).length > 0 ? bindings : { result: true }
                    );
                  }

                  if (answers.length < maxSols) {
                    getNextAnswer(); // Recursión: pedir siguiente solución
                  } else {
                    resolve(answers);
                  }
                },
                // No hay más soluciones
                fail: () => resolve(answers),
                // Error durante la inferencia
                error: (err) =>
                  reject(new Error(`Prolog inference error: ${JSON.stringify(err)}`)),
                // Límite de soluciones alcanzado
                limit: () => resolve(answers),
              });
            };

            getNextAnswer();
          },
          error: (err) =>
            reject(new Error(`Query parse error: ${JSON.stringify(err)}`)),
        });
      },
      error: (err) =>
        reject(new Error(`Knowledge base load error: ${JSON.stringify(err)}`)),
    });
  });
};

// ============================================================
// ENDPOINT REST: /query
// ============================================================

/**
 * POST /query
 * Body: { "query": "<consulta prolog>", "max_solutions": <número opcional> }
 * Response: JSON con resultados de inferencia
 */
app.post('/query', async (req, res) => {
  const { query, max_solutions } = req.body;

  // Validación de entrada
  if (!query || typeof query !== 'string') {
    return res.status(400).json(
      buildErrorResponse('El campo "query" es requerido y debe ser una cadena de texto.')
    );
  }

  const maxSols = Number.isInteger(max_solutions) && max_solutions > 0
    ? Math.min(max_solutions, 100)
    : 20;

  try {
    // 1. Cargar base de conocimiento desde disco (asíncrono)
    const kbSource = await fs.readFile(KB_PATH, 'utf8');

    // 2. Normalizar consulta (funcional)
    const normalizedQuery = normalizeQuery(query);

    // 3. Ejecutar motor de inferencia (lógico + asíncrono)
    const answers = await runPrologQuery(kbSource, normalizedQuery, maxSols);

    // 4. Retornar respuesta JSON
    return res.json(buildSuccessResponse(normalizedQuery, answers));

  } catch (err) {
    console.error('[/query error]', err.message);
    return res.status(500).json(
      buildErrorResponse('Error durante la inferencia lógica.', err.message)
    );
  }
});

// ============================================================
// ENDPOINT: /facts — Lista todos los hechos de la KB
// ============================================================
app.get('/facts', async (req, res) => {
  try {
    const kbSource = await fs.readFile(KB_PATH, 'utf8');

    // Extraer líneas que son hechos (sin :-)
    const facts = kbSource
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return (
          trimmed.length > 0 &&
          !trimmed.startsWith('%') &&
          !trimmed.includes(':-') &&
          trimmed.endsWith('.')
        );
      })
      .map(line => line.trim());

    return res.json({ status: 'ok', count: facts.length, facts });
  } catch (err) {
    return res.status(500).json(buildErrorResponse('No se pudo leer la base de conocimiento.'));
  }
});

// ============================================================
// ENDPOINT: /health — Estado del servicio
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Motor de Inferencia Lógica',
    engine: 'Tau Prolog',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// ENDPOINT: /api — Resumen del servicio
// ============================================================
app.get('/api', (req, res) => {
  res.json(SERVICE_INFO);
});

// ============================================================
// INICIO DEL SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Motor de Inferencia Lógica ejecutándose en http://localhost:${PORT}`);
  console.log(`   Motor: Tau Prolog`);
  console.log(`   Base de conocimiento: ${KB_PATH}`);
  console.log(`   Endpoints disponibles:`);
  console.log(`     GET  http://localhost:${PORT}/`);
  console.log(`     GET  http://localhost:${PORT}/api`);
  console.log(`     POST http://localhost:${PORT}/query`);
  console.log(`     GET  http://localhost:${PORT}/facts`);
  console.log(`     GET  http://localhost:${PORT}/health\n`);
});
