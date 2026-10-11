const TradeCarStorage={
 vehicles:[],parts:[],loaded:false,error:false,
 getVehicles(){return this.vehicles},getParts(){return this.parts},
 async refresh(){
  try{const res=await fetch('/api/catalog');const result=await res.json();if(!res.ok)throw Error();
   COMPANY_CONFIG.whatsappNumber=result.business.whatsapp;COMPANY_CONFIG.hours=result.business.hours;COMPANY_CONFIG.location=result.business.location;
   const safe=v=>typeof v==='string'?v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])):Array.isArray(v)?v.map(safe):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,safe(x)])):v;
   const mapped=result.products.map(p=>{const d=p.data,kind=p.kind;return safe({id:p.id,status:p.status,title:p.title,price:p.price/100,...d,categoryLabel:d.category==='repasse'?'Repasse Lojista':d.category==='seminovos'?'Seminovo':kind==='part'?'Autopeça':'Veículo disponível',fipePrice:d.fipePrice||0,economy:Math.max((d.fipePrice||0)-p.price/100,0),features:d.features||[],specs:d.specs||[],badges:d.badges||[],warranty:d.warranty||'Condições sob consulta',condition:d.condition||'Consulte a equipe',plateEnd:d.plateEnd||'Consultar',images:[d.image,...(d.images||[])].filter(Boolean),laudo:{estrutura:d.inspection||'Consulte o laudo individual',chassi:'Consulte a equipe',motor:'Consulte a equipe',documentacao:d.documentation||'Consulte a documentação individual',origem:'Informação na ficha do veículo'}})});
   this.vehicles=mapped.filter(p=>result.products.find(x=>x.id===p.id)?.kind==='vehicle');this.parts=mapped.filter(p=>result.products.find(x=>x.id===p.id)?.kind==='part');this.loaded=true;this.error=false;
   window.dispatchEvent(new CustomEvent('tradecar_stock_updated'));
  }catch{this.vehicles=[];this.parts=[];this.loaded=true;this.error=true;window.dispatchEvent(new CustomEvent('tradecar_stock_updated'));}
 }
};
TradeCarStorage.refresh();setInterval(()=>TradeCarStorage.refresh(),60000);
