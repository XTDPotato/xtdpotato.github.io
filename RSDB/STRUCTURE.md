# RSDB 文件结构

`index.html` 现在只负责声明外部依赖、样式和启动器。页面启动顺序由 `js/bootstrap.js` 管理：先装入全部界面片段，再按顺序加载业务脚本，最后执行 `js/startup.js`。

## 界面

- `ui/app-shell.html`：抽屉、顶部操作栏、搜索、表格和基础页面框架。
- `ui/editing-dialogs.html`：数据编辑、快速编辑、计算、排序、导入确认和历史记录界面。
- `ui/settings-dialogs.html`：设置、主题、文档、词库、键盘可视化和变量编辑界面。

## 脚本

- `js/bootstrap.js`：装入界面片段并顺序加载应用脚本。
- `js/core-state.js`：全局状态、设置、主题、单元格格式和通用工具函数。
- `js/ui-events.js`：主要控件事件、搜索、菜单、设置和文档交互。
- `js/table-editing.js`：表格渲染、单元格编辑、编辑历史和输入法候选逻辑。
- `js/keyboard-input.js`：虚拟键盘、键盘配置和输入导航。
- `js/files-images.js`：文件导入导出、重量计算和图片处理/预览。
- `js/startup.js`：快捷工具栏拖动和应用最终初始化。
- `input-method-library.js`：独立的拼音、双拼和英文词库查询库。
- `input-method-data.js`：离线输入法数据。
- `rsdb.js`：主题通信桥接。

## 样式

- `styles/rsdb-main.css`：原页面主样式。
- `rsdb.css`：后续补充的 Material 3、弹窗、编辑和响应式样式。

业务脚本使用有序的经典脚本加载，以兼容现有跨文件共享状态。新增文件时应同时更新 `js/bootstrap.js` 的加载顺序和 `sw.js` 的离线缓存清单。
