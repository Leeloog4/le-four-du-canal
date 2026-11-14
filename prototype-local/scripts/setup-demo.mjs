import { randomBytes } from 'node:crypto';
import { config } from '../src/config.mjs';
import { createStore } from '../src/store.mjs';
const cfg = config();
if (cfg.backend !== 'sqlite' || !cfg.demo) throw new Error('Cette commande est réservée à la démonstration SQLite. Créez les comptes Supabase dans Auth.');
const store = await createStore(cfg);
for (const [email, role] of [['organisateur@demo.test', 'organizer'], ['jury@demo.test', 'jury']]) {
  const password = randomBytes(18).toString('base64url');
  try { await store.createUser(email, password, role); console.log(`${email} : ${password}`); }
  catch (e) { if (e.message.includes('UNIQUE constraint')) console.log(`${email} : compte existant, mot de passe conservé.`); else throw e; }
}
store.close();
