FROM oven/bun:1.2

# Install PNPM
RUN bun add -g pnpm

# Install dependencies
WORKDIR /app
COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile

# Copy everything else
COPY data ./data
COPY server ./server
COPY versions ./versions

# Run
CMD ["bun", "run", "server/index.ts"]