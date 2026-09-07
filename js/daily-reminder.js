/* NOW-or-NEVER — Daily Points Reminder */
(() => {
  'use strict';

  const KEY = 'nowOrNeverDailyPointsReminder';
  let timer = null;

  const get = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {
      return null;
    }
  };

  const save = value => localStorage.setItem(KEY, JSON.stringify(value));

  function notify() {
    const message = 'Time to update your points and study progress 🎯';
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('NOW-or-NEVER', {
              body: message,
              icon: '/NOW-or-NEVER/logo.png',
              badge: '/NOW-or-NEVER/logo.png',
              tag: 'daily-points-reminder',
              data: { url: '/NOW-or-NEVER/#daily' }
            });
          });
        } else {
          new Notification('NOW-or-NEVER', { body: message });
        }
      } catch {}
    }
    if (typeof window.showToast === 'function') window.showToast('🎯 Time to update your points!');
    try { document.getElementById('hours')?.focus(); } catch {}
  }

  function schedule() {
    clearTimeout(timer);
    const setting = get();
    if (!setting?.enabled || !setting.time) return;
    const [hours, minutes] = setting.time.split(':').map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    timer = setTimeout(() => { notify(); schedule(); }, target - now);
  }

  function ensureStyles() {
    if (document.getElementById('non-reminder-style')) return;
    const style = document.createElement('style');
    style.id = 'non-reminder-style';
    style.textContent = `
      #nonReminderCard { margin-top:14px; padding:16px; border:1px solid rgba(255,255,255,.1); border-radius:16px; background:rgba(255,255,255,.035); }
      #nonReminderCard .nr-row { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
      #nonReminderCard .nr-title { font-weight:800; font-size:16px; }
      #nonReminderCard .nr-note { font-size:12px; opacity:.72; margin-top:4px; }
      #nonReminderCard .nr-controls { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:12px; }
      #nonReminderCard input[type=time] { padding:9px 11px; border-radius:10px; border:1px solid rgba(255,255,255,.14); background:rgba(0,0,0,.25); color:inherit; }
      #nonReminderCard button { padding:9px 12px; border-radius:10px; border:0; cursor:pointer; font-weight:700; }
      .nr-primary { background:#7c5cff; color:#fff; }
      .nr-secondary { background:rgba(255,255,255,.08); color:inherit; }
      .nr-status { font-size:12px; opacity:.8; margin-top:9px; }
      #dailyReminderMoreBtn { cursor:pointer; }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('click', event => {
    const btn = event.target.closest('#dailyReminderNavBtn');
    if (!btn) return;
    setTimeout(() => {
      const card = document.getElementById('dailyPointsReminderCard');
      if (card) {
        card.scrollIntoView({ behavior:'smooth', block:'center' });
        card.querySelector('input[type="time"]')?.focus({ preventScroll:true });
      }
    }, 300);
  });

  function renderMoreMenuButton() {
    const grid = document.querySelector('#moreNavMenu .more-nav-grid');
    if (!grid || document.getElementById('dailyReminderMoreBtn')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'dailyReminderMoreBtn';
    button.className = 'more-nav-item';
    button.dataset.moreView = 'personal';
    button.innerHTML = `<span class="more-icon">⏰</span><span><strong>Daily Reminder</strong><small>Set your points reminder</small></span>`;
    button.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      const moreMenu = document.getElementById('moreNavMenu');
      const moreBtn = document.getElementById('moreNavBtn');
      if (moreMenu) moreMenu.classList.remove('open');
      if (moreBtn) { moreBtn.classList.remove('open'); moreBtn.setAttribute('aria-expanded','false'); }
      document.querySelector('.nav button[data-view="personal"]')?.click();
      setTimeout(() => {
        const card = document.getElementById('nonReminderCard');
        if (card) card.scrollIntoView({ behavior:'smooth', block:'center' });
      }, 80);
    });
    grid.appendChild(button);
  }

  function render() {
    renderMoreMenuButton();
    const host = document.getElementById('personal');
    if (!host || document.getElementById('nonReminderCard')) return;
    ensureStyles();
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'nonReminderCard';
    card.innerHTML = `
      <div class="nr-row"><div><div class="nr-title">⏰ Daily Points Reminder</div><div class="nr-note">Remind me to add today's points and study progress.</div></div><label><input id="nrEnabled" type="checkbox"> Enable</label></div>
      <div class="nr-controls"><input id="nrTime" type="time" value="21:00" aria-label="Reminder time"><button id="nrSave" class="nr-primary" type="button">Save reminder</button><button id="nrSkip" class="nr-secondary" type="button">Skip / Disable</button></div>
      <div id="nrStatus" class="nr-status">Optional — you can leave this disabled.</div>`;
    host.appendChild(card);
    const current = get() || { enabled:false, time:'21:00' };
    card.querySelector('#nrEnabled').checked = !!current.enabled;
    card.querySelector('#nrTime').value = current.time || '21:00';
    updateStatus();
    card.querySelector('#nrSave').addEventListener('click', async () => {
      const enabled = card.querySelector('#nrEnabled').checked;
      const time = card.querySelector('#nrTime').value || '21:00';
      if (!enabled) { save({enabled:false,time}); schedule(); updateStatus(); return; }
      if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { card.querySelector('#nrEnabled').checked=false; updateStatus('Notifications were not enabled. The reminder remains off.'); return; }
      }
      save({enabled:true,time}); schedule(); updateStatus();
      if (typeof window.showToast === 'function') window.showToast(`⏰ Daily reminder set for ${time}`);
    });
    card.querySelector('#nrSkip').addEventListener('click', () => {
      save({enabled:false,time:card.querySelector('#nrTime').value || '21:00'});
      card.querySelector('#nrEnabled').checked=false; schedule(); updateStatus('Reminder skipped. You can enable it anytime.');
    });
    function updateStatus(message) {
      const status = get();
      card.querySelector('#nrStatus').textContent = message || (status?.enabled ? `Enabled daily at ${status.time}.` : 'Optional — you can leave this disabled.');
    }
  }

  function observeNavigation() {
    render();
    new MutationObserver(render).observe(document.body,{subtree:true,childList:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',observeNavigation); else observeNavigation();
  schedule();
})();

/* Load the database-backed student Updates module. */
(() => {
  'use strict';
  function loadStudentUpdates() {
    if (document.getElementById('studentUpdatesScript')) return;
    const script = document.createElement('script');
    script.id = 'studentUpdatesScript';
    script.src = 'js/student-updates.js';
    script.defer = true;
    document.body.appendChild(script);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',loadStudentUpdates,{once:true});
  else loadStudentUpdates();
})();
