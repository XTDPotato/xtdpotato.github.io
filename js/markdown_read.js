/**
 * 加载并解析外部 Markdown 文件
 * @param {string} filePath - .md 文件的路径
 * @returns {Promise<string>} 解析后的 HTML
 */
async function loadAndRenderMarkdown(filePath) {
  try {
    // 1.  fetch 加载文件
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`无法加载文件: ${response.statusText}`);
    }

    // 2. 获取文本内容
    const mdText = await response.text();

    // 3. 调用你的解析器
    return XTDMarkdown.renderMarkdown(mdText);

  } catch (error) {
    console.error("加载 MD 文件失败:", error);
    return `<p style="color:red;">加载教程失败，请检查网络或文件路径。</p>`;
  }
}