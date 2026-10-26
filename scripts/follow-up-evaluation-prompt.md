# Follow-Up Evaluation Procedure

Use this when a client who has already had treatment with New Paradigm (inpatient, outpatient or online) submits a new EEVA. A follow-up report is short: the client already knows the program, so it compares the new evaluation with the previous ones and gives brief recommendations, affirmations and a new Bach flower prescription. It is not a new first evaluation.

To run it in Claude Code from the EEVA Report folder, copy the prompt at the bottom, fill in the client names, and send it.

## 1. Find the clients and pull the comparison

- Recent follow-ups: clients whose newest evaluation is recent and who have more than one evaluation. Their CRM status is usually Ex Inpatient, Ex Outpatient or Outpatient.
- For each client run `node scripts/followup-data.js <surname>`. It prints:
  - the last five submissions, newest first (date, score, percentage, change from the previous one)
  - the statements that are new, persisting and eased since the previous evaluation
  - the Bach candidates: each selected statement with its traditional remedy
  - the last clinical details given (seeking treatment for, medication, diagnosis, Looking For)

## 2. Read the treatment context

Read what happened since the previous evaluation: the client's files in `PDF Report Files/<Client Name>/` and `reports/<Client Name>/` (session summaries, progress reports, earlier affirmations and Bach prescriptions), and the session notes in Supabase (`node scripts/supabase-db.js get therapy_sessions "client_id=eq.<id>&order=session_date"`). Use this only to explain the change in scores and to personalise the recommendations. Keep sensitive details (names of other people, substances, legal matters, intimate details) out of the client report.

## 3. Decide the recommendation

When the client ticked "Looking For", follow it as CLAUDE.md describes. When it is empty, ask Dirk. The usual choices:
- Load still high or rising: resume treatment in the format the client asked for before (for example intensive outpatient EMDR).
- Load moderate or low and holding: no new treatment needed; offer online EMDR "if and when you feel like it", without pressure.

Never include admission dates, the 14-day program description, or residential material in a follow-up unless inpatient treatment is actually being recommended.

## 4. Write the draft

Save it as `reports/<Client Name>/<surname>-followup-draft.json` with `"title": "Follow-Up Emotional Evaluation"`, a one- or two-sentence intro, and these sections in this order:

1. **Emotional Load Score**: one paragraph with the score out of 45, (Score ÷ 45) × 100, the ideal below 15%, and what the level means.
2. **Your Score Progress**: `{ "type": "@scorechart" }`, `{ "type": "@history" }`, then one or two sentences on the trend (mention the very first evaluation if it is older than the five shown).
3. **What Has Changed**: `{ "type": "@categories" }`, then three `phase` blocks labelled Eased, Still present and New, and at most one sentence of interpretation.
4. **Recommendations**: one short paragraph and three to five bullets (`{ "type": "bullets", "items": [...] }`).
5. **Affirmations**: five or six bullets based on the client's themes.
6. **Bach Flower Prescription**: set `"pageBreakBefore": true`. One sentence saying which remedies from the previous prescription stay, which go and which are new, up to seven `phase` blocks (remedy: what it is for), and a closing line that the remedies are complementary and do not replace therapy or medical care. Recommend an alcohol-free version when the client does not drink.
7. **Client Information** (`clientInfo`, rendered on its own last page): name, age, gender, country, Emotional Load Score (latest, previous and first, newest first), previous treatment, recommendation, medication, and diagnosis if one was reported.

Dates always run from newest to oldest. The writing rules in CLAUDE.md apply: no em dash, no unsupported diagnoses, no promises of recovery, one blank line between paragraphs.

## 5. Build

```
node scripts/followup-data.js fill <surname> "<draft.json>" "reports/<Client Name>/<surname>-followup.json"
node scripts/build-report.js "reports/<Client Name>/<surname>-followup.json" "reports/<Client Name>/EEVA - <Client Name> - <DDMMYYYY>.docx"
node scripts/convert-pdf.js "<the .docx>" "reports/<Client Name>/EEVA - <Client Name> - <DDMMYYYY>.pdf"
```

Then delete the .docx and the draft, and keep the content JSON, the PDF and the email. Render the PDF pages and check the layout (about four pages, Bach and Client Information each on their own page). To refresh the scores in a finished report later, run `fill` again on the content JSON itself.

## 6. Email

Write `reports/<Client Name>/Email - <Client Name> - <DDMMYYYY>.md` with the subject "Your Follow-Up Emotional Evaluation": thanks, the latest score against the previous and first ones, one or two sentences on what has eased and what remains, the recommendation or the open offer of online EMDR, a mention of the affirmations and Bach prescription, and a safety line when the evaluation includes panic, self-harm or hopelessness. Keep it under 200 words. Dirk sends it from OnePageCRM.

## 7. Do not

- Attach anything to the Supabase client record. Dirk reviews the PDF first and attaches it himself.
- Create Gmail drafts or write to the CRM.
- Commit anything under `reports/` to git.

________________________________________

Prepare follow-up EEVA reports for **<Client Name(s)>**, following scripts/follow-up-evaluation-prompt.md. Recommendation: <resume treatment in format X / offer online EMDR if they feel like it / ask me>. Reply with the PDF and email paths, each client's score change, and anything that needs Dirk's personal follow-up.

## Automatic follow-ups

The twice-daily cloud routine (`scripts/routine.json`) runs this procedure for every returning client it finds through `pending` (`follow_up: true`). In the cloud it has no access to `PDF Report Files/`, so it takes the treatment context from the Supabase session notes only, offers online EMDR "if and when you would like it", and stores the result as a draft for review instead of sending it.
