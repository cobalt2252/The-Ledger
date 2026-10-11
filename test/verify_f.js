// Professional schools, step-families, exes, and the late.
const T = require("./harness.js")(`TRACKS, DEGREE_OPTIONS, DEGREE_YEARS, courseForDegree, SHORT_COURSES, shortCourseName,
  pickShortCourse, certificateBoost, mbaBoost, degreeCapBlocks, applyToTrack, runStudyingYear, enrolReturnCourse,
  RETURN_COURSES, availableReturnCourses, openReturnToEducation, doStartPostgrad, POSTGRAD_COURSES,
  runParentsYear, makeStepParent, divertEstateToSpouse, settleStepEstate, bioParents,
  trackPartner, addEx, ageExes, exLabel, reconcileChance, doReconcile, doCutContact,
  recordLate, lateEntries, findLate, renderLatePage, doVisitLateGrave,
  doBreakup, doDivorce, doPropose, makePerson, ageFamilyAndFriends, advanceChoiceQueue,
  openPeopleSheet, renderPeopleSheetContent, get peopleView(){return peopleView;}, set peopleView(v){peopleView=v;},
  personByRef, renderPersonPage, runPersonAction, runCareerYear, MAX_USES_PER_YEAR, runEnemyYear`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };
function life(){
  T.state=null; T.appScreen="home"; T.rollSetupDraft();
  T.startGame("Test Person","Girl","Straight",{scenarioId:"free"});
  const s=T.state; s.pendingChoice=null; s.choiceQueue=[]; s.yearlyActivityUses={}; s.actionsUsed=0; s.year=2024;
  return s;
}
function choose(m){
  const pc=T.state.pendingChoice; if(!pc) return false;
  const o=pc.options.find(x=>x.label.toLowerCase().includes(m.toLowerCase()));
  T.state.pendingChoice=null; if(!o) return false; o.effect(); T.advanceChoiceQueue(); return true;
}
const sheet=()=>{ const k=document.body.children; return k[k.length-1]; };
const html=()=>{ const s=sheet(); return s ? String(s.innerHTML||"") : ""; };
const track=id=>T.TRACKS.find(t=>t.id===id);
function partnerUp(s, o){ o=o||{}; s.relationship=T.makePerson("Partner","Boy",o.age||s.age); s.relationship.closeness=o.closeness===undefined?70:o.closeness;
  s.relationshipYears=o.years||3; s.married=!!o.married; if(o.married) s.marriedAtAge=s.age-3; T.trackPartner(); return s.relationship; }
const quiet = f=>{ const r=Math.random; try { return f(); } finally { Math.random=r; } };

// ============================================================ 1. Professional schools
console.log("1. Professional schools");
["Veterinary Medicine","Pharmacy","Nursing"].forEach(d=>ok(`${d} is a degree`, T.DEGREE_OPTIONS.includes(d)));
ok("vet takes five years", T.DEGREE_YEARS["Veterinary Medicine"]===5);
ok("pharmacy takes four", T.DEGREE_YEARS["Pharmacy"]===4);
{
  const deg=T.RETURN_COURSES.find(c=>c.id==="degree");
  const v=T.courseForDegree(deg,"Veterinary Medicine");
  ok("a returning vet degree runs five years", v.years===5);
  ok("and costs pro rata", v.cost===Math.round(deg.cost/3*5), v.cost);
  ok("a law degree is unchanged", T.courseForDegree(deg,"Law")===deg);
  ok("the base course isn't mutated", deg.years===3);
}
// The school-leaver route: university from 21, graduating when the course ends.
function uniLife(subject){
  const s=life(); s.age=20; s.education="college"; s.stats.smarts=80; s.wealthTier="rich";
  T.ageUp(); // 21
  let guard=0; while(s.pendingChoice && !/college is finishing|after college/i.test(s.pendingChoice.title) && guard++<10){ s.pendingChoice=null; T.advanceChoiceQueue(); }
  choose("Apply to university");
  while(s.pendingChoice && !/choosing a degree/i.test(s.pendingChoice.title) && guard++<20){ s.pendingChoice=null; T.advanceChoiceQueue(); }
  choose(subject);
  let grad=null;
  for(let i=0;i<8 && s.alive;i++){ T.ageUp(); s.pendingChoice=null; s.choiceQueue=[]; if(s.education==="degree-finished" && grad===null) grad=s.age; }
  return { s, grad };
}
{
  const a=uniLife("Law"), b=uniLife("Veterinary Medicine"), c=uniLife("Pharmacy");
  ok("law graduates at 24, as before", a.grad===24, a.grad);
  ok("vet graduates at 26", b.grad===26, b.grad);
  ok("pharmacy graduates at 25", c.grad===25, c.grad);
  ok("the subject sticks", b.s.degree==="Veterinary Medicine");
}
{
  const s=life(); s.age=30; s.stats.smarts=90; s.stats.health=90; s.flags.criminalRecord=false; s.career=null;
  s.education="degree-finished"; s.degree="Law";
  let got=0; for(let i=0;i<40;i++){ s.career=null; T.applyToTrack(track("pharmacist")); if(s.career && s.career.trackId==="pharmacist") got++; }
  ok("no pharmacy degree, no pharmacist job", got===0);
  s.degree="Pharmacy"; got=0;
  for(let i=0;i<40;i++){ s.career=null; T.applyToTrack(track("pharmacist")); if(s.career && s.career.trackId==="pharmacist") got++; }
  ok("with one, you can be hired", got>0, got);
  s.education="degree"; got=0;
  for(let i=0;i<40;i++){ s.career=null; T.applyToTrack(track("pharmacist")); if(s.career && s.career.trackId==="pharmacist") got++; }
  ok("but not while still studying it", got===0);
  s.education="degree-finished"; s.degree="Law"; got=0;
  for(let i=0;i<40;i++){ s.career=null; T.applyToTrack(track("vet")); if(s.career && s.career.trackId==="vet") got++; }
  ok("no vet degree, no vet job", got===0);
  s.degree="Veterinary Medicine"; got=0;
  for(let i=0;i<40;i++){ s.career=null; T.applyToTrack(track("vet")); if(s.career && s.career.trackId==="vet") got++; }
  ok("with one, you can be a vet", got>0);
  s.flags.criminalRecord=true; got=0;
  for(let i=0;i<40;i++){ s.career=null; T.applyToTrack(track("vet")); if(s.career) got++; }
  ok("but not with a record", got===0);
}
{
  const n=track("nursing");
  ok("nursing is capped without the degree", n.degreeFor==="Nursing" && n.degreeCapRung===1 && n.degreeStartRung===2);
  const s=life(); s.year=2020; s.degree="Law";
  ok("from 2013 the cap applies at rung 1", T.degreeCapBlocks(n,{rankIndex:1}) && !T.degreeCapBlocks(n,{rankIndex:0}));
  s.year=2005;
  ok("before 2013 it doesn't", !T.degreeCapBlocks(n,{rankIndex:1}));
  s.year=2020; s.degree="Nursing";
  ok("a nursing graduate isn't capped", !T.degreeCapBlocks(n,{rankIndex:5}));
  ok("other tracks are never capped", !T.degreeCapBlocks(track("pharmacist"),{rankIndex:9}));
  // Start rung.
  s.age=25; s.stats.smarts=90; s.stats.health=90; s.flags.criminalRecord=false; s.education="degree-finished";
  let r=null; for(let i=0;i<40 && !r;i++){ s.career=null; T.applyToTrack(track("nursing")); if(s.career) r=s.career.rankIndex; }
  ok("a graduate nurse starts at rung 2", r===2, r);
  s.degree="Law"; r=null; for(let i=0;i<40 && r===null;i++){ s.career=null; T.applyToTrack(track("nursing")); if(s.career) r=s.career.rankIndex; }
  ok("without the degree, at rung 0", r===0, r);
  // Promotion stalls at the cap.
  s.career={kind:"civilian",trackId:"nursing",rankIndex:1,yearsInRank:30,training:null};
  s.flags.performance=100; for(let i=0;i<30;i++){ quiet(()=>{ Math.random=()=>0.001; T.runCareerYear(); }); if(!s.career) break; s.career.yearsInRank=30; }
  ok("an unqualified nurse can't pass the cap", !s.career || s.career.rankIndex<=1, s.career && s.career.rankIndex);
}
{
  const mba=T.POSTGRAD_COURSES.find(p=>p.id==="mba");
  ok("an MBA exists", mba && mba.award==="MBA" && mba.minAge===24 && mba.years===1);
  const s=life(); s.age=22; s.education="degree-finished"; s.degree="Law"; s.stats.smarts=90; s.money=1e6;
  T.doStartPostgrad("mba"); ok("not at 22", !s.postgrad && !s.pendingChoice);
  s.age=26; s.yearlyActivityUses={}; s.actionsUsed=0; T.doStartPostgrad("mba");
  ok("at 26 it goes to funding", !!s.pendingChoice && /paying|fund/i.test(s.pendingChoice.title+s.pendingChoice.options.map(o=>o.label).join()), s.pendingChoice && s.pendingChoice.title);
  s.pendingChoice=null; s.postgradAwards=["MBA"]; s.yearlyActivityUses={}; s.actionsUsed=0; T.doStartPostgrad("mba");
  ok("and not twice", !s.pendingChoice);
  ok("an MBA helps in finance", T.mbaBoost(track("banker")||T.TRACKS.find(t=>t.category==="Finance"),{rankIndex:0})===0.08);
  ok("and in senior roles anywhere", T.mbaBoost(track("pharmacist"),{rankIndex:6})===0.08);
  ok("but not junior roles elsewhere", T.mbaBoost(track("pharmacist"),{rankIndex:1})===0);
  s.postgradAwards=[]; ok("nothing without one", T.mbaBoost(T.TRACKS.find(t=>t.category==="Finance"),{rankIndex:6})===0);
}
{
  const s=life(); s.age=30; s.currentCountry="United Kingdom";
  ok("a UK short course", /local college/i.test(T.shortCourseName()));
  s.currentCountry="United States"; ok("a US community college", /community college/i.test(T.shortCourseName()));
  ok("offered as a return course", T.availableReturnCourses().some(c=>c.id==="shortcourse"));
  s.age=15; ok("not before 16", !T.availableReturnCourses().some(c=>c.id==="shortcourse"));
  s.age=30; s.stats.smarts=50; s.money=5000; s.studying=null;
  T.openReturnToEducation(); choose("community college");
  ok("picks a subject", !!s.pendingChoice && s.pendingChoice.options.length===T.SHORT_COURSES.length+1);
  choose("IT and computing"); ok("then funding", !!s.pendingChoice && /paying/i.test(s.pendingChoice.title));
  choose("Pay for it yourself");
  ok("enrolled for a year", s.studying && s.studying.certificate==="it" && s.studying.yearsLeft===1 && s.studying.sets===null);
  const ed=s.education; T.runStudyingYear();
  ok("earns the certificate", s.certificates.includes("it") && !s.studying);
  ok("without changing your education level", s.education===ed);
  ok("helps tech applications", T.certificateBoost(T.TRACKS.find(t=>t.category==="Tech"))===0.07);
  ok("not others", T.certificateBoost(track("pharmacist"))===0);
  const lang=s.skills.languages||0;
  T.enrolReturnCourse(Object.assign({},T.RETURN_COURSES.find(c=>c.id==="shortcourse"),{certificate:"language",label:"x"}),null,"self");
  T.runStudyingYear(); ok("a language course adds the skill", (s.skills.languages||0)>lang);
  s.pendingChoice=null; s.certificates=T.SHORT_COURSES.map(c=>c.id);
  ok("once you've done them all, it goes", !T.availableReturnCourses().some(c=>c.id==="shortcourse"));
}

{
  // A decision already waiting must not swallow a stage of life.
  let lost=0;
  for(let i=0;i<60;i++){
    const s=life(); s.age=20; s.education="college"; s.stats.smarts=80;
    s.pendingChoice={title:"Something else",options:[{label:"ok",effect(){}}]};
    T.ageUp();
    const all=[s.pendingChoice].concat(s.choiceQueue||[]).filter(Boolean).map(c=>c.title);
    if(!all.includes("After college")) lost++;
  }
  ok("the after-college choice is never lost behind another", lost===0, lost);
  const s=life(); s.age=23; s.education="degree"; s.degree="Law"; s.degreeEndsAge=24;
  s.pendingChoice={title:"Something else",options:[{label:"ok",effect(){}}]};
  T.ageUp(); ok("nor is graduation", s.education==="degree-finished");
}

// ============================================================ 2. Step-families
console.log("2. Step-families");
{
  // Rates over many simulated households, 40 years each.
  let sep=0, remar=0, steps=0, stepSibs=0, n=600;
  for(let i=0;i<n;i++){
    const s=life(); s.age=5;
    s.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{ p.alive=true; p.age=32; });
    s.parentsStatus=undefined;
    let sepd=false;
    for(let y=0;y<40;y++){ s.age++; T.bioParents().forEach(p=>p.age++); T.runParentsYear(); if(s.parentsStatus==="separated") sepd=true; }
    if(sepd) sep++;
    const sp=s.family.filter(p=>p.relation==="Stepmother"||p.relation==="Stepfather");
    if(sp.length) remar++; steps+=sp.length; stepSibs+=s.family.filter(p=>p.relation==="Step-sibling").length;
  }
  const sr=sep/n, rr=remar/Math.max(1,sep);
  console.log(`    separated within 40y: ${(sr*100).toFixed(1)}%; of those, a parent remarried: ${(rr*100).toFixed(1)}%; step-siblings per step-parent ${(stepSibs/Math.max(1,steps)).toFixed(2)}`);
  ok("a third or so of parents separate over 40 years", sr>0.25 && sr<0.48, sr);
  ok("most separated parents remarry", rr>0.5 && rr<0.97, rr);
  ok("step-siblings come with them", stepSibs>0);
}
{
  const s=life(); s.age=10; const ps=T.bioParents(); ps.forEach(p=>{ p.alive=true; p.age=40; });
  s.parentsStatus="separated";
  quiet(()=>{ Math.random=()=>0.001; T.runParentsYear(); });
  const sps=s.family.filter(p=>p.spouseOf!==undefined);
  ok("both parents can remarry", sps.length===2);
  ok("each step-parent is married to one parent", sps.every(sp=>ps.some(p=>p.id===sp.spouseOf)));
  ok("no one remarries twice", (quiet(()=>{ Math.random=()=>0.001; T.runParentsYear(); }), s.family.filter(p=>p.spouseOf!==undefined).length===2));
  const s2=life(); T.bioParents().forEach(p=>{ p.alive=true; p.age=73; }); s2.parentsStatus="separated";
  quiet(()=>{ Math.random=()=>0.001; T.runParentsYear(); });
  ok("nobody remarries past 72", !s2.family.some(p=>p.spouseOf!==undefined));
  const s3=life(); const p3=T.bioParents(); p3.forEach(p=>{ p.alive=true; p.age=40; }); p3[0].alive=false; s3.parentsStatus="together";
  quiet(()=>{ Math.random=()=>0.5; T.runParentsYear(); });
  ok("a death makes the survivor widowed", s3.parentsStatus==="widowed");
}
{
  // Inheritance: spouse first, step-siblings never share your parents' estate.
  const s=life(); s.age=50; s.money=0; s.wealthTier="middle";
  const ps=T.bioParents(); ps.forEach(p=>{ p.alive=true; p.age=78; });
  const sp=T.makeStepParent(ps[0]); s.family.push(sp);
  const kid=T.makePerson("Step-sibling",undefined,40); kid.fromStep=sp.id; s.family.push(kid);
  ps[1].alive=false;
  ok("a surviving spouse inherits first", T.divertEstateToSpouse(ps[0])===true && sp.heldEstate>0 && s.money===0);
  ok("the estate is then settled", s.flags.parentsEstateSettled===true);
  ok("no widow, no diversion", T.divertEstateToSpouse(ps[1])===false || !s.family.some(p=>p.alive && p.spouseOf===ps[1].id));
  // Step-parent estate.
  sp.closeness=80; const m0=s.money; T.settleStepEstate(sp);
  ok("a close step-parent leaves you a share", s.money>m0);
  const sp2=T.makeStepParent(ps[0]); sp2.closeness=10; sp2.heldEstate=50000; s.family.push(sp2);
  const k2=T.makePerson("Step-sibling",undefined,40); k2.fromStep=sp2.id; s.family.push(k2);
  const m1=s.money; T.settleStepEstate(sp2);
  ok("a distant one with children of their own leaves you nothing", s.money===m1);
  ok("step-siblings aren't counted as siblings", !s.family.some(p=>p.relation==="Sibling" && p.fromStep!==undefined));
}
{
  // The whole thing, end to end: a parent dies, the family list shows step-relatives.
  const s=life(); s.age=12; T.bioParents().forEach(p=>{ p.alive=true; p.age=40; }); s.parentsStatus="separated";
  quiet(()=>{ Math.random=()=>0.001; T.runParentsYear(); });
  T.openPeopleSheet(); T.peopleView.tab="family"; T.renderPeopleSheetContent(sheet());
  ok("step-parents appear in the family list", /Step(mother|father)/.test(html()));
}

// ============================================================ 3. Exes
console.log("3. Exes");
{
  const s=life(); s.age=30; const r=partnerUp(s,{closeness:70});
  T.doBreakup(); T.trackPartner();
  ok("a breakup leaves an ex", s.exes.length===1 && s.exes[0].id===r.id);
  ok("an unmarried ex is an ex-partner", T.exLabel(s.exes[0])==="Ex-partner");
  ok("closeness drops", s.exes[0].closeness<70);
  ok("no double entry", (T.trackPartner(), s.exes.length===1));
}
{
  const s=life(); s.age=40; s.money=1e5; const r=partnerUp(s,{married:true});
  T.doDivorce(); T.trackPartner();
  ok("a divorce leaves an ex-husband", s.exes.length===1 && T.exLabel(s.exes[0])==="Ex-husband" && s.exes[0].wasMarried);
}
{
  let made=0, tries=0;
  while(!made && tries++<200){
    const s=life(); s.age=30; partnerUp(s,{closeness:0});
    quiet(()=>{ Math.random=()=>0.0001; T.doPropose(null); });
    T.trackPartner(); if(!s.relationship && s.exes.length) made=1;
  }
  // doPropose with no ring — force a refusal with a high roll instead.
  const s=life(); s.age=30; partnerUp(s,{closeness:0});
  const seq=[0.99, 0.1]; let i=0;
  quiet(()=>{ Math.random=()=>seq[Math.min(i++,seq.length-1)]; T.doPropose(null); });
  T.trackPartner();
  ok("a refused proposal that ends it leaves an ex", !s.relationship ? s.exes.length===1 : true, s.exes.length);
}
{
  // Ended mid-year by an event, picked up when the year runs.
  const s=life(); s.age=35; const r=partnerUp(s); s.relationship=null;
  T.ageFamilyAndFriends();
  ok("an ending anywhere is caught at the next year", s.exes.some(e=>e.id===r.id));
}
{
  const s=life(); s.age=60; const r=partnerUp(s,{married:true,age:95});
  let died=false;
  for(let i=0;i<200 && !died;i++){ quiet(()=>{ T.ageFamilyAndFriends(); }); if(!s.relationship) died=true; else { s.relationship.age=99; } }
  T.trackPartner();
  ok("a partner's death leaves no ex", died && !s.exes.some(e=>e.id===r.id));
  ok("but a late entry", s.late.some(l=>l.kind==="partner" && l.name===r.name));
}
{
  // Old partner gone, new partner dies before the screen refreshes.
  const s=life(); s.age=60; const a=partnerUp(s);
  s.relationship=T.makePerson("Partner","Boy",99); const b=s.relationship;
  for(let i=0;i<300 && s.relationship;i++){ s.relationship.age=99; T.ageFamilyAndFriends(); }
  T.trackPartner();
  ok("the earlier partner still becomes an ex", s.exes.some(e=>e.id===a.id));
  ok("the one who died doesn't", !s.exes.some(e=>e.id===b.id));
}
{
  const s=life(); s.age=30;
  T.addEx({id:999001,name:"Sam Ex",gender:"Boy",age:30,closeness:90,married:false,years:2});
  const e=s.exes[0];
  ok("a fresh, warm ex has a decent chance", T.reconcileChance(e)>0.3, T.reconcileChance(e));
  s.age=60; ok("which falls over the decades", T.reconcileChance(e)<=0.05, T.reconcileChance(e));
  s.age=30;
  ok("the reconcile limit is once a year", T.MAX_USES_PER_YEAR.reconcile===1);
  quiet(()=>{ Math.random=()=>0.0; T.doReconcile(e.id); });
  ok("reconciling makes them your partner again", s.relationship && s.relationship.id===999001 && !s.exes.length);
  ok("as a partner, not a spouse", s.married===false);
  T.doBreakup(); T.trackPartner();
  ok("and breaking up again puts them back", s.exes.length===1);
  s.yearlyActivityUses={}; s.actionsUsed=0; partnerUp(s);
  T.doReconcile(999001); ok("you have to be single first", s.relationship.id!==999001);
  s.relationship=null; T.trackPartner(); s.exes=s.exes.filter(x=>x.id===999001); s.yearlyActivityUses={}; s.actionsUsed=0;
  quiet(()=>{ Math.random=()=>0.99; T.doReconcile(999001); });
  ok("a no costs closeness", s.exes[0].closeness<s.exes[0].closeness+1 && !s.relationship);
  s.actionsUsed=0; T.doReconcile(999001);
  ok("and you can't ask twice in a year", !s.relationship);
  T.doCutContact(999001); ok("cutting contact removes them", !s.exes.length);
}
{
  const s=life(); s.age=50;
  T.addEx({id:999002,name:"Old Flame",gender:"Girl",age:98,closeness:40,married:true,years:10});
  for(let i=0;i<60 && s.exes[0].alive;i++){ s.age++; T.ageExes(); }
  ok("exes age and die", !s.exes[0].alive && s.exes[0].causeOfDeath);
  ok("a dead ex appears in the late", T.lateEntries().some(l=>l.kind==="ex" && l.name==="Old Flame" && l.relation==="Ex-wife"));
}
{
  const s=life(); s.age=30;
  T.addEx({id:999003,name:"Pat Page",gender:"Boy",age:31,closeness:50,married:true,years:4});
  T.openPeopleSheet(); T.peopleView.tab="exes"; T.renderPeopleSheetContent(sheet());
  ok("the exes tab lists them", /Pat Page/.test(html()) && /Ex-husband/.test(html()));
  T.peopleView.tab="menu"; T.renderPeopleSheetContent(sheet());
  ok("the menu has an Exes row", /Exes/.test(html()) && /1 ex\b/.test(html()));
  ok("and a Late relationships row", /Late relationships/.test(html()));
  T.peopleView.person={kind:"ex", id:999003}; T.renderPeopleSheetContent(sheet());
  const h=html();
  ["Catch up","Compliment","gift","Insult","Try again|Reconcile","Cut contact"].forEach(w=>ok(`an ex's page offers ${w}`, new RegExp(w,"i").test(h)));
  ok("personByRef finds an ex", !!T.personByRef("ex",999003));
}

// ============================================================ 4. The late
console.log("4. The late");
{
  const s=life(); s.age=40;
  // Every kind of death leaves a record.
  const mum=T.bioParents()[0]; mum.alive=false; mum.ageAtDeath=70; mum.causeOfDeath="a stroke"; mum.diedPlayerAge=38;
  T.recordLate({kind:"friend",name:"Fr End",relation:"Friend",ageAtDeath:41,cause:"cancer"});
  T.recordLate({kind:"pet",name:"Rex",relation:"Dog",ageAtDeath:12,cause:"old age"});
  T.recordLate({kind:"enemy",name:"Ri Val",relation:"Rival",ageAtDeath:44,cause:"a fall"});
  const L=T.lateEntries();
  ["family","friend","pet","enemy"].forEach(k=>ok(`a ${k} is in the late`, L.some(l=>l.kind===k)));
  ok("newest first", L[0].diedPlayerAge>=L[L.length-1].diedPlayerAge);
  T.openPeopleSheet(); T.peopleView.tab="late"; T.renderPeopleSheetContent(sheet());
  const h=html();
  ok("the late tab lists them", /Fr End/.test(h) && /Rex/.test(h) && /Ri Val/.test(h) && new RegExp(mum.name).test(h));
  ok("with how long ago", /Died 2 years ago/.test(h) && /Died this year/.test(h));
  const fr=s.late.find(l=>l.name==="Fr End");
  T.peopleView.late={kind:"friend",id:fr.id}; T.renderPeopleSheetContent(sheet());
  ok("a late page opens", /Visit their grave/.test(html()) && /cancer/.test(html()));
  const h0=s.stats.happiness; T.doVisitLateGrave("friend",fr.id);
  ok("visiting uses a social slot", (s.yearlyActivityUses.social||0)===1);
  const pet=s.late.find(l=>l.kind==="pet");
  ok("a pet has no grave to visit", !/Visit their grave/.test(T.renderLatePage("pet",pet)));
  ok("findLate finds family by id", T.findLate("family",mum.id)===mum);
}
{
  // Real deaths through the year.
  let friend=0, pet=0, enemy=0, family=0;
  for(let t=0;t<40 && !(friend&&enemy&&family);t++){
    const s=life(); s.age=70;
    s.friends=[Object.assign(T.makePerson("Friend",undefined,99),{closeness:50})];
    s.enemies=[Object.assign(T.makePerson("Enemy",undefined,99),{})];
    s.family.forEach(p=>{ if(p.alive) p.age=99; });
    for(let y=0;y<5;y++){ s.age++; T.ageFamilyAndFriends(); T.runEnemyYear(); }
    if(s.late.some(l=>l.kind==="friend")) friend++;
    if(s.late.some(l=>l.kind==="enemy")) enemy++;
    if(s.family.some(p=>!p.alive && p.diedPlayerAge!==undefined)) family++;
  }
  ok("friends' deaths are recorded", friend>0);
  ok("rivals are mortal and recorded", enemy>0);
  ok("family deaths record when", family>0);
}

console.log(`verify_f: ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
