/* =========================================================
   NOW-or-NEVER — ADMIN MARKETPLACE MODULE
   ---------------------------------------------------------
   Marketplace catalogue controls for the Admin Command Center.
   Database authorization is enforced by Supabase admin RPCs.
   ========================================================= */

export function initMarketplace({ supabaseClient, $, sectionContent, adminToast, escapeHTML, money, loadOverview }) {
  let marketplaceItems = [];

  function marketplaceForm(item = null) {
    const editing = Boolean(item);

    sectionContent.innerHTML = `
      <div class="section-heading">
        <p class="eyebrow">MARKETPLACE</p>
        <h3>${editing ? "Edit Marketplace Item" : "Add Marketplace Item"}</h3>
        <p class="muted">Manage the shop catalogue from the administrator panel.</p>
      </div>

      <form id="marketplaceForm" class="admin-form">
        <input type="hidden" id="mpOriginalId" value="${escapeHTML(item?.item_id || "")}">

        <div class="admin-form-grid">
          <label>
            Item ID
            <input id="mpItemId" required maxlength="80" value="${escapeHTML(item?.item_id || "")}" ${editing ? "readonly" : ""}>
          </label>

          <label>
            Name
            <input id="mpItemName" required maxlength="120" value="${escapeHTML(item?.item_name || "")}">
          </label>

          <label>
            Category
            <select id="mpCategory" required>
              ${[
                "cosmetics",
                "outfit",
                "badge",
                "headwear",
                "title",
                "crown",
                "emoji",
                "textstyle"
              ].map((value) => `<option value="${value}" ${item?.category === value ? "selected" : ""}>${value}</option>`).join("")}
            </select>
          </label>

          <label>
            Kind
            <select id="mpKind" required>
              ${[
                "accessory",
                "title",
                "effect",
                "dragon",
                "textstyle"
              ].map((value) => `<option value="${value}" ${item?.kind === value ? "selected" : ""}>${value}</option>`).join("")}
            </select>
          </label>

          <label>
            Price
            <input id="mpPrice" type="number" min="0" max="100000000" step="1" required value="${Number(item?.price || 0)}">
          </label>

          <label>
            Preview
            <input id="mpPreview" maxlength="20" value="${escapeHTML(item?.preview || "🎁")}" placeholder="🎁">
          </label>

          <label class="full">
            Description
            <textarea id="mpDescription" maxlength="500" rows="3" required>${escapeHTML(item?.description || "")}</textarea>
          </label>
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

    if (!payload.p_item_id ||
        !payload.p_item_name ||
        !payload.p_description ||
        !Number.isFinite(payload.p_price) ||
        payload.p_price < 0) {
      adminToast("Please enter valid item details.");
      return;
    }

    try {
      const fn = editing ? "admin_marketplace_update" : "admin_marketplace_create";

      if (editing) {
        payload.p_original_item_id = $("mpOriginalId").value;
      }

      const { error } = await supabaseClient.rpc(fn, payload);
      if (error) throw error;

      adminToast(
        editing ? "Marketplace item updated." : "Marketplace item created.",
        true
      );

      await renderMarketplace();
      await loadOverview();
    } catch (error) {
      console.error("Marketplace save failed:", error);
      adminToast(error?.message || "Marketplace save failed.");
    }
  }

  async function deleteMarketplaceItem(itemId) {
    if (!itemId) return;

    if (!confirm(`Delete marketplace item “${itemId}”? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabaseClient.rpc(
        "admin_marketplace_delete",
        { p_item_id: itemId }
      );

      if (error) throw error;

      adminToast("Marketplace item deleted.", true);
      await renderMarketplace();
      await loadOverview();
    } catch (error) {
      console.error("Marketplace delete failed:", error);
      adminToast(error?.message || "Marketplace delete failed.");
    }
  }

  async function renderMarketplace() {
    if (!sectionContent) return;

    sectionContent.innerHTML = `
      <div class="section-heading">
        <p class="eyebrow">MARKETPLACE CONTROL</p>
        <h3>🛒 Shop Management</h3>
        <p class="muted">Create, edit, search and remove marketplace items.</p>
      </div>

      <div class="admin-toolbar">
        <button class="primary-btn" id="addMarketplaceBtn" type="button">＋ Add Item</button>
        <button class="ghost-btn" id="refreshMarketplaceBtn" type="button">↻ Refresh</button>
        <input id="marketplaceSearch" type="search" placeholder="Search items…" aria-label="Search marketplace items">
      </div>

      <div id="marketplaceList" class="admin-table-wrap">
        <div class="muted">Loading marketplace…</div>
      </div>
    `;

    $("addMarketplaceBtn")?.addEventListener("click", () => marketplaceForm());
    $("refreshMarketplaceBtn")?.addEventListener("click", renderMarketplace);
    $("marketplaceSearch")?.addEventListener("input", (event) => {
      filterMarketplace(event.target.value);
    });

    try {
      const { data, error } = await supabaseClient.rpc("admin_marketplace_list");
      if (error) throw error;
      renderMarketplaceRows(data || []);
    } catch (error) {
      console.error("Marketplace load failed:", error);
      $("marketplaceList").innerHTML = `
        <div class="muted" style="padding:20px">
          Unable to load marketplace: ${escapeHTML(error?.message || "Unknown error")}
        </div>
      `;
    }
  }

  function renderMarketplaceRows(items) {
    marketplaceItems = Array.isArray(items) ? items : [];
    const list = $("marketplaceList");

    if (!list) return;

    if (!marketplaceItems.length) {
      list.innerHTML = `<div class="muted" style="padding:20px">No marketplace items found.</div>`;
      return;
    }

    list.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Kind</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${marketplaceItems.map((item) => `
            <tr data-market-item="${escapeHTML(item.item_id)}">
              <td>
                <strong>${escapeHTML(item.preview || "🎁")} ${escapeHTML(item.item_name)}</strong>
                <small>${escapeHTML(item.item_id)}</small>
              </td>
              <td>${escapeHTML(item.category)}</td>
              <td>${escapeHTML(item.kind)}</td>
              <td>⚡ ${money(item.price)}</td>
              <td class="admin-row-actions">
                <button type="button" class="ghost-btn mp-edit" data-id="${escapeHTML(item.item_id)}">Edit</button>
                <button type="button" class="ghost-btn mp-delete" data-id="${escapeHTML(item.item_id)}">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    list.querySelectorAll(".mp-edit").forEach((button) => {
      button.addEventListener("click", () => {
        const item = marketplaceItems.find((entry) => entry.item_id === button.dataset.id);
        if (item) marketplaceForm(item);
      });
    });

    list.querySelectorAll(".mp-delete").forEach((button) => {
      button.addEventListener("click", () => {
        deleteMarketplaceItem(button.dataset.id);
      });
    });
  }

  function filterMarketplace(query) {
    const q = String(query || "").trim().toLowerCase();

    renderMarketplaceRows(
      !q
        ? marketplaceItems
        : marketplaceItems.filter((item) => [
            item.item_id,
            item.item_name,
            item.category,
            item.kind,
            item.description
          ].some((value) => String(value || "").toLowerCase().includes(q)))
    );
  }

  return {
    renderMarketplace
  };
}
