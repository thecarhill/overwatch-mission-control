# Overwatch Mission Control

SPA (Vite + React + TS) con **SQLite en el servidor Node**: leads, proyectos, inbox y pipeline se leen y escriben vía API; los blobs viven en **`overwatch.db`** (no hay sincronización con GitHub ni escritura a un repo remoto). Ver **[`DATA_REPO_LAYOUT.md`](./DATA_REPO_LAYOUT.md)** para paths lógicos dentro del almacén.

## Arquitectura

| Capa | Rol |
|------|-----|
| **SQLite** (`/data/overwatch.db` en Docker, o `DATA_DIR` en dev) | Fuente de verdad: `leads.json`, `inbox.md`, `projects.md`, `projects/*/state.md`, … |
| **API** (`/api/file`, `/api/browse`, `/api/health`) | Lectura/escritura contra la base |

Variables típicas **en runtime** (Docker / Portainer):

- `DATA_DIR` — carpeta del volumen (por defecto `/data` en Docker; en local suele ser `.data`)
- `PORT` — API + estático (default **8080**)
- `SQLITE_PATH` — opcional; por defecto `$DATA_DIR/overwatch.db`

## Desarrollo local

```bash
npm install
npm run dev
```

Arranca **Vite** + **API + SQLite** (`tsx watch server/index.ts` en el puerto **8080**). El proxy de Vite envía `/api` → `localhost:8080`.

Copia [`.env.example`](./.env.example) a `.env` si quieres fijar `DATA_DIR` u otras variables.

## Build producción

```bash
npm ci
npm run build
```

Genera `dist/` (frontend) y `dist-server/` (API).

## Docker (Portainer / NUC)

La imagen es **una sola**: **Node** sirve estático + API en el puerto **8080** (sin nginx).

```bash
docker build -t overwatch-mission-control:latest .
```

Monta un volumen en **`/data`** para persistir SQLite (`DATA_DIR=/data`). Traefik debe apuntar al puerto **8080** del contenedor (`docker-compose.yml` usa `loadbalancer.server.port=8080`).

### Cabecera de la app

- **STORE: SQLite (server)** — datos en el volumen del contenedor  
- **RELOAD** — vuelve a cargar leads/inbox/proyectos desde la API  

### GitHub Actions → GHCR

Workflow [`.github/workflows/docker-ghcr.yml`](./.github/workflows/docker-ghcr.yml): publica la imagen; no hace falta configurar tokens de datos en CI.

### Portainer (stack desde Git)

#### A) Imagen GHCR — `docker-compose.yml`

Red **`traefik`** externa, volumen **`overwatch_data`:**`/data`, env **`DATA_DIR`**, **`PORT`** si hace falta.

#### B) Build en el servidor — `docker-compose.build.yml`

Clona el repo de código y construye la imagen en el host; mismo volumen que A.

Si ves **`unauthorized`** al hacer pull de GHCR, haz `docker login ghcr.io` en el host o haz el paquete público.

### Cloudflare Tunnel + Zero Trust

Expón el puerto del contenedor al **cloudflared** y protege el hostname con **Cloudflare Access**.

**Zero Trust en `overwatch.carceller.cc` (resumen):** Zero Trust → Access → aplicación **Self-hosted**, dominio `overwatch.carceller.cc`. Política **Allow** por email de admin.

---

### Cliente: `VITE_API_BASE`

Opcional. Cadena vacía = mismo origen que la SPA (recomendado en Docker). Solo necesitas un origen distinto si el frontend se sirve en otro host que el API.
