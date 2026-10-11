import { readFileSync } from 'node:fs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function storefront(config){
 const tags=[['google-site-verification',config.searchConsoleVerification],['msvalidate.01',config.bingVerification]].filter(([,value])=>value).map(([name,value])=>`<meta name="${name}" content="${escape(value)}">`).join('');
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8').replace('</head>',tags+'</head>');
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=0, s-maxage=30'}});
}
