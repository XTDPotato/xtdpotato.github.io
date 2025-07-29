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

const scrollCols = document.querySelectorAll('.scroll-container');
const scrollElements = [
    document.getElementById('scroll0'),
    document.getElementById('scroll1'),
    document.getElementById('scroll2'),
    document.getElementById('scroll3'),
    document.getElementById('scroll4')
];

let itemRecords = JSON.parse(localStorage.getItem('deltaContainerRecords')) || {};
let currentRewardItems = [];
let currentContainerType = 'large';
let isBatchDrawing = false;
let selectedStopItems = new Set();
let isProcessingRewards = false;
let lastDrawItems = []; // 存储最后一次抽取的物品
let isSlideSelecting = false;
let lastSelectedItem = null;

let currentColIndex = 0;
let progress = 0;
let progressTimer;
let unlockedCols = 0;
let isPaused = false;
let rewardsShown = false;
let scrollAnimations = [];
let lockedColumns = [];
let randomOffsets = [];
let targetPositions = [];
const visibleCharsCount = 5;
const middlePositionIndex = 2;
const charHeight = 32;
const selectionTolerance = 35;
let errorPauseTimer = null;
let redItemCount = 0;
let gridSize = 4; // 默认4x4
const cellPercentage = 100 / gridSize;
const itemSpacing = 2;

// 物品数据 - 使用图片路径代替图标
const items = [
    { name: '古怪的海盗银币', size: [1, 1], color: 'blue', image: 'delta/古怪的海盗银币.png', baseWeight: 1, description: '古老的阿萨拉海盗的银币，带有古怪气息。' },
    { name: '初级子弹生产零件', size: [1, 2], color: 'blue', image: 'delta/初级子弹生产零件.png', baseWeight: 1, description: '工具材料，一套精密的组件，用于制造可靠而高效的初级弹药。' },
    { name: '古老的海盗望远镜', size: [1, 2], color: 'blue', image: 'delta/古老的海盗望远镜.png', baseWeight: 1, description: '颇具年代感的望远镜。根据阿萨拉地方志记载，这种望远镜曾被阿萨拉卫队的祖先广泛使用。' },
    { name: '“起舞的女郎”挂饰', size: [1, 2], color: 'blue', image: 'delta/“起舞的女郎”挂饰.png', baseWeight: 1, description: '精致迷人的饰品，以优雅的舞姿和别致的设计捕捉人们的目光，为佩戴者带来独特的魅力与气质。' },
    { name: '海盗弯刀', size: [1, 1], color: 'purple', image: 'delta/海盗弯刀.png', baseWeight: 1, description: '海盗常用的近战武器' },
    { name: '后妃耳环', size: [1, 1], color: 'purple', image: 'delta/后妃耳环.png', baseWeight: 1, description: '古代后妃佩戴的珍贵饰品' },
    { name: '图腾箭矢', size: [1, 1], color: 'purple', image: 'delta/图腾箭矢.png', baseWeight: 1, description: '带有部落图腾的特殊箭矢' },
    { name: '阿萨拉风情水壶', size: [1, 2], color: 'purple', image: 'delta/阿萨拉风情水壶.png', baseWeight: 1, description: '具有阿萨拉地区特色的水壶' },
    { name: '阿萨拉特色酒壶', size: [1, 2], color: 'purple', image: 'delta/阿萨拉特色酒壶.png', baseWeight: 1, description: '阿萨拉地区传统工艺制作的酒壶' },
    { name: '阿萨拉特色提灯', size: [1, 2], color: 'purple', image: 'delta/阿萨拉特色提灯.png', baseWeight: 1, description: '阿萨拉地区传统工艺制作的提灯' },
    { name: '黄金饰章', size: [1, 2], color: 'purple', image: 'delta/黄金饰章.png', baseWeight: 1, description: '带有黄金装饰的身份标识' },
    { name: '犄角墙饰', size: [2, 1], color: 'purple', image: 'delta/犄角墙饰.png', baseWeight: 1, description: '用动物犄角制作的墙饰' },
    { name: '马赛克灯台', size: [2, 3], color: 'purple', image: 'delta/马赛克灯台.png', baseWeight: 1, description: '带有马赛克装饰的灯台' },
    { name: '仪典匕首', size: [3, 2], color: 'purple', image: 'delta/仪典匕首.png', baseWeight: 1, description: '用于仪式的特殊匕首' },
    { name: '阿萨拉特色酒杯', size: [1, 1], color: 'gold', image: 'delta/阿萨拉特色酒杯.png', baseWeight: 1, description: '阿萨拉地区制作的精美酒杯' },
    { name: '亮闪闪的海盗金币', size: [1, 1], color: 'gold', image: 'delta/亮闪闪的海盗金币.png', baseWeight: 1, description: '海盗藏匿的黄金货币' },
    { name: '功绩勋章', size: [1, 1], color: 'gold', image: 'delta/功绩勋章.png', baseWeight: 1, description: '表彰杰出功绩的勋章' },
    { name: '发条八音盒', size: [1, 1], color: 'gold', image: 'delta/发条八音盒.png', baseWeight: 1, description: '能演奏优美旋律的机械装置' },
    { name: '荷美尔陶俑', size: [1, 2], color: 'gold', image: 'delta/荷美尔陶俑.png', baseWeight: 1, description: '古代荷美尔文明的陶制人偶' },
    { name: '珠宝头冠', size: [3, 1], color: 'gold', image: 'delta/珠宝头冠.png', baseWeight: 1, description: '镶嵌宝石的华丽头冠' },
    { name: '金枝桂冠', size: [2, 1], color: 'gold', image: 'delta/金枝桂冠.png', baseWeight: 1, description: '黄金打造的象征荣誉的桂冠' },
    { name: '座钟', size: [2, 2], color: 'gold', image: 'delta/座钟.png', baseWeight: 1, description: '制作精美的台式时钟' },
    { name: '本地特色首饰', size: [3, 2], color: 'gold', image: 'delta/本地特色首饰.png', baseWeight: 1, description: '当地工艺制作的精美首饰' },
    { name: '名贵机械表', size: [1, 1], color: 'red', image: 'delta/名贵机械表.png', baseWeight: 1, description: '价值不菲的精密机械手表' },
    { name: '塞伊德的怀表', size: [1, 1], color: 'red', image: 'delta/塞伊德的怀表.png', baseWeight: 1, description: '塞伊德曾经拥有的怀表' },
    { name: '非洲之心', size: [1, 1], color: 'red', image: 'delta/非洲之心.png', rarity: 'rare', baseWeight: 1, description: '极其稀有的非洲之心' },
    { name: '万足金条', size: [1, 2], color: 'red', image: 'delta/万足金条.png', baseWeight: 1, description: '纯度极高的黄金条' },
    { name: '棘龙爪化石', size: [2, 1], color: 'red', image: 'delta/棘龙爪化石.png', baseWeight: 1, description: '远古棘龙的爪化石，极具研究价值' },
    { name: '黄金瞪羚', size: [2, 2], color: 'red', image: 'delta/黄金瞪羚.png', baseWeight: 1, description: '黄金打造的瞪羚雕像' },
    { name: '克劳迪乌斯半身像', size: [2, 3], color: 'red', image: 'delta/克劳迪乌斯半身像.png', baseWeight: 1, description: '克劳迪乌斯的半身雕像' },
    { name: '雷斯的留声机', size: [2, 3], color: 'red', image: 'delta/雷斯的留声机.png', baseWeight: 1, description: '雷斯曾经使用的留声机' },
    { name: '步战车模型', size: [3, 2], color: 'red', image: 'delta/步战车模型.png', baseWeight: 1, description: '精细制作的步战车模型' },
    { name: '军用雷达', size: [3, 3], color: 'red', image: 'delta/军用雷达.png', baseWeight: 1, description: '军用级别的雷达设备' },
    { name: '滑膛枪展品', size: [4, 1], color: 'red', image: 'delta/滑膛枪展品.png', baseWeight: 1, description: '滑膛枪展品' },
    { name: '军用信息终端', size: [3, 2], color: 'red', image: 'delta/军用信息终端.png', baseWeight: 1, description: '军用规格的信息处理终端' },
    { name: '藏秘筒', size: [1, 1], color: 'gold', image: 'delta/藏秘筒.png', baseWeight: 1, description: '用于藏匿秘密信息的特殊容器' }
];

// 小保险容器物品列表
const smallContainerItems = items.filter(item => 
    !['显卡'].includes(item.name)
);

// 大保险容器物品列表 - 不含军用雷达和军用信息终端
const largeContainerItems = items.filter(item => 
    !['显卡', '军用雷达', '军用信息终端'].includes(item.name)
);

// 鳄鱼窝容器物品列表（开发中）
const crocodileNestItems = [];

// 核心功能函数
function getRandomItemCount() {
    if (currentContainerType === 'small') {
        const random = Math.random();
        if (random < 0.4) return 1;
        if (random < 0.8) return 2;
        return 3;
    }
    
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
    scrollElements.forEach((el, index) => {
        const col = scrollCols[index];
        const chars = col.dataset.chars.split(',');
        const target = col.dataset.target;
        
        const targetPos = chars.indexOf(target);
        targetPositions[index] = targetPos;
        
        const randomOffset = Math.floor(Math.random() * chars.length);
        randomOffsets[index] = randomOffset;
        
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
        
        const initialOffset = randomOffset * charHeight;
        el.style.transform = `translateY(-${initialOffset}px)`;
        el.style.transition = 'transform 0.3s ease-out';
        
        const animation = el.animate(
            [
                { transform: `translateY(-${initialOffset}px)` },
                { transform: `translateY(-${initialOffset + chars.length * charHeight}px)` }
            ],
            {
                duration: 1000,
                iterations: Infinity,
                easing: 'linear'
            }
        );
        
        animation.play();
        scrollAnimations[index] = animation;
    });
    
    highlightActiveColumn();
}

function highlightActiveColumn() {
    scrollCols.forEach(col => col.classList.remove('active-column'));
    scrollCols[currentColIndex].classList.add('active-column');
}

function generateGridLines() {
    gridLines.innerHTML = '';
    
    for (let i = 1; i < gridSize; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line';
        line.style.height = '1px';
        line.style.width = '100%';
        line.style.top = `${i * (100 / gridSize)}%`;
        gridLines.appendChild(line);
    }
    
    for (let i = 1; i < gridSize; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line';
        line.style.width = '1px';
        line.style.height = '100%';
        line.style.left = `${i * (100 / gridSize)}%`;
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
    if (isProcessingRewards) {
        showToast('请等待当前物品加载完成');
        return;
    }
    
    currentContainerType = containerType;
    unlockModal.classList.remove('hidden');
    
    rewardTitle.textContent = containerType === 'large' ? '大保险容器物品清单' : '小保险容器物品清单';
    
    gridSize = 4; // 大保险和小保险均为4x4
    
    resetUnlockState();
    
    setTimeout(adjustButtonPosition, 100);
}

function openSmallContainerDirectly() {
    if (isProcessingRewards) {
        showToast('请等待当前物品加载完成');
        return;
    }
    
    currentContainerType = 'small';
    unlockModal.classList.remove('hidden');
    
    rewardTitle.textContent = '小保险容器物品清单';
    
    gridSize = 4; // 小保险4x4
    
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

// 鳄鱼窝容器点击事件（开发中）
crocodileNest.addEventListener('click', () => {
    showToast('鳄鱼窝容器正在开发中，敬请期待');
});

closeBtn.addEventListener('click', () => {
    clearGridItems();
    
    unlockModal.classList.add('hidden');
    rewardScreen.classList.add('hidden');
    unlockScreen.classList.remove('hidden');
    rewardsShown = false;
    redItemCount = 0;
    currentRewardItems = [];
    selectButton.querySelector('span').textContent = '选定密码';
    isProcessingRewards = false;
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
    
    if (Object.keys(itemRecords).length === 0) {
        showToast('没有记录可清空');
        return;
    }
    
    if (confirm('确定要清空所有物品记录吗？')) {
        itemRecords = {};
        
        localStorage.removeItem('deltaContainerRecords');
        localStorage.setItem('deltaContainerRecords', JSON.stringify(itemRecords));
        
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
    
    progress = 100;
    updateProgressBar();
    
    selectButton.querySelector('span').textContent = '解锁完成';
    
    setTimeout(() => {
        showRewards();
    }, 800);
});

// 物品记录相关函数
function renderItemRecords() {
    recordsContainer.innerHTML = '';
    
    const recordsList = Object.values(itemRecords)
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
        
        if (itemRecords[itemId]) {
            itemRecords[itemId].count++;
        } else {
            itemRecords[itemId] = {
                ...item,
                count: 1
            };
        }
    });
    
    localStorage.setItem('deltaContainerRecords', JSON.stringify(itemRecords));
    
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
    
    if (rewardsShown) return;
    
    if (isPaused) {
        clearTimeout(errorPauseTimer);
    }
    
    const currentCol = scrollCols[currentColIndex];
    const targetChar = currentCol.dataset.target;
    const chars = currentCol.dataset.chars.split(',');
    const charCount = chars.length;
    const randomOffset = randomOffsets[currentColIndex];
    
    const animation = scrollAnimations[currentColIndex];
    const progress = animation.currentTime / animation.effect.getTiming().duration;
    
    const totalScrollDistance = charCount * charHeight;
    const currentPixelPosition = (progress * totalScrollDistance + randomOffset * charHeight) % totalScrollDistance;
    
    const visibleAreaStart = currentPixelPosition;
    const boxCharPosition = visibleAreaStart + middlePositionIndex * charHeight;
    const boxCharIndex = Math.floor(boxCharPosition / charHeight) % charCount;
    const boxChar = chars[boxCharIndex];
    
    const targetPixelPosition = (targetPositions[currentColIndex] * charHeight) % totalScrollDistance;
    let pixelDiff = Math.abs(currentPixelPosition - targetPixelPosition);
    pixelDiff = Math.min(pixelDiff, totalScrollDistance - pixelDiff);
    
    animation.pause();
    isPaused = true;
    
    if (boxChar === targetChar || pixelDiff <= selectionTolerance) {
        selectButton.classList.add('complete-animation', 'bg-green/30');
        
        setTimeout(() => {
            const targetOffset = (targetPositions[currentColIndex] - randomOffset + charCount) % charCount * charHeight;
            scrollElements[currentColIndex].style.transform = `translateY(-${targetOffset}px)`;
            
            const charElements = scrollElements[currentColIndex].querySelectorAll('div');
            charElements.forEach(el => el.classList.remove('char-scale'));
            
            const targetCharIndex = chars.length + targetPositions[currentColIndex];
            charElements[targetCharIndex].classList.add('char-scale', 'center-char');
            
            currentCol.classList.add('bg-gray-700/60', 'final-highlight');
            
            animation.cancel();
            
            unlockedCols++;
            lockedColumns.push(currentColIndex);
            
            selectButton.classList.remove('complete-animation', 'bg-green/30');
            
            const nextCol = parseInt(currentCol.dataset.next);
            if (nextCol < 5) {
                currentColIndex = nextCol;
                isPaused = false;
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
        
        errorPauseTimer = setTimeout(() => {
            currentCol.classList.remove('error-highlight');
            selectButton.classList.remove('error-highlight');
            
            animation.play();
            isPaused = false;
        }, 1000);
    }
});

// 辅助函数
function stopAllAnimations() {
    scrollAnimations.forEach(animation => {
        if (animation) {
            animation.cancel();
        }
    });
    
    clearInterval(progressTimer);
    
    document.querySelectorAll('.pulse, .progress-shine').forEach(el => {
        el.style.animationPlayState = 'paused';
    });
}

function forceAllColumnsToTarget() {
    scrollCols.forEach((col, index) => {
        if (lockedColumns.includes(index)) return;
        
        const chars = col.dataset.chars.split(',');
        const charCount = chars.length;
        const randomOffset = randomOffsets[index];
        
        const targetOffset = (targetPositions[index] - randomOffset + charCount) % charCount * charHeight;
        scrollElements[index].style.transform = `translateY(-${targetOffset}px)`;
        
        if (scrollAnimations[index]) {
            scrollAnimations[index].cancel();
        }
        
        const charElements = scrollElements[index].querySelectorAll('div');
        const targetCharIndex = chars.length + targetPositions[index];
        charElements[targetCharIndex].classList.add('center-char');
        
        col.classList.add('bg-gray-700/60', 'final-highlight');
    });
}

function updateProgressBar() {
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
}

function resetUnlockState() {
    clearTimeout(errorPauseTimer);
    
    progress = 0;
    currentColIndex = 0;
    unlockedCols = 0;
    isPaused = false;
    rewardsShown = false;
    lockedColumns = [];
    randomOffsets = [];
    targetPositions = [];
    redItemCount = 0;
    currentRewardItems = [];
    updateProgressBar();
    
    scrollCols.forEach((col, index) => {
        col.classList.remove('error-highlight', 'bg-gray-700/60', 'final-highlight', 'active-column');
        
        if (scrollAnimations[index]) {
            scrollAnimations[index].cancel();
        }
        scrollElements[index].style.transform = 'translateY(0)';
    });
    
    initScrollers();
    
    selectButton.classList.remove('complete-animation', 'bg-green/30', 'error-highlight');
    selectButton.querySelector('span').textContent = '选定密码';
    
    clearInterval(progressTimer);
    progressTimer = setInterval(() => {
        if (rewardsShown) return;
        
        progress++;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressTimer);
            
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
    if (rewardsShown) return;
    
    clearInterval(progressTimer);
    progress = 100;
    updateProgressBar();
    
    forceAllColumnsToTarget();
    
    showRewards();
}

function showRewards() {
    if (rewardsShown) return;
    rewardsShown = true;
    
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
    isProcessingRewards = true;
    
    clearGridItems();
    
    let selectedItems = [];
    
    if (currentContainerType === 'large') {
        let itemCount = getRandomItemCount();
        
        // 抽取非洲之心的特殊逻辑 (0.1%概率)
        const heartOfAfrica = largeContainerItems.find(item => item.name === '非洲之心');
        if (Math.random() < 0.001) {
            selectedItems.push({...heartOfAfrica});
            itemCount--;
        }
        
        // 按品质抽取其他物品
        for (let i = 0; i < itemCount; i++) {
            let selectedItem = null;
            const random = Math.random();
            
            // 品质概率：30%蓝，30%紫，30%金，10%红
            if (random < 0.30) {
                // 蓝色物品
                const blueItems = largeContainerItems.filter(item => item.color === 'blue' && item.name !== '非洲之心');
                selectedItem = blueItems[Math.floor(Math.random() * blueItems.length)];
            } else if (random < 0.60) {
                // 紫色物品
                const purpleItems = largeContainerItems.filter(item => item.color === 'purple' && item.name !== '非洲之心');
                selectedItem = purpleItems[Math.floor(Math.random() * purpleItems.length)];
            } else if (random < 0.90) {
                // 金色物品
                const goldItems = largeContainerItems.filter(item => item.color === 'gold' && item.name !== '非洲之心');
                selectedItem = goldItems[Math.floor(Math.random() * goldItems.length)];
            } else {
                // 红色物品（不含非洲之心）
                const redItems = largeContainerItems.filter(item => item.color === 'red' && item.name !== '非洲之心');
                selectedItem = redItems[Math.floor(Math.random() * redItems.length)];
            }
            
            if (selectedItem) {
                selectedItems.push({...selectedItem});
            }
        }
    } else {
        const itemCount = getRandomItemCount();
        
        // 抽取非洲之心的特殊逻辑 (0.1%概率)
        const heartOfAfrica = smallContainerItems.find(item => item.name === '非洲之心');
        if (Math.random() < 0.001 && itemCount > 0) {
            selectedItems.push({...heartOfAfrica});
            
            if (itemCount === 1) {
                // 只抽中非洲之心
            } else {
                // 继续抽取其他物品
                for (let i = 1; i < itemCount; i++) {
                    selectedItems.push(drawSmallContainerItem());
                }
            }
        } else {
            // 正常抽取小保险物品
            for (let i = 0; i < itemCount; i++) {
                selectedItems.push(drawSmallContainerItem());
            }
        }
    }
    
    // 保存最后一次抽取的物品
    lastDrawItems = [...selectedItems];
    
    currentRewardItems = [...selectedItems];
    
    autoRecordItems(currentRewardItems);
    
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
        isProcessingRewards = false;
    }, totalDelay + 1000);
}

// 小保险容器物品抽取（按品质概率）
function drawSmallContainerItem() {
    const random = Math.random();
    
    if (random < 0.30) {
        // 蓝色物品
        const blueItems = smallContainerItems.filter(item => item.color === 'blue' && item.name !== '非洲之心');
        return {...blueItems[Math.floor(Math.random() * blueItems.length)]};
    } else if (random < 0.60) {
        // 紫色物品
        const purpleItems = smallContainerItems.filter(item => item.color === 'purple' && item.name !== '非洲之心');
        return {...purpleItems[Math.floor(Math.random() * purpleItems.length)]};
    } else if (random < 0.90) {
        // 金色物品
        const goldItems = smallContainerItems.filter(item => item.color === 'gold' && item.name !== '非洲之心');
        return {...goldItems[Math.floor(Math.random() * goldItems.length)]};
    } else {
        // 红色物品（不含非洲之心）
        const redItems = smallContainerItems.filter(item => item.color === 'red' && item.name !== '非洲之心');
        return {...redItems[Math.floor(Math.random() * redItems.length)]};
    }
}

function placeAllItemPlaceholders(items) {
    const occupiedCells = new Set();
    let currentRow = 0;
    let currentCol = 0;
    const allItemCells = [];
    
    items.forEach(item => {
        const [width, height] = item.size;
        let placed = false;
        
        while (!placed && currentRow <= gridSize - height) {
            let canPlace = true;
            const cellsToOccupy = [];
            
            for (let r = currentRow; r < currentRow + height; r++) {
                for (let c = currentCol; c < currentCol + width; c++) {
                    if (c >= gridSize || occupiedCells.has(`${r},${c}`)) {
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
                
                const cellPercent = 100 / gridSize;
                const itemWidth = (maxCol - minCol + 1) * cellPercent - (itemSpacing * 2);
                const itemHeight = (maxRow - minRow + 1) * cellPercent - (itemSpacing * 2);
                const itemLeft = minCol * cellPercent + itemSpacing;
                const itemTop = minRow * cellPercent + itemSpacing;
                
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
                if (currentCol > gridSize - 1) {
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
                itemElement.className = `absolute bg-${item.color} item-gradient rounded-sm transition-all duration-500 cursor-pointer overflow-hidden`;
                itemElement.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="item-image">
                    <div class="item-name">${item.name}</div>
                `;
                
                itemElement.style.width = `${width}%`;
                itemElement.style.height = `${height}%`;
                itemElement.style.left = `${left}%`;
                itemElement.style.top = `${top}%`;
                
                itemElement.addEventListener('click', () => {
                    showItemDetail(item);
                });
                
                gridContainer.appendChild(itemElement);
            }, colorDelays[item.color] * 1000);
        }, totalDelay);
        
        totalDelay += colorDelays[item.color] * 1000;
    });
}

const colorDelays = {
    'default': 0.5,
    'green': 1,
    'blue': 1.5,
    'purple': 2,
    'gold': 2.5,
    'red': 3
};

// 一键抽取功能
function initBatchDrawSettings() {
    // 生成停止条件物品列表
    const uniqueItems = [...new Map(items.map(item => [item.name, item])).values()];
    renderStopConditionItems(uniqueItems);
    
    // 容器类型选择
    containerTypeList.addEventListener('click', (e) => {
        const containerItem = e.target.closest('.container-item:not(.disabled)');
        if (!containerItem) return;
        
        containerItems.forEach(item => item.classList.remove('active'));
        containerItem.classList.add('active');
        currentContainerType = containerItem.dataset.type;
    });
    
    // 搜索功能
    stopConditionSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredItems = items.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
        renderStopConditionItems(filteredItems);
    });
    
    // 取消全选
    deselectAllBtn.addEventListener('click', () => {
        selectedStopItems.clear();
        const checkboxes = stopConditionContainer.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    });
    
    // 滑动多选开关
    slideSelectToggle.addEventListener('change', (e) => {
        isSlideSelecting = e.target.checked;
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
        itemElement.className = `flex items-center p-2 rounded bg-primary/50 relative ${selectedStopItems.has(item.name) ? 'bg-highlight/20' : ''}`;
        itemElement.innerHTML = `
            <div class="record-icon bg-${item.color}/30 text-white rounded-full mr-2 overflow-hidden">
                <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain">
            </div>
            <span class="truncate">${item.name}</span>
            <input type="checkbox" class="item-checkbox" data-item="${item.name}" ${selectedStopItems.has(item.name) ? 'checked' : ''}>
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
            if (isSlideSelecting) {
                if (lastSelectedItem !== null) {
                    // 实现滑动多选逻辑
                    const allItems = Array.from(stopConditionContainer.querySelectorAll('.item-checkbox'));
                    const currentIndex = allItems.findIndex(el => el.dataset.item === item.name);
                    const lastIndex = allItems.findIndex(el => el.dataset.item === lastSelectedItem);
                    
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
                lastSelectedItem = item.name;
            } else {
                lastSelectedItem = null;
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
        selectedStopItems.add(itemName);
        const itemElement = stopConditionContainer.querySelector(`[data-item="${itemName}"]`).closest('div');
        if (itemElement) itemElement.classList.add('bg-highlight/20');
    } else {
        selectedStopItems.delete(itemName);
        const itemElement = stopConditionContainer.querySelector(`[data-item="${itemName}"]`).closest('div');
        if (itemElement) itemElement.classList.remove('bg-highlight/20');
    }
}

function startBatchDraw() {
    if (isBatchDrawing) return;
    
    const drawCount = parseInt(drawCountInput.value);
    if (isNaN(drawCount) || drawCount < 1 || drawCount > 10000) {
        showToast('请输入1-10000之间的数字');
        return;
    }
    
    isBatchDrawing = true;
    startBatchBtn.disabled = true;
    startBatchBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> 抽取中...';
    
    // 显示进度条
    batchProgressContainer.style.display = 'block';
    batchProgressBar.style.width = '0%';
    
    // 执行批量抽取
    performBatchDraw(currentContainerType, drawCount);
}

async function performBatchDraw(containerType, totalDraws) {
    const results = {};
    let stopReason = '达到指定次数';
    let completedDraws = 0;
    let foundTargetItems = [];
    let targetItemTotalCount = 0;
    lastDrawItems = []; // 重置最后一次抽取的物品
    
    // 初始化结果对象
    items.forEach(item => {
        results[item.name] = 0;
    });
    
    try {
        // 进行抽取
        for (let i = 0; i < totalDraws; i++) {
            if (!isBatchDrawing) break;
            
            // 单次抽取
            const drawnItems = drawContainerItems(containerType);
            
            // 记录最后一次抽取的物品
            if (i === totalDraws - 1 || 
                (selectedStopItems.size > 0 && 
                 ((stopOnAnyCheckbox.checked && drawnItems.some(item => selectedStopItems.has(item.name))) ||
                  (!stopOnAnyCheckbox.checked && selectedStopItems.size > 0 && 
                   Array.from(selectedStopItems).every(itemName => 
                       results[itemName] > 0 || drawnItems.some(item => item.name === itemName)))))) {
                lastDrawItems = [...drawnItems];
            }
            
            // 记录结果
            drawnItems.forEach(item => {
                results[item.name]++;
                autoRecordItems([item]);
                
                // 检查是否满足停止条件
                if (selectedStopItems.size > 0 && selectedStopItems.has(item.name)) {
                    foundTargetItems.push(item.name);
                    targetItemTotalCount++;
                }
            });
            
            completedDraws++;
            
            // 更新进度
            const progress = Math.floor((completedDraws / totalDraws) * 100);
            batchProgressBar.style.width = `${progress}%`;
            
            // 检查是否需要提前停止
            if (selectedStopItems.size > 0) {
                if (stopOnAnyCheckbox.checked && foundTargetItems.length > 0) {
                    stopReason = `抽中目标物品: ${foundTargetItems[0]}`;
                    break;
                } else if (!stopOnAnyCheckbox.checked) {
                    // 检查是否所有选中物品都已抽中
                    let allFound = true;
                    selectedStopItems.forEach(itemName => {
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
        isBatchDrawing = false;
        startBatchBtn.disabled = false;
        startBatchBtn.innerHTML = '<i class="fa fa-play mr-2"></i> 开始一键抽取';
        
        // 隐藏进度条
        batchProgressContainer.style.display = 'none';
        
        // 显示结果弹窗
        showBatchResults(containerType, completedDraws, results, stopReason, targetItemTotalCount);
        
        // 显示最后一次抽取的容器物品
        if (lastDrawItems.length > 0) {
            setTimeout(() => {
                // 先关闭结果弹窗
                batchResultModal.classList.remove('active');
                
                // 显示最后一次抽取的物品
                currentContainerType = containerType;
                unlockModal.classList.remove('hidden');
                
                rewardTitle.textContent = containerType === 'large' ? '大保险容器物品清单' : '小保险容器物品清单';
                gridSize = 4; // 大保险和小保险均为4x4
                
                generateGridLines();
                unlockScreen.classList.add('hidden');
                rewardScreen.classList.remove('hidden');
                
                // 直接显示最后一次抽取的物品
                currentRewardItems = [...lastDrawItems];
                const allItemCells = placeAllItemPlaceholders(lastDrawItems);
                readItemsInOrder(lastDrawItems, allItemCells);
                
                isProcessingRewards = false;
            }, 1000);
        }
    }
}

function drawContainerItems(containerType) {
    let selectedItems = [];
    currentContainerType = containerType;
    
    // 选择正确的物品池
    const itemPool = containerType === 'large' ? largeContainerItems : smallContainerItems;
    
    // 抽取非洲之心的特殊逻辑 (0.1%概率)
    const heartOfAfrica = itemPool.find(item => item.name === '非洲之心');
    if (Math.random() < 0.001) {
        selectedItems.push({...heartOfAfrica});
        return selectedItems;
    }
    
    if (containerType === 'large') {
        // 大保险抽取逻辑
        let itemCount = getRandomItemCount();
        
        // 按品质抽取物品
        for (let i = 0; i < itemCount; i++) {
            const random = Math.random();
            
            if (random < 0.30) {
                // 蓝色物品
                const blueItems = itemPool.filter(item => item.color === 'blue' && item.name !== '非洲之心');
                selectedItems.push({...blueItems[Math.floor(Math.random() * blueItems.length)]});
            } else if (random < 0.60) {
                // 紫色物品
                const purpleItems = itemPool.filter(item => item.color === 'purple' && item.name !== '非洲之心');
                selectedItems.push({...purpleItems[Math.floor(Math.random() * purpleItems.length)]});
            } else if (random < 0.90) {
                // 金色物品
                const goldItems = itemPool.filter(item => item.color === 'gold' && item.name !== '非洲之心');
                selectedItems.push({...goldItems[Math.floor(Math.random() * goldItems.length)]});
            } else {
                // 红色物品（不含非洲之心）
                const redItems = itemPool.filter(item => item.color === 'red' && item.name !== '非洲之心');
                selectedItems.push({...redItems[Math.floor(Math.random() * redItems.length)]});
            }
        }
    } else {
        // 小保险抽取逻辑
        const itemCount = getRandomItemCount();
        
        // 按品质抽取物品
        for (let i = 0; i < itemCount; i++) {
            selectedItems.push(drawSmallContainerItem());
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
    resultInsuranceType.textContent = containerType === 'large' ? '大保险' : '小保险';
    resultTotalDraws.textContent = totalDraws;
    
    // 显示停止原因
    if (stopReason !== '达到指定次数') {
        resultStopReason.classList.remove('hidden');
        resultStopReasonText.textContent = stopReason;
    } else {
        resultStopReason.classList.add('hidden');
    }
    
    // 显示目标物品抽中次数
    if (selectedStopItems.size > 0 && targetItemCount > 0) {
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
            const item = items.find(i => i.name === name);
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

// 窗口事件
window.addEventListener('resize', adjustButtonPosition);
window.addEventListener('load', () => {
    initScrollers();
    renderItemRecords();
    initBatchDrawSettings();
    
    // 初始化显示第一个视图
    viewSections[0].classList.add('active');
    navItems[0].classList.add('active');
});

// 关闭模态框时的全局处理
unlockModal.addEventListener('click', (e) => {
    // 点击背景关闭模态框
    if (e.target === unlockModal) {
        clearGridItems();
        unlockModal.classList.add('hidden');
        rewardScreen.classList.add('hidden');
        unlockScreen.classList.remove('hidden');
        rewardsShown = false;
        isProcessingRewards = false;
    }
});

// 阻止批量抽取时的页面滚动
document.addEventListener('keydown', (e) => {
    if (isBatchDrawing && (e.key === 'Escape')) {
        if (confirm('确定要取消批量抽取吗？')) {
            isBatchDrawing = false;
        }
    }
});
    