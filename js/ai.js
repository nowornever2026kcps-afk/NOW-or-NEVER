/* =========================================================
   NOW AI
   Gemini-powered study assistant
   ========================================================= */

(() => {

  "use strict";


  /* =======================================================
     CONFIG
     ======================================================= */

  const FUNCTION_NAME = "now-ai";
  const TASK_FUNCTION_NAME = "now-ai-task";

  const MAX_MESSAGE_LENGTH = 4000;

  const STORAGE_KEY =
    "now_or_never_ai_chat_v1";


  /* =======================================================
     ELEMENTS
     ======================================================= */

  let aiButton = null;
  let aiPanel = null;
  let aiMessages = null;
  let aiInput = null;
  let aiSend = null;
  let aiClose = null;

  let welcomeBlock = null;
  let quickBlock = null;

  let initialized = false;
  let sending = false;

  let companion = null;
  let companionTimer = null;


  /* =======================================================
     HELPERS
     ======================================================= */

  function escapeHtml(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function getCurrentUserSafe() {

    try {

      if (
        typeof currentUser !==
        "undefined"
      ) {

        return currentUser;

      }

    } catch (_) {}

    return null;

  }


  /* =======================================================
     BUILD UI
     ======================================================= */

  function createAI() {

    if (
      document.getElementById(
        "nowAiButton"
      )
    ) {

      return;

    }


    /* -----------------------------------------------------
       FLOATING BUTTON
       ----------------------------------------------------- */

    aiButton =
      document.createElement("button");

    aiButton.id =
      "nowAiButton";

    aiButton.type =
      "button";

    aiButton.setAttribute(
      "aria-label",
      "Open NOW AI"
    );

    aiButton.innerHTML = `
      <span class="now-ai-pulse"></span>
      🤖
    `;


    /* -----------------------------------------------------
       CHAT PANEL
       ----------------------------------------------------- */

    aiPanel =
      document.createElement("section");

    aiPanel.id =
      "nowAiPanel";

    aiPanel.setAttribute(
      "aria-label",
      "NOW AI assistant"
    );


    aiPanel.innerHTML = `

      <div class="now-ai-header">

        <div class="now-ai-avatar">
          🤖
        </div>

        <div class="now-ai-header-text">

          <div class="now-ai-title">
            NOW AI
          </div>

          <div class="now-ai-status">
            Study assistant
          </div>

        </div>

        <button
          type="button"
          class="now-ai-close"
          aria-label="Close NOW AI"
        >
          ×
        </button>

      </div>


      <div id="nowAiMessages">

        <div class="now-ai-welcome">

          <div class="now-ai-welcome-icon">
            🧠
          </div>

          <div class="now-ai-welcome-title">
            Hey, I'm NOW AI
          </div>

          <div class="now-ai-welcome-text">
            Ask me about your studies,
            tests, productivity, revision,
            or anything you're struggling with.
          </div>

        </div>

        <div class="now-ai-quick">

          <button
            type="button"
            data-prompt="Make me a study plan for today."
          >
            📚 Study plan
          </button>

          <button
            type="button"
            data-prompt="Analyze my recent study progress."
          >
            📈 My progress
          </button>

          <button
            type="button"
            data-prompt="Give me some motivation to study right now."
          >
            🔥 Motivation
          </button>

          <button
            type="button"
            data-prompt="Help me prepare for my next test."
          >
            🧪 Test prep
          </button>

        </div>

      </div>


      <div class="now-ai-input-area">

        <div class="now-ai-input-row">

          <textarea
            id="nowAiInput"
            rows="1"
            maxlength="${MAX_MESSAGE_LENGTH}"
            placeholder="Ask NOW AI..."
            autocomplete="off"
          ></textarea>

          <button
            type="button"
            id="nowAiSend"
            aria-label="Send message"
          >
            ➤
          </button>

        </div>

        <div class="now-ai-footer-note">
          NOW AI can make mistakes. Check important information.
        </div>

      </div>

    `;


    document.body.appendChild(
      aiButton
    );

    document.body.appendChild(
      aiPanel
    );


    /* -----------------------------------------------------
       PET COMPANION
       ----------------------------------------------------- */

    companion =
      document.getElementById(
        "nowAiCompanion"
      );

    if (!companion) {

      companion =
        document.createElement("div");

      companion.id =
        "nowAiCompanion";

      companion.innerHTML = `
        <div class="now-ai-companion-robot">
          🤖
        </div>
        <div class="now-ai-companion-message">
          Hey! I'm watching your progress. 👀
        </div>
      `;

      document.body.appendChild(
        companion
      );
    }


    /* -----------------------------------------------------
       REFERENCES
       ----------------------------------------------------- */

    aiMessages =
      document.getElementById(
        "nowAiMessages"
      );

    aiInput =
      document.getElementById(
        "nowAiInput"
      );

    aiSend =
      document.getElementById(
        "nowAiSend"
      );

    aiClose =
      aiPanel.querySelector(
        ".now-ai-close"
      );

    welcomeBlock =
      aiPanel.querySelector(
        ".now-ai-welcome"
      );

    quickBlock =
      aiPanel.querySelector(
        ".now-ai-quick"
      );


    /* -----------------------------------------------------
       EVENTS
       ----------------------------------------------------- */

    aiButton.addEventListener(
      "click",
      togglePanel
    );

    aiClose.addEventListener(
      "click",
      closePanel
    );


    aiSend.addEventListener(
      "click",
      sendMessage
    );


    aiInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendMessage();

        }

      }
    );


    aiInput.addEventListener(
      "input",
      autoResize
    );


    if (quickBlock) {

      quickBlock
        .querySelectorAll(
          "button[data-prompt]"
        )
        .forEach(button => {

          button.addEventListener(
            "click",
            () => {

              const prompt =
                button.dataset.prompt;

              if (!prompt) return;

              aiInput.value =
                prompt;

              autoResize();

              sendMessage();

            }
          );

        });

    }


    initialized = true;


    updateVisibility();

  }


  /* =======================================================
     OPEN / CLOSE
     ======================================================= */

  function togglePanel() {

    if (
      !aiPanel
    ) return;

    if (
      aiPanel.classList.contains(
        "open"
      )
    ) {

      closePanel();

    } else {

      openPanel();

    }

  }


  function openPanel() {

    if (
      !aiPanel
    ) return;


    if (
      !getCurrentUserSafe()
    ) {

      if (
        typeof showToast ===
        "function"
      ) {

        showToast(
          "Please login first."
        );

      }

      return;

    }


    aiPanel.classList.add(
      "open"
    );

    aiButton.setAttribute(
      "aria-expanded",
      "true"
    );


    setTimeout(() => {

      aiInput?.focus();

      scrollMessages();

    }, 180);

  }


  function closePanel() {

    if (!aiPanel) return;

    aiPanel.classList.remove(
      "open"
    );

    aiButton?.setAttribute(
      "aria-expanded",
      "false"
    );

  }


  /* =======================================================
     VISIBILITY
     ======================================================= */

  function updateVisibility() {

    if (
      !aiButton
    ) return;


    const user =
      getCurrentUserSafe();


    const mainApp =
      document.getElementById(
        "mainApp"
      );


    const authScreen =
      document.getElementById(
        "authScreen"
      );


    const loggedIn =
      !!user;


    const appVisible =
      mainApp &&
      !mainApp.classList.contains(
        "hidden"
      );


    const authVisible =
      authScreen &&
      !authScreen.classList.contains(
        "hidden"
      );


    if (
      loggedIn &&
      appVisible &&
      !authVisible
    ) {

      aiButton.classList.remove(
        "hidden"
      );

    } else {

      aiButton.classList.add(
        "hidden"
      );

      closePanel();

    }

  }


  /* =======================================================
     OBSERVE LOGIN SCREEN
     ======================================================= */

  function watchApplicationState() {

    const observer =
      new MutationObserver(
        updateVisibility
      );


    const targets = [
      document.getElementById(
        "mainApp"
      ),
      document.getElementById(
        "authScreen"
      ),
      document.body
    ];


    targets.forEach(
      target => {

        if (target) {

          observer.observe(
            target,
            {
              attributes: true,
              attributeFilter: [
                "class"
              ]
            }
          );

        }

      }
    );


    setInterval(
      updateVisibility,
      1500
    );

  }


  /* =======================================================
     SEND MESSAGE
     ======================================================= */

 async function sendMessage() {

  if (sending) return;


  const user =
    getCurrentUserSafe();


  if (!user) {

    if (
      typeof showToast ===
      "function"
    ) {

      showToast(
        "Please login first."
      );

    }

    return;
  }


  const message =
    String(
      aiInput?.value ?? ""
    ).trim();


  if (!message) {
    return;
  }


  if (
    message.length >
    MAX_MESSAGE_LENGTH
  ) {

    if (
      typeof showToast ===
      "function"
    ) {

      showToast(
        "Message is too long."
      );

    }

    return;
  }


  /* =====================================================
     SHOW USER MESSAGE
     ===================================================== */

  addMessage(
    "user",
    message
  );


  aiInput.value = "";

  autoResize();

  hideWelcome();


  const typingId =
    addTyping();


  setSending(true);


  try {

    console.log(
      "[NOW AI CHAT] Sending:",
      message
    );


    /* ===================================================
       SEND TO SUPABASE EDGE FUNCTION
       =================================================== */

    const {
      data,
      error
    } =
      await supabaseClient
        .functions
        .invoke(
          FUNCTION_NAME,
          {
            body: {

              event:
                "chat",

              message:
                message

            }
          }
        );


    removeTyping(
      typingId
    );


    console.log(
      "[NOW AI CHAT] Response:",
      data
    );


    /* ===================================================
       ERROR
       =================================================== */

    if (error) {

      console.error(
        "[NOW AI CHAT] FUNCTION ERROR:",
        error
      );


      addMessage(
        "ai",
        "I couldn't connect to NOW AI right now. Please try again."
      );


      return;
    }


    /* ===================================================
       VALIDATE RESPONSE
       =================================================== */

    if (
      !data ||
      !data.success ||
      !data.answer
    ) {

      console.error(
        "[NOW AI CHAT] INVALID RESPONSE:",
        data
      );


      addMessage(
        "ai",
        data?.error ||
        "NOW AI returned an unexpected response."
      );


      return;
    }


    /* ===================================================
       EXTRACT AI RESPONSE
       =================================================== */

    const reply =
  String(
    data.answer || ""
  ).trim();

if (!reply) {

  addMessage(
    "ai",
    "NOW AI returned an empty response."
  );

  return;
}

addMessage(
  "ai",
  reply
);


 

   


  } catch (error) {


    removeTyping(
      typingId
    );


    console.error(
      "[NOW AI CHAT] ERROR:",
      error
    );


    addMessage(
      "ai",
      "Something went wrong while contacting NOW AI. Please try again."
    );


  } finally {

    setSending(
      false
    );

  }

}

  /* =======================================================
     MESSAGE UI
     ======================================================= */

  function addMessage(
    role,
    text
  ) {

    if (
      !aiMessages
    ) return;


    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      `now-ai-message ${role}`;


    const bubble =
      document.createElement(
        "div"
      );


    bubble.className =
      "now-ai-bubble";


    /*
     * Use textContent instead of innerHTML
     * so AI output cannot inject HTML.
     */

    bubble.textContent =
      text;


    wrapper.appendChild(
      bubble
    );


    aiMessages.appendChild(
      wrapper
    );


    scrollMessages();


    return wrapper;

  }


  function addTyping() {

    if (
      !aiMessages
    ) return null;


    const id =
      `now-ai-typing-${Date.now()}`;


    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "now-ai-message ai";


    wrapper.id =
      id;


    wrapper.innerHTML = `

      <div class="now-ai-bubble">

        <div class="now-ai-typing">

          <span></span>
          <span></span>
          <span></span>

        </div>

      </div>

    `;


    aiMessages.appendChild(
      wrapper
    );


    scrollMessages();


    return id;

  }


  function removeTyping(
    id
  ) {

    if (!id) return;

    const element =
      document.getElementById(
        id
      );


    if (element) {

      element.remove();

    }

  }


  function hideWelcome() {

    welcomeBlock?.remove();

    quickBlock?.remove();

  }


  function scrollMessages() {

    if (!aiMessages)
      return;


    requestAnimationFrame(
      () => {

        aiMessages.scrollTop =
          aiMessages.scrollHeight;

      }
    );

  }


  function setSending(
    state
  ) {

    sending =
      state;


    if (aiSend) {

      aiSend.disabled =
        state;

    }

    if (aiInput) {

      aiInput.disabled =
        state;

    }

  }


  function autoResize() {

    if (!aiInput)
      return;


    aiInput.style.height =
      "auto";


    aiInput.style.height =
      Math.min(
        aiInput.scrollHeight,
        120
      ) + "px";

  }


  /* =======================================================
     PET COMPANION
     ======================================================= */

  function showAICompanion(message, mood = "thinking", duration = 0) {

  if (!companion) {
    companion = document.getElementById("nowAiCompanion");
  }

  if (!companion) {
    console.warn("[NOW AI] Companion element not found.");
    return;
  }

  const messageBox = companion.querySelector(".now-ai-companion-message");

  if (!messageBox) return;

  // Cancel any previous automatic timer
  if (companionTimer) {
    clearTimeout(companionTimer);
    companionTimer = null;
  }

  // ----------------------------------------------------------
  // MESSAGE
  // ----------------------------------------------------------

  messageBox.innerHTML = `
    <div class="now-ai-companion-scroll">
      ${escapeHtml(String(message || ""))}
    </div>

    <button
      type="button"
      class="now-ai-companion-ok"
      aria-label="Close NOW AI message"
    >
      OK
    </button>
  `;

  // ----------------------------------------------------------
  // MOOD
  // ----------------------------------------------------------

  companion.classList.remove(
    "thinking",
    "happy",
    "concerned"
  );

  if (
    ["thinking", "happy", "concerned"].includes(mood)
  ) {
    companion.classList.add(mood);
  }

  // ----------------------------------------------------------
  // SHOW
  // ----------------------------------------------------------

  companion.classList.add("show");

  // ----------------------------------------------------------
  // OK BUTTON
  // ----------------------------------------------------------

  const okButton =
    messageBox.querySelector(
      ".now-ai-companion-ok"
    );

  if (okButton) {
    okButton.addEventListener(
      "click",
      () => {

        if (companionTimer) {
          clearTimeout(companionTimer);
          companionTimer = null;
        }

        companion.classList.remove("show");

      },
      { once: true }
    );
  }

  // ----------------------------------------------------------
  // OPTIONAL TIMER
  // ----------------------------------------------------------
  // duration = 0 means stay until OK is clicked.

  if (duration > 0) {

    companionTimer = setTimeout(() => {

      companion?.classList.remove("show");

      companionTimer = null;

    }, duration);

  }

}

  async function analyzeTaskWithAI(taskName) {

    const task = String(taskName || "").trim();
    if (!task) return null;

    console.log("[NOW AI] Analyzing task:", task);

    try {
      const { data, error } =
        await supabaseClient.functions.invoke(
          TASK_FUNCTION_NAME,
          {
            body: {
              event: "task_added",
              data: {
                task
              }
            }
          }
        );

      if (error) {
        console.error("[NOW AI] Task analysis function error:", error);
        return null;
      }

      console.log("[NOW AI] Task analysis response:", data);

      if (!data || !data.success || !data.analysis) {
        console.error("[NOW AI] Invalid task analysis response:", data);
        return null;
      }

      return data.analysis;
    } catch (error) {
      console.error("[NOW AI] Task analysis failed:", error);
      return null;
    }
  }


 function showAITaskAnalysis(analysis) {

  if (!analysis) return;

  // ---------------------------------------------------------
  // BASIC FIELDS
  // ---------------------------------------------------------

  const score = Number(
    analysis.score ??
    analysis.effectiveness_score
  );

  const message =
    String(
      analysis.message ??
      analysis.ai_message ??
      ""
    ).trim();

  const suggestion =
    String(
      analysis.suggestion ??
      analysis.improvement ??
      ""
    ).trim();

  const mood =
    String(
      analysis.mood ?? "thinking"
    ).toLowerCase();


  // ---------------------------------------------------------
  // EXTRA ANALYSIS
  // ---------------------------------------------------------

  const neet =
    String(
      analysis.neet_relevance ?? ""
    ).trim();

  const board =
    String(
      analysis.board_relevance ?? ""
    ).trim();

  const priority =
    String(
      analysis.priority ?? ""
    ).trim();

  const importance =
    Number(
      analysis.importance
    );

  const recommendedTime =
    String(
      analysis.recommended_time ?? ""
    ).trim();

  const timeAdvice =
    String(
      analysis.time_advice ?? ""
    ).trim();

  const analysisText =
    String(
      analysis.analysis ?? ""
    ).trim();

  const neetReason =
    String(
      analysis.neet_reason ?? ""
    ).trim();

  const boardReason =
    String(
      analysis.board_reason ?? ""
    ).trim();

  const improvement =
    String(
      analysis.improvement ?? ""
    ).trim();

  const strategy =
    String(
      analysis.strategy ?? ""
    ).trim();


  // ---------------------------------------------------------
  // HEADLINE
  // ---------------------------------------------------------

  let prefix =
    "🤖 Here's what I think about that task:";

  if (Number.isFinite(score)) {

    if (score >= 90) {

      prefix =
        `⚡ ${score}% — Excellent task!`;

    } else if (score >= 75) {

      prefix =
        `😊 ${score}% — That's a good task!`;

    } else if (score >= 55) {

      prefix =
        `🤔 ${score}% — It could be stronger.`;

    } else {

      prefix =
        `👀 ${score}% — Let's improve this task.`;
    }
  }


  // ---------------------------------------------------------
  // BUILD FULL COMPANION MESSAGE
  // ---------------------------------------------------------

  const sections = [];

  sections.push(prefix);


  if (message) {

    sections.push(
      `\n${message}`
    );
  }


  // ---------------------------------------------------------
  // QUICK STATS
  // ---------------------------------------------------------

  const stats = [];

  if (neet) {

    stats.push(
      `📚 NEET: ${neet}`
    );
  }

  if (board) {

    stats.push(
      `📝 Boards: ${board}`
    );
  }

  if (priority) {

    stats.push(
      `🔥 Priority: ${priority}`
    );
  }

  if (
    Number.isFinite(importance)
  ) {

    stats.push(
      `⭐ Importance: ${importance}/10`
    );
  }

  if (recommendedTime) {

    stats.push(
      `⏱ Recommended: ${recommendedTime}`
    );
  }

  if (stats.length) {

    sections.push(
      `\n${stats.join("\n")}`
    );
  }


  // ---------------------------------------------------------
  // ANALYSIS
  // ---------------------------------------------------------

  if (analysisText) {

    sections.push(
      `\n🔎 Why:\n${analysisText}`
    );
  }


  // ---------------------------------------------------------
  // NEET
  // ---------------------------------------------------------

  if (neetReason) {

    sections.push(
      `\n📚 NEET:\n${neetReason}`
    );
  }


  // ---------------------------------------------------------
  // BOARDS
  // ---------------------------------------------------------

  if (boardReason) {

    sections.push(
      `\n📝 Boards:\n${boardReason}`
    );
  }


  // ---------------------------------------------------------
  // TIME ADVICE
  // ---------------------------------------------------------

  if (timeAdvice) {

    sections.push(
      `\n⏱ Time advice:\n${timeAdvice}`
    );
  }


  // ---------------------------------------------------------
  // IMPROVEMENT
  // ---------------------------------------------------------

  const finalImprovement =
    improvement ||
    suggestion;

  if (finalImprovement) {

    sections.push(
      `\n💡 Improve:\n${finalImprovement}`
    );
  }


  // ---------------------------------------------------------
  // STRATEGY
  // ---------------------------------------------------------

  if (strategy) {

    sections.push(
      `\n🎯 Strategy:\n${strategy}`
    );
  }


  // ---------------------------------------------------------
  // SHOW COMPANION
  // ---------------------------------------------------------

  showAICompanion(
    sections.join("\n"),
    mood === "happy"
      ? "happy"
      : mood === "concerned"
        ? "concerned"
        : "thinking",
    0
  );
}


  window.showAICompanion = showAICompanion;
  window.analyzeTaskWithAI = analyzeTaskWithAI;
  window.showAITaskAnalysis = showAITaskAnalysis;


  /* =======================================================
     START
     ======================================================= */

  function start() {

    if (
      initialized
    ) return;


    createAI();

    watchApplicationState();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once: true
      }
    );

  } else {

    start();

  }


})();
