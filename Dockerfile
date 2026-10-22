# Node backend + Python (python-docx) in one image: the formatting extractor is run
# by Node through child_process.execFile (see scripts/extract_formatting.py).
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-docx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "--import", "./register.js", "src/server.js"]
