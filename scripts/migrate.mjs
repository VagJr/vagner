import { database, migrate } from '../server/db.mjs';
import { seedRules } from '../server/core.mjs';
const db=database();try{await migrate(db);await seedRules(db);console.log('Banco e regras de atendimento atualizados.');}finally{await db.close?.();}
