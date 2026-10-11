// Behavioural checks for the ten new features. These measure what the code
// actually does — distributions, not whether it reads plausibly.
const fs = require("fs");
const code = [...fs.readFileSync(require("path").join(__dirname,"..","index.html"),"utf8").matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).pop();

class FakeEl{ constructor(t){this.tagName=(t||"div").toUpperCase();this.children=[];this._html="";this.style={};this.dataset={};this._cls=new Set();this.listeners={};this.value="";this.textContent="";this.disabled=false;this.id="";}
 set innerHTML(v){this._html=String(v);} get innerHTML(){return this._html;}
 set className(v){this._cls=new Set(String(v).split(/\s+/).filter(Boolean));} get className(){return [...this._cls].join(" ");}
 get classList(){const s=this._cls;return{add:(...c)=>c.forEach(x=>s.add(x)),remove:(...c)=>c.forEach(x=>s.delete(x)),toggle:(c,f)=>{if(f===undefined){s.has(c)?s.delete(c):s.add(c);}else{f?s.add(c):s.delete(c);}},contains:c=>s.has(c)};}
 appendChild(c){this.children.push(c);return c;} remove(){const p=global.document.body;const i=p.children.indexOf(this);if(i>=0)p.children.splice(i,1);}
 addEventListener(t,f){(this.listeners[t]=this.listeners[t]||[]).push(f);} click(){(this.listeners.click||[]).forEach(f=>f({preventDefault(){},stopPropagation(){}}));}
 querySelector(){return new FakeEl();} querySelectorAll(){return [];}
 getBoundingClientRect(){return{top:0,left:0,width:320,height:40,bottom:40,right:320};}
 focus(){}blur(){}scrollIntoView(){}setAttribute(){}getAttribute(){return null;} }
const appEl=new FakeEl(); appEl.id="app"; const barEl=new FakeEl(); barEl.id="actionbar";
const reg={app:appEl,actionbar:barEl};
// Inputs the UI reads back: tests set reg[id].value before clicking.
global.document={body:new FakeEl(),getElementById(i){return reg[i]||new FakeEl();},querySelectorAll(){return [];},createElement(t){return new FakeEl(t);},addEventListener(){}};
global.window={storage:{_m:{},async get(k){if(!(k in this._m))throw new Error("x");return{key:k,value:this._m[k]};},async set(k,v){this._m[k]=v;return{};},async delete(){return{};},async list(){return{keys:[]};}},addEventListener(){}};
global.navigator={vibrate(){}};
global.AudioContext=function(){return{createOscillator(){return{connect(){},start(){},stop(){},frequency:{value:0},type:""};},createGain(){return{connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}};},destination:{},currentTime:0};};
global.setTimeout=()=>0; global.clearTimeout=()=>{}; global.requestAnimationFrame=f=>{f();return 0;};

eval(code.replace(/\}\)\(\);?\s*$/, `
 globalThis.__t = {
   set appScreen(v){appScreen=v;}, render, rollSetupDraft, startGame, ageUp,
   get state(){return state;}, set state(v){state=v;}, get meta(){return meta;},
   // money / insurance / property
   insuranceAgeMultiplier, insuranceQuote, buyLifeInsurance, changeLifeInsurance, cancelLifeInsurance,
   LIFE_INSURANCE_OPTIONS, propertyPrice, propertyUpkeep, maxPropertiesAffordable, buyPropertiesBulk,
   rentOutAllProperties, stopRentingAllProperties, sellAllProperties,
   parseAmount, doInvestType, doInvestCustom, doInvestAll, sellInvestmentPart, INVESTMENT_TYPES,
   // dating / fertility
   get datingFilters(){return datingFilters;}, set datingFilters(v){datingFilters=v;},
   generateDatingProfiles, makeProspect, matchesFilters, filterSelectivity, filterSummary,
   femaleFertility, maleFertility, conceptionChance, conceptionOddsLabel,
   doOneNightStand, resolveOneNight, promptIntimacy, doIntimacy,
   // children
   launchAdultChild, tickAdultChild, doAdultChild, CHILD_EDUCATION, CHILD_CAREERS,
   // social
   addFriend, socialCircle, doSpendTimeWithEveryone, maybeSocialEvent,
   offerNewFriendship, offerFriendInvitation, offerNeglectedFriend, ageFamilyAndFriends,
   // careers
   CAREER_EVENTS, CAREER_EVENT_POOLS, FORCES_EVENTS, GENERIC_CAREER_EVENTS, maybeCareerEvent, TRACKS, FORCES,
   doWorkHarder, doSlackOff, quitJob, jobPerformance,
   // plumbing
   openAssetsSheet, renderAssetsSheet, openPeopleSheet, renderPeopleSheetContent,
   openActivitySheet, renderActivitySheetContent,
   get assetsView(){return assetsView;}, set assetsView(v){assetsView=v;},
   get peopleView(){return peopleView;}, set peopleView(v){peopleView=v;},
   get activityView(){return activityView;}, set activityView(v){activityView=v;},
   netWorth, usesLeft, money,
 };
})();`));
const T = globalThis.__t;

let pass=0, fail=0;
function ok(label, cond, extra){ if(cond){pass++;} else {console.log("  FAIL "+label+(extra!==undefined?" — "+extra:"")); fail++;} }
function newLife(opts){
  T.state=null; T.appScreen="home"; T.rollSetupDraft();
  T.startGame("Test Person","Girl","Straight",Object.assign({scenarioId:"free"},opts||{}));
  T.state.pendingChoice=null;
  return T.state;
}
// Resolve an open prompt by the label text it carries.
function choose(match){
  const pc = T.state.pendingChoice;
  if(!pc) return false;
  const o = pc.options.find(x=>x.label.toLowerCase().includes(match.toLowerCase()));
  T.state.pendingChoice=null;
  if(!o) return false;
  o.effect();
  return true;
}

// ===================================================== 1. Investment amounts
console.log("1. Setting your own investment amount");
ok("parses plain numbers", T.parseAmount("2500")===2500);
ok("parses £ and commas", T.parseAmount("£12,500")===12500);
ok("parses k shorthand", T.parseAmount("2.5k")===2500);
ok("parses m shorthand", T.parseAmount("1m")===1000000);
ok("rejects nonsense", !Number.isFinite(T.parseAmount("abc")) && !Number.isFinite(T.parseAmount("")));
{
  const s = newLife(); s.age=30; s.money=50000;
  reg.investAmtInput = new FakeEl("input"); reg.investAmtInput.value="7,250";
  T.doInvestCustom("stocks");
  const h = s.assets.find(a=>a.type==="stocks");
  ok("invests the typed amount", h && h.value===7250, h&&h.value);
  ok("cash reduced by exactly that", s.money===42750, s.money);
  // Repeat buys top up the same holding rather than adding a second line.
  reg.investAmtInput.value="1000";
  T.doInvestCustom("stocks");
  ok("tops up rather than duplicating", s.assets.filter(a=>a.type==="stocks").length===1);
  ok("holding now 8250", s.assets.find(a=>a.type==="stocks").value===8250);
  // Over-balance is refused, not clamped silently into debt.
  const before = s.money;
  reg.investAmtInput.value="999999";
  T.doInvestCustom("bonds");
  ok("refuses more than you hold", s.money===before && !s.assets.some(a=>a.type==="bonds"));
  // Part sell
  T.sellInvestmentPart(s.assets.findIndex(a=>a.type==="stocks"), 3000);
  ok("part sale leaves the rest invested", s.assets.find(a=>a.type==="stocks").value===5250);
  // Invest everything
  s.money=10000; T.doInvestAll("crypto");
  ok("invest-all empties the balance", s.money===0 && s.assets.find(a=>a.type==="crypto").value===10000);
}

// ===================================================== 2. Property in bulk
console.log("2. Buying property in bulk");
{
  // The price follows the calendar year now, so pin the era and work from
  // whatever that era's asking price actually is.
  const s = newLife({eraId:"2010s"}); s.age=35;
  const unit = T.propertyPrice();
  const purse = unit*10 + Math.round(unit*0.9);
  s.money = purse;
  ok("max affordable is floor(cash/price)", T.maxPropertiesAffordable()===10, T.maxPropertiesAffordable());
  T.buyPropertiesBulk(5);
  ok("bought 5", s.assets.filter(a=>a.type==="property").length===5);
  ok("charged 5 × price", s.money===purse-5*unit, s.money);
  ok("none let on purchase", s.assets.filter(a=>a.type==="property"&&a.rented).length===0);
  T.rentOutAllProperties();
  ok("rent-all lets every one", s.assets.filter(a=>a.type==="property"&&a.rented).length===5);
  T.stopRentingAllProperties();
  ok("stop-all clears every one", s.assets.filter(a=>a.type==="property"&&a.rented).length===0);
  // Asking for more than you can afford buys what it can, and never overdraws.
  s.money = unit*2 + 100;
  T.buyPropertiesBulk(10);
  ok("buys only what the cash covers", s.assets.filter(a=>a.type==="property").length===7);
  ok("never goes negative", s.money===100, s.money);
  // With nothing, nothing happens.
  s.money=0; const n=s.assets.length;
  T.buyPropertiesBulk(3);
  ok("no purchase with no cash", s.assets.length===n && s.money===0);
  // Selling all returns the value of unmortgaged ones only.
  s.assets.filter(a=>a.type==="property")[0].mortgage={balance:1000,rate:0.05,annualPayment:70};
  T.sellAllProperties();
  ok("keeps the mortgaged one", s.assets.filter(a=>a.type==="property").length===1);
  // The balance was zeroed in the step above, so the proceeds are all of it.
  ok("proceeds credited", s.money===6*unit, `${s.money} vs ${6*unit}`);
}

// ================================================ 3 & 5. Life insurance
console.log("3 & 5. Life insurance — priced by age, changeable, cancellable");
{
  const mults = [20,30,40,50,60,70,80].map(a=>T.insuranceAgeMultiplier(a));
  ok("premium multiplier rises with age", mults.every((m,i)=>i===0||m>mults[i-1]), mults.join(","));
  const s = newLife(); s.age=22;
  const young = T.insuranceQuote("standard").premium;
  s.age=55;
  const older = T.insuranceQuote("standard").premium;
  ok("same cover costs more later", older > young*3, `${young} vs ${older}`);
  // Buying young locks the rate in.
  s.age=25; T.buyLifeInsurance("standard");
  const locked = s.lifeInsurance.premium;
  ok("policy recorded with the age bought", s.lifeInsurance.ageBought===25);
  s.age=70;
  ok("rate stays locked as you age", s.lifeInsurance.premium===locked, s.lifeInsurance.premium);
  ok("quote at 70 is far higher", T.insuranceQuote("standard").premium > locked*5);
  // Switching re-prices at the current age.
  T.changeLifeInsurance("premium");
  ok("switched policy", s.lifeInsurance.id==="premium");
  ok("re-priced at 70", s.lifeInsurance.ageBought===70 && s.lifeInsurance.premium > locked);
  // Cancelling.
  T.cancelLifeInsurance();
  ok("cancelled", s.lifeInsurance===null);
  ok("can buy again after cancelling", (T.buyLifeInsurance("basic"), s.lifeInsurance && s.lifeInsurance.id==="basic"));
}

// ======================================== 4. Dating filters, stands, pregnancy
console.log("4. Dating — filters, one-night stands, protection, real fertility");
{
  const s = newLife(); s.age=30;
  // Fertility curve shape
  ok("peak fertility in the twenties", T.femaleFertility(25) > T.femaleFertility(38));
  ok("falls sharply after 40", T.femaleFertility(41) < T.femaleFertility(36)/2);
  ok("effectively nil past 50", T.femaleFertility(52)===0);
  ok("male fertility holds then eases", T.maleFertility(30)===1 && T.maleFertility(65) < 1 && T.maleFertility(65) > 0);

  // Same-sex couples cannot conceive by this route.
  ok("no conception, same sex", T.conceptionChance({gender:"Girl",age:30}, false)===0);
  ok("conception possible, opposite sex", T.conceptionChance({gender:"Boy",age:30}, false) > 0.3);

  // Both ages count.
  s.age=30;
  const youngPartner = T.conceptionChance({gender:"Boy",age:30}, false);
  const oldPartner   = T.conceptionChance({gender:"Boy",age:75}, false);
  ok("a much older partner lowers it", oldPartner < youngPartner, `${youngPartner.toFixed(2)} vs ${oldPartner.toFixed(2)}`);
  s.age=44;
  const olderSelf = T.conceptionChance({gender:"Boy",age:30}, false);
  ok("being older yourself lowers it", olderSelf < youngPartner, `${olderSelf.toFixed(3)}`);
  // A 48-year-old woman with a 50-year-old man: effectively nothing.
  s.age=48;
  ok("no realistic pregnancy at 48", T.conceptionChance({gender:"Boy",age:50}, false) < 0.02);
  // A man of 60 with a partner of 30 still can.
  T.state.gender="Boy"; s.age=60;
  ok("older father, younger mother still possible", T.conceptionChance({gender:"Girl",age:30}, false) > 0.3);
  T.state.gender="Girl"; s.age=30;
  // Protection dominates.
  const bare = T.conceptionChance({gender:"Boy",age:30}, false);
  const prot = T.conceptionChance({gender:"Boy",age:30}, true);
  ok("protection cuts it by ~97%", prot < bare*0.05 && prot > 0, `${bare.toFixed(3)} vs ${prot.toFixed(4)}`);
  ok("odds label reads sensibly", T.conceptionOddsLabel({gender:"Girl",age:30})==="no chance of pregnancy");

  // Filters
  T.datingFilters = {minAge:40, maxAge:50, minNetWorth:100000};
  ok("filter summary reads back", T.filterSummary().includes("40") && T.filterSummary().includes("£100,000"));
  let profs = [];
  for(let i=0;i<40;i++) profs = profs.concat(T.generateDatingProfiles());
  // Asking for a bracket well outside your own must still return people.
  ok("an out-of-bracket age filter still finds people", profs.length > 20, profs.length+" over 40 refreshes");
  ok("every profile obeys the age filter", profs.length>0 && profs.every(p=>p.age>=40 && p.age<=50), profs.filter(p=>p.age<40||p.age>50).length+" bad");
  ok("every profile obeys the wealth filter", profs.length>0 && profs.every(p=>p.netWorth>=100000), profs.filter(p=>p.netWorth<100000).length+" bad");
  ok("profiles carry age and net worth", profs.length>0 && profs.every(p=>Number.isFinite(p.age)&&Number.isFinite(p.netWorth)));
  // Tight filters really do thin the pool.
  T.datingFilters = {minAge:null,maxAge:null,minNetWorth:null};
  let wideCount=0; for(let i=0;i<30;i++) wideCount += T.generateDatingProfiles().length;
  T.datingFilters = {minAge:null,maxAge:null,minNetWorth:500000};
  let tightCount=0; for(let i=0;i<30;i++) tightCount += T.generateDatingProfiles().length;
  ok("the wealthy filter returns fewer people", tightCount < wideCount, `${wideCount} wide vs ${tightCount} tight`);
  ok("selectivity is lower when fussy", T.filterSelectivity() < 0.2);
  T.datingFilters = {minAge:null,maxAge:null,minNetWorth:null};

  // One-night stands: the protection prompt must actually appear.
  let prompted=0, declined=0, protectedRuns=0, conceptions=0;
  for(let i=0;i<400;i++){
    const st = newLife(); st.age=30; st.money=5000; st.relationship=null; st.pendingChoice=null;
    T.doOneNightStand();
    if(st.pendingChoice){
      prompted++;
      const labels = st.pendingChoice.options.map(o=>o.label);
      if(labels.some(l=>/protection/i.test(l))) protectedRuns++;
      if(labels.some(l=>/go home/i.test(l))) declined++;
      const kids = st.children.length;
      choose("Don't bother");
      if(st.children.length > kids) conceptions++;
    }
  }
  ok("a prompt appears when it goes somewhere", prompted > 60, prompted+"/400");
  ok("prompt always offers protection", protectedRuns===prompted);
  ok("prompt always offers backing out", declined===prompted);
  ok("unprotected stands can cause pregnancy", conceptions > 0, conceptions+" of "+prompted);
  // And protected ones very rarely do.
  let protConceptions=0, protRuns=0;
  for(let i=0;i<400;i++){
    const st = newLife(); st.age=28; st.pendingChoice=null; st.relationship=null;
    T.doOneNightStand();
    if(st.pendingChoice){ protRuns++; const k=st.children.length; choose("Use protection"); if(st.children.length>k) protConceptions++; }
  }
  ok("protected stands rarely do", protRuns>50 && protConceptions/protRuns < 0.06, `${protConceptions}/${protRuns}`);

  // Cheating gets found out sometimes.
  let caught=0;
  for(let i=0;i<300;i++){
    const st = newLife(); st.age=30; st.pendingChoice=null;
    st.relationship={id:999,name:"Partner",gender:"Boy",age:31,closeness:70,alive:true};
    st.married=true;
    T.resolveOneNight({name:"Someone",age:30,gender:"Boy"}, true);
    if(st.flags.caughtCheating) caught++;
  }
  ok("affairs are sometimes discovered", caught>40 && caught<160, caught+"/300");

  // Intimacy now routes through a prompt.
  const st = newLife(); st.age=30; st.pendingChoice=null;
  st.relationship={id:1,name:"Partner",gender:"Boy",age:30,closeness:70,alive:true};
  T.promptIntimacy();
  ok("intimacy asks about protection", !!st.pendingChoice && st.pendingChoice.options.length===3);
  ok("the prompt states the odds", /chance of pregnancy|no chance/.test(st.pendingChoice.text));
}

// ================================================ 6. Grown-up children
console.log("6. Grown-up children");
{
  const s = newLife(); s.age=45;
  // Launching assigns a full life.
  const bright = {id:1,name:"Ada",age:18,health:80,happiness:80,smarts:90,bond:80};
  T.launchAdultChild(bright);
  ok("adult flag set", bright.adult===true);
  ok("education assigned", !!bright.educationLabel);
  ok("career assigned", !!bright.careerLabel && !!bright.careerId);
  ok("income assigned", Number.isFinite(bright.income));
  // Ability gates the career: a low-smarts child never lands a doctor's job.
  let highJobs=0, lowJobs=0;
  for(let i=0;i<300;i++){
    const hi={id:i,name:"H",age:18,health:70,happiness:70,smarts:90,bond:70};
    const lo={id:i,name:"L",age:18,health:70,happiness:70,smarts:20,bond:70};
    T.launchAdultChild(hi); T.launchAdultChild(lo);
    const need = T.CHILD_CAREERS.find(j=>j.id===hi.careerId).minSmarts;
    const needLo = T.CHILD_CAREERS.find(j=>j.id===lo.careerId).minSmarts;
    if(need>=70) highJobs++;
    if(needLo>=70) lowJobs++;
  }
  ok("bright children reach demanding careers", highJobs>20, highJobs);
  ok("ability actually gates careers", lowJobs===0, lowJobs);
  // Encouragement before 18 shifts education upward.
  let encHigh=0, plainHigh=0;
  for(let i=0;i<400;i++){
    const a={id:i,name:"A",age:18,health:70,happiness:70,smarts:90,bond:90,encouraged:{education:true}};
    const b={id:i,name:"B",age:18,health:70,happiness:70,smarts:90,bond:90};
    T.launchAdultChild(a); T.launchAdultChild(b);
    if(a.education==="doctorate") encHigh++;
    if(b.education==="doctorate") plainHigh++;
  }
  ok("encouragement raises education", encHigh > plainHigh, `${encHigh} vs ${plainHigh}`);
  // A grown child's life moves on, and grandchildren arrive.
  const c = {id:2,name:"Rhys",age:22,health:80,happiness:80,smarts:70,bond:85};
  T.launchAdultChild(c);
  c.encouraged = { family:true };
  s.children=[c];
  // Hold them inside the fertile window rather than letting the test depend on
  // partnering and conceiving before they age out of it.
  for(let y=0;y<400 && !(c.partnered && (c.grandchildren||0)>0);y++){ s.age++; c.age=30; T.tickAdultChild(c); }
  ok("partnered eventually", c.partnered===true);
  ok("grandchildren arrived", (c.grandchildren||0) > 0, c.grandchildren);
  ok("their net worth grew", (c.netWorth||0) > 0, c.netWorth);
  // Interactions
  const s2 = newLife(); s2.age=50; s2.money=20000;
  const d = {id:3,name:"Nia",age:25,health:80,happiness:60,smarts:70,bond:90};
  T.launchAdultChild(d); s2.children=[d];
  const bond0=d.bond; T.doAdultChild(3,"visit");
  ok("visiting raises the bond", d.bond>bond0, `${bond0}→${d.bond}`);
  ok("visiting records contact", d.lastContactAge===50);
  T.doAdultChild(3,"help");
  ok("helping out costs £5,000", s2.money===15000, s2.money);
  ok("the money reaches them", d.netWorth>=5000);
  // Encouragement lands where the bond is strong
  let took=0;
  for(let i=0;i<200;i++){
    const st=newLife(); st.age=50;
    const k={id:9,name:"K",age:24,health:70,happiness:70,smarts:70,bond:95};
    T.launchAdultChild(k); st.children=[k];
    T.doAdultChild(9,"career");
    if(k.encouraged && k.encouraged.career) took++;
  }
  ok("a close child takes encouragement", took>120, took+"/200");
  let tookWeak=0;
  for(let i=0;i<200;i++){
    const st=newLife(); st.age=50;
    const k={id:9,name:"K",age:24,health:70,happiness:70,smarts:70,bond:5};
    T.launchAdultChild(k); st.children=[k];
    T.doAdultChild(9,"career");
    if(k.encouraged && k.encouraged.career) tookWeak++;
  }
  ok("a distant child often refuses", tookWeak < took*0.7, `${took} close vs ${tookWeak} distant`);
  // Children launch on their own through ordinary play.
  const s3 = newLife(); s3.age=30;
  s3.children=[{id:7,name:"Sam",age:16,health:70,happiness:70,smarts:70,bond:60}];
  T.ageFamilyAndFriends(); T.ageFamilyAndFriends();
  ok("turns 18 and gets a life", s3.children[0].age===18 && s3.children[0].adult===true);
}

// ============================= 7 & 8. Friendship pop-ups, decay, see everyone
console.log("7 & 8. Friendships — offers, decay, and one-press rounds");
{
  // New-friend offer
  let offers=0, accepted=0;
  for(let i=0;i<60;i++){
    const s=newLife(); s.age=25; s.pendingChoice=null; s.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:1,performance:50};
    T.offerNewFriendship();
    if(s.pendingChoice){ offers++; const n=s.friends.length; choose("Take them up"); if(s.friends.length>n) accepted++; }
  }
  ok("a new-friend offer appears", offers===60, offers);
  ok("accepting adds a friend", accepted===60, accepted);

  // Invitation from an existing friend
  {
    const s=newLife(); s.age=30; s.money=2000; s.pendingChoice=null;
    T.addFriend("Mo", 50);
    T.offerFriendInvitation();
    ok("an invitation appears", !!s.pendingChoice);
    ok("it offers going, excusing and ignoring", s.pendingChoice.options.length===3);
    const c0=s.friends[0].closeness;
    choose("Go");
    ok("going raises closeness", s.friends[0].closeness>c0);
    ok("going records contact", s.friends[0].lastContactAge===30);
  }
  // Ignoring costs more than excusing. The two penalty ranges overlap, so this
  // has to compare averages rather than a single draw from each.
  {
    const sample = (which)=>{
      let total=0, n=120;
      for(let i=0;i<n;i++){
        const st=newLife(); st.age=30; st.money=2000; st.pendingChoice=null; T.addFriend("X",60);
        T.offerFriendInvitation(); choose(which);
        total += st.friends[0].closeness;
      }
      return total/n;
    };
    const afterExcuse = sample("excuse"), afterIgnore = sample("Don't reply");
    ok("ignoring hurts more than excusing", afterIgnore < afterExcuse - 3, `${afterExcuse.toFixed(1)} vs ${afterIgnore.toFixed(1)}`);
  }
  // Neglect decay, measured over years
  {
    // Averaged over many friendships: the decay has a random element, so a
    // single friend can land either side of any fixed line.
    let total = 0, n = 300, worst = 100;
    for(let i=0, tries=300; i<tries; i++){
      const s=newLife(); s.age=30;
      const f=T.addFriend("Neglected", 80);
      for(let y=0;y<6;y++){ s.age++; T.ageFamilyAndFriends(); }
      // A friend who has died or drifted off the list is no longer decaying.
      if(!s.friends.includes(f)){ n--; continue; }
      total += f.closeness; worst = Math.min(worst, 80 - f.closeness);
    }
    const mean = total / n;
    ok("neglect erodes a friendship", mean < 80-20, `80→${mean.toFixed(1)} on average`);
    ok("every neglected friendship loses ground", worst > 5, `smallest drop ${worst}`);
    // Seeing someone each year, then the birthday rolls over: closeness must
    // hold, not bleed away. (The contact is recorded before the year ticks,
    // exactly as it happens in play.)
    const s2=newLife(); s2.age=30;
    const g=T.addFriend("Kept up", 80);
    for(let y=0;y<10;y++){ g.lastContactAge=s2.age; s2.age++; T.ageFamilyAndFriends(); }
    ok("keeping in touch every year holds it steady", g.closeness === 80, `80 -> ${g.closeness} over 10 years`);
    // And eventually they drop away entirely.
    const s3=newLife(); s3.age=30;
    T.addFriend("Gone", 20);
    for(let y=0;y<12;y++){ s3.age++; T.ageFamilyAndFriends(); }
    ok("a long-neglected friend drifts away", s3.friends.length===0);
  }
  // The neglected friend calls it out
  {
    const s=newLife(); s.age=36; s.pendingChoice=null;
    const f=T.addFriend("Jan", 50); f.lastContactAge=30;
    T.offerNeglectedFriend();
    ok("neglect gets called out", !!s.pendingChoice && /had enough/i.test(s.pendingChoice.title));
    choose("Apologise");
    ok("apologising repairs it", f.closeness>50 && f.lastContactAge===36);
  }
  // Spend time with everyone
  {
    const s=newLife(); s.age=35;
    T.addFriend("A",40); T.addFriend("B",40); T.addFriend("C",40);
    s.relationship={id:500,name:"Partner",gender:"Boy",age:36,closeness:50,alive:true};
    const kid={id:600,name:"Kid",age:25,health:70,happiness:70,smarts:70,bond:40};
    T.launchAdultChild(kid); s.children=[kid];
    const circle=T.socialCircle();
    ok("the circle covers family, friends and partner", circle.length === s.family.filter(p=>p.alive).length + 3 + 1, circle.length);
    const before = circle.map(p=>p.closeness);
    T.doSpendTimeWithEveryone();
    ok("everyone gains closeness", T.socialCircle().every((p,i)=>p.closeness>=before[i]));
    ok("everyone is marked contacted", T.socialCircle().every(p=>p.lastContactAge===35));
    ok("grown children included", kid.lastContactAge===35 && kid.bond>40);
    ok("it uses the year's social time", T.usesLeft("social")===0);
    // Having seen everyone, none of them should decay when the year turns.
    const afterRound = s.friends.map(f=>f.closeness);
    s.age++; T.ageFamilyAndFriends();
    ok("nobody decays the year you see them", s.friends.every((f,i)=>f.closeness===afterRound[i]),
       afterRound.join(",")+" -> "+s.friends.map(f=>f.closeness).join(","));
  }
}

// ============================= 9. Work actions and per-career scenarios
console.log("9. Work actions and career scenarios");
{
  const s=newLife(); s.age=30;
  s.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:2,performance:50};
  const p0=T.jobPerformance(); T.doWorkHarder();
  ok("working harder raises performance", T.jobPerformance()>p0, `${p0}→${T.jobPerformance()}`);
  s.yearlyActivityUses={}; s.actionsLeft=10; s.pendingActionId=null;
  s.career.performance=50; T.doSlackOff();
  ok("slacking lowers it", T.jobPerformance()<50, T.jobPerformance());
  s.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:2,performance:50};
  T.quitJob();
  ok("quitting a civilian job is immediate", s.career===null);

  // Every civilian track must produce a usable scenario.
  const trackIds = T.TRACKS.map(t=>t.id);
  let missing=[], broken=[];
  trackIds.forEach(id=>{
    const st=newLife(); st.age=35;
    st.career={kind:"civilian",trackId:id,rankIndex:0,yearsInRank:3,performance:50};
    st.pendingChoice=null;
    // Force the roll through by calling until it fires.
    let fired=false;
    for(let i=0;i<400 && !fired;i++){ st.pendingChoice=null; T.maybeCareerEvent(); if(st.pendingChoice) fired=true; }
    if(!fired){ missing.push(id); return; }
    const pc=st.pendingChoice;
    if(!pc.title || !pc.text || !pc.options || pc.options.length<2 || !pc.options.every(o=>o.label && typeof o.effect==="function")) broken.push(id);
  });
  ok("every civilian career has a scenario", missing.length===0, missing.join(","));
  ok("every scenario is well-formed", broken.length===0, broken.join(","));

  // The services have their own pool.
  let forcesMissing=[];
  T.FORCES.forEach(f=>{
    const st=newLife(); st.age=30;
    st.career={kind:"forces",trackId:f.id,isOfficer:false,rankIndex:1,yearsInRank:2,deployed:false,deployedYearsLeft:0,performance:50};
    let fired=false;
    for(let i=0;i<400 && !fired;i++){ st.pendingChoice=null; T.maybeCareerEvent(); if(st.pendingChoice) fired=true; }
    if(!fired) forcesMissing.push(f.id);
  });
  ok("the services get scenarios too", forcesMissing.length===0, forcesMissing.join(","));

  // Every option in every scenario must run without throwing.
  let errs=[];
  const pools = [
    ...Object.entries(T.CAREER_EVENTS).map(([k,v])=>["civ:"+k, v]),
    ...Object.entries(T.CAREER_EVENT_POOLS).flatMap(([k,list])=>list.map((v,i)=>["pool:"+k+":"+i, v])),
    ...T.FORCES_EVENTS.map((v,i)=>["forces:"+i, v]),
    ...T.GENERIC_CAREER_EVENTS.map((v,i)=>["generic:"+i, v]),
  ];
  pools.forEach(([name,build])=>{
    const built = build(newLife());
    built.options.forEach((o,oi)=>{
      for(let rep=0;rep<40;rep++){
        const st=newLife(); st.age=35; st.money=50000;
        st.career={kind:"civilian",trackId:"tech",rankIndex:0,yearsInRank:3,performance:50};
        try{ build(st).options[oi].effect(); }
        catch(e){ errs.push(`${name} option ${oi}: ${e.message}`); break; }
      }
    });
  });
  ok("every scenario option runs cleanly", errs.length===0, errs.slice(0,4).join(" | "));
  ok("scenario pool is substantial", Object.keys(T.CAREER_EVENTS).length + Object.keys(T.CAREER_EVENT_POOLS).length >= 30,
    Object.keys(T.CAREER_EVENTS).length + Object.keys(T.CAREER_EVENT_POOLS).length);
}

// ============================= 10. Panels render with the new controls
console.log("10. The screens actually show it all");
{
  const s=newLife(); s.age=40; s.money=300000;
  // Assets: investments
  T.openAssetsSheet(); let ov=document.body.children[document.body.children.length-1];
  T.assetsView.screen="invest"; T.renderAssetsSheet(ov);
  ok("invest screen has an amount box", ov.innerHTML.includes('id="investAmtInput"'));
  ok("invest screen has shortcuts", ov.innerHTML.includes('data-setamt="all"'));
  Object.keys(T.INVESTMENT_TYPES).forEach(k=>ok("can invest in "+k, ov.innerHTML.includes(`data-investnow="${k}"`)));
  // Assets: property
  T.assetsView.screen="property"; T.renderAssetsSheet(ov);
  ok("property screen shows the max", ov.innerHTML.includes("Most you can buy now"));
  ok("property screen has a bulk box", ov.innerHTML.includes('id="bulkPropInput"'));
  ok("property screen has buy-max", ov.innerHTML.includes('id="buyMaxBtn"'));
  s.assets.push({type:"property",name:"a property",value:40000,upkeep:1200,rented:false});
  T.renderAssetsSheet(ov);
  ok("property screen has rent-all", ov.innerHTML.includes('id="rentAllBtn"'));
  // Assets: finances / insurance
  T.assetsView.screen="finances"; T.renderAssetsSheet(ov);
  ok("insurance quoted at your age", ov.innerHTML.includes("Quoted at age 40"));
  T.buyLifeInsurance("basic"); T.renderAssetsSheet(ov);
  ok("insurance can be switched", ov.innerHTML.includes("data-reinsure"));
  ok("insurance can be cancelled", ov.innerHTML.includes('id="cancelInsureBtn"'));
  ok("shows the locked-in age", ov.innerHTML.includes("rate locked in at age 40"));

  // Relationships: everyone button and adult child panel
  T.openPeopleSheet(); ov=document.body.children[document.body.children.length-1];
  T.renderPeopleSheetContent(ov);
  ok("relationships menu has see-everyone", ov.innerHTML.includes('id="seeEveryoneBtn"'));
  const kid={id:77,name:"Eli",age:26,health:80,happiness:70,smarts:80,bond:70};
  T.launchAdultChild(kid); s.children=[kid];
  T.peopleView.tab="children"; T.peopleView.person={kind:"child", id:77}; T.renderPeopleSheetContent(ov);
  ["Education","Work","Earning","Their net worth","Settled down","Grandchildren"].forEach(l=>
    ok("adult child shows "+l, ov.innerHTML.includes(l)));
  // Actions now sit on the child's own page, keyed by what they do.
  ["visit","help","enc:education","enc:career","enc:dating","enc:family"].forEach(k=>
    ok("adult child action: "+k, ov.innerHTML.includes(`data-pact="${k}"`)));

  // Activities: dating filters and one-night stands
  T.openActivitySheet ? T.openActivitySheet() : null;
  ov=document.body.children[document.body.children.length-1];
  T.activityView.tab="dating"; T.renderActivitySheetContent(ov);
  ok("dating has an age filter", ov.innerHTML.includes('id="fMinAge"') && ov.innerHTML.includes('id="fMaxAge"'));
  ok("dating has a net-worth filter", ov.innerHTML.includes('id="fMinNw"'));
  ok("dating has wealth presets", ov.innerHTML.includes('data-nwpreset="500000"'));
  ok("dating offers a one-night stand", ov.innerHTML.includes('id="oneNightBtn"'));
  ok("profiles show age and net worth", /\d+ · .*net worth £/.test(ov.innerHTML) || ov.innerHTML.includes("net worth"));
  s.relationship={id:1,name:"Partner",gender:"Boy",age:41,closeness:60,alive:true};
  T.renderActivitySheetContent(ov);
  ok("intimacy is one prompt now", ov.innerHTML.includes('id="intimacyBtn"') && !ov.innerHTML.includes('id="intimacyUnprotectedBtn"'));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
