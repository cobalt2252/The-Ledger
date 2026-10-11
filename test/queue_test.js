// Two decisions in one year must both be offered, and nothing paid by an
// option may be lost because another prompt arrived first.
const T = require("./harness.js")(`
  queueChoice, advanceChoiceQueue, ageFamilyAndFriends, makePerson,
  openHoneymoonChoice, openPrenupChoice`);
function life(){ T.state=null; T.appScreen="home"; T.rollSetupDraft();
  T.startGame("P","Girl","Straight",{scenarioId:"free"}); T.state.pendingChoice=null; T.state.choiceQueue=[]; return T.state; }
let pass=0, fail=0;
const ok=(l,c,x)=>{ if(c)pass++; else {console.log("  FAIL "+l+(x!==undefined?" — "+x:"")); fail++;} };

// A second queueChoice no longer destroys the first.
{
  const s=life();
  T.queueChoice({title:"First", text:"t", options:[{label:"a", effect:()=>{ s.money+=111; }}]});
  T.queueChoice({title:"Second", text:"t", options:[{label:"b", effect:()=>{ s.money+=222; }}]});
  ok("the first prompt is the one showing", s.pendingChoice.title==="First");
  ok("the second is held behind it", s.choiceQueue.length===1 && s.choiceQueue[0].title==="Second");
  const m0=s.money;
  s.pendingChoice.options[0].effect(); s.pendingChoice=null;
  T.advanceChoiceQueue();
  ok("the second is then offered", s.pendingChoice && s.pendingChoice.title==="Second");
  s.pendingChoice.options[0].effect(); s.pendingChoice=null;
  ok("both effects ran", s.money===m0+333, s.money-m0);
  ok("the queue empties", !T.advanceChoiceQueue() && s.choiceQueue.length===0);
}
// It doesn't grow without bound.
{
  const s=life();
  for(let i=0;i<40;i++) T.queueChoice({title:"X"+i, text:"t", options:[{label:"a", effect:()=>{}}]});
  ok("the queue is capped", s.choiceQueue.length<=6, s.choiceQueue.length);
}
// The real case: the estate prompt and the honeymoon prompt in the same year.
{
  let lost=0, both=0;
  for(let i=0;i<300;i++){
    const s=life(); s.age=60; s.money=0; s.wealthTier="rich"; s.siblingsToCome=[];
    if(!s.family.some(p=>p.relation==="Sibling")) s.family.push(T.makePerson("Sibling",undefined,62));
    s.family.filter(p=>p.relation==="Mother"||p.relation==="Father").forEach(p=>{ p.alive=true; p.age=200; });
    // Married last year with the honeymoon still to come, so both want the slot.
    s.married=true; s.marriedAtAge=59; s.flags.honeymooned=false;
    s.relationship={id:1,name:"Spouse",gender:"Boy",age:60,closeness:70,alive:true};
    s.pendingChoice=null; s.choiceQueue=[];
    for(let y=0;y<15 && s.family.some(p=>(p.relation==="Mother"||p.relation==="Father")&&p.alive);y++){
      T.ageFamilyAndFriends();
      // Resolve whatever is showing, then whatever was behind it.
      let guard=0;
      while(s.pendingChoice && guard++<8){
        const pc=s.pendingChoice; s.pendingChoice=null;
        const eq = pc.options.find(o=>/equally/i.test(o.label)) || pc.options[0];
        eq.effect();
        T.advanceChoiceQueue();
      }
      s.age++;
    }
    if(s.flags.parentsEstateSettled && s.money<=0) lost++;
    if(s.flags.parentsEstateSettled && s.flags.honeymooned) both++;
  }
  ok("the inheritance is never lost to a clashing prompt", lost===0, lost+"/300 lost");
  ok("both the estate and the honeymoon get resolved", both>200, both+"/300");
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
