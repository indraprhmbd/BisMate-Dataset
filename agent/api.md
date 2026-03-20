# API Specification

## POST /api/validate

Request:
{
task_type: "marketing" | "regulasi",
raw_text: string (JSONL)
}

Response:
{
valid: boolean,
errors: [
{
line: number,
message: string
}
]
}

---

## POST /api/submit

Request:
{
task_type: string,
raw_text: string,
contributor?: string
}

Behavior:

- Validate again
- Generate batch_id
- Insert all valid rows
- Reject if any invalid

Response:
{
success: true,
inserted: number
}

---

## GET /api/export?task=marketing

Response:

- Content-Type: text/plain
- Format: JSONL

Each line:
{"system":"...","instruction":"...","input":"...","output":"..."}
