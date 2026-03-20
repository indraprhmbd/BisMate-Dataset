# BisMate Dataset Tool

Internal tool for ingesting, validating, and managing datasets used for AI training (Marketing and Regulasi).

## Features

- **Smart Ingestion**: Supports both JSONL (JSON Lines) and standard JSON Arrays (e.g., direct output from ChatGPT).
- **Interactive Row Editing**: Validate datasets in real-time. Invalid rows are expanded for inline correction with instant re-validation on blur.
- **Review & Export**: Paginated dashboard for AI teams to review submitted data. Includes batch selection for filtered JSONL downloads and hard deletion.
- **In-App Guide**: Interactive "Cara Pakai" section explaining validation edge cases and UI behavior.
- **Security**: Environment-locked password gate and production-only Origin restrictions.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Styling**: Vanilla CSS with developer-tool aesthetic

## Environment Variables

The application requires the following variables in a `.env` file:

```text
DATABASE_URL="postgresql://..."
APP_PASSWORD="your_internal_password"
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize database:
   ```bash
   npx prisma migrate dev
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to access the tool. Access is restricted by the password defined in your environment.
