const Utils = {
  sendMsg: (action, cb) =>
    chrome.runtime.sendMessage({ action }, res => !chrome.runtime.lastError && cb?.(res)),

  async setWebRTC(state, cb) {
    const policy = state ? 'disable_non_proxied_udp' : 'default_public_and_private_interfaces';
    const w = chrome.privacy?.network?.webRTCIPHandlingPolicy;
    if (!w) return cb?.();
    w.set({ value: policy }, async () => {
      await Storage.set({ webrtcOn: state });
      UI.updateWebRTC();
      cb?.();
    });
  },

  isLightMode: () => document.body.classList.contains('light-mode'),

  getVersion: (cb) => Utils.sendMsg('getVersion', r => r?.version && cb?.(r.version)),

  extractHost: (url) => {
    try {
      const u = new URL(url);
      return u.host;
    } catch (e) {
      return '';
    }
  }
};

