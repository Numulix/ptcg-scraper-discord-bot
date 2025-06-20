# Builder Stage
FROM mcr.microsoft.com/playwright:v1.53.0-jammy AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Production Stage
FROM mcr.microsoft.com/playwright:v1.53.0-jammy

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

CMD ["node", "dist/index.js"]