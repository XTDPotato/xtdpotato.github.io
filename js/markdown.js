(() => {
  function formatInline(text) {
    let out = text ?? "";
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    out = out.replace(/\+\+([^+\n]+)\+\+/g, "<u>$1</u>");
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
    out = out.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank">$1</a>'
    );
    return out;
  }

  function renderMarkdown(md) {
    if (!md) return "";
    const lines = String(md).split(/\r?\n/);
    let html = "";
    let inCode = false, codeLang = "", codeBuffer = [];
    let listMode = null;
    let paragraph = [];
    let inQuote = false, quoteBuffer = [];
    let htmlBlock = null, htmlRootTag = null, htmlDepth = 0;

    const escapeAttr = (value) => String(value).replace(/&/g, "&#38;").replace(/"/g, "&#34;");
    const flushPara = () => {
      if (paragraph.length) {
        html += `<p>${formatInline(paragraph.join("<br>"))}</p>`;
        paragraph = [];
      }
    };
    const flushList = () => {
      if (listMode) { html += `</${listMode}>`; listMode = null; }
    };
    const flushCode = () => {
      if (!inCode) return;
      const lang = codeLang ? ` class="language-${codeLang}"` : "";
      html += `<pre><code${lang}>${codeBuffer.join("\n")}</code></pre>`;
      codeBuffer = []; inCode = false;
    };
    const flushQuote = () => {
      if (!inQuote) return;
      html += `<blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #ccc;border-radius:4px">${formatInline(quoteBuffer.join("<br>"))}</blockquote>`;
      quoteBuffer = []; inQuote = false;
    };
    const flushHtml = () => {
      if (htmlBlock === null) return;
      const source = htmlBlock.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
      html += source;
      htmlBlock = null; htmlRootTag = null; htmlDepth = 0;
    };

    for (const line of lines) {
      const t = line.trim();
      if (htmlBlock !== null) {
        htmlBlock += `${line}\n`;
        const opens = (line.match(new RegExp(`<${htmlRootTag}(?:\\s|>)`, "gi")) || []).length;
        const closes = (line.match(new RegExp(`</${htmlRootTag}\\s*>`, "gi")) || []).length;
        htmlDepth += opens - closes;
        if (htmlDepth <= 0) flushHtml();
        continue;
      }
      const htmlStart = t.match(/^<([a-z][\w:-]*)(?:\s|>)/i);
      if (!inCode && htmlStart && !t.startsWith("<!--")) {
        flushPara(); flushList(); flushQuote();
        htmlRootTag = htmlStart[1]; htmlBlock = `${line}\n`;
        const opens = (line.match(new RegExp(`<${htmlRootTag}(?:\\s|>)`, "gi")) || []).length;
        const closes = (line.match(new RegExp(`</${htmlRootTag}\\s*>`, "gi")) || []).length;
        htmlDepth = opens - closes;
        if (/\/\s*>$/.test(t) || htmlDepth <= 0) flushHtml();
        continue;
      }
      if (t.startsWith("```")) {
        flushPara(); flushList(); flushQuote();
        inCode ? flushCode() : (inCode = true, codeLang = t.slice(3).trim());
        continue;
      }
      if (inCode) { codeBuffer.push(line); continue; }
      if (t === "---") {
        flushPara(); flushList(); flushQuote(); html += "<mdui-divider></mdui-divider>"; continue;
      }
      if (!t) { flushPara(); flushList(); flushQuote(); continue; }
      const h = t.match(/^(#{1,6}) (.*)/);
      if (h) {
        flushPara(); flushList(); flushQuote(); html += `<h${h[1].length}>${formatInline(h[2])}</h${h[1].length}>`; continue;
      }
      const q = line.match(/^> ?(.*)/);
      if (q) { flushPara(); flushList(); inQuote = true; quoteBuffer.push(q[1]); continue; }
      const ul = t.match(/^[-*+] (.*)/);
      const ol = t.match(/^\d+\. (.*)/);
      if (ul || ol) {
        flushPara(); flushQuote();
        const nextList = ul ? "ul" : "ol";
        if (listMode !== nextList) { flushList(); listMode = nextList; html += `<${nextList}>`; }
        html += `<li>${formatInline(ul ? ul[1] : ol[1])}</li>`;
        continue;
      }
      paragraph.push(line);
    }

    flushPara(); flushList(); flushCode(); flushQuote(); flushHtml();
    return html;
  }

  window.XTDMarkdown = { formatInline, renderMarkdown };
})();