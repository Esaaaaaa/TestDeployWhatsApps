FROM node:20-slim

# Install minimal LibreOffice components, fonts, and required packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-calc \
    libreoffice-writer \
    fonts-dejavu \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy application files
COPY . .

# Expose default port
EXPOSE 10000

# Optimize Node memory for constrained environments (Render Free 512MB)
ENV NODE_OPTIONS="--max-old-space-size=384 --optimize_for_size --expose-gc"

# Start bot
CMD ["node", "src/index.js"]
