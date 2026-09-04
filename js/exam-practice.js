/* =========================================================
   NOW-or-NEVER — EXAM PRACTICE UI
   ---------------------------------------------------------
   Handles the Practice button in the Exam Command Center.
   Questions come from the authenticated exam-practice Edge
   Function. No changes are made to the existing Exam AI chat.
   ========================================================= */

(() => {
  "use strict";

  const PRACTICE_FUNCTION = "exam-practice";
  let panel = null;
  let state = null;
  let clickBound = false;

  const $ = (id) => document.getElementById(id);

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeSubject(value) {
    const text = String(value || "").trim().toLowerCase();
    if (text.includes("bio")) return "Biology";
    if (text.includes("phys")) return "Physics";
    if (text.includes("chem")) return "Chemistry";
    return String(value || "").trim();
  }

  function getSelectedTopicRow() {
    const rows = [...document.querySelectorAll(".syllabus-topic-row")];
    return rows.find((row) => {
      const selected = row.classList.contains("selected");
      const topicId = row.dataset.topicId || row.getAttribute("data-topic-id");
      return selected && topicId;
    }) || null;
  }

  function getContextFromPage() {
    const row = getSelectedTopicRow();
    if (!row) return null;

    const topicId = Number(row.dataset.topicId || row.getAttribute("data-topic-id")) || null;
    const topic = String(
      row.dataset.topicName ||
      row.getAttribute("data-topic-name") ||
      row.querySelector(".syllabus-topic-name, .topic-name, [data-topic-name]")?.textContent ||
      ""
    ).trim();

    const chapterElement = row.closest(".syllabus-chapter")?.querySelector(
      ".syllabus-chapter-title strong, .syllabus-chapter-title, .chapter-title, [data-chapter-name]"
    );
    const chapter = String(
      row.dataset.chapterName ||
      row.getAttribute("data-chapter-name") ||
      chapterElement?.textContent ||
      ""
    ).trim();

    const activeTab = document.querySelector(
      ".syllabus-tab.active, .syllabus-tab[aria-selected=\"true\"]"
    );
    const subject = normalizeSubject(
      row.dataset.subject ||
      row.getAttribute("data-subject") ||
      activeTab?.dataset.subject ||
      activeTab?.getAttribute("data-subject") ||
      activeTab?.textContent ||
      ""
    );

    if (!topic) return null;

    return { topicId, topic, chapter, subject };
  }

  async function getExamGoal() {
    const client = window.examSupabaseClient;
    if (!client) throw new Error("Exam Command Center is still loading. Please try again.");

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    const user = sessionData?.session?.user;
    if (!user) throw new Error("Please sign in again before starting Practice.");

    const { data, error } = await client
      .from("student_exam_preferences")
      .select("exam_type,exam_year,board,class_level,enabled,created_at")
      .eq("student_id", user.id)
      .eq("enabled", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    const goals = data || [];
    const goal = goals.find((item) => String(item.exam_type || "").toLowerCase() === "neet") || goals[0];
    if (!goal) throw new Error("Set an exam goal before starting Practice.");
    return goal;
  }

  function ensurePanel() {
    if (panel) return panel;

    const syllabusSection = $("syllabusSection");
    if (!syllabusSection) return null;

    panel = document.createElement("section");
    panel.id = "examPracticePanel";
    panel.className = "exam-practice-panel hidden";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div class="exam-practice-header">
        <div>
          <span class="exam-practice-kicker">📝 PRACTICE ARENA</span>
          <h3 id="examPracticeTitle">Topic Practice</h3>
          <p id="examPracticeContext">NEET • 5 questions</p>
        </div>
        <button type="button" id="examPracticeClose" class="exam-practice-close" aria-label="Close Practice">×</button>
      </div>
      <div id="examPracticeBody" class="exam-practice-body"></div>
    `;

    syllabusSection.appendChild(panel);
    $("examPracticeClose")?.addEventListener("click", closePractice);
    return panel;
  }

  function openPanel() {
    const target = ensurePanel();
    if (!target) return;
    target.classList.remove("hidden");
    target.setAttribute("aria-hidden", "false");
    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closePractice() {
    if (!panel) return;
    panel.classList.add("hidden");
    panel.setAttribute("aria-hidden", "true");
    state = null;
  }

  function renderLoading(context) {
    const body = $("examPracticeBody");
    if (!body) return;
    body.innerHTML = `
      <div class="exam-practice-loading">
        <div class="exam-practice-spinner" aria-hidden="true"></div>
        <strong>Building your NEET practice set…</strong>
        <span>${escapeHTML(context.topic)}</span>
        <small>Generating 5 topic-focused questions.</small>
      </div>
    `;
  }

  function renderStart(context) {
    const body = $("examPracticeBody");
    if (!body) return;
    body.innerHTML = `
      <div class="exam-practice-start">
        <div class="exam-practice-start-icon">🎯</div>
        <h4>Ready for ${escapeHTML(context.topic)}?</h4>
        <p>5 NEET-level MCQs • one question at a time • instant explanations.</p>
        <button type="button" id="examPracticeStartBtn" class="exam-practice-primary">Start Practice</button>
      </div>
    `;
    $("examPracticeStartBtn")?.addEventListener("click", () => loadQuestions(context));
  }

  async function loadQuestions(context) {
    const body = $("examPracticeBody");
    const client = window.examSupabaseClient;
    if (!body || !client) return;

    renderLoading(context);

    try {
      const goal = await getExamGoal();
      if (!context.chapter) throw new Error("Could not determine the chapter. Please refresh the syllabus and try again.");

      const { data, error } = await client.functions.invoke(PRACTICE_FUNCTION, {
        body: {
          context: {
            exam_type: String(goal.exam_type || "NEET").toUpperCase(),
            exam_year: Number(goal.exam_year) || new Date().getFullYear() + 1,
            subject: context.subject,
            chapter: context.chapter,
            topic: context.topic,
            topic_id: context.topicId,
            count: 5,
          },
        },
      });

      if (error) {
        console.error("Exam Practice Edge Function error:", error);
        let detail = "Practice AI could not generate questions. Please try again.";
        try {
          if (error.context) {
            const responseBody = await error.context.json();
            if (responseBody?.error) detail = responseBody.error;
          }
        } catch (_) {}
        throw new Error(detail);
      }

      if (!data?.success || !Array.isArray(data.questions) || !data.questions.length) {
        throw new Error(data?.error || "Practice AI returned no questions.");
      }

      state = {
        context,
        goal,
        questions: data.questions,
        index: 0,
        score: 0,
        answered: 0,
        selected: null,
      };

      renderQuestion();
    } catch (error) {
      console.error("❌ Exam Practice error:", error);
      body.innerHTML = `
        <div class="exam-practice-error">
          <span>⚠️</span>
          <strong>Practice could not start</strong>
          <p>${escapeHTML(error?.message || "Please try again.")}</p>
          <button type="button" id="examPracticeRetryBtn" class="exam-practice-secondary">Try Again</button>
        </div>
      `;
      $("examPracticeRetryBtn")?.addEventListener("click", () => renderStart(context));
    }
  }

  function renderQuestion() {
    if (!state) return;
    const body = $("examPracticeBody");
    if (!body) return;

    const question = state.questions[state.index];
    if (!question) return;

    const total = state.questions.length;
    const progress = Math.round((state.index / total) * 100);

    body.innerHTML = `
      <div class="exam-practice-progress-row">
        <span>Question ${state.index + 1} of ${total}</span>
        <strong>Score ${state.score}/${state.answered}</strong>
      </div>
      <div class="exam-practice-progress-track">
        <div class="exam-practice-progress-fill" style="width:${progress}%"></div>
      </div>
      <article class="exam-practice-question-card">
        <div class="exam-practice-question-number">Q${state.index + 1}</div>
        <div class="exam-practice-question">${renderMathText(question.question)}</div>
        <div class="exam-practice-options" role="radiogroup" aria-label="Answer options">
          ${question.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            return `
              <button type="button" class="exam-practice-option" data-option="${letter}">
                <span class="exam-practice-option-letter">${letter}</span>
                <span>${renderMathText(option)}</span>
              </button>
            `;
          }).join("")}
        </div>
        <div id="examPracticeFeedback" class="exam-practice-feedback hidden"></div>
        <button type="button" id="examPracticeNextBtn" class="exam-practice-primary hidden">${state.index === total - 1 ? "See Results" : "Next Question"} →</button>
      </article>
    `;

    body.querySelectorAll(".exam-practice-option").forEach((button) => {
      button.addEventListener("click", () => answerQuestion(button.dataset.option));
    });
    $("examPracticeNextBtn")?.addEventListener("click", nextQuestion);

    if (typeof window.examAiTypesetMath === "function") window.examAiTypesetMath(body);
  }

  function renderMathText(value) {
    return escapeHTML(value)
      .replace(/\\\\\(/g, "\\(")
      .replace(/\\\\\)/g, "\\)")
      .replace(/\\\\\[/g, "\\[")
      .replace(/\\\\\]/g, "\\]");
  }

  function answerQuestion(letter) {
    if (!state || state.selected) return;

    const question = state.questions[state.index];
    const correct = String(question.answer || "").toUpperCase() === String(letter || "").toUpperCase();
    state.selected = letter;
    state.answered += 1;
    if (correct) state.score += 1;

    document.querySelectorAll(".exam-practice-option").forEach((button) => {
      const option = button.dataset.option;
      button.disabled = true;
      if (option === String(question.answer || "").toUpperCase()) button.classList.add("correct");
      if (option === letter && !correct) button.classList.add("incorrect");
    });

    const feedback = $("examPracticeFeedback");
    if (feedback) {
      feedback.className = `exam-practice-feedback ${correct ? "correct" : "incorrect"}`;
      feedback.innerHTML = `
        <div class="exam-practice-feedback-title">${correct ? "✅ Correct!" : `❌ Incorrect — correct answer: ${escapeHTML(question.answer)}`}</div>
        <p>${renderMathText(question.explanation)}</p>
      `;
      if (typeof window.examAiTypesetMath === "function") window.examAiTypesetMath(feedback);
    }

    $("examPracticeNextBtn")?.classList.remove("hidden");
  }

  function nextQuestion() {
    if (!state || !state.selected) return;
    if (state.index >= state.questions.length - 1) {
      renderResults();
      return;
    }
    state.index += 1;
    state.selected = null;
    renderQuestion();
  }

  function renderResults() {
    if (!state) return;
    const body = $("examPracticeBody");
    if (!body) return;

    const total = state.questions.length;
    const accuracy = Math.round((state.score / total) * 100);
    let message = "Keep practicing — you are building the base.";
    if (accuracy >= 80) message = "Excellent work. Your topic understanding looks strong.";
    else if (accuracy >= 60) message = "Good progress. Review the mistakes and try again.";

    body.innerHTML = `
      <div class="exam-practice-results">
        <div class="exam-practice-results-icon">${accuracy >= 80 ? "🏆" : accuracy >= 60 ? "🔥" : "📚"}</div>
        <span class="exam-practice-results-label">PRACTICE COMPLETE</span>
        <h4>${state.score} / ${total}</h4>
        <strong>${accuracy}% Accuracy</strong>
        <p>${escapeHTML(message)}</p>
        <div class="exam-practice-result-actions">
          <button type="button" id="examPracticeAgainBtn" class="exam-practice-primary">Practice Again</button>
          <button type="button" id="examPracticeDoneBtn" class="exam-practice-secondary">Back to Topic</button>
        </div>
      </div>
    `;

    $("examPracticeAgainBtn")?.addEventListener("click", () => {
      state = null;
      const context = getContextFromPage();
      if (context) {
        renderStart(context);
      } else {
        closePractice();
      }
    });
    $("examPracticeDoneBtn")?.addEventListener("click", closePractice);
  }

  function handlePracticeClick(event) {
    const button = event.target.closest?.('[data-syllabus-action="practice"]');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const context = getContextFromPage();
    if (!context) {
      window.alert("Select a syllabus topic first.");
      return;
    }

    const target = ensurePanel();
    if (!target) {
      console.error("Exam Practice: syllabusSection was not found.");
      window.alert("Practice panel could not be opened. Please refresh the page.");
      return;
    }

    const title = $("examPracticeTitle");
    const subtitle = $("examPracticeContext");
    if (title) title.textContent = context.topic || "Topic Practice";
    if (subtitle) subtitle.textContent = `${context.subject || "Subject"} • ${context.chapter || "Chapter"} • 5 NEET-level MCQs`;

    openPanel();
    renderStart(context);
  }

  function start() {
    if (clickBound) return;
    clickBound = true;
    // Capture phase lets Practice take control before the old Exam Command Center
    // button handler displays its placeholder alert.
    document.addEventListener("click", handlePracticeClick, true);
    console.log("✅ Exam Practice UI ready.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
