/* =========================================================
   NOW-or-NEVER — STUDY SQUAD
   STEP 4A — CLASSROOM VIEW
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

const $ = id =>
  document.getElementById(id);


function showToast(message) {

  const toast =
    $("squadToast");

  if (!toast) return;

  toast.textContent =
    message;

  toast.classList.add("show");

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 2600);

}


/* =========================================================
   CURRENT USER
   ========================================================= */

let currentUser = null;
let activeClassroomId = null;

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


  list.innerHTML = `
    <div class="classroom-empty">

      <div class="empty-icon">
        ⏳
      </div>

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

        <div class="empty-icon">
          ⚠️
        </div>

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


  list.innerHTML =
    data
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
                ${escapeHtml(
                  formatExamType(
                    classroom.exam_type
                  )
                )}
              </div>

            </div>


            <h4>
              ${escapeHtml(classroom.name)}
            </h4>


            ${
              classroom.description
                ? `
                  <p class="classroom-description">
                    ${escapeHtml(
                      classroom.description
                    )}
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
                data-classroom-id="${escapeHtml(
                  classroom.id
                )}"
              >
                Join
              </button>

            </div>

          </article>
        `;

      })
      .join("");


  list
    .querySelectorAll(
      ".join-classroom-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          joinClassroom(
            button.dataset.classroomId,
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
      "Opening...";

  }


  /* -------------------------------------------------------
     CHECK MEMBERSHIP
     ------------------------------------------------------- */

  const {
    data: existingMember,
    error: existingError
  } =
    await supabaseClient
      .from("study_classroom_members")
      .select("id")
      .eq(
        "classroom_id",
        classroomId
      )
      .eq(
        "user_id",
        currentUser.id
      )
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


  /* -------------------------------------------------------
     ALREADY MEMBER
     ------------------------------------------------------- */

  if (existingMember) {

    restoreJoinButton(
      button,
      "Open"
    );

    openClassroom(
      classroomId
    );

    return;
  }


  /* -------------------------------------------------------
     JOIN
     ------------------------------------------------------- */

  const {
    error: joinError
  } =
    await supabaseClient
      .from("study_classroom_members")
      .insert({
        classroom_id:
          classroomId,

        user_id:
          currentUser.id
      });


  if (joinError) {

    console.error(
      "[Study Squad] Failed to join classroom:",
      joinError
    );

    showToast(
      "Couldn't join the classroom."
    );

    restoreJoinButton(
      button
    );

    return;
  }


  showToast(
    "Joined the Study Squad! 🎉"
  );


  restoreJoinButton(
    button,
    "Open"
  );


  openClassroom(
    classroomId
  );

}


/* =========================================================
   OPEN CLASSROOM
   ========================================================= */

async function openClassroom(
  classroomId
) {
   activeClassroomId = classroomId;

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
      .eq(
        "id",
        classroomId
      )
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


  /* -------------------------------------------------------
     ELEMENTS
     ------------------------------------------------------- */

  const classroomDirectory =
    $("classroomList")
      ?.closest(
        ".squad-card"
      );


  const classroomRoom =
    $("classroomRoom");


  if (!classroomRoom) {

    console.error(
      "[Study Squad] classroomRoom not found."
    );

    showToast(
      "Classroom screen is missing."
    );

    return;
  }


  /* -------------------------------------------------------
     FILL CLASSROOM DETAILS
     ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     HIDE CLASSROOM DIRECTORY
     
     IMPORTANT:
     We DON'T move the classroom room in the DOM.
     We simply hide the directory and show the room.
     
     This makes the room occupy the same visual
     position without duplicate declarations or
     DOM-position problems.
     ------------------------------------------------------- */

  if (classroomDirectory) {

    classroomDirectory
      .classList
      .add("hidden");

  }


  /* -------------------------------------------------------
     HIDE HERO
     ------------------------------------------------------- */

  document
    .querySelector(
      ".squad-hero"
    )
    ?.classList
    .add("hidden");


  /* -------------------------------------------------------
     HIDE ACTION BUTTONS
     ------------------------------------------------------- */

  document
    .querySelector(
      ".squad-actions"
    )
    ?.classList
    .add("hidden");


  /* -------------------------------------------------------
     SHOW CLASSROOM
     ------------------------------------------------------- */

  classroomRoom
    .classList
    .remove("hidden");


  /* -------------------------------------------------------
     GO TO TOP
     ------------------------------------------------------- */

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
   BACK TO CLASSROOMS
   ========================================================= */

$("backToClassroomsBtn")
  ?.addEventListener(
    "click",
    () => {

      const classroomRoom =
        $("classroomRoom");


      const classroomDirectory =
        $("classroomList")
          ?.closest(
            ".squad-card"
          );


      /* Hide room */

      if (classroomRoom) {

        classroomRoom
          .classList
          .add("hidden");

      }


      /* Show classroom directory */

      if (classroomDirectory) {

        classroomDirectory
          .classList
          .remove("hidden");

      }


      /* Show hero */

      document
        .querySelector(
          ".squad-hero"
        )
        ?.classList
        .remove("hidden");


      /* Show actions */

      document
        .querySelector(
          ".squad-actions"
        )
        ?.classList
        .remove("hidden");


      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );


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


  if (!name) {

    showToast(
      "Enter a classroom name."
    );

    $("classroomName")
      ?.focus();

    return;
  }


  if (!subject) {

    showToast(
      "Select a subject."
    );

    $("classroomSubject")
      ?.focus();

    return;
  }


  if (!examType) {

    showToast(
      "Select an exam."
    );

    $("classroomExam")
      ?.focus();

    return;
  }


  const saveButton =
    $("saveClassroomBtn");


  if (saveButton) {

    saveButton.disabled =
      true;

    saveButton.textContent =
      "Creating...";

  }


  const {
    data: classroom,
    error: classroomError
  } =
    await supabaseClient
      .from("study_classrooms")
      .insert({
        name,
        subject,
        exam_type:
          examType,
        description:
          description || null,
        created_by:
          currentUser.id
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


  /* -------------------------------------------------------
     ADD CREATOR AS MEMBER
     ------------------------------------------------------- */

  const {
    error: memberError
  } =
    await supabaseClient
      .from(
        "study_classroom_members"
      )
      .insert({
        classroom_id:
          classroom.id,

        user_id:
          currentUser.id
      });


  if (memberError) {

    console.error(
      "[Study Squad] Creator membership failed:",
      memberError
    );

    showToast(
      "Classroom created, but joining failed."
    );

  } else {

    showToast(
      "Classroom created! 🎉"
    );

  }


  clearCreateClassroomForm();

  closeCreateClassroomModal();

  await loadClassrooms();

  restoreSaveButton();

}


/* =========================================================
   SAVE CLASSROOM BUTTON
   ========================================================= */

$("saveClassroomBtn")
  ?.addEventListener(
    "click",
    createClassroom
  );


/* =========================================================
   BROWSE CLASSROOMS BUTTON
   ========================================================= */

$("browseClassroomsBtn")
  ?.addEventListener(
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
   CLEAR CREATE FORM
   ========================================================= */

function clearCreateClassroomForm() {

  if ($("classroomName")) {

    $("classroomName").value =
      "";

  }


  if ($("classroomSubject")) {

    $("classroomSubject").value =
      "";

  }


  if ($("classroomExam")) {

    $("classroomExam").value =
      "";

  }


  if ($("classroomDescription")) {

    $("classroomDescription").value =
      "";

  }

}


/* =========================================================
   RESTORE SAVE BUTTON
   ========================================================= */

function restoreSaveButton() {

  const button =
    $("saveClassroomBtn");

  if (!button) return;

  button.disabled =
    false;

  button.textContent =
    "Create Classroom";

}


/* =========================================================
   RESTORE JOIN BUTTON
   ========================================================= */

function restoreJoinButton(
  button,
  text = "Join"
) {

  if (!button) return;

  button.disabled =
    false;

  button.textContent =
    text;

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

function escapeHtml(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}

/* =========================================================
   SEND CLASSROOM MESSAGE
   STEP 4B.2
   ========================================================= */

$("classroomMessageForm")
  ?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      /* ---------------------------------------------------
         BASIC CHECKS
         --------------------------------------------------- */

      if (!currentUser) {

        showToast(
          "Please log in first."
        );

        return;
      }


      if (!activeClassroomId) {

        showToast(
          "No classroom is currently open."
        );

        return;
      }


      const input =
        $("classroomMessageInput");

      const sendButton =
        $("sendClassroomMessageBtn");


      if (!input) return;


      const message =
        input.value.trim();


      /* ---------------------------------------------------
         DON'T SEND EMPTY MESSAGES
         --------------------------------------------------- */

      if (!message) {

        input.focus();

        return;
      }


      /* ---------------------------------------------------
         1000 CHARACTER LIMIT
         --------------------------------------------------- */

      if (message.length > 1000) {

        showToast(
          "Message is too long."
        );

        return;
      }


      /* ---------------------------------------------------
         DISABLE SEND WHILE SAVING
         --------------------------------------------------- */

      if (sendButton) {

        sendButton.disabled =
          true;

        sendButton.textContent =
          "…";

      }


      try {

        /* -----------------------------------------------
           INSERT MESSAGE
           ----------------------------------------------- */

        const {
          error
        } =
          await supabaseClient
            .from("study_messages")
            .insert({

              classroom_id:
                activeClassroomId,

              sender_id:
                currentUser.id,

              message:
                message,

              message_type:
                "student"

            });


        /* -----------------------------------------------
           HANDLE ERROR
           ----------------------------------------------- */

        if (error) {

          console.error(
            "[Study Squad] Failed to send message:",
            error
          );

          showToast(
            "Couldn't send message."
          );

          return;
        }


        /* -----------------------------------------------
           SUCCESS
           ----------------------------------------------- */

        input.value = "";


        /*
         * Keep the input focused so the student
         * can immediately type another message.
         */

        input.focus();


        console.log(
          "[Study Squad] Message sent successfully."
        );


      } finally {

        if (sendButton) {

          sendButton.disabled =
            false;

          sendButton.textContent =
            "➤";

        }

      }

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


    if (!data?.session) {

      console.log(
        "[Study Squad] No active session."
      );

      window.location.href =
        "index.html";

      return;
    }


    currentUser =
      data.session.user;


    console.log(
      "[Study Squad] Logged in:",
      currentUser.id
    );


    await loadClassrooms();

  }
);
