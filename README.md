# EEVA Report

Tooling for writing Emotional Evaluation and Treatment Plan reports for prospective clients of New Paradigm Trauma Institute. The clinical and formatting rules for the report text live in [CLAUDE.md](CLAUDE.md). This file covers the mechanics.

## Setup

```
npm install
```

Connection to the database is read from environment variables, or from a `.env` file in this folder:

```
SUPABASE_URL=https://ftctubuplwqsdypthnyw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

## Workflow for one report

1. **Find the intake.** `node supabase-db.js pending` lists evaluations whose client has no report attached yet. `node supabase-db.js client <surname>` prints the client record and all their evaluations, including the selected statements grouped by category and the free-text situation.
2. **Write the content** as a JSON file following `report-content.example.json`, obeying every rule in CLAUDE.md. Keep the twelve headings in order. Client information goes in `clientInfo`, which the builder always places on its own last page.
3. **Build the Word file.** `node build-report.js reports/<name>.json "reports/EEVA - <Name> - <DDMMYYYY>.docx"`. The builder refuses content that contains an em dash.
4. **Make the PDF.** `node convert-pdf.js "reports/<file>.docx" "reports/<file>.pdf"`. Uses LibreOffice when present, otherwise Microsoft Word on Windows.
5. **Attach to the client record.** `node supabase-db.js attach "<client name>" eevas "reports/<file>.pdf"`. This uploads to the `documents` bucket and inserts the `attachments` row the dashboard reads. Use the label prefix `DRAFT` while a report still needs human review.

File naming: `EEVA - <Client Name> - <DDMMYYYY>.pdf`, dated the day the report is written.

## Database

Tables used: `clients`, `evaluations` (one row per intake submission; `selected_categories` is JSON of category to statement list; `score_raw` out of `score_total` 45; `score_percent`), `attachments` (metadata for files in the `documents` storage bucket, path `clients/<client_id>/<category>/<timestamp>-<file>`; categories are `client`, `eevas`, `sessions`, `medical`).

## Privacy

Report files and the `.env` are excluded from git. Never commit anything under `reports/`, `PDF Report Files/` or `Word Report Files/`.
