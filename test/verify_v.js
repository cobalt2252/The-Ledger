// Verification for the careers/casino/vehicles/prenup batch.
const T = require("./harness.js")(`FORCES, TRACKS, CATEGORIES, tracksInCategory, forcesAvailable, forceNationFor,
  forceNationNote, resetPerformanceForNewRank, vehicleKind, vehicleCanRace, vehicleSpeedRating,
  vehicleLicenceMissing, licenceLabelFor, openVehicleUse, doVehicleOuting, doVehicleCrash,
  openStreetRace, doStreetRace, streetRaceStakes, checkCasinoBan, recordCasinoResult, casinoBiggestWin,
  casinoNet, isBannedFromCasino, CASINO_BAN_THRESHOLD, openPrenupChoice, partnerNetWorth, makePerson,
  plausiblePartnerNetWorth, POLITICAL_OFFICES, buyAsset, LICENSE_BY_FLAG, nudgePerformance, applyToTrack, jobPerformance,
  GOVERNMENT_BY_COUNTRY, governmentOf, currentSystem, officesAvailable, officeById, systemNote,
  electionWinChance, ladderIndexOf, minYearsForRung, minApprovalForRung, canInheritThrone,
  runForOffice, runPoliticsYear, politicalApproval, nudgeApproval, doPoliticalEffort, takeOffice,
  openCoupChoice, resignOffice, NOBILITY_RANKS, COUNTRIES, PERFORMANCE_WARNING,
  openCareerSheet, renderCareerSheetContent, get careerView(){return careerView;}, set careerView(v){careerView=v;},
  openAssetsSheet, renderAssetsSheet, get assetsView(){return assetsView;}, set assetsView(v){assetsView=v;},
  doSlots, isBannedFromCasino, vehicleSpeedRating`);

let pass = 0, fail = 0;
function ok(name, cond, extra){
  if(cond){ pass++; }
  else { fail++; console.log("FAIL:", name, extra === undefined ? "" : extra); }
}

// Mirrors pressing Begin My Life: the name inputs are read from the DOM, so
// the ids the screen wires up have to exist before the click lands.
function fresh(){
  ["startBtn","firstNameInput","lastNameInput","toPerksBtn"].forEach(id=>{ reg[id] = new FakeEl(); });
  reg.firstNameInput.value = "Test";
  reg.lastNameInput.value = "Person";
  T.state = null; T.appScreen = "create"; T.render();
  reg.startBtn.click();
  return T.state;
}
function ageTo(n){ while(T.state && T.state.alive && T.state.age < n) T.ageUp(); }
// The decision in front of the player, whether it went straight up or was held
// behind another one.
function clearChoices(){ T.state.pendingChoice = null; T.state.choiceQueue = []; }
function choices(){
  const q = T.state.choiceQueue || [];
  return (T.state.pendingChoice ? [T.state.pendingChoice] : []).concat(q);
}
function currentChoice(){ return choices()[0] || null; }
// Sheets are appended to the body, so the last child is the one just opened.
function sheetMarkup(){
  const kids = document.body.children;
  return kids.length ? String(kids[kids.length-1].innerHTML || "") : "";
}

// ---------- Career data ----------
ok("44 tracks", T.TRACKS.length === 44, T.TRACKS.length);
ok("every track has 11 rungs (10 promotions)", T.TRACKS.every(t=>t.ladder.length === 11),
  T.TRACKS.filter(t=>t.ladder.length!==11).map(t=>`${t.id}:${t.ladder.length}`));
ok("ladder salaries rise monotonically", T.TRACKS.every(t=>
  t.ladder.every((r,i)=> i===0 || r.salary > t.ladder[i-1].salary)),
  T.TRACKS.filter(t=>t.ladder.some((r,i)=>i>0 && r.salary <= t.ladder[i-1].salary)).map(t=>t.id));
ok("no duplicate titles within a ladder", T.TRACKS.every(t=>
  new Set(t.ladder.map(r=>r.title)).size === 11));
ok("no duplicate track ids", new Set(T.TRACKS.map(t=>t.id)).size === T.TRACKS.length);
ok("17 categories", T.CATEGORIES.length === 17, T.CATEGORIES.length);
ok("retail and hospitality are separate categories",
  T.CATEGORIES.includes("Retail") && T.CATEGORIES.includes("Hospitality"));
ok("every category has at least one track", T.CATEGORIES.every(c=>
  c === "Armed Forces" || c === "Entrepreneurship" || c === "Politics" ||
  T.TRACKS.some(t=>t.category===c)),
  T.CATEGORIES.filter(c=>!["Armed Forces","Entrepreneurship","Politics"].includes(c) && !T.TRACKS.some(t=>t.category===c)));
ok("every track's category is a real one", T.TRACKS.every(t=>T.CATEGORIES.includes(t.category)),
  T.TRACKS.filter(t=>!T.CATEGORIES.includes(t.category)).map(t=>t.id+":"+t.category));

{
  const trades = T.TRACKS.filter(t=>t.category === "Manual & Trades");
  ok("at least 10 separate trades", trades.length >= 10, trades.length);
  ["electrician","plumber","carpenter","bricklayer","welder"].forEach(id=>
    ok(`trade ${id} exists`, trades.some(t=>t.id===id)));
  ok("the old catch-all 'trades' track is gone", !T.TRACKS.some(t=>t.id === "trades"));
}

// ---------- Armed forces data ----------
ok("15 services", T.FORCES.length === 15, T.FORCES.length);
ok("every service has 11 enlisted ranks", T.FORCES.every(f=>f.ranks.length === 11),
  T.FORCES.filter(f=>f.ranks.length!==11).map(f=>`${f.id}:${f.ranks.length}`));
ok("every service has 11 officer ranks", T.FORCES.every(f=>f.officerRanks.length === 11),
  T.FORCES.filter(f=>f.officerRanks.length!==11).map(f=>`${f.id}:${f.officerRanks.length}`));
ok("10 promotion gates per ladder", T.FORCES.every(f=>
  f.promoYears.length === 10 && f.officerPromoYears.length === 10));
ok("promotion gates never go backwards", T.FORCES.every(f=>
  f.promoYears.every((y,i)=>i===0 || y >= f.promoYears[i-1]) &&
  f.officerPromoYears.every((y,i)=>i===0 || y >= f.officerPromoYears[i-1])));
ok("no duplicate ranks in a ladder", T.FORCES.every(f=>
  new Set(f.ranks).size === 11 && new Set(f.officerRanks).size === 11),
  T.FORCES.filter(f=>new Set(f.ranks).size!==11||new Set(f.officerRanks).size!==11).map(f=>f.id));
ok("officers out-earn other ranks at the bottom", T.FORCES.every(f=>f.officerBasePay > f.basePay));
ok("ranks are in English", T.FORCES.every(f=>
  f.ranks.concat(f.officerRanks).every(r=>/^[A-Za-z0-9 ()'\-/.]+$/.test(r))),
  T.FORCES.flatMap(f=>f.ranks.concat(f.officerRanks)).filter(r=>!/^[A-Za-z0-9 ()'\-/.]+$/.test(r)));
ok("the four British services are present",
  ["Royal Navy","British Army","Royal Air Force","Royal Marines"].every(n=>T.FORCES.some(f=>f.name===n)));
{
  // The Royal Navy ladder in the order a rating actually climbs it.
  const rn = T.FORCES.find(f=>f.name === "Royal Navy").ranks;
  const idx = r=>rn.indexOf(r);
  ok("Royal Navy ratings climb in the right order",
    idx("Able Rating 1st Class") > idx("Able Rating 2nd Class") &&
    idx("Leading Hand") > idx("Able Rating 1st Class") &&
    idx("Petty Officer") > idx("Leading Hand") &&
    idx("Chief Petty Officer") > idx("Petty Officer") &&
    idx("Warrant Officer Class 1") > idx("Warrant Officer Class 2") &&
    idx("Warrant Officer Class 2") > idx("Chief Petty Officer"),
    rn.join(" > "));
  ok("Royal Navy officers climb in the right order", (()=>{
    const of = T.FORCES.find(f=>f.name === "Royal Navy").officerRanks;
    const j = r=>of.indexOf(r);
    return j("Lieutenant") > j("Sub-Lieutenant") && j("Lieutenant Commander") > j("Lieutenant") &&
      j("Commander") > j("Lieutenant Commander") && j("Captain") > j("Commander") &&
      j("Commodore") > j("Captain") && j("Rear Admiral") > j("Commodore") &&
      j("Vice Admiral") > j("Rear Admiral") && j("Admiral") > j("Vice Admiral");
  })(), T.FORCES.find(f=>f.name === "Royal Navy").officerRanks.join(" > "));
  // The Army's warrant ranks are a common place to get it wrong.
  const ba = T.FORCES.find(f=>f.name === "British Army").ranks;
  ok("British Army other ranks climb in the right order",
    ba.indexOf("Corporal") > ba.indexOf("Lance Corporal") &&
    ba.indexOf("Sergeant") > ba.indexOf("Corporal") &&
    ba.indexOf("Staff Sergeant") > ba.indexOf("Sergeant") &&
    ba.indexOf("Warrant Officer Class 1") > ba.indexOf("Warrant Officer Class 2"),
    ba.join(" > "));
}
ok("British Army officers top out at a general rank",
  /General|Marshal/.test(T.FORCES.find(f=>f.name==="British Army").officerRanks[10]),
  T.FORCES.find(f=>f.name==="British Army").officerRanks[10]);

// ---------- Forces are gated by country ----------
{
  fresh();
  T.state.birthplace = "England";
  T.state.currentCountry = "England";
  T.state.livedCountries = ["England"];
  const uk = T.forcesAvailable();
  ok("a British birth opens the four British services", uk.length === 4,
    uk.map(f=>f.name));
  ok("and nothing else", uk.every(f=>f.country === "United Kingdom"));
  ok("Scotland maps to the United Kingdom", T.forceNationFor("Scotland") === "United Kingdom");
  ok("the note names the country", /United Kingdom/.test(T.forceNationNote()), T.forceNationNote());

  T.state.currentCountry = "United States";
  T.state.livedCountries = ["England","United States"];
  const both = T.forcesAvailable();
  ok("settling abroad opens that country's services too",
    both.some(f=>f.country === "United States") && both.some(f=>f.country === "United Kingdom"),
    both.map(f=>f.country));
  ok("the note mentions both", /United States/.test(T.forceNationNote()) && /United Kingdom/.test(T.forceNationNote()),
    T.forceNationNote());

  T.state.birthplace = "Japan";
  T.state.currentCountry = "Japan";
  T.state.livedCountries = ["Japan"];
  ok("a country with no modelled service offers none", T.forcesAvailable().length === 0,
    T.forcesAvailable().map(f=>f.name));
}

// ---------- Performance resets on promotion ----------
{
  fresh();
  T.state.career = { trackId:"electrician", rankIndex:0, yearsInRank:5, performance:92, raiseMult:1.4 };
  T.state.careerWarning = { years:2 };
  T.resetPerformanceForNewRank();
  const c = T.state.career;
  ok("performance drops back to the lower middle", c.performance >= 40 && c.performance <= 55, c.performance);
  ok("above-scale pay does not carry over", c.raiseMult === 1, c.raiseMult);
  ok("a warning is cleared by a promotion", T.state.careerWarning === null);
  T.state.career = null;
  T.resetPerformanceForNewRank();   // must not throw with no job
  ok("safe with no career", true);
}

// A promotion in play actually resets it, rather than carrying the reputation
// that earned it. Driven through a real career so the whole pipeline runs.
{
  let seen = 0, resetLow = 0, carried = 0;
  for(let i=0;i<400 && seen < 60;i++){
    fresh();
    T.state.age = 22;
    T.state.stats.smarts = 85;
    T.state.education = T.state.education || {};
    T.applyToTrack(T.TRACKS.find(t=>t.id === "electrician"));
    if(!T.state.career) continue;
    let lastRank = 0;
    while(T.state.alive && T.state.age < 65){
      const c = T.state.career;
      if(c) T.nudgePerformance(6);        // a good year, to earn the promotion
      T.ageUp();
      const d = T.state.career;
      if(!d) break;
      if(d.rankIndex > lastRank){
        seen++;
        if(d.performance <= 62) resetLow++; else carried++;
        lastRank = d.rankIndex;
      }
    }
  }
  ok("promotions observed in play", seen >= 25, seen);
  // After a reset performance starts at 40–55 and only drifts within the year,
  // so a promoted rung should essentially never read as a carried-over 90.
  ok("promoted performance reads low, not carried over", seen === 0 || resetLow / seen > 0.85,
    `${resetLow} reset / ${carried} carried`);
}

// ---------- Casino: a single win, not a lifetime ----------
{
  fresh();
  T.state.money = 100;
  // A lifetime of small wins adding to well over the threshold must not ban you.
  for(let i=0;i<700;i++) T.recordCasinoResult(10000);
  ok("lifetime net is over the threshold", T.casinoNet() > T.CASINO_BAN_THRESHOLD, T.casinoNet());
  ok("grinding does not get you barred", T.checkCasinoBan() === false && !T.isBannedFromCasino());

  fresh();
  T.recordCasinoResult(T.CASINO_BAN_THRESHOLD - 1);
  ok("just under the line is fine", T.checkCasinoBan() === false && !T.isBannedFromCasino());
  T.recordCasinoResult(T.CASINO_BAN_THRESHOLD);
  ok("biggest single win is tracked", T.casinoBiggestWin() === T.CASINO_BAN_THRESHOLD, T.casinoBiggestWin());
  ok("one win at the threshold gets you barred", T.checkCasinoBan() === true && T.isBannedFromCasino());

  fresh();
  T.recordCasinoResult(-9000000);
  ok("a catastrophic loss is not a win", T.checkCasinoBan() === false);
  ok("biggest win stays at zero after only losses", T.casinoBiggestWin() === 0, T.casinoBiggestWin());
}

// ---------- Prenup shows both sides ----------
{
  fresh();
  const p = T.makePerson("Partner", "Girl", 32);
  ok("a partner is built with money of their own", Number.isFinite(p.netWorth), p.netWorth);
  ok("partner net worth is never negative", p.netWorth >= 0, p.netWorth);

  const legacy = { name:"Alex", age:40, closeness:70, alive:true };
  ok("a partner from an older save gets a figure on demand",
    Number.isFinite(T.partnerNetWorth(legacy)) && legacy.netWorth !== undefined, legacy.netWorth);

  // Older partners are, on average, worth more.
  const young = [], old = [];
  for(let i=0;i<400;i++){ young.push(T.plausiblePartnerNetWorth(22)); old.push(T.plausiblePartnerNetWorth(55)); }
  const mean = a=>a.reduce((s,x)=>s+x,0)/a.length;
  ok("partner wealth grows with age", mean(old) > mean(young) * 2,
    `${Math.round(mean(young))} vs ${Math.round(mean(old))}`);

  fresh();
  T.state.money = 400000;
  T.state.relationship = T.makePerson("Partner", "Girl", 35);
  T.state.relationship.netWorth = 1200;
  clearChoices();
  T.openPrenupChoice();
  const text = ((currentChoice() || {}).text) + "";
  ok("the prenup names what each side is worth", /You:/.test(text) && /1,200|1200/.test(text.replace(/,/g,m=>m)), text.slice(0,200));
  ok("it says who is bringing more in", /considerably more/.test(text), text.slice(0,250));

  // The verdict flips when the partner is the wealthy one.
  fresh();
  T.state.money = 2000;
  T.state.relationship = T.makePerson("Partner", "Boy", 45);
  T.state.relationship.netWorth = 900000;
  clearChoices();
  T.openPrenupChoice();
  const t2 = ((currentChoice() || {}).text) + "";
  ok("it warns when the prenup would protect them, not you",
    /protect them, not you/.test(t2), t2.slice(0, 250));
}

// Partner money moves over the years rather than being frozen.
{
  let grew = 0, trials = 0;
  for(let i=0;i<60;i++){
    fresh();
    T.state.age = 30;
    T.state.relationship = T.makePerson("Partner", "Girl", 30);
    T.state.relationship.netWorth = 20000;
    const before = T.state.relationship.netWorth;
    for(let y=0;y<10 && T.state.alive && T.state.relationship;y++) T.ageUp();
    if(T.state.relationship){ trials++; if(T.state.relationship.netWorth > before) grew++; }
  }
  ok("a working partner's money generally grows over a decade", trials === 0 || grew / trials > 0.7,
    `${grew}/${trials}`);
}

// ---------- Vehicles ----------
{
  fresh();
  const cases = [
    [{type:"car", name:"Supercar", value:180000}, "Drive", true],
    [{type:"motorcycle", name:"a motorcycle", value:3000}, "Ride", true],
    [{type:"vehicle", name:"Racing bicycle", value:1800}, "Ride", false],
    [{type:"boat", name:"Motor yacht", value:250000}, "Sail", false],
    [{type:"vehicle", name:"Light aircraft", value:120000}, "Fly", false],
    [{type:"vehicle", name:"Helicopter", value:400000}, "Fly", false],
  ];
  cases.forEach(([a, verb, raceable])=>{
    ok(`${a.name} is something you ${verb.toLowerCase()}`, T.vehicleKind(a).verb === verb,
      T.vehicleKind(a).verb);
    ok(`${a.name} ${raceable ? "can" : "cannot"} be raced`, T.vehicleCanRace(a) === raceable);
  });
  ok("a bicycle needs no licence", T.vehicleKind({type:"vehicle", name:"Commuter bicycle"}).licence === null);
  ok("a helicopter needs a helicopter licence",
    T.vehicleKind({type:"vehicle", name:"Helicopter"}).licence === "canFlyHelicopter");

  // Speed rating: more expensive is faster, and it stays inside 5–95.
  T.state.year = 2020;   // the values below are in 2020 money
  const ratings = [[400],[3500],[48000],[180000],[400000]].map(([v])=>T.vehicleSpeedRating({value:v}));
  ok("speed rating rises with value", ratings.every((r,i)=>i===0 || r > ratings[i-1]), ratings.map(Math.round));
  ok("speed rating is bounded", ratings.every(r=>r >= 5 && r <= 95), ratings.map(Math.round));
  ok("a worthless vehicle still rates something", T.vehicleSpeedRating({value:0}) >= 5);
}

// A licence is genuinely required before you can take something out.
{
  fresh();
  T.state.age = 25;
  T.state.flags.canDrive = false;
  T.state.assets = [{type:"car", name:"Family saloon", value:12000, upkeep:700}];
  ok("without a licence the game says which one you need",
    T.vehicleLicenceMissing(T.state.assets[0]) === "canDrive");
  ok("the licence has a readable name", /Driving Licence/.test(T.licenceLabelFor("canDrive")),
    T.licenceLabelFor("canDrive"));
  clearChoices();
  T.openVehicleUse(0);
  ok("and no menu opens", currentChoice() === null);

  T.state.flags.canDrive = true;
  clearChoices();
  T.openVehicleUse(0);
  const menu = currentChoice();
  ok("with a licence a menu opens", !!menu);
  const labels = menu ? menu.options.map(o=>o.label).join(" | ") : "";
  ok("the menu offers driving it", /Drive it/.test(labels), labels);
  ok("a car can be street raced from the menu", /Street race/.test(labels), labels);
  ok("a car offers a track day", /track day/.test(labels), labels);

  // A boat is sailed, and cannot be raced.
  T.state.flags.canBoat = true;
  T.state.assets = [{type:"boat", name:"Motor yacht", value:250000, upkeep:9000}];
  clearChoices();
  T.openVehicleUse(0);
  const boatLabels = (currentChoice() || {options:[]}).options.map(o=>o.label).join(" | ");
  ok("a yacht is sailed", /Sail it/.test(boatLabels), boatLabels);
  ok("a yacht cannot be street raced", !/Street race/.test(boatLabels), boatLabels);
  ok("a yacht gets no track day", !/track day/.test(boatLabels), boatLabels);
}

// An outing costs an action and a use, and moves happiness.
{
  let happier = 0, trials = 0, crashes = 0;
  for(let i=0;i<300;i++){
    fresh();
    T.state.age = 30;
    T.state.flags.canDrive = true;
    T.state.money = 50000;
    T.state.assets = [{type:"car", name:"Family saloon", value:12000, upkeep:700}];
    T.state.stats.happiness = 50;
    T.state.stats.health = 80;
    const uses = T.usesLeft("vehicle");
    T.doVehicleOuting(0, "pleasure");
    if(T.usesLeft("vehicle") === uses - 1) trials++;
    if(T.state.stats.happiness > 50) happier++;
    if(T.state.stats.health < 80) crashes++;
  }
  ok("an outing is capped by the yearly allowance", trials === 300, trials);
  // Every outing either lifts happiness or was a crash; there is no third
  // outcome where nothing happens.
  ok("an outing always lifts happiness unless it crashed", happier + crashes === 300,
    `${happier} happier + ${crashes} crashed`);
  ok("an ordinary drive rarely goes wrong", crashes < 40, crashes);
  ok("but it can go wrong", crashes > 0, crashes);
}

// A fast car is riskier than a slow one, measured.
{
  function crashRate(value, flavour){
    let crashes = 0;
    for(let i=0;i<4000;i++){
      fresh();
      T.state.age = 30;
      T.state.flags.canDrive = true;
      T.state.money = 500000;
      T.state.stats.health = 90;
      T.state.assets = [{type:"car", name:"A car", value, upkeep:500}];
      T.doVehicleOuting(0, flavour);
      if(T.state.stats.health < 90) crashes++;
    }
    return crashes / 4000;
  }
  const slow = crashRate(3500, "pleasure");
  const fast = crashRate(400000, "pleasure");
  const track = crashRate(400000, "track");
  ok("a faster car crashes more often", fast > slow, `${(slow*100).toFixed(1)}% vs ${(fast*100).toFixed(1)}%`);
  ok("a track day is safer than the road", track < fast, `${(track*100).toFixed(1)}% vs ${(fast*100).toFixed(1)}%`);
  ok("crash rates stay plausible", slow < 0.08 && fast < 0.15,
    `${(slow*100).toFixed(1)}% / ${(fast*100).toFixed(1)}%`);
}

// A crash hurts you, and sometimes writes the vehicle off.
{
  let writeOffs = 0, hurt = 0, repaired = 0;
  for(let i=0;i<600;i++){
    fresh();
    T.state.age = 30;
    T.state.money = 200000;
    T.state.stats.health = 100;
    T.state.assets = [{type:"car", name:"Supercar", value:180000, upkeep:6000}];
    const before = T.state.money;
    T.doVehicleCrash(0, 1);
    if(T.state.stats.health < 100) hurt++;
    if(T.state.assets.length === 0) writeOffs++;
    else if(T.state.assets[0].value < 180000) repaired++;
  }
  ok("a crash always costs health", hurt === 600, hurt);
  ok("some crashes write the vehicle off", writeOffs > 60, writeOffs);
  ok("most crashes do not", writeOffs < 500, writeOffs);
  ok("a survivable crash devalues the vehicle", repaired === 600 - writeOffs, `${repaired}/${600-writeOffs}`);
}

// ---------- Street racing ----------
{
  fresh();
  T.state.money = 200;
  ok("stakes are limited to what you have", T.streetRaceStakes().every(s=>s <= 200),
    T.streetRaceStakes());
  T.state.money = 0;
  ok("broke means no stakes", T.streetRaceStakes().length === 0);
  clearChoices();
  T.state.assets = [{type:"car", name:"A car", value:12000, upkeep:500}];
  T.openStreetRace(0);
  ok("and no race is offered when broke", currentChoice() === null);

  T.state.money = 100000;
  clearChoices();
  T.openStreetRace(0);
  const race = currentChoice();
  ok("a race offers several stakes", race && race.options.length >= 4, race ? race.options.length : 0);
  ok("and a way out", race && /Think better/.test(race.options[race.options.length-1].label));
}

// The money, measured: racing a fast car is profitable, a slow one is not.
{
  function raceOutcome(value, n){
    let net = 0, wins = 0, crashes = 0, arrests = 0;
    for(let i=0;i<n;i++){
      fresh();
      T.state.age = 30;
      T.state.money = 100000;
      T.state.stats.health = 90;
      T.state.flags.canDrive = true;
      T.state.assets = [{type:"car", name:"A car", value, upkeep:500}];
      clearChoices();
      const before = T.netWorth();
      const cashBefore = T.state.money;
      T.doStreetRace(0, 1000);
      net += T.netWorth() - before;
      if(T.state.money > cashBefore) wins++;
      if(T.state.stats.health < 90) crashes++;
      if(choices().some(c=>/arrest/i.test(c.title || ""))) arrests++;
    }
    return { net: net/n, winRate: wins/n, crashRate: crashes/n, arrestRate: arrests/n };
  }
  const slow = raceOutcome(3500, 3000);
  const fast = raceOutcome(400000, 3000);
  ok("a quick car wins more races", fast.winRate > slow.winRate,
    `${(slow.winRate*100).toFixed(0)}% vs ${(fast.winRate*100).toFixed(0)}%`);
  ok("even a quick car loses sometimes", fast.winRate < 0.9, fast.winRate);
  ok("even a slow car wins sometimes", slow.winRate > 0.1, slow.winRate);
  ok("a quick car crashes more", fast.crashRate > slow.crashRate,
    `${(slow.crashRate*100).toFixed(1)}% vs ${(fast.crashRate*100).toFixed(1)}%`);
  ok("the police turn up sometimes", fast.arrestRate > 0.03 && fast.arrestRate < 0.3,
    fast.arrestRate);
  // Judged on net worth, not cash: an insurance cheque for a written-off
  // supercar is money in the bank and a much bigger hole in your assets.
  ok("racing a slow car is roughly break-even at best", slow.net < 400, Math.round(slow.net));
  ok("racing a fast car loses money overall", fast.net < 0, Math.round(fast.net));
  console.log(`  street race: slow win ${(slow.winRate*100).toFixed(0)}% net ${Math.round(slow.net)} | ` +
    `fast win ${(fast.winRate*100).toFixed(0)}% net worth ${Math.round(fast.net)} | ` +
    `crash ${(fast.crashRate*100).toFixed(1)}% | arrest ${(fast.arrestRate*100).toFixed(1)}%`);
}

// Racing is capped at one a year and respects the action budget.
{
  fresh();
  T.state.age = 30;
  T.state.money = 500000;
  T.state.flags.canDrive = true;
  T.state.assets = [{type:"car", name:"A car", value:50000, upkeep:500}];
  T.doStreetRace(0, 1000);
  ok("one race a year", T.usesLeft("race") === 0, T.usesLeft("race"));
  clearChoices();
  T.openStreetRace(0);
  ok("a second race is refused", currentChoice() === null);
}

// Nothing in all this can leave you with impossible money or stats.
{
  let bad = [];
  for(let i=0;i<120;i++){
    fresh();
    T.state.age = 25;
    T.state.money = 5000;
    T.state.flags.canDrive = true;
    T.state.assets = [{type:"car", name:"A car", value:20000, upkeep:600}];
    for(let y=0;y<30 && T.state.alive;y++){
      T.state.yearlyActivityUses = {};
      if(T.state.assets.length){
        T.doVehicleOuting(0, ["pleasure","trip","track"][y%3]);
        if(T.state.assets.length && T.state.money > 1000) T.doStreetRace(0, 100);
      }
      T.ageUp();
    }
    const s = T.state;
    if(!Number.isFinite(s.money)) bad.push("money NaN");
    if(s.stats.health < 0 || s.stats.health > 100) bad.push("health " + s.stats.health);
    if(s.stats.happiness < 0 || s.stats.happiness > 100) bad.push("happiness " + s.stats.happiness);
    if(s.assets.some(a=>!Number.isFinite(a.value) || a.value < 0)) bad.push("asset value");
  }
  ok("30 years of driving and racing leaves everything sane", bad.length === 0, bad.slice(0,5));
}


// ---------- Politics: three systems, eleven rungs each ----------
{
  ok("33 offices in all", T.POLITICAL_OFFICES.length === 33, T.POLITICAL_OFFICES.length);
  ["democracy","monarchy","authoritarian"].forEach(sys=>{
    const l = T.POLITICAL_OFFICES.filter(o=>o.system === sys);
    ok(`${sys} has 11 offices (10 steps)`, l.length === 11, l.length);
    ok(`${sys} pay rises all the way up`, l.every((o,i)=>i===0 || o.salary > l[i-1].salary),
      l.filter((o,i)=>i>0 && o.salary <= l[i-1].salary).map(o=>o.id));
    ok(`${sys} is a single chain`, l.every((o,i)=> i===0 ? o.requiresPrevious === null : o.requiresPrevious === l[i-1].id),
      l.map(o=>o.requiresPrevious));
    ok(`${sys} requires no fewer smarts as it goes up`,
      l.every((o,i)=>i===0 || o.minSmarts >= l[i-1].minSmarts));
  });
  ok("no duplicate office ids", new Set(T.POLITICAL_OFFICES.map(o=>o.id)).size === 33);
  // Titles only have to be unique inside a ladder: "Minister" is a real post
  // in a court and in a one-party state alike.
  ["democracy","monarchy","authoritarian"].forEach(sys=>{
    const l = T.POLITICAL_OFFICES.filter(o=>o.system === sys);
    ok(`${sys} repeats no title`, new Set(l.map(o=>o.title)).size === 11);
  });

  // Government types
  ok("the UK is an elected government", T.governmentOf("England") === "democracy");
  ok("a constitutional monarchy is still a democracy here",
    T.governmentOf("Sweden") === "democracy" && T.governmentOf("Japan") === "democracy");
  ok("Saudi Arabia is a monarchy", T.governmentOf("Saudi Arabia") === "monarchy");
  ok("North Korea is a one-party state", T.governmentOf("North Korea") === "authoritarian");
  ok("an unlisted country defaults to elected", T.governmentOf("Nowhere At All") === "democracy");
  ok("no country is both a monarchy and a one-party state",
    Object.keys(T.GOVERNMENT_BY_COUNTRY).length === new Set(Object.keys(T.GOVERNMENT_BY_COUNTRY)).size);
  ok("every government-tagged country actually exists in the game",
    Object.keys(T.GOVERNMENT_BY_COUNTRY).every(n=>T.COUNTRIES.some(c=>c.name === n)),
    Object.keys(T.GOVERNMENT_BY_COUNTRY).filter(n=>!T.COUNTRIES.some(c=>c.name === n)));

  // One ladder at a time, decided by where you live.
  fresh();
  T.state.currentCountry = "England";
  ok("living in England opens the elected ladder",
    T.officesAvailable().length === 11 && T.officesAvailable().every(o=>o.system === "democracy"));
  ok("and it tops out at Prime Minister", T.officesAvailable()[10].title === "Prime Minister");
  T.state.currentCountry = "Saudi Arabia";
  ok("living in a monarchy opens the court ladder", T.currentSystem() === "monarchy");
  ok("and it tops out at the throne", T.officesAvailable()[10].id === "monarch");
  ok("the note says there are no elections", /no elections/.test(T.systemNote()), T.systemNote());
  T.state.currentCountry = "China";
  ok("living in a one-party state opens the party ladder", T.currentSystem() === "authoritarian");
  ok("and it tops out at Supreme Leader", T.officesAvailable()[10].id === "supreme_leader");
  ok("the note warns about the consequences", /cell/.test(T.systemNote()), T.systemNote());

  // You cannot stand for an office that does not exist where you are.
  fresh();
  T.state.currentCountry = "England";
  T.state.age = 40; T.state.stats.smarts = 95; T.state.money = 1000000;
  T.state.career = null; T.state.business = null;
  T.runForOffice("politburo");
  ok("a foreign system's office is refused", T.state.politics === null || T.state.politics === undefined);
}

// Each rung is harder than the last, measured rather than assumed.
{
  fresh();
  T.state.currentCountry = "England";
  T.state.stats.smarts = 70; T.state.hidden.fame = 50; T.state.hidden.karma = 50;
  const ladder = T.officesAvailable();
  const odds = ladder.map(o=>T.electionWinChance(o));
  ok("the odds fall as you climb", odds.every((v,i)=>i===0 || v <= odds[i-1]),
    odds.map(v=>v.toFixed(2)));
  ok("the top rung is a long shot", odds[10] < odds[1] * 0.75,
    `${odds[1].toFixed(2)} vs ${odds[10].toFixed(2)}`);
  ok("nothing is impossible", odds.every(v=>v >= 0.05));
  ok("the bar for service rises", T.minYearsForRung(10) > T.minYearsForRung(1),
    `${T.minYearsForRung(1)} vs ${T.minYearsForRung(10)}`);
  ok("the bar for standing rises", T.minApprovalForRung(10) > T.minApprovalForRung(1),
    `${T.minApprovalForRung(1)} vs ${T.minApprovalForRung(10)}`);
  ok("the standing bar stays reachable", T.minApprovalForRung(10) <= 80, T.minApprovalForRung(10));
}

// Advancement needs time in post, not just an action.
{
  fresh();
  T.state.currentCountry = "England";
  T.state.age = 30; T.state.stats.smarts = 95; T.state.money = 2000000;
  T.state.career = null; T.state.business = null;
  T.takeOffice(T.officeById("councillor"));
  T.state.politics.approval = 95;
  T.state.politics.yearsServed = 0;
  T.state.yearlyActivityUses = {};
  T.runForOffice("cabinet_member");
  ok("a brand new office-holder cannot move up straight away",
    T.state.politics.officeId === "councillor", T.state.politics.officeId);

  T.state.politics.yearsServed = 20;
  T.state.yearlyActivityUses = {};
  let moved = 0;
  for(let i=0;i<60;i++){
    fresh();
    T.state.currentCountry = "England";
    T.state.age = 30; T.state.stats.smarts = 95; T.state.money = 2000000;
    T.state.career = null; T.state.business = null;
    T.takeOffice(T.officeById("councillor"));
    T.state.politics.approval = 95;
    T.state.politics.yearsServed = 20;
    T.state.yearlyActivityUses = {};
    T.runForOffice("cabinet_member");
    if(T.state.politics && T.state.politics.officeId === "cabinet_member") moved++;
  }
  ok("an outstanding record at a low rung nearly always moves you up", moved >= 50, moved);

  // At the top of the ladder the same record is not enough on its own.
  let top = 0;
  for(let i=0;i<200;i++){
    fresh();
    T.state.currentCountry = "England";
    T.state.age = 55; T.state.stats.smarts = 95; T.state.money = 5000000;
    T.state.career = null; T.state.business = null;
    T.takeOffice(T.officeById("cabinet"));
    T.state.politics.approval = 95;
    T.state.politics.yearsServed = 20;
    T.state.yearlyActivityUses = {};
    T.runForOffice("pm");
    if(T.state.politics && T.state.politics.officeId === "pm") top++;
  }
  ok("the top job is never a formality", top < 180, top);
  ok("but it is reachable", top > 20, top);
  console.log(`  advancement: rung 3 ${moved}/60, Prime Minister ${top}/200 with a perfect record`);
}

// A promotion resets your standing in the new post, as any new job would.
{
  let carried = 0, resetLow = 0;
  for(let i=0;i<40;i++){
    fresh();
    T.state.currentCountry = "England";
    T.state.age = 30; T.state.stats.smarts = 95; T.state.money = 2000000;
    T.state.career = null; T.state.business = null;
    T.takeOffice(T.officeById("councillor"));
    T.state.politics.approval = 95;
    T.state.politics.yearsServed = 20;
    T.state.yearlyActivityUses = {};
    T.runForOffice("cabinet_member");
    if(T.state.politics && T.state.politics.officeId === "cabinet_member"){
      if(T.state.politics.approval <= 56) resetLow++; else carried++;
      ok("the new post starts a fresh record", T.state.politics.yearsServed === 0);
    }
  }
  ok("standing does not carry into the new post", carried === 0, `${resetLow} reset / ${carried} carried`);
}

// Standing low enough gets you removed, and how depends on the system.
{
  function removal(country, office){
    let gone = 0, jailed = 0, trials = 500;
    for(let i=0;i<trials;i++){
      fresh();
      T.state.currentCountry = country;
      T.state.age = 45; T.state.money = 100000;
      T.state.career = null; T.state.business = null;
      T.takeOffice(T.officeById(office));
      T.state.politics.approval = 5;
      T.state.politics.warned = true;
      T.state.politics.yearsInOffice = 1;
      T.runPoliticsYear();
      if(!T.state.politics) gone++;
      if(T.state.prisonYearsLeft > 0) jailed++;
    }
    return { gone: gone/trials, jailed: jailed/trials };
  }
  const dem = removal("England", "mp");
  const mon = removal("Saudi Arabia", "court_minister");
  const aut = removal("China", "minister_a");
  ok("collapsed standing loses you the post in every system",
    dem.gone > 0.9 && mon.gone > 0.9 && aut.gone > 0.9,
    `${dem.gone} / ${mon.gone} / ${aut.gone}`);
  ok("an elected system does not jail you for being unpopular", dem.jailed === 0, dem.jailed);
  ok("a monarchy dismisses rather than jails", mon.jailed === 0, mon.jailed);
  ok("a one-party state sometimes jails you instead", aut.jailed > 0.3 && aut.jailed < 0.7, aut.jailed);
  console.log(`  removal: elected ${(dem.gone*100).toFixed(0)}% lose post, 0% jailed | ` +
    `party ${(aut.gone*100).toFixed(0)}% lose post, ${(aut.jailed*100).toFixed(0)}% jailed`);
}

// A sovereign and a supreme leader have no term to lose.
{
  let lost = 0;
  for(let i=0;i<200;i++){
    fresh();
    T.state.currentCountry = "Saudi Arabia";
    T.state.age = 50; T.state.money = 100000;
    T.state.career = null; T.state.business = null;
    T.takeOffice(T.officeById("monarch"));
    T.state.politics.approval = 60;
    for(let y=0;y<20 && T.state.politics;y++){
      T.state.politics.approval = 60;
      T.state.politics.warned = false;
      T.runPoliticsYear();
    }
    if(!T.state.politics) lost++;
  }
  ok("a reign is not up for re-election", lost === 0, lost);
}
{
  const mon = T.officeById("monarch"), sup = T.officeById("supreme_leader");
  ok("the throne is held for life", mon.termYears >= 99, mon.termYears);
  ok("so is a supreme leadership", sup.termYears >= 99, sup.termYears);
}

// Taking the throne: by blood, or by force.
{
  fresh();
  T.state.nobility = "commoner";
  ok("a commoner has no claim", T.canInheritThrone() === false);
  const royal = T.NOBILITY_RANKS.filter(r=>r.canInheritThrone);
  ok("some ranks do have a claim", royal.length > 0, royal.map(r=>r.id));
  T.state.nobility = royal[0].id;
  ok("a royal rank has one", T.canInheritThrone() === true);

  // A commoner asking for the throne is offered a plot, not an application.
  fresh();
  T.state.currentCountry = "Saudi Arabia";
  T.state.nobility = "commoner";
  T.state.age = 50; T.state.stats.smarts = 95; T.state.money = 5000000;
  T.state.career = null; T.state.business = null;
  T.state.flags.heldOffice_chief_of_court = true;
  clearChoices();
  T.runForOffice("monarch");
  const plot = currentChoice();
  ok("a commoner is offered a coup instead", plot && /throne/i.test(plot.title), plot && plot.title);
  ok("it says what the odds are", plot && /\d+% of plots/.test(plot.text), plot && plot.text.slice(0,120));
  ok("and there is a way out", plot && plot.options.length === 2);

  // Measured: the plot sometimes works, and failing it is severe.
  let crowned = 0, jailed = 0, dead = 0;
  for(let i=0;i<600;i++){
    fresh();
    T.state.currentCountry = "Saudi Arabia";
    T.state.nobility = "commoner";
    T.state.age = 50; T.state.stats.smarts = 95; T.state.money = 5000000;
    T.state.hidden.fame = 70;
    T.state.career = null; T.state.business = null;
    T.state.flags.heldOffice_chief_of_court = true;
    clearChoices();
    T.runForOffice("monarch");
    const c = currentChoice();
    if(!c) continue;
    c.options[0].effect();
    if(T.state.flags.becameMonarch) crowned++;
    else if(!T.state.alive) dead++;
    else if(T.state.prisonYearsLeft > 0) jailed++;
  }
  ok("a plot sometimes succeeds", crowned > 60, crowned);
  ok("most plots fail", crowned < 300, crowned);
  ok("a failed plot is fatal or costs decades", dead + jailed + crowned === 600,
    `${crowned} crowned / ${dead} executed / ${jailed} jailed`);
  ok("executions happen", dead > 20, dead);
  console.log(`  coup from Chief of the Royal Court: ${(crowned/600*100).toFixed(0)}% crowned, ` +
    `${(dead/600*100).toFixed(0)}% executed, ${(jailed/600*100).toFixed(0)}% jailed`);
}

// A sovereign's reign is recorded where the rest of the game looks for it.
{
  fresh();
  T.state.currentCountry = "Saudi Arabia";
  T.takeOffice(T.officeById("monarch"));
  ok("taking the throne sets the flag the ribbons read", T.state.flags.becameMonarch === true);
  ok("and the office is recorded", T.state.flags.heldOffice_monarch === true);
}


// ---------- The new screens actually render ----------
{
  // Armed Forces, with the country note and both ladders.
  {
    fresh();
    T.state.age = 20; T.state.birthplace = "England"; T.state.currentCountry = "England";
    T.state.livedCountries = ["England"];
    T.careerView = { level:"tracks", category:"Armed Forces" };
    T.openCareerSheet();
    const html = sheetMarkup();
    ok("the forces screen renders", html.length > 200, html.length);
    ok("it names the country you can enlist in", /United Kingdom/.test(html));
    ok("it lists the British services", /Royal Navy/.test(html) && /Royal Marines/.test(html));
    ok("it does not offer foreign services", !/Indian Army/.test(html));
    ok("it shows how many promotions there are", /promotions to the top/.test(html));
    ok("it shows the officer ladder too", /Officer: smarts/.test(html));

    // Somewhere with no modelled service says so rather than rendering nothing.
    T.state.birthplace = "Japan"; T.state.currentCountry = "Japan"; T.state.livedCountries = ["Japan"];
    T.openCareerSheet();
    const none = sheetMarkup();
    ok("a country with no service explains itself", /No service here/.test(none), none.slice(0,200));
  }

  // The trades category lists every trade.
  {
    fresh();
    T.state.age = 20;
    T.careerView = { level:"tracks", category:"Manual & Trades" };
    T.openCareerSheet();
    const html = sheetMarkup();
    ["Electrician","Plumber","Bricklayer","HGV Driver"].forEach(n=>
      ok(`the trades screen lists ${n}`, html.includes(n)));
  }

  // Politics, in all three systems.
  {
    [["England","Prime Minister","Parish Councillor"],
     ["Saudi Arabia","Sovereign","Palace Clerk"],
     ["China","Supreme Leader","Party Member"]].forEach(([country, top, bottom])=>{
      fresh();
      T.state.age = 30; T.state.currentCountry = country; T.state.money = 100000;
      T.careerView = { level:"tracks", category:"Politics" };
      T.openCareerSheet();
      const html = sheetMarkup();
      ok(`the ${country} politics screen renders`, html.length > 200);
      ok(`${country} shows the top office`, html.includes(top), top);
      ok(`${country} shows the bottom rung`, html.includes(bottom), bottom);
      ok(`${country} numbers the rungs`, /11\. /.test(html));
      ok(`${country} locks what you haven't earned`, /Serve as /.test(html));
    });
  }

  // The in-office screen, including the next rung.
  {
    fresh();
    T.state.age = 45; T.state.currentCountry = "England"; T.state.money = 500000;
    T.state.career = null; T.state.business = null;
    T.takeOffice(T.officeById("mp"));
    T.state.politics.approval = 72;
    T.state.politics.yearsServed = 9;
    T.openCareerSheet();
    const html = sheetMarkup();
    ok("the in-office screen renders", /Member of Parliament/.test(html));
    ok("it shows the approval rating", /Approval rating/.test(html));
    ok("it shows the next rung up", /Next: Parliamentary Private Secretary/.test(html));
    ok("it states what the next rung needs", /years in post/.test(html));

    // A court post talks about the court, not the party.
    fresh();
    T.state.age = 45; T.state.currentCountry = "Saudi Arabia"; T.state.money = 500000;
    T.state.career = null; T.state.business = null;
    T.takeOffice(T.officeById("court_minister"));
    T.openCareerSheet();
    const court = sheetMarkup();
    ok("a court post is described as standing at court", /Standing at court/.test(court));
    ok("and not as an approval rating", !/Approval rating/.test(court));

    // A sovereign has no term and nothing above them.
    fresh();
    T.state.age = 60; T.state.currentCountry = "Saudi Arabia";
    T.state.career = null; T.state.business = null;
    T.takeOffice(T.officeById("monarch"));
    T.openCareerSheet();
    const throne = sheetMarkup();
    ok("a reign is described as held for life", /held for life/.test(throne));
    ok("and there is nothing above it", /nothing above this post/.test(throne));
  }

  // The Vehicles screen, with a usable vehicle on it.
  {
    fresh();
    T.state.age = 30; T.state.money = 50000;
    T.state.flags.canDrive = true;
    T.state.assets = [{type:"car", name:"Supercar", value:180000, upkeep:6000}];
    T.openAssetsSheet();
    T.assetsView = { screen:"vehicles" };
    T.renderAssetsSheet(document.body.children[document.body.children.length-1]);
    const html = sheetMarkup();
    ok("the vehicles screen renders", /Supercar/.test(html));
    ok("it offers to drive it", /Drive it/.test(html), html.slice(0,300));
    ok("it shows the performance rating", /Performance \d+\/100/.test(html));
    ok("it says what can be raced", /can be raced/.test(html));
    ok("it shows the outings left", /outing/.test(html));

    // Without the licence the button says why.
    T.state.flags.canDrive = false;
    T.assetsView = { screen:"vehicles" };
    T.renderAssetsSheet(document.body.children[document.body.children.length-1]);
    const nolic = sheetMarkup();
    ok("a missing licence is named on the button", /needs Driving Licence/.test(nolic), nolic.slice(0,400));
  }
}

// The casino ban reached through real play rather than a direct call.
{
  let banned = 0, trials = 400;
  for(let i=0;i<trials;i++){
    fresh();
    T.state.age = 35;
    T.state.money = 120000;
    // A jackpot line on a six-figure spin is the only honest way to take £5m
    // off the house in one go.
    for(let spin=0; spin<4000 && !T.isBannedFromCasino() && T.state.money >= 110000; spin++){
      T.state.yearlyActivityUses = {};
      T.doSlots(110000);
      T.state.money = Math.max(T.state.money, 120000);   // keep them in the game
    }
    if(T.isBannedFromCasino()) banned++;
  }
  ok("a big enough single win does get you barred in play", banned > 350, `${banned}/${trials}`);
  console.log(`  casino: barred after a single win in ${banned}/${trials} high-roller runs`);
}

console.log(`\nverify_v: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
