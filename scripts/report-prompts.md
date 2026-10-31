# Report Prompts

This file holds the instructions for the three reports written for existing EEVA clients. The full first Emotional Evaluation and Treatment Plan is defined in CLAUDE.md.

| Report | When to use it | Length | Part |
|---|---|---|---|
| Feedback report | Soon after a client submits an EEVA, as a short personal overview before the suitability consultation | 2 to 3 pages | Part 1 |
| Follow-up evaluation | A client who has already had treatment submits a new EEVA | about 4 pages | Part 2 |
| Mid-term progress report | Halfway through a course of treatment, for Dirk (clinical) and for the client | clinical report plus 1 to 2 page client version | Part 3 |

To use one in Claude Code, open the EEVA Report folder, copy the prompt from the end of the part you need, fill in the client name, and send it.

## Shared rules for all three reports

- Write as Dirk J. Lambert, Trauma/EMDR Specialist, New Paradigm Mental Health Retreat. The organisation is always called New Paradigm Mental Health Retreat; never use any other name for it.
- Use only information from the sources. Do not invent facts, sessions, scores, quotes, memories or preferences, and do not make diagnoses the client has not reported.
- Do not promise recovery, a score reduction or any particular outcome.
- Calculate every Emotional Load Score as (Score ÷ 45) × 100 to one decimal place, and note that an ideal emotional load is below 15%.
- When a report shows scores from more than one evaluation (tables, charts, category comparisons, lists in the text, the Client Information page and the email), put the most recent score first and work back to the oldest.
- Do not use the em dash character. Do not use horizontal lines. Use bold headings and leave one blank line between paragraphs.
- Personalise every section; avoid generic text that could fit any client.
- If the sources mention a risk (self-harm, suicidal thoughts, feeling unsafe, heavy substance use), keep the client text calm and supportive and tell Dirk in the chat reply so he can follow up personally.
- Write the content JSON for `scripts/build-report.js`, build the Word file, convert it with `scripts/convert-pdf.js`, render the PDF and check the layout. Then delete the .docx; keep the PDF, the content JSON and the email in `Reports/<Letter>/<Client Name>/`.
- Do not attach anything to the Supabase client record, do not email the client and do not write to the CRM unless Dirk asks. Never create a Gmail draft. Do not commit anything under `Reports/` to git.

________________________________________

# Part 1. Feedback Report

The feedback report is a short, personal document the client receives soon after submitting an EEVA. It gives them an overview of their results, practical recommendations, affirmations and next steps. It is not the full Emotional Evaluation and Treatment Plan: it does not describe the 14-day program in detail and does not replace the suitability consultation. Write directly to the client ("you"), by first name, in a warm, encouraging, professional and easy-to-understand style. Keep it to about two to three pages before the Client Information page.

## Step 1. Gather the intake

1. Run `node scripts/supabase-db.js client <surname>` and use the client's most recent evaluation. Note the score (score_raw out of 45), the selected statements grouped by category (selected_categories), current_situation, seeking_treatment_for, medication, psychiatric_diagnosis, psychiatric_hospital, looking_for and bach_flower_remedy.
2. If the client has more than one evaluation, collect every one of them for the comparison in Step 2: the date, score_raw, the selected statements per category and the current_situation text. Also run `node scripts/supabase-db.js get client_progress "client_id=eq.<id>&order=submitted_at"` for the recorded trajectory (score_percent, prev_percent, change_pct, baseline_percent, change_from_baseline). Evaluations entered by staff (user_agent starting with "admin-entry") count as regular evaluations. If two evaluations were submitted within a day of each other with almost the same answers, treat them as possible duplicates and mention this to Dirk instead of presenting them as progress.
3. Check `Reports/<Letter>/<Client Name>/` and `PDF Report Files/` for earlier EEVA reports, feedback reports and emails for this client, so the feedback report uses the same recommendation and the same proposed dates and stays consistent with what the client was told before.
4. If the client name or details look like a test submission (for example the email nino@ninovega.com or dirk.paeshuys@gmail.com, or placeholder text in the situation), stop and ask before writing.

## Step 2. Write the report

Use these bold headings, in this order.

**Your Results at a Glance**

Give the Emotional Load Score out of 45 and the percentage, and explain in plain language what it says about the client's current emotional wellbeing. Insert the category table (`{ "type": "scores" }`) and say which one or two categories carry the most weight. If there is an earlier evaluation, add one sentence on the overall change and point to the comparison section below. Make clear that the score is an indicator, not a diagnosis.

**Comparison with Your Previous Evaluations**

Include this section only when the client has more than one EEVA. Leave it out completely for a first evaluation.

1. A score table (`{ "type": "table" }`) with one row per evaluation, most recent first: date, score out of 45, percentage, and change from the first evaluation in percentage points. If a value in client_progress differs from your own calculation, use your calculation and mention the difference to Dirk.
2. A category table comparing the latest and the first evaluation (and the one in between when there are three or more), with the latest in the first column: one row per category with the number of statements selected each time and the change. Include categories that dropped to zero.
3. In plain language: which feelings and patterns the client no longer selected (quote two to four of those statements), which ones are still present, and any statements that are new since last time. New or increased themes are described with care, as information to work with, not as a setback.
4. A short interpretation of the trend. Relate the change to what is known from the intake, the situation text and earlier reports, without claiming that treatment caused it. With only two data points, call it a first comparison rather than a trend. If the score went up, acknowledge it calmly and explain that scores can rise during processing or under new life pressures.

Use only values that are in the evaluations. Do not round or adjust scores to make the picture look better.

**What Your Answers Tell Us**

A short summary of the main emotional themes, grouped by the categories the client selected, linked to what they wrote about their situation. Two to four paragraphs. Frame patterns as understandable responses to what they have lived through, never as personal failings.

**Strengths We Noticed**

Two to four strengths that are visible in the intake, for example the courage to reach out, care for others, a sense of responsibility, honesty about coping habits or a clear wish to change. Base each one on something the client actually said or selected.

**Recommendations for You**

Two parts. First, three to six practical things the client can start now, at home, each tied to a theme from their answers (for example a short daily breathing or grounding practice, a wind-down routine for sleep, a daily walk, writing down recurring thoughts before bed, setting one small boundary). Keep each one concrete and achievable, avoid medical advice, and never suggest stopping or changing medication.

Second, the treatment option that best fits their presentation: 14-day intensive inpatient treatment, outpatient intensive therapy, online EMDR therapy, or inpatient treatment followed by online aftercare. Follow the Looking For rules in CLAUDE.md, and its Online-Only and Outpatient section when there is no inpatient component. When inpatient treatment is part of the recommendation, give the proposed dates from CLAUDE.md (admission 10 January 2027, program 10 to 23 January 2027, to be confirmed at the suitability consultation). The final decision rests with the client.

**Affirmations for You**

Five to eight short affirmations in the first person ("I ..."), present tense, written for this client, each responding to a theme or statement from their answers. Keep them believable and gentle rather than grand. Add one sentence suggesting how to use them, such as reading two or three aloud each morning or before sleep.

**Supportive Bach Flower Remedies**

Include this section only when the evaluation's bach_flower_remedy field has content, or when the user asks for it. When the field has content, use those remedies; otherwise choose three to seven that match the selected statements (`node scripts/followup-data.js <surname>` lists the traditional remedy for each statement). Give one sentence per remedy on the pattern it is traditionally used for, and present them as complementary support, not treatment. Note that standard remedies are preserved in brandy and suggest alcohol-free versions for anyone who reports alcohol use, addiction, pregnancy or a medical reason to avoid alcohol. Suggest checking with their doctor if they take medication.

**Questions to Reflect On**

Three to five open questions the client can think about before the consultation, based on their themes (for example "When do you feel most like yourself?").

**Your Next Steps**

The suitability consultation by video call, what it is for, and how to book it (reply with a few days and times plus their time zone). If the client lives in the Americas, mention that because of the time difference the call would best be in their late afternoon or evening. If the intake mentions panic attacks, self-harm, suicidal thoughts or feeling unsafe, add a clear, calm paragraph asking them to contact their therapist, doctor or local emergency services straight away if distress feels unmanageable before the consultation.

**A Closing Word**

A short, personal and encouraging paragraph, signed Dirk J. Lambert, Trauma/EMDR Specialist, New Paradigm Mental Health Retreat.

**Client Information** (rendered automatically on the last page)

Name, age, gender, country, date of the evaluation, Emotional Load Score with percentage, number and dates of previous evaluations, most recent first (when there are any), seeking treatment for, current medication, diagnosis if reported, and "Looking for" only when the client ticked a treatment type.

## Step 3. Save and report back

- Content JSON `Reports/<Letter>/<Client Name>/<surname>-feedback.json`, with `"title"` "Your EEVA Feedback Report", the score and evaluation date in `"subtitle"`, and `"preparedBy"` "Prepared by Dirk J. Lambert, Trauma/EMDR Specialist".
- Build `Feedback - <Client Name> - <DDMMYYYY>.docx`, convert to `.pdf`, and check that all headings are present with Client Information on the last page.
- Cover email `Email - Feedback - <Client Name> - <DDMMYYYY>.md`: subject line, thanks for completing the EEVA, one sentence on what the attached report contains, the invitation to book the suitability consultation, and the signature from scripts/email-template.md.
- In the chat, reply with the file paths, the score and percentage, the change since the previous evaluation (when there is one), the recommended option, and any point that needs Dirk's personal follow-up, including possible duplicate evaluations or scores that do not match client_progress.

## Prompt

```
Prepare an EEVA feedback report for <Client Name>, following Part 1 of scripts/report-prompts.md.
```

________________________________________

# Part 2. Follow-Up Evaluation

Use this when a client who has already had treatment with New Paradigm (inpatient, outpatient or online) submits a new EEVA. A follow-up report is short: the client already knows the program, so it compares the new evaluation with the previous ones and gives brief recommendations, affirmations and a new Bach flower prescription. It is not a new first evaluation.

## Step 1. Find the clients and pull the comparison

- Recent follow-ups: clients whose newest evaluation is recent and who have more than one evaluation. `node scripts/supabase-db.js pending 7` marks them with `follow_up: true`. Their CRM status is usually Ex Inpatient, Ex Outpatient or Outpatient.
- For each client run `node scripts/followup-data.js <surname>`. It prints the last five submissions, most recent first (date, score, percentage, change from the previous one); the statements that are new, persisting and eased since the previous evaluation; the Bach candidates (each selected statement with its traditional remedy); and the last clinical details given (seeking treatment for, medication, diagnosis, Looking For).

## Step 2. Read the treatment context

Read what happened since the previous evaluation: the client's files in `Reports/<Letter>/<Client Name>/`, which since 31 October 2026 also holds the client folders that used to be in `PDF Report Files/` (session summaries, progress reports, earlier affirmations and Bach prescriptions), and the session notes in Supabase (`node scripts/supabase-db.js get therapy_sessions "client_id=eq.<id>&order=session_date"`). Use this only to explain the change in scores and to personalise the recommendations. Keep sensitive details (names of other people, substances, legal matters, intimate details) out of the client report.

## Step 3. Decide the recommendation

When the client ticked "Looking For", follow it as CLAUDE.md describes. Otherwise offer online EMDR (and outpatient sessions in Chiang Mai when the client lives there) "if and when you would like it", without pressure, whatever the score; ask Dirk if a different recommendation seems needed. Never include admission dates, the 14-day program description, or residential material in a follow-up unless inpatient treatment is actually being recommended.

## Step 4. Write the draft

Save it as `Reports/<Letter>/<Client Name>/<surname>-followup-draft.json` with `"title": "Follow-Up Emotional Evaluation"`, a one- or two-sentence intro, and these sections in this order:

1. **Emotional Load Score**: one paragraph with the score out of 45, the percentage, the ideal below 15%, and what the level means.
2. **Your Score Progress**: `{ "type": "@scorechart" }`, `{ "type": "@history" }`, then one or two sentences on the trend (mention the very first evaluation if it is older than the five shown).
3. **What Has Changed**: `{ "type": "@categories" }`, then three `phase` blocks labelled Eased, Still present and New, and at most one sentence of interpretation.
4. **Recommendations**: one short paragraph and three to five bullets (`{ "type": "bullets", "items": [...] }`).
5. **Affirmations**: five or six bullets based on the client's themes.
6. **Bach Flower Prescription**: set `"pageBreakBefore": true`. One sentence saying which remedies from the previous prescription stay, which go and which are new, up to seven `phase` blocks (remedy: what it is for), and a closing line that the remedies are complementary and do not replace therapy or medical care. Recommend an alcohol-free version when the client does not drink.
7. **Client Information** (`clientInfo`, rendered on its own last page): name, age, gender, country, Emotional Load Score (latest, previous and first, most recent first), previous treatment, recommendation, medication, and diagnosis if one was reported.

Leave out the program sections of the first evaluation (What to Expect, modalities, environment, typical reactions, phases).

## Step 5. Build

```
node scripts/followup-data.js fill <surname> "<draft.json>" "Reports/<Letter>/<Client Name>/<surname>-followup.json"
node scripts/build-report.js "Reports/<Letter>/<Client Name>/<surname>-followup.json" "Reports/<Letter>/<Client Name>/EEVA - <Client Name> - <DDMMYYYY>.docx"
node scripts/convert-pdf.js "<the .docx>" "Reports/<Letter>/<Client Name>/EEVA - <Client Name> - <DDMMYYYY>.pdf"
```

Then delete the .docx and the draft. Check the layout: about four pages, Bach and Client Information each on their own page. To refresh the scores in a finished report later, run `fill` again on the content JSON itself.

## Step 6. Email

Write `Reports/<Letter>/<Client Name>/Email - <Client Name> - <DDMMYYYY>.md` with the subject "Your Follow-Up Emotional Evaluation": thanks, the latest score against the previous and first ones, one or two sentences on what has eased and what remains, the recommendation or the open offer of online EMDR, a mention of the affirmations and Bach prescription, and a safety line when the evaluation includes panic, self-harm or hopelessness. Keep it under 200 words. To send it with the report attached when Dirk asks, use `python -I scripts/send-report-email.py <to> "<email.md>" "<report.pdf>"` (send with `--test` first).

## Automatic follow-ups

The twice-daily cloud routine (`scripts/routine.json`) runs this part for every returning client it finds through `pending`. In the cloud it has no access to `PDF Report Files/`, so it takes the treatment context from the Supabase session notes only, and it stores the result as a draft for review instead of sending it.

## Prompt

```
Prepare follow-up EEVA reports for <Client Name(s)>, following Part 2 of scripts/report-prompts.md. Recommendation: <offer online EMDR if they would like it / resume treatment in format X / ask me>. Reply with the PDF and email paths, each client's score change, and anything that needs Dirk's personal follow-up.
```

________________________________________

# Part 3. Mid-Term Progress Report

Optional details, if known: client email, treatment start date, planned number of sessions.

This produces two documents: a clinical progress report for Dirk, to review progress at the midpoint of treatment, adjust the plan and prepare the next sessions, and a shorter client version written directly to the client. Write the clinical report in a professional, clear and compassionate style.

## Step 1. Gather every available source

Collect all the data before you write anything. Search for the client's first name, surname, email address and likely spelling variants (for example Agopian and Agopyan), because file names are not consistent.

1. **Supabase (EEVA intakes and session records).**
   - `node scripts/supabase-db.js client <surname>` for the client record and every EEVA evaluation (scores, selected statements by category, current situation, medication, diagnosis, looking_for).
   - `node scripts/supabase-db.js get client_progress "client_id=eq.<id>&order=submitted_at"` for the score trajectory (score_percent, prev_percent, change_pct, baseline_percent, change_from_baseline, session_number).
   - `node scripts/supabase-db.js get therapy_sessions "client_id=eq.<id>&order=session_date"` for session dates, subjects and notes.
   - `node scripts/supabase-db.js get treatment_notes "client_id=eq.<id>&order=created_at"` for treatment notes.
   - `node scripts/supabase-db.js get cbt_progress "client_id=eq.<id>"` for CBT checklist progress.
   - `node scripts/supabase-db.js get attachments "client_id=eq.<id>"` to see which files are on the record (EEVAs, session reports, medical).
2. **Session summaries on disk.** Search `Reports/` (all letter folders) and `PDF Report Files/` for every file with the client's name, including session summaries, meeting notes, EEVA reports, letters and emails. Read each one fully.
3. **Emails.** Use the Gmail connector on dirk.lambert@newparadigm.org. Search for messages from and to the client's address and name, and read the full threads, including what the client wrote between sessions about symptoms, insights, setbacks and proposed targets. Ignore messages that only contain session links.
4. **OnePageCRM.** Find the contact and read its status, background, notes, calls, meetings and actions.
5. **Google Calendar.** Search the whole calendar history, from the first contact date to today plus any booked future sessions, for every event with the client's first name, surname or email address (titles such as "<First Name> Session", "<First Name> EMDR" or "<Full Name>", and events where the client is an attendee). Use a full-text search rather than a short date window, and page through all results. Record each event's date, start and end time, title and status. Leave out cancelled events, but list them separately.
6. **Session dates.** Combine the session dates from the calendar, `therapy_sessions`, the session summary files and the emails (for example "Session Links" emails sent on the day) into one session list. For each session, note which sources confirm it. Flag calendar events that have no session notes, and session notes that have no calendar event.

If a source cannot be reached (a connector is down or missing, or a file cannot be read), say so and carry on with the rest. Never fill a gap with assumptions.

## Step 2. Analyse

- Build a timeline: intake date, each session (date, number, modality, main focus), each EEVA, and each relevant email.
- Compare the most recent EEVA with the first one and show the change in percentage points. If there is only one EEVA, say so and recommend repeating it.
- For every EMDR target that has been worked on, record what is documented: the target memory or situation, the negative and positive cognition, and SUD and VOC at the start and at the latest session, plus whether it is completed, still in progress or not yet processed. Use only the values that appear in the sources.
- Compare the client's original goals (from the intake, the first sessions and emails) with where they are now.
- Note recurring themes, links between patterns, what is helping, and what seems to block progress.

## Step 3. Write the clinical report

Use these bold headings, in this order. Back every statement with its source in brackets, for example [Session #3, 30 January 2026], [EEVA, 9 January 2026] or [Email from client, 15 October 2026].

**Summary**: five to eight sentences: where the client started, what has changed, what remains, and the main recommendation.

**Sources Reviewed**: a table listing each source type, the number of items, the date range and anything missing or unreadable.

**Treatment Overview**: start date, treatment type (inpatient, outpatient, online, aftercare), number of sessions so far and planned, the modalities used, and the stated reason for seeking treatment.

**Session Dates**: a table of every session in date order: session number, date, time, type or modality (for example EMDR, CBT, intro), main focus, and the sources that confirm it (Calendar, Supabase, session summary, email). Below the table, list any upcoming booked sessions, any cancelled sessions, and any mismatches between sources. Also note the average gap between sessions and any long breaks.

**Presenting Concerns at Intake**: the main concerns and emotional themes at the start, taken from the first EEVA and the first session.

**Emotional Load Score Progress**: a table with each EEVA date, score out of 45, percentage and change from baseline, most recent first, followed by a short interpretation of the trend. Do not draw conclusions from a single data point.

**Progress Toward Treatment Goals**: for each goal, the goal, its status (Achieved, Progressing, Not yet started, Unclear from the records), and the evidence.

**EMDR Targets and Processing**: a table of targets with the documented cognitions, starting and latest SUD and VOC, and status. Then a short note on what the processing revealed, such as earlier memories that came up, links between targets, and any blocking beliefs.

**Emerging Themes and Patterns**: the emotional, behavioural and thinking patterns that have become clearer during treatment, and how they connect.

**What Is Helping and What Is Getting in the Way**: strengths, resources and interventions that are working, and barriers such as avoidance, life stressors, gaps between sessions or open questions.

**Wellbeing and Safety Notes**: only what is documented, such as medication changes, sleep, substance use, risk statements or physical health. Flag anything Dirk should follow up. Write "No concerns documented" when there are none.

**Clinical Suggestions**: specific, practical suggestions for the coming sessions, for example which EMDR target to process next and why, resourcing or stabilisation needs, a floatback or affect bridge to explore, future templates, CBT or somatic work, and between-session exercises.

**Further Treatment Plan**: whether further treatment appears needed and why. If it does, set out the next phase: the targets in order of priority, the modalities, the session frequency, the suggested number of sessions, and a review point (including a repeat EEVA). When relevant, consider continued outpatient or online EMDR, the 14-day intensive inpatient program, or inpatient treatment followed by online aftercare. Base the recommendation only on the evidence, and note that the final decision is made together with the client. If no further treatment appears needed, describe a closing and aftercare plan instead.

**Questions for the Next Session**: open points to check with the client.

**Client Information**: name, age, gender, country, email, CRM status, treatment type, treatment start date, number of sessions to date, current medication, and diagnosis if one is documented.

Where the records conflict (for example different session counts in the calendar and in Supabase), point it out instead of choosing one silently.

## Step 4. Write the client version

Base it only on the clinical report. Write directly to the client ("you") in a warm, encouraging, professional and easy-to-understand style. Keep it to about one to two pages and personalise it with the client's own words and examples where the sources contain them. Use these bold headings, in this order.

**Your Progress So Far**: what brought the client to treatment, how many sessions you have had together since the start date, and an honest acknowledgement of the work they have put in.

**Your Sessions**: the list of session dates (date and a few words on the focus of each), plus the next booked session if there is one.

**Your Emotional Load Score**: the latest and the first score out of 45 and their percentages, latest first, explained in plain language. If there is only one EEVA, invite the client to complete a new one so progress can be measured.

**What Has Changed**: the documented improvements in everyday language. Explain the EMDR work in simple terms (for example "the memory of ... now feels much less intense than when we started"), without SUD or VOC numbers unless they help the client.

**What We Are Still Working On**: the themes and patterns that remain, framed with understanding and without blame.

**Suggestions for You**: two to five practical things the client can do between sessions, taken from the Clinical Suggestions.

**The Next Steps in Your Treatment**: the recommended plan in plain language (focus, frequency, roughly how many sessions, when the next review or EEVA will be). If further options are suggested, explain why they could help and make clear that the decision is the client's.

**Closing**: a short, encouraging paragraph and an invitation to bring questions to the next session, signed Dirk J. Lambert.

Leave out of the client version: source references in brackets, the Sources Reviewed table, mismatches between records, CRM status, internal clinical reasoning, and the Wellbeing and Safety Notes. If a safety concern is documented, do not mention it in the client version, but tell Dirk in the chat reply. Do not introduce anything that is not in the clinical report.

## Step 5. Save and report back

- Write each report as a content JSON in `Reports/<Letter>/<Client Name>/` (set `"title"` to "Mid-Term Progress Report (Clinical)" or "Your Progress Summary", and use `{ "type": "table" }` blocks for the tables; see the O'Byrne progress JSONs as examples). Name the files `Progress Report - <Client Name> - <DDMMYYYY>` (clinical) and `Progress Summary - <Client Name> - <DDMMYYYY>` (client version), with today's date.
- In the chat, reply with both file paths, a three to five line summary of the findings, a list of any sources that could not be reached or data that is missing, and any safety point that needs Dirk's personal follow-up.

## Prompt

```
Prepare a mid-term progress evaluation for <Client Name>, following Part 3 of scripts/report-prompts.md. Optional: client email <email>, treatment start date <date>, planned number of sessions <number>.
```
