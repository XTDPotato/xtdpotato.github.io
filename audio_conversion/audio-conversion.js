const $ = (id) => document.getElementById(id);
const AUDIO_EXTENSIONS = new Set([
  "mp3", "m4a", "aac", "wav", "wave", "ogg", "oga", "opus", "flac",
  "wma", "amr", "aiff", "aif", "ac3", "mka", "webm", "mp4", "caf", "ape",
]);
const FORMAT_META = {
  wav: { label: "WAV", mime: "audio/wav", codec: ["-c:a", "pcm_s16le"] },
  mp3: { label: "MP3", mime: "audio/mpeg", codec: ["-c:a", "libmp3lame", "-b:a", "192k"] },
  ogg: { label: "OGG", mime: "audio/ogg", codec: ["-c:a", "libvorbis", "-q:a", "5"] },
  m4a: { label: "M4A", mime: "audio/mp4", codec: ["-c:a", "aac", "-b:a", "192k"] },
};

const items = new Map();
let ffmpeg = null;
let ffmpegApi = null;
let ffmpegLoading = null;
let ffmpegChain = Promise.resolve();
let batchRunning = false;

const ui = {
  dropzone: $("dropzone"),
  fileInput: $("fileInput"),
  folderInput: $("folderInput"),
  queuePanel: $("queuePanel"),
  queue: $("queue"),
  summary: $("queueSummary"),
  globalStatus: $("globalStatus"),
};

function setGlobal(message) {
  ui.globalStatus.textContent = message || "";
}

function extensionOf(name) {
  return (String(name).split(".").pop() || "").toLowerCase();
}

function isAudioFile(file) {
  return Boolean(file && (file.type?.startsWith("audio/") || AUDIO_EXTENSIONS.has(extensionOf(file.name))));
}

function baseName(name) {
  return String(name).replace(/\.[^.]+$/, "") || "converted-audio";
}

function formatBytes(size) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  }[character]));
}

function sanitizeName(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, "_").trim() || "converted-audio";
}

function createItem(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    sourceUrl: URL.createObjectURL(file),
    playableUrl: "",
    previewUrl: "",
    audioBuffer: null,
    duration: 0,
    status: "读取中",
    error: "",
    nativePlayable: true,
    fallbackLoading: false,
    revision: 0,
    settings: {
      start: 0,
      end: 0,
      format: "wav",
      outputName: baseName(file.name),
    },
  };
}

function getRange(item) {
  const total = Math.max(0, Number(item.duration) || 0);
  const from = Math.max(0, Math.min(total, Number(item.settings.start) || 0));
  const removedEnd = Math.max(0, Number(item.settings.end) || 0);
  return { from, to: Math.max(from, total - removedEnd) };
}

function renderQueue() {
  ui.queue.innerHTML = "";
  ui.queuePanel.hidden = items.size === 0;
  ui.summary.textContent = `${items.size} 个文件`;
  for (const item of items.values()) ui.queue.append(createItemElement(item));
}

function createItemElement(item) {
  const element = document.createElement("article");
  element.className = "queue-item";
  element.dataset.id = item.id;
  const extension = extensionOf(item.file.name).toUpperCase() || "音频";
  element.innerHTML = `
    <div class="item-head">
      <mdui-icon class="item-icon" name="audiotrack"></mdui-icon>
      <div class="file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</div>
      <div class="item-meta status" data-role="meta">${extension} · ${formatBytes(item.file.size)}<br>${escapeHtml(item.status)}</div>
      <mdui-button-icon data-action="remove" icon="close" aria-label="移除文件" title="移除"></mdui-button-icon>
    </div>
    <div class="item-body">
      <audio data-role="source-audio" controls preload="metadata"></audio>
      <div class="item-grid">
        <mdui-text-field data-field="start" label="裁剪开头（秒）" type="number" min="0" step="0.001" value="${item.settings.start}"></mdui-text-field>
        <mdui-text-field data-field="end" label="裁剪结尾（秒）" type="number" min="0" step="0.001" value="${item.settings.end}"></mdui-text-field>
        <mdui-select data-field="format" label="导出格式" value="${item.settings.format}">
          <mdui-menu-item value="wav">WAV</mdui-menu-item>
          <mdui-menu-item value="mp3">MP3</mdui-menu-item>
          <mdui-menu-item value="ogg">OGG</mdui-menu-item>
          <mdui-menu-item value="m4a">M4A</mdui-menu-item>
        </mdui-select>
        <mdui-text-field data-field="outputName" label="输出文件名" value="${escapeHtml(item.settings.outputName)}"></mdui-text-field>
      </div>
      <div class="item-actions">
        <mdui-button data-action="preview" variant="tonal" icon="play_arrow">预览裁剪结果</mdui-button>
        <mdui-button data-action="export" variant="filled" icon="download">导出</mdui-button>
        <div class="item-status status" data-role="status"></div>
      </div>
      <div class="preview-block" data-role="preview-block" hidden>
        <div class="status">裁剪结果预览</div>
        <audio data-role="preview-audio" controls preload="metadata"></audio>
      </div>
    </div>`;

  const sourceAudio = element.querySelector('[data-role="source-audio"]');
  sourceAudio.src = item.playableUrl || item.sourceUrl;
  sourceAudio.addEventListener("error", () => {
    item.nativePlayable = false;
    preparePlayableFallback(item);
  });

  const fieldValues = {
    start: item.settings.start,
    end: item.settings.end,
    format: item.settings.format,
    outputName: item.settings.outputName,
  };
  for (const [key, value] of Object.entries(fieldValues)) {
    const field = element.querySelector(`[data-field="${key}"]`);
    field.value = String(value);
    const save = (event) => updateSetting(item, key, readFieldValue(field, event));
    field.addEventListener("input", save);
    field.addEventListener("change", save);
  }

  element.querySelector('[data-action="remove"]').addEventListener("click", () => removeItem(item.id));
  element.querySelector('[data-action="preview"]').addEventListener("click", () => previewItem(item.id));
  element.querySelector('[data-action="export"]').addEventListener("click", () => exportItem(item.id));
  updateItemView(item);
  return element;
}

function readFieldValue(field, event) {
  const nativeControl = event?.composedPath?.().find((node) =>
    node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement
  );
  if (nativeControl) return nativeControl.value;
  return field.value ?? field.getAttribute("value") ?? "";
}

function updateSetting(item, key, value) {
  if (key === "start" || key === "end") {
    item.settings[key] = Math.max(0, Number(value) || 0);
    clearPreview(item);
  } else {
    item.settings[key] = value;
  }
  item.revision += 1;
}

function updateItemView(item) {
  const element = ui.queue.querySelector(`[data-id="${item.id}"]`);
  if (!element) return;
  const extension = extensionOf(item.file.name).toUpperCase() || "音频";
  const durationText = item.duration ? `${item.duration.toFixed(2)} 秒` : item.status;
  element.querySelector('[data-role="meta"]').innerHTML = `${extension} · ${formatBytes(item.file.size)}<br>${escapeHtml(durationText)}`;
  const status = element.querySelector('[data-role="status"]');
  status.textContent = item.error || item.status || "";
  status.classList.toggle("item-error", item.status === "不可用" || item.status === "转换失败");
  const sourceAudio = element.querySelector('[data-role="source-audio"]');
  const expectedSource = item.playableUrl || item.sourceUrl;
  if (sourceAudio.src !== expectedSource) sourceAudio.src = expectedSource;
}

function clearPreview(item) {
  if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  item.previewUrl = "";
  const element = ui.queue.querySelector(`[data-id="${item.id}"]`);
  const previewBlock = element?.querySelector('[data-role="preview-block"]');
  const previewAudio = element?.querySelector('[data-role="preview-audio"]');
  if (previewBlock) previewBlock.hidden = true;
  if (previewAudio) {
    previewAudio.pause();
    previewAudio.removeAttribute("src");
    previewAudio.load();
  }
}

async function decodeAudio(blob) {
  const context = new AudioContext();
  try {
    return await context.decodeAudioData(await blob.arrayBuffer());
  } finally {
    await context.close().catch(() => {});
  }
}

async function probeNative(item) {
  const audio = new Audio();
  audio.preload = "metadata";
  audio.src = item.sourceUrl;
  item.duration = await new Promise((resolve, reject) => {
    audio.onloadedmetadata = () => resolve(Number(audio.duration) || 0);
    audio.onerror = () => reject(new Error("浏览器无法直接解码"));
  });
  if (!item.duration) throw new Error("无法读取音频时长");
  try {
    item.audioBuffer = await decodeAudio(item.file);
  } catch {
    item.audioBuffer = null;
  }
  item.status = "已就绪";
  item.error = "";
  updateItemView(item);
}

async function addFiles(fileList) {
  const candidates = [...(fileList || [])];
  const validFiles = candidates.filter(isAudioFile);
  let added = 0;
  for (const file of validFiles) {
    const duplicate = [...items.values()].some((item) =>
      item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified
    );
    if (duplicate) continue;
    const item = createItem(file);
    items.set(item.id, item);
    added += 1;
  }
  renderQueue();
  if (!validFiles.length) {
    setGlobal("没有找到支持的音频文件");
    return;
  }
  setGlobal(`已添加 ${added} 个音频文件${candidates.length > validFiles.length ? "，已忽略非音频文件" : ""}`);
  for (const item of [...items.values()].filter((entry) => entry.status === "读取中")) {
    probeNative(item).catch(async () => {
      item.nativePlayable = false;
      item.status = "正在兼容 M4A 等格式";
      item.error = "浏览器无法直接播放，将使用多格式转换核心";
      updateItemView(item);
      try {
        await probeWithFFmpeg(item);
        item.status = "已就绪";
        item.error = "已启用兼容播放和转换";
        updateItemView(item);
        await preparePlayableFallback(item);
      } catch (error) {
        item.status = "不可用";
        item.error = error?.message || "无法读取该音频";
        updateItemView(item);
      }
    });
  }
}

async function loadFFmpeg() {
  if (ffmpeg?.loaded) return ffmpeg;
  if (ffmpegLoading) return ffmpegLoading;
  ffmpegLoading = (async () => {
    setGlobal("正在加载多格式转换核心…");
    const [{ FFmpeg }, util] = await Promise.all([
      import("./vendor/ffmpeg/lib/index.js"),
      import("./vendor/ffmpeg/util/index.js"),
    ]);
    ffmpegApi = util;
    ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress }) => {
      setGlobal(`正在处理 ${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`);
    });
    await ffmpeg.load({
      coreURL: new URL("./vendor/ffmpeg/core/ffmpeg-core.js", import.meta.url).href,
      wasmURL: new URL("./vendor/ffmpeg/core/ffmpeg-core.wasm", import.meta.url).href,
    });
    return ffmpeg;
  })().catch((error) => {
    ffmpegLoading = null;
    throw error;
  });
  return ffmpegLoading;
}

function runFFmpegTask(task) {
  const run = ffmpegChain.then(task, task);
  ffmpegChain = run.catch(() => {});
  return run;
}

async function probeWithFFmpeg(item) {
  await loadFFmpeg();
  return runFFmpegTask(async () => {
    const inputName = `probe-${item.id}.${extensionOf(item.file.name) || "audio"}`;
    let duration = 0;
    const onLog = ({ message }) => {
      const match = String(message).match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
      if (match) duration = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
    };
    ffmpeg.on("log", onLog);
    try {
      await ffmpeg.writeFile(inputName, await ffmpegApi.fetchFile(item.file));
      await ffmpeg.exec(["-i", inputName, "-t", "0.01", "-f", "null", "-"]);
    } finally {
      ffmpeg.off("log", onLog);
      await ffmpeg.deleteFile(inputName).catch(() => {});
    }
    if (!duration) throw new Error("转换核心无法读取音频时长");
    item.duration = duration;
    return duration;
  });
}

async function ensureReady(item) {
  if (item.duration > 0) return;
  await probeWithFFmpeg(item);
  updateItemView(item);
}

async function preparePlayableFallback(item) {
  if (item.nativePlayable || item.playableUrl || item.fallbackLoading || item.status === "不可用") return;
  item.fallbackLoading = true;
  item.status = "正在生成兼容试听";
  updateItemView(item);
  try {
    const blob = await convertWithFFmpeg(item, "mp3", { from: 0, to: item.duration });
    item.playableUrl = URL.createObjectURL(blob);
    item.status = "已就绪";
    item.error = "原格式已转换为兼容试听，导出仍使用原始文件";
  } catch (error) {
    item.status = "试听生成失败";
    item.error = error?.message || "仍可尝试转换导出";
  } finally {
    item.fallbackLoading = false;
    updateItemView(item);
  }
}

async function convertWithFFmpeg(item, format, range) {
  await loadFFmpeg();
  return runFFmpegTask(async () => {
    const meta = FORMAT_META[format] || FORMAT_META.wav;
    const inputName = `input-${item.id}.${extensionOf(item.file.name) || "audio"}`;
    const outputName = `output-${item.id}-${Date.now()}.${format}`;
    try {
      await ffmpeg.writeFile(inputName, await ffmpegApi.fetchFile(item.file));
      const args = ["-i", inputName];
      if (range?.from > 0) args.push("-ss", range.from.toFixed(3));
      if (range && range.to > range.from && item.duration > 0) {
        args.push("-t", Math.max(0.001, range.to - range.from).toFixed(3));
      }
      args.push("-vn", ...meta.codec, "-y", outputName);
      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outputName);
      return new Blob([data.buffer], { type: meta.mime });
    } finally {
      await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)]);
    }
  });
}

async function convertItem(item, targetFormat = item.settings.format) {
  await ensureReady(item);
  const range = getRange(item);
  if (range.to <= range.from) throw new Error("裁剪范围没有可保留的音频");
  if (targetFormat === "wav" && item.audioBuffer) return renderWav(item.audioBuffer, range);
  return convertWithFFmpeg(item, targetFormat, range);
}

async function previewItem(id) {
  const item = items.get(id);
  const element = ui.queue.querySelector(`[data-id="${id}"]`);
  if (!item || !element) return;
  const button = element.querySelector('[data-action="preview"]');
  const previewBlock = element.querySelector('[data-role="preview-block"]');
  const previewAudio = element.querySelector('[data-role="preview-audio"]');
  const revision = item.revision;
  button.loading = true;
  button.disabled = true;
  item.status = "正在生成预览";
  updateItemView(item);
  try {
    const blob = await convertItem(item, "wav");
    if (!items.has(id) || revision !== item.revision) return;
    clearPreview(item);
    item.previewUrl = URL.createObjectURL(blob);
    previewAudio.src = item.previewUrl;
    previewBlock.hidden = false;
    item.status = "正在播放裁剪预览";
    item.error = "";
    await previewAudio.play().catch(() => {});
  } catch (error) {
    item.status = "预览失败";
    item.error = error?.message || "无法处理该音频";
  } finally {
    button.loading = false;
    button.disabled = false;
    updateItemView(item);
  }
}

async function exportItem(id) {
  const item = items.get(id);
  const element = ui.queue.querySelector(`[data-id="${id}"]`);
  if (!item || !element) return;
  const button = element.querySelector('[data-action="export"]');
  button.loading = true;
  button.disabled = true;
  item.status = "转换中";
  item.error = "";
  updateItemView(item);
  try {
    const blob = await convertItem(item);
    downloadBlob(blob, `${sanitizeName(item.settings.outputName)}.${item.settings.format}`);
    item.status = "已导出";
    setGlobal(`${item.file.name} 已导出`);
  } catch (error) {
    item.status = "转换失败";
    item.error = error?.message || "请检查音频文件或网络";
  } finally {
    button.loading = false;
    button.disabled = false;
    updateItemView(item);
  }
}

function uniqueZipName(zip, requestedName) {
  if (!zip.file(requestedName)) return requestedName;
  const extension = requestedName.includes(".") ? `.${requestedName.split(".").pop()}` : "";
  const stem = extension ? requestedName.slice(0, -extension.length) : requestedName;
  let index = 2;
  while (zip.file(`${stem} (${index})${extension}`)) index += 1;
  return `${stem} (${index})${extension}`;
}

async function convertAll() {
  if (batchRunning || !items.size) return;
  batchRunning = true;
  const list = [...items.values()];
  if (list.length === 1) {
    try {
      await exportItem(list[0].id);
    } finally {
      batchRunning = false;
    }
    return;
  }
  const zip = window.JSZip ? new window.JSZip() : null;
  let completed = 0;
  let succeeded = 0;
  try {
    for (const item of list) {
      item.status = "转换中";
      item.error = "";
      updateItemView(item);
      try {
        const blob = await convertItem(item);
        const requestedName = `${sanitizeName(item.settings.outputName)}.${item.settings.format}`;
        if (zip) zip.file(uniqueZipName(zip, requestedName), blob);
        else downloadBlob(blob, requestedName);
        item.status = "已转换";
        succeeded += 1;
      } catch (error) {
        item.status = "转换失败";
        item.error = error?.message || "无法转换";
      }
      completed += 1;
      updateItemView(item);
      setGlobal(`批量转换 ${completed}/${list.length}`);
    }
    if (zip && succeeded) {
      setGlobal("正在打包转换结果…");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `audio-converted-${new Date().toISOString().slice(0, 10)}.zip`);
    }
    setGlobal(`批量转换完成：成功 ${succeeded} 个，失败 ${list.length - succeeded} 个`);
  } finally {
    batchRunning = false;
  }
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function renderWav(buffer, range) {
  const rate = buffer.sampleRate;
  const channels = buffer.numberOfChannels;
  const length = Math.max(0, Math.floor((range.to - range.from) * rate));
  const bytes = new ArrayBuffer(44 + length * channels * 2);
  const view = new DataView(bytes);
  const write = (offset, value) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  write(0, "RIFF");
  view.setUint32(4, 36 + length * channels * 2, true);
  write(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, length * channels * 2, true);
  let offset = 44;
  const startSample = Math.floor(range.from * rate);
  for (let index = 0; index < length; index += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[startSample + index] || 0));
      view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
      offset += 2;
    }
  }
  return new Blob([bytes], { type: "audio/wav" });
}

function removeItem(id) {
  const item = items.get(id);
  if (!item) return;
  item.revision += 1;
  [item.sourceUrl, item.playableUrl, item.previewUrl].forEach((url) => { if (url) URL.revokeObjectURL(url); });
  items.delete(id);
  renderQueue();
  setGlobal("已移除文件");
}

function clearAll() {
  for (const item of items.values()) {
    item.revision += 1;
    [item.sourceUrl, item.playableUrl, item.previewUrl].forEach((url) => { if (url) URL.revokeObjectURL(url); });
  }
  items.clear();
  renderQueue();
  setGlobal("已清空列表");
}

async function readWebkitEntry(entry) {
  if (entry.isFile) {
    return new Promise((resolve) => entry.file((file) => resolve([file]), () => resolve([])));
  }
  if (!entry.isDirectory) return [];
  const reader = entry.createReader();
  const files = [];
  while (true) {
    const entries = await new Promise((resolve) => reader.readEntries(resolve, () => resolve([])));
    if (!entries.length) break;
    for (const child of entries) files.push(...await readWebkitEntry(child));
  }
  return files;
}

async function readFileSystemHandle(handle) {
  if (handle.kind === "file") return [await handle.getFile()];
  const files = [];
  for await (const child of handle.values()) files.push(...await readFileSystemHandle(child));
  return files;
}

async function filesFromDrop(dataTransfer) {
  const transferItems = [...(dataTransfer.items || [])];
  const handles = [];
  if (transferItems.some((item) => typeof item.getAsFileSystemHandle === "function")) {
    try {
      for (const item of transferItems) {
        const handle = await item.getAsFileSystemHandle?.();
        if (handle) handles.push(handle);
      }
      if (handles.length) {
        const files = [];
        for (const handle of handles) files.push(...await readFileSystemHandle(handle));
        return files;
      }
    } catch {
      handles.length = 0;
    }
  }
  const entries = transferItems.map((item) => item.webkitGetAsEntry?.()).filter(Boolean);
  if (entries.length) {
    const files = [];
    for (const entry of entries) files.push(...await readWebkitEntry(entry));
    return files;
  }
  return [...(dataTransfer.files || [])];
}

ui.dropzone.addEventListener("dragenter", (event) => {
  event.preventDefault();
  ui.dropzone.classList.add("dragover");
});
ui.dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  ui.dropzone.classList.add("dragover");
});
ui.dropzone.addEventListener("dragleave", (event) => {
  if (!ui.dropzone.contains(event.relatedTarget)) ui.dropzone.classList.remove("dragover");
});
ui.dropzone.addEventListener("drop", async (event) => {
  event.preventDefault();
  ui.dropzone.classList.remove("dragover");
  setGlobal("正在读取拖入的文件夹…");
  await addFiles(await filesFromDrop(event.dataTransfer));
});

$("pickBtn").addEventListener("click", () => ui.fileInput.click());
$("pickFolderBtn").addEventListener("click", () => ui.folderInput.click());
$("addFilesBtn").addEventListener("click", () => ui.fileInput.click());
$("addFolderBtn").addEventListener("click", () => ui.folderInput.click());
ui.fileInput.addEventListener("change", () => {
  addFiles(ui.fileInput.files);
  ui.fileInput.value = "";
});
ui.folderInput.addEventListener("change", () => {
  addFiles(ui.folderInput.files);
  ui.folderInput.value = "";
});
$("convertAllBtn").addEventListener("click", convertAll);
$("convertAllSecondaryBtn").addEventListener("click", convertAll);
$("resetBtn").addEventListener("click", clearAll);
$("closeBtn").addEventListener("click", () => window.parent?.postMessage({ type: "audio-conversion:close" }, "*"));

window.addEventListener("message", (event) => {
  const data = event.data;
  if (data?.type === "theme:primary" && /^#[0-9a-fA-F]{6}$/.test(data.color) && window.mdui?.setColorScheme) {
    window.mdui.setColorScheme(data.color);
  }
  if (data?.type === "theme:colors" && /^#[0-9a-fA-F]{6}$/.test(data.colors?.primary) && window.mdui?.setColorScheme) {
    window.mdui.setColorScheme(data.colors.primary);
  }
});

renderQueue();
