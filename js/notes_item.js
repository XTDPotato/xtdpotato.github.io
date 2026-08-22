"use strict";

const STORAGE_KEY = "xtd_notes_v1";
const MODE_LOCK_KEY = "xtd_notes_mode_lock";
const MARKDOWN_SETTINGS_KEY = "xtd_notes_markdown_settings";
const NOTES_DB_NAME = "xtd_notes_db";
const NOTES_DB_STORE = "state";
const NOTES_DB_KEY = "main";
const MAX_HISTORY = 100;

const noteList = document.getElementById("noteList");
const activeTitle = document.getElementById("activeTitle");
const modeEditBtn = document.getElementById("modeEditBtn");
const modePreviewBtn = document.getElementById("modePreviewBtn");
const previewOnceBtn = document.getElementById("previewOnceBtn");
const modeGroup = document.getElementById("modeGroup");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");
const zoomValue = document.getElementById("zoomValue");
const editorContainer = document.getElementById("editorContainer");
const previewContainer = document.getElementById("previewContainer");
const previewBody = document.getElementById("previewBody");
const noteEditor = document.getElementById("noteEditor");
const notesApp = document.getElementById("notesApp");
const backBtn = document.getElementById("backBtn");

const newNoteBtn = document.getElementById("newNoteBtn");
const renameNoteBtn = document.getElementById("renameNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");
const notesMoreBtn = document.getElementById("notesMoreBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const copyBtn = document.getElementById("copyBtn");
const copyMenuItem = document.getElementById("copyMenuItem");
const formatMenuItem = document.getElementById("formatMenuItem");
const renameMenuItem = document.getElementById("renameMenuItem");
const deleteMenuItem = document.getElementById("deleteMenuItem");
const saveMenuItem = document.getElementById("saveMenuItem");
const exportMenuItem = document.getElementById("exportMenuItem");
const findMenuItem = document.getElementById("findMenuItem");
const insertMenuItem = document.getElementById("insertMenuItem");
const documentDetailsMenuItem = document.getElementById("documentDetailsMenuItem");
const documentDetailsDialog = document.getElementById("documentDetailsDialog");
const documentDetailsContent = document.getElementById("documentDetailsContent");
const documentDetailsClose = document.getElementById("documentDetailsClose");
const markdownSettingsMenuItem = document.getElementById("markdownSettingsMenuItem");
const markdownSettingsDialog = document.getElementById("markdownSettingsDialog");
const markdownSettingsClose = document.getElementById("markdownSettingsClose");
const markdownSettingsSave = document.getElementById("markdownSettingsSave");
const markdownFollowTheme = document.getElementById("markdownFollowTheme");
const markdownFontSize = document.getElementById("markdownFontSize");
const markdownBodyBackground = document.getElementById("markdownBodyBackground");
const markdownQuoteBackground = document.getElementById("markdownQuoteBackground");
const formatBoldBtn = document.getElementById("formatBoldBtn");
const formatItalicBtn = document.getElementById("formatItalicBtn");
const formatUnderlineBtn = document.getElementById("formatUnderlineBtn");
const formatStrikeBtn = document.getElementById("formatStrikeBtn");
const formatPainterBtn = document.getElementById("formatPainterBtn");
const formatHeadingItem = document.getElementById("formatHeadingItem");
const formatQuoteItem = document.getElementById("formatQuoteItem");
const formatBulletItem = document.getElementById("formatBulletItem");
const formatNumberItem = document.getElementById("formatNumberItem");
const fontSansItem = document.getElementById("fontSansItem");
const fontSerifItem = document.getElementById("fontSerifItem");
const fontMonoItem = document.getElementById("fontMonoItem");
const fontCursiveItem = document.getElementById("fontCursiveItem");
const fontDefaultItem = document.getElementById("fontDefaultItem");
const fontLargeItem = document.getElementById("fontLargeItem");
const fontSmallItem = document.getElementById("fontSmallItem");
const alignLeftItem = document.getElementById("alignLeftItem");
const alignCenterItem = document.getElementById("alignCenterItem");
const alignRightItem = document.getElementById("alignRightItem");
const insertBtn = document.getElementById("insertBtn");
const searchInput = document.getElementById("searchInput");
const lineNumbers = document.getElementById("lineNumbers");
const editorFindInput = document.getElementById("editorFindInput");
const editorReplaceInput = document.getElementById("editorReplaceInput");
const editorFindPrev = document.getElementById("editorFindPrev");
const editorFindNext = document.getElementById("editorFindNext");
const editorReplaceOne = document.getElementById("editorReplaceOne");
const editorReplaceAll = document.getElementById("editorReplaceAll");
const toggleFindBarItem = document.getElementById("toggleFindBarItem");
const editorFindbar = document.getElementById("editorFindbar");
const previewDialog = document.getElementById("previewDialog");
const previewCloseBtn = document.getElementById("previewCloseBtn");
const previewDialogTitle = document.getElementById("previewDialogTitle");
const previewZoomContent = document.getElementById("previewZoomContent");
const previewDialogBody = document.getElementById("previewDialogBody");
const previewZoomValue = document.getElementById("previewZoomValue");
const previewZoomIn = document.getElementById("previewZoomIn");
const previewZoomOut = document.getElementById("previewZoomOut");
const previewZoomReset = document.getElementById("previewZoomReset");

const editTitleDialog = document.getElementById("editTitleDialog");
const editTitleHeadline = document.getElementById("editTitleHeadline");
const titleInput = document.getElementById("titleInput");
const titleCancelBtn = document.getElementById("titleCancelBtn");
const titleOkBtn = document.getElementById("titleOkBtn");

const deleteConfirmDialog = document.getElementById("deleteConfirmDialog");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");
const deleteOkBtn = document.getElementById("deleteOkBtn");
const deleteConfirmText = document.getElementById("deleteConfirmText");
const listMoreDropdown = document.getElementById("listMoreDropdown");
const multiSelectMenuItem = document.getElementById("multiSelectMenuItem");
const importTxtMenuItem = document.getElementById("importTxtMenuItem");
const noteItemActionDialog = document.getElementById("noteItemActionDialog");
const noteItemActionTitle = document.getElementById("noteItemActionTitle");
const noteItemActionCancel = document.getElementById("noteItemActionCancel");
const noteItemActionRename = document.getElementById("noteItemActionRename");
const noteItemActionDelete = document.getElementById("noteItemActionDelete");

const notesSnackbar = document.getElementById("notesSnackbar");

let state = {
  notes: [],
  activeId: null,
  assets: {},
};

let filterText = "";
let mode = "edit";
let lockedMode = localStorage.getItem(MODE_LOCK_KEY) === "preview" ? "preview" : "edit";
let previewSessionType = null;
let titleDialogMode = "create";
let saveTimer = null;
let historyPushTimer = null;
let history = null;
let view = "list";
let compactMedia = null;
let isCompact = false;
let findBarOpen = false;
let previewZoom = 1;
let editorZoom = 1;
let pinchDistance = null;
let selectionMode = false;
let selectedNoteIds = new Set();
let deleteMode = "single";
let copiedFormat = null;
let markdownSettings = (() => {
  try { return { followTheme: true, fontSize: 15, bodyBackground: "transparent", quoteBackground: "rgba(0, 0, 0, 0.5)", ...JSON.parse(localStorage.getItem(MARKDOWN_SETTINGS_KEY) || "{}")} } catch (error) { return { followTheme: true, fontSize: 15, bodyBackground: "transparent", quoteBackground: "rgba(0, 0, 0, 0.5)" }; }
})();

function applyMarkdownSettings() {
  const root = notesApp || document.documentElement;
  root.style.setProperty("--md-font-size", `${Math.max(12, Math.min(32, Number(markdownSettings.fontSize) || 15))}px`);
  root.style.setProperty("--md-body-background", markdownSettings.followTheme ? "transparent" : String(markdownSettings.bodyBackground || "transparent"));
  root.style.setProperty("--md-blockquote-background", String(markdownSettings.quoteBackground || "rgba(0, 0, 0, 0.5)"));
  window.parent?.postMessage({ type: "notes:markdown-settings", settings: markdownSettings }, "*");
}

function setFindBarOpen(open) {
  findBarOpen = Boolean(open);
  if (editorFindbar) editorFindbar.style.display = findBarOpen && mode === "edit" ? "flex" : "none";
  if (toggleFindBarItem) toggleFindBarItem.textContent = findBarOpen ? "关闭搜索和替换" : "搜索和替换";
}

function setPreviewZoom(nextZoom) {
  previewZoom = Math.min(3, Math.max(0.3, nextZoom));
  if (previewZoomContent) {
    previewZoomContent.style.transform = "none";
    previewZoomContent.style.zoom = String(previewZoom);
    previewZoomContent.style.width = `${100 / previewZoom}%`;
    previewZoomContent.style.maxWidth = "none";
  }
  if (previewZoomValue) previewZoomValue.textContent = `${Math.round(previewZoom * 100)}%`;
}

function setEditorZoom(nextZoom) {
  editorZoom = Math.min(3, Math.max(0.3, nextZoom));
  const fontSize = 16 * editorZoom;
  const lineHeight = 24 * editorZoom;
  const verticalPadding = 16 * editorZoom;
  const horizontalPadding = 16 * editorZoom;
  if (noteEditor) {
    noteEditor.style.fontSize = `${fontSize}px`;
    noteEditor.style.lineHeight = `${lineHeight}px`;
    noteEditor.style.padding = `${verticalPadding}px ${horizontalPadding}px`;
  }
  if (lineNumbers) {
    lineNumbers.style.fontSize = `${fontSize}px`;
    lineNumbers.style.lineHeight = `${lineHeight}px`;
    lineNumbers.style.padding = `${verticalPadding}px ${8 * editorZoom}px`;
    lineNumbers.style.borderRightWidth = `${Math.max(0.3, editorZoom)}px`;
  }
  if (editorShell) {
    editorShell.style.setProperty("--editor-zoom", String(editorZoom));
    editorShell.style.gridTemplateColumns = `${48 * editorZoom}px minmax(0, 1fr)`;
  }
  if (zoomValue) zoomValue.textContent = `${Math.round(editorZoom * 100)}%`;
  updateEditorExtent();
  requestAnimationFrame(() => {
    if (!editorScroll) return;
    editorScroll.scrollTop = Math.min(editorScroll.scrollTop, Math.max(0, editorScroll.scrollHeight - editorScroll.clientHeight));
  });
}

function setModeButtonState() {
  if (modeEditBtn) modeEditBtn.variant = lockedMode === "edit" ? "filled" : "standard";
  if (modePreviewBtn) modePreviewBtn.variant = lockedMode === "preview" ? "filled" : "standard";
  if (previewOnceBtn) previewOnceBtn.variant = previewSessionType === "once" ? "tonal" : "standard";
}

function escapeHtmlAttribute(value) {
  return String(value || "").replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/</g, "&#60;");
}

function normalizeMediaDimension(value, fallback = "") {
  const text = String(value || "").trim();
  if (!text) return fallback;
  if (/^\d+(?:\.\d+)?%$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?px$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return `${text}px`;
  return fallback;
}

function expandAssetReferences(markdown) {
  return String(markdown || "").replace(
    /!\[([^\]]*)\]\(note-asset:\/\/([a-zA-Z0-9_-]+)\)(?:\{([^}]*)\})?/g,
    (match, alt, assetId, styleSpec = "") => {
      const src = String(state.assets?.[assetId]?.dataUrl || "");
      if (!src) return `> 图片资源不存在：${assetId}`;
      const width = styleSpec.match(/width\s*=\s*(\d+(?:\.\d+)?(?:px|%)?)/i)?.[1];
      const height = styleSpec.match(/height\s*=\s*(\d+(?:\.\d+)?(?:px|%)?)/i)?.[1];
      const styles = ["max-width:100%", "height:auto", "border-radius:6px"];
      if (width) styles.push(`width:${normalizeMediaDimension(width)}`);
      if (height) styles.push(`height:${normalizeMediaDimension(height)}`);
      const safeAlt = String(alt || "图片").replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/</g, "&#60;");
      const safeSrc = src.replace(/&/g, "&#38;").replace(/"/g, "&#34;");
      return `<img src="${safeSrc}" alt="${safeAlt}" style="${styles.join(";")}" />`;
    },
  );
}

function expandAssetReferencesForExport(markdown) {
  return String(markdown || "").replace(
    /!\[([^\]]*)\]\(note-asset:\/\/([a-zA-Z0-9_-]+)\)(?:\{([^}]*)\})?/g,
    (match, alt, assetId, styleSpec = "") => {
      const dataUrl = String(state.assets?.[assetId]?.dataUrl || "");
      if (!dataUrl) return match;
      const safeAlt = String(alt || "图片").replace(/[\[\]]/g, "");
      return `![${safeAlt}](${dataUrl})${styleSpec ? `{${styleSpec}}` : ""}`;
    },
  ).replace(/note-asset:\/\/([a-zA-Z0-9_-]+)/g, (match, assetId) => {
    return String(state.assets?.[assetId]?.dataUrl || match);
  });
}

function openPreviewDialog() {
  const note = getActiveNote();
  const markdown = expandAssetReferences(noteEditor?.value ?? "");
  window.parent?.postMessage({
    type: "notes:preview",
    title: note?.title || "预览",
    markdown,
  }, "*");
  if (previewDialog) previewDialog.open = false;
}

function closePreviewDialog() {
  if (previewDialog) previewDialog.open = false;
  setMode("edit");
}

function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "note_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

function now() {
  return Date.now();
}

function showToast(text, color) {
  window.parent?.postMessage({ type: "app:toast", text, color }, "*");
}

function setView(nextView) {
  view = nextView === "detail" ? "detail" : "list";
  if (notesApp) notesApp.dataset.view = view;
  window.parent?.postMessage({ type: "notes:view-state", detail: view === "detail" }, "*");
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
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  out = out.replace(/\+\+([^+\n]+)\+\+/g, "<u>$1</u>");
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return out;
}

function renderMarkdown(md) {
  const lines = String(md ?? "").split(/\r?\n/);
  let html = "";
  let inCode = false;
  let codeBuffer = [];
  let listMode = null;
  let paragraph = [];
  let htmlBlock = null;
  let htmlRootTag = null;
  let htmlDepth = 0;

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
    const code = escapeHtml(codeBuffer.join("\n"));
    html += `<pre><code>${code}</code></pre>`;
    codeBuffer = [];
    inCode = false;
  };
  const flushHtml = () => {
    if (htmlBlock === null) return;
    const source = htmlBlock.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
    html += source;
    htmlBlock = null;
    htmlRootTag = null;
    htmlDepth = 0;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (htmlBlock !== null) {
      htmlBlock += `${line}\n`;
      const openCount = (line.match(new RegExp(`<${htmlRootTag}(?:\\s|>)`, "gi")) || []).length;
      const closeCount = (line.match(new RegExp(`</${htmlRootTag}\\s*>`, "gi")) || []).length;
      htmlDepth += openCount - closeCount;
      if (htmlDepth <= 0) flushHtml();
      continue;
    }
    const htmlStart = trimmed.match(/^<([a-z][\w:-]*)(?:\s|>)/i);
    if (htmlStart && !trimmed.startsWith("<!--")) {
      flushParagraph();
      flushList();
      htmlRootTag = htmlStart[1];
      htmlBlock = `${line}\n`;
      const openCount = (line.match(new RegExp(`<${htmlRootTag}(?:\\s|>)`, "gi")) || []).length;
      const closeCount = (line.match(new RegExp(`</${htmlRootTag}\\s*>`, "gi")) || []).length;
      htmlDepth = openCount - closeCount;
      if (/\/\s*>$/.test(trimmed) || htmlDepth <= 0) flushHtml();
      continue;
    }
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

    if (!trimmed) {
      flushHtml();
      flushParagraph();
      flushList();
      continue;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\{([^}]+)\})?$/);
    if (imageMatch) {
      flushParagraph();
      flushList();
      const alt = imageMatch[1] || "";
      const sourceRef = imageMatch[2];
      const assetId = sourceRef.startsWith("note-asset://") ? sourceRef.slice("note-asset://".length) : "";
      const src = assetId ? String(state.assets?.[assetId]?.dataUrl || "") : sourceRef;
      const styleSpec = (imageMatch[3] || "").trim();
      let style = "max-width:100%;height:auto;border-radius:6px";
      const widthMatch = styleSpec.match(/width\s*=\s*(\d+(?:\.\d+)?(?:px|%)?)/i);
      const heightMatch = styleSpec.match(/height\s*=\s*(\d+(?:\.\d+)?(?:px|%)?)/i);
      if (widthMatch) style += `;width:${normalizeMediaDimension(widthMatch[1])}`;
      if (heightMatch) style += `;height:${normalizeMediaDimension(heightMatch[1])}`;
      if (!src) {
        html += `<div style="margin:8px 0;padding:12px;border:1px dashed var(--mdui-color-outline)">图片资源不存在</div>`;
      } else {
        html += `<div style="margin:8px 0"><img alt="${escapeHtml(alt)}" src="${src}" style="${style}"></div>`;
      }
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
    flushHtml();
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
      assets: parsed.assets && typeof parsed.assets === "object" ? parsed.assets : {},
    };
  } catch (e) {
    return null;
  }
}

function migrateInlineImageAssets() {
  if (!state.assets || typeof state.assets !== "object") state.assets = {};
  let changed = false;
  const pattern = /!\[([^\]]*)\]\((data:image\/[a-zA-Z0-9.+-]+;base64,[^)]+)\)(\{[^}]*\})?/g;
  state.notes.forEach((note) => {
    note.content = String(note.content || "").replace(pattern, (full, alt, dataUrl, style = "") => {
      const assetId = `img_${uuid()}`;
      state.assets[assetId] = { dataUrl, name: alt || "图片", createdAt: now() };
      changed = true;
      return `![${alt || "图片"}](note-asset://${assetId})${style}`;
    });
  });
  return changed;
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

function notifySelectionState() {
  window.parent?.postMessage({
    type: "notes:selection-state",
    active: selectionMode,
    count: selectedNoteIds.size,
  }, "*");
}

function setSelectionMode(active) {
  const nextMode = Boolean(active);
  const exiting = selectionMode && !nextMode;
  selectionMode = nextMode;
  if (!selectionMode) selectedNoteIds.clear();
  if (notesApp) {
    notesApp.dataset.selectionMode = String(selectionMode);
    notesApp.dataset.selectionExiting = String(exiting);
  }
  if (multiSelectMenuItem) {
    multiSelectMenuItem.textContent = selectionMode ? "取消多选" : "多选";
    multiSelectMenuItem.setAttribute("icon", selectionMode ? "close" : "checklist");
  }
  if (exiting) {
    window.setTimeout(() => {
      if (notesApp) notesApp.dataset.selectionExiting = "false";
      renderList();
    }, 160);
  } else {
    renderList();
  }
  notifySelectionState();
}

function toggleNoteSelection(noteId) {
  if (selectedNoteIds.has(noteId)) selectedNoteIds.delete(noteId);
  else selectedNoteIds.add(noteId);
  renderList();
  notifySelectionState();
}

function openNoteItemActions(note) {
  if (!note) return;
  state.activeId = note.id;
  saveState();
  renderList();
  if (noteItemActionTitle) noteItemActionTitle.textContent = note.title || "未命名";
  if (noteItemActionDialog) noteItemActionDialog.open = true;
}

function openDeleteConfirmation(mode = "single") {
  deleteMode = mode;
  if (mode === "multiple") {
    const count = selectedNoteIds.size;
    if (!count) {
      showToast("请先选择笔记");
      return;
    }
    if (deleteConfirmText) deleteConfirmText.textContent = `确定要删除选中的 ${count} 篇笔记吗？`;
  } else {
    const note = getActiveNote();
    if (!note) return;
    if (deleteConfirmText) deleteConfirmText.textContent = `确定要删除“${note.title || "未命名"}”吗？`;
  }
  if (deleteConfirmDialog) deleteConfirmDialog.open = true;
}

function renderList() {
  if (!noteList) return;
  noteList.innerHTML = "";
  const notes = computeFilteredNotes();
  if (notes.length === 0) {
    const empty = document.createElement("mdui-list-item");
    empty.setAttribute("disabled", "");
    empty.textContent = filterText ? "没有匹配的笔记" : "暂无笔记，点击左上角 + 新建";
    noteList.appendChild(empty);
    return;
  }
  for (const note of notes) {
    const item = document.createElement("mdui-list-item");
    item.setAttribute("rounded", "");
    item.dataset.id = note.id;
    item.textContent = note.title || "未命名";
    const desc = formatTime(note.updatedAt || note.createdAt);
    if (desc) item.setAttribute("description", desc);
    if ((note.id === state.activeId && !selectionMode) || (selectionMode && selectedNoteIds.has(note.id))) {
      item.setAttribute("active", "");
    }
    if (selectionMode) {
      const checkbox = document.createElement("mdui-checkbox");
      checkbox.setAttribute("slot", "start-icon");
      checkbox.checked = selectedNoteIds.has(note.id);
      checkbox.tabIndex = -1;
      checkbox.style.pointerEvents = "none";
      item.appendChild(checkbox);
    }

    let longPressTimer = null;
    let longPressTriggered = false;
    let pressStartX = 0;
    let pressStartY = 0;

    const cancelLongPress = () => {
      if (longPressTimer !== null) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    item.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      longPressTriggered = false;
      pressStartX = event.clientX;
      pressStartY = event.clientY;
      cancelLongPress();
      longPressTimer = window.setTimeout(() => {
        longPressTimer = null;
        longPressTriggered = true;
        if (selectionMode) toggleNoteSelection(note.id);
        else openNoteItemActions(note);
        if (navigator.vibrate) navigator.vibrate(35);
      }, 600);
    });

    item.addEventListener("pointermove", (event) => {
      if (Math.hypot(event.clientX - pressStartX, event.clientY - pressStartY) > 10) cancelLongPress();
    });
    item.addEventListener("pointerup", cancelLongPress);
    item.addEventListener("pointercancel", cancelLongPress);
    item.addEventListener("pointerleave", cancelLongPress);
    item.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      cancelLongPress();
      longPressTriggered = true;
      if (selectionMode) toggleNoteSelection(note.id);
      else openNoteItemActions(note);
    });
    item.addEventListener("click", (event) => {
      if (longPressTriggered) {
        event.preventDefault();
        event.stopPropagation();
        longPressTriggered = false;
        return;
      }
      if (selectionMode) {
        event.preventDefault();
        toggleNoteSelection(note.id);
        return;
      }
      selectNote(note.id);
    });
    noteList.appendChild(item);
  }
}

function updateActiveHeader() {
  const note = getActiveNote();
  if (!activeTitle) return;
  activeTitle.textContent = note ? note.title || "未命名" : "未选择";
  notifyTopbar();
}

function setMode(nextMode, options = {}) {
  mode = nextMode === "preview" ? "preview" : "edit";
  if (options.lock !== false) {
    lockedMode = mode;
    localStorage.setItem(MODE_LOCK_KEY, lockedMode);
  }
  if (mode === "preview") previewSessionType = options.once ? "once" : "locked";
  else previewSessionType = null;
  setModeButtonState();
  if (modeGroup) {
    modeGroup.value = mode;
    modeGroup.setAttribute("value", mode);
  }
  if (mode === "preview") {
    setFindBarOpen(false);
    openPreviewDialog();
    return;
  }
  if (previewDialog?.open) previewDialog.open = false;
  if (previewContainer) previewContainer.style.display = "none";
  if (editorContainer) editorContainer.style.display = "block";
  setFindBarOpen(findBarOpen);
}

function updatePreview() {
  const md = noteEditor?.value ?? "";
  previewBody.innerHTML = renderMarkdown(md);
}

function updateUndoRedoButtons() {
  if (undoBtn) undoBtn.disabled = !history?.canUndo();
  if (redoBtn) redoBtn.disabled = !history?.canRedo();
}

function loadNoteForEdit(noteId) {
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return;
  state.activeId = note.id;
  if (noteEditor) noteEditor.value = note.content ?? "";
  updateLineNumbers();
  history = createHistory(note.content ?? "");
  updateActiveHeader();
  setMode(lockedMode, { lock: false, once: false });
  updateUndoRedoButtons();
}

function selectNote(noteId) {
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return;
  setView("detail");

  if (isCompact) setView("detail");

  state.activeId = note.id;
  saveStateDebounced();

  if (noteEditor) noteEditor.value = note.content ?? "";
  updateLineNumbers();
  if (!history) history = createHistory(note.content ?? "");
  history.reset(note.content ?? "");

  renderList();
  updateActiveHeader();
  setMode(lockedMode, { lock: false, once: false });
  if (lockedMode === "preview") updatePreview();
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
  if (!Array.isArray(state.notes)) state.notes = [];
  state.notes.unshift(note);
  state.activeId = note.id;
  sortNotes();
  saveState();
  renderList();
  loadNoteForEdit(note.id);
  if (isCompact) setView("detail");
  noteEditor?.focus();
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

function updateLineNumbers() {
  if (!lineNumbers) return;
  const count = Math.max(1, String(noteEditor?.value ?? "").split("\n").length);
  lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join("\n");
  updateEditorExtent();
}

const editorShell = document.querySelector(".editor-shell");
const editorScroll = document.getElementById("editorScroll");

function updateEditorExtent() {
  if (!noteEditor) return;
  const lines = String(noteEditor.value || "").split("\n");
  const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const lineHeight = 24 * editorZoom;
  const verticalPadding = 16 * editorZoom;
  const contentHeight = Math.ceil(lines.length * lineHeight + verticalPadding * 2);
  const viewportHeight = editorScroll?.clientHeight || 0;
  const editorHeight = Math.max(viewportHeight, contentHeight);
  // monospace 字体下用 ch 表示真实内容宽度，编辑区域可向右无限延伸。
  noteEditor.style.minWidth = `max(100%, ${Math.max(1, longestLine + 2)}ch)`;
  noteEditor.style.minHeight = "0";
  noteEditor.style.height = `${editorHeight}px`;
  if (lineNumbers) {
    lineNumbers.style.minHeight = "0";
    lineNumbers.style.height = `${editorHeight}px`;
  }
}

editorScroll?.addEventListener("scroll", () => {
  // 横向只滚动编辑内容；行号固定。纵向滚动时让行号与真实换行保持对齐。
  if (lineNumbers) lineNumbers.style.transform = `translateY(-${editorScroll.scrollTop}px)`;
});

window.addEventListener("resize", () => {
  updateEditorExtent();
  if (!editorScroll) return;
  editorScroll.scrollTop = Math.min(editorScroll.scrollTop, Math.max(0, editorScroll.scrollHeight - editorScroll.clientHeight));
});

function findEditorText(direction = 1) {
  const query = String(editorFindInput?.value || "");
  const value = String(noteEditor?.value || "");
  if (!query) {
    showToast("请输入搜索文本");
    return false;
  }
  const native = getEditorNative();
  const anchor = direction > 0 ? (native?.selectionEnd || 0) : (native?.selectionStart || value.length);
  let index = direction > 0 ? value.indexOf(query, anchor) : value.lastIndexOf(query, anchor - 1);
  if (index < 0) index = direction > 0 ? value.indexOf(query) : value.lastIndexOf(query);
  if (index < 0) {
    showToast("没有找到匹配文本");
    return false;
  }
  native?.focus();
  if (native) {
    native.selectionStart = index;
    native.selectionEnd = index + query.length;
  }
  return true;
}

function replaceCurrentMatch() {
  const query = String(editorFindInput?.value || "");
  if (!query) return findEditorText(1);
  const replacement = String(editorReplaceInput?.value || "");
  const native = getEditorNative();
  const value = String(noteEditor?.value || "");
  if (!native || value.slice(native.selectionStart, native.selectionEnd) !== query) {
    if (!findEditorText(1)) return;
  }
  const start = native.selectionStart;
  const end = native.selectionEnd;
  noteEditor.value = value.slice(0, start) + replacement + value.slice(end);
  native.selectionStart = native.selectionEnd = start + replacement.length;
  onEditorInput();
}

function replaceAllMatches() {
  const query = String(editorFindInput?.value || "");
  if (!query) {
    showToast("请输入搜索文本");
    return;
  }
  const value = String(noteEditor?.value || "");
  const count = value.split(query).length - 1;
  if (!count) {
    showToast("没有找到匹配文本");
    return;
  }
  noteEditor.value = value.split(query).join(String(editorReplaceInput?.value || ""));
  onEditorInput();
  showToast(`已替换 ${count} 处`);
}

function onEditorInput() {
  const note = getActiveNote();
  if (!note) return;

  const value = noteEditor?.value ?? "";
  updateLineNumbers();
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

function formatByteSize(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(2)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function estimateDataUrlBytes(dataUrl) {
  const value = String(dataUrl || "");
  const comma = value.indexOf(",");
  if (comma < 0) return new TextEncoder().encode(value).length;
  const metadata = value.slice(0, comma);
  const payload = value.slice(comma + 1);
  if (/;base64/i.test(metadata)) {
    return Math.max(0, Math.floor(payload.length * 3 / 4) - (payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0));
  }
  try {
    return new TextEncoder().encode(decodeURIComponent(payload)).length;
  } catch (error) {
    return new TextEncoder().encode(payload).length;
  }
}

function openDocumentDetails() {
  if (!documentDetailsDialog || !documentDetailsContent) return;
  const note = getActiveNote();
  const text = String(noteEditor?.value ?? note?.content ?? "");
  const cjkCount = (text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []).length;
  const nonWhitespaceCount = (text.match(/\S/g) || []).length;
  const wordCount = (text.replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g, " ").match(/[\p{L}\p{N}]+/gu) || []).length;
  const lineCount = text.length ? text.split(/\r?\n/).length : 0;
  const paragraphCount = text.trim() ? text.trim().split(/(?:\r?\n){2,}/).filter((part) => part.trim()).length : 0;
  const bodyBytes = new TextEncoder().encode(text).length;
  const assetIds = new Set([...text.matchAll(/note-asset:\/\/([a-zA-Z0-9_-]+)/g)].map((match) => match[1]));
  let assetBytes = 0;
  assetIds.forEach((assetId) => { assetBytes += estimateDataUrlBytes(state.assets?.[assetId]?.dataUrl); });
  const rows = [
    ["总字符", text.length.toLocaleString()],
    ["非空白字符", nonWhitespaceCount.toLocaleString()],
    ["中文字", cjkCount.toLocaleString()],
    ["单词", wordCount.toLocaleString()],
    ["行数", lineCount.toLocaleString()],
    ["段落", paragraphCount.toLocaleString()],
    ["正文大小", formatByteSize(bodyBytes)],
    ["资源数量", assetIds.size.toLocaleString()],
    ["资源大小", formatByteSize(assetBytes)],
    ["合计大小", formatByteSize(bodyBytes + assetBytes)],
  ];
  documentDetailsContent.innerHTML = rows.map(([label, value]) => `<span class="detail-label">${label}</span><strong class="detail-value">${value}</strong>`).join("");
  documentDetailsDialog.open = true;
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
  if (typeof el.selectionStart === "number") return el;
  const sr = el.shadowRoot || null;
  if (!sr) return null;
  return sr.querySelector("textarea") || sr.querySelector("input");
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

function openImageReferenceEditor(lineStart, lineEnd, match) {
  const [, altText, assetId, styleSpec = ""] = match;
  const dialog = document.createElement("mdui-dialog");
  dialog.setAttribute("fullscreen", "");
  dialog.setAttribute("close-on-esc", "");
  const width = styleSpec.match(/width\s*=\s*(\d+)/i)?.[1] || "";
  const height = styleSpec.match(/height\s*=\s*(\d+)/i)?.[1] || "";
  const dataUrl = String(state.assets?.[assetId]?.dataUrl || "");
  dialog.innerHTML = `
    <mdui-top-app-bar slot="header">
      <mdui-button-icon id="assetEditClose" icon="close" aria-label="关闭"></mdui-button-icon>
      <mdui-top-app-bar-title>图片设置</mdui-top-app-bar-title>
      <div style="flex:1"></div>
      <mdui-button-icon id="assetEditSave" icon="check" aria-label="保存"></mdui-button-icon>
    </mdui-top-app-bar>
    <div style="display:grid;gap:12px;padding:16px;box-sizing:border-box">
      <img src="${dataUrl}" alt="图片预览" style="display:block;max-width:100%;max-height:45vh;margin:auto;border-radius:6px">
      <mdui-text-field id="assetAlt" label="替代文本" variant="outlined" value="${escapeHtml(altText)}"></mdui-text-field>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <mdui-text-field id="assetWidth" label="宽度(px，可选)" variant="outlined" value="${width}"></mdui-text-field>
        <mdui-text-field id="assetHeight" label="高度(px，可选)" variant="outlined" value="${height}"></mdui-text-field>
      </div>
      <mdui-button id="assetReplace" variant="tonal" icon="image">替换图片</mdui-button>
    </div>`;
  document.body.appendChild(dialog);
  const close = () => {
    dialog.open = false;
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
  };
  dialog.querySelector("#assetEditClose")?.addEventListener("click", close);
  dialog.querySelector("#assetReplace")?.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      state.assets[assetId] = { ...(state.assets[assetId] || {}), dataUrl: await toDataUrl(file), name: file.name || altText, updatedAt: now() };
      saveState();
      dialog.querySelector("img").src = state.assets[assetId].dataUrl;
    });
    input.click();
  });
  dialog.querySelector("#assetEditSave")?.addEventListener("click", () => {
    const alt = String(dialog.querySelector("#assetAlt")?.value || "图片").replace(/[\[\]]/g, "");
    const w = parseInt(dialog.querySelector("#assetWidth")?.value || "", 10);
    const h = parseInt(dialog.querySelector("#assetHeight")?.value || "", 10);
    const fields = [];
    if (Number.isFinite(w) && w > 0) fields.push(`width=${w}`);
    if (Number.isFinite(h) && h > 0) fields.push(`height=${h}`);
    const replacement = `![${alt}](note-asset://${assetId})${fields.length ? `{${fields.join(" ")}}` : ""}`;
    noteEditor.setRangeText(replacement, lineStart, lineEnd, "end");
    onEditorInput();
    close();
  });
  dialog.open = true;
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

noteEditor?.addEventListener("dblclick", () => {
  const value = String(noteEditor.value || "");
  const cursor = noteEditor.selectionStart || 0;
  const lineStart = value.lastIndexOf("\n", Math.max(0, cursor - 1)) + 1;
  const nextBreak = value.indexOf("\n", cursor);
  const lineEnd = nextBreak < 0 ? value.length : nextBreak;
  const line = value.slice(lineStart, lineEnd).trim();
  const match = line.match(/^!\[([^\]]*)\]\(note-asset:\/\/([a-zA-Z0-9_-]+)\)(?:\{([^}]*)\})?$/);
  if (match) openImageReferenceEditor(lineStart, lineEnd, match);
});

function notifyInsertDialogState(open) {
  window.parent?.postMessage({ type: "notes:insert-dialog-state", open: Boolean(open) }, "*");
}

function openLinkInsertDialog() {
  const dialog = document.createElement("mdui-dialog");
  dialog.setAttribute("fullscreen", "");
  dialog.setAttribute("close-on-esc", "");
  dialog.innerHTML = `
    <section style="display:flex;flex-direction:column;height:100dvh">
      <mdui-top-app-bar>
        <mdui-button-icon data-cancel icon="close" aria-label="关闭"></mdui-button-icon>
        <mdui-top-app-bar-title>插入超链接</mdui-top-app-bar-title>
        <div style="flex:1"></div>
        <mdui-button-icon data-confirm icon="check" aria-label="插入"></mdui-button-icon>
      </mdui-top-app-bar>
      <div style="display:grid;gap:12px;padding:16px;overflow:auto">
        <mdui-text-field id="insertLinkText" label="显示文本" variant="outlined"></mdui-text-field>
        <mdui-text-field id="insertLinkUrl" label="链接地址" variant="outlined" type="url"></mdui-text-field>
      </div>
    </section>`;
  document.body.appendChild(dialog);
  notifyInsertDialogState(true);
  dialog.addEventListener("close", () => notifyInsertDialogState(false), { once: true });
  const native = getEditorNative();
  const selected = native && native.selectionEnd > native.selectionStart
    ? String(noteEditor.value).slice(native.selectionStart, native.selectionEnd)
    : "链接";
  const textInput = dialog.querySelector("#insertLinkText");
  const urlInput = dialog.querySelector("#insertLinkUrl");
  textInput.value = selected;
  const close = () => {
    dialog.open = false;
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
  };
  dialog.querySelector("[data-cancel]")?.addEventListener("click", close);
  dialog.querySelector("[data-confirm]")?.addEventListener("click", () => {
    const url = String(urlInput?.value || "").trim();
    if (!url) {
      showToast("请输入链接地址");
      return;
    }
    insertAtCursor(`[${String(textInput?.value || "链接").trim() || "链接"}](${url})`);
    close();
  });
  dialog.open = true;
  setTimeout(() => urlInput?.focus(), 0);
}

function openInsertDialog(initialType = "image") {
  const currentType = ["image", "file", "web", "video"].includes(initialType) ? initialType : "image";
  const titles = { image: "展示图片", file: "展示文件内容", web: "展示网页", video: "展示视频" };
  const dialog = document.createElement("mdui-dialog");
  dialog.setAttribute("fullscreen", "");
  dialog.setAttribute("close-on-esc", "");

  const imageContent = `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <mdui-button id="pickImageBtn" variant="tonal" icon="image">相册</mdui-button>
      <mdui-button id="cameraImageBtn" variant="tonal" icon="photo_camera">拍照</mdui-button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <mdui-text-field id="imageWidthInput" label="宽度，如 320px 或 80%" variant="outlined"></mdui-text-field>
      <mdui-text-field id="imageHeightInput" label="高度，如 180px 或 50%" variant="outlined"></mdui-text-field>
    </div>
    <div id="imagePreview" style="margin-top:12px;max-height:48vh;overflow:auto"></div>`;
  const fileContent = `
    <mdui-button id="pickFileBtn" variant="tonal" icon="attach_file">选择文件</mdui-button>
    <div id="fileName" style="margin-top:12px;color:rgb(var(--mdui-color-on-surface-variant));overflow-wrap:anywhere">尚未选择文件</div>`;
  const webContent = `
    <mdui-text-field id="webUrlInput" label="网页地址" variant="outlined" type="url" style="width:100%"></mdui-text-field>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <mdui-text-field id="mediaWidthInput" label="宽度，如 100% 或 640px" variant="outlined" value="100%"></mdui-text-field>
      <mdui-text-field id="mediaHeightInput" label="高度，如 60% 或 360px" variant="outlined" value="360px"></mdui-text-field>
    </div>
    <iframe id="webPreview" title="网页预览" style="width:100%;height:min(46vh,360px);margin-top:12px;border:1px solid var(--mdui-color-outline-variant);border-radius:6px"></iframe>`;
  const videoContent = `
    <mdui-text-field id="videoUrlInput" label="视频地址" variant="outlined" type="url" style="width:100%"></mdui-text-field>
    <mdui-button id="pickVideoBtn" variant="tonal" icon="video_library" style="margin-top:12px">选择本地视频</mdui-button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <mdui-text-field id="mediaWidthInput" label="宽度，如 100% 或 640px" variant="outlined" value="100%"></mdui-text-field>
      <mdui-text-field id="mediaHeightInput" label="高度，如 56% 或 360px" variant="outlined" value="360px"></mdui-text-field>
    </div>
    <video id="videoPreview" controls style="display:block;width:100%;max-height:42vh;margin-top:12px;background:#000"></video>`;

  dialog.innerHTML = `
    <section style="display:flex;flex-direction:column;height:100dvh">
      <mdui-top-app-bar>
        <mdui-button-icon id="insertCancelBtn" icon="close" aria-label="关闭"></mdui-button-icon>
        <mdui-top-app-bar-title>${titles[currentType]}</mdui-top-app-bar-title>
        <div style="flex:1"></div>
        <mdui-button-icon id="insertOkBtn" icon="check" aria-label="插入"></mdui-button-icon>
      </mdui-top-app-bar>
      <div style="flex:1;min-height:0;overflow:auto;padding:16px;box-sizing:border-box">
        ${currentType === "image" ? imageContent : currentType === "file" ? fileContent : currentType === "video" ? videoContent : webContent}
      </div>
    </section>`;
  document.body.appendChild(dialog);
  notifyInsertDialogState(true);
  dialog.addEventListener("close", () => notifyInsertDialogState(false), { once: true });
  dialog.open = true;

  const cancelBtn = dialog.querySelector("#insertCancelBtn");
  const okBtn = dialog.querySelector("#insertOkBtn");
  const pickImageBtn = dialog.querySelector("#pickImageBtn");
  const cameraImageBtn = dialog.querySelector("#cameraImageBtn");
  const imageWidthInput = dialog.querySelector("#imageWidthInput");
  const imageHeightInput = dialog.querySelector("#imageHeightInput");
  const mediaWidthInput = dialog.querySelector("#mediaWidthInput");
  const mediaHeightInput = dialog.querySelector("#mediaHeightInput");
  const videoUrlInput = dialog.querySelector("#videoUrlInput");
  const pickVideoBtn = dialog.querySelector("#pickVideoBtn");
  const videoPreview = dialog.querySelector("#videoPreview");
  const imagePreview = dialog.querySelector("#imagePreview");
  const pickFileBtn = dialog.querySelector("#pickFileBtn");
  const fileName = dialog.querySelector("#fileName");
  const webUrlInput = dialog.querySelector("#webUrlInput");
  const webPreview = dialog.querySelector("#webPreview");

  let imageDataUrl = null;
  let fileDataUrl = null;
  let fileDisplayName = "";
  let videoSource = "";

  cancelBtn?.addEventListener("click", () => {
    dialog.open = false;
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
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
      fileDisplayName = file.name || "附件";
      const isText = file.type.startsWith("text/") || /\.(txt|md|json|js|ts|css|html|xml|csv|log|py|java|c|cpp|h|sh)$/i.test(fileDisplayName);
      fileDataUrl = isText ? await file.text() : await toDataUrl(file);
      fileName.textContent = `${fileDisplayName}${isText ? "（将展示文件内容）" : "（将作为附件链接）"}`;
    });
    input.click();
  });

  videoUrlInput?.addEventListener("input", () => {
    videoSource = String(videoUrlInput.value || "").trim();
    if (videoPreview) videoPreview.src = videoSource;
  });
  pickVideoBtn?.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const assetId = `video_${uuid()}`;
      state.assets[assetId] = { dataUrl: await toDataUrl(file), name: file.name || "视频", createdAt: now(), type: "video" };
      saveState();
      videoSource = `note-asset://${assetId}`;
      if (videoUrlInput) videoUrlInput.value = videoSource;
      if (videoPreview) videoPreview.src = state.assets[assetId].dataUrl;
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
      const w = normalizeMediaDimension(imageWidthInput?.value);
      const h = normalizeMediaDimension(imageHeightInput?.value);
      const fields = [];
      if (w) fields.push(`width=${w}`);
      if (h) fields.push(`height=${h}`);
      const style = fields.length ? `{${fields.join(" ")}}` : "";
      const assetId = `img_${uuid()}`;
      state.assets[assetId] = { dataUrl: imageDataUrl, name: "图片", createdAt: now() };
      saveState();
      insertAtCursor(`\n\n![图片](note-asset://${assetId})${style}\n\n`);
    } else if (currentType === "file") {
      if (!fileDataUrl) {
        showToast("请先选择文件");
        return;
      }
      const name = fileDisplayName || "附件";
      const isEmbeddedText = !String(fileDataUrl).startsWith("data:");
      if (isEmbeddedText) {
        const extension = (name.split(".").pop() || "text").replace(/[^a-z0-9_-]/gi, "");
        insertAtCursor(`\n\n**${name}**\n\n\`\`\`${extension}\n${fileDataUrl}\n\`\`\`\n\n`);
      } else {
        insertAtCursor(`\n\n[${name}](${fileDataUrl})\n\n`);
      }
    } else if (currentType === "web") {
      const url = String(webUrlInput?.value || "").trim();
      if (!url) {
        showToast("请输入网页地址");
        return;
      }
      const width = normalizeMediaDimension(mediaWidthInput?.value, "100%");
      const height = normalizeMediaDimension(mediaHeightInput?.value, "360px");
      insertAtCursor(`\n\n<iframe src="${escapeHtmlAttribute(url)}" title="网页" style="display:block;width:${width};height:${height};min-height:120px;border:0" sandbox="allow-scripts allow-forms allow-popups"></iframe>\n\n`);
    } else if (currentType === "video") {
      const src = videoSource || String(videoUrlInput?.value || "").trim();
      if (!src) {
        showToast("请输入或选择视频");
        return;
      }
      const width = normalizeMediaDimension(mediaWidthInput?.value, "100%");
      const height = normalizeMediaDimension(mediaHeightInput?.value, "360px");
      insertAtCursor(`\n\n<video src="${escapeHtmlAttribute(src)}" controls style="display:block;width:${width};height:${height};max-width:100%;background:#000"></video>\n\n`);
    }
    dialog.open = false;
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
  });
}

function initState() {
  const loaded = loadState();
  if (loaded) state = loaded;
  if (!Array.isArray(state.notes)) state.notes = [];
  if (!state.assets || typeof state.assets !== "object") state.assets = {};
  const normalizedAt = now();
  state.notes = state.notes
    .filter((note) => note && typeof note === "object")
    .map((note, index) => ({
      id: String(note.id || `note_recovered_${normalizedAt}_${index}`),
      title: String(note.title || "未命名"),
      content: String(note.content ?? "").replace(/<u>([^<\n]+)<\/u>/gi, "++$1++"),
      createdAt: Number(note.createdAt) || normalizedAt,
      updatedAt: Number(note.updatedAt) || Number(note.createdAt) || normalizedAt,
    }));
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
  const migratedAssets = migrateInlineImageAssets();
  sortNotes();
  if (!state.activeId || !state.notes.some((n) => n.id === state.activeId)) {
    state.activeId = state.notes[0].id;
  }
  if (migratedAssets) saveState();
  renderList();
  // Only load the active note into the editor on startup; preview opens after a user click.
  loadNoteForEdit(state.activeId);
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

noteItemActionCancel?.addEventListener("click", () => {
  if (noteItemActionDialog) noteItemActionDialog.open = false;
});
noteItemActionRename?.addEventListener("click", () => {
  if (noteItemActionDialog) noteItemActionDialog.open = false;
  openTitleDialog("rename");
});
noteItemActionDelete?.addEventListener("click", () => {
  if (noteItemActionDialog) noteItemActionDialog.open = false;
  openDeleteConfirmation("single");
});
importTxtMenuItem?.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".txt,.md,.markdown,text/plain,text/markdown";
  input.multiple = true;
  input.addEventListener("change", async () => {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    const imported = [];
    for (const file of files) {
      try {
        const content = await file.text();
        const title = String(file.name || "导入笔记").replace(/\.(?:txt|md|markdown)$/i, "") || "导入笔记";
        const timestamp = now();
        imported.push({ id: uuid(), title, content, createdAt: timestamp, updatedAt: timestamp });
      } catch (error) {
        showToast(`无法读取 ${file.name || "文件"}`);
      }
    }
    if (!imported.length) return;
    if (!Array.isArray(state.notes)) state.notes = [];
    state.notes.unshift(...imported);
    state.activeId = imported[0].id;
    sortNotes();
    saveState();
    renderList();
    if (!isCompact) loadNoteForEdit(imported[0].id);
    showToast(`已导入 ${imported.length} 篇笔记`);
  });
  input.click();
});
multiSelectMenuItem?.addEventListener("click", () => setSelectionMode(!selectionMode));

deleteCancelBtn?.addEventListener("click", () => {
  deleteConfirmDialog.open = false;
});
deleteOkBtn?.addEventListener("click", () => {
  deleteConfirmDialog.open = false;
  if (deleteMode === "multiple") {
    state.notes = state.notes.filter((note) => !selectedNoteIds.has(note.id));
    if (state.notes.length === 0) {
      createNote("新建笔记", "");
    } else {
      state.activeId = state.notes[0].id;
      saveState();
      loadNoteForEdit(state.activeId);
    }
    setSelectionMode(false);
    showToast("已删除选中的笔记");
    return;
  }
  deleteActiveNote();
});

modeGroup?.addEventListener("change", () => setMode(modeGroup.value));
modeEditBtn?.addEventListener("click", () => setMode("edit", { lock: true }));
previewOnceBtn?.addEventListener("click", () => setMode("preview", { lock: false, once: true }));
modePreviewBtn?.addEventListener("click", () => setMode("preview", { lock: true }));
zoomInBtn?.addEventListener("click", () => mode === "preview" ? setPreviewZoom(previewZoom + 0.1) : setEditorZoom(editorZoom + 0.1));
zoomOutBtn?.addEventListener("click", () => mode === "preview" ? setPreviewZoom(previewZoom - 0.1) : setEditorZoom(editorZoom - 0.1));
zoomResetBtn?.addEventListener("click", () => mode === "preview" ? setPreviewZoom(1) : setEditorZoom(1));
toggleFindBarItem?.addEventListener("click", () => setFindBarOpen(!findBarOpen));
previewCloseBtn?.addEventListener("click", closePreviewDialog);
previewZoomIn?.addEventListener("click", () => setPreviewZoom(previewZoom + 0.1));
previewZoomOut?.addEventListener("click", () => setPreviewZoom(previewZoom - 0.1));
previewZoomReset?.addEventListener("click", () => setPreviewZoom(1));
previewDialog?.addEventListener("close", () => {
  mode = "edit";
  if (modeGroup) {
    modeGroup.value = "edit";
    modeGroup.setAttribute("value", "edit");
  }
  if (editorContainer) editorContainer.style.display = "block";
  if (previewContainer) previewContainer.style.display = "none";
  setFindBarOpen(findBarOpen);
});

previewDialogBody?.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch") return;
  if (previewDialogBody.setPointerCapture) previewDialogBody.setPointerCapture(event.pointerId);
  if (event.isPrimary) return;
  pinchDistance = null;
});

previewDialogBody?.addEventListener("touchstart", (event) => {
  if (event.touches.length === 2) {
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    pinchDistance = Math.hypot(dx, dy);
  }
}, { passive: true });

previewDialogBody?.addEventListener("touchmove", (event) => {
  if (event.touches.length !== 2 || !pinchDistance) return;
  const dx = event.touches[0].clientX - event.touches[1].clientX;
  const dy = event.touches[0].clientY - event.touches[1].clientY;
  const nextDistance = Math.hypot(dx, dy);
  setPreviewZoom(previewZoom * (nextDistance / pinchDistance));
  pinchDistance = nextDistance;
  event.preventDefault();
}, { passive: false });

previewDialogBody?.addEventListener("touchend", () => {
  pinchDistance = null;
});

editorScroll?.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 2) return;
  const dx = event.touches[0].clientX - event.touches[1].clientX;
  const dy = event.touches[0].clientY - event.touches[1].clientY;
  pinchDistance = Math.hypot(dx, dy);
}, { passive: true });

editorScroll?.addEventListener("touchmove", (event) => {
  if (event.touches.length !== 2 || !pinchDistance) return;
  const dx = event.touches[0].clientX - event.touches[1].clientX;
  const dy = event.touches[0].clientY - event.touches[1].clientY;
  const nextDistance = Math.hypot(dx, dy);
  setEditorZoom(editorZoom * (nextDistance / pinchDistance));
  pinchDistance = nextDistance;
  event.preventDefault();
}, { passive: false });

editorScroll?.addEventListener("touchend", () => {
  pinchDistance = null;
});

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

renameMenuItem?.addEventListener("click", () => {
  if (getActiveNote()) openTitleDialog("rename");
});
deleteMenuItem?.addEventListener("click", () => {
  if (getActiveNote() && deleteConfirmDialog) deleteConfirmDialog.open = true;
});
saveMenuItem?.addEventListener("click", () => { saveState(); showToast("已保存"); });
exportMenuItem?.addEventListener("click", () => {
  window.dispatchEvent(new MessageEvent("message", { data: { type: "app:action", id: "notes:export_txt" } }));
});
findMenuItem?.addEventListener("click", () => setFindBarOpen(!findBarOpen));
documentDetailsMenuItem?.addEventListener("click", openDocumentDetails);
documentDetailsClose?.addEventListener("click", () => { if (documentDetailsDialog) documentDetailsDialog.open = false; });
markdownSettingsMenuItem?.addEventListener("click", () => {
  if (!markdownSettingsDialog) return;
  if (markdownFollowTheme) markdownFollowTheme.checked = markdownSettings.followTheme !== false;
  if (markdownFontSize) markdownFontSize.value = String(markdownSettings.fontSize || 15);
  if (markdownBodyBackground) markdownBodyBackground.value = markdownSettings.bodyBackground || "transparent";
  if (markdownQuoteBackground) markdownQuoteBackground.value = markdownSettings.quoteBackground || "rgba(0, 0, 0, 0.5)";
  markdownSettingsDialog.open = true;
});
markdownSettingsClose?.addEventListener("click", () => { if (markdownSettingsDialog) markdownSettingsDialog.open = false; });
markdownSettingsSave?.addEventListener("click", () => {
  markdownSettings = {
    followTheme: markdownFollowTheme?.checked !== false,
    fontSize: Math.max(12, Math.min(32, Number(markdownFontSize?.value) || 15)),
    bodyBackground: String(markdownBodyBackground?.value || "transparent").trim() || "transparent",
    quoteBackground: String(markdownQuoteBackground?.value || "rgba(0, 0, 0, 0.5)").trim() || "rgba(0, 0, 0, 0.5)",
  };
  localStorage.setItem(MARKDOWN_SETTINGS_KEY, JSON.stringify(markdownSettings));
  applyMarkdownSettings();
  if (markdownSettingsDialog) markdownSettingsDialog.open = false;
  showToast("Markdown 显示设置已保存");
});

backBtn?.addEventListener("click", () => {
  setView("list");
  mode = "edit";
  previewSessionType = null;
  setModeButtonState();
  if (editorContainer) editorContainer.style.display = "block";
  if (previewContainer) previewContainer.style.display = "none";
});

function wrapSelection(prefix, suffix = prefix) {
  if (!noteEditor) return;
  const value = noteEditor.value;
  let start = noteEditor.selectionStart;
  let end = noteEditor.selectionEnd;

  if (start === end) {
    const previousBreak = value.lastIndexOf("\n", Math.max(0, start - 1));
    const nextBreak = value.indexOf("\n", start);
    start = previousBreak + 1;
    end = nextBreak === -1 ? value.length : nextBreak;
  }

  const selected = value.slice(start, end);
  noteEditor.setRangeText(`${prefix}${selected}${suffix}`, start, end, "select");
  onEditorInput();
  noteEditor.focus();
}

formatBoldBtn?.addEventListener("click", () => wrapSelection("**"));
formatItalicBtn?.addEventListener("click", () => wrapSelection("*"));
formatUnderlineBtn?.addEventListener("click", () => wrapSelection("++"));
formatStrikeBtn?.addEventListener("click", () => wrapSelection("~~"));

function prefixSelectedLines(prefixFactory) {
  if (!noteEditor) return;
  const value = noteEditor.value;
  let start = noteEditor.selectionStart;
  let end = noteEditor.selectionEnd;
  start = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nextBreak = value.indexOf("\n", end);
  end = nextBreak === -1 ? value.length : nextBreak;
  const lines = value.slice(start, end).split("\n");
  noteEditor.setRangeText(lines.map((line, index) => `${prefixFactory(index)}${line}`).join("\n"), start, end, "select");
  onEditorInput();
  noteEditor.focus();
}

formatHeadingItem?.addEventListener("click", () => prefixSelectedLines(() => "## "));
formatQuoteItem?.addEventListener("click", () => prefixSelectedLines(() => "> "));
formatBulletItem?.addEventListener("click", () => prefixSelectedLines(() => "- "));
formatNumberItem?.addEventListener("click", () => prefixSelectedLines((index) => `${index + 1}. `));
fontSansItem?.addEventListener("click", () => wrapSelection('<span style="font-family: Arial, sans-serif">', "</span>"));
fontSerifItem?.addEventListener("click", () => wrapSelection('<span style="font-family: Georgia, serif">', "</span>"));
fontMonoItem?.addEventListener("click", () => wrapSelection('<span style="font-family: monospace">', "</span>"));
fontCursiveItem?.addEventListener("click", () => wrapSelection('<span style="font-family: cursive">', "</span>"));

formatPainterBtn?.addEventListener("click", () => {
  if (!noteEditor) return;
  if (!copiedFormat) {
    const selected = noteEditor.value.slice(noteEditor.selectionStart, noteEditor.selectionEnd);
    copiedFormat = [["**", "**"], ["*", "*"], ["~~", "~~"], ["++", "++"]]
      .find(([prefix, suffix]) => selected.startsWith(prefix) && selected.endsWith(suffix)) || null;
    showToast(copiedFormat ? "已复制格式，请选择目标后再次点击格式刷" : "请先选择带格式的文本");
    return;
  }
  wrapSelection(copiedFormat[0], copiedFormat[1]);
  copiedFormat = null;
  showToast("已应用格式");
});
fontDefaultItem?.addEventListener("click", () => wrapSelection("<span style=\"font-size: inherit\">", "</span>"));
fontLargeItem?.addEventListener("click", () => wrapSelection('<span style="font-size: 1.35em">', "</span>"));
fontSmallItem?.addEventListener("click", () => wrapSelection('<span style="font-size: .85em">', "</span>"));
alignLeftItem?.addEventListener("click", () => wrapSelection('<div style="text-align:left">', "</div>"));
alignCenterItem?.addEventListener("click", () => wrapSelection('<div style="text-align:center">', "</div>"));
alignRightItem?.addEventListener("click", () => wrapSelection('<div style="text-align:right">', "</div>"));

copyMenuItem?.addEventListener("click", async () => {
  try {
    await copyToClipboard(noteEditor?.value ?? "");
    showToast("已复制");
  } catch (e) {
    showToast("复制失败");
  }
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
editorFindNext?.addEventListener("click", () => findEditorText(1));
editorFindPrev?.addEventListener("click", () => findEditorText(-1));
editorReplaceOne?.addEventListener("click", replaceCurrentMatch);
editorReplaceAll?.addEventListener("click", replaceAllMatches);
editorFindInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  findEditorText(event.shiftKey ? -1 : 1);
});

searchInput?.addEventListener("input", () => {
  filterText = searchInput.value ?? "";
  renderList();
});

window.addEventListener("message", (event) => {
   if (!event?.data) return;
   if (event.data.type === "notes:preview:state") {
     const isPreview = Boolean(event.data.open);
mode = isPreview ? "preview" : "edit";
      setModeButtonState();
      if (modeGroup) {
       modeGroup.value = mode;
       modeGroup.setAttribute("value", mode);
     }
     if (!isPreview) {
       if (editorContainer) editorContainer.style.display = "block";
       if (previewContainer) previewContainer.style.display = "none";
       setFindBarOpen(findBarOpen);
     }
     return;
   }
if (event.data.type === "notes:insert-content") {
      if (view !== "detail") return;
      const kind = String(event.data.kind || "");
      setMode("edit", { lock: false });
      if (kind === "link") openLinkInsertDialog();
      else if (["image", "web", "video", "file"].includes(kind)) openInsertDialog(kind);
      return;
    }
    if (event.data.type === "notes:create") {
     if (selectionMode) openDeleteConfirmation("multiple");
     else openTitleDialog("create");
     return;
   }
   if (event.data.type === "notes:delete-selected-request") {
     openDeleteConfirmation("multiple");
     return;
   }
  if (event.data.type === "app:action") {
    const id = event.data.id;
    if (id === "notes:rename") {
      openTitleDialog("rename");
      return;
    }
    if (id === "notes:edit") {
      setMode("edit");
      return;
    }
    if (id === "notes:delete_confirm") {
      deleteActiveNote();
      return;
    }
if (id === "notes:delete") {
       openDeleteConfirmation("single");
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
      const source = noteEditor?.value ?? note?.content ?? "";
      const content = expandAssetReferencesForExport(source);
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

applyMarkdownSettings();
initState();
// Do not open the top-level preview while the notes iframe is loading.
setMode("edit");

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
