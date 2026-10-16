# Gewerbepark Lonsee – Website

Statische Website für **gewerbepark-lonsee.de** (Gewerbepark 1, 2 und 3 in Lonsee).
Reines HTML, CSS und JavaScript – kein Build-Schritt, keine Abhängigkeiten, keine externen Schriften oder Tracker.

## Inhalt

| Datei / Ordner | Zweck |
|---|---|
| `index.html` … `kontakt.html` | Die Seiten (Startseite, Standorte, Gewerbepark 1–3, Mieter mit „Wer sitzt wo?“, Aktuelles/Chronik, Lage, Kontakt) |
| `impressum.html`, `datenschutz.html` | **Platzhalter – vor dem Livegang ausfüllen** |
| `assets/css/style.css` | Gesamtes Styling (Farben oben als Variablen) |
| `assets/js/main.js` | Menü, Mieter-Filter, Mieter-Finder, Formulare, „Adresse kopieren“ |
| `assets/img/`, `assets/logos/`, `assets/fonts/` | Bilder (WebP + JPG/PNG), Mieter-Logos, Schrift (TeX Gyre Heros, selbst gehostet) |
| `functions/api/kontakt.js` | Logik für Kontaktformular und Flächen-Alarm (E-Mail-Versand) |
| `worker/index.js`, `wrangler.jsonc`, `.assetsignore` | Einrichtung als Cloudflare Worker |
| `_headers` | Sicherheits- und Cache-Header für Cloudflare |
| `404.html`, `sitemap.xml`, `robots.txt`, Favicons | Standard-Dateien |

## Lokal ansehen

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```
(Das Formular funktioniert lokal nicht – es braucht die Cloudflare Function.)

## Veröffentlichen (GitHub + Cloudflare)

Das Projekt läuft auf beiden Cloudflare-Varianten:

**A) Cloudflare Worker (so ist es aktuell eingerichtet: Worker `visseo-draft`)**
- Konfiguration steht in `wrangler.jsonc`. Der `name` dort muss exakt dem Worker-Namen in Cloudflare entsprechen.
- `worker/index.js` liefert die Seiten aus und beantwortet `/api/kontakt`.
- `.assetsignore` sorgt dafür, dass Worker-Code, Konfiguration und README nicht öffentlich ausgeliefert werden.
- Jeder Push auf den Haupt-Branch baut und veröffentlicht automatisch (Workers Builds, Deploy-Befehl `npx wrangler deploy`).
- Domain: Worker → Settings → **Domains & Routes** → **Add → Custom domain**.

**B) Cloudflare Pages (Alternative)**
- Workers & Pages → Create → Reiter **Pages** → Connect to Git.
- Framework **None**, Build command leer, Output directory **/**. Pages nutzt automatisch `functions/api/kontakt.js`.
- Domain: Pages-Projekt → **Custom domains**.

## Kontaktformular einrichten (E-Mail-Versand)

Das Formular schickt die Anfrage an `/api/kontakt`. Die Function versendet sie per [Resend](https://resend.com) (kostenloser Tarif reicht).

1. Bei Resend registrieren, Domain `gewerbepark-lonsee.de` verifizieren (DNS-Einträge bei Cloudflare setzen), API-Key erstellen.
2. In Cloudflare: Worker bzw. Pages-Projekt → **Settings** → **Variables and Secrets** (für *Production*):
   - `RESEND_API_KEY` = API-Key (Typ **Secret**)
   - `CONTACT_TO` = Empfängeradresse, z. B. die von Gerrit Korner (mehrere mit Komma)
   - `CONTACT_FROM` = z. B. `Gewerbepark Lonsee <kontakt@gewerbepark-lonsee.de>`
3. Neu deployen (Deployments → Retry), damit die Variablen greifen.

Solange die Variablen fehlen, zeigt das Formular freundlich an, dass man anrufen soll (0174 323 29 49).
Antworten gehen per „Reply-To“ direkt an den Absender. Ein verstecktes Feld hält einfache Spam-Bots ab.
Optional: Cloudflare Turnstile ergänzen, falls doch Spam kommt.

## Vor dem Livegang prüfen

- [ ] **Impressum** und **Datenschutzerklärung** vollständig einfügen (Cloudflare-Hosting, Formular/Resend, WhatsApp- und Google-Maps-Links erwähnen)
- [ ] Adresse von Gewerbepark 1 für „Route planen“ prüfen (`lage.html`; aktuell: „Gewerbepark Lonsee, Luizhausen“)
- [ ] WhatsApp-Nummer bestätigen (aktuell 0174 323 29 49, Link in `kontakt.html`)
- [ ] Mieterliste und Branchen mit dem Kunden abgleichen; Website-Links für RTS und Erich Englisch fehlen
- [ ] Kennzahlen (1.400 m², 1.000 m², 7 Hallentore, Daten der Chronik) bestätigen
- [ ] Domain in `sitemap.xml`, `robots.txt` und den `<link rel="canonical">`-Tags ist `https://gewerbepark-lonsee.de`

## Neue Nachricht veröffentlichen

Die Nachrichten unter **Aktuelles → Nachrichten** stehen in `assets/data/nachrichten.json`.
Die neueste Nachricht erscheint automatisch auch im „Aktuell“-Kasten auf der Startseite.

Neuen Eintrag **oben** in die Liste einfügen (Komma zwischen den Einträgen nicht vergessen):

```json
{
  "datum": "2026-11-03",
  "titel": "Überschrift der Nachricht",
  "standort": "Gewerbepark 1",
  "text": "Erster Absatz.\n\nZweiter Absatz.",
  "bild": "assets/img/mein-bild.jpg",
  "link": "gewerbepark-1.html",
  "linktext": "Zum Gewerbepark 1"
}
```

- Pflicht: `datum` (Format JJJJ-MM-TT) und `titel`. Alles andere ist optional.
- `\n\n` im Text erzeugt einen neuen Absatz.
- Bilder vorher nach `assets/img/` hochladen (JPG, ca. 1600 px breit).
- Nachrichten der letzten 45 Tage bekommen automatisch ein „Neu“-Schild.
- Direktlink auf eine Nachricht: `aktuelles#n-2026-11-03`, auf die Chronik: `aktuelles#chronik`.

## Inhalte ändern

- **Texte:** direkt in der jeweiligen `.html`-Datei. Kopf- und Fußbereich stehen in jeder Datei; bei Änderungen dort alle Seiten anpassen.
- **Farben:** oben in `assets/css/style.css` (`--bronze`, `--ink` usw.).
- **Neuer Mieter:** Logo als PNG in `assets/logos/`, dann in `mieter.html` eine Kachel kopieren und anpassen (`data-gp="1"` oder `"2"` steuert den Filter).
- **Mieter-Finder:** die Punkte in `mieter.html` (`<button class="spot" style="left:…%;top:…%">`) – Position in Prozent des Fassadenfotos.
