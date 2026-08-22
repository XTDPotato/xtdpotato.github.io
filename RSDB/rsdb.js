(() => {
  const PRIMARY_KEY = "xtd_theme_primary";
  const CONTROL_KEY = "xtd_theme_control";
  const HIGHLIGHT_KEY = "xtd_theme_highlight";
  const DEFAULT_COLORS = { primary: "#7e57c2", control: "#7e57c2", highlight: "#ffca28" };

  function validHex(value) {
    return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
  }

  function applyThemeColors(colors) {
    if (!colors || !validHex(colors.primary)) return;
    const control = validHex(colors.control) ? colors.control : colors.primary;
    const highlight = validHex(colors.highlight) ? colors.highlight : DEFAULT_COLORS.highlight;
    document.documentElement.style.setProperty("--primary-color", colors.primary);
    document.documentElement.style.setProperty("--xtd-control-color", control);
    document.documentElement.style.setProperty("--xtd-highlight-color", highlight);
    document.documentElement.style.setProperty("--theme-flash-color", highlight);
    window.mdui?.setColorScheme?.(colors.primary);
    updateMetaThemeColor(colors.primary);
  }

  function readThemeColors() {
    return {
      primary: localStorage.getItem(PRIMARY_KEY) || DEFAULT_COLORS.primary,
      control: localStorage.getItem(CONTROL_KEY) || DEFAULT_COLORS.control,
      highlight: localStorage.getItem(HIGHLIGHT_KEY) || DEFAULT_COLORS.highlight,
    };
  }

  function updateMetaThemeColor(hex) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    meta.setAttribute("content", hex);
  }

  function broadcastThemeMode(mode) {
    try {
      window.parent?.postMessage({ type: "theme:mode", mode }, "*");
    } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyThemeColors(readThemeColors());

    document.querySelectorAll(".theme-option").forEach((item) => {
      item.addEventListener("click", () => {
        const mode = item.getAttribute("data-theme");
        if (mode !== "auto" && mode !== "light" && mode !== "dark") return;
        broadcastThemeMode(mode);
      });
    });

    window.addEventListener("storage", (event) => {
      if ([PRIMARY_KEY, CONTROL_KEY, HIGHLIGHT_KEY].includes(event.key)) applyThemeColors(readThemeColors());
    });

    window.addEventListener("message", (event) => {
      const data = event?.data;
      if (!data) return;
      if (data.type === "theme:colors") {
        applyThemeColors(data.colors);
        return;
      }
      if (data.type === "theme:primary" && validHex(data.color)) {
        applyThemeColors({ ...readThemeColors(), primary: data.color });
      }
    });
  });
})();
