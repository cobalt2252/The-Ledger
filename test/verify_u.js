// Each God Mode control is now its own perk. These checks confirm the gating
// holds in both directions: locked controls neither appear nor leak a value,
// and unlocked ones work.
const T = require("./harness.js")(`
  PERKS, PERK_BRANCHES, perkById, hasPerk, perksOwned, xpAvailable, buyPerk, respecPerks,
  GOD_PERKS, godPerksOwned, nobilityAllowed, rollSexuality, lockedNote,
  NOBILITY_RANKS, ERAS, eraById, CONTINENTS, countriesIn, BIRTHPLACES, COUNTRIES,
  SCENARIOS, renderSetup, renderPerksScreen, rollSetupDraft,
  get setupDraft(){return setupDraft;}, set setupDraft(v){setupDraft=v;},
  get perksReturnTo(){return perksReturnTo;}, set perksReturnTo(v){perksReturnTo=v;},
  emptyMuseum, levelFromXp, titlePrefix, rollBirthplace, continentOf`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c)pass++; else {console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++;} };
function resetMeta(){
  T.meta.xp=0; T.meta.xpSpent=0; T.meta.perks=[]; T.meta.lives=[];
  T.meta.difficulty="normal"; T.meta.museum=T.emptyMuseum();
  T.meta.localCurrency=true; T.meta.showGbp=true;
}
// Renders Create a Life with God Mode open and returns the markup.
function createScreen(){
  ["startBtn","firstNameInput","lastNameInput","toPerksBtn"].forEach(id=>{ reg[id] = new FakeEl(); });
  T.rollSetupDraft();
  T.setupDraft.advOpen = true;
  T.state=null; T.appScreen="create"; T.render();
  return appEl.innerHTML;
}
// Presses Begin My Life and returns the resulting character. The harness hands
// out a throwaway element for an unregistered id, so the ids the screen wires
// up have to be registered before rendering for the click to reach the game.
function begin(){
  ["startBtn","firstNameInput","lastNameInput","toPerksBtn"].forEach(id=>{ reg[id] = new FakeEl(); });
  reg.firstNameInput.value = "Test";
  reg.lastNameInput.value = "Person";
  T.state=null; T.appScreen="create"; T.render();
  reg.startBtn.click();
  return T.state;
}

// ===================================================== 1. The branch itself
console.log("1. A God Mode branch in the perk tree");
{
  resetMeta();
  ok("there is a God Mode branch", T.PERK_BRANCHES.some(b=>b.id==="god"));
  const godPerks = T.PERKS.filter(p=>p.branch==="god");
  ok("six God Mode perks", godPerks.length===6, godPerks.length);
  ok("GOD_PERKS lists them all", T.GOD_PERKS.length===6 &&
     T.GOD_PERKS.every(id=>godPerks.some(p=>p.id===id)), T.GOD_PERKS.join(","));
  ok("one per control", ["god_sexuality","era_choice","god_birthplace","god_wealth","god_nobility","god_royalty"]
     .every(id=>T.GOD_PERKS.includes(id)));
  ok("every one has a cost and a level", godPerks.every(p=>p.cost>0 && p.level>=1));
  ok("they rise in price", (()=>{
    const order = ["god_sexuality","era_choice","god_birthplace","god_wealth","god_nobility","god_royalty"];
    const costs = order.map(id=>T.perkById(id).cost);
    return costs.every((c,i)=>i===0 || c > costs[i-1]);
  })(), T.GOD_PERKS.map(id=>T.perkById(id).cost).join(","));
  ok("they rise in level requirement", (()=>{
    const order = ["god_sexuality","era_choice","god_birthplace","god_wealth","god_nobility","god_royalty"];
    const lv = order.map(id=>T.perkById(id).level);
    return lv.every((c,i)=>i===0 || c >= lv[i-1]);
  })());
  ok("the cheapest is reachable at level 1", T.perkById("god_sexuality").level===1);
  ok("the throne is the dearest", T.perkById("god_royalty").cost === Math.max(...godPerks.map(p=>p.cost)));
  ok("none owned to start", T.godPerksOwned()===0);
  // Pick Your Decade kept its old id so existing accounts don't lose it.
  ok("Pick Your Decade kept its id", !!T.perkById("era_choice"));
  ok("and moved into the God Mode branch", T.perkById("era_choice").branch==="god");
  // The perks screen renders the branch.
  T.meta.xp = 2000;
  T.state=null; T.appScreen="perks"; T.render();
  const ps = appEl.innerHTML;
  ok("the perks screen shows the branch", ps.includes("God Mode"));
  ok("and every God Mode perk", T.GOD_PERKS.every(id=>ps.includes(T.perkById(id).name)));
}

// ===================================================== 2. Locked by default
console.log("2. Locked until earned");
{
  resetMeta();
  const c = createScreen();
  ok("God Mode section is still there", c.includes('id="advBtn"') && c.includes("God Mode"));
  ok("it says how many are unlocked", /0\/6 unlocked/.test(c));
  ok("it explains they're earned", /earned with XP/.test(c));
  // No control is rendered.
  ok("no sexuality control", !c.includes('id="sexSeg"'));
  ok("no wealth control", !c.includes('id="wealthSeg"'));
  ok("no nobility control", !c.includes('id="nobList2"'));
  ok("no birthplace control", !c.includes('id="bpContGrid"') && !c.includes('id="bpGrid"'));
  ok("no era control", !c.includes('id="eraList"'));
  // Each names its perk and cost instead.
  T.GOD_PERKS.forEach(id=>{
    const p = T.perkById(id);
    if(id === "god_royalty") return;   // only shown once nobility is unlocked
    ok("locked note names "+p.name, c.includes(p.name), p.name);
  });
  ok("locked notes quote a cost", /XP — from the Perks screen|XP, from the Perks screen|XP/.test(c));
  ok("there's a route to the perks screen", c.includes('id="toPerksBtn"'));
  // A locked heading must not promise a value the roll won't honour.
  ok("sexuality shows no promise", /Sexuality — rolled at birth/.test(c));
  ok("birthplace shows no promise", /Birthplace — rolled at birth/.test(c));
  ok("wealth shows no promise", /Wealth class — rolled at birth/.test(c));
  ok("era shows no promise", /Decade of birth — rolled at birth/.test(c));
  ok("nobility reads commoner", /Nobility — Commoner/.test(c));
}

// ===================================================== 3. Nothing leaks
console.log("3. A locked control can't set anything");
{
  // Rerolling must not become a way of choosing a locked attribute: the drafted
  // value has to be ignored entirely when the perk isn't held.
  resetMeta();
  { // Force an extreme draft, then begin — the outcome must not match it.
    let matched = 0, runs = 300;
    for(let i=0;i<runs;i++){
      T.rollSetupDraft();
      T.setupDraft.advOpen = true;
      T.setupDraft.wealthClass = "rich";
      T.setupDraft.nobility = "royal";
      T.setupDraft.birthplace = "Monaco";
      T.setupDraft.eraId = "2010s";
      T.setupDraft.sexuality = "Bisexual";
      const s = begin();
      if(s.wealthTier === "rich" && s.nobility === "royal" && s.birthplace === "Monaco") matched++;
    }
    ok("a locked draft never dictates the outcome", matched === 0, matched+"/"+runs);
  }
  { // Specifically: nobility stays commoner.
    let royal = 0;
    for(let i=0;i<200;i++){
      T.rollSetupDraft(); T.setupDraft.nobility = "royal"; T.setupDraft.advOpen = true;
      const s = begin();
      if(s.nobility !== "commoner") royal++;
    }
    ok("nobility is locked to commoner", royal===0, royal+"/200");
  }
  { // Wealth is still rolled across all three tiers.
    const tiers = {};
    for(let i=0;i<300;i++){
      T.rollSetupDraft(); T.setupDraft.wealthClass = "rich";
      const s = begin();
      tiers[s.wealthTier] = (tiers[s.wealthTier]||0)+1;
    }
    ok("wealth is genuinely rolled", Object.keys(tiers).length===3, JSON.stringify(tiers));
    ok("and isn't all rich", (tiers.rich||0) < 150, JSON.stringify(tiers));
  }
  { // Birthplace still follows the weighted roll, not the draft.
    let monaco = 0, uk = 0;
    for(let i=0;i<400;i++){
      T.rollSetupDraft(); T.setupDraft.birthplace = "Monaco";
      const s = begin();
      if(s.birthplace === "Monaco") monaco++;
      if(["England","Scotland","Wales","Northern Ireland"].includes(s.birthplace)) uk++;
    }
    ok("birthplace isn't taken from the draft", monaco < 20, monaco+"/400");
    ok("the weighted roll still applies", uk > 180, uk+"/400");
  }
  { // Era is still rolled across the decades.
    const eras = {};
    for(let i=0;i<400;i++){
      T.rollSetupDraft(); T.setupDraft.eraId = "2010s";
      const s = begin();
      eras[s.eraId] = (eras[s.eraId]||0)+1;
    }
    ok("era is genuinely rolled", Object.keys(eras).length >= 6, Object.keys(eras).length+" decades seen");
  }
  { // Sexuality is rolled, not taken from the draft.
    const sex = {};
    for(let i=0;i<400;i++){
      T.rollSetupDraft(); T.setupDraft.sexuality = "Gay";
      const s = begin();
      sex[s.sexuality] = (sex[s.sexuality]||0)+1;
    }
    ok("sexuality is genuinely rolled", Object.keys(sex).length===3, JSON.stringify(sex));
    ok("and is mostly straight, as the roll weights it", (sex.Straight||0) > 200, JSON.stringify(sex));
  }
}

// ===================================================== 4. Each unlock works
console.log("4. Each perk opens exactly its own control");
{
  // Sexuality
  resetMeta(); T.meta.xp = 500000; T.buyPerk("god_sexuality");
  { const c = createScreen();
    ok("sexuality control appears", c.includes('id="sexSeg"'));
    ok("and nothing else does", !c.includes('id="wealthSeg"') && !c.includes('id="nobList2"') &&
       !c.includes('id="eraList"') && !c.includes('id="bpContGrid"'));
    ok("the heading shows the choice", new RegExp("Sexuality — "+T.setupDraft.sexuality).test(c));
    ok("1/6 unlocked", /1\/6 unlocked/.test(c));
    let got = 0;
    for(let i=0;i<60;i++){
      T.rollSetupDraft(); T.setupDraft.sexuality = "Gay";
      if(begin().sexuality === "Gay") got++;
    }
    ok("the choice is honoured", got===60, got+"/60");
  }
  // Era
  resetMeta(); T.meta.xp = 500000; T.buyPerk("era_choice");
  { const c = createScreen();
    ok("era control appears", c.includes('id="eraList"'));
    ok("every decade is listed", T.ERAS.every(e=>c.includes(e.label)));
    let got = 0;
    for(let i=0;i<40;i++){
      T.rollSetupDraft(); T.setupDraft.eraId = "1940s";
      if(begin().eraId === "1940s") got++;
    }
    ok("the decade is honoured", got===40, got+"/40");
  }
  // Birthplace
  resetMeta(); T.meta.xp = 500000; T.buyPerk("god_birthplace");
  { const c = createScreen();
    ok("birthplace control appears", c.includes('id="bpContGrid"'));
    ok("continents are listed", T.CONTINENTS.every(x=>c.includes(`data-bpcont="${x}"`)));
    T.setupDraft.bpContinent = "Asia"; T.state=null; T.render();
    ok("drilling in lists countries", T.countriesIn("Asia").every(x=>appEl.innerHTML.includes(`data-bp="${x.name}"`)));
    let got = 0;
    for(let i=0;i<40;i++){
      T.rollSetupDraft(); T.setupDraft.birthplace = "Japan";
      if(begin().birthplace === "Japan") got++;
    }
    ok("the country is honoured", got===40, got+"/40");
  }
  // Wealth
  resetMeta(); T.meta.xp = 500000; T.buyPerk("god_wealth");
  { const c = createScreen();
    ok("wealth control appears", c.includes('id="wealthSeg"'));
    ["poor","middle","rich"].forEach(w=>{
      let got = 0;
      for(let i=0;i<30;i++){
        T.rollSetupDraft(); T.setupDraft.wealthClass = w;
        if(begin().wealthTier === w) got++;
      }
      ok("wealth honoured: "+w, got===30, got+"/30");
    });
  }
  // Nobility, without royalty
  resetMeta(); T.meta.xp = 500000; T.buyPerk("god_nobility");
  { const c = createScreen();
    ok("nobility control appears", c.includes('id="nobList2"'));
    T.NOBILITY_RANKS.filter(r=>!r.canInheritThrone).forEach(r=>
      ok("rank offered: "+r.id, c.includes(`data-nb="${r.id}"`)));
    ok("royal rank is not offered", !c.includes('data-nb="royal"'));
    ok("and the throne perk is named", c.includes(T.perkById("god_royalty").name));
    ok("nobilityAllowed caps at duke", T.nobilityAllowed("royal")==="duke");
    ok("other ranks pass through", T.nobilityAllowed("earl")==="earl" && T.nobilityAllowed("commoner")==="commoner");
    ok("a nonsense rank falls back", T.nobilityAllowed("emperor")==="commoner");
    let got = 0;
    for(let i=0;i<40;i++){
      T.rollSetupDraft(); T.setupDraft.nobility = "duke";
      if(begin().nobility === "duke") got++;
    }
    ok("a duke is honoured", got===40, got+"/40");
    // Asking for royal without the perk lands on duke, not royal.
    let royal = 0, duke = 0;
    for(let i=0;i<60;i++){
      T.rollSetupDraft(); T.setupDraft.nobility = "royal";
      const s = begin();
      if(s.nobility === "royal") royal++;
      if(s.nobility === "duke") duke++;
    }
    ok("royal is downgraded, not granted", royal===0 && duke===60, `royal ${royal}, duke ${duke}`);
  }
  // Royalty
  resetMeta(); T.meta.xp = 500000; T.buyPerk("god_nobility"); T.buyPerk("god_royalty");
  { const c = createScreen();
    ok("the royal rank is offered", c.includes('data-nb="royal"'));
    ok("the throne note is gone", !c.includes("held back a little longer"));
    ok("nobilityAllowed permits royal", T.nobilityAllowed("royal")==="royal");
    let got = 0, wealthy = 0;
    for(let i=0;i<40;i++){
      T.rollSetupDraft(); T.setupDraft.nobility = "royal";
      const s = begin();
      if(s.nobility === "royal") got++;
      if(s.wealthTier === "rich") wealthy++;
    }
    ok("royalty is honoured", got===40, got+"/40");
    ok("and always starts wealthy", wealthy===40, wealthy+"/40");
    ok("with a title", (()=>{ T.rollSetupDraft(); T.setupDraft.nobility="royal"; const s=begin();
      return ["Prince","Princess"].includes(T.titlePrefix()); })(), T.titlePrefix());
  }
  // All six: everything is open and the prompt to buy more is gone.
  resetMeta(); T.meta.xp = 500000; T.GOD_PERKS.forEach(id=>T.buyPerk(id));
  { const c = createScreen();
    ok("all six unlocked", T.godPerksOwned()===6);
    ok("every control is present", ["sexSeg","wealthSeg","nobList2","eraList","bpContGrid"]
       .every(id=>c.includes(`id="${id}"`)), ["sexSeg","wealthSeg","nobList2","eraList","bpContGrid"].filter(id=>!c.includes(`id="${id}"`)).join(","));
    ok("6/6 shown", /6\/6 unlocked/.test(c));
    ok("the buy prompt is gone", !c.includes('id="toPerksBtn"'));
    ok("and the explainer is gone", !/earned with XP/.test(c));
  }
}

// ===================================================== 5. Scenarios override
console.log("5. Scenarios still grant what they need");
{
  // A scenario's conditions must apply whether or not the matching perk is held
  // — otherwise Rags to Riches and The Squandered Crown would stop working.
  resetMeta();
  { let poor = 0;
    for(let i=0;i<60;i++){
      T.rollSetupDraft(); T.setupDraft.scenarioId = "rags"; T.setupDraft.wealthClass = "rich";
      if(begin().wealthTier === "poor") poor++;
    }
    ok("Rags to Riches still starts you poor without the perk", poor===60, poor+"/60");
  }
  { let royal = 0;
    for(let i=0;i<60;i++){
      T.rollSetupDraft(); T.setupDraft.scenarioId = "heir";
      if(begin().nobility === "royal") royal++;
    }
    ok("The Squandered Crown still starts you royal without the perk", royal===60, royal+"/60");
  }
  { let record = 0;
    for(let i=0;i<60;i++){
      T.rollSetupDraft(); T.setupDraft.scenarioId = "redemption";
      if(begin().flags.criminalRecord) record++;
    }
    ok("Second Chance still gives you a record", record===60, record+"/60");
  }
  // And a scenario beats an unlocked God Mode choice too.
  T.meta.xp = 500000; T.GOD_PERKS.forEach(id=>T.buyPerk(id));
  { let poor = 0;
    for(let i=0;i<60;i++){
      T.rollSetupDraft(); T.setupDraft.scenarioId = "rags"; T.setupDraft.wealthClass = "rich";
      if(begin().wealthTier === "poor") poor++;
    }
    ok("a scenario overrides an unlocked choice", poor===60, poor+"/60");
  }
}

// ===================================================== 6. Refunds and routing
console.log("6. Refunds, and getting back to where you were");
{
  resetMeta(); T.meta.xp = 500000;
  T.GOD_PERKS.forEach(id=>T.buyPerk(id));
  ok("six held", T.godPerksOwned()===6);
  T.respecPerks();
  ok("a refund locks them all again", T.godPerksOwned()===0);
  ok("and the XP comes back", T.xpAvailable()===500000);
  { const c = createScreen();
    ok("the controls are gone again", !c.includes('id="sexSeg"') && !c.includes('id="nobList2"'));
  }
  // A royal draft left over after a refund can't sneak through.
  { T.rollSetupDraft(); T.setupDraft.nobility = "royal";
    ok("a stale royal draft is ignored after a refund", begin().nobility==="commoner");
  }
  // Routing: from Create a Life, the Perks screen goes back to Create.
  resetMeta(); T.meta.xp = 2000;
  T.perksReturnTo = "home";
  createScreen();
  reg.toPerksBtn.click();
  ok("the button opens the perks screen", T.appScreen==="perks");
  ok("and remembers where it came from", T.perksReturnTo==="create");
  T.render();
  ok("the back arrow points at create", appEl.innerHTML.includes('data-goto="create"'));
  // From home, it goes back home.
  T.state=null; T.appScreen="home"; T.render();
  ok("visiting home resets the return", T.perksReturnTo==="home");
  T.appScreen="perks"; T.render();
  ok("the back arrow points home", appEl.innerHTML.includes('data-goto="home"'));
  // The draft survives the round trip, so an unlock can be used at once.
  resetMeta(); T.meta.xp = 500000;
  T.rollSetupDraft();
  T.setupDraft.firstName = "Keep"; T.setupDraft.advOpen = true;
  T.appScreen="perks"; T.render();
  T.appScreen="create"; T.render();
  ok("the draft survives the trip", T.setupDraft.firstName==="Keep");
  ok("and God Mode is still open", T.setupDraft.advOpen===true);
}

resetMeta();
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
