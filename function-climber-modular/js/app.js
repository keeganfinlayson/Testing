
const E=(function engine(){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),mix=(a,b,u)=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});
 const p=(x,y)=>({x,y});
 const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 const simplify=(arr,tol=.065)=>{
   if(arr.length<3)return arr.slice();
   const a=arr[0],b=arr[arr.length-1],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
   let max=0,k=0;
   for(let i=1;i<arr.length-1;i++){const q=arr[i],t=l?clamp(((q.x-a.x)*dx+(q.y-a.y)*dy)/l,0,1):0,d=dist(q,p(a.x+t*dx,a.y+t*dy));if(d>max){max=d;k=i}}
   return max>tol?simplify(arr.slice(0,k+1),tol).slice(0,-1).concat(simplify(arr.slice(k),tol)):[a,b];
 };
 const presets={
 hill:{name:"Rolling hill",paths:[{pts:Array.from({length:81},(_,i)=>p(-9+i*.225,2*Math.sin((i*.225-3)*.48)))}]},
 wall:{name:"The wall",paths:[{pts:[p(-9,-2),p(-4,-2),p(-2,4),p(4,4),p(9,1)]}]},
 slide:{name:"Runaway descent",paths:[{pts:[p(-9,4),p(-5,4),p(-2,-2),p(2,-4),p(9,-4)]}]},
 gap:{name:"Jumpable break",paths:[{pts:[p(-9,-1),p(-3,-1)]},{pts:[p(-.8,-.2),p(3,-.2),p(9,1)]}]},
 miss:{name:"Unreachable break",paths:[{pts:[p(-9,0),p(-4,0)]},{pts:[p(2,1),p(9,1)]}]},
 asym:{name:"Vertical asymptote",asymptotes:[0],paths:[{end:"asymptote",pts:Array.from({length:97},(_,i)=>{const x=-9+i*8.92/96;return p(x,1/x-1)})},{pts:Array.from({length:97},(_,i)=>{const x=.08+i*8.92/96;return p(x,1/x-1)})}]},
 corner:{name:"Corner collision",paths:[{pts:[p(-9,4),p(-2,-4),p(0,3),p(8,3)]}]},
 points:{name:"Stepping stones",paths:[{pts:[p(-8,-2)]},{pts:[p(-5.7,0)]},{pts:[p(-3.2,-1)]},{pts:[p(-.8,.7)]},{pts:[p(1.7,0)]},{pts:[p(4.2,1.5)]},{pts:[p(6.7,.2)]}]},
 stairs:{name:"Staircase",paths:[{pts:[p(-9,-4),p(-5,-4)]},{pts:[p(-5,-2),p(-1,-2)]},{pts:[p(-1,0),p(3,0)]},{pts:[p(3,2),p(8,2)]}]},
 vertical:{name:"Vertical climb",paths:[{pts:[p(-8,-3),p(-2,-3),p(-2,3),p(8,3)]}]}
 };
 function plan(paths,view={left:-10.5,bottom:-8,top:8}){
 const items=paths.filter(s=>s.pts.length).map(s=>({...s,pts:s.pts.slice()})).map(s=>{if(s.pts[0].x>s.pts.at(-1).x+.01){s.pts.reverse();[s.start,s.end]=[s.end,s.start]}return s}).sort((a,b)=>a.pts[0].x-b.pts[0].x||a.pts[0].y-b.pts[0].y);
 const clips=[];let time=0,failed=false,fatigue=0,mishaps=0;
 const add=(type,a,b,d,extra={})=>{d=Math.max(.035,d);clips.push({type,a,b,t:time,d,fatigue,mishaps,...extra});time+=d};
 const hold=(type,a,d,extra)=>add(type,a,a,d,extra);
 const fail=(a,reason,dx=1)=>{hold("realize",a,.24);add("fall",a,p(a.x+dx,a.y-12),1.35,{reason});failed=true};
 if(!items.length)return {clips,time,failed};
 const first=items[0].pts[0];const entry=p(Math.min(view.left-3,first.x-3),first.y);add("run",entry,first,dist(entry,first)/3.05,{ang:0});
 for(let j=0;j<items.length;j++){
  const s=items[j],pts=s.pts.filter((q,i,a)=>i===0||dist(q,a[i-1])>1e-5),last=pts.at(-1),next=items[j+1];
  if(pts.length===1){hold("wobble",pts[0],.75+Math.min(.28,mishaps*.07));}
  else {
   const lengths=[0];for(let i=1;i<pts.length;i++)lengths.push(lengths.at(-1)+dist(pts[i-1],pts[i]));
   const total=lengths.at(-1);
   const at=d=>{d=clamp(d,0,total);let lo=0,hi=lengths.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(lengths[m]<=d)lo=m;else hi=m}return mix(pts[lo],pts[hi],(d-lengths[lo])/(lengths[hi]-lengths[lo]||1))};
   // Measure sustained terrain over a 1.35-unit neighborhood, not individual drawing samples.
   const raw=[];for(let i=1;i<pts.length;i++){const mid=(lengths[i-1]+lengths[i])/2,lo=Math.max(0,mid-.675),hi=Math.min(total,mid+.675),a=at(lo),b=at(hi),grade=(b.y-a.y)/(hi-lo||1);raw.push(grade>.94?"climb":grade>.66?"struggle":grade<-.86?"slide":grade<-.66?"downhill":"run")}
   // Remove brief changes of acting state. Preserve sustained hills and genuine vertical walls.
   for(let i=0;i<raw.length;){let k=i+1;while(k<raw.length&&raw[k]===raw[i])k++;const span=lengths[k]-lengths[i];if(raw[i]!=="run"&&span<.85)for(let z=i;z<k;z++)raw[z]="run";i=k}
   let lastImpact=-10,lastAct="run",lastTransitionAt=-10;
   for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i],len=dist(a,b),ang=angle(a,b),type=raw[i-1];if(len<1e-5)continue;
    if(i>1&&lengths[i-1]-lastImpact>2.4){
     const d=lengths[i-1],pre=at(d-.85),post=at(d+.85),g1=(a.y-pre.y)/Math.min(.85,d),g2=(post.y-a.y)/Math.min(.85,total-d);
     if(d>.65&&total-d>.65&&g1<-.65&&g2>.70&&Math.abs(wrap(angle(a,post)-angle(pre,a)))>1.5){hold("splat",a,.32,{ang:angle(a,post)});mishaps++;hold("peel",a,.62,{ang:angle(a,post)});lastImpact=d}
    }
    // Direct a few recognizable, sustained acting beats rather than reacting to each drawn point.
    if(type!==lastAct){
      const position=lengths[i-1];
      if(position-lastTransitionAt>1.25){
        if((lastAct==="struggle"||lastAct==="climb")&&(type==="run"||type==="downhill")){
          hold("crest",a,.27);lastTransitionAt=position;
        }else if(type==="slide"&&lastAct!=="slide"){
          hold("brace",a,.22);lastTransitionAt=position;
        }else if(lastAct==="slide"&&type!=="slide"){
          hold("recover",a,.36);lastTransitionAt=position;
        }
      }
      lastAct=type;
    }
    if(type==="struggle"||type==="climb")fatigue=Math.min(1,fatigue+len*.12);
    const speed={run:3.05,struggle:2.98,climb:2.88,downhill:3.15,slide:3.27}[type];
    const approaching=!!next&&dist(last,next.pts[0])>.1;
    const remaining=total-lengths[i-1];
    add(type,a,b,len/speed,{ang,approaching,remaining,len});
   }
  }
  if(s.end==="asymptote"){hold("slip",last,.22);if(!next){fail(last,"Asymptote: no landing",.28);break}const target=next.pts[0];const exit=p(last.x,Math.min(view.bottom-5,last.y-3));const entry=p(target.x,Math.max(view.top+5,target.y+3));add("fall",last,exit,.95);add("fall",entry,target,1.05);hold("faceplant",target,.48);hold("getup",target,.72);mishaps++;continue}
  if(!next){hold(fatigue>.5||mishaps>0?"relief":"celebrate",last,1.05);break}
  const b=next.pts[0],dx=b.x-last.x,dy=b.y-last.y,gap=dist(last,b);
  if(gap<.10)continue;
  if(dx<-.15){hold("look",last,.4);fail(last,"Next path starts behind the runner",.15);break}
  hold("prepare",last,.22+Math.min(.12,mishaps*.04));
  const reachable=dx<=3.55&&dy<=2.4&&dy>=-4.5&&gap<=4.25;
  if(reachable){add("jump",last,b,clamp(.55+gap*.22,.65,1.4),{arc:Math.max(.85,1+gap*.22)});hold("land",b,.24)}
  else{const end=p(last.x+Math.min(2.65,Math.max(.55,dx*.52)),last.y-.95);add("miss",last,end,.8,{arc:1.35});fail(end,"Gap is out of reach",.85);break}
 }
 // Group adjacent locomotion clips into acting beats, preserving the exact graph geometry.
 for(let i=0;i<clips.length;){let j=i+1;while(j<clips.length&&clips[j].type===clips[i].type)j++;const start=clips[i].t,end=clips[j-1].t+clips[j-1].d;for(let k=i;k<j;k++){clips[k].beatStart=start;clips[k].beatEnd=end;clips[k].index=k;clips[k].previousBeat=i?clips[i-1].type:null}i=j}
 return {clips,time,failed};
 }
 function sample(script,t){
   if(!script.clips.length)return null;
   const c=script.clips.find(c=>t<c.t+c.d)||script.clips[script.clips.length-1],u=clamp((t-c.t)/c.d,0,1);
   let q=mix(c.a,c.b,c.type==="fall"?u*u:u);
   if(c.arc)q.y+=4*c.arc*u*(1-u);
   const anticipation=c.approaching?clamp((1.6-(c.remaining-c.len*u))/1.2,0,1):0;
   return {...q,type:c.type,u,ang:c.ang||0,reason:c.reason||"",t,clip:c,anticipation,prev:script.clips[(c.index??0)-1],next:script.clips[(c.index??0)+1]};
 }
 return {p,dist,clamp,mix,simplify,presets,plan,sample};
})();const {p,dist,clamp,mix,simplify,presets,plan,sample}=E;
const $=id=>document.getElementById(id),canvas=$("canvas"),ctx=canvas.getContext("2d");
let paths=[],asymptotes=[],history=[],tool="draw",mode="edit",drag=null,script=null,elapsed=0,playing=false,W=1000,H=600,S=45,cam=p(0,0),lastTime=0,phase=0;
const labels={faceplant:"Face-first landing!",getup:"Getting back up",ready:"Ready",run:"Running",struggle:"Uphill struggle",downhill:"Downhill run",slide:"Sliding",climb:"Climbing",crest:"Cresting the hill",brace:"Bracing for descent",recover:"Regaining balance",prepare:"Preparing to jump",jump:"Jumping",miss:"Missed jump",land:"Landing",wobble:"Balancing",splat:"Splat!",peel:"Recovering",slip:"Losing grip",fall:"Falling",celebrate:"Made it!",look:"Looking for the path",realize:"Uh-oh!",relief:"Made it… whew!"};
const clone=v=>JSON.parse(JSON.stringify(v));const hints={draw:"Drag to draw a curve. Leave empty space to create a break.",segment:"Drag from one endpoint to another to create a straight segment.",point:"Click to place an isolated point.",move:"Drag a point or an entire connected stroke.",erase:"Drag across the graph to erase parts of the path."};
function snapshot(){history.push(clone({paths,asymptotes}));if(history.length>60)history.shift();$("undo").disabled=false}
function undo(){if(!history.length)return;const a=history.pop();paths=a.paths;asymptotes=a.asymptotes;$("undo").disabled=!history.length;render()}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;S=Math.min(W/21,H/12.5);canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);render()}
const screen=q=>p(W/2+(q.x-cam.x)*S,H/2-(q.y-cam.y)*S);
function world(e,snap=true){const r=canvas.getBoundingClientRect();let x=(e.clientX-r.left-W/2)/S+cam.x,y=(H/2-(e.clientY-r.top))/S+cam.y;if(snap&&$("snap").checked){x=Math.round(x);y=Math.round(y)}return p(x,y)}
function near(q,a,b){const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,t=n?clamp(((q.x-a.x)*dx+(q.y-a.y)*dy)/n,0,1):0;return dist(q,p(a.x+t*dx,a.y+t*dy))}
function closest(q){let best=null,d=.42;paths.forEach((s,i)=>{if(s.pts.length===1){const dd=dist(q,s.pts[0]);if(dd<d){d=dd;best=i}}else for(let k=1;k<s.pts.length;k++){const dd=near(q,s.pts[k-1],s.pts[k]);if(dd<d){d=dd;best=i}}});return best}
function erase(q){const r=.27,output=[];for(const s of paths){if(s.pts.length===1){if(dist(s.pts[0],q)>r)output.push(s);continue}
 let group=[];const flush=()=>{if(group.length>1)output.push({pts:group});group=[]};
 for(let k=1;k<s.pts.length;k++){const a=s.pts[k-1],b=s.pts[k],n=Math.max(1,Math.ceil(dist(a,b)/.095));for(let i=k===1?0:1;i<=n;i++){const v=mix(a,b,i/n);if(dist(v,q)<=r)flush();else group.push(v)}}flush();
 }paths=output;asymptotes=[]}
function endpointJoin(pts){if(pts.length<2)return;let s=pts.slice(),changed=true;while(changed){changed=false;for(let i=0;i<paths.length;i++){const a=paths[i].pts;if(a.length<2)continue;const combos=[[s[0],a[a.length-1],()=>a.concat(s.slice(1))],[s[0],a[0],()=>a.slice().reverse().concat(s.slice(1))],[s[s.length-1],a[0],()=>s.concat(a.slice(1))],[s[s.length-1],a[a.length-1],()=>s.concat(a.slice().reverse().slice(1))]];const match=combos.find(c=>dist(c[0],c[1])<.18);if(match){s=match[2]();paths.splice(i,1);changed=true;break}}}paths.push({pts:simplify(s)})}
function pointerDown(e){if(mode!=="edit"||e.button!==0)return;canvas.setPointerCapture(e.pointerId);const q=world(e);if(tool==="move"){const i=closest(world(e,false));if(i===null)return;snapshot();drag={tool,i,start:q,original:clone(paths[i].pts)};asymptotes=[];delete paths[i].end;return}snapshot();drag={tool,start:q,pts:[q],last:q};if(tool==="point"){paths.push({pts:[q]});drag=null}else if(tool==="erase"){erase(world(e,false));drag.last=world(e,false)}render()}
function pointerMove(e){if(!drag||mode!=="edit")return;const q=world(e);if(drag.tool==="move"){const d=p(q.x-drag.start.x,q.y-drag.start.y);paths[drag.i].pts=drag.original.map(a=>p(a.x+d.x,a.y+d.y))}else if(drag.tool==="draw"){if(dist(q,drag.pts[drag.pts.length-1])>.045)drag.pts.push(q)}else if(drag.tool==="segment"){drag.pts=[drag.start,q]}else if(drag.tool==="erase"){const b=world(e,false),a=drag.last,n=Math.max(1,Math.ceil(dist(a,b)/.18));for(let i=1;i<=n;i++)erase(mix(a,b,i/n));drag.last=b}render()}
function pointerUp(e){if(!drag)return;if(e.type==="pointerup")pointerMove(e);if(drag.tool==="draw"||drag.tool==="segment"){const pts=drag.pts;if(pts.length>1&&dist(pts[0],pts[pts.length-1])>.015)endpointJoin(pts);else if(pts.length>2)endpointJoin(pts);else paths.push({pts:[pts[0]]})}drag=null;render()}
canvas.addEventListener("pointerdown",pointerDown);canvas.addEventListener("pointermove",pointerMove);canvas.addEventListener("pointerup",pointerUp);canvas.addEventListener("pointercancel",pointerUp);
function choose(t){tool=t;document.querySelectorAll("[data-tool]").forEach(b=>b.classList.toggle("active",b.dataset.tool===t));$("hint").textContent=hints[t]}
document.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>choose(b.dataset.tool));$("undo").onclick=undo;$("clear").onclick=()=>{snapshot();paths=[];asymptotes=[];$("preset").value="";render()};
Object.entries(presets).forEach(([key,s])=>{const o=document.createElement("option");o.value=key;o.textContent=s.name;$("preset").append(o)});
function loadPreset(key){if(!presets[key])return;edit();snapshot();paths=clone(presets[key].paths);asymptotes=clone(presets[key].asymptotes||[]);render()}
$("preset").onchange=()=>loadPreset($("preset").value);
function ui(){const play=mode==="play";document.querySelectorAll("[data-tool]").forEach(b=>b.disabled=play);$("undo").disabled=play||!history.length;$("clear").disabled=play;$("run").disabled=play;$("edit").disabled=!play;$("pause").disabled=!play;$("replay").disabled=!play;$("timeline").classList.toggle("show",play);$("seek").disabled=!play;$("snap").disabled=play;$("chips").hidden=!play||!$("beats").checked;canvas.style.cursor=play?"default":"crosshair"}
function edit(){playing=false;mode="edit";drag=null;script=null;$("seek").value=0;$("clock").textContent="";$("chips").replaceChildren();$("hint").textContent=hints[tool];ui();render()}
function start(){if(!paths.length){$("hint").textContent="Draw a path or select an example first.";return}script=plan(paths,{left:cam.x-W/(2*S),bottom:cam.y-H/(2*S),top:cam.y+H/(2*S)});if(!script.clips.length)return;mode="play";elapsed=0;playing=true;$("pause").textContent="Pause";$("hint").textContent="";ui();buildChips();render()}
$("run").onclick=start;$("edit").onclick=edit;$("replay").onclick=start;$("pause").onclick=()=>{if(elapsed>=script.time)elapsed=0;playing=!playing;$("pause").textContent=playing?"Pause":"Play"};$("seek").oninput=()=>{if(!script)return;elapsed=script.time*(+$("seek").value/1000);playing=false;$("pause").textContent="Play";render()};$("grid").onchange=render;$("beats").onchange=()=>{$("chips").hidden=!($("beats").checked&&mode==="play")};
function buildChips(){const el=$("chips");el.replaceChildren();let prior=null;script.clips.forEach(c=>{if(c.type!==prior){const span=document.createElement("span");span.className="chip";span.textContent=labels[c.type];span.dataset.start=c.t;el.append(span);prior=c.type}})}
function line(a,b,color,width=1){const A=screen(a),B=screen(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke()}
function background(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#f9fcff");g.addColorStop(1,"#edf5f8");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(!$("grid").checked)return;const l=cam.x-W/(2*S),r=cam.x+W/(2*S),b=cam.y-H/(2*S),t=cam.y+H/(2*S);ctx.font="11px system-ui";ctx.fillStyle="#536e82";for(let x=Math.ceil(l);x<=r;x++){line(p(x,b),p(x,t),x===0?"#657c91":"#819bb52d",x===0?1.8:1);if(x%2===0){const a=screen(p(x,0));ctx.fillText(x,a.x+3,clamp(a.y+14,13,H-5))}}for(let y=Math.ceil(b);y<=t;y++){line(p(l,y),p(r,y),y===0?"#657c91":"#819bb52d",y===0?1.8:1);if(y!==0&&y%2===0){const a=screen(p(0,y));ctx.fillText(y,clamp(a.x+5,4,W-22),a.y-3)}}}
function graph(){ctx.lineCap="round";ctx.lineJoin="round";for(const x of asymptotes){ctx.setLineDash([6,6]);line(p(x,cam.y-H/S),p(x,cam.y+H/S),"#758c9c",1.5);ctx.setLineDash([])}const all=paths.concat(drag&&["draw","segment"].includes(drag.tool)?[{pts:drag.pts}]:[]);for(const s of all){if(!s.pts.length)continue;const a=screen(s.pts[0]);if(s.pts.length===1){ctx.beginPath();ctx.arc(a.x,a.y,6,0,Math.PI*2);ctx.fillStyle="#653fa5";ctx.fill();ctx.strokeStyle="white";ctx.lineWidth=1.5;ctx.stroke()}else{ctx.beginPath();ctx.moveTo(a.x,a.y);for(const q of s.pts.slice(1)){const b=screen(q);ctx.lineTo(b.x,b.y)}ctx.strokeStyle="#ffffffcc";ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle="#6945b5";ctx.lineWidth=3.5;ctx.stroke()}}}
function limb(a,b,w,color){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}
function ellipse(x,y,rx,ry,c,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore()}
function inkPath(points,color="#493c38",width=1.4){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();points.forEach((a,i)=>i?ctx.lineTo(a[0],a[1]):ctx.moveTo(a[0],a[1]));ctx.stroke()}
function pose(q,type){const u=q.u,t=q.t,falling=type==="fall"||type==="miss"||type==="realize",sliding=type==="slide",effort=type==="struggle"||type==="climb"||type==="splat";
 const run=["run","struggle","downhill","climb"].includes(type),a=Math.sin(t*13),b=Math.cos(t*13),jump=type==="jump"||type==="miss",wobble=type==="wobble";
 const crouch=type==="prepare"?Math.sin(u*Math.PI/2):type==="land"?Math.sin(Math.PI*Math.pow(u,.65)):type==="relief"?.45+.15*Math.sin(t*7):0;
 let lean=type==="climb"?.32:type==="struggle"?.18:type==="downhill"?-.14:sliding?-.52:type==="brace"?-.38:type==="recover"?-.24*(1-u):type==="crest"?-.08:wobble?Math.sin(u*5*Math.PI)*.31*(1-u):falling?Math.sin(t*6)*.25:0;

 const hip=[0,-38+13*crouch],shoulder=[0,-83+15*crouch],head=[4,-112+15*crouch];
 if(type==="crest"){const lift=Math.sin(Math.PI*u);hip[1]-=3*lift;shoulder[1]-=9*lift;head[1]-=12*lift}
 if(type==="brace"){hip[1]+=8;shoulder[0]-=7;head[0]-=7}
 if(type==="recover"){hip[0]=-4+4*u;shoulder[0]-=12*(1-u);head[0]-=9*(1-u);hip[1]+=8*(1-u)}
 if(sliding){hip[0]=-8;hip[1]=-22;shoulder[0]=-12;shoulder[1]=-66;head[0]=-11;head[1]=-94}
 const stride=run?a*(type==="climb"?13:type==="struggle"?21:23):0;
 let f1=[-7-stride,run?-Math.max(0,a)*13:0],f2=[7+stride,run?-Math.max(0,-a)*13:0],k1=[-13-stride*.5,-20],k2=[13+stride*.5,-20];
 if(jump||falling){const tuck=jump?Math.sin(Math.PI*u):.5+.5*Math.sin(t*18);f1=[-12-9*tuck,-3-18*tuck];f2=[12+14*tuck,-3-15*tuck];k1=[-18,-20-8*tuck];k2=[19,-23-9*tuck]}
 if(sliding){f1=[21,-1];f2=[40,0];k1=[10,-10];k2=[26,-10]}
 if(type==="climb"){f1=[-7,0];f2=[13,-15-10*a];k1=[-12,-20];k2=[22,-26]}
 if(wobble){f1=[0,0];f2=[13,-8-5*Math.sin(u*Math.PI)]}
 const arm=run?b*14:0;let e1=[-19,-60+arm],h1=[-12-arm,-49+arm],e2=[18,-62-arm],h2=[23+arm,-50-arm];
 if(type==="climb"){e1=[20,-85];h1=[32,-100-8*a];e2=[25,-61];h2=[40,-77+8*a]}
 if(jump||falling||type==="celebrate"){const wave=falling?Math.sin(t*20)*13:0;e1=[-22,-94+wave];h1=[-33,-112+wave];e2=[23,-94-wave];h2=[33,-112-wave]}
 if(wobble||type==="slip"){const swing=wobble?Math.sin(u*5*Math.PI)*(1-u)*19:12*a;e1=[-27,-77+swing*.4];h1=[-43,-84-swing];e2=[29,-77-swing*.4];h2=[44,-84+swing]}
 if(sliding){e1=[-33,-51];h1=[-39,-33];e2=[19,-44];h2=[26,-30]}
 if(type==="crest"){e1=[-16,-64];h1=[-14,-48];e2=[20,-67];h2=[27,-56]}
 if(type==="brace"){e1=[-29,-80];h1=[-46,-90];e2=[25,-72];h2=[41,-57]}
 if(type==="recover"){const panic=1-u;e1=[-23,-70-13*panic];h1=[-38,-67-25*panic];e2=[22,-70+7*panic];h2=[38,-61+20*panic]}
 if(q.anticipation&&run){const w=q.anticipation*q.anticipation;e2=e2.map((x,i)=>x+([25,-84][i]-x)*w);h2=h2.map((x,i)=>x+([42,-91][i]-x)*w)}if(type==="relief"){e1=[-18,-40];h1=[-12,-26];e2=[18,-40];h2=[12,-26]}if(type==="splat"||type==="peel"){e1=[-19,-93];h1=[-18,-115];e2=[22,-90];h2=[31,-113]}
 return {hip,shoulder,head,f1,f2,k1,k2,e1,e2,h1,h2,lean};
}
const runAtlas=new Image();runAtlas.src="assets/character/run-atlas.png";runAtlas.onload=()=>render();
const movementAtlas=new Image(),movementFrames=[];movementAtlas.onload=()=>{for(let i=0;i<16;i++){const x=Math.round(i%4*movementAtlas.width/4),y=Math.round(Math.floor(i/4)*movementAtlas.height/4),w=Math.round((i%4+1)*movementAtlas.width/4)-x,h=Math.round((Math.floor(i/4)+1)*movementAtlas.height/4)-y;const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");g.drawImage(movementAtlas,x,y,w,h,0,0,w,h);const d=g.getImageData(0,0,w,h).data;let l=w,r=0,t=h,b=0;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(d[(yy*w+xx)*4+3]>150){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,yy);b=Math.max(b,yy)}if(r>l&&b>t)movementFrames[i]={c,l,t,w:r-l+1,h:b-t+1}}render()};movementAtlas.src="assets/character/movement-atlas.png";
function illustratedMovement(q,v){const t=q.t,u=clamp(q.u,0,1),type=q.type;let i=-1;if(type==="struggle")i=Math.floor(t*10)%4;else if(type==="downhill")i=4+Math.floor(t*10)%4;else if(type==="ready")i=8;else if(type==="prepare")i=8+Math.min(3,Math.floor(u*4));else if(type==="jump"||type==="miss")i=12+Math.min(2,Math.floor(u*3));else if(type==="land")i=[14,15,15,9,8][Math.min(4,Math.floor(u*5))];const f=movementFrames[i];if(!f)return false;const k=1.85*clamp(S/76,.30,.65),height=([9,10,13,15].includes(i)?100:132)*k,scale=height/f.h;ctx.drawImage(f.c,f.l,f.t,f.w,f.h,v.x-f.w*scale/2,v.y-height,f.w*scale,height);return true}
function runner(q){const v=screen(q),type=q.type,u=q.u,t=q.t;if(illustratedMovement(q,v))return;if(type==="run"&&runAtlas.complete&&runAtlas.naturalWidth){const i=Math.floor(t*12)%8,w=112,h=140,k=1.85*clamp(S/76,.30,.65),lift=(i%4===3?5:0)*k;ctx.drawImage(runAtlas,(i%4)*w,Math.floor(i/4)*h,w,h,v.x-w*k/2,v.y-136*k-lift,w*k,h*k);return}const falling=["fall","miss","realize"].includes(type),sliding=type==="slide",effort=["struggle","climb","splat"].includes(type);
 const locomotion=new Set(["run","struggle","downhill","climb","slide"]),P=pose(q,type),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
 // Blend acting beats, not every tiny segment. Impact holds intentionally retain their snap.
 const blend=(A,w)=>{for(const k of Object.keys(P))P[k]=Array.isArray(P[k])?P[k].map((x,i)=>A[k][i]+(x-A[k][i])*w):A[k]+(P[k]-A[k])*w};
 const blendable=type!=="splat"&&type!=="realize"&&type!=="fall";
 const previous=q.clip.previousBeat;
 if(previous&&blendable){const duration=Math.min(.20,(q.clip.beatEnd-q.clip.beatStart)*.55);const w=smooth((t-q.clip.beatStart)/duration);if(w<1)blend(pose({...q,u:1,anticipation:0},previous),w)}
 const {hip,shoulder,head,f1,f2,k1,k2,e1,e2,h1,h2,lean}=P;
 // Plant the support foot at the graph contact point; slope is conveyed by body acting.
 const size=1.85*clamp(S/76,.30,.65),rot=type==="faceplant"?Math.PI/2:type==="getup"?Math.PI/2*(1-u):type==="fall"?u*Math.PI*1.75:type==="splat"?-Math.abs(q.ang)*.55:type==="peel"?-Math.abs(q.ang)*.55*(1-u):lean;
 const sx=type==="splat"?.63:type==="peel"?.63+.37*u:type==="brace"?1.09:type==="recover"?1.09-.09*u:1,sy=type==="splat"?1.04:1;
 const ground=locomotion.has(type)||["faceplant","getup","ready","prepare","land","wobble","relief","celebrate","look","slip","crest","brace","recover"].includes(type);
 // Soft transfer between support feet prevents sudden sideways snapping.
 const support=type==="wobble"?1:clamp(.5+(f1[1]-f2[1])/8,0,1);
 const foot=[f1[0]*support+f2[0]*(1-support),Math.max(f1[1],f2[1])],fx=(foot[0]+6)*sx,fy=(foot[1]+3)*sy;
 ctx.save();ctx.translate(v.x,v.y);ctx.scale(size,size);if(ground)ctx.translate(-(fx*Math.cos(rot)-fy*Math.sin(rot)),-(fx*Math.sin(rot)+fy*Math.cos(rot)));if(type==="faceplant"||type==="getup"){const w=type==="faceplant"?1:1-u;ctx.translate(-65*size*w,-23*size*w)}ctx.rotate(rot);ctx.scale(sx,sy);
 function leg(k,f){limb(hip,k,16,"#dcb084");limb(k,f,12,"#e7b88b");limb([f[0],f[1]-8],[f[0],f[1]-2],10,"#f7f2e6");ellipse(f[0]+6,f[1]-2,12,5,"#555e6a");inkPath([[f[0]-4,f[1]+1],[f[0]+17,f[1]+1]],"#303b45",1.4)}
 function armDraw(e,h,x){limb([shoulder[0]+x,shoulder[1]],e,13,"#dba97e");limb(e,h,10,"#e6b88b");ellipse(h[0],h[1],6,6,"#e4ad80")}
 leg(k1,f1);armDraw(e1,h1,-10);ellipse(hip[0],hip[1]+2,19,14,"#cba978");leg(k2,f2);ctx.fillStyle="#344967";ctx.strokeStyle="#253b54";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(shoulder[0]-17,shoulder[1]-6);ctx.quadraticCurveTo(shoulder[0],shoulder[1]-15,shoulder[0]+17,shoulder[1]-5);ctx.lineTo(hip[0]+19,hip[1]+4);ctx.lineTo(hip[0]-19,hip[1]+4);ctx.closePath();ctx.fill();ctx.stroke();armDraw(e2,h2,10);
 // Neck and face in watercolor-inspired layered colors
 ellipse(head[0],head[1]+14,8,11,'#ce9870');
 ellipse(head[0]-1,head[1],19,24,'#e4ae81',-.06);
 ellipse(head[0]+2,head[1]+1,16,21,'#e9b98d',-.05);
 // Salt-and-pepper full beard: irregular silhouette, gray chin and darker moustache
 ctx.fillStyle='#625951';ctx.strokeStyle='#3c3937';ctx.lineWidth=1.2;ctx.beginPath();
 ctx.moveTo(head[0]-12,head[1]+3);ctx.quadraticCurveTo(head[0]-19,head[1]+21,head[0]-6,head[1]+28);
 ctx.quadraticCurveTo(head[0]+9,head[1]+35,head[0]+20,head[1]+19);
 ctx.quadraticCurveTo(head[0]+23,head[1]+12,head[0]+13,head[1]+9);
 ctx.quadraticCurveTo(head[0]+4,head[1]+17,head[0]-12,head[1]+3);ctx.fill();ctx.stroke();
 ellipse(head[0]+7,head[1]+24,12,6,'#a09a8f',.15);
 ellipse(head[0]+14,head[1]+17,8,4,'#89857d',.3);
 // Receding hairline, textured wisps
 ctx.fillStyle='#4b3a32';ctx.beginPath();ctx.ellipse(head[0]-6,head[1]-19,14,6,-.22,Math.PI,Math.PI*2);ctx.fill();
 for(let i=0;i<9;i++){let xx=head[0]-18+i*3;inkPath([[xx,head[1]-18-(i%3)*2],[xx+3,head[1]-22-(i%4)*2]],i%3?'#59483b':'#756253',1.25)}
 ellipse(head[0]-17,head[1]+1,5,8,'#d89c75');ellipse(head[0]-17,head[1]+1,2.2,4,'#a66e54');
 // Distinctive broad nose in profile and lively brown eye
 ellipse(head[0]+17,head[1]+1,8,5.5,'#e4aa7c',-.1);
 ellipse(head[0]+11,head[1]-7,4,3,'#fff6e9');ellipse(head[0]+12.5,head[1]-6.5,2,2.2,'#3d332e');
 inkPath([[head[0]+6,head[1]-13],[head[0]+15,head[1]-12]],'#5b4539',2);
 inkPath([[head[0]+8,head[1]-1],[head[0]+11,head[1]+1]],'#b37b58',.9);
 // Smile / strain / surprise, anchored inside beard
 if(falling){ellipse(head[0]+17,head[1]+12,5.5,8,'#442f2b');ellipse(head[0]+17,head[1]+15,2,2,'#b86f69')}
 else if(effort||sliding){inkPath([[head[0]+12,head[1]+11],[head[0]+21,head[1]+12]],'#382e2c',2);inkPath([[head[0]+13,head[1]+13],[head[0]+20,head[1]+14]],'#f8eee1',1.6)}
 else{ellipse(head[0]+16,head[1]+12,8,4,'#3e3030',-.2);ellipse(head[0]+16,head[1]+10.7,6,1.8,'#f7f0e5',-.2)}
 // Beard strands and ink hatching
 for(let i=0;i<10;i++){let a=i*.62;let bx=head[0]-9+i*3.0,by=head[1]+19+Math.sin(a)*5;inkPath([[bx,by],[bx+1,by+3]],i%2?'#b5aaa0':'#423e3b',.65)}
 if(effort||q.clip.fatigue>.6){ctx.fillStyle="#58a9c9";for(let i=0;i<3;i++){let z=(t*2+i/3)%1;ellipse(head[0]-22-z*18,head[1]-11-z*9,2.5,4,"#58a9c9",-.5)}}
 if(q.anticipation>.65||type==="realize"){inkPath([[28,-143],[34,-157]],"#c89028",3);inkPath([[39,-140],[49,-149]],"#c89028",3)}
 ctx.restore();
 if(type==="slide"||type==="land"||type==="recover"){ctx.save();ctx.globalAlpha=type==="land"?Math.sin(Math.PI*u)*.55:.45;for(let i=0;i<4;i++){const z=(t*3+i*.22)%1;ellipse(v.x-8-z*24,v.y-3-z*6,3+z*5,2+z*3,"#b6aa98")}ctx.restore()}
 if(type==="peel"){ctx.save();for(let i=0;i<3;i++){const a=t*6+i*2.094;const x=v.x+Math.cos(a)*19,y=v.y-55+Math.sin(a)*7;ctx.strokeStyle="#d6a33b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.moveTo(x,y-3);ctx.lineTo(x,y+3);ctx.stroke()}ctx.restore()}
 if(type==="splat"){ctx.save();ctx.translate(v.x,v.y-37*size);ctx.strokeStyle="#d6a33b";ctx.lineWidth=2.5;for(let i=0;i<5;i++){const a=-Math.PI/2+i*.7;ctx.beginPath();ctx.moveTo(Math.cos(a)*22,Math.sin(a)*22);ctx.lineTo(Math.cos(a)*34,Math.sin(a)*34);ctx.stroke()}ctx.restore()}
 if(type==="fall"){ctx.save();ctx.strokeStyle="#95a9bb";ctx.lineWidth=1.5;ctx.globalAlpha=.65*(1-u*.5);for(let i=0;i<4;i++){const yy=v.y-70+i*15;ctx.beginPath();ctx.moveTo(v.x-16-i*4,yy-11);ctx.lineTo(v.x-23-i*4,yy-25);ctx.stroke()}ctx.restore()}
 if(type==="celebrate"){ctx.save();ctx.strokeStyle="#d3a13a";ctx.lineWidth=2;const burst=Math.sin(Math.PI*u);for(let i=0;i<7;i++){const a=i*Math.PI*2/7,rr=(22+14*burst);ctx.beginPath();ctx.moveTo(v.x+Math.cos(a)*rr,v.y-74+Math.sin(a)*rr);ctx.lineTo(v.x+Math.cos(a)*(rr+7),v.y-74+Math.sin(a)*(rr+7));ctx.stroke()}ctx.restore()}
 if(type==="crest"){ctx.save();ctx.globalAlpha=Math.sin(Math.PI*u)*.6;ctx.strokeStyle="#dfac43";ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(v.x+7+i*8,v.y-69-i*4);ctx.lineTo(v.x+12+i*8,v.y-74-i*4);ctx.stroke()}ctx.restore()}
}
function render(){if(!W||!H)return;ctx.clearRect(0,0,W,H);background();graph();if(mode==="edit"){$("hud").textContent=paths.length?paths.length+" path"+(paths.length===1?"":"s")+" · ready to run":"Draw a path";return}const q=sample(script,elapsed);if(!q)return;runner(q);$("hud").textContent=elapsed>=script.time?(script.failed?"Try again":"Made it!"):"";$("seek").value=Math.round(elapsed/script.time*1000);$("clock").textContent=elapsed.toFixed(1)+" / "+script.time.toFixed(1)+" s";const chips=Array.from($("chips").children);let active=0;chips.forEach((el,i)=>{if(+el.dataset.start<=elapsed)active=i});chips.forEach((el,i)=>el.classList.toggle("current",i===active))}
function frame(t){const dt=clamp((t-lastTime)/1000,0,.05);lastTime=t;if(mode==="play"&&playing){elapsed=Math.min(script.time,elapsed+dt);if(elapsed>=script.time){playing=false;$("pause").textContent="Play"}render()}requestAnimationFrame(frame)}
window.addEventListener("resize",resize);window.addEventListener("keydown",e=>{if(mode==="edit"&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();undo()}});
$("undo").disabled=true;resize();loadPreset("hill");$("preset").value="hill";history=[];$("undo").disabled=true;ui();requestAnimationFrame(frame);
