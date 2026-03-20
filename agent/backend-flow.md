# Backend Flow

## Parse

split raw_text by newline

## For each line

1. JSON.parse
2. Validate fields
3. Apply task-specific rules
4. Generate hash
5. Check duplicate

## If any error

→ reject entire batch

## If all valid

→ insert all rows with same batch_id
