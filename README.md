# Anforderungsmanagement

Eine deutschsprachige Web-App zum Erfassen und Verwalten von Anforderungen, gebaut mit React, TypeScript und Vite.

## Funktionen

- Anforderungen mit Titel, Beschreibung und Akzeptanzkriterien anlegen, bearbeiten und nach Bestätigung löschen.
- Status: Offen, In Bearbeitung, Abgeschlossen.
- Prioritäten: Hoch, Mittel, Niedrig.
- Volltextsuche, Status- und Prioritätsfilter sowie Sortierung nach Erstellreihenfolge, Priorität oder Titel.
- Übersicht mit Gesamtzahl und Fortschritt.
- Lokale Speicherung im Browser und JSON-Export als Datensicherung.
- Responsive Oberfläche und per Tastatur bedienbare Dialoge.

## Im Browser öffnen (GitHub Pages)

Nach erfolgreicher Veröffentlichung öffnest du die Anwendung direkt unter:

**https://w6p9jk84gk-debug.github.io/Anforderungsmanagement/**

Du brauchst dafür nichts auf deinem Computer zu installieren. Anforderungen werden weiterhin nur im Browser gespeichert. Daten von einer zuvor lokal gestarteten App werden nicht automatisch auf diese Adresse übertragen.

### Einmalige Aktivierung auf GitHub

1. Öffne das [Repository](https://github.com/w6p9jk84gk-debug/Anforderungsmanagement) und klicke oben auf **Settings** (Einstellungen).
2. Wähle links **Pages** (unter **Code and automation**).
3. Wähle unter **Build and deployment → Source** den Eintrag **GitHub Actions**.
4. Öffne oben **Actions**. Falls GitHub zuerst eine Schaltfläche zur Aktivierung von Workflows zeigt, aktiviere sie. Wähle links **Publish to GitHub Pages**.
5. Klicke **Run workflow**, wähle den Branch **main** und bestätige mit **Run workflow**. Falls bereits ein erfolgreicher Lauf für den aktuellen Commit angezeigt wird, ist dieser Schritt nicht erforderlich.
6. Warte, bis **Build application** und **Deploy website** grün sind. Öffne anschließend die Adresse oben. Im Workflow-Ergebnis steht die tatsächliche Website-Adresse beim Deployment ebenfalls bereit.

Der Workflow in `.github/workflows/deploy-pages.yml` veröffentlicht zukünftige Änderungen an `main` automatisch. Er installiert die Abhängigkeiten aus der Lockdatei, prüft TypeScript, baut die Anwendung und lädt ausschließlich `dist/` zu GitHub Pages hoch. Die Actions sind auf feste Commit-Versionen gesetzt. Der Vite-Basispfad ist `/Anforderungsmanagement/`.

## Optional: Auf dem eigenen Computer öffnen

1. Installiere **Node.js 24 LTS** von [nodejs.org](https://nodejs.org/). Das Installationsprogramm installiert auch `npm`, das die benötigten Pakete lädt. Öffne nach der Installation ein neues Terminal.
2. Öffne das [GitHub-Repository](https://github.com/w6p9jk84gk-debug/Anforderungsmanagement). Wähle **Code → Download ZIP** und entpacke die ZIP-Datei vollständig. Alternativ kannst du das Repository mit Git klonen.
3. Öffne ein Terminal im entpackten Projektordner. In diesem Ordner muss die Datei `package.json` liegen. Unter Windows kannst du im Explorer mit der rechten Maustaste in den Ordner klicken und **Im Terminal öffnen** wählen. In Visual Studio Code funktioniert **Datei → Ordner öffnen**, anschließend **Terminal → Neues Terminal**.
4. Führe diese Befehle nacheinander aus. Warte jeweils, bis der erste Befehl fertig ist:

   ```sh
   npm ci
   npm run dev -- --port 5173 --strictPort
   ```

5. Lass das Terminal geöffnet. Gib im Browser `http://localhost:5173` in die Adresszeile ein. Mit **Neue Anforderung** kannst du den ersten Eintrag erstellen.

Der erste Befehl installiert die festgelegten Abhängigkeiten und benötigt Internetzugang. Der zweite startet die Anwendung auf deinem Computer. Zum Beenden drückst du im Terminal **Strg+C**. Beim nächsten Start genügt der zweite Befehl. Sollte Port 5173 bereits belegt sein, beende zuerst eine eventuell noch laufende Instanz.

Die Dateien im Repository sind der Quellcode; für die Nutzung ohne Installation verwende GitHub Pages wie oben beschrieben. Für den lokalen Betrieb muss die `index.html` über den Entwicklungsserver geöffnet werden. Ein Doppelklick auf diese Datei startet die Anwendung nicht korrekt.

## Entwicklung in der Cloud-Umgebung

Voraussetzung: Node.js ab 22.12 (in der Cloud-Umgebung: Node.js 24).

```sh
cd /workspace/Anforderungsmanagement
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173 --strictPort
```

Außerhalb der Cloud-Umgebung das eigene Checkout-Verzeichnis und bei Bedarf den Standard-npm-Cache verwenden (`npm ci`).

## Produktionsbuild

```sh
npm run build
npm run preview -- --port 4173 --strictPort
```

Der Build prüft TypeScript und erstellt die statischen Dateien in `dist/`. Der Vite-Entwicklungsserver ist für Entwicklung vorgesehen. Für eine Veröffentlichung die Dateien aus `dist/` über einen statischen Webhost bereitstellen.

## Datenspeicherung

Die Anwendung startet ohne Beispieldaten. Daten liegen unter `anforderungsmanagement.requirements.v1` im `localStorage` des jeweiligen Browsers. Es gibt keinen Server, keine Anmeldung und keine Synchronisierung zwischen Browsern, Geräten oder mehreren geöffneten Tabs. Gleichzeitiges Bearbeiten in mehreren Tabs kann Änderungen überschreiben. Eine andere Domain oder ein anderer Port hat einen separaten Speicher. Das Löschen der Browserdaten entfernt auch die Anforderungen.

Über **Exportieren** lässt sich der aktuelle Stand als JSON herunterladen. Ein JSON-Import ist noch nicht enthalten. Bei ungültigen vorhandenen Browserdaten werden diese nicht automatisch überschrieben; die Anwendung zeigt einen Fehler. Schlägt das Speichern fehl, bleibt der Bearbeitungsdialog mit der Eingabe geöffnet.

## Cloud-Umgebung

Das vorhandene Checkout verwenden; ein zusätzliches Git-Worktree ist nicht erforderlich. Abhängigkeiten und Builddateien können erhalten bleiben, der Entwicklungsserver muss nach einem Neustart erneut gestartet werden. Es sind keine API-Schlüssel, Datenbank oder weiteren Dienste erforderlich.
