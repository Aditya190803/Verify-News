FROM oven/bun:1.2-alpine
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN bun install
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
WORKDIR /app/apps/api
ENV DATABASE_URL=postgresql://verify:verify@db:5432/verifynews
CMD sh -c "bun run db:migrate && bun run db:seed && bun run start"