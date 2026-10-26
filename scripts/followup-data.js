// Data for a follow-up EEVA: compares a client's latest evaluation with their previous submissions.
//
// Usage:
//   node scripts/followup-data.js <name>                          print the comparison (last 5 submissions)
//   node scripts/followup-data.js fill <name> <draft.json> <out.json>  fill the computed blocks into a report draft
//
// In a draft, these placeholders are replaced with blocks built from Supabase:
//   "scores": "@scores"        category scores of the latest evaluation
//   { "type": "@scorechart" }  bar chart of the emotional load over the last 5 submissions
//   { "type": "@history" }     table: date, score, emotional load, change from previous
//   { "type": "@categories" }  table: category counts in the latest and previous evaluation
// Dates run from newest to oldest everywhere. Running fill on an already filled report refreshes these blocks.
// The Bach candidates printed by the first form map each selected statement to its traditional remedy;
// choose up to seven for the prescription and write the reasons yourself.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const CATS = ["Fear", "Despair", "Over-care", "Loneliness", "Uncertainty", "Not Being Present", "High Emotional Sensitivity"];
const BACH = {
  "I sometimes feel terror or panic, including nightmares.": "Rock Rose",
  "I am shy, overly sensitive, and modest in social situations.": "Mimulus",
  "I become helpless or frozen when afraid.": "Rock Rose",
  "I feel anxious without knowing why or fear that something bad will happen.": "Aspen",
  "I am overly concerned and worried about my loved ones.": "Red Chestnut",
  "I fear losing control or feel like I'm going crazy.": "Cherry Plum",
  "I feel overwhelmed by my responsibilities and don't cope well under pressure.": "Elm",
  "I lack self-confidence and often feel inferior or guilty.": "Larch",
  "I neglect my own needs to complete a task and feel emotionally drained.": "Centaury",
  "I feel devastated due to recent shocks or trauma.": "Star of Bethlehem",
  "I feel extreme mental or emotional heartache and hopelessness.": "Sweet Chestnut",
  "I struggle to forgive and forget, harboring bitterness or resentment.": "Willow",
  "I feel life is unfair and often have a poor me attitude.": "Willow",
  "I overwork despite exhaustion due to a strong sense of duty.": "Oak",
  "I feel unappreciated by my family but strive for their approval.": "Chicory",
  "I set very high standards for myself and am self-disciplined to a fault.": "Rock Water",
  "I try to take control of projects or situations but feel burdened by them.": "Vine",
  "I want to be a leader but often find myself overwhelmed by responsibility.": "Elm",
  "I am sensitive to injustice and feel strongly about correcting wrongs.": "Vervain",
  "I often criticize others or get annoyed by their habits.": "Beech",
  "I feel disconnected and often prefer to be alone when overwhelmed.": "Water Violet",
  "I dislike being alone but feel isolated in social interactions.": "Heather",
  "I am impatient, irritable, or find it hard to wait for things.": "Impatiens",
  "I often give the impression that I am aloof.": "Water Violet",
  "I am obsessed with my own troubles and find it hard to connect with others.": "Heather",
  "I constantly second-guess myself and change my mind out of confusion.": "Cerato",
  "I feel discouraged by setbacks and often procrastinate.": "Gentian",
  "I lack faith that things could get better and feel stuck in life.": "Gorse",
  "I have intense mood swings and find it hard to make decisions.": "Scleranthus",
  "I feel like I lack direction or a clear path in life.": "Wild Oat",
  "I am ambitious but unsure how to achieve my goals.": "Wild Oat",
  "I keep repeating the same mistakes or wrong patterns.": "Chestnut Bud",
  "I think more about the past or what might have been than the present.": "Honeysuckle",
  "I feel my moods swinging and often feel emotionally drained.": "Scleranthus",
  "I have repeated unwanted thoughts and worries.": "White Chestnut",
  "I relive unhappy events or arguments and have trouble letting go.": "Honeysuckle",
  "I struggle to sleep because I can't stop thinking.": "White Chestnut",
  "I often feel spacey, absent-minded, or unable to concentrate.": "Clematis",
  "I feel no joy in life and often feel apathetic or resigned.": "Wild Rose",
  "I find it difficult to say \"no\" and am easily influenced by others.": "Centaury",
  "I feel discontented and unhappy in daily life.": "Wild Oat",
  "I am suspicious of others or feel drained by social situations.": "Holly",
  "I want to pursue my own ambitions but feel trapped by circumstances.": "Walnut",
  "I often hide my feelings and give in to avoid conflict.": "Agrimony",
  "I turn to food, work, or other coping mechanisms when down.": "Agrimony",
};

function db(...args) {
  const out = execFileSync("node", [path.join(__dirname, "supabase-db.js"), ...args], { encoding: "utf8" });
  return JSON.parse(out.slice(out.search(/[\[{]/)));
}

const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const pct = (score) => Math.round((score / 45) * 1000) / 10;
const signed = (n) => (n > 0 ? "+" : n < 0 ? "-" : "") + Math.abs(n).toFixed(1);

function load(name) {
  const clients = db("get", "clients", `select=id,name,email,country,age,gender,status&name=ilike.*${name}*`);
  if (clients.length !== 1) throw new Error(`Expected one client for "${name}", found ${clients.length}: ${clients.map((c) => c.name).join(", ")}`);
  const client = clients[0];
  const evals = db("get", "evaluations", `select=submitted_at,score_raw,selected_items,selected_categories,seeking_treatment_for,medication,psychiatric_diagnosis,psychiatric_hospital,current_situation,looking_for&client_id=eq.${client.id}&order=submitted_at.desc`);
  // Older rows have only selected_items; map them to categories using rows that have both.
  const known = db("get", "evaluations", "select=selected_categories&selected_categories=not.is.null&order=submitted_at.desc&limit=500");
  const catOf = {};
  for (const k of known) for (const [c, items] of Object.entries(k.selected_categories || {})) for (const i of items) catOf[i] = c;
  for (const e of evals) {
    if (!e.selected_categories || !Object.keys(e.selected_categories).length) {
      e.selected_categories = {};
      for (const i of e.selected_items || []) (e.selected_categories[catOf[i] || "Unknown"] ??= []).push(i);
    }
  }
  // Newest first, as in every date list in the report.
  return { client, evals, last5: evals.slice(0, 5) };
}

function blocks({ last5 }) {
  const [latest, prev] = last5;
  const count = (e, c) => (e.selected_categories[c] || []).length;
  const out = {
    scores: { rows: CATS.map((c) => [c, count(latest, c)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]), total: latest.score_raw },
    scorechart: { type: "scorechart", ideal: 15, points: last5.map((e) => ({ label: fmtDate(e.submitted_at), score: e.score_raw })) },
    history: {
      type: "table", columns: ["Evaluation date", "Score", "Emotional load", "Change from previous"], widths: [2600, 1800, 2200, 3000],
      rows: last5.map((e, i) => [fmtDate(e.submitted_at), `${e.score_raw}/45`, `${pct(e.score_raw).toFixed(1)}%`,
        i === last5.length - 1 ? "Oldest in this overview" : `${signed(pct(e.score_raw) - pct(last5[i + 1].score_raw))} percentage points`]),
    },
  };
  if (prev) {
    out.categories = {
      type: "table", columns: ["Emotional category", fmtDate(latest.submitted_at), fmtDate(prev.submitted_at), "Change"], widths: [3600, 2000, 2000, 2000],
      rows: CATS.map((c) => { const a = count(prev, c), b = count(latest, c); return [c, b, a, b === a ? "No change" : (b > a ? "+" : "") + (b - a)]; }),
    };
  }
  return out;
}

function report(data) {
  const { client, evals, last5 } = data;
  const [latest, prev] = last5;
  console.log(`${client.name} | ${client.age} | ${client.gender} | ${client.country} | ${client.status} | ${client.email}`);
  console.log(`${evals.length} evaluations in total; first ${fmtDate(evals[evals.length - 1].submitted_at)} (${evals[evals.length - 1].score_raw}/45)`);
  console.log("\nLast submissions:");
  for (const r of blocks(data).history.rows) console.log("  " + r.join(" | "));
  const L = new Set(latest.selected_items || []), P = new Set(prev ? prev.selected_items || [] : []);
  const show = (title, items) => { console.log(`\n${title} (${items.length}):`); for (const i of items) console.log("  - " + i); };
  if (prev) {
    show("New since previous", [...L].filter((i) => !P.has(i)));
    show("Persisting", [...L].filter((i) => P.has(i)));
    show("Eased since previous", [...P].filter((i) => !L.has(i)));
  }
  const bach = {};
  for (const i of L) if (BACH[i]) (bach[BACH[i]] ??= []).push(i);
  console.log("\nBach candidates (remedy: statements):");
  for (const [r, items] of Object.entries(bach).sort((a, b) => b[1].length - a[1].length)) console.log(`  ${r} (${items.length}): ${items.join(" / ")}`);
  const ctx = evals.find((e) => e.seeking_treatment_for || e.current_situation || e.medication);
  if (ctx) console.log(`\nLast clinical details (${fmtDate(ctx.submitted_at)}): seeking ${ctx.seeking_treatment_for || "-"} | medication ${ctx.medication || "-"} | diagnosis ${ctx.psychiatric_diagnosis || "-"} | looking for ${(latest.looking_for || []).join(", ") || "not answered"}`);
}

function fill(data, draftPath, outPath) {
  const b = blocks(data);
  const draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));
  if (draft.scores === "@scores") draft.scores = b.scores;
  // A filled report can be filled again: its generated blocks are recognised and refreshed.
  const keyOf = (blk) => {
    if (typeof blk !== "object") return null;
    if (String(blk.type).startsWith("@")) return blk.type.slice(1);
    if (blk.type === "scorechart") return "scorechart";
    if (blk.type === "table" && blk.columns[0] === "Evaluation date") return "history";
    if (blk.type === "table" && blk.columns[0] === "Emotional category") return "categories";
    return null;
  };
  for (const s of draft.sections) {
    s.blocks = s.blocks.map((blk) => {
      const key = keyOf(blk);
      if (!key) return blk;
      if (!b[key]) throw new Error(`No data for ${key} (a category comparison needs at least two evaluations)`);
      return b[key];
    });
  }
  fs.writeFileSync(outPath, JSON.stringify(draft, null, 2));
  console.log("written", outPath);
}

const args = process.argv.slice(2);
if (args[0] === "fill" && args.length === 4) fill(load(args[1]), args[2], args[3]);
else if (args.length === 1) report(load(args[0]));
else {
  console.error("Usage: node scripts/followup-data.js <name> | fill <name> <draft.json> <out.json>");
  process.exit(1);
}
