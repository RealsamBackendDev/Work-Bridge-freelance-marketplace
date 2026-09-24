 WorkBridge freeelance marketplace

A freelance marketplace backend API — clients post jobs, freelancers submit
proposals, and projects move through milestones with simulated payments.

**Status:** 🚧 In active development (Phase 1: authentication complete)

## Tech Stack
- Node.js + Express (CommonJS)
- PostgreSQL + Prisma ORM
- JWT auth with refresh-token rotation (httpOnly cookies)
- Zod validation, helmet, rate limiting
- Docker (local database)

## Getting Started
```bash
docker compose up -d          # start PostgreSQL
cp .env.example .env          # add your JWT secrets
npx prisma migrate dev        # create tables
npm install && npm run dev    # start API
