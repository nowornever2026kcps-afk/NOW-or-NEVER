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
   
   setupStudyHelpPanel();
   
   subscribeToClassroomMessages();
   
   startClassroomPresence();
   
   initializeAIMentorSystem();
   


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

      stopAIMentorPollSystem();

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
   RESTORE BUTTONS
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
   FORMAT EXAM TYPE
   ========================================================= */

function formatExamType(
  value
) {

  if (!value) return "";

  const map = {

    neet:
      "NEET",

    boards:
      "Board Exams",

    jee:
      "JEE",

    other:
      "Other"

  };

  return (
    map[value] ||
    value
  );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
  value
) {

  if (value === null ||
      value === undefined) {

    return "";

  }

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   LOAD CURRENT USER
   ========================================================= */

async function loadCurrentUser() {

  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .getUser();


  if (error) {

    console.error(
      "[Study Squad] Failed to get user:",
      error
    );

    return;

  }


  currentUser =
    data?.user || null;


  console.log(
    "[Study Squad] Current user:",
    currentUser?.id
  );


  if (currentUser) {

    await loadClassrooms();

  }

}


/* =========================================================
   AUTH STATE
   ========================================================= */

supabaseClient
  .auth
  .onAuthStateChange(
    async (
      event,
      session
    ) => {

      currentUser =
        session?.user || null;


      console.log(
        "[Study Squad] Auth event:",
        event
      );


      if (currentUser) {

        await loadClassrooms();

      }

    }
  );


/* =========================================================
   INITIALIZE
   ========================================================= */

loadCurrentUser();


/* =========================================================
   STUDY CLASSROOM MESSAGES
   ========================================================= */

async function loadClassroomMessages() {

  if (!activeClassroomId) {

    console.warn(
      "[Study Squad] No active classroom."
    );

    return;

  }


  const messageList =
    $("studyMessageList");


  if (!messageList) {

    console.warn(
      "[Study Squad] studyMessageList not found."
    );

    return;

  }


  messageList.innerHTML = `
    <div class="study-message-loading">
      Loading messages...
    </div>
  `;


  const {
    data,
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


  if (error) {

    console.error(
      "[Study Squad] Failed to load messages:",
      error
    );

    messageList.innerHTML = `
      <div class="study-message-error">
        Couldn't load messages.
      </div>
    `;

    return;

  }


  renderClassroomMessages(
    data || []
  );

}


function renderClassroomMessages(
  messages
) {

  const messageList =
    $("studyMessageList");


  if (!messageList) return;


  if (!messages.length) {

    messageList.innerHTML = `
      <div class="study-message-empty">
        <div>💬</div>
        <strong>No messages yet</strong>
        <p>Start the Study Squad discussion.</p>
      </div>
    `;

    return;

  }


  messageList.innerHTML =
    messages
      .map(
        renderStudyMessage
      )
      .join("");


  messageList.scrollTop =
    messageList.scrollHeight;

}


function renderStudyMessage(
  item
) {

  const mine =
    currentUser &&
    item.sender_id ===
      currentUser.id;


  const messageType =
    item.message_type ||
    "student";


  const isAI =
    messageType === "ai" ||
    messageType === "mentor";


  return `
    <div
      class="study-message ${
        mine
          ? "mine"
          : ""
      } ${
        isAI
          ? "ai-message"
          : ""
      }"
      data-message-id="${escapeHtml(
        item.id
      )}"
    >

      <div class="study-message-meta">

        <span class="study-message-author">
          ${
            isAI
              ? "🤖 NOW AI Mentor"
              : mine
                ? "You"
                : "Student"
          }
        </span>

        <span class="study-message-time">
          ${formatMessageTime(
            item.created_at
          )}
        </span>

      </div>

      <div class="study-message-body">
        ${formatStudyMessage(
          item.message
        )}
      </div>

    </div>
  `;

}


function formatStudyMessage(
  message
) {

  if (!message) return "";

  return escapeHtml(
    message
  )
    .replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    )
    .replace(
      /\n/g,
      "<br>"
    );

}


function formatMessageTime(
  timestamp
) {

  if (!timestamp)
    return "";

  const date =
    new Date(timestamp);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


/* =========================================================
   SEND STUDY MESSAGE
   ========================================================= */

async function sendStudyMessage() {

  if (!currentUser) {

    showToast(
      "Please log in first."
    );

    return;

  }


  if (!activeClassroomId) {

    showToast(
      "Open a classroom first."
    );

    return;

  }


  const input =
    $("studyMessageInput");


  if (!input) return;


  const message =
    input.value.trim();


  if (!message) return;


  const sendButton =
    $("sendStudyMessageBtn");


  if (sendButton) {

    sendButton.disabled =
      true;

  }


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

        message,

        message_type:
          "student"
      });


  if (error) {

    console.error(
      "[Study Squad] Failed to send message:",
      error
    );

    showToast(
      "Couldn't send message."
    );

  } else {

    input.value = "";

  }


  if (sendButton) {

    sendButton.disabled =
      false;

  }

}


/* =========================================================
   SEND BUTTON
   ========================================================= */

$("sendStudyMessageBtn")
  ?.addEventListener(
    "click",
    sendStudyMessage
  );


$("studyMessageInput")
  ?.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendStudyMessage();

      }

    }
  );


/* =========================================================
   REALTIME MESSAGES
   ========================================================= */

function subscribeToClassroomMessages() {

  if (!activeClassroomId)
    return;


  if (classroomRealtimeChannel) {

    supabaseClient
      .removeChannel(
        classroomRealtimeChannel
      );

  }


  classroomRealtimeChannel =
    supabaseClient
      .channel(
        `study-messages-${activeClassroomId}`
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
            "[Study Squad] New message:",
            payload.new
          );

          appendStudyMessage(
            payload.new
          );

          /*
           * IMPORTANT:
           * AI detection is handled by the
           * AI mentor system below.
           *
           * A normal student message MUST NOT
           * directly trigger an AI reply.
           */

          handleAIMentorMessage(
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


function appendStudyMessage(
  message
) {

  const messageList =
    $("studyMessageList");

  if (!messageList)
    return;


  const empty =
    messageList
      .querySelector(
        ".study-message-empty"
      );


  if (empty) {

    messageList.innerHTML =
      "";

  }


  if (
    messageList
      .querySelector(
        `[data-message-id="${message.id}"]`
      )
  ) {

    return;

  }


  messageList.insertAdjacentHTML(
    "beforeend",
    renderStudyMessage(
      message
    )
  );


  messageList.scrollTop =
    messageList.scrollHeight;

}


/* =========================================================
   STUDY HELP PANEL
   ========================================================= */

function setupStudyHelpPanel() {

  const panel =
    $("studyHelpPanel");

  if (!panel) return;


  const closeButton =
    $("closeStudyHelpPanel");


  closeButton?.addEventListener(
    "click",
    () => {

      panel.classList.add(
        "hidden"
      );

    }
  );

}


function openStudyHelpPanel() {

  const panel =
    $("studyHelpPanel");

  if (!panel) return;

  panel.classList.remove(
    "hidden"
  );

}


/* =========================================================
   CLASSROOM PRESENCE
   ========================================================= */

function startClassroomPresence() {

  if (!activeClassroomId ||
      !currentUser) {

    return;

  }


  if (classroomPresenceChannel) {

    supabaseClient
      .removeChannel(
        classroomPresenceChannel
      );

  }


  classroomPresenceChannel =
    supabaseClient
      .channel(
        `study-presence-${activeClassroomId}`
      );


  classroomPresenceChannel
    .on(
      "presence",
      {
        event: "sync"
      },
      () => {

        updateClassroomOnlineCount();

      }
    )
    .on(
      "presence",
      {
        event: "join"
      },
      () => {

        updateClassroomOnlineCount();

      }
    )
    .on(
      "presence",
      {
        event: "leave"
      },
      () => {

        updateClassroomOnlineCount();

      }
    )
    .subscribe(
      async status => {

        if (
          status ===
          "SUBSCRIBED"
        ) {

          await classroomPresenceChannel
            .track({
              user_id:
                currentUser.id,

              online_at:
                new Date()
                  .toISOString()
            });

          updateClassroomOnlineCount();

        }

      }
    );

}


async function updateClassroomOnlineCount() {

  if (
    !classroomPresenceChannel
  ) return;


  const state =
    classroomPresenceChannel
      .presenceState();


  let count = 0;


  Object
    .values(state)
    .forEach(
      presences => {

        count +=
          presences.length;

      }
    );


  const onlineCount =
    $("classroomOnlineCount");


  if (onlineCount) {

    onlineCount.textContent =
      `${count} online`;

  }

}
let aiMentorProcessedInterventions =
  new Set();

/* =========================================================
   AI MENTOR SYSTEM
   ========================================================= */

let aiMentorInitialized =
  false;

let aiMentorPollTimer =
  null;

let aiMentorProcessing =
  false;

let aiMentorLastMessageId =
  null;


/*
 * IMPORTANT DESIGN RULE
 *
 * Normal student messages:
 *   → NEVER directly generate AI answer.
 *
 * @mentor:
 *   → DIRECT BYPASS.
 *   → AI can answer immediately.
 *
 * Conflict / doubt / intervention:
 *   → AI does NOT immediately answer.
 *   → A classroom poll is created.
 *   → AI interrupts only when YES votes
 *     are strictly greater than 50%.
 *
 * This keeps the classroom fully AI-driven
 * while allowing students to control
 * unsolicited AI interruptions.
 */


/* =========================================================
   INITIALIZE AI MENTOR SYSTEM
   ========================================================= */

function initializeAIMentorSystem() {

  if (
    aiMentorInitialized
  ) {

    /*
     * The classroom may be reopened.
     * Make sure the poll monitor is still running.
     */

    startAIMentorPollSystem();

    return;

  }


  aiMentorInitialized =
    true;


  console.log(
    "[AI Mentor] Initializing..."
  );


  startAIMentorPollSystem();

}


/* =========================================================
   STOP AI MENTOR SYSTEM
   ========================================================= */

function stopAIMentorPollSystem() {

  if (aiMentorPollTimer) {

    clearInterval(
      aiMentorPollTimer
    );

    aiMentorPollTimer =
      null;

  }


  aiMentorInitialized =
    false;

  aiMentorProcessing =
    false;

  aiMentorLastMessageId =
    null;

}


/* =========================================================
   POLL SYSTEM MONITOR
   ========================================================= */

function startAIMentorPollSystem() {

  if (aiMentorPollTimer) {

    clearInterval(
      aiMentorPollTimer
    );

  }


  /*
   * Check polls immediately.
   */

  loadAIPolls();


  /*
   * Then refresh periodically.
   */

  aiMentorPollTimer =
    setInterval(
      () => {

        if (
          activeClassroomId
        ) {

          loadAIPolls();

        }

      },
      5000
    );

}


/* =========================================================
   LOAD AI POLLS
   ========================================================= */

async function loadAIPolls() {

  if (
    !activeClassroomId ||
    !currentUser
  ) {

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .rpc(
        "get_study_ai_polls",
        {
          p_classroom_id:
            activeClassroomId
        }
      );


  if (error) {

    /*
     * Do not spam the user with a toast.
     * Log the actual RPC error for debugging.
     */

    console.error(
      "[AI Poll] Failed to load polls:",
      error
    );

    return;

  }


  renderAIPolls(
    data || []
  );

}


/* =========================================================
   RENDER AI POLLS
   ========================================================= */

function renderAIPolls(
  polls
) {

  const container =
    $("studyAIPollContainer");


  if (!container) {

    return;

  }


  if (!polls.length) {

    container.innerHTML =
      "";

    return;

  }


  container.innerHTML =
    polls
      .map(
        renderAIPoll
      )
      .join("");


  container
    .querySelectorAll(
      "[data-ai-poll-id]"
    )
    .forEach(
      pollElement => {

        const pollId =
          pollElement
            .dataset
            .aiPollId;


        pollElement
          .querySelectorAll(
            "[data-ai-vote]"
          )
          .forEach(
            button => {

              button.addEventListener(
                "click",
                () => {

                  voteOnAIPoll(
                    pollId,
                    button.dataset.aiVote
                  );

                }
              );

            }
          );

      }
    );

}


function renderAIPoll(
  poll
) {

  const yes =
    Number(
      poll.yes_votes || 0
    );


  const no =
    Number(
      poll.no_votes || 0
    );


  const total =
    yes + no;


  const percentage =
    total > 0
      ? Math.round(
          (yes / total) * 100
        )
      : 0;


  const userVote =
    poll.user_vote ||
    "";


  return `
    <div
      class="study-ai-poll"
      data-ai-poll-id="${escapeHtml(
        poll.id
      )}"
    >

      <div class="study-ai-poll-header">
        <span>
          🤖 AI wants to help
        </span>

        <span>
          ${escapeHtml(
            `${percentage}% YES`
          )}
        </span>
      </div>


      <div class="study-ai-poll-question">
        Some students may benefit from an
        AI intervention here.
        Should NOW AI step in?
      </div>


      <div class="study-ai-poll-stats">

        <span>
          👍 Yes: ${yes}
        </span>

        <span>
          👎 No: ${no}
        </span>

        <span>
          ${escapeHtml(
            `${poll.total_eligible || 0} eligible`
          )}
        </span>

      </div>


      <div class="study-ai-poll-actions">

        <button
          type="button"
          data-ai-vote="yes"
          class="${
            userVote === "yes"
              ? "selected"
              : ""
          }"
        >
          👍 Let AI help
        </button>


        <button
          type="button"
          data-ai-vote="no"
          class="${
            userVote === "no"
              ? "selected"
              : ""
          }"
        >
          👎 Not now
        </button>

      </div>


      <div class="study-ai-poll-note">
        AI joins only if more than 50% vote YES.
      </div>

    </div>
  `;

}


/* =========================================================
   VOTE AI POLL
   ========================================================= */

async function voteOnAIPoll(
  pollId,
  vote
) {

  if (
    !currentUser ||
    !pollId
  ) {

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .rpc(
        "vote_study_ai_poll",
        {
          p_poll_id:
            pollId,

          p_vote:
            vote
        }
      );


  if (error) {

    console.error(
      "[AI Poll] Vote failed:",
      error
    );

    showToast(
      error.message ||
      "Couldn't submit vote."
    );

    return;

  }


  console.log(
    "[AI Poll] Vote result:",
    data
  );


  await loadAIPolls();


  /*
   * If the backend reports that the poll
   * has passed, the AI intervention is
   * now allowed.
   */

  if (
    data &&
    data.status ===
      "approved"
  ) {

    await processApprovedAIPoll(
      data
    );

  }

}


/* =========================================================
   PROCESS APPROVED POLL
   ========================================================= */

async function processApprovedAIPoll(
  pollResult
) {

  if (
    !pollResult ||
    !pollResult.poll_id
  ) {

    return;

  }


  console.log(
    "[AI Poll] Poll approved:",
    pollResult
  );


  /*
   * The actual intervention is resolved
   * by the backend intervention system.
   *
   * Refreshing the polls removes the
   * completed poll from the classroom UI.
   */

  await loadAIPolls();

}


/* =========================================================
   HANDLE NEW CLASSROOM MESSAGE
   ========================================================= */

async function handleAIMentorMessage(
  message
) {

  if (!message) return;


  /*
   * AI messages must never recursively
   * trigger another AI intervention.
   */

  if (
    message.message_type ===
      "ai" ||
    message.message_type ===
      "mentor"
  ) {

    return;

  }


  /*
   * Ignore messages from other classrooms.
   */

  if (
    message.classroom_id !==
    activeClassroomId
  ) {

    return;

  }


  /*
   * Prevent duplicate processing.
   */

  if (
    aiMentorLastMessageId ===
    message.id
  ) {

    return;

  }


  aiMentorLastMessageId =
    message.id;


  const text =
    String(
      message.message ||
      ""
    ).trim();


  if (!text) return;


  /*
   * =======================================================
   * @mentor — DIRECT BYPASS
   * =======================================================
   *
   * This is intentionally checked BEFORE
   * conflict/doubt detection.
   *
   * Therefore:
   *
   *   "@mentor explain this"
   *
   * immediately goes to the AI mentor.
   *
   * No poll is created.
   */

  if (
    hasMentorTrigger(
      text
    )
  ) {

    console.log(
      "[AI Mentor] Direct @mentor trigger."
    );

    await triggerDirectAIMentor(
      message
    );

    return;

  }


  /*
   * =======================================================
   * NORMAL STUDENT MESSAGE
   * =======================================================
   *
   * A normal message must NOT directly
   * cause an AI response.
   *
   * Instead we ask the backend detector
   * whether this message represents a
   * conflict/doubt/intervention situation.
   */

  await detectAutomaticAIIntervention(
    message
  );

}


/* =========================================================
   @MENTOR DETECTION
   ========================================================= */

function hasMentorTrigger(
  text
) {

  return /(^|\s)@mentor\b/i
    .test(
      text
    );

}


/* =========================================================
   DIRECT AI MENTOR
   ========================================================= */

async function triggerDirectAIMentor(
  message
) {

  if (
    aiMentorProcessing
  ) {

    return;

  }


  aiMentorProcessing =
    true;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .rpc(
          "send_study_ai_mentor_reply",
          {
            p_classroom_id:
              message.classroom_id,

            p_message:
              message.message
          }
        );


    if (error) {

      console.error(
        "[AI Mentor] Direct reply failed:",
        error
      );

      showToast(
        "AI mentor couldn't respond."
      );

      return;

    }


    console.log(
      "[AI Mentor] Direct response:",
      data
    );


  } finally {

    aiMentorProcessing =
      false;

  }

}


/* =========================================================
   AUTOMATIC AI INTERVENTION DETECTION
   ========================================================= */

async function detectAutomaticAIIntervention(
  message
) {

  if (
    aiMentorProcessing
  ) {

    return;

  }


  /*
   * First ask the conflict detector.
   *
   * The detector itself should NOT send an
   * AI answer. It should only identify whether
   * an intervention is appropriate.
   */

  const {
    data: conflictResult,
    error: conflictError
  } =
    await supabaseClient
      .rpc(
        "detect_study_conflicting_answers",
        {
          p_message_id:
            message.id,

          p_sender_id:
            message.sender_id,

          p_message:
            message.message
        }
      );


  if (conflictError) {

    console.error(
      "[AI Mentor] Conflict detector error:",
      conflictError
    );

    return;

  }


  console.log(
    "[AI Mentor] Conflict detector:",
    conflictResult
  );


  /*
   * If there is a conflict, the backend
   * should create the AI intervention/poll.
   *
   * The browser does NOT directly answer.
   */

  if (
    isInterventionDetected(
      conflictResult
    )
  ) {

    await ensureAIPollExists(
      message,
      conflictResult
    );

    return;

  }


  /*
   * If not conflict, check whether the
   * message is a study doubt that warrants
   * a possible intervention.
   */

  const {
    data: doubtResult,
    error: doubtError
  } =
    await supabaseClient
      .rpc(
        "detect_study_doubt_trigger",
        {
          p_message_id:
            message.id,

          p_sender_id:
            message.sender_id,

          p_message:
            message.message
        }
      );


  if (doubtError) {

    console.error(
      "[AI Mentor] Doubt detector error:",
      doubtError
    );

    return;

  }


  console.log(
    "[AI Mentor] Doubt detector:",
    doubtResult
  );


  if (
    isInterventionDetected(
      doubtResult
    )
  ) {

    await ensureAIPollExists(
      message,
      doubtResult
    );

  }

}


/* =========================================================
   DETECTOR RESULT HELPER
   ========================================================= */

function isInterventionDetected(
  result
) {

  if (!result) {

    return false;

  }


  if (
    typeof result ===
    "boolean"
  ) {

    return result;

  }


  if (
    typeof result ===
    "object"
  ) {

    return Boolean(
      result.triggered ??
      result.detected ??
      result.conflict ??
      result.should_intervene ??
      result.needs_intervention ??
      result.is_conflict
    );

  }


  return false;

}


/* =========================================================
   ENSURE AI POLL
   ========================================================= */

async function ensureAIPollExists(
  message,
  detectorResult
) {

  if (
    !message ||
    !activeClassroomId
  ) {

    return;

  }


  console.log(
    "[AI Poll] Intervention detected. Creating/checking poll..."
  );


  /*
   * Poll creation is intentionally delegated
   * to the database.
   *
   * This prevents multiple clients from
   * creating duplicate polls for the same
   * intervention.
   */

  const {
    data,
    error
  } =
    await supabaseClient
      .rpc(
        "create_study_ai_poll_for_message",
        {
          p_message_id:
            message.id,

          p_classroom_id:
            message.classroom_id
        }
      );


  if (error) {

    console.error(
      "[AI Poll] Failed to create poll:",
      error
    );

    return;

  }


  console.log(
    "[AI Poll] Poll creation result:",
    data
  );


  await loadAIPolls();

}


/* =========================================================
   END PART 1
   ========================================================= */

/* =========================================================
   NOW-or-NEVER — STUDY SQUAD
   STUDY-SQUAD.JS
   PART 2 / 5
   ========================================================= */

/* =========================================================
   RENDER AI POLL
   ========================================================= */

function renderAIMentorPoll(poll) {

    const total =
        Number(
            poll.total_eligible ??
            poll.total_students ??
            0
        );

    const yes =
        Number(
            poll.yes_votes || 0
        );

    const no =
        Number(
            poll.no_votes || 0
        );

    const myVote =
        poll.user_vote ??
        poll.my_vote ??
        null;

    const approvalPercent =
        total > 0
            ? Math.round(
                (yes / total) * 100
            )
            : 0;

    let voteStatus = "";

    if (myVote === "yes" || myVote === true) {

        voteStatus =
            "You voted YES";

    } else if (
        myVote === "no" ||
        myVote === false
    ) {

        voteStatus =
            "You voted NO";
    }


    const typeLabel = {

        unresolved_doubt:
            "🤔 Unresolved Doubt",

        conflicting_answers:
            "⚠️ Conflicting Answers",

        multiple_requests:
            "👥 Multiple Students",

        explicit_mentor:
            "🧑‍🏫 Mentor Requested"

    }[
        poll.trigger_type
    ] || "📚 Study Help";


    const pollId =
        poll.id;


    return `

        <article
            class="study-help-card ai-mentor-poll-card"
            data-ai-poll-id="${escapeHtml(
                pollId
            )}"
        >

            <div class="study-help-card-top">

                <div class="study-help-type">
                    ${typeLabel}
                </div>

                <span class="study-help-priority">
                    ${Number(
                        poll.priority || 0
                    )}
                </span>

            </div>


            <div class="study-help-message">

                ${escapeHtml(
                    poll.message ||
                    "The classroom may need AI help."
                )}

            </div>


            <div class="study-help-meta">

                <span>
                    🗳️
                    ${yes} yes /
                    ${no} no
                </span>

                <span>
                    ${approvalPercent}% YES
                </span>

            </div>


            <div class="ai-poll-question">

                <strong>
                    🤖 Should the AI Mentor step in?
                </strong>

                <p>
                    AI involvement requires
                    <strong>more than 50% YES</strong>
                    votes.
                </p>

            </div>


            <div class="ai-poll-progress">

                <div
                    class="ai-poll-progress-bar"
                    style="
                        width:${Math.min(
                            approvalPercent,
                            100
                        )}%;
                    "
                ></div>

            </div>


            <div class="ai-poll-votes">

                ${yes} / ${total}
                eligible students currently support
                AI help.

            </div>


            <div class="ai-poll-buttons">

                <button
                    type="button"
                    class="ai-poll-yes"
                    data-poll-id="${escapeHtml(
                        pollId
                    )}"
                    ${myVote !== null
                        ? "disabled"
                        : ""}
                >
                    🤖 Yes, let AI help
                </button>


                <button
                    type="button"
                    class="ai-poll-no"
                    data-poll-id="${escapeHtml(
                        pollId
                    )}"
                    ${myVote !== null
                        ? "disabled"
                        : ""}
                >
                    ✋ No, not yet
                </button>

            </div>


            ${
                voteStatus
                    ? `
                        <div class="ai-poll-vote-status">
                            ${escapeHtml(
                                voteStatus
                            )}
                        </div>
                    `
                    : ""
            }

        </article>

    `;
}


/* =========================================================
   SETUP POLL BUTTONS
   ========================================================= */

function setupAIMentorPollButtons() {

    const yesButtons =
        document.querySelectorAll(
            ".ai-poll-yes"
        );

    const noButtons =
        document.querySelectorAll(
            ".ai-poll-no"
        );


    yesButtons.forEach(button => {

        if (
            button.dataset.pollReady ===
            "true"
        ) {
            return;
        }

        button.dataset.pollReady =
            "true";


        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();
                event.stopPropagation();

                const pollId =
                    button.dataset.pollId;

                if (!pollId) {
                    return;
                }

                await submitAIPollVote(
                    pollId,
                    "yes"
                );

            }
        );

    });


    noButtons.forEach(button => {

        if (
            button.dataset.pollReady ===
            "true"
        ) {
            return;
        }

        button.dataset.pollReady =
            "true";


        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();
                event.stopPropagation();

                const pollId =
                    button.dataset.pollId;

                if (!pollId) {
                    return;
                }

                await submitAIPollVote(
                    pollId,
                    "no"
                );

            }
        );

    });

}


/* =========================================================
   SUBMIT AI POLL VOTE
   ========================================================= */

async function submitAIPollVote(
    pollId,
    vote
) {

    if (!pollId) {
        return;
    }


    if (
        vote !== "yes" &&
        vote !== "no"
    ) {
        return;
    }


    try {

        console.log(
            "[AI Poll] Voting:",
            pollId,
            vote
        );


        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "vote_study_ai_poll",
                {
                    p_poll_id:
                        pollId,

                    p_vote:
                        vote
                }
            );


        if (error) {

            console.error(
                "[AI Poll] Vote failed:",
                error
            );

            showToast(
                "⚠️ " +
                (
                    error.message ||
                    "Unable to submit vote."
                )
            );

            return;
        }


        console.log(
            "[AI Poll] Vote result:",
            data
        );


        if (
            data &&
            data.status === "approved"
        ) {

            showToast(
                "🤖 More than 50% voted YES. AI Mentor will step in."
            );

        } else if (
            data &&
            data.status === "rejected"
        ) {

            showToast(
                "✋ The classroom voted not to involve the AI."
            );

        } else {

            showToast(
                vote === "yes"
                    ? "🤖 Your YES vote was recorded."
                    : "✋ Your NO vote was recorded."
            );

        }


        await loadAIMentorPolls();

        await loadClassroomMessages();

    } catch (error) {

        console.error(
            "[AI Poll] Unexpected voting error:",
            error
        );

        showToast(
            "⚠️ Failed to submit your vote."
        );

    }

}


/* =========================================================
   AI POLL SYSTEM TIMER
   ========================================================= */

/*
 * IMPORTANT:
 * aiMentorPollTimer is already declared by the
 * original AI Mentor system above.
 *
 * aiMentorProcessing is also already declared above.
 *
 * Do NOT redeclare either variable here.
 */


/* =========================================================
   START AUTOMATIC AI POLL SYSTEM
   ========================================================= */

function startAIMentorPollSystem() {

    if (!activeClassroomId) {

        console.warn(
            "[AI Mentor] Cannot start poll system — no classroom."
        );

        return;
    }


    stopAIMentorPollSystem();


    console.log(
        "[AI Mentor] Automatic poll system started:",
        activeClassroomId
    );


    loadAIMentorPolls();


    /*
     * Check every 5 seconds.
     *
     * IMPORTANT:
     *
     * This does NOT automatically make the AI answer.
     *
     * It only:
     *
     * 1. loads active polls
     * 2. checks whether an existing poll
     *    has crossed the >50% YES threshold
     *
     * @mentor requests are handled separately
     * and bypass the poll system.
     */

    aiMentorPollTimer =
        setInterval(
            async () => {

                if (
                    !activeClassroomId
                ) {
                    return;
                }


                await loadAIMentorPolls();


                await checkAutomaticAIMentorInterventions();

            },
            5000
        );

}


/* =========================================================
   STOP AI POLL SYSTEM
   ========================================================= */

function stopAIMentorPollSystem() {

    if (
        aiMentorPollTimer
    ) {

        clearInterval(
            aiMentorPollTimer
        );

        aiMentorPollTimer =
            null;
    }

}


/* =========================================================
   LOAD ACTIVE AI POLLS
   ========================================================= */

async function loadAIMentorPolls() {

    if (!activeClassroomId) {
        return;
    }


    const list =
        document.getElementById(
            "studyHelpList"
        );


    const count =
        document.getElementById(
            "studyHelpCount"
        );


    if (!list) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "get_study_ai_polls",
            {
                p_classroom_id:
                    activeClassroomId
            }
        );


    if (error) {

        console.error(
            "[AI Mentor] Failed to load polls:",
            error
        );


        list.innerHTML = `

            <div class="study-help-empty">

                <div>⚠️</div>

                <strong>
                    Couldn't load AI requests
                </strong>

                <p>
                    ${escapeHtml(
                        error.message ||
                        "Unknown error"
                    )}
                </p>

            </div>

        `;

        return;
    }


    const polls =
        Array.isArray(data)
            ? data
            : [];


    if (count) {

        count.textContent =
            polls.length === 1
                ? "1 AI request"
                : `${polls.length} AI requests`;

    }


    if (!polls.length) {

        list.innerHTML = `

            <div class="study-help-empty">

                <div>✨</div>

                <strong>
                    No AI intervention needed
                </strong>

                <p>
                    The AI will ask the classroom
                    before stepping in.
                </p>

            </div>

        `;

        return;
    }


    list.innerHTML =
        polls
            .map(
                renderAIMentorPoll
            )
            .join("");


    setupAIMentorPollButtons();

}


/* =========================================================
   NOW-or-NEVER — STUDY SQUAD
   STUDY-SQUAD.JS
   PART 3 / 5
   ========================================================= */


/* =========================================================
   CHECK AUTOMATIC AI MENTOR INTERVENTIONS
   ========================================================= */

async function checkAutomaticAIMentorInterventions() {

    if (!activeClassroomId) {
        return;
    }


    /*
     * Do NOT process the same intervention twice.
     */

    const {
        data,
        error
    } =
        await supabaseClient
            .from("study_ai_polls")
            .select(`
                id,
                intervention_id,
                classroom_id,
                yes_votes,
                no_votes,
                total_eligible,
                status,
                expires_at
            `)
            .eq(
                "classroom_id",
                activeClassroomId
            )
            .eq(
                "status",
                "open"
            );


    if (error) {

        console.error(
            "[AI Mentor] Failed to check polls:",
            error
        );

        return;
    }


    const polls =
        Array.isArray(data)
            ? data
            : [];


    for (
        const poll of polls
    ) {

        /*
         * Ignore malformed polls.
         */

        if (
            !poll.id ||
            !poll.intervention_id
        ) {
            continue;
        }


        /*
         * Never process a poll twice
         * in this browser session.
         */

        if (
           aiMentorProcessedInterventions.has(
                      poll.intervention_id
                  )
            )
        ) {
            continue;
        }


        const yes =
            Number(
                poll.yes_votes || 0
            );


        const no =
            Number(
                poll.no_votes || 0
            );


        const eligible =
            Number(
                poll.total_eligible || 0
            );


        /*
         * We require STRICTLY MORE THAN
         * 50% of eligible students.
         *
         * Examples:
         *
         * 5 students:
         * 3 YES = approved
         * 2 YES = not approved
         *
         * 4 students:
         * 3 YES = approved
         * 2 YES = 50%, NOT approved
         */

        if (
            eligible <= 0
        ) {
            continue;
        }


        const hasMajority =
            yes * 2 > eligible;


        if (!hasMajority) {
            continue;
        }


        /*
         * The poll has passed.
         */

        aiMentorProcessedInterventions.add(
            poll.intervention_id
        );


        console.log(
            "[AI Mentor] Poll passed:",
            {
                poll_id: poll.id,
                intervention_id:
                    poll.intervention_id,
                yes_votes: yes,
                no_votes: no,
                total_eligible:
                    eligible
            }
        );


        try {

            await activateAIMentorIntervention(
                poll
            );

        } catch (activationError) {

            console.error(
                "[AI Mentor] Failed to activate intervention:",
                activationError
            );

            /*
             * Allow retry if activation
             * itself failed.
             */

            aiMentorProcessedInterventions.delete(
                poll.intervention_id
            );

        }

    }

}


/* =========================================================
   ACTIVATE AI MENTOR INTERVENTION
   ========================================================= */

async function activateAIMentorIntervention(
    poll
) {

    if (
        !poll ||
        !poll.intervention_id
    ) {
        return;
    }


    /*
     * IMPORTANT:
     *
     * We do not generate the AI response here
     * directly.
     *
     * First we tell the database that the
     * classroom approved the intervention.
     *
     * The backend / existing intervention
     * system can then process the request.
     */


    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "resolve_study_mentor_intervention",
            {
                p_intervention_id:
                    poll.intervention_id
            }
        );


    if (error) {

        /*
         * Some existing versions of the database
         * may use a different RPC signature.
         *
         * Log the exact problem instead of
         * silently breaking the Study Squad.
         */

        console.error(
            "[AI Mentor] Intervention activation RPC failed:",
            error
        );

        throw error;
    }


    console.log(
        "[AI Mentor] Intervention activated:",
        data
    );


    /*
     * Refresh the classroom UI immediately.
     */

    await loadAIMentorPolls();


    if (
        typeof loadClassroomMessages ===
        "function"
    ) {

        await loadClassroomMessages();

    }


    showToast(
        "🤖 The classroom approved AI involvement. The AI Mentor is stepping in."
    );

}


/* =========================================================
   CREATE AUTOMATIC AI POLL
   ========================================================= */

/*
 * This function is intentionally separate from
 * @mentor handling.
 *
 * Automatic triggers:
 *
 *     conflicting_answers
 *     unresolved_doubt
 *     multiple_requests
 *
 * must create a poll first.
 *
 * Explicit:
 *
 *     @mentor
 *
 * bypasses this function completely.
 */


async function createAutomaticAIMentorPoll(
    interventionId
) {

    if (
        !activeClassroomId ||
        !interventionId
    ) {

        console.warn(
            "[AI Mentor] Cannot create poll — missing classroom/intervention."
        );

        return null;
    }


    /*
     * Prevent duplicate polls for the same
     * intervention.
     */

    const {
        data: existingPoll,
        error: existingError
    } =
        await supabaseClient
            .from("study_ai_polls")
            .select("id,status")
            .eq(
                "intervention_id",
                interventionId
            )
            .in(
                "status",
                [
                    "open",
                    "active"
                ]
            )
            .maybeSingle();


    if (existingError) {

        console.error(
            "[AI Mentor] Existing poll check failed:",
            existingError
        );

        return null;
    }


    if (existingPoll) {

        console.log(
            "[AI Mentor] Poll already exists:",
            existingPoll.id
        );

        return existingPoll;
    }


    /*
     * Get number of eligible classroom members.
     */

    const {
        count,
        error: memberError
    } =
        await supabaseClient
            .from(
                "study_classroom_members"
            )
            .select(
                "user_id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "classroom_id",
                activeClassroomId
            );


    if (memberError) {

        console.error(
            "[AI Mentor] Could not count classroom members:",
            memberError
        );

        return null;
    }


    const totalEligible =
        Number(count || 0);


    if (
        totalEligible <= 0
    ) {

        console.warn(
            "[AI Mentor] No eligible classroom members."
        );

        return null;
    }


    /*
     * Create a one-minute poll.
     *
     * The database default may also provide
     * expires_at, but explicitly supplying it
     * keeps the browser and database behaviour
     * predictable.
     */

    const expiresAt =
        new Date(
            Date.now() +
            60 * 1000
        ).toISOString();


    const {
        data,
        error
    } =
        await supabaseClient
            .from("study_ai_polls")
            .insert({
                intervention_id:
                    interventionId,

                classroom_id:
                    activeClassroomId,

                yes_votes:
                    0,

                no_votes:
                    0,

                total_eligible:
                    totalEligible,

                status:
                    "open",

                expires_at:
                    expiresAt
            })
            .select()
            .single();


    if (error) {

        console.error(
            "[AI Mentor] Poll creation failed:",
            error
        );

        return null;
    }


    console.log(
        "[AI Mentor] Automatic AI poll created:",
        data
    );


    /*
     * Immediately display the poll.
     */

    await loadAIMentorPolls();


    return data;
}


/* =========================================================
   FIND / CREATE POLL FOR AN INTERVENTION
   ========================================================= */

async function ensureAIMentorPoll(
    intervention
) {

    if (!intervention) {
        return null;
    }


    const interventionId =
        intervention.id ||
        intervention.intervention_id;


    if (!interventionId) {

        console.warn(
            "[AI Mentor] Intervention has no ID."
        );

        return null;
    }


    /*
     * NEVER create a poll for explicit
     * @mentor requests.
     *
     * Those requests bypass the poll.
     */

    const triggerType =
        String(
            intervention.trigger_type ||
            intervention.type ||
            ""
        )
            .toLowerCase();


    if (
        triggerType ===
        "explicit_mentor"
    ) {

        console.log(
            "[AI Mentor] Explicit @mentor request — poll bypassed."
        );

        return null;
    }


    return await createAutomaticAIMentorPoll(
        interventionId
    );
}


/* =========================================================
   AUTOMATIC CONFLICT DETECTION
   ========================================================= */

/*
 * Called when a new student message is added.
 *
 * IMPORTANT:
 *
 * A normal student message does NOT directly
 * trigger the AI response.
 *
 * It can only create an intervention/poll
 * when the database detector identifies an
 * actual conflict.
 */

async function detectAutomaticAIIntervention(
    messageId,
    messageText
) {

    if (
        !activeClassroomId ||
        !messageId ||
        !messageText
    ) {
        return;
    }


    /*
     * @mentor is intentionally excluded from
     * automatic detection.
     *
     * It has its own direct path.
     */

    if (
        /(^|\s)@mentor\b/i.test(
            messageText
        )
    ) {

        console.log(
            "[AI Mentor] @mentor detected — automatic poll skipped."
        );

        return;
    }


    /*
     * Ask the database's conflict detector.
     */

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "detect_study_conflicting_answers",
            {
                p_message_id:
                    messageId,

                p_classroom_id:
                    activeClassroomId,

                p_message:
                    messageText
            }
        );


    if (error) {

        console.error(
            "[AI Mentor] Conflict detector failed:",
            error
        );

        return;
    }


    console.log(
        "[AI Mentor] Conflict detector result:",
        data
    );


    /*
     * Nothing detected.
     */

    if (!data) {
        return;
    }


    /*
     * Some SQL functions return a single
     * boolean, while others return JSON.
     *
     * Handle both safely.
     */

    if (
        typeof data === "boolean"
    ) {

        if (!data) {
            return;
        }

        /*
         * If the detector only returns TRUE,
         * we need an intervention record to
         * exist before creating a poll.
         *
         * The database-side detector should
         * normally create it.
         */

        return;

    }


    /*
     * JSON result.
     */

    const intervention =
        Array.isArray(data)
            ? data[0]
            : data;


    if (!intervention) {
        return;
    }


    if (
        intervention.detected === false ||
        intervention.triggered === false
    ) {
        return;
    }


    await ensureAIMentorPoll(
        intervention
    );

}

/* =========================================================
   NOW-or-NEVER — STUDY SQUAD
   STUDY-SQUAD.JS
   PART 4 / 5
   ========================================================= */


/* =========================================================
   HANDLE NEW STUDENT MESSAGE
   ========================================================= */

/*
 * This is the central message handler for the
 * automatic AI intervention system.
 *
 * NORMAL STUDENT MESSAGE
 *        ↓
 *   conflict/doubt detection
 *        ↓
 *   intervention
 *        ↓
 *      AI POLL
 *        ↓
 *   >50% YES
 *        ↓
 *     AI replies
 *
 *
 * @mentor MESSAGE
 *        ↓
 *   DIRECT AI RESPONSE
 *
 * @mentor NEVER enters the poll.
 */

async function handleStudyMessageForAIMentor(
    message
) {

    if (!message) {
        return;
    }


    const messageId =
        message.id;


    const messageText =
        String(
            message.message ||
            ""
        ).trim();


    if (
        !messageId ||
        !messageText
    ) {
        return;
    }


    /*
     * Ignore messages generated by the AI itself.
     */

    const messageType =
        String(
            message.message_type ||
            ""
        ).toLowerCase();


    if (
        messageType === "ai" ||
        messageType === "assistant" ||
        messageType === "mentor"
    ) {

        return;
    }


    /*
     * =====================================================
     * EXPLICIT @mentor BYPASS
     * =====================================================
     *
     * This is intentional.
     *
     * If the student explicitly writes:
     *
     *     @mentor
     *
     * or:
     *
     *     @mentor I don't understand this
     *
     * the AI should answer directly.
     *
     * No poll.
     * No majority vote.
     */

    if (
        /(^|\s)@mentor\b/i.test(
            messageText
        )
    ) {

        console.log(
            "[AI Mentor] Explicit @mentor request detected:",
            messageId
        );


        await handleExplicitMentorRequest(
            message
        );


        return;
    }


    /*
     * =====================================================
     * NORMAL STUDENT MESSAGE
     * =====================================================
     *
     * A normal message must NEVER directly
     * trigger an AI answer.
     *
     * We only send it through the detector.
     */

    console.log(
        "[AI Mentor] Checking normal student message:",
        messageId
    );


    await detectAutomaticAIIntervention(
        messageId,
        messageText
    );

}


/* =========================================================
   EXPLICIT @MENTOR HANDLER
   ========================================================= */

/*
 * @mentor is the ONLY automatic direct-entry path.
 *
 * This function deliberately does NOT call:
 *
 *     createAutomaticAIMentorPoll()
 *
 * and does NOT call:
 *
 *     detectAutomaticAIIntervention()
 *
 */

async function handleExplicitMentorRequest(
    message
) {

    if (!message) {
        return;
    }


    const messageText =
        String(
            message.message ||
            ""
        ).trim();


    if (!messageText) {
        return;
    }


    /*
     * Remove @mentor from the message before
     * sending the actual question to the AI.
     */

    const cleanMessage =
        messageText
            .replace(
                /(^|\s)@mentor\b/ig,
                " "
            )
            .trim();


    if (!cleanMessage) {

        /*
         * If the student only wrote @mentor,
         * ask what they need help with.
         */

        await sendDirectAIMentorMessage(
            "I'm here! 🤖 What do you need help with?"
        );

        return;
    }


    console.log(
        "[AI Mentor] Sending direct @mentor request."
    );


    await sendExplicitMentorToBackend(
        cleanMessage,
        message
    );

}


/* =========================================================
   SEND EXPLICIT MENTOR REQUEST
   ========================================================= */

async function sendExplicitMentorToBackend(
    messageText,
    originalMessage
) {

    if (!messageText) {
        return;
    }


    /*
     * First try the existing database RPC.
     *
     * This keeps the explicit mentor path
     * compatible with the existing Study Squad
     * backend.
     */

    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "request_study_mentor",
                {
                    p_classroom_id:
                        activeClassroomId,

                    p_message:
                        messageText
                }
            );


        if (!error) {

            console.log(
                "[AI Mentor] Explicit mentor request created:",
                data
            );


            /*
             * Existing AI processing system can now
             * process this direct request.
             */

            await loadClassroomMessages();

            return;
        }


        console.warn(
            "[AI Mentor] request_study_mentor RPC failed:",
            error
        );


    } catch (error) {

        console.warn(
            "[AI Mentor] Explicit mentor RPC exception:",
            error
        );

    }


    /*
     * Fallback:
     *
     * If request_study_mentor() is not available
     * in the current database version, directly
     * invoke the existing AI mentor endpoint.
     *
     * This fallback intentionally does NOT create
     * an AI poll.
     */

    await sendDirectAIMentorRequest(
        messageText,
        originalMessage
    );

}


/* =========================================================
   DIRECT AI MENTOR REQUEST
   ========================================================= */

async function sendDirectAIMentorRequest(
    messageText,
    originalMessage
) {

    if (!messageText) {
        return;
    }


    /*
     * Prevent accidental duplicate requests.
     */

    const requestKey =
        String(
            originalMessage?.id ||
            Date.now()
        );


    if (
        window.__processedMentorRequests &&
        window.__processedMentorRequests.has(
            requestKey
        )
    ) {

        return;
    }


    if (
        !window.__processedMentorRequests
    ) {

        window.__processedMentorRequests =
            new Set();

    }


    window.__processedMentorRequests.add(
        requestKey
    );


    try {

        /*
         * Use the existing Study Squad AI
         * endpoint if it has been exposed by
         * the application.
         */

        if (
            typeof window.sendStudyAIMentorMessage ===
            "function"
        ) {

            await window.sendStudyAIMentorMessage(
                messageText,
                {
                    classroomId:
                        activeClassroomId,

                    source:
                        "explicit_mentor",

                    messageId:
                        originalMessage?.id
                }
            );

            return;
        }


        /*
         * Second compatibility path.
         */

        if (
            typeof window.askStudyAI ===
            "function"
        ) {

            await window.askStudyAI(
                messageText
            );

            return;
        }


        console.warn(
            "[AI Mentor] No direct AI handler is available."
        );


    } catch (error) {

        console.error(
            "[AI Mentor] Direct AI request failed:",
            error
        );


        /*
         * Allow retry if the request failed.
         */

        window.__processedMentorRequests.delete(
            requestKey
        );


        showToast(
            "⚠️ AI Mentor could not respond right now."
        );

    }

}


/* =========================================================
   SIMPLE DIRECT AI MESSAGE
   ========================================================= */

async function sendDirectAIMentorMessage(
    text
) {

    if (!text) {
        return;
    }


    /*
     * Use the application's existing message
     * renderer if available.
     */

    if (
        typeof window.addStudyAIMessage ===
        "function"
    ) {

        window.addStudyAIMessage(
            text
        );

        return;
    }


    if (
        typeof window.addMessage ===
        "function"
    ) {

        /*
         * Existing addMessage() implementations
         * may use different signatures.
         *
         * Try the simplest form first.
         */

        try {

            window.addMessage(
                "ai",
                text
            );

            return;

        } catch (error) {

            console.warn(
                "[AI Mentor] addMessage fallback failed:",
                error
            );

        }

    }


    /*
     * Last-resort UI notification.
     */

    showToast(
        "🤖 " + text
    );

}


/* =========================================================
   WATCH FOR NEW CLASSROOM MESSAGES
   ========================================================= */

let aiMentorMessageChannel =
    null;


/*
 * IDs already inspected by the browser.
 *
 * This prevents the same student message from
 * repeatedly triggering the detector when the
 * realtime channel sends an update.
 */

const aiMentorCheckedMessages =
    new Set();


/* =========================================================
   START AI MESSAGE WATCHER
   ========================================================= */

function startAIMentorMessageWatcher() {

    if (!activeClassroomId) {

        console.warn(
            "[AI Mentor] Cannot watch messages — no classroom."
        );

        return;
    }


    stopAIMentorMessageWatcher();


    console.log(
        "[AI Mentor] Starting realtime message watcher:",
        activeClassroomId
    );


    /*
     * Supabase Realtime.
     */

    aiMentorMessageChannel =
        supabaseClient
            .channel(
                "ai-mentor-messages-" +
                activeClassroomId
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "study_messages",

                    filter:
                        "classroom_id=eq." +
                        activeClassroomId
                },
                async payload => {

                    const newMessage =
                        payload?.new;


                    if (!newMessage) {
                        return;
                    }


                    const messageId =
                        newMessage.id;


                    /*
                     * Ignore duplicates.
                     */

                    if (
                        aiMentorCheckedMessages.has(
                            messageId
                        )
                    ) {

                        return;
                    }


                    aiMentorCheckedMessages.add(
                        messageId
                    );


                    /*
                     * Keep the set from growing forever.
                     */

                    if (
                        aiMentorCheckedMessages.size >
                        500
                    ) {

                        const first =
                            aiMentorCheckedMessages
                                .values()
                                .next()
                                .value;

                        if (first) {

                            aiMentorCheckedMessages.delete(
                                first
                            );

                        }

                    }


                    await handleStudyMessageForAIMentor(
                        newMessage
                    );

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "[AI Mentor] Realtime status:",
                        status
                    );

                }
            );

}


/* =========================================================
   STOP AI MESSAGE WATCHER
   ========================================================= */

function stopAIMentorMessageWatcher() {

    if (
        aiMentorMessageChannel
    ) {

        try {

            supabaseClient.removeChannel(
                aiMentorMessageChannel
            );

        } catch (error) {

            console.warn(
                "[AI Mentor] Could not remove realtime channel:",
                error
            );

        }


        aiMentorMessageChannel =
            null;

    }

}


/* =========================================================
   START COMPLETE AI MENTOR SYSTEM
   ========================================================= */

function startCompleteAIMentorSystem() {

    if (!activeClassroomId) {

        console.warn(
            "[AI Mentor] Complete system cannot start — no classroom."
        );

        return;
    }


    console.log(
        "[AI Mentor] Starting complete AI Mentor system."
    );


    /*
     * Automatic poll system.
     */

    startAIMentorPollSystem();


    /*
     * Realtime student-message watcher.
     */

    startAIMentorMessageWatcher();

}


/* =========================================================
   STOP COMPLETE AI MENTOR SYSTEM
   ========================================================= */

function stopCompleteAIMentorSystem() {

    stopAIMentorPollSystem();

    stopAIMentorMessageWatcher();


    console.log(
        "[AI Mentor] Complete system stopped."
    );

}


/* =========================================================
   CLASSROOM CHANGE HOOK
   ========================================================= */

function restartAIMentorSystemForClassroom() {

    stopCompleteAIMentorSystem();


    if (!activeClassroomId) {

        console.log(
            "[AI Mentor] No active classroom."
        );

        return;
    }


    /*
     * Give the classroom state a moment to settle
     * before subscribing.
     */

    setTimeout(
        () => {

            if (
                activeClassroomId
            ) {

                startCompleteAIMentorSystem();

            }

        },
        100
    );

}


/* =========================================================
   PAGE CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopCompleteAIMentorSystem();

    }
);


/* =========================================================
   EXPOSE FUNCTIONS FOR EXISTING APP CODE
   ========================================================= */

window.startAIMentorPollSystem =
    startAIMentorPollSystem;


window.stopAIMentorPollSystem =
    stopAIMentorPollSystem;


window.loadAIMentorPolls =
    loadAIMentorPolls;


window.submitAIPollVote =
    submitAIPollVote;


window.handleStudyMessageForAIMentor =
    handleStudyMessageForAIMentor;


window.startAIMentorMessageWatcher =
    startAIMentorMessageWatcher;


window.stopAIMentorMessageWatcher =
    stopAIMentorMessageWatcher;


window.startCompleteAIMentorSystem =
    startCompleteAIMentorSystem;


window.stopCompleteAIMentorSystem =
    stopCompleteAIMentorSystem;


window.restartAIMentorSystemForClassroom =
    restartAIMentorSystemForClassroom;


/* =========================================================
   END PART 4 / 5
   ========================================================= */

            console.warn(
                "[AI Mentor] Could not remove realtime channel:",
                error
            );
        }


        aiMentorMessageChannel =
            null;

    }

}


/* =========================================================
   START COMPLETE AI MENTOR SYSTEM
   ========================================================= */

function startCompleteAIMentorSystem() {

    if (!activeClassroomId) {

        console.warn(
            "[AI Mentor] Complete system cannot start — no classroom."
        );

        return;
    }


    console.log(
        "[AI Mentor] Starting complete AI Mentor system."
    );


    /*
     * Automatic poll system.
     */

    startAIMentorPollSystem();


    /*
     * Realtime student-message watcher.
     */

    startAIMentorMessageWatcher();

}


/* =========================================================
   STOP COMPLETE AI MENTOR SYSTEM
   ========================================================= */

function stopCompleteAIMentorSystem() {

    stopAIMentorPollSystem();

    stopAIMentorMessageWatcher();


    console.log(
        "[AI Mentor] Complete system stopped."
    );

}


/* =========================================================
   CLASSROOM CHANGE HOOK
   ========================================================= */

function restartAIMentorSystemForClassroom() {

    stopCompleteAIMentorSystem();


    if (!activeClassroomId) {

        console.log(
            "[AI Mentor] No active classroom."
        );

        return;
    }


    /*
     * Give the classroom state a moment to settle
     * before subscribing.
     */

    setTimeout(
        () => {

            if (
                activeClassroomId
            ) {

                startCompleteAIMentorSystem();

            }

        },
        100
    );

}


/* =========================================================
   PAGE CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopCompleteAIMentorSystem();

    }
);


/* =========================================================
   EXPOSE FUNCTIONS FOR EXISTING APP CODE
   ========================================================= */

window.startAIMentorPollSystem =
    startAIMentorPollSystem;


window.stopAIMentorPollSystem =
    stopAIMentorPollSystem;


window.loadAIMentorPolls =
    loadAIMentorPolls;


window.submitAIPollVote =
    submitAIPollVote;


window.handleStudyMessageForAIMentor =
    handleStudyMessageForAIMentor;


window.startAIMentorMessageWatcher =
    startAIMentorMessageWatcher;


window.stopAIMentorMessageWatcher =
    stopAIMentorMessageWatcher;


window.startCompleteAIMentorSystem =
    startCompleteAIMentorSystem;


window.stopCompleteAIMentorSystem =
    stopCompleteAIMentorSystem;


window.restartAIMentorSystemForClassroom =
    restartAIMentorSystemForClassroom;


/* =========================================================
   END PART 5 / 5
   ========================================================= */
