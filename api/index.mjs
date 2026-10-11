import { handle,processJobs } from '../server/core.mjs';
import { database } from '../server/db.mjs';
import { waitUntil } from '@vercel/functions';
let db;
// Web-standard handler preserves the raw body for Meta's webhook signature.
export default {async fetch(request){
 try{
  db??=database(process.env);
  const url=new URL(request.url),route=url.searchParams.get('route');
  if(route){url.pathname=route;url.searchParams.delete('route')}
  const response=await handle(new Request(url,request),db,process.env);
  if(url.pathname==='/api/webhooks/whatsapp'&&request.method==='POST'&&response.ok)waitUntil(processJobs(db,process.env,{kind:'whatsapp'}).catch(()=>console.error('Fila WhatsApp pendente.')));
  return response;
 }catch{return new Response(JSON.stringify({error:'Conexão persistente não configurada na hospedagem.'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
}};
