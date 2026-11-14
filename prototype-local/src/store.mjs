import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { HttpError } from './domain.mjs';
import { digest, token, hashPassword, verifyPassword } from './security.mjs';

export async function createStore(cfg) {
  if (cfg.backend === 'supabase') return new SupabaseStore(cfg);
  const { DatabaseSync } = await import('node:sqlite');
  mkdirSync(dirname(cfg.databasePath), { recursive: true });
  return new SqliteStore(new DatabaseSync(cfg.databasePath));
}

export class SqliteStore {
  constructor(db) {
    this.db = db;
    db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE, status TEXT NOT NULL DEFAULT 'registered' CHECK(status IN ('registered','withdrawn')),
        created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS team_users (
        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('organizer','jury')));
      CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES team_users(id), expires_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS scores (
        participant_id TEXT PRIMARY KEY REFERENCES participants(id), jury_id TEXT NOT NULL REFERENCES team_users(id),
        taste INTEGER NOT NULL CHECK(taste BETWEEN 0 AND 10), texture INTEGER NOT NULL CHECK(texture BETWEEN 0 AND 10),
        presentation INTEGER NOT NULL CHECK(presentation BETWEEN 0 AND 10), updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS email_jobs (
        id TEXT PRIMARY KEY, participant_id TEXT NOT NULL REFERENCES participants(id), recipient TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('confirmation','reminder')), subject TEXT NOT NULL, content TEXT NOT NULL,
        due_at TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('pending','processing','simulated','accepted','failed','uncertain','skipped')),
        attempts INTEGER NOT NULL DEFAULT 0, message_id TEXT, last_error TEXT, processed_at TEXT,
        UNIQUE(participant_id,kind));
      CREATE INDEX IF NOT EXISTS email_due ON email_jobs(state,due_at);`);
  }
  async createRegistration(participant, jobs) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('INSERT INTO participants(id,first_name,last_name,email,status,created_at) VALUES (?,?,?,?,?,?)')
        .run(participant.id, participant.first_name, participant.last_name, participant.email, 'registered', participant.created_at);
      for (const job of jobs) this.db.prepare('INSERT INTO email_jobs(id,participant_id,recipient,kind,subject,content,due_at,state,last_error) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(randomUUID(), job.participant_id, job.recipient, job.kind, job.subject, job.content, job.due_at, job.state, job.last_error || null);
      this.db.exec('COMMIT');
      return participant.id;
    } catch (error) {
      this.db.exec('ROLLBACK');
      if (String(error.message).includes('UNIQUE constraint failed: participants.email')) throw new HttpError(409, 'Cette adresse possède déjà une inscription. Contactez l’organisation pour la modifier.');
      throw error;
    }
  }
  async listParticipants() {
    return this.db.prepare('SELECT p.*, s.taste,s.texture,s.presentation,s.updated_at FROM participants p LEFT JOIN scores s ON s.participant_id=p.id ORDER BY p.created_at DESC').all()
      .map(({ taste, texture, presentation, updated_at, ...p }) => ({ ...p, scores: taste === null ? null : { taste, texture, presentation, updated_at } }));
  }
  async updateStatus(id, status) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = this.db.prepare('UPDATE participants SET status=? WHERE id=?').run(status, id);
      if (!result.changes) throw new HttpError(404, 'Participant introuvable.');
      if (status === 'withdrawn') this.db.prepare("UPDATE email_jobs SET state='skipped',last_error='Participation retirée' WHERE participant_id=? AND state='pending'").run(id);
      this.db.exec('COMMIT');
    } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  async saveScores(id, scores, user) {
    const participant = this.db.prepare('SELECT status FROM participants WHERE id=?').get(id);
    if (!participant) throw new HttpError(404, 'Participant introuvable.');
    if (participant.status !== 'registered') throw new HttpError(409, 'Cette participation a été retirée.');
    this.db.prepare(`INSERT INTO scores(participant_id,jury_id,taste,texture,presentation,updated_at) VALUES (?,?,?,?,?,?)
      ON CONFLICT(participant_id) DO UPDATE SET jury_id=excluded.jury_id,taste=excluded.taste,texture=excluded.texture,presentation=excluded.presentation,updated_at=excluded.updated_at`)
      .run(id, user.id, scores.taste, scores.texture, scores.presentation, new Date().toISOString());
  }
  async listEmails() { return this.db.prepare('SELECT * FROM email_jobs ORDER BY due_at DESC').all(); }
  async claimEmails(now, participantId = null) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const rows = this.db.prepare("SELECT j.* FROM email_jobs j JOIN participants p ON p.id=j.participant_id WHERE j.state='pending' AND j.due_at<=? AND p.status='registered' AND (? IS NULL OR j.participant_id=?) ORDER BY j.due_at LIMIT 2").all(now, participantId, participantId);
      for (const row of rows) this.db.prepare("UPDATE email_jobs SET state='processing', attempts=attempts+1, processed_at=? WHERE id=?").run(now, row.id);
      this.db.exec('COMMIT');
      return rows;
    } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  async finishEmail(id, result) {
    this.db.prepare('UPDATE email_jobs SET state=?,message_id=?,last_error=?,processed_at=? WHERE id=?')
      .run(result.state, result.message_id || null, result.last_error || null, new Date().toISOString(), id);
  }
  async createUser(email, password, role) {
    if (!['organizer', 'jury'].includes(role)) throw new Error('Rôle invalide');
    this.db.prepare('INSERT INTO team_users(id,email,password_hash,role) VALUES (?,?,?,?)').run(randomUUID(), email.toLowerCase(), hashPassword(password), role);
  }
  async login(email, password) {
    const user = this.db.prepare('SELECT * FROM team_users WHERE email=?').get(email.toLowerCase());
    const fallback = '00000000000000000000000000000000:' + '0'.repeat(128);
    if (!verifyPassword(password, user?.password_hash || fallback) || !user) throw new HttpError(401, 'Identifiants incorrects.');
    const value = token();
    this.db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(new Date().toISOString());
    this.db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(value), user.id, new Date(Date.now() + 3600_000).toISOString());
    return { value, user: { id: user.id, role: user.role, email: user.email } };
  }
  async user(value) {
    return value ? this.db.prepare('SELECT u.id,u.email,u.role FROM sessions s JOIN team_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(digest(value), new Date().toISOString()) : null;
  }
  async logout(value) { if (value) this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(value)); }
  close() { this.db.close(); }
}

export class SupabaseStore {
  constructor(cfg) { this.cfg = cfg; }
  async call(path, { method = 'GET', body, auth, anon = false, headers = {} } = {}) {
    const key = anon ? this.cfg.anonKey : this.cfg.serviceKey;
    const response = await fetch(this.cfg.supabaseUrl + path, { method,
      headers: { apikey: key, Authorization: 'Bearer ' + (auth || key), 'Content-Type': 'application/json', Prefer: 'return=representation', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10_000) });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (data?.code === '23505') throw new HttpError(409, 'Cette adresse possède déjà une inscription.');
      if (data?.code === 'P0002') throw new HttpError(404, 'Participant introuvable.');
      if (data?.code === 'P0001') throw new HttpError(409, 'Cette participation a été retirée.');
      if ([400, 401, 403].includes(response.status) && path.startsWith('/auth/')) throw new HttpError(401, 'Identifiants incorrects ou session expirée.');
      throw new Error('Service de données indisponible');
    }
    return data;
  }
  async createRegistration(participant, jobs) {
    return this.call('/rest/v1/rpc/register_participant', { method: 'POST', body: { p_participant: participant, p_jobs: jobs } });
  }
  async listParticipants() {
    const rows = await this.all('/rest/v1/participants?select=*,scores(taste,texture,presentation,updated_at)&order=created_at.desc,id.asc');
    return rows.map(p => ({ ...p, scores: Array.isArray(p.scores) ? p.scores[0] || null : p.scores }));
  }
  async updateStatus(id, status) { return this.call('/rest/v1/rpc/set_participant_status', { method: 'POST', body: { p_id: id, p_status: status } }); }
  async saveScores(id, scores, user) { return this.call('/rest/v1/rpc/save_scores', { method: 'POST', body: { p_id: id, p_jury: user.id, p_taste: scores.taste, p_texture: scores.texture, p_presentation: scores.presentation } }); }
  async all(path) {
    const result = [];
    for (let offset = 0; ; offset += 500) {
      const rows = await this.call(path, { headers: { Range: `${offset}-${offset + 499}`, 'Range-Unit': 'items' } });
      result.push(...rows);
      if (rows.length < 500) return result;
    }
  }
  async listEmails() { return this.all('/rest/v1/email_jobs?select=*&order=due_at.desc,id.asc'); }
  async claimEmails(now, participantId = null) { return this.call('/rest/v1/rpc/claim_emails', { method: 'POST', body: { p_now: now, p_participant: participantId } }); }
  async finishEmail(id, result) { return this.call('/rest/v1/email_jobs?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: { ...result, processed_at: new Date().toISOString() } }); }
  async login(email, password) {
    const data = await this.call('/auth/v1/token?grant_type=password', { method: 'POST', anon: true, body: { email, password } });
    const user = await this.user(data.access_token);
    if (!user) throw new HttpError(403, 'Ce compte ne possède pas de rôle dans l’équipe.');
    return { value: data.access_token, user };
  }
  async user(value) {
    if (!value) return null;
    let identity;
    try { identity = await this.call('/auth/v1/user', { auth: value, anon: true }); }
    catch (e) { if (e.status === 401) return null; throw e; }
    const rows = await this.call('/rest/v1/team_users?id=eq.' + encodeURIComponent(identity.id) + '&select=id,role');
    return rows[0] ? { ...rows[0], email: identity.email } : null;
  }
  async logout(value) { if (value) await this.call('/auth/v1/logout', { method: 'POST', auth: value, anon: true }); }
  close() {}
}
