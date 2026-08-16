// =========================================================
// NOW OR NEVER — UI MOTION CONTROLLER
// Mobile-safe / low-overhead version.
//
// IMPORTANT:
// This version intentionally does NOT use a global
// MutationObserver. The previous observer watched the
// entire document and could repeatedly trigger animation
// work whenever Shop, Leaderboard, Tasks, Tests, etc.
// changed the DOM.
// =========================================================

(() => {
  "use strict";

  let refreshFrame = 0;
  let lastRefresh = 0;

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mobile =
    window.matchMedia &&
    window.matchMedia("(max-width: 700px)").matches;


  // =======================================================
  // BUTTON RIPPLE
  // =======================================================

  function addRipple(button, event) {
    if (!button || button.disabled || reducedMotion) {
      return;
    }

    const rect = button.getBoundingClientRect();

    const ripple = document.createElement("span");

    ripple.className = "motion-ripple";

    ripple.style.left =
      `${event.clientX - rect.left}px`;

    ripple.style.top =
      `${event.clientY - rect.top}px`;

    button.appendChild(ripple);

    window.setTimeout(() => {
      ripple.remove();
    }, 520);
  }


  // =======================================================
  // CARD REVEAL
  // =======================================================

  function revealCards(root = document) {

    const cards =
      root.querySelectorAll(
        ".card:not(.motion-visible)"
      );

    cards.forEach((card, index) => {

      card.style.animationDelay =
        `${Math.min(index * 35, 210)}ms`;

      card.classList.add(
        "motion-visible"
      );

    });
  }


  // =======================================================
  // NUMBER POP
  // =======================================================

  function popUpdatedNumbers(root = document) {

    const selectors = [

      "#personalTotalPoints",
      "#personalTotalHours",
      "#personalAvgDay",
      "#personalAvgWeek",
      "#personalStreak",
      "#achievementCount",
      "#achievementPoints",
      "#myProfilePoints"

    ];


    selectors.forEach(selector => {

      root.querySelectorAll(selector).forEach(el => {

        el.classList.remove(
          "number-pop"
        );

        // Force the browser to restart
        // the small number animation.
        void el.offsetWidth;

        el.classList.add(
          "number-pop"
        );

      });

    });
  }


  // =======================================================
  // TASK COMPLETION STATE
  // =======================================================

  function markCompletedTasks(root = document) {

    root.querySelectorAll(
      ".task-row"
    ).forEach(row => {

      const checkbox =
        row.querySelector(
          ".task-check"
        );

      if (
        checkbox &&
        checkbox.checked
      ) {

        row.classList.add(
          "task-completed"
        );

      } else {

        row.classList.remove(
          "task-completed"
        );

      }

    });
  }


  // =======================================================
  // LEADERBOARD ANIMATION
  // =======================================================

  function animateBoard(root = document) {

    root.querySelectorAll(
      ".leader"
    ).forEach((row, index) => {

      row.style.animationDelay =
        `${Math.min(index * 35, 280)}ms`;

    });


    root.querySelectorAll(
      ".progress span"
    ).forEach(bar => {

      bar.style.transformOrigin =
        "left center";

    });

  }


  // =======================================================
  // TEST ANIMATION
  // =======================================================

  function animateTests(root = document) {

    root.querySelectorAll(
      ".test-list-row"
    ).forEach((row, index) => {

      row.style.animationDelay =
        `${Math.min(index * 35, 210)}ms`;

    });

  }


  // =======================================================
  // VIEW ANIMATION
  // =======================================================

  function animateView(view) {

    if (!view) {
      return;
    }


    view.classList.remove(
      "motion-view-refresh"
    );


    if (!reducedMotion) {

      // Force restart of the view animation.
      void view.offsetWidth;

      view.classList.add(
        "motion-view-refresh"
      );

    }


    revealCards(view);

    markCompletedTasks(view);


    // Desktop can handle the additional
    // leaderboard/test animation scans.
    //
    // Mobile intentionally skips these extra
    // animation passes to reduce CPU/GPU work.

    if (
      !mobile &&
      !reducedMotion
    ) {

      popUpdatedNumbers(view);

      animateBoard(view);

      animateTests(view);

    }

  }


  // =======================================================
  // REFRESH
  // =======================================================

  function performRefresh() {

    refreshFrame = 0;

    const now =
      performance.now();


    // Prevent repeated refresh calls
    // from happening too close together.

    if (
      now - lastRefresh < 100
    ) {

      return;

    }


    lastRefresh = now;


    revealCards();

    markCompletedTasks();


    // These are deliberately skipped
    // on mobile.

    if (
      !mobile &&
      !reducedMotion
    ) {

      animateBoard();

      animateTests();

    }

  }


  // =======================================================
  // SCHEDULE REFRESH
  // =======================================================

  function scheduleRefresh() {

    if (refreshFrame) {
      return;
    }


    refreshFrame =
      window.requestAnimationFrame(
        performRefresh
      );

  }


  // =======================================================
  // POINTER RIPPLE
  //
  // Event-driven only.
  // No document scanning.
  // =======================================================

  document.addEventListener(
    "pointerdown",
    event => {

      const button =
        event.target.closest(
          "button"
        );


      if (button) {

        addRipple(
          button,
          event
        );

      }

    },
    {
      passive: true
    }
  );


  // =======================================================
  // NAVIGATION ANIMATION
  //
  // app.js remains responsible for navigation.
  // This only reacts after app.js changes the view.
  // =======================================================

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          ".nav button"
        );


      if (!button) {
        return;
      }


      window.setTimeout(() => {

        const id =
          button.dataset.view;


        if (id) {

          animateView(
            document.getElementById(
              id
            )
          );

        }

      }, 40);

    },
    {
      passive: true
    }
  );


  // =======================================================
  // TASK CHECKBOX
  //
  // Event-driven instead of using MutationObserver.
  // =======================================================

  document.addEventListener(
    "change",
    event => {

      const checkbox =
        event.target.closest(
          ".task-check"
        );


      if (!checkbox) {
        return;
      }


      const row =
        checkbox.closest(
          ".task-row"
        );


      if (!row) {
        return;
      }


      row.classList.toggle(
        "task-completed",
        checkbox.checked
      );

    },
    {
      passive: true
    }
  );


  // =======================================================
  // PUBLIC API
  //
  // Kept for compatibility with the existing application.
  // =======================================================

  window.NowOrNeverMotion = {

    refresh:
      scheduleRefresh,

    animateView:
      animateView

  };


  // =======================================================
  // INITIAL REFRESH
  // =======================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      scheduleRefresh,
      {
        once: true
      }
    );

  } else {

    scheduleRefresh();

  }

})();
