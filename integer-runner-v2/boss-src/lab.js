(()=>{'use strict';
const c=document.querySelector('canvas'),g=c.getContext('2d'),$=id=>document.getElementById(id),sprite=new Image();const assetRoot='assets/';sprite.src=assetRoot+'dr-fin-poses.webp';const stone=new Image();stone.src=assetRoot+'mossy-stone.webp';const forest=new Image();forest.src=assetRoot+'forest-chasm.webp';const creatures=BlobArt.creatures(),keys=new Set();let s,W,H,half,near,horizon,clock=0,last=0,paused=false,drag=false,held={x:0,z:0};
const params=new URLSearchParams(location.search),entry=Number(params.get('army')),entryArmy=Number.isSafeInteger(entry)&&entry!==0&&Math.abs(entry)<=1000000?entry:12;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),signed=BlobMath.signed;
function resize(){const r=c.getBoundingClientRect();W=r.width;H=r.height;const d=Math.min(devicePixelRatio||1,1.5);c.width=W*d;c.height=H*d;g.setTransform(d,0,0,d,0,0);half=Math.min(W*.26,H*.7);near=H*.86;horizon=H*.20;}addEventListener('resize',resize);resize();
function project(x,z){const d=z-s.forward,sc=1/(1+Math.max(-130,d)/510),far=1/(1+1100/510);return {x:W/2+(x-s.camera)*half*sc,y:horizon+(near-horizon)*(sc-far)/(1-far),sc};}
// Two additive lights and one multiplication light. All positions are
// independent spots on the stone, selected afresh around the arena.
const ARENA={halfW:1.8,nearZ:402,farZ:924,bossZ:864,unitZ:145};
const roles=['addA','addB','mul'];
const PAD_GLOW_SECONDS=1, PAD_TEXT_FADE=.25, MULTIPLY_CHANCE=.12;
// The three illuminated choices give one operation per sign-wave cycle.
// A new choice forms only when Dr. Fin starts the next warning phase.
const random=(a,b)=>a+Math.random()*(b-a);
function locationForPad(role){
 const others=(s.pads||[]).filter(p=>p.role!==role),old=(s.pads||[]).find(p=>p.role===role);
 const bias={addA:-.78,addB:.78,mul:0}[role];
 let best={x:bias,z:680},bestScore=-1;
 for(let attempt=0;attempt<100;attempt++){
  const x=clamp(bias+random(-.72,.72),-1.45,1.45),z=random(475,808);
  const fromPlayer=Math.hypot(x-s.x,(z-s.z)/ARENA.unitZ);
  const fromBoss=Math.hypot(x,(z-ARENA.bossZ)/ARENA.unitZ);
  const fromOther=others.length?Math.min(...others.map(p=>Math.hypot(x-p.x,(z-p.z)/ARENA.unitZ))):3;
  const fromOld=old?Math.hypot(x-old.x,(z-old.z)/ARENA.unitZ):3;
  const score=Math.min(fromPlayer,fromBoss,fromOther,fromOld);
  if(score>bestScore){bestScore=score;best={x,z};}
  if(fromPlayer>.48&&fromBoss>.54&&fromOther>.70&&fromOld>.7)return {x,z};
 }
 return best;
}
const padDistance=(p)=>Math.hypot((p.x-s.x)/.23,(p.z-s.z)/(ARENA.unitZ*.23));
function bossOperation(value,op){
 // Mathematical ceiling, including negative quotients: −7 ÷ 3 = −2.
 if(op.kind==='div')return Math.ceil(value/op.n);
 return BlobMath.operation(value,op);
}
const crossesZero=(value,op)=>{
 const result=bossOperation(value,op);
 if(op.kind==='add'||op.kind==='sub')
  return result===0||Math.sign(result)!==Math.sign(value);
 return result===0;
};
function additive(delta){
 const op=delta>0?{kind:'add',n:delta}:{kind:'sub',n:-delta};
 return {...op,label:delta>0?'+'+delta:'−'+(-delta)};
}
// Generate an operation once when its light appears. It stays unchanged
// until used, even if a wave or incoming army changes the player's value.
function makeOperation(role,value){
 if(role==='mul'){
  // The third light is division most of the time (88%); multiplication is rare.
  // ×(−1) remains useful for changing sign; ×2 is very uncommon.
  if(Math.random()<MULTIPLY_CHANCE){
   const factor=Math.random()<.80?-1:2;
   return {kind:'mul',n:factor,label:factor<0?'×(−1)':'×2'};
  }
  const choices=[2,3,4].filter(d=>d<=Math.abs(value));
  const divisor=choices.length?choices[Math.floor(Math.random()*choices.length)]:1;
  return {kind:'div',n:divisor,label:'÷'+divisor};
 }
 // Keep a positive and a negative additive, with modest values.
 // The same-sign choice is safe; the third light provides a second
 // safe choice when an opposite-signed addition would reach zero.
 const sign=role==='addA'?1:-1,mag=Math.abs(value);
 const amounts=[2,4,6,8].filter(n=>sign===Math.sign(value)||n<mag);
 const amount=amounts.length?amounts[Math.floor(Math.random()*amounts.length)]:Math.max(1,mag-1);
 return additive(sign*amount);
}
function options(value=s.value){
 return s.pads.map(p=>({
  role:p.role,kind:p.op.kind,op:p.op,label:p.label,
  result:bossOperation(value,p.op),safe:!crossesZero(value,p.op)
 }));
}
function nextPad(role){
 const turn=s.padVisits[role]++;
 const operation=makeOperation(role,s.value);
 return {...locationForPad(role),role,id:`${role}-${turn}`,
  op:{kind:operation.kind,n:operation.n},label:operation.label,
  active:true,readyAt:0,warnAt:0,bornAt:s.arenaClock};
}
function refreshPads(){
 s.pads=[];for(const role of roles)s.pads.push(nextPad(role));
 s.padReady=true;s.operationSpent=false;
 syncPads();
}
function syncPads(){
 // Refresh only derived safety/result data. Never rewrite a live spot.
 for(const pad of s.pads){
  pad.result=bossOperation(s.value,pad.op);
  pad.safe=!crossesZero(s.value,pad.op);
 }
}
function updatePads(){ /* All three operation lights stay available. */ }
function note(text){$('notice').textContent=text;s.log.push(text);if(s.log.length>20)s.log.shift();}
function reset(){paused=false;$('pause').textContent='Pause';s={mode:'battle',forward:330,camera:0,x:0,z:460,tx:0,tz:460,value:entryArmy,hp:100,visualHP:100,sign:1,nextSign:-1,phase:'warn',timer:2.2,round:0,padVisits:{addA:0,addB:0,mul:0},padReady:true,arenaClock:0,pads:[],pulses:[],padGhosts:[],log:[],flip:0,wave:null,hit:0,placeAnim:0,poseMix:0,end:false,contact:0,canceling:false,absorbing:false,visualArmy:Math.abs(entryArmy)};note('Boss checkpoint · Dr. Fin starts at +100.');beginPhase('warn');$('result').hidden=true;}
function deploy(){
 s.placeAnim=.95;
 // Four independently moving armies enter from four separate parts of the
 // arena's outer rim: exactly two blue/positive and two red/negative.
 // Every group has a different value; none is a multiplication token.
 const values=[4,8,12,16,20,24];
 for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
 values.length=4;
 const signs=Math.random()<.5?[1,-1,1,-1]:[-1,1,-1,1];
 const newPulses=[];
 const entrances=[{x:-1.62,z:470},{x:1.62,z:470},{x:-1.62,z:828},{x:1.62,z:828}];
 for(let i=0;i<4;i++){
  const site=entrances[i],x=site.x+random(-.07,.07),z=site.z+random(-11,11);
  const targetX=-site.x*.35+random(-.27,.27),targetZ=660+random(-100,100);
  const dx=targetX-x,dz=(targetZ-z)/ARENA.unitZ,len=Math.hypot(dx,dz)||1;
  const speed=random(.50,.62),value=signs[i]*values[i];
  newPulses.push({id:`${s.round}-${i}`,x,z,vx:dx/len*speed,vz:dz/len*speed,
   speed,value,life:20,age:0,offsetX:random(-.48,.48),offsetZ:random(-.45,.45)});
 }
 s.pulses=newPulses; // Exactly four entering groups at a time.
 note('Four groups entered from the arena edge: two blue (+), two red (−), each a different value.');
}
function beginPhase(name){
 s.phase=name;s.nextSign=-s.sign;s.timer=({warn:1.9,wave:1.4,attack:3.0,open:5.8,recover:1.0})[name];
 if(name==='warn'){s.padGhosts=[];refreshPads();}

 const messages={warn:`SIGN WAVE INCOMING: Dr. Fin is turning ${s.nextSign>0?'positive':'negative'}. ×(−1) flips your army on contact.`,wave:'The sign wave is moving toward you — touching it multiplies your army by −1.',attack:'Four different armies enter from the arena edge: two blue and two red. Same signs add; opposite signs cancel.',open:'Dr. Fin is exposed. Opposite signs hurt him; matching signs heal him.',recover:'Recover and prepare for the next sign wave.'};note(messages[name]);}

function pulseResult(v,p){return v*p<0&&Math.abs(v)<=Math.abs(p)?0:v+p;}
function noteOnce(text){if(!s.contactNote){note(text);s.contactNote=true;}}
function stop(win,reason){if(win&&params.has('embedded'))parent.postMessage({type:'integer-boss-win',value:s.value},location.origin);s.end=true;s.mode=win?'victory':'lost';$('result').hidden=false;$('outcome').textContent=win?'Boss defeated!':(reason||'Zero — your swarm is gone.');note(win?'You canceled the boss body. Forward running resumes.':(reason||'Retry: absorb matching pulses, then grow before touching the opposite boss.'));}
function step(dt){if(paused||s.end)return;clock+=dt;s.arenaClock+=dt;s.placeAnim=Math.max(0,s.placeAnim-dt);s.hit=Math.max(0,s.hit-dt);s.visualHP+=(s.hp-s.visualHP)*Math.min(1,dt*7);s.visualArmy+=(Math.abs(s.value)-s.visualArmy)*Math.min(1,dt*9);
 if(s.mode==='approach'){s.forward+=150*dt;s.z=s.forward+100;s.tz=s.z;if(s.forward>=330){s.forward=330;s.z=430;s.tz=430;s.mode='battle';beginPhase('place');deploy();}return;}
 if(s.mode==='exit'){s.forward+=150*dt;s.timer-=dt;if(s.timer<=0)stop(true);return;}
 const dx=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0)+held.x,dz=(keys.has('ArrowUp')||keys.has('w')?1:0)-(keys.has('ArrowDown')||keys.has('s')?1:0)+held.z;
 if(dx||dz){const l=Math.hypot(dx,dz)||1;s.tx=s.x+dx/l*dt*1.8;s.tz=s.z+dz/l*dt*1.8*ARENA.unitZ;}
 let vx=s.tx-s.x,vz=(s.tz-s.z)/ARENA.unitZ,len=Math.hypot(vx,vz),travel=Math.min(len,dt*1.8);if(len){s.x+=vx/len*travel;s.z+=vz/len*travel*ARENA.unitZ;}
 s.x=clamp(s.x,-ARENA.halfW+.12,ARENA.halfW-.12);s.z=clamp(s.z,ARENA.nearZ+14,ARENA.farZ-18);
 const dist=Math.hypot(s.x,(s.z-ARENA.bossZ)/ARENA.unitZ);
 if(dist<.35){const factor=.35/Math.max(.001,dist);s.x*=factor;s.z=ARENA.bossZ+(s.z-ARENA.bossZ)*factor;}
 s.x=clamp(s.x,-ARENA.halfW+.12,ARENA.halfW-.12);s.z=clamp(s.z,ARENA.nearZ+14,ARENA.farZ-18);
 s.camera+=(s.x*.55-s.camera)*Math.min(1,dt*9);
 updatePads();
 // A newly formed spot must show its operation before it can be used.
 // Standing on an unrevealed glow will not trigger it when the text appears.
 const onAnyLight=s.pads.some(p=>padDistance(p)<1);
 const tile=s.pads.findIndex(p=>p.active&&
  s.arenaClock-p.bornAt>=PAD_GLOW_SECONDS+PAD_TEXT_FADE&&padDistance(p)<1);
 if(!onAnyLight)s.padReady=true;
 else if(tile<0)s.padReady=false;
 if(s.padReady&&tile>=0){
  const pad=s.pads[tile],old=s.value,result=bossOperation(old,pad.op);
  s.padReady=false;
  if(crossesZero(old,pad.op)){
   // Crossing zero is a loss even when the signed answer is nonzero.
   // Thus −8 + 16 = +8 loses on the way through zero.
   s.value=0;
   stop(false,`${signed(old)} ${pad.label} would pass through zero. Army lost!`);
   return;
  }
  s.value=result;
  if(!s.value){stop(false);return;}
  // Spend this cycle's ONE operation choice. No instant respawn,
  // so repeated stepping on spots cannot inflate the army.
  for(const spot of s.pads)s.padGhosts.push({...spot,expires:s.arenaClock+.52});
  s.pads=[];s.operationSpent=true;
  note(`${signed(old)} ${pad.label} = ${signed(s.value)}. Operations return with the next sign-wave warning.`);
 }


 const contactAllowed=s.phase==='attack'||s.phase==='open';s.canceling=contactAllowed&&dist<.43&&s.value*s.sign<0;s.absorbing=contactAllowed&&dist<.43&&s.value*s.sign>0;
 if(s.canceling||s.absorbing){s.contact+=dt*10;const amount=Math.min(Math.floor(s.contact),Math.abs(s.value),s.absorbing?Infinity:s.hp);if(amount){s.contact-=amount;s.hp+=s.absorbing?amount:-amount;s.value=Math.sign(s.value)*(Math.abs(s.value)-amount);s.hit=.12;if(!s.value){stop(false);return;}if(!s.hp){s.mode='exit';s.timer=2.2;note('Boss canceled completely. Forward travel resumes.');return;}}noteOnce(s.absorbing?'Same sign: the boss absorbs your army and grows. Retreat!':'Opposite signs: both shrink. Retreat before zero.');}else{s.contact=0;s.contactNote=false;}
 s.padGhosts=s.padGhosts.filter(p=>p.expires>s.arenaClock);
 s.timer-=dt;
 if(s.timer<=0){
  const next={warn:'wave',wave:'attack',attack:'open',open:'recover',recover:'warn'}[s.phase];
  if(next==='wave'){
   s.sign=-s.sign;s.round++;
   s.wave={z:ARENA.bossZ,hit:false};s.hit=.5;
  }
  beginPhase(next);
  if(next==='attack')deploy();
 }
 if(s.phase==='wave')s.flip+=dt*9;
 if(s.wave){
  const previous=s.wave.z;
  s.wave.z-=320*dt;
  const crossed=(previous>=s.z&&s.wave.z<=s.z)||Math.abs(s.wave.z-s.z)<15;
  if(!s.wave.hit&&crossed){
   s.value=-s.value;s.wave.hit=true;syncPads();
   note(`Sign wave: ${signed(-s.value)} × (−1) = ${signed(s.value)}. Size unchanged.`);
  }
  if(s.wave.z<ARENA.nearZ-14)s.wave=null;
 }


 for(const p of s.pulses){
  p.age+=dt;p.life-=dt;
  // The first moment is an independent diagonal arrival, not a beeline at
  // the player's center. Later each group gently homes toward a DIFFERENT
  // offset near the army, so groups do not stack on one another.
  if(p.age>1.15){
   const targetX=s.x+p.offsetX,targetZ=s.z+p.offsetZ*ARENA.unitZ;
   const dx=targetX-p.x,dz=(targetZ-p.z)/ARENA.unitZ,len=Math.hypot(dx,dz)||1;
   const steer=Math.min(1,dt*.72);
   const vx=p.vx*(1-steer)+(dx/len)*p.speed*steer;
   const vz=p.vz*(1-steer)+(dz/len)*p.speed*steer;
   const norm=Math.hypot(vx,vz)||1;
   p.vx=vx/norm*p.speed;p.vz=vz/norm*p.speed;
  }
  p.x+=p.vx*dt;p.z+=p.vz*ARENA.unitZ*dt;
  if(Math.abs(p.x)>ARENA.halfW-.12){p.x=clamp(p.x,-ARENA.halfW+.12,ARENA.halfW-.12);p.vx=-p.vx*.88;}
  if(p.z<ARENA.nearZ+14||p.z>ARENA.farZ-14){p.z=clamp(p.z,ARENA.nearZ+14,ARENA.farZ-14);p.vz=-p.vz*.88;}
  if(Math.hypot(p.x-s.x,(p.z-s.z)/ARENA.unitZ)<.22&&p.life>0){
   const old=s.value;s.value=pulseResult(old,p.value);
   note(`${signed(old)} + (${signed(p.value)}) = ${signed(s.value)} ${old*p.value>0?'· absorbed':'· canceled'}`);
   p.life=0;if(!s.value){stop(false,'Zero crossed while meeting an opposing swarm.');return;}
  }
 }
 s.pulses=s.pulses.filter(p=>p.life>0);syncPads();
}
function poly(points,color){g.fillStyle=color;g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fill();}
function label(x,y,text,color,size=15){g.font=`800 ${size}px system-ui`;const w=g.measureText(text).width+14;g.fillStyle=color;g.beginPath();g.roundRect(x-w/2,y-size*.7,w,size+10,6);g.fill();g.fillStyle='#fff';g.textAlign='center';g.fillText(text,x,y+4);}
function line(points,color,width=1){g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();}
// Fixed distant scenery; only world geometry uses the traveling projection.
function scenery(){
 if(window.RunEnvironment?.background){RunEnvironment.background(g,W,H);return;}
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#b7cbd0');sky.addColorStop(1,'#91adae');
 g.fillStyle=sky;g.fillRect(0,0,W,H);
}
function paving(bounds,start,end,arena=false){
 g.save();g.beginPath();bounds.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.clip();
 g.fillStyle=arena?'#969f9b':'#959e9a';g.fillRect(0,0,W,H);
 const left=arena?-ARENA.halfW:-.45,right=arena?ARENA.halfW:.45,unit=arena?66:72;
 for(let z=Math.floor(start/unit)*unit;z<=end;z+=unit){
  const a=project(left,z),b=project(right,z);
  g.strokeStyle='rgba(55,84,73,.17)';g.lineWidth=Math.max(.7,1.1*a.sc);
  g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();
  if(Math.floor(z/unit)%2===0){const m=project(0,z),n=project(0,z+unit);
   g.strokeStyle='rgba(60,89,78,.09)';g.beginPath();g.moveTo(m.x,m.y);g.lineTo(n.x,n.y);g.stroke();}
 }
 g.restore();
}
// Map the floor material onto masonry faces with a lightweight affine transform.
function masonryFace(points,tint=0){
 poly(points,'#8d9a94');
 if(tint){g.save();g.globalAlpha=Math.min(.26,tint);poly(points,'#415c52');g.restore();}
}
function pier(x,z,width,depth){const q=project(x,z),w=width*q.sc,h=depth*q.sc,off=w*.42;
 for(let y=0;y<h;y+=22*q.sc){const dh=Math.min(22*q.sc,h-y),t=y/h,flare=1+t*.16;
 const a={x:q.x-w*flare,y:q.y+y},b={x:q.x+w*.3*flare,y:q.y+y},c={x:b.x,y:b.y+dh},d={x:a.x,y:a.y+dh};
 masonryFace([a,b,c,d],.22+t*.20);masonryFace([b,{x:b.x+off,y:b.y-4*q.sc},{x:c.x+off,y:c.y-4*q.sc},c],.45+t*.15);
 line([d,c],'#3e493b66',.8);}
 // Mist follows the silhouette, without rectangular overlays across the scenery.
 g.save();g.globalAlpha=.3;g.strokeStyle='#587347';g.lineWidth=2*q.sc;g.beginPath();g.moveTo(q.x-w*.7,q.y);g.bezierCurveTo(q.x-w*.3,q.y+h*.1,q.x-w*.9,q.y+h*.25,q.x-w*.5,q.y+h*.4);g.stroke();g.restore();}
function supports(){
 for(const x of [-ARENA.halfW+.17,ARENA.halfW-.17])
  for(const z of [ARENA.nearZ+15,ARENA.farZ-15])pier(x,z,26,520);
}
function wallSegment(x1,z1,x2,z2,index,low=false){
 const a=project(x1,z1),b=project(x2,z2),h=low?12:25;
 poly([{x:a.x,y:a.y-h*a.sc},{x:b.x,y:b.y-h*b.sc},b,a],'#7b8c85');
 line([{x:a.x,y:a.y-h*a.sc},{x:b.x,y:b.y-h*b.sc}],'#bdc7ba',Math.max(1,2*a.sc));
}
function bridgeWalls(){for(let z=1440;z>-150;z-=36){if(z>410&&z<950)continue;for(const side of [-1,1])wallSegment(side*.46,z,side*.46,z+36,Math.floor(z/36));}}
function arenaWalls(){
 const w=ARENA.halfW;
 for(const side of [-1,1])for(let z=ARENA.nearZ;z<ARENA.farZ;z+=52)
  wallSegment(side*w,z,side*w,Math.min(ARENA.farZ,z+52),0,false);
 // Bridge entrance and exit openings in the near and far rails.
 for(const edge of [ARENA.nearZ,ARENA.farZ])for(let x=-w;x<w;x+=.24){
  const stop=Math.min(w,x+.24);if(Math.abs((x+stop)/2)<.54)continue;
  wallSegment(x,edge,stop,edge,0,edge===ARENA.nearZ);
 }
}
function draw(){scenery();supports();
 const path=[project(-.45,-150),project(.45,-150),project(.45,1500),project(-.45,1500)];poly(path.map(p=>({x:p.x,y:p.y+18*p.sc})),'#514b43');poly(path,'#b5a07a');paving(path,Math.max(-150,s.forward-140),s.forward+1400);
 bridgeWalls();
 const corners=[project(-ARENA.halfW,ARENA.farZ),project(ARENA.halfW,ARENA.farZ),
  project(ARENA.halfW,ARENA.nearZ),project(-ARENA.halfW,ARENA.nearZ)];
 poly(corners.map(p=>({x:p.x,y:p.y+30*p.sc})),'#586c63');
 poly(corners,'#99a39d');paving(corners,ARENA.nearZ,ARENA.farZ,true);
 line([...corners,corners[0]],'#bec7bb',Math.max(1.2,2*corners[2].sc));
 arenaWalls();
 // The operations are glowing words *on* the stone floor, not floating
 // labels or physical button discs. Spots fade out, then respawn elsewhere.
 if(s.mode!=='approach')for(const pad of [...s.padGhosts,...s.pads]){
  const ghost=pad.expires!==undefined;
  const age=s.arenaClock-pad.bornAt;
  const forming=!ghost&&pad.active&&age<PAD_GLOW_SECONDS;
  if(!ghost&&!pad.active)continue;
  const p=project(pad.x,pad.z),rx=half*.225*p.sc,ry=rx*.50;
  // The sign of the *operation* determines the light color.
  const negative=/[−-]/.test(pad.label);
  const light=negative?{
   inner:'255,215,223',mid:'255,71,111',outer:'255,34,70',
   rim:'255,129,146',shadow:'#ff4969',ink:'#fff7f7',outline:'#52182c'
  }:{
   inner:'215,251,255',mid:'60,206,249',outer:'27,112,229',
   rim:'128,225,255',shadow:'#41cfff',ink:'#f9ffff',outline:'#103957'
  };
  const timeIn=ghost?clamp((pad.expires-s.arenaClock)/.52,0,1):
   clamp(age/PAD_GLOW_SECONDS,0,1);
  const power=timeIn*(.95+.05*Math.sin(clock*6+pad.x*3));
  // Measure the operation so long values like ×(−1) fit within the light.
  const fontPx=Math.max(38,54*p.sc);
  g.save();g.translate(p.x,p.y);g.scale(1,.61);
  g.font=`italic 900 ${fontPx}px system-ui`;
  const radiusX=Math.max(rx,g.measureText(pad.label).width*.61);
  // Keep the light vivid at the edges without whitening the center
  // enough to hide the letters.
  g.globalCompositeOperation='screen';
  const glow=g.createRadialGradient(0,0,0,0,0,radiusX*2.25);
  glow.addColorStop(0,`rgba(${light.inner},${.34*power})`);
  glow.addColorStop(.24,`rgba(${light.mid},${.40*power})`);
  glow.addColorStop(.57,`rgba(${light.outer},${.20*power})`);
  glow.addColorStop(1,`rgba(${light.outer},0)`);
  g.fillStyle=glow;g.beginPath();g.arc(0,0,radiusX*2.25,0,Math.PI*2);g.fill();
  g.shadowColor=light.shadow;g.shadowBlur=12*power;
  g.strokeStyle=`rgba(${light.rim},${.85*power})`;
  g.lineWidth=Math.max(1.5,2.6*p.sc);
  g.beginPath();g.ellipse(0,0,radiusX*(.98+.04*Math.sin(clock*5)),rx*.74,0,0,Math.PI*2);g.stroke();
  g.strokeStyle=`rgba(${light.inner},${.40*power})`;
  g.lineWidth=Math.max(.8,1.3*p.sc);
  g.beginPath();g.ellipse(0,0,radiusX*1.15,rx*.87,0,0,Math.PI*2);g.stroke();
  if(!ghost&&age>=PAD_GLOW_SECONDS){
   // The colored glow arrives first; then the operation fades in.
   const textOpacity=clamp((age-PAD_GLOW_SECONDS)/PAD_TEXT_FADE,0,1);
   // Switch away from screen blending for the letters themselves:
   // luminous white lettering needs a crisp, dark boundary on light stone.
   g.save();g.scale(1,1.16);
   g.globalCompositeOperation='source-over';
   g.globalAlpha=power*textOpacity;
   g.textAlign='center';g.textBaseline='middle';
   g.font=`italic 900 ${fontPx}px system-ui`;
   g.lineJoin='round';
   g.shadowBlur=0;
   g.strokeStyle=light.outline;
   g.lineWidth=7.2;
   g.strokeText(pad.label,0,0);
   g.strokeStyle=negative?'#ef4968':'#208ec5';
   g.lineWidth=3.2;
   g.strokeText(pad.label,0,0);
   g.fillStyle=light.ink;
   g.fillText(pad.label,0,0);
   g.restore();
  }
  g.restore();
  // Brief tongues of energy mark a new spot as it materializes.
  if(forming){
   g.save();g.globalAlpha=power*.95;g.strokeStyle=negative?'#ff9aa8':'#b2f5ff';g.shadowColor=light.shadow;g.shadowBlur=14*power;g.lineWidth=1.8*p.sc;
   for(let i=0;i<6;i++){
    const a=i*Math.PI/3+clock*2.3,x=Math.cos(a)*rx,y=Math.sin(a)*ry;
    g.beginPath();g.moveTo(p.x+x,p.y+y);
    g.lineTo(p.x+x*.92+Math.sin(clock*7+i)*3,p.y+y-8*p.sc);
    g.stroke();
   }g.restore();
  }
 }


 const boss=project(0,ARENA.bossZ),scale=.4+.6*Math.sqrt(Math.max(0,s.visualHP)/100),h=H*.34*boss.sc*scale,w=h*1.05;
 g.fillStyle='#25332d44';g.beginPath();g.ellipse(boss.x+4,boss.y+2,w*.38,h*.07,0,0,7);g.fill();
 // Transform around the feet, never the canvas origin. Each pose shares a cell baseline.
 const placing=s.placeAnim>0,stomping=s.phase==='warn'||s.phase==='wave',hurting=s.canceling&&s.hit>0;
 const pose=hurting?3:stomping?2:placing?1:0;
 const squash=stomping?1-.07*Math.sin(Math.min(1,s.timer/1.2)*Math.PI):1;
 const twist=s.phase==='wave'?Math.sin(clock*9)*.12:0;
 const wobble=hurting?Math.sin(clock*28)*.045:s.absorbing?Math.sin(clock*10)*.025:Math.sin(clock*4)*.012;
 g.save();g.translate(boss.x,boss.y);g.rotate(twist+wobble);g.scale(1/squash,squash);
 if(s.mode==='exit'||s.mode==='victory')g.globalAlpha=Math.max(0,s.timer/2.2);
 if(sprite.complete&&sprite.naturalWidth){const cw=sprite.naturalWidth/4,ch=sprite.naturalHeight/2;
 const imageSign=s.sign;
 if(s.renderPose!==pose){s.previousPose=s.renderPose??pose;s.renderPose=pose;s.poseStarted=clock;}
 const blend=Math.min(1,(clock-s.poseStarted)/.14),alpha=g.globalAlpha;
 if(blend<1){g.globalAlpha=alpha*(1-blend);g.drawImage(sprite,s.previousPose*cw+24,imageSign>0?0:ch,cw-48,ch,-w/2,-h,w,h);}
 g.globalAlpha=alpha*blend;g.drawImage(sprite,pose*cw+24,imageSign>0?0:ch,cw-48,ch,-w/2,-h,w,h);
 }else{g.drawImage(creatures[s.sign][pose%4],-w/2,-h,w,h);}g.restore();

 label(boss.x,boss.y-h-20,`${signed(s.sign*s.hp)} BOSS`,s.sign>0?'#126caa':'#b93451',Math.max(12,16*boss.sc));
 if(s.phase==='warn')label(boss.x,boss.y-h-45,`Turning: ${s.nextSign>0?'+':'−'}`,s.nextSign>0?'#126caa':'#b93451',14);
 if(s.wave){const q=project(0,s.wave.z),swell=.78+.22*Math.sin(clock*10);g.strokeStyle='#dff8ff';g.lineWidth=6;g.beginPath();g.ellipse(q.x,q.y,half*1.32*q.sc,16*q.sc*swell,0,0,7);g.stroke();g.strokeStyle='#7be7ff';g.lineWidth=2.2;g.beginPath();g.ellipse(q.x,q.y,half*1.22*q.sc,10*q.sc*swell,0,0,7);g.stroke();label(q.x,q.y-8,'×(−1)','#794c97',14);}
 if(s.phase==='wave'){g.strokeStyle=s.sign>0?'#7ae7ff':'#ff8eaf';g.lineWidth=4;g.beginPath();g.ellipse(boss.x,boss.y-h*.5,w*.7,h*.55,s.flip*.3,0,Math.PI*1.8);g.stroke();}
 for(const p of [...s.pulses].sort((a,b)=>b.z-a.z)){
  const q=project(p.x,p.z),count=Math.min(22,Math.abs(p.value));
  const r=Math.max(4.5,7.4*q.sc),spread=Math.sqrt(count)*r*1.1;
  const sign=p.value<0?-1:1;
  for(let i=0;i<count;i++){
   const a=i*2.399963,d=Math.sqrt((i+.5)/count)*spread;
   const bx=q.x+Math.cos(a)*d,by=q.y+Math.sin(a)*d*.45;
   g.drawImage(creatures[sign][i%4],bx-r,by-r*2+Math.sin(clock*8+i)*r*.18,r*2,r*2);
  }
  label(q.x,q.y-spread*.55-22*r/8,signed(p.value),sign>0?'#176bb0':'#bb304f',Math.max(11,14*q.sc));
 }
 const player=project(s.x,s.z),n=Math.min(65,Math.max(0,Math.round(s.visualArmy))),r=Math.min(10,H*.016)*player.sc,spread=Math.min(H*.10,Math.sqrt(n)*r*1.1);
 g.fillStyle='#25332d44';g.beginPath();g.ellipse(player.x+3,player.y+2,spread+5,spread*.5,0,0,7);g.fill();
 for(let i=0;i<n;i++){const a=i*2.4,d=Math.sqrt((i+.5)/n)*spread,x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d*.45;g.drawImage(creatures[s.value<0?-1:1][i%4],x-r,y-r*2+Math.sin(clock*7+i)*r*.15,r*2,r*2);}
 if(s.canceling||s.absorbing){const mid={x:(player.x+boss.x)/2,y:(player.y+boss.y)/2};line([{x:mid.x-W*.06,y:mid.y},{x:mid.x+W*.06,y:mid.y}],'#f1fbff',5);for(let i=0;i<8;i++){g.fillStyle=i%2?'#8de7ff':'#ffa1b6';g.beginPath();g.arc(mid.x+Math.sin(i*9+clock*8)*W*.05,mid.y-i%3*4,2,0,7);g.fill();}}
 label(player.x,player.y+spread*.5+23,signed(s.value),s.value>0?'#147bbb':'#c33953',18);
 $('phase').textContent=s.mode==='approach'?'Approaching arena':s.mode==='exit'?'Boss defeated':paused?'Paused':({warn:'SIGN WAVE INCOMING',wave:'×(−1) WAVE',attack:'FOUR EDGE SWARMS',open:'BOSS EXPOSED',recover:'RECOVERY'})[s.phase];
 $('health').textContent=`Dr. Fin · ${s.hp}`;
}
function frame(t){const dt=Math.min(.05,last?(t-last)/1000:0);last=t;step(dt);draw();requestAnimationFrame(frame);}function pointer(e){const r=c.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,far=1/(1+1100/510),sc=clamp(far+(py-horizon)*(1-far)/(near-horizon),.4,1.2);s.tx=(px-W/2)/(half*sc)+s.camera;s.tz=clamp(s.forward+510*(1/sc-1),ARENA.nearZ+14,ARENA.farZ-18);s.tx=clamp(s.tx,-ARENA.halfW+.12,ARENA.halfW-.12);}
c.onpointerdown=e=>{drag=true;c.setPointerCapture(e.pointerId);pointer(e);};c.onpointermove=e=>{if(drag)pointer(e);};c.onpointerup=c.onpointercancel=()=>drag=false;
function pause(){paused=!paused;$('pause').textContent=paused?'Resume':'Pause';} $('pause').onclick=pause;$('restart').onclick=$('retry').onclick=reset;
$('help').onclick=()=>{paused=true;$('pause').textContent='Resume';$('helpDialog').showModal();};$('closeHelp').onclick=()=>{$('helpDialog').close();};$('start').onclick=()=>{$('intro').close();reset();};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else note('Use Safari’s Add to Home Screen for a full-screen view.');}catch(e){note('Fullscreen is unavailable in this browser.');}};
for(const button of document.querySelectorAll('[data-x]')){button.onpointerdown=e=>{e.preventDefault();held={x:+button.dataset.x,z:+button.dataset.z};button.setPointerCapture(e.pointerId);};button.onpointerup=button.onpointercancel=()=>held={x:0,z:0};}
addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key))e.preventDefault();if(key===' '&&!e.repeat)pause();if(key==='r'&&!e.repeat)reset();keys.add(key);});addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));addEventListener('blur',()=>{keys.clear();held={x:0,z:0};if(!s.end){paused=true;$('pause').textContent='Resume';}});
$('menu').onclick=()=>{if(params.has('embedded'))parent.postMessage({type:'integer-boss-menu'},location.origin);else location.href='../';};
window.BossLab={arena:ARENA,snapshot:()=>JSON.parse(JSON.stringify(s)),project:(x,z)=>project(x,z),options,crossesZero,pulseResult,draw,test:(patch)=>Object.assign(s,patch),step};reset();if(params.has('embedded')||params.has('autostart')){$('intro').close();}else paused=true;requestAnimationFrame(frame);
})();
