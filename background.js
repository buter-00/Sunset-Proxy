const DEFAULT_PROXY_SETTINGS = { host: '', port: 0, ipv4: '' };
let proxySettings = { ...DEFAULT_PROXY_SETTINGS };

const storageGet = keys => new Promise(resolve => chrome.storage.local.get(keys, resolve));
const storageSet = values => new Promise(resolve => chrome.storage.local.set(values, resolve));

const isValidProxyConfig = config => {
  if (!config || typeof config.host !== 'string') return false;
  const host = config.host.trim();
  const port = Number(config.port);
  return !!host && Number.isInteger(port) && port > 0 && port <= 65535;
};

const normalizeProxyConfig = config => ({
  host: String(config.host || '').trim(),
  port: Number(config.port),
  ipv4: String(config.ipv4 || '').trim()
});

async function loadBundledAccountData() {
  try {
    const response = await fetch(chrome.runtime.getURL('account.json'));
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}

async function loadBundledAccountProxy() {
  const data = await loadBundledAccountData();
  if (!isValidProxyConfig(data?.proxy)) return null;
  return normalizeProxyConfig(data.proxy);
}

async function bootstrapAccountFromFile() {
  const bundled = await loadBundledAccountData();
  if (!bundled) return;

  const patch = {};

  // Do not auto-import credentials from bundled account.json.
  if (bundled.settings && typeof bundled.settings === 'object') {
    patch.settings = bundled.settings;
  }
  if (Array.isArray(bundled.autoSites)) {
    const existingSites = (await storageGet(['autoSites'])).autoSites;
    if (!Array.isArray(existingSites) || existingSites.length === 0) {
      patch.autoSites = bundled.autoSites;
    }
  }

  const fileAccent = bundled?.settings?.accentColor || bundled?.accentColor;
  if (fileAccent) patch.accentColor = fileAccent;
  if (bundled?.settings?.theme) patch.theme = bundled.settings.theme;
  if (bundled?.settings?.lang) patch.lang = bundled.settings.lang;

  if (isValidProxyConfig(bundled?.proxy)) {
    patch.proxyHost = bundled.proxy.host;
    patch.proxyPort = Number(bundled.proxy.port);
    patch.proxyIpv4 = bundled.proxy.ipv4 || '';
  }

  if (Object.keys(patch).length > 0) {
    await storageSet(patch);
  }
}

async function loadProxySettings() {
  const stored = await storageGet(['proxyHost', 'proxyPort', 'proxyIpv4']);
  const fromStorage = {
    host: stored.proxyHost,
    port: stored.proxyPort,
    ipv4: stored.proxyIpv4
  };

  if (isValidProxyConfig(fromStorage)) {
    proxySettings = normalizeProxyConfig(fromStorage);
    return proxySettings;
  }

  const bundled = await loadBundledAccountProxy();
  if (bundled) {
    proxySettings = bundled;
    await storageSet({
      proxyHost: bundled.host,
      proxyPort: bundled.port,
      proxyIpv4: bundled.ipv4 || ''
    });
    return proxySettings;
  }

  proxySettings = { ...DEFAULT_PROXY_SETTINGS };
  return proxySettings;
}

let proxySettingsReady = (async () => {
  await bootstrapAccountFromFile();
  return loadProxySettings();
})();

const getProxyConfig = ipv6Off => {
  const host = ipv6Off && proxySettings.ipv4 ? proxySettings.ipv4 : proxySettings.host;
  const pacScript = `
    function FindProxyForURL(url, host) {
      return "PROXY ${host}:${proxySettings.port}";
    }
  `;
  return {
    mode: 'pac_script',
    pacScript: {
      data: pacScript,
      mandatory: true
    }
  };
};

const getVersion = () => chrome.runtime.getManifest().version;

function enableWebRTCProtection() {
  chrome.privacy.network.webRTCIPHandlingPolicy.set({
    value: 'disable_non_proxied_udp',
    scope: 'regular'
  });
}

function disableWebRTCProtection() {
  chrome.privacy.network.webRTCIPHandlingPolicy.clear({ scope: 'regular' });
}

let currentCredentials = { username: '', password: '' };

chrome.storage.local.get(['username', 'password', 'browser_closed'], data => {
  if (data.username && data.password) {
    currentCredentials = { username: data.username, password: data.password };
  }

  if (data.browser_closed) {
    chrome.storage.local.set({ browser_closed: false });
  }

  chrome.storage.local.get(['vpnOn', 'autoProxyEnabled'], result => {
    if (result.vpnOn === undefined) {
      chrome.storage.local.set({ vpnOn: false, autoProxyEnabled: false });
    } else if (result.autoProxyEnabled === undefined) {
      chrome.storage.local.set({ autoProxyEnabled: false });
    }
  });
});

chrome.windows.onRemoved.addListener(() => {
  chrome.windows.getAll({}, windows => {
    if (windows.length !== 0) return;

    currentCredentials = { username: '', password: '' };
    disableWebRTCProtection();

    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
      if (chrome.runtime.lastError) {
        console.error('Proxy clear failed:', chrome.runtime.lastError.message || chrome.runtime.lastError);
      }
      chrome.storage.local.set({ vpnOn: false, autoProxyEnabled: false, browser_closed: true });
    });
  });
});

chrome.runtime.onSuspend.addListener(() => {
  chrome.storage.local.get(['vpnOn'], data => {
    if (!data.vpnOn) return;
    chrome.proxy.settings.clear({ scope: 'regular' });
    disableWebRTCProtection();
    chrome.storage.local.set({ vpnOn: false, autoProxyEnabled: false, browser_closed: true });
  });
});

chrome.webRequest.onAuthRequired.addListener(
  (details, callback) => {
    try {
      const challengerHost = details.challenger?.host || '';
      const isOurProxy = details.isProxy || challengerHost === proxySettings.host || challengerHost === proxySettings.ipv4;

      if (isOurProxy && currentCredentials.username && currentCredentials.password) {
        callback({
          authCredentials: {
            username: currentCredentials.username,
            password: currentCredentials.password
          }
        });
        return;
      }

      callback({});
    } catch (e) {
      try {
        callback({});
      } catch (_) {}
    }
  },
  { urls: ['<all_urls>'] },
  ['asyncBlocking']
);

async function enableProxy() {
  try {
    proxySettingsReady = loadProxySettings();
    await proxySettingsReady;

    if (!isValidProxyConfig(proxySettings)) {
      await storageSet({ vpnOn: false, autoProxyEnabled: false });
      return { success: false, error: 'proxy_not_configured' };
    }

    const data = await storageGet(['username', 'password', 'ipv6On', 'webrtcOn']);
    if (data.webrtcOn === false) {
      disableWebRTCProtection();
    } else {
      enableWebRTCProtection();
    }
    if (!data.username || !data.password) {
      await storageSet({ vpnOn: false, autoProxyEnabled: false });
      return { success: false, error: 'no_credentials' };
    }

    currentCredentials = {
      username: data.username,
      password: data.password
    };

    const ipv6Off = data.ipv6On === false;
    const proxyConfig = getProxyConfig(ipv6Off);

    return new Promise(resolve => {
      chrome.proxy.settings.set({ value: proxyConfig, scope: 'regular' }, async () => {
        if (chrome.runtime.lastError) {
          currentCredentials = { username: '', password: '' };
          await storageSet({ vpnOn: false, autoProxyEnabled: false });
          resolve({ success: false, error: chrome.runtime.lastError.message || 'unknown_error' });
          return;
        }

        await storageSet({ vpnOn: true, startTime: Date.now() });
        resolve({ success: true });
      });
    });
  } catch (e) {
    currentCredentials = { username: '', password: '' };
    await storageSet({ vpnOn: false, autoProxyEnabled: false });
    return { success: false, error: e.message || 'enable_failed' };
  }
}

function disableProxy() {
  try {
    chrome.proxy.settings.clear({ scope: 'regular' });
  } catch (e) {
    console.error('Disable proxy failed:', e);
  }

  try {
    disableWebRTCProtection();
  } catch (e) {
    console.error('Disable WebRTC protection failed:', e);
  }

  currentCredentials = { username: '', password: '' };
  chrome.storage.local.set({ vpnOn: false, autoProxyEnabled: false });
}

const normalizeSiteRule = site => {
  if (!site || typeof site !== 'string') return '';
  const trimmed = site.trim().toLowerCase();
  if (!trimmed) return '';

  const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
  return withoutProtocol.split('/')[0].replace(/^\.+|\.+$/g, '');
};

const isAutoSiteUrl = (url, sites) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (sites || []).some(site => {
      const rule = normalizeSiteRule(site);
      if (!rule) return false;
      return host === rule || host.endsWith(`.${rule}`);
    });
  } catch {
    return false;
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request.action === 'enable') {
      const result = await enableProxy();
      sendResponse({ version: getVersion(), ...result });
      return;
    }

    if (request.action === 'disable') {
      disableProxy();
      sendResponse({ success: true, version: getVersion() });
      return;
    }

    if (request.action === 'setAuth') {
      await storageSet({ username: request.username || '', password: request.password || '' });
      const result = await enableProxy();
      sendResponse({ version: getVersion(), ...result });
      return;
    }

    if (request.action === 'setProxyConfig') {
      const incoming = {
        host: request.host,
        port: request.port,
        ipv4: request.ipv4 || ''
      };
      if (!isValidProxyConfig(incoming)) {
        sendResponse({ success: false, error: 'invalid_proxy_config' });
        return;
      }

      const normalized = normalizeProxyConfig(incoming);
      proxySettings = normalized;
      await storageSet({
        proxyHost: normalized.host,
        proxyPort: normalized.port,
        proxyIpv4: normalized.ipv4
      });
      sendResponse({ success: true });
      return;
    }

    if (request.action === 'getVersion') {
      sendResponse({ version: getVersion() });
      return;
    }

    if (request.action === 'getVpnStatus') {
      const r = await storageGet(['vpnOn']);
      sendResponse({ vpnOn: !!r.vpnOn });
      return;
    }

    if (request.action === 'disableProxyDueToList') {
      const r = await storageGet(['vpnOn', 'autoProxyEnabled']);
      if (r.vpnOn && r.autoProxyEnabled) {
        disableProxy();
        chrome.runtime.sendMessage({ action: 'proxyStatusChanged', vpnOn: false }).catch(() => {});
      }
      sendResponse({ success: true });
      return;
    }

    if (request.action === 'enableProxyDueToList') {
      const r = await storageGet(['vpnOn']);
      if (!r.vpnOn) {
        await storageSet({ webrtcOn: true });
        const result = await enableProxy();
        if (result.success) {
          await storageSet({ autoProxyEnabled: true });
          chrome.runtime.sendMessage({ action: 'proxyStatusChanged', vpnOn: true }).catch(() => {});
        }
        sendResponse(result);
        return;
      }

      sendResponse({ success: true });
      return;
    }

    sendResponse({ success: false, error: 'unknown_action' });
  })().catch(e => {
    console.error('onMessage failed:', e);
    sendResponse({ success: false, error: e.message || 'internal_error' });
  });

  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading' || !tab.url) return;

  chrome.storage.local.get(['autoSites', 'vpnOn', 'username', 'password', 'autoProxyEnabled'], async data => {
    const sites = data.autoSites || [];
    const isAutoSite = isAutoSiteUrl(tab.url, sites);

    if (isAutoSite && !data.vpnOn && data.username && data.password) {
      chrome.storage.local.set({ webrtcOn: true });
      const result = await enableProxy();
      if (result.success) {
        chrome.storage.local.set({ autoProxyEnabled: true });
        chrome.runtime.sendMessage({ action: 'proxyStatusChanged', vpnOn: true }).catch(() => {});
      }
      return;
    }

    if (!isAutoSite && data.vpnOn && data.autoProxyEnabled) {
      disableProxy();
      chrome.runtime.sendMessage({ action: 'proxyStatusChanged', vpnOn: false }).catch(() => {});
    }
  });
});

