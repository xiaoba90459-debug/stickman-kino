/* Original short: Three Seconds Ahead. Existing SM rigs, SVG scenery and GSAP only. */
const film = SM.film({ autoSfx: false });
const C = { coral: "#ff806c", teal: "#38b9b0", gold: "#ffd272", ink: "#15263e", shadow: "#171329" };

function svg(sc, tag, attrs, layer = "world") { return SM.el(tag, attrs, sc.layer(layer)); }
function line(sc, x1, y1, x2, y2, color, width = 3) {
  return sc.line(x1, y1, x2, y2, { color, width, draw: false, visible: true, layer: "world" });
}
function gradient(sc, name, a, b) {
  const id = sc.id + name, defs = SM.el("defs", {}, sc.world);
  const g = SM.el("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  SM.el("stop", { offset: "0%", "stop-color": a }, g);
  SM.el("stop", { offset: "100%", "stop-color": b }, g);
  return `url(#${id})`;
}
function lamp(sc, x, warm = true) {
  const col = warm ? "#ffdc9b" : "#91d5ed";
  svg(sc, "path", { d: `M${x},170 L${x-370},855 H${x+420} Z`, fill: col, opacity: .105 });
  line(sc, x, 170, x, 850, "#37485e", 13);
  sc.rect(x, 173, 160, 30, { fill: col, stroke: false, layer: "world" });
  svg(sc, "ellipse", { cx: x+20, cy: 860, rx: 360, ry: 25, fill: col, opacity: .08 });
}
function background(sc, kind = "street") {
  const wall = kind === "door" ? ["#392a42", "#765065"] : kind === "wall" ? ["#433650", "#8a6a72"] : ["#182a45", "#52516a"];
  svg(sc, "rect", { x: -2500, y: -2000, width: 7000, height: 5000, fill: gradient(sc, "sky", "#0e192e", "#344762") });
  sc.env.city({ y: 385, height: 350, fill: "#1f3049", color: "#435776", opacity: .85, x0: -2000, x1: 4000 });
  svg(sc, "circle", { cx: 1480, cy: 155, r: 44, fill: "#c8d4db", opacity: .55 });
  svg(sc, "rect", { x: -2000, y: 280, width: 6000, height: 575, fill: gradient(sc, "wall", ...wall) });
  for (let y = 330; y < 850; y += 68) {
    line(sc, -2000, y, 4000, y, "#b8a3aa", 2).el.style.opacity = .12;
    for (let x = -300 + (y % 136 ? 0 : 125); x < 2500; x += 250)
      line(sc, x, y, x, y+68, "#b8a3aa", 2).el.style.opacity = .12;
  }
  svg(sc, "rect", { x: -2000, y: 855, width: 6000, height: 1700, fill: gradient(sc, "road", "#26364b", "#0e172b") });
  line(sc, -2000, 856, 4000, 856, "#9e9eb1", 5);
  line(sc, -2000, 879, 4000, 879, "#111c30", 7);
  for (let i = 0; i < 10; i++) {
    const x = 110 + i * 205;
    svg(sc, "path", { d: `M${x},910 l115,0 M${x+42},947 l180,0`, stroke: i%2 ? "#d9ac76" : "#7990ac", "stroke-width": 3, opacity: .15 });
  }
  lamp(sc, kind === "wall" ? 300 : 330);
  lamp(sc, 1750, false);
  if (kind === "door") {
    sc.rect(1425, 602, 364, 506, { fill: "#171f32", color: "#b18a88", width: 12, layer: "world", r: 150 });
    sc.rect(1425, 659, 278, 390, { fill: "#783e4a", color: "#d18b84", width: 6, layer: "world", r: 10 });
    sc.rect(1425, 554, 184, 104, { fill: "#111c2c", color: "#b56869", width: 4, layer: "world", r: 3 });
    sc.circle(1517, 685, 10, { fill: C.gold, stroke: false, layer: "world" });
    svg(sc, "path", { d: "M1230,370 H1620 M1240,863 H1640", stroke: "#d8b19a", "stroke-width": 9 });
    sc.rect(1140, 545, 100, 170, { fill: "#343247", color: "#9c7a7f", width: 5, layer: "world" });
    sc.circle(1140, 510, 11, { fill: C.coral, stroke: false, layer: "world" });
  }
  if (kind === "street") {
    sc.rect(1650, 612, 190, 287, { fill: "#26364b", color: "#62758b", width: 6, layer: "world", r: 2 });
    for(let i=0;i<4;i++) line(sc,1560,505+i*46,1740,505+i*46,"#3f536c",4);
    sc.prop("bin", { x: 1760, y: 790, size: 132, layer: "world", color: "#6f88a1" });
  }
}
function mira(sc, x, size = 490, y = 855, shadow = false) {
  const f = sc.figure({ x, y, size, stroke: .035, color: C.ink, shirt: C.teal, shorts: "#26364c", hat: "beret", hatColor: C.coral, hair: "ponytail", face: "dots", head: shadow ? "filled" : undefined });
  f.el.dataset.character = shadow ? "mira-shadow" : "mira";
  const r = f.L.head;
  SM.el("path", { d: `M${-r*.8},${r*.65} Q0,${r*1.15} ${r*.8},${r*.65} L${r*.72},${r*1.03} Q0,${r*1.38} ${-r*.8},${r*1.02} Z M${-r*.55},${r*.95} L${-r*.4},${r*2.05} L${-r*.05},${r*1.9} L${-r*.18},${r*.95} Z`, fill: C.gold }, f.headSvg);
  SM.el("circle", { cx: -r*.63, cy: r*.12, r: r*.09, fill: C.gold }, f.headSvg);
  if (shadow) {
    f.el.style.filter = "brightness(0)";
    f.el.style.opacity = ".64";
    const wrapper = SM.div("sm-shadow-projection", sc.mid, { position: "absolute", left: "0px", top: "0px", transform: "skewX(-12deg)", transformOrigin: "0px 855px" });
    wrapper.appendChild(f.el);
  } else {
    f.emote("neutral", 0);
    f.blinks(.2, sc.dur-.2);
  }
  return f;
}
function contact(sc, x, y = 856, width = 125) { svg(sc, "ellipse", { cx:x,cy:y+4,rx:width,ry:15,fill:"#0a1020",opacity:.55 }, "back"); }
// V2: shot-specific staging, independent inserts and three distinct locations.
function frame(sc) {
  sc.rect(960,990,1920,180,{fill:"#0b1324",stroke:false,layer:"ui",r:0});
  const overrides={dodge:[{text:"It ducked.",a:.2,b:1.4},{text:"She ducked.",a:3.2,b:4.1},{text:"Just in time.",a:4.15,b:4.96}],retreat:[{text:"Her shadow stepped back.",a:.25,b:1.9},{text:"She stepped back.",a:3.25,b:4.85}]};
  const chunks=overrides[sc.id]||sc.vo.chunks(5);
  chunks.forEach((c,i)=>{
    const tx=sc.text(c.text,{x:960,y:982,width:1700,font:"body",size:72,weight:700,color:"#fff5e3"});
    tx.el.dataset.caption="speech";
    tx.show(c.a);
    tx.hide(Math.min(sc.dur-.04,i===chunks.length-1?c.b+.25:c.b));
  });
}
function rect(sc,x,y,w,h,fill,layer="world",r=0){return sc.rect(x,y,w,h,{fill,stroke:false,layer,r});}
function txt(sc,str,x,y,size=72,color="#fff5e3",o={}) {const t=sc.text(str,{x,y,size,color,...o});t.in(0,"fade",.06);return t;}
function foreground(sc,kind){
  if(kind==="street"){
    const g=svg(sc,"g",{},"front");
    SM.el("path",{d:"M-160,500 Q40,100 260,500 Q175,425 110,500 Q50,440 -15,500 Q-90,440 -160,500Z",fill:"#101b2c"},g);
    SM.el("path",{d:"M40,450 V910",stroke:"#17273e","stroke-width":14},g);
    sc.to(g,{x:-55,duration:sc.dur,ease:"none"},0);
    for(let i=0;i<12;i++){const x=120+i*165;const rain=svg(sc,"path",{d:`M${x},90 l-28,100 M${x+40},600 l-28,100`,stroke:"#a8c9d9","stroke-width":3,opacity:.23},"front");sc.to(rain,{x:-40,y:100,duration:sc.dur,ease:"none"},0);}
  }else if(kind==="apartment"){
    const g=svg(sc,"g",{},"front");SM.el("path",{d:"M1750,1040 V650 M1750,870 Q1620,670 1640,630 Q1770,670 1750,870 M1750,780 Q1870,580 1890,650 Q1880,770 1750,820",fill:"#153d3c",stroke:"#153d3c","stroke-width":14},g);SM.el("path",{d:"M1685,910 H1820 L1800,1050 H1700Z",fill:"#75485a"},g);sc.to(g,{x:22,duration:sc.dur,ease:"sine.inOut"},0);
  }else{
    rect(sc,25,470,180,1100,"#102e39","front");rect(sc,1890,470,100,1100,"#102e39","front");
    line(sc,85,110,85,900,"#37606a",8);
  }
}
function apartment(sc,{shelf=true}={}){
  svg(sc,"rect",{x:-2500,y:-2000,width:7000,height:5000,fill:gradient(sc,"warm","#f0c692","#b98072")});
  rect(sc,960,870,5000,230,"#7f655f");
  for(let i=-5;i<14;i++)line(sc,960+i*180,855,960+i*310,1100,"#a68b7e",3);
  rect(sc,320,355,390,490,"#77566c", "world",14);rect(sc,320,350,336,430,"#283c59","world",5);
  svg(sc,"circle",{cx:390,cy:220,r:32,fill:"#f8d9a4"});line(sc,320,130,320,565,"#dfc1a0",14);line(sc,150,360,490,360,"#dfc1a0",12);
  rect(sc,960,846,5000,25,"#f5d9b2");
  svg(sc,"path",{d:"M125,140 L60,780 L155,780 L175,140 M465,140 L510,780 L585,780 L510,140",fill:"#b05e67"});
  sc.prop("sofa",{x:330,y:740,size:520,accent:"#a76066",layer:"world"});
  rect(sc,1570,535,210,580,"#5e5155","world",4);
  for(let r=0;r<4;r++){rect(sc,1570,345+r*140,200,16,"#e0b58d");for(let b=0;b<5;b++)rect(sc,1498+b*35,290+r*140,22+(b%2)*6,90+(b%3)*10,["#487a78","#c7776b","#e4bd73","#664e69","#8faaa0"][b]);}
  line(sc,580,820,580,560,"#685668",12);svg(sc,"path",{d:"M500,620 L530,515 H630 L660,620Z",fill:"#f4cb7d",stroke:"#685668","stroke-width":6});
  svg(sc,"ellipse",{cx:1050,cy:853,rx:520,ry:30,fill:"#e3b59a",opacity:.45});
  if(shelf){rect(sc,1130,285,420,24,"#75585d");line(sc,990,295,1010,340,"#75585d",9);line(sc,1280,295,1260,340,"#75585d",9);}
  foreground(sc,"apartment");
}
function pot(sc,x=1150,y=207,size=150){return sc.prop("plant",{x,y,size,accent:"#c2685c",layer:"back"});}
function station(sc,{bench=true}={}){
  svg(sc,"rect",{x:-2500,y:-2000,width:7000,height:5000,fill:gradient(sc,"station","#3e7f82","#133e4c")});
  for(let x=-2000;x<4000;x+=140)line(sc,x,120,x,850,"#69a2a1",2).el.style.opacity=.3;
  for(let y=120;y<850;y+=120)line(sc,-2000,y,4000,y,"#69a2a1",2).el.style.opacity=.3;
  rect(sc,960,200,4400,24,"#f1c570");rect(sc,960,820,4400,65,"#759491");rect(sc,960,864,4400,24,"#ffce65");rect(sc,960,920,4400,90,"#0b222e");
  for(let x=-2000;x<4000;x+=170)rect(sc,x,878,70,6,"#263c42");
  rect(sc,970,100,4700,110,"#173c49");for(let x=100;x<2200;x+=620)rect(sc,x,120,430,20,"#c0e7d9");
  rect(sc,300,330,390,210,"#e0e3c7","world",12);
  const route=svg(sc,"path",{d:"M145,360 H220 L270,290 H365 L410,350 H450",fill:"none",stroke:"#bd665f","stroke-width":12});
  [[150,360],[270,290],[365,290],[450,350]].forEach(([cx,cy])=>svg(sc,"circle",{cx,cy,r:12,fill:"#173c49"}));
  rect(sc,1450,190,530,110,"#14313e","world",8);svg(sc,"text",{x:1450,y:210,"text-anchor":"middle","font-family":"Inter","font-weight":700,"font-size":64,fill:"#f8e4b9"}).textContent="NORTH LINE";
  if(bench){rect(sc,1530,720,360,70,"#c18a6b","world",12);line(sc,1400,750,1400,835,"#24454b",17);line(sc,1650,750,1650,835,"#24454b",17);rect(sc,1530,646,360,40,"#c18a6b","world",8);}
  foreground(sc,"subway");
}
function sideTrain(sc,x=2250,y=520,layer="back"){
  const g=svg(sc,"g",{},layer);
  SM.el("rect",{x:-1200,y:-230,width:2400,height:540,rx:34,fill:"#a5c6c2",stroke:"#244b58","stroke-width":10},g);
  SM.el("path",{d:"M-1200,215 H1200",stroke:"#df8f67","stroke-width":24},g);
  for(let i=-3;i<=3;i++){
    const px=i*360;
    SM.el("rect",{x:px-105,y:-160,width:210,height:180,rx:13,fill:"#163c4b"},g);
    SM.el("path",{d:`M${px-80},-145 l140,135`,stroke:"#2e5c67","stroke-width":10},g);
  }
  return sc.thing(g,{x,y});
}
function closeFace(sc,env,id){
  if(env==="street"){background(sc);foreground(sc,"street");}else if(env==="apartment")apartment(sc);else station(sc);
  const m=mira(sc,820,740,1160);m.el.dataset.role=id;
  sc.camera.set(850,570,1.55);return m;
}
function raise(f,t){return f.pose("stand",t,.28,"sine.inOut",{uaR:-65,faR:-65});}
function duck(sc,f,t){f.pose("crouch",t,.25);sc.to(f.el,{y:f.hipY+70,duration:.25},t);f.moveTo(f.x-120,t,.4);}
function reachUp(f,t){f.pose("stand",t,.3,"sine.inOut",{uaR:-48,faR:-65,H:-100});}
function retreat(sc,f,t,dx=160){f.walkTo(f.x-dx,t,{d:.65,face:false});}

film.scene("hook",sc=>{
  background(sc);foreground(sc,"street");frame(sc);
  const s=mira(sc,940,565,855,true),m=mira(sc,610,540);
  m.walkTo(750,.1,{d:1.05});m.pose("stand",1.3,.2);m.emote("worried",1.5);
  raise(s,.25);raise(m,3.25);
  txt(sc,"3 SECONDS\nBEFORE YOU.",1530,180,82,C.gold,{width:600});
  sc.camera.focus(990,530,1.04,0,3.4,"none");
});
film.scene("shock",sc=>{
  const m=closeFace(sc,"street","reaction");frame(sc);
  m.turn(.2);m.surprise(.45);m.moveTo(730,.9,.45);m.pose("scared",1.4,.3);m.emote("worried",1.4);
  sc.camera.focus(800,540,1.7,.3,2.5);
});
film.scene("home-test",sc=>{
  apartment(sc);frame(sc);pot(sc);
  const s=mira(sc,1110,565,855,true),m=mira(sc,780,550);
  raise(s,.25);raise(m,3.25);m.emote("worried",3.25);
  txt(sc,"TRY IT.",800,135,86,"#253e4b");sc.camera.set(1000,510,1.03);sc.camera.push(.2,4.1,1.08);
});
film.scene("rule",sc=>{
  rect(sc,960,540,6000,4000,"#102837");frame(sc);
  rect(sc,430,485,600,620,"#244855","world",30);rect(sc,1490,485,600,620,"#244855","world",30);
  txt(sc,"THE THREE-SECOND RULE",960,100,76,C.gold);
  txt(sc,"SHADOW: NOW",430,245,64,C.gold);txt(sc,"MIRA: +3s",1490,245,64,"#a5f2df");
  const s=mira(sc,430,380,715,true),m=mira(sc,1490,380,715);raise(s,.3);raise(m,3.3);
  sc.line(430,800,1490,800,{color:"#6a8b92",width:10,draw:false,visible:true});
  sc.line(430,800,1490,800,{color:C.gold,width:12}).draw(.3,3,"none");
  const cursor=sc.circle(430,800,20,{fill:C.gold,stroke:false});cursor.moveTo(1490,800,.3,3,"none");
  txt(sc,"0s",430,863,64);txt(sc,"3s",1490,863,64);
  [1,2,3].forEach((v,i)=>{const t=sc.text(String(v),{x:960,y:450,size:150,color:C.gold,font:"mono"});t.in(.3+i,"pop",.15);t.out(1.2+i,"fade",.1);});
  const t=sc.text("YOU CATCH UP",{x:960,y:650,size:68,color:"#a5f2df"});t.in(3.3,"rise",.25);
});
film.scene("shelf",sc=>{
  apartment(sc);frame(sc);pot(sc,1200,207);
  const s=mira(sc,1100,565,855,true),m=mira(sc,740,550);
  reachUp(s,.25);reachUp(m,3.25);m.emote("worried",1.3);
  sc.camera.set(1020,500,1.12);sc.camera.focus(1100,460,1.2,.2,4.1);
});
film.scene("pot",sc=>{
  apartment(sc);frame(sc);
  const p=pot(sc,1200,198,170);p.rotateTo(9,.2,.6);p.moveTo(1220,204,.2,1.5);p.rotateTo(23,1.2,.9);
  sc.camera.set(1220,260,2.15);sc.camera.focus(1250,275,2.3,0,2.4);
  for(let i=0;i<4;i++){const d=sc.circle(1250+i*12,300,3,{fill:"#8f6259",stroke:false,hidden:true});d.fadeIn(.7+i*.15,.1);d.moveTo(1250+i*12,430,.8+i*.15,1.1);}
});
film.scene("dodge",sc=>{
  apartment(sc);frame(sc);
  const p=pot(sc,1200,198,170),s=mira(sc,1180,565,855,true),m=mira(sc,850,550);
  duck(sc,s,.2);duck(sc,m,3.2);m.emote("surprised",3.2);
  p.moveTo(900,760,3.45,.45,"power2.in");p.rotateTo(100,3.45,.45);p.popOut(3.9,.08);
  sc.fx.puff(900,835,3.9,{n:8});
  for(let i=0;i<5;i++){
    const chip=sc.path(`M${885+i*12},833 l12,-20 l14,23 Z`,{fill:"#c2685c",color:"#754d4d",draw:false,visible:true,hidden:true,layer:"front"});chip.show(3.92);
  }
  sc.camera.set(1020,520,1.03);sc.camera.shake(3.9,.24,10);
});
film.scene("station",sc=>{
  station(sc);frame(sc);
  const s=mira(sc,1150,535,835,true),m=mira(sc,530,520,835);
  s.walkTo(1380,.1,{d:2.8});m.walkTo(950,.15,{d:3.3});m.emote("worried",.2);
  txt(sc,"THE SUBWAY",700,230,94,C.gold);
  sc.camera.set(900,490,1);sc.camera.focus(1120,490,1.06,0,3.9,"none");
});
film.scene("arrival",sc=>{
  station(sc,{bench:false});frame(sc);
  const tr=sideTrain(sc,2450,510);tr.moveTo(1320,510,.3,2.6,"power1.in");
  
  sc.camera.set(1180,620,1.18);sc.camera.focus(1280,625,1.24,0,2.9);
  const paper=sc.rect(690,780,80,55,{fill:"#d8d5b9",color:"#87a7a5",width:3,layer:"front"});paper.arcTo(1260,770,.6,2,100,{spin:330});
});
film.scene("retreat",sc=>{
  station(sc);frame(sc);
  const tr=sideTrain(sc,2600,520);tr.moveTo(1200,520,3.6,.8,"power1.in");
  const s=mira(sc,1190,565,835,true),m=mira(sc,840,550,835);
  retreat(sc,s,.25);retreat(sc,m,3.25);m.emote("worried",3.25);
  txt(sc,"STAY BACK",790,240,80,C.gold);
  sc.camera.set(960,510,1.08);
});
film.scene("relief",sc=>{
  const m=closeFace(sc,"subway","relief");frame(sc);
  m.pose("scared",0,0);m.pose("stand",.5,.6,"sine.inOut",{H:-84});m.emote("neutral",1.1);m.nod(1.6,1);
  const train=sideTrain(sc,2800,560,"front");train.moveTo(-2700,560,0,.75,"none");
  const warning=sc.text("A WARNING.",{x:1350,y:250,size:88,color:C.gold});warning.in(1,"fade",.25);sc.camera.focus(850,550,1.68,.9,2.4);
});
film.scene("contact",sc=>{
  station(sc,{bench:false});frame(sc);
  const s=mira(sc,680,570,835,true),m=mira(sc,1100,570,835);
  s.el.parentNode.style.transform="none";m.face(-1,0);
  s.reach(890,440,.25,.3);m.reach(890,440,3.25,.3);m.emote("worried",.25);
  sc.fx.ripple(890,440,3.6,{n:2});
  sc.camera.set(915,530,1.22);sc.camera.push(.1,4.3,1.3);
});
film.scene("choice",sc=>{
  station(sc);frame(sc);
  const m=mira(sc,970,650,965);m.face(-1,0);m.pose("stand",.1,.3,"sine.inOut",{H:-86});m.walkTo(800,.5,{d:.8});m.pose("armsCross",1.5,.4);m.emote("neutral",1.7);
  sc.camera.set(910,480,1.42);sc.camera.focus(900,460,1.52,.2,3.1);
  txt(sc,"HER CHOICE.",1410,260,80,C.gold);
});
film.scene("twist",sc=>{
  station(sc,{bench:false});frame(sc);
  const tr=sideTrain(sc,1000,520);
  rect(sc,1430,555,275,515,"#142c38","back",5);rect(sc,1430,550,245,475,"#efc681","back",3);
  const s=mira(sc,1040,545,835,true),m=mira(sc,620,540,835);s.el.parentNode.style.transform="none";
  s.walkTo(1430,.3,{d:1.65});s.fadeOut(1.95,.45);m.surprise(2.2);m.emote("surprised",2.2);
  const left=rect(sc,1300,555,130,515,"#95b9b7","front",5),right=rect(sc,1560,555,130,515,"#95b9b7","front",5);
  left.moveTo(1363,555,2.45,.35);right.moveTo(1497,555,2.45,.35);
  const title=sc.text("WHO IS\nIN CONTROL?",{x:600,y:225,size:96,color:C.gold});title.in(2.7,"rise",.4);
  sc.camera.set(1000,515,1);sc.camera.focus(990,490,.95,.2,3.7);
});
