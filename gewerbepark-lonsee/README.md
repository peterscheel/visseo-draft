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
| `functions/api/kontakt.js` | Cloudflare Pages Function für Kontaktformular und Flächen-Alarm |
| `_headers` | Sicherheits- und Cache-Header für Cloudflare |
| `404.html`, `sitemap.xml`, `robots.txt`, Favicons | Standard-Dateien |

## Lokal ansehen

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```
(Das Formular funktioniert lokal nicht – es braucht die Cloudflare Function.)

## Auf GitHub + Cloudflare Pages veröffentlichen

1. Neues GitHub-Repository anlegen und den Inhalt dieses Ordners hochladen (die Dateien liegen direkt im Root des Repos).
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → Repository auswählen.
3. Build-Einstellungen:
   - Framework preset: **None**
   - Build command: *(leer lassen)*
   - Build output directory: **/**
4. **Save and Deploy**. Die Seite ist danach unter `*.pages.dev` erreichbar.
5. Eigene Domain: im Pages-Projekt → **Custom domains** → `gewerbepark-lonsee.de` (und `www.`) hinzufügen.

Jeder Push auf den Haupt-Branch veröffentlicht automatisch neu.

## Kontaktformular einrichten (E-Mail-Versand)

Das Formular schickt die Anfrage an `/api/kontakt`. Die Function versendet sie per [Resend](https://resend.com) (kostenloser Tarif reicht).

1. Bei Resend registrieren, Domain `gewerbepark-lonsee.de` verifizieren (DNS-Einträge bei Cloudflare setzen), API-Key erstellen.
2. In Cloudflare: Pages-Projekt → **Settings** → **Variables and Secrets** (für *Production*):
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

## Inhalte ändern

- **Texte:** direkt in der jeweiligen `.html`-Datei. Kopf- und Fußbereich stehen in jeder Datei; bei Änderungen dort alle Seiten anpassen.
- **Farben:** oben in `assets/css/style.css` (`--bronze`, `--ink` usw.).
- **Neuer Mieter:** Logo als PNG in `assets/logos/`, dann in `mieter.html` eine Kachel kopieren und anpassen (`data-gp="1"` oder `"2"` steuert den Filter).
- **Mieter-Finder:** die Punkte in `mieter.html` (`<button class="spot" style="left:…%;top:…%">`) – Position in Prozent des Fassadenfotos.
