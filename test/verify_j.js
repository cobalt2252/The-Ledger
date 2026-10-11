// After emigrating: nothing in person with anyone or anything left behind,
// unless they come with you or follow later.
const T = require("./harness.js")(`doEmigrate, openEmigrationChoice, completeEmigration, isHere, isAbroad, abroadLabel, callVerb,
  doCallAbroad, doInviteToJoin, inviteChance, householdFor, relativesWhoCouldCome,
  personByRef, renderPersonPage, runPersonAction, doSpendTime, doSpendTimeWithEveryone, socialCircle, doGiftTier, doVisitGrave,
  doVisitLateGrave, renderLatePage, recordLate, openPeopleSheet, renderPeopleSheetContent,
  get peopleView(){return peopleView;}, set peopleView(v){peopleView=v;},
  offerNeglectedFriend, offerFriendInvitation, runEnemyYear, justForYou, makePerson, addFriend, makeEnemy,
  livingParent, canMoveBackHome, doMoveBackHome, maybeMoveOut, moveOutReason, homeOf, settleIntoHome, doMoveInto, rentDue,
  trackPartner, ageFamilyAndFriends, advanceChoiceQueue, emigrationCost, takeOffice, officeById, TRACKS, startAsChild, launchAdultChild`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };
const quiet=(v,f)=>{ const r=Math.random; Math.random=()=>v; try{ return f(); } finally { Math.random=r; } };
const sheet=()=>{ const k=document.body.children; return k[k.length-1]; };
const html=()=>{ const s=sheet(); return s ? String(s.innerHTML||"") : ""; };
function life(o){
  o=o||{};
  T.state=null; T.appScreen="home"; T.rollSetupDraft();
  T.startGame("Test Person","Girl","Straight",{scenarioId:"free", birthplace:"England"});
  const s=T.state; s.currentCountry="England"; s.birthplace="England"; s.year=2024; s.age=o.age||35; s.money=1e6;
  s.pendingChoice=null; s.choiceQueue=[]; s.yearlyActivityUses={}; s.actionsUsed=0; s.pendingActionId=null;
  s.livingWithParents=!!o.home; s.relationship=null; s.married=false; s.career=null; s.politics=null; s.business=null;
  s.children=[]; s.friends=[]; s.exes=[]; s.enemies=[]; s.late=[]; s.assets=[]; s.skills.languages=o.lang||0;
  s.family.forEach(p=>{ p.alive=true; p.closeness=60; delete p.country; });
  return s;
}
function partner(s, married){ s.relationship=T.makePerson("Partner","Boy",s.age); s.relationship.closeness=70; s.married=!!married; T.trackPartner(); return s.relationship; }
function child(s, age){ const c={ id:Math.floor(Math.random()*1e9), name:"Kid"+age, age, alive:true, bond:70, health:80, happiness:70, gender:"Girl" }; if(age>=18) c.adult=true; s.children.push(c); return c; }
function choice(){ return T.state.pendingChoice; }
function pickOpt(re){ const c=choice(); const o=c && c.options.find(x=>re.test(x.label)); T.state.pendingChoice=null; if(o) o.effect(); T.advanceChoiceQueue(); return !!o; }
function emigrate(name, re, rnd){ T.doEmigrate(name); return rnd===undefined ? pickOpt(re) : quiet(rnd, ()=>pickOpt(re)); }

// ============================================================ 1. The choice
console.log("1. Who comes with you");
{
  const s=life(); const r=partner(s,false); child(s,8); child(s,25);
  T.doEmigrate("Spain");
  const c=choice();
  ok("emigrating asks who comes", c && c.title==="Moving to Spain");
  const L=c.options.map(o=>o.label).join(" | ");
  ok("move with the household names them", /Move with .*Kid8/.test(L) && new RegExp(r.name.split(" ")[0]).test(L), L);
  ok("the family can be asked", /Ask the family to come too/.test(L));
  ok("an unmarried partner can be left", /Go without .* ends the relationship/.test(L));
  ok("or you can stay", /Stay where you are/.test(L));
  ok("and it says what you'd leave", /stay in England/.test(c.text) && /only keep in touch/.test(c.text));
  const m=s.money, used=s.actionsUsed;
  pickOpt(/Stay where you are/);
  ok("staying costs nothing", s.money===m && s.currentCountry==="England" && s.actionsUsed===used && !s.pendingActionId);
  const t=life(); partner(t,true); T.doEmigrate("Spain");
  ok("a spouse isn't left behind", !choice().options.some(o=>/Go without/.test(o.label)));
  const u=life(); u.family=[]; T.doEmigrate("Spain");
  ok("on your own, it says so", choice().options.some(o=>o.label==="Move on your own"));
}
{
  // Household move.
  const s=life({home:true}); const r=partner(s,true); const k=child(s,9), a=child(s,30);
  addFriendTo(s); const e=T.makeEnemy("a grudge");
  s.assets=[{type:"property", name:"a house", value:300000, upkeep:1, rented:false, home:true}];
  s.career={kind:"civilian", trackId:"retail", rankIndex:3, yearsInRank:0, training:null};
  s.business={ name:"Shop", valuation:50000, employees:1 };
  const cost=T.emigrationCost("Spain");
  emigrate("Spain", /^Move with/);
  ok("you're in Spain", s.currentCountry==="Spain");
  ok("your spouse and young children came", T.isHere(r) && T.isHere(k));
  ok("your parents and siblings stayed", s.family.every(p=>T.isAbroad(p) && p.country==="England"));
  ok("so did your grown-up child", T.isAbroad(a));
  ok("and your friends", s.friends.length && s.friends.every(f=>T.isAbroad(f)));
  ok("and your rivals", T.isAbroad(e));
  ok("your house is in England now", s.assets[0].country==="England" && !s.assets[0].home && !T.homeOf());
  ok("you no longer live with your parents", !s.livingWithParents);
  ok("your job stayed behind", s.career===null);
  ok("your business didn't", !!s.business);
  ok("and you pay rent in Spain", T.rentDue()>0);
}
function addFriendTo(s){ const f=T.addFriend(null, 70); return f; }
{
  // The family asked.
  const s=life(); const a=child(s,30);
  emigrate("Canada", /Ask the family/, 0.0);
  ok("relatives who say yes come too", s.family.every(p=>T.isHere(p)) && T.isHere(a));
  const t=life(); emigrate("Canada", /Ask the family/, 0.999);
  ok("relatives who say no stay", t.family.every(p=>T.isAbroad(p)));
  ok("the log says nobody wanted to", t.log.some(l=>/Nobody else in the family wanted to uproot/.test(l.text)));
}
{
  // Going without a partner.
  const s=life(); const r=partner(s,false);
  emigrate("Japan", /Go without/);
  T.trackPartner();
  ok("leaving a partner behind ends it", !s.relationship);
  ok("and they become an ex, in England", s.exes.some(x=>x.id===r.id && x.country==="England" && T.isAbroad(x)));
}
{
  // Politics, crime and the forces are tied to the place.
  const s=life(); s.age=40; T.takeOffice(T.officeById("councillor"));
  emigrate("France", /^Move/);
  ok("office ends", s.politics===null);
  const t=life(); t.career={kind:"civilian", trackId:"syndicate", rankIndex:2, yearsInRank:0, training:null, heat:0};
  emigrate("France", /^Move/); ok("so does a criminal career", t.career===null);
}
{
  const s=life({lang:60}); s.friends=[]; emigrate("Germany", /^Move/);
  ok("speaking the language means a new friend in the new country", s.friends.some(f=>T.isHere(f)));
}

// ============================================================ 2. People abroad
console.log("2. People left behind");
{
  const s=life(); const f=addFriendTo(s); const a=child(s,30); emigrate("Spain", /^Move/);
  const mum=s.family.find(p=>p.relation==="Mother");
  T.openPeopleSheet(); T.peopleView.person={kind:"family", id:mum.id}; T.renderPeopleSheetContent(sheet());
  const h=html();
  ok("their page says where they live", /Lives in England/.test(h));
  ok("with a call and an invitation", /data-pa="call"|call/.test(h) && /Ask them to move to Spain/.test(h));
  ok("and nothing in person", !/Spend time/.test(h) && !/Give a gift/.test(h) && !/Ask for money/.test(h));
  T.peopleView.person=null; T.peopleView.tab="family"; T.renderPeopleSheetContent(sheet());
  ok("the family list shows them abroad", /in England/.test(html()));
  // Every in-person action refuses.
  const c0=mum.closeness;
  ["time","talk","compliment","insult","money","argue"].forEach(act=>{ s.yearlyActivityUses={}; s.actionsUsed=0; T.runPersonAction("family", mum.id, act); });
  ok("no in-person action works", mum.closeness===c0 && !(s.yearlyActivityUses.social>0), `${c0}→${mum.closeness}`);
  T.doSpendTime(mum.id); ok("nor spending time directly", mum.closeness===c0);
  const m0=s.money; T.doGiftTier("family", mum.id, "good"); ok("nor a gift", s.money===m0 && mum.closeness===c0);
  T.runPersonAction("child", a.id, "visit"); ok("nor visiting a grown-up child", !(s.yearlyActivityUses.social>0));
  ok("spending time with everyone leaves them out", !T.socialCircle().some(p=>T.isAbroad(p)));
  // A call.
  s.yearlyActivityUses={}; s.actionsUsed=0; T.runPersonAction("family", mum.id, "call");
  ok("a call keeps you close", mum.closeness>c0 && s.yearlyActivityUses.social===1);
  ok("it's a video call today", T.callVerb().verb==="Video call them");
  s.year=1990; ok("a phone call in 1990", T.callVerb().verb==="Phone them");
  s.year=1955; ok("a letter in 1955", T.callVerb().verb==="Write to them");
  s.year=2024;
  // Friends abroad.
  T.openPeopleSheet(); T.peopleView.person={kind:"friend", id:f.id}; T.renderPeopleSheetContent(sheet());
  ok("a friend abroad can be called or let go", /Video call/.test(html()) && /Let the friendship go/.test(html()));
}
{
  // Asking them to come.
  const s=life(); emigrate("Spain", /^Move/);
  const dad=s.family.find(p=>p.relation==="Father");
  s.yearlyActivityUses={}; quiet(0.0, ()=>T.runPersonAction("family", dad.id, "invite"));
  ok("someone who agrees moves to be near you", T.isHere(dad));
  s.yearlyActivityUses={}; s.actionsUsed=0; const c0=dad.closeness; T.runPersonAction("family", dad.id, "time");
  ok("and then you can spend time with them", dad.closeness>c0);
  const mum=s.family.find(p=>p.relation==="Mother");
  s.yearlyActivityUses={}; quiet(0.999, ()=>T.runPersonAction("family", mum.id, "invite"));
  ok("someone who says no stays", T.isAbroad(mum));
  s.yearlyActivityUses={}; quiet(0.0, ()=>T.runPersonAction("family", mum.id, "invite"));
  ok("and can only be asked once a year", T.isAbroad(mum));
  ok("older parents are harder to move", T.inviteChance({closeness:80, relation:"Mother", age:75},"family") < T.inviteChance({closeness:80, relation:"Mother", age:55},"family"));
  ok("friends rarely uproot", T.inviteChance({closeness:80},"friend") < T.inviteChance({closeness:80, relation:"Sibling", age:30},"family"));
}
{
  // Living with parents, and coming home.
  const s=life({home:true, age:22}); emigrate("Australia", /^Move/);
  ok("you can't live with parents in another country", !s.livingWithParents && !T.livingParent() && !T.canMoveBackHome());
  T.doMoveBackHome(); ok("moving back in is refused", !s.livingWithParents);
  ok("the reason is clear", /parents in England/.test(T.moveOutReason()));
  s.money=1e6; s.yearlyActivityUses={}; s.actionsUsed=0;
  emigrate("England", /^Move/);
  ok("move back to England and they're here again", s.family.every(p=>T.isHere(p)) && T.canMoveBackHome());
}
{
  // Homes abroad.
  const s=life(); s.assets=[{type:"property", name:"a house", value:300000, upkeep:1, rented:false}];
  emigrate("Italy", /^Move/);
  T.settleIntoHome(); ok("you don't settle into a house in another country", !T.homeOf());
  T.doMoveInto(0); ok("or move into one", !s.assets[0].home);
  s.assets.push({type:"property", name:"a flat", value:200000, upkeep:1, rented:false});
  T.settleIntoHome(); ok("a home bought where you live is yours to live in", T.homeOf()===s.assets[1]);
}

// ============================================================ 3. What they can still do to you
console.log("3. Events, rivals and graves");
{
  const s=life(); const f=addFriendTo(s); f.lastContactAge=s.age-6; emigrate("Spain", /^Move/);
  s.pendingChoice=null; T.offerNeglectedFriend(); ok("a friend abroad doesn't turn up demanding your time", !s.pendingChoice);
  s.pendingChoice=null; T.offerFriendInvitation(); ok("or invite you out", !s.pendingChoice);
  ok("Just for you doesn't suggest catching up with them", !T.justForYou("people").concat(T.justForYou("activities")).some(j=>j.title.includes(f.name)));
  const e=T.makeEnemy("an old feud"); e.hostility=100; e.country="England";
  const hap=s.stats.happiness, hp=s.stats.health;
  for(let i=0;i<40;i++){ e.hostility=100; e.age=40; quiet(0.0001, ()=>T.runEnemyYear()); }
  ok("a rival abroad can't harm you", s.stats.happiness===hap && s.stats.health===hp, `${hap}->${s.stats.happiness}`);
}
{
  const s=life(); const mum=s.family.find(p=>p.relation==="Mother"); mum.alive=false; mum.ageAtDeath=70;
  emigrate("Spain", /^Move/);
  T.openPeopleSheet(); T.peopleView.person={kind:"family", id:mum.id}; T.renderPeopleSheetContent(sheet());
  ok("a grave in England is shown as such", /Buried in England/.test(html()) && !/Visit their grave/.test(html()));
  s.yearlyActivityUses={}; s.actionsUsed=0; T.doVisitGrave(mum.id); ok("and can't be visited", !(s.yearlyActivityUses.social>0));
  T.recordLate({kind:"friend", name:"Old Pal", relation:"Friend", ageAtDeath:40, cause:"x", country:"England"});
  const l=s.late[s.late.length-1];
  ok("a friend who died in England is buried there", /Buried in England/.test(T.renderLatePage("friend", l)));
  T.doVisitLateGrave("friend", l.id); ok("out of reach too", !(s.yearlyActivityUses.social>0));
}

{
  // Spending time with everyone, with a grown-up child abroad.
  const s=life(); const a=child(s,30); emigrate("Spain", /^Move/);
  s.yearlyActivityUses={}; s.actionsUsed=0; const b0=a.bond; T.doSpendTimeWithEveryone();
  ok("a grown-up child abroad isn't in the rounds", a.bond===b0);
}
{
  // The next generation carries on where the heir lives.
  const s=life(); const a=child(s,30); T.launchAdultChild(a); const b=child(s,28); T.launchAdultChild(b);
  emigrate("Spain", /^Move/);
  ok("both grown-up children stayed in England", T.isAbroad(a) && T.isAbroad(b));
  s.alive=false; T.startAsChild(a.id);
  const n=T.state;
  ok("an heir who stayed in England carries on there", n.currentCountry==="England");
  const sib=n.family.find(p=>p.relation==="Sibling");
  ok("with their sibling, also in England, close at hand", sib && T.isHere(sib));
  const late=n.family.find(p=>p.alive===false);
  ok("and the parent who emigrated buried in Spain", late && late.country==="Spain" && T.isAbroad(late));
  ok("earning and spending at English rates", n.emigrationMultipliers.salaryMult===1 && n.emigrationMultipliers.costMult===1);
  const t=life(); const k=child(t,10); emigrate("Spain", /^Move/); k.age=30; T.launchAdultChild(k); t.alive=false; T.startAsChild(k.id);
  ok("an heir raised in Spain carries on in Spain", T.state.currentCountry==="Spain");
  ok("at Spanish rates", T.state.emigrationMultipliers.salaryMult!==1 || T.state.emigrationMultipliers.costMult!==1);
}

console.log(`verify_j: ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
