// Shared DOM/host stub for the test scripts.
const fs=require("fs");
class FakeEl{constructor(t){this.tagName=(t||"div").toUpperCase();this.children=[];this._html="";this.style={};this.dataset={};this._cls=new Set();this.listeners={};this.value="";this.textContent="";this.disabled=false;this.id="";}
 set innerHTML(v){this._html=String(v);}get innerHTML(){return this._html;}
 set className(v){this._cls=new Set(String(v).split(/\s+/).filter(Boolean));}get className(){return [...this._cls].join(" ");}
 get classList(){const s=this._cls;return{add:(...c)=>c.forEach(x=>s.add(x)),remove:(...c)=>c.forEach(x=>s.delete(x)),toggle:(c,f)=>{if(f===undefined){s.has(c)?s.delete(c):s.add(c);}else{f?s.add(c):s.delete(c);}},contains:c=>s.has(c)};}
 appendChild(c){this.children.push(c);return c;}
 remove(){const p=global.document.body;const i=p.children.indexOf(this);if(i>=0)p.children.splice(i,1);}
 addEventListener(t,f){(this.listeners[t]=this.listeners[t]||[]).push(f);}click(){(this.listeners.click||[]).forEach(f=>f({preventDefault(){},stopPropagation(){}}));}
 querySelector(){return new FakeEl();}querySelectorAll(){return [];}
 getBoundingClientRect(){return{top:0,left:0,width:320,height:40,bottom:40,right:320};}
 focus(){}blur(){}scrollIntoView(){}setAttribute(){}getAttribute(){return null;}}
const appEl=new FakeEl();appEl.id="app";const barEl=new FakeEl();barEl.id="actionbar";
const reg={app:appEl,actionbar:barEl};
global.FakeEl=FakeEl; global.reg=reg; global.appEl=appEl; global.barEl=barEl;
global.document={body:new FakeEl(),getElementById(i){return reg[i]||new FakeEl();},querySelectorAll(){return [];},createElement(t){return new FakeEl(t);},addEventListener(){}};
global.window={storage:{_m:{},async get(k){if(!(k in this._m))throw new Error("x");return{key:k,value:this._m[k]};},async set(k,v){this._m[k]=v;return{};},async delete(){return{};},async list(){return{keys:[]};}},addEventListener(){}};
global.navigator={vibrate(){}};
global.AudioContext=function(){return{createOscillator(){return{connect(){},start(){},stop(){},frequency:{value:0},type:""};},createGain(){return{connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}};},destination:{},currentTime:0};};
global.setTimeout=()=>0;global.clearTimeout=()=>{};global.requestAnimationFrame=f=>{f();return 0;};
module.exports = function load(exposeExtra){
  const code=[...fs.readFileSync(require("path").join(__dirname,"..","index.html"),"utf8").matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).pop();
  const base = `get appScreen(){return appScreen;}, set appScreen(v){appScreen=v;}, render, rollSetupDraft, startGame, ageUp,
    get state(){return state;}, set state(v){state=v;}, get meta(){return meta;},
    get savedLife(){return savedLife;}, set savedLife(v){savedLife=v;}, netWorth, usesLeft, money`;
  eval(code.replace(/\}\)\(\);?\s*$/, `\n globalThis.__t = { ${base}${exposeExtra?","+exposeExtra:""} };\n})();`));
  return globalThis.__t;
};
