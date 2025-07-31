// 全局变量初始化
const largeContainer = document.getElementById('largeContainer');
const smallContainer = document.getElementById('smallContainer');
const crocodileNest = document.getElementById('crocodileNest');
const unlockModal = document.getElementById('unlockModal');
const unlockScreen = document.getElementById('unlockScreen');
const rewardScreen = document.getElementById('rewardScreen');
const rewardTitle = document.getElementById('rewardTitle');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const gridContainer = document.getElementById('gridContainer');
const gridLines = document.getElementById('gridLines');
const closeBtn = document.getElementById('closeBtn');
const selectButton = document.querySelector('.select-button');
const directUnlockBtn = document.getElementById('directUnlockBtn');
const scrollArea = document.getElementById('scrollArea');
const buttonContainer = document.getElementById('buttonContainer');
const clearRecordsBtn = document.getElementById('clearRecordsBtn');
const recordsContainer = document.getElementById('recordsContainer');
const totalItemsCount = document.getElementById('totalItemsCount');
const itemDetailModal = document.getElementById('itemDetailModal');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');
const containerTypeList = document.getElementById('containerTypeList');
const containerItems = document.querySelectorAll('.container-item:not(.disabled)');
const stopConditionSearch = document.getElementById('stopConditionSearch');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const slideSelectToggle = document.getElementById('slideSelectToggle');

// 一键抽取相关元素
const batchSettingsPanel = document.getElementById('batchView');
const drawCountInput = document.getElementById('drawCount');
const maxCountBtn = document.getElementById('maxCountBtn');
const stopConditionContainer = document.getElementById('stopConditionContainer');
const stopOnAnyCheckbox = document.getElementById('stopOnAny');
const startBatchBtn = document.getElementById('startBatchBtn');
const batchProgressContainer = document.getElementById('batchProgressContainer');
const batchProgressBar = document.getElementById('batchProgressBar');
const batchResultModal = document.getElementById('batchResultModal');
const closeBatchResultBtn = document.getElementById('closeBatchResultBtn');
const closeBatchBtn = document.getElementById('closeBatchBtn');
const resultInsuranceType = document.getElementById('resultInsuranceType');
const resultTotalDraws = document.getElementById('resultTotalDraws');
const resultStopReason = document.getElementById('resultStopReason');
const resultStopReasonText = document.getElementById('resultStopReasonText');
const resultTargetItemCount = document.getElementById('resultTargetItemCount');
const batchResultItems = document.getElementById('batchResultItems');

const detailIconContainer = document.getElementById('detailIconContainer');
const detailName = document.getElementById('detailName');
const detailSize = document.getElementById('detailSize');
const detailDescription = document.getElementById('detailDescription');
const toast = document.getElementById('toast');
const loadingIndicator = document.getElementById('loadingIndicator');

const scrollCols = document.querySelectorAll('.scroll-col');;
const scrollElements = [
    document.getElementById('scroll0'),
    document.getElementById('scroll1'),
    document.getElementById('scroll2'),
    document.getElementById('scroll3'),
    document.getElementById('scroll4')
];

// 状态管理变量
let appState = {
    itemRecords: JSON.parse(localStorage.getItem('deltaContainerRecords')) || {},
    currentRewardItems: [],
    currentContainerType: 'large',
    isBatchDrawing: false,
    selectedStopItems: new Set(),
    isProcessingRewards: false,
    lastDrawItems: [],
    isSlideSelecting: false,
    lastSelectedItem: null,
    currentColIndex: 0,
    progress: 0,
    progressTimer: null,
    unlockedCols: 0,
    isPaused: false,
    rewardsShown: false,
    scrollAnimations: [],
    lockedColumns: [],
    randomOffsets: [],
    targetPositions: [],
    visibleCharsCount: 5,
    middlePositionIndex: 2,
    charHeight: 32,
    selectionTolerance: 35,
    errorPauseTimer: null,
    redItemCount: 0,
    gridSize: 4, // 默认4x4
    cellPercentage: 100 / 4,
    itemSpacing: 2,
    // 物品数据存储 - 按容器类型分离
    largeContainerItems: [],
    smallContainerItems: [],
    crocodileNestItems: [],
    // 所有物品的集合（用于记录和筛选）
    allItems: [],
    dataLoaded: {
        large: false,
        small: false,
        crocodile: false
    }
};

// 颜色延迟配置
const colorDelays = {
    'default': 0.5,
    'green': 1,
    'blue': 1.5,
    'purple': 2,
    'gold': 2.5,
    'red': 3
};

// 初始化函数 - 从不同JSON加载各容器数据
// 修改initApp函数中的数据加载部分
async function initApp() {
    showLoading();
    try {
        // 先检查本地是否有测试数据，用于开发调试
        // 生产环境可以移除这部分
        if (window.testData) {
            appState.largeContainerItems = window.testData.large || [];
            appState.smallContainerItems = window.testData.small || [];
            appState.crocodileNestItems = window.testData.crocodile || [];
        } else {
            // 并行加载所有容器的物品数据
            // 使用相对路径或完整URL
            const [largeData, smallData, crocodileData] = await Promise.all([
                fetch('data/large-safe-items.json').catch(err => {
                    console.error('大保险箱数据加载失败:', err);
                    // 提供备用数据
                    return {ok: true, json: () => []};
                }),
                fetch('data/small-safe-items.json').catch(err => {
                    console.error('小保险箱数据加载失败:', err);
                    return {ok: true, json: () => []};
                }),
                fetch('data/crocodile-nest-items.json').catch(err => {
                    console.error('鳄鱼巢穴数据加载失败:', err);
                    return {ok: true, json: () => []};
                })
            ]);
            
            // 验证响应并解析JSON数据
            appState.largeContainerItems = largeData.ok ? await largeData.json() : [];
            appState.smallContainerItems = smallData.ok ? await smallData.json() : [];
            appState.crocodileNestItems = crocodileData.ok ? await crocodileData.json() : [];
        }
        
        // 合并所有物品用于记录和筛选功能
        appState.allItems = [
            ...appState.largeContainerItems,
            ...appState.smallContainerItems,
            ...appState.crocodileNestItems
        ];
        
        // 去重处理
        appState.allItems = [...new Map(appState.allItems.map(item => [item.name, item])).values()];
        
        // 更新加载状态
        appState.dataLoaded.large = appState.largeContainerItems.length > 0;
        appState.dataLoaded.small = appState.smallContainerItems.length > 0;
        appState.dataLoaded.crocodile = appState.crocodileNestItems.length > 0;
        
        // 完成初始化
        initScrollers();
        renderItemRecords();
        initBatchDrawSettings();
        
        // 初始化显示第一个视图
        viewSections[0].classList.add('active');
        navItems[0].classList.add('active');
        
        hideLoading();
        showToast('数据加载完成');
    } catch (error) {
        console.error('初始化失败:', error);
        showToast(`初始化失败: ${error.message}`);
        // 即使出错也确保隐藏加载状态
        hideLoading();
        
        // 提供基本的降级体验
        initScrollers();
        renderItemRecords();
        initBatchDrawSettings();
    }
}

// 添加一个辅助函数，检查数据文件是否存在
async function checkDataFileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}
    
// 核心功能函数
function getRandomItemCount() {
    if (appState.currentContainerType === 'small') {
        const random = Math.random();
        if (random < 0.4) return 1;
        if (random < 0.8) return 2;
        return 3;
    } else if (appState.currentContainerType === 'crocodile') {
        // 鳄鱼巢穴物品数量概率分布
        const random = Math.random();
        if (random < 0.2) return 1;
        if (random < 0.5) return 2;
        if (random < 0.8) return 3;
        if (random < 0.95) return 4;
        return 5;
    }
    
    // 大容器默认分布
    const probabilityDistribution = [
        { count: 1, probability: 0.30 },
        { count: 2, probability: 0.30 },
        { count: 3, probability: 0.25 },
        { count: 4, probability: 0.10 },
        { count: 5, probability: 0.03 },
        { count: 6, probability: 0.015 },
        { count: 7, probability: 0.005 }
    ];
    
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const dist of probabilityDistribution) {
        cumulativeProbability += dist.probability;
        if (random <= cumulativeProbability) {
            return dist.count;
        }
    }
    
    return 1;
}

function initScrollers() {
    appState.scrollAnimations = [];
    scrollElements.forEach((el, index) => {
        const col = scrollCols[index];
        const chars = col.dataset.chars.split(',');
        const target = col.dataset.target;
        
        const targetPos = chars.indexOf(target);
        appState.targetPositions[index] = targetPos;
        
        const randomOffset = Math.floor(Math.random() * chars.length);
        appState.randomOffsets[index] = randomOffset;
        
        const extendedChars = [...chars, ...chars, ...chars];
        
        let html = '';
        extendedChars.forEach((char, pos) => {
            const originalPos = pos % chars.length;
            const isTarget = originalPos === targetPos;
            
            if (isTarget) {
                html += `<div class="text-highlight text-shadow h-[32px] flex items-center justify-center">${char}</div>`;
            } else {
                html += `<div class="h-[32px] flex items-center justify-center">${char}</div>`;
            }
        });
        
        el.innerHTML = html;
        
        const initialOffset = randomOffset * appState.charHeight;
        el.style.transform = `translateY(-${initialOffset}px)`;
        el.style.transition = 'transform 0.3s ease-out';
        
        const animation = el.animate(
            [
                { transform: `translateY(-${initialOffset}px)` },
                { transform: `translateY(-${initialOffset + chars.length * appState.charHeight}px)` }
            ],
            {
                duration: 1000,
                iterations: Infinity,
                easing: 'linear'
            }
        );
        
        animation.play();
        appState.scrollAnimations[index] = animation;
    });
    
    highlightActiveColumn();
}

function highlightActiveColumn() {
    scrollCols.forEach(col => col.classList.remove('active-column'));
    scrollCols[appState.currentColIndex].classList.add('active-column');
}

function generateGridLines() {
    gridLines.innerHTML = '';
    
    for (let i = 1; i < appState.gridSize; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line';
        line.style.height = '1px';
        line.style.width = '100%';
        line.style.top = `${i * (100 / appState.gridSize)}%`;
        gridLines.appendChild(line);
    }
    
    for (let i = 1; i < appState.gridSize; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line';
        line.style.width = '1px';
        line.style.height = '100%';
        line.style.left = `${i * (100 / appState.gridSize)}%`;
        gridLines.appendChild(line);
    }
}

function adjustButtonPosition() {
    const scrollWidth = scrollArea.offsetWidth;
    const containerWidth = unlockModal.querySelector('.max-w-xl').offsetWidth;
    
    if (scrollWidth + 240 > containerWidth - 40) {
        buttonContainer.classList.remove('flex-row', 'justify-center');
        buttonContainer.classList.add('flex-col', 'items-center');
        scrollArea.classList.remove('mb-6');
        scrollArea.classList.add('mb-2');
    } else {
        buttonContainer.classList.add('flex-row', 'justify-center');
        buttonContainer.classList.remove('flex-col', 'items-center');
        scrollArea.classList.add('mb-6');
        scrollArea.classList.remove('mb-2');
    }
}

function openUnlockModal(containerType) {
    // 检查对应容器的数据是否已加载
    if (!appState.dataLoaded[containerType]) {
        showToast('该容器数据加载中，请稍后');
        return;
    }
    
    if (appState.isProcessingRewards) {
        showToast('请等待当前物品加载完成');
        return;
    }
    
    appState.currentContainerType = containerType;
    unlockModal.classList.remove('hidden');
    
    // 根据容器类型设置标题
    if (containerType === 'large') {
        rewardTitle.textContent = '大保险容器物品清单';
    } else if (containerType === 'small') {
        rewardTitle.textContent = '小保险容器物品清单';
    } else if (containerType === 'crocodile') {
        rewardTitle.textContent = '鳄鱼巢穴物品清单';
    }
    
    // 设置网格大小
    if (containerType === 'crocodile') {
        appState.gridSize = 5; // 鳄鱼巢穴使用5x5网格
    } else {
        appState.gridSize = 4; // 大保险和小保险均为4x4
    }
    appState.cellPercentage = 100 / appState.gridSize;
    
    resetUnlockState();
    
    setTimeout(adjustButtonPosition, 100);
}

function openSmallContainerDirectly() {
    // 检查小容器数据是否已加载
    if (!appState.dataLoaded.small) {
        showToast('小容器数据加载中，请稍后');
        return;
    }
    
    if (appState.isProcessingRewards) {
        showToast('请等待当前物品加载完成');
        return;
    }
    
    appState.currentContainerType = 'small';
    unlockModal.classList.remove('hidden');
    
    rewardTitle.textContent = '小保险容器物品清单';
    
    appState.gridSize = 4; // 小保险4x4
    appState.cellPercentage = 100 / appState.gridSize;
    
    generateGridLines();
    
    unlockScreen.classList.add('hidden');
    rewardScreen.classList.remove('hidden');
    
    generateRewards();
}

// 事件监听器
largeContainer.addEventListener('click', () => {
    openUnlockModal('large');
});

smallContainer.addEventListener('click', () => {
    openSmallContainerDirectly();
});

// 鳄鱼巢穴容器点击事件
crocodileNest.addEventListener('click', () => {
    openUnlockModal('crocodile');
});

closeBtn.addEventListener('click', () => {
    clearGridItems();
    
    unlockModal.classList.add('hidden');
    rewardScreen.classList.add('hidden');
    unlockScreen.classList.remove('hidden');
    appState.rewardsShown = false;
    appState.redItemCount = 0;
    appState.currentRewardItems = [];
    selectButton.querySelector('span').textContent = '选定密码';
    appState.isProcessingRewards = false;
});

closeDetailBtn.addEventListener('click', () => {
    itemDetailModal.classList.remove('active');
});

itemDetailModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    itemDetailModal.classList.remove('active');
});

clearRecordsBtn.addEventListener('click', function() {
    this.classList.add('button-click');
    setTimeout(() => {
        this.classList.remove('button-click');
    }, 200);
    
    if (Object.keys(appState.itemRecords).length === 0) {
        showToast('没有记录可清空');
        return;
    }
    
    if (confirm('确定要清空所有物品记录吗？')) {
        appState.itemRecords = {};
        
        localStorage.removeItem('deltaContainerRecords');
        localStorage.setItem('deltaContainerRecords', JSON.stringify(appState.itemRecords));
        
        renderItemRecords();
        showToast('记录已清空');
    }
});

directUnlockBtn.addEventListener('click', function() {
    this.classList.add('button-click');
    setTimeout(() => {
        this.classList.remove('button-click');
    }, 200);
    
    stopAllAnimations();
    
    forceAllColumnsToTarget();
    
    appState.progress = 100;
    updateProgressBar();
    
    selectButton.querySelector('span').textContent = '解锁完成';
    
    setTimeout(() => {
        showRewards();
    }, 800);
});

// 物品记录相关函数
function renderItemRecords() {
    recordsContainer.innerHTML = '';
    
    const recordsList = Object.values(appState.itemRecords)
        .sort((a, b) => b.count - a.count);
    
    const totalCount = recordsList.reduce((sum, item) => sum + item.count, 0);
    totalItemsCount.textContent = `总计: ${totalCount} 件`;
    
    if (recordsList.length === 0) {
        recordsContainer.innerHTML = `
            <div class="text-gray-400 text-center py-4">
                暂无物品记录
            </div>
        `;
        return;
    }
    
    recordsList.forEach(item => {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item flex justify-between items-center p-2 rounded';
        recordItem.innerHTML = `
            <div class="flex items-center">
                <div class="record-icon bg-${item.color}/30 text-white rounded-full mr-2 overflow-hidden">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain">
                </div>
                <span class="truncate max-w-[200px] sm:max-w-[400px]">${item.name}</span>
            </div>
            <span class="counter-badge bg-${item.color}/30 text-white rounded-full text-xs font-bold">
                ${item.count}
            </span>
        `;
        
        recordItem.addEventListener('click', () => {
            showItemDetail(item);
        });
        
        recordsContainer.appendChild(recordItem);
    });
}

function autoRecordItems(items) {
    items.forEach(item => {
        const itemId = item.name;
        
        if (appState.itemRecords[itemId]) {
            appState.itemRecords[itemId].count++;
        } else {
            appState.itemRecords[itemId] = {
                ...item,
                count: 1
            };
        }
    });
    
    localStorage.setItem('deltaContainerRecords', JSON.stringify(appState.itemRecords));
    
    renderItemRecords();
}

function showItemDetail(item) {
    if (!item || !item.name || !item.image || !item.description) {
        console.error('物品数据不完整', item);
        return;
    }
    
    detailIconContainer.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain">
    `;
    detailIconContainer.className = `w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center bg-${item.color || 'gray'}/30`;
    detailName.textContent = item.name;
    detailName.className = `text-2xl font-bold mb-2 text-${item.color || 'white'}`;
    detailSize.textContent = `尺寸: ${item.size ? `${item.size[0]}x${item.size[1]}` : '未知'}`;
    detailDescription.textContent = item.description;
    
    itemDetailModal.classList.add('active');
}

selectButton.addEventListener('click', () => {
    selectButton.classList.add('button-click');
    setTimeout(() => {
        selectButton.classList.remove('button-click');
    }, 200);
    
    if (appState.rewardsShown) return;
    
    if (appState.isPaused) {
        clearTimeout(appState.errorPauseTimer);
    }
    
    const currentCol = scrollCols[appState.currentColIndex];
    const targetChar = currentCol.dataset.target;
    const chars = currentCol.dataset.chars.split(',');
    const charCount = chars.length;
    const randomOffset = appState.randomOffsets[appState.currentColIndex];
    
    const animation = appState.scrollAnimations[appState.currentColIndex];
    const progress = animation.currentTime / animation.effect.getTiming().duration;
    
    const totalScrollDistance = charCount * appState.charHeight;
    const currentPixelPosition = (progress * totalScrollDistance + randomOffset * appState.charHeight) % totalScrollDistance;
    
    const visibleAreaStart = currentPixelPosition;
    const boxCharPosition = visibleAreaStart + appState.middlePositionIndex * appState.charHeight;
    const boxCharIndex = Math.floor(boxCharPosition / appState.charHeight) % charCount;
    const boxChar = chars[boxCharIndex];
    
    const targetPixelPosition = (appState.targetPositions[appState.currentColIndex] * appState.charHeight) % totalScrollDistance;
    let pixelDiff = Math.abs(currentPixelPosition - targetPixelPosition);
    pixelDiff = Math.min(pixelDiff, totalScrollDistance - pixelDiff);
    
    animation.pause();
    appState.isPaused = true;
    
    if (boxChar === targetChar || pixelDiff <= appState.selectionTolerance) {
        selectButton.classList.add('complete-animation', 'bg-green/30');
        
        setTimeout(() => {
            const targetOffset = (appState.targetPositions[appState.currentColIndex] - randomOffset + charCount) % charCount * appState.charHeight;
            scrollElements[appState.currentColIndex].style.transform = `translateY(-${targetOffset}px)`;
            
            const charElements = scrollElements[appState.currentColIndex].querySelectorAll('div');
            charElements.forEach(el => el.classList.remove('char-scale'));
            
            const targetCharIndex = chars.length + appState.targetPositions[appState.currentColIndex];
            charElements[targetCharIndex].classList.add('char-scale', 'center-char');
            
            currentCol.classList.add('bg-gray-700/60', 'final-highlight');
            
            animation.cancel();
            
            appState.unlockedCols++;
            appState.lockedColumns.push(appState.currentColIndex);
            
            selectButton.classList.remove('complete-animation', 'bg-green/30');
            
            const nextCol = parseInt(currentCol.dataset.next);
            if (nextCol < 5) {
                appState.currentColIndex = nextCol;
                appState.isPaused = false;
                highlightActiveColumn();
            } else {
                selectButton.querySelector('span').textContent = '解锁完成';
                
                stopAllAnimations();
                
                setTimeout(() => {
                    completeProgress();
                }, 1000);
            }
        }, 300);
    } else {
        currentCol.classList.add('error-highlight');
        selectButton.classList.add('error-highlight');
        
        appState.errorPauseTimer = setTimeout(() => {
            currentCol.classList.remove('error-highlight');
            selectButton.classList.remove('error-highlight');
            
            animation.play();
            appState.isPaused = false;
        }, 1000);
    }
});

// 辅助函数
function stopAllAnimations() {
    appState.scrollAnimations.forEach(animation => {
        if (animation) {
            animation.cancel();
        }
    });
    
    clearInterval(appState.progressTimer);
    
    document.querySelectorAll('.pulse, .progress-shine').forEach(el => {
        el.style.animationPlayState = 'paused';
    });
}

function forceAllColumnsToTarget() {
    scrollCols.forEach((col, index) => {
        if (appState.lockedColumns.includes(index)) return;
        
        const chars = col.dataset.chars.split(',');
        const charCount = chars.length;
        const randomOffset = appState.randomOffsets[index];
        
        const targetOffset = (appState.targetPositions[index] - randomOffset + charCount) % charCount * appState.charHeight;
        scrollElements[index].style.transform = `translateY(-${targetOffset}px)`;
        
        if (appState.scrollAnimations[index]) {
            appState.scrollAnimations[index].cancel();
        }
        
        const charElements = scrollElements[index].querySelectorAll('div');
        const targetCharIndex = chars.length + appState.targetPositions[index];
        charElements[targetCharIndex].classList.add('center-char');
        
        col.classList.add('bg-gray-700/60', 'final-highlight');
    });
}

function updateProgressBar() {
    progressBar.style.width = `${appState.progress}%`;
    progressText.textContent = `${appState.progress}%`;
}

function resetUnlockState() {
    clearTimeout(appState.errorPauseTimer);
    
    appState.progress = 0;
    appState.currentColIndex = 0;
    appState.unlockedCols = 0;
    appState.isPaused = false;
    appState.rewardsShown = false;
    appState.lockedColumns = [];
    appState.randomOffsets = [];
    appState.targetPositions = [];
    appState.redItemCount = 0;
    appState.currentRewardItems = [];
    updateProgressBar();
    
    scrollCols.forEach((col, index) => {
        col.classList.remove('error-highlight', 'bg-gray-700/60', 'final-highlight', 'active-column');
        
        if (appState.scrollAnimations[index]) {
            appState.scrollAnimations[index].cancel();
        }
        scrollElements[index].style.transform = 'translateY(0)';
    });
    
    initScrollers();
    
    selectButton.classList.remove('complete-animation', 'bg-green/30', 'error-highlight');
    selectButton.querySelector('span').textContent = '选定密码';
    
    clearInterval(appState.progressTimer);
    appState.progressTimer = setInterval(() => {
        if (appState.rewardsShown) return;
        
        appState.progress++;
        if (appState.progress >= 100) {
            appState.progress = 100;
            clearInterval(appState.progressTimer);
            
            forceAllColumnsToTarget();
            
            stopAllAnimations();
            
            setTimeout(() => {
                selectButton.querySelector('span').textContent = '解锁完成';
                setTimeout(showRewards, 1000);
            }, 1000);
        }
        updateProgressBar();
    }, 200);
}

function completeProgress() {
    if (appState.rewardsShown) return;
    
    clearInterval(appState.progressTimer);
    appState.progress = 100;
    updateProgressBar();
    
    forceAllColumnsToTarget();
    
    showRewards();
}

function showRewards() {
    if (appState.rewardsShown) return;
    appState.rewardsShown = true;
    
    generateGridLines();
    
    setTimeout(() => {
        unlockScreen.classList.add('hidden');
        rewardScreen.classList.remove('hidden');
        generateRewards();
    }, 800);
}

// 清空网格中的所有物品
function clearGridItems() {
    const items = gridContainer.querySelectorAll('.placeholder-item, [class*="bg-blue"], [class*="bg-purple"], [class*="bg-gold"], [class*="bg-red"], .magnifier-track');
    items.forEach(item => {
        if (item.parentNode === gridContainer) {
            gridContainer.removeChild(item);
        }
    });
}

function generateRewards() {
    appState.isProcessingRewards = true;
    
    clearGridItems();
    
    let selectedItems = [];
    const itemPool = getCurrentContainerItemPool();
    
    if (!itemPool || itemPool.length === 0) {
        console.error(`未找到${appState.currentContainerType}容器的物品池`);
        appState.isProcessingRewards = false;
        return;
    }
    
    // 根据容器类型生成不同的物品
    if (appState.currentContainerType === 'crocodile') {
        // 鳄鱼巢穴物品生成逻辑
        const itemCount = getRandomItemCount();
        
        // 复苏呼吸机特殊概率逻辑
        const resuscitationVentilator = itemPool.find(item => item.name === '复苏呼吸机');
        if (resuscitationVentilator && Math.random() < 0.001) {
            selectedItems.push({...resuscitationVentilator});
            
            // 如果需要更多物品，继续抽取
            for (let i = 1; i < itemCount; i++) {
                selectedItems.push(drawCrocodileNestItem(itemPool));
            }
        } else {
            // 正常抽取鳄鱼巢穴物品
            for (let i = 0; i < itemCount; i++) {
                selectedItems.push(drawCrocodileNestItem(itemPool));
            }
        }
    } else if (appState.currentContainerType === 'large') {
        // 大容器物品生成逻辑
        let itemCount = getRandomItemCount();
        
        // 抽取非洲之心的特殊逻辑 (0.1%概率)
        const heartOfAfrica = itemPool.find(item => item.name === '非洲之心');
        let hasHeartOfAfrica = false;
        
        if (heartOfAfrica && Math.random() < 0.001) {
            hasHeartOfAfrica = true;
            // 决定非洲之心出现的位置
            const heartPosition = Math.floor(Math.random() * itemCount);
        }
        
        // 按品质抽取其他物品
        for (let i = 0; i < itemCount; i++) {
            // 如果需要放置非洲之心且当前位置是随机确定的位置
            if (hasHeartOfAfrica && Math.random() < 0.3) { // 30%概率在当前位置放置非洲之心
                selectedItems.push({...heartOfAfrica});
                hasHeartOfAfrica = false; // 确保只放置一次
                continue;
            }
            
            let selectedItem = null;
            const random = Math.random();
            
            // 品质概率：30%蓝，30%紫，30%金，10%红
            if (random < 0.30) {
                // 蓝色物品
                const blueItems = itemPool.filter(item => item.color === 'blue' && item.name !== '非洲之心');
                selectedItem = blueItems[Math.floor(Math.random() * blueItems.length)];
            } else if (random < 0.60) {
                // 紫色物品
                const purpleItems = itemPool.filter(item => item.color === 'purple' && item.name !== '非洲之心');
                selectedItem = purpleItems[Math.floor(Math.random() * purpleItems.length)];
            } else if (random < 0.90) {
                // 金色物品
                const goldItems = itemPool.filter(item => item.color === 'gold' && item.name !== '非洲之心');
                selectedItem = goldItems[Math.floor(Math.random() * goldItems.length)];
            } else {
                // 红色物品（不含非洲之心）
                const redItems = itemPool.filter(item => item.color === 'red' && item.name !== '非洲之心');
                selectedItem = redItems[Math.floor(Math.random() * redItems.length)];
            }
            
            if (selectedItem) {
                selectedItems.push({...selectedItem});
            }
        }
        
        // 如果还没放置非洲之心，放在最后
        if (hasHeartOfAfrica) {
            selectedItems.push({...heartOfAfrica});
        }
    } else {
        // 小容器物品生成逻辑
        const itemCount = getRandomItemCount();
        
        // 抽取非洲之心的特殊逻辑 (0.1%概率)
        const heartOfAfrica = itemPool.find(item => item.name === '非洲之心');
        
        if (heartOfAfrica && Math.random() < 0.001) {
            // 小容器中非洲之心有70%概率单独出现，30%概率与其他物品一起出现
            if (Math.random() < 0.7) {
                // 单独出现
                selectedItems.push({...heartOfAfrica});
            } else {
                // 与其他物品一起出现，随机位置
                const heartPosition = Math.floor(Math.random() * itemCount);
                
                for (let i = 0; i < itemCount; i++) {
                    if (i === heartPosition) {
                        selectedItems.push({...heartOfAfrica});
                    } else {
                        selectedItems.push(drawSmallContainerItem(itemPool));
                    }
                }
            }
        } else {
            // 正常抽取小保险物品
            for (let i = 0; i < itemCount; i++) {
                selectedItems.push(drawSmallContainerItem(itemPool));
            }
        }
    }
    
    // 保存最后一次抽取的物品
    appState.lastDrawItems = [...selectedItems];
    
    appState.currentRewardItems = [...selectedItems];
    
    autoRecordItems(appState.currentRewardItems);
    
    const allItemCells = placeAllItemPlaceholders(selectedItems);
    
    // 计算总延迟时间
    let totalDelay = 0;
    selectedItems.forEach(item => {
        totalDelay += colorDelays[item.color] * 1000;
    });
    
    // 开始读取物品
    readItemsInOrder(selectedItems, allItemCells);
    
    // 设置处理完成状态
    setTimeout(() => {
        appState.isProcessingRewards = false;
    }, totalDelay + 1000);
}

// 获取当前容器类型对应的物品池（直接使用对应JSON加载的数据）
function getCurrentContainerItemPool() {
    switch(appState.currentContainerType) {
        case 'large':
            return appState.largeContainerItems;
        case 'small':
            return appState.smallContainerItems;
        case 'crocodile':
            return appState.crocodileNestItems;
        default:
            return [];
    }
}

// 鳄鱼巢穴物品抽取（按品质概率）
function drawCrocodileNestItem(itemPool) {
    const random = Math.random();
    
    // 鳄鱼巢穴的概率分布：40%蓝，30%紫，20%金，10%红
    if (random < 0.40) {
        // 蓝色物品
        const blueItems = itemPool.filter(item => item.color === 'blue' && item.name !== '复苏呼吸机');
        return blueItems.length > 0 ? {...blueItems[Math.floor(Math.random() * blueItems.length)]} : null;
    } else if (random < 0.70) {
        // 紫色物品
        const purpleItems = itemPool.filter(item => item.color === 'purple' && item.name !== '复苏呼吸机');
        return purpleItems.length > 0 ? {...purpleItems[Math.floor(Math.random() * purpleItems.length)]} : null;
    } else if (random < 0.90) {
        // 金色物品
        const goldItems = itemPool.filter(item => item.color === 'gold' && item.name !== '复苏呼吸机');
        return goldItems.length > 0 ? {...goldItems[Math.floor(Math.random() * goldItems.length)]} : null;
    } else {
        // 红色物品（不含复苏呼吸机）
        const redItems = itemPool.filter(item => item.color === 'red' && item.name !== '复苏呼吸机');
        return redItems.length > 0 ? {...redItems[Math.floor(Math.random() * redItems.length)]} : null;
    }
}

// 小保险容器物品抽取（按品质概率）
function drawSmallContainerItem(itemPool) {
    const random = Math.random();
    
    if (random < 0.30) {
        // 蓝色物品
        const blueItems = itemPool.filter(item => item.color === 'blue' && item.name !== '非洲之心');
        return blueItems.length > 0 ? {...blueItems[Math.floor(Math.random() * blueItems.length)]} : null;
    } else if (random < 0.60) {
        // 紫色物品
        const purpleItems = itemPool.filter(item => item.color === 'purple' && item.name !== '非洲之心');
        return purpleItems.length > 0 ? {...purpleItems[Math.floor(Math.random() * purpleItems.length)]} : null;
    } else if (random < 0.95) {
        // 金色物品
        const goldItems = itemPool.filter(item => item.color === 'gold' && item.name !== '非洲之心');
        return goldItems.length > 0 ? {...goldItems[Math.floor(Math.random() * goldItems.length)]} : null;
    } else {
        // 红色物品（不含非洲之心）
        const redItems = itemPool.filter(item => item.color === 'red' && item.name !== '非洲之心');
        return redItems.length > 0 ? {...redItems[Math.floor(Math.random() * redItems.length)]} : null;
    }
}

function placeAllItemPlaceholders(items) {
    const occupiedCells = new Set();
    let currentRow = 0;
    let currentCol = 0;
    const allItemCells = [];
    
    items.forEach(item => {
        if (!item) return; // 跳过空物品
        
        const [width, height] = item.size;
        let placed = false;
        
        while (!placed && currentRow <= appState.gridSize - height) {
            let canPlace = true;
            const cellsToOccupy = [];
            
            for (let r = currentRow; r < currentRow + height; r++) {
                for (let c = currentCol; c < currentCol + width; c++) {
                    if (c >= appState.gridSize || occupiedCells.has(`${r},${c}`)) {
                        canPlace = false;
                        break;
                    }
                    cellsToOccupy.push({r, c});
                }
                if (!canPlace) break;
            }
            
            if (canPlace) {
                cellsToOccupy.forEach(({r, c}) => occupiedCells.add(`${r},${c}`));
                
                const minRow = Math.min(...cellsToOccupy.map(c => c.r));
                const maxRow = Math.max(...cellsToOccupy.map(c => c.r));
                const minCol = Math.min(...cellsToOccupy.map(c => c.c));
                const maxCol = Math.max(...cellsToOccupy.map(c => c.c));
                
                const cellPercent = 100 / appState.gridSize;
                const itemWidth = (maxCol - minCol + 1) * cellPercent - (appState.itemSpacing * 2);
                const itemHeight = (maxRow - minRow + 1) * cellPercent - (appState.itemSpacing * 2);
                const itemLeft = minCol * cellPercent + appState.itemSpacing;
                const itemTop = minRow * cellPercent + appState.itemSpacing;
                
                const placeholder = document.createElement('div');
                placeholder.className = 'placeholder-item absolute transition-all duration-300';
                placeholder.style.width = `${itemWidth}%`;
                placeholder.style.height = `${itemHeight}%`;
                placeholder.style.left = `${itemLeft}%`;
                placeholder.style.top = `${itemTop}%`;
                
                gridContainer.appendChild(placeholder);
                
                allItemCells.push({
                    item,
                    cells: cellsToOccupy,
                    minRow,
                    maxRow,
                    minCol,
                    maxCol,
                    width: itemWidth,
                    height: itemHeight,
                    left: itemLeft,
                    top: itemTop,
                    placeholder
                });
                
                currentCol += width;
                if (currentCol > appState.gridSize - 1) {
                    currentCol = 0;
                    currentRow++;
                }
                
                placed = true;
            } else {
                currentRow++;
                currentCol = 0;
            }
        }
    });
    
    return allItemCells;
}

function readItemsInOrder(items, allItemCells) {
    let totalDelay = 0;
    
    allItemCells.forEach((itemData, index) => {
        const { 
            item, 
            cells, 
            width, 
            height, 
            left, 
            top,
            placeholder
        } = itemData;
        if (!item) return;
        
        const [sizeWidth, sizeHeight] = item.size;
        
        setTimeout(() => {
            const magnifierContainer = document.createElement('div');
            magnifierContainer.className = 'magnifier-track';
            magnifierContainer.style.left = `${left}%`;
            magnifierContainer.style.top = `${top}%`;
            magnifierContainer.style.width = `${width}%`;
            magnifierContainer.style.height = `${height}%`;
            
            const magnifier = document.createElement('i');
            magnifier.className = 'magnifier fa fa-search';
            magnifier.style.left = '50%';
            magnifier.style.top = '50%';
            magnifierContainer.appendChild(magnifier);
            gridContainer.appendChild(magnifierContainer);
            
            setTimeout(() => {
                magnifierContainer.remove();
                
                if (placeholder && placeholder.parentNode === gridContainer) {
                    gridContainer.removeChild(placeholder);
                }
                
                const itemElement = document.createElement('div');
                // 添加跳动动画类名：item-pop-in
                itemElement.className = `absolute bg-${item.color} item-gradient rounded-sm transition-all duration-500 cursor-pointer overflow-hidden item-pop-in`;
                itemElement.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="item-image">
                    <div class="item-name">${item.name}</div>
                `;
                
                itemElement.style.width = `${width}%`;
                itemElement.style.height = `${height}%`;
                itemElement.style.left = `${left}%`;
                itemElement.style.top = `${top}%`;
                
                // 非洲之心添加特殊闪烁效果
                if (item.name === '非洲之心') {
                    itemElement.classList.add('special-item-pulse');
                }
                
                itemElement.addEventListener('click', () => {
                    showItemDetail(item);
                });
                
                gridContainer.appendChild(itemElement);
                
                // 触发跳动动画
                setTimeout(() => {
                    itemElement.style.transform = 'scale(1)';
                }, 50);
                
            }, colorDelays[item.color] * 1000);
        }, totalDelay);
        
        totalDelay += colorDelays[item.color] * 1000;
    });
}

// 一键抽取功能
function initBatchDrawSettings() {
    // 容器类型选择
    containerTypeList.addEventListener('click', (e) => {
        const containerItem = e.target.closest('.container-item:not(.disabled)');
        if (!containerItem) return;
        
        containerItems.forEach(item => item.classList.remove('active'));
        containerItem.classList.add('active');
        appState.currentContainerType = containerItem.dataset.type;
    });
    
    // 默认选中大容器
    const defaultContainer = containerTypeList.querySelector('[data-type="large"]');
    if (defaultContainer) {
        defaultContainer.classList.add('active');
    }
    
    // 搜索功能
    stopConditionSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredItems = appState.allItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
        renderStopConditionItems(filteredItems);
    });
    
    // 初始渲染所有物品
    renderStopConditionItems(appState.allItems);
    
    // 取消全选
    deselectAllBtn.addEventListener('click', () => {
        appState.selectedStopItems.clear();
        const checkboxes = stopConditionContainer.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    });
    
    // 滑动多选开关
    slideSelectToggle.addEventListener('change', (e) => {
        appState.isSlideSelecting = e.target.checked;
    });
    
    // 最大次数按钮
    maxCountBtn.addEventListener('click', () => {
        drawCountInput.value = 10000;
    });
    
    // 开始一键抽取
    startBatchBtn.addEventListener('click', startBatchDraw);
    
    // 关闭结果弹窗
    closeBatchResultBtn.addEventListener('click', () => {
        batchResultModal.classList.remove('active');
    });
    
    closeBatchBtn.addEventListener('click', () => {
        batchResultModal.classList.remove('active');
    });
    
    batchResultModal.querySelector('.modal-backdrop').addEventListener('click', () => {
        batchResultModal.classList.remove('active');
    });
}

// 渲染停止条件物品列表
function renderStopConditionItems(itemsList) {
    stopConditionContainer.innerHTML = '';
    
    itemsList.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `flex items-center p-2 rounded bg-primary/50 relative ${appState.selectedStopItems.has(item.name) ? 'bg-highlight/20' : ''}`;
        itemElement.innerHTML = `
            <div class="record-icon bg-${item.color}/30 text-white rounded-full mr-2 overflow-hidden">
                <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain">
            </div>
            <span class="truncate">${item.name}</span>
            <input type="checkbox" class="item-checkbox" data-item="${item.name}" ${appState.selectedStopItems.has(item.name) ? 'checked' : ''}>
            <label for="${item.name}"></label>
        `;
        
        const checkbox = itemElement.querySelector('.item-checkbox');
        checkbox.id = item.name;
        
        // 点击项目选中/取消选中
        itemElement.addEventListener('click', (e) => {
            if (e.target === checkbox || e.target.tagName === 'LABEL') return;
            
            checkbox.checked = !checkbox.checked;
            toggleStopItemSelection(item.name, checkbox.checked);
            
            // 滑动多选逻辑
            if (appState.isSlideSelecting) {
                if (appState.lastSelectedItem !== null) {
                    // 实现滑动多选逻辑
                    const allItems = Array.from(stopConditionContainer.querySelectorAll('.item-checkbox'));
                    const currentIndex = allItems.findIndex(el => el.dataset.item === item.name);
                    const lastIndex = allItems.findIndex(el => el.dataset.item === appState.lastSelectedItem);
                    
                    if (currentIndex !== -1 && lastIndex !== -1) {
                        const start = Math.min(currentIndex, lastIndex);
                        const end = Math.max(currentIndex, lastIndex);
                        
                        for (let i = start; i <= end; i++) {
                            const itemToSelect = allItems[i];
                            itemToSelect.checked = true;
                            toggleStopItemSelection(itemToSelect.dataset.item, true);
                        }
                    }
                }
                appState.lastSelectedItem = item.name;
            } else {
                appState.lastSelectedItem = null;
            }
        });
        
        checkbox.addEventListener('change', (e) => {
            toggleStopItemSelection(e.target.dataset.item, e.target.checked);
        });
        
        stopConditionContainer.appendChild(itemElement);
    });
}

// 切换停止条件物品选择状态
function toggleStopItemSelection(itemName, isSelected) {
    if (isSelected) {
        appState.selectedStopItems.add(itemName);
        const itemElement = stopConditionContainer.querySelector(`[data-item="${itemName}"]`).closest('div');
        if (itemElement) itemElement.classList.add('bg-highlight/20');
    } else {
        appState.selectedStopItems.delete(itemName);
        const itemElement = stopConditionContainer.querySelector(`[data-item="${itemName}"]`).closest('div');
        if (itemElement) itemElement.classList.remove('bg-highlight/20');
    }
}

function startBatchDraw() {
    if (appState.isBatchDrawing) return;
    
    // 检查当前容器数据是否已加载
    if (!appState.dataLoaded[appState.currentContainerType]) {
        showToast('容器数据加载中，请稍后');
        return;
    }
    
    const drawCount = parseInt(drawCountInput.value);
    if (isNaN(drawCount) || drawCount < 1 || drawCount > 10000) {
        showToast('请输入1-10000之间的数字');
        return;
    }
    
    appState.isBatchDrawing = true;
    startBatchBtn.disabled = true;
    startBatchBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> 抽取中...';
    
    // 显示进度条
    batchProgressContainer.style.display = 'block';
    batchProgressBar.style.width = '0%';
    
    // 执行批量抽取
    performBatchDraw(appState.currentContainerType, drawCount);
}

async function performBatchDraw(containerType, totalDraws) {
    const results = {};
    let stopReason = '达到指定次数';
    let completedDraws = 0;
    let foundTargetItems = [];
    let targetItemTotalCount = 0;
    appState.lastDrawItems = []; // 重置最后一次抽取的物品
    
    // 获取当前容器的物品池
    const itemPool = getCurrentContainerItemPool();
    if (!itemPool || itemPool.length === 0) {
        showToast('无法获取容器物品数据');
        appState.isBatchDrawing = false;
        startBatchBtn.disabled = false;
        startBatchBtn.innerHTML = '<i class="fa fa-play mr-2"></i> 开始一键抽取';
        batchProgressContainer.style.display = 'none';
        return;
    }
    
    // 初始化结果对象
    itemPool.forEach(item => {
        results[item.name] = 0;
    });
    
    try {
        // 进行抽取
        for (let i = 0; i < totalDraws; i++) {
            if (!appState.isBatchDrawing) break;
            
            // 单次抽取
            const drawnItems = drawContainerItems(containerType);
            
            // 记录最后一次抽取的物品
            if (i === totalDraws - 1 || 
                (appState.selectedStopItems.size > 0 && 
                 ((stopOnAnyCheckbox.checked && drawnItems.some(item => appState.selectedStopItems.has(item.name))) ||
                  (!stopOnAnyCheckbox.checked && appState.selectedStopItems.size > 0 && 
                   Array.from(appState.selectedStopItems).every(itemName => 
                       results[itemName] > 0 || drawnItems.some(item => item.name === itemName)))))) {
                appState.lastDrawItems = [...drawnItems];
            }
            
            // 记录结果
            drawnItems.forEach(item => {
                if (!item) return;
                
                results[item.name]++;
                autoRecordItems([item]);
                
                // 检查是否满足停止条件
                if (appState.selectedStopItems.size > 0 && appState.selectedStopItems.has(item.name)) {
                    foundTargetItems.push(item.name);
                    targetItemTotalCount++;
                }
            });
            
            completedDraws++;
            
            // 更新进度
            const progress = Math.floor((completedDraws / totalDraws) * 100);
            batchProgressBar.style.width = `${progress}%`;
            
            // 检查是否需要提前停止
            if (appState.selectedStopItems.size > 0) {
                if (stopOnAnyCheckbox.checked && foundTargetItems.length > 0) {
                    stopReason = `抽中目标物品: ${foundTargetItems[0]}`;
                    break;
                } else if (!stopOnAnyCheckbox.checked) {
                    // 检查是否所有选中物品都已抽中
                    let allFound = true;
                    appState.selectedStopItems.forEach(itemName => {
                        if (results[itemName] === 0) {
                            allFound = false;
                        }
                    });
                    
                    if (allFound) {
                        stopReason = '所有目标物品已抽中';
                        break;
                    }
                }
            }
            
            // 每100次抽取暂停一下，避免UI冻结
            if (i % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
    } catch (error) {
        console.error('批量抽取出错:', error);
        stopReason = '抽取过程出错';
    } finally {
        // 完成后处理
        appState.isBatchDrawing = false;
        startBatchBtn.disabled = false;
        startBatchBtn.innerHTML = '<i class="fa fa-play mr-2"></i> 开始一键抽取';
        
        // 隐藏进度条
        batchProgressContainer.style.display = 'none';
        
        // 显示结果弹窗
        showBatchResults(containerType, completedDraws, results, stopReason, targetItemTotalCount);
        
        // 显示最后一次抽取的容器物品
        if (appState.lastDrawItems.length > 0) {
            setTimeout(() => {
                // 先关闭结果弹窗
                batchResultModal.classList.remove('active');
                
                // 显示最后一次抽取的物品
                appState.currentContainerType = containerType;
                unlockModal.classList.remove('hidden');
                
                // 设置标题和网格大小
                if (containerType === 'large') {
                    rewardTitle.textContent = '大保险容器物品清单';
                    appState.gridSize = 4;
                } else if (containerType === 'small') {
                    rewardTitle.textContent = '小保险容器物品清单';
                    appState.gridSize = 4;
                } else if (containerType === 'crocodile') {
                    rewardTitle.textContent = '鳄鱼巢穴物品清单';
                    appState.gridSize = 5;
                }
                appState.cellPercentage = 100 / appState.gridSize;
                
                generateGridLines();
                unlockScreen.classList.add('hidden');
                rewardScreen.classList.remove('hidden');
                
                // 直接显示最后一次抽取的物品
                appState.currentRewardItems = [...appState.lastDrawItems];
                const allItemCells = placeAllItemPlaceholders(appState.lastDrawItems);
                readItemsInOrder(appState.lastDrawItems, allItemCells);
                
                appState.isProcessingRewards = false;
            }, 1000);
        }
    }
}

function drawContainerItems(containerType) {
    let selectedItems = [];
    const itemPool = getCurrentContainerItemPool();
    
    if (!itemPool || itemPool.length === 0) {
        console.error(`获取${containerType}容器物品池失败`);
        return selectedItems;
    }
    
    if (containerType === 'crocodile') {
        // 鳄鱼巢穴抽取逻辑
        const itemCount = getRandomItemCount();
        
        // 复苏呼吸机特殊概率逻辑（0.1%）
        const resuscitationVentilator = itemPool.find(item => item.name === '复苏呼吸机');
        if (resuscitationVentilator && Math.random() < 0.001) {
            selectedItems.push({...resuscitationVentilator});
            return selectedItems;
        }
        
        // 按品质抽取物品
        for (let i = 0; i < itemCount; i++) {
            selectedItems.push(drawCrocodileNestItem(itemPool));
        }
    } else if (containerType === 'large') {
        // 大保险抽取逻辑
        let itemCount = getRandomItemCount();
        
        // 抽取非洲之心的特殊逻辑 (0.1%概率)
        const heartOfAfrica = itemPool.find(item => item.name === '非洲之心');
        let hasHeartOfAfrica = false;
        
        if (heartOfAfrica && Math.random() < 0.001) {
            hasHeartOfAfrica = true;
        }
        
        // 按品质抽取物品
        for (let i = 0; i < itemCount; i++) {
            // 随机决定是否在当前位置放置非洲之心（30%概率）
            if (hasHeartOfAfrica && Math.random() < 0.3) {
                selectedItems.push({...heartOfAfrica});
                hasHeartOfAfrica = false; // 确保只放置一次
                continue;
            }
            
            const random = Math.random();
            
            if (random < 0.30) {
                // 蓝色物品
                const blueItems = itemPool.filter(item => item.color === 'blue' && item.name !== '非洲之心');
                if (blueItems.length > 0) {
                    selectedItems.push({...blueItems[Math.floor(Math.random() * blueItems.length)]});
                }
            } else if (random < 0.60) {
                // 紫色物品
                const purpleItems = itemPool.filter(item => item.color === 'purple' && item.name !== '非洲之心');
                if (purpleItems.length > 0) {
                    selectedItems.push({...purpleItems[Math.floor(Math.random() * purpleItems.length)]});
                }
            } else if (random < 0.90) {
                // 金色物品
                const goldItems = itemPool.filter(item => item.color === 'gold' && item.name !== '非洲之心');
                if (goldItems.length > 0) {
                    selectedItems.push({...goldItems[Math.floor(Math.random() * goldItems.length)]});
                }
            } else {
                // 红色物品（不含非洲之心）
                const redItems = itemPool.filter(item => item.color === 'red' && item.name !== '非洲之心');
                if (redItems.length > 0) {
                    selectedItems.push({...redItems[Math.floor(Math.random() * redItems.length)]});
                }
            }
        }
        
        // 如果还没放置非洲之心，放在最后
        if (hasHeartOfAfrica) {
            selectedItems.push({...heartOfAfrica});
        }
    } else {
        // 小保险抽取逻辑
        const itemCount = getRandomItemCount();
        
        // 抽取非洲之心的特殊逻辑 (0.1%概率)
        const heartOfAfrica = itemPool.find(item => item.name === '非洲之心');
        
        if (heartOfAfrica && Math.random() < 0.001) {
            // 小容器中非洲之心有70%概率单独出现，30%概率与其他物品一起出现
            if (Math.random() < 0.7) {
                // 单独出现
                selectedItems.push({...heartOfAfrica});
            } else {
                // 与其他物品一起出现，随机位置
                const heartPosition = Math.floor(Math.random() * itemCount);
                
                for (let i = 0; i < itemCount; i++) {
                    if (i === heartPosition) {
                        selectedItems.push({...heartOfAfrica});
                    } else {
                        selectedItems.push(drawSmallContainerItem(itemPool));
                    }
                }
            }
        } else {
            // 正常抽取小保险物品
            for (let i = 0; i < itemCount; i++) {
                selectedItems.push(drawSmallContainerItem(itemPool));
            }
        }
    }
    
    return selectedItems;
}

function showBatchResults(containerType, totalDraws, results, stopReason, targetItemCount) {
    if (!batchResultModal) {
        console.error('批量结果弹窗元素不存在');
        return;
    }
    
    // 更新结果信息
    let containerName = '未知容器';
    if (containerType === 'large') containerName = '大保险';
    else if (containerType === 'small') containerName = '小保险';
    else if (containerType === 'crocodile') containerName = '鳄鱼巢穴';
    
    resultInsuranceType.textContent = containerName;
    resultTotalDraws.textContent = totalDraws;
    
    // 显示停止原因
    if (stopReason !== '达到指定次数') {
        resultStopReason.classList.remove('hidden');
        resultStopReasonText.textContent = stopReason;
    } else {
        resultStopReason.classList.add('hidden');
    }
    
    // 显示目标物品抽中次数
    if (appState.selectedStopItems.size > 0 && targetItemCount > 0) {
        resultTargetItemCount.classList.remove('hidden');
        resultTargetItemCount.querySelector('span').textContent = targetItemCount;
    } else {
        resultTargetItemCount.classList.add('hidden');
    }
    
    // 显示物品统计
    batchResultItems.innerHTML = '';
    
    // 按数量排序
    const sortedItems = Object.entries(results)
        .filter(([name, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);
    
    if (sortedItems.length === 0) {
        batchResultItems.innerHTML = '<div class="text-center text-gray-400 py-2">未抽中任何物品</div>';
    } else {
        sortedItems.forEach(([name, count]) => {
            const item = appState.allItems.find(i => i.name === name);
            if (!item) return;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center p-2 rounded';
            itemElement.innerHTML = `
                <div class="flex items-center">
                    <div class="record-icon bg-${item.color}/30 text-white rounded-full mr-2 overflow-hidden">
                        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain">
                    </div>
                    <span>${name}</span>
                </div>
                <span class="counter-badge bg-${item.color}/30 text-white rounded-full text-xs font-bold">
                    ${count}
                </span>
            `;
            
            batchResultItems.appendChild(itemElement);
        });
    }
    
    // 显示弹窗
    batchResultModal.classList.add('active');
    batchResultModal.style.zIndex = '9999';
}

// 导航功能
function setActiveNavItem(index) {
    navItems.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

navItems.forEach((item) => {
    // 为整个导航项添加点击事件，确保可点击区域覆盖整个元素
    item.addEventListener('click', () => {
        const viewId = item.dataset.view;
        
        // 隐藏所有视图
        viewSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // 显示对应视图
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        // 更新导航状态
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
    });
    
    // 确保图标和文字区域也能触发点击
    const icon = item.querySelector('i');
    const text = item.querySelector('span');
    
    if (icon) {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            item.click();
        });
    }
    
    if (text) {
        text.addEventListener('click', (e) => {
            e.stopPropagation();
            item.click();
        });
    }
});

// 显示提示信息
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 加载状态管理
function showLoading() {
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
}

function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
}

// 窗口事件
window.addEventListener('resize', adjustButtonPosition);
window.addEventListener('load', initApp);

// 关闭模态框时的全局处理
unlockModal.addEventListener('click', (e) => {
    // 点击背景关闭模态框
    if (e.target === unlockModal) {
        clearGridItems();
        unlockModal.classList.add('hidden');
        rewardScreen.classList.add('hidden');
        unlockScreen.classList.remove('hidden');
        appState.rewardsShown = false;
        appState.isProcessingRewards = false;
    }
});

// 阻止批量抽取时的页面滚动
document.addEventListener('keydown', (e) => {
    if (appState.isBatchDrawing && (e.key === 'Escape')) {
        if (confirm('确定要取消批量抽取吗？')) {
            appState.isBatchDrawing = false;
        }
    }
});
