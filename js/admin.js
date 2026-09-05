/* =========================================================
   NOW-or-NEVER
   ADMIN COMMAND CENTER
   ---------------------------------------------------------
   Step 2: secure admin authorization through Supabase.
   Shop/database management will be added in later steps.
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://kvbbgvfrllptqpbkixnv.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";

  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

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

  /* =========================================================
     UI HELPERS
     ========================================================= */

  function setStatus(text, type = "default") {
    if (!status) return;

    status.textContent = text;
    status.dataset.status = type;
  }

  function showOnly(element) {
    [loading, denied, dashboard].forEach((node) => {
      if (node) node.classList.add("hidden");
    });

    if (element) element.classList.remove("hidden");
  }

  function showAccessDenied(message) {
    if (denied) {
      const paragraph = denied.querySelector("p");
      if (paragraph && message) paragraph.textContent = message;
    }

    setStatus("Access denied", "denied");
    showOnly(denied);
  }

  function showDashboard(user) {
    showOnly(dashboard);
    setStatus("Administrator", "admin");

    const name =
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "Administrator";

    if ($("adminName")) $("adminName").textContent = name;
    if ($("adminEmail")) $("adminEmail").textContent = user?.email || "—";
  }

  /* =========================================================
     ADMIN AUTHORIZATION
     ---------------------------------------------------------
     The browser does NOT decide who is an administrator.
     Supabase executes public.is_admin(), which checks the
     protected public.admin_users table using auth.uid().
     ========================================================= */

  async function hasAdminAccess() {
    const { data, error } = await supabaseClient.rpc("is_admin");

    if (error) {
      console.error("Admin authorization error:", error);
      throw error;
    }

    return data === true;
  }

  /* =========================================================
     AUTHENTICATION
     ========================================================= */

  async function verifyAdminAccess() {
    try {
      setStatus("Checking access…", "checking");
      showOnly(loading);

      const {
        data: { session },
        error: sessionError
      } = await supabaseClient.auth.getSession();

      if (sessionError) {
        console.error("Admin session error:", sessionError);
        showAccessDenied("Unable to verify your session. Please log in again.");
        return;
      }

      if (!session?.user) {
        showAccessDenied("You must be logged in with an administrator account.");
        return;
      }

      const allowed = await hasAdminAccess();

      if (!allowed) {
        console.warn("Admin access rejected for user:", session.user.id);
        showAccessDenied("Your account does not have administrator permission.");
        return;
      }

      showDashboard(session.user);
    } catch (error) {
      console.error("Admin verification failed:", error);
      showAccessDenied("A security check failed. Please try again.");
    }
  }

  /* =========================================================
     LOGOUT
     ========================================================= */

  async function logout() {
    try {
      setStatus("Signing out…", "checking");
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error("Admin logout error:", error);
    } finally {
      window.location.href = "index.html";
    }
  }

  /* =========================================================
     DASHBOARD SECTIONS
     ---------------------------------------------------------
     These are placeholders only. Actual shop/menu/update tools
     will be connected in later steps.
     ========================================================= */

  function openSection(section) {
    if (!sectionPanel || !sectionContent) return;

    const sections = {
      shop: {
        title: "🛒 Shop Management",
        text: "Shop management will be connected in the next admin step."
      },
      menus: {
        title: "📂 Shop Menus",
        text: "Shop menu management will be connected after the shop database structure is ready."
      },
      updates: {
        title: "📢 Updates",
        text: "The update publishing system will be added in a later step."
      },
      settings: {
        title: "⚙️ Settings",
        text: "Administrator settings will be added after the core admin controls are secured."
      }
    };

    const selected = sections[section];

    if (!selected) return;

    sectionContent.innerHTML = `
      <div class="section-heading">
        <p class="eyebrow">ADMIN MODULE</p>
        <h3>${selected.title}</h3>
        <p class="muted">${selected.text}</p>
      </div>
    `;

    sectionPanel.classList.remove("hidden");
    sectionPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closeSection() {
    if (sectionPanel) sectionPanel.classList.add("hidden");
  }

  /* =========================================================
     EVENT LISTENERS
     ========================================================= */

  logoutBtn?.addEventListener("click", logout);
  deniedLogoutBtn?.addEventListener("click", logout);
  closeSectionBtn?.addEventListener("click", closeSection);

  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
      openSection(button.dataset.section);
    });
  });

  /* =========================================================
     AUTH STATE CHANGES
     ========================================================= */

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      window.location.href = "index.html";
      return;
    }

    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
      verifyAdminAccess();
    }
  });

  /* =========================================================
     START
     ========================================================= */

  verifyAdminAccess();
})();
