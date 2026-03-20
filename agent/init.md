# BisMate Dataset Ingestion Tool

## Goal

Membangun internal web tool sederhana untuk:

- Input JSONL hasil generate LLM
- Validasi format dan rule dataset
- Simpan ke database SQL
- Export data untuk training AI

## Constraints

- No authentication
- Internal use only
- Fokus ke reliability, bukan UI
- Max 10 samples per submit

## Core Flow

User paste JSONL → validate → submit → store → export

## Dataset Types

- marketing
- regulasi

## Definition of Done

- Bisa submit JSONL valid (≤10 lines)
- Reject invalid JSON / rule violation
- Data tersimpan di DB
- Bisa export JSONL per task
