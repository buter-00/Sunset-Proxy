const UI = {
  els: {},

  init: () => {
    UI.els = {
      pwr: document.getElementById('pwr'),
      main: document.getElementById('ui-main'),
      statusContainer: document.querySelector('.status'), 
      status: document.getElementById('st-txt'), 
      
      langBtn: document.getElementById('lang-btn'),
      themeBtn: document.getElementById('theme-btn'),
      colorBtn: document.getElementById('color-btn'),
      colorPicker: document.getElementById('color-picker'),
      colorPreview: document.getElementById('color-preview'),
      tIcon: document.getElementById('t-icon'),
      tPath: document.getElementById('t-path'),
      
      ip: document.getElementById('v-ip'),
      eyeBox: document.getElementById('eye-box'),
      ipToggle: document.getElementById('ip-toggle'),
      ipWarning: document.getElementById('ip-warning'),
      ipWarningRow: document.getElementById('ip-warning-row'),
      
      select: document.getElementById('custom-select'),
      selectedVal: document.getElementById('selected-val'),
      
      menuWebrtc: document.getElementById('menu-webrtc'),
      webrtcDot: document.getElementById('top-dot'),
      ping: document.getElementById('v-pi'),
      
      timeH: document.getElementById('th'),
      timeM: document.getElementById('tm'),
      timeS: document.getElementById('ts'),
      
      country: document.getElementById('v-co'),
      flagImg: document.getElementById('flag-img'),

      __flagErrorHandler: null,
      
      modal: document.getElementById('auth-modal'),
      username: document.getElementById('auth-username'),
      password: document.getElementById('auth-password'),
      authBtn: document.getElementById('auth-submit'),
      forgetBtn: document.getElementById('auth-forget'),
      
      accountBtn: document.getElementById('account-btn'),
      accountIcon: document.getElementById('header-account-icon'),
      accountName: document.getElementById('header-account-name'),
      
      menuWrapper: document.querySelector('.menu-wrapper'),
      menuBtn: document.getElementById('menu-btn'),
      menuDropdown: document.getElementById('menu-dropdown'),
      menuVersionNum: document.getElementById('menu-version-num')
    };
    if (UI.els.flagImg) {
      UI.els.flagImg.onerror = () => { UI.els.flagImg.style.display = 'none'; };
    }
  },

  showNotification: (msg, duration = 3000) => {
    const div = document.createElement('div');
    div.style = 'position:fixed;top:20px;right:20px;background:var(--btn);border:1px solid var(--border);border-radius:8px;padding:12px 16px;color:var(--text);font-size:12px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9999;max-width:250px;word-wrap:break-word;';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), duration);
  },

  updateWebRTC: () => {
    Storage.get(['webrtcOn', 'vpnOn']).then(res => {
      const isActive = res.webrtcOn && res.vpnOn;
      UI.els.webrtcDot.classList.toggle('active', isActive);
      UI.els.menuWebrtc.classList.toggle('active', isActive);
      UI.els.menuWebrtc.classList.toggle('enabled', !!res.webrtcOn);
    });
    
    const dot = document.getElementById('top-dot');
    if (dot && !dot.classList.contains('active')) {
      dot.style.background = 'var(--border)';
    }
  },

  updateTexts: (lang, callback) => {
    const t = Locales.get(lang);
    UI.els.langBtn.innerText = lang.toUpperCase();
    UI.els.langBtn.title = t.tip_lang;
    UI.els.themeBtn.title = t.tip_theme;
    UI.els.colorBtn.title = t.tip_color || t.color_reset || 'Цвет акцента';

    document.getElementById('menu-webrtc-text').innerText = t.webrtc || 'WebRTC';
    const mAuto = document.getElementById('menu-autosites-text');
    if (mAuto) mAuto.innerText = t.menu_autosites;
    const mImp = document.getElementById('menu-import-text');
    if (mImp) mImp.innerText = t.menu_import;
    const mExp = document.getElementById('menu-export-text');
    if (mExp) mExp.innerText = t.menu_export;

    const hTitle = document.getElementById('header-title');
    if (hTitle) hTitle.innerText = t.app_title || 'Sunset Proxy';

    document.getElementById('l-ip').innerText = t.ip;
    document.getElementById('l-ipv6').innerText = t.ipv6;
    document.getElementById('l-co').innerText = t.co;
    document.getElementById('l-pi').innerText = t.pi;
    document.getElementById('l-wr').innerText = t.webrtc_title || t.webrtc || 'WebRTC';
    document.getElementById('l-wr').title = t.webrtc_title || 'WebRTC protection';
    document.getElementById('top-dot').title = t.webrtc_status;
    document.getElementById('sh').innerText = t.h;
    document.getElementById('sm').innerText = t.m;
    document.getElementById('ss').innerText = t.s;
    document.getElementById('auth-title').innerText = t.auth_title;
    UI.els.username.placeholder = t.auth_username;
    UI.els.password.placeholder = t.auth_password;
    UI.els.authBtn.innerText = t.auth_login;
    UI.els.forgetBtn.innerText = t.auth_forget;
    const secureEl = document.getElementById('secure-text');
    if (secureEl) secureEl.innerText = t.secure;

    
    const cReset = document.getElementById('color-reset');
    if (cReset) cReset.innerText = t.color_reset;
    const cSave = document.getElementById('color-save');
    if (cSave) cSave.innerText = t.color_save;
    const cJson = document.getElementById('color-select-file');
    if (cJson) cJson.innerText = t.color_json;

    
    const siteT = document.getElementById('site-title');
    if (siteT) siteT.innerText = t.site_modal_title;
    const siteA = document.getElementById('site-add');
    if (siteA) siteA.innerText = t.site_add;
    const siteC = document.getElementById('site-close');
    if (siteC) siteC.innerText = t.site_close;
    const siteInput = document.getElementById('site-input');
    if(siteInput) siteInput.placeholder = t.placeholder_example || 'example.com';
    const siteSave = document.getElementById('site-save');
    if(siteSave) siteSave.innerText = t.save || 'Save';

    
    const impT = document.getElementById('import-title');
    if (impT) impT.innerText = t.import_settings_title;
    const expT = document.getElementById('export-title');
    if (expT) expT.innerText = t.export_settings_title;
    const expDo = document.getElementById('export-do');
    if (expDo) expDo.innerText = t.download_settings;
    const dropHint = document.getElementById('import-drop-hint');
    if (dropHint) dropHint.innerHTML = t.drop_json_hint;

    if (window.__lastCC && window.__countriesData) {
      const ccUpper = window.__lastCC.toUpperCase();
      if (window.__countriesData[ccUpper]) {
        const countryEntry = window.__countriesData[ccUpper];
        if (lang === 'ru' && countryEntry.ru) {
          UI.els.country.innerText = countryEntry.ru;
        } else if (lang === 'en' && countryEntry.en) {
          UI.els.country.innerText = countryEntry.en;
        }
      }
    }
    
    if (callback) callback();
  },

  sync: (isOn, callback) => {
    const main = UI.els.main;
    
    if (isOn) {
      const color = window.__currentAccentColor || '#22c55e';

      const originalTransition = main.style.transition;
      main.style.transition = 'none';

      document.documentElement.style.setProperty('--accent', color, '');

      const pwrBtn = main.querySelector('.power-btn');
      if (pwrBtn) {
        pwrBtn.style.cssText = '';
        pwrBtn.removeAttribute('style');
        const svg = pwrBtn.querySelector('svg');
        if (svg && svg.querySelector('path')) {
          const path = svg.querySelector('path');
          path.style.cssText = '';
          path.removeAttribute('style');
        }
      }

      if (pwrBtn) {
        const svg = pwrBtn.querySelector('svg');
        if (svg && svg.querySelector('path')) {
          svg.querySelector('path').style.setProperty('fill', color, 'important');
        }
      }

      const timerVals = main.querySelectorAll('.t-val');
      timerVals.forEach(el => {
        el.style.setProperty('color', color, 'important');
      });

      main.classList.add('on');

      setTimeout(() => { 
        main.style.transition = originalTransition; 
      }, 0);
      
      Storage.get(['startTime']).then(res => {
        let start = res.startTime || Date.now();
        if (!res.startTime) Storage.set({ startTime: start });
        if (window.__timerLoop) clearInterval(window.__timerLoop);
        window.__timerLoop = setInterval(() => {
          const diff = Math.floor((Date.now() - start) / 1000);
          UI.els.timeH.innerText = Math.floor(diff / 3600).toString().padStart(2, '0');
          UI.els.timeM.innerText = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
          UI.els.timeS.innerText = (diff % 60).toString().padStart(2, '0');
        }, 1000);
      });
    } else {
      const originalTransition = main.style.transition;
      main.style.transition = 'none';

      main.classList.remove('on');

      const pwrBtn = main.querySelector('.power-btn');
      if (pwrBtn) {
        pwrBtn.style.cssText = '';
        pwrBtn.removeAttribute('style');

        const svg = pwrBtn.querySelector('svg');
        if (svg && svg.querySelector('path')) {
          const path = svg.querySelector('path');
          path.style.cssText = '';
          path.removeAttribute('style');
        }
      }
      
      const timerVals = main.querySelectorAll('.t-val');
      timerVals.forEach(el => {
        el.style.cssText = '';
        el.removeAttribute('style');
      });

      const statusContainer = main.querySelector('.status');
      if (statusContainer) {
        statusContainer.style.cssText = '';
        statusContainer.removeAttribute('style');
      }

      const statusDot = main.querySelector('.status-dot');
      if (statusDot) {
        statusDot.style.cssText = '';
        statusDot.removeAttribute('style');
      }

      const selectTrigger = document.getElementById('select-trigger');
      if (selectTrigger) {
        selectTrigger.style.cssText = '';
        selectTrigger.removeAttribute('style');
      }

      setTimeout(() => { 
        main.style.transition = originalTransition; 
      }, 0);
      
      if (window.__timerLoop) clearInterval(window.__timerLoop);
      Storage.remove('startTime');
      UI.els.timeH.innerText = "00";
      UI.els.timeM.innerText = "00";
      UI.els.timeS.innerText = "00";
    }
    UI.setColorButtonState(isOn);
    if (callback) callback();
  },

  showStatus: (lang, isConnecting) => {
    const t = Locales.get(lang);
    if (isConnecting) {
      UI.els.status.innerText = t.wait;
    } else if (UI.els.main.classList.contains('on')) {
      UI.els.status.innerText = t.on;
    } else {
      UI.els.status.innerText = t.off;
    }

    const statusContainer = UI.els.statusContainer;
    if (statusContainer) {
      if (UI.els.main.classList.contains('on')) {
        const color = window.__currentAccentColor || '#22c55e';
        const rgb = parseInt(color.slice(1), 16);
        const r = (rgb >> 16) & 255;
        const g = (rgb >> 8) & 255;
        const b = rgb & 255;
        statusContainer.style.setProperty('color', color, '!important');
        statusContainer.style.setProperty('borderColor', color, '!important');
        statusContainer.style.setProperty('boxShadow', `0 0 8px rgba(${r},${g},${b},0.3)`, '!important');
      } else {
        statusContainer.style.cssText = '';
        statusContainer.removeAttribute('style');
        const statusDot = UI.els.statusDot;
        if (statusDot) {
          statusDot.style.cssText = '';
          statusDot.removeAttribute('style');
        }
      }
    }
  },

  showAuthModal: () => {
    UI.els.modal.style.display = 'flex';
    UI.els.username.value = '';
    UI.els.password.value = '';
    Storage.hasCreds().then(has => {
      UI.els.forgetBtn.style.display = has ? 'block' : 'none';
    });
    UI.els.username.focus();
  },

  hideAuthModal: () => {
    UI.els.modal.style.display = 'none';
  },

  updateAccountStatus: () => {
    const t = Locales.get(window.__lang);
    Storage.hasCreds().then(has => {
      UI.els.accountIcon.innerHTML = SMILEY_ICON;
      
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent');
      UI.els.accountIcon.style.color = accent;

      UI.els.accountBtn.classList.toggle('logged-in', has);
      if (has) {
        const guest = t.account_guest;
        const name = window.__accountInfo?.name || guest;
        UI.els.accountName.innerText = name;
      } else {
        UI.els.accountName.innerText = t.account_guest;
      }
    });
  },

  setColorButtonState: (enabled) => {
    const btn = UI.els.colorBtn;
    if (!btn) return;
    btn.classList.toggle('disabled', !enabled);
    UI.els.colorPreview.style.background = window.__currentAccentColor || '#22c55e';
  },

  showAccount: (data) => {
    UI.updateAccountStatus();
  },

  setPingColor: (duration) => {
    const mode = Utils.isLightMode() ? 'light' : 'dark';
    let colors;
    if (duration < 100) colors = PING_COLORS.good[mode];
    else if (duration < 250) colors = PING_COLORS.medium[mode];
    else colors = PING_COLORS.bad[mode];
    
    UI.els.ping.style.color = colors.color;
    UI.els.ping.style.textShadow = colors.shadow;
  },

  updatePingColor: (duration) => UI.setPingColor(duration),

  toggleTheme: () => {
    UI.els.tIcon.classList.add('rotate-anim');
    setTimeout(() => UI.els.tIcon.classList.remove('rotate-anim'), 600);
    const isLight = document.body.classList.toggle('light-mode');
    UI.els.tPath.setAttribute('d', isLight ? SUN_PATH : MOON_PATH);
    Storage.set({ theme: isLight ? 'light' : 'dark' });

    if (document.getElementById('ui-main').classList.contains('on')) {
      const color = window.__currentAccentColor || '#22c55e';
      
      UI.setAccentColor(color);
    }
  },

  toggleIp: () => {
    window.__ipHidden = !window.__ipHidden;
    UI.els.ip.innerText = window.__ipHidden ? "••• ••• ••• •••" : window.__realIP;
    UI.els.eyeBox.innerHTML = window.__ipHidden ? EYE_OFF : EYE_ON;

    const eyeIcon = UI.els.eyeBox.querySelector('.eye-icon');
    if (eyeIcon) {
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      eyeIcon.style.stroke = accentColor;
    }
    
    if (UI.els.ipWarning) {
      UI.els.ipWarning.style.visibility = window.__ipHidden ? 'hidden' : 'visible';
    }
  },

  setAccentColor: (color, isPreview = false) => {
    if (window.__previewTimeout) {
      clearTimeout(window.__previewTimeout);
      window.__previewTimeout = null;
    }

    window.__currentAccentColor = color;

    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const contrastText = luminance > 186 ? '#000' : '#fff';
    if (!isPreview) {
      document.documentElement.style.setProperty('--accent', color);
      document.documentElement.style.setProperty('--accent-shadow', `rgba(${r},${g},${b},0.3)`);
      document.documentElement.style.setProperty('--accent-rgb', `${r},${g},${b}`);
    }

    UI.els.colorPreview.style.backgroundColor = color;
    UI.els.colorPicker.value = color;
    const uiMain = document.getElementById('ui-main');

    const instant = (el, fn) => {
      const t = el.style.transition;
      el.style.transition = 'none';
      fn(el);
      setTimeout(() => { el.style.transition = t; }, 0);
    };

    const clearAllStyles = (el) => {
      el.style.cssText = '';
      el.removeAttribute('style');
    };

    if (isPreview) {
      const powerBtn = document.querySelector('.power-btn');
      if (powerBtn && !document.getElementById('ui-main').classList.contains('on')) {
        powerBtn.style.setProperty('borderColor', color, 'important');
        const svg = powerBtn.querySelector('svg');
        if (svg && svg.querySelector('path')) {
          svg.querySelector('path').style.setProperty('fill', color, 'important');
        }
      }
      document.querySelectorAll('.accent').forEach(el=>{
        el.style.backgroundColor = color;
        el.style.borderColor = color;
        el.style.color = contrastText;
      });
}

    const headerIcons = document.querySelectorAll('#header-account-icon, .account-icon, #header-title, .header-logo');
    headerIcons.forEach(el => instant(el, e => {
      clearAllStyles(e);
      if(e.tagName.toLowerCase()==='svg'){
        e.style.color = color;
      } else {
        e.style.color = color;
      }
    }));

    const ring = document.querySelector('.ring-circle');
    if (ring) {
      ring.style.stroke = color;
      if (uiMain && uiMain.classList.contains('on')) {
        ring.style.filter = `drop-shadow(0 0 8px ${color})`;
      } else {
        ring.style.filter = '';
      }
    }

    const buttons = document.querySelectorAll('#pwr, .power-btn, .nav-btn, .account-btn, .color-btn-small');
    buttons.forEach(el => {
      clearAllStyles(el);
      if (uiMain && uiMain.classList.contains('on')) {
        el.style.borderColor = color;
        el.style.boxShadow = `0 0 12px rgba(${r},${g},${b},0.3)`;
      }
      if (el.classList.contains('accent')) {
        el.style.backgroundColor = color;
        el.style.color = contrastText;
      }
    });

    const powerBtn = document.querySelector('.power-btn');
    if (powerBtn) {
      instant(powerBtn, e => {
        clearAllStyles(e);
        e.style.color = color;
        e.style.borderColor = color;
        e.style.boxShadow = `0 0 12px rgba(${r},${g},${b},0.3)`;
      });
      
      const svg = powerBtn.querySelector('svg');
      if (svg && svg.querySelector('path')) {
        const path = svg.querySelector('path');
        clearAllStyles(path);
      }

      if (isPreview && !document.getElementById('ui-main').classList.contains('on')) {
        powerBtn.style.setProperty('borderColor', color, 'important');
        const svg = powerBtn.querySelector('svg');
        if (svg && svg.querySelector('path')) {
          svg.querySelector('path').style.setProperty('fill', color, 'important');
        }
      } else if (!isPreview && !document.getElementById('ui-main').classList.contains('on')) {
        powerBtn.style.cssText = '';
        powerBtn.removeAttribute('style');
        const svg = powerBtn.querySelector('svg');
        if (svg && svg.querySelector('path')) {
          const path = svg.querySelector('path');
          path.style.cssText = '';
          path.removeAttribute('style');
        }
      }
    }

    const statusContainer = document.querySelector('.status');
    if (statusContainer) instant(statusContainer, e => {
      clearAllStyles(e);
      if (document.getElementById('ui-main').classList.contains('on') || isPreview) {
        e.style.setProperty('borderColor', color, '!important');
        e.style.setProperty('color', color, '!important');
        if (document.getElementById('ui-main').classList.contains('on')) {
          e.style.setProperty('boxShadow', `0 0 8px rgba(${r},${g},${b},0.3)`, '!important');
        }
      } else {
        e.style.cssText = '';
        e.removeAttribute('style');
      }
    });

    const statusDot = document.querySelector('.status-dot');
    if (statusDot) instant(statusDot, e => {
      clearAllStyles(e);
      if (document.getElementById('ui-main').classList.contains('on') || isPreview) {
        e.style.setProperty('background', color, '!important');
      } else {
        e.style.cssText = '';
        e.removeAttribute('style');
      }
    });

    const ipBox = document.getElementById('ip-toggle');
    if (ipBox) instant(ipBox, e => {
      clearAllStyles(e);
      if (uiMain && uiMain.classList.contains('on')) {
        e.style.borderColor = color;
      }
    });

    const selectBox = document.getElementById('select-trigger');
    if (selectBox) {
      instant(selectBox, e => {
        clearAllStyles(e);
        if (uiMain && uiMain.classList.contains('on')) {
          e.style.borderColor = color;
          e.style.boxShadow = `0 0 12px rgba(${r},${g},${b},0.3)`;
        }
      });
    }

    const pingBox = document.getElementById('v-pi');
    if (pingBox) instant(pingBox, e => {
      clearAllStyles(e);
      if (uiMain && uiMain.classList.contains('on')) {
        e.style.setProperty('borderColor', color, '!important');
        e.style.setProperty('boxShadow', `0 0 8px rgba(${r},${g},${b},0.3)`, '!important');
      }
    });

    if (window.__pings && window.__pings.length > 0) {
      UI.setPingColor(window.__pings[window.__pings.length - 1]);
    }

    const modalInputs = document.querySelectorAll('.modal-input');
    modalInputs.forEach(el => instant(el, e => {
      clearAllStyles(e);
      e.style.borderColor = color;
    }));
    
    const modalBtns = document.querySelectorAll('.modal-btn');
    modalBtns.forEach(el => instant(el, e => {
      clearAllStyles(e);
      if (e.classList.contains('modal-btn')) {
        e.style.backgroundColor = color;
      }
    }));

    const toggleLabel = document.querySelector('.toggle-label');
    if (toggleLabel) {
      const checkbox = document.querySelector('.toggle-checkbox');
      if (checkbox && checkbox.checked) {
        instant(toggleLabel, e => {
          clearAllStyles(e);
          e.style.background = color;
        });
      }
    }

    const eyeBox = document.getElementById('eye-box');
    if (eyeBox) {
      const eyeIcon = eyeBox.querySelector('.eye-icon');
      if (eyeIcon) instant(eyeIcon, e => {
        clearAllStyles(e);
        e.style.stroke = color;
      });
    }
    const eyeIcons = document.querySelectorAll('.eye-icon');
    eyeIcons.forEach(el => instant(el, e => {
      clearAllStyles(e);
      e.style.stroke = color;
    }));

    const timerVals = document.querySelectorAll('.t-val');
    if (uiMain && uiMain.classList.contains('on')) {
      timerVals.forEach(el => instant(el, e => {
        e.style.setProperty('color', color, 'important');
      }));
    }

    const jsonDrop = document.getElementById('json-drop');
    if (jsonDrop) instant(jsonDrop, e => {
      clearAllStyles(e);
      e.style.borderColor = color;
    });

    if (uiMain && uiMain.classList.contains('on')) {
      const pwrBtn = uiMain.querySelector('.power-btn');
      if (pwrBtn) {
        const svg = pwrBtn.querySelector('svg');
        if (svg && svg.querySelector('path')) {
          svg.querySelector('path').style.setProperty('fill', color, 'important');
        }
      }
    }

    if (!isPreview) {
      Storage.set({ accentColor: color });
    }
  },

  loadAccentColor: async () => {
    const res = await Storage.get(['accentColor']);
    if (res.accentColor) {
      const savedColor = res.accentColor;
      UI.setAccentColor(savedColor);
      UI.els.colorPicker.value = savedColor;
    }
  }
};

