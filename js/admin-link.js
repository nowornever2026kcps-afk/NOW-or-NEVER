/* =========================================================
   NOW-or-NEVER
   ADMIN DASHBOARD NAVIGATION LINK
   ---------------------------------------------------------
   Adds the Admin Dashboard entry to the existing More menu.
   The link is created only for users authorized by Supabase's
   server-side public.is_admin() function.
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://kvbbgvfrllptqpbkixnv.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";

  const ADMIN_LINK_ID = "adminDashboardNavBtn";

  function createAdminLink() {
    const grid = document.querySelector("#moreNavMenu .more-nav-grid");

    if (!grid || document.getElementById(ADMIN_LINK_ID)) {
      return document.getElementById(ADMIN_LINK_ID);
    }

    const link = document.createElement("a");
    link.id = ADMIN_LINK_ID;
    link.href = "admin.html";
    link.className = "more-nav-item hidden";
    link.setAttribute("aria-label", "Open Admin Dashboard");

    link.innerHTML = `
      <span class="more-icon">🛡️</span>
      <span>
        <strong>Admin Dashboard</strong>
        <small>Manage NOW-or-NEVER</small>
      </span>
    `;

    grid.appendChild(link);
    return link;
  }

  async function setupAdminLink() {
    if (!window.supabase) {
      console.error("Admin navigation: Supabase library is not loaded.");
      return;
    }

    const link = createAdminLink();
    if (!link) {
      return;
    }

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

    async function updateAdminVisibility() {
      try {
        const {
          data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session?.user) {
          link.classList.add("hidden");
          return;
        }

        const { data, error } = await supabaseClient.rpc("is_admin");

        if (error) {
          console.error("Admin navigation authorization error:", error);
          link.classList.add("hidden");
          return;
        }

        link.classList.toggle("hidden", data !== true);
      } catch (error) {
        console.error("Admin navigation check failed:", error);
        link.classList.add("hidden");
      }
    }

    await updateAdminVisibility();

    supabaseClient.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        updateAdminVisibility();
      }
    });
  }

  function waitForMoreMenu() {
    if (document.querySelector("#moreNavMenu .more-nav-grid")) {
      setupAdminLink();
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector("#moreNavMenu .more-nav-grid")) {
        observer.disconnect();
        setupAdminLink();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForMoreMenu, {
      once: true
    });
  } else {
    waitForMoreMenu();
  }
})();
