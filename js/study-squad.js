/* =========================================================
   NOW-or-NEVER — STUDY SQUAD
   STEP 3 — DATABASE CONNECTION
   ========================================================= */

const SUPABASE_URL =
  "https://kvbbgvfrllptqpbkixnv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";

const supabaseClient =
  window.supabase.createClient(
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


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);


function showToast(message) {

  const toast = $("squadToast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}


/* =========================================================
   CURRENT USER
   ========================================================= */

let currentUser = null;


/* =========================================================
   CREATE CLASSROOM MODAL
   ========================================================= */

const createClassroomBtn =
  $("createClassroomBtn");

const createClassroomModal =
  $("createClassroomModal");

const createClassroomBackdrop =
  $("createClassroomBackdrop");

const closeCreateClassroom =
  $("closeCreateClassroom");


function openCreateClassroom() {

  if (!createClassroomModal) return;

  createClassroomModal
    .classList
    .remove("hidden");

}


function closeCreateClassroomModal() {

  if (!createClassroomModal) return;

  createClassroomModal
    .classList
    .add("hidden");

}


createClassroomBtn?.addEventListener(
  "click",
  openCreateClassroom
);


closeCreateClassroom?.addEventListener(
  "click",
  closeCreateClassroomModal
);


createClassroomBackdrop?.addEventListener(
  "click",
  closeCreateClassroomModal
);


/* =========================================================
   LOAD CLASSROOMS
   ========================================================= */

async function loadClassrooms() {

  const list =
    $("classroomList");

  if (!list) return;


  /*
   * Loading state
   */

  list.innerHTML = `
    <div class="classroom-empty">
      <div class="empty-icon">⏳</div>

      <strong>
        Loading classrooms...
      </strong>

      <p>
        Finding active Study Squads.
      </p>
    </div>
  `;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("study_classrooms")
      .select(`
        id,
        name,
        subject,
        exam_type,
        description,
        created_by,
        created_at
      `)
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(
      "[Study Squad] Failed to load classrooms:",
      error
    );

    list.innerHTML = `
      <div class="classroom-empty">
        <div class="empty-icon">⚠️</div>

        <strong>
          Couldn't load classrooms
        </strong>

        <p>
          ${escapeHtml(error.message)}
        </p>
      </div>
    `;

    return;
  }


  /*
   * No classrooms
   */

  if (!data || data.length === 0) {

    list.innerHTML = `
      <div class="classroom-empty">

        <div class="empty-icon">
          👥
        </div>

        <strong>
          No classrooms yet
        </strong>

        <p>
          Be the first student to create a Study Squad.
        </p>

      </div>
    `;

    return;
  }


  /*
   * Render classrooms
   */

  list.innerHTML = data
    .map(classroom => {

      return `
        <article
          class="classroom-item"
          data-classroom-id="${escapeHtml(classroom.id)}"
        >

          <div class="classroom-item-top">

            <div class="classroom-subject">
              ${escapeHtml(classroom.subject)}
            </div>

            <div class="classroom-exam">
              ${escapeHtml(formatExamType(classroom.exam_type))}
            </div>

          </div>


          <h4>
            ${escapeHtml(classroom.name)}
          </h4>


          ${
            classroom.description
              ? `
                <p class="classroom-description">
                  ${escapeHtml(classroom.description)}
                </p>
              `
              : ""
          }


          <div class="classroom-item-bottom">

            <span>
              👥 Study Squad
            </span>

            <button
              type="button"
              class="join-classroom-btn"
              data-classroom-id="${escapeHtml(classroom.id)}"
            >
              Join
            </button>

          </div>

        </article>
      `;

    })
    .join("");


  /*
   * Add Join listeners
   */

  list
    .querySelectorAll(".join-classroom-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const classroomId =
            button.dataset.classroomId;

          joinClassroom(
            classroomId,
            button
          );

        }
      );

    });

}


/* =========================================================
   JOIN CLASSROOM
   ========================================================= */

async function joinClassroom(
  classroomId,
  button
) {

  if (!currentUser) {

    showToast(
      "Please log in first."
    );

    return;
  }


  if (button) {

    button.disabled = true;

    button.textContent =
      "Joining...";
  }


  /*
   * Check whether already a member.
   */

  const {
    data: existingMember,
    error: existingError
  } =
    await supabaseClient
      .from("study_classroom_members")
      .select("id")
      .eq("classroom_id", classroomId)
      .eq("user_id", currentUser.id)
      .maybeSingle();


  if (existingError) {

    console.error(
      "[Study Squad] Membership check failed:",
      existingError
    );

    showToast(
      "Couldn't check classroom membership."
    );

    restoreJoinButton(button);

    return;
  }


  /*
   * Already joined.
   */

    if (existingMember) {

    showToast(
      "Opening classroom..."
    );

    restoreJoinButton(
      button,
      "Open"
    );

    openClassroom(classroomId);

    return;
  }

  /*
   * Join classroom.
   */

  const {
    error: joinError
  } =
    await supabaseClient
      .from("study_classroom_members")
      .insert({
        classroom_id: classroomId,
        user_id: currentUser.id
      });


  if (joinError) {

    console.error(
      "[Study Squad] Failed to join classroom:",
      joinError
    );

    showToast(
      "Couldn't join the classroom."
    );

    restoreJoinButton(button);

    return;
  }


  showToast(
    "Joined the Study Squad! 🎉"
  );

  restoreJoinButton(
    button,
    "Open"
  );

  openClassroom(classroomId);

}

/* =========================================================
   OPEN CLASSROOM
   ========================================================= */

async function openClassroom(classroomId) {

  console.log(
    "[Study Squad] Opening classroom:",
    classroomId
  );


  const {
    data: classroom,
    error
  } =
    await supabaseClient
      .from("study_classrooms")
      .select(`
        id,
        name,
        subject,
        exam_type
      `)
      .eq("id", classroomId)
      .maybeSingle();


  if (error) {

    console.error(
      "[Study Squad] Failed to open classroom:",
      error
    );

    showToast(
      "Couldn't open classroom."
    );

    return;
  }


  if (!classroom) {

    showToast(
      "Classroom not found."
    );

    return;
  }


  const classroomList =
    $("classroomList");

  const classroomDirectory =
    classroomList?.closest(
      ".squad-card"
    );

  const classroomRoom =
    $("classroomRoom");


  if (!classroomRoom) {

    console.error(
      "[Study Squad] classroomRoom element not found."
    );

    showToast(
      "Classroom screen is missing."
    );

    return;
  }


  /*
   * Fill classroom information.
   */

  if ($("roomSubject")) {

    $("roomSubject").textContent =
      classroom.subject;
  }


  if ($("roomTitle")) {

    $("roomTitle").textContent =
      classroom.name;
  }


  if ($("roomExam")) {

    $("roomExam").textContent =
      formatExamType(
        classroom.exam_type
      );
  }


  /*
   * Hide classroom directory.
   */

  if (classroomDirectory) {

    classroomDirectory.classList.add(
      "hidden"
    );
  }


  /*
   * Hide the hero/actions while inside
   * the classroom.
   */

  document
    .querySelector(".squad-hero")
    ?.classList
    .add("hidden");

  document
    .querySelector(".squad-actions")
    ?.classList
    .add("hidden");


  /*
   * Show classroom.
   */

  classroomRoom.classList.remove(
    "hidden"
  );


  /*
   * Scroll to the top.
   */

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  console.log(
    "[Study Squad] Classroom opened:",
    classroom.name
  );

}
/* =========================================================
   CREATE CLASSROOM
   ========================================================= */

async function createClassroom() {

  if (!currentUser) {

    showToast(
      "Please log in first."
    );

    return;
  }


  const name =
    $("classroomName")
      ?.value
      .trim();


  const subject =
    $("classroomSubject")
      ?.value
      .trim();


  const examType =
    $("classroomExam")
      ?.value
      .trim();


  const description =
    $("classroomDescription")
      ?.value
      .trim();


  /*
   * Validation
   */

  if (!name) {

    showToast(
      "Enter a classroom name."
    );

    $("classroomName")?.focus();

    return;
  }


  if (!subject) {

    showToast(
      "Select a subject."
    );

    $("classroomSubject")?.focus();

    return;
  }


  if (!examType) {

    showToast(
      "Select an exam."
    );

    $("classroomExam")?.focus();

    return;
  }


  const saveButton =
    $("saveClassroomBtn");


  if (saveButton) {

    saveButton.disabled = true;

    saveButton.textContent =
      "Creating...";
  }


  /*
   * Create classroom.
   */

  const {
    data: classroom,
    error: classroomError
  } =
    await supabaseClient
      .from("study_classrooms")
      .insert({
        name,
        subject,
        exam_type: examType,
        description: description || null,
        created_by: currentUser.id
      })
      .select()
      .single();


  if (classroomError) {

    console.error(
      "[Study Squad] Classroom creation failed:",
      classroomError
    );

    showToast(
      "Couldn't create classroom."
    );

    restoreSaveButton();

    return;
  }


  /*
   * Automatically add creator as first member.
   */

  const {
    error: memberError
  } =
    await supabaseClient
      .from("study_classroom_members")
      .insert({
        classroom_id: classroom.id,
        user_id: currentUser.id
      });


  if (memberError) {

    console.error(
      "[Study Squad] Creator membership failed:",
      memberError
    );

    /*
     * The classroom exists but membership failed.
     * We don't delete it automatically because
     * we want to preserve the created classroom.
     */

    showToast(
      "Classroom created, but joining failed."
    );

  } else {

    showToast(
      "Classroom created! 🎉"
    );

  }


  /*
   * Clear form.
   */

  clearCreateClassroomForm();


  /*
   * Close modal.
   */

  closeCreateClassroomModal();


  /*
   * Reload classrooms.
   */

  await loadClassrooms();


  restoreSaveButton();

}


/* =========================================================
   SAVE BUTTON
   ========================================================= */

$("saveClassroomBtn")?.addEventListener(
  "click",
  createClassroom
);


/* =========================================================
   BROWSE BUTTON
   ========================================================= */

$("browseClassroomsBtn")?.addEventListener(
  "click",
  () => {

    const list =
      $("classroomList");

    if (!list) return;

    list.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }
);


/* =========================================================
   CLEAR FORM
   ========================================================= */

function clearCreateClassroomForm() {

  if ($("classroomName")) {
    $("classroomName").value = "";
  }

  if ($("classroomSubject")) {
    $("classroomSubject").value = "";
  }

  if ($("classroomExam")) {
    $("classroomExam").value = "";
  }

  if ($("classroomDescription")) {
    $("classroomDescription").value = "";
  }

}


/* =========================================================
   BUTTON RESTORATION
   ========================================================= */

function restoreSaveButton() {

  const button =
    $("saveClassroomBtn");

  if (!button) return;

  button.disabled = false;

  button.textContent =
    "Create Classroom";
}


function restoreJoinButton(
  button,
  text = "Join"
) {

  if (!button) return;

  button.disabled = false;

  button.textContent = text;

}


/* =========================================================
   FORMAT EXAM TYPE
   ========================================================= */

function formatExamType(
  examType
) {

  switch (examType) {

    case "NEET":
      return "NEET";

    case "BOARD":
      return "Board";

    case "BOTH":
      return "NEET + Board";

    default:
      return examType || "Exam";

  }

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

  if (value === null ||
      value === undefined) {

    return "";
  }


  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

/* =========================================================
   BACK TO CLASSROOMS
   ========================================================= */

$("backToClassroomsBtn")?.addEventListener(
  "click",
  () => {

    const classroomRoom =
      $("classroomRoom");

    if (classroomRoom) {

      classroomRoom.classList.add(
        "hidden"
      );

    }


    document
      .querySelector(".squad-hero")
      ?.classList
      .remove("hidden");


    document
      .querySelector(".squad-actions")
      ?.classList
      .remove("hidden");


    const classroomDirectory =
      $("classroomList")
        ?.closest(".squad-card");


    if (classroomDirectory) {

      classroomDirectory.classList.remove(
        "hidden"
      );

    }


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }
);

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "[Study Squad] Initializing..."
    );


    /*
     * Get current Supabase session.
     */

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .getSession();


    if (error) {

      console.error(
        "[Study Squad] Session error:",
        error
      );

      showToast(
        "Couldn't check your login."
      );

      return;
    }


    /*
     * No logged-in user.
     */

    if (!data?.session) {

      console.log(
        "[Study Squad] No active session."
      );

      window.location.href =
        "index.html";

      return;
    }


    /*
     * Store current user.
     */

    currentUser =
      data.session.user;


    console.log(
      "[Study Squad] Logged in:",
      currentUser.id
    );


    /*
     * Load real classrooms.
     */

    await loadClassrooms();

  }
);
