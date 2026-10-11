// One screen per person: every kind of relationship opens its own page, the
// actions on it do what they say, and "Spend time with everyone" stays at the
// top of the Relationships screen.
const T = require("./harness.js")(`
  openPeopleSheet, renderPeopleSheetContent, get peopleView(){return peopleView;}, set peopleView(v){peopleView=v;},
  personByRef, personRow, renderPersonPage, runPersonAction, personRelationLabel, warmthOf,
  doGiftTier, GIFT_TIERS, doAnniversary, ANNIVERSARY_PLANS, yearsMarried, canRenewVows, doRenewVows,
  doCounselling, setBirthControl, conceptionChance, doTryForBaby, divorceSettlement, doDivorce, openDivorceChoice,
  doSpy, doChildDoctor, openAdoptOutChoice, doPersonTalk, doAskChildForMoney, doEndFriendship, doVisitGrave,
  doPlayWithPet, doCinema, makePerson, addFriend, makeEnemy, doSpendTimeWithEveryone, eraMoney, partnerNetWorth,
  launchAdultChild, PET_TYPES, inBritain`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };

function fresh(){
  ["startBtn","firstNameInput","lastNameInput","toPerksBtn"].forEach(id=>{ reg[id] = new FakeEl(); });
  reg.firstNameInput.value = "Test"; reg.lastNameInput.value = "Person";
  T.state = null; T.appScreen = "create"; T.render();
  reg.startBtn.click();
  return T.state;
}
function sheet(){ const k=document.body.children; return k[k.length-1]; }
function html(){ const s=sheet(); return s ? String(s.innerHTML||"") : ""; }
function openPage(kind, id){
  T.openPeopleSheet();
  T.peopleView.person = { kind, id }; T.peopleView.sub = null;
  T.renderPeopleSheetContent(sheet());
  return html();
}
function clearChoices(){ T.state.pendingChoice = null; T.state.choiceQueue = []; }
function choice(){ return T.state.pendingChoice || (T.state.choiceQueue||[])[0] || null; }
function partnerUp(s, opts){
  const o = opts || {};
  s.relationship = T.makePerson("Partner", s.gender==="Boy"?"Girl":"Boy", o.age || s.age);
  s.relationship.closeness = o.closeness === undefined ? 70 : o.closeness;
  s.relationshipYears = o.years || 3;
  if(o.married){ s.married = true; s.marriedAtAge = s.age - (o.marriedYears||0); }
  return s.relationship;
}
function reset(s){ s.yearlyActivityUses = {}; s.actionsUsed = 0; }

// ============================================= 1. The Relationships screen
console.log("1. The Relationships screen");
{
  const s = fresh(); s.age = 40; reset(s);
  partnerUp(s);
  T.addFriend("Jon", 60);
  T.openPeopleSheet();
  const h = html();
  const everyone = h.indexOf('id="seeEveryoneBtn"');
  const firstRow = h.indexOf('data-tab=');
  ok("spend time with everyone is on the menu", everyone > 0);
  ok("and it sits above every category", everyone > 0 && everyone < firstRow, `${everyone} vs ${firstRow}`);
  ok("the categories are listed", ["Love","Family","Children","Friends","Enemies","Pets"].every(l=>h.includes(l)));
  ok("Love shows who you're with", h.includes(s.relationship.name));
  ok("it still works", (()=>{ const before = s.friends[0].closeness; T.doSpendTimeWithEveryone(); return s.friends[0].closeness > before; })());
}

// Lists are rows of people with a bar each, and each opens a page.
{
  const s = fresh(); s.age = 40; reset(s);
  T.addFriend("Jon", 60);
  T.openPeopleSheet(); T.peopleView.tab = "family"; T.renderPeopleSheetContent(sheet());
  const h = html();
  ok("family rows open a page", /data-person="family:\d+"/.test(h));
  ok("each row has a relationship bar", h.includes('class="mbar"'));
  ok("rows name the relation and age", /\((Mother|Father), \d+\)/.test(h));
  T.peopleView.tab = "friends"; T.renderPeopleSheetContent(sheet());
  ok("friend rows open a page", /data-person="friend:\d+"/.test(html()));

  // The dead have their own section.
  const mum = s.family.find(p=>p.relation==="Mother");
  mum.alive = false; mum.ageAtDeath = 70; mum.causeOfDeath = "heart failure";
  T.peopleView.tab = "family"; T.renderPeopleSheetContent(sheet());
  const h2 = html();
  ok("late relatives get their own section", h2.includes("Late relatives"));
  ok("with how they died", h2.includes("heart failure") && h2.includes("Died at 70"));
}

// ============================================= 2. Every kind of page renders
console.log("2. Every kind of page renders with the right actions");
{
  const s = fresh(); s.age = 40; s.money = 100000; reset(s);
  const r = partnerUp(s, { married:true, marriedYears:12 });
  const ph = openPage("partner", r.id);
  ok("the partner page shows their name", ph.includes(r.name));
  ok("calls a wife or husband by that", /Wife|Husband/.test(ph));
  ok("shows their net worth", ph.includes("Their net worth"));
  ["time","date","cinema","getaway","intimacy","talk","compliment","gift","money","argue","insult",
   "anniversary","vows","counsel","birthcontrol","spy","end"].forEach(a=>
    ok(`partner page offers ${a}`, ph.includes(`data-pact="${a}"`)));
  ok("a married partner gets divorce, not breakup", ph.includes("Divorce them"));
  ok("immediate actions are marked •••", ph.includes('class="dots"'));
  ok("screens that open something get a chevron", /data-pact="gift"[\s\S]*?class="chev"/.test(ph));

  // An unmarried partner: propose instead of anniversary.
  const s2 = fresh(); s2.age = 30; reset(s2);
  const r2 = partnerUp(s2, { years:1 });
  const ph2 = openPage("partner", r2.id);
  ok("an unmarried partner can be proposed to", ph2.includes('data-pact="propose"'));
  ok("and has no anniversary", !ph2.includes('data-pact="anniversary"'));
  ok("and is broken up with, not divorced", ph2.includes("End the relationship"));

  // A small child.
  const s3 = fresh(); s3.age = 35; reset(s3);
  const kid = { id: 901, name:"Nicole", gender:"Girl", age: 0, health:90, happiness:80, smarts:50, bond:70, alive:true };
  s3.children = [kid];
  const kh = openPage("child", 901);
  ok("a baby's page renders", kh.includes("Nicole") && kh.includes("Daughter"));
  ok("a baby gets parenting actions", ["ptime","treat","doctor"].every(a=>kh.includes(`data-pact="${a}"`)));
  ok("you can't hold a conversation with a baby", !kh.includes('data-pact="talk"'));
  ok("or insult one", !kh.includes('data-pact="insult"'));
  ok("or ask one for money", !kh.includes('data-pact="money"'));
  ok("a baby can be adopted out", kh.includes('data-pact="adoptout"'));
  ok("but not spied on", !kh.includes('data-pact="spy"'));

  kid.age = 12;
  const kh2 = openPage("child", 901);
  ok("an older child gets schoolwork help", kh2.includes('data-pact="homework"'));
  ok("and can be talked to", kh2.includes('data-pact="talk"'));
  ok("and spied on", kh2.includes('data-pact="spy"'));
  ok("but still not insulted", !kh2.includes('data-pact="insult"'));

  // A grown-up child.
  const adult = { id: 902, name:"Eli", gender:"Boy", age: 28, health:80, happiness:70, smarts:80, bond:70, alive:true };
  T.launchAdultChild(adult); s3.children = [adult];
  const ah = openPage("child", 902);
  ok("an adult child shows their life", ["Education","Work","Earning","Their net worth"].every(l=>ah.includes(l)));
  ok("and the paths you can suggest", ["enc:education","enc:career","enc:dating","enc:family"].every(a=>ah.includes(`data-pact="${a}"`)));
  ok("and can be visited and helped", ah.includes('data-pact="visit"') && ah.includes('data-pact="help"'));
  ok("but not adopted out", !ah.includes('data-pact="adoptout"'));

  // Friends, enemies, pets, the dead.
  const s4 = fresh(); s4.age = 40; reset(s4);
  T.addFriend("Jon", 60);
  const f = s4.friends[0];
  const fh = openPage("friend", f.id);
  ok("a friend's page offers ending it", fh.includes('data-pact="unfriend"'));
  const e = T.makeEnemy("a grudge from school");
  const eh = openPage("enemy", e.id);
  ok("an enemy's page shows hostility", eh.includes("Hostility"));
  ok("and confront, peace and insult", ["confront","peace","insult"].every(a=>eh.includes(`data-pact="${a}"`)));
  ok("and no gift-giving", !eh.includes('data-pact="gift"'));
  s4.pets = [{ id: 950, typeId:"dog", name:"Biscuit", age:3, alive:true }];
  const peth = openPage("pet", 950);
  ok("a dog can be walked", peth.includes("walk"));
  ok("and shown", peth.includes('data-pact="petshow"'));
  const dad = s4.family.find(p=>p.relation==="Father");
  dad.alive = false; dad.ageAtDeath = 81;
  const dh = openPage("family", dad.id);
  ok("the dead have a page", dh.includes(dad.name) && dh.includes("died at 81"));
  ok("with only a grave to visit", dh.includes('data-pact="grave"') && !dh.includes('data-pact="talk"'));
}

// A person who leaves your life drops you back to the list rather than
// leaving a blank page.
{
  const s = fresh(); s.age = 40; reset(s);
  T.addFriend("Jon", 60);
  const id = s.friends[0].id;
  openPage("friend", id);
  T.doEndFriendship(id);
  ok("ending a friendship removes them", !s.friends.some(f=>f.id===id));
  ok("and the page closes", T.peopleView.person === null);
}

// ============================================= 3. Everyday interactions
console.log("3. Conversations, compliments, insults and gifts");
{
  function mean(fn, n){ let t=0; for(let i=0;i<n;i++) t+=fn(); return t/n; }
  const talk = mean(()=>{ const s=fresh(); s.age=30; reset(s); T.addFriend("A",50); const f=s.friends[0]; T.doPersonTalk("friend", f.id, "talk"); return f.closeness-50; }, 400);
  const comp = mean(()=>{ const s=fresh(); s.age=30; reset(s); T.addFriend("A",50); const f=s.friends[0]; T.doPersonTalk("friend", f.id, "compliment"); return f.closeness-50; }, 400);
  const ins  = mean(()=>{ const s=fresh(); s.age=30; reset(s); T.addFriend("A",50); const f=s.friends[0]; T.doPersonTalk("friend", f.id, "insult"); return (s.friends[0]||{closeness:0}).closeness-50; }, 400);
  ok("a conversation usually helps", talk > 1, talk.toFixed(2));
  ok("a compliment helps more", comp > talk, `${comp.toFixed(2)} vs ${talk.toFixed(2)}`);
  ok("an insult hurts", ins < -7, ins.toFixed(2));

  // A compliment from someone they can't stand doesn't land.
  const cold = mean(()=>{ const s=fresh(); s.age=30; reset(s); T.addFriend("A",15); const f=s.friends[0]; T.doPersonTalk("friend", f.id, "compliment"); return f.closeness-15; }, 600);
  ok("a cold compliment is worth less", cold < comp, `${cold.toFixed(2)} vs ${comp.toFixed(2)}`);

  // Insult a friend who barely likes you and they can become a rival.
  let turned = 0;
  for(let i=0;i<300;i++){ const s=fresh(); s.age=30; reset(s); T.addFriend("A",12); const f=s.friends[0]; T.doPersonTalk("friend", f.id, "insult"); if(!s.friends.length && (s.enemies||[]).length) turned++; }
  ok("an insulted friend can turn enemy", turned > 50 && turned < 300, turned);

  // Insulting a rival raises the temperature.
  const s = fresh(); s.age=30; reset(s);
  const e = T.makeEnemy("test"); const h0 = e.hostility;
  T.doPersonTalk("enemy", e.id, "insult");
  ok("insulting a rival raises hostility", e.hostility > h0, `${h0} → ${e.hostility}`);

  // The social allowance is honoured.
  const s2 = fresh(); s2.age=30; reset(s2); T.addFriend("A",50); const f2 = s2.friends[0];
  for(let i=0;i<10;i++) T.doPersonTalk("friend", f2.id, "talk");
  ok("talking is capped by the year's social time", T.usesLeft("social") === 0);
  const c = f2.closeness;
  T.doPersonTalk("friend", f2.id, "talk");
  ok("and stops when it's spent", f2.closeness === c);
}

// Gifts come in four sizes, and the money moves.
{
  ok("four gift sizes", T.GIFT_TIERS.length === 4);
  const gains = {};
  T.GIFT_TIERS.forEach(t=>{
    let total = 0, wrong = 0;
    for(let i=0;i<200;i++){
      const s=fresh(); s.age=40; s.money=1e7; reset(s);
      T.addFriend("A",40); const f=s.friends[0];
      const m0 = s.money;
      T.doGiftTier("friend", f.id, t.id);
      total += f.closeness - 40;
      // Prices are in the money of the year being lived through.
      if(m0 - s.money !== T.eraMoney(t.cost)) wrong++;
    }
    gains[t.id] = total/200;
    ok(`a ${t.id} gift costs what it says, in that year's money`, wrong === 0, `${wrong}/200 wrong`);
  });
  ok("bigger gifts land harder", gains.small < gains.good && gains.good < gains.lavish && gains.lavish < gains.lavish2,
    JSON.stringify(Object.fromEntries(Object.entries(gains).map(([k,v])=>[k,v.toFixed(1)]))));
  const s=fresh(); s.age=40; s.money=10; reset(s); T.addFriend("A",40); const f=s.friends[0];
  T.doGiftTier("friend", f.id, "lavish");
  ok("you can't give what you can't afford", s.money === 10 && f.closeness === 40);
  // A gift for a child goes on their bond.
  const s2=fresh(); s2.age=40; s2.money=1e6; reset(s2);
  const kid = { id:903, name:"K", age:8, health:80, happiness:60, bond:50, alive:true }; s2.children=[kid];
  T.doGiftTier("child", 903, "good");
  ok("a child's gift raises their bond", kid.bond > 50, kid.bond);
  ok("and their happiness", kid.happiness > 60, kid.happiness);
}

// ============================================= 4. Partners
console.log("4. Anniversaries, vows, counselling and contraception");
{
  const s = fresh(); s.age = 45; s.money = 1e6; reset(s);
  const r = partnerUp(s, { married:true, marriedYears:12, closeness:50 });
  ok("years married is counted", T.yearsMarried() === 12);
  T.doAnniversary("dinner");
  ok("an anniversary raises closeness", r.closeness > 50, r.closeness);
  const c = r.closeness;
  T.doAnniversary("big");
  ok("but only once a year", r.closeness === c);
  T.openPeopleSheet(); T.peopleView.person={kind:"partner", id:r.id}; T.renderPeopleSheetContent(sheet());
  ok("the page says it's been marked", html().includes("Already marked this year"));

  // Vows.
  ok("ten years married means vows can be renewed", T.canRenewVows());
  const c2 = r.closeness; const m0 = s.money;
  T.doRenewVows();
  ok("renewing vows raises closeness a lot", r.closeness - c2 >= 15, r.closeness - c2);
  ok("and costs money", m0 - s.money === T.eraMoney(2500));
  ok("and can't be done again straight away", !T.canRenewVows());
  s.age += 10;
  ok("but can a decade later", T.canRenewVows());
  const s2 = fresh(); s2.age = 30; reset(s2);
  partnerUp(s2, { married:true, marriedYears:3 });
  ok("three years in is too soon", !T.canRenewVows());

  // Counselling helps more often than not.
  let helped = 0;
  for(let i=0;i<400;i++){ const st=fresh(); st.age=40; st.money=1e5; reset(st); const rr=partnerUp(st,{closeness:40}); T.doCounselling(); if(rr.closeness >= 48) helped++; }
  ok("counselling usually helps", helped > 200, `${helped}/400`);
  ok("but not always", helped < 390, `${helped}/400`);
}

// Contraception as an agreement changes the real odds.
{
  const s = fresh(); s.gender = "Boy"; s.age = 30; reset(s);
  const r = partnerUp(s, { age: 29 }); r.gender = "Girl";
  const off = T.conceptionChance(r, false);
  T.setBirthControl(true);
  const on = T.conceptionChance(r, false);
  ok("agreed contraception cuts the chance of pregnancy", on < off * 0.1, `${off.toFixed(4)} → ${on.toFixed(4)}`);
  ok("but never to zero", on > 0);
  // It only covers the couple, not a stranger.
  const stranger = T.makePerson("Partner", "Girl", 29);
  ok("it doesn't cover a one-night stand", T.conceptionChance(stranger, false) > on * 5);
  // Trying for a baby stops it.
  s.married = true; s.marriedAtAge = 28; s.money = 1e5;
  T.doTryForBaby();
  ok("trying for a baby stops contraception", s.birthControl === false);
  T.setBirthControl(false);
  ok("and it can be switched off directly", s.birthControl === false);
}

// Divorce moves money according to the prenup.
{
  function settle(myMoney, theirs, prenup){
    const s = fresh(); s.age = 45; reset(s);
    const r = partnerUp(s, { married:true, marriedYears:10 });
    s.money = myMoney; r.netWorth = theirs; s.hasPrenup = prenup;
    return T.divorceSettlement();
  }
  const richMe = settle(1000000, 0, false), richMePre = settle(1000000, 0, true);
  ok("the richer spouse pays", richMe > 0, richMe);
  ok("a prenup protects them", richMePre < richMe * 0.5, `${richMePre} vs ${richMe}`);
  const richThem = settle(0, 1000000, false);
  ok("the poorer spouse receives", richThem < 0, richThem);
  ok("even ground means little to split", Math.abs(settle(50000, 50000, false)) < 1);

  const s = fresh(); s.age = 45; reset(s);
  const r = partnerUp(s, { married:true, marriedYears:10 });
  s.money = 400000; r.netWorth = 0; s.hasPrenup = false;
  const t = T.divorceSettlement(); const m0 = s.money;
  T.doDivorce();
  ok("divorce ends the marriage", !s.married && !s.relationship);
  ok("and pays the settlement", m0 - s.money === t, `${m0 - s.money} vs ${t}`);
  clearChoices();
  const s2 = fresh(); s2.age = 45; reset(s2); partnerUp(s2, { married:true, marriedYears:5 });
  T.openDivorceChoice();
  const c = choice();
  ok("divorcing asks first", c && /Divorce/.test(c.title));
  ok("and says what it'll cost", c && /(pay|receive|Neither)/.test(c.text));
}

// ============================================= 5. Spying
console.log("5. Spying");
{
  function infidelityRate(closeness, n){
    let found = 0;
    for(let i=0;i<n;i++){
      const s=fresh(); s.age=40; reset(s); clearChoices();
      const r=partnerUp(s,{closeness});
      T.doSpy("partner", r.id);
      const c = choice();
      if(c && /someone else/.test(c.text)) found++;
    }
    return found/n;
  }
  const warm = infidelityRate(90, 600), cold = infidelityRate(10, 600);
  ok("a neglected partner is likelier to be unfaithful", cold > warm * 2, `${(warm*100).toFixed(1)}% vs ${(cold*100).toFixed(1)}%`);
  ok("but most partners aren't", cold < 0.5, cold);
  console.log(`  spying: affair found ${(warm*100).toFixed(0)}% at closeness 90, ${(cold*100).toFixed(0)}% at 10`);

  // Once a year.
  const s=fresh(); s.age=40; reset(s); const r=partnerUp(s,{closeness:60});
  T.doSpy("partner", r.id);
  ok("spying is limited to once a year", T.usesLeft("spy") === 0);

  // Children: what you find has choices attached.
  let withChoice = 0, outcomes = new Set();
  for(let i=0;i<400;i++){
    const st=fresh(); st.age=45; reset(st); clearChoices();
    st.children=[{id:904,name:"Teen",age:14,health:80,happiness:60,smarts:55,bond:60,alive:true}];
    T.doSpy("child", 904);
    const c = choice();
    if(c){ withChoice++; outcomes.add(c.text.split(" ").slice(1,5).join(" ")); c.options[0].effect(); }
  }
  ok("spying on a child sometimes turns something up", withChoice > 60 && withChoice < 300, withChoice);
  ok("more than one kind of thing", outcomes.size >= 2, [...outcomes].join(" | "));
}

// ============================================= 6. Children
console.log("6. The doctor, and adoption");
{
  const s=fresh(); s.age=35; s.money=1000; reset(s);
  s.currentCountry = "England";
  const kid = { id:905, name:"Sick", age:6, health:50, happiness:60, bond:60, alive:true };
  s.children=[kid];
  const m0 = s.money;
  T.doChildDoctor(905);
  ok("the doctor improves a poorly child's health", kid.health > 50, kid.health);
  ok("and is free on the NHS", s.money === m0);
  reset(s); s.currentCountry = "United States";
  T.doChildDoctor(905);
  ok("abroad it costs", s.money < m0, `${m0} → ${s.money}`);

  clearChoices();
  T.openAdoptOutChoice(905);
  const c = choice();
  ok("adoption asks first", c && /adoption/.test(c.title));
  ok("and warns it's permanent", c && /can't be undone/.test(c.text));
  c.options[1].effect();
  ok("keeping them keeps them", s.children.length === 1);
  clearChoices(); T.openAdoptOutChoice(905); choice().options[0].effect();
  ok("going ahead removes the child", s.children.length === 0);
  ok("and is recorded", s.flags.gaveUpChild === true);

  // An adult child can be asked for money they actually have.
  const s2=fresh(); s2.age=60; reset(s2); s2.money = 0;
  const ad = { id:906, name:"Rich", age:35, health:80, happiness:70, smarts:80, bond:95, alive:true };
  T.launchAdultChild(ad); ad.netWorth = 500000; s2.children=[ad];
  let got = 0;
  for(let i=0;i<5;i++){ T.doAskChildForMoney(906); }
  ok("a close, well-off child will help out", s2.money > 0, s2.money);
  ok("and it comes off their net worth", ad.netWorth === 500000 - s2.money, `${ad.netWorth} vs ${500000 - s2.money}`);
}

// ============================================= 7. Graves and pets
console.log("7. Graves and pets");
{
  const s=fresh(); s.age=60; reset(s);
  const mum=s.family.find(p=>p.relation==="Mother"); mum.alive=false;
  const h0 = s.stats.happiness;
  T.doVisitGrave(mum.id);
  ok("visiting a grave lifts happiness", s.stats.happiness > h0 || h0 >= 100);
  const dad=s.family.find(p=>p.relation==="Father"); dad.alive = true;
  const h1 = s.stats.happiness, u = T.usesLeft("social");
  T.doVisitGrave(dad.id);
  ok("the living don't have graves", T.usesLeft("social") === u && s.stats.happiness === h1);

  s.pets=[{id:951, typeId:"cat", name:"Luna", age:2, alive:true}];
  const h2 = s.stats.happiness;
  T.doPlayWithPet(951);
  ok("playing with a pet lifts happiness", s.stats.happiness > h2 || h2 >= 100);
  T.doPlayWithPet(951); T.doPlayWithPet(951);
  ok("twice a year", T.usesLeft("petplay") === 0);
}

// ============================================= 8. Every action on every page runs clean
console.log("8. Every action on every page, under fuzz");
{
  let errors = [], ran = 0, bad = [];
  for(let life=0; life<120; life++){
    const s = fresh();
    s.age = 20 + Math.floor(Math.random()*60); s.money = Math.floor(Math.random()*200000);
    reset(s);
    if(Math.random()<0.7) partnerUp(s, { married: Math.random()<0.5, marriedYears: Math.floor(Math.random()*30), closeness: Math.floor(Math.random()*100) });
    T.addFriend("F", Math.floor(Math.random()*100));
    if(Math.random()<0.5) T.makeEnemy("fuzz");
    s.children = [
      { id: 7000+life*3, name:"A", gender:"Girl", age: Math.floor(Math.random()*18), health:70, happiness:60, smarts:50, bond:Math.floor(Math.random()*100), alive:true },
    ];
    const adult = { id: 7001+life*3, name:"B", gender:"Boy", age: 25, health:70, happiness:60, smarts:60, bond:60, alive:true };
    T.launchAdultChild(adult); s.children.push(adult);
    s.pets = [{ id: 7002+life*3, typeId: ["dog","cat","exotic"][life%3], name:"P", age:2, alive:true }];
    if(Math.random()<0.4){ const g = s.family[0]; g.alive=false; g.ageAtDeath=g.age; }

    const people = [];
    s.family.forEach(p=>people.push(["family", p.id]));
    s.friends.forEach(p=>people.push(["friend", p.id]));
    (s.enemies||[]).forEach(p=>people.push(["enemy", p.id]));
    s.children.forEach(p=>people.push(["child", p.id]));
    s.pets.forEach(p=>people.push(["pet", p.id]));
    if(s.relationship) people.push(["partner", s.relationship.id]);

    for(const [kind, id] of people){
      if(!T.state.alive) break;
      let h;
      try { h = openPage(kind, id); } catch(e){ errors.push(`render ${kind}: ${e.message}`); continue; }
      const acts = [...h.matchAll(/data-pact="([^"]+)"(?![^>]*disabled)/g)].map(m=>m[1]);
      for(const a of acts){
        if(!T.personByRef(kind, id)) break;
        clearChoices();
        try {
          T.peopleView.person = { kind, id };
          T.runPersonAction(kind, id, a);
          // Answer whatever it asked, so follow-on code runs too.
          for(let k=0;k<3;k++){ const c = choice(); if(!c) break; T.state.pendingChoice=null; (T.state.choiceQueue||[]).shift(); c.options[Math.floor(Math.random()*c.options.length)].effect(); }
          ran++;
        } catch(e){ errors.push(`${kind}.${a}: ${e.message}`); }
        if(T.state.alive === false) break;
      }
    }
    const st = T.state;
    if(!Number.isFinite(st.money)) bad.push("money NaN");
    ["health","happiness","smarts","looks"].forEach(k=>{ if(st.stats[k] < 0 || st.stats[k] > 100) bad.push(`${k} ${st.stats[k]}`); });
    [...(st.family||[]), ...(st.friends||[]), ...(st.relationship?[st.relationship]:[])].forEach(p=>{ if(p.closeness < 0 || p.closeness > 100 || !Number.isFinite(p.closeness)) bad.push(`closeness ${p.closeness}`); });
    (st.children||[]).forEach(c=>{ if(c.bond !== undefined && (c.bond < 0 || c.bond > 100)) bad.push(`bond ${c.bond}`); });
  }
  ok("hundreds of actions ran", ran > 1000, ran);
  ok("none threw", errors.length === 0, errors.slice(0,5).join(" | "));
  ok("nothing went out of range", bad.length === 0, bad.slice(0,5).join(" | "));
  console.log(`  ${ran} actions across 120 lives`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
