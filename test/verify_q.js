// Behavioural checks for the six new features.
const T = require("./harness.js")(`
  // casino
  resolveStake, stakeEntryHtml, casinoNet, recordCasinoResult, casinoBiggestWin, checkCasinoBan,
  isBannedFromCasino, CASINO_BAN_THRESHOLD, doSlots, startBlackjackHand, settleBlackjack,
  openCasinoSheet, renderCasinoSheet, get casinoView(){return casinoView;}, set casinoView(v){casinoView=v;},
  get bj(){return bj;}, set bj(v){bj=v;}, parseAmount,
  // marriage
  ENGAGEMENT_RINGS, WEDDING_VENUES, HONEYMOONS, canPropose, proposeReadyReason,
  proposalChance, openProposalFlow, doPropose, openWeddingPlanner, finaliseMarriage,
  openPrenupChoice, openHoneymoonChoice, doBreakup,
  // ending early
  endLedgerEarly, die, startAsChild,
  // work
  PERFORMANCE_WARNING, PERFORMANCE_DISMISSAL, checkPerformanceWarning, jobPerformance,
  nudgePerformance, doWorkHarder, doSlackOff, quitJob, doAskPromotion,
  politicalApproval, nudgeApproval, doPoliticalEffort, resignOffice, runPoliticsYear,
  POLITICAL_OFFICES, TRACKS, FORCES, runCareerYear,
  // people
  npcDeathChance, npcDeathCause, plausibleAgeFor, ensurePersonAge, makePerson,
  ageFamilyAndFriends, addFriend,
  // education
  RETURN_COURSES, availableReturnCourses, scholarshipChance, canAskParentsForFees,
  parentFeesChance, openReturnToEducation, openFundingChoice, enrolReturnCourse,
  runStudyingYear, doDropStudying, DEGREE_OPTIONS, POSTGRAD_COURSES, doStartPostgrad,
  // plumbing
  openCareerSheet, renderCareerSheetContent, get careerView(){return careerView;}, set careerView(v){careerView=v;},
  openActivitySheet, renderActivitySheetContent, get activityView(){return activityView;}, set activityView(v){activityView=v;},
  openPeopleSheet, renderPeopleSheetContent, get peopleView(){return peopleView;}, set peopleView(v){peopleView=v;},
  openSettingsSheet, clamp, rand`);

let pass=0, fail=0;
function ok(l,c,x){ if(c){pass++;} else {console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++;} }
function life(opts){
  T.state=null; T.appScreen="home"; T.rollSetupDraft();
  T.startGame("Test Person","Girl","Straight",Object.assign({scenarioId:"free"},opts||{}));
  T.state.pendingChoice=null; return T.state;
}
function choose(m){
  const pc=T.state.pendingChoice; if(!pc) return false;
  const o=pc.options.find(x=>x.label.toLowerCase().includes(m.toLowerCase()));
  T.state.pendingChoice=null; if(!o) return false; o.effect(); return true;
}
function lastSheet(){ return document.body.children[document.body.children.length-1]; }

// ===================================================== 1. Casino
console.log("1. Casino — any stake, and being shown the door");
{
  const s = life(); s.age=30; s.money=12345;
  ok("stake parses plain", T.resolveStake("500")===500);
  ok("stake parses k", T.resolveStake("2.5k")===2500);
  ok("stake 'all' is the whole balance", T.resolveStake("all")===12345);
  ok("stake is capped at the balance", T.resolveStake("999999")===12345);
  ok("nonsense stake is rejected", !Number.isFinite(T.resolveStake("abc")) && !Number.isFinite(T.resolveStake("")));
  ok("zero and negatives rejected", !Number.isFinite(T.resolveStake("0")) && !Number.isFinite(T.resolveStake("-5")));

  // An arbitrary stake really is taken, and a huge one works.
  s.money=1000000; T.startBlackjackHand(750000);
  // The stake leaves the balance at once; a natural blackjack may then pay out
  // in the same call, so check the stake was taken rather than the end balance.
  ok("a £750,000 hand is dealt", T.bj && T.bj.bet===750000, T.bj && T.bj.bet);
  ok("the stake left the balance", s.money <= 250000 || T.bj.result==="blackjack", s.money);
  // Slots take any stake too.
  const s2 = life(); s2.age=30; s2.money=50000;
  T.doSlots(37500);
  ok("slots accept an odd stake", s2.money <= 12500 + 37500*50, s2.money);
  T.doSlots(0);
  const before = s2.money; T.doSlots(NaN);
  ok("invalid slot stakes are refused", s2.money===before);

  // The ban: win past the threshold and you're out.
  // The ban is for one enormous win, not a lifetime's grinding.
  const s3 = life(); s3.age=30; s3.money=100;
  ok("not banned to start", !T.isBannedFromCasino());
  T.recordCasinoResult(T.CASINO_BAN_THRESHOLD - 1);
  ok("not banned just under the line", !T.checkCasinoBan() && !T.isBannedFromCasino());
  T.recordCasinoResult(T.CASINO_BAN_THRESHOLD);
  const banned = T.checkCasinoBan();
  ok("banned by one win over the line", banned && T.isBannedFromCasino());
  ok("the ban is a prompt, not a silent flag", !!s3.pendingChoice && /management/i.test(s3.pendingChoice.title));
  choose("Take the winnings");
  ok("beatTheHouse recorded", s3.flags.beatTheHouse===true);
  // And the tables are genuinely closed.
  s3.money = 1000;
  T.doSlots(100);
  ok("slots refuse a barred player", s3.money===1000);
  T.startBlackjackHand(100);
  ok("blackjack refuses a barred player", s3.money===1000);
  ok("ban does not fire twice", !T.checkCasinoBan());
  // A lifetime of ordinary wins adds up past the threshold and is left alone:
  // the house minds one payout it cannot absorb, not a long run of luck.
  const s4 = life(); s4.age=30;
  for(let i=0;i<700;i++) T.recordCasinoResult(10000);
  ok("a grinder's lifetime net clears the threshold", T.casinoNet() > T.CASINO_BAN_THRESHOLD, T.casinoNet());
  ok("but grinding never gets you barred", !T.checkCasinoBan() && !T.isBannedFromCasino());
  ok("biggest single win is what's tracked", T.casinoBiggestWin()===10000, T.casinoBiggestWin());
  // Losses never count as wins.
  const s4b = life(); s4b.age=30;
  T.recordCasinoResult(-3000000);
  ok("a heavy loser isn't banned", !T.checkCasinoBan());
  ok("losses leave the biggest win at zero", T.casinoBiggestWin()===0, T.casinoBiggestWin());
  // The sheet shows the stake box and the running position.
  const s5 = life(); s5.age=30; s5.money=5000;
  T.openCasinoSheet(); let ov=lastSheet();
  T.casinoView={game:"slots"}; T.renderCasinoSheet(ov);
  ok("slots screen has a stake box", ov.innerHTML.includes('id="betInput"'));
  ok("slots screen has all-in", ov.innerHTML.includes('data-setbet="all"'));
  T.casinoView={game:"menu"}; T.renderCasinoSheet(ov);
  ok("menu shows the position against the house", ov.innerHTML.includes("Against the house"));
  ok("menu states the single-win rule", /single bet/.test(ov.innerHTML));
  T.recordCasinoResult(1000000); T.renderCasinoSheet(ov);
  ok("menu shows your biggest single win", ov.innerHTML.includes("Biggest single win"));
}

// ===================================================== 2. Proposals & weddings
console.log("2. Proposing, the wedding, the honeymoon and the prenup");
{
  const s = life(); s.age=25;
  s.relationship = {id:1,name:"Rhys",gender:"Boy",age:26,closeness:70,alive:true};
  s.relationshipYears = 0;
  ok("too soon to propose", !T.canPropose());
  ok("and it says why", /Too soon/.test(T.proposeReadyReason()));
  s.relationshipYears = 2;
  ok("two years together is enough", T.canPropose());
  s.relationshipYears = 0; s.relationship.age = 31;
  ok("a partner of 30+ is enough", T.canPropose());

  // A ring genuinely changes the odds.
  s.relationshipYears = 3; s.relationship.closeness = 70;
  const noRing = T.proposalChance(T.ENGAGEMENT_RINGS[0]);
  const decent = T.proposalChance(T.ENGAGEMENT_RINGS[2]);
  const absurd = T.proposalChance(T.ENGAGEMENT_RINGS[4]);
  ok("no ring is a real penalty", noRing < decent - 0.2, `${noRing.toFixed(2)} vs ${decent.toFixed(2)}`);
  ok("a better ring helps", absurd > decent, `${decent.toFixed(2)} vs ${absurd.toFixed(2)}`);
  ok("closeness matters", (()=>{ s.relationship.closeness=20; const low=T.proposalChance(T.ENGAGEMENT_RINGS[2]); s.relationship.closeness=95; const hi=T.proposalChance(T.ENGAGEMENT_RINGS[2]); return hi>low+0.3; })());

  // Ring shopping is offered, and charges you.
  const s2 = life(); s2.age=30; s2.money=50000;
  s2.relationship={id:1,name:"Mo",gender:"Boy",age:31,closeness:80,alive:true};
  s2.relationshipYears=3; s2.pendingChoice=null;
  T.openProposalFlow();
  ok("ring shopping appears", !!s2.pendingChoice && /ring/i.test(s2.pendingChoice.title));
  ok("no-ring is an option", s2.pendingChoice.options.some(o=>/no ring/i.test(o.label)));
  const m0=s2.money;
  choose("decent solitaire");
  ok("the ring was paid for", s2.money === m0 - 2500, s2.money);

  // Acceptance leads straight into the venue choice.
  let engaged=0, venues=0;
  for(let i=0;i<60;i++){
    const st=life(); st.age=30; st.money=200000;
    st.relationship={id:1,name:"A",gender:"Boy",age:31,closeness:95,alive:true};
    st.relationshipYears=6; st.pendingChoice=null;
    T.doPropose(T.ENGAGEMENT_RINGS[4]);
    if(st.engaged){ engaged++; if(st.pendingChoice && /married/i.test(st.pendingChoice.title)) venues++; }
  }
  ok("a strong proposal usually lands", engaged>40, engaged+"/60");
  ok("a yes leads to the venue choice", venues===engaged, `${venues}/${engaged}`);

  // No ring, poor relationship: refusals, and sometimes the end of it.
  let refused=0, dumped=0;
  for(let i=0;i<200;i++){
    const st=life(); st.age=30;
    st.relationship={id:1,name:"B",gender:"Boy",age:31,closeness:15,alive:true};
    st.relationshipYears=2; st.pendingChoice=null;
    T.doPropose(T.ENGAGEMENT_RINGS[0]);
    if(!st.engaged){ refused++; if(!st.relationship) dumped++; }
  }
  ok("a bad no-ring proposal usually fails", refused>160, refused+"/200");
  ok("and sometimes ends the relationship", dumped>30, dumped+"/"+refused);

  // Venue, then prenup, then honeymoon the following year.
  const s3=life(); s3.age=32; s3.money=300000;
  s3.relationship={id:1,name:"Cai",gender:"Boy",age:33,closeness:90,alive:true};
  s3.engaged=true; s3.pendingChoice=null;
  T.openWeddingPlanner();
  ok("every affordable venue is offered", T.WEDDING_VENUES.every(v=>s3.pendingChoice.options.some(o=>o.label.includes(v.label))));
  ok("putting it off is an option", s3.pendingChoice.options.some(o=>/put the wedding off/i.test(o.label)));
  const before=s3.money;
  choose("Country manor");
  ok("the venue was paid for", s3.money===before-25000, s3.money);
  ok("married", s3.married===true && s3.engaged===false);
  ok("married age recorded", s3.marriedAtAge===32);
  ok("the prenup is asked next", !!s3.pendingChoice && /prenup/i.test(s3.pendingChoice.title));
  choose("Sign a prenup");
  ok("prenup in place", s3.hasPrenup===true);
  // Honeymoon arrives the next year, through the ordinary year loop.
  s3.age=33; s3.pendingChoice=null;
  T.ageFamilyAndFriends();
  ok("the honeymoon is offered the year after", !!s3.pendingChoice && /honeymoon/i.test(s3.pendingChoice.title));
  ok("every affordable honeymoon is offered", T.HONEYMOONS.filter(h=>h.cost<=s3.money).every(h=>s3.pendingChoice.options.some(o=>o.label.includes(h.label))));
  const h0=s3.money, c0=s3.relationship.closeness;
  choose("Maldives");
  ok("the honeymoon was paid for", s3.money===h0-14000, s3.money);
  ok("it recorded the choice", s3.honeymoon==="maldives");
  ok("it raised closeness", s3.relationship.closeness>c0);
  ok("not offered twice", (s3.pendingChoice=null, s3.age=34, T.ageFamilyAndFriends(), !s3.pendingChoice || !/honeymoon/i.test(s3.pendingChoice.title||"")));
  // Breaking an engagement clears it.
  const s4=life(); s4.age=30; s4.relationship={id:1,name:"D",gender:"Boy",age:30,closeness:60,alive:true}; s4.engaged=true;
  T.doBreakup();
  ok("breaking up clears the engagement", s4.engaged===false && s4.relationship===null && s4.relationshipYears===0);
}

// ===================================================== 3. Ending the ledger
console.log("3. Closing the ledger early");
{
  const s = life(); s.age=55; s.money=90000;
  s.children=[{id:10,name:"Heir",age:25,health:80,happiness:75,smarts:70,bond:60}];
  s.pendingChoice=null;
  T.endLedgerEarly();
  ok("it asks first", !!s.pendingChoice && /close the ledger/i.test(s.pendingChoice.title));
  ok("it mentions the heirs", /1 child/.test(s.pendingChoice.text));
  ok("backing out is offered", s.pendingChoice.options.some(o=>/keep going/i.test(o.label)));
  choose("Keep going");
  ok("backing out leaves you alive", s.alive===true);
  T.endLedgerEarly();
  choose("Close it");
  ok("closing ends the life", s.alive===false);
  ok("cause recorded", /by choice/.test(s.causeOfDeath));
  ok("it was scored like any other life", !!s.finalScore && s.finalScore.total>0);
  ok("a ribbon was awarded", !!s.ribbon);
  // And the heir can carry on.
  T.startAsChild(10);
  ok("continued as the child", T.state && T.state.alive && T.state.name.startsWith("Heir"), T.state && T.state.name);
  ok("generation advanced", (T.state.generation||1)>=2, T.state.generation);
  // With no children it still closes cleanly.
  const s2=life(); s2.age=70; s2.children=[]; s2.pendingChoice=null;
  T.endLedgerEarly();
  ok("says the line ends with no children", /line ends here/.test(s2.pendingChoice.text));
  choose("Close it");
  ok("closes with no heirs", s2.alive===false);
}

// ===================================================== 4. Work and performance
console.log("4. Work options, performance and dismissal");
{
  // Civilian
  const s = life(); s.age=30;
  s.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:2,performance:50};
  T.doWorkHarder(); ok("working harder raises performance", T.jobPerformance()>50);
  s.yearlyActivityUses={}; s.actionsLeft=6; s.pendingActionId=null; s.career.performance=50;
  T.doSlackOff(); ok("slacking lowers it", T.jobPerformance()<50);

  // Forces now have the same controls, and selection works.
  const s2 = life(); s2.age=25;
  s2.career={kind:"forces",trackId:"royal_navy",isOfficer:false,rankIndex:1,yearsInRank:8,performance:50};
  T.doWorkHarder(); ok("forces can work harder", T.jobPerformance()>50);
  s2.yearlyActivityUses={}; s2.actionsLeft=6; s2.pendingActionId=null;
  let promoted=0;
  for(let i=0;i<200;i++){
    const st=life(); st.age=25;
    st.career={kind:"forces",trackId:"royal_navy",isOfficer:false,rankIndex:1,yearsInRank:9,performance:90};
    T.doAskPromotion();
    if(st.career && st.career.rankIndex===2) promoted++;
  }
  ok("forces selection can succeed", promoted>40, promoted+"/200");
  // Too little time in rank is refused outright.
  const s3=life(); s3.age=20;
  s3.career={kind:"forces",trackId:"royal_navy",isOfficer:false,rankIndex:1,yearsInRank:0,performance:90};
  T.doAskPromotion();
  ok("not enough time in rank is refused", s3.career.rankIndex===1);
  ok("no exception on forces promotion", true);

  // The warning, then dismissal.
  const s4=life(); s4.age=35;
  s4.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:3,performance:15};
  const ended1 = T.checkPerformanceWarning("Developer");
  ok("first bad year is a warning, not a sacking", ended1===false && !!s4.careerWarning && s4.career!==null);
  ok("the warning records when it started", s4.careerWarning.sinceAge===35);
  const ended2 = T.checkPerformanceWarning("Developer");
  ok("a second bad year ends the job", ended2===true && s4.career===null);
  ok("being sacked is flagged", s4.flags.everSacked===true);
  // Pulling it back lifts the warning.
  const s5=life(); s5.age=35;
  s5.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:3,performance:15};
  T.checkPerformanceWarning("Developer");
  ok("on a warning", !!s5.careerWarning);
  s5.career.performance=60;
  T.checkPerformanceWarning("Developer");
  ok("recovering lifts the warning", !s5.careerWarning && s5.career!==null);
  // Good performance never triggers it.
  const s6=life(); s6.age=35;
  s6.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:3,performance:80};
  for(let i=0;i<20;i++) T.checkPerformanceWarning("Developer");
  ok("good performance is never warned", !s6.careerWarning && s6.career!==null, String(s6.careerWarning));
  // Deep under the line is immediate on the second year, not a coin toss.
  let immediate=0;
  for(let i=0;i<50;i++){
    const st=life(); st.age=35;
    st.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:3,performance:5};
    T.checkPerformanceWarning("X");
    if(T.checkPerformanceWarning("X")===true) immediate++;
  }
  ok("performance under 20 is always dismissal", immediate===50, immediate+"/50");

  // Politics
  const p = life(); p.age=40; p.money=500000;
  p.politics={officeId:"councillor",yearsInOffice:1};
  ok("approval starts at 50", T.politicalApproval()===50);
  T.doWorkHarder();
  ok("work harder raises approval in office", T.politicalApproval()>50, T.politicalApproval());
  p.yearlyActivityUses={}; p.actionsLeft=6; p.pendingActionId=null; p.politics.approval=50;
  T.doSlackOff();
  ok("coasting lowers approval", T.politicalApproval()<50, T.politicalApproval());
  // Resigning asks first.
  p.pendingChoice=null; T.resignOffice();
  ok("resigning asks first", !!p.pendingChoice && /resign/i.test(p.pendingChoice.title));
  choose("Stay in post"); ok("staying keeps the seat", !!p.politics);
  T.resignOffice(); choose("Resign the seat");
  ok("resigning gives up the seat", p.politics===null && p.flags.resignedOffice===true);
  // Low approval warns, then deselects.
  const p2=life(); p2.age=40;
  p2.politics={officeId:"mp",yearsInOffice:1,approval:10};
  T.runPoliticsYear();
  ok("low approval warns first", p2.politics && p2.politics.warned===true);
  let desel=0;
  for(let i=0;i<60;i++){
    const st=life(); st.age=40;
    st.politics={officeId:"mp",yearsInOffice:1,approval:8,warned:true};
    T.runPoliticsYear();
    if(!st.politics) desel++;
  }
  ok("a warned member under 20% is deselected", desel===60, desel+"/60");
  // High approval holds the seat at an election far more often than low.
  // MP is now the sixth rung, so the base odds are lower and the gap between
  // high and low approval needs more lives to measure reliably.
  const held = (ap)=>{ let n=0; for(let i=0;i<1000;i++){ const st=life(); st.age=40; st.stats.smarts=70;
    st.politics={officeId:"mp",yearsInOffice:5,approval:ap}; T.runPoliticsYear(); if(st.politics) n++; } return n; };
  const hi = held(95), lo = held(35);
  ok("approval decides re-election", hi > lo * 1.3, `95%: ${hi}/1000 vs 35%: ${lo}/1000`);
  // Career panels render the controls.
  const s7=life(); s7.age=30;
  s7.career={kind:"forces",trackId:"raf",isOfficer:true,rankIndex:1,yearsInRank:4,performance:22};
  T.openCareerSheet(); let ov=lastSheet(); T.renderCareerSheetContent(ov);
  ok("forces see a performance bar", ov.innerHTML.includes("Reported performance"));
  ok("forces can work harder", ov.innerHTML.includes('id="workHarderBtn"'));
  ok("forces can do the minimum", ov.innerHTML.includes('id="slackBtn"'));
  ok("forces can put in for selection", ov.innerHTML.includes('id="askPromoBtn"'));
  ok("forces can quit", ov.innerHTML.includes('id="quitJobBtn"'));
  ok("close to the line is flagged", ov.innerHTML.includes("close to the"));
  s7.careerWarning={sinceAge:30,title:"X"}; T.renderCareerSheetContent(ov);
  ok("a warning is shown prominently", ov.innerHTML.includes("Formal warning since age 30"));
  const s8=life(); s8.age=45; s8.politics={officeId:"pm",yearsInOffice:2,approval:40};
  T.renderCareerSheetContent(ov);
  ok("politics shows approval", ov.innerHTML.includes("Approval rating: 40%"));
  ok("politics can work or coast", ov.innerHTML.includes('id="workHarderBtn"') && ov.innerHTML.includes('id="slackBtn"'));
  ok("politics can resign", ov.innerHTML.includes('id="resignOfficeBtn"'));
}

// ===================================================== 5. Ages everywhere
console.log("5. Ages on everyone, and realistic mortality");
{
  const s = life();
  const parents = s.family.filter(p=>p.relation==="Mother"||p.relation==="Father");
  ok("two parents", parents.length===2);
  ok("parents have plausible ages at your birth", parents.every(p=>p.age>=20 && p.age<=42), parents.map(p=>p.age).join(","));
  ok("everyone in the family has an age", s.family.every(p=>Number.isFinite(p.age)));
  // Mortality is driven by their age, not yours.
  ok("a 95-year-old is far likelier to die than a 40-year-old", T.npcDeathChance(95) > T.npcDeathChance(40)*50);
  ok("the curve rises monotonically", (()=>{ let prev=-1; for(let a=0;a<=110;a+=5){ const c=T.npcDeathChance(a); if(c<prev) return false; prev=c; } return true; })());
  ok("nobody is immortal", T.npcDeathChance(110) > 0.5);
  // Friends and partners have ages, and are mortal.
  const s2=life(); s2.age=40;
  const f=T.addFriend("Mate", 70);
  ok("friends have ages", Number.isFinite(f.age));
  s2.relationship={id:1,name:"P",gender:"Boy",closeness:70,alive:true};
  T.ensurePersonAge(s2.relationship);
  ok("a partner missing an age gets one", Number.isFinite(s2.relationship.age));
  // Over a long enough run, an old partner dies and you are widowed.
  let widowed=0;
  for(let i=0;i<200;i++){
    const st=life(); st.age=80; st.married=true;
    st.relationship={id:1,name:"Q",gender:"Boy",age:88,closeness:70,alive:true};
    for(let y=0;y<6 && st.relationship;y++){ st.age++; st.pendingChoice=null; T.ageFamilyAndFriends(); }
    if(st.flags.widowed) widowed++;
  }
  ok("an elderly spouse can die", widowed>80, widowed+"/200");
  // Everyone ages in step.
  const s3=life(); s3.age=0;
  const mum=s3.family.find(p=>p.relation==="Mother"); const a0=mum.age;
  for(let y=0;y<10;y++){ s3.age++; s3.pendingChoice=null; T.ageFamilyAndFriends(); }
  ok("family ages with you", mum.alive ? mum.age===a0+10 : true, mum.age);
  // Inheritance: equal shares across all the children, you included.
  const shares=[];
  for(let i=0;i<400;i++){
    // Pinned to England so the prompt's figures are sterling and parseable.
    const st=life({birthplace:"England"}); st.age=50; st.money=0; st.wealthTier="middle";
    // Force three siblings and kill both parents this year.
    st.family = st.family.filter(p=>p.relation!=="Sibling");
    st.siblingsToCome = [];   // no new arrivals part-way through the test
    for(let k=0;k<3;k++) st.family.push(T.makePerson("Sibling",undefined,50+k));
    st.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{ p.alive=true; p.age=200; });
    st.pendingChoice=null;
    // Each parent rolls separately, so run years until both have gone.
    for(let y=0;y<15 && st.family.some(p=>(p.relation==="Mother"||p.relation==="Father")&&p.alive);y++){
      st.pendingChoice=null; T.ageFamilyAndFriends();
    }
    if(st.pendingChoice && /estate/i.test(st.pendingChoice.title)){
      const eq = st.pendingChoice.options.find(o=>/equally/i.test(o.label));
      if(eq){
        const m=/£([\d,]+) each/.exec(eq.label);
        st.pendingChoice=null; eq.effect();
        shares.push({got: st.money, label: m?m[1]:null});
      }
    }
  }
  ok("the estate prompt appears", shares.length>300, shares.length+"/400");
  // With four children the share must be a quarter, and that is what you get.
  ok("you receive exactly your equal share", shares.every(x=>x.label && x.got===parseInt(x.label.replace(/,/g,""),10)),
     JSON.stringify(shares.slice(0,2)));
  // The prompt says four beneficiaries.
  {
    const st=life(); st.age=50; st.money=0; st.wealthTier="middle";
    st.family = st.family.filter(p=>p.relation!=="Sibling");
    st.siblingsToCome = [];   // no new arrivals part-way through the test
    for(let k=0;k<3;k++) st.family.push(T.makePerson("Sibling",undefined,50+k));
    st.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{ p.alive=true; p.age=200; });
    st.pendingChoice=null;
    for(let y=0;y<15 && st.family.some(p=>(p.relation==="Mother"||p.relation==="Father")&&p.alive);y++){
      st.pendingChoice=null; T.ageFamilyAndFriends();
    }
    ok("the prompt counts you among the beneficiaries", st.pendingChoice && /the 4 of you/.test(st.pendingChoice.text), st.pendingChoice && st.pendingChoice.text);
  }
  // And it settles only once.
  {
    const st=life({birthplace:"England"}); st.age=50; st.wealthTier="middle";
    st.siblingsToCome = [];
    if(!st.family.some(p=>p.relation==="Sibling")) st.family.push(T.makePerson("Sibling",undefined,52));
    st.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{ p.alive=true; p.age=200; });
    st.pendingChoice=null;
    for(let y=0;y<15 && st.family.some(p=>(p.relation==="Mother"||p.relation==="Father")&&p.alive);y++){
      st.pendingChoice=null; T.ageFamilyAndFriends();
    }
    // Another decision in the same year can put the estate behind it in the queue.
    const had = [st.pendingChoice].concat(st.choiceQueue||[]).some(c=>c && /Dividing the estate/.test(c.title)) || st.flags.parentsEstateSettled===true;
    st.pendingChoice=null; st.choiceQueue=[];
    for(let y=0;y<8;y++){ st.age++; T.ageFamilyAndFriends(); st.choiceQueue=(st.choiceQueue||[]).filter(c=>/Dividing the estate/.test(c.title)); }
      ok("the estate is settled only once", had && st.flags.parentsEstateSettled===true && ![st.pendingChoice].concat(st.choiceQueue||[]).some(c=>c && /Dividing the estate/.test(c.title)),
       `settled=${st.flags.parentsEstateSettled} reprompt=${st.pendingChoice&&st.pendingChoice.title}`);
  }
  // An only child inherits the lot, with nothing to negotiate.
  {
    let soleHeir=0, prompted=0;
    for(let i=0;i<120;i++){
      // Pinned to England so the prompt's figures are in sterling and can be
      // parsed; the share itself is currency-independent.
      const st=life({birthplace:"England"}); st.age=50; st.money=0; st.wealthTier="middle";
      st.siblingsToCome = [];
      st.family = st.family.filter(p=>p.relation!=="Sibling");
      st.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{ p.alive=true; p.age=200; });
      st.pendingChoice=null;
      for(let y=0;y<15 && st.family.some(p=>(p.relation==="Mother"||p.relation==="Father")&&p.alive);y++){
        st.pendingChoice=null; T.ageFamilyAndFriends();
      }
      if(st.pendingChoice) prompted++;
      if(st.money>0) soleHeir++;
    }
    ok("an only child is paid without a negotiation", prompted===0, prompted+"/120 prompted");
    ok("and receives the whole estate", soleHeir===120, soleHeir+"/120");
  }

  // The UI shows ages.
  const s9=life(); s9.age=45;
  s9.relationship={id:1,name:"Ivy",gender:"Girl",age:44,closeness:70,alive:true};
  T.addFriend("Jon",60);
  T.openPeopleSheet(); let ov=lastSheet();
  // Lists show relation and age beside each name; each person's own page
  // shows it again in full.
  T.peopleView.tab="family"; T.peopleView.person=null; T.renderPeopleSheetContent(ov);
  ok("family list shows ages", /\((Mother|Father|Brother|Sister|Grandmother|Grandfather), \d+\)/.test(ov.innerHTML));
  T.peopleView.tab="partner"; T.peopleView.person={kind:"partner", id:1}; T.renderPeopleSheetContent(ov);
  ok("partner shows an age", ov.innerHTML.includes("Ivy") && ov.innerHTML.includes("age 44"));
  T.peopleView.tab="friends"; T.peopleView.person=null; T.renderPeopleSheetContent(ov);
  ok("friends show ages", /Jon <span class="rel-tag">\((Best friend|Friend), \d+\)/.test(ov.innerHTML));
}

// ===================================================== 6. Back to education
console.log("6. Going back into education");
{
  const s = life(); s.age=40; s.education="left school"; s.stats.smarts=70; s.money=100000;
  const avail = T.availableReturnCourses();
  ok("courses are available to an adult", avail.length>0, avail.map(c=>c.id).join(","));
  ok("a degree is on offer", avail.some(c=>c.id==="degree"));
  // Someone who already has a degree is offered a second one, not a first.
  s.education="degree-finished"; s.degree="Law";
  const a2 = T.availableReturnCourses();
  ok("a graduate is offered a second degree", a2.some(c=>c.id==="secondeg"));
  ok("and not a first one", !a2.some(c=>c.id==="degree"));

  // Enrolling: stage, subject, funding.
  const s2=life(); s2.age=45; s2.education="left school"; s2.stats.smarts=75; s2.money=100000; s2.pendingChoice=null;
  T.openReturnToEducation();
  ok("the stage is asked first", !!s2.pendingChoice && /back into education/i.test(s2.pendingChoice.title));
  choose("University degree");
  ok("then the subject", !!s2.pendingChoice && /subject/i.test(s2.pendingChoice.title));
  ok("all degrees offered", T.DEGREE_OPTIONS.every(d=>s2.pendingChoice.options.some(o=>o.label===d||o.label.startsWith(d+" — "))));
  choose("Medicine");
  ok("then how to pay", !!s2.pendingChoice && /paying for it/i.test(s2.pendingChoice.title));
  const labels = s2.pendingChoice.options.map(o=>o.label).join(" | ");
  ok("scholarship offered", /scholarship/i.test(labels));
  ok("loan offered", /student loan/i.test(labels));
  ok("paying yourself offered", /yourself/i.test(labels));
  ok("asking parents offered", /parents/i.test(labels), labels);
  // The loan route adds real debt.
  const before = s2.studentLoan ? s2.studentLoan.balance : 0;
  choose("student loan");
  ok("the loan was taken out", s2.studentLoan && s2.studentLoan.balance===before+28000, s2.studentLoan && s2.studentLoan.balance);
  ok("enrolled", !!s2.studying && s2.studying.degree==="Medicine" && s2.studying.yearsLeft===3);
  ok("funding recorded", s2.studying.funding==="loan");
  // Studying through to graduation sets the education level and the degree.
  const sm0 = s2.stats.smarts;
  for(let y=0;y<3;y++){ s2.age++; T.runStudyingYear(); }
  ok("graduated", s2.studying===null && s2.education==="degree-finished");
  ok("the degree is recorded", s2.degree==="Medicine");
  ok("smarts went up", s2.stats.smarts>sm0, `${sm0} -> ${s2.stats.smarts}`);
  ok("flagged as a returner", s2.flags.returnedToEducation===true);

  // Entry requirements bite.
  let refusals=0;
  for(let i=0;i<40;i++){
    const st=life(); st.age=40; st.education="left school"; st.stats.smarts=10; st.money=100000; st.pendingChoice=null;
    T.openReturnToEducation();
    const opt = st.pendingChoice.options.find(o=>/University degree/.test(o.label));
    st.pendingChoice=null; if(opt) opt.effect();
    if(!st.studying && !st.pendingChoice) refusals++;
  }
  ok("low smarts is turned down", refusals===40, refusals+"/40");

  // Scholarships favour ability.
  const bright = life(); bright.stats.smarts=95;
  const chBright = T.scholarshipChance(T.RETURN_COURSES[2]);
  const dim = life(); dim.stats.smarts=40;
  const chDim = T.scholarshipChance(T.RETURN_COURSES[2]);
  ok("scholarships favour the able", chBright > chDim + 0.3, `${chBright.toFixed(2)} vs ${chDim.toFixed(2)}`);
  ok("scholarship odds stay in range", chBright<=1 && chDim>=0);

  // A failed scholarship still leaves you a way to pay.
  let fellBack=0;
  for(let i=0;i<60;i++){
    const st=life(); st.age=40; st.education="left school"; st.stats.smarts=40; st.money=100000; st.pendingChoice=null;
    T.openFundingChoice(T.RETURN_COURSES[2], "Law");
    const sch = st.pendingChoice.options.find(o=>/scholarship/i.test(o.label));
    st.pendingChoice=null; sch.effect();
    if(!st.studying && st.pendingChoice && /paying for it/i.test(st.pendingChoice.title)) fellBack++;
  }
  ok("a failed scholarship re-offers the other routes", fellBack>30, fellBack+"/60");

  // Asking parents depends on closeness and on them being alive.
  const rich = life(); rich.wealthTier="rich"; rich.age=35;
  rich.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{p.alive=true;p.closeness=95;});
  const pcHigh = T.parentFeesChance();
  rich.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{p.closeness=10;});
  const pcLow = T.parentFeesChance();
  ok("closeness matters when asking parents", pcHigh > pcLow + 0.2, `${pcHigh.toFixed(2)} vs ${pcLow.toFixed(2)}`);
  const orphan = life(); orphan.age=50;
  orphan.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{p.alive=false;});
  ok("dead parents can't be asked", !T.canAskParentsForFees() && T.parentFeesChance()===0);

  // Dropping out.
  const s3=life(); s3.age=40;
  T.enrolReturnCourse(T.RETURN_COURSES[1], null, "loan");
  ok("enrolled on a diploma", !!s3.studying);
  T.doDropStudying();
  ok("dropped out", s3.studying===null);

  // Postgraduate funding goes the same way.
  const s4=life(); s4.age=40; s4.education="degree-finished"; s4.stats.smarts=80; s4.money=0; s4.pendingChoice=null;
  s4.actionsLeft=6;
  T.doStartPostgrad("masters");
  ok("postgrad asks how to pay", !!s4.pendingChoice && /paying for it/i.test(s4.pendingChoice.title));
  ok("a broke student can still take a loan", s4.pendingChoice.options.some(o=>/student loan/i.test(o.label)));
  choose("student loan");
  ok("enrolled on the masters with a loan", !!s4.postgrad && s4.postgrad.funding==="loan");
  ok("the loan is on the books", s4.studentLoan && s4.studentLoan.balance>=12000);

  // The Education screen offers it.
  const s5=life(); s5.age=50; s5.education="left school";
  T.openCareerSheet(); let ov=lastSheet();
  T.careerView={level:"education",category:null}; T.renderCareerSheetContent(ov);
  ok("the education screen offers going back", ov.innerHTML.includes('id="eduReturnBtn"'));
  ok("it names the funding routes", /scholarship/i.test(ov.innerHTML) && /student loan/i.test(ov.innerHTML));
  T.enrolReturnCourse(T.RETURN_COURSES[2], "Engineering", "scholarship");
  T.renderCareerSheetContent(ov);
  ok("it shows what you're studying", ov.innerHTML.includes("University degree") && ov.innerHTML.includes("Engineering"));
  ok("it shows who's paying", ov.innerHTML.includes("a scholarship"));
  ok("it offers dropping out", ov.innerHTML.includes('id="eduDropStudy"'));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
