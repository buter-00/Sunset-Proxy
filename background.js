let proxySettings = {};
fetch(chrome.runtime.getURL('account.json'))
  .then(response => response.json())
  .then(data => {
    if (data.proxy && data.proxy.host && data.proxy.port) {
      proxySettings = data.proxy;
    }
  })
  .catch(() => {});

const getProxyConfig = (username, password, ipv6Off) => {
  let host = proxySettings.host;
  if (ipv6Off && proxySettings.ipv4) {
    host = proxySettings.ipv4;
  }
  const pacScript = `
    function FindProxyForURL(url, host) {
      return "PROXY ${host}:${proxySettings.port}";
    }
  `;
  return {
    mode: "pac_script",
    pacScript: {
      data: pacScript,
      mandatory: false
    }
  };
};

function getVersion() {
  return chrome.runtime.getManifest().version;
}

function enableWebRTCProtection() {
  chrome.privacy.network.webRTCIPHandlingPolicy.set({
    value: "disable_non_proxied_udp",
    scope: "regular"
  });
}

function disableWebRTCProtection() {
  chrome.privacy.network.webRTCIPHandlingPolicy.clear({
    scope: "regular"
  });
}

let currentCredentials = { username: '', password: '' };

chrome.storage.local.get(['username', 'password', 'browser_closed'], (data) => {
  if (data.username && data.password) {
    currentCredentials = {
      username: data.username,
      password: data.password
    };
  }
  
  if (data.browser_closed) {
    chrome.storage.local.set({ browser_closed: false });
  }

  chrome.storage.local.get(['vpnOn'], (result) => {
    if (result.vpnOn === undefined) {
      chrome.storage.local.set({ vpnOn: false, autoProxyEnabled: false });
    } else if (result.autoProxyEnabled === undefined) {
      chrome.storage.local.set({ autoProxyEnabled: false });
    }
  });
});

chrome.windows.onRemoved.addListener((windowId) => {
  chrome.windows.getAll({}, (windows) => {
    if (windows.length === 0) {
      
      currentCredentials = { username: '', password: '' };
      disableWebRTCProtection();
      
      chrome.proxy.settings.clear({ scope: "regular" }, () => {
        if (chrome.runtime.lastError) {
          console.error('Ошибка очистки прокси:', chrome.runtime.lastError);
        }
        chrome.storage.local.set({ vpnOn: false, browser_closed: true });
      });
    }
  });
});

chrome.runtime.onSuspend.addListener(() => {
  chrome.storage.local.get(['vpnOn'], (data) => {
    if (data.vpnOn) {
      chrome.proxy.settings.clear({ scope: "regular" });
      disableWebRTCProtection();
      chrome.storage.local.set({ vpnOn: false, browser_closed: true });
    }
  });
});

try {
  chrome.webRequest.onAuthRequired.addListener(
    (details, callback) => {

      try {
        
        if ((details.isProxy || details.challenger?.host === proxySettings.host) && 
            currentCredentials.username && 
            currentCredentials.password) {
          callback({
            authCredentials: {
              username: currentCredentials.username,
              password: currentCredentials.password
            }
          });
        } else {
          callback({});
        }
      } catch (e) {

        try {
          callback({});
        } catch (e2) {

        }
      }
    },
    { urls: ["<all_urls>"] },
    ["asyncBlocking"]
  );
} catch (e) {
}

function enableProxy() {
  return new Promise((resolve) => {
    try {
      enableWebRTCProtection();
    } catch (e) {
      console.error('WebRTC защита:', e);
    }

    chrome.storage.local.get(['username', 'password', 'ipv6On'], (data) => {
      if (!data.username || !data.password) {
        console.error('[Proxy] Нет учётных данных в storage');
        chrome.storage.local.set({ vpnOn: false });
        resolve({ success: false, error: 'no_credentials' });
        return;
      }

      const ipv6Off = data.ipv6On === false;

      currentCredentials = {
        username: data.username,
        password: data.password
      };

      try {
        const proxyConfig = getProxyConfig(data.username, data.password, ipv6Off);
        chrome.proxy.settings.set({ value: proxyConfig, scope: 'regular' }, () => {
          if (chrome.runtime.lastError) {
            const err = chrome.runtime.lastError.message || 'unknown';
            chrome.storage.local.set({ vpnOn: false });
            currentCredentials = { username: '', password: '' };
            resolve({ success: false, error: err });
          } else {
            
            chrome.proxy.settings.get({ incognito: false }, info => {});

            chrome.storage.local.set({ vpnOn: true, startTime: Date.now() });
            resolve({ success: true });
          }
        });
      } catch (e) {
        console.error('[Proxy] Исключение при установке прокси:', e);
        chrome.storage.local.set({ vpnOn: false });
        currentCredentials = { username: '', password: '' };
        resolve({ success: false, error: e.message });
      }
    });
  });
}

function disableProxy() {
  try {
    chrome.proxy.settings.clear({ scope: "regular" });
  } catch (e) {
    console.error('Ошибка отключения прокси:', e);
  }
  
  try {
    disableWebRTCProtection();
  } catch (e) {
    console.error('WebRTC отключение:', e);
  }

  currentCredentials = { username: '', password: '' };
  
  chrome.storage.local.set({ vpnOn: false, autoProxyEnabled: false });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    
    if (request.action === "enable") {
      enableProxy().then(result => {
        sendResponse({ version: getVersion(), ...result });
      });
      return true;
    }
    
    if (request.action === "disable") {
      disableProxy();
      sendResponse({ success: true, version: getVersion() });
      return true;
    }
    
    if (request.action === "setAuth") {
      chrome.storage.local.set({
        username: request.username,
        password: request.password
      }, () => {
        try {
          enableProxy().then(result => {
            sendResponse({ version: getVersion(), ...result });
          });
        } catch (e) {
          console.error('Ошибка при setAuth:', e);
          sendResponse({ success: false, error: e.message });
        }
      });
      return true;
    }
    
    if (request.action === "getVersion") {
      sendResponse({ version: getVersion() });
      return true;
    }

    if (request.action === 'getVpnStatus') {
      chrome.storage.local.get(['vpnOn'], r => {
        sendResponse({ vpnOn: !!r.vpnOn });
      });
      return true;
    }

    if (request.action === 'disableProxyDueToList') {
      chrome.storage.local.get(['vpnOn','autoProxyEnabled'], r => {
        if (r.vpnOn && r.autoProxyEnabled) {
          disableProxy();
          chrome.runtime.sendMessage({ action: 'proxyStatusChanged', vpnOn: false }).catch(()=>{});
        }
        sendResponse({ success: true });
      });
      return true;
    }

    if (request.action === 'enableProxyDueToList') {
      chrome.storage.local.get(['vpnOn'], r => {
        if (!r.vpnOn) {
          enableProxy().then(() => {
            chrome.storage.local.set({ vpnOn: true, autoProxyEnabled: true });
            chrome.runtime.sendMessage({ action: 'proxyStatusChanged', vpnOn: true }).catch(()=>{});
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ success: true });
        }
      });
      return true;
    }

    sendResponse({ error: 'Unknown action' });
    return true;
  } catch (e) {
    console.error('Ошибка в onMessage listener:', e);
    try {
      sendResponse({ success: false, error: e.message });
    } catch (e2) {
      console.error('Не удалось отправить error response:', e2);
    }
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading' || !tab.url) return;
  
  chrome.storage.local.get(['autoSites', 'vpnOn', 'username', 'password', 'autoProxyEnabled'], (data) => {
    const sites = data.autoSites || [];
    const isAutoSite = sites.some(site => {
      try {
        return tab.url.includes(site);
      } catch (e) {
        return false;
      }
    });
    
    if (isAutoSite && !data.vpnOn && data.username && data.password) {
      enableProxy().then(() => {
        chrome.storage.local.set({ vpnOn: true, autoProxyEnabled: true });
        chrome.runtime.sendMessage({ action: 'proxyStatusChanged', vpnOn: true }).catch(() => {});
      });
    }
    else if (!isAutoSite && data.vpnOn && data.autoProxyEnabled) {
      disableProxy();
      chrome.runtime.sendMessage({ action: 'proxyStatusChanged', vpnOn: false }).catch(() => {});
    }
  });
});
