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

    if (
      sending
    ) return;


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


    /* -----------------------------------------------------
       UI
       ----------------------------------------------------- */

    addMessage(
      "user",
      message
    );


    aiInput.value = "";

    autoResize();

    hideWelcome();


    const typingId =
      addTyping();


    setSending(
      true
    );


    try {

      /*
       * Supabase automatically uses
       * the current authenticated session
       * when invoking the Edge Function.
       */

      const {
        data,
        error
      } =
        await supabaseClient.functions.invoke(
          FUNCTION_NAME,
          {
            body: {
              message
            }
          }
        );


      removeTyping(
        typingId
      );


      if (error) {

        console.error(
          "NOW AI FUNCTION ERROR:",
          error
        );

        addMessage(
          "ai",
          "I couldn't connect to NOW AI right now. Please try again."
        );

        return;

      }


      if (
        !data ||
        !data.success ||
        !data.answer
      ) {

        console.error(
          "NOW AI INVALID RESPONSE:",
          data
        );

        addMessage(
          "ai",
          data?.error ||
          "NOW AI returned an unexpected response."
        );

        return;

      }


      addMessage(
        "ai",
        data.answer
      );


    } catch (error) {

      removeTyping(
        typingId
      );


      console.error(
        "NOW AI ERROR:",
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

/* =========================================================
   AI EVENT SYSTEM
   Used by Tasks / Daily / Tests / Achievements
   ========================================================= */

async function nowAIEvent(event, data = {}) {

  try {

    const user = getCurrentUserSafe();

    if (!user) {
      return null;
    }

    const {
      data: response,
      error
    } = await supabaseClient.functions.invoke(
      FUNCTION_NAME,
      {
        body: {
          event,
          data
        }
      }
    );

    if (error) {

      console.error(
        "NOW AI EVENT ERROR:",
        error
      );

      return null;
    }

    if (
      !response ||
      !response.success ||
      !response.analysis
    ) {

      console.error(
        "NOW AI EVENT INVALID RESPONSE:",
        response
      );

      return null;
    }

    return response.analysis;

  } catch (error) {

    console.error(
      "NOW AI EVENT FAILED:",
      error
    );

    return null;
  }

}


/* =========================================================
   TASK ANALYSIS
   ========================================================= */

async function analyzeTaskWithAI(taskName) {

  if (!taskName) {
    return null;
  }

  return await nowAIEvent(
    "task_added",
    {
      task: taskName
    }
  );

}


/* =========================================================
   SHOW AI TASK RESULT
   ========================================================= */

function showAITaskAnalysis(analysis) {

  if (!analysis) {
    return;
  }

  const score =
    Number(analysis.score ?? 0);

  const message =
    String(
      analysis.message ?? ""
    );

  const suggestion =
    String(
      analysis.suggestion ?? ""
    );

  const rating =
    String(
      analysis.rating ?? ""
    );

  const mood =
    String(
      analysis.mood ?? "thinking"
    );

  const moodEmoji = {
    happy: "😊",
    excited: "⚡",
    thinking: "🤔",
    concerned: "😟"
  }[mood] || "🤖";


  /*
   * Open the existing AI panel
   */

  if (
    typeof openPanel ===
    "function"
  ) {

    openPanel();

  }


  /*
   * Add a normal AI message using
   * the existing NOW AI UI.
   */

  if (
    typeof addMessage ===
    "function"
  ) {

    addMessage(
      "ai",
      `
        <strong>${moodEmoji} Task effectiveness: ${score}%</strong>
        <br>
        ${escapeHtml(message)}
        <br><br>
        <strong>💡 ${escapeHtml(suggestion)}</strong>
      `
    );

  }

}
