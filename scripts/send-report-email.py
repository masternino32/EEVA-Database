# Send report emails through the Brevo SMTP relay with the PDF attached.
# Usage: python scripts/send-report-email.py <to> <email.md> <report.pdf> [--test]
#   --test sends to the sender's own address only, with "[TEST]" in the subject.
# No BCC to Dirk (stopped 2026-10-31 at Dirk's request).
# SMTP credentials are read from the website config.php at run time and never printed.
import re, smtplib, sys, os
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

CONFIG = r"c:\Users\Nino\OneDrive\Documents\Claude\Websites\New Paradigm Claude\site\config.php"
SENDER = ("Dirk J. Lambert", "dirk.lambert@newparadigm.org")

def creds():
    php = open(CONFIG, encoding="utf-8", errors="ignore").read()
    get = lambda k: re.search(rf"define\('{k}'[^\n]*\?:\s*'([^']+)'", php).group(1)
    host = re.search(r"'BREVO_SMTP_HOST',\s*'([^']+)'", php).group(1)
    port = int(re.search(r"'BREVO_SMTP_PORT',\s*(\d+)", php).group(1))
    user = re.search(r"'BREVO_SMTP_USER',\s*'([^']+)'", php).group(1)
    pw = os.environ.get("BREVO_SMTP_PASS") or get("BREVO_SMTP_PASS")
    return host, port, user, pw

def build(to, md_path, pdf_path, test):
    text = open(md_path, encoding="utf-8").read().strip()
    m = re.match(r"Subject:\s*(.+)\n+", text)
    subject, body = (m.group(1).strip(), text[m.end():]) if m else ("Your Follow-Up Emotional Evaluation", text)
    msg = EmailMessage()
    msg["From"] = formataddr(SENDER)
    msg["Reply-To"] = SENDER[1]
    msg["To"] = SENDER[1] if test else to
    msg["Subject"] = ("[TEST] " if test else "") + subject
    msg["Message-ID"] = make_msgid(domain="newparadigm.org")
    msg.set_content(body + "\n")
    with open(pdf_path, "rb") as f:
        msg.add_attachment(f.read(), maintype="application", subtype="pdf", filename=os.path.basename(pdf_path))
    return msg

if __name__ == "__main__":
    to, md, pdf = sys.argv[1:4]
    test = "--test" in sys.argv
    msg = build(to, md, pdf, test)
    host, port, user, pw = creds()
    with smtplib.SMTP(host, port, timeout=30) as s:
        s.starttls()
        s.login(user, pw)
        refused = s.send_message(msg)
    print("sent" if not refused else f"refused: {refused}", "|", msg["To"], "|", msg["Subject"], "|", os.path.basename(pdf), "|", msg["Message-ID"])
