# Motor de Inferencia Lógica como Servicio

Servicio web que expone un motor de inferencia simbólica mediante una API REST. Permite ejecutar consultas sobre una base de conocimiento escrita en Prolog a través de endpoints HTTP, integrando programación lógica, funcional y asíncrona.

Desarrollado para la materia **Teoría de Lenguajes de Programación**.

## Prerrequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)

## Instalación

```bash
git clone https://github.com/Herbert-Espejo/Motor-de-Inferencia-Logica-como-Servicio.git
cd Motor-de-Inferencia-Logica-como-Servicio
npm install
```

## Ejecución

```bash
# Producción
npm start

# Desarrollo (reinicio automático al guardar)
npm run dev
```

El servidor quedará disponible en `http://localhost:3000`.

## Uso

### Interfaz web

Abre `http://localhost:3000` en tu navegador. Desde ahí puedes escribir consultas Prolog, ver los hechos cargados y revisar los resultados en formato JSON.

### Ejemplo con curl

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "penalty_applicable(X)."}'
```

Respuesta esperada:

```json
{
  "success": true,
  "query": "penalty_applicable(X).",
  "answers": [
    { "X": "contract1" }
  ]
}
```

## Endpoints

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| `GET` | `/` | Interfaz web |
| `GET` | `/api` | Información del servicio y consultas de ejemplo |
| `POST` | `/query` | Ejecuta una consulta Prolog. Body: `{ "query": "...", "max_solutions": 10 }` |
| `GET` | `/facts` | Lista todos los hechos de la base de conocimiento |
| `GET` | `/health` | Estado del servicio |

## Estructura del proyecto

- `src/` — servidor Express y lógica del motor de inferencia
- `public/` — interfaz web estática
- `data/` — base de conocimiento Prolog (`knowledge-base.pl`)
- `docs/` — reporte técnico del proyecto
