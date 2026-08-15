// UI motion and animation controller
/* =========================================================
   NOW OR NEVER — MOTION CONTROLLER
   Adds animation without changing application logic.
   ========================================================= */

(function initMotionSystem(){

  function addRipple(button,event){
    if(!button || button.disabled) return;

    const rect=button.getBoundingClientRect();
    const ripple=document.createElement("span");

    ripple.className="motion-ripple";

    ripple.style.left=(event.clientX-rect.left)+"px";
    ripple.style.top=(event.clientY-rect.top)+"px";

    button.appendChild(ripple);

    setTimeout(()=>ripple.remove(),520);
  }

  document.addEventListener("pointerdown",event=>{
    const button=event.target.closest("button");
    if(button) addRipple(button,event);
  });

  function revealCards(root=document){
    const cards=root.querySelectorAll(
      ".card:not(.motion-visible)"
    );

    cards.forEach((card,index)=>{
      card.style.animationDelay=
        Math.min(index*35,210)+"ms";
      card.classList.add("motion-visible");
    });
  }

  function popUpdatedNumbers(root=document){
    const selectors=[
      "#personalTotalPoints",
      "#personalTotalHours",
      "#personalAvgDay",
      "#personalAvgWeek",
      "#personalStreak",
      "#achievementCount",
      "#achievementPoints",
      "#myProfilePoints"
    ];

    selectors.forEach(selector=>{
      root.querySelectorAll(selector).forEach(el=>{
        el.classList.remove("number-pop");
        void el.offsetWidth;
        el.classList.add("number-pop");
      });
    });
  }

  function markCompletedTasks(root=document){
    root.querySelectorAll(".task-row").forEach(row=>{
      const checkbox=row.querySelector(".task-check");
      if(checkbox && checkbox.checked){
        row.classList.add("task-completed");
      }else{
        row.classList.remove("task-completed");
      }
    });
  }

  function animateBoard(root=document){
    root.querySelectorAll(".leader").forEach((row,index)=>{
      row.style.animationDelay=
        Math.min(index*35,280)+"ms";
    });

    root.querySelectorAll(".progress span").forEach(bar=>{
      bar.style.transformOrigin="left center";
    });
  }

  function animateTests(root=document){
    root.querySelectorAll(".test-list-row").forEach((row,index)=>{
      row.style.animationDelay=
        Math.min(index*35,210)+"ms";
    });
  }

  function animateView(view){
    if(!view) return;

    view.classList.remove("motion-view-refresh");
    void view.offsetWidth;
    view.classList.add("motion-view-refresh");

    revealCards(view);
    popUpdatedNumbers(view);
    markCompletedTasks(view);
    animateBoard(view);
    animateTests(view);
  }

  document.querySelectorAll(".nav button").forEach(button=>{
    button.addEventListener("click",()=>{
      setTimeout(()=>{
        const id=button.dataset.view;
        animateView(document.getElementById(id));
      },20);
    });
  });

  const observer=new MutationObserver(mutations=>{
    let shouldAnimate=false;

    for(const mutation of mutations){
      if(
        mutation.type==="childList" &&
        mutation.addedNodes.length
      ){
        shouldAnimate=true;
        break;
      }
    }

    if(!shouldAnimate) return;

    requestAnimationFrame(()=>{
      revealCards();
      markCompletedTasks();
      animateBoard();
      animateTests();
    });
  });

  observer.observe(document.body,{
    childList:true,
    subtree:true
  });

  document.addEventListener("change",event=>{
    const checkbox=event.target.closest(".task-check");

    if(!checkbox) return;

    const row=checkbox.closest(".task-row");

    if(!row) return;

    if(checkbox.checked){
      row.classList.add("task-completed");
    }else{
      row.classList.remove("task-completed");
    }
  });

  window.NowOrNeverMotion={
    refresh(){
      revealCards();
      popUpdatedNumbers();
      markCompletedTasks();
      animateBoard();
      animateTests();
    },
    animateView
  };

  if(document.readyState==="loading"){
    document.addEventListener(
      "DOMContentLoaded",
      ()=>window.NowOrNeverMotion.refresh(),
      {once:true}
    );
  }else{
    window.NowOrNeverMotion.refresh();
  }

})();
