"use strict";
/* 图片压缩：全部在浏览器里用 canvas 完成，图片不会上传 */
(function () {
  const { $, uid, pad, bytes, toast, download, uniqueName, icon, bindDrop } = XTD;
  const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const items = [];
  let gen = 0;          // 设置每改一次加一，用来作废旧的处理结果
  let running = false;
  let settleTimer;

  const clean = (s) => s.replace(/[\\/:*?"<>|]/g, "_").trim();
  const canWebp = (() => {
    try { return document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp"); }
    catch (e) { return false; }
  })();
  if (!canWebp) {
    const opt = $("iFormat").querySelector('option[value="image/webp"]');
    opt.disabled = true;
    opt.textContent = "WebP（这个浏览器不支持）";
  }

  function settings() {
    const num = (id) => { const v = parseInt($(id).value, 10); return v > 0 ? v : 0; };
    return {
      format: $("iFormat").value,
      quality: Number($("iQuality").value) / 100,
      maxW: num("iMaxW"),
      maxH: num("iMaxH"),
      prefix: clean($("iPrefix").value),
      suffix: clean($("iSuffix").value),
      bg: $("iBg").value,
    };
  }

  // “跟随原图”：JPG、PNG、WebP 保持原格式，其他格式转成 JPG
  function targetMime(file, format) {
    if (format !== "auto") return format;
    if (file.type === "image/webp" && !canWebp) return "image/jpeg";
    return EXT[file.type] ? file.type : "image/jpeg";
  }

  async function decode(file) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(file); } catch (e) { /* 换下面的办法再试 */ }
    }
    return new Promise((resolve, reject) => {
      const im = new Image();
      const url = URL.createObjectURL(file);
      im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("这个浏览器打不开这张图片")); };
      im.src = url;
    });
  }

  const toBlob = (canvas, mime, q) => new Promise((resolve) => canvas.toBlob(resolve, mime, q));

  async function compress(item, s) {
    const src = await decode(item.file);
    const sw = src.naturalWidth || src.width;
    const sh = src.naturalHeight || src.height;
    if (!sw || !sh) throw new Error("读不到这张图片的尺寸");
    item.w = sw;
    item.h = sh;
    const scale = Math.min(1, s.maxW ? s.maxW / sw : 1, s.maxH ? s.maxH / sh : 1);
    const w = Math.max(1, Math.round(sw * scale));
    const h = Math.max(1, Math.round(sh * scale));
    const mime = targetMime(item.file, s.format);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("图片太大，浏览器处理不了。把最大宽度或高度设小一点。");
    if (mime === "image/jpeg") { ctx.fillStyle = s.bg; ctx.fillRect(0, 0, w, h); } // JPG 没有透明，先铺底色
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, h);
    if (src.close) src.close();
    let blob = await toBlob(canvas, mime, s.quality);
    canvas.width = canvas.height = 0; // 及时释放内存
    if (!blob) throw new Error("图片太大，浏览器处理不了。把最大宽度或高度设小一点。");

    // 格式和尺寸都没变、结果反而更大时，原文件就是最好的结果
    let kept = false;
    if (mime === item.file.type && scale === 1 && blob.size >= item.file.size) { blob = item.file; kept = true; }
    const base = item.file.name.replace(/\.[^.]+$/, "") || "图片";
    return { blob, w, h, kept, name: `${s.prefix}${base}${s.suffix}.${EXT[mime]}` };
  }

  /* ---------- 处理队列：一张一张来 ---------- */
  async function run() {
    if (running) return;
    running = true;
    for (;;) {
      const it = items.find((x) => x.state === "wait");
      if (!it) break;
      const g = gen;
      it.state = "work";
      update(it);
      try {
        const out = await compress(it, settings());
        if (!items.includes(it)) continue;           // 处理期间被移除了
        if (g !== gen) { it.state = "wait"; continue; } // 设置变了，这张重来
        if (it.out) URL.revokeObjectURL(it.out.url);
        it.out = { ...out, url: URL.createObjectURL(out.blob) };
        it.state = "done";
      } catch (e) {
        if (!items.includes(it)) continue;
        if (g !== gen) { it.state = "wait"; continue; }
        it.state = "fail";
        it.error = (e && e.message) || "处理失败";
      }
      update(it);
      summary();
      await new Promise((r) => setTimeout(r)); // 让界面有机会刷新
    }
    running = false;
    summary();
  }

  function redoAll() {
    gen++;
    items.forEach((it) => { it.state = "wait"; update(it); });
    summary();
    run();
  }

  /* ---------- 列表 ---------- */
  function mount(it) {
    const li = document.createElement("li");
    li.className = "img-item";
    li.innerHTML =
      `<img class="img-thumb" alt=""><div class="img-meta"><b></b><span data-r="size"></span><span data-r="state"></span></div>` +
      `<div class="img-acts">` +
      `<button class="btn icon" type="button" data-a="cmp" title="对比原图和压缩后" aria-label="对比原图和压缩后">${icon("compare")}</button>` +
      `<button class="btn icon" type="button" data-a="save" title="下载这张" aria-label="下载这张">${icon("download")}</button>` +
      `<button class="btn icon" type="button" data-a="del" title="移除这张" aria-label="移除这张">${icon("close")}</button></div>`;
    li.querySelector("img").src = it.url;
    li.querySelector("b").textContent = it.file.name;
    it.el = li;
    $("iList").appendChild(li);
    update(it);
  }

  function update(it) {
    if (!it.el) return;
    const size = it.el.querySelector('[data-r="size"]');
    const state = it.el.querySelector('[data-r="state"]');
    size.textContent = (it.w ? `${it.w}×${it.h}，` : "") + bytes(it.file.size);
    state.className = it.state === "fail" ? "err" : "";
    if (it.state === "done") {
      const o = it.out;
      const pct = Math.round((1 - o.blob.size / it.file.size) * 100);
      state.innerHTML = o.kept
        ? "已经很小了，保留原文件"
        : `压缩后 ${o.w}×${o.h}，${bytes(o.blob.size)}，` +
          (pct >= 0 ? `<span class="save">省 ${pct}%</span>` : `<span class="more">比原图大 ${-pct}%</span>`);
    } else {
      state.textContent = it.state === "fail" ? it.error : it.state === "work" ? "正在压缩…" : "等待压缩";
    }
    const ready = it.state === "done";
    it.el.querySelector('[data-a="cmp"]').disabled = !ready;
    it.el.querySelector('[data-a="save"]').disabled = !ready;
  }

  function summary() {
    $("iBar").hidden = !items.length;
    const done = items.filter((x) => x.state === "done");
    const pending = items.filter((x) => x.state === "wait" || x.state === "work").length;
    const before = done.reduce((n, x) => n + x.file.size, 0);
    const after = done.reduce((n, x) => n + x.out.blob.size, 0);
    let text = `${items.length} 张图片`;
    if (pending) text += `，还有 ${pending} 张在压缩`;
    else if (done.length) text += `，${bytes(before)} 压到 ${bytes(after)}` + (after < before ? `，省 ${Math.round((1 - after / before) * 100)}%` : "");
    $("iSummary").textContent = text;
    $("iAll").disabled = !done.length || pending > 0;
  }

  function remove(it) {
    const k = items.indexOf(it);
    if (k < 0) return;
    items.splice(k, 1);
    URL.revokeObjectURL(it.url);
    if (it.out) URL.revokeObjectURL(it.out.url);
    it.el.remove();
    summary();
  }

  function addFiles(list) {
    const all = [...list];
    const files = all.filter((f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(f.name));
    if (!files.length) { toast("没有找到图片文件"); return; }
    for (const f of files) {
      const it = { id: uid(), file: f, url: URL.createObjectURL(f), state: "wait", w: 0, h: 0, out: null, error: "", el: null };
      items.push(it);
      mount(it);
    }
    if (all.length > files.length) toast(`已添加 ${files.length} 张，忽略了 ${all.length - files.length} 个不是图片的文件`);
    summary();
    run();
  }

  /* ---------- 操作 ---------- */
  $("iPick").onclick = () => $("iFile").click();
  $("iFile").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  bindDrop($("v-image"), addFiles);

  $("iList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-a]");
    if (!b) return;
    const it = items.find((x) => x.el === b.closest("li"));
    if (!it) return;
    if (b.dataset.a === "del") remove(it);
    else if (b.dataset.a === "save" && it.out) download(it.out.blob, it.out.name);
    else if (b.dataset.a === "cmp" && it.out) {
      $("cmpTitle").textContent = it.file.name;
      $("cmpBefore").src = it.url;
      $("cmpAfter").src = it.out.url;
      $("cmpRange").value = 50;
      $("cmpStage").style.setProperty("--p", "50%");
      $("compare").showModal();
    }
  });
  $("cmpRange").addEventListener("input", (e) => $("cmpStage").style.setProperty("--p", e.target.value + "%"));

  $("iClear").onclick = () => { [...items].forEach(remove); };

  $("iAll").onclick = async () => {
    const done = items.filter((x) => x.state === "done");
    if (!done.length) return;
    if (done.length === 1) { download(done[0].out.blob, done[0].out.name); return; }
    $("iAll").disabled = true;
    try {
      const used = new Set();
      const d = new Date();
      const blob = await XTD.zip(done.map((x) => ({ name: uniqueName(used, x.out.name), blob: x.out.blob })));
      download(blob, `图片压缩-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.zip`);
      toast(`已打包 ${done.length} 张图片`);
    } catch (e) {
      toast((e && e.message) || "打包失败，改为一张一张下载。");
    }
    summary();
  };

  // 改设置后稍等一下再重新压缩，避免拖动滑块时反复计算
  ["iFormat", "iQuality", "iMaxW", "iMaxH", "iPrefix", "iSuffix", "iBg"].forEach((id) => {
    $(id).addEventListener("input", () => {
      $("iQualityOut").textContent = $("iQuality").value;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => { if (items.length) redoAll(); }, 350);
    });
  });

  // 手机上先把设置收起来，把位置让给图片列表
  if (matchMedia("(max-width: 820px)").matches) $("iSettings").open = false;

  XTD.views.image = {};
})();
