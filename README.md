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

## Auf dem eigenen Computer öffnen

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

Die Dateien auf GitHub sind der Quellcode; eine öffentlich gehostete Website ist damit noch nicht eingerichtet. Die `index.html` muss über den Entwicklungsserver geöffnet werden. Ein Doppelklick auf diese Datei startet die Anwendung nicht korrekt.

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
