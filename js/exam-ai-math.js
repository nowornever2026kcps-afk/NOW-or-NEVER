/* =========================================================
   NOW-or-NEVER — EXAM AI MATH RENDERER
   ---------------------------------------------------------
   Safely renders LaTeX/MathJax inside Exam AI responses.
   Also loads the separate Exam Practice UI after the page is ready.
   ========================================================= */

(() => {
  "use strict";

  const MATHJAX_SRC =
    "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
  const PRACTICE_JS_SRC = "js/exam-practice.js";
  const PRACTICE_CSS_HREF = "css/exam-practice.css";

  function configureMathJax() {
    window.MathJax = window.MathJax || {};

    window.MathJax.tex = window.MathJax.tex || {};
    window.MathJax.tex.inlineMath = [
      ["\\(", "\\)"],
      ["$", "$"],
    ];
    window.MathJax.tex.displayMath = [
      ["\\[", "\\]"],
      ["$$", "$$"],
    ];
    window.MathJax.tex.processEscapes = true;

    window.MathJax.options = window.MathJax.options || {};
    window.MathJax.options.skipHtmlTags = [
      "script",
      "noscript",
      "style",
      "textarea",
      "pre",
      "code",
    ];
  }

  function loadMathJax() {
    if (window.MathJax?.typesetPromise) {
      return Promise.resolve(window.MathJax);
    }

    if (window.__examAiMathPromise) {
      return window.__examAiMathPromise;
    }

    configureMathJax();

    window.__examAiMathPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(
        'script[data-exam-ai-mathjax="true"]'
      );

      if (existing) {
        existing.addEventListener(
          "load",
          () => resolve(window.MathJax),
          { once: true }
        );
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = MATHJAX_SRC;
      script.async = true;
      script.dataset.examAiMathjax = "true";

      script.onload = () => resolve(window.MathJax);
      script.onerror = () => {
        window.__examAiMathPromise = null;
        reject(new Error("MathJax failed to load."));
      };

      document.head.appendChild(script);
    });

    return window.__examAiMathPromise;
  }

  async function typesetExamAi(root = document) {
    const messages = root.querySelectorAll?.(
      ".exam-ai-assistant-message"
    ) || [];

    if (!messages.length) return;

    try {
      const mathJax = await loadMathJax();

      if (!mathJax?.typesetPromise) return;

      await mathJax.typesetPromise([...messages]);
    } catch (error) {
      console.warn("Exam AI MathJax rendering unavailable:", error);
    }
  }

  function loadPracticeAssets() {
    if (!document.querySelector('link[data-exam-practice-css="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = PRACTICE_CSS_HREF;
      link.dataset.examPracticeCss = "true";
      document.head.appendChild(link);
    }

    if (document.querySelector('script[data-exam-practice-js="true"]')) return;

    const script = document.createElement("script");
    script.src = PRACTICE_JS_SRC;
    script.dataset.examPracticeJs = "true";
    script.async = false;
    document.body.appendChild(script);
  }

  function start() {
    const container = document.getElementById("examAiMessages");
    if (container) {
      // Render any assistant content already present.
      typesetExamAi(container);

      const observer = new MutationObserver((mutations) => {
        const addedAssistantMessage = mutations.some((mutation) =>
          [...mutation.addedNodes].some((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return false;

            return (
              node.matches?.(".exam-ai-assistant-message") ||
              node.querySelector?.(".exam-ai-assistant-message")
            );
          })
        );

        if (addedAssistantMessage) {
          typesetExamAi(container);
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
      });

      window.examAiTypesetMath = (root = container) => typesetExamAi(root);
    }

    // Keep Practice separate from Exam AI while avoiding another HTML edit.
    loadPracticeAssets();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
