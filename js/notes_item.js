"use strict";

const STORAGE_KEY = "xtd_notes_v1";
const MAX_HISTORY = 100;

const noteList = document.getElementById("noteList");
const activeTitle = document.getElementById("activeTitle");
const modeEditBtn = document.getElementById("modeEditBtn");
const modePreviewBtn = document.getElementById("modePreviewBtn");
const modeGroup = document.getElementById("modeGroup");
const editorContainer = document.getElementById("editorContainer");
const previewContainer = document.getElementById("previewContainer");
const previewBody = document.getElementById("previewBody");
const noteEditor = document.getElementById("noteEditor");
const notesApp = document.getElementById("notesApp");
const backBtn = document.getElementById("backBtn");

const newNoteBtn = document.getElementById("newNoteBtn");
const renameNoteBtn = document.getElementById("renameNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const copyBtn = document.getElementById("copyBtn");
const insertBtn = document.getElementById("insertBtn");
const searchInput = document.getElementById("searchInput");

const editTitleDialog = document.getElementById("editTitleDialog");
const editTitleHeadline = document.getElementById("editTitleHeadline");
const titleInput = document.getElementById("titleInput");
const titleCancelBtn = document.getElementById("titleCancelBtn");
const titleOkBtn = document.getElementById("titleOkBtn");

const deleteConfirmDialog = document.getElementById("deleteConfirmDialog");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");
const deleteOkBtn = document.getElementById("deleteOkBtn");

const notesSnackbar = document.getElementById("notesSnackbar");

let state = {
  notes: [],
  activeId: null,
};

let filterText = "";
let mode = "preview";
let titleDialogMode = "create";
let saveTimer = null;
let historyPushTimer = null;
let history = null;
let view = "list";
let compactMedia = null;
let isCompact = false;

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "note_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

function now() {
  return Date.now();
}

function showToast(text) {
  if (!notesSnackbar) return;
  notesSnackbar.textContent = text;
  notesSnackbar.open = true;
}

function setView(nextView) {
  view = nextView === "detail" ? "detail" : "list";
  if (notesApp) notesApp.dataset.view = view;
}

function syncCompactLayout() {
  isCompact = compactMedia?.matches ?? false;
  if (!isCompact) {
    setView("detail");
    return;
  }
  if (view !== "detail") setView("list");
}

function escapeHtml(str) {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInline(text) {
  let out = text ?? "";
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return out;
}

function renderMarkdown(md) {
  const safe = escapeHtml(md ?? "");
  const lines = safe.split(/\r?\n/);
  let html = "";
  let inCode = false;
  let codeBuffer = [];
  let listMode = null;
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = formatInline(paragraph.join("<br>"));
    html += `<p>${text}</p>`;
    paragraph = [];
  };

  const flushList = () => {
    if (!listMode) return;
    html += listMode === "ul" ? "</ul>" : "</ol>";
    listMode = null;
  };

  const flushCode = () => {
    if (!inCode) return;
    const code = codeBuffer.join("\n");
    html += `<pre><code>${code}</code></pre>`;
    codeBuffer = [];
    inCode = false;
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();
      if (!inCode) {
        inCode = true;
      } else {
        flushCode();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\{([^}]+)\})?$/);
    if (imageMatch) {
      flushParagraph();
      flushList();
      const alt = imageMatch[1] || "";
      const src = imageMatch[2];
      const styleSpec = (imageMatch[3] || "").trim();
      let style = "max-width:100%;height:auto;border-radius:6px";
      const widthMatch = styleSpec.match(/width\s*=\s*(\d+)/i);
      const heightMatch = styleSpec.match(/height\s*=\s*(\d+)/i);
      if (widthMatch) style += `;width:${widthMatch[1]}px`;
      if (heightMatch) style += `;height:${heightMatch[1]}px`;
      html += `<div style="margin:8px 0"><img alt="${alt}" src="${src}" style="${style}"></div>`;
      continue;
    }

    const iframeMatch = trimmed.match(/^::iframe\s+(.+)$/i);
    if (iframeMatch) {
      flushParagraph();
      flushList();
      const url = iframeMatch[1];
      html += `<div style="margin:10px 0"><iframe src="${url}" style="width:100%;height:360px;border:0;border-radius:8px" sandbox="allow-scripts allow-same-origin allow-forms"></iframe></div>`;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      html += `<h${level}>${formatInline(headingMatch[2])}</h${level}>`;
      continue;
    }

    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ulMatch || olMatch) {
      flushParagraph();
      const nextMode = ulMatch ? "ul" : "ol";
      if (!listMode) {
        listMode = nextMode;
        html += nextMode === "ul" ? "<ul>" : "<ol>";
      } else if (listMode !== nextMode) {
        flushList();
        listMode = nextMode;
        html += nextMode === "ul" ? "<ul>" : "<ol>";
      }
      const itemText = formatInline((ulMatch ? ulMatch[1] : olMatch[1]) ?? "");
      html += `<li>${itemText}</li>`;
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushCode();

  return html;
}

function createHistory(initialValue) {
  let stack = [initialValue ?? ""];
  let index = 0;

  const api = {
    reset(value) {
      stack = [value ?? ""];
      index = 0;
    },
    push(value) {
      const current = stack[index] ?? "";
      const next = value ?? "";
      if (next === current) return;
      stack = stack.slice(0, index + 1);
      stack.push(next);
      if (stack.length > MAX_HISTORY) {
        stack.shift();
        index = Math.max(0, index - 1);
      } else {
        index = stack.length - 1;
      }
    },
    undo() {
      if (index <= 0) return null;
      index -= 1;
      return stack[index] ?? "";
    },
    redo() {
      if (index >= stack.length - 1) return null;
      index += 1;
      return stack[index] ?? "";
    },
    canUndo() {
      return index > 0;
    },
    canRedo() {
      return index < stack.length - 1;
    },
  };

  return api;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.notes)) return null;
    return {
      notes: parsed.notes,
      activeId: parsed.activeId ?? null,
    };
  } catch (e) {
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    showToast("保存失败：存储空间不足或被禁用");
  }
}

function saveStateDebounced() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 250);
}

function getActiveNote() {
  return state.notes.find((n) => n.id === state.activeId) || null;
}

function sortNotes() {
  state.notes.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

function formatTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch (e) {
    return "";
  }
}

function computeFilteredNotes() {
  const q = (filterText ?? "").trim().toLowerCase();
  if (!q) return state.notes;
  return state.notes.filter((n) => (n.title ?? "").toLowerCase().includes(q));
}

function renderList() {
  if (!noteList) return;
  noteList.innerHTML = "";
  const notes = computeFilteredNotes();
  for (const note of notes) {
    const item = document.createElement("mdui-list-item");
    item.setAttribute("rounded", "");
    item.dataset.id = note.id;
    item.textContent = note.title || "未命名";
    const desc = formatTime(note.updatedAt || note.createdAt);
    if (desc) item.setAttribute("description", desc);
    if (note.id === state.activeId) item.setAttribute("active", "");
    item.addEventListener("click", () => selectNote(note.id));
    noteList.appendChild(item);
  }
}

function updateActiveHeader() {
  const note = getActiveNote();
  if (!activeTitle) return;
  activeTitle.textContent = note ? note.title || "未命名" : "未选择";
  notifyTopbar();
}

function setMode(nextMode) {
  mode = nextMode === "preview" ? "preview" : "edit";
  if (modeGroup) {
    modeGroup.value = mode;
    modeGroup.setAttribute("value", mode);
  }
  if (mode === "preview") {
    editorContainer.style.display = "none";
    previewContainer.style.display = "block";
    updatePreview();
  } else {
    previewContainer.style.display = "none";
    editorContainer.style.display = "block";
  }
}

function updatePreview() {
  const md = noteEditor?.value ?? "";
  previewBody.innerHTML = renderMarkdown(md);
}

function updateUndoRedoButtons() {
  if (undoBtn) undoBtn.disabled = !history?.canUndo();
  if (redoBtn) redoBtn.disabled = !history?.canRedo();
}

function selectNote(noteId) {
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return;

  if (isCompact) setView("detail");

  state.activeId = note.id;
  saveStateDebounced();

  if (noteEditor) noteEditor.value = note.content ?? "";
  if (!history) history = createHistory(note.content ?? "");
  history.reset(note.content ?? "");

  renderList();
  updateActiveHeader();
  if (mode === "preview") updatePreview();
  updateUndoRedoButtons();
}

function createNote(title, content = "") {
  const t = (title ?? "").trim() || "新建笔记";
  const ts = now();
  const note = {
    id: uuid(),
    title: t,
    content: content ?? "",
    createdAt: ts,
    updatedAt: ts,
  };
  state.notes.unshift(note);
  state.activeId = note.id;
  sortNotes();
  saveStateDebounced();
  renderList();
  selectNote(note.id);
}

function renameActiveNote(title) {
  const note = getActiveNote();
  if (!note) return;
  const t = (title ?? "").trim() || "未命名";
  note.title = t;
  note.updatedAt = now();
  sortNotes();
  saveStateDebounced();
  renderList();
  updateActiveHeader();
}

function deleteActiveNote() {
  const note = getActiveNote();
  if (!note) return;
  const idx = state.notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) state.notes.splice(idx, 1);
  if (state.notes.length === 0) {
    createNote("新建笔记", "");
    return;
  }
  const next = state.notes[Math.min(idx, state.notes.length - 1)];
  state.activeId = next.id;
  saveStateDebounced();
  renderList();
  selectNote(next.id);
}

function onEditorInput() {
  const note = getActiveNote();
  if (!note) return;

  const value = noteEditor?.value ?? "";
  note.content = value;
  note.updatedAt = now();
  sortNotes();
  saveStateDebounced();

  clearTimeout(historyPushTimer);
  historyPushTimer = setTimeout(() => {
    history?.push(value);
    updateUndoRedoButtons();
  }, 400);

  if (mode === "preview") updatePreview();
  renderList();
  notifyTopbar();
}

async function copyToClipboard(text) {
  const value = text ?? "";
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const el = document.createElement("textarea");
  el.value = value;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  el.remove();
}

function openTitleDialog(nextMode) {
  titleDialogMode = nextMode;
  if (editTitleHeadline) editTitleHeadline.textContent = nextMode === "rename" ? "重命名" : "新建笔记";
  if (titleInput) {
    titleInput.value = nextMode === "rename" ? (getActiveNote()?.title ?? "") : "";
    setTimeout(() => titleInput.focus(), 0);
  }
  editTitleDialog.open = true;
}

function notifyTopbar() {
  const note = getActiveNote();
  const title = note ? (note.title || "未命名") : null;
  window.parent?.postMessage({ type: "app:topbar", tab: "notes", title, actions: null }, "*");
}

function getEditorNative() {
  const el = noteEditor;
  if (!el) return null;
  const sr = el.shadowRoot || null;
  if (!sr) return null;
  const ta = sr.querySelector("textarea") || sr.querySelector("input");
  return ta || null;
}

function insertAtCursor(text) {
  const value = noteEditor?.value ?? "";
  const native = getEditorNative();
  if (!native || typeof native.selectionStart !== "number") {
    noteEditor.value = value + text;
    onEditorInput();
    return;
  }
  const start = native.selectionStart;
  const end = native.selectionEnd;
  const next = value.slice(0, start) + text + value.slice(end);
  noteEditor.value = next;
  native.selectionStart = native.selectionEnd = start + text.length;
  onEditorInput();
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openInsertDialog() {
  const dialog = document.createElement("mdui-dialog");
  dialog.setAttribute("fullscreen", "");
  dialog.setAttribute("close-on-esc", "");
  dialog.setAttribute("close-on-overlay-click", "");
  const wrap = document.createElement("div");
  wrap.style.height = "100%";
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.innerHTML = `
    <mdui-top-app-bar>
      <mdui-segmented-button-group id="insertTypeGroup" selects="single" value="image">
        <mdui-segmented-button value="image">图片</mdui-segmented-button>
        <mdui-segmented-button value="file">文件</mdui-segmented-button>
        <mdui-segmented-button value="web">网页</mdui-segmented-button>
      </mdui-segmented-button-group>
      <div style="flex:1"></div>
      <mdui-button-icon id="insertCancelBtn" icon="close"></mdui-button-icon>
      <mdui-button-icon id="insertOkBtn" icon="check"></mdui-button-icon>
    </mdui-top-app-bar>
    <div style="flex:1;min-height:0;overflow:auto;padding:12px;box-sizing:border-box">
      <div id="imagePane">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <mdui-button id="pickImageBtn" variant="tonal" icon="image">选择图片</mdui-button>
          <mdui-button id="cameraImageBtn" variant="tonal" icon="photo_camera">拍照</mdui-button>
          <mdui-text-field id="imageWidthInput" label="宽度(px，可选)" style="max-width:200px"></mdui-text-field>
        </div>
        <div id="imagePreview" style="margin-top:12px"></div>
      </div>
      <div id="filePane" style="display:none">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <mdui-button id="pickFileBtn" variant="tonal" icon="attach_file">选择文件</mdui-button>
          <div id="fileName" style="opacity:.8"></div>
        </div>
      </div>
      <div id="webPane" style="display:none">
        <div style="display:flex;gap:8px;align-items:center">
          <mdui-text-field id="webUrlInput" label="链接" style="flex:1"></mdui-text-field>
        </div>
        <div style="margin-top:12px"><iframe id="webPreview" style="width:100%;height:360px;border:0;border-radius:8px"></iframe></div>
      </div>
    </div>
  `;
  dialog.appendChild(wrap);
  document.body.appendChild(dialog);
  dialog.open = true;

  const typeGroup = wrap.querySelector("#insertTypeGroup");
  const cancelBtn = wrap.querySelector("#insertCancelBtn");
  const okBtn = wrap.querySelector("#insertOkBtn");
  const imagePane = wrap.querySelector("#imagePane");
  const filePane = wrap.querySelector("#filePane");
  const webPane = wrap.querySelector("#webPane");
  const pickImageBtn = wrap.querySelector("#pickImageBtn");
  const cameraImageBtn = wrap.querySelector("#cameraImageBtn");
  const imageWidthInput = wrap.querySelector("#imageWidthInput");
  const imagePreview = wrap.querySelector("#imagePreview");
  const pickFileBtn = wrap.querySelector("#pickFileBtn");
  const fileName = wrap.querySelector("#fileName");
  const webUrlInput = wrap.querySelector("#webUrlInput");
  const webPreview = wrap.querySelector("#webPreview");

  let imageDataUrl = null;
  let fileDataUrl = null;
  let fileDisplayName = "";
  let currentType = "image";

  typeGroup?.addEventListener("change", () => {
    currentType = typeGroup.value;
    imagePane.style.display = currentType === "image" ? "block" : "none";
    filePane.style.display = currentType === "file" ? "block" : "none";
    webPane.style.display = currentType === "web" ? "block" : "none";
  });

  cancelBtn?.addEventListener("click", () => {
    dialog.open = false;
    dialog.remove();
  });

  function ensurePreview(url) {
    imagePreview.innerHTML = url
      ? `<img src="${url}" style="max-width:100%;height:auto;border-radius:8px" />`
      : "";
  }

  pickImageBtn?.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", async () => {
      const file = input.files?.[0] || null;
      if (!file) return;
      const url = await toDataUrl(file);
      imageDataUrl = url;
      ensurePreview(url);
    });
    input.click();
  });

  cameraImageBtn?.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.addEventListener("change", async () => {
      const file = input.files?.[0] || null;
      if (!file) return;
      const url = await toDataUrl(file);
      imageDataUrl = url;
      ensurePreview(url);
    });
    input.click();
  });

  pickFileBtn?.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.addEventListener("change", async () => {
      const file = input.files?.[0] || null;
      if (!file) return;
      const url = await toDataUrl(file);
      fileDataUrl = url;
      fileDisplayName = file.name || "附件";
      fileName.textContent = fileDisplayName;
    });
    input.click();
  });

  webUrlInput?.addEventListener("input", () => {
    const url = webUrlInput.value || "";
    try {
      webPreview.src = url;
    } catch (e) {
      webPreview.removeAttribute("src");
    }
  });

  okBtn?.addEventListener("click", () => {
    if (currentType === "image") {
      if (!imageDataUrl) {
        showToast("请先选择图片");
        return;
      }
      const w = (imageWidthInput?.value || "").trim();
      const style = w ? `{width=${parseInt(w, 10)}}` : "";
      insertAtCursor(`\n\n![图片](${imageDataUrl})${style}\n\n`);
    } else if (currentType === "file") {
      if (!fileDataUrl) {
        showToast("请先选择文件");
        return;
      }
      const name = fileDisplayName || "附件";
      insertAtCursor(`\n\n[${name}](${fileDataUrl})\n\n`);
    } else if (currentType === "web") {
      const url = (webUrlInput?.value || "").trim();
      if (!url) {
        showToast("请输入链接");
        return;
      }
      insertAtCursor(`\n\n::iframe ${url}\n\n`);
    }
    dialog.open = false;
    dialog.remove();
  });
}

function initState() {
  const loaded = loadState();
  if (loaded) state = loaded;
  if (!Array.isArray(state.notes)) state.notes = [];
  if (state.notes.length === 0) {
    state.notes = [
      {
        id: uuid(),
        title: "欢迎",
        content:
          "# 欢迎\n\n- 这是本地笔记，自动保存在浏览器里\n- 支持 Markdown 预览\n\n快捷操作：\n\n- 右上角“+”新建\n- “编辑/预览”切换\n- 撤销/重做\n",
        createdAt: now(),
        updatedAt: now(),
      },
    ];
    state.activeId = state.notes[0].id;
    saveState();
  }
  sortNotes();
  if (!state.activeId || !state.notes.some((n) => n.id === state.activeId)) {
    state.activeId = state.notes[0].id;
  }
  renderList();
  selectNote(state.activeId);
}

newNoteBtn?.addEventListener("click", () => openTitleDialog("create"));
renameNoteBtn?.addEventListener("click", () => openTitleDialog("rename"));
deleteNoteBtn?.addEventListener("click", () => {
  deleteConfirmDialog.open = true;
});

titleCancelBtn?.addEventListener("click", () => {
  editTitleDialog.open = false;
});
titleOkBtn?.addEventListener("click", () => {
  const t = titleInput?.value ?? "";
  editTitleDialog.open = false;
  if (titleDialogMode === "rename") renameActiveNote(t);
  else createNote(t, "");
});

deleteCancelBtn?.addEventListener("click", () => {
  deleteConfirmDialog.open = false;
});
deleteOkBtn?.addEventListener("click", () => {
  deleteConfirmDialog.open = false;
  deleteActiveNote();
});

modeGroup?.addEventListener("change", () => setMode(modeGroup.value));

undoBtn?.addEventListener("click", () => {
  const value = history?.undo();
  if (value === null) return;
  if (noteEditor) noteEditor.value = value;
  const note = getActiveNote();
  if (note) {
    note.content = value;
    note.updatedAt = now();
    sortNotes();
    saveStateDebounced();
    renderList();
  }
  if (mode === "preview") updatePreview();
  updateUndoRedoButtons();
});

redoBtn?.addEventListener("click", () => {
  const value = history?.redo();
  if (value === null) return;
  if (noteEditor) noteEditor.value = value;
  const note = getActiveNote();
  if (note) {
    note.content = value;
    note.updatedAt = now();
    sortNotes();
    saveStateDebounced();
    renderList();
  }
  if (mode === "preview") updatePreview();
  updateUndoRedoButtons();
});

copyBtn?.addEventListener("click", async () => {
  try {
    await copyToClipboard(noteEditor?.value ?? "");
    showToast("已复制");
  } catch (e) {
    showToast("复制失败");
  }
});

insertBtn?.addEventListener("click", () => {
  openInsertDialog();
});

noteEditor?.addEventListener("input", onEditorInput);

searchInput?.addEventListener("input", () => {
  filterText = searchInput.value ?? "";
  renderList();
});

window.addEventListener("message", (event) => {
  if (!event?.data) return;
  if (event.data.type === "notes:create") {
    openTitleDialog("create");
  }
  if (event.data.type === "app:action") {
    const id = event.data.id;
    if (id === "notes:rename") {
      openTitleDialog("rename");
      return;
    }
    if (id === "notes:delete") {
      deleteConfirmDialog.open = true;
      return;
    }
    if (id === "notes:save") {
      saveState();
      showToast("已保存");
      return;
    }
    if (id === "notes:export_txt") {
      const note = getActiveNote();
      const title = (note?.title || "未命名").replace(/[\\/:*?"<>|]/g, "_");
      const content = note?.content || "";
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("已导出 TXT");
      return;
    }
  }
});

initState();
setMode(mode);

compactMedia = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;
isCompact = compactMedia?.matches ?? false;
setView(isCompact ? "list" : "detail");

try {
  compactMedia?.addEventListener("change", () => {
    syncCompactLayout();
  });
} catch (e) {}

backBtn?.addEventListener("click", () => {
  setView("list");
});
