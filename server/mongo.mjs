import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';

// Only the application's fixed, parameterized repository statements are accepted.
// Visitors never supply a query. This adapter keeps local SQLite and Atlas behavior aligned.
const tables=new Set(['migrations','images','admins','sessions','config','products','leads','sales','sale_items','ledger','movements','messages','conversations','bot_rules','jobs','webhook_events','fiscal','audit','rate_limits']);
const stamp=()=>new Date().toISOString();
const base={admins:{role:'admin'},products:{cost:0,quantity:1,status:'draft',data:'{}',revision:1},leads:{stage:'new',owner:'',notes:'',data:'{}',source:'site',consent:0},sales:{phone:'',status:'confirmed'},sale_items:{unit_cost:0},ledger:{status:'pending'},conversations:{handoff:0},bot_rules:{enabled:1,priority:0},jobs:{status:'draft',attempts:0}};
function collection(db,name){if(!tables.has(name))throw Error('REPOSITORY_STATEMENT_NOT_SUPPORTED');return db.collection(name)}
function parts(s){const out=[];let depth=0,start=0,quoted=false;for(let i=0;i<s.length;i++){if(s[i]==="'")quoted=!quoted;if(!quoted){if(s[i]==='(')depth++;if(s[i]===')')depth--;if(s[i]===','&&depth===0){out.push(s.slice(start,i).trim());start=i+1;}}}out.push(s.slice(start).trim());return out;}
function value(token,cursor){const t=token.trim();if(t==='?')return cursor.args[cursor.i++]??null;if(t==='NULL')return null;if(/^'.*'$/.test(t))return t.slice(1,-1).replaceAll("''", "'");if(/^\d+$/.test(t))return Number(t);throw Error('REPOSITORY_VALUE_NOT_SUPPORTED');}
function condition(sql,args,cursor={args,i:0}){
 if(!sql)return {};
 const terms=sql.split(/\s+AND\s+/i),query={};
 for(const term of terms){let m;
  if(m=term.match(/^(\w+)\s+IN\s*\((.*)\)$/i)){query[m[1]]={$in:parts(m[2]).map(v=>value(v,cursor))};continue;}
  if(m=term.match(/^(\w+)\s+IS\s+NULL$/i)){query[m[1]]=null;continue;}
  if(m=term.match(/^(\w+)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/)){const v=value(m[3],cursor),op={'=':'$eq','!=':'$ne','<>':'$ne','>':'$gt','<':'$lt','>=':'$gte','<=':'$lte'}[m[2]];if(m[2]==='=')query[m[1]]=v;else query[m[1]]={...(typeof query[m[1]]==='object'?query[m[1]]:{}),[op]:v};continue;}
  throw Error('REPOSITORY_CONDITION_NOT_SUPPORTED');
 }
 return query;
}
function publicRow(row){if(!row)return undefined;const {_id,...r}=row;return r;}
export function mongoDatabase(env){
 const client=new MongoClient(env.MONGO_URI,{maxPoolSize:8,serverSelectionTimeoutMS:15000,connectTimeoutMS:15000});
 const name=env.MONGO_DB_NAME||'tradecar_shop';if(!/^[a-zA-Z0-9_-]+$/.test(name))throw Error('INVALID_DATABASE_NAME');
 const db=client.db(name);let connection;
 const ready=()=>connection??=client.connect();
 async function select(sql,args=[],session){await ready();
  if(sql.startsWith('SELECT admins.id,')){const s=await db.collection('sessions').findOne({id:args[0],expires_at:{$gt:args[1]}},{session});if(!s)return [];const a=await db.collection('admins').findOne({id:s.admin_id},{session});return a?[{id:a.id,name:a.name,email:a.email,role:a.role,csrf:s.csrf}]:[];}
  const m=sql.match(/^SELECT (.+?) FROM (\w+)(?: WHERE (.*?))?(?: ORDER BY (.*?))?(?: LIMIT (\d+))?$/i);if(!m)throw Error('REPOSITORY_SELECT_NOT_SUPPORTED');const [,fields,table,where,order,limit]=m,c=collection(db,table),q=condition(where,args);
  if(fields.startsWith('COUNT(*)')){const alias=fields.match(/ AS (\w+)$/i)?.[1]||'n';return [{[alias]:await c.countDocuments(q,{session})}];}
  let cursor=c.find(q,{session});if(order){const sort={};for(const piece of parts(order)){const [key,direction]=piece.split(' ');sort[key]=direction?.toUpperCase()==='DESC'?-1:1;}cursor=cursor.sort(sort);}if(limit)cursor=cursor.limit(Number(limit));
  const rows=(await cursor.toArray()).map(publicRow);return fields==='*'?rows:rows.map(row=>Object.fromEntries(parts(fields).map(field=>[field,row[field]])));
 }
 async function insert(sql,args,session){const m=sql.match(/^INSERT( OR IGNORE)? INTO (\w+)\(([^)]+)\) VALUES\((.*?)\)(?: ON CONFLICT\((\w+)\) DO UPDATE SET (.*?)(?: WHERE (.*))?)?$/i);if(!m)throw Error('REPOSITORY_INSERT_NOT_SUPPORTED');const [,ignore,table,columns,tokens,conflict]=m,c=collection(db,table),cursor={args,i:0},values=parts(tokens).map(t=>value(t,cursor)),row={...(base[table]||{}),...Object.fromEntries(parts(columns).map((k,i)=>[k,values[i]]))};row.id??=String(Date.now())+'-'+randomUUID();
  if(table==='rate_limits'){
   const key=row.id,cut=args[2],existing=await c.findOne({id:key},{session});const updated=existing?{count:existing.reset_at<cut?1:existing.count+1,reset_at:existing.reset_at<cut?row.reset_at:existing.reset_at}:row;
   await c.updateOne({id:key},{$set:updated},{upsert:true,session});return {rows:[],changes:1};
  }
  if(table==='sale_items'){
   const quantity=row.quantity;if(!Number.isSafeInteger(quantity)||quantity<=0)throw Error('STOCK_UNAVAILABLE');
   const p=await db.collection('products').findOneAndUpdate({id:row.product_id,status:{$in:['available','reserved']},quantity:{$gte:quantity}},{$inc:{quantity:-quantity,revision:1},$set:{updated_at:stamp()}},{session,returnDocument:'after'});
   if(!p)throw Error('STOCK_UNAVAILABLE');if(p.quantity===0)await db.collection('products').updateOne({id:p.id},{$set:{status:'sold'}},{session});
   await db.collection('movements').insertOne({id:randomUUID(),product_id:p.id,delta:-quantity,reason:'sale',reference:row.sale_id,created_at:stamp()},{session});
  }
  if(table==='ledger'&&!row.sale_id)delete row.sale_id;
  if(ignore){const r=await c.updateOne({id:row.id},{$setOnInsert:row},{upsert:true,session});return{rows:[],changes:r.upsertedCount};}
  if(conflict){const q={[conflict]:row[conflict]};if(table==='fiscal'){
    const prior=await c.findOne(q,{session});if(prior&&prior.status!=='draft')return{rows:[],changes:0};if(prior){await c.updateOne(q,{$set:{payload:row.payload,updated_at:row.updated_at}},{session});return{rows:[],changes:1};}
   }else if(table==='conversations'){
    const prior=await c.findOne(q,{session});if(prior){await c.updateOne(q,{$max:{last_inbound:row.last_inbound}},{session});return{rows:[],changes:1};}
   }else{
    const set={...row};delete set.id;if(table==='bot_rules')delete set._id;await c.updateOne(q,{$set:set,$setOnInsert:{id:row.id}},{upsert:true,session});return{rows:[],changes:1};
   }
  }
  await c.insertOne(row,{session});return {rows:[],changes:1};
 }
 async function update(sql,args,session){const m=sql.match(/^UPDATE (\w+) SET (.*?) WHERE (.*?)(?: RETURNING (\w+))?$/i);if(!m)throw Error('REPOSITORY_UPDATE_NOT_SUPPORTED');const [,table,assignments,where,returning]=m,c=collection(db,table),cursor={args,i:0},set={},inc={};
  for(const assignment of parts(assignments)){const a=assignment.match(/^(\w+)=(.+)$/);if(!a)throw Error('REPOSITORY_ASSIGNMENT_NOT_SUPPORTED');const [,key,expression]=a;const plus=expression.match(/^(\w+)\+(\d+)$/);if(plus){if(plus[1]!==key)throw Error('REPOSITORY_INCREMENT_NOT_SUPPORTED');inc[key]=Number(plus[2]);}else set[key]=value(expression,cursor);}
  const q=condition(where,args,cursor),updates={...(Object.keys(set).length?{$set:set}:{}),...(Object.keys(inc).length?{$inc:inc}:{})};
  if(table==='sales'&&set.status==='cancelled'){
   const sales=await c.find({...q,status:'confirmed'},{session}).toArray();for(const sale of sales){const paid=await db.collection('ledger').findOne({sale_id:sale.id,status:'paid'},{session});if(paid)throw Error('REFUND_REQUIRED');const items=await db.collection('sale_items').find({sale_id:sale.id},{session}).toArray();for(const item of items){await db.collection('products').updateOne({id:item.product_id},{$inc:{quantity:item.quantity,revision:1},$set:{status:'available',updated_at:stamp()}},{session});await db.collection('movements').insertOne({id:randomUUID(),product_id:item.product_id,delta:item.quantity,reason:'cancel',reference:sale.id,created_at:stamp()},{session});}await db.collection('ledger').updateMany({sale_id:sale.id},{$set:{status:'cancelled'}},{session});}
  }
  if(returning){const r=await c.findOneAndUpdate(q,updates,{session,returnDocument:'after'});return {rows:r?[{[returning]:r[returning]}]:[],changes:r?1:0};}
  const result=await c.updateMany(q,updates,{session});return {rows:[],changes:result.matchedCount};
 }
 async function execute(sql,args=[],session){if(sql.startsWith('SELECT'))return {rows:await select(sql,args,session),changes:0};if(sql.startsWith('INSERT'))return insert(sql,args,session);if(sql.startsWith('UPDATE'))return update(sql,args,session);const m=sql.match(/^DELETE FROM (\w+) WHERE (.*)$/);if(m){const r=await collection(db,m[1]).deleteMany(condition(m[2],args),{session});return{rows:[],changes:r.deletedCount};}throw Error('REPOSITORY_STATEMENT_NOT_SUPPORTED');}
 async function batch(statements){await ready();const session=client.startSession();try{let result;await session.withTransaction(async()=>{result=[];for(const [sql,args=[]]of statements)result.push(await execute(sql,args,session));},{readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});return result;}finally{await session.endSession();}}
 const run=async(sql,args=[])=>{if(sql.startsWith('INSERT INTO sale_items')||sql.startsWith('UPDATE sales SET')||sql.startsWith('INSERT INTO rate_limits'))return(await batch([[sql,args]]))[0];await ready();return execute(sql,args);};
 return {all:async(sql,args=[])=>sql.startsWith('SELECT')?select(sql,args):(await run(sql,args)).rows,get:async(sql,args=[])=> (await select(sql,args))[0],run,batch,remote:true,mongo:true,name,close:()=>client.close(),async migrate(){await ready();for(const table of tables)await db.collection(table).createIndex({id:1},{unique:true});await db.collection('admins').createIndex({email:1},{unique:true});await db.collection('sales').createIndex({request_key:1},{unique:true});for(const table of ['ledger','fiscal'])await db.collection(table).createIndex({sale_id:1},{unique:true,partialFilterExpression:{sale_id:{$type:'string'}}});await db.collection('conversations').createIndex({phone:1},{unique:true});await db.collection('jobs').createIndex({status:1,due_at:1});await db.collection('products').createIndex({status:1,kind:1});await db.collection('leads').createIndex({created_at:-1});await db.collection('messages').createIndex({phone:1,created_at:1});await db.collection('migrations').updateOne({id:'001-suite'},{$setOnInsert:{id:'001-suite',applied_at:stamp()}},{upsert:true});}};
}
