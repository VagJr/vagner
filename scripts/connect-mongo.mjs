import { database,migrate } from '../server/db.mjs';
import { seedRules } from '../server/core.mjs';
import { readFileSync,writeFileSync,existsSync } from 'node:fs';
const chunks=[];process.stdin.setEncoding('utf8');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
console.log('Aguardando configuração protegida em stdin.');
for await(const chunk of process.stdin){chunks.push(chunk);try{JSON.parse(chunks.join('').trim());break;}catch{}}
try{
 const settings=JSON.parse(chunks.join('').trim());const db=database(settings);await migrate(db);await seedRules(db);await db.get('SELECT id FROM migrations LIMIT 1');
 const previous=existsSync('.env')?readFileSync('.env','utf8').split('\n').filter(l=>!/^MONGO_URI=|^MONGO_DB_NAME=/.test(l)).join('\n'):'';
 writeFileSync('.env',previous+'\nMONGO_URI='+JSON.stringify(settings.MONGO_URI)+'\nMONGO_DB_NAME='+settings.MONGO_DB_NAME+'\nSITE_URL=https://www.tradecarshop.com.br\n');
 await db.close();console.log('Atlas conectado. Base exclusiva: '+settings.MONGO_DB_NAME+'. Índices e regras de atendimento preparados.');
}catch(e){console.error('Conexão não concluída: '+e.name);process.exitCode=1;}
