"use strict";

const navigationDrawer = document.querySelector(".main-drawer");
const openDrawerButton = document.getElementById("fab_menu");

const drawer_btn1 = navigationDrawer?.querySelector(".drawer_btn1");
const drawer_btn2 = navigationDrawer?.querySelector(".drawer_btn2");
const drawer_btn3 = navigationDrawer?.querySelector(".drawer_btn3");
const drawerSettings = document.getElementById("drawer_settings");

const postsSheet = document.getElementById("posts_sheet");
const postsList = document.getElementById("posts_list");
const postsSearch = document.getElementById("posts_search");
const postsBack = document.getElementById("posts_back");
const postsSheetTitle = document.getElementById("posts_sheet_title");
const postsAppbarIcon = document.getElementById("posts_appbar_icon");
const postDetail = document.getElementById("post_detail");
const aboutSheet = document.getElementById("about_sheet");
const imageCompressDialog = document.getElementById("image_compress_dialog");
const imagePreviewDialog = document.getElementById("image_preview_dialog");
const imagePreviewClose = document.getElementById("image_preview_close");
const imagePreviewTitle = document.getElementById("image_preview_title");
const imagePreviewImage = document.getElementById("image_preview_image");
const imagePreviewBody = document.getElementById("image_preview_body");
const imagePreviewZoomIn = document.getElementById("image_preview_zoom_in");
const imagePreviewZoomOut = document.getElementById("image_preview_zoom_out");
const imagePreviewZoomValue = document.getElementById("image_preview_zoom_value");
const imagePreviewRotateLeft = document.getElementById("image_preview_rotate_left");
const imagePreviewRotateRight = document.getElementById("image_preview_rotate_right");
const imagePreviewReset = document.getElementById("image_preview_reset");
const releasesDialog = document.getElementById("releases_dialog");
const releasesClose = document.getElementById("releases_close");
const coursesFavoritesSheet = document.getElementById("courses_favorites_sheet");
const coursesFavoritesList = document.getElementById("courses_favorites_list");
const coursesFavoritesClose = document.getElementById("courses_favorites_close");
const coursesFavoritesSearch = document.getElementById("courses_favorites_search");
const coursesFavoritesDelete = document.getElementById("courses_favorites_delete");
const coursesFavoritesDeleteDialog = document.getElementById("courses_favorites_delete_dialog");
const coursesFavoritesDeleteText = document.getElementById("courses_favorites_delete_text");
const coursesFavoritesDeleteCancel = document.getElementById("courses_favorites_delete_cancel");
const coursesFavoritesDeleteConfirm = document.getElementById("courses_favorites_delete_confirm");
const imageCompressClose = null;
const settingsSheet = document.getElementById("settings_sheet");
const settingsSearch = document.getElementById("settings_search");
const settingsThemeGroup = document.getElementById("settings_theme_group");
const settingsThemeValue = document.getElementById("settings_theme_value");
const fabRightSlider = document.getElementById("fab_right_slider");
const fabBottomSlider = document.getElementById("fab_bottom_slider");
const fabRightValue = document.getElementById("fab_right_value");
const fabBottomValue = document.getElementById("fab_bottom_value");
const fabResetButton = document.getElementById("fab_reset_btn");
const fabSaveButton = document.getElementById("fab_save_btn");
const settingsThemePalette = document.getElementById("settings_theme_palette");

const main_tabs = document.getElementById("main_tabs");
const desktopNavRail = document.querySelector(".desktop-nav");
const main_nv_saying = document.getElementById("rail_item_saying");
const main_nv_resources = document.getElementById("rail_item_resources");
const main_nv_notes = document.getElementById("rail_item_notes");
const main_nv_courses = document.getElementById("rail_item_courses");

const main_fab = document.getElementById("main_fab");
const main_fab_mobile = document.getElementById("main_fab_mobile");
const main_snackbar = document.querySelector(".snackbar_no_action");

const notes_item_frame = document.getElementById("notes_item_frame");
const notesPreviewDialog = document.getElementById("notes_preview_dialog");
const notesPreviewClose = document.getElementById("notes_preview_close");
const notesPreviewTitle = document.getElementById("notes_preview_title");
const notesPreviewScroll = document.getElementById("notes_preview_scroll");
const notesPreviewCanvas = document.getElementById("notes_preview_canvas");
const notesPreviewContent = document.getElementById("notes_preview_content");
const notesPreviewZoomValue = document.getElementById("notes_preview_zoom_value");
const notesPreviewZoomIn = document.getElementById("notes_preview_zoom_in");
const notesPreviewZoomOut = document.getElementById("notes_preview_zoom_out");
const notesPreviewZoomReset = document.getElementById("notes_preview_zoom_reset");
const notesPreviewResetItem = document.getElementById("notes_preview_reset_item");
const notesPreviewEditItem = document.getElementById("notes_preview_edit_item");
const notesPreviewExportItem = document.getElementById("notes_preview_export_item");
const notesPreviewDeleteItem = document.getElementById("notes_preview_delete_item");
const notesDeleteDialog = document.getElementById("notes_delete_dialog");
const notesDeleteCancel = document.getElementById("notes_delete_cancel");
const notesDeleteConfirm = document.getElementById("notes_delete_confirm");
let notesPreviewZoom = 1;
let notesPreviewPointers = new Map();
let notesPreviewPinchDistance = 0;

const mobileMenuButton = document.getElementById("mobile_menu_btn");
const mobileNavBar = document.getElementById("mobile_navbar");
const mobileTitle = document.getElementById("mobile_title");
const mobileAction1 = document.getElementById("mobile_action_1");
const mobileAction2 = document.getElementById("mobile_action_2");
const courseTopbarFavorite = document.getElementById("course_topbar_favorite");
const mobileMoreBtn = document.getElementById("mobile_more_btn");
const mobileMoreMenu = document.getElementById("mobile_more_menu");

let main_fab_click_change = 0;
let selectedTheme = localStorage.getItem("theme") || "auto";
let systemThemeMedia = null;
let activeTab = "saying";
let notesSelectionActive = false;
let notesSelectionCount = 0;
let notesDetailActive = false;
const notesInsertMenu = document.getElementById("notes_insert_menu");
const notesInsertMenuList = document.getElementById("notes_insert_menu_list");
let coursesFavoritesCache = [];
let coursesFavoritesSelectionMode = false;
let selectedCourseFavoriteIds = new Set();
const topbarOverrides = new Map();
let postsCache = [];
const PRIMARY_COLOR_KEY = "xtd_theme_primary";
const CONTROL_COLOR_KEY = "xtd_theme_control";
const HIGHLIGHT_COLOR_KEY = "xtd_theme_highlight";
const DEFAULT_THEME_COLORS = { primary: "#7e57c2", control: "#7e57c2", highlight: "#ffca28" };
const customColorDialog = document.getElementById("custom_color_dialog");
const customColorRole = document.getElementById("custom_color_role");
const materialColorField = document.getElementById("material_color_field");
const materialColorThumb = document.getElementById("material_color_thumb");
const materialHueSlider = document.getElementById("material_hue_slider");
const materialColorPreview = document.getElementById("material_color_preview");
const customColorHex = document.getElementById("custom_color_hex");
const customColorCancel = document.getElementById("custom_color_cancel");
const customColorReset = document.getElementById("custom_color_reset");
const customColorSave = document.getElementById("custom_color_save");
const deleteCustomColorDialog = document.getElementById("delete_custom_color_dialog");
const deleteCustomColorCancel = document.getElementById("delete_custom_color_cancel");
const deleteCustomColorConfirm = document.getElementById("delete_custom_color_confirm");
const customColorActionDialog = document.getElementById("custom_color_action_dialog");
const customColorActionEdit = document.getElementById("custom_color_action_edit");
const customColorActionDelete = document.getElementById("custom_color_action_delete");
const CUSTOM_COLOR_KEY = "xtd_theme_custom_colors";
const LEGACY_CUSTOM_COLOR_KEY = "xtd_theme_custom";
let pendingDeleteCustomColor = null;

function getCustomColors() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_COLOR_KEY) || "[]");
    if (Array.isArray(saved)) return saved.filter((color) => /^#[0-9a-fA-F]{6}$/.test(color));
  } catch (error) {}
  const legacy = localStorage.getItem(LEGACY_CUSTOM_COLOR_KEY);
  return /^#[0-9a-fA-F]{6}$/.test(legacy || "") ? [legacy] : [];
}

function saveCustomColors(colors) {
  localStorage.setItem(CUSTOM_COLOR_KEY, JSON.stringify(colors));
  localStorage.removeItem(LEGACY_CUSTOM_COLOR_KEY);
}

function broadcastThemeColors(colors) {
  window.parent?.postMessage?.({ type: "theme:colors", colors }, "*");
}

function persistThemeColors(colors) {
  localStorage.setItem(PRIMARY_COLOR_KEY, colors.primary);
  localStorage.setItem(CONTROL_COLOR_KEY, colors.control);
  localStorage.setItem(HIGHLIGHT_COLOR_KEY, colors.highlight);
  applyThemeColors(colors);
  renderThemePalette();
}
const THEME_COLORS = [
  "#ef5350", "#ec407a", "#ab47bc", "#7e57c2", "#5c6bc0", "#42a5f5",
  "#26c6da", "#26a69a", "#66bb6a", "#d4e157", "#ffca28", "#ffa726",
];

function showToast(text, color) {
  if (!main_snackbar) return;
  main_snackbar.textContent = text;
  if (color) main_snackbar.color = color;
  else main_snackbar.removeAttribute("color");
  main_snackbar.open = true;
}

function showFrameToast(text, color) {
  showToast(text, color);
}

function notifyFrameOverlay(frame, overlay) {
  frame?.contentWindow?.postMessage({ type: "app:overlay", overlay }, "*");
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

function parsePostMarkdown(file, markdown) {
  let body = markdown || "";
  const meta = {};
  const frontMatter = body.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (frontMatter) {
    for (const line of frontMatter[1].split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator < 0) continue;
      meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
    body = body.slice(frontMatter[0].length);
  }
  const heading = body.match(/^#\s+(.+)$/m);
  const plain = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[#>*_`~\[\]()\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    file,
    title: meta.title || heading?.[1]?.trim() || file.replace(/\.md$/i, ""),
    image: meta.image || "icons/sunshine_moonlight.png",
    date: meta.date || "",
    summary: meta.summary || plain.slice(0, 150),
    body,
  };
}

function renderPosts(query = "") {
  if (!postsList) return;
  const normalized = query.trim().toLowerCase();
  const filtered = postsCache.filter((post) =>
    `${post.title} ${post.summary} ${post.body}`.toLowerCase().includes(normalized),
  );
  if (!filtered.length) {
    postsList.innerHTML = '<div class="empty-state">没有匹配的帖子</div>';
    return;
  }
  postsList.innerHTML = filtered.map((post, index) => `
    <mdui-card class="post-card" clickable data-post-index="${postsCache.indexOf(post)}">
      <img class="post-cover" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}">
      <div class="post-copy">
        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        <p class="post-summary">${escapeHtml(post.summary)}</p>
        ${post.date ? `<div class="post-meta">${escapeHtml(post.date)}</div>` : ""}
      </div>
    </mdui-card>
  `).join("");
  postsList.querySelectorAll("[data-post-index]").forEach((card) => {
    card.addEventListener("click", () => openPost(Number(card.dataset.postIndex)));
  });
}

function sanitizePostHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("script, iframe, object, embed, form").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on") || ((name === "href" || name === "src") && value.startsWith("javascript:"))) {
        node.removeAttribute(attribute.name);
      }
    });
  });
  return template.innerHTML;
}

function openPost(index) {
  const post = postsCache[index];
  if (!post || !postsList || !postDetail) return;
  if (postsSheet && !postsSheet.open) postsSheet.open = true;
  const rendered = window.XTDMarkdown?.renderMarkdown(post.body) || escapeHtml(post.body);
  postDetail.innerHTML = sanitizePostHtml(rendered);
  postsList.classList.remove("view-enter");
  postsList.classList.add("view-exit");
  window.setTimeout(() => {
    postsList.classList.remove("view-exit");
    postsList.style.display = "none";
    if (postsSearch) postsSearch.style.display = "none";
    postDetail.style.display = "block";
    postDetail.classList.remove("view-exit");
    void postDetail.offsetWidth;
    postDetail.classList.add("view-enter");
  }, 160);
  if (postsSheetTitle) postsSheetTitle.textContent = post.title;
  if (postsBack) postsBack.style.display = "inline-flex";
  const closeButton = postsSheet?.querySelector('[data-sheet="posts_sheet"]');
  if (closeButton) {
    closeButton.style.display = "inline-flex";
    closeButton.removeAttribute("hidden");
  }
}

function showPostList() {
  if (!postsList || !postDetail) return;
  postDetail.classList.remove("view-enter");
  postDetail.classList.add("view-exit");
  window.setTimeout(() => {
    postDetail.classList.remove("view-exit");
    postDetail.style.display = "none";
    postDetail.innerHTML = "";
    postsList.style.display = "grid";
    if (postsSearch) postsSearch.style.display = "block";
    void postsList.offsetWidth;
    postsList.classList.add("view-enter");
    window.setTimeout(() => postsList.classList.remove("view-enter"), 230);
  }, 170);
  if (postsSheetTitle) postsSheetTitle.textContent = "帖子";
  if (postsBack) postsBack.style.display = "none";
  if (postsAppbarIcon) postsAppbarIcon.hidden = false;
}

async function loadPosts() {
  if (postsCache.length) {
    renderPosts(postsSearch?.value || "");
    return;
  }
  if (postsList) postsList.innerHTML = '<div class="empty-state">正在读取帖子...</div>';
  try {
    const response = await fetch("posts/index.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const files = await response.json();
    const loaded = await Promise.all(files.map(async (file) => {
      const postResponse = await fetch(`posts/${file}`, { cache: "no-cache" });
      if (!postResponse.ok) throw new Error(`无法读取 ${file}`);
      return parsePostMarkdown(file, await postResponse.text());
    }));
    postsCache = loaded;
    renderPosts(postsSearch?.value || "");
  } catch (error) {
    if (postsList) postsList.innerHTML = `<div class="empty-state">帖子读取失败<br><small>${escapeHtml(error.message)}</small></div>`;
  }
}

function openSheet(sheet) {
  if (!sheet) return;
  if (navigationDrawer) navigationDrawer.open = false;
  sheet.open = true;
}

function getFabPosition() {
  try {
    return JSON.parse(localStorage.getItem("main_fab_mobile_pos") || "null") || { right: "32px", bottom: "104px" };
  } catch (error) {
    return { right: "32px", bottom: "104px" };
  }
}

let themeColorDraft = { ...DEFAULT_THEME_COLORS };
let themeColorOriginal = { ...DEFAULT_THEME_COLORS };
let pickerHue = 260;
let pickerSaturation = 0.55;
let pickerValue = 0.76;

function getThemeColors() {
  return {
    primary: localStorage.getItem(PRIMARY_COLOR_KEY) || DEFAULT_THEME_COLORS.primary,
    control: localStorage.getItem(CONTROL_COLOR_KEY) || DEFAULT_THEME_COLORS.control,
    highlight: localStorage.getItem(HIGHLIGHT_COLOR_KEY) || DEFAULT_THEME_COLORS.highlight,
  };
}

function hsvToHex(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `#${rgb.map((n) => Math.round((n + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}

function hexToHsv(hex) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let h = 0;
  if (delta) h = max === r ? 60 * (((g - b) / delta) % 6) : max === g ? 60 * ((b - r) / delta + 2) : 60 * ((r - g) / delta + 4);
  if (h < 0) h += 360;
  return { h, s: max ? delta / max : 0, v: max };
}

function applyThemeColors(colors) {
  if (!colors) return;
  window.mdui?.setColorScheme?.(colors.primary);
  document.documentElement.style.setProperty("--xtd-control-color", colors.control);
  document.documentElement.style.setProperty("--xtd-highlight-color", colors.highlight);
  if (typeof broadcastThemeColors === "function") broadcastThemeColors(colors);
}

function updateMaterialPicker(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const hsv = hexToHsv(hex);
  pickerHue = hsv.h;
  pickerSaturation = hsv.s;
  pickerValue = hsv.v;
  materialColorField?.style.setProperty("--picker-hue", pickerHue);
  materialHueSlider?.style.setProperty("--picker-hue", pickerHue);
  if (materialHueSlider) materialHueSlider.value = String(Math.round(pickerHue));
  if (materialColorThumb) {
    materialColorThumb.style.left = `${pickerSaturation * 100}%`;
    materialColorThumb.style.top = `${(1 - pickerValue) * 100}%`;
  }
  materialColorPreview?.style.setProperty("--picker-color", hex);
  if (customColorHex) customColorHex.value = hex.toLowerCase();
}

function updateDraftFromPicker() {
  const role = customColorRole?.value || "primary";
  const hex = hsvToHex(pickerHue, pickerSaturation, pickerValue);
  themeColorDraft[role] = hex;
  updateMaterialPicker(hex);
  applyThemeColors(themeColorDraft);
}

function openCustomColorDialog() {
  themeColorOriginal = getThemeColors();
  themeColorDraft = { ...themeColorOriginal };
  if (customColorRole) customColorRole.value = "primary";
  updateMaterialPicker(themeColorDraft.primary);
  customColorDialog.open = true;
}

function renderThemePalette() {
  if (!settingsThemePalette) return;
  const selected = localStorage.getItem(PRIMARY_COLOR_KEY) || "#7e57c2";
  const customColors = getCustomColors();
  settingsThemePalette.innerHTML = "";
  THEME_COLORS.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `theme-swatch${color === selected ? " selected" : ""}`;
    button.style.setProperty("--swatch-color", color);
    button.title = color;
    button.setAttribute("aria-label", `选择主题色 ${color}`);
    button.addEventListener("click", () => {
      const colors = getThemeColors();
      colors.primary = color;
      persistThemeColors(colors);
      showToast("已应用主题色");
    });
    settingsThemePalette.appendChild(button);
  });
  customColors.forEach((customColor, customIndex) => {
    const savedButton = document.createElement("button");
    savedButton.type = "button";
    savedButton.className = `theme-swatch custom-color-swatch${customColor === selected ? " selected" : ""}`;
    savedButton.style.setProperty("--swatch-color", customColor);
savedButton.title = `${customColor}（点击应用，长按修改或删除）`;
     savedButton.setAttribute("aria-label", `应用自定义颜色 ${customColor}，长按修改或删除`);
    savedButton.addEventListener("click", () => {
      const colors = getThemeColors();
      colors.primary = customColor;
      persistThemeColors(colors);
    });
    let pressTimer = null;
    const startPress = () => {
      pressTimer = window.setTimeout(() => {
        pendingDeleteCustomColor = customIndex;
        if (customColorActionDialog) customColorActionDialog.open = true;
      }, 600);
    };
    const cancelPress = () => {
      if (pressTimer) window.clearTimeout(pressTimer);
      pressTimer = null;
    };
    savedButton.addEventListener("pointerdown", startPress);
    savedButton.addEventListener("pointerup", cancelPress);
    savedButton.addEventListener("pointercancel", cancelPress);
    savedButton.addEventListener("pointerleave", cancelPress);
    settingsThemePalette.appendChild(savedButton);
  });

  const customButton = document.createElement("button");
  customButton.type = "button";
  customButton.className = "theme-swatch custom-color-trigger";
  customButton.innerHTML = '<mdui-icon name="palette" class="custom-color-palette-icon" aria-hidden="true"></mdui-icon><span class="custom-color-add-icon" aria-hidden="true">+</span>';
  customButton.title = "自定义颜色";
  customButton.setAttribute("aria-label", "自定义主题颜色");
  customButton.addEventListener("click", openCustomColorDialog);
  settingsThemePalette.appendChild(customButton);
}

function updatePickerFromPointer(event) {
  if (!materialColorField) return;
  const rect = materialColorField.getBoundingClientRect();
  pickerSaturation = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  pickerValue = Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height));
  updateDraftFromPicker();
}

materialColorField?.addEventListener("pointerdown", (event) => {
  materialColorField.setPointerCapture?.(event.pointerId);
  updatePickerFromPointer(event);
});
materialColorField?.addEventListener("pointermove", (event) => {
  if (event.buttons) updatePickerFromPointer(event);
});
materialHueSlider?.addEventListener("input", () => {
  pickerHue = Number(materialHueSlider.value) || 0;
  updateDraftFromPicker();
});
customColorRole?.addEventListener("change", () => {
  const role = customColorRole.value || "primary";
  updateMaterialPicker(themeColorDraft[role]);
});
customColorHex?.addEventListener("input", () => {
  const value = String(customColorHex.value || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) return;
  const role = customColorRole?.value || "primary";
  themeColorDraft[role] = value.toLowerCase();
  updateMaterialPicker(themeColorDraft[role]);
  applyThemeColors(themeColorDraft);
});
customColorReset?.addEventListener("click", () => {
  themeColorDraft = { ...DEFAULT_THEME_COLORS };
  const role = customColorRole?.value || "primary";
  updateMaterialPicker(themeColorDraft[role]);
  applyThemeColors(themeColorDraft);
});
customColorCancel?.addEventListener("click", () => {
  themeColorDraft = { ...themeColorOriginal };
  applyThemeColors(themeColorOriginal);
  customColorDialog.open = false;
});
customColorSave?.addEventListener("click", () => {
  const customColors = getCustomColors();
  if (/^#[0-9a-fA-F]{6}$/.test(themeColorDraft.primary)) {
    customColors.push(themeColorDraft.primary.toLowerCase());
    saveCustomColors(customColors);
  }
  persistThemeColors(themeColorDraft);
  customColorDialog.open = false;
  showToast("自定义主题色已保存");
});
customColorActionEdit?.addEventListener("click", () => {
  const colors = getCustomColors();
  const index = pendingDeleteCustomColor;
  const color = index !== null ? colors[index] : null;
  if (customColorActionDialog) customColorActionDialog.open = false;
  if (color) {
    themeColorOriginal = getThemeColors();
    themeColorDraft = { ...themeColorOriginal, primary: color };
    if (customColorRole) customColorRole.value = "primary";
    updateMaterialPicker(color);
    customColorDialog.open = true;
  }
});
customColorActionDelete?.addEventListener("click", () => {
  if (customColorActionDialog) customColorActionDialog.open = false;
  if (deleteCustomColorDialog) deleteCustomColorDialog.open = true;
});

deleteCustomColorCancel?.addEventListener("click", () => {
  deleteCustomColorDialog.open = false;
});
deleteCustomColorConfirm?.addEventListener("click", () => {
  const customColors = getCustomColors();
  if (pendingDeleteCustomColor !== null) customColors.splice(pendingDeleteCustomColor, 1);
  saveCustomColors(customColors);
  pendingDeleteCustomColor = null;
  deleteCustomColorDialog.open = false;
  renderThemePalette();
  showToast("已删除自定义颜色");
});

function syncFabSettings() {
  renderThemePalette();
  const position = getFabPosition();
  if (fabRightSlider) fabRightSlider.max = String(Math.max(10, window.innerWidth - 66));
  const right = Math.round(parseFloat(position.right) || 32);
  const bottom = Math.round(parseFloat(position.bottom) || 104);
  if (fabRightSlider) fabRightSlider.value = String(right);
  if (fabBottomSlider) fabBottomSlider.value = String(bottom);
  if (fabRightValue) fabRightValue.textContent = `${right} px`;
  if (fabBottomValue) fabBottomValue.textContent = `${bottom} px`;
  if (settingsThemeGroup) settingsThemeGroup.value = selectedTheme;
  if (settingsThemeValue) settingsThemeValue.textContent = selectedTheme === "dark" ? "夜间" : selectedTheme === "light" ? "日间" : "自动";
}

function previewFabSettings() {
  const right = Number(fabRightSlider?.value || 32);
  const bottom = Number(fabBottomSlider?.value || 104);
  if (fabRightValue) fabRightValue.textContent = `${right} px`;
  if (fabBottomValue) fabBottomValue.textContent = `${bottom} px`;
  if (main_fab_mobile) {
    main_fab_mobile.style.right = `${right}px`;
    main_fab_mobile.style.bottom = `${bottom}px`;
  }
}

function enableFabDrag(fab, storageKey, defaultPos) {
  if (!fab) return;
  const { right, bottom } = defaultPos;
  const applyPos = (pos) => {
    if (!pos) return;
    fab.style.right = pos.right;
    fab.style.bottom = pos.bottom;
  };
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      applyPos(JSON.parse(saved));
    } catch (e) {
      applyPos({ right, bottom });
    }
  } else {
    applyPos({ right, bottom });
  }

  let pointerId = null;
  let dragging = false;
  let ignoreClick = false;
  let sx = 0;
  let sy = 0;
  let baseRight = 0;
  let baseBottom = 0;
  let timer = null;
  const LONG_PRESS_MS = 280;

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  fab.addEventListener("pointerdown", (e) => {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    dragging = false;
    sx = e.clientX;
    sy = e.clientY;
    const style = window.getComputedStyle(fab);
    baseRight = parseFloat(style.right) || parseFloat(right);
    baseBottom = parseFloat(style.bottom) || parseFloat(bottom);
    clearTimer();
    timer = setTimeout(() => {
      dragging = true;
      ignoreClick = true;
      fab.setPointerCapture?.(pointerId);
      navigator.vibrate?.(12);
    }, LONG_PRESS_MS);
  });
  fab.addEventListener(
    "pointermove",
    (e) => {
      if (pointerId !== e.pointerId) return;
      if (!dragging) {
        const dx = Math.abs(e.clientX - sx);
        const dy = Math.abs(e.clientY - sy);
        if (dx > 6 || dy > 6) clearTimer();
        return;
      }
      if (e.cancelable) e.preventDefault();
      const nextRight = Math.max(10, Math.min(baseRight + (sx - e.clientX), window.innerWidth - 48));
      const nextBottom = Math.max(
        10,
        Math.min(baseBottom + (sy - e.clientY), window.innerHeight - 48),
      );
      fab.style.right = `${Math.round(nextRight)}px`;
      fab.style.bottom = `${Math.round(nextBottom)}px`;
      if (notesInsertMenu?.hasAttribute("open") && notesInsertAnchor === fab) {
        positionNotesInsertMenu();
      }
    },
    { passive: false },
  );
  const finish = (e) => {
    if (pointerId !== e.pointerId) return;
    clearTimer();
    if (dragging) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ right: fab.style.right || right, bottom: fab.style.bottom || bottom }),
      );
      }
    pointerId = null;
    dragging = false;
  };
  fab.addEventListener("pointerup", finish);
  fab.addEventListener("pointercancel", finish);
  fab.addEventListener(
    "click",
    (e) => {
      if (!ignoreClick) return;
      e.preventDefault();
      e.stopPropagation();
      ignoreClick = false;
    },
    true,
  );
}

const FAB_MODES = [
  { icon: "refresh--outlined", label: "刷新话说页面", toast: "正在刷新页面" },
  { icon: "upload--outlined", label: "上传资源", toast: "暂时不支持上传资源" },
  { icon: "add--outlined", label: "新建笔记" },
  { icon: "near_me--outlined", label: "添加教程", toast: "暂时不支持添加教程" },
];

function setFabMode(mode) {
  main_fab_click_change = mode;
  const config = FAB_MODES[mode] || FAB_MODES[0];
  const animateFabIcon = (fab, nextIcon) => {
    if (!fab) return;
    fab.disabled = false;
    if (fab.icon === nextIcon) return;
    fab.classList.add("fab-swap-out");
    setTimeout(() => {
      fab.icon = nextIcon;
      fab.classList.remove("fab-swap-out");
      fab.classList.add("fab-swap-in");
      setTimeout(() => {
        fab.classList.remove("fab-swap-in");
      }, 180);
    }, 120);
  };
  const updateFab = (fab) => {
    if (!fab) return;
    fab.setAttribute("aria-label", config.label);
    fab.title = config.label;
    animateFabIcon(fab, config.icon);
  };
  updateFab(main_fab);
  updateFab(main_fab_mobile);
}

function sanitizeNotesPreviewHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("script, form, object, embed").forEach((node) => node.remove());
  template.content.querySelectorAll("iframe").forEach((node) => {
    node.setAttribute("sandbox", "allow-scripts allow-forms allow-popups");
    node.removeAttribute("srcdoc");
  });
  template.content.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name) || ((attr.name === "href" || attr.name === "src") && /^javascript:/i.test(attr.value))) node.removeAttribute(attr.name);
    });
  });
  return template.innerHTML;
}

function setNotesPreviewZoom(value) {
  notesPreviewZoom = Math.max(0.3, Math.min(3, value));
  if (notesPreviewContent) {
    notesPreviewContent.style.transform = "none";
    notesPreviewContent.style.zoom = String(notesPreviewZoom);
    notesPreviewContent.style.width = `${100 / notesPreviewZoom}%`;
    notesPreviewContent.style.maxWidth = "none";
  }
  if (notesPreviewCanvas) {
    notesPreviewCanvas.style.width = "100%";
    notesPreviewCanvas.style.minHeight = "100%";
  }
  if (notesPreviewZoomValue) notesPreviewZoomValue.textContent = `${Math.round(notesPreviewZoom * 100)}%`;
}

function notifyNotesPreviewState(open) {
  notes_item_frame?.contentWindow?.postMessage({ type: "notes:preview:state", open }, "*");
}

function closeNotesPreview() {
  if (notesPreviewDialog) notesPreviewDialog.open = false;
  notifyNotesPreviewState(false);
}

notesPreviewContent?.addEventListener("click", (event) => {
  const image = event.target?.closest?.("img");
  if (!image || !notesPreviewContent.contains(image)) return;
  event.preventDefault();
  openImageViewer(image.currentSrc || image.src, image.alt || notesPreviewTitle?.textContent || "笔记图片");
});

function openNotesPreview(data) {
  if (!notesPreviewDialog || !notesPreviewContent) return;
  const rendered = window.XTDMarkdown?.renderMarkdown?.(data.markdown || "") || String(data.markdown || "");
  notesPreviewContent.innerHTML = sanitizeNotesPreviewHtml(rendered);
  if (notesPreviewTitle) notesPreviewTitle.textContent = data.title || "笔记预览";
  setNotesPreviewZoom(1);
  if (notesPreviewScroll) {
    notesPreviewScroll.scrollLeft = 0;
    notesPreviewScroll.scrollTop = 0;
  }
  notesPreviewDialog.open = true;
  notifyNotesPreviewState(true);
}

function notesPreviewDistance() {
  const points = [...notesPreviewPointers.values()];
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

notesPreviewClose?.addEventListener("click", closeNotesPreview);
notesPreviewDialog?.addEventListener("close", () => notifyNotesPreviewState(false));
notesPreviewZoomIn?.addEventListener("click", () => setNotesPreviewZoom(notesPreviewZoom + 0.1));
notesPreviewZoomOut?.addEventListener("click", () => setNotesPreviewZoom(notesPreviewZoom - 0.1));
notesPreviewZoomReset?.addEventListener("click", () => setNotesPreviewZoom(1));
notesPreviewResetItem?.addEventListener("click", () => setNotesPreviewZoom(1));
notesPreviewEditItem?.addEventListener("click", () => {
  closeNotesPreview();
  notes_item_frame?.contentWindow?.postMessage({ type: "app:action", id: "notes:edit" }, "*");
});
notesPreviewExportItem?.addEventListener("click", () => {
  notes_item_frame?.contentWindow?.postMessage({ type: "app:action", id: "notes:export_txt" }, "*");
});
notesPreviewDeleteItem?.addEventListener("click", () => {
  if (notesDeleteDialog) notesDeleteDialog.open = true;
});
notesDeleteCancel?.addEventListener("click", () => {
  if (notesDeleteDialog) notesDeleteDialog.open = false;
});
notesDeleteConfirm?.addEventListener("click", () => {
  if (notesDeleteDialog) notesDeleteDialog.open = false;
  closeNotesPreview();
  notes_item_frame?.contentWindow?.postMessage({ type: "app:action", id: "notes:delete_confirm" }, "*");
});
notesPreviewScroll?.addEventListener("pointerdown", (event) => {
  notesPreviewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  notesPreviewPinchDistance = notesPreviewDistance();
});
notesPreviewScroll?.addEventListener("pointermove", (event) => {
  if (!notesPreviewPointers.has(event.pointerId)) return;
  notesPreviewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const distance = notesPreviewDistance();
  if (distance && notesPreviewPinchDistance) setNotesPreviewZoom(notesPreviewZoom * distance / notesPreviewPinchDistance);
  if (distance) notesPreviewPinchDistance = distance;
});
["pointerup", "pointercancel", "pointerleave"].forEach((type) => notesPreviewScroll?.addEventListener(type, (event) => {
  notesPreviewPointers.delete(event.pointerId);
  notesPreviewPinchDistance = notesPreviewDistance();
}));

function postToNotes(message) {
  const win = notes_item_frame?.contentWindow;
  if (!win) return false;
  win.postMessage(message, "*");
  return true;
}

function syncMobileNav(tab) {
  if (mobileNavBar && mobileNavBar.value !== tab) mobileNavBar.value = tab;
  renderMobileTopbar(tab);
}

function getDefaultTitle(tab) {
  if (tab === "saying") return "话说";
  if (tab === "resources") return "导航";
  if (tab === "notes") return "笔记";
  if (tab === "courses") return "教程";
  return "XTDPotato";
}

function getDefaultActions(tab) {
  // 笔记操作全部由 notes_item.html 内部工具栏承载，主站顶部不再重复显示。
  return [];
}

function getFrameByTab(tab) {
  if (tab === "notes") return document.getElementById("notes_item_frame");
  if (tab === "courses") return document.getElementById("courses_frame");
  if (tab === "resources") return document.getElementById("resources_item_frame");
  if (tab === "saying") return document.getElementById("saying_frame");
  return null;
}

function dispatchTopbarAction(actionId) {
  const frame = getFrameByTab(activeTab);
  const win = frame?.contentWindow;
  if (!win) {
    showToast("页面未加载完成");
    return;
  }
  win.postMessage({ type: "app:action", id: actionId }, "*");
}

function renderMobileTopbar(tab) {
  if (!mobileTitle) return;
  const override = topbarOverrides.get(tab) || null;
  mobileTitle.textContent = override?.title || getDefaultTitle(tab);

  const rawActions = override?.actions || getDefaultActions(tab);
  const courseFavorite = tab === "courses" && override?.courseDetail;
  // 收藏按钮已固定显示在教程顶部栏，不要再放进更多菜单。
  const actions = courseFavorite
    ? rawActions.filter((action) => action.id !== "act:toggle_fav")
    : rawActions;
  if (courseTopbarFavorite) {
    courseTopbarFavorite.style.display = courseFavorite ? "inline-flex" : "none";
    courseTopbarFavorite.icon = override?.favoriteIcon || "bookmark_border";
    courseTopbarFavorite.dataset.actionId = courseFavorite ? "act:toggle_fav" : "";
  }
  const maxIcons = window.innerWidth < 380 ? 1 : 2;
  const iconActions = actions.slice(0, maxIcons);
  const overflowActions = actions.slice(maxIcons);

  const applyIconBtn = (btn, action) => {
    if (!btn) return;
    if (!action) {
      btn.style.display = "none";
      btn.removeAttribute("icon");
      btn.removeAttribute("title");
      btn.dataset.actionId = "";
      return;
    }
    btn.style.display = "inline-flex";
    btn.icon = action.icon;
    btn.title = action.text || "";
    btn.dataset.actionId = action.id;
  };

  applyIconBtn(mobileAction1, iconActions[0]);
  applyIconBtn(mobileAction2, iconActions[1]);

  if (mobileMoreMenu) mobileMoreMenu.innerHTML = "";
  if (mobileMoreBtn) {
    mobileMoreBtn.style.display = overflowActions.length ? "inline-flex" : "none";
  }

  if (mobileMoreMenu) {
    for (const action of overflowActions) {
      const item = document.createElement("mdui-menu-item");
      item.setAttribute("icon", action.icon);
      item.textContent = action.text || action.id;
      item.addEventListener("click", () => dispatchTopbarAction(action.id));
      mobileMoreMenu.appendChild(item);
    }
  }
}

function applyDesktopTabsInsetIfOverlapped() {
  const root = document.documentElement;
  if (!desktopNavRail || !main_tabs) {
    root.style.setProperty("--desktop-tabs-left-inset", "0px");
    return;
  }

  const navStyle = window.getComputedStyle(desktopNavRail);
  if (navStyle.display === "none" || navStyle.visibility === "hidden") {
    root.style.setProperty("--desktop-tabs-left-inset", "0px");
    return;
  }

  const navRect = desktopNavRail.getBoundingClientRect();
  const tabsRect = main_tabs.getBoundingClientRect();

  const overlapped = navRect.right > tabsRect.left + 1;
  if (!overlapped) {
    root.style.setProperty("--desktop-tabs-left-inset", "0px");
    return;
  }

  const inset = Math.ceil(navRect.right - tabsRect.left + 8);
  root.style.setProperty("--desktop-tabs-left-inset", `${inset}px`);
}

function getTabPanel(tab) {
  return document.querySelector(`mdui-tab-panel[value="${tab}"]`);
}

function switchTabWithAnimation(nextTab) {
  if (!main_tabs) return;
  const currentTab = main_tabs.value;
  if (currentTab === nextTab) return;

  const currentPanel = getTabPanel(currentTab);
  const nextPanel = getTabPanel(nextTab);
  if (!currentPanel || !nextPanel) {
    main_tabs.value = nextTab;
    return;
  }

  currentPanel.classList.add("tab-fade-out");
  setTimeout(() => {
    currentPanel.classList.remove("tab-fade-out");
    nextPanel.classList.add("tab-fade-in");
    main_tabs.value = nextTab;
    requestAnimationFrame(() => {
      nextPanel.classList.remove("tab-fade-in");
    });
  }, 140);
}

function setTab(tab) {
  activeTab = tab;
  closeNotesInsertMenu();
  // 保留 iframe 上报的详情顶部栏状态，避免切走再回来时丢失关闭和收藏按钮。
  switchTabWithAnimation(tab);
  if (tab === "saying") setFabMode(0);
  if (tab === "resources") setFabMode(1);
  if (tab === "notes") {
    setFabMode(2);
    if (notesDetailActive && !notesSelectionActive) {
      [main_fab, main_fab_mobile].forEach((fab) => {
        if (!fab) return;
        fab.icon = "add_box--outlined";
        fab.setAttribute("aria-label", "向当前笔记插入内容");
      });
    }
    if (notesSelectionActive) {
      [main_fab, main_fab_mobile].forEach((fab) => {
        if (!fab) return;
        fab.icon = "delete--outlined";
        fab.setAttribute("aria-label", `删除选中的笔记 (${notesSelectionCount})`);
      });
    }
  }
  if (tab === "courses") setFabMode(3);
  syncMobileNav(tab);
  applyDesktopTabsInsetIfOverlapped();
  if (tab === "courses") {
    const frame = getFrameByTab("courses");
    const win = frame?.contentWindow;
    // 教程详情由 iframe 保持；切回页面时只请求重新同步真实顶部栏状态。
    win?.postMessage({ type: "app:action", id: "courses:sync-topbar" }, "*");
  }
}

function isSystemDarkMode() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme() {
  const root = document.documentElement;
  root.classList.remove("mdui-theme-auto", "mdui-theme-light", "mdui-theme-dark");

  if (selectedTheme === "auto") {
    root.classList.add("mdui-theme-auto");
    return;
  }

  if (selectedTheme === "dark") root.classList.add("mdui-theme-dark");
  else root.classList.add("mdui-theme-light");
}

function changeTheme(theme) {
  selectedTheme = theme;
  localStorage.setItem("theme", selectedTheme);
  applyTheme();
  if (navigationDrawer) navigationDrawer.open = false;
}

function initTheme() {
  applyTheme();
  if (systemThemeMedia) {
    try {
      systemThemeMedia.removeEventListener("change", applyTheme);
    } catch (e) {}
  }
  if (window.matchMedia) {
    systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    try {
      systemThemeMedia.addEventListener("change", applyTheme);
    } catch (e) {}
  }
}

setFabMode(0);
activeTab = "saying";
syncMobileNav("saying");
initTheme();
applyDesktopTabsInsetIfOverlapped();
enableFabDrag(main_fab_mobile, "main_fab_mobile_pos", { right: "32px", bottom: "104px" });

window.addEventListener("resize", () => {
  applyDesktopTabsInsetIfOverlapped();
});

let notesInsertCloseTimer = null;
let notesInsertAnchor = null;
let notesInsertFollowFrame = 0;

function positionNotesInsertMenu() {
  if (!notesInsertMenu?.hasAttribute("open") || !notesInsertMenuList || !notesInsertAnchor) return;
  const rect = notesInsertAnchor.getBoundingClientRect();
  const menuWidth = Math.min(220, window.innerWidth - 24);
  const left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, rect.right - menuWidth));
  const bottom = Math.max(12, window.innerHeight - rect.top + 8);
  notesInsertMenuList.style.left = `${left}px`;
  notesInsertMenuList.style.bottom = `${bottom}px`;
  notesInsertMenuList.style.maxHeight = `${Math.max(56, window.innerHeight - bottom - 12)}px`;
  notesInsertFollowFrame = requestAnimationFrame(positionNotesInsertMenu);
}
function setNotesFabMenuState(open) {
  [main_fab, main_fab_mobile].forEach((fab) => {
    if (!fab) return;
    fab.classList.toggle("notes-fab-open", Boolean(open));
    if (open) fab.icon = "add";
    else if (notesDetailActive) fab.icon = "add_box--outlined";
  });
}

function closeNotesInsertMenu(immediate = false) {
  if (!notesInsertMenu || !notesInsertMenu.hasAttribute("open")) return;
  setNotesFabMenuState(false);
  window.clearTimeout(notesInsertCloseTimer);
  const finish = () => {
    cancelAnimationFrame(notesInsertFollowFrame);
    notesInsertFollowFrame = 0;
    notesInsertAnchor = null;
    notesInsertMenu.removeAttribute("open");
    notesInsertMenu.removeAttribute("closing");
    notesInsertMenu.setAttribute("aria-hidden", "true");
  };
  if (immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finish();
    return;
  }
  notesInsertMenu.setAttribute("closing", "");
  notesInsertCloseTimer = window.setTimeout(finish, 210);
}

function openNotesInsertMenu(anchor) {
  if (!notesInsertMenu || !notesInsertMenuList || !anchor) return;
  window.clearTimeout(notesInsertCloseTimer);
  notesInsertMenu.removeAttribute("closing");
  notesInsertAnchor = anchor;
  notesInsertMenu.setAttribute("open", "");
  cancelAnimationFrame(notesInsertFollowFrame);
  positionNotesInsertMenu();
  notesInsertMenu.setAttribute("aria-hidden", "false");
  setNotesFabMenuState(true);
}

function handleFabClick(event) {
  const config = FAB_MODES[main_fab_click_change] || FAB_MODES[0];
  if (main_fab_click_change === 2 && notesSelectionActive) {
    const ok = postToNotes({ type: "notes:delete-selected-request" });
    if (!ok) showToast("笔记页面未加载完成");
    return;
  }
  if (main_fab_click_change === 0) {
    showToast(config.toast);
    window.location.reload();
    return;
  }
  if (main_fab_click_change === 2) {
    if (notesDetailActive) {
      if (notesInsertMenu?.hasAttribute("open")) closeNotesInsertMenu();
      else openNotesInsertMenu(event?.currentTarget || main_fab_mobile || main_fab);
      return;
    }
    const ok = postToNotes({ type: "notes:create" });
    if (!ok) showToast("笔记页面未加载完成");
    return;
  }
  showToast(config.toast || "暂时不支持此操作");
}

main_fab?.addEventListener("click", handleFabClick);
main_fab_mobile?.addEventListener("click", handleFabClick);
// 插入菜单保持打开，只有再次点击 FAB 或选择菜单项时才关闭。
notesInsertMenu?.querySelectorAll("[data-notes-insert]").forEach((item) => {
  item.addEventListener("click", () => {
    const kind = item.dataset.notesInsert;
    closeNotesInsertMenu(true);
    [main_fab, main_fab_mobile].forEach((fab) => { if (fab) fab.style.visibility = "hidden"; });
    postToNotes({ type: "notes:insert-content", kind });
  });
});

openDrawerButton?.addEventListener("click", () => {
  if (!navigationDrawer) return;
  navigationDrawer.open = !navigationDrawer.open;
});

mobileMenuButton?.addEventListener("click", () => {
  if (!navigationDrawer) return;
  navigationDrawer.open = !navigationDrawer.open;
});

drawer_btn1?.addEventListener("click", () => {
  if (navigationDrawer) navigationDrawer.open = false;
  setTab("saying");
});
drawer_btn2?.addEventListener("click", () => {
  showPostList();
  openSheet(postsSheet);
  loadPosts();
});
drawer_btn3?.addEventListener("click", () => openSheet(aboutSheet));
drawerSettings?.addEventListener("click", () => {
  syncFabSettings();
  openSheet(settingsSheet);
});
settingsSheet?.addEventListener("open", syncFabSettings);

postsSearch?.addEventListener("input", () => renderPosts(postsSearch.value || ""));
// 图片压缩工具由 iframe 顶部 appbar 发送消息关闭。
releasesClose?.addEventListener("click", () => {
  if (releasesDialog) releasesDialog.open = false;
});
coursesFavoritesSearch?.addEventListener("input", renderCoursesFavorites);
coursesFavoritesClose?.addEventListener("click", () => {
  coursesFavoritesSelectionMode = false;
  selectedCourseFavoriteIds.clear();
  if (coursesFavoritesDelete) coursesFavoritesDelete.style.display = "none";
  if (coursesFavoritesSheet) coursesFavoritesSheet.open = false;
});
coursesFavoritesDelete?.addEventListener("click", () => {
  if (!selectedCourseFavoriteIds.size) {
    showToast("请先选择收藏");
    return;
  }
  if (coursesFavoritesDeleteText) coursesFavoritesDeleteText.textContent = `确定要删除选中的 ${selectedCourseFavoriteIds.size} 个收藏吗？`;
  if (coursesFavoritesDeleteDialog) coursesFavoritesDeleteDialog.open = true;
});
coursesFavoritesDeleteCancel?.addEventListener("click", () => {
  if (coursesFavoritesDeleteDialog) coursesFavoritesDeleteDialog.open = false;
});
coursesFavoritesDeleteConfirm?.addEventListener("click", () => {
  const ids = [...selectedCourseFavoriteIds];
  if (coursesFavoritesDeleteDialog) coursesFavoritesDeleteDialog.open = false;
  document.getElementById("courses_frame")?.contentWindow?.postMessage({ type: "app:action", id: "courses:remove-favorites", courseIds: ids }, "*");
});
const imageViewer = {
  scale: 1,
  rotation: 0,
  x: 0,
  y: 0,
  pointers: new Map(),
  pinchDistance: 0,
  pinchScale: 1,
  pinchCenter: null,
  dragOrigin: null,
  apply() {
    if (!imagePreviewImage) return;
    imagePreviewImage.style.transform = `translate(calc(-50% + ${this.x}px), calc(-50% + ${this.y}px)) rotate(${this.rotation}deg) scale(${this.scale})`;
    if (imagePreviewZoomValue) imagePreviewZoomValue.textContent = `${Math.round(this.scale * 100)}%`;
  },
  setScale(next, center = null) {
    const previous = this.scale;
    this.scale = Math.max(0.1, Math.min(8, Number(next) || 1));
    if (center && imagePreviewBody && previous > 0) {
      const rect = imagePreviewBody.getBoundingClientRect();
      const localX = center.x - (rect.left + rect.width / 2) - this.x;
      const localY = center.y - (rect.top + rect.height / 2) - this.y;
      const ratio = this.scale / previous;
      this.x -= localX * (ratio - 1);
      this.y -= localY * (ratio - 1);
    }
    this.apply();
  },
  fit() {
    if (!imagePreviewImage || !imagePreviewBody || !imagePreviewImage.naturalWidth) return;
    const rect = imagePreviewBody.getBoundingClientRect();
    const rotated = Math.abs(this.rotation % 180) === 90;
    const width = rotated ? imagePreviewImage.naturalHeight : imagePreviewImage.naturalWidth;
    const height = rotated ? imagePreviewImage.naturalWidth : imagePreviewImage.naturalHeight;
    this.scale = Math.min(1, Math.max(0.1, Math.min((rect.width - 24) / width, (rect.height - 24) / height)));
    this.x = 0;
    this.y = 0;
    this.apply();
  },
  fitScale() {
    if (!imagePreviewImage || !imagePreviewBody || !imagePreviewImage.naturalWidth) return 1;
    const rect = imagePreviewBody.getBoundingClientRect();
    const rotated = Math.abs(this.rotation % 180) === 90;
    const width = rotated ? imagePreviewImage.naturalHeight : imagePreviewImage.naturalWidth;
    const height = rotated ? imagePreviewImage.naturalWidth : imagePreviewImage.naturalHeight;
    return Math.min(1, Math.max(0.1, Math.min((rect.width - 24) / width, (rect.height - 24) / height)));
  },
  toggleDoubleClickZoom(center) {
    if (this.scale > 1.001) {
      this.scale = this.fitScale();
      this.x = 0;
      this.y = 0;
      this.apply();
      return;
    }
    this.setScale(1.5, center);
  },
  reset() {
    this.rotation = 0;
    this.fit();
  },
};

function openImageViewer(src, title = "图片预览") {
  if (!src || !imagePreviewImage || !imagePreviewDialog) return;
  if (imagePreviewTitle) imagePreviewTitle.textContent = String(title || "图片预览");
  imageViewer.scale = 1;
  imageViewer.rotation = 0;
  imageViewer.x = 0;
  imageViewer.y = 0;
  imagePreviewImage.alt = String(title || "图片预览");
  if (imagePreviewImage.src === src && imagePreviewImage.complete) {
    imageViewer.apply();
    imagePreviewDialog.open = true;
    requestAnimationFrame(() => imageViewer.fit());
  } else {
    imagePreviewImage.src = src;
    imagePreviewDialog.open = true;
  }
}

imagePreviewClose?.addEventListener("click", () => {
  if (imagePreviewDialog) imagePreviewDialog.open = false;
});
imagePreviewDialog?.addEventListener("open", () => requestAnimationFrame(() => imageViewer.fit()));
imagePreviewDialog?.addEventListener("close", () => {
  imageViewer.pointers.clear();
  imageViewer.dragOrigin = null;
  imageViewer.pinchDistance = 0;
  imagePreviewBody?.classList.remove("dragging");
});
window.addEventListener("resize", () => {
  if (imagePreviewDialog?.open) imageViewer.fit();
});
imagePreviewZoomIn?.addEventListener("click", () => imageViewer.setScale(imageViewer.scale * 1.2));
imagePreviewZoomOut?.addEventListener("click", () => imageViewer.setScale(imageViewer.scale / 1.2));
imagePreviewRotateLeft?.addEventListener("click", () => { imageViewer.rotation -= 90; imageViewer.fit(); });
imagePreviewRotateRight?.addEventListener("click", () => { imageViewer.rotation += 90; imageViewer.fit(); });
imagePreviewReset?.addEventListener("click", () => imageViewer.reset());
imagePreviewImage?.addEventListener("load", () => requestAnimationFrame(() => imageViewer.reset()));
imagePreviewBody?.addEventListener("dblclick", (event) => {
  imageViewer.toggleDoubleClickZoom({ x: event.clientX, y: event.clientY });
});
imagePreviewBody?.addEventListener("wheel", (event) => {
  event.preventDefault();
  imageViewer.setScale(imageViewer.scale * Math.exp(-event.deltaY * 0.0015), { x: event.clientX, y: event.clientY });
}, { passive: false });

imagePreviewBody?.addEventListener("pointerdown", (event) => {
  imagePreviewBody.setPointerCapture?.(event.pointerId);
  imageViewer.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  imagePreviewBody.classList.add("dragging");
  if (imageViewer.pointers.size === 1) imageViewer.dragOrigin = { x: event.clientX, y: event.clientY, offsetX: imageViewer.x, offsetY: imageViewer.y };
  if (imageViewer.pointers.size === 2) {
    const points = [...imageViewer.pointers.values()];
    imageViewer.pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    imageViewer.pinchScale = imageViewer.scale;
    imageViewer.pinchCenter = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
  }
});
imagePreviewBody?.addEventListener("pointermove", (event) => {
  if (!imageViewer.pointers.has(event.pointerId)) return;
  imageViewer.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (imageViewer.pointers.size === 2) {
    const points = [...imageViewer.pointers.values()];
    const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    const center = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    if (imageViewer.pinchDistance > 0) imageViewer.setScale(imageViewer.pinchScale * distance / imageViewer.pinchDistance, imageViewer.pinchCenter);
    if (imageViewer.pinchCenter) {
      imageViewer.x += center.x - imageViewer.pinchCenter.x;
      imageViewer.y += center.y - imageViewer.pinchCenter.y;
      imageViewer.pinchCenter = center;
      imageViewer.apply();
    }
  } else if (imageViewer.dragOrigin) {
    imageViewer.x = imageViewer.dragOrigin.offsetX + event.clientX - imageViewer.dragOrigin.x;
    imageViewer.y = imageViewer.dragOrigin.offsetY + event.clientY - imageViewer.dragOrigin.y;
    imageViewer.apply();
  }
});
["pointerup", "pointercancel", "pointerleave"].forEach((type) => imagePreviewBody?.addEventListener(type, (event) => {
  imageViewer.pointers.delete(event.pointerId);
  if (!imageViewer.pointers.size) {
    imageViewer.dragOrigin = null;
    imageViewer.pinchDistance = 0;
    imagePreviewBody.classList.remove("dragging");
  } else if (imageViewer.pointers.size === 1) {
    const point = [...imageViewer.pointers.values()][0];
    imageViewer.dragOrigin = { x: point.x, y: point.y, offsetX: imageViewer.x, offsetY: imageViewer.y };
  }
}));
postsBack?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  showPostList();
});

const postsClose = postsSheet?.querySelector('[data-sheet="posts_sheet"]');
postsClose?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const shell = postsSheet?.querySelector(".posts-shell");
  shell?.classList.add("dialog-exit");
  window.setTimeout(() => {
    if (postsSheet) postsSheet.open = false;
    shell?.classList.remove("dialog-exit");
    showPostList();
  }, 180);
});

 document.querySelectorAll(".sheet-close").forEach((button) => {
button.addEventListener("click", () => {
      if (button.hasAttribute("data-animated-close")) return;
      const sheet = document.getElementById(button.dataset.sheet);
    if (sheet) sheet.open = false;
  });
});

settingsSearch?.addEventListener("input", () => {
  const query = String(settingsSearch.value || "").trim().toLowerCase();
  let visibleCount = 0;
  document.querySelectorAll("#settings_content .setting-section").forEach((section) => {
    const keywords = `${section.dataset.settingKeywords || ""} ${section.textContent}`.toLowerCase();
    const visible = !query || keywords.includes(query);
    section.style.display = visible ? "block" : "none";
    if (visible) visibleCount += 1;
  });
  const empty = document.getElementById("settings_empty");
  if (empty) empty.style.display = visibleCount ? "none" : "block";
});

const onSettingsThemeChange = () => {
  const theme = settingsThemeGroup?.value;
  if (!theme || theme === selectedTheme) return;
  changeTheme(theme);
  syncFabSettings();
  if (settingsSheet) settingsSheet.open = true;
};
settingsThemeGroup?.addEventListener("change", onSettingsThemeChange);
settingsThemeGroup?.addEventListener("input", onSettingsThemeChange);

fabRightSlider?.addEventListener("input", previewFabSettings);
fabBottomSlider?.addEventListener("input", previewFabSettings);

fabSaveButton?.addEventListener("click", () => {
  const position = {
    right: `${Number(fabRightSlider?.value || 32)}px`,
    bottom: `${Number(fabBottomSlider?.value || 104)}px`,
  };
  localStorage.setItem("main_fab_mobile_pos", JSON.stringify(position));
  previewFabSettings();
});

fabResetButton?.addEventListener("click", () => {
  localStorage.removeItem("main_fab_mobile_pos");
  if (fabRightSlider) fabRightSlider.value = "32";
  if (fabBottomSlider) fabBottomSlider.value = "104";
  previewFabSettings();
  showToast("已重置 FAB 位置");
});

main_nv_saying?.addEventListener("click", () => {
  setTab("saying");
});

main_nv_resources?.addEventListener("click", () => {
  setTab("resources");
});

main_nv_notes?.addEventListener("click", () => {
  setTab("notes");
});

main_nv_courses?.addEventListener("click", () => {
  setTab("courses");
});

const onMobileNavChange = () => {
  const next = mobileNavBar?.value;
  if (!next) return;
  setTab(next);
};
mobileNavBar?.addEventListener("change", onMobileNavChange);
mobileNavBar?.addEventListener("input", onMobileNavChange);

const onTopbarActionClick = (e) => {
  const id = e?.currentTarget?.dataset?.actionId;
  if (!id) return;
  dispatchTopbarAction(id);
};
mobileAction1?.addEventListener("click", onTopbarActionClick);
mobileAction2?.addEventListener("click", onTopbarActionClick);
courseTopbarFavorite?.addEventListener("click", onTopbarActionClick);

window.addEventListener("resize", () => {
  renderMobileTopbar(activeTab);
  if (imagePreviewDialog?.open) imageViewer.fit();
});

function renderCoursesFavorites() {
  if (!coursesFavoritesList) return;
  const query = String(coursesFavoritesSearch?.value || "").trim().toLowerCase();
  const items = coursesFavoritesCache.filter((item) => {
    if (!query) return true;
    return String(item.title || "").toLowerCase().includes(query)
      || String(item.desc || "").toLowerCase().includes(query);
  });
  coursesFavoritesList.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("mdui-list-item");
    empty.disabled = true;
    empty.textContent = query ? "没有匹配的收藏" : "暂时没有收藏项目";
    coursesFavoritesList.appendChild(empty);
    return;
  }

  items.forEach((course) => {
    const item = document.createElement("mdui-list-item");
    item.setAttribute("rounded", "");
    item.dataset.courseId = String(course.id);
    item.setAttribute("headline", String(course.title || "未命名教程"));
    item.setAttribute("description", String(course.desc || "暂无简介"));
    const icon = document.createElement("mdui-icon");
    icon.slot = "icon";
    icon.name = String(course.icon || "menu_book");
    item.appendChild(icon);
    const courseId = String(course.id);
    if (coursesFavoritesSelectionMode && selectedCourseFavoriteIds.has(courseId)) item.setAttribute("active", "");
    if (coursesFavoritesSelectionMode) {
      const checkbox = document.createElement("mdui-checkbox");
      checkbox.slot = "start-icon";
      checkbox.checked = selectedCourseFavoriteIds.has(courseId);
      checkbox.tabIndex = -1;
      checkbox.style.pointerEvents = "none";
      item.appendChild(checkbox);
    }

    let timer = null;
    let longPressed = false;
    const cancel = () => { if (timer !== null) clearTimeout(timer); timer = null; };
    item.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      longPressed = false;
      timer = window.setTimeout(() => {
        timer = null;
        longPressed = true;
        coursesFavoritesSelectionMode = true;
        selectedCourseFavoriteIds.add(String(course.id));
        if (navigator.vibrate) navigator.vibrate(35);
        if (coursesFavoritesDelete) coursesFavoritesDelete.style.display = "inline-flex";
        renderCoursesFavorites();
      }, 600);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => item.addEventListener(type, cancel));
    item.addEventListener("click", (event) => {
      if (longPressed) { event.preventDefault(); return; }
      if (coursesFavoritesSelectionMode) {
        const id = String(course.id);
        if (selectedCourseFavoriteIds.has(id)) selectedCourseFavoriteIds.delete(id);
        else selectedCourseFavoriteIds.add(id);
        renderCoursesFavorites();
        return;
      }
      document.getElementById("courses_frame")?.contentWindow?.postMessage({ type: "app:action", id: "courses:open", courseId: course.id }, "*");
      if (coursesFavoritesSheet) coursesFavoritesSheet.open = false;
    });
    coursesFavoritesList.appendChild(item);
  });
}

window.addEventListener("message", (event) => {
  const data = event?.data;
  if (!data) return;
  if (data.type === "app:toast") {
    showFrameToast(String(data.text || ""), data.color);
    return;
  }
  if (data.type === "notes:insert-dialog-state") {
    [main_fab, main_fab_mobile].forEach((fab) => { if (fab) fab.style.visibility = data.open ? "hidden" : ""; });
    return;
  }
  if (data.type === "notes:view-state") {
      notesDetailActive = Boolean(data.detail);
      if (!notesDetailActive) closeNotesInsertMenu();
      if (activeTab === "notes" && !notesSelectionActive) {
        [main_fab, main_fab_mobile].forEach((fab) => {
          if (!fab) return;
          fab.icon = notesDetailActive ? "add_box--outlined" : "add--outlined";
          fab.setAttribute("aria-label", notesDetailActive ? "向当前笔记插入内容" : "新建笔记");
        });
      }
      return;
    }
    if (data.type === "notes:selection-state") {
    notesSelectionActive = Boolean(data.active);
    notesSelectionCount = Number(data.count) || 0;
    if (notesSelectionActive) closeNotesInsertMenu();
    if (activeTab === "notes") {
      const icon = notesSelectionActive
        ? "delete--outlined"
        : (notesDetailActive ? "add_box--outlined" : "add--outlined");
      const label = notesSelectionActive
        ? `删除选中的笔记 (${notesSelectionCount})`
        : (notesDetailActive ? "向当前笔记插入内容" : "新建笔记");
      [main_fab, main_fab_mobile].forEach((fab) => {
        if (!fab) return;
        fab.icon = icon;
        fab.setAttribute("aria-label", label);
        fab.title = label;
      });
    }
    return;
  }
  if (data.type === "image-compress:close") {
    if (imageCompressDialog) imageCompressDialog.open = false;
    return;
  }
  if (data.type === "image-compress:preview") {
    const src = typeof data.src === "string" ? data.src : "";
    if (!src) return;
    openImageViewer(src, String(data.title || "图片预览"));
    return;
  }
  if (data.type === "courses:open-favorites" || data.type === "courses:favorites-updated") {
    coursesFavoritesCache = Array.isArray(data.favorites) ? data.favorites : [];
    coursesFavoritesSelectionMode = false;
    selectedCourseFavoriteIds.clear();
    if (coursesFavoritesDelete) coursesFavoritesDelete.style.display = "none";
    renderCoursesFavorites();
    if (data.type === "courses:open-favorites" && coursesFavoritesSheet) coursesFavoritesSheet.open = true;
    return;
  }
  if (data.type === "resources:open-releases") {
    if (navigationDrawer) navigationDrawer.open = false;
    if (releasesDialog) releasesDialog.open = true;
    return;
  }
  if (data.type === "notes:markdown-settings") {
    const settings = data.settings && typeof data.settings === "object" ? data.settings : {};
    if (notesPreviewContent) {
      notesPreviewContent.style.setProperty("--md-font-size", `${Math.max(12, Math.min(32, Number(settings.fontSize) || 15))}px`);
      notesPreviewContent.style.setProperty("--md-body-background", settings.followTheme === false ? String(settings.bodyBackground || "transparent") : "transparent");
      notesPreviewContent.style.setProperty("--md-blockquote-background", String(settings.quoteBackground || "rgba(0, 0, 0, 0.5)"));
    }
    return;
  }
  if (data.type === "notes:preview") {
    openNotesPreview(data);
    return;
  }
  if (data.type === "app:open-tool" && data.tool === "image-compress") {
    if (navigationDrawer) navigationDrawer.open = false;
    if (imageCompressDialog) imageCompressDialog.open = true;
    return;
  }
  if (data.type === "app:topbar") {
    const tab = data.tab || activeTab;
    const title = typeof data.title === "string" ? data.title : null;
    const actions = Array.isArray(data.actions) ? data.actions : null;
    const favoriteAction = actions?.find((item) => item.id === "act:toggle_fav");
    topbarOverrides.set(tab, {
      title,
      actions,
      courseDetail: tab === "courses" && Boolean(data.actionId),
      favoriteIcon: favoriteAction?.icon || "bookmark_border",
    });
    if (tab === activeTab) renderMobileTopbar(activeTab);
    return;
  }
});
