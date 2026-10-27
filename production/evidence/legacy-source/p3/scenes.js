/* Phase3, existing SM / SVG / GSAP. Sources only; engine unchanged. */
const film=SM.film({autoSfx:false});
const CHARACTER={"id": "mira", "origin": "Existing Mira design from V1/V2/AB; styling changes only inside new phase3 film", "base": {"color": "#29384a", "shirt": "#48aaa3", "shorts": "#344153", "hat": "beret", "hatColor": "#ed8775", "hair": "ponytail", "face": "dots", "stroke": 0.027}, "skin": "#f2dcc1", "scarf": "#ecc677", "earring": "#ecc677", "shadow": {"filter": "brightness(0)", "opacity": {"street": 0.55, "apartment": 0.38, "subway": 0.5}, "projection": "same rig, no face, shallow skew about groundY; cast link joins feet until deliberate separation"}, "continuity": "same proportions and style tokens for every shot; size changes are shot scale/depth, not rig deformation"};
const CAPTIONS={"omen": [{"text": "Her shadow ducked.", "a": 0.35, "b": 1.583333}, {"text": "Before she did.", "a": 3.35, "b": 4.47}], "aftermath": [{"text": "The sign missed her.", "a": 0.1, "b": 1.29068}], "fear": [{"text": "She hadn't moved first.", "a": 0.1, "b": 1.5680049999999999}], "test": [{"text": "At home,", "a": 0.1, "b": 0.6298954838709677}, {"text": "she tried a test.", "a": 0.6298954838709677, "b": 1.8026760000000002}], "rule": [{"text": "The shadow led by exactly", "a": 0.1, "b": 1.6849016516853932}, {"text": "three seconds.", "a": 1.6849016516853932, "b": 2.634671}], "defiance": [{"text": "Mira held still.", "a": 0.1, "b": 1.3}, {"text": "It reached anyway.", "a": 1.3, "b": 2.511995}, {"text": "Her hand followed.", "a": 3.4, "b": 4.47}], "hand": [{"text": "Could she refuse?", "a": 0.1, "b": 1.333333}], "escape": [{"text": "She took the long way", "a": 0.1, "b": 1.2473170731707317}, {"text": "to the subway.", "a": 1.2473170731707317, "b": 2.08}], "platform": [{"text": "One train.", "a": 0.1, "b": 0.9192059636363636}, {"text": "One way home.", "a": 0.9192059636363636, "b": 2.037347}], "opening": [{"text": "The doors slid open.", "a": 0.1, "b": 1.589342}], "retreat": [{"text": "It stepped back.", "a": 0.2, "b": 1.39068}, {"text": "She followed.", "a": 3.2, "b": 4.22}], "slam": [{"text": "The doors snapped shut.", "a": 0.1, "b": 1.5253290000000002}], "contact": [{"text": "It offered a hand.", "a": 0.25, "b": 1.483333}, {"text": "Mira reached back.", "a": 3.25, "b": 4.47}], "request": [{"text": "Let me choose.", "a": 0.15, "b": 1.255329}], "choice": [{"text": "This time,", "a": 0.1, "b": 0.708377694117647}, {"text": "she stayed behind the line.", "a": 0.708377694117647, "b": 2.314671}], "split": [{"text": "But her shadow didn't.", "a": 0.1, "b": 1.482676}], "boarding": [{"text": "It boarded without her.", "a": 0.1, "b": 1.5040140000000002}], "question": [{"text": "Then who was following whom?", "a": 0.1, "b": 1.7173470000000004}]};
const C={ink:CHARACTER.base.color,teal:CHARACTER.base.shirt,coral:CHARACTER.base.hatColor,gold:CHARACTER.scarf};
function svg(sc,tag,attrs,layer="world"){return SM.el(tag,attrs,sc.layer(layer));}
function rect(sc,x,y,w,h,fill,layer="world",r=0){return sc.rect(x,y,w,h,{fill,stroke:false,layer,r});}
function mira(sc, x, size = 490, y = 855, shadow = false) {
  const f = sc.figure({ x, y, size,  ...CHARACTER.base, head: shadow ? "filled" : undefined });
  f.el.dataset.character = shadow ? "mira-shadow" : "mira";
  const r = f.L.head;
  SM.el("path", { d: `M${-r*.8},${r*.65} Q0,${r*1.15} ${r*.8},${r*.65} L${r*.72},${r*1.03} Q0,${r*1.38} ${-r*.8},${r*1.02} Z M${-r*.55},${r*.95} L${-r*.4},${r*2.05} L${-r*.05},${r*1.9} L${-r*.18},${r*.95} Z`, fill: C.gold }, f.headSvg);
  SM.el("circle", { cx: -r*.63, cy: r*.12, r: r*.09, fill: C.gold }, f.headSvg);
  if (shadow) {
    f.el.style.filter = "brightness(0)";
    f.el.style.opacity = String(sc._env === "apartment" ? .38 : .55);
    const wrapper = SM.div("sm-shadow-projection", sc.mid, { position: "absolute", left: "0px", top: "0px", transform: sc._env === "subway" ? "skewX(8deg)" : "skewX(-8deg)", transformOrigin: "0px "+y+"px" });
    wrapper.appendChild(f.el);
  } else {
    f.emote("neutral", 0);
    f.blinks(.2, sc.dur-.2);
  }
  if(shadow){sc.shadow=f;}else{sc.primary=f;const e=svg(sc,"ellipse",{cx:0,cy:0,rx:size*.16,ry:8,fill:"#243344",opacity:.14},"back");f._foot=sc.thing(e,{x,y:y+3});}
  return f;
}
function env(sc,name){
 sc._env=name;sc.groundY=name==="subway"?835:855;
 const layer={};for(const [i,n]of ['far','mid','fore'].entries()){
  const im=sc.image(`assets/art/${name}/${n}.png`,{x:960,y:540,w:2400,h:1350,layer:n==="fore"?"front":"world"});
  im.el.dataset.environment=name;im.el.dataset.depth=n;im.moveTo(960+[10,-3,-22][i],540+[0,0,2][i],0,sc.dur,"none");layer[n]=im;
 }
 sc.environment=layer;
}
function captions(sc){
 rect(sc,960,1016,1920,128,"#101c2c","ui");
 for(const c of CAPTIONS[sc.id]||[]){const t=sc.text(c.text,{x:960,y:1008,width:1700,size:70,font:"body",weight:650,color:"#fff1dd"});t.el.dataset.caption="true";t.show(c.a);t.hide(c.b);}
}
function label(sc,text,x,y,size=70,color=C.gold,at=0,width){const t=sc.text(text,{x,y,size,color,width});t.in(at,"fade",.2);return t;}
function pose(f,name,t,d=.25,over){return f.pose(name,t,d,"sine.inOut",over);}
function glance(f,t,h=-100){return f.pose(f.p,t,.24,"sine.inOut",{H:h});}
function walk(f,x,t,d,back=false){f.walkTo(x,t,{d,face:!back});if(f._foot)f._foot.moveTo(x,f.g+3,t,d,"none");}
function duck(sc,f,t){pose(f,"crouch",t,.22);sc.to(f.el,{y:f.g-.3358*f.H,duration:.22,ease:"sine.inOut"},t);f.moveTo(f.x-110,t,.35);if(f._foot)f._foot.moveTo(f.x,f.g+3,t,.35,"none");}
function raise(f,t){pose(f,"stand",t,.27,{uaR:-65,faR:-65});}
function breathe(f,t,over){pose(f,"idle",t,.3,over);pose(f,"stand",t+.45,.3,over);}
function cast(sc,m,s){
 const gy=m.g;const d=(mx,sx)=>`M${mx-9},${gy+1} L${mx+14},${gy+5} L${sx+20},${gy+1} L${sx-12},${gy-2}Z`;
 const p=sc.path(d(m.x,s.x),{fill:"#192a3a",color:"#192a3a",width:1,draw:false,visible:true,layer:"back"});p.el.dataset.castLink="true";p.el.style.opacity=".2";
 p.track=(mx,sx,t,dur)=>sc.to(p.pathEl,{attr:{d:d(mx,sx)},duration:dur,ease:"none"},t);sc.cast=p;return p;
}
function sign(sc,fallen=false){
 const g=svg(sc,"g",{},"back");SM.el("rect",{x:-215,y:-52,width:430,height:104,rx:12,fill:"#3c616c",stroke:"#c5bb9f","stroke-width":6},g);SM.el("path",{d:"M-150,0 H-95 M-123,-27 V27 M-50,-18 H155 M-50,17 H80",stroke:"#e8c781","stroke-width":11,"stroke-linecap":"round"},g);
 return sc.thing(g,{x:fallen?880:950,y:fallen?740:235,rotation:fallen?25:0});
}
function train(sc,{open=true,x=0}={}){
 const g=svg(sc,"g",{},"back");
 SM.el("rect",{x:-300,y:282,width:2750,height:553,rx:38,fill:"#9eb9b3",stroke:"#35555e","stroke-width":8},g);
 SM.el("path",{d:"M-300,765 H2450",stroke:"#cb9170","stroke-width":22},g);
 for(const xx of [-50,370,730,1770,2170]){SM.el("rect",{x:xx,y:350,width:265,height:250,rx:17,fill:"#21434f"},g);SM.el("path",{d:`M${xx+20},370 l180,170`,stroke:"#668482","stroke-width":8,opacity:.35},g);}
 SM.el("rect",{x:1090,y:314,width:300,height:521,rx:12,fill:"#213d47"},g);SM.el("rect",{x:1105,y:329,width:270,height:506,rx:5,fill:"#e8bd7c"},g);
 SM.el("path",{d:"M1110,725 H1370 M1130,725 V835 M1350,725 V835",stroke:"#a78469","stroke-width":8},g);
 const root=sc.thing(g,{x,y:0});
 const panels=svg(sc,"g",{},"back");
 function panel(cx){const q=SM.el("g",{},panels);SM.el("rect",{x:-73,y:314,width:146,height:521,rx:7,fill:"#91b1ad",stroke:"#41636a","stroke-width":4},q);SM.el("rect",{x:-55,y:365,width:110,height:200,rx:9,fill:"#234854"},q);SM.el("path",{d:"M-45,380 l70,140",stroke:"#8caba6","stroke-width":5,opacity:.25},q);return sc.thing(q,{x:cx,y:0});}
 const left=panel(open?1020:1165),right=panel(open?1460:1315);sc.to(panels,{x,duration:0},0);
 function openAt(t,d=.6){left.moveTo(1020,0,t,d);right.moveTo(1460,0,t,d);}
 function closeAt(t,d=.35){left.moveTo(1165,0,t,d);right.moveTo(1315,0,t,d);}
 function moveTo(nx,t,d){root.moveTo(nx,0,t,d,"power1.in");sc.to(panels,{x:nx,duration:d,ease:"power1.in"},t);}
 return {root,panels,left,right,openAt,closeAt,moveTo};
}
function close(sc,name,options={}){env(sc,name);captions(sc);const m=mira(sc,options.x||820,options.size||700,options.g||1110);sc.camera.set(options.focusX||840,options.focusY||550,options.k||1.55);return m;}

film.scene("omen",sc=>{
 env(sc,"street");captions(sc);const s=mira(sc,1060,565,855,true),m=mira(sc,760,540,855);const c=cast(sc,m,s),board=sign(sc);
 pose(m,"stand",.05,.2,{H:-98,uaL:108});m.emote("worried",.65);glance(m,1.05,-80);pose(m,"think",1.55,.25);pose(m,"stand",2.4,.25,{H:-105});
 duck(sc,s,.35);glance(s,1.5,-95);glance(s,2.5,-90);duck(sc,m,3.35);m.emote("surprised",4.12);
 c.track(760,950,.35,.35);c.track(650,950,3.35,.35);
 board.rotateTo(3,.2,.2);board.rotateTo(-2,1.2,.25);board.rotateTo(0,2.2,.2);board.moveTo(880,740,3.65,.45,"power2.in");board.rotateTo(25,3.65,.45);sc.fx.puff(880,840,4.1,{n:7});
 sc.camera.set(960,535,1);sc.camera.focus(955,530,1.04,0,3.6);sc.camera.shake(4.1,.22,9);
});
film.scene("aftermath",sc=>{
 env(sc,"street");captions(sc);const b=sign(sc,true);b.wobble(.05,.5,3);sc.fx.puff(880,840,.05,{n:5});
 sc.camera.set(875,760,1.65);sc.camera.focus(880,750,1.75,.1,1.7);
});
film.scene("fear",sc=>{
 const m=close(sc,"street");pose(m,"stand",0,0,{H:-75});m.emote("worried",.05);pose(m,"stand",.65,.3,{H:-103});m.emote("surprised",.9);m.blink(1.45);sc.camera.focus(850,525,1.68,.1,1.8);
});
film.scene("test",sc=>{
 env(sc,"apartment");captions(sc);const s=mira(sc,1110,565,855,true),m=mira(sc,780,550,855);cast(sc,m,s);
 raise(s,.25);pose(m,"stand",.3,.2,{uaL:115,faL:105,H:-97});m.emote("worried",.75);glance(m,1.25,-80);pose(m,"stand",2.0,.3,{uaL:98,faL:94,H:-103});raise(m,3.25);m.emote("surprised",3.55);glance(m,4.0,-91);
 sc.camera.set(970,520,1.02);sc.camera.focus(1010,515,1.1,0,4.4);
});
film.scene("rule",sc=>{
 sc._env="infographic";rect(sc,960,540,5000,3000,"#173040");captions(sc);
 rect(sc,430,480,590,610,"#294c58","world",28);rect(sc,1490,480,590,610,"#294c58","world",28);
 label(sc,"SHADOW: NOW",430,205,68,C.gold);label(sc,"MIRA: +3s",1490,205,68,"#a0ddcb");
 const s=mira(sc,430,365,715,true),m=mira(sc,1490,365,715);s.el.parentNode.style.transform="none";s.el.style.opacity=".8";raise(s,.15);raise(m,3.15);
 sc.line(430,800,1490,800,{color:"#74959a",width:10,draw:false,visible:true});sc.line(430,800,1490,800,{color:C.gold,width:12}).draw(.15,3,"none");const dot=sc.circle(430,800,20,{fill:C.gold,stroke:false});dot.moveTo(1490,800,.15,3,"none");
 label(sc,"0s",430,860,64);label(sc,"3s",1490,860,64);label(sc,"3 SECOND LEAD",960,400,80,C.gold);
});
film.scene("defiance",sc=>{
 env(sc,"apartment");captions(sc);const s=mira(sc,1100,565,855,true),m=mira(sc,760,550,855);cast(sc,m,s);
 pose(s,"armsCross",0,0);s.reach(1290,400,.4,.35);
 pose(m,"armsCross",0,0);m.emote("neutral",0);glance(m,.8,-81);pose(m,"armsCross",1.5,.25,{H:-102});m.emote("worried",2.15);glance(m,2.6,-90);m.reach(950,400,3.4,.35);m.emote("surprised",3.7);
 sc.camera.set(990,510,1.08);sc.camera.focus(1030,480,1.16,.1,4.3);
});
film.scene("hand",sc=>{
 env(sc,"apartment");captions(sc);const m=mira(sc,760,550,855);m.reach(950,400,0,0);m.emote("worried",0);m.pose(m.p,.5,.2,"sine.inOut",{faR:m.p.faR-3});pose(m,"scared",1.2,.35);
 sc.camera.set(920,445,2.15);sc.camera.focus(940,435,2.25,0,1.9);
});
film.scene("escape",sc=>{
 env(sc,"street");captions(sc);const s=mira(sc,1110,545,855,true),m=mira(sc,600,530,855);const c=cast(sc,m,s);
 walk(s,1450,.1,3.8);walk(m,880,.1,2.5);m.emote("worried",.1);pose(m,"stand",2.85,.25,{H:-102});m.turn(2.9);m.turn(3.4);walk(m,1020,3.5,.8);
 c.track(880,1334,.1,2.5);c.track(1020,1450,3.5,.8);sc.camera.set(880,520,1.02);sc.camera.focus(1110,520,1.08,0,4.4,"none");
});
film.scene("platform",sc=>{
 env(sc,"subway");captions(sc);const s=mira(sc,400,550,835,true),m=mira(sc,660,535,835);const c=cast(sc,m,s);walk(m,1000,.1,1.8);walk(s,740,.1,1.8);c.track(1000,740,.1,1.8);m.emote("worried",.7);pose(m,"stand",2.1,.25,{H:-100});m.blink(2.55);
 const tr=train(sc,{open:false,x:1800});tr.moveTo(0,1.5,1.35);sc.camera.set(950,500,1);sc.camera.focus(1090,500,1.04,.1,2.8);
});
film.scene("opening",sc=>{
 env(sc,"subway");captions(sc);const tr=train(sc,{open:false});tr.openAt(.3,.75);sc.camera.set(1240,555,1.65);sc.camera.focus(1240,550,1.76,.1,2.3);
});
film.scene("retreat",sc=>{
 env(sc,"subway");captions(sc);const tr=train(sc,{open:true}),s=mira(sc,880,550,835,true),m=mira(sc,1160,535,835);const c=cast(sc,m,s);
 walk(s,720,.2,.6,true);glance(s,1.4,-100);glance(s,2.5,-89);
 pose(m,"stand",.1,.2,{H:-98});m.emote("worried",.6);glance(m,1.1,-80);pose(m,"stand",2,.25,{uaL:115,faL:100,H:-102});walk(m,1000,3.2,.6,true);m.emote("surprised",3.85);tr.closeAt(3.9,.4);
 c.track(1160,720,.2,.6);c.track(1000,720,3.2,.6);sc.camera.set(1080,520,1.06);sc.camera.focus(1060,515,1.1,.1,4.2);
});
film.scene("slam",sc=>{
 env(sc,"subway");captions(sc);const tr=train(sc,{open:true});tr.closeAt(.03,.17);sc.camera.set(1240,550,1.68);sc.camera.shake(.2,.22,8);sc.fx.flash(.2);sc.camera.focus(1240,540,1.76,.6,1.8);
});
film.scene("contact",sc=>{
 env(sc,"subway");captions(sc);const tr=train(sc,{open:false});const s=mira(sc,680,570,835,true),m=mira(sc,1100,570,835);s.el.parentNode.style.transform="none";m.face(-1,0);cast(sc,m,s);
 s.reach(890,440,.25,.3);m.emote("worried",0);pose(m,"stand",.4,.25,{H:-99,uaL:110,faL:100});glance(m,1.4,-84);pose(m,"stand",2.2,.3,{H:-95,uaL:98,faL:94});m.reach(890,440,3.25,.3);m.emote("neutral",3.6);sc.fx.ripple(890,440,3.6,{n:2});
 sc.camera.set(920,520,1.13);sc.camera.focus(910,500,1.21,.1,4.3);
});
film.scene("request",sc=>{
 const m=close(sc,"subway",{x:850,size:700,g:1110});m.face(-1,0);pose(m,"point",0,0);pose(m,"stand",.25,.4,{H:-94});m.emote("neutral",.2);pose(m,"armsCross",1.0,.35);glance(m,1.8,-84);m.blink(2.3);sc.camera.focus(850,525,1.66,.1,2.8);
});
film.scene("choice",sc=>{
 env(sc,"subway");captions(sc);const tr=train(sc,{open:false}),s=mira(sc,1100,550,835,true),m=mira(sc,970,535,835);const c=cast(sc,m,s);
 m.face(-1,0);walk(m,800,.15,.9);pose(m,"armsCross",1.35,.35);m.emote("neutral",1.35);glance(m,2.25,-97);m.turn(2.8);pose(m,"armsCross",3.25,.25,{H:-84});m.blink(3.8);
 pose(s,"stand",0,0);glance(s,.5,-97);pose(s,"think",1.4,.3);tr.openAt(2.4,.6);pose(s,"stand",2.8,.3,{H:-90});s.face(1,2.8);glance(s,3.7,-75);
 c.track(800,1100,.15,.9);sc.camera.set(1040,520,1.08);sc.camera.focus(1030,510,1,0,4.4);
});
film.scene("split",sc=>{
 env(sc,"subway");captions(sc);train(sc,{open:true});const s=mira(sc,1100,550,835,true),m=mira(sc,800,535,835);pose(m,"armsCross",0,0);const c=cast(sc,m,s);c.fadeOut(.1,.25);walk(s,1180,.15,1.7);m.emote("worried",.6);glance(m,1.1,-82);
 sc.camera.set(1000,730,1.55);sc.camera.focus(1060,700,1.6,.1,1.8);
});
film.scene("boarding",sc=>{
 env(sc,"subway");captions(sc);train(sc,{open:true});const s=mira(sc,1180,550,835,true),m=mira(sc,800,535,835);walk(s,1240,.1,1.2);s.fadeOut(1.35,.5);pose(m,"armsCross",0,0);m.emote("worried",.1);pose(m,"present",.65,.35);m.emote("surprised",1.45);glance(m,1.95,-100);
 sc.camera.set(1040,520,1);sc.camera.focus(1080,515,1.04,0,2.4);
});
film.scene("question",sc=>{
 env(sc,"subway");captions(sc);const tr=train(sc,{open:true});const s=mira(sc,1240,420,830,true),m=mira(sc,800,535,835);s.el.parentNode.style.transform="none";pose(s,"stand",0,0);s.el.style.opacity=".8";
 pose(s,"waveA",.2,.25);pose(s,"waveB",.7,.25);pose(s,"waveA",1.2,.25);const plane=SM.div("sm-shadow-window",sc.cam,{position:"absolute",left:"1090px",top:"340px",width:"300px",height:"300px",overflow:"hidden"});plane.dataset.intentionalCrop="shadow inside train window";const wrapper=s.el.parentNode;wrapper.style.left="-1090px";wrapper.style.top="-340px";plane.appendChild(wrapper);sc.to(plane,{x:1500,duration:1.9,ease:"power1.in"},1.5);tr.closeAt(.3,.5);tr.moveTo(1500,1.5,1.9);
 pose(m,"present",0,0);m.emote("surprised",.15);pose(m,"scared",.8,.3);pose(m,"stand",1.7,.3,{H:-105});m.emote("worried",2.2);m.blink(2.8);
 label(sc,"WHO WAS\nFOLLOWING WHOM?",485,165,64,C.gold,1.8,860);sc.camera.set(1040,520,1);sc.camera.focus(1020,505,.95,.1,3.2);
});
