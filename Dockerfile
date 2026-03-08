FROM node:20-slim

RUN apt-get update && apt-get install -y \
    fonts-noto-color-emoji \
    chromium \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY . .

CMD ["node", "src/index.js"]