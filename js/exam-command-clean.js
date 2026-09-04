/* =========================================================
   NOW-or-NEVER — EXAM COMMAND CENTER
   Clean, syntax-safe implementation.
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL = "https://kvbbgvfrllptqpbkixnv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";
  const EXAM_RESEARCH_FUNCTION = "exam-research-ts";
  const TARGET_EXAM_YEAR = new Date().getMonth() >= 6
    ? new Date().getFullYear() + 1
    : new Date().getFullYear();

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.debugSupabaseClient = db;

  let session = null;
  let user = null;
  let goals = [];
  let examDates = [];
  let syllabus = null;
  let syllabusTopics = [];
  let selectedTopic = null;
  let countdownTimer = null;
  const researchedThisSession = new Set();

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

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function typeOf(value) {
    return String(value || "").trim().toLowerCase();
  }

  function apiType(value) {
    const t = typeOf(value);
    return ({ neet: "NEET", jee_main: "JEE_MAIN", jee_advanced: "JEE_ADVANCED", board: "BOARD" })[t] || t.toUpperCase();
  }

  function labelFor(value) {
    return ({ neet: "NEET", jee_main: "JEE Main", jee_advanced: "JEE Advanced", board: "Board Examination" })[typeOf(value)] || value;
  }

  function iconFor(value) {
    return ({ neet: "🩺", jee_main: "⚡", jee_advanced: "🚀", board: "📚" })[typeOf(value)] || "🎯";
  }

  function showStatus(message, kind = "info") {
    if (!statusBanner) return;
    statusBanner.textContent = message;
    statusBanner.className = `status-banner ${kind}`;
    statusBanner.classList.remove("hidden");
  }

  function hideStatus() { statusBanner?.classList.add("hidden"); }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function loading(button, value, text) {
    if (!button) return;
    if (value) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      if (text) button.textContent = text;
    } else {
      button.disabled = false;
      if (button.dataset.originalText) button.textContent = button.dataset.originalText;
    }
  }

  function formatDate(value) {
    if (!value) return "Not officially announced";
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "Date unavailable";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  }

  function countdown(value) {
    if (!value) return null;
    const target = new Date(`${value}T23:59:59`).getTime();
    const diff = target - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
    const s = Math.floor(diff / 1000);
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
      passed: false
    };
  }

  async function loadSession() {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;
    session = data.session;
    user = session?.user || null;
    return session;
  }

  async function requireAuth() {
    await loadSession();
    if (!user) {
      if (userLabel) userLabel.textContent = "Not signed in";
      dashboard?.classList.add("hidden");
      emptyState?.classList.add("hidden");
      showStatus("Please sign in to NOW-or-NEVER before using the Exam Command Center.", "error");
      return false;
    }
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Student";
    if (userLabel) userLabel.textContent = `👤 ${name}`;
    return true;
  }

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
    const board = document.querySelector('input[name="examGoal"][value="board"]');
    boardFields?.classList.toggle("hidden", !board?.checked);
  }

  function restoreCheckboxes() {
    document.querySelectorAll('input[name="examGoal"]').forEach(input => {
      input.checked = goals.some(g => typeOf(g.exam_type) === typeOf(input.value));
    });
    const b = goals.find(g => typeOf(g.exam_type) === "board");
    if (b) {
      if (boardSelect && b.board) boardSelect.value = b.board;
      if (classSelect && b.class_level) classSelect.value = b.class_level;
    }
    syncBoardFields();
  }

  async function loadGoals() {
    if (!user) return [];
    const { data, error } = await db.from("student_exam_preferences")
      .select("id,student_id,exam_type,board,class_level,exam_year,enabled,created_at,updated_at")
      .eq("student_id", user.id)
      .eq("enabled", true)
      .order("created_at", { ascending: true });
    if (error) throw error;
    goals = data || [];
    return goals;
  }

  async function saveGoals() {
    if (!user) throw new Error("You are not signed in.");
    const selected = [...document.querySelectorAll('input[name="examGoal"]:checked')].map(x => typeOf(x.value));
    if (!selected.length) throw new Error("Select at least one exam.");

    const board = selected.includes("board") ? boardSelect?.value || null : null;
    const classLevel = selected.includes("board") ? classSelect?.value || null : null;
    const year = TARGET_EXAM_YEAR;

    const { data: existing, error: existingError } = await db.from("student_exam_preferences")
      .select("*").eq("student_id", user.id);
    if (existingError) throw existingError;

    const { error: disableError } = await db.from("student_exam_preferences")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq("student_id", user.id);
    if (disableError) throw disableError;

    for (const examType of selected) {
      const old = (existing || []).find(g => typeOf(g.exam_type) === examType && Number(g.exam_year) === year);
      const payload = {
        student_id: user.id,
        exam_type: examType,
        board: examType === "board" ? board : null,
        class_level: examType === "board" ? classLevel : null,
        exam_year: year,
        enabled: true,
        updated_at: new Date().toISOString()
      };
      const result = old
        ? await db.from("student_exam_preferences").update(payload).eq("id", old.id)
        : await db.from("student_exam_preferences").insert(payload);
      if (result.error) throw result.error;
    }

    await loadGoals();
    closeModal();
    showToast("Exam goals saved successfully.");
    await renderDashboard();
  }

  async function loadExamDates() {
    if (!goals.length) return [];
    const years = [...new Set(goals.map(g => Number(g.exam_year)))];
    const { data, error } = await db.from("exam_dates")
      .select("id,exam_type,board,class_level,exam_year,exam_name,exam_date,status,source,source_url,verified_at,confidence,notes")
      .in("exam_year", years);
    if (error) {
      console.error("Exam dates query failed:", error);
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
      return String(row.board || "").toLowerCase() === String(goal.board || "").toLowerCase()
        && String(row.class_level || "") === String(goal.class_level || "");
    }) || null;
  }

  function needsResearch(row) {
    if (!row) return true;
    if (row.status === "official") return false;
    const verified = row.verified_at ? new Date(row.verified_at) : null;
    if (!verified || Number.isNaN(verified.getTime())) return true;
    const days = (Date.now() - verified.getTime()) / 86400000;
    return row.status === "tentative" ? days >= 7 : row.status === "unavailable" ? days >= 3 : false;
  }

  async function researchExam(goal) {
    if (!session) await loadSession();
    if (!session?.access_token) throw new Error("No active Supabase session.");
    const body = {
      exam_type: apiType(goal.exam_type),
      exam_year: Number(goal.exam_year),
      board: typeOf(goal.exam_type) === "board" ? goal.board || null : null,
      class_level: typeOf(goal.exam_type) === "board" ? goal.class_level || null : null,
      force_refresh: true
    };
    console.log("Exam research request:", body);
    const { data, error } = await db.functions.invoke(EXAM_RESEARCH_FUNCTION, { body });
    if (error) throw error;
    if (!data || data.ok === false) throw new Error(data?.error || "Exam research failed.");
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
        console.error("Automatic exam research failed:", goal, error);
      }
    }
  }

  function renderExamCard(goal, row) {
    const card = document.createElement("article");
    card.className = "exam-card";
    const type = typeOf(goal.exam_type);
    const hasDate = Boolean(row?.exam_date);
    const confidence = typeof row?.confidence === "number" ? Math.round(row.confidence) : null;
    const meta = type === "board"
      ? `<span>${esc(goal.board || "")}</span><span>Class ${esc(goal.class_level || "")}</span>`
      : `<span>${esc(goal.exam_year)}</span>`;

    card.innerHTML = `
      <div class="exam-card-top"><div class="exam-icon">${iconFor(goal.exam_type)}</div><div class="exam-title">
        <span class="exam-type">${esc(labelFor(goal.exam_type))}</span>
        <h3>${esc(row?.exam_name || `${labelFor(goal.exam_type)} ${goal.exam_year}`)}</h3>
        <div class="exam-meta">${meta}</div>
      </div></div>
      <div class="exam-date-area">
        ${hasDate ? `<div class="date-label">EXAM DATE</div><div class="exam-date">${esc(formatDate(row.exam_date))}</div><div class="countdown" data-countdown-date="${esc(row.exam_date)}">Calculating…</div>` : `<div class="date-unavailable"><strong>Not officially announced</strong><span>The command center will update when a usable date is available.</span></div>`}
      </div>
      <div class="exam-card-footer">
        <div class="research-status">${row?.status === "official" ? "🟢 Official" : row?.status === "tentative" ? "🟡 Tentative" : "⚪ Unavailable"}</div>
        ${confidence !== null ? `<div class="confidence">Confidence: ${confidence}%</div>` : ""}
        ${row?.source_url ? `<a class="source-link" href="${esc(row.source_url)}" target="_blank" rel="noopener noreferrer">Source ↗</a>` : ""}
      </div>`;
    return card;
  }

  function updateCountdowns() {
    document.querySelectorAll("[data-countdown-date]").forEach(el => {
      const c = countdown(el.dataset.countdownDate);
      if (!c) { el.textContent = "Countdown unavailable"; return; }
      if (c.passed) { el.textContent = "Exam date has passed"; return; }
      el.innerHTML = `<span>${c.days}<small>days</small></span><span>${String(c.hours).padStart(2, "0")}<small>hrs</small></span><span>${String(c.minutes).padStart(2, "0")}<small>min</small></span><span>${String(c.seconds).padStart(2, "0")}<small>sec</small></span>`;
    });
  }

  function startCountdown() {
    clearInterval(countdownTimer);
    updateCountdowns();
    countdownTimer = setInterval(updateCountdowns, 1000);
  }

  async function resolveSyllabus(goal) {
    const { data, error } = await db.rpc("resolve_student_syllabus_version", {
      p_exam_type: typeOf(goal.exam_type),
      p_exam_year: Number(goal.exam_year),
      p_board: typeOf(goal.exam_type) === "board" ? goal.board || null : null,
      p_class_level: typeOf(goal.exam_type) === "board" ? goal.class_level || null : null
    });
    if (error) throw error;
    syllabus = Array.isArray(data) ? data[0] : data;
    if (!syllabus) throw new Error("No syllabus is available for this exam yet.");
    return syllabus;
  }

  async function loadSyllabus(goal) {
    if (!goal || !user) return;
    try {
      await resolveSyllabus(goal);
      const { data, error } = await db.rpc("get_student_syllabus_progress", {
        p_exam_type: typeOf(goal.exam_type),
        p_exam_year: Number(goal.exam_year),
        p_board: typeOf(goal.exam_type) === "board" ? goal.board || null : null,
        p_class_level: typeOf(goal.exam_type) === "board" ? goal.class_level || null : null
      });
      if (error) throw error;
      syllabusTopics = Array.isArray(data) ? data : [];
      renderSyllabus();
    } catch (error) {
      console.error("Syllabus load failed:", error);
      syllabusSection?.classList.add("hidden");
    }
  }

  function subjectName(value) {
    const s = typeOf(value);
    return s === "biology" ? "Biology" : s === "physics" ? "Physics" : s === "chemistry" ? "Chemistry" : String(value || "").trim();
  }

  function renderSyllabus() {
    if (!syllabusSection) return;
    syllabusSection.classList.remove("hidden");
    if (syllabusVersionName) syllabusVersionName.textContent = syllabus?.syllabus_version_name || "Syllabus";
    if (syllabusFallbackNotice) {
      const fallback = syllabus?.is_fallback && syllabus?.fallback_notice;
      syllabusFallbackNotice.textContent = fallback ? syllabus.fallback_notice : "";
      syllabusFallbackNotice.classList.toggle("hidden", !fallback);
    }

    const trackable = syllabusTopics.filter(t => ["topic", "subtopic"].includes(t.topic_type));
    const completed = trackable.filter(t => typeOf(t.progress_status) === "completed").length;
    const percent = trackable.length ? Math.round(completed * 100 / trackable.length) : 0;
    if (syllabusProgressPercent) syllabusProgressPercent.textContent = `${percent}%`;
    if (syllabusProgressCount) syllabusProgressCount.textContent = `${completed} / ${trackable.length} topics completed`;
    if (syllabusProgressFill) syllabusProgressFill.style.width = `${percent}%`;

    renderSubjectTabs();
  }

  function renderSubjectTabs() {
    if (!syllabusSubjectGrid) return;
    const subjects = [{ key: "Biology", icon: "🧬" }, { key: "Physics", icon: "⚡" }, { key: "Chemistry", icon: "🧪" }];
    syllabusSubjectGrid.innerHTML = `<div class="syllabus-tabs">${subjects.map((s, i) => {
      const count = syllabusTopics.filter(t => subjectName(t.subject) === s.key && ["topic", "subtopic"].includes(t.topic_type)).length;
      return `<button type="button" class="syllabus-tab ${i === 0 ? "active" : ""}" data-subject="${s.key}" aria-selected="${i === 0}"><span class="syllabus-tab-icon">${s.icon}</span><span class="syllabus-tab-name">${s.key}</span><span class="syllabus-tab-count">${count || "—"}</span></button>`;
    }).join("")}</div><div id="syllabusSubjectProgress" class="syllabus-selected-subject-progress"></div>`;

    const tabs = syllabusSubjectGrid.querySelectorAll(".syllabus-tab");
    tabs.forEach(tab => tab.addEventListener("click", () => {
      tabs.forEach(t => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      renderSubject(tab.dataset.subject);
    }));
    renderSubject("Biology");
  }

  function renderSubject(subject) {
    const key = subjectName(subject);
    const rows = syllabusTopics.filter(t => subjectName(t.subject) === key);
    const trackable = rows.filter(t => ["topic", "subtopic"].includes(t.topic_type));
    const done = trackable.filter(t => typeOf(t.progress_status) === "completed").length;
    const percent = trackable.length ? Math.round(done * 100 / trackable.length) : 0;
    const progress = $("syllabusSubjectProgress");
    if (progress) progress.innerHTML = `<div class="syllabus-selected-subject-header"><div><span class="syllabus-label">${esc(key)} Progress</span><strong>${percent}%</strong></div><span>${done} / ${trackable.length} completed</span></div><div class="syllabus-progress-bar"><div class="syllabus-progress-fill" style="width:${percent}%"></div></div>`;

    const chapters = rows.filter(t => t.topic_type === "chapter");
    if (!syllabusTopicContainer) return;
    if (!chapters.length) {
      syllabusTopicContainer.innerHTML = `<div class="syllabus-empty-subject"><div class="syllabus-empty-icon">📚</div><strong>No ${esc(key)} syllabus data yet</strong><span>The syllabus for this subject hasn't been added to the database yet.</span></div>`;
      return;
    }

    syllabusTopicContainer.innerHTML = `<div class="syllabus-chapter-list">${chapters.map((chapter, i) => {
      const children = rows.filter(t => String(t.parent_topic_id) === String(chapter.topic_id));
      const doneChildren = children.filter(t => typeOf(t.progress_status) === "completed").length;
      const p = children.length ? Math.round(doneChildren * 100 / children.length) : 0;
      return `<div class="syllabus-chapter ${i === 0 ? "expanded" : ""}" data-topic-id="${esc(chapter.topic_id)}"><button type="button" class="syllabus-chapter-header" data-chapter-toggle><div class="syllabus-chapter-title"><span class="syllabus-chapter-arrow">${i === 0 ? "▼" : "▶"}</span><strong>${esc(chapter.topic_name)}</strong></div><div class="syllabus-chapter-progress"><span>${doneChildren} / ${children.length}</span><strong>${p}%</strong></div></button><div class="syllabus-chapter-progress-bar"><div class="syllabus-progress-fill" style="width:${p}%"></div></div><div class="syllabus-topic-list" ${i ? 'style="display:none"' : ""}>${children.length ? children.map(t => `<div class="syllabus-topic-row" data-topic-id="${esc(t.topic_id)}" role="button" tabindex="0"><div class="syllabus-topic-main"><span class="syllabus-topic-check">${typeOf(t.progress_status) === "completed" ? "✓" : "○"}</span><span class="syllabus-topic-name">${esc(t.topic_name)}</span></div><div class="syllabus-topic-right"><span class="syllabus-topic-status status-${esc(t.progress_status)}">${typeOf(t.progress_status) === "completed" ? "✅ Completed" : typeOf(t.progress_status) === "studied" ? "📖 Studied" : "○ Not started"}</span><span class="syllabus-topic-chevron">›</span></div></div>`).join("") : `<div class="syllabus-topic-row"><span class="syllabus-topic-name">No topics added yet.</span></div>`}</div></div>`;
    }).join("")}</div>`;

    syllabusTopicContainer.querySelectorAll("[data-chapter-toggle]").forEach(button => button.addEventListener("click", () => {
      const chapter = button.closest(".syllabus-chapter");
      const list = chapter?.querySelector(".syllabus-topic-list");
      const arrow = chapter?.querySelector(".syllabus-chapter-arrow");
      if (!list || !arrow) return;
      const open = chapter.classList.toggle("expanded");
      list.style.display = open ? "block" : "none";
      arrow.textContent = open ? "▼" : "▶";
    }));

    syllabusTopicContainer.querySelectorAll(".syllabus-topic-row[data-topic-id]").forEach(row => {
      const open = () => {
        selectedTopic = syllabusTopics.find(t => String(t.topic_id) === String(row.dataset.topicId)) || null;
        syllabusTopicContainer.querySelectorAll(".syllabus-topic-row.selected").forEach(r => r.classList.remove("selected"));
        row.classList.add("selected");
        if (actionPanel && actionTopicName && selectedTopic) {
          actionTopicName.textContent = selectedTopic.topic_name || "Selected Topic";
          actionPanel.classList.remove("hidden");
          actionPanel.setAttribute("aria-hidden", "false");
        }
      };
      row.addEventListener("click", open);
      row.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  }

  async function completeSelectedTopic(button) {
    if (!selectedTopic?.topic_id) return;
    button.disabled = true;
    try {
      const { error } = await db.rpc("mark_syllabus_topic_complete", { p_topic_id: Number(selectedTopic.topic_id) });
      if (error) throw error;
      selectedTopic.progress_status = "completed";
      selectedTopic.status = "completed";
      selectedTopic.completed_at = new Date().toISOString();
      actionPanel?.classList.add("hidden");
      actionPanel?.setAttribute("aria-hidden", "true");
      selectedTopic = null;
      showToast("✓ Topic completed!");
      renderSyllabus();
    } catch (error) {
      console.error("Syllabus completion failed:", error);
      showToast("Could not save completion. Please try again.");
      button.disabled = false;
    }
  }

  function bindActionPanel() {
    actionClose?.addEventListener("click", () => {
      actionPanel?.classList.add("hidden");
      actionPanel?.setAttribute("aria-hidden", "true");
      selectedTopic = null;
    });
    actionPanel?.querySelectorAll("[data-syllabus-action]").forEach(button => {
      button.addEventListener("click", async () => {
        if (!selectedTopic) return;
        const action = button.dataset.syllabusAction;
        if (action === "learn") return alert(`Learn: ${selectedTopic.topic_name}`);
        if (action === "practice") return alert(`Practice: ${selectedTopic.topic_name}`);
        if (action === "ai") return alert(`Ask AI: ${selectedTopic.topic_name}`);
        if (action === "complete") await completeSelectedTopic(button);
      });
    });
  }

  async function renderDashboard() {
    hideStatus();
    if (goalCount) goalCount.textContent = String(goals.length);
    if (!goals.length) {
      emptyState?.classList.remove("hidden");
      dashboard?.classList.add("hidden");
      syllabusSection?.classList.add("hidden");
      if (examGrid) examGrid.innerHTML = "";
      return;
    }
    emptyState?.classList.add("hidden");
    dashboard?.classList.remove("hidden");
    examDates = await loadExamDates();
    await researchMissing();
    examDates = await loadExamDates();
    if (examGrid) {
      examGrid.innerHTML = "";
      goals.forEach(goal => examGrid.appendChild(renderExamCard(goal, findExamDate(goal))));
    }
    startCountdown();
    await loadSyllabus(goals[0]);
    bindActionPanel();
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
      showStatus(error?.message || "Unable to refresh the Exam Command Center.", "error");
    } finally {
      loading(refreshBtn, false);
    }
  }

  emptySetupBtn?.addEventListener("click", openModal);
  manageGoalsBtn?.addEventListener("click", openModal);
  closeModalBtn?.addEventListener("click", closeModal);
  cancelSetupBtn?.addEventListener("click", closeModal);
  setupModal?.addEventListener("click", e => { if (e.target.matches("[data-close-modal]")) closeModal(); });
  document.querySelectorAll('input[name="examGoal"]').forEach(input => input.addEventListener("change", syncBoardFields));
  saveGoalsBtn?.addEventListener("click", async () => {
    try { loading(saveGoalsBtn, true, "Saving…"); await saveGoals(); }
    catch (error) { console.error("Save goals failed:", error); showToast(error?.message || "Could not save exam goals."); }
    finally { loading(saveGoalsBtn, false); }
  });
  refreshBtn?.addEventListener("click", refresh);

  db.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession;
    user = nextSession?.user || null;
    if (!user) {
      goals = [];
      goalCount && (goalCount.textContent = "0");
      emptyState?.classList.add("hidden");
      dashboard?.classList.add("hidden");
      syllabusSection?.classList.add("hidden");
      if (userLabel) userLabel.textContent = "Not signed in";
    }
  });

  async function init() {
    console.log("🎯 Exam Command Center starting…");
    try {
      if (!await requireAuth()) return;
      await loadGoals();
      await renderDashboard();
      console.log("✅ Exam Command Center ready.");
    } catch (error) {
      console.error("❌ Exam Command Center failed:", error);
      showStatus(error?.message || "Unable to start the Exam Command Center.", "error");
    }
  }

  init();
})();
