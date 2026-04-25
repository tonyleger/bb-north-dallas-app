FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy source and build
COPY . .
RUN npm run build

# Production
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# SQLite data directory (mounted as persistent volume)
RUN mkdir -p /data
ENV DATABASE_PATH=/data/data.db

CMD ["node", "dist/index.cjs"]
