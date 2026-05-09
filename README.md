# Overwatch Mission Control

SPA operativa (Vite + React + TS) que sincroniza con un repo GitHub de markdown/JSON (CRM, pipeline, inbox, proyectos). Ver **[`DATA_REPO_LAYOUT.md`](./DATA_REPO_LAYOUT.md)** para validar el **repo de datos**.

## Desarrollo local

```bash
cp .env.example .env
# Rellenar VITE_GITHUB_PAT, VITE_GITHUB_OWNER, VITE_GITHUB_REPO
npm install
npm run dev
```

## Build producción

```bash
npm ci
npm run build
```

Las variables `VITE_*` se **inyectan en el bundle** en tiempo de build.

## Docker (imagen para Portainer / NUC)

En esta carpeta:

```bash
docker build -t overwatch-mission-control:latest .
```

La imagen sirve la carpeta `dist` con **nginx** (puerto 80 del contenedor).

### Ejemplo Portainer / CLI

1. **Registry opcional:** subir la imagen a Docker Hub o GHCR:
   ```bash
   docker tag overwatch-mission-control:latest YOUR_USER/overwatch-mission-control:latest
   docker push YOUR_USER/overwatch-mission-control:latest
   ```
2. **Stack en Portainer:** imagen `YOUR_USER/overwatch-mission-control:latest`, publicar puerto **80** (o el que use tu proxy).
3. **Variables de entorno en build:** la imagen ya lleva el JS compilado; para cambiar GitHub hay que **reconstruir** la imagen con otro `.env` en el paso `docker build`, o usar build-args extendiendo el Dockerfile (no está en la imagen por defecto).

Recomendación: construir la imagen en CI o localmente con:

```bash
docker build \
  --build-arg VITE_GITHUB_OWNER=you \
  ...
```

Si prefieres solo `.env` en build local:

```bash
export $(grep -v '^#' .env | xargs)   # o usar docker-compose build con env_file
docker build -t overwatch-mission-control:latest .
```

El `Dockerfile` acepta **`--build-arg`** `VITE_GITHUB_*` (ver cabecera del Dockerfile). Sin argumentos, `npm run build` puede fallar si no hay `.env`.

### Subir imagen a GHCR desde GitHub (Actions)

En el repo está [`.github/workflows/docker-ghcr.yml`](./.github/workflows/docker-ghcr.yml): en cada push a **`main`** (o manual *workflow_dispatch*) se construye la imagen y se publica en:

`ghcr.io/<tu-usuario>/overwatch-mission-control:latest`  
(y un tag adicional con el SHA del commit).

**Qué configurar en GitHub (una vez):**

1. **Settings → Secrets and variables → Actions → New repository secret**  
   - **`VITE_GITHUB_PAT`**: token con scope **`repo`** sobre el repo de datos (el mismo que usarías en local).

2. **Opcional — Settings → Secrets and variables → Actions → Variables**  
   - **`VITE_GITHUB_REPO`**: nombre del repo de datos en GitHub (ej. `OVERWATCH`). Si no la creas, el workflow usa por defecto **`OVERWATCH`**.

`VITE_GITHUB_OWNER` en CI sale de **`github.repository_owner`** (tu usuario u organización).

Tras un push a `main`, en **Packages** del usuario/org aparecerá el contenedor. En Portainer: imagen `ghcr.io/thecarhill/overwatch-mission-control:latest`, con login a GHCR si el paquete es privado (`docker login ghcr.io` con PAT que tenga `read:packages`).

### Portainer (stack desde Git)

Tienes **dos modos**:

#### A) Imagen desde GHCR (`docker-compose.yml`)

Usa **`docker-compose.yml`** (pull de **`ghcr.io/thecarhill/overwatch-mission-control:latest`**). Ese fichero **ya incluye** la red Docker **`traefik`**, los **labels de Traefik** (Cloudflare, `web` / `websecure`, middlewares) y el mapeo de puerto. En el host, crea la red una vez si no existe: `docker network create traefik`. Variable opcional **`OVERWATCH_IMAGE`** si publicas bajo otro owner en GHCR.

Si ves **`unauthorized`** al hacer pull, Portainer a menudo **no reutiliza** el login de *Registries* para `docker compose`. Prueba en el **host del NUC** (SSH):

```bash
echo TU_PAT | docker login ghcr.io -u TU_USUARIO_GITHUB --password-stdin
docker pull ghcr.io/thecarhill/overwatch-mission-control:latest
```

- Si **`pull` aquí falla**: el PAT no sirve para Packages (classic → **`read:packages`**; fine-grained → permiso **Packages: Read** en la cuenta correcta) o el paquete no existe / nombre distinto en GitHub → **Packages**.
- Si **`pull` OK por SSH pero Portainer falla**: haz login en el mismo usuario que ejecuta Docker (`sudo` / root) o usa el modo B).

#### B) Build en el servidor — sin GHCR (`docker-compose.build.yml`) — recomendado si GHCR da guerra

1. En Portainer, **Compose path:** **`docker-compose.build.yml`** (no `docker-compose.yml`). Misma red Traefik y mismos labels que en A; también necesitas la red externa **`traefik`** en el host.
2. **Environment variables** del stack:
   - **`VITE_GITHUB_PAT`** — PAT con acceso al repo de datos  
   - **`VITE_GITHUB_OWNER`** — ej. `thecarhill`  
   - **`VITE_GITHUB_REPO`** — ej. `OVERWATCH`  
   - Opcional: **`VITE_GITHUB_BRANCH`** (`main` si no pones nada en el compose por defecto)

Portainer clona el repo y ejecuta **`docker compose build`**: no hay pull de GHCR.

---

#### Registry GHCR (solo modo A)

1. **Registry GHCR** (si el error es `unauthorized`)  
   Las imágenes en `ghcr.io` suelen ser **privadas** por defecto. En Portainer:
   - **Registries → Add registry**
   - **Registry URL:** `ghcr.io` (a veces basta `ghcr.io` sin `https://`)
   - **Username:** tu usuario de GitHub (ej. `thecarhill`)
   - **Password:** un **PAT** con scope **`read:packages`** (y acceso a `read:org` si la org lo exige)  
   Luego, al crear el stack, asocia esa registry al despliegue o usa un entorno donde `docker pull ghcr.io/...` ya funcione.  
   **Alternativa:** en GitHub → **Packages** → el paquete `overwatch-mission-control` → **Package settings** → **Change package visibility** → **Public** (cualquiera puede hacer `pull` sin login).

2. Con **`docker-compose.yml`** (pull GHCR), las variables **`VITE_*` en Portainer no cambian el bundle** (ya está compilado en la imagen). Con **`docker-compose.build.yml`**, sí debes rellenar **`VITE_GITHUB_*`** para el build en el servidor.

3. Si falla el deploy con error de red: el compose declara **`networks.traefik.external: true`** → en el host debe existir **`docker network create traefik`** (igual que tu stack n8n).

**Traefik:** Va integrado en **`docker-compose.yml`** y **`docker-compose.build.yml`**. **`docker-compose.traefik.yml`** solo hace `include` del principal por compatibilidad con stacks antiguos; no hace falta cambiar el path en Portainer si ya usas `docker-compose.yml`.

### Cloudflare Tunnel + Zero Trust

Expón el puerto del contenedor (o del host) al **cloudflared** y protege el hostname con **Cloudflare Access** (política email/OTP). El PAT sigue en el bundle del navegador; Access reduce superficie de ataque frente a Internet abierto.

**Zero Trust en `overwatch.carceller.cc` (resumen):** en Zero Trust → **Access** → **Applications** → *Add an application* → tipo **Self-hosted**, dominio `overwatch.carceller.cc`. Crea una **policy** con acción *Allow*, criterio **Emails** (o **Emails ending in**) e incluye tu email de admin. Coloca esa policy por encima de cualquier *Deny*. Con Traefik delante no suele ser necesario tocar el origen del túnel salvo que uses hostname distinto en cloudflared.

### GitHub desde el navegador (CONFIG)

La app puede guardar **owner / repo / branch / PAT** en **localStorage** (CONFIG → *Apply & reload sync*) para sobrescribir los valores `VITE_*` embebidos en la imagen Docker sin reconstruir. Útil si la imagen GHCR apunta a otro repo o rama. El PAT en el navegador es datos sensibles; combínalo con Zero Trust o despliegue privado.
