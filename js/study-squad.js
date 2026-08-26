/* =========================================================
   NOW-or-NEVER — STUDY SQUAD
   STEP 2 — FRONTEND SHELL
   ======================================================== */

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
    setTimeout(
      () => {
        toast.classList.remove("show");
      },
      2600
    );
}


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

  if (!createClassroomModal) {
    return;
  }

  createClassroomModal
    .classList
    .remove("hidden");

}


function closeCreateClassroomModal() {

  if (!createClassroomModal) {
    return;
  }

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
   BROWSE
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
   INITIAL LOAD
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "[Study Squad] Frontend loaded."
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

      return;
    }

    if (!data?.session) {

      console.log(
        "[Study Squad] No active session."
      );

      /*
       * For now we simply send the user
       * back to the main login page.
       */

      window.location.href =
        "index.html";

      return;
    }

    console.log(
      "[Study Squad] Logged in:",
      data.session.user.id
    );

  }
);
