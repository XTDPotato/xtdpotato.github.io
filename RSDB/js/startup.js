function initShortcutToolbarDrag() {
    const wrap = document.getElementById('shortcutToolbarWrap');
    if (!wrap || wrap.dataset.dragBound === '1') return;
    wrap.dataset.dragBound = '1';
    // 脱离带 transform 的虚拟键盘容器，fixed 才能真正以整个视口为边界。
    if (wrap.parentElement !== document.body) document.body.appendChild(wrap);
    wrap.style.setProperty('z-index', '2147483647', 'important');
    wrap.style.setProperty('isolation', 'isolate');

    const STORAGE_KEY = 'shortcutToolbarWrap_pos_v4';
    const DEFAULT_RIGHT = '6px';
    const getDefaultTop = () => `${Math.max(6, window.innerHeight - (Number(appSettings.virtualKeyboardHeight) || 420) - (Number(appSettings.virtualKeyboardBottomOffset) || 0) + 6)}px`;
    const getToolbarLayouts = () => normalizeToolbarShakeLayouts(appSettings.toolbarShakeLayouts);
    const syncToolbarHitBox = () => {
        const toolbar = document.getElementById('shortcutToolbar');
        if (!toolbar || toolbar.style.display === 'none') return;
        const scale = Math.max(0.5, Math.min(1.5, (Number(appSettings.toolbarScale) || 100) / 100));
        const width = toolbar.offsetWidth;
        const height = toolbar.offsetHeight;
        if (!width || !height) return;
        wrap.style.width = `${Math.ceil(width * scale)}px`;
        wrap.style.height = `${Math.ceil(height * scale)}px`;
    };
    window.syncShortcutToolbarHitBox = () => requestAnimationFrame(syncToolbarHitBox);
    const normalizeToolbarMode = mode => {
        const layouts = getToolbarLayouts();
        return layouts.some(layout => layout.id === mode) ? mode : layouts[0].id;
    };
    const setToolbarMode = (mode, preserveCenter = false, suppressAnimation = false) => {
        const nextMode = normalizeToolbarMode(mode);
        const before = preserveCenter ? wrap.getBoundingClientRect() : null;
        wrap.dataset.toolbarMode = nextMode;
        const layout = getToolbarLayouts().find(item => item.id === nextMode) || getToolbarLayouts()[0];
        const selected = new Set(layout?.controls || []);
        const toolbar = document.getElementById('shortcutToolbar');
        const imeVisible = !!toolbar?.classList.contains('ime-tools-visible');
        document.querySelectorAll('#shortcutToolbar [data-toolbar-control]').forEach(control => {
            const imeControl = ['language', 'scheme', 'separator'].includes(control.dataset.toolbarControl);
            const visible = selected.has(control.dataset.toolbarControl) && (!imeControl || imeVisible);
            control.style.setProperty('display', visible ? 'inline-flex' : 'none', 'important');
        });
        if (toolbar) {
            toolbar.setAttribute('aria-label', layout?.name || '快捷短语工具栏');
            toolbar.setAttribute('title', layout?.name || '快捷短语工具栏');
        }
        if (!suppressAnimation && appSettings.toolbarShakeAnimation !== false) {
            wrap.classList.remove('toolbar-layout-changing');
            void wrap.offsetWidth;
            wrap.classList.add('toolbar-layout-changing');
            setTimeout(() => wrap.classList.remove('toolbar-layout-changing'), 260);
        }
        syncToolbarHitBox();
        requestAnimationFrame(syncToolbarHitBox);
        if (before) {
            const after = wrap.getBoundingClientRect();
            const centeredLeft = before.left + (before.width - after.width) / 2;
            const centeredTop = before.top + (before.height - after.height) / 2;
            const right = Math.max(6, Math.min(window.innerWidth - centeredLeft - after.width, window.innerWidth - after.width - 6));
            const top = Math.max(6, Math.min(centeredTop, window.innerHeight - after.height - 6));
            wrap.style.right = `${Math.round(right)}px`;
            wrap.style.top = `${Math.round(top)}px`;
        }
        return nextMode;
    };
    const cycleToolbarMode = () => {
        const layouts = getToolbarLayouts();
        const currentMode = normalizeToolbarMode(wrap.dataset.toolbarMode);
        const currentIndex = Math.max(0, layouts.findIndex(layout => layout.id === currentMode));
        return setToolbarMode(layouts[(currentIndex + 1) % layouts.length].id, true);
    };
    window.refreshShortcutToolbarLayout = () => setToolbarMode(wrap.dataset.toolbarMode, false, true);

    window.resetShortcutToolbarWrapPosition = () => {
        const w = document.getElementById('shortcutToolbarWrap');
        if (!w) return;
        setToolbarMode('full');
        w.style.position = 'fixed';
        w.style.right = DEFAULT_RIGHT;
        w.style.top = getDefaultTop();
        w.style.bottom = 'auto';
        w.dataset.userPositioned = '0';
        localStorage.removeItem(STORAGE_KEY);
    };

    // 1. 恢复上次保存的位置
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const { right, top, mode } = JSON.parse(saved);
            setToolbarMode(mode);
            wrap.style.position = 'fixed';
            wrap.style.right = right || DEFAULT_RIGHT;
            wrap.style.top = top || getDefaultTop();
            wrap.style.bottom = 'auto';
            wrap.dataset.userPositioned = '1';
        } catch (e) {
            wrap.style.position = 'fixed';
            wrap.style.right = DEFAULT_RIGHT;
            wrap.style.top = getDefaultTop();
        }
    } else {
        setToolbarMode('full');
        wrap.style.position = 'fixed';
        wrap.style.right = DEFAULT_RIGHT;
        wrap.style.top = getDefaultTop();
        wrap.style.bottom = 'auto';
        delete wrap.dataset.userPositioned;
    }
    const clampToolbarToViewport = () => {
        const rect = wrap.getBoundingClientRect();
        const right = Math.max(6, Math.min(parseFloat(wrap.style.right) || 6, window.innerWidth - Math.max(48, rect.width) - 6));
        const top = Math.max(6, Math.min(parseFloat(wrap.style.top) || 6, window.innerHeight - Math.max(40, rect.height) - 6));
        wrap.style.right = `${Math.round(right)}px`;
        wrap.style.top = `${Math.round(top)}px`;
    };
    requestAnimationFrame(clampToolbarToViewport);
    window.addEventListener('resize', clampToolbarToViewport, { passive: true });

    let pointerId = null;
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialRight = 0, initialTop = 0;
    let longPressTimer = null;
    const LONG_PRESS_MS = 280;
    let ignoreClickUntil = 0;
    let dragHintShown = false;
    let shakeAnchorX = 0;
    let shakeAnchorY = 0;
    let shakeDirection = 0;
    let shakeReversals = 0;
    let shakeStartedAt = 0;
    let lastShakeAt = 0;
    const SHAKE_WINDOW_MS = 720;
    const SHAKE_COOLDOWN_MS = 650;

    const resetShakeTracking = (x = 0, y = 0) => {
        shakeAnchorX = x;
        shakeAnchorY = y;
        shakeDirection = 0;
        shakeReversals = 0;
        shakeStartedAt = 0;
    };

    const detectToolbarShake = (e) => {
        if (appSettings.toolbarShakeEnabled === false) return false;
        const SHAKE_SEGMENT_PX = Math.max(12, Math.min(80, Number(appSettings.toolbarShakeAmplitude) || 26));
        const segmentX = e.clientX - shakeAnchorX;
        const segmentY = e.clientY - shakeAnchorY;
        if (Math.abs(segmentX) < SHAKE_SEGMENT_PX || Math.abs(segmentX) < Math.abs(segmentY) * 1.15) return false;
        const direction = Math.sign(segmentX);
        shakeAnchorX = e.clientX;
        shakeAnchorY = e.clientY;
        if (!shakeDirection) {
            shakeDirection = direction;
            return false;
        }
        if (direction === shakeDirection) return false;

        const now = Date.now();
        shakeDirection = direction;
        if (!shakeStartedAt || now - shakeStartedAt > SHAKE_WINDOW_MS) {
            shakeStartedAt = now;
            shakeReversals = 1;
        } else {
            shakeReversals += 1;
        }
        if (shakeReversals < 2 || now - lastShakeAt < SHAKE_COOLDOWN_MS) return false;

        cycleToolbarMode();
        lastShakeAt = now;
        resetShakeTracking(e.clientX, e.clientY);
        if (navigator.vibrate) navigator.vibrate([10, 35, 10]);
        return true;
    };

    // 禁用/恢复滚动的辅助函数
    const disableScroll = () => {
        document.body.classList.add('dragging-active');
        document.documentElement.classList.add('dragging-active');
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        // 额外禁用快捷短语区域的横向滚动
        const sc = document.getElementById('shortcutContainer');
        if (sc) sc.style.overflowX = 'hidden';
    };

    const enableScroll = () => {
        document.body.classList.remove('dragging-active');
        document.documentElement.classList.remove('dragging-active');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        const sc = document.getElementById('shortcutContainer');
        if (sc) sc.style.overflowX = 'auto';
    };

    const onPointerDown = (e) => {
        if (pointerId !== null) return;
        pointerId = e.pointerId;

        const style = window.getComputedStyle(wrap);
        initialRight = parseFloat(style.right) || 6;
        initialTop = parseFloat(style.top) || 6;

        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;
        resetShakeTracking(e.clientX, e.clientY);

        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            isDragging = true;
            try { wrap.setPointerCapture(pointerId); } catch (error) {}
            wrap.classList.add('dragging');
            disableScroll();  // 禁用所有滚动
            ignoreClickUntil = Date.now() + 450;
            if (!dragHintShown) {
                dragHintShown = true;
                showSnackbar('提示：长按工具栏可拖动位置', 'info');
            }

            if (navigator.vibrate) navigator.vibrate(12);

            // 临时禁用内部按钮的点击（防止误触发 + 或 edit）
            wrap.querySelectorAll('[data-toolbar-control], mdui-button-icon, button').forEach(btn => {
                btn.style.pointerEvents = 'none';
            });
        }, LONG_PRESS_MS);
    };

    const onPointerMove = (e) => {
        if (pointerId !== e.pointerId) return;

        if (!isDragging) {
            const dx = Math.abs(e.clientX - startX);
            const dy = Math.abs(e.clientY - startY);
            if (dx > 18 || dy > 18) clearTimeout(longPressTimer);
            return;
        }
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newRight = initialRight - dx;
        let newTop = initialTop + dy;

        // 工具栏可以在整个可视屏幕内移动。
        const rect = wrap.getBoundingClientRect();
        newRight = Math.max(6, Math.min(newRight, window.innerWidth - rect.width - 6));
        const minTop = 6;
        const maxTop = Math.max(minTop, window.innerHeight - rect.height - 6);
        newTop = Math.max(minTop, Math.min(newTop, maxTop));

        wrap.style.right = `${Math.round(newRight)}px`;
        wrap.style.top = `${Math.round(newTop)}px`;
        wrap.style.bottom = 'auto';
        if (detectToolbarShake(e)) {
            const movedStyle = window.getComputedStyle(wrap);
            initialRight = parseFloat(movedStyle.right) || 6;
            initialTop = parseFloat(movedStyle.top) || 6;
            startX = e.clientX;
            startY = e.clientY;
        }
    };

    const onPointerUp = (e) => {
        if (pointerId !== e.pointerId) return;
        clearTimeout(longPressTimer);

        // 恢复滚动和按钮交互
        enableScroll();
        wrap.querySelectorAll('[data-toolbar-control], mdui-button-icon, button').forEach(btn => {
            btn.style.pointerEvents = '';
        });

        if (isDragging) {
            const pos = {
                right: wrap.style.right,
                top: wrap.style.top,
                mode: normalizeToolbarMode(wrap.dataset.toolbarMode)
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
            wrap.dataset.userPositioned = '1';
            if (navigator.vibrate) navigator.vibrate(15);
        }

        wrap.classList.remove('dragging');
        try {
            if (wrap.hasPointerCapture?.(e.pointerId)) wrap.releasePointerCapture(e.pointerId);
        } catch (error) {}
        pointerId = null;
        isDragging = false;
        resetShakeTracking();
    };

    // 绑定事件（move 和 up 监听 document，确保手指移出元素也能跟踪）
    wrap.addEventListener('pointerdown', onPointerDown, { passive: false, capture: true });
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);

    const toolbar = document.getElementById('shortcutToolbar');
    if (toolbar && !toolbar.dataset.longPressGuard) {
        toolbar.dataset.longPressGuard = '1';
        ['contextmenu', 'selectstart', 'dragstart'].forEach(type => {
            toolbar.addEventListener(type, event => {
                event.preventDefault();
                event.stopPropagation();
            }, true);
        });
    }
    if (toolbar && !toolbar.dataset.boundClickGuard) {
        toolbar.dataset.boundClickGuard = '1';
        toolbar.addEventListener('click', (e) => {
            if (Date.now() < ignoreClickUntil) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    }

}




		function initializeRsdbApp() {
		  imeLearningState = loadImeLearningState();
		  const initialThemeColors = getStoredThemeColors();
		  applyStoredThemeColors(initialThemeColors, false);

		  initTheme();
		  initEventListeners();
		  bindCellAlignPickerInteractions();
		  initShortcutToolbarDrag();

		  window.addEventListener("message", (event) => {
		    const data = event?.data;
		    if (!data) return;
		    if (data.type === 'theme:colors' && data.colors) {
		      const colors = data.colors;
		      if (!Object.values(colors).every(color => /^#[0-9a-fA-F]{6}$/.test(color || ''))) return;
		      localStorage.setItem(PRIMARY_KEY, colors.primary);
		      localStorage.setItem(CONTROL_COLOR_KEY, colors.control);
		      localStorage.setItem(HIGHLIGHT_COLOR_KEY, colors.highlight);
		      applyStoredThemeColors(colors, false);
		      renderPrimaryThemePalette();
		      return;
		    }
		    if (data.type === "theme:primary") {
		      const color = data.color;
		      if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return;
		      localStorage.setItem(PRIMARY_KEY, color);
		      applyColorScheme(color);
		      flashTheme(color);
		      return;
		    }
		    if (data.type === "theme:mode") {
		      const mode = data.mode;
		      if (mode !== "auto" && mode !== "light" && mode !== "dark") return;
		      selectedTheme = mode;
		      localStorage.setItem("theme", selectedTheme);
		      initTheme();
		      flashTheme(getStoredThemeColors().primary);
		    }
		  });

		  window.addEventListener("storage", (event) => {
		    if ([PRIMARY_KEY, CONTROL_COLOR_KEY, HIGHLIGHT_COLOR_KEY, CUSTOM_THEME_COLOR_KEY].includes(event.key)) {
		      const colors = getStoredThemeColors();
		      applyStoredThemeColors(colors, false);
		      renderPrimaryThemePalette();
		      if (event.key === PRIMARY_KEY) flashTheme(colors.primary);
		      return;
		    }
		    if (event.key === "theme") {
		      const mode = event.newValue;
		      if (mode !== "auto" && mode !== "light" && mode !== "dark") return;
		      selectedTheme = mode;
		      initTheme();
		    }
		  });

		  if (window.matchMedia) {
		    const media = window.matchMedia("(prefers-color-scheme: dark)");
		    try {
		      media.addEventListener("change", () => {
		        if (selectedTheme === "auto") initTheme();
		      });
		    } catch (e) {}
		  }

		  loadDataFromIndexedDB();
		  updateTable();
		  loadCalculatorSettings();
		  initAutoCalculate();
		  initCalculatorKeyboard(); 
		  ZoomManager.init();
          KeyboardConfigManager.init();
          applyAppSettings();
          restoreImportedFonts();
          initShortcutToolbarDrag();
          // 刷新后立即渲染操作历史列表，确保本地数据立即可见
          renderOperationHistoryList('');
          
          
if ('serviceWorker' in navigator) {
        // 相对当前页面注册，兼容以项目根目录或 RSDB 目录启动本地服务器。
        navigator.serviceWorker.register('./sw.js', { scope: './' })
            .then(registration => {
                console.log('service worker registered', registration.scope);
            })
            .catch(err => console.error('service worker registration failed', err));
    }
		}

		if (document.readyState === 'loading') {
		  document.addEventListener('DOMContentLoaded', initializeRsdbApp, { once: true });
		} else {
		  initializeRsdbApp();
		}
