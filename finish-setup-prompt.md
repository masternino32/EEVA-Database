# Prompt for Claude Desktop: finish the EEVA automatic report setup

Copy everything below the line into a new Claude Desktop chat (Code tab, with the browser and computer use available).

---

I need you to finish setting up the automatic EEVA report routine for New Paradigm Mental Health Retreat. Most of the work is done. Here is the current state, then the four tasks left.

CURRENT STATE
- Local project folder: C:\Users\Nino\OneDrive\Documents\Claude\Projects\EEVA Report. It is pushed to GitHub as masternino32/EEVA-Database. Read its README.md and routine.json first; CLAUDE.md holds the report rules.
- A Claude Code cloud routine already exists: name "EEVA draft reports for new intakes", id trig_01FqCeqReTi4GDbc2hsQAg1q, managed at https://claude.ai/code/routines. It is currently DISABLED. Its prompt text is already correct and matches routine.json; do not rewrite it.
- It runs on cloud environment env_01WYsdxuxuyXctybD6VBriqq.
- Its only run so far (18 October 2026, 06:20 UTC) stopped at the setup check because the cloud environment has no SUPABASE_SERVICE_ROLE_KEY. That run confirmed that npm install, soffice (LibreOffice) and pdftotext all work in the environment, so nothing else needs installing.

TASK 1: configure the cloud environment
Open the cloud environment settings for env_01WYsdxuxuyXctybD6VBriqq on claude.ai (from a Claude Code cloud session title bar, the cloud environment menu, then Edit) and set three things:
1. Network secrets (API credentials): add a secret named exactly SUPABASE_SERVICE_ROLE_KEY. The value is the Supabase service-role key. I will paste the value myself when you have the field open; ask me for it. Do not print the key in chat, do not store it anywhere else, and do not commit it. If I tell you to fetch it yourself, it is in the file "C:\Users\Nino\OneDrive\Documents\Claude\Websites\New Paradigm Claude\site\config.php" on the SUPABASE_SERVICE_ROLE_KEY line (around line 46); copy it straight into the field without echoing it.
2. Allowed domains: add ftctubuplwqsdypthnyw.supabase.co so the sandbox can reach the database and the storage bucket.
3. Setup script: npm install
Do not set SUPABASE_URL; the code has the correct default built in.

TASK 2: do one manual test run
On the routine page for trig_01FqCeqReTi4GDbc2hsQAg1q, use Run now (or, from a Claude Code session, the RemoteTrigger tool with action run on that trigger id). Wait for it to finish and read the run log. A good run shows:
- the key check passes,
- `node supabase-db.js pending 7` returns a list without an HTTP or network error,
- either "no new intakes needed a report", or for each client a Word file, a PDF, and an attach step that ends with a DRAFT label.
If the pending command fails with a network error, the allowed domain was not saved; fix it and run again. If it fails with HTTP 401 or 403, the secret value is wrong; ask me to paste it again. If the run drafts reports, tell me which clients so I can check them in the dashboard under Attachments; they must all show the DRAFT prefix.

TASK 3: enable the schedule
Only after a clean test run, enable the routine. Keep it hourly unless I say otherwise (it is set to minute 20 of every hour). Confirm the next run time back to me.

TASK 4: report back
Finish with a short summary: what you changed in the environment (names only, never values), the result of the test run, whether the routine is now enabled, and the next run time. Then update README.md in the local project folder under "Cloud automation" with a line saying the environment is configured and the routine is live as of today's date, and commit that one file with the message "Mark cloud routine as configured and enabled". Do not commit anything under reports/, PDF Report Files/ or Word Report Files/, and never a .env.

RULES
- Never paste or display the service-role key in chat or in any file other than the environment's secret field.
- Do not change the routine's prompt, model, repository or allowed tools.
- Do not attach anything to a client record yourself; only the routine does that, always with the DRAFT prefix.
- If anything in the claude.ai interface looks different from what I described, stop and show me a screenshot rather than guessing.
