import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyConfiguration, configurationErrors, defaultConfiguration, emptyWorkspace,
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
