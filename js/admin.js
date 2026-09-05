/* =========================================================
   NOW-or-NEVER
   ADMIN COMMAND CENTER
   ---------------------------------------------------------
   Secure admin dashboard + Marketplace Management.
   Database writes are performed through admin-only RPCs.
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL = "https://kvbbgvfrllptqpbkixnv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const $ = (id) => document.getElementById(id);
  const loading = $("accessLoading");
  const denied = $("accessDenied");
  const dashboard = $("dashboard");
  const status = $("adminStatus");
  const logoutBtn = $("logoutBtn");
  const deniedLogoutBtn = $("deniedLogoutBtn");
  const sectionPanel = $("sectionPanel");
  const sectionContent = $("sectionContent");
  const closeSectionBtn = $("closeSectionBtn");

  function setStatus(text, type = "default") {
    if (!status) return;
    status.textContent = text;
    status.dataset.status = type;
  }

  function showOnly(element) {
    [loading, denied, dashboard].forEach((node) => node?.classList.add("hidden"));
    element?.classList.remove("hidden");
  }

  function showAccessDenied(message) {
    const paragraph = denied?.querySelector("p");
    if (paragraph && message) paragraph.textContent = message;
    setStatus("Access denied", "denied");
    showOnly(denied);
  }

  function showDashboard(user) {
    showOnly(dashboard);
    setStatus("Administrator", "admin");
    const name = user?.user_metadata?.display_name || user?.user_metadata?.full_name ||
      user?.user_metadata?.name || user?.email?.split("@")[0] || "Administrator";
    if ($("adminName")) $("adminName").textContent = name;
    if ($("adminEmail")) $("adminEmail").textContent = user?.email || "—";
    loadOverview();
  }

  async function hasAdminAccess() {
    const { data, error } = await supabaseClient.rpc("is_admin");
    if (error) throw error;
    return data === true;
  }

  async function verifyAdminAccess() {
    try {
      setStatus("Checking access…", "checking");
      showOnly(loading);
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      if (!session?.user) {
        showAccessDenied("You must be logged in with an administrator account.");
        return;
      }
      if (!(await hasAdminAccess())) {
        showAccessDenied("Your account does not have administrator permission.");
        return;
      }
      showDashboard(session.user);
    } catch (error) {
      console.error("Admin verification failed:", error);
      showAccessDenied("A security check failed. Please try again.");
    }
  }

  async function logout() {
    try {
      setStatus("Signing out…", "checking");
      await supabaseClient.auth.signOut();
    } finally {
      window.location.href = "index.html";
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(value) {
    return Number(value || 0).toLocaleString("en-IN");
  }

  function adminToast(message, good = false) {
    let el = $("adminActionToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "adminActionToast";
      el.style.cssText = "position:fixed;right:22px;bottom:22px;z-index:99999;padding:12px 16px;border-radius:12px;background:#17171d;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.3);font-weight:600;max-width:360px;";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.dataset.good = good ? "true" : "false";
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.remove(), 3500);
  }

  async function loadOverview() {
    try {
      const { data, error } = await supabaseClient.rpc("admin_marketplace_list");
      if (error) throw error;
      if ($("shopItemCount")) $("shopItemCount").textContent = (data || []).length;
    } catch (error) {
      console.warn("Marketplace overview unavailable:", error);
      if ($("shopItemCount")) $("shopItemCount").textContent = "—";
    }
  }

  function marketplaceForm(item = null) {
    const editing = !!item;
    const title = editing ? "Edit Marketplace Item" : "Add Marketplace Item";
    sectionContent.innerHTML = `
      <div class="section-heading">
        <p class="eyebrow">MARKETPLACE</p>
        <h3>${title}</h3>
        <p class="muted">Changes are protected by the Supabase admin RPC.</p>
      </div>
      <form id="marketplaceForm" class="admin-form">
        <input type="hidden" id="mpOriginalId" value="${escapeHTML(item?.item_id || "")}">
        <div class="admin-form-grid">
          <label>Item ID<input id="mpItemId" required maxlength="80" value="${escapeHTML(item?.item_id || "")}" ${editing ? "readonly" : ""}></label>
          <label>Name<input id="mpItemName" required maxlength="120" value="${escapeHTML(item?.item_name || "")}"></label>
          <label>Category<select id="mpCategory" required>
            ${["cosmetics","outfit","badge","headwear","title","crown","emoji","textstyle"].map(x => `<option value="${x}" ${item?.category === x ? "selected" : ""}>${x}</option>`).join("")}
          </select></label>
          <label>Kind<select id="mpKind" required>
            ${["accessory","title","effect","dragon","textstyle"].map(x => `<option value="${x}" ${item?.kind === x ? "selected" : ""}>${x}</option>`).join("")}
          </select></label>
          <label>Price<input id="mpPrice" type="number" min="0" max="100000000" step="1" required value="${Number(item?.price || 0)}"></label>
          <label>Preview<input id="mpPreview" maxlength="20" value="${escapeHTML(item?.preview || "🎁")}" placeholder="🎁"></label>
          <label class="full">Description<textarea id="mpDescription" maxlength="500" rows="3" required>${escapeHTML(item?.description || "")}</textarea></label>
        </div>
        <div class="admin-form-actions">
          <button class="primary-btn" type="submit">${editing ? "Save Changes" : "Create Item"}</button>
          <button class="ghost-btn" type="button" id="cancelMarketplaceForm">Cancel</button>
        </div>
      </form>
    `;
    $("cancelMarketplaceForm")?.addEventListener("click", renderMarketplace);
    $("marketplaceForm")?.addEventListener("submit", (event) => saveMarketplaceItem(event, editing));
  }

  async function saveMarketplaceItem(event, editing) {
    event.preventDefault();
    const payload = {
      p_item_id: $("mpItemId").value.trim(),
      p_item_name: $("mpItemName").value.trim(),
      p_category: $("mpCategory").value,
      p_description: $("mpDescription").value.trim(),
      p_price: Number($("mpPrice").value),
      p_kind: $("mpKind").value,
      p_preview: $("mpPreview").value.trim() || "🎁"
    };
    if (!payload.p_item_id || !payload.p_item_name || !Number.isFinite(payload.p_price) || payload.p_price < 0) {
      adminToast("Please enter valid item details.");
      return;
    }
    try {
      const fn = editing ? "admin_marketplace_update" : "admin_marketplace_create";
      if (editing) payload.p_original_item_id = $("mpOriginalId").value;
      const { error } = await supabaseClient.rpc(fn, payload);
      if (error) throw error;
      adminToast(editing ? "Marketplace item updated." : "Marketplace item created.", true);
      await renderMarketplace();
      await loadOverview();
    } catch (error) {
      console.error("Marketplace save failed:", error);
      adminToast(error.message || "Marketplace save failed.");
    }
  }

  async function deleteMarketplaceItem(itemId) {
    if (!confirm(`Delete marketplace item “${itemId}”? This cannot be undone.`)) return;
    try {
      const { error } = await supabaseClient.rpc("admin_marketplace_delete", { p_item_id: itemId });
      if (error) throw error;
      adminToast("Marketplace item deleted.", true);
      await renderMarketplace();
      await loadOverview();
    } catch (error) {
      console.error("Marketplace delete failed:", error);
      adminToast(error.message || "Marketplace delete failed.");
    }
  }

  async function renderMarketplace() {
    if (!sectionContent) return;
    sectionContent.innerHTML = `
      <div class="section-heading">
        <p class="eyebrow">MARKETPLACE CONTROL</p>
        <h3>🛒 Shop Management</h3>
        <p class="muted">Create, edit and remove items from the marketplace catalogue.</p>
      </div>
      <div class="admin-toolbar">
        <button class="primary-btn" id="addMarketplaceBtn" type="button">＋ Add Item</button>
        <button class="ghost-btn" id="refreshMarketplaceBtn" type="button">↻ Refresh</button>
        <input id="marketplaceSearch" type="search" placeholder="Search items…" aria-label="Search marketplace items">
      </div>
      <div id="marketplaceList" class="admin-table-wrap"><div class="muted">Loading marketplace…</div></div>
    `;
    $("addMarketplaceBtn")?.addEventListener("click", () => marketplaceForm());
    $("refreshMarketplaceBtn")?.addEventListener("click", renderMarketplace);
    $("marketplaceSearch")?.addEventListener("input", (event) => filterMarketplace(event.target.value));
    try {
      const { data, error } = await supabaseClient.rpc("admin_marketplace_list");
      if (error) throw error;
      renderMarketplaceRows(data || []);
    } catch (error) {
      console.error("Marketplace load failed:", error);
      $("marketplaceList").innerHTML = `<div class="muted">Unable to load marketplace: ${escapeHTML(error.message)}</div>`;
    }
  }

  let marketplaceItems = [];

  function renderMarketplaceRows(items) {
    marketplaceItems = items;
    const list = $("marketplaceList");
    if (!list) return;
    if (!items.length) {
      list.innerHTML = `<div class="muted" style="padding:20px">No marketplace items found.</div>`;
      return;
    }
    list.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Item</th><th>Category</th><th>Kind</th><th>Price</th><th>Actions</th></tr></thead>
        <tbody>${items.map(item => `
          <tr data-market-item="${escapeHTML(item.item_id)}">
            <td><strong>${escapeHTML(item.preview || "🎁")} ${escapeHTML(item.item_name)}</strong><small>${escapeHTML(item.item_id)}</small></td>
            <td>${escapeHTML(item.category)}</td>
            <td>${escapeHTML(item.kind)}</td>
            <td>⚡ ${money(item.price)}</td>
            <td class="admin-row-actions">
              <button type="button" class="ghost-btn mp-edit" data-id="${escapeHTML(item.item_id)}">Edit</button>
              <button type="button" class="ghost-btn mp-delete" data-id="${escapeHTML(item.item_id)}">Delete</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`;
    list.querySelectorAll(".mp-edit").forEach(btn => btn.addEventListener("click", () => {
      const item = marketplaceItems.find(x => x.item_id === btn.dataset.id);
      if (item) marketplaceForm(item);
    }));
    list.querySelectorAll(".mp-delete").forEach(btn => btn.addEventListener("click", () => deleteMarketplaceItem(btn.dataset.id)));
  }

  function filterMarketplace(query) {
    const q = String(query || "").trim().toLowerCase();
    renderMarketplaceRows(!q ? marketplaceItems : marketplaceItems.filter(item =>
      [item.item_id, item.item_name, item.category, item.kind, item.description].some(v => String(v || "").toLowerCase().includes(q))
    ));
  }

  function openSection(section) {
    if (!sectionPanel || !sectionContent) return;
    if (section === "shop") {
      sectionPanel.classList.remove("hidden");
      renderMarketplace();
    } else {
      const sections = {
        menus: ["📂 Shop Menus", "Menu management will be connected after marketplace catalogue management."],
        updates: ["📢 Updates", "Announcement management will be connected next."],
        settings: ["⚙️ Settings", "Administrator settings will be connected after the core modules." ]
      };
      const selected = sections[section];
      if (!selected) return;
      sectionContent.innerHTML = `<div class="section-heading"><p class="eyebrow">ADMIN MODULE</p><h3>${selected[0]}</h3><p class="muted">${selected[1]}</p></div>`;
      sectionPanel.classList.remove("hidden");
    }
    sectionPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closeSection() {
    sectionPanel?.classList.add("hidden");
  }

  logoutBtn?.addEventListener("click", logout);
  deniedLogoutBtn?.addEventListener("click", logout);
  closeSectionBtn?.addEventListener("click", closeSection);
  document.querySelectorAll("[data-section]").forEach(button => button.addEventListener("click", () => openSection(button.dataset.section)));

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      window.location.href = "index.html";
    } else if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
      verifyAdminAccess();
    }
  });

  verifyAdminAccess();
})();
