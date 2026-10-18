# EEVA Report

Tooling for writing Emotional Evaluation and Treatment Plan reports for prospective clients of New Paradigm Mental Health Retreat. The clinical and formatting rules for the report text live in [CLAUDE.md](CLAUDE.md). This file covers the mechanics.

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
5. **Attach to the client record.** `node supabase-db.js attach "<client name>" eevas "reports/<file>.pdf"`. This uploads to the `documents` bucket and inserts the `attachments` row the dashboard reads. Only final, human-reviewed reports are attached. Drafts are never attached to a client record.

## Drafts

The cloud routine stores its drafts with `node supabase-db.js draft "<client name>" "<file>.pdf" "<file>.docx" <content>.json "<email>.md"`, which uploads to the private `drafts/` folder of the `documents` bucket and writes no `attachments` row, so nothing shows on the client record. `node supabase-db.js drafts` lists stored drafts and `node supabase-db.js draft-pull "<client name>"` downloads a client's draft PDF, Word file, JSON and email into `reports/` for review. To finalise, edit the JSON, rebuild with `build-report.js`, convert, and attach. `pending` excludes clients that already have a final report or a stored draft.

6. **Write the client email** as `reports/Email - <Client Name> - <DDMMYYYY>.md`, following `email-template.md`.

File naming: `EEVA - <Client Name> - <DDMMYYYY>.pdf`, dated the day the report is written. The email uses the same date.

## Database

Tables used: `clients`, `evaluations` (one row per intake submission; `selected_categories` is JSON of category to statement list; `score_raw` out of `score_total` 45; `score_percent`), `attachments` (metadata for files in the `documents` storage bucket, path `clients/<client_id>/<category>/<timestamp>-<file>`; categories are `client`, `eevas`, `sessions`, `medical`).

## Privacy

All new reports and emails go in `reports/`. `PDF Report Files/` and `Word Report Files/` hold older reports only. Report files and the `.env` are excluded from git. Never commit anything under `reports/`, `PDF Report Files/` or `Word Report Files/`.

## Cloud automation

`routine.json` is the definition of the hourly Claude Code cloud routine that drafts a report for every new intake and stores it in the drafts folder for human review. It never attaches anything to a client record. Submit it from a Claude Code session with the RemoteTrigger tool (action `create`). Prerequisites on claude.ai: the GitHub account connected with access to this repository, and `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY` set as environment variables on the cloud environment named in the file. Routines are managed at https://claude.ai/code/routines.

Status: the cloud environment is configured (`SUPABASE_SERVICE_ROLE_KEY` as an environment variable, `ftctubuplwqsdypthnyw.supabase.co` in allowed domains, setup script running `npm install` inside the clone) and the routine is live, running hourly at minute 20, as of 18 October 2026.

## CRM sync

Every real intake should have a contact in OnePageCRM. `node crm.js pending 7` reads the last 7 days of evaluations and prints one CRM-ready record per client: name, email, phone in international format, country code, status `Inquiries`, a background with the basic details (name, email, phone, country, age, gender), and the custom fields Inquiry Date (the submission date in Bangkok time), Arrival Date (2027-01-10), Treatment For (mapped from the intake) and Treatment Price. Test submissions carry a `skip` reason. `node crm.js payload "<client name>"` prints the record for one client.

The price is 240,000 THB converted into the client's local currency at the live rate from open.er-api.com, then api.frankfurter.app, and rounded to whole units. When neither source can be reached, the rates stored in `fx-fallback.json` are used and the record says so. Unrecognised countries are priced in USD and flagged. `node crm.js price "<country>"` shows the price for a country.

`crm.js` never writes to the CRM. The hourly cloud routine "EEVA CRM sync" (definition in `routine-crm.json`) does that through the OnePageCRM connector: it creates a contact when no contact has the same email, and otherwise only fills empty Inquiry Date, Arrival Date, Treatment For and Treatment Price fields. It never overwrites values that are already set.
