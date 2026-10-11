import { database, migrate } from '../server/db.mjs';
const db=database();await migrate(db);console.log('Banco atualizado.');db.close?.();
