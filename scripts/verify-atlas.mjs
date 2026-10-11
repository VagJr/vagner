import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHmac } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { database,migrate } from '../server/db.mjs';
import { handle,seedRules,now,processJobs } from '../server/core.mjs';
if(!process.env.MONGO_URI)throw Error('Configure a conexão Atlas no ambiente.');
const name='tradecar_shop_qa_'+Date.now(),env={SITE_URL:'http://localhost:3100',META_APP_SECRET:randomBytes(16).toString('hex')};
const db=database({...process.env,MONGO_DB_NAME:name});let cookie='',csrf='';
async function request(path,body,method=body?'POST':'GET',headers={}){const init={method,headers:{origin:env.SITE_URL,cookie,'x-csrf-token':csrf,...headers}};if(body){init.body=JSON.stringify(body);init.headers['content-type']='application/json'}const res=await handle(new Request(env.SITE_URL+path,init),db,env);return{status:res.status,body:await res.json(),headers:res.headers}}
try{
 await migrate(db);await seedRules(db);
 const setup=await request('/api/auth/setup',{name:'Teste Atlas',email:'qa@example.invalid',password:randomBytes(16).toString('hex')});assert.equal(setup.status,200);cookie=setup.headers.get('set-cookie').split(';')[0];csrf=setup.body.csrf;
 assert.equal((await request('/api/admin/state')).status,200);
 const create=async(quantity=1)=>{const r=await request('/api/admin/products',{kind:'vehicle',title:'Teste isolado',price:100000,cost:50000,quantity,status:'available',data:{image:'/images/duster.jpg'}});assert.equal(r.status,200);return r.body.id};
 const p=await create(3),key=randomUUID(),saleBody={customer:'Teste',phone:'13999998888',request_key:key,due_date:'2026-10-20',items:[{product_id:p,quantity:1}]};
 const sale=await request('/api/admin/sales',saleBody);assert.equal(sale.status,201);assert.equal((await db.get('SELECT quantity FROM products WHERE id=?',[p])).quantity,2);assert.equal((await request('/api/admin/sales',saleBody)).body.id,sale.body.id);
 assert.equal((await request('/api/admin/sales/cancel',{id:sale.body.id})).status,200);assert.equal((await db.get('SELECT quantity FROM products WHERE id=?',[p])).quantity,3);await request('/api/admin/sales/cancel',{id:sale.body.id});assert.equal((await db.get('SELECT quantity FROM products WHERE id=?',[p])).quantity,3);
 const unavailable=await create(0);await assert.rejects(db.batch([['INSERT INTO sales(id,customer,total,request_key,due_date,created_at) VALUES(?,?,?,?,?,?)',['rollback','Teste',200000,'rollback','2026-10-20',now()]],['INSERT INTO sale_items(id,sale_id,product_id,title,quantity,unit_price) VALUES(?,?,?,?,?,?)',['i1','rollback',p,'Teste',1,100000]],['INSERT INTO sale_items(id,sale_id,product_id,title,quantity,unit_price) VALUES(?,?,?,?,?,?)',['i2','rollback',unavailable,'Teste',1,100000]]]),/STOCK_UNAVAILABLE/);assert.equal(await db.get('SELECT id FROM sales WHERE id=?',['rollback']),undefined);assert.equal((await db.get('SELECT quantity FROM products WHERE id=?',[p])).quantity,3);
 const lead=await request('/api/leads',{name:'Teste',phone:'13999998888',type:'vehicle',consent:true,product_id:p});assert.equal(lead.status,201);
 const inbound={entry:[{changes:[{value:{contacts:[{profile:{name:'Teste'}}],messages:[{id:'qa-wa',from:'5513999998888',type:'text',timestamp:String(Math.floor(Date.now()/1000)),text:{body:'menu'}}]}}]}]};const signature='sha256='+createHmac('sha256',env.META_APP_SECRET).update(JSON.stringify(inbound)).digest('hex');
 assert.equal((await request('/api/webhooks/whatsapp',inbound,'POST',{'x-hub-signature-256':signature})).status,200);assert.equal((await request('/api/webhooks/whatsapp',inbound,'POST',{'x-hub-signature-256':signature})).status,200);assert.equal((await db.get('SELECT COUNT(*) AS n FROM messages')).n,1);
 const jobs=await processJobs(db,env);assert.equal(jobs.sent,0);
 const state=await request('/api/admin/state');assert.equal(state.status,200);assert.ok(state.body.products.length===2);
 console.log('Atlas: sessão, estoque, venda, reversão, ficha e webhook verificados em base de teste isolada.');
}finally{
 await db.close();
 if(!/^tradecar_shop_qa_\d+$/.test(name))throw Error('Nome de teste inválido.');
 const cleanup=new MongoClient(process.env.MONGO_URI);try{await cleanup.db(name).dropDatabase()}finally{await cleanup.close()}
}
