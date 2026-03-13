const Network={
async detectIP(vpnState){
let ip='0.0.0.0',country='',cc='';
try{
if(!vpnState){
for(const s of[
{u:'https://api.ipify.org?format=json',f:'ip'},
{u:'https://icanhazip.com/',t:1}
]){
try{
const r=await fetch(s.u,{mode:'cors'});
if(!r.ok)continue;
ip=s.t?(await r.text()).trim():(await r.json())[s.f]||'';
if(ip&&ip!=='0.0.0.0')break;
}catch{}
}
if(ip&&ip!=='0.0.0.0'){
for(const g of[
`https://ipapi.co/${ip}/json/`,
`https://ipinfo.io/${ip}/json`,
`https://geoip-db.com/json/${ip}`
]){
try{
const r=await fetch(g,{mode:'cors'});
if(!r.ok)continue;
const d=await r.json();
cc=d.country_code||d.country||'';
country=d.country_name||d.country||'';
if(cc)break;
}catch{}
}
}
}else{
ip='';
if(window.__ipv6Enabled){
for(const u of[
'https://ipv6.icanhazip.com/',
'https://api.ipify.org?format=json&ipv6'
]){
try{
const r=await fetch(u,{mode:'cors'});
if(!r.ok)continue;
const v=u.includes('icanhazip')?(await r.text()).trim():(await r.json()).ipv6;
if(v&&v.includes(':')){ip=v;break}
}catch{}
}
}
if(!ip||ip==='0.0.0.0'){
ip='0.0.0.0';
for(const u of[
'https://icanhazip.com/',
'https://api.ipify.org?format=json',
'https://ipqualityscore.com/api/json/ip/residential?strictness=1'
]){
try{
const r=await fetch(u,{mode:'cors'});
if(!r.ok)continue;
const d=u.includes('json')?await r.json():{ip:(await r.text()).trim()};
const v=d.ip||'';
if(v&&!v.includes(':')){ip=v;country=d.country_name||'';cc=d.country_code||'';break}
}catch{}
}
}
if(ip&&ip!=='0.0.0.0'&&!country){
for(const g of[
`https://ipapi.co/${ip}/json/`,
`https://ipinfo.io/${ip}/json`
]){
try{
const r=await fetch(g,{mode:'cors'});
if(!r.ok)continue;
const d=await r.json();
cc=d.country_code||d.country||'';
country=d.country_name||d.country||'';
if(country)break;
}catch{}
}
}
}
}catch{}
return{ip,country,cc}
},

async checkPing(){
const url=window.__pingUrl||SERVERS[0].val;
const s=performance.now();
try{
await fetch(url,{method:'HEAD',mode:'no-cors',cache:'no-store'});
const t=Math.round(performance.now()-s);
window.__pings&&(window.__pings.push(t),window.__pings.length>10&&window.__pings.shift());
const a=window.__pings?.length?Math.round(window.__pings.reduce((x,y)=>x+y)/window.__pings.length):t;
if(UI.els.ping){UI.els.ping.innerText=a+' мс';UI.updatePingColor(a)}
}catch{UI.els.ping&&(UI.els.ping.innerText='—')}
},

async refreshInfo(){
const vpnState=(await Storage.get(['vpnOn'])).vpnOn||false;
const{ip,country,cc}=await Network.detectIP(vpnState);
window.__realIP=ip;
window.__lastCountry=country;
window.__lastCC=cc;
UI.els.ip&&!window.__ipHidden&&(UI.els.ip.innerText=ip);
if(UI.els.country){
let n='—';
if(cc){
const C=cc.toUpperCase(),d=window.__countriesData?.[C];
if(d){
if(window.__lang==='ru'&&d.ru)n=d.ru;
else if(window.__lang==='en'&&d.en)n=d.en;
else n=d.ru||d.en||n;
}
if(n==='—'&&country)n=country;
}
UI.els.country.innerText=n;
}
if(UI.els.flagImg){
if(cc){
UI.els.flagImg.src=`assets/flags/${cc.toLowerCase()}.svg`;
UI.els.flagImg.style.display='block';
UI.els.flagImg.onerror=()=>UI.els.flagImg.style.display='none';
}else UI.els.flagImg.style.display='none';
}
}
};
