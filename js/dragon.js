/* =========================================================
   NOW OR NEVER — STORM WYRM
   Lightweight procedural dragon cosmetic
   ========================================================= */

(function(){

  "use strict";

  const DRAGON_ID = "cosmetic_dragon_storm";

  let activeHosts = new Set();
  let rafId = null;
  let lastTime = 0;
  let lightningTimer = 0;
  let nextLightning = 2600;

  const isMobile = () =>
    window.matchMedia("(max-width:700px)").matches;

  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function random(min,max){
    return Math.random() * (max-min) + min;
  }

  function createCanvas(host){
    const canvas=document.createElement("canvas");

    canvas.className="dragon-canvas";
    canvas.setAttribute("aria-hidden","true");

    host.appendChild(canvas);

    resizeCanvas(canvas);

    window.addEventListener("resize",()=>{
      resizeCanvas(canvas);
    },{
      passive:true
    });

    return canvas;
  }

  function resizeCanvas(canvas){

    const rect=canvas.getBoundingClientRect();

    const dpr=Math.min(
      window.devicePixelRatio || 1,
      isMobile() ? 1.25 : 1.75
    );

    canvas.width=Math.max(1,Math.floor(rect.width*dpr));
    canvas.height=Math.max(1,Math.floor(rect.height*dpr));

    const ctx=canvas.getContext("2d");

    if(ctx){
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
  }

  function createParticles(host){

    const count=isMobile() ? 8 : 16;

    for(let i=0;i<count;i++){

      const particle=document.createElement("span");

      particle.className="dragon-particle";

      particle.style.left=random(20,80)+"%";
      particle.style.top=random(35,70)+"%";

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

      host.appendChild(particle);
    }
  }

  function drawDragon(ctx,w,h,t){

    const cx=w*.5;
    const cy=h*.52;

    /*
      The dragon is intentionally stylized rather than
      attempting to reproduce a detailed bitmap.

      This gives us a live silhouette that is extremely
      lightweight on mobile.
    */

    const bob=Math.sin(t*.0018)*3;
    const wing=Math.sin(t*.003)*.12;

    ctx.save();

    ctx.translate(cx,cy+bob);

    ctx.shadowBlur=13;
    ctx.shadowColor="rgba(75,190,255,.85)";

    /*
      Body
    */

    ctx.beginPath();

    ctx.ellipse(
      0,
      5,
      23,
      13,
      -.08,
      0,
      Math.PI*2
    );

    ctx.fillStyle="rgba(65,110,205,.92)";
    ctx.fill();

    /*
      Head
    */

    ctx.beginPath();

    ctx.ellipse(
      -20,
      -8,
      12,
      9,
      -.15,
      0,
      Math.PI*2
    );

    ctx.fillStyle="rgba(85,155,235,.98)";
    ctx.fill();

    /*
      Snout
    */

    ctx.beginPath();

    ctx.moveTo(-29,-9);
    ctx.lineTo(-39,-5);
    ctx.lineTo(-28,-1);
    ctx.closePath();

    ctx.fillStyle="rgba(110,180,245,.98)";
    ctx.fill();

    /*
      Horns
    */

    ctx.beginPath();

    ctx.moveTo(-25,-14);
    ctx.lineTo(-31,-24);
    ctx.lineTo(-21,-17);

    ctx.moveTo(-18,-15);
    ctx.lineTo(-18,-25);
    ctx.lineTo(-13,-16);

    ctx.strokeStyle="rgba(205,240,255,.95)";
    ctx.lineWidth=2;
    ctx.stroke();

    /*
      Wings
    */

    ctx.save();

    ctx.translate(8,-5);
    ctx.rotate(wing);

    ctx.beginPath();

    ctx.moveTo(0,0);
    ctx.quadraticCurveTo(
      20,-30,
      50,-26
    );

    ctx.quadraticCurveTo(
      35,-7,
      16,10
    );

    ctx.closePath();

    ctx.fillStyle="rgba(55,100,205,.72)";
    ctx.strokeStyle="rgba(120,220,255,.82)";
    ctx.lineWidth=1.5;

    ctx.fill();
    ctx.stroke();

    ctx.restore();

    /*
      Second wing
    */

    ctx.save();

    ctx.scale(-1,1);
    ctx.translate(8,-5);
    ctx.rotate(-wing);

    ctx.beginPath();

    ctx.moveTo(0,0);
    ctx.quadraticCurveTo(
      20,-30,
      50,-26
    );

    ctx.quadraticCurveTo(
      35,-7,
      16,10
    );

    ctx.closePath();

    ctx.fillStyle="rgba(55,100,205,.72)";
    ctx.strokeStyle="rgba(120,220,255,.82)";
    ctx.lineWidth=1.5;

    ctx.fill();
    ctx.stroke();

    ctx.restore();

    /*
      Tail
    */

    ctx.beginPath();

    ctx.moveTo(18,8);

    ctx.quadraticCurveTo(
      38,
      17,
      50,
      3
    );

    ctx.quadraticCurveTo(
      43,
      20,
      25,
      18
    );

    ctx.strokeStyle="rgba(75,155,235,.95)";
    ctx.lineWidth=7;
    ctx.lineCap="round";
    ctx.stroke();

    /*
      Eye
    */

    ctx.beginPath();

    ctx.arc(
      -23,
      -10,
      2,
      0,
      Math.PI*2
    );

    ctx.fillStyle="#dfffff";
    ctx.shadowBlur=10;
    ctx.shadowColor="#6eeaff";
    ctx.fill();

    /*
      Chest glow
    */

    const pulse=
      .5+
      Math.sin(t*.004)*.25;

    ctx.beginPath();

    ctx.arc(
      -1,
      4,
      4+3*pulse,
      0,
      Math.PI*2
    );

    ctx.fillStyle=
      `rgba(160,245,255,${.45+.35*pulse})`;

    ctx.fill();

    ctx.restore();
  }

  function drawLightning(ctx,w,h,t){

    const x=w*.5;
    const y=h*.48;

    ctx.save();

    ctx.globalCompositeOperation="lighter";

    ctx.shadowBlur=9;
    ctx.shadowColor="rgba(110,210,255,.95)";

    ctx.beginPath();

    let px=x+random(-8,8);
    let py=y-10;

    ctx.moveTo(px,py);

    const segments=isMobile() ? 5 : 8;

    for(let i=0;i<segments;i++){

      px+=random(-18,18);
      py+=h*.055;

      ctx.lineTo(px,py);
    }

    ctx.strokeStyle=
      "rgba(190,245,255,.95)";

    ctx.lineWidth=isMobile()?1.2:1.7;

    ctx.stroke();

    ctx.restore();
  }

  function flash(host){

    const flash=document.createElement("div");

    flash.className="dragon-flash";

    host.appendChild(flash);

    requestAnimationFrame(()=>{
      flash.classList.add("active");
    });

    setTimeout(()=>{
      flash.remove();
    },450);
  }

  function lightningBurst(host){

    if(reducedMotion()) return;

    const canvas=host.querySelector(".dragon-canvas");

    if(!canvas) return;

    const ctx=canvas.getContext("2d");

    if(!ctx) return;

    const rect=canvas.getBoundingClientRect();

    drawLightning(
      ctx,
      rect.width,
      rect.height,
      performance.now()
    );

    flash(host);
  }

  function createDragon(host){

    if(!host || host.dataset.dragonActive==="true"){
      return;
    }

    host.dataset.dragonActive="true";

    host.classList.add("leader-dragon-host");

    const dragon=document.createElement("div");

    dragon.className="dragon-cosmetic";
    dragon.dataset.dragon="storm-wyrm";

    const aura=document.createElement("div");
    aura.className="dragon-aura";

    const core=document.createElement("div");
    core.className="dragon-core";

    dragon.appendChild(aura);
    dragon.appendChild(core);

    const canvas=createCanvas(dragon);

    createParticles(dragon);

    const label=document.createElement("div");

    label.className="dragon-label";
    label.textContent="STORM WYRM";

    dragon.appendChild(label);

    host.appendChild(dragon);

    activeHosts.add({
      host,
      dragon,
      canvas
    });

    if(!reducedMotion()){
      startLoop();
    }

    return dragon;
  }

  function removeDragon(host){

    if(!host) return;

    const dragon=host.querySelector(
      '[data-dragon="storm-wyrm"]'
    );

    if(!dragon){
      host.dataset.dragonActive="false";
      return;
    }

    dragon.classList.add("is-exiting");

    setTimeout(()=>{
      dragon.remove();
      host.dataset.dragonActive="false";
    },500);
  }

  function startLoop(){

    if(rafId) return;

    lastTime=performance.now();

    const loop=(now)=>{

      rafId=requestAnimationFrame(loop);

      if(activeHosts.size===0){
        cancelAnimationFrame(rafId);
        rafId=null;
        return;
      }

      const dt=now-lastTime;

      lastTime=now;

      lightningTimer+=dt;

      if(lightningTimer>=nextLightning){

        lightningTimer=0;

        nextLightning=random(
          isMobile()?4200:2600,
          isMobile()?7000:5200
        );

        activeHosts.forEach(entry=>{
          lightningBurst(entry.host);
        });
      }

      activeHosts.forEach(entry=>{

        const canvas=entry.canvas;

        const rect=canvas.getBoundingClientRect();

        const ctx=canvas.getContext("2d");

        if(!ctx) return;

        ctx.clearRect(
          0,
          0,
          rect.width,
          rect.height
        );

        drawDragon(
          ctx,
          rect.width,
          rect.height,
          now
        );
      });
    };

    rafId=requestAnimationFrame(loop);
  }

  function destroyAll(){

    activeHosts.forEach(entry=>{
      removeDragon(entry.host);
    });

    activeHosts.clear();
  }

  /*
    Public API
  */

  window.NowOrNeverDragon={

    id:DRAGON_ID,

    mount:createDragon,

    remove:removeDragon,

    clear:destroyAll,

    isDragon(id){
      return id===DRAGON_ID;
    }

  };

})();
