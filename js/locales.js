let locales={ru:{},en:{}};

const Locales={
load:async()=>{
try{
await Promise.all(['ru','en'].map(async l=>{
const r=await fetch(chrome.runtime.getURL(`locales/${l}.json`));
locales[l]=await r.json();
}));
}catch(e){console.error('Locales error:',e)}
},
get:l=>locales[l]||locales.ru
};