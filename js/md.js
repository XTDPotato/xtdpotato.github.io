"use strict";
/* Markdown 渲染：标题、列表（可嵌套）、引用、代码块、表格、分隔线、图片、链接、粗斜体、删除线、++下划线++ */
(function () {
  const { esc, asset } = XTD;
  let assets = {};

  // 只放行 http(s)、mailto、站内相对路径、内嵌图片和笔记附件，其余协议一律丢弃
  function safeUrl(u, isLink) {
    u = u.replace(/\\+$/, "");
    const a = u.match(/^note-asset:\/\/(.+)$/);
    if (a) return (!isLink && assets[a[1]] && assets[a[1]].dataUrl) || "";
    if (/^(https?:|mailto:)/i.test(u)) return u;
    if (/^data:image\//i.test(u)) return isLink ? "" : u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "";
    return asset(u);
  }

  function inline(s) {
    const keep = [];
    const hold = (h) => "\u0000" + (keep.push(h) - 1) + "\u0000";
    s = s.replace(/`([^`]+)`/g, (m, c) => hold("<code>" + esc(c) + "</code>"));
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)(\{[^}]*\})?/g, (m, alt, u) => {
      // 站内相对路径的插图交给 XTD.img，它带有找不到时的备用地址
      if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) return hold(XTD.img(u.replace(/\\+$/, ""), alt));
      u = safeUrl(u, false);
      return u ? hold(`<img src="${esc(u)}" alt="${esc(alt)}" loading="lazy">`) : "";
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
      u = safeUrl(u, true);
      return u ? hold(`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">`) + t + hold("</a>") : t;
    });
    s = esc(s)
      .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\s][^*]*?)\*/g, "<em>$1</em>")
      .replace(/~~(.+?)~~/g, "<del>$1</del>")
      .replace(/\+\+(.+?)\+\+/g, "<u>$1</u>");
    return s.replace(/\u0000(\d+)\u0000/g, (m, n) => keep[n]);
  }

  const indent = (l) => l.match(/^\s*/)[0].length;
  const isItem = (l) => /^\s*(?:[-*+]|\d+[.)])\s+\S/.test(l);
  const isHr = (l) => /^\s*([-*_])(?:\s*\1){2,}\s*$/.test(l);
  const isBlock = (l) => /^\s*(```|#{1,6}\s|>)/.test(l) || isItem(l) || isHr(l);

  /* ---------- 表格 ---------- */
  // 把一行按 | 拆成单元格；\| 表示单元格里的竖线本身，`代码` 里的竖线也不算分隔
  function cells(line) {
    let s = line.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
    const out = [];
    let cur = "";
    for (let k = 0; k < s.length; k++) {
      if (s[k] === "\\" && s[k + 1] === "|") { cur += "|"; k++; }
      else if (s[k] === "`") {
        const end = s.indexOf("`", k + 1);
        if (end < 0) { cur += s[k]; continue; } // 没有配对的反引号，当普通字符
        cur += s.slice(k, end + 1).replace(/\\\|/g, "|");
        k = end;
      }
      else if (s[k] === "|") { out.push(cur.trim()); cur = ""; }
      else cur += s[k];
    }
    out.push(cur.trim());
    return out;
  }
  // 第 i 行是表头、第 i+1 行是 |---|:--:|--:| 这样的分隔行时，返回每一列的对齐方式；否则返回 null
  function tableAt(L, i) {
    if (i + 1 >= L.length || !L[i].includes("|")) return null;
    const d = L[i + 1];
    if (!/^[\s|:-]+$/.test(d) || !d.includes("-")) return null;
    const marks = cells(d);
    if (!marks.every((m) => /^:?-+:?$/.test(m))) return null;
    if (cells(L[i]).length !== marks.length) return null;
    return marks.map((m) => {
      const l = m.startsWith(":");
      const r = m.endsWith(":");
      return l && r ? "center" : r ? "right" : l ? "left" : "";
    });
  }
  function table(head, rows, align) {
    const cell = (tag, text, k) =>
      `<${tag}${align[k] ? ` style="text-align:${align[k]}"` : ""}>` +
      inline(text || "").replace(/&lt;br\s*\/?&gt;/gi, "<br>") + // 单元格里可以用 <br> 换行
      `</${tag}>`;
    const tr = (tag, row) => "<tr>" + align.map((_, k) => cell(tag, row[k], k)).join("") + "</tr>"; // 缺的列补空，多的列丢弃
    return '<div class="md-table"><table><thead>' + tr("th", head) + "</thead>" +
      (rows.length ? "<tbody>" + rows.map((r) => tr("td", r)).join("") + "</tbody>" : "") +
      "</table></div>";
  }

  function block(src) {
    const L = String(src).replace(/\r/g, "").split("\n");
    const out = [];
    let i = 0;
    while (i < L.length) {
      const l = L[i];
      let m;
      if (!l.trim()) { i++; continue; }
      if (/^\s*```/.test(l)) {
        const b = [];
        i++;
        while (i < L.length && !/^\s*```/.test(L[i])) b.push(L[i++]);
        i++;
        out.push("<pre><code>" + esc(b.join("\n")) + "</code></pre>");
        continue;
      }
      if ((m = l.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*$/))) {
        out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
        i++;
        continue;
      }
      if (isHr(l)) { out.push("<hr>"); i++; continue; }
      if (/^\s*>/.test(l)) {
        const b = [];
        while (i < L.length && /^\s*>/.test(L[i])) b.push(L[i++].replace(/^\s*>\s?/, ""));
        out.push("<blockquote>" + block(b.join("\n")) + "</blockquote>");
        continue;
      }
      if (isItem(l)) {
        const base = indent(l);
        const ordered = /^\s*\d/.test(l);
        const start = ordered ? parseInt(l.trim(), 10) : 1;
        const items = [];
        while (i < L.length) {
          const c = L[i];
          if (!c.trim()) {
            let j = i;
            while (j < L.length && !L[j].trim()) j++;
            if (j < L.length && indent(L[j]) > base) { items[items.length - 1].sub.push(""); i++; continue; }
            break;
          }
          if (isItem(c) && indent(c) <= base + 1) {
            if (/^\s*\d/.test(c) !== ordered) break;
            items.push({ t: c.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ""), sub: [] });
            i++;
            continue;
          }
          if (indent(c) > base) { items[items.length - 1].sub.push(c); i++; continue; }
          if (isBlock(c)) break;
          items[items.length - 1].t += " " + c.trim();
          i++;
        }
        const html = items.map((it) => {
          const real = it.sub.filter((x) => x.trim());
          if (!real.length) return "<li>" + inline(it.t) + "</li>";
          const cut = Math.min(...real.map(indent));
          return "<li>" + inline(it.t) + block(it.sub.map((x) => x.slice(cut)).join("\n")) + "</li>";
        }).join("");
        out.push(ordered ? `<ol start="${start || 1}">${html}</ol>` : `<ul>${html}</ul>`);
        continue;
      }
      const align = tableAt(L, i);
      if (align) {
        const head = cells(L[i]);
        const rows = [];
        i += 2;
        while (i < L.length && L[i].trim() && L[i].includes("|") && !isBlock(L[i])) rows.push(cells(L[i++]));
        out.push(table(head, rows, align));
        continue;
      }
      const p = [];
      // 段落后面紧跟着表格（中间没空行）时，段落到表头前为止
      do { p.push(inline(L[i].trim())); i++; } while (i < L.length && L[i].trim() && !isBlock(L[i]) && !tableAt(L, i));
      out.push("<p>" + p.join("<br>") + "</p>");
    }
    return out.join("\n");
  }

  // noteAssets：笔记里 note-asset:// 图片对应的数据（原站笔记格式）
  XTD.md = function (src, noteAssets) {
    assets = noteAssets || {};
    return block(src);
  };
})();
