(async () => {
  const assetVersion = '20260827-39';
  const app = document.getElementById('rsdbApp');
  const fragments = [
    'ui/app-shell.html',
    'ui/editing-dialogs.html',
    'ui/settings-dialogs.html',
  ];
  const scripts = [
    'rsdb.js',
    'js/remote-input-method.js',
    'js/core-state.js',
	'js/keyboard-appearance.js',
    'js/ui-events.js',
    'js/table-editing.js',
    'js/keyboard-input.js',
    'js/files-images.js',
    'js/startup.js',
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const separator = src.includes('?') ? '&' : '?';
      script.src = `${src}${separator}v=${assetVersion}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`无法加载脚本：${src}`));
      document.body.appendChild(script);
    });
  }

  try {
    const responses = await Promise.all(fragments.map(async src => {
      const response = await fetch(`${src}?v=${assetVersion}`);
      if (!response.ok) throw new Error(`无法加载界面：${src} (${response.status})`);
      return response.text();
    }));

    const fragment = document.createDocumentFragment();
    responses.forEach(html => {
      const template = document.createElement('template');
      template.innerHTML = html;
      fragment.appendChild(template.content);
    });
    app.replaceWith(fragment);

    for (const src of scripts) await loadScript(src);
  } catch (error) {
    console.error('RSDB 启动失败', error);
    const status = document.querySelector('.rsdb-boot-status') || app;
    if (status) {
      status.removeAttribute('aria-busy');
      status.textContent = `页面加载失败：${error.message}`;
      status.classList.add('rsdb-boot-error');
    }
  }
})();
