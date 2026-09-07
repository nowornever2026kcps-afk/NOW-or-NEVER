/* =========================================================
   NOW-or-NEVER
   ADMIN COMMAND CENTER — CORE CONTROLLER
   ---------------------------------------------------------
   Authentication, admin access, navigation and shared helpers.
   Feature-specific controls live in /admin/js/ modules.
   ========================================================= */

import { initMarketplace } from "../admin/js/admin-marketplace.js";
import { initShopMenus } from "../admin/js/admin-menus.js";

(() => {
  "use strict";

  const SUPABASE_URL = "https://kvbbgvfrllptqpbkixnv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
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

    const name = user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "Administrator";

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
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
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
      el.style.cssText = [
        "position:fixed",
        "right:22px",
        "bottom:22px",
        "z-index:99999",
        "padding:12px 16px",
        "border-radius:12px",
        "background:#17171d",
        "color:#fff",
        "box-shadow:0 10px 30px rgba(0,0,0,.3)",
        "font-weight:600",
        "max-width:360px"
      ].join(";");
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

    try {
      const { data, error } = await supabaseClient.rpc("admin_shop_menus_list");
      if (error) throw error;
      if ($("shopMenuCount")) $("shopMenuCount").textContent = (data || []).filter(menu => menu.enabled).length;
    } catch (error) {
      console.warn("Shop menus overview unavailable:", error);
      if ($("shopMenuCount")) $("shopMenuCount").textContent = "—";
    }
  }

  const marketplace = initMarketplace({
    supabaseClient,
    $,
    sectionContent,
    adminToast,
    escapeHTML,
    money,
    loadOverview
  });

  const shopMenus = initShopMenus({
    supabaseClient,
    $,
    sectionContent,
    adminToast,
    escapeHTML,
    loadOverview
  });

  function openSection(section) {
    if (!sectionPanel || !sectionContent) return;

    if (section === "shop") {
      sectionPanel.classList.remove("hidden");
      marketplace.renderMarketplace();
    } else if (section === "menus") {
      sectionPanel.classList.remove("hidden");
      shopMenus.renderShopMenus();
    } else {
      const sections = {
        updates: [
          "📢 Updates",
          "Announcement management will be connected next."
        ],
        settings: [
          "⚙️ Settings",
          "Administrator settings will be connected after the core modules."
        ]
      };

      const selected = sections[section];
      if (!selected) return;

      sectionContent.innerHTML = `
        <div class="section-heading">
          <p class="eyebrow">ADMIN MODULE</p>
          <h3>${selected[0]}</h3>
          <p class="muted">${selected[1]}</p>
        </div>
      `;

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

  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => openSection(button.dataset.section));
  });

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      window.location.href = "index.html";
      return;
    }

    if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
      verifyAdminAccess();
    }
  });

  verifyAdminAccess();
})();
