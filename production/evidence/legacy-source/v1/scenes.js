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
function framing(sc, n, subtitle) {
  sc.rect(960, 27, 1920, 54, { fill: "#0b1324", stroke: false, layer: "ui", r: 0 });
  sc.rect(960, 1018, 1920, 124, { fill: "#0b1324", stroke: false, layer: "ui", r: 0 });
  sc.text("WHAT IF / THREE SECONDS AHEAD", { x: 70, y: 27, align: "left", font: "body", size: 21, weight: 600, tracking: ".15em", color: "#bdcedd" }).in(0, "fade", .05);
  sc.text(`0${n} / 07`, { x: 1848, y: 27, align: "right", font: "mono", size: 21, weight: 500, color: "#bdcedd" }).in(0, "fade", .05);
  sc.text(subtitle, { x: 960, y: 1008, width: 1720, font: "body", size: 36, weight: 500, color: "#fff2db" }).in(.18, "fade", .22);
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
function sign(sc) {
  const g = SM.el("g", {}, sc.back);
  SM.el("rect", { x:-235,y:-62,width:470,height:124,rx:12,fill:"#37596b",stroke:"#a5b4b8","stroke-width":7 },g);
  SM.el("path", {d:"M-155,0 H-95 M-125,-30 V30 M-50,-25 H155 M-50,14 H95",stroke:"#ffd272","stroke-width":12,"stroke-linecap":"round"},g);
  return sc.thing(g,{x:1010,y:250});
}

film.scene("street", sc => {
  background(sc); framing(sc,1,"What if your shadow moved three seconds before you did?");
  const s=mira(sc,960,555,855,true), m=mira(sc,510);
  s.walkTo(1100,0,{d:1}); s.turn(1.15); s.pose("think",1.15,.4);
  m.walkTo(650,0,{d:1}); m.turn(4.15); m.pose("think",4.15,.4); m.emote("worried",4.2);
  sc.text("YOUR SHADOW.\nTHREE SECONDS AHEAD.",{x:105,y:174,size:57,align:"left",color:"#fff2db",tracking:"-.025em"}).in(.4,"rise",.6);
  sc.camera.focus(940,570,1.06,0,5.7,"sine.inOut");
});
film.scene("reaction", sc => {
  background(sc,"wall"); framing(sc,2,"Mira stopped. Her shadow looked back. Three seconds later, so did she.");
  const s=mira(sc,1140,575,855,true),m=mira(sc,730,530);
  s.turn(.45); s.lookAt(650,340,.45,.4);
  m.turn(3.45); m.lookAt(1100,330,3.45,.4); m.surprise(4.35); m.emote("surprised",4.35);
  contact(sc,730); sc.camera.set(940,550,1.1); sc.camera.focus(900,535,1.24,1,4.5);
});
film.scene("test", sc => {
  background(sc,"wall"); framing(sc,3,"She raised one hand. The shadow had already done it.");
  const s=mira(sc,1190,565,855,true),m=mira(sc,650,510);
  s.pose("stand",.55,.3,"sine.inOut",{uaR:-65,faR:-65});
  m.pose("stand",3.55,.3,"sine.inOut",{uaR:-65,faR:-65}); m.emote("worried",3.55);
  sc.text("SHADOW",{x:1240,y:190,size:28,font:"mono",color:"#ffd272"}).in(.3,"fade");
  sc.text("MIRA",{x:650,y:190,size:28,font:"mono",color:"#b3f5e9"}).in(.3,"fade");
  ["1","2","3"].forEach((str,i)=>{const tx=sc.text(str,{x:957,y:310,size:108,font:"mono",color:C.gold});tx.in(.55+i,"pop",.18);tx.out(1.43+i,"fade",.1);});
  sc.text("3 SECONDS LATER",{x:960,y:250,size:30,font:"mono",color:C.gold}).in(3.55,"fade",.2);
  sc.camera.set(960,550,1.02); sc.camera.push(0,5.8,1.08);
});
film.scene("danger", sc => {
  background(sc); framing(sc,4,"Then it ducked. Mira followed, just before the sign fell.");
  line(sc,820,100,820,200,"#a6acb5",5);line(sc,1200,100,1200,200,"#a6acb5",5);
  const board=sign(sc); board.rotateTo(3,.5,.25);board.rotateTo(-2,1.1,.3);board.rotateTo(0,1.6,.3);
  const s=mira(sc,1160,555,855,true),m=mira(sc,745,500);
  const duck=(f,t)=>{f.pose("crouch",t,.25);sc.to(f.el,{y:f.hipY+62,duration:.25},t);};
  duck(s,.55); duck(m,3.55);m.emote("worried",3.55);
  board.moveTo(1010,720,4.05,.57,"power2.in");board.rotateTo(23,4.05,.57);board.shake(4.65,.3,8);
  sc.fx.puff(1010,830,4.62,{n:8});sc.camera.set(960,540,1);sc.camera.shake(4.62,.35,13);
});
film.scene("realization", sc => {
  background(sc,"wall"); framing(sc,5,"It wasn't copying her. It was keeping her alive.");
  const m=mira(sc,820,680,1100); m.pose("stand",.2,.5,"sine.inOut",{H:-76});m.emote("worried",.2);
  m.pose("stand",2,.6,"sine.inOut",{H:-102});m.emote("neutral",2.7);m.nod(3.15,1);m.emote("happy",3.8);
  sc.camera.set(845,565,1.58);sc.camera.focus(850,540,1.77,.5,4.1,"sine.inOut");
  sc.text("A WARNING.",{x:1300,y:270,size:59,color:C.gold,align:"left"}).in(2.4,"fade",.6);
});
film.scene("door", sc => {
  background(sc,"door"); framing(sc,6,"At her door, it pointed away. This time, Mira listened.");
  const s=mira(sc,1110,555,855,true),m=mira(sc,775,500);
  s.face(-1,0);s.pose("point",.5,.3);
  m.face(-1,3.5); m.lookAt(300,470,3.5,.3);m.walkTo(510,4.1,{d:1.65});
  sc.camera.set(1110,540,1.08);sc.camera.focus(1050,540,1.02,.4,5.3);
  sc.text("HOME",{x:1430,y:340,size:26,font:"mono",color:"#f6c9b3"}).in(.15,"fade");
});
film.scene("ending", sc => {
  background(sc,"door"); framing(sc,7,"But when she walked away... whose shadow stayed behind?");
  const s=mira(sc,1110,555,855,true),m=mira(sc,510,500);m.face(-1,0);m.walkTo(-160,.1,{d:3.2});
  s.face(-1,0);s.pose("point",0,0);s.pose("stand",1.4,.4);s.pose("waveA",2.65,.35);s.pose("waveB",3.1,.35);s.pose("waveA",3.55,.35);
  sc.camera.set(1000,550,1.04);sc.camera.focus(1080,510,.91,.2,5.6,"sine.inOut");
  sc.text("WHOSE SHADOW\nSTAYED BEHIND?",{x:550,y:265,size:66,color:"#fff2db",align:"center"}).in(3.9,"fade",.7);
});
