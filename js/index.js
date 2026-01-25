"use strict";

const navigationDrawer = document.querySelector(".main-drawer");
const openDrawerButton = document.getElementById("fab_menu");

const drawer_btn1 = navigationDrawer?.querySelector(".drawer_btn1");
const drawer_btn2 = navigationDrawer?.querySelector(".drawer_btn2");
const drawer_btn3 = navigationDrawer?.querySelector(".drawer_btn3");

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

const mobileMenuButton = document.getElementById("mobile_menu_btn");
const mobileNavBar = document.getElementById("mobile_navbar");
const mobileTitle = document.getElementById("mobile_title");
const mobileAction1 = document.getElementById("mobile_action_1");
const mobileAction2 = document.getElementById("mobile_action_2");
const mobileMoreBtn = document.getElementById("mobile_more_btn");
const mobileMoreMenu = document.getElementById("mobile_more_menu");

const themeCollapseMain = document.getElementById("themeCollapseMain");
const themeCollapseContentMain = document.getElementById("themeCollapseContentMain");

let main_fab_click_change = 0;
let selectedTheme = localStorage.getItem("theme") || "auto";
let systemThemeMedia = null;
let activeTab = "saying";
const topbarOverrides = new Map();

function showToast(text) {
  if (!main_snackbar) return;
  main_snackbar.textContent = text;
  main_snackbar.open = true;
}

function setFabMode(mode) {
  main_fab_click_change = mode;
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
    const nextIcon =
      mode === 0
        ? "refresh--outlined"
        : mode === 1
          ? "upload--outlined"
          : mode === 2
            ? "add--outlined"
            : "near_me--outlined";
    animateFabIcon(fab, nextIcon);
  };
  updateFab(main_fab);
  updateFab(main_fab_mobile);
}

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
  if (tab === "notes") {
    return [
      { id: "notes:rename", icon: "edit", text: "重命名" },
      { id: "notes:delete", icon: "delete", text: "删除" },
      { id: "notes:save", icon: "save", text: "保存" },
      { id: "notes:export_txt", icon: "description", text: "导出 TXT" },
    ];
  }
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

  const actions = override?.actions || getDefaultActions(tab);
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
  topbarOverrides.delete(tab);
  switchTabWithAnimation(tab);
  if (tab === "saying") setFabMode(0);
  if (tab === "resources") setFabMode(1);
  if (tab === "notes") setFabMode(2);
  if (tab === "courses") setFabMode(3);
  syncMobileNav(tab);
  applyDesktopTabsInsetIfOverlapped();
  if (tab === "courses") {
    const frame = getFrameByTab("courses");
    const win = frame?.contentWindow;
    win?.postMessage({ type: "app:action", id: "courses:collapse" }, "*");
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

function updateThemeSelectionInDrawer() {
  if (!themeCollapseContentMain) return;
  const themeOptions = themeCollapseContentMain.querySelectorAll(".theme-option");
  themeOptions.forEach((item) => {
    item.removeAttribute("selected");
    item.removeAttribute("active");
    const oldCheck = item.querySelector('mdui-icon[slot="end-icon"][data-theme-check="1"]');
    oldCheck?.remove();
  });
  const current = themeCollapseContentMain.querySelector(`.theme-option[data-theme="${selectedTheme}"]`);
  if (current) {
    current.setAttribute("selected", "");
    current.setAttribute("active", "");
    const check = document.createElement("mdui-icon");
    check.setAttribute("slot", "end-icon");
    check.setAttribute("data-theme-check", "1");
    check.setAttribute("name", "check");
    current.appendChild(check);
  }

  const headerItem = themeCollapseMain?.querySelector('mdui-list-item[slot="header"]');
  if (headerItem) {
    let headlineText = "主题模式 (当前: 自动)";
    let iconName = "dark_mode";
    if (selectedTheme === "light") headlineText = "主题模式 (当前: 日间)";
    else if (selectedTheme === "dark") headlineText = "主题模式 (当前: 夜间)";
    headerItem.setAttribute("headline", headlineText);
    headerItem.setAttribute("icon", iconName);
  }
}

function changeTheme(theme) {
  selectedTheme = theme;
  localStorage.setItem("theme", selectedTheme);
  applyTheme();
  updateThemeSelectionInDrawer();
  if (navigationDrawer) navigationDrawer.open = false;
}

function initTheme() {
  applyTheme();
  updateThemeSelectionInDrawer();
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

  themeCollapseContentMain?.querySelectorAll(".theme-option").forEach((item) => {
    item.addEventListener("click", () => {
      const theme = item.getAttribute("data-theme");
      if (!theme) return;
      changeTheme(theme);
    });
  });
}

setFabMode(0);
activeTab = "saying";
syncMobileNav("saying");
initTheme();
applyDesktopTabsInsetIfOverlapped();

window.addEventListener("resize", () => {
  applyDesktopTabsInsetIfOverlapped();
});

main_fab?.addEventListener("click", () => {
  if (main_fab_click_change === 0) {
    window.location.reload();
    return;
  }

  if (main_fab_click_change === 1) {
    showToast("暂时不支持上传资源");
    return;
  }

  if (main_fab_click_change === 2) {
    const ok = postToNotes({ type: "notes:create" });
    if (!ok) showToast("笔记页面未加载完成");
    return;
  }

  if (main_fab_click_change === 3) {
    showToast("暂时不支持添加教程");
  }
});

main_fab_mobile?.addEventListener("click", () => {
  if (main_fab_click_change === 0) {
    window.location.reload();
    return;
  }

  if (main_fab_click_change === 1) {
    showToast("暂时不支持上传资源");
    return;
  }

  if (main_fab_click_change === 2) {
    const ok = postToNotes({ type: "notes:create" });
    if (!ok) showToast("笔记页面未加载完成");
    return;
  }

  if (main_fab_click_change === 3) {
    showToast("暂时不支持添加教程");
  }
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
});
drawer_btn2?.addEventListener("click", () => {
  if (navigationDrawer) navigationDrawer.open = false;
});
drawer_btn3?.addEventListener("click", () => {
  if (navigationDrawer) navigationDrawer.open = false;
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

window.addEventListener("resize", () => {
  renderMobileTopbar(activeTab);
});

window.addEventListener("message", (event) => {
  const data = event?.data;
  if (!data) return;
  if (data.type === "app:topbar") {
    const tab = data.tab || activeTab;
    const title = typeof data.title === "string" ? data.title : null;
    const actions = Array.isArray(data.actions) ? data.actions : null;
    topbarOverrides.set(tab, { title, actions });
    if (tab === activeTab) renderMobileTopbar(activeTab);
    return;
  }
});
