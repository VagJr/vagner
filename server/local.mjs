import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { database, migrate } from './db.mjs';
import { seedRules, processJobs } from './core.mjs';
import { transport } from './transport.mjs';
const db=database();await migrate(db);await seedRules(db);
const root=resolve('public'),port=Number(process.env.PORT||3100);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return;}
 if(path==='/'||path==='/index.html'||path.startsWith('/images/uploads/')||path.startsWith('/api/')||path==='/robots.txt'||path==='/sitemap.xml'||/^\/(veiculo|peca)\//.test(path))return transport(req,res);
 const target=resolve(root,'.'+(path==='/'?'/index.html':path));if(!target.startsWith(root+sep)||!existsSync(target)||!statSync(target).isFile()){res.writeHead(404);res.end('Página não encontrada');return;}
 res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',...(path==='/admin.html'?{'X-Robots-Tag':'noindex, nofollow'}:{})});res.end(readFileSync(target));
});
server.listen(port,'127.0.0.1',()=>console.log(`TradeCar: http://127.0.0.1:${port}`));
const timer=setInterval(()=>processJobs(db,process.env).catch(()=>console.error('Fila não pôde ser processada.')),60000);timer.unref();
process.on('SIGTERM',()=>{clearInterval(timer);server.close();db.close?.()});
