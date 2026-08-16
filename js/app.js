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


// Authentication startup is intentionally deferred until the
// auth listener below is registered. This prevents the login page
// from flashing before Supabase restores a saved session.
