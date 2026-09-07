/* =========================================================
   NOW-or-NEVER
   ADMIN SHOP MENUS
   ========================================================= */

export function initShopMenus({
  supabaseClient,
  $,
  sectionContent,
  adminToast,
  escapeHTML,
  loadOverview
}) {
  let menus = [];

  async function loadMenus() {
    const { data, error } = await supabaseClient.rpc("admin_shop_menus_list");
    if (error) throw error;
    menus = Array.isArray(data) ? data : [];
    $("shopMenuCount") && ($("shopMenuCount").textContent = menus.filter(m => m.enabled).length);
    return menus;
  }

  function menuRow(menu, index) {
    return `
      <div class="admin-menu-row" data-id="${menu.id}">
        <div class="admin-menu-order">
          <button type="button" class="ghost-btn menu-up" data-id="${menu.id}" ${index === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="ghost-btn menu-down" data-id="${menu.id}" ${index === menus.length - 1 ? "disabled" : ""}>↓</button>
        </div>

        <div class="admin-menu-preview">
          <span class="admin-menu-icon">${escapeHTML(menu.icon || "📂")}</span>
          <div>
            <strong>${escapeHTML(menu.menu_name)}</strong>
            <small>${escapeHTML(menu.menu_key)}</small>
          </div>
        </div>

        <div class="admin-menu-controls">
          <label>
            <span>Menu name</span>
            <input class="menu-name" value="${escapeHTML(menu.menu_name)}" maxlength="60">
          </label>
          <label>
            <span>Icon</span>
            <input class="menu-icon" value="${escapeHTML(menu.icon || "📂")}" maxlength="8">
          </label>
          <label>
            <span>Key</span>
            <input class="menu-key" value="${escapeHTML(menu.menu_key)}" maxlength="40" pattern="[-a-z0-9_]+">
          </label>
        </div>

        <div class="admin-menu-actions">
          <label class="menu-enabled">
            <input type="checkbox" class="menu-enabled-input" ${menu.enabled ? "checked" : ""}>
            <span>${menu.enabled ? "Enabled" : "Disabled"}</span>
          </label>
          <button type="button" class="primary-btn menu-save" data-id="${menu.id}">Save</button>
          <button type="button" class="ghost-btn menu-delete" data-id="${menu.id}">Delete</button>
        </div>
      </div>
    `;
  }

  function renderMenus() {
    sectionContent.innerHTML = `
      <div class="section-heading">
        <div>
          <p class="eyebrow">SHOP STRUCTURE</p>
          <h3>📂 Shop Menus</h3>
          <p class="muted">Control the menu tabs shown to students. Rename them, change icons, reorder them, disable them, or create a new menu.</p>
        </div>
      </div>

      <div class="marketplace-actions">
        <button type="button" class="primary-btn" id="newShopMenuBtn">＋ New Menu</button>
        <button type="button" class="ghost-btn" id="refreshShopMenusBtn">↻ Refresh</button>
      </div>

      <div id="newShopMenuForm" class="admin-form hidden">
        <h4>Create shop menu</h4>
        <div>
          <label for="newMenuKey">Menu key</label>
          <input id="newMenuKey" placeholder="example: badges" maxlength="40" pattern="[-a-z0-9_]+">
        </div>
        <div>
          <label for="newMenuName">Menu name</label>
          <input id="newMenuName" placeholder="Badges" maxlength="60">
        </div>
        <div>
          <label for="newMenuIcon">Icon</label>
          <input id="newMenuIcon" value="🏅" maxlength="8">
        </div>
        <div>
          <label for="newMenuOrder">Order</label>
          <input id="newMenuOrder" type="number" value="100" min="0" step="10">
        </div>
        <div class="admin-form-actions">
          <button type="button" class="primary-btn" id="createShopMenuBtn">Create Menu</button>
          <button type="button" class="ghost-btn" id="cancelNewShopMenuBtn">Cancel</button>
        </div>
      </div>

      <div id="shopMenusList" class="admin-menu-list">
        <div class="muted">Loading menus…</div>
      </div>
    `;

    $("newShopMenuBtn")?.addEventListener("click", () => {
      $("newShopMenuForm")?.classList.toggle("hidden");
    });

    $("cancelNewShopMenuBtn")?.addEventListener("click", () => {
      $("newShopMenuForm")?.classList.add("hidden");
    });

    $("refreshShopMenusBtn")?.addEventListener("click", async () => {
      try {
        await loadMenus();
        renderMenuRows();
        adminToast("Shop menus refreshed.", true);
      } catch (error) {
        console.error("Refresh shop menus failed:", error);
        adminToast("Could not load shop menus.");
      }
    });

    $("createShopMenuBtn")?.addEventListener("click", createMenu);
    renderMenuRows();
  }

  function renderMenuRows() {
    const list = $("shopMenusList");
    if (!list) return;

    if (!menus.length) {
      list.innerHTML = `<div class="muted">No shop menus exist yet.</div>`;
      return;
    }

    list.innerHTML = menus.map(menuRow).join("");

    list.querySelectorAll(".menu-save").forEach(btn => {
      btn.addEventListener("click", () => saveMenu(Number(btn.dataset.id)));
    });

    list.querySelectorAll(".menu-delete").forEach(btn => {
      btn.addEventListener("click", () => deleteMenu(Number(btn.dataset.id)));
    });

    list.querySelectorAll(".menu-up").forEach(btn => {
      btn.addEventListener("click", () => moveMenu(Number(btn.dataset.id), -1));
    });

    list.querySelectorAll(".menu-down").forEach(btn => {
      btn.addEventListener("click", () => moveMenu(Number(btn.dataset.id), 1));
    });
  }

  async function createMenu() {
    const menuKey = $("newMenuKey")?.value.trim().toLowerCase();
    const menuName = $("newMenuName")?.value.trim();
    const icon = $("newMenuIcon")?.value.trim() || "📂";
    const sortOrder = Number($("newMenuOrder")?.value || 100);

    if (!/^[a-z0-9_-]+$/.test(menuKey)) {
      adminToast("Menu key can use only lowercase letters, numbers, _ and -.");
      return;
    }
    if (!menuName) {
      adminToast("Enter a menu name.");
      return;
    }

    const { error } = await supabaseClient.rpc("admin_shop_menu_create", {
      p_menu_key: menuKey,
      p_menu_name: menuName,
      p_icon: icon,
      p_sort_order: Number.isFinite(sortOrder) ? sortOrder : 100
    });

    if (error) {
      console.error("Create shop menu failed:", error);
      adminToast(error.message || "Could not create menu.");
      return;
    }

    adminToast("Shop menu created.", true);
    await loadMenus();
    renderMenus();
    await loadOverview?.();
  }

  function getRow(id) {
    return document.querySelector(`.admin-menu-row[data-id="${id}"]`);
  }

  async function saveMenu(id) {
    const row = getRow(id);
    if (!row) return;

    const menuKey = row.querySelector(".menu-key")?.value.trim().toLowerCase();
    const menuName = row.querySelector(".menu-name")?.value.trim();
    const icon = row.querySelector(".menu-icon")?.value.trim() || "📂";
    const enabled = !!row.querySelector(".menu-enabled-input")?.checked;
    const index = menus.findIndex(m => Number(m.id) === id);
    const sortOrder = index >= 0 ? Number(menus[index].sort_order || (index + 1) * 10) : 100;

    if (!/^[a-z0-9_-]+$/.test(menuKey)) {
      adminToast("Invalid menu key.");
      return;
    }
    if (!menuName) {
      adminToast("Menu name cannot be empty.");
      return;
    }

    const { error } = await supabaseClient.rpc("admin_shop_menu_update", {
      p_id: id,
      p_menu_key: menuKey,
      p_menu_name: menuName,
      p_icon: icon,
      p_sort_order: sortOrder,
      p_enabled: enabled
    });

    if (error) {
      console.error("Update shop menu failed:", error);
      adminToast(error.message || "Could not update menu.");
      return;
    }

    adminToast("Shop menu updated.", true);
    await loadMenus();
    renderMenuRows();
    await loadOverview?.();
  }

  async function deleteMenu(id) {
    const menu = menus.find(m => Number(m.id) === id);
    if (!menu) return;

    if (!confirm(`Delete the “${menu.menu_name}” menu?`)) return;

    const { error } = await supabaseClient.rpc("admin_shop_menu_delete", { p_id: id });
    if (error) {
      console.error("Delete shop menu failed:", error);
      adminToast(error.message || "Could not delete menu.");
      return;
    }

    adminToast("Shop menu deleted.", true);
    await loadMenus();
    renderMenuRows();
    await loadOverview?.();
  }

  async function moveMenu(id, direction) {
    const index = menus.findIndex(m => Number(m.id) === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= menus.length) return;

    [menus[index], menus[target]] = [menus[target], menus[index]];
    const ids = menus.map(m => Number(m.id));

    const { error } = await supabaseClient.rpc("admin_shop_menus_reorder", { p_ids: ids });
    if (error) {
      console.error("Reorder shop menus failed:", error);
      adminToast(error.message || "Could not reorder menus.");
      await loadMenus();
      renderMenuRows();
      return;
    }

    menus.forEach((menu, i) => { menu.sort_order = (i + 1) * 10; });
    renderMenuRows();
    adminToast("Menu order updated.", true);
  }

  async function renderShopMenus() {
    try {
      await loadMenus();
      renderMenus();
    } catch (error) {
      console.error("Shop menus failed:", error);
      sectionContent.innerHTML = `
        <div class="section-heading">
          <p class="eyebrow">SHOP STRUCTURE</p>
          <h3>📂 Shop Menus</h3>
          <p class="muted">The menu system is not connected yet. Run <strong>sql/admin-shop-menus.sql</strong> in Supabase, then refresh.</p>
        </div>
      `;
    }
  }

  return { renderShopMenus, loadMenus };
}
