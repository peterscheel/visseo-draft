/**
 * POST /api/kontakt – Kontaktformular und Flächen-Alarm.
 * Läuft als Cloudflare Pages Function UND im Worker (worker/index.js importiert diese Datei).
 * Versand per Resend (https://resend.com).
 *
 * Umgebungsvariablen (Cloudflare → Settings → Variables and Secrets):
 *   RESEND_API_KEY  – API-Key von Resend (als "Secret")
 *   CONTACT_TO      – Empfänger, z. B. die Adresse von Gerrit Korner (mehrere mit Komma)
 *   CONTACT_FROM    – Absender auf einer bei Resend verifizierten Domain, z. B. "Gewerbepark Lonsee <kontakt@gewerbepark-lonsee.de>"
 */

const MAX = { name: 120, firma: 160, email: 200, telefon: 60, betreff: 120, rueckruf: 20, nachricht: 5000 };

function clean(v, max) {
  return String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}
function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function reply(request, status, body) {
  const wantsJson = (request.headers.get("Accept") || "").includes("application/json") ||
                    (request.headers.get("Content-Type") || "").includes("application/json");
  if (wantsJson) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }
  const url = new URL(request.url);
  return Response.redirect(url.origin + (body.ok ? "/kontakt?gesendet=1" : "/kontakt?fehler=1"), 303);
}

export async function onRequestPost({ request, env }) {
  let data = {};
  try {
    const type = request.headers.get("Content-Type") || "";
    if (type.includes("application/json")) data = await request.json();
    else (await request.formData()).forEach((v, k) => { data[k] = v; });
  } catch (e) {
    return reply(request, 400, { ok: false, error: "Die Anfrage konnte nicht gelesen werden." });
  }

  if (data.website) return reply(request, 200, { ok: true }); // Honeypot

  const typ = data.typ === "flaechen-alarm" ? "flaechen-alarm" : "kontakt";
  const f = {};
  for (const k of Object.keys(MAX)) f[k] = clean(data[k], MAX[k]);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) {
    return reply(request, 400, { ok: false, error: "Bitte geben Sie eine gültige E-Mail-Adresse an." });
  }
  if (typ === "kontakt") {
    if (!f.name || !f.nachricht) return reply(request, 400, { ok: false, error: "Bitte füllen Sie Name und Nachricht aus." });
    if (data.datenschutz !== "ja") return reply(request, 400, { ok: false, error: "Bitte stimmen Sie der Datenschutzerklärung zu." });
  }
  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    return reply(request, 503, { ok: false, error: "Das Formular ist noch nicht eingerichtet. Bitte rufen Sie uns an: 0174 323 29 49." });
  }

  const subject = typ === "flaechen-alarm"
    ? "Flächen-Alarm: neue Eintragung"
    : `Website-Anfrage: ${f.betreff || "Allgemeine Anfrage"}${f.name ? " – " + f.name : ""}`;
  const rows = typ === "flaechen-alarm"
    ? [["E-Mail", f.email], ["Hinweis", "Möchte informiert werden, sobald eine Fläche frei wird."]]
    : [["Name", f.name], ["Firma", f.firma], ["E-Mail", f.email], ["Telefon", f.telefon], ["Betreff", f.betreff], ["Rückruf", f.rueckruf], ["Nachricht", f.nachricht]];
  const filled = rows.filter(([, v]) => v);
  const text = filled.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<h2 style="font-family:Arial,sans-serif">${esc(subject)}</h2><table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">` +
    filled.map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#666;vertical-align:top"><b>${esc(k)}</b></td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`).join("") +
    `</table><p style="font-family:Arial,sans-serif;font-size:12px;color:#999">Gesendet über die Website des Gewerbepark Lonsee</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.CONTACT_FROM, to: env.CONTACT_TO.split(",").map((s) => s.trim()).filter(Boolean), reply_to: f.email, subject, text, html }),
  });
  if (!res.ok) {
    return reply(request, 502, { ok: false, error: "Die Nachricht konnte gerade nicht gesendet werden. Bitte rufen Sie uns an: 0174 323 29 49." });
  }
  return reply(request, 200, { ok: true });
}

export async function onRequest() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}
