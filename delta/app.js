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
    // 原有物品
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
    { name: '藏秘筒', size: [1, 1], color: 'gold', image: 'delta/藏秘筒.png', baseWeight: 1, description: '用于藏匿秘密信息的特殊容器' },
    
    // 鳄鱼巢穴新增物品
    // 红色物品
    { name: "复苏呼吸机", size: [3, 3], color: "red", image: "delta/复苏呼吸机.png", rarity: "legendary", description: "高级生命支持设备，可在紧急情况下维持患者呼吸功能" },
    { name: "主战坦克模型", size: [3, 3], color: "red", image: "delta/主战坦克模型.png", description: "精细制作的主战坦克比例模型，具有收藏价值" },
    { name: "步战车模型", size: [3, 2], color: "red", image: "delta/步战车模型.png", description: "步战车的精致模型，细节还原度高" },
    { name: "量子存储", size: [1, 1], color: "red", image: "delta/量子存储.png", description: "采用量子技术的先进存储设备，容量巨大" },
    { name: "塞伊德的怀表", size: [1, 1], color: "red", image: "delta/塞伊德的怀表.png", description: "塞伊德的个人怀表，具有历史价值" },
    { name: "名贵机械表", size: [1, 1], color: "red", image: "delta/名贵机械表.png", description: "高端机械表，工艺精湛，价值不菲" },
    { name: "\"钻石\"鱼子酱", size: [1, 1], color: "red", image: "delta/\"钻石\"鱼子酱.png", description: "被称为\"钻石\"的顶级鱼子酱，极其稀有昂贵" },
    { name: "奥莉薇娅香槟", size: [1, 2], color: "red", image: "delta/奥莉薇娅香槟.png", description: "顶级奥莉薇娅品牌香槟，口感醇厚" },

    // 金色物品
    { name: "资料：设计图纸", size: [1, 1], color: "gold", image: "delta/资料：设计图纸.png", description: "包含重要设计信息的资料图纸" },
    { name: "纯金打火机", size: [1, 1], color: "gold", image: "delta/纯金打火机.png", description: "纯金打造的打火机，工艺精美" },
    { name: "阿萨拉特色酒杯", size: [1, 1], color: "gold", image: "delta/阿萨拉特色酒杯.png", description: "阿萨拉地区特色工艺酒杯" },
    { name: "体内除颤器", size: [1, 1], color: "gold", image: "delta/体内除颤器.png", description: "植入式体内除颤设备，可挽救心脏骤停患者" },
    { name: "燃料电池", size: [2, 4], color: "gold", image: "delta/燃料电池.png", description: "高效燃料电池，提供持久电力" },
    { name: "血氧仪", size: [1, 1], color: "gold", image: "delta/血氧仪.png", description: "检测血氧饱和度的便携式设备" },
    { name: "海盗金币", size: [1, 1], color: "gold", image: "delta/海盗金币.png", description: "古代海盗遗留的金币，具有收藏价值" },
    { name: "手机", size: [1, 1], color: "gold", image: "delta/手机.png", description: "智能手机，功能齐全" },
    { name: "卫星电话", size: [1, 2], color: "gold", image: "delta/卫星电话.png", description: "可在全球范围内通讯的卫星电话" },
    { name: "高速固态硬盘", size: [1, 1], color: "gold", image: "delta/高速固态硬盘.png", description: "高速读写的固态硬盘" },
    { name: "数码相机", size: [1, 1], color: "gold", image: "delta/数码相机.png", description: "高像素数码相机，拍摄效果出色" },
    { name: "CPU", size: [1, 1], color: "gold", image: "delta/CPU.png", description: "高性能中央处理器" },
    { name: "可编程处理器", size: [1, 1], color: "gold", image: "delta/可编程处理器.png", description: "可灵活编程的处理器，适用于多种场景" },
    { name: "咖啡", size: [1, 2], color: "gold", image: "delta/咖啡.png", description: "高品质咖啡豆，口感浓郁" },
    { name: "\"蓝宝石\"龙舌兰", size: [1, 2], color: "gold", image: "delta/\"蓝宝石\"龙舌兰.png", description: "名为\"蓝宝石\"的顶级龙舌兰酒" },
    { name: "心脏支架", size: [1, 2], color: "gold", image: "delta/心脏支架.png", description: "用于心脏手术的医疗支架" },
    { name: "军用望远镜", size: [2, 2], color: "gold", image: "delta/军用望远镜.png", description: "高倍率军用望远镜，视野清晰" },
    { name: "军用炸药", size: [2, 2], color: "gold", image: "delta/军用炸药.png", description: "军用级炸药，威力巨大" },

    // 紫色物品
    { name: "能量凝胶", size: [1, 1], color: "purple", image: "delta/能量凝胶.png", description: "提供快速能量补充的凝胶" },
    { name: "信号棒", size: [1, 1], color: "purple", image: "delta/信号棒.png", description: "发出强光信号的应急设备" },
    { name: "间谍笔", size: [1, 1], color: "purple", image: "delta/间谍笔.png", description: "伪装成钢笔的间谍设备" },
    { name: "GS5手柄", size: [1, 1], color: "purple", image: "delta/GS5手柄.png", description: "GS5游戏机专用手柄" },
    { name: "电子干扰器", size: [1, 1], color: "purple", image: "delta/电子干扰器.png", description: "便携式电子信号干扰设备" },
    { name: "柠檬茶", size: [1, 1], color: "purple", image: "delta/柠檬茶.png", description: "清爽的柠檬茶饮料" },
    { name: "资料：军事情报", size: [1, 1], color: "purple", image: "delta/资料：军事情报.png", description: "包含军事情报的机密资料" },
    { name: "植物样本", size: [1, 1], color: "purple", image: "delta/植物样本.png", description: "未知植物的样本，具有研究价值" },
    { name: "鳄鱼蛋", size: [1, 1], color: "purple", image: "delta/鳄鱼蛋.png", description: "新鲜的鳄鱼蛋，外壳坚硬" },
    { name: "鳄鱼血样", size: [1, 1], color: "purple", image: "delta/鳄鱼血样.png", description: "鳄鱼血液样本，用于研究" },
    { name: "后妃耳环", size: [1, 1], color: "purple", image: "delta/后妃耳环.png", description: "古代后妃佩戴的珍贵耳环" },
    { name: "固态硬盘", size: [1, 1], color: "purple", image: "delta/固态硬盘.png", description: "存储数据的固态存储设备" },
    { name: "内存条", size: [1, 1], color: "purple", image: "delta/内存条.png", description: "计算机内存模块" },
    { name: "海盗弯刀", size: [1, 1], color: "purple", image: "delta/海盗弯刀.png", description: "海盗使用的弯刀" },
    { name: "人工膝关节", size: [1, 2], color: "purple", image: "delta/人工膝关节.png", description: "用于替换手术的人工膝关节" },
    { name: "燃气喷灯", size: [1, 2], color: "purple", image: "delta/燃气喷灯.png", description: "用于加热或焊接的燃气喷灯" },
    { name: "粉碎钳", size: [1, 2], color: "purple", image: "delta/粉碎钳.png", description: "用于破拆的重型钳子" },
    { name: "阿萨拉卫队机密档案", size: [1, 2], color: "purple", image: "delta/阿萨拉卫队机密档案.png", description: "阿萨拉卫队的机密文件" },
    { name: "便携生存套件", size: [1, 2], color: "purple", image: "delta/便携生存套件.png", description: "包含多种生存工具的便携套件" },
    { name: "HIFI声卡", size: [2, 1], color: "purple", image: "delta/HIFI声卡.png", description: "高保真音频处理卡" },
    { name: "广角镜头", size: [2, 1], color: "purple", image: "delta/广角镜头.png", description: "相机用广角镜头" },
    { name: "专业声卡", size: [2, 1], color: "purple", image: "delta/专业声卡.png", description: "专业级音频处理设备" },
    { name: "收音机", size: [2, 1], color: "purple", image: "delta/收音机.png", description: "接收广播信号的设备" },
    { name: "军用露营灯", size: [1, 3], color: "purple", image: "delta/军用露营灯.png", description: "军用级别的露营照明设备" },

    // 蓝色物品
    { name: "继电器", size: [1, 1], color: "blue", image: "delta/继电器.png", description: "用于电路控制的继电器" },
    { name: "摄像头", size: [1, 1], color: "blue", image: "delta/摄像头.png", description: "用于拍摄的视频设备" },
    { name: "军用电源", size: [1, 1], color: "blue", image: "delta/军用电源.png", description: "军用规格的电源设备" },
    { name: "音频播放器", size: [1, 1], color: "blue", image: "delta/音频播放器.png", description: "播放音频文件的设备" },
    { name: "多用途电池", size: [1, 1], color: "blue", image: "delta/多用途电池.png", description: "可用于多种设备的电池" },
    { name: "高精数卡尺", size: [1, 1], color: "blue", image: "delta/高精数卡尺.png", description: "高精度测量工具" },
    { name: "维生素腾片", size: [1, 1], color: "blue", image: "delta/维生素腾片.png", description: "补充维生素的泡腾片" },
    { name: "蛋白粉包", size: [1, 1], color: "blue", image: "delta/蛋白粉包.png", description: "便携装蛋白质补充粉" },
    { name: "糖三角", size: [1, 1], color: "blue", image: "delta/糖三角.png", description: "传统面食，内有糖馅" },
    { name: "狩猎火柴", size: [1, 1], color: "blue", image: "delta/狩猎火柴.png", description: "防风防水的户外火柴" },
    { name: "低级燃料", size: [1, 1], color: "blue", image: "delta/低级燃料.png", description: "品质较低的燃料" },
    { name: "英式袋泡茶", size: [1, 1], color: "blue", image: "delta/英式袋泡茶.png", description: "英国风格的袋泡茶" },
    { name: "存储卡", size: [1, 1], color: "blue", image: "delta/存储卡.png", description: "用于存储数据的存储卡" },
    { name: "炒面", size: [1, 1], color: "blue", image: "delta/炒面.png", description: "速食炒面" },
    { name: "可乐", size: [1, 1], color: "blue", image: "delta/可乐.png", description: "碳酸饮料" },
    { name: "转换插座", size: [1, 1], color: "blue", image: "delta/转换插座.png", description: "多功能电源转换插座" },
    { name: "额温枪", size: [1, 1], color: "blue", image: "delta/额温枪.png", description: "测量体温的红外设备" },
    { name: "U盘", size: [1, 1], color: "blue", image: "delta/U盘.png", description: "便携式存储设备" },
    { name: "摩卡咖啡壶", size: [1, 2], color: "blue", image: "delta/摩卡咖啡壶.png", description: "制作摩卡咖啡的器具" },
    { name: "火药", size: [1, 2], color: "blue", image: "delta/火药.png", description: "用于爆炸物的化学物质" },
    { name: "情报文件", size: [1, 2], color: "blue", image: "delta/情报文件.png", description: "包含情报信息的文件" },
    { name: "军情录音", size: [1, 3], color: "blue", image: "delta/军情录音.png", description: "记录军事信息的录音" },
    { name: "电子显微镜", size: [1, 3], color: "blue", image: "delta/电子显微镜.png", description: "用于微观观察的电子设备" },
    { name: "骨锯", size: [3, 1], color: "blue", image: "delta/骨锯.png", description: "用于切割骨骼的医疗工具" },
    { name: "无线电钻", size: [2, 1], color: "blue", image: "delta/无线电钻.png", description: "充电式电钻工具" },
    { name: "木雕烟斗", size: [2, 1], color: "blue", image: "delta/木雕烟斗.png", description: "木质雕刻的烟斗" },
    { name: "芳纶纤维", size: [2, 1], color: "blue", image: "delta/芳纶纤维.png", description: "高强度合成纤维材料" },
    { name: "听诊器", size: [1, 2], color: "blue", image: "delta/听诊器.png", description: "医疗诊断用听诊设备" },
    { name: "电子温度计", size: [2, 2], color: "blue", image: "delta/电子温度计.png", description: "电子温度测量设备" },
    { name: "医疗无人机", size: [2, 2], color: "blue", image: "delta/医疗无人机.png", description: "用于医疗用途的无人机" },
    { name: "轻型户外炉具", size: [2, 2], color: "blue", image: "delta/轻型户外炉具.png", description: "便携的户外烹饪设备" },
    { name: "燃气罐", size: [2, 2], color: "blue", image: "delta/燃气罐.png", description: "储存燃气的容器" }
];

// 定义鳄鱼巢穴特有的物品列表
const crocodileExclusiveItems = [
    '复苏呼吸机', '主战坦克模型', '克劳迪乌斯半身像', '步战车模型', '量子存储', 
    '"钻石"鱼子酱', '奥莉薇娅香槟', '资料：设计图纸', '纯金打火机', '体内除颤器',
    '燃料电池', '血氧仪', '卫星电话', '高速固态硬盘', '可编程处理器', 
    '"蓝宝石"龙舌兰', '心脏支架', '军用望远镜', '军用炸药', '能量凝胶', 
    '信号棒', '间谍笔', 'GS5手柄', '电子干扰器', '柠檬茶', '资料：军事情报',
    '植物样本', '鳄鱼蛋', '鳄鱼血样', '固态硬盘', '内存条', '人工膝关节',
    '燃气喷灯', '粉碎钳', '阿萨拉卫队机密档案', '便携生存套件', 'HIFI声卡',
    '广角镜头', '专业声卡', '收音机', '军用露营灯', '继电器', '摄像头',
    '军用电源', '音频播放器', '多用途电池', '高精数卡尺', '维生素腾片',
    '蛋白粉包', '糖三角', '狩猎火柴', '低级燃料', '英式袋泡茶', '存储卡',
    '炒面', '可乐', '转换插座', '额温枪', 'U盘', '摩卡咖啡壶', '火药',
    '情报文件', '军情录音', '电子显微镜', '骨锯', '无线电钻', '木雕烟斗',
    '芳纶纤维', '听诊器', '电子温度计', '医疗无人机', '轻型户外炉具', '燃气罐'
];

// 小保险容器物品列表
// 不包含显卡和鳄鱼巢穴特有的物品
const smallContainerItems = items.filter(item => 
    !['显卡', ...crocodileExclusiveItems].includes(item.name)
);

// 大保险容器物品列表
// 不含军用雷达、军用信息终端和鳄鱼巢穴特有的物品
const largeContainerItems = items.filter(item => 
    !['显卡', '军用雷达', '军用信息终端', ...crocodileExclusiveItems].includes(item.name)
);

// 鳄鱼巢穴容器物品列表
// 只包含鳄鱼巢穴特有的物品
const crocodileNestItems = items.filter(item => 
    crocodileExclusiveItems.includes(item.name)
);
    

// 核心功能函数
function getRandomItemCount() {
    if (currentContainerType === 'small') {
        const random = Math.random();
        if (random < 0.4) return 1;
        if (random < 0.8) return 2;
        return 3;
    } else if (currentContainerType === 'crocodile') {
        // 鳄鱼巢穴物品数量概率分布
        const random = Math.random();
        if (random < 0.1) return 1;
        if (random < 0.2) return 2;
        if (random < 0.4) return 3;
        if (random < 0.6) return 4;
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
        gridSize = 5; // 鳄鱼巢穴使用5x5网格
    } else {
        gridSize = 4; // 大保险和小保险均为4x4
    }
    
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

// 新增：直接打开鳄鱼巢穴的函数
function openCrocodileNestDirectly() {
    if (isProcessingRewards) {
        showToast('请等待当前物品加载完成');
        return;
    }
    
    currentContainerType = 'crocodile';
    unlockModal.classList.remove('hidden');
    
    rewardTitle.textContent = '鳄鱼巢穴物品清单';
    
    gridSize = 5; // 鳄鱼巢穴使用5x5网格
    
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

// 鳄鱼巢穴容器点击事件 - 修改为直接打开
crocodileNest.addEventListener('click', () => {
    openCrocodileNestDirectly();
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
    const itemPool = getCurrentContainerItemPool();
    
    if (!itemPool || itemPool.length === 0) {
        console.error('未找到对应的物品池');
        isProcessingRewards = false;
        return;
    }
    
    // 根据容器类型生成不同的物品
    if (currentContainerType === 'crocodile') {
        // 鳄鱼巢穴物品生成逻辑
        const itemCount = getRandomItemCount();
        
        // 复苏呼吸机特殊概率逻辑（与非洲之心相同）
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
    } else if (currentContainerType === 'large') {
        // 大容器物品生成逻辑
        let itemCount = getRandomItemCount();
        
        // 抽取非洲之心的特殊逻辑 (0.1%概率)
        const heartOfAfrica = itemPool.find(item => item.name === '非洲之心');
        if (heartOfAfrica && Math.random() < 0.001) {
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
    } else {
        // 小容器物品生成逻辑
        const itemCount = getRandomItemCount();
        
        // 抽取非洲之心的特殊逻辑 (0.1%概率)
        const heartOfAfrica = itemPool.find(item => item.name === '非洲之心');
        if (heartOfAfrica && Math.random() < 0.001 && itemCount > 0) {
            selectedItems.push({...heartOfAfrica});
            
            if (itemCount === 1) {
                // 只抽中非洲之心
            } else {
                // 继续抽取其他物品
                for (let i = 1; i < itemCount; i++) {
                    selectedItems.push(drawSmallContainerItem(itemPool));
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

// 获取当前容器类型对应的物品池
function getCurrentContainerItemPool() {
    switch(currentContainerType) {
        case 'large':
            return largeContainerItems;
        case 'small':
            return smallContainerItems;
        case 'crocodile':
            return crocodileNestItems;
        default:
            return largeContainerItems;
    }
}

// 鳄鱼巢穴物品抽取（按品质概率）
function drawCrocodileNestItem(itemPool) {
    const random = Math.random();
    
    // 鳄鱼巢穴的概率分布：40%蓝，30%紫，20%金，10%红
    if (random < 0.40) {
        // 蓝色物品
        const blueItems = itemPool.filter(item => item.color === 'blue' && item.name !== '复苏呼吸机');
        return {...blueItems[Math.floor(Math.random() * blueItems.length)]};
    } else if (random < 0.70) {
        // 紫色物品
        const purpleItems = itemPool.filter(item => item.color === 'purple' && item.name !== '复苏呼吸机');
        return {...purpleItems[Math.floor(Math.random() * purpleItems.length)]};
    } else if (random < 0.90) {
        // 金色物品
        const goldItems = itemPool.filter(item => item.color === 'gold' && item.name !== '复苏呼吸机');
        return {...goldItems[Math.floor(Math.random() * goldItems.length)]};
    } else {
        // 红色物品（不含复苏呼吸机，它有单独的抽取逻辑）
        const redItems = itemPool.filter(item => item.color === 'red' && item.name !== '复苏呼吸机');
        return {...redItems[Math.floor(Math.random() * redItems.length)]};
    }
}

// 小保险容器物品抽取（按品质概率）
function drawSmallContainerItem(itemPool) {
    const random = Math.random();
    
    if (random < 0.30) {
        // 蓝色物品
        const blueItems = itemPool.filter(item => item.color === 'blue' && item.name !== '非洲之心');
        return {...blueItems[Math.floor(Math.random() * blueItems.length)]};
    } else if (random < 0.60) {
        // 紫色物品
        const purpleItems = itemPool.filter(item => item.color === 'purple' && item.name !== '非洲之心');
        return {...purpleItems[Math.floor(Math.random() * purpleItems.length)]};
    } else if (random < 0.95) {
        // 金色物品
        const goldItems = itemPool.filter(item => item.color === 'gold' && item.name !== '非洲之心');
        return {...goldItems[Math.floor(Math.random() * goldItems.length)]};
    } else {
        // 红色物品（不含非洲之心）
        const redItems = itemPool.filter(item => item.color === 'red' && item.name !== '非洲之心');
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
                
                // 设置标题和网格大小
                if (containerType === 'large') {
                    rewardTitle.textContent = '大保险容器物品清单';
                    gridSize = 4;
                } else if (containerType === 'small') {
                    rewardTitle.textContent = '小保险容器物品清单';
                    gridSize = 4;
                } else if (containerType === 'crocodile') {
                    rewardTitle.textContent = '鳄鱼巢穴物品清单';
                    gridSize = 5;
                }
                
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
    const itemPool = containerType === 'large' ? largeContainerItems : 
                    containerType === 'small' ? smallContainerItems : 
                    crocodileNestItems;
    
    if (containerType === 'crocodile') {
        // 鳄鱼巢穴抽取逻辑
        const itemCount = getRandomItemCount();
        
        // 复苏呼吸机特殊概率逻辑（与非洲之心相同，0.1%）
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
        if (heartOfAfrica && Math.random() < 0.001) {
            selectedItems.push({...heartOfAfrica});
            return selectedItems;
        }
        
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
        
        // 抽取非洲之心的特殊逻辑 (0.1%概率)
        const heartOfAfrica = itemPool.find(item => item.name === '非洲之心');
        if (heartOfAfrica && Math.random() < 0.001) {
            selectedItems.push({...heartOfAfrica});
            return selectedItems;
        }
        
        // 按品质抽取物品
        for (let i = 0; i < itemCount; i++) {
            selectedItems.push(drawSmallContainerItem(itemPool));
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
