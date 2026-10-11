import { database,migrate } from '../server/db.mjs';
import { importLegacyCatalog } from '../server/core.mjs';
if(!process.env.MONGO_URI)throw Error('Configure a conexão Atlas no ambiente.');
const db=database();
try{await migrate(db);const result=await importLegacyCatalog(db);console.log(`Catálogo anterior preservado: ${result.imported} itens novos em rascunho. Produtos existentes mantidos.`);}finally{await db.close()}
