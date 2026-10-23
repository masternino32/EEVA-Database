// WhatsApp click-to-chat helper for the EEVA Report project.
// Nothing is ever sent automatically: this opens the client's chat with the message typed in,
// and Dirk attaches the file and presses send himself.
//
// Usage:
//   node wa.js link "<client name or +phone>" "<message>"          print the links
//   node wa.js open "<client name or +phone>" "<message>" [file]   open the chat in WhatsApp Desktop with the message
//                                                                   filled in, and show [file] selected in Explorer for drag and drop
//
// The phone number comes from the client record in Supabase (clients.phone), formatted like crm.js does.

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { loadConfig, rest } = require("./supabase-db.js");
const { countryInfo, phoneE164 } = require("./crm.js");

async function resolvePhone(who) {
  if (/^\+?[\d\s()-]{7,}$/.test(who)) return { name: who, phone: phoneE164(who) };
  const cfg = loadConfig();
  const { body: clients } = await rest(cfg, `clients?select=id,name,phone,country&name=ilike.*${encodeURIComponent(who)}*`);
  if (clients.length !== 1) throw new Error(`Expected exactly one client matching "${who}", found ${clients.length}: ${clients.map((c) => c.name).join(", ")}`);
  const c = clients[0];
  const phone = phoneE164(c.phone, countryInfo(c.country));
  if (!phone || !phone.startsWith("+")) throw new Error(`No usable phone number for ${c.name} (stored: "${c.phone || ""}")`);
  return { name: c.name, phone };
}

function links(phone, message) {
  const digits = phone.replace(/\D/g, "");
  const text = encodeURIComponent(message || "");
  return {
    app: `whatsapp://send?phone=${digits}&text=${text}`,
    web: `https://wa.me/${digits}?text=${text}`,
  };
}

// rundll32 hands the URL to its registered handler without going through cmd, so % and & stay intact.
const openUrl = (url) => spawn("rundll32", ["url.dll,FileProtocolHandler", url], { detached: true, stdio: "ignore" }).unref();

async function main() {
  const [cmd, who, message, file] = process.argv.slice(2);
  if (!["link", "open"].includes(cmd) || !who) {
    console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(0, 9).join("\n"));
    process.exit(1);
  }
  const { name, phone } = await resolvePhone(who);
  const l = links(phone, message);
  const result = { client: name, phone, desktop_link: l.app, web_link: l.web };
  if (cmd === "open") {
    if (file) {
      const abs = path.resolve(file);
      if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
      spawn("explorer.exe", [`/select,${abs}`], { detached: true, stdio: "ignore" }).unref();
      result.file_to_attach = abs;
    }
    openUrl(l.app);
    result.next = "WhatsApp is open with the message typed in. Drag the file into the chat if there is one, check, and press send.";
  }
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
