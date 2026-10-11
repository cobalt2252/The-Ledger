// Behavioural checks for the world country list and local-currency display.
const T = require("./harness.js")(`
  COUNTRIES, CONTINENTS, countryByName, countriesIn, continentOf, localCurrency,
  formatGbp, formatIn, moneyGbp, cur, money,
  EMIGRATION_DESTINATIONS, BIRTHPLACES, doEmigrate, emigrationShift, emigrationCost,
  MUSEUM_SECTIONS, museum, museumAdd, museumAddCountry, museumHas, museumProgress,
  countrySectionId, recordToMuseum, emptyMuseum, renderMuseumScreen,
  openActivitySheet, renderActivitySheetContent,
  get activityView(){return activityView;}, set activityView(v){activityView=v;},
  get worldView(){return worldView;}, set worldView(v){worldView=v;},
  renderSettingsScreen, renderSetup, rollSetupDraft, buyPerk, hasPerk,
  get setupDraft(){return setupDraft;}, set setupDraft(v){setupDraft=v;},
  annualExpenses, payIncome, priceLevel, propertyPrice, die, startAsChild,
  CORE_ACTIVITY_DEFS, ERAS, nudge, rand, clamp, addLog`);

let pass=0, fail=0;
// Emigrating now asks who comes; the first answer is "move with your household".
function emigrate(name){ T.doEmigrate(name); const c=T.state.pendingChoice; if(c && /^Moving to/.test(c.title)){ T.state.pendingChoice=null; c.options[0].effect(); } }
const ok=(l,c,x)=>{ if(c)pass++; else {console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++;} };
function resetMeta(){
  T.meta.xp=0; T.meta.xpSpent=0; T.meta.perks=[]; T.meta.lives=[];
  T.meta.difficulty="normal"; T.meta.museum=T.emptyMuseum();
  T.meta.localCurrency=true; T.meta.showGbp=true;
}
function life(opts){
  T.state=null; T.appScreen="home"; T.rollSetupDraft();
  T.startGame("Test Person","Girl","Straight",Object.assign({scenarioId:"free"},opts||{}));
  T.state.pendingChoice=null; return T.state;
}
function lastSheet(){ return document.body.children[document.body.children.length-1]; }

// ===================================================== 1. The country table
console.log("1. The whole world, by continent");
{
  resetMeta();
  ok("a lot of countries", T.COUNTRIES.length >= 190, T.COUNTRIES.length);
  ok("six continents", T.CONTINENTS.length===6, T.CONTINENTS.join(","));
  ok("every country has a continent in the list", T.COUNTRIES.every(c=>T.CONTINENTS.includes(c.continent)));
  ok("every continent has countries", T.CONTINENTS.every(c=>T.countriesIn(c).length>0),
     T.CONTINENTS.map(c=>`${c}:${T.countriesIn(c).length}`).join(" "));
  ok("names are unique", new Set(T.COUNTRIES.map(c=>c.name)).size===T.COUNTRIES.length);
  ok("every country has a 3-letter code", T.COUNTRIES.every(c=>/^[A-Z]{3}$/.test(c.code)),
     T.COUNTRIES.filter(c=>!/^[A-Z]{3}$/.test(c.code)).map(c=>c.name+":"+c.code).join(","));
  ok("every country has a symbol", T.COUNTRIES.every(c=>typeof c.sym==="string" && c.sym.length));
  ok("every rate is positive and finite", T.COUNTRIES.every(c=>Number.isFinite(c.rate) && c.rate>0));
  ok("every multiplier is sane", T.COUNTRIES.every(c=>c.salaryMult>0 && c.salaryMult<=2 && c.costMult>0 && c.costMult<=2));
  // One currency code must mean one rate wherever it appears.
  { const byCode = {};
    let clash = null;
    T.COUNTRIES.forEach(c=>{
      if(byCode[c.code] !== undefined && byCode[c.code] !== c.rate) clash = `${c.code}: ${c.rate} vs ${byCode[c.code]}`;
      byCode[c.code] = c.rate;
    });
    ok("a currency code has one rate everywhere", !clash, clash);
    ok("the pound is the reference", byCode.GBP===1);
  }
  // Every continent is represented in the real world's rough proportions.
  ok("Africa has most of its countries", T.countriesIn("Africa").length >= 50, T.countriesIn("Africa").length);
  ok("Asia is well covered", T.countriesIn("Asia").length >= 44, T.countriesIn("Asia").length);
  ok("Europe is well covered", T.countriesIn("Europe").length >= 44, T.countriesIn("Europe").length);
  ok("Oceania is present", T.countriesIn("Oceania").length >= 10, T.countriesIn("Oceania").length);
  ok("South America is present", T.countriesIn("South America").length >= 11, T.countriesIn("South America").length);
  ok("North America includes the Caribbean", T.countriesIn("North America").length >= 20, T.countriesIn("North America").length);
  // Lookups.
  ok("lookup by name works", T.countryByName("Japan").code==="JPY");
  ok("a missing name returns nothing", T.countryByName("Atlantis")===undefined);
  ok("continentOf works", T.continentOf("Kenya")==="Africa" && T.continentOf("Peru")==="South America");
  ok("continentOf falls back safely", T.continentOf("Atlantis")==="Europe");
  // Emigration and birth both draw on the whole table.
  ok("you can emigrate anywhere", T.EMIGRATION_DESTINATIONS.length===T.COUNTRIES.length);
  ok("you can be born anywhere", T.BIRTHPLACES.length===T.COUNTRIES.length);
  // A sample of well-known currencies, to catch a mangled table.
  [["Japan","JPY"],["India","INR"],["Nigeria","NGN"],["Brazil","BRL"],["United States","USD"],
   ["France","EUR"],["Switzerland","CHF"],["Australia","AUD"],["South Africa","ZAR"],
   ["China","CNY"],["Mexico","MXN"],["Egypt","EGP"],["Vietnam","VND"],["Saudi Arabia","SAR"]]
    .forEach(([n,code])=>ok(`${n} uses ${code}`, T.countryByName(n) && T.countryByName(n).code===code,
      T.countryByName(n) && T.countryByName(n).code));
}

// ===================================================== 2. Currency display
console.log("2. Local currency, with sterling in brackets");
{
  resetMeta();
  // Born in England: sterling, no brackets needed.
  { const s = life({birthplace:"England"});
    ok("sterling at home", T.money(1000)==="£1,000", T.money(1000));
    ok("negatives read correctly", T.money(-2500)==="−£2,500", T.money(-2500));
    ok("zero reads correctly", T.money(0)==="£0", T.money(0));
  }
  // Born in India: rupees, with sterling in brackets.
  { const s = life({birthplace:"India"});
    const cur = T.localCurrency();
    ok("the local currency is picked up", cur.code==="INR" && cur.sym==="₹");
    const out = T.money(1000);
    ok("rupees are shown first", out.startsWith("₹"), out);
    ok("the conversion is right", out.startsWith("₹"+(1000*cur.rate).toLocaleString()), out);
    ok("sterling follows in brackets", /\(£1,000\)$/.test(out), out);
  }
  // Turning the brackets off.
  { const s = life({birthplace:"Japan"});
    T.meta.showGbp = false;
    const out = T.money(1000);
    ok("brackets can be switched off", !out.includes("("), out);
    ok("the local figure remains", out==="¥190,000", out);
    T.meta.showGbp = true;
  }
  // Turning local currency off entirely.
  { const s = life({birthplace:"Japan"});
    T.meta.localCurrency = false;
    ok("sterling can be forced", T.money(1000)==="£1,000", T.money(1000));
    T.meta.localCurrency = true;
  }
  // Large figures in a high-unit currency are rounded, not absurd.
  { const s = life({birthplace:"Vietnam"});
    const out = T.money(1000000);
    ok("huge figures stay readable", out.length < 40, out);
    ok("and are rounded to the thousand", /000 \(/.test(out) || /000$/.test(out), out);
  }
  // Every currency in the table formats without throwing or producing NaN.
  { let bad = [];
    T.COUNTRIES.forEach(c=>{
      const s = life({birthplace:c.name});
      [0, 1, 999, 100000, -50000, 1e9].forEach(v=>{
        let out;
        try{ out = T.money(v); }catch(e){ bad.push(c.name+": threw "+e.message); return; }
        if(/NaN|undefined|Infinity/.test(out)) bad.push(`${c.name}: ${out}`);
      });
    });
    ok("every currency formats cleanly", bad.length===0, bad.slice(0,4).join(" | "));
  }
  // moneyGbp always gives sterling, whatever the setting.
  { const s = life({birthplace:"Nigeria"});
    ok("moneyGbp ignores the setting", T.moneyGbp(1000)==="£1,000", T.moneyGbp(1000));
  }
  // cur() rewrites amounts inside a static label.
  { const s = life({birthplace:"India"});
    const out = T.cur("Gym — £20 · +health +looks");
    ok("cur() converts an embedded amount", out.includes("₹") && /\(£20\)/.test(out), out);
    ok("cur() leaves the rest of the label alone", out.includes("+health +looks"));
    ok("cur() handles commas", T.cur("£1,200 fee").includes("₹127,200"), T.cur("£1,200 fee"));
    ok("cur() passes non-strings through", T.cur(undefined)===undefined && T.cur(5)===5);
    ok("cur() leaves a label with no amount alone", T.cur("Go to the gym")==="Go to the gym");
  }
  // The balance itself never moves when you emigrate — only its wording.
  { const s = life({birthplace:"England"}); s.age=30; s.money=50000; s.skills.languages=50;
    const before = s.money;
    emigrate("Japan");
    ok("emigrating doesn't touch the balance beyond the move cost",
       s.money > 0 && s.money < before && before - s.money < 20000, `${before} -> ${s.money}`);
    ok("but the currency changes", T.money(100).startsWith("¥"), T.money(100));
  }
  // A child continuing inherits the country, so the currency carries over.
  { const s = life({birthplace:"Brazil"}); s.age=50; s.money=100000;
    s.children=[{id:9,name:"Heir",age:25,health:70,happiness:70,smarts:70,bond:70}];
    T.die("a test"); T.startAsChild(9);
    ok("the heir lives in the same country", T.state.currentCountry==="Brazil");
    ok("and uses the same currency", T.money(100).startsWith("R$"), T.money(100));
  }
  // The settings screen offers both toggles.
  { T.state=null; T.appScreen="settings"; T.render();
    const ss = appEl.innerHTML;
    ok("the settings offer local currency", ss.includes('id="setLocalCur"'));
    ok("and sterling in brackets", ss.includes('id="setShowGbp"'));
    ok("it explains balances stay in sterling", /held in sterling/.test(ss));
    T.meta.localCurrency = false; T.render();
    ok("the brackets toggle is disabled when sterling is forced", /id="setShowGbp" disabled/.test(appEl.innerHTML));
    T.meta.localCurrency = true;
  }
}

// ===================================================== 3. Emigration
console.log("3. Emigrating anywhere, by continent");
{
  resetMeta();
  // Shift is relative to birthplace, so staying home is neutral.
  { const s = life({birthplace:"England"});
    const home = T.emigrationShift("England");
    ok("no shift for staying put", Math.abs(home.salaryMult-1)<0.001 && Math.abs(home.costMult-1)<0.001,
       JSON.stringify(home));
    const toIndia = T.emigrationShift("India");
    ok("moving somewhere poorer cuts pay", toIndia.salaryMult < 0.5, toIndia.salaryMult.toFixed(2));
    ok("and cuts costs", toIndia.costMult < 0.5, toIndia.costMult.toFixed(2));
    const toSwiss = T.emigrationShift("Switzerland");
    ok("moving somewhere richer raises pay", toSwiss.salaryMult > 1.2, toSwiss.salaryMult.toFixed(2));
  }
  // And it's symmetric: born poor, moving to Britain is a gain.
  { const s = life({birthplace:"India"});
    const toEngland = T.emigrationShift("England");
    ok("born poorer, moving to Britain is a gain", toEngland.salaryMult > 2, toEngland.salaryMult.toFixed(2));
    ok("an Indian-born life starts neutral", (()=>{
      const sh = T.emigrationShift("India");
      return Math.abs(sh.salaryMult-1)<0.001;
    })());
  }
  // Clamped, so the table's extremes can't produce nonsense.
  { let worst = 0, best = 99;
    T.COUNTRIES.forEach(home=>{
      const s = life({birthplace:home.name});
      T.COUNTRIES.forEach(dest=>{
        const sh = T.emigrationShift(dest.name);
        worst = Math.max(worst, sh.salaryMult);
        best = Math.min(best, sh.salaryMult);
      });
    });
    ok("no multiplier escapes the clamp", worst <= 6.001 && best >= 0.1499, `${best.toFixed(3)} to ${worst.toFixed(3)}`);
  }
  // Moving costs more across a continent than within one.
  { const s = life({birthplace:"England"}); s.age=30;
    const within = [], across = [];
    for(let i=0;i<60;i++){ within.push(T.emigrationCost("France")); across.push(T.emigrationCost("Japan")); }
    const mean = a=>a.reduce((x,y)=>x+y,0)/a.length;
    ok("crossing continents costs more", mean(across) > mean(within)*1.5,
       `${mean(within).toFixed(0)} within vs ${mean(across).toFixed(0)} across`);
    ok("the cost scales with the era", (()=>{
      const a = life({birthplace:"England", eraId:"1940s"}); a.age=30;
      const old = T.emigrationCost("France");
      const b = life({birthplace:"England", eraId:"2010s"}); b.age=30;
      return old < T.emigrationCost("France")/5;
    })());
  }
  // Emigrating actually works, anywhere.
  { let moved = 0, failed = [];
    T.COUNTRIES.forEach(c=>{
      const s = life({birthplace:"England"}); s.age=30; s.money=500000;
      s.pendingChoice=null; s.actionsLeft=6; s.yearlyActivityUses={}; s.pendingActionId=null;
      try{
        emigrate(c.name);
        if(s.currentCountry === c.name) moved++;
        else if(c.name !== "England") failed.push(c.name);
      }catch(e){ failed.push(c.name+": "+e.message); }
      if(s.log.length>40) s.log.length=0;
    });
    ok("you can emigrate to every country in the table", moved >= T.COUNTRIES.length-1, `${moved}/${T.COUNTRIES.length}, failures: ${failed.slice(0,3).join(",")}`);
  }
  // Moving where you already live is refused.
  { const s = life({birthplace:"England"}); s.age=30; s.money=500000;
    const before = s.money;
    T.doEmigrate("England");
    ok("moving to where you live is refused", s.money===before);
  }
  // Too poor to move.
  { const s = life({birthplace:"England"}); s.age=30; s.money=10;
    T.doEmigrate("Japan");
    ok("an unaffordable move is refused", s.currentCountry==="England");
    ok("and says what it would cost", s.log.some(e=>/the move alone costs/.test(e.text)));
  }
  // The screen drills continent then country.
  { const s = life({birthplace:"England"}); s.age=30; s.money=500000;
    T.worldView = { continent: null };
    T.openActivitySheet(); let ov = lastSheet();
    T.activityView.tab = "world"; T.renderActivitySheetContent(ov);
    const top = ov.innerHTML;
    ok("the continents are listed first", T.CONTINENTS.every(c=>top.includes(`data-continent="${c}"`)));
    ok("each shows how many countries", /\d+ countries/.test(top));
    ok("no country buttons at the top level", !top.includes('data-emigrate='));
    ok("where you live and its currency are shown", top.includes("England") && top.includes("GBP"));
    T.worldView.continent = "Asia"; T.renderActivitySheetContent(ov);
    const asia = ov.innerHTML;
    ok("drilling in lists that continent's countries", T.countriesIn("Asia").every(c=>asia.includes(`data-emigrate="${c.name}"`) || c.name===s.currentCountry),
       T.countriesIn("Asia").filter(c=>!asia.includes(`data-emigrate="${c.name}"`)).map(c=>c.name).join(","));
    ok("it shows the shift and the move cost", /pay ×/.test(asia) && /move /.test(asia));
    ok("there's a way back", asia.includes('id="backToContinents"'));
    ok("other continents aren't listed", !asia.includes('data-emigrate="Nigeria"'));
    // Where you live is marked and not offered.
    T.worldView.continent = "Europe"; T.renderActivitySheetContent(ov);
    const eur = ov.innerHTML;
    ok("your own country is marked", /England — where you live/.test(eur));
    ok("and isn't offered as a destination", !eur.includes('data-emigrate="England"'));
  }
  // Birthplace picker drills the same way.
  { resetMeta(); T.meta.xp=50000;
    // Choosing your birthplace is a God Mode perk now.
    T.buyPerk("god_birthplace");
    T.rollSetupDraft(); T.setupDraft.advOpen=true; T.setupDraft.bpContinent=null;
    T.state=null; T.appScreen="create"; T.render();
    const cs = appEl.innerHTML;
    ok("birth continents are listed", T.CONTINENTS.every(c=>cs.includes(`data-bpcont="${c}"`)));
    ok("no 200-country wall", (cs.match(/data-bp="/g)||[]).length===0);
    T.setupDraft.bpContinent = "Africa"; T.render();
    const af = appEl.innerHTML;
    ok("drilling in lists African countries", T.countriesIn("Africa").every(c=>af.includes(`data-bp="${c.name}"`)));
    ok("there's a way back", af.includes('id="bpBack"'));
  }
}

// ===================================================== 4. The museum
console.log("4. The museum, split by continent");
{
  resetMeta();
  life();
  const countrySections = T.MUSEUM_SECTIONS.filter(s=>s.id.startsWith("countries_"));
  ok("one country section per continent", countrySections.length===6, countrySections.length);
  ok("together they hold every country",
     countrySections.reduce((n,s)=>n+s.all().length,0)===T.COUNTRIES.length);
  ok("no single section is a wall of 200", countrySections.every(s=>s.all().length < 60),
     countrySections.map(s=>s.all().length).join(","));
  ok("a country routes to its continent's section", T.countrySectionId("Kenya")==="countries_africa");
  ok("multi-word continents slug correctly", T.countrySectionId("Brazil")==="countries_south_america");

  // Recording a country lands it in the right section.
  { resetMeta(); life();
    T.museumAddCountry("Japan");
    ok("Japan lands in Asia", T.museumHas("countries_asia","Japan"));
    ok("and nowhere else", !T.museumHas("countries_europe","Japan"));
    T.museumAddCountry(null);
    ok("a missing name is ignored", T.museum().countries_asia.length===1);
  }
  // A life's countries are all recorded at death.
  { resetMeta();
    const s = life({birthplace:"Nigeria"});
    s.currentCountry = "Canada";
    s.livedCountries = ["Nigeria","France","Japan","Brazil","Australia"];
    T.die("a test");
    ok("birthplace recorded", T.museumHas("countries_africa","Nigeria"));
    ok("current country recorded", T.museumHas("countries_north_america","Canada"));
    ok("every country lived in recorded",
       T.museumHas("countries_europe","France") && T.museumHas("countries_asia","Japan") &&
       T.museumHas("countries_south_america","Brazil") && T.museumHas("countries_oceania","Australia"));
    ok("progress reflects it", T.museumProgress().have >= 6, T.museumProgress().have);
  }
  // The screen renders all six without choking on 200 entries.
  { T.state=null; T.appScreen="museum"; T.render();
    const ms = appEl.innerHTML;
    ok("every continent section appears", T.CONTINENTS.every(c=>ms.includes(c)));
    ok("a collected country shows its name", ms.includes("Nigeria") && ms.includes("Canada"));
    ok("the page is a sensible size", ms.length < 400000, ms.length);
  }
}

resetMeta();
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
