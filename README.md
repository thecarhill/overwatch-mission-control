# Overwatch Mission Control

SPA (Vite + React + TS) con **SQLite local en el servidor Node**: leads, proyectos, inbox y pipeline se guardan primero en disco; **GitHub** se actualiza solo cuando pulsas **PUSH** en la cabecera (o **PULL** para traer el repo de datos). Ver **[`DATA_REPO_LAYOUT.md`](./DATA_REPO_LAYOUT.md)** para el layout del repo de datos.

## Arquitectura

| Capa | Rol |
|------|-----|
| **SQLite** (`/data/overwatch.db` en Docker) | Fuente de verdad local: `leads.json`, `inbox.md`, `projects.md`, `projects/*/state.md`, … |
| **API** (`/api/file`, `/api/browse`, `/api/sync/push`, `/api/sync/pull`) | Lectura/escritura local + sync contra GitHub con token **solo en servidor** |
| **GitHub** | Remoto opcional; se escribe con **PUSH**, se lee con **PULL** |

Variables **en runtime** (Docker / Portainer), no hace falta quemar PAT en el bundle:

- `GITHUB_TOKEN` (o `GITHUB_PAT`) — classic `repo` o fine-grained con Contents read/write en el repo de datos  
- `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` (default `main`)  
- `DATA_DIR` — carpeta del volumen (por defecto `/data`)

## Desarrollo local

```bash
npm install
npm run dev
```

Arranca **Vite** + **API + SQLite** (`tsx watch server/index.ts` en el puerto **8080**). El proxy de Vite envía `/api` → `localhost:8080`.

Opcional: crea `.env` en la raíz del proyecto solo si quieres probar sync a GitHub desde tu máquina:

```bash
export GITHUB_TOKEN=ghp_...
export GITHUB_OWNER=tu_usuario
export GITHUB_REPO=OVERWATCH
```

La base SQLite se crea en `./data/overwatch.db` si defines `DATA_DIR=./data` antes de `npm run dev`.

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

Monta un volumen en **`/data`** para persistir SQLite. En el stack, define **`GITHUB_*`** como arriba. Traefik debe apuntar al puerto **8080** del contenedor (`docker-compose.yml` ya usa `loadbalancer.server.port=8080`).

### Cabecera de la app

- **DIRTY**: filas locales pendientes de subir a GitHub  
- **PULL**: descarga desde GitHub al SQLite (sobrescribe paths conocidos)  
- **PUSH**: sube todo lo marcado dirty al repo  

### GitHub Actions → GHCR

Workflow [`.github/workflows/docker-ghcr.yml`](./.github/workflows/docker-ghcr.yml): ya **no** necesita secretos `VITE_*` para build; el token va en **runtime** en el servidor.

### Portainer (stack desde Git)

#### A) Imagen GHCR — `docker-compose.yml`

Red **`traefik`** externa, volumen **`overwatch_data`:**`/data`, variables **`GITHUB_TOKEN`**, **`GITHUB_OWNER`**, **`GITHUB_REPO`**, **`GITHUB_BRANCH`**.

#### B) Build en el servidor — `docker-compose.build.yml`

Clona el repo de código y construye la imagen en el host; mismas env + volumen que A.

Si ves **`unauthorized`** al hacer pull de GHCR, haz `docker login ghcr.io` en el host o haz el paquete público.

### GitHub desde el navegador (CONFIG)

Overrides opcionales en **localStorage** (`VITE_*` / PAT en navegador) siguen existiendo para flujos legacy; **en Docker el camino oficial es el token del servidor**.

### Cloudflare Tunnel + Zero Trust

Expón el puerto del contenedor al **cloudflared** y protege el hostname con **Cloudflare Access**. El token GitHub vive solo en variables del contenedor.

**Zero Trust en `overwatch.carceller.cc` (resumen):** Zero Trust → Access → aplicación **Self-hosted**, dominio `overwatch.carceller.cc`. Política **Allow** por email de admin.

---

### **`VITE_GITHUB_REPO`** (legacy)

Debe ser solo el **nombre del repo** (slug); si pegas una URL completa, el cliente antiguo la normalizaba — el modelo nuevo usa **`GITHUB_REPO`** en el servidor.
