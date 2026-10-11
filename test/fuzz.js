// Plays many full lives with randomised choices, re-rendering every screen as
// it goes, and asserts that nothing throws and state never goes invalid.
const fs = require("fs");
const src = fs.readFileSync(require("path").join(__dirname,"..","index.html"), "utf8");
const blocks = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = blocks[blocks.length - 1];

class FakeEl {
  constructor(tag){ this.tagName=(tag||"div").toUpperCase(); this.children=[]; this._html=""; this.style={}; this.dataset={}; this._cls=new Set(); this.listeners={}; this.value=""; this.textContent=""; this.disabled=false; this.id=""; }
  set innerHTML(v){ this._html = String(v); } get innerHTML(){ return this._html; }
  set className(v){ this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } get className(){ return [...this._cls].join(" "); }
  get classList(){ const s=this._cls; return { add:(...c)=>c.forEach(x=>s.add(x)), remove:(...c)=>c.forEach(x=>s.delete(x)), toggle:(c,f)=>{ if(f===undefined){ s.has(c)?s.delete(c):s.add(c); } else { f?s.add(c):s.delete(c); } }, contains:c=>s.has(c) }; }
  appendChild(c){ this.children.push(c); return c; }
  remove(){ const p=global.document.body; const i=p.children.indexOf(this); if(i>=0) p.children.splice(i,1); }
  addEventListener(t,f){ (this.listeners[t]=this.listeners[t]||[]).push(f); }
  click(){ (this.listeners.click||[]).forEach(f=>f({preventDefault(){},stopPropagation(){}})); }
  querySelector(){ return new FakeEl(); } querySelectorAll(){ return []; }
  getBoundingClientRect(){ return {top:0,left:0,width:320,height:40,bottom:40,right:320}; }
  focus(){} blur(){} scrollIntoView(){} setAttribute(){} getAttribute(){ return null; }
}
const appEl = new FakeEl("div"); appEl.id="app";
const barEl = new FakeEl("div"); barEl.id="actionbar";
const registry = { app: appEl, actionbar: barEl };
global.document = { body:new FakeEl("body"), getElementById(id){ return registry[id] || new FakeEl(); },
  querySelectorAll(){ return []; }, createElement(t){ return new FakeEl(t); }, addEventListener(){} };
global.window = { storage:{ _m:{},
  async get(k){ if(!(k in this._m)) throw new Error("no key"); return {key:k,value:this._m[k]}; },
  async set(k,v){ this._m[k]=v; return {key:k,value:v}; },
  async delete(k){ delete this._m[k]; return {}; }, async list(){ return {keys:Object.keys(this._m)}; } },
  addEventListener(){} };
global.navigator = { vibrate(){} };
global.AudioContext = function(){ return { createOscillator(){ return {connect(){},start(){},stop(){},frequency:{value:0},type:""}; }, createGain(){ return {connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}}; }, destination:{}, currentTime:0 }; };
global.setTimeout = ()=>0; global.clearTimeout = ()=>{}; global.requestAnimationFrame = f=>{ f(); return 0; };

const instrumented = code.replace(/\}\)\(\);?\s*$/, `
  globalThis.__t = { get appScreen(){return appScreen;}, set appScreen(v){appScreen=v;},
    render, renderSplash, renderHome, renderSetup, renderAchievementsScreen,
    renderStatisticsScreen, renderSettingsScreen, openScenarioPicker,
    get state(){return state;}, set state(v){state=v;}, get meta(){return meta;},
    get savedLife(){return savedLife;}, set savedLife(v){savedLife=v;},
    rollSetupDraft, startGame, ageUp, SCENARIOS, BIRTHPLACES, NOBILITY_RANKS, netWorth };
})();`);
eval(instrumented);
const T = globalThis.__t;

const R = n => Math.floor(Math.random()*n);
const pick = a => a[R(a.length)];
const STATS = ["health","happiness","smarts","looks"];

let lives = 0, errors = [], invalid = [], ages = [], reached75 = 0, reached95 = 0, childDeaths = 0;
const TARGET = 300;

for(let i=0;i<TARGET;i++){
  try{
    T.state = null;
    T.appScreen = pick(["home","achievements","statistics","settings","create"]);
    T.render();

    T.rollSetupDraft();
    const scen = pick(T.SCENARIOS);
    T.startGame("Fuzz Subject", pick(["Girl","Boy"]), pick(["Straight","Gay","Bisexual"]), {
      scenarioId: scen.id,
      ...(Math.random()<0.4 ? { birthplace: pick(T.BIRTHPLACES), wealthClass: pick(["poor","middle","rich"]), nobility: pick(T.NOBILITY_RANKS).id } : {}),
      ...(scen.setup || {}),
    });

    let guard = 0;
    while(T.state && T.state.alive && guard++ < 140){
      // Resolve any open decision by picking a random option.
      let inner = 0;
      while(T.state && T.state.pendingChoice && inner++ < 12){
        const pc = T.state.pendingChoice;
        const opts = (pc.options || []).filter(o => typeof o.effect === "function");
        T.state.pendingChoice = null;
        if(opts.length) pick(opts).effect();
      }
      if(!T.state || !T.state.alive) break;
      T.ageUp();
      if(Math.random() < 0.25) T.render();

      // State sanity
      if(T.state){
        const s = T.state;
        if(!Number.isFinite(s.money)) invalid.push(`life ${i}: money=${s.money}`);
        if(!Number.isFinite(s.age) || s.age < 0) invalid.push(`life ${i}: age=${s.age}`);
        STATS.forEach(k=>{
          const v = s.stats[k];
          if(!Number.isFinite(v) || v < 0 || v > 100) invalid.push(`life ${i} age ${s.age}: ${k}=${v}`);
        });
        if(!Number.isFinite(T.netWorth())) invalid.push(`life ${i}: netWorth NaN`);
      }
    }
    if(T.state){
      ages.push(T.state.age);
      if(T.state.age >= 75) reached75++;
      if(T.state.age >= 95) reached95++;
      if(!T.state.alive && T.state.age < 18) childDeaths++;
    }
    T.render();
    lives++;
  }catch(e){
    errors.push(`life ${i} (age ${T.state?T.state.age:"?"}): ${e && e.message} | ${(e && e.stack||"").split("\n")[1]}`);
  }
}

const avg = ages.length ? (ages.reduce((a,b)=>a+b,0)/ages.length).toFixed(1) : 0;
console.log(`lives completed: ${lives}/${TARGET}`);
console.log(`average age at death: ${avg}  (min ${Math.min(...ages)}, max ${Math.max(...ages)})`);
console.log(`reached 75+: ${reached75} (${(reached75/ages.length*100).toFixed(0)}%)   reached 95+: ${reached95} (${(reached95/ages.length*100).toFixed(0)}%)`);
console.log(`deaths before 18: ${childDeaths}`);
console.log(`exceptions: ${errors.length}`);
errors.slice(0,12).forEach(e=>console.log("  ! " + e));
console.log(`invalid states: ${invalid.length}`);
[...new Set(invalid)].slice(0,12).forEach(e=>console.log("  ? " + e));
process.exit(errors.length || invalid.length ? 1 : 0);
