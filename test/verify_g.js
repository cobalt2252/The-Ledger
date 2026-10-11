// Stress recovery, one tax allowance a year, and what-next after each stage of education.
const T = require("./harness.js")(`recoverStress, stressRecoveryRate, STRESS_REST, checkBurnout, payIncome, payAdditionalIncome,
  incomeTax, incomeSoFarThisYear, taxOnTop, recordIncome, priceLevel, runStageEvents, runStudyingYear, runPostgradYear,
  offerAfterQualification, postgradOptionsOpen, lookForWorkNext, enrolReturnCourse, RETURN_COURSES, POSTGRAD_COURSES,
  makePerson, advanceChoiceQueue, runCareerYear, TRACKS, get notifications(){return notifications;}, set notifications(v){notifications=v;}`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };
function life(){
  T.state=null; T.appScreen="home"; T.rollSetupDraft();
  T.startGame("Test Person","Girl","Straight",{scenarioId:"free"});
  const s=T.state; s.pendingChoice=null; s.choiceQueue=[]; s.yearlyActivityUses={}; s.actionsUsed=0; s.year=2024; T.notifications=[];
  return s;
}
const titles = s=>[s.pendingChoice].concat(s.choiceQueue||[]).filter(Boolean).map(c=>c.title);
const opts = s=>s.pendingChoice ? s.pendingChoice.options.map(o=>o.label) : [];
function choose(m){
  const pc=T.state.pendingChoice; if(!pc) return false;
  const o=pc.options.find(x=>x.label.toLowerCase().includes(m.toLowerCase()));
  T.state.pendingChoice=null; if(!o) return false; o.effect(); T.advanceChoiceQueue(); return true;
}
const lastNote = ()=>T.notifications.length ? T.notifications[T.notifications.length-1].text : "";

// ============================================================ 1. Stress
console.log("1. Stress eases with time");
{
  const s=life(); s.age=40; s.career=null; s.stats.happiness=50; s.stats.health=50; s.relationship=null; s.friends=[];
  s.hidden.stress=90; T.recoverStress();
  ok("high stress comes down", s.hidden.stress<90, s.hidden.stress);
  s.hidden.stress=25; T.recoverStress(); ok("below the resting level it doesn't move", s.hidden.stress===25);
  s.career={kind:"civilian",trackId:"retail",rankIndex:0,yearsInRank:0};
  const base=T.stressRecoveryRate();
  s.stats.happiness=80; s.stats.health=80; ok("health and happiness speed it up", T.stressRecoveryRate()>base);
  s.relationship=T.makePerson("Partner","Boy",40); s.relationship.closeness=80;
  const withP=T.stressRecoveryRate(); ok("so does a close partner", withP>T.stressRecoveryRate.call(null)-1e-9 && withP>base);
  s.career=null; ok("and time away from work", T.stressRecoveryRate()>withP);
  s.stats.happiness=10; s.relationship=null; s.career={}; s.stats.health=40;
  ok("misery slows it", T.stressRecoveryRate()<base);
  s.prisonYearsLeft=3; ok("prison barely lets it go", T.stressRecoveryRate()<=0.04);
  s.prisonYearsLeft=0;
  // A steady ordinary job settles well below burnout.
  s.career={kind:"civilian",trackId:"retail",rankIndex:0,yearsInRank:0}; s.stats.happiness=55; s.stats.health=55; s.hidden.stress=30;
  for(let y=0;y<60;y++){ s.hidden.stress=Math.min(100,s.hidden.stress+2); T.recoverStress(); }
  ok("an ordinary job settles below 80", s.hidden.stress<80, s.hidden.stress);
  s.hidden.stress=30; for(let y=0;y<60;y++){ s.hidden.stress=Math.min(100,s.hidden.stress+9); T.recoverStress(); }
  ok("a relentless load still reaches burnout", s.hidden.stress>80, s.hidden.stress);
  // Burnout itself still works.
  s.hidden.stress=95; s.yearsHighStress=2; T.checkBurnout(); ok("three years over 80 still ends the job", s.career===null && s.flags.hadBurnout);
}

// ============================================================ 2. Tax
console.log("2. One personal allowance a year");
{
  const s=life(); s.age=35; s.money=0;
  const pl=T.priceLevel();
  T.payIncome(40000/pl, "Salary");
  T.payIncome(10000/pl, "Tour takings");
  T.payIncome(5000/pl, "Client fee");
  const total=Math.round(40000)+Math.round(10000)+Math.round(5000);
  ok("a year's tax equals the tax on its total", Math.abs((total - s.money) - T.incomeTax(total))<=3, `${total-s.money} vs ${T.incomeTax(total)}`);
  ok("the second payment gets no allowance of its own", (10000 - (()=>{ const t=life(); t.age=35; t.money=0; T.payIncome(40000/pl,"a"); const m=t.money; T.payIncome(10000/pl,"b"); return t.money-m; })()) > T.incomeTax(10000));
  ok("the year's income is the running total", Math.abs(s.lastIncome-total)<=2, s.lastIncome);
  // Order doesn't matter.
  const a=life(); a.age=35; a.money=0; T.payIncome(5000/pl,"x"); T.payIncome(80000/pl,"y");
  const b=life(); b.age=35; b.money=0; T.payIncome(80000/pl,"y"); T.payIncome(5000/pl,"x");
  ok("the order the money arrives in doesn't change the tax", Math.abs(a.money-b.money)<=2, `${a.money} vs ${b.money}`);
  // New year, fresh allowance.
  const n=life(); n.age=35; n.money=0; T.payIncome(50000/pl,"Salary"); n.age++;
  ok("the tally resets at each birthday", T.incomeSoFarThisYear()===0);
  const m0=n.money; T.payIncome(12000/pl,"Small job");
  ok("so a small sum in a new year is tax-free", Math.abs((n.money-m0)-12000)<=1, n.money-m0);
  ok("payAdditionalIncome is the same thing", T.payAdditionalIncome===T.payAdditionalIncome && (()=>{ const t=life(); t.age=30; t.money=0; T.payIncome(30000/pl,"a"); const m=t.money; T.payAdditionalIncome(30000/pl,"b"); return Math.abs((t.money-m) - (30000 - (T.incomeTax(60000)-T.incomeTax(30000))))<=2; })());
  // A real salary year then a one-off.
  const c=life(); c.age=30; c.year=2024; c.money=0; c.career={kind:"civilian",trackId:"retail",rankIndex:5,yearsInRank:0,training:null};
  c.flags.performance=60; T.runCareerYear();
  const sal=T.incomeSoFarThisYear();
  if(sal>0){ const m=c.money; T.payIncome(8000/pl,"Bonus"); ok("a one-off after a salary pays the marginal rate", Math.abs((8000-(c.money-m)) - T.taxOnTop.call(null,0)*0 - (T.incomeTax(sal+8000)-T.incomeTax(sal)))<=2); }
  else ok("salary was paid", false, "no salary");
  // No career: lastIncome follows what's been earned this year, not zero.
  const d=life(); d.age=30; d.career=null; T.payIncome(9000/pl,"Gig"); T.runCareerYear();
  ok("being out of work doesn't wipe this year's earnings", d.lastIncome>0, d.lastIncome);
}

// ============================================================ 3. What next
console.log("3. What next, after each stage");
{
  // School at 18.
  const s=life(); s.age=18; s.education="school"; s.stats.smarts=75; s.livingWithParents=true;
  T.runStageEvents(18);
  ok("finishing school is a notification", /Finished school at 18/.test(lastNote()), lastNote());
  ok("and asks what's next", titles(s).includes("Leaving school"));
  const o=opts(s).join(" | ");
  ok("college, a trade, or work", /college/i.test(o) && /apprenticeship/i.test(o) && /look for work/i.test(o), o);
  ok("college shows its requirement", /smarts 60\+ \(yours 75\)/.test(o));
  choose("Go on to college"); ok("which you can take", s.education==="college");
  const s2=life(); s2.age=18; s2.education="school"; s2.stats.smarts=40; T.runStageEvents(18);
  ok("college is still offered on low grades", /college/i.test(opts(s2).join()));
  choose("Go on to college"); ok("but turns you down, and school counts as finished", s2.education==="school-finished");
  const s3=life(); s3.age=18; s3.education="school"; s3.career=null; T.runStageEvents(18);
  choose("look for work"); ok("looking for work leaves school", s3.education==="left school");
  ok("and opens the jobs when you're done", s3.openJobsNext===true);
}
{
  // College at 21.
  const s=life(); s.age=21; s.education="college"; s.stats.smarts=70; T.runStageEvents(21);
  ok("finishing college is a notification", /Finished college/.test(lastNote()));
  ok("then university or work", /university/i.test(opts(s).join()) && /look for work/i.test(opts(s).join()));
  const r=life(); r.age=21; r.education="college"; r.stats.smarts=40; T.runStageEvents(21);
  choose("Apply to university");
  ok("a university rejection still finishes college", r.education==="college-finished");
  const w=life(); w.age=21; w.education="college"; T.runStageEvents(21); choose("look for work");
  ok("work after college finishes it too", w.education==="college-finished" && w.openJobsNext);
}
{
  // University graduation.
  const s=life(); s.age=24; s.education="degree"; s.degree="Law"; s.degreeEndsAge=24; s.stats.smarts=80; s.career=null;
  T.runStageEvents(24);
  ok("graduating is a notification", /Graduated from university with a degree in Law/.test(lastNote()), lastNote());
  ok("and asks about postgraduate study", s.pendingChoice && s.pendingChoice.title==="You've graduated");
  const o=opts(s).join(" | ");
  ok("a Master's and an MBA on offer at 24", /Master's/.test(o) && /MBA/.test(o), o);
  ok("not a PhD before a Master's", !/PhD/.test(o));
  ok("with costs and requirements shown", /smarts 60\+/.test(o) && /£/.test(o));
  choose("Master's"); ok("choosing one goes to funding", s.pendingChoice && /paying/i.test(s.pendingChoice.title));
  choose("Take a student loan"); ok("and enrols you", s.postgrad && s.postgrad.award==="Master's");
  // Finish it.
  s.postgrad.yearsLeft=1; T.runPostgradYear();
  ok("finishing is a notification", /Awarded a Master's/.test(lastNote()));
  ok("and now a PhD is offered", /PhD/.test(opts(s).join()), opts(s).join(" | "));
  ok("but not another Master's", !/Master's degree —/.test(opts(s).join()));
  const y=life(); y.age=22; y.education="degree"; y.degree="Law"; y.degreeEndsAge=22; y.stats.smarts=80; T.runStageEvents(22);
  ok("no MBA before 24", !/MBA/.test(opts(y).join()));
  const lo=life(); lo.age=24; lo.education="degree"; lo.degree="Law"; lo.degreeEndsAge=24; lo.stats.smarts=50; lo.money=0; T.runStageEvents(24);
  choose("Master's"); ok("too low for a Master's is a polite no", !lo.postgrad && !lo.pendingChoice);
  const emp=life(); emp.age=24; emp.education="degree"; emp.degree="Law"; emp.degreeEndsAge=24;
  emp.career={kind:"civilian",trackId:"retail",rankIndex:0,yearsInRank:0}; T.runStageEvents(24);
  ok("someone in work isn't told to look for it", !/look for work/i.test(opts(emp).join()) && /Carry on as you are/.test(opts(emp).join()));
  const all=life(); all.age=30; all.postgradAwards=["Master's","PhD","MBA"]; all.education="degree-finished"; all.career={};
  T.offerAfterQualification("postgrad"); ok("with every award held and a job, nothing to ask", !all.pendingChoice);
  all.career=null; T.offerAfterQualification("postgrad"); ok("out of work, it offers the job hunt", /look for work/i.test(opts(all).join()));
}
{
  // Going back as an adult: each stage leads to the next.
  const s=life(); s.age=35; s.education="left school"; s.stats.smarts=70; s.money=1e6; s.career=null;
  T.enrolReturnCourse(T.RETURN_COURSES.find(c=>c.id==="gcse"),null,"self"); s.studying.yearsLeft=1; T.runStudyingYear();
  ok("evening classes lead to an offer of college", /college diploma/i.test(opts(s).join()), opts(s).join(" | "));
  s.pendingChoice=null;
  T.enrolReturnCourse(T.RETURN_COURSES.find(c=>c.id==="college"),null,"self"); s.studying.yearsLeft=1; T.runStudyingYear();
  ok("a diploma leads to an offer of university", /university/i.test(opts(s).join()));
  choose("university"); ok("which goes to choosing a subject", s.pendingChoice && /subject/i.test(s.pendingChoice.title));
  s.pendingChoice=null; s.choiceQueue=[];
  T.enrolReturnCourse(Object.assign({},T.RETURN_COURSES.find(c=>c.id==="degree")),"Law","self"); s.studying.yearsLeft=1; T.runStudyingYear();
  ok("a degree leads to postgraduate options", s.pendingChoice && s.pendingChoice.title==="You've graduated");
  s.pendingChoice=null;
  T.enrolReturnCourse(Object.assign({},T.RETURN_COURSES.find(c=>c.id==="shortcourse"),{certificate:"it",label:"Short course"}),null,"self"); s.studying.yearsLeft=1; T.runStudyingYear();
  ok("a short course asks nothing", !s.pendingChoice);
}
{
  // A whole life from 17 to 25: every stage appears, in order, once.
  const seen=[];
  const s=life(); s.age=17; s.education="school"; s.stats.smarts=85; s.wealthTier="rich";
  for(let y=0;y<9;y++){
    T.ageUp();
    let g=0; while(s.pendingChoice && g++<20){
      const t=s.pendingChoice.title; seen.push(`${s.age}:${t}`);
      const pref = { "Leaving school":"college", "After college":"Apply to university", "Choosing a degree":"Law", "You've graduated":"look for work" }[t];
      if(!(pref && choose(pref))){ s.pendingChoice=null; T.advanceChoiceQueue(); }
    }
    s.choiceQueue=[];
  }
  const order=["18:Leaving school","21:After college","24:You've graduated"];
  ok("every stage appears in order", order.every(x=>seen.includes(x)), seen.join(", "));
  ok("each once", order.every(x=>seen.filter(y=>y===x).length===1));
  ok("ending at degree-finished", s.education==="degree-finished" && s.degree==="Law");
}

console.log(`verify_g: ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
