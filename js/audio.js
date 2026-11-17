"use strict";
/* 音频转换：浏览器解码，裁剪后导出。
   WAV 用自带的编码（js/binary.js），不需要联网；
   MP3 用 lamejs 编码器，第一次导出 MP3 时从 cdnjs 加载。 */
(function () {
  const { $, uid, pad, bytes, toast, download, uniqueName, icon, bindDrop } = XTD;
  const LAME_URL = "https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js";
  const AUDIO_EXT = /\.(mp3|m4a|aac|wav|wave|ogg|oga|opus|flac|webm|mp4|aiff?|caf|wma|amr|ac3|mka|ape)$/i;
  const items = [];
  let ctx = null;
  let cache = null;       // 只保留最近一个解码结果，避免多个长音频占满内存
  let lameLoading = null;
  let busy = false;

  const clean = (s) => s.replace(/[\\/:*?"<>|]/g, "_").trim();
  function clock(sec) {
    sec = Math.round(Math.max(0, sec) * 10) / 10;
    const m = Math.floor(sec / 60);
    return `${pad(m)}:${(sec - m * 60).toFixed(1).padStart(4, "0")}`;
  }

  /* ---------- 解码与编码 ---------- */
  function decode(arrayBuffer) {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error("这个浏览器不支持音频处理");
      ctx = new AC();
    }
    return new Promise((resolve, reject) => {
      const p = ctx.decodeAudioData(arrayBuffer, resolve, reject);
      if (p && p.catch) p.catch(reject);
    });
  }

  async function getBuffer(it) {
    if (cache && cache.id === it.id) return cache.buffer;
    cache = null;
    let buffer;
    try { buffer = await decode(await it.file.arrayBuffer()); }
    catch (e) { throw new Error("这个浏览器解码不了这个文件。换成 MP3、M4A 或 WAV 再试。"); }
    cache = { id: it.id, buffer };
    it.duration = buffer.duration;
    return buffer;
  }

  function loadLame() {
    if (window.lamejs) return Promise.resolve();
    if (!lameLoading) {
      lameLoading = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = LAME_URL;
        s.onload = () => (window.lamejs ? resolve() : reject(new Error()));
        s.onerror = () => { s.remove(); reject(new Error()); };
        document.head.appendChild(s);
      }).catch(() => {
        lameLoading = null;
        throw new Error("MP3 编码器没有加载成功，检查网络后再试。导出 WAV 不需要联网。");
      });
    }
    return lameLoading;
  }

  // MP3 最高支持 48 kHz，更高的采样率先降下来
  function resample(buffer, rate) {
    const off = new OfflineAudioContext(Math.min(2, buffer.numberOfChannels), Math.ceil(buffer.duration * rate), rate);
    const src = off.createBufferSource();
    src.buffer = buffer;
    src.connect(off.destination);
    src.start();
    return off.startRendering();
  }

  const to16 = (v) => (v <= -1 ? -32768 : v >= 1 ? 32767 : v < 0 ? v * 32768 : v * 32767);

  async function mp3(buffer, from, to, onProgress) {
    await loadLame();
    if (buffer.sampleRate > 48000) buffer = await resample(buffer, 48000);
    const rate = buffer.sampleRate;
    const ch = Math.min(2, buffer.numberOfChannels);
    const a = Math.floor(from * rate);
    const b = Math.min(buffer.length, Math.floor(to * rate));
    const enc = new window.lamejs.Mp3Encoder(ch, rate, 192);
    const L = buffer.getChannelData(0);
    const R = ch === 2 ? buffer.getChannelData(1) : null;
    const BLOCK = 1152 * 40;
    const l16 = new Int16Array(BLOCK);
    const r16 = R ? new Int16Array(BLOCK) : null;
    const out = [];
    for (let i = a; i < b; i += BLOCK) {
      const n = Math.min(BLOCK, b - i);
      for (let k = 0; k < n; k++) {
        l16[k] = to16(L[i + k]);
        if (R) r16[k] = to16(R[i + k]);
      }
      const chunk = R ? enc.encodeBuffer(l16.subarray(0, n), r16.subarray(0, n)) : enc.encodeBuffer(l16.subarray(0, n));
      if (chunk.length) out.push(new Uint8Array(chunk)); // 复制一份，编码器会重复使用它的缓冲区
      if (onProgress) onProgress((i - a + n) / (b - a));
      await new Promise((r) => setTimeout(r)); // 让界面有机会刷新
    }
    const tail = enc.flush();
    if (tail.length) out.push(new Uint8Array(tail));
    return new Blob(out, { type: "audio/mpeg" });
  }

  async function convert(it, format, onProgress) {
    const buffer = await getBuffer(it);
    const from = Math.min(buffer.duration, Math.max(0, it.start));
    const to = Math.max(0, buffer.duration - Math.max(0, it.end));
    if (to - from < 0.01) throw new Error("裁剪后没有剩下的音频，把开头或结尾的秒数改小。");
    return format === "mp3" ? mp3(buffer, from, to, onProgress) : XTD.wav(buffer, from, to);
  }

  /* ---------- 列表 ---------- */
  function mount(it) {
    const li = document.createElement("li");
    li.className = "aud-item";
    li.innerHTML =
      `<div class="aud-head">${icon("audio")}<b></b><span class="aud-meta" data-r="meta"></span>` +
      `<button class="btn icon" type="button" data-a="del" title="移除这个文件" aria-label="移除这个文件">${icon("close")}</button></div>` +
      `<audio controls preload="metadata" data-r="source"></audio>` +
      `<div class="aud-grid">` +
      `<label class="field">裁掉开头（秒）<input data-f="start" type="number" min="0" step="0.1" value="0" inputmode="decimal"></label>` +
      `<label class="field">裁掉结尾（秒）<input data-f="end" type="number" min="0" step="0.1" value="0" inputmode="decimal"></label>` +
      `<label class="field">导出格式<select data-f="format"><option value="wav">WAV</option><option value="mp3">MP3（192 kbps）</option></select></label>` +
      `<label class="field">输出文件名<input data-f="name" type="text"></label>` +
      `</div>` +
      `<div class="aud-acts">` +
      `<button class="btn" type="button" data-a="preview">${icon("play")}试听裁剪结果</button>` +
      `<button class="btn solid" type="button" data-a="export">${icon("download")}导出</button>` +
      `<span class="aud-status" data-r="status" role="status"></span></div>` +
      `<audio controls data-r="preview" hidden></audio>`;
    li.querySelector("b").textContent = it.file.name;
    li.querySelector('[data-f="name"]').value = it.name;
    const source = li.querySelector('[data-r="source"]');
    source.addEventListener("loadedmetadata", () => {
      if (isFinite(source.duration) && source.duration > 0) { it.duration = source.duration; update(it); }
    });
    source.addEventListener("error", () => say(it, "这个浏览器不能直接播放这个文件，可以试着导出。"));
    source.src = it.url;
    it.el = li;
    $("aList").appendChild(li);
    update(it);
  }

  function say(it, text, isError) {
    const el = it.el.querySelector('[data-r="status"]');
    el.textContent = text;
    el.classList.toggle("err", !!isError);
  }

  function update(it) {
    const ext = (it.file.name.split(".").pop() || "").toUpperCase();
    it.el.querySelector('[data-r="meta"]').textContent =
      [ext, bytes(it.file.size), it.duration ? clock(it.duration) : ""].filter(Boolean).join("，");
    if (!it.duration) { say(it, ""); return; }
    const from = Math.min(it.duration, it.start);
    const to = Math.max(0, it.duration - it.end);
    if (to - from < 0.01) say(it, "裁剪后没有剩下的音频，把开头或结尾的秒数改小。", true);
    else if (it.start || it.end) say(it, `保留 ${clock(from)} 到 ${clock(to)}，共 ${clock(to - from)}`);
    else say(it, "");
  }

  function clearPreview(it) {
    const el = it.el.querySelector('[data-r="preview"]');
    el.pause();
    el.removeAttribute("src");
    el.hidden = true;
    if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
    it.previewUrl = "";
  }

  function summary() {
    $("aBar").hidden = !items.length;
    $("aSummary").textContent = `${items.length} 个文件`;
    if (!items.length) $("aStatus").textContent = "";
  }

  function remove(it) {
    const k = items.indexOf(it);
    if (k < 0) return;
    items.splice(k, 1);
    clearPreview(it);
    URL.revokeObjectURL(it.url);
    if (cache && cache.id === it.id) cache = null;
    it.el.remove();
    summary();
  }

  function addFiles(list) {
    const all = [...list];
    const files = all.filter((f) => f.type.startsWith("audio/") || AUDIO_EXT.test(f.name));
    if (!files.length) { toast("没有找到音频文件"); return; }
    let added = 0;
    for (const f of files) {
      if (items.some((x) => x.file.name === f.name && x.file.size === f.size && x.file.lastModified === f.lastModified)) continue;
      const it = {
        id: uid(), file: f, url: URL.createObjectURL(f), duration: 0,
        start: 0, end: 0, format: "wav", name: f.name.replace(/\.[^.]+$/, "") || "音频",
        previewUrl: "", el: null,
      };
      items.push(it);
      mount(it);
      added++;
    }
    const skipped = all.length - files.length;
    if (!added) toast("这些文件已经在列表里了");
    else if (skipped) toast(`已添加 ${added} 个，忽略了 ${skipped} 个不是音频的文件`);
    summary();
  }

  /* ---------- 试听与导出 ---------- */
  const outName = (it) => `${clean(it.name) || "音频"}.${it.format}`;
  const progress = (it) => (p) => say(it, `正在编码 MP3，${Math.round(p * 100)}%`);

  async function preview(it) {
    if (busy) { toast("上一个文件还在处理，稍等一下。"); return; }
    busy = true;
    say(it, "正在生成试听…");
    try {
      const blob = await convert(it, "wav");
      clearPreview(it);
      it.previewUrl = URL.createObjectURL(blob);
      const el = it.el.querySelector('[data-r="preview"]');
      el.src = it.previewUrl;
      el.hidden = false;
      update(it);
      el.play().catch(() => {});
    } catch (e) {
      say(it, (e && e.message) || "试听生成失败", true);
    }
    busy = false;
  }

  async function exportOne(it) {
    if (busy) { toast("上一个文件还在处理，稍等一下。"); return; }
    busy = true;
    say(it, "正在导出…");
    try {
      const blob = await convert(it, it.format, progress(it));
      download(blob, outName(it));
      say(it, `已导出 ${outName(it)}（${bytes(blob.size)}）`);
    } catch (e) {
      say(it, (e && e.message) || "导出失败", true);
    }
    busy = false;
  }

  async function exportAll() {
    if (!items.length) return;
    if (items.length === 1) { exportOne(items[0]); return; }
    if (busy) { toast("上一个文件还在处理，稍等一下。"); return; }
    busy = true;
    $("aAll").disabled = true;
    const list = [...items];
    const used = new Set();
    const files = [];
    let failed = 0;
    for (let k = 0; k < list.length; k++) {
      const it = list[k];
      $("aStatus").textContent = `正在导出第 ${k + 1} 个，共 ${list.length} 个`;
      say(it, "正在导出…");
      try {
        const blob = await convert(it, it.format, progress(it));
        files.push({ name: uniqueName(used, outName(it)), blob });
        say(it, `已导出（${bytes(blob.size)}）`);
      } catch (e) {
        failed++;
        say(it, (e && e.message) || "导出失败", true);
      }
    }
    try {
      if (files.length) {
        const d = new Date();
        download(await XTD.zip(files), `音频转换-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.zip`);
      }
      $("aStatus").textContent = `已打包 ${files.length} 个文件` + (failed ? `，${failed} 个没有成功，原因写在各自的条目里。` : "");
    } catch (e) {
      $("aStatus").textContent = (e && e.message) || "打包失败，改为一个一个导出。";
    }
    $("aAll").disabled = false;
    busy = false;
  }

  /* ---------- 操作 ---------- */
  $("aPick").onclick = () => $("aFile").click();
  $("aPickDir").onclick = () => $("aDir").click();
  if (!("webkitdirectory" in HTMLInputElement.prototype)) $("aPickDir").hidden = true;
  $("aFile").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  $("aDir").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  bindDrop($("v-audio"), addFiles);

  const itemOf = (node) => items.find((x) => x.el === node.closest("li"));
  $("aList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-a]");
    const it = b && itemOf(b);
    if (!it) return;
    if (b.dataset.a === "del") remove(it);
    else if (b.dataset.a === "preview") preview(it);
    else if (b.dataset.a === "export") exportOne(it);
  });
  $("aList").addEventListener("input", (e) => {
    const f = e.target.dataset && e.target.dataset.f;
    const it = f && itemOf(e.target);
    if (!it) return;
    if (f === "start" || f === "end") {
      it[f] = Math.max(0, Number(e.target.value) || 0);
      clearPreview(it); // 裁剪范围变了，旧的试听作废
      update(it);
    } else {
      it[f] = e.target.value;
    }
  });
  $("aAll").onclick = exportAll;
  $("aClear").onclick = () => { [...items].forEach(remove); };

  XTD.views.audio = {};
})();
