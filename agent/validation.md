# Validation Rules

## General Rules

- Valid JSON per line
- Required fields:
  - system
  - instruction
  - input
  - output
- No empty string
- Max 10 lines per submit

## Marketing Rules

- output must contain:
  - "Strategi"
  - "Content Calendar"

## Regulasi Rules

- input must contain:
  - "Konteks:"
  - "Pertanyaan:"

## Deduplication

- Generate hash
- Reject if exists in DB

## Error Handling

Return per-line error:

- invalid JSON
- missing field
- rule violation
