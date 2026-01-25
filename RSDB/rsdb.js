(() => {
  const PRIMARY_KEY = "xtd_theme_primary";

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
    updateMetaThemeColor(localStorage.getItem(PRIMARY_KEY) || "#00796b");

    document.querySelectorAll(".theme-option").forEach((item) => {
      item.addEventListener("click", () => {
        const mode = item.getAttribute("data-theme");
        if (mode !== "auto" && mode !== "light" && mode !== "dark") return;
        broadcastThemeMode(mode);
      });
    });

    window.addEventListener("storage", (event) => {
      if (event.key === PRIMARY_KEY) updateMetaThemeColor(event.newValue);
    });
  });
})();
