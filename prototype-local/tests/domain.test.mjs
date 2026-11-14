import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationInput, scoresInput, ranking, emailJobs } from '../src/domain.mjs';
import { config } from '../src/config.mjs';

test('Inscription : normalisation, noms internationaux et validation des champs', () => {
  assert.deepEqual(registrationInput({ first_name: ' Éloïse ', last_name: "D’Angelo", email: ' ELOISE@EXAMPLE.TEST ' }), { first_name: 'Éloïse', last_name: 'D’Angelo', email: 'eloise@example.test' });
  for (const invalid of [{}, { first_name: 'A', last_name: 'B', email: 'incorrect' }, { first_name: '<script>', last_name: 'B', email: 'a@b.test' }, { first_name: 'a'.repeat(81), last_name: 'B', email: 'a@b.test' }]) assert.throws(() => registrationInput(invalid), { status: 422 });
});
test('Notation : trois entiers obligatoires, zéro admis, hors barème refusé', () => {
  assert.deepEqual(scoresInput({ taste: 0, texture: 10, presentation: 5 }), { taste: 0, texture: 10, presentation: 5 });
  for (const taste of [-1, 11, 2.5, '8', null, NaN]) assert.throws(() => scoresInput({ taste, texture: 4, presentation: 5 }), { status: 422 });
  assert.throws(() => scoresInput({ taste: 8, texture: 4 }), { status: 422 });
});
test('Classement : somme sur 30, rangs 1/1/3, non évalués et retirés exclus', () => {
  const p = (id, taste, status = 'registered') => ({ id, status, scores: taste === null ? null : { taste, texture: 5, presentation: 5 } });
  const rows = ranking([p('b', 10), p('a', 10), p('c', 8), p('d', null), p('e', 10, 'withdrawn')]);
  assert.deepEqual(rows.map(r => [r.id, r.total, r.rank, r.tied]), [['a', 20, 1, true], ['b', 20, 1, true], ['c', 18, 3, false]]);
});
test('Rappel : 24 h avant en UTC, inscription tardive sans rappel rétroactif', () => {
  const cfg = config({ EVENT_AT: '2026-12-04T15:00:00+01:00' });
  const p = { id: 'p', first_name: 'Camille', email: 'c@example.test' };
  const jobs = emailJobs(p, cfg, new Date('2026-12-01T12:00:00Z'));
  assert.equal(jobs[1].due_at, '2026-12-03T14:00:00.000Z');
  assert.equal(jobs[1].state, 'pending');
  assert.match(jobs[0].content, /fictive/);
  assert.equal(emailJobs(p, cfg, new Date('2026-12-03T14:00:00Z'))[1].state, 'skipped');
});
test('La configuration refuse les secrets manquants et SQLite sur Vercel', () => {
  assert.throws(() => config({ EMAIL_MODE: 'brevo' }), /Brevo/);
  assert.throws(() => config({ DATA_BACKEND: 'supabase' }), /Supabase/);
  assert.throws(() => config({ VERCEL: '1' }), /SQLite/);
  assert.throws(() => config({ EVENT_AT: 'inconnue' }), /ISO/);
});
