/* =========================================================
   NOW OR NEVER — LIGHTWEIGHT ANIMATION CONTROLLER
   Mobile-safe version
   ========================================================= */

(() => {
  "use strict";

  let animationFrame = null;
  let lastRun = 0;

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isMobile =
    window.matchMedia &&
    window.matchMedia("(max-width: 600px)").matches;

  function runAnimations() {
    const now = performance.now();

    // Prevent animation work from running repeatedly
    if (now - lastRun < 120) return;

    lastRun = now;

    if (typeof revealCards === "function") {
      revealCards();
    }

    if (typeof markCompletedTasks === "function") {
      markCompletedTasks();
    }

    // Heavy board/test animations are skipped on mobile
    if (!isMobile && !prefersReducedMotion) {
      if (typeof animateBoard === "function") {
        animateBoard();
      }

      if (typeof animateTests === "function") {
        animateTests();
      }
    }
  }

  function scheduleAnimations() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    animationFrame = requestAnimationFrame(() => {
      animationFrame = null;
      runAnimations();
    });
  }

  /*
   * IMPORTANT:
   * We intentionally do NOT observe document.body.
   *
   * The old version watched the entire DOM:
   *
   * observer.observe(document.body, {
   *   childList: true,
   *   subtree: true
   * });
   *
   * That could cause animation work every time the application
   * changed any part of the page.
   */

  document.addEventListener("DOMContentLoaded", scheduleAnimations);

  window.addEventListener("load", scheduleAnimations);

  /*
   * Run when the user changes page/section.
   * This is much cheaper than a global MutationObserver.
   */
  document.addEventListener("click", (event) => {
    const target = event.target.closest(
      "[data-section], [data-page], .nav-item, .nav-link"
    );

    if (target) {
      scheduleAnimations();
    }
  });

  /*
   * Expose a small manual refresh function.
   * Other application files can call:
   *
   * window.refreshAnimations();
   */
  window.refreshAnimations = scheduleAnimations;

})();
