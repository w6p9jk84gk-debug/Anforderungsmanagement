import test from 'node:test';
import assert from 'node:assert/strict';
import {
  migrateWorkspace, projectName, testProjectId, initializeTestRequirements, seedTestRequirements, displayRequirementId, applyConfiguration, configurationErrors, defaultConfiguration, emptyWorkspace,
  exportRequirements, isWorkspace, legacyStorageKey, loadWorkspace, migrateLegacy, storageKey,
} from '../src/model.ts';

const legacyItem = () => ({ id: 'legacy-1', number: 7, title: 'Bestehender Bedarf', description: 'Sanierung Dach', criteria: 'Dicht', status: 'In Bearbeitung', priority: 'Hoch', createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-02T10:00:00.000Z' });
const fixture = () => migrateLegacy([legacyItem()]);
const storage = values => ({ getItem: key => values[key] ?? null });

test('neue Arbeitsbereiche haben unabhängige, vollständige Konfigurationen', () => {
  const first = emptyWorkspace(); const second = emptyWorkspace();
  assert.equal(isWorkspace(first), true);
  first.configuration.roles[0].name = 'Geändert';
  assert.equal(second.configuration.roles[0].name, 'Antragstellende');
});
test('bisherige Daten werden vollständig dem passenden Workflow-Schritt zugeordnet', () => {
  const original = legacyItem(); const workspace = migrateLegacy([original]);
  assert.equal(workspace.requirements[0].workflowStepId, 'step-process');
  assert.equal(workspace.requirements[0].status, 'status-active');
  assert.equal(workspace.requirements[0].criteria, original.criteria);
  assert.equal(workspace.nextNumber, 8);
  assert.equal(original.status, 'In Bearbeitung');
  assert.equal(isWorkspace(workspace), true);
});
test('leere bisherige Daten bleiben leer', () => {
  assert.equal(migrateLegacy([]).requirements.length, 0);
});
test('doppelte Kennungen oder Nummern in bisherigen Daten werden abgewiesen', () => {
  assert.throws(() => migrateLegacy([legacyItem(), legacyItem()]));
  assert.throws(() => migrateLegacy([legacyItem(), { ...legacyItem(), id: 'other' }]));
});
test('unbekannte bisherige Status werden nicht stillschweigend ersetzt', () => {
  assert.throws(() => migrateLegacy([{ ...legacyItem(), status: 'Unbekannt' }]));
});
test('Umbenennen eines Status und einer Rolle erhält die Anforderungen', () => {
  const workspace = fixture(); const config = structuredClone(workspace.configuration);
  config.statuses[1].name = 'In fachlicher Prüfung'; config.roles[1].name = 'Projektleitung';
  const next = applyConfiguration(workspace, config);
  assert.equal(next.requirements[0].id, 'legacy-1');
  assert.equal(next.requirements[0].status, 'status-active');
  assert.equal(exportRequirements(next)[0].status, 'In fachlicher Prüfung');
  assert.deepEqual(exportRequirements(next)[0].roles, ['Projektleitung']);
  assert.equal(workspace.configuration.statuses[1].name, 'In Bearbeitung');
});
test('geänderte Statuszuweisung wird auf bestehende Anforderungen angewandt', () => {
  const workspace = fixture(); const config = structuredClone(workspace.configuration);
  config.steps[1].statusId = 'status-done';
  const timestamp = '2026-02-01T12:00:00.000Z';
  const next = applyConfiguration(workspace, config, timestamp);
  assert.equal(next.requirements[0].status, 'status-done');
  assert.equal(next.requirements[0].updatedAt, timestamp);
  assert.equal(isWorkspace(next), true);
});
test('Verschieben eines Schritts erhält seine Zuordnung', () => {
  const workspace = fixture(); const config = structuredClone(workspace.configuration);
  config.steps.reverse();
  assert.equal(applyConfiguration(workspace, config).requirements[0].workflowStepId, 'step-process');
});
test('Schritte mit Anforderungen dürfen nicht gelöscht werden', () => {
  const workspace = fixture(); const config = structuredClone(workspace.configuration);
  config.steps = config.steps.filter(step => step.id !== 'step-process');
  assert.throws(() => applyConfiguration(workspace, config), /bestehenden Anforderungen/);
});
test('doppelte Namen werden auch mit Leerzeichen und anderer Großschreibung erkannt', () => {
  const config = defaultConfiguration();
  config.statuses[1].name = ' OFFEN ';
  config.roles[1].name = 'antragstellende';
  assert.equal(configurationErrors(config).filter(error => error.includes('eindeutig')).length, 2);
});
test('fehlende Status-, Rollen- und Schrittdefinitionen werden abgewiesen', () => {
  for (const field of ['statuses', 'roles', 'steps']) {
    const config = defaultConfiguration(); config[field] = [];
    assert.ok(configurationErrors(config).length > 0);
  }
});
test('ein Schritt benötigt mindestens eine existierende Rolle und einen existierenden Status', () => {
  const config = defaultConfiguration();
  config.steps[0].roleIds = []; config.steps[1].roleIds = ['unknown']; config.steps[2].statusId = 'unknown';
  assert.equal(configurationErrors(config).length, 3);
});
test('doppelte Rollenzuweisungen sind ungültig', () => {
  const config = defaultConfiguration(); config.steps[0].roleIds.push(config.steps[0].roleIds[0]);
  assert.ok(configurationErrors(config).some(error => error.includes('Rolle zuweisen')));
});
test('Anforderungen mit widersprüchlichem Schritt und Status werden abgewiesen', () => {
  const workspace = fixture(); workspace.requirements[0].status = 'status-open';
  assert.equal(isWorkspace(workspace), false);
});
test('fortlaufende Nummern dürfen nicht auf bereits verwendete Werte zurückfallen', () => {
  const workspace = fixture(); workspace.nextNumber = 7;
  assert.equal(isWorkspace(workspace), false);
});
test('gespeicherter zAMBI-Arbeitsbereich hat Vorrang vor der bisherigen Sicherung', () => {
  const workspace = fixture();
  const result = loadWorkspace(storage({ [storageKey]: JSON.stringify(workspace), [legacyStorageKey]: 'broken' }));
  assert.equal(result.error, null); assert.deepEqual(result.workspace, workspace); assert.equal(result.migrated, false);
});
test('bisherige Browserdaten werden ohne Schreibzugriff übernommen', () => {
  const raw = JSON.stringify([legacyItem()]);
  const result = loadWorkspace(storage({ [legacyStorageKey]: raw }));
  assert.equal(result.error, null); assert.equal(result.migrated, true); assert.equal(result.legacyRaw, raw);
});
test('beschädigte neue Daten führen nicht zu einem unbemerkten Rückfall auf alte Daten', () => {
  const result = loadWorkspace(storage({ [storageKey]: '{broken', [legacyStorageKey]: JSON.stringify([legacyItem()]) }));
  assert.ok(result.error); assert.equal(result.raw, '{broken'); assert.equal(result.workspace.requirements.length, 0);
});
test('fehlender Speicherzugriff wird als Fehler gemeldet', () => {
  const result = loadWorkspace({ getItem: () => { throw new Error('Blocked'); } });
  assert.ok(result.error);
});


test('alle 19 Testanforderungen werden exakt geladen und bleiben nach erneutem Laden eindeutig', () => {
  const expected = ['AF00', 'AF0', 'AF1', 'AF2', 'AF3', 'AFX', 'AFY', 'AF4', 'AF5', 'AF7', 'AF8', 'AF9', 'AF10', 'AF11', 'AF12', 'AF12.1', 'AF13', 'AF14', 'AF15'];
  const workspace = seedTestRequirements(emptyWorkspace());
  assert.equal(isWorkspace(workspace), true);
  assert.deepEqual(workspace.requirements.map(displayRequirementId), expected);
  assert.equal(workspace.requirements.length, 19);
  for (const item of workspace.requirements) {
    assert.equal(item.isTestData, true);
    assert.ok(item.description.startsWith(`Das System ${item.verbindlichkeit === 'SOLL' ? 'SOLLTE' : item.verbindlichkeit}`));
    assert.equal(item.status, workspace.configuration.steps[0].statusId);
  }
  const reloaded = loadWorkspace(storage({ [storageKey]: JSON.stringify(workspace) }));
  assert.equal(reloaded.error, null);
  assert.deepEqual(seedTestRequirements(reloaded.workspace), workspace);
  assert.equal(exportRequirements(workspace)[0].anforderungNr, 'AF00');
});
test('Seeding erhält bestehende und bearbeitete Daten und ergänzt nur fehlende AF-Nummern', () => {
  const original = fixture();
  const seeded = seedTestRequirements(original);
  assert.deepEqual(seeded.requirements[0], original.requirements[0]);
  assert.equal(original.requirements.length, 1);
  seeded.requirements[1].description = 'Manuell bearbeitet';
  seeded.requirements = seeded.requirements.filter(item => item.anforderungNr !== 'AFY');
  seeded.configuration.steps.reverse();
  const next = seedTestRequirements(seeded);
  assert.equal(next.requirements.length, 20);
  assert.equal(next.requirements[1].description, 'Manuell bearbeitet');
  assert.equal(next.requirements.at(-1).anforderungNr, 'AFY');
  assert.equal(next.requirements.at(-1).workflowStepId, seeded.configuration.steps[0].id);
  assert.equal(isWorkspace(next), true);
});
test('ungültige Verbindlichkeiten und doppelte AF-Nummern werden abgewiesen', () => {
  const workspace = seedTestRequirements(emptyWorkspace());
  workspace.requirements[0].verbindlichkeit = 'SOLLTE';
  assert.equal(isWorkspace(workspace), false);
  workspace.requirements[0].verbindlichkeit = 'SOLL';
  workspace.requirements[1].anforderungNr = 'AF00';
  assert.equal(isWorkspace(workspace), false);
});

test('automatische Initialisierung ergänzt auch bestehende Arbeitsbereiche genau einmal', () => {
  const existing = fixture();
  const first = initializeTestRequirements(existing);
  assert.equal(first.requirements.length, 20);
  assert.deepEqual(first.requirements[0], existing.requirements[0]);
  assert.equal(first.testDataVersion, 1);
  const restored = loadWorkspace(storage({ [storageKey]: JSON.stringify(first) })).workspace;
  assert.equal(initializeTestRequirements(restored), restored);
  assert.equal(initializeTestRequirements(emptyWorkspace()).requirements.length, 19);
});
test('gelöschte Testanforderungen werden nach Initialisierung nur auf Wunsch wieder ergänzt', () => {
  const workspace = initializeTestRequirements(emptyWorkspace());
  workspace.requirements = workspace.requirements.filter(item => item.anforderungNr !== 'AF00');
  assert.equal(initializeTestRequirements(workspace).requirements.length, 18);
  assert.equal(seedTestRequirements(workspace).requirements.length, 19);
  assert.equal(isWorkspace(workspace), true);
});


function previousWorkspace() {
  const workspace = seedTestRequirements(fixture());
  workspace.version = 1;
  delete workspace.configuration.projects;
  workspace.requirements.forEach(item => { delete item.projectId; });
  return workspace;
}
test('Migration ordnet vorhandene Testdaten zAMBI zu und erhält alle bisherigen Inhalte', () => {
  const before = previousWorkspace();
  const original = structuredClone(before);
  const raw = JSON.stringify(before);
  const result = loadWorkspace(storage({ [storageKey]: raw }));
  assert.equal(result.error, null);
  assert.equal(result.migrated, true);
  assert.equal(result.raw, raw);
  assert.equal(isWorkspace(result.workspace), true);
  assert.deepEqual(before, original);
  assert.equal(result.workspace.version, 2);
  assert.equal(result.workspace.requirements[0].projectId, null);
  assert.equal(result.workspace.requirements.filter(item => item.projectId === testProjectId).length, 19);
  assert.equal(result.workspace.nextNumber, before.nextNumber);
  for (let i = 0; i < before.requirements.length; i++) {
    const { projectId, ...rest } = result.workspace.requirements[i];
    assert.deepEqual(rest, before.requirements[i]);
  }
});
test('erneutes Laden speichert und erhält geänderte Projektzuordnungen ohne weitere Migration', () => {
  const workspace = migrateWorkspace(previousWorkspace());
  workspace.configuration.projects.push({ id: 'bau', name: 'Bauprojekt' });
  workspace.requirements[1].projectId = 'bau';
  const result = loadWorkspace(storage({ [storageKey]: JSON.stringify(workspace) }));
  assert.equal(result.error, null);
  assert.equal(result.migrated, false);
  assert.deepEqual(initializeTestRequirements(result.workspace), workspace);
});
test('Migration beschädigter Arbeitsbereiche bleibt gesperrt und bewahrt Rohdaten', () => {
  const workspace = previousWorkspace();
  workspace.requirements[0].workflowStepId = 'unbekannt';
  const raw = JSON.stringify(workspace);
  assert.throws(() => migrateWorkspace(workspace));
  const result = loadWorkspace(storage({ [storageKey]: raw }));
  assert.ok(result.error);
  assert.equal(result.raw, raw);
});
test('neue Testanforderungen erhalten zAMBI und Seeding erzeugt keine doppelten Projekte', () => {
  const workspace = seedTestRequirements(emptyWorkspace());
  assert.ok(workspace.requirements.every(item => item.projectId === testProjectId));
  assert.deepEqual(seedTestRequirements(workspace), workspace);
  assert.equal(workspace.configuration.projects.length, 1);
  const withoutProjects = emptyWorkspace();
  withoutProjects.configuration.projects = [];
  const seeded = seedTestRequirements(withoutProjects);
  assert.equal(seeded.configuration.projects.length, 1);
  assert.equal(isWorkspace(seeded), true);
  // Ein zuvor umbenanntes Projekt behält seine Kennung und seinen neuen Namen.
  workspace.configuration.projects[0].name = 'zAMBI neu';
  workspace.requirements.pop();
  const restored = seedTestRequirements(workspace);
  assert.equal(restored.configuration.projects.length, 1);
  assert.equal(restored.configuration.projects[0].name, 'zAMBI neu');
  assert.ok(restored.requirements.every(item => item.projectId === testProjectId));
});
test('Umbenennen eines Projekts erhält Zuordnungen und erscheint im Export', () => {
  const workspace = seedTestRequirements(emptyWorkspace());
  const configuration = structuredClone(workspace.configuration);
  configuration.projects[0].name = 'zAMBI Weiterentwicklung';
  const next = applyConfiguration(workspace, configuration);
  assert.equal(next.requirements[0].projectId, testProjectId);
  assert.equal(projectName(next.configuration, testProjectId), 'zAMBI Weiterentwicklung');
  assert.equal(exportRequirements(next)[0].project, 'zAMBI Weiterentwicklung');
  assert.equal(exportRequirements(next)[0].projectId, testProjectId);
  assert.equal(workspace.configuration.projects[0].name, 'zAMBI');
});
test('verwendete Projekte sind vor Löschen geschützt, unbenutzte können entfernt werden', () => {
  const workspace = seedTestRequirements(emptyWorkspace());
  const config = { ...workspace.configuration, projects: [] };
  assert.throws(() => applyConfiguration(workspace, config), /Projekt mit bestehenden Anforderungen/);
  workspace.requirements = workspace.requirements.map(item => ({ ...item, projectId: null }));
  const next = applyConfiguration(workspace, config);
  assert.equal(isWorkspace(next), true);
  assert.equal(projectName(next.configuration, null), 'Ohne Projekt');
});
test('Projektdefinitionen müssen gültig und eindeutig sein; eine leere Liste ist zulässig', () => {
  const workspace = emptyWorkspace();
  workspace.configuration.projects = [];
  assert.equal(isWorkspace(workspace), true);
  for (const projects of [
    [{ id: 'a', name: '' }],
    [{ id: '', name: 'Projekt' }],
    [{ id: 'a', name: 'zAMBI' }, { id: 'b', name: ' ZAMBI ' }],
    [{ id: 'a', name: 'A' }, { id: 'a', name: 'B' }],
    [{ id: 'a', name: 'x'.repeat(81) }],
  ]) {
    workspace.configuration.projects = projects;
    assert.equal(isWorkspace(workspace), false);
  }
});
test('Anforderungen dürfen ausschliesslich einem vorhandenen Projekt oder keinem zugeordnet sein', () => {
  const workspace = fixture();
  workspace.requirements[0].projectId = 'unbekannt';
  assert.equal(isWorkspace(workspace), false);
  delete workspace.requirements[0].projectId;
  assert.equal(isWorkspace(workspace), false);
  workspace.requirements[0].projectId = null;
  assert.equal(isWorkspace(workspace), true);
});
