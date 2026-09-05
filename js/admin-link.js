/* =========================================================
   NOW-or-NEVER
   ADMIN DASHBOARD NAVIGATION LINK
   ---------------------------------------------------------
   Adds the Admin Dashboard entry to the existing More menu.
   The link is created hidden and is revealed ONLY when the
   authenticated user is authorized by Supabase's server-side
   public.is_admin() function.

   NOTE: admin.html remains independently protected. This file
   only controls whether the navigation entry is displayed.
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://kvbbgvfrllptqpbkixnv.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";

  const ADMIN_LINK_ID = "adminDashboardNavBtn";

  function hideAdminLink(link) {
    if (!link) return;

    link.classList.add("hidden");
    link.hidden = true;
    link.setAttribute("aria-hidden", "true");
  }

  function showAdminLink(link) {
    if (!link) return;

    link.hidden = false;
    link.classList.remove("hidden");
    link.setAttribute("aria-hidden", "false");
  }

  function createAdminLink() {
    const grid = document.querySelector("#moreNavMenu .more-nav-grid");

    if (!grid) {
      return null;
    }

    const existing = document.getElementById(ADMIN_LINK_ID);

    if (existing) {
      hideAdminLink(existing);
      return existing;
    }

    const link = document.createElement("a");
    link.id = ADMIN_LINK_ID;
    link.href = "admin.html";
    link.className = "more-nav-item hidden";
    link.hidden = true;
    link.setAttribute("aria-hidden", "true");
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

    // Always start hidden. Never expose the admin destination while
    // authorization is being checked.
    hideAdminLink(link);

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
      // Fail closed: every check starts by hiding the link.
      hideAdminLink(link);

      try {
        const {
          data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session?.user) {
          return;
        }

        const { data, error } = await supabaseClient.rpc("is_admin");

        if (error) {
          console.error("Admin navigation authorization error:", error);
          return;
        }

        if (data === true) {
          showAdminLink(link);
        }
      } catch (error) {
        console.error("Admin navigation check failed:", error);
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
        // Run outside the auth callback so the visibility check does not
        // block Supabase's internal auth event processing.
        setTimeout(updateAdminVisibility, 0);
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
