const factsCountEl = document.getElementById('factsCount');
const examplesCountEl = document.getElementById('examplesCount');
const healthPillEl = document.getElementById('healthPill');
const healthTextEl = document.getElementById('healthText');
const engineTagEl = document.getElementById('engineTag');
const timeTagEl = document.getElementById('timeTag');
const examplesEl = document.getElementById('examples');
const queryFormEl = document.getElementById('queryForm');
const queryInputEl = document.getElementById('queryInput');
const maxSolutionsInputEl = document.getElementById('maxSolutionsInput');
const resultBoxEl = document.getElementById('resultBox');
const factsListEl = document.getElementById('factsList');
const refreshAllBtn = document.getElementById('refreshAllBtn');
const loadFactsBtn = document.getElementById('loadFactsBtn');
const clearBtn = document.getElementById('clearBtn');

const defaultResultText = 'Ejecuta una consulta para ver aquí la respuesta JSON del servicio.';

const setJson = (value) => {
  resultBoxEl.textContent = JSON.stringify(value, null, 2);
};

const setHealth = (isOk, text, engine = '--', timestamp = '--') => {
  const dot = healthPillEl.querySelector('.status-dot');
  dot.classList.remove('ok', 'error');
  dot.classList.add(isOk ? 'ok' : 'error');
  healthTextEl.textContent = text;
  engineTagEl.textContent = `Motor: ${engine}`;
  timeTagEl.textContent = `Timestamp: ${timestamp}`;
};

const loadServiceInfo = async () => {
  const response = await fetch('/api');
  if (!response.ok) {
    throw new Error('No se pudo cargar la información del servicio.');
  }

  const data = await response.json();
  const examples = Array.isArray(data.example_queries) ? data.example_queries : [];
  examplesCountEl.textContent = String(examples.length);
  examplesEl.innerHTML = '';

  examples.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'example-btn';
    button.textContent = item.query;
    button.addEventListener('click', () => {
      queryInputEl.value = item.query;
      queryInputEl.focus();
    });
    examplesEl.appendChild(button);
  });
};

const loadHealth = async () => {
  try {
    const response = await fetch('/health');
    if (!response.ok) {
      throw new Error('Respuesta inesperada del endpoint /health.');
    }

    const data = await response.json();
    setHealth(
      data.status === 'ok',
      data.status === 'ok' ? 'Servicio disponible' : 'Servicio con incidencias',
      data.engine || '--',
      data.timestamp || '--'
    );
  } catch (error) {
    setHealth(false, error.message);
  }
};

const loadFacts = async () => {
  factsListEl.innerHTML = '<li class="empty">Cargando hechos...</li>';

  try {
    const response = await fetch('/facts');
    if (!response.ok) {
      throw new Error('No se pudieron recuperar los hechos.');
    }

    const data = await response.json();
    const facts = Array.isArray(data.facts) ? data.facts : [];
    factsCountEl.textContent = String(facts.length);

    if (!facts.length) {
      factsListEl.innerHTML = '<li class="empty">No se encontraron hechos en la base de conocimiento.</li>';
      return;
    }

    factsListEl.innerHTML = '';
    facts.forEach((fact) => {
      const item = document.createElement('li');
      item.textContent = fact;
      factsListEl.appendChild(item);
    });
  } catch (error) {
    factsCountEl.textContent = '0';
    factsListEl.innerHTML = `<li class="empty">${error.message}</li>`;
  }
};

const runQuery = async (event) => {
  event.preventDefault();

  const payload = {
    query: queryInputEl.value,
    max_solutions: Number(maxSolutionsInputEl.value) || 20,
  };

  resultBoxEl.textContent = 'Consultando motor...';

  try {
    const response = await fetch('/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setJson(data);
  } catch (error) {
    setJson({
      status: 'error',
      message: 'No fue posible contactar el servicio.',
      details: error.message,
    });
  }
};

const refreshAll = async () => {
  await Promise.all([loadServiceInfo(), loadHealth(), loadFacts()]);
};

queryFormEl.addEventListener('submit', runQuery);
refreshAllBtn.addEventListener('click', refreshAll);
loadFactsBtn.addEventListener('click', loadFacts);
clearBtn.addEventListener('click', () => {
  queryInputEl.value = '';
  resultBoxEl.textContent = defaultResultText;
  queryInputEl.focus();
});

refreshAll().catch((error) => {
  setJson({
    status: 'error',
    message: 'Hubo un problema al inicializar la interfaz.',
    details: error.message,
  });
});
