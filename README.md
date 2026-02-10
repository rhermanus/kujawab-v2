# Kujawab v2

A Q&A platform for Indonesian science olympiad problems. Users can browse problem sets by subject, view problems, read community-written answers, and vote on them.

This is a rewrite of the original [Kujawab](https://kujawab.com) app (Laravel/MySQL) using modern tooling.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components)
- **Database:** PostgreSQL via Prisma (with `@prisma/adapter-pg`)
- **Styling:** Tailwind CSS
- **Math rendering:** KaTeX (replaces legacy CodeCogs LaTeX images)

## Project Structure

```
app/
  page.tsx                    # Home — subject list, top contributors, recent answers
  [code]/page.tsx             # Problem set — list of problems
  [code]/[number]/page.tsx    # Problem detail — answers, votes, comments
  user/[username]/page.tsx    # User profile — stats and recent answers
  login/page.tsx              # Login page (placeholder)
components/
  home-content.tsx            # Client component for home page accordion
  html-content.tsx            # Renders HTML with CodeCogs→KaTeX conversion
lib/
  prisma.ts                   # Prisma client singleton
  queries.ts                  # All data-fetching functions
  format.ts                   # Utilities (timeAgo, categoryLabel)
prisma/
  schema.prisma               # Database schema
scripts/
  migrate-data.ts             # MySQL dump → PostgreSQL migration
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL

### Setup

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Data Migration

To migrate data from the original MySQL dump:

```bash
# Place kujawab.sql in the project root
npx tsx scripts/migrate-data.ts
```
