/* Generic production adapter. No story title, narration, year or beat ID belongs here.
 * Calls the unchanged Stickman Kino SVG / GSAP rig. DATA is generated JSON. */
(function (DATA) {
  "use strict";
  const film = SM.film({ autoSfx: false });
  const rect = (sc, x, y, w, h, fill, layer = "back", r = 0) =>
    sc.rect(x, y, w, h, { fill, stroke: false, layer, r });
  function text(
    sc,
    str,
    x,
    y,
    size = 64,
    width = 700,
    layer = "world",
    color = "#f7e7c8",
  ) {
    return sc.text(str, {
      x,
      y,
      size,
      width,
      font: "body",
      weight: 700,
      color,
      world: layer !== "ui",
      layer,
    });
  }
  function door(sc, o) {
    const x = o.x ?? 1240,
      g = o.y ?? 850,
      w = o.width ?? 320,
      h = o.height ?? 550;
    rect(sc, x, g - h / 2, w + 34, h + 28, "#344e5b");
    rect(sc, x, g - h / 2, w, h, "#e3bb78");
    const year = text(
      sc,
      o.text || "?",
      x,
      g - h * 0.63,
      76,
      w - 20,
      "world",
      "#273b4c",
    );
    year.in(0, "fade", 0.01);
    const reveal = o.revealText
      ? text(sc, o.revealText, x, g - h * 0.63, 76, w - 20, "world", "#273b4c")
      : null;
    if (reveal) reveal.hide(0);
    const panel = SM.el("g", {}, sc.back);
    SM.el(
      "rect",
      {
        x: -w / 2,
        y: -h,
        width: w,
        height: h,
        rx: 8,
        fill: o.color || "#527c8d",
        stroke: "#293f4f",
        "stroke-width": 6,
      },
      panel,
    );
    SM.el(
      "path",
      {
        d: `M${-w * 0.38},${-h * 0.82} H${w * 0.38} V${-h * 0.2} H${-w * 0.38}Z`,
        stroke: "#8aa6ab",
        "stroke-width": 4,
        fill: "none",
      },
      panel,
    );
    SM.el(
      "circle",
      { cx: -w * 0.38, cy: -h * 0.47, r: 12, fill: "#e6c26f" },
      panel,
    );
    const p = sc.thing(panel, { x, y: g });
    panel.style.transformOrigin = `${w / 2}px ${-h / 2}px`;
    const start = o.state === "open" ? 0.07 : 1;
    sc.to(panel, { scaleX: start, duration: 0 }, 0);
    if (o.state !== "open") year.hide(0);
    return {
      el: panel,
      thing: p,
      x,
      y: g - h * 0.47,
      anchor: { x: x - w * 0.38, y: g - h * 0.47 },
      open(t, d = 0.5) {
        if (reveal) {
          year.hide(t + 0.2);
          reveal.show(t + 0.2);
        } else year.show(t + 0.2);
        sc.to(panel, { scaleX: 0.07, duration: d, ease: "sine.inOut" }, t);
      },
      close(t, d = 0.5) {
        year.hide(t + 0.25);
        if (reveal) reveal.hide(t + 0.25);
        sc.to(panel, { scaleX: 1, duration: d, ease: "sine.inOut" }, t);
      },
    };
  }
  function prop(sc, o) {
    if (o.type === "door") return door(sc, o);
    const x = o.x ?? 1240,
      y = o.y ?? 500;
    if (o.type === "document") {
      const g = SM.el("g", {}, sc.back);
      SM.el(
        "rect",
        {
          x: -270,
          y: -170,
          width: 540,
          height: 340,
          rx: 12,
          fill: "#f3dfb8",
          stroke: "#526875",
          "stroke-width": 6,
        },
        g,
      );
      for (const yy of [90, 120])
        SM.el(
          "path",
          { d: `M-200,${yy} H200`, stroke: "#ac9b7c", "stroke-width": 7 },
          g,
        );
      const p = sc.thing(g, { x, y });
      const tx = text(sc, o.text || "", x, y - 35, 64, 500, "world", "#273b4c");
      tx.in(0, "fade", 0.01);
      return { el: g, thing: p, x, y, anchor: { x: x - 220, y }, label: tx };
    }
    const p = sc.prop(o.type, {
      x,
      y,
      size: o.size || 160,
      layer: "back",
      accent: "#e4bd72",
    });
    return { el: p.el, thing: p, x, y, anchor: { x, y } };
  }
  function environment(sc, s) {
    const bg = DATA.backgrounds.backgrounds[s.environment];
    sc.groundY = bg.ground;
    sc.environment = {};
    for (const l of bg.layers) {
      const im = sc.image(l.runtimeFile, {
        x: 960,
        y: 540,
        w: 2400,
        h: 1350,
        layer: l.depth === "fore" ? "front" : "world",
      });
      im.el.dataset.depth = l.depth;
      im.moveTo(960 + l.dx, 540, 0, sc.dur, "none");
      sc.environment[l.depth] = im;
    }
  }
  function actor(sc, id, stage) {
    const c = DATA.characters[id];
    const f = sc.figure({
      ...c,
      x: stage.x,
      y: stage.ground,
      size: stage.size,
      facing: stage.facing || 1,
    });
    f.el.dataset.character = id;
    f.el.dataset.identity = JSON.stringify(c);
    f.emote("neutral", 0);
    f.blinks(0.15, sc.dur - 0.1);
    const e = SM.el(
      "ellipse",
      {
        cx: 0,
        cy: 0,
        rx: stage.size * 0.14,
        ry: 7,
        fill: "#243744",
        opacity: 0.16,
      },
      sc.back,
    );
    f._foot = sc.thing(e, { x: stage.x, y: stage.ground + 3 });
    return f;
  }
  function doAction(sc, a, actors, props) {
    const d = DATA.actions[a.verb],
      f = actors[a.actor],
      p = props[a.target],
      t = a.at;
    if (d.kind === "pose") {
      f.pose(d.pose, t, d.duration, "sine.inOut", d.overrides);
      if (d.emotion) f.emote(d.emotion, t + 0.02);
    } else if (d.kind === "micro") {
      const head = f.p.H || -90;
      f.pose(f.p, t, d.duration, "sine.inOut", {
        H: head + (Math.floor(t) % 2 ? 4 : -4),
      });
    } else if (d.kind === "locomotion") {
      const dest = f.x + (a.dx ?? d.dx);
      f.walkTo(dest, t, { d: d.duration, face: d.face !== false });
      f._foot.moveTo(dest, f.g + 3, t, d.duration, "none");
    } else if (d.kind === "reach")
      f.reach(p.anchor.x, p.anchor.y, t, d.duration);
    else if (d.kind === "point") f.point(p.anchor.x, p.anchor.y, t);
    else if (d.kind === "turn") f.turn(t);
    else if (d.kind === "wave") {
      f.pose("waveA", t, 0.25);
      f.pose("waveB", t + 0.4, 0.25);
    } else if (d.kind === "door") {
      f.reach(p.anchor.x, p.anchor.y, t, 0.35);
      p[d.state === "open" ? "open" : "close"](t + 0.4, 0.5);
      f.emote(d.state === "open" ? "worried" : "neutral", t + 0.45);
    } else if (d.kind === "knock") {
      f.reach(p.anchor.x, p.anchor.y, t, 0.25);
      sc.fx.ripple(p.anchor.x, p.anchor.y, t + 0.3, { n: 2 });
    } else if (d.kind === "prop-fade") {
      p.thing.fadeOut(t, d.duration);
      if (p.label) p.label.out(t, "fade", d.duration);
    } else if (d.kind === "prop-shake") {
      p.thing.shake(t, d.duration, 7);
    } else throw new Error("Unsupported production adapter kind " + d.kind);
  }
  function infographic(sc, s) {
    rect(
      sc,
      960,
      540,
      5000,
      3000,
      DATA.backgrounds.graphic.background,
      "world",
    );
    text(sc, s.headline || "", 960, 160, 72, 1730, "ui").in(0.05, "fade", 0.25);
    const n = s.values.length,
      gap = n === 4 ? 435 : 550,
      start = 960 - (gap * (n - 1)) / 2;
    const cards = [];
    s.values.forEach((v, i) => {
      const x = start + i * gap;
      const box = rect(
        sc,
        x,
        490,
        n === 4 ? 370 : 460,
        390,
        "#294d5a",
        "world",
        24,
      );
      box.fadeIn(0.1 + i * 0.25, 0.25);
      text(sc, v, x, 490, 64, n === 4 ? 340 : 420).in(
        0.2 + i * 0.35,
        "rise",
        0.3,
      );
      cards.push(box);
      if (i)
        sc.arrow(
          x - gap + (n === 4 ? 195 : 240),
          490,
          x - (n === 4 ? 195 : 240),
          490,
          { color: "#e6c26f", width: 9, head: 18 },
        ).draw(0.25 + i * 0.35, 0.35);
    });
    const dot = sc.circle(start, 760, 18, { fill: "#e6c26f", stroke: false });
    dot.moveTo(
      start + gap * (n - 1),
      760,
      0.3,
      Math.max(0.5, sc.dur - 0.7),
      "none",
    );
    if (s.ruleMode === "erase") {
      cards[0].fadeOut(sc.dur * 0.5, 0.4);
      sc.line(start - 150, 410, start + 150, 570, {
        color: "#ed9581",
        width: 12,
      }).draw(sc.dur * 0.5, 0.35);
    }
  }
  function captions(sc, s) {
    rect(sc, 960, 1016, 1920, 128, "#101c2c", "ui");
    for (const c of s.captions) {
      const tx = text(
        sc,
        c.text,
        960,
        DATA.policy.captionSafeY,
        DATA.policy.captionFontSize,
        1700,
        "ui",
        "#fff1dd",
      );
      tx.el.dataset.caption = "true";
      tx.show(c.start);
      tx.hide(c.end);
    }
  }
  DATA.shots.forEach((s) =>
    film.scene(s.id, (sc) => {
      sc.production = s;
      sc.actors = {};
      sc.props = {};
      if (s.renderKind === "svg") infographic(sc, s);
      else {
        environment(sc, s);
        for (const p of s.props || []) sc.props[p.id] = prop(sc, p);
        for (const [id, stage] of Object.entries(s.stages))
          sc.actors[id] = actor(sc, id, stage);
        sc.primary = Object.values(sc.actors)[0] || null;
        for (const a of s.actions) doAction(sc, a, sc.actors, sc.props);
        if (s.year) {
          rect(sc, 245, 118, 350, 100, "#173747", "ui", 12);
          text(sc, String(s.year), 245, 115, 70, 300, "ui").in(
            0.08,
            "fade",
            0.15,
          );
        }
        if (s.kind === "ending" && s.headline) {
          const plate = rect(
            sc,
            s.year ? 1100 : 960,
            150,
            s.year ? 1300 : 1700,
            120,
            "#173747",
            "ui",
            12,
          );
          plate.hide(0);
          plate.fadeIn(Math.max(0.2, sc.dur * 0.55), 0.2);
          text(
            sc,
            s.headline,
            s.year ? 1100 : 960,
            150,
            76,
            s.year ? 1250 : 1640,
            "ui",
          ).in(Math.max(0.2, sc.dur * 0.55), "fade", 0.2);
        }
      }
      captions(sc, s);
      const c = s.camera;
      sc.camera.set(...c.focus);
      if (s.renderKind !== "svg")
        sc.camera.focus(...c.end, 0.05, sc.dur - 0.15, "sine.inOut");
    }),
  );
})(PRODUCTION_DATA);
