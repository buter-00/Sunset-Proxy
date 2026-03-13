const SERVERS=[
["dns.google","Google DNS"],
["cloudflare-dns.com","Cloudflare DNS"],
["opendns.com","OpenDNS"],
["quad9.net","Quad9"]
].map(([i,n])=>({val:`https://${i}`,name:`${n} (${i})`}));

const SMILEY_ICON='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>';

const SUN_PATH="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M12 3v1M12 20v1M3 12h1M20 12h1M5.6 5.6l.7.7M17.7 17.7l.7.7M5.6 18.4l.7-.7M17.7 6.3l.7-.7";
const MOON_PATH="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z";

const EYE_OFF='<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

const EYE_ON='<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

const PING_COLORS={
good:{light:{color:"#16a34a",border:"#16a34a",shadow:"0 0 6px rgba(22,163,74,.4)"},dark:{color:"#22c55e",border:"#22c55e",shadow:"0 0 8px rgba(34,197,94,.6)"}},
medium:{light:{color:"#ff8811",border:"#ff8811",shadow:"0 0 6px rgba(255,136,17,.4)"},dark:{color:"#ffaa44",border:"#ffaa44",shadow:"0 0 8px rgba(255,170,68,.6)"}},
bad:{light:{color:"#cc0000",border:"#cc0000",shadow:"0 0 6px rgba(204,0,0,.4)"},dark:{color:"#ff5555",border:"#ff5555",shadow:"0 0 8px rgba(255,85,85,.6)"}}};
