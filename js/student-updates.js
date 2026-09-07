/* =========================================================
   NOW-or-NEVER — STUDENT UPDATES
   Reads published/enabled updates through the secure RPC.
   Also shows a small floating announcement for unread updates.
   ========================================================= */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://kvbbgvfrllptqpbkixnv.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-';
  const SEEN_KEY = 'nowOrNeverSeenUpdates';
  const DISMISSED_FLOAT_KEY = 'nowOrNeverDismissedUpdateFloat';
  const REFRESH_MS = 60000;

  let client = null;
  let timer = null;
  let currentUpdates = [];

  function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
  }

  function seenIds() {
    try {
      const value = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch {
      return new Set();
    }
  }

  function saveSeen(ids) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-100))); } catch {}
  }

  function dismissedFloatId() {
    try { return localStorage.getItem(DISMISSED_FLOAT_KEY) || ''; } catch { return ''; }
  }

  function setDismissedFloatId(id) {
    try { localStorage.setItem(DISMISSED_FLOAT_KEY, String(id)); } catch {}
  }

  function markSeen(update) {
    if (!update) return;
    const ids = seenIds();
    ids.add(String(update.id));
    saveSeen(ids);
  }

  function ensureStyles() {
    if (document.getElementById('student-updates-style')) return;

    const style = document.createElement('style');
    style.id = 'student-updates-style';
    style.textContent = `
      .student-updates-section { margin:0 0 14px; padding:14px; border:1px solid rgba(255,255,255,.10); border-radius:15px; background:rgba(124,92,255,.055); }
      .student-updates-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; }
      .student-updates-title { font-weight:800; font-size:14px; }
      .student-updates-count { display:inline-flex; min-width:20px; height:20px; padding:0 6px; align-items:center; justify-content:center; border-radius:999px; background:#7c5cff; color:#fff; font-size:11px; font-weight:800; }
      .student-update-item { padding:12px; border-radius:12px; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.07); margin-top:8px; }
      .student-update-item:first-child { margin-top:0; }
      .student-update-item.is-new { border-color:rgba(124,92,255,.42); }
      .student-update-meta { display:flex; align-items:center; flex-wrap:wrap; gap:6px; font-size:10px; opacity:.72; margin-bottom:5px; }
      .student-update-type { font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
      .student-update-title-row { display:flex; gap:8px; align-items:flex-start; }
      .student-update-icon { font-size:20px; line-height:1.2; }
      .student-update-title { font-weight:800; font-size:14px; }
      .student-update-content { margin:7px 0 0; font-size:12px; line-height:1.55; white-space:normal; }
      .student-update-new { margin-left:auto; padding:2px 6px; border-radius:999px; background:rgba(124,92,255,.18); font-size:9px; font-weight:800; }
      .student-updates-empty { font-size:12px; opacity:.65; padding:4px 0; }
      .student-updates-mark { border:0; background:transparent; color:inherit; opacity:.65; font-size:10px; cursor:pointer; padding:2px 0; }

      #studentUpdateFloat {
        position:fixed; right:22px; bottom:22px; width:min(370px,calc(100vw - 32px)); z-index:9998;
        padding:15px; border:1px solid rgba(124,92,255,.38); border-radius:18px;
        background:rgba(18,15,32,.96); color:inherit;
        box-shadow:0 18px 55px rgba(0,0,0,.42),0 0 28px rgba(124,92,255,.14);
        backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
        animation:nonUpdateFloatIn .35s ease-out;
      }
      #studentUpdateFloat .suf-top { display:flex; align-items:flex-start; gap:10px; }
      #studentUpdateFloat .suf-icon { width:38px; height:38px; flex:0 0 38px; display:grid; place-items:center; border-radius:12px; background:rgba(124,92,255,.16); font-size:21px; }
      #studentUpdateFloat .suf-main { min-width:0; flex:1; }
      #studentUpdateFloat .suf-label { font-size:10px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; opacity:.7; margin-bottom:3px; }
      #studentUpdateFloat .suf-title { font-size:15px; line-height:1.3; font-weight:850; overflow:hidden; text-overflow:ellipsis; }
      #studentUpdateFloat .suf-content { margin-top:9px; font-size:12px; line-height:1.5; opacity:.82; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
      #studentUpdateFloat .suf-actions { display:flex; align-items:center; gap:8px; margin-top:12px; }
      #studentUpdateFloat .suf-view,#studentUpdateFloat .suf-dismiss { border:0; border-radius:10px; padding:8px 11px; cursor:pointer; font-size:11px; font-weight:800; }
      #studentUpdateFloat .suf-view { background:#7c5cff; color:#fff; flex:1; }
      #studentUpdateFloat .suf-dismiss { background:rgba(255,255,255,.08); color:inherit; }
      #studentUpdateFloat .suf-close { position:absolute; top:9px; right:10px; border:0; background:transparent; color:inherit; opacity:.55; cursor:pointer; font-size:17px; line-height:1; padding:3px; }
      @keyframes nonUpdateFloatIn { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      @media (max-width:600px) { #studentUpdateFloat { right:10px; bottom:10px; width:calc(100vw - 20px); border-radius:16px; } }
    `;
    document.head.appendChild(style);
  }

  function ensureHost() {
    const panel = document.getElementById('notificationPanel');
    const list = document.getElementById('notificationList');
    if (!panel || !list) return null;
    let host = document.getElementById('studentUpdatesSection');
    if (host) return host;
    host = document.createElement('section');
    host.id = 'studentUpdatesSection';
    host.className = 'student-updates-section';
    list.parentNode.insertBefore(host, list);
    return host;
  }

  function render(updates) {
    const host = ensureHost();
    if (!host) return;
    const seen = seenIds();
    const unread = updates.filter(update => !seen.has(String(update.id)));

    host.innerHTML = `
      <div class="student-updates-head">
        <div><div class="student-updates-title">📢 Updates</div><div class="small-note">Announcements and new features</div></div>
        <div style="display:flex;align-items:center;gap:8px">
          ${unread.length ? `<span class="student-updates-count">${unread.length}</span>` : ''}
          ${unread.length ? '<button type="button" class="student-updates-mark" id="markUpdatesSeenBtn">Mark read</button>' : ''}
        </div>
      </div>
      <div>${updates.length ? updates.map(update => `
        <article class="student-update-item ${seen.has(String(update.id)) ? '' : 'is-new'}">
          <div class="student-update-meta">
            <span class="student-update-type">${escapeHTML(update.update_type || 'announcement')}</span>
            ${update.pinned ? '<span>📌 Pinned</span>' : ''}
            ${!seen.has(String(update.id)) ? '<span class="student-update-new">NEW</span>' : ''}
          </div>
          <div class="student-update-title-row"><span class="student-update-icon">${escapeHTML(update.icon || '📢')}</span><div class="student-update-title">${escapeHTML(update.title)}</div></div>
          <div class="student-update-content">${escapeHTML(update.content).replaceAll('\n','<br>')}</div>
          <div class="student-update-meta" style="margin:7px 0 0">${update.published_at ? new Date(update.published_at).toLocaleString('en-IN') : ''}</div>
        </article>`).join('') : '<div class="student-updates-empty">No updates yet.</div>'}</div>`;

    host.querySelector('#markUpdatesSeenBtn')?.addEventListener('click', () => {
      updates.forEach(markSeen);
      render(updates);
      renderFloating(updates);
    });
  }

  function chooseFloatingUpdate(updates) {
    const seen = seenIds();
    const unread = updates.filter(update => !seen.has(String(update.id)));
    if (!unread.length) return null;
    return [...unread].sort((a,b) => {
      const priorityA = (a.pinned ? 2 : 0) + (a.update_type === 'important' ? 1 : 0);
      const priorityB = (b.pinned ? 2 : 0) + (b.update_type === 'important' ? 1 : 0);
      if (priorityA !== priorityB) return priorityB - priorityA;
      return new Date(b.published_at || 0) - new Date(a.published_at || 0);
    })[0];
  }

  function removeFloating() { document.getElementById('studentUpdateFloat')?.remove(); }

  function openNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    const bell = document.getElementById('notificationBell');

    // Use the real notification control first so we preserve the app's
    // existing open/close behavior, instead of relying on guessed selectors.
    if (bell) {
      bell.click();
    }

    // Fallback: if the app's click handler is unavailable or the panel is
    // still hidden, explicitly open the existing notification panel.
    requestAnimationFrame(() => {
      if (panel?.classList.contains('hidden')) {
        panel.classList.remove('hidden');
      }
    });
  }

  function renderFloating(updates) {
    ensureStyles();
    const update = chooseFloatingUpdate(updates);
    if (!update) { removeFloating(); return; }
    if (dismissedFloatId() === String(update.id)) return;

    let box = document.getElementById('studentUpdateFloat');
    if (!box) { box = document.createElement('aside'); box.id = 'studentUpdateFloat'; document.body.appendChild(box); }

    box.innerHTML = `
      <button class="suf-close" type="button" aria-label="Close update">×</button>
      <div class="suf-top">
        <div class="suf-icon">${escapeHTML(update.icon || '📢')}</div>
        <div class="suf-main"><div class="suf-label">${update.pinned ? '📌 Pinned update' : '📢 New update'}</div><div class="suf-title">${escapeHTML(update.title)}</div></div>
      </div>
      <div class="suf-content">${escapeHTML(update.content)}</div>
      <div class="suf-actions"><button class="suf-view" type="button">View update</button><button class="suf-dismiss" type="button">Dismiss</button></div>`;

    box.querySelector('.suf-close')?.addEventListener('click', () => { setDismissedFloatId(update.id); box.remove(); });
    box.querySelector('.suf-dismiss')?.addEventListener('click', () => {
      markSeen(update); setDismissedFloatId(update.id); box.remove(); render(updates);
    });
    box.querySelector('.suf-view')?.addEventListener('click', () => {
      markSeen(update);
      setDismissedFloatId(update.id);
      box.remove();
      render(updates);

      openNotificationPanel();

      setTimeout(() => {
        document.getElementById('studentUpdatesSection')?.scrollIntoView({behavior:'smooth',block:'center'});
      }, 150);
    });
  }

  async function load() {
    if (!client) return;
    try {
      const { data, error } = await client.rpc('student_updates_list_public');
      if (error) throw error;
      currentUpdates = Array.isArray(data) ? data : [];
      render(currentUpdates);
      renderFloating(currentUpdates);
    } catch (error) {
      console.warn('[Student Updates] Load failed:', error);
      const host = ensureHost();
      if (host) host.innerHTML = '<div class="student-updates-head"><div><div class="student-updates-title">📢 Updates</div><div class="small-note">Unable to load updates right now.</div></div></div>';
    }
  }

  function init() {
    if (!window.supabase) return;
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true} });
    ensureStyles();
    load();
    client.auth.onAuthStateChange(event => { if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') setTimeout(load,0); });
    clearInterval(timer);
    timer = setInterval(load,REFRESH_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
