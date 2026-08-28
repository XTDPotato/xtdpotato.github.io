function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log('【导入】文件选择：', file.name, '大小：', (file.size / 1024 / 1024).toFixed(2), 'MB');

    if (file.size > 20 * 1024 * 1024) {
        showSnackbar('文件太大（>20MB），请压缩后导入', 'error');
        dom.fileInput.value = '';
        return;
    }

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.zip') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const importedDocumentName = normalizeDocumentName(file.name);
        if (importedDocumentName) {
            currentDocumentName = importedDocumentName;
            localStorage.setItem('rsdb_current_document_name', importedDocumentName);
        }
    }

    if (fileName.endsWith('.zip')) {
        showSnackbar('正在解析 ZIP 文件...', 'info');
        JSZip.loadAsync(file)
            .then(zip => {
                let excelEntry = null;
                const imageEntries = {}; // 产品号 -> zip entry

                zip.forEach((relativePath, entry) => {
                    const lowerPath = relativePath.toLowerCase();
                    if (lowerPath.endsWith('.xlsx') || lowerPath.endsWith('.xls')) {
                        excelEntry = entry;
                    } else if (/\.(jpg|jpeg|png)$/i.test(lowerPath)) {
                        // 支持多种命名格式：产品号.jpg、产品号_xxx.jpg、xxx-产品号.png
                        const match = relativePath.match(/([A-Za-z0-9]+)\.(jpg|jpeg|png)$/i);
                        if (match && match[1]) {
                            imageEntries[match[1].trim()] = entry;
                            console.log('【ZIP】找到图片：产品号', match[1], '路径', relativePath);
                        }
                    }
                });

                if (!excelEntry) {
                    showSnackbar('ZIP 中未找到 Excel 文件', 'error');
                    dom.fileInput.value = '';
                    return;
                }

                excelEntry.async('arraybuffer').then(buffer => {
                    const wb = XLSX.read(buffer, { type: 'array', cellStyles: true });
                    processWorkbookImport(wb, imageEntries, []);
                }).catch(err => {
                    console.error('【导入 ZIP】Excel 读取失败：', err);
                    showSnackbar('ZIP 内 Excel 读取失败', 'error');
                });
            })
            .catch(err => {
                console.error('【导入 ZIP】解析失败：', err);
                showSnackbar('ZIP 文件解析失败', 'error');
                dom.fileInput.value = '';
            });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        showSnackbar('正在读取 Excel 文件（含嵌入图片）...', 'info');
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const data = event.target.result;
                const zip = await JSZip.loadAsync(data);
                const embeddedImages = []; // 按行顺序存储嵌入图片 base64

                let imageId = 1;
                for (const fileName in zip.files) {
                    if (fileName.match(/xl\/media\/image\d+\.(jpeg|jpg|png)/i)) {
                        const base64 = await zip.files[fileName].async('base64');
                        const ext = fileName.match(/\.(jpeg|jpg|png)/i)?.[1] || 'jpeg';
                        embeddedImages.push(`data:image/${ext};base64,${base64}`);
                        console.log('【导入】找到嵌入图片 ID:', imageId);
                        imageId++;
                    }
                }

                const wb = XLSX.read(data, { type: 'array', cellStyles: true });
                processWorkbookImport(wb, {}, embeddedImages);
            } catch (err) {
                console.error('【导入】Excel + 嵌入图片解析失败：', err);
                showSnackbar('文件解析失败，请检查是否包含图片', 'error');
                dom.fileInput.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        showSnackbar('仅支持 .xlsx、.xls 或 .zip 文件', 'warning');
        dom.fileInput.value = '';
    }
}

		function processWorkbookImport(workbook, zipImageEntries = {}, embeddedImages = []) {
		    console.log('【批量导入】函数被调用！当前时间：', new Date().toLocaleString());
    console.log('【批量导入】工作表数量：', workbook.SheetNames?.length || '未知');

    if (!workbook || !workbook.SheetNames) {
        console.error('【批量导入】工作簿无效或为空！');
        showSnackbar('导入文件无效，请检查格式', 'error');
        return;
    }

    console.log('【批量导入】开始解析工作表...');
		    const sheetNames = workbook.SheetNames;

		    const proceedWithSheet = (sheetName) => {
		        const headerMapping = {
		            '钢种': 'steelType',
		            '产品号': 'productId',
		            '卡片号': 'cardId',
		            '炉号': 'furnaceId',
		            '实际直径': 'actualDiameter',
		            '直径': 'diameter',
		            '长度': 'length',
		            '重量': 'weight',
		            '状态': 'status',
		            '位置': 'position',
		            '硬度': 'hardness',
		            '备注': 'remarks',
		            '卡片图片': 'cardImage'
		        };

		        const theoreticalWeightKeywords = ['理算重量', '理论重量', '理重'];

		        const worksheet = workbook.Sheets[sheetName];
		        const range = XLSX.utils.decode_range(worksheet['!ref']);
		        const rawData = [];
		        const importedCellValue = (cell) => {
		            if (!cell) return '';
	            // Excel formula cells expose the formula separately from the cached result.
	            // Use the cached display value so filtered rows show the number, not "=...".
	            const hasFormula = !!cell.f || (typeof cell.v === 'string' && /^\s*=/.test(cell.v));
	            if (hasFormula && cell.w !== undefined && cell.w !== null && String(cell.w) !== '') return cell.w;
	            return cell.v !== undefined && cell.v !== null ? cell.v : '';
	        };

		        for (let r = range.s.r; r <= range.e.r; r++) {
		            const row = [];
		            for (let c = range.s.c; c <= range.e.c; c++) {
		                const cellAddress = XLSX.utils.encode_cell({ r, c });
		                const cell = worksheet[cellAddress];
		                row.push(importedCellValue(cell));
		            }
		            rawData.push(row);
		        }

		        let headerRowIndex = -1;
		        for (let i = 0; i < Math.min(rawData.length, 20); i++) {
		            if (rawData[i].some(cell => {
		                const str = String(cell || '').trim();
		                return str.includes('产品号') || str.includes('钢种') || str.includes('炉号') || str.includes('卡片号');
		            })) {
		                headerRowIndex = i;
		                break;
		            }
		        }

		        if (headerRowIndex === -1) {
		            showSnackbar('未能找到表头行', 'error');
		            dom.fileInput.value = '';
		            return;
		        }

		        const headerRow = rawData[headerRowIndex].map(cell => String(cell || '').trim());
		        const dataRows = rawData.slice(headerRowIndex + 1);

		        const colMapping = {};
		        let theoreticalWeightCol = -1;
		        let imageColIndex = -1;

		        headerRow.forEach((header, idx) => {
		            if (!header) return;
		            const cleanHeader = header.replace(/[\s\(\)（）【】\[\]mmkg千克米]/g, '');

		            if (headerMapping[cleanHeader]) {
		                colMapping[headerMapping[cleanHeader]] = idx;
		            }
		            if (cleanHeader.includes('卡片图片') || cleanHeader.includes('图片')) {
		                imageColIndex = idx;
		            }
		            if (theoreticalWeightKeywords.some(kw => cleanHeader.includes(kw))) {
		                theoreticalWeightCol = idx;
		            }
		        });

		        const formattedData = dataRows.map((row, rowIndex) => {
		            const item = {};
		            const importedCellStyles = {};
		            const importedDisplayValues = {};

		            for (const field in colMapping) {
		                const colIdx = colMapping[field];
		                if (row[colIdx] !== undefined && row[colIdx] !== '') {
		                    let value = String(row[colIdx]).trim();
		                    if (field === 'weight') {
		                        const num = parseFloat(value);
		                        if (!isNaN(num)) value = Math.round(num).toString();
		                    }
		                    item[field] = value;
		                    const sourceCell = worksheet[XLSX.utils.encode_cell({ r: headerRowIndex + 1 + rowIndex, c: colIdx })];
		                    if (sourceCell && (sourceCell.f || (typeof sourceCell.v === 'string' && /^\s*=/.test(sourceCell.v)))
		                        && sourceCell.w !== undefined && sourceCell.w !== null && String(sourceCell.w) !== '') {
		                        importedDisplayValues[field] = sourceCell.w;
		                    }
		                    const importedFormat = sheetCellToFormat(sourceCell);
		                    if (importedFormat) importedCellStyles[field] = importedFormat;
		                }
		            }
		            if (Object.keys(importedCellStyles).length) item.__cellStyles = importedCellStyles;
		            if (Object.keys(importedDisplayValues).length) item.__cellDisplayValues = importedDisplayValues;

		            if (theoreticalWeightCol !== -1 && row[theoreticalWeightCol] !== '') {
		                const num = parseFloat(String(row[theoreticalWeightCol]).trim());
		                if (!isNaN(num)) item.weight = Math.round(num).toString();
		            }

		            if (item.productId && zipImageEntries[item.productId]) {
		                zipImageEntries[item.productId].async('base64').then(base64 => {
		                    item.cardImage = `data:image/jpeg;base64,${base64}`;
		                }).catch(() => {});
		            } else if (embeddedImages.length > 0 && rowIndex < embeddedImages.length) {
		                item.cardImage = embeddedImages[rowIndex];
		            }

		            return (item.productId || item.cardId || item.furnaceId || item.steelType) ? item : null;
		        }).filter(item => item !== null);

		        if (formattedData.length === 0) {
		            showSnackbar('未找到有效数据行', 'warning');
		            dom.fileInput.value = '';
		            return;
		        }

		        const totalImported = formattedData.length;
		        const newData = [];
		        const duplicateEntries = [];
		        const existingByProductId = new Map(
		            tableData
		                .filter(item => item?.productId)
		                .map(item => [item.productId.trim(), item])
		        );

		        formattedData.forEach(newItem => {
		            const existingItem = newItem.productId
		                ? existingByProductId.get(newItem.productId.trim())
		                : null;

		            if (!existingItem) {
		                newData.push(newItem);
		            } else {
		                duplicateEntries.push({
		                    productId: newItem.productId,
		                    existingItem,
		                    newItem,
		                    differences: getObjectDifferences(existingItem, newItem)
		                });
		            }
		        });

		if (duplicateEntries.length > 0) {
    showDuplicateConfirmationModal(duplicateEntries, newData, totalImported);
} else {
    finalizeImport(newData, [], totalImported);
}
		    };

		    if (sheetNames.length > 1) {
		        const options = sheetNames.map(name => 
		            `<mdui-menu-item value="${name.replace(/"/g, '&quot;')}">${name}</mdui-menu-item>`
		        ).join('');

		        dom.confirmMessage.innerHTML = `
		            <div style="padding: 16px;">
		                <div style="font-size: 1.1rem; margin-bottom: 16px; text-align: center;">检测到多个工作表，请选择：</div>
		                <mdui-select id="sheetSelect" variant="outlined" placement="bottom" value="${sheetNames[0].replace(/"/g, '&quot;')}" style="width: 100%;">
		                    ${options}
		                </mdui-select>
		            </div>
		        `;

		        openCustomModal(dom.confirmModal);
		        dom.confirmActionBtn.textContent = '确定';

		        dom.confirmActionBtn.onclick = () => {
		            const selectEl = dom.confirmModal.querySelector('#sheetSelect');
		            const selectedSheet = selectEl.value;
		            closeCustomModal(dom.confirmModal);
		            proceedWithSheet(selectedSheet);
		        };

		        dom.cancelConfirmBtn.onclick = () => {
		            closeCustomModal(dom.confirmModal);

		            dom.fileInput.value = '';
		        };
		    } else {
		        proceedWithSheet(sheetNames[0]);
		    }
		}

		async function exportToExcel(exportBaseName = getExportBaseName()) {
		    const exportData = getFilteredData();
		    if (exportData.length === 0) {
		        showSnackbar('暂无数据可导出', 'warning');
		        return;
		    }
		    const exportRowIndexMap = new Map(tableData.map((item, rowIndex) => [item, rowIndex]));

		    const workbook = new ExcelJS.Workbook();
		    const worksheet = workbook.addWorksheet('圆棒入库数据');
		    const exportValue = (item, field) => getSearchFieldValue(item, field) ?? '';

		    const columns = [
		        { header: '序号', key: 'seq', width: 8 },
		        { header: '钢种', key: 'steelType', width: 15 },
		        { header: '产品号', key: 'productId', width: 18 },
		        { header: '卡片号', key: 'cardId', width: 12 },
		        { header: '炉号', key: 'furnaceId', width: 12 },
		        { header: '实际直径', key: 'actualDiameter', width: 12 },
		        { header: '直径', key: 'diameter', width: 10 },
		        { header: '长度', key: 'length', width: 10 },
		        { header: '重量', key: 'weight', width: 10 },
		        { header: '状态', key: 'status', width: 10 },
		        { header: '位置', key: 'position', width: 10 },
		        { header: '硬度', key: 'hardness', width: 10 },
		        { header: '备注', key: 'remarks', width: 20 },
		        { header: '卡片图片', key: 'cardImage', width: 12 }
		    ];
		    const tableWidths = getExcelColumnWidthsFromTable(columns.map(c => c.header));
		    columns.forEach((c, i) => { if (tableWidths[i]) c.width = tableWidths[i]; });
		    worksheet.columns = columns;

		    const headerRow = worksheet.getRow(1);
		    headerRow.font = { bold: true };
		    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

		    const total = exportData.length + 2;
		    try {
		        updateExportProgress(0, total, `准备导出（共 ${exportData.length} 条）...`);
		        await new Promise(requestAnimationFrame);

		        for (let index = 0; index < exportData.length; index++) {
		            const item = exportData[index];
		            updateExportProgress(index + 1, total, `正在生成数据（${index + 1}/${exportData.length}）...`);
		            if (index % 10 === 0) await new Promise(requestAnimationFrame);

		            const row = worksheet.addRow({
		                seq: index + 1,
		                steelType: exportValue(item, 'steelType'),
		                productId: exportValue(item, 'productId'),
		                cardId: exportValue(item, 'cardId'),
		                furnaceId: exportValue(item, 'furnaceId'),
		                actualDiameter: toExcelNumericValue(exportValue(item, 'actualDiameter')),
		                diameter: toExcelNumericValue(exportValue(item, 'diameter')),
		                length: toExcelNumericValue(exportValue(item, 'length')),
		                weight: toExcelNumericValue(exportValue(item, 'weight')),
		                status: exportValue(item, 'status'),
		                position: exportValue(item, 'position'),
		                hardness: toExcelNumericValue(exportValue(item, 'hardness')),
		                remarks: exportValue(item, 'remarks'),
		                cardImage: ''
		            });

		            row.height = 22;
		            const formatFields = ['steelType', 'productId', 'cardId', 'furnaceId', 'actualDiameter', 'diameter', 'length', 'weight', 'status', 'position', 'hardness', 'remarks'];
		            const sourceRowIndex = exportRowIndexMap.get(item);
		            formatFields.forEach((field, fieldIndex) => {
		                const format = Number.isInteger(sourceRowIndex)
		                    ? getCellFormat(sourceRowIndex, field)
		                    : item.__cellStyles?.[field];
		                applyExcelCellFormat(row.getCell(fieldIndex + 2), format);
		                const fontSize = Number(format?.fontSize);
		                if (Number.isFinite(fontSize) && fontSize > 0) row.height = Math.max(row.height, Math.ceil(fontSize * 1.5));
		                if (format?.wrapText) row.height = Math.max(row.height, 36);
		            });

		            if (item.cardImage && item.cardImage.startsWith('data:image/')) {
		                const base64Data = item.cardImage.split(',')[1];
		                const ext = item.cardImage.match(/data:image\/(jpeg|png);/)?.[1] || 'jpeg';

		                const imageId = workbook.addImage({
		                    base64: base64Data,
		                    extension: ext,
		                });

		                worksheet.addImage(imageId, {
		                    tl: { col: 13, row: index + 1 },
		                    ext: { width: 40, height: 30 },
		                    editAs: 'oneCell'
		                });
		            }
		        }

		        updateExportProgress(exportData.length + 1, total, '正在生成 Excel 文件...');
		        await new Promise(requestAnimationFrame);
		        const buffer = await workbook.xlsx.writeBuffer();
		        const blob = new Blob([buffer], { type: 'application/octet-stream' });
		        saveAs(blob, `${getExportBaseName(exportBaseName)}.xlsx`);
		        showSnackbar('导出成功！图片已嵌入表格', 'success');
		    } finally {
		        closeExportProgress();
		    }
		}

		function sanitizeFileName(name) {
		    return (name || '').toString().replace(/[\\\/:*?"<>|]/g, '_').trim();
		}

		function getCurrentDateFileName(date = new Date()) {
		    const year = date.getFullYear();
		    const month = String(date.getMonth() + 1).padStart(2, '0');
		    const day = String(date.getDate()).padStart(2, '0');
		    return `${year}-${month}-${day}`;
		}

		function getExportBaseName(preferredName = '') {
		    return normalizeDocumentName(preferredName || currentDocumentName || getCurrentDateFileName()) || getCurrentDateFileName();
		}

		function getExcelColumnWidthsFromTable(headers, headerAlias) {
		    const ths = Array.from(document.querySelectorAll('#dataTable thead th'));
		    if (ths.length === 0) return headers.map(() => null);
		    const map = new Map();
		    ths.forEach(th => {
		        const text = (th.textContent || '').trim();
		        if (!text) return;
		        const w = th.getBoundingClientRect().width;
		        if (Number.isFinite(w) && w > 0) map.set(text, w);
		    });
		    const alias = headerAlias && typeof headerAlias === 'object' ? headerAlias : {};
		    const pxToExcel = (px) => Math.max(8, Math.min(60, Math.round(px / 7)));
		    return headers.map(h => {
		        const key = alias[h] || h;
		        const px = map.get(key);
		        return Number.isFinite(px) ? pxToExcel(px) : null;
		    });
		}

		function setExportProgressState(open, current, total, text) {
		    const dlg = document.getElementById('exportProgressDialog');
		    if (!dlg) return;
		    if (open) {
		        document.body.appendChild(dlg);
		        dlg.style.zIndex = '22000';
		        dlg.open = true;
		    } else {
		        dlg.open = false;
		    }
		    const label = document.getElementById('exportProgressText');
		    if (label) label.textContent = text || '';
		    const bar = document.getElementById('exportProgressBar');
		    const percent = document.getElementById('exportProgressPercent');
		    const safeTotal = Math.max(1, Number(total) || 1);
		    const safeCurrent = Math.max(0, Math.min(safeTotal, Number(current) || 0));
		    const v = safeCurrent / safeTotal;
		    if (bar) bar.value = v;
		    if (percent) percent.textContent = `${Math.round(v * 100)}%`;
		}

		function updateExportProgress(current, total, text) {
		    setExportProgressState(true, current, total, text);
		}

		function closeExportProgress() {
		    setExportProgressState(false, 0, 1, '');
		}

		async function exportToZipWithImages(exportBaseName = getExportBaseName()) {
		    const exportData = getFilteredData();
		    if (exportData.length === 0) {
		        showSnackbar('暂无数据可导出', 'warning');
		        return;
		    }
		    const exportRowIndexMap = new Map(tableData.map((item, rowIndex) => [item, rowIndex]));

		    exportBaseName = getExportBaseName(exportBaseName);
		    const zip = new JSZip();
		    const imagesFolder = zip.folder('images');

		    const workbook = new ExcelJS.Workbook();
		    const worksheet = workbook.addWorksheet('圆棒入库数据');

		    const columns = [
		        { header: '序号', key: 'seq', width: 8 },
		        { header: '钢种', key: 'steelType', width: 15 },
		        { header: '产品号', key: 'productId', width: 18 },
		        { header: '卡片号', key: 'cardId', width: 12 },
		        { header: '炉号', key: 'furnaceId', width: 12 },
		        { header: '实际直径', key: 'actualDiameter', width: 12 },
		        { header: '直径', key: 'diameter', width: 10 },
		        { header: '长度', key: 'length', width: 10 },
		        { header: '重量', key: 'weight', width: 10 },
		        { header: '状态', key: 'status', width: 10 },
		        { header: '位置', key: 'position', width: 10 },
		        { header: '硬度', key: 'hardness', width: 10 },
		        { header: '备注', key: 'remarks', width: 20 },
		        { header: '卡片图片文件', key: 'cardImageFile', width: 28 }
		    ];
		    const tableWidths = getExcelColumnWidthsFromTable(columns.map(c => c.header), { '卡片图片文件': '卡片图片' });
		    columns.forEach((c, i) => { if (tableWidths[i]) c.width = tableWidths[i]; });
		    worksheet.columns = columns;

		    const headerRow = worksheet.getRow(1);
		    headerRow.font = { bold: true };
		    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

		    const total = exportData.length + 2;
		    try {
		        updateExportProgress(0, total, `准备导出（共 ${exportData.length} 条）...`);
		        await new Promise(requestAnimationFrame);

		        for (let index = 0; index < exportData.length; index++) {
		            const item = exportData[index];
		            updateExportProgress(index + 1, total, `正在生成数据（${index + 1}/${exportData.length}）...`);
		            if (index % 20 === 0) await new Promise(requestAnimationFrame);

		            let imageFileName = '';
		            if (item.cardImage && item.cardImage.startsWith('data:image/')) {
		                const m = item.cardImage.match(/^data:image\/(png|jpeg|jpg);base64,(.*)$/);
		                if (m && m[2]) {
		                    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
		                    const baseName = sanitizeFileName(item.productId || item.cardId || `item_${index + 1}`) || `item_${index + 1}`;
		                    imageFileName = `${baseName}_${index + 1}.${ext}`;
		                    imagesFolder.file(imageFileName, m[2], { base64: true });
		                }
		            }

		            const row = worksheet.addRow({
		                seq: index + 1,
		                steelType: item.steelType || '',
		                productId: item.productId || '',
		                cardId: item.cardId || '',
		                furnaceId: item.furnaceId || '',
		                actualDiameter: toExcelNumericValue(item.actualDiameter),
		                diameter: toExcelNumericValue(item.diameter),
		                length: toExcelNumericValue(item.length),
		                weight: toExcelNumericValue(item.weight),
		                status: item.status || '',
		                position: item.position || '',
		                hardness: toExcelNumericValue(item.hardness),
		                remarks: item.remarks || '',
		                cardImageFile: imageFileName ? `images/${imageFileName}` : ''
		            });
		            const formatFields = ['steelType', 'productId', 'cardId', 'furnaceId', 'actualDiameter', 'diameter', 'length', 'weight', 'status', 'position', 'hardness', 'remarks'];
		            const sourceRowIndex = exportRowIndexMap.get(item);
		            formatFields.forEach((field, fieldIndex) => {
		                const format = Number.isInteger(sourceRowIndex)
		                    ? getCellFormat(sourceRowIndex, field)
		                    : item.__cellStyles?.[field];
		                applyExcelCellFormat(row.getCell(fieldIndex + 2), format);
		                const fontSize = Number(format?.fontSize);
		                if (Number.isFinite(fontSize) && fontSize > 0) row.height = Math.max(Number(row.height) || 22, Math.ceil(fontSize * 1.5));
		                if (format?.wrapText) row.height = Math.max(Number(row.height) || 22, 36);
		            });
		        }

		        updateExportProgress(exportData.length + 1, total, '正在生成 Excel 文件...');
		        await new Promise(requestAnimationFrame);
		        const buffer = await workbook.xlsx.writeBuffer();
		        zip.file(`${exportBaseName}.xlsx`, buffer);

		        updateExportProgress(exportData.length + 2, total, '正在打包 ZIP...');
		        await new Promise(requestAnimationFrame);
		        const blob = await zip.generateAsync({ type: 'blob' });
		        saveAs(blob, `${exportBaseName}.zip`);
		        showSnackbar('导出成功！图片已外放到 ZIP', 'success');
		    } finally {
		        closeExportProgress();
		    }
		}

		const CALCULATOR_DENSITY_STORAGE_KEY = 'rsdb_calculator_density';
		const CALCULATOR_FORMULA_STORAGE_KEY = 'rsdb_calculator_formula';
		const DEFAULT_CALCULATOR_DENSITY = 0.00617;
		const DEFAULT_CALCULATOR_FORMULA = '直径1×直径2×长度×密度÷1000';
		const CALCULATOR_FORMULA_TOKENS = {
		    diameter1: '直径 1',
		    diameter2: '直径 2',
		    length: '长度',
		    density: '密度'
		};
		const CALCULATOR_FORMULA_TOKEN_PATTERN = /diameter1|diameter2|直径1|直径2|length|长度|density|密度/gi;
		let calculatorFormulaSelectionRange = null;

		function normalizeCalculatorTokenName(value) {
		    const normalized = String(value || '').toLowerCase();
		    if (normalized === 'diameter1' || value === '直径1') return 'diameter1';
		    if (normalized === 'diameter2' || value === '直径2') return 'diameter2';
		    if (normalized === 'length' || value === '长度') return 'length';
		    if (normalized === 'density' || value === '密度') return 'density';
		    return '';
		}

		function createCalculatorFormulaToken(tokenName) {
		    const token = normalizeCalculatorTokenName(tokenName);
		    if (!token) return null;
		    const element = document.createElement('span');
		    element.className = 'formula-token';
		    element.contentEditable = 'false';
		    element.dataset.token = token;
		    element.textContent = CALCULATOR_FORMULA_TOKENS[token];
		    return element;
		}

		function renderCalculatorFormulaEditor(formula) {
		    const editor = dom.calcFormulaEditor;
		    if (!editor) return;
		    const source = String(formula || '');
		    const fragment = document.createDocumentFragment();
		    let cursor = 0;
		    source.replace(CALCULATOR_FORMULA_TOKEN_PATTERN, (match, offset) => {
		        if (offset > cursor) fragment.appendChild(document.createTextNode(source.slice(cursor, offset)));
		        const token = createCalculatorFormulaToken(match);
		        if (token) {
		            fragment.appendChild(token);
		            fragment.appendChild(document.createTextNode('\u200B'));
		        }
		        cursor = offset + match.length;
		        return match;
		    });
		    if (cursor < source.length) fragment.appendChild(document.createTextNode(source.slice(cursor)));
		    if (!fragment.childNodes.length) fragment.appendChild(document.createTextNode(''));
		    editor.replaceChildren(fragment);
		    ensureCalculatorFormulaCaretAnchors();
		}

		function ensureCalculatorFormulaCaretAnchors() {
		    const editor = dom.calcFormulaEditor;
		    if (!editor) return;
		    editor.querySelectorAll('.formula-token').forEach(token => {
		        const next = token.nextSibling;
		        if (next?.nodeType === Node.TEXT_NODE) {
		            next.nodeValue = `\u200B${String(next.nodeValue || '').replace(/^\u200B+/, '')}`;
		        } else {
		            token.after(document.createTextNode('\u200B'));
		        }
		    });
		}

		function cleanupCalculatorFormulaEditor() {
		    const editor = dom.calcFormulaEditor;
		    if (!editor) return;
		    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
		    const textNodes = [];
		    while (walker.nextNode()) textNodes.push(walker.currentNode);
		    textNodes.forEach(node => {
		        node.nodeValue = String(node.nodeValue || '').replace(/\u200B+/g, '\u200B');
		        if (!node.nodeValue) node.remove();
		    });
		    editor.normalize();
		    ensureCalculatorFormulaCaretAnchors();
		}

		function serializeCalculatorFormulaEditor() {
		    const editor = dom.calcFormulaEditor;
		    if (!editor) return '';
		    const readNode = (node) => {
		        if (node.nodeType === Node.TEXT_NODE) return String(node.nodeValue || '').replace(/\u200B/g, '');
		        if (node.nodeType !== Node.ELEMENT_NODE) return '';
		        if (node.classList.contains('formula-token')) return node.dataset.token || '';
		        if (node.tagName === 'BR') return '';
		        return Array.from(node.childNodes).map(readNode).join('');
		    };
		    return Array.from(editor.childNodes).map(readNode).join('');
		}

		function syncCalculatorFormulaFromEditor() {
		    if (!dom.calcFormula) return;
		    dom.calcFormula.value = serializeCalculatorFormulaEditor();
		    dom.calcFormula.dispatchEvent(new Event('input', { bubbles: true }));
		}

		function getFormulaInsertionRange() {
		    const editor = dom.calcFormulaEditor;
		    if (!editor) return null;
		    const selection = window.getSelection();
		    if (document.activeElement === editor && selection?.rangeCount) {
		        const current = selection.getRangeAt(0);
		        if (editor.contains(current.commonAncestorContainer)) return current;
		    }
		    if (calculatorFormulaSelectionRange
		        && editor.contains(calculatorFormulaSelectionRange.commonAncestorContainer)) {
		        return calculatorFormulaSelectionRange.cloneRange();
		    }
		    const range = document.createRange();
		    range.selectNodeContents(editor);
		    range.collapse(false);
		    return range;
		}

		function insertCalculatorFormulaToken(tokenName) {
		    const editor = dom.calcFormulaEditor;
		    const token = createCalculatorFormulaToken(tokenName);
		    const range = getFormulaInsertionRange();
		    if (!editor || !token || !range) return;
		    editor.focus({ preventScroll: true });
		    range.deleteContents();
		    range.insertNode(token);
		    const caretNode = document.createTextNode('\u200B');
		    token.after(caretNode);
		    const selection = window.getSelection();
		    range.setStart(caretNode, 1);
		    range.collapse(true);
		    selection.removeAllRanges();
		    selection.addRange(range);
		    calculatorFormulaSelectionRange = range.cloneRange();
		    cleanupCalculatorFormulaEditor();
		    syncCalculatorFormulaFromEditor();
		}

		function findAdjacentFormulaToken(range, direction) {
		    const editor = dom.calcFormulaEditor;
		    let container = range.startContainer;
		    let offset = range.startOffset;
		    if (!editor || !editor.contains(container)) return null;

		    if (container.nodeType === Node.TEXT_NODE) {
		        const text = String(container.nodeValue || '').replace(/\u200B/g, '');
		        const cleanOffset = String(container.nodeValue || '').slice(0, offset).replace(/\u200B/g, '').length;
		        if ((direction < 0 && cleanOffset > 0) || (direction > 0 && cleanOffset < text.length)) return null;
		        offset = Array.prototype.indexOf.call(editor.childNodes, container) + (direction > 0 ? 1 : 0);
		        container = editor;
		    } else if (container !== editor) {
		        let directChild = container;
		        while (directChild?.parentNode && directChild.parentNode !== editor) directChild = directChild.parentNode;
		        if (!directChild || directChild.parentNode !== editor) return null;
		        offset = Array.prototype.indexOf.call(editor.childNodes, directChild) + (direction > 0 ? 1 : 0);
		        container = editor;
		    }

		    const candidate = direction < 0 ? container.childNodes[offset - 1] : container.childNodes[offset];
		    return candidate?.classList?.contains('formula-token') ? candidate : null;
		}

		function removeCalculatorFormulaToken(token) {
		    const editor = dom.calcFormulaEditor;
		    if (!editor || !token?.parentNode) return;
		    const parent = token.parentNode;
		    const index = Array.prototype.indexOf.call(parent.childNodes, token);
		    const anchor = token.nextSibling?.nodeType === Node.TEXT_NODE && token.nextSibling.nodeValue?.startsWith('\u200B')
		        ? token.nextSibling
		        : null;
		    if (anchor) {
		        anchor.nodeValue = anchor.nodeValue.slice(1);
		        if (!anchor.nodeValue) anchor.remove();
		    }
		    token.remove();
		    cleanupCalculatorFormulaEditor();
		    const selection = window.getSelection();
		    const range = document.createRange();
		    range.setStart(editor, Math.min(index, editor.childNodes.length));
		    range.collapse(true);
		    selection.removeAllRanges();
		    selection.addRange(range);
		    calculatorFormulaSelectionRange = range.cloneRange();
		    syncCalculatorFormulaFromEditor();
		}

		function rememberCalculatorFormulaSelection() {
		    const editor = dom.calcFormulaEditor;
		    const selection = window.getSelection();
		    if (!editor || !selection?.rangeCount) return;
		    const range = selection.getRangeAt(0);
		    if (editor.contains(range.commonAncestorContainer)) {
		        calculatorFormulaSelectionRange = range.cloneRange();
		    }
		}

		function initCalculatorFormulaEditor() {
		    const editor = dom.calcFormulaEditor;
		    if (!editor || editor.dataset.bound) return;
		    editor.dataset.bound = 'true';
		    editor.addEventListener('beforeinput', (event) => {
		        if (event.inputType !== 'insertText' || !event.data) return;
		        if (/[^0-9+\-*/^().×÷\s]/.test(event.data)) event.preventDefault();
		    });
		    editor.addEventListener('paste', (event) => {
		        event.preventDefault();
		        const raw = event.clipboardData?.getData('text/plain') || '';
		        const safe = raw.replace(/[^0-9+\-*/^().×÷\s]/g, '');
		        if (!safe) return;
		        const range = getFormulaInsertionRange();
		        if (!range) return;
		        const textNode = document.createTextNode(safe);
		        range.deleteContents();
		        range.insertNode(textNode);
		        range.setStartAfter(textNode);
		        range.collapse(true);
		        const selection = window.getSelection();
		        selection.removeAllRanges();
		        selection.addRange(range);
		        syncCalculatorFormulaFromEditor();
		    });
		    editor.addEventListener('keydown', (event) => {
		        if (!['Backspace', 'Delete'].includes(event.key)) return;
		        const selection = window.getSelection();
		        if (!selection?.rangeCount) return;
		        const range = selection.getRangeAt(0);
		        if (!range.collapsed || !editor.contains(range.commonAncestorContainer)) return;
		        const token = findAdjacentFormulaToken(range, event.key === 'Backspace' ? -1 : 1);
		        if (!token) return;
		        event.preventDefault();
		        removeCalculatorFormulaToken(token);
		    });
		    editor.addEventListener('input', () => {
		        rememberCalculatorFormulaSelection();
		        syncCalculatorFormulaFromEditor();
		    });
		    editor.addEventListener('keyup', rememberCalculatorFormulaSelection);
		    editor.addEventListener('pointerup', rememberCalculatorFormulaSelection);
		    document.addEventListener('selectionchange', rememberCalculatorFormulaSelection);
		    editor.addEventListener('focus', () => {
		        currentInput = null;
		        setVirtualKeyboardVisible(false);
		        rememberCalculatorFormulaSelection();
		    });
		    editor.addEventListener('blur', () => {
		        if (!serializeCalculatorFormulaEditor().trim()) {
		            renderCalculatorFormulaEditor(DEFAULT_CALCULATOR_FORMULA);
		            syncCalculatorFormulaFromEditor();
		        }
		    });
		    document.querySelectorAll('.formula-token-insert').forEach(button => {
		        button.addEventListener('pointerdown', (event) => {
		            event.preventDefault();
		            rememberCalculatorFormulaSelection();
		        });
		        button.addEventListener('click', (event) => {
		            event.preventDefault();
		            insertCalculatorFormulaToken(button.dataset.token || '');
		        });
		    });
		}

		function normalizeCalculatorFormula(formula) {
		    return String(formula || '')
		        .replace(/\s+/g, '')
		        .replace(/直径1/g, 'd1')
		        .replace(/直径2/g, 'd2')
		        .replace(/长度/g, 'length')
		        .replace(/密度/g, 'density')
		        .replace(/diameter1/gi, 'd1')
		        .replace(/diameter2/gi, 'd2')
		        .replace(/[×xX]/g, '*')
		        .replace(/[÷]/g, '/')
		        .replace(/\\/g, '/')
		        .replace(/[（]/g, '(')
		        .replace(/[）]/g, ')')
		        .replace(/π/g, 'pi');
		}

		function parseCalculatorFormula(formula) {
		    const source = normalizeCalculatorFormula(formula);
		    if (!source) throw new Error('公式不能为空');
		    let index = 0;
		    const allowedVariables = new Set(['d1', 'd2', 'length', 'density', 'pi']);

		    function parseExpression() {
		        let node = parseTerm();
		        while (source[index] === '+' || source[index] === '-') {
		            const operator = source[index++];
		            node = { type: 'binary', operator, left: node, right: parseTerm() };
		        }
		        return node;
		    }

		    function parseTerm() {
		        let node = parsePower();
		        while (source[index] === '*' || source[index] === '/') {
		            const operator = source[index++];
		            node = { type: 'binary', operator, left: node, right: parsePower() };
		        }
		        return node;
		    }

		    function parsePower() {
		        let node = parseUnary();
		        if (source[index] === '^') {
		            index++;
		            node = { type: 'binary', operator: '^', left: node, right: parsePower() };
		        }
		        return node;
		    }

		    function parseUnary() {
		        if (source[index] === '+' || source[index] === '-') {
		            const operator = source[index++];
		            return { type: 'unary', operator, value: parseUnary() };
		        }
		        return parsePrimary();
		    }

		    function parsePrimary() {
		        if (source[index] === '(') {
		            index++;
		            const node = parseExpression();
		            if (source[index] !== ')') throw new Error('公式括号不完整');
		            index++;
		            return node;
		        }

		        const numberMatch = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
		        if (numberMatch) {
		            index += numberMatch[0].length;
		            return { type: 'number', value: Number(numberMatch[0]) };
		        }

		        const identifierMatch = source.slice(index).match(/^[a-z_][a-z0-9_]*/i);
		        if (identifierMatch) {
		            const name = identifierMatch[0].toLowerCase();
		            index += identifierMatch[0].length;
		            if (!allowedVariables.has(name)) throw new Error(`不支持的变量“${identifierMatch[0]}”`);
		            return { type: 'variable', name };
		        }

		        throw new Error(`公式中存在无法识别的内容${source[index] ? `“${source[index]}”` : ''}`);
		    }

		    const ast = parseExpression();
		    if (index !== source.length) throw new Error(`公式中存在无法识别的内容“${source[index]}”`);
		    return ast;
		}

		function evaluateCalculatorFormula(node, variables) {
		    if (node.type === 'number') return node.value;
		    if (node.type === 'variable') return node.name === 'pi' ? Math.PI : variables[node.name];
		    if (node.type === 'unary') {
		        const value = evaluateCalculatorFormula(node.value, variables);
		        return node.operator === '-' ? -value : value;
		    }
		    const left = evaluateCalculatorFormula(node.left, variables);
		    const right = evaluateCalculatorFormula(node.right, variables);
		    if (node.operator === '+') return left + right;
		    if (node.operator === '-') return left - right;
		    if (node.operator === '*') return left * right;
		    if (node.operator === '/') {
		        if (right === 0) throw new Error('公式不能除以 0');
		        return left / right;
		    }
		    if (node.operator === '^') return Math.pow(left, right);
		    throw new Error('公式运算符无效');
		}

		function setCalculatorFormulaStatus(message = '') {
		    if (!dom.calcFormulaStatus) return;
		    dom.calcFormulaStatus.textContent = message;
		    dom.calcFormulaStatus.hidden = !message;
		}

		function loadCalculatorSettings() {
		    const storedDensity = parseFloat(localStorage.getItem(CALCULATOR_DENSITY_STORAGE_KEY));
		    const density = Number.isFinite(storedDensity) && storedDensity > 0
		        ? storedDensity
		        : DEFAULT_CALCULATOR_DENSITY;
		    const storedFormula = localStorage.getItem(CALCULATOR_FORMULA_STORAGE_KEY);
		    if (dom.calcDensity) dom.calcDensity.value = String(density);
		    const formula = storedFormula?.trim() || DEFAULT_CALCULATOR_FORMULA;
		    if (dom.calcFormula) dom.calcFormula.value = formula;
		    renderCalculatorFormulaEditor(formula);
		    calculatorFormulaSelectionRange = null;
		}

		function calculateWeight() {
		    const diameter1 = parseFloat(dom.calcDiameter1.value) || 0;
		    const diameter2 = parseFloat(dom.calcDiameter2.value) || 0;
		    const length = parseFloat(dom.calcLength.value) || 0;
		    const density = parseFloat(dom.calcDensity.value);
		    const formula = dom.calcFormula?.value || DEFAULT_CALCULATOR_FORMULA;
		    let ast;

		    try {
		        ast = parseCalculatorFormula(formula);
		    } catch (error) {
		        dom.calcResult.value = '';
		        setCalculatorFormulaStatus(error.message || '公式格式不正确');
		        return false;
		    }

		    if (!Number.isFinite(density) || density <= 0) {
		        dom.calcResult.value = '';
		        setCalculatorFormulaStatus('密度必须大于 0');
		        return false;
		    }
		    if (diameter1 <= 0 || diameter2 <= 0 || length <= 0) {
		        dom.calcResult.value = '';
		        setCalculatorFormulaStatus('');
		        return false;
		    }

		    try {
		        const weight = evaluateCalculatorFormula(ast, {
		            d1: diameter1,
		            d2: diameter2,
		            length,
		            density
		        });
		        if (!Number.isFinite(weight) || weight <= 0) throw new Error('公式结果必须大于 0');
		        dom.calcResult.value = weight.toFixed(2);
		        setCalculatorFormulaStatus('');
		        return true;
		    } catch (error) {
		        dom.calcResult.value = '';
		        setCalculatorFormulaStatus(error.message || '公式计算失败');
		        return false;
		    }
		}

		function sanitizeCalculatorNumber(value) {
		    const source = String(value ?? '');
		    const normalized = source.replace(/[^0-9.]/g, '');
		    const dotIndex = normalized.indexOf('.');
		    return dotIndex < 0
		        ? normalized
		        : `${normalized.slice(0, dotIndex + 1)}${normalized.slice(dotIndex + 1).replace(/\./g, '')}`;
		}

		function bindCalculatorNumberInput(input) {
		    if (!input || input.dataset.numberOnlyBound) return;
		    input.dataset.numberOnlyBound = 'true';
		    input.setAttribute('inputmode', 'decimal');
		    input.addEventListener('beforeinput', event => {
		        if (event.inputType?.startsWith('delete') || !event.data) return;
		        if (/[^0-9.]/.test(event.data) || (event.data.includes('.') && input.value.includes('.'))) {
		            event.preventDefault();
		        }
		    });
		    input.addEventListener('input', () => {
		        const safe = sanitizeCalculatorNumber(input.value);
		        if (safe !== input.value) input.value = safe;
		        calculateWeight();
		    });
		    input.addEventListener('change', () => {
		        const safe = sanitizeCalculatorNumber(input.value);
		        if (safe !== input.value) input.value = safe;
		        calculateWeight();
		    });
		    input.addEventListener('paste', event => {
		        event.preventDefault();
		        const text = event.clipboardData?.getData('text') || '';
		        const safe = sanitizeCalculatorNumber(text);
		        const start = input.selectionStart ?? input.value.length;
		        const end = input.selectionEnd ?? start;
		        input.setRangeText(safe, start, end, 'end');
		        input.dispatchEvent(new Event('input', { bubbles: true }));
		    });
		}

		function initAutoCalculate() {
		    initCalculatorFormulaEditor();
		    const calcInputs = [dom.calcDiameter1, dom.calcDiameter2, dom.calcLength, dom.calcDensity];
		    calcInputs.forEach(input => {
		        if (!input) return;
		        bindCalculatorNumberInput(input);
		    });

		    dom.calcDensity?.addEventListener('input', () => {
		        const density = parseFloat(dom.calcDensity.value);
		        if (Number.isFinite(density) && density > 0) {
		            localStorage.setItem(CALCULATOR_DENSITY_STORAGE_KEY, String(density));
		        }
		        calculateWeight();
		    });
		    dom.calcDensity?.addEventListener('blur', () => {
		        const density = parseFloat(dom.calcDensity.value);
		        if (!Number.isFinite(density) || density <= 0) {
		            const savedDensity = parseFloat(localStorage.getItem(CALCULATOR_DENSITY_STORAGE_KEY));
		            dom.calcDensity.value = String(Number.isFinite(savedDensity) && savedDensity > 0
		                ? savedDensity
		                : DEFAULT_CALCULATOR_DENSITY);
		            calculateWeight();
		        }
		    });

		    dom.calcFormula?.addEventListener('input', () => {
		        localStorage.setItem(CALCULATOR_FORMULA_STORAGE_KEY, dom.calcFormula.value);
		        calculateWeight();
		    });

		    dom.resetCalcFormulaBtn?.addEventListener('click', () => {
		        renderCalculatorFormulaEditor(DEFAULT_CALCULATOR_FORMULA);
		        syncCalculatorFormulaFromEditor();
		        calculatorFormulaSelectionRange = null;
		        setCalculatorFormulaStatus('已恢复默认公式');
		        dom.calcFormulaEditor?.focus({ preventScroll: true });
		    });

		    [dom.calcDensity, dom.calcFormulaEditor].forEach(input => {
		        input?.addEventListener('focus', () => {
		            currentInput = null;
		            setVirtualKeyboardVisible(false);
		        });
		    });

		    calculateWeight();
		}
		// 表格无图片格子点击 → 直接唤起拍照并替换
function startDirectTakePhoto(dataIndex) {
    chooseCardImage({ capture: true, targetIndex: dataIndex, mode: 'direct_take' });
}

		function calculateAndAddData() {
		    const diameter1 = parseFloat(dom.calcDiameter1.value);
		    const diameter2 = parseFloat(dom.calcDiameter2.value);
		    const length = parseFloat(dom.calcLength.value);

		    if (isNaN(diameter1) || isNaN(diameter2) || isNaN(length) || diameter1 <= 0 || diameter2 <= 0 || length <= 0) {
		      showSnackbar('请输入有效的计算参数', 'error');
		      return;
		    }
		    if (!calculateWeight()) {
		      showSnackbar('请检查密度和计算公式', 'error');
		      return;
		    }
		    const weight = parseFloat(dom.calcResult.value);
		    if (!Number.isFinite(weight) || weight <= 0) {
		      showSnackbar('计算结果无效', 'error');
		      return;
		    }

		    const minDiameter = Math.min(diameter1, diameter2);
		    const maxDiameter = Math.max(diameter1, diameter2);
		    // 修复1：不保留小数 - 四舍五入取整，同时修正模板字符串插值语法（原转义字符错误）
		    const actualDiameter = `${Math.round(minDiameter)}-${Math.round(maxDiameter)}`;
		    // 修复2：平均直径不保留小数
		    const averageDiameter = Math.round((minDiameter + maxDiameter) / 2);

		    const preFilledData = {
		      actualDiameter: actualDiameter,
		      diameter: averageDiameter, 
		      // 修复3：长度、重量不保留小数
		      length: Math.round(length),
		      weight: Math.round(weight)
		    };

		    closeCustomModal(dom.calculatorModal); 
		    setVirtualKeyboardVisible(false); 
		    openAddModalWithData(preFilledData);
		}

		function toggleMultiSelectMode() {
		  isMultiSelectMode = !isMultiSelectMode;
		  selectedRows.clear();
		  if (isMultiSelectMode && isCellMultiSelectMode) {
		      isCellMultiSelectMode = false;
		      selectedCells.clear();
		  }
          
          // Sync Checkbox
		  if (dom.multiSelectCheckbox) {
		      dom.multiSelectCheckbox.checked = isMultiSelectMode;
		  }

		  const menuText = dom.multiSelectMenuText;
		  if (isMultiSelectMode) {
		    if (menuText) menuText.textContent = '退出多选模式';
		  } else {
		    if (menuText) menuText.textContent = '进入多选模式';
		  }
		  dom.multiSelectMenuItem?.setAttribute('icon', isMultiSelectMode ? 'check_box' : 'check_box_outline_blank');

		  updateTable();
		}

		function initCalculatorKeyboard() {
		  const calcInputs = [dom.calcDiameter1, dom.calcDiameter2, dom.calcLength];
		  calcInputs.forEach(input => {
		    if (input) {
		      applyConfiguredKeyboardMode(input);
              // Removed triple-click and double-click logic for input
              // Only simple click remains which focuses and shows virtual keyboard if readonly
              
		      input.addEventListener('click', (e) => {
		          if (input.hasAttribute('readonly')) {
		            currentInput = e.target;
		            updateKeyboardForInput(currentInput);
		            showVirtualKeyboard();
		            currentInput.focus();

		            const modalContent = document.getElementById('calculatorContent');
		            if(modalContent) {
		                setTimeout(() => {
		                    const inputRect = currentInput.getBoundingClientRect();
		                    const modalRect = modalContent.getBoundingClientRect();
		                    const offset = inputRect.top - modalRect.top + modalContent.scrollTop - modalRect.height * 0.3; 
		                    modalContent.scrollTo({ top: offset, behavior: 'smooth' });
		                }, 50);
		            }
		          } else {
		            currentInput = input;
		            setVirtualKeyboardVisible(false);
		            input.focus();
		          }
		      });
		    }
		  });
		}
		// ==================== 多字段排序核心函数（支持记忆 + 修复模板错误） ====================

		const SORT_RULES_KEY = 'sortRulesMemory'; // localStorage 键名

		// 保存当前排序规则到 localStorage
		function saveSortRulesToStorage(rules) {
		    localStorage.setItem(SORT_RULES_KEY, JSON.stringify(rules));
		}

		// 从 localStorage 读取上次排序规则
		function loadSortRulesFromStorage() {
		    const saved = localStorage.getItem(SORT_RULES_KEY);
		    if (!saved) return null;
		    try {
		        return JSON.parse(saved);
		    } catch (e) {
		        return null;
		    }
		}

		function openSortModal() {
		    dom.drawer.open = false;
		    openCustomModal(dom.sortModal);

		    // 清空容器
		    dom.sortRulesContainer.innerHTML = '';

		    // 尝试加载上次记忆的排序规则
		    const savedRules = loadSortRulesFromStorage();

		    if (savedRules && savedRules.length > 0) {
		        // 恢复记忆的规则
		        savedRules.forEach(rule => {
		            addSortRule(rule.field, rule.order);
		        });
		    } else {
		        // 没有记忆时，默认添加一条：卡片号升序
		        addSortRule('cardId', 'asc');
		    }

		    updateAddButtonState();
		}

		function addSortRule(field = 'productId', order = 'asc') {
		    if (dom.sortRulesContainer.children.length >= 5) {
		        showSnackbar('最多支持5个排序规则', 'warning');
		        return;
		    }

		    const ruleDiv = document.createElement('div');
		    ruleDiv.className = 'sort-rule';

		    const priority = document.createElement('div');
		    priority.className = 'sort-rule-priority';
		    priority.setAttribute('aria-label', '排序优先级');

		    // === 字段选择 mdui-select ===
		    const fieldSelect = document.createElement('mdui-select');
		    fieldSelect.className = 'sort-rule-field rsdb-bounded-select';
		    fieldSelect.dataset.role = 'field';
		    fieldSelect.dataset.currentValue = field;
		    fieldSelect.variant = 'outlined';
		    fieldSelect.label = '排序字段';
		    fieldSelect.placement = 'auto';

		    sortFieldOptions.forEach(opt => {
		        const option = document.createElement('mdui-menu-item');
		        option.value = opt.value;
		        option.textContent = opt.label;
		        if (opt.value === field) option.selected = true;
		        fieldSelect.appendChild(option);
		    });
		    fieldSelect.setAttribute('value', field);
		    fieldSelect.addEventListener('change', () => {
		        if (fieldSelect.value) fieldSelect.dataset.currentValue = fieldSelect.value;
		    });

		    // === 排序方向 Material 3 分段按钮 ===
		    const normalizedOrder = order === 'desc' ? 'desc' : 'asc';
		    const directionGroup = document.createElement('mdui-segmented-button-group');
		    directionGroup.className = 'sort-rule-direction';
		    directionGroup.dataset.role = 'order';
		    directionGroup.dataset.currentValue = normalizedOrder;
		    directionGroup.selects = 'single';
		    directionGroup.setAttribute('value', normalizedOrder);
		    directionGroup.addEventListener('change', () => {
		        if (directionGroup.value) directionGroup.dataset.currentValue = directionGroup.value;
		    });

		    const ascButton = document.createElement('mdui-segmented-button');
		    ascButton.setAttribute('value', 'asc');
		    ascButton.setAttribute('icon', 'arrow_upward');
		    ascButton.textContent = '升序';

		    const descButton = document.createElement('mdui-segmented-button');
		    descButton.setAttribute('value', 'desc');
		    descButton.setAttribute('icon', 'arrow_downward');
		    descButton.textContent = '降序';

		    directionGroup.appendChild(ascButton);
		    directionGroup.appendChild(descButton);

		    const actions = document.createElement('div');
		    actions.className = 'sort-rule-actions';

		    const createRuleAction = (icon, label, onClick, className = '') => {
		        const button = document.createElement('mdui-button-icon');
		        button.setAttribute('icon', icon);
		        button.className = className;
		        button.setAttribute('aria-label', label);
		        button.title = label;
		        button.addEventListener('click', onClick);
		        actions.appendChild(button);
		        return button;
		    };

		    createRuleAction('arrow_upward', '提高优先级', () => moveSortRule(ruleDiv, -1), 'sort-rule-move-up');
		    createRuleAction('arrow_downward', '降低优先级', () => moveSortRule(ruleDiv, 1), 'sort-rule-move-down');

		    // === 删除按钮 ===
		    createRuleAction('delete', '删除排序规则', () => {
		        ruleDiv.remove();
		        updateSortRulesUi();
		    }, 'sort-rule-delete');

		    // 组装
		    ruleDiv.appendChild(priority);
		    ruleDiv.appendChild(fieldSelect);
		    ruleDiv.appendChild(directionGroup);
		    ruleDiv.appendChild(actions);

		    dom.sortRulesContainer.appendChild(ruleDiv);
		    fieldSelect.value = field;
		    directionGroup.value = normalizedOrder;
		    updateSortRulesUi();
		}

		function moveSortRule(ruleElement, direction) {
		    if (!ruleElement || ![-1, 1].includes(direction)) return;
		    const sibling = direction < 0 ? ruleElement.previousElementSibling : ruleElement.nextElementSibling;
		    if (!sibling) return;
		    if (direction < 0) {
		        dom.sortRulesContainer.insertBefore(ruleElement, sibling);
		    } else {
		        dom.sortRulesContainer.insertBefore(sibling, ruleElement);
		    }
		    updateSortRulesUi();
		    if (appSettings?.animationsEnabled !== false && typeof ruleElement.animate === 'function') {
		        ruleElement.animate(
		            [{ transform: `translateY(${direction < 0 ? '8px' : '-8px'})` }, { transform: 'translateY(0)' }],
		            { duration: 180, easing: 'ease-out' }
		        );
		    }
		}

		function updateSortRulesUi() {
		    const count = dom.sortRulesContainer.children.length;
		    dom.addSortRuleBtn.disabled = count >= 5;
		    dom.applySortBtn.disabled = count === 0;
		    if (dom.sortRuleCount) dom.sortRuleCount.textContent = `共 ${count} 条`;
		    if (dom.sortRulesEmptyState) dom.sortRulesEmptyState.hidden = count !== 0;

		    Array.from(dom.sortRulesContainer.children).forEach((rule, index, rules) => {
		        const priorityLabel = rule.querySelector('.sort-rule-priority');
		        const upBtn = rule.querySelector('.sort-rule-move-up');
		        const downBtn = rule.querySelector('.sort-rule-move-down');
		        if (priorityLabel) {
		            priorityLabel.textContent = String(index + 1);
		            priorityLabel.title = `第 ${index + 1} 优先级`;
		        }
		        if (upBtn) {
		            upBtn.disabled = index === 0;
		            upBtn.toggleAttribute('disabled', index === 0);
		        }
		        if (downBtn) {
		            downBtn.disabled = index === rules.length - 1;
		            downBtn.toggleAttribute('disabled', index === rules.length - 1);
		        }
		    });
		}

		function updateAddButtonState() {
		    updateSortRulesUi();
		}

		function applySort() {
		    const rules = [];
		    const ruleElements = dom.sortRulesContainer.querySelectorAll('.sort-rule');

		    if (ruleElements.length === 0) {
		        showSnackbar('请至少添加一个排序规则', 'warning');
		        return;
		    }

		    ruleElements.forEach(el => {
		        const fieldSelect = el.querySelector('[data-role="field"]');
		        const orderSelect = el.querySelector('[data-role="order"]');

		        const field = fieldSelect?.value || fieldSelect?.dataset.currentValue;
		        const order = orderSelect?.value || orderSelect?.dataset.currentValue;

		        if (field && order) {
		            rules.push({ field, order });
		        }
		    });

		    // 执行排序
		    beginOperation('sort', '应用排序规则');
		    tableData.sort((a, b) => {
		        for (const rule of rules) {
		            let aVal = a[rule.field] ?? '';
		            let bVal = b[rule.field] ?? '';

		            let cmp = 0;
		            if (numericSortFields.includes(rule.field)) {
		                const aNum = parseFloat(aVal) || 0;
		                const bNum = parseFloat(bVal) || 0;
		                cmp = aNum - bNum;
		            } else {
		                cmp = String(aVal).localeCompare(String(bVal), 'zh-CN', { numeric: true, sensitivity: 'base' });
		            }

		            if (cmp !== 0) {
		                return rule.order === 'asc' ? cmp : -cmp;
		            }
		        }
		        return 0;
		    });

		    // 【关键】应用后保存本次规则到 localStorage，实现记忆功能
		    saveSortRulesToStorage(rules);

		    saveDataToIndexedDB();
		    currentPage = 1;  
		    updateTable();
		    commitOperation();
		    closeCustomModal(dom.sortModal);

		    const msgParts = rules.map((r, i) =>
		    `第${i + 1}优先级：【${fieldLabels[r.field]}】${r.order === 'asc' ? '升序' : '降序'}`
		);
		showSnackbar('排序已应用：' + msgParts.join(' → '), 'success');

		    }
		function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('读取失败'));
        reader.readAsDataURL(file);
    });
}

		async function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        let done = false;
        const finish = (err, value) => {
            if (done) return;
            done = true;
            if (err) reject(err);
            else resolve(value);
        };

        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.onerror = () => finish(reader.error || new Error('读取失败'));
        img.onerror = () => finish(new Error('图片解码失败'));

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.max(1, Math.round(width * ratio));
                    height = Math.max(1, Math.round(height * ratio));
                } else {
                    width = Math.max(1, Math.round(width));
                    height = Math.max(1, Math.round(height));
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    finish(new Error('canvas不可用'));
                    return;
                }
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                if (typeof canvas.toBlob === 'function') {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            finish(new Error('压缩失败'));
                            return;
                        }
                        const r = new FileReader();
                        r.onload = () => finish(null, r.result);
                        r.onerror = () => finish(r.error || new Error('读取失败'));
                        r.readAsDataURL(blob);
                    }, 'image/jpeg', Math.max(0.1, Math.min(1, Number(quality) || 0.85)));
                    return;
                }

                finish(null, canvas.toDataURL('image/jpeg', Math.max(0.1, Math.min(1, Number(quality) || 0.85))));
            } catch (err) {
                finish(err);
            }
        };

        reader.readAsDataURL(file);
    });
}

		async function rotateImageBase64(base64, rotateDeg, quality = 0.92) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        let done = false;
        const finish = (err, value) => {
            if (done) return;
            done = true;
            if (err) reject(err);
            else resolve(value);
        };
        img.onload = () => {
            try {
                const deg = ((Number(rotateDeg) || 0) % 360 + 360) % 360;
                const w = img.naturalWidth || img.width;
                const h = img.naturalHeight || img.height;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    finish(new Error('canvas不可用'));
                    return;
                }

                const isSwap = deg === 90 || deg === 270;
                canvas.width = isSwap ? h : w;
                canvas.height = isSwap ? w : h;

                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((deg * Math.PI) / 180);
                ctx.drawImage(img, -w / 2, -h / 2);

                if (typeof canvas.toBlob === 'function') {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            finish(new Error('保存失败'));
                            return;
                        }
                        const r = new FileReader();
                        r.onload = () => finish(null, r.result);
                        r.onerror = () => finish(r.error || new Error('读取失败'));
                        r.readAsDataURL(blob);
                    }, 'image/jpeg', Math.max(0.1, Math.min(1, Number(quality) || 0.92)));
                    return;
                }

                finish(null, canvas.toDataURL('image/jpeg', Math.max(0.1, Math.min(1, Number(quality) || 0.92))));
            } catch (err) {
                finish(err);
            }
        };
        img.onerror = () => finish(new Error('图片解码失败'));
        img.src = base64;
    });
}

function chooseCardImage({ capture = false, targetIndex = -1, mode = 'select', onSelected = null } = {}) {
    const input = document.getElementById('cardImageInput');
    if (!input) return;
    const draft = getMatchingImageDraft(targetIndex);
    input.value = '';
    if (capture) input.setAttribute('capture', 'environment');
    else input.removeAttribute('capture');
    window.__rsdbPendingImageSelection = { targetIndex, mode, onSelected, draftId: draft?.id || '' };
    input.click();
}

function renderImageDraftPreview() {
    const draft = window.__rsdbImageDraft;
    const previewImg = document.getElementById('previewImg');
    const previewContainer = document.getElementById('cardImagePreview');
    const noImageArea = document.getElementById('noImageUploadArea');
    if (!draft || !previewImg || !previewContainer || !noImageArea) return;
    if (draft.value && draft.value.startsWith('data:image/')) {
        previewImg.src = draft.value;
        previewContainer.style.display = 'block';
        noImageArea.style.display = 'none';
    } else {
        previewImg.src = '';
        previewImg.removeAttribute('src');
        previewContainer.style.display = 'none';
        noImageArea.style.display = 'block';
    }
}

function beginImageDraft(targetIndex, originalValue = '') {
    const value = typeof originalValue === 'string' ? originalValue : '';
    window.__rsdbImageDraft = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        targetIndex: Number.isInteger(targetIndex) ? targetIndex : -1,
        originalValue: value,
        value,
        dirty: false
    };
    window.tempNewCardImage = value;
    renderImageDraftPreview();
}

function setImageDraftValue(value) {
    const draft = window.__rsdbImageDraft || {
        targetIndex: Number.isInteger(currentEditIndex) ? currentEditIndex : -1,
        originalValue: ''
    };
    draft.value = typeof value === 'string' ? value : '';
    draft.dirty = draft.value !== String(draft.originalValue || '');
    window.__rsdbImageDraft = draft;
    window.tempNewCardImage = draft.value;
    renderImageDraftPreview();
	if (typeof recordDataEditState === 'function') recordDataEditState();
}

function discardImageDraft() {
    delete window.__rsdbImageDraft;
    delete window.tempNewCardImage;
}

function getMatchingImageDraft(targetIndex) {
    const draft = window.__rsdbImageDraft;
    return draft && Number(draft.targetIndex) === Number(targetIndex) ? draft : null;
}

function openImageDeleteConfirmation(index) {
    const targetIndex = Number.isInteger(index) ? index : -1;
    const draft = getMatchingImageDraft(targetIndex);
    const dialog = document.getElementById('deleteImageConfirmDialog');
    const message = document.getElementById('deleteImageConfirmMessage');
    const confirmBtn = document.getElementById('confirmDeleteImageBtn');

    window.tempDeleteImageIndex = targetIndex;
    if (draft) window.__rsdbPendingImageDeleteDraftId = draft.id;
    else delete window.__rsdbPendingImageDeleteDraftId;

    if (dialog) dialog.headline = draft ? '删除编辑中的图片？' : '确认删除';
    if (message) {
        message.textContent = draft
            ? '图片只会在当前编辑中标记删除，点击“保存”后才会真正删除。'
            : '确定要删除这张卡片图片吗？删除后不可恢复。';
    }
    if (confirmBtn) confirmBtn.textContent = draft ? '标记删除' : '删除';
    if (dialog) dialog.open = true;
}

async function commitSelectedImage(base64, targetIndex = -1, mode = 'select', draftId = '') {
    if (!base64) return;
    const draft = getMatchingImageDraft(targetIndex);
    if (draftId && (!draft || draft.id !== draftId)) {
        showSnackbar('编辑已关闭，未保存所选图片', 'info');
        return;
    }
    if (draft) {
        setImageDraftValue(base64);
        showSnackbar('图片已加入编辑，保存后生效', 'info');
        return;
    }
    if (Number.isInteger(targetIndex) && targetIndex >= 0 && tableData[targetIndex]) {
        beginOperation('update_image', '更新图片', { index: targetIndex, mode });
        tableData[targetIndex].cardImage = base64;
        await saveDataToIndexedDB();
        updateTable();
        commitOperation();
    } else {
        window.tempNewCardImage = base64;
    }
    showSnackbar('图片处理完成', 'success');
}

// ==================== 图片上传处理函数（完整版，无 OCR） ====================
async function handleImageSelect(e) {
    let file;
    if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        file = e.dataTransfer.files[0];
    } else {
        file = e.target.files[0];
    }

    if (!file) return null;

    if (!file.type.startsWith('image/')) {
        showSnackbar('仅支持图片格式', 'error');
        return null;
    }

    let base64;
    const thresholdMB = Math.max(0.5, Math.min(50, Number(appSettings.largeImageThresholdMB) || 5));
    const thresholdBytes = thresholdMB * 1024 * 1024;

    // ≤阈值：原图上传
    if (file.size <= thresholdBytes) {
        showSnackbar(`图片小于${thresholdMB}MB，原图上传中...`, 'info');
        try {
            base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        } catch (err) {
            console.error('读取失败:', err);
            showSnackbar('图片读取失败', 'error');
            return null;
        }
    } else {
        const policy = appSettings.imageCompressPolicy || 'ask';
        if (policy === 'compress') {
            showSnackbar('正在压缩大图...', 'info');
            try {
                const useW = appSettings.imageCompressUseMaxWidth !== false;
                const useH = appSettings.imageCompressUseMaxHeight !== false;
                if (!useW && !useH) {
                    base64 = await fileToBase64(file);
                } else {
                base64 = await compressImage(
                    file,
                    useW ? (Number(appSettings.imageCompressMaxWidth) || 1280) : 100000,
                    useH ? (Number(appSettings.imageCompressMaxHeight) || 1280) : 100000,
                    Number(appSettings.imageCompressQuality) || 0.8
                );
                }
            } catch {
                showSnackbar('压缩失败', 'error');
                return null;
            }
        } else if (policy === 'force') {
            showSnackbar('正在处理大图（较慢）...', 'warning');
            try {
                base64 = await fileToBase64(file);
            } catch {
                showSnackbar('上传失败', 'error');
                return null;
            }
        } else {
        // >阈值：弹出选择
        const dialog = document.getElementById('largeImageWarnDialog');
        if (!dialog) {
            showSnackbar('系统错误：找不到过大图片提示', 'error');
            return null;
        }

        const thresholdEl = dialog.querySelector('#largeImageThresholdText');
        if (thresholdEl) thresholdEl.textContent = `${thresholdMB}MB`;
        dialog.open = true;

        base64 = await new Promise(resolve => {
            let handled = false;
            const alwaysCompress = dialog.querySelector('#largeImageAlwaysCompress');
            const alwaysForce = dialog.querySelector('#largeImageAlwaysForce');
            if (alwaysCompress && !alwaysCompress.dataset.bound) {
                alwaysCompress.dataset.bound = '1';
                alwaysCompress.addEventListener('change', () => {
                    if (alwaysCompress.checked && alwaysForce) alwaysForce.checked = false;
                });
            }
            if (alwaysForce && !alwaysForce.dataset.bound) {
                alwaysForce.dataset.bound = '1';
                alwaysForce.addEventListener('change', () => {
                    if (alwaysForce.checked && alwaysCompress) alwaysCompress.checked = false;
                });
            }

            const compressBtn = dialog.querySelector('#largeImageCompressBtn');
            if (compressBtn) {
                compressBtn.onclick = async () => {
                    if (handled) return; handled = true;
                    dialog.open = false;
                    showSnackbar('正在压缩大图...', 'info');
                    try {
                        const useW = appSettings.imageCompressUseMaxWidth !== false;
                        const useH = appSettings.imageCompressUseMaxHeight !== false;
                        const compressed = (!useW && !useH)
                            ? await fileToBase64(file)
                            : await compressImage(
                                file,
                                useW ? (Number(appSettings.imageCompressMaxWidth) || 1280) : 100000,
                                useH ? (Number(appSettings.imageCompressMaxHeight) || 1280) : 100000,
                                Number(appSettings.imageCompressQuality) || 0.8
                            );
                        if (alwaysCompress?.checked) saveAppSettings({ imageCompressPolicy: 'compress' });
                        resolve(compressed);
                    } catch {
                        showSnackbar('压缩失败', 'error');
                        resolve(null);
                    }
                };
            }

            const forceBtn = dialog.querySelector('#largeImageForceBtn');
            if (forceBtn) {
                forceBtn.onclick = async () => {
                    if (handled) return; handled = true;
                    dialog.open = false;
                    showSnackbar('正在处理大图（较慢）...', 'warning');
                    try {
                        const raw = await fileToBase64(file);
                        if (alwaysForce?.checked) saveAppSettings({ imageCompressPolicy: 'force' });
                        resolve(raw);
                    } catch {
                        showSnackbar('上传失败', 'error');
                        resolve(null);
                    }
                };
            }

            const cancelBtn = dialog.querySelector('#largeImageCancelBtn');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    if (handled) return; handled = true;
                    dialog.open = false;
                    showSnackbar('已取消', 'info');
                    resolve(null);
                };
            }

            dialog.addEventListener('close', () => {
                if (handled) return;
                handled = true;
                dialog.open = false;
                showSnackbar('已取消', 'info');
                resolve(null);
            }, { once: true });
        });
        }
    }

    if (!base64) return null;

    // 更新预览（仅用于用户看到）
    const previewImg = document.getElementById('previewImg');
    const previewContainer = document.getElementById('cardImagePreview');
    const noImageArea = document.getElementById('noImageUploadArea');

    if (previewImg) {
        previewImg.src = base64;
        console.log('[上传] 预览区已设置 src，长度：' + base64.length);
    }
    if (previewContainer && noImageArea) {
        previewContainer.style.display = 'block';
        noImageArea.style.display = 'none';
    }

    const draft = window.__rsdbImageDraft;
    if (draft && Number(draft.targetIndex) === Number(currentEditIndex)) {
        setImageDraftValue(base64);
    }

    return base64;
}

function bindDesktopImagePreviewInteractions({
    container,
    isEnabled,
    getState,
    setState,
    updateImmediately,
    updateWithTransition,
    minScale = 0.5,
    maxScale = 4
}) {
    if (!container) return;
    let activePointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let originX = 0;
    let originY = 0;

    container.addEventListener('dragstart', event => event.preventDefault());
    container.addEventListener('pointerdown', event => {
        if (!isEnabled() || event.pointerType === 'touch' || event.button !== 0) return;
        const state = getState();
        activePointerId = event.pointerId;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        originX = state.translateX;
        originY = state.translateY;
        container.setPointerCapture?.(event.pointerId);
        container.style.cursor = 'grabbing';
        event.preventDefault();
    });
    container.addEventListener('pointermove', event => {
        if (event.pointerId !== activePointerId) return;
        setState({
            translateX: originX + event.clientX - dragStartX,
            translateY: originY + event.clientY - dragStartY
        });
        updateImmediately();
        event.preventDefault();
    });
    const finishDrag = event => {
        if (activePointerId === null || (event?.pointerId != null && event.pointerId !== activePointerId)) return;
        try { container.releasePointerCapture?.(activePointerId); } catch (error) {}
        activePointerId = null;
        container.style.cursor = isEnabled() ? 'grab' : 'default';
        updateWithTransition();
    };
    container.addEventListener('pointerup', finishDrag);
    container.addEventListener('pointercancel', finishDrag);
    container.addEventListener('wheel', event => {
        if (!isEnabled()) return;
        event.preventDefault();
        event.stopPropagation();
        const state = getState();
        const factor = Math.exp(-event.deltaY * 0.0015);
        const nextScale = Math.max(minScale, Math.min(maxScale, state.currentScale * factor));
        if (Math.abs(nextScale - state.currentScale) < 0.0001) return;
        const rect = container.getBoundingClientRect();
        const focalX = event.clientX - rect.left - rect.width / 2;
        const focalY = event.clientY - rect.top - rect.height / 2;
        const ratio = nextScale / state.currentScale;
        setState({
            currentScale: nextScale,
            translateX: focalX - (focalX - state.translateX) * ratio,
            translateY: focalY - (focalY - state.translateY) * ratio
        });
        updateWithTransition();
    }, { passive: false });
    container.style.cursor = isEnabled() ? 'grab' : 'default';
}

const IMAGE_PREVIEW_BACKGROUND_COLORS = {
    black: '#111111',
    gray: '#757575',
    white: '#FFFFFF'
};

function getImagePreviewPreferenceMenuMarkup() {
    return `
        <mdui-menu-item disabled class="image-preview-menu-heading">预览背景</mdui-menu-item>
        <mdui-menu-item data-image-preview-background="black">
            <mdui-icon slot="start" name="circle" style="color:#111111;filter:drop-shadow(0 0 1px #ffffff);"></mdui-icon>
            黑色背景
            <mdui-icon slot="end" name="check" class="image-preview-menu-check"></mdui-icon>
        </mdui-menu-item>
        <mdui-menu-item data-image-preview-background="gray">
            <mdui-icon slot="start" name="circle" style="color:#757575;"></mdui-icon>
            灰色背景
            <mdui-icon slot="end" name="check" class="image-preview-menu-check"></mdui-icon>
        </mdui-menu-item>
        <mdui-menu-item data-image-preview-background="white">
            <mdui-icon slot="start" name="circle" style="color:#ffffff;filter:drop-shadow(0 0 1px #555555);"></mdui-icon>
            白色背景
            <mdui-icon slot="end" name="check" class="image-preview-menu-check"></mdui-icon>
        </mdui-menu-item>
        <mdui-divider></mdui-divider>
        <mdui-menu-item disabled class="image-preview-menu-heading">查看方式</mdui-menu-item>
        <mdui-menu-item data-image-preview-view-mode="normal">
            <mdui-icon slot="start" name="image"></mdui-icon>
            普通查看
            <mdui-icon slot="end" name="check" class="image-preview-menu-check"></mdui-icon>
        </mdui-menu-item>
        <mdui-menu-item data-image-preview-view-mode="pixel">
            <mdui-icon slot="start" name="grid_on"></mdui-icon>
            像素查看
            <mdui-icon slot="end" name="check" class="image-preview-menu-check"></mdui-icon>
        </mdui-menu-item>
        <mdui-divider></mdui-divider>
    `;
}

function persistImagePreviewPreferences(partial) {
    appSettings = { ...appSettings, ...(partial || {}) };
    try { localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings)); } catch (error) {}
}

function applyImagePreviewPreferences(overlay, imgContainer, image) {
    if (!overlay || !imgContainer) return;
    const background = ['black', 'gray', 'white'].includes(appSettings.imagePreviewBackground)
        ? appSettings.imagePreviewBackground : 'black';
    const viewMode = appSettings.imagePreviewViewMode === 'pixel' ? 'pixel' : 'normal';
    imgContainer.style.backgroundColor = IMAGE_PREVIEW_BACKGROUND_COLORS[background];
    overlay.dataset.imagePreviewBackground = background;
    overlay.dataset.imagePreviewViewMode = viewMode;
    image?.classList.toggle('image-preview-pixel-mode', viewMode === 'pixel');

    overlay.querySelectorAll('[data-image-preview-background]').forEach(item => {
        const selected = item.dataset.imagePreviewBackground === background;
        item.classList.toggle('image-preview-menu-selected', selected);
        item.setAttribute('aria-checked', String(selected));
    });
    overlay.querySelectorAll('[data-image-preview-view-mode]').forEach(item => {
        const selected = item.dataset.imagePreviewViewMode === viewMode;
        item.classList.toggle('image-preview-menu-selected', selected);
        item.setAttribute('aria-checked', String(selected));
    });
    overlay.querySelectorAll('.image-preview-placeholder').forEach(placeholder => {
        const lightBackground = background === 'white';
        placeholder.style.color = lightBackground ? '#424242' : '#E0E0E0';
        placeholder.style.backgroundColor = lightBackground ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)';
    });
}

function bindImagePreviewPreferenceMenu(overlay, imgContainer, getImage) {
    if (!overlay || !imgContainer) return () => {};
    const apply = () => applyImagePreviewPreferences(overlay, imgContainer, getImage?.());
    overlay.querySelectorAll('[data-image-preview-background]').forEach(item => {
        item.addEventListener('click', () => {
            const value = item.dataset.imagePreviewBackground;
            if (!IMAGE_PREVIEW_BACKGROUND_COLORS[value]) return;
            persistImagePreviewPreferences({ imagePreviewBackground: value });
            apply();
            const dropdown = item.closest('mdui-dropdown');
            if (dropdown) dropdown.open = false;
        });
    });
    overlay.querySelectorAll('[data-image-preview-view-mode]').forEach(item => {
        item.addEventListener('click', () => {
            const value = item.dataset.imagePreviewViewMode === 'pixel' ? 'pixel' : 'normal';
            persistImagePreviewPreferences({ imagePreviewViewMode: value });
            apply();
            const dropdown = item.closest('mdui-dropdown');
            if (dropdown) dropdown.open = false;
        });
    });
    apply();
    return apply;
}

const IMAGE_PREVIEW_INFO_FIELDS = [
    'productId', 'steelType', 'cardId', 'furnaceId', 'actualDiameter',
    'diameter', 'length', 'weight', 'status', 'position', 'hardness', 'remarks'
];

function getImagePreviewInfoItem(dataIndex) {
    const dataDialogOpen = dom?.dataSheet && (dom.dataSheet.open === true || dom.dataSheet.hasAttribute('open'));
    if (dataDialogOpen) {
        const item = {};
        IMAGE_PREVIEW_INFO_FIELDS.forEach(fieldId => {
            item[fieldId] = formElements?.[fieldId]?.value ?? tableData?.[dataIndex]?.[fieldId] ?? '';
        });
        return item;
    }
    return Number.isInteger(dataIndex) && dataIndex >= 0 ? (tableData[dataIndex] || {}) : {};
}

function getImagePreviewInfoValue(item, fieldId) {
    const displayValue = item?.__cellDisplayValues?.[fieldId];
    const rawValue = displayValue !== undefined ? displayValue : item?.[fieldId];
    const value = String(rawValue ?? '').trim();
    return value || '未填写';
}

function createImagePreviewInfoPanel({ overlay, topBar, getItem, getMeta }) {
    if (!overlay || !topBar) return { refresh() {}, destroy() {} };
    const titleTrigger = topBar.querySelector('[data-image-preview-title]') || topBar.firstElementChild;
    if (!titleTrigger) return { refresh() {}, destroy() {} };

    titleTrigger.classList.add('image-preview-title-trigger');
    titleTrigger.setAttribute('role', 'button');
    titleTrigger.setAttribute('tabindex', '0');
    titleTrigger.setAttribute('title', '点击查看当前项目资料');
    titleTrigger.setAttribute('aria-label', '查看当前项目资料');

    const panel = document.createElement('section');
    panel.className = 'image-preview-info-window';
    panel.hidden = true;
    panel.setAttribute('aria-label', '当前项目资料');

    const handle = document.createElement('header');
    handle.className = 'image-preview-info-handle';
    const heading = document.createElement('strong');
    heading.textContent = '当前项目资料';
    const meta = document.createElement('span');
    meta.className = 'image-preview-info-meta';
    const spacer = document.createElement('span');
    spacer.className = 'image-preview-info-spacer';
    const settingsButton = document.createElement('mdui-button-icon');
    settingsButton.setAttribute('icon', 'tune');
    settingsButton.setAttribute('aria-label', '调整悬浮窗');
    settingsButton.setAttribute('title', '调整悬浮窗');
    const minimizeButton = document.createElement('mdui-button-icon');
    minimizeButton.setAttribute('icon', 'remove');
    minimizeButton.setAttribute('aria-label', '缩小悬浮窗');
    minimizeButton.setAttribute('title', '缩小悬浮窗');
    handle.append(heading, meta, spacer, settingsButton, minimizeButton);

    const body = document.createElement('div');
    body.className = 'image-preview-info-body';
    const dataGrid = document.createElement('div');
    dataGrid.className = 'image-preview-info-grid';
    const fontControls = document.createElement('div');
    fontControls.className = 'image-preview-info-font-controls';
    fontControls.hidden = true;

    const createRangeControl = (labelText, min, max, value, onChange, unit = 'px') => {
        const row = document.createElement('label');
        row.className = 'image-preview-info-font-row';
        const label = document.createElement('span');
        label.textContent = labelText;
        const valueLabel = document.createElement('span');
        valueLabel.className = 'image-preview-info-font-value';
        const slider = document.createElement('mdui-slider');
        slider.setAttribute('min', String(min));
        slider.setAttribute('max', String(max));
        slider.setAttribute('step', '1');
        slider.setAttribute('value', String(value));
        slider.value = value;
        const controls = document.createElement('div');
        controls.className = 'image-preview-info-font-stepper';
        const decrease = document.createElement('mdui-button-icon');
        decrease.setAttribute('icon', 'remove');
        decrease.setAttribute('aria-label', `${labelText}减小`);
        decrease.setAttribute('title', `${labelText}减小`);
        const increase = document.createElement('mdui-button-icon');
        increase.setAttribute('icon', 'add');
        increase.setAttribute('aria-label', `${labelText}增大`);
        increase.setAttribute('title', `${labelText}增大`);
        let currentValue = Math.max(min, Math.min(max, Math.round(Number(value) || min)));
        const apply = nextValue => {
            const internalValue = slider.shadowRoot?.querySelector('input[type="range"]')?.value;
            const candidate = nextValue ?? (slider.value || internalValue || slider.getAttribute('value'));
            const next = Math.max(min, Math.min(max, Math.round(Number(candidate) || currentValue)));
            currentValue = next;
            slider.value = next;
            slider.setAttribute('value', String(next));
            valueLabel.textContent = `${next}${unit}`;
            decrease.disabled = next <= min;
            increase.disabled = next >= max;
            onChange(next);
        };
        slider.addEventListener('input', () => apply());
        slider.addEventListener('change', () => apply());
        decrease.addEventListener('click', event => {
            event.preventDefault();
            apply(currentValue - 1);
        });
        increase.addEventListener('click', event => {
            event.preventDefault();
            apply(currentValue + 1);
        });
        controls.append(decrease, slider, increase);
        row.append(label, valueLabel, controls);
        apply(currentValue);
        return row;
    };

    const applyTitleFontSize = size => {
        panel.style.setProperty('--image-preview-info-title-size', `${size}px`);
        persistImagePreviewPreferences({ imagePreviewInfoTitleFontSize: size });
    };
    const applyContentFontSize = size => {
        panel.style.setProperty('--image-preview-info-content-size', `${size}px`);
        persistImagePreviewPreferences({ imagePreviewInfoFontSize: size });
    };
    const applyBackgroundOpacity = opacity => {
        panel.style.setProperty('--image-preview-info-opacity', String(opacity / 100));
        persistImagePreviewPreferences({ imagePreviewInfoOpacity: opacity });
    };
    fontControls.append(
        createRangeControl('标题字号', 14, 32, Number(appSettings.imagePreviewInfoTitleFontSize) || 18, applyTitleFontSize),
        createRangeControl('内容字号', 12, 28, Number(appSettings.imagePreviewInfoFontSize) || 14, applyContentFontSize),
        createRangeControl('背景不透明度', 30, 100, Number(appSettings.imagePreviewInfoOpacity) || 94, applyBackgroundOpacity, '%')
    );
    body.append(dataGrid, fontControls);
    panel.append(handle, body);
    overlay.appendChild(panel);
    panel.style.width = `${Math.max(260, Math.min(900, Number(appSettings.imagePreviewInfoWidth) || 360))}px`;
    panel.style.height = `${Math.max(220, Math.min(900, Number(appSettings.imagePreviewInfoHeight) || 400))}px`;

    ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'].forEach(direction => {
        const resizeHandle = document.createElement('span');
        resizeHandle.className = `image-preview-info-resize image-preview-info-resize-${direction}`;
        resizeHandle.dataset.resizeDirection = direction;
        resizeHandle.setAttribute('aria-hidden', 'true');
        panel.appendChild(resizeHandle);
    });

    const refresh = () => {
        const item = getItem?.() || {};
        dataGrid.innerHTML = '';
        IMAGE_PREVIEW_INFO_FIELDS.forEach(fieldId => {
            const row = document.createElement('div');
            row.className = 'image-preview-info-row';
            if (fieldId === 'remarks') row.classList.add('is-wide');
            const label = document.createElement('span');
            label.className = 'image-preview-info-label';
            label.textContent = fieldLabels?.[fieldId] || fieldId;
            const value = document.createElement('span');
            value.className = 'image-preview-info-value';
            value.textContent = getImagePreviewInfoValue(item, fieldId);
            value.title = value.textContent;
            row.append(label, value);
            dataGrid.appendChild(row);
        });
        meta.textContent = String(getMeta?.() || '');
    };

    const toggle = force => {
        const shouldOpen = typeof force === 'boolean' ? force : panel.hidden;
        panel.hidden = !shouldOpen;
        titleTrigger.setAttribute('aria-expanded', String(shouldOpen));
        if (shouldOpen) refresh();
    };

    settingsButton.addEventListener('click', event => {
        event.stopPropagation();
        fontControls.hidden = !fontControls.hidden;
        settingsButton.setAttribute('icon', fontControls.hidden ? 'tune' : 'tune');
        settingsButton.setAttribute('aria-pressed', String(!fontControls.hidden));
    });

    let minimized = false;
    minimizeButton.addEventListener('click', event => {
        event.stopPropagation();
        minimized = !minimized;
        panel.classList.toggle('is-minimized', minimized);
        minimizeButton.setAttribute('icon', minimized ? 'unfold_more' : 'remove');
        minimizeButton.setAttribute('aria-label', minimized ? '展开悬浮窗' : '缩小悬浮窗');
        minimizeButton.setAttribute('title', minimized ? '展开悬浮窗' : '缩小悬浮窗');
    });

    const onTopBarClick = event => {
        if (event.target.closest?.('[data-image-preview-close], mdui-button-icon, button, input, textarea, mdui-slider')) return;
        toggle();
    };
    const onTopBarKeyDown = event => {
        if (event.target !== titleTrigger || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        toggle();
    };
    topBar.addEventListener('click', onTopBarClick);
    topBar.addEventListener('keydown', onTopBarKeyDown);

    let drag = null;
    let resizeState = null;
    const placePanel = (clientX, clientY) => {
        const overlayRect = overlay.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const maxLeft = Math.max(8, overlayRect.width - panelRect.width - 8);
        const maxTop = Math.max(8, overlayRect.height - panelRect.height - 8);
        const left = Math.max(8, Math.min(maxLeft, clientX - overlayRect.left - drag.offsetX));
        const top = Math.max(8, Math.min(maxTop, clientY - overlayRect.top - drag.offsetY));
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.style.right = 'auto';
    };
    panel.addEventListener('pointerdown', event => {
        const resizeHandle = event.target.closest?.('[data-resize-direction]');
        if (!resizeHandle || minimized) return;
        const overlayRect = overlay.getBoundingClientRect();
        const rect = panel.getBoundingClientRect();
        const left = rect.left - overlayRect.left;
        const top = rect.top - overlayRect.top;
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.style.right = 'auto';
        resizeState = {
            pointerId: event.pointerId,
            direction: resizeHandle.dataset.resizeDirection || 'se',
            startX: event.clientX,
            startY: event.clientY,
            left,
            top,
            width: rect.width,
            height: rect.height
        };
        panel.classList.add('is-resizing');
        event.preventDefault();
        event.stopPropagation();
    }, { passive: false });
    handle.addEventListener('pointerdown', event => {
        if (event.target.closest?.('mdui-button-icon, button')) return;
        const rect = panel.getBoundingClientRect();
        drag = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
        panel.classList.add('is-dragging');
        event.preventDefault();
    }, { passive: false });
    const onDragMove = event => {
        if (resizeState && resizeState.pointerId === event.pointerId) {
            const overlayRect = overlay.getBoundingClientRect();
            const dx = event.clientX - resizeState.startX;
            const dy = event.clientY - resizeState.startY;
            const direction = resizeState.direction;
            let left = resizeState.left;
            let top = resizeState.top;
            let width = resizeState.width;
            let height = resizeState.height;
            if (direction.includes('e')) width += dx;
            if (direction.includes('s')) height += dy;
            if (direction.includes('w')) {
                width -= dx;
                left += dx;
            }
            if (direction.includes('n')) {
                height -= dy;
                top += dy;
            }
            const minWidth = Math.min(260, Math.max(180, overlayRect.width - 16));
            const minHeight = Math.min(220, Math.max(160, overlayRect.height - 16));
            const maxWidth = Math.max(minWidth, overlayRect.width - 16);
            const maxHeight = Math.max(minHeight, overlayRect.height - 16);
            const nextWidth = Math.max(minWidth, Math.min(maxWidth, width));
            const nextHeight = Math.max(minHeight, Math.min(maxHeight, height));
            if (direction.includes('w')) left += width - nextWidth;
            if (direction.includes('n')) top += height - nextHeight;
            left = Math.max(8, Math.min(overlayRect.width - nextWidth - 8, left));
            top = Math.max(8, Math.min(overlayRect.height - nextHeight - 8, top));
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
            panel.style.width = `${nextWidth}px`;
            panel.style.height = `${nextHeight}px`;
            event.preventDefault();
            return;
        }
        if (!drag || drag.pointerId !== event.pointerId) return;
        placePanel(event.clientX, event.clientY);
        event.preventDefault();
    };
    const stopDrag = event => {
        if (resizeState && (event?.pointerId == null || resizeState.pointerId === event.pointerId)) {
            resizeState = null;
            panel.classList.remove('is-resizing');
            const rect = panel.getBoundingClientRect();
            persistImagePreviewPreferences({
                imagePreviewInfoWidth: Math.round(rect.width),
                imagePreviewInfoHeight: Math.round(rect.height)
            });
        }
        if (!drag || (event?.pointerId != null && drag.pointerId !== event.pointerId)) return;
        drag = null;
        panel.classList.remove('is-dragging');
    };
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);

    const keepPanelInBounds = () => {
        if (panel.hidden || panel.style.right !== 'auto') return;
        const rect = panel.getBoundingClientRect();
        drag = { offsetX: 0, offsetY: 0 };
        placePanel(rect.left, rect.top);
        drag = null;
    };
    const onOverlayInput = () => { if (!panel.hidden) refresh(); };
    window.addEventListener('resize', keepPanelInBounds);
    overlay.addEventListener('input', onOverlayInput);

    return {
        refresh,
        toggle,
        destroy() {
            window.removeEventListener('resize', keepPanelInBounds);
            overlay.removeEventListener('input', onOverlayInput);
            topBar.removeEventListener('click', onTopBarClick);
            topBar.removeEventListener('keydown', onTopBarKeyDown);
            window.removeEventListener('pointermove', onDragMove);
            window.removeEventListener('pointerup', stopDrag);
            window.removeEventListener('pointercancel', stopDrag);
        }
    };
}

function closeImagePreviewEdit({ restoreKeyboard = true } = {}) {
    const state = imagePreviewEditState;
    if (!state) return;
    state.cleanup?.();
    const source = state.sourceInput;
    imagePreviewEditState = null;
    if (source && document.contains(source)) {
        currentInput = source;
        if (restoreKeyboard && state.keyboardWasVisible && state.sourceWasVirtual) {
            updateKeyboardForInput(source, state.fieldId);
            showVirtualKeyboard();
        } else if (!state.keyboardWasVisible) {
            updateVirtualCursor();
        }
    } else if (!state.keyboardWasVisible) {
        currentInput = null;
        updateVirtualCursor();
    }
}

function switchImagePreviewField(delta = 1) {
    const state = imagePreviewEditState;
    if (!state?.active || !state.previewInput) return false;
    const currentIndex = inputFieldOrder.indexOf(state.fieldId);
    if (currentIndex < 0) return false;
    const nextIndex = (currentIndex + delta + inputFieldOrder.length) % inputFieldOrder.length;
    const nextFieldId = inputFieldOrder[nextIndex];
    const source = formElements[nextFieldId];
    if (!source) return false;
    state.sourceInput?.removeEventListener('input', state.onSourceInput);
    state.fieldId = nextFieldId;
    state.sourceInput = source;
    state.sourceInput.addEventListener('input', state.onSourceInput);
    state.sourceWasVirtual = source.hasAttribute('readonly') || getConfiguredKeyboardMode(nextFieldId) === 'virtual';
    state.previewInput.value = source.value || '';
    state.previewInput.rows = nextFieldId === 'remarks' ? 3 : 1;
    state.previewInput.style.height = nextFieldId === 'remarks' ? '96px' : '56px';
    state.previewInput.style.resize = nextFieldId === 'remarks' ? 'vertical' : 'none';
    state.previewInput.setAttribute('placeholder', '');
    state.previewInput.setAttribute('aria-label', fieldLabels[nextFieldId] || nextFieldId);
    if (state.editorLabel) state.editorLabel.textContent = fieldLabels[nextFieldId] || nextFieldId;
    const useVirtual = getConfiguredKeyboardMode(nextFieldId) === 'virtual';
    state.previewInput.toggleAttribute('readonly', useVirtual);
    state.previewInput.classList.toggle('readonly-input', useVirtual);
    state.applyStyle?.(nextFieldId);
    currentInput = state.previewInput;
    updateKeyboardForInput(state.previewInput, nextFieldId);
    if (useVirtual) {
        state.previewInput.focus({ preventScroll: true });
        resetCursorToEnd(state.previewInput);
        if (state.keyboardWasVisible || dom.virtualKeyboard?.style.display !== 'none') {
            showVirtualKeyboard();
            state.syncKeyboardLayer?.(true);
        }
    } else {
        state.previewInput.focus({ preventScroll: true });
        setVirtualKeyboardVisible(false);
    }
    state.keyboardWasVisible = useVirtual && dom.virtualKeyboard?.style.display !== 'none';
    state.updateMeta?.();
    scheduleShortcutKeysRefresh();
    updateVirtualCursor();
    return true;
}

function moveToAdjacentDataInput(delta = 1) {
    if (!currentInput || !inputFieldOrder.includes(currentInput.id)) return false;
    const currentIndex = inputFieldOrder.indexOf(currentInput.id);
    const nextIndex = (currentIndex + delta + inputFieldOrder.length) % inputFieldOrder.length;
    const nextInput = formElements[inputFieldOrder[nextIndex]];
    if (!nextInput) return false;
    activateConfiguredInput(nextInput);
    return true;
}

function openImagePreviewEditor(overlay, dataIndex) {
    if (!overlay || !dom?.dataSheet || !(dom.dataSheet.open === true || dom.dataSheet.hasAttribute('open'))) return null;
    const rememberedInput = inputFields.find(input => input?.classList?.contains('rsdb-active-input'))
        || (document.activeElement && inputFields.includes(document.activeElement) ? document.activeElement : null);
    const sourceInput = currentInput && formElements[inputFieldOrder.includes(currentInput.id) ? currentInput.id : '']
        ? currentInput
        : (rememberedInput || formElements.steelType);
    const fieldId = inputFieldOrder.includes(sourceInput?.id) ? sourceInput.id : 'steelType';
    const editorBar = document.createElement('div');
    editorBar.className = 'image-preview-editor-bar';

    const editorField = document.createElement('label');
    editorField.className = 'image-preview-m3-field';
    editorField.setAttribute('for', 'imagePreviewEditorInput');
    const editorLabel = document.createElement('span');
    editorLabel.className = 'image-preview-m3-label';
    editorLabel.textContent = fieldLabels[fieldId] || fieldId;
    const editorInput = document.createElement('textarea');
    editorInput.id = 'imagePreviewEditorInput';
    editorInput.rows = fieldId === 'remarks' ? 3 : 1;
    editorInput.setAttribute('placeholder', '');
    editorInput.setAttribute('aria-label', fieldLabels[fieldId] || fieldId);
    editorField.append(editorLabel, editorInput);

    const keyboardToggle = document.createElement('mdui-button-icon');
    keyboardToggle.id = 'imagePreviewKeyboardToggleBtn';
    keyboardToggle.setAttribute('title', '切换系统键盘/虚拟键盘');
    keyboardToggle.style.color = '#fff';
    const propertyBtn = document.createElement('mdui-button-icon');
    propertyBtn.id = 'imagePreviewPropertyBtn';
    propertyBtn.setAttribute('icon', 'tune');
    propertyBtn.setAttribute('title', '编辑属性');
    propertyBtn.style.color = '#fff';
    editorBar.append(editorField, keyboardToggle, propertyBtn);
    overlay.insertBefore(editorBar, overlay.querySelector('.image-preview-overlay > div:nth-of-type(2)') || overlay.children[1]);

    const keyboardWasVisible = !!dom.virtualKeyboard && dom.virtualKeyboard.style.display !== 'none';
    const sourceWasVirtual = sourceInput?.hasAttribute('readonly') || getConfiguredKeyboardMode(fieldId) === 'virtual';
    const syncPreviewKeyboardLayer = visible => {
        const keyboard = dom.virtualKeyboard;
        if (!keyboard) return;
        overlay.style.paddingBottom = '';
        overlay.style.boxSizing = '';
        const cursor = document.getElementById('virtualCursor');
        const handle = document.getElementById('virtualCursorHandle');
        if (!visible) {
            keyboard.style.removeProperty('z-index');
            cursor?.style.removeProperty('z-index');
            handle?.style.removeProperty('z-index');
            return;
        }
        if (keyboard.parentElement !== document.body) document.body.appendChild(keyboard);
		keyboard.classList.remove('desktop-shortcuts-only');
        keyboard.style.setProperty('z-index', '2147483610', 'important');
        cursor?.style.setProperty('z-index', '2147483630', 'important');
        handle?.style.setProperty('z-index', '2147483631', 'important');
    };
    const state = {
        active: true,
        overlay,
        previewInput: editorInput,
        editorField,
        editorLabel,
        sourceInput,
        fieldId,
        keyboardWasVisible,
        sourceWasVirtual,
        syncing: false,
        syncKeyboardLayer: syncPreviewKeyboardLayer,
        applyStyle(nextFieldId) {
            if (!this.previewInput) return;
            const raw = dataEditStyleDraft?.styles?.[nextFieldId]
                || (Number.isInteger(dataIndex) && dataIndex >= 0 ? getCellFormat(dataIndex, nextFieldId) : {});
            const style = getEffectiveCellStyleFromRaw(raw || {});
            this.previewInput.style.fontFamily = style.fontName || '';
            this.previewInput.style.fontSize = `${Number(style.fontSize) || Number(appSettings.tableCellFontSize) || 16}px`;
            this.previewInput.style.color = normalizeStyleColor(style.color, '#FFFFFF');
            this.previewInput.style.fontWeight = style.bold ? 'bold' : 'normal';
            this.previewInput.style.fontStyle = style.italic ? 'italic' : 'normal';
            this.previewInput.style.textDecoration = style.underline ? 'underline' : 'none';
            this.previewInput.style.textAlign = ['left', 'center', 'right'].includes(style.horizontal) ? style.horizontal : 'left';
            this.previewInput.style.backgroundColor = 'transparent';
            if (this.editorField) this.editorField.style.backgroundColor = normalizeStyleColor(style.backgroundColor, 'rgba(255,255,255,.08)');
        },
        updateMeta() {
            const title = overlay.querySelector('[data-image-preview-title]');
            const previewProductId = (
                (Number.isInteger(dataIndex) && dataIndex >= 0 ? tableData[dataIndex]?.productId : '')
                || formElements.productId?.value
                || '图片预览'
            );
            if (title) title.textContent = `${fieldLabels[this.fieldId] || this.fieldId} · ${String(previewProductId)}`;
            const isVirtual = this.previewInput?.hasAttribute('readonly');
            keyboardToggle.setAttribute('icon', isVirtual ? 'edit' : 'keyboard');
            keyboardToggle.setAttribute('title', isVirtual ? '使用系统键盘编辑' : '切换到虚拟键盘');
            keyboardToggle.setAttribute('aria-label', isVirtual ? '使用系统键盘编辑' : '切换到虚拟键盘');
            this.editorField?.toggleAttribute('data-virtual', !!isVirtual);
        },
        cleanup() {
            this.active = false;
            syncPreviewKeyboardLayer(false);
            this.previewInput?.removeEventListener('input', this.onPreviewInput);
            this.previewInput?.removeEventListener('blur', this.onPreviewBlur);
            this.previewInput?.removeEventListener('pointerdown', this.onPreviewPointerDown);
            this.previewInput?.removeEventListener('pointerup', this.onPreviewPointerUp);
            this.previewInput?.removeEventListener('pointercancel', this.onPreviewPointerCancel);
            this.previewInput?.removeEventListener('click', this.onPreviewClick);
            this.sourceInput?.removeEventListener('input', this.onSourceInput);
            keyboardToggle.removeEventListener('click', this.onKeyboardToggle);
            propertyBtn.removeEventListener('click', this.onPropertyClick);
        }
    };
    imagePreviewEditState = state;

    // 预览编辑框必须走统一的输入激活流程：普通 textarea 的 focus 只负责
    // 光标，不会可靠地唤起虚拟键盘；同时预览层会在打开时主动隐藏一次键盘，
    // 因此虚拟模式需要强制重新显示，系统模式则要再次聚焦输入框。
    const activatePreviewInput = ({ preserveSelection = true } = {}) => {
        const input = state.previewInput;
        if (!state.active || !input) return;
        const useVirtual = input.hasAttribute('readonly');
        // 系统键盘模式必须是可编辑控件；disabled 或 readonly 都会阻止 Android 输入法接管。
        input.disabled = false;
        input.removeAttribute('disabled');
        input.readOnly = useVirtual;
        input.toggleAttribute('readonly', useVirtual);
        input.classList.toggle('readonly-input', useVirtual);
        const valueLength = (input.value || '').length;
        const selectionStart = Math.max(0, Math.min(valueLength, Number(input.selectionStart) || valueLength));
        const selectionEnd = Math.max(selectionStart, Math.min(valueLength, Number(input.selectionEnd) || selectionStart));
        currentInput = input;
        input.setAttribute('inputmode', useVirtual ? 'none' : 'text');
        if (useVirtual) updateKeyboardForInput(input, state.fieldId);
        if (useVirtual) {
            state.keyboardWasVisible = true;
            input.focus({ preventScroll: true });
            if (preserveSelection) {
                try { input.setSelectionRange(selectionStart, selectionEnd); } catch (error) {}
            }
            showVirtualKeyboard({ force: true });
            syncPreviewKeyboardLayer(true);
        } else {
            state.keyboardWasVisible = false;
            syncPreviewKeyboardLayer(false);
            setVirtualKeyboardVisible(false);
            input.focus({ preventScroll: true });
            if (preserveSelection) {
                try { input.setSelectionRange(selectionStart, selectionEnd); } catch (error) {}
            }
            // 在触屏浏览器中，第二次 focus 放到下一帧可以避免预览层的
            // pointer/click 处理把系统输入法启动吞掉。
            requestAnimationFrame(() => {
                if (!state.active || state.previewInput !== input) return;
                input.focus({ preventScroll: true });
                if (preserveSelection) {
                    try { input.setSelectionRange(selectionStart, selectionEnd); } catch (error) {}
                }
            });
        }
        state.updateMeta();
        scheduleShortcutKeysRefresh();
        updateVirtualCursor();
    };

    state.onPreviewInput = () => {
        if (state.syncing || !state.sourceInput) return;
        state.syncing = true;
        state.sourceInput.value = state.previewInput.value || '';
        state.sourceInput.dispatchEvent(new Event('input', { bubbles: true }));
        state.syncing = false;
        currentInput = state.previewInput;
        if (!state.previewInput.hasAttribute('readonly')) window.__rsdbDesktopShortcutInput = state.previewInput;
        scheduleShortcutKeysRefresh();
        updateVirtualCursor();
    };
    state.onPreviewBlur = () => {
        requestAnimationFrame(() => {
            if (!state.active || !state.previewInput || !document.contains(state.previewInput)) return;
            const active = document.activeElement;
            const anotherEditor = active?.matches?.('input, textarea, [contenteditable="true"]') && active !== state.previewInput;
            const foregroundDialog = active?.closest?.('mdui-dialog');
            if (anotherEditor || foregroundDialog) return;
            currentInput = state.previewInput;
            state.previewInput.focus({ preventScroll: true });
            updateVirtualCursor();
        });
    };
    state.previewPointer = null;
    state.positionPreviewCaret = (clientX, clientY, { showHandle = true } = {}) => {
        if (!state.active || !state.previewInput) return;
        const inputChanged = currentInput !== state.previewInput;
        currentInput = state.previewInput;
        state.previewInput.focus({ preventScroll: true });
        moveCursorToPoint(state.previewInput, clientX, clientY);
        const selectionStart = state.previewInput.selectionStart;
        const selectionEnd = state.previewInput.selectionEnd;
        if (showHandle && state.previewInput.hasAttribute('readonly')) showCursorHandleTemporarily();
        if (inputChanged) updateKeyboardForInput(state.previewInput, state.fieldId);
        if (state.previewInput.hasAttribute('readonly')) {
            state.keyboardWasVisible = true;
            // 即使键盘节点仍处于收起动画的 display:block 状态，也要重新加上
            // vk-visible，否则只检查 computed display 会漏掉“看得见节点但在屏幕外”的情况。
            showVirtualKeyboard({ force: true });
            syncPreviewKeyboardLayer(true);
        }
        requestAnimationFrame(() => {
            if (!state.active || !state.previewInput) return;
            state.previewInput.focus({ preventScroll: true });
            if (Number.isInteger(selectionStart) && Number.isInteger(selectionEnd)) {
                try { state.previewInput.setSelectionRange(selectionStart, selectionEnd); } catch (error) {}
            }
            updateVirtualCursor();
        });
    };
    state.onPreviewPointerDown = (event) => {
        event.stopPropagation();
        currentInput = state.previewInput;
        if (!state.previewInput.hasAttribute('readonly')) {
            state.previewPointer = null;
            state.previewInput.disabled = false;
            state.previewInput.removeAttribute('disabled');
            state.previewInput.readOnly = false;
            state.previewInput.removeAttribute('readonly');
            state.previewInput.setAttribute('inputmode', 'text');
            window.__rsdbDesktopShortcutInput = state.previewInput;
            return;
        }
        state.previewPointer = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY
        };
        if (event.cancelable) event.preventDefault();
    };
    state.onPreviewPointerUp = (event) => {
        event.stopPropagation();
        if (!state.previewInput.hasAttribute('readonly')) {
            state.previewPointer = null;
            currentInput = state.previewInput;
            state.previewInput.readOnly = false;
            state.previewInput.disabled = false;
            state.previewInput.setAttribute('inputmode', 'text');
            window.__rsdbDesktopShortcutInput = state.previewInput;
            requestAnimationFrame(() => {
                if (!state.active || state.previewInput !== document.activeElement) return;
                scheduleShortcutKeysRefresh();
                updateVirtualCursor();
            });
            return;
        }
        const pointer = state.previewPointer;
        state.previewPointer = null;
        if (!pointer || pointer.pointerId !== event.pointerId) return;
        const moved = Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY);
        if (moved > 12) return;
        if (event.cancelable) event.preventDefault();
        state.positionPreviewCaret(event.clientX, event.clientY);
    };
    state.onPreviewPointerCancel = () => {
        state.previewPointer = null;
    };
    state.onPreviewClick = (event) => {
        event.stopPropagation();
        currentInput = state.previewInput;
        if (!state.previewInput.hasAttribute('readonly')) {
            state.previewInput.readOnly = false;
            state.previewInput.disabled = false;
            state.previewInput.setAttribute('inputmode', 'text');
            window.__rsdbDesktopShortcutInput = state.previewInput;
            if (event.detail > 0 && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
                state.positionPreviewCaret(event.clientX, event.clientY, { showHandle: false });
                return;
            }
            requestAnimationFrame(() => {
                if (!state.active || state.previewInput !== document.activeElement) return;
                scheduleShortcutKeysRefresh();
                updateVirtualCursor();
            });
            return;
        }
        if (event.cancelable) event.preventDefault();
        if (event.detail > 0 && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
            state.positionPreviewCaret(event.clientX, event.clientY);
            return;
        }
        state.previewInput.focus({ preventScroll: true });
        updateKeyboardForInput(state.previewInput, state.fieldId);
        activatePreviewInput();
    };
    state.onSourceInput = () => {
        if (state.syncing || state.sourceInput !== formElements[state.fieldId]) return;
        state.syncing = true;
        state.previewInput.value = state.sourceInput.value || '';
        state.syncing = false;
        updateVirtualCursor();
    };
    state.onKeyboardToggle = (event) => {
        event.stopPropagation();
        const useVirtual = !state.previewInput.hasAttribute('readonly');
        if (useVirtual && event.cancelable) event.preventDefault();
        const valueLength = (state.previewInput.value || '').length;
        const selectionStart = Math.max(0, Math.min(valueLength, Number(state.previewInput.selectionStart) || 0));
        const selectionEnd = Math.max(selectionStart, Math.min(valueLength, Number(state.previewInput.selectionEnd) || selectionStart));
        const modeMap = appSettings.keyboardModeByField && typeof appSettings.keyboardModeByField === 'object'
            ? { ...appSettings.keyboardModeByField } : {};
        modeMap[state.fieldId] = useVirtual ? 'virtual' : 'system';
        saveAppSettings({ keyboardModeByField: modeMap });
        currentInput = state.previewInput;
        state.previewInput.disabled = false;
        state.previewInput.removeAttribute('disabled');
        state.previewInput.readOnly = useVirtual;
        if (useVirtual) state.previewInput.setAttribute('readonly', '');
        else state.previewInput.removeAttribute('readonly');
        state.previewInput.classList.toggle('readonly-input', useVirtual);
        state.previewInput.setAttribute('inputmode', useVirtual ? 'none' : 'text');
        activatePreviewInput({ preserveSelection: true });
    };
    state.onPropertyClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        currentEditIndex = Number.isInteger(dataIndex) ? dataIndex : currentEditIndex;
        openDataCellStyleDialog(state.fieldId);
        if (dom.dataCellStyleDialog) dom.dataCellStyleDialog.style.setProperty('z-index', '2147483620', 'important');
    };
    editorInput.addEventListener('input', state.onPreviewInput);
    editorInput.addEventListener('blur', state.onPreviewBlur);
    editorInput.addEventListener('pointerdown', state.onPreviewPointerDown, { passive: false });
    editorInput.addEventListener('pointerup', state.onPreviewPointerUp, { passive: false });
    editorInput.addEventListener('pointercancel', state.onPreviewPointerCancel, { passive: true });
    editorInput.addEventListener('click', state.onPreviewClick);
    sourceInput?.addEventListener('input', state.onSourceInput);
    keyboardToggle.addEventListener('click', state.onKeyboardToggle);
    propertyBtn.addEventListener('click', state.onPropertyClick);
    overlay.addEventListener('pointerdown', event => {
        if (!state.active || !state.previewInput) return;
        const editor = event.target.closest?.('input, textarea, [contenteditable="true"]');
        if (editor && editor !== state.previewInput) return;
        currentInput = state.previewInput;
        if (event.target !== state.previewInput && event.cancelable) event.preventDefault();
    }, { capture: true });
    editorInput.value = sourceInput?.value || '';
    const useVirtual = sourceWasVirtual;
    editorInput.toggleAttribute('readonly', useVirtual);
    editorInput.classList.toggle('readonly-input', useVirtual);
    editorInput.setAttribute('inputmode', useVirtual ? 'none' : 'text');
    state.applyStyle(fieldId);
    state.updateMeta();
    currentInput = editorInput;
    activatePreviewInput({ preserveSelection: false });
    if (useVirtual) resetCursorToEnd(editorInput);
    updateVirtualCursor();
    scheduleShortcutKeysRefresh();
    return state;
}

function showFullImage(src, productId = '', dataIndex = -1) {
    if ((!Number.isInteger(dataIndex) || dataIndex < 0) && Number.isInteger(currentEditIndex)) {
        dataIndex = currentEditIndex;
    }
    setVirtualKeyboardVisible(false);
    const overlay = document.createElement('div');
    overlay.className = 'image-preview-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.92);
        z-index: 2147483600;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    // 顶部信息栏（产品号）
    const topBar = document.createElement('div');
    topBar.style.cssText = `
        padding: 16px 16px 8px;
        background: rgba(0,0,0,0.6);
        color: white;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;

    topBar.innerHTML = `
        <div data-image-preview-title style="font-weight: 500;">
            ${productId ? `产品号： ${productId}` : '卡片图片预览'}
        </div>
        <mdui-button-icon icon="close" style="color:white;" data-image-preview-close></mdui-button-icon>
    `;

    // 图片容器（支持拖动）
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        touch-action: none;
        position: relative;
    `;

    // wrapper 用于平移 + 缩放 + 旋转 核心容器
    const imgWrapper = document.createElement('div');
    imgWrapper.style.cssText = `
        transition: transform 0.18s ease-out;
        will-change: transform;
        transform-origin: center center;
    `;

    const img = document.createElement('img');
    img.src = src;
	img.className = 'image-preview-image';
    img.style.cssText = `
        max-width: 95%;
        max-height: 85vh;
        object-fit: contain;
        transform-origin: center center;
        user-select: none;
    `;

    imgWrapper.appendChild(img);
    imgContainer.appendChild(imgWrapper);
    overlay.appendChild(topBar);
    overlay.appendChild(imgContainer);

    // 底部操作栏（按钮排序：缩小 → 放大 → 左旋 → 右旋 → 重置 → 下拉菜单最右侧）
    const bottomBar = document.createElement('mdui-bottom-app-bar');
    bottomBar.style.position = 'relative';
    bottomBar.innerHTML = `
        <mdui-button-icon variant="filled" icon="zoom_out" id="zoomOutBtn"></mdui-button-icon>
        <mdui-button-icon variant="filled" icon="zoom_in" id="zoomInBtn"></mdui-button-icon>
        <mdui-button-icon variant="filled" icon="rotate_left" id="rotateLeftBtn"></mdui-button-icon>
        <mdui-button-icon variant="filled" icon="rotate_right" id="rotateRightBtn"></mdui-button-icon>
        <mdui-button-icon variant="filled" icon="restart_alt" id="resetZoomBtn"></mdui-button-icon>
        <mdui-button-icon variant="filled" icon="save" id="saveRotateBtn"></mdui-button-icon>
        <div style="flex-grow: 1;"></div>
        <!-- 预览设置与图片操作菜单 -->
        <mdui-dropdown placement="top" class="image-preview-more-dropdown rsdb-bounded-dropdown">
            <mdui-button-icon slot="trigger" variant="filled" icon="more_vert"></mdui-button-icon>
            <mdui-menu>
				${getImagePreviewPreferenceMenuMarkup()}
                <!-- 拍照替换 -->
                <mdui-menu-item id="takePhotoInPreviewBtn">
                    <mdui-icon slot="start" name="photo_camera"></mdui-icon>
                    拍照替换
                </mdui-menu-item>
                <!-- 从相册选择 -->
                <mdui-menu-item id="selectGalleryInPreviewBtn">
                    <mdui-icon slot="start" name="photo_library"></mdui-icon>
                    从相册选择
                </mdui-menu-item>
                <mdui-divider></mdui-divider>
                <!-- 删除图片（红色警示） -->
                <mdui-menu-item id="deleteImageInPreviewBtn" style="color:var(--mdui-color-error);">
                    <mdui-icon slot="start" name="delete"></mdui-icon>
                    删除图片
                </mdui-menu-item>
            </mdui-menu>
        </mdui-dropdown>
    `;
    overlay.appendChild(bottomBar);

    const previewHost = dom?.dataSheet && (dom.dataSheet.open === true || dom.dataSheet.hasAttribute('open'))
        ? dom.dataSheet
        : document.body;
    previewHost.appendChild(overlay);
	const refreshImagePreviewPreferences = bindImagePreviewPreferenceMenu(overlay, imgContainer, () => img);
	const infoPanel = createImagePreviewInfoPanel({
	    overlay,
	    topBar,
	    getItem: () => getImagePreviewInfoItem(dataIndex),
	    getMeta: () => Number.isInteger(dataIndex) && dataIndex >= 0 ? `第 ${dataIndex + 1} 条` : '未保存项目'
	});

    const closePreview = () => {
        if (imagePreviewEditState?.overlay === overlay) closeImagePreviewEdit();
		infoPanel.destroy();
        overlay.remove();
    };
    topBar.querySelector('[data-image-preview-close]')?.addEventListener('click', closePreview);
    openImagePreviewEditor(overlay, dataIndex);

    // ────────────────────────────── 核心状态 ──────────────────────────────
    let currentScale = 1;
    let translateX = 0;
    let translateY = 0;
    let rotateDeg = 0;
    let isDragging = false;
    let startX = 0, startY = 0;
    let imgWidth = 0;
    let imgHeight = 0;
    let containerWidth = imgContainer.clientWidth;
    let containerHeight = imgContainer.clientHeight;
    const OVERFLOW_PERCENT = 0.5;

    const getClampedPos = (x, y) => {
        const scaledWidth = imgWidth * currentScale;
        const scaledHeight = imgHeight * currentScale;
        const maxX = Math.max(scaledWidth, containerWidth) * OVERFLOW_PERCENT;
        const maxY = Math.max(scaledHeight, containerHeight) * OVERFLOW_PERCENT;
        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y))
        };
    };

    const updatePosImmediately = () => {
        imgWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale}) rotate(${rotateDeg}deg)`;
    };

    const updatePosWithTransition = () => {
        const {x, y} = getClampedPos(translateX, translateY);
        imgWrapper.style.transform = `translate(${x}px, ${y}px) scale(${currentScale}) rotate(${rotateDeg}deg)`;
        translateX = x;
        translateY = y;
    };

    const updateTransform = () => updatePosWithTransition();

    img.onload = function() {
        imgWidth = this.offsetWidth;
        imgHeight = this.offsetHeight;
        containerWidth = imgContainer.clientWidth;
        containerHeight = imgContainer.clientHeight;
        updateTransform();
		refreshImagePreviewPreferences();
    };

    window.addEventListener('resize', () => {
        containerWidth = imgContainer.clientWidth;
        containerHeight = imgContainer.clientHeight;
        updateTransform();
    });

    // ────────────────────────────── 缩放/旋转/重置按钮绑定 ──────────────────────────────
    const zoomOutBtn = bottomBar.querySelector('#zoomOutBtn');
    const zoomInBtn = bottomBar.querySelector('#zoomInBtn');
    const rotateLeftBtn = bottomBar.querySelector('#rotateLeftBtn');
    const rotateRightBtn = bottomBar.querySelector('#rotateRightBtn');
    const resetZoomBtn = bottomBar.querySelector('#resetZoomBtn');
    const saveRotateBtn = bottomBar.querySelector('#saveRotateBtn');

    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => { currentScale = Math.max(0.5, currentScale - 0.25); updateTransform(); });
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => { currentScale = Math.min(4, currentScale + 0.25); updateTransform(); });
    if (rotateLeftBtn) rotateLeftBtn.addEventListener('click', () => { rotateDeg -= 90; updateTransform(); });
    if (rotateRightBtn) rotateRightBtn.addEventListener('click', () => { rotateDeg += 90; updateTransform(); });
    if (resetZoomBtn) resetZoomBtn.addEventListener('click', () => { 
        currentScale = 1; translateX = 0; translateY = 0; rotateDeg = 0; 
        updateTransform();
        typeof showSnackbar === 'function' && showSnackbar('已重置到原始大小和位置', 'info');
    });
    if (saveRotateBtn) saveRotateBtn.addEventListener('click', async () => {
        const deg = ((rotateDeg % 360) + 360) % 360;
        if (!deg) {
            showSnackbar('当前无旋转无需保存', 'info');
            return;
        }
        try {
            showSnackbar('正在保存旋转后的图片...', 'info');
            const q = Number(appSettings.imageCompressQuality) || 0.92;
            const newBase64 = await rotateImageBase64(img.src, deg, q);
            img.src = newBase64;
            const previewImg = document.getElementById('previewImg');
            if (previewImg && previewImg.src) previewImg.src = newBase64;
            const draft = window.__rsdbImageDraft;
            if (draft && Number(draft.targetIndex) === Number(dataIndex)) {
                setImageDraftValue(newBase64);
            } else if (dataIndex !== -1 && tableData[dataIndex]) {
                beginOperation('update_image', '旋转图片', { index: dataIndex, mode: 'viewer_rotate' });
                tableData[dataIndex].cardImage = newBase64;
                await saveDataToIndexedDB();
                updateTable();
                commitOperation();
            } else if (typeof currentEditIndex === 'number' && currentEditIndex !== -1 && tableData[currentEditIndex]) {
                beginOperation('update_image', '旋转图片', { index: currentEditIndex, mode: 'edit_rotate' });
                tableData[currentEditIndex].cardImage = newBase64;
                await saveDataToIndexedDB();
                updateTable();
                commitOperation();
            } else {
                window.tempNewCardImage = newBase64;
            }
            rotateDeg = 0;
            currentScale = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
            showSnackbar(draft && Number(draft.targetIndex) === Number(dataIndex) ? '旋转已加入编辑，保存后生效' : '已保存旋转后的图片', draft && Number(draft.targetIndex) === Number(dataIndex) ? 'info' : 'success');
        } catch (err) {
            console.error(err);
            showSnackbar('保存失败', 'error');
        }
    });

    // ────────────────────────────── 双指缩放 + 单指拖动 ──────────────────────────────
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let lastTap = 0;

    imgContainer.addEventListener('touchstart', e => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const [t1, t2] = e.touches;
            pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            pinchStartScale = currentScale;
        } else if (e.touches.length === 1) {
            const now = Date.now();
            if (now - lastTap < 300) {
                currentScale = 1; translateX = 0; translateY = 0; rotateDeg = 0;
                updateTransform();
                e.preventDefault();
            }
            lastTap = now;
            isDragging = true;
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
        }
    }, { passive: false });

    imgContainer.addEventListener('touchmove', e => {
        if (e.touches.length === 2 && pinchStartDist > 0) {
            e.preventDefault();
            const [t1, t2] = e.touches;
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            currentScale = Math.max(0.5, Math.min(4, pinchStartScale * (dist / pinchStartDist)));
            updatePosImmediately();
        } else if (isDragging && e.touches.length === 1) {
            e.preventDefault();
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            updatePosImmediately();
        }
    }, { passive: false });

    imgContainer.addEventListener('touchend', () => {
        pinchStartDist = 0; 
        isDragging = false;
        updatePosWithTransition();
    });

    bindDesktopImagePreviewInteractions({
        container: imgContainer,
        isEnabled: () => true,
        getState: () => ({ currentScale, translateX, translateY }),
        setState: next => {
            if (next.currentScale != null) currentScale = next.currentScale;
            if (next.translateX != null) translateX = next.translateX;
            if (next.translateY != null) translateY = next.translateY;
        },
        updateImmediately: updatePosImmediately,
        updateWithTransition: updatePosWithTransition
    });

    // ────────────────────────────── 新增：下拉菜单三个按钮的业务逻辑 ──────────────────────────────
    const fileInput = document.getElementById('cardImageInput');

    // 1. 拍照替换
    overlay.querySelector('#takePhotoInPreviewBtn').onclick = () => {
        closePreview();
        chooseCardImage({ capture: true, targetIndex: dataIndex, mode: 'viewer_take' });
    };

    // 2. 从相册选择
    overlay.querySelector('#selectGalleryInPreviewBtn').onclick = () => {
        closePreview();
        chooseCardImage({ capture: false, targetIndex: dataIndex, mode: 'viewer_gallery' });
    };

    // 3. 删除图片
    overlay.querySelector('#deleteImageInPreviewBtn').onclick = () => {
        closePreview();
        openImageDeleteConfirmation(Number.isInteger(dataIndex) && dataIndex >= 0 ? dataIndex : -1);
    };

    // 点击空白处关闭
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePreview();
        }
    });
}

		function openEditModalForImageUpload(dataIndex) {
		    // 仅在打开编辑弹窗时抑制自动键盘，用户之后主动切换不应被拦截。
		    suppressVirtualKeyboard = true;
		    setVirtualKeyboardVisible(false);

		    try {
		        openEditModal(dataIndex);
		    } catch (error) {
		        suppressVirtualKeyboard = false;
		        throw error;
		    }

		    setTimeout(() => {
		        // 滚动到图片上传区
		        const modalContent = document.getElementById('dataSheetContent');
		        if (modalContent) {
		            modalContent.scrollTop = modalContent.scrollHeight;
		        }

		        // 关键修复：移除 capture 属性，确保打开相册而不是相机
		        const fileInput = document.getElementById('cardImageInput');
		        if (!fileInput) {
		            suppressVirtualKeyboard = false;
		            return;
		        }
		        fileInput.removeAttribute('capture');

		        // 文件选择器打开前立即释放，取消选择后也不会留下键盘禁用状态。
		        suppressVirtualKeyboard = false;
		        fileInput.click();
		    }, 400);
		}
		function bindEditModalImageButtons() {
    // 按钮在初始化阶段统一绑定；这里保留兼容入口，避免重复绑定导致文件选择器打开两次。
}
	function showImagePreviewByIndex(index) {
    // 边界检查：如果 index 无效，从 0 开始
    if (index < 0 || index >= tableData.length) {
        index = 0;
    }

    const currentItem = tableData[index];
    let productId = currentItem?.productId || '无产品号'; // ✅ 修改为 let 支持后续更新
    let hasImage = !!(currentItem?.cardImage && currentItem.cardImage.startsWith('data:image/'));

    setVirtualKeyboardVisible(false);
    const overlay = document.createElement('div');
    overlay.className = 'image-preview-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.92);
        z-index: 2147483600;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    // 顶部信息栏（显示产品号 + 当前第几条/总共多少条）
    const topBar = document.createElement('div');
    topBar.style.cssText = `
        padding: 16px 16px 8px;
        background: rgba(0,0,0,0.6);
        color: white;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;

    topBar.innerHTML = `
        <div data-image-preview-title style="font-weight: 500;"></div>
        <mdui-button-icon icon="close" style="color:white;" data-image-preview-close></mdui-button-icon>
    `;
    const topBarTitle = topBar.querySelector('[data-image-preview-title]');
    const updateTopBar = () => {
        if (topBarTitle) topBarTitle.textContent = `产品号：${productId} (${index + 1} / ${tableData.length})`;
    };
    updateTopBar();

    // 图片容器
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        touch-action: none;
        position: relative;
        background: #111;
    `;

    const imgWrapper = document.createElement('div');
    imgWrapper.style.cssText = `
        transition: transform 0.18s ease-out;
        will-change: transform;
        transform-origin: center center;
        text-align: center;
    `;

    let img = null;
    if (hasImage) {
        img = document.createElement('img');
        img.src = currentItem.cardImage;
		img.className = 'image-preview-image';
        img.style.cssText = `
            max-width: 95%;
            max-height: 85vh;
            object-fit: contain;
            transform-origin: center center;
            user-select: none;
        `;
        imgWrapper.appendChild(img);
    } else {
        // 无图片时的占位文字
        const placeholder = document.createElement('div');
		placeholder.className = 'image-preview-placeholder';
        placeholder.style.cssText = `
            color: #aaa;
            font-size: 1.4rem;
            text-align: center;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            max-width: 80%;
        `;
        placeholder.innerHTML = '当前没有图片<br><br>点击右下角菜单进行上传<br></br>提示：底部栏是可以左右滚动的';
        imgWrapper.appendChild(placeholder);
    }

    imgContainer.appendChild(imgWrapper);
    overlay.appendChild(topBar);
    overlay.appendChild(imgContainer);

    // 底部栏（可横向滚动）
    const bottomBar = document.createElement('mdui-bottom-app-bar');
    bottomBar.style.position = 'relative';
    bottomBar.style.overflowX = 'auto';
    bottomBar.style.whiteSpace = 'nowrap';
    bottomBar.style.padding = '0 16px';
    bottomBar.innerHTML = `
        <!-- 放大在前，缩小在后 -->
        <mdui-button-icon variant="filled" icon="zoom_in" id="zoomInBtn"></mdui-button-icon>
        <mdui-button-icon variant="filled" icon="zoom_out" id="zoomOutBtn"></mdui-button-icon>
        <mdui-button-icon variant="filled" icon="rotate_left" id="rotateLeftBtn"></mdui-button-icon>
        <mdui-button-icon variant="filled" icon="rotate_right" id="rotateRightBtn"></mdui-button-icon>
        <!-- 重置无底色 -->
        <mdui-button-icon variant="text" icon="restart_alt" id="resetZoomBtn"></mdui-button-icon>
        <mdui-button-icon variant="filled" icon="save" id="saveRotateBtn"></mdui-button-icon>

        <!-- 上一个 / 下一个 -->
        <mdui-button-icon variant="filled" icon="chevron_left" id="prevImageBtn" title="上一条记录"></mdui-button-icon>
        <mdui-button-icon variant="filled" icon="chevron_right" id="nextImageBtn" title="下一条记录"></mdui-button-icon>

        <div style="flex-grow: 1; min-width: 100px;"></div>

        <mdui-dropdown placement="top" class="image-preview-more-dropdown rsdb-bounded-dropdown">
            <mdui-button-icon slot="trigger" variant="filled" icon="more_vert"></mdui-button-icon>
            <mdui-menu>
				${getImagePreviewPreferenceMenuMarkup()}
                <mdui-menu-item id="takePhotoInPreviewBtn">
                    <mdui-icon slot="start" name="photo_camera"></mdui-icon>拍照
                </mdui-menu-item>
                <mdui-menu-item id="selectGalleryInPreviewBtn">
                    <mdui-icon slot="start" name="photo_library"></mdui-icon>从相册选择
                </mdui-menu-item>
                <mdui-divider></mdui-divider>
                <mdui-menu-item id="deleteImageInPreviewBtn" style="color:var(--mdui-color-error);">
                    <mdui-icon slot="start" name="delete"></mdui-icon>删除图片
                </mdui-menu-item>
            </mdui-menu>
        </mdui-dropdown>
    `;
    overlay.appendChild(bottomBar);
    document.body.appendChild(overlay);
	const refreshImagePreviewPreferences = bindImagePreviewPreferenceMenu(overlay, imgContainer, () => img);
	const infoPanel = createImagePreviewInfoPanel({
	    overlay,
	    topBar,
	    getItem: () => tableData[index] || {},
	    getMeta: () => `第 ${index + 1} / ${tableData.length} 条`
	});
	const closePreview = () => {
	    infoPanel.destroy();
	    overlay.remove();
	};
	topBar.querySelector('[data-image-preview-close]')?.addEventListener('click', closePreview);

    // ────────────────────────────── 核心状态（仅有图片时才启用缩放/旋转/拖动） ──────────────────────────────
    let currentScale = 1;
    let translateX = 0;
    let translateY = 0;
    let rotateDeg = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let imgWidth = 0;
    let imgHeight = 0;
    let containerWidth = imgContainer.clientWidth;
    let containerHeight = imgContainer.clientHeight;
    const OVERFLOW_PERCENT = 0.5;

    const getClampedPos = (x, y) => {
        const scaledWidth = imgWidth * currentScale;
        const scaledHeight = imgHeight * currentScale;
        const maxX = Math.max(scaledWidth, containerWidth) * OVERFLOW_PERCENT;
        const maxY = Math.max(scaledHeight, containerHeight) * OVERFLOW_PERCENT;
        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y))
        };
    };

    const updatePosImmediately = () => {
        imgWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale}) rotate(${rotateDeg}deg)`;
    };

    const updatePosWithTransition = () => {
        const {x, y} = getClampedPos(translateX, translateY);
        imgWrapper.style.transform = `translate(${x}px, ${y}px) scale(${currentScale}) rotate(${rotateDeg}deg)`;
        translateX = x;
        translateY = y;
    };

    const updateTransform = () => updatePosWithTransition();

    if (hasImage) {
        img.onload = function() {
            imgWidth = this.offsetWidth;
            imgHeight = this.offsetHeight;
            containerWidth = imgContainer.clientWidth;
            containerHeight = imgContainer.clientHeight;
            updateTransform();
        };
    }

    window.addEventListener('resize', () => {
        containerWidth = imgContainer.clientWidth;
        containerHeight = imgContainer.clientHeight;
        if (hasImage) updateTransform();
    });

    // ────────────────────────────── 按钮绑定（无图片时部分禁用） ──────────────────────────────
    const zoomOutBtn = bottomBar.querySelector('#zoomOutBtn');
    const zoomInBtn = bottomBar.querySelector('#zoomInBtn');
    const rotateLeftBtn = bottomBar.querySelector('#rotateLeftBtn');
    const rotateRightBtn = bottomBar.querySelector('#rotateRightBtn');
    const resetZoomBtn = bottomBar.querySelector('#resetZoomBtn');
    const saveRotateBtn = bottomBar.querySelector('#saveRotateBtn');
    const prevBtn = bottomBar.querySelector('#prevImageBtn');
    const nextBtn = bottomBar.querySelector('#nextImageBtn');

    // 缩放/旋转/重置只有有图片时才有效
    const enableTransformBtns = hasImage;
    if (zoomOutBtn) zoomOutBtn.disabled = !enableTransformBtns;
    if (zoomInBtn) zoomInBtn.disabled = !enableTransformBtns;
    if (rotateLeftBtn) rotateLeftBtn.disabled = !enableTransformBtns;
    if (rotateRightBtn) rotateRightBtn.disabled = !enableTransformBtns;
    if (resetZoomBtn) resetZoomBtn.disabled = !enableTransformBtns;
    if (saveRotateBtn) saveRotateBtn.disabled = !enableTransformBtns;

    if (enableTransformBtns) {
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => { currentScale = Math.max(0.5, currentScale - 0.25); updateTransform(); });
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => { currentScale = Math.min(4, currentScale + 0.25); updateTransform(); });
        if (rotateLeftBtn) rotateLeftBtn.addEventListener('click', () => { rotateDeg -= 90; updateTransform(); });
        if (rotateRightBtn) rotateRightBtn.addEventListener('click', () => { rotateDeg += 90; updateTransform(); });
        if (resetZoomBtn) resetZoomBtn.addEventListener('click', () => { 
            currentScale = 1; translateX = 0; translateY = 0; rotateDeg = 0; 
            updateTransform();
            typeof showSnackbar === 'function' && showSnackbar('已重置到原始大小和位置', 'info');
        });
        if (saveRotateBtn) saveRotateBtn.addEventListener('click', async () => {
            const deg = ((rotateDeg % 360) + 360) % 360;
            if (!deg) {
                showSnackbar('当前无旋转无需保存', 'info');
                return;
            }
            try {
                showSnackbar('正在保存旋转后的图片...', 'info');
                const q = Number(appSettings.imageCompressQuality) || 0.92;
                const newBase64 = await rotateImageBase64(img.src, deg, q);
                img.src = newBase64;
                if (tableData[index]) {
                    beginOperation('update_image', '旋转图片', { index, mode: 'quick_rotate' });
                    tableData[index].cardImage = newBase64;
                    await saveDataToIndexedDB();
                    updateTable();
                    commitOperation();
                }
                rotateDeg = 0;
                currentScale = 1;
                translateX = 0;
                translateY = 0;
                updateTransform();
                showSnackbar('已保存旋转后的图片', 'success');
            } catch (err) {
                console.error(err);
                showSnackbar('保存失败', 'error');
            }
        });
    }

    // 上一个 / 下一个（始终可用，边界禁用）
    if (prevBtn) prevBtn.addEventListener('click', () => switchImage(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => switchImage(1));

    const updatePrevNext = () => {
        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === tableData.length - 1;
    };
    updatePrevNext();

    // 切换到上一条/下一条记录
    const switchImage = (direction) => {
        index = Math.max(0, Math.min(tableData.length - 1, index + direction));
        const newItem = tableData[index];
        const newHasImage = !!(newItem?.cardImage && newItem.cardImage.startsWith('data:image/'));
        const keepTransform = appSettings.imagePreviewKeepTransform !== false;

        // 更新顶部
        productId = newItem?.productId || '无产品号';
        updateTopBar();
        infoPanel.refresh();
        updatePrevNext();

        // 清空原有图片/占位
        imgWrapper.innerHTML = '';

        if (newHasImage) {
            img = document.createElement('img');
            img.src = newItem.cardImage;
			img.className = 'image-preview-image';
            img.style.cssText = `
                max-width: 95%;
                max-height: 85vh;
                object-fit: contain;
                transform-origin: center center;
                user-select: none;
            `;
            imgWrapper.appendChild(img);

            // 重新加载宽高并更新变换
            img.onload = function() {
                imgWidth = this.offsetWidth;
                imgHeight = this.offsetHeight;
                containerWidth = imgContainer.clientWidth;
                containerHeight = imgContainer.clientHeight;
                if (!keepTransform) {
                    currentScale = 1;
                    translateX = 0;
                    translateY = 0;
                    rotateDeg = 0;
                }
                updateTransform();
				refreshImagePreviewPreferences();
            };

            // 有图片时启用变换按钮
            if (zoomOutBtn) zoomOutBtn.disabled = false;
            if (zoomInBtn) zoomInBtn.disabled = false;
            if (rotateLeftBtn) rotateLeftBtn.disabled = false;
            if (rotateRightBtn) rotateRightBtn.disabled = false;
            if (resetZoomBtn) resetZoomBtn.disabled = false;
            if (saveRotateBtn) saveRotateBtn.disabled = false;
        } else {
            const placeholder = document.createElement('div');
			placeholder.className = 'image-preview-placeholder';
            placeholder.style.cssText = `
                color: #aaa;
                font-size: 1.4rem;
                text-align: center;
                padding: 20px;
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                max-width: 80%;
            `;
            placeholder.innerHTML = '当前没有图片<br><br>点击右下角菜单进行上传<br></br>提示：底部栏是可以左右滚动的';
            imgWrapper.appendChild(placeholder);

            // 无图片时禁用变换按钮状态
            if (zoomOutBtn) zoomOutBtn.disabled = true;
            if (zoomInBtn) zoomInBtn.disabled = true;
            if (rotateLeftBtn) rotateLeftBtn.disabled = true;
            if (rotateRightBtn) rotateRightBtn.disabled = true;
            if (resetZoomBtn) resetZoomBtn.disabled = true;
            if (saveRotateBtn) saveRotateBtn.disabled = true;
        }
        hasImage = newHasImage;
		refreshImagePreviewPreferences();
    };

    // ────────────────────────────── 双指缩放 + 单指拖动（仅有图片时有效） ──────────────────────────────
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let lastTap = 0;

    imgContainer.addEventListener('touchstart', e => {
        if (!hasImage) return;
        if (e.touches.length === 2) {
            e.preventDefault();
            const [t1, t2] = e.touches;
            pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            pinchStartScale = currentScale;
        } else if (e.touches.length === 1) {
            const now = Date.now();
            if (now - lastTap < 300) {
                currentScale = 1; translateX = 0; translateY = 0; rotateDeg = 0;
                updateTransform();
                e.preventDefault();
            }
            lastTap = now;
            isDragging = true;
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
        }
    }, { passive: false });

    imgContainer.addEventListener('touchmove', e => {
        if (!hasImage) return;
        if (e.touches.length === 2 && pinchStartDist > 0) {
            e.preventDefault();
            const [t1, t2] = e.touches;
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            currentScale = Math.max(0.5, Math.min(4, pinchStartScale * (dist / pinchStartDist)));
            updatePosImmediately();
        } else if (isDragging && e.touches.length === 1) {
            e.preventDefault();
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            updatePosImmediately();
        }
    }, { passive: false });

    imgContainer.addEventListener('touchend', () => {
        pinchStartDist = 0; 
        isDragging = false;
        if (hasImage) updatePosWithTransition();
    });

    bindDesktopImagePreviewInteractions({
        container: imgContainer,
        isEnabled: () => hasImage,
        getState: () => ({ currentScale, translateX, translateY }),
        setState: next => {
            if (next.currentScale != null) currentScale = next.currentScale;
            if (next.translateX != null) translateX = next.translateX;
            if (next.translateY != null) translateY = next.translateY;
        },
        updateImmediately: updatePosImmediately,
        updateWithTransition: updatePosWithTransition
    });

    // ────────────────────────────── 拍照/相册/删除业务逻辑 ──────────────────────────────
    const fileInput = document.getElementById('cardImageInput');

    overlay.querySelector('#takePhotoInPreviewBtn').onclick = () => {
        overlay.remove();
        chooseCardImage({ capture: true, targetIndex: index, mode: 'preview_take' });
    };

    overlay.querySelector('#selectGalleryInPreviewBtn').onclick = () => {
        overlay.remove();
        chooseCardImage({ capture: false, targetIndex: index, mode: 'preview_gallery' });
    };

    overlay.querySelector('#deleteImageInPreviewBtn').onclick = () => {
        overlay.remove();
        openImageDeleteConfirmation(index);
    };

    // 点击空白处关闭
    overlay.onclick = (e) => { 
        if (e.target === overlay) overlay.remove(); 
    };
}


// ────────────── 快捷短语工具栏位置初始化（可拖动到视口内任意位置） ──────────────
