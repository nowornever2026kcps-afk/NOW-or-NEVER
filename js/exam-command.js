/* =========================================================
   NOW-or-NEVER — EXAM COMMAND CENTER
   Restored feature-rich implementation.
   Syntax-safe single-scope implementation.
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL = "https://kvbbgvfrllptqpbkixnv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";
  const EXAM_RESEARCH_FUNCTION = "exam-research-ts";
  const EXAM_AI_FUNCTION = "exam-ai";
  const TARGET_EXAM_YEAR = new Date().getMonth() >= 6 ? new Date().getFullYear() + 1 : new Date().getFullYear();

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  window.examSupabaseClient = supabaseClient;
  window.debugSupabaseClient = supabaseClient;

  let currentSession = null;
  let currentUser = null;
  let currentGoals = [];
  let examDates = [];
  let countdownTimer = null;
  let currentSyllabus = null;
  let currentSyllabusTopics = [];
  let currentAllowedSyllabusSubjects = [];
  let selectedSyllabusTopic = null;
  const autoResearchAttempted = new Set();

  const $ = id => document.getElementById(id);
  const userLabel = $("userLabel");
  const refreshBtn = $("refreshBtn");
  const goalCount = $("goalCount");
  const emptyState = $("emptyState");
  const emptySetupBtn = $("emptySetupBtn");
  const dashboardSection = $("dashboardSection");
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
  const syllabusActionPanel = $("syllabusTopicActionPanel");
  const syllabusActionTopicName = $("syllabusActionTopicName");
  const syllabusActionClose = $("syllabusActionClose");

  const examAiPanel = $("examAiPanel");
  const examAiTopicName = $("examAiTopicName");
  const examAiContext = $("examAiContext");
  const examAiMessages = $("examAiMessages");
  const examAiInput = $("examAiInput");
  const examAiSend = $("examAiSend");
  const examAiClose = $("examAiClose");
  const examAiHint = $("examAiHint");

  function escapeHTML(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function renderExamAiMarkdown(value) {
    let text = String(value ?? "").replace(/\r\n?/g, "\n").trim();
    if (!text) return "";
    const codeBlocks = [];
    text = text.replace(/```(?:[a-zA-Z0-9_+-]+)?\n?([\s\S]*?)```/g, (_, code) => {
      const index = codeBlocks.push(`<pre class="exam-ai-code"><code>${escapeHTML(code.trimEnd())}</code></pre>`) - 1;
      return `@@EXAM_AI_CODE_${index}@@`;
    });
    let html = escapeHTML(text);
    html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
    html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
    html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^##\s+(.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^#\s+(.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(?:<li>[\s\S]*?<\/li>)(?:\n(?:<li>[\s\S]*?<\/li>))+/g, match => `<ul>${match.replace(/\n/g, "")}</ul>`);
    html = html.replace(/^\s*\d+[.)]\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(?:<li>[\s\S]*?<\/li>)(?:\n(?:<li>[\s\S]*?<\/li>))+/g, match => `<ol>${match.replace(/\n/g, "")}</ol>`);
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
    html = html.replace(/`([^`\n]+)`/g, "<code class=\"exam-ai-inline-code\">$1</code>");
    html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    html = html.replace(/_([^_\n]+)_/g, "<em>$1</em>");
    html = html.replace(/\n{2,}/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");
    html = `<div class="exam-ai-markdown"><p>${html}</p></div>`;
    html = html.replace(/<p>\s*(<h[3-6]>)/g, "$1").replace(/(<\/h[3-6]>)\s*<\/p>/g, "$1");
    html = html.replace(/<p>\s*(<ul>|<ol>)/g, "$1").replace(/(<\/ul>|<\/ol>)\s*<\/p>/g, "$1");
    codeBlocks.forEach((block, index) => { html = html.replace(`@@EXAM_AI_CODE_${index}@@`, block); });
    return html;
  }

  function ensureExamAiMarkdownStyles() {
    if (document.getElementById("examAiMarkdownStyles")) return;
    const style = document.createElement("style");
    style.id = "examAiMarkdownStyles";
    style.textContent = `
      .exam-ai-markdown { line-height: 1.65; }
      .exam-ai-markdown p { margin: 0 0 10px; }
      .exam-ai-markdown p:last-child { margin-bottom: 0; }
      .exam-ai-markdown h3,.exam-ai-markdown h4,.exam-ai-markdown h5,.exam-ai-markdown h6 { margin: 12px 0 7px; color: var(--text); line-height: 1.3; }
      .exam-ai-markdown h3 { font-size: .98rem; }.exam-ai-markdown h4 { font-size: .9rem; }
      .exam-ai-markdown ul,.exam-ai-markdown ol { margin: 7px 0 11px 20px; padding: 0; }
      .exam-ai-markdown li { margin: 4px 0; padding-left: 2px; }
      .exam-ai-markdown strong { color: #fff; font-weight: 800; }.exam-ai-markdown em { color: #ddd5ff; }
      .exam-ai-inline-code { padding: 2px 5px; border-radius: 5px; background: rgba(169,140,255,.11); color: #d8ccff; font-family: ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size: .9em; }
      .exam-ai-code { margin: 10px 0; padding: 11px 12px; overflow-x: auto; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; background: rgba(0,0,0,.25); }
      .exam-ai-code code { color: #e9e5ff; font-family: ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size: .78rem; white-space: pre; }
    `;
    document.head.appendChild(style);
  }

  function normalizeExamType(value) { return String(value || "").trim().toLowerCase(); }
  function apiExamType(value) {
    const type = normalizeExamType(value);
    return ({ neet: "NEET", jee_main: "JEE_MAIN", jee_advanced: "JEE_ADVANCED", board: "BOARD" })[type] || type.toUpperCase();
  }
  function getExamLabel(value) {
    const type = normalizeExamType(value);
    return ({ neet: "NEET", jee_main: "JEE Main", jee_advanced: "JEE Advanced", board: "Board Examination" })[type] || value || "Exam";
  }
  function getExamIcon(value) {
    const type = normalizeExamType(value);
    return ({ neet: "🩺", jee_main: "⚡", jee_advanced: "🚀", board: "📚" })[type] || "🎯";
  }
  function formatDate(value) {
    if (!value) return "Not officially announced";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  }
  function calculateCountdown(value) {
    if (!value) return null;
    const difference = new Date(`${value}T23:59:59`).getTime() - Date.now();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
    const seconds = Math.floor(difference / 1000);
    return { days: Math.floor(seconds / 86400), hours: Math.floor((seconds % 86400) / 3600), minutes: Math.floor((seconds % 3600) / 60), seconds: seconds % 60, passed: false };
  }
  function showStatus(message, type = "info") {
    if (!statusBanner) return;
    statusBanner.textContent = message;
    statusBanner.className = `status-banner ${type}`;
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
  function setButtonLoading(button, loading, text) {
    if (!button) return;
    if (loading) { button.dataset.originalText = button.textContent; button.disabled = true; if (text) button.textContent = text; }
    else { button.disabled = false; if (button.dataset.originalText) button.textContent = button.dataset.originalText; }
  }
  function subjectName(value) {
    const subject = String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ");
    if (subject === "biology" || subject === "bio") return "Biology";
    if (subject === "physics" || subject === "phy") return "Physics";
    if (subject === "chemistry" || subject === "chem") return "Chemistry";
    if (subject === "mathematics" || subject === "math" || subject === "maths") return "Mathematics";
    return String(value || "").trim();
  }

  function getAllowedSyllabusSubjects(goals = currentGoals) {
    const types = new Set((Array.isArray(goals) ? goals : []).map(goal => normalizeExamType(goal?.exam_type)));
    const hasNEET = types.has("neet");
    const hasJEE = types.has("jee_main") || types.has("jee_advanced") || types.has("jee");
    const subjects = [];
    if (hasNEET) subjects.push({ key: "Biology", icon: "🧬" });
    if (hasJEE) subjects.push({ key: "Mathematics", icon: "📐" });
    subjects.push({ key: "Physics", icon: "⚡" });
    subjects.push({ key: "Chemistry", icon: "🧪" });
    return subjects;
  }

  function isSyllabusTopicTrackable(topic, allTopics = currentSyllabusTopics) {
    const type = normalizeExamType(topic?.topic_type);
    if (type === "topic" || type === "subtopic") return true;
    if (type === "unit") {
      const id = String(topic?.topic_id ?? topic?.id ?? "");
      const hasChildren = (Array.isArray(allTopics) ? allTopics : []).some(item => String(item?.parent_topic_id ?? "") === id);
      return !hasChildren;
    }
    return false;
  }

  function getSyllabusChildren(topic, allTopics) {
    const id = String(topic?.topic_id ?? topic?.id ?? "");
    return (Array.isArray(allTopics) ? allTopics : []).filter(item => String(item?.parent_topic_id ?? "") === id);
  }

  function getSyllabusStatusLabel(status) {
    switch (normalizeExamType(status)) {
      case "completed": return "✅ Completed";
      case "studied": return "📖 Studied";
      default: return "○ Not started";
    }
  }

  async function loadSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    currentSession = data.session;
    currentUser = currentSession?.user || null;
    return currentSession;
  }
  async function requireAuth() {
    await loadSession();
    if (!currentSession || !currentUser) {
      if (userLabel) userLabel.textContent = "Not signed in";
      emptyState?.classList.add("hidden"); dashboardSection?.classList.add("hidden"); syllabusSection?.classList.add("hidden"); examAiPanel?.classList.add("hidden");
      showStatus("Please sign in to NOW-or-NEVER before using the Exam Command Center.", "error");
      return false;
    }
    const displayName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split("@")[0] || "Student";
    if (userLabel) userLabel.textContent = `👤 ${displayName}`;
    return true;
  }
  function syncBoardFields() {
    if (!boardFields) return;
    const boardCheckbox = document.querySelector('input[name="examGoal"][value="board"]');
    boardFields.classList.toggle("hidden", !boardCheckbox?.checked);
  }
  function restoreGoalCheckboxes() {
    document.querySelectorAll('input[name="examGoal"]').forEach(input => { input.checked = currentGoals.some(goal => normalizeExamType(goal.exam_type) === normalizeExamType(input.value)); });
    const boardGoal = currentGoals.find(goal => normalizeExamType(goal.exam_type) === "board");
    if (boardGoal) { if (boardSelect && boardGoal.board) boardSelect.value = boardGoal.board; if (classSelect && boardGoal.class_level) classSelect.value = boardGoal.class_level; }
    syncBoardFields();
  }
  function openModal() { if (!setupModal) return; restoreGoalCheckboxes(); setupModal.classList.remove("hidden"); setupModal.setAttribute("aria-hidden", "false"); syncBoardFields(); }
  function closeModal() { if (!setupModal) return; setupModal.classList.add("hidden"); setupModal.setAttribute("aria-hidden", "true"); }

  async function loadGoals() {
    if (!currentUser) return [];
    const { data, error } = await supabaseClient.from("student_exam_preferences").select("id,student_id,exam_type,board,class_level,exam_year,enabled,created_at,updated_at").eq("student_id", currentUser.id).eq("enabled", true).order("created_at", { ascending: true });
    if (error) throw error;
    currentGoals = data || [];
    return currentGoals;
  }
  async function saveGoals() {
    if (!currentUser) throw new Error("You are not signed in.");
    const selected = [...document.querySelectorAll('input[name="examGoal"]:checked')].map(input => normalizeExamType(input.value));
    if (!selected.length) throw new Error("Select at least one exam.");
    const boardSelected = selected.includes("board");
    const board = boardSelected ? boardSelect?.value || null : null;
    const classLevel = boardSelected ? classSelect?.value || null : null;
    const examYear = TARGET_EXAM_YEAR;
    if (boardSelected && (!board || !classLevel)) throw new Error("Select both your board and class level.");
    const { data: existing, error: existingError } = await supabaseClient.from("student_exam_preferences").select("*").eq("student_id", currentUser.id);
    if (existingError) throw existingError;
    if (existing?.length) { const { error } = await supabaseClient.from("student_exam_preferences").update({ enabled: false, updated_at: new Date().toISOString() }).eq("student_id", currentUser.id); if (error) throw error; }
    for (const examType of selected) {
      const old = (existing || []).find(goal => normalizeExamType(goal.exam_type) === examType && Number(goal.exam_year) === Number(examYear));
      const payload = { student_id: currentUser.id, exam_type: examType, board: examType === "board" ? board : null, class_level: examType === "board" ? classLevel : null, exam_year: examYear, enabled: true, updated_at: new Date().toISOString() };
      const result = old ? await supabaseClient.from("student_exam_preferences").update(payload).eq("id", old.id) : await supabaseClient.from("student_exam_preferences").insert(payload);
      if (result.error) throw result.error;
    }
    await loadGoals(); closeModal(); showToast("Exam goals saved successfully."); await renderDashboard();
  }

  async function loadExamDates() {
    if (!currentGoals.length) { examDates = []; return examDates; }
    const years = [...new Set(currentGoals.map(goal => Number(goal.exam_year)))];
    const { data, error } = await supabaseClient.from("exam_dates").select("id,exam_type,board,class_level,exam_year,exam_name,exam_date,status,source,source_url,verified_at,confidence,notes").in("exam_year", years);
    if (error) { console.error("Failed to load exam dates:", error); examDates = []; return examDates; }
    examDates = data || [];
    console.log("🔥 EXAM DATES FRONTEND QUERY:", { data: examDates, count: examDates.length });
    return examDates;
  }
  function findExamDate(goal, rows = examDates) {
    const goalType = normalizeExamType(goal.exam_type);
    return rows.find(row => { if (normalizeExamType(row.exam_type) !== goalType) return false; if (Number(row.exam_year) !== Number(goal.exam_year)) return false; if (goalType === "board") return String(row.board || "").toLowerCase() === String(goal.board || "").toLowerCase() && String(row.class_level || "") === String(goal.class_level || ""); return true; }) || null;
  }
  function shouldRefreshExamDate(examDate) {
    if (!examDate) return true;
    if (normalizeExamType(examDate.status) === "official") return false;
    const verifiedAt = examDate.verified_at ? new Date(examDate.verified_at) : null;
    if (!verifiedAt || Number.isNaN(verifiedAt.getTime())) return true;
    const ageDays = (Date.now() - verifiedAt.getTime()) / 86400000;
    if (normalizeExamType(examDate.status) === "tentative") return ageDays >= 7;
    if (normalizeExamType(examDate.status) === "unavailable") return ageDays >= 3;
    return false;
  }
  async function researchExam(goal) {
    if (!currentSession) await loadSession();
    if (!currentSession?.access_token) throw new Error("No active Supabase access token found.");
    const payload = { exam_type: apiExamType(goal.exam_type), exam_year: Number(goal.exam_year), board: normalizeExamType(goal.exam_type) === "board" ? goal.board || null : null, class_level: normalizeExamType(goal.exam_type) === "board" ? goal.class_level || null : null, force_refresh: true };
    console.log("Exam research request:", payload);
    const { data, error } = await supabaseClient.functions.invoke(EXAM_RESEARCH_FUNCTION, { body: payload });
    if (error) { console.error("Exam research Edge Function error:", error); try { if (error.context) console.error("🔥 EDGE FUNCTION RESPONSE BODY:", await error.context.json()); } catch (parseError) { console.error("Could not read Edge Function response body:", parseError); } throw error; }
    if (!data) throw new Error("Exam research returned no data.");
    if (data.ok === false) throw new Error(data.error || "Exam research failed.");
    console.log("🔥 RESEARCH RESULT:", data.research); console.log("🔥 SAVED DATABASE RESULT:", data.saved);
    return data;
  }
  async function researchMissingExamGoals(rows) {
    for (const goal of currentGoals) {
      const existingDate = findExamDate(goal, rows);
      if (existingDate && !shouldRefreshExamDate(existingDate)) continue;
      const researchKey = normalizeExamType(goal.exam_type) === "board" ? `board|${goal.board || ""}|${goal.class_level || ""}|${goal.exam_year}` : `${normalizeExamType(goal.exam_type)}|${goal.exam_year}`;
      if (autoResearchAttempted.has(researchKey)) continue;
      autoResearchAttempted.add(researchKey);
      try { console.log(existingDate ? "♻️ Refreshing stale exam date:" : "🔎 Researching missing exam date:", goal); await researchExam(goal); } catch (error) { console.error("❌ Automatic exam research failed:", goal, error); }
    }
  }
  function createExamCard(goal, examDate) {
    const card = document.createElement("article"); card.className = "exam-card";
    const type = normalizeExamType(goal.exam_type); const label = getExamLabel(goal.exam_type); const icon = getExamIcon(goal.exam_type); const hasDate = Boolean(examDate?.exam_date); const status = normalizeExamType(examDate?.status || "unavailable"); const confidence = typeof examDate?.confidence === "number" ? examDate.confidence : null;
    const extraInfo = type === "board" ? `<span>${escapeHTML(goal.board || "")}</span><span>Class ${escapeHTML(goal.class_level || "")}</span>` : `<span>${escapeHTML(goal.exam_year)}</span>`;
    card.innerHTML = `<div class="exam-card-top"><div class="exam-icon">${icon}</div><div class="exam-title"><span class="exam-type">${escapeHTML(label)}</span><h3>${escapeHTML(examDate?.exam_name || `${label} ${goal.exam_year}`)}</h3><div class="exam-meta">${extraInfo}</div></div></div><div class="exam-date-area">${hasDate ? `<div class="date-label">EXAM DATE</div><div class="exam-date">${escapeHTML(formatDate(examDate.exam_date))}</div><div class="countdown" data-countdown-date="${escapeHTML(examDate.exam_date)}">Calculating…</div>` : `<div class="date-unavailable"><strong>Not officially announced</strong><span>The command center will update when a usable date is available.</span></div>`}</div><div class="exam-card-footer"><div class="research-status">${status === "official" ? "🟢 Official" : status === "tentative" ? "🟡 Tentative" : "⚪ Unavailable"}</div>${confidence !== null ? `<div class="confidence">Confidence: ${Math.round(confidence)}%</div>` : ""}${examDate?.source_url ? `<a class="source-link" href="${escapeHTML(examDate.source_url)}" target="_blank" rel="noopener noreferrer">Source ↗</a>` : ""}</div>`;
    return card;
  }
  function updateCountdowns() {
    document.querySelectorAll("[data-countdown-date]").forEach(element => { const countdown = calculateCountdown(element.dataset.countdownDate); if (!countdown) { element.textContent = "Countdown unavailable"; return; } if (countdown.passed) { element.textContent = "Exam date has passed"; return; } element.innerHTML = `<span>${countdown.days}<small>days</small></span><span>${String(countdown.hours).padStart(2, "0")}<small>hrs</small></span><span>${String(countdown.minutes).padStart(2, "0")}<small>min</small></span><span>${String(countdown.seconds).padStart(2, "0")}<small>sec</small></span>`; });
  }
  function startCountdownTimer() { clearInterval(countdownTimer); updateCountdowns(); countdownTimer = setInterval(updateCountdowns, 1000); }

  async function resolveSyllabusVersion(goal) {
    if (!currentUser) throw new Error("No authenticated student found.");
    const { data, error } = await supabaseClient.rpc("resolve_student_syllabus_version", { p_exam_type: normalizeExamType(goal.exam_type), p_exam_year: Number(goal.exam_year), p_board: normalizeExamType(goal.exam_type) === "board" ? goal.board || null : null, p_class_level: normalizeExamType(goal.exam_type) === "board" ? goal.class_level || null : null });
    if (error) throw error;
    if (!data || !data.length) throw new Error("No syllabus is available for this exam yet.");
    currentSyllabus = data[0];
    return currentSyllabus;
  }
  async function loadSyllabusProgress(goal) {
    try {
      console.log("📚 Loading syllabus for:", goal); await resolveSyllabusVersion(goal);
      const examType = normalizeExamType(goal.exam_type); const examYear = Number(goal.exam_year || TARGET_EXAM_YEAR); const board = examType === "board" ? goal.board || null : null; const classLevel = examType === "board" ? goal.class_level || null : null;
      const PAGE_SIZE = 1000; let from = 0; const allRows = [];
      while (true) {
        console.log(`📚 Loading syllabus rows ${from} → ${from + PAGE_SIZE - 1}`);
        const { data, error } = await supabaseClient.rpc("get_student_syllabus_progress", { p_exam_type: examType, p_exam_year: examYear, p_board: board, p_class_level: classLevel }).range(from, from + PAGE_SIZE - 1);
        if (error) throw error; const rows = Array.isArray(data) ? data : []; allRows.push(...rows); if (rows.length < PAGE_SIZE) break; from += PAGE_SIZE;
      }
      currentSyllabusTopics = Array.from(new Map(allRows.map(row => [row.topic_id, row])).values());
      console.log("✅ TOTAL SYLLABUS TOPICS:", currentSyllabusTopics.length); console.log("📚 SUBJECTS:", [...new Set(currentSyllabusTopics.map(row => row.subject))]);
      renderSyllabus(currentSyllabus || { syllabus_version_name: `NEET UG ${examYear}`, is_official: true, is_current: true }, currentSyllabusTopics);
    } catch (error) {
      console.error("❌ Failed to load syllabus:", error);
      if (syllabusTopicContainer) syllabusTopicContainer.innerHTML = `<div class="syllabus-empty-subject"><div class="syllabus-empty-icon">⚠️</div><strong>Unable to load syllabus</strong><span>Please refresh the page and try again.</span></div>`;
    }
  }
  async function loadSyllabusForCurrentGoal() {
    if (!currentUser || !currentGoals.length) { syllabusSection?.classList.add("hidden"); return; }
    try {
      console.log("📚 Loading syllabus for selected exams:", currentGoals.map(goal => ({ exam_type: goal.exam_type, exam_year: goal.exam_year })));
      const allTopics = []; const syllabusVersions = [];
      const syllabusGoals = currentGoals.filter(goal => { const examType = normalizeExamType(goal.exam_type); return examType === "neet" || examType === "jee_main" || examType === "jee_advanced" || examType === "jee"; });
      if (!syllabusGoals.length) { syllabusSection?.classList.add("hidden"); return; }
      for (const goal of syllabusGoals) {
        const examType = normalizeExamType(goal.exam_type); const examYear = Number(goal.exam_year || TARGET_EXAM_YEAR);
        console.log(`📚 Resolving ${examType.toUpperCase()} ${examYear} syllabus...`);
        try {
          const resolvedVersion = await resolveSyllabusVersion(goal); if (resolvedVersion) syllabusVersions.push(resolvedVersion);
          const PAGE_SIZE = 1000; let from = 0;
          while (true) {
            console.log(`📚 Loading ${examType} ${examYear} rows ${from} → ${from + PAGE_SIZE - 1}`);
            const { data, error } = await supabaseClient.rpc("get_student_syllabus_progress", { p_exam_type: examType, p_exam_year: examYear, p_board: null, p_class_level: null }).range(from, from + PAGE_SIZE - 1);
            if (error) throw error;
            const rows = Array.isArray(data) ? data : [];
            console.log(`📚 ${examType} batch:`, rows.length); allTopics.push(...rows);
            if (rows.length < PAGE_SIZE) break; from += PAGE_SIZE;
          }
        } catch (error) { console.error(`❌ Failed loading ${examType} ${examYear} syllabus:`, error); }
      }
      const uniqueTopics = Array.from(new Map(allTopics.map(topic => [`${topic.syllabus_version_id || ""}|${topic.topic_id}`, topic])).values());
      currentSyllabusTopics = uniqueTopics;
      console.log("✅ COMBINED SYLLABUS TOPICS:", uniqueTopics.length);
      console.log("📚 COMBINED SUBJECTS:", [...new Set(uniqueTopics.map(topic => subjectName(topic.subject)))]);
      const displayVersion = syllabusVersions.length === 1 ? syllabusVersions[0] : { syllabus_version_name: "Combined Exam Syllabus", is_official: syllabusVersions.every(version => version?.is_official !== false), is_current: true };
      renderSyllabus(displayVersion || { syllabus_version_name: "Exam Syllabus", is_official: true, is_current: true }, uniqueTopics);
    } catch (error) {
      console.error("❌ Failed to load combined syllabus:", error);
      if (syllabusTopicContainer) syllabusTopicContainer.innerHTML = `<div class="syllabus-empty-subject"><div class="syllabus-empty-icon">⚠️</div><strong>Unable to load syllabus</strong><span>Please refresh the page and try again.</span></div>`;
    }
  }

  function renderSyllabus(syllabus, topics) {
    if (!syllabusSection) return;
    currentSyllabus = syllabus || { syllabus_version_name: "Syllabus", is_official: false, is_current: false };
    currentSyllabusTopics = Array.isArray(topics) ? topics : [];
    syllabusSection.classList.remove("hidden");
    if (syllabusVersionName) syllabusVersionName.textContent = currentSyllabus.syllabus_version_name || "Syllabus";
    if (syllabusFallbackNotice) {
      const showFallback = currentSyllabus.is_fallback && currentSyllabus.fallback_notice;
      syllabusFallbackNotice.textContent = showFallback ? currentSyllabus.fallback_notice : "";
      syllabusFallbackNotice.classList.toggle("hidden", !showFallback);
    }
    const trackable = currentSyllabusTopics.filter(topic => isSyllabusTopicTrackable(topic, currentSyllabusTopics));
    const completed = trackable.filter(topic => normalizeExamType(topic.progress_status) === "completed").length;
    const percentage = trackable.length ? Math.round(completed * 100 / trackable.length) : 0;
    if (syllabusProgressPercent) syllabusProgressPercent.textContent = `${percentage}%`;
    if (syllabusProgressCount) syllabusProgressCount.textContent = `${completed} / ${trackable.length} topics completed`;
    if (syllabusProgressFill) syllabusProgressFill.style.width = `${percentage}%`;
    renderSyllabusSubjects(currentSyllabusTopics);
  }

  function renderSyllabusSubjects(topics) {
    if (!syllabusSubjectGrid) return;
    const subjects = getAllowedSyllabusSubjects(currentGoals);
    currentAllowedSyllabusSubjects = subjects;
    const normalizedTopics = topics.map(topic => ({ ...topic, subject: subjectName(topic.subject) }));
    currentSyllabusTopics = normalizedTopics;
    if (!subjects.length) {
      syllabusSubjectGrid.innerHTML = `<div class="syllabus-empty-subject"><div class="syllabus-empty-icon">📚</div><strong>No subjects selected</strong><span>Please select JEE or NEET from your exam preferences.</span></div>`;
      if (syllabusTopicContainer) syllabusTopicContainer.innerHTML = "";
      return;
    }
    syllabusSubjectGrid.innerHTML = `<div class="syllabus-tabs">${subjects.map((subject, index) => {
      const count = normalizedTopics.filter(topic => topic.subject === subject.key && isSyllabusTopicTrackable(topic, normalizedTopics)).length;
      return `<button type="button" class="syllabus-tab ${index === 0 ? "active" : ""}" data-subject="${escapeHTML(subject.key)}" aria-selected="${index === 0 ? "true" : "false"}"><span class="syllabus-tab-icon">${subject.icon}</span><span class="syllabus-tab-name">${escapeHTML(subject.key)}</span><span class="syllabus-tab-count">${count || "—"}</span></button>`;
    }).join("")}</div><div id="syllabusSubjectProgress" class="syllabus-selected-subject-progress"></div>`;
    const tabs = syllabusSubjectGrid.querySelectorAll(".syllabus-tab");
    tabs.forEach(tab => tab.addEventListener("click", () => {
      tabs.forEach(other => { other.classList.remove("active"); other.setAttribute("aria-selected", "false"); });
      tab.classList.add("active"); tab.setAttribute("aria-selected", "true"); renderSelectedSyllabusSubject(tab.dataset.subject, normalizedTopics);
    }));
    renderSelectedSyllabusSubject(subjects[0].key, normalizedTopics);
  }

  function renderSelectedSyllabusSubject(subject, topics) {
    const progressElement = $("syllabusSubjectProgress");
    if (!progressElement) return;
    const selected = subjectName(subject);
    const subjectTopics = topics.filter(topic => subjectName(topic.subject) === selected && isSyllabusTopicTrackable(topic, topics));
    const completed = subjectTopics.filter(topic => normalizeExamType(topic.progress_status) === "completed").length;
    const total = subjectTopics.length;
    const percentage = total ? Math.round(completed * 100 / total) : 0;
    progressElement.innerHTML = `<div class="syllabus-selected-subject-header"><div><span class="syllabus-label">${escapeHTML(selected)} Progress</span><strong>${percentage}%</strong></div><span>${completed} / ${total} completed</span></div><div class="syllabus-progress-bar"><div class="syllabus-progress-fill" style="width:${percentage}%"></div></div>`;
    renderSyllabusTopics(topics, selected);
  }

  function renderSyllabusTopics(topics, selectedSubject) {
    if (!syllabusTopicContainer) return;
    const selected = subjectName(selectedSubject);
    const subjectTopics = topics.filter(topic => subjectName(topic.subject) === selected);
    const chapters = subjectTopics.filter(topic => {
      const type = normalizeExamType(topic.topic_type);
      return type === "chapter" || type === "unit";
    });
    if (!chapters.length) {
      syllabusTopicContainer.innerHTML = `<div class="syllabus-empty-subject"><div class="syllabus-empty-icon">📚</div><strong>No ${escapeHTML(selected)} syllabus data yet</strong><span>The syllabus for this subject hasn't been added to the database yet.</span></div>`;
      return;
    }

    syllabusTopicContainer.innerHTML = `<div class="syllabus-chapter-list">${chapters.map((chapter, index) => {
      const type = normalizeExamType(chapter.topic_type);
      const children = getSyllabusChildren(chapter, subjectTopics);
      const isChildlessUnit = type === "unit" && children.length === 0;
      const progressItems = isChildlessUnit ? [chapter] : children;
      const completed = progressItems.filter(topic => normalizeExamType(topic.progress_status) === "completed").length;
      const total = progressItems.length;
      const percentage = total ? Math.round(completed * 100 / total) : 0;
      const itemRows = isChildlessUnit
        ? `<div class="syllabus-topic-row" data-topic-id="${escapeHTML(chapter.topic_id)}" data-topic-name="${escapeHTML(chapter.topic_name)}" role="button" tabindex="0" aria-label="Open ${escapeHTML(chapter.topic_name)}"><div class="syllabus-topic-main"><span class="syllabus-topic-check">${normalizeExamType(chapter.progress_status) === "completed" ? "✓" : "○"}</span><span class="syllabus-topic-name">${escapeHTML(chapter.topic_name)}</span></div><div class="syllabus-topic-right"><span class="syllabus-topic-status status-${escapeHTML(chapter.progress_status || "not_started")}">${getSyllabusStatusLabel(chapter.progress_status)}</span><span class="syllabus-topic-chevron">›</span></div></div>`
        : children.length
          ? children.map(topic => `<div class="syllabus-topic-row" data-topic-id="${escapeHTML(topic.topic_id)}" data-topic-name="${escapeHTML(topic.topic_name)}" role="button" tabindex="0" aria-label="Open ${escapeHTML(topic.topic_name)}"><div class="syllabus-topic-main"><span class="syllabus-topic-check">${normalizeExamType(topic.progress_status) === "completed" ? "✓" : "○"}</span><span class="syllabus-topic-name">${escapeHTML(topic.topic_name)}</span></div><div class="syllabus-topic-right"><span class="syllabus-topic-status status-${escapeHTML(topic.progress_status || "not_started")}">${getSyllabusStatusLabel(topic.progress_status)}</span><span class="syllabus-topic-chevron">›</span></div></div>`).join("")
          : `<div class="syllabus-topic-row"><span class="syllabus-topic-name">No topics added yet.</span></div>`;
      return `<div class="syllabus-chapter ${index === 0 ? "expanded" : ""}" data-topic-id="${escapeHTML(chapter.topic_id)}"><button type="button" class="syllabus-chapter-header" data-chapter-toggle><div class="syllabus-chapter-title"><span class="syllabus-chapter-arrow">${index === 0 ? "▼" : "▶"}</span><strong>${escapeHTML(chapter.topic_name)}</strong></div><div class="syllabus-chapter-progress"><span>${completed} / ${total}</span><strong>${percentage}%</strong></div></button><div class="syllabus-chapter-progress-bar"><div class="syllabus-progress-fill" style="width:${percentage}%"></div></div><div class="syllabus-topic-list" ${index !== 0 ? 'style="display:none;"' : ""}>${itemRows}</div></div>`;
    }).join("")}</div>`;
    bindSyllabusTopicEvents(subjectTopics);
  }

  function bindSyllabusTopicEvents(subjectTopics) {
    syllabusTopicContainer.querySelectorAll("[data-chapter-toggle]").forEach(header => header.addEventListener("click", () => {
      const chapter = header.closest(".syllabus-chapter"); const list = chapter?.querySelector(".syllabus-topic-list"); const arrow = chapter?.querySelector(".syllabus-chapter-arrow");
      if (!chapter || !list || !arrow) return;
      const open = chapter.classList.toggle("expanded"); list.style.display = open ? "block" : "none"; arrow.textContent = open ? "▼" : "▶";
    }));
    const rows = syllabusTopicContainer.querySelectorAll(".syllabus-topic-row[data-topic-id]");
    rows.forEach(row => {
      const topic = subjectTopics.find(item => String(item.topic_id) === String(row.dataset.topicId));
      if (!topic) return;
      const openTopic = () => {
        rows.forEach(other => other.classList.remove("selected")); row.classList.add("selected"); selectedSyllabusTopic = topic;
        if (syllabusActionPanel && syllabusActionTopicName) { syllabusActionTopicName.textContent = topic.topic_name || "Selected Topic"; syllabusActionPanel.classList.remove("hidden"); syllabusActionPanel.setAttribute("aria-hidden", "false"); syllabusActionPanel.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
      };
      row.addEventListener("click", openTopic);
      row.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openTopic(); } });
    });
    bindSyllabusActionButtons(rows);
  }

  function getExamAiChapter(topic) {
    if (!topic) return "";
    const directChapter = topic.chapter_name || topic.chapter || topic.parent_topic_name;
    if (directChapter) return String(directChapter).trim();
    const type = normalizeExamType(topic.topic_type);
    if (type === "chapter" || type === "unit") return String(topic.topic_name || "").trim();
    const parentId = topic.parent_topic_id;
    if (parentId !== null && parentId !== undefined && String(parentId) !== "") {
      const parent = currentSyllabusTopics.find(item => String(item.topic_id) === String(parentId));
      if (parent && (normalizeExamType(parent.topic_type) === "chapter" || normalizeExamType(parent.topic_type) === "unit")) return String(parent.topic_name || "").trim();
    }
    return "";
  }

  function resetExamAiMessages() {
    if (!examAiMessages) return;
    examAiMessages.innerHTML = `<div class="exam-ai-welcome"><span class="exam-ai-welcome-icon">🤖</span><div><strong>Hi! I'm your Exam AI.</strong><p>Ask me anything about the selected topic.</p></div></div>`;
  }
  function closeExamAi() { if (!examAiPanel) return; examAiPanel.classList.add("hidden"); examAiPanel.setAttribute("aria-hidden", "true"); }
  function openExamAi(topic) {
    if (!examAiPanel || !topic) return;
    selectedSyllabusTopic = topic; const chapter = getExamAiChapter(topic);
    if (examAiTopicName) examAiTopicName.textContent = topic.topic_name || "Selected Topic";
    if (examAiContext) { const subject = subjectName(topic.subject); const exam = currentGoals[0] ? getExamLabel(currentGoals[0].exam_type) : "Exam"; examAiContext.textContent = `${exam} ${currentGoals[0]?.exam_year || ""} • ${subject}${chapter ? ` • ${chapter}` : ""}`; }
    resetExamAiMessages();
    if (examAiInput) { examAiInput.value = ""; examAiInput.focus(); }
    if (examAiHint) examAiHint.textContent = "Ask a doubt, request an explanation, or ask for exam-focused help.";
    examAiPanel.classList.remove("hidden"); examAiPanel.setAttribute("aria-hidden", "false"); examAiPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function appendExamAiMessage(text, role) {
    if (!examAiMessages) return null; ensureExamAiMarkdownStyles(); const element = document.createElement("div"); element.className = role === "user" ? "exam-ai-user-message" : "exam-ai-assistant-message"; if (role === "assistant") element.innerHTML = renderExamAiMarkdown(text); else element.textContent = String(text || ""); examAiMessages.appendChild(element); examAiMessages.scrollTop = examAiMessages.scrollHeight; return element;
  }
  function appendExamAiError(text) { if (!examAiMessages) return; const element = document.createElement("div"); element.className = "exam-ai-error"; element.textContent = String(text || "Something went wrong. Please try again."); examAiMessages.appendChild(element); examAiMessages.scrollTop = examAiMessages.scrollHeight; }
  function appendExamAiLoading() { if (!examAiMessages) return null; const element = document.createElement("div"); element.className = "exam-ai-assistant-message"; element.textContent = "🤖 Thinking…"; examAiMessages.appendChild(element); examAiMessages.scrollTop = examAiMessages.scrollHeight; return element; }
  async function askExamAi() {
    const topic = selectedSyllabusTopic; const message = examAiInput?.value?.trim() || "";
    if (!topic) { appendExamAiError("Select a syllabus topic first."); return; }
    if (!message) { examAiHint && (examAiHint.textContent = "Please enter a question first."); examAiInput?.focus(); return; }
    if (!currentSession) await loadSession();
    if (!currentSession?.access_token || !currentUser) { appendExamAiError("Please sign in again before using Exam AI."); return; }
    const goal = currentGoals[0] || {}; const chapter = getExamAiChapter(topic);
    if (!chapter) { appendExamAiError("Could not determine the chapter for this topic. Please refresh the syllabus and try again."); console.error("❌ Exam AI missing chapter context:", topic); return; }
    appendExamAiMessage(message, "user"); if (examAiInput) examAiInput.value = ""; const loading = appendExamAiLoading();
    if (examAiSend) { examAiSend.disabled = true; examAiSend.textContent = "Thinking…"; } if (examAiHint) examAiHint.textContent = "Exam AI is working on your question…";
    try {
      const { data, error } = await supabaseClient.functions.invoke(EXAM_AI_FUNCTION, { body: { message, context: { exam_type: apiExamType(goal.exam_type), exam_year: Number(goal.exam_year || TARGET_EXAM_YEAR), subject: subjectName(topic.subject), chapter, topic: topic.topic_name || "", topic_id: Number(topic.topic_id) || null, completion_status: topic.progress_status || "not_started" } } });
      if (loading?.remove) loading.remove();
      if (error) {
        console.error("Exam AI Edge Function error:", error); let detail = "Exam AI could not respond. Please try again.";
        try { if (error.context) { const body = await error.context.json(); if (body?.error) detail = body.error; } } catch (_) {}
        throw new Error(detail);
      }
      if (!data?.success) throw new Error(data?.error || "Exam AI returned no answer.");
      appendExamAiMessage(data.answer || "I couldn't generate an answer. Please try again.", "assistant"); if (examAiHint) examAiHint.textContent = "Ask another question about this topic.";
    } catch (error) {
      if (loading?.remove) loading.remove(); console.error("❌ Exam AI error:", error); appendExamAiError(error?.message || "Exam AI could not respond. Please try again."); if (examAiHint) examAiHint.textContent = "Something went wrong. Try sending your question again.";
    } finally { if (examAiSend) { examAiSend.disabled = false; examAiSend.textContent = "Send 🤖"; } }
  }
  function bindExamAi() {
    examAiClose?.addEventListener("click", closeExamAi); examAiSend?.addEventListener("click", askExamAi); examAiInput?.addEventListener("keydown", event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); askExamAi(); } });
  }
  function bindSyllabusActionButtons(topicRows) {
    if (syllabusActionClose && syllabusActionPanel) {
      const cleanClose = syllabusActionClose.cloneNode(true); syllabusActionClose.replaceWith(cleanClose);
      cleanClose.addEventListener("click", () => { syllabusActionPanel.classList.add("hidden"); syllabusActionPanel.setAttribute("aria-hidden", "true"); selectedSyllabusTopic = null; topicRows.forEach(row => row.classList.remove("selected")); });
    }
    if (!syllabusActionPanel) return;
    syllabusActionPanel.querySelectorAll("[data-syllabus-action]").forEach(button => {
      const cleanButton = button.cloneNode(true); cleanButton.disabled = false; button.replaceWith(cleanButton);
      cleanButton.addEventListener("click", async () => {
        const action = cleanButton.dataset.syllabusAction; const topic = selectedSyllabusTopic; if (!topic) return;
        if (action === "learn") { alert(`Learn: ${topic.topic_name}`); return; }
        if (action === "practice") { alert(`Practice: ${topic.topic_name}`); return; }
        if (action === "ai") { openExamAi(topic); return; }
        if (action !== "complete") return;
        const topicId = Number(topic.topic_id); if (!topicId) { showToast("Unable to complete this topic."); return; }
        cleanButton.disabled = true;
        try {
          const { data, error } = await supabaseClient.rpc("mark_syllabus_topic_complete", { p_topic_id: topicId });
          if (error) throw error;
          console.log("✅ Topic completed:", data); topic.progress_status = "completed"; topic.status = "completed"; topic.completed_at = new Date().toISOString(); syllabusActionPanel.classList.add("hidden"); syllabusActionPanel.setAttribute("aria-hidden", "true"); selectedSyllabusTopic = null; topicRows.forEach(row => row.classList.remove("selected")); showToast(`✓ ${topic.topic_name} completed!`); renderSyllabus(currentSyllabus, currentSyllabusTopics);
        } catch (error) { console.error("❌ Syllabus completion error:", error); cleanButton.disabled = false; showToast("Could not save completion. Please try again."); }
      });
    });
  }

  async function renderDashboard() {
    hideStatus(); if (goalCount) goalCount.textContent = String(currentGoals.length);
    if (!currentGoals.length) { emptyState?.classList.remove("hidden"); dashboardSection?.classList.add("hidden"); syllabusSection?.classList.add("hidden"); closeExamAi(); if (examGrid) examGrid.innerHTML = ""; return; }
    emptyState?.classList.add("hidden"); dashboardSection?.classList.remove("hidden"); let rows = await loadExamDates(); await researchMissingExamGoals(rows); rows = await loadExamDates();
    if (examGrid) { examGrid.innerHTML = ""; currentGoals.forEach(goal => examGrid.appendChild(createExamCard(goal, findExamDate(goal, rows)))); }
    startCountdownTimer(); await loadSyllabusForCurrentGoal();
  }
  async function refreshCommandCenter() {
    try {
      setButtonLoading(refreshBtn, true, "↻"); showStatus("Checking your exam timeline…", "info"); if (!await requireAuth()) return; await loadGoals(); if (!currentGoals.length) { await renderDashboard(); return; } await renderDashboard(); showStatus("Researching the latest official exam information…", "info");
      for (const goal of currentGoals) { try { await researchExam(goal); } catch (error) { console.error(`Research failed for ${goal.exam_type}:`, error); } }
      await renderDashboard(); showStatus("Exam Command Center updated.", "success"); setTimeout(hideStatus, 4000);
    } catch (error) { console.error("Exam Command Center error:", error); showStatus(error?.message || "Something went wrong while loading the Exam Command Center.", "error"); }
    finally { setButtonLoading(refreshBtn, false); }
  }

  emptySetupBtn?.addEventListener("click", openModal); manageGoalsBtn?.addEventListener("click", openModal); closeModalBtn?.addEventListener("click", closeModal); cancelSetupBtn?.addEventListener("click", closeModal);
  setupModal?.addEventListener("click", event => { if (event.target.matches("[data-close-modal]")) closeModal(); });
  document.querySelectorAll('input[name="examGoal"]').forEach(input => input.addEventListener("change", syncBoardFields));
  saveGoalsBtn?.addEventListener("click", async () => { try { setButtonLoading(saveGoalsBtn, true, "Saving…"); await saveGoals(); } catch (error) { console.error("Save goals error:", error); showToast(error?.message || "Could not save exam goals."); } finally { setButtonLoading(saveGoalsBtn, false); } });
  refreshBtn?.addEventListener("click", refreshCommandCenter); bindExamAi(); ensureExamAiMarkdownStyles();
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentSession = session; currentUser = session?.user || null;
    if (!currentUser) { currentGoals = []; examDates = []; clearInterval(countdownTimer); closeExamAi(); if (userLabel) userLabel.textContent = "Not signed in"; if (goalCount) goalCount.textContent = "0"; emptyState?.classList.add("hidden"); dashboardSection?.classList.add("hidden"); syllabusSection?.classList.add("hidden"); }
  });
  async function init() {
    console.log("🎯 Exam Command Center starting…");
    try { if (!await requireAuth()) return; await loadGoals(); console.log("Enabled exam goals:", currentGoals); await renderDashboard(); console.log("✅ Exam Command Center ready."); }
    catch (error) { console.error("❌ Exam Command Center failed:", error); showStatus(error?.message || "Unable to start the Exam Command Center.", "error"); }
  }
  init();
})();
