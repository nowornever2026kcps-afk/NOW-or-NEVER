/* =========================================================
   NOW-or-NEVER — EXAM COMMAND CENTER
   ---------------------------------------------------------
   Responsibilities:
   - Supabase authentication/session handling
   - Exam goal setup and persistence
   - Exam-date database loading
   - Optional live exam-date research
   - Countdown rendering
   - Syllabus resolution and progress
   - Biology / Physics / Chemistry tabs
   - Chapter expand/collapse
   - Topic selection and completion
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIGURATION
     ========================================================= */

  const SUPABASE_URL = "https://kvbbgvfrllptqpbkixnv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";
  const EXAM_RESEARCH_FUNCTION = "exam-research-ts";

  // In the second half of the calendar year, the active target is next year.
  const now = new Date();
  const TARGET_EXAM_YEAR = now.getMonth() >= 6
    ? now.getFullYear() + 1
    : now.getFullYear();

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Exam Command Center: Supabase library is not loaded.");
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  // Useful from the browser console when debugging this page.
  window.debugSupabaseClient = db;

  /* =========================================================
     STATE
     ========================================================= */

  let session = null;
  let user = null;
  let goals = [];
  let examDates = [];
  let syllabus = null;
  let syllabusTopics = [];
  let selectedTopic = null;
  let activeSubject = "Biology";
  let countdownTimer = null;
  let syllabusActionBound = false;

  // Prevent repeated automatic research during one page session.
  const researchedThisSession = new Set();

  /* =========================================================
     DOM HELPERS
     ========================================================= */

  const $ = id => document.getElementById(id);

  const userLabel = $("userLabel");
  const refreshBtn = $("refreshBtn");
  const goalCount = $("goalCount");
  const emptyState = $("emptyState");
  const emptySetupBtn = $("emptySetupBtn");
  const dashboard = $("dashboardSection");
  const manageGoalsBtn = $("manageGoalsBtn");
  const examGrid = $("examGrid");
  const statusBanner = $("statusBanner");
  const setupModal = $("setupModal");
  const closeModalBtn = $("closeModalBtn");
  const cancelSetupBtn = $("cancelSetupBtn");
  const saveGoalsBtn = $("saveGoalsBtn");
  const boardFields = $("boardFields");
  const boardSelect = $("boardSelect");
  const classSelect = $("classSelect");
  const toast = $("toast");
  const syllabusSection = $("syllabusSection");
  const syllabusVersionName = $("syllabusVersionName");
  const syllabusFallbackNotice = $("syllabusFallbackNotice");
  const syllabusProgressPercent = $("syllabusProgressPercent");
  const syllabusProgressCount = $("syllabusProgressCount");
  const syllabusProgressFill = $("syllabusProgressFill");
  const syllabusSubjectGrid = $("syllabusSubjectGrid");
  const syllabusTopicContainer = $("syllabusTopicContainer");
  const actionPanel = $("syllabusTopicActionPanel");
  const actionTopicName = $("syllabusActionTopicName");
  const actionClose = $("syllabusActionClose");

  /* =========================================================
     GENERIC HELPERS
     ========================================================= */

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function typeOf(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  function apiType(value) {
    const type = typeOf(value);
    const map = {
      neet: "NEET",
      jee_main: "JEE_MAIN",
      jee_advanced: "JEE_ADVANCED",
      board: "BOARD"
    };
    return map[type] || type.toUpperCase();
  }

  function labelFor(value) {
    const map = {
      neet: "NEET",
      jee_main: "JEE Main",
      jee_advanced: "JEE Advanced",
      board: "Board Examination"
    };
    return map[typeOf(value)] || String(value || "Exam");
  }

  function iconFor(value) {
    const map = {
      neet: "🩺",
      jee_main: "⚡",
      jee_advanced: "🚀",
      board: "📚"
    };
    return map[typeOf(value)] || "🎯";
  }

  function showStatus(message, kind = "info") {
    if (!statusBanner) return;
    statusBanner.textContent = message;
    statusBanner.className = `status-banner ${kind}`;
    statusBanner.classList.remove("hidden");
  }

  function hideStatus() {
    statusBanner?.classList.add("hidden");
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  function loading(button, busy, text) {
    if (!button) return;

    if (busy) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
      }
      button.disabled = true;
      if (text) button.textContent = text;
      return;
    }

    button.disabled = false;
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  function formatDate(value) {
    if (!value) return "Not officially announced";

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function getCountdown(value) {
    if (!value) return null;

    const target = new Date(`${value}T23:59:59`).getTime();
    if (Number.isNaN(target)) return null;

    const diff = target - Date.now();
    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        passed: true
      };
    }

    const seconds = Math.floor(diff / 1000);

    return {
      days: Math.floor(seconds / 86400),
      hours: Math.floor((seconds % 86400) / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: seconds % 60,
      passed: false
    };
  }

  /* =========================================================
     AUTHENTICATION
     ========================================================= */

  async function loadSession() {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    session = data?.session || null;
    user = session?.user || null;
    return session;
  }

  async function requireAuth() {
    await loadSession();

    if (!user) {
      if (userLabel) userLabel.textContent = "Not signed in";
      dashboard?.classList.add("hidden");
      emptyState?.classList.add("hidden");
      syllabusSection?.classList.add("hidden");
      showStatus(
        "Please sign in to NOW-or-NEVER before using the Exam Command Center.",
        "error"
      );
      return false;
    }

    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Student";

    if (userLabel) userLabel.textContent = `👤 ${name}`;
    return true;
  }

  /* =========================================================
     EXAM GOAL MODAL
     ========================================================= */

  function openModal() {
    if (!setupModal) return;

    restoreCheckboxes();
    setupModal.classList.remove("hidden");
    setupModal.setAttribute("aria-hidden", "false");
    syncBoardFields();
  }

  function closeModal() {
    if (!setupModal) return;

    setupModal.classList.add("hidden");
    setupModal.setAttribute("aria-hidden", "true");
  }

  function syncBoardFields() {
    const boardInput = document.querySelector(
      'input[name="examGoal"][value="board"]'
    );

    boardFields?.classList.toggle("hidden", !boardInput?.checked);
  }

  function restoreCheckboxes() {
    document.querySelectorAll('input[name="examGoal"]').forEach(input => {
      input.checked = goals.some(
        goal => typeOf(goal.exam_type) === typeOf(input.value)
      );
    });

    const boardGoal = goals.find(
      goal => typeOf(goal.exam_type) === "board"
    );

    if (boardGoal) {
      if (boardSelect && boardGoal.board) {
        boardSelect.value = boardGoal.board;
      }
      if (classSelect && boardGoal.class_level) {
        classSelect.value = boardGoal.class_level;
      }
    }

    syncBoardFields();
  }

  async function loadGoals() {
    if (!user) return [];

    const { data, error } = await db
      .from("student_exam_preferences")
      .select(
        "id,student_id,exam_type,board,class_level,exam_year,enabled,created_at,updated_at"
      )
      .eq("student_id", user.id)
      .eq("enabled", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    goals = data || [];
    return goals;
  }

  async function saveGoals() {
    if (!user) throw new Error("You are not signed in.");

    const selected = [
      ...document.querySelectorAll('input[name="examGoal"]:checked')
    ].map(input => typeOf(input.value));

    if (!selected.length) {
      throw new Error("Select at least one exam.");
    }

    if (selected.includes("board")) {
      if (!boardSelect?.value) {
        throw new Error("Please choose your board.");
      }
      if (!classSelect?.value) {
        throw new Error("Please choose your class.");
      }
    }

    const board = selected.includes("board")
      ? boardSelect?.value || null
      : null;

    const classLevel = selected.includes("board")
      ? classSelect?.value || null
      : null;

    const year = TARGET_EXAM_YEAR;
    const timestamp = new Date().toISOString();

    const { data: existing, error: existingError } = await db
      .from("student_exam_preferences")
      .select("*")
      .eq("student_id", user.id);

    if (existingError) throw existingError;

    // Disable the previous active set first. Existing rows are reused when
    // possible so historical preference records are not unnecessarily cloned.
    const { error: disableError } = await db
      .from("student_exam_preferences")
      .update({
        enabled: false,
        updated_at: timestamp
      })
      .eq("student_id", user.id)
      .eq("enabled", true);

    if (disableError) throw disableError;

    try {
      for (const examType of selected) {
        const old = (existing || []).find(goal =>
          typeOf(goal.exam_type) === examType &&
          Number(goal.exam_year) === year
        );

        const payload = {
          student_id: user.id,
          exam_type: examType,
          board: examType === "board" ? board : null,
          class_level: examType === "board" ? classLevel : null,
          exam_year: year,
          enabled: true,
          updated_at: timestamp
        };

        const result = old
          ? await db
              .from("student_exam_preferences")
              .update(payload)
              .eq("id", old.id)
          : await db
              .from("student_exam_preferences")
              .insert(payload);

        if (result.error) throw result.error;
      }
    } catch (error) {
      // Do not silently leave the user with no active goals if a later insert
      // fails. Restore the previous active set where possible.
      const previousActive = (existing || []).filter(goal => goal.enabled === true);

      for (const previous of previousActive) {
        await db
          .from("student_exam_preferences")
          .update({
            enabled: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", previous.id);
      }

      throw error;
    }

    await loadGoals();
    closeModal();
    showToast("Exam goals saved successfully.");
    await renderDashboard();
  }

  /* =========================================================
     EXAM DATE DATABASE / RESEARCH
     ========================================================= */

  async function loadExamDates() {
    if (!goals.length) {
      examDates = [];
      return [];
    }

    const years = [
      ...new Set(goals.map(goal => Number(goal.exam_year)))
    ];

    const { data, error } = await db
      .from("exam_dates")
      .select(
        "id,exam_type,board,class_level,exam_year,exam_name,exam_date,status,source,source_url,verified_at,confidence,notes"
      )
      .in("exam_year", years);

    if (error) {
      console.error("Exam dates query failed:", error);
      examDates = [];
      return [];
    }

    examDates = data || [];
    return examDates;
  }

  function findExamDate(goal) {
    return examDates.find(row => {
      if (typeOf(row.exam_type) !== typeOf(goal.exam_type)) return false;
      if (Number(row.exam_year) !== Number(goal.exam_year)) return false;

      if (typeOf(goal.exam_type) !== "board") return true;

      return (
        String(row.board || "").toLowerCase() ===
          String(goal.board || "").toLowerCase() &&
        String(row.class_level || "") === String(goal.class_level || "")
      );
    }) || null;
  }

  function needsResearch(row) {
    if (!row) return true;
    if (typeOf(row.status) === "official") return false;

    const verified = row.verified_at
      ? new Date(row.verified_at)
      : null;

    if (!verified || Number.isNaN(verified.getTime())) return true;

    const ageDays = (Date.now() - verified.getTime()) / 86400000;

    if (typeOf(row.status) === "tentative") return ageDays >= 7;
    if (typeOf(row.status) === "unavailable") return ageDays >= 3;

    return false;
  }

  async function researchExam(goal) {
    if (!session) await loadSession();

    if (!session?.access_token) {
      throw new Error("No active Supabase session.");
    }

    const body = {
      exam_type: apiType(goal.exam_type),
      exam_year: Number(goal.exam_year),
      board: typeOf(goal.exam_type) === "board"
        ? goal.board || null
        : null,
      class_level: typeOf(goal.exam_type) === "board"
        ? goal.class_level || null
        : null,
      force_refresh: true
    };

    console.log("Exam research request:", body);

    const { data, error } = await db.functions.invoke(
      EXAM_RESEARCH_FUNCTION,
      { body }
    );

    if (error) throw error;

    if (!data || data.ok === false) {
      throw new Error(data?.error || "Exam research failed.");
    }

    return data;
  }

  async function researchMissing() {
    for (const goal of goals) {
      const row = findExamDate(goal);

      if (!needsResearch(row)) continue;

      const key = typeOf(goal.exam_type) === "board"
        ? `board|${goal.board || ""}|${goal.class_level || ""}|${goal.exam_year}`
        : `${typeOf(goal.exam_type)}|${goal.exam_year}`;

      if (researchedThisSession.has(key)) continue;
      researchedThisSession.add(key);

      try {
        await researchExam(goal);
      } catch (error) {
        // Research failure must not destroy the dashboard. The database result
        // that we already have remains visible to the student.
        console.error("Automatic exam research failed:", goal, error);
      }
    }
  }

  /* =========================================================
     EXAM CARDS / COUNTDOWN
     ========================================================= */

  function renderExamCard(goal, row) {
    const card = document.createElement("article");
    card.className = "exam-card";

    const type = typeOf(goal.exam_type);
    const hasDate = Boolean(row?.exam_date);
    const confidence = typeof row?.confidence === "number"
      ? Math.round(row.confidence)
      : null;

    const meta = type === "board"
      ? `<span>${esc(goal.board || "")}</span><span>Class ${esc(goal.class_level || "")}</span>`
      : `<span>${esc(goal.exam_year)}</span>`;

    const status = typeOf(row?.status) === "official"
      ? "🟢 Official"
      : typeOf(row?.status) === "tentative"
        ? "🟡 Tentative"
        : "⚪ Unavailable";

    card.innerHTML = `
      <div class="exam-card-top">
        <div class="exam-icon">${iconFor(goal.exam_type)}</div>
        <div class="exam-title">
          <span class="exam-type">${esc(labelFor(goal.exam_type))}</span>
          <h3>${esc(row?.exam_name || `${labelFor(goal.exam_type)} ${goal.exam_year}`)}</h3>
          <div class="exam-meta">${meta}</div>
        </div>
      </div>

      <div class="exam-date-area">
        ${hasDate
          ? `
            <div class="date-label">EXAM DATE</div>
            <div class="exam-date">${esc(formatDate(row.exam_date))}</div>
            <div class="countdown" data-countdown-date="${esc(row.exam_date)}">Calculating…</div>
          `
          : `
            <div class="date-unavailable">
              <strong>Not officially announced</strong>
              <span>The command center will update when a usable date is available.</span>
            </div>
          `}
      </div>

      <div class="exam-card-footer">
        <div class="research-status">${status}</div>
        ${confidence !== null ? `<div class="confidence">Confidence: ${confidence}%</div>` : ""}
        ${row?.source_url
          ? `<a class="source-link" href="${esc(row.source_url)}" target="_blank" rel="noopener noreferrer">Source ↗</a>`
          : ""}
      </div>
    `;

    return card;
  }

  function updateCountdowns() {
    document.querySelectorAll("[data-countdown-date]").forEach(element => {
      const countdown = getCountdown(element.dataset.countdownDate);

      if (!countdown) {
        element.textContent = "Countdown unavailable";
        return;
      }

      if (countdown.passed) {
        element.textContent = "Exam date has passed";
        return;
      }

      element.innerHTML = `
        <span>${countdown.days}<small>days</small></span>
        <span>${String(countdown.hours).padStart(2, "0")}<small>hrs</small></span>
        <span>${String(countdown.minutes).padStart(2, "0")}<small>min</small></span>
        <span>${String(countdown.seconds).padStart(2, "0")}<small>sec</small></span>
      `;
    });
  }

  function startCountdown() {
    clearInterval(countdownTimer);
    updateCountdowns();
    countdownTimer = setInterval(updateCountdowns, 1000);
  }

  /* =========================================================
     SYLLABUS
     ========================================================= */

  async function resolveSyllabus(goal) {
    const { data, error } = await db.rpc(
      "resolve_student_syllabus_version",
      {
        p_exam_type: typeOf(goal.exam_type),
        p_exam_year: Number(goal.exam_year),
        p_board: typeOf(goal.exam_type) === "board"
          ? goal.board || null
          : null,
        p_class_level: typeOf(goal.exam_type) === "board"
          ? goal.class_level || null
          : null
      }
    );

    if (error) throw error;

    syllabus = Array.isArray(data) ? data[0] : data;

    if (!syllabus) {
      throw new Error("No syllabus is available for this exam yet.");
    }

    return syllabus;
  }

  async function loadSyllabus(goal) {
    if (!goal || !user) return;

    try {
      await resolveSyllabus(goal);

      const { data, error } = await db.rpc(
        "get_student_syllabus_progress",
        {
          p_exam_type: typeOf(goal.exam_type),
          p_exam_year: Number(goal.exam_year),
          p_board: typeOf(goal.exam_type) === "board"
            ? goal.board || null
            : null,
          p_class_level: typeOf(goal.exam_type) === "board"
            ? goal.class_level || null
            : null
        }
      );

      if (error) throw error;

      syllabusTopics = Array.isArray(data) ? data : [];
      selectedTopic = null;
      activeSubject = "Biology";
      renderSyllabus();
    } catch (error) {
      console.error("Syllabus load failed:", error);
      syllabus = null;
      syllabusTopics = [];
      selectedTopic = null;
      syllabusSection?.classList.add("hidden");
    }
  }

  function subjectName(value) {
    const subject = typeOf(value);

    if (subject === "biology") return "Biology";
    if (subject === "physics") return "Physics";
    if (subject === "chemistry") return "Chemistry";

    return String(value || "").trim();
  }

  function isTrackableTopic(topic) {
    return ["topic", "subtopic"].includes(typeOf(topic?.topic_type));
  }

  function isCompleted(topic) {
    return typeOf(topic?.progress_status || topic?.status) === "completed";
  }

  function renderSyllabus() {
    if (!syllabusSection) return;

    syllabusSection.classList.remove("hidden");

    if (syllabusVersionName) {
      syllabusVersionName.textContent =
        syllabus?.syllabus_version_name || "Syllabus";
    }

    if (syllabusFallbackNotice) {
      const fallback = Boolean(
        syllabus?.is_fallback && syllabus?.fallback_notice
      );

      syllabusFallbackNotice.textContent = fallback
        ? syllabus.fallback_notice
        : "";

      syllabusFallbackNotice.classList.toggle("hidden", !fallback);
    }

    const trackable = syllabusTopics.filter(isTrackableTopic);
    const completed = trackable.filter(isCompleted).length;
    const percent = trackable.length
      ? Math.round((completed * 100) / trackable.length)
      : 0;

    if (syllabusProgressPercent) {
      syllabusProgressPercent.textContent = `${percent}%`;
    }

    if (syllabusProgressCount) {
      syllabusProgressCount.textContent =
        `${completed} / ${trackable.length} topics completed`;
    }

    if (syllabusProgressFill) {
      syllabusProgressFill.style.width = `${percent}%`;
    }

    renderSubjectTabs();
  }

  function renderSubjectTabs() {
    if (!syllabusSubjectGrid) return;

    const subjects = [
      { key: "Biology", icon: "🧬" },
      { key: "Physics", icon: "⚡" },
      { key: "Chemistry", icon: "🧪" }
    ];

    syllabusSubjectGrid.innerHTML = `
      <div class="syllabus-tabs">
        ${subjects.map(subject => {
          const count = syllabusTopics.filter(topic =>
            subjectName(topic.subject) === subject.key &&
            isTrackableTopic(topic)
          ).length;

          const active = subject.key === activeSubject;

          return `
            <button
              type="button"
              class="syllabus-tab ${active ? "active" : ""}"
              data-subject="${esc(subject.key)}"
              aria-selected="${active}"
            >
              <span class="syllabus-tab-icon">${subject.icon}</span>
              <span class="syllabus-tab-name">${esc(subject.key)}</span>
              <span class="syllabus-tab-count">${count || "—"}</span>
            </button>
          `;
        }).join("")}
      </div>
      <div id="syllabusSubjectProgress" class="syllabus-selected-subject-progress"></div>
    `;

    syllabusSubjectGrid.querySelectorAll(".syllabus-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        activeSubject = tab.dataset.subject || "Biology";

        syllabusSubjectGrid.querySelectorAll(".syllabus-tab").forEach(item => {
          const active = item === tab;
          item.classList.toggle("active", active);
          item.setAttribute("aria-selected", String(active));
        });

        closeActionPanel();
        renderSubject(activeSubject);
      });
    });

    renderSubject(activeSubject);
  }

  function renderSubject(subject) {
    const key = subjectName(subject);
    const rows = syllabusTopics.filter(topic =>
      subjectName(topic.subject) === key
    );

    const trackable = rows.filter(isTrackableTopic);
    const completed = trackable.filter(isCompleted).length;
    const percent = trackable.length
      ? Math.round((completed * 100) / trackable.length)
      : 0;

    const progress = $("syllabusSubjectProgress");

    if (progress) {
      progress.innerHTML = `
        <div class="syllabus-selected-subject-header">
          <div>
            <span class="syllabus-label">${esc(key)} Progress</span>
            <strong>${percent}%</strong>
          </div>
          <span>${completed} / ${trackable.length} completed</span>
        </div>
        <div class="syllabus-progress-bar">
          <div class="syllabus-progress-fill" style="width:${percent}%"></div>
        </div>
      `;
    }

    if (!syllabusTopicContainer) return;

    const chapters = rows.filter(topic =>
      typeOf(topic.topic_type) === "chapter"
    );

    if (!chapters.length) {
      syllabusTopicContainer.innerHTML = `
        <div class="syllabus-empty-subject">
          <div class="syllabus-empty-icon">📚</div>
          <strong>No ${esc(key)} syllabus data yet</strong>
          <span>The syllabus for this subject hasn't been added to the database yet.</span>
        </div>
      `;
      return;
    }

    syllabusTopicContainer.innerHTML = `
      <div class="syllabus-chapter-list">
        ${chapters.map((chapter, index) => {
          const children = rows.filter(topic =>
            String(topic.parent_topic_id) === String(chapter.topic_id)
          );

          const completedChildren = children.filter(isCompleted).length;
          const chapterPercent = children.length
            ? Math.round((completedChildren * 100) / children.length)
            : 0;

          const expanded = index === 0;

          return `
            <div
              class="syllabus-chapter ${expanded ? "expanded" : ""}"
              data-topic-id="${esc(chapter.topic_id)}"
            >
              <button
                type="button"
                class="syllabus-chapter-header"
                data-chapter-toggle
              >
                <div class="syllabus-chapter-title">
                  <span class="syllabus-chapter-arrow">${expanded ? "▼" : "▶"}</span>
                  <strong>${esc(chapter.topic_name)}</strong>
                </div>
                <div class="syllabus-chapter-progress">
                  <span>${completedChildren} / ${children.length}</span>
                  <strong>${chapterPercent}%</strong>
                </div>
              </button>

              <div class="syllabus-chapter-progress-bar">
                <div class="syllabus-progress-fill" style="width:${chapterPercent}%"></div>
              </div>

              <div class="syllabus-topic-list" ${expanded ? "" : 'style="display:none"'}>
                ${children.length
                  ? children.map(topic => {
                      const completed = isCompleted(topic);
                      const studied = typeOf(topic.progress_status) === "studied";

                      return `
                        <div
                          class="syllabus-topic-row"
                          data-topic-id="${esc(topic.topic_id)}"
                          role="button"
                          tabindex="0"
                        >
                          <div class="syllabus-topic-main">
                            <span class="syllabus-topic-check">${completed ? "✓" : "○"}</span>
                            <span class="syllabus-topic-name">${esc(topic.topic_name)}</span>
                          </div>
                          <div class="syllabus-topic-right">
                            <span class="syllabus-topic-status status-${esc(topic.progress_status || "not_started")}">
                              ${completed ? "✅ Completed" : studied ? "📖 Studied" : "○ Not started"}
                            </span>
                            <span class="syllabus-topic-chevron">›</span>
                          </div>
                        </div>
                      `;
                    }).join("")
                  : `
                    <div class="syllabus-topic-row">
                      <span class="syllabus-topic-name">No topics added yet.</span>
                    </div>
                  `}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    bindRenderedSyllabusEvents();
  }

  function bindRenderedSyllabusEvents() {
    if (!syllabusTopicContainer) return;

    syllabusTopicContainer
      .querySelectorAll("[data-chapter-toggle]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const chapter = button.closest(".syllabus-chapter");
          const list = chapter?.querySelector(".syllabus-topic-list");
          const arrow = chapter?.querySelector(".syllabus-chapter-arrow");

          if (!chapter || !list || !arrow) return;

          const open = chapter.classList.toggle("expanded");
          list.style.display = open ? "block" : "none";
          arrow.textContent = open ? "▼" : "▶";
        });
      });

    syllabusTopicContainer
      .querySelectorAll(".syllabus-topic-row[data-topic-id]")
      .forEach(row => {
        const select = () => {
          const topicId = row.dataset.topicId;
          selectedTopic = syllabusTopics.find(topic =>
            String(topic.topic_id) === String(topicId)
          ) || null;

          syllabusTopicContainer
            .querySelectorAll(".syllabus-topic-row.selected")
            .forEach(item => item.classList.remove("selected"));

          row.classList.add("selected");
          openActionPanel();
        };

        row.addEventListener("click", select);
        row.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            select();
          }
        });
      });
  }

  /* =========================================================
     TOPIC ACTION PANEL
     ========================================================= */

  function openActionPanel() {
    if (!selectedTopic || !actionPanel) return;

    if (actionTopicName) {
      actionTopicName.textContent = selectedTopic.topic_name || "Selected Topic";
    }

    actionPanel.classList.remove("hidden");
    actionPanel.setAttribute("aria-hidden", "false");
  }

  function closeActionPanel() {
    actionPanel?.classList.add("hidden");
    actionPanel?.setAttribute("aria-hidden", "true");
    selectedTopic = null;

    syllabusTopicContainer
      ?.querySelectorAll(".syllabus-topic-row.selected")
      .forEach(row => row.classList.remove("selected"));
  }

  async function completeSelectedTopic(button) {
    if (!selectedTopic?.topic_id) return;

    loading(button, true, "Saving…");

    try {
      const topicId = Number(selectedTopic.topic_id);

      if (!Number.isFinite(topicId)) {
        throw new Error("Invalid syllabus topic ID.");
      }

      const { error } = await db.rpc("mark_syllabus_topic_complete", {
        p_topic_id: topicId
      });

      if (error) throw error;

      const localTopic = syllabusTopics.find(topic =>
        String(topic.topic_id) === String(selectedTopic.topic_id)
      );

      if (localTopic) {
        localTopic.progress_status = "completed";
        localTopic.status = "completed";
        localTopic.completed_at = new Date().toISOString();
      }

      showToast("✓ Topic completed!");
      closeActionPanel();
      renderSyllabus();
    } catch (error) {
      console.error("Syllabus completion failed:", error);
      showToast(error?.message || "Could not save completion. Please try again.");
    } finally {
      loading(button, false);
    }
  }

  function bindActionPanel() {
    if (syllabusActionBound) return;
    syllabusActionBound = true;

    actionClose?.addEventListener("click", closeActionPanel);

    actionPanel?.querySelectorAll("[data-syllabus-action]").forEach(button => {
      button.addEventListener("click", async () => {
        if (!selectedTopic) return;

        const action = button.dataset.syllabusAction;
        const topicName = selectedTopic.topic_name || "this topic";

        if (action === "learn") {
          alert(`Learn: ${topicName}`);
          return;
        }

        if (action === "practice") {
          alert(`Practice: ${topicName}`);
          return;
        }

        if (action === "ai") {
          alert(`Ask AI: ${topicName}`);
          return;
        }

        if (action === "complete") {
          await completeSelectedTopic(button);
        }
      });
    });
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  async function renderDashboard() {
    hideStatus();

    if (goalCount) {
      goalCount.textContent = String(goals.length);
    }

    if (!goals.length) {
      emptyState?.classList.remove("hidden");
      dashboard?.classList.add("hidden");
      syllabusSection?.classList.add("hidden");
      examGrid && (examGrid.innerHTML = "");
      clearInterval(countdownTimer);
      return;
    }

    emptyState?.classList.add("hidden");
    dashboard?.classList.remove("hidden");

    // Always display the database state first.
    await loadExamDates();

    // Then attempt live research only where the database entry needs it.
    await researchMissing();

    // Reload because successful research may have updated exam_dates.
    await loadExamDates();

    if (examGrid) {
      examGrid.innerHTML = "";

      goals.forEach(goal => {
        examGrid.appendChild(
          renderExamCard(goal, findExamDate(goal))
        );
      });
    }

    startCountdown();

    // Keep the first active goal as the syllabus source, matching the current
    // database/RPC design used by the command center.
    await loadSyllabus(goals[0]);
  }

  async function refresh() {
    try {
      loading(refreshBtn, true, "↻");
      showStatus("Checking your exam timeline…", "info");

      if (!await requireAuth()) return;

      await loadGoals();
      await renderDashboard();

      showStatus("Exam Command Center updated.", "success");
      setTimeout(hideStatus, 3500);
    } catch (error) {
      console.error("Refresh failed:", error);
      showStatus(
        error?.message || "Unable to refresh the Exam Command Center.",
        "error"
      );
    } finally {
      loading(refreshBtn, false);
    }
  }

  /* =========================================================
     EVENT BINDINGS
     ========================================================= */

  emptySetupBtn?.addEventListener("click", openModal);
  manageGoalsBtn?.addEventListener("click", openModal);
  closeModalBtn?.addEventListener("click", closeModal);
  cancelSetupBtn?.addEventListener("click", closeModal);

  setupModal?.addEventListener("click", event => {
    if (event.target.matches("[data-close-modal]")) {
      closeModal();
    }
  });

  document.querySelectorAll('input[name="examGoal"]').forEach(input => {
    input.addEventListener("change", syncBoardFields);
  });

  saveGoalsBtn?.addEventListener("click", async () => {
    try {
      loading(saveGoalsBtn, true, "Saving…");
      await saveGoals();
    } catch (error) {
      console.error("Save goals failed:", error);
      showToast(error?.message || "Could not save exam goals.");
    } finally {
      loading(saveGoalsBtn, false);
    }
  });

  refreshBtn?.addEventListener("click", refresh);

  // Escape closes the modal/panel without affecting saved data.
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    if (setupModal && !setupModal.classList.contains("hidden")) {
      closeModal();
      return;
    }

    if (actionPanel && !actionPanel.classList.contains("hidden")) {
      closeActionPanel();
    }
  });

  /* =========================================================
     AUTH STATE CHANGES
     ========================================================= */

  db.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession || null;
    user = session?.user || null;

    if (!user) {
      goals = [];
      examDates = [];
      syllabus = null;
      syllabusTopics = [];
      selectedTopic = null;

      clearInterval(countdownTimer);

      if (goalCount) goalCount.textContent = "0";
      emptyState?.classList.add("hidden");
      dashboard?.classList.add("hidden");
      syllabusSection?.classList.add("hidden");

      if (userLabel) userLabel.textContent = "Not signed in";
    }
  });

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  async function init() {
    console.log("🎯 Exam Command Center starting…");

    bindActionPanel();

    try {
      if (!await requireAuth()) return;

      await loadGoals();
      await renderDashboard();

      console.log("✅ Exam Command Center ready.");
    } catch (error) {
      console.error("❌ Exam Command Center failed:", error);
      showStatus(
        error?.message || "Unable to start the Exam Command Center.",
        "error"
      );
    }
  }

  init();
})();
