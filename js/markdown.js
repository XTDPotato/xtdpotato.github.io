(() => {
  function formatInline(text) {
    let out = text ?? "";
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
    out = out.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank">$1</a>'
    );
    return out;
  }

  function renderMarkdown(md) {
    if (!md) return "";
    const lines = md.split(/\r?\n/);
    let html = "";

    let inCode = false, codeLang = "", codeBuffer = [];
    let listMode = null;
    let paragraph = [];
    let inQuote = false, quoteBuffer = [];

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
      if (inCode) {
        const lang = codeLang ? ` class="language-${codeLang}"` : "";
        const code = codeBuffer.join("\n");
        html += `<pre><code${lang}>${code}</code></pre>`;
        codeBuffer = []; inCode = false;
      }
    };
    const flushQuote = () => {
      if (inQuote) {
        html += `<blockquote style="margin:12px 0; padding:8px 12px; border-left:3px solid #ccc; background:#444444; border-radius:4px;">${formatInline(quoteBuffer.join("<br>"))}</blockquote>`;
        quoteBuffer = []; inQuote = false;
      }
    };

    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith("```")) {
        flushPara(); flushList(); flushQuote();
        inCode ? flushCode() : (inCode = true, codeLang = t.slice(3).trim());
        continue;
      }
      if (inCode) { codeBuffer.push(line); continue; }

      if (t === "---") {
        flushPara(); flushList(); flushCode(); flushQuote();
        html += "<mdui-divider></mdui-divider>";
        continue;
      }

      if (!t) {
        flushPara(); flushList(); flushQuote(); continue;
      }

      const h = t.match(/^(#{1,6}) (.*)/);
      if (h) {
        flushPara(); flushList(); flushQuote();
        html += `<h${h[1].length}>${formatInline(h[2])}</h${h[1].length}>`;
        continue;
      }

      const q = line.match(/^> ?(.*)/);
      if (q) {
        flushPara(); flushList();
        inQuote = true;
        quoteBuffer.push(q[1]);
        continue;
      }

      const ul = t.match(/^[-*+] (.*)/);
      const ol = t.match(/^\d+\. (.*)/);
      if (ul || ol) {
        flushPara(); flushQuote();
        const m = ul ? "ul" : "ol";
        if (listMode !== m) { flushList(); listMode = m; html += `<${m}>`; }
        html += `<li>${formatInline(ul ? ul[1] : ol[1])}</li>`;
        continue;
      }

      if (/^<[a-z]/i.test(t)) {
        flushPara(); flushList(); flushQuote();
        html += line;
        continue;
      }

      paragraph.push(line);
    }

    flushPara(); flushList(); flushCode(); flushQuote();

    setTimeout(() => {
      const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
      if (scripts) {
        scripts.forEach(s => {
          const div = document.createElement("div");
          div.innerHTML = s;
          const script = div.querySelector("script");
          if (script) {
            const newScript = document.createElement("script");
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
          }
        });
      }
    }, 0);

    return html;
  }

  window.XTDMarkdown = { formatInline, renderMarkdown };
})();