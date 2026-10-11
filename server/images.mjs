import sharp from 'sharp';
import { createHash } from 'node:crypto';
export const MAX_IMAGE_BYTES=3*1024*1024;
const fail=(status,message)=>{throw Object.assign(Error(message),{status})};
export async function uploadImage(req,db){
 if(!['image/jpeg','image/png','image/webp'].includes(req.headers.get('content-type')?.split(';')[0]))fail(415,'Escolha uma foto JPG, PNG ou WebP.');
 if(Number(req.headers.get('content-length')||0)>MAX_IMAGE_BYTES)fail(413,'A foto preparada deve ter até 3 MB.');
 const input=Buffer.from(await req.arrayBuffer());if(!input.length||input.length>MAX_IMAGE_BYTES)fail(413,'A foto preparada deve ter até 3 MB.');
 let output,info;
 try{
  const photo=sharp(input,{limitInputPixels:40000000,failOn:'error'}),meta=await photo.metadata();
  if(!['jpeg','png','webp'].includes(meta.format))fail(415,'Formato de foto não suportado.');
  ({data:output,info}=await photo.rotate().resize(1600,1600,{fit:'inside',withoutEnlargement:true}).webp({quality:88}).toBuffer({resolveWithObject:true}));
 }catch{fail(415,'Não foi possível ler esta foto. Escolha um arquivo JPG, PNG ou WebP válido.');}
 if(output.length>MAX_IMAGE_BYTES)fail(413,'Esta foto é muito pesada. Escolha uma versão menor.');
 const id=createHash('sha256').update(output).digest('hex');
 await db.run('INSERT OR IGNORE INTO images(id,mime,body,width,height,created_at) VALUES(?,?,?,?,?,?)',[id,'image/webp',output.toString('base64'),info.width,info.height,new Date().toISOString()]);
 return{url:`/images/uploads/${id}.webp`,width:info.width,height:info.height,bytes:output.length};
}
export async function serveImage(req,db,path){
 const id=path.match(/^\/images\/uploads\/([a-f0-9]{64})\.webp$/)?.[1];if(!id)return new Response('Foto não encontrada',{status:404});
 const row=await db.get('SELECT * FROM images WHERE id=?',[id]);if(!row)return new Response('Foto não encontrada',{status:404});
 const headers={'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff',ETag:`"${id}"`};
 if(req.headers.get('if-none-match')===headers.ETag)return new Response(null,{status:304,headers});
 return new Response(req.method==='HEAD'?null:Buffer.from(row.body,'base64'),{headers});
}
