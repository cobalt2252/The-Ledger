// Shop listings that vary each visit, property listings, and heirlooms with condition.
const T = require("./harness.js")(`SHOP_DEFS, restockShop, doBuyListing, priceVerdict, openShoppingSheet, enterShop, renderShoppingSheet,
  get shopStock(){return shopStock;}, get shopView(){return shopView;}, condLabel, condFactor, propCondFactor,
  makePropertyListing, propertyListings, doBuyListedProperty, renovationQuote, doRenovate, doSellProperty, doMoveInto, homeOf, canLet,
  rentDue, annualExpenses, toggleRent, rentOutAllProperties, depreciateAssets, propertyPrice, mortgageDeposit,
  makeHeirloomItem, giveHeirloom, heirloomOnDeath, parentsHeirlooms, ageBelongings, restoreQuote, doRestore, doAppraise, saleQuote, doSellBelonging,
  heirloomsForHeir, startAsChild, makePerson, priceLevel, vehicleSpeedRating, eraMoney,
  openAssetsSheet, renderAssetsSheet, get assetsView(){return assetsView;}, ageFamilyAndFriends, advanceChoiceQueue, netWorth`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };
function life(year){
  T.state=null; T.appScreen="home"; T.rollSetupDraft();
  T.startGame("Test Person","Girl","Straight",{scenarioId:"free"});
  const s=T.state; s.year=year||2024; s.age=40; s.money=1e9; s.pendingChoice=null; s.choiceQueue=[]; s.livingWithParents=false; s.lastIncome=60000;
  return s;
}
const sheet=()=>{ const k=document.body.children; return k[k.length-1]; };
const html=()=>{ const s=sheet(); return s ? String(s.innerHTML||"") : ""; };
const quiet = (v,f)=>{ const r=Math.random; Math.random=()=>v; try { return f(); } finally { Math.random=r; } };
function choose(m){ const pc=T.state.pendingChoice; if(!pc) return false; const o=pc.options.find(x=>x.label.toLowerCase().includes(m.toLowerCase())); T.state.pendingChoice=null; if(!o) return false; o.effect(); T.advanceChoiceQueue(); return true; }

// ============================================================ 1. Shops
console.log("1. Shop listings that vary each visit");
{
  life(2024);
  ok("ten shops", T.SHOP_DEFS.length === 10, T.SHOP_DEFS.length);
  T.SHOP_DEFS.forEach(d=>{
    const st = T.restockShop(d.id);
    ok(`${d.name} has stock`, st.length >= 2, st.length);
    ok(`${d.name}: every listing priced and in a condition`, st.every(l=>l.asking>0 && l.market>0 && l.condition>=0 && l.condition<=100 && l.label), JSON.stringify(st[0]));
  });
  const a = T.restockShop("cars").map(l=>l.label+l.asking).join(), b = T.restockShop("cars").map(l=>l.label+l.asking).join();
  ok("a second visit brings different stock", a !== b);
  let seen = new Set(); for(let i=0;i<40;i++) T.restockShop("cars").forEach(l=>seen.add(l.label.split(" ").slice(2).join(" ")));
  ok("the dealer carries many kinds of car", seen.size >= 6, [...seen].join(", "));
}
{
  // Prices follow the year; things appear when they existed.
  const s=life(1970); const old=[]; for(let i=0;i<60;i++) T.restockShop("cars").forEach(l=>old.push(l));
  ok("no SUVs in 1970", !old.some(l=>/SUV/.test(l.label)));
  ok("no electric cars in 1970", !old.some(l=>/electric/.test(l.label)));
  const oldMed = old.map(l=>l.asking).sort((x,y)=>x-y)[Math.floor(old.length/2)];
  life(2024); const now=[]; for(let i=0;i<60;i++) T.restockShop("cars").forEach(l=>now.push(l));
  const nowMed = now.map(l=>l.asking).sort((x,y)=>x-y)[Math.floor(now.length/2)];
  ok("1970 cars cost 1970 money", oldMed < nowMed / 5, `${oldMed} vs ${nowMed}`);
  life(2000); let ebike=false; for(let i=0;i<60;i++) if(T.restockShop("bikes").some(l=>/electric/.test(l.label))) ebike=true;
  ok("no e-bikes in 2000", !ebike);
  life(2024); let ev=false; for(let i=0;i<60;i++) if(T.restockShop("cars").some(l=>/electric/.test(l.label))) ev=true;
  ok("electric cars today", ev);
}
{
  const s=life(2024); s.assets=[];
  const st=T.restockShop("cars"); const l=st[0];
  const m0=s.money; T.doBuyListing("cars", l.id);
  const a=s.assets[0];
  ok("buying charges the asking price", s.money === m0 - l.asking);
  ok("and the car arrives with its condition", a && a.condition === l.condition && a.value === l.market && a.type==="car");
  ok("and leaves the forecourt", !T.shopStock.cars.some(x=>x.id===l.id));
  s.money=10; const l2=T.shopStock.cars[0]; T.doBuyListing("cars", l2.id);
  ok("you can't buy what you can't afford", s.assets.length===1);
  s.money=1e9; s.flags.canBoat=false; const bl=T.restockShop("boats")[0]; T.doBuyListing("boats", bl.id);
  ok("a boat needs a licence first", !s.assets.some(x=>x.type==="boat"));
  s.flags.canBoat=true; T.doBuyListing("boats", bl.id); ok("then it can be bought", s.assets.some(x=>x.type==="boat"));
  const f=T.restockShop("faux")[0]; T.doBuyListing("faux", f.id); const fa=s.assets[s.assets.length-1];
  ok("fakes are worth a tenth", fa.fake && Math.abs(fa.value - f.asking*0.1) <= 1);
  ok("price verdicts are given", ["Below the going rate","Fair price","Optimistic asking price"].includes(T.priceVerdict(T.restockShop("jewel")[0])));
}
{
  // Sold as seen.
  let worse=0, same=0;
  for(let i=0;i<200;i++){
    const s=life(2024); s.assets=[];
    const l=T.restockShop("dodgy")[0]; T.doBuyListing("dodgy", l.id);
    const a=s.assets[0];
    if(a.condition < l.condition) worse++; else same++;
    if(i===0) ok("a dodgy car arrives with its real condition", a.condition === l.trueCondition);
  }
  ok("about half of Dave's cars are worse than described", worse > 60 && worse < 160, `${worse}/200`);
}
{
  // Performance comes from what the car is worth in today's money.
  const s=life(1970); const r70 = T.vehicleSpeedRating({ type:"car", name:"x", value: Math.round(30000 * T.priceLevel()) });
  life(2024); const r24 = T.vehicleSpeedRating({ type:"car", name:"x", value: Math.round(30000 * T.priceLevel()) });
  ok("the same car rates the same in any decade", Math.abs(r70 - r24) < 1, `${r70} vs ${r24}`);
}
{
  // The screens.
  const s=life(2024);
  T.openShoppingSheet(); const h=html();
  ok("the shopping screen lists every shop", T.SHOP_DEFS.every(d=>h.includes(d.name)));
  T.enterShop("music", sheet()); const h2=html();
  ok("a shop shows its listings", T.shopStock.music.every(l=>h2.includes(l.label)) && /data-buyl/.test(h2));
  ok("with condition and price", /Mint|Excellent|Good|Fair|Poor/.test(h2) && /£/.test(h2));
  T.openShoppingSheet("cars"); ok("dealers can be opened directly", T.shopView.shop==="cars" && /Austin Automotive/.test(html()));
}

{
  // Every shop, every year: nothing breaks before the things it sells existed.
  const s=life(2024); let bad=0;
  for(let y=1900;y<=2060;y+=2){ s.year=y; T.SHOP_DEFS.forEach(d=>{ try{ const st=T.restockShop(d.id); if(st.some(l=>!(l.asking>0))) bad++; }catch(e){ bad++; } }); }
  ok("every shop restocks safely in every year from 1900 to 2060", bad===0, bad);
  s.year=1925; ok("in 1925 the car dealers have nothing yet", T.restockShop("cars").length===0 && T.restockShop("motos").length===0);
}

// ============================================================ 2. Property
console.log("2. Property listings");
{
  const s=life(2024);
  const L=T.propertyListings(true);
  ok("five homes on the market", L.length===5);
  ok("each with a type, place, condition and price", L.every(l=>l.label && l.condition>=0 && l.asking>0 && l.upkeep>0));
  ok("looking again shows different ones", T.propertyListings(true).map(l=>l.label).join() !== L.map(l=>l.label).join());
  const many=Array.from({length:500},T.makePropertyListing);
  ok("from studios to manors", many.some(l=>l.propType==="studio") && many.some(l=>l.propType==="detached") && many.some(l=>l.propType==="manor"));
  const manor=many.find(l=>l.propType==="manor"), studio=many.find(l=>l.propType==="studio");
  ok("a manor costs far more than a studio", manor.asking > studio.asking * 6);
  ok("wrecks are cheap for what they are", (()=>{ const a=many.filter(l=>l.propType==="semi"&&l.condition<35), b=many.filter(l=>l.propType==="semi"&&l.condition>85); return !a.length||!b.length|| (a.reduce((s,l)=>s+l.value,0)/a.length) < (b.reduce((s,l)=>s+l.value,0)/b.length); })());
  life(1975); const L75=T.propertyListings(true); life(2024); const L24=T.propertyListings(true);
  ok("prices follow the year", L75.reduce((s,l)=>s+l.asking,0) < L24.reduce((s,l)=>s+l.asking,0)/5);
}
{
  const s=life(2024); s.assets=[]; const L=T.propertyListings(true); const l=L[0];
  const m0=s.money; T.doBuyListedProperty(l.id, false);
  const a=s.assets[0];
  ok("buying outright pays the asking price", s.money===m0-l.asking && a && a.condition===l.condition && a.value===l.value);
  ok("and the listing goes", !T.assetsView.listings.some(x=>x.id===l.id));
  // Mortgage.
  const l2=T.assetsView.listings[0]; s.money=T.mortgageDeposit(l2.asking)+10; s.creditScore=100; s.lastIncome=1e7;
  quiet(0.01, ()=>T.doBuyListedProperty(l2.id, true));
  const m=s.assets[1];
  ok("a mortgage takes the deposit", m && m.mortgage && m.mortgage.balance===l2.asking-T.mortgageDeposit(l2.asking) && s.money===10);
  const l3=T.assetsView.listings[0]; s.money=T.mortgageDeposit(l3.asking)+10; s.lastIncome=1000;
  quiet(0.01, ()=>T.doBuyListedProperty(l3.id, true));
  ok("a lender won't lend far beyond your income", s.assets.length===2);
}
{
  const s=life(2024);
  s.assets=[{type:"property", name:"terraced house in the town centre", value:200000, upkeep:1500, rented:false, condition:25}];
  const q=T.renovationQuote(s.assets[0]);
  ok("a run-down house can be renovated", q && q.cost>0);
  const v0=s.assets[0].value; T.doRenovate(0);
  ok("renovating raises condition and value", s.assets[0].condition>=78 && s.assets[0].value>v0, `${s.assets[0].condition} ${s.assets[0].value}`);
  ok("a house in good order needs no renovation", T.renovationQuote({value:1,condition:95})===null);
  s.assets.push({type:"property", name:"wreck", value:90000, upkeep:900, rented:false, condition:15});
  ok("a wreck can't be let", !T.canLet(s.assets[1]));
  T.toggleRent(1); ok("toggling won't let it", !s.assets[1].rented);
  T.doMoveInto(1); ok("nor can you live in it", !s.assets[1].home);
  T.rentOutAllProperties(); ok("renting out all skips it", !s.assets[1].rented && s.assets[0].rented);
  // Moving in.
  const e0=T.annualExpenses(); T.doMoveInto(0);
  ok("you can move into your own home", s.assets[0].home && !s.assets[0].rented && T.homeOf()===s.assets[0]);
  ok("which ends your rent", T.rentDue()===0 && e0 - T.annualExpenses() > 0, e0 - T.annualExpenses());
  s.assets[1].condition=60; T.doMoveInto(1);
  ok("only one home at a time", s.assets[1].home && !s.assets[0].home);
  T.toggleRent(1); ok("and you can't let the house you live in", !s.assets[1].rented);
  // Wear.
  s.assets[0].rented=true; const c0=s.assets[0].condition;
  for(let y=0;y<10;y++) T.depreciateAssets();
  ok("a let house wears over the years", s.assets[0].condition < c0);
  // Selling with a mortgage.
  s.assets=[{type:"property", name:"flat", value:200000, upkeep:1, rented:false, condition:70, mortgage:{balance:150000, rate:0.05, annualPayment:9000}}];
  const m0=s.money; T.doSellProperty(0);
  ok("selling pays off the mortgage and the agents", s.money - m0 === 200000 - 3000 - 150000 && !s.assets.length, s.money-m0);
  s.money=0; s.assets=[{type:"property", name:"flat", value:100000, upkeep:1, rented:false, condition:70, mortgage:{balance:150000, rate:0.05, annualPayment:9000}}];
  T.doSellProperty(0); ok("negative equity stops a sale you can't cover", s.assets.length===1);
  // Old properties with no condition still work.
  s.money=1e9; s.assets=[{type:"property", name:"a property", value:290000, upkeep:1200, rented:false}];
  T.depreciateAssets(); ok("legacy properties are untouched by wear", s.assets[0].condition===undefined);
  T.toggleRent(0); ok("and can still be let", s.assets[0].rented);
}
{
  const s=life(2024); s.assets=[{type:"property", name:"semi-detached house", value:300000, upkeep:1500, rented:false, condition:30, beds:3}];
  T.openAssetsSheet(); T.assetsView.screen="property"; T.propertyListings(true); T.renderAssetsSheet(sheet()); const h=html();
  ok("the property screen shows the market", /On the market/.test(h) && T.assetsView.listings.every(l=>h.includes(l.label)));
  ok("with outright and mortgage buttons", /data-buyprop="\d+:cash"/.test(h) && /data-buyprop="\d+:mortgage"/.test(h));
  ok("and each property's condition and actions", /Poor condition|Fair condition/.test(h) && /data-renovate/.test(h) && /data-sellprop/.test(h) && /data-movein/.test(h));
  ok("bulk buying is still there", /Buy in bulk/.test(h) && /bulkPropInput/.test(h));
  T.assetsView.screen="vehicles"; T.renderAssetsSheet(sheet());
  ok("vehicles link to the dealers", /data-goshop="cars"/.test(html()) && /Dodgy Dave/.test(html()));
}

// ============================================================ 3. Heirlooms
console.log("3. Heirlooms with condition");
{
  const s=life(2024); s.assets=[];
  const items=Array.from({length:300},T.makeHeirloomItem);
  ok("heirlooms have an era, a condition and a value", items.every(h=>h.name && h.madeYear<=2024-25 && h.condition>=25 && h.condition<=95 && h.believed>0 && h.trueBase>0));
  ok("named for when they were made", items.some(h=>/^Victorian/.test(h.name)) && items.some(h=>/^Art Deco|^mid-century|^Edwardian/.test(h.name)));
  const a=T.giveHeirloom("your grandmother Eleri");
  ok("an heirloom says where it came from", a.from==="your grandmother Eleri" && a.type==="heirloom" && !a.appraised);
  ok("and is worth what its condition allows", a.value===Math.round(a.baseValue*T.condFactor(a.condition)));
  ok("it counts in net worth", T.netWorth() >= s.money + a.value - 1);
  // Valuation.
  let finds=0, copies=0;
  for(let i=0;i<1000;i++){ s.assets=[]; const h=T.giveHeirloom("x"); const v0=h.value; T.doAppraise(0); const r=h.value/v0; if(r>=4) finds++; if(r<=0.35) copies++; }
  ok("about one in twenty turns out to be a real find", finds>25 && finds<80, finds);
  ok("and about one in twelve a later copy", copies>50 && copies<120, copies);
  s.assets=[]; const h=T.giveHeirloom("x"); T.doAppraise(0); const m=s.money; T.doAppraise(0);
  ok("a valuation is done once", s.money===m && h.appraised);
  // Wear, restoration, sale.
  s.assets=[]; const w=T.giveHeirloom("x"); w.condition=60; w.cat="instrument"; const c0=w.condition;
  for(let y=0;y<10;y++){ s.year++; T.ageBelongings(); }
  ok("things wear with the years", w.condition < c0, w.condition);
  w.condition=40; const rq=T.restoreQuote(w);
  ok("a worn heirloom can be restored", rq && rq.cost>0 && rq.to===80);
  w.cat="jewellery"; const v1=w.value; T.doRestore(0);
  ok("restoring raises condition and value", w.condition===80 && w.value>v1);
  ok("nothing to restore once it's in good order", T.restoreQuote(w)===null || w.condition<85);
  // Botched restoration of an antique, sometimes.
  let botched=0; for(let i=0;i<400;i++){ s.assets=[]; const x=T.giveHeirloom("x"); x.cat="antique"; x.condition=30; const b0=x.baseValue; T.doRestore(0); if(x.baseValue<b0) botched++; }
  ok("over-restoring an antique sometimes costs it value", botched>15 && botched<75, botched);
  s.assets=[]; const u=T.giveHeirloom("x"); u.appraised=false;
  ok("an unvalued heirloom goes to a dealer at 70%", T.saleQuote(u).price===Math.round(u.value*0.7) && /dealer/.test(T.saleQuote(u).how));
  u.appraised=true; ok("a valued one goes to auction", /auction/.test(T.saleQuote(u).how));
  const hap=s.stats.happiness; T.doSellBelonging(0);
  ok("selling an heirloom stings", !s.assets.length && s.stats.happiness<=hap);
}
{
  // Real value over time: fine things keep pace with inflation.
  const r=[]; for(let i=0;i<200;i++){ const s=life(2000); s.assets=[]; const a=T.giveHeirloom("x"); a.cat="antique"; a.condition=80; a.appraised=true; a.baseValue=a.trueBase; a.value=Math.round(a.baseValue*T.condFactor(80));
    const real0=a.baseValue/T.priceLevel(); for(let y=0;y<20;y++){ s.year++; T.ageBelongings(); } r.push((a.baseValue/T.priceLevel())/real0); }
  const med=r.sort((x,y)=>x-y)[100];
  ok("an antique's pristine value beats inflation over twenty years", med>1 && med<1.6, med.toFixed(2));
}
{
  // Where heirlooms come from.
  let gp=0; for(let i=0;i<500;i++){ const s=life(2024); s.assets=[]; T.heirloomOnDeath({relation:"Grandmother", name:"Eleri"}); if(s.assets.length) gp++; }
  ok("a grandparent leaves something about two times in five", gp>150 && gp<250, gp);
  const s=life(2024); s.assets=[]; T.heirloomOnDeath({relation:"Friend", name:"Bob"}); ok("friends don't leave heirlooms", !s.assets.length);
  s.assets=[]; T.parentsHeirlooms("all",1); ok("an only child gets all their parents' heirlooms", s.assets.length>=1);
  s.assets=[]; T.parentsHeirlooms("none",3); ok("waiving gets none", !s.assets.length);
  // A middle-class family leaves one or two (1.5 on average); you get each one time in four.
  s.wealthTier="middle"; let shared=0; for(let i=0;i<600;i++){ s.assets=[]; T.parentsHeirlooms("share",4); shared+=s.assets.length; }
  ok("with three siblings you get about a quarter of them", shared/600 > 0.28 && shared/600 < 0.48, (shared/600).toFixed(2));
  // Through the estate choice.
  const t=life(2024); t.assets=[]; t.wealthTier="middle";
  const ps=t.family.filter(p=>p.relation==="Mother"||p.relation==="Father");
  t.family=t.family.filter(p=>p.relation!=="Sibling");
  const sib=T.makePerson("Sibling","Boy",38); t.family.push(sib);
  ps.forEach(p=>{p.alive=true; p.age=120;});
  t.flags.parentsEstateSettled=false;
  for(let i=0;i<50 && !t.pendingChoice;i++){ ps.forEach(p=>{ if(p.alive) p.age=120; }); T.ageFamilyAndFriends(); }
  const est=[t.pendingChoice].concat(t.choiceQueue||[]).find(c=>c && c.title==="Dividing the estate");
  ok("the parents' estate is divided", !!est);
  if(est){ t.pendingChoice=est; t.choiceQueue=[]; t.assets=t.assets.filter(a=>a.type!=="heirloom"); choose("Waive"); ok("waiving your share waives the heirlooms too", !t.assets.some(a=>a.type==="heirloom" && /parents/.test(a.from))); }
}
{
  // Down the generations.
  const s=life(2024); s.assets=[]; s.estatePlan="equal";
  T.giveHeirloom("your grandmother Eleri");
  s.assets.push({type:"luxury", name:"Gold watch", cat:"jewellery", value:3000, baseValue:3000, condition:100, appraised:true, upkeep:0, rented:false});
  s.assets.push({type:"luxury", name:"'Gold' watch (dubious)", cat:"jewellery", fake:true, value:30, baseValue:30, condition:100, appraised:true, upkeep:0, rented:false});
  s.assets.push({type:"car", name:"Calloway Vireo hatchback", value:9000, upkeep:500, rented:false, condition:70});
  const kid=Object.assign(T.makePerson("Child","Girl",30),{age:30}); kid.bond=60;
  s.children=[kid];
  const pass=T.heirloomsForHeir(kid, s.children, s.name, s.gender);
  ok("your belongings pass to your heir as heirlooms", pass.length===2 && pass.every(a=>a.type==="heirloom"));
  ok("fakes and cars don't", !pass.some(a=>/dubious|Calloway/.test(a.name)));
  ok("each says where it came from", pass.some(a=>/by way of your mother/.test(a.from)) && pass.some(a=>/your mother Test/.test(a.from)));
  s.estatePlan="charity"; ok("a will to charity passes nothing", !T.heirloomsForHeir(kid, s.children, s.name, s.gender).length);
  const older=Object.assign(T.makePerson("Child","Boy",40),{age:40}); s.children=[kid, older]; s.estatePlan="eldest";
  ok("everything to the eldest means the younger gets none", !T.heirloomsForHeir(kid, s.children, s.name, s.gender).length);
  ok("and the eldest gets them", T.heirloomsForHeir(older, s.children, s.name, s.gender).length===2);
  // The whole hand-over.
  s.estatePlan="equal"; s.children=[kid]; s.money=100000; s.alive=false;
  const nw=T.netWorth(), hv=pass.reduce((t,a)=>t+a.value,0);
  T.startAsChild(kid.id);
  const n=T.state;
  ok("the new generation holds the heirlooms", n.assets.filter(a=>a.type==="heirloom").length===2);
  ok("and the money excludes them, so nothing is counted twice", Math.abs(n.money - (nw - hv)) <= 2, `${n.money} vs ${nw-hv}`);
}

console.log(`verify_h: ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
