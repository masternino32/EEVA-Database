// Prepare OnePageCRM contact records from EEVA intake submissions.
//
// Usage:
//   node crm.js pending [days=7]     one CRM-ready record per client with an evaluation in the last N days
//   node crm.js payload <client>     the CRM-ready record for one client (name, as in supabase-db.js client)
//   node crm.js price <country>      show the converted program price for a country
//
// This script only READS from Supabase and prints JSON. Writing to OnePageCRM is done by whoever runs it
// (the cloud routine or a Claude session) through the OnePageCRM connector, after checking by email that
// the contact does not already exist.
//
// Price: the program costs BASE_PRICE_THB. It is converted into the client's local currency at the live
// rate (open.er-api.com, then api.frankfurter.app), falling back to fx-fallback.json when both are unreachable.

const fs = require("fs");
const path = require("path");
const { loadConfig, rest } = require("./supabase-db.js");

const BASE_PRICE_THB = 240000;
const PROPOSED_ARRIVAL = "2027-01-10";
const CRM_STATUS = "Inquiries";
const TEST_EMAILS = ["nino@ninovega.com", "dirk.paeshuys@gmail.com"];
const TEST_NAMES = ["dirk"];

// Country aliases (lower-case, accents removed) -> [ISO 3166 alpha-2, currency, calling code]
const COUNTRIES = {
  "thailand": ["TH", "THB", "66"], "thai": ["TH", "THB", "66"], "thailande": ["TH", "THB", "66"],
  "united states": ["US", "USD", "1"], "united states of america": ["US", "USD", "1"], "usa": ["US", "USD", "1"], "us": ["US", "USD", "1"], "america": ["US", "USD", "1"],
  "united kingdom": ["GB", "GBP", "44"], "uk": ["GB", "GBP", "44"], "england": ["GB", "GBP", "44"], "scotland": ["GB", "GBP", "44"], "wales": ["GB", "GBP", "44"], "northern ireland": ["GB", "GBP", "44"], "great britain": ["GB", "GBP", "44"], "britain": ["GB", "GBP", "44"],
  "australia": ["AU", "AUD", "61"], "new zealand": ["NZ", "NZD", "64"], "canada": ["CA", "CAD", "1"],
  "ireland": ["IE", "EUR", "353"], "belgium": ["BE", "EUR", "32"], "belgie": ["BE", "EUR", "32"], "belgique": ["BE", "EUR", "32"],
  "netherlands": ["NL", "EUR", "31"], "netherland": ["NL", "EUR", "31"], "nederland": ["NL", "EUR", "31"], "holland": ["NL", "EUR", "31"], "the netherlands": ["NL", "EUR", "31"],
  "germany": ["DE", "EUR", "49"], "deutschland": ["DE", "EUR", "49"], "france": ["FR", "EUR", "33"], "spain": ["ES", "EUR", "34"], "espana": ["ES", "EUR", "34"],
  "italy": ["IT", "EUR", "39"], "italia": ["IT", "EUR", "39"], "portugal": ["PT", "EUR", "351"], "austria": ["AT", "EUR", "43"], "osterreich": ["AT", "EUR", "43"],
  "luxembourg": ["LU", "EUR", "352"], "finland": ["FI", "EUR", "358"], "greece": ["GR", "EUR", "30"], "malta": ["MT", "EUR", "356"], "cyprus": ["CY", "EUR", "357"],
  "estonia": ["EE", "EUR", "372"], "latvia": ["LV", "EUR", "371"], "lithuania": ["LT", "EUR", "370"], "slovakia": ["SK", "EUR", "421"], "slovenia": ["SI", "EUR", "386"], "croatia": ["HR", "EUR", "385"],
  "switzerland": ["CH", "CHF", "41"], "schweiz": ["CH", "CHF", "41"], "suisse": ["CH", "CHF", "41"], "svizzera": ["CH", "CHF", "41"],
  "sweden": ["SE", "SEK", "46"], "sverige": ["SE", "SEK", "46"], "norway": ["NO", "NOK", "47"], "norge": ["NO", "NOK", "47"], "denmark": ["DK", "DKK", "45"], "danmark": ["DK", "DKK", "45"], "iceland": ["IS", "ISK", "354"],
  "poland": ["PL", "PLN", "48"], "czech republic": ["CZ", "CZK", "420"], "czechia": ["CZ", "CZK", "420"], "hungary": ["HU", "HUF", "36"], "romania": ["RO", "RON", "40"], "bulgaria": ["BG", "BGN", "359"],
  "russia": ["RU", "RUB", "7"], "ukraine": ["UA", "UAH", "380"], "turkey": ["TR", "TRY", "90"], "turkiye": ["TR", "TRY", "90"],
  "singapore": ["SG", "SGD", "65"], "hong kong": ["HK", "HKD", "852"], "china": ["CN", "CNY", "86"], "taiwan": ["TW", "TWD", "886"], "japan": ["JP", "JPY", "81"], "south korea": ["KR", "KRW", "82"], "korea": ["KR", "KRW", "82"],
  "philippines": ["PH", "PHP", "63"], "phil": ["PH", "PHP", "63"], "malaysia": ["MY", "MYR", "60"], "indonesia": ["ID", "IDR", "62"], "vietnam": ["VN", "VND", "84"], "cambodia": ["KH", "KHR", "855"], "myanmar": ["MM", "MMK", "95"], "laos": ["LA", "LAK", "856"],
  "india": ["IN", "INR", "91"], "pakistan": ["PK", "PKR", "92"], "bangladesh": ["BD", "BDT", "880"], "sri lanka": ["LK", "LKR", "94"], "nepal": ["NP", "NPR", "977"],
  "united arab emirates": ["AE", "AED", "971"], "uae": ["AE", "AED", "971"], "dubai": ["AE", "AED", "971"], "abu dhabi": ["AE", "AED", "971"],
  "saudi arabia": ["SA", "SAR", "966"], "qatar": ["QA", "QAR", "974"], "kuwait": ["KW", "KWD", "965"], "bahrain": ["BH", "BHD", "973"], "oman": ["OM", "OMR", "968"],
  "israel": ["IL", "ILS", "972"], "lebanon": ["LB", "USD", "961"], "jordan": ["JO", "JOD", "962"], "egypt": ["EG", "EGP", "20"],
  "south africa": ["ZA", "ZAR", "27"], "nigeria": ["NG", "NGN", "234"], "kenya": ["KE", "KES", "254"],
  "mexico": ["MX", "MXN", "52"], "brazil": ["BR", "BRL", "55"], "argentina": ["AR", "ARS", "54"], "chile": ["CL", "CLP", "56"], "colombia": ["CO", "COP", "57"], "peru": ["PE", "PEN", "51"],
};

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();
const countryInfo = (name) => COUNTRIES[norm(name)] || null;

let fxCache = null;
async function fxRates() {
  if (fxCache) return fxCache;
  const sources = [
    ["https://open.er-api.com/v6/latest/THB", (j) => ({ rates: j.rates, date: j.time_last_update_utc })],
    ["https://api.frankfurter.app/latest?from=THB", (j) => ({ rates: j.rates, date: j.date })],
  ];
  for (const [url, pick] of sources) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const { rates, date } = pick(await r.json());
      if (rates && rates.USD) return (fxCache = { rates: { ...rates, THB: 1 }, date, source: new URL(url).host });
    } catch (_) { /* try the next source */ }
  }
  const fb = JSON.parse(fs.readFileSync(path.join(__dirname, "fx-fallback.json"), "utf8"));
  return (fxCache = { rates: { ...fb.rates, THB: 1 }, date: fb.date, source: "fx-fallback.json (stored rates, live sources unreachable)" });
}

async function priceFor(country) {
  const info = countryInfo(country);
  let currency = info ? info[1] : "USD";
  const fx = await fxRates();
  const notes = [];
  if (!info) notes.push(`country "${country || ""}" not recognised, priced in USD`);
  if (!fx.rates[currency]) { notes.push(`no rate for ${currency}, priced in USD`); currency = "USD"; }
  const amount = Math.round(BASE_PRICE_THB * fx.rates[currency]);
  return { base_thb: BASE_PRICE_THB, currency, amount, text: `${amount.toLocaleString("en-US")} ${currency}`, rate_date: fx.date, rate_source: fx.source, notes };
}

function phoneE164(raw, info) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s.startsWith("+")) return "+" + s.replace(/\D/g, "");
  const d = s.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (!info) return s;
  const cc = info[2];
  if (cc === "1") return d.length === 11 && d.startsWith("1") ? "+" + d : "+1" + d;
  if (d.startsWith(cc) && d.length >= 10 + cc.length - 1) return "+" + d;
  return "+" + cc + d.replace(/^0+/, "");
}

function treatmentFor(seeking) {
  const t = norm(seeking);
  const has = (w) => t.includes(w);
  const trauma = has("trauma") || has("ptsd") || has("abuse");
  if (has("ptsd")) return "trauma/PTSD";
  if (has("chronic fatigue")) return "Chronic Fatigue Syndrome (CFS)";
  if (trauma && has("addiction")) return "trauma/addiction";
  if (trauma && has("burnout")) return "trauma/burnout";
  if (trauma && has("depression")) return "trauma/depression";
  if (trauma && has("anxiety")) return "trauma/anxiety";
  if (has("burnout") && has("depression")) return "burnout/depression";
  if (has("anxiety") && has("depression")) return "anxiety/depression";
  if (has("abuse")) return "abuse";
  if (has("depression")) return "depression";
  if (has("anxiety")) return "anxiety";
  if (has("burnout")) return "burnout";
  if (has("trauma")) return "trauma/PTSD";
  return "mental health/wellness";
}

const titleCase = (s) => String(s || "").trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

function testReason(client, ev) {
  const email = String(client.email || "").toLowerCase().trim();
  if (TEST_EMAILS.includes(email)) return `test email ${email}`;
  if (TEST_NAMES.includes(String(client.name || "").toLowerCase().trim())) return `test name "${client.name}"`;
  const sit = String(ev.current_situation || "").trim();
  if (/^(test|testing|hhh+|asdf+|x+|abc|aaa+|\.+)$/i.test(sit)) return `placeholder situation text "${sit}"`;
  return null;
}

async function recordFor(client, ev) {
  const info = countryInfo(client.country);
  const full = titleCase(client.name);
  const parts = full.split(" ");
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const last = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  const phone = phoneE164(client.phone, info);
  const price = await priceFor(client.country);
  const inquiryDate = new Date(ev.submitted_at).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const background = [
    ["Name", full], ["Email", client.email], ["Phone", phone || client.phone], ["Country", client.country],
    ["Age", client.age], ["Gender", client.gender],
  ].filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "").map(([k, v]) => `${k}\t${v}`).join("\n");
  const contact = {
    first_name: first,
    last_name: last,
    emails: client.email ? [{ type: "work", address: String(client.email).trim() }] : [],
    phones: phone ? [{ type: "work", number: phone }] : [],
    status: CRM_STATUS,
    background,
    custom_fields: {
      "Inquiry Date": inquiryDate,
      "Arrival Date": PROPOSED_ARRIVAL,
      "Treatment For": treatmentFor(ev.seeking_treatment_for),
      "Treatment Price": price.text,
    },
  };
  if (info) contact.country_code = info[0];
  if (!first) delete contact.first_name;
  return { client_id: client.id, evaluation_id: ev.id, submitted_at: ev.submitted_at, name: full, skip: testReason(client, ev), price, contact };
}

async function main() {
  const [cmd, a1] = process.argv.slice(2);
  const out = (v) => console.log(JSON.stringify(v, null, 2));
  if (cmd === "price") {
    out({ country: a1, info: countryInfo(a1), price: await priceFor(a1) });
    return;
  }
  const cfg = loadConfig();
  if (cmd === "pending") {
    const days = Number(a1 || 7);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { body: evals } = await rest(cfg, `evaluations?select=id,client_id,submitted_at,seeking_treatment_for,current_situation,clients(id,name,email,phone,country,age,gender)&submitted_at=gte.${since}&order=submitted_at.desc`);
    const seen = new Set();
    const records = [];
    for (const ev of evals) {
      if (!ev.clients || seen.has(ev.client_id)) continue;
      seen.add(ev.client_id);
      records.push(await recordFor(ev.clients, ev));
    }
    out({ since, count: records.length, to_sync: records.filter((r) => !r.skip).length, records });
  } else if (cmd === "payload") {
    const { body: clients } = await rest(cfg, `clients?select=id,name,email,phone,country,age,gender&name=ilike.*${encodeURIComponent(a1)}*`);
    if (clients.length !== 1) { out({ error: `Expected exactly one client matching "${a1}"`, matches: clients.map((c) => c.name) }); process.exit(1); }
    const { body: evals } = await rest(cfg, `evaluations?select=id,client_id,submitted_at,seeking_treatment_for,current_situation&client_id=eq.${clients[0].id}&order=submitted_at.desc&limit=1`);
    if (!evals.length) { out({ error: "Client has no evaluation" }); process.exit(1); }
    out(await recordFor(clients[0], evals[0]));
  } else {
    console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(0, 14).join("\n"));
  }
}

module.exports = { priceFor, countryInfo, treatmentFor, phoneE164 };
if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
