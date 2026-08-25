function initEventListeners() {
    // Init Virtual Cursor Element
    if (!document.getElementById('virtualCursor')) {
        const vc = document.createElement('div');
        vc.id = 'virtualCursor';
        document.body.appendChild(vc);
    }

    const vcEl = document.getElementById('virtualCursor');
    if (vcEl && !vcEl.dataset.rsdbBound) {
        vcEl.dataset.rsdbBound = '1';
        vcEl.addEventListener('animationiteration', () => updateVirtualCursor(), { passive: true });
    }

    if (!document.getElementById('virtualCursorHandle')) {
        const vh = document.createElement('div');
        vh.id = 'virtualCursorHandle';
        document.body.appendChild(vh);
    }
    const vhEl = document.getElementById('virtualCursorHandle');
    if (vhEl && !vhEl.dataset.rsdbBound) {
        vhEl.dataset.rsdbBound = '1';
        let dragging = false;
        let dragPointerId = null;
        let dragCaretOffsetX = 0;
        let dragCaretOffsetY = 0;
        let dragInput = null;
        vhEl.addEventListener(
            'pointerdown',
            (e) => {
                if (!currentInput || !currentInput.classList?.contains('readonly-input')) return;
                if (dom?.virtualKeyboard?.style?.display === 'none') return;
                dragging = true;
                dragPointerId = e.pointerId;
                dragInput = currentInput;
                const cursorRect = vcEl?.getBoundingClientRect();
                if (cursorRect && cursorRect.width >= 0) {
                    dragCaretOffsetX = e.clientX - (cursorRect.left + cursorRect.width / 2);
                    dragCaretOffsetY = e.clientY - (cursorRect.top + cursorRect.height / 2);
                } else {
                    dragCaretOffsetX = 0;
                    dragCaretOffsetY = 0;
                }
                if (e.cancelable) e.preventDefault();
                e.stopPropagation();
                try {
                    vhEl.setPointerCapture(e.pointerId);
                } catch (e2) {}
                window.__rsdbKeyboardSwipeConsumedAt = Date.now();
                window.__rsdbLastCursorInteractAt = Date.now();
                showCursorHandleTemporarily();
                updateVirtualCursor();
            },
            { passive: false },
        );
        vhEl.addEventListener(
            'pointermove',
            (e) => {
                if (!dragging || dragPointerId !== e.pointerId) return;
                if (!dragInput?.isConnected) return;
                currentInput = dragInput;
                if (e.cancelable) e.preventDefault();
                e.stopPropagation();
                moveCursorToPoint(
                    dragInput,
                    e.clientX - dragCaretOffsetX,
                    e.clientY - dragCaretOffsetY
                );
                window.__rsdbKeyboardSwipeConsumedAt = Date.now();
                window.__rsdbLastCursorInteractAt = Date.now();
                showCursorHandleTemporarily();
                updateVirtualCursor();
            },
            { passive: false },
        );
        const endDrag = (e) => {
            if (!dragging || dragPointerId !== e.pointerId) return;
            dragging = false;
            dragPointerId = null;
            if (dragInput?.isConnected) currentInput = dragInput;
            dragInput = null;
            dragCaretOffsetX = 0;
            dragCaretOffsetY = 0;
            try {
                vhEl.releasePointerCapture(e.pointerId);
            } catch (e2) {}
            window.__rsdbKeyboardSwipeConsumedAt = Date.now();
            window.__rsdbLastCursorInteractAt = Date.now();
            updateVirtualCursor();
        };
        vhEl.addEventListener('pointerup', endDrag, { passive: true });
        vhEl.addEventListener('pointercancel', endDrag, { passive: true });
    }
    
    window.addEventListener('resize', updateVirtualCursor);
    window.addEventListener('scroll', updateVirtualCursor, true);
    setTimeout(updateVirtualCursor, 0);

    const vk = document.getElementById('virtualKeyboard');
    if (vk && !vk.dataset.rsdbSwipeBound) {
        vk.dataset.rsdbSwipeBound = '1';
        const state = {
            active: false,
            swipeMode: false,
            pointerId: null,
            startX: 0,
            startY: 0,
            lastStep: 0,
        };
        const STEP_PX = 18;
        const TRIGGER_PX = 14;

        vk.addEventListener(
            'pointerdown',
            (e) => {
                if (dom?.virtualKeyboard?.style?.display === 'none') return;
                if (!currentInput || !currentInput.classList?.contains('readonly-input')) return;
                state.active = true;
                state.swipeMode = false;
                state.pointerId = e.pointerId;
                state.startX = e.clientX;
                state.startY = e.clientY;
                state.lastStep = 0;
            },
            { passive: true },
        );

        window.addEventListener(
            'pointermove',
            (e) => {
                if (!state.active || state.pointerId !== e.pointerId) return;
                const dx = e.clientX - state.startX;
                const dy = e.clientY - state.startY;
                if (!state.swipeMode) {
                    if (Math.abs(dx) < TRIGGER_PX) return;
                    if (Math.abs(dx) <= Math.abs(dy)) return;
                    state.swipeMode = true;
                    window.__rsdbKeyboardSwipeConsumedAt = Date.now();
                }
                if (e.cancelable) e.preventDefault();
                const step = Math.trunc(dx / STEP_PX);
                const deltaStep = step - state.lastStep;
                if (deltaStep !== 0) {
                    moveCaretBy(deltaStep);
                    state.lastStep = step;
                    window.__rsdbKeyboardSwipeConsumedAt = Date.now();
                } else {
                    updateVirtualCursor();
                }
            },
            { passive: false, capture: true },
        );

        const endSwipe = (e) => {
            if (!state.active || state.pointerId !== e.pointerId) return;
            state.active = false;
            state.pointerId = null;
            if (state.swipeMode) {
                window.__rsdbKeyboardSwipeConsumedAt = Date.now();
                setTimeout(() => {
                    if (Date.now() - (window.__rsdbKeyboardSwipeConsumedAt || 0) > 220) {
                        window.__rsdbKeyboardSwipeConsumedAt = 0;
                    }
                }, 260);
            }
            state.swipeMode = false;
            state.lastStep = 0;
        };
        window.addEventListener('pointerup', endSwipe, { passive: true, capture: true });
        window.addEventListener('pointercancel', endSwipe, { passive: true, capture: true });
    }

    function updateEditInputModeUI(input) {
        if (!input?.id) return;
        const button = document.querySelector(`.edit-input-btn[data-target="${input.id}"]`);
        const tooltip = button?.closest('mdui-tooltip');
        const isVirtual = input.hasAttribute('readonly');
        if (button) {
            button.setAttribute('icon', isVirtual ? 'edit' : 'keyboard');
            button.setAttribute('aria-label', isVirtual ? '切换到系统键盘' : '切换到虚拟键盘');
        }
        if (tooltip) tooltip.setAttribute('content', isVirtual ? '切换到系统键盘' : '切换到虚拟键盘');
    }
    window.updateEditInputModeUI = updateEditInputModeUI;

    // Edit Buttons Logic
    document.querySelectorAll('.edit-input-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (targetInput) {
                const isReadonly = targetInput.hasAttribute('readonly');

                const modeMap = appSettings.keyboardModeByField && typeof appSettings.keyboardModeByField === 'object'
                    ? { ...appSettings.keyboardModeByField } : {};
                modeMap[targetId] = isReadonly ? 'system' : 'virtual';
                saveAppSettings({ keyboardModeByField: modeMap });
                if (isReadonly) {
                    targetInput.removeAttribute('readonly');
                    targetInput.classList.remove('readonly-input');
                    setVirtualKeyboardVisible(false);
                    const virtualCursor = document.getElementById('virtualCursor');
                    if (virtualCursor) virtualCursor.style.display = 'none';
                    currentInput = targetInput;
                    targetInput.focus();
                } else {
                    targetInput.setAttribute('readonly', 'true');
                    targetInput.classList.add('readonly-input');
                    currentInput = targetInput;
                    updateKeyboardForInput(targetInput);
                    showVirtualKeyboard({ force: true });
                    targetInput.focus();
                    resetCursorToEnd(targetInput);
                    setTimeout(updateVirtualCursor, 150); 
                }
                updateEditInputModeUI(targetInput);
            }
        });
        updateEditInputModeUI(document.getElementById(btn.getAttribute('data-target')));
    });

    document.querySelectorAll('.edit-style-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openDataCellStyleDialog(btn.getAttribute('data-target'));
        });
    });

    // FAB Draggable Logic & Reset（长按进入拖动模式，再次长按保存位置）
    const mainFab = document.getElementById('mainFab');
    if (mainFab) {
        const DEFAULT_RIGHT = '24px';
        const DEFAULT_BOTTOM = '24px';
        const savedPos = localStorage.getItem('fabPosition');
        if (savedPos) {
            try {
                const { right, bottom } = JSON.parse(savedPos);
                mainFab.style.right = right;
                mainFab.style.bottom = bottom;
            } catch(e) {
                mainFab.style.right = DEFAULT_RIGHT;
                mainFab.style.bottom = DEFAULT_BOTTOM;
            }
        } else {
            mainFab.style.right = DEFAULT_RIGHT;
            mainFab.style.bottom = DEFAULT_BOTTOM;
        }

        let pointerId = null;
        let dragging = false;
        let sx = 0, sy = 0;
        let baseRight = 0, baseBottom = 0;
        let pressTimer = null;
        const LONG_PRESS_MS = 420;
        let scrollGuardUntil = 0;
        window.addEventListener('scroll', () => { scrollGuardUntil = Date.now() + 180; }, { passive: true });

        const clearPress = () => {
            if (pressTimer) clearTimeout(pressTimer);
            pressTimer = null;
        };
        const saveFabPosition = () => {
            localStorage.setItem('fabPosition', JSON.stringify({
                right: mainFab.style.right || DEFAULT_RIGHT,
                bottom: mainFab.style.bottom || DEFAULT_BOTTOM
            }));
            showSnackbar('已保存FAB位置', 'success');
        };

        const finishDrag = (e) => {
            if (pointerId !== e.pointerId) return;
            clearPress();
            if (dragging) {
                saveFabPosition();
                suppressFabTap(420);
            }
            dragging = false;
            mainFab.classList.remove('dragging');
            pointerId = null;
        };

        mainFab.addEventListener('pointerdown', (e) => {
            if (pointerId !== null) return;
            if (Date.now() < scrollGuardUntil) return;
            pointerId = e.pointerId;
            sx = e.clientX;
            sy = e.clientY;
            const style = window.getComputedStyle(mainFab);
            baseRight = parseFloat(style.right) || parseFloat(DEFAULT_RIGHT);
            baseBottom = parseFloat(style.bottom) || parseFloat(DEFAULT_BOTTOM);
            dragging = false;
            clearPress();
            pressTimer = setTimeout(() => {
                dragging = true;
                mainFab.classList.add('dragging');
                mainFab.setPointerCapture?.(pointerId);
                if (navigator.vibrate) navigator.vibrate(12);
            }, LONG_PRESS_MS);
        }, { passive: false });
        const moveFab = (e) => {
            if (pointerId !== e.pointerId) return;
            if (!dragging) {
                const dx = Math.abs(e.clientX - sx);
                const dy = Math.abs(e.clientY - sy);
                if (dx > 12 || dy > 12) clearPress();
                return;
            }
            if (e.cancelable) e.preventDefault();
            const deltaX = sx - e.clientX;
            const deltaY = sy - e.clientY;
            const newRight = Math.max(10, Math.min(baseRight + deltaX, window.innerWidth - 48));
            const newBottom = Math.max(10, Math.min(baseBottom + deltaY, window.innerHeight - 48));
            mainFab.style.right = `${Math.round(newRight)}px`;
            mainFab.style.bottom = `${Math.round(newBottom)}px`;
        };
        document.addEventListener('pointermove', moveFab, { passive: false });
        document.addEventListener('pointerup', finishDrag);
        document.addEventListener('pointercancel', finishDrag);
    }

    // Delete All Data Menu Item
    const deleteAllDataBtn = document.getElementById('deleteAllDataMenuItem');
    const deleteAllDataDialog = document.getElementById('deleteAllDataConfirmDialog');
    const confirmDeleteAllDataBtn = document.getElementById('confirmDeleteAllDataBtn');
    const cancelDeleteAllDataBtn = document.getElementById('cancelDeleteAllDataBtn');
    let deleteAllTimer = null;

    if (deleteAllDataBtn) {
        deleteAllDataBtn.addEventListener('click', () => {
            if (deleteAllDataDialog) {
                deleteAllDataDialog.open = true;
                // 倒计时逻辑
                let timeLeft = 1;
                confirmDeleteAllDataBtn.disabled = true;
                confirmDeleteAllDataBtn.textContent = `确认删除 (${timeLeft})`;
                
                if (deleteAllTimer) clearInterval(deleteAllTimer);
                deleteAllTimer = setInterval(() => {
                    timeLeft--;
                    if (timeLeft <= 0) {
                        clearInterval(deleteAllTimer);
                        confirmDeleteAllDataBtn.disabled = false;
                        confirmDeleteAllDataBtn.textContent = '确认删除';
                    } else {
                        confirmDeleteAllDataBtn.textContent = `确认删除 (${timeLeft})`;
                    }
                }, 1000);
            }
        });
    }

    if (cancelDeleteAllDataBtn) {
        cancelDeleteAllDataBtn.addEventListener('click', () => {
            if (deleteAllDataDialog) deleteAllDataDialog.open = false;
            if (deleteAllTimer) clearInterval(deleteAllTimer);
        });
    }

    if (confirmDeleteAllDataBtn) {
        confirmDeleteAllDataBtn.addEventListener('click', () => {
            if (deleteAllDataDialog) deleteAllDataDialog.open = false;

            if (!tableData.length) {
                showSnackbar('当前没有可删除的数据', 'info');
                return;
            }

            // 执行删除所有数据，并保留完整撤销快照
            beginOperation('delete_all', '删除所有表格数据');
            tableData = [];
            window.rsdbAllData = []; // 兼容性保留
            saveDataToIndexedDB();
            updateTable();
            updateSummary();
            commitOperation();
            showUndoSnackbar('已删除所有数据', 'delete_all');
        });
    }

    dom.closeDeleteRowDialogBtn?.addEventListener('click', closeDeleteRowConfirmDialog);
    dom.cancelDeleteRowDialogBtn?.addEventListener('click', closeDeleteRowConfirmDialog);
    dom.confirmDeleteRowDialogBtn?.addEventListener('click', deletePendingRow);
    dom.deleteRowConfirmDialog?.addEventListener('close', () => {
        pendingDeleteRowState = null;
    });

    const undoItem = document.getElementById('undoMenuItem');
    const redoItem = document.getElementById('redoMenuItem');
    const opHistoryItem = document.getElementById('operationHistoryMenuItem');
    undoItem?.addEventListener('click', () => {
        if (appSettings.undoRedoEnabled === false) {
            showSnackbar('撤销/重做记录已关闭', 'info');
            return;
        }
        const ok = undoOperation();
        if (!ok) showSnackbar('没有可撤销的操作', 'info');
    });
    redoItem?.addEventListener('click', () => {
        if (appSettings.undoRedoEnabled === false) {
            showSnackbar('撤销/重做记录已关闭', 'info');
            return;
        }
        const ok = redoOperation();
        if (!ok) showSnackbar('没有可重做的操作', 'info');
    });
    opHistoryItem?.addEventListener('click', () => {
        if (appSettings.historyStorageEnabled === false) {
            showSnackbar('历史记录存储已关闭', 'info');
            return;
        }
        renderOperationHistoryList('');
        const dlg = document.getElementById('operationHistoryDialog');
        if (dlg) dlg.open = true;
    });
    document.getElementById('closeOperationHistoryBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('operationHistoryDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('operationSearchInput')?.addEventListener('input', (e) => {
        const q = (e.target.value || '').trim().toLowerCase();
        renderOperationHistoryList(q);
    });
    document.getElementById('closeOperationPreviewBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('operationPreviewDialog');
        if (dlg) dlg.open = false;
    });

    // Add click listeners to all form inputs to trigger virtual keyboard
    if (typeof inputFields !== 'undefined') {
        inputFields.forEach(input => {
			input.addEventListener('input', () => recordDataEditState());
			input.addEventListener('change', () => recordDataEditState());
            input.addEventListener('click', (e) => {
                if (input.hasAttribute('readonly')) {
                    e.stopPropagation();
                    const modeMap = appSettings.keyboardModeByField && typeof appSettings.keyboardModeByField === 'object'
                        ? { ...appSettings.keyboardModeByField } : {};
                    if (modeMap[input.id] !== 'virtual') {
                        modeMap[input.id] = 'virtual';
                        saveAppSettings({ keyboardModeByField: modeMap });
                    }
                    currentInput = input;
                    input.focus({ preventScroll: true });
                    moveCursorToClick(input, e);
                    showCursorHandleTemporarily();
                    updateKeyboardForInput(input);
                    showVirtualKeyboard({ force: true });
                } else {
                    setVirtualKeyboardVisible(false);
                    currentInput = input;
                    updateKeyboardForInput(input);
                    if (appSettings.desktopModeEnabled === true) showDesktopShortcutPanel(input);
                    const virtualCursor = document.getElementById('virtualCursor');
                    if (virtualCursor) virtualCursor.style.display = 'none';
                }
            });
        });
    }

    const selectGalleryBtn = document.getElementById('selectFromGalleryBtn');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const dragDropArea = document.getElementById('dragDropArea');
    const fileInput = document.getElementById('cardImageInput');

    if (selectGalleryBtn) {
        selectGalleryBtn.addEventListener('click', () => {
            chooseCardImage({ capture: false, targetIndex: currentEditIndex });
        });
    }

    if (takePhotoBtn) {
        takePhotoBtn.addEventListener('click', () => {
            chooseCardImage({ capture: true, targetIndex: currentEditIndex });
        });
    }

    if (dragDropArea) {
        dragDropArea.addEventListener('click', () => {
            fileInput.removeAttribute('capture');
            fileInput.click();
        });

        dragDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const draftId = getMatchingImageDraft(currentEditIndex)?.id || '';
                handleImageSelect({ target: { files: [file] } }).then(base64 => {
                    if (base64) commitSelectedImage(base64, currentEditIndex, 'drop', draftId);
                });
            } else {
                showSnackbar('请拖入图片文件', 'warning');
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dragDropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropArea.style.background = 'rgba(var(--primary-color-rgb), 0.1)';
                dragDropArea.style.borderColor = 'var(--primary-color)';
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dragDropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropArea.style.background = '';
                dragDropArea.style.borderColor = 'var(--border-color)';
            });
        });
    }

    fileInput.addEventListener('change', async (event) => {
        const context = window.__rsdbPendingImageSelection || {
            targetIndex: currentEditIndex,
            mode: 'select',
            draftId: getMatchingImageDraft(currentEditIndex)?.id || ''
        };
        window.__rsdbPendingImageSelection = null;
        try {
            const base64 = await handleImageSelect(event);
            if (!base64) return;
            if (typeof context.onSelected === 'function') await context.onSelected(base64);
            else await commitSelectedImage(base64, context.targetIndex, context.mode, context.draftId || '');
        } finally {
            fileInput.removeAttribute('capture');
            fileInput.value = '';
        }
    });

    document.getElementById('takePhotoInEditBtn')?.addEventListener('click', (event) => {
        event.preventDefault();
        chooseCardImage({ capture: true, targetIndex: currentEditIndex, mode: 'edit_take' });
    });
    document.getElementById('selectFromGalleryInEditBtn')?.addEventListener('click', (event) => {
        event.preventDefault();
        chooseCardImage({ capture: false, targetIndex: currentEditIndex, mode: 'edit_gallery' });
    });
    document.getElementById('deleteImageInEditBtn')?.addEventListener('click', (event) => {
        event.preventDefault();
        openImageDeleteConfirmation(currentEditIndex);
    });

    const cancelDeleteBtn = document.getElementById('cancelDeleteImageBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            const dialog = document.getElementById('deleteImageConfirmDialog');
            if (dialog) dialog.open = false;
            delete window.tempDeleteImageIndex;
            delete window.__rsdbPendingImageDeleteDraftId;
        });
    }

    const confirmDeleteImageBtn = document.getElementById('confirmDeleteImageBtn');
    if (confirmDeleteImageBtn) {
        confirmDeleteImageBtn.onclick = () => {
            const index = window.tempDeleteImageIndex;
            const draft = window.__rsdbImageDraft;
            const pendingDraftId = window.__rsdbPendingImageDeleteDraftId || '';
            const matchesDraft = !!draft
                && Number(draft.targetIndex) === Number(index)
                && (!pendingDraftId || draft.id === pendingDraftId);
            if (matchesDraft) {
                setImageDraftValue('');
                showSnackbar('已标记删除，保存后生效', 'info');
            } else if (pendingDraftId) {
                showSnackbar('编辑已关闭，未删除图片', 'info');
            } else if (index === -1) {
                delete window.tempNewCardImage;
                const previewImg = document.getElementById('previewImg');
                if (previewImg) previewImg.removeAttribute('src');
                const previewContainer = document.getElementById('cardImagePreview');
                const noImageArea = document.getElementById('noImageUploadArea');
                if (previewContainer) previewContainer.style.display = 'none';
                if (noImageArea) noImageArea.style.display = 'block';
                showSnackbar('图片已删除', 'success');
            } else if (index !== undefined && tableData[index]) {
                beginOperation('delete_image', '删除图片', { index });
                tableData[index].cardImage = '';
                saveDataToIndexedDB();
                updateTable();
                commitOperation();

                const previewContainer = document.getElementById('cardImagePreview');
                const noImageArea = document.getElementById('noImageUploadArea');
                if (previewContainer && noImageArea) {
                    previewContainer.style.display = 'none';
                    noImageArea.style.display = 'block';
                }

                showSnackbar('图片已删除', 'success');
            }
            const dialog = document.getElementById('deleteImageConfirmDialog');
            if (dialog) dialog.open = false;
            delete window.tempDeleteImageIndex;
            delete window.__rsdbPendingImageDeleteDraftId;
        };
    }

    dom.openDrawerBtn.addEventListener('click', () => { dom.drawer.open = true; });

    dom.themeCollapseContent.querySelectorAll('.theme-option').forEach(item => {
        item.addEventListener('click', (e) => {
            const theme = e.currentTarget.getAttribute('data-theme');
            changeTheme(theme);
        });
    });

    dom.closeDataModal.addEventListener('click', () => {
        if (!hasDataChanged()) {
            closeCustomModal(dom.dataSheet);
            if (currentInput?.closest('#dataSheetCustom')) currentInput = null;
            discardImageDraft();
            discardDataEditStyleDraft();
            setVirtualKeyboardVisible(false);
            const virtualCursor = document.getElementById('virtualCursor');
            if (virtualCursor) virtualCursor.style.display = 'none';
        } else {
            const dialog = document.getElementById('cancelEditConfirmDialog');
            if (dialog) {
                document.body.appendChild(dialog);
                dialog.style.zIndex = '22000';
                dialog.open = true;
            }
        }
    });

    // Helper: Check if data has changed
    const hasDataChanged = () => {
        if (window.__rsdbImageDraft?.dirty) return true;
        if (dataEditStyleDraft?.dirty) return true;
        for (const key in formElements) {
            if (formElements.hasOwnProperty(key)) {
                const input = formElements[key];
                const currentVal = input.value.trim();
                
                if (currentEditIndex === -1) {
                    // New Mode: Check if any field is non-empty
                    if (currentVal !== '') return true;
                } else {
                    // Edit Mode: Check against original data
                    const originalVal = (tableData[currentEditIndex][key] || '').toString().trim();
                    if (currentVal !== originalVal) return true;
                }
            }
        }
        return false;
    };

    dom.cancelBtn.addEventListener('click', () => {
        if (!hasDataChanged()) {
            // No changes, close directly
            closeCustomModal(dom.dataSheet);
            if (currentInput?.closest('#dataSheetCustom')) currentInput = null;
            discardImageDraft();
            discardDataEditStyleDraft();
            setVirtualKeyboardVisible(false);
            const virtualCursor = document.getElementById('virtualCursor');
            if (virtualCursor) virtualCursor.style.display = 'none';
        } else {
            // Show confirmation
            const dialog = document.getElementById('cancelEditConfirmDialog');
            if (dialog) dialog.open = true;
        }
    });

    document.getElementById('confirmCancelBtn')?.addEventListener('click', () => {
        closeCustomModal(dom.dataSheet);
        if (currentInput?.closest('#dataSheetCustom')) currentInput = null;
        discardImageDraft();
        discardDataEditStyleDraft();
        setVirtualKeyboardVisible(false);
        const virtualCursor = document.getElementById('virtualCursor');
        if (virtualCursor) virtualCursor.style.display = 'none';
        const dialog = document.getElementById('cancelEditConfirmDialog');
        if (dialog) dialog.open = false;
    });

    document.getElementById('cancelCancelBtn')?.addEventListener('click', () => {
        const dialog = document.getElementById('cancelEditConfirmDialog');
        if (dialog) dialog.open = false;
    });

    dom.closeQuickEdit.addEventListener('click', () => { 
        closeCustomModal(dom.quickEditDialog); 
        if (currentInput?.closest('#quickEditDialog')) currentInput = null;
        setVirtualKeyboardVisible(false); 
        const virtualCursor = document.getElementById('virtualCursor');
        if (virtualCursor) virtualCursor.style.display = 'none';
        keyboardState.isQuickEdit = false;
        saveKeyboardState();
        window.__rsdbEditingCell = null;
        window.__rsdbOriginalCellEdit = null;
    });

    bindImmediateActionButton(dom.saveQuickEditBtn, saveQuickEdit);

    window.updateQuickEditKeyboardToggleUI = function updateQuickEditKeyboardToggleUI() {
        const isVirtual = !!dom.quickEditInput?.hasAttribute('readonly');
        if (dom.quickEditKeyboardToggleBtn) {
            dom.quickEditKeyboardToggleBtn.setAttribute('icon', isVirtual ? 'edit' : 'keyboard');
            dom.quickEditKeyboardToggleBtn.setAttribute('aria-label', isVirtual ? '切换到系统键盘' : '切换到虚拟键盘');
        }
        if (dom.quickEditKeyboardToggleTooltip) {
            dom.quickEditKeyboardToggleTooltip.setAttribute('content', isVirtual ? '切换到系统键盘' : '切换到虚拟键盘');
        }
    }

    window.setQuickEditKeyboardMode = function setQuickEditKeyboardMode(useVirtual) {
        const input = dom.quickEditInput;
        if (!input) return;
        currentInput = input;
        if (useVirtual) {
            input.setAttribute('readonly', 'true');
            input.classList.add('readonly-input');
            updateKeyboardForInput(input, dom.quickEditField?.value || null);
            showVirtualKeyboard({ force: true });
            input.focus({ preventScroll: true });
            resetCursorToEnd(input);
        } else {
            input.removeAttribute('readonly');
            input.classList.remove('readonly-input');
            setVirtualKeyboardVisible(false);
            if (appSettings.desktopModeEnabled === true) showDesktopShortcutPanel(input);
            const virtualCursor = document.getElementById('virtualCursor');
            if (virtualCursor) virtualCursor.style.display = 'none';
            input.focus({ preventScroll: true });
        }
        updateQuickEditKeyboardToggleUI();
    };

    dom.quickEditKeyboardToggleBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        setQuickEditKeyboardMode(!dom.quickEditInput?.hasAttribute('readonly'));
    });

    let pendingQuickEditFullEdit = null;
    const closeQuickEditForFullEdit = () => {
        closeCustomModal(dom.quickEditDialog);
        setVirtualKeyboardVisible(false);
        keyboardState.isQuickEdit = false;
        saveKeyboardState();
        window.__rsdbEditingCell = null;
        window.__rsdbOriginalCellEdit = null;
    };
    const continueToFullEdit = (saveChanges) => {
        const pending = pendingQuickEditFullEdit;
        if (!pending) return;
        if (saveChanges && !saveQuickEdit()) return;
        pendingQuickEditFullEdit = null;
        if (!saveChanges) closeQuickEditForFullEdit();
        if (dom.quickEditFullEditConfirmDialog) dom.quickEditFullEditConfirmDialog.open = false;
        setTimeout(() => openEditModal(pending.index, pending.targetFieldId), 150);
    };

    dom.openFullEditBtn.addEventListener('click', () => {
        pendingQuickEditFullEdit = {
            index: parseInt(dom.quickEditIndex.value),
            targetFieldId: dom.quickEditField.value
        };
        const dialog = dom.quickEditFullEditConfirmDialog;
        if (!dialog) return continueToFullEdit(false);
        document.body.appendChild(dialog);
        dialog.style.zIndex = '22000';
        dialog.open = true;
    });
    dom.quickEditFullEditSaveBtn?.addEventListener('click', () => continueToFullEdit(true));
    dom.quickEditFullEditDiscardBtn?.addEventListener('click', () => continueToFullEdit(false));
    dom.quickEditFullEditCancelBtn?.addEventListener('click', () => {
        pendingQuickEditFullEdit = null;
        if (dom.quickEditFullEditConfirmDialog) dom.quickEditFullEditConfirmDialog.open = false;
    });

dom.filterMatchRowsCheckbox?.addEventListener('change', (e) => {
    isFilterMatchRows = !!e.target.checked;

    localStorage.setItem('filterMatchRows', isFilterMatchRows);

    currentPage = 1;            
    updateTable();              
    console.log('过滤开关状态：', isFilterMatchRows ? '开启（只显示匹配行）' : '关闭（显示全部）');
});

    dom.quickEditInput.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (!e.target.hasAttribute('readonly')) {
             setVirtualKeyboardVisible(false);
             const virtualCursor = document.getElementById('virtualCursor');
             if (virtualCursor) virtualCursor.style.display = 'none';
             return;
        }

        currentInput = e.target;
        const realFieldId = dom.quickEditField.value;
        moveCursorToClick(currentInput, e);
        showCursorHandleTemporarily();
        updateKeyboardForInput(currentInput, realFieldId);
        showVirtualKeyboard();
    });

    dom.closeConfirmModal.addEventListener('click', () => {
        closeCustomModal(dom.confirmModal);
        setVirtualKeyboardVisible(false);
    });
    dom.cancelConfirmBtn.addEventListener('click', () => {
        closeCustomModal(dom.confirmModal);
        setVirtualKeyboardVisible(false);
    });

    dom.closeCalculatorModal.addEventListener('click', () => { 
        closeCustomModal(dom.calculatorModal); 
        if (currentInput?.closest('#calculatorModalCustom')) currentInput = null;
        setVirtualKeyboardVisible(false); 
    });

    dom.cancelCalcBtn.addEventListener('click', () => { 
        closeCustomModal(dom.calculatorModal); 
        if (currentInput?.closest('#calculatorModalCustom')) currentInput = null;
        setVirtualKeyboardVisible(false); 
    });

    // 对话框通过右上角、遮罩或 ESC 关闭时，也必须同步关闭虚拟键盘。
    const bindEditorDialogCloseCleanup = (dialog, mode = '') => {
        if (!dialog || dialog.dataset.rsdbKeyboardCloseBound) return;
        dialog.dataset.rsdbKeyboardCloseBound = '1';
		dialog.addEventListener('close', (event) => {
		    if (event.target !== dialog) return;
		    if (mode === 'data-edit' && imagePreviewEditState?.active) {
                const previewOverlay = imagePreviewEditState.overlay;
                closeImagePreviewEdit({ restoreKeyboard: false });
                previewOverlay?.remove();
            }
            const ownsInput = !!currentInput && dialog.contains(currentInput);
            if (ownsInput || mode === 'quick-edit' || mode === 'calculator') currentInput = null;
            setVirtualKeyboardVisible(false);
            const virtualCursor = document.getElementById('virtualCursor');
            const virtualCursorHandle = document.getElementById('virtualCursorHandle');
            if (virtualCursor) virtualCursor.style.display = 'none';
            if (virtualCursorHandle) virtualCursorHandle.style.display = 'none';
            if (mode === 'quick-edit') {
                keyboardState.isQuickEdit = false;
                saveKeyboardState();
                window.__rsdbEditingCell = null;
                window.__rsdbOriginalCellEdit = null;
            }
        });
    };
    bindEditorDialogCloseCleanup(dom.quickEditDialog, 'quick-edit');
    bindEditorDialogCloseCleanup(dom.dataSheet, 'data-edit');
    bindEditorDialogCloseCleanup(dom.calculatorModal, 'calculator');

    dom.clearCalcBtn.addEventListener('click', clearCalculatorInputs);

    dom.closeDuplicateModal.addEventListener('click', () => {
        closeCustomModal(dom.duplicateConfirmationModal);
        setVirtualKeyboardVisible(false);
    });

    document.getElementById('modal-btn-cancel-import')?.addEventListener('click', () => {
        closeCustomModal(dom.duplicateConfirmationModal);
        setVirtualKeyboardVisible(false);
        showSnackbar('导入操作已取消', 'warning');
    });

    dom.sortItem.addEventListener('click', openSortModal);
    dom.closeSortModal.addEventListener('click', () => {
        closeCustomModal(dom.sortModal);
        setVirtualKeyboardVisible(false);
    });
    dom.cancelSortBtn.addEventListener('click', () => {
        closeCustomModal(dom.sortModal);
        setVirtualKeyboardVisible(false);
    });
    dom.applySortBtn.addEventListener('click', applySort);
    dom.addSortRuleBtn.addEventListener('click', () => addSortRule());
    dom.resetSortRulesBtn?.addEventListener('click', () => {
        dom.sortRulesContainer.innerHTML = '';
        addSortRule('cardId', 'asc');
        showSnackbar('已恢复默认排序规则', 'info');
    });

    dom.searchMenuItem?.addEventListener('click', () => {
        toggleSearchReplaceVisibility(true);
    });
    dom.topSearchBtn?.addEventListener('click', () => {
        toggleSearchReplaceVisibility();
    });
    dom.closeSearchPanelBtn?.addEventListener('click', () => {
        toggleSearchReplaceVisibility(false);
    });
    dom.topUndoBtn?.addEventListener('click', () => {
        if (appSettings.undoRedoEnabled === false) return showSnackbar('撤销/重做记录已关闭', 'info');
        if (!undoOperation()) showSnackbar('没有可撤销的操作', 'info');
    });
    dom.topRedoBtn?.addEventListener('click', () => {
        if (appSettings.undoRedoEnabled === false) return showSnackbar('撤销/重做记录已关闭', 'info');
        if (!redoOperation()) showSnackbar('没有可重做的操作', 'info');
    });
    dom.topSaveBtn?.addEventListener('click', performManualSave);
    dom.topTableZoomOutBtn?.addEventListener('click', () => ZoomManager.zoomBy(-0.1));
    dom.topTableZoomInBtn?.addEventListener('click', () => ZoomManager.zoomBy(0.1));
    dom.topTableZoomResetBtn?.addEventListener('click', () => {
        ZoomManager.resetScale();
        showSnackbar('已恢复默认缩放', 'info');
    });

    dom.multiSelectMenuItem.addEventListener('click', () => { 
        dom.drawer.open = false; 
        if (isCellMultiSelectMode) toggleCellMultiSelectMode();
        toggleMultiSelectMode(); 
    });
    dom.topCellMultiSelectBtn?.addEventListener('click', () => {
        if (isMultiSelectMode) toggleMultiSelectMode();
        toggleCellMultiSelectMode();
    });
    dom.cellMultiSelectMenuItem?.addEventListener('click', () => {
        if (isMultiSelectMode) toggleMultiSelectMode();
        toggleCellMultiSelectMode();
    });
    dom.invertSelectionMenuItem?.addEventListener('click', invertSelectedCells);
    dom.cellSelectionSetMenuItem?.addEventListener('click', () => {
        const first = getFirstEditableCellSelection();
        if (first) openQuickEdit(first.row, first.field);
    });
    dom.cellSelectionDeleteDataMenuItem?.addEventListener('click', () => confirmCellSelectionMutation('data'));
    dom.cellSelectionDeleteStyleMenuItem?.addEventListener('click', () => confirmCellSelectionMutation('style'));

    const settingsAboutItem = document.getElementById('settingsAboutItem');
    if (settingsAboutItem && dom.aboutDialog) {
        settingsAboutItem.addEventListener('click', () => {
            document.body.appendChild(dom.aboutDialog);
            dom.aboutDialog.style.zIndex = '22000';
            dom.aboutDialog.open = true;
        });
    }

    const aboutVer = document.getElementById('aboutCurrentVersion');
    if (aboutVer) aboutVer.textContent = `${RSDB_VERSION} 【最新版】`;
    const aboutLog = document.getElementById('aboutChangelog');
    if (aboutLog) {
        aboutLog.innerHTML = '';
        RSDB_CHANGELOG.forEach(entry => {
            const block = document.createElement('div');
            block.style.padding = '10px 12px';
            block.style.border = '1px solid var(--border-color)';
            block.style.borderRadius = '10px';
            const title = document.createElement('div');
            title.style.fontWeight = '600';
            title.style.marginBottom = '6px';
            title.textContent = entry.version;
            const ul = document.createElement('ul');
            ul.style.margin = '0';
            ul.style.paddingLeft = '18px';
            ul.style.listStyle = 'none';
            (entry.notes || []).forEach(n => {
                const li = document.createElement('li');
                li.style.marginBottom = '4px';
                li.textContent = `• ${n}`;
                ul.appendChild(li);
            });
            block.appendChild(title);
            block.appendChild(ul);
			if (Array.isArray(entry.sources) && entry.sources.length) {
			    const sourceTitle = document.createElement('div');
			    sourceTitle.style.fontWeight = '600';
			    sourceTitle.style.margin = '10px 0 5px';
			    sourceTitle.textContent = '词库、源码与许可证';
			    const sourceList = document.createElement('div');
			    sourceList.style.display = 'grid';
			    sourceList.style.gap = '5px';
			    entry.sources.forEach(source => {
			        const row = document.createElement('div');
			        row.style.fontSize = '0.84rem';
			        row.style.overflowWrap = 'anywhere';
			        const label = document.createElement('span');
			        label.textContent = `${source.name}（${source.license}）：`;
			        const link = document.createElement('a');
			        link.href = source.url;
			        link.textContent = source.url;
			        link.target = '_blank';
			        link.rel = 'noopener noreferrer';
			        link.style.color = 'var(--mdui-color-primary, #00796b)';
			        row.append(label, link);
			        sourceList.appendChild(row);
			    });
			    block.append(sourceTitle, sourceList);
			}
            aboutLog.appendChild(block);
        });
    }

    let searchDebounceTimer = null;
    dom.searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(startSearch, 160);
    });

    dom.replaceQueryInput.addEventListener('input', () => {
        dom.replaceOneBtn.disabled = searchMatches.length === 0;
        dom.replaceAllBtn.disabled = searchMatches.length === 0;
    });

    dom.prevMatchBtn.addEventListener('click', () => navigateMatch(-1));
    dom.nextMatchBtn.addEventListener('click', () => navigateMatch(1));
    dom.replaceOneBtn.addEventListener('click', replaceOne);
    dom.replaceAllBtn.addEventListener('click', confirmReplaceAll);

    function openDocumentNameDialog(mode, sourceName = '') {
        pendingDocumentNameMode = mode === 'rename' ? 'rename' : (mode === 'saveAs' ? 'saveAs' : 'save');
        pendingDocumentRenameSource = pendingDocumentNameMode === 'rename' ? normalizeDocumentName(sourceName) : '';
        if (!dom.documentNameDialog || !dom.documentNameInput) return;
        const isRename = pendingDocumentNameMode === 'rename';
        dom.documentNameInput.value = isRename
            ? pendingDocumentRenameSource
		    : (pendingDocumentNameMode === 'saveAs' ? getCurrentDateFileName() : (currentDocumentName || getCurrentDateFileName()));
        dom.documentNameDialog.setAttribute('headline', isRename
            ? '重命名表格'
            : (pendingDocumentNameMode === 'saveAs' ? '另存为' : '手动保存'));
        dom.documentNameConfirmBtn.textContent = isRename ? '重命名' : '保存';
        document.body.appendChild(dom.documentNameDialog);
        dom.documentNameDialog.open = true;
        setTimeout(() => dom.documentNameInput.focus?.(), 80);
    }

    async function performManualSave() {
        dom.drawer.open = false;
        if (!currentDocumentName) {
            openDocumentNameDialog('save');
            return;
        }
        try {
            await saveDocumentRecord(currentDocumentName);
            await saveDataToIndexedDB();
            showSnackbar(`已手动保存“${currentDocumentName}”`, 'success');
        } catch (error) {
            console.error('手动保存失败', error);
            showSnackbar('手动保存失败', 'error');
        }
    }

    async function saveCurrentTableBeforeOpen() {
        // 打开其他表格前先落盘当前快照；已有文件名时同步更新对应文件记录。
        if (currentDocumentName) await saveDocumentRecord(currentDocumentName);
        await saveDataToIndexedDB();
    }

    let documentListRecords = [];
    function updateDocumentSelectionControls() {
        const availableNames = new Set(documentListRecords.map(record => record.name));
        selectedDocumentNames.forEach(name => {
            if (!availableNames.has(name)) selectedDocumentNames.delete(name);
        });
        const selectedCount = selectedDocumentNames.size;
        if (dom.documentMultiSelectBtn) {
            dom.documentMultiSelectBtn.setAttribute('icon', documentMultiSelectMode ? 'close' : 'checklist');
            dom.documentMultiSelectBtn.setAttribute('aria-label', documentMultiSelectMode ? '退出多选' : '多选');
            dom.documentMultiSelectBtn.setAttribute('aria-pressed', documentMultiSelectMode ? 'true' : 'false');
        }
        if (dom.documentMultiSelectTooltip) {
            dom.documentMultiSelectTooltip.setAttribute('content', documentMultiSelectMode ? '退出多选' : '多选');
        }
        if (dom.documentBulkDeleteBtn) {
            dom.documentBulkDeleteBtn.disabled = selectedCount === 0;
        }
        if (dom.documentBulkDeleteTooltip) dom.documentBulkDeleteTooltip.hidden = !documentMultiSelectMode;
        return selectedCount;
    }

    function setDocumentMultiSelectMode(enabled) {
        documentMultiSelectMode = Boolean(enabled);
        if (!documentMultiSelectMode) selectedDocumentNames.clear();
        updateDocumentSelectionControls();
        renderDocumentList(dom.documentSearchInput?.value || '');
    }

    function toggleDocumentSelection(name) {
        const normalized = normalizeDocumentName(name);
        if (!normalized) return;
        if (selectedDocumentNames.has(normalized)) selectedDocumentNames.delete(normalized);
        else selectedDocumentNames.add(normalized);
        updateDocumentSelectionControls();
        renderDocumentList(dom.documentSearchInput?.value || '');
    }

    function requestDocumentDelete(names) {
        pendingDocumentDeleteNames = [...new Set((names || []).map(normalizeDocumentName).filter(Boolean))]
            .filter(name => documentListRecords.some(record => record.name === name));
        if (!pendingDocumentDeleteNames.length || !dom.documentDeleteConfirmDialog) return;
        if (dom.documentDeleteConfirmMessage) {
            dom.documentDeleteConfirmMessage.textContent = pendingDocumentDeleteNames.length === 1
                ? `确定删除表格“${pendingDocumentDeleteNames[0]}”吗？此操作无法撤销。`
                : `确定删除选中的 ${pendingDocumentDeleteNames.length} 个表格吗？此操作无法撤销。`;
        }
		openDialogOnTop(dom.documentDeleteConfirmDialog);
    }

    function renderDocumentList(query = '') {
        if (!dom.documentList || !dom.documentListEmpty) return;
        dom.documentList.innerHTML = '';
        const normalizedQuery = String(query || '').trim().toLowerCase();
        const records = documentListRecords.filter(record => {
            if (!normalizedQuery) return true;
            const dateText = new Date(record.updatedAt || record.savedAt || Date.now()).toLocaleString('zh-CN');
            return `${record.name} ${dateText}`.toLowerCase().includes(normalizedQuery);
        });
        dom.documentListEmpty.textContent = documentListRecords.length && !records.length
            ? '没有匹配的表格'
            : '暂无已保存的表格';
        dom.documentListEmpty.style.display = records.length ? 'none' : 'block';
        if (dom.documentSearchCount) {
            const resultText = normalizedQuery ? `找到 ${records.length} 个表格` : `共 ${records.length} 个表格`;
            dom.documentSearchCount.textContent = documentMultiSelectMode
                ? `已选择 ${selectedDocumentNames.size} 个 · ${resultText}`
                : resultText;
        }
        records.forEach(record => {
            const row = document.createElement('div');
            row.className = 'open-document-row';
            const isSelected = selectedDocumentNames.has(record.name);
            row.classList.toggle('is-selected', isSelected);
            const item = document.createElement('mdui-list-item');
            item.setAttribute('headline', record.name);
            item.setAttribute('description', new Date(record.updatedAt || record.savedAt || Date.now()).toLocaleString('zh-CN'));
            item.setAttribute('icon', isSelected ? 'check_circle' : (record.name === currentDocumentName ? 'check_circle' : 'description'));
            item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            item.setAttribute('rounded', '');
            item.addEventListener('click', async () => {
                if (documentMultiSelectMode) {
                    toggleDocumentSelection(record.name);
                    return;
                }
                try {
                    if (await loadDocument(record.name)) {
                        dom.openDocumentDialog.open = false;
                        showSnackbar(`已打开“${record.name}”`, 'success');
                    }
                } catch (error) {
                    console.error('打开表格失败', error);
                    showSnackbar('打开表格失败', 'error');
                }
            });
            const actions = document.createElement('div');
            actions.className = 'open-document-row-actions';
            actions.hidden = documentMultiSelectMode;
            const editTooltip = document.createElement('mdui-tooltip');
            editTooltip.setAttribute('content', '重命名');
            const editBtn = document.createElement('mdui-button-icon');
            editBtn.setAttribute('icon', 'edit');
            editBtn.setAttribute('aria-label', `重命名${record.name}`);
            editBtn.addEventListener('click', event => {
                event.stopPropagation();
                openDocumentNameDialog('rename', record.name);
            });
            editTooltip.appendChild(editBtn);
            const removeTooltip = document.createElement('mdui-tooltip');
            removeTooltip.setAttribute('content', '删除');
            const removeBtn = document.createElement('mdui-button-icon');
            removeBtn.setAttribute('icon', 'delete');
            removeBtn.setAttribute('aria-label', `删除${record.name}`);
            removeBtn.addEventListener('click', event => {
                event.stopPropagation();
                requestDocumentDelete([record.name]);
            });
            removeTooltip.appendChild(removeBtn);
            actions.append(editTooltip, removeTooltip);
            row.append(item, actions);
            dom.documentList.appendChild(row);
        });
        updateDocumentSelectionControls();
    }

    dom.documentNameCancelBtn?.addEventListener('click', () => {
        dom.documentNameDialog.open = false;
        pendingDocumentRenameSource = '';
        pendingDocumentNameMode = 'save';
    });

    function openDocumentNameConflictDialog(name) {
        pendingDocumentConflictName = normalizeDocumentName(name);
        if (!pendingDocumentConflictName || !dom.documentNameConflictDialog) return;
        if (dom.documentNameConflictMessage) {
            dom.documentNameConflictMessage.textContent = `检测到已存在名为“${pendingDocumentConflictName}”的表格，是否覆盖？`;
        }
		openDialogOnTop(dom.documentNameConflictDialog);
    }

    function setDocumentNameConflictBusy(busy) {
        [dom.documentNameConflictCancelBtn, dom.documentNameConflictCopyBtn, dom.documentNameConflictOverwriteBtn]
            .forEach(button => {
                if (button) button.disabled = Boolean(busy);
            });
    }

    function closeDocumentNameConflictDialog() {
        if (dom.documentNameConflictDialog) dom.documentNameConflictDialog.open = false;
        pendingDocumentConflictName = '';
        pendingDocumentNameMode = 'save';
        setDocumentNameConflictBusy(false);
    }

    async function saveConflictingDocument(choice) {
        const sourceName = normalizeDocumentName(pendingDocumentConflictName);
        if (!sourceName || !['overwrite', 'copy'].includes(choice)) return;
        setDocumentNameConflictBusy(true);
        try {
            const targetName = choice === 'copy'
                ? await createAvailableDocumentCopyName(sourceName)
                : sourceName;
            if (!targetName) throw new Error('无法生成文件名称');
            await saveDocumentRecord(targetName);
            await saveDataToIndexedDB();
            if (dom.documentNameConflictDialog) dom.documentNameConflictDialog.open = false;
            pendingDocumentConflictName = '';
            pendingDocumentNameMode = 'save';
            showSnackbar(choice === 'copy'
                ? `已复制保存为“${targetName}”`
                : `已覆盖“${targetName}”`, 'success');
        } catch (error) {
            console.error(choice === 'copy' ? '复制保存表格失败' : '覆盖保存表格失败', error);
            showSnackbar(choice === 'copy' ? '复制保存失败' : '覆盖保存失败', 'error');
        } finally {
            setDocumentNameConflictBusy(false);
        }
    }

    dom.documentNameConflictCancelBtn?.addEventListener('click', closeDocumentNameConflictDialog);
    dom.documentNameConflictCopyBtn?.addEventListener('click', () => saveConflictingDocument('copy'));
    dom.documentNameConflictOverwriteBtn?.addEventListener('click', () => saveConflictingDocument('overwrite'));

    dom.documentNameConfirmBtn?.addEventListener('click', async () => {
        const name = normalizeDocumentName(dom.documentNameInput?.value || '');
        if (!name) {
            showSnackbar('请输入文件名称', 'warning');
            return;
        }
        dom.documentNameConfirmBtn.disabled = true;
        try {
            if (pendingDocumentNameMode === 'rename') {
                if (name === pendingDocumentRenameSource) {
                    dom.documentNameDialog.open = false;
                    showSnackbar('名称未更改', 'info');
                    return;
                }
                await renameDocument(pendingDocumentRenameSource, name);
                selectedDocumentNames.delete(pendingDocumentRenameSource);
                documentListRecords = await listDocuments();
                renderDocumentList(dom.documentSearchInput?.value || '');
                dom.documentNameDialog.open = false;
                showSnackbar(`已重命名为“${name}”`, 'success');
                pendingDocumentRenameSource = '';
                pendingDocumentNameMode = 'save';
                return;
            }
		    if (pendingDocumentNameMode === 'saveAs' && await documentNameExists(name)) {
		        dom.documentNameDialog.open = false;
		        openDocumentNameConflictDialog(name);
		        return;
		    }
            await saveDocumentRecord(name);
            await saveDataToIndexedDB();
            dom.documentNameDialog.open = false;
            showSnackbar(`已保存“${name}”`, 'success');
        } catch (error) {
            if (error?.code === 'DOCUMENT_NAME_EXISTS') {
                showSnackbar(`已存在名为“${name}”的表格`, 'warning');
            } else if (error?.code === 'DOCUMENT_NOT_FOUND') {
                showSnackbar('原表格已不存在，请刷新列表', 'warning');
            } else {
                console.error(pendingDocumentNameMode === 'rename' ? '重命名表格失败' : '保存表格失败', error);
                showSnackbar(pendingDocumentNameMode === 'rename' ? '重命名表格失败' : '保存表格失败', 'error');
            }
        } finally {
            dom.documentNameConfirmBtn.disabled = false;
        }
    });
    dom.documentNameInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') dom.documentNameConfirmBtn?.click();
    });
    dom.openDocumentCancelBtn?.addEventListener('click', () => {
        setDocumentMultiSelectMode(false);
        dom.openDocumentDialog.open = false;
    });
    dom.documentSearchInput?.addEventListener('input', (event) => renderDocumentList(event.target.value || ''));
    dom.documentMultiSelectBtn?.addEventListener('click', () => setDocumentMultiSelectMode(!documentMultiSelectMode));
    dom.documentBulkDeleteBtn?.addEventListener('click', () => requestDocumentDelete([...selectedDocumentNames]));
    dom.documentDeleteCancelBtn?.addEventListener('click', () => {
        pendingDocumentDeleteNames = [];
        dom.documentDeleteConfirmDialog.open = false;
    });
    dom.documentDeleteConfirmBtn?.addEventListener('click', async () => {
        const names = [...pendingDocumentDeleteNames];
        if (!names.length) return;
        dom.documentDeleteConfirmBtn.disabled = true;
        try {
            const deletedNames = await deleteDocuments(names);
            const deletedSet = new Set(deletedNames);
            documentListRecords = documentListRecords.filter(record => !deletedSet.has(record.name));
            deletedNames.forEach(name => selectedDocumentNames.delete(name));
            pendingDocumentDeleteNames = [];
            dom.documentDeleteConfirmDialog.open = false;
            renderDocumentList(dom.documentSearchInput?.value || '');
            showSnackbar(deletedNames.length === 1
                ? `已删除“${deletedNames[0]}”`
                : `已删除 ${deletedNames.length} 个表格`, 'success');
        } catch (error) {
            console.error('删除表格失败', error);
            showSnackbar('删除表格失败', 'error');
        } finally {
            dom.documentDeleteConfirmBtn.disabled = false;
        }
    });
    dom.manualSaveItem?.addEventListener('click', performManualSave);
    dom.saveAsItem?.addEventListener('click', () => { dom.drawer.open = false; openDocumentNameDialog('saveAs'); });
    dom.openDocumentItem?.addEventListener('click', async () => {
        dom.drawer.open = false;
        try {
            await saveCurrentTableBeforeOpen();
            documentListRecords = await listDocuments();
            if (dom.documentSearchInput) dom.documentSearchInput.value = '';
            documentMultiSelectMode = false;
            selectedDocumentNames.clear();
            updateDocumentSelectionControls();
            renderDocumentList('');
            dom.openDocumentDialog.open = true;
            setTimeout(() => dom.documentSearchInput?.focus({ preventScroll: true }), 100);
        } catch (error) {
            console.error('读取表格列表失败', error);
            showSnackbar('保存当前表格或读取表格列表失败', 'error');
        }
    });

    // Removed input click listeners as per user request (only edit button triggers edit mode)

    dom.importItem.addEventListener('click', () => { dom.drawer.open = false; dom.fileInput.click(); });
    dom.exportItem.addEventListener('click', () => {
        dom.drawer.open = false;
        updateSettingsUI();
		const exportNameInput = document.getElementById('exportFileNameInput');
		if (exportNameInput) exportNameInput.value = getExportBaseName();
        const dlg = document.getElementById('exportChoiceDialog');
        if (dlg) dlg.open = true;
    });
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDialog = document.getElementById('settingsDialog');
    settingsBtn?.addEventListener('click', () => {
        dom.drawer.open = false;
        updateSettingsUI();
        if (settingsDialog) settingsDialog.open = true;
    });
    const settingsResetDialog = document.getElementById('settingsResetDialog');
    const settingsResetChecks = () => Array.from(document.querySelectorAll('#settingsResetGroups [data-reset-group]'));
    const syncSettingsResetSelectAll = () => {
        const checks = settingsResetChecks();
        const all = document.getElementById('settingsResetSelectAll');
        if (all) all.checked = checks.length > 0 && checks.every(check => check.checked);
    };
    document.getElementById('settingsResetItem')?.addEventListener('click', () => {
        settingsResetChecks().forEach(check => { check.checked = true; });
        const all = document.getElementById('settingsResetSelectAll');
        if (all) all.checked = true;
        if (settingsResetDialog) {
            settingsResetDialog.style.zIndex = '21000';
            settingsResetDialog.open = true;
        }
    });
    document.getElementById('settingsResetSelectAll')?.addEventListener('change', (event) => {
        settingsResetChecks().forEach(check => { check.checked = event.target.checked === true; });
    });
    settingsResetChecks().forEach(check => check.addEventListener('change', syncSettingsResetSelectAll));
    document.getElementById('settingsResetCloseBtn')?.addEventListener('click', () => {
        if (settingsResetDialog) settingsResetDialog.open = false;
    });
    document.getElementById('settingsResetCancelBtn')?.addEventListener('click', () => {
        if (settingsResetDialog) settingsResetDialog.open = false;
    });
    document.getElementById('settingsResetConfirmBtn')?.addEventListener('click', () => {
        const selected = settingsResetChecks().filter(check => check.checked).map(check => check.dataset.resetGroup);
        if (!selected.length) {
            showSnackbar('请至少选择一个设置项目', 'warning');
            return;
        }
        const labels = selected.map(id => SETTINGS_RESET_GROUPS[id]?.label).filter(Boolean).join('、');
        if (!confirm(`确定重置以下设置吗？\n\n${labels}\n\n表格数据和已保存文件不会被删除。`)) return;
        resetSelectedSettings(selected);
        if (settingsResetDialog) settingsResetDialog.open = false;
        showSnackbar(`已重置 ${selected.length} 项设置`, 'success');
    });
    document.getElementById('closeSettingsDialogBtn')?.addEventListener('click', () => {
        if (settingsDialog) settingsDialog.open = false;
    });
    document.getElementById('settingsSearchInput')?.addEventListener('input', (event) => {
        const query = (event.target.value || '').trim().toLowerCase();
        settingsDialog?.querySelectorAll('mdui-list-item').forEach(item => {
            const text = `${item.getAttribute('headline') || ''} ${item.getAttribute('description') || ''} ${item.textContent || ''}`.toLowerCase();
            item.style.display = !query || text.includes(query) ? '' : 'none';
        });
        settingsDialog?.querySelectorAll('mdui-list-subheader, mdui-divider').forEach(el => {
            el.style.display = query ? 'none' : '';
        });
    });

    const dictionaryState = { mode: 'system', category: 'all', page: 0, pageSize: 30, hasMore: false };
    let dictionarySearchTimer = null;

    function renderDictionaryPage() {
        const library = window.RSDBInputMethodLibrary;
        const list = document.getElementById('dictionaryResultList');
        const empty = document.getElementById('dictionaryEmptyState');
        const pageInfo = document.getElementById('dictionaryPageInfo');
        const previous = document.getElementById('dictionaryPrevBtn');
        const next = document.getElementById('dictionaryNextBtn');
        const categoryGroup = document.getElementById('dictionaryCategoryGroup');
        const personalActions = document.getElementById('personalDictionaryActions');
        const personalSummary = document.getElementById('personalDictionarySummary');
        const query = String(document.getElementById('dictionarySearchInput')?.value || '').trim();
        if (!list || !empty || !pageInfo) return;

        let entries = [];
        let total = null;
        if (dictionaryState.mode === 'personal') {
            const personalEntries = getPersonalDictionaryEntries(query);
            total = personalEntries.length;
            const maximumPage = Math.max(0, Math.ceil(total / dictionaryState.pageSize) - 1);
            dictionaryState.page = Math.min(dictionaryState.page, maximumPage);
            const start = dictionaryState.page * dictionaryState.pageSize;
            entries = personalEntries.slice(start, start + dictionaryState.pageSize).map(entry => ({
                text: entry.text,
                code: entry.code,
                type: entry.kind === 'english' ? '英文习惯' : '中文习惯',
                usage: `使用 ${entry.count} 次${entry.lastUsed ? ` · ${new Date(entry.lastUsed).toLocaleString()}` : ''}`
            }));
            dictionaryState.hasMore = start + entries.length < total;
            if (personalSummary) personalSummary.textContent = `共 ${total} 条个人习惯`;
        } else if (library?.browseDictionary) {
            const result = library.browseDictionary({
                query,
                category: dictionaryState.category,
                page: dictionaryState.page,
                pageSize: dictionaryState.pageSize
            });
            entries = result.entries || [];
            dictionaryState.hasMore = !!result.hasMore;
        }

        if (categoryGroup) categoryGroup.style.display = dictionaryState.mode === 'system' ? '' : 'none';
        if (personalActions) personalActions.style.display = dictionaryState.mode === 'personal' ? 'flex' : 'none';
        list.replaceChildren();
        entries.forEach(entry => {
            const row = document.createElement('div');
            row.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;padding:12px 4px;border-bottom:1px solid var(--mdui-color-outline-variant);align-items:start;';
            const text = document.createElement('div');
            text.style.cssText = 'font-size:1rem;font-weight:600;overflow-wrap:anywhere;min-width:0;';
            text.textContent = entry.text;
            const type = document.createElement('mdui-chip');
            type.setAttribute('variant', 'assist');
            type.textContent = entry.type;
            const code = document.createElement('div');
            code.style.cssText = 'grid-column:1/-1;color:var(--mdui-color-on-surface-variant);font-size:.88rem;overflow-wrap:anywhere;';
            code.textContent = `${entry.code || '无编码'}${entry.usage ? ` · ${entry.usage}` : ''}`;
            row.append(text, type, code);
            list.appendChild(row);
        });
        const hasEntries = entries.length > 0;
        list.style.display = hasEntries ? 'block' : 'none';
        empty.style.display = hasEntries ? 'none' : 'grid';
        pageInfo.textContent = total === null
            ? `第 ${dictionaryState.page + 1} 页 · ${entries.length} 条`
            : `第 ${dictionaryState.page + 1} 页 / ${Math.max(1, Math.ceil(total / dictionaryState.pageSize))} 页`;
        if (previous) previous.disabled = dictionaryState.page <= 0;
        if (next) next.disabled = !dictionaryState.hasMore;
        list.scrollTop = 0;
    }

    function downloadPersonalDictionary() {
        const payload = {
            type: 'rsdb-personal-dictionary',
            version: 1,
            exportedAt: new Date().toISOString(),
            learning: sanitizeImeLearningState(imeLearningState)
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const date = new Date();
        const dateText = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `rsdb_personal_dictionary_${dateText}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
        showSnackbar('已导出个人词库', 'success');
    }

    document.getElementById('settingsDictionaryItem')?.addEventListener('click', () => {
        dictionaryState.page = 0;
        const dialog = document.getElementById('dictionaryDialog');
        if (dialog) dialog.open = true;
        renderDictionaryPage();
    });
    document.getElementById('dictionaryCloseBtn')?.addEventListener('click', () => {
        const dialog = document.getElementById('dictionaryDialog');
        if (dialog) dialog.open = false;
    });
    document.querySelectorAll('#dictionaryModeGroup mdui-segmented-button').forEach(button => {
        button.addEventListener('click', () => {
            dictionaryState.mode = button.getAttribute('value') === 'personal' ? 'personal' : 'system';
            dictionaryState.page = 0;
            renderDictionaryPage();
        });
    });
    document.querySelectorAll('#dictionaryCategoryGroup mdui-segmented-button').forEach(button => {
        button.addEventListener('click', () => {
            const value = button.getAttribute('value');
            dictionaryState.category = ['all', 'chinese', 'english'].includes(value) ? value : 'all';
            dictionaryState.page = 0;
            renderDictionaryPage();
        });
    });
    document.getElementById('dictionarySearchInput')?.addEventListener('input', () => {
        clearTimeout(dictionarySearchTimer);
        dictionarySearchTimer = setTimeout(() => {
            dictionaryState.page = 0;
            renderDictionaryPage();
        }, 180);
    });
    document.getElementById('dictionaryPrevBtn')?.addEventListener('click', () => {
        if (dictionaryState.page <= 0) return;
        dictionaryState.page--;
        renderDictionaryPage();
    });
    document.getElementById('dictionaryNextBtn')?.addEventListener('click', () => {
        if (!dictionaryState.hasMore) return;
        dictionaryState.page++;
        renderDictionaryPage();
    });
    document.getElementById('personalDictionaryExportBtn')?.addEventListener('click', downloadPersonalDictionary);
    document.getElementById('personalDictionaryImportBtn')?.addEventListener('click', () => {
        document.getElementById('personalDictionaryImportInput')?.click();
    });
    document.getElementById('personalDictionaryImportInput')?.addEventListener('change', async event => {
        const input = event.target;
        const file = input?.files?.[0];
        if (!file) return;
        try {
            if (file.size > 5 * 1024 * 1024) throw new Error('文件过大');
            const parsed = JSON.parse(await file.text());
            const learning = parsed?.type === 'rsdb-personal-dictionary' ? parsed.learning : parsed;
            if (!learning || typeof learning !== 'object') throw new Error('无个人词库数据');
            mergeImeLearningState(learning);
            dictionaryState.page = 0;
            renderDictionaryPage();
            refreshImeCandidates();
            showSnackbar('已合并个人词库', 'success');
        } catch (error) {
            showSnackbar(`个人词库导入失败：${error.message || '格式不正确'}`, 'error');
        } finally {
            input.value = '';
        }
    });

    document.getElementById('settingsExportAllXmlItem')?.addEventListener('click', () => {
        const inputStatsCheck = document.getElementById('configExportInputStats');
        const shortcutStatsCheck = document.getElementById('configExportShortcutStats');
        if (inputStatsCheck) inputStatsCheck.checked = false;
        if (shortcutStatsCheck) shortcutStatsCheck.checked = false;
        const dlg = document.getElementById('configExportDialog');
        if (dlg) dlg.open = true;
    });
    document.getElementById('configExportCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('configExportDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('configExportOkBtn')?.addEventListener('click', () => {
        const include = (id) => !!document.getElementById(id)?.checked;
        const json = (v) => `<![CDATA[${JSON.stringify(v ?? {}, null, 2)}]]>`;
        const escape = (s) => (s ?? '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const sections = [];
        if (include('configExportTheme')) {
            sections.push(`  <theme>${escape(localStorage.getItem('theme') || 'auto')}</theme>`);
            sections.push(`  <primaryColor>${escape(localStorage.getItem(PRIMARY_KEY) || '')}</primaryColor>`);
        }
        if (include('configExportAppSettings')) sections.push(`  <appSettings>${json(appSettings || {})}</appSettings>`);
        if (include('configExportKeyboard')) sections.push(`  <keyboardConfig>${json(KeyboardConfigManager?.config || {})}</keyboardConfig>`);
        if (include('configExportPersonalDictionary')) sections.push(`  <imeLearning>${json(sanitizeImeLearningState(imeLearningState))}</imeLearning>`);
        if (include('configExportInputStats')) sections.push(`  <inputStats>${json(inputStats || {})}</inputStats>`);
        if (include('configExportShortcutStats')) sections.push(`  <shortcutClickStats>${json(shortcutClickStats || {})}</shortcutClickStats>`);
        if (!sections.length) {
            showSnackbar('请至少选择一项配置', 'warning');
            return;
        }
        const exportedAt = new Date().toISOString();
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rsdbConfig version="2" exportedAt="${escape(exportedAt)}">\n${sections.join('\n')}\n</rsdbConfig>\n`;
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rsdb_config.xml';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
        const dlg = document.getElementById('configExportDialog');
        if (dlg) dlg.open = false;
        showSnackbar('已导出 XML 配置', 'success');
    });
    document.getElementById('settingsImportAllXmlItem')?.addEventListener('click', () => {
        const input = document.getElementById('importAllXmlInput');
        if (input) input.click();
    });
document.getElementById('importAllXmlInput')?.addEventListener('change', async (e) => {
    const input = e.target;
    const file = input?.files?.[0];
    if (!file) return;

    try {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');
        const root = doc.querySelector('rsdbConfig');
        if (!root) throw new Error('invalid xml');
        
        const theme = root.querySelector('theme')?.textContent?.trim();
        const primary = root.querySelector('primaryColor')?.textContent?.trim();
        
        const readJson = (tag) => {
            const node = root.querySelector(tag);
            if (!node) return null;
            const raw = node?.textContent || '';
            return raw ? JSON.parse(raw) : null;
        };
        
        const importedAppSettings = readJson('appSettings');
        const importedKeyboardConfig = readJson('keyboardConfig');
        const importedImeLearning = readJson('imeLearning');
        const importedInputStats = readJson('inputStats');
        const importedShortcutClickStats = readJson('shortcutClickStats');

        if (theme) localStorage.setItem('theme', theme);
        if (primary) localStorage.setItem(PRIMARY_KEY, primary);
        if (importedAppSettings !== null) localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(importedAppSettings));
        if (importedKeyboardConfig !== null) localStorage.setItem(KeyboardConfigManager.STORAGE_KEY, JSON.stringify(importedKeyboardConfig));
        if (importedImeLearning !== null) localStorage.setItem(IME_LEARNING_KEY, JSON.stringify(sanitizeImeLearningState(importedImeLearning)));
        if (importedInputStats !== null) localStorage.setItem(INPUT_STATS_KEY, JSON.stringify(importedInputStats));
        if (importedShortcutClickStats !== null) localStorage.setItem(SHORTCUT_CLICK_STATS_KEY, JSON.stringify(importedShortcutClickStats));

        showSnackbar('已导入配置，正在刷新...', 'success');
        setTimeout(() => location.reload(), 260);
    } catch (err) {
        showSnackbar('导入失败：XML 格式不正确', 'error');
    } finally {
        
        input.value = '';
    }
});
    document.getElementById('settingsShortcutRowsItem')?.addEventListener('click', () => {
        updateSettingsUI();
        const dlg = document.getElementById('shortcutRowsDialog');
        if (dlg) dlg.open = true;
    });
    document.getElementById('settingsToolbarShakeItem')?.addEventListener('click', () => {
        updateSettingsUI();
        const dlg = document.getElementById('toolbarShakeSettingsDialog');
        if (dlg) dlg.open = true;
    });
    document.getElementById('toolbarShakeSettingsCloseBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('toolbarShakeSettingsDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('toolbarLayoutEditCloseBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('toolbarLayoutEditDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('toolbarLayoutEditCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('toolbarLayoutEditDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('toolbarLayoutEditSaveBtn')?.addEventListener('click', saveToolbarLayoutEditor);
    document.getElementById('addToolbarLayoutBtn')?.addEventListener('click', () => {
        if (normalizeToolbarShakeLayouts(appSettings.toolbarShakeLayouts).length >= 10) {
            showSnackbar('最多支持 10 个布局', 'warning');
            return;
        }
        openToolbarLayoutEditor(-1);
    });
    document.getElementById('toolbarShakeEnabledSwitch')?.addEventListener('change', e => {
        saveAppSettings({ toolbarShakeEnabled: e.target.checked });
    });
    document.getElementById('toolbarShakeAnimationSwitch')?.addEventListener('change', e => {
        saveAppSettings({ toolbarShakeAnimation: e.target.checked });
    });
    document.getElementById('toolbarScaleSlider')?.addEventListener('input', e => {
        const value = Math.max(50, Math.min(150, Math.round(Number(e.target.value) || 100)));
        const label = document.getElementById('toolbarScaleValue');
        if (label) label.textContent = value + '%';
        saveAppSettings({ toolbarScale: value });
    });
    document.getElementById('toolbarShakeAmplitudeSlider')?.addEventListener('input', e => {
        const value = Math.max(12, Math.min(80, Number(e.target.value) || 26));
        const label = document.getElementById('toolbarShakeAmplitudeValue');
        if (label) label.textContent = value + ' px';
        saveAppSettings({ toolbarShakeAmplitude: value });
    });
    document.getElementById('settingsShortcutToolbarResetItem')?.addEventListener('click', () => {
        window.resetShortcutToolbarWrapPosition?.();
        showSnackbar('已重置快捷短语工具栏位置', 'success');
    });
    document.getElementById('settingsFabPositionItem')?.addEventListener('click', () => {
        const fab = document.getElementById('mainFab');
        const dlg = document.getElementById('fabPositionDialog');
        const xInput = document.getElementById('fabPosXInput');
        const yInput = document.getElementById('fabPosYInput');
        const xSlider = document.getElementById('fabPosXSlider');
        const ySlider = document.getElementById('fabPosYSlider');
        if (!fab || !dlg || !xInput || !yInput || !xSlider || !ySlider) return;
        const style = window.getComputedStyle(fab);
        const right = Math.max(0, Math.round(parseFloat(style.right) || 24));
        const bottom = Math.max(0, Math.round(parseFloat(style.bottom) || 24));
        window.__rsdbFabPosDraftOrigin = { right: `${right}px`, bottom: `${bottom}px` };
        const maxRight = Math.max(0, window.innerWidth - 48);
        const maxBottom = Math.max(0, window.innerHeight - 48);
        xSlider.max = String(maxRight);
        ySlider.max = String(maxBottom);
        const preview = () => {
            const rx = Math.max(0, Math.min(maxRight, Number(xInput.value) || 0));
            const by = Math.max(0, Math.min(maxBottom, Number(yInput.value) || 0));
            fab.style.right = `${rx}px`;
            fab.style.bottom = `${by}px`;
            const txt = document.getElementById('fabPositionPreviewText');
            if (txt) txt.textContent = `右侧 ${rx}px，底部 ${by}px（实时预览）`;
            xSlider.value = String(rx);
            ySlider.value = String(by);
        };
        xInput.value = String(right);
        yInput.value = String(bottom);
        xSlider.value = String(right);
        ySlider.value = String(bottom);
        preview();
        dlg.open = true;
        xSlider.oninput = () => { xInput.value = String(xSlider.value); preview(); };
        ySlider.oninput = () => { yInput.value = String(ySlider.value); preview(); };
        xInput.oninput = preview;
        yInput.oninput = preview;
    });
    document.getElementById('settingsFabResetItem')?.addEventListener('click', () => {
        localStorage.removeItem('fabPosition');
        const fab = document.getElementById('mainFab');
        if (fab) {
            fab.style.right = '24px';
            fab.style.bottom = '24px';
        }
        showSnackbar('已重置FAB位置', 'success');
    });
    document.getElementById('fabPositionCancelBtn')?.addEventListener('click', () => {
        const fab = document.getElementById('mainFab');
        const old = window.__rsdbFabPosDraftOrigin;
        if (fab && old) {
            fab.style.right = old.right;
            fab.style.bottom = old.bottom;
        }
        const dlg = document.getElementById('fabPositionDialog');
        if (dlg) dlg.open = false;
    });
    bindImmediateActionButton(document.getElementById('fabPositionOkBtn'), () => {
        const fab = document.getElementById('mainFab');
        const xInput = document.getElementById('fabPosXInput');
        const yInput = document.getElementById('fabPosYInput');
        if (!fab || !xInput || !yInput) return;
        const right = `${Math.max(0, Math.round(Number(xInput.value) || 24))}px`;
        const bottom = `${Math.max(0, Math.round(Number(yInput.value) || 24))}px`;
        fab.style.right = right;
        fab.style.bottom = bottom;
        localStorage.setItem('fabPosition', JSON.stringify({ right, bottom }));
        window.__rsdbFabPosDraftOrigin = null;
        const dlg = document.getElementById('fabPositionDialog');
        if (dlg) dlg.open = false;
        showSnackbar('已保存FAB位置', 'success');
    });
    document.getElementById('settingsSuggestThresholdItem')?.addEventListener('click', () => {
        updateSettingsUI();
        const dlg = document.getElementById('suggestThresholdDialog');
        if (dlg) dlg.open = true;
    });
    document.getElementById('settingsDialogPositionItem')?.addEventListener('click', () => {
        updateSettingsUI();
        const dlg = document.getElementById('dialogPositionDialog');
        if (dlg) dlg.open = true;
    });
    document.getElementById('settingsTableViewItem')?.addEventListener('click', () => {
        updateSettingsUI();
        const dlg = document.getElementById('tableViewDialog');
        if (dlg) dlg.open = true;
    });
    document.getElementById('settingsCursorHandleItem')?.addEventListener('click', () => {
        const input = document.getElementById('cursorHandleDurationInput');
        if (input) input.value = String(Number(appSettings.cursorHandleDuration) || 0);
        const dlg = document.getElementById('cursorHandleSettingsDialog');
        if (dlg) dlg.open = true;
    });
    document.getElementById('cursorHandleDurationCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('cursorHandleSettingsDialog');
        if (dlg) dlg.open = false;
    });
    bindImmediateActionButton(document.getElementById('cursorHandleDurationOkBtn'), () => {
        const duration = Math.max(0, Math.min(10000, Number(document.getElementById('cursorHandleDurationInput')?.value) || 0));
        saveAppSettings({ cursorHandleDuration: duration });
        const dlg = document.getElementById('cursorHandleSettingsDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('settingsUndoRedoMaxStepsItem')?.addEventListener('click', () => {
        if (appSettings.undoRedoEnabled === false) return;
        updateSettingsUI();
        const dlg = document.getElementById('undoRedoMaxStepsDialog');
        const input = document.getElementById('undoRedoMaxStepsInput');
        if (input) input.value = String(Number(appSettings.undoRedoMaxSteps) || 10);
        if (dlg) dlg.open = true;
    });
    document.getElementById('settingsHistoryMaxCountItem')?.addEventListener('click', () => {
        if (appSettings.historyStorageEnabled === false) return;
        updateSettingsUI();
        const dlg = document.getElementById('historyMaxCountDialog');
        const input = document.getElementById('historyMaxCountInput');
        if (input) input.value = String(Number(appSettings.operationHistoryMaxCount) || 8);
        if (dlg) dlg.open = true;
    });
    document.getElementById('settingsKeyboardSizeItem')?.addEventListener('click', () => {
        updateSettingsUI();
        const dlg = document.getElementById('keyboardSizeDialog');
        if (dlg) dlg.open = true;
    });
    document.getElementById('settingsImageCompressItem')?.addEventListener('click', () => {
        updateSettingsUI();
        const dlg = document.getElementById('imageCompressSettingsDialog');
        if (dlg) dlg.open = true;
    });
    document.getElementById('settingsSnackbarItem')?.addEventListener('click', () => {
        updateSettingsUI();
        const dlg = document.getElementById('snackbarSettingsDialog');
        if (dlg) {
            document.body.appendChild(dlg);
            dlg.style.zIndex = '20000';
            const sel = document.getElementById('snackbarPlacementSelect');
            if (sel && !sel.dataset.inited) {
                sel.dataset.inited = '1';
                sel.innerHTML = [
                    '<mdui-menu-item value="bottom-center">底部居中</mdui-menu-item>',
                    '<mdui-menu-item value="bottom-left">底部左侧</mdui-menu-item>',
                    '<mdui-menu-item value="bottom-right">底部右侧</mdui-menu-item>',
                    '<mdui-menu-item value="top-center">顶部居中</mdui-menu-item>',
                    '<mdui-menu-item value="top-left">顶部左侧</mdui-menu-item>',
                    '<mdui-menu-item value="top-right">顶部右侧</mdui-menu-item>'
                ].join('');
            }
            if (sel) sel.value = appSettings.snackbarPlacement || 'bottom-center';
            const offsetXInput = document.getElementById('snackbarOffsetXInput');
            const offsetYInput = document.getElementById('snackbarOffsetYInput');
            if (offsetXInput) offsetXInput.value = String(Number(appSettings.snackbarOffsetX) || 0);
            if (offsetYInput) offsetYInput.value = String(Number.isFinite(Number(appSettings.snackbarOffsetY)) ? Number(appSettings.snackbarOffsetY) : -32);
            const group = document.getElementById('snackbarDismissGroup');
            if (group) group.value = appSettings.snackbarDismissMode === 'button' ? 'button' : 'swipe';
            dlg.open = true;
        }
    });
    document.getElementById('closeSnackbarSettingsBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('snackbarSettingsDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('historyMaxCountCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('historyMaxCountDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('saveSnackbarSettingsBtn')?.addEventListener('click', () => {
        const sel = document.getElementById('snackbarPlacementSelect');
        const placement = sel?.value || 'bottom-center';
        const group = document.getElementById('snackbarDismissGroup');
        const mode = group?.value === 'button' ? 'button' : 'swipe';
        const offsetX = Math.max(-2000, Math.min(2000, Math.round(Number(document.getElementById('snackbarOffsetXInput')?.value) || 0)));
        const offsetYRaw = Number(document.getElementById('snackbarOffsetYInput')?.value);
        const offsetY = Math.max(-2000, Math.min(2000, Math.round(Number.isFinite(offsetYRaw) ? offsetYRaw : -32)));
        saveAppSettings({ snackbarPlacement: placement, snackbarOffsetX: offsetX, snackbarOffsetY: offsetY, snackbarDismissMode: mode });
        const dlg = document.getElementById('snackbarSettingsDialog');
        if (dlg) dlg.open = false;
        showSnackbar('已保存 Snackbar 设置', 'success');
    });
    document.getElementById('historyMaxCountOkBtn')?.addEventListener('click', () => {
        if (appSettings.historyStorageEnabled === false) return;
        const input = document.getElementById('historyMaxCountInput');
        const val = Math.max(1, Math.min(200, Number(input?.value) || 8));
        saveAppSettings({ operationHistoryMaxCount: val });
        const dlg = document.getElementById('historyMaxCountDialog');
        if (dlg) dlg.open = false;
        saveOperationHistory();
        showSnackbar('已保存历史记录保留条数', 'success');
    });
    document.getElementById('undoRedoMaxStepsCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('undoRedoMaxStepsDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('undoRedoMaxStepsOkBtn')?.addEventListener('click', () => {
        if (appSettings.undoRedoEnabled === false) return;
        const input = document.getElementById('undoRedoMaxStepsInput');
        const val = Math.max(1, Math.min(200, Number(input?.value) || 10));
        saveAppSettings({ undoRedoMaxSteps: val });
        const dlg = document.getElementById('undoRedoMaxStepsDialog');
        if (dlg) dlg.open = false;
        saveOperationHistory();
        showSnackbar('已保存撤销/重做步数上限', 'success');
    });

    document.getElementById('settingsPrimaryColorItem')?.addEventListener('click', () => {
        const dlg = document.getElementById('primaryColorDialog');
        renderPrimaryThemePalette();
		openDialogOnTop(dlg);
    });
    document.getElementById('primaryColorDialogCloseBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('primaryColorDialog');
        if (dlg) dlg.open = false;
    });
    const primaryMaterialColorField = document.getElementById('primaryMaterialColorField');
    const updatePrimaryPickerFromPointer = event => {
        if (!primaryMaterialColorField) return;
        const rect = primaryMaterialColorField.getBoundingClientRect();
        primaryPickerSaturation = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        primaryPickerValue = Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height));
        updatePrimaryDraftFromPicker();
    };
    primaryMaterialColorField?.addEventListener('pointerdown', event => {
        primaryMaterialColorField.setPointerCapture?.(event.pointerId);
        updatePrimaryPickerFromPointer(event);
    });
    primaryMaterialColorField?.addEventListener('pointermove', event => {
        if (event.buttons) updatePrimaryPickerFromPointer(event);
    });
    document.getElementById('primaryMaterialHueSlider')?.addEventListener('input', event => {
        primaryPickerHue = Number(event.target.value) || 0;
        updatePrimaryDraftFromPicker();
    });
    document.getElementById('primaryCustomColorRole')?.addEventListener('change', event => {
        const role = event.target.value || 'primary';
        updatePrimaryMaterialPicker(primaryThemeDraft[role]);
    });
    document.getElementById('primaryCustomColorHex')?.addEventListener('input', event => {
        const value = String(event.target.value || '').trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(value)) return;
        const role = document.getElementById('primaryCustomColorRole')?.value || 'primary';
        primaryThemeDraft[role] = value.toLowerCase();
        updatePrimaryMaterialPicker(primaryThemeDraft[role]);
        applyStoredThemeColors(primaryThemeDraft);
    });
    document.getElementById('primaryCustomColorReset')?.addEventListener('click', () => {
        primaryThemeDraft = { ...DEFAULT_THEME_COLORS };
        const role = document.getElementById('primaryCustomColorRole')?.value || 'primary';
        updatePrimaryMaterialPicker(primaryThemeDraft[role]);
        applyStoredThemeColors(primaryThemeDraft);
    });
    document.getElementById('primaryCustomColorCancel')?.addEventListener('click', () => {
        applyStoredThemeColors(primaryThemeOriginal);
		primaryCustomColorCommitted = true;
        const dlg = document.getElementById('primaryCustomColorDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('primaryCustomColorSave')?.addEventListener('click', () => {
        if (!Object.values(primaryThemeDraft).every(color => /^#[0-9a-fA-F]{6}$/.test(color || ''))) {
            showSnackbar('请输入有效的 HEX 颜色', 'error');
            return;
        }
        const customColors = getSavedCustomThemeColors();
        const customPrimary = primaryThemeDraft.primary.toLowerCase();
        if (Number.isInteger(pendingPrimaryCustomColorIndex) && pendingPrimaryCustomColorIndex >= 0 && pendingPrimaryCustomColorIndex < customColors.length) {
            customColors[pendingPrimaryCustomColorIndex] = customPrimary;
        } else if (!customColors.some(color => color.toLowerCase() === customPrimary)) {
            customColors.push(customPrimary);
        }
        saveCustomThemeColors(customColors);
        persistStoredThemeColors(primaryThemeDraft);
        flashTheme(primaryThemeDraft.primary);
        pendingPrimaryCustomColorIndex = null;
		primaryCustomColorCommitted = true;
        const dlg = document.getElementById('primaryCustomColorDialog');
        if (dlg) dlg.open = false;
        showSnackbar('自定义主题色已保存', 'success');
    });
	document.getElementById('primaryCustomColorDialog')?.addEventListener('close', () => {
		if (!primaryCustomColorCommitted) applyStoredThemeColors(primaryThemeOriginal);
		primaryCustomColorCommitted = true;
	});
    document.getElementById('primaryCustomColorActionEdit')?.addEventListener('click', () => {
        const colors = getSavedCustomThemeColors();
        const color = Number.isInteger(pendingPrimaryCustomColorIndex) ? colors[pendingPrimaryCustomColorIndex] : null;
        const actionDlg = document.getElementById('primaryCustomColorActionDialog');
        if (actionDlg) actionDlg.open = false;
        if (color) openPrimaryCustomColorDialog(color, pendingPrimaryCustomColorIndex);
    });
    document.getElementById('primaryCustomColorActionDelete')?.addEventListener('click', () => {
        const actionDlg = document.getElementById('primaryCustomColorActionDialog');
        if (actionDlg) actionDlg.open = false;
        const deleteDlg = document.getElementById('primaryDeleteCustomColorDialog');
		openDialogOnTop(deleteDlg);
    });
    document.getElementById('primaryDeleteCustomColorCancel')?.addEventListener('click', () => {
        const dlg = document.getElementById('primaryDeleteCustomColorDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('primaryDeleteCustomColorConfirm')?.addEventListener('click', () => {
        const colors = getSavedCustomThemeColors();
        const index = pendingPrimaryCustomColorIndex;
        const deletedColor = Number.isInteger(index) ? colors[index] : null;
        if (Number.isInteger(index)) colors.splice(index, 1);
        saveCustomThemeColors(colors);
        if (deletedColor && getStoredThemeColors().primary.toLowerCase() === deletedColor.toLowerCase()) {
            const themeColors = getStoredThemeColors();
            themeColors.primary = DEFAULT_THEME_COLORS.primary;
            persistStoredThemeColors(themeColors);
            flashTheme(themeColors.primary);
        } else {
            renderPrimaryThemePalette();
        }
        pendingPrimaryCustomColorIndex = null;
        const dlg = document.getElementById('primaryDeleteCustomColorDialog');
        if (dlg) dlg.open = false;
        showSnackbar('已删除自定义颜色', 'success');
    });

    const searchHighlightColorFields = [
        ['searchMatchHighlightColorInput', 'searchMatchHighlightColorPicker', 'searchMatchHighlightColor'],
        ['searchRowHighlightColorInput', 'searchRowHighlightColorPicker', 'searchRowHighlightColor'],
        ['searchCurrentBorderColorInput', 'searchCurrentBorderColorPicker', 'searchCurrentBorderColor']
    ];
    const normalizeSearchHighlightColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '').trim())
        ? String(value).trim().toUpperCase() : fallback;
    const syncSearchHighlightColorFields = () => {
        searchHighlightColorFields.forEach(([inputId, pickerId, key]) => {
            const value = normalizeSearchHighlightColor(appSettings[key], DEFAULT_APP_SETTINGS[key]);
            const input = document.getElementById(inputId);
            const picker = document.getElementById(pickerId);
            if (input) input.value = value;
            if (picker) picker.value = value;
        });
    };
    searchHighlightColorFields.forEach(([inputId, pickerId]) => {
        const input = document.getElementById(inputId);
        const picker = document.getElementById(pickerId);
        picker?.addEventListener('input', () => { if (input) input.value = picker.value.toUpperCase(); });
        input?.addEventListener('input', () => {
            const value = String(input.value || '').trim();
            if (/^#[0-9a-f]{6}$/i.test(value) && picker) picker.value = value;
        });
    });
    document.getElementById('settingsSearchHighlightItem')?.addEventListener('click', () => {
        syncSearchHighlightColorFields();
        const dlg = document.getElementById('searchHighlightSettingsDialog');
        if (dlg) { dlg.style.zIndex = '20000'; dlg.open = true; }
    });
    document.getElementById('searchHighlightCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('searchHighlightSettingsDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('searchHighlightResetBtn')?.addEventListener('click', () => {
        saveAppSettings({
            searchMatchHighlightColor: DEFAULT_APP_SETTINGS.searchMatchHighlightColor,
            searchRowHighlightColor: DEFAULT_APP_SETTINGS.searchRowHighlightColor,
            searchCurrentBorderColor: DEFAULT_APP_SETTINGS.searchCurrentBorderColor
        });
        syncSearchHighlightColorFields();
        showSnackbar('已恢复搜索高亮默认颜色', 'success');
    });
    document.getElementById('searchHighlightSaveBtn')?.addEventListener('click', () => {
        const values = {};
        for (const [inputId, , key] of searchHighlightColorFields) {
            const value = normalizeSearchHighlightColor(document.getElementById(inputId)?.value, DEFAULT_APP_SETTINGS[key]);
            values[key] = value;
        }
        saveAppSettings(values);
        syncSearchHighlightColorFields();
        const dlg = document.getElementById('searchHighlightSettingsDialog');
        if (dlg) dlg.open = false;
        showSnackbar('已保存搜索高亮颜色', 'success');
    });
    
    renderPrimaryThemePalette();
    const bindSwitchListItemToggle = (switchEl) => {
        const item = switchEl?.closest?.('mdui-list-item');
        if (!item || !switchEl) return;
        if (item.dataset.boundToggle) return;
        item.dataset.boundToggle = '1';
        item.addEventListener('click', (e) => {
            if (e?.target?.closest?.('mdui-switch')) return;
            switchEl.checked = !switchEl.checked;
            switchEl.dispatchEvent(new Event('change', { bubbles: true }));
        });
    };
    const suggestSwitch = document.getElementById('settingsSuggestSwitch');
    suggestSwitch?.addEventListener('change', () => saveAppSettings({ suggestEnabled: !!suggestSwitch.checked }));
    bindSwitchListItemToggle(suggestSwitch);
    const inputStatsSwitch = document.getElementById('settingsInputStatsSwitch');
    inputStatsSwitch?.addEventListener('change', () => {
        saveAppSettings({ inputStatsRecordingEnabled: inputStatsSwitch.checked !== false });
        showSnackbar(inputStatsSwitch.checked ? '已开启输入统计记录' : '已停止记录 inputStats', 'info');
    });
    bindSwitchListItemToggle(inputStatsSwitch);
    const wrapSwitch = document.getElementById('settingsShortcutWrapSwitch');
    wrapSwitch?.addEventListener('change', () => saveAppSettings({ shortcutWrap: !!wrapSwitch.checked }));
    bindSwitchListItemToggle(wrapSwitch);
    const autoSwitch = document.getElementById('settingsShortcutAutoCompleteSwitch');
    autoSwitch?.addEventListener('change', () => saveAppSettings({ shortcutAutoCompleteEnabled: autoSwitch.checked !== false }));
    bindSwitchListItemToggle(autoSwitch);

    const rankSwitch = document.getElementById('settingsShortcutRankByClicksSwitch');
    rankSwitch?.addEventListener('change', () => saveAppSettings({ shortcutRankByClicks: rankSwitch.checked === true }));
    bindSwitchListItemToggle(rankSwitch);

    document.getElementById('settingsShortcutAddPositionItem')?.addEventListener('click', () => {
        const dlg = document.getElementById('shortcutAddPositionDialog');
        const group = document.getElementById('shortcutAddPositionGroup');
        if (group) group.value = appSettings.shortcutAddPosition === 'last' ? 'last' : 'first';
        if (dlg) dlg.open = true;
    });
    bindImmediateActionButton(document.getElementById('shortcutAddPositionOkBtn'), () => {
        const dlg = document.getElementById('shortcutAddPositionDialog');
        const group = document.getElementById('shortcutAddPositionGroup');
        const value = group?.value === 'last' ? 'last' : 'first';
        saveAppSettings({ shortcutAddPosition: value });
        if (dlg) dlg.open = false;
    });
    document.getElementById('shortcutAddPositionCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('shortcutAddPositionDialog');
        if (dlg) dlg.open = false;
    });

    document.getElementById('settingsShortcutAutoCompleteByFieldItem')?.addEventListener('click', () => {
        const dlg = document.getElementById('shortcutAutoCompleteByFieldDialog');
        const list = document.getElementById('shortcutAutoCompleteByFieldList');
        if (!dlg || !list) return;
        list.innerHTML = '';
        const fields = [
            'furnaceId',
            'productId',
            'cardId',
            'steelType',
            'status',
            'position',
            'actualDiameter',
            'diameter',
            'length',
            'weight',
        ];
        const map =
            appSettings.shortcutAutoCompleteByField && typeof appSettings.shortcutAutoCompleteByField === 'object'
                ? { ...appSettings.shortcutAutoCompleteByField }
                : {};
        const globalOn = appSettings.shortcutAutoCompleteEnabled !== false;
        fields.forEach((k) => {
            const item = document.createElement('mdui-list-item');
            item.setAttribute('headline', fieldLabels?.[k] || k);
            const sw = document.createElement('mdui-switch');
            sw.setAttribute('slot', 'end-icon');
            const explicit = typeof map[k] === 'boolean' ? map[k] : null;
            sw.checked = explicit ?? globalOn;
            sw.addEventListener('change', () => {
                map[k] = sw.checked === true;
                saveAppSettings({ shortcutAutoCompleteByField: map });
            });
            const reset = document.createElement('mdui-button-icon');
            reset.setAttribute('slot', 'end-icon');
            reset.setAttribute('icon', 'restart_alt');
            reset.title = '跟随全局';
            reset.addEventListener('click', (e) => {
                e.stopPropagation();
                delete map[k];
                saveAppSettings({ shortcutAutoCompleteByField: map });
                sw.checked = globalOn;
            });
            item.appendChild(reset);
            item.appendChild(sw);
            list.appendChild(item);
        });
        dlg.open = true;
    });
    document.getElementById('closeShortcutAutoCompleteByFieldBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('shortcutAutoCompleteByFieldDialog');
        if (dlg) dlg.open = false;
    });

    document.getElementById('settingsSuggestByFieldItem')?.addEventListener('click', () => {
        const dlg = document.getElementById('suggestByFieldDialog');
        const list = document.getElementById('suggestByFieldList');
        if (!dlg || !list) return;
        list.innerHTML = '';
        const fields = [
            'furnaceId',
            'productId',
            'cardId',
            'steelType',
            'status',
            'position',
            'actualDiameter',
            'diameter',
            'length',
            'weight',
        ];
        const map =
            appSettings.suggestEnabledByField && typeof appSettings.suggestEnabledByField === 'object'
                ? { ...appSettings.suggestEnabledByField }
                : {};
        const globalOn = !!appSettings.suggestEnabled;
        fields.forEach((k) => {
            const item = document.createElement('mdui-list-item');
            item.setAttribute('headline', fieldLabels?.[k] || k);
            const sw = document.createElement('mdui-switch');
            sw.setAttribute('slot', 'end-icon');
            const explicit = typeof map[k] === 'boolean' ? map[k] : null;
            sw.checked = explicit ?? globalOn;
            sw.addEventListener('change', () => {
                map[k] = sw.checked === true;
                saveAppSettings({ suggestEnabledByField: map });
            });
            const reset = document.createElement('mdui-button-icon');
            reset.setAttribute('slot', 'end-icon');
            reset.setAttribute('icon', 'restart_alt');
            reset.title = '跟随全局';
            reset.addEventListener('click', (e) => {
                e.stopPropagation();
                delete map[k];
                saveAppSettings({ suggestEnabledByField: map });
                sw.checked = globalOn;
            });
            item.appendChild(reset);
            item.appendChild(sw);
            list.appendChild(item);
        });
        dlg.open = true;
    });
    document.getElementById('closeSuggestByFieldBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('suggestByFieldDialog');
        if (dlg) dlg.open = false;
    });

    document.getElementById('settingsKeyboardModeByFieldItem')?.addEventListener('click', () => {
        const dlg = document.getElementById('keyboardModeByFieldDialog');
        const list = document.getElementById('keyboardModeByFieldList');
        if (!dlg || !list) return;
        list.innerHTML = '';
        const map = appSettings.keyboardModeByField && typeof appSettings.keyboardModeByField === 'object'
            ? { ...appSettings.keyboardModeByField } : {};
        inputFieldOrder.forEach((fieldId) => {
            const row = document.createElement('div');
            row.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,260px);gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-color);';
            const label = document.createElement('div');
            label.textContent = fieldLabels[fieldId] || fieldId;
            label.style.fontWeight = '500';
            const select = document.createElement('mdui-select');
            select.setAttribute('variant', 'outlined');
            select.setAttribute('label', '键盘模式');
            select.innerHTML = '<mdui-menu-item value="default">默认</mdui-menu-item><mdui-menu-item value="virtual">虚拟键盘</mdui-menu-item><mdui-menu-item value="system">系统键盘</mdui-menu-item>';
            select.value = map[fieldId] === 'virtual' || map[fieldId] === 'system' ? map[fieldId] : 'default';
            select.addEventListener('change', () => {
                const value = select.value;
                if (value === 'virtual' || value === 'system') map[fieldId] = value;
                else delete map[fieldId];
                saveAppSettings({ keyboardModeByField: map });
            });
            row.appendChild(label);
            row.appendChild(select);
            list.appendChild(row);
        });
        dlg.open = true;
    });
    document.getElementById('closeKeyboardModeByFieldBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('keyboardModeByFieldDialog');
        if (dlg) dlg.open = false;
    });

    const desktopModeSwitch = document.getElementById('settingsDesktopModeSwitch');
    desktopModeSwitch?.addEventListener('change', () => {
        saveAppSettings({ desktopModeEnabled: desktopModeSwitch.checked === true });
        if (!desktopModeSwitch.checked) {
            setDesktopShortcutPanelVisible(false);
        } else if (currentInput && !isVirtualKeyboardConfigured(currentInput.id)) {
            showDesktopShortcutPanel(currentInput);
        }
        showSnackbar(desktopModeSwitch.checked ? '已开启桌面模式' : '已关闭桌面模式', 'info');
    });
    bindSwitchListItemToggle(desktopModeSwitch);

    const animSwitch = document.getElementById('settingsAnimationsSwitch');
    animSwitch?.addEventListener('change', () => saveAppSettings({ animationsEnabled: !!animSwitch.checked }));
    bindSwitchListItemToggle(animSwitch);
    const imageKeepTransformSwitch = document.getElementById('settingsImageKeepTransformSwitch');
    imageKeepTransformSwitch?.addEventListener('change', () => saveAppSettings({ imagePreviewKeepTransform: !!imageKeepTransformSwitch.checked }));
    bindSwitchListItemToggle(imageKeepTransformSwitch);
    const historyStorageSwitch = document.getElementById('settingsHistoryStorageSwitch');
    historyStorageSwitch?.addEventListener('change', () => {
        const enabled = !!historyStorageSwitch.checked;
        saveAppSettings({ historyStorageEnabled: enabled });
        if (!enabled) {
            clearOperationHistoryStorage();
            showSnackbar('已关闭历史记录存储', 'info');
        } else {
            saveOperationHistory();
            showSnackbar('已开启历史记录存储', 'success');
        }
    });
    bindSwitchListItemToggle(historyStorageSwitch);
    const undoRedoEnabledSwitch = document.getElementById('settingsUndoRedoEnabledSwitch');
    undoRedoEnabledSwitch?.addEventListener('change', () => {
        const enabled = !!undoRedoEnabledSwitch.checked;
        saveAppSettings({ undoRedoEnabled: enabled });
        if (!enabled) {
            operationHistory = [];
            historyCursor = 0;
            window.__rsdbPendingOp = null;
            saveOperationHistory();
            showSnackbar('已关闭撤销/重做记录', 'info');
        } else {
            showSnackbar('已开启撤销/重做记录', 'success');
        }
    });
    bindSwitchListItemToggle(undoRedoEnabledSwitch);
    document.addEventListener('pointerdown', (event) => {
        const insideEditingSurface = event.target.closest?.('input, textarea, [contenteditable="true"], #virtualKeyboard, #shortcutToolbarWrap, #virtualCursor, #virtualCursorHandle');
        if (insideEditingSurface) return;
        const previewState = imagePreviewEditState;
        if (previewState?.active && previewState.previewInput && event.target.closest?.('.image-preview-overlay') === previewState.overlay) {
            currentInput = previewState.previewInput;
            return;
        }
        requestAnimationFrame(() => {
            const active = document.activeElement;
            if (!active?.matches?.('input, textarea, [contenteditable="true"]')) {
                currentInput = null;
                desktopShortcutPanelActive = false;
                syncShortcutToolbarVisibility();
            }
        });
    }, true);
    const shortcutToolbar = document.getElementById('shortcutToolbar');
    shortcutToolbar?.addEventListener('click', (event) => {
        if (event.target.closest('[data-toolbar-control]')) event.stopPropagation();
    });
    dom.shortcutQuickAddBtn?.addEventListener('click', () => {
    if (!currentShortcutFieldKey) {
        showSnackbar('请先选择一个字段', 'warning');
        return;
    }

    const openAdd = () => {
        openShortcutAddDialog(currentShortcutFieldKey, (currentInput?.value || '').toString());
    };

    if (shortcutEditMode) {
        setShortcutEditMode(false);
        // 等待编辑模式完全退出（包含 generateVirtualKeyboard 的重绘）
        setTimeout(openAdd, 80);  // 80ms 足够大多数设备刷新 UI
    } else {
        openAdd();
    }
});
    document.getElementById('shortcutClearInputBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        closeInputKeyboard();
    });
    dom.shortcutEditToggleBtn?.addEventListener('click', () => {
        if (!currentShortcutFieldKey) return;
        setShortcutEditMode(!shortcutEditMode);
        showSnackbar(shortcutEditMode ? '编辑模式：拖动排序，点击删除移除；点✔保存或✖取消' : '已保存并退出编辑模式', 'info');
    });
    document.getElementById('shortcutEditCancelBtn')?.addEventListener('click', () => {
        if (!currentShortcutFieldKey) return;
        cancelShortcutEditMode();
        showSnackbar('已取消编辑（未保存）', 'info');
    });
    dom.shortcutPrevInputBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (imagePreviewEditState?.active) switchImagePreviewField(-1);
        else moveToAdjacentDataInput(-1);
    });
    dom.shortcutNextInputBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleNextInput();
    });
    const alwaysCompressSwitch = document.getElementById('settingsAlwaysCompressSwitch');
    const alwaysForceSwitch = document.getElementById('settingsAlwaysForceSwitch');
    alwaysCompressSwitch?.addEventListener('change', () => {
        if (alwaysCompressSwitch.checked) {
            if (alwaysForceSwitch) alwaysForceSwitch.checked = false;
            saveAppSettings({ imageCompressPolicy: 'compress' });
        } else {
            const next = alwaysForceSwitch?.checked ? 'force' : 'ask';
            saveAppSettings({ imageCompressPolicy: next });
        }
    });
    alwaysForceSwitch?.addEventListener('change', () => {
        if (alwaysForceSwitch.checked) {
            if (alwaysCompressSwitch) alwaysCompressSwitch.checked = false;
            saveAppSettings({ imageCompressPolicy: 'force' });
        } else {
            const next = alwaysCompressSwitch?.checked ? 'compress' : 'ask';
            saveAppSettings({ imageCompressPolicy: next });
        }
    });
    bindSwitchListItemToggle(alwaysCompressSwitch);
    bindSwitchListItemToggle(alwaysForceSwitch);

    document.getElementById('suggestThresholdCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('suggestThresholdDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('suggestThresholdOkBtn')?.addEventListener('click', () => {
        const input = document.getElementById('suggestThresholdInput');
        const val = Math.max(1, Math.min(99, Number(input?.value) || 5));
        saveAppSettings({ suggestThreshold: val });
        const dlg = document.getElementById('suggestThresholdDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('shortcutRowsCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('shortcutRowsDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('shortcutRowsOkBtn')?.addEventListener('click', () => {
        const group = document.getElementById('shortcutRowsGroup');
        const base = Math.max(1, Math.min(3, Number(group?.value) || 2));
        const read = (id) => Math.max(1, Math.min(3, Number(document.getElementById(id)?.value) || base));
        const rowsByField = {
            steelType: read('shortcutRowsGroup_steelType'),
            productId: read('shortcutRowsGroup_productId'),
            cardId: read('shortcutRowsGroup_cardId'),
            furnaceId: read('shortcutRowsGroup_furnaceId'),
            status: read('shortcutRowsGroup_status'),
            position: read('shortcutRowsGroup_position')
        };
        saveAppSettings({ shortcutRows: base, shortcutRowsByField: rowsByField });
        const dlg = document.getElementById('shortcutRowsDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('dialogPositionCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('dialogPositionDialog');
        if (dlg) dlg.open = false;
    });
    bindImmediateActionButton(document.getElementById('dialogPositionOkBtn'), () => {
        const top = document.getElementById('dialogPosTop')?.checked;
        const center = document.getElementById('dialogPosCenter')?.checked;
        const positions = [];
        if (top) positions.push('top');
        if (center) positions.push('center');
        saveAppSettings({ dialogPositions: positions.length ? positions : ['center'] });
        const dlg = document.getElementById('dialogPositionDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('keyboardSizeCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('keyboardSizeDialog');
        if (dlg) dlg.open = false;
    });
    const vkHeightSlider = document.getElementById('vkHeightSlider');
    const vkBottomSlider = document.getElementById('vkBottomOffsetSlider');
    const vkHeightInput = document.getElementById('vkHeightInput');
    const vkBottomInput = document.getElementById('vkBottomOffsetInput');
    vkHeightSlider?.addEventListener('input', () => { if (vkHeightInput) vkHeightInput.value = String(vkHeightSlider.value); });
    vkBottomSlider?.addEventListener('input', () => { if (vkBottomInput) vkBottomInput.value = String(vkBottomSlider.value); });
    vkHeightInput?.addEventListener('input', () => {
        const n = Number(vkHeightInput.value);
        if (Number.isFinite(n) && vkHeightSlider) vkHeightSlider.value = String(Math.max(120, Math.min(1200, Math.round(n))));
    });
    vkBottomInput?.addEventListener('input', () => {
        const n = Number(vkBottomInput.value);
        if (Number.isFinite(n) && vkBottomSlider) vkBottomSlider.value = String(Math.max(0, Math.min(400, Math.round(n))));
    });
    bindImmediateActionButton(document.getElementById('keyboardSizeOkBtn'), () => {
        const hRaw = vkHeightInput?.value;
        const bRaw = vkBottomInput?.value;
        const height = hRaw === '' || hRaw == null ? null : Math.max(120, Math.min(1200, Number(hRaw)));
        const bottom = bRaw === '' || bRaw == null ? 0 : Math.max(0, Math.min(400, Number(bRaw)));
        saveAppSettings({
            virtualKeyboardHeight: Number.isFinite(height) ? height : null,
            virtualKeyboardBottomOffset: Number.isFinite(bottom) ? bottom : 0
        });
        const dlg = document.getElementById('keyboardSizeDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('tableViewCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('tableViewDialog');
        if (dlg) dlg.open = false;
    });
    bindImmediateActionButton(document.getElementById('tableViewOkBtn'), () => {
        const scale = Math.max(0.25, Math.min(2, Number(document.getElementById('tableScaleDefaultInput')?.value) || 0.5));
        const width = Math.max(48, Math.min(320, Number(document.getElementById('tableCellWidthInput')?.value) || 80));
        const height = Math.max(30, Math.min(160, Number(document.getElementById('tableCellHeightInput')?.value) || 48));
        const fontSize = Math.max(10, Math.min(40, Number(document.getElementById('tableCellFontSizeInput')?.value) || 16));
        const pageSize = Math.max(10, Math.min(200, Number(document.getElementById('tablePageSizeInput')?.value) || 50));
        const dataFormFieldGap = Math.max(0, Math.min(32, Number(document.getElementById('dataFormFieldGapInput')?.value) || 8));
        const dataFormPadding = Math.max(0, Math.min(40, Number(document.getElementById('dataFormPaddingInput')?.value) || 12));
        saveAppSettings({
            tableScaleDefault: scale,
            tableCellWidth: width,
            tableCellHeight: height,
            tableCellFontSize: fontSize,
            tablePageSize: pageSize,
            dataFormFieldGap,
            dataFormPadding
        });
        if (ZoomManager) {
            ZoomManager.currentScale = scale;
            ZoomManager.onTableUpdate();
        }
        updateTable();
        const dlg = document.getElementById('tableViewDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('cellStyleResetBtn')?.addEventListener('click', () => {
        const defaults = getDefaultCellStyle();
        const values = {
            cellStyleFontNameInput: '',
            cellStyleFontSizeInput: defaults.fontSize,
            cellStyleTextColorInput: defaults.color,
            cellStyleBgColorInput: defaults.backgroundColor,
            cellStyleNumberFormatInput: defaults.numFmt
        };
        Object.entries(values).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.value = String(value); });
        const align = document.getElementById('cellStyleAlignInput');
        if (align) align.value = defaults.horizontal;
        updateCellAlignPickerUI();
        ['cellStyleBoldInput', 'cellStyleItalicInput', 'cellStyleUnderlineInput', 'cellStyleWrapInput'].forEach(id => {
            const el = document.getElementById(id); if (el) el.checked = false;
        });
        previewCurrentCellStyle();
        recordQuickEditState();
        recordDataEditState();
        showSnackbar('格式已重置，保存后生效', 'info');
    });
    document.getElementById('cellStyleImportFontBtn')?.addEventListener('click', () => {
        const input = document.getElementById('cellStyleFontFileInput');
        if (input) { input.value = ''; input.click(); }
    });
    document.getElementById('cellStyleFontFileInput')?.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const fontName = `RSDB_${file.name.replace(/\.[^.]+$/, '').replace(/[^\w\u4e00-\u9fff-]+/g, '_')}_${Date.now().toString(36)}`;
        try {
            const data = await file.arrayBuffer();
            const face = new FontFace(fontName, data);
            await face.load();
            document.fonts.add(face);
            await saveImportedFont(fontName, data);
            const importedFonts = Array.from(new Set([...(appSettings.importedFonts || []), fontName]));
            saveAppSettings({ importedFonts });
            ensureImportedFontOptions();
            const select = document.getElementById('cellStyleFontNameInput');
            if (select) select.value = fontName;
            previewCurrentCellStyle();
            recordQuickEditState();
            recordDataEditState();
            showSnackbar(`已导入字体：${file.name}`, 'success');
        } catch (error) {
            console.error(error);
            showSnackbar('字体导入失败，请选择 TTF、OTF、WOFF 或 WOFF2 文件', 'error');
        }
    });
    const previewCurrentCellStyle = () => {
        const input = document.getElementById('quickEditInput');
        if (!input) return;
        const fontName = document.getElementById('cellStyleFontNameInput')?.value || 'Google Sans Text';
        const fontSize = Number(document.getElementById('cellStyleFontSizeInput')?.value);
        const color = document.getElementById('cellStyleTextColorInput')?.value || '#212121';
        const bg = document.getElementById('cellStyleBgColorInput')?.value || '#FFFFFF';
        const selectionStart = Number(input.selectionStart);
        const selectionEnd = Number(input.selectionEnd);
        if (fontName) input.style.setProperty('font-family', fontName, 'important');
        else input.style.removeProperty('font-family');
        input.style.setProperty('font-size', Number.isFinite(fontSize) && fontSize > 0 ? `${fontSize}px` : `${Number(appSettings.tableCellFontSize) || 16}px`, 'important');
        input.style.setProperty('color', normalizeStyleColor(color, '#212121'), 'important');
        input.style.setProperty('background-color', normalizeStyleColor(bg, '#FFFFFF'), 'important');
        input.style.setProperty('font-weight', document.getElementById('cellStyleBoldInput')?.checked ? 'bold' : 'normal', 'important');
        input.style.setProperty('font-style', document.getElementById('cellStyleItalicInput')?.checked ? 'italic' : 'normal', 'important');
        input.style.setProperty('text-decoration', document.getElementById('cellStyleUnderlineInput')?.checked ? 'underline' : 'none', 'important');
        const horizontal = document.getElementById('cellStyleAlignInput')?.value;
        input.style.setProperty('text-align', horizontal && horizontal !== 'general' ? horizontal : 'left', 'important');
        if (Number.isFinite(selectionStart) && Number.isFinite(selectionEnd)) {
            try { input.setSelectionRange(selectionStart, selectionEnd); } catch (error) {}
        }
        if (dom.cellStyleTextColorPreview) dom.cellStyleTextColorPreview.style.backgroundColor = normalizeStyleColor(color, '#212121');
        if (dom.cellStyleBgColorPreview) dom.cellStyleBgColorPreview.style.backgroundColor = normalizeStyleColor(bg, '#FFFFFF');
        if (dom.quickEditInputPreview) dom.quickEditInputPreview.style.backgroundColor = normalizeStyleColor(bg, '#FFFFFF');
        if (dataCellStyleContext?.fieldId) {
            applyDataEditFieldStylePreview(dataCellStyleContext.fieldId, window.getPendingCellStyleObject?.() || {});
        }
        requestAnimationFrame(() => {
            updateVirtualCursor();
            requestAnimationFrame(updateVirtualCursor);
        });
    };
    window.previewCurrentCellStyle = previewCurrentCellStyle;
    document.querySelectorAll('#quickEditStylePanel mdui-text-field, #quickEditStylePanel mdui-select, #quickEditStylePanel mdui-checkbox, #quickEditStylePanel .cell-font-picker-trigger').forEach(el => {
        el.addEventListener('input', () => { previewCurrentCellStyle(); recordQuickEditState(); recordDataEditState(); });
        el.addEventListener('change', () => { previewCurrentCellStyle(); recordQuickEditState(); recordDataEditState(); });
    });
    dom.quickEditInput?.addEventListener('beforeinput', () => {
        if (quickEditHistoryApplying || quickEditHistory.composing) return;
        quickEditHistory.pendingBeforeInput = getQuickEditState();
    });
    dom.quickEditInput?.addEventListener('input', () => {
        if (quickEditHistoryApplying || quickEditHistory.composing) return;
        const before = quickEditHistory.pendingBeforeInput;
        quickEditHistory.pendingBeforeInput = null;
        recordQuickEditState(before);
    });
    dom.quickEditInput?.addEventListener('compositionstart', () => {
        if (quickEditHistoryApplying) return;
        quickEditHistory.composing = true;
        quickEditHistory.compositionStart = getQuickEditState();
        quickEditHistory.pendingBeforeInput = null;
    });
    dom.quickEditInput?.addEventListener('compositionend', () => finalizeQuickEditComposition());
    dom.quickEditInput?.addEventListener('blur', () => {
        if (quickEditHistory.composing) finalizeQuickEditComposition();
        else quickEditHistory.pendingBeforeInput = null;
    });
    dom.quickEditInput?.addEventListener('keydown', (event) => {
        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
        event.preventDefault();
        if (event.shiftKey) quickEditRedo();
        else quickEditUndo();
    });
    const cellFontInput = document.getElementById('cellStyleFontNameInput');
    if (cellFontInput && !cellFontInput.dataset.fontPickerBound) {
        cellFontInput.dataset.fontPickerBound = 'true';
        let ignoreFontClickUntil = 0;
        cellFontInput.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
            ignoreFontClickUntil = Date.now() + 800;
            if (event.cancelable) event.preventDefault();
            event.stopPropagation();
        }, { passive: false });
        cellFontInput.addEventListener('pointerup', (event) => {
            if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
            if (event.cancelable) event.preventDefault();
            event.stopPropagation();
            requestAnimationFrame(() => toggleCellFontPicker(true));
        }, { passive: false });
        cellFontInput.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (Date.now() < ignoreFontClickUntil) return;
            toggleCellFontPicker(true);
        });
    }
    document.getElementById('cellFontSearchInput')?.addEventListener('input', (event) => {
        renderCellFontList(event.target.value || '');
    });
    document.getElementById('cellFontSearchInput')?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') toggleCellFontPicker(false);
    });
    dom.closeCellFontPicker?.addEventListener('click', () => { if (dom.cellFontPickerDialog) dom.cellFontPickerDialog.open = false; });
    dom.closeCellAlignPicker?.addEventListener('click', () => {
        if (dom.cellAlignPickerDialog) dom.cellAlignPickerDialog.open = false;
    });
	dom.cellFontPickerDialog?.addEventListener('close', restoreDataCellStyleAfterPicker);
	dom.cellAlignPickerDialog?.addEventListener('close', restoreDataCellStyleAfterPicker);
	dom.cellColorPaletteDialog?.addEventListener('close', restoreDataCellStyleAfterPicker);
    dom.cellStyleTextColorPreview?.addEventListener('click', () => openCellColorPalette('color'));
    dom.cellStyleBgColorPreview?.addEventListener('click', () => openCellColorPalette('backgroundColor'));
    dom.closeCellColorPalette?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeCellColorPaletteDialog();
    });
    dom.applyCustomCellColorBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyColorToActiveTarget(dom.customCellColorInput?.value || '#00796b');
    });
    dom.customCellColorInput?.addEventListener('change', () => applyColorToActiveTarget(dom.customCellColorInput?.value || '#00796b'));
    dom.quickEditUndoBtn?.addEventListener('click', quickEditUndo);
    dom.quickEditRedoBtn?.addEventListener('click', quickEditRedo);
	dom.dataEditUndoBtn?.addEventListener('click', dataEditUndo);
	dom.dataEditRedoBtn?.addEventListener('click', dataEditRedo);
    dom.dataCellStyleUndoBtn?.addEventListener('click', quickEditUndo);
    dom.dataCellStyleRedoBtn?.addEventListener('click', quickEditRedo);
    dom.closeDataCellStyleDialog?.addEventListener('click', () => finishDataCellStyleDialog({ commit: true }));
    dom.dataCellStyleDialog?.addEventListener('close', () => {
		if (!dataCellStyleDialogClosing && dataCellStyleContext) {
		    if (cellStylePickerReturnContext || isCellStyleChildPickerOpen()) return;
		    requestAnimationFrame(() => {
		        if (!dataCellStyleDialogClosing && dataCellStyleContext && !isCellStyleChildPickerOpen()) {
		            ensureDataCellStylePanelMounted();
		            dom.dataCellStyleDialog.open = true;
		        }
		    });
		    return;
		}
		dataCellStyleDialogClosing = false;
        if (imagePreviewEditState?.active && imagePreviewEditState.previewInput?.hasAttribute('readonly')) {
            currentInput = imagePreviewEditState.previewInput;
            updateKeyboardForInput(currentInput, imagePreviewEditState.fieldId);
            if (imagePreviewEditState.keyboardWasVisible) {
                showVirtualKeyboard();
                currentInput.focus({ preventScroll: true });
                resetCursorToEnd(currentInput);
            }
            updateVirtualCursor();
        }
    });
    function canonicalCellStyle(style) {
        const defaults = getDefaultCellStyle();
        const source = style && typeof style === 'object' ? style : {};
        const result = {};
        const fontName = String(source.fontName || '').trim();
        const fontSize = Number(source.fontSize);
        const color = normalizeStyleColor(source.color, defaults.color);
        const backgroundColor = normalizeStyleColor(source.backgroundColor, defaults.backgroundColor);
        const horizontal = source.horizontal || source.align || 'general';
        const numFmt = String(source.numFmt || source.numberFormat || '').trim();
        if (fontName && fontName !== defaults.fontName) result.fontName = fontName;
        if (Number.isFinite(fontSize) && fontSize > 0 && Math.round(fontSize) !== Number(defaults.fontSize)) result.fontSize = Math.round(fontSize);
        if (color !== normalizeStyleColor(defaults.color)) result.color = color;
        if (backgroundColor !== normalizeStyleColor(defaults.backgroundColor)) result.backgroundColor = backgroundColor;
        if (horizontal && horizontal !== defaults.horizontal) result.horizontal = horizontal;
        if (numFmt && numFmt.toLowerCase() !== String(defaults.numFmt).toLowerCase()) result.numFmt = numFmt;
        if (source.bold || source.fontWeight === 'bold') result.bold = true;
        if (source.italic) result.italic = true;
        if (source.underline) result.underline = true;
        if (source.wrapText) result.wrapText = true;
        return result;
    }

    function getPendingCellStyleObject() {
        const fontName = (document.getElementById('cellStyleFontNameInput')?.value || '').trim();
        const fontSize = Number(document.getElementById('cellStyleFontSizeInput')?.value);
        const color = (document.getElementById('cellStyleTextColorInput')?.value || '').trim();
        const bgColor = (document.getElementById('cellStyleBgColorInput')?.value || '').trim();
        const horizontal = document.getElementById('cellStyleAlignInput')?.value || 'general';
        const numFmt = (document.getElementById('cellStyleNumberFormatInput')?.value || '').trim();
        const defaults = getDefaultCellStyle();
        const validColor = (v) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v);
        return canonicalCellStyle({
            fontName,
            fontSize,
            color: validColor(color) ? color : defaults.color,
            backgroundColor: validColor(bgColor) ? bgColor : defaults.backgroundColor,
            horizontal,
            numFmt,
            bold: document.getElementById('cellStyleBoldInput')?.checked,
            italic: document.getElementById('cellStyleItalicInput')?.checked,
            underline: document.getElementById('cellStyleUnderlineInput')?.checked,
            wrapText: document.getElementById('cellStyleWrapInput')?.checked
        });
    }

    function areCellStylesEqual(left, right) {
        return JSON.stringify(canonicalCellStyle(left)) === JSON.stringify(canonicalCellStyle(right));
    }

    window.canonicalCellStyle = canonicalCellStyle;
    window.getPendingCellStyleObject = getPendingCellStyleObject;
    window.areCellStylesEqual = areCellStylesEqual;

    window.saveCurrentCellStyle = function(explicitTargets = null) {
        const target = window.__rsdbEditingCell;
        if (!target) return false;
        const styleObj = getPendingCellStyleObject();
        const targets = Array.isArray(explicitTargets) && explicitTargets.length
            ? explicitTargets
            : (isCellMultiSelectMode && selectedCells.size
                ? getCellSelectionKeys().filter(item => item.field !== 'seq')
                : [target]);
        let applied = 0;
        targets.forEach(item => {
            const row = Number.isInteger(item?.row) ? item.row : item?.index;
            if (!Number.isInteger(row) || !item?.field || !tableData[row]) return;
            setCellFormat(row, item.field, { ...styleObj });
            applied++;
        });
        return applied > 0;
    };
    document.getElementById('closeImageCompressSettingsBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('imageCompressSettingsDialog');
        if (dlg) dlg.open = false;
    });
    bindImmediateActionButton(document.getElementById('saveImageCompressSettingsBtn'), () => {
        const policyGroup = document.getElementById('imageCompressPolicyGroup');
        const useW = document.getElementById('imageCompressUseMaxWidth')?.checked !== false;
        const useH = document.getElementById('imageCompressUseMaxHeight')?.checked !== false;
        const thresholdMBRaw = Number(document.getElementById('largeImageThresholdMB')?.value);
        const thresholdMB = Math.max(0.5, Math.min(50, Number.isFinite(thresholdMBRaw) ? thresholdMBRaw : 5));
        const maxWidth = Math.max(200, Math.min(6000, Number(document.getElementById('imageCompressMaxWidth')?.value) || 1280));
        const maxHeight = Math.max(200, Math.min(6000, Number(document.getElementById('imageCompressMaxHeight')?.value) || 1280));
        const qualityRaw = Number(document.getElementById('imageCompressQuality')?.value);
        const quality = Math.max(0.1, Math.min(1, Number.isFinite(qualityRaw) ? qualityRaw : 0.8));
        const policy = ['ask', 'compress', 'force'].includes(policyGroup?.value) ? policyGroup.value : 'ask';
        saveAppSettings({
            imageCompressPolicy: policy,
            imageCompressUseMaxWidth: useW,
            imageCompressUseMaxHeight: useH,
            largeImageThresholdMB: thresholdMB,
            imageCompressMaxWidth: maxWidth,
            imageCompressMaxHeight: maxHeight,
            imageCompressQuality: quality
        });
        const dlg = document.getElementById('imageCompressSettingsDialog');
        if (dlg) dlg.open = false;
    });

    document.getElementById('exportChoiceCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('exportChoiceDialog');
        if (dlg) dlg.open = false;
    });
    document.getElementById('exportChoiceOkBtn')?.addEventListener('click', async () => {
        const group = document.getElementById('exportTypeGroup');
        const type = group?.value || 'excel_images';
		const exportBaseName = getExportBaseName(document.getElementById('exportFileNameInput')?.value || '');
		if (!exportBaseName) {
		    showSnackbar('请输入导出文件名称', 'warning');
		    return;
		}
        const dlg = document.getElementById('exportChoiceDialog');
		const confirmButton = document.getElementById('exportChoiceOkBtn');
		if (confirmButton) confirmButton.disabled = true;
		if (dlg) dlg.open = false;
		try {
		    if (type === 'zip_images') await exportToZipWithImages(exportBaseName);
		    else await exportToExcel(exportBaseName);
		} finally {
		    if (confirmButton) confirmButton.disabled = false;
		}
    });

    const moveRowDlg = document.getElementById('moveRowDialog');
    const closeMoveRowDlg = () => { if (moveRowDlg) moveRowDlg.open = false; moveRowDialogState = null; };
    document.getElementById('closeMoveRowDialogBtn')?.addEventListener('click', closeMoveRowDlg);
    document.getElementById('moveRowCancelBtn')?.addEventListener('click', closeMoveRowDlg);
    document.getElementById('moveRowSearchInput')?.addEventListener('input', (e) => {
        if (!moveRowDialogState) return;
        moveRowDialogState.query = e.target.value || '';
        moveRowDialogState.page = 1;
        renderMoveRowDialog();
    });
    document.getElementById('moveRowPrevBtn')?.addEventListener('click', () => {
        if (!moveRowDialogState) return;
        moveRowDialogState.page = Math.max(1, moveRowDialogState.page - 1);
        renderMoveRowDialog();
    });
    document.getElementById('moveRowNextBtn')?.addEventListener('click', () => {
        if (!moveRowDialogState) return;
        moveRowDialogState.page = moveRowDialogState.page + 1;
        renderMoveRowDialog();
    });
    const moveRowPageInput = document.getElementById('moveRowPageInput');
    const applyMoveRowPage = () => {
        if (!moveRowDialogState) return;
        const raw = Number(moveRowPageInput?.value);
        if (!Number.isFinite(raw)) return;
        moveRowDialogState.page = Math.max(1, Math.round(raw));
        renderMoveRowDialog();
    };
    moveRowPageInput?.addEventListener('change', applyMoveRowPage);
    moveRowPageInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyMoveRowPage(); });
    document.getElementById('moveRowOkBtn')?.addEventListener('click', () => {
        if (!moveRowDialogState) return;
        const sourceIndexes = Array.from(moveRowDialogState.sourceIndexes || []).sort((a, b) => a - b);
        const target = moveRowDialogState.selectedIndex;
        if (!sourceIndexes.length || target == null || target < 0) {
            showSnackbar('请选择有效的目标行', 'warning');
            return;
        }
        if (sourceIndexes.includes(target)) {
            highlightAndScrollToRow(target);
            showSnackbar('当前项目已在该位置，未移动', 'info');
            closeMoveRowDlg();
            return;
        }
        beginOperation('move_rows', `移动 ${sourceIndexes.length} 个项目`, { sourceIndexes, target });
        const selectedSet = new Set(sourceIndexes);
        const moved = sourceIndexes.map(index => tableData[index]);
        const remaining = tableData.filter((_, index) => !selectedSet.has(index));
        const targetInRemaining = remaining.indexOf(tableData[target]);
        const placement = document.getElementById('moveRowPlacementGroup')?.value === 'after' ? 'after' : 'before';
        const insertIndex = targetInRemaining + (placement === 'after' ? 1 : 0);
        tableData = [...remaining.slice(0, insertIndex), ...moved, ...remaining.slice(insertIndex)];
        saveDataToIndexedDB();
        currentPage = Math.floor(insertIndex / PAGE_SIZE) + 1;
        updateTable();
        commitOperation();
        highlightAndScrollToRow(insertIndex);
        showSnackbar(`已移动 ${moved.length} 个项目`, 'success');
        closeMoveRowDlg();
    });

    document.getElementById('shortcutActionCloseBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('shortcutActionDialog');
        if (dlg) dlg.open = false;
        shortcutActionContext = null;
        showVirtualKeyboard();
    });
    document.getElementById('shortcutActionAddBtn')?.addEventListener('click', () => {
        if (!shortcutActionContext?.fieldKey) return;
        openShortcutAddDialog(shortcutActionContext.fieldKey, '');
    });
    document.getElementById('shortcutSaveBtn')?.addEventListener('click', () => {
        if (!shortcutActionContext) return;
        const { fieldKey, index } = shortcutActionContext;
        const templates = getTemplatesByField(fieldKey);
        if (!templates) return;
        const input = document.getElementById('shortcutEditValue');
        const value = (input?.value || '').trim();
        if (!value) return;
        beginOperation('shortcut_edit', '编辑快捷短语：' + (fieldLabels[fieldKey] || fieldKey));
        templates[index] = value;
        KeyboardConfigManager.save();
        commitOperation();
        const dlg = document.getElementById('shortcutActionDialog');
        if (dlg) dlg.open = false;
        shortcutActionContext = null;
        showVirtualKeyboard();
        showSnackbar('已保存快捷短语', 'success');
    });
    document.getElementById('shortcutDeleteBtn')?.addEventListener('click', () => {
        if (!shortcutActionContext) return;
        const { fieldKey, index } = shortcutActionContext;
        const templates = getTemplatesByField(fieldKey);
        if (!templates) return;
        const oldVal = templates[index];
        beginOperation('shortcut_delete', '删除快捷短语：' + (fieldLabels[fieldKey] || fieldKey) + (oldVal ? `（${oldVal}）` : ''));
        templates.splice(index, 1);
        KeyboardConfigManager.save();
        commitOperation();
        const dlg = document.getElementById('shortcutActionDialog');
        if (dlg) dlg.open = false;
        shortcutActionContext = null;
        showVirtualKeyboard();
        showSnackbar('已删除快捷短语', 'success');
    });
    document.getElementById('shortcutMoveBeforeBtn')?.addEventListener('click', () => {
        if (!shortcutActionContext) return;
        const { fieldKey, index } = shortcutActionContext;
        const templates = getTemplatesByField(fieldKey);
        if (!templates) return;
        const moveSelect = document.getElementById('shortcutMoveTarget');
        const target = Number(moveSelect?.value);
        if (!Number.isFinite(target)) return;
        if (target === index) return;
        beginOperation('shortcut_move', '移动快捷短语：' + (fieldLabels[fieldKey] || fieldKey));
        const item = templates.splice(index, 1)[0];
        const insertIndex = target > index ? target - 1 : target;
        templates.splice(insertIndex, 0, item);
        KeyboardConfigManager.save();
        commitOperation();
        openShortcutActionDialog(fieldKey, insertIndex);
        showSnackbar('已移动快捷短语', 'success');
    });
    document.getElementById('shortcutMoveAfterBtn')?.addEventListener('click', () => {
        if (!shortcutActionContext) return;
        const { fieldKey, index } = shortcutActionContext;
        const templates = getTemplatesByField(fieldKey);
        if (!templates) return;
        const moveSelect = document.getElementById('shortcutMoveTarget');
        const target = Number(moveSelect?.value);
        if (!Number.isFinite(target)) return;
        if (target === index) return;
        beginOperation('shortcut_move', '移动快捷短语：' + (fieldLabels[fieldKey] || fieldKey));
        const item = templates.splice(index, 1)[0];
        const insertIndex = target > index ? target : target + 1;
        templates.splice(Math.min(insertIndex, templates.length), 0, item);
        KeyboardConfigManager.save();
        commitOperation();
        const newIndex = templates.indexOf(item);
        openShortcutActionDialog(fieldKey, newIndex);
        showSnackbar('已移动快捷短语', 'success');
    });

    document.getElementById('shortcutAddCancelBtn')?.addEventListener('click', () => {
        const dlg = document.getElementById('shortcutAddDialog');
        if (dlg) dlg.open = false;
    });

    const shortcutAddDlg = document.getElementById('shortcutAddDialog');
    if (shortcutAddDlg && !shortcutAddDlg.dataset.rsdbRestoreBound) {
        shortcutAddDlg.dataset.rsdbRestoreBound = '1';
        shortcutAddDlg.addEventListener('close', () => {
            const dd = document.getElementById('shortcutAddAutocompleteDropdown');
            if (dd) dd.open = false;
            const dup = document.getElementById('duplicateShortcutConfirmDialog');
            if (dup?.open) return;
            const prev = window.__rsdbShortcutAddPrevInput || null;
            window.__rsdbShortcutAddPrevInput = null;
            if (!prev) return;
            currentInput = prev;
            if (prev.id === 'remarks') {
                setVirtualKeyboardVisible(false);
                prev.focus?.();
                return;
            }
            prev.setAttribute('readonly', 'true');
            prev.classList.add('readonly-input');
            updateKeyboardForInput(prev);
            showVirtualKeyboard();
            prev.focus?.();
            resetCursorToEnd(prev);
            refreshShortcutKeysForCurrentInput();
            setTimeout(updateVirtualCursor, 0);
        });
    }
    document.getElementById('shortcutAddValue')?.addEventListener('input', () => {
        refreshShortcutAddAutocomplete();
    });
    document.getElementById('shortcutAddValue')?.addEventListener('focus', () => {
        refreshShortcutAddAutocomplete();
    });
    bindImmediateActionButton(document.getElementById('shortcutAddOkBtn'), () => {
        if (!shortcutAddContext?.fieldKey) return;
        const fieldKey = shortcutAddContext.fieldKey;
        const templates = getTemplatesByField(fieldKey);
        if (!templates) return;
        const input = document.getElementById('shortcutAddValue');
        const value = (input?.value || '').trim();
        if (!value) return;
        const existedIndex = templates.findIndex(v => (v || '').trim() === value);
        if (existedIndex >= 0) {
            duplicateShortcutContext = { fieldKey, value, existedIndex };
            const addDlg = document.getElementById('shortcutAddDialog');
            if (addDlg) addDlg.open = false;
            const dlg = document.getElementById('duplicateShortcutConfirmDialog');
            if (dlg) dlg.open = true;
            return;
        }
        beginOperation('shortcut_add', '添加快捷短语：' + (fieldLabels[fieldKey] || fieldKey) + `（${value}）`);
        addShortcutTemplate(fieldKey, value);
        commitOperation();
        const dlg = document.getElementById('shortcutAddDialog');
        if (dlg) dlg.open = false;
        window.__rsdbShortcutAddPrevInput = shortcutAddContext?.prevInput || window.__rsdbShortcutAddPrevInput || null;
        shortcutAddContext = null;
        showSnackbar('已添加快捷短语', 'success');
        closeShortcutInlineAdd({ restoreKeyboard: true });
    });
    document.getElementById('duplicateShortcutOkBtn')?.addEventListener('click', () => {
        if (!duplicateShortcutContext) return;
        const { fieldKey, value } = duplicateShortcutContext;
        const templates = getTemplatesByField(fieldKey);
        if (!templates) return;
        beginOperation('shortcut_add', '添加快捷短语：' + (fieldLabels[fieldKey] || fieldKey) + `（${value}）`);
        if (appSettings.shortcutAddPosition === 'last') templates.push(value);
        else templates.unshift(value);
        KeyboardConfigManager.save();
        commitOperation();
        const d1 = document.getElementById('duplicateShortcutConfirmDialog');
        if (d1) d1.open = false;
        const d2 = document.getElementById('shortcutAddDialog');
        if (d2) d2.open = false;
        duplicateShortcutContext = null;
        shortcutAddContext = null;
        const prev = window.__rsdbShortcutAddPrevInput || null;
        window.__rsdbShortcutAddPrevInput = null;
        if (prev) {
            currentInput = prev;
            if (prev.id === 'remarks') {
                setVirtualKeyboardVisible(false);
                prev.focus?.();
            } else {
                prev.setAttribute('readonly', 'true');
                prev.classList.add('readonly-input');
                updateKeyboardForInput(prev);
                showVirtualKeyboard();
                prev.focus?.();
                resetCursorToEnd(prev);
                refreshShortcutKeysForCurrentInput();
                setTimeout(updateVirtualCursor, 0);
            }
        }
        showSnackbar('已添加快捷短语', 'success');
        closeShortcutInlineAdd({ restoreKeyboard: true });
    });
    document.getElementById('duplicateShortcutCancelBtn')?.addEventListener('click', () => {
        if (!duplicateShortcutContext) return;
        const { value } = duplicateShortcutContext;
        const d1 = document.getElementById('duplicateShortcutConfirmDialog');
        if (d1) d1.open = false;
        const d2 = document.getElementById('shortcutAddDialog');
        if (d2) d2.open = false;
        duplicateShortcutContext = null;
        shortcutAddContext = null;
        const prev = window.__rsdbShortcutAddPrevInput || null;
        window.__rsdbShortcutAddPrevInput = null;
        if (prev) {
            currentInput = prev;
            if (prev.id === 'remarks') {
                setVirtualKeyboardVisible(false);
                prev.focus?.();
            } else {
                prev.setAttribute('readonly', 'true');
                prev.classList.add('readonly-input');
                updateKeyboardForInput(prev);
                showVirtualKeyboard();
                prev.focus?.();
                resetCursorToEnd(prev);
                refreshShortcutKeysForCurrentInput();
                setTimeout(updateVirtualCursor, 0);
            }
        } else {
            showVirtualKeyboard();
        }
        setTimeout(() => highlightShortcutInKeyboard(value), 60);
        closeShortcutInlineAdd({ restoreKeyboard: true });
    });
    dom.addBtn.addEventListener('click', openAddModal);
    dom.fileInput.addEventListener('change', handleFileImport);
    dom.selectAllCheckbox.addEventListener('change', handleSelectAll);
    dom.deleteSelectedBtn.addEventListener('click', confirmDeleteSelected);
    bindImmediateActionButton(dom.saveBtn, saveData);

    dom.searchClearBtn?.addEventListener('click', () => {
        dom.searchInput.value = '';
        startSearch();
    });

    dom.calculatorBtn.addEventListener('click', openCalculatorModal);
    dom.calculateAndAddBtn.addEventListener('click', calculateAndAddData);

 dom.tableBody.addEventListener('click', (e) => {
    if (isCellMultiSelectMode) {
        if (suppressNextCellClick) { suppressNextCellClick = false; return; }
        const cell = e.target.closest('td');
        const row = e.target.closest('tr');
        if (!cell || !row || e.target.closest('button,mdui-button-icon,mdui-checkbox,.image-col')) return;
        const rowIndex = Number(row.dataset.index);
        const field = cell.classList.contains('seq-col') ? 'seq' : cell.dataset.field;
        if (!Number.isInteger(rowIndex) || !field) return;
        if (field === 'seq') { selectCellRow(rowIndex); return; }
        if (e.shiftKey && cellSelectionAnchor) setCellSelectionRange(cellSelectionAnchor, { row: rowIndex, field });
        else toggleCellSelection(rowIndex, field, true);
        return;
    }
    if (isMultiSelectMode) return;

    e.stopPropagation();

    const row = e.target.closest('tr');
    if (!row) return;

    const index = parseInt(row.getAttribute('data-index'));
    const cell = e.target.closest('td');
    const targetFieldId = cell ? cell.getAttribute('data-field') : null;

    if (!targetFieldId || 
        targetFieldId === 'cardImage' || 
        targetFieldId === 'seq' || 
        cell.classList.contains('action-col') || 
        cell.classList.contains('image-col') || 
        cell.classList.contains('checkbox-col')) {
        return;
    }

    if (targetFieldId) {
        openQuickEdit(index, targetFieldId);
        return;   
    }

    });

    // 多选格子：长按后拖动框选，靠近边缘时平滑滚动
    dom.tableBody.addEventListener('pointerdown', (e) => {
        if (!isCellMultiSelectMode || e.pointerType === 'mouse') return;
        const cell = e.target.closest('td'); const row = e.target.closest('tr');
        if (!cell || !row || e.target.closest('button,mdui-button-icon,mdui-checkbox,.image-col')) return;
        const field = cell.classList.contains('seq-col') ? 'seq' : cell.dataset.field;
        const rowIndex = Number(row.dataset.index);
        if (!field || !Number.isInteger(rowIndex)) return;
        cellSelectionPointer = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, row: rowIndex, field, dragging: false };
        clearTimeout(cellSelectionLongPressTimer);
        cellSelectionLongPressTimer = setTimeout(() => {
            if (!cellSelectionPointer) return;
            cellSelectionPointer.dragging = true;
            cellSelectionAnchor = { row: rowIndex, field };
            toggleCellSelection(rowIndex, field, false);
            if (navigator.vibrate) navigator.vibrate(12);
        }, 320);
        try { dom.tableBody.setPointerCapture(e.pointerId); } catch {}
    }, { passive: false });
    dom.tableBody.addEventListener('pointermove', (e) => {
        if (!isCellMultiSelectMode || !cellSelectionPointer || cellSelectionPointer.pointerId !== e.pointerId) return;
        const state = cellSelectionPointer;
        if (!state.dragging) {
            if (Math.hypot(e.clientX - state.startX, e.clientY - state.startY) > 8) clearTimeout(cellSelectionLongPressTimer);
            return;
        }
        if (e.cancelable) e.preventDefault();
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('td');
        const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('tr');
        if (target && row) {
            const field = target.classList.contains('seq-col') ? 'seq' : target.dataset.field;
            const rowIndex = Number(row.dataset.index);
            if (field && Number.isInteger(rowIndex) && field !== 'seq') setCellSelectionRange(cellSelectionAnchor, { row: rowIndex, field });
        }
        stopCellAutoScroll(); continueCellSelectionAtPoint(e);
    }, { passive: false });
    const endCellPointer = (e) => {
        if (!cellSelectionPointer || cellSelectionPointer.pointerId !== e.pointerId) return;
        suppressNextCellClick = !!cellSelectionPointer.dragging;
        clearTimeout(cellSelectionLongPressTimer); stopCellAutoScroll();
        try { dom.tableBody.releasePointerCapture(e.pointerId); } catch {}
        cellSelectionPointer = null;
    };
    dom.tableBody.addEventListener('pointerup', endCellPointer);
    dom.tableBody.addEventListener('pointercancel', endCellPointer);
    document.querySelector('#dataTable thead')?.addEventListener('click', (e) => {
        if (!isCellMultiSelectMode) return;
        const th = e.target.closest('th[data-field]'); if (!th) return;
        const field = th.dataset.field;
        selectCellColumn(field);
    });

    dom.bottomPrevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });

    dom.bottomNextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });

    dom.pageInfoText.addEventListener('click', () => {
        dom.pageInfoText.style.display = 'none';
        dom.pageJumpInput.style.display = 'inline-block';
        dom.pageJumpInput.focus();
        dom.pageJumpInput.select();
    });

    dom.pageJumpInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            jumpToPage();
        }
    });

    dom.pageJumpInput.addEventListener('blur', jumpToPage);

    // PWA Install Logic
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        if (dom.installPwaBtn) {
            dom.installPwaBtn.style.display = 'block';
        }
    });

    if (dom.installPwaBtn) {
        dom.installPwaBtn.addEventListener('click', async () => {
            dom.drawer.open = false;
            if (!deferredPrompt) return;
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, throw it away
            deferredPrompt = null;
            
            if (outcome === 'accepted') {
                dom.installPwaBtn.style.display = 'none';
            }
        });
    }

    window.addEventListener('appinstalled', () => {
        // Hide the app-provided install promotion
        if (dom.installPwaBtn) {
            dom.installPwaBtn.style.display = 'none';
        }
        // Clear the deferredPrompt so it can be garbage collected
        deferredPrompt = null;
        console.log('PWA was installed');
        showSnackbar('应用已安装', 'success');
    });
}

function confirmDeleteSelected() {

    if (selectedRows.size === 0 || !isMultiSelectMode) {
        showSnackbar('请先勾选要删除的行', 'warning');
        return;
    }

    const deleteCount = selectedRows.size;
    dom.confirmMessage.innerHTML = `
        <div style="text-align:center; padding:8px 0;">
            <p style="font-size:1rem; margin:0;">确定要删除选中的 <strong style="color:#f44336; font-size:1.1rem;">${deleteCount} 条数据</strong> 吗？</p>
            <p style="margin:12px 0 0; color:#757575; font-size:0.9rem;">此操作不可逆，删除后数据将永久丢失！</p>
        </div>
    `;

    openCustomModal(dom.confirmModal);

    dom.confirmActionBtn.onclick = () => {
        beginOperation('delete_selected', '批量删除 ' + deleteCount + ' 条');

        const sortedIndexes = Array.from(selectedRows).sort((a, b) => b - a);
        sortedIndexes.forEach(index => {
            tableData.splice(index, 1);
        });

        saveDataToIndexedDB();  
        commitOperation();
        showSnackbar(`成功删除 ${deleteCount} 条数据`, 'success');

        if (isMultiSelectMode) toggleMultiSelectMode();
        closeCustomModal(dom.confirmModal);  
        dom.confirmActionBtn.onclick = null;  
    };
}

function bindEditImageButtons() {
    const fileInput = document.getElementById('cardImageInput');

    const takePhotoInEdit = document.getElementById('takePhotoInEditBtn');
    if (takePhotoInEdit) {
        takePhotoInEdit.onclick = () => {
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
        };
    }

    const selectGalleryInEdit = document.getElementById('selectFromGalleryInEditBtn');
    if (selectGalleryInEdit) {
        selectGalleryInEdit.onclick = () => {
            fileInput.removeAttribute('capture');
            fileInput.click();
        };
    }

    const deleteInEdit = document.getElementById('deleteImageInEditBtn');
    if (deleteInEdit) {
        deleteInEdit.onclick = () => {
            openImageDeleteConfirmation(currentEditIndex);
        };
    }
}

		function jumpToPage() {
		        let target = parseInt(dom.pageJumpInput.value);
		        target = Math.max(1, Math.min(totalPages, isNaN(target) ? currentPage : target));
		        if (target !== currentPage) {
		            currentPage = target;
		            updateTable();
		        }
		        dom.pageJumpInput.style.display = 'none';
		        dom.pageInfoText.style.display = 'inline-block';
		    }
function toggleSearchReplaceVisibility(forceState) {
    isSearchReplaceVisible = typeof forceState === 'boolean' ? forceState : !isSearchReplaceVisible;
    const container = document.getElementById('searchReplaceContainer');

    if (isSearchReplaceVisible) {
        container.style.display = 'block';
        dom.searchMenuItem?.setAttribute('icon', 'search_off');

        const savedFilter = localStorage.getItem('filterMatchRows') === 'true';
        isFilterMatchRows = savedFilter;
        
        // Sync Checkbox
        if (dom.filterMatchRowsCheckbox) {
            dom.filterMatchRowsCheckbox.checked = savedFilter;
        }

        startSearch();   
    } else {
        container.style.display = 'none';
        dom.searchMenuItem?.setAttribute('icon', 'search');

        updateTable();   
    }
}
		function handleSelectAll() {
		    if (!isMultiSelectMode) return;
		    selectedRows.clear();
		    const filteredData = getFilteredData();
		    if (dom.selectAllCheckbox.checked) {
		      filteredData.forEach(item => {
		          const originalIndex = tableData.indexOf(item);
		          if (originalIndex !== -1) selectedRows.add(originalIndex);
		      });
		    }
		    updateTable();
		}

		function openCalculatorModal() {
		    dom.drawer.open = false;
		    keyboardState.isQuickEdit = false;
		    saveKeyboardState();
		    loadCalculatorSettings();
		    openCustomModal(dom.calculatorModal); 
		    dom.calcDiameter1.value = '';
		    dom.calcDiameter2.value = '';
		    dom.calcLength.value = '';
		    dom.calcResult.value = '';
		    calculateWeight();
		    [dom.calcDiameter1, dom.calcDiameter2, dom.calcLength].forEach(input => applyConfiguredKeyboardMode(input));
		    activateConfiguredInput(dom.calcDiameter1);
		    requestAnimationFrame(() => {
		        if (dom.calculatorContent) dom.calculatorContent.scrollTop = 0;
		        dom.calcDiameter1?.scrollIntoView?.({ block: 'nearest' });
		    });
		}

		function clearCalculatorInputs() {
		    dom.calcDiameter1.value = '';
		    dom.calcDiameter2.value = '';
		    dom.calcLength.value = '';
		    dom.calcResult.value = '';
		    calculateWeight(); 

		    dom.calcDiameter1.focus();
		    currentInput = dom.calcDiameter1;
		    updateKeyboardForInput(currentInput);
		}

function getFilteredData() {
    if (!isSearchActive || !dom.searchInput.value.trim()) {
        return tableData;
    }

    if (isFilterMatchRows) {

        const matchedRows = new Set(searchMatches.map(m => m.rowIndex));
        return tableData.filter((_, index) => matchedRows.has(index));
    } else {
        return tableData;
    }
}
