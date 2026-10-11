// Headless check of the redesigned shell: splash -> home -> create -> game,
// plus the achievements / statistics / settings screens and the scenario sheet.
const fs = require("fs");
const src = fs.readFileSync(require("path").join(__dirname,"..","index.html"), "utf8");
const blocks = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = blocks[blocks.length - 1];

// ---- Minimal DOM ----
class FakeEl {
  constructor(tag){ this.tagName=(tag||"div").toUpperCase(); this.children=[]; this._html=""; this.style={}; this.dataset={}; this._cls=new Set(); this.listeners={}; this.value=""; this.textContent=""; this.disabled=false; this.id=""; }
  set innerHTML(v){ this._html = String(v); }
  get innerHTML(){ return this._html; }
  set className(v){ this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className(){ return [...this._cls].join(" "); }
  get classList(){ const s=this._cls; return { add:(...c)=>c.forEach(x=>s.add(x)), remove:(...c)=>c.forEach(x=>s.delete(x)), toggle:(c,f)=>{ if(f===undefined){ s.has(c)?s.delete(c):s.add(c); } else { f?s.add(c):s.delete(c); } }, contains:c=>s.has(c) }; }
  appendChild(c){ this.children.push(c); return c; }
  remove(){ const p=document.body; const i=p.children.indexOf(this); if(i>=0) p.children.splice(i,1); }
  addEventListener(t,f){ (this.listeners[t]=this.listeners[t]||[]).push(f); }
  click(){ (this.listeners.click||[]).forEach(f=>f({preventDefault(){},stopPropagation(){}})); }
  querySelector(){ return new FakeEl(); }
  querySelectorAll(){ return []; }
  getBoundingClientRect(){ return {top:0,left:0,width:320,height:40,bottom:40,right:320}; }
  focus(){} blur(){} scrollIntoView(){} setAttribute(){} getAttribute(){ return null; }
}
const appEl = new FakeEl("div"); appEl.id="app";
const barEl = new FakeEl("div"); barEl.id="actionbar";
const registry = { app: appEl, actionbar: barEl };
global.document = {
  body: new FakeEl("body"),
  getElementById(id){ if(registry[id]) return registry[id]; return new FakeEl(); },
  querySelectorAll(){ return []; },
  createElement(t){ return new FakeEl(t); },
  addEventListener(){},
};
global.window = {
  storage: {
    _m:{},
    async get(k){ if(!(k in this._m)) throw new Error("no key"); return {key:k, value:this._m[k]}; },
    async set(k,v){ this._m[k]=v; return {key:k,value:v}; },
    async delete(k){ delete this._m[k]; return {}; },
    async list(){ return {keys:Object.keys(this._m)}; },
  },
  addEventListener(){},
};
global.navigator = { vibrate(){} };
global.AudioContext = function(){ return { createOscillator(){ return {connect(){},start(){},stop(){},frequency:{value:0},type:""}; }, createGain(){ return {connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}}; }, destination:{}, currentTime:0 }; };
global.setTimeout = (f)=>{ return 0; };   // splash timer never auto-fires; we drive it
global.clearTimeout = ()=>{};
global.requestAnimationFrame = (f)=>{ f(); return 0; };

// Expose internals
const instrumented = code.replace(/^\(function\(\)\{/, "(function(){ globalThis.__t = {};")
  .replace(/\}\)\(\);?\s*$/, `
  globalThis.__t = { get appScreen(){return appScreen;}, set appScreen(v){appScreen=v;},
    render, renderSplash, renderHome, renderSetup, renderAchievementsScreen,
    renderStatisticsScreen, renderSettingsScreen, openScenarioPicker,
    get state(){return state;}, set state(v){state=v;},
    get meta(){return meta;}, get savedLife(){return savedLife;}, set savedLife(v){savedLife=v;},
    get setupDraft(){return setupDraft;}, rollSetupDraft, startGame, ageUp,
    buyPerk, respecPerks, hasPerk, PERKS,
    SCENARIOS, ACHIEVEMENTS, CHALLENGES, RIBBONS, unlockedAchievements };
})();`);

eval(instrumented);
const T = globalThis.__t;

let fails = 0, passes = 0;
function has(label, html, ...needles){
  const miss = needles.filter(n => !html.includes(n));
  if(miss.length){ console.log("  FAIL " + label + " — missing: " + JSON.stringify(miss)); fails++; }
  else { passes++; }
}
function absent(label, html, ...needles){
  const found = needles.filter(n => html.includes(n));
  if(found.length){ console.log("  FAIL " + label + " — unexpectedly present: " + JSON.stringify(found)); fails++; }
  else { passes++; }
}
function check(label, cond){ if(cond){ passes++; } else { console.log("  FAIL " + label); fails++; } }
function count(html, re){ return (html.match(re)||[]).length; }

// ---------- 1. Splash ----------
console.log("1. Splash");
T.appScreen = "splash"; T.state = null; T.render();
has("splash content", appEl.innerHTML, 'class="splash"', "THE LEDGER", "a life, entered line by line", 'class="dots"');
check("splash has no nav", barEl.innerHTML === "");

// ---------- 2. Home ----------
console.log("2. Home");
T.appScreen = "home"; T.savedLife = null; T.render();
let h = appEl.innerHTML;
has("home chrome", h, 'id="homeMenuBtn"', 'data-goto="settings"', 'class="brand"', 'class="bt">THE LEDGER');
has("home legacy card", h, "Your Legacy", "Level ", 'class="xpbar"', "XP to level");
has("home CTA", h, 'id="startNewBtn"', "Start a New Life");
has("home continue row", h, 'id="continueBtn"', "Continue Life", "No life in progress");
check("continue disabled with no save", h.includes('id="continueBtn" disabled'));
has("home tiles", h, 'data-goto="achievements"', "Achievements", 'data-goto="statistics"', "Statistics");
has("home version", h, "Version 1.0");
absent("home has no challenge list", h, "Early Retirement", "Doctor Doctor", "Spotless");

// with a saved life
T.savedLife = { name:"Test Person", age:34, money:12345, alive:true };
T.render();
h = appEl.innerHTML;
has("continue shows saved life", h, "Test Person, age 34", "£12,345");
check("continue enabled with save", !h.includes('id="continueBtn" disabled'));
T.savedLife = null;

// ---------- 3. Create a Life ----------
console.log("3. Create a Life");
T.rollSetupDraft();
T.appScreen = "create"; T.render();
let c = appEl.innerHTML;
has("create header", c, "Create a Life", 'data-goto="home"');
has("create names", c, 'id="firstNameInput"', 'id="lastNameInput"', 'id="rerollBtn"');
has("create gender", c, 'id="genderSeg"', 'data-g="Girl"', 'data-g="Boy"');
has("create scenarios", c, 'id="scenGrid"', 'id="moreScenBtn"');
check("scenario grid shows exactly 4 picks", count(c, /class="pick/g) === 4);
has("create difficulty", c, 'id="diffSeg"', 'data-diff="easy"', 'data-diff="normal"', 'data-diff="brutal"');
has("god mode disclosure", c, 'id="advBtn"', "God Mode", 'id="advBody"');
check("advanced starts collapsed", c.includes('class="advbody hidden"'));
// Every God Mode control is behind its own perk now, so unlock them all and
// re-render before checking the section's contents.
T.meta.xp = 500000;
["god_sexuality","era_choice","god_birthplace","god_wealth","god_nobility","god_royalty"].forEach(id=>T.buyPerk(id));
T.render();
c = appEl.innerHTML;
has("advanced contents", c, 'id="sexSeg"', 'id="wealthSeg"', 'id="nobList2"', 'id="bpContGrid"', 'id="eraList"');
T.respecPerks();
T.render();
c = appEl.innerHTML;
has("locked God Mode names its perks", c, "Know Thyself", "Choose Your Class", "Born to Title");
has("create sticky CTA", c, 'class="stickybar"', 'id="startBtn"', "Begin My Life");
absent("create has no XP/challenge block", c, "Challenges —", "Early Retirement", "Best life");
// pre-selection: the rolled values must be marked on
const D = T.setupDraft;
check("rolled gender preselected", c.includes(`data-g="${D.gender}" class="on"`));
check("rolled names prefilled", c.includes(`value="${D.firstName}"`) && c.includes(`value="${D.lastName}"`));
check("difficulty preselected", c.includes(`data-diff="${T.meta.difficulty}" class="on"`));
check("free play preselected by default", c.includes('data-scen="free"') && c.includes('class="pick on" data-scen="free"'));

// ---------- 4. Scenario sheet ----------
console.log("4. Scenario sheet");
document.body.children.length = 0;
T.openScenarioPicker();
const sheet = document.body.children[document.body.children.length-1];
check("sheet appended", !!sheet && sheet.id === "sheetOverlay");
const sh = sheet ? sheet.innerHTML : "";
has("sheet shell", sh, 'id="closeSheetBtn"', "Choose a scenario");
T.SCENARIOS.forEach(sc => has("sheet lists " + sc.id, sh, `data-scen="${sc.id}"`, sc.name));
check("sheet lists all " + T.SCENARIOS.length + " scenarios", count(sh, /data-scen=/g) === T.SCENARIOS.length);

// ---------- 5. Achievements ----------
console.log("5. Achievements");
T.appScreen = "achievements"; T.render();
let a = appEl.innerHTML;
has("ach header", a, "Achievements", 'data-goto="home"');
has("ach progress", a, "unlocked", 'class="xpbar"');
has("ach groups", a, "Challenges —", "Completed", "Still to earn", "Life ribbons collected");
T.CHALLENGES.forEach(ch => has("challenge " + ch.id, a, ch.name));
check("every achievement listed", T.ACHIEVEMENTS.every(x => a.includes(x.name)));
check("every ribbon listed", T.RIBBONS.every(r => a.includes(r.name)));

// ---------- 6. Statistics ----------
console.log("6. Statistics");
T.appScreen = "statistics"; T.render();
let s = appEl.innerHTML;
has("stats header", s, "Statistics", 'data-goto="home"');
has("stat boxes", s, "Lives lived", "Total XP", "Average age", "Oldest");
check("4 statboxes", count(s, /class="statbox"/g) === 4);
has("records card", s, "Records", "Best life score", "Highest net worth", "Deepest generation");
has("past lives empty state", s, "No completed lives yet");
// with history
T.meta.lives.push({name:"Ada Vale", age:91, netWorth:480000, score:7200, generation:2, difficulty:"normal", ribbon:"Tycoon", cause:"old age", title:"Dame"});
T.render(); s = appEl.innerHTML;
has("past life rendered", s, "Dame Ada Vale — died at 91", "Tycoon", "£480,000", "gen 2", "7,200");
T.meta.lives.length = 0;

// ---------- 7. Settings ----------
console.log("7. Settings");
T.appScreen = "settings"; T.render();
let g = appEl.innerHTML;
has("settings header", g, "Settings", 'data-goto="home"');
has("settings toggles", g, 'id="setSound"', "Sound", 'id="setHaptics"', "Haptics");
has("settings difficulty", g, 'id="setDiffSeg"', 'data-diff="brutal"');
has("settings about", g, "About", "Version 1.0");
absent("no discard row without a save", g, 'id="setDiscard"');
T.savedLife = { name:"Z", age:5, money:0, alive:true };
T.render();
has("discard row with a save", appEl.innerHTML, 'id="setDiscard"', "Discard this saved life");
T.savedLife = null;

// ---------- 8. The game itself still runs ----------
console.log("8. In-game UI under the new palette");
T.rollSetupDraft();
T.startGame("Nell Harrow", "Girl", "Straight", { scenarioId:"free" });
check("game started", !!T.state && T.state.age === 0);
for(let i=0;i<12;i++){ if(T.state && T.state.pendingChoice) T.state.pendingChoice = null; T.ageUp(); }
check("reached age 12", T.state && T.state.age === 12);
// A pending decision deliberately replaces the nav with the choice modal,
// so clear it before checking the ordinary in-game chrome.
check("choice modal replaces the nav", (()=>{
  if(!T.state.pendingChoice) return true;      // none open this run
  T.render();
  return barEl.innerHTML.includes("sheet") || barEl.innerHTML === "" || !barEl.innerHTML.includes("navbar");
})());
T.state.pendingChoice = null;
T.render();
const game = appEl.innerHTML;
has("in-game topbar", game, 'class="topbar"', 'id="menuBtn"', "THE LEDGER", 'id="xpPill"');
has("in-game charhead", game, 'class="charhead"', 'class="avatar"', "Nell Harrow", "Bank Balance");
has("in-game log", game, 'class="logwrap"', 'class="yearhead"');
has("in-game nav", barEl.innerHTML, 'class="navbar"', 'class="agebtn"', 'class="statsbar"');
has("stat bars present", barEl.innerHTML, 'class="track"', 'class="fill"');
// bars must carry real widths
const widths = [...barEl.innerHTML.matchAll(/class="fill"[^>]*width:(\d+)%/g)].map(m=>+m[1]);
check("4 stat bars with widths", widths.length === 4);
check("widths are sane percentages", widths.every(w => w >= 0 && w <= 100));
// log reads oldest-first
const ages = [...game.matchAll(/class="yearhead"[^>]*>\s*<span>Age (\d+)/g)].map(m=>+m[1]);
if(ages.length > 1) check("log reads oldest at top", ages[0] < ages[ages.length-1]);

// death -> back to home
console.log("9. Death returns to the shell");
T.state = null; T.appScreen = "home"; T.render();
has("home again after death", appEl.innerHTML, "Start a New Life");

console.log("\n" + passes + " passed, " + fails + " failed");
process.exit(fails ? 1 : 0);
