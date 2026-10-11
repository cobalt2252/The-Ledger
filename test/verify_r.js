// Behavioural checks for the four new features.
const T = require("./harness.js")(`
  // rent
  collectRent, buyPropertiesBulk, rentOutAllProperties, propertyPrice, propertyUpkeep,
  openAssetsSheet, renderAssetsSheet, get assetsView(){return assetsView;}, set assetsView(v){assetsView=v;},
  // prison
  prisonConduct, nudgeConduct, spendPrisonAction, PRISON_JOBS, PRISON_CRIMES,
  doPrisonJob, doKeepClean, doPrisonSelfImprovement, doPrisonCrime, doPrisonEscape,
  doApplyParole, openActivitySheet, renderActivitySheetContent,
  get activityView(){return activityView;}, set activityView(v){activityView=v;},
  // legacy
  launchAdultChild, tickAdultChild, backfillGrandchildren, startAsChild, die,
  heirShareFor, CHILD_CAREERS, CHILD_EDUCATION,
  // notifications & outcomes
  get notifications(){return notifications;}, set notifications(v){notifications=v;},
  milestone, dismissNotification, clearNotifications, MILESTONE_KINDS, renderNotifications,
  get pendingOutcome(){return pendingOutcome;}, set pendingOutcome(v){pendingOutcome=v;},
  setOutcome, inferVerdict, runOptionWithOutcome, renderOutcomeSheet,
  queueChoice, advanceChoiceQueue, checkRetirementAge, checkPerformanceWarning,
  ageFamilyAndFriends, conceiveChild, doInvestType, addLog, nudge, rand, clamp,
  TRACKS, FORCES, POLITICAL_OFFICES, runForOffice, doAskPromotion, quitJob,
  CRIMES, deliverVerdict, beginArrest,
  RETURN_COURSES, enrolReturnCourse, runStudyingYear, makePerson`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c)pass++; else {console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++;} };
function life(opts){
  T.state=null; T.appScreen="home"; T.rollSetupDraft();
  T.startGame("Test Person","Girl","Straight",Object.assign({scenarioId:"free"},opts||{}));
  T.state.pendingChoice=null; T.notifications=[]; T.pendingOutcome=null; return T.state;
}
function lastSheet(){ return document.body.children[document.body.children.length-1]; }
function logTail(s,n){ return s.log.slice(-n).map(e=>e.text); }

// ===================================================== 1. Rent, summarised
console.log("1. Rent as one summarised line");
{
  const s = life(); s.age=40; s.money=20*T.propertyPrice();
  T.buyPropertiesBulk(20); T.rentOutAllProperties();
  const before = s.log.length;
  T.collectRent();
  const added = s.log.slice(before);
  ok("twenty properties produce one line, not twenty", added.length===1, added.length+" lines");
  const line = added[0].text;
  ok("it states how many were let", /on 20 properties/.test(line), line);
  ok("it states the gross", /£/.test(line));
  ok("maintenance is accounted for", /maintenance|nothing spent on maintenance/.test(line), line);

  // The arithmetic: gross is 6% of value, net is gross minus maintenance.
  const s2 = life(); s2.age=40; s2.money=5*T.propertyPrice();
  T.buyPropertiesBulk(5); T.rentOutAllProperties();
  const cash0 = s2.money;
  T.collectRent();
  const r = s2.rentStats;
  const expectedGross = 5 * Math.round(T.propertyPrice()*0.06);
  ok("gross is 6% of each property", r.lastGross===expectedGross, `${r.lastGross} vs ${expectedGross}`);
  ok("net credited equals gross minus maintenance", s2.money===cash0 + r.lastGross - r.lastMaintenance,
     `${s2.money-cash0} vs ${r.lastGross-r.lastMaintenance}`);
  ok("let count recorded", r.lastLet===5);

  // Running totals accumulate across years.
  for(let y=0;y<10;y++) T.collectRent();
  ok("lifetime gross accumulates", s2.rentStats.lifetimeGross > r.lastGross*8, s2.rentStats.lifetimeGross);
  ok("years counted", s2.rentStats.years===11, s2.rentStats.years);
  ok("lifetime maintenance is tracked separately", s2.rentStats.lifetimeMaintenance >= 0);
  // Nothing let, nothing logged.
  const s3 = life(); s3.age=40; s3.money=T.propertyPrice();
  T.buyPropertiesBulk(1);
  const n0 = s3.log.length; T.collectRent();
  ok("an unlet property logs nothing", s3.log.length===n0);

  // The Property screen shows the summary.
  T.openAssetsSheet(); let ov=lastSheet();
  T.assetsView.screen="property"; T.renderAssetsSheet(ov);
  ok("property screen has no income summary before any rent", ov.innerHTML.includes("No rent collected yet"));
  T.state=s2; T.renderAssetsSheet(ov);
  ok("property screen summarises income", ov.innerHTML.includes("Rental income to date"));
  ok("it shows rent taken", ov.innerHTML.includes("Rent taken"));
  ok("it shows maintenance spend", ov.innerHTML.includes("Spent on maintenance"));
  ok("it shows the net", ov.innerHTML.includes("Net rental income"));
  ok("it shows how many years", /Across 11 years/.test(ov.innerHTML));
}

// ===================================================== 2. Prison
console.log("2. Prison — a short menu with real consequences");
{
  const s = life(); s.age=30; s.prisonYearsLeft=8;
  ok("conduct starts at 50", T.prisonConduct()===50);

  // One action a year.
  s.prisonActionUsed=false;
  T.doKeepClean();
  ok("behaving raises conduct", T.prisonConduct()>50, T.prisonConduct());
  const c1 = T.prisonConduct();
  T.doKeepClean();
  ok("a second action the same year is refused", T.prisonConduct()===c1);
  ok("it says why", /already made your move/i.test(logTail(s,1)[0]));

  // Volunteering pays and helps.
  const s2 = life(); s2.age=30; s2.prisonYearsLeft=5; s2.money=0; s2.prisonActionUsed=false;
  T.doPrisonJob("kitchen");
  ok("kitchen work pays", s2.money>0, s2.money);
  ok("it raises conduct", T.prisonConduct()>50);
  ok("work years counted", s2.prisonWorkYears===1);
  ok("every listed job works", T.PRISON_JOBS.every(j=>{
    const st=life(); st.age=30; st.prisonYearsLeft=5; st.money=0; st.prisonActionUsed=false;
    T.doPrisonJob(j.id);
    return st.money===j.pay && st.prisonWorkYears===1;
  }));
  // The post round, cleaning and cooking are all there, as asked.
  ["kitchen","cleaning","post"].forEach(id=>ok("job available: "+id, T.PRISON_JOBS.some(j=>j.id===id)));

  // Self-improvement.
  const s3 = life(); s3.age=30; s3.prisonYearsLeft=5; s3.prisonActionUsed=false; s3.stats.health=50;
  T.doPrisonSelfImprovement("gym");
  ok("the gym improves health", s3.stats.health>50);
  const s4 = life(); s4.age=30; s4.prisonYearsLeft=5; s4.prisonActionUsed=false; s4.stats.smarts=50;
  T.doPrisonSelfImprovement("course");
  ok("a course improves smarts", s4.stats.smarts>50 && s4.flags.prisonCourse===true);

  // Crime inside: caught means a longer sentence, every time.
  let caught=0, gotAway=0, lengthened=0;
  for(let i=0;i<400;i++){
    const st=life(); st.age=30; st.prisonYearsLeft=5; st.money=5000; st.prisonActionUsed=false;
    const before = st.prisonYearsLeft;
    T.doPrisonCrime("contraband");
    if(st.prisonYearsLeft > before){ caught++; lengthened++; } else gotAway++;
  }
  ok("dealing inside is sometimes caught", caught>60 && caught<220, caught+"/400");
  ok("being caught always lengthens the sentence", lengthened===caught, `${lengthened} of ${caught}`);
  ok("getting away with it happens too", gotAway>150, gotAway);
  ok("every listed crime runs and can lengthen the sentence", T.PRISON_CRIMES.every(c=>{
    let anyLonger=false, anyShorter=false;
    for(let i=0;i<120;i++){
      const st=life(); st.age=30; st.prisonYearsLeft=5; st.money=5000; st.prisonActionUsed=false;
      T.doPrisonCrime(c.id);
      if(st.prisonYearsLeft>5) anyLonger=true; else anyShorter=true;
    }
    return anyLonger && anyShorter;
  }));
  // Repeat offending draws more attention.
  let firstCaught=0, laterCaught=0;
  for(let i=0;i<400;i++){
    const st=life(); st.age=30; st.prisonYearsLeft=20; st.money=9000; st.prisonActionUsed=false;
    T.doPrisonCrime("brew");
    if(st.prisonYearsLeft>20) firstCaught++;
    const st2=life(); st2.age=30; st2.prisonYearsLeft=20; st2.money=9000; st2.prisonOffences=5; st2.prisonActionUsed=false;
    T.doPrisonCrime("brew");
    if(st2.prisonYearsLeft>20) laterCaught++;
  }
  ok("repeat offenders are caught more often", laterCaught > firstCaught + 40, `${firstCaught} first vs ${laterCaught} repeat`);

  // Escape: costs the year's action, and failure is severe.
  let escaped=0, failedExtra=[];
  for(let i=0;i<400;i++){
    const st=life(); st.age=30; st.prisonYearsLeft=6; st.prisonActionUsed=false;
    T.doPrisonEscape();
    if(st.prisonYearsLeft===0 && st.flags.escapedPrison) escaped++;
    else failedExtra.push(st.prisonYearsLeft-6);
  }
  ok("escape sometimes works", escaped>10, escaped+"/400");
  ok("a failed escape adds 2–5 years", failedExtra.every(e=>e>=2 && e<=5), failedExtra.slice(0,5).join(","));
  ok("a failed escape wrecks conduct", (()=>{
    const st=life(); st.age=30; st.prisonYearsLeft=6; st.prisonActionUsed=false; st.prisonConduct=80;
    // Force a failure by exhausting the odds: run until one fails.
    for(let i=0;i<50;i++){
      const s9=life(); s9.age=30; s9.prisonYearsLeft=6; s9.prisonActionUsed=false; s9.prisonConduct=80; s9.stats.smarts=1; s9.stats.health=1;
      T.doPrisonEscape();
      if(s9.prisonYearsLeft>6) return s9.prisonConduct < 80 && s9.flags.triedToEscape===true;
    }
    return false;
  })());

  // Conduct drives parole.
  const paroleRate = (conduct, extras)=>{
    let granted=0;
    for(let i=0;i<600;i++){
      const st=life(); st.age=30; st.prisonYearsLeft=3; st.prisonConduct=conduct;
      st.yearlyActivityUses={}; Object.assign(st.flags, extras||{});
      T.doApplyParole();
      if(st.prisonYearsLeft===0) granted++;
    }
    return granted/600;
  };
  const good = paroleRate(95), bad = paroleRate(10);
  ok("good conduct wins parole far more often", good > bad + 0.3, `95: ${(good*100).toFixed(0)}% vs 10: ${(bad*100).toFixed(0)}%`);
  const clean = paroleRate(70), fought = paroleRate(70, {prisonFight:true});
  ok("a serious incident counts against you", fought < clean - 0.1, `${(clean*100).toFixed(0)}% vs ${(fought*100).toFixed(0)}%`);

  // The nav bar and menu are cut back while inside.
  const s5 = life(); s5.age=30; s5.prisonYearsLeft=4;
  T.render();
  const bar = barEl.innerHTML;
  ok("the nav offers the wing", bar.includes('id="navPrison"') && bar.includes("The Wing"));
  ok("the job tab is gone while inside", !bar.includes('id="navJob"'));
  ok("the age button reads Serve", bar.includes(">Serve<") || bar.includes("Serve"));
  T.openActivitySheet(); let ov2=lastSheet();
  T.activityView.tab="menu"; T.renderActivitySheetContent(ov2);
  ok("the activities menu is cut back", ov2.innerHTML.includes("The Wing"));
  ["Dating","Licences","Mind"].forEach(x=>ok("no "+x+" tab inside", !ov2.innerHTML.includes(`>${x}<`)));
  T.activityView.tab="prison"; T.renderActivitySheetContent(ov2);
  const wing = ov2.innerHTML;
  ok("the wing shows conduct", wing.includes("Conduct:"));
  ok("the wing offers behaving", wing.includes('id="prKeepClean"'));
  ok("the wing offers work", T.PRISON_JOBS.every(j=>wing.includes(`data-prjob="${j.id}"`)));
  ok("the wing offers crime with odds", T.PRISON_CRIMES.every(c=>wing.includes(`data-prcrime="${c.id}"`)) && /% caught/.test(wing));
  ok("the wing offers parole with odds", wing.includes('id="paroleBtn2"') && /% on your record/.test(wing));
  ok("the wing offers escape with the cost stated", wing.includes('id="escapeBtn2"') && /adds 2–5 years/.test(wing));
  s5.prisonActionUsed = true; T.renderActivitySheetContent(ov2);
  ok("once decided, the options are closed off", (ov2.innerHTML.match(/Already decided this year/g)||[]).length >= 3);
}

// ===================================================== 3. Grandchildren carry over
console.log("3. Grandchildren carry over as your children");
{
  // Grandchildren are real people now.
  const s = life(); s.age=50;
  const kid = {id:900,name:"Elin",age:28,health:80,happiness:80,smarts:75,bond:90};
  T.launchAdultChild(kid); kid.partnered=true; kid.partnerName="Gwyn"; s.children=[kid];
  kid.encouraged = { family:true };
  // Hold them inside the fertile window so the test isn't at the mercy of the
  // roll — what's under test is that grandchildren are people, not how many.
  let years=0;
  while((kid.ownChildren||[]).length < 2 && years < 400){ s.age++; kid.age=30; T.tickAdultChild(kid); years++; }
  ok("grandchildren are stored as people", Array.isArray(kid.ownChildren) && kid.ownChildren.length>=2, JSON.stringify(kid.ownChildren&&kid.ownChildren.length));
  ok("each has a name", kid.ownChildren.every(g=>typeof g.name==="string" && g.name.length));
  ok("each has an age", kid.ownChildren.every(g=>Number.isFinite(g.age)));
  ok("each has stats", kid.ownChildren.every(g=>Number.isFinite(g.health)&&Number.isFinite(g.happiness)&&Number.isFinite(g.smarts)));
  ok("the count still matches for display", kid.grandchildren===kid.ownChildren.length);
  ok("they age too", (()=>{ const a0=kid.ownChildren[0].age; s.age++; T.tickAdultChild(kid); return kid.ownChildren[0].age===a0+1; })());

  // THE BUG: continuing as that child must bring them with you.
  const names = kid.ownChildren.map(g=>g.name);
  const ages = kid.ownChildren.map(g=>g.age);
  s.money = 100000;
  T.die("a test");
  T.startAsChild(900);
  const n = T.state;
  ok("continued as the child", n.name.startsWith("Elin"));
  ok("their children came with them", n.children.length===names.length, `${n.children.length} vs ${names.length}`);
  ok("by name", n.children.map(c=>c.name).join(",")===names.join(","), n.children.map(c=>c.name).join(","));
  ok("and at the right ages", n.children.map(c=>c.age).join(",")===ages.join(","));
  ok("their partner came too", n.relationship && n.relationship.name==="Gwyn" && n.married===true);
  ok("generation advanced", (n.generation||1)===2);
  ok("the log says who came with them", s.log.concat(n.log).some(e=>/come with you|comes with you/.test(e.text)));

  // An heir with no children still works.
  const s2 = life(); s2.age=50;
  const kid2 = {id:901,name:"Solo",age:25,health:70,happiness:70,smarts:60,bond:50};
  T.launchAdultChild(kid2); s2.children=[kid2];
  T.die("a test"); T.startAsChild(901);
  ok("an heir with no children starts childless", T.state.children.length===0);
  ok("and unattached", T.state.relationship===null && T.state.married===false);

  // A grandchild who is already an adult arrives with a life of their own.
  const s3 = life(); s3.age=70;
  const kid3 = {id:902,name:"Mair",age:45,health:70,happiness:70,smarts:70,bond:70};
  T.launchAdultChild(kid3);
  kid3.ownChildren=[{id:903,name:"Grown",gender:"Boy",age:24,health:70,happiness:70,smarts:70,bond:60}];
  kid3.grandchildren=1; s3.children=[kid3];
  T.die("a test"); T.startAsChild(902);
  const grown = T.state.children[0];
  ok("a grown grandchild arrives", grown && grown.name==="Grown");
  ok("and is marked adult", grown.adult===true);
  ok("with an education", !!grown.educationLabel, grown.educationLabel);
  ok("and work", !!grown.careerLabel, grown.careerLabel);

  // An older save holding only a count is backfilled rather than lost.
  const s4 = life(); s4.age=60;
  const legacy = {id:904,name:"Old",age:35,health:70,happiness:70,smarts:70,bond:70};
  T.launchAdultChild(legacy);
  legacy.grandchildren = 3; legacy.ownChildren = undefined;   // as an old save would be
  s4.children=[legacy];
  T.backfillGrandchildren(legacy);
  ok("a bare count is turned into people", (legacy.ownChildren||[]).length===3, (legacy.ownChildren||[]).length);
  ok("with plausible ages", legacy.ownChildren.every(g=>g.age>=0 && g.age <= legacy.age-18), legacy.ownChildren.map(g=>g.age).join(","));
  T.die("a test"); T.startAsChild(904);
  ok("and they carry over", T.state.children.length===3);
  // The death screen tells you what an heir brings.
  const s5 = life(); s5.age=70;
  const kid5 = {id:905,name:"Bess",age:40,health:70,happiness:70,smarts:70,bond:70};
  T.launchAdultChild(kid5);
  kid5.ownChildren=[{id:906,name:"Twm",gender:"Boy",age:9,health:70,happiness:70,smarts:60,bond:50}];
  kid5.grandchildren=1; s5.children=[kid5];
  T.die("a test"); T.render();
  ok("the death screen names what the heir brings", /Brings 1 child of their own: Twm \(9\)/.test(appEl.innerHTML));
}

// ===================================================== 4. Outcomes & milestones
console.log("4. Outcome panels and milestone notifications");
{
  // Verdict inference from what an effect logged.
  const s = life(); s.age=30; s.money=10000;
  const verdictOf = (fn)=>{
    const st = life(); st.age=30; st.money=10000;
    const choice = { title:"T", text:"t", options:[{label:"Do it", effect:fn}] };
    st.pendingChoice = choice;
    return T.runOptionWithOutcome(choice, 0);
  };
  ok("a win reads as success", verdictOf(()=>T.addLog("Asked for a raise and got it")).verdict==="success");
  ok("a refusal reads as failure", verdictOf(()=>T.addLog("Asked for a raise and was turned down")).verdict==="fail");
  ok("being caught reads as failure", verdictOf(()=>T.addLog("Caught shoplifting")).verdict==="fail");
  ok("silence reads as neutral", verdictOf(()=>{}).verdict==="neutral");
  ok("an explicit verdict wins", verdictOf(()=>{ T.setOutcome("fail","Hand-set"); T.addLog("Won the lot"); }).verdict==="fail");
  ok("an explicit headline is kept", verdictOf(()=>{ T.setOutcome("fail","Hand-set"); }).headline==="Hand-set");

  // The outcome records what changed.
  const o = verdictOf(()=>{ T.nudge("happiness", 7); T.addLog("Spent £500"); T.state.money -= 500; });
  ok("money movement is captured", o.moneyDelta===-500, o.moneyDelta);
  ok("stat movement is captured", o.deltas.happiness>0, JSON.stringify(o.deltas));
  ok("the chosen option is recorded", o.chose==="Do it");
  ok("the log lines are carried into the panel", o.lines.some(t=>/Spent £500/.test(t)));
  ok("news lines are excluded", (()=>{
    const r = verdictOf(()=>{ T.addLog("A headline", false, true); T.addLog("The real thing"); });
    return r.lines.length===1 && r.lines[0]==="The real thing";
  })());

  // The panel shows, and holds the next decision back until dismissed.
  {
    const st = life(); st.age=30;
    const first = { title:"First", text:"t", options:[{label:"go", effect:()=>{
      T.addLog("It worked");
      T.queueChoice({ title:"Second", text:"t", options:[{label:"ok", effect:()=>{}}] });
    }}]};
    st.pendingChoice = first;
    T.runOptionWithOutcome(first, 0);
    ok("an outcome is waiting", !!T.pendingOutcome);
    ok("the chained decision is held, not lost", !!st.pendingChoice && st.pendingChoice.title==="Second");
    T.render();
    const sheet = lastSheet().innerHTML;
    // The outcome takes the screen even though a decision is already waiting.
    ok("the outcome renders ahead of the waiting decision", /outcome-ic/.test(sheet) && !/Second/.test(sheet));
    ok("the panel has a continue button", sheet.includes('id="outcomeOkBtn"'));
    // Dismissing reveals it.
    T.pendingOutcome = null; T.advanceChoiceQueue(); T.render();
    ok("dismissing reveals the next decision", lastSheet().innerHTML.includes("Second"));
  }
  // Success and failure render differently.
  {
    const st = life(); st.age=30;
    T.pendingOutcome = { title:"T", chose:"c", verdict:"success", headline:null, lines:["good"], moneyDelta:100, deltas:{happiness:3} };
    T.render();
    ok("success shows a tick", lastSheet().innerHTML.includes("✓"));
    T.pendingOutcome = { title:"T", chose:"c", verdict:"fail", headline:null, lines:["bad"], moneyDelta:-100, deltas:{} };
    T.render();
    ok("failure shows a cross", lastSheet().innerHTML.includes("✕"));
    ok("failure says so", /didn't go to plan/.test(lastSheet().innerHTML));
    T.pendingOutcome = null;
  }

  // Milestones.
  {
    const st = life(); st.age=30;
    T.notifications = [];
    T.milestone("hired", "Hired as a nurse.");
    ok("a milestone is queued", T.notifications.length===1);
    ok("it carries an icon and label", T.notifications[0].icon && T.notifications[0].label==="New job");
    ok("it is also logged", st.log[st.log.length-1].text==="Hired as a nurse." && st.log[st.log.length-1].stamp===true);
    ok("bad news is toned accordingly", (T.milestone("fired","Sacked."), T.notifications[1].tone==="bad"));
    ok("it renders as a toast", (T.render(), /class="notif/.test(appEl.innerHTML)));
    ok("the toast text appears", appEl.innerHTML.includes("Hired as a nurse."));
    T.dismissNotification(T.notifications[0].id);
    ok("a toast can be dismissed", T.notifications.length===1);
    T.clearNotifications();
    ok("all can be cleared", T.notifications.length===0);
    // The stack is bounded.
    for(let i=0;i<20;i++) T.milestone("milestone","n"+i);
    ok("the stack is capped", T.notifications.length<=6, T.notifications.length);
  }

  // Every milestone the user listed must actually fire in play.
  {
    const fired = new Set();
    const watch = (st)=>{ T.notifications.forEach(n=>fired.add(n.kind)); T.notifications=[]; };

    // hired / promoted / fired
    for(let i=0;i<300 && !(fired.has("hired")&&fired.has("promoted")&&fired.has("fired"));i++){
      const st=life(); st.age=30; T.notifications=[];
      st.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:9,performance:95};
      T.doAskPromotion(); watch(st);
      st.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:3,performance:5};
      T.checkPerformanceWarning("Dev"); T.checkPerformanceWarning("Dev"); watch(st);
    }
    // elected
    for(let i=0;i<200 && !fired.has("hired");i++){
      const st=life(); st.age=40; st.money=100000; st.stats.smarts=90; T.notifications=[];
      // The political ladder now starts a rung lower than it used to.
      T.runForOffice("parish"); watch(st);
    }
    // child
    { const st=life(); st.age=30; T.notifications=[]; T.conceiveChild(); watch(st); }
    // grandchild
    { const st=life(); st.age=50; T.notifications=[];
      const k={id:1,name:"K",age:22,health:80,happiness:80,smarts:70,bond:95};
      T.launchAdultChild(k); k.partnered=true; k.partnerName="P"; st.children=[k];
      for(let y=0;y<80 && !fired.has("grandchild");y++){ st.age++; k.age++; T.tickAdultChild(k); watch(st); }
    }
    // enrolled / graduated
    { const st=life(); st.age=40; T.notifications=[];
      T.enrolReturnCourse(T.RETURN_COURSES[1], null, "loan"); watch(st);
      for(let y=0;y<4;y++){ st.age++; T.runStudyingYear(); watch(st); }
    }
    // sentenced — through the court flow, pleading guilty to something serious
    for(let i=0;i<200 && !fired.has("sentenced");i++){
      const st=life(); st.age=30; T.notifications=[];
      const serious = T.CRIMES.filter(c=>c.jailYears && c.jailYears[1] >= 3);
      T.deliverVerdict(serious[serious.length-1], 0, { plea:"guilty", lawyer:false });
      watch(st);
    }
    // released — serving out the last year
    for(let i=0;i<200 && !fired.has("released");i++){
      const st=life(); st.age=30; st.prisonYearsLeft=1; T.notifications=[];
      st.pendingChoice=null; T.ageUp(); watch(st);
    }
    // retirement age
    { const st=life(); st.age=66; T.notifications=[]; T.checkRetirementAge(); watch(st); }
    // bereaved
    { for(let i=0;i<60 && !fired.has("bereaved");i++){
        const st=life(); st.age=50; T.notifications=[];
        st.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{p.alive=true;p.age=200;});
        for(let y=0;y<6;y++){ st.pendingChoice=null; T.ageFamilyAndFriends(); watch(st); }
      } }

    ["hired","promoted","fired","child","grandchild","enrolled","graduated","sentenced","released","retired","bereaved"]
      .forEach(k=>ok("milestone fires in play: "+k, fired.has(k), [...fired].join(",")));
  }
  // Milestones don't survive into a new life.
  {
    const st = life(); T.milestone("hired","x");
    life();
    ok("notifications reset between lives", T.notifications.length===0);
  }
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
