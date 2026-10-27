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
    const g=svg(sc,"g",{},"front");SM.el("path",{d:"M1750,1040 V650 M1750,870 Q1620,670 1640,630 Q1770,670 1750,870 M1750,780 Q1870,580 1890,650 Q1880,770 1750,820",fill:"#153d3c",stroke:"#153d3c","stroke-width":14},g);SM.el("path",{d:"M1685,910 H1820 L1800,1050 H1700Z",fill:"#75485a"},g);
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
function raise(f,t){return f.pose("stand",t,.28,"sine.inOut",{uaR:-65,faR:-65});}
function duck(sc,f,t){f.pose("crouch",t,.25);sc.to(f.el,{y:f.hipY+70,duration:.25},t);f.moveTo(f.x-120,t,.4);}
function reachUp(f,t){f.pose("stand",t,.3,"sine.inOut",{uaR:-48,faR:-65,H:-100});}
function retreat(sc,f,t,dx=160){f.walkTo(f.x-dx,t,{d:.65,face:false});}


const VERSION=SM_FILM.title.startsWith("[B]")?"B":"A";
function environment(sc){
  let far,mid,fore;
  if(VERSION==="B"){
    far=sc.image("assets/art/far.png",{x:960,y:540,w:2400,h:1350,layer:"world"});
    mid=sc.image("assets/art/mid.png",{x:960,y:540,w:2400,h:1350,layer:"world"});
    fore=sc.image("assets/art/fore.png",{x:960,y:540,w:2400,h:1350,layer:"front"});
    far.moveTo(972,537,0,sc.dur,"none");mid.moveTo(956,540,0,sc.dur,"none");fore.moveTo(932,543,0,sc.dur,"none");
  }else{
    const saved=sc.world;
    const fg=SM.el("g",{},saved);far=sc.thing(fg,{});
    const mg=SM.el("g",{},saved);sc.world=mg;apartment(sc);sc.world=saved;
    mid=sc.thing(mg,{});fore=sc.thing(sc.front.lastChild,{});
    far.moveTo(12,-3,0,sc.dur,"none");mid.moveTo(-4,0,0,sc.dur,"none");fore.moveTo(-28,3,0,sc.dur,"none");
  }
  far.el.dataset.depth="far";mid.el.dataset.depth="mid";fore.el.dataset.depth="fore";
  sc.environment={far,mid,fore};
}
function captions(sc){
  rect(sc,960,1016,1920,128,"#0b1324","ui");
  const chunks=sc.vo.chunks(5);
  chunks.forEach((c,i)=>{const t=sc.text(c.text,{x:960,y:1008,size:70,width:1700,font:"body",weight:700,color:"#fff5e3"});t.el.dataset.caption="true";t.show(c.a);t.hide(Math.min(sc.dur-.03,i===chunks.length-1?c.b+.3:c.b));});
}
function foot(sc,x){const g=svg(sc,"ellipse",{cx:0,cy:0,rx:95,ry:12,fill:"#19263b",opacity:.18},"back");return sc.thing(g,{x,y:859});}
film.scene("enter",sc=>{
  environment(sc);captions(sc);
  const s=mira(sc,1110,565,855,true),m=mira(sc,500,550);const contact=foot(sc,500);
  m.walkTo(780,.1,{d:1.85});contact.moveTo(780,859,.1,1.85,"none");
  raise(s,2);m.emote("worried",2.3);m.blink(3.4);
  const title=sc.text("THREE SECONDS AHEAD",{x:1120,y:90,size:64,color:"#253e4b"});title.in(.2,"fade",.25);title.out(2.3,"fade",.25);
  sc.camera.set(960,540,1);sc.camera.focus(1000,540,1.06,0,4.9,"none");
});
film.scene("respond",sc=>{
  environment(sc);captions(sc);
  const s=mira(sc,1110,565,855,true),m=mira(sc,780,550);foot(sc,780);
  s.pose("stand",0,0,"none",{uaR:-65,faR:-65});raise(m,0);
  m.emote("surprised",.5);m.pose("stand",2,.35,"sine.inOut",{uaR:-65,faR:-65,H:-103});
  m.emote("worried",2.6);m.pose("stand",3.5,.4,"sine.inOut",{uaR:-65,faR:-65,H:-88});
  sc.camera.set(960,540,1.18);sc.camera.focus(1030,520,1.28,0,4.9,"none");
});
film.scene("emotion",sc=>{
  environment(sc);captions(sc);
  const m=mira(sc,820,740,1160);m.emote("worried",0);m.pose("stand",.1,.5,"sine.inOut",{H:-80});
  m.surprise(1.3);m.pose("think",2.5,.5);m.emote("neutral",3);m.pose("think",3.7,.4,"sine.inOut",{H:-98});
  sc.camera.set(810,535,1.62);sc.camera.focus(820,515,1.82,0,4.9,"sine.inOut");
});
