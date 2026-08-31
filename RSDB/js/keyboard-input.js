const KeyboardConfigManager = {
    config: { ...DEFAULT_KEYBOARD_CONFIG },
    STORAGE_KEY: 'steel_bar_keyboard_config_v2', // Upgraded key

    init() {
        this.load();
        this.bindEvents();
    },

    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Basic validation: check if it has at least one expected key or is an object
                    if (parsed && typeof parsed === 'object') {
                        this.config = { ...DEFAULT_KEYBOARD_CONFIG, ...parsed };
                    } else {
                        throw new Error('Invalid config structure');
                    }
                    
                    // Fallback for missing keys (already handled by spread, but ensure layouts exist)
                    if (!this.config.layouts) this.config.layouts = DEFAULT_KEYBOARD_CONFIG.layouts;
                    
                } catch (parseError) {
                    console.error('Config parse error, resetting to default:', parseError);
                    this.reset(); // Auto-reset on corruption
                }
            } else {
                // Try migration from v1
                const oldSaved = localStorage.getItem('steel_bar_keyboard_config');
                if (oldSaved) {
                    try {
                        const parsed = JSON.parse(oldSaved);
                        this.config = { ...DEFAULT_KEYBOARD_CONFIG, ...parsed };
                    } catch(e) {
                         // ignore old config error
                    }
                }
            }
        } catch (e) {
            console.error('加载键盘配置失败', e);
        }
    },

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
        const activeVariableNames = new Set(
            (Array.isArray(this.config.dynamicVariables) ? this.config.dynamicVariables : [])
                .map(variable => String(variable?.name || '').trim())
                .filter(Boolean)
        );
        let removedStaleState = false;
        Object.keys(dynamicVariableState || {}).forEach(stateKey => {
            const variableName = String(stateKey).split(':', 1)[0];
            if (!activeVariableNames.has(variableName)) {
                delete dynamicVariableState[stateKey];
                removedStaleState = true;
            }
        });
        if (removedStaleState) saveDynamicVariableState();
        showSnackbar('键盘配置已保存', 'success');
        generateVirtualKeyboard();
    },

    reset() {
        this.config = JSON.parse(JSON.stringify(DEFAULT_KEYBOARD_CONFIG)); // Deep copy
        this.save();
        showSnackbar('已恢复默认配置', 'success');
    },

    bindEvents() {
        const openBtn = document.getElementById('settingsKeyboardItem');
        const openVisualSettingBtn = document.getElementById('settingsKeyboardVisualEditorItem');
        const openDynamicVariablesSettingBtn = document.getElementById('settingsDynamicVariablesItem');
        const modal = document.getElementById('keyboardSettingsModal');
        const closeBtn = document.getElementById('closeKeyboardSettingsModal');
        const cancelBtn = document.getElementById('cancelKeyboardConfigBtn');
        const saveBtn = document.getElementById('saveKeyboardConfigBtn');
        const resetBtn = document.getElementById('resetKeyboardConfigBtn');
        const dynamicVarListVisual = document.getElementById('dynamicVarListVisual');
        const addDynamicVarBtnVisual = document.getElementById('addDynamicVarBtnVisual');
        const openVisualBtn = document.getElementById('openKeyboardVisualEditorBtn');
        const visualDialog = document.getElementById('keyboardVisualEditorDialog');
        const closeVisualBtn = document.getElementById('closeKeyboardVisualEditorBtn');
        const cancelVisualBtn = document.getElementById('keyboardVisualCancelBtn');
        const saveVisualBtn = document.getElementById('keyboardVisualSaveBtn');
        const resetCurrentVisualBtn = document.getElementById('vkVisualResetCurrentBtn');
        const toggleVisualKeyboardBtn = document.getElementById('vkVisualToggleKeyboardBtn');
        const visualSelectedInfo = document.getElementById('vkVisualSelectedInfo');
        const dynamicVariablesDialog = document.getElementById('dynamicVariablesDialog');
        const dynamicVarManageList = document.getElementById('dynamicVarManageList');
        let dynamicVarEditIndex = -1;
        let dynamicVarTestState = {};
        
        const inputs = {
            furnaceId: document.getElementById('furnaceIdConfigInput'),
            productId: document.getElementById('productIdConfigInput'),
            cardId: document.getElementById('cardIdConfigInput'),
            steelType: document.getElementById('steelTypeConfigInput'),
            status: document.getElementById('statusConfigInput'),
            position: document.getElementById('positionConfigInput'),
            advancedJson: document.getElementById('advancedJsonConfigInput')
        };

        const dynamicVarToProgram = (item = {}) => {
            if (item.code || item.program) return item.code || item.program;
            const kind = (item.kind || 'date').toString();
            const fmt = (item.format || '').toString();
            const offsetDays = Number.isFinite(Number(item.offsetDays)) ? Math.round(Number(item.offsetDays)) : 0;
            if (kind === 'isoWeek') return `int week = isoWeek();\nreturn ${JSON.stringify(fmt === 'W' ? 'RAW_WEEK' : 'PAD_WEEK')}.replace('RAW_WEEK', week).replace('PAD_WEEK', pad2(week));`;
            if (kind === 'month') return `int month = now.getMonth() + 1;\nreturn ${fmt === 'MM' ? 'pad2(month)' : 'month'};`;
            if (kind === 'day') return `int day = now.getDate();\nreturn ${fmt === 'DD' ? 'pad2(day)' : 'day'};`;
            if (kind === 'year') return `int year = now.getFullYear();\nreturn ${fmt === 'YYYY' ? 'year' : 'String(year).slice(2)'};`;
            if (kind === 'weekStart') return `return formatDate(addDays(weekStart(), ${offsetDays}), ${JSON.stringify(fmt || 'YYYYMMDD')});`;
            if (kind === 'weekEnd') return `return formatDate(addDays(weekStart(), ${6 + offsetDays}), ${JSON.stringify(fmt || 'YYYYMMDD')});`;
            return `return formatDate(addDays(today(), ${offsetDays}), ${JSON.stringify(fmt || 'YYYYMMDD')});`;
        };

        const createDynamicVarRow = (item = {}) => {
            const row = document.createElement('div');
            row.className = 'vk-program-var-row';

            const name = document.createElement('mdui-text-field');
            name.setAttribute('label', '变量名');
            name.setAttribute('variant', 'outlined');
            name.value = item.name || '';

            const code = document.createElement('mdui-text-field');
            code.className = 'vk-program-code';
            code.setAttribute('label', '变量程序（类似 C / JS，return 返回值）');
            code.setAttribute('variant', 'outlined');
            code.setAttribute('type', 'textarea');
            code.setAttribute('rows', '3');
            code.value = item.code || item.program || dynamicVarToProgram(item);

            const del = document.createElement('mdui-button-icon');
            del.setAttribute('icon', 'delete');
            del.setAttribute('variant', 'text');
            del.addEventListener('click', () => row.remove());

            row.appendChild(name);
            row.appendChild(code);
            row.appendChild(del);
            return row;
        };

        const renderDynamicVars = (targetEl) => {
            if (!targetEl) return;
            targetEl.innerHTML = '';
            const vars = Array.isArray(this.config.dynamicVariables) ? this.config.dynamicVariables : [];
            if (vars.length === 0) {
                const defaults = [
                    { name: '本周', code: 'int week = isoWeek();\nreturn pad2(week);' },
                    { name: '本周一', code: 'return formatDate(addDays(weekStart(), 0), "YYYYMMDD");' }
                ];
                defaults.forEach(v => targetEl.appendChild(createDynamicVarRow(v)));
                return;
            }
            vars.forEach(v => targetEl.appendChild(createDynamicVarRow(v)));
        };

        const readDynamicVars = (targetEl) => {
            if (!targetEl) return [];
            const rows = Array.from(targetEl.children);
            return rows.map(r => {
                const items = r.querySelectorAll('mdui-text-field');
                const name = items[0]?.value?.trim?.() || '';
                const code = items[1]?.value?.trim?.() || '';
                return { name, code };
            }).filter(v => v.name && v.code);
        };

        const getDynamicVariables = () => {
            if (!Array.isArray(this.config.dynamicVariables)) this.config.dynamicVariables = [];
            return this.config.dynamicVariables;
        };
        const updateDynamicVarLineNumbers = () => {
            const field = document.getElementById('dynamicVarEditCode');
            const gutter = document.getElementById('dynamicVarCodeLineNumbers');
            if (!field || !gutter) return;
            const lineCount = Math.max(1, String(field.value || '').split('\n').length);
            gutter.textContent = Array.from({ length: lineCount }, (_, index) => String(index + 1)).join('\n');
        };
        const bindDynamicVarCodeScroller = () => {
            const field = document.getElementById('dynamicVarEditCode');
            const gutter = document.getElementById('dynamicVarCodeLineNumbers');
            const editor = field?.closest('.dynamic-variable-code-editor');
            if (!field || !gutter || !editor) return false;
            const textarea = field.shadowRoot?.querySelector('textarea') || field.querySelector?.('textarea');
            if (!textarea) return false;
            textarea.wrap = 'off';
            const style = getComputedStyle(textarea);
            gutter.style.lineHeight = style.lineHeight;
            const editorRect = editor.getBoundingClientRect();
            const textareaRect = textarea.getBoundingClientRect();
            gutter.style.paddingTop = `${Math.max(8, Math.round(textareaRect.top - editorRect.top))}px`;
            if (textarea.dataset.dynamicLineNumberBound !== '1') {
                textarea.dataset.dynamicLineNumberBound = '1';
                textarea.addEventListener('scroll', () => { gutter.scrollTop = textarea.scrollTop; }, { passive: true });
            }
            gutter.scrollTop = textarea.scrollTop;
            return true;
        };
        const scheduleDynamicVarCodeEditorSync = () => {
            updateDynamicVarLineNumbers();
            requestAnimationFrame(() => {
                if (!bindDynamicVarCodeScroller()) {
                    window.setTimeout(bindDynamicVarCodeScroller, 120);
                }
            });
        };
        const renderDynamicVarManager = () => {
            if (!dynamicVarManageList) return;
            const query = (document.getElementById('dynamicVarSearchInput')?.value || '').toLowerCase();
            dynamicVarManageList.innerHTML = '';
            getDynamicVariables().forEach((v, i) => {
                const code = v.code || v.program || dynamicVarToProgram(v);
                const text = `${v.name || ''}
${code}`;
                if (query && !text.toLowerCase().includes(query)) return;
                const row = document.createElement('mdui-list-item');
                row.className = 'dynamic-variable-list-item';
                row.setAttribute('rounded', '');

                const checkbox = document.createElement('mdui-checkbox');
                checkbox.className = 'dynamic-var-check';
                checkbox.dataset.index = String(i);
                checkbox.setAttribute('slot', 'icon');
                checkbox.setAttribute('aria-label', `选择变量 ${v.name || '未命名'}`);
                checkbox.addEventListener('click', event => event.stopPropagation());

                const body = document.createElement('div');
                body.className = 'dynamic-variable-list-content';
                const title = document.createElement('strong');
                title.className = 'dynamic-variable-list-name';
                title.textContent = v.name || '(未命名)';
                const description = document.createElement('div');
                description.className = 'dynamic-variable-code-summary';
                description.textContent = code;
                body.append(title, description);

                const actions = document.createElement('span');
                actions.className = 'dynamic-variable-list-actions';
                actions.setAttribute('slot', 'end-icon');
                const edit = document.createElement('mdui-button-icon');
                edit.setAttribute('icon', 'edit');
                edit.setAttribute('aria-label', `编辑变量 ${v.name || '未命名'}`);
                edit.addEventListener('click', event => { event.stopPropagation(); openDynamicVarEdit(i); });
                const del = document.createElement('mdui-button-icon');
                del.setAttribute('icon', 'delete');
                del.setAttribute('aria-label', `删除变量 ${v.name || '未命名'}`);
                del.addEventListener('click', event => {
                    event.stopPropagation();
                    if (confirm(`确定删除变量？\n\n${v.name || '(未命名)'}\n${code}`)) {
                        getDynamicVariables().splice(i, 1);
                        renderDynamicVarManager();
                    }
                });
                actions.append(edit, del);
                row.append(checkbox, body, actions);
                row.addEventListener('click', () => openDynamicVarEdit(i));
                dynamicVarManageList.appendChild(row);
            });
        };
        const openDynamicVarEdit = (index = -1) => {
            dynamicVarEditIndex = index;
            const v = index >= 0 ? getDynamicVariables()[index] : { name:'', code:'int i = 0;\ni++;\nreturn i;' };
            document.getElementById('dynamicVarEditName').value = v.name || '';
            document.getElementById('dynamicVarEditCode').value = v.code || v.program || dynamicVarToProgram(v);
            const testResult = document.getElementById('dynamicVarTestResult');
            if (testResult) {
                testResult.description = '点击测试校验后显示结果';
                testResult.setAttribute('description', '点击测试校验后显示结果');
                testResult.setAttribute('icon', 'science');
            }
            document.getElementById('dynamicVarEditTitle').textContent = index >= 0 ? '编辑变量' : '新增变量';
		    dynamicVarTestState = { ...(dynamicVariableState || {}) };
		    openDialogOnTop(document.getElementById('dynamicVarEditDialog'));
            scheduleDynamicVarCodeEditorSync();
        };
        const testDynamicVarCode = () => {
            const code = document.getElementById('dynamicVarEditCode')?.value || '';
            const name = document.getElementById('dynamicVarEditName')?.value?.trim?.() || '__test__';
            try {
                const program = String(code).replace(/\b(?:int|float|double|string|char|bool|long|short|unsigned|signed)\s+/g, 'let ');
                const stateKey = key => `${name}:${String(key || '')}`;
                const getVar = (key, fallback = 0) => Object.prototype.hasOwnProperty.call(dynamicVarTestState, stateKey(key)) ? dynamicVarTestState[stateKey(key)] : fallback;
                const setVar = (key, value) => { dynamicVarTestState[stateKey(key)] = value; return value; };
                const incVar = (key, step = 1, start = 0) => {
                    const next = Number(getVar(key, start)) + Number(step || 0);
                    dynamicVarTestState[stateKey(key)] = next;
                    return next;
                };
                const counterMatch = program.match(/(?:let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*0\s*;\s*\1\+\+\s*;\s*return\s+\1\s*;?/i);
                const out = counterMatch
                    ? incVar(`__counter:${counterMatch[1]}`, 1, 0)
                    : new Function('now', 'pad2', 'state', 'getVar', 'setVar', 'incVar', `"use strict";\n${program}`)(
                        new Date(),
                        n => String(n).padStart(2, '0'),
                        dynamicVarTestState,
                        getVar,
                        setVar,
                        incVar
                    );
                const resultText = `校验通过：${out ?? ''}`;
                const resultItem = document.getElementById('dynamicVarTestResult');
                if (resultItem) {
                    resultItem.description = resultText;
                    resultItem.setAttribute('description', resultText);
                    resultItem.setAttribute('icon', 'check_circle');
                }
                showSnackbar('变量校验通过', 'success');
            } catch (e) {
                const resultText = `校验失败：${e.message}`;
                const resultItem = document.getElementById('dynamicVarTestResult');
                if (resultItem) {
                    resultItem.description = resultText;
                    resultItem.setAttribute('description', resultText);
                    resultItem.setAttribute('icon', 'error');
                }
                showSnackbar('变量校验失败', 'error');
            }
        };

        const updateInputsFromConfig = () => {
            inputs.furnaceId.value = this.config.furnaceIdTemplates.join('\n');
            inputs.productId.value = this.config.productIdTemplates.join('\n');
            inputs.cardId.value = (this.config.cardIdTemplates || []).join('\n');
            inputs.steelType.value = (this.config.steelTypeTemplates || []).join('\n');
            inputs.status.value = (this.config.statusTemplates || []).join('\n');
            inputs.position.value = (this.config.positionTemplates || []).join('\n');
            inputs.advancedJson.value = JSON.stringify(this.config);
            renderDynamicVars(dynamicVarListVisual);
        };

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                updateInputsFromConfig();
                dom.drawer.open = false;
                if (modal) {
                    document.body.appendChild(modal);
                    modal.style.zIndex = '20000';
                    modal.open = true;
                }
            });
        }

        const closeModal = () => {
            modal.open = false;
        };

        [closeBtn, cancelBtn].forEach(btn => btn?.addEventListener('click', closeModal));
        addDynamicVarBtnVisual?.addEventListener('click', () => {
            if (!dynamicVarListVisual) return;
            dynamicVarListVisual.appendChild(createDynamicVarRow({ name: '', code: 'int i = 0;\ni++;\nreturn i;' }));
        });

        openDynamicVariablesSettingBtn?.addEventListener('click', () => { dom.drawer.open = false; renderDynamicVarManager(); if (dynamicVariablesDialog) dynamicVariablesDialog.open = true; });
        document.getElementById('dynamicVariablesHelpBtn')?.addEventListener('click', () => openDialogOnTop(document.getElementById('dynamicVariablesHelpDialog')));
        document.getElementById('dynamicVariablesHelpCloseBtn')?.addEventListener('click', () => { const dialog = document.getElementById('dynamicVariablesHelpDialog'); if (dialog) dialog.open = false; });
        document.getElementById('closeDynamicVariablesBtn')?.addEventListener('click', () => { if (dynamicVariablesDialog) dynamicVariablesDialog.open = false; });
        document.getElementById('dynamicVariablesCancelBtn')?.addEventListener('click', () => { if (dynamicVariablesDialog) dynamicVariablesDialog.open = false; });
        document.getElementById('dynamicVarSearchInput')?.addEventListener('input', renderDynamicVarManager);
        document.getElementById('dynamicVarEditCode')?.addEventListener('input', scheduleDynamicVarCodeEditorSync);
        document.getElementById('dynamicVarSelectAllCheckbox')?.addEventListener('change', (e) => dynamicVarManageList?.querySelectorAll('.dynamic-var-check').forEach(cb => cb.checked = !!e.target.checked));
        document.getElementById('dynamicVarAddBtn')?.addEventListener('click', () => openDynamicVarEdit(-1));
        document.getElementById('dynamicVarDeleteSelectedBtn')?.addEventListener('click', () => {
            const selected = Array.from(dynamicVarManageList?.querySelectorAll('.dynamic-var-check') || []).filter(cb => cb.checked).map(cb => Number(cb.dataset.index)).sort((a,b)=>b-a);
            if (!selected.length) return showSnackbar('请先选择要删除的变量', 'warning');
            if (!confirm(`确定删除选中的 ${selected.length} 个变量吗？`)) return;
            selected.forEach(i => getDynamicVariables().splice(i, 1)); renderDynamicVarManager(); showSnackbar(`已删除 ${selected.length} 个变量`, 'success');
        });
        document.getElementById('dynamicVarEditCloseBtn')?.addEventListener('click', () => document.getElementById('dynamicVarEditDialog').open = false);
        document.getElementById('dynamicVarEditCancelBtn')?.addEventListener('click', () => document.getElementById('dynamicVarEditDialog').open = false);
        document.getElementById('dynamicVarTestBtn')?.addEventListener('click', testDynamicVarCode);
        document.getElementById('dynamicVarEditSaveBtn')?.addEventListener('click', () => {
            const name = document.getElementById('dynamicVarEditName')?.value?.trim?.() || '';
            const code = document.getElementById('dynamicVarEditCode')?.value?.trim?.() || '';
            if (!name || !code) return showSnackbar('变量名和程序不能为空', 'warning');
            if (dynamicVarEditIndex >= 0) getDynamicVariables()[dynamicVarEditIndex] = { name, code }; else getDynamicVariables().push({ name, code });
            document.getElementById('dynamicVarEditDialog').open = false; renderDynamicVarManager();
        });
        bindImmediateActionButton(document.getElementById('dynamicVariablesSaveBtn'), () => { this.save(); if (dynamicVariablesDialog) dynamicVariablesDialog.open = false; });

        let visualLayoutKey = 'text';
        let visualSelected = { row: -1, col: -1 };
        let visualKeyboardVisible = true;
        const cloneKeyboardLayout = (layout) => JSON.parse(JSON.stringify(layout || [[]]));
        const getVisualSelectedKeyObj = () => {
            const rows = getLayoutRows();
            const { row, col } = visualSelected;
            if (row < 0 || col < 0 || !rows[row] || rows[row][col] === undefined) return null;
            return getKeyObj(rows[row][col]);
        };
        const getVisualKeyLabel = (keyObj) => {
            if (keyObj?.label) return keyObj.label;
            const key = String(keyObj?.key || '');
            const special = {
                backspace: '←', space: '', shift: '⇧', esc: '✔', done: '▼',
                clear: '清空', symbol: '符', system: '⌨', ABC: 'ABC'
            };
            return special[key] || key || '(空)';
        };
        const getVisualSelectedText = () => {
            const { row, col } = visualSelected;
            if (row < 0) return '未选择';
            if (col < 0) return `已选中：第 ${row + 1} 行`;
            const keyObj = getVisualSelectedKeyObj();
            const keyText = keyObj ? getVisualKeyLabel(keyObj) : '(空)';
            const swipeText = keyObj && (keyObj.swipe || getVisualSwipeSymbol(keyObj));
            return `已选中：第 ${row + 1} 行 / 第 ${col + 1} 键：${keyText}${swipeText ? `（上滑：${swipeText}）` : ''}`;
        };
        const updateVisualKeyboardState = () => {
            const preview = document.getElementById('vkVisualPreview');
            if (preview) preview.classList.toggle('keyboard-hidden', !visualKeyboardVisible);
            if (toggleVisualKeyboardBtn) toggleVisualKeyboardBtn.textContent = visualKeyboardVisible ? '关闭键盘' : '打开键盘';
            if (visualSelectedInfo) visualSelectedInfo.textContent = getVisualSelectedText();
        };
        const focusVisualEditControls = () => {
            const target = document.getElementById('vkVisualKeyValueInput') || document.getElementById('vkVisualLayoutSelect');
            target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
            target?.focus?.();
        };
        const bindVisualLongPress = (el, onLongPress) => {
            let timer = null;
            const clearTimer = () => {
                if (timer) clearTimeout(timer);
                timer = null;
            };
            el.addEventListener('pointerdown', (e) => {
                el.__visualLongPressed = false;
                clearTimer();
                timer = setTimeout(() => {
                    el.__visualLongPressed = true;
                    onLongPress(e);
                }, 560);
            }, { passive: true });
            ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => el.addEventListener(type, clearTimer, { passive: true }));
        };
        const getLayoutRows = () => {
            if (!this.config.layouts[visualLayoutKey]) this.config.layouts[visualLayoutKey] = [[]];
            return this.config.layouts[visualLayoutKey];
        };
        const getKeyObj = (key) => {
            if (typeof key === 'object' && key) return { ...key };
            return { key: String(key ?? '') };
        };
        const clampPercent = (value, min, max, fallback = '') => {
            if (value === '' || value == null) return fallback;
            const num = Number(value);
            if (!Number.isFinite(num)) return fallback;
            return String(Math.max(min, Math.min(max, Math.round(num))));
        };
        const getKeyPercentSize = (keyObj) => {
            const style = (keyObj.style && typeof keyObj.style === 'object') ? keyObj.style : {};
            const keepDefaultSize = keyObj.keepSize !== false;
            const width = keepDefaultSize ? '' : (keyObj.widthPercent || String(style.width || '').replace('%', ''));
            const height = keepDefaultSize ? '' : (keyObj.heightPercent || String(style.height || '').replace('%', ''));
            return { width: clampPercent(width, 1, 100), height: clampPercent(height, 1, 300) };
        };
        const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
        const getVisualSwipeSymbol = (keyObj) => {
            const key = String(keyObj.key || '');
            const lowerKey = key.toLowerCase();
            return keyObj.swipe || KeyboardConfigManager.config.symbolMap?.[lowerKey] || '';
        };
        const syncVisualInputs = (keyObj = null) => {
            const vInput = document.getElementById('vkVisualKeyValueInput');
            const lInput = document.getElementById('vkVisualKeyLabelInput');
            const flexInput = document.getElementById('vkVisualKeyFlexInput');
            const swipeInput = document.getElementById('vkVisualKeySwipeInput');
            const swipeLabelInput = document.getElementById('vkVisualKeySwipeLabelInput');
            const swipeColorInput = document.getElementById('vkVisualKeySwipeColorInput');
            const wInput = document.getElementById('vkVisualKeyWidthInput');
            const hInput = document.getElementById('vkVisualKeyHeightInput');
            const keepInput = document.getElementById('vkVisualKeyKeepSizeInput');
            if (!keyObj) {
                if (vInput) vInput.value = '';
                if (lInput) lInput.value = '';
                if (flexInput) flexInput.value = '';
                if (swipeInput) swipeInput.value = '';
                if (swipeLabelInput) swipeLabelInput.value = '';
                if (swipeColorInput) swipeColorInput.value = '';
                if (wInput) wInput.value = '';
                if (hInput) hInput.value = '';
                if (keepInput) keepInput.checked = false;
                return;
            }
            const size = getKeyPercentSize(keyObj);
            if (vInput) vInput.value = keyObj.key || '';
            if (lInput) lInput.value = keyObj.label || '';
            if (flexInput) flexInput.value = keyObj.flex != null ? String(keyObj.flex) : '';
            if (swipeInput) swipeInput.value = getVisualSwipeSymbol(keyObj);
            if (swipeLabelInput) swipeLabelInput.value = keyObj.swipeLabel || '';
            if (swipeColorInput) swipeColorInput.value = keyObj.swipeColor || '';
            if (wInput) wInput.value = size.width;
            if (hInput) hInput.value = size.height;
            if (keepInput) keepInput.checked = keyObj.keepSize !== false;
        };
        const renderVisualPreview = () => {
            const preview = document.getElementById('vkVisualPreview');
            if (!preview) return;
            preview.innerHTML = '';
            preview.classList.toggle('keyboard-hidden', !visualKeyboardVisible);
            const rows = getLayoutRows();
            if (!rows.length) rows.push([]);
            rows.forEach((row, rIdx) => {
                const rowEl = document.createElement('div');
                rowEl.className = `vk-visual-row${visualSelected.row === rIdx ? ' selected-row' : ''}`;
                rowEl.addEventListener('click', (e) => {
                    if (rowEl.__visualLongPressed) {
                        rowEl.__visualLongPressed = false;
                        e.preventDefault();
                        return;
                    }
                    if (e.target.closest('.vk-visual-key')) return;
                    visualSelected = { row: rIdx, col: -1 };
                    syncVisualInputs(null);
                    renderVisualPreview();
                });
                bindVisualLongPress(rowEl, (e) => {
                    if (e.target?.closest?.('.vk-visual-key')) return;
                    visualSelected = { row: rIdx, col: -1 };
                    visualKeyboardVisible = false;
                    syncVisualInputs(null);
                    renderVisualPreview();
                    focusVisualEditControls();
                    showSnackbar(`已长按选中第 ${rIdx + 1} 行，可编辑、添加或删除行`, 'info');
                });
                (row || []).forEach((rawKey, cIdx) => {
                    const keyObj = getKeyObj(rawKey);
                    const keyEl = document.createElement('div');
                    const keepDefaultSize = keyObj.keepSize !== false;
                    keyEl.className = `keyboard-key vk-visual-key${keepDefaultSize ? ' keep-size' : ''}${visualSelected.row === rIdx && visualSelected.col === cIdx ? ' selected-key' : ''}`;
                    const size = getKeyPercentSize(keyObj);
                    keyEl.style.flex = keepDefaultSize ? (keyObj.flex ? `${keyObj.flex} 1 0` : '1 1 0') : '0 0 auto';
                    if (!keepDefaultSize && size.width) keyEl.style.width = `${size.width}%`;
                    if (!keepDefaultSize && size.height) keyEl.style.height = `${size.height}%`;
                    if (keyObj.style && typeof keyObj.style === 'object') Object.assign(keyEl.style, keyObj.style);
                    if (!keepDefaultSize && size.width) keyEl.style.width = `${size.width}%`;
                    if (!keepDefaultSize && size.height) keyEl.style.height = `${size.height}%`;
                    const displayLabel = getVisualKeyLabel(keyObj);
                    const swipeSymbol = getVisualSwipeSymbol(keyObj);
                    const keyValue = String(keyObj.key || '');
                    if (['shift', 'backspace', 'space', 'esc', 'done', 'system'].includes(keyValue)) {
                        keyEl.classList.add('special');
                        if (keyValue === 'shift') keyEl.innerHTML = '<mdui-icon name="keyboard_arrow_up"></mdui-icon>';
                        else if (keyValue === 'system') keyEl.innerHTML = '<mdui-icon name="keyboard"></mdui-icon>';
                        else keyEl.textContent = displayLabel;
                    } else if (swipeSymbol) {
                        const swipeLabel = keyObj.swipeLabel || swipeSymbol;
                        const swipeStyle = keyObj.swipeColor ? ` style="color:${escapeHtml(keyObj.swipeColor)}"` : '';
                        keyEl.innerHTML = `
                            <div class="key-inner">
                                <span class="key-symbol"${swipeStyle}>${escapeHtml(swipeLabel)}</span>
                                <span class="key-char">${escapeHtml(displayLabel)}</span>
                            </div>
                        `;
                    } else {
                        keyEl.textContent = displayLabel;
                    }
                    keyEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (keyEl.__visualLongPressed) {
                            keyEl.__visualLongPressed = false;
                            e.preventDefault();
                            return;
                        }
                        visualSelected = { row: rIdx, col: cIdx };
                        syncVisualInputs(keyObj);
                        renderVisualPreview();
                    });
                    bindVisualLongPress(keyEl, (e) => {
                        e.stopPropagation?.();
                        visualSelected = { row: rIdx, col: cIdx };
                        visualKeyboardVisible = false;
                        syncVisualInputs(keyObj);
                        renderVisualPreview();
                        focusVisualEditControls();
                        showSnackbar('已长按选中按键，键盘已关闭，可在上方编辑或删除', 'info');
                    });
                    rowEl.appendChild(keyEl);
                });
                preview.appendChild(rowEl);
            });
            updateVisualKeyboardState();
        };
        const patchSelectedKey = (patch) => {
            const rows = getLayoutRows();
            const { row, col } = visualSelected;
            if (row < 0 || col < 0 || !rows[row] || rows[row][col] === undefined) return;
            const current = getKeyObj(rows[row][col]);
            const next = { ...current, ...patch };
            if (patch.keepSize) {
                delete next.widthPercent;
                delete next.heightPercent;
                if (next.style) {
                    delete next.style.width;
                    delete next.style.height;
                }
            }
            ['swipe', 'swipeLabel', 'swipeColor', 'label', 'flex'].forEach(prop => {
                if (next[prop] == null || next[prop] === '') delete next[prop];
            });
            rows[row][col] = next;
            renderVisualPreview();
        };
        const patchSelectedKeySize = (part, value) => {
            const percent = clampPercent(value, part === 'width' ? 1 : 1, part === 'width' ? 100 : 300);
            const rows = getLayoutRows();
            const { row, col } = visualSelected;
            if (row < 0 || col < 0 || !rows[row] || rows[row][col] === undefined) return;
            const current = getKeyObj(rows[row][col]);
            const style = { ...((current.style && typeof current.style === 'object') ? current.style : {}) };
            if (percent) style[part] = `${percent}%`; else delete style[part];
            patchSelectedKey({ [`${part}Percent`]: percent, style, keepSize: false });
        };
        const moveSelectedKey = (dx, dy) => {
            const rows = getLayoutRows();
            const { row, col } = visualSelected;
            if (row < 0 || col < 0 || !rows[row] || rows[row][col] === undefined) return;
            const newRow = Math.max(0, Math.min(rows.length - 1, row + dy));
            if (!rows[newRow]) rows[newRow] = [];
            const newCol = Math.max(0, col + dx);
            const moving = rows[row].splice(col, 1)[0];
            rows[newRow].splice(Math.min(newCol, rows[newRow].length), 0, moving);
            visualSelected = { row: newRow, col: Math.min(newCol, rows[newRow].length - 1) };
            syncVisualInputs(getKeyObj(rows[visualSelected.row][visualSelected.col]));
            renderVisualPreview();
        };
        document.getElementById('vkVisualLayoutSelect')?.addEventListener('change', (e) => {
            visualLayoutKey = e.target.value || 'text';
            visualSelected = { row: -1, col: -1 };
            syncVisualInputs(null);
            renderVisualPreview();
        });
        document.getElementById('vkVisualAddRowBtn')?.addEventListener('click', () => {
            const rows = getLayoutRows();
            rows.push([]);
            visualSelected = { row: rows.length - 1, col: -1 };
            syncVisualInputs(null);
            renderVisualPreview();
        });
        document.getElementById('vkVisualDeleteRowBtn')?.addEventListener('click', () => {
            const rows = getLayoutRows();
            const targetRow = visualSelected.row;
            if (targetRow < 0 || !rows[targetRow]) return;
            rows.splice(targetRow, 1);
            if (!rows.length) rows.push([]);
            visualSelected = { row: Math.min(targetRow, rows.length - 1), col: -1 };
            syncVisualInputs(null);
            renderVisualPreview();
        });
        document.getElementById('vkVisualAddKeyBtn')?.addEventListener('click', () => {
            const rows = getLayoutRows();
            if (!rows.length) rows.push([]);
            const targetRow = visualSelected.row >= 0 ? visualSelected.row : rows.length - 1;
            rows[targetRow].push({ key: 'new', label: 'new', keepSize: true });
            visualSelected = { row: targetRow, col: rows[targetRow].length - 1 };
            syncVisualInputs(getKeyObj(rows[targetRow][visualSelected.col]));
            renderVisualPreview();
        });
        document.getElementById('vkVisualDeleteKeyBtn')?.addEventListener('click', () => {
            const rows = getLayoutRows();
            const { row, col } = visualSelected;
            if (row < 0 || col < 0 || !rows[row]) return;
            rows[row].splice(col, 1);
            visualSelected = { row, col: -1 };
            syncVisualInputs(null);
            renderVisualPreview();
        });
        resetCurrentVisualBtn?.addEventListener('click', () => {
            const layoutName = document.getElementById('vkVisualLayoutSelect')?.selectedOptions?.[0]?.textContent?.trim?.() || visualLayoutKey;
            if (!confirm(`确定要将“${layoutName}”重置为默认键盘吗？`)) return;
            this.config.layouts = this.config.layouts || {};
            this.config.layouts[visualLayoutKey] = cloneKeyboardLayout(DEFAULT_KEYBOARD_CONFIG.layouts?.[visualLayoutKey] || [[]]);
            visualSelected = { row: -1, col: -1 };
            visualKeyboardVisible = true;
            syncVisualInputs(null);
            renderVisualPreview();
            showSnackbar('已重置当前键盘为默认', 'success');
        });
        toggleVisualKeyboardBtn?.addEventListener('click', () => {
            visualKeyboardVisible = !visualKeyboardVisible;
            updateVisualKeyboardState();
            showSnackbar(visualKeyboardVisible ? '已打开可视化键盘预览' : `${getVisualSelectedText()}，已关闭键盘预览`, 'info');
        });
        document.getElementById('vkVisualMoveLeftBtn')?.addEventListener('click', () => moveSelectedKey(-1, 0));
        document.getElementById('vkVisualMoveRightBtn')?.addEventListener('click', () => moveSelectedKey(1, 0));
        document.getElementById('vkVisualMoveUpBtn')?.addEventListener('click', () => moveSelectedKey(0, -1));
        document.getElementById('vkVisualMoveDownBtn')?.addEventListener('click', () => moveSelectedKey(0, 1));
        document.getElementById('vkVisualKeyValueInput')?.addEventListener('input', (e) => patchSelectedKey({ key: e.target.value || '' }));
        document.getElementById('vkVisualKeyLabelInput')?.addEventListener('input', (e) => patchSelectedKey({ label: e.target.value || null }));
        document.getElementById('vkVisualKeyFlexInput')?.addEventListener('input', (e) => {
            const flex = Number(e.target.value);
            patchSelectedKey({ flex: Number.isFinite(flex) && flex > 0 ? Math.max(0.2, Math.min(12, flex)) : null });
        });
        document.getElementById('vkVisualKeySwipeInput')?.addEventListener('input', (e) => patchSelectedKey({ swipe: e.target.value || null }));
        document.getElementById('vkVisualKeySwipeLabelInput')?.addEventListener('input', (e) => patchSelectedKey({ swipeLabel: e.target.value || null }));
        document.getElementById('vkVisualKeySwipeColorInput')?.addEventListener('input', (e) => patchSelectedKey({ swipeColor: e.target.value || null }));
        document.getElementById('vkVisualKeyWidthInput')?.addEventListener('input', (e) => patchSelectedKeySize('width', e.target.value));
        document.getElementById('vkVisualKeyHeightInput')?.addEventListener('input', (e) => patchSelectedKeySize('height', e.target.value));
        document.getElementById('vkVisualKeyKeepSizeInput')?.addEventListener('change', (e) => patchSelectedKey({ keepSize: !!e.target.checked }));
        openVisualBtn?.addEventListener('click', () => {
            visualLayoutKey = 'text';
            const select = document.getElementById('vkVisualLayoutSelect');
            if (select) select.value = visualLayoutKey;
            visualKeyboardVisible = true;
            renderDynamicVars(dynamicVarListVisual);
            renderVisualPreview();
            if (visualDialog) visualDialog.open = true;
        });
        openVisualSettingBtn?.addEventListener('click', () => {
            dom.drawer.open = false;
            visualLayoutKey = 'text';
            const select = document.getElementById('vkVisualLayoutSelect');
            if (select) select.value = visualLayoutKey;
            visualKeyboardVisible = true;
            renderDynamicVars(dynamicVarListVisual);
            renderVisualPreview();
            if (visualDialog) visualDialog.open = true;
        });
        [closeVisualBtn, cancelVisualBtn].forEach(btn => btn?.addEventListener('click', () => { if (visualDialog) visualDialog.open = false; }));
        bindImmediateActionButton(saveVisualBtn, () => {
            this.config.layouts = this.config.layouts || {};
            this.save();
            if (visualDialog) visualDialog.open = false;
        });

        if (saveBtn) {
            bindImmediateActionButton(saveBtn, () => {
                beginOperation('keyboard_config_save', '保存键盘配置');
                const processInput = (textarea) => textarea.value.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                this.config.furnaceIdTemplates = processInput(inputs.furnaceId);
                this.config.productIdTemplates = processInput(inputs.productId);
                this.config.cardIdTemplates = processInput(inputs.cardId);
                this.config.steelTypeTemplates = processInput(inputs.steelType);
                this.config.statusTemplates = processInput(inputs.status);
                this.config.positionTemplates = processInput(inputs.position);
                
                this.save();
                commitOperation();
                closeModal();
            });
        }
        
        // Advanced JSON Editor Logic
        const openEditorBtn = document.getElementById('openAdvancedJsonEditorBtn');
        const editorDialog = document.getElementById('advancedJsonEditorDialog');
        const editorInput = document.getElementById('fullJsonEditorInput');
        const cancelEditorBtn = document.getElementById('cancelJsonEditorBtn');
        const closeEditorBtn = document.getElementById('closeAdvancedJsonEditorBtn');
        const applyEditorBtn = document.getElementById('applyJsonEditorBtn');

        if (openEditorBtn) {
            openEditorBtn.addEventListener('click', () => {
                editorInput.value = JSON.stringify(this.config, null, 2);
                document.body.appendChild(editorDialog);
                editorDialog.style.zIndex = '21000';
                editorDialog.open = true;
            });
        }

        const closeEditor = () => {
            editorDialog.open = false;
        };
        
        [cancelEditorBtn, closeEditorBtn].forEach(btn => btn?.addEventListener('click', closeEditor));

        if (applyEditorBtn) {
            applyEditorBtn.addEventListener('click', () => {
                try {
                    const newConfig = JSON.parse(editorInput.value);
                    this.config = newConfig;
                    updateInputsFromConfig();
                    showSnackbar('JSON配置已应用 (需点击保存生效)', 'success');
                    closeEditor();
                } catch (e) {
                    alert('JSON 格式错误: ' + e.message);
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('确定要恢复默认配置吗？')) {
                    this.reset();
                    updateInputsFromConfig();
                }
            });
        }

        // Import/Export Logic (JSON)
        const importBtn = document.getElementById('importKeyboardConfigBtn');
        const exportBtn = document.getElementById('exportKeyboardConfigBtn');
        const fileInput = document.getElementById('importKeyboardConfigInput');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const content = JSON.stringify(this.config, null, 2);
                const blob = new Blob([content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'keyboard_config.json';
                a.click();
                URL.revokeObjectURL(url);
            });
        }

        if (importBtn && fileInput) {
            importBtn.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const newConfig = JSON.parse(e.target.result);
                        this.config = { ...DEFAULT_KEYBOARD_CONFIG, ...newConfig };
                        updateInputsFromConfig();
                        showSnackbar('配置已导入，请点击保存生效', 'success');
                    } catch (err) {
                        alert('导入失败: 无效的 JSON 文件');
                    }
                    fileInput.value = ''; // reset
                };
                reader.readAsText(file);
            });
        }
        
        // MDUI dialog handles overlay click automatically, no need for window click listener
    }
};

function processKeyboardTemplates(templates, options = {}) {
    if (!Array.isArray(templates)) return [];
    const commitState = !!options.commitState;
    const now = new Date();
    const yearFull = now.getFullYear().toString();
    const year = yearFull.slice(2);
    const lastYear = (parseInt(year, 10) - 1).toString().slice(-2);
    const month = String(now.getMonth() + 1);
    const day = String(now.getDate());
    const custom = (KeyboardConfigManager?.config?.customVariables && typeof KeyboardConfigManager.config.customVariables === 'object')
        ? KeyboardConfigManager.config.customVariables
        : {};
    const dynamic = Array.isArray(KeyboardConfigManager?.config?.dynamicVariables) ? KeyboardConfigManager.config.dynamicVariables : [];
    const map = {
        year,
        lastYear,
        month,
        day,
        '今月月份': month,
        '今日': day
    };
    const pad2 = (n) => String(n).padStart(2, '0');
    const formatDate = (d, fmt) => {
        const y4 = String(d.getFullYear());
        const y2 = y4.slice(2);
        const m = d.getMonth() + 1;
        const dd = d.getDate();
        const fmtMap = {
            YYYY: y4,
            YY: y2,
            MM: pad2(m),
            M: String(m),
            DD: pad2(dd),
            D: String(dd)
        };
        let out = fmt || '';
        Object.keys(fmtMap).forEach(k => { out = out.split(k).join(fmtMap[k]); });
        return out || `${y4}${pad2(m)}${pad2(dd)}`;
    };
    const isoWeekNumber = (d) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    };
    const startOfIsoWeek = (d) => {
        const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayNum = date.getDay() || 7;
        date.setDate(date.getDate() - (dayNum - 1));
        date.setHours(0, 0, 0, 0);
        return date;
    };
    const today = () => new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const addDays = (date, days = 0) => {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        d.setDate(d.getDate() + Number(days || 0));
        return d;
    };
    const weekStart = () => startOfIsoWeek(now);
    const normalizeProgramCode = (code) => String(code || '')
        .replace(/\b(?:int|float|double|string|char|bool|long|short|unsigned|signed)\s+/g, 'let ')
        .replace(/\btrue\b/g, 'true')
        .replace(/\bfalse\b/g, 'false');
    const runProgramVariable = (def) => {
        const name = (def?.name || '').toString().trim();
        if (!name) return null;
        if (!def.code && !def.program) {
            const kind = (def?.kind || 'date').toString();
            const fmt = (def?.format || '').toString().trim();
            const offsetDays = Number.isFinite(Number(def?.offsetDays)) ? Math.round(Number(def.offsetDays)) : 0;
            if (kind === 'isoWeek') {
                const w = isoWeekNumber(now);
                return (fmt === 'W') ? String(w) : pad2(w);
            }
            if (kind === 'month') {
                const m = now.getMonth() + 1;
                return (fmt === 'MM') ? pad2(m) : String(m);
            }
            if (kind === 'day') {
                const dd = now.getDate();
                return (fmt === 'DD') ? pad2(dd) : String(dd);
            }
            if (kind === 'year') return (fmt === 'YYYY') ? String(now.getFullYear()) : String(now.getFullYear()).slice(2);
            if (kind === 'weekStart') return formatDate(addDays(weekStart(), offsetDays), fmt);
            if (kind === 'weekEnd') return formatDate(addDays(weekStart(), 6 + offsetDays), fmt);
            return formatDate(addDays(today(), offsetDays), fmt);
        }
        try {
            const program = normalizeProgramCode(def.code || def.program);
            const state = commitState ? (dynamicVariableState || (dynamicVariableState = {})) : { ...(dynamicVariableState || {}) };
            const stateKey = key => `${name}:${String(key || '')}`;
            const getVar = (key, fallback = 0) => Object.prototype.hasOwnProperty.call(state, stateKey(key)) ? state[stateKey(key)] : fallback;
            const setVar = (key, value) => { state[stateKey(key)] = value; if (commitState) saveDynamicVariableState(); return value; };
            const incVar = (key, step = 1, start = 0) => { const next = Number(getVar(key, start)) + Number(step || 0); state[stateKey(key)] = next; if (commitState) saveDynamicVariableState(); return next; };
            // 兼容旧版“i = 0; i++; return i”示例。预览在状态副本中计算下一值，点击时才写回。
            const counterMatch = program.match(/(?:let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*0\s*;\s*\1\+\+\s*;\s*return\s+\1\s*;?/i);
            if (counterMatch) return String(incVar(`__counter:${counterMatch[1]}`, 1, 0));
            const fn = new Function(
                'now', 'map', 'pad2', 'formatDate', 'isoWeek', 'today', 'weekStart', 'addDays', 'state', 'getVar', 'setVar', 'incVar',
                `"use strict";\n${program}`
            );
            const result = fn(now, map, pad2, formatDate, () => isoWeekNumber(now), today, weekStart, addDays, state, getVar, setVar, incVar);
            if (commitState) saveDynamicVariableState();
            return result == null ? '' : String(result);
        } catch (err) {
            console.warn(`自定义变量 ${name} 执行失败:`, err);
            return '';
        }
    };
    const dynamicDefinitions = new Map();
    dynamic.forEach(def => {
        const name = (def?.name || '').toString().trim();
        if (name) dynamicDefinitions.set(name, def);
    });
    const dynamicValues = new Map();
    Object.keys(custom).forEach(k => {
        const v = custom[k];
        if (typeof v === 'string' || typeof v === 'number') map[k] = String(v);
    });
    return templates.map(tpl => (tpl || '').toString().replace(/\$\{([^{}]+)\}|\{([^{}]+)\}/g, (m, dollarName, braceName) => {
        const key = String(dollarName || braceName || '').trim();
        if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
        if (!dynamicDefinitions.has(key)) return m;
        if (!dynamicValues.has(key)) dynamicValues.set(key, runProgramVariable(dynamicDefinitions.get(key)));
        const value = dynamicValues.get(key);
        return value == null ? '' : String(value);
    }));
}

		function generateVirtualKeyboard() {
// ────────────── 新增：统一处理快捷短语区域显隐 ──────────────
    const vk = document.getElementById('virtualKeyboard');
    const shortcutContainer = document.getElementById('shortcutContainer');

    if (shortcutContainer) {
        shortcutContainer.style.display = 'block';
    }
		  if (dom.shortcutKeysContainer) dom.shortcutKeysContainer.innerHTML = '';
		  dom.keyboardRows.innerHTML = '';
		  shortcutContainer?.classList.remove('has-shortcuts');
		  currentShortcutFieldKey = null;

		  const isUpperCase = keyboardState.shiftState === 'locked-on' || keyboardState.shiftState === 'on';
		  let keyRows = [];

          const processTemplates = processKeyboardTemplates;

          const layouts = KeyboardConfigManager.config.layouts;

		  switch(keyboardState.inputType) {
		    case 'number':
		    case 'numeric-input':
              const nk = keyboardState.numericFieldKey;
              if (
                  nk === 'actualDiameter' ||
                  nk === 'diameter' ||
                  nk === 'length' ||
                  nk === 'weight'
              ) {
                  const templates = getTemplatesByField(nk) || [];
                  const list = processTemplates(templates);
                  createShortcutKeys(list, 'shortcut-key', nk, templates);
              }
		      keyRows = layouts.number;
		      break;

		    case 'status':
              const statusShortcuts = processTemplates(KeyboardConfigManager.config.statusTemplates);
		      createShortcutKeys(statusShortcuts, 'status-key', 'status', KeyboardConfigManager.config.statusTemplates);
		      keyRows = layouts.status;
		      break;

		    case 'cardId':
		      const cardShortcuts = processTemplates(KeyboardConfigManager.config.cardIdTemplates);
              createShortcutKeys(cardShortcuts, 'shortcut-key', 'cardId', KeyboardConfigManager.config.cardIdTemplates);
              // fallthrough to text keyboard

		    case 'steelType':
              if (keyboardState.inputType === 'steelType') {
                  const steelShortcuts = processTemplates(KeyboardConfigManager.config.steelTypeTemplates);
                  createShortcutKeys(steelShortcuts, 'shortcut-key', 'steelType', KeyboardConfigManager.config.steelTypeTemplates);
              }

		    case 'productId':
              if (keyboardState.inputType === 'productId') {
                  const productShortcuts = processTemplates(KeyboardConfigManager.config.productIdTemplates);
                  createShortcutKeys(productShortcuts, 'shortcut-key', 'productId', KeyboardConfigManager.config.productIdTemplates);
              }
 
		    case 'furnaceId':
              if (keyboardState.inputType === 'furnaceId') {
                  const furnaceShortcuts = processTemplates(KeyboardConfigManager.config.furnaceIdTemplates);
                  createShortcutKeys(furnaceShortcuts, 'shortcut-key', 'furnaceId', KeyboardConfigManager.config.furnaceIdTemplates);
              }
              // Fallthrough to text keyboard for all above IDs
		    case 'text':
		    default:
		      keyRows = isUpperCase ? layouts.textShift : layouts.text;
		      break;

		    case 'position':
              const positionShortcuts = processTemplates(KeyboardConfigManager.config.positionTemplates);
		      createShortcutKeys(positionShortcuts, 'shortcut-key', 'position', KeyboardConfigManager.config.positionTemplates);
		      keyRows = layouts.position;
		      break;

		    case 'symbol':
              {
                  const fieldKey = getShortcutFieldKeyForInput(currentInput);
                  const templates = getTemplatesByField(fieldKey) || [];
                  if (templates.length) createShortcutKeys(processTemplates(templates), 'shortcut-key', fieldKey, templates);
              }
		      keyRows = layouts.symbol;
		      break;
		  }

		  keyRows.forEach(row => {
		    const rowElement = document.createElement('div');
		    rowElement.className = 'keyboard-row';
		    row.forEach(key => {
		      if (key !== undefined) rowElement.appendChild(createKeyElement(key));
		    });
		    dom.keyboardRows.appendChild(rowElement);
		  });
		  const shortcutCount = dom.shortcutKeysContainer?.querySelectorAll('.shortcut-key, .status-key').length || 0;
		  shortcutContainer?.classList.toggle('has-shortcuts', shortcutCount > 0 || shortcutEditMode);
		  scheduleDesktopShortcutPanelSync();
		  dom.shortcutKeysContainer?.querySelectorAll('.shortcut-key, .status-key').forEach((key, index) => {
		      if (!key.style.getPropertyValue('--shortcut-order')) {
		          key.style.setProperty('--shortcut-order', String(Math.min(index, 12)));
		      }
		  });
		  bindImeControls();
		  refreshImeCandidates();
		  updateVirtualKeyboardActionKeys();
		}



		function getKeyboardSwipeHint() {
		  let hint = document.getElementById('keyboardSwipeHint');
		  if (!hint) {
		    hint = document.createElement('div');
		    hint.id = 'keyboardSwipeHint';
		    hint.className = 'keyboard-swipe-hint';
		    hint.setAttribute('aria-hidden', 'true');
		    document.body.appendChild(hint);
		  }
		  return hint;
		}

		function showKeyboardSwipeHint(keyElement, text) {
		  const hint = getKeyboardSwipeHint();
		  const keyRect = keyElement.getBoundingClientRect();
		  hint.textContent = text;
		  hint.style.left = `${Math.max(44, Math.min(window.innerWidth - 44, keyRect.left + keyRect.width / 2))}px`;
		  hint.style.top = `${Math.max(8, keyRect.top - 10)}px`;
		  hint.classList.add('visible');
		}

		function hideKeyboardSwipeHint() {
		  document.getElementById('keyboardSwipeHint')?.classList.remove('visible');
		}

		function createKeyElement(keyData) {
		  const keyElement = document.createElement('div');
		  keyElement.className = 'keyboard-key';
          
          let key = keyData;
          let customSwipe = null;
          let customSwipeLabel = null;
          let customStyles = {};
          let customLabel = null;
          let swipeColor = '#4caf50'; // Default green
          let hasCustomSwipeColor = false;

          // Support object definition for custom size/style/swipe via JSON
          if (typeof keyData === 'object' && keyData !== null) {
              key = keyData.key || '';
              if (keyData.flex) keyElement.style.flex = `${keyData.flex} 1 0`;
              if (keyData.width) keyElement.classList.add(keyData.width);
              if (keyData.cls) keyElement.classList.add(keyData.cls);
              
              if (keyData.swipe) customSwipe = keyData.swipe;
              if (keyData.swipeLabel) customSwipeLabel = keyData.swipeLabel;
              if (keyData.label) customLabel = keyData.label;
              if (keyData.swipeColor) {
                  swipeColor = keyData.swipeColor;
                  hasCustomSwipeColor = true;
              }
              
              if (keyData.style) {
                  Object.assign(keyElement.style, keyData.style);
              }
              if (keyData.keepSize === false) {
                  keyElement.style.flex = '0 0 auto';
                  if (keyData.widthPercent) keyElement.style.width = `${keyData.widthPercent}%`;
                  if (keyData.heightPercent) keyElement.style.height = `${keyData.heightPercent}%`;
              }
          }

		  // 首先处理空占位键
		  if (key === '') {
		    keyElement.classList.add('empty');
		    return keyElement;
		  }

		  // 特殊功能键 - Shift
		  if (key === 'shift') {
		    keyElement.className += ' special wide';
            
            // MDUI Icons for Shift States
            let iconName = 'keyboard_arrow_up'; 
            
            if (keyboardState.shiftState === 'locked-on') {
                iconName = 'vertical_align_top';
            } else if (keyboardState.shiftState === 'on') {
                iconName = 'arrow_upward'; 
            } else {
                iconName = 'keyboard_arrow_up';
            }
            
            keyElement.innerHTML = `<mdui-icon name="${iconName}"></mdui-icon>`;
		    keyElement.addEventListener('click', toggleShift);
		    return keyElement;
		  }

		  if (key === 'backspace') {
		    keyElement.className += ' special wide';
		    keyElement.textContent = '←';

		    let deleteDelayTimer = null;
		    let deleteRepeatTimer = null;
		    let deleteHintTimer = null;
		    const DELETE_DELAY = 250;
		    const DELETE_SPEED = 80;
		    const SWIPE_CLEAR_DISTANCE = 28;
            let startY = 0;
            let pointerId = null;
            let isClearGesture = false;
            let didRepeatDelete = false;

		    keyElement.addEventListener('pointerdown', (e) => {
		      e.preventDefault();
              pointerId = e.pointerId;
              startY = e.clientY;
		      isClearGesture = false;
		      didRepeatDelete = false;
		      deleteHintTimer = setTimeout(() => {
		        if (pointerId === e.pointerId) showKeyboardSwipeHint(keyElement, '上滑清空');
		      }, 180);
		      deleteDelayTimer = setTimeout(() => {
		        if (isClearGesture) return;
		        didRepeatDelete = true;
		        showKeyboardSwipeHint(keyElement, '上滑清空');
		        handleImeBackspace();
		        deleteRepeatTimer = setInterval(() => {
		           if (!isClearGesture) handleImeBackspace();
		        }, DELETE_SPEED);
		      }, DELETE_DELAY);
              keyElement.setPointerCapture(e.pointerId);
		    });
            
            keyElement.addEventListener('pointermove', (e) => {
		        if (pointerId !== e.pointerId) return;
		        const shouldClear = startY - e.clientY > SWIPE_CLEAR_DISTANCE;
		        if (shouldClear === isClearGesture) return;
		        isClearGesture = shouldClear;
		        keyElement.classList.toggle('swipe-close', isClearGesture);
		        if (isClearGesture) showKeyboardSwipeHint(keyElement, '上滑清空');
		        else hideKeyboardSwipeHint();
		        if (isClearGesture) {
		            clearTimeout(deleteDelayTimer);
		            clearTimeout(deleteHintTimer);
		            clearInterval(deleteRepeatTimer);
		            deleteDelayTimer = null;
		            deleteRepeatTimer = null;
		        }
            });

		    const stopDeleting = (e) => {
		      if (pointerId !== e?.pointerId) return;
		      const shouldClear = e.type === 'pointerup' && (isClearGesture || startY - Number(e.clientY || 0) > SWIPE_CLEAR_DISTANCE);
		      const shouldDeleteOnce = e.type === 'pointerup' && !shouldClear && !didRepeatDelete;
		      pointerId = null;
		      isClearGesture = false;
		      keyElement.classList.remove('swipe-close');
		      hideKeyboardSwipeHint();
		      clearTimeout(deleteDelayTimer);
		      clearTimeout(deleteHintTimer);
		      clearInterval(deleteRepeatTimer);
		      deleteDelayTimer = null;
		      deleteHintTimer = null;
		      deleteRepeatTimer = null;
		      if (e && e.pointerId && keyElement.hasPointerCapture(e.pointerId)) keyElement.releasePointerCapture(e.pointerId);
		      if (shouldClear) requestClearCurrentInput();
		      else if (shouldDeleteOnce) handleImeBackspace();
		    };

		    keyElement.addEventListener('pointerup', stopDeleting);
		    keyElement.addEventListener('pointercancel', stopDeleting);
		    keyElement.addEventListener('click', (e) => e.preventDefault());

		    return keyElement;
		  }

		  if (key === 'space') {
		    keyElement.className += ' special extra-wide';
		    keyElement.textContent = '';
		    keyElement.addEventListener('click', handleImeSpace);
		    return keyElement;
		  }

		  if (key === 'esc') {
		    keyElement.className += ' system-keyboard wide';
		    keyElement.textContent = '✔';  
		    keyElement.addEventListener('click', () => {
		        commitImeComposition();
		        closeVirtualKeyboardAndKeepReadOnly();
		    });
		    return keyElement;  
		  }
		if(key === 'done') {
		    keyElement.className += ' special wide';
		    keyElement.id = 'virtualKeyboardDoneKey';
		    keyElement.style.position = 'relative';
		    keyElement.textContent = '▼';

            let startY = 0;
            let isSwipe = false;
            let doneHintTimer = null;
            const SWIPE_CLOSE_DISTANCE = 28;

            keyElement.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                keyElement.setPointerCapture(e.pointerId);
                
                startY = e.clientY;
                isSwipe = false;
                keyElement.classList.add('active');
                doneHintTimer = setTimeout(() => {
                    if (keyElement.hasPointerCapture(e.pointerId)) showKeyboardSwipeHint(keyElement, '上滑关闭键盘');
                }, 180);
            });

            keyElement.addEventListener('pointermove', (e) => {
                if (!keyElement.hasPointerCapture(e.pointerId)) return;
                
                const currentY = e.clientY;
                
                // Visual Feedback for Swipe Up
                if (startY - currentY > SWIPE_CLOSE_DISTANCE) {
					if (!isSwipe) {
						isSwipe = true;
						keyElement.classList.add('swipe-close'); // Yellow warning style
						showKeyboardSwipeHint(keyElement, '上滑关闭键盘');
					}
				} else {
					if (isSwipe) {
						isSwipe = false;
						keyElement.classList.remove('swipe-close');
						hideKeyboardSwipeHint();
						updateVirtualKeyboardActionKeys();
					}
                }
            });

			const handlePointerUp = (e) => {
				clearTimeout(doneHintTimer);
				doneHintTimer = null;
				keyElement.classList.remove('active');
				keyElement.classList.remove('swipe-close');
				hideKeyboardSwipeHint();
                if (keyElement.hasPointerCapture(e.pointerId)) keyElement.releasePointerCapture(e.pointerId);
                
                const endY = e.clientY;
                
                // Swipe Up -> Close
                if (isSwipe || (startY - endY > SWIPE_CLOSE_DISTANCE)) { 
                    closeVirtualKeyboardAndKeepReadOnly();
                    return;
                }
		        updateVirtualKeyboardActionKeys();
		        if (confirmPendingImeInput()) return;
                
                // Tap -> Done/Next
		        if (keyboardState.isQuickEdit) {
		            commitImeComposition();
		            closeVirtualKeyboardAndKeepReadOnly();
		        } else if (isCurrentKeyboardLastInput()) {
		            commitImeComposition();
		            currentInput?.blur?.();
		            closeVirtualKeyboardAndKeepReadOnly();
		        } else {
		            commitImeComposition();
		            handleNextInput();
                }
            };

            keyElement.addEventListener('pointerup', handlePointerUp);
            keyElement.addEventListener('pointercancel', (e) => {
                clearTimeout(doneHintTimer);
                doneHintTimer = null;
                keyElement.classList.remove('active', 'swipe-close');
                hideKeyboardSwipeHint();
                if (keyElement.hasPointerCapture(e.pointerId)) keyElement.releasePointerCapture(e.pointerId);
            });

            keyElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
		    requestAnimationFrame(updateVirtualKeyboardActionKeys);

		    return keyElement;
		}

		  if (key === 'clear') {
		    keyElement.className += ' clear-key wide';
		    keyElement.textContent = '清空';
		    keyElement.addEventListener('click', clearInput);
		    return keyElement;
		  }

		  if (key === 'symbol') {
		    keyElement.className += ' special wide';
		    keyElement.textContent = '符';
		    keyElement.addEventListener('click', () => {
		      commitImeComposition();
		      keyboardState.inputType = 'symbol';
		      saveKeyboardState();
		      generateVirtualKeyboard();
		    });
		    return keyElement;
		  }

    // 系统键盘键（新添加）
  if (key === 'system') {
    keyElement.className += ' system-key wide';
    keyElement.textContent = '⌨️';  
    keyElement.addEventListener('click', () => {
      if (currentInput) {
		commitImeComposition();
        
        currentInput.removeAttribute('readonly');
        currentInput.classList.remove('readonly-input');

        // 2. 关闭虚拟键盘
        setVirtualKeyboardVisible(false);

        // 3. 焦点回到输入框，触发系统键盘弹出
        currentInput.focus();


      }
    });
    return keyElement;
  }

		  if (key === 'ABC') {
		    keyElement.className += ' special wide';
		    keyElement.textContent = 'ABC';
		    keyElement.addEventListener('click', () => {
		      // 修复：返回时根据当前输入框自动判断键盘类型，而不是强制设为 text
		      if (currentInput) {
		          updateKeyboardForInput(currentInput);
		      } else {
		          keyboardState.inputType = 'text';
		          saveKeyboardState();
		          generateVirtualKeyboard();
		      }
		    });
		    return keyElement;
		  }

		  // 普通字符键（最后处理）
          const lowerKey = key.toLowerCase();
          const symbol = customSwipe || KeyboardConfigManager.config.symbolMap[lowerKey];
          const displayLabel = customLabel || key;
          
          if ((symbol && key.length === 1 && /[a-zA-Z]/.test(key)) || customSwipe) {
              // Character Key with Symbol OR Custom Swipe Key
              keyElement.innerHTML = `
                  <div class="key-inner">
                      <span class="key-symbol" style="color: ${customSwipe || hasCustomSwipeColor ? swipeColor : ''}">${customSwipeLabel || symbol}</span>
                      <span class="key-char">${displayLabel}</span>
                  </div>
              `;
              
              let startY = 0;
              let isSwipe = false;
              let lastInputType = null; // 'key' or 'symbol'
              
              keyElement.addEventListener('pointerdown', (e) => {
                  e.preventDefault();
                  keyElement.setPointerCapture(e.pointerId);
                  
                  startY = e.clientY;
                  isSwipe = false;
                  
                  // Visual feedback only
                  keyElement.classList.add('active');
                  // REMOVED: Immediate insertText(key) to avoid double input on swipe
              });

              keyElement.addEventListener('pointermove', (e) => {
                  if (!keyElement.hasPointerCapture(e.pointerId)) return;
                  
                  const currentY = e.clientY;
                  
                  // Check for Swipe Up (Threshold 30px)
                  if (startY - currentY > 30) {
                      if (!isSwipe) {
                          isSwipe = true;
                          // Visual Feedback: Turn Symbol Green (or custom color)
                          keyElement.classList.add('swipe-active'); 
                          // Apply custom color to symbol dynamically if needed, 
                          // but inline style handles static color. 
                          // The class .swipe-active scales it up.
                          const symbolEl = keyElement.querySelector('.key-symbol');
                          if (symbolEl) symbolEl.style.color = swipeColor;
                      }
                  } else {
                      if (isSwipe) {
                          isSwipe = false;
                          keyElement.classList.remove('swipe-active');
                          // Revert color if it was custom? 
                          // If it was custom static, we keep it. 
                          // If it was default grey and turned green, we revert.
                          const symbolEl = keyElement.querySelector('.key-symbol');
                          if (symbolEl) symbolEl.style.color = customSwipe || hasCustomSwipeColor ? swipeColor : ''; 
                      }
                  }
              });
              
              const handlePointerUp = (e) => {
                  keyElement.classList.remove('active');
                  keyElement.classList.remove('swipe-active');
                  keyElement.releasePointerCapture(e.pointerId);
                  
                  // Revert color cleanup
                  const symbolEl = keyElement.querySelector('.key-symbol');
                  if (symbolEl) symbolEl.style.color = customSwipe || hasCustomSwipeColor ? swipeColor : ''; 
                  
                  if (e.type === 'pointercancel') return;

                  const endY = e.clientY;
                  
                  // Check if final state is Swipe Up
		              if (isSwipe || (startY - endY > 30)) { 
		                  // Swipe Up Action: Input Symbol
		                  commitImeComposition();
		                  insertText(symbol);
		              } else {
		                  // Tap Action: Input Character
		                  handleImeCharacter(key);
                  }
                  
                  // Handle Shift Toggle
                  if (keyboardState.shiftState === 'on') {
                      keyboardState.shiftState = 'off';
                      saveKeyboardState();
                      generateVirtualKeyboard();
                  }
              };

              keyElement.addEventListener('pointerup', handlePointerUp);
              keyElement.addEventListener('pointercancel', handlePointerUp);
              
              keyElement.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
              });
              
              return keyElement;
          }
          
		  keyElement.textContent = displayLabel;
		  
		  let plainPointerId = null;
		  let plainStartX = 0;
		  let plainStartY = 0;
		  keyElement.addEventListener('pointerdown', (e) => {
		      e.preventDefault();
		      plainPointerId = e.pointerId;
		      plainStartX = e.clientX;
		      plainStartY = e.clientY;
		      keyElement.setPointerCapture?.(e.pointerId);
		      keyElement.classList.add('active');
		  });
		  keyElement.addEventListener('pointerup', (e) => {
		      if (plainPointerId !== e.pointerId) return;
		      keyElement.classList.remove('active');
		      const moved = Math.hypot(e.clientX - plainStartX, e.clientY - plainStartY);
		      const consumed = Date.now() - (window.__rsdbKeyboardSwipeConsumedAt || 0) < 260;
		      plainPointerId = null;
		      if (moved > 24 || consumed) return;
		      handleImeCharacter(key);
		      if (keyboardState.shiftState === 'on') {
		          keyboardState.shiftState = 'off';
		          saveKeyboardState();
		          generateVirtualKeyboard();
		      }
		  });
		  keyElement.addEventListener('pointercancel', () => {
		      plainPointerId = null;
		      keyElement.classList.remove('active');
		  });
          
          // Disable default click to prevent double input
          keyElement.addEventListener('click', (e) => {
             e.preventDefault();
             e.stopPropagation();
          });

		  return keyElement;
		}

		function handleNextInput() {
		  if (confirmPendingImeInput()) return;
		  commitImeComposition();
		  if (isCurrentKeyboardLastInput()) {
		      currentInput?.blur?.();
		      closeVirtualKeyboardAndKeepReadOnly();
		      return;
		  }
		  if (imagePreviewEditState?.active) {
		      switchImagePreviewField(1);
		      return;
		  }
		  if (!currentInput) {
		    setVirtualKeyboardVisible(false);
		    return;
		  }

		  const currentId = currentInput.id;
		  const isCalcInput = currentInput.closest('#calculatorForm');
		  const isQuickEditInput = currentId === 'quickEditInput';

		  if (isQuickEditInput) {
		      saveQuickEdit(); 
		      setVirtualKeyboardVisible(false);
		      return;
		  }

		  let nextInput = null;
		  if (isCalcInput) {
		      const calcInputs = [dom.calcDiameter1, dom.calcDiameter2, dom.calcLength];
		      const currentIndex = calcInputs.indexOf(currentInput);
		      if (currentIndex === calcInputs.length - 1) {
		          currentInput.blur?.();
		          closeVirtualKeyboardAndKeepReadOnly();
		          return;
		      }
		      const nextIndex = currentIndex + 1;
		      nextInput = calcInputs[nextIndex];
		  } else {
		      const currentIndex = inputFieldOrder.indexOf(currentId);
		      const nextIndex = currentIndex + 1;
		      nextInput = formElements[inputFieldOrder[nextIndex]];
		  }

		  if (!nextInput) {
		      setVirtualKeyboardVisible(false);
		      return;
		  }

		  if (isCalcInput) {
		      activateConfiguredInput(nextInput);
		      window.updateEditInputModeUI?.(nextInput);
		      if (isVirtualKeyboardConfigured(nextInput.id)) resetCursorToEnd(nextInput);
		  } else {
		      activateConfiguredInput(nextInput);
		  }
		  const modalContent = currentInput?.closest('.modal-body-custom, .material-dialog-body'); 
		  if(modalContent) {
		      setTimeout(() => {
		          const inputRect = currentInput.getBoundingClientRect();
		          const modalRect = modalContent.getBoundingClientRect();
		          const offset = inputRect.top - modalRect.top + modalContent.scrollTop - modalRect.height * 0.3; 
		          modalContent.scrollTo({ top: offset, behavior: 'smooth' });
		      }, 50);
		  }
		}

		function updateKeyboardForInput(input, overrideId = null) {
		  if (!input) return;
		  if (imeState.input && imeState.input !== input) commitImeComposition();
		  imeState.englishCandidatesDismissed = false;
		  document.querySelectorAll('.rsdb-active-input').forEach(el => {
		      if (el !== input) el.classList.remove('rsdb-active-input');
		  });
		  input.classList.add('rsdb-active-input');

		  // Handle Quick Edit Input redirection
		  let currentId = overrideId || input.id;
		  if (currentId === 'quickEditInput' && dom.quickEditField && dom.quickEditField.value) {
		      currentId = dom.quickEditField.value;
		  }
		  if (inputFieldOrder.includes(currentId)) keyboardState.shortcutFieldKey = currentId;

		  const numericFields = ['actualDiameter', 'diameter', 'length', 'weight', 'hardness', 'calcDiameter1', 'calcDiameter2', 'calcLength', 'calcDensity'];
		  const isNumeric = numericFields.includes(currentId);

		  if (isNumeric) {
		    keyboardState.inputType = 'number';
		    keyboardState.numericFieldKey = currentId;
		  }
		  else if (currentId === 'productId') keyboardState.inputType = 'productId';
		  else if (currentId === 'cardId') keyboardState.inputType = 'cardId';
		  else if (currentId === 'steelType') keyboardState.inputType = 'steelType';
		  else if (currentId === 'furnaceId') keyboardState.inputType = 'furnaceId';
		  else if (currentId === 'position') keyboardState.inputType = 'position';
		  else if (currentId === 'status') keyboardState.inputType = 'status';
		  else {
		    keyboardState.inputType = 'text';
		    keyboardState.numericFieldKey = null;
		  }

		  saveKeyboardState();
		  generateVirtualKeyboard();
		}

		function replaceInputRange(targetInput, startPos, endPos, text) {
		  if (!targetInput) return;
		  targetInput.focus();
		  window.__rsdbLastCursorInteractAt = Date.now();
		  const currentValue = targetInput.value || '';
		  const len = currentValue.length;
		  const safeStart = Math.max(0, Math.min(len, Number(startPos) || 0));
		  const safeEnd = Math.max(safeStart, Math.min(len, Number(endPos) || 0));
		  const insertedText = String(text ?? '');
		  targetInput.value = currentValue.substring(0, safeStart) + insertedText + currentValue.substring(safeEnd);
		  const nextPos = safeStart + insertedText.length;
		  try {
		    targetInput.setSelectionRange(nextPos, nextPos);
		  } catch (e) {
		    try {
		      targetInput.selectionStart = nextPos;
		      targetInput.selectionEnd = nextPos;
		    } catch (e2) {}
		  }
		  targetInput.dispatchEvent(new Event('input', { bubbles: true }));
		  if (targetInput.closest('#calculatorForm')) calculateWeight();
		  else if (targetInput.id === 'searchInput' && isSearchReplaceVisible) startSearch();
		  updateVirtualCursor();
		  setTimeout(updateVirtualCursor, 0);
		  scheduleShortcutKeysRefresh();
		}

		function insertTextToInput(targetInput, text) {
		  if (!targetInput) return;
		  const currentValue = targetInput.value || '';
		  const len = currentValue.length;
		  const rawStart = typeof targetInput.selectionStart === 'number' ? targetInput.selectionStart : len;
		  const rawEnd = typeof targetInput.selectionEnd === 'number' ? targetInput.selectionEnd : len;
		  replaceInputRange(targetInput, rawStart, rawEnd, text);
		}

		function insertText(text) {
		  if (!currentInput) return;
  if (window.__rsdbKeyboardSwipeConsumedAt && Date.now() - window.__rsdbKeyboardSwipeConsumedAt < 220) {
    return;
  }
		  if (imeState.composition) commitImeComposition();
		  insertTextToInput(currentInput, text);
		  refreshImeCandidates();
		}

		function handleBackspace() {
		  if (!currentInput) return;
		  currentInput.focus();
          window.__rsdbLastCursorInteractAt = Date.now();

		  const currentValue = currentInput.value || '';
		  const len = currentValue.length;
		  const rawStart = typeof currentInput.selectionStart === 'number' ? currentInput.selectionStart : len;
		  const rawEnd = typeof currentInput.selectionEnd === 'number' ? currentInput.selectionEnd : len;
		  const startPos = Math.max(0, Math.min(len, rawStart));
		  const endPos = Math.max(0, Math.min(len, rawEnd));

		  if (startPos === endPos && startPos > 0) {
		    currentInput.value = currentValue.substring(0, startPos - 1) + currentValue.substring(endPos);
		    const nextPos = startPos - 1;
		    try {
		      currentInput.setSelectionRange(nextPos, nextPos);
		    } catch (e) {
		      try {
		        currentInput.selectionStart = nextPos;
		        currentInput.selectionEnd = nextPos;
		      } catch (e2) {}
		    }
		  } else if (startPos !== endPos) {
		    currentInput.value = currentValue.substring(0, startPos) + currentValue.substring(endPos);
		    try {
		      currentInput.setSelectionRange(startPos, startPos);
		    } catch (e) {
		      try {
		        currentInput.selectionStart = startPos;
		        currentInput.selectionEnd = startPos;
		      } catch (e2) {}
		    }
		  }

		  const event = new Event('input', { bubbles: true });
		  currentInput.dispatchEvent(event);

		  if (currentInput.closest('#calculatorForm')) calculateWeight();
		  else if (currentInput.id === 'searchInput' && isSearchReplaceVisible) startSearch();
          
		  updateVirtualCursor();
		  setTimeout(updateVirtualCursor, 0);
		  scheduleShortcutKeysRefresh();
		  refreshImeCandidates();
		}

		function clearInput(targetInput = currentInput) {
		  if (!targetInput || typeof targetInput.value !== 'string' || typeof targetInput.focus !== 'function') {
		    targetInput = currentInput;
		  }
		  clearImeComposition(false);
		  if (targetInput) {
		    currentInput = targetInput;
		    targetInput.value = '';
		    targetInput.focus();
            window.__rsdbLastCursorInteractAt = Date.now();
		    const event = new Event('input', { bubbles: true });
		    targetInput.dispatchEvent(event);
		    if (targetInput.closest('#calculatorForm')) calculateWeight();
		    else if (targetInput.id === 'searchInput' && isSearchReplaceVisible) startSearch();
            updateVirtualCursor();
		    scheduleShortcutKeysRefresh();
		  }
		  refreshImeCandidates();
		}

		function requestClearCurrentInput() {
		    const targetInput = imeState.input || currentInput;
		    if (!targetInput) return;
		    const characterCount = Array.from(targetInput.value || '').length;
		    if (characterCount <= 50) {
		        clearInput(targetInput);
		        return;
		    }
		    const dialog = document.getElementById('clearInputConfirmDialog');
		    const cancelButton = document.getElementById('cancelClearInputBtn');
		    const confirmButton = document.getElementById('confirmClearInputBtn');
		    if (!dialog || !cancelButton || !confirmButton) return;
		    const closeAndRestoreFocus = () => {
		        dialog.open = false;
		        requestAnimationFrame(() => targetInput.focus({ preventScroll: true }));
		    };
		    cancelButton.onclick = closeAndRestoreFocus;
		    confirmButton.onclick = () => {
		        dialog.open = false;
		        clearInput(targetInput);
		    };
		    dialog.open = true;
		}

		// === IndexedDB 初始化和操作 ===
		const DB_NAME = 'RoundBarDB';
		const DB_VERSION = 4;
		const STORE_NAME = 'data';
		const HISTORY_STORE_NAME = 'operationHistory';
		const FONT_STORE_NAME = 'importedFonts';
		const DOCUMENT_STORE_NAME = 'documents';
		let db = null;

		function openDB() {
		    return new Promise((resolve, reject) => {
		        if (db) {
		            resolve(db);
		            return;
		        }

		        const request = indexedDB.open(DB_NAME, DB_VERSION);

		        request.onerror = () => {
		            console.error('IndexedDB 打开失败:', request.error);
		            reject(request.error);
		        };

		        request.onsuccess = () => {
		            db = request.result;
		            resolve(db);
		        };

		        request.onupgradeneeded = (event) => {
		            db = event.target.result;
		            if (!db.objectStoreNames.contains(STORE_NAME)) {
		                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
		            }
		            if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
		                db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id', autoIncrement: true });
		            }
		            if (!db.objectStoreNames.contains(FONT_STORE_NAME)) {
		                db.createObjectStore(FONT_STORE_NAME, { keyPath: 'name' });
		            }
		            if (!db.objectStoreNames.contains(DOCUMENT_STORE_NAME)) {
		                db.createObjectStore(DOCUMENT_STORE_NAME, { keyPath: 'name' });
		            }
		        };
		    });
		}

		// 保存所有数据（覆盖式）
		
// ==========================================
// === Data Persistence (IndexedDB) ===
// ==========================================
let dataPersistTimer = null;
let dataPersistWaiters = [];

function waitForTransaction(tx) {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });
}

function saveDataToIndexedDB() {
    clearTimeout(dataPersistTimer);
    const promise = new Promise((resolve, reject) => dataPersistWaiters.push({ resolve, reject }));
    dataPersistTimer = setTimeout(flushDataToIndexedDB, 100);
    return promise;
}

async function flushDataToIndexedDB() {
    dataPersistTimer = null;
    const waiters = dataPersistWaiters.splice(0);
		    try {
		        const db = await openDB();
		        const rowsSnapshot = typeof structuredClone === 'function'
		            ? structuredClone(tableData)
		            : JSON.parse(JSON.stringify(tableData));
		        const tx = db.transaction(STORE_NAME, 'readwrite');
		        const store = tx.objectStore(STORE_NAME);
		        store.clear();
		        store.put({ id: '__snapshot__', __snapshot: true, rows: rowsSnapshot, savedAt: Date.now() });
		        await waitForTransaction(tx);
		        console.log('IndexedDB 保存成功，共', tableData.length, '条数据');
		        
		        // 保存操作历史数据
		        try {
		            const historyTx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
		            const historyStore = historyTx.objectStore(HISTORY_STORE_NAME);
		            
		            // 清空旧的操作历史数据
		            historyStore.clear();
		            
		            // 添加新的操作历史数据（只保存一条记录，包含完整的操作历史和游标）
		            const historyData = {
		                operationHistory: operationHistory || [],
		                historyCursor: historyCursor || 0,
		                timestamp: Date.now()
		            };
		            
		            historyStore.add(historyData);
		            await waitForTransaction(historyTx);
		            console.log('IndexedDB 保存操作历史成功，共', operationHistory.length, '条记录');
		        } catch (historyErr) {
		            console.error('IndexedDB 保存操作历史失败:', historyErr);
		        }
		        waiters.forEach(waiter => waiter.resolve());
		        
		    } catch (err) {
		        console.error('IndexedDB 保存失败:', err);
		        showSnackbar('数据保存失败（IndexedDB错误）', 'error');
		        waiters.forEach(waiter => waiter.reject(err));
		    }
		}

		function closeInputKeyboard() {
		    const input = currentInput;
		    if (input && typeof input.blur === 'function') input.blur();
		    const active = document.activeElement;
		    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) active.blur?.();
		    currentInput = null;
		    setVirtualKeyboardVisible(false);
		    desktopShortcutPanelActive = false;
		    scheduleDesktopShortcutPanelSync();
		}

		function cloneRowsForPersistence(rows) {
		    return typeof structuredClone === 'function'
		        ? structuredClone(rows)
		        : JSON.parse(JSON.stringify(rows || []));
		}

		const DOCUMENT_FOLDERS_KEY = 'rsdb_document_folders_v1';

		function listDocumentFolders(records = []) {
		    let stored = [];
		    try { stored = JSON.parse(localStorage.getItem(DOCUMENT_FOLDERS_KEY) || '[]'); } catch (error) {}
		    return [...new Set([
		        ...(Array.isArray(stored) ? stored : []),
		        ...(records || []).map(record => String(record?.folder || '').trim())
		    ].map(name => String(name || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
		}

		function saveDocumentFolders(folders) {
		    const normalized = [...new Set((folders || []).map(name => String(name || '').trim()).filter(Boolean))];
		    localStorage.setItem(DOCUMENT_FOLDERS_KEY, JSON.stringify(normalized));
		    return normalized;
		}

		function addDocumentFolder(name) {
		    const normalized = String(name || '').trim().slice(0, 60);
		    if (!normalized) return false;
		    saveDocumentFolders([...listDocumentFolders(), normalized]);
		    return normalized;
		}

		function deleteDocumentFolders(names) {
		    const deleting = new Set((names || []).map(name => String(name || '').trim()).filter(Boolean));
		    if (!deleting.size) return [];
		    const remaining = listDocumentFolders().filter(folder => !deleting.has(folder));
		    saveDocumentFolders(remaining);
		    return [...deleting];
		}

		function normalizeDocumentName(name) {
		    return sanitizeFileName(String(name || '').replace(/\.(xlsx|xls|zip)$/i, '').trim()).slice(0, 120);
		}

		async function listDocuments() {
		    const database = await openDB();
		    const tx = database.transaction(DOCUMENT_STORE_NAME, 'readonly');
		    const request = tx.objectStore(DOCUMENT_STORE_NAME).getAll();
		    const records = await new Promise((resolve, reject) => {
		        request.onsuccess = () => resolve(request.result || []);
		        request.onerror = () => reject(request.error);
		    });
		    return records.sort((a, b) => Number(b.updatedAt || b.savedAt || 0) - Number(a.updatedAt || a.savedAt || 0));
		}

		async function documentNameExists(name) {
		    const normalized = normalizeDocumentName(name);
		    if (!normalized) return false;
		    const database = await openDB();
		    const tx = database.transaction(DOCUMENT_STORE_NAME, 'readonly');
		    const request = tx.objectStore(DOCUMENT_STORE_NAME).get(normalized);
		    const record = await new Promise((resolve, reject) => {
		        request.onsuccess = () => resolve(request.result || null);
		        request.onerror = () => reject(request.error);
		    });
		    return !!record;
		}

		async function createAvailableDocumentCopyName(name) {
		    const normalized = normalizeDocumentName(name);
		    if (!normalized) return '';
		    const existingNames = new Set((await listDocuments()).map(record => normalizeDocumentName(record.name)));
		    let copyIndex = 1;
		    let candidate = '';
		    do {
		        const suffix = ` (${copyIndex})`;
		        const baseName = normalized.slice(0, Math.max(1, 120 - suffix.length)).trimEnd();
		        candidate = normalizeDocumentName(`${baseName}${suffix}`);
		        copyIndex += 1;
		    } while (existingNames.has(candidate));
		    return candidate;
		}

		async function getDocumentRecord(name) {
		    const normalized = normalizeDocumentName(name);
		    if (!normalized) return null;
		    const database = await openDB();
		    const tx = database.transaction(DOCUMENT_STORE_NAME, 'readonly');
		    const request = tx.objectStore(DOCUMENT_STORE_NAME).get(normalized);
		    return new Promise((resolve, reject) => {
		        request.onsuccess = () => resolve(request.result || null);
		        request.onerror = () => reject(request.error);
		    });
		}

		async function saveDocumentRowsRecord(name, rows, options = {}) {
		    const normalized = normalizeDocumentName(name);
		    if (!normalized) return false;
		    const existing = await getDocumentRecord(normalized);
		    const database = await openDB();
		    const now = Date.now();
		    const tx = database.transaction(DOCUMENT_STORE_NAME, 'readwrite');
		    tx.objectStore(DOCUMENT_STORE_NAME).put({
		        ...(existing || {}),
		        name: normalized,
		        rows: cloneRowsForPersistence(rows),
		        folder: options.folder !== undefined ? String(options.folder || '') : String(existing?.folder || ''),
		        savedAt: Number(existing?.savedAt) || now,
		        updatedAt: now
		    });
		    await waitForTransaction(tx);
		    return true;
		}

		async function saveDocumentRecord(name, options = {}) {
		    const normalized = normalizeDocumentName(name);
		    if (!normalized) return false;
		    await saveDocumentRowsRecord(normalized, tableData, options);
		    currentDocumentName = normalized;
		    localStorage.setItem('rsdb_current_document_name', normalized);
		    return true;
		}

		async function assignDocumentFolder(name, folder) {
		    const record = await getDocumentRecord(name);
		    if (!record) return false;
		    await saveDocumentRowsRecord(record.name, record.rows || [], { folder: String(folder || '') });
		    return true;
		}

		async function loadDocument(name) {
		    const normalized = normalizeDocumentName(name);
		    if (!normalized) return false;
		    const database = await openDB();
		    const tx = database.transaction(DOCUMENT_STORE_NAME, 'readonly');
		    const request = tx.objectStore(DOCUMENT_STORE_NAME).get(normalized);
		    const record = await new Promise((resolve, reject) => {
		        request.onsuccess = () => resolve(request.result || null);
		        request.onerror = () => reject(request.error);
		    });
		    if (!record || !Array.isArray(record.rows)) return false;
		    tableData = cloneRowsForPersistence(record.rows);
		    currentDocumentName = normalized;
		    localStorage.setItem('rsdb_current_document_name', normalized);
		    operationHistory = [];
		    historyCursor = 0;
		    saveOperationHistory();
		    currentPage = 1;
		    updateTable();
		    updateSummary();
		    await saveDataToIndexedDB();
		    return true;
		}

		async function renameDocument(oldName, newName) {
		    const sourceName = normalizeDocumentName(oldName);
		    const targetName = normalizeDocumentName(newName);
		    if (!sourceName || !targetName) return false;
		    if (sourceName === targetName) return true;

		    const database = await openDB();
		    const readTx = database.transaction(DOCUMENT_STORE_NAME, 'readonly');
		    const store = readTx.objectStore(DOCUMENT_STORE_NAME);
		    const requestValue = request => new Promise((resolve, reject) => {
		        request.onsuccess = () => resolve(request.result || null);
		        request.onerror = () => reject(request.error);
		    });
		    const sourceRequest = store.get(sourceName);
		    const targetRequest = store.get(targetName);
		    const readComplete = waitForTransaction(readTx);
		    const [sourceRecord, targetRecord] = await Promise.all([
		        requestValue(sourceRequest),
		        requestValue(targetRequest),
		        readComplete
		    ]);

		    if (!sourceRecord) {
		        const error = new Error('Document not found');
		        error.code = 'DOCUMENT_NOT_FOUND';
		        throw error;
		    }
		    if (targetRecord) {
		        const error = new Error('Document name already exists');
		        error.code = 'DOCUMENT_NAME_EXISTS';
		        throw error;
		    }

		    const writeTx = database.transaction(DOCUMENT_STORE_NAME, 'readwrite');
		    const writeStore = writeTx.objectStore(DOCUMENT_STORE_NAME);
		    writeStore.put({
		        ...sourceRecord,
		        name: targetName,
		        updatedAt: Date.now()
		    });
		    writeStore.delete(sourceName);
		    await waitForTransaction(writeTx);

		    if (currentDocumentName === sourceName) {
		        currentDocumentName = targetName;
		        localStorage.setItem('rsdb_current_document_name', targetName);
		    }
		    return true;
		}

		async function deleteDocuments(names) {
		    const normalizedNames = [...new Set((names || []).map(normalizeDocumentName).filter(Boolean))];
		    if (!normalizedNames.length) return [];
		    const database = await openDB();
		    const tx = database.transaction(DOCUMENT_STORE_NAME, 'readwrite');
		    const store = tx.objectStore(DOCUMENT_STORE_NAME);
		    normalizedNames.forEach(name => store.delete(name));
		    await waitForTransaction(tx);
		    if (normalizedNames.includes(currentDocumentName)) {
		        currentDocumentName = '';
		        localStorage.removeItem('rsdb_current_document_name');
		    }
		    return normalizedNames;
		}

		async function deleteDocument(name) {
		    return deleteDocuments([name]);
		}

        async function saveImportedFont(name, data) {
            const database = await openDB();
            const tx = database.transaction(FONT_STORE_NAME, 'readwrite');
            tx.objectStore(FONT_STORE_NAME).put({ name, data });
            await waitForTransaction(tx);
        }

        async function clearImportedFonts(fontNames = []) {
            try {
                const database = await openDB();
                const tx = database.transaction(FONT_STORE_NAME, 'readwrite');
                tx.objectStore(FONT_STORE_NAME).clear();
                await waitForTransaction(tx);
                const names = new Set(Array.isArray(fontNames) ? fontNames : []);
                if (names.size && document.fonts?.forEach) {
                    document.fonts.forEach(face => {
                        if (names.has(face.family)) document.fonts.delete(face);
                    });
                }
                ensureImportedFontOptions();
                updateTable();
            } catch (error) {
                console.warn('清理导入字体失败', error);
            }
        }

        async function restoreImportedFonts() {
            try {
                const database = await openDB();
                const tx = database.transaction(FONT_STORE_NAME, 'readonly');
                const request = tx.objectStore(FONT_STORE_NAME).getAll();
                const records = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });
                for (const record of records) {
                    if (!record?.name || !record?.data) continue;
                    const face = new FontFace(record.name, record.data);
                    await face.load();
                    document.fonts.add(face);
                }
                ensureImportedFontOptions();
                updateTable();
            } catch (error) {
                console.warn('恢复导入字体失败', error);
            }
        }

		// === 加载所有数据（修复加载后表格不铺满问题）===
		async function loadDataFromIndexedDB() {
		    try {
		        const db = await openDB();
		        
		        // 加载表格数据
		        const tx = db.transaction(STORE_NAME, 'readonly');
		        const store = tx.objectStore(STORE_NAME);
		        const request = store.getAll();

		        const data = await new Promise((resolve, reject) => {
		            request.onsuccess = () => resolve(request.result);
		            request.onerror = () => reject(request.error);
		        });

		        if (data && data.length > 0) {
		            const snapshot = data.find(entry => entry?.__snapshot && Array.isArray(entry.rows));
		            tableData = snapshot ? snapshot.rows : data;
		            console.log('IndexedDB 加载成功，共', tableData.length, '条数据');
		        } else {
		            tableData = [];
		            console.log('IndexedDB 无数据，使用空数组');
		        }
		        
		        // 加载操作历史数据
		        try {
		            const historyTx = db.transaction(HISTORY_STORE_NAME, 'readonly');
		            const historyStore = historyTx.objectStore(HISTORY_STORE_NAME);
		            const historyRequest = historyStore.getAll();
		            
		            const historyData = await new Promise((resolve, reject) => {
		                historyRequest.onsuccess = () => resolve(historyRequest.result);
		                historyRequest.onerror = () => reject(historyRequest.error);
		            });
		            
		            if (historyData && historyData.length > 0) {
		                // 假设历史数据存储为单个对象，包含 operationHistory 和 historyCursor
		                const historyEntry = historyData[0]; // 取第一个（也是唯一的）历史记录
		                if (historyEntry && historyEntry.operationHistory) {
		                    operationHistory = historyEntry.operationHistory;
		                    historyCursor = historyEntry.historyCursor || 0;
		                    console.log('IndexedDB 加载操作历史成功，共', operationHistory.length, '条记录');
		                }
		            } else {
		                operationHistory = [];
		                historyCursor = 0;
		                console.log('IndexedDB 无操作历史数据，使用空数组');
		            }
		        } catch (historyErr) {
		            console.error('IndexedDB 加载操作历史失败:', historyErr);
		            operationHistory = [];
		            historyCursor = 0;
		        }
		        
		    } catch (err) {
		        console.error('IndexedDB 加载失败:', err);
		        showSnackbar('数据加载失败，使用空数据', 'warning');
		        tableData = [];
		        operationHistory = [];
		        historyCursor = 0;
		    }

		    // === 关键修复：重置分页 + 刷新布局，确保表格铺满全屏 ===
		    migrateLegacyCellStyles();
		    currentPage = 1; // 重置到第一页
		    updateTable();   // 刷新表格内容
		    //updatePagination(); // 如果您有分页控件，刷新页码显示（如果没有可忽略）

		    // 滚动到顶部（避免残留滚动位置导致空白）
		    const container = document.querySelector('.data-table-container-div') || window;
		    if (container) {
		        container.scrollTop = 0;
		    }

		    // 更新底部统计（如“共 X 条数据”）
		    if (dom.totalCountText) {
		        dom.totalCountText.textContent = `共 ${tableData.length} 条数据`;
		    }
		}

		function keepInputAboveVirtualKeyboard(input, vk = dom.virtualKeyboard) {
            if (!input?.isConnected || !vk) return;
            const height = Math.ceil(vk.getBoundingClientRect().height || vk.offsetHeight || 0);
            if (height <= 0) return;
            document.documentElement.style.setProperty('--rsdb-visible-vk-height', `${height}px`);
            const keyboardTop = Math.min(window.innerHeight, vk.getBoundingClientRect().top || window.innerHeight - height);
            const inputRect = input.getBoundingClientRect();
            const overlap = inputRect.bottom - keyboardTop + 16;
            const scrollHost = input.closest('#dataSheetContent, .modal-body-custom, .material-dialog-body, mdui-dialog');
            if (scrollHost && scrollHost !== input) {
                if (!scrollHost.dataset.rsdbVkOriginalPaddingBottom) {
                    scrollHost.dataset.rsdbVkOriginalPaddingBottom = scrollHost.style.paddingBottom || '__empty__';
                }
                scrollHost.style.scrollPaddingBottom = `${height + 24}px`;
                scrollHost.style.paddingBottom = `${height + 24}px`;
                if (overlap > 0 && typeof scrollHost.scrollBy === 'function') {
                    scrollHost.scrollBy({ top: overlap, behavior: appSettings.animationsEnabled === false ? 'auto' : 'smooth' });
                }
            } else if (overlap > 0) {
                window.scrollBy({ top: overlap, behavior: appSettings.animationsEnabled === false ? 'auto' : 'smooth' });
            }
            setTimeout(updateVirtualCursor, 0);
        }

		function showVirtualKeyboard(options = {}) {
		    const force = options === true || options?.force === true;
		    if (force) suppressVirtualKeyboard = false;
		    if (suppressVirtualKeyboard) {
		        return;
		    }
		    setVirtualKeyboardVisible(true);
		    const inputToScroll = currentInput;
		    if (inputToScroll) {
		        requestAnimationFrame(() => requestAnimationFrame(() => keepInputAboveVirtualKeyboard(inputToScroll)));
                setTimeout(() => keepInputAboveVirtualKeyboard(inputToScroll), 180);
		    }
		    setTimeout(updateVirtualCursor, 150);
		}

		function moveVirtualKeyboardToActiveDialog(vk) {
		    if (!vk) return;
		    if (!vk.dataset.rsdbDialogInputSync) {
		        vk.dataset.rsdbDialogInputSync = '1';
		        vk.addEventListener('pointerdown', () => {
		            const focusedInput = document.activeElement;
		            if (focusedInput?.matches?.('input, textarea') && focusedInput.closest('mdui-dialog')) {
		                currentInput = focusedInput;
		            }
		        }, { capture: true });
		        ['pointerdown', 'pointerup', 'pointercancel', 'click'].forEach(type => {
		            vk.addEventListener(type, event => event.stopPropagation());
		        });
		    }
		    if (!window.__rsdbVirtualKeyboardHomeParent) {
		        window.__rsdbVirtualKeyboardHomeParent = vk.parentNode;
		        window.__rsdbVirtualKeyboardHomeNextSibling = vk.nextSibling;
		    }
		    const inputDialog = currentInput?.closest?.('mdui-dialog');
		    const openDialogs = Array.from(document.querySelectorAll('mdui-dialog'))
		        .filter(dialog => dialog.open === true || dialog.hasAttribute('open'));
		    const host = imagePreviewEditState?.active
                ? document.body
                : (inputDialog || openDialogs[openDialogs.length - 1]
		        || window.__rsdbVirtualKeyboardHomeParent || document.body);
		    if (host && vk.parentNode !== host) host.appendChild(vk);
		}

		function restoreVirtualKeyboardHome(vk) {
		    const home = window.__rsdbVirtualKeyboardHomeParent;
		    if (!vk || !home || vk.parentNode === home) return;
		    const next = window.__rsdbVirtualKeyboardHomeNextSibling;
		    if (next?.parentNode === home) home.insertBefore(vk, next);
		    else home.appendChild(vk);
		}

		function setVirtualKeyboardVisible(visible) {
		    const vk = dom.virtualKeyboard;
		    if (!vk) return;
		    if (visible) {
                delete vk.dataset.closing;
		        desktopShortcutPanelActive = false;
		        vk.classList.remove('desktop-shortcuts-only');
		        moveVirtualKeyboardToActiveDialog(vk);
		        generateVirtualKeyboard();
		        vk.style.display = 'block';
		        requestAnimationFrame(() => {
		            if (vk.style.display !== 'none') moveVirtualKeyboardToActiveDialog(vk);
		        });
		        scheduleDesktopShortcutPanelSync();
		        if (keyboardState.isQuickEdit) {
		            const height = Math.ceil(vk.getBoundingClientRect().height || vk.offsetHeight || 0);
		            document.documentElement.style.setProperty('--rsdb-visible-vk-height', `${height}px`);
		            document.body.classList.add('quick-edit-vk-visible');
		        }
		        startVirtualCursorFollow();
		        if (appSettings.animationsEnabled === false) {
		            vk.classList.add('vk-visible');
		            syncShortcutToolbarVisibility();
		            setTimeout(updateVirtualCursor, 0);
		            return;
		        }
		        requestAnimationFrame(() => vk.classList.add('vk-visible'));
		        setTimeout(updateVirtualCursor, 0);
		        requestAnimationFrame(() => syncShortcutToolbarVisibility());
		        return;
		    }
		    hideKeyboardSwipeHint();
		    commitImeComposition();
            vk.dataset.closing = '1';
            if (vk.classList.contains('image-preview-floating-keyboard')) {
                vk.classList.remove('image-preview-floating-keyboard');
                vk.style.removeProperty('z-index');
            }
            const toolbar = document.getElementById('shortcutToolbar');
            const toolbarWrap = document.getElementById('shortcutToolbarWrap');
            if (toolbar) toolbar.style.display = 'none';
            if (toolbarWrap) toolbarWrap.style.display = 'none';
		    document.body.classList.remove('quick-edit-vk-visible');
            document.querySelectorAll('[data-rsdb-vk-original-padding-bottom]').forEach(host => {
                const original = host.dataset.rsdbVkOriginalPaddingBottom;
                host.style.paddingBottom = original === '__empty__' ? '' : original;
                host.style.scrollPaddingBottom = '';
                delete host.dataset.rsdbVkOriginalPaddingBottom;
            });
		    document.documentElement.style.removeProperty('--rsdb-visible-vk-height');
		    desktopShortcutPanelActive = false;
		    vk.classList.remove('desktop-shortcuts-only');
		    stopVirtualCursorFollow();
		    const virtualCursor = document.getElementById('virtualCursor');
		    if (virtualCursor) virtualCursor.style.display = 'none';
		    shortcutSuggestDismissedByField = {};
		    vk.classList.remove('vk-visible');
		    syncShortcutToolbarVisibility();
		    if (appSettings.animationsEnabled === false) {
		        vk.style.display = 'none';
		        restoreVirtualKeyboardHome(vk);
		        return;
		    }
		    setTimeout(() => {
		        if (!vk.classList.contains('vk-visible')) {
		            vk.style.display = 'none';
		            restoreVirtualKeyboardHome(vk);
		        }
		    }, 180);
		}

		function loadData() {
		    try {
		        if (saved) {
		            const parsed = JSON.parse(saved);
		            if (Array.isArray(parsed)) {
		                tableData = parsed;
		                console.log('数据加载成功，共', tableData.length, '条');
		            }
		        }
		    } catch (err) {
		        console.error('数据加载失败:', err);
		        showSnackbar('加载历史数据失败，已使用空数据', 'warning');
		        localStorage.removeItem('roundBarData'); // 清除损坏数据
		        tableData = [];
		    }

		    updateTable();
		}

		/**
 * 单条添加/编辑时，检测到产品号重复 → 显示简单 mdui-dialog 警告
 * @param {Object} duplicate - 第一条重复数据对象
 * @param {Object} newData - 当前要保存的新数据
 * @param {boolean} isEditMode - 是否编辑模式
 */
function showSingleDuplicateWarnDialog(duplicate, newData, isEditMode) {
    console.log('【单条重复警告】被调用 - 产品号：', newData.productId);

    const dialog = document.getElementById('singleDuplicateWarnDialog');
    if (!dialog) {
        console.error('【单条重复警告】找不到弹窗！请检查 HTML id="singleDuplicateWarnDialog"');
        showSnackbar('重复检测失败，无法显示警告弹窗', 'error');
        return;
    }

    // 设置提示消息
    const messageEl = dialog.querySelector('#singleDuplicateMessage');
    if (messageEl) {
        messageEl.innerHTML = `
            系统中已存在相同的产品号：<strong>${newData.productId || 'N/A'}</strong><br>
            发现 <strong>1</strong> 条重复数据。<br>
            您正在<strong>${isEditMode ? '修改为' : '添加'}</strong>该产品号。
        `;
    }

    // 绑定“取消添加”按钮
    const cancelBtn = dialog.querySelector('#singleDuplicateCancelBtn');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            const index = duplicate.index;
            closeCustomModal(dom.dataSheet);
            setVirtualKeyboardVisible(false);
            highlightAndScrollToRow(index);
            dialog.open = false;
            showSnackbar('操作已取消', 'info');
        };
    }

    // 绑定“覆盖保存”按钮
    const overrideBtn = dialog.querySelector('#singleDuplicateOverrideBtn');
    if (overrideBtn) {
        overrideBtn.onclick = async () => {
            if (overrideBtn.dataset.busy === '1') return;
            overrideBtn.dataset.busy = '1';
            overrideBtn.disabled = true;
            // 覆盖当前重复项
            try {
                tableData[duplicate.index] = { ...newData };
                await saveDataToIndexedDB();
                updateTable();
                dialog.open = false;
                closeCustomModal(dom.dataSheet);
                setVirtualKeyboardVisible(false);
                showSnackbar('已覆盖保存重复数据', 'success');
            } catch (error) {
                console.error('覆盖保存重复数据失败', error);
                showSnackbar('覆盖保存失败，请重试', 'error');
            } finally {
                overrideBtn.disabled = false;
                overrideBtn.dataset.busy = '0';
            }
        };
    }

    // “继续添加数据”保留当前内容，但按新增记录写入，不再次触发重复检测。
    const continueBtn = dialog.querySelector('#singleDuplicateContinueBtn');
    if (continueBtn) {
        continueBtn.onclick = () => {
            if (continueBtn.dataset.busy === '1') return;
            continueBtn.dataset.busy = '1';
            continueBtn.disabled = true;
            dialog.open = false;
            // 等待 dialog 状态和当前保存事件完成，避免快速点击造成重复检测竞态。
            setTimeout(() => {
                saveData({ skipDuplicateCheck: true, forceAdd: true })
                    .finally(() => {
                        continueBtn.disabled = false;
                        continueBtn.dataset.busy = '0';
                    });
            }, 180);
        };
    }

    // 打开弹窗
    dialog.open = true;
    console.log('【单条重复警告】弹窗已打开');
}
/**
 * 显示重复数据确认弹窗（批量导入专用，支持分页，每页50条）
 * - 无差异的重复项不显示在列表，只在顶部提示
 * @param {Array} duplicateEntries - 重复项数组
 * @param {Array} [newData=[]] - 新增的非重复数据
 * @param {number} [totalImported=1] - 总导入数量
 */
function showDuplicateConfirmationModal(duplicateEntries, newData = [], totalImported = 1) {
    console.log('【重复弹窗】被调用，重复项数量：', duplicateEntries.length);

    const modal = document.getElementById('duplicateConfirmationModalCustom');
    if (!modal) {
        console.error('【重复弹窗】找不到弹窗！请检查 HTML id="duplicateConfirmationModalCustom"');
        showSnackbar('系统错误：重复确认弹窗未找到', 'error');
        return;
    }

    console.log('【重复弹窗】弹窗已找到，开始处理...');

    // 填充统计信息
    const totalEl = modal.querySelector('#modal-total-count');
    const newEl = modal.querySelector('#modal-new-count');
    const dupEl = modal.querySelector('#modal-duplicate-count');

    if (totalEl) totalEl.textContent = totalImported;
    if (newEl) newEl.textContent = newData.length;
    if (dupEl) dupEl.textContent = duplicateEntries.length;

    // 分离有差异和无差异的重复项
    const withDiff = duplicateEntries.filter(entry => entry.differences && entry.differences.length > 0);
    const withoutDiff = duplicateEntries.filter(entry => !entry.differences || entry.differences.length === 0);

    console.log('【重复弹窗】有差异重复：', withDiff.length, '条');
    console.log('【重复弹窗】无差异重复：', withoutDiff.length, '条');

    // 顶部提示无差异项（如果有）
    const summaryP = modal.querySelector('.duplicate-summary') || document.createElement('p');
    summaryP.className = 'duplicate-summary';
    summaryP.style.marginBottom = '16px';
    summaryP.style.color = '#757575';

    if (withoutDiff.length > 0) {
        summaryP.innerHTML = `其中 <strong>${withoutDiff.length}</strong> 条重复项无任何字段差异（将自动跳过）`;
    } else {
        summaryP.innerHTML = '';
    }

    // 插入到弹窗内容顶部（如果已存在则替换）
    const body = modal.querySelector('.modal-body-custom');
    if (body) {
        const firstP = body.querySelector('p');
        if (firstP) {
            body.insertBefore(summaryP, firstP.nextSibling);
        } else {
            body.prepend(summaryP);
        }
    }

    // 只渲染有差异的项（分页基于有差异的项）
    const itemsToPaginate = withDiff; // 只分页有差异的
    const PAGE_SIZE = 50;
    let currentPage = 1;
    const totalPages = Math.max(1, Math.ceil(itemsToPaginate.length / PAGE_SIZE));

    const listContainer = modal.querySelector('#modal-duplicate-list');
    if (listContainer) {
        listContainer.innerHTML = '';

        if (itemsToPaginate.length === 0 && withoutDiff.length > 0) {
            listContainer.innerHTML = '<p style="color:#757575;text-align:center;padding:40px;">所有重复项均无差异，将自动跳过</p>';
        } else if (itemsToPaginate.length === 0) {
            listContainer.innerHTML = '<p style="color:#757575;text-align:center;padding:40px;">无需要处理的重复项</p>';
        } else {
            const template = document.getElementById('duplicate-item-template')?.innerHTML || '';
            if (!template) {
                listContainer.innerHTML = '<p style="color:red;text-align:center;padding:20px;">模板丢失，无法显示详情</p>';
            } else {
                // 渲染当前页
                function renderPage(page) {
                    listContainer.innerHTML = '';

                    const start = (page - 1) * PAGE_SIZE;
                    const end = Math.min(start + PAGE_SIZE, itemsToPaginate.length);
                    const pageItems = itemsToPaginate.slice(start, end);

                    pageItems.forEach((entry, pageIdx) => {
                        const globalIdx = start + pageIdx;
                        let html = template
                            .replace(/PRODUCT_ID/g, entry.productId || '未知')
                            .replace(/ITEM_INDEX/g, globalIdx);

                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;

                        // radio name 唯一
                        tempDiv.querySelectorAll('input[type="radio"]').forEach(radio => {
                            radio.name = `action-${globalIdx}`;
                            if (entry.action === 'override') {
                                if (radio.value === 'override') radio.checked = true;
                            } else {
                                if (radio.value === 'skip') radio.checked = true;
                            }
                        });

                        // 差异表格
                        const tbody = tempDiv.querySelector('tbody');
                        if (tbody && entry.differences?.length > 0) {
                            entry.differences.forEach(diff => {
                                tbody.innerHTML += `
                                    <tr>
                                        <th>${diff.field}</th>
                                        <td>${diff.existingItem[diff.key] || '-'}</td>
                                        <td style="color:#f44336;font-weight:bold;">${diff.newValue || '-'}</td>
                                    </tr>
                                `;
                            });
                        }

                        listContainer.appendChild(tempDiv.firstElementChild);
                    });

                    updatePageInfo();
                }

                // 页码信息
                function updatePageInfo() {
                    const pageInfo = modal.querySelector('#duplicatePageInfo');
                    if (pageInfo) {
                        pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页（共 ${itemsToPaginate.length} 条有差异重复）`;
                    }
                }

                // 翻页
                function changePage(newPage) {
                    if (newPage < 1 || newPage > totalPages) return;
                    currentPage = newPage;
                    renderPage(currentPage);
                }

                // 绑定翻页按钮（需在 HTML 中添加）
                const prevBtn = modal.querySelector('#duplicatePrevPage');
                if (prevBtn) prevBtn.onclick = () => changePage(currentPage - 1);

                const nextBtn = modal.querySelector('#duplicateNextPage');
                if (nextBtn) nextBtn.onclick = () => changePage(currentPage + 1);

                const pageInput = modal.querySelector('#duplicatePageJump');
                if (pageInput) {
                    pageInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const target = parseInt(pageInput.value);
                            if (!isNaN(target)) changePage(Math.max(1, Math.min(totalPages, target)));
                        }
                    });
                    pageInput.addEventListener('blur', () => {
                        const target = parseInt(pageInput.value);
                        if (!isNaN(target)) changePage(Math.max(1, Math.min(totalPages, target)));
                    });
                }

                // 初始化第一页
                renderPage(1);
            }
        }
    }

    // 绑定全部跳过/覆盖（只影响当前显示页，但确认时会收集所有）
    const skipAllBtn = modal.querySelector('#modal-btn-select-all-skip');
    if (skipAllBtn) {
        skipAllBtn.onclick = () => {
            modal.querySelectorAll('input[value="skip"]').forEach(r => r.checked = true);
        };
    }

    const overrideAllBtn = modal.querySelector('#modal-btn-select-all-override');
    if (overrideAllBtn) {
        overrideAllBtn.onclick = () => {
            modal.querySelectorAll('input[value="override"]').forEach(r => r.checked = true);
        };
    }

    // 确认处理（收集所有页的选择）
    const confirmBtn = modal.querySelector('#modal-btn-confirm');
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            // 收集所有重复项的选择（即使翻页了也能获取，因为 radio name 全局唯一）
            const actions = duplicateEntries.map((_, idx) => {
                const radio = modal.querySelector(`input[name="action-${idx}"]:checked`);
                return radio ? radio.value : 'skip';
            });

            const processedDuplicates = duplicateEntries.map((entry, idx) => ({
                ...entry,
                action: actions[idx]
            }));

            // 无差异的项强制跳过
            withoutDiff.forEach(entry => {
                processedDuplicates.push({ ...entry, action: 'skip' });
            });

            closeCustomModal(modal);
            finalizeImport(newData, processedDuplicates, totalImported);
        };
    }

    // 取消导入
    const cancelBtn = modal.querySelector('#modal-btn-cancel-import');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            closeCustomModal(modal);
            pendingImportContext = null;
            pendingImportMode = 'insert';
            if (dom.fileInput) dom.fileInput.value = '';
            showSnackbar('导入已取消', 'info');
        };
    }

    // 关闭按钮（右上角 ×）
    const closeBtn = modal.querySelector('#closeDuplicateModal');
    if (closeBtn) {
        closeBtn.onclick = () => closeCustomModal(modal);
    }

    // 打开弹窗
    openCustomModal(modal);
    console.log('【重复弹窗】弹窗已打开，渲染完成');
}

async function saveData(options = {}) {
    // 保护保存过程，避免触摸事件与 click 事件或快速连点重复提交。
    if (window.__rsdbSaveInProgress) return false;
    const duplicateDialog = document.getElementById('singleDuplicateWarnDialog');
    if (duplicateDialog?.open && !options.skipDuplicateCheck) return false;
    window.__rsdbSaveInProgress = true;
    const formData = {};

    // 1. 填充所有文本字段
    for (const key in formElements) {
        if (formElements.hasOwnProperty(key)) {
            formData[key] = formElements[key] ? formElements[key].value.trim() : '';
        }
    }

    // 2. 上传、替换和删除都只使用当前编辑草稿，点击保存后才写入表格。
    const imageDraft = window.__rsdbImageDraft;
    const finalImage = imageDraft
        ? String(imageDraft.value || '')
        : (currentEditIndex !== -1
            ? String(tableData[currentEditIndex]?.cardImage || '')
            : String(window.tempNewCardImage || ''));
    formData.cardImage = finalImage || '';

    const styleSource = dataEditStyleDraft?.styles
        || (currentEditIndex !== -1 ? tableData[currentEditIndex]?.__cellStyles : null)
        || {};
    const finalStyles = canonicalCellStyleMap(styleSource);
    if (Object.keys(finalStyles).length) formData.__cellStyles = cloneCellStyleMap(finalStyles);

    // 3. 重量四舍五入取整
    if (formData.weight) {
        const num = parseFloat(formData.weight);
        if (!isNaN(num)) {
            formData.weight = Math.round(num).toString();
        }
    }

    // 4. 重复产品号检测（允许所有字段为空；仅在填写产品号时检测）
    const isEditMode = currentEditIndex !== -1 && !options.forceAdd;
    const isProductIdChanged = isEditMode && tableData[currentEditIndex]?.productId !== formData.productId;

    const shouldCheckDuplicate = !isEditMode || isProductIdChanged;

    if (!options.skipDuplicateCheck && shouldCheckDuplicate && formData.productId?.trim()) {
        const duplicates = findDuplicates(formData);
        const realDuplicates = duplicates.filter(dup => dup.index !== currentEditIndex);

        if (realDuplicates.length > 0) {
            showSingleDuplicateWarnDialog(realDuplicates[0], formData, isEditMode);
            window.__rsdbSaveInProgress = false;
            return false;
        }
    }

    // 6. 执行保存（写入前记录操作）
    if (!isEditMode) {
        beginOperation('add_row', '添加数据', { mode: 'manual' });
        tableData.push(formData);
        recordInputStatsOnAdd(formData);
        console.log('[SAVE] 新增完成 - 新记录已推入 tableData，图片状态：' + (formData.cardImage ? '有图' : '无图'));
    } else {
        beginOperation('edit_row', '编辑数据', { index: currentEditIndex });
        tableData[currentEditIndex] = formData;
        console.log('[SAVE] 编辑完成 - 索引 ' + currentEditIndex + ' 已更新，图片状态：' + (formData.cardImage ? '有图' : '无图'));
    }

    discardImageDraft();
    discardDataEditStyleDraft();

    // 7. 持久化 & 刷新
    try {
        await saveDataToIndexedDB();
        commitOperation();
        currentPage = 1;
        updateTable();
        clearDataEditSessionDraft();
        closeCustomModal(dom.dataSheet);
        setVirtualKeyboardVisible(false);

        showSnackbar(isEditMode ? '数据修改成功' : '数据添加成功', 'success');
        return true;
    } catch (error) {
        console.error('保存数据失败', error);
        showSnackbar('数据保存失败，请重试', 'error');
        return false;
    } finally {
        window.__rsdbSaveInProgress = false;
    }
}

async function finalizeImport(newData, duplicateEntries, totalImported) {
    const importMode = pendingImportContext?.mode === 'replace' ? 'replace' : 'insert';
    let actuallyAdded = newData.length;
    let actuallyOverridden = 0;
    let actuallySkipped = 0;

    beginOperation('import', importMode === 'replace' ? '清空导入表格' : '插入导入表格', {
        mode: importMode,
        added: actuallyAdded,
        total: totalImported
    });

    if (importMode === 'replace') {
        tableData = [];
        selectedRows.clear();
        selectedCells.clear();
        currentDocumentName = '';
        localStorage.removeItem('rsdb_current_document_name');
    }

    const indexByProductId = new Map(
        tableData.map((item, index) => [item?.productId?.trim?.() || '', index]).filter(([key]) => key)
    );
    duplicateEntries.forEach(entry => {
        const action = entry.action;
        const index = entry.productId ? (indexByProductId.get(entry.productId.trim()) ?? -1) : -1;

        if (action === 'override' && index !== -1) {
            // 完整替换，包括 cardImage 图片
            tableData[index] = { ...entry.newItem };
            actuallyOverridden++;
            console.log('【导入覆盖】产品号：', entry.productId, '已替换，包括图片');
        } else if (action === 'skip') {
            actuallySkipped++;
        }
    });

    if (newData.length > 0) {
        tableData = [...tableData, ...newData];
        console.log('【导入新增】成功添加', newData.length, '条数据，包括图片');
    }

    if (actuallyAdded > 0 || actuallyOverridden > 0 || actuallySkipped > 0 || totalImported > 0) {
        console.log('【导入】开始持久化保存到 IndexedDB...');
        try {
            await saveDataToIndexedDB();
                console.log('【导入】数据保存成功，开始刷新表格');
                currentPage = 1;  // 重置到第一页
                updateTable();    // 强制刷新，确保图片显示
                updateSummary();
                commitOperation();
                console.log('【导入】表格已刷新，图片应正常显示');
        } catch (err) {
                console.error('【导入】保存到 IndexedDB 失败：', err);
                showSnackbar('导入数据保存失败，请重试', 'error');
                return;
        }
    } else {
        console.log('【导入】无任何变更，无需保存');
    }

    let resultMessage = `导入完成！共读取 ${totalImported} 条记录。`;
    if (actuallyAdded > 0) resultMessage += ` 成功添加 ${actuallyAdded} 条新数据。`;
    if (actuallyOverridden > 0) resultMessage += ` 覆盖 ${actuallyOverridden} 条重复数据。`;
    if (actuallySkipped > 0) resultMessage += ` 跳过 ${actuallySkipped} 条重复数据。`;
    if (totalImported === 0) resultMessage = `导入完成！文件未包含有效数据。`;
    showSnackbar(resultMessage, 'success');
    if (dom.fileInput) dom.fileInput.value = '';
    if (importMode === 'replace') {
        showClearImportNamingDialog();
    } else {
        pendingImportContext = null;
        pendingImportMode = 'insert';
    }
}

/**
 * 比较两个对象，返回不同的字段列表（用于重复数据确认弹窗显示差异）
 * @param {Object} oldObj - 已有数据对象
 * @param {Object} newObj - 新录入的数据对象
 * @returns {Array} 差异数组，每项格式：{field: '中文字段名', key: '字段键名', existingItem: oldObj, newValue: 新值}
 */
function getObjectDifferences(oldObj, newObj) {
    const differences = [];

    // 获取所有可能的字段（合并两个对象的键，去重）
    const allKeys = new Set([
        ...Object.keys(oldObj || {}),
        ...Object.keys(newObj || {})
    ]);

    allKeys.forEach(key => {
        // 跳过图片字段（base64 太长，不适合显示差异）
        if (key === 'cardImage' || key.startsWith('__')) return;

        // 获取旧值和新值，处理 undefined/null/空值
        const oldVal = oldObj[key] ?? '';
        const newVal = newObj[key] ?? '';

        // 字符串化比较（兼容数字、字符串等类型）
        if (String(oldVal) !== String(newVal)) {
            differences.push({
                field: fieldLabels[key] || key,  // 使用中文标签（如果有），否则用英文键名
                key: key,
                existingItem: oldObj,
                newValue: newVal
            });
        }
    });

    return differences;
}

		function renderDuplicatePage(listContainer) {
		    listContainer.innerHTML = '';

		    const entries = window.currentDuplicateEntries || [];
		    const startIndex = (duplicateCurrentPage - 1) * DUPLICATE_PAGE_SIZE;
		    const endIndex = Math.min(startIndex + DUPLICATE_PAGE_SIZE, entries.length);
		    const pageEntries = entries.slice(startIndex, endIndex);

		    const itemTemplateHtml = document.getElementById('duplicate-item-template').innerHTML;
		    const differenceTemplateHtml = document.getElementById('difference-row-template').innerHTML;

		    pageEntries.forEach((entry, pageIndex) => {
		        const globalIndex = startIndex + pageIndex;
		        let itemHtml = itemTemplateHtml
		            .replace(/PRODUCT_ID/g, entry.productId || 'N/A')
		            .replace(/ITEM_INDEX/g, globalIndex);

		        const tempDiv = document.createElement('div');
		        tempDiv.innerHTML = itemHtml;

		        const tbody = tempDiv.querySelector('.duplicate-differences tbody');
		        // 修复：新增tbody存在性判断（括号问题导致的核心报错——tbody为null时操作innerHTML）
		        if (tbody) {
		            if (entry.differences.length > 0) {
		                entry.differences.forEach(diff => {
		                    const rowHtml = differenceTemplateHtml
		                        .replace('FIELD_NAME', diff.field)
		                        .replace('OLD_VALUE', diff.existingItem[diff.key] || '-')
		                        .replace('NEW_VALUE', diff.newValue);
		                    tbody.innerHTML += rowHtml;
		                });
		            } else {
		                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#757575;font-style:italic;">无关键字段差异</td></tr>';
		            }
		        }

		        // 设置 radio name
		        tempDiv.querySelectorAll('input[type="radio"]').forEach(radio => {
		            radio.name = `action-${globalIndex}`;
		        });

		        listContainer.appendChild(tempDiv.firstElementChild);
		    });
		}

		function renderDuplicatePagination(listContainer) {
		    const old = listContainer.parentNode.querySelector('#duplicatePagination');
		    if (old) old.remove();

		    if (duplicateTotalPages <= 1) return;

		    const paginationDiv = document.createElement('div');
		    paginationDiv.id = 'duplicatePagination';
		    paginationDiv.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:16px;padding:20px 0;background:var(--surface-color);';

		    const prevBtn = document.createElement('mdui-button-icon');
		    prevBtn.icon = 'navigate_before';
		    prevBtn.disabled = duplicateCurrentPage === 1;

		    let prevLongTimer = null;
		    const LONG_PRESS = 500;

		    prevBtn.addEventListener('click', (e) => {
		        e.stopPropagation();
		        if (duplicateCurrentPage > 1) {
		            duplicateCurrentPage--;
		            renderDuplicatePage(listContainer);
		            renderDuplicatePagination(listContainer);
		        }
		    });

		    prevBtn.addEventListener('pointerdown', () => {
		        if (duplicateCurrentPage === 1) return;
		        prevLongTimer = setTimeout(() => {
		            duplicateCurrentPage = 1;
		            renderDuplicatePage(listContainer);
		            renderDuplicatePagination(listContainer);
		        }, LONG_PRESS);
		    });
		    prevBtn.addEventListener('pointerup', () => clearTimeout(prevLongTimer));
		    prevBtn.addEventListener('pointercancel', () => clearTimeout(prevLongTimer));
		    prevBtn.addEventListener('pointerleave', () => clearTimeout(prevLongTimer));

		    const pageInfo = document.createElement('span');
		    pageInfo.textContent = `第 ${duplicateCurrentPage} / ${duplicateTotalPages} 页（共 ${(window.currentDuplicateEntries || []).length} 条重复）`;
		    pageInfo.style.cssText = 'font-size:0.95rem;color:#757575;';

		    const nextBtn = document.createElement('mdui-button-icon');
		    nextBtn.icon = 'navigate_next';
		    nextBtn.disabled = duplicateCurrentPage === duplicateTotalPages;

		    let nextLongTimer = null;

		    nextBtn.addEventListener('click', (e) => {
		        e.stopPropagation();
		        if (duplicateCurrentPage < duplicateTotalPages) {
		            duplicateCurrentPage++;
		            renderDuplicatePage(listContainer);
		            renderDuplicatePagination(listContainer);
		        }
		    });

		    nextBtn.addEventListener('pointerdown', () => {
		        if (duplicateCurrentPage === duplicateTotalPages) return;
		        nextLongTimer = setTimeout(() => {
		            duplicateCurrentPage = duplicateTotalPages;
		            renderDuplicatePage(listContainer);
		            renderDuplicatePagination(listContainer);
		        }, LONG_PRESS);
		    });
		    nextBtn.addEventListener('pointerup', () => clearTimeout(nextLongTimer));
		    nextBtn.addEventListener('pointercancel', () => clearTimeout(nextLongTimer));
		    nextBtn.addEventListener('pointerleave', () => clearTimeout(nextLongTimer));

		    paginationDiv.appendChild(prevBtn);
		    paginationDiv.appendChild(pageInfo);
		    paginationDiv.appendChild(nextBtn);

		    listContainer.parentNode.appendChild(paginationDiv);
		}
function normalizeHexColor(color) {
    const rgb = color?.rgb || color?.argb;
    if (!rgb) return '';
    const hex = String(rgb).replace(/^#/, '').slice(-6);
    return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex}` : '';
}

function sheetCellToFormat(cell) {
    const style = cell?.s || {};
    const font = style.font || {};
    const fill = style.fill || {};
    const alignment = style.alignment || {};
    const format = {};
    if (font.name) format.fontName = font.name;
    if (font.sz || font.size) format.fontSize = Number(font.sz || font.size);
    const fontColor = normalizeHexColor(font.color);
    if (fontColor) format.color = fontColor;
    const fillColor = normalizeHexColor(fill.fgColor || fill.patternColor || fill.bgColor);
    if (fillColor) format.backgroundColor = fillColor;
    if (font.bold) format.bold = true;
    if (font.italic) format.italic = true;
    if (font.underline) format.underline = true;
    if (alignment.horizontal) format.horizontal = alignment.horizontal;
    if (alignment.wrapText) format.wrapText = true;
    if (cell?.z || style.numFmt) format.numFmt = cell.z || style.numFmt;
    return Object.keys(format).length ? format : null;
}

function applyExcelCellFormat(cell, format) {
    if (!cell || !format) return;
    const toArgb = (hex) => {
        const normalized = normalizeStyleColor(hex, '');
        return normalized ? `FF${normalized.slice(1)}` : '';
    };
    const fontSize = Number(format.fontSize);
    const textColor = toArgb(format.color);
    cell.font = {
        ...(cell.font || {}),
        ...(format.fontName ? { name: format.fontName } : {}),
        ...(Number.isFinite(fontSize) && fontSize > 0 ? { size: fontSize } : {}),
        ...(textColor ? { color: { argb: textColor } } : {}),
        bold: !!format.bold,
        italic: !!format.italic,
        underline: !!format.underline
    };
    const fillColor = toArgb(format.backgroundColor);
    if (fillColor) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    }
    cell.alignment = {
        ...(cell.alignment || {}),
        ...(format.horizontal && format.horizontal !== 'general' ? { horizontal: format.horizontal } : {}),
        wrapText: !!format.wrapText,
        vertical: 'middle'
    };
    if (format.numFmt) cell.numFmt = format.numFmt;
}

function toExcelNumericValue(value) {
    if (value === null || value === undefined || String(value).trim() === '') return '';
    const normalized = String(value).trim().replace(/,/g, '');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : String(value);
}
