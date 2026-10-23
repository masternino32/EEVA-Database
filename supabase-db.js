// Supabase query helper for the EEVA Report project.
// Usage:
//   node supabase-db.js tables                 list tables exposed by the REST API
//   node supabase-db.js count <table>          row count
//   node supabase-db.js columns <table>        column names (from one row)
//   node supabase-db.js get <table> [params]   raw REST query, e.g. get clients "select=id,name&limit=5"
//   node supabase-db.js client <name>          find a client by name and show their evaluations
//   node supabase-db.js attach <name> <category> <file> [label prefix]  upload a FINAL report (.pdf, .docx or .doc) to the client record
//   node supabase-db.js detach <attachment id>   remove one file from a client record (row and storage object)
//   node supabase-db.js draft <name> <pdf> [docx] [json] [email.md]  store a DRAFT in the private drafts/ folder (never on the client record)
//   node supabase-db.js drafts                     list stored drafts
//   node supabase-db.js draft-pull <name> [dir]    download a client's draft files for local review (default dir: reports/)
//
// Connection is read from .env in this folder (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
// If no .env exists, it falls back to the website config at ../../Websites/New Paradigm Claude/site/config.php.
// The key is never printed.

const fs = require("fs");
const path = require("path");

const TYPES = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".json": "application/json",
  ".md": "text/markdown",
};
// Only documents go on a client record; JSON and email drafts stay in the drafts folder.
const ATTACHABLE = [".pdf", ".docx", ".doc"];

function loadConfig() {
  const envPath = path.join(__dirname, ".env");
  const cfg = {};
  if (process.env.SUPABASE_URL) cfg.SUPABASE_URL = process.env.SUPABASE_URL;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) cfg.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m) cfg[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_SERVICE_ROLE_KEY) {
    const phpPath = path.join(__dirname, "..", "..", "Websites", "New Paradigm Claude", "site", "config.php");
    if (fs.existsSync(phpPath)) {
      const php = fs.readFileSync(phpPath, "utf8");
      const u = php.match(/SUPABASE_URL'[^\n]*\?:\s*'([^']+)'/);
      const k = php.match(/SUPABASE_SERVICE_ROLE_KEY'[^\n]*\?:\s*'([^']+)'/);
      if (u && !cfg.SUPABASE_URL) cfg.SUPABASE_URL = u[1];
      if (k && !cfg.SUPABASE_SERVICE_ROLE_KEY) cfg.SUPABASE_SERVICE_ROLE_KEY = k[1];
    }
  }
  if (!cfg.SUPABASE_URL) cfg.SUPABASE_URL = "https://ftctubuplwqsdypthnyw.supabase.co";
  if (!cfg.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("No Supabase key found. Set SUPABASE_SERVICE_ROLE_KEY as an environment variable or in .env.");
    process.exit(1);
  }
  return cfg;
}

async function rest(cfg, pathAndQuery, extraHeaders = {}) {
  const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    headers: {
      apikey: cfg.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
      ...extraHeaders,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return { headers: res.headers, body: text ? JSON.parse(text) : null };
}

async function storagePut(cfg, objPath, data, contentType) {
  const up = await fetch(`${cfg.SUPABASE_URL}/storage/v1/object/documents/${objPath}`, {
    method: "POST",
    headers: { apikey: cfg.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": contentType, "x-upsert": "false" },
    body: data,
  });
  if (!up.ok) throw new Error(`Storage upload failed HTTP ${up.status}: ${(await up.text()).slice(0, 300)}`);
}

// Drafts live flat under drafts/<timestamp>-<client_id>-<file> in the documents bucket, with no attachments row.
async function listDrafts(cfg) {
  const r = await fetch(`${cfg.SUPABASE_URL}/storage/v1/object/list/documents`, {
    method: "POST",
    headers: { apikey: cfg.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "drafts/", limit: 1000, offset: 0, sortBy: { column: "name", order: "desc" } }),
  });
  if (!r.ok) throw new Error(`Storage list failed HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const items = await r.json();
  return items.filter((o) => o.id).map((o) => {
    const m = o.name.match(/^(\d+)-([0-9a-f-]{36})-(.+)$/);
    return { path: `drafts/${o.name}`, stored_at: m ? new Date(Number(m[1])).toISOString() : null, client_id: m ? m[2] : null, file: m ? m[3] : o.name };
  });
}

async function main() {
  const [cmd, a1, a2] = process.argv.slice(2);
  const cfg = loadConfig();
  const out = (v) => console.log(JSON.stringify(v, null, 2));

  if (cmd === "tables") {
    const { body } = await rest(cfg, "");
    out(Object.keys(body.paths || {}).filter((p) => p !== "/").map((p) => p.slice(1)).sort());
  } else if (cmd === "count") {
    const { headers } = await rest(cfg, `${a1}?select=*&limit=1`, { Prefer: "count=exact" });
    out({ table: a1, count: Number((headers.get("content-range") || "/0").split("/")[1]) });
  } else if (cmd === "columns") {
    const { body } = await rest(cfg, `${a1}?select=*&limit=1`);
    out(body.length ? Object.keys(body[0]) : []);
  } else if (cmd === "get") {
    const { body } = await rest(cfg, `${a1}?${a2 || "select=*&limit=10"}`);
    out(body);
  } else if (cmd === "attach") {
    // attach <client name> <category: client|eevas|sessions|medical> <file path> [label prefix]
    // Mirrors the dashboard's uploadFiles(): storage object + attachments row.
    // A label prefix such as "DRAFT" is shown in the dashboard ahead of the filename.
    const [, name, category, filePath, labelPrefix] = process.argv.slice(2);
    const ext = path.extname(filePath || "").toLowerCase();
    if (!ATTACHABLE.includes(ext)) throw new Error(`Unsupported attachment type: ${filePath}. Use one of ${ATTACHABLE.join(", ")}.`);
    const type = TYPES[ext];
    const { body: clients } = await rest(cfg, `clients?select=id,name&name=ilike.*${encodeURIComponent(name)}*`);
    if (clients.length !== 1) { out({ error: `Expected exactly one client matching "${name}"`, matches: clients }); process.exit(1); }
    const client = clients[0];
    const data = fs.readFileSync(filePath);
    const label = (labelPrefix ? labelPrefix.trim() + " " : "") + path.basename(filePath);
    const safe = label.replace(/[^\w.\-]+/g, "_");
    const objPath = `clients/${client.id}/${category}/${Date.now()}-${safe}`;
    const up = await fetch(`${cfg.SUPABASE_URL}/storage/v1/object/documents/${objPath}`, {
      method: "POST",
      headers: {
        apikey: cfg.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": type,
        "x-upsert": "false",
      },
      body: data,
    });
    if (!up.ok) throw new Error(`Storage upload failed HTTP ${up.status}: ${(await up.text()).slice(0, 300)}`);
    const ins = await fetch(`${cfg.SUPABASE_URL}/rest/v1/attachments`, {
      method: "POST",
      headers: {
        apikey: cfg.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        client_id: client.id,
        evaluation_id: null,
        path: objPath,
        label,
        size_bytes: data.length,
        mime_type: type,
        uploaded_by: process.env.UPLOADED_BY || "dirk.paeshuys@gmail.com",
      }),
    });
    if (!ins.ok) {
      const msg = (await ins.text()).slice(0, 300);
      await fetch(`${cfg.SUPABASE_URL}/storage/v1/object/documents/${objPath}`, {
        method: "DELETE",
        headers: { apikey: cfg.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}` },
      });
      throw new Error(`Metadata insert failed HTTP ${ins.status}: ${msg} (storage object rolled back)`);
    }
    out({ client: client.name, attached: await ins.json() });
  } else if (cmd === "detach") {
    // detach <attachment id> : remove one file from a client record (attachments row and storage object), e.g. when replacing a revised report
    const { body: rows } = await rest(cfg, `attachments?select=id,client_id,path,label&id=eq.${encodeURIComponent(a1 || "")}`);
    if (rows.length !== 1) { out({ error: `No attachment with id "${a1}"` }); process.exit(1); }
    const att = rows[0];
    const auth = { apikey: cfg.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}` };
    const del = await fetch(`${cfg.SUPABASE_URL}/rest/v1/attachments?id=eq.${att.id}`, { method: "DELETE", headers: auth });
    if (!del.ok) throw new Error(`Metadata delete failed HTTP ${del.status}: ${(await del.text()).slice(0, 300)}`);
    const st = await fetch(`${cfg.SUPABASE_URL}/storage/v1/object/documents/${att.path}`, { method: "DELETE", headers: auth });
    out({ detached: att, storage_deleted: st.ok });
  } else if (cmd === "draft") {
    // draft <client name> <pdf path> [docx path] [json path] [email .md path]
    // Stores a DRAFT report in the private drafts/ folder of the documents bucket for human review.
    // It never touches the attachments table, so nothing appears on the client record in the dashboard.
    const [, name, ...files] = process.argv.slice(2);
    const { body: clients } = await rest(cfg, `clients?select=id,name&name=ilike.*${encodeURIComponent(name)}*`);
    if (clients.length !== 1) { out({ error: `Expected exactly one client matching "${name}"`, matches: clients }); process.exit(1); }
    const client = clients[0];
    const stamp = Date.now();
    const stored = [];
    for (const file of files) {
      const type = TYPES[path.extname(file).toLowerCase()];
      if (!type) throw new Error(`Unsupported draft file type: ${file}`);
      const safe = path.basename(file).replace(/[^\w.\-]+/g, "_");
      const objPath = `drafts/${stamp}-${client.id}-${safe}`;
      await storagePut(cfg, objPath, fs.readFileSync(file), type);
      stored.push(objPath);
    }
    out({ client: client.name, draft_stored: stored, note: "Draft only. Not attached to the client record." });
  } else if (cmd === "drafts") {
    out(await listDrafts(cfg));
  } else if (cmd === "draft-pull") {
    // draft-pull <client name> [dir] : download a client's draft files for local review
    const dir = a2 || "reports";
    const { body: clients } = await rest(cfg, `clients?select=id,name&name=ilike.*${encodeURIComponent(a1)}*`);
    if (clients.length !== 1) { out({ error: `Expected exactly one client matching "${a1}"`, matches: clients }); process.exit(1); }
    const mine = (await listDrafts(cfg)).filter((d) => d.client_id === clients[0].id);
    fs.mkdirSync(dir, { recursive: true });
    const saved = [];
    for (const d of mine) {
      const r = await fetch(`${cfg.SUPABASE_URL}/storage/v1/object/documents/${d.path}`, { headers: { apikey: cfg.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}` } });
      if (!r.ok) throw new Error(`Download failed HTTP ${r.status} for ${d.path}`);
      const target = path.join(dir, d.file.replace(/_/g, " ").replace(/\.json$/, ".json"));
      fs.writeFileSync(target, Buffer.from(await r.arrayBuffer()));
      saved.push(target);
    }
    out({ client: clients[0].name, saved });
  } else if (cmd === "pending") {
    // pending [days=30] : evaluations from the last N days whose client has no EEVA report attached
    const days = Number(a1 || 30);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { body: evals } = await rest(cfg, `evaluations?select=id,client_id,submitted_at,score_raw,score_percent,current_situation,clients(name,email,country,age,gender)&submitted_at=gte.${since}&order=submitted_at.desc`);
    const { body: atts } = await rest(cfg, `attachments?select=client_id,path,label&path=like.*/eevas/*`);
    const done = new Set(atts.map((a) => a.client_id));
    for (const d of await listDrafts(cfg)) done.add(d.client_id);
    const pending = evals.filter((e) => !done.has(e.client_id)).map((e) => ({
      evaluation_id: e.id,
      client_id: e.client_id,
      name: e.clients && e.clients.name,
      email: e.clients && e.clients.email,
      submitted_at: e.submitted_at,
      score_raw: e.score_raw,
      score_percent: e.score_percent,
      has_situation_text: !!(e.current_situation && e.current_situation.trim().length > 20),
    }));
    out({ since, pending_count: pending.length, pending });
  } else if (cmd === "sign") {
    // sign <storage path> : create a 60-second signed URL and report how the file would be served
    const r = await fetch(`${cfg.SUPABASE_URL}/storage/v1/object/sign/documents/${a1}`, {
      method: "POST",
      headers: { apikey: cfg.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 60 }),
    });
    if (!r.ok) throw new Error(`Sign failed HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const signed = `${cfg.SUPABASE_URL}/storage/v1${(await r.json()).signedURL}`;
    const head = await fetch(signed, { method: "HEAD" });
    out({ status: head.status, contentType: head.headers.get("content-type"), contentDisposition: head.headers.get("content-disposition"), contentLength: head.headers.get("content-length") });
  } else if (cmd === "client") {
    const { body: clients } = await rest(cfg, `clients?select=*&name=ilike.*${encodeURIComponent(a1)}*`);
    for (const c of clients) {
      const { body: evals } = await rest(cfg, `evaluations?select=*&client_id=eq.${c.id}&order=submitted_at.desc`);
      // Contact-form inquiries; the table may not exist yet in older setups.
      const inquiries = await rest(cfg, `inquiries?select=*&client_id=eq.${c.id}&order=submitted_at.desc`).then((r) => r.body, () => []);
      out({ client: c, evaluations: evals, inquiries });
    }
    if (!clients.length) out({ message: `No client matching "${a1}"` });
  } else {
    console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(0, 12).join("\n"));
  }
}

module.exports = { loadConfig, rest };
if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
