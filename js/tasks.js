// Daily tasks / study logging / realtime study updates

/* ============================================
   DAILY TASKS
============================================ */

function taskDateLabel(){
  return new Date().toLocaleDateString("en-IN", {
    weekday:"long", day:"2-digit", month:"short", year:"numeric"
  });
}

async function getTodayTasks(){
  const {data,error}=await supabaseClient
    .from("tasks")
    .select(
      "id,student_id,task_name,completed,task_date,created_at"
    )
    .eq("task_date",localDate())
    .order("created_at",{ascending:true});

  if(error){
    console.error("TASK LOAD:",error);
    return {data:null,error};
  }

  return {data:data||[],error:null};
}

async function renderTasks(){
  const board=$("taskBoard");

  if(!board) return;

  $("taskDateLabel").textContent=
    taskDateLabel();

  board.innerHTML=
    `<div class="loading">Loading today's tasks...</div>`;

  const {data,error}=await getTodayTasks();

  if(error){
    board.innerHTML=
      `<div class="empty">
        Could not load tasks: ${escapeHtml(error.message)}
      </div>`;
    return;
  }

  const {data:profiles,error:profilesError}=
    await supabaseClient
      .from("profiles")
      .select("id,display_name,username")
      .order("display_name",{ascending:true});

  if(profilesError){
    console.error("TASK PROFILE LOAD:",profilesError);

    board.innerHTML=
      `<div class="empty">
        Could not load task members: ${escapeHtml(profilesError.message)}
      </div>`;

    return;
  }

  const profileMap=new Map(
    (profiles||[]).map(p=>[p.id,p])
  );

  const groups=new Map();

  (data||[]).forEach(task=>{
    const id=task.student_id;

    if(!groups.has(id)){
      groups.set(id,{
        profile:profileMap.get(id)||{
          id,
          display_name:"Student",
          username:""
        },
        tasks:[]
      });
    }

    groups.get(id).tasks.push(task);
  });

  (profiles||[]).forEach(profile=>{
    if(!groups.has(profile.id)){
      groups.set(profile.id,{
        profile,
        tasks:[]
      });
    }
  });

  if(!groups.size){
    board.innerHTML=
      `<div class="empty">No members found.</div>`;

    $("myTaskCount").textContent="0/0 done";
    $("myTaskProgress").style.width="0%";
    return;
  }

  let myTotal=0;
  let myDone=0;

  board.innerHTML=
    [...groups.values()]
      .map(group=>{
        const profile=group.profile;
        const tasks=group.tasks;

        const done=
          tasks.filter(t=>t.completed).length;

        if(
          currentUser &&
          profile.id===currentUser.id
        ){
          myTotal=tasks.length;
          myDone=done;
        }

        const taskRows=
          tasks.length
          ? tasks.map(task=>{
              const isMine=
                currentUser &&
                task.student_id===currentUser.id;

              return `
                <div class="task-row">

                  <input
                    class="task-check"
                    type="checkbox"
                    ${task.completed?"checked":""}
                    ${isMine?"":"disabled"}
                    onchange="
                      toggleTask(
                        '${task.id}',
                        this.checked
                      )
                    "
                  >

                  <span
                    class="task-label
                    ${task.completed?"done":""}"
                  >
                    ${escapeHtml(task.task_name)}
                  </span>

                  ${
                    isMine
                      ? `
                        <button
                          class="task-delete"
                          onclick="
                            deleteTask('${task.id}')
                          "
                        >
                          ✕
                        </button>
                      `
                      : ""
                  }

                </div>
              `;
            }).join("")
          : `
            <div
              class="empty"
              style="padding:8px 0"
            >
              No tasks added yet.
            </div>
          `;

        const addBox=
          currentUser &&
          profile.id===currentUser.id
          ? `
            <div class="task-add">

              <input
                id="newTaskInput"
                placeholder="Add your task..."
                maxlength="160"
                onkeydown="
                  if(event.key==='Enter') addTask()
                "
              >

              <button onclick="addTask()">
                + Task
              </button>

            </div>

            <div class="task-owner-note">
              Only you can edit your tasks.
            </div>
          `
          : "";

        return `
          <div class="task-person">

            <div class="task-person-head">

              <div class="task-person-avatar">
                ${escapeHtml(
                  initials(profile.display_name)
                )}
              </div>

              <div class="task-person-name">
                ${escapeHtml(
                  profile.display_name||"Student"
                )}
              </div>

              <div class="task-person-count">
                ${done}/${tasks.length} done
              </div>

            </div>

            ${taskRows}
            ${addBox}

          </div>
        `;
      })
      .join("");

  $("myTaskCount").textContent=
    `${myDone}/${myTotal} done`;

  $("myTaskProgress").style.width=
    myTotal
      ? `${(myDone/myTotal)*100}%`
      : "0%";
}

async function addTask(){
  if(!currentUser) return;

  const input=$("newTaskInput");

  if(!input) return;

  const text=input.value.trim();

  if(!text) return;

  const {error}=await supabaseClient
    .from("tasks")
    .insert({
      student_id:currentUser.id,
      task_name:text,
      completed:false,
      task_date:localDate()
    });

  if(error){
    console.error("TASK INSERT:",error);
    showToast(error.message);
    return;
  }

  input.value="";
showToast("Task added ✓");

await renderTasks();

/*
 * AI companion analysis.
 *
 * This happens AFTER the task is safely saved.
 * If AI fails, the task is still completely fine.
 */
if (
  typeof analyzeTaskWithAI ===
  "function"
) {
if (
  typeof window.showAICompanion ===
  "function"
) {

  window.showAICompanion(
    "Hmm... let me check how effective this task is. 🤔",
    "thinking",
    0
  );

}
  /*
   * Don't block the task system.
   */
  analyzeTaskWithAI(text)
    .then(analysis => {

      if (
        analysis &&
        typeof showAITaskAnalysis ===
        "function"
      ) {

        showAITaskAnalysis(
          analysis
        );

      }

    })
    .catch(error => {

      console.warn(
        "AI task analysis skipped:",
        error
      );

    });

}
}

async function toggleTask(id,completed){
  if(!currentUser) return;

  const {error}=await supabaseClient
    .from("tasks")
    .update({completed})
    .eq("id",id)
    .eq("student_id",currentUser.id);

  if(error){
    console.error("TASK UPDATE:",error);
    showToast(error.message);
    await renderTasks();
    return;
  }

  await renderTasks();
}

async function deleteTask(id){
  if(!currentUser) return;

  const {error}=await supabaseClient
    .from("tasks")
    .delete()
    .eq("id",id)
    .eq("student_id",currentUser.id);

  if(error){
    console.error("TASK DELETE:",error);
    showToast(error.message);
    return;
  }

  showToast("Task deleted");
  await renderTasks();
}

function startRealtime(){
  if(taskChannel) supabaseClient.removeChannel(taskChannel);
  if(profileChannel) supabaseClient.removeChannel(profileChannel);
  if(testChannel) supabaseClient.removeChannel(testChannel);
  if(studyChannel) supabaseClient.removeChannel(studyChannel);

  taskChannel = supabaseClient
    .channel("shared-tasks-live")
    .on("postgres_changes",
      {event:"*",schema:"public",table:"tasks"},
      () => renderTasks()
    )
    .subscribe();

  profileChannel = supabaseClient
    .channel("shared-profiles-live")
    .on("postgres_changes",
      {event:"UPDATE",schema:"public",table:"profiles"},
      () => {
        renderBoard();
        renderTasks();
        if(currentUser){
          loadProfile().then(() => {
            if(document.getElementById("shop")?.classList.contains("active")){
              renderShop();
            }
          });
        }
      }
    )
    .subscribe();

  testChannel = supabaseClient
    .channel("my-tests-live")
    .on("postgres_changes",
      {event:"*",schema:"public",table:"test_scores",filter:`student_id=eq.${currentUser.id}`},
      () => {
        renderTests();
        renderBoard();
        loadProfile();
        renderPersonal();
      }
    )
    .subscribe();

  studyChannel = supabaseClient
    .channel("my-study-live")
    .on("postgres_changes",
      {event:"*",schema:"public",table:"study_logs",filter:`student_id=eq.${currentUser.id}`},
      () => {
        renderStudyChart();
        renderPersonal();
      }
    )
    .subscribe();
}

function stopRealtime(){
  [taskChannel,profileChannel,testChannel,studyChannel].forEach(ch=>{
    if(ch) supabaseClient.removeChannel(ch);
  });
  taskChannel=null;
  profileChannel=null;
  testChannel=null;
  studyChannel=null;
}

function startMidnightRefresh(){
  clearInterval(taskRefreshTimer);
  clearInterval(weekRefreshTimer);

  let lastDay=localDate();
  let lastWeek=dateKeyFromDate(getWeekStart());

  taskRefreshTimer=setInterval(() => {
    const now=localDate();
    if(now!==lastDay){
      lastDay=now;
      $("date").value=now;
      $("testDate").value=now;
      renderTasks();
      renderStudyChart();
      renderPersonal();
      showToast("New day — today's task board is ready.");
    }
  },15000);

  weekRefreshTimer=setInterval(() => {
    const nowWeek=dateKeyFromDate(getWeekStart());
    if(nowWeek!==lastWeek){
      lastWeek=nowWeek;
      renderStudyChart();
      showToast("New week — study graph reset.");
    }
  },60000);
}


/* ============================================
   SAVE DAILY STUDY LOG
============================================ */

$("saveBtn").addEventListener(
  "click",
  async () => {

    if(!currentUser){

      showToast("Please login first.");

      return;

    }


    const date =
      $("date").value;

    const hours =
      Number($("hours").value) || 0;

    const wasted =
      Number($("wasted").value) || 0;

    const total =
      Number($("total").value) || 0;

    const completed =
      Number($("completed").value) || 0;

    const satisfaction =
      Number($("satisfaction").value);


    if(!date){

      showToast("Choose a date.");

      return;

    }


    if(
      hours < 0 ||
      hours > 24 ||
      wasted < 0 ||
      wasted > 24
    ){

      showToast(
        "Hours must be between 0 and 24."
      );

      return;

    }


    if(
      total < 0 ||
      completed < 0 ||
      completed > total
    ){

      showToast(
        "Check the task numbers."
      );

      return;

    }


    if(
      Number.isNaN(satisfaction) ||
      satisfaction < 0 ||
      satisfaction > 10
    ){

      showToast(
        "Satisfaction must be 0–10."
      );

      return;

    }


    $("saveBtn").disabled = true;

    $("saveBtn").textContent =
      "Saving...";


    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "submit_study_log",
        {
          p_study_date: date,
          p_effective_hours: hours,
          p_wasted_hours: wasted,
          p_total_tasks: total,
          p_completed_tasks: completed,
          p_satisfaction: satisfaction
        }
      );


    $("saveBtn").disabled = false;

    $("saveBtn").textContent =
      "Calculate & Save";


    if(error){

  console.error("FULL SUPABASE ERROR:", error);

  alert(JSON.stringify(error, null, 2));

  showToast(error.message);

  return;

}


    const result =
      data;


    const points =
      Number(result.points);


    $("result").classList.add("show");


    $("result").innerHTML = `

      <div class="result-top">

        <div>

          <div
            style="
              font-size:12px;
              color:var(--muted)
            "
          >
            Today's score
          </div>

          <div
            class="score ${
              points >= 0
                ? "pos"
                : "neg"
            }"
          >
            ${points.toFixed(1)}
          </div>

        </div>


        <div class="result-name">

          ${currentProfile.display_name}

          <br>

          ${formatDate(date)}

        </div>

      </div>


      <div class="breakdown">

        <div class="line">
          <span>📚 Effective study</span>
          <b>
            +${(hours * 12).toFixed(1)}
          </b>
        </div>


        <div class="line">
          <span>✅ Completed tasks</span>
          <b>
            +${(completed * 10).toFixed(1)}
          </b>
        </div>


        <div class="line">
          <span>❌ Missed tasks</span>
          <b>
            ${-((total - completed) * 5).toFixed(1)}
          </b>
        </div>


        <div class="line">
          <span>😴 Wasted time</span>
          <b>
            ${-(wasted * 3).toFixed(1)}
          </b>
        </div>


        <div class="line">
          <span>🔥 Satisfaction</span>
          <b>
            ${satisfaction}/10
          </b>
        </div>


        <div class="line">
          <span>💰 Point change</span>
          <b>
            ${Number(result.point_change) >= 0 ? "+" : ""}
            ${result.point_change}
          </b>
        </div>

      </div>

    `;


    showToast(
      "Study entry saved ✓"
    );


    $("hours").value = "";
    $("wasted").value = "";
    $("total").value = "";
    $("completed").value = "";
    $("satisfaction").value = "";


    await loadProfile();

    await refreshAll();

  }
);
