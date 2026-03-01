const Handlers={
setupPower:()=>{UI.els.pwr.onclick=async()=>{
UI.els.select.classList.remove('open');
const r=await Storage.get(['vpnOn']);
if(!r.vpnOn){
if(!await Storage.hasCreds())return UI.showAuthModal();
window.__isConnecting=true;
UI.els.main.classList.add('connecting');
UI.showStatus(window.__lang,true);
Utils.setWebRTC(true,()=>setTimeout(()=>Utils.sendMsg("enable",async resp=>{
if(resp&&resp.success){
await Storage.set({vpnOn:true});
window.__isConnecting=false;
UI.els.main.classList.remove('connecting');
UI.sync(true,()=>{UI.showStatus(window.__lang,false);UI.updateWebRTC();setTimeout(()=>Network.refreshInfo(),300);});
}else{
window.__isConnecting=false;
UI.els.main.classList.remove('connecting');
UI.showStatus(window.__lang,false);
UI.updateWebRTC();
const t = Locales.get(window.__lang);
UI.showNotification(t.connection_error_prefix + (resp&&resp.error||'unknown'));
}}),300));
}else{
window.__isConnecting=true;
UI.els.main.classList.add('connecting');
UI.showStatus(window.__lang,true);
Utils.setWebRTC(false,()=>setTimeout(()=>Utils.sendMsg("disable",()=>Storage.set({vpnOn:false}).then(()=>{
window.__isConnecting=false;
UI.els.main.classList.remove('connecting');
UI.sync(false,()=>{UI.showStatus(window.__lang,false);UI.updateWebRTC();setTimeout(()=>Network.refreshInfo(),200);});
})),200));
}}},

setupAuth:()=>{UI.els.accountBtn.onclick=()=>{
const m=document.createElement('div');
m.id='json-modal';
m.style='position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;';
{
      const t = Locales.get(window.__lang);
      m.innerHTML = `<div style="background:var(--btn);border:1px solid var(--border);border-radius:10px;padding:28px 24px;width:320px;box-shadow:0 8px 32px #0003;display:flex;flex-direction:column;gap:18px;position:relative;"><button id="json-close" style="position:absolute;top:8px;right:10px;font-size:18px;background:none;border:none;color:var(--sub);cursor:pointer;">×</button><div id="json-drop" style="border-radius:8px;padding:24px;width:100%;text-align:center;cursor:pointer;background:var(--bg);color:var(--sub);font-size:13px;position:relative;overflow:hidden;"><div style="position:relative;z-index:3;">${t.drop_json_hint}</div></div><input type="file" id="json-file" accept="application/json" style="display:none;"></div>`;
    }
document.body.appendChild(m);
const d=m.querySelector('#json-drop'),f=m.querySelector('#json-file');
d.classList.add('dashed-border-rotate');
const h=file=>{
if(!file.name.endsWith('.json')){
    const t = Locales.get(window.__lang);
    return UI.showNotification(t.only_json);
  }
const r=new FileReader();
r.onload=e=>{try{
const data=JSON.parse(e.target.result);
if(data.username&&data.password){
Storage.saveCreds(data.username,data.password);
UI.updateAccountStatus();
m.remove();
}else {
      const t = Locales.get(window.__lang);
      UI.showNotification(t.json_missing_credentials);
    }
}catch(err){
      const t = Locales.get(window.__lang);
      UI.showNotification(t.error_prefix + err.message);
    }};
r.readAsText(file);
};
m.querySelector('#json-close').onclick=()=>m.remove();
m.onclick=e=>e.target===m&&m.remove();
d.onclick=e=>{e.stopPropagation();f.dispatchEvent(new MouseEvent('click',{bubbles:true}));};
m.querySelector('#json-drop div').style.pointerEvents='none';
d.ondragover=e=>{e.preventDefault();d.style.background='var(--accent)';d.style.opacity='.1'};
d.ondragleave=e=>{e.preventDefault();d.style.background='var(--bg)';d.style.opacity='1'};
d.ondrop=e=>{e.preventDefault();e.dataTransfer.files[0]&&h(e.dataTransfer.files[0])};
f.onchange=()=>f.files[0]&&h(f.files[0]);
}},

setupTheme:()=>UI.els.themeBtn.onclick=UI.toggleTheme,

setupLang:()=>UI.els.langBtn.onclick=()=>{
window.__lang=window.__lang==='ru'?'en':'ru';
Storage.set({lang:window.__lang}).then(()=>{
const t=Locales.get(window.__lang);
UI.updateTexts(window.__lang,()=>{
UI.els.colorBtn.title=t.tip_color||'Цвет акцента';
UI.showStatus(window.__lang,window.__isConnecting);
UI.updateAccountStatus();
});
});
},

setupMenu:()=>{
UI.els.menuBtn.onclick=e=>{e.stopPropagation();UI.els.menuDropdown.classList.toggle('open')};
document.addEventListener('click',e=>!UI.els.menuWrapper.contains(e.target)&&UI.els.menuDropdown.classList.remove('open'));
},

setupIp:()=>UI.els.ipToggle.onclick=UI.toggleIp,

setupWebRTC:()=>UI.els.menuWebrtc.onclick=()=>{
Storage.get(['webrtcOn','vpnOn']).then(r=>{
if(r.vpnOn&&r.webrtcOn){
Utils.sendMsg("disable",()=>setTimeout(()=>Utils.setWebRTC(false,()=>Storage.set({vpnOn:false}).then(()=>{
window.__isConnecting=false;
UI.els.main.classList.remove('connecting');
UI.sync(false,UI.updateWebRTC);
})),400));
}else Utils.setWebRTC(!r.webrtcOn);
});
},

setupModal:()=>document.getElementById('auth-modal').addEventListener('click',e=>e.target.id==='auth-modal'&&UI.hideAuthModal()),

setupServers:()=>{
const l=document.querySelector('.options-list');
l.innerHTML='';
SERVERS.forEach(s=>{
const o=document.createElement('div');
o.className='option-item';
o.innerText=s.name;
o.onclick=()=>{
UI.els.selectedVal.innerText=s.name;
window.__pingUrl=s.val;
window.__pings=[];
Network.checkPing();
UI.els.select.classList.remove('open');
};
l.appendChild(o);
});
UI.els.selectedVal.innerText=SERVERS[0].name;
window.__pingUrl=SERVERS[0].val;
document.getElementById('select-trigger').onclick=e=>{e.stopPropagation();UI.els.select.classList.toggle('open')};
document.addEventListener('click',e=>!UI.els.select.contains(e.target)&&UI.els.select.classList.contains('open')&&UI.els.select.classList.remove('open'));
},

setupColor:()=>{
const colorBtn=UI.els.colorBtn;
const colorPicker=UI.els.colorPicker;
const colorControls=document.getElementById('color-controls');
const colorReset=document.getElementById('color-reset');
const colorSave=document.getElementById('color-save');
const colorSelectFile=document.getElementById('color-select-file');
const jsonFileInput=document.getElementById('json-file-input');
const defaultColor='#22c55e';

window.__selectedJsonFile=null;
window.__selectedJsonData=null;

const showColorControls=()=>{
    colorControls.style.display='flex';
  };

  const hideColorControls=()=>{
    colorControls.style.display='none';
  };

  colorBtn.onclick=()=>{
    colorPicker.click();
    showColorControls();
  };

colorPicker.oninput=e=>{
try{UI.setAccentColor(e.target.value,true)}catch{}
};

colorPicker.onchange=e=>{
try{UI.setAccentColor(e.target.value,true)}catch{}
};

colorReset.onclick=()=>{
window.__currentAccentColor=defaultColor;
colorPicker.value=defaultColor;
UI.setAccentColor(defaultColor,false);
Storage.set({accentColor:defaultColor});
const t = Locales.get(window.__lang);
UI.showNotification(t.color_reset_default);
hideColorControls();
};

colorSave.onclick=()=>{
const colorToSave=window.__currentAccentColor||defaultColor;

if(window.__selectedJsonData){
window.__selectedJsonData.settings=window.__selectedJsonData.settings||{};
window.__selectedJsonData.settings.accentColor=colorToSave;
const dataStr=JSON.stringify(window.__selectedJsonData,null,2);
const blob=new Blob([dataStr],{type:'application/json'});
const url=URL.createObjectURL(blob);
const link=document.createElement('a');
link.href=url;
link.download='account.json';
link.click();
URL.revokeObjectURL(url);
{
    const t = Locales.get(window.__lang);
    UI.showNotification(t.color_saved_account);
  }
Storage.set({accentColor:colorToSave});
window.__selectedJsonData=null;
window.__selectedJsonFile=null;
    {
      const t = Locales.get(window.__lang);
      if (colorSelectFile) colorSelectFile.innerText = t.color_json;
    }
}else{
  UI.setAccentColor(colorToSave,false);
  Storage.set({accentColor:colorToSave});
  {
      const t = Locales.get(window.__lang);
      UI.showNotification(t.color_saved);
    }
}
hideColorControls();
};

if (colorSelectFile && jsonFileInput) colorSelectFile.onclick = () => { jsonFileInput.click(); };

if (jsonFileInput) {
  jsonFileInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        window.__selectedJsonData = JSON.parse(event.target.result);
        window.__selectedJsonFile = file.name;
        {
          const t = Locales.get(window.__lang);
          if (colorSelectFile) colorSelectFile.innerText = '✓ ' + t.color_json;
        }
        try {
          const ac = (window.__selectedJsonData && window.__selectedJsonData.settings && window.__selectedJsonData.settings.accentColor) || window.__selectedJsonData && window.__selectedJsonData.accentColor;
          if (ac) {
            window.__currentAccentColor = ac;
            UI.setAccentColor(ac, true);
            UI.els.colorPicker.value = ac;
          }
        } catch (e) {}
      } catch {
        const t = Locales.get(window.__lang);
        UI.showNotification(t.invalid_json);
        window.__selectedJsonData = null;
        window.__selectedJsonFile = null;
        if (colorSelectFile) colorSelectFile.innerText = t.color_json;
      }
      jsonFileInput.value = '';
    };
    reader.readAsText(file);
  };
}

document.addEventListener('drop',e=>{
const files=e.dataTransfer.files;
if(!files.length||!files[0].name.endsWith('.json'))return;
e.preventDefault();
e.stopPropagation();
const reader=new FileReader();
reader.onload=event=>{
try{
window.__selectedJsonData=JSON.parse(event.target.result);
window.__selectedJsonFile=files[0].name;
{
      const t = Locales.get(window.__lang);
      if (colorSelectFile) colorSelectFile.innerText = '✓ ' + t.color_json;
    }
}catch{
    const t = Locales.get(window.__lang);
    UI.showNotification(t.invalid_json);
    window.__selectedJsonData = null;
    window.__selectedJsonFile = null;
    if (colorSelectFile) colorSelectFile.innerText = t.color_json;
}
};
reader.readAsText(files[0]);
},true);

document.addEventListener('click',e=>{
if(!colorControls.contains(e.target)&&e.target!==colorBtn&&e.target.id!=='color-btn'&&e.target.parentElement?.id!=='color-btn'){
if(colorControls.style.display==='flex'){
hideColorControls();
}
}
});

Storage.get(['vpnOn']).then(r=>{
  if(!r.vpnOn) hideColorControls();
});

},

setupAutoSites:()=>{
const m=document.getElementById('menu-autosites');
const modal=document.getElementById('site-modal');
const list=document.getElementById('site-list');
const input=document.getElementById('site-input');
const addBtn=document.getElementById('site-add');
const saveBtn=document.createElement('button');
const closeBtn=document.getElementById('site-close');
let tempSites = [];
if(!m)return;

saveBtn.id = 'site-save';
saveBtn.className = 'modal-btn';
addBtn.insertAdjacentElement('afterend', saveBtn);

const renderList=()=>{
  list.innerHTML='';
  tempSites.forEach(site=>{
    const item=document.createElement('div');
    item.style='padding:8px;background:var(--border);border-radius:4px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;';
    const text=document.createElement('span');
    text.innerText=site;
    const btn=document.createElement('button');
    btn.innerText='×';
    btn.style='background:none;border:none;color:var(--text);cursor:pointer;font-size:16px;';
    btn.onclick=()=>{
      const idx=tempSites.indexOf(site);
      if(idx>-1){
        tempSites.splice(idx,1);
        renderList();
      }
    };
    item.appendChild(text);
    item.appendChild(btn);
    list.appendChild(item);
  });
};

const loadSiteList=()=>{
  Storage.get(['autoSites']).then(r=>{
    tempSites = (r.autoSites||[]).slice();
    renderList();
  });
};

saveBtn.innerText = Locales.get(window.__lang).save || 'Save';
saveBtn.onclick = ()=>{
  Storage.set({autoSites: tempSites}).then(()=>{
    modal.style.display='none';
    chrome.tabs.query({active:true,currentWindow:true},tabs=>{
      const url = tabs[0]?.url || '';
      const host = Utils.extractHost(url);
      if(host && !tempSites.some(s=>host.includes(s))){
        chrome.runtime.sendMessage({action:'disableProxyDueToList'});
      } else if(host && tempSites.some(s=>host.includes(s))){
        chrome.runtime.sendMessage({action:'enableProxyDueToList'});
      }
    });
  });
};

m.onclick=()=>{UI.els.menuDropdown.classList.remove('open');modal.style.display='flex';loadSiteList();};
closeBtn.onclick=()=>{modal.style.display='none'};
modal.addEventListener('click',e=>{if(e.target.id==='site-modal')modal.style.display='none'});
addBtn.onclick=()=>{const site=input.value.trim();if(!site)return; if(!tempSites.includes(site)){
    tempSites.push(site);
    input.value='';
    renderList();
  }
};
},

setupImportExport:()=>{
  const imMenu = document.getElementById('menu-import');
  const exMenu = document.getElementById('menu-export');
  const imWin = document.getElementById('import-window');
  const exWin = document.getElementById('export-window');
  const imDrop = document.getElementById('import-drop');
  const imFile = document.getElementById('import-window-file');
  const imClose = document.getElementById('import-close');
  const exDo = document.getElementById('export-do');
  const exClose = document.getElementById('export-close');

  function handleImportFile(file){
    if(!file.name.endsWith('.json')) {
      const t = Locales.get(window.__lang);
      return UI.showNotification(t.only_json);
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const json = JSON.parse(e.target.result);
        window.__selectedJsonData = json;
        {
          const t = Locales.get(window.__lang);
          UI.showNotification(t.imported_json);
        }
        const color = (json.settings && json.settings.accentColor) || json.accentColor;
        if (color) {
          UI.els.colorPicker.value = color;
          UI.setAccentColor(color, false);
          window.__currentAccentColor = color;
          Storage.set({accentColor: color});
        }
        if(json.username && json.password) {
          Storage.saveCreds(json.username, json.password);
          UI.updateAccountStatus();
        }
        if(json.proxy && json.proxy.host && json.proxy.port) {
          Storage.set({proxyHost: json.proxy.host, proxyPort: json.proxy.port});
        }
        if(json.settings) {
          Storage.set({settings: json.settings});
        }
        if(json.autoSites && Array.isArray(json.autoSites)) {
          Storage.set({autoSites: json.autoSites});
        }
        
        imWin.style.display = 'none';
      } catch (err) {
        {
          const t = Locales.get(window.__lang);
          UI.showNotification(t.invalid_json);
        }
      }
    };
    reader.readAsText(file);
  }

  if(imMenu){
    imMenu.onclick = () => {
      UI.els.menuDropdown.classList.remove('open');
      imWin.style.display = 'flex';
      imDrop.classList.add('dashed-border-rotate');
    };
  }
  imClose.onclick = () => { imWin.style.display = 'none'; imDrop.classList.remove('dashed-border-rotate'); };
  imWin.addEventListener('click', e => {
    if(e.target === imWin) {
      imWin.style.display = 'none';
      imDrop.classList.remove('dashed-border-rotate');
    }
  });
  imDrop.onclick = () => imFile.click();
  imDrop.ondragover = e => { e.preventDefault(); imDrop.style.background = 'var(--accent)'; imDrop.style.opacity = '.1'; };
  imDrop.ondragleave = e => { e.preventDefault(); imDrop.style.background = ''; imDrop.style.opacity = '1'; };
  imDrop.ondrop = e => { e.preventDefault(); e.dataTransfer.files[0] && handleImportFile(e.dataTransfer.files[0]); };
  imFile.onchange = e => { e.target.files[0] && handleImportFile(e.target.files[0]); };

  if(exMenu){
    exMenu.onclick = () => {
      UI.els.menuDropdown.classList.remove('open');
      exWin.style.display = 'flex !important';
      exWin.style.setProperty('display', 'flex', 'important');
    };
  }
  exClose.onclick = () => { exWin.style.display = 'none'; };
  exWin.addEventListener('click', e => {
    if(e.target === exWin) {
      exWin.style.display = 'none';
    }
  });
  exDo.onclick = async () => {
    const state = await Storage.get(['accentColor','autoSites','settings','proxyHost','proxyPort']);
    const creds = await Storage.getAuth();

    const out = {};

    if (window.__selectedJsonData) {
      if (window.__selectedJsonData.name) out.name = window.__selectedJsonData.name;
      if (window.__selectedJsonData.icon) out.icon = window.__selectedJsonData.icon;
      if (window.__selectedJsonData.username) out.username = window.__selectedJsonData.username;
      if (window.__selectedJsonData.password) out.password = window.__selectedJsonData.password;
      if (window.__selectedJsonData.proxy) out.proxy = window.__selectedJsonData.proxy;
    }

    out.settings = out.settings || state.settings || {};
    out.settings.accentColor = state.accentColor || out.settings.accentColor || null;

    out.autoSites = state.autoSites || [];

    const blob = new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='account.json'; a.click(); URL.revokeObjectURL(url);
    {
      const t = Locales.get(window.__lang);
      UI.showNotification(t.exported_settings);
    }
    exWin.style.display = 'none';
  };
},


setupJson:()=>{}
};