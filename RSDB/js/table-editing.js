function updateTable() {
    const displayData = getFilteredData();
    const rowIndexMap = new Map(tableData.map((item, index) => [item, index]));

    totalPages = Math.max(1, Math.ceil(displayData.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageData = displayData.slice(start, start + PAGE_SIZE);

    dom.totalCountText.textContent = displayData.length === tableData.length
        ? `共 ${tableData.length} 条数据`
        : `共 ${displayData.length} 条匹配数据（原 ${tableData.length} 条）`;

    dom.pageInfoText.textContent = `第 ${currentPage} / ${totalPages} 页`;
    dom.pageJumpInput.value = currentPage;
    dom.pageJumpInput.max = totalPages;
    dom.bottomPrevBtn.disabled = currentPage === 1;
    dom.bottomNextBtn.disabled = currentPage === totalPages;

    dom.searchClearBtn?.classList.toggle('active', !!searchTerm);
    dom.selectedCount.textContent = selectedRows.size;

    const displayStyle = isMultiSelectMode && !isCellMultiSelectMode ? 'table-cell' : 'none';

    const checkboxHeader = document.querySelector('#dataTable thead th.checkbox-col');
    if (checkboxHeader) {
        checkboxHeader.style.display = displayStyle;
    }

    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
        deleteBtn.style.display = (isMultiSelectMode && selectedRows.size > 0) ? 'block' : 'none';
    }

    const tableHead = document.querySelector('#dataTable thead');
    const tbody = dom.tableBody;
    const emptyState = document.getElementById('emptyState');

    tbody.innerHTML = '';

    if (displayData.length === 0) {
        if (tableHead) tableHead.style.display = 'none';
        emptyState.style.display = 'flex';
        document.querySelector('.bottom-data-summary').style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
        updateCellSelectionActions();
        return;
    }

    if (tableHead) tableHead.style.display = 'table-header-group';
    emptyState.style.display = 'none';
    document.querySelector('.bottom-data-summary').style.display = 'flex';

    if (isFilterMatchRows && isSearchActive) {
        tbody.innerHTML = `
            <tr class="filtered-match-summary">
                <th colspan="16" style="text-align:center; font-size:1.1rem; padding:12px; color:var(--text-color) !important;">
                    匹配结果（共 ${displayData.length} 条）
                </th>
            </tr>
        `;
    }

    pageData.forEach((item, displayIdx) => {
        const originalIndex = Number.isInteger(item.__index) ? item.__index : rowIndexMap.get(item);
        const globalSeq = originalIndex + 1;

        const row = document.createElement('tr');
        row.setAttribute('data-index', originalIndex);

        if (isMultiSelectMode && !isCellMultiSelectMode && selectedRows.has(originalIndex)) {
            row.classList.add('selected');
        }

        const escapeHtml = (str) => {
            if (!str) return '-';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/\\/g, '&#92;');
        }

        const cardImageSrc = item.cardImage ? escapeHtml(item.cardImage) : '';
        const displayCellValue = (fieldKey) => {
            const cached = item?.__cellDisplayValues?.[fieldKey];
            const sourceValue = cached !== undefined && /^\s*=/.test(String(item?.[fieldKey] ?? '')) ? cached : item[fieldKey];
            return escapeHtml(formatCellValueForDisplay(sourceValue, originalIndex, fieldKey));
        };

        row.innerHTML = `
            <td class="seq-col">
    ${globalSeq}
    <div class="move-buttons">
        <button class="move-btn move-dialog-btn" data-index="${originalIndex}" ${tableData.length <= 1 ? 'disabled' : ''} title="移动项目">
            <i class="material-icons" style="font-size:16px;">swap_vert</i>
        </button>
    </div>
</td>
            <td class="checkbox-col" style="display:${displayStyle};">
                <mdui-checkbox class="row-checkbox" data-index="${originalIndex}" ${selectedRows.has(originalIndex) ? 'checked' : ''}></mdui-checkbox>
            </td>
            <td data-field="steelType">${displayCellValue('steelType')}</td>
            <td data-field="productId">${displayCellValue('productId')}</td>
            <td data-field="cardId">${displayCellValue('cardId')}</td>
            <td data-field="furnaceId">${displayCellValue('furnaceId')}</td>
            <td data-field="actualDiameter">${displayCellValue('actualDiameter')}</td>
            <td data-field="diameter">${displayCellValue('diameter')}</td>
            <td data-field="length">${displayCellValue('length')}</td>
            <td data-field="weight">${displayCellValue('weight')}</td>
            <td data-field="status">${displayCellValue('status')}</td>
            <td data-field="position">${displayCellValue('position')}</td>
            <td data-field="hardness">${displayCellValue('hardness')}</td>
            <td class="remark-col" data-field="remarks">${displayCellValue('remarks')}</td>
            <td class="image-col" data-field="cardImage" style="text-align:center;padding:0;height:80px;width:100px;cursor:pointer;">
                ${item.cardImage ? 
                  `<div style="width:100%;height:100%;overflow:hidden;border-radius:4px;" onclick="if (!isCellMultiSelectMode) { showImagePreviewByIndex(${originalIndex}); event.stopPropagation(); }">
                     <img src="${cardImageSrc}" style="width:100%;height:100%;object-fit:cover;" alt="卡片图片">
                   </div>`
                  : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--background-color);border:2px dashed var(--border-color);border-radius:4px;" onclick="if (!isCellMultiSelectMode) { startDirectTakePhoto(${originalIndex}); event.stopPropagation(); }">
                       <mdui-icon name="add_a_photo" style="font-size:36px;color:var(--primary-color);opacity:0.6;"></mdui-icon>
                     </div>`
                }
            </td>

<td class="action-col">
    <mdui-button-icon icon="edit" class="edit-btn" data-index="${originalIndex}"></mdui-button-icon>
    <mdui-button-icon icon="delete" class="delete-row-btn" data-index="${originalIndex}"></mdui-button-icon>
</td>
        `;

        tbody.appendChild(row);
        row.querySelectorAll('td[data-field]').forEach((cell) => {
            const fieldKey = cell.getAttribute('data-field');
            applyCellCustomStyle(cell, originalIndex, fieldKey);
        });
        if (isCellMultiSelectMode) {
            row.querySelectorAll('td[data-field]').forEach(cell => {
                if (selectedCells.has(cellKey(originalIndex, cell.dataset.field))) cell.classList.add('cell-selected');
            });
            if (selectedCells.has(cellKey(originalIndex, 'seq'))) row.querySelector('td.seq-col')?.classList.add('cell-selected');
        }
    });

    applySearchHighlight();
    document.getElementById('dataTable')?.classList.toggle('cell-selection-mode', isCellMultiSelectMode);
    updateCellSelectionActions();
    bindRowEvents(); // 渲染完必绑事件
};
function updateSummary() {
    try {
        const all = Array.isArray(tableData) ? tableData : [];
        const current = typeof getFilteredData === 'function' ? getFilteredData() : all;
        if (dom && dom.totalCountText) {
            dom.totalCountText.textContent = current.length === all.length
                ? `共 ${all.length} 条数据`
                : `共 ${current.length} 条匹配数据（原 ${all.length} 条）`;
        }
    } catch (e) {}
}
		/**
		 * 更新搜索结果计数显示（修复占位符暴露问题）
		 */
		function updateSearchResultCount() {
		  const resultCountEl = document.getElementById('searchResultCount');
		  if (!resultCountEl) return; // 防DOM元素不存在

		  const matchCount = searchMatches.length;
		  let countText = `找到 ${matchCount} 个匹配项`;

		  // 只有存在匹配项时，才显示当前匹配位置
		  if (matchCount > 0 && currentMatchIndex >= 0) {
		    const currentPos = currentMatchIndex + 1;
		    countText += ` (当前 ${currentPos}/${matchCount})`;
		  }

		  // 安全设置文本（核心修复：避免语法占位符暴露）
		  resultCountEl.textContent = countText;
		}
		// 新增：统一的高亮函数，便于在翻页或替换后调用
		function applySearchHighlight() {
		    const query = dom.searchInput.value.trim().toLowerCase();

		    // 如果没有搜索词，清除所有高亮和计数
		    if (!query || !isSearchActive) {
		        document.querySelectorAll('.search-match-highlight, .current-match-highlight').forEach(el => {
		            el.classList.remove('search-match-highlight', 'current-match-highlight');
		        });
		        dom.searchResultCount.textContent = '';
		        return;
		    }

		    // 清除旧高亮
		    document.querySelectorAll('.search-match-highlight, .current-match-highlight').forEach(el => {
		        el.classList.remove('search-match-highlight', 'current-match-highlight');
		    });
		    document.querySelectorAll('.search-row-highlight').forEach(el => el.classList.remove('search-row-highlight'));

		    // 高亮当前页所有包含搜索词的单元格（无论替换面板是否打开）
		    document.querySelectorAll('#dataTable tbody tr').forEach(row => {
		        const rowIndex = parseInt(row.getAttribute('data-index'));
		        let rowMatched = false;
		        searchableFields.forEach(field => {
		            const cell = row.querySelector(`td[data-field="${field}"]`);
		            if (!cell) return;
		            const cellValue = String(getSearchFieldValue(tableData[rowIndex], field) || '').toLowerCase();
		            if (cellValue.includes(query)) {
		                cell.classList.add('search-match-highlight');
		                rowMatched = true;
		            }
		        });
		        row.classList.toggle('search-row-highlight', rowMatched);
		    });

		    // 更新搜索结果计数（仅在替换面板打开时显示详细计数）
		    if (isSearchReplaceVisible) {
		        if (searchMatches.length === 0) {
		            dom.searchResultCount.textContent = '未找到匹配项';
		        } else {
		            // 防止越界
		            if (currentMatchIndex < 0) currentMatchIndex = 0;
		            if (currentMatchIndex >= searchMatches.length) currentMatchIndex = searchMatches.length - 1;

		            dom.searchResultCount.textContent = 
		                `找到 ${searchMatches.length} 个匹配项 (当前 ${currentMatchIndex + 1}/${searchMatches.length})`;
		        }
		    } else {
		        // 替换面板关闭时，只显示找到多少个（不显示当前第几个）
		        dom.searchResultCount.textContent = searchMatches.length > 0 
		            ? `找到 ${searchMatches.length} 个匹配项` 
		            : '';
		    }

		    // 如果有当前匹配项，高亮边框并滚动（仅在替换面板打开时）
		    if (isSearchReplaceVisible && currentMatchIndex !== -1 && searchMatches.length > 0) {
		        highlightAndScrollToCurrentMatch();
		    }

            // Zoom Manager Update Hook
            ZoomManager.onTableUpdate();
		}

		// 高亮当前匹配项并滚动
		function highlightAndScrollToCurrentMatch() {
		    // 先清除旧高亮
		    document.querySelectorAll('.search-match-highlight, .current-match-highlight').forEach(el => {
		        el.classList.remove('search-match-highlight', 'current-match-highlight');
		    });

		    const match = searchMatches[currentMatchIndex];
		    const targetRow = document.querySelector(`tbody tr[data-index="${match.rowIndex}"]`);
		    if (!targetRow) return;
		    targetRow.classList.add('search-row-highlight');

		    // 高亮该行所有匹配字段
		    searchableFields.forEach(field => {
		        const cell = targetRow.querySelector(`td[data-field="${field}"]`);
		        if (!cell) return;
		        const cellValue = String(getSearchFieldValue(tableData[match.rowIndex], field) || '').toLowerCase();
		        const query = dom.searchInput.value.trim().toLowerCase();
		        if (query && cellValue.includes(query)) {
		            cell.classList.add('search-match-highlight');
		        }
		    });

		    // 当前匹配字段加边框高亮
		    const currentCell = targetRow.querySelector(`td[data-field="${match.field}"]`);
		    if (currentCell) {
		        currentCell.classList.add('current-match-highlight');

		        // 平滑滚动到单元格
		        const container = document.querySelector('.data-table-container-div');
		        if (container) {
		            const cellRect = currentCell.getBoundingClientRect();
		            const containerRect = container.getBoundingClientRect();

		            const offsetTop = container.scrollTop + cellRect.top - containerRect.top - (containerRect.height / 2) + (cellRect.height / 2);
		            const offsetLeft = container.scrollLeft + cellRect.left - containerRect.left - (containerRect.width / 3);

		            container.scrollTo({
		                top: offsetTop,
		                left: Math.max(0, offsetLeft),
		                behavior: 'smooth'
		            });
		        }
		    }
		}

		
// ==========================================
// === Search & Replace Logic ===
// ==========================================
// 匹配项导航(上一个/下一个) - 修复边界计算冗余+逻辑优化
function navigateMatch(direction) {
    if (searchMatches.length === 0) return;

    currentMatchIndex += direction;
    // ✅ 优化：极简循环边界处理，替代原有的两个if判断，逻辑不变更简洁
    currentMatchIndex = (currentMatchIndex + searchMatches.length) % searchMatches.length;

    updateCurrentMatchUI();
}

// 更新匹配UI+计数+高亮+翻页 - 核心修复 所有显示/高亮BUG
function updateCurrentMatchUI() {
    // ✅ 修复1：空匹配时 计数文本兜底优化，永不显示占位符
    dom.searchResultCount.textContent = searchMatches.length === 0 
        ? `找到 0 个匹配项` 
        : `找到 ${searchMatches.length} 个匹配项 (当前 ${currentMatchIndex + 1}/${searchMatches.length})`;

    // 先清除所有旧高亮 - 保留原逻辑
    document.querySelectorAll('.search-match-highlight').forEach(el => 
        el.classList.remove('search-match-highlight'));
    document.querySelectorAll('.current-match-highlight').forEach(el => 
        el.classList.remove('current-match-highlight'));
    document.querySelectorAll('.search-row-highlight').forEach(el => el.classList.remove('search-row-highlight'));

    if (searchMatches.length === 0) return;

    const match = searchMatches[currentMatchIndex];
    const rowIndex = match.rowIndex;

    // === 关键：自动翻到包含该行的页面 ===
    const filteredData = getFilteredData();
    const displayIndex = filteredData.indexOf(tableData[rowIndex]);
    if (displayIndex !== -1) {
        const targetPage = Math.floor(displayIndex / PAGE_SIZE) + 1;
        if (currentPage !== targetPage) {
            currentPage = targetPage;
            updateTable(); 
            // ✅ 修复2：延长延迟时间+加容错，解决翻页后DOM未渲染完成导致高亮丢失的问题
            setTimeout(highlightCurrentMatchCell, 200); 
        } else {
            highlightCurrentMatchCell();
        }
    } else {
        highlightCurrentMatchCell();
    }
}

// 高亮当前匹配单元格+平滑滚动 - 保留原逻辑 无改动
function highlightCurrentMatchCell() {
    const match = searchMatches[currentMatchIndex];
    if (!match || !Number.isInteger(match.rowIndex)) return;
    const row = document.querySelector(`tbody tr[data-index="${match.rowIndex}"]`);
    if (!row) return;
    row.classList.add('search-row-highlight');

    // 高亮该行所有包含搜索词的单元格
    searchableFields.forEach(field => {
        const cell = row.querySelector(`td[data-field="${field}"]`);
        if (cell) {
            const query = dom.searchInput.value.trim().toLowerCase();
            const cellValue = String(getSearchFieldValue(tableData[match.rowIndex], field) || '').toLowerCase();
            if (query && cellValue.includes(query)) {
                cell.classList.add('search-match-highlight');
            }
        }
    });

    // 当前匹配字段加粗边框高亮
    const currentCell = row.querySelector(`td[data-field="${match.field}"]`);
    if (currentCell) {
        currentCell.classList.add('current-match-highlight');

        // 平滑滚动到当前单元格
        const container = document.querySelector('.data-table-container-div');
        if (container) {
            const cellRect = currentCell.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const offsetTop = container.scrollTop + cellRect.top - containerRect.top - (containerRect.height / 2) + (cellRect.height / 2);
            const offsetLeft = container.scrollLeft + cellRect.left - containerRect.left - (containerRect.width / 2) + (cellRect.width / 2);
            container.scrollTo({
                top: Math.max(0, offsetTop),
                left: Math.max(0, offsetLeft),
                behavior: 'smooth'
            });
        }
    }
}

// 替换当前匹配项 - ✅ 核心修复3：替换后自动跳转下一个+保留匹配列表+计数同步+不丢失搜索状态
function replaceOne() {
    if (currentMatchIndex === -1 || searchMatches.length === 0) {
        showSnackbar('没有选中的匹配项可替换', 'warning');
        return;
    }

    const match = searchMatches[currentMatchIndex];
    const newText = dom.replaceQueryInput.value.trim();
    const oldText = dom.searchInput.value.trim();

    if (!oldText) {
        showSnackbar('搜索词不能为空', 'warning');
        return;
    }

    const rowIndex = match.rowIndex;
    const fieldId = match.field;
    const originalValue = tableData[rowIndex][fieldId] || '';

    const regex = new RegExp(escapeRegExp(oldText), 'gi');
    const newValue = originalValue.replace(regex, newText);

    let isReplaced = false;
    if (newValue !== originalValue) {
        tableData[rowIndex][fieldId] = newValue;
        if (tableData[rowIndex].__cellDisplayValues) delete tableData[rowIndex].__cellDisplayValues[fieldId];
        saveDataToIndexedDB();
        showSnackbar(`已替换当前匹配项`, 'success');
        isReplaced = true;
    } else {
        showSnackbar('当前匹配项无需替换', 'info');
    }

    // ✅ 修复4：替换后核心逻辑重构 - 原有startSearch会重置所有状态，改为「保留搜索+跳转到下一个」
    if (isReplaced && searchMatches.length > 0) {
        // 删除当前已替换的匹配项，避免重复匹配
        searchMatches.splice(currentMatchIndex, 1);
        // 如果还有匹配项，自动定位到下一个，否则重置状态
        if (searchMatches.length > 0) {
            // 边界处理：如果删到最后一项，回到第一项
            currentMatchIndex = currentMatchIndex >= searchMatches.length ? 0 : currentMatchIndex;
            updateTable();
            setTimeout(() => {
                updateCurrentMatchUI(); // 同步更新计数+高亮下一个
            }, 200);
        } else {
            // 无匹配项了，清空搜索状态
            currentMatchIndex = -1;
            isSearchActive = false;
            updateTable();
            updateCurrentMatchUI();
            showSnackbar('所有匹配项已替换完成', 'success');
        }
    } else {
        // 未替换则跳转到下一个匹配项
        navigateMatch(1);
    }
}

// 替换全部的确认弹窗 - ✅ 修复5：替换后计数/高亮/搜索状态完全清空，无残留
function confirmReplaceAll() {
    const oldText = dom.searchInput.value.trim();
    const newText = dom.replaceQueryInput.value.trim();

    if (!oldText) {
        showSnackbar('搜索词不能为空', 'warning');
        return;
    }

    if (searchMatches.length === 0) {
        showSnackbar('没有匹配项可替换', 'warning');
        return;
    }

    dom.confirmMessage.innerHTML = `
        <div style="text-align:center;">
            <p>确定将所有 <strong style="color:var(--primary-color);">${escapeHtml(oldText)}</strong> 
               替换为 <strong style="color:#f44336;">${escapeHtml(newText || '(空)')}</strong> 吗？</p>
            <p style="margin-top:12px;color:#757575;">共将影响 ${searchMatches.length} 处</p>
        </div>
    `;

    openCustomModal(dom.confirmModal);

    dom.confirmActionBtn.onclick = () => {
        beginOperation('replace_all', '替换 ' + oldText + ' → ' + (newText || '(空)'));
        let replaceCount = 0;
        const regex = new RegExp(escapeRegExp(oldText), 'gi');

        tableData.forEach(item => {
            searchableFields.forEach(field => {
                const val = (item[field] || '').toString();
                if (val.toLowerCase().includes(oldText.toLowerCase())) {
                    const newVal = val.replace(regex, newText);
                    if (newVal !== val) {
                        item[field] = newVal;
                        if (item.__cellDisplayValues) delete item.__cellDisplayValues[field];
                        replaceCount++;
                    }
                }
            });
        });

        saveDataToIndexedDB();

        if (replaceCount > 0) {
            showSnackbar(`成功替换 ${replaceCount} 处！`, 'success');
        } else {
            showSnackbar('没有发生实际替换', 'info');
        }

        // ✅ 修复6：替换全部后 彻底清空所有搜索相关状态 + 更新计数UI
        updateTable();
        commitOperation();
        dom.searchInput.value = '';
        dom.replaceQueryInput.value = '';
        searchTerm = '';
        isSearchActive = false;
        searchMatches = [];
        currentMatchIndex = -1;
        updateCurrentMatchUI(); // 同步清空计数文本
        toggleSearchReplaceVisibility();

        closeCustomModal(dom.confirmModal);
        dom.confirmActionBtn.onclick = null;
    };
}

// 辅助函数：HTML转义和正则转义 - 保留原逻辑 无改动
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ✅ 修复7：删除重复定义的replaceAll函数（你代码里写了2次replaceAll，此处保留确认弹窗版本即可，删除冗余的）
		function jumpToMatch(matchIndex) {
		    if (matchIndex < 0 || matchIndex >= searchMatches.length) return;

		    currentMatchIndex = matchIndex;
		    const match = searchMatches[currentMatchIndex];
		    const targetRowIndex = match.rowIndex; // 这是全局 tableData 中的索引

		    // 计算目标页面
		    const targetPage = Math.floor(targetRowIndex / PAGE_SIZE) + 1;

		    // 如果不在当前页，先翻页
		    if (currentPage !== targetPage) {
		        currentPage = targetPage;
		        updateTable(); // 渲染新页面

		        // 等待 DOM 更新完成后高亮并滚动
		        requestAnimationFrame(() => {
		            setTimeout(highlightAndScrollToCurrentMatch, 100);
		        });
		    } else {
		        // 同页直接高亮滚动
		        highlightAndScrollToCurrentMatch();
		    }

		    // 更新计数显示
		    dom.searchResultCount.textContent = 
		        `找到 ${searchMatches.length} 个匹配项 (当前 ${currentMatchIndex + 1}/${searchMatches.length})`;
		}

		
// ==========================================
// === Pagination & Table Rendering ===
// ==========================================
function renderPaginationControls(totalFiltered) {
		    // 移除旧的分页控件
		    const oldPagination = document.getElementById('paginationControls');
		    if (oldPagination) oldPagination.remove();

		    if (totalPages <= 1) return;

		    const paginationDiv = document.createElement('div');
		    paginationDiv.id = 'paginationControls';
		    paginationDiv.style.cssText = `
		        display: flex; 
		        justify-content: center; 
		        align-items: center; 
		        gap: 8px; 
		        padding: 16px; 
		        background-color: var(--surface-color);

		    `;

		    // ==================== 上一页按钮 ====================
		    const prevBtn = document.createElement('mdui-button-icon');
		    prevBtn.icon = 'navigate_before';
		    prevBtn.disabled = currentPage === 1;

		    let prevLongPressTimer = null;
		    const LONG_PRESS_DELAY = 500;

		    prevBtn.addEventListener('click', (e) => {
		        e.stopPropagation();
		        if (currentPage > 1) {
		            currentPage--;
		            updateTable();
		            scrollToTopSmooth();
		            updatePageInfoDisplay();
		            prevBtn.disabled = currentPage === 1;
		            nextBtn.disabled = currentPage === totalPages;
		        }
		    });

		    // 长按跳到第一页
		    prevBtn.addEventListener('pointerdown', (e) => {
		        if (currentPage === 1) return;
		        prevLongPressTimer = setTimeout(() => {
		            currentPage = 1;
		            updateTable();
		            scrollToTopSmooth();
		            updatePageInfoDisplay();
		            prevBtn.disabled = true;
		            nextBtn.disabled = currentPage === totalPages;
		        }, LONG_PRESS_DELAY);
		    });

		    prevBtn.addEventListener('pointerup', () => clearTimeout(prevLongPressTimer));
		    prevBtn.addEventListener('pointercancel', () => clearTimeout(prevLongPressTimer));
		    prevBtn.addEventListener('pointerleave', () => clearTimeout(prevLongPressTimer));

		    // ==================== 下一页按钮 ====================
		    const nextBtn = document.createElement('mdui-button-icon');
		    nextBtn.icon = 'navigate_next';
		    nextBtn.disabled = currentPage === totalPages;

		    let nextLongPressTimer = null;

		    nextBtn.addEventListener('click', (e) => {
		        e.stopPropagation();
		        if (currentPage < totalPages) {
		            currentPage++;
		            updateTable();
		            scrollToTopSmooth();
		            updatePageInfoDisplay();
		            prevBtn.disabled = currentPage === 1;
		            nextBtn.disabled = currentPage === totalPages;
		        }
		    });

		    // 长按跳到最后一页
		    nextBtn.addEventListener('pointerdown', (e) => {
		        if (currentPage === totalPages) return;
		        nextLongPressTimer = setTimeout(() => {
		            currentPage = totalPages;
		            updateTable();
		            scrollToTopSmooth();
		            updatePageInfoDisplay();
		            nextBtn.disabled = true;
		            prevBtn.disabled = currentPage === 1;
		        }, LONG_PRESS_DELAY);
		    });

		    nextBtn.addEventListener('pointerup', () => clearTimeout(nextLongPressTimer));
		    nextBtn.addEventListener('pointercancel', () => clearTimeout(nextLongPressTimer));
		    nextBtn.addEventListener('pointerleave', () => clearTimeout(nextLongPressTimer));

		    // ==================== 页码显示与输入 ====================
		    const pageInfoContainer = document.createElement('div');
		    pageInfoContainer.style.display = 'flex';
		    pageInfoContainer.style.alignItems = 'center';
		    pageInfoContainer.style.minWidth = '80px';
		    pageInfoContainer.style.justifyContent = 'center';

		    const pageInfoText = document.createElement('span');
		    pageInfoText.textContent = `第 ${currentPage} / ${totalPages} 页`;
		    pageInfoText.style.fontSize = '0.95rem';
		    pageInfoText.style.color = '#757575';
		    pageInfoText.style.cursor = 'pointer';
		    pageInfoText.style.userSelect = 'none';

		    const pageInput = document.createElement('input');
		    pageInput.type = 'number';
		    pageInput.value = currentPage;
		    pageInput.style.width = '60px';
		    pageInput.style.padding = '4px 8px';
		    pageInput.style.fontSize = '0.95rem';
		    pageInput.style.border = '1px solid var(--border-color)';
		    pageInput.style.borderRadius = '4px';
		    pageInput.style.textAlign = 'center';
		    pageInput.style.display = 'none';
		    pageInput.min = 1;
		    pageInput.max = totalPages;

		    pageInfoContainer.appendChild(pageInfoText);
		    pageInfoContainer.appendChild(pageInput);

		    pageInfoText.addEventListener('click', () => {
		        pageInfoText.style.display = 'none';
		        pageInput.style.display = 'inline-block';
		        pageInput.focus();
		        pageInput.select();
		    });

		    function confirmPageJump() {
		        let targetPage = parseInt(pageInput.value);
		        targetPage = Math.max(1, Math.min(totalPages, isNaN(targetPage) ? currentPage : targetPage));
		        if (targetPage !== currentPage) {
		            currentPage = targetPage;
		            updateTable();
		            scrollToTopSmooth();
		        }
		        prevBtn.disabled = currentPage === 1;
		        nextBtn.disabled = currentPage === totalPages;
		        updatePageInfoDisplay();
		    }

		    pageInput.addEventListener('keydown', (e) => {
		        if (e.key === 'Enter') {
		            e.preventDefault();
		            confirmPageJump();
		        }
		    });

		    pageInput.addEventListener('blur', confirmPageJump);

		    function updatePageInfoDisplay() {
		        pageInfoText.textContent = `第 ${currentPage} / ${totalPages} 页`;
		        pageInput.value = currentPage;
		        pageInput.max = totalPages;
		        pageInput.style.display = 'none';
		        pageInfoText.style.display = 'inline-block';
		    }

		    paginationDiv.appendChild(prevBtn);
		    paginationDiv.appendChild(pageInfoContainer);
		    paginationDiv.appendChild(nextBtn);

		    const tableContainerDiv = document.querySelector('.data-table-container-div');
		    tableContainerDiv.parentNode.insertBefore(paginationDiv, tableContainerDiv.nextSibling);
		}

		function scrollToTopSmooth() {
		    const container = document.querySelector('.data-table-container');
		    if (container) {
		        container.scrollTo({ top: 0, behavior: 'smooth' });
		    }
		}

// ==============================================
// 绑定表格行所有事件 - 完整修复版 (包含上移/下移按钮点击事件，必替换)
// ==============================================
function bindRowEvents() {
    // 解绑所有原有事件，防止重复绑定导致多次执行
    document.querySelectorAll('#dataTable tbody tr').forEach(row => {
        row.onclick = null;
    });

    // 绑定行点击事件
    document.querySelectorAll('#dataTable tbody tr').forEach(row => {
        const idx = parseInt(row.getAttribute('data-index'));
        row.onclick = (e) => {
            // 如果点击的是【按钮/复选框/图片】，阻止行事件冒泡，避免冲突
            if (e.target.closest('.edit-btn, .delete-btn, .move-btn, .row-checkbox, .image-col, .up-btn, .down-btn')) {
                return;
            }
            // 多选模式：点击行选中/取消选中
            if (isMultiSelectMode) {
                const checkbox = row.querySelector('.row-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
                return;
            }
            // 普通模式：点击行打开编辑弹窗
            //openEditModal(idx);
        };

        // ✅ 复选框勾选事件 (原有保留)
        const rowCheckbox = row.querySelector('.row-checkbox');
        if (rowCheckbox) {
            rowCheckbox.onchange = (e) => {
                e.stopPropagation();
                const isChecked = rowCheckbox.checked;
                const index = parseInt(rowCheckbox.getAttribute('data-index'));
                if (isChecked) {
                    selectedRows.add(index);
                    row.classList.add('selected');
                } else {
                    selectedRows.delete(index);
                    row.classList.remove('selected');
                }
                updateTable();
            };
        }

        // ✅ 编辑按钮事件 (原有保留)
        const editBtn = row.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.onclick = (e) => {
                e.stopPropagation();
                openEditModal(idx);
            };
        }

document.querySelectorAll('.delete-row-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.getAttribute('data-index'));

        // 调用你的原有确认删除整行函数
        confirmDeleteRow(index);

        // 确保在 confirmDeleteRow 内部处理弹窗关闭
        // （见下面第3步的 confirmDeleteRow 修改）
    });
});

        // ✅ 删除按钮事件 (原有保留)
        const deleteBtn = row.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                openImageDeleteConfirmation(idx);
            };
        }

const moveBtn = row.querySelector('.move-dialog-btn');
if (moveBtn) {
    moveBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openMoveRowDialog(parseInt(moveBtn.dataset.index));
    };
}
    });

    // 表头全选复选框事件 (原有保留)
    const headerCheckbox = document.querySelector('#dataTable thead th.checkbox-col mdui-checkbox');
    if (headerCheckbox && isMultiSelectMode) {
        headerCheckbox.onchange = (e) => {
            e.stopPropagation();
            const isChecked = headerCheckbox.checked;
            const currentPageRows = document.querySelectorAll('#dataTable tbody tr');
            currentPageRows.forEach(row => {
                const idx = parseInt(row.getAttribute('data-index'));
                const cb = row.querySelector('.row-checkbox');
                if (cb) cb.checked = isChecked;
                if (isChecked) {
                    selectedRows.add(idx);
                    row.classList.add('selected');
                } else {
                    selectedRows.delete(idx);
                    row.classList.remove('selected');
                }
            });
            updateTable();
        };
    }
};

const DELETE_ROW_DISPLAY_FIELDS = [
    { key: 'steelType', label: '钢种' },
    { key: 'productId', label: '产品号' },
    { key: 'cardId', label: '卡片号' },
    { key: 'furnaceId', label: '炉号' },
    { key: 'actualDiameter', label: '实际直径' },
    { key: 'diameter', label: '直径' },
    { key: 'length', label: '长度' },
    { key: 'weight', label: '重量' },
    { key: 'status', label: '状态' },
    { key: 'position', label: '位置' },
    { key: 'hardness', label: '硬度' },
    { key: 'remarks', label: '备注' }
];
let pendingDeleteRowState = null;

function getDeleteRowDisplayValue(item, index, field) {
    const raw = item?.[field];
    let displayed = raw;
    try {
        displayed = formatCellValueForDisplay(raw, index, field);
    } catch (error) {}
    if (displayed === undefined || displayed === null || String(displayed).trim() === '') return '';
    return String(displayed);
}

function renderDeleteRowDataList(index, item) {
    const list = dom.deleteRowDataList;
    if (!list) return;
    list.replaceChildren();
    if (dom.deleteRowDataIndex) dom.deleteRowDataIndex.textContent = `第 ${index + 1} 行`;

    DELETE_ROW_DISPLAY_FIELDS.forEach(({ key, label }) => {
        const row = document.createElement('div');
        row.className = 'delete-row-data-item';
        const labelElement = document.createElement('div');
        labelElement.className = 'delete-row-data-label';
        labelElement.textContent = label;
        const valueElement = document.createElement('div');
        valueElement.className = 'delete-row-data-value';
        const value = getDeleteRowDisplayValue(item, index, key);
        valueElement.textContent = value || '未填写';
        valueElement.classList.toggle('is-empty', !value);
        row.append(labelElement, valueElement);
        list.appendChild(row);
    });

    const imageRow = document.createElement('div');
    imageRow.className = 'delete-row-data-item';
    const imageLabel = document.createElement('div');
    imageLabel.className = 'delete-row-data-label';
    imageLabel.textContent = '卡片图片';
    const imageValue = document.createElement('div');
    imageValue.className = 'delete-row-data-value';
    if (item?.cardImage) {
        const status = document.createElement('div');
        status.textContent = '已保存图片';
        const image = document.createElement('img');
        image.className = 'delete-row-image-preview';
        image.src = item.cardImage;
        image.alt = `${item.productId || `第 ${index + 1} 行`}的卡片图片`;
        imageValue.append(status, image);
    } else {
        imageValue.textContent = '未上传';
        imageValue.classList.add('is-empty');
    }
    imageRow.append(imageLabel, imageValue);
    list.appendChild(imageRow);
}

function closeDeleteRowConfirmDialog() {
    if (dom.deleteRowConfirmDialog) dom.deleteRowConfirmDialog.open = false;
    pendingDeleteRowState = null;
}

function confirmDeleteRow(index) {
    const safeIndex = Number(index);
    const item = Number.isInteger(safeIndex) ? tableData[safeIndex] : null;
    if (!item) {
        showSnackbar('当前行已不存在，请刷新后重试', 'warning');
        return;
    }
    pendingDeleteRowState = { index: safeIndex, item };
    renderDeleteRowDataList(safeIndex, item);
    if (dom.deleteRowConfirmDialog) dom.deleteRowConfirmDialog.open = true;
}

function deletePendingRow() {
    const state = pendingDeleteRowState;
    if (!state) return;
    let index = state.index;
    if (tableData[index] !== state.item) index = tableData.indexOf(state.item);
    if (index < 0 || !tableData[index]) {
        closeDeleteRowConfirmDialog();
        showSnackbar('当前行已发生变化，没有执行删除', 'warning');
        return;
    }

    const item = tableData[index];
    const rowName = String(item.productId || item.cardId || `第 ${index + 1} 行`);
    beginOperation('delete_row', `删除当前行：${rowName}`, { index });
    tableData.splice(index, 1);
    selectedRows.clear();
    selectedCells.clear();
    saveDataToIndexedDB();
    updateTable();
    updateSummary();
    commitOperation();
    closeDeleteRowConfirmDialog();
    showUndoSnackbar(`已删除 ${rowName}`, 'delete_row');
}

// ========== 表格行【短按】上移/下移核心函数 (无提示，保留不变) ==========
function moveRow(rowIndex, direction) {
  if (tableData.length <= 1) return; 
  const targetIndex = rowIndex + direction;
  if (targetIndex < 0 || targetIndex >= tableData.length) return;
  beginOperation('move_row', '行移动：' + (direction < 0 ? '上移' : '下移'), { rowIndex, targetIndex });
  [tableData[rowIndex], tableData[targetIndex]] = [tableData[targetIndex], tableData[rowIndex]];
  saveDataToIndexedDB(); 
  updateTable(); 
  commitOperation();
}

function renderMoveRowDialog() {
  const dlg = document.getElementById('moveRowDialog');
  if (!dlg || !moveRowDialogState) return;
  const list = document.getElementById('moveRowList');
  const search = document.getElementById('moveRowSearchInput');
  const pageInfo = document.getElementById('moveRowPageInfo');
  const pageInput = document.getElementById('moveRowPageInput');
  const title = document.getElementById('moveRowDialogTitle');
  if (!list || !search || !pageInfo || !pageInput) return;

  if (title) title.textContent = '移动项目';
  const summary = document.getElementById('moveRowSourceSummary');
  if (summary) summary.textContent = `已选择 ${moveRowDialogState.sourceIndexes.size} 个要移动的项目；当前项目已默认高亮，点击其他行选择目标`;
  const q = (moveRowDialogState.query || '').trim().toLowerCase();
  const filtered = q
    ? moveRowDialogState.items.filter(it => it.search.includes(q))
    : moveRowDialogState.items;

  const pageSize = moveRowDialogState.pageSize;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.max(1, Math.min(totalPages, moveRowDialogState.page));
  moveRowDialogState.page = page;

  const start = (page - 1) * pageSize;
  const end = Math.min(filtered.length, start + pageSize);
  const slice = filtered.slice(start, end);

  list.innerHTML = '';
  slice.forEach(it => {
    const item = document.createElement('mdui-list-item');
    item.setAttribute('headline', `第 ${it.index + 1} 行`);
    item.setAttribute('description', it.details || '暂无数据');
    item.dataset.targetIndex = String(it.index);
    if (moveRowDialogState.selectedIndex === it.index) item.setAttribute('selected', '');
    const checkbox = document.createElement('mdui-checkbox');
    checkbox.setAttribute('slot', 'icon');
    checkbox.checked = moveRowDialogState.sourceIndexes.has(it.index);
    checkbox.title = '选择为要移动的项目';
    checkbox.addEventListener('click', (event) => event.stopPropagation());
    checkbox.addEventListener('change', (event) => {
      event.stopPropagation();
      if (checkbox.checked) {
        moveRowDialogState.sourceIndexes.add(it.index);
        if (moveRowDialogState.selectedIndex === it.index) moveRowDialogState.selectedIndex = -1;
      } else {
        moveRowDialogState.sourceIndexes.delete(it.index);
      }
      renderMoveRowDialog();
    });
    item.appendChild(checkbox);
    item.addEventListener('click', () => {
      if (moveRowDialogState.sourceIndexes.has(it.index) && moveRowDialogState.selectedIndex !== it.index) {
        showSnackbar('目标项目不能同时作为移动项目', 'warning');
        return;
      }
      moveRowDialogState.selectedIndex = it.index;
      renderMoveRowDialog();
    });
    list.appendChild(item);
  });

  pageInfo.textContent = `共 ${filtered.length} 条 · 第 ${page} / ${totalPages} 页`;
  pageInput.value = String(page);
  const prevBtn = document.getElementById('moveRowPrevBtn');
  const nextBtn = document.getElementById('moveRowNextBtn');
  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= totalPages;
}

function openMoveRowDialog(sourceIndex) {
  const dlg = document.getElementById('moveRowDialog');
  if (!dlg) return;
  const items = tableData
    .map((item, idx) => ({ item, idx }))
    .map(x => {
      const productId = x.item?.productId || '';
      const cardId = x.item?.cardId || '';
      const steelType = x.item?.steelType || '';
      const details = searchableFields.map(field => `${fieldLabels[field] || field}：${String(x.item?.[field] ?? '').trim() || '—'}`).join('\n');
      const label = `第 ${x.idx + 1} 行 ${details}`;
      return { index: x.idx, productId, cardId, steelType, details, search: label.toLowerCase() };
    });

  moveRowDialogState = {
    sourceIndexes: new Set([sourceIndex]),
    items,
    query: '',
    page: 1,
    pageSize: 50,
    selectedIndex: sourceIndex
  };

  const search = document.getElementById('moveRowSearchInput');
  if (search) search.value = '';
  renderMoveRowDialog();
  document.body.appendChild(dlg);
  dlg.style.zIndex = '20000';
  dlg.open = true;
}

function moveRowToAssignPosition(sourceIndex, direction) {
  if (tableData.length <= 1) return;
  openMoveRowDialog(sourceIndex);
}

		// 兼容你的分页/搜索场景：如果有置顶/置底需求，可追加这两个函数（可选）
function moveRowToTop(rowIndex) {
  if (rowIndex === 0) return;
  beginOperation('move_row_top', '行置顶', { rowIndex });
  const movedItem = tableData.splice(rowIndex, 1)[0];
  tableData.unshift(movedItem);
  saveDataToIndexedDB();
  updateTable();
  showSnackbar('行已置顶', 'success');
  commitOperation();
}
function moveRowToBottom(rowIndex) {
  if (rowIndex === tableData.length -1) return;
  beginOperation('move_row_bottom', '行为置底', { rowIndex });
  const movedItem = tableData.splice(rowIndex, 1)[0];
  tableData.push(movedItem);
  saveDataToIndexedDB();
  updateTable();
  showSnackbar('行已置底', 'success');
  commitOperation();
}

		function deleteSelected() {
		  const sortedIndexes = Array.from(selectedRows).sort((a, b) => b - a);
		  sortedIndexes.forEach(index => tableData.splice(index, 1));
		  const deletedCount = sortedIndexes.length;
		  selectedRows.clear();
		  dom.selectAllCheckbox.checked = false;
		  saveDataToIndexedDB();
		  updateTable();
		  showSnackbar(`成功删除 ${deletedCount} 条数据`, 'success');
		}

		function openAddModal() {
		  openAddModalWithData({});
		}

    function openAddModalWithData(preFilledData) {
	keyboardState.isQuickEdit = false;
	saveKeyboardState();
    if (dom.dataForm) dom.dataForm.reset();
    if (dom.modalTitle) dom.modalTitle.textContent = '添加数据';
    if (dom.editIndex) dom.editIndex.value = '-1';

    currentEditIndex = -1;
    beginImageDraft(-1, '');
    beginDataEditStyleDraft(-1);

    // ★★★ 新增：彻底清理所有图片相关状态 ★★★
    const previewImg = document.getElementById('previewImg');
    if (previewImg) {
        previewImg.src = '';                    // 清空 src，防止闪现
        previewImg.removeAttribute('src');      // 双保险
    }

    const previewContainer = document.getElementById('cardImagePreview');
    const noImageArea = document.getElementById('noImageUploadArea');
    if (previewContainer && noImageArea) {
        previewContainer.style.display = 'none';
        noImageArea.style.display = 'block';
    }

    // 清理临时图片变量（防止保存时带入旧图）
    delete window.tempNewCardImage;

    // 填充预设数据（如果有）
    for (const key in preFilledData) {
        if (preFilledData.hasOwnProperty(key) && formElements[key]) {
            formElements[key].value = preFilledData[key];
        }
    }
initDataEditHistory();
 
     openCustomModal(dom.dataSheet);
     scheduleDataEditSessionSave();

    setTimeout(() => {
        // 再次确保图片区干净（防止 DOM 渲染延迟导致闪现）
        if (previewImg) {
            previewImg.src = '';
            previewImg.removeAttribute('src');
        }
        if (previewContainer && noImageArea) {
            previewContainer.style.display = 'none';
            noImageArea.style.display = 'block';
        }

        // 键盘逻辑保持不变...
        let inputToFocus = formElements.steelType;
		inputFields.forEach(field => {
			applyConfiguredKeyboardMode(field);
            if (field.id === 'steelType') inputToFocus = field;
        });

		activateConfiguredInput(inputToFocus);
    }, 350);
}

function findDuplicates(newItem) {
    const duplicates = [];
    tableData.forEach((existingItem, index) => {
        if (newItem.productId && newItem.productId.trim() !== '' &&
            existingItem.productId && existingItem.productId.trim() === newItem.productId.trim()) {
            duplicates.push({
                index,
                productId: newItem.productId,
                existingItem,
                newItem,
                differences: getObjectDifferences(existingItem, newItem)
            });
        }
    });
    return duplicates;
}

		function highlightAndScrollToRow(index) {
		  setTimeout(() => {
		    const row = document.querySelector(`tbody tr[data-index="${index}"]`);
		    if (row) {
		      document.querySelectorAll('#dataTable .highlight').forEach(r => r.classList.remove('highlight'));
		      row.classList.add('highlight');
		      setTimeout(() => row.classList.remove('highlight'), 2000);
		      const container = document.querySelector('.data-table-container');
		      if (container) {
		          const rowRect = row.getBoundingClientRect();
		          const containerRect = container.getBoundingClientRect();
		          const scrollTop = container.scrollTop;
		          const offset = rowRect.top - containerRect.top + scrollTop - (containerRect.height / 2) + (rowRect.height / 2);
		          container.scrollTo({ top: offset, behavior: 'smooth' });
		      } else {
		        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
		      }
		    }
		  }, 100);
		}

		function cloneCellStyleMap(styles) {
		    return JSON.parse(JSON.stringify(styles && typeof styles === 'object' ? styles : {}));
		}

		function canonicalCellStyleMap(styles) {
		    const result = {};
		    Object.keys(styles || {}).sort().forEach(field => {
		        const value = window.canonicalCellStyle ? window.canonicalCellStyle(styles[field]) : styles[field];
		        if (value && Object.keys(value).length) result[field] = value;
		    });
		    return result;
		}

		function applyDataEditFieldStylePreview(fieldId, styleOverride = null) {
		    const input = formElements[fieldId];
		    const shell = input?.closest('.m3-outlined-field');
		    if (!input || !shell) return;
		    const raw = styleOverride || dataEditStyleDraft?.styles?.[fieldId] || {};
		    const style = getEffectiveCellStyleFromRaw(raw);
		    input.style.fontFamily = style.fontName || '';
		    input.style.fontSize = `${Number(style.fontSize) || Number(appSettings.tableCellFontSize) || 16}px`;
		    input.style.color = normalizeStyleColor(style.color, '#212121');
		    input.style.fontWeight = style.bold ? 'bold' : 'normal';
		    input.style.fontStyle = style.italic ? 'italic' : 'normal';
		    input.style.textDecoration = style.underline ? 'underline' : 'none';
		    input.style.textAlign = ['left', 'center', 'right'].includes(style.horizontal) ? style.horizontal : 'left';
		    input.style.whiteSpace = style.wrapText ? 'pre-wrap' : '';
		    shell.style.backgroundColor = normalizeStyleColor(style.backgroundColor, getDefaultCellStyle().backgroundColor);
		    if (imagePreviewEditState?.active && imagePreviewEditState.fieldId === fieldId) {
		        imagePreviewEditState.applyStyle?.(fieldId);
		    }
		}

		function refreshDataEditStyleDraftDirty() {
		    if (!dataEditStyleDraft) return;
		    const current = canonicalCellStyleMap(dataEditStyleDraft.styles);
		    const original = canonicalCellStyleMap(dataEditStyleDraft.originalStyles);
		    dataEditStyleDraft.styles = current;
		    dataEditStyleDraft.dirty = JSON.stringify(current) !== JSON.stringify(original);
		}

		function beginDataEditStyleDraft(index) {
		    const originalStyles = index >= 0 ? cloneCellStyleMap(tableData[index]?.__cellStyles) : {};
		    dataEditStyleDraft = {
		        index,
		        originalStyles,
		        styles: cloneCellStyleMap(originalStyles),
		        dirty: false
		    };
		    inputFieldOrder.forEach(applyDataEditFieldStylePreview);
		}

function clearDataEditSessionDraft() {
            clearTimeout(dataEditSessionSaveTimer);
            dataEditSessionSaveTimer = null;
            try { localStorage.removeItem(DATA_EDIT_SESSION_KEY); } catch (error) {}
        }

        function persistDataEditSessionDraft(options = {}) {
            const force = Boolean(options.force);
            if (!force && (!dom.dataSheet || !(dom.dataSheet.open === true || dom.dataSheet.hasAttribute('open')))) return false;
            const content = document.getElementById('dataSheetContent');
            const activeId = document.activeElement && inputFieldOrder.includes(document.activeElement.id)
                ? document.activeElement.id
                : (currentInput && inputFieldOrder.includes(currentInput.id) ? currentInput.id : '');
            const payload = {
                version: 1,
                suspended: Boolean(options.suspended),
                documentName: currentDocumentName || '',
                mode: currentEditIndex >= 0 ? 'edit' : 'add',
                index: currentEditIndex,
                rowIdentity: currentEditIndex >= 0 ? {
                    productId: String(tableData[currentEditIndex]?.productId || ''),
                    cardId: String(tableData[currentEditIndex]?.cardId || ''),
                    furnaceId: String(tableData[currentEditIndex]?.furnaceId || '')
                } : null,
                state: getDataEditState(),
                scrollTop: Number(content?.scrollTop) || 0,
                activeFieldId: activeId,
                imagePreviewOpen: !!imagePreviewEditState?.active,
                imagePreviewFieldId: imagePreviewEditState?.fieldId || '',
                savedAt: Date.now()
            };
            try {
                localStorage.setItem(DATA_EDIT_SESSION_KEY, JSON.stringify(payload));
                return true;
            } catch (error) {
                try {
                    payload.state.image = '';
                    payload.imageOmitted = true;
                    localStorage.setItem(DATA_EDIT_SESSION_KEY, JSON.stringify(payload));
                    return true;
                } catch (fallbackError) {}
            }
            return false;
        }

        function scheduleDataEditSessionSave() {
            clearTimeout(dataEditSessionSaveTimer);
            dataEditSessionSaveTimer = setTimeout(persistDataEditSessionDraft, 120);
        }

        function getPersistedDataEditSession() {
            let draft = null;
            try { draft = JSON.parse(localStorage.getItem(DATA_EDIT_SESSION_KEY) || 'null'); } catch (error) {}
            if (!draft || draft.version !== 1 || draft.documentName !== (currentDocumentName || '')) return null;
            return draft;
        }

        function restorePersistedDataEditSession(options = {}) {
            const draft = getPersistedDataEditSession();
            if (!draft || (draft.suspended && !options.includeSuspended)) return false;
            const isEdit = draft.mode === 'edit';
            let index = Number(draft.index);
            if (isEdit) {
                const identity = draft.rowIdentity || {};
                const matchesIdentity = item => !!item
                    && String(item.productId || '') === String(identity.productId || '')
                    && String(item.cardId || '') === String(identity.cardId || '')
                    && String(item.furnaceId || '') === String(identity.furnaceId || '');
                if (!Number.isInteger(index) || !matchesIdentity(tableData[index])) {
                    index = tableData.findIndex(matchesIdentity);
                }
                if (index < 0) {
                    clearDataEditSessionDraft();
                    return false;
                }
            }
            if (isEdit) openEditModal(index, draft.activeFieldId || null);
            else openAddModalWithData({});
            clearTimeout(dataEditSessionSaveTimer);
            dataEditSessionSaveTimer = null;
            requestAnimationFrame(() => requestAnimationFrame(() => {
                restoreDataEditState(draft.state || {});
                initDataEditHistory();
                const content = document.getElementById('dataSheetContent');
                if (content) content.scrollTop = Math.max(0, Number(draft.scrollTop) || 0);
                const input = formElements[draft.activeFieldId];
                if (input) {
                    currentInput = input;
                    input.focus({ preventScroll: true });
                    try { input.setSelectionRange(input.value.length, input.value.length); } catch (error) {}
                }
                // 刷新前若正在图片预览编辑，恢复同一个预览层和字段。
                // 图片草稿恢复后再打开，避免预览层拿到旧的空值。
                if (draft.imagePreviewOpen && typeof showFullImage === 'function') {
                    const image = String(draft.state?.image || '');
                    if (image) {
                        showFullImage(image, formElements.productId?.value || '', currentEditIndex);
                        const previewState = imagePreviewEditState;
                        const previewFieldId = draft.imagePreviewFieldId;
                        if (previewState && previewFieldId && inputFieldOrder.includes(previewFieldId)
                            && previewState.fieldId !== previewFieldId) {
                            const steps = inputFieldOrder.indexOf(previewFieldId) - inputFieldOrder.indexOf(previewState.fieldId);
                            if (steps) switchImagePreviewField(steps);
                        }
                    }
                }
                persistDataEditSessionDraft();
            }));
            return true;
        }

        function suspendCurrentDataEditSession() {
            if (currentEditIndex !== -1) return false;
            return persistDataEditSessionDraft({ suspended: true, force: true });
        }

        function resumeSuspendedDataEditSession() {
            const draft = getPersistedDataEditSession();
            if (!draft?.suspended || draft.mode !== 'add') return false;
            return restorePersistedDataEditSession({ includeSuspended: true });
        }

		function getDataEditState() {
 		    const values = {};
		    Object.keys(formElements).forEach(key => {
		        values[key] = String(formElements[key]?.value ?? '');
		    });
		    return {
		        values,
		        image: String(window.__rsdbImageDraft?.value ?? window.tempNewCardImage ?? ''),
		        styles: cloneCellStyleMap(dataEditStyleDraft?.styles || {})
		    };
		}

		function dataEditStatesEqual(a, b) {
		    return JSON.stringify(a || {}) === JSON.stringify(b || {});
		}

		function updateDataEditHistoryButtons() {
		    if (dom.dataEditUndoBtn) dom.dataEditUndoBtn.disabled = !dataEditHistory.past.length;
		    if (dom.dataEditRedoBtn) dom.dataEditRedoBtn.disabled = !dataEditHistory.future.length;
		}

		function initDataEditHistory() {
		    dataEditHistory = { past: [], future: [], last: getDataEditState(), applying: false };
		    updateDataEditHistoryButtons();
		}

		function resetDataEditHistory() {
		    dataEditHistory = { past: [], future: [], last: null, applying: false };
		    updateDataEditHistoryButtons();
		}

		function recordDataEditState(previousState = null) {
		    if (dataEditHistory.applying || !dataEditHistory.last) return;
		    const next = getDataEditState();
		    if (dataEditStatesEqual(next, dataEditHistory.last)) return;
		    const previous = previousState || dataEditHistory.last;
		    if (!previous || dataEditStatesEqual(next, previous)) return;
		    dataEditHistory.past.push(previous);
		    const limit = Math.max(20, Math.min(200, Number(appSettings.undoRedoMaxSteps) || 50));
		    if (dataEditHistory.past.length > limit) dataEditHistory.past.splice(0, dataEditHistory.past.length - limit);
dataEditHistory.last = next;
 		    dataEditHistory.future = [];
 		    updateDataEditHistoryButtons();
            scheduleDataEditSessionSave();
		}

		function restoreDataEditState(state) {
		    if (!state) return;
		    dataEditHistory.applying = true;
		    Object.keys(formElements).forEach(key => {
		        if (formElements[key]) formElements[key].value = state.values?.[key] ?? '';
		    });
		    if (window.__rsdbImageDraft) setImageDraftValue(state.image || '');
		    else window.tempNewCardImage = state.image || '';
		    if (dataEditStyleDraft) {
		        dataEditStyleDraft.styles = cloneCellStyleMap(state.styles || {});
		        refreshDataEditStyleDraftDirty();
		        inputFieldOrder.forEach(applyDataEditFieldStylePreview);
		        if (dataCellStyleContext?.fieldId) {
		            const rawCurrent = dataEditStyleDraft.styles[dataCellStyleContext.fieldId] || {};
		            loadCellStyleControls(rawCurrent, getEffectiveCellStyleFromRaw(rawCurrent), `${fieldLabels[dataCellStyleContext.fieldId] || dataCellStyleContext.fieldId} · 单元格格式`);
		        }
		    }
		    renderImageDraftPreview();
		    dataEditHistory.applying = false;
		    updateDataEditHistoryButtons();
		}

		function dataEditUndo() {
		    if (!dataEditHistory.past.length) return;
		    const target = dataEditHistory.past.pop();
		    dataEditHistory.future.unshift(dataEditHistory.last);
		    dataEditHistory.last = target;
		    restoreDataEditState(target);
		}

		function dataEditRedo() {
		    if (!dataEditHistory.future.length) return;
		    const target = dataEditHistory.future.shift();
		    dataEditHistory.past.push(dataEditHistory.last);
		    dataEditHistory.last = target;
		    restoreDataEditState(target);
		}

		function restoreQuickEditStylePanel() {
		    const panel = document.getElementById('quickEditStylePanel');
		    const anchor = dom.quickEditStylePanelAnchor;
		    if (panel && anchor && panel.previousElementSibling !== anchor) anchor.after(panel);
		}

		function discardDataEditStyleDraft() {
		    dataCellStyleContext = null;
		    restoreQuickEditStylePanel();
		    if (dom.dataCellStyleDialog) dom.dataCellStyleDialog.open = false;
		    dataEditStyleDraft = null;
		    window.__rsdbEditingCell = null;
		    resetDataEditHistory();
		}

		function loadCellStyleControls(rawCurrent, current, targetLabel) {
		    const setVal = (id, val) => {
		        const el = document.getElementById(id);
		        if (el) el.value = val == null ? '' : String(val);
		    };
		    const targetText = document.getElementById('cellStyleTargetText');
		    if (targetText) targetText.textContent = targetLabel;
		    setVal('cellStyleFontNameInput', rawCurrent.fontName || '');
		    setVal('cellStyleFontSizeInput', current.fontSize);
		    setVal('cellStyleTextColorInput', current.color);
		    setVal('cellStyleBgColorInput', current.backgroundColor);
		    setVal('cellStyleAlignInput', current.horizontal);
		    setVal('cellStyleNumberFormatInput', current.numFmt || 'General');
		    updateCellAlignPickerUI();
		    const setChecked = (id, checked) => {
		        const el = document.getElementById(id);
		        if (el) el.checked = !!checked;
		    };
		    setChecked('cellStyleBoldInput', !!rawCurrent.bold || rawCurrent.fontWeight === 'bold');
		    setChecked('cellStyleItalicInput', !!rawCurrent.italic);
		    setChecked('cellStyleUnderlineInput', !!rawCurrent.underline);
		    setChecked('cellStyleWrapInput', !!rawCurrent.wrapText);
		    requestAnimationFrame(() => window.previewCurrentCellStyle?.());
		}

		function finishDataCellStyleDialog({ commit = true, skipClose = false } = {}) {
		    if (!dataCellStyleContext) {
		        restoreQuickEditStylePanel();
		        return;
		    }
		    const fieldId = dataCellStyleContext.fieldId;
		    if (commit && dataEditStyleDraft) {
		        const style = window.getPendingCellStyleObject?.() || {};
		        if (Object.keys(style).length) dataEditStyleDraft.styles[fieldId] = style;
		        else delete dataEditStyleDraft.styles[fieldId];
		        refreshDataEditStyleDraftDirty();
		        applyDataEditFieldStylePreview(fieldId);
		    }
		    dataCellStyleContext = null;
		    cellStylePickerReturnContext = null;
		    window.__rsdbEditingCell = null;
		    restoreQuickEditStylePanel();
		    if (!skipClose && dom.dataCellStyleDialog) {
		        dataCellStyleDialogClosing = true;
		        dom.dataCellStyleDialog.open = false;
		    }
		}

		function openDataCellStyleDialog(fieldId) {
		    if (!fieldId || !formElements[fieldId]) return;
		    if (!dataEditStyleDraft) beginDataEditStyleDraft(currentEditIndex);
		    const panel = document.getElementById('quickEditStylePanel');
		    if (!panel || !dom.dataCellStylePanelHost || !dom.dataCellStyleDialog) return;
		    const rawCurrent = cloneCellStyleMap(dataEditStyleDraft.styles)[fieldId] || {};
		    const current = getEffectiveCellStyleFromRaw(rawCurrent);
		    dataCellStyleDialogClosing = false;
		    cellStylePickerReturnContext = null;
		    dataCellStyleContext = { fieldId };
		    window.__rsdbEditingCell = { row: currentEditIndex, index: currentEditIndex, field: fieldId, dataEdit: true };
		    dom.quickEditInput.value = formElements[fieldId].value || '';
		    dom.quickEditField.value = fieldId;
		    dom.quickEditIndex.value = currentEditIndex;
		    if (dom.dataCellStyleDialogTitle) dom.dataCellStyleDialogTitle.textContent = `${fieldLabels[fieldId] || fieldId} · 编辑属性`;
		    loadCellStyleControls(rawCurrent, current, `${fieldLabels[fieldId] || fieldId} · 单元格格式`);
		    dom.dataCellStylePanelHost.appendChild(panel);
		    initQuickEditHistory();
		    setVirtualKeyboardVisible(false);
		    dom.dataCellStyleDialog.open = true;
		}

		function openQuickEdit(index, fieldId) {
		    restoreQuickEditStylePanel();
		    const item = tableData[index];
		    const fieldName = fieldLabels[fieldId] || fieldId;

		    dom.quickEditLabel.textContent = fieldName;
		    dom.quickEditInput.value = item[fieldId] || '';
		    dom.quickEditIndex.value = index;
		    dom.quickEditField.value = fieldId;
		    openCellStyleDialog(index, fieldId);
		    initQuickEditHistory();
		    window.__rsdbOriginalCellEdit = {
		        value: item[fieldId] || '',
		        style: JSON.parse(JSON.stringify(getCellFormat(index, fieldId) || {}))
		    };

		    dom.quickEditInput.removeAttribute('readonly');
		    dom.quickEditInput.classList.remove('readonly-input');
		    dom.quickEditInput.classList.toggle('quick-edit-remarks', fieldId === 'remarks');
		    dom.quickEditInput.style.minHeight = fieldId === 'remarks' ? '200px' : '56px';
		    dom.quickEditInput.style.height = fieldId === 'remarks' ? '200px' : '56px';
		    dom.quickEditInput.style.resize = fieldId === 'remarks' ? 'vertical' : 'none';

		    openCustomModal(dom.quickEditDialog);

		    currentInput = dom.quickEditInput;

		    // 快速编辑按字段设置选择键盘；备注默认使用系统键盘。
		    keyboardState.isQuickEdit = true;
		    saveKeyboardState();
		    window.setQuickEditKeyboardMode?.(isVirtualKeyboardConfigured(fieldId));
		    requestAnimationFrame(() => {
		        window.previewCurrentCellStyle?.();
		        window.updateQuickEditKeyboardToggleUI?.();
	    });
		}

		function getQuickEditState() {
		    const get = (id, fallback = '') => document.getElementById(id)?.value ?? fallback;
		    const checked = (id) => !!document.getElementById(id)?.checked;
		    return {
		        value: String(dom.quickEditInput?.value || ''),
		        selectionStart: Number(dom.quickEditInput?.selectionStart) || 0,
		        selectionEnd: Number(dom.quickEditInput?.selectionEnd) || 0,
		        fontName: String(get('cellStyleFontNameInput')),
		        fontSize: String(get('cellStyleFontSizeInput')),
		        color: String(get('cellStyleTextColorInput')),
		        backgroundColor: String(get('cellStyleBgColorInput')),
		        horizontal: String(get('cellStyleAlignInput', 'general')),
		        numFmt: String(get('cellStyleNumberFormatInput', 'General')),
		        bold: checked('cellStyleBoldInput'),
		        italic: checked('cellStyleItalicInput'),
		        underline: checked('cellStyleUnderlineInput'),
		        wrapText: checked('cellStyleWrapInput')
		    };
		}

		function quickEditStatesEqual(a, b) {
		    return JSON.stringify(a || {}) === JSON.stringify(b || {});
		}

		function updateQuickEditHistoryButtons() {
		    if (dom.quickEditUndoBtn) dom.quickEditUndoBtn.disabled = !quickEditHistory.past.length;
		    if (dom.quickEditRedoBtn) dom.quickEditRedoBtn.disabled = !quickEditHistory.future.length;
		    if (dom.dataCellStyleUndoBtn) dom.dataCellStyleUndoBtn.disabled = !quickEditHistory.past.length;
		    if (dom.dataCellStyleRedoBtn) dom.dataCellStyleRedoBtn.disabled = !quickEditHistory.future.length;
		}

		function initQuickEditHistory() {
		    quickEditHistory = {
		        past: [],
		        future: [],
		        last: getQuickEditState(),
		        pendingBeforeInput: null,
		        composing: false,
		        compositionStart: null
		    };
		    updateQuickEditHistoryButtons();
		}

		function recordQuickEditState(previousState = null) {
		    if (quickEditHistoryApplying || !window.__rsdbEditingCell) return;
		    const next = getQuickEditState();
		    if (quickEditStatesEqual(next, quickEditHistory.last)) return;
		    const previous = previousState || quickEditHistory.last;
		    if (!previous || quickEditStatesEqual(next, previous)) return;
		    quickEditHistory.past.push(previous);
		    const limit = Math.max(20, Math.min(200, Number(appSettings.undoRedoMaxSteps) || 50));
		    if (quickEditHistory.past.length > limit) quickEditHistory.past.splice(0, quickEditHistory.past.length - limit);
		    quickEditHistory.last = next;
		    quickEditHistory.future = [];
		    updateQuickEditHistoryButtons();
		}
		window.getQuickEditState = getQuickEditState;
		window.recordQuickEditState = recordQuickEditState;

		function restoreQuickEditState(state) {
		    if (!state) return;
		    quickEditHistoryApplying = true;
		    const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value ?? ''; };
		    set('cellStyleFontNameInput', state.fontName);
		    set('cellStyleFontSizeInput', state.fontSize);
		    set('cellStyleTextColorInput', state.color);
		    set('cellStyleBgColorInput', state.backgroundColor);
		    set('cellStyleAlignInput', state.horizontal || 'general');
		    set('cellStyleNumberFormatInput', state.numFmt || 'General');
		    updateCellAlignPickerUI();
		    ['Bold', 'Italic', 'Underline', 'Wrap'].forEach((name) => {
		        const el = document.getElementById(`cellStyle${name}Input`);
		        if (el) el.checked = !!state[name === 'Wrap' ? 'wrapText' : name.toLowerCase()];
		    });
		    if (dom.quickEditInput) dom.quickEditInput.value = state.value || '';
		    window.previewCurrentCellStyle?.();
		    if (dataCellStyleContext) {
		        applyDataEditFieldStylePreview(
		            dataCellStyleContext.fieldId,
		            window.getPendingCellStyleObject?.() || {}
		        );
		    } else if (dom.quickEditInput) {
		        const length = dom.quickEditInput.value.length;
		        const start = Math.max(0, Math.min(length, Number(state.selectionStart) || 0));
		        const end = Math.max(start, Math.min(length, Number(state.selectionEnd) || start));
		        dom.quickEditInput.focus({ preventScroll: true });
		        try { dom.quickEditInput.setSelectionRange(start, end); } catch (error) {}
		        setTimeout(updateVirtualCursor, 0);
		    }
		    quickEditHistoryApplying = false;
		    updateQuickEditHistoryButtons();
		}

		function finalizeQuickEditComposition() {
		    if (!quickEditHistory.composing) return;
		    const before = quickEditHistory.compositionStart;
		    quickEditHistory.composing = false;
		    quickEditHistory.compositionStart = null;
		    quickEditHistory.pendingBeforeInput = null;
		    recordQuickEditState(before);
		}

		function quickEditUndo() {
		    finalizeQuickEditComposition();
		    if (!quickEditHistory.past.length) return;
		    const target = quickEditHistory.past.pop();
		    quickEditHistory.future.unshift(quickEditHistory.last);
		    quickEditHistory.last = target;
		    restoreQuickEditState(target);
		}

		function quickEditRedo() {
		    finalizeQuickEditComposition();
		    if (!quickEditHistory.future.length) return;
		    const target = quickEditHistory.future.shift();
		    quickEditHistory.past.push(quickEditHistory.last);
		    quickEditHistory.last = target;
		    restoreQuickEditState(target);
		}
		function saveQuickEdit() {
		    const index = parseInt(dom.quickEditIndex.value);
		    const fieldId = dom.quickEditField.value;
		    const newValue = dom.quickEditInput.value;

		    if (index >= 0 && index < tableData.length) {
		        const targets = isCellMultiSelectMode && selectedCells.size
		            ? getCellSelectionKeys().filter(target => target.field !== 'seq')
		            : [{ row: index, field: fieldId }];
		        const pendingStyle = window.getPendingCellStyleObject?.() || {};
		        const originalValue = String(window.__rsdbOriginalCellEdit?.value ?? '');
		        const valueChanged = newValue.trim() !== originalValue.trim();
		        const styleChanged = targets.some(target => !window.areCellStylesEqual?.(getCellFormat(target.row, target.field), pendingStyle));

		        // 未修改时不做数字校验，也不创建历史记录，避免原样保存被误报为非法数字。
		        if (!valueChanged && !styleChanged) {
		            closeCustomModal(dom.quickEditDialog);
		            setVirtualKeyboardVisible(false);
		            keyboardState.isQuickEdit = false;
		            saveKeyboardState();
		            window.__rsdbEditingCell = null;
		            window.__rsdbOriginalCellEdit = null;
		            showSnackbar('没有检测到更改', 'info');
		            return true;
		        }

		        const validationValue = newValue.trim();
		        if (valueChanged && ['actualDiameter', 'diameter', 'length', 'weight', 'hardness'].includes(fieldId) && isNaN(parseFloat(validationValue)) && validationValue.length > 0) {
		            showSnackbar('请输入有效的数字或留空', 'error');
		            return false;
		        }

		        beginOperation('edit_field', isCellMultiSelectMode && selectedCells.size > 1 ? '批量快速修改：' + selectedCells.size + ' 个单元格' : '快速修改：' + (fieldLabels[fieldId] || fieldId));
		        const styleApplied = window.saveCurrentCellStyle?.(targets) !== false;
		        const styleVerified = targets.every(target => window.areCellStylesEqual?.(
		            getCellFormat(target.row, target.field),
		            pendingStyle
		        ));
		        if (styleChanged && (!styleApplied || !styleVerified)) {
		            window.__rsdbPendingOp = null;
		            showSnackbar('格式保存失败，请重试', 'error');
		            return false;
		        }
		        targets.forEach(target => {
		            if (tableData[target.row]) {
		                tableData[target.row][target.field] = newValue.trim();
		                if (tableData[target.row].__cellDisplayValues) delete tableData[target.row].__cellDisplayValues[target.field];
		            }
		        });
		        saveDataToIndexedDB();
		        updateTable();
		        commitOperation();
		        closeCustomModal(dom.quickEditDialog);
		        setVirtualKeyboardVisible(false);
		        showSnackbar('快速修改已保存', 'success');
		        window.__rsdbEditingCell = null;
		        window.__rsdbOriginalCellEdit = null;

		keyboardState.isQuickEdit = false;
		saveKeyboardState();
		        return true;
		    }
		    return false;
		}

        function openCellStyleDialog(index, fieldId) {
            if (!Number.isFinite(index) || index < 0) return;
            if (!fieldId) return;
            window.__rsdbEditingCell = { row: index, index, field: fieldId };
            if (dom.cellFontPickerDialog) dom.cellFontPickerDialog.open = false;
            if (dom.cellColorPaletteDialog) dom.cellColorPaletteDialog.open = false;
            if (dom.cellAlignPickerDialog) dom.cellAlignPickerDialog.open = false;
            const fontSearch = document.getElementById('cellFontSearchInput');
            if (fontSearch) fontSearch.value = '';
            const rawCurrent = getCellFormat(index, fieldId) || {};
            const current = getEffectiveCellStyle(index, fieldId);
            loadCellStyleControls(rawCurrent, current, `第 ${index + 1} 行 · ${fieldLabels[fieldId] || fieldId} · 单元格格式`);
        }

		// ==================== 搜索与替换优化版（支持自动翻页跳转）===================

function startSearch() {
    const query = dom.searchInput.value.trim().toLowerCase();
    searchTerm = query;

    searchMatches = [];
    currentMatchIndex = -1;

    if (!query) {
        isSearchActive = false;
        applySearchHighlight();
        dom.replaceOneBtn.disabled = true;
        dom.replaceAllBtn.disabled = true;
        updateCurrentMatchUI(); // ✅ 新增：清空搜索时同步更新计数
        updateTable(); 
        return;
    }

    // 构建匹配项
    tableData.forEach((item, index) => {
        const normalizedValues = getNormalizedSearchValues(item);
        searchableFields.forEach((field, fieldIndex) => {
            const value = normalizedValues[fieldIndex];
            if (value.includes(query)) {
                searchMatches.push({ rowIndex: index, field });
            }
        });
    });

    isSearchActive = true;
    const hasMatches = searchMatches.length > 0;
    dom.replaceOneBtn.disabled = !hasMatches;
    dom.replaceAllBtn.disabled = !hasMatches;

    currentPage = 1;
    updateTable();

    if (hasMatches) {
        currentMatchIndex = 0;
        updateCurrentMatchUI(); // ✅ 核心：搜索成功后立即更新计数+高亮，替代原jumpToMatch
    } else {
        applySearchHighlight();
        showSnackbar('未找到匹配项', 'info');
        updateCurrentMatchUI(); // ✅ 新增：无匹配时同步更新计数
    }
}

		function openEditModal(index, targetFieldId = null) {
		    keyboardState.isQuickEdit = false;
		    saveKeyboardState();
		    currentEditIndex = index;
		    if (dom.editIndex) dom.editIndex.value = index;

		    const item = tableData[index];
		    beginImageDraft(index, item?.cardImage || '');
		    beginDataEditStyleDraft(index);

		    // 填充表单字段
		    for (const key in formElements) {
		        if (formElements.hasOwnProperty(key)) {
		            formElements[key].value = item[key] || '';
		        }
		    }
		    initDataEditHistory();

dom.modalTitle.textContent = '编辑数据';
 		    openCustomModal(dom.dataSheet);
            scheduleDataEditSessionSave();

		   setTimeout(() => {
		    const previewContainer = document.getElementById('cardImagePreview');
		    const noImageArea = document.getElementById('noImageUploadArea');
		    const previewImg = document.getElementById('previewImg');

		    if (item.cardImage && item.cardImage.startsWith('data:image/')) {
		        previewImg.src = item.cardImage;
		        previewContainer.style.display = 'block';
		        noImageArea.style.display = 'none';  // 隐藏上传按钮
		    } else {
		        previewContainer.style.display = 'none';
		        noImageArea.style.display = 'block'; // 显示上传按钮
		    }

		        // 输入框和键盘逻辑
		        let inputToFocus = formElements.steelType;

		        inputFields.forEach(field => {
		            applyConfiguredKeyboardMode(field);
		            if (field.id === 'steelType') inputToFocus = field;
		        });

		        if (targetFieldId && formElements[targetFieldId]) {
		            inputToFocus = formElements[targetFieldId];
		        }

		        activateConfiguredInput(inputToFocus);

		        // 平滑滚动到当前输入框
		        const modalContent = document.getElementById('dataSheetContent');
		        if (modalContent) {
		            const inputRect = currentInput.getBoundingClientRect();
		            const modalRect = modalContent.getBoundingClientRect();
		            const offset = inputRect.top - modalRect.top + modalContent.scrollTop - modalRect.height * 0.3;
		            modalContent.scrollTo({ top: offset, behavior: 'smooth' });
		        }
		        bindEditModalImageButtons();
		    }, 350);
		}

		function closeVirtualKeyboardAndKeepReadOnly() {
		    commitImeComposition();
		    setVirtualKeyboardVisible(false);
		    currentInput = null;
            updateVirtualCursor();
		}

		/* ==================== 虚拟键盘核心逻辑 ==================== */

		function saveKeyboardState() {
		  localStorage.setItem('keyboardState', JSON.stringify(keyboardState));
		}

		function toggleShift() {
		  switch (keyboardState.shiftState) {
		    case 'locked-on':   
		      keyboardState.shiftState = 'off';
		      break;
		    case 'off':         
		      keyboardState.shiftState = 'on';
		      break;
		    case 'on':          
		      keyboardState.shiftState = 'locked-on';
		      break;
		  }
		  imeState.englishCandidatesDismissed = false;
		  if (keyboardState.imeLanguage === 'english' && keyboardState.shiftState === 'locked-on') {
		      imeState.candidates = [];
		      imeState.page = 0;
		  }
		  saveKeyboardState();
		  generateVirtualKeyboard();
		}

		const IME_TEXT_KEYBOARD_TYPES = new Set(['text', 'cardId', 'steelType', 'productId', 'furnaceId']);
		const IME_SCHEME_LABELS = { smart: '拼音' };

		function isImeDictionaryEnabled() {
		    if (!window.RSDBInputMethodLibrary || !isImeTextKeyboard()) return false;
            if (keyboardState.imeLanguage === 'none') return false;
            if (keyboardState.imeLanguage === 'english' && keyboardState.englishWordMode === false) return false;
		    return !(keyboardState.imeLanguage === 'english' && keyboardState.shiftState === 'locked-on');
		}

		function hasPendingImeConfirmation() {
		    if (!isImeDictionaryEnabled()) return false;
		    if (keyboardState.imeLanguage === 'chinese') return !!imeState.composition;
		    return !imeState.englishCandidatesDismissed && imeState.candidates.length > 0;
		}

		function isCurrentKeyboardLastInput() {
		    const activeInput = document.querySelector('.rsdb-active-input') || currentInput;
		    if (activeInput?.id && inputFieldOrder.includes(activeInput.id)) {
		        return activeInput.id === inputFieldOrder[inputFieldOrder.length - 1];
		    }
		    if (keyboardState.isQuickEdit) return false;
		    if (activeInput?.closest?.('#calculatorForm')) return activeInput.id === 'calcLength';
		    const fieldId = imagePreviewEditState?.active ? imagePreviewEditState.fieldId : activeInput?.id;
		    return fieldId === inputFieldOrder[inputFieldOrder.length - 1];
		}

		function updateVirtualKeyboardActionKeys() {
		    const pendingIme = hasPendingImeConfirmation();
		    const doneKey = document.getElementById('virtualKeyboardDoneKey');
		    if (doneKey && !doneKey.classList.contains('swipe-close')) {
		        if (pendingIme) {
		            doneKey.innerHTML = '<mdui-icon name="keyboard_return"></mdui-icon>';
		            doneKey.title = '确认当前输入';
		            doneKey.setAttribute('aria-label', '回车');
		        } else if (keyboardState.isQuickEdit) {
		            doneKey.textContent = '✔';
		            doneKey.title = '完成编辑';
		            doneKey.setAttribute('aria-label', '完成编辑');
		        } else if (isCurrentKeyboardLastInput()) {
		            doneKey.textContent = '完成';
		            doneKey.title = '完成输入';
		            doneKey.setAttribute('aria-label', '完成');
		        } else {
		            doneKey.textContent = '▼';
		            doneKey.title = '下一个编辑框';
		            doneKey.setAttribute('aria-label', '下一个');
		        }
		    }

		    const toolbarNext = dom?.shortcutNextInputBtn || document.getElementById('shortcutNextInputBtn');
		    if (toolbarNext) {
		        const isLast = isCurrentKeyboardLastInput();
		        toolbarNext.setAttribute('icon', pendingIme ? 'keyboard_return' : (isLast ? 'done' : 'arrow_downward'));
		        toolbarNext.setAttribute('title', pendingIme ? '确认当前输入' : (isLast ? '完成输入' : '下一个编辑框'));
		        toolbarNext.setAttribute('aria-label', pendingIme ? '回车' : (isLast ? '完成' : '下一个编辑框'));
		    }
		}

		function getImeCandidatePageSize() {
            return appSettings.desktopModeEnabled === true ? 9 : Math.max(1, imeState.candidates.length);
        }

		function confirmPendingImeInput() {
		    if (!hasPendingImeConfirmation()) return false;
		    if (keyboardState.imeLanguage === 'chinese') {
		        commitImeComposition();
		        return true;
		    }
		    selectImeCandidate(imeState.page * getImeCandidatePageSize());
		    return true;
		}

		function createEmptyImeLearningState() {
		    return { version: 1, contexts: {}, global: {} };
		}

		function loadImeLearningState() {
		    try {
		        const parsed = JSON.parse(localStorage.getItem(IME_LEARNING_KEY) || 'null');
		        if (parsed && parsed.version === 1 && parsed.contexts && parsed.global) return sanitizeImeLearningState(parsed);
		    } catch (e) {
		        console.warn('输入法学习记录读取失败，已使用空记录', e);
		    }
		    return createEmptyImeLearningState();
		}

		function sanitizeImeLearningState(source) {
		    const clean = createEmptyImeLearningState();
		    if (!source || typeof source !== 'object') return clean;
		    const normalizeUsage = usage => ({
		        count: Math.max(0, Math.min(9999, Math.floor(Number(usage?.count) || 0))),
		        lastUsed: Math.max(0, Math.floor(Number(usage?.lastUsed) || 0))
		    });
		    Object.entries(source.contexts && typeof source.contexts === 'object' ? source.contexts : {})
		        .filter(([key, value]) => typeof key === 'string' && key.length <= 160 && value && typeof value === 'object')
		        .sort((left, right) => Number(right[1]?.lastUsed || 0) - Number(left[1]?.lastUsed || 0))
		        .slice(0, 300)
		        .forEach(([key, value]) => {
		            const candidates = {};
		            Object.entries(value.candidates && typeof value.candidates === 'object' ? value.candidates : {})
		                .slice(0, 120)
		                .forEach(([text, usage]) => {
		                    const normalizedText = String(text || '').trim();
		                    if (!normalizedText || normalizedText.length > 80) return;
		                    const normalizedUsage = normalizeUsage(usage);
		                    if (normalizedUsage.count > 0) candidates[normalizedText] = normalizedUsage;
		                });
		            if (Object.keys(candidates).length) clean.contexts[key] = {
		                lastUsed: Math.max(0, Math.floor(Number(value.lastUsed) || 0)),
		                candidates
		            };
		        });
		    Object.entries(source.global && typeof source.global === 'object' ? source.global : {})
		        .sort((left, right) => Number(right[1]?.lastUsed || 0) - Number(left[1]?.lastUsed || 0))
		        .slice(0, 12000)
		        .forEach(([key, usage]) => {
		            if (typeof key !== 'string' || !key || key.length > 100) return;
		            const normalizedUsage = normalizeUsage(usage);
		            if (normalizedUsage.count > 0) clean.global[key] = normalizedUsage;
		        });
		    return clean;
		}

		function persistImeLearningState() {
		    imeLearningState = sanitizeImeLearningState(imeLearningState);
		    localStorage.setItem(IME_LEARNING_KEY, JSON.stringify(imeLearningState));
		}

		function scheduleImeLearningSave() {
		    clearTimeout(imeLearningSaveTimer);
		    imeLearningSaveTimer = setTimeout(() => {
		        try {
		            const contextKeys = Object.keys(imeLearningState.contexts || {});
		            if (contextKeys.length > 300) {
		                contextKeys
		                    .sort((a, b) => Number(imeLearningState.contexts[b]?.lastUsed || 0) - Number(imeLearningState.contexts[a]?.lastUsed || 0))
		                    .slice(300)
		                    .forEach(key => delete imeLearningState.contexts[key]);
		            }
		            persistImeLearningState();
		        } catch (e) {
		            console.warn('输入法学习记录保存失败', e);
		        }
		    }, 120);
		}

		function getImeLearningContextKey(code, kind) {
		    const normalized = String(code || '').toLowerCase().replace(/[^a-zv]/g, '');
		    if (!normalized) return '';
		    return kind === 'english'
		        ? `english:${normalized}`
		        : `chinese:pinyin:${normalized}`;
		}

		function parseImeLearningContextKey(contextKey) {
		    const parts = String(contextKey || '').split(':');
		    if (parts[0] === 'english') return { kind: 'english', code: parts.at(-1) || '' };
		    if (parts[0] === 'chinese') return { kind: 'chinese', code: parts.at(-1) || '' };
		    return null;
		}

		function getImeLearnedCandidatesForPrefix(code, kind = 'chinese', limit = 32) {
		    const normalized = String(code || '').toLowerCase().replace(/[^a-zv]/g, '');
		    if (!normalized) return [];
		    const merged = new Map();
		    Object.entries(imeLearningState.contexts || {}).forEach(([contextKey, context]) => {
		        const metadata = parseImeLearningContextKey(contextKey);
		        if (!metadata || metadata.kind !== kind) return;
                const initials = kind === 'chinese' ? window.RSDBInputMethodLibrary?.getPinyinInitials?.(metadata.code) || '' : '';
                if (!metadata.code.startsWith(normalized) && !initials.startsWith(normalized)) return;
		        Object.entries(context?.candidates || {}).forEach(([text, usage]) => {
		            const current = merged.get(text) || { count: 0, lastUsed: 0 };
		            current.count += Number(usage?.count || 0);
		            current.lastUsed = Math.max(current.lastUsed, Number(usage?.lastUsed || 0));
		            merged.set(text, current);
		        });
		    });
		    return Array.from(merged.entries())
		        .sort((left, right) => right[1].count - left[1].count || right[1].lastUsed - left[1].lastUsed || left[0].localeCompare(right[0], 'zh-CN'))
		        .slice(0, Math.max(1, limit))
		        .map(([text]) => text);
		}

		function getPersonalDictionaryEntries(query = '') {
		    const normalizedQuery = String(query || '').trim().toLowerCase();
		    const merged = new Map();
		    Object.entries(imeLearningState.contexts || {}).forEach(([contextKey, context]) => {
		        const metadata = parseImeLearningContextKey(contextKey);
		        if (!metadata) return;
		        Object.entries(context?.candidates || {}).forEach(([text, usage]) => {
		            if (normalizedQuery && !String(text).toLowerCase().includes(normalizedQuery) && !metadata.code.includes(normalizedQuery)) return;
		            const key = `${metadata.kind}:${metadata.code}:${text}`;
		            const current = merged.get(key) || { text, code: metadata.code, kind: metadata.kind, count: 0, lastUsed: 0 };
		            current.count += Number(usage?.count || 0);
		            current.lastUsed = Math.max(current.lastUsed, Number(usage?.lastUsed || 0));
		            merged.set(key, current);
		        });
		    });
		    return Array.from(merged.values()).sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed || a.text.localeCompare(b.text, 'zh-CN'));
		}

		function syncImeGlobalUsageForCandidate(kind, text) {
		    const value = String(text || '').trim();
		    if (!value) return;
		    let count = 0;
		    let lastUsed = 0;
		    Object.entries(imeLearningState.contexts || {}).forEach(([contextKey, context]) => {
		        const metadata = parseImeLearningContextKey(contextKey);
		        if (!metadata || metadata.kind !== kind) return;
		        const usage = context?.candidates?.[value];
		        if (!usage) return;
		        count += Number(usage.count || 0);
		        lastUsed = Math.max(lastUsed, Number(usage.lastUsed || 0));
		    });
		    const globalKey = `${kind}:${value}`;
		    if (count > 0) imeLearningState.global[globalKey] = { count: Math.min(9999, count), lastUsed };
		    else delete imeLearningState.global[globalKey];
		}

		function deletePersonalDictionaryEntry(entry) {
		    const kind = entry?.kind === 'english' ? 'english' : 'chinese';
		    const text = String(entry?.text || '').trim();
		    const contextKey = getImeLearningContextKey(entry?.code, kind);
		    const context = contextKey ? imeLearningState.contexts?.[contextKey] : null;
		    if (!text || !context?.candidates?.[text]) return false;
		    delete context.candidates[text];
		    const remaining = Object.values(context.candidates || {});
		    if (!remaining.length) delete imeLearningState.contexts[contextKey];
		    else context.lastUsed = Math.max(...remaining.map(usage => Number(usage?.lastUsed || 0)), 0);
		    syncImeGlobalUsageForCandidate(kind, text);
		    clearTimeout(imeLearningSaveTimer);
		    persistImeLearningState();
		    return true;
		}

		function clearPersonalDictionary() {
		    clearTimeout(imeLearningSaveTimer);
		    imeLearningState = createEmptyImeLearningState();
		    persistImeLearningState();
		}

		function mergeImeLearningState(importedState) {
		    const incoming = sanitizeImeLearningState(importedState);
		    Object.entries(incoming.contexts).forEach(([contextKey, context]) => {
		        const target = imeLearningState.contexts[contextKey] || { lastUsed: 0, candidates: {} };
		        target.lastUsed = Math.max(Number(target.lastUsed || 0), Number(context.lastUsed || 0));
		        Object.entries(context.candidates || {}).forEach(([text, usage]) => {
		            const current = target.candidates[text] || { count: 0, lastUsed: 0 };
		            target.candidates[text] = {
		                count: Math.min(9999, Number(current.count || 0) + Number(usage.count || 0)),
		                lastUsed: Math.max(Number(current.lastUsed || 0), Number(usage.lastUsed || 0))
		            };
		        });
		        imeLearningState.contexts[contextKey] = target;
		    });
		    Object.entries(incoming.global).forEach(([key, usage]) => {
		        const current = imeLearningState.global[key] || { count: 0, lastUsed: 0 };
		        imeLearningState.global[key] = {
		            count: Math.min(9999, Number(current.count || 0) + Number(usage.count || 0)),
		            lastUsed: Math.max(Number(current.lastUsed || 0), Number(usage.lastUsed || 0))
		        };
		    });
		    persistImeLearningState();
		}

		function recordImeCandidateUse(text, code, kind = 'chinese') {
		    const value = String(text || '').trim();
		    const contextKey = getImeLearningContextKey(code, kind);
		    if (!value || !contextKey) return;
		    const now = Date.now();
		    if (!imeLearningState.contexts[contextKey]) imeLearningState.contexts[contextKey] = { lastUsed: now, candidates: {} };
		    const context = imeLearningState.contexts[contextKey];
		    const current = context.candidates[value] || { count: 0, lastUsed: 0 };
		    context.candidates[value] = { count: Math.min(9999, Number(current.count || 0) + 1), lastUsed: now };
		    context.lastUsed = now;
		    const globalKey = `${kind}:${value}`;
		    const globalCurrent = imeLearningState.global[globalKey] || { count: 0, lastUsed: 0 };
		    imeLearningState.global[globalKey] = { count: Math.min(9999, Number(globalCurrent.count || 0) + 1), lastUsed: now };
		    scheduleImeLearningSave();
		}

		function rankImeCandidates(candidates, code, kind = 'chinese') {
		    const list = Array.from(new Set((candidates || []).filter(Boolean)));
		    const normalizedCode = String(code || '').trim().toLowerCase();
		    const pinnedCandidate = kind === 'english' && normalizedCode ? normalizedCode : '';
		    const contextKey = getImeLearningContextKey(code, kind);
		    const contextCandidates = imeLearningState.contexts?.[contextKey]?.candidates || {};
		    const ranked = list
		        .filter(text => text !== pinnedCandidate)
		        .map((text, index) => {
		            const local = contextCandidates[text] || {};
		            const globalUsage = imeLearningState.global?.[`${kind}:${text}`] || {};
		            return {
		                text,
		                index,
		                localCount: Number(local.count || 0),
		                globalCount: Number(globalUsage.count || 0),
		                lastUsed: Math.max(Number(local.lastUsed || 0), Number(globalUsage.lastUsed || 0))
		            };
		        })
		        .sort((a, b) => b.localCount - a.localCount || b.globalCount - a.globalCount || b.lastUsed - a.lastUsed || a.index - b.index)
		        .map(item => item.text);
		    return pinnedCandidate ? [pinnedCandidate, ...ranked] : ranked;
		}

		function getExpectedImeCandidateLength(code) {
		    if (!code || !window.RSDBInputMethodLibrary) return 0;
		    const raw = String(code).toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-zv']/g, '');
		    if (raw.includes("'")) return raw.split("'").filter(Boolean).length;
            const formatted = window.RSDBInputMethodLibrary.formatPinyinComposition(raw);
            if (window.RSDBInputMethodLibrary.isPinyinSyllable?.(raw)) return 1;
            const parts = formatted.split("'").filter(Boolean);
		    const allMatchable = parts.every(part =>
		        window.RSDBInputMethodLibrary.isPinyinSyllable?.(part)
		        || /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])$/.test(part)
		    );
		    if (allMatchable && (parts.length >= 5 || raw.replace(/'/g, '').length % 2 !== 0)) return parts.length;
		    if (raw.replace(/'/g, '').length % 2 === 0) return 0;
            if (!parts.every(part => window.RSDBInputMethodLibrary.isPinyinSyllable?.(part))) return 0;
		    return formatted.includes("'") ? parts.length : 0;
		}

		function applyEnglishCandidateCase(candidate, prefix) {
		    const value = String(candidate || '');
		    const typed = String(prefix || '');
		    if (keyboardState.shiftState === 'locked-on') return value.toUpperCase();
		    if (keyboardState.shiftState === 'on') return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value;
		    if (/^[A-Z]+$/.test(typed)) {
		        return typed.length === 1
		            ? (value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value)
		            : value.toUpperCase();
		    }
		    if (/^[A-Z]/.test(typed)) return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value;
		    return value.toLowerCase();
		}

		function getImeElements() {
		    return {
		        bar: document.getElementById('imeCandidateBar'),
		        keyboard: document.getElementById('virtualKeyboard'),
		        toolbar: document.getElementById('shortcutToolbar'),
		        language: document.getElementById('imeLanguageToggleBtn'),
		        scheme: document.getElementById('imeSchemeBtn'),
		        separator: document.getElementById('imeSeparatorBtn'),
		        composition: document.getElementById('imeCompositionText'),
		        list: document.getElementById('imeCandidateList'),
		        prev: document.getElementById('imeCandidatePrevBtn'),
		        next: document.getElementById('imeCandidateNextBtn')
		    };
		}

		function isImeTextKeyboard() {
		    return IME_TEXT_KEYBOARD_TYPES.has(keyboardState.inputType);
		}

		function getEnglishWordRange(input = currentInput) {
		    if (!input) return { start: 0, end: 0, prefix: '' };
		    const value = input.value || '';
		    const cursor = typeof input.selectionStart === 'number' ? input.selectionStart : value.length;
		    let start = Math.max(0, Math.min(value.length, cursor));
		    while (start > 0 && /[A-Za-z]/.test(value[start - 1])) start--;
		    return { start, end: cursor, prefix: value.slice(start, cursor) };
		}

		function getFormattedImeComposition() {
		    if (!imeState.composition) return '';
		    return window.RSDBInputMethodLibrary?.formatPinyinComposition(imeState.composition) || imeState.composition;
		}

		function clampImeCompositionCaret(position = imeState.compositionCaret) {
		    const length = (imeState.composition || '').length;
		    return Math.max(0, Math.min(length, Number(position) || 0));
		}

		function getImeCompositionCaretFromClientX(element, clientX, text) {
		    if (!element) return (text || '').length;
		    const value = String(text || '');
		    const rect = element.getBoundingClientRect();
		    const style = getComputedStyle(element);
		    const paddingLeft = parseFloat(style.paddingLeft) || 0;
		    const localX = clientX - rect.left + element.scrollLeft - paddingLeft;
		    const canvas = document.createElement('canvas');
		    const context = canvas.getContext('2d');
		    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
		    let width = 0;
		    for (let index = 0; index < value.length; index++) {
		        const characterWidth = context.measureText(value[index]).width;
		        if (localX <= width + characterWidth / 2) return index;
		        width += characterWidth;
		    }
		    return value.length;
		}

		function scrollImeCompositionCaretIntoView(element) {
		    const caret = element?.querySelector('.ime-composition-caret');
		    if (!element || !caret) return;
		    const left = caret.offsetLeft;
		    const right = left + caret.offsetWidth;
		    if (left < element.scrollLeft) element.scrollLeft = Math.max(0, left - 6);
		    else if (right > element.scrollLeft + element.clientWidth) element.scrollLeft = right - element.clientWidth + 6;
		}

		function activateImeCompositionEditor(event) {
		    if (keyboardState.imeLanguage !== 'chinese' || !imeState.composition) return;
		    const elements = getImeElements();
		    const formatted = getFormattedImeComposition();
		    const caret = getImeCompositionCaretFromClientX(elements.composition, event.clientX, formatted);
		    imeState.composition = formatted;
		    imeState.compositionEditing = true;
		    imeState.compositionCaret = Math.max(0, Math.min(formatted.length, caret));
		    imeState.page = 0;
		    refreshImeCandidates();
		    elements.composition?.focus({ preventScroll: true });
		}

		function insertIntoImeComposition(text) {
		    const value = String(text || '');
		    if (!value) return;
		    const composition = imeState.composition || '';
		    const caret = imeState.compositionEditing ? clampImeCompositionCaret() : composition.length;
		    imeState.composition = composition.slice(0, caret) + value + composition.slice(caret);
		    imeState.compositionCaret = caret + value.length;
		    imeState.page = 0;
		    refreshImeCandidates();
		}

		function clearImeComposition(render = true) {
		    imeState.composition = '';
		    imeState.compositionCaret = 0;
		    imeState.compositionEditing = false;
		    imeState.candidates = [];
            imeState.candidateSegmentCounts = [];
		    imeState.page = 0;
		    imeState.input = null;
		    if (render) refreshImeCandidates();
		}

		function refreshImeCandidates() {
		    const library = window.RSDBInputMethodLibrary;
		    if (!library || !isImeTextKeyboard() || !isImeDictionaryEnabled()) {
		        imeState.candidates = [];
		        imeState.page = 0;
		        renderImeCandidateBar();
		        return;
		    }
		    if (keyboardState.imeLanguage === 'chinese') {
		        const composition = imeState.composition || '';
	            const segmentedComposition = library.formatPinyinComposition(composition) || composition;
	            const parts = segmentedComposition.split("'").filter(Boolean);
		        const learned = composition ? getImeLearnedCandidatesForPrefix(composition, 'chinese', 36) : [];
		        const system = composition ? library.lookupPinyin(composition, { scheme: 'smart', limit: 72 }) : [];
		        const expectedLength = getExpectedImeCandidateLength(composition);
		        const correctionLengths = new Set((library.getPinyinCorrections?.(composition, 4) || [])
		            .map(item => Number(item?.segments) || 0)
		            .filter(Boolean));
		        if (expectedLength) correctionLengths.add(expectedLength);
		        const fullCandidates = rankImeCandidates(
		            [...learned, ...system].filter(candidate => !correctionLengths.size || correctionLengths.has(Array.from(candidate).length)),
		            composition,
		            'chinese'
		        );
		        const candidates = [];
		        const segmentCounts = [];
		        const seenCandidates = new Set();
                const appendCandidates = (items, consumedSegments) => {
                    items.forEach(candidate => {
                        if (!candidate || seenCandidates.has(candidate)) return;
                        seenCandidates.add(candidate);
                        candidates.push(candidate);
                        segmentCounts.push(consumedSegments);
                    });
		        };
		        const isLongComposition = parts.length >= 5;
		        if (!isLongComposition) {
	            appendCandidates(fullCandidates, parts.length || expectedLength || 1);
		        } else {
		            // 长拼音先按前缀查找真实词库短语，避免把大量单字候选拼成一串不自然的长文本。
		        const remoteFullCandidates = window.RSDBRemoteInputMethod?.getCachedChinese(composition) || [];
		        appendCandidates(
		            rankImeCandidates(remoteFullCandidates, composition, 'chinese')
		                .filter(candidate => Array.from(candidate).length === parts.length),
		            parts.length
		        );
		        const maxPrefixSegments = Math.min(parts.length - 1, 8);
		        let matchedDictionaryPrefix = false;
		        for (let prefixSegments = maxPrefixSegments; prefixSegments >= 2; prefixSegments--) {
		            const prefix = parts.slice(0, prefixSegments).join("'");
		            const rawPrefix = prefix.replace(/'/g, '');
		            const exactPhrases = Array.isArray(library.pinyinPhrases?.[rawPrefix])
		                ? library.pinyinPhrases[rawPrefix]
		                : [];
		            const learnedPrefixCandidates = getImeLearnedCandidatesForPrefix(prefix, 'chinese', 12)
		                .filter(candidate => Array.from(candidate).length === prefixSegments);
		            const exactCandidates = exactPhrases.filter(candidate => Array.from(candidate).length === prefixSegments);
		            const prefixCandidates = rankImeCandidates(
		                [...learnedPrefixCandidates, ...exactCandidates],
		                prefix,
		                'chinese'
		            );
		            if (prefixCandidates.length) {
		                appendCandidates(prefixCandidates, prefixSegments);
		                matchedDictionaryPrefix = true;
		                if (candidates.length >= 48) break;
		            }
		        }
		        // 长输入没有词库短语时，使用前两个音节作为可编辑的候选前缀。
		        if (!matchedDictionaryPrefix || candidates.length < 12) {
		            const fallbackPrefix = parts.slice(0, 2).join("'");
		            const learnedFallbackCandidates = getImeLearnedCandidatesForPrefix(fallbackPrefix, 'chinese', 12)
		                .filter(candidate => Array.from(candidate).length === 2);
		            const fallbackCandidates = rankImeCandidates([
		                ...learnedFallbackCandidates,
		                ...library.lookupPinyin(fallbackPrefix, { scheme: 'smart', limit: 24 })
		            ], fallbackPrefix, 'chinese')
		                .filter(candidate => Array.from(candidate).length === 2);
		            appendCandidates(fallbackCandidates, 2);
		        }
		        // 如果整句本身就是词库短语，优先保留整句候选。
		        if (!candidates.length) appendCandidates(fullCandidates, parts.length || expectedLength || 1);
		        }
		        imeState.candidates = candidates;
                imeState.candidateSegmentCounts = segmentCounts;
		    } else if (imeState.englishCandidatesDismissed) {
		        imeState.candidates = [];
		    } else {
		        const range = getEnglishWordRange(currentInput);
		        const typedCount = Math.max(0, Number(imeState.englishTypedCount) || 0);
		        const prefix = typedCount > 0 && range.prefix.length >= typedCount
		            ? range.prefix.slice(-typedCount) : '';
		        const learned = prefix.length ? getImeLearnedCandidatesForPrefix(prefix, 'english', 20) : [];
		        const system = prefix.length ? library.lookupEnglish(prefix, 32) : [];
		        const candidates = [...learned, ...system];
		        imeState.candidates = rankImeCandidates(candidates, prefix, 'english')
		            .map(candidate => applyEnglishCandidateCase(candidate, prefix));
		    }
		    const pageCount = Math.max(1, Math.ceil(imeState.candidates.length / getImeCandidatePageSize()));
		    imeState.page = Math.max(0, Math.min(imeState.page, pageCount - 1));
		    renderImeCandidateBar();
		}

		window.addEventListener('rsdb-remote-ime-update', event => {
		    const detail = event.detail || {};
		    if (!isImeTextKeyboard() || !isImeDictionaryEnabled()) return;
		    if (detail.language === 'chinese') {
		        const currentQuery = String(imeState.composition || '').toLowerCase().replace(/[^a-zv]/g, '');
		        if (keyboardState.imeLanguage === 'chinese' && currentQuery === detail.query) refreshImeCandidates();
		        return;
		    }
		    if (detail.language === 'english' && keyboardState.imeLanguage === 'english') {
		        const range = getEnglishWordRange(currentInput);
		        const typedCount = Math.max(0, Number(imeState.englishTypedCount) || 0);
		        const prefix = typedCount > 0 && range.prefix.length >= typedCount
		            ? range.prefix.slice(-typedCount).toLowerCase() : '';
		        if (prefix === detail.query) refreshImeCandidates();
		    }
		});

		function renderImeCandidateBar(direction = 0) {
		    const elements = getImeElements();
		    if (!elements.bar) return;
		    const toolbarToolsVisible = !!window.RSDBInputMethodLibrary && isImeTextKeyboard();
		    const visible = toolbarToolsVisible && isImeDictionaryEnabled();
		    elements.bar.hidden = !visible;
		    elements.toolbar?.classList.toggle('ime-tools-visible', toolbarToolsVisible);
            elements.toolbar?.classList.toggle('ime-none-mode', keyboardState.imeLanguage === 'none');
            const languageLabels = { chinese: '中', english: '英', none: '无' };
            if (elements.language) {
                elements.language.textContent = languageLabels[keyboardState.imeLanguage] || '英';
                elements.language.title = keyboardState.imeLanguage === 'chinese' ? '切换到英文输入' : (keyboardState.imeLanguage === 'english' ? '切换到无输入法模式' : '切换到中文拼音');
            }
		    window.refreshShortcutToolbarLayout?.();
		    if (!visible) {
		        updateVirtualKeyboardActionKeys();
		        return;
		    }

		    elements.language.textContent = keyboardState.imeLanguage === 'chinese' ? '中' : '英';
		    elements.language.title = keyboardState.imeLanguage === 'chinese' ? '切换到英文输入' : '切换到中文拼音';
		    if (keyboardState.imeLanguage === 'chinese') {
                elements.scheme.textContent = IME_SCHEME_LABELS.smart;
                elements.scheme.title = '智能匹配全拼、简拼、小鹤双拼和自然码双拼';
            } else {
                elements.scheme.textContent = keyboardState.englishWordMode === false ? '字母' : '词库';
                elements.scheme.title = keyboardState.englishWordMode === false ? '当前为普通字母输入，点击启用英文词库' : '当前启用英文词库，点击切换普通字母输入';
            }
		    elements.scheme.disabled = false;
		    const separatorIndex = imeState.compositionEditing ? clampImeCompositionCaret() : imeState.composition.length;
		    elements.separator.disabled = keyboardState.imeLanguage !== 'chinese' || !imeState.composition || imeState.composition[separatorIndex - 1] === "'";
		    const englishRange = getEnglishWordRange(currentInput);
		    const compositionText = keyboardState.imeLanguage === 'chinese'
		        ? (imeState.compositionEditing ? imeState.composition : getFormattedImeComposition())
		        : englishRange.prefix;
		    elements.composition.dataset.placeholder = keyboardState.imeLanguage === 'chinese' ? '拼音' : '英文';
		    elements.composition.setAttribute('aria-label', keyboardState.imeLanguage === 'chinese' ? '编辑当前拼音' : '当前英文输入');
		    elements.composition.classList.toggle('ime-composition-editing', keyboardState.imeLanguage === 'chinese' && imeState.compositionEditing);
		    if (keyboardState.imeLanguage === 'chinese' && imeState.compositionEditing && compositionText) {
		        imeState.compositionCaret = clampImeCompositionCaret();
		        const caret = document.createElement('span');
		        caret.className = 'ime-composition-caret';
		        caret.setAttribute('aria-hidden', 'true');
		        elements.composition.replaceChildren(
		            document.createTextNode(compositionText.slice(0, imeState.compositionCaret)),
		            caret,
		            document.createTextNode(compositionText.slice(imeState.compositionCaret))
		        );
		        requestAnimationFrame(() => scrollImeCompositionCaretIntoView(elements.composition));
		    } else {
		        elements.composition.textContent = compositionText;
		        elements.composition.scrollLeft = 0;
		    }

		    const desktopPaged = appSettings.desktopModeEnabled === true;
            const pageSize = desktopPaged ? 9 : Math.max(1, imeState.candidates.length);
            const start = desktopPaged ? imeState.page * pageSize : 0;
            const visibleCandidates = desktopPaged ? imeState.candidates.slice(start, start + pageSize) : imeState.candidates;
		    elements.list.innerHTML = '';
		    visibleCandidates.forEach((candidate, index) => {
		        const button = document.createElement('button');
		        button.type = 'button';
		        button.className = 'ime-candidate';
		        button.style.setProperty('--ime-candidate-order', String(index));
		        const number = index + 1;
		        button.innerHTML = `<span class="ime-candidate-index">${number}</span>${escapeHtml(candidate)}`;
		        button.title = candidate;
		        button.addEventListener('pointerdown', event => event.preventDefault());
		        button.addEventListener('click', event => {
		            event.preventDefault();
		            selectImeCandidate(start + index);
		        });
		        elements.list.appendChild(button);
		    });
		    elements.list.classList.remove('ime-page-enter-next', 'ime-page-enter-prev');
		    updateVirtualKeyboardActionKeys();
		}

		function changeImeCandidatePage(delta) {
		    const pageCount = Math.max(1, Math.ceil(imeState.candidates.length / getImeCandidatePageSize()));
		    const nextPage = Math.max(0, Math.min(pageCount - 1, imeState.page + Math.sign(delta)));
		    if (nextPage === imeState.page) return false;
		    const direction = nextPage > imeState.page ? 1 : -1;
		    imeState.page = nextPage;
		    renderImeCandidateBar(direction);
		    return true;
		}

		function toggleImeLanguage() {
		    if (imeState.composition) commitImeComposition();
		    imeState.englishTypedCount = 0;
		    imeState.englishCandidatesDismissed = false;
		    const languageOrder = ['chinese', 'english', 'none'];
            const currentIndex = languageOrder.indexOf(keyboardState.imeLanguage);
            keyboardState.imeLanguage = languageOrder[(currentIndex + 1 + languageOrder.length) % languageOrder.length];
		    if (keyboardState.imeLanguage === 'chinese') keyboardState.shiftState = 'off';
            imeState.candidates = [];
		    imeState.englishCandidatesDismissed = false;
		    saveKeyboardState();
		    imeState.page = 0;
            const languageButton = document.getElementById('imeLanguageToggleBtn');
            if (languageButton) {
                const labels = { chinese: '中', english: '英', none: '无' };
                languageButton.textContent = labels[keyboardState.imeLanguage];
                languageButton.title = keyboardState.imeLanguage === 'chinese' ? '切换到英文输入' : (keyboardState.imeLanguage === 'english' ? '切换到无输入法模式' : '切换到中文拼音');
            }
            document.getElementById('shortcutToolbar')?.classList.toggle('ime-none-mode', keyboardState.imeLanguage === 'none');
		    generateVirtualKeyboard();
		}

		function toggleImeSchemeMode() {
            if (keyboardState.imeLanguage !== 'english') return;
            keyboardState.englishWordMode = keyboardState.englishWordMode === false;
            imeState.englishTypedCount = 0;
            imeState.englishCandidatesDismissed = false;
            imeState.candidates = [];
            imeState.page = 0;
            saveKeyboardState();
            const schemeButton = document.getElementById('imeSchemeBtn');
            if (schemeButton) {
                schemeButton.textContent = keyboardState.englishWordMode === false ? '字母' : '词库';
                schemeButton.title = keyboardState.englishWordMode === false ? '当前为普通字母输入，点击启用英文词库' : '当前启用英文词库，点击切换普通字母输入';
            }
            renderImeCandidateBar();
        }

		function bindImeControls() {
		    const elements = getImeElements();
		    if (!elements.bar || elements.bar.dataset.bound === 'true') return;
		    elements.bar.dataset.bound = 'true';
		    [elements.language, elements.separator, elements.prev, elements.next].forEach(button => {
		        button?.addEventListener('pointerdown', event => event.preventDefault());
		    });
		    elements.composition?.addEventListener('pointerdown', event => {
		        if (keyboardState.imeLanguage !== 'chinese' || !imeState.composition) return;
		        event.preventDefault();
		        event.stopPropagation();
		    });
		    elements.composition?.addEventListener('click', event => {
		        event.preventDefault();
		        event.stopPropagation();
		        activateImeCompositionEditor(event);
		    });
		    elements.composition?.addEventListener('keydown', event => {
		        if (!imeState.compositionEditing) return;
		        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
		            event.preventDefault();
		            moveCaretBy(event.key === 'ArrowLeft' ? -1 : 1);
		        } else if (event.key === 'Backspace') {
		            event.preventDefault();
		            handleImeBackspace();
		        } else if (event.key === 'Delete') {
		            event.preventDefault();
		            const caret = clampImeCompositionCaret();
		            if (caret < imeState.composition.length) {
		                imeState.composition = imeState.composition.slice(0, caret) + imeState.composition.slice(caret + 1);
		                refreshImeCandidates();
		            }
		        } else if (/^[A-Za-z]$/.test(event.key)) {
		            event.preventDefault();
		            handleImeCharacter(event.key);
		        } else if (event.key === "'") {
		            event.preventDefault();
		            insertImeSeparator();
		        } else if (event.key === ' ' || event.key === 'Enter') {
		            event.preventDefault();
		            handleImeSpace();
		        }
		    });
		    elements.language?.addEventListener('click', toggleImeLanguage);
            elements.scheme?.addEventListener('pointerdown', event => event.preventDefault());
            elements.scheme?.addEventListener('click', toggleImeSchemeMode);
		    elements.separator?.addEventListener('click', insertImeSeparator);
		    elements.prev?.addEventListener('click', () => {
		        changeImeCandidatePage(-1);
		    });
		    elements.next?.addEventListener('click', () => {
		        changeImeCandidatePage(1);
		    });
		    if (!document.documentElement.dataset.rsdbImePageKeysBound) {
                document.documentElement.dataset.rsdbImePageKeysBound = '1';
                document.addEventListener('keydown', event => {
                    if (appSettings.desktopModeEnabled !== true) return;
                    if (event.key !== 'PageDown' && event.key !== 'PageUp') return;
                    if (elements.keyboard?.style.display === 'none' || elements.bar.hidden || !imeState.candidates.length) return;
                    if (changeImeCandidatePage(event.key === 'PageDown' ? 1 : -1)) event.preventDefault();
                });
            }
		    let lastWheelPageAt = 0;
		    elements.keyboard?.addEventListener('wheel', event => {
		        if (appSettings.desktopModeEnabled !== true || elements.bar.hidden || imeState.candidates.length <= 9) return;
		        const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
		        if (Math.abs(delta) < 2) return;
		        const now = Date.now();
		        if (now - lastWheelPageAt < 150) {
		            event.preventDefault();
		            return;
		        }
		        if (changeImeCandidatePage(delta > 0 ? 1 : -1)) {
		            lastWheelPageAt = now;
		            event.preventDefault();
		        }
		    }, { passive: false });
		}

		function selectImeCandidate(index) {
		    const candidate = imeState.candidates[index];
		    if (!candidate) return;
		    if (keyboardState.imeLanguage === 'chinese' && imeState.composition) {
	            const segmentedComposition = window.RSDBInputMethodLibrary?.formatPinyinComposition(imeState.composition) || imeState.composition;
	            const parts = segmentedComposition.split("'").filter(Boolean);
                const consumedSegments = Math.max(1, Number(imeState.candidateSegmentCounts?.[index]) || parts.length || 1);
                if (parts.length > consumedSegments) {
                    const input = imeState.input || currentInput;
                    const consumedCode = parts.slice(0, consumedSegments).join("'");
                    recordImeCandidateUse(candidate, consumedCode, 'chinese');
                    if (input) insertTextToInput(input, candidate);
                    imeState.composition = parts.slice(consumedSegments).join("'");
                    imeState.compositionCaret = imeState.composition.length;
                    imeState.compositionEditing = false;
                    imeState.page = 0;
                    imeState.input = input;
                    imeState.candidates = [];
                    imeState.candidateSegmentCounts = [];
                    refreshImeCandidates();
                    return;
                }
		        commitImeComposition(candidate);
		        return;
		    }
		    const input = currentInput;
		    const range = getEnglishWordRange(input);
		    if (!input || !range.prefix) return;
		    imeState.englishCandidatesDismissed = true;
		    recordImeCandidateUse(candidate, range.prefix, 'english');
		    replaceInputRange(input, range.start, range.end, candidate);
		    imeState.page = 0;
		    refreshImeCandidates();
		}

		function commitImeComposition(candidateText = null) {
		    if (!imeState.composition) return false;
		    const input = imeState.input || currentInput;
		    const composition = imeState.composition;
		    const text = candidateText || imeState.candidates[0] || imeState.composition.replace(/'/g, '');
		    if (imeState.candidates.includes(text)) recordImeCandidateUse(text, composition, 'chinese');
		    if (input && text) insertTextToInput(input, text);
		    clearImeComposition(false);
		    refreshImeCandidates();
		    return true;
		}

		function insertImeSeparator() {
		    if (keyboardState.imeLanguage !== 'chinese' || !imeState.composition) return;
		    imeState.input = currentInput;
		    const caret = imeState.compositionEditing ? clampImeCompositionCaret() : imeState.composition.length;
		    if (imeState.composition[caret - 1] === "'" || imeState.composition[caret] === "'") return;
		    imeState.composition = imeState.composition.slice(0, caret) + "'" + imeState.composition.slice(caret);
		    imeState.compositionCaret = caret + 1;
		    imeState.compositionEditing = true;
		    imeState.page = 0;
		    refreshImeCandidates();
		}

		function handleImeCharacter(key) {
		    const value = String(key ?? '');
if (!isImeTextKeyboard() || keyboardState.imeLanguage !== 'chinese') {
			        imeState.englishCandidatesDismissed = false;
			        if (keyboardState.imeLanguage === 'english' && /^[A-Za-z]$/.test(value)) {
			            imeState.englishTypedCount = Math.min(64, (Number(imeState.englishTypedCount) || 0) + 1);
			        } else if (keyboardState.imeLanguage === 'english') {
			            imeState.englishTypedCount = 0;
			        }
			        insertText(value);
			        refreshImeCandidates();
			        return;
			    }
		    if (/^[A-Za-z]$/.test(value)) {
		        imeState.input = currentInput;
		        insertIntoImeComposition(value.toLowerCase());
		        return;
		    }
		    if ((value === "'" || value === '’' || value === '‘') && imeState.composition) {
		        insertImeSeparator();
		        return;
		    }
		    if (/^[1-9]$/.test(value) && imeState.composition) {
		        const candidateIndex = imeState.page * getImeCandidatePageSize() + Number(value) - 1;
		        if (imeState.candidates[candidateIndex]) selectImeCandidate(candidateIndex);
		        else {
		            commitImeComposition();
		            insertText(value);
		        }
		        return;
		    }
		    if (imeState.composition) commitImeComposition();
		    const punctuation = { ',': '，', '.': '。', '?': '？', '!': '！', ';': '；', ':': '：' };
		    insertText(punctuation[value] || value);
		}

		function handleImeSpace() {
		    if (keyboardState.imeLanguage === 'chinese' && imeState.composition) {
		        commitImeComposition();
		        return;
		    }
		    insertText(' ');
		}

		function handleImeBackspace() {
		    imeState.englishCandidatesDismissed = false;
		    if (keyboardState.imeLanguage === 'english') {
		        imeState.englishTypedCount = Math.max(0, (Number(imeState.englishTypedCount) || 0) - 1);
		    }
		    if (keyboardState.imeLanguage === 'chinese' && imeState.composition) {
		        const caret = imeState.compositionEditing ? clampImeCompositionCaret() : imeState.composition.length;
		        if (caret <= 0) return;
		        imeState.composition = imeState.composition.slice(0, caret - 1) + imeState.composition.slice(caret);
		        imeState.compositionCaret = caret - 1;
		        imeState.page = 0;
		        if (!imeState.composition) imeState.input = null;
		        refreshImeCandidates();
		        return;
		    }
		    handleBackspace();
		}

		let shortcutActionContext = null;
		let shortcutActionRestoreContext = null;
		let shortcutAddContext = null;
		let shortcutSuggestDismissedByField = {};

		function getTemplateKeyByField(fieldKey) {
		    const map = {
		        furnaceId: 'furnaceIdTemplates',
		        productId: 'productIdTemplates',
		        cardId: 'cardIdTemplates',
		        steelType: 'steelTypeTemplates',
		        actualDiameter: 'actualDiameterTemplates',
		        diameter: 'diameterTemplates',
		        length: 'lengthTemplates',
		        weight: 'weightTemplates',
		        status: 'statusTemplates',
		        position: 'positionTemplates'
		    };
		    return map[fieldKey] || null;
		}

		function getTemplatesByField(fieldKey) {
		    const key = getTemplateKeyByField(fieldKey);
		    if (!key) return null;
		    if (!Array.isArray(KeyboardConfigManager.config[key])) KeyboardConfigManager.config[key] = [];
		    return KeyboardConfigManager.config[key];
		}

		function getShortcutFieldKeyForInput(input = currentInput) {
		    if (imagePreviewEditState?.active && imagePreviewEditState.previewInput === input) {
		        return imagePreviewEditState.fieldId || null;
		    }
		    if (input?.id === 'quickEditInput') return dom.quickEditField?.value || null;
		    if (input?.id === 'shortcutInlineAddInput') return shortcutInlineAddState?.fieldKey || null;
		    if (inputFieldOrder.includes(input?.id)) return input.id;
		    const desktopInput = window.__rsdbDesktopShortcutInput;
		    if (desktopInput && desktopInput !== input && desktopInput.isConnected && inputFieldOrder.includes(desktopInput.id)) {
		        return desktopInput.id;
		    }
		    const remembered = keyboardState?.shortcutFieldKey;
		    return inputFieldOrder.includes(remembered) ? remembered : null;
		}

		function resolveShortcutTargetInput(fieldKey) {
		    const preview = imagePreviewEditState;
		    if (preview?.active && preview.previewInput?.isConnected && (!fieldKey || preview.fieldId === fieldKey)) {
		        return preview.previewInput;
		    }
		    const candidates = [currentInput, window.__rsdbDesktopShortcutInput, formElements?.[fieldKey]];
		    for (const candidate of candidates) {
		        if (!candidate?.isConnected) continue;
		        const candidateField = getShortcutFieldKeyForInput(candidate);
		        if (!fieldKey || !candidateField || candidateField === fieldKey) return candidate;
		    }
		    return null;
		}

		function getSuggestedAddValues(fieldKey, templateValues) {
            const byField = appSettings.suggestEnabledByField && typeof appSettings.suggestEnabledByField === 'object' ? appSettings.suggestEnabledByField : {};
            const enabled = typeof byField[fieldKey] === 'boolean' ? byField[fieldKey] : !!appSettings.suggestEnabled;
            if (!enabled) return [];
            if (shortcutInlineAddState?.fieldKey) return [];
            const stats = inputStats[fieldKey] || {};
            const threshold = Math.max(1, Number(appSettings.suggestThreshold) || 5);
            const existing = new Set((templateValues || []).map(v => (v || '').trim()).filter(Boolean));
            const dismissed = shortcutSuggestDismissedByField?.[fieldKey] instanceof Set ? shortcutSuggestDismissedByField[fieldKey] : null;
            const entries = Object.entries(stats)
                .filter(([v, c]) => v && Number(c) >= threshold)
                .sort((a, b) => Number(b[1]) - Number(a[1]));
            const out = [];
            const queryRaw = (currentInput?.value || '').toString();
            const query = normalizeShortcutMatchText(queryRaw);
            const queryCompact = normalizeShortcutMatchTextCompact(queryRaw);
            if (queryCompact) {
                let prefixCount = 0;
                entries.forEach(([v, c]) => {
                    const vv = normalizeShortcutMatchTextCompact(v);
                    if (vv.startsWith(queryCompact)) prefixCount += Number(c) || 0;
                });
                const qTrim = query.trim();
                if (prefixCount >= threshold && qTrim && !existing.has(qTrim) && !(dismissed?.has?.(qTrim))) {
                    out.push(qTrim);
                }
            }
            entries.some(([v, c]) => {
                const val = (v || '').trim();
                if (!val) return false;
                if (existing.has(val)) return false;
                if (dismissed?.has?.(val)) return false;
                out.push(val);
                return out.length >= 3;
            });
            return out.slice(0, 3);
		}

		function openShortcutInlineAdd(fieldKey, presetValue = '') {
		    if (!fieldKey) return;
		    if (shortcutEditMode) setShortcutEditMode(false);
		    shortcutInlineAddState = {
		        fieldKey,
		        value: (presetValue || '').toString(),
		        prevInput: currentInput
		    };
		    const actionDlg = document.getElementById('shortcutActionDialog');
		    if (actionDlg) actionDlg.open = false;
		    const dupDlg = document.getElementById('duplicateShortcutConfirmDialog');
		    if (dupDlg) dupDlg.open = false;
		    requestAnimationFrame(() => {
		        refreshShortcutKeysForCurrentInput();
		        requestAnimationFrame(() => {
		            const input = document.getElementById('shortcutInlineAddInput');
		            if (input) {
		                input.setAttribute('readonly', 'true');
		                input.classList.add('readonly-input');
		                currentInput = input;
		            }
		            input?.focus?.();
		            input?.setSelectionRange?.(input.value.length, input.value.length);
		            updateVirtualCursor();
		            setTimeout(updateVirtualCursor, 60);
		            setTimeout(updateVirtualCursor, 180);
		        });
		    });
		}

		function closeShortcutInlineAdd(options = {}) {
		    const restoreKeyboard = options.restoreKeyboard !== false;
		    const prevInput = shortcutInlineAddState?.prevInput || null;
		    shortcutInlineAddState = null;
		    refreshShortcutKeysForCurrentInput();
		    currentInput = prevInput;
		    updateVirtualCursor();
		    if (!restoreKeyboard || !prevInput) return;
		    if (prevInput.id === 'remarks') {
		        setVirtualKeyboardVisible(false);
		        return;
		    }
		    updateKeyboardForInput(prevInput);
		    showVirtualKeyboard();
		    prevInput.focus();
		    resetCursorToEnd(prevInput);
		}

		function commitShortcutInlineAdd() {
		    if (!shortcutInlineAddState?.fieldKey) return;
		    const fieldKey = shortcutInlineAddState.fieldKey;
		    const templates = getTemplatesByField(fieldKey);
		    if (!templates) return;
		    const value = (shortcutInlineAddState.value || '').trim();
		    if (!value) {
		        showSnackbar('请输入快捷短语', 'warning');
		        return;
		    }
		    const existedIndex = templates.findIndex(v => (v || '').trim() === value);
		    if (existedIndex >= 0) {
		        showSnackbar('已存在相同快捷短语', 'info');
		        closeShortcutInlineAdd({ restoreKeyboard: true });
		        setTimeout(() => highlightShortcutInKeyboard(value), 60);
		        return;
		    }
		    addShortcutTemplate(fieldKey, value);
		    showSnackbar('已添加快捷短语', 'success');
		    closeShortcutInlineAdd({ restoreKeyboard: true });
		}

		function openShortcutAddDialog(fieldKey, presetValue = '') {
		    if (!fieldKey) return;
		    const dlg = document.getElementById('shortcutAddDialog');
		    if (!dlg) return;
		    const restoreInput = shortcutInlineAddState?.prevInput || currentInput;
		    window.__rsdbShortcutAddPrevInput = restoreInput || null;
		    shortcutAddContext = { fieldKey, prevInput: restoreInput };
		    const input = document.getElementById('shortcutAddValue');
		    if (input) input.value = (presetValue || '').toString();
            currentInput = null;

		    const list = document.getElementById('shortcutAddExistingList');
		    if (list) {
		        list.innerHTML = '';
		        const templates = getTemplatesByField(fieldKey) || [];
		        templates.forEach((v) => {
		            const btn = document.createElement('mdui-button');
		            btn.setAttribute('variant', 'tonal');
		            btn.style.height = '32px';
		            btn.style.padding = '0 10px';
		            btn.style.borderRadius = '999px';
		            btn.textContent = (v || '').toString();
		            btn.addEventListener('click', () => {
		                const val = (v || '').toString();
		                if (input) input.value = val;
		                if (input) input.focus?.();
		            });
		            list.appendChild(btn);
		        });
		    }

            refreshShortcutAddAutocomplete();
		    dlg.open = true;
		    setVirtualKeyboardVisible(false);
		    const vc = document.getElementById('virtualCursor');
		    if (vc) vc.style.display = 'none';
		    const vh = document.getElementById('virtualCursorHandle');
		    if (vh) vh.style.display = 'none';
		    setTimeout(() => input?.focus?.(), 0);
		}

        function refreshShortcutAddAutocomplete() {
            const dropdown = document.getElementById('shortcutAddAutocompleteDropdown');
            const menu = document.getElementById('shortcutAddAutocompleteMenu');
            const input = document.getElementById('shortcutAddValue');
            const fieldKey = shortcutAddContext?.fieldKey;
            if (!dropdown || !menu || !input || !fieldKey) return;
            const templates = (getTemplatesByField(fieldKey) || []).map(v => (v || '').toString().trim()).filter(Boolean);
            const query = normalizeShortcutMatchText(input.value || '');
            const queryCompact = normalizeShortcutMatchTextCompact(input.value || '');
            const matched = templates
                .filter((v) => {
                    if (!query) return false;
                    const t1 = normalizeShortcutMatchText(v);
                    if (t1.includes(query)) return true;
                    if (!queryCompact) return false;
                    return normalizeShortcutMatchTextCompact(v).includes(queryCompact);
                })
                .slice(0, 10);
            menu.innerHTML = '';
            matched.forEach((val) => {
                const item = document.createElement('mdui-menu-item');
                item.textContent = val;
                item.addEventListener('click', () => {
                    input.value = val;
                    dropdown.open = false;
                    input.focus?.();
                    input.select?.();
                });
                menu.appendChild(item);
            });
            dropdown.open = matched.length > 0;
        }

		function openShortcutActionDialog(fieldKey, index) {
		    const templates = getTemplatesByField(fieldKey);
		    if (!templates) return;
		    if (index < 0 || index >= templates.length) return;
		    const previousContext = shortcutActionContext;
		    const sourceInput = previousContext?.sourceInput?.isConnected
		        ? previousContext.sourceInput
		        : (resolveShortcutTargetInput(fieldKey) || currentInput || window.__rsdbDesktopShortcutInput || null);
		    shortcutActionContext = {
		        fieldKey,
		        index,
		        sourceInput,
		        useVirtualKeyboard: previousContext?.sourceInput === sourceInput
		            ? previousContext.useVirtualKeyboard
		            : (!!sourceInput && isInputUsingVirtualKeyboard(sourceInput)),
		        desktopPanelWasActive: previousContext?.sourceInput === sourceInput
		            ? previousContext.desktopPanelWasActive
		            : desktopShortcutPanelActive === true
		    };
		    const addDlg = document.getElementById('shortcutAddDialog');
		    if (addDlg) addDlg.open = false;
		    const dupDlg = document.getElementById('duplicateShortcutConfirmDialog');
		    if (dupDlg) dupDlg.open = false;
		    const title = document.getElementById('shortcutActionTitle');
		    if (title) title.textContent = `快捷短语（${fieldLabels[fieldKey] || fieldKey}）`;
		    const editInput = document.getElementById('shortcutEditValue');
		    if (editInput) editInput.value = templates[index] || '';
		    const rawValue = templates[index] || '';
		    const preference = getShortcutPreference(fieldKey, rawValue);
		    const pinnedSwitch = document.getElementById('shortcutPinnedSwitch');
		    if (pinnedSwitch) pinnedSwitch.checked = preference.pinned === true;
		    const incrementSwitch = document.getElementById('shortcutIncrementClickSwitch');
		    if (incrementSwitch) incrementSwitch.checked = preference.incrementClick !== false;
		    const clickCountInput = document.getElementById('shortcutClickCountInput');
		    if (clickCountInput) clickCountInput.value = String(getShortcutClickCount(fieldKey, rawValue));
		    const moveSelect = document.getElementById('shortcutMoveTarget');
		    if (moveSelect) {
		        moveSelect.innerHTML = '';
		        getShortcutDisplayEntries(fieldKey, templates).forEach((entry, displayIndex) => {
		            const opt = document.createElement('mdui-menu-item');
		            opt.setAttribute('value', String(entry.index));
		            opt.textContent = `${displayIndex + 1}. ${entry.pinned ? '置顶 · ' : ''}${entry.value || '(空)'}`;
		            moveSelect.appendChild(opt);
		        });
		        moveSelect.value = String(index);
		    }
		    const dlg = document.getElementById('shortcutActionDialog');
		    if (dlg) dlg.open = true;
		}

		function restoreShortcutActionSurface(context) {
		    const input = context?.sourceInput;
		    if (!input?.isConnected) {
		        syncShortcutToolbarVisibility();
		        return;
		    }
		    currentInput = input;
		    window.__rsdbDesktopShortcutInput = input;
		    updateKeyboardForInput(input);
		    if (context.useVirtualKeyboard) {
		        showVirtualKeyboard({ force: true });
		    } else if (context.desktopPanelWasActive || appSettings.desktopModeEnabled === true) {
		        showDesktopShortcutPanel(input);
		    }
		    input.focus?.({ preventScroll: true });
		    requestAnimationFrame(() => {
		        syncShortcutToolbarVisibility();
		        window.syncShortcutToolbarHitBox?.();
		    });
		    setTimeout(() => syncShortcutToolbarVisibility(), 120);
		}

		function closeShortcutActionDialogAndRestore() {
		    shortcutActionRestoreContext = shortcutActionContext;
		    shortcutActionContext = null;
		    const dlg = document.getElementById('shortcutActionDialog');
		    if (dlg) {
		        dlg.open = false;
		        setTimeout(() => {
		            if (!dlg.open && shortcutActionRestoreContext) restoreClosedShortcutActionDialog();
		        }, 360);
		    } else {
		        restoreClosedShortcutActionDialog();
		    }
		}

		function restoreClosedShortcutActionDialog() {
		    const context = shortcutActionRestoreContext || shortcutActionContext;
		    shortcutActionRestoreContext = null;
		    shortcutActionContext = null;
		    if (!context) return;
		    restoreShortcutActionSurface(context);
		}

		function normalizeShortcutMatchText(text) {
		    return (text || '').toString().trim();
		}

		function normalizeShortcutMatchTextCompact(text) {
		    return normalizeShortcutMatchText(text).replace(/[\s\-_]+/g, '');
		}

		function refreshShortcutKeysForCurrentInput() {
		    if (!dom?.virtualKeyboard || (dom.virtualKeyboard.style.display === 'none' && !desktopShortcutPanelActive)) return;
		    const fieldKey = getShortcutFieldKeyForInput(currentInput);
		    const templates = getTemplatesByField(fieldKey);
		    if (!fieldKey || !templates) return;
		    const list = processKeyboardTemplates(templates);
		    createShortcutKeys(list, fieldKey === 'status' ? 'status-key' : 'shortcut-key', fieldKey, templates);
		    scheduleDesktopShortcutPanelSync();
		}

		function scheduleShortcutKeysRefresh() {
		    if (!dom?.virtualKeyboard || (dom.virtualKeyboard.style.display === 'none' && !desktopShortcutPanelActive)) return;
		    if (!currentInput) return;
		    if (window.__rsdbShortcutRefreshRaf) cancelAnimationFrame(window.__rsdbShortcutRefreshRaf);
		    window.__rsdbShortcutRefreshRaf = requestAnimationFrame(() => {
		        window.__rsdbShortcutRefreshRaf = 0;
		        refreshShortcutKeysForCurrentInput();
		    });
		}

		const SHORTCUT_CLICK_STATS_KEY = 'rsdb_shortcut_click_stats_v1';
		let shortcutClickStats = (() => {
		    try {
		        const raw = localStorage.getItem(SHORTCUT_CLICK_STATS_KEY);
		        const parsed = raw ? JSON.parse(raw) : {};
		        return parsed && typeof parsed === 'object' ? parsed : {};
		    } catch (e) {
		        return {};
		    }
		})();

		let shortcutStatsSaveTimer = null;
		function saveShortcutClickStats() {
		    clearTimeout(shortcutStatsSaveTimer);
		    shortcutStatsSaveTimer = setTimeout(() => {
		        try {
		            localStorage.setItem(SHORTCUT_CLICK_STATS_KEY, JSON.stringify(shortcutClickStats || {}));
		        } catch (e) {}
		    }, 180);
		}

        const HISTORY_KEY = 'rsdb_operation_history_v1';
        const HISTORY_CURSOR_KEY = 'rsdb_operation_history_cursor_v1';
        let operationHistory = (() => {
            try {
                const raw = localStorage.getItem(HISTORY_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) { return []; }
        })();
        let historyCursor = (() => {
            const v = Number(localStorage.getItem(HISTORY_CURSOR_KEY) || operationHistory.length);
            return Number.isFinite(v) ? v : operationHistory.length;
        })();
        function clearOperationHistoryStorage() {
            operationHistory = [];
            historyCursor = 0;
            window.__rsdbPendingOp = null;
            try {
                localStorage.removeItem(HISTORY_KEY);
                localStorage.removeItem(HISTORY_CURSOR_KEY);
            } catch (e) {}
            try {
                saveDataToIndexedDB();
            } catch (dbErr) {
                console.error('Failed to clear operation history in IndexedDB:', dbErr);
            }
        }
        function saveOperationHistory() {
            if (appSettings.historyStorageEnabled === false) {
                clearOperationHistoryStorage();
                return;
            }
            const showLimit = Math.max(1, Math.min(200, Number(appSettings.operationHistoryMaxCount) || 8));
            const stepsLimit = Math.max(1, Math.min(200, Number(appSettings.undoRedoMaxSteps) || 10));
            const performanceLimit = tableData.length > 1000 ? 2 : (tableData.length > 300 ? 4 : 200);
            const limit = Math.min(showLimit, stepsLimit, performanceLimit);
            if (operationHistory.length > limit) {
                const overflow = operationHistory.length - limit;
                operationHistory = operationHistory.slice(overflow);
                historyCursor = Math.max(0, historyCursor - overflow);
            }
            localStorage.removeItem(HISTORY_KEY);
            localStorage.setItem(HISTORY_CURSOR_KEY, String(historyCursor));
            try {
                saveDataToIndexedDB();
            } catch (dbErr) {
                console.error('Failed to save operation history to IndexedDB:', dbErr);
            }
        }
        function deepCopyData(arr) {
            try {
                return (arr || []).map(item => ({
                    ...item,
                    ...(item?.__cellStyles ? {
                        __cellStyles: typeof structuredClone === 'function'
                            ? structuredClone(item.__cellStyles)
                            : JSON.parse(JSON.stringify(item.__cellStyles))
                    } : {}),
                    ...(item?.__cellDisplayValues ? {
                        __cellDisplayValues: typeof structuredClone === 'function'
                            ? structuredClone(item.__cellDisplayValues)
                            : JSON.parse(JSON.stringify(item.__cellDisplayValues))
                    } : {})
                }));
            } catch (e) { return []; }
        }
        function deepCopyKeyboard(cfg) {
            try { return JSON.parse(JSON.stringify(cfg || {})); } catch (e) { return {}; }
        }
        function saveKeyboardConfigSilent() {
            try {
                localStorage.setItem(KeyboardConfigManager.STORAGE_KEY, JSON.stringify(KeyboardConfigManager.config || {}));
            } catch (e) {}
            try { generateVirtualKeyboard(); } catch (e) {}
        }
        function beginOperation(type, description, meta = {}) {
            if (appSettings.undoRedoEnabled === false) {
                window.__rsdbPendingOp = null;
                return;
            }
            const beforeTable = deepCopyData(tableData);
            const beforeKeyboard = deepCopyKeyboard(KeyboardConfigManager.config);
            window.__rsdbPendingOp = {
                ts: Date.now(),
                type: String(type || ''),
                description: String(description || ''),
                meta: meta || {},
                beforeTable,
                beforeKeyboard
            };
        }
        function commitOperation() {
            if (appSettings.undoRedoEnabled === false) {
                window.__rsdbPendingOp = null;
                return;
            }
            const pending = window.__rsdbPendingOp;
            if (!pending) return;
            const afterTable = deepCopyData(tableData);
            const afterKeyboard = deepCopyKeyboard(KeyboardConfigManager.config);
            const entry = { ...pending, afterTable, afterKeyboard };
            operationHistory = operationHistory.slice(0, historyCursor);
            operationHistory.push(entry);
            historyCursor = operationHistory.length;
            saveOperationHistory();
            window.__rsdbPendingOp = null;
        }
        function undoOperation() {
            if (appSettings.undoRedoEnabled === false) return false;
            if (historyCursor <= 0) return false;
            const idx = historyCursor - 1;
            const entry = operationHistory[idx];
            tableData = deepCopyData(entry.beforeTable);
            KeyboardConfigManager.config = deepCopyKeyboard(entry.beforeKeyboard);
            saveKeyboardConfigSilent();
            saveDataToIndexedDB();
            updateTable();
            updateSummary();
            historyCursor = idx;
            saveOperationHistory();
            showSnackbar('已撤销：' + (entry.description || entry.type || ''), 'success');
            return true;
        }
        function redoOperation() {
            if (appSettings.undoRedoEnabled === false) return false;
            if (historyCursor >= operationHistory.length) return false;
            const entry = operationHistory[historyCursor];
            tableData = deepCopyData(entry.afterTable);
            KeyboardConfigManager.config = deepCopyKeyboard(entry.afterKeyboard);
            saveKeyboardConfigSilent();
            saveDataToIndexedDB();
            updateTable();
            updateSummary();
            historyCursor = historyCursor + 1;
            saveOperationHistory();
            showSnackbar('已重做：' + (entry.description || entry.type || ''), 'success');
            return true;
        }
        function diffSummary(before, after) {
            const b = Array.isArray(before) ? before : [];
            const a = Array.isArray(after) ? after : [];
            const lenDiff = (a.length || 0) - (b.length || 0);
            const minLen = Math.min(b.length, a.length);
            let changedCells = 0;
            for (let i = 0; i < minLen; i++) {
                const bi = b[i] || {};
                const ai = a[i] || {};
                const keys = Object.keys({ ...bi, ...ai });
                for (const k of keys) {
                    if (String(bi[k] ?? '') !== String(ai[k] ?? '')) changedCells++;
                }
            }
            return { beforeCount: b.length, afterCount: a.length, deltaCount: lenDiff, changedCells };
        }
        function diffKeyboardSummary(b, a) {
            const fields = ['furnaceIdTemplates','productIdTemplates','cardIdTemplates','steelTypeTemplates','statusTemplates','positionTemplates'];
            const changes = [];
            fields.forEach(k => {
                const arrB = Array.isArray(b?.[k]) ? b[k] : [];
                const arrA = Array.isArray(a?.[k]) ? a[k] : [];
                const lenDiff = arrA.length - arrB.length;
                let changed = 0;
                const max = Math.max(arrA.length, arrB.length);
                for (let i = 0; i < max; i++) {
                    if ((arrB[i] || '') !== (arrA[i] || '')) changed++;
                }
                if (lenDiff !== 0 || changed > 0) {
                    const labelMap = {
                        furnaceIdTemplates:'炉号',productIdTemplates:'产品号',cardIdTemplates:'卡片号',
                        steelTypeTemplates:'钢种',statusTemplates:'状态',positionTemplates:'位置'
                    };
                    changes.push({ field: labelMap[k] || k, lenDiff, changed });
                }
            });
            return changes;
        }
        function buildRowChangeDetails(b, a, limit = 5) {
            const rows = [];
            const lenB = Array.isArray(b) ? b.length : 0;
            const lenA = Array.isArray(a) ? a.length : 0;
            const maxLen = Math.max(lenB, lenA);
            for (let i = 0; i < maxLen && rows.length < limit; i++) {
                const bi = lenB > i ? b[i] : undefined;
                const ai = lenA > i ? a[i] : undefined;
                if (!bi && ai) {
                    rows.push({ type: 'added', index: i, after: ai });
                    continue;
                }
                if (bi && !ai) {
                    rows.push({ type: 'deleted', index: i, before: bi });
                    continue;
                }
                const keys = Object.keys({ ...(bi || {}), ...(ai || {}) });
                const diffFields = [];
                keys.forEach(k => {
                    const vb = String(bi?.[k] ?? '');
                    const va = String(ai?.[k] ?? '');
                    if (vb !== va) diffFields.push({ key: k, before: vb, after: va });
                });
                if (diffFields.length) rows.push({ type: 'modified', index: i, fields: diffFields });
            }
            const parts = [];
            rows.forEach(r => {
                if (r.type === 'added') {
                    parts.push(`<div style="margin-top:8px;">新增行 #${r.index + 1}</div>`);
                    const f = Object.keys(r.after || {});
                    f.slice(0, 6).forEach(k => {
                        parts.push(`<div style="padding-left:12px;display:flex;gap:8px;"><span>${fieldLabels[k] || k}：</span><span>${String(r.after[k] ?? '')}</span></div>`);
                    });
                } else if (r.type === 'deleted') {
                    parts.push(`<div style="margin-top:8px;">删除行 #${r.index + 1}</div>`);
                    const f = Object.keys(r.before || {});
                    f.slice(0, 6).forEach(k => {
                        parts.push(`<div style="padding-left:12px;display:flex;gap:8px;"><span>${fieldLabels[k] || k}：</span><span>${String(r.before[k] ?? '')}</span></div>`);
                    });
                } else if (r.type === 'modified') {
                    parts.push(`<div style="margin-top:8px;">修改行 #${r.index + 1}</div>`);
                    r.fields.slice(0, 6).forEach(fd => {
                        parts.push(`<div style="padding-left:12px;">${fieldLabels[fd.key] || fd.key}：<span style="color:#f44336;">${fd.before}</span> → <span style="color:var(--primary-color);">${fd.after}</span></div>`);
                    });
                }
            });
            return parts.join('');
        }
        function renderOperationHistoryList(query) {
            const list = document.getElementById('operationHistoryList');
            if (!list) return;
            list.innerHTML = '';
            const q = (query || '').toLowerCase();
            const items = operationHistory.slice().sort((x, y) => y.ts - x.ts).filter(e => {
                if (!q) return true;
                const text = `${e.type || ''} ${e.description || ''}`.toLowerCase();
                return text.includes(q);
            });
            items.forEach((entry, idx) => {
                const wrap = document.createElement('div');
                wrap.style.border = '1px solid var(--border-color)';
                wrap.style.borderRadius = '10px';
                wrap.style.padding = '10px';
                wrap.style.display = 'grid';
                wrap.style.gap = '6px';
                const title = document.createElement('div');
                title.style.fontWeight = '600';
                title.textContent = `${new Date(entry.ts).toLocaleString()} · ${entry.description || entry.type || ''}`;
                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.gap = '8px';
                const previewBtn = document.createElement('mdui-button');
                previewBtn.setAttribute('variant', 'outlined');
                previewBtn.textContent = '预览';
                previewBtn.addEventListener('click', () => {
                    const s = diffSummary(entry.beforeTable, entry.afterTable);
                    const kb = diffKeyboardSummary(entry.beforeKeyboard, entry.afterKeyboard);
                    const dlg = document.getElementById('operationPreviewDialog');
                    const content = document.getElementById('operationPreviewContent');
                    if (content) {
                        const lines = [
                            `<div>时间：${new Date(entry.ts).toLocaleString()}</div>`,
                            `<div>类型：${entry.type || ''}</div>`,
                            `<div>描述：${entry.description || ''}</div>`,
                            `<div>变更：行 ${s.beforeCount} → ${s.afterCount}（Δ ${s.deltaCount}），单元格变更 ${s.changedCells}</div>`
                        ];
                        if (kb.length) {
                            lines.push('<div>快捷短语变更：</div>');
                            kb.forEach(k => {
                                lines.push(`<div style="padding-left:12px;">${k.field}：长度Δ ${k.lenDiff}，顺序/内容变更 ${k.changed}</div>`);
                            });
                        }
                        const rowDetails = buildRowChangeDetails(entry.beforeTable, entry.afterTable, 5);
                        if (rowDetails) {
                            lines.push('<div style="margin-top:8px;">表格变更详情：</div>');
                            lines.push(rowDetails);
                        }
                        content.innerHTML = lines.join('');
                    }
                    if (dlg) dlg.open = true;
                });
                const rollbackBtn = document.createElement('mdui-button');
                rollbackBtn.setAttribute('variant', 'filled');
                rollbackBtn.textContent = '回退到此';
                rollbackBtn.addEventListener('click', () => {
                    tableData = deepCopyData(entry.beforeTable);
                    KeyboardConfigManager.config = deepCopyKeyboard(entry.beforeKeyboard);
                    saveKeyboardConfigSilent();
                    saveDataToIndexedDB();
                    updateTable();
                    updateSummary();
                    const idxInMain = operationHistory.findIndex(e => e.ts === entry.ts && e.type === entry.type);
                    historyCursor = Math.max(0, idxInMain);
                    saveOperationHistory();
                    showSnackbar('已回退到所选操作之前状态', 'success');
                });
                actions.appendChild(previewBtn);
                actions.appendChild(rollbackBtn);
                wrap.appendChild(title);
                wrap.appendChild(actions);
                list.appendChild(wrap);
            });
        }

		function recordShortcutClick(fieldKey, value) {
		    if (!fieldKey || !value) return;
		    const v = (value || '').toString();
		    if (getShortcutPreference(fieldKey, v).incrementClick === false) return;
		    if (!shortcutClickStats[fieldKey] || typeof shortcutClickStats[fieldKey] !== 'object') shortcutClickStats[fieldKey] = {};
		    shortcutClickStats[fieldKey][v] = (shortcutClickStats[fieldKey][v] || 0) + 1;
		    saveShortcutClickStats();
		}

		function getShortcutClickCount(fieldKey, value) {
		    const v = (value || '').toString();
		    const m = shortcutClickStats?.[fieldKey];
		    const n = m && typeof m === 'object' ? Number(m[v]) : 0;
		    return Number.isFinite(n) ? n : 0;
		}

		function setShortcutClickCount(fieldKey, value, count) {
		    if (!fieldKey || !value) return;
		    const v = String(value);
		    const next = Math.max(0, Math.min(999999999, Math.round(Number(count) || 0)));
		    if (!shortcutClickStats[fieldKey] || typeof shortcutClickStats[fieldKey] !== 'object') shortcutClickStats[fieldKey] = {};
		    if (next > 0) shortcutClickStats[fieldKey][v] = next;
		    else delete shortcutClickStats[fieldKey][v];
		    saveShortcutClickStats();
		}

		function shortcutPreferenceKey(value) {
		    return encodeURIComponent(String(value || ''));
		}

		function getShortcutPreference(fieldKey, value) {
		    const root = KeyboardConfigManager?.config?.shortcutPreferences;
		    const field = root && typeof root === 'object' ? root[fieldKey] : null;
		    const stored = field && typeof field === 'object' ? field[shortcutPreferenceKey(value)] : null;
		    return {
		        pinned: stored?.pinned === true,
		        incrementClick: stored?.incrementClick !== false
		    };
		}

		function setShortcutPreference(fieldKey, value, preference = {}) {
		    if (!fieldKey || !value) return;
		    if (!KeyboardConfigManager.config.shortcutPreferences || typeof KeyboardConfigManager.config.shortcutPreferences !== 'object') {
		        KeyboardConfigManager.config.shortcutPreferences = {};
		    }
		    if (!KeyboardConfigManager.config.shortcutPreferences[fieldKey] || typeof KeyboardConfigManager.config.shortcutPreferences[fieldKey] !== 'object') {
		        KeyboardConfigManager.config.shortcutPreferences[fieldKey] = {};
		    }
		    KeyboardConfigManager.config.shortcutPreferences[fieldKey][shortcutPreferenceKey(value)] = {
		        pinned: preference.pinned === true,
		        incrementClick: preference.incrementClick !== false
		    };
		}

		function removeShortcutPreference(fieldKey, value) {
		    const field = KeyboardConfigManager?.config?.shortcutPreferences?.[fieldKey];
		    if (field && typeof field === 'object') delete field[shortcutPreferenceKey(value)];
		}

		function migrateShortcutMetadata(fieldKey, oldValue, newValue) {
		    if (!fieldKey || oldValue === newValue) return;
		    const preference = getShortcutPreference(fieldKey, oldValue);
		    removeShortcutPreference(fieldKey, oldValue);
		    setShortcutPreference(fieldKey, newValue, preference);
		    const oldCount = getShortcutClickCount(fieldKey, oldValue);
		    const fieldStats = shortcutClickStats?.[fieldKey];
		    if (fieldStats && typeof fieldStats === 'object') delete fieldStats[String(oldValue)];
		    setShortcutClickCount(fieldKey, newValue, oldCount);
		}

		function buildShortcutEntries(options, rawOptions, fieldKey) {
		    return (options || []).map((value, index) => {
		        const rawValue = Array.isArray(rawOptions) && rawOptions[index] !== undefined ? rawOptions[index] : value;
		        const preference = getShortcutPreference(fieldKey, rawValue);
		        return {
		            value,
		            rawValue,
		            index,
		            pinned: preference.pinned === true,
		            hasVariable: /\$\{[^{}]+\}|\{[^{}]+\}/.test(String(rawValue || ''))
		        };
		    });
		}

		function sortShortcutEntriesForDisplay(entries, fieldKey) {
		    return (entries || []).slice().sort((a, b) => {
		        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
		        if (appSettings.shortcutRankByClicks) {
		            const clickDifference = getShortcutClickCount(fieldKey, b.rawValue) - getShortcutClickCount(fieldKey, a.rawValue);
		            if (clickDifference) return clickDifference;
		        }
		        return a.index - b.index;
		    });
		}

		function getShortcutDisplayEntries(fieldKey, templates = getTemplatesByField(fieldKey) || []) {
		    return sortShortcutEntriesForDisplay(buildShortcutEntries(processKeyboardTemplates(templates), templates, fieldKey), fieldKey);
		}

		function getShortcutDisplayOrder(fieldKey, templates = getTemplatesByField(fieldKey) || []) {
		    return getShortcutDisplayEntries(fieldKey, templates).map(entry => entry.rawValue);
		}

		function moveShortcutRelativeToPreview(fieldKey, sourceIndex, targetIndex, placement) {
		    const templates = getTemplatesByField(fieldKey);
		    if (!templates) return -1;
		    const entries = getShortcutDisplayEntries(fieldKey, templates);
		    const sourcePosition = entries.findIndex(entry => entry.index === sourceIndex);
		    if (sourcePosition < 0) return -1;
		    const [source] = entries.splice(sourcePosition, 1);
		    const targetPosition = entries.findIndex(entry => entry.index === targetIndex);
		    if (targetPosition < 0) return -1;
		    const insertPosition = targetPosition + (placement === 'after' ? 1 : 0);
		    entries.splice(insertPosition, 0, source);
		    templates.splice(0, templates.length, ...entries.map(entry => entry.rawValue));
		    return insertPosition;
		}

		function isAutoCompleteEnabledForField(fieldKey) {
		    const globalOn = appSettings.shortcutAutoCompleteEnabled !== false;
		    const map = appSettings.shortcutAutoCompleteByField && typeof appSettings.shortcutAutoCompleteByField === 'object'
		        ? appSettings.shortcutAutoCompleteByField
		        : {};
		    if (typeof map[fieldKey] === 'boolean') return map[fieldKey];
		    return globalOn;
		}

		function addShortcutTemplate(fieldKey, value) {
		    const templates = getTemplatesByField(fieldKey);
		    if (!templates) return false;
		    const val = (value || '').trim();
		    if (!val) return false;
		    const existedIndex = templates.findIndex(v => (v || '').trim() === val);
		    if (existedIndex >= 0) templates.splice(existedIndex, 1);
		    if (appSettings.shortcutAddPosition === 'last') templates.push(val);
		    else templates.unshift(val);
		    KeyboardConfigManager.save();
		    return true;
		}

		function applyShortcutToCurrentInput(fieldKey, value) {
		    const targetInput = resolveShortcutTargetInput(fieldKey);
		    if (!targetInput) return null;
		    currentInput = targetInput;
		    if (!isInputUsingVirtualKeyboard(targetInput)) window.__rsdbDesktopShortcutInput = targetInput;
		    const v = (value || '').toString();
		    if (isAutoCompleteEnabledForField(fieldKey)) {
		        targetInput.value = v;
		        const pos = v.length;
		        try {
		            targetInput.setSelectionRange(pos, pos);
		        } catch (e) {
		            try {
		                targetInput.selectionStart = pos;
		                targetInput.selectionEnd = pos;
		            } catch (e2) {}
		        }
		        targetInput.dispatchEvent(new Event('input', { bubbles: true }));
		        updateVirtualCursor();
		        setTimeout(updateVirtualCursor, 0);
		        scheduleShortcutKeysRefresh();
		        return targetInput;
		    }
		    insertText(v);
		    return targetInput;
		}

		function dismissSuggestedShortcut(fieldKey, value) {
		    if (!fieldKey || !value) return;
		    if (!(shortcutSuggestDismissedByField[fieldKey] instanceof Set)) shortcutSuggestDismissedByField[fieldKey] = new Set();
		    shortcutSuggestDismissedByField[fieldKey].add(value);
		    const stats = inputStats[fieldKey];
		    if (stats && typeof stats === 'object') {
		        delete stats[value];
		        saveInputStats();
		    }
		    scheduleShortcutKeysRefresh();
		}

		function addSuggestedShortcut(fieldKey, value) {
		    beginOperation('shortcut_add', '添加快捷短语：' + (fieldLabels[fieldKey] || fieldKey) + `（${(value || '').trim()}）`);
		    const ok = addShortcutTemplate(fieldKey, value);
		    const val = (value || '').trim();
		    if (!ok) return;
		    if (shortcutSuggestDismissedByField[fieldKey] instanceof Set) shortcutSuggestDismissedByField[fieldKey].delete(val);
		    commitOperation();
		    scheduleShortcutKeysRefresh();
		    showSnackbar('已添加快捷短语', 'success');
		}

		function createShortcutKeys(options, keyClass, fieldKey, rawOptions = null) {
		    currentShortcutFieldKey = fieldKey || null;
		    const editBtn = document.getElementById('shortcutEditToggleBtn');
		    if (editBtn) editBtn.setAttribute('icon', shortcutEditMode ? 'check' : 'edit');

		    const targetContainer = dom.shortcutKeysContainer || dom.shortcutContainer;
		    if (!targetContainer) return;
		    targetContainer.innerHTML = '';
		    let shortcutAnimationOrder = 0;
		    const markShortcutAnimation = element => {
		        element?.style.setProperty('--shortcut-order', String(Math.min(shortcutAnimationOrder++, 18)));
		        return element;
		    };

		    if (!fieldKey) {
		        if (dom.shortcutContainer) dom.shortcutContainer.style.display = 'none';
		        scheduleDesktopShortcutPanelSync();
		        return;
		    }

		    if (shortcutEditMode && fieldKey) {
		        if (dom.shortcutContainer) dom.shortcutContainer.style.display = 'block';
		        const list = (shortcutEditSession && shortcutEditSession.fieldKey === fieldKey)
		            ? (shortcutEditSession.working || [])
		            : (options || []);
		        list.forEach((option, idx) => {
		            const keyElement = document.createElement('div');
		            keyElement.className = `keyboard-key ${keyClass} shortcut-draggable`;
		            if (getShortcutPreference(fieldKey, option).pinned) keyElement.classList.add('shortcut-pinned');
		            keyElement.style.display = 'flex';
		            keyElement.style.alignItems = 'center';
		            keyElement.style.gap = '8px';
		            keyElement.style.paddingRight = '8px';
		            const label = document.createElement('div');
		            label.style.flex = '1';
		            label.style.minWidth = '0';
		            label.style.overflow = 'hidden';
		            label.style.textOverflow = 'ellipsis';
		            label.style.whiteSpace = 'nowrap';
		            label.textContent = processKeyboardTemplates([option])[0] ?? option;
		            const del = document.createElement('div');
		            del.className = 'shortcut-edit-delete';
		            del.innerHTML = '<mdui-icon name="delete" style="font-size:18px; pointer-events:none;"></mdui-icon>';
		            del.addEventListener('pointerdown', (e) => { e.stopPropagation(); }, { passive: true });
		            del.addEventListener('click', (e) => {
		                e.stopPropagation();
		                keyElement.remove();
		                const ordered = Array.from(targetContainer.querySelectorAll('.shortcut-draggable'))
		                    .map(n => n.dataset.value)
		                    .filter(v => typeof v === 'string' && v.length > 0);
		                if (shortcutEditSession && shortcutEditSession.fieldKey === fieldKey) {
		                    shortcutEditSession.working = ordered;
		                }
		                showSnackbar('已删除快捷短语（未保存）', 'info');
		            });
		            keyElement.appendChild(label);
		            keyElement.appendChild(del);
		            keyElement.dataset.value = option;
		            keyElement.dataset.index = String(idx);
		            keyElement.addEventListener('pointerdown', (e) => beginShortcutDrag(e, keyElement), { passive: true });
		            keyElement.addEventListener('pointermove', updateShortcutDrag, { passive: true });
		            keyElement.addEventListener('pointerup', endShortcutDrag, { passive: true });
		            keyElement.addEventListener('pointercancel', endShortcutDrag, { passive: true });
		            markShortcutAnimation(keyElement);
		            targetContainer.appendChild(keyElement);
		        });
		        return;
		    }

		    if (shortcutInlineAddState?.fieldKey === fieldKey) {
		        const row = document.createElement('div');
		        row.className = 'keyboard-row';
		        row.style.display = 'flex';
		        row.style.gap = '8px';
		        row.style.alignItems = 'center';
		        row.style.flexWrap = 'nowrap';

		        const input = document.createElement('input');
		        input.id = 'shortcutInlineAddInput';
		        input.type = 'text';
		        input.autocomplete = 'off';
		        input.spellcheck = false;
		        input.setAttribute('readonly', 'true');
		        input.classList.add('readonly-input');
		        input.placeholder = '添加快捷短语...';
		        input.value = (shortcutInlineAddState.value || '').toString();
		        input.style.flex = '1';
		        input.style.minWidth = '0';
		        input.style.height = '36px';
		        input.style.padding = '0 10px';
		        input.style.borderRadius = '10px';
		        input.style.border = '1px solid var(--border-color)';
		        input.style.background = 'var(--surface-color)';
		        input.style.color = 'var(--text-color)';
		        input.style.boxSizing = 'border-box';
		        input.addEventListener('input', () => {
		            if (shortcutInlineAddState) shortcutInlineAddState.value = input.value;
                    window.__rsdbLastCursorInteractAt = Date.now();
		            updateVirtualCursor();
		            setTimeout(updateVirtualCursor, 0);
		        });
		        input.addEventListener('click', (e) => {
		            e.stopPropagation();
                    window.__rsdbLastCursorInteractAt = Date.now();
		            currentInput = input;
		            input.focus();
		            moveCursorToClick(input, e);
		            updateVirtualCursor();
		        });
		        input.addEventListener('keydown', (e) => {
                    window.__rsdbLastCursorInteractAt = Date.now();
		            if (e.key === 'Enter') {
		                e.preventDefault();
		                commitShortcutInlineAdd();
		            } else if (e.key === 'Escape') {
		                e.preventDefault();
		                closeShortcutInlineAdd({ restoreKeyboard: true });
		            }
		        });

		        const editBtn = document.createElement('div');
		        editBtn.className = 'keyboard-key';
		        editBtn.innerHTML = '<mdui-icon name="edit" style="font-size:22px; pointer-events:none;"></mdui-icon>';
		        editBtn.style.width = '34px';
		        editBtn.style.height = '34px';
		        editBtn.style.minWidth = '34px';
		        editBtn.style.borderRadius = '999px';
		        editBtn.style.display = 'flex';
		        editBtn.style.alignItems = 'center';
		        editBtn.style.justifyContent = 'center';
		        editBtn.title = '编辑';
		        editBtn.addEventListener('click', () => openShortcutAddDialog(fieldKey, input.value));

		        const okBtn = document.createElement('div');
		        okBtn.className = 'keyboard-key status-key';
		        okBtn.innerHTML = '<mdui-icon name="check" style="font-size:22px; pointer-events:none;"></mdui-icon>';
		        okBtn.style.width = '34px';
		        okBtn.style.height = '34px';
		        okBtn.style.minWidth = '34px';
		        okBtn.style.borderRadius = '999px';
		        okBtn.style.display = 'flex';
		        okBtn.style.alignItems = 'center';
		        okBtn.style.justifyContent = 'center';
		        okBtn.title = '添加';
		        okBtn.addEventListener('click', commitShortcutInlineAdd);

		        const cancelBtn = document.createElement('div');
		        cancelBtn.className = 'keyboard-key';
		        cancelBtn.innerHTML = '<mdui-icon name="close" style="font-size:22px; pointer-events:none;"></mdui-icon>';
		        cancelBtn.style.width = '34px';
		        cancelBtn.style.height = '34px';
		        cancelBtn.style.minWidth = '34px';
		        cancelBtn.style.borderRadius = '999px';
		        cancelBtn.style.display = 'flex';
		        cancelBtn.style.alignItems = 'center';
		        cancelBtn.style.justifyContent = 'center';
		        cancelBtn.title = '取消';
		        cancelBtn.addEventListener('click', () => closeShortcutInlineAdd({ restoreKeyboard: true }));

		        row.appendChild(input);
		        row.appendChild(editBtn);
		        row.appendChild(okBtn);
		        row.appendChild(cancelBtn);
		        targetContainer.appendChild(row);
		    }

		    const rowsByField = appSettings.shortcutRowsByField && typeof appSettings.shortcutRowsByField === 'object' ? appSettings.shortcutRowsByField : {};
		    const perField = fieldKey ? Number(rowsByField[fieldKey]) : NaN;
		    const baseRows = Math.max(1, Math.min(3, Number(appSettings.shortcutRows) || 2));
		    const rowCount = Math.max(1, Math.min(3, Number.isFinite(perField) ? perField : baseRows));
            const shortcutRowHeight = 44;
            targetContainer.style.minHeight = `${rowCount * shortcutRowHeight}px`;
		    const rows = Array.from({ length: rowCount }, () => []);
		    const optionEntries = buildShortcutEntries(options, rawOptions, fieldKey);
		    const orderedEntries = sortShortcutEntriesForDisplay(optionEntries, fieldKey);
		    const allowAutoComplete = fieldKey ? isAutoCompleteEnabledForField(fieldKey) : (appSettings.shortcutAutoCompleteEnabled !== false);
		    const queryRaw =
		        allowAutoComplete && currentInput?.id !== 'shortcutInlineAddInput'
		            ? (currentInput?.value || '').toString()
		            : '';
		    const query = normalizeShortcutMatchText(queryRaw);
		    const queryCompact = normalizeShortcutMatchTextCompact(queryRaw);
		    const matchValue = (candidate) => {
		        if (!query) return true;
		        const v1 = normalizeShortcutMatchText(candidate);
		        if (v1.includes(query)) return true;
		        if (!queryCompact) return false;
		        const v2 = normalizeShortcutMatchTextCompact(candidate);
		        return v2.includes(queryCompact);
		    };
		    // 变量快捷短语显示的是“下一次点击值”，不能被刚插入的上一次值过滤掉。
		    const filteredOptions = orderedEntries.filter(o => o.hasVariable || matchValue(o.value));
		    const suggested = getSuggestedAddValues(fieldKey, options).filter(v => matchValue(v));
		    if (dom.shortcutContainer) dom.shortcutContainer.style.display = 'block';
		    if (filteredOptions.length === 0 && suggested.length === 0 && shortcutInlineAddState?.fieldKey !== fieldKey) {
		        const row = document.createElement('div');
		        row.className = 'keyboard-row';
		        const addKey = document.createElement('div');
		        addKey.className = 'keyboard-key shortcut-key suggest-add-key';
		        addKey.style.display = 'flex';
		        addKey.style.alignItems = 'center';
		        addKey.style.gap = '6px';
		        addKey.style.padding = '0 12px';
		        addKey.style.height = '40px';
		        addKey.style.borderRadius = '16px';
		        addKey.innerHTML = '<mdui-icon name="add" style="font-size:20px; pointer-events:none;"></mdui-icon><span style="white-space:nowrap; pointer-events:none;">添加输入框的文本到快捷短语</span>';
		        addKey.addEventListener('click', () => {
                    const val = (currentInput?.value || '').toString().trim();
                    if (!val) return openShortcutAddDialog(fieldKey, '');
                    addShortcutTemplate(fieldKey, val);
                    showSnackbar('已添加输入框内容到快捷短语', 'success');
                    refreshShortcutKeysForCurrentInput();
		        });
		        markShortcutAnimation(addKey);
		        row.appendChild(addKey);
		        targetContainer.appendChild(row);
		        return;
		    }
		    suggested.forEach((v, i) => {
		        rows[0].push({ kind: 'suggest', value: v, order: i });
		    });
		    filteredOptions.forEach((option, idx) => {
		        rows[idx % rowCount].push({ kind: 'template', value: option.value, rawValue: option.rawValue, index: option.index });
		    });

		    const createRow = (items) => {
		        const row = document.createElement('div');
		        row.className = 'keyboard-row';
		        items.forEach((item, columnIndex) => {
		            const keyElement = document.createElement('div');
		            keyElement.className = `keyboard-key ${keyClass}`;
		            // 同一列的不同分行共享延迟，所有行会一起逐个出现。
					keyElement.style.setProperty('--shortcut-order', String(Math.min(columnIndex, 60)));
                    keyElement.style.touchAction = 'none';
		            if (item.kind === 'suggest') {
		                keyElement.classList.add('suggest-add-key');
		                keyElement.style.display = 'flex';
		                keyElement.style.alignItems = 'center';
		                keyElement.style.justifyContent = 'space-between';
		                keyElement.style.gap = '10px';
		                keyElement.style.paddingRight = '10px';
		                const label = document.createElement('div');
		                label.style.flex = '1';
		                label.style.minWidth = '0';
		                label.style.overflow = 'hidden';
		                label.style.textOverflow = 'ellipsis';
		                label.style.whiteSpace = 'nowrap';
		                label.textContent = `+ ${item.value}`;
		                const xBtn = document.createElement('div');
		                xBtn.textContent = '×';
		                xBtn.style.width = '24px';
		                xBtn.style.height = '24px';
		                xBtn.style.display = 'grid';
		                xBtn.style.placeItems = 'center';
		                xBtn.style.borderRadius = '999px';
		                xBtn.style.background = 'rgba(0,0,0,0.14)';
		                xBtn.style.color = 'rgba(0,0,0,0.6)';
		                xBtn.style.flex = '0 0 auto';
		                xBtn.style.userSelect = 'none';
		                xBtn.style.touchAction = 'none';
		                xBtn.addEventListener('pointerdown', (e) => {
		                    e.stopPropagation();
		                    if (e.cancelable) e.preventDefault();
		                    xBtn.setPointerCapture?.(e.pointerId);
		                }, { passive: false });
		                xBtn.addEventListener('pointerup', (e) => {
		                    e.stopPropagation();
		                    if (e.cancelable) e.preventDefault();
		                    dismissSuggestedShortcut(fieldKey, item.value);
		                    xBtn.releasePointerCapture?.(e.pointerId);
		                }, { passive: false });
		                xBtn.addEventListener('pointercancel', (e) => {
		                    xBtn.releasePointerCapture?.(e.pointerId);
		                }, { passive: true });
		                keyElement.appendChild(label);
		                keyElement.appendChild(xBtn);
		                let pressTimer = null;
		                let longPressed = false;
		                const clearTimer = () => {
		                    clearTimeout(pressTimer);
		                    pressTimer = null;
		                };
		                keyElement.addEventListener('pointerdown', (e) => {
		                    if (e.cancelable) e.preventDefault();
		                    e.stopPropagation();
		                    longPressed = false;
		                    clearTimer();
		                    pressTimer = setTimeout(() => {
		                        longPressed = true;
		                        addSuggestedShortcut(fieldKey, item.value);
		                    }, 520);
		                    if (e.pointerId != null) keyElement.setPointerCapture?.(e.pointerId);
		                }, { passive: false });
		                keyElement.addEventListener('pointermove', (e) => {
		                    if (!pressTimer) return;
		                    if (Math.abs(e.movementX) > 8 || Math.abs(e.movementY) > 8) {
		                        clearTimer();
		                    }
		                }, { passive: true });
		                keyElement.addEventListener('pointerup', (e) => {
		                    if (e.cancelable) e.preventDefault();
		                    e.stopPropagation();
		                    clearTimer();
		                    if (!longPressed) {
		                        const liveValue = processKeyboardTemplates([item.rawValue ?? item.value], { commitState: true })[0] ?? item.value;
		                        const targetInput = applyShortcutToCurrentInput(fieldKey, liveValue);
		                        if (targetInput) {
		                            keyElement.textContent = liveValue;
		                            item.value = liveValue;
		                            recordShortcutClick(fieldKey, liveValue);
		                            targetInput.focus({ preventScroll: true });
		                        }
		                    }
		                    if (e.pointerId != null) keyElement.releasePointerCapture?.(e.pointerId);
		                }, { passive: false });
		                keyElement.addEventListener('click', (e) => {
		                    e.preventDefault();
		                    e.stopPropagation();
		                }, { passive: false });
		                keyElement.addEventListener('pointercancel', (e) => {
		                    e.stopPropagation();
		                    clearTimer();
		                    if (e.pointerId != null) keyElement.releasePointerCapture?.(e.pointerId);
		                }, { passive: true });
		            } else {
		                keyElement.textContent = item.value;
		                if (item.pinned) {
		                    keyElement.classList.add('shortcut-pinned');
		                    keyElement.setAttribute('aria-label', `已置顶：${item.value}`);
		                    const pinIcon = document.createElement('mdui-icon');
		                    pinIcon.setAttribute('name', 'push_pin');
		                    pinIcon.className = 'shortcut-pin-icon';
		                    keyElement.prepend(pinIcon);
		                }
		                let pressTimer = null;
		                let longPressed = false;
		                const clearTimer = () => {
		                    clearTimeout(pressTimer);
		                    pressTimer = null;
		                };
		                keyElement.addEventListener('pointerdown', (e) => {
		                    if (e.cancelable) e.preventDefault();
		                    e.stopPropagation();
		                    longPressed = false;
		                    clearTimer();
		                    pressTimer = setTimeout(() => {
		                        longPressed = true;
		                        setVirtualKeyboardVisible(false);
		                        const virtualCursor = document.getElementById('virtualCursor');
		                        if (virtualCursor) virtualCursor.style.display = 'none';
		                        openShortcutActionDialog(fieldKey, item.index);
		                    }, 500);
		                    if (e.pointerId != null) keyElement.setPointerCapture?.(e.pointerId);
		                }, { passive: false });
		                keyElement.addEventListener('pointermove', (e) => {
		                    if (!pressTimer) return;
		                    if (Math.abs(e.movementX) > 8 || Math.abs(e.movementY) > 8) {
		                        clearTimer();
		                    }
		                }, { passive: true });
		                keyElement.addEventListener('pointerup', (e) => {
		                    if (e.cancelable) e.preventDefault();
		                    e.stopPropagation();
		                    clearTimer();
		                    if (!longPressed) {
		                        const liveValue = processKeyboardTemplates([item.rawValue ?? item.value], { commitState: true })[0] ?? item.value;
		                        const targetInput = applyShortcutToCurrentInput(fieldKey, liveValue);
		                        if (targetInput) {
		                            keyElement.textContent = liveValue;
		                            item.value = liveValue;
		                            recordShortcutClick(fieldKey, item.rawValue ?? liveValue);
		                            targetInput.focus({ preventScroll: true });
		                        }
		                    }
		                    if (e.pointerId != null) keyElement.releasePointerCapture?.(e.pointerId);
		                }, { passive: false });
		                keyElement.addEventListener('click', (e) => {
		                    e.preventDefault();
		                    e.stopPropagation();
		                }, { passive: false });
		                keyElement.addEventListener('pointercancel', (e) => {
		                    e.stopPropagation();
		                    clearTimer();
		                    if (e.pointerId != null) keyElement.releasePointerCapture?.(e.pointerId);
		                }, { passive: true });
		            }
		            row.appendChild(keyElement);
		        });
		        return row;
		    };

		    const fragment = document.createDocumentFragment();
		    rows.forEach(r => {
		        if (r.length > 0) fragment.appendChild(createRow(r));
		    });
		    targetContainer.appendChild(fragment);
		}

		
// ==========================================
// === Virtual Keyboard Logic ===
// ==========================================

// 默认配置
const DEFAULT_KEYBOARD_CONFIG = {
  "customVariables": {},
  "dynamicVariables": [],
  "shortcutPreferences": {},
  "furnaceIdTemplates": [
    "265001649",
    "25C06550",
    "125122210",
    "12601178",
    "12601036",
    "265130020",
    "25D09356",
    "2520996704",
    "12512123",
    "265000649",
    "25C09115",
    "2521043832",
    "12601145",
    "12512288",
    "12601164",
    "2521043202",
    "1${lastYear}0",
    "1${year}0",
    "${lastYear}1050",
    "${lastYear}1051",
    "${lastYear}310",
    "${lastYear}110",
    "VD${lastYear}/",
    "VD${year}/",
    "${year}1",
    "1${year}1",
    "${lastYear}1",
    "1${lastYear}1",
    "25D06841",
    "25C06652"
  ],
  "productIdTemplates": [
    "TH",
    "TH5",
    "TH6"
  ],
  "cardIdTemplates": [
    "V2604-",
    "MOS605-",
    "SG602-",
    "V1621-",
    "HBS602-",
    "V15P131-",
    "MOS603-",
    "V3602-",
    "V2606-",
    "EURO601-",
    "V3601-",
    "HBS601-",
    "V2602-",
    "MOS602-",
    "型式试验用",
    "V1612-",
    "V1618-",
    "V1615-",
    "MOS601-",
    "V1609-",
    "V2603-",
    "V1611-",
    "V1620-",
    "SA505-",
    "V1617-",
    "V480-",
    "V15P135-",
    "V1622-",
    "SA601-",
    "TH2600541-",
    "MOS505-",
    "VT602-",
    "备库",
    "HAS601-",
    "V1603HA-",
    "V478-",
    "HBS506-",
    "V1605-",
    "V15P",
    "VS502-",
    "SG601-",
    "SG505-",
    "SG506-",
    "VS502-",
    "AUSA502-",
    "V2526-",
    "V2527-",
    "TS",
    "TH",
    "VT"
  ],
  "steelTypeTemplates": [
    "42CrMoS4+QT",
    "39NiCrMo3+QT",
    "C45E+N",
    "18NiCrMoS5+A",
    "S355J2+N",
    "C45R",
    "42CrMo4+QT",
    "20#",
    "817M40",
    "S355J2N",
    "C45R+N",
    "4140Ann",
    "39NiCrMoS3",
    "4340Q&T",
    "C45N",
    "18NiCrMoS5",
    "35CrMo",
    "4340Ann",
    "1.2714+QT",
    "080M40",
    "42CrMoS4",
    "S355J2",
    "C45",
    "C45Cr",
    "42CrMo4",
    "S355J2G3",
    "C45E",
    "C15E",
    "42CrMo4+Q",
    "55NiCrMoV7",
    "18NiCrMo5",
    "18CrMo4",
    "39NiCrMo3",
    "39NiCrMoS3+QT",
    "4140Q&T",
    "1045Norm",
    "1018Norm",
    "16/20MnCrS5",
    "16MnCrS5 HH+FP",
    "42CrMo4+HH+QT",
    "1.2714",
    "1.2344",
    "4145",
    "4130"
  ],
  "actualDiameterTemplates": [],
  "diameterTemplates": [],
  "lengthTemplates": [],
  "weightTemplates": [],
  "statusTemplates": [
    "正回火车光",
    "调质粗车",
    "车光",
    "退火车光",
    "正火车光",
    "空冷车光",
    "调质车光",
    "花皮",
    "空冷黑皮",
    "黑调",
    "花调"
  ],
  "positionTemplates": [
    "附近",
    "外",
    "过道",
    "立车",
    "打卡机",
    "校直机"
  ],
  "layouts": {
    "number": [
      [
        "%",
        "1",
        "2",
        "3",
        "+",
        "clear"
      ],
      [
        ":",
        "4",
        "5",
        "6",
        "-",
        "backspace"
      ],
      [
        "#",
        "7",
        "8",
        "9",
        "*",
        "esc"
      ],
      [
        "_",
        ".",
        "0",
        "/",
        "、",
        "done"
      ]
    ],
    "status": [
      [
        "clear",
        "backspace",
        "esc",
        "done"
      ]
    ],
    "text": [
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "0"
      ],
      [
        "q",
        "w",
        "e",
        "r",
        "t",
        "y",
        "u",
        "i",
        "o",
        "p"
      ],
      [
        "a",
        "s",
        "d",
        "f",
        "g",
        "h",
        "j",
        "k",
        "l",
        "+",
        "-"
      ],
      [
        "shift",
        "z",
        "x",
        "c",
        "v",
        "b",
        "n",
        "m",
        "backspace"
      ],
      [
        "symbol",
        ",",
        "space",
        ".",
        "done"
      ]
    ],
    "textShift": [
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "0"
      ],
      [
        "Q",
        "W",
        "E",
        "R",
        "T",
        "Y",
        "U",
        "I",
        "O",
        "P"
      ],
      [
        "A",
        "S",
        "D",
        "F",
        "G",
        "H",
        "J",
        "K",
        "L",
        "+",
        "-"
      ],
      [
        "shift",
        "Z",
        "X",
        "C",
        "V",
        "B",
        "N",
        "M",
        "backspace"
      ],
      [
        "symbol",
        ",",
        "space",
        ".",
        "done"
      ]
    ],
    "position": [
      [
        "%",
        "1",
        "2",
        "3",
        "A"
      ],
      [
        "/",
        "4",
        "5",
        "6",
        "B"
      ],
      [
        "+",
        "7",
        "8",
        "9",
        "C"
      ],
      [
        "*",
        "/",
        "0",
        "-",
        "D"
      ],
      [
        "clear",
        "backspace",
        "esc",
        "done"
      ]
    ],
    "symbol": [
      [
        "~",
        "!",
        "@",
        "#",
        "$",
        "%",
        "^",
        "&",
        "*",
        "(",
        ")"
      ],
      [
        "_",
        "+",
        "=",
        "|",
        "\\",
        ":",
        "\"",
        "<",
        ">",
        "?",
        ","
      ],
      [
        "`",
        "}",
        "[",
        "]",
        "{",
        "(",
        ")",
        ".",
        "/",
        "system"
      ],
      [
        "ABC",
        "space",
        "backspace",
        "clear",
        "done"
      ]
    ]
  },
  "symbolMap": {
    "q": "1",
    "w": "2",
    "e": "3",
    "r": "4",
    "t": "5",
    "y": "6",
    "u": "7",
    "i": "8",
    "o": "9",
    "p": "0",
    "a": "~",
    "s": "!",
    "d": "@",
    "f": "#",
    "g": "%",
    "h": "“",
    "j": "”",
    "k": "*",
    "l": "？",
    "z": "(",
    "x": ")",
    "c": "-",
    "v": "_",
    "b": ":",
    "n": ";",
    "m": "/"
  }
};

// 配置管理器
