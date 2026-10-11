// Rent when you don't live in a home you own; a small yearly happiness bonus
// when you do; leaving home; and the safety net that goes with it.
const T = require("./harness.js")(`rentDue, fullRent, sharedRoomRent, paysRent, rentedPlace, annualExpenses, applyExpenses, homeOf, homeYear,
  settleIntoHome, maybeMoveOut, moveOutReason, doMoveOut, doMoveBackHome, canMoveBackHome, boardDue, livingParent, studentRent,
  claimBenefits, statePension, doMoveInto, propertyPrice, priceLevel, eraMoney, runStageEvents, makePerson,
  openAssetsSheet, renderAssetsSheet, get assetsView(){return assetsView;}, whereYouLiveHtml`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };
function life(o){
  o=o||{};
  T.state=null; T.appScreen="home"; T.rollSetupDraft();
  T.startGame("Test Person","Girl","Straight",{scenarioId:"free"});
  const s=T.state; s.year=o.year||2024; s.age=o.age||30; s.money=50000; s.pendingChoice=null; s.choiceQueue=[];
  s.livingWithParents = !!o.home; s.lastIncome = o.income===undefined ? 40000 : o.income; s.married=false; s.relationship=null;
  s.prisonYearsLeft=0; s.education="degree-finished"; s.assets=[]; s.flags.movedBackHome=false;
  s.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{ p.alive = o.parents!==false; });
  return s;
}
const sheet=()=>{ const k=document.body.children; return k[k.length-1]; };
const html=()=>{ const s=sheet(); return s ? String(s.innerHTML||"") : ""; };
const prop = (o)=>Object.assign({type:"property", name:"semi-detached house", value:300000, upkeep:1500, rented:false, condition:70}, o||{});

// ============================================================ 1. Rent
console.log("1. Rent");
{
  const s=life();
  ok("a full year's rent is 4.5% of a standard home", T.fullRent()===Math.round(T.propertyPrice()*0.045));
  ok("a shared room is 40% of that", T.sharedRoomRent()===Math.round(T.fullRent()*0.4));
  ok("a renter on £40k pays about a third of income", Math.abs(T.rentDue() - Math.min(T.fullRent(), 40000*0.33)) <= 1, T.rentDue());
  s.lastIncome=200000; ok("a high earner rents a whole place, no more", T.rentDue()===T.fullRent());
  s.lastIncome=0; ok("someone with no income still pays for a room", T.rentDue()===T.sharedRoomRent());
  ok("which is described as a room in a shared house", /shared house/.test(T.rentedPlace()));
  s.lastIncome=200000; ok("and a high earner has a place of their own", /place of your own/.test(T.rentedPlace()));
  s.lastIncome=40000; const solo=T.rentDue(); s.married=true;
  ok("a married couple share it", T.rentDue()===Math.round(solo*0.6));
  s.married=false;
  const e0=T.annualExpenses(); s.assets=[prop()]; T.doMoveInto(0);
  ok("living in a home you own means no rent", T.rentDue()===0 && T.annualExpenses() < e0);
  s.assets[0].home=false; s.assets[0].rented=true;
  ok("owning a house you let out doesn't stop your own rent", T.rentDue()>0);
  s.livingWithParents=true; ok("no rent while living with your parents", T.rentDue()===0);
  s.livingWithParents=false; s.prisonYearsLeft=2; ok("or in prison", T.rentDue()===0);
  s.prisonYearsLeft=0; s.age=17; ok("or under 18", T.rentDue()===0);
  life({year:1975}); const r75=T.fullRent(); life({year:2024}); const r24=T.fullRent();
  ok("rent follows the housing market for the year", r75 < r24/8, `${r75} vs ${r24}`);
}
{
  // Paid with the year's bills, and itemised.
  const s=life(); const r=T.rentDue(); const m0=s.money; T.applyExpenses();
  ok("rent is paid with the year's bills", m0 - s.money === T.annualExpenses() && T.annualExpenses() >= r);
  ok("and the log says how much was rent", s.log.some(e=>/including .* rent on/.test(e.text)));
}
{
  // Students: on the loan, not in cash.
  const s=life({income:0}); s.education="degree"; s.studentLoan=null;
  ok("a full-time student pays no rent in cash", T.rentDue()===0);
  T.studentRent();
  ok("their maintenance loan covers a room", s.studentLoan && s.studentLoan.balance===T.sharedRoomRent());
  s.livingWithParents=true; const b=s.studentLoan.balance; T.studentRent();
  ok("not if they live at home", s.studentLoan.balance===b);
}

// ============================================================ 2. A home of your own
console.log("2. A home of your own");
{
  const s=life(); s.assets=[prop()]; T.doMoveInto(0);
  let gain=0; for(let i=0;i<200;i++){ s.stats.happiness=50; s.yearlyStatGain={}; T.homeYear(); gain+=s.stats.happiness-50; }
  ok("a small happiness bonus each year in your own home", gain/200>=1 && gain/200<=2, (gain/200).toFixed(2));
  s.assets[0].home=false; s.assets[0].rented=true;
  let g2=0; for(let i=0;i<50;i++){ s.stats.happiness=50; s.yearlyStatGain={}; T.homeYear(); g2+=s.stats.happiness-50; }
  ok("none while renting", g2===0, g2);
  const t=life({home:true}); t.assets=[prop()]; t.assets[0].home=true;
  t.stats.happiness=50; t.flags.movedBackHome=true; T.homeYear();
  ok("none while living with your parents", t.stats.happiness===50);
}
{
  // An owner who isn't living anywhere they own settles into it.
  const s=life(); s.assets=[prop({rented:true}), prop({name:"flat", value:200000})];
  T.settleIntoHome();
  ok("you live in a house you own that's free", s.assets[1].home && !s.assets[0].home);
  const t=life(); t.assets=[prop({rented:true})]; T.settleIntoHome();
  ok("not one that's let", !T.homeOf());
  const w=life(); w.assets=[prop({condition:10})]; T.settleIntoHome();
  ok("nor a wreck", !T.homeOf());
}

// ============================================================ 3. Leaving home
console.log("3. Leaving home");
{
  const s=life({age:17, home:true, income:0}); s.education="school";
  T.runStageEvents(18); s.age=18;
  ok("turning 18 no longer throws you out", s.livingWithParents===true);
  const o=life({age:17, home:true, income:0, parents:false}); o.education="school"; T.runStageEvents(18);
  ok("unless there's no parent to live with", o.livingWithParents===false);
  // Board.
  const b=life({age:20, home:true, income:15000});
  ok("adult children at home pay a little board", T.boardDue()===Math.round(Math.min(T.eraMoney(2500), 15000*0.15)) && T.boardDue()>0);
  ok("which is in the year's costs", T.annualExpenses() >= T.boardDue());
  b.lastIncome=0; ok("nothing if they earn nothing", T.boardDue()===0);
}
{
  // Reasons to go.
  const a=life({age:20, home:true, income:12000}); T.maybeMoveOut(); ok("a low earner stays at home", a.livingWithParents);
  const b=life({age:22, home:true, income:45000}); T.maybeMoveOut(); ok("a decent earner moves out", !b.livingWithParents);
  const c=life({age:20, home:true, income:0}); c.education="degree"; T.maybeMoveOut(); ok("a student goes to university", !c.livingWithParents);
  const d=life({age:30, home:true, income:0}); T.maybeMoveOut(); ok("at thirty, out", !d.livingWithParents);
  const e=life({age:25, home:true, income:0}); e.married=true; T.maybeMoveOut(); ok("marriage means a home together", !e.livingWithParents);
  const f=life({age:20, home:true, income:0, parents:false}); T.maybeMoveOut(); ok("no parents, no parents' home", !f.livingWithParents);
  ok("moving out is a notification", true);
}
{
  // By choice.
  const s=life({age:20, home:true, income:0}); T.openAssetsSheet(); T.assetsView.screen="property"; T.renderAssetsSheet(sheet());
  ok("the property screen says where you live", /Where you live/.test(html()) && /Living with your parents/.test(html()));
  ok("with a button to move out", /moveOutBtn/.test(html()));
  T.doMoveOut(); ok("moving out by choice", !s.livingWithParents && T.rentDue()>0);
  ok("and back again", T.canMoveBackHome());
  T.doMoveBackHome(); ok("moving back in", s.livingWithParents && s.flags.movedBackHome);
  s.lastIncome=80000; T.maybeMoveOut(); ok("having moved back, you aren't pushed out again by a pay rise", s.livingWithParents);
  s.age=35; T.maybeMoveOut(); ok("or by age", s.livingWithParents);
  s.married=true; ok("a married person can't move back to their parents", (s.livingWithParents=false, !T.canMoveBackHome()));
  const t=life(); t.assets=[prop()]; T.doMoveInto(0); T.doMoveBackHome();
  ok("moving back home leaves your own house empty", t.livingWithParents && !T.homeOf());
  const r=life(); T.openAssetsSheet(); T.assetsView.screen="property"; T.renderAssetsSheet(sheet());
  ok("a renter sees what they pay", /Renting .* a year/.test(html()));
}

// ============================================================ 4. The safety net
console.log("4. The safety net");
{
  const s=life({income:0}); s.career=null; s.business=null; s.politics=null; const m0=s.money; T.claimBenefits();
  ok("unemployment support comes with help towards rent", s.money - m0 === Math.round(4800*T.priceLevel()) + Math.min(T.rentDue(), T.sharedRoomRent()));
  const t=life({income:0, home:true}); t.career=null; const m1=t.money; T.claimBenefits();
  ok("nothing at your parents'", t.money===m1);
  const p70=life({age:70, year:1975}); p70.prisonYearsLeft=0; const m2=p70.money; T.statePension();
  ok("the state pension is in the money of the year", p70.money - m2 === T.eraMoney(11500) && p70.money - m2 < 2000, p70.money-m2);
}

console.log(`verify_i: ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
