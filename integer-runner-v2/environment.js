/* Integer Runner 2.0 — intentionally quiet, world-anchored landscape. */
(()=>{'use strict';
let backdrop=null, cachedW=0,cachedH=0;
const TAU=Math.PI*2;
function polygon(g,points,fill){g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fillStyle=fill;g.fill();}
function background(W,H){
 if(backdrop&&cachedW===W&&cachedH===H)return backdrop;
 const cv=document.createElement('canvas');cv.width=Math.ceil(W);cv.height=Math.ceil(H);
 const g=cv.getContext('2d');cachedW=W;cachedH=H;backdrop=cv;
 let grad=g.createLinearGradient(0,0,0,H);
 grad.addColorStop(0,'#b6cacf');grad.addColorStop(.31,'#9eb8bd');grad.addColorStop(.67,'#789da3');grad.addColorStop(1,'#9ab6b9');
 g.fillStyle=grad;g.fillRect(0,0,W,H);
 // Distant jungle ridges: broad quiet silhouettes, fading toward the horizon.
 // These sit behind the side cliffs, not in the course's mathematical lane.
 for(let layer=0;layer<3;layer++){
  const y=H*(.215+layer*.043);
  g.fillStyle=['rgba(108,147,151,.19)','rgba(88,137,137,.17)','rgba(73,118,117,.13)'][layer];
  g.beginPath();g.moveTo(0,H*.42);
  for(let x=0;x<=W+W/14;x+=W/14){
   const ridge=y+Math.sin(x/W*8.4+layer*1.9)*H*.019
    +Math.cos(x/W*15.2+layer*.8)*H*.009;
   g.lineTo(x,ridge);
  }
  g.lineTo(W,H*.42);g.closePath();g.fill();
 }
 // A light, concentrated veil at the vanishing point.
 const horizonMist=g.createLinearGradient(0,H*.17,0,H*.42);
 horizonMist.addColorStop(0,'rgba(192,214,216,0)');
 horizonMist.addColorStop(.45,'rgba(198,221,220,.35)');
 horizonMist.addColorStop(1,'rgba(194,219,218,0)');
 g.fillStyle=horizonMist;g.fillRect(0,H*.17,W,H*.25);
 // Four huge soft cliff forms; no leaves drawn at individual-leaf scale.
 for(let layer=0;layer<3;layer++)for(let side of [-1,1]){
  const e=side<0?0:W,dir=side<0?1:-1,extent=W*(.32-layer*.056),top=H*(.13+layer*.095);
  g.fillStyle=['#809d9c','#608480','#476d68'][layer];
  g.beginPath();g.moveTo(e,0);g.lineTo(e+dir*extent*.7,0);
  for(let k=9;k>=0;k--){const t=k/9;
   g.lineTo(e+dir*(extent*t),top+Math.sin(t*6.1+side+layer)*H*.027+H*.09*t*t);
  }
  g.lineTo(e,H);g.closePath();g.fill();
  g.fillStyle=['#668c7e','#4f776d','#395e56'][layer];
  for(let j=0;j<4;j++){
   const t=(j+.5)/5,x=e+dir*extent*t,y=top+Math.sin(t*6.1+side+layer)*H*.027+H*.09*t*t;
   g.beginPath();g.ellipse(x,y,W*(.026-layer*.003),H*.015,0,0,TAU);g.fill();
  }
 }
 // Haze increases below the bridge. The chasm has depth without detail.
 grad=g.createLinearGradient(0,H*.27,0,H);
 grad.addColorStop(0,'rgba(195,217,219,0)');
 grad.addColorStop(.28,'rgba(183,207,210,.21)');
 grad.addColorStop(.65,'rgba(164,195,200,.67)');
 grad.addColorStop(1,'rgba(168,199,204,.91)');
 g.fillStyle=grad;g.fillRect(0,H*.27,W,H*.73);
 for(let j=0;j<3;j++){
  const cy=H*(.55+j*.15),radius=W*(.43+j*.10);
  grad=g.createRadialGradient(W*.5,cy,0,W*.5,cy,radius);
  grad.addColorStop(0,'rgba(206,226,225,.16)');grad.addColorStop(1,'rgba(206,226,225,0)');
  g.fillStyle=grad;g.fillRect(0,cy-radius,W,radius*2);
 }
 // A few dark vines at the outside perimeter: never under the numbers.
 g.strokeStyle='rgba(39,89,67,.29)';g.lineWidth=Math.max(1,W*.0014);
 for(let side of [-1,1])for(let i=0;i<2;i++){
  const x=side<0?W*(.028+i*.025):W*(.972-i*.025),y=H*(.19+i*.07);
  g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+side*W*.007,y+H*.10,x-side*W*.012,y+H*.16,x,y+H*.21);g.stroke();
 }
 return cv;
}
function draw(g,{W,H,project,position=0,pair=null}){
 g.drawImage(background(W,H),0,0,W,H);
 const near=position-155,far=position+1640,strip=72;
 // Far bridge, railings and supports dissolve into the same valley mist.
 const distanceOpacity=z=>Math.max(0,Math.min(1,(1630-(z-position))/650));
 const hole=z=>pair&&z>pair.z-120&&z<pair.z+160
  ?Math.max(0,.38*Math.sin(Math.PI*(z-pair.z+120)/280)):0;
 // Simple foundation and broad stone support forms, always behind roadway.
 for(let z=Math.ceil(far/220)*220;z>near;z-=220){
  for(let side of [-1,1]){
   const a=project(side,z),b=project(side,z+155);
   g.save();g.globalAlpha=distanceOpacity(z);
   polygon(g,[a,b,{x:b.x,y:b.y+125*b.sc},{x:a.x,y:a.y+125*a.sc}],'#697e79');
   g.restore();
  }
 }
 // Every seam is tied to a world distance and doesn't swim with the camera.
 for(let z=Math.floor(far/strip)*strip;z>=near-strip;z-=strip){
  const za=z+strip,gap=hole(z),gap2=hole(za);
  const ranges=gap?[[-1,-gap,-1,-gap2],[gap,1,gap2,1]]:[[-1,1,-1,1]];
  for(const [l,r,lf,rf] of ranges){
   g.save();g.globalAlpha=distanceOpacity(z+strip*.5);
   const a=project(l,z),b=project(r,z),c=project(rf,za),d=project(lf,za);
   const index=Math.floor(z/strip),shade=(index%5===0)?'#999f9b':(index%3===0?'#a4aaa5':'#a0a6a2');
   polygon(g,[a,b,c,d],shade);
   g.strokeStyle='rgba(76,96,92,.20)';g.lineWidth=Math.max(.7,1.4*a.sc);
   g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();
   // Very light, long joints on alternating blocks; no dense cracks.
   if(index%2===0){
    const mid=project((l+r)*.5,z),midfar=project((lf+rf)*.5,za);
    g.strokeStyle='rgba(78,101,91,.12)';g.lineWidth=1;
    g.beginPath();g.moveTo(mid.x,mid.y);g.lineTo(midfar.x,midfar.y);g.stroke();
   }
   // Soft stone wear: broad, world-fixed patches rather than tiny repeating marks.
   // Both location and color are deterministic per slab, preventing shimmer.
   if(r-l>.4){
    const hash=n=>{const v=Math.sin(n*127.17+index*31.71)*43758.5453;return v-Math.floor(v)};
    for(let k=0;k<2;k++){
     const u=.18+hash(k+1)*.54,width=.13+hash(k+8)*.19;
     const nearZ=z+11+hash(k+14)*14,farZ=Math.min(za-5,nearZ+15+hash(k+22)*16);
     const u1=Math.max(.06,u-width*.5),u2=Math.min(.94,u+width*.5);
     const x1=l+(r-l)*u1,x2=l+(r-l)*u2;
     const xf1=lf+(rf-lf)*u1,xf2=lf+(rf-lf)*u2;
     polygon(g,[project(x1,nearZ),project(x2,nearZ+2),
      project(xf2,farZ),project(xf1,farZ-2)],
      k===0?'rgba(69,88,80,.11)':'rgba(225,228,213,.13)');
    }
   }
   // Occasional low-contrast moss at a side joint, never in the central lane.
   if(index%7===0){
    const m=project(l+.07*(r-l),z+7);
    g.fillStyle='rgba(85,118,94,.22)';g.beginPath();g.ellipse(m.x,m.y,8*m.sc,2.5*m.sc,-.2,0,TAU);g.fill();
   }
   g.restore();
  }
 }

 // Continuous sturdy parapets give the bridge physical edges without
 // adding small high-contrast stone decoration.
 for(const side of [-1,1]){
  for(let z=Math.ceil(far/112)*112;z>near-112;z-=112){
   const za=z-112,a=project(side,z),b=project(side,za);
   const outerA=project(side*1.08,z),outerB=project(side*1.08,za);
   const heightA=43*a.sc,heightB=43*b.sc;
   const topA={x:a.x,y:a.y-heightA},topB={x:b.x,y:b.y-heightB};
   g.save();g.globalAlpha=distanceOpacity(z-45);
   // Outer wall face, inner face, then broad stone cap.
   polygon(g,[{x:outerA.x,y:outerA.y-41*outerA.sc},
    {x:outerB.x,y:outerB.y-41*outerB.sc},outerB,outerA],'#697b73');
   polygon(g,[topA,topB,b,a],'#819088');
   polygon(g,[topA,topB,
    {x:outerB.x,y:outerB.y-46*outerB.sc},
    {x:outerA.x,y:outerA.y-46*outerA.sc}],'#b2bab0');
   g.strokeStyle='rgba(42,68,60,.27)';
   g.lineWidth=Math.max(.7,1.4*b.sc);
   g.beginPath();g.moveTo(topA.x,topA.y);g.lineTo(topB.x,topB.y);g.stroke();
   // World-fixed masonry seam, quietly engraved rather than strongly outlined.
   g.strokeStyle='rgba(60,81,74,.16)';
   g.beginPath();g.moveTo(topB.x,topB.y+3*b.sc);
   g.lineTo(b.x,b.y);g.stroke();
   g.restore();
  }
  // Larger anchor buttresses at fixed distances; visible even in motion.
  for(let z=Math.floor(far/224)*224;z>=near;z-=224){
   const p=project(side,z),w=10*p.sc,h=52*p.sc;
   g.save();g.globalAlpha=distanceOpacity(z);
   g.fillStyle='#76857c';g.fillRect(p.x-w,p.y-h,2*w,h);
   g.fillStyle='#c0c6ba';g.fillRect(p.x-w-3*p.sc,p.y-h-5*p.sc,
    2*w+6*p.sc,6*p.sc);
   g.restore();
  }
 }

}
window.RunEnvironment={draw,background:(g,W,H)=>g.drawImage(background(W,H),0,0,W,H)};
})();
