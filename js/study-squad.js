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
let classroomRealtimeChannel = null;
let classroomPresenceChannel = null;
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
    
   await loadClassroomMessages();
   await setupMentorDashboard();
   subscribeToClassroomMessages();
   startClassroomPresence();
   stopMentorDashboardPolling();


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

      if (classroomPresenceChannel) {

        supabaseClient.removeChannel(
          classroomPresenceChannel
        );
      
        classroomPresenceChannel = null;
      
      }
      
            const classroomRoom =
              $("classroomRoom");
      
      
            const classroomDirectory =
              $("classroomList")
                ?.closest(
                  ".squad-card"
                );
            if (classroomRealtimeChannel) {
      
              supabaseClient
                .removeChannel(
                  classroomRealtimeChannel
                );
            
              classroomRealtimeChannel = null;
            
            }
      

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
   CLASSROOM PRESENCE
   STEP 4B.6A
   ========================================================= */

function startClassroomPresence() {

  if (!activeClassroomId || !currentUser) {
    return;
  }


  /* Remove an old presence channel if one exists */

  if (classroomPresenceChannel) {

    supabaseClient.removeChannel(
      classroomPresenceChannel
    );

    classroomPresenceChannel = null;
  }


  const channelName =
    `study-presence-${activeClassroomId}`;


  classroomPresenceChannel =
    supabaseClient
      .channel(channelName);

   classroomPresenceChannel.on(
        "presence",
        {
          event: "sync"
        },
        () => {
      
          const activeUsers =
            getActiveClassroomUsers();
      
          console.log(
            "[Study Squad] Active students:",
            activeUsers
          );
      
          console.log(
            "[Study Squad] Active student count:",
            activeUsers.length
          );
         const activeCount =
              $("classroomActiveCount");
            
            if (activeCount) {
            
              const count =
                activeUsers.length;
            
              activeCount.textContent =
                `🟢 ${count} ${
                  count === 1
                    ? "student"
                    : "students"
                } active`;

               const activePanel =
                 $("activeStudentsPanel");
               
               if (
                 activePanel &&
                 !activePanel.classList.contains("hidden")
               ) {
               
                 showActiveStudents();
               
               }
            
            }
      
        }
      );


  classroomPresenceChannel
    .subscribe(async (status) => {

      console.log(
        "[Study Squad] Presence status:",
        status
      );


      if (status === "SUBSCRIBED") {

        const trackStatus =
          await classroomPresenceChannel.track({

            user_id:
              currentUser.id,

            joined_at:
              new Date().toISOString()

          });


        console.log(
          "[Study Squad] Presence tracked:",
          trackStatus
        );

      }

    });

}

/* =========================================================
   GET ACTIVE CLASSROOM USERS
   STEP 4B.6B
   ========================================================= */

function getActiveClassroomUsers() {

  if (!classroomPresenceChannel) {
    return [];
  }

  const state =
    classroomPresenceChannel.presenceState();

  const users = [];

  Object.values(state).forEach(
    presences => {

      presences.forEach(
        presence => {

          if (
            presence.user_id &&
            !users.includes(
              presence.user_id
            )
          ) {

            users.push(
              presence.user_id
            );

          }

        }
      );

    }
  );

  return users;

}

/* =========================================================
   ACTIVE STUDENT LIST
   STEP 4B.6D
   ========================================================= */

async function showActiveStudents() {

  const panel =
    $("activeStudentsPanel");

  const list =
    $("activeStudentsList");

  if (!panel || !list) {
    return;
  }


  const activeUsers =
    getActiveClassroomUsers();


  if (!activeUsers.length) {

    list.innerHTML = `
      <div class="active-student-item">
        No active students.
      </div>
    `;

    panel.classList.remove("hidden");

    return;
  }


  list.innerHTML = `
    <div class="active-student-item">
      Loading students...
    </div>
  `;

  panel.classList.remove("hidden");


  /* -------------------------------------------------------
     LOAD PROFILES
     ------------------------------------------------------- */

  const {
    data: profiles,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(`
        id,
        username,
        display_name
      `)
      .in(
        "id",
        activeUsers
      );


  if (error) {

    console.error(
      "[Study Squad] Failed to load active students:",
      error
    );

    list.innerHTML = `
      <div class="active-student-item">
        Couldn't load students.
      </div>
    `;

    return;
  }


  const profileMap =
    new Map();

  (profiles || []).forEach(
    profile => {

      profileMap.set(
        profile.id,
        profile
      );

    }
  );


  /* -------------------------------------------------------
     RENDER
     ------------------------------------------------------- */

  list.innerHTML =
    activeUsers
      .map(userId => {

        const profile =
          profileMap.get(userId);


        const isMe =
          currentUser &&
          userId === currentUser.id;


        const name =
          isMe
            ? "You"
            : (
                profile?.display_name ||
                profile?.username ||
                "Student"
              );


        return `
          <div
            class="active-student-item"
          >

            <span
              class="active-student-dot"
            ></span>

            <span
              class="active-student-name"
            >
              ${escapeHtml(name)}
            </span>

          </div>
        `;

      })
      .join("");

}

/* =========================================================
   ACTIVE STUDENT PANEL CONTROLS
   ========================================================= */

$("classroomActiveCount")
  ?.addEventListener(
    "click",
    () => {

      showActiveStudents();

    }
  );


$("closeActiveStudents")
  ?.addEventListener(
    "click",
    () => {

      $("activeStudentsPanel")
        ?.classList
        .add("hidden");

    }
  );
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
   LOAD CLASSROOM MESSAGES
   STEP 4B.3
   ========================================================= */

async function loadClassroomMessages() {

  const messagesContainer =
    $("classroomMessages");

  if (!messagesContainer) {
    console.error(
      "[Study Squad] classroomMessages element not found."
    );
    return;
  }

  if (!activeClassroomId) {
    console.error(
      "[Study Squad] No active classroom."
    );
    return;
  }


  /* -------------------------------------------------------
     LOADING STATE
     ------------------------------------------------------- */

  messagesContainer.innerHTML = `
    <div class="chat-empty">
      <div class="chat-empty-icon">
        ⏳
      </div>

      <h3>
        Loading discussion...
      </h3>

      <p>
        Getting the classroom messages.
      </p>
    </div>
  `;


  /* -------------------------------------------------------
     GET MESSAGES
     ------------------------------------------------------- */

  const {
    data: messages,
    error
  } =
    await supabaseClient
      .from("study_messages")
      .select(`
        id,
        classroom_id,
        sender_id,
        message,
        message_type,
        created_at
      `)
      .eq(
        "classroom_id",
        activeClassroomId
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  /* -------------------------------------------------------
     ERROR
     ------------------------------------------------------- */

  if (error) {

    console.error(
      "[Study Squad] Failed to load messages:",
      error
    );

    messagesContainer.innerHTML = `
      <div class="chat-empty">

        <div class="chat-empty-icon">
          ⚠️
        </div>

        <h3>
          Couldn't load messages
        </h3>

        <p>
          Please try refreshing the classroom.
        </p>

      </div>
    `;

    return;
  }


  /* -------------------------------------------------------
     NO MESSAGES
     ------------------------------------------------------- */

  if (!messages || messages.length === 0) {

    messagesContainer.innerHTML = `
      <div class="chat-empty">

        <div class="chat-empty-icon">
          💬
        </div>

        <h3>
          Start the discussion
        </h3>

        <p>
          Ask a question, share an explanation,
          or help another student.
        </p>

      </div>
    `;

    return;
  }


  /* -------------------------------------------------------
     GET UNIQUE SENDERS
     ------------------------------------------------------- */

  const senderIds = [
    ...new Set(
      messages.map(
        message => message.sender_id
      )
    )
  ];


  /* -------------------------------------------------------
     LOAD PROFILES
     ------------------------------------------------------- */

  const {
    data: profiles,
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .select(`
        id,
        username,
        display_name
      `)
      .in(
        "id",
        senderIds
      );


  if (profileError) {

    console.error(
      "[Study Squad] Failed to load profiles:",
      profileError
    );

  }


  /* -------------------------------------------------------
     PROFILE LOOKUP
     ------------------------------------------------------- */

  const profileMap =
    new Map();

  (profiles || []).forEach(
    profile => {

      profileMap.set(
        profile.id,
        profile
      );

    }
  );


  /* -------------------------------------------------------
     RENDER MESSAGES
     ------------------------------------------------------- */

  messagesContainer.innerHTML =
    messages
      .map(message => {

        const profile =
          profileMap.get(
            message.sender_id
          );


        const isMine =
          currentUser &&
          message.sender_id ===
            currentUser.id;


        const senderName =
          isMine
            ? "You"
            : (
                profile?.display_name ||
                profile?.username ||
                "Student"
              );


        const messageTime =
          formatMessageTime(
            message.created_at
          );


        const messageType =
          message.message_type ||
          "student";


        return `
          <div
            class="chat-message ${
              isMine
                ? "chat-message-mine"
                : "chat-message-other"
            }"
            data-message-id="${escapeHtml(
              message.id
            )}"
          >

            <div class="chat-message-header">

              <span class="chat-sender">
                ${escapeHtml(senderName)}
              </span>

              <span class="chat-time">
                ${escapeHtml(messageTime)}
              </span>

            </div>


            <div class="chat-message-body">

              ${escapeHtml(
                message.message
              )}

            </div>

          </div>
        `;

      })
      .join("");


  /* -------------------------------------------------------
     SCROLL TO BOTTOM
     ------------------------------------------------------- */

  messagesContainer.scrollTop =
    messagesContainer.scrollHeight;


  console.log(
    "[Study Squad] Loaded",
    messages.length,
    "messages."
  );

}


/* =========================================================
   MESSAGE TIME FORMAT
   ========================================================= */

function formatMessageTime(
  timestamp
) {

  if (!timestamp) {
    return "";
  }


  const date =
    new Date(timestamp);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toLocaleString(
    [],
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}

/* =========================================================
   CLASSROOM REALTIME
   STEP 4B.4
   ========================================================= */

function subscribeToClassroomMessages() {

  if (!activeClassroomId) {
    return;
  }


  /* Remove previous subscription */

  if (classroomRealtimeChannel) {

    supabaseClient
      .removeChannel(
        classroomRealtimeChannel
      );

    classroomRealtimeChannel = null;
  }


  console.log(
    "[Study Squad] Starting realtime for:",
    activeClassroomId
  );


  classroomRealtimeChannel =
    supabaseClient
      .channel(
        `study-classroom-${activeClassroomId}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_messages",
          filter:
            `classroom_id=eq.${activeClassroomId}`
        },
        payload => {

          console.log(
            "[Study Squad] New realtime message:",
            payload.new
          );


          /*
           * Add only the newly inserted message.
           * We don't reload the entire conversation.
           */

          renderRealtimeMessage(
            payload.new
          );

        }
      )
      .subscribe(
        status => {

          console.log(
            "[Study Squad] Realtime status:",
            status
          );

        }
      );

}

/* =========================================================
   RENDER REALTIME MESSAGE
   ========================================================= */

async function renderRealtimeMessage(
  message
) {

  const messagesContainer =
    $("classroomMessages");


  if (!messagesContainer) {
    return;
  }


  /*
   * Ignore messages belonging to another classroom.
   */

  if (
    message.classroom_id !==
    activeClassroomId
  ) {
    return;
  }


  /*
   * If this message already exists in the DOM,
   * don't add it twice.
   */

  if (
    messagesContainer.querySelector(
      `[data-message-id="${message.id}"]`
    )
  ) {
    return;
  }


  /* -------------------------------------------------------
     GET SENDER PROFILE
     ------------------------------------------------------- */

  const {
    data: profile
  } =
    await supabaseClient
      .from("profiles")
      .select(`
        id,
        username,
        display_name
      `)
      .eq(
        "id",
        message.sender_id
      )
      .maybeSingle();


  const isMine =
    currentUser &&
    message.sender_id ===
      currentUser.id;


  const senderName =
    isMine
      ? "You"
      : (
          profile?.display_name ||
          profile?.username ||
          "Student"
        );


  const messageTime =
    formatMessageTime(
      message.created_at
    );


  /* -------------------------------------------------------
     REMOVE EMPTY STATE
     ------------------------------------------------------- */

  const emptyState =
    messagesContainer.querySelector(
      ".chat-empty"
    );


  if (emptyState) {
    emptyState.remove();
  }


  /* -------------------------------------------------------
     CREATE MESSAGE
     ------------------------------------------------------- */

  const messageElement =
    document.createElement("div");


  messageElement.className =
    `chat-message ${
      isMine
        ? "chat-message-mine"
        : "chat-message-other"
    }`;


  messageElement.dataset.messageId =
    message.id;


  messageElement.innerHTML = `

    <div class="chat-message-header">

      <span class="chat-sender">
        ${escapeHtml(senderName)}
      </span>

      <span class="chat-time">
        ${escapeHtml(messageTime)}
      </span>

    </div>

    <div class="chat-message-body">
      ${escapeHtml(message.message)}
    </div>

  `;


  messagesContainer.appendChild(
    messageElement
  );


  /* -------------------------------------------------------
     SCROLL TO NEW MESSAGE
     ------------------------------------------------------- */

  messagesContainer.scrollTo({
    top:
      messagesContainer.scrollHeight,
    behavior:
      "smooth"
  });

}

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


/* =========================================================
   STUDY SQUAD — NEED MENTOR BUTTON
   STEP 4C.4E
   ========================================================= */

const needMentorBtn =
  document.getElementById("needMentorBtn");

if (needMentorBtn) {

  needMentorBtn.addEventListener(
    "click",
    async () => {

      /* ---------------------------------------------------
         Make sure a classroom is open
         --------------------------------------------------- */

      if (!activeClassroomId) {

        showToast(
          "Please open a classroom first."
        );

        return;
      }


      /* ---------------------------------------------------
         Prevent rapid clicking
         --------------------------------------------------- */

      if (needMentorBtn.disabled) {
        return;
      }


      needMentorBtn.disabled = true;

      const originalText =
        needMentorBtn.innerHTML;

      needMentorBtn.innerHTML =
        "⏳ Requesting...";


      try {

        const {
          data,
          error
        } =
          await supabaseClient.rpc(
            "request_study_mentor",
            {
              p_classroom_id:
                activeClassroomId
            }
          );


        if (error) {
          throw error;
        }


        console.log(
          "[Study Squad] Mentor request:",
          data
        );


        needMentorBtn.innerHTML =
          "✅ Mentor requested";


        showToast(
          "Mentor requested! 🤖"
        );

        await updateMentorRequestCount();


        /* -------------------------------------------------
           Re-enable after 5 seconds.
           Database has its own 2-minute protection.
           ------------------------------------------------- */

        setTimeout(() => {

          needMentorBtn.disabled =
            false;

          needMentorBtn.innerHTML =
            originalText;

        }, 5000);


      } catch (error) {

        console.error(
          "[Study Squad] Need Mentor failed:",
          error
        );


        needMentorBtn.disabled =
          false;

        needMentorBtn.innerHTML =
          originalText;


        showToast(
          "Couldn't request the mentor."
        );

      }

    }
  );
}
/* =========================================================
   MENTOR REQUEST COUNT
   STEP 4C.4F
   ========================================================= */

async function updateMentorRequestCount() {

  const countEl =
    document.getElementById(
      "mentorRequestCount"
    );

  if (!countEl || !activeClassroomId) {
    return;
  }

  try {

    const {
      count,
      error
    } = await supabaseClient
      .from("study_mentor_requests")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq(
        "classroom_id",
        activeClassroomId
      )
      .gte(
        "created_at",
        new Date(
          Date.now() - 2 * 60 * 1000
        ).toISOString()
      );

    if (error) {
      throw error;
    }

    if (count && count > 0) {

      countEl.textContent =
        count;

      countEl.style.display =
        "inline-flex";

    } else {

      countEl.textContent = "";

      countEl.style.display =
        "none";
    }

  } catch (error) {

    console.error(
      "[Study Squad] Mentor count error:",
      error
    );

  }

}
setInterval(
  updateMentorRequestCount,
  15000
);
/* =========================================================
   MENTOR DASHBOARD
   ========================================================= */

let mentorDashboardTimer = null;


/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */

function mentorTypeLabel(type) {

    switch (type) {

        case "explicit_mentor":
            return "🙋 MENTOR REQUEST";

        case "unresolved_doubt":
            return "🤔 UNRESOLVED DOUBT";

        case "conflicting_answers":
            return "⚠️ CONFLICTING ANSWERS";

        case "multiple_requests":
            return "🆘 MULTIPLE REQUESTS";

        default:
            return "📌 STUDY REQUEST";
    }

}


function mentorPriorityClass(priority) {

    if (Number(priority) >= 80) {
        return "high";
    }

    if (Number(priority) >= 50) {
        return "medium";
    }

    return "normal";
}


function mentorPriorityLabel(priority) {

    if (Number(priority) >= 80) {
        return "HIGH";
    }

    if (Number(priority) >= 50) {
        return "MEDIUM";
    }

    return "NORMAL";
}


function mentorTimeAgo(dateString) {

    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const seconds =
        Math.floor(
            (Date.now() - date.getTime()) / 1000
        );

    if (seconds < 60) {
        return "just now";
    }

    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} hr ago`;
    }

    const days =
        Math.floor(hours / 24);

    return `${days} day${days === 1 ? "" : "s"} ago`;
}


/* ---------------------------------------------------------
   Check whether current user owns classroom
   --------------------------------------------------------- */

async function isCurrentUserMentor(classroomId) {

    if (!currentUser || !classroomId) {
        return false;
    }

    const {
        data,
        error
    } = await supabaseClient

        .from("study_classrooms")

        .select("created_by")

        .eq("id", classroomId)

        .maybeSingle();


    if (error) {

        console.error(
            "[Study Squad] Mentor check failed:",
            error
        );

        return false;
    }


    return Boolean(
        data &&
        data.created_by === currentUser.id
    );
}


/* ---------------------------------------------------------
   Show / hide mentor dashboard
   --------------------------------------------------------- */

async function setupMentorDashboard() {

    const dashboard =
        $("mentorDashboard");

    if (!dashboard) {
        return;
    }

    const isMentor =
        await isCurrentUserMentor(
            activeClassroomId
        );


    if (!isMentor) {

        dashboard.classList.add(
            "hidden"
        );

        stopMentorDashboardPolling();

        return;
    }


    dashboard.classList.remove(
        "hidden"
    );


    await loadMentorInterventions();

    startMentorDashboardPolling();
}


/* ---------------------------------------------------------
   Load interventions
   --------------------------------------------------------- */

async function loadMentorInterventions() {

    if (!activeClassroomId) {
        return;
    }

    const dashboard =
        $("mentorDashboard");

    if (
        !dashboard ||
        dashboard.classList.contains("hidden")
    ) {
        return;
    }


    const list =
        $("mentorInterventionsList");

    if (!list) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient.rpc(
        "get_study_mentor_interventions",
        {
            p_classroom_id:
                activeClassroomId
        }
    );


    if (error) {

        console.error(
            "[Study Squad] Failed to load mentor interventions:",
            error
        );

        list.innerHTML = `
            <div class="mentor-empty-state">
                <div class="mentor-empty-icon">
                    ⚠️
                </div>

                <strong>
                    Couldn't load mentor requests
                </strong>

                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;

        return;
    }


    const interventions =
        Array.isArray(data)
            ? data
            : [];


    const pendingCount =
        interventions.length;


    if ($("mentorPendingCount")) {

        $("mentorPendingCount")
            .textContent =
            pendingCount;
    }


    if (
        $("mentorRequestCount")
    ) {

        $("mentorRequestCount")
            .textContent =
            pendingCount;
    }


    if (interventions.length === 0) {

        list.innerHTML = `
            <div class="mentor-empty-state">

                <div class="mentor-empty-icon">
                    🧑‍🏫
                </div>

                <strong>
                    No pending requests
                </strong>

                <p>
                    Everything is under control.
                </p>

            </div>
        `;

        return;
    }


    list.innerHTML =
        interventions
            .map(renderMentorIntervention)
            .join("");


    list
        .querySelectorAll(
            ".mentor-resolve-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    resolveMentorIntervention(
                        button.dataset.interventionId
                    );

                }
            );

        });
}


/* ---------------------------------------------------------
   Render intervention
   --------------------------------------------------------- */

function renderMentorIntervention(
    intervention
) {

    const priorityClass =
        mentorPriorityClass(
            intervention.priority
        );

    const priorityLabel =
        mentorPriorityLabel(
            intervention.priority
        );

    const typeLabel =
        mentorTypeLabel(
            intervention.trigger_type
        );


    const message =
        intervention.message ||
        "No message is attached to this request.";


    const requestCount =
        Number(
            intervention.mentor_request_count || 1
        );


    return `

        <article
            class="mentor-intervention-card"
        >

            <div
                class="mentor-intervention-top"
            >

                <div
                    class="mentor-intervention-type"
                >
                    ${typeLabel}
                </div>

                <span
                    class="mentor-priority ${priorityClass}"
                >
                    ${priorityLabel}
                    · ${Number(intervention.priority || 0)}
                </span>

            </div>


            <div
                class="mentor-intervention-message"
            >
                ${escapeHtml(message)}
            </div>


            <div
                class="mentor-intervention-meta"
            >

                <span>
                    👥 ${requestCount}
                    request${requestCount === 1 ? "" : "s"}
                </span>

                <span>
                    🕒 ${mentorTimeAgo(
                        intervention.created_at
                    )}
                </span>

                ${
                    intervention.trigger_message_id
                        ? `
                            <span>
                                💬 Message #${escapeHtml(
                                    String(
                                        intervention.trigger_message_id
                                    )
                                )}
                            </span>
                          `
                        : ""
                }

            </div>


            <div
                class="mentor-intervention-actions"
            >

                <button
                    type="button"
                    class="mentor-resolve-btn"
                    data-intervention-id="${escapeHtml(
                        intervention.id
                    )}"
                >
                    ✓ Mark Resolved
                </button>

            </div>

        </article>

    `;
}


/* ---------------------------------------------------------
   Resolve intervention
   --------------------------------------------------------- */

async function resolveMentorIntervention(
    interventionId
) {

    if (!interventionId) {
        return;
    }


    const button =
        document.querySelector(
            `.mentor-resolve-btn[data-intervention-id="${CSS.escape(interventionId)}"]`
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "Resolving...";
    }


    const {
        data,
        error
    } = await supabaseClient.rpc(
        "resolve_study_mentor_intervention",
        {
            p_intervention_id:
                interventionId
        }
    );


    if (error) {

        console.error(
            "[Study Squad] Failed to resolve intervention:",
            error
        );

        showToast(
            "Couldn't resolve this request."
        );

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "✓ Mark Resolved";
        }

        return;
    }


    if (data === true) {

        showToast(
            "Mentor request resolved ✓"
        );

        await loadMentorInterventions();

    }

}


/* ---------------------------------------------------------
   Polling
   --------------------------------------------------------- */

function startMentorDashboardPolling() {

    stopMentorDashboardPolling();


    mentorDashboardTimer =
        setInterval(
            () => {

                loadMentorInterventions();

            },
            10000
        );
}


function stopMentorDashboardPolling() {

    if (
        mentorDashboardTimer
    ) {

        clearInterval(
            mentorDashboardTimer
        );

        mentorDashboardTimer =
            null;
    }
}
