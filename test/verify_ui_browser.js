// Runs the real page in Chromium: every sheet gets the header, every plain
// button becomes a row, the rows still work, and nothing overflows a phone.
const { chromium } = require('playwright');
const fs = require('fs');
// Where to write the test copy of the page (defaults to the system temp folder).
const SP = process.argv[2] || require('os').tmpdir();
let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };
(async()=>{
  const src = fs.readFileSync(require("path").join(__dirname,"..","index.html"),'utf8');
  const i = src.lastIndexOf("render();\n})();");
  fs.writeFileSync(SP+'/uitest.html', src.slice(0,i)+"render();\nwindow.__run=(c)=>eval(c);\n})();"+src.slice(i+"render();\n})();".length));
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport:{ width:390, height:844 } });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('file://'+SP+'/uitest.html'); await p.waitForTimeout(300);
  const run = c=>p.evaluate(c=>window.__run(c), c);
  const setup = async ()=>run(`
    startGame("Garth Banks","Boy","Straight"); appScreen="game";
    state.year += 40; state.age = 40; state.money = 500000; state.stats.health = 60;
    state.relationship = makePerson("Partner","Girl",38); state.married = true; state.marriedAtAge = 30; state.relationshipYears = 12;
    addFriend("Jon", 50); state.flags.canDrive = true;
    state.assets.push({type:"car", name:"Family saloon", value:12000, upkeep:700, rented:false});
    render();`);
  await setup();

  const screens = [
    ["Activities", 'openActivitySheet()'],
    ["Mind & Body", 'openActivitySheet(); activityView.tab="foryou"; refreshActivitySheet()'],
    ["Sport & Beauty", 'openActivitySheet(); activityView.tab="skills"; refreshActivitySheet()'],
    ["Love", 'openActivitySheet(); activityView.tab="dating"; refreshActivitySheet()'],
    ["Family", 'openActivitySheet(); activityView.tab="family"; refreshActivitySheet()'],
    ["Licences", 'openActivitySheet(); activityView.tab="licenses"; refreshActivitySheet()'],
    ["Casino & Work", 'openActivitySheet(); activityView.tab="money"; refreshActivitySheet()'],
    ["Travel", 'openActivitySheet(); activityView.tab="world"; refreshActivitySheet()'],
    ["Occupation", 'careerView={level:"categories",category:null}; openCareerSheet()'],
    ["Trades", 'careerView={level:"tracks",category:"Manual & Trades"}; openCareerSheet()'],
    ["Forces", 'careerView={level:"tracks",category:"Armed Forces"}; openCareerSheet()'],
    ["Politics", 'careerView={level:"tracks",category:"Politics"}; openCareerSheet()'],
    ["Education", 'careerView={level:"education",category:null}; openCareerSheet()'],
    ["Gigs", 'careerView={level:"gigs",category:null}; openCareerSheet()'],
    ["Assets", 'openAssetsSheet()'],
    ["Finances", 'openAssetsSheet(); assetsView.screen="finances"; refreshAssetsSheet()'],
    ["Investments", 'openAssetsSheet(); assetsView.screen="invest"; refreshAssetsSheet()'],
    ["Property", 'openAssetsSheet(); assetsView.screen="property"; refreshAssetsSheet()'],
    ["Vehicles", 'openAssetsSheet(); assetsView.screen="vehicles"; refreshAssetsSheet()'],
    ["Shopping", 'openShoppingSheet()'],
    ["Casino", 'openCasinoSheet()'],
    ["Slots", 'openCasinoSheet(); casinoView.game="slots"; renderCasinoSheet(document.getElementById("sheetOverlay"))'],
    ["Blackjack", 'openBlackjackSheet()'],
    ["Relationships", 'openPeopleSheet()'],
    ["Partner page", 'openPeopleSheet(); peopleView.tab="partner"; peopleView.person={kind:"partner",id:state.relationship.id}; refreshPeopleSheet()'],
  ];
  for(const [name, code] of screens){
    await run('closeSheet();'); await run(code); await p.waitForTimeout(60);
    const r = await p.evaluate(()=>{
      const sh = document.querySelector('#sheetOverlay .sheet');
      if(!sh) return { missing:true };
      const hud = sh.querySelector(':scope > .sheet-hud');
      const plain = [...sh.querySelectorAll('.choices > button')].filter(b=>
        !b.classList.contains('erow') && !b.classList.contains('mrow') && !b.classList.contains('primary') &&
        !(b.closest('.track-card') && !/ — /.test(b.textContent)));
      const noIcon = [...sh.querySelectorAll('.erow')].filter(b=>b.querySelector('.mi-dot')).map(b=>b.querySelector('.mtitle').textContent);
      return {
        hud: !!hud, x: !!(hud && hud.querySelector('.sheet-x')), bal: hud ? hud.querySelector('.hud-amt').textContent : "",
        plain: plain.map(b=>b.textContent.trim().slice(0,40)),
        noIcon,
        overflow: sh.scrollWidth > sh.clientWidth + 1,
        rows: sh.querySelectorAll('.erow, .mrow').length,
      };
    });
    if(r.missing){ ok(`${name}: sheet opens`, false); continue; }
    ok(`${name}: has the header`, r.hud);
    ok(`${name}: close button sits in the header`, r.x);
    ok(`${name}: header shows the balance`, /\d/.test(r.bal), r.bal);
    ok(`${name}: no plain buttons left`, r.plain.length === 0, r.plain.join(" | "));
    ok(`${name}: nothing wider than the phone`, !r.overflow);
    if(r.noIcon.length) console.log(`  note — ${name}: rows without an icon: ${r.noIcon.join(", ")}`);
  }

  // A converted row still does what it did.
  await setup();
  await run('openActivitySheet(); activityView.tab="foryou"; refreshActivitySheet()');
  const before = await run('state.money');
  await p.click('button[data-a="gym"]'); await p.waitForTimeout(60);
  const after = await run('state.money');
  ok("pressing a converted row still runs it", after < before, `${before} → ${after}`);
  const bal = await p.evaluate(()=>document.querySelector('.sheet-hud .hud-amt').textContent);
  ok("and the header shows the new balance", bal === await run('money(state.money)'), bal);

  // Buying from a dealer through its new row.
  await run('closeSheet(); openShoppingSheet("bikes")');
  const assets0 = await run('state.assets.length');
  await p.locator('#sheetOverlay [data-buyl]').first().click(); await p.waitForTimeout(60);
  ok("buying from a dealer row works", await run('state.assets.length') === assets0 + 1);

  // The close button in the header closes the sheet.
  await p.click('.sheet-hud .sheet-x'); await p.waitForTimeout(60);
  ok("the header's ✕ closes the sheet", await p.evaluate(()=>!document.getElementById('sheetOverlay')));

  // Just for you rows go where they say.
  await setup();
  await run('state.stats.health = 30; openActivitySheet()');
  await p.click('[data-jfy="0"]'); await p.waitForTimeout(60);
  ok("a suggestion opens its screen", await run('activityView.tab') === "foryou");

  // Choice pop-ups get the header too.
  await run('closeSheet(); queueChoice({title:"Test", text:"A decision", options:[{label:"Yes", effect:()=>{}}]}); render();');
  await p.waitForTimeout(80);
  ok("decision pop-ups show the header", await p.evaluate(()=>!!document.querySelector('.sheet .sheet-hud')));

  ok("no page errors", errs.length === 0, errs.join(" | "));
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
