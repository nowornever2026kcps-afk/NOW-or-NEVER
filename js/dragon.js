/* =========================================================
   NOW OR NEVER — STORM WYRM
   Tiny image-based dragon cosmetic
   Lightning + aura + particles preserved
   ========================================================= */

(function(){

  "use strict";

  const DRAGON_ID = "cosmetic_dragon_storm";

  let activeHosts = new Set();

  let rafId = null;

  let lastTime = 0;

  let lightningTimer = 0;

  let nextLightning = 2600;


  /* =========================================================
     DEVICE / MOTION HELPERS
     ========================================================= */

  const isMobile = () =>
    window.matchMedia("(max-width:700px)").matches;

  const reducedMotion = () =>
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* =========================================================
     RANDOM
     ========================================================= */

  function random(min,max){

    return Math.random() * (max-min) + min;

  }


  /* =========================================================
     CANVAS
     
     The canvas is now used ONLY for lightning.
     The Dragon itself is the PNG image.
     ========================================================= */

  function createCanvas(host){

    const canvas=document.createElement("canvas");

    canvas.className="dragon-canvas";

    canvas.setAttribute(
      "aria-hidden",
      "true"
    );

    host.appendChild(canvas);

    /*
     * The Dragon is already attached to the page
     * before this function is called.
     *
     * Therefore the canvas can get its real size.
     */

    resizeCanvas(canvas);

    window.addEventListener(
      "resize",
      ()=>{
        resizeCanvas(canvas);
      },
      {
        passive:true
      }
    );

    return canvas;

  }


  /* =========================================================
     RESIZE CANVAS
     ========================================================= */

  function resizeCanvas(canvas){

    if(!canvas) return;

    const rect=
      canvas.getBoundingClientRect();

    const dpr=Math.min(
      window.devicePixelRatio || 1,
      isMobile() ? 1.25 : 1.75
    );

    canvas.width=
      Math.max(
        1,
        Math.floor(rect.width*dpr)
      );

    canvas.height=
      Math.max(
        1,
        Math.floor(rect.height*dpr)
      );

    const ctx=
      canvas.getContext("2d");

    if(ctx){

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

    }

  }


  /* =========================================================
     PARTICLES
     ========================================================= */

  function createParticles(host){

    const count=
      isMobile()
        ? 8
        : 16;

    for(
      let i=0;
      i<count;
      i++
    ){

      const particle=
        document.createElement("span");

      particle.className=
        "dragon-particle";

      particle.style.left=
        random(20,80)+"%";

      particle.style.top=
        random(35,70)+"%";

      particle.style.setProperty(
        "--particle-x",
        random(-45,45)+"px"
      );

      particle.style.setProperty(
        "--particle-y",
        random(-35,-90)+"px"
      );

      particle.style.setProperty(
        "--particle-duration",
        random(2.2,4.2)+"s"
      );

      particle.style.setProperty(
        "--particle-delay",
        random(-4,0)+"s"
      );

      host.appendChild(
        particle
      );

    }

  }


  /* =========================================================
     LIGHTNING
     
     This is preserved from the original system.
     ========================================================= */

  function drawLightning(
    ctx,
    w,
    h,
    t
  ){

    const x=w*.5;

    const y=h*.48;

    ctx.save();

    ctx.globalCompositeOperation=
      "lighter";

    ctx.shadowBlur=9;

    ctx.shadowColor=
      "rgba(110,210,255,.95)";

    ctx.beginPath();

    let px=
      x+random(-8,8);

    let py=
      y-10;

    ctx.moveTo(
      px,
      py
    );

    const segments=
      isMobile()
        ? 5
        : 8;

    for(
      let i=0;
      i<segments;
      i++
    ){

      px+=random(-18,18);

      py+=h*.055;

      ctx.lineTo(
        px,
        py
      );

    }

    ctx.strokeStyle=
      "rgba(190,245,255,.95)";

    ctx.lineWidth=
      isMobile()
        ? 1.2
        : 1.7;

    ctx.stroke();

    ctx.restore();

  }


  /* =========================================================
     FLASH EFFECT
     ========================================================= */

  function flash(host){

    const flash=
      document.createElement("div");

    flash.className=
      "dragon-flash";

    host.appendChild(
      flash
    );

    requestAnimationFrame(
      ()=>{
        flash.classList.add(
          "active"
        );
      }
    );

    setTimeout(
      ()=>{
        flash.remove();
      },
      450
    );

  }


  /* =========================================================
     LIGHTNING BURST
     ========================================================= */

  function lightningBurst(host){

    if(reducedMotion()) return;

    const canvas=
      host.querySelector(
        ".dragon-canvas"
      );

    if(!canvas) return;

    const ctx=
      canvas.getContext("2d");

    if(!ctx) return;

    const rect=
      canvas.getBoundingClientRect();

    drawLightning(
      ctx,
      rect.width,
      rect.height,
      performance.now()
    );

    flash(host);

  }


  /* =========================================================
     CREATE DRAGON
     
     IMPORTANT:
     The PNG Dragon is attached first.
     The canvas is created AFTER the Dragon is attached,
     so the canvas gets the correct dimensions.
     ========================================================= */

  function createDragon(host){

    if(
      !host ||
      host.dataset.dragonActive==="true"
    ){

      return;

    }

    host.dataset.dragonActive="true";

    host.classList.add(
      "leader-dragon-host"
    );


    /* -------------------------------------------------------
       MAIN DRAGON CONTAINER
       ------------------------------------------------------- */

    const dragon=
      document.createElement("div");

    dragon.className=
      "dragon-cosmetic";

    dragon.dataset.dragon=
      "storm-wyrm";


    /* -------------------------------------------------------
       AURA
       ------------------------------------------------------- */

    const aura=
      document.createElement("div");

    aura.className=
      "dragon-aura";


    /* -------------------------------------------------------
       CORE
       ------------------------------------------------------- */

    const core=
      document.createElement("div");

    core.className=
      "dragon-core";


    dragon.appendChild(
      aura
    );

    dragon.appendChild(
      core
    );


    /* -------------------------------------------------------
       TINY STORM WYRM IMAGE
       
       IMPORTANT:
       Put the image at:

       assets/storm-wyrm.png

       The image must have a transparent background.
       ------------------------------------------------------- */

    const dragonImage=
      document.createElement("img");

    dragonImage.className=
      "dragon-image";

    dragonImage.src=
      "assets/storm-wyrm.png";

    dragonImage.alt=
      "Storm Wyrm";

    dragonImage.draggable=false;


    /*
     * Inline styling makes the image work even if
     * dragon.css does not contain .dragon-image yet.
     */

    dragonImage.style.position=
      "absolute";

    dragonImage.style.left=
      "50%";

    dragonImage.style.top=
      "50%";

    dragonImage.style.width=
      isMobile()
        ? "46px"
        : "58px";

    dragonImage.style.height=
      isMobile()
        ? "46px"
        : "58px";

    dragonImage.style.objectFit=
      "contain";

    dragonImage.style.transform=
      "translate(-50%,-50%)";

    dragonImage.style.zIndex=
      "4";

    dragonImage.style.pointerEvents=
      "none";

    dragonImage.style.userSelect=
      "none";

    dragonImage.style.filter=
      "drop-shadow(0 0 4px rgba(90,210,255,.95)) drop-shadow(0 0 10px rgba(80,110,255,.65))";


    /*
     * Tiny floating animation.
     */

    dragonImage.style.animation=
      "stormWyrmFloat 2.4s ease-in-out infinite";


    /*
     * Helpful error logging if the PNG path is wrong.
     */

    dragonImage.addEventListener(
      "error",
      ()=>{
        console.error(
          "[Storm Wyrm] Image failed to load:",
          dragonImage.src
        );
      }
    );


    dragonImage.addEventListener(
      "load",
      ()=>{
        console.log(
          "[Storm Wyrm] Image loaded:",
          dragonImage.naturalWidth,
          "x",
          dragonImage.naturalHeight
        );
      }
    );


    dragon.appendChild(
      dragonImage
    );


    /* -------------------------------------------------------
       PARTICLES
       ------------------------------------------------------- */

    createParticles(
      dragon
    );


    /* -------------------------------------------------------
       LABEL
       ------------------------------------------------------- */

    const label=
      document.createElement("div");

    label.className=
      "dragon-label";

    label.textContent=
      "STORM WYRM";

    dragon.appendChild(
      label
    );


    /* -------------------------------------------------------
       IMPORTANT:
       ATTACH DRAGON TO PAGE FIRST
       ------------------------------------------------------- */

    host.appendChild(
      dragon
    );


    /* -------------------------------------------------------
       LIGHTNING CANVAS
       
       Canvas is created AFTER the Dragon is attached.
       This fixes the previous 1x1 canvas problem.
       ------------------------------------------------------- */

    const canvas=
      createCanvas(
        dragon
      );


    /* -------------------------------------------------------
       TRACK ACTIVE DRAGON
       ------------------------------------------------------- */

    const entry={
      host,
      dragon,
      canvas
    };

    activeHosts.add(
      entry
    );


    /* -------------------------------------------------------
       START ANIMATION
       ------------------------------------------------------- */

    if(!reducedMotion()){

      startLoop();

    }


    return dragon;

  }


  /* =========================================================
     REMOVE DRAGON
     ========================================================= */

  function removeDragon(host){

    if(!host) return;


    const dragon=
      host.querySelector(
        '[data-dragon="storm-wyrm"]'
      );


    if(!dragon){

      host.dataset.dragonActive=
        "false";

      return;

    }


    dragon.classList.add(
      "is-exiting"
    );


    setTimeout(
      ()=>{

        /*
         * Remove the corresponding active entry.
         */

        activeHosts.forEach(
          entry=>{

            if(
              entry.host===host
            ){

              activeHosts.delete(
                entry
              );

            }

          }
        );


        dragon.remove();

        host.dataset.dragonActive=
          "false";

      },
      500
    );

  }


  /* =========================================================
     MAIN ANIMATION LOOP
     
     IMPORTANT:
     There is NO drawDragon() call here.
     
     The Dragon is the PNG image.
     The canvas is used ONLY for lightning.
     ========================================================= */

  function startLoop(){

    if(rafId) return;


    lastTime=
      performance.now();


    const loop=(now)=>{

      rafId=
        requestAnimationFrame(
          loop
        );


      if(
        activeHosts.size===0
      ){

        cancelAnimationFrame(
          rafId
        );

        rafId=null;

        return;

      }


      const dt=
        now-lastTime;

      lastTime=
        now;


      /* -----------------------------------------------------
         LIGHTNING TIMER
         ----------------------------------------------------- */

      lightningTimer+=dt;


      if(
        lightningTimer>=
        nextLightning
      ){

        lightningTimer=0;


        nextLightning=
          random(
            isMobile()
              ? 4200
              : 2600,

            isMobile()
              ? 7000
              : 5200
          );


        activeHosts.forEach(
          entry=>{

            lightningBurst(
              entry.host
            );

          }
        );

      }


      /* -----------------------------------------------------
         CLEAR LIGHTNING CANVAS
         
         We intentionally DO NOT call drawDragon().
         ----------------------------------------------------- */

      activeHosts.forEach(
        entry=>{

          const canvas=
            entry.canvas;

          if(!canvas) return;


          const rect=
            canvas.getBoundingClientRect();


          const ctx=
            canvas.getContext(
              "2d"
            );


          if(!ctx) return;


          ctx.clearRect(
            0,
            0,
            rect.width,
            rect.height
          );

        }
      );

    };


    rafId=
      requestAnimationFrame(
        loop
      );

  }


  /* =========================================================
     DESTROY ALL
     ========================================================= */

  function destroyAll(){

    activeHosts.forEach(
      entry=>{

        removeDragon(
          entry.host
        );

      }
    );

    activeHosts.clear();

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.NowOrNeverDragon={

    id:
      DRAGON_ID,

    mount:
      createDragon,

    remove:
      removeDragon,

    clear:
      destroyAll,

    isDragon(id){

      return id===
        DRAGON_ID;

    }

  };


})();


/* =========================================================
   ADMIN DASHBOARD NAVIGATION
   ---------------------------------------------------------
   The main index.html already loads this file, so we can add
   the admin entry without rewriting the very large index.html.
   Authorization is checked through Supabase's server-side
   public.is_admin() function. The link itself is not a
   security boundary; admin.html performs the real check too.
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://kvbbgvfrllptqpbkixnv.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_YaS6ZJfi4VrAbtGymRBr6w_ocpvX0I-";

  const ADMIN_LINK_ID = "adminDashboardNavBtn";

  function createAdminLink() {
    const grid = document.querySelector("#moreNavMenu .more-nav-grid");

    if (!grid || document.getElementById(ADMIN_LINK_ID)) {
      return document.getElementById(ADMIN_LINK_ID);
    }

    const link = document.createElement("a");
    link.id = ADMIN_LINK_ID;
    link.href = "admin.html";
    link.className = "more-nav-item hidden";
    link.setAttribute("aria-label", "Open Admin Dashboard");

    link.innerHTML = `
      <span class="more-icon">🛡️</span>
      <span>
        <strong>Admin Dashboard</strong>
        <small>Manage NOW-or-NEVER</small>
      </span>
    `;

    grid.appendChild(link);
    return link;
  }

  async function setupAdminLink() {
    if (!window.supabase) {
      console.error("Admin navigation: Supabase library is not loaded.");
      return;
    }

    const link = createAdminLink();
    if (!link) {
      return;
    }

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

    async function updateAdminVisibility() {
      try {
        const {
          data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session?.user) {
          link.classList.add("hidden");
          return;
        }

        const { data, error } = await supabaseClient.rpc("is_admin");

        if (error) {
          console.error("Admin navigation authorization error:", error);
          link.classList.add("hidden");
          return;
        }

        link.classList.toggle("hidden", data !== true);
      } catch (error) {
        console.error("Admin navigation check failed:", error);
        link.classList.add("hidden");
      }
    }

    await updateAdminVisibility();

    supabaseClient.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        updateAdminVisibility();
      }
    });
  }

  function waitForMoreMenu() {
    if (document.querySelector("#moreNavMenu .more-nav-grid")) {
      setupAdminLink();
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector("#moreNavMenu .more-nav-grid")) {
        observer.disconnect();
        setupAdminLink();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForMoreMenu, {
      once: true
    });
  } else {
    waitForMoreMenu();
  }
})();
