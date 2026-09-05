// Marketplace / shop module
/* ================= SHOP CATALOGUE ================= */
let SHOP_ITEMS=[
 {id:"title_newbie",category:"title",name:"Rookie",desc:"A clean starter title.",price:0,kind:"title",preview:"ROOKIE"},
 {id:"title_grinder",category:"title",name:"Grinder",desc:"For showing up every day.",price:75,kind:"title",preview:"GRINDER"},
 {id:"title_locked",category:"title",name:"Locked In",desc:"No distractions.",price:150,kind:"title",preview:"LOCKED IN"},
 {id:"title_scholar",category:"title",name:"Scholar",desc:"Study-mode identity.",price:250,kind:"title",preview:"SCHOLAR"},
 {id:"title_machine",category:"title",name:"Study Machine",desc:"A serious flex.",price:400,kind:"title",preview:"STUDY MACHINE"},
 {id:"title_elite",category:"title",name:"Elite",desc:"Premium leaderboard title.",price:650,kind:"title",preview:"ELITE"},
 {id:"title_goat",category:"title",name:"GOAT",desc:"Endgame cosmetic title.",price:1000,kind:"title",preview:"GOAT"},
 {id:"acc_stethoscope",category:"cosmetics",name:"Stethoscope",desc:"Classic medical accessory.",price:150,kind:"accessory",preview:"🩺"},
 {id:"acc_labcoat",category:"outfit",name:"Lab Coat",desc:"Future-doctor look.",price:250,kind:"accessory",preview:"🥼"},
 {id:"acc_backpack",category:"cosmetics",name:"Study Backpack",desc:"Carry your grind.",price:100,kind:"accessory",preview:"🎒"},
 {id:"acc_medbag",category:"cosmetics",name:"Medical Bag",desc:"A premium medical bag.",price:350,kind:"accessory",preview:"💼"},
 {id:"acc_clipboard",category:"cosmetics",name:"Clipboard",desc:"For serious study sessions.",price:75,kind:"accessory",preview:"📋"},
 {id:"acc_books",category:"cosmetics",name:"Book Stack",desc:"Tiny stack of study books.",price:125,kind:"accessory",preview:"📚"},
 {id:"acc_pen",category:"cosmetics",name:"Signature Pen",desc:"Minimal study accessory.",price:50,kind:"accessory",preview:"🖊️"},
 {id:"acc_headphones",category:"cosmetics",name:"Focus Headphones",desc:"Lock-in accessory.",price:175,kind:"accessory",preview:"🎧"},
 {id:"acc_glasses",category:"cosmetics",name:"Scholar Glasses",desc:"Classic study glasses.",price:100,kind:"accessory",preview:"👓"},
 {id:"acc_watch",category:"cosmetics",name:"Focus Watch",desc:"Time is the resource.",price:225,kind:"accessory",preview:"⌚"},
 {id:"acc_medmask",category:"cosmetics",name:"Medical Mask",desc:"Simple medical accessory.",price:150,kind:"accessory",preview:"😷"},
 {id:"acc_idcard",category:"cosmetics",name:"Student ID",desc:"A small academic badge.",price:80,kind:"accessory",preview:"🪪"},
 {id:"acc_trophy",category:"cosmetics",name:"Mini Trophy",desc:"For your biggest wins.",price:300,kind:"accessory",preview:"🏆"},
 {id:"acc_medal",category:"cosmetics",name:"Medal",desc:"Achievement accessory.",price:275,kind:"accessory",preview:"🏅"},
 {id:"acc_crown",category:"cosmetics",name:"Crown",desc:"Premium achievement flex.",price:600,kind:"accessory",preview:"👑"},
 {id:"acc_flame",category:"emoji",name:"Study Flame",desc:"Animated focus effect.",price:500,kind:"effect",preview:"🔥"},
 {id:"acc_spark",category:"emoji",name:"Spark Effect",desc:"Small live sparkle effect.",price:350,kind:"effect",preview:"✨"},
 {id:"acc_lightning",category:"emoji",name:"Lightning Effect",desc:"High-energy study effect.",price:450,kind:"effect",preview:"⚡"},
 {id:"acc_brain",category:"badge",name:"Brain Badge",desc:"Study badge.",price:120,kind:"accessory",preview:"🧠"},
 {id:"acc_rocket",category:"badge",name:"Rocket Badge",desc:"Progress badge.",price:200,kind:"accessory",preview:"🚀"},
 {id:"acc_star",category:"badge",name:"Star Badge",desc:"Achievement badge.",price:275,kind:"accessory",preview:"⭐"},
 {id:"acc_studycap",category:"headwear",name:"Study Cap",desc:"Classic student accessory.",price:90,kind:"accessory",preview:"🧢"},
 {id:"acc_helmet",category:"headwear",name:"Focus Helmet",desc:"For extreme lock-in.",price:300,kind:"accessory",preview:"⛑️"},
 {id:"acc_sunglasses",category:"cosmetics",name:"Focus Shades",desc:"For the leaderboard.",price:250,kind:"accessory",preview:"😎"},
 {id:"acc_thermos",category:"cosmetics",name:"Study Thermos",desc:"Desk-session companion.",price:125,kind:"accessory",preview:"🥤"},
 {id:"acc_laptop",category:"cosmetics",name:"Mini Laptop",desc:"Digital-study accessory.",price:400,kind:"accessory",preview:"💻"},
 {id:"acc_tablet",category:"cosmetics",name:"Study Tablet",desc:"Premium study accessory.",price:500,kind:"accessory",preview:"📱"},
 {id:"acc_anatomy",category:"cosmetics",name:"Anatomy Model",desc:"NEET-themed desk accessory.",price:450,kind:"accessory",preview:"🫀"},
 {id:"acc_microscope",category:"cosmetics",name:"Microscope",desc:"Science-themed accessory.",price:550,kind:"accessory",preview:"🔬"},
 {id:"acc_firstaid",category:"cosmetics",name:"First Aid Kit",desc:"Medical-themed accessory.",price:200,kind:"accessory",preview:"🩹"},
 {id:"acc_bandaid",category:"cosmetics",name:"Study Battle Scar",desc:"Tiny grind badge.",price:175,kind:"accessory",preview:"🩹"},
 {id:"acc_studybell",category:"cosmetics",name:"Study Bell",desc:"Session-complete badge.",price:225,kind:"accessory",preview:"🔔"},
 {id:"acc_medcross",category:"cosmetics",name:"Medical Cross",desc:"Clean medical emblem.",price:325,kind:"accessory",preview:"✚"},
 {id:"acc_gene",category:"cosmetics",name:"DNA Badge",desc:"Biology-themed badge.",price:375,kind:"accessory",preview:"🧬"},
 {id:"acc_molecule",category:"cosmetics",name:"Molecule Badge",desc:"Chemistry-themed badge.",price:375,kind:"accessory",preview:"⚗️"},
 {id:"acc_atom",category:"cosmetics",name:"Atom Badge",desc:"Physics-themed badge.",price:375,kind:"accessory",preview:"⚛️"},
 {id:"acc_neet",category:"cosmetics",name:"NEET Grind Badge",desc:"For the long preparation.",price:700,kind:"accessory",preview:"📖"},
 {id:"acc_1000",category:"cosmetics",name:"1000 Club",desc:"Ultra-premium cosmetic.",price:1000,kind:"accessory",preview:"💎"},
 {id:"style_neon",category:"textstyle",name:"Neon Edge",desc:"Violet-cyan gradient name.",price:325,kind:"textstyle",preview:"Aa"},
 {id:"style_serif",category:"textstyle",name:"Scholar Serif",desc:"Classic editorial type.",price:175,kind:"textstyle",preview:"Aa"},
 {id:"style_terminal",category:"textstyle",name:"Terminal",desc:"Monospace locked-in look.",price:225,kind:"textstyle",preview:"Aa"},
 {id:"style_wide",category:"textstyle",name:"Wide Track",desc:"Spaced premium lettering.",price:275,kind:"textstyle",preview:"A A"},
 {id:"style_glow",category:"textstyle",name:"Glow Type",desc:"Soft luminous leaderboard text.",price:450,kind:"textstyle",preview:"Aa"},
 {id:"style_royal",category:"textstyle",name:"Royal Type",desc:"Bold title-card lettering.",price:600,kind:"textstyle",preview:"Aa"},
 {id:"crown_silver",category:"crown",name:"Silver Crown",desc:"Clean crown cosmetic.",price:350,kind:"accessory",preview:"♔"},
 {id:"crown_gold",category:"crown",name:"Gold Crown",desc:"Classic premium flex.",price:600,kind:"accessory",preview:"👑"},
 {id:"crown_halo",category:"crown",name:"Halo Crown",desc:"Crown with a celestial feel.",price:800,kind:"accessory",preview:"♕"},
 {id:"emoji_rocket",category:"emoji",name:"Rocket Trail",desc:"Animated 🚀 beside your title.",price:300,kind:"effect",preview:"🚀"},
 {id:"emoji_fire",category:"emoji",name:"Fire Mode",desc:"Animated 🔥 focus badge.",price:400,kind:"effect",preview:"🔥"},
 {id:"emoji_brain",category:"emoji",name:"Brain Spark",desc:"Animated 🧠 study badge.",price:275,kind:"effect",preview:"🧠"},
 {id:"emoji_star",category:"emoji",name:"Star Burst",desc:"Animated ⭐ achievement badge.",price:500,kind:"effect",preview:"⭐"},
 {id:"emoji_lightning",category:"emoji",name:"Lightning",desc:"Animated ⚡ energy badge.",price:550,kind:"effect",preview:"⚡"},
 {id:"cosmetic_dragon_storm",category:"cosmetics",name:"Storm Wyrm",desc:"A living electric dragon surrounded by lightning.",price:1500,kind:"dragon",preview:"🐉",rarity:"legendary"}
];

/* ================= DATABASE CATALOGUE ================= */
async function loadDatabaseShopCatalogue(){
  try{
    const {data,error}=await supabaseClient
      .from("shop_catalog")
      .select("item_id,category,item_name,description,price,kind,preview")
      .order("created_at",{ascending:true});

    if(error){
      console.warn("SHOP CATALOGUE:",error);
      return;
    }

    const databaseItems=(data||[]).map(x=>({
      id:x.item_id,
      category:x.category||"cosmetics",
      name:x.item_name||x.item_id,
      desc:x.description||"",
      price:Number(x.price)||0,
      kind:x.kind||"accessory",
      preview:x.preview||"🎁"
    }));

    if(!databaseItems.length) return;

    const byId=new Map(SHOP_ITEMS.map(i=>[i.id,i]));
    databaseItems.forEach(i=>byId.set(i.id,i));
    SHOP_ITEMS=Array.from(byId.values());
  }catch(err){
    console.warn("SHOP CATALOGUE:",err);
  }
}

function shopPreview(i){
  if(i.kind==="dragon"){
    return `<div class="shop-badge-preview dragon-shop-preview"><span class="dragon-shop-icon">🐉</span><span class="dragon-shop-bolt">⚡</span></div>`;
  }
  if(i.kind==="title") return `<div class="shop-title-preview">${i.preview}</div>`;
  if(i.kind==="textstyle"){
    const cls=getTextStyleClass(i);
    return `<div class="shop-title-preview ${cls}">${i.preview}</div>`;
  }
  if(i.kind==="effect") return `<div class="shop-badge-preview live-emoji">${i.preview}</div>`;
  return `<div class="shop-badge-preview">${i.preview}</div>`;
}
function shopSlot(i){
  if(i.kind==="title")return "title";
  if(i.kind==="textstyle")return "text_style";
  if(i.kind==="effect")return "effect";
  if(i.kind==="dragon")return "dragon";
  return "accessory";
}
function selectShopCategory(c){
 selectedShopCategory=c;
 const cats=["all","textstyle","title","crown","emoji","cosmetics"];
 document.querySelectorAll(".shop-tabs button").forEach((b,n)=>b.classList.toggle("active",cats[n]===c));
 renderShop();
}
async function getShopData(){
  if(!currentUser) return {owned:[],equipped:{}};
  const owned=[];
  const equipped={};
  try{
    const {data,error}=await supabaseClient.from("shop_items").select("item_id").eq("user_id",currentUser.id);
    if(error) console.warn("SHOP OWNED ITEMS:",error); else (data||[]).forEach(x=>owned.push(x.item_id));
  }catch(err){ console.warn("SHOP OWNED ITEMS:",err); }
  try{
    const {data,error}=await supabaseClient.from("user_cosmetics").select("slot,item_id").eq("user_id",currentUser.id);
    if(error) console.warn("SHOP EQUIPPED ITEMS:",error); else (data||[]).forEach(x=>equipped[x.slot]=x.item_id);
  }catch(err){ console.warn("SHOP EQUIPPED ITEMS:",err); }
  return {owned,equipped};
}
function getShopPointsNow(){
  const n=Number(currentProfile?.points);
  return Number.isFinite(n)?Math.max(0,n):0;
}
function shopCardHtml(i,owned,equipped){
  const own=owned.includes(i.id);
  const eq=equipped[shopSlot(i)]===i.id;
  return `<div class="shop-item fade-pop"><div class="shop-preview">${shopPreview(i)}</div><div class="shop-name">${escapeHtml(i.name)}</div><div class="shop-desc">${escapeHtml(i.desc)}</div><div class="shop-price">${own?"Owned":"💠 "+i.price+" pts"}</div><button class="${own?"owned":""} ${eq?"equipped":""}" onclick="shopAction('${i.id}')" ${eq?"disabled":""}>${eq?"✓ Equipped":own?"Equip":"Buy · "+i.price}</button></div>`;
}
function renderShopCatalogue(owned=[],equipped={}){
  const grid=$("shopGrid"); if(!grid)return;
  const selected=selectedShopCategory||"all";
  const filtered=SHOP_ITEMS.filter(i=>selected==="all"||i.category===selected||(selected==="cosmetics"&&["cosmetics","outfit","badge","headwear"].includes(i.category)));
  const sectionLabel={textstyle:"Aa Text Styles",title:"🏷 Titles",crown:"👑 Crowns",emoji:"✨ Emoji FX",cosmetics:"🎒 Cosmetics",outfit:"🧥 Outfits",badge:"🏅 Badges",headwear:"🧢 Headwear"};
  if(selected!=="all"){
    const label=sectionLabel[selected]||"Shop";
    grid.innerHTML=`<div style="grid-column:1/-1"><div class="shop-section-head"><div class="shop-section-name">${label}</div><div class="shop-section-count">${filtered.length} items</div></div></div>`+filtered.map(i=>shopCardHtml(i,owned,equipped)).join("");
  }else{
    const order=["textstyle","title","crown","emoji","cosmetics","outfit","badge","headwear"];
    grid.innerHTML=order.map(cat=>{const arr=SHOP_ITEMS.filter(i=>i.category===cat);if(!arr.length)return "";return `<div style="grid-column:1/-1"><div class="shop-section-head"><div class="shop-section-name">${sectionLabel[cat]}</div><div class="shop-section-count">${arr.length} items</div></div></div>${arr.map(i=>shopCardHtml(i,owned,equipped)).join("")}`;}).join("");
  }
  const names=Object.values(equipped).map(id=>SHOP_ITEMS.find(i=>i.id===id)?.name).filter(Boolean);
  const equippedEl=$("equippedShopItems");
  if(equippedEl)equippedEl.innerHTML=names.length?names.map(n=>`<span class="equipped-chip">✦ ${escapeHtml(n)}</span>`).join(" "):"Nothing equipped yet.";
}
async function renderShop(){
  if(!currentUser)return;
  const balanceEl=$("shopBalance");
  if(balanceEl)balanceEl.textContent=`${getShopPointsNow().toFixed(0)} pts`;
  renderShopCatalogue([],{});
  const {owned,equipped}=await getShopData();
  renderShopCatalogue(owned,equipped);
}
async function shopAction(id){
  const i=SHOP_ITEMS.find(x=>x.id===id); if(!i)return;
  const {data,error}=await supabaseClient.rpc("buy_or_equip_cosmetic",{p_item_id:i.id,p_price:i.price,p_slot:shopSlot(i)});
  if(error){console.error(error);showToast(error.message);return;}
  await loadProfile(); await renderShop(); await renderBoard();
  showToast(data?.bought?`${i.name} purchased · -${i.price} points ✓`:`${i.name} equipped ✓`);
}

/* ============================================
   SUPABASE CONFIGURATION
============================================ */

// Load the database catalogue after Supabase has been initialized by the main app.
// This keeps the existing catalogue as a fallback while allowing Admin-created
// items to appear automatically in the student Shop.
function scheduleDatabaseShopCatalogueLoad(){
  if(typeof supabaseClient==="undefined"){
    setTimeout(scheduleDatabaseShopCatalogueLoad,500);
    return;
  }
  loadDatabaseShopCatalogue().then(()=>{
    if(currentUser) renderShop();
  });
}

scheduleDatabaseShopCatalogueLoad();
