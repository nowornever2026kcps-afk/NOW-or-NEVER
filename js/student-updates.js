/* =========================================================
   NOW-or-NEVER — STUDENT UPDATES
   Reads only published/enabled updates through the secure RPC.
   ========================================================= */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://kvbbgvfrllptqpbkixnv.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-';
  const SEEN_KEY = 'nowOrNeverSeenUpdates';
  const REFRESH_MS = 60000;

  let client = null;
  let timer = null;

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
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-100)));
  }

  function ensureStyles() {
    if (document.getElementById('student-updates-style')) return;

    const style = document.createElement('style');
    style.id = 'student-updates-style';
    style.textContent = `
      .student-updates-section {
        margin: 0 0 14px;
        padding: 14px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 15px;
        background: rgba(124,92,255,.055);
      }
      .student-updates-head {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:10px;
      }
      .student-updates-title {
        font-weight:800;
        font-size:14px;
      }
      .student-updates-count {
        display:inline-flex;
        min-width:20px;
        height:20px;
        padding:0 6px;
        align-items:center;
        justify-content:center;
        border-radius:999px;
        background:#7c5cff;
        color:#fff;
        font-size:11px;
        font-weight:800;
      }
      .student-update-item {
        padding:12px;
        border-radius:12px;
        background:rgba(255,255,255,.045);
        border:1px solid rgba(255,255,255,.07);
        margin-top:8px;
      }
      .student-update-item:first-child { margin-top:0; }
      .student-update-item.is-new { border-color:rgba(124,92,255,.42); }
      .student-update-meta {
        display:flex;
        align-items:center;
        flex-wrap:wrap;
        gap:6px;
        font-size:10px;
        opacity:.72;
        margin-bottom:5px;
      }
      .student-update-type {
        font-weight:800;
        text-transform:uppercase;
        letter-spacing:.04em;
      }
      .student-update-title-row {
        display:flex;
        gap:8px;
        align-items:flex-start;
      }
      .student-update-icon { font-size:20px; line-height:1.2; }
      .student-update-title { font-weight:800; font-size:14px; }
      .student-update-content {
        margin:7px 0 0;
        font-size:12px;
        line-height:1.55;
        white-space:normal;
      }
      .student-update-new {
        margin-left:auto;
        padding:2px 6px;
        border-radius:999px;
        background:rgba(124,92,255,.18);
        font-size:9px;
        font-weight:800;
      }
      .student-updates-empty {
        font-size:12px;
        opacity:.65;
        padding:4px 0;
      }
      .student-updates-mark {
        border:0;
        background:transparent;
        color:inherit;
        opacity:.65;
        font-size:10px;
        cursor:pointer;
        padding:2px 0;
      }
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
        <div>
          <div class="student-updates-title">📢 Updates</div>
          <div class="small-note">Announcements and new features</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${unread.length ? `<span class="student-updates-count">${unread.length}</span>` : ''}
          ${unread.length ? '<button type="button" class="student-updates-mark" id="markUpdatesSeenBtn">Mark read</button>' : ''}
        </div>
      </div>
      <div>
        ${updates.length ? updates.map(update => `
          <article class="student-update-item ${seen.has(String(update.id)) ? '' : 'is-new'}">
            <div class="student-update-meta">
              <span class="student-update-type">${escapeHTML(update.update_type || 'announcement')}</span>
              ${update.pinned ? '<span>📌 Pinned</span>' : ''}
              ${!seen.has(String(update.id)) ? '<span class="student-update-new">NEW</span>' : ''}
            </div>
            <div class="student-update-title-row">
              <span class="student-update-icon">${escapeHTML(update.icon || '📢')}</span>
              <div class="student-update-title">${escapeHTML(update.title)}</div>
            </div>
            <div class="student-update-content">${escapeHTML(update.content).replaceAll('\n', '<br>')}</div>
            <div class="student-update-meta" style="margin:7px 0 0">
              ${update.published_at ? new Date(update.published_at).toLocaleString('en-IN') : ''}
            </div>
          </article>
        `).join('') : '<div class="student-updates-empty">No updates yet.</div>'}
      </div>
    `;

    host.querySelector('#markUpdatesSeenBtn')?.addEventListener('click', () => {
      const next = seenIds();
      updates.forEach(update => next.add(String(update.id)));
      saveSeen(next);
      render(updates);
    });
  }

  async function load() {
    if (!client || !document.getElementById('notificationPanel')) return;

    try {
      const { data, error } = await client.rpc('student_updates_list_public');
      if (error) throw error;
      render(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('[Student Updates] Load failed:', error);
      const host = ensureHost();
      if (host) {
        host.innerHTML = `
          <div class="student-updates-head">
            <div>
              <div class="student-updates-title">📢 Updates</div>
              <div class="small-note">Unable to load updates right now.</div>
            </div>
          </div>`;
      }
    }
  }

  function init() {
    if (!window.supabase) return;

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    ensureStyles();
    load();

    client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
        setTimeout(load, 0);
      }
    });

    clearInterval(timer);
    timer = setInterval(load, REFRESH_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
