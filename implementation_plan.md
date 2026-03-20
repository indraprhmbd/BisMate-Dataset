# BisMate Dataset Ingestion Tool

Internal web tool for ingesting, validating, and exporting JSONL datasets for AI fine-tuning. Built per the specs in `agent/`.

## User Review Required

> [!IMPORTANT]
> **Database connection**: You need a PostgreSQL database. The plan uses a local connection string `postgresql://postgres:postgres@localhost:5432/bismate`. Please confirm or provide your own `DATABASE_URL`.

> [!NOTE]
> **ORM choice**: Spec allows Drizzle or Prisma. This plan uses **Prisma** since it's already available via MCP tooling and is acceptable per [stack.md](file:///d:/Projects/BisMate-Dataset-App/agent/stack.md).

## Proposed Changes

### Project Initialization

#### [NEW] Next.js App (App Router)

Initialize via `npx create-next-app@latest ./ --ts --app --eslint --no-tailwind --no-src-dir --import-alias "@/*"` in the project root.

---

### Database Layer (Prisma)

#### [NEW] [schema.prisma](file:///d:/Projects/BisMate-Dataset-App/prisma/schema.prisma)

- `Dataset` model with fields: `id` (UUID), `taskType`, `system`, `instruction`, `input`, `output`, `hash` (unique), `batchId`, `contributor`, `createdAt`
- Indices on `taskType` and unique on `hash`

---

### Backend — Validation Library

#### [NEW] [validate.ts](file:///d:/Projects/BisMate-Dataset-App/lib/validate.ts)

Pure validation logic, no DB dependency:
- `parseJsonl(raw)` — split lines, JSON.parse each, return parsed or per-line errors
- `validateFields(obj)` — check `system`, `instruction`, `input`, `output` are non-empty strings
- `validateTaskRules(taskType, obj)` — marketing: output must contain "Strategi" & "Content Calendar"; regulasi: input must contain "Konteks:" & "Pertanyaan:"
- `generateHash(instruction, input)` — SHA-256 hex digest
- `validateBatch(taskType, rawText)` — orchestrator: max 10 lines, runs all checks, returns `{ valid, errors, parsed }`

---

### API Routes

#### [NEW] [route.ts](file:///d:/Projects/BisMate-Dataset-App/app/api/validate/route.ts)

`POST /api/validate` — accepts `{ task_type, raw_text }`, returns `{ valid, errors[] }`

#### [NEW] [route.ts](file:///d:/Projects/BisMate-Dataset-App/app/api/submit/route.ts)

`POST /api/submit` — accepts `{ task_type, raw_text, contributor? }`:
- Re-validates
- Generates `batch_id` (UUID)
- Checks hash duplicates against DB
- Inserts all rows atomically (transaction)
- Returns `{ success, inserted }`

#### [NEW] [route.ts](file:///d:/Projects/BisMate-Dataset-App/app/api/export/route.ts)

`GET /api/export?task=marketing|regulasi` — streams JSONL (`system`, `instruction`, `input`, `output` per line), `Content-Type: text/plain`, UTF-8

---

### Frontend — Single Page

#### [NEW] [globals.css](file:///d:/Projects/BisMate-Dataset-App/app/globals.css)

Dark theme design tokens from [design-token.md](file:///d:/Projects/BisMate-Dataset-App/agent/design-token.md):
- Background `#0f172a`, surface `#111827`, accent `#3b82f6`
- System font, monospace for textarea
- Component styles: card, button (primary/secondary), input, textarea, result panel

#### [MODIFY] [page.tsx](file:///d:/Projects/BisMate-Dataset-App/app/page.tsx)

Single page with:
1. **Header** — app title + description
2. **Task selector** — dropdown (marketing / regulasi)
3. **Textarea** — monospace, 300px min-height, placeholder "Paste JSONL here (max 10 lines)"
4. **Contributor** — optional text input
5. **Buttons** — Validate / Submit with loading states
6. **Result panel** — per-line errors (red) or success message (green)
7. **Export section** — download buttons for each task type

#### [MODIFY] [layout.tsx](file:///d:/Projects/BisMate-Dataset-App/app/layout.tsx)

Minimal layout with dark background, proper meta tags.

---

## Verification Plan

### Automated — Browser Testing

1. **Start dev server**: `npm run dev` (port 3000)
2. **Validate flow**: Open `http://localhost:3000`, paste valid marketing JSONL, click Validate → expect green success
3. **Error flow**: Paste invalid JSON, click Validate → expect per-line red errors
4. **Submit flow**: Paste valid JSONL, click Submit → expect "inserted: N" success
5. **Duplicate rejection**: Submit same JSONL again → expect duplicate hash error
6. **Export flow**: Click export → download JSONL file, verify content format

### Manual Verification (for the user)

1. Open the app at `http://localhost:3000`
2. Select "marketing" from dropdown
3. Paste this test JSONL:
   ```
   {"system":"You are a marketing AI","instruction":"Create strategy","input":"Product X","output":"Strategi pemasaran dan Content Calendar untuk Product X"}
   ```
4. Click **Validate** → should show success
5. Click **Submit** → should show "1 row inserted"
6. Click **Export Marketing** → should download a `.jsonl` file with the row
