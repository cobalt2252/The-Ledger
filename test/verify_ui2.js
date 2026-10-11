// The shared UI pass: the pieces that can be checked without a browser.
const T = require("./harness.js")(`isPriceText, iconFor, justForYou, jfyHtml, categorySummary, CATEGORY_ICONS, CATEGORIES,
  menuRow, sheetHudHtml, openCareerSheet, renderCareerSheetContent, get careerView(){return careerView;}, set careerView(v){careerView=v;},
  openActivitySheet, renderActivitySheetContent, get activityView(){return activityView;}, set activityView(v){activityView=v;},
  openAssetsSheet, renderAssetsSheet, get assetsView(){return assetsView;}, set assetsView(v){assetsView=v;},
  openCasinoSheet, renderCasinoSheet, get casinoView(){return casinoView;}, set casinoView(v){casinoView=v;},
  makePerson, addFriend, eraMoney, opensScreen`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };
function fresh(){
  ["startBtn","firstNameInput","lastNameInput","toPerksBtn"].forEach(id=>{ reg[id] = new FakeEl(); });
  reg.firstNameInput.value = "Test"; reg.lastNameInput.value = "Person";
  T.state = null; T.appScreen = "create"; T.render(); reg.startBtn.click();
  return T.state;
}
const html = ()=>{ const k=document.body.children; return k.length ? String(k[k.length-1].innerHTML||"") : ""; };

console.log("1. Reading a price off a label");
[["£40",true],["~£50",true],["free",true],["£1,200/yr",true],["€2,925 (£2,500)",true],["₹106,000 (£1,000)",true],
 ["£300 entry",true],["50,000 so'm",true],["+health +looks",false],["catches conditions early",false],
 ["10% dependency risk",false],["big +closeness",false],["£5 a go, life-changing odds (barely)",false]].forEach(([s,want])=>
  ok(`"${s}" ${want?"is":"is not"} a price`, T.isPriceText(s) === want));

console.log("2. Icons from what a row says");
[["Gym","🏋️"],["Doctor's check-up","🩺"],["Used hatchback","🚗"],["Family saloon","🚗"],["Gold watch","⌚"],
 ["Diamond necklace","💎"],["Acoustic guitar","🎸"],["Blackjack","🂡"],["Behave and stay out of trouble","😇"],
 ["Learn to drive","🆔"],["Go back","↩️"],["Take an education course","📚"]].forEach(([t,want])=>
  ok(`"${t}" → ${want}`, T.iconFor(t) === want, T.iconFor(t)));
ok("nothing matches nonsense", T.iconFor("Zzyzx") === "");

console.log("3. Rows mark what pressing them does");
const act = T.menuRow({title:"Gym", attr:'data-x="1"', chevron:false, dots:true});
const go  = T.menuRow({title:"Casino", attr:'data-x="2"', chevron:false, opens:true});
const dflt= T.menuRow({title:"Finances", attr:'data-x="3"'});
ok("an action shows •••", act.includes('class="dots"') && !act.includes('class="chev"'));
ok("a screen shows ›", go.includes('class="chev"') && !go.includes('class="dots"'));
ok("menus default to ›", dflt.includes('class="chev"'));

console.log("4. The header");
{
  const s = fresh(); s.age = 34; s.money = 12345;
  const h = T.sheetHudHtml();
  ok("shows the name", h.includes(s.name));
  ok("shows the balance", h.includes(T.money(12345)));
  ok("shows net worth", h.includes("net "));
  ok("shows age", h.includes("age 34"));
  s.prisonYearsLeft = 3;
  ok("shows a prison term", /In prison — 3yr/.test(T.sheetHudHtml()));
}

console.log("5. Just for you");
{
  const s = fresh(); s.age = 40; s.money = 1000; s.career = null; s.education = "left school";
  s.stats.health = 30; s.hidden.stress = 85;
  const a = T.justForYou("activities");
  ok("at most three suggestions", a.length <= 3, a.length);
  ok("poor health suggests a doctor", a.some(x=>/doctor/i.test(x.title)), a.map(x=>x.title).join(" | "));
  ok("the most pressing come first", a.every((x,i)=>i===0 || x.prio <= a[i-1].prio));
  const c = T.justForYou("career");
  ok("no job suggests finding one", c.some(x=>/Find a job/.test(x.title)));
  s.studying = true;
  ok("a student isn't nagged to find a job", !T.justForYou("career").some(x=>/Find a job/.test(x.title)));

  const s2 = fresh(); s2.age = 30; s2.stats.health = 90; s2.hidden.stress = 10;
  s2.relationship = T.makePerson("Partner","Girl",30); s2.relationship.closeness = 20;
  const p = T.justForYou("activities");
  ok("a strained relationship is flagged", p.some(x=>/strained/.test(x.title)), p.map(x=>x.title).join(" | "));
  T.addFriend("Jon", 60); s2.friends[0].lastContactAge = 25;
  ok("a drifting friend is flagged", T.justForYou("activities").some(x=>/Catch up with Jon/.test(x.title)) ||
    T.justForYou("activities").length === 3);

  const s3 = fresh(); s3.age = 40; s3.money = T.eraMoney(200000);
  ok("idle savings suggest investing", T.justForYou("assets").some(x=>/savings/.test(x.title)));
  s3.age = 70; s3.pension = 50000;
  ok("a pension can be claimed", T.justForYou("assets").some(x=>/pension/i.test(x.title)));
  s3.prisonYearsLeft = 2;
  ok("nothing is suggested in prison", T.justForYou("activities").length === 0 && T.justForYou("assets").length === 0);

  const s4 = fresh(); s4.age = 30; s4.stats.health = 90; s4.hidden.stress = 0; s4.flags.canDrive = true;
  s4.career = { kind:"civilian", trackId:"electrician", rankIndex:2, yearsInRank:1, performance:60 };
  s4.money = 100;
  ok("a settled life gets few or no suggestions", T.justForYou("activities").length <= 1, T.justForYou("activities").map(x=>x.title).join(" | "));
}

console.log("6. Occupation is laid out like every other menu");
{
  const s = fresh(); s.age = 25;
  T.careerView = { level:"categories", category:null };
  T.openCareerSheet();
  const h = html();
  ok("fields are rows, not a grid of names", !h.includes('class="cat-list"') && /class="mrow" data-cat=/.test(h));
  ok("every field has an icon", T.CATEGORIES.every(c=>T.CATEGORY_ICONS[c]));
  ok("every field has a summary line", T.CATEGORIES.every(c=>T.categorySummary(c).length > 0),
    T.CATEGORIES.filter(c=>!T.categorySummary(c)).join(", "));
  ok("trades summarise their careers", /11 careers · Electrician/.test(T.categorySummary("Manual & Trades")), T.categorySummary("Manual & Trades"));
  ok("a one-career field shows its ladder ends instead", / to /.test(T.categorySummary("Retail")), T.categorySummary("Retail"));
  ok("the dead Jobs row is gone", !h.includes('data-goto="jobs"'));
  ok("old-style menu-item buttons are gone", !h.includes('class="menu-item"'));
}

console.log("7. Back arrows are the same everywhere");
{
  const src = require("fs").readFileSync(require("path").join(__dirname,"..","index.html"),"utf8");
  const crumbs = (src.match(/class="breadcrumb"/g)||[]).length;
  ok("only the continent pickers keep a text link", crumbs === 2, crumbs);
  ok("no '← Back to' links remain", !/← Back to/.test(src));
  const s = fresh(); s.age = 30;
  T.careerView = { level:"tracks", category:"Manual & Trades" }; T.openCareerSheet();
  ok("a field's page has the ‹ arrow by its title", /<div class="sheet-title"><button class="bk" id="backBtn">‹<\/button><h2>Manual &amp; Trades|<div class="sheet-title"><button class="bk" id="backBtn">‹<\/button><h2>Manual & Trades/.test(html()));
  ok("ladders are summarised", /→ … →/.test(html()) && /10 promotions/.test(html()));
  s.age = 30;
  T.openCasinoSheet(); T.casinoView = { game:"slots" }; T.renderCasinoSheet(document.body.children[document.body.children.length-1]);
  ok("the slots screen titles itself", html().includes("🎰 Slots") && html().includes('id="backCasino"'));
}

console.log("8. Just for you appears where it should");
{
  const s = fresh(); s.age = 40; s.stats.health = 30; s.career = null; s.education = "left school";
  T.openActivitySheet();
  ok("on the Activities menu", html().includes("Just for you") && html().includes("data-jfy"));
  T.activityView.tab = "foryou"; T.renderActivitySheetContent(document.body.children[document.body.children.length-1]);
  ok("not inside a tab", !html().includes("Just for you"));
  T.careerView = { level:"categories", category:null }; T.openCareerSheet();
  ok("on Occupation", html().includes("Just for you"));
  s.money = T.eraMoney(300000);
  T.openAssetsSheet();
  ok("on Assets", html().includes("Just for you"));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
