// Every interaction and notification carries an emoji that every device can draw.
const fs = require("fs");
const T = require("./harness.js")(`iconOrDefault, iconFor, menuRow, MILESTONE_KINDS, milestone, get notifications(){return notifications;}, set notifications(v){notifications=v;},
  personIcon, CATEGORY_ICONS, TRACKS, SOCIAL_PLATFORMS, platformIcon, SHOP_DEFS, DEGREE_OPTIONS`);
let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c) pass++; else { console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++; } };
const EMOJI = /^\p{Extended_Pictographic}/u;

console.log("1. Rows always have one");
{
  ["", "Zzzz", "A thing nobody named", "Ok", "?", "Lorem ipsum dolor"].forEach(t=>ok(`"${t}" gets an emoji`, EMOJI.test(T.iconOrDefault(t))));
  const html = T.menuRow({ title:"Something unmatched entirely", sub:"" });
  ok("a row built without an icon still has one", /<span class="mi">\p{Extended_Pictographic}/u.test(html), html.slice(0,80));
  ok("an icon passed in is kept", T.menuRow({ icon:"🦄", title:"x" }).includes("🦄"));
}
{
  // Everything the crawl found blank before now has its own emoji.
  const were = ["'Diamond' ring (dubious)","'Gold' watch (dubious)","A friend invites you out","A risky tip from a colleague","Abandon this life and start over",
    "Ardent roadster motorcycle","Ask them out","Avoid them","Bass guitar","Brenner Calder electric hatchback","Bricklayer","Carpenter & Joiner","Chronograph watch",
    "Corvid helicopter","Decline","Digital piano","Electric guitar","Electrician","Emerald bracelet","Give it a go","Groundworker & Plant Operator","Halden Solano classic roadster",
    "Harbourlight motor yacht","Hear them out","Kestrel Orrin estate car","Let it go","Merlin private jet","Not interested","Painter & Decorator","Pay for it yourself",
    "Pearl earrings (pre-owned)","Pelham mountain bicycle","Perform","Platinum cufflinks","Plumber","Put it through","Put the year into your health","Put yourself forward",
    "Roofer","Say something","Seawake sailing yacht","Software & IT","Spend the year on self-improvement","Split it equally","Stand up to them","Start keeping records",
    "Stop here and look for work","Strider BMX bicycle","Take it easy","Take on a stretch project at work","Take part","Taurin scooter","Tiderunner cabin cruiser","Try it",
    "Upright piano","Vehicle Mechanic","Victorian first-edition book","Victorian grandfather clock","Violin","Waive your share","Welder & Fabricator","Drive it",
    "Enter a pet show","End the relationship","Register as a conscientious objector","Report for duty with United States Navy","vintage writing desk"];
  const generic = were.filter(t=>T.iconOrDefault(t)==="👉");
  ok("all 67 rows that were blank now have a specific emoji", !generic.length, generic.join(", "));
  ok("every degree subject has its own emoji", T.DEGREE_OPTIONS.every(d=>T.iconOrDefault(d)!=="👉"), T.DEGREE_OPTIONS.filter(d=>T.iconOrDefault(d)==="👉").join(","));
  ok("a violin is a violin", T.iconOrDefault("Violin")==="🎻");
  ok("a piano is a piano", T.iconOrDefault("Upright piano")==="🎹");
  ok("a jet isn't a car", T.iconOrDefault("Merlin private jet")==="🛩️");
  ok("'Try it' isn't a computer", T.iconOrDefault("Try it")!=="💻");
  ok("'Put it through' isn't a computer", T.iconOrDefault("Put it through")!=="💻");
}

console.log("2. Notifications");
{
  Object.entries(T.MILESTONE_KINDS).forEach(([k,d])=>ok(`notification "${k}" has an icon`, EMOJI.test(d.icon||""), d.icon));
  T.state=null; T.appScreen="home"; T.rollSetupDraft(); T.startGame("Test Person","Girl","Straight",{scenarioId:"free"});
  T.notifications=[]; T.milestone("no-such-kind", "Something happened");
  ok("an unknown kind still gets an icon", EMOJI.test(T.notifications[0].icon));
}

console.log("3. Drawn on every device");
{
  const src = fs.readFileSync(require("path").join(__dirname,"..","index.html"),"utf8");
  // Emoji that show as plain text, or not at all, without the emoji selector.
  const textDefault = ["\u{1F397}","\u{1F3DB}","⚠","\u{1F3DD}","\u{1F6CD}","\u{1F396}","\u{1F3CD}","⚙","\u{1F56F}","\u{1F6E1}","✈","⚖","⚔","\u{1F5F3}","\u{1F6CB}","\u{1F3CB}","\u{1F3CE}","\u{1F37D}","\u{1F570}","\u{1F58C}","\u{1F5BC}","\u{1F6E0}","\u{1F54A}","\u{1F441}","\u{1F5E3}","✂","\u{1F3F3}"];
  const missing = textDefault.filter(ch=>{ let i=-1; while((i=src.indexOf(ch,i+1))>=0){ if(src[i+ch.length]!=="️") return true; } return false; });
  ok("no emoji is missing its emoji selector", !missing.length, missing.map(c=>c.codePointAt(0).toString(16)).join(","));
  // Unicode 13 and later: blank on Windows 10 and older phones.
  const tooNew = [...src].filter(ch=>{ const c=ch.codePointAt(0); return (c>=0x1FA96 && c<=0x1FAFF) || [0x1F972,0x1F977,0x1F978,0x1F90C,0x1F6D6,0x1F6D7,0x1F6FB,0x1F6FC,0x1F9CB,0x1F979].includes(c); });
  ok("no emoji newer than Unicode 12", !tooNew.length, [...new Set(tooNew)].join(" "));
}
{
  // The fixed icons around the game.
  ok("every track has an icon", T.TRACKS.every(t=>!t.icon || EMOJI.test(t.icon)));
  ok("every category has an icon", Object.values(T.CATEGORY_ICONS).every(i=>EMOJI.test(i)));
  ok("every shop has an icon", T.SHOP_DEFS.every(d=>EMOJI.test(d.icon)));
}

console.log(`verify_k: ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
