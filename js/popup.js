document.addEventListener('DOMContentLoaded',async()=>{
try{window.__countriesData=await fetch(chrome.runtime.getURL('locales/countries.json')).then(r=>r.json())}catch{window.__countriesData={}}

try{
const a=await Storage.get(['accentColor']);
window.__currentAccentColor=a?.accentColor||'#22c55e'
window.__lastSavedAccentColor=window.__currentAccentColor
}catch{
window.__currentAccentColor='#22c55e'
window.__lastSavedAccentColor=window.__currentAccentColor
}

try{
const c=await fetch(chrome.runtime.getURL('account.json')).then(r=>r.json());
window.__accountJson=c;
window.__proxyInfo=c.proxy||{};
window.__accountInfo={name:c.name||'User',icon:c.icon||''};

const patch={};
if(c.settings&&typeof c.settings==='object')patch.settings=c.settings;
if(c?.settings?.theme)patch.theme=c.settings.theme;
if(c?.settings?.lang)patch.lang=c.settings.lang;
const fileAccent=c?.settings?.accentColor||c?.accentColor;
if(fileAccent)patch.accentColor=fileAccent;
if (Array.isArray(c.autoSites)) {
  const existingSites = (await Storage.get(['autoSites'])).autoSites;
  if (!Array.isArray(existingSites) || existingSites.length === 0) {
    patch.autoSites = c.autoSites;
  }
}
if(c?.proxy?.host&&c?.proxy?.port){
  patch.proxyHost=c.proxy.host;
  patch.proxyPort=Number(c.proxy.port);
  patch.proxyIpv4=c.proxy.ipv4||'';
}
if(Object.keys(patch).length)await Storage.set(patch);
if(patch.proxyHost&&patch.proxyPort){
  chrome.runtime.sendMessage({action:'setProxyConfig',host:patch.proxyHost,port:patch.proxyPort,ipv4:patch.proxyIpv4||''},()=>{});
}
}catch{
window.__accountJson=null;
window.__proxyInfo={};
window.__accountInfo={name:'User',icon:''}
}

let ipv6=(await Storage.get(['ipv6On'])).ipv6On;
ipv6=!!ipv6;
window.__ipv6Enabled=ipv6;
document.getElementById('ipv6-checkbox').checked=ipv6;

const setToggleBg=v=>{
const l=document.querySelector('.toggle-label');
if(!l)return;
const s=getComputedStyle(document.documentElement);
l.style.background=v?s.getPropertyValue('--accent').trim():s.getPropertyValue('--border').trim()
};
setToggleBg(ipv6);

document.getElementById('ipv6-checkbox').addEventListener('change',async e=>{
window.__ipv6Enabled=e.target.checked;
Storage.set({ipv6On:window.__ipv6Enabled});
setToggleBg(e.target.checked);
const vpn=(await Storage.get(['vpnOn'])).vpnOn;
if(vpn){
Utils.sendMsg('enable',r=>{
if(!r?.success){
      Storage.set({vpnOn:false});
      const t = Locales.get(window.__lang);
      UI.showNotification(t.proxy_error);
    }
else setTimeout(()=>Network.refreshInfo(),500)
})
}else Network.refreshInfo()
});

UI.init();
await Locales.load();

const sl=(await Storage.get(['lang'])).lang;
window.__lang=sl||(navigator.language.startsWith('ru')?'ru':'en');
!sl&&Storage.set({lang:window.__lang});

const st=(await Storage.get(['theme'])).theme;
const pd=matchMedia('(prefers-color-scheme: dark)').matches;
const dark=st==='dark'||(st===undefined&&pd);
!dark&&document.body.classList.add('light-mode');
st===undefined&&Storage.set({theme:dark?'dark':'light'});

const wr=(await Storage.get(['webrtcOn'])).webrtcOn;
wr===undefined&&Storage.set({webrtcOn:true});

window.__ipHidden=true;
window.__realIP='';
window.__lastCountry='';
window.__lastCC='';
window.__isConnecting=false;
window.__pingUrl=SERVERS[0].val;
window.__pings=[];
window.__proxyMode='residential';

UI.els.eyeBox.innerHTML=EYE_OFF;
UI.els.tPath.setAttribute('d',dark?MOON_PATH:SUN_PATH);

Handlers.setupPower();
Handlers.setupAuth();
Handlers.setupTheme();
Handlers.setupLang();
Handlers.setupColor();
Handlers.setupIp();
Handlers.setupWebRTC();
Handlers.setupModal();
Handlers.setupServers();
Handlers.setupMenu();
Handlers.setupAutoSites();
	if (typeof Handlers.setupImportExport === 'function') Handlers.setupImportExport();

const vpn=(await Storage.get(['vpnOn'])).vpnOn||false;
UI.sync(vpn);
chrome.runtime.sendMessage({action:'getVpnStatus'}, response=>{
  if(response && typeof response.vpnOn !== 'undefined'){
    UI.sync(!!response.vpnOn);
  }
});

await UI.loadAccentColor();

UI.showStatus(window.__lang,false);
UI.updateTexts(window.__lang);
UI.updateWebRTC();
UI.updateAccountStatus();

setToggleBg(window.__ipv6Enabled);


Network.checkPing();
setInterval(()=>Network.checkPing(),5000);

Utils.getVersion(v=>UI.els.menuVersionNum.innerText=v);

setTimeout(()=>UI.els?.ip&&Network.refreshInfo(),500);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'proxyStatusChanged') {
    const vpnOn = request.vpnOn;
    Storage.set({ vpnOn: vpnOn });
    UI.sync(vpnOn, () => {
      UI.showStatus(window.__lang, false);
      UI.updateWebRTC();
      setTimeout(() => Network.refreshInfo(), 300);
    });
  }
});


