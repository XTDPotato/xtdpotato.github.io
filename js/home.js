"use strict";
/* 话说：线路图、到站屏、时钟 */
(function () {
  const { $, esc, clip, pad } = XTD;
  const narrow = matchMedia("(max-width: 720px)");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  let drawn = false;

  // 每条线路和它的站点。站点都是真实入口，点了就过去。
  function lines() {
    const notes = XTD.notes.recent(3).map((n) => ({ t: n.title, h: "#/notes/" + encodeURIComponent(n.id) }));
    const courses = XTD.courses.list().slice(0, 4).map((c) => ({ t: c.title, h: "#/courses/" + encodeURIComponent(c.id) }));
    return [
      { c: "--l-nav", name: "导航", href: "#/nav", stops: XTD.navStops },
      { c: "--l-notes", name: "笔记", href: "#/notes", stops: [...notes, { t: "新建笔记", h: "#/notes/new" }] },
      { c: "--l-courses", name: "教程", href: "#/courses", stops: courses },
      { c: "--l-ext", stops: [
        { t: "B 站主页", h: "https://space.bilibili.com/200264982", ext: true },
        { t: "爱发电主页", h: "https://ifdian.net/a/xtdpotato", ext: true },
      ] },
    ];
  }

  function stop(s, x, y, k, o) {
    const out = s.ext ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a class="stop" style="--i:${k}" href="${esc(s.h)}"${out}><title>${esc(s.t)}</title>` +
      `<rect class="s-hit" x="${o.hit[0]}" y="${o.hit[1]}" width="${o.hit[2]}" height="${o.hit[3]}"/>` +
      `<circle class="s-dot" cx="${x}" cy="${y}" r="8"/>` +
      `<text x="${o.tx}" y="${o.ty}" text-anchor="${o.anchor}">${esc(clip(s.t, o.max))}</text></a>`;
  }
  function badge(ln, x, y, w, h, k) {
    return `<a class="stop badge" style="--i:${k}" href="${ln.href}"><title>打开${ln.name}</title>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/>` +
      `<text x="${x + w / 2}" y="${y + h / 2 + 5}">${ln.name}</text></a>`;
  }
  function group(ln, d, inner, li) {
    const train = calm.matches ? "" :
      `<circle class="train" r="6"><animateMotion dur="${14 + li * 3}s" begin="1.3s" repeatCount="indefinite" calcMode="linear" keyPoints="0;1;0" keyTimes="0;0.5;1" path="${d}"/></circle>`;
    return `<g style="--c:var(${ln.c})"><path class="ln draw" pathLength="1" d="${d}"/>${train}${inner}</g>`;
  }

  // 宽屏：四条线从左边的中转站向右展开
  function horizontal(L) {
    const GEO = [
      { y: 50, d: "M150 170 L150 90 L190 50 L885 50" },
      { y: 130, d: "M150 170 L190 130 L885 130" },
      { y: 210, d: "M150 170 L190 210 L885 210" },
      { y: 290, d: "M150 170 L150 250 L190 290 L560 290", x1: 470 },
    ];
    let html = "";
    L.forEach((ln, li) => {
      const g = GEO[li];
      const x0 = 300;
      const x1 = g.x1 || 800;
      const n = ln.stops.length;
      let inner = "";
      ln.stops.forEach((s, k) => {
        const x = n > 1 ? Math.round(x0 + ((x1 - x0) * k) / (n - 1)) : x0;
        inner += stop(s, x, g.y, k, { tx: x, ty: g.y + 28, anchor: "middle", max: 9, hit: [x - 62, g.y - 16, 124, 52] });
      });
      if (ln.name) inner += badge(ln, 868, g.y - 16, 80, 32, n);
      html += group(ln, g.d, inner, li);
    });
    html += `<g class="hub" style="--i:0"><circle class="hub-ring" cx="150" cy="170" r="17"/><circle class="hub-core" cx="150" cy="170" r="7"/>` +
      `<text class="hub-name" x="122" y="168" text-anchor="end">中转站</text><text class="hub-sub" x="122" y="189" text-anchor="end">XTDPotato</text></g>`;
    return { box: "40 0 920 340", html };
  }

  // 手机：一条竖线从上到下，每条线路占一段
  function vertical(L) {
    const X = 34;
    const ROW = 40;
    const hubY = 26;
    let y = hubY;
    let html = "";
    L.forEach((ln, li) => {
      const y0 = y;
      let k = 0;
      let inner = "";
      if (ln.name) { y += ROW; inner += badge(ln, 58, y - 15, 72, 30, k++); }
      ln.stops.forEach((s) => {
        y += ROW;
        inner += stop(s, X, y, k++, { tx: 60, ty: y + 5, anchor: "start", max: 17, hit: [8, y - ROW / 2, 344, ROW] });
      });
      y += ROW / 2;
      html += group(ln, `M${X} ${y0} L${X} ${y}`, inner, li);
    });
    html += `<g class="hub" style="--i:0"><circle class="hub-ring" cx="${X}" cy="${hubY}" r="15"/><circle class="hub-core" cx="${X}" cy="${hubY}" r="6"/>` +
      `<text class="hub-name" x="62" y="${hubY + 7}">中转站</text></g>`;
    return { box: `0 0 360 ${y + 14}`, html };
  }

  function map() {
    const el = $("map");
    const m = narrow.matches ? vertical(lines()) : horizontal(lines());
    el.setAttribute("viewBox", m.box);
    el.classList.toggle("vertical", narrow.matches);
    el.classList.toggle("still", drawn); // 画线动画只在第一次进来时播放
    el.innerHTML = m.html;
    drawn = true;
  }

  function board() {
    const rows = [
      ...XTD.notes.recent(3).map((n) => ({ c: "--l-notes", kind: "笔记", t: n.title, m: XTD.notes.when(n.updatedAt), h: "#/notes/" + encodeURIComponent(n.id) })),
      ...XTD.courses.list().slice(0, 3).map((c) => ({ c: "--l-courses", kind: "教程", t: c.title, m: "", h: "#/courses/" + encodeURIComponent(c.id) })),
    ];
    $("boardRows").innerHTML = rows.map((r) =>
      `<li><a href="${r.h}" style="--c:var(${r.c})"><i></i><span class="b-kind">${r.kind}</span><span class="b-title">${esc(r.t)}</span><span class="b-meta">${esc(r.m)}</span></a></li>`).join("");
  }

  const dateFmt = new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" });
  function tick() {
    const d = new Date();
    $("clock").textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    $("date").textContent = dateFmt.format(d);
  }
  tick();
  setInterval(tick, 1000);

  // 屏幕在横竖排的分界线上变化时（例如旋转手机），重画线路图
  narrow.addEventListener("change", () => { if (!$("v-home").hidden) map(); });

  XTD.views.home = { show() { map(); board(); } };
})();
