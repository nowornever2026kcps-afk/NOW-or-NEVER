/* =========================================================
   NOW-or-NEVER
   EXAM COMMAND CENTER
   ---------------------------------------------------------
   Handles:
   - Supabase authentication
   - Exam goal setup
   - Saving student preferences
   - Loading existing goals
   - Exam-date research
   - Countdown cards
   - Refresh
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     SUPABASE
     ========================================================= */

  const SUPABASE_URL =
    "https://kvbbgvfrllptqpbkixnv.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";

  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

   window.debugSupabaseClient = supabaseClient;


  /* =========================================================
     CONFIG
     ========================================================= */

  const EXAM_RESEARCH_FUNCTION =
    "exam-research-ts";

  // September 2026 -> target the next exam cycle.
  // Before July -> current year.
  // July onward -> next year.
  const TARGET_EXAM_YEAR =
    new Date().getMonth() >= 6
      ? new Date().getFullYear() + 1
      : new Date().getFullYear();


  /* =========================================================
     STATE
     ========================================================= */

  let currentSession = null;
  let currentUser = null;
  let currentGoals = [];

  let countdownTimer = null;
   /*
 * Tracks exams that have already been automatically researched
 * during this page session.
 */
   const autoResearchAttempted = new Set();


  /* =========================================================
     DOM
     ========================================================= */

  const userLabel =
    document.getElementById("userLabel");

  const refreshBtn =
    document.getElementById("refreshBtn");

  const goalCount =
    document.getElementById("goalCount");

  const emptyState =
    document.getElementById("emptyState");

  const emptySetupBtn =
    document.getElementById("emptySetupBtn");

  const dashboardSection =
    document.getElementById("dashboardSection");

  const manageGoalsBtn =
    document.getElementById("manageGoalsBtn");

  const examGrid =
    document.getElementById("examGrid");

  const statusBanner =
    document.getElementById("statusBanner");

  const setupModal =
    document.getElementById("setupModal");

  const closeModalBtn =
    document.getElementById("closeModalBtn");

  const cancelSetupBtn =
    document.getElementById("cancelSetupBtn");

  const saveGoalsBtn =
    document.getElementById("saveGoalsBtn");

  const boardFields =
    document.getElementById("boardFields");

  const boardSelect =
    document.getElementById("boardSelect");

  const classSelect =
    document.getElementById("classSelect");

  const toast =
    document.getElementById("toast");


  /* =========================================================
     HELPERS
     ========================================================= */

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function showStatus(
    message,
    type = "info"
  ) {
    if (!statusBanner) return;

    statusBanner.textContent =
      message;

    statusBanner.className =
      `status-banner ${type}`;

    statusBanner.classList.remove(
      "hidden"
    );
  }


  function hideStatus() {
    if (!statusBanner) return;

    statusBanner.classList.add(
      "hidden"
    );
  }


  function showToast(message) {
    if (!toast) return;

    toast.textContent =
      message;

    toast.classList.add("show");

    clearTimeout(
      showToast.timer
    );

    showToast.timer =
      setTimeout(() => {
        toast.classList.remove(
          "show"
        );
      }, 3000);
  }


  function setButtonLoading(
    button,
    loading,
    text
  ) {
    if (!button) return;

    if (loading) {

      button.dataset.originalText =
        button.textContent;

      button.disabled = true;

      button.textContent =
        text;

    } else {

      button.disabled = false;

      button.textContent =
        button.dataset.originalText ||
        button.textContent;
    }
  }


  function normalizeExamType(type) {
    return String(type || "")
      .trim()
      .toLowerCase();
  }


  function apiExamType(type) {

    const normalized =
      normalizeExamType(type);

    switch (normalized) {

      case "neet":
        return "NEET";

      case "jee_main":
        return "JEE_MAIN";

      case "jee_advanced":
        return "JEE_ADVANCED";

      case "board":
        return "BOARD";

      default:
        return normalized.toUpperCase();
    }
  }


  function getExamLabel(type) {

    switch (
      normalizeExamType(type)
    ) {

      case "neet":
        return "NEET";

      case "jee_main":
        return "JEE Main";

      case "jee_advanced":
        return "JEE Advanced";

      case "board":
        return "Board Examination";

      default:
        return type;
    }
  }


  function getExamIcon(type) {

    switch (
      normalizeExamType(type)
    ) {

      case "neet":
        return "🩺";

      case "jee_main":
        return "⚡";

      case "jee_advanced":
        return "🚀";

      case "board":
        return "📚";

      default:
        return "🎯";
    }
  }


  function getTargetYear() {
    return TARGET_EXAM_YEAR;
  }


  function formatDate(dateString) {

    if (!dateString) {
      return "Not officially announced";
    }

    const date =
      new Date(
        `${dateString}T00:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Date unavailable";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
  }


  function calculateCountdown(
    dateString
  ) {

    if (!dateString) {
      return null;
    }

    const target =
      new Date(
        `${dateString}T23:59:59`
      );

    const now =
      new Date();

    const difference =
      target.getTime() -
      now.getTime();

    if (difference <= 0) {

      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        passed: true
      };
    }

    const totalSeconds =
      Math.floor(
        difference / 1000
      );

    const days =
      Math.floor(
        totalSeconds / 86400
      );

    const hours =
      Math.floor(
        (totalSeconds % 86400) /
        3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) /
        60
      );

    const seconds =
      totalSeconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      passed: false
    };
  }


  /* =========================================================
     AUTH
     ========================================================= */

  async function loadSession() {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();

    if (error) {

      console.error(
        "Exam Command auth error:",
        error
      );

      throw error;
    }

    currentSession =
      data.session;

    currentUser =
      currentSession?.user ||
      null;

    return currentSession;
  }


  async function requireAuth() {

    await loadSession();

    if (
      !currentSession ||
      !currentUser
    ) {

      if (userLabel) {
        userLabel.textContent =
          "Not signed in";
      }

      showStatus(
        "Please sign in to NOW-or-NEVER before using the Exam Command Center.",
        "error"
      );

      emptyState?.classList.add(
        "hidden"
      );

      dashboardSection?.classList.add(
        "hidden"
      );

      return false;
    }

    const displayName =
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      currentUser.email?.split("@")[0] ||
      "Student";

    if (userLabel) {
      userLabel.textContent =
        `👤 ${displayName}`;
    }

    return true;
  }


  /* =========================================================
     GOAL MODAL
     ========================================================= */

  function openModal() {

    if (!setupModal) return;

    setupModal.classList.remove(
      "hidden"
    );

    setupModal.setAttribute(
      "aria-hidden",
      "false"
    );

    syncBoardFields();
  }


  function closeModal() {

    if (!setupModal) return;

    setupModal.classList.add(
      "hidden"
    );

    setupModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  function syncBoardFields() {

    if (!boardFields) return;

    const boardCheckbox =
      document.querySelector(
        'input[name="examGoal"][value="board"]'
      );

    const boardSelected =
      !!boardCheckbox?.checked;

    boardFields.classList.toggle(
      "hidden",
      !boardSelected
    );
  }


  function restoreGoalCheckboxes() {

    const checkboxes =
      document.querySelectorAll(
        'input[name="examGoal"]'
      );

    checkboxes.forEach(
      checkbox => {

        checkbox.checked =
          currentGoals.some(
            goal =>
              normalizeExamType(
                goal.exam_type
              ) ===
              normalizeExamType(
                checkbox.value
              )
          );
      }
    );

    syncBoardFields();

    const boardGoal =
      currentGoals.find(
        goal =>
          normalizeExamType(
            goal.exam_type
          ) === "board"
      );

    if (boardGoal) {

      if (
        boardSelect &&
        boardGoal.board
      ) {
        boardSelect.value =
          boardGoal.board;
      }

      if (
        classSelect &&
        boardGoal.class_level
      ) {
        classSelect.value =
          boardGoal.class_level;
      }
    }
  }

/* =========================================================
   SYLLABUS PROGRESS
   ========================================================= */

   const syllabusSection =
     document.getElementById("syllabusSection");
   
   const syllabusVersionName =
     document.getElementById("syllabusVersionName");
   
   const syllabusFallbackNotice =
     document.getElementById("syllabusFallbackNotice");
   
   const syllabusProgressPercent =
     document.getElementById("syllabusProgressPercent");
   
   const syllabusProgressCount =
     document.getElementById("syllabusProgressCount");
   
   const syllabusProgressFill =
     document.getElementById("syllabusProgressFill");
   
   const syllabusSubjectGrid =
     document.getElementById("syllabusSubjectGrid");
   
   const syllabusTopicContainer =
     document.getElementById("syllabusTopicContainer");
   
   
   let currentSyllabus = null;
   let currentSyllabusTopics = [];
   
   
   /* ---------------------------------------------------------
      Resolve the correct syllabus version
      --------------------------------------------------------- */
   
   async function resolveSyllabusVersion(goal) {
   
     if (!currentUser) {
       throw new Error(
         "No authenticated student found."
       );
     }
   
     const {
       data,
       error
     } = await supabaseClient.rpc(
       "resolve_student_syllabus_version",
       {
         p_exam_type:
           normalizeExamType(goal.exam_type),
   
         p_exam_year:
           Number(goal.exam_year),
   
         p_board:
           normalizeExamType(goal.exam_type) === "board"
             ? goal.board || null
             : null,
   
         p_class_level:
           normalizeExamType(goal.exam_type) === "board"
             ? goal.class_level || null
             : null
       }
     );
   
     console.log(
       "📚 Syllabus resolver result:",
       {
         data,
         error
       }
     );
   
     if (error) {
       throw error;
     }
   
     if (!data || !data.length) {
       throw new Error(
         "No syllabus is available for this exam yet."
       );
     }
   
     currentSyllabus = data[0];
   
     return currentSyllabus;
   }
   
   


      // =========================================================
// Load ALL syllabus progress rows
// Supabase/PostgREST can limit a single response to 1000
// rows, so fetch in pages.
// =========================================================

      async function loadSyllabusProgress(goal) {
      
        try {
      
          console.log(
            "📚 Loading syllabus for:",
            goal
          );
      
      
          const examType =
            normalizeExamType(
              goal?.exam_type
            );
      
          const examYear =
            Number(
              
              goal?.exam_year ||
              TARGET_EXAM_YEAR
            );
      
      
          const board =
            examType === "board"
              ? goal?.board || null
              : null;
      
      
          const classLevel =
            examType === "board"
              ? goal?.class_level || null
              : null;
      
      
          const PAGE_SIZE = 1000;
      
          let from = 0;
      
          let allRows = [];
      
          let hasMore = true;
      
      
          while (hasMore) {
      
            console.log(
              `📚 Loading syllabus rows ${from} → ${from + PAGE_SIZE - 1}`
            );
      
      
            const {
              data,
              error
            } = await supabaseClient
              .rpc(
                "get_student_syllabus_progress",
                {
                  p_exam_type: examType,
                  p_exam_year: examYear,
                  p_board: board,
                  p_class_level: classLevel
                }
              )
              .range(
                from,
                from + PAGE_SIZE - 1
              );
      
      
            if (error) {
      
              console.error(
                "❌ Syllabus RPC error:",
                error
              );
      
              throw error;
      
            }
      
      
            const rows =
              Array.isArray(data)
                ? data
                : [];
      
      
            allRows.push(
              ...rows
            );
      
      
            console.log(
              `📚 Received ${rows.length} rows`
            );
      
      
            /*
             * If fewer than PAGE_SIZE rows were
             * returned, we reached the end.
             */
            if (
              rows.length < PAGE_SIZE
            ) {
      
              hasMore = false;
      
            }
      
            else {
      
              from += PAGE_SIZE;
      
            }
      
          }
      
      
          /*
           * Remove accidental duplicates.
           */
          const uniqueRows =
            Array.from(
              new Map(
                allRows.map(
                  row => [
                    row.topic_id,
                    row
                  ]
                )
              ).values()
            );
      
      
          currentSyllabusTopics =
            uniqueRows;
      
      
          console.log(
            "✅ TOTAL SYLLABUS TOPICS:",
            currentSyllabusTopics.length
          );
      
      
          console.log(
            "📚 SUBJECTS:",
            [
              ...new Set(
                currentSyllabusTopics.map(
                  row => row.subject
                )
              )
            ]
          );
      
      
          console.log(
            "📚 BIOLOGY:",
            currentSyllabusTopics.filter(
              row =>
                String(row.subject)
                  .toLowerCase() ===
                "biology"
            ).length
          );
      
      
          console.log(
            "📚 PHYSICS:",
            currentSyllabusTopics.filter(
              row =>
                String(row.subject)
                  .toLowerCase() ===
                "physics"
            ).length
          );
      
      
          console.log(
            "📚 CHEMISTRY:",
            currentSyllabusTopics.filter(
              row =>
                String(row.subject)
                  .toLowerCase() ===
                "chemistry"
            ).length
          );
      
      
          /*
           * Render the syllabus using the complete
           * dataset.
           */
          renderSyllabus(
              currentSyllabus || {
                syllabus_version_name: `NEET UG ${examYear}`,
                is_official: true,
                is_current: true
              },
              currentSyllabusTopics
            );
      
      
        } catch (error) {
      
          console.error(
            "❌ Failed to load syllabus:",
            error
          );
      
      
          if (
            syllabusTopicContainer
          ) {
      
            syllabusTopicContainer.innerHTML = `
      
              <div class="syllabus-empty-subject">
      
                <div class="syllabus-empty-icon">
                  ⚠️
                </div>
      
                <strong>
                  Unable to load syllabus
                </strong>
      
                <span>
                  Please refresh the page and try again.
                </span>
      
              </div>
      
            `;
      
          }
      
        }
      
      }
   
    
   
   /* ---------------------------------------------------------
      Render syllabus
      --------------------------------------------------------- */
   
   function renderSyllabus(
     syllabus,
     topics
   ) {

       syllabus = syllabus || {
          syllabus_version_name: "Syllabus",
          is_official: false,
          is_current: false
        };
      
        topics = Array.isArray(topics) ? topics : [];

        currentSyllabusTopics = topics;
   
     if (!syllabusSection) {
       return;
     }
   
     syllabusSection.classList.remove(
       "hidden"
     );
   
   
     /* -------------------------------------------------------
        Version information
        ------------------------------------------------------- */
   
     if (syllabusVersionName) {
   
       syllabusVersionName.textContent =
         syllabus.syllabus_version_name ||
         "Syllabus";
     }
   
   
     /* -------------------------------------------------------
        Fallback notice
        ------------------------------------------------------- */
   
     if (
       syllabusFallbackNotice
     ) {
   
       if (
         syllabus.is_fallback &&
         syllabus.fallback_notice
       ) {
   
         syllabusFallbackNotice.textContent =
           syllabus.fallback_notice;
   
         syllabusFallbackNotice.classList.remove(
           "hidden"
         );
   
       } else {
   
         syllabusFallbackNotice.textContent =
           "";
   
         syllabusFallbackNotice.classList.add(
           "hidden"
         );
       }
     }
   
   
     /* -------------------------------------------------------
        Calculate overall progress
        ------------------------------------------------------- */
   
     const trackableTopics =
       topics.filter(
         topic =>
           topic.topic_type === "topic" ||
           topic.topic_type === "subtopic"
       );
   
     const completedTopics =
       trackableTopics.filter(
         topic =>
           topic.progress_status ===
           "completed"
       );
   
     const total =
       trackableTopics.length;
   
     const completed =
       completedTopics.length;
   
     const percentage =
       total > 0
         ? Math.round(
             (completed / total) * 100
           )
         : 0;
   
   
     if (syllabusProgressPercent) {
   
       syllabusProgressPercent.textContent =
         `${percentage}%`;
     }
   
   
     if (syllabusProgressCount) {
   
       syllabusProgressCount.textContent =
         `${completed} / ${total} topics completed`;
     }
   
   
     if (syllabusProgressFill) {
   
       syllabusProgressFill.style.width =
         `${percentage}%`;
     }
   
   
    /* -------------------------------------------------------
   Subject summary + detailed syllabus
   ------------------------------------------------------- */

/*
 * IMPORTANT:
 * Pass the COMPLETE syllabus dataset here.
 *
 * trackableTopics excludes chapters, but the detailed
 * renderer needs chapter rows to build the chapter
 * dropdowns.
 */
      renderSyllabusSubjects(
        topics
      );
   
   
     /* -------------------------------------------------------
        Detailed topics
        ------------------------------------------------------- */
   
   }
   
   
   /* ---------------------------------------------------------
      Render subject cards
      --------------------------------------------------------- */
   
  /* ---------------------------------------------------------
   Render subject tabs
   --------------------------------------------------------- */

function renderSyllabusSubjects(topics) {

  if (!syllabusSubjectGrid) return;

  /*
   * Fixed NEET subject order.
   *
   * This guarantees that all three tabs appear even if
   * one subject currently has no rows returned by Supabase.
   */
  const SUBJECTS = [
    {
      key: "Biology",
      icon: "🧬"
    },
    {
      key: "Physics",
      icon: "⚡"
    },
    {
      key: "Chemistry",
      icon: "🧪"
    }
  ];


  /*
   * Normalize subject names coming from Supabase.
   *
   * This handles:
   * Biology
   * biology
   * BIOLOGY
   * Physics
   * physics
   * Chemistry
   * chemistry
   */
  function normalizeSubject(value) {

    const normalized =
      String(value || "")
        .trim()
        .toLowerCase();

    if (normalized === "biology") {
      return "Biology";
    }

    if (normalized === "physics") {
      return "Physics";
    }

    if (normalized === "chemistry") {
      return "Chemistry";
    }

    return String(value || "").trim();
  }


  /*
   * Convert the returned topic subject names into the
   * standard names used by the tabs.
   */
  const normalizedTopics =
    topics.map(topic => ({
      ...topic,
      subject: normalizeSubject(topic.subject)
    }));


  /*
   * Store the normalized data.
   *
   * This is important because the rest of the syllabus
   * renderer will now consistently use Biology / Physics /
   * Chemistry.
   */
  currentSyllabusTopics =
    normalizedTopics;


  /*
   * Render the three tabs.
   */
  syllabusSubjectGrid.innerHTML = `

    <div class="syllabus-tabs">

      ${SUBJECTS.map((subject, index) => {

        const subjectTopics =
          normalizedTopics.filter(
            topic =>
              topic.subject === subject.key &&
              (
                topic.topic_type === "topic" ||
                topic.topic_type === "subtopic"
              )
          );

        const hasData =
          subjectTopics.length > 0;

        return `

          <button
            type="button"
            class="syllabus-tab ${index === 0 ? "active" : ""}"
            data-subject="${escapeHTML(subject.key)}"
            aria-selected="${index === 0 ? "true" : "false"}"
          >

            <span class="syllabus-tab-icon">
              ${subject.icon}
            </span>

            <span class="syllabus-tab-name">
              ${escapeHTML(subject.key)}
            </span>

            <span class="syllabus-tab-count">
              ${hasData ? subjectTopics.length : "—"}
            </span>

          </button>

        `;

      }).join("")}

    </div>


    <div
      id="syllabusSubjectProgress"
      class="syllabus-selected-subject-progress"
    ></div>

  `;


  /*
   * Tab click handlers.
   */
  const tabs =
    syllabusSubjectGrid.querySelectorAll(
      ".syllabus-tab"
    );


  tabs.forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        /*
         * Remove active state from all tabs.
         */
        tabs.forEach(otherTab => {

          otherTab.classList.remove(
            "active"
          );

          otherTab.setAttribute(
            "aria-selected",
            "false"
          );

        });


        /*
         * Activate selected tab.
         */
        tab.classList.add(
          "active"
        );

        tab.setAttribute(
          "aria-selected",
          "true"
        );


        /*
         * Render selected subject.
         */
        renderSelectedSyllabusSubject(
          tab.dataset.subject,
          normalizedTopics
        );

      }
    );

  });


  /*
   * Biology is selected by default.
   */
  renderSelectedSyllabusSubject(
    "Biology",
    normalizedTopics
  );

}



/* ---------------------------------------------------------
   Render selected subject
   --------------------------------------------------------- */
      
      function renderSelectedSyllabusSubject(
        subject,
        topics
      ) {
      
        const subjectProgress =
          document.getElementById(
            "syllabusSubjectProgress"
          );
      
      
        if (!subjectProgress) return;
      
      
        /*
         * Normalize the selected subject.
         */
        const selectedSubject =
          String(subject || "")
            .trim()
            .toLowerCase();
      
      
        let normalizedSubject = subject;
      
      
        if (selectedSubject === "biology") {
          normalizedSubject = "Biology";
        }
      
        else if (selectedSubject === "physics") {
          normalizedSubject = "Physics";
        }
      
        else if (selectedSubject === "chemistry") {
          normalizedSubject = "Chemistry";
        }
      
      
        /*
         * Get all trackable topics for this subject.
         */
        const subjectTopics =
          topics.filter(
            topic => {
      
              const topicSubject =
                String(topic.subject || "")
                  .trim()
                  .toLowerCase();
      
              return (
                topicSubject ===
                  String(normalizedSubject)
                    .trim()
                    .toLowerCase()
                &&
                (
                  topic.topic_type === "topic" ||
                  topic.topic_type === "subtopic"
                )
              );
      
            }
          );
      
      
        /*
         * Calculate subject progress.
         */
        const completed =
          subjectTopics.filter(
            topic =>
              topic.progress_status ===
              "completed"
          ).length;
      
      
        const total =
          subjectTopics.length;
      
      
        const percentage =
          total > 0
            ? Math.round(
                (completed / total) * 100
              )
            : 0;
      
      
        /*
         * Render subject progress.
         */
        subjectProgress.innerHTML = `
      
          <div class="syllabus-selected-subject-header">
      
            <div>
      
              <span class="syllabus-label">
                ${escapeHTML(normalizedSubject)} Progress
              </span>
      
              <strong>
                ${percentage}%
              </strong>
      
            </div>
      
            <span>
              ${completed} / ${total} completed
            </span>
      
          </div>
      
      
          <div class="syllabus-progress-bar">
      
            <div
              class="syllabus-progress-fill"
              style="width: ${percentage}%"
            ></div>
      
          </div>
      
        `;
      
      
        /*
         * Render chapters/topics for the selected subject.
         */
        renderSyllabusTopics(
          topics,
          normalizedSubject
        );
      
      }
      
      
      
      /* ---------------------------------------------------------
         Render detailed syllabus
         --------------------------------------------------------- */
      /* =========================================================
   SYLLABUS TOPIC ACTION PANEL STATE
   ========================================================= */
      
      const syllabusActionPanel =
        document.getElementById("syllabusTopicActionPanel");
      
      const syllabusActionTopicName =
        document.getElementById("syllabusActionTopicName");
      
      const syllabusActionClose =
        document.getElementById("syllabusActionClose");
      
      let selectedSyllabusTopic = null;
            
         /* =========================================================
            RENDER SYLLABUS TOPICS
            ---------------------------------------------------------
            Handles:
            - Subject filtering
            - Chapter dropdowns
            - Topic rows
            - Topic selection
            - Learn / Practice / Ask AI / Complete panel
            ========================================================= */
         
         function renderSyllabusTopics(
           topics,
           selectedSubject
         ) {
         
           if (!syllabusTopicContainer) {
             return;
           }
         
         
           /* =========================================================
              NORMALIZE SUBJECT
              ========================================================= */
         
           const normalizedSelectedSubject =
             String(selectedSubject || "")
               .trim()
               .toLowerCase();
         
         
           /* =========================================================
              FILTER SUBJECT TOPICS
              ========================================================= */
         
           const subjectTopics =
             topics.filter(topic => {
         
               const topicSubject =
                 String(topic.subject || "")
                   .trim()
                   .toLowerCase();
         
               return (
                 topicSubject ===
                 normalizedSelectedSubject
               );
         
             });
         
         
           /* =========================================================
              FIND CHAPTERS
              ========================================================= */
         
           const chapters =
             subjectTopics.filter(topic =>
               topic.topic_type === "chapter"
             );
         
         
           /* =========================================================
              EMPTY STATE
              ========================================================= */
         
           if (!chapters.length) {
         
             syllabusTopicContainer.innerHTML = `
         
               <div class="syllabus-empty-subject">
         
                 <div class="syllabus-empty-icon">
                   📚
                 </div>
         
                 <strong>
                   No ${escapeHTML(selectedSubject)} syllabus data yet
                 </strong>
         
                 <span>
                   The syllabus for this subject hasn't been added
                   to the database yet.
                 </span>
         
               </div>
         
             `;
         
             return;
           }
         
         
           /* =========================================================
              RENDER CHAPTERS
              ========================================================= */
         
           syllabusTopicContainer.innerHTML = `
         
             <div class="syllabus-chapter-list">
         
               ${chapters.map((chapter, index) => {
         
                 /* -----------------------------------------------------
                    Find topics belonging to this chapter
                    ----------------------------------------------------- */
         
                 const children =
                   subjectTopics.filter(topic =>
                     String(topic.parent_topic_id) ===
                     String(chapter.topic_id)
                   );
         
         
                 /* -----------------------------------------------------
                    Chapter progress
                    ----------------------------------------------------- */
         
                 const completed =
                   children.filter(topic =>
                     topic.progress_status === "completed"
                   ).length;
         
         
                 const total =
                   children.length;
         
         
                 const percentage =
                   total > 0
                     ? Math.round(
                         (completed / total) * 100
                       )
                     : 0;
         
         
                 /* -----------------------------------------------------
                    Chapter HTML
                    ----------------------------------------------------- */
         
                 return `
         
                   <div
                     class="
                       syllabus-chapter
                       ${index === 0 ? "expanded" : ""}
                     "
                     data-topic-id="${escapeHTML(
                       chapter.topic_id
                     )}"
                   >
         
                     <!-- =============================================
                          CHAPTER HEADER
                          ============================================= -->
         
                     <button
                       type="button"
                       class="syllabus-chapter-header"
                       data-chapter-toggle
                     >
         
                       <div class="syllabus-chapter-title">
         
                         <span class="syllabus-chapter-arrow">
                           ${index === 0 ? "▼" : "▶"}
                         </span>
         
                         <strong>
                           ${escapeHTML(
                             chapter.topic_name
                           )}
                         </strong>
         
                       </div>
         
         
                       <div class="syllabus-chapter-progress">
         
                         <span>
                           ${completed} / ${total}
                         </span>
         
                         <strong>
                           ${percentage}%
                         </strong>
         
                       </div>
         
                     </button>
         
         
                     <!-- =============================================
                          CHAPTER PROGRESS BAR
                          ============================================= -->
         
                     <div
                       class="syllabus-chapter-progress-bar"
                     >
         
                       <div
                         class="syllabus-progress-fill"
                         style="width: ${percentage}%"
                       ></div>
         
                     </div>
         
         
                     <!-- =============================================
                          TOPIC LIST
                          ============================================= -->
         
                     <div
                       class="syllabus-topic-list"
                       ${index !== 0
                         ? 'style="display:none;"'
                         : ""
                       }
                     >
         
                       ${
                         children.length
         
                           ? children.map(topic => `
         
                               <div
                                 class="syllabus-topic-row"
                                 data-topic-id="${escapeHTML(
                                   topic.topic_id
                                 )}"
                                 data-topic-name="${escapeHTML(
                                   topic.topic_name
                                 )}"
                                 role="button"
                                 tabindex="0"
                                 aria-label="Open ${escapeHTML(
                                   topic.topic_name
                                 )}"
                               >
         
                                 <div class="syllabus-topic-main">
         
                                   <span class="syllabus-topic-check">
                                     ${
                                       topic.progress_status ===
                                       "completed"
                                         ? "✓"
                                         : "○"
                                     }
                                   </span>
         
                                   <span class="syllabus-topic-name">
                                     ${escapeHTML(
                                       topic.topic_name
                                     )}
                                   </span>
         
                                 </div>
         
         
                                 <div class="syllabus-topic-right">
         
                                   <span
                                     class="
                                       syllabus-topic-status
                                       status-${escapeHTML(
                                         topic.progress_status
                                       )}
                                     "
                                   >
                                     ${getSyllabusStatusLabel(
                                       topic.progress_status
                                     )}
                                   </span>
         
         
                                   <span class="syllabus-topic-chevron">
                                     ›
                                   </span>
         
                                 </div>
         
                               </div>
         
                             `).join("")
         
                           : `
         
                               <div
                                 class="syllabus-topic-row"
                               >
         
                                 <span
                                   class="syllabus-topic-name"
                                 >
                                   No topics added yet.
                                 </span>
         
                               </div>
         
                             `
                       }
         
                     </div>
         
                   </div>
         
                 `;
         
               }).join("")}
         
             </div>
         
           `;
         
         
           /* =========================================================
              CHAPTER DROPDOWN CONTROLS
              ========================================================= */
         
           const chapterHeaders =
             syllabusTopicContainer.querySelectorAll(
               "[data-chapter-toggle]"
             );
         
         
           chapterHeaders.forEach(header => {
         
             header.addEventListener(
               "click",
               () => {
         
                 const chapter =
                   header.closest(
                     ".syllabus-chapter"
                   );
         
         
                 if (!chapter) {
                   return;
                 }
         
         
                 const topicList =
                   chapter.querySelector(
                     ".syllabus-topic-list"
                   );
         
         
                 const arrow =
                   chapter.querySelector(
                     ".syllabus-chapter-arrow"
                   );
         
         
                 if (!topicList || !arrow) {
                   return;
                 }
         
         
                 const isOpen =
                   chapter.classList.contains(
                     "expanded"
                   );
         
         
                 if (isOpen) {
         
                   chapter.classList.remove(
                     "expanded"
                   );
         
                   topicList.style.display =
                     "none";
         
                   arrow.textContent =
                     "▶";
         
                 } else {
         
                   chapter.classList.add(
                     "expanded"
                   );
         
                   topicList.style.display =
                     "block";
         
                   arrow.textContent =
                     "▼";
         
                 }
         
               }
             );
         
           });
         
         
           /* =========================================================
              TOPIC CLICK CONTROLS
              ---------------------------------------------------------
              Clicking a topic:
              1. Selects the row
              2. Finds the real topic object
              3. Opens the action panel
              ========================================================= */
         
           const topicRows =
             syllabusTopicContainer.querySelectorAll(
               ".syllabus-topic-row[data-topic-id]"
             );
         
         
           topicRows.forEach(row => {
         
             const topicId =
               row.dataset.topicId;
         
         
             const topic =
               subjectTopics.find(item =>
                 String(item.topic_id) ===
                 String(topicId)
               );
         
         
             if (!topic) {
               return;
             }
         
         
             function openTopic() {
         
               /* -----------------------------------------------
                  Clear previous selection
                  ----------------------------------------------- */
         
               topicRows.forEach(otherRow => {
         
                 otherRow.classList.remove(
                   "selected"
                 );
         
               });
         
         
               /* -----------------------------------------------
                  Select current topic
                  ----------------------------------------------- */
         
               row.classList.add(
                 "selected"
               );
         
         
               /* -----------------------------------------------
                  Save selected topic
                  ----------------------------------------------- */
         
               selectedSyllabusTopic =
                 topic;
         
         
               console.log(
                 "📖 Syllabus topic selected:",
                 {
                   topicId: topic.topic_id,
                   topicName: topic.topic_name,
                   subject: topic.subject,
                   status: topic.progress_status
                 }
               );
         
         
               /* -----------------------------------------------
                  Open action panel
                  ----------------------------------------------- */
         
               if (
                 syllabusActionPanel &&
                 syllabusActionTopicName
               ) {
         
                 syllabusActionTopicName.textContent =
                   topic.topic_name ||
                   "Selected Topic";
         
         
                 syllabusActionPanel.classList.remove(
                   "hidden"
                 );
         
         
                 syllabusActionPanel.setAttribute(
                   "aria-hidden",
                   "false"
                 );
         
         
                 syllabusActionPanel.scrollIntoView({
                   behavior: "smooth",
                   block: "nearest"
                 });
         
               }
         
             }
         
         
             /* -----------------------------------------------
                Mouse click
                ----------------------------------------------- */
         
             row.addEventListener(
               "click",
               openTopic
             );
         
         
             /* -----------------------------------------------
                Keyboard accessibility
                ----------------------------------------------- */
         
             row.addEventListener(
               "keydown",
               event => {
         
                 if (
                   event.key === "Enter" ||
                   event.key === " "
                 ) {
         
                   event.preventDefault();
         
                   openTopic();
         
                 }
         
               }
             );
         
           });
         
         
           /* =========================================================
              ACTION PANEL CLOSE
              ---------------------------------------------------------
              We remove the previous listener before adding a new one.
              This prevents duplicate close events after re-rendering.
              ========================================================= */
         
           if (
             syllabusActionClose &&
             syllabusActionPanel
           ) {
         
             const newCloseButton =
               syllabusActionClose.cloneNode(true);
         
         
             syllabusActionClose.replaceWith(
               newCloseButton
             );
         
         
             newCloseButton.addEventListener(
               "click",
               () => {
         
                 syllabusActionPanel.classList.add(
                   "hidden"
                 );
         
         
                 syllabusActionPanel.setAttribute(
                   "aria-hidden",
                   "true"
                 );
         
         
                 selectedSyllabusTopic =
                   null;
         
         
                 topicRows.forEach(row => {
         
                   row.classList.remove(
                     "selected"
                   );
         
                 });
         
               }
             );
         
           }
         
         
           /* =========================================================
              ACTION BUTTONS
              ========================================================= */
         
                   
            /* =========================================================
               ACTION PANEL BUTTONS
               ========================================================= */
            
            if (syllabusActionPanel) {
            
              const actionButtons =
                syllabusActionPanel.querySelectorAll(
                  "[data-syllabus-action]"
                );
            
            
              actionButtons.forEach(button => {
            
                /*
                 * IMPORTANT:
                 * Always restore the normal button state when
                 * the syllabus is rendered again.
                 */
            
                if (
                  button.dataset.syllabusAction ===
                  "complete"
                ) {
            
                  button.disabled = false;
            
                  button.innerHTML = `
                    <span class="syllabus-action-icon">
                      ✓
                    </span>
            
                    <span class="syllabus-action-content">
                      <strong>
                        Mark Complete
                      </strong>
            
                      <small>
                        Finish this topic
                      </small>
                    </span>
                  `;
            
                }
            
            
                /*
                 * Remove old listener safely by cloning.
                 */
            
                const cleanButton =
                  button.cloneNode(true);
            
            
                button.replaceWith(
                  cleanButton
                );
            
            
                cleanButton.addEventListener(
                  "click",
                  async () => {
            
                    const action =
                      cleanButton.dataset.syllabusAction;
            
            
                    /*
                     * Make sure a topic is selected.
                     */
            
                    if (!selectedSyllabusTopic) {
            
                      console.warn(
                        "⚠️ No syllabus topic selected."
                      );
            
                      return;
                    }
            
            
                    const topic =
                      selectedSyllabusTopic;
            
            
                    /* =================================================
                       LEARN
                       ================================================= */
            
                    if (action === "learn") {
            
                      console.log(
                        "📖 Learn topic:",
                        topic.topic_name
                      );
            
                      alert(
                        `Learn: ${topic.topic_name}`
                      );
            
                      return;
                    }
            
            
                    /* =================================================
                       PRACTICE
                       ================================================= */
            
                    if (action === "practice") {
            
                      console.log(
                        "📝 Practice topic:",
                        topic.topic_name
                      );
            
                      alert(
                        `Practice: ${topic.topic_name}`
                      );
            
                      return;
                    }
            
            
                    /* =================================================
                       ASK AI
                       ================================================= */
            
                    if (action === "ai") {
            
                      console.log(
                        "🤖 Ask AI about:",
                        topic.topic_name
                      );
            
                      alert(
                        `Ask AI: ${topic.topic_name}`
                      );
            
                      return;
                    }
            
            
                    /* =================================================
                       MARK COMPLETE
                       ================================================= */
            
                    if (action === "complete") {
            
                      const topicId =
                        Number(topic.topic_id);
            
            
                      if (!topicId) {
            
                        console.error(
                          "❌ Missing syllabus topic ID:",
                          topic
                        );
            
                        alert(
                          "Unable to complete this topic."
                        );
            
                        return;
                      }
            
            
                      /*
                       * Prevent double-clicking.
                       */
            
                      cleanButton.disabled =
                        true;
            
            
                      cleanButton.innerHTML = `
                        <span class="syllabus-action-icon">
                          ⏳
                        </span>
            
                        <span class="syllabus-action-content">
                          <strong>
                            Saving...
                          </strong>
            
                          <small>
                            Please wait
                          </small>
                        </span>
                      `;
            
            
                      try {
            
                        console.log(
                          "📚 Marking syllabus topic complete:",
                          {
                            topicId,
                            topicName:
                              topic.topic_name
                          }
                        );
            
            
                        /* ---------------------------------------------
                           SAVE TO SUPABASE
                           --------------------------------------------- */
            
                        const {
                          data,
                          error
                        } =
                          await supabaseClient.rpc(
                            "mark_syllabus_topic_complete",
                            {
                              p_topic_id:
                                topicId
                            }
                          );
            
            
                        if (error) {
            
                          console.error(
                            "❌ Failed to complete syllabus topic:",
                            error
                          );
            
                          throw error;
                        }
            
            
                        console.log(
                          "✅ Topic completed:",
                          data
                        );
            
            
                        /* ---------------------------------------------
                           UPDATE LOCAL TOPIC
                           --------------------------------------------- */
            
                        topic.progress_status =
                          "completed";
            
                        topic.status =
                          "completed";
            
                        topic.completed_at =
                          new Date().toISOString();
            
            
                        /* ---------------------------------------------
                           CLOSE ACTION PANEL
                           --------------------------------------------- */
            
                        if (syllabusActionPanel) {
            
                          syllabusActionPanel.classList.add(
                            "hidden"
                          );
            
                          syllabusActionPanel.setAttribute(
                            "aria-hidden",
                            "true"
                          );
            
                        }
            
            
                        /* ---------------------------------------------
                           CLEAR SELECTION
                           --------------------------------------------- */
            
                        topicRows.forEach(row => {
            
                          row.classList.remove(
                            "selected"
                          );
            
                        });
            
            
                        selectedSyllabusTopic =
                          null;
            
            
                        /* ---------------------------------------------
                           SUCCESS MESSAGE
                           --------------------------------------------- */
            
                        if (
                          typeof showToast ===
                          "function"
                        ) {
            
                          showToast(
                            `✓ ${topic.topic_name} completed!`
                          );
            
                        } else {
            
                          console.log(
                            `✓ ${topic.topic_name} completed!`
                          );
            
                        }
            
            
                        /* ---------------------------------------------
                           RE-RENDER SYLLABUS
                           --------------------------------------------- */
            
                        if (
                          currentSyllabusTopics &&
                          currentSyllabusTopics.length
                        ) {
            
                          renderSyllabus(
                            currentSyllabus,
                            currentSyllabusTopics
                          );
            
                        }
            
            
                      } catch (error) {
            
                        console.error(
                          "❌ Syllabus completion error:",
                          error
                        );
            
            
                        /*
                         * IMPORTANT:
                         * Restore ONLY this button if saving fails.
                         */
            
                        cleanButton.disabled =
                          false;
            
                        cleanButton.innerHTML = `
                          <span class="syllabus-action-icon">
                            ✓
                          </span>
            
                          <span class="syllabus-action-content">
                            <strong>
                              Mark Complete
                            </strong>
            
                            <small>
                              Finish this topic
                            </small>
                          </span>
                        `;
            
            
                        if (
                          typeof showToast ===
                          "function"
                        ) {
            
                          showToast(
                            "Could not save completion. Please try again."
                          );
            
                        } else {
            
                          alert(
                            "Could not save completion. Please try again."
                          );
            
                        }
            
                      }
            
                      return;
                    }
            
                  }
                );
            
              });
            
            


         

   
   /*=========================*/

   function getSyllabusStatusLabel(status) {

        switch (status) {
      
          case "completed":
            return "✅ Completed";
      
          case "studied":
            return "📖 Studied";
      
          default:
            return "○ Not started";
        }
      }


           
            /* ---------------------------------------------------------
      Load syllabus for the first active exam
      --------------------------------------------------------- */
   
   async function loadSyllabusForCurrentGoal() {
   
     if (!currentUser) {
       return;
     }
   
     if (!currentGoals.length) {
   
       syllabusSection?.classList.add(
         "hidden"
       );
   
       return;
     }
   
   
     /*
      * For now we use the first selected exam.
      *
      * We will later add an exam selector so the
      * student can switch between NEET / JEE / CBSE.
      */
   
     const goal =
       currentGoals[0];
   
   
     console.log(
       "📚 Loading syllabus for:",
       goal
     );
   
   
     try {
   
       await loadSyllabusProgress(
         goal
       );
   
       console.log(
         "✅ Syllabus loaded successfully."
       );
   
     } catch (error) {
   
       console.error(
         "❌ Failed to load syllabus:",
         error
       );
   
       syllabusSection?.classList.add(
         "hidden"
       );
     }
   }



  /* =========================================================
     LOAD STUDENT GOALS
     ========================================================= */

  async function loadGoals() {

    if (!currentUser) {
      return [];
    }

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "student_exam_preferences"
        )
        .select(`
          id,
          student_id,
          exam_type,
          board,
          class_level,
          exam_year,
          enabled,
          created_at,
          updated_at
        `)
        .eq(
          "student_id",
          currentUser.id
        )
        .eq(
          "enabled",
          true
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );

    if (error) {

      console.error(
        "Failed to load exam goals:",
        error
      );

      throw error;
    }

    currentGoals =
      data || [];

    return currentGoals;
  }


  /* =========================================================
     SAVE STUDENT GOALS
     ========================================================= */

  async function saveGoals() {

    if (!currentUser) {

      throw new Error(
        "You are not signed in."
      );
    }

    const selected =
      Array.from(
        document.querySelectorAll(
          'input[name="examGoal"]:checked'
        )
      ).map(
        checkbox =>
          normalizeExamType(
            checkbox.value
          )
      );

    if (!selected.length) {

      throw new Error(
        "Select at least one exam."
      );
    }

    const boardSelected =
      selected.includes("board");

    const board =
      boardSelected
        ? boardSelect?.value || null
        : null;

    const classLevel =
      boardSelected
        ? classSelect?.value || null
        : null;

    const examYear =
      getTargetYear();


    /* ---------------------------------------------------------
       Get existing preference rows
       --------------------------------------------------------- */

    const {
      data: existing,
      error: existingError
    } =
      await supabaseClient
        .from(
          "student_exam_preferences"
        )
        .select("*")
        .eq(
          "student_id",
          currentUser.id
        );

    if (existingError) {
      throw existingError;
    }


    /* ---------------------------------------------------------
       Disable all current goals first
       --------------------------------------------------------- */

    if (existing?.length) {

      const {
        error: disableError
      } =
        await supabaseClient
          .from(
            "student_exam_preferences"
          )
          .update({
            enabled: false,
            updated_at:
              new Date().toISOString()
          })
          .eq(
            "student_id",
            currentUser.id
          );

      if (disableError) {
        throw disableError;
      }
    }


    /* ---------------------------------------------------------
       Enable / create selected goals
       --------------------------------------------------------- */

    for (
      const examType of selected
    ) {

      const existingGoal =
        existing?.find(
          goal =>
            normalizeExamType(
              goal.exam_type
            ) === examType &&
            Number(
              goal.exam_year
            ) ===
              Number(
                examYear
              )
        );

      const payload = {

        student_id:
          currentUser.id,

        exam_type:
          examType,

        board:
          examType === "board"
            ? board
            : null,

        class_level:
          examType === "board"
            ? classLevel
            : null,

        exam_year:
          examYear,

        enabled:
          true,

        updated_at:
          new Date().toISOString()
      };


      if (existingGoal) {

        const {
          error
        } =
          await supabaseClient
            .from(
              "student_exam_preferences"
            )
            .update(payload)
            .eq(
              "id",
              existingGoal.id
            );

        if (error) {
          throw error;
        }

      } else {

        const {
          error
        } =
          await supabaseClient
            .from(
              "student_exam_preferences"
            )
            .insert(payload);

        if (error) {
          throw error;
        }
      }
    }


    await loadGoals();

    closeModal();

    showToast(
      "Exam goals saved successfully."
    );

    await renderDashboard();
  }


  /* =========================================================
     EXAM DATE DATABASE
     ========================================================= */

  async function loadExamDates() {

    if (!currentGoals.length) {
      return [];
    }

    const years =
      [
        ...new Set(
          currentGoals.map(
            goal =>
              Number(
                goal.exam_year
              )
          )
        )
      ];

    const {
      data,
      error
    } =
      await supabaseClient
        .from("exam_dates")
        .select(`
          id,
          exam_type,
          board,
          class_level,
          exam_year,
          exam_name,
          exam_date,
          status,
          source,
          source_url,
          verified_at,
          confidence,
          notes
        `)
        .in(
          "exam_year",
          years
        );

    if (error) {

      console.error(
        "Failed to load exam dates:",
        error
      );

      /*
       * Do not destroy the whole dashboard if
       * exam_dates is temporarily unavailable.
       */

      return [];
    }

      console.log("🔥 EXAM DATES FRONTEND QUERY:", {
        data,
        error,
        count: data?.length || 0
      });
     console.table(
        (data || []).filter(row =>
          [2, 17, 15].includes(row.id)
        ).map(row => ({
          id: row.id,
          exam_type: row.exam_type,
          exam_year: row.exam_year,
          exam_name: row.exam_name,
          exam_date: row.exam_date,
          status: row.status,
          confidence: row.confidence,
          notes: row.notes
        }))
      );
      
      return data || [];
  }


  function findExamDate(
    goal,
    examDates
  ) {

    const goalType =
      normalizeExamType(
        goal.exam_type
      );

    return (
      examDates.find(
        row => {

          if (
            normalizeExamType(
              row.exam_type
            ) !== goalType
          ) {
            return false;
          }

          if (
            Number(
              row.exam_year
            ) !==
            Number(
              goal.exam_year
            )
          ) {
            return false;
          }

          if (
            goalType === "board"
          ) {

            return (
              String(
                row.board || ""
              ).toLowerCase() ===
              String(
                goal.board || ""
              ).toLowerCase()
            ) &&
            String(
              row.class_level || ""
            ) ===
            String(
              goal.class_level || ""
            );
          }

          return true;
        }
      )
    ) || null;
  }


  /* =========================================================
     RESEARCH
     ========================================================= */

  async function researchExam(
    goal
  ) {

    /* ---------------------------------------------------------
       Make sure we have an authenticated session
       --------------------------------------------------------- */

    if (!currentSession) {
      await loadSession();
    }

    if (!currentSession) {

      throw new Error(
        "No authenticated session found."
      );
    }


    /* ---------------------------------------------------------
       Build research request
       --------------------------------------------------------- */

    const payload = {

      exam_type:
        apiExamType(
          goal.exam_type
        ),

      exam_year:
        Number(
          goal.exam_year
        ),

      board:
        normalizeExamType(
          goal.exam_type
        ) === "board"
          ? goal.board
          : null,

      class_level:
        normalizeExamType(
          goal.exam_type
        ) === "board"
          ? goal.class_level
          : null,

      force_refresh:
        true
    };


    console.log(
      "Exam research request:",
      payload
    );


    /* ---------------------------------------------------------
       Get the latest Supabase session
       --------------------------------------------------------- */

    const {
      data: {
        session
      },
      error: sessionError
    } =
      await supabaseClient.auth.getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (
      !session ||
      !session.access_token
    ) {

      throw new Error(
        "No active Supabase access token found."
      );
    }


    /* ---------------------------------------------------------
       Keep local state synchronized
       --------------------------------------------------------- */

    currentSession =
      session;

    currentUser =
      session.user || null;


    console.log(
      "Exam research auth:",
      {
        hasSession: true,
        hasAccessToken:
          !!session.access_token,
        userId:
          session.user?.id ||
          null
      }
    );


    /* ---------------------------------------------------------
       CALL SUPABASE EDGE FUNCTION
       
       IMPORTANT:
       We intentionally use the Supabase client here
       instead of manually calling fetch().
       
       This allows Supabase to handle the authenticated
       Edge Function request correctly.
       --------------------------------------------------------- */

    const {
      data,
      error
    } =
      await supabaseClient.functions.invoke(
        EXAM_RESEARCH_FUNCTION,
        {
          body: payload
        }
      );


    console.log(
      "Exam research function result:",
      {
        data,
        error
      }
    );


    /* ---------------------------------------------------------
       Handle Edge Function errors
       --------------------------------------------------------- */

     if (error) {
       console.error("Exam research Edge Function error:", error);
   
       // Show the actual response returned by the Edge Function
       try {
           if (error.context) {
               const errorBody = await error.context.json();
               console.error(
                   "🔥 EDGE FUNCTION RESPONSE BODY:",
                   errorBody
               );
           }
       } catch (parseError) {
           console.error(
               "Could not read Edge Function response body:",
               parseError
           );
       }
   
       throw error;
   }

    /* ---------------------------------------------------------
       Validate response
       --------------------------------------------------------- */

    if (!data) {

      throw new Error(
        "Exam research returned no data."
      );
    }


    if (data.ok === false) {

      throw new Error(
        data.error ||
        "Exam research failed."
      );
    }


    console.log(
      "Exam research response:",
      data
    );

     console.log(
        "🔥 RESEARCH RESULT:",
        data.research
      );
    
      
     console.log(
        "🔥 SAVED DATABASE RESULT:",
        data.saved
      );


    return data;
  }

/* ===================
===============*/

      function shouldRefreshExamDate(examDate) {
     if (!examDate) {
       return true;
     }
   
     // Official dates are trusted and do not need automatic refresh.
     if (examDate.status === "official") {
       return false;
     }
   
     const verifiedAt = examDate.verified_at
       ? new Date(examDate.verified_at)
       : null;
   
     // If we don't know when it was verified, refresh it.
     if (
       !verifiedAt ||
       Number.isNaN(verifiedAt.getTime())
     ) {
       return true;
     }
   
     const ageMs =
       Date.now() - verifiedAt.getTime();
   
     const ageDays =
       ageMs / (1000 * 60 * 60 * 24);
   
     // Tentative information is refreshed every 7 days.
     if (examDate.status === "tentative") {
       return ageDays >= 7;
     }
   
     // Unavailable information is retried every 3 days.
     if (examDate.status === "unavailable") {
       return ageDays >= 3;
     }
   
     return false;
   }

   async function researchMissingExamGoals(examDates) {

      console.trace(
           "🚨 researchMissingExamGoals() CALLED"
         );

     for (const goal of currentGoals) {
   
       const existingDate =
         findExamDate(
           goal,
           examDates
         );
   
       if (
           existingDate &&
           !shouldRefreshExamDate(existingDate)
         ) {
           continue;
         }
   
       /*
        * Build a unique key for this exam.
        */
       const researchKey =
         normalizeExamType(goal.exam_type) === "board"
           ? `board|${goal.board || ""}|${goal.class_level || ""}|${goal.exam_year}`
           : `${normalizeExamType(goal.exam_type)}|${goal.exam_year}`;
   
       /*
        * Don't repeatedly research the same missing exam
        * during this page session.
        */
       if (autoResearchAttempted.has(researchKey)) {
   
         console.log(
           "⏭️ Automatic research already attempted:",
           researchKey
         );
   
         continue;
       }
   
       /*
        * Mark it BEFORE calling the AI.
        * This prevents duplicate requests if rendering
        * happens again while research is running.
        */
       autoResearchAttempted.add(
         researchKey
       );
   
       if (existingDate) {
           console.log(
             "♻️ Exam date is stale. Automatically refreshing:",
             existingDate
           );
         } else {
           console.log(
             "🔎 No exam date found. Automatically researching:",
             goal
           );
         }
       try {
   
         await researchExam(goal);
          console.log(
           "🔄 Exam research saved. Dashboard will reload exam dates:",
           {
             exam_type: goal.exam_type,
             board: goal.board || null,
             class_level: goal.class_level || null,
             exam_year: goal.exam_year
           }
         );
   
         console.log(
           "✅ Automatic exam research completed:",
           goal
         );
   
       } catch (error) {
   
         console.error(
           "❌ Automatic exam research failed:",
           goal,
           error
         );
   
       }
     }
   }

   
  /* =========================================================
     RENDER DASHBOARD
     ========================================================= */

  async function renderDashboard() {

    hideStatus();

    if (goalCount) {
      goalCount.textContent =
        currentGoals.length;
    }


    if (!currentGoals.length) {

      emptyState?.classList.remove(
        "hidden"
      );

      dashboardSection?.classList.add(
        "hidden"
      );

      if (examGrid) {
        examGrid.innerHTML = "";
      }

      return;
    }


    emptyState?.classList.add(
      "hidden"
    );

    dashboardSection?.classList.remove(
      "hidden"
    );


    let examDates = await loadExamDates();
   
   console.log(
     "🔥 RENDER EXAM DATES:",
     examDates
   );
   
   /* ---------------------------------------------------------
      Automatically research exams that have no database match
      --------------------------------------------------------- */
   
   await researchMissingExamGoals(
     examDates
   );
   
   /*
    * Research may have created new exam_dates rows,
    * so load them again before rendering.
    */
   
   examDates =
     await loadExamDates();
   
   console.log(
     "🔥 EXAM DATES AFTER AUTO RESEARCH:",
     examDates
   );
   
   currentGoals.forEach(goal => {
     console.log(
       "🔥 MATCH TEST:",
       goal,
       "=>",
       findExamDate(
         goal,
         examDates
       )
     );
   });

    if (examGrid) {
      examGrid.innerHTML = "";
    }


    currentGoals.forEach(
      goal => {

        const examDate =
          findExamDate(
            goal,
            examDates
          );

        const card =
          createExamCard(
            goal,
            examDate
          );

        examGrid?.appendChild(
          card
        );
      }
    );


    startCountdownTimer();
  

    await loadSyllabusForCurrentGoal();
  }

   


  




  function createExamCard(
    goal,
    examDate
  ) {

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "exam-card";


    const type =
      normalizeExamType(
        goal.exam_type
      );


    const label =
      getExamLabel(
        goal.exam_type
      );


    const icon =
      getExamIcon(
        goal.exam_type
      );


    const hasDate =
      !!examDate?.exam_date;


    const status =
      examDate?.status ||
      "unavailable";


    const confidence =
      typeof examDate?.confidence ===
        "number"
        ? examDate.confidence
        : null;


    let extraInfo =
      "";


    if (type === "board") {

      extraInfo =
        `<span>${escapeHTML(
          goal.board || ""
        )}</span>
         <span>Class ${escapeHTML(
           goal.class_level || ""
         )}</span>`;

    } else {

      extraInfo =
        `<span>${escapeHTML(
          goal.exam_year
        )}</span>`;
    }


    card.innerHTML = `

      <div class="exam-card-top">

        <div class="exam-icon">
          ${icon}
        </div>

        <div class="exam-title">

          <span class="exam-type">
            ${escapeHTML(label)}
          </span>

          <h3>
            ${escapeHTML(
              examDate?.exam_name ||
              `${label} ${goal.exam_year}`
            )}
          </h3>

          <div class="exam-meta">
            ${extraInfo}
          </div>

        </div>

      </div>


      <div class="exam-date-area">

        ${
          hasDate

            ? `

              <div class="date-label">
                EXAM DATE
              </div>

              <div class="exam-date">
                ${escapeHTML(
                  formatDate(
                    examDate.exam_date
                  )
                )}
              </div>

              <div
                class="countdown"
                data-countdown-date="${
                  escapeHTML(
                    examDate.exam_date
                  )
                }"
              >
                Calculating…
              </div>

            `

            : `

              <div class="date-unavailable">

                <strong>
                  Not officially announced
                </strong>

                <span>
                  The command center will
                  update when a usable date
                  is available.
                </span>

              </div>

            `
        }

      </div>


      <div class="exam-card-footer">

        <div class="research-status">

          ${
            status === "official"

              ? "🟢 Official"

              : status === "tentative"

                ? "🟡 Tentative"

                : "⚪ Unavailable"
          }

        </div>


        ${
          confidence !== null

            ? `

              <div class="confidence">

                Confidence:
                ${Math.round(
                  confidence
                )}%

              </div>

            `

            : ""
        }


        ${
          examDate?.source_url

            ? `

              <a
                class="source-link"
                href="${escapeHTML(
                  examDate.source_url
                )}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source ↗
              </a>

            `

            : ""
        }

      </div>
    `;


    return card;
  }


  /* =========================================================
     COUNTDOWN
     ========================================================= */

  function updateCountdowns() {

    const countdowns =
      document.querySelectorAll(
        "[data-countdown-date]"
      );


    countdowns.forEach(
      element => {

        const date =
          element.dataset
            .countdownDate;


        const countdown =
          calculateCountdown(
            date
          );


        if (!countdown) {

          element.textContent =
            "Countdown unavailable";

          return;
        }


        if (countdown.passed) {

          element.textContent =
            "Exam date has passed";

          return;
        }


        element.innerHTML = `

          <span>
            ${countdown.days}
            <small>days</small>
          </span>

          <span>
            ${String(
              countdown.hours
            ).padStart(2, "0")}
            <small>hrs</small>
          </span>

          <span>
            ${String(
              countdown.minutes
            ).padStart(2, "0")}
            <small>min</small>
          </span>

          <span>
            ${String(
              countdown.seconds
            ).padStart(2, "0")}
            <small>sec</small>
          </span>

        `;
      }
    );
  }


  function startCountdownTimer() {

    clearInterval(
      countdownTimer
    );

    updateCountdowns();

    countdownTimer =
      setInterval(
        updateCountdowns,
        1000
      );
  }


  /* =========================================================
     REFRESH / RESEARCH
     ========================================================= */

  async function refreshCommandCenter() {

    try {

      setButtonLoading(
        refreshBtn,
        true,
        "↻"
      );


      showStatus(
        "Checking your exam timeline…",
        "info"
      );


      const authenticated =
        await requireAuth();


      if (!authenticated) {
        return;
      }


      await loadGoals();


      if (!currentGoals.length) {

        hideStatus();

        await renderDashboard();

        return;
      }


      /*
       * First show whatever is already in exam_dates.
       */

      await renderDashboard();


      /*
       * Then ask the research Edge Function to
       * verify/update each selected exam.
       */

      showStatus(
        "Researching the latest official exam information…",
        "info"
      );


      for (
        const goal of currentGoals
      ) {

        try {

          await researchExam(
            goal
          );

        } catch (
          researchError
        ) {

          console.error(
            `Research failed for ${goal.exam_type}:`,
            researchError
          );


          showStatus(
            `Research failed for ${getExamLabel(goal.exam_type)}. Check the browser console for the exact error.`,
            "error"
          );


          /*
           * Continue with other goals.
           */
        }
      }


      /*
       * Reload the database after research.
       */

      await renderDashboard();


      showStatus(
        "Exam Command Center updated.",
        "success"
      );


      setTimeout(
        hideStatus,
        4000
      );


    } catch (error) {

      console.error(
        "Exam Command Center error:",
        error
      );


      showStatus(
        error?.message ||
        "Something went wrong while loading the Exam Command Center.",
        "error"
      );


    } finally {

      setButtonLoading(
        refreshBtn,
        false
      );
    }
  }


  /* =========================================================
     EVENTS
     ========================================================= */

  if (emptySetupBtn) {

    emptySetupBtn.addEventListener(
      "click",
      () => {

        restoreGoalCheckboxes();

        openModal();
      }
    );
  }


  if (manageGoalsBtn) {

    manageGoalsBtn.addEventListener(
      "click",
      () => {

        restoreGoalCheckboxes();

        openModal();
      }
    );
  }


  if (closeModalBtn) {

    closeModalBtn.addEventListener(
      "click",
      closeModal
    );
  }


  if (cancelSetupBtn) {

    cancelSetupBtn.addEventListener(
      "click",
      closeModal
    );
  }


  if (setupModal) {

    setupModal.addEventListener(
      "click",
      event => {

        if (
          event.target.matches(
            "[data-close-modal]"
          )
        ) {

          closeModal();
        }
      }
    );
  }


  document
    .querySelectorAll(
      'input[name="examGoal"]'
    )
    .forEach(
      checkbox => {

        checkbox.addEventListener(
          "change",
          syncBoardFields
        );
      }
    );


  if (saveGoalsBtn) {

    saveGoalsBtn.addEventListener(
      "click",
      async () => {

        try {

          setButtonLoading(
            saveGoalsBtn,
            true,
            "Saving…"
          );


          await saveGoals();


        } catch (error) {

          console.error(
            "Save goals error:",
            error
          );


          showToast(
            error?.message ||
            "Could not save exam goals."
          );


        } finally {

          setButtonLoading(
            saveGoalsBtn,
            false
          );
        }
      }
    );
  }


  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      refreshCommandCenter
    );
  }


  /* =========================================================
     AUTH STATE CHANGES
     ========================================================= */

  supabaseClient.auth.onAuthStateChange(
  (
    _event,
    session
  ) => {

    currentSession =
      session;

    currentUser =
      session?.user ||
      null;


    if (!currentUser) {

      currentGoals = [];


      if (userLabel) {

        userLabel.textContent =
          "Not signed in";
      }


      if (goalCount) {

        goalCount.textContent =
          "0";
      }


      emptyState?.classList.add(
        "hidden"
      );

      dashboardSection?.classList.add(
        "hidden"
      );

      return;
    }

    /*
     * IMPORTANT:
     * Do NOT call renderDashboard() here.
     *
     * Supabase may fire auth-state events during
     * initialization/token refresh. Rendering here
     * can repeatedly trigger automatic exam research.
     *
     * Initial dashboard loading is handled separately.
     */
  }
);
/* =========================================================
   INITIALIZE
   ========================================================= */

async function init() {

  console.log(
    "🎯 Exam Command Center starting…"
  );


  try {

    const authenticated =
      await requireAuth();


    if (!authenticated) {
      return;
    }


    await loadGoals();


    console.log(
      "Enabled exam goals:",
      currentGoals
    );


    /*
     * renderDashboard() now handles:
     *
     * 1. Loading existing exam dates
     * 2. Detecting missing exams
     * 3. Automatically researching missing exams
     * 4. Reloading the saved results
     * 5. Rendering the dashboard
     *
     * The old "research every exam on startup"
     * system has intentionally been removed.
     */

    await renderDashboard();


    console.log(
      "✅ Exam Command Center ready."
    );


  } catch (error) {

    console.error(
      "❌ Exam Command Center failed:",
      error
    );


    showStatus(
      error?.message ||
      "Unable to start the Exam Command Center.",
      "error"
    );
  }
}


/* =========================================================
   START
   ========================================================= */

init();

