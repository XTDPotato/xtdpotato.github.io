"use strict";
/* 教程：搜索、阅读、收藏。收藏和原站共用同一份数据 */
(function () {
  const { $, esc, mark, toast, ONLINE } = XTD;
  const FAVS_KEY = "mc_dev_favs";

  // 解析 Markdown 开头的 --- 元数据 ---
  function parse(entry) {
    const m = entry.markdown.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
    const meta = {};
    const body = m ? m[2] : entry.markdown;
    if (m) m[1].split(/\r?\n/).forEach((line) => {
      const k = line.indexOf(":");
      if (k > 0) meta[line.slice(0, k).trim()] = line.slice(k + 1).trim().replace(/^['"]|['"]$/g, "");
    });
    const id = entry.file.replace(/\.md$/i, "");
    const h = body.match(/^#\s+(.+)$/m);
    const plain = body.replace(/[`*_>#\-]/g, " ").replace(/\s+/g, " ").trim();
    return {
      id,
      title: meta.title || (h && h[1].trim()) || id,
      summary: meta.summary || meta.description || plain.slice(0, 120),
      cover: meta.cover || meta.image || "",
      body,
    };
  }

  let list = (((window.XTDContentData || {}).tutorials) || []).map(parse);
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"); } catch (e) { favs = []; }
  if (!Array.isArray(favs)) favs = [];
  let favOnly = false;
  let reading = null;

  // 放在网站上时，优先读 tutorials/ 目录，新增的 Markdown 会自动出现
  if (ONLINE) {
    fetch("tutorials/index.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((files) => Promise.all(files.map((f) =>
        fetch("tutorials/" + encodeURIComponent(f), { cache: "no-store" })
          .then((x) => (x.ok ? x.text() : null))
          .then((text) => (text ? { file: f, markdown: text } : null)))))
      .then((docs) => {
        docs = docs.filter(Boolean);
        if (!docs.length) return;
        list = docs.map(parse);
        if (XTD.refresh) XTD.refresh();
      })
      .catch(() => {});
  }

  function render() {
    const q = $("cSearch").value.trim().toLowerCase();
    const shown = list.filter((c) => (!favOnly || favs.includes(c.id)) && (!q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)));
    $("cFavOnly").setAttribute("aria-pressed", String(favOnly));
    $("cGrid").innerHTML = shown.length
      ? shown.map((c) => `<a class="c-card" href="#/courses/${encodeURIComponent(c.id)}"><div class="c-cover">${c.cover ? XTD.img(c.cover, "") : ""}</div><div class="c-body"><b>${mark(c.title, q)}</b><span>${mark(c.summary, q)}</span>${favs.includes(c.id) ? '<span class="c-fav">已收藏</span>' : ""}</div></a>`).join("")
      : `<div class="empty">${favOnly && !q ? "还没有收藏。打开一篇教程，点右上角的“收藏”。" : "没有匹配的教程"}</div>`;
  }

  function syncFav() {
    const on = !!reading && favs.includes(reading.id);
    $("rFav").setAttribute("aria-pressed", String(on));
    $("rFavText").textContent = on ? "取消收藏" : "收藏";
  }

  function open(doc) {
    reading = doc;
    $("rTitle").textContent = doc.title;
    $("rBody").innerHTML = (doc.cover ? XTD.img(doc.cover, "", "r-cover") : "") + XTD.md(doc.body);
    syncFav();
    if (!$("reader").open) $("reader").showModal();
    $("rScroll").scrollTop = 0;
  }
  function close() {
    if ($("reader").open) $("reader").close();
  }

  $("cSearch").addEventListener("input", render);
  $("cFavOnly").onclick = () => { favOnly = !favOnly; render(); };
  $("rFav").onclick = () => {
    if (!reading) return;
    const k = favs.indexOf(reading.id);
    if (k > -1) favs.splice(k, 1); else favs.push(reading.id);
    try { localStorage.setItem(FAVS_KEY, JSON.stringify(favs)); } catch (e) {}
    toast(k > -1 ? "已取消收藏" : "已收藏");
    syncFav();
    render();
  };
  // 关掉阅读器（按钮或 Esc）时，地址回到教程列表
  $("reader").addEventListener("close", () => {
    reading = null;
    if (location.hash.startsWith("#/courses/")) location.hash = "#/courses";
  });

  XTD.courses = { list: () => list };
  XTD.views.courses = {
    show(id) {
      render();
      if (!id) { close(); return; }
      const doc = list.find((x) => x.id === id);
      if (doc) open(doc);
      else { toast("没有找到这篇教程"); location.replace("#/courses"); }
    },
    hide: close,
  };
})();
