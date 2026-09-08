/* =========================================================
   NOW-or-NEVER — ADMIN MOCK TEST GENERATOR
   ========================================================= */

export function initMockTests({ supabaseClient, $, sectionContent, adminToast, escapeHTML }) {
  "use strict";

  const FUNCTION_URL = "https://kvbbgvfrllptqpbkixnv.supabase.co/functions/v1/mock-test-generate";

  function renderMockTests() {
    sectionContent.innerHTML = `
      <div class="section-heading">
        <p class="eyebrow">MCQ MOCK TEST SYSTEM</p>
        <h3>🧠 Create AI Mock Test</h3>
        <p class="muted">Create a draft and generate up to 90 MCQs with Groq. The test stays unpublished until you review and publish it.</p>
      </div>

      <form id="mockTestGeneratorForm" class="panel" style="margin-top:18px;">
        <div class="section-heading">
          <div>
            <p class="eyebrow">TEST DETAILS</p>
            <h3>Build a new mock test</h3>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:18px;">
          <label>Title
            <input id="mtTitle" required maxlength="160" placeholder="NEET 2027 Biology Full Test">
          </label>
          <label>Exam type
            <select id="mtExamType" required>
              <option value="NEET">NEET</option>
              <option value="CBSE">CBSE</option>
              <option value="JEE">JEE</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>Subject
            <input id="mtSubject" required maxlength="100" placeholder="Biology">
          </label>
          <label>Chapter
            <input id="mtChapter" maxlength="160" placeholder="Human Physiology">
          </label>
          <label>Topic
            <input id="mtTopic" maxlength="160" placeholder="Neural Control and Coordination">
          </label>
          <label>Difficulty
            <select id="mtDifficulty">
              <option value="mixed">Mixed</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label>Questions
            <input id="mtQuestionCount" type="number" min="1" max="90" value="30" required>
          </label>
          <label>Duration (minutes)
            <input id="mtDuration" type="number" min="1" max="300" value="30" required>
          </label>
          <label>Marks / question
            <input id="mtMarks" type="number" min="0" step="0.25" value="4" required>
          </label>
          <label>Negative marks
            <input id="mtNegative" type="number" min="0" step="0.25" value="1" required>
          </label>
          <label>Class level
            <input id="mtClassLevel" maxlength="60" placeholder="Class 11 / 12 / Dropper">
          </label>
        </div>

        <div id="mockTestProgress" class="hidden" style="margin-top:20px;padding:16px;border-radius:14px;background:rgba(127,127,127,.10);">
          <strong id="mockTestProgressTitle">Preparing…</strong>
          <p id="mockTestProgressText" class="muted" style="margin:6px 0 0;">Authenticating administrator session.</p>
        </div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:22px;">
          <button id="generateMockTestBtn" class="primary-btn" type="submit">🧠 Generate Mock Test</button>
          <button id="resetMockTestBtn" class="ghost-btn" type="button">Reset</button>
        </div>
      </form>

      <div id="mockTestResult" style="margin-top:18px;"></div>
    `;

    $("mockTestGeneratorForm")?.addEventListener("submit", generateMockTest);
    $("resetMockTestBtn")?.addEventListener("click", resetForm);
  }

  function setProgress(title, text) {
    const box = $("mockTestProgress");
    if (!box) return;
    box.classList.remove("hidden");
    $("mockTestProgressTitle").textContent = title;
    $("mockTestProgressText").textContent = text;
  }

  function setBusy(busy) {
    const button = $("generateMockTestBtn");
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? "⏳ Generating…" : "🧠 Generate Mock Test";
  }

  function resetForm() {
    $("mockTestGeneratorForm")?.reset();
    $("mtQuestionCount").value = "30";
    $("mtDuration").value = "30";
    $("mtMarks").value = "4";
    $("mtNegative").value = "1";
    $("mtDifficulty").value = "mixed";
    $("mockTestProgress")?.classList.add("hidden");
    $("mockTestResult").innerHTML = "";
    setBusy(false);
  }

  async function generateMockTest(event) {
    event.preventDefault();

    const questionCount = Number($("mtQuestionCount")?.value || 0);
    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 90) {
      adminToast("Question count must be between 1 and 90.");
      return;
    }

    setBusy(true);
    setProgress("Authenticating…", "Getting your current Supabase administrator session.");
    $("mockTestResult").innerHTML = "";

    try {
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Your login session is missing or expired. Please log in again.");

      setProgress("Generating questions…", `Sending ${questionCount} MCQs to the secure generator. This may take a little while.`);

      const payload = {
        title: $("mtTitle").value.trim(),
        exam_type: $("mtExamType").value,
        subject: $("mtSubject").value.trim(),
        chapter: $("mtChapter").value.trim() || null,
        topic: $("mtTopic").value.trim() || null,
        difficulty: $("mtDifficulty").value,
        question_count: questionCount,
        duration_minutes: Number($("mtDuration").value),
        marks_per_question: Number($("mtMarks").value),
        negative_marks: Number($("mtNegative").value),
        class_level: $("mtClassLevel").value.trim() || null
      };

      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": supabaseClient.supabaseKey || ""
        },
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      let result = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch { result = { error: raw || "Invalid server response" }; }

      if (!response.ok) {
        throw new Error(result.error || result.message || `Generator failed (${response.status})`);
      }

      setProgress("Generation complete", `Generated ${result.generated_count ?? result.question_count ?? questionCount} question(s).`);
      $("mockTestResult").innerHTML = `
        <div class="panel" style="border:1px solid rgba(80,200,120,.35);">
          <p class="eyebrow">SUCCESS</p>
          <h3>✅ Mock test generated</h3>
          <p class="muted">The test is saved as an AI-generated draft. It has not been published and no student points or marks have been affected.</p>
          ${result.mock_test_id ? `<p><strong>Test ID:</strong> ${escapeHTML(result.mock_test_id)}</p>` : ""}
          ${result.generated_count != null ? `<p><strong>Questions generated:</strong> ${escapeHTML(result.generated_count)}</p>` : ""}
        </div>
      `;
      adminToast("Mock test generated successfully.", true);
    } catch (error) {
      console.error("Mock test generation failed:", error);
      setProgress("Generation failed", error.message || "An unexpected error occurred.");
      $("mockTestResult").innerHTML = `
        <div class="panel" style="border:1px solid rgba(220,80,80,.35);">
          <p class="eyebrow">ERROR</p>
          <h3>❌ Generation failed</h3>
          <p class="muted">${escapeHTML(error.message || "Unknown error")}</p>
        </div>
      `;
      adminToast(error.message || "Mock test generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return { renderMockTests };
}
