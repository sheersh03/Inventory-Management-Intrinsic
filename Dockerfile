# syntax=docker/dockerfile:1

FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ xz-utils \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# Renderer-only build; skip native postinstall scripts that fail in slim images.
RUN npm install --include=dev --ignore-scripts

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS dev
ENV NODE_ENV=development
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ xz-utils \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 5173
CMD ["npm", "run", "dev:renderer", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM nginx:1.27-alpine AS prod
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
