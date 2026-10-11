import { mkdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname, resolve } from 'node:path';
import { createClient } from '@libsql/client/web';
import { mongoDatabase } from './mongo.mjs';

export function database(env=process.env) {
 if(env.MONGO_URI)return mongoDatabase(env);
 if(env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN) {
  const origin=env.TURSO_DATABASE_URL.replace(/^(libsql|turso):/,'https:');
  if(!/^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?\/?$/.test(origin)) throw Error('INVALID_DATABASE_URL');
  const client=createClient({url:origin,authToken:env.TURSO_AUTH_TOKEN,intMode:'number'});
  const result=r=>({rows:r.rows.map(row=>({...row})),changes:r.rowsAffected});
  const batch=async statements=>(await client.batch(statements.map(([sql,args=[]])=>({sql,args})),'write')).map(result);
  return {batch,all:async(sql,args=[])=>result(await client.execute({sql,args})).rows,get:async(sql,args=[])=>result(await client.execute({sql,args})).rows[0],run:async(sql,args=[])=>result(await client.execute({sql,args})),close:()=>client.close(),remote:true};
 }
 if(env.VERCEL || env.NODE_ENV==='production')throw Error('PERSISTENT_DATABASE_REQUIRED');
 const path=env.DATABASE_PATH||resolve('data/tradecar.db');mkdirSync(dirname(path),{recursive:true});
 const db=new DatabaseSync(path);db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 const batch=async statements=>{db.exec('BEGIN IMMEDIATE');try{const results=statements.map(([sql,args=[]])=>{const rows=db.prepare(sql).all(...args);return{rows,changes:Number(db.prepare('SELECT changes() AS n').get().n)}});db.exec('COMMIT');return results}catch(e){db.exec('ROLLBACK');throw e}};
 return {all:async(sql,args=[])=>db.prepare(sql).all(...args),get:async(sql,args=[])=>db.prepare(sql).get(...args),run:async(sql,args=[])=>db.prepare(sql).run(...args),batch,exec:sql=>db.exec(sql),close:()=>db.close(),remote:false};
}
export async function migrate(db){
 if(db.mongo)return db.migrate();
 const sql=readFileSync(new URL('./schema.sql',import.meta.url),'utf8');
 if(!db.remote)db.exec(sql);
 else { // Complete trigger blocks are single SQL statements.
  const statements=sql.match(/CREATE TRIGGER[\s\S]*?^END;|(?:PRAGMA|CREATE TABLE|CREATE INDEX)[\s\S]*?;/gm)||[];
  for(const statement of statements)await db.run(statement);
 }
 await db.run('INSERT OR IGNORE INTO migrations(id,applied_at) VALUES (?,?)',['001-suite',new Date().toISOString()]);
}
