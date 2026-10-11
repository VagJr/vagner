import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHmac, randomBytes } from 'node:crypto';
import { database, migrate } from '../server/db.mjs';
import { handle, seedRules, now, processJobs } from '../server/core.mjs';
import sharp from 'sharp';
import { integrationEnvironment } from '../server/integrations.mjs';
import { schedulerAuthorized } from '../server/scheduler.mjs';
import { generateKeyPair,SignJWT } from 'jose';

test('agendador aceita somente token assinado do repositório, workflow e branch autorizados',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('RS256'),claims={repository_id:'1346612975',repository_owner_id:'201420712',ref:'refs/heads/main',workflow_ref:'VagJr/vagner/.github/workflows/process-jobs.yml@refs/heads/main',event_name:'schedule'};
 const signed=async(extra={},audience='https://www.tradecarshop.com.br/api/cron',expiration='5m')=>new SignJWT({...claims,...extra}).setProtectedHeader({alg:'RS256'}).setIssuer('https://token.actions.githubusercontent.com').setAudience(audience).setSubject('repo:VagJr@201420712/vagner@1346612975:ref:refs/heads/main').setIssuedAt().setExpirationTime(expiration).sign(privateKey);
 const allowed=token=>schedulerAuthorized(new Request('https://www.tradecarshop.com.br/api/cron',{headers:{authorization:'Bearer '+token}}),{},publicKey);
 assert.equal(await allowed(await signed()),true);assert.equal(await allowed(await signed({repository_id:'another'})),false);assert.equal(await allowed(await signed({ref:'refs/heads/other'})),false);assert.equal(await allowed(await signed({event_name:'pull_request'})),false);assert.equal(await allowed(await signed({workflow_ref:'VagJr/vagner/.github/workflows/other.yml@refs/heads/main'})),false);assert.equal(await allowed(await signed({},'https://other.example')),false);assert.equal(await allowed(await signed({},undefined,'-1m')),false);
 assert.equal(await allowed('invalid-token'),false);
});

test('conexões são guardadas criptografadas, aplicadas no servidor e restritas ao administrador',async()=>{
 const f=await fixture();f.env.INTEGRATION_ENCRYPTION_KEY=randomBytes(32).toString('hex');
 try{
  const secret='test-token-never-public',save=await f.request('/api/admin/integrations',{service:'whatsapp',WHATSAPP_ACCESS_TOKEN:secret,WHATSAPP_PHONE_NUMBER_ID:'12345678901234',WHATSAPP_VERIFY_TOKEN:'test-verification',META_APP_SECRET:'test-app-secret'});assert.equal(save.status,200);
  const record=await f.db.get('SELECT value FROM config WHERE id=?',['integration:whatsapp']);assert.ok(!record.value.includes(secret));
  assert.equal((await integrationEnvironment(f.db,f.env)).WHATSAPP_ACCESS_TOKEN,secret);
  const state=await f.request('/api/admin/state');assert.equal(state.body.integrations.whatsapp,true);assert.ok(!JSON.stringify(state.body).includes(secret));
  assert.equal((await f.request('/api/admin/integrations',{service:'whatsapp',WHATSAPP_PHONE_NUMBER_ID:'98765432109876'})).status,200);assert.equal((await integrationEnvironment(f.db,f.env)).WHATSAPP_ACCESS_TOKEN,secret);
  await f.db.run('UPDATE admins SET role=? WHERE email=?',['sales','test@example.invalid']);assert.equal((await f.request('/api/admin/integrations',{service:'fiscal',FOCUS_NFE_TOKEN:'test-focus'})).status,403);
 }finally{f.close()}
});

test('upload exige acesso, valida a foto e persiste uma imagem pública otimizada sem duplicar',async()=>{
 const f=await fixture();
 try{
  const png=await sharp({create:{width:2000,height:300,channels:3,background:'#f97316'}}).png().toBuffer();
  const login=await f.request('/api/auth/login',{email:'test@example.invalid',password:f.password});
  const headers={origin:f.env.SITE_URL,cookie:login.headers.get('set-cookie').split(';')[0],'x-csrf-token':login.body.csrf,'content-type':'image/png'};
  const upload=(body=png,extra={})=>handle(new Request(f.env.SITE_URL+'/api/admin/images',{method:'POST',headers:{...headers,...extra},body}),f.db,f.env);
  assert.equal((await upload(png,{cookie:''})).status,401);assert.equal((await upload(png,{'x-csrf-token':''})).status,403);
  assert.equal((await upload(Buffer.from('<svg onload="alert(1)"></svg>'))).status,415);
  assert.equal((await upload(png,{'content-length':String(4*1024*1024)})).status,413);
  const uploaded=await upload();assert.equal(uploaded.status,201);const image=await uploaded.json();assert.equal(image.width,1600);assert.match(image.url,/^\/images\/uploads\/[a-f0-9]{64}\.webp$/);
  assert.equal((await (await upload()).json()).url,image.url);assert.equal((await f.db.get('SELECT COUNT(*) AS n FROM images')).n,1);
  const publicPhoto=await handle(new Request(f.env.SITE_URL+image.url),f.db,f.env);assert.equal(publicPhoto.status,200);assert.equal(publicPhoto.headers.get('content-type'),'image/webp');assert.equal((await sharp(Buffer.from(await publicPhoto.arrayBuffer())).metadata()).width,1600);
  assert.equal((await handle(new Request(f.env.SITE_URL+image.url,{headers:{'if-none-match':publicPhoto.headers.get('etag')}}),f.db,f.env)).status,304);
  const product=await f.request('/api/admin/products',{title:'Produto com foto enviada',kind:'part',price:10000,quantity:1,status:'available',data:{image:image.url}});assert.equal(product.status,200);
  assert.equal((await f.request('/api/catalog')).body.products[0].data.image,image.url);
  await f.db.run('UPDATE admins SET role=? WHERE email=?',['finance','test@example.invalid']);assert.equal((await upload()).status,403);
 }finally{f.close()}
});

test('chat online responde com regras configuráveis e oferece ficha para atendimento humano',async()=>{
 const f=await fixture();
 try{
  assert.match((await f.request('/api/chat',{message:'financiamento'})).body.response,/#financiamento/);
  await f.request('/api/admin/rules',{id:'online-rule',title:'Resposta personalizada',keywords:'teste personalizado',response:'Atendimento personalizado da TradeCar.',priority:100,enabled:true});
  assert.equal((await f.request('/api/chat',{message:'teste personalizado'})).body.response,'Atendimento personalizado da TradeCar.');
  const human=await f.request('/api/chat',{message:'atendente'});assert.equal(human.body.handoff,true);assert.match(human.body.response,/registre sua ficha/);
  assert.equal((await f.request('/api/chat',{message:'parar'})).body.paused,true);assert.equal((await f.request('/api/chat',{message:''})).status,400);
  assert.equal((await f.db.get('SELECT COUNT(*) AS n FROM leads')).n,0);
 }finally{f.close()}
});

test('ficha usa nome real do produto e os caminhos do bot existem no site',async()=>{
 const f=await fixture();
 try{
  const pid=await f.product(1,'Câmbio do catálogo','part');
  const r=await f.request('/api/leads',{name:'Cliente teste',phone:'13999998888',type:'part',product_id:pid,vehicle:'Nome desatualizado',consent:true});
  assert.equal(r.status,201);const message=new URL(r.body.whatsappUrl).searchParams.get('text');assert.match(message,/Autopeça/);assert.match(message,/Câmbio do catálogo/);assert.ok(!message.includes('Nome desatualizado'));
  assert.match((await f.request('/api/bot/preview',{message:'financiamento'})).body.response,/#financiamento/);
  assert.match((await f.request('/api/bot/preview',{message:'avaliar'})).body.response,/#vender/);
 }finally{f.close()}
});

test('tokens de busca aparecem no HTML inicial escapados e o site continua disponível sem banco',async()=>{
 const f=await fixture();
 try{
  await f.db.run('INSERT INTO config(id,value) VALUES(?,?)',['business',JSON.stringify({searchConsoleVerification:'google-ownership',bingVerification:'"><script>alert(1)</script>'})]);
  const page=await f.request('/');assert.equal(page.status,200);assert.match(page.body,/<meta name="google-site-verification" content="google-ownership">/);
  assert.match(page.body,/name="msvalidate.01" content="&quot;&gt;&lt;script&gt;/);assert.ok(!page.body.includes('<script>alert(1)</script>'));
  const fallback=await handle(new Request('https://www.tradecarshop.com.br/'),{get:async()=>{throw Error('offline')}},{});assert.equal(fallback.status,200);assert.match(await fallback.text(),/Trade Car/);
 }finally{f.close()}
});

test('catálogo anterior é preservado como rascunho sem sobrescrever produtos revisados',async()=>{
 const f=await fixture();
 try{
  const first=await f.request('/api/admin/catalog/legacy',{});assert.equal(first.status,200);assert.ok(first.body.imported>0);
  const p=await f.db.get('SELECT * FROM products LIMIT 1');assert.equal(p.status,'draft');
  await f.db.run('UPDATE products SET title=?,status=? WHERE id=?',['Produto revisado','available',p.id]);
  const again=await f.request('/api/admin/catalog/legacy',{});assert.equal(again.body.imported,0);
  assert.equal((await f.db.get('SELECT title FROM products WHERE id=?',[p.id])).title,'Produto revisado');
  assert.equal((await f.db.get('SELECT status FROM products WHERE id=?',[p.id])).status,'available');
 }finally{f.close()}
});

test('prévia da branch aceita fichas da própria origem e bloqueia outros domínios',async()=>{
 const f=await fixture();
 try{
  const branch='tradecar-git-review.vercel.app',env={...f.env,VERCEL:'1',VERCEL_URL:'tradecar-immutable.vercel.app',VERCEL_BRANCH_URL:branch};
  const request=(host,origin)=>handle(new Request(`https://${host}/api/leads`,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({name:'Teste de origem',phone:'13999998888',type:'support',consent:true})}),f.db,env);
  assert.equal((await request(branch,`https://${branch}`)).status,201);
  assert.equal((await request(branch,'https://other.example')).status,403);
  assert.equal((await request('other.vercel.app','https://other.vercel.app')).status,403);
 }finally{f.close()}
});

async function fixture(){const root=mkdtempSync(join(tmpdir(),'tradecar-test-')),db=database({DATABASE_PATH:join(root,'suite.db')});await migrate(db);await seedRules(db);let cookie='',csrf='';const env={SITE_URL:'http://localhost:3100',META_APP_SECRET:'test-signature-only'};async function request(path,body,method=body?'POST':'GET',headers={}){const init={method,headers:{origin:'http://localhost:3100',cookie,'x-csrf-token':csrf,...headers}};if(body!==undefined){init.body=JSON.stringify(body);init.headers['content-type']='application/json';}const r=await handle(new Request('http://localhost:3100'+path,init),db,env);const ct=r.headers.get('content-type');const result=ct?.includes('json')?await r.json():await r.text();return {status:r.status,body:result,headers:r.headers};}const password=randomBytes(16).toString('hex');const setup=await request('/api/auth/setup',{name:'Test admin',email:'test@example.invalid',password});assert.equal(setup.status,200);cookie=setup.headers.get('set-cookie').split(';')[0];csrf=setup.body.csrf;const product=async(quantity=1,title='Veículo de teste',kind='vehicle')=>{const r=await request('/api/admin/products',{title,kind,price:100000,cost:50000,quantity,status:'available',data:{image:'/images/duster.jpg',description:'Descrição de teste',year:'2022/2023'}});assert.equal(r.status,200);return r.body.id;};const sale=async(product_id,key=randomBytes(12).toString('hex'),quantity=1)=>request('/api/admin/sales',{customer:'Cliente teste',phone:'13999998888',due_date:'2026-10-20',request_key:key,items:[{product_id,quantity}]});return{db,request,product,sale,password,env,close:()=>db.close()};}

test('acesso administrativo exige sessão, origem e CSRF; senha inicial não reaparece',async()=>{const f=await fixture();try{const noAuth=await handle(new Request('http://localhost:3100/api/admin/state'),f.db,f.env);assert.equal(noAuth.status,401);const noCsrf=await f.request('/api/admin/products',{kind:'part'},'POST',{'x-csrf-token':''});assert.equal(noCsrf.status,403);const wrongOrigin=await f.request('/api/admin/products',{},'POST',{origin:'https://other.example'});assert.equal(wrongOrigin.status,403);const repeat=await f.request('/api/auth/setup',{name:'x',email:'x@example.invalid',password:'long-password'});assert.equal(repeat.status,409);const a=await f.db.get('SELECT password FROM admins LIMIT 1');assert.notEqual(a.password,f.password);assert.equal((await f.request('/api/auth/login',{email:'test@example.invalid',password:'incorrect'})).status,401);}finally{f.close()}});
test('venda baixa estoque, gera conta a receber e impede duplicação',async()=>{const f=await fixture();try{const p=await f.product(1),key='unique-sale-request',s=await f.sale(p,key);assert.equal(s.status,201);assert.equal((await f.db.get('SELECT quantity,status FROM products WHERE id=?',[p])).quantity,0);assert.equal((await f.db.get('SELECT status FROM products WHERE id=?',[p])).status,'sold');const ledger=await f.db.get('SELECT amount,status FROM ledger WHERE sale_id=?',[s.body.id]);assert.equal(ledger.amount,100000);assert.equal(ledger.status,'pending');assert.equal((await f.sale(p,key)).body.id,s.body.id);assert.equal((await f.sale(p)).status,409);assert.equal((await f.db.get('SELECT COUNT(*) AS n FROM sales')).n,1);}finally{f.close()}});
test('transação reverte venda inteira se um segundo item ficar indisponível',async()=>{const f=await fixture();try{const p1=await f.product(1),p2=await f.product(0);await assert.rejects(f.db.batch([['INSERT INTO sales(id,customer,total,request_key,due_date,created_at) VALUES(?,?,?,?,?,?)',['rollback-test','Cliente',200000,'rollback-key','2026-10-20',now()]],['INSERT INTO sale_items(id,sale_id,product_id,title,quantity,unit_price) VALUES(?,?,?,?,?,?)',['item1','rollback-test',p1,'Primeiro',1,100000]],['INSERT INTO sale_items(id,sale_id,product_id,title,quantity,unit_price) VALUES(?,?,?,?,?,?)',['item2','rollback-test',p2,'Segundo',1,100000]]]),/STOCK_UNAVAILABLE/);assert.equal((await f.db.get('SELECT quantity FROM products WHERE id=?',[p1])).quantity,1);assert.equal(await f.db.get('SELECT id FROM sales WHERE id=?',['rollback-test']),undefined);assert.equal((await f.db.get('SELECT COUNT(*) AS n FROM movements WHERE reason=?',['sale'])).n,0);}finally{f.close()}});
test('cancelamento restitui estoque uma única vez e protege venda paga',async()=>{const f=await fixture();try{const p=await f.product(3),s=await f.sale(p);assert.equal((await f.request('/api/admin/sales/cancel',{id:s.body.id})).status,200);assert.equal((await f.db.get('SELECT quantity FROM products WHERE id=?',[p])).quantity,3);await f.request('/api/admin/sales/cancel',{id:s.body.id});assert.equal((await f.db.get('SELECT quantity FROM products WHERE id=?',[p])).quantity,3);const paid=await f.sale(p),l=await f.db.get('SELECT id FROM ledger WHERE sale_id=?',[paid.body.id]);await f.request('/api/admin/ledger',{id:l.id,status:'paid'},'PATCH');assert.equal((await f.request('/api/admin/sales/cancel',{id:paid.body.id})).status,409);assert.equal((await f.db.get('SELECT quantity FROM products WHERE id=?',[p])).quantity,2);}finally{f.close()}});
test('catalogo público não expõe custo; páginas escapam HTML; vendidos saem do sitemap',async()=>{const f=await fixture();try{const p=await f.product(1,'Carro <script>alert(1)</script>');const catalog=await f.request('/api/catalog');assert.equal(catalog.body.products[0].cost,undefined);const page=await f.request('/veiculo/'+p);assert.equal(page.status,200);assert.ok(page.body.includes('&lt;script&gt;'));assert.ok(!page.body.includes('<script>alert(1)</script>'));assert.ok((await f.request('/sitemap.xml')).body.includes(p));await f.sale(p);assert.ok(!(await f.request('/sitemap.xml')).body.includes(p));assert.equal((await f.request('/veiculo/'+p)).status,404);}finally{f.close()}});
test('edição concorrente de estoque não sobrepõe versão recente',async()=>{const f=await fixture();try{const p=await f.product(2);const b={id:p,revision:1,kind:'vehicle',title:'Novo título',price:90000,cost:45000,quantity:2,status:'available',data:{}};assert.equal((await f.request('/api/admin/products',b)).status,200);assert.equal((await f.request('/api/admin/products',{...b,title:'Versão antiga'})).status,409);assert.equal((await f.db.get('SELECT title FROM products WHERE id=?',[p])).title,'Novo título');}finally{f.close()}});
test('fichas exigem consentimento, registram campanha e preenchem WhatsApp',async()=>{const f=await fixture();try{const b={name:'Cliente',phone:'13999998888',type:'evaluation',vehicle:'Renault',utm_source:'instagram',utm_campaign:'estoque'};assert.equal((await f.request('/api/leads',b)).status,400);const l=await f.request('/api/leads',{...b,consent:true});assert.equal(l.status,201);assert.ok(l.body.whatsappUrl.startsWith('https://wa.me/5513996202124?text='));const row=await f.db.get('SELECT data FROM leads WHERE id=?',[l.body.id]);assert.equal(JSON.parse(row.data).utm_source,'instagram');}finally{f.close()}});
test('webhook valida assinatura, deduplica mensagens e encaminha humano',async()=>{const f=await fixture();try{const phone='5513999998888',incoming={entry:[{changes:[{value:{messages:[{id:'wamid-test',from:phone,type:'text',text:{body:'1'},timestamp:String(Math.floor(Date.now()/1000))}],contacts:[{wa_id:phone,profile:{name:'Cliente webhook'}}]}}]}]};const sign=b=>'sha256='+createHmac('sha256',f.env.META_APP_SECRET).update(JSON.stringify(b)).digest('hex');assert.equal((await f.request('/api/webhooks/whatsapp',incoming,'POST',{'x-hub-signature-256':'bad'})).status,403);assert.equal((await f.request('/api/webhooks/whatsapp',incoming,'POST',{'x-hub-signature-256':sign(incoming)})).status,200);await f.request('/api/webhooks/whatsapp',incoming,'POST',{'x-hub-signature-256':sign(incoming)});assert.equal((await f.db.get('SELECT COUNT(*) AS n FROM messages')).n,1);assert.equal((await f.db.get('SELECT COUNT(*) AS n FROM jobs')).n,1);const reply=await f.request('/api/admin/reply',{phone,text:'Olá!'});assert.equal(reply.status,200);const result=await processJobs(f.db,f.env);assert.equal(result.sent,0);assert.equal((await f.db.get("SELECT COUNT(*) AS n FROM jobs WHERE status='sent'")).n,0);await f.request('/api/admin/handoff',{phone,handoff:true});const menu=await f.request('/api/bot/preview',{message:'financiamento'});assert.ok(menu.body.response.includes('instituição financeira'));}finally{f.close()}});
test('papel de vendas não altera financeiro nem configuração',async()=>{const f=await fixture();try{await f.request('/api/admin/users',{name:'Vendedor',email:'sales@example.invalid',password:'test-password-with-20-chars',role:'sales'});const login=await f.request('/api/auth/login',{email:'sales@example.invalid',password:'test-password-with-20-chars'});const h={cookie:login.headers.get('set-cookie').split(';')[0],'x-csrf-token':login.body.csrf};assert.equal((await f.request('/api/admin/config',{},'POST',h)).status,403);assert.equal((await f.request('/api/admin/ledger',{description:'x',kind:'expense',amount:100,due_date:'2026-10-20'},'POST',h)).status,403);const data=await f.request('/api/admin/state',undefined,'GET',h);assert.equal(data.body.ledger.length,0);assert.equal(data.body.users.length,0);}finally{f.close()}});
test('fila fiscal não envia sem emissor e banco efêmero é recusado em produção',async()=>{const f=await fixture();try{const p=await f.product(),s=await f.sale(p);await f.request('/api/admin/fiscal',{sale_id:s.body.id,payload:{natureza_operacao:'Venda',cnpj_emitente:'00000000000000',items:[{}]}});const doc=await f.db.get('SELECT * FROM fiscal LIMIT 1');assert.equal(doc.environment,'sandbox');assert.equal((await f.request('/api/admin/fiscal/submit',{id:doc.id})).status,503);assert.equal((await f.db.get('SELECT status FROM fiscal LIMIT 1')).status,'draft');assert.throws(()=>database({VERCEL:'1'}),/PERSISTENT_DATABASE_REQUIRED/);}finally{f.close()}});
test('migração remota preserva cada trigger completo',()=>{const sql=readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8'),statements=sql.match(/CREATE TRIGGER[\s\S]*?^END;|(?:PRAGMA|CREATE TABLE|CREATE INDEX)[\s\S]*?;/gm);const triggers=statements.filter(s=>s.startsWith('CREATE TRIGGER'));assert.equal(triggers.length,4);for(const trigger of triggers)assert.ok(trigger.endsWith('\nEND;'));});
