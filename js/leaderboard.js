// Leaderboard module
/* ============================================
   LEADERBOARD
============================================ */

async function renderBoard(){
  $("boardList").innerHTML=`<div class="loading">Loading leaderboard...</div>`;

  try{
    const {data,error}=await supabaseClient
      .from("profiles")
      .select("id,username,display_name,points,effective_hours")
      .order("points",{ascending:false});

    if(error) throw error;

    if(!data?.length){
      $("boardList").innerHTML=`<div class="empty">No students yet.</div>`;
      return;
    }

    /*
      Load ALL currently equipped cosmetics, not only titles.

      Expected user_cosmetics rows:
        user_id | slot         | item_id
        ------- | ------------ | ----------------
        ...     | title        | title_scholar
        ...     | text_style   | style_glow
        ...     | accessory    | acc_crown
        ...     | effect       | acc_flame

      If RLS currently prevents reading other users' rows, this
      query will fail and the leaderboard will still render.
      In that case use the SQL policy/RPC supplied with this fix.
    */
    const cosmeticsByUser=new Map();

    try{
      const {data:rows,error:cosmeticError}=await supabaseClient
        .from("user_cosmetics")
        .select("user_id,slot,item_id");

      if(cosmeticError){
        console.warn("Leaderboard cosmetic lookup:",cosmeticError);
      }else{
        (rows||[]).forEach(row=>{
          if(!cosmeticsByUser.has(row.user_id)){
            cosmeticsByUser.set(row.user_id,{});
          }
          cosmeticsByUser.get(row.user_id)[row.slot]=row.item_id;
        });
      }
    }catch(e){
      console.warn("Leaderboard cosmetic lookup failed:",e);
    }

    function cosmeticItem(id){
      return SHOP_ITEMS.find(x=>x.id===id) || null;
    }

    function cosmeticBySlot(userId,slot){
      const id=cosmeticsByUser.get(userId)?.[slot];
      return cosmeticItem(id);
    }

    function styleClass(item){
      const base=getTextStyleClass(item);
      return base ? `leader-${base}` : "";
    }

    function effectClass(item){
      if(!item) return "";
      if(item.id.includes("flame")) return "leader-effect-fire";
      if(item.id.includes("spark")) return "leader-effect-spark";
      if(item.id.includes("lightning")) return "leader-effect-lightning";
      return "";
    }

    function isCrown(item){
      if(!item) return false;
      return item.id==="acc_crown" || item.category==="crown" || /crown/i.test(item.name);
    }

    function renderLeaderboardCosmetics(student){
      const title=cosmeticBySlot(student.id,"title");
      const textStyle=cosmeticBySlot(student.id,"text_style");
      const accessory=cosmeticBySlot(student.id,"accessory");
      const effect=cosmeticBySlot(student.id,"effect");
      const dragon = cosmeticBySlot(student.id,"dragon");

      const dragonHtml =
           dragon &&
           dragon.id === "cosmetic_dragon_storm"
             ? `<div class="leader-dragon-host" data-dragon-host="true"></div>`
             : "";

      const visualAccessories=[];
      if(accessory && !isCrown(accessory)){
        visualAccessories.push(
          `<span class="leader-cosmetic leader-accessory" title="${escapeHtml(accessory.name)}">${escapeHtml(accessory.preview)}</span>`
        );
      }

      const titleHtml=title
        ? `<span class="leader-title-badge ${styleClass(textStyle)}">${escapeHtml(title.preview || title.name)}</span>`
        : "";

      const crownHtml=isCrown(accessory)
        ? `<span class="leader-crown" title="${escapeHtml(accessory.name)}">${escapeHtml(accessory.preview)}</span>`
        : "";

      const effectHtml=effect
        ? `<div class="leader-row-effect" title="${escapeHtml(effect.name)}"><span class="leader-effect ${effectClass(effect)}">${escapeHtml(effect.preview)}</span></div>`
        : "";

      const accessoryHtml=visualAccessories.length
        ? `<div class="leader-cosmetics">${visualAccessories.join("")}</div>`
        : "";

      const hasAny=Boolean(
                 title ||
                 textStyle ||
                 accessory ||
                 effect ||
                 dragon
);
      return {
        titleHtml,
        crownHtml,
        effectHtml,
        accessoryHtml,
        dragonHtml,
        hasAny,
        textStyleClass:styleClass(textStyle)
      };
    }

    const max=Math.max(1,...data.map(x=>Number(x.points)||0));

    $("boardList").innerHTML=data.map((student,index)=>{
      const points=Number(student.points)||0;
      const hours=Number(student.effective_hours)||0;
      const cosmetics=renderLeaderboardCosmetics(student);
      const isMe=currentUser && student.id===currentUser.id;

      const medal=index===0?"🥇":index===1?"🥈":index===2?"🥉":String(index+1);
      const width=Math.max(0,Math.min(100,(points/max)*100));

      return `
        <div class="leader ${isMe?"me":""} ${cosmetics.hasAny?"has-cosmetics":""}">
          ${cosmetics.crownHtml}
          ${cosmetics.effectHtml}
          ${cosmetics.dragonHtml}
          <div class="rank">${medal}</div>
          <div class="avatar">
            ${escapeHtml(initials(student.display_name))}
            ${cosmetics.accessoryHtml ? cosmetics.accessoryHtml : ""}
          </div>

          <div class="leader-main">
            <div class="leader-name ${cosmetics.textStyleClass}">
              <span class="leader-title-row">
                ${escapeHtml(student.display_name)}
                ${isMe?" · You":""}
                ${cosmetics.titleHtml}
              </span>
            </div>

            <div class="leader-meta">
              ${hours.toFixed(1)}h
              ${student.username?` · @${escapeHtml(student.username)}`:""}
            </div>

            <div class="progress">
              <span style="width:${width}%"></span>
            </div>
          </div>

          <div class="points">${points.toFixed(0)}</div>
        </div>
      `;
    }).join("");

    const totalPoints=data.reduce((s,x)=>s+(Number(x.points)||0),0);
    const totalHours=data.reduce((s,x)=>s+(Number(x.effective_hours)||0),0);
    await renderGroupStats(data,totalPoints,totalHours);
     if(window.NowOrNeverDragon){

  document
    .querySelectorAll("[data-dragon-host='true']")
    .forEach(host => {

      window.NowOrNeverDragon.mount(host);

    });

}

  }catch(err){
    console.error("LEADERBOARD:",err);
    $("boardList").innerHTML=`<div class="empty">Could not load leaderboard.</div>`;
  }
}
    

/* ============================================
   GROUP STATS
============================================ */

async function renderGroupStats(
  students,
  totalPoints,
  totalHours
){

  const {
    data,
    error
  } =
    await supabaseClient
      .from("study_logs")
      .select(
        "tasks_completed"
      );
if(window.NowOrNeverDragon){

  document
    .querySelectorAll("[data-dragon-host='true']")
    .forEach(host => {

      window.NowOrNeverDragon.mount(host);

    });

}

  const totalTasks =
    error
      ? 0
      : data.reduce(
          (sum,row) =>
            sum +
            Number(
              row.tasks_completed || 0
            ),
          0
        );


  $("groupStats").innerHTML = `

    <div class="stat">

      <div class="label">
        Students
      </div>

      <div class="value">
        ${students.length}
      </div>

    </div>


    <div class="stat">

      <div class="label">
        Points
      </div>

      <div class="value">
        ${totalPoints.toFixed(0)}
      </div>

    </div>


    <div class="stat">

      <div class="label">
        Study hours
      </div>

      <div class="value">
        ${totalHours.toFixed(1)}
      </div>

    </div>


    <div class="stat">

      <div class="label">
        Tasks done
      </div>

      <div class="value">
        ${totalTasks}
      </div>

    </div>

  `;

}
