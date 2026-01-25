(() => {
  function escapeHtml(str) {
    return (str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatInline(text) {
    let out = text ?? "";
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
    out = out.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    return out;
  }

  function renderMarkdown(md) {
    const safe = escapeHtml(md ?? "");
    const lines = safe.split(/\r?\n/);
    let html = "";
    let inCode = false;
    let codeBuffer = [];
    let listMode = null;
    let paragraph = [];

    const flushParagraph = () => {
      if (paragraph.length === 0) return;
      const text = formatInline(paragraph.join("<br>"));
      html += `<p>${text}</p>`;
      paragraph = [];
    };

    const flushList = () => {
      if (!listMode) return;
      html += listMode === "ul" ? "</ul>" : "</ol>";
      listMode = null;
    };

    const flushCode = () => {
      if (!inCode) return;
      const code = codeBuffer.join("\n");
      html += `<pre><code>${code}</code></pre>`;
      codeBuffer = [];
      inCode = false;
    };

    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        flushParagraph();
        flushList();
        if (!inCode) {
          inCode = true;
        } else {
          flushCode();
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(line);
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        flushList();
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        const level = headingMatch[1].length;
        html += `<h${level}>${formatInline(headingMatch[2])}</h${level}>`;
        continue;
      }

      const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (ulMatch || olMatch) {
        flushParagraph();
        const nextMode = ulMatch ? "ul" : "ol";
        if (!listMode) {
          listMode = nextMode;
          html += nextMode === "ul" ? "<ul>" : "<ol>";
        } else if (listMode !== nextMode) {
          flushList();
          listMode = nextMode;
          html += nextMode === "ul" ? "<ul>" : "<ol>";
        }
        const itemText = formatInline((ulMatch ? ulMatch[1] : olMatch[1]) ?? "");
        html += `<li>${itemText}</li>`;
        continue;
      }

      paragraph.push(trimmed);
    }

    flushParagraph();
    flushList();
    flushCode();

    return html;
  }

  window.XTDMarkdown = {
    escapeHtml,
    formatInline,
    renderMarkdown,
  };
})();
