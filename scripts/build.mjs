import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
mkdirSync('public/images',{recursive:true});cpSync('images','public/images',{recursive:true});
cpSync('styles','public/styles',{recursive:true});mkdirSync('public/js',{recursive:true});
cpSync('js/app.js','public/js/app.js');cpSync('js/simulator.js','public/js/simulator.js');
const original=readFileSync('index.html','utf8').replace(/<img src="images\/([1-4])\.png"/g,(_,n)=>`<img src="images/optimized/${n}.webp" width="1600" height="1600" decoding="async" ${n==='3'?'':'loading="lazy"'}`);
writeFileSync('public/index.html',original.replace('</head>','<link rel="canonical" href="https://www.tradecarshop.com.br/"><link rel="stylesheet" href="/styles/refresh.css"><link rel="stylesheet" href="/styles/mobile.css"></head>').replace('</body>','<script src="/js/integration.js"></script></body>'));
// Preserve the original catalog as drafts until its availability is confirmed.
const raw=readFileSync('server/legacy-data.js','utf8').split('class TradeCarStorageManager')[0];
const seed=vm.runInNewContext(raw+'\n({vehicles:VEHICLES_DATA,parts:AUTO_PARTS_DATA})');
writeFileSync('server/seed.json',JSON.stringify(seed));
writeFileSync('public/js/data.js',raw+'\n'+readFileSync('public/js/catalog-bridge.js','utf8'));
for(const file of ['public/index.html','public/admin.html','public/suite.css','public/admin.js'])if(!existsSync(file))throw Error('Arquivo ausente: '+file);
console.log('TradeCar Suite preparada para Vercel.');
