		const PRIMARY_KEY = "xtd_theme_primary";
		const CONTROL_COLOR_KEY = "xtd_theme_control";
		const HIGHLIGHT_COLOR_KEY = "xtd_theme_highlight";
		const CUSTOM_THEME_COLOR_KEY = "xtd_theme_custom_colors";
		const LEGACY_CUSTOM_THEME_COLOR_KEY = "xtd_theme_custom";
		const DEFAULT_THEME_COLORS = { primary: '#7e57c2', control: '#7e57c2', highlight: '#ffca28' };
		const THEME_COLOR_PRESETS = ['#ef5350','#ec407a','#ab47bc','#7e57c2','#5c6bc0','#42a5f5','#26c6da','#26a69a','#66bb6a','#d4e157','#ffca28','#ffa726'];
		let primaryThemeDraft = { ...DEFAULT_THEME_COLORS };
		let primaryThemeOriginal = { ...DEFAULT_THEME_COLORS };
		let primaryPickerHue = 260;
		let primaryPickerSaturation = 0.55;
		let primaryPickerValue = 0.76;
		let pendingPrimaryCustomColorIndex = null;
		let primaryCustomColorCommitted = true;
		const themeFlash = document.getElementById("themeFlash");
		const RSDB_VERSION = '2026.08.27';
		const RSDB_CHANGELOG = [
		    {
		        version: '2026.08.27',
		        notes: [
		            '项目结构：拆分原先接近 1MB 的单体 index.html，界面、样式与业务函数改为按职责加载的独立文件，便于后续维护和故障定位',
		            '对话框层级：新增统一顶层管理，新打开的主题色、字体、对齐、选色、文件确认和设置子对话框始终显示在旧对话框之上，关闭后可继续操作原对话框',
		            '编辑属性：移除依赖定时的对话框恢复逻辑，修复选色返回或鼠标经过顶部撤销/关闭区域后白屏、遮罩残留和按钮失效的问题',
		            '输入法界面：中英文、拼音、分词移入可拖动快捷工具栏；拼音/英文输入与待选词改为上下两层显示',
		            '候选翻页：桌面鼠标位于虚拟键盘内时可用滚轮上下翻页，候选切换加入方向动画，翻页按钮保持固定',
		            '快捷工具栏：晃动循环的加号精简布局与输入导航布局已更新，导航布局包含上一个、下一个、中英文、拼音和分词',
		            '快捷短语：每次打开或根据输入内容重新筛选时，短语按顺序逐个出现，不再同一时刻挤出',
		            '虚拟键盘：延迟滚动前固定并校验目标编辑框，修复快速关闭或切换窗口时访问已失效编辑框的异常',
		            '快速编辑：修复触屏点击字体和水平对齐选择器时，对话框打开后被同一次触摸误关闭的问题',
		            '快捷工具栏：统一显隐规则，虚拟键盘或桌面快捷短语面板显示时始终显示工具栏，两者关闭后才隐藏',
		            '图片预览编辑：修复顶部编辑框在虚拟键盘和系统键盘模式下点击文字无法移动光标的问题，短按位置现在会被准确转换为文本选区',
		            '输入法：单字母拼音只显示对应的单个汉字，不再误判为简拼或双拼；英文候选始终将当前输入原文放在第一位',
		            '操作指南：修复图标字体未加载时显示英文图标名称的问题，改为不依赖字体文件的内置勾选图标',
		            '删除数据：删除全部和删除单行均接入统一撤销记录；单行删除改为全屏 Material 3 确认界面并完整展示当前行数据',
		            '虚拟光标：修复多行编辑框仍按单行计算的问题，支持自动换行、显式换行、滚动偏移、点击定位和跨行拖动',
		            '数据排序：重新设计为全屏 Material 3 界面，支持清晰的规则优先级、升降序分段选择、规则上移下移、删除及恢复默认',
		            '智能拼音：全拼、首字母简拼、小鹤双拼和自然码双拼合并为一个“拼音”模式，不再要求手动切换方案',
		            "自动分音：输入 shuangp 显示为 shuang'p，输入 rgs 显示为 r'g's；候选仍按完整原始拼音智能匹配",
		            '智能纠错：拼音加入动态规划分音和一处漏字、错字、邻位字母交换纠错；英文加入基于词频的拼写纠错及无空格连写分词，原始输入仍固定在首位',
		            "手动分词：候选栏新增“分词”键，可插入 ' 明确多个音节边界，例如 li'ru",
		            '英文词库：高频排序词表与 GitHub 完整英文单词表离线合并，完整表使用二分前缀查询，避免大词库逐项扫描',
		            '中文词库：修复 Unicode 码位解码，合并常用词、IT 网络词、成语及 RSDB 本地新词，并保留用户词频学习排序',
		            '输入习惯：单字母拼音也显示候选，并根据个人使用次数和最近使用时间优先显示常用词语',
		            '拼音匹配：补充裸元音和长显式分词的候选回退，修复输入 fanshu 时“番薯”无法出现或长组合候选栏变空的问题',
		            '虚拟键盘：清空键改为中英文切换；候选区支持横向滚动且翻页按钮固定在右侧',
		            '虚拟键盘：退格键上滑松开可清空当前编辑框，超过 50 个字符时先显示 Material 3 确认提示',
		            '输入法：候选字数严格匹配拼音分段，残缺声母分段也会逐段补全；英文候选同步单次大写和大写锁定状态',
		            '输入法：锁定大写改为普通直接输入，不再显示英文词库；有待确认候选时下一个键显示回车，无候选时恢复下一个或完成',
		            '词库管理：设置新增系统词库分页搜索和个人词库管理，个人使用习惯支持独立导入、导出及配置 XML 可选导出',
		            '网络词库：中文大型词组、英文高频词表和完整英文词典改为按需从 CDN 调用，在 Web Worker 内查询且仅保留于当前页面内存，断网时自动使用本地基础词库',
		            '词库缓存：大型词库进入页面后只初始化一次，完整索引保存到 IndexedDB，Cookie 记录缓存版本与来源，下次进入直接读取本地缓存',
		            '词库来源：新增镜像优先自动回退、Gcore、Fastly、jsDelivr、GitHub 原地址及自定义地址，切换来源后自动重新初始化',
		            '词库分页：系统词库显示当前页与准确总页数，搜索时明确标注本页条数，不再把每页 30 条误显示为分页总量',
		            '输入修复：桌面/系统键盘输入会实时过滤快捷短语，符号键盘保留原字段词库，快捷短语点击始终写入当前编辑框；编辑数据图片预览改在对话框焦点域内运行，系统键盘保留原生光标定位，系统与虚拟键盘均可选中和输入',
		            '图片预览：点击顶部栏可打开可拖动、可缩小的项目资料悬浮窗，字段内容会随当前项目切换，标题与内容字号可独立调节',
		            '图片预览悬浮窗：收紧默认尺寸，新增背景透明度，并支持拖动四边与四角调整宽高',
		            '下拉菜单：图片预览更多菜单和数据排序字段选择器限制在可视区域内，项目过多时可滚动到最后一项',
		            '文件命名：导出窗口顶部可编辑 Excel/ZIP 文件名；首次保存、另存为和无名称导出默认使用当天年月日',
		            '另存为：检测到同名表格时可选择覆盖、复制新的或取消；复制新的会自动添加递增编号',
		            '快捷工具栏：设置新增晃动切换开关、晃动幅度、布局动画和最多 10 个可排序/删除/多选编辑的布局'
		        ],
		        sources: [
		            { name: '中文单字拼音：mozillazg/pinyin-data v0.15.0', license: 'MIT', url: 'https://github.com/mozillazg/pinyin-data' },
		            { name: '中文词组拼音：mozillazg/phrase-pinyin-data v0.19.0', license: 'MIT', url: 'https://github.com/mozillazg/phrase-pinyin-data' },
		            { name: '中文常用词及词频：fxsjy/jieba dict.txt', license: 'MIT', url: 'https://github.com/fxsjy/jieba' },
		            { name: 'IT 网络词与成语：thunlp/THUOCL', license: 'MIT', url: 'https://github.com/thunlp/THUOCL' },
		            { name: '英文高频排序：aparrish/wordfreq-en-25000', license: 'CC BY-SA 4.0 数据', url: 'https://github.com/aparrish/wordfreq-en-25000' },
		            { name: '完整英文词典：dwyl/english-words words_alpha.txt，提交 8179fe6（2025-01-05）', license: 'Unlicense', url: 'https://github.com/dwyl/english-words' },
		            { name: '会话网络中文词库：mozillazg/phrase-pinyin-data large_pinyin.txt', license: 'MIT', url: 'https://github.com/mozillazg/phrase-pinyin-data' },
		            { name: '会话网络英文频率：hermitdave/FrequencyWords en_50k.txt', license: 'CC BY-SA 4.0 数据', url: 'https://github.com/hermitdave/FrequencyWords' },
		            { name: '会话网络完整英文词典：dwyl/english-words words_alpha.txt', license: 'Unlicense', url: 'https://github.com/dwyl/english-words' },
		            { name: '拼音动态切分算法参考：pepebecker/pinyin-split', license: 'ISC', url: 'https://github.com/pepebecker/pinyin-split' },
		            { name: '英文纠错与连写分词算法参考：wolfgarbe/SymSpell', license: 'MIT', url: 'https://github.com/wolfgarbe/SymSpell' },
		            { name: 'RSDB 智能拼音、双拼与英文前缀查询源码', license: '项目内源码', url: 'input-method-library.js' },
		            { name: 'RSDB 本地网络词与领域词', license: '项目内词表', url: 'tools/network-words.txt' }
		        ]
		    },
		    {
		        version: '2026.08.23',
		        notes: [
		            '桌面模式：桌面端默认使用系统键盘，可在设置中关闭；快捷短语显示在底部',
		            '快捷短语：工具栏可拖动到屏幕内任意位置，关闭编辑框或键盘后自动隐藏',
		            '对话框：关闭快捷编辑、编辑数据或重量计算时同步关闭虚拟键盘',
		            '维护状态：当前网页已永久停止功能更新，仅进行 Bug 修复与必要的兼容性维护'
		        ]
		    },
		    {
		        version: '2026.08.12',
		        notes: [
		            '图片：统一拍照、相册、删除与预览索引状态，支持连续替换',
		            '单元格：右上角保存/取消，字体选择与本地字体导入，预览和导出保持一致',
		            '表格：搜索结果整行高亮，缩放时保持表头冻结',
		            '虚拟键盘：工具栏默认置顶，特殊键符号统一，快捷短语增加过渡动画',
		            '设置：新增 inputStats 记录开关，操作指南升级为可视化级别',
		            '制作方式更新为 vibe coding，模型更新为 GPT5.6Sol'
		        ]
		    },
		    {
		        version: '2026.07.30',
		        notes: [
		            '数据列表：减少重复渲染与整库写入，搜索改为防抖处理',
		            '行移动：合并为单一按钮，支持多选项目并移动到目标上方或下方',
		            '单元格：点击即可编辑内容和 Excel 基本格式，导入导出保留格式',
		            '图片：修复重复选择、拍照、相册和删除；预览切换可保留缩放位置',
		            '交互：修复 Snackbar 右滑、FAB 连续拖动、键盘滑动误输入和光标水滴显示',
		            '设置：新增搜索、更多显示选项以及可选配置导出'
		        ]
		    },
		    {
		        version: '2026.04.24',
		        notes: [
		            '设置 → 关于 & 操作指南：更新为最新说明版本',
		            '制作信息更新为 GPT5.5 Codex，并移除 Trae 标识'
		        ]
		    },
		    {
		        version: '2026.02.04',
		        notes: [
		            '快捷短语：右上角新增 + / 编辑，支持拖动排序',
		            '设置：快捷短语行数支持按字段自定义；对话框位置支持多选',
		            '图片：大图压缩策略、可选限制宽高；导出支持 Excel 含图 / ZIP 外放图片'
		        ]
		    },
		    {
		        version: '2026.01.25',
		        notes: [
		            '编辑与多选：搜索/替换/多选删除等功能完善',
		            '虚拟键盘：光标与滚动体验修复'
		        ]
		    }
		];
		let tableData = [];              
		let currentInput = null;         
		let keyboardState = JSON.parse(localStorage.getItem('keyboardState')) || {
		    shiftState: 'locked-on',     
		    inputType: 'text'            
		};
		keyboardState.imeLanguage = ['chinese', 'english', 'none'].includes(keyboardState.imeLanguage)
            ? keyboardState.imeLanguage : 'english';
		keyboardState.pinyinScheme = 'smart';
        keyboardState.englishWordMode = keyboardState.englishWordMode !== false;
		const imeState = {
		    composition: '',
		    compositionCaret: 0,
		    compositionEditing: false,
		    candidates: [],
            candidateSegmentCounts: [],
		    page: 0,
		    pageSize: 8,
		    input: null,
		    englishCandidatesDismissed: false,
		    englishTypedCount: 0
		};
		const IME_LEARNING_KEY = 'rsdb_ime_learning_v1';
		let imeLearningState = null;
		let imeLearningSaveTimer = null;
		const APP_SETTINGS_KEY = 'rsdb_app_settings_v1';
		const INPUT_STATS_KEY = 'rsdb_input_stats_v1';
		const DYNAMIC_VAR_STATE_KEY = 'rsdb_dynamic_variable_state_v1';
		let dynamicVariableState = loadDynamicVariableState();
		function detectDesktopEnvironment() {
		    const ua = String(navigator.userAgent || '').toLowerCase();
		    const mobileUa = /android|iphone|ipad|ipod|windows phone|mobile/.test(ua);
		    const finePointer = window.matchMedia?.('(pointer: fine) and (hover: hover)')?.matches;
		    return !mobileUa && (finePointer || (navigator.maxTouchPoints || 0) === 0);
		}
		const DEFAULT_APP_SETTINGS = {
		    shortcutRows: 2,
		    shortcutRowsByField: {},
		    keyboardModeByField: {},
		    desktopModeEnabled: detectDesktopEnvironment(),
		    shortcutWrap: false,
		    shortcutAutoCompleteEnabled: true,
		    shortcutAutoCompleteByField: {},
		    shortcutAddPosition: 'first',
		    shortcutRankByClicks: false,
		    toolbarShakeEnabled: true,
		    toolbarShakeAmplitude: 50,
		    toolbarShakeAmplitudeUnit: 'percent',
		    shortcutFontSize: 16,
		    shortcutChipScale: 100,
		    toolbarScale: 100,
		    toolbarShakeAnimation: true,
		    toolbarShakeEffect: 'confetti',
		    toolbarShakeEffectDuration: 5000,
		    toolbarShakeEffectHtml: '<div id="effect-root"></div>',
		    toolbarShakeEffectCss: '',
		    toolbarShakeEffectJs: '',
		    toolbarShakeLayouts: [
		        { id: 'full', name: '完整工具栏', controls: ['add', 'edit', 'previous', 'next', 'language', 'scheme', 'separator', 'close'] },
		        { id: 'navigation', name: '输入导航', controls: ['previous', 'next', 'language', 'scheme', 'separator'] },
		        { id: 'add', name: '加号', controls: ['add'] }
		    ],
		    suggestEnabled: true,
		    suggestThreshold: 5,
		    imageCompressPolicy: 'ask',
		    imageCompressUseMaxWidth: true,
		    imageCompressUseMaxHeight: true,
		    largeImageThresholdMB: 5,
		    imageCompressMaxWidth: 1280,
		    imageCompressMaxHeight: 1280,
		    imageCompressQuality: 0.8,
		    imagePreviewKeepTransform: true,
		    imagePreviewBackground: 'black',
		    imagePreviewViewMode: 'normal',
		    imagePreviewInfoTitleFontSize: 18,
		    imagePreviewInfoFontSize: 14,
		    imagePreviewInfoOpacity: 94,
		    imagePreviewInfoWidth: 360,
		    imagePreviewInfoHeight: 400,
		    snackbarPlacement: 'bottom-center',
            snackbarOffsetX: 0,
            snackbarOffsetY: -32,
		    snackbarDismissMode: 'swipe',
		    cursorHandleDuration: 2000,
		    animationsEnabled: true,
		    dialogPositions: ['center'],
		    virtualKeyboardHeight: null,
		    virtualKeyboardBottomOffset: 0,
		    keyboardPressEffect: 'material3',
		    keyboardSurfaceStyle: 'material3',
		    keyboardKeyShape: 'rounded',
		    keyboardKeyHeight: 42,
		    keyboardKeyGap: 0,
		    keyboardKeyRadius: 12,
		    keyboardKeyFontSize: 18,
		    keyboardSurfaceColor: '',
		    keyboardSurfaceColorDark: '',
		    keyboardKeyColor: '',
		    keyboardKeyColorDark: '',
		    keyboardSpecialKeyColor: '',
		    keyboardSpecialKeyColorDark: '',
		    keyboardKeyTextColor: '',
		    keyboardKeyTextColorDark: '',
		    keyboardRippleColor: '',
		    keyboardRippleColorDark: '',
		    keyboardRippleOpacity: 12,
		    keyboardPressGlowEnabled: false,
		    keyboardPressGlowColor: '',
		    keyboardPressGlowColorDark: '',
		    keyboardPressGlowOpacity: 42,
		    keyboardPressGlowSize: 62,
		    keyboardCustomStyleCss: '',
		    keyboardCustomEffectHtml: '',
		    keyboardCustomEffectCss: '',
		    keyboardCustomEffectJs: '',
		    historyStorageEnabled: true,
		    operationHistoryMaxCount: 8,
		    undoRedoEnabled: true,
		    undoRedoMaxSteps: 10,
            tableScaleDefault: 0.5,
            tableScaleCurrent: null,
            tableCellWidth: 80,
            tableCellHeight: 48,
            tableCellFontSize: 16,
            tablePageSize: 50,
            dataFormFieldGap: 8,
            dataFormPadding: 12,
            tableCellStyles: {},
		    inputStatsRecordingEnabled: true,
		    remoteDictionarySource: 'auto',
		    remoteDictionaryCustomSources: {
		        chinese: '',
		        englishFrequency: '',
		        englishComprehensive: ''
		    },
		    importedFonts: [],
		    searchMatchHighlightColor: '#F3E8C7',
		    searchRowHighlightColor: '#B08B2D',
		    searchCurrentBorderColor: '#00796B'
		};
		let appSettings = loadAppSettings();
		let currentDocumentName = localStorage.getItem('rsdb_current_document_name') || '';
		let pendingDocumentNameMode = 'save';
		let pendingDocumentRenameSource = '';
		let pendingDocumentConflictName = '';
		let pendingDocumentDeleteNames = [];
		let documentMultiSelectMode = false;
		const selectedDocumentNames = new Set();
		let quickEditHistory = {
		    past: [],
		    future: [],
		    last: null,
		    pendingBeforeInput: null,
		    composing: false,
		    compositionStart: null
		};
		let quickEditHistoryApplying = false;
		let dataEditHistory = { past: [], future: [], last: null, applying: false };
let dataEditStyleDraft = null;
		const DATA_EDIT_SESSION_KEY = 'rsdb_data_edit_session_v1';
		let dataEditSessionSaveTimer = null;
 		let dataCellStyleContext = null;
		let dataCellStyleDialogClosing = false;
		let inputStats = loadInputStats();
		let shortcutEditMode = false;
		let desktopShortcutPanelActive = false;
		let currentShortcutFieldKey = null;
		let shortcutDragState = null;
		let duplicateShortcutContext = null;
		let shortcutEditSession = null;
		let shortcutInlineAddState = null;
		let suppressVirtualKeyboard = false;   
		let imagePreviewEditState = null;
		let currentEditIndex = -1;       
		let isMultiSelectMode = false;   
		let selectedRows = new Set();    
		let isCellMultiSelectMode = false;
		let selectedCells = new Set();
		let cellSelectionAnchor = null;
		let cellSelectionPointer = null;
		let suppressNextCellClick = false;
		let cellSelectionLongPressTimer = null;
		let cellSelectionAutoScrollTimer = null;
		let activeCellColorTarget = null;
		let cellStylePickerReturnContext = null;
		const RECENT_CELL_COLORS_KEY = 'rsdb_recent_cell_colors';
		let moveRowDialogState = null;
		let selectedTheme = localStorage.getItem('theme') || 'auto';  
		let searchTerm = '';             
		let isSearchReplaceVisible = false;  
		let currentPage = 1;
		        let PAGE_SIZE = Math.max(10, Math.min(200, Number(appSettings.tablePageSize) || 50));
		        let totalPages = 1;

		let searchMatches = [];         
		let currentMatchIndex = -1;     
		let isSearchActive = false;     
		const searchableFields = [
		    'steelType', 'productId', 'cardId', 'furnaceId', 'actualDiameter', 
		    'diameter', 'length', 'weight', 'status', 'position', 'hardness', 'remarks'
		];
		const rowSearchCache = new WeakMap();
		function getNormalizedSearchValues(item) {
		    const valueForSearch = (field) => item?.__cellDisplayValues?.[field] !== undefined
		        ? item.__cellDisplayValues[field] : item?.[field];
		    const signature = searchableFields.map(field => String(valueForSearch(field) ?? '')).join('\u0001');
		    const cached = rowSearchCache.get(item);
		    if (cached?.signature === signature) return cached.values;
		    const values = searchableFields.map(field => String(valueForSearch(field) ?? '').toLowerCase());
		    rowSearchCache.set(item, { signature, values });
		    return values;
		}
		function getSearchFieldValue(item, field) {
		    return item?.__cellDisplayValues?.[field] !== undefined ? item.__cellDisplayValues[field] : item?.[field];
		}
		let duplicateCurrentPage = 1;
		        const DUPLICATE_PAGE_SIZE = 10;  
		        let duplicateTotalPages = 1;
		        let isFilterMatchRows = false;
                let deferredPrompt; // PWA install prompt  

		function loadAppSettings() {
		    try {
		        const raw = localStorage.getItem(APP_SETTINGS_KEY);
		        const parsed = raw ? JSON.parse(raw) : {};
		        const merged = { ...DEFAULT_APP_SETTINGS, ...(parsed || {}) };
		        if (!merged.dialogPositions) {
		            const legacy = merged.dialogPosition;
		            merged.dialogPositions = legacy === 'top' ? ['top'] : ['center'];
		        }
		    if (!merged.shortcutRowsByField || typeof merged.shortcutRowsByField !== 'object') {
		            merged.shortcutRowsByField = {};
		        }
		        if (!merged.keyboardModeByField || typeof merged.keyboardModeByField !== 'object') {
		            merged.keyboardModeByField = {};
		        }
		        Object.keys(merged.keyboardModeByField).forEach((key) => {
		            if (!['virtual', 'system'].includes(merged.keyboardModeByField[key])) delete merged.keyboardModeByField[key];
		        });
		        merged.desktopModeEnabled = merged.desktopModeEnabled === true;
		        if (merged.shortcutAutoCompleteEnabled === undefined) merged.shortcutAutoCompleteEnabled = true;
		        if (!merged.shortcutAutoCompleteByField || typeof merged.shortcutAutoCompleteByField !== 'object') {
		            merged.shortcutAutoCompleteByField = {};
		        }
                if (!merged.suggestEnabledByField || typeof merged.suggestEnabledByField !== 'object') {
                    merged.suggestEnabledByField = {};
                }
		        merged.shortcutAddPosition = merged.shortcutAddPosition === 'last' ? 'last' : 'first';
		        merged.shortcutRankByClicks = merged.shortcutRankByClicks === true;
		        merged.toolbarShakeEnabled = merged.toolbarShakeEnabled !== false;
		        merged.toolbarScale = Math.max(50, Math.min(150, Math.round(Number(merged.toolbarScale) || 100)));
		        merged.toolbarShakeAnimation = merged.toolbarShakeAnimation !== false;
		        merged.toolbarShakeEffect = ['confetti', 'custom', 'none'].includes(merged.toolbarShakeEffect) ? merged.toolbarShakeEffect : 'confetti';
		        merged.toolbarShakeEffectDuration = Math.max(300, Math.min(20000, Math.round(Number(merged.toolbarShakeEffectDuration) || 5000)));
		        merged.toolbarShakeEffectHtml = String(merged.toolbarShakeEffectHtml || '<div id="effect-root"></div>').slice(0, 50000);
		        merged.toolbarShakeEffectCss = String(merged.toolbarShakeEffectCss || '').slice(0, 50000);
		        merged.toolbarShakeEffectJs = String(merged.toolbarShakeEffectJs || '').slice(0, 50000);
		        {
		            const amp = Number(merged.toolbarShakeAmplitude);
		            const isPercent = merged.toolbarShakeAmplitudeUnit === 'percent';
		            const migrated = Number.isFinite(amp) ? (isPercent ? amp : (amp <= 80 ? Math.round(100 - amp * 1.2) : amp)) : 50;
		            merged.toolbarShakeAmplitude = Math.max(10, Math.min(100, migrated));
		            merged.toolbarShakeAmplitudeUnit = 'percent';
		        }
		        merged.shortcutFontSize = Math.max(12, Math.min(28, Math.round(Number(merged.shortcutFontSize) || 16)));
		        merged.shortcutChipScale = Math.max(70, Math.min(160, Math.round(Number(merged.shortcutChipScale) || 100)));
		        merged.toolbarShakeLayouts = normalizeToolbarShakeLayouts(merged.toolbarShakeLayouts);
		        if (merged.imageCompressUseMaxWidth === undefined) merged.imageCompressUseMaxWidth = true;
		        if (merged.imageCompressUseMaxHeight === undefined) merged.imageCompressUseMaxHeight = true;
		        const mb = Number(merged.largeImageThresholdMB);
		        merged.largeImageThresholdMB = Number.isFinite(mb) ? Math.max(0.5, Math.min(50, mb)) : 5;
		        const snackbarPlacements = ['bottom-left', 'bottom-center', 'bottom-right', 'top-left', 'top-center', 'top-right'];
                merged.snackbarPlacement = snackbarPlacements.includes(merged.snackbarPlacement) ? merged.snackbarPlacement : 'bottom-center';
                const snackbarOffsetX = Number(merged.snackbarOffsetX);
                const snackbarOffsetY = Number(merged.snackbarOffsetY);
                merged.snackbarOffsetX = Number.isFinite(snackbarOffsetX) ? Math.max(-2000, Math.min(2000, Math.round(snackbarOffsetX))) : 0;
                merged.snackbarOffsetY = Number.isFinite(snackbarOffsetY) ? Math.max(-2000, Math.min(2000, Math.round(snackbarOffsetY))) : -32;
		        merged.snackbarDismissMode = merged.snackbarDismissMode === 'button' ? 'button' : 'swipe';
		        merged.imagePreviewKeepTransform = merged.imagePreviewKeepTransform !== false;
		        merged.imagePreviewBackground = ['black', 'gray', 'white'].includes(merged.imagePreviewBackground)
		            ? merged.imagePreviewBackground : 'black';
		        merged.imagePreviewViewMode = merged.imagePreviewViewMode === 'pixel' ? 'pixel' : 'normal';
		        {
		            const titleSize = Number(merged.imagePreviewInfoTitleFontSize);
		            const contentSize = Number(merged.imagePreviewInfoFontSize);
		            merged.imagePreviewInfoTitleFontSize = Number.isFinite(titleSize) ? Math.max(14, Math.min(32, Math.round(titleSize))) : 18;
		            merged.imagePreviewInfoFontSize = Number.isFinite(contentSize) ? Math.max(12, Math.min(28, Math.round(contentSize))) : 14;
		        }
		        {
		            const opacity = Number(merged.imagePreviewInfoOpacity);
		            const width = Number(merged.imagePreviewInfoWidth);
		            const height = Number(merged.imagePreviewInfoHeight);
		            merged.imagePreviewInfoOpacity = Number.isFinite(opacity) ? Math.max(30, Math.min(100, Math.round(opacity))) : 94;
		            merged.imagePreviewInfoWidth = Number.isFinite(width) ? Math.max(260, Math.min(900, Math.round(width))) : 360;
		            merged.imagePreviewInfoHeight = Number.isFinite(height) ? Math.max(220, Math.min(900, Math.round(height))) : 400;
		        }
		        {
		            const duration = Number(merged.cursorHandleDuration);
		            merged.cursorHandleDuration = Number.isFinite(duration) ? Math.max(0, Math.min(10000, Math.round(duration))) : 2000;
		        }
		        merged.animationsEnabled = merged.animationsEnabled !== false;
		        merged.keyboardPressEffect = ['material3', 'bounce', 'custom'].includes(merged.keyboardPressEffect)
		            ? merged.keyboardPressEffect : 'material3';
		        merged.keyboardSurfaceStyle = ['material3', 'flat'].includes(merged.keyboardSurfaceStyle)
		            ? merged.keyboardSurfaceStyle : 'material3';
		        merged.keyboardKeyShape = ['rounded', 'pill', 'square'].includes(merged.keyboardKeyShape)
		            ? merged.keyboardKeyShape : 'rounded';
		        merged.keyboardKeyHeight = Math.max(32, Math.min(72, Math.round(Number(merged.keyboardKeyHeight) || 42)));
		        merged.keyboardKeyGap = Math.max(0, Math.min(12, Math.round(Number(merged.keyboardKeyGap) || 0)));
		        merged.keyboardKeyRadius = Math.max(0, Math.min(28, Math.round(Number(merged.keyboardKeyRadius) || 12)));
		        merged.keyboardKeyFontSize = Math.max(12, Math.min(28, Math.round(Number(merged.keyboardKeyFontSize) || 18)));
		        merged.keyboardRippleOpacity = Math.max(4, Math.min(32, Math.round(Number(merged.keyboardRippleOpacity) || 12)));
		        merged.keyboardPressGlowEnabled = merged.keyboardPressGlowEnabled === true;
		        merged.keyboardPressGlowOpacity = Math.max(0, Math.min(100, Math.round(Number(merged.keyboardPressGlowOpacity) || 42)));
		        merged.keyboardPressGlowSize = Math.max(20, Math.min(100, Math.round(Number(merged.keyboardPressGlowSize) || 62)));
		        ['keyboardSurfaceColor', 'keyboardSurfaceColorDark', 'keyboardKeyColor', 'keyboardKeyColorDark', 'keyboardSpecialKeyColor', 'keyboardSpecialKeyColorDark', 'keyboardKeyTextColor', 'keyboardKeyTextColorDark', 'keyboardRippleColor', 'keyboardRippleColorDark', 'keyboardPressGlowColor', 'keyboardPressGlowColorDark'].forEach(key => {
		            const value = String(merged[key] || '').trim();
		            merged[key] = /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : '';
		        });
		        ['keyboardCustomStyleCss', 'keyboardCustomEffectHtml', 'keyboardCustomEffectCss', 'keyboardCustomEffectJs'].forEach(key => {
		            merged[key] = String(merged[key] || '').slice(0, 50000);
		        });
		        merged.historyStorageEnabled = merged.historyStorageEnabled !== false;
		        merged.undoRedoEnabled = merged.undoRedoEnabled !== false;
                {
                    const s = Number(merged.tableScaleDefault);
                    merged.tableScaleDefault = Number.isFinite(s) ? Math.max(0.25, Math.min(2, s)) : 0.5;
                }
                {
                    const w = Number(merged.tableCellWidth);
                    merged.tableCellWidth = Number.isFinite(w) ? Math.max(48, Math.min(320, Math.round(w))) : 80;
                }
                {
                    const h = Number(merged.tableCellHeight);
                    merged.tableCellHeight = Number.isFinite(h) ? Math.max(30, Math.min(160, Math.round(h))) : 48;
                }
                merged.dataFormFieldGap = Math.max(0, Math.min(32, Math.round(Number(merged.dataFormFieldGap) || 8)));
                merged.dataFormPadding = Math.max(0, Math.min(40, Math.round(Number(merged.dataFormPadding) || 12)));
                {
                    const fs = Number(merged.tableCellFontSize);
                    merged.tableCellFontSize = Number.isFinite(fs) ? Math.max(10, Math.min(40, Math.round(fs))) : 16;
                }
                if (!merged.tableCellStyles || typeof merged.tableCellStyles !== 'object') {
                    merged.tableCellStyles = {};
                }
		        merged.inputStatsRecordingEnabled = merged.inputStatsRecordingEnabled !== false;
		        merged.remoteDictionarySource = ['auto', 'gcore', 'fastly', 'jsdelivr', 'github', 'custom'].includes(merged.remoteDictionarySource)
		            ? merged.remoteDictionarySource : 'auto';
		        if (!merged.remoteDictionaryCustomSources || typeof merged.remoteDictionaryCustomSources !== 'object') {
		            merged.remoteDictionaryCustomSources = {};
		        }
		        merged.remoteDictionaryCustomSources = Object.fromEntries(
		            ['chinese', 'englishFrequency', 'englishComprehensive'].map(key => [
		                key,
		                String(merged.remoteDictionaryCustomSources[key] || '').trim().slice(0, 2048)
		            ])
		        );
		        if (!Array.isArray(merged.importedFonts)) merged.importedFonts = [];
		        const normalizeHighlightColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '').trim())
		            ? String(value).trim().toUpperCase() : fallback;
		        merged.searchMatchHighlightColor = normalizeHighlightColor(merged.searchMatchHighlightColor, DEFAULT_APP_SETTINGS.searchMatchHighlightColor);
		        merged.searchRowHighlightColor = normalizeHighlightColor(merged.searchRowHighlightColor, DEFAULT_APP_SETTINGS.searchRowHighlightColor);
		        merged.searchCurrentBorderColor = normalizeHighlightColor(merged.searchCurrentBorderColor, DEFAULT_APP_SETTINGS.searchCurrentBorderColor);
		        {
		            const pageSize = Number(merged.tablePageSize);
		            merged.tablePageSize = Number.isFinite(pageSize) ? Math.max(10, Math.min(200, Math.round(pageSize))) : 50;
		        }
		        {
		            const currentScale = merged.tableScaleCurrent == null || merged.tableScaleCurrent === ''
		                ? NaN
		                : Number(merged.tableScaleCurrent);
		            merged.tableScaleCurrent = Number.isFinite(currentScale) ? Math.max(0.25, Math.min(2, currentScale)) : null;
		        }
		        {
		            const hc = Number(merged.operationHistoryMaxCount);
		            merged.operationHistoryMaxCount = Number.isFinite(hc) ? Math.max(1, Math.min(200, Math.round(hc))) : 8;
		        }
		        {
		            const ud = Number(merged.undoRedoMaxSteps);
		            merged.undoRedoMaxSteps = Number.isFinite(ud) ? Math.max(1, Math.min(200, Math.round(ud))) : 10;
		        }
		        return merged;
		    } catch (e) {
		        return { ...DEFAULT_APP_SETTINGS };
		    }
		}

		function saveAppSettings(partial) {
		    appSettings = { ...appSettings, ...(partial || {}) };
		    PAGE_SIZE = Math.max(10, Math.min(200, Number(appSettings.tablePageSize) || 50));
		    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
		    applyAppSettings();
		}

		const TOOLBAR_CONTROL_LABELS = {
		    add: '添加快捷短语', edit: '编辑快捷短语', previous: '上一个编辑框', next: '下一个编辑框',
		    language: '中英文切换', scheme: '拼音', separator: '分词', close: '关闭键盘'
		};
		const TOOLBAR_CONTROL_ORDER = Object.keys(TOOLBAR_CONTROL_LABELS);
		function normalizeToolbarShakeLayouts(value) {
		    const allowedControls = ['add', 'edit', 'previous', 'next', 'language', 'scheme', 'separator', 'close'];
		    const source = Array.isArray(value) ? value : DEFAULT_APP_SETTINGS?.toolbarShakeLayouts || [];
		    const result = [];
		    source.slice(0, 10).forEach((item, index) => {
		        if (!item || typeof item !== 'object') return;
		        const controls = Array.from(new Set((Array.isArray(item.controls) ? item.controls : []).filter(key => allowedControls.includes(key))));
		        if (!controls.length) return;
		        const id = String(item.id || 'layout-' + (index + 1)).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48) || 'layout-' + (index + 1);
		        result.push({ id, name: String(item.name || '布局 ' + (index + 1)).trim().slice(0, 40) || '布局 ' + (index + 1), controls });
		    });
		    if (result.length) return result;
		    return [
		        { id: 'full', name: '完整工具栏', controls: allowedControls.slice() },
		        { id: 'navigation', name: '输入导航', controls: ['previous', 'next', 'language', 'scheme', 'separator'] },
		        { id: 'add', name: '加号', controls: ['add'] }
		    ];
		}

		const SETTINGS_RESET_GROUPS = {
		    theme: {
		        label: '主题与搜索高亮',
		        appKeys: ['searchMatchHighlightColor', 'searchRowHighlightColor', 'searchCurrentBorderColor'],
		        storageKeys: ['xtd_theme_primary', 'xtd_theme_control', 'xtd_theme_highlight', 'xtd_theme_custom_colors', 'xtd_theme_custom']
		    },
		    keyboard: {
		        label: '键盘与快捷短语',
		        appKeys: ['shortcutRows', 'shortcutRowsByField', 'shortcutFontSize', 'shortcutChipScale', 'keyboardModeByField', 'desktopModeEnabled', 'shortcutWrap', 'shortcutAutoCompleteEnabled', 'shortcutAutoCompleteByField', 'shortcutAddPosition', 'shortcutRankByClicks', 'toolbarShakeEnabled', 'toolbarShakeAmplitude', 'toolbarShakeAmplitudeUnit', 'toolbarScale', 'toolbarShakeAnimation', 'toolbarShakeEffect', 'toolbarShakeEffectDuration', 'toolbarShakeEffectHtml', 'toolbarShakeEffectCss', 'toolbarShakeEffectJs', 'toolbarShakeLayouts', 'remoteDictionarySource', 'remoteDictionaryCustomSources', 'importedFonts', 'keyboardPressEffect', 'keyboardSurfaceStyle', 'keyboardKeyShape', 'keyboardKeyHeight', 'keyboardKeyGap', 'keyboardKeyRadius', 'keyboardKeyFontSize', 'keyboardSurfaceColor', 'keyboardSurfaceColorDark', 'keyboardKeyColor', 'keyboardKeyColorDark', 'keyboardSpecialKeyColor', 'keyboardSpecialKeyColorDark', 'keyboardKeyTextColor', 'keyboardKeyTextColorDark', 'keyboardRippleColor', 'keyboardRippleColorDark', 'keyboardRippleOpacity', 'keyboardPressGlowEnabled', 'keyboardPressGlowColor', 'keyboardPressGlowColorDark', 'keyboardPressGlowOpacity', 'keyboardPressGlowSize', 'keyboardCustomStyleCss', 'keyboardCustomEffectHtml', 'keyboardCustomEffectCss', 'keyboardCustomEffectJs'],
		        storageKeys: ['keyboardState', 'steel_bar_keyboard_config', 'shortcutToolbarWrap_pos_v4', 'rsdb_ime_learning_v1']
		    },
		    interface: {
		        label: '界面显示与交互',
		        appKeys: ['dialogPositions', 'virtualKeyboardHeight', 'virtualKeyboardBottomOffset', 'cursorHandleDuration', 'animationsEnabled', 'snackbarPlacement', 'snackbarDismissMode', 'tableScaleDefault', 'tableScaleCurrent', 'tableCellWidth', 'tableCellHeight', 'tableCellFontSize', 'tablePageSize', 'dataFormFieldGap', 'dataFormPadding', 'tableCellStyles'],
		        storageKeys: ['fabPosition', 'shortcutToolbarWrap_pos_v4', 'rsdb_recent_cell_colors', 'filterMatchRows', 'sortRulesMemory']
		    },
		    suggest: {
		        label: '智能建议与输入统计',
		        appKeys: ['suggestEnabled', 'suggestThreshold', 'suggestEnabledByField', 'inputStatsRecordingEnabled'],
		        storageKeys: ['rsdb_input_stats_v1']
		    },
		    imageCalculator: {
		        label: '图片与重量计算',
		        appKeys: ['imageCompressPolicy', 'imageCompressUseMaxWidth', 'imageCompressUseMaxHeight', 'largeImageThresholdMB', 'imageCompressMaxWidth', 'imageCompressMaxHeight', 'imageCompressQuality', 'imagePreviewKeepTransform', 'imagePreviewBackground', 'imagePreviewViewMode', 'imagePreviewInfoTitleFontSize', 'imagePreviewInfoFontSize', 'imagePreviewInfoOpacity', 'imagePreviewInfoWidth', 'imagePreviewInfoHeight'],
		        storageKeys: ['rsdb_calculator_density', 'rsdb_calculator_formula']
		    },
		    history: {
		        label: '历史记录与撤销重做',
		        appKeys: ['historyStorageEnabled', 'operationHistoryMaxCount', 'undoRedoEnabled', 'undoRedoMaxSteps'],
		        storageKeys: ['rsdb_operation_history_v1', 'rsdb_operation_history_cursor_v1']
		    }
		};

		function cloneResetDefault(value) {
		    if (value && typeof value === 'object') {
		        try { return JSON.parse(JSON.stringify(value)); } catch (e) {}
		    }
		    return value;
		}

		function resetSelectedSettings(groupIds = []) {
		    const selected = new Set(groupIds.filter(id => SETTINGS_RESET_GROUPS[id]));
		    if (!selected.size) return false;
		    const importedFontNames = selected.has('keyboard') ? [...(appSettings.importedFonts || [])] : [];
		    const nextSettings = { ...appSettings };
		    selected.forEach(id => {
		        const group = SETTINGS_RESET_GROUPS[id];
		        (group.appKeys || []).forEach(key => {
		            if (Object.prototype.hasOwnProperty.call(DEFAULT_APP_SETTINGS, key)) {
		                nextSettings[key] = cloneResetDefault(DEFAULT_APP_SETTINGS[key]);
		            }
		        });
		        (group.storageKeys || []).forEach(key => {
		            try { localStorage.removeItem(key); } catch (e) {}
		        });
		    });
		    appSettings = { ...DEFAULT_APP_SETTINGS, ...nextSettings };

		    if (selected.has('theme')) {
		        selectedTheme = 'auto';
		        localStorage.setItem('theme', 'auto');
		    }
		    if (selected.has('keyboard')) {
		        keyboardState = { shiftState: 'locked-on', inputType: 'text', imeLanguage: 'english', pinyinScheme: 'smart' };
		        localStorage.setItem('keyboardState', JSON.stringify(keyboardState));
		        try { localStorage.removeItem(KeyboardConfigManager.STORAGE_KEY); } catch (e) {}
		        try { localStorage.removeItem('steel_bar_keyboard_config'); } catch (e) {}
		        KeyboardConfigManager.config = cloneResetDefault(DEFAULT_KEYBOARD_CONFIG);
		        try { localStorage.setItem(KeyboardConfigManager.STORAGE_KEY, JSON.stringify(KeyboardConfigManager.config)); } catch (e) {}
		        if (typeof dynamicVariableState !== 'undefined') dynamicVariableState = {};
		        try { localStorage.removeItem(DYNAMIC_VAR_STATE_KEY); } catch (e) {}
		        if (typeof shortcutClickStats !== 'undefined') shortcutClickStats = {};
		        try { localStorage.removeItem('rsdb_shortcut_click_stats_v1'); } catch (e) {}
		        imeLearningState = createEmptyImeLearningState();
		        currentShortcutFieldKey = null;
		        shortcutEditMode = false;
		        clearImportedFonts(importedFontNames);
		    }
		    if (selected.has('suggest')) {
		        inputStats = {};
		        try { localStorage.removeItem(INPUT_STATS_KEY); } catch (e) {}
		    }
		    if (selected.has('history')) {
		        operationHistory = [];
		        historyCursor = 0;
		        window.__rsdbPendingOp = null;
		        try { localStorage.removeItem('rsdb_operation_history_v1'); localStorage.removeItem('rsdb_operation_history_cursor_v1'); } catch (e) {}
		    }
		    if (selected.has('interface')) {
		        isFilterMatchRows = false;
		        try { localStorage.setItem('filterMatchRows', 'false'); } catch (e) {}
		        const fab = document.getElementById('mainFab');
		        if (fab) { fab.style.right = '24px'; fab.style.bottom = '24px'; }
		        window.resetShortcutToolbarWrapPosition?.();
		    }
		    if (selected.has('imageCalculator')) {
		        loadCalculatorSettings?.();
		    }
		    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
		    if (selected.has('theme')) {
		        applyStoredThemeColors(DEFAULT_THEME_COLORS);
		        initTheme();
		    }
		    applyAppSettings();
		    if (selected.has('keyboard')) generateVirtualKeyboard();
		    if (selected.has('history')) updateHistoryFeatureAvailability();
		    if (selected.has('interface')) updateTable();
		    updateSettingsUI();
		    return true;
		}


		function loadDynamicVariableState() {
		    try {
		        const raw = localStorage.getItem(DYNAMIC_VAR_STATE_KEY);
		        const parsed = raw ? JSON.parse(raw) : {};
		        return parsed && typeof parsed === 'object' ? parsed : {};
		    } catch (e) {
		        return {};
		    }
		}

		function saveDynamicVariableState() {
		    try {
		        localStorage.setItem(DYNAMIC_VAR_STATE_KEY, JSON.stringify(dynamicVariableState || {}));
		    } catch (e) {
		        console.warn('保存自定义变量状态失败', e);
		    }
		}

		function loadInputStats() {
		    try {
		        const raw = localStorage.getItem(INPUT_STATS_KEY);
		        return raw ? JSON.parse(raw) : {};
		    } catch (e) {
		        return {};
		    }
		}

		let inputStatsSaveTimer = null;
		function saveInputStats() {
		    clearTimeout(inputStatsSaveTimer);
		    inputStatsSaveTimer = setTimeout(() => {
		        localStorage.setItem(INPUT_STATS_KEY, JSON.stringify(inputStats));
		    }, 180);
		}

		function recordInputStat(fieldKey, value) {
		    if (appSettings.inputStatsRecordingEnabled === false) return;
		    const v = (value || '').trim();
		    if (!v) return;
		    if (!inputStats[fieldKey]) inputStats[fieldKey] = {};
		    inputStats[fieldKey][v] = (inputStats[fieldKey][v] || 0) + 1;
		}

		function recordInputStatsOnAdd(formData) {
		    if (appSettings.inputStatsRecordingEnabled === false) return;
		    recordInputStat('furnaceId', formData.furnaceId);
		    recordInputStat('productId', formData.productId);
		    recordInputStat('cardId', formData.cardId);
		    recordInputStat('steelType', formData.steelType);
		    recordInputStat('actualDiameter', formData.actualDiameter);
		    recordInputStat('diameter', formData.diameter);
		    recordInputStat('length', formData.length);
		    recordInputStat('weight', formData.weight);
		    recordInputStat('status', formData.status);
		    recordInputStat('position', formData.position);
		    saveInputStats();
		}

		function applyDialogPositionToAll() {
		    const dialogs = document.querySelectorAll('mdui-dialog');
		    const positions = Array.isArray(appSettings.dialogPositions) ? appSettings.dialogPositions : (appSettings.dialogPositions ? [appSettings.dialogPositions] : ['center']);
		    const hasTop = positions.includes('top');
		    const hasCenter = positions.includes('center') || positions.length === 0;
		    dialogs.forEach(dlg => {
		        dlg.classList.remove('dialog-pos-top');
		        if (hasTop && !hasCenter) {
		            dlg.classList.add('dialog-pos-top');
		            return;
		        }
		        if (hasTop && hasCenter) {
		            if (dlg.hasAttribute('fullscreen')) dlg.classList.add('dialog-pos-top');
		        }
		    });
		}

        function applyTableViewSettings() {
            const root = document.documentElement;
            const cellW = Math.max(48, Math.min(320, Number(appSettings.tableCellWidth) || 80));
            const cellH = Math.max(30, Math.min(160, Number(appSettings.tableCellHeight) || 48));
            const cellFs = Math.max(10, Math.min(40, Number(appSettings.tableCellFontSize) || 16));
            root.style.setProperty('--table-cell-min-width', `${cellW}px`);
            root.style.setProperty('--table-cell-height', `${cellH}px`);
            root.style.setProperty('--table-cell-font-size', `${cellFs}px`);
            root.style.setProperty('--rsdb-data-form-field-gap', `${Math.max(0, Math.min(32, Number(appSettings.dataFormFieldGap) || 8))}px`);
            root.style.setProperty('--rsdb-data-form-padding', `${Math.max(0, Math.min(40, Number(appSettings.dataFormPadding) || 12))}px`);
            if (ZoomManager) {
                ZoomManager.minScale = 0.25;
                ZoomManager.maxScale = 2;
                const nextScale = Math.max(0.25, Math.min(2, Number(appSettings.tableScaleDefault) || 0.5));
                if (!Number.isFinite(ZoomManager.currentScale) || ZoomManager.currentScale < ZoomManager.minScale || ZoomManager.currentScale > ZoomManager.maxScale) {
                    ZoomManager.currentScale = nextScale;
                }
            }
        }

        function getCellFormat(rowIndex, fieldKey) {
            const itemStyle = tableData[rowIndex]?.__cellStyles?.[fieldKey];
            if (itemStyle && typeof itemStyle === 'object') return itemStyle;
            const legacy = appSettings.tableCellStyles?.[`${rowIndex}:${fieldKey}`];
            return legacy && typeof legacy === 'object' ? legacy : {};
        }

        function normalizeStyleColor(value, fallback = '') {
            const raw = String(value || '').trim();
            if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toUpperCase();
            if (/^#[0-9a-f]{3}$/i.test(raw)) return raw.replace(/[0-9a-f]/gi, ch => ch + ch).toUpperCase();
            const match = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/i);
            if (match) {
                if (match[4] !== undefined && Number(match[4]) === 0) return fallback;
                return `#${[match[1], match[2], match[3]].map(n => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
            }
            return fallback;
        }

        function getDefaultCellStyle() {
            const rootStyle = getComputedStyle(document.body || document.documentElement);
            const tableFontSize = Math.max(10, Math.min(40, Number(appSettings.tableCellFontSize) || 16));
            const defaultTextColor = normalizeStyleColor(rootStyle.getPropertyValue('--text-color'), '#212121');
            const defaultSurfaceColor = normalizeStyleColor(rootStyle.getPropertyValue('--surface-color'), '#FFFFFF');
            return {
                fontName: 'Google Sans Text',
                fontSize: tableFontSize,
                color: defaultTextColor,
                backgroundColor: defaultSurfaceColor,
                horizontal: 'general',
                numFmt: 'General',
                bold: false,
                italic: false,
                underline: false,
                wrapText: false
            };
        }

        function getEffectiveCellStyleFromRaw(rawStyle) {
            const defaults = getDefaultCellStyle();
            const current = rawStyle && typeof rawStyle === 'object' ? rawStyle : {};
            return {
                ...defaults,
                ...current,
                fontName: current.fontName || defaults.fontName,
                fontSize: Number(current.fontSize) > 0 ? Number(current.fontSize) : defaults.fontSize,
                color: normalizeStyleColor(current.color, defaults.color),
                backgroundColor: normalizeStyleColor(current.backgroundColor, defaults.backgroundColor),
                horizontal: current.horizontal || defaults.horizontal,
                numFmt: current.numFmt || defaults.numFmt,
                bold: !!(current.bold || current.fontWeight === 'bold'),
                italic: !!current.italic,
                underline: !!current.underline,
                wrapText: !!current.wrapText
            };
        }

        function getEffectiveCellStyle(rowIndex, fieldKey) {
            return getEffectiveCellStyleFromRaw(getCellFormat(rowIndex, fieldKey) || {});
        }

        function setCellFormat(rowIndex, fieldKey, style) {
            if (!tableData[rowIndex] || !fieldKey) return;
            const styles = { ...(tableData[rowIndex].__cellStyles || {}) };
            const legacyKey = `${rowIndex}:${fieldKey}`;
            if (style && Object.keys(style).length) {
                styles[fieldKey] = style;
                if (appSettings.tableCellStyles && typeof appSettings.tableCellStyles === 'object') delete appSettings.tableCellStyles[legacyKey];
            } else {
                delete styles[fieldKey];
                if (appSettings.tableCellStyles && typeof appSettings.tableCellStyles === 'object') delete appSettings.tableCellStyles[legacyKey];
            }
            if (Object.keys(styles).length) tableData[rowIndex].__cellStyles = styles;
            else delete tableData[rowIndex].__cellStyles;
        }

        function cellKey(rowIndex, fieldKey) { return `${rowIndex}:${fieldKey}`; }
        function parseCellKey(key) {
            const [row, ...fieldParts] = String(key).split(':');
            return { row: Number(row), field: fieldParts.join(':') };
        }
        function getCellSelectionKeys() {
            return Array.from(selectedCells).map(parseCellKey).filter(({ row, field }) => Number.isInteger(row) && field);
        }
        function refreshCellSelectionUI() {
            document.querySelectorAll('#dataTable td.cell-selected').forEach(cell => cell.classList.remove('cell-selected'));
            if (!isCellMultiSelectMode) return;
            document.querySelectorAll('#dataTable tbody tr').forEach(row => {
                const rowIndex = Number(row.dataset.index);
                row.querySelectorAll('td[data-field]').forEach(cell => {
                    if (selectedCells.has(cellKey(rowIndex, cell.dataset.field))) cell.classList.add('cell-selected');
                });
                if (selectedCells.has(cellKey(rowIndex, 'seq'))) row.querySelector('td.seq-col')?.classList.add('cell-selected');
            });
        }
        function setCellSelectionRange(start, end, additive = false) {
            if (!start || !end) return;
            if (!additive) selectedCells.clear();
            const r1 = Math.min(start.row, end.row), r2 = Math.max(start.row, end.row);
            const visibleFields = searchableFields;
            const c1 = Math.max(0, visibleFields.indexOf(start.field)), c2 = Math.max(0, visibleFields.indexOf(end.field));
            for (let r = r1; r <= r2; r++) {
                for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) selectedCells.add(cellKey(r, visibleFields[c]));
            }
            refreshCellSelectionUI();
            updateCellSelectionActions();
        }
        function toggleCellSelection(row, field, additive = true) {
            const key = cellKey(row, field);
            if (!additive) selectedCells.clear();
            if (selectedCells.has(key) && additive) selectedCells.delete(key); else selectedCells.add(key);
            cellSelectionAnchor = { row, field };
            refreshCellSelectionUI();
            updateCellSelectionActions();
        }
        function selectCellColumn(field) {
            if (!field) return;
            const keys = tableData.map((_, row) => cellKey(row, field));
            const allSelected = keys.length > 0 && keys.every(key => selectedCells.has(key));
            keys.forEach(key => {
                if (allSelected) selectedCells.delete(key);
                else selectedCells.add(key);
            });
            cellSelectionAnchor = tableData.length ? { row: 0, field } : null;
            refreshCellSelectionUI(); updateCellSelectionActions();
        }
        function selectCellRow(row) {
            if (!Number.isInteger(row) || !tableData[row]) return;
            const fields = ['seq', ...searchableFields];
            const keys = fields.map(field => cellKey(row, field));
            const allSelected = keys.every(key => selectedCells.has(key));
            keys.forEach(key => {
                if (allSelected) selectedCells.delete(key);
                else selectedCells.add(key);
            });
            cellSelectionAnchor = { row, field: 'seq' };
            refreshCellSelectionUI(); updateCellSelectionActions();
        }
        function updateCellSelectionActions() {
            const count = selectedCells.size;
            if (dom.editSelectedCellsBtn) dom.editSelectedCellsBtn.style.display = 'none';
            const actionItems = [
                dom.cellSelectionSetMenuItem,
                dom.cellSelectionDeleteDataMenuItem,
                dom.cellSelectionDeleteStyleMenuItem
            ].filter(Boolean);
            actionItems.forEach(item => {
                item.style.display = isCellMultiSelectMode ? '' : 'none';
                if (isCellMultiSelectMode && count) item.removeAttribute('disabled');
                else item.setAttribute('disabled', '');
            });
            if (dom.topCellMultiSelectBtn) {
                dom.topCellMultiSelectBtn.setAttribute('icon', isCellMultiSelectMode ? 'close' : 'grid_view');
                const tip = dom.topCellMultiSelectBtn.closest('mdui-tooltip');
                if (tip) tip.setAttribute('content', isCellMultiSelectMode ? '退出多选格子' : '多选格子');
                dom.topCellMultiSelectBtn.setAttribute('aria-label', isCellMultiSelectMode ? '退出多选格子' : '多选格子');
            }
            if (dom.invertSelectionMenuItem) dom.invertSelectionMenuItem.style.display = (isCellMultiSelectMode && count) || (isMultiSelectMode && selectedRows.size) ? '' : 'none';
            if (dom.selectedCount && isCellMultiSelectMode) dom.selectedCount.textContent = count;
        }
        function toggleCellMultiSelectMode() {
            isCellMultiSelectMode = !isCellMultiSelectMode;
            selectedCells.clear();
            cellSelectionAnchor = null;
            document.getElementById('dataTable')?.classList.toggle('cell-selection-mode', isCellMultiSelectMode);
            if (dom.cellMultiSelectMenuItem) dom.cellMultiSelectMenuItem.textContent = isCellMultiSelectMode ? '退出多选格子' : '多选格子';
            updateCellSelectionActions();
            updateTable();
        }
        function invertSelectedCells() {
            if (isMultiSelectMode && !isCellMultiSelectMode) {
                const next = new Set();
                tableData.forEach((_, row) => { if (!selectedRows.has(row)) next.add(row); });
                selectedRows = next;
                updateTable();
                return;
            }
            if (!isCellMultiSelectMode) return;
            const next = new Set();
            tableData.forEach((_, row) => searchableFields.forEach(field => {
                const key = cellKey(row, field); if (!selectedCells.has(key)) next.add(key);
            }));
            selectedCells = next;
            refreshCellSelectionUI(); updateCellSelectionActions();
        }

        function getFirstEditableCellSelection() {
            return getCellSelectionKeys().find(item => item.field !== 'seq') || null;
        }

        function confirmCellSelectionMutation(action) {
            if (!isCellMultiSelectMode || !selectedCells.size) {
                showSnackbar('请先选择格子', 'warning');
                return;
            }
            const keys = getCellSelectionKeys().filter(item => item.field !== 'seq' && tableData[item.row]);
            if (!keys.length) {
                showSnackbar('序号格子不能执行此操作', 'warning');
                return;
            }
            const isStyle = action === 'style';
            const title = isStyle ? '删除选中格子属性' : '删除选中格子数据';
            const description = isStyle
                ? `确定清除选中的 ${keys.length} 个格子的字体、颜色、填充、对齐等属性吗？`
                : `确定清空选中的 ${keys.length} 个格子中的数据吗？`;
            dom.confirmMessage.innerHTML = `<div style="text-align:center;padding:8px 0;"><p style="font-size:1rem;margin:0;">${description}</p><p style="margin:12px 0 0;color:#757575;font-size:.9rem;">此操作可通过撤销恢复。</p></div>`;
            dom.confirmActionBtn.textContent = '确定';
            openCustomModal(dom.confirmModal);
            dom.confirmActionBtn.onclick = () => {
                beginOperation(isStyle ? 'clear_cell_style' : 'clear_cell_data', title, { count: keys.length });
                keys.forEach(({ row, field }) => {
                    if (isStyle) setCellFormat(row, field, {});
                    else {
                        tableData[row][field] = '';
                        if (tableData[row].__cellDisplayValues) delete tableData[row].__cellDisplayValues[field];
                    }
                });
                if (isStyle) localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
                saveDataToIndexedDB();
                updateTable();
                commitOperation();
                selectedCells.clear();
                cellSelectionAnchor = null;
                refreshCellSelectionUI();
                updateCellSelectionActions();
                closeCustomModal(dom.confirmModal);
                dom.confirmActionBtn.onclick = null;
                showSnackbar(isStyle ? `已删除 ${keys.length} 个格子的属性` : `已清空 ${keys.length} 个格子的数据`, 'success');
            };
        }
        function stopCellAutoScroll() {
            if (cellSelectionAutoScrollTimer) cancelAnimationFrame(cellSelectionAutoScrollTimer);
            cellSelectionAutoScrollTimer = null;
        }
        function continueCellSelectionAtPoint(e) {
            if (!isCellMultiSelectMode || !cellSelectionAnchor) return;
            const container = document.querySelector('.data-table-container-div');
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const edge = 42;
            let dx = 0, dy = 0;
            if (e.clientX > rect.right - edge) dx = 18;
            if (e.clientX < rect.left + edge) dx = -18;
            if (e.clientY > rect.bottom - edge) dy = 18;
            if (e.clientY < rect.top + edge) dy = -18;
            if (!dx && !dy) return;
            container.scrollLeft += dx; container.scrollTop += dy;
            cellSelectionAutoScrollTimer = requestAnimationFrame(() => continueCellSelectionAtPoint(e));
        }

        let cellColorPaletteClosingUntil = 0;
		function preserveDataCellStyleForPicker() {
		    const panel = document.getElementById('quickEditStylePanel');
		    if (!dataCellStyleContext || !dom.dataCellStyleDialog || !dom.dataCellStylePanelHost) return;
		    if (!panel || panel.parentElement !== dom.dataCellStylePanelHost) return;
		    cellStylePickerReturnContext = { fieldId: dataCellStyleContext.fieldId };
		}

		function isCellStyleChildPickerOpen() {
		    return [dom.cellFontPickerDialog, dom.cellAlignPickerDialog, dom.cellColorPaletteDialog]
		        .some(dialog => !!dialog && (dialog.open === true || dialog.hasAttribute('open')));
		}

		function ensureDataCellStylePanelMounted() {
		    const panel = document.getElementById('quickEditStylePanel');
		    if (panel && dom.dataCellStylePanelHost && panel.parentElement !== dom.dataCellStylePanelHost) {
		        dom.dataCellStylePanelHost.appendChild(panel);
		    }
		}

		function restoreDataCellStyleAfterPicker() {
		    const returnContext = cellStylePickerReturnContext;
		    if (!returnContext) return;
		    requestAnimationFrame(() => {
		        if (!dataCellStyleContext || dataCellStyleContext.fieldId !== returnContext.fieldId) {
		            cellStylePickerReturnContext = null;
		            return;
		        }
		        ensureDataCellStylePanelMounted();
		        if (dom.dataCellStyleDialog) dom.dataCellStyleDialog.open = true;
		        requestAnimationFrame(() => { cellStylePickerReturnContext = null; });
		    });
		}

		/*
		 * Keep nested Material dialogs in a real top layer.  MDUI renders the
		 * panel and its scrim from the dialog host, so moving the host and giving
		 * it a monotonically increasing z-index keeps the newest dialog above the
		 * dialog that opened it without closing or remounting the parent.
		 */
		let rsdbDialogLayer = 30000;
		let rsdbDialogObserver = null;
		let rsdbDialogElevationQueued = false;

		function isOpenRsdbDialog(dialog) {
		    return !!dialog && dialog.tagName === 'MDUI-DIALOG' && (dialog.open === true || dialog.hasAttribute('open'));
		}

		function getNextRsdbDialogLayer() {
		    let max = Number.isFinite(rsdbDialogLayer) ? rsdbDialogLayer : 30000;
		    document.querySelectorAll('mdui-dialog').forEach(dialog => {
		        if (!isOpenRsdbDialog(dialog)) return;
		        const value = Number.parseInt(dialog.style.zIndex || '', 10);
		        if (Number.isFinite(value)) max = Math.max(max, value);
		    });
		    rsdbDialogLayer = Math.max(30000, max) + 10;
		    return rsdbDialogLayer;
		}

		function elevateRsdbDialog(dialog) {
		    if (!dialog || dialog.tagName !== 'MDUI-DIALOG') return false;
		    if (dialog.parentElement !== document.body) document.body.appendChild(dialog);
		    const layer = getNextRsdbDialogLayer();
		    dialog.style.setProperty('z-index', String(layer), 'important');
		    dialog.dataset.rsdbDialogLayer = String(layer);
		    return true;
		}

		function openDialogOnTop(dialog) {
		    if (!dialog || dialog.tagName !== 'MDUI-DIALOG') return false;
		    elevateRsdbDialog(dialog);
		    dialog.open = true;
		    return true;
		}

		function scheduleRsdbDialogElevation() {
		    if (rsdbDialogElevationQueued) return;
		    rsdbDialogElevationQueued = true;
		    queueMicrotask(() => {
		        rsdbDialogElevationQueued = false;
		        document.querySelectorAll('mdui-dialog').forEach(dialog => {
		            if (isOpenRsdbDialog(dialog) && !dialog.dataset.rsdbDialogLayer) elevateRsdbDialog(dialog);
		        });
		    });
		}

		function installRsdbDialogLayerManager() {
		    if (rsdbDialogObserver) return;
		    rsdbDialogObserver = new MutationObserver(mutations => {
		        mutations.forEach(mutation => {
		            if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
		                const dialog = mutation.target;
		                if (isOpenRsdbDialog(dialog)) elevateRsdbDialog(dialog);
		                return;
		            }
		            mutation.addedNodes?.forEach(node => {
		                if (!(node instanceof Element)) return;
		                if (isOpenRsdbDialog(node) && !node.dataset.rsdbDialogLayer) elevateRsdbDialog(node);
		                node.querySelectorAll?.('mdui-dialog').forEach(dialog => {
		                    if (isOpenRsdbDialog(dialog) && !dialog.dataset.rsdbDialogLayer) elevateRsdbDialog(dialog);
		                });
		            });
		        });
		    });
		    rsdbDialogObserver.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
		    scheduleRsdbDialogElevation();
		}

		installRsdbDialogLayerManager();

        function closeCellColorPaletteDialog() {
            const dialog = dom.cellColorPaletteDialog;
            if (!dialog) return;
            cellColorPaletteClosingUntil = Date.now() + 420;
            dialog.open = false;
        }

        function applyColorToActiveTarget(color) {
            if (!/^#[0-9a-fA-F]{6}$/.test(color)) return;
            try {
                const inputId = activeCellColorTarget === 'backgroundColor' ? 'cellStyleBgColorInput' : 'cellStyleTextColorInput';
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = color;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
                const preview = activeCellColorTarget === 'backgroundColor' ? dom.cellStyleBgColorPreview : dom.cellStyleTextColorPreview;
                if (preview) preview.style.backgroundColor = color;
                const recent = JSON.parse(localStorage.getItem(RECENT_CELL_COLORS_KEY) || '[]').filter(c => c !== color);
                recent.unshift(color); localStorage.setItem(RECENT_CELL_COLORS_KEY, JSON.stringify(recent.slice(0, 8)));
                window.previewCurrentCellStyle?.();
            } finally {
                closeCellColorPaletteDialog();
            }
        }

        const MATERIAL_COLOR_GROUPS = [
            ['Red', ['#FFEBEE','#FFCDD2','#EF9A9A','#E57373','#EF5350','#F44336','#E53935','#D32F2F','#C62828','#B71C1C']],
            ['Pink', ['#FCE4EC','#F8BBD0','#F48FB1','#F06292','#EC407A','#E91E63','#D81B60','#C2185B','#AD1457','#880E4F']],
            ['Purple', ['#F3E5F5','#E1BEE7','#CE93D8','#BA68C8','#AB47BC','#9C27B0','#8E24AA','#7B1FA2','#6A1B9A','#4A148C']],
            ['Deep Purple', ['#EDE7F6','#D1C4E9','#B39DDB','#9575CD','#7E57C2','#673AB7','#5E35B1','#512DA8','#4527A0','#311B92']],
            ['Indigo', ['#E8EAF6','#C5CAE9','#9FA8DA','#7986CB','#5C6BC0','#3F51B5','#3949AB','#303F9F','#283593','#1A237E']],
            ['Blue', ['#E3F2FD','#BBDEFB','#90CAF9','#64B5F6','#42A5F5','#2196F3','#1E88E5','#1976D2','#1565C0','#0D47A1']],
            ['Light Blue', ['#E1F5FE','#B3E5FC','#81D4FA','#4FC3F7','#29B6F6','#03A9F4','#039BE5','#0288D1','#0277BD','#01579B']],
            ['Cyan', ['#E0F7FA','#B2EBF2','#80DEEA','#4DD0E1','#26C6DA','#00BCD4','#00ACC1','#0097A7','#00838F','#006064']],
            ['Teal', ['#E0F2F1','#B2DFDB','#80CBC4','#4DB6AC','#26A69A','#009688','#00897B','#00796B','#00695C','#004D40']],
            ['Green', ['#E8F5E9','#C8E6C9','#A5D6A7','#81C784','#66BB6A','#4CAF50','#43A047','#388E3C','#2E7D32','#1B5E20']],
            ['Light Green', ['#F1F8E9','#DCEDC8','#C5E1A5','#AED581','#9CCC65','#8BC34A','#7CB342','#689F38','#558B2F','#33691E']],
            ['Lime', ['#F9FBE7','#F0F4C3','#E6EE9C','#DCE775','#D4E157','#CDDC39','#C0CA33','#AFB42B','#9E9D24','#827717']],
            ['Yellow', ['#FFFDE7','#FFF9C4','#FFF59D','#FFF176','#FFEE58','#FFEB3B','#FDD835','#FBC02D','#F9A825','#F57F17']],
            ['Amber', ['#FFF8E1','#FFECB3','#FFE082','#FFD54F','#FFCA28','#FFC107','#FFB300','#FFA000','#FF8F00','#FF6F00']],
            ['Orange', ['#FFF3E0','#FFE0B2','#FFCC80','#FFB74D','#FFA726','#FF9800','#FB8C00','#F57C00','#EF6C00','#E65100']],
            ['Deep Orange', ['#FBE9E7','#FFCCBC','#FFAB91','#FF8A65','#FF7043','#FF5722','#F4511E','#E64A19','#D84315','#BF360C']],
            ['Brown', ['#EFEBE9','#D7CCC8','#BCAAA4','#A1887F','#8D6E63','#795548','#6D4C41','#5D4037','#4E342E','#3E2723']],
            ['Grey', ['#FAFAFA','#F5F5F5','#EEEEEE','#E0E0E0','#BDBDBD','#9E9E9E','#757575','#616161','#424242','#212121']],
            ['Blue Grey', ['#ECEFF1','#CFD8DC','#B0BEC5','#90A4AE','#78909C','#607D8B','#546E7A','#455A64','#37474F','#263238']]
        ];
        const MATERIAL_COLOR_SHADES = [50,100,200,300,400,500,600,700,800,900];

        function renderCellColorPalette() {
            const recent = JSON.parse(localStorage.getItem(RECENT_CELL_COLORS_KEY) || '[]');
            const draw = (el, colors) => {
                if (!el) return;
                el.innerHTML = '';
                colors.forEach(entry => {
                    const data = typeof entry === 'string' ? { color: entry } : entry;
                    const color = data.color;
                    const label = data.title || color;
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'cell-color-swatch';
                    b.title = label;
                    b.setAttribute('aria-label', label);
                    const sample = document.createElement('span');
                    sample.className = 'cell-color-swatch-sample';
                    sample.style.backgroundColor = color;
                    b.appendChild(sample);
                    if (data.shade != null) {
                        const shade = document.createElement('span');
                        shade.className = 'cell-color-swatch-shade';
                        shade.textContent = String(data.shade);
                        b.appendChild(shade);
                    }
                    const hex = document.createElement('span');
                    hex.className = 'cell-color-swatch-hex';
                    hex.textContent = color;
                    b.appendChild(hex);
                    b.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        applyColorToActiveTarget(color);
                    });
                    el.appendChild(b);
                });
            };
            draw(dom.recentCellColors, recent.map(color => ({ color, title: `最近使用 · ${color}` })));
            if (dom.defaultCellColors) {
                dom.defaultCellColors.innerHTML = '';
                MATERIAL_COLOR_GROUPS.forEach(([group, colors]) => {
                    const section = document.createElement('section');
                    section.className = 'cell-color-group';
                    const title = document.createElement('div');
                    title.className = 'cell-color-group-title';
                    title.textContent = group;
                    const grid = document.createElement('div');
                    grid.className = 'cell-color-grid material-color-grid';
                    draw(grid, colors.map((color, index) => ({
                        color,
                        shade: MATERIAL_COLOR_SHADES[index],
                        title: `${group} ${MATERIAL_COLOR_SHADES[index]} · ${color}`
                    })));
                    section.append(title, grid);
                    dom.defaultCellColors.appendChild(section);
                });
            }
        }
        function openCellColorPalette(target) {
            if (Date.now() < cellColorPaletteClosingUntil) return;
		    preserveDataCellStyleForPicker();
            activeCellColorTarget = target; renderCellColorPalette();
            if (dom.cellColorPaletteDialog) {
                dom.cellColorPaletteDialog.headline = target === 'backgroundColor' ? '选择填充颜色' : '选择字体颜色';
		        openDialogOnTop(dom.cellColorPaletteDialog);
            }
        }

        function migrateLegacyCellStyles() {
            const legacy = appSettings.tableCellStyles;
            if (!legacy || typeof legacy !== 'object' || !Object.keys(legacy).length) return;
            Object.entries(legacy).forEach(([key, style]) => {
                const match = key.match(/^(\d+):(.+)$/);
                if (!match) return;
                const rowIndex = Number(match[1]);
                const field = match[2];
                if (!tableData[rowIndex]) return;
                setCellFormat(rowIndex, field, style);
            });
            appSettings.tableCellStyles = {};
            localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
        }

        function applyCellCustomStyle(cellEl, rowIndex, fieldKey) {
            if (!cellEl || rowIndex === undefined || !fieldKey) return;
            const style = getCellFormat(rowIndex, fieldKey);
            if (!style || typeof style !== 'object') return;
            if (style.fontSize) cellEl.style.setProperty('font-size', `${Math.max(10, Math.min(48, Number(style.fontSize) || 0))}px`, 'important');
            if (style.fontName) cellEl.style.setProperty('font-family', style.fontName, 'important');
            if (style.color) cellEl.style.setProperty('color', style.color, 'important');
            if (style.backgroundColor) cellEl.style.setProperty('background-color', style.backgroundColor, 'important');
            if (style.bold || style.fontWeight === 'bold') cellEl.style.setProperty('font-weight', 'bold', 'important');
            if (style.italic) cellEl.style.setProperty('font-style', 'italic', 'important');
            if (style.underline) cellEl.style.setProperty('text-decoration', 'underline', 'important');
            if (style.horizontal && style.horizontal !== 'general') cellEl.style.setProperty('text-align', style.horizontal, 'important');
            if (style.wrapText) cellEl.style.setProperty('white-space', 'normal', 'important');
        }

        function formatCellValueForDisplay(value, rowIndex, fieldKey) {
            const format = String(getCellFormat(rowIndex, fieldKey)?.numFmt || '').trim();
            if (!format || /^general$/i.test(format) || format === '@') return value;
            const raw = String(value ?? '').trim();
            if (!raw) return value;
            const number = Number(raw.replace(/,/g, ''));
            if (!Number.isFinite(number)) return value;
            const activePattern = format.split(';')[number < 0 ? 1 : 0] || format.split(';')[0] || format;
            const percent = activePattern.includes('%');
            const decimalMatch = activePattern.match(/\.([0#]+)/);
            const decimalPart = decimalMatch?.[1] || '';
            const minimumFractionDigits = (decimalPart.match(/0/g) || []).length;
            const maximumFractionDigits = decimalPart.length;
            const displayNumber = percent ? number * 100 : number;
            let result = new Intl.NumberFormat('zh-CN', {
                useGrouping: activePattern.includes(','),
                minimumFractionDigits,
                maximumFractionDigits
            }).format(displayNumber);
            if (percent) result += '%';
            if (number < 0 && /\(.*\)/.test(activePattern)) result = `(${result.replace(/^-/, '')})`;
            return result;
        }

        const DEFAULT_CELL_FONT_OPTIONS = [
            { value: '', label: '默认字体' },
            { value: 'Google Sans Text', label: 'Google Sans' },
            { value: 'Microsoft YaHei', label: '微软雅黑' },
            { value: 'SimSun', label: '宋体' },
            { value: 'SimHei', label: '黑体' },
            { value: 'KaiTi', label: '楷体' },
            { value: 'FangSong', label: '仿宋' },
            { value: 'Consolas', label: 'Consolas' }
        ];

        function getCellFontOptions() {
            const imported = Array.isArray(appSettings.importedFonts) ? appSettings.importedFonts : [];
            const known = new Set(DEFAULT_CELL_FONT_OPTIONS.map(option => option.value));
            return DEFAULT_CELL_FONT_OPTIONS.concat(imported
                .filter(name => name && !known.has(name))
                .map(name => ({ value: name, label: `${name}（已导入）` })));
        }

        function renderCellFontList(query = '') {
            const list = document.getElementById('cellFontList');
            if (!list) return;
            const currentValue = document.getElementById('cellStyleFontNameInput')?.value || '';
            const normalizedQuery = String(query).trim().toLowerCase();
            list.replaceChildren();
            getCellFontOptions()
                .filter(option => !normalizedQuery || `${option.label} ${option.value}`.toLowerCase().includes(normalizedQuery))
                .forEach(option => {
                    const item = document.createElement('button');
                    item.type = 'button';
                    item.className = 'cell-font-option';
                    item.setAttribute('role', 'option');
                    item.dataset.fontValue = option.value;
                    item.setAttribute('aria-selected', String(option.value === currentValue));
                    item.textContent = option.label;
                    item.addEventListener('click', () => {
                        const input = document.getElementById('cellStyleFontNameInput');
                        if (input) {
                            input.value = option.value;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        if (dom.cellFontPickerDialog) dom.cellFontPickerDialog.open = false;
                    });
                    list.appendChild(item);
                });
            if (!list.children.length) {
                const empty = document.createElement('div');
                empty.className = 'cell-font-list-empty';
                empty.textContent = '没有匹配的字体';
                list.appendChild(empty);
            }
        }

        function toggleCellFontPicker(forceState) {
            const dialog = dom.cellFontPickerDialog;
            if (!dialog) return;
            const nextState = typeof forceState === 'boolean' ? forceState : !dialog.open;
		    if (nextState) {
		        preserveDataCellStyleForPicker();
		        openDialogOnTop(dialog);
		    } else {
		        dialog.open = false;
		    }
            if (nextState) {
                const search = document.getElementById('cellFontSearchInput');
                renderCellFontList(search?.value || '');
                requestAnimationFrame(() => search?.focus({ preventScroll: true }));
            }
        }

        const CELL_ALIGN_OPTIONS = [
            { value: 'general', label: '常规', icon: 'format_align_left' },
            { value: 'left', label: '左对齐', icon: 'format_align_left' },
            { value: 'center', label: '居中', icon: 'format_align_center' },
            { value: 'right', label: '右对齐', icon: 'format_align_right' }
        ];

        function updateCellAlignPickerUI() {
            const input = document.getElementById('cellStyleAlignInput');
            const currentValue = input?.value || 'general';
            const current = CELL_ALIGN_OPTIONS.find(option => option.value === currentValue) || CELL_ALIGN_OPTIONS[0];
            const text = document.getElementById('cellStyleAlignTriggerText');
            const icon = document.getElementById('cellStyleAlignTriggerIcon');
            if (text) text.textContent = current.label;
            if (icon) icon.setAttribute('name', current.icon);
            document.querySelectorAll('.cell-align-option').forEach(item => {
                const selected = item.dataset.alignValue === current.value;
                item.setAttribute('aria-selected', String(selected));
            });
        }

        function openCellAlignPicker() {
            const dialog = document.getElementById('cellAlignPickerDialog');
            if (!dialog) return;
		    preserveDataCellStyleForPicker();
            setVirtualKeyboardVisible(false);
            requestAnimationFrame(() => {
		        openDialogOnTop(dialog);
                updateCellAlignPickerUI();
            });
        }

        function selectCellAlignment(value) {
            const input = document.getElementById('cellStyleAlignInput');
            if (!input) return;
            const normalized = CELL_ALIGN_OPTIONS.some(option => option.value === value) ? value : 'general';
            const previousState = window.getQuickEditState?.() || null;
            input.value = normalized;
            updateCellAlignPickerUI();
            window.previewCurrentCellStyle?.();
            window.recordQuickEditState?.(previousState);
            recordDataEditState();
            const dialog = document.getElementById('cellAlignPickerDialog');
            if (dialog) dialog.open = false;
        }

        function bindCellAlignPickerInteractions() {
            const trigger = document.getElementById('cellStyleAlignTrigger');
            if (trigger && !trigger.dataset.alignPickerBound) {
                trigger.dataset.alignPickerBound = 'true';
                let ignoreClickUntil = 0;
                trigger.addEventListener('pointerdown', (event) => {
                    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
                    ignoreClickUntil = Date.now() + 800;
                    if (event.cancelable) event.preventDefault();
                    event.stopPropagation();
                }, { passive: false });
                trigger.addEventListener('pointerup', (event) => {
                    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
                    if (event.cancelable) event.preventDefault();
                    event.stopPropagation();
                    requestAnimationFrame(openCellAlignPicker);
                }, { passive: false });
                trigger.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (Date.now() < ignoreClickUntil) return;
                    openCellAlignPicker();
                });
            }
            document.querySelectorAll('.cell-align-option').forEach(item => {
                if (item.dataset.alignPickerBound) return;
                item.dataset.alignPickerBound = 'true';
                let ignoreClickUntil = 0;
                item.addEventListener('pointerdown', (event) => {
                    ignoreClickUntil = Date.now() + 600;
                    if (event.cancelable) event.preventDefault();
                    event.stopPropagation();
                    selectCellAlignment(item.dataset.alignValue || 'general');
                }, { passive: false });
                item.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (Date.now() < ignoreClickUntil) return;
                    selectCellAlignment(item.dataset.alignValue || 'general');
                });
            });
        }

        function ensureImportedFontOptions() {
            renderCellFontList(document.getElementById('cellFontSearchInput')?.value || '');
        }

        function applySearchHighlightSettings() {
            const root = document.documentElement;
            const normalize = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '').trim())
                ? String(value).trim().toUpperCase() : fallback;
            const hexToRgba = (hex, alpha) => {
                const value = normalize(hex, '#B08B2D').slice(1);
                const r = parseInt(value.slice(0, 2), 16);
                const g = parseInt(value.slice(2, 4), 16);
                const b = parseInt(value.slice(4, 6), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            const match = normalize(appSettings.searchMatchHighlightColor, DEFAULT_APP_SETTINGS.searchMatchHighlightColor);
            const row = normalize(appSettings.searchRowHighlightColor, DEFAULT_APP_SETTINGS.searchRowHighlightColor);
            const border = normalize(appSettings.searchCurrentBorderColor, DEFAULT_APP_SETTINGS.searchCurrentBorderColor);
            root.style.setProperty('--rsdb-search-match-bg', match);
            root.style.setProperty('--rsdb-search-match-text', 'var(--text-color)');
            root.style.setProperty('--rsdb-search-row-bg', hexToRgba(row, document.body?.classList.contains('dark-mode') ? 0.16 : 0.12));
            root.style.setProperty('--rsdb-search-current-border', border);
        }

		function applyAppSettings() {
		    applyDialogPositionToAll();
		    document.documentElement.classList.toggle('no-animations', appSettings.animationsEnabled === false);
            applySearchHighlightSettings();
            applyTableViewSettings();
            ensureImportedFontOptions();
		    const vk = document.getElementById('virtualKeyboard');
		    if (vk) {
		        vk.classList.toggle('shortcut-wrap-enabled', !!appSettings.shortcutWrap);
		        const height = Number(appSettings.virtualKeyboardHeight);
		        if (Number.isFinite(height) && height > 0) vk.style.height = `${Math.round(height)}px`;
		        else vk.style.height = '';
		        const bottomOffset = Number(appSettings.virtualKeyboardBottomOffset);
		        const blank = Number.isFinite(bottomOffset) && bottomOffset >= 0 ? Math.round(bottomOffset) : 0;
		        vk.style.bottom = '0px';
		        vk.style.paddingBottom = `${blank + 2}px`;
		    }
		    window.applyVirtualKeyboardAppearance?.();
		    applySnackbarSettings();
            const toolbarScale = Math.max(50, Math.min(150, Number(appSettings.toolbarScale) || 100));
            document.documentElement.style.setProperty('--rsdb-shortcut-toolbar-scale', String(toolbarScale / 100));
            window.syncShortcutToolbarHitBox?.();
            window.refreshShortcutToolbarLayout?.();
		    updateSettingsUI();
		    updateHistoryFeatureAvailability();
		    generateVirtualKeyboard();
		}

		function setShortcutEditMode(enabled) {
		    const next = !!enabled;
		    if (next && currentShortcutFieldKey) {
		        const templates = getTemplatesByField(currentShortcutFieldKey) || [];
		        const displayed = typeof getShortcutDisplayOrder === 'function'
		            ? getShortcutDisplayOrder(currentShortcutFieldKey, templates)
		            : templates.slice();
		        shortcutEditSession = {
		            fieldKey: currentShortcutFieldKey,
		            original: templates.slice(),
		            working: displayed
		        };
		    }
		    if (!next && shortcutEditMode && shortcutEditSession && shortcutEditSession.fieldKey === currentShortcutFieldKey) {
		        const templates = getTemplatesByField(currentShortcutFieldKey);
		        if (templates) {
		            templates.splice(0, templates.length, ...(shortcutEditSession.working || []));
		            KeyboardConfigManager.save();
		        }
		        shortcutEditSession = null;
		    }
		    if (!next) {
		        shortcutEditSession = null;
		    }
		    shortcutEditMode = next;
		    const vk = document.getElementById('virtualKeyboard');
		    if (vk) vk.classList.toggle('shortcut-edit-mode', shortcutEditMode);
		    const editBtn = document.getElementById('shortcutEditToggleBtn');
		    if (editBtn) editBtn.setAttribute('icon', shortcutEditMode ? 'check' : 'edit');
		    const cancelBtn = document.getElementById('shortcutEditCancelBtn');
		    if (cancelBtn) cancelBtn.style.display = shortcutEditMode ? '' : 'none';
		    if (editBtn) editBtn.style.color = shortcutEditMode ? '#4caf50' : '';
		    if (cancelBtn) cancelBtn.style.color = shortcutEditMode ? '#f44336' : '';
		    const clearBtn = document.getElementById('shortcutClearInputBtn');
		    if (clearBtn) clearBtn.style.display = shortcutEditMode ? 'none' : '';
		    generateVirtualKeyboard();
		}

		function cancelShortcutEditMode() {
		    shortcutEditSession = null;
		    shortcutEditMode = false;
		    const vk = document.getElementById('virtualKeyboard');
		    if (vk) vk.classList.remove('shortcut-edit-mode');
		    const editBtn = document.getElementById('shortcutEditToggleBtn');
		    if (editBtn) editBtn.setAttribute('icon', 'edit');
		    const cancelBtn = document.getElementById('shortcutEditCancelBtn');
		    if (cancelBtn) cancelBtn.style.display = 'none';
		    if (editBtn) editBtn.style.color = '';
		    if (cancelBtn) cancelBtn.style.color = '';
		    const clearBtn = document.getElementById('shortcutClearInputBtn');
		    if (clearBtn) clearBtn.style.display = '';
		    generateVirtualKeyboard();
		}

		function highlightShortcutInKeyboard(value) {
		    if (!value) return;
		    const vk = document.getElementById('virtualKeyboard');
		    if (!vk) return;
		    const keys = Array.from(vk.querySelectorAll('.shortcut-key, .status-key'));
		    const target = keys.find(k => (k.textContent || '').trim() === value.trim());
		    if (!target) return;
		    target.classList.add('shortcut-highlight');
		    target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		    setTimeout(() => target.classList.remove('shortcut-highlight'), 1200);
		}

		function beginShortcutDrag(e, keyElement) {
		    if (!shortcutEditMode) return;
		    if (!currentShortcutFieldKey) return;
		    if (!keyElement?.dataset?.value) return;
		    const container = document.getElementById('shortcutKeysContainer');
		    if (!container) return;
		    const scroller = document.getElementById('shortcutContainer') || container;
		    const rect = keyElement.getBoundingClientRect();
		    const ghost = keyElement.cloneNode(true);
		    ghost.style.position = 'fixed';
		    ghost.style.left = `${rect.left}px`;
		    ghost.style.top = `${rect.top}px`;
		    ghost.style.width = `${rect.width}px`;
		    ghost.style.height = `${rect.height}px`;
		    ghost.style.zIndex = '20001';
		    ghost.style.pointerEvents = 'none';
		    ghost.style.opacity = '0.92';
		    ghost.style.animation = 'none';
		    ghost.classList.add('shortcut-drag-ghost');
		    document.body.appendChild(ghost);

		    const placeholder = document.createElement('div');
		    placeholder.className = `${keyElement.className} shortcut-placeholder`;
		    placeholder.style.width = `${rect.width}px`;
		    placeholder.style.height = `${rect.height}px`;
		    placeholder.dataset.value = keyElement.dataset.value;
		    container.insertBefore(placeholder, keyElement);
		    keyElement.style.display = 'none';

		    shortcutDragState = {
		        pointerId: e.pointerId,
		        container,
		        scroller,
		        ghost,
		        placeholder,
		        dragged: keyElement,
		        offsetX: e.clientX - rect.left,
		        offsetY: e.clientY - rect.top,
		        lastX: e.clientX,
		        lastY: e.clientY,
		        scrollDir: 0,
		        scrollRaf: 0
		    };
		    window.addEventListener('pointermove', updateShortcutDrag, { passive: true });
		    window.addEventListener('pointerup', endShortcutDrag, { passive: true });
		    window.addEventListener('pointercancel', endShortcutDrag, { passive: true });
		}

		function reorderShortcutPlaceholderAtPoint(clientX, clientY) {
		    const s = shortcutDragState;
		    if (!s) return;
		    const el = document.elementFromPoint(clientX, clientY);
		    const target = el?.closest?.('.shortcut-draggable');
		    if (!target) return;
		    if (target === s.dragged) return;
		    if (target.parentElement !== s.container) return;
		    const r = target.getBoundingClientRect();
		    const before = clientX < r.left + r.width / 2;
		    s.container.insertBefore(s.placeholder, before ? target : target.nextSibling);
		}

		function stopShortcutAutoScroll() {
		    const s = shortcutDragState;
		    if (!s) return;
		    if (s.scrollRaf) cancelAnimationFrame(s.scrollRaf);
		    s.scrollRaf = 0;
		    s.scrollDir = 0;
		}

		function stepShortcutAutoScroll() {
		    const s = shortcutDragState;
		    if (!s || !s.scroller || !s.scrollDir) {
		        stopShortcutAutoScroll();
		        return;
		    }
		    const sc = s.scroller;
		    const maxScroll = Math.max(0, sc.scrollHeight - sc.clientHeight);
		    if (!maxScroll) {
		        stopShortcutAutoScroll();
		        return;
		    }
		    const rect = sc.getBoundingClientRect();
		    const EDGE = 36;
		    const dist = s.scrollDir < 0 ? (s.lastY - rect.top) : (rect.bottom - s.lastY);
		    const t = Math.max(0, Math.min(1, (EDGE - dist) / EDGE));
		    const speed = 6 + t * 18;
		    const prevTop = sc.scrollTop;
		    sc.scrollTop = Math.max(0, Math.min(maxScroll, sc.scrollTop + s.scrollDir * speed));
		    if (sc.scrollTop !== prevTop) {
		        reorderShortcutPlaceholderAtPoint(s.lastX, s.lastY);
		    }
		    s.scrollRaf = requestAnimationFrame(stepShortcutAutoScroll);
		}

		function updateShortcutDrag(e) {
		    const s = shortcutDragState;
		    if (!s) return;
		    if (e.pointerId !== s.pointerId) return;
		    s.ghost.style.left = `${e.clientX - s.offsetX}px`;
		    s.ghost.style.top = `${e.clientY - s.offsetY}px`;
		    s.lastX = e.clientX;
		    s.lastY = e.clientY;

		    reorderShortcutPlaceholderAtPoint(e.clientX, e.clientY);

		    const sc = s.scroller;
		    if (sc && sc.scrollHeight > sc.clientHeight) {
		        const rect = sc.getBoundingClientRect();
		        const EDGE = 36;
		        let dir = 0;
		        if (e.clientY < rect.top + EDGE) dir = -1;
		        else if (e.clientY > rect.bottom - EDGE) dir = 1;
		        if (dir !== s.scrollDir) {
		            s.scrollDir = dir;
		            if (!dir) stopShortcutAutoScroll();
		            else if (!s.scrollRaf) s.scrollRaf = requestAnimationFrame(stepShortcutAutoScroll);
		        }
		    }
		}

		function endShortcutDrag(e) {
		    const s = shortcutDragState;
		    if (!s) return;
		    if (e?.pointerId != null && e.pointerId !== s.pointerId) return;
		    stopShortcutAutoScroll();
		    window.removeEventListener('pointermove', updateShortcutDrag);
		    window.removeEventListener('pointerup', endShortcutDrag);
		    window.removeEventListener('pointercancel', endShortcutDrag);

		    if (s.container?.isConnected && s.placeholder?.isConnected) {
		        s.container.insertBefore(s.dragged, s.placeholder);
		    }
		    s.dragged.style.display = '';
		    s.placeholder?.remove();
		    s.ghost?.remove();
		    shortcutDragState = null;

		    const templates = getTemplatesByField(currentShortcutFieldKey);
		    const ordered = Array.from(s.container.querySelectorAll('.shortcut-draggable'))
		        .map(n => n.dataset.value)
		        .filter(v => typeof v === 'string' && v.length > 0);
		    if (shortcutEditSession && shortcutEditSession.fieldKey === currentShortcutFieldKey) {
		        shortcutEditSession.working = ordered;
		    } else if (templates) {
		        beginOperation('shortcut_reorder', '重新排序快捷短语：' + (fieldLabels[currentShortcutFieldKey] || currentShortcutFieldKey));
		        templates.splice(0, templates.length, ...ordered);
		        KeyboardConfigManager.save();
		        commitOperation();
		    }
		}

		let toolbarLayoutEditIndex = -1;
		function renderToolbarShakeLayouts() {
		    const list = document.getElementById('toolbarLayoutList');
		    const count = document.getElementById('toolbarLayoutCount');
		    if (!list) return;
		    const layouts = normalizeToolbarShakeLayouts(appSettings.toolbarShakeLayouts);
		    appSettings.toolbarShakeLayouts = layouts;
		    if (count) count.textContent = layouts.length + ' / 10 个布局';
		    list.innerHTML = '';
		    layouts.forEach((layout, index) => {
		        const row = document.createElement('div');
		        row.className = 'toolbar-layout-setting-row';
		        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:12px;border:1px solid var(--border-color);border-radius:10px;background:var(--surface-container-low);';
		        const body = document.createElement('button');
		        body.type = 'button';
		        body.style.cssText = 'flex:1;text-align:left;border:0;background:transparent;color:inherit;padding:0;cursor:pointer;min-width:0;';
		        const title = document.createElement('div');
		        title.style.cssText = 'font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
		        title.textContent = (index + 1) + '. ' + layout.name;
		        const summary = document.createElement('div');
		        summary.style.cssText = 'font-size:.84rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px;';
		        summary.textContent = layout.controls.map(key => TOOLBAR_CONTROL_LABELS[key] || key).join('、');
		        body.append(title, summary);
		        body.addEventListener('click', () => openToolbarLayoutEditor(index));
		        const actions = document.createElement('div');
		        actions.style.cssText = 'display:flex;align-items:center;gap:2px;flex-shrink:0;';
		        const makeAction = (icon, label, handler, disabled) => {
		            const btn = document.createElement('mdui-button-icon');
		            btn.setAttribute('icon', icon);
		            btn.setAttribute('title', label);
		            btn.setAttribute('aria-label', label);
		            if (disabled) btn.setAttribute('disabled', '');
		            btn.addEventListener('click', e => { e.stopPropagation(); if (!disabled) handler(); });
		            return btn;
		        };
		        actions.append(
		            makeAction('arrow_upward', '上移', () => moveToolbarLayout(index, -1), index === 0),
		            makeAction('arrow_downward', '下移', () => moveToolbarLayout(index, 1), index === layouts.length - 1),
		            makeAction('delete', '删除', () => deleteToolbarLayout(index), layouts.length <= 1)
		        );
		        row.append(body, actions);
		        list.appendChild(row);
		    });
		}
		function moveToolbarLayout(index, delta) {
		    const layouts = normalizeToolbarShakeLayouts(appSettings.toolbarShakeLayouts);
		    const target = index + delta;
		    if (target < 0 || target >= layouts.length) return;
		    const temp = layouts[index]; layouts[index] = layouts[target]; layouts[target] = temp;
		    saveAppSettings({ toolbarShakeLayouts: layouts });
		    renderToolbarShakeLayouts();
		}
		function deleteToolbarLayout(index) {
		    const layouts = normalizeToolbarShakeLayouts(appSettings.toolbarShakeLayouts);
		    if (layouts.length <= 1) return;
		    layouts.splice(index, 1);
		    saveAppSettings({ toolbarShakeLayouts: layouts });
		    renderToolbarShakeLayouts();
		    showSnackbar('已删除布局', 'success');
		}
		function openToolbarLayoutEditor(index) {
		    const layouts = normalizeToolbarShakeLayouts(appSettings.toolbarShakeLayouts);
		    toolbarLayoutEditIndex = Number.isInteger(index) ? index : -1;
		    const current = toolbarLayoutEditIndex >= 0 ? layouts[toolbarLayoutEditIndex] : { id: 'layout-' + Date.now(), name: '新布局', controls: ['add'] };
		    const title = document.getElementById('toolbarLayoutEditTitle');
		    const nameInput = document.getElementById('toolbarLayoutNameInput');
		    const controlsList = document.getElementById('toolbarLayoutControlsList');
		    if (title) title.textContent = toolbarLayoutEditIndex >= 0 ? '编辑晃动布局' : '新增晃动布局';
		    if (nameInput) nameInput.value = current.name;
		    if (controlsList) {
		        controlsList.innerHTML = '';
		        TOOLBAR_CONTROL_ORDER.forEach(key => {
		            const check = document.createElement('mdui-checkbox');
		            check.dataset.toolbarLayoutControl = key;
		            check.checked = current.controls.includes(key);
		            check.textContent = TOOLBAR_CONTROL_LABELS[key];
		            controlsList.appendChild(check);
		        });
		    }
		    const dlg = document.getElementById('toolbarLayoutEditDialog');
		    openDialogOnTop(dlg);
		}
		function saveToolbarLayoutEditor() {
		    const layouts = normalizeToolbarShakeLayouts(appSettings.toolbarShakeLayouts);
		    const nameInput = document.getElementById('toolbarLayoutNameInput');
		    const controls = Array.from(document.querySelectorAll('#toolbarLayoutControlsList [data-toolbar-layout-control]'))
		        .filter(el => el.checked).map(el => el.dataset.toolbarLayoutControl);
		    if (!controls.length) { showSnackbar('至少选择一个工具栏项目', 'warning'); return; }
		    const name = String(nameInput?.value || '').trim() || '新布局';
		    const item = { id: toolbarLayoutEditIndex >= 0 && layouts[toolbarLayoutEditIndex] ? layouts[toolbarLayoutEditIndex].id : 'layout-' + Date.now(), name, controls };
		    if (toolbarLayoutEditIndex >= 0) layouts[toolbarLayoutEditIndex] = item;
		    else {
		        if (layouts.length >= 10) { showSnackbar('最多支持 10 个布局', 'warning'); return; }
		        layouts.push(item);
		    }
		    saveAppSettings({ toolbarShakeLayouts: layouts });
		    renderToolbarShakeLayouts();
		    const dlg = document.getElementById('toolbarLayoutEditDialog');
		    if (dlg) dlg.open = false;
		    showSnackbar('已保存布局', 'success');
		}

		function updateSettingsUI() {
		    const rowsItem = document.getElementById('settingsShortcutRowsItem');
		    if (rowsItem) {
		        const base = Math.max(1, Math.min(3, Number(appSettings.shortcutRows) || 2));
		        const overrides = appSettings.shortcutRowsByField && typeof appSettings.shortcutRowsByField === 'object'
		            ? Object.keys(appSettings.shortcutRowsByField).filter(k => Number(appSettings.shortcutRowsByField[k]) && Number(appSettings.shortcutRowsByField[k]) !== base)
		            : [];
		        rowsItem.setAttribute('description', overrides.length ? `默认 ${base} 行（${overrides.length} 个自定义）` : `默认 ${base} 行`);
		    }
		    const thresholdItem = document.getElementById('settingsSuggestThresholdItem');
		    if (thresholdItem) thresholdItem.setAttribute('description', `${Number(appSettings.suggestThreshold) || 5} 次`);
		    const suggestSwitch = document.getElementById('settingsSuggestSwitch');
		    if (suggestSwitch) suggestSwitch.checked = !!appSettings.suggestEnabled;
		    const inputStatsSwitch = document.getElementById('settingsInputStatsSwitch');
		    if (inputStatsSwitch) inputStatsSwitch.checked = appSettings.inputStatsRecordingEnabled !== false;
		    const wrapSwitch = document.getElementById('settingsShortcutWrapSwitch');
		    if (wrapSwitch) wrapSwitch.checked = !!appSettings.shortcutWrap;
		    const autoSwitch = document.getElementById('settingsShortcutAutoCompleteSwitch');
		    if (autoSwitch) autoSwitch.checked = appSettings.shortcutAutoCompleteEnabled !== false;
		    const autoByFieldItem = document.getElementById('settingsShortcutAutoCompleteByFieldItem');
		    if (autoByFieldItem) {
		        const map = appSettings.shortcutAutoCompleteByField && typeof appSettings.shortcutAutoCompleteByField === 'object' ? appSettings.shortcutAutoCompleteByField : {};
		        const customized = Object.keys(map).filter(k => map[k] === false || map[k] === true);
		        autoByFieldItem.setAttribute('description', customized.length ? `已设置 ${customized.length} 项` : '跟随全局');
		    }
		    const shakeItem = document.getElementById('settingsToolbarShakeItem');
		    if (shakeItem) {
		        const layouts = normalizeToolbarShakeLayouts(appSettings.toolbarShakeLayouts);
		        shakeItem.setAttribute('description', appSettings.toolbarShakeEnabled === false
		            ? '已关闭'
		            : '已开启，幅度 ' + (Number(appSettings.toolbarShakeAmplitude) || 50) + '%，' + layouts.length + ' 个布局');
		    }
		    const shakeSwitch = document.getElementById('toolbarShakeEnabledSwitch');
		    if (shakeSwitch) shakeSwitch.checked = appSettings.toolbarShakeEnabled !== false;
		    const shakeAnimationSwitch = document.getElementById('toolbarShakeAnimationSwitch');
		    if (shakeAnimationSwitch) shakeAnimationSwitch.checked = appSettings.toolbarShakeAnimation !== false;
		    const scaleSlider = document.getElementById('toolbarScaleSlider');
		    const scaleValue = document.getElementById('toolbarScaleValue');
		    const toolbarScale = Math.max(50, Math.min(150, Number(appSettings.toolbarScale) || 100));
		    if (scaleSlider) scaleSlider.value = String(toolbarScale);
		    if (scaleValue) scaleValue.textContent = toolbarScale + '%';
		    const shakeSlider = document.getElementById('toolbarShakeAmplitudeSlider');
		    const shakeValue = document.getElementById('toolbarShakeAmplitudeValue');
		    if (shakeSlider) shakeSlider.value = String(Number(appSettings.toolbarShakeAmplitude) || 50);
		    if (shakeValue) shakeValue.textContent = (Number(appSettings.toolbarShakeAmplitude) || 50) + '%';
		    const shortcutFontSlider = document.getElementById('shortcutFontSizeSlider');
		    const shortcutFontValue = document.getElementById('shortcutFontSizeValue');
		    const shortcutFontSize = Math.max(12, Math.min(28, Number(appSettings.shortcutFontSize) || 16));
		    if (shortcutFontSlider) shortcutFontSlider.value = String(shortcutFontSize);
		    if (shortcutFontValue) shortcutFontValue.textContent = shortcutFontSize + 'px';
		    document.documentElement.style.setProperty('--rsdb-shortcut-font-size', shortcutFontSize + 'px');
		    const shortcutChipSlider = document.getElementById('shortcutChipScaleSlider');
		    const shortcutChipValue = document.getElementById('shortcutChipScaleValue');
		    const shortcutChipScale = Math.max(70, Math.min(160, Number(appSettings.shortcutChipScale) || 100));
		    if (shortcutChipSlider) shortcutChipSlider.value = String(shortcutChipScale);
		    if (shortcutChipValue) shortcutChipValue.textContent = shortcutChipScale + '%';
		    document.documentElement.style.setProperty('--rsdb-shortcut-chip-scale', String(shortcutChipScale / 100));
		    const shakeEffectSelect = document.getElementById('toolbarShakeEffectSelect');
		    const shakeEffectDuration = document.getElementById('toolbarShakeEffectDurationInput');
		    const shakeEffectHtml = document.getElementById('toolbarShakeEffectHtmlInput');
		    const shakeEffectCss = document.getElementById('toolbarShakeEffectCssInput');
		    const shakeEffectJs = document.getElementById('toolbarShakeEffectJsInput');
		    const shakeCustomFields = document.getElementById('toolbarShakeCustomEffectFields');
		    if (shakeEffectSelect) shakeEffectSelect.value = appSettings.toolbarShakeEffect || 'confetti';
		    if (shakeEffectDuration) shakeEffectDuration.value = String(Number(appSettings.toolbarShakeEffectDuration) || 5000);
		    if (shakeEffectHtml) shakeEffectHtml.value = appSettings.toolbarShakeEffectHtml || '<div id="effect-root"></div>';
		    if (shakeEffectCss) shakeEffectCss.value = appSettings.toolbarShakeEffectCss || '';
		    if (shakeEffectJs) shakeEffectJs.value = appSettings.toolbarShakeEffectJs || '';
		    if (shakeCustomFields) shakeCustomFields.hidden = (appSettings.toolbarShakeEffect || 'confetti') !== 'custom';
		    renderToolbarShakeLayouts();
		    const keyboardModeItem = document.getElementById('settingsKeyboardModeByFieldItem');
		    if (keyboardModeItem) {
		        const map = appSettings.keyboardModeByField && typeof appSettings.keyboardModeByField === 'object' ? appSettings.keyboardModeByField : {};
		        const customized = Object.keys(map).filter(k => map[k] === 'virtual' || map[k] === 'system');
		        keyboardModeItem.setAttribute('description', customized.length ? `已设置 ${customized.length} 项，未设置字段跟随桌面模式` : (appSettings.desktopModeEnabled ? '未设置字段默认系统键盘' : '备注默认系统键盘，其余默认虚拟键盘'));
		    }
		    const desktopModeSwitch = document.getElementById('settingsDesktopModeSwitch');
		    if (desktopModeSwitch) desktopModeSwitch.checked = appSettings.desktopModeEnabled === true;
		    const posItem = document.getElementById('settingsShortcutAddPositionItem');
		    if (posItem) posItem.setAttribute('description', appSettings.shortcutAddPosition === 'last' ? '最后一个' : '第一个');
		    const rankSwitch = document.getElementById('settingsShortcutRankByClicksSwitch');
		    if (rankSwitch) rankSwitch.checked = appSettings.shortcutRankByClicks === true;
		    const compressItem = document.getElementById('settingsImageCompressItem');
		    if (compressItem) {
		        const map = { ask: '每次询问', compress: '总是压缩', force: '总是原图' };
		        compressItem.setAttribute('description', map[appSettings.imageCompressPolicy] || '每次询问');
		    }
		    const thresholdMB = Math.max(0.5, Math.min(50, Number(appSettings.largeImageThresholdMB) || 5));
		    const compressListItem = document.getElementById('settingsAlwaysCompressItem');
		    if (compressListItem) compressListItem.setAttribute('description', `超过 ${thresholdMB}MB 自动压缩上传`);
		    const forceListItem = document.getElementById('settingsAlwaysForceItem');
		    if (forceListItem) forceListItem.setAttribute('description', `超过 ${thresholdMB}MB 直接上传原图`);
		    const alwaysCompressSwitch = document.getElementById('settingsAlwaysCompressSwitch');
		    const alwaysForceSwitch = document.getElementById('settingsAlwaysForceSwitch');
		    if (alwaysCompressSwitch) alwaysCompressSwitch.checked = appSettings.imageCompressPolicy === 'compress';
		    if (alwaysForceSwitch) alwaysForceSwitch.checked = appSettings.imageCompressPolicy === 'force';
		    const dialogPosItem = document.getElementById('settingsDialogPositionItem');
		    if (dialogPosItem) {
		        const positions = Array.isArray(appSettings.dialogPositions) ? appSettings.dialogPositions : ['center'];
		        dialogPosItem.setAttribute('description', positions.length ? positions.join(' + ') : '居中');
		    }
        const suggestByFieldItem = document.getElementById('settingsSuggestByFieldItem');
        if (suggestByFieldItem) {
            const map = appSettings.suggestEnabledByField && typeof appSettings.suggestEnabledByField === 'object' ? appSettings.suggestEnabledByField : {};
            const customized = Object.keys(map).filter(k => map[k] === false || map[k] === true);
            suggestByFieldItem.setAttribute('description', customized.length ? `已设置 ${customized.length} 项` : '跟随全局');
        }
		    const keyboardSizeItem = document.getElementById('settingsKeyboardSizeItem');
		    if (keyboardSizeItem) {
		        const h = Number(appSettings.virtualKeyboardHeight);
		        const b = Number(appSettings.virtualKeyboardBottomOffset);
		        const hText = Number.isFinite(h) && h > 0 ? `${Math.round(h)}px` : '自动';
		        const bText = Number.isFinite(b) && b > 0 ? `${Math.round(b)}px` : '0px';
		        keyboardSizeItem.setAttribute('description', `高度 ${hText}，底部 ${bText}`);
		    }
            const vkVisualItem = document.getElementById('settingsKeyboardVisualEditorItem');
            if (vkVisualItem) vkVisualItem.setAttribute('description', '可视化编辑键位、大小与位置');
		    const keyboardAppearanceItem = document.getElementById('settingsKeyboardAppearanceItem');
		    if (keyboardAppearanceItem) {
		        const effectLabels = { material3: 'Material 3 水波纹', bounce: '弹性按压', custom: '自定义代码' };
		        keyboardAppearanceItem.setAttribute('description', effectLabels[appSettings.keyboardPressEffect] || effectLabels.material3);
		    }
            const dynamicVarsItem = document.getElementById('settingsDynamicVariablesItem');
            if (dynamicVarsItem) {
                const count = Array.isArray(KeyboardConfigManager?.config?.dynamicVariables) ? KeyboardConfigManager.config.dynamicVariables.length : 0;
                dynamicVarsItem.setAttribute('description', `${count} 个变量，可搜索/测试/批量删除`);
            }
            const tableViewItem = document.getElementById('settingsTableViewItem');
            if (tableViewItem) {
                const s = Number(appSettings.tableScaleDefault) || 0.5;
                const w = Number(appSettings.tableCellWidth) || 80;
                const h = Number(appSettings.tableCellHeight) || 48;
                const formGap = Number(appSettings.dataFormFieldGap) || 8;
                tableViewItem.setAttribute('description', `缩放 ${s.toFixed(2)}，单元格 ${w}×${h}px，编辑框间距 ${formGap}px`);
            }
		    const imageKeepSwitch = document.getElementById('settingsImageKeepTransformSwitch');
		    if (imageKeepSwitch) imageKeepSwitch.checked = appSettings.imagePreviewKeepTransform !== false;
		    const cursorHandleItem = document.getElementById('settingsCursorHandleItem');
		    if (cursorHandleItem) cursorHandleItem.setAttribute('description', `${Number(appSettings.cursorHandleDuration) || 0} 毫秒`);
		    const snackbarItem = document.getElementById('settingsSnackbarItem');
		    if (snackbarItem) {
		        const placement = appSettings.snackbarPlacement || 'bottom-center';
		        const mode = appSettings.snackbarDismissMode === 'button' ? '按钮关闭' : '右滑关闭';
		        snackbarItem.setAttribute('description', `${placement}，${mode}`);
		    }
		    const historyStorageSwitch = document.getElementById('settingsHistoryStorageSwitch');
		    if (historyStorageSwitch) historyStorageSwitch.checked = appSettings.historyStorageEnabled !== false;
		    const historyItem = document.getElementById('settingsHistoryMaxCountItem');
		    if (historyItem) {
		        historyItem.setAttribute('description', `最近 ${Number(appSettings.operationHistoryMaxCount) || 8} 条`);
		        const disabled = appSettings.historyStorageEnabled === false;
		        historyItem.classList.toggle('settings-item-disabled', disabled);
		        if (disabled) historyItem.setAttribute('disabled', '');
		        else historyItem.removeAttribute('disabled');
		    }
		    const undoRedoSwitch = document.getElementById('settingsUndoRedoEnabledSwitch');
		    if (undoRedoSwitch) undoRedoSwitch.checked = appSettings.undoRedoEnabled !== false;
		    const undoRedoItem = document.getElementById('settingsUndoRedoMaxStepsItem');
		    if (undoRedoItem) {
		        undoRedoItem.setAttribute('description', `最多 ${Number(appSettings.undoRedoMaxSteps) || 10} 步`);
		        const disabled = appSettings.undoRedoEnabled === false;
		        undoRedoItem.classList.toggle('settings-item-disabled', disabled);
		        if (disabled) undoRedoItem.setAttribute('disabled', '');
		        else undoRedoItem.removeAttribute('disabled');
		    }
		    const animSwitch = document.getElementById('settingsAnimationsSwitch');
		    if (animSwitch) animSwitch.checked = appSettings.animationsEnabled !== false;
		    const primaryItem = document.getElementById('settingsPrimaryColorItem');
		    if (primaryItem) {
		        const color = localStorage.getItem(PRIMARY_KEY) || getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#00796b';
		        primaryItem.setAttribute('description', color);
		    }
		    const searchHighlightItem = document.getElementById('settingsSearchHighlightItem');
		    if (searchHighlightItem) {
		        searchHighlightItem.setAttribute('description', `${appSettings.searchMatchHighlightColor} / ${appSettings.searchRowHighlightColor} / ${appSettings.searchCurrentBorderColor}`);
		    }
		    const aboutItem = document.getElementById('settingsAboutItem');
		    if (aboutItem) aboutItem.setAttribute('description', `版本 ${RSDB_VERSION}`);
		    const policyGroup = document.getElementById('imageCompressPolicyGroup');
		    if (policyGroup) policyGroup.value = appSettings.imageCompressPolicy || 'ask';
		    const w = document.getElementById('imageCompressMaxWidth');
		    const h = document.getElementById('imageCompressMaxHeight');
		    const q = document.getElementById('imageCompressQuality');
		    const t = document.getElementById('largeImageThresholdMB');
		    const setValue = (el, val) => {
		        if (!el) return;
		        el.value = val;
		        try { el.setAttribute('value', val); } catch (e) {}
		    };
		    setValue(t, String(thresholdMB));
		    setValue(w, String(appSettings.imageCompressMaxWidth ?? 1280));
		    setValue(h, String(appSettings.imageCompressMaxHeight ?? 1280));
		    setValue(q, String(appSettings.imageCompressQuality ?? 0.8));
		    const useW = document.getElementById('imageCompressUseMaxWidth');
		    const useH = document.getElementById('imageCompressUseMaxHeight');
		    const setChecked = (el, checked) => {
		        if (!el) return;
		        el.checked = !!checked;
		        if (checked) el.setAttribute('checked', '');
		        else el.removeAttribute('checked');
		    };
		    setChecked(useW, appSettings.imageCompressUseMaxWidth !== false);
		    setChecked(useH, appSettings.imageCompressUseMaxHeight !== false);
		    if (w) w.disabled = false;
		    if (h) h.disabled = false;
		    const rowsGroup = document.getElementById('shortcutRowsGroup');
		    const baseRows = Math.max(1, Math.min(3, Number(appSettings.shortcutRows) || 2));
		    if (rowsGroup) rowsGroup.value = String(baseRows);
		    const map = appSettings.shortcutRowsByField || {};
		    const setGroup = (id, fieldKey) => {
		        const el = document.getElementById(id);
		        if (!el) return;
		        const v = Math.max(1, Math.min(3, Number(map[fieldKey]) || baseRows));
		        el.value = String(v);
		    };
		    setGroup('shortcutRowsGroup_steelType', 'steelType');
		    setGroup('shortcutRowsGroup_productId', 'productId');
		    setGroup('shortcutRowsGroup_cardId', 'cardId');
		    setGroup('shortcutRowsGroup_furnaceId', 'furnaceId');
		    setGroup('shortcutRowsGroup_status', 'status');
		    setGroup('shortcutRowsGroup_position', 'position');
		    const dialogTop = document.getElementById('dialogPosTop');
		    const dialogCenter = document.getElementById('dialogPosCenter');
		    if (dialogTop || dialogCenter) {
		        const positions = Array.isArray(appSettings.dialogPositions) ? appSettings.dialogPositions : ['center'];
		        if (dialogTop) dialogTop.checked = positions.includes('top');
		        if (dialogCenter) dialogCenter.checked = positions.includes('center') || positions.length === 0;
		    }
		    const thresholdInput = document.getElementById('suggestThresholdInput');
		    if (thresholdInput) thresholdInput.value = String(Number(appSettings.suggestThreshold) || 5);
		    const vkHeightInput = document.getElementById('vkHeightInput');
		    const vkBottomInput = document.getElementById('vkBottomOffsetInput');
		    const vkHeightSlider = document.getElementById('vkHeightSlider');
		    const vkBottomSlider = document.getElementById('vkBottomOffsetSlider');
		    if (vkHeightInput) vkHeightInput.value = appSettings.virtualKeyboardHeight ? String(appSettings.virtualKeyboardHeight) : '';
		    if (vkBottomInput) vkBottomInput.value = String(Number(appSettings.virtualKeyboardBottomOffset) || 0);
		    const hNum = Number(appSettings.virtualKeyboardHeight);
		    if (vkHeightSlider) vkHeightSlider.value = String(Number.isFinite(hNum) && hNum > 0 ? Math.round(hNum) : 420);
		    const bNum = Number(appSettings.virtualKeyboardBottomOffset);
		    if (vkBottomSlider) vkBottomSlider.value = String(Number.isFinite(bNum) && bNum >= 0 ? Math.round(bNum) : 0);
            const tableScaleInput = document.getElementById('tableScaleDefaultInput');
            const tableCellWInput = document.getElementById('tableCellWidthInput');
            const tableCellHInput = document.getElementById('tableCellHeightInput');
            const tableCellFsInput = document.getElementById('tableCellFontSizeInput');
            const tablePageSizeInput = document.getElementById('tablePageSizeInput');
            const dataFormFieldGapInput = document.getElementById('dataFormFieldGapInput');
            const dataFormPaddingInput = document.getElementById('dataFormPaddingInput');
            if (tableScaleInput) tableScaleInput.value = String(Number(appSettings.tableScaleDefault) || 0.5);
            if (tableCellWInput) tableCellWInput.value = String(Number(appSettings.tableCellWidth) || 80);
            if (tableCellHInput) tableCellHInput.value = String(Number(appSettings.tableCellHeight) || 48);
            if (tableCellFsInput) tableCellFsInput.value = String(Number(appSettings.tableCellFontSize) || 16);
            if (tablePageSizeInput) tablePageSizeInput.value = String(Number(appSettings.tablePageSize) || 50);
            if (dataFormFieldGapInput) dataFormFieldGapInput.value = String(Number(appSettings.dataFormFieldGap) || 8);
            if (dataFormPaddingInput) dataFormPaddingInput.value = String(Number(appSettings.dataFormPadding) || 12);

		}

		function updateHistoryFeatureAvailability() {
		    const undoItem = document.getElementById('undoMenuItem');
		    const redoItem = document.getElementById('redoMenuItem');
		    const opHistoryItem = document.getElementById('operationHistoryMenuItem');
		    const undoDisabled = appSettings.undoRedoEnabled === false;
		    const historyDisabled = appSettings.historyStorageEnabled === false;
		    if (undoItem) undoDisabled ? undoItem.setAttribute('disabled', '') : undoItem.removeAttribute('disabled');
		    if (redoItem) undoDisabled ? redoItem.setAttribute('disabled', '') : redoItem.removeAttribute('disabled');
		    if (dom.topUndoBtn) undoDisabled ? dom.topUndoBtn.setAttribute('disabled', '') : dom.topUndoBtn.removeAttribute('disabled');
		    if (dom.topRedoBtn) undoDisabled ? dom.topRedoBtn.setAttribute('disabled', '') : dom.topRedoBtn.removeAttribute('disabled');
		    if (opHistoryItem) historyDisabled ? opHistoryItem.setAttribute('disabled', '') : opHistoryItem.removeAttribute('disabled');
		}
		const inputFieldOrder = [
		  'steelType', 'productId', 'cardId', 'furnaceId',
		  'actualDiameter', 'diameter', 'length', 'weight',
		  'status', 'position', 'hardness', 'remarks'
		];

		const fieldLabels = {
		    'steelType': '钢种',
		    'productId': '产品号',
		    'cardId': '卡片号',
		    'furnaceId': '炉号',
		    'actualDiameter': '实际直径',
		    'diameter': '直径',
		    'length': '长度',
		    'weight': '重量',
		    'status': '状态',
		    'position': '位置',
		    'hardness': '硬度',
		    'remarks': '备注'
		};

		function getConfiguredKeyboardMode(fieldId) {
		    const map = appSettings.keyboardModeByField && typeof appSettings.keyboardModeByField === 'object'
		        ? appSettings.keyboardModeByField : {};
		    if (map[fieldId] === 'system' || map[fieldId] === 'virtual') return map[fieldId];
		    if (appSettings.desktopModeEnabled === true) return 'system';
		    return fieldId === 'remarks' ? 'system' : 'virtual';
		}

		function isVirtualKeyboardConfigured(fieldId) {
		    return getConfiguredKeyboardMode(fieldId) === 'virtual';
		}

		function isInputUsingVirtualKeyboard(input = currentInput, fieldId = input?.id) {
		    if (!input) return false;
		    if (input.hasAttribute?.('readonly')) return true;
		    const previewFieldId = imagePreviewEditState?.active && imagePreviewEditState.previewInput === input
		        ? imagePreviewEditState.fieldId : fieldId;
		    return isVirtualKeyboardConfigured(previewFieldId);
		}

		function applyConfiguredKeyboardMode(input, fieldId = input?.id) {
		    if (!input) return false;
		    const useVirtual = isVirtualKeyboardConfigured(fieldId);
		    input.toggleAttribute('readonly', useVirtual);
		    input.classList.toggle('readonly-input', useVirtual);
		    window.updateEditInputModeUI?.(input);
		    return useVirtual;
		}

		function hasCurrentShortcutItems() {
		    return !!dom?.shortcutKeysContainer?.querySelector('.shortcut-key:not(.suggest-add-key), .status-key:not(.suggest-add-key)');
		}

		function isCurrentEditingSurfaceActive() {
		    const input = currentInput;
		    if (!input || !document.contains(input)) return false;
		    if (!input.matches?.('input, textarea, [contenteditable="true"]')) return false;
		    const dialog = input.closest('mdui-dialog');
		    if (dialog && dialog.open !== true) return false;
		    const modal = input.closest('.modal-custom');
		    if (modal && getComputedStyle(modal).display === 'none') return false;
		    return true;
		}

		function syncDesktopShortcutPanelViewport() {
		    const vk = dom?.virtualKeyboard;
		    if (!vk) return;
		    const isSystemPanel = appSettings.desktopModeEnabled === true
		        && vk.classList.contains('desktop-shortcuts-only');
		    if (!isSystemPanel) {
		        vk.style.removeProperty('bottom');
		        return;
		    }
		    const viewport = window.visualViewport;
		    const viewportHeight = Number(viewport?.height) || window.innerHeight || 0;
		    const viewportOffsetTop = Number(viewport?.offsetTop) || 0;
		    const keyboardHeight = Math.max(0, Math.round((window.innerHeight || viewportHeight) - viewportHeight - viewportOffsetTop));
		    vk.style.setProperty('bottom', `${keyboardHeight}px`);
		}

		function syncShortcutToolbarVisibility() {
		    const vk = dom?.virtualKeyboard;
		    const toolbarWrap = document.getElementById('shortcutToolbarWrap');
		    const toolbar = document.getElementById('shortcutToolbar');
		    if (!vk) return false;
		    const computedDisplay = window.getComputedStyle(vk).display;
		    const keyboardSurfaceVisible = vk.dataset.closing !== '1' && vk.style.display !== 'none' && computedDisplay !== 'none';
		    const fullVirtualKeyboardVisible = keyboardSurfaceVisible && !vk.classList.contains('desktop-shortcuts-only');
		    const shortcutPanelVisible = keyboardSurfaceVisible && (
		        desktopShortcutPanelActive || vk.classList.contains('desktop-shortcuts-only')
		    );
		    const editingActive = isCurrentEditingSurfaceActive();
		    const shouldShow = editingActive && (fullVirtualKeyboardVisible || shortcutPanelVisible || desktopShortcutPanelActive);
		    syncDesktopShortcutPanelViewport();
		    if (toolbar) toolbar.style.display = shouldShow ? 'flex' : 'none';
		    if (toolbarWrap) toolbarWrap.style.display = shouldShow ? 'block' : 'none';
		    if (shouldShow) window.syncShortcutToolbarHitBox?.();
		    return shouldShow;
		}

		function setDesktopShortcutPanelVisible(visible) {
		    const vk = dom?.virtualKeyboard;
		    if (!vk) return;
		    const shouldShow = !!visible
		        && appSettings.desktopModeEnabled === true
		        && isCurrentEditingSurfaceActive()
		        && !isInputUsingVirtualKeyboard(currentInput);
		    if (!shouldShow) {
		        desktopShortcutPanelActive = false;
		        if (vk.classList.contains('desktop-shortcuts-only')) {
		            vk.classList.remove('desktop-shortcuts-only', 'vk-visible');
		            vk.style.display = 'none';
		        }
		        syncShortcutToolbarVisibility();
		        return;
		    }
		    desktopShortcutPanelActive = true;
		    delete vk.dataset.closing;
		    vk.classList.add('desktop-shortcuts-only');
		    vk.style.pointerEvents = 'auto';
		    vk.style.display = 'block';
		    vk.classList.add('vk-visible');
		    syncShortcutToolbarVisibility();
		}

		function showDesktopShortcutPanel(input = currentInput) {
		    if (!input || appSettings.desktopModeEnabled !== true || isInputUsingVirtualKeyboard(input)) {
		        setDesktopShortcutPanelVisible(false);
		        return;
		    }
		    currentInput = input;
		    window.__rsdbDesktopShortcutInput = input;
		    updateKeyboardForInput(input);
		    // 系统键盘模式不显示按键区，但仍需生成当前字段的快捷短语。
		    generateVirtualKeyboard();
		    requestAnimationFrame(() => setDesktopShortcutPanelVisible(true));
		}

		function bindDesktopShortcutPanelViewport() {
		    const sync = () => {
		        syncDesktopShortcutPanelViewport();
		        syncShortcutToolbarVisibility();
		    };
		    window.addEventListener('resize', sync, { passive: true });
		    window.visualViewport?.addEventListener('resize', sync, { passive: true });
		    window.visualViewport?.addEventListener('scroll', sync, { passive: true });
		}

		function scheduleDesktopShortcutPanelSync() {
		    if (window.__rsdbDesktopShortcutSyncRaf) cancelAnimationFrame(window.__rsdbDesktopShortcutSyncRaf);
		    const sync = () => {
		        window.__rsdbDesktopShortcutSyncRaf = 0;
		        const hasShortcuts = hasCurrentShortcutItems();
		        if (desktopShortcutPanelActive || (currentInput && isCurrentEditingSurfaceActive() && !isInputUsingVirtualKeyboard(currentInput) && appSettings.desktopModeEnabled === true)) {
		            setDesktopShortcutPanelVisible(true);
		        }
		        syncShortcutToolbarVisibility();
		    };
		    window.__rsdbDesktopShortcutSyncRaf = requestAnimationFrame(sync);
		    // Dialog/keyboard transitions can temporarily report display:none; sync once more after layout settles.
		    setTimeout(() => {
		        if (window.__rsdbDesktopShortcutSyncRaf === 0) sync();
		    }, 90);
		}

		function activateConfiguredInput(input) {
		    if (!input) return;
		    if (imeState.input && imeState.input !== input) commitImeComposition();
		    const useVirtual = applyConfiguredKeyboardMode(input, input.id);
		    currentInput = input;
		    updateKeyboardForInput(input);
		    if (useVirtual) {
		        showVirtualKeyboard();
		        input.focus();
		        resetCursorToEnd(input);
		    } else {
		        setVirtualKeyboardVisible(false);
		        if (appSettings.desktopModeEnabled === true) showDesktopShortcutPanel(input);
		        const virtualCursor = document.getElementById('virtualCursor');
		        if (virtualCursor) virtualCursor.style.display = 'none';
		        input.focus();
		    }
		}

		const sortFieldOptions = [
		    { value: 'cardId', label: '卡片号' },
		    { value: 'productId', label: '产品号' },
		    { value: 'steelType', label: '钢种' },
		    { value: 'furnaceId', label: '炉号' },
		    { value: 'actualDiameter', label: '实际直径' },
		    { value: 'diameter', label: '直径' },
		    { value: 'length', label: '长度' },
		    { value: 'weight', label: '重量' },
		    { value: 'status', label: '状态' },
		    { value: 'position', label: '位置' },
		    { value: 'hardness', label: '硬度' }
		];

		const numericSortFields = ['actualDiameter', 'diameter', 'length', 'weight', 'hardness'];

// ==========================================
// === UI Helpers & DOM Elements ===
// ==========================================
		const dom = {
		  themeCollapse: document.getElementById('themeCollapse'),
		  themeCollapseContent: document.getElementById('themeCollapseContent'),
		  tableBody: document.getElementById('tableBody'),
		  emptyState: document.getElementById('emptyState'),
		  itemCount: document.getElementById('itemCount'),
		  addBtn: document.getElementById('mainFab'), 
		  importItem: document.getElementById('importItem'),
		  exportItem: document.getElementById('exportItem'),
		  manualSaveItem: document.getElementById('manualSaveItem'),
		  saveAsItem: document.getElementById('saveAsItem'),
		  newDocumentItem: document.getElementById('newDocumentItem'),
		  openDocumentItem: document.getElementById('openDocumentItem'),
		  documentNameDialog: document.getElementById('documentNameDialog'),
		  documentNameInput: document.getElementById('documentNameInput'),
		  documentNameCancelBtn: document.getElementById('documentNameCancelBtn'),
		  documentNameConfirmBtn: document.getElementById('documentNameConfirmBtn'),
		  documentNameConflictDialog: document.getElementById('documentNameConflictDialog'),
		  documentNameConflictMessage: document.getElementById('documentNameConflictMessage'),
		  documentNameConflictCancelBtn: document.getElementById('documentNameConflictCancelBtn'),
		  documentNameConflictCopyBtn: document.getElementById('documentNameConflictCopyBtn'),
		  documentNameConflictOverwriteBtn: document.getElementById('documentNameConflictOverwriteBtn'),
		  openDocumentDialog: document.getElementById('openDocumentDialog'),
		  documentSearchInput: document.getElementById('documentSearchInput'),
		  documentSearchCount: document.getElementById('documentSearchCount'),
		  documentList: document.getElementById('documentList'),
		  documentListEmpty: document.getElementById('documentListEmpty'),
		  openDocumentCancelBtn: document.getElementById('openDocumentCancelBtn'),
		  documentMultiSelectBtn: document.getElementById('documentMultiSelectBtn'),
		  documentMultiSelectTooltip: document.getElementById('documentMultiSelectTooltip'),
		  documentBulkDeleteBtn: document.getElementById('documentBulkDeleteBtn'),
		  documentBulkDeleteTooltip: document.getElementById('documentBulkDeleteTooltip'),
		  documentDeleteConfirmDialog: document.getElementById('documentDeleteConfirmDialog'),
		  documentDeleteConfirmMessage: document.getElementById('documentDeleteConfirmMessage'),
		  documentDeleteCancelBtn: document.getElementById('documentDeleteCancelBtn'),
		  documentDeleteConfirmBtn: document.getElementById('documentDeleteConfirmBtn'),
		  fileInput: document.getElementById('fileInput'),
		  deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
		  editSelectedCellsBtn: document.getElementById('editSelectedCellsBtn'),
		  selectedCount: document.getElementById('selectedCount'),
		  selectAllCheckbox: document.getElementById('selectAllCheckbox'),
		  drawer: document.getElementById('drawer'),
		  openDrawerBtn: document.getElementById('openDrawerBtn'),
		  dataSheet: document.getElementById('dataSheetCustom'), 
		  closeDataModal: document.getElementById('closeDataModal'),
		  dataEditUndoBtn: document.getElementById('dataEditUndoBtn'),
		  dataEditRedoBtn: document.getElementById('dataEditRedoBtn'),
		  saveBtn: document.getElementById('saveBtn'),
		  cancelBtn: document.getElementById('cancelBtn'),
		  dataForm: document.getElementById('dataForm'),
		  modalTitle: document.getElementById('modalTitle'),
		  editIndex: document.getElementById('editIndex'),
		  dataCellStyleDialog: document.getElementById('dataCellStyleDialog'),
		  dataCellStyleDialogTitle: document.getElementById('dataCellStyleDialogTitle'),
		  dataCellStyleUndoBtn: document.getElementById('dataCellStyleUndoBtn'),
		  dataCellStyleRedoBtn: document.getElementById('dataCellStyleRedoBtn'),
		  closeDataCellStyleDialog: document.getElementById('closeDataCellStyleDialog'),
		  dataCellStylePanelHost: document.getElementById('dataCellStylePanelHost'),
		  quickEditStylePanelAnchor: document.getElementById('quickEditStylePanelAnchor'),
		  quickEditDialog: document.getElementById('quickEditDialog'),
		  closeQuickEdit: document.getElementById('closeQuickEdit'),
		  quickEditLabel: document.getElementById('quickEditLabel'),
		  quickEditInput: document.getElementById('quickEditInput'),
		  quickEditKeyboardToggleBtn: document.getElementById('quickEditKeyboardToggleBtn'),
		  quickEditKeyboardToggleTooltip: document.getElementById('quickEditKeyboardToggleTooltip'),
		  quickEditIndex: document.getElementById('quickEditIndex'),
		  quickEditField: document.getElementById('quickEditField'),
		  quickEditUndoBtn: document.getElementById('quickEditUndoBtn'),
		  quickEditRedoBtn: document.getElementById('quickEditRedoBtn'),
		  saveQuickEditBtn: document.getElementById('saveQuickEditBtn'),
		  openFullEditBtn: document.getElementById('openFullEditBtn'),
		  quickEditFullEditConfirmDialog: document.getElementById('quickEditFullEditConfirmDialog'),
		  quickEditFullEditSaveBtn: document.getElementById('quickEditFullEditSaveBtn'),
		  quickEditFullEditDiscardBtn: document.getElementById('quickEditFullEditDiscardBtn'),
		  quickEditFullEditCancelBtn: document.getElementById('quickEditFullEditCancelBtn'),
		  confirmModal: document.getElementById('confirmModalCustom'), 
		  closeConfirmModal: document.getElementById('closeConfirmModal'),
		  confirmMessage: document.getElementById('confirmMessage'),
		  cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
		  confirmActionBtn: document.getElementById('confirmActionBtn'),
		  deleteRowConfirmDialog: document.getElementById('deleteRowConfirmDialog'),
		  closeDeleteRowDialogBtn: document.getElementById('closeDeleteRowDialogBtn'),
		  cancelDeleteRowDialogBtn: document.getElementById('cancelDeleteRowDialogBtn'),
		  confirmDeleteRowDialogBtn: document.getElementById('confirmDeleteRowDialogBtn'),
		  deleteRowDataList: document.getElementById('deleteRowDataList'),
		  deleteRowDataIndex: document.getElementById('deleteRowDataIndex'),
		  virtualKeyboard: document.getElementById('virtualKeyboard'),
		  keyboardRows: document.getElementById('keyboardRows'),
		  shortcutContainer: document.getElementById('shortcutContainer'),
		  shortcutKeysContainer: document.getElementById('shortcutKeysContainer'),
		  shortcutQuickAddBtn: document.getElementById('shortcutQuickAddBtn'),
		  shortcutEditToggleBtn: document.getElementById('shortcutEditToggleBtn'),
		  shortcutPrevInputBtn: document.getElementById('shortcutPrevInputBtn'),
		  shortcutNextInputBtn: document.getElementById('shortcutNextInputBtn'),
		  searchInput: document.getElementById('searchInput'),
		  searchClearBtn: document.getElementById('searchClearBtn'),
		  calculatorModal: document.getElementById('calculatorModalCustom'), 
		  calculatorBtn: document.getElementById('calculatorBtn'),
		  closeCalculatorModal: document.getElementById('closeCalculatorModal'),
		  calculatorForm: document.getElementById('calculatorForm'),
		  calcDiameter1: document.getElementById('calcDiameter1'),
		  calcDiameter2: document.getElementById('calcDiameter2'),
		  calcLength: document.getElementById('calcLength'),
		  calcDensity: document.getElementById('calcDensity'),
		  calcResult: document.getElementById('calcResult'),
		  calcFormula: document.getElementById('calcFormula'),
		  calcFormulaEditor: document.getElementById('calcFormulaEditor'),
		  calcFormulaStatus: document.getElementById('calcFormulaStatus'),
		  resetCalcFormulaBtn: document.getElementById('resetCalcFormulaBtn'),
		  calculateAndAddBtn: document.getElementById('calculateAndAddBtn'),
		  cancelCalcBtn: document.getElementById('cancelCalcBtn'),
		  clearCalcBtn: document.getElementById('clearCalcBtn'),
		  duplicateConfirmationModal: document.getElementById('duplicateConfirmationModalCustom'), 
		  closeDuplicateModal: document.getElementById('closeDuplicateModal'),
		  generalSnackbar: document.getElementById('general-snackbar'),
		  filterMatchRowsCheckbox: document.getElementById('filterMatchRowsCheckbox'),
		  searchMenuItem: document.getElementById('searchMenuItem'),
		  topSearchBtn: document.getElementById('topSearchBtn'),
		  topCellMultiSelectBtn: document.getElementById('topCellMultiSelectBtn'),
		  closeSearchPanelBtn: document.getElementById('closeSearchPanelBtn'),
		  topUndoBtn: document.getElementById('topUndoBtn'),
		  topRedoBtn: document.getElementById('topRedoBtn'),
		  topSaveBtn: document.getElementById('topSaveBtn'),
		  topTableZoomOutBtn: document.getElementById('topTableZoomOutBtn'),
		  topTableZoomInBtn: document.getElementById('topTableZoomInBtn'),
		  topTableZoomResetBtn: document.getElementById('topTableZoomResetBtn'),

		  cardImageInput: document.getElementById('cardImageInput'),
		uploadImageBtn: document.getElementById('uploadImageBtn'),
		cardImagePreview: document.getElementById('cardImagePreview'),
		previewImg: document.getElementById('previewImg'),
		changeImageBtn: document.getElementById('changeImageBtn'),
		deleteImageBtn: document.getElementById('deleteImageBtn'),

		  multiSelectMenuText: document.getElementById('multiSelectMenuText'), 
		  multiSelectMenuItem: document.getElementById('multiSelectMenuItem'), 
		  multiSelectCheckbox: document.getElementById('multiSelectCheckbox'), 
		  cellMultiSelectMenuItem: document.getElementById('cellMultiSelectMenuItem'),
		  cellSelectionSetMenuItem: document.getElementById('cellSelectionSetMenuItem'),
		  cellSelectionDeleteDataMenuItem: document.getElementById('cellSelectionDeleteDataMenuItem'),
		  cellSelectionDeleteStyleMenuItem: document.getElementById('cellSelectionDeleteStyleMenuItem'),
		  invertSelectionMenuItem: document.getElementById('invertSelectionMenuItem'),
		  cellColorPalette: document.getElementById('cellColorPalette'),
		  cellColorPaletteDialog: document.getElementById('cellColorPaletteDialog'),
		  closeCellColorPalette: document.getElementById('closeCellColorPalette'),
		  closeCellFontPicker: document.getElementById('closeCellFontPicker'),
		  recentCellColors: document.getElementById('recentCellColors'),
		  defaultCellColors: document.getElementById('defaultCellColors'),
		  customCellColorInput: document.getElementById('customCellColorInput'),
		  applyCustomCellColorBtn: document.getElementById('applyCustomCellColorBtn'),
		  cellStyleTextColorPreview: document.getElementById('cellStyleTextColorPreview'),
		  cellStyleBgColorPreview: document.getElementById('cellStyleBgColorPreview'),
		  quickEditInputPreview: document.getElementById('quickEditInputPreview'),
		  cellFontPickerDialog: document.getElementById('cellFontPickerDialog'),
		  cellStyleAlignTrigger: document.getElementById('cellStyleAlignTrigger'),
		  cellAlignPickerDialog: document.getElementById('cellAlignPickerDialog'),
		  closeCellAlignPicker: document.getElementById('closeCellAlignPicker'),

		  searchReplaceContainer: document.getElementById('searchReplaceContainer'),
		  replaceQueryInput: document.getElementById('replaceQuery'),       
		  searchResultCount: document.getElementById('searchResultCount'), 
		  prevMatchBtn: document.getElementById('prevMatchBtn'),           
		  nextMatchBtn: document.getElementById('nextMatchBtn'),           
		  replaceOneBtn: document.getElementById('replaceOneBtn'),         
		  replaceAllBtn: document.getElementById('replaceAllBtn'),

		  sortItem: document.getElementById('sortItem'),
		  sortModal: document.getElementById('sortModalCustom'),
		  closeSortModal: document.getElementById('closeSortModal'),
		  cancelSortBtn: document.getElementById('cancelSortBtn'),
		  applySortBtn: document.getElementById('applySortBtn'),
		  sortRulesContainer: document.getElementById('sortRulesContainer'),
		  addSortRuleBtn: document.getElementById('addSortRuleBtn'),
		  resetSortRulesBtn: document.getElementById('resetSortRulesBtn'),
		  sortRuleCount: document.getElementById('sortRuleCount'),
		  sortRulesEmptyState: document.getElementById('sortRulesEmptyState'),

		  aboutDialog: document.getElementById('aboutDialog'),
		  aboutItem: document.getElementById('aboutItem'),
		  installPwaBtn: document.getElementById('installPwaBtn'),
		  totalCountText: document.getElementById('totalCountText'),
		  bottomPrevBtn: document.getElementById('bottomPrevBtn'),    
		            bottomNextBtn: document.getElementById('bottomNextBtn'),     
		            pageInfoText: document.getElementById('pageInfoText'),       
		            pageJumpInput:document.getElementById('pageJumpInput')    
		};

// ==========================================
// === Zoom Manager (View Logic) ===
// ==========================================
const ZoomManager = {
    currentScale: Number(appSettings?.tableScaleCurrent) || Number(appSettings?.tableScaleDefault) || 0.5,
    minScale: 0.25,
    maxScale: 2.0,
    container: null,
    naturalWidth: 0,
    naturalHeight: 0,
    
    init() {
        this.container = document.querySelector('.data-table-container');
        if (!this.container) return;
        this.measureNaturalSize();
        this.bindEvents();
        this.applyScale(this.currentScale);
    },

    measureNaturalSize() {
        if (!this.container) return;
        const oldTransform = this.container.style.transform;
        const oldZoom = this.container.style.zoom;
        this.container.style.transform = 'none';
        this.container.style.zoom = '1';
        this.container.style.width = 'max-content';
        this.container.style.height = 'auto';
        this.naturalWidth = this.container.scrollWidth;
        this.naturalHeight = this.container.scrollHeight;
        this.container.style.transform = oldTransform || 'none';
        this.container.style.zoom = oldZoom || String(this.currentScale);
    },

    applyScale(scale) {
    if (!this.container) return;

    const nextScale = Math.max(this.minScale, Math.min(this.maxScale, Number(scale) || this.currentScale));
    this.currentScale = Math.round(nextScale * 100) / 100;

    // 缩放属于界面偏好，立即保存，刷新页面后恢复到本次使用的大小。
    if (Math.abs(Number(appSettings.tableScaleCurrent) - this.currentScale) > 0.0001) {
        appSettings.tableScaleCurrent = this.currentScale;
        try { localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings)); } catch (e) {}
    }

    // 使用 CSS zoom 让 sticky 表头仍参与滚动布局；transform 会使表头冻结失效。
    this.container.style.width = `${this.naturalWidth}px`;
    this.container.style.height = 'auto';
    this.container.style.transform = 'none';
    this.container.style.zoom = String(this.currentScale);
    this.container.style.transformOrigin = 'top left';

    // =================================================
    // ⭐ 终极修复：直接扩展 body 的滚动高度
    // =================================================
    const EXTRA_BOTTOM_SPACE = 32;

    const visualExtra = EXTRA_BOTTOM_SPACE / this.currentScale;

    // html + body 都改，避免浏览器差异
    document.documentElement.style.paddingBottom = `${visualExtra}px`;
    document.body.style.paddingBottom = `${visualExtra}px`;

    // 防止被 box-sizing 或 margin 抵消
    document.documentElement.style.boxSizing = 'border-box';
    document.body.style.boxSizing = 'border-box';

    this.updateToolbarButtons();
},

    updateToolbarButtons() {
        const out = document.getElementById('topTableZoomOutBtn');
        const input = document.getElementById('topTableZoomInBtn');
        if (out) out.disabled = this.currentScale <= this.minScale + 0.001;
        if (input) input.disabled = this.currentScale >= this.maxScale - 0.001;
    },

    zoomBy(delta) {
        this.applyScale(this.currentScale + delta);
    },

    resetScale() {
        const defaultScale = Math.max(this.minScale, Math.min(this.maxScale, Number(appSettings.tableScaleDefault) || 0.5));
        this.applyScale(defaultScale);
    },

    onTableUpdate() {
        setTimeout(() => {
            this.measureNaturalSize();
            this.applyScale(this.currentScale);
        }, 150);
    },

    bindEvents() {
        let startDistance = 0;
        let startScale = 1;

        const getDistance = (t1, t2) => Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

        const handlePinch = (e) => {
            if (e.touches.length !== 2) {
                if (e.type === 'touchend' || e.type === 'touchcancel') startDistance = 0;
                return;
            }
            e.preventDefault();
            const currentDist = getDistance(e.touches[0], e.touches[1]);
            if (e.type === 'touchstart') {
                startDistance = currentDist;
                startScale = this.currentScale;
            } else if (startDistance > 0) {
                const ratio = currentDist / startDistance;
                this.applyScale(startScale * ratio);
            }
        };

        ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(ev => {
            this.container.removeEventListener(ev, handlePinch, { passive: false });
            this.container.addEventListener(ev, handlePinch, { passive: false });
        });
        
        // Header double-tap reset
        const thead = document.querySelector('#dataTable thead');
        if (thead) {
            let lastTap = 0;
            thead.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTap < 300) {
                    e.preventDefault();
                    this.applyScale(Number(appSettings.tableScaleDefault) || 0.5);
                }
                lastTap = now;
            });
        }
    }
};

		const formElements = {
		  steelType: document.getElementById('steelType'),
		  productId: document.getElementById('productId'),
		  cardId: document.getElementById('cardId'),
		  furnaceId: document.getElementById('furnaceId'),
		  actualDiameter: document.getElementById('actualDiameter'),
		  diameter: document.getElementById('diameter'),
		  length: document.getElementById('length'),
		  weight: document.getElementById('weight'),
		  status: document.getElementById('status'),
		  position: document.getElementById('position'),
		  hardness: document.getElementById('hardness'),
		  remarks: document.getElementById('remarks')
		};
		const inputFields = Object.values(formElements); 



		function applySnackbarPlacement(snackbar = dom.generalSnackbar) {
          if (!snackbar) return;
          const placement = ['bottom-left', 'bottom-center', 'bottom-right', 'top-left', 'top-center', 'top-right'].includes(appSettings.snackbarPlacement)
              ? appSettings.snackbarPlacement : 'bottom-center';
          const offsetX = Number.isFinite(Number(appSettings.snackbarOffsetX)) ? Number(appSettings.snackbarOffsetX) : 0;
          const offsetY = Number.isFinite(Number(appSettings.snackbarOffsetY)) ? Number(appSettings.snackbarOffsetY) : -32;
          const [vertical, horizontal] = placement.split('-');
          snackbar.style.setProperty('position', 'fixed', 'important');
          snackbar.style.setProperty('margin', '0', 'important');
          ['top', 'bottom', 'left', 'right', 'transform'].forEach(property => snackbar.style.removeProperty(property));
          snackbar.style.setProperty('max-width', 'calc(100vw - 32px)', 'important');
          if (vertical === 'top') snackbar.style.setProperty('top', `${16 + offsetY}px`, 'important');
          else snackbar.style.setProperty('bottom', `${16 - offsetY}px`, 'important');
          if (horizontal === 'left') snackbar.style.setProperty('left', `${16 + offsetX}px`, 'important');
          else if (horizontal === 'right') snackbar.style.setProperty('right', `${16 - offsetX}px`, 'important');
          else {
              snackbar.style.setProperty('left', '50%', 'important');
              snackbar.style.setProperty('transform', `translateX(calc(-50% + ${offsetX}px))`, 'important');
          }
        }

		function showSnackbar(message, color) {
		  const snackbar = dom.generalSnackbar;
		  if (!snackbar) return;
		  window.__rsdbSnackbarToken = (Number(window.__rsdbSnackbarToken) || 0) + 1;
          applySnackbarPlacement(snackbar);
		  snackbar.innerHTML = message;
		  if (color) snackbar.color = color;
		  else snackbar.removeAttribute('color');
		  snackbar.open = true;
		}

		function showUndoSnackbar(message, expectedType) {
		  const snackbar = dom.generalSnackbar;
		  if (!snackbar) return;
		  const expectedCursor = historyCursor;
		  const expectedEntry = operationHistory[expectedCursor - 1];
		  if (!expectedEntry || expectedEntry.type !== expectedType) {
		      showSnackbar(message, 'success');
		      return;
		  }

		  const token = (Number(window.__rsdbSnackbarToken) || 0) + 1;
		  window.__rsdbSnackbarToken = token;
          applySnackbarPlacement(snackbar);
		  snackbar.removeAttribute('color');
		  snackbar.replaceChildren();

		  const label = document.createElement('span');
		  label.textContent = message;
		  const undoButton = document.createElement('mdui-button');
		  undoButton.setAttribute('slot', 'action');
		  undoButton.setAttribute('variant', 'text');
		  undoButton.textContent = '撤销';
		  undoButton.addEventListener('click', () => {
		      const isLatestOperation = historyCursor === expectedCursor
		          && operationHistory[expectedCursor - 1] === expectedEntry;
		      if (!isLatestOperation) {
		          showSnackbar('删除后已有其他操作，请使用操作历史选择恢复位置', 'warning');
		          return;
		      }
		      undoOperation();
		  }, { once: true });

		  snackbar.append(label, undoButton);
		  snackbar.open = true;
		  setTimeout(() => {
		      if (window.__rsdbSnackbarToken === token) snackbar.open = false;
		  }, 8000);
		}

		function bindImmediateActionButton(el, handler) {
		  if (!el || typeof handler !== 'function') return;
		  let ignoreClickUntil = 0;
		  if (!document.documentElement.dataset.rsdbClickGuard) {
		    document.documentElement.dataset.rsdbClickGuard = '1';
		    document.addEventListener(
		      'click',
		      (e) => {
		        if (!window.__rsdbSuppressClicksUntil) return;
		        if (Date.now() >= window.__rsdbSuppressClicksUntil) return;
		        e.preventDefault();
		        e.stopPropagation();
		      },
		      true,
		    );
		  }
		  el.addEventListener('pointerdown', (e) => {
		    if (e.pointerType === 'mouse') return;
		    ignoreClickUntil = Date.now() + 600;
		    window.__rsdbSuppressClicksUntil = Date.now() + 320;
		    if (e.cancelable) e.preventDefault();
		    e.stopPropagation();
		    handler(e);
		  }, { passive: false });
		  el.addEventListener('click', (e) => {
		    if (Date.now() < ignoreClickUntil) {
		      e.preventDefault();
		      e.stopPropagation();
		      return;
		    }
		    handler(e);
		  });
		}

		function applySnackbarSettings() {
		    const snackbar = dom.generalSnackbar;
		    if (!snackbar) return;
		    const placement = typeof appSettings.snackbarPlacement === 'string' ? appSettings.snackbarPlacement : 'bottom-center';
		    snackbar.setAttribute('placement', placement);
		    const mode = appSettings.snackbarDismissMode === 'button' ? 'button' : 'swipe';
		    snackbar.toggleAttribute('closeable', mode === 'button');
		    if (snackbar.dataset.boundSwipe) return;
		    snackbar.dataset.boundSwipe = '1';
		    let startX = 0;
		    let startY = 0;
		    let active = false;
		    const pointOf = (event, changed = false) => {
		        const touch = changed ? event.changedTouches?.[0] : event.touches?.[0];
		        return touch || event;
		    };
		    const start = (e) => {
		        if (appSettings.snackbarDismissMode !== 'swipe') return;
		        if (!snackbar.open) return;
		        const point = pointOf(e);
		        startX = point.clientX;
		        startY = point.clientY;
		        active = true;
		        snackbar.setPointerCapture?.(e.pointerId);
		    };
		    const move = (e) => {
		        if (appSettings.snackbarDismissMode !== 'swipe') return;
		        if (!active) return;
		        const point = pointOf(e);
		        const dx = point.clientX - startX;
		        const dy = point.clientY - startY;
		        if (Math.abs(dy) > 40) {
		            active = false;
		            snackbar.style.transform = '';
		            return;
		        }
		        if (dx > 0) {
		            if (e.cancelable) e.preventDefault();
		            snackbar.style.transition = 'transform 0.08s ease-out';
		            snackbar.style.transform = `translateX(${Math.min(dx, 220)}px)`;
		        }
		    };
		    const end = (e) => {
		        if (appSettings.snackbarDismissMode !== 'swipe') return;
		        if (!active) return;
		        active = false;
		        const point = pointOf(e, true);
		        const dx = point.clientX - startX;
		        const dy = point.clientY - startY;
		        if (dx > 80 && Math.abs(dy) < 40) {
		            snackbar.style.transition = 'transform 0.16s ease-out';
		            snackbar.style.transform = 'translateX(120%)';
		            setTimeout(() => {
		                snackbar.open = false;
		                snackbar.style.transform = '';
		            }, 170);
		        } else {
		            snackbar.style.transition = 'transform 0.16s ease-out';
		            snackbar.style.transform = '';
		        }
		    };
		    snackbar.addEventListener('pointerdown', start, { passive: true });
		    snackbar.addEventListener('pointermove', move, { passive: false });
		    snackbar.addEventListener('pointerup', end, { passive: true });
		    snackbar.addEventListener('pointercancel', end, { passive: true });
		    snackbar.addEventListener('touchstart', start, { passive: true });
		    snackbar.addEventListener('touchmove', move, { passive: false });
		    snackbar.addEventListener('touchend', end, { passive: true });
		}

		function isSystemDarkMode() {
		    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		}

		function applyColorScheme(color) {
		    if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return;
		    const r = parseInt(color.slice(1, 3), 16);
		    const g = parseInt(color.slice(3, 5), 16);
		    const b = parseInt(color.slice(5, 7), 16);
		    document.documentElement.style.setProperty("--primary-color", color);
		    document.documentElement.style.setProperty("--primary-color-rgb", `${r}, ${g}, ${b}`);
		    if (window.mdui?.setColorScheme) window.mdui.setColorScheme(color);
		}

		function getStoredThemeColors() {
		    return {
		        primary: localStorage.getItem(PRIMARY_KEY) || DEFAULT_THEME_COLORS.primary,
		        control: localStorage.getItem(CONTROL_COLOR_KEY) || DEFAULT_THEME_COLORS.control,
		        highlight: localStorage.getItem(HIGHLIGHT_COLOR_KEY) || DEFAULT_THEME_COLORS.highlight
		    };
		}

		function getSavedCustomThemeColors() {
		    try {
		        const saved = JSON.parse(localStorage.getItem(CUSTOM_THEME_COLOR_KEY) || '[]');
		        if (Array.isArray(saved)) return saved.filter(color => /^#[0-9a-fA-F]{6}$/.test(color));
		    } catch (error) {}
		    const legacy = localStorage.getItem(LEGACY_CUSTOM_THEME_COLOR_KEY);
		    return /^#[0-9a-fA-F]{6}$/.test(legacy || '') ? [legacy] : [];
		}

		function saveCustomThemeColors(colors) {
		    const unique = Array.from(new Set((colors || []).map(color => String(color).toLowerCase())));
		    localStorage.setItem(CUSTOM_THEME_COLOR_KEY, JSON.stringify(unique));
		    localStorage.removeItem(LEGACY_CUSTOM_THEME_COLOR_KEY);
		}

		function applyStoredThemeColors(colors, notifyParent = true) {
		    if (!colors || !/^#[0-9a-fA-F]{6}$/.test(colors.primary || '')) return;
		    applyColorScheme(colors.primary);
		    document.documentElement.style.setProperty('--xtd-control-color', colors.control || DEFAULT_THEME_COLORS.control);
		    document.documentElement.style.setProperty('--xtd-highlight-color', colors.highlight || DEFAULT_THEME_COLORS.highlight);
		    if (notifyParent && window.parent !== window) window.parent?.postMessage?.({ type: 'theme:colors', colors }, '*');
		}

		function persistStoredThemeColors(colors) {
		    localStorage.setItem(PRIMARY_KEY, colors.primary);
		    localStorage.setItem(CONTROL_COLOR_KEY, colors.control);
		    localStorage.setItem(HIGHLIGHT_COLOR_KEY, colors.highlight);
		    applyStoredThemeColors(colors);
		    renderPrimaryThemePalette();
		    updateSettingsUI();
		}

		function primaryHsvToHex(h, s, v) {
		    const c = v * s;
		    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
		    const m = v - c;
		    const rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
		    return `#${rgb.map(n => Math.round((n + m) * 255).toString(16).padStart(2, '0')).join('')}`;
		}

		function primaryHexToHsv(hex) {
		    const value = hex.replace('#', '');
		    const r = parseInt(value.slice(0, 2), 16) / 255;
		    const g = parseInt(value.slice(2, 4), 16) / 255;
		    const b = parseInt(value.slice(4, 6), 16) / 255;
		    const max = Math.max(r, g, b);
		    const min = Math.min(r, g, b);
		    const delta = max - min;
		    let h = 0;
		    if (delta) h = max === r ? 60 * (((g - b) / delta) % 6) : max === g ? 60 * ((b - r) / delta + 2) : 60 * ((r - g) / delta + 4);
		    if (h < 0) h += 360;
		    return { h, s: max ? delta / max : 0, v: max };
		}

		let genericMaterialPickerState = { h: 260, s: 0.55, v: 0.76, target: null };
		function updateGenericMaterialPicker(hex) {
		    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return;
		    const hsv = primaryHexToHsv(hex);
		    genericMaterialPickerState.h = hsv.h;
		    genericMaterialPickerState.s = hsv.s;
		    genericMaterialPickerState.v = hsv.v;
		    const field = document.getElementById('materialColorPickerField');
		    const slider = document.getElementById('materialColorPickerHue');
		    const thumb = document.getElementById('materialColorPickerThumb');
		    const preview = document.getElementById('materialColorPickerPreview');
		    const input = document.getElementById('materialColorPickerHex');
		    field?.style.setProperty('--picker-hue', hsv.h);
		    slider?.style.setProperty('--picker-hue', hsv.h);
		    if (slider) slider.value = String(Math.round(hsv.h));
		    if (thumb) {
		        thumb.style.left = `${hsv.s * 100}%`;
		        thumb.style.top = `${(1 - hsv.v) * 100}%`;
		    }
		    preview?.style.setProperty('--picker-color', hex);
		    if (input) input.value = hex.toUpperCase();
		}
		function updateGenericMaterialPickerFromHsv() {
		    updateGenericMaterialPicker(primaryHsvToHex(genericMaterialPickerState.h, genericMaterialPickerState.s, genericMaterialPickerState.v));
		}
		window.openMaterialColorPicker = ({ color = '#6750A4', title = '选择颜色', target = null } = {}) => {
		    genericMaterialPickerState.target = target;
		    const headline = document.getElementById('materialColorPickerTitle');
		    if (headline) headline.textContent = title;
		    updateGenericMaterialPicker(/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6750A4');
		    openDialogOnTop(document.getElementById('materialColorPickerDialog'));
		};
		window.applyGenericMaterialPicker = () => {
		    const hexInput = document.getElementById('materialColorPickerHex');
		    const color = String(hexInput?.value || '').trim().toUpperCase();
		    if (!/^#[0-9A-F]{6}$/.test(color)) {
		        showSnackbar('请输入有效的 HEX 颜色', 'error');
		        return false;
		    }
		    const target = genericMaterialPickerState.target;
		    if (target) {
		        target.value = color;
		        target.setAttribute('value', color);
		        target.style.setProperty('--picker-button-color', color);
		        target.dispatchEvent(new Event('input', { bubbles: true }));
		        target.dispatchEvent(new Event('change', { bubbles: true }));
		    }
		    genericMaterialPickerState.target = null;
		    const dialog = document.getElementById('materialColorPickerDialog');
		    if (dialog) dialog.open = false;
		    return true;
		};
		window.updateGenericMaterialPickerFromPointer = event => {
		    const field = document.getElementById('materialColorPickerField');
		    if (!field) return;
		    const rect = field.getBoundingClientRect();
		    genericMaterialPickerState.s = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
		    genericMaterialPickerState.v = Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height));
		    updateGenericMaterialPickerFromHsv();
		};
		window.setGenericMaterialPickerHue = value => {
		    genericMaterialPickerState.h = Math.max(0, Math.min(360, Number(value) || 0));
		    updateGenericMaterialPickerFromHsv();
		};
		window.setGenericMaterialPickerHex = value => {
		    const color = String(value || '').trim();
		    if (/^#[0-9a-fA-F]{6}$/.test(color)) updateGenericMaterialPicker(color);
		};

		function updatePrimaryMaterialPicker(hex) {
		    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return;
		    const hsv = primaryHexToHsv(hex);
		    primaryPickerHue = hsv.h;
		    primaryPickerSaturation = hsv.s;
		    primaryPickerValue = hsv.v;
		    const field = document.getElementById('primaryMaterialColorField');
		    const slider = document.getElementById('primaryMaterialHueSlider');
		    const thumb = document.getElementById('primaryMaterialColorThumb');
		    const preview = document.getElementById('primaryMaterialColorPreview');
		    const input = document.getElementById('primaryCustomColorHex');
		    field?.style.setProperty('--picker-hue', primaryPickerHue);
		    slider?.style.setProperty('--picker-hue', primaryPickerHue);
		    if (slider) slider.value = String(Math.round(primaryPickerHue));
		    if (thumb) {
		        thumb.style.left = `${primaryPickerSaturation * 100}%`;
		        thumb.style.top = `${(1 - primaryPickerValue) * 100}%`;
		    }
		    preview?.style.setProperty('--picker-color', hex);
		    if (input) input.value = hex.toLowerCase();
		}

		function updatePrimaryDraftFromPicker() {
		    const role = document.getElementById('primaryCustomColorRole')?.value || 'primary';
		    const hex = primaryHsvToHex(primaryPickerHue, primaryPickerSaturation, primaryPickerValue);
		    primaryThemeDraft[role] = hex;
		    updatePrimaryMaterialPicker(hex);
		    applyStoredThemeColors(primaryThemeDraft);
		}

		function openPrimaryCustomColorDialog(color = null, customIndex = null) {
		    primaryThemeOriginal = getStoredThemeColors();
		    primaryThemeDraft = { ...primaryThemeOriginal };
		    if (/^#[0-9a-fA-F]{6}$/.test(color || '')) primaryThemeDraft.primary = color;
		    pendingPrimaryCustomColorIndex = Number.isInteger(customIndex) ? customIndex : null;
		    primaryCustomColorCommitted = false;
		    const role = document.getElementById('primaryCustomColorRole');
		    if (role) role.value = 'primary';
		    updatePrimaryMaterialPicker(primaryThemeDraft.primary);
		    const dialog = document.getElementById('primaryCustomColorDialog');
		    openDialogOnTop(dialog);
		}

		function renderPrimaryThemePalette() {
		    const grid = document.getElementById('primaryColorPresetGrid');
		    if (!grid) return;
		    const selected = localStorage.getItem(PRIMARY_KEY) || DEFAULT_THEME_COLORS.primary;
		    grid.innerHTML = '';
		    THEME_COLOR_PRESETS.forEach(color => {
		        const button = document.createElement('button');
		        button.type = 'button';
		        button.className = `theme-swatch${color.toLowerCase() === selected.toLowerCase() ? ' selected' : ''}`;
		        button.style.setProperty('--swatch-color', color);
		        button.title = color;
		        button.setAttribute('aria-label', `选择主题色 ${color}`);
		        button.addEventListener('click', () => {
		            const colors = getStoredThemeColors();
		            colors.primary = color;
		            persistStoredThemeColors(colors);
		            flashTheme(color);
		            showSnackbar('已应用主题色', 'success');
		        });
		        grid.appendChild(button);
		    });
		    getSavedCustomThemeColors().forEach((color, index) => {
		        const button = document.createElement('button');
		        button.type = 'button';
		        button.className = `theme-swatch custom-color-swatch${color.toLowerCase() === selected.toLowerCase() ? ' selected' : ''}`;
		        button.style.setProperty('--swatch-color', color);
		        button.title = `${color}（点击应用，长按修改或删除）`;
		        button.setAttribute('aria-label', `应用自定义颜色 ${color}，长按修改或删除`);
		        let pressTimer = null;
		        let longPressed = false;
		        button.addEventListener('click', event => {
		            if (longPressed) { event.preventDefault(); longPressed = false; return; }
		            const colors = getStoredThemeColors();
		            colors.primary = color;
		            persistStoredThemeColors(colors);
		            flashTheme(color);
		        });
		        button.addEventListener('pointerdown', () => {
		            longPressed = false;
		            pressTimer = setTimeout(() => {
		                longPressed = true;
		                pendingPrimaryCustomColorIndex = index;
		                const dialog = document.getElementById('primaryCustomColorActionDialog');
		                openDialogOnTop(dialog);
		            }, 600);
		        });
		        ['pointerup','pointercancel','pointerleave'].forEach(type => button.addEventListener(type, () => {
		            clearTimeout(pressTimer);
		            pressTimer = null;
		        }));
		        grid.appendChild(button);
		    });
		    const customButton = document.createElement('button');
		    customButton.type = 'button';
		    customButton.className = 'theme-swatch custom-color-trigger';
		    customButton.innerHTML = '<mdui-icon name="palette" class="custom-color-palette-icon" aria-hidden="true"></mdui-icon><span class="custom-color-add-icon" aria-hidden="true">+</span>';
		    customButton.title = '自定义颜色';
		    customButton.setAttribute('aria-label', '自定义主题颜色');
		    customButton.addEventListener('click', () => openPrimaryCustomColorDialog());
		    grid.appendChild(customButton);
		}

        function flashTheme(color) {
            if (!themeFlash) return;
            themeFlash.style.setProperty("--theme-flash-color", color || "transparent");
            document.body.classList.add("theme-flash");
            setTimeout(() => document.body.classList.remove("theme-flash"), 280);
        }

		function initTheme() {
		  const root = document.documentElement;
		  root.classList.remove("mdui-theme-auto", "mdui-theme-light", "mdui-theme-dark");

		  if (selectedTheme === "auto") root.classList.add("mdui-theme-auto");
		  else if (selectedTheme === "dark") root.classList.add("mdui-theme-dark");
		  else root.classList.add("mdui-theme-light");

		  const effective = selectedTheme === "auto" ? (isSystemDarkMode() ? "dark" : "light") : selectedTheme;
		  const body = document.body;
		  if (effective === "dark") body.classList.add("dark-mode");
		  else body.classList.remove("dark-mode");
		  applySearchHighlightSettings();
		  window.applyVirtualKeyboardAppearance?.();

		  updateThemeSelectionInDrawer();
		}

		function changeTheme(theme) {
		  selectedTheme = theme;
		  localStorage.setItem('theme', selectedTheme);
		  initTheme();
		  dom.drawer.open = false; 
		}

		function updateThemeSelectionInDrawer() {
		    if (!dom.themeCollapseContent) return;
		    const themeOptions = dom.themeCollapseContent.querySelectorAll(".theme-option");
		    themeOptions.forEach((item) => {
		        item.removeAttribute("selected");
		        item.removeAttribute("active");
		        const oldCheck = item.querySelector('mdui-icon[slot="end-icon"][data-theme-check="1"]');
		        oldCheck?.remove();
		    });
		    const current = dom.themeCollapseContent.querySelector(`.theme-option[data-theme="${selectedTheme}"]`);
		    if (current) {
		        current.setAttribute("selected", "");
		        current.setAttribute("active", "");
		        const check = document.createElement("mdui-icon");
		        check.setAttribute("slot", "end-icon");
		        check.setAttribute("data-theme-check", "1");
		        check.setAttribute("name", "check");
		        current.appendChild(check);
		    }

		    const headerItem = dom.themeCollapse?.querySelector('mdui-list-item[slot="header"]');
		    let headlineText = "主题模式 (当前: 自动)";
		    let iconName = "brightness_auto";
		    if (selectedTheme === "light") { headlineText = "主题模式 (当前: 日间)"; iconName = "light_mode"; }
		    else if (selectedTheme === "dark") { headlineText = "主题模式 (当前: 夜间)"; iconName = "dark_mode"; }
		    if (headerItem) {
		        headerItem.setAttribute("headline", headlineText);
		        headerItem.setAttribute("icon", iconName);
		    }
		}

		function openCustomModal(modalElement) {
		    if (!modalElement) return;
            if (modalElement.tagName === 'MDUI-DIALOG') {
		        openDialogOnTop(modalElement);
		        return;
		    }
            modalElement.style.display = 'block';
            // 先移除再下一帧添加，保证动画稳定触发
            modalElement.classList.remove('modal-open');
            requestAnimationFrame(() => modalElement.classList.add('modal-open'));
		}

        function suppressFabTap(ms = 520) {
            window.__rsdbSuppressClicksUntil = Date.now() + ms;
            const fab = document.getElementById('mainFab');
            if (!fab) return;
            fab.style.pointerEvents = 'none';
            setTimeout(() => {
                fab.style.pointerEvents = '';
            }, Math.max(120, ms));
        }

		function closeCustomModal(modalElement) {
		    if (!modalElement) return;
            if (modalElement.tagName === 'MDUI-DIALOG') {
                modalElement.open = false;
                return;
            }
            suppressFabTap(560);
            const noAnim = appSettings?.animationsEnabled === false || document.documentElement.classList.contains('no-animations');
            modalElement.classList.remove('modal-open');
            if (noAnim) {
                modalElement.style.display = 'none';
            } else {
                setTimeout(() => {
                    if (!modalElement.classList.contains('modal-open')) {
                        modalElement.style.display = 'none';
                    }
                }, 200);
            }
            // If virtual keyboard is open and associated with an input in this modal, close it?
            // Or just update cursor
            updateVirtualCursor();
		}

function openCompareEditDialog(suggestedFields) {
    const dialog = document.getElementById('compareEditDialog');
    if (!dialog) {
        console.error('未找到对比编辑对话框，请检查HTML');
        return;
    }

    const oldContainer = document.getElementById('oldDataContainer');
    const newContainer = document.getElementById('newDataContainer');

    if (!oldContainer || !newContainer) return;

    oldContainer.innerHTML = '';
    newContainer.innerHTML = '';

    const currentData = currentEditIndex !== -1
        ? { ...tableData[currentEditIndex] }
        : { ...window.tempNewCardImage || {} };

    const displayFields = [
        { key: 'productId', label: '产品号' },
        { key: 'cardId',    label: '卡片号' },
        { key: 'furnaceId', label: '炉号' },
        { key: 'diameter',  label: '直径（规格）' },
        { key: 'status',    label: '交货状态' }
    ];

    displayFields.forEach(field => {

        const oldLabel = document.createElement('label');
        oldLabel.textContent = field.label;
        oldLabel.style.display = 'block';
        oldLabel.style.marginBottom = '4px';
        oldLabel.style.color = '#757575';

        const oldInput = document.createElement('input');
        oldInput.value = currentData[field.key] || '';
        oldInput.readOnly = true;
        oldInput.className = 'readonly-input';
        oldInput.style.width = '100%';
        oldInput.style.boxSizing = 'border-box';

        const oldWrapper = document.createElement('div');
        oldWrapper.style.marginBottom = '16px';
        oldWrapper.appendChild(oldLabel);
        oldWrapper.appendChild(oldInput);
        oldContainer.appendChild(oldWrapper);

        const newLabel = document.createElement('label');
        newLabel.textContent = field.label;
        newLabel.style.display = 'block';
        newLabel.style.marginBottom = '4px';
        newLabel.style.color = 'var(--primary-color)';

        const newInput = document.createElement('input');
        newInput.value = suggestedFields[field.key] ?? currentData[field.key] ?? '';
        newInput.dataset.field = field.key;
        newInput.style.width = '100%';
        newInput.style.boxSizing = 'border-box';

        newInput.addEventListener('click', (e) => {
            e.stopPropagation();
            currentInput = newInput;
            updateKeyboardForInput(newInput, field.key);
            showVirtualKeyboard();
            newInput.setAttribute('readonly', 'true');
            newInput.classList.add('readonly-input');
        });

        const newWrapper = document.createElement('div');
        newWrapper.style.marginBottom = '16px';
        newWrapper.appendChild(newLabel);
        newWrapper.appendChild(newInput);
        newContainer.appendChild(newWrapper);
    });

    document.getElementById('confirmCompareEditBtn').onclick = () => {
        const updatedData = {};
        newContainer.querySelectorAll('[data-field]').forEach(input => {
            updatedData[input.dataset.field] = input.value.trim();
        });

        if (currentEditIndex !== -1) {
            tableData[currentEditIndex] = { ...tableData[currentEditIndex], ...updatedData };
            if (tableData[currentEditIndex].__cellDisplayValues) {
                Object.keys(updatedData).forEach(field => delete tableData[currentEditIndex].__cellDisplayValues[field]);
            }
        } else {
            window.tempNewCardImage = { ...window.tempNewCardImage, ...updatedData };
        }

        saveDataToIndexedDB();
        updateTable();
        dialog.open = false;
        closeCustomModal(dom.dataSheet);
        showSnackbar('已使用图片识别数据保存', 'success');
    };

    document.getElementById('cancelCompareEditBtn').onclick = () => {
        dialog.open = false;
    };

    dialog.open = true;
}

// === Virtual Cursor Logic ===
function getVirtualCaretMirror() {
    let mirror = document.getElementById('rsdbVirtualCaretMirror');
    if (mirror) return mirror;
    mirror = document.createElement('div');
    mirror.id = 'rsdbVirtualCaretMirror';
    mirror.setAttribute('aria-hidden', 'true');
    mirror.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none;overflow:hidden;box-sizing:border-box;min-height:0;margin:0;z-index:-1;';
    document.body.appendChild(mirror);
    return mirror;
}

function measureTextareaCaret(input, position) {
    if (!input || input.tagName !== 'TEXTAREA') return null;
    const mirror = getVirtualCaretMirror();
    const style = window.getComputedStyle(input);
    const rect = input.getBoundingClientRect();
    const value = input.value || '';
    const caretPosition = Math.max(0, Math.min(value.length, Number(position) || 0));
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderRight = parseFloat(style.borderRightWidth) || 0;
    const lineHeight = Number.isFinite(parseFloat(style.lineHeight)) && parseFloat(style.lineHeight) > 0
        ? parseFloat(style.lineHeight)
        : (parseFloat(style.fontSize) || 16) * 1.5;

    const copiedProperties = [
        'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant', 'fontStretch',
        'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'textAlign',
        'direction', 'tabSize', 'wordBreak', 'overflowWrap', 'paddingTop', 'paddingRight',
        'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth',
        'borderBottomWidth', 'borderLeftWidth'
    ];
    copiedProperties.forEach(property => {
        mirror.style[property] = style[property];
    });
    mirror.style.borderStyle = 'solid';
    mirror.style.borderColor = 'transparent';
    mirror.style.lineHeight = `${lineHeight}px`;
    mirror.style.whiteSpace = input.wrap === 'off' ? 'pre' : 'pre-wrap';
    mirror.style.overflowWrap = input.wrap === 'off' ? 'normal' : (style.overflowWrap || 'break-word');
    mirror.style.width = `${Math.max(1, input.clientWidth + borderLeft + borderRight)}px`;
    mirror.style.height = 'auto';

    const before = document.createTextNode(value.substring(0, caretPosition));
    const marker = document.createElement('span');
    marker.dataset.rsdbCaretMarker = '1';
    // FEFF is zero-width and keeps the surrounding word's wrapping behavior intact.
    marker.textContent = `\uFEFF${value.substring(caretPosition)}`;
    mirror.replaceChildren(before, marker);

    const mirrorRect = mirror.getBoundingClientRect();
    const markerRect = marker.getClientRects()[0] || marker.getBoundingClientRect();
    if (!markerRect || !Number.isFinite(markerRect.left) || !Number.isFinite(markerRect.top)) return null;

    const localLeft = markerRect.left - mirrorRect.left;
    const localTop = markerRect.top - mirrorRect.top;
    return {
        left: rect.left + localLeft - (Number(input.scrollLeft) || 0),
        top: rect.top + localTop - (Number(input.scrollTop) || 0),
        localLeft,
        localTop,
        lineHeight,
        rect,
        style
    };
}

function setTextControlSelection(input, position) {
    if (!input) return;
    const length = (input.value || '').length;
    const next = Math.max(0, Math.min(length, Number(position) || 0));
    try {
        input.setSelectionRange(next, next);
    } catch (error) {
        try {
            input.selectionStart = next;
            input.selectionEnd = next;
        } catch (selectionError) {}
    }
}

function moveTextareaCursorToPoint(input, clientX, clientY) {
    if (!input || input.tagName !== 'TEXTAREA') return false;
    const length = (input.value || '').length;
    const metricsCache = new Map();
    const measure = index => {
        const safeIndex = Math.max(0, Math.min(length, index));
        if (!metricsCache.has(safeIndex)) metricsCache.set(safeIndex, measureTextareaCaret(input, safeIndex));
        return metricsCache.get(safeIndex);
    };
    const firstMetric = measure(0);
    if (!firstMetric) return false;

    // Locate the nearest visual line. Caret top positions remain monotonic across wrapped lines.
    let low = 0;
    let high = length;
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        const metric = measure(middle);
        if (!metric || metric.top + metric.lineHeight / 2 < clientY) low = middle + 1;
        else high = middle;
    }

    const lineCandidates = [low, low - 1]
        .filter(index => index >= 0 && index <= length)
        .map(index => ({ index, metric: measure(index) }))
        .filter(item => item.metric);
    if (!lineCandidates.length) return false;
    lineCandidates.sort((a, b) =>
        Math.abs(a.metric.top + a.metric.lineHeight / 2 - clientY)
        - Math.abs(b.metric.top + b.metric.lineHeight / 2 - clientY)
    );
    const chosen = lineCandidates[0];
    const lineTop = chosen.metric.top;
    const sameLineTolerance = Math.max(0.75, chosen.metric.lineHeight * 0.12);

    let lineStartLow = 0;
    let lineStartHigh = chosen.index;
    while (lineStartLow < lineStartHigh) {
        const middle = Math.floor((lineStartLow + lineStartHigh) / 2);
        const metric = measure(middle);
        if (metric && metric.top < lineTop - sameLineTolerance) lineStartLow = middle + 1;
        else lineStartHigh = middle;
    }
    const lineStart = lineStartLow;

    let lineEndLow = chosen.index;
    let lineEndHigh = length;
    while (lineEndLow < lineEndHigh) {
        const middle = Math.ceil((lineEndLow + lineEndHigh) / 2);
        const metric = measure(middle);
        if (metric && metric.top <= lineTop + sameLineTolerance) lineEndLow = middle;
        else lineEndHigh = middle - 1;
    }
    const lineEnd = lineEndLow;

    let xLow = lineStart;
    let xHigh = lineEnd;
    const startX = measure(lineStart)?.left ?? clientX;
    const endX = measure(lineEnd)?.left ?? startX;
    const increasing = endX >= startX;
    while (xLow < xHigh) {
        const middle = Math.floor((xLow + xHigh) / 2);
        const metric = measure(middle);
        const beforeTarget = metric && (increasing ? metric.left < clientX : metric.left > clientX);
        if (beforeTarget) xLow = middle + 1;
        else xHigh = middle;
    }

    const positionCandidates = [xLow, xLow - 1]
        .filter(index => index >= lineStart && index <= lineEnd)
        .map(index => ({ index, metric: measure(index) }))
        .filter(item => item.metric);
    positionCandidates.sort((a, b) => Math.abs(a.metric.left - clientX) - Math.abs(b.metric.left - clientX));
    setTextControlSelection(input, positionCandidates[0]?.index ?? chosen.index);
    updateVirtualCursor();
    return true;
}

function moveCursorToPoint(input, clientX, clientY) {
    if (!input) return;
    if (input.tagName === 'TEXTAREA' && moveTextareaCursorToPoint(input, clientX, clientY)) return;
    moveCursorToClientX(input, clientX);
}

function updateVirtualCursor() {
    const virtualCursor = document.getElementById('virtualCursor');
    if (!virtualCursor) return;
    const handle = document.getElementById('virtualCursorHandle');

    const vk = dom?.virtualKeyboard;
    const vkVisible = !!vk && window.getComputedStyle(vk).display !== 'none';
    if (!currentInput || !currentInput.classList.contains('readonly-input') || !vkVisible) {
        virtualCursor.style.display = 'none';
        if (handle) handle.style.display = 'none';
        return;
    }

    const rect = currentInput.getBoundingClientRect();
    const style = window.getComputedStyle(currentInput);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderRight = parseFloat(style.borderRightWidth) || 0;
    const borderTop = parseFloat(style.borderTopWidth) || 0;
    
    const selStart =
        typeof currentInput.selectionStart === 'number' ? currentInput.selectionStart : (currentInput.value || '').length;
    const textBeforeCursor = (currentInput.value || '').substring(0, selStart);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const lineHeight = Number.isFinite(parseFloat(style.lineHeight)) && parseFloat(style.lineHeight) > 0
        ? parseFloat(style.lineHeight)
        : (parseFloat(style.fontSize) || 16) * 1.5;
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1] || '';
    const textWidth = context.measureText(currentLine).width;
    const lineIndex = Math.max(0, lines.length - 1);
    const scrollLeft = Number(currentInput.scrollLeft) || 0;
    const scrollTop = Number(currentInput.scrollTop) || 0;
    const cursorHeight = Math.min(lineHeight, (parseFloat(style.fontSize) || 16) * 1.45);

    virtualCursor.style.height = cursorHeight + 'px';
    const contentWidth = Math.max(0, rect.width - paddingLeft - paddingRight - borderLeft - borderRight);
    const align = style.textAlign === 'center' || style.textAlign === 'right' ? style.textAlign : 'left';
    let lineStart = rect.left + borderLeft + paddingLeft;
    if (align === 'center') lineStart += Math.max(0, (contentWidth - textWidth) / 2);
    if (align === 'right') lineStart += Math.max(0, contentWidth - textWidth);
    let cursorLeft = lineStart + textWidth - scrollLeft;
    let cursorTop =
        rect.top +
        borderTop +
        paddingTop +
        lineIndex * lineHeight - scrollTop;
    if (currentInput.tagName === 'TEXTAREA') {
        const textareaCaret = measureTextareaCaret(currentInput, selStart);
        if (textareaCaret) {
            cursorLeft = textareaCaret.left;
            cursorTop = textareaCaret.top + Math.max(0, (textareaCaret.lineHeight - cursorHeight) / 2);
        }
    }
    if (!Number.isFinite(cursorLeft)) cursorLeft = rect.left;
    virtualCursor.style.left = cursorLeft + 'px';
    virtualCursor.style.top = cursorTop + 'px';
    
    // Fallback if height calculation fails (e.g. flex centering)
    if (isNaN(cursorTop)) {
        cursorTop = rect.top + (rect.height - cursorHeight) / 2;
        virtualCursor.style.top = cursorTop + 'px';
    }

    const borderBottom = parseFloat(style.borderBottomWidth) || 0;
    const visibleTop = rect.top + borderTop;
    const visibleBottom = rect.bottom - borderBottom;
    const cursorIsVisible = cursorTop + cursorHeight >= visibleTop && cursorTop <= visibleBottom
        && cursorLeft >= rect.left + borderLeft - 2
        && cursorLeft <= rect.right - borderRight + 2;
    virtualCursor.style.display = cursorIsVisible ? 'block' : 'none';
    if (handle) {
        const size = 16;
        handle.style.left = (cursorLeft - size / 2 + 1) + 'px';
        handle.style.top = (cursorTop + cursorHeight + 6) + 'px';
        const visibleUntil = Number(window.__rsdbCursorHandleVisibleUntil) || 0;
        handle.style.display = cursorIsVisible && Date.now() < visibleUntil ? 'block' : 'none';
    }
}

function showCursorHandleTemporarily() {
    const duration = Math.max(0, Math.min(10000, Number(appSettings.cursorHandleDuration) || 0));
    window.__rsdbCursorHandleVisibleUntil = Date.now() + duration;
    updateVirtualCursor();
}

function resetCursorToEnd(input) {
    if (!input) return;
    const value = input.value || '';
    const pos = value.length;
    try {
        input.setSelectionRange(pos, pos);
    } catch (e) {}
    try {
        input.selectionStart = pos;
        input.selectionEnd = pos;
    } catch (e) {}
}

function moveCursorToClick(input, event) {
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const style = window.getComputedStyle(input);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    if (input.tagName === 'TEXTAREA') {
        moveTextareaCursorToPoint(input, event.clientX, event.clientY);
        return;
    }
    moveCursorToClientX(input, event.clientX, rect, style, paddingLeft, borderLeft);
}

function moveCursorToClientX(input, clientX, rectArg = null, styleArg = null, paddingLeftArg = null, borderLeftArg = null) {
    if (!input) return;
    const rect = rectArg || input.getBoundingClientRect();
    const style = styleArg || window.getComputedStyle(input);
    const paddingLeft = paddingLeftArg ?? (parseFloat(style.paddingLeft) || 0);
    const borderLeft = borderLeftArg ?? (parseFloat(style.borderLeftWidth) || 0);
    const x = clientX - rect.left - paddingLeft - borderLeft;
    const value = input.value || "";
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    let acc = 0;
    let pos = 0;
    for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        const w = context.measureText(ch).width;
        if (acc + w / 2 >= x) {
            pos = i;
            break;
        }
        acc += w;
        pos = i + 1;
    }
    try {
        input.setSelectionRange(pos, pos);
    } catch (e) {
        try {
            input.selectionStart = pos;
            input.selectionEnd = pos;
        } catch (e2) {}
    }
}

function startVirtualCursorFollow() {
    if (window.__rsdbVirtualCursorTimer) return;
    window.__rsdbVirtualCursorTimer = setInterval(() => {
        updateVirtualCursor();
    }, 200);
}

function stopVirtualCursorFollow() {
    if (!window.__rsdbVirtualCursorTimer) return;
    clearInterval(window.__rsdbVirtualCursorTimer);
    window.__rsdbVirtualCursorTimer = null;
}

function moveCaretBy(delta) {
	if (
		keyboardState.imeLanguage === 'chinese' &&
		imeState.composition &&
		imeState.compositionEditing
	) {
		imeState.compositionCaret = clampImeCompositionCaret(imeState.compositionCaret + delta);
		renderImeCandidateBar();
		return;
	}
    if (!currentInput) return;
    const len = (currentInput.value || '').length;
    const start = typeof currentInput.selectionStart === 'number' ? currentInput.selectionStart : len;
    const end = typeof currentInput.selectionEnd === 'number' ? currentInput.selectionEnd : len;
    const collapsed = start === end;
    const base = collapsed ? start : Math.min(start, end);
    const next = Math.max(0, Math.min(len, base + delta));
    try {
        currentInput.setSelectionRange(next, next);
    } catch (e) {
        try {
            currentInput.selectionStart = next;
            currentInput.selectionEnd = next;
        } catch (e2) {}
    }
    updateVirtualCursor();
}
