# Layout de datos en SQLite — Checklist frente a la app

La app lee/escribe estos paths lógicos en la tabla `files` del servidor (**no** hay repo Git detrás; importa solo la **estructura**).

## Árbol

```
(raíz virtual del almacén)/
├── projects.md              # Opcional: registro maestro
├── inbox.md                 # Opcional al inicio
├── leads.json               # Opcional; el primer lead puede crearlo la app
└── projects/
    └── <slug>/
        └── state.md         # Por cada proyecto listado
```

## Reglas

| Path | Comportamiento |
|------|----------------|
| `projects.md` | Si tiene líneas parseables (`slug \| Name` o `- slug — Name`), define slugs. |
| Sin `projects.md` útil | Listing de la carpeta `projects/` → cada directorio es un slug; debe existir `projects/<slug>/state.md`. |
| `leads.json` | `{ "leads": [ ... ] }`. Si falta, lista CRM vacía hasta el primer alta. |
| `inbox.md` | Líneas `- YYYY-MM-DD: texto`. Si falta, inbox vacío hasta el primer envío. |

## Validación rápida

1. El servidor tiene **`DATA_DIR`** (o `SQLITE_PATH`) accesible y crea **`overwatch.db`**.
2. Al menos un **`projects/<slug>/state.md`** con las secciones del spec (`## Status`, `## Priority`, etc.).
3. Opcional: semilla inicial importando contenido vía **`PUT /api/file`** o copiando una DB ya poblada al volumen.

## Plantillas mínimas (seed)

### `leads.json`

```json
{
  "leads": []
}
```

### `inbox.md`

```markdown
# INBOX

```

### `projects.md` (opcional)

```markdown
# PROJECTS

- mesa-landing — MESA LANDING
- operator — OPERATOR
- fintrack — FINTRACK
```

### `projects/<slug>/state.md`

```markdown
# PROJECT NAME

## Status
BACKLOG

## Priority
03_STANDARD

## Current Task


## Next Action


## Blocker
None

## Parking Lot


## Session Log

```

Si tu almacén coincide con esto (incluso solo `projects/*/state.md` sin `projects.md`), **la app es compatible**.
