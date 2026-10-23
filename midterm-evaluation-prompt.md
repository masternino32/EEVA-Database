# Mid-Term Client Evaluation Prompt

Use this prompt in Claude Code, opened in the EEVA Report folder. Copy everything below the line, replace `<Client Name>` (and the optional fields if you know them), and send it.

________________________________________

Prepare a mid-term progress evaluation for **<Client Name>**.

Optional details, if known: client email `<email>`, treatment start date `<date>`, planned number of sessions `<number>`.

You are writing as Dirk J. Lambert, Trauma/EMDR Specialist and Program Director of New Paradigm Mental Health Retreat. The organisation is always called New Paradigm Mental Health Retreat. You will produce two documents: a clinical progress report for Dirk, to review progress at the midpoint of treatment, adjust the plan and prepare the next sessions, and a shorter client version written directly to the client. Write the clinical report in a professional, clear and compassionate style.

## Step 1. Gather every available source

Collect all the data before you write anything. Search for the client's first name, surname, email address and likely spelling variants (for example Agopian and Agopyan), because file names are not consistent.

1. **Supabase (EEVA intakes and session records).**
   - `node supabase-db.js client <surname>` for the client record and every EEVA evaluation (scores, selected statements by category, current situation, medication, diagnosis, looking_for).
   - `node supabase-db.js get client_progress "client_id=eq.<id>&order=submitted_at"` for the score trajectory (score_percent, prev_percent, change_pct, baseline_percent, change_from_baseline, session_number).
   - `node supabase-db.js get therapy_sessions "client_id=eq.<id>&order=session_date"` for session dates, subjects and notes.
   - `node supabase-db.js get treatment_notes "client_id=eq.<id>&order=created_at"` for treatment notes.
   - `node supabase-db.js get cbt_progress "client_id=eq.<id>"` for CBT checklist progress.
   - `node supabase-db.js get attachments "client_id=eq.<id>"` to see which files are on the record (EEVAs, session reports, medical).
2. **Session summaries on disk.** Search `PDF Report Files/`, `Word Report Files/` and `reports/` for every file with the client's name, including session summaries, meeting notes, EEVA reports, letters and emails. Read each one fully.
3. **Emails.** Use the Gmail connector on dirk.lambert@newparadigm.org. Search for messages from and to the client's address and name, and read the full threads, including what the client wrote between sessions about symptoms, insights, setbacks and proposed targets. Ignore messages that only contain session links.
4. **OnePageCRM.** Find the contact and read its status, background, notes, calls, meetings and actions.
5. **Google Calendar.** Search the whole calendar history, from the first contact date to today plus any booked future sessions, for every event with the client's first name, surname or email address (titles such as "<First Name> Session", "<First Name> EMDR" or "<Full Name>", and events where the client is an attendee). Use a full-text search rather than a short date window, and page through all results. Record each event's date, start and end time, title and status. Leave out cancelled events, but list them separately.
6. **Session dates.** Combine the session dates from the calendar, `therapy_sessions`, the session summary files and the emails (for example "Session Links" emails sent on the day) into one session list. For each session, note which sources confirm it. Flag calendar events that have no session notes, and session notes that have no calendar event.

If a source cannot be reached (a connector is down or missing, or a file cannot be read), say so and carry on with the rest. Never fill a gap with assumptions.

## Step 2. Analyse

- Build a timeline: intake date, each session (date, number, modality, main focus), each EEVA, and each relevant email.
- Compare the first EEVA with the most recent one. Calculate each Emotional Load Score as (Score ÷ 45) × 100, show the change in percentage points, and note that an ideal emotional load is below 15%. If there is only one EEVA, say so and recommend repeating it.
- For every EMDR target that has been worked on, record what is documented: the target memory or situation, the negative and positive cognition, and SUD and VOC at the start and at the latest session, plus whether it is completed, still in progress or not yet processed. Use only the values that appear in the sources.
- Compare the client's original goals (from the intake, the first sessions and emails) with where they are now.
- Note recurring themes, links between patterns, what is helping, and what seems to block progress.

## Step 3. Write the report

Use these bold headings, in this order. Back every statement with its source in brackets, for example [Session #3, 30 January 2026], [EEVA, 9 January 2026] or [Email from client, 15 October 2026].

**Summary**

Five to eight sentences: where the client started, what has changed, what remains, and the main recommendation.

**Sources Reviewed**

A table listing each source type, the number of items, the date range and anything missing or unreadable.

**Treatment Overview**

Start date, treatment type (inpatient, outpatient, online, aftercare), number of sessions so far and planned, the modalities used, and the stated reason for seeking treatment.

**Session Dates**

A table of every session in date order: session number, date, time, type or modality (for example EMDR, CBT, intro), main focus, and the sources that confirm it (Calendar, Supabase, session summary, email). Below the table, list any upcoming booked sessions, any cancelled sessions, and any mismatches between sources. Also note the average gap between sessions and any long breaks.

**Presenting Concerns at Intake**

The main concerns and emotional themes at the start, taken from the first EEVA and the first session.

**Emotional Load Score Progress**

A table with each EEVA date, score out of 45, percentage and change from baseline, followed by a short interpretation of the trend. Do not draw conclusions from a single data point.

**Progress Toward Treatment Goals**

For each goal: the goal, its status (Achieved, Progressing, Not yet started, Unclear from the records), and the evidence.

**EMDR Targets and Processing**

A table of targets with the documented cognitions, starting and latest SUD and VOC, and status. Then a short note on what the processing revealed, such as earlier memories that came up, links between targets, and any blocking beliefs.

**Emerging Themes and Patterns**

The emotional, behavioural and thinking patterns that have become clearer during treatment, and how they connect.

**What Is Helping and What Is Getting in the Way**

Strengths, resources and interventions that are working, and barriers such as avoidance, life stressors, gaps between sessions or open questions.

**Wellbeing and Safety Notes**

Only what is documented, such as medication changes, sleep, substance use, risk statements or physical health. Flag anything Dirk should follow up. Write "No concerns documented" when there are none.

**Clinical Suggestions**

Specific, practical suggestions for the coming sessions, for example which EMDR target to process next and why, resourcing or stabilisation needs, a floatback or affect bridge to explore, future templates, CBT or somatic work, and between-session exercises.

**Further Treatment Plan**

State whether further treatment appears needed and why. If it does, set out the next phase: the targets in order of priority, the modalities, the session frequency, the suggested number of sessions, and a review point (including a repeat EEVA). When relevant, consider the options New Paradigm offers: continued outpatient or online EMDR, the 14-day intensive inpatient program, or inpatient treatment followed by online aftercare. Base the recommendation only on the evidence, and note that the final decision is made together with the client. If no further treatment appears needed, describe a closing and aftercare plan instead.

**Questions for the Next Session**

Open points to check with the client.

**Client Information**

Name, age, gender, country, email, CRM status, treatment type, treatment start date, number of sessions to date, current medication, and diagnosis if one is documented.

## Step 3b. Write the client version

After the clinical report, write a separate progress summary for the client, based only on the clinical report you just wrote. Write directly to the client ("you") in a warm, encouraging, professional and easy-to-understand style, from Dirk J. Lambert, Trauma/EMDR Specialist and Program Director, New Paradigm Mental Health Retreat. Keep it to about one to two pages and personalise it with the client's own words and examples where the sources contain them.

Use these bold headings, in this order.

**Your Progress So Far**

A short, personal opening: what brought the client to treatment, how many sessions you have had together since the start date, and an honest acknowledgement of the work they have put in.

**Your Sessions**

The list of session dates (date and a few words on the focus of each), plus the next booked session if there is one.

**Your Emotional Load Score**

The first and latest score out of 45 and their percentages, explained in plain language, with the note that an ideal emotional load is below 15%. If there is only one EEVA, invite the client to complete a new one so progress can be measured.

**What Has Changed**

The improvements that are documented, described in everyday language. Explain the EMDR work in simple terms (for example "the memory of ... now feels much less intense than when we started"), without SUD or VOC numbers unless they help the client.

**What We Are Still Working On**

The themes and patterns that remain, framed with understanding and without blame.

**Suggestions for You**

Two to five practical things the client can do between sessions, taken from the Clinical Suggestions.

**The Next Steps in Your Treatment**

The recommended plan in plain language: what the next sessions will focus on, how often, roughly how many, and when the next review or EEVA will be. If further options are suggested (continued online or outpatient EMDR, the 14-day intensive inpatient program, or online aftercare), explain why they could help, and make clear that the decision is the client's and will be discussed together.

**Closing**

A short, encouraging closing paragraph and an invitation to bring questions to the next session, signed Dirk J. Lambert.

Leave out of the client version: source references in brackets, the Sources Reviewed table, mismatches between records, CRM status, internal clinical reasoning, and the Wellbeing and Safety Notes. If a safety concern is documented, do not mention it in the client version, but tell Dirk in the chat reply that it needs a personal follow-up. Do not introduce anything that is not in the clinical report.

## Rules

- Use only information found in the sources. Do not invent sessions, scores, SUD or VOC values, memories or quotes.
- Do not make diagnoses that are not already documented, and do not promise recovery or outcomes.
- Do not use the em dash character. Do not use horizontal lines.
- Use bold headings and leave one blank line between paragraphs.
- Where the records conflict (for example different session counts in the calendar and in Supabase), point it out instead of choosing one silently.

## Step 4. Save and report back

- Write each report as a content JSON in `reports/` for `build-report.js` (set `"title"` to "Mid-Term Progress Report (Clinical)" or "Your Progress Summary", and use `{ "type": "table" }` blocks for the tables; see `reports/obyrne-progress-clinical.json` and `reports/obyrne-progress-client.json` as examples). Build the Word file with `node build-report.js`, then the PDF with `node convert-pdf.js`. Name them `Progress Report - <Client Name> - <DDMMYYYY>` (clinical) and `Progress Summary - <Client Name> - <DDMMYYYY>` (client version), with today's date. Render the PDF pages and check the layout before reporting back.
- Do not attach either file to the Supabase client record, do not email them, and do not write anything to the CRM. Dirk reviews both first. Client emails are sent by Dirk from OnePageCRM, so never create a Gmail draft for the client version.
- Do not commit anything under `reports/` to git.
- In the chat, reply with both file paths, a three to five line summary of the findings, a list of any sources that could not be reached or data that is missing, and any safety point that needs Dirk's personal follow-up.
