FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm i -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of the source code
COPY . .

# Build the Next.js app
RUN pnpm build

# Expose port (Railway expects $PORT env var, default 3000)
ENV PORT=${PORT:-3000}
EXPOSE $PORT

# Start the server
CMD ["pnpm", "start"]
