"use strict";
/* 全站共用：小工具、图标、日夜间切换、提示条、确认框、弹层关闭、拖放 */
const XTD = (window.XTD = { views: {} });

(function () {
  const $ = (id) => document.getElementById(id);
  const SITE = "http://www.xtdpotato.top/";
  const ONLINE = /^https?:$/.test(location.protocol);
  const THEME_KEY = "xtd_station_theme";

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 站内相对资源（封面、插图）：本地直接打开时改用线上地址
  const isAbs = (p) => /^[a-z][a-z0-9+.-]*:/i.test(p);
  const sitePath = (p) => SITE + p.replace(/^\.?\//, "");
  const asset = (p) => (isAbs(p) || ONLINE ? p : sitePath(p));
  // 站内图片：先按相对路径找，找不到再去线上站点取，还取不到就把图片拿掉
  function img(src, alt, cls) {
    const abs = isAbs(src);
    const backup = !abs && ONLINE ? ` data-backup="${esc(sitePath(src))}"` : "";
    return `<img${cls ? ` class="${cls}"` : ""} src="${esc(asset(src))}" alt="${esc(alt || "")}" loading="lazy" data-site${backup}>`;
  }
  document.addEventListener("error", (e) => {
    const el = e.target;
    if (!el || el.tagName !== "IMG" || !el.hasAttribute("data-site")) return;
    const backup = el.getAttribute("data-backup");
    if (backup) { el.removeAttribute("data-backup"); el.src = backup; }
    else el.remove();
  }, true);
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const pad = (n) => String(n).padStart(2, "0");
  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
  const bytes = (n) => (n >= 1048576 ? (n / 1048576).toFixed(2) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

  function mark(text, q) {
    const safe = esc(text);
    if (!q) return safe;
    return safe.replace(new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => "<mark>" + m + "</mark>");
  }

  let toastTimer;
  function toast(text) {
    const t = $("toast");
    t.textContent = text;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), 2600);
  }

  function ask(text, yesLabel) {
    return new Promise((resolve) => {
      const d = $("confirm");
      $("cfText").textContent = text;
      $("cfYes").textContent = yesLabel;
      d.returnValue = "";
      d.showModal();
      d.addEventListener("close", () => resolve(d.returnValue === "yes"), { once: true });
    });
  }
  $("cfNo").onclick = () => $("confirm").close("");
  $("cfYes").onclick = () => $("confirm").close("yes");

  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // 打包时避免重名：a.png、a (2).png、a (3).png
  function uniqueName(used, name) {
    if (!used.has(name)) { used.add(name); return name; }
    const dot = name.lastIndexOf(".");
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    let k = 2;
    while (used.has(`${stem} (${k})${ext}`)) k++;
    used.add(`${stem} (${k})${ext}`);
    return `${stem} (${k})${ext}`;
  }

  /* ---------- 图标 ---------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 16V4m0 0L7 9m5-5 5 5M4 20h16"/>',
    download: '<path d="M12 4v12m0 0-5-5m5 5 5-5M4 20h16"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    back: '<path d="M19 12H5m0 0 6-6m-6 6 6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    bookmark: '<path d="M6 4h12v17l-6-4-6 4z"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    audio: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    cloud: '<path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9.5a4.2 4.2 0 0 1-.5 8.5z"/><path d="M12 11v5m0 0-2-2m2 2 2-2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    shop: '<path d="M4 8h16l-1 12H5zM9 8V6a3 3 0 0 1 6 0v2"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    pc: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    compare: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 2v20"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    folder: '<path d="M3 6h7l2 3h9v10H3z"/>',
    go: '<path d="M5 12h14m0 0-6-6m6 6-6 6"/>',
  };
  const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.globe}</svg>`;
  document.querySelectorAll("[data-i]").forEach((el) => el.insertAdjacentHTML("afterbegin", icon(el.dataset.i)));

  /* ---------- 日夜间 ---------- */
  function setTheme(mode) {
    document.documentElement.dataset.theme = mode;
    $("themeBtn").innerHTML = mode === "dark" ? icon("sun") + "日间" : icon("moon") + "夜间";
    $("themeBtn").setAttribute("aria-label", mode === "dark" ? "切换到日间模式" : "切换到夜间模式");
  }
  setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  $("themeBtn").onclick = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    setTheme(next);
  };

  /* ---------- 弹层：点关闭按钮或点外面关闭 ---------- */
  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) d.close();
      else if (e.target === d && !d.classList.contains("full")) d.close();
    });
  });

  /* ---------- 拖放文件或文件夹 ---------- */
  function walk(entry) {
    if (entry.isFile) return new Promise((res) => entry.file((f) => res([f]), () => res([])));
    if (!entry.isDirectory) return Promise.resolve([]);
    const reader = entry.createReader();
    return (async () => {
      const out = [];
      for (;;) {
        const batch = await new Promise((res) => reader.readEntries(res, () => res([])));
        if (!batch.length) break;
        for (const child of batch) out.push(...(await walk(child)));
      }
      return out;
    })();
  }
  function bindDrop(el, onFiles) {
    const over = (e) => { e.preventDefault(); el.classList.add("over"); };
    el.addEventListener("dragenter", over);
    el.addEventListener("dragover", over);
    el.addEventListener("dragleave", (e) => { if (!el.contains(e.relatedTarget)) el.classList.remove("over"); });
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.classList.remove("over");
      const dt = e.dataTransfer;
      // 条目必须在事件回调里同步取出，之后再异步展开文件夹
      const entries = [...(dt.items || [])].map((i) => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null)).filter(Boolean);
      const plain = [...(dt.files || [])];
      const job = entries.length ? Promise.all(entries.map(walk)).then((l) => l.flat()) : Promise.resolve(plain);
      job.then(onFiles);
    });
  }

  Object.assign(XTD, { $, ONLINE, esc, asset, img, uid, pad, clip, bytes, mark, toast, ask, download, uniqueName, icon, bindDrop });
})();
