// =========================================================
// NOW OR NEVER — SAFE ANIMATION CONTROLLER
// =========================================================
//
// IMPORTANT:
// This file intentionally contains NO MutationObserver.
// It also does not modify navigation, authentication,
// Shop, Leaderboard, Tasks, Tests, Profile or History.
//
// Its only job is to provide a lightweight animation API.
// =========================================================

(() => {
  "use strict";

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  // -------------------------------------------------------
  // Animate a view when requested by the application
  // -------------------------------------------------------

  function animateView(view) {

    if (!view) {
      return;
    }

    if (prefersReducedMotion) {
      return;
    }

    view.classList.remove(
      "motion-view-refresh"
    );

    // Restart the animation safely.
    void view.offsetWidth;

    view.classList.add(
      "motion-view-refresh"
    );

  }


  // -------------------------------------------------------
  // Lightweight refresh
  // -------------------------------------------------------

  function refresh() {

    if (prefersReducedMotion) {
      return;
    }

    const activeView =
      document.querySelector(
        ".view.active"
      );

    if (activeView) {
      animateView(activeView);
    }

  }


  // -------------------------------------------------------
  // Public API
  //
  // Keep these names available so existing code that
  // references NowOrNeverMotion does not break.
  // -------------------------------------------------------

  window.NowOrNeverMotion = {

    refresh: refresh,

    animateView: animateView

  };


})();
