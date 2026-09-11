// Leaderboard module 
/* ============================================
   LEADERBOARD 
============================================ */

async function renderBoard(){
  $("boardList").innerHTML=`<div class="loading">Loading leaderboard...</div>`;

  try{
    const {data,error}=await supabaseClient.from("profiles").select("id,username,display_name,points,effective_hours").order("points",{ascending:false});
    if(error) throw error;
    if(!data?.length){$("boardList").innerHTML=`<div class="empty">No students yet.</div>`;return;}

    const cosmeticsByUser=new Map();
    try{
      const {data:rows,error:cosmeticError}=await supabaseClient.from("user_cosmetics").select("user_id,slot,item_id");
      if(cosmeticError) console.warn("Leaderboard cosmetic lookup:",cosmeticError);
      else (rows||[]).forEach(row=>{if(!cosmeticsByUser.has(row.user_id))cosmeticsByUser.set(row.user_id,{});cosmeticsByUser.get(row.user_id)[String(row.slot||"").toLowerCase()]=row.item_id;});
    }catch(e){console.warn("Leaderboard cosmetic lookup failed:",e);}

    function cosmeticItem(id){return SHOP_ITEMS.find(x=>x.id===id)||null;}
    function cosmeticBySlot(userId,slot){return cosmeticItem(cosmeticsByUser.get(userId)?.[slot]);}
    function styleClass(item){const base=getTextStyleClass(item);return base?`leader-${base}`:"";}
    function effectClass(item){if(!item)return"";if(item.id.includes("flame"))return"leader-effect-fire";if(item.id.includes("spark"))return"leader-effect-spark";if(item.id.includes("lightning"))return"leader-effect-lightning";return"";}
    function isCrown(item){return !!item&&(item.id==="acc_crown"||item.category==="crown"||/crown/i.test(item.name));}
    function isBorderItem(item){if(!item)return false;const id=String(item.id||"").toLowerCase(),kind=String(item.kind||"").toLowerCase(),cat=String(item.category||"").toLowerCase();return kind==="border"||cat==="borders"||id.startsWith("border_")||/border/i.test(String(item.name||""));}
    function borderClass(item){if(!item)return"";return typeof getBorderClass==="function"?getBorderClass(item):"border-starter";}

    function renderLeaderboardCosmetics(student){
      const slots=cosmeticsByUser.get(student.id)||{};
      const title=cosmeticBySlot(student.id,"title");
      const textStyle=cosmeticBySlot(student.id,"text_style")||cosmeticBySlot(student.id,"textstyle");
      const effect=cosmeticBySlot(student.id,"effect");
      const dragon=cosmeticBySlot(student.id,"dragon");
      const directBorder=cosmeticBySlot(student.id,"border");
      const equippedAccessory=cosmeticBySlot(student.id,"accessory");

      // Border is its own visual system. Support old rows where the border was saved as accessory.
      const border=directBorder|| (isBorderItem(equippedAccessory)?equippedAccessory:null);
      const accessory=(equippedAccessory&&!isBorderItem(equippedAccessory))?equippedAccessory:null;
      const borderCls=border?borderClass(border):"";
      const borderKey=border?String(border.id||border.name||"").toLowerCase().replace(/[^a-z0-9_-]/g,"-"):"";

      const visualAccessories=[];
      if(accessory&&!isCrown(accessory)) visualAccessories.push(`<span class="leader-cosmetic leader-accessory" title="${escapeHtml(accessory.name)}">${escapeHtml(accessory.preview)}</span>`);

      const titleHtml=title?`<span class="leader-title-badge ${styleClass(textStyle)}">${escapeHtml(title.preview||title.name)}</span>`:"";
      const crownHtml=isCrown(accessory)?`<span class="leader-crown" title="${escapeHtml(accessory.name)}">${escapeHtml(accessory.preview)}</span>`:"";
      const effectHtml=effect?`<div class="leader-row-effect" title="${escapeHtml(effect.name)}"><span class="leader-effect ${effectClass(effect)}">${escapeHtml(effect.preview)}</span></div>`:"";
      const accessoryHtml=visualAccessories.length?`<div class="leader-cosmetics">${visualAccessories.join("")}</div>`:"";
      const dragonHtml=dragon&&dragon.id==="cosmetic_dragon_storm"?`<div class="leader-dragon-host" data-dragon-host="true"></div>`:"";

      // Dedicated border layer: this is intentionally outside the avatar and spans the complete leaderboard card.
      const borderHtml=border?`<div class="leader-border-layer ${borderCls}" data-border="${escapeHtml(borderKey)}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`:"";
      return {titleHtml,crownHtml,effectHtml,accessoryHtml,dragonHtml,borderHtml,borderCls,borderAvatarClass:border?`leader-avatar-border ${borderCls}`:"",hasAny:Boolean(title||textStyle||accessory||effect||dragon||border),textStyleClass:styleClass(textStyle),hasBorder:!!border};
    }

    const max=Math.max(1,...data.map(x=>Number(x.points)||0));
    $("boardList").innerHTML=data.map((student,index)=>{
      const points=Number(student.points)||0, hours=Number(student.effective_hours)||0, cosmetics=renderLeaderboardCosmetics(student);
      const isMe=currentUser&&student.id===currentUser.id;
      const medal=index===0?"🥇":index===1?"🥈":index===2?"🥉":String(index+1);
      const width=Math.max(0,Math.min(100,(points/max)*100));
      return `<div class="leader ${isMe?"me":""} ${cosmetics.hasAny?"has-cosmetics":""} ${cosmetics.hasBorder?`has-leader-border ${cosmetics.borderCls}`:""}">
          ${cosmetics.borderHtml}${cosmetics.crownHtml}${cosmetics.effectHtml}${cosmetics.dragonHtml}
          <div class="rank">${medal}</div>
          <div class="avatar ${cosmetics.borderAvatarClass}">${escapeHtml(initials(student.display_name))}${cosmetics.accessoryHtml||""}</div>
          <div class="leader-main"><div class="leader-name ${cosmetics.textStyleClass}"><span class="leader-title-row">${escapeHtml(student.display_name)}${isMe?" · You":""}${cosmetics.titleHtml}</span></div><div class="leader-meta">${hours.toFixed(1)}h${student.username?` · @${escapeHtml(student.username)}`:""}</div><div class="progress"><span style="width:${width}%"></span></div></div>
          <div class="points">${points.toFixed(0)}</div>
        </div>`;
    }).join("");

    const totalPoints=data.reduce((s,x)=>s+(Number(x.points)||0),0), totalHours=data.reduce((s,x)=>s+(Number(x.effective_hours)||0),0);
    await renderGroupStats(data,totalPoints,totalHours);
    if(window.NowOrNeverDragon) document.querySelectorAll("[data-dragon-host='true']").forEach(host=>window.NowOrNeverDragon.mount(host));
  }catch(err){console.error("LEADERBOARD:",err);$("boardList").innerHTML=`<div class="empty">Could not load leaderboard.</div>`;}
}

/* ============================================
   GROUP STATS
============================================ */
async function renderGroupStats(students,totalPoints,totalHours){
  const {data,error}=await supabaseClient.from("study_logs").select("tasks_completed");
  const totalTasks=error?0:data.reduce((sum,row)=>sum+Number(row.tasks_completed||0),0);
  $("groupStats").innerHTML=`<div class="stat"><div class="label">Students</div><div class="value">${students.length}</div></div><div class="stat"><div class="label">Points</div><div class="value">${totalPoints.toFixed(0)}</div></div><div class="stat"><div class="label">Study hours</div><div class="value">${totalHours.toFixed(1)}</div></div><div class="stat"><div class="label">Tasks done</div><div class="value">${totalTasks}</div></div>`;
}
