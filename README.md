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

El `Dockerfile` actual hace `COPY . .` y `npm run build`, así que **`.env` presente en el contexto de build** (sin subirlo a git) inyecta los `VITE_*` en `dist`.

### Cloudflare Tunnel + Zero Trust

Expón el puerto del contenedor (o del host) al **cloudflared** y protege el hostname con **Cloudflare Access** (política email/OTP). El PAT sigue en el bundle del navegador; Access reduce superficie de ataque frente a Internet abierto.
