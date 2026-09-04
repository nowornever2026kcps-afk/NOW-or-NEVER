/* =========================================================
   NOW-or-NEVER — EXAM AI MATH RENDERER
   Adds MathJax support without changing Exam AI logic.
   ========================================================= */

(() => {
  "use strict";

  const MATHJAX_SRC = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";

  function loadMathJax() {
    if (window.MathJax?.typesetPromise) return Promise.resolve(window.MathJax);
    if (window.__examAiMathPromise) return window.__examAiMathPromise;

    window.MathJax = window.MathJax || {};
    window.MathJax.tex = window.MathJax.tex || {};
    window.MathJax.tex.inlineMath = [["\\(", "\\)"]];
    window.MathJax.tex.displayMath = [["\\[", "\\]"], ["$$", "$$"]];
    window.MathJax.tex.processEscapes = true;
    window.MathJax.options = window.MathJax.options || {};
    window.MathJax.options.skipHtmlTags = ["script", "noscript", "style", "textarea", "pre", "code"];

    window.__examAiMathPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-exam-ai-mathjax]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.MathJax));
        existing.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.src = MATHJAX_SRC;
      script.async = true;
      script.dataset.examAiMathjax = "true";
      script.onload = () => resolve(window.MathJax);
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return window.__examAiMathPromise;
  }

  async function typesetExamAi(root = document) {
    const messages = root.querySelectorAll?.(".exam-ai-assistant-message") || [];
    if (!messages.length) return;

    try {
      const mathJax = await loadMathJax();
      if (!mathJax?.typesetPromise) return;
      await mathJax.typesetPromise([...messages]);
    } catch (error) {
      console.warn("Exam AI MathJax rendering unavailable:", error);
    }
  }

  function start() {
    if (!document.querySelector("#examAiMessages")) return;

    typesetExamAi();

    const container = document.getElementById("examAiMessages");
    if (!container) return;

    const observer = new MutationObserver(mutations => {
      const addedAssistantMessage = mutations.some(mutation =>
        [...mutation.addedNodes].some(node =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node.matches?.(".exam-ai-assistant-message") || node.querySelector?.(".exam-ai-assistant-message"))
        )
      );

      if (addedAssistantMessage) typesetExamAi(container);
    });

    observer.observe(container, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
