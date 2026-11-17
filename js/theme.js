/* 放在 <head> 里：在页面画出来之前就定好日夜间，避免闪一下 */
(function () {
  var mode = null;
  try { mode = localStorage.getItem("xtd_station_theme"); } catch (e) {}
  if (mode !== "dark" && mode !== "light") {
    mode = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = mode;
})();
