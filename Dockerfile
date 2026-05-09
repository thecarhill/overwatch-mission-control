FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Inyectadas en build (local: --build-arg o .env + herramienta; CI: GitHub Actions)
ARG VITE_GITHUB_PAT=""
ARG VITE_GITHUB_OWNER=""
ARG VITE_GITHUB_REPO=""
ARG VITE_GITHUB_BRANCH=main
ENV VITE_GITHUB_PAT=$VITE_GITHUB_PAT
ENV VITE_GITHUB_OWNER=$VITE_GITHUB_OWNER
ENV VITE_GITHUB_REPO=$VITE_GITHUB_REPO
ENV VITE_GITHUB_BRANCH=$VITE_GITHUB_BRANCH

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
