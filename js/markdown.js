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
    // 严格解析顺序：行内代码 > 图片 > 链接 > 加粗 > 删除线
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
    out = out.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    return out;
  }

  function renderMarkdown(md) {
    const safe = escapeHtml(md ?? "");
    const lines = safe.split(/\r?\n/);
    let html = "";
    
    // 状态管理
    let inCode = false;
    let codeLang = "";
    let codeBuffer = [];
    let listMode = null;
    let paragraph = [];
    let inBlockquote = false;
    let blockquoteBuffer = [];

    // 刷新函数
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
      const langClass = codeLang ? ` class="language-${codeLang}"` : "";
      const code = codeBuffer.join("\n");
      html += `<pre><code${langClass}>${code}</code></pre>`;
      codeBuffer = [];
      codeLang = "";
      inCode = false;
    };

    const flushBlockquote = () => {
      if (!inBlockquote) return;
      const text = formatInline(blockquoteBuffer.join("<br>"));
      html += `<blockquote>${text}</blockquote>`;
      blockquoteBuffer = [];
      inBlockquote = false;
    };

    // 逐行解析
    for (const line of lines) {
      const trimmed = line.trim();

      // --- 分割线 (优先级最高)
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        flushParagraph();
        flushList();
        flushCode();
        flushBlockquote();
        html += "<mdui-divider></mdui-divider>";
        continue;
      }

      // 代码块 ``` (支持 ```javascript 带语言格式)
      if (trimmed.startsWith("```")) {
        flushParagraph();
        flushList();
        flushBlockquote();
        
        if (!inCode) {
          inCode = true;
          // 提取语言标识
          const langMatch = trimmed.match(/^```(\w*)/);
          codeLang = langMatch ? langMatch[1] : "";
        } else {
          flushCode();
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(line);
        continue;
      }

      // 空行
      if (!trimmed) {
        flushParagraph();
        flushList();
        flushBlockquote();
        continue;
      }

      // 标题 # ## ###
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        flushBlockquote();
        const level = headingMatch[1].length;
        html += `<h${level}>${formatInline(headingMatch[2])}</h${level}>`;
        continue;
      }

      // 引用块 > (支持多行连续引用)
      const quoteMatch = line.match(/^>\s*(.*)$/);
      if (quoteMatch) {
        flushParagraph();
        flushList();
        inBlockquote = true;
        blockquoteBuffer.push(quoteMatch[1]);
        continue;
      }

      // 无序列表 - * +
      const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      // 有序列表 1.
      const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      
      if (ulMatch || olMatch) {
        flushParagraph();
        flushBlockquote();
        
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

      // 普通段落
      paragraph.push(trimmed);
    }

    // 结束时刷新所有剩余内容
    flushParagraph();
    flushList();
    flushCode();
    flushBlockquote();

    return html;
  }

  window.XTDMarkdown = {
    escapeHtml,
    formatInline,
    renderMarkdown,
  };
})();