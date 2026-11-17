"use strict";
/* 笔记：保存在这个浏览器的 localStorage 里，和原站共用同一份数据 */
(function () {
  const { $, esc, uid, pad, clip, mark, toast, ask, download } = XTD;
  const KEY = "xtd_notes_v1";
  let store = { notes: [], activeId: null };
  let mode = "edit";
  let saveTimer = null;

  const sort = () => store.notes.sort((a, b) => b.updatedAt - a.updatedAt);
  const active = () => store.notes.find((n) => n.id === store.activeId) || null;

  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { raw = null; }
    const fresh = !raw || typeof raw !== "object";
    store = fresh ? { notes: [], activeId: null } : raw;
    const t = Date.now();
    // 只规整已有字段，其余字段（例如原站保存的图片附件）原样保留
    store.notes = (Array.isArray(store.notes) ? store.notes : [])
      .filter((n) => n && typeof n === "object")
      .map((n, k) => ({
        ...n,
        id: String(n.id || `${t}_${k}`),
        title: String(n.title || "未命名"),
        content: String(n.content == null ? "" : n.content),
        createdAt: Number(n.createdAt) || t,
        updatedAt: Number(n.updatedAt) || Number(n.createdAt) || t,
      }));
    if (fresh) {
      store.notes = [{
        id: uid(), title: "欢迎", createdAt: t, updatedAt: t,
        content: "# 欢迎\n\n- 这是本地笔记，自动保存在浏览器里\n- 支持 Markdown 预览\n\n快捷操作：\n\n- 列表上方的“+”新建笔记\n- “编辑 / 预览”切换\n- 导入或导出 TXT\n",
      }];
      store.activeId = store.notes[0].id;
      save();
    }
    sort();
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
      const d = new Date();
      $("nSaved").textContent = `已保存 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch (e) {
      $("nSaved").textContent = "未保存";
      toast("保存失败：浏览器存储空间不足或被禁用。先导出 TXT 备份。");
    }
  }
  function saveSoon() {
    $("nSaved").textContent = "正在保存…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  }

  function add(title, content) {
    const t = Date.now();
    const n = { id: uid(), title: (title || "").trim() || "新建笔记", content: content || "", createdAt: t, updatedAt: t };
    store.notes.unshift(n);
    store.activeId = n.id;
    return n;
  }

  function when(ts) {
    const d = new Date(ts);
    const diff = Date.now() - ts;
    if (diff < 60e3) return "刚刚";
    if (diff < 3600e3) return Math.floor(diff / 60e3) + " 分钟前";
    if (d.toDateString() === new Date().toDateString()) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const year = d.getFullYear() === new Date().getFullYear() ? "" : d.getFullYear() + "-";
    return `${year}${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /* ---------- 渲染 ---------- */
  function renderList() {
    const q = $("nSearch").value.trim().toLowerCase();
    const list = store.notes.filter((n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    $("nItems").innerHTML = list.length
      ? list.map((n) => {
          const excerpt = clip(n.content.replace(/[#>*`\-\s]+/g, " ").trim(), 40);
          return `<li><button type="button" data-id="${esc(n.id)}" aria-current="${n.id === store.activeId}"><b>${mark(n.title, q)}</b><span>${when(n.updatedAt)}${excerpt ? "　" + esc(excerpt) : ""}</span></button></li>`;
        }).join("")
      : `<li class="empty">${store.notes.length ? "没有匹配的笔记" : "还没有笔记"}</li>`;
  }

  function renderCount(n) {
    $("nCount").textContent = `${[...n.content.replace(/\s/g, "")].length} 字，${n.content.split("\n").length} 行`;
  }

  function renderNote() {
    const n = active();
    // 有笔记时显示编辑区，没有笔记时才显示空状态
    $("nBar").hidden = !n;
    $("nStatus").hidden = !n;
    $("nNone").hidden = !!n;
    $("nEditor").hidden = !n || mode !== "edit";
    $("nPreview").hidden = !n || mode !== "preview";
    document.querySelectorAll("#nMode button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    if (!n) return;
    if ($("nTitle").value !== n.title) $("nTitle").value = n.title;
    if ($("nEditor").value !== n.content) $("nEditor").value = n.content;
    if (mode === "preview") $("nPreview").innerHTML = XTD.md(n.content, store.assets) || '<p class="empty">这条笔记还没有内容</p>';
    renderCount(n);
  }

  function render() { renderList(); renderNote(); }
  function touch(n) { n.updatedAt = Date.now(); sort(); saveSoon(); renderList(); }

  /* ---------- 操作 ---------- */
  $("nItems").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (b) location.hash = "#/notes/" + encodeURIComponent(b.dataset.id);
  });
  $("nSearch").addEventListener("input", renderList);
  $("nNew").onclick = $("nNew2").onclick = () => { location.hash = "#/notes/new"; };
  $("nBack").onclick = () => { location.hash = "#/notes"; };

  $("nTitle").addEventListener("input", () => {
    const n = active();
    if (n) { n.title = $("nTitle").value; touch(n); }
  });
  $("nTitle").addEventListener("blur", () => {
    const n = active();
    if (n && !n.title.trim()) { n.title = "未命名"; $("nTitle").value = n.title; touch(n); }
  });
  $("nEditor").addEventListener("input", () => {
    const n = active();
    if (n) { n.content = $("nEditor").value; renderCount(n); touch(n); }
  });

  $("nMode").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mode]");
    if (!b) return;
    mode = b.dataset.mode;
    renderNote();
    if (mode === "edit") $("nEditor").focus();
  });

  $("nExport").onclick = () => {
    const n = active();
    if (!n) return;
    const name = (n.title.replace(/[\\/:*?"<>|]/g, "_").trim() || "笔记") + ".txt";
    download(new Blob([n.content], { type: "text/plain;charset=utf-8" }), name);
    toast("已导出 " + name);
  };

  $("nDelete").onclick = async () => {
    const n = active();
    if (!n || !(await ask(`删除笔记“${n.title}”？删除后不可恢复。`, "删除"))) return;
    store.notes = store.notes.filter((x) => x.id !== n.id);
    store.activeId = store.notes[0] ? store.notes[0].id : null;
    save();
    toast("已删除");
    if (location.hash === "#/notes") XTD.refresh(); else location.hash = "#/notes";
  };

  $("nImport").onclick = () => $("nFile").click();
  $("nFile").addEventListener("change", async (e) => {
    let count = 0;
    let last = null;
    for (const f of e.target.files) {
      try { last = add(f.name.replace(/\.(txt|md|markdown)$/i, ""), await f.text()); count++; }
      catch (err) { toast(`无法读取 ${f.name}`); }
    }
    e.target.value = "";
    if (!count) return;
    save();
    toast(`已导入 ${count} 条笔记`);
    location.hash = "#/notes/" + encodeURIComponent(last.id);
  });

  // 关闭页面前把还没落盘的修改存下来；别的标签页改了笔记时同步过来
  addEventListener("pagehide", () => { if (saveTimer) save(); });
  addEventListener("storage", (e) => {
    if (e.key !== KEY || saveTimer) return;
    load();
    XTD.refresh();
  });

  load();

  XTD.notes = { recent: (n) => store.notes.slice(0, n), when };
  XTD.views.notes = {
    show(id) {
      if (id === "new") {
        const n = add();
        save();
        mode = "edit";
        location.replace("#/notes/" + encodeURIComponent(n.id));
        return;
      }
      const hit = id ? store.notes.find((n) => n.id === id) : null;
      if (hit) store.activeId = hit.id;
      else if (!active()) store.activeId = store.notes[0] ? store.notes[0].id : null;
      // 手机上列表和正文分两屏：带笔记 id 时进正文，否则留在列表
      $("notes").dataset.pane = hit ? "detail" : "list";
      render();
      if (hit && !hit.content && hit.title === "新建笔记" && mode === "edit") $("nTitle").select();
    },
  };
})();
