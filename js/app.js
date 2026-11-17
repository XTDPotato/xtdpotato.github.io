"use strict";
/* 路由：地址栏 # 后面的部分决定显示哪一页，例如 #/notes、#/courses/stream-master */
(function () {
  const { $ } = XTD;
  // line：这一页属于顶栏上的哪条线路
  const PAGES = {
    home: { title: "", line: "home" },
    nav: { title: "导航", line: "nav" },
    notes: { title: "笔记", line: "notes" },
    courses: { title: "教程", line: "courses" },
    image: { title: "图片压缩", line: "nav" },
    audio: { title: "音频转换", line: "nav" },
  };
  let current = null;

  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const v = PAGES[parts[0]] ? parts[0] : "home";
    let id = "";
    try { id = decodeURIComponent(parts.slice(1).join("/")); } catch (e) { id = ""; }

    const changed = v !== current;
    if (changed && current && XTD.views[current] && XTD.views[current].hide) XTD.views[current].hide();
    current = v;

    for (const k in PAGES) {
      const el = $("v-" + k);
      el.hidden = k !== v;
      el.classList.toggle("enter", changed && k === v);
    }
    document.querySelectorAll(".lines a").forEach((a) => {
      if (a.dataset.v === PAGES[v].line) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = PAGES[v].title ? `${PAGES[v].title} - XTDPotato 的中转站` : "XTDPotato 的中转站";
    if (changed) window.scrollTo(0, 0);

    const view = XTD.views[v];
    if (view && view.show) view.show(id);
  }

  XTD.refresh = route;
  addEventListener("hashchange", route);
  route();
})();
