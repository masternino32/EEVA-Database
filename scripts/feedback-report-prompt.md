# EEVA Feedback Report Prompt

Use this prompt in Claude Code, opened in the EEVA Report folder. Copy everything below the line, replace `<Client Name>`, and send it.

The feedback report is a short, personal document the client receives soon after submitting an EEVA. It gives them an overview of their results, practical recommendations, affirmations and next steps. It is not the full Emotional Evaluation and Treatment Plan: it does not describe the 14-day program in detail and does not replace the suitability consultation.

________________________________________

Prepare an EEVA feedback report for **<Client Name>**.

You are writing as Dirk J. Lambert, Trauma/EMDR Specialist and Program Director of New Paradigm Mental Health Retreat. The organisation is always called New Paradigm Mental Health Retreat; never use any other name for it. Write directly to the client ("you"), by first name, in a warm, encouraging, professional and easy-to-understand style. Keep the report to about two to three pages before the Client Information page.

## Step 1. Gather the intake

1. Run `node scripts/supabase-db.js client <surname>` and use the client's most recent evaluation. Note the score (score_raw out of 45), the selected statements grouped by category (selected_categories), current_situation, seeking_treatment_for, medication, psychiatric_diagnosis, psychiatric_hospital, looking_for and bach_flower_remedy.
2. If the client has more than one evaluation, collect every one of them for the comparison in Step 2: the date, score_raw, the selected statements per category and the current_situation text. Also run `node scripts/supabase-db.js get client_progress "client_id=eq.<id>&order=submitted_at"` for the recorded trajectory (score_percent, prev_percent, change_pct, baseline_percent, change_from_baseline). Evaluations entered by staff (user_agent starting with "admin-entry") count as regular evaluations. If two evaluations were submitted within a day of each other with almost the same answers, treat them as possible duplicates and mention this to Dirk instead of presenting them as progress.
3. Check `reports/` and `PDF Report Files/` for earlier EEVA reports, feedback reports and emails for this client, so the feedback report uses the same recommendation and the same proposed dates and stays consistent with what the client was told before.
4. If the client name or details look like a test submission (for example the email nino@ninovega.com or dirk.paeshuys@gmail.com, or placeholder text in the situation), stop and ask before writing.

Use only what the intake contains. Do not invent facts, history, quotes or preferences.

## Step 2. Write the report

Use these bold headings, in this order.

**Your Results at a Glance**

The overview. Give the Emotional Load Score out of 45 and the percentage, calculated as (Score ÷ 45) × 100 to one decimal place, and explain in plain language what it says about the client's current emotional wellbeing. State that an ideal emotional load is below 15%. Insert the category table (`{ "type": "scores" }`) and say which one or two categories carry the most weight. If there is an earlier evaluation, add one sentence on the overall change and point to the comparison section below. Make clear that the score is an indicator, not a diagnosis.

**Comparison with Your Previous Evaluations**

Include this section only when the client has more than one EEVA. Leave it out completely for a first evaluation.

1. A score table (`{ "type": "table" }`) with one row per evaluation in date order: date, score out of 45, percentage, and change from the first evaluation in percentage points. Calculate every percentage as (Score ÷ 45) × 100 to one decimal place, and note that an ideal emotional load is below 15%. If a value in client_progress differs from your own calculation, use your calculation and mention the difference to Dirk.
2. A category table comparing the first and the latest evaluation (and the one in between when there are three or more): one row per category with the number of statements selected each time and the change. Include categories that dropped to zero.
3. In plain language: which feelings and patterns the client no longer selected (quote two to four of those statements), which ones are still present, and any statements that are new since last time. New or increased themes are described with care, as information to work with, not as a setback.
4. A short interpretation of the trend. Relate the change to what is known from the intake, the situation text and earlier reports (for example sessions attended or life events the client described), without claiming that treatment caused it. With only two data points, call it a first comparison rather than a trend. If the score went up, acknowledge it calmly and explain that scores can rise during processing or under new life pressures.

Use only values that are in the evaluations. Do not round or adjust scores to make the picture look better.

**What Your Answers Tell Us**

A short summary of the main emotional themes, grouped by the categories the client selected, linked to what they wrote about their situation. Two to four paragraphs. Frame patterns as understandable responses to what they have lived through, never as personal failings.

**Strengths We Noticed**

Two to four strengths that are visible in the intake, for example the courage to reach out, care for others, a sense of responsibility, honesty about coping habits or a clear wish to change. Base each one on something the client actually said or selected.

**Recommendations for You**

Two parts.

First, three to six practical things the client can start now, at home, each tied to a theme from their answers. Examples: a short daily breathing or grounding practice, a regular wind-down routine for sleep, a daily walk, writing down recurring thoughts before bed, setting one small boundary, reducing alcohol or other coping habits with support. Keep each recommendation concrete and achievable, and avoid medical advice. Never suggest stopping or changing medication.

Second, the treatment option that best fits their presentation: 14-day intensive inpatient treatment, outpatient intensive therapy, online EMDR therapy, or inpatient treatment followed by online aftercare. Follow the Looking For rules in CLAUDE.md: when the client ticked one or more treatment types, name them, say which option fits and why, and if the assessment points elsewhere, acknowledge their preference first and explain the reasoning gently. When nothing was ticked, base the recommendation on the presentation alone and do not mention a preference. Give the proposed dates from CLAUDE.md (admission 10 January 2027, program 10 to 23 January 2027, to be confirmed at the suitability consultation). The final decision rests with the client.

**Affirmations for You**

Five to eight short affirmations in the first person ("I ..."), present tense, written for this client. Each one responds to a theme or statement from their answers, for example "I am allowed to rest without earning it" for someone who overworks despite exhaustion. Keep them believable and gentle rather than grand, and do not promise outcomes. Add one sentence suggesting how to use them, such as reading two or three aloud each morning or before sleep.

**Supportive Bach Flower Remedies**

Include this section only when the evaluation's bach_flower_remedy field has content, or when the user asks for it. When the field has content, use those remedies. Otherwise choose three to seven remedies that match the client's selected statements, using the standard Bach descriptions. For each remedy, give one sentence on the emotional pattern it is traditionally used for. Present them as complementary support, not as treatment. Note that standard remedies are preserved in brandy, and suggest alcohol-free versions for anyone who reports alcohol use, addiction, pregnancy or a medical reason to avoid alcohol. Suggest checking with their doctor if they take medication.

**Questions to Reflect On**

Three to five open questions the client can think about or write about before the consultation, based on their themes (for example "When do you feel most like yourself?" or "What would you like to put down first?").

**Your Next Steps**

What happens now: the suitability consultation by video call, what it is for, and how to book it (reply with a few days and times plus their time zone). If the client lives in the Americas, mention that because of the time difference the call would best be in their late afternoon or evening. If the intake mentions panic attacks, self-harm, suicidal thoughts or feeling unsafe, add a clear, calm paragraph asking them to contact their therapist, doctor or local emergency services straight away if distress feels unmanageable before the consultation.

**A Closing Word**

A short, personal and encouraging paragraph, signed Dirk J. Lambert, Trauma/EMDR Specialist and Program Director, New Paradigm Mental Health Retreat.

**Client Information** (rendered automatically on the last page)

Name, age, gender, country, date of the evaluation, Emotional Load Score with percentage, number and dates of previous evaluations (when there are any), seeking treatment for, current medication, diagnosis if reported, and "Looking for" only when the client ticked a treatment type.

## Rules

- Use only information from the intake. Do not invent facts, and do not make diagnoses that the client has not reported.
- Do not promise recovery, a score reduction or any particular outcome.
- Do not use the em dash character. Do not use horizontal lines.
- Use bold headings and leave one blank line between paragraphs.
- Personalise every section. Avoid generic text that could fit any client.
- If the intake mentions a risk (self-harm, suicidal thoughts, feeling unsafe, heavy substance use), keep the report calm and supportive, and tell Dirk about it in the chat reply so he can follow up personally.

## Step 3. Save and report back

- Write the content as a JSON file for `scripts/build-report.js` in `reports/`, named `<surname>-feedback.json`. Set `"title"` to "Your EEVA Feedback Report", put the score and the evaluation date in `"subtitle"`, and keep `"preparedBy"` as "Prepared by Dirk J. Lambert, Trauma/EMDR Specialist and Program Director". Use the section headings above in `sections`, and the client information in `clientInfo`.
- Build the Word file: `node scripts/build-report.js reports/<surname>-feedback.json "reports/Feedback - <Client Name> - <DDMMYYYY>.docx"`, with today's date. Then the PDF: `node scripts/convert-pdf.js "reports/Feedback - <Client Name> - <DDMMYYYY>.docx" "reports/Feedback - <Client Name> - <DDMMYYYY>.pdf"`. Check that the PDF has all headings, no em dash, and Client Information on the last page.
- Write a short cover email as `reports/Email - Feedback - <Client Name> - <DDMMYYYY>.md`: subject line, a thank-you for completing the EEVA, one sentence on what the attached feedback report contains, the invitation to book the suitability consultation, and the same signature as scripts/email-template.md. The same writing rules apply.
- Do not attach the report to the Supabase client record, do not email it, and do not write to the CRM. Dirk reviews it first and sends the email from OnePageCRM. Never create a Gmail draft.
- Do not commit anything under `reports/` to git.
- In the chat, reply with the file paths, the score and percentage, the change since the previous evaluation (when there is one), the recommended option, and any point that needs Dirk's personal follow-up, including possible duplicate evaluations or scores that do not match client_progress.
