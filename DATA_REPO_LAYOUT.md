# Repo de datos GitHub — Checklist frente a la app

La app lee/escribe estos paths en **`VITE_GITHUB_REPO`** (el nombre del repo puede variar; importa la **estructura**).

## Árbol

```
(repositorio raíz)/
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

1. Nombre del repo en GitHub = `VITE_GITHUB_REPO`.
2. Rama por defecto = `VITE_GITHUB_BRANCH` o **`main`**.
3. Al menos un **`projects/<slug>/state.md`** con las secciones del spec (`## Status`, `## Priority`, etc.).
4. PAT de la build con scope **`repo`** sobre ese repo.

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

Si tu repo coincide con esto (incluso solo `projects/*/state.md` sin `projects.md`), **la app es compatible**.
