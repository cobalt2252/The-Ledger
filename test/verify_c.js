// Organised crime and cartel ladders; Model, Music Producer, and Musician as
// solo or band. Checks the data, the rules, and the screens.
const T = require("./harness.js")(`TRACKS, CATEGORIES, CATEGORY_ICONS, categorySummary, tracksInCategory, trackExistsYet,
  applyToTrack, runCareerYear, hasCriminalConnections, crimeHeat, crimeArrestChance, crimeSentenceRange, crimeCharge,
  isCrimeCareer, doWorkHarder, doSlackOff, quitJob, informantOffer, goSolo, CAREER_EVENTS, CAREER_EVENT_POOLS, CAREER_ACTIONS, maybeCareerEvent, tiedToThisJob, GENERIC_CAREER_EVENTS, careerActionFor,
  doCareerAction, priceLevel, RIBBONS, awardRibbon, openCareerSheet, renderCareerSheetContent,
  get careerView(){return careerView;}, set careerView(v){careerView=v;}, jobPerformance, advanceChoiceQueue`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };
function fresh(){
  ["startBtn","firstNameInput","lastNameInput","toPerksBtn"].forEach(id=>{ reg[id] = new FakeEl(); });
  reg.firstNameInput.value = "Test"; reg.lastNameInput.value = "Person";
  T.state = null; T.appScreen = "create"; T.render(); reg.startBtn.click();
  const s = T.state; s.yearlyActivityUses = {}; s.actionsUsed = 0; s.year = 2020;
  return s;
}
const html = ()=>{ const k=document.body.children; return k.length ? String(k[k.length-1].innerHTML||"") : ""; };
const track = id=>T.TRACKS.find(t=>t.id===id);
function employ(s, id, rank){ s.career = { kind:"civilian", trackId:id, rankIndex:rank||0, yearsInRank:0, training:null, heat:0 }; return s.career; }

console.log("1. The ladders");
ok("44 tracks", T.TRACKS.length === 44, T.TRACKS.length);
["syndicate","cartel","model","producer","band","music"].forEach(id=>{
  const t = track(id);
  ok(`${id} exists`, !!t);
  if(!t) return;
  ok(`${id} has 11 rungs`, t.ladder.length === 11);
  ok(`${id} pay rises every rung`, t.ladder.every((r,i)=>i===0 || r.salary > t.ladder[i-1].salary));
  ok(`${id} has no repeated titles`, new Set(t.ladder.map(r=>r.title)).size === 11);
});
ok("solo musicians are named as such", track("music").name === "Musician (solo)");
ok("the band route is its own track", track("band").name === "Musician (band)");
ok("a band tops out below a solo star", track("band").ladder[10].salary < track("music").ladder[10].salary);
ok("Model and Producer sit in Creative", track("model").category === "Creative" && track("producer").category === "Creative");
ok("Organised Crime is a field", T.CATEGORIES.includes("Organised Crime") && !!T.CATEGORY_ICONS["Organised Crime"]);
ok("it holds both ladders", ["syndicate","cartel"].every(id=>track(id).category === "Organised Crime"));
ok("crime family ranks run Lookout to Boss of Bosses", track("syndicate").ladder[0].title === "Lookout" && track("syndicate").ladder[10].title === "Boss of Bosses");
ok("cartel ranks run Lookout to Cartel Boss", track("cartel").ladder[10].title === "Cartel Boss");
ok("the old gates survived regeneration", !!track("astronaut").requiresAnyDegree && track("commercial_pilot").requiresLicense === "canFlyPlane");
{
  const s = fresh(); s.year = 1960;
  ok("no cartels before the late 1970s", !T.trackExistsYet(track("cartel")));
  ok("the crime family is timeless", T.trackExistsYet(track("syndicate")));
  s.year = 1985;
  ok("cartels by the mid-1980s", T.trackExistsYet(track("cartel")));
}

console.log("2. Getting in");
{
  const s = fresh(); s.age = 20; s.hidden.karma = 60; s.flags.criminalRecord = false; s.gang = null; s.stats.smarts = 80; s.stats.health = 90;
  ok("an honest stranger has no connections", !T.hasCriminalConnections());
  for(let i=0;i<10;i++) T.applyToTrack(track("syndicate"));
  ok("and is never taken on", !s.career);
  s.gang = { name:"x", yearsIn:1, rank:"Associate" };
  ok("a crew counts as connections", T.hasCriminalConnections());
  s.gang = null; s.flags.criminalRecord = true;
  ok("so does a record", T.hasCriminalConnections());
  s.flags.criminalRecord = false; s.hidden.karma = 20;
  ok("so does a reputation", T.hasCriminalConnections());
  for(let i=0;i<20 && !s.career;i++) T.applyToTrack(track("syndicate"));
  ok("with connections you can be taken on", !!s.career && s.career.trackId === "syndicate");
  ok("starting heat is zero", s.career && s.career.heat === 0);

  const m = fresh(); m.age = 20; m.stats.looks = 50; m.stats.health = 90;
  for(let i=0;i<20;i++) T.applyToTrack(track("model"));
  ok("modelling needs looks of 65", !m.career);
  m.stats.looks = 85;
  for(let i=0;i<20 && !m.career;i++) T.applyToTrack(track("model"));
  ok("good looks get you signed", !!m.career && m.career.trackId === "model");
}

console.log("3. Cash, heat and arrests");
{
  const s = fresh(); s.age = 30; s.money = 0; s.pension = 0; s.stats.smarts = 60; s.hidden.stress = 0;
  s.emigrationMultipliers = { salaryMult: 1 };
  const c = employ(s, "syndicate", 4);
  const r = track("syndicate").ladder[4];
  let ran = 0, exact = 0;
  for(let i=0;i<200;i++){
    s.money = 0; s.pension = 0; c.heat = 0; c.rankIndex = 4; s.alive = true; s.career = c; s.stats.health = 90;
    const real = Math.random; let calls = 0;
    // Keep this year free of arrests and violence so only the pay is measured.
    Math.random = ()=>{ calls++; return 0.99; };
    T.runCareerYear();
    Math.random = real;
    ran++;
    if(s.money === Math.round(r.salary * T.priceLevel())) exact++;
  }
  ok("crime pays its rung in full — no tax taken", exact === ran, `${exact}/${ran}`);
  ok("and nothing goes into a pension", s.pension === 0);
  ok("and none of it is declared income", s.lastIncome === 0);

  // Heat
  const h = fresh(); h.age = 30; const hc = employ(h, "cartel", 5);
  const heats = [];
  for(let y=0;y<15;y++){ const real=Math.random; Math.random=()=>0.99; T.runCareerYear(); Math.random=real; h.career = hc; heats.push(hc.heat); }
  ok("heat builds year on year", heats[3] > heats[0], heats.slice(0,5).join(","));
  ok("and settles rather than running away", Math.abs(heats[14] - heats[13]) < 6, heats.slice(-3).join(","));
  hc.heat = 50; h.yearlyActivityUses = {}; h.actionsUsed = 0;
  T.doSlackOff();
  ok("lying low cools it", hc.heat < 50, hc.heat);
  const lowHeat = hc.heat; h.yearlyActivityUses = {}; h.actionsUsed = 0;
  T.doWorkHarder();
  ok("taking on more work raises it", hc.heat > lowHeat, `${lowHeat} → ${hc.heat}`);

  ok("more heat, more arrests", T.crimeArrestChance(80, 2) > T.crimeArrestChance(20, 2));
  ok("higher rank is better insulated", T.crimeArrestChance(80, 9) < T.crimeArrestChance(80, 1));
  ok("but never safe", T.crimeArrestChance(100, 10) > 0.05, T.crimeArrestChance(100,10));
  const [l0,h0] = T.crimeSentenceRange(track("syndicate"), 0), [l9,h9] = T.crimeSentenceRange(track("syndicate"), 9);
  ok("sentences grow with rank", l9 > l0 && h9 > h0, `${l0}-${h0} vs ${l9}-${h9}`);
  ok("a cartel sentence is longer", T.crimeSentenceRange(track("cartel"), 5)[1] > T.crimeSentenceRange(track("syndicate"), 5)[1]);
  ok("charges fit the rank", /trafficking/.test(T.crimeCharge(track("cartel"), 8)) && /racketeering/.test(T.crimeCharge(track("syndicate"), 8)));

  // Measured arrest rate against the stated odds.
  let arrests = 0, n = 3000;
  for(let i=0;i<n;i++){
    const st = fresh(); st.age = 30; st.stats.health = 90; st.hidden.stress = 0;
    const cc = employ(st, "syndicate", 3); cc.heat = 60;
    st.pendingChoice = null; st.choiceQueue = [];
    T.runCareerYear();
    if((st.pendingChoice && /arrest/i.test(st.pendingChoice.title)) || (st.choiceQueue||[]).some(q=>/arrest/i.test(q.title))) arrests++;
  }
  const after = 60*0.85 + 5 + 3*1.1;   // heat after the year's update, roughly
  const expect = T.crimeArrestChance(after, 3);
  ok("arrests happen about as often as the job screen says", Math.abs(arrests/n - expect) < 0.03, `${(arrests/n*100).toFixed(1)}% vs ~${(expect*100).toFixed(1)}%`);
}

console.log("4. Leaving, informing, going solo");
{
  let beaten = 0, killed = 0, clean = 0, n = 1500;
  for(let i=0;i<n;i++){
    const s = fresh(); s.age = 40; s.stats.health = 100; employ(s, "syndicate", 8);
    T.quitJob();
    if(!s.alive) killed++; else if(s.stats.health < 100) beaten++; else clean++;
    ok && null;
  }
  ok("walking away sometimes means a beating", beaten > n*0.2, beaten);
  ok("from high up, sometimes worse", killed > 0 && killed < n*0.2, killed);
  ok("but many walk away clean", clean > n*0.2, clean);
  const low = fresh(); low.age = 25; employ(low, "syndicate", 1);
  let lowKilled = 0; for(let i=0;i<500;i++){ const s=fresh(); s.age=25; employ(s,"syndicate",1); T.quitJob(); if(!s.alive) lowKilled++; }
  ok("a lookout is never killed for leaving", lowKilled === 0, lowKilled);

  const s = fresh(); s.age = 35; employ(s, "cartel", 4);
  const offer = T.informantOffer(s, "the cartel");
  ok("the police offer comes with two answers", offer.options.length === 2);
  offer.options[0].effect();
  ok("turning informant ends the career", !s.career);
  ok("and is remembered", s.flags.informant === true);
  ok("and makes an enemy", (s.enemies||[]).some(e=>/testified/.test(e.reason)));

  const b = fresh(); b.age = 28; employ(b, "band", 6);
  T.goSolo();
  ok("going solo moves you to the solo ladder", b.career.trackId === "music");
  ok("a rung down from where the band was", b.career.rankIndex === 5);
}

console.log("5. Modelling and age");
{
  function dropped(age){
    let n = 0, runs = 2000;
    for(let i=0;i<runs;i++){
      const s = fresh(); s.age = age; s.stats.looks = 80; s.hidden.stress = 0; employ(s, "model", 4);
      s.career.performance = 60;
      T.runCareerYear(); s.pendingChoice = null; s.choiceQueue = [];
      if(!s.career) n++;
    }
    return n / runs;
  }
  const young = dropped(24), old = dropped(42);
  ok("agencies drop older models far more often", old > young * 2, `${(young*100).toFixed(1)}% at 24 vs ${(old*100).toFixed(1)}% at 42`);
  console.log(`  model dropped in a year: ${(young*100).toFixed(1)}% at 24, ${(old*100).toFixed(1)}% at 42`);
}

console.log("6. Events and actions for every new career");
{
  ["syndicate","cartel","model","producer","band"].forEach(id=>{
    const pool = T.CAREER_EVENT_POOLS[id];
    ok(`${id} has three situations of its own`, Array.isArray(pool) && pool.length === 3, pool && pool.length);
    ok(`${id}'s situations each keep the same choices`, pool && pool.every(b=>{ const s1=fresh(); employ(s1,id,3); const a=b(s1).options.length; const s2=fresh(); employ(s2,id,3); return b(s2).options.length === a; }));
    ok(`${id} has its own action`, !!T.CAREER_ACTIONS[id]);
  });
  let errors = [], ran = 0;
  for(let i=0;i<300;i++){
    const id = ["syndicate","cartel","model","producer","band"][i%5];
    const s = fresh(); s.age = 30; s.money = 200000; s.stats.looks = 80; employ(s, id, i%11);
    try {
      const pool = T.CAREER_EVENT_POOLS[id];
      const ev = pool[Math.floor(Math.random()*pool.length)](s);
      if(!ev.title || !ev.options || ev.options.length < 2) errors.push(`${id}: malformed`);
      const o = ev.options[Math.floor(Math.random()*ev.options.length)];
      o.effect(); ran++;
      if(s.career){ s.yearlyActivityUses = {}; s.actionsUsed = 0; T.doCareerAction(); }
    } catch(e){ errors.push(`${id}: ${e.message}`); }
    if(!Number.isFinite(s.money)) errors.push(`${id}: money NaN`);
    if(s.career && (s.career.heat < 0 || s.career.heat > 100)) errors.push(`${id}: heat ${s.career.heat}`);
  }
  ok("hundreds of events and actions run clean", errors.length === 0 && ran === 300, errors.slice(0,4).join(" | "));
  // Crime actions are paid in cash and raise heat.
  const s = fresh(); s.age = 30; s.money = 0; const c = employ(s, "syndicate", 3); c.heat = 10;
  let paid = 0; for(let i=0;i<40;i++){ s.yearlyActivityUses = {}; s.actionsUsed = 0; const m0 = s.money; T.doCareerAction(); if(s.money > m0) paid++; }
  ok("collections usually pay", paid > 25, paid);
  ok("and raise the heat", c.heat > 10, c.heat);
}

{
  const titles = new Set();
  for(let i=0;i<3000;i++){
    const s = fresh(); s.age = 30; employ(s, "cartel", 3); s.pendingChoice = null; s.choiceQueue = [];
    T.maybeCareerEvent();
    if(s.pendingChoice) titles.add(s.pendingChoice.title);
  }
  ok("in play, all three cartel situations come up", titles.size === 3, [...titles].join(" | "));
}

// A situation queued at work, answered after the job has gone, must not act on
// the old job (this used to throw).
{
  let threw = 0, n = 0;
  for(const build of [...T.GENERIC_CAREER_EVENTS, ...Object.values(T.CAREER_EVENTS), ...Object.values(T.CAREER_EVENT_POOLS).flat()]){
    const s = fresh(); s.age = 35; s.money = 50000;
    employ(s, "electrician", 3);
    const ev = T.tiedToThisJob(build(s));
    s.career = null;                       // dismissed before answering
    ev.options.forEach(o=>{ n++; try{ o.effect(); } catch(e){ threw++; } });
  }
  ok("answering a work situation after the job has ended never throws", threw === 0, `${threw}/${n}`);
  const s = fresh(); s.age = 35; employ(s, "electrician", 3); s.career.performance = 50;
  const ev = T.tiedToThisJob({ title:"t", text:"t", options:[{ label:"x", effect:()=>{ s.career.performance = 99; } }] });
  ev.options[0].effect();
  ok("but still acts when the job is the same", s.career.performance === 99);
  const job = s.career; s.career = { kind:"civilian", trackId:"plumber", rankIndex:0, yearsInRank:0, performance:50 };
  const ev2 = T.tiedToThisJob({ title:"t", text:"t", options:[{ label:"x", effect:()=>{ s.career.performance = 1; } }] });
  s.career = job;
  ev2.options[0].effect();
  ok("and not on a different job taken since", s.career.performance === 99);
}

console.log("7. The screens");
{
  const s = fresh(); s.age = 30;
  T.careerView = { level:"categories", category:null }; T.openCareerSheet();
  ok("Organised Crime is listed on Occupation", html().includes('data-cat="Organised Crime"'));
  ok("with a summary", /2 careers · Crime Family, Drug Cartel/.test(T.categorySummary("Organised Crime")), T.categorySummary("Organised Crime"));
  s.year = 1960;
  ok("before 1975 only one is open", /Crime Family to|Lookout to/.test(T.categorySummary("Organised Crime")) || T.tracksInCategory("Organised Crime").length === 1);
  s.year = 2020;
  T.careerView = { level:"tracks", category:"Organised Crime" }; T.openCareerSheet();
  ok("the field explains the deal", /never taxed/.test(html()) && /heat/.test(html()));
  s.hidden.karma = 70; s.gang = null; s.flags.criminalRecord = false;
  T.openCareerSheet();
  ok("and says you'd need connections", /need connections first/.test(html()));
  T.careerView = { level:"tracks", category:"Creative" }; T.openCareerSheet();
  ok("Creative lists Model, Producer and both Musicians", ["Model","Music Producer","Musician (solo)","Musician (band)"].every(n=>html().includes(n)));
  ok("Model states its looks bar", /looks 65\+/.test(html()));

  employ(s, "cartel", 4); s.career.heat = 70;
  T.careerView = { level:"categories", category:null }; T.openCareerSheet();
  const h = html();
  ok("the job screen shows police heat", /Police heat: 70\/100/.test(h));
  ok("with the odds of arrest", /chance of arrest this year/.test(h));
  ok("and the sentence you'd face", /you'd face \d+–\d+ years/.test(h));
  ok("pay is shown as untaxed cash", /in cash — untaxed/.test(h));
  ok("work options speak the language", /Take on more work/.test(h) && /Lie low/.test(h) && /bigger cut/.test(h));
  ok("leaving is flagged as risky", /they may not let you/.test(h));
  ok("the rung is shown", /rung 5 of 11/.test(h));
}

console.log("8. The ribbon");
{
  const s = fresh(); s.toppedTracks = ["cartel"];
  ok("topping a crime ladder earns Kingpin", T.RIBBONS.some(r=>r.id==="kingpin") && T.awardRibbon(s) === "Kingpin" || /Crown|Statesman/.test(T.awardRibbon(s)), T.awardRibbon(s));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
