// Social media, platform by platform.
const T = require("./harness.js")(`SOCIAL_PLATFORMS, platformName, platformIcon, platformVerb, socialAccounts, accountOn,
  platformExists, reconcileFollowers, syncFollowers, largestAccount, contentAllowance, postsLeft, postsLeftOn,
  doJoinPlatform, doLeavePlatform, doPlatformPost, doPlatformPromote, doPlatformCollab, doPlatformStunt, doPlatformVerify,
  canVerify, verificationCost, runSocialYear, maybeSocialEvent, linkedinBoost, renderSocialPanel, renderPlatformPage,
  get socialView(){return socialView;}, set socialView(v){socialView=v;}, openActivitySheet, renderActivitySheetContent,
  get activityView(){return activityView;}, set activityView(v){activityView=v;}, activityTabs, doSocialPost,
  payAdditionalIncome, incomeTax, priceLevel, justForYou, eraMoney, TRACKS, applyToTrack, moneyIndex`);

let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };
function fresh(year, age){
  ["startBtn","firstNameInput","lastNameInput","toPerksBtn"].forEach(id=>{ reg[id] = new FakeEl(); });
  reg.firstNameInput.value = "Test"; reg.lastNameInput.value = "Person";
  T.state = null; T.appScreen = "create"; T.render(); reg.startBtn.click();
  const s = T.state; s.year = year || 2024; s.age = age || 25; s.yearlyActivityUses = {}; s.actionsUsed = 0; s.money = 100000;
  s.pendingChoice = null; s.choiceQueue = [];
  return s;
}
const P = id=>T.SOCIAL_PLATFORMS.find(p=>p.id===id);
const html = ()=>{ const k=document.body.children; return k.length ? String(k[k.length-1].innerHTML||"") : ""; };

console.log("1. The platforms");
const want = { youtube:2005, tiktok:2017, instagram:2010, facebook:2004, x:2006, snapchat:2011, twitch:2011, kick:2022,
  podcast:2005, soundcloud:2008, linkedin:2003, reddit:2005, pinterest:2010, substack:2017, patreon:2013, onlyfans:2016 };
ok("sixteen platforms", T.SOCIAL_PLATFORMS.length === 16, T.SOCIAL_PLATFORMS.length);
ok("no duplicate ids", new Set(T.SOCIAL_PLATFORMS.map(p=>p.id)).size === 16);
Object.entries(want).forEach(([id,y])=>ok(`${id} launches in ${y}`, P(id) && P(id).from === y, P(id) && P(id).from));
ok("OnlyFans is 18+", P("onlyfans").minAge === 18);
ok("every platform says what it's good for", T.SOCIAL_PLATFORMS.every(p=>p.blurb && p.blurb.length > 20));
ok("every platform has a verb for posting", T.SOCIAL_PLATFORMS.every(p=>p.verb));
{
  fresh(2015);
  ok("in 2015 it's Twitter", T.platformName(P("x")) === "Twitter" && T.platformVerb(P("x")) === "Tweet" && T.platformIcon(P("x")) === "🐦");
  fresh(2024);
  ok("in 2024 it's X", T.platformName(P("x")) === "X" && T.platformVerb(P("x")) === "Post");
}

console.log("2. Who can see what");
{
  const s = fresh(1999, 25);
  ok("in 1999 nothing exists yet", T.SOCIAL_PLATFORMS.every(p=>!T.platformExists(p)));
  const h = T.renderSocialPanel();
  ok("so everything is listed as not invented yet", /Not invented yet/.test(h) && /Launches in 2003/.test(h) && !/data-socjoin/.test(h));
  ok("and it says when the first arrives", /the first platform arrives in 2003/.test(h));
  T.doJoinPlatform("youtube");
  ok("and you can't join before launch", !T.accountOn("youtube"));

  const kid = fresh(2024, 12);
  ok("no Social Media tab under 13", !T.activityTabs().some(t=>t.id==="social"));
  const teen = fresh(2024, 14);
  ok("a Social Media tab at 13+", T.activityTabs().some(t=>t.id==="social"));
  const th = T.renderSocialPanel();
  ok("a 14-year-old can join YouTube", /data-socjoin="youtube"/.test(th));
  ok("but not LinkedIn yet", !/data-socjoin="linkedin"/.test(th) && /From age 16/.test(th));
  ok("and is never shown OnlyFans at all", !/OnlyFans/.test(th), th.match(/OnlyFans.{0,40}/));
  T.doJoinPlatform("onlyfans");
  ok("nor allowed to join it", !T.accountOn("onlyfans"));
  const old = fresh(2010, 15);
  ok("a minor in 2010 isn't shown OnlyFans as coming either", !/OnlyFans/.test(T.renderSocialPanel()));
  const adult = fresh(2024, 22);
  ok("an adult can join OnlyFans", /data-socjoin="onlyfans"/.test(T.renderSocialPanel()));
}

console.log("3. One total, many accounts");
{
  const s = fresh(2024, 25);
  s.followers = 5000; s.socialSynced = 0; s.socialOther = 0;   // an old save
  T.reconcileFollowers();
  ok("an old save's followers are held aside", s.socialOther === 5000 && s.followers === 5000);
  T.doJoinPlatform("instagram");
  ok("and arrive with the first account", T.accountOn("instagram").followers === 5000 && s.socialOther === 0);
  T.doJoinPlatform("tiktok");
  ok("a second account starts from nothing", T.accountOn("tiktok").followers === 0);
  s.followers += 2000;    // something elsewhere in the game adds followers
  T.reconcileFollowers();
  ok("outside gains go to the biggest account", T.accountOn("instagram").followers === 7000);
  T.accountOn("tiktok").followers = 3000; T.syncFollowers();
  s.followers = Math.round(s.followers * 0.5);   // a cancellation halves the following
  T.reconcileFollowers();
  ok("outside losses are shared out", T.accountOn("instagram").followers === 3500 && T.accountOn("tiktok").followers === 1500,
    `${T.accountOn("instagram").followers} / ${T.accountOn("tiktok").followers}`);
  ok("and the total matches", s.followers === 5000);
  T.doLeavePlatform("tiktok");
  ok("deleting an account takes its followers", s.followers === 3500 && !T.accountOn("tiktok"));
}

console.log("4. Posting");
{
  const s = fresh(2024, 25);
  T.doJoinPlatform("youtube"); T.doJoinPlatform("tiktok"); T.doJoinPlatform("instagram");
  for(let i=0;i<10;i++) T.doPlatformPost("youtube");
  ok("three posts a year on one platform", T.accountOn("youtube").posts === 3);
  for(let i=0;i<10;i++){ T.doPlatformPost("tiktok"); T.doPlatformPost("instagram"); }
  ok("six a year across all of them", T.accountOn("tiktok").posts + T.accountOn("instagram").posts === 3, T.accountOn("tiktok").posts + T.accountOn("instagram").posts);
  ok("and nothing left after that", T.postsLeft() === 0);
  s.career = { kind:"civilian", trackId:"content_creator", rankIndex:0, yearsInRank:0 };
  ok("content creators get twelve", T.contentAllowance() === 12 && T.postsLeft() === 6);
  ok("posting records the year", T.accountOn("youtube").lastPostAge === s.age);

  // Looks matter on TikTok, smarts on YouTube.
  // Medians, not means: rare breakouts swing an average wildly, and the
  // median is what a typical player sees.
  function mean(id, looks, smarts){
    const v = [], n = 600;
    for(let i=0;i<n;i++){ const st=fresh(2024,25); st.stats.looks=looks; st.stats.smarts=smarts; st.hidden.fame=0; T.doJoinPlatform(id); T.doPlatformPost(id); v.push(T.accountOn(id).followers); }
    v.sort((a,b)=>a-b);
    return v[Math.floor(n/2)];
  }
  ok("looks drive TikTok", mean("tiktok", 90, 30) > mean("tiktok", 30, 90) * 1.4);
  ok("smarts drive YouTube", mean("youtube", 30, 90) > mean("youtube", 90, 30) * 1.4);
  const s2 = fresh(2024, 25);
  T.doJoinPlatform("x");
  ok("the old one-tap post now goes through an account", (()=>{ T.doSocialPost(); return T.accountOn("x").posts === 1; })());
}

console.log("5. Being paid");
{
  function yearPay(id, followers, setup){
    const s = fresh(2024, 30); s.money = 0; s.lastIncome = 0;
    T.doJoinPlatform(id); const a = T.accountOn(id); a.followers = followers; T.syncFollowers();
    if(setup) setup(s, a);
    a.lastPostAge = s.age;   // active this year
    T.runSocialYear(); s.pendingChoice = null; s.choiceQueue = [];
    return s.money;
  }
  ok("below the threshold YouTube pays nothing", yearPay("youtube", 900) === 0);
  ok("above it, it pays", yearPay("youtube", 50000) > 0);
  ok("Reddit never pays", yearPay("reddit", 500000) === 0);
  ok("LinkedIn never pays", yearPay("linkedin", 20000) === 0);
  ok("X doesn't pay unverified accounts", yearPay("x", 200000) === 0);
  ok("X pays verified members from 2023", yearPay("x", 200000, (s,a)=>{ a.verified = true; a.verifiedPaid = true; }) > 0);
  ok("before 2023 X paid nobody", (()=>{ const s=fresh(2020,30); s.money=0; T.doJoinPlatform("x"); const a=T.accountOn("x"); a.followers=200000; a.verified=true; a.lastPostAge=s.age; T.runSocialYear(); return s.money===0; })());
  // Paying subscribers are worth far more each than free followers.
  const yt = yearPay("youtube", 1000), of = yearPay("onlyfans", 1000);
  ok("a paying subscriber is worth more than a free follower", of > yt * 50, `${yt} vs ${of}`);

  // Idle accounts: YouTube's back catalogue still earns, TikTok stops.
  function idlePay(id){ const s=fresh(2024,30); s.money=0; T.doJoinPlatform(id); const a=T.accountOn(id); a.followers=200000; a.lastPostAge=s.age-1; T.runSocialYear(); return s.money; }
  ok("an idle YouTube channel still earns something", idlePay("youtube") > 0);
  ok("an idle TikTok earns nothing", idlePay("tiktok") === 0);
  // And idle accounts shrink.
  const s = fresh(2024,30); T.doJoinPlatform("tiktok"); const a = T.accountOn("tiktok"); a.followers = 100000; a.lastPostAge = 20;
  T.runSocialYear();
  ok("a year without posting shrinks the audience", a.followers < 90000, a.followers);

  // Tax: on top of a salary, at the marginal rate.
  const t = fresh(2024, 40); t.money = 0; t.incomeTally = 60000; t.incomeTallyAge = t.age; t.lastIncome = 60000;
  const net = T.payAdditionalIncome(10000 / T.priceLevel(), "test");
  const expectTax = T.incomeTax(70000) - T.incomeTax(60000);
  ok("social income is taxed on top of your salary", Math.abs((10000 - net) - expectTax) <= 1, `${10000-net} vs ${expectTax}`);
  ok("not with a second tax-free allowance", 10000 - net > T.incomeTax(10000));
  ok("and adds to the year's income", Math.round(t.lastIncome) === 70000, t.lastIncome);
}

console.log("6. Promotion, collaboration, stunts, verification");
{
  const s = fresh(2024, 25); s.money = 100000;
  T.doJoinPlatform("instagram");
  const m0 = s.money; T.doPlatformPromote("instagram");
  ok("a promotion costs money", s.money === m0 - T.eraMoney(500));
  ok("and brings followers", T.accountOn("instagram").followers > 0);
  const f1 = T.accountOn("instagram").followers; T.doPlatformPromote("instagram");
  ok("once a year", T.accountOn("instagram").followers === f1);
  T.accountOn("instagram").followers = 600; T.syncFollowers();
  T.doPlatformCollab("instagram");
  ok("collaborations need 1,000 followers", T.accountOn("instagram").followers === 600);

  let banned = 0, grew = 0, n = 800;
  for(let i=0;i<n;i++){
    const st = fresh(2024, 25); T.doJoinPlatform("tiktok"); const a = T.accountOn("tiktok"); a.followers = 10000; T.syncFollowers();
    T.doPlatformStunt("tiktok");
    if(a.banned) banned++; else if(a.followers > 10000) grew++;
  }
  ok("stunts usually help", grew > n*0.6, grew);
  ok("and occasionally get you banned", banned > 5 && banned < n*0.1, banned);
  const bs = fresh(2024, 25); T.doJoinPlatform("tiktok"); const ba = T.accountOn("tiktok"); ba.banned = true; ba.bannedAge = 25; T.syncFollowers();
  ok("a banned account counts for nothing", bs.followers === 0);
  T.doJoinPlatform("tiktok");
  ok("and you can't rejoin straight away", T.accountOn("tiktok").banned === true);
  bs.age = 28; T.doJoinPlatform("tiktok");
  ok("but can after three years", T.accountOn("tiktok") && !T.accountOn("tiktok").banned);

  const v = fresh(2024, 25); T.doJoinPlatform("x");
  ok("X sells verification from 2023", T.canVerify(P("x"), T.accountOn("x")) && T.verificationCost(P("x")) > 0);
  T.doJoinPlatform("youtube");
  ok("YouTube makes you earn it", !T.canVerify(P("youtube"), T.accountOn("youtube")));
  T.accountOn("youtube").followers = 150000;
  ok("100,000 subscribers earns it", T.canVerify(P("youtube"), T.accountOn("youtube")));
  T.doPlatformVerify("youtube");
  ok("and it's free", T.accountOn("youtube").verified && v.money === 100000);
}

console.log("7. Consequences");
{
  // OnlyFans in a sensitive job.
  let raised = 0, n = 600;
  for(let i=0;i<n;i++){
    const s = fresh(2024, 30);
    s.career = { kind:"civilian", trackId:"teacher", rankIndex:2, yearsInRank:1, performance:60 };
    if(!T.TRACKS.find(t=>t.id==="teacher")) s.career.trackId = T.TRACKS.find(t=>t.category==="Academia" || t.category==="Public Sector").id;
    T.doJoinPlatform("onlyfans"); T.accountOn("onlyfans").followers = 50; T.syncFollowers();
    s.pendingChoice = null; s.choiceQueue = [];
    T.maybeSocialEvent();
    if(s.pendingChoice && /work/.test(s.pendingChoice.title)) raised++;
  }
  ok("an OnlyFans can come out at work", raised > n*0.05 && raised < n*0.2, raised);
  const s = fresh(2024, 30);
  s.career = { kind:"civilian", trackId:T.TRACKS.find(t=>t.category==="Public Sector").id, rankIndex:2, yearsInRank:1, performance:60 };
  T.doJoinPlatform("onlyfans"); const a = T.accountOn("onlyfans"); a.followers = 50; T.syncFollowers();
  let tries = 0; while(!a.exposed && tries++ < 400){ s.pendingChoice = null; T.maybeSocialEvent(); }
  ok("once it's out, it doesn't keep coming out", (()=>{ let again=0; for(let i=0;i<200;i++){ s.pendingChoice=null; T.maybeSocialEvent(); if(s.pendingChoice && /work/.test(s.pendingChoice.title)) again++; } return again===0; })());

  // LinkedIn helps job applications.
  const j = fresh(2024, 30);
  ok("no LinkedIn, no help", T.linkedinBoost() === 0);
  T.doJoinPlatform("linkedin"); T.accountOn("linkedin").followers = 2500;
  ok("a big network helps", T.linkedinBoost() > 0);
  T.accountOn("linkedin").followers = 99999;
  for(let i=0;i<5;i++){ j.yearlyActivityUses = {}; T.doPlatformPost("linkedin"); }
  ok("LinkedIn connections are capped at 30,000", T.accountOn("linkedin").followers <= 30000, T.accountOn("linkedin").followers);

  // Brand deals for a big following.
  let deals = 0;
  for(let i=0;i<500;i++){ const st=fresh(2024,30); T.doJoinPlatform("instagram"); T.accountOn("instagram").followers=200000; T.syncFollowers(); st.pendingChoice=null; T.maybeSocialEvent(); if(st.pendingChoice && /brand/i.test(st.pendingChoice.title)) deals++; }
  ok("big accounts get brand-deal offers", deals > 30, deals);
}

console.log("8. The screens");
{
  const s = fresh(2024, 25);
  T.doJoinPlatform("youtube"); T.accountOn("youtube").followers = 12000; T.syncFollowers();
  T.socialView = { platform: null };
  const h = T.renderSocialPanel();
  ok("your channels are listed", /data-soc="youtube"/.test(h) && /12,000 subscribers/.test(h));
  ok("monetisation is shown", /monetised/.test(h));
  T.doJoinPlatform("x"); T.accountOn("x").followers = 9000; T.syncFollowers();
  T.socialView = { platform: null };     // joining opens the platform's page; go back to the list
  const hx = T.renderSocialPanel();
  ok("X doesn't claim to pay an unverified account", /pays verified members only/.test(hx));
  ok("others can be joined", /data-socjoin="tiktok"/.test(h));
  ok("the posts left are shown", /Posts left this year/.test(h));
  T.socialView = { platform: "youtube" };
  const ph = T.renderSocialPanel();
  ok("a platform page shows its numbers", /Earned last year/.test(ph) && /Earned in total/.test(ph));
  ok("and its actions", ["post","promote","collab","stunt","verify","leave"].every(a=>ph.includes(`data-socact="${a}"`)));
  ok("idle warnings are shown", /A year without posting costs you/.test(ph));
  T.openActivitySheet(); T.activityView.tab = "social"; T.socialView = { platform: "youtube" };
  T.renderActivitySheetContent(document.body.children[document.body.children.length-1]);
  ok("the sheet titles itself with the platform", /<h2>YouTube<\/h2>/.test(html()));
  T.activityView.tab = "foryou"; T.renderActivitySheetContent(document.body.children[document.body.children.length-1]);
  ok("Mind & Body links to the new screen", /data-tab="social"/.test(html()));
  ok("and the old one-tap post button is gone", !/socialPostBtn/.test(html()));
  // Just for you notices a monetised account going quiet.
  T.accountOn("youtube").lastPostAge = s.age - 1;
  ok("Just for you nudges an idle earning account", T.justForYou("activities").some(x=>/Post on YouTube/.test(x.title)) || T.justForYou("activities").length === 3);
}

console.log("9. A thousand random years of social media");
{
  let errors = [], bad = [];
  for(let life=0; life<150; life++){
    const s = fresh(2006 + (life % 20), 16 + (life % 30));
    s.stats.looks = 20 + (life*7)%80; s.stats.smarts = 20 + (life*11)%80;
    for(let y=0;y<10;y++){
      s.yearlyActivityUses = {}; s.actionsUsed = 0;
      try {
        for(let k=0;k<8;k++){
          const p = T.SOCIAL_PLATFORMS[Math.floor(Math.random()*16)];
          const r = Math.random();
          if(!T.accountOn(p.id)) T.doJoinPlatform(p.id);
          else if(r < 0.6) T.doPlatformPost(p.id);
          else if(r < 0.7) T.doPlatformPromote(p.id);
          else if(r < 0.8) T.doPlatformCollab(p.id);
          else if(r < 0.88) T.doPlatformStunt(p.id);
          else if(r < 0.95) T.doPlatformVerify(p.id);
          else T.doLeavePlatform(p.id);
        }
        if(Math.random() < 0.2) s.followers = Math.round(s.followers * (Math.random() < 0.5 ? 0.7 : 1.3));
        s.pendingChoice = null; s.choiceQueue = [];
        T.runSocialYear();
        const c = s.pendingChoice; if(c){ s.pendingChoice = null; c.options[Math.floor(Math.random()*c.options.length)].effect(); }
      } catch(e){ errors.push(e.message); }
      s.age++; s.year++;
      const acc = T.socialAccounts();
      Object.entries(acc).forEach(([id,a])=>{ if(!Number.isFinite(a.followers) || a.followers < 0) bad.push(`${id} ${a.followers}`); });
      const sum = Object.values(acc).filter(a=>!a.banned).reduce((t,a)=>t+a.followers,0) + (s.socialOther||0);
      T.reconcileFollowers();
      const sum2 = Object.values(acc).filter(a=>!a.banned).reduce((t,a)=>t+a.followers,0) + (s.socialOther||0);
      if(Math.abs(sum2 - s.followers) > 1) bad.push(`total drift ${sum2} vs ${s.followers}`);
      if(!Number.isFinite(s.money)) bad.push("money NaN");
    }
  }
  ok("no errors", errors.length === 0, errors.slice(0,3).join(" | "));
  ok("no impossible numbers, and the total always adds up", bad.length === 0, bad.slice(0,4).join(" | "));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
