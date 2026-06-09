# Seat Booking App

Production-ready Next.js 15 scaffold using the App Router, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, ESLint, and environment variables.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env
```

3. Generate the Prisma client:

```bash
npm run prisma:generate
```

4. Start the development server:

```bash
npm run dev
```

## Project Structure

- `app`: App Router pages, layouts, and global styles
- `components`: Shared presentational components
- `lib`: Framework and infrastructure utilities
- `services`: Future service layer modules
- `prisma`: Prisma schema and future migrations
- `middleware`: Middleware helpers and matcher configuration
- `types`: Shared TypeScript types
