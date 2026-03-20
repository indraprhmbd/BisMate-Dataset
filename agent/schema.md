# Database Schema

## Table: datasets

id: uuid (pk)
task_type: text (enum: 'marketing', 'regulasi')

system: text
instruction: text
input: text
output: text

hash: text (unique, for deduplication)

batch_id: text
contributor: text

created_at: timestamp default now()

## Index

- index on task_type
- unique index on hash

## Hash Strategy

hash = sha256(instruction + input)
