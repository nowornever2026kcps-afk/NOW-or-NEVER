// Core application / Supabase / auth / navigation / initialization

/* ============================================
   SUPABASE CONFIGURATION
============================================ */

const SUPABASE_URL =
  "https://kvbbgvfrllptqpbkixnv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true
      }
    }
  );


/* ============================================
   HELPERS
============================================ */

const $ = id =>
  document.getElementById(id);


let currentUser = null;
let currentProfile = null;
let selectedShopCategory = "all";
let taskChannel = null;
let profileChannel = null;
let testChannel = null;
let studyChannel = null;
let taskRefreshTimer = null;
let weekRefreshTimer = null;
let selectedTestType = "NEET";
let personalRefreshTimer = null;


function localDate(){

  const d = new Date();

  return new Date(
    d.getTime() -
    d.getTimezoneOffset() * 60000
  )
  .toISOString()
  .slice(0,10);

}


function formatDate(value){

  return new Date(
    value + "T00:00:00"
  ).toLocaleDateString(
    "en-IN",
    {
      day:"2-digit",
      month:"short",
      year:"numeric"
    }
  );

}


function initials(name){

  if(!name) return "?";

  return name
    .slice(0,2)
    .toUpperCase();

}


function showToast(message){

  const t = $("toast");

  t.textContent = message;

  t.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer =
    setTimeout(
      () => t.classList.remove("show"),
      2600
    );

}


/* ============================================
   AUTH SCREEN
============================================ */

$("showSignup").addEventListener(
  "click",
  () => {

    $("loginBox").classList.add("hidden");
    $("signupBox").classList.remove("hidden");

  }
);


$("showLogin").addEventListener(
  "click",
  () => {

    $("signupBox").classList.add("hidden");
    $("loginBox").classList.remove("hidden");

  }
);


/* ============================================
   SIGN UP
============================================ */

$("signupBtn").addEventListener(
  "click",
  async () => {

    const name =
      $("signupName").value.trim();

    const username =
      $("signupUsername").value.trim()
      .toLowerCase();

    const email =
      $("signupEmail").value.trim();

    const password =
      $("signupPassword").value;


    if(!name){

      showToast("Enter your name.");

      return;

    }


    if(!username){

      showToast("Enter a username.");

      return;

    }


    if(!email){

      showToast("Enter your email.");

      return;

    }


    if(password.length < 6){

      showToast(
        "Password must be at least 6 characters."
      );

      return;

    }


    $("signupBtn").disabled = true;

    $("signupBtn").textContent =
      "Creating account...";


    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email: email,

        password: password,

        options: {

          data: {

            username: username,

            display_name: name

          }

        }

      });


    $("signupBtn").disabled = false;

    $("signupBtn").textContent =
      "Create account";


    if(error){

      showToast(error.message);

      return;

    }


    if(data.session){

      showToast(
        "Account created successfully!"
      );

    }else{

      showToast(
        "Account created. Check your email to confirm it."
      );

    }

  }
);


/* ============================================
   LOGIN
============================================ */

$("loginBtn").addEventListener(
  "click",
  async () => {

    const email =
      $("loginEmail").value.trim();

    const password =
      $("loginPassword").value;


    if(!email || !password){

      showToast(
        "Enter email and password."
      );

      return;

    }


    $("loginBtn").disabled = true;

    $("loginBtn").textContent =
      "Logging in...";


    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

      });


    $("loginBtn").disabled = false;

    $("loginBtn").textContent =
      "Login";


    if(error){

      showToast(error.message);

      return;

    }


    showToast("Welcome back!");

  }
);


/* ============================================
   LOGOUT
============================================ */

$("logoutBtn").addEventListener(
  "click",
  async () => {

    await supabaseClient.auth.signOut();

    stopRealtime();
    clearInterval(taskRefreshTimer);
    clearInterval(weekRefreshTimer);
    clearInterval(personalRefreshTimer);

    currentUser = null;

    currentProfile = null;

    showAuthScreen();

  }
);


/* ============================================
   AUTH STATE + STARTUP SESSION RESTORE
============================================ */

let authReady = false;
let sessionTransition = 0;

function hideSessionSplash(){
  const splash = $("sessionSplash");
  if(!splash) return;

  splash.classList.add("hide");

  setTimeout(() => {
    if(!document.body.classList.contains("starting")){
      splash.style.display = "none";
    }
  }, 320);
}

function showSessionSplash(){
  const splash = $("sessionSplash");
  if(!splash) return;

  splash.style.display = "grid";
  splash.classList.remove("hide");
}

async function applyAuthSession(session, isStartup=false){

  const transition = ++sessionTransition;

  if(session && session.user){

    if(isStartup || !authReady){
      showSessionSplash();
    }

    currentUser = session.user;

    await loadProfile();

    if(transition !== sessionTransition) return;

    showMainApp();

    if(isStartup || !authReady){
      await new Promise(resolve => setTimeout(resolve, 520));
    }

    if(transition !== sessionTransition) return;

    document.body.classList.remove("starting");
    authReady = true;
    hideSessionSplash();

    await refreshAll();

  }else{

    currentUser = null;
    currentProfile = null;

    document.body.classList.remove("starting");
    authReady = true;
    hideSessionSplash();
    showAuthScreen();

  }
}

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    applyAuthSession(
      session,
      event === "INITIAL_SESSION"
    );

  }
);

(async function bootSavedSession(){
  try{
    const {data,error} =
      await supabaseClient.auth.getSession();

    if(error){
      console.error("SESSION RESTORE:",error);
      if(!authReady){
        document.body.classList.remove("starting");
        authReady = true;
        hideSessionSplash();
        showAuthScreen();
      }
      return;
    }

    if(!authReady){
      await applyAuthSession(
        data?.session || null,
        true
      );
    }

  }catch(error){

    console.error("SESSION BOOT:",error);

    if(!authReady){
      document.body.classList.remove("starting");
      authReady = true;
      hideSessionSplash();
      showAuthScreen();
    }

  }
})();



/* ============================================
   SHOW / HIDE APPLICATION
============================================ */

function showAuthScreen(){

  $("authScreen")
    .classList.remove("hidden");

  $("mainApp")
    .classList.add("hidden");

}


function showMainApp(){

  $("authScreen")
    .classList.add("hidden");

  $("mainApp")
    .classList.remove("hidden");

}


/* ============================================
   NAVIGATION
============================================ */

document
  .querySelectorAll(".nav button")
  .forEach(
    btn => {

      btn.addEventListener(
        "click",
        async () => {

          document
            .querySelectorAll(".nav button")
            .forEach(
              b =>
                b.classList.remove(
                  "active"
                )
            );


          document
            .querySelectorAll(".view")
            .forEach(
              v =>
                v.classList.remove(
                  "active"
                )
            );


          btn.classList.add(
            "active"
          );


          $(btn.dataset.view)
            .classList.add(
              "active"
            );


          if(
            btn.dataset.view ===
            "tasks"
          ){

            await renderTasks();

          }


          if(
            btn.dataset.view ===
            "tests"
          ){

            await renderTests();

          }


          if(
            btn.dataset.view ===
            "personal"
          ){

            await renderPersonal();

          }


          if(
            btn.dataset.view ===
            "shop"
          ){

            await renderShop();

          }


          if(
            btn.dataset.view ===
            "leaderboard"
          ){

            await renderBoard();

          }


          if(
            btn.dataset.view ===
            "history"
          ){

            await renderHistory();

          }

        }
      );

    }
  );


/* ============================================
   SECURITY / HTML ESCAPING
============================================ */

function escapeHtml(value){

  return String(value ?? "")
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


/* ============================================
   INITIALIZATION
============================================ */

$("date").value =
  localDate();

$("testDate").value =
  localDate();

$("testMax").value =
  720;

$("todayText").textContent =
  new Date().toLocaleDateString(
    "en-IN",
    {
      weekday:"short",
      day:"2-digit",
      month:"short"
    }
  );

/* =========================================================
   NOW OR NEVER — EVERYONE REMINDER + NOTIFICATION SYSTEM
   ========================================================= */

(function initReminderSystem() {

  let selectedReminderTarget = null;
  let notificationChannel = null;

  const reminderBtn =
    document.getElementById("remindEveryoneBtn");

  const reminderModal =
    document.getElementById("reminderModal");

  const reminderModalBackdrop =
    document.getElementById("reminderModalBackdrop");

  const reminderClose =
    document.getElementById("reminderClose");

  const sendReminderBtn =
    document.getElementById("sendReminderBtn");

  const reminderSelected =
    document.getElementById("reminderSelected");

  const notificationBell =
    document.getElementById("notificationBell");

  const notificationPanel =
    document.getElementById("notificationPanel");

  const notificationClose =
    document.getElementById("notificationClose");

  const notificationList =
    document.getElementById("notificationList");

  const notificationCount =
    document.getElementById("notificationCount");


  /* ---------------------------------------------------------
     Safety check
     --------------------------------------------------------- */

  if (!reminderBtn) {
    console.warn(
      "[Reminder System] Reminder button not found."
    );
    return;
  }


  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
  }


  function showReminderModal() {

    if (!reminderModal) return;

    reminderModal.classList.remove("hidden");

    selectedReminderTarget = null;

    if (sendReminderBtn) {
      sendReminderBtn.disabled = true;
    }

    if (reminderSelected) {
      reminderSelected.textContent =
        "Select what you want everyone to update.";
    }

    document
      .querySelectorAll(".reminder-option")
      .forEach(option => {
        option.classList.remove("selected");
      });
  }


  function closeReminderModal() {

    if (!reminderModal) return;

    reminderModal.classList.add("hidden");

  }


  /* ---------------------------------------------------------
     OPEN REMINDER MODAL
     --------------------------------------------------------- */

  reminderBtn.addEventListener(
    "click",
    showReminderModal
  );


  /* ---------------------------------------------------------
     CLOSE REMINDER MODAL
     --------------------------------------------------------- */

  if (reminderClose) {

    reminderClose.addEventListener(
      "click",
      closeReminderModal
    );

  }


  if (reminderModalBackdrop) {

    reminderModalBackdrop.addEventListener(
      "click",
      closeReminderModal
    );

  }


  /* ---------------------------------------------------------
     REMINDER OPTION SELECTION
     --------------------------------------------------------- */

  document
    .querySelectorAll(".reminder-option")
    .forEach(option => {

      option.addEventListener(
        "click",
        () => {

          selectedReminderTarget =
            option.dataset.reminderTarget;

          document
            .querySelectorAll(".reminder-option")
            .forEach(item => {
              item.classList.remove("selected");
            });

          option.classList.add("selected");


          const names = {
            hours: "study hours",
            tasks: "tasks",
            tests: "tests",
            all: "everything"
          };


          if (reminderSelected) {

            reminderSelected.textContent =
              `Everyone will be reminded to update their ${names[selectedReminderTarget]}.`;

          }


          if (sendReminderBtn) {
            sendReminderBtn.disabled = false;
          }

        }
      );

    });


  /* ---------------------------------------------------------
     SEND REMINDER
     --------------------------------------------------------- */

  if (sendReminderBtn) {

    sendReminderBtn.addEventListener(
      "click",
      async () => {

        if (!selectedReminderTarget) {
          return;
        }


        sendReminderBtn.disabled = true;

        const originalText =
          sendReminderBtn.textContent;

        sendReminderBtn.textContent =
          "📢 Sending...";


        try {

          const {
            data,
            error
          } = await supabase.rpc(
            "send_everyone_reminder",
            {
              p_target:
                selectedReminderTarget
            }
          );


          if (error) {
            throw error;
          }


          console.log(
            "[Reminder System] Reminder sent:",
            data
          );


          closeReminderModal();


          if (typeof showToast === "function") {

            showToast(
              `🔔 Reminder sent to ${data?.count ?? "everyone"} users!`
            );

          } else {

            alert(
              `🔔 Reminder sent to ${data?.count ?? "everyone"} users!`
            );

          }

        }

        catch (error) {

          console.error(
            "[Reminder System] Send failed:",
            error
          );


          const message =
            error?.message ||
            "Could not send the reminder.";


          if (typeof showToast === "function") {

            showToast(
              `⚠️ ${message}`
            );

          } else {

            alert(
              `⚠️ ${message}`
            );

          }

        }

        finally {

          sendReminderBtn.disabled = false;

          sendReminderBtn.textContent =
            originalText;

        }

      }
    );

  }


  /* =========================================================
     NOTIFICATIONS
     ========================================================= */


  async function loadNotifications() {

    if (!notificationList) return;


    try {

      const {
        data,
        error
      } = await supabase
        .from("notifications")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(30);


      if (error) {
        throw error;
      }


      renderNotifications(data || []);

    }

    catch (error) {

      console.error(
        "[Notification System] Load failed:",
        error
      );

    }

  }


  /* ---------------------------------------------------------
     RENDER NOTIFICATIONS
     --------------------------------------------------------- */

  function renderNotifications(notifications) {

    if (!notificationList) return;


    if (!notifications.length) {

      notificationList.innerHTML = `
        <div class="notification-empty">
          No notifications yet.
        </div>
      `;

      updateNotificationCount(0);

      return;
    }


    let unread = 0;


    notificationList.innerHTML =
      notifications.map(notification => {

        if (!notification.is_read) {
          unread++;
        }


        const date =
          notification.created_at
            ? new Date(
                notification.created_at
              ).toLocaleString()
            : "";


        return `
          <div
            class="notification-item ${
              notification.is_read
                ? ""
                : "unread"
            }"
            data-notification-id="${notification.id}"
            data-reminder-target="${escapeHTML(
              notification.reminder_target || "all"
            )}"
          >

            <div class="notification-item-icon">
              🔔
            </div>

            <div class="notification-item-content">

              <div class="notification-item-message">
                ${escapeHTML(
                  notification.message
                )}
              </div>

              <div class="notification-item-time">
                ${escapeHTML(date)}
              </div>

            </div>

          </div>
        `;

      }).join("");


    updateNotificationCount(unread);


    /* Make notifications clickable */

    notificationList
      .querySelectorAll(".notification-item")
      .forEach(item => {

        item.addEventListener(
          "click",
          () => {

            const target =
              item.dataset.reminderTarget;

            markNotificationRead(
              item.dataset.notificationId
            );

            notificationPanel?.classList.add(
              "hidden"
            );

            openRelevantSection(target);

          }
        );

      });

  }


  /* ---------------------------------------------------------
     NOTIFICATION COUNT
     --------------------------------------------------------- */

  function updateNotificationCount(count) {

    if (!notificationCount) return;


    notificationCount.textContent =
      count > 99
        ? "99+"
        : String(count);


    notificationCount.classList.toggle(
      "hidden",
      count <= 0
    );

  }


  /* ---------------------------------------------------------
     MARK READ
     --------------------------------------------------------- */

  async function markNotificationRead(id) {

    if (!id) return;


    try {

      await supabase
        .from("notifications")
        .update({
          is_read: true
        })
        .eq("id", id);

      loadNotifications();

    }

    catch (error) {

      console.error(
        "[Notification System] Mark read failed:",
        error
      );

    }

  }


  /* ---------------------------------------------------------
     OPEN RELEVANT WEBSITE SECTION
     --------------------------------------------------------- */

  function openRelevantSection(target) {

    const sectionMap = {

      hours: [
        "#daily",
        "#daily-section",
        '[data-section="daily"]'
      ],

      tasks: [
        "#tasks",
        "#tasks-section",
        '[data-section="tasks"]'
      ],

      tests: [
        "#tests",
        "#tests-section",
        '[data-section="tests"]'
      ],

      all: [
        "#daily",
        "#daily-section",
        '[data-section="daily"]'
      ]

    };


    const selectors =
      sectionMap[target] ||
      sectionMap.all;


    for (const selector of selectors) {

      const element =
        document.querySelector(selector);


      if (element) {

        element.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        break;

      }

    }

  }


  /* =========================================================
     NOTIFICATION BELL
     ========================================================= */

  if (notificationBell) {

    notificationBell.addEventListener(
      "click",
      async () => {

        if (!notificationPanel) return;

        notificationPanel.classList.toggle(
          "hidden"
        );


        if (
          !notificationPanel.classList.contains(
            "hidden"
          )
        ) {

          await loadNotifications();

        }

      }
    );

  }


  if (notificationClose) {

    notificationClose.addEventListener(
      "click",
      () => {

        notificationPanel?.classList.add(
          "hidden"
        );

      }
    );

  }


  /* =========================================================
     REALTIME
     ========================================================= */

  async function startNotificationRealtime() {

    try {

      /* Remove previous channel if one exists */

      if (notificationChannel) {

        await supabase.removeChannel(
          notificationChannel
        );

      }


      /* Get current user */

      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();


      if (!user) {

        console.log(
          "[Notification System] No logged-in user yet."
        );

        return;

      }


      notificationChannel =
        supabase
          .channel(
            `notifications-${user.id}`
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter:
                `recipient_id=eq.${user.id}`
            },
            payload => {

              console.log(
                "[Notification System] New notification:",
                payload.new
              );


              loadNotifications();


              /* Show immediate toast */

              if (
                typeof showToast ===
                "function"
              ) {

                showToast(
                  `🔔 ${payload.new.message}`
                );

              }

            }
          )
          .subscribe(
            status => {

              console.log(
                "[Notification System] Realtime:",
                status
              );

            }
          );

    }

    catch (error) {

      console.error(
        "[Notification System] Realtime failed:",
        error
      );

    }

  }


  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  loadNotifications();

  startNotificationRealtime();


  /* =========================================================
     RESTART WHEN AUTH STATE CHANGES
     ========================================================= */

  supabase.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      console.log(
        "[Notification System] Auth:",
        event
      );


      if (event === "SIGNED_IN") {

        await startNotificationRealtime();

        await loadNotifications();

      }


      if (event === "SIGNED_OUT") {

        if (notificationChannel) {

          await supabase.removeChannel(
            notificationChannel
          );

          notificationChannel = null;

        }


        if (notificationList) {

          notificationList.innerHTML = `
            <div class="notification-empty">
              No notifications yet.
            </div>
          `;

        }

        updateNotificationCount(0);

      }

    }
  );


})();
// Authentication startup is intentionally deferred until the
// auth listener below is registered. This prevents the login page
// from flashing before Supabase restores a saved session.
