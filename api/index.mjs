import { handle } from '../server/core.mjs';
import { database } from '../server/db.mjs';
let db;
// Web-standard handler preserves the raw body for Meta's webhook signature.
export default {async fetch(request){
 try{
  db??=database(process.env);
  const url=new URL(request.url),route=url.searchParams.get('route');
  if(route){url.pathname=route;url.searchParams.delete('route')}
  return await handle(new Request(url,request),db,process.env);
 }catch{return new Response(JSON.stringify({error:'Conexão persistente não configurada na hospedagem.'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
}};
