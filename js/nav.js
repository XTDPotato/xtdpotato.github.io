"use strict";
/* 导航：常用资源、下载入口和工具 */
(function () {
  const { $, esc, icon } = XTD;

  const RES = [
    { id: "tools", title: "工具", desc: "图片与音频的本地处理工具。", links: [
      { t: "图片压缩", d: "批量压缩、格式转换与下载", i: "image", to: "#/image" },
      { t: "音频转换", d: "转换格式、裁剪首尾与试听预览", i: "audio", to: "#/audio" },
    ] },
    { id: "mors", title: "Moonlight + Sunshine 串流", desc: "客户端 Moonlight + 服务端 Sunshine，低延迟串流，以及皎月连等", links: [
      { t: "123 盘（包含改版等）", i: "cloud", href: "https://www.123pan.com/s/RzbrVv-0qdKd.html" },
      { t: "Github Releases（原版/改版）", d: "查看全部客户端与服务端仓库", i: "globe", releases: true },
    ] },
    { id: "minecraft", title: "Minecraft", desc: "官方渠道下载与其他启动器的常用入口。", links: [
      { t: "官网", i: "globe", href: "https://www.minecraft.net" },
      { t: "基岩版谷歌商店（需要魔法）", i: "shop", href: "https://play.google.com/store/apps/details?id=com.mojang.minecraftpe&utm_source=mcnet" },
      { t: "XBOX / 微软商店购买", i: "shop", href: "https://www.xbox.com/zh-CN/games/store/minecraft-java-bedrock-edition-for-pc/9nxp44l49shj?ocid=storeforweb" },
      { t: "Axolotl Launcher", i: "cloud", href: "https://axlmc.org/" },
      { t: "PCL2社区版下载", i: "cloud", href: "https://pclce-web.demo.fis.ink/download" },
      { t: "PCL2原版下载（提取码 PCL2）", i: "cloud", href: "https://ltcat.lanzouv.com/b0aj6gsid" },
      { t: "HMCL主页", i: "cloud", href: "https://hmcl.huangyuhui.net/" },
      { t: "MC基岩版版本库（仅体验）", i: "globe", href: "https://www.mcappx.com/" },
    ] },
    { id: "addon", title: "MC 基岩版 Addon", desc: "个人整理的一些 Addon 资源。", links: [
      { t: "猫鼠夏日游轮 20240101（123 盘）", i: "cloud", href: "https://www.123pan.com/s/RzbrVv-HIdKd.html" },
    ] },
  ];

  const RELEASES = [
    ["客户端（改版）", [
      { t: "月光·阿西西 Android（改版）", d: "Axixi2233 / moonlight-android", i: "phone", href: "https://github.com/Axixi2233/moonlight-android/releases" },
      { t: "月光·阿西西 PC（改版）", d: "Axixi2233 / moonlight-qt", i: "pc", href: "https://github.com/Axixi2233/moonlight-qt/releases/tag/250306" },
      { t: "黑月光 Artemis Android（改版）", d: "ClassicOldSong / moonlight-android", i: "phone", href: "https://github.com/ClassicOldSong/moonlight-android/releases/tag/v20.2.6" },
    ]],
    ["客户端（原版）", [
      { t: "Moonlight Android（原版）", d: "moonlight-stream / moonlight-android", i: "phone", href: "https://github.com/moonlight-stream/moonlight-android/releases" },
      { t: "Moonlight PC（原版）", d: "moonlight-stream / moonlight-qt", i: "pc", href: "https://github.com/moonlight-stream/moonlight-qt/releases" },
    ]],
    ["服务端（改版）", [
      { t: "Sunshine Apollo（改版）", d: "ClassicOldSong / Apollo", i: "server", href: "https://github.com/ClassicOldSong/Apollo/releases" },
    ]],
    ["服务端（原版）", [
      { t: "Sunshine（原版）", d: "LizardByte / Sunshine", i: "server", href: "https://github.com/LizardByte/Sunshine/releases" },
    ]],
  ];

  function row(k) {
    const inner = `${icon(k.i)}<span>${esc(k.t)}${k.d ? `<small>${esc(k.d)}</small>` : ""}</span>`;
    if (k.to) return `<li><a href="${k.to}">${inner}${icon("go")}</a></li>`;
    if (k.href) return `<li><a href="${esc(k.href)}" target="_blank" rel="noopener noreferrer">${inner}${icon("ext")}</a></li>`;
    return `<li><button type="button" data-releases>${inner}</button></li>`;
  }

  $("resGrid").innerHTML = RES.map((r) =>
    `<section class="res" id="res-${r.id}"><h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p><ul>${r.links.map(row).join("")}</ul></section>`).join("");
  $("relBody").innerHTML = "<p>改版在上面，原版在下面。优先从 Releases 处下载。</p>" +
    RELEASES.map(([h, list]) => `<h3>${h}</h3><ul>${list.map(row).join("")}</ul>`).join("");
  $("resGrid").addEventListener("click", (e) => {
    if (e.target.closest("[data-releases]")) $("releases").showModal();
  });

  // 话说页线路图上“导航线”的各站
  XTD.navStops = [
    { t: "图片压缩", h: "#/image" },
    { t: "音频转换", h: "#/audio" },
    { t: "串流", h: "#/nav/mors" },
    { t: "Minecraft", h: "#/nav/minecraft" },
    { t: "Addon", h: "#/nav/addon" },
  ];

  XTD.views.nav = {
    show(id) {
      const card = id && $("res-" + id);
      if (!card) return;
      card.scrollIntoView({ block: "start" });
      card.classList.remove("flash");
      void card.offsetWidth; // 重新触发闪烁动画
      card.classList.add("flash");
    },
  };
})();
