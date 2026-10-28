# zAMBI

**zentrales Anforderungsmanagement Bauten Immobilien** – eine deutschsprachige Web-App zum Erfassen und Verwalten von Anforderungen mit konfigurierbaren Status, Rollen und Workflow-Schritten. Gebaut mit React, TypeScript und Vite.

## Funktionen

- Anforderungen mit Titel, Beschreibung und Akzeptanzkriterien anlegen, bearbeiten und nach Bestätigung löschen.
- Status mit frei wählbaren Bezeichnungen und Gruppen für die Fortschrittsübersicht.
- Administration für Status und Rollen mit Aufgabenbeschreibungen.
- Workflow-Editor: Schritte anlegen, umbenennen, verschieben und mit einem Status sowie einer oder mehreren Rollen verknüpfen.
- Anforderungen einem Workflow-Schritt zuweisen; zugehöriger Status und zuständige Rollen werden automatisch angezeigt.
- Prioritäten: Hoch, Mittel, Niedrig.
- Volltextsuche, Status- und Prioritätsfilter sowie Sortierung nach Erstellreihenfolge, Priorität oder Titel.
- Übersicht mit Gesamtzahl und Fortschritt.
- Lokale Speicherung im Browser und JSON-Export als Datensicherung.
- Besser lesbare, responsive Oberfläche mit dauerhaft erreichbarer Administration auch auf Mobilgeräten.
- Schutz verwendeter Workflow-Schritte vor dem Löschen und Prüfung der Konfiguration vor dem Speichern.

## Status, Rollen und Workflow konfigurieren

1. Öffne **Administration** in der Hauptnavigation.
2. Unter **Status** kannst du Bezeichnungen ändern und neue Status hinzufügen. Weise jedem Status eine Gruppe zu: Offen, In Bearbeitung oder Abgeschlossen. Diese Gruppen bestimmen die Zähler in der Übersicht.
3. Unter **Rollen** verwaltest du die Zuständigkeiten und optional deren Aufgabenbeschreibung.
4. Im **Workflow-Editor** legst du Schritte an. Jeder Schritt erhält einen Namen, einen Status und mindestens eine zuständige Rolle. Mit den Pfeilen änderst du die Reihenfolge.
5. Klicke **Konfiguration speichern**, um die Änderungen gemeinsam zu übernehmen. Beim Verlassen mit ungespeicherten Änderungen fragt zAMBI nach. **Änderungen verwerfen** stellt die zuletzt gespeicherte Konfiguration wieder her.

Neue Anforderungen beginnen im ersten Workflow-Schritt. Im Anforderungsdialog kannst du den Schritt auswählen oder mit **Nächster Schritt** weitergehen und anschließend speichern. Die Auswahl eines Schritts bestimmt den Status und die angezeigten zuständigen Rollen. Ändert die Administration die Statuszuweisung eines Schritts, gilt die neue Zuweisung auch für bestehende Anforderungen in diesem Schritt.

Status und Rollen lassen sich umbenennen, ohne die Zuordnungen zu verlieren. Zum Löschen eines verwendeten Status oder einer Rolle müssen zuerst die entsprechenden Zuweisungen im Workflow entfernt oder ersetzt werden. Ein Workflow-Schritt mit Anforderungen kann erst entfernt werden, wenn die Anforderungen einem anderen Schritt zugeordnet wurden.

**Diese Version ist eine lokale Konfiguration ohne Anmeldung.** Rollen beschreiben Zuständigkeiten; sie erzwingen keine Zugriffsrechte. Jede Person mit Zugriff auf diesen Browser kann die Administration nutzen. Eine gemeinsame Datenhaltung und geschützte Administrator-Zugänge erfordern später einen Backend-Dienst.

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

## Tests

```sh
npm test
```

Die Tests prüfen die Übernahme bisheriger Browserdaten, stabile Status- und Rollenzuordnungen, geänderte Workflow-Zuweisungen, das Verhindern ungültiger Konfigurationen und den Schutz bestehender Anforderungen. Der GitHub-Pages-Workflow führt die Tests vor dem Build aus.

## Datenspeicherung

Die Anwendung startet ohne Beispielanforderungen, aber mit einer anpassbaren Ausgangskonfiguration: Erfassung → Bearbeitung → Abschluss und den Rollen Antragstellende, Fachprüfung und Freigabe. Anforderungen und Konfiguration liegen gemeinsam unter `zambi.workspace.v1` im `localStorage` des jeweiligen Browsers. Konfiguration und Anforderungen werden in einem einzigen Schreibvorgang gespeichert.

Bisherige Anforderungen unter `anforderungsmanagement.requirements.v1` werden beim ersten Öffnen automatisch gelesen und den passenden Standardschritten zugeordnet, sofern noch kein neuer zAMBI-Arbeitsbereich existiert. Die bisherige Speicherung bleibt als Sicherung unverändert erhalten. Erst beim nächsten Speichern wird der neue Arbeitsbereich angelegt. Vorhandene fehlerhafte zAMBI-Daten führen nicht zu einem unbemerkten Rückfall auf alte Daten; stattdessen werden Änderungen gesperrt und eine Fehlermeldung angezeigt.

Es gibt keinen Server, keine Anmeldung und keine automatische Synchronisierung zwischen Browsern, Geräten oder mehreren geöffneten Tabs. Erkennt zAMBI vor dem Speichern Änderungen durch einen anderen Tab, blockiert es den Schreibvorgang und fordert zum Neuladen auf. Am besten in einem Tab arbeiten. Eine andere Domain oder ein anderer Port hat einen separaten Speicher. Das Löschen der Browserdaten entfernt auch Anforderungen und Konfiguration.

Über **Daten exportieren** lädst du die Anforderungen als JSON-Liste mit lesbaren Status-, Schritt- und Rollennamen herunter. In der Administration exportiert **Konfiguration exportieren** die zuletzt gespeicherten Status, Rollen und Workflow-Schritte. Ein JSON-Import ist noch nicht enthalten. Schlägt das Speichern fehl, bleiben der Bearbeitungsdialog beziehungsweise der Konfigurationsentwurf mit den Eingaben geöffnet.

## Cloud-Umgebung

Das vorhandene Checkout verwenden; ein zusätzliches Git-Worktree ist nicht erforderlich. Abhängigkeiten und Builddateien können erhalten bleiben, der Entwicklungsserver muss nach einem Neustart erneut gestartet werden. Es sind keine API-Schlüssel, Datenbank oder weiteren Dienste erforderlich.
