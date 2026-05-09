# Repo de datos GitHub — Checklist frente a la app

La app lee/escribe estos paths en **`VITE_GITHUB_REPO`** (el nombre del repo puede variar; importa la **estructura**).

## Árbol

```
(repositorio raíz)/
├── projects.md              # Opcional: registro maestro
├── inbox.md                 # Opcional al inicio
├── leads.json               # Opcional; primer lead lo crea si falta
└── projects/
    └── <slug>/
        └── state.md         # Por cada proyecto
```

## Reglas

| Path | Comportamiento |
|------|----------------|
| `projects.md` | Si tiene líneas parseables (`slug \| Name` o `- slug — Name`), define slugs. |
| Sin `projects.md` útil | Listing de la carpeta `projects/` → cada directorio es un slug con `state.md`. |
| `leads.json` | `{ "leads": [] }`. |
| `inbox.md` | Líneas `- YYYY-MM-DD: texto`. |

## Validación

1. Nombre del repo = `VITE_GITHUB_REPO`.
2. Rama = `VITE_GITHUB_BRANCH` o `main`.
3. Al menos un `projects/<slug>/state.md` válido (secciones del spec).
4. PAT con **`repo`** sobre ese repo.

Plantillas mínimas incluidas abajo en este mismo archivo (sección anterior).

---

Si tu repo ya coincide con esto, **la app es compatible**.
