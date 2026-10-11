import { handle,processJobs } from './core.mjs';
import { database } from './db.mjs';
let db;
export async function transport(req,res,env=process.env){
 try{
  db??=database(env);const protocol=env.VERCEL?'https':'http',host=env.VERCEL?(env.VERCEL_URL||new URL(env.SITE_URL).host):(req.headers.host||'127.0.0.1:3100');
  // The actual browser host is validated against the configured domains.
  const actualHost=req.headers.host||host;
  const original=new URL(req.url,`${protocol}://${actualHost}`),route=original.searchParams.get('route');
  if(route){original.pathname=route;original.searchParams.delete('route');}
  const chunks=[];let size=0;const limit=original.pathname==='/api/admin/images'?3*1024*1024:1000000;for await(const chunk of req){size+=chunk.length;if(size>limit){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Arquivo muito grande.'}));return;}chunks.push(chunk);}
  const init={method:req.method,headers:req.headers};if(!['GET','HEAD'].includes(req.method)){init.body=Buffer.concat(chunks);init.duplex='half';}
  const response=await handle(new Request(original,init),db,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  if(original.pathname==='/api/webhooks/whatsapp'&&req.method==='POST'&&response.ok)void processJobs(db,env,{kind:'whatsapp'}).catch(()=>console.error('Fila WhatsApp pendente.'));
 }catch(e){console.error('Serviço indisponível:',e.message==='PERSISTENT_DATABASE_REQUIRED'?'Banco externo obrigatório.':e.name);res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Banco persistente não configurado. Configure a conexão na hospedagem e aplique a migração.',code:'DATABASE_SETUP_REQUIRED'}));}
}
