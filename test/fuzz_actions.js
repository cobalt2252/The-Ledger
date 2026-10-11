// Fires the new player-facing actions at random, thousands of times, across
// lives at every age and wealth level, and asserts nothing throws and no state
// goes invalid. Also checks the new prompts survive a save/restore round trip.
const fs = require("fs");
const code = [...fs.readFileSync(require("path").join(__dirname,"..","index.html"),"utf8").matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).pop();

class FakeEl{ constructor(t){this.tagName=(t||"div").toUpperCase();this.children=[];this._html="";this.style={};this.dataset={};this._cls=new Set();this.listeners={};this.value="";this.textContent="";this.disabled=false;this.id="";}
 set innerHTML(v){this._html=String(v);} get innerHTML(){return this._html;}
 set className(v){this._cls=new Set(String(v).split(/\s+/).filter(Boolean));} get className(){return [...this._cls].join(" ");}
 get classList(){const s=this._cls;return{add:(...c)=>c.forEach(x=>s.add(x)),remove:(...c)=>c.forEach(x=>s.delete(x)),toggle:(c,f)=>{if(f===undefined){s.has(c)?s.delete(c):s.add(c);}else{f?s.add(c):s.delete(c);}},contains:c=>s.has(c)};}
 appendChild(c){this.children.push(c);return c;} remove(){const p=global.document.body;const i=p.children.indexOf(this);if(i>=0)p.children.splice(i,1);}
 addEventListener(t,f){(this.listeners[t]=this.listeners[t]||[]).push(f);} click(){(this.listeners.click||[]).forEach(f=>f({preventDefault(){},stopPropagation(){}}));}
 querySelector(){return new FakeEl();} querySelectorAll(){return [];}
 getBoundingClientRect(){return{top:0,left:0,width:320,height:40,bottom:40,right:320};}
 focus(){}blur(){}scrollIntoView(){}setAttribute(){}getAttribute(){return null;} }
const appEl=new FakeEl(); appEl.id="app"; const barEl=new FakeEl(); barEl.id="actionbar";
const reg={app:appEl,actionbar:barEl};
global.document={body:new FakeEl(),getElementById(i){return reg[i]||new FakeEl();},querySelectorAll(){return [];},createElement(t){return new FakeEl(t);},addEventListener(){}};
global.window={storage:{_m:{},async get(k){if(!(k in this._m))throw new Error("x");return{key:k,value:this._m[k]};},async set(k,v){this._m[k]=v;return{};},async delete(){return{};},async list(){return{keys:[]};}},addEventListener(){}};
global.navigator={vibrate(){}};
global.AudioContext=function(){return{createOscillator(){return{connect(){},start(){},stop(){},frequency:{value:0},type:""};},createGain(){return{connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}};},destination:{},currentTime:0};};
global.setTimeout=()=>0; global.clearTimeout=()=>{}; global.requestAnimationFrame=f=>{f();return 0;};

eval(code.replace(/\}\)\(\);?\s*$/, `
 globalThis.__t = {
   set appScreen(v){appScreen=v;}, render, rollSetupDraft, startGame, ageUp,
   get state(){return state;}, set state(v){state=v;}, get meta(){return meta;},
   buyLifeInsurance, changeLifeInsurance, cancelLifeInsurance, LIFE_INSURANCE_OPTIONS,
   buyPropertiesBulk, rentOutAllProperties, stopRentingAllProperties, sellAllProperties,
   SHOP_DEFS, restockShop, doBuyListing, get shopStock(){return shopStock;}, propertyListings, doBuyListedProperty, doRenovate, doSellProperty, doMoveInto,
   doAppraise, doRestore, doSellBelonging, giveHeirloom, toggleRent, doMoveOut, doMoveBackHome,
   maxPropertiesAffordable, doInvestCustom, doInvestAll, doInvestType, sellInvestment,
   sellInvestmentPart, INVESTMENT_TYPES,
   get datingFilters(){return datingFilters;}, set datingFilters(v){datingFilters=v;},
   generateDatingProfiles, doDatingApp, doOneNightStand, promptIntimacy, doIntimacy,
   launchAdultChild, doAdultChild, doSpendTimeWithEveryone, addFriend,
   offerNewFriendship, offerFriendInvitation, offerNeglectedFriend, maybeSocialEvent,
   maybeCareerEvent, doWorkHarder, doSlackOff, quitJob, doAskPromotion,
   resolveStake, doSlots, startBlackjackHand, checkCasinoBan, recordCasinoResult,
   isBannedFromCasino, openCasinoSheet, renderCasinoSheet,
   get casinoView(){return casinoView;}, set casinoView(v){casinoView=v;},
   get bj(){return bj;}, set bj(v){bj=v;},
   ENGAGEMENT_RINGS, WEDDING_VENUES, HONEYMOONS, canPropose, openProposalFlow,
   doPropose, openWeddingPlanner, openPrenupChoice, openHoneymoonChoice,
   endLedgerEarly, politicalApproval, doPoliticalEffort, resignOffice, runPoliticsYear,
   POLITICAL_OFFICES, checkPerformanceWarning, ageFamilyAndFriends, makePerson,
   RETURN_COURSES, availableReturnCourses, openReturnToEducation, openFundingChoice,
   enrolReturnCourse, runStudyingYear, doDropStudying, doStartPostgrad,
   openCareerSheet, renderCareerSheetContent,
   get careerView(){return careerView;}, set careerView(v){careerView=v;},
   openSettingsSheet,
   collectRent, prisonConduct, PRISON_JOBS, PRISON_CRIMES, doPrisonJob, doKeepClean,
   doPrisonSelfImprovement, doPrisonCrime, doPrisonEscape, doApplyParole, activityTabs,
   backfillGrandchildren, startAsChild, die, tickAdultChild,
   get notifications(){return notifications;}, set notifications(v){notifications=v;},
   milestone, dismissNotification, clearNotifications, MILESTONE_KINDS,
   get pendingOutcome(){return pendingOutcome;}, set pendingOutcome(v){pendingOutcome=v;},
   setOutcome, inferVerdict, runOptionWithOutcome, checkRetirementAge, conceiveChild,
   nudge, queueChoice, advanceChoiceQueue, addLog,
   PERKS, buyPerk, respecPerks, hasPerk, xpAvailable, perksOwned, renderPerksScreen,
   ERAS, eraById, moneyIndex, housingIndex, priceLevel, propertyPrice, propertyUpkeep,
   ERA_EVENTS, runEraEvent, checkConscription, trackExistsYet, tracksInCategory,
   effectiveMinSmarts, DIFFICULTIES, isHardcore, timeMachineDepth, pushSnapshot,
   MUSEUM_SECTIONS, MUSEUM_FEATS, museum, museumAdd, museumHas, museumProgress,
   recordToMuseum, emptyMuseum, renderMuseumScreen, fastForwardChildhood,
   recordFinishedLife, annualExpenses, incomeTax, payIncome,
   COUNTRIES, CONTINENTS, countryByName, countriesIn, continentOf, localCurrency,
   formatGbp, formatIn, moneyGbp, cur, doEmigrate, emigrationShift, emigrationCost,
   museumAddCountry, countrySectionId, rollBirthplace, money,
   GOD_PERKS, godPerksOwned, nobilityAllowed, rollSexuality, lockedNote,
   NOBILITY_RANKS, renderSetup, SCENARIOS,
   get perksReturnTo(){return perksReturnTo;}, set perksReturnTo(v){perksReturnTo=v;},
   get setupDraft(){return setupDraft;}, set setupDraft(v){setupDraft=v;},
   get worldView(){return worldView;}, set worldView(v){worldView=v;},
   openAssetsSheet, renderAssetsSheet, openPeopleSheet, renderPeopleSheetContent,
   openActivitySheet, renderActivitySheetContent,
   get assetsView(){return assetsView;}, get peopleView(){return peopleView;}, get activityView(){return activityView;},
   netWorth, SCENARIOS, TRACKS, FORCES,
 };
})();`));
const T = globalThis.__t;
const R = n=>Math.floor(Math.random()*n);
const pick = a=>a[R(a.length)];
const STATS = ["health","happiness","smarts","looks"];

let errors=[], invalid=[], fired=0;
function check(where){
  const s = T.state;
  if(!s) return;
  if(!Number.isFinite(s.money)) invalid.push(`${where}: money=${s.money}`);
  if(s.money < -1e12) invalid.push(`${where}: money absurd ${s.money}`);
  STATS.forEach(k=>{ const v=s.stats[k]; if(!Number.isFinite(v)||v<0||v>100) invalid.push(`${where}: ${k}=${v}`); });
  if(!Number.isFinite(T.netWorth())) invalid.push(`${where}: netWorth NaN`);
  (s.assets||[]).forEach((a,i)=>{ if(!Number.isFinite(a.value)) invalid.push(`${where}: asset ${i} value=${a.value}`); });
  (s.children||[]).forEach(c=>{
    if(c.adult && !Number.isFinite(c.income)) invalid.push(`${where}: adult child income=${c.income}`);
    if(c.bond !== undefined && (!Number.isFinite(c.bond)||c.bond<0||c.bond>100)) invalid.push(`${where}: bond=${c.bond}`);
  });
  (s.friends||[]).forEach(f=>{ if(!Number.isFinite(f.closeness)) invalid.push(`${where}: closeness=${f.closeness}`); });
  if(s.lifeInsurance && !Number.isFinite(s.lifeInsurance.premium)) invalid.push(`${where}: premium=${s.lifeInsurance.premium}`);
  if(s.casinoNet !== undefined && !Number.isFinite(s.casinoNet)) invalid.push(`${where}: casinoNet=${s.casinoNet}`);
  if(s.politics && (!Number.isFinite(s.politics.approval) && s.politics.approval !== undefined)) invalid.push(`${where}: approval=${s.politics.approval}`);
  if(s.studying && !Number.isFinite(s.studying.yearsLeft)) invalid.push(`${where}: yearsLeft=${s.studying.yearsLeft}`);
  if(s.studentLoan && !Number.isFinite(s.studentLoan.balance)) invalid.push(`${where}: loan=${s.studentLoan.balance}`);
  if(s.prisonConduct !== undefined && (!Number.isFinite(s.prisonConduct) || s.prisonConduct < 0 || s.prisonConduct > 100)) invalid.push(`${where}: conduct=${s.prisonConduct}`);
  if(!Number.isFinite(s.prisonYearsLeft) || s.prisonYearsLeft < 0) invalid.push(`${where}: prisonYearsLeft=${s.prisonYearsLeft}`);
  if(s.year !== undefined && (!Number.isFinite(s.year) || s.year < 1800 || s.year > 3000)) invalid.push(`${where}: year=${s.year}`);
  if(s.birthYear !== undefined && !Number.isFinite(s.birthYear)) invalid.push(`${where}: birthYear=${s.birthYear}`);
  if(!Number.isFinite(T.priceLevel()) || T.priceLevel() <= 0) invalid.push(`${where}: priceLevel=${T.priceLevel()}`);
  if(!Number.isFinite(T.propertyPrice()) || T.propertyPrice() <= 0) invalid.push(`${where}: propertyPrice=${T.propertyPrice()}`);
  if(!Number.isFinite(T.annualExpenses()) || T.annualExpenses() < 0) invalid.push(`${where}: expenses=${T.annualExpenses()}`);
  if(!Number.isFinite(T.xpAvailable()) || T.xpAvailable() < 0) invalid.push(`${where}: xpAvailable=${T.xpAvailable()}`);
  { const m = T.money(s.money);
    if(/NaN|undefined|Infinity/.test(m)) invalid.push(`${where}: money() rendered "${m}" in ${s.currentCountry}`); }
  if(s.currentCountry !== undefined && s.currentCountry !== null && typeof s.currentCountry !== "string"){
    invalid.push(`${where}: currentCountry=${s.currentCountry}`);
  }
  if(s.emigrationMultipliers){
    ["salaryMult","costMult"].forEach(k=>{
      const v = s.emigrationMultipliers[k];
      if(!Number.isFinite(v) || v <= 0) invalid.push(`${where}: ${k}=${v}`);
    });
  }
  if(s.rentStats){
    ["lifetimeGross","lifetimeMaintenance","years"].forEach(k=>{
      if(!Number.isFinite(s.rentStats[k]) || s.rentStats[k] < 0) invalid.push(`${where}: rentStats.${k}=${s.rentStats[k]}`);
    });
  }
  (s.children||[]).forEach(c=>{
    (c.ownChildren||[]).forEach(g=>{
      if(!Number.isFinite(g.age) || g.age < 0) invalid.push(`${where}: grandchild age=${g.age}`);
      if(typeof g.name !== "string" || !g.name) invalid.push(`${where}: grandchild name=${g.name}`);
    });
  });
  (s.family||[]).forEach(p=>{ if(p.age !== undefined && (!Number.isFinite(p.age) || p.age < 0)) invalid.push(`${where}: family age=${p.age}`); });
  (s.friends||[]).forEach(p=>{ if(p.age !== undefined && !Number.isFinite(p.age)) invalid.push(`${where}: friend age=${p.age}`); });
  if(s.relationship && s.relationship.age !== undefined && !Number.isFinite(s.relationship.age)) invalid.push(`${where}: partner age=${s.relationship.age}`);
}

// Resolve any open prompt by a random option, as a player would.
function resolvePrompt(){
  let guard=0;
  while(T.state && T.state.pendingChoice && guard++ < 10){
    const pc = T.state.pendingChoice;
    const opts = (pc.options||[]).filter(o=>typeof o.effect==="function");
    T.state.pendingChoice = null;
    if(opts.length) pick(opts).effect();
  }
}

const ACTIONS = [
  // Money
  ()=>{ reg.investAmtInput = new FakeEl(); reg.investAmtInput.value = pick(["100","2500","2.5k","£10,000","1m","abc","","-50","0"]); T.doInvestCustom(pick(Object.keys(T.INVESTMENT_TYPES))); },
  ()=>T.doInvestAll(pick(Object.keys(T.INVESTMENT_TYPES))),
  ()=>T.doInvestType(pick(Object.keys(T.INVESTMENT_TYPES)), pick([100,5000,1e6,0,-100,NaN])),
  ()=>{ const i=(T.state.assets||[]).findIndex(a=>["bonds","stocks","crypto"].includes(a.type)); if(i>=0) T.sellInvestmentPart(i, pick([100,5000,1e9,0,-5,NaN])); },
  ()=>{ const i=(T.state.assets||[]).findIndex(a=>["bonds","stocks","crypto"].includes(a.type)); if(i>=0) T.sellInvestment(i); },
  // Property
  ()=>T.buyPropertiesBulk(pick([1,3,10,100,0,-5,NaN,T.maxPropertiesAffordable()])),
  ()=>T.rentOutAllProperties(),
  ()=>T.stopRentingAllProperties(),
  ()=>T.sellAllProperties(),
  // Shops, listings and heirlooms
  ()=>{ const d=pick(T.SHOP_DEFS); const st=T.restockShop(d.id); if(st.length) T.doBuyListing(d.id, pick(st).id); },
  ()=>{ const d=pick(T.SHOP_DEFS); T.doBuyListing(d.id, pick([-1, 0, 99999])); },
  ()=>{ const L=T.propertyListings(Math.random()<0.5); if(L.length) T.doBuyListedProperty(pick(L).id, Math.random()<0.5); },
  ()=>{ const n=(T.state.assets||[]).length; const i=pick([0, n-1, n, -1, Math.floor(Math.random()*Math.max(1,n))]); pick([T.doRenovate,T.doSellProperty,T.doMoveInto,T.doAppraise,T.doRestore,T.doSellBelonging,T.toggleRent])(i); },
  ()=>{ if(Math.random()<0.3) T.giveHeirloom("fuzz"); },
  ()=>pick([T.doMoveOut, T.doMoveBackHome])(),
  // Insurance
  ()=>T.buyLifeInsurance(pick(T.LIFE_INSURANCE_OPTIONS).id),
  ()=>T.changeLifeInsurance(pick(T.LIFE_INSURANCE_OPTIONS).id),
  ()=>T.cancelLifeInsurance(),
  ()=>T.buyLifeInsurance("nonexistent"),
  // Dating
  ()=>{ T.datingFilters = { minAge: pick([null,18,30,55,99,-5]), maxAge: pick([null,25,45,99,18]), minNetWorth: pick([null,0,25000,500000,1e9]) }; T.generateDatingProfiles(); },
  ()=>{ T.state.datingProfiles = T.generateDatingProfiles(); const i=R(3); const p=(T.state.datingProfiles||[])[i]; T.doDatingApp(p?p.name:"x", i); },
  ()=>{ T.doOneNightStand(); resolvePrompt(); },
  ()=>{ T.promptIntimacy(); resolvePrompt(); },
  ()=>T.doIntimacy(Math.random()<0.5),
  // Children
  ()=>{ const c=pick((T.state.children||[]).filter(x=>x.adult)); if(c) T.doAdultChild(c.id, pick(["visit","help","education","career","dating","family","nonsense"])); },
  ()=>{ const c=pick((T.state.children||[]).filter(x=>!x.adult)); if(c){ c.age=18; T.launchAdultChild(c); } },
  // Social
  ()=>T.doSpendTimeWithEveryone(),
  ()=>{ T.addFriend(null, pick([5,40,80,100])); },
  ()=>{ T.offerNewFriendship(); resolvePrompt(); },
  ()=>{ T.offerFriendInvitation(); resolvePrompt(); },
  ()=>{ T.offerNeglectedFriend(); resolvePrompt(); },
  ()=>{ T.maybeSocialEvent(); resolvePrompt(); },
  // Work
  ()=>{ T.maybeCareerEvent(); resolvePrompt(); },
  ()=>T.doWorkHarder(),
  ()=>T.doSlackOff(),
  ()=>T.quitJob(),
  // Casino at any stake
  ()=>{ reg.betInput = new FakeEl(); reg.betInput.value = pick(["100","5k","all","abc","","-1","0","1m"]);
        T.doSlots(T.resolveStake(reg.betInput.value)); },
  ()=>{ T.startBlackjackHand(T.resolveStake(pick(["250","all","1m","nope"]))); },
  ()=>{ T.recordCasinoResult(pick([-100000, 500000, 6000000])); T.checkCasinoBan(); resolvePrompt(); },
  ()=>{ T.openCasinoSheet(); const ov=document.body.children[document.body.children.length-1];
        T.casinoView={game:pick(["menu","slots","lottery"])}; T.renderCasinoSheet(ov); },
  // Proposals and weddings
  ()=>{ T.openProposalFlow(); resolvePrompt(); },
  ()=>{ T.doPropose(pick(T.ENGAGEMENT_RINGS)); resolvePrompt(); },
  ()=>{ T.state.engaged=true; T.openWeddingPlanner(); resolvePrompt(); },
  ()=>{ T.openPrenupChoice(); resolvePrompt(); },
  ()=>{ T.state.flags.honeymooned=false; T.openHoneymoonChoice(); resolvePrompt(); },
  // Politics
  ()=>{ T.state.politics = {officeId:pick(T.POLITICAL_OFFICES).id, yearsInOffice:R(6), approval:R(100)}; },
  ()=>T.doPoliticalEffort(pick([1,-1])),
  ()=>{ T.resignOffice(); resolvePrompt(); },
  ()=>T.runPoliticsYear(),
  // Performance
  ()=>{ if(T.state.career){ T.state.career.performance = R(100); T.checkPerformanceWarning("Job"); } },
  ()=>T.doAskPromotion(),
  // Education
  ()=>{ T.openReturnToEducation(); resolvePrompt(); resolvePrompt(); resolvePrompt(); },
  ()=>{ const c=pick(T.RETURN_COURSES); T.openFundingChoice(c, pick([null,"Law","Medicine"])); resolvePrompt(); },
  ()=>{ T.enrolReturnCourse(pick(T.RETURN_COURSES), pick([null,"Science"]), pick(["loan","self","scholarship","parents"])); },
  ()=>T.runStudyingYear(),
  ()=>T.doDropStudying(),
  ()=>{ T.doStartPostgrad(pick(["masters","phd"])); resolvePrompt(); },
  ()=>{ T.openCareerSheet(); const ov=document.body.children[document.body.children.length-1];
        T.careerView={level:pick(["categories","education"]),category:null}; T.renderCareerSheetContent(ov); },
  // Ending it all early
  ()=>{ T.endLedgerEarly(); if(Math.random()<0.2) resolvePrompt(); else { T.state.pendingChoice=null; } },
  // Rent and the property portfolio
  ()=>T.collectRent(),
  // Prison
  ()=>{ T.state.prisonYearsLeft = pick([0,1,3,8,20]); T.state.prisonActionUsed = false; },
  ()=>{ T.state.prisonYearsLeft = Math.max(1, T.state.prisonYearsLeft||1); T.state.prisonActionUsed=false; T.doPrisonJob(pick(T.PRISON_JOBS).id); },
  ()=>{ T.state.prisonYearsLeft = Math.max(1, T.state.prisonYearsLeft||1); T.state.prisonActionUsed=false; T.doKeepClean(); },
  ()=>{ T.state.prisonYearsLeft = Math.max(1, T.state.prisonYearsLeft||1); T.state.prisonActionUsed=false; T.doPrisonSelfImprovement(pick(["gym","course","quiet","nonsense"])); },
  ()=>{ T.state.prisonYearsLeft = Math.max(1, T.state.prisonYearsLeft||1); T.state.prisonActionUsed=false; T.doPrisonCrime(pick(T.PRISON_CRIMES).id); },
  ()=>{ T.state.prisonYearsLeft = Math.max(1, T.state.prisonYearsLeft||1); T.state.prisonActionUsed=false; T.doPrisonEscape(); },
  ()=>{ T.state.prisonYearsLeft = Math.max(1, T.state.prisonYearsLeft||1); T.state.yearlyActivityUses={}; T.doApplyParole(); },
  ()=>T.activityTabs(),
  // Notifications and outcomes
  ()=>T.milestone(pick(Object.keys(T.MILESTONE_KINDS)), "A fuzzed milestone."),
  ()=>{ if(T.notifications.length) T.dismissNotification(T.notifications[0].id); },
  ()=>T.clearNotifications(),
  ()=>{ const ch={title:"Fuzz", text:"t", options:[{label:"go", effect:()=>{
          if(Math.random()<0.3) T.setOutcome(pick(["success","fail","neutral"]), "Fuzzed");
          if(Math.random()<0.3) T.state.money += pick([-5000, 5000]);
          if(Math.random()<0.3) T.nudge(pick(["health","happiness","smarts","looks"]), pick([-8,8]));
          if(Math.random()<0.3) T.milestone("milestone","From inside an effect.");
          if(Math.random()<0.2) T.queueChoice({title:"Chained", text:"t", options:[{label:"ok", effect:()=>{}}]});
        }}]};
        T.state.pendingChoice = ch; T.runOptionWithOutcome(ch, 0); T.pendingOutcome = null; },
  // Legacy — continuing as a child, with whatever family they bring
  ()=>{ (T.state.children||[]).filter(c=>c.adult).forEach(c=>T.backfillGrandchildren(c)); },
  ()=>{ const c = pick((T.state.children||[]).filter(x=>x.adult)); if(c) T.tickAdultChild(c); },
  ()=>{ const c = pick(T.state.children||[]); if(c && T.state.alive){ T.die("fuzz"); T.startAsChild(c.id); } },
  ()=>T.checkRetirementAge(),
  ()=>{ if((T.state.children||[]).length < 6) T.conceiveChild(); },
  // God Mode gating: a random set of perks against a deliberately extreme
  // draft, checked for leaks after the life starts.
  ()=>{
    T.meta.perks = T.GOD_PERKS.filter(()=>Math.random()<0.5);
    T.meta.xpSpent = 0;
    T.rollSetupDraft();
    const d = T.setupDraft;
    d.advOpen = Math.random()<0.5;
    d.nobility = pick(T.NOBILITY_RANKS).id;
    d.wealthClass = pick(["poor","middle","rich"]);
    d.birthplace = pick(T.COUNTRIES).name;
    d.eraId = pick(T.ERAS).id;
    d.sexuality = pick(["Straight","Gay","Bisexual"]);
    d.scenarioId = pick(T.SCENARIOS).id;
    const scen = T.SCENARIOS.find(x=>x.id===d.scenarioId) || T.SCENARIOS[0];
    const opts = Object.assign({ scenarioId: d.scenarioId },
      T.hasPerk("god_birthplace") ? { birthplace: d.birthplace } : {},
      T.hasPerk("god_wealth")     ? { wealthClass: d.wealthClass } : {},
      T.hasPerk("god_nobility")   ? { nobility: T.nobilityAllowed(d.nobility) } : {},
      T.hasPerk("era_choice")     ? { eraId: d.eraId } : {},
      scen.setup || {});
    T.state = null;
    T.startGame("Fuzz Subject", pick(["Girl","Boy"]),
      T.hasPerk("god_sexuality") ? d.sexuality : T.rollSexuality(), opts);
    // A royal start without the throne perk, and not granted by a scenario,
    // would be a leak.
    const scenGrantsRoyal = !!(scen.setup && scen.setup.nobility === "royal");
    if(T.state && T.state.nobility === "royal" && !T.hasPerk("god_royalty") && !scenGrantsRoyal){
      invalid.push(`royal leaked without the perk (scenario ${d.scenarioId})`);
    }
    if(T.state && T.state.nobility !== "commoner" && !T.hasPerk("god_nobility") && !(scen.setup && scen.setup.nobility)){
      invalid.push(`nobility "${T.state.nobility}" leaked without the perk`);
    }
  },
  ()=>{ T.nobilityAllowed(pick([...T.NOBILITY_RANKS.map(r=>r.id), "emperor", undefined, null])); },
  ()=>{ T.lockedNote(pick([...T.GOD_PERKS, "nonsense"]), "A note."); },
  ()=>{ T.perksReturnTo = pick(["home","create","nonsense"]); T.state=null; T.appScreen="perks"; T.render(); },
  ()=>{ T.rollSetupDraft(); T.setupDraft.advOpen=true; T.state=null; T.appScreen="create"; T.render(); },
  // Perks — bought, refunded, and bought again at random
  ()=>{ T.meta.xp = pick([0, 2000, 50000, 500000]); T.buyPerk(pick(T.PERKS).id); },
  ()=>T.respecPerks(),
  ()=>{ T.meta.xp = 1000000; T.PERKS.forEach(p=>T.buyPerk(p.id)); },
  ()=>{ T.state=null; T.appScreen="perks"; T.render(); },
  // Eras — including nonsense years and the boundaries
  ()=>{ T.state.year = pick([1900, 1940, 1973, 2008, 2020, 2099, 2500]); },
  ()=>{ T.runEraEvent(); resolvePrompt(); },
  ()=>{ T.state.age = 18; T.checkConscription(); resolvePrompt(); },
  ()=>{ T.propertyPrice(); T.propertyUpkeep(); T.annualExpenses(); T.priceLevel(); },
  ()=>{ T.payIncome(pick([0, 1000, 32000, 3000000]), "Fuzzed income"); },
  ()=>{ T.tracksInCategory(pick(["Tech","Sport","Medical","Aviation","Creative","nonsense"])); },
  ()=>{ T.ERAS.forEach(e=>T.eraById(e.id)); T.eraById("nonsense"); },
  // Hardcore switched mid-life, which the UI allows via settings
  ()=>{ T.meta.difficulty = pick(Object.keys(T.DIFFICULTIES)); T.pushSnapshot(); T.timeMachineDepth(); },
  // Museum
  ()=>{ T.recordToMuseum(T.state); T.museumProgress(); },
  ()=>{ T.museumAdd(pick(T.MUSEUM_SECTIONS).id, pick(["a","b","c"])); },
  ()=>{ T.meta.museum = pick([null, {}, T.emptyMuseum()]); T.museumProgress(); },
  ()=>{ T.state=null; T.appScreen="museum"; T.render(); },
  // Childhood fast-forward out of sequence
  ()=>{ T.fastForwardChildhood(); },
  // Emigrating anywhere, and the currency that comes with it
  ()=>{ T.state.money = Math.max(T.state.money, 200000); T.doEmigrate(pick(T.COUNTRIES).name); const c=T.state.pendingChoice; if(c && /^Moving to/.test(c.title)){ T.state.pendingChoice=null; pick(c.options).effect(); } },
  ()=>{ T.doEmigrate("Atlantis"); },
  ()=>{ T.meta.localCurrency = Math.random()<0.5; T.meta.showGbp = Math.random()<0.5; },
  ()=>{ T.state.currentCountry = pick([pick(T.COUNTRIES).name, "Atlantis", undefined, null]); },
  ()=>{ T.COUNTRIES.forEach(c=>{ T.state.currentCountry = c.name; T.money(pick([0,1,-1,12345,1e9,-1e9])); }); },
  ()=>{ T.cur(pick(["Gym — £20 · +health", "£1,200,000 prize", "no amount here", "", "£0"])); },
  ()=>{ T.emigrationShift(pick(T.COUNTRIES).name); T.emigrationCost(pick(T.COUNTRIES).name); },
  ()=>{ T.museumAddCountry(pick([pick(T.COUNTRIES).name, "Atlantis", null])); },
  ()=>{ T.openActivitySheet(); const ov=document.body.children[document.body.children.length-1];
        T.activityView.tab="world"; T.worldView.continent = pick([null, ...T.CONTINENTS, "Atlantica"]);
        T.renderActivitySheetContent(ov); },
  // The world ageing on its own
  ()=>{ T.ageFamilyAndFriends(); resolvePrompt(); },
  // Rendering every affected panel
  ()=>{ T.openAssetsSheet(); const ov=document.body.children[document.body.children.length-1]; T.assetsView.screen=pick(["root","finances","invest","property","vehicles","belongings","will","networth"]); T.renderAssetsSheet(ov); },
  ()=>{ T.openPeopleSheet(); const ov=document.body.children[document.body.children.length-1]; T.peopleView.tab=pick(["menu","family","partner","children","friends","enemies","pets"]); T.renderPeopleSheetContent(ov); },
  ()=>{ T.openActivitySheet(); const ov=document.body.children[document.body.children.length-1]; T.activityView.tab=pick(["menu","dating","family","money","mind","skills","health","licenses"]); T.renderActivitySheetContent(ov); },
];

const LIVES = 240;
for(let life=0; life<LIVES; life++){
  try{
    T.state=null; T.appScreen="home"; T.rollSetupDraft();
    const scen = pick(T.SCENARIOS);
    T.startGame("Fuzz", pick(["Girl","Boy"]), pick(["Straight","Gay","Bisexual"]),
      Object.assign({scenarioId:scen.id}, scen.setup||{}));

    // Drop the life into a random situation rather than always starting at 0.
    const s = T.state;
    s.age = R(90);
    s.money = pick([0, 500, 25000, 400000, 5000000, -2000]);
    if(Math.random()<0.6){
      const t = pick(T.TRACKS);
      s.career = {kind:"civilian", trackId:t.id, rankIndex:0, yearsInRank:R(10), performance:R(100)};
    } else if(Math.random()<0.4){
      const f = pick(T.FORCES);
      s.career = {kind:"forces", trackId:f.id, isOfficer:Math.random()<0.5, rankIndex:R(4), yearsInRank:R(8), deployed:false, deployedYearsLeft:0, performance:R(100)};
    }
    if(Math.random()<0.6) s.relationship = {id:9001, name:"Partner", gender:pick(["Girl","Boy"]), age:18+R(60), closeness:R(100), alive:true};
    if(Math.random()<0.4) s.married = true;
    for(let i=0;i<R(4);i++){
      const kid = {id:9100+i, name:"Kid"+i, age:R(45), health:R(100), happiness:R(100), smarts:R(100), bond:R(100)};
      if(kid.age>=18) T.launchAdultChild(kid);
      s.children.push(kid);
    }
    for(let i=0;i<R(5);i++) T.addFriend(null, R(100));

    for(let step=0; step<70; step++){
      resolvePrompt();
      if(!T.state || !T.state.alive) break;
      // Replenish the action budget now and then so actions aren't all refused.
      if(T.state && Math.random()<0.3){ T.state.yearlyActivityUses={}; T.state.actionsLeft=6; T.state.pendingActionId=null; }
      const act = pick(ACTIONS);
      try{ act(); fired++; }
      catch(e){ errors.push(`life ${life} step ${step} (age ${T.state?T.state.age:"?"}): ${e && e.message} | ${(e&&e.stack||"").split("\n")[1]||""}`); break; }
      check(`life ${life} step ${step}`);
      // Some actions (opening the perks or museum screen) legitimately clear
      // the live character, so re-check before touching it.
      if(!T.state) break;
      if(Math.random()<0.2){ T.state.pendingChoice=null; T.ageUp(); check(`life ${life} after ageUp`); }
    }

    // Save/restore round trip: a prompt's callbacks can't be serialised, so the
    // game must strip them and still be playable afterwards.
    if(T.state){
      T.doOneNightStand();
      const copy = JSON.parse(JSON.stringify(Object.assign({}, T.state, {pendingChoice:undefined, snapshots:undefined})));
      T.state = copy;
      T.state.pendingChoice = null;
      T.state.snapshots = T.state.snapshots || [];
      T.render();
      T.ageUp();
      check(`life ${life} after restore`);
    }
  }catch(e){
    errors.push(`life ${life} outer: ${e && e.message} | ${(e&&e.stack||"").split("\n")[1]||""}`);
  }
}

console.log(`lives: ${LIVES}, actions fired: ${fired}`);
console.log(`exceptions: ${errors.length}`);
[...new Set(errors)].slice(0,15).forEach(e=>console.log("  ! "+e));
console.log(`invalid states: ${invalid.length}`);
[...new Set(invalid)].slice(0,15).forEach(e=>console.log("  ? "+e));
process.exit(errors.length||invalid.length?1:0);
