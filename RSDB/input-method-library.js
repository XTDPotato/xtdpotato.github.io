(function (global) {
    'use strict';

    const corpusData = global.RSDBInputMethodData || {};

    const domainEnglishWords = [
        'actual', 'add', 'align', 'all', 'amount', 'application', 'archive', 'area', 'automatic',
        'backup', 'batch', 'calculate', 'card', 'change', 'check', 'clear', 'close', 'column',
        'confirm', 'copy', 'current', 'custom', 'data', 'date', 'default', 'delete', 'density',
        'diameter', 'document', 'download', 'edit', 'empty', 'export', 'factory', 'field', 'file',
        'filter', 'finish', 'font', 'format', 'formula', 'furnace', 'hardness', 'height', 'history',
        'image', 'import', 'input', 'item', 'keyboard', 'length', 'list', 'load', 'manual',
        'material', 'menu', 'move', 'multiple', 'name', 'new', 'next', 'note', 'number', 'open',
        'operation', 'position', 'preview', 'previous', 'print', 'product', 'project', 'property',
        'quick', 'redo', 'replace', 'reset', 'result', 'row', 'save', 'search', 'select', 'selected',
        'setting', 'sheet', 'size', 'sort', 'status', 'steel', 'storage', 'style', 'system', 'table',
        'text', 'theme', 'total', 'undo', 'unit', 'update', 'upload', 'value', 'weight', 'width',
        'window', 'work', 'yes', 'zoom', 'accepted', 'active', 'adjust', 'advanced', 'after',
        'before', 'black', 'blue', 'bottom', 'cancel', 'cell', 'center', 'color', 'continue',
        'create', 'dark', 'decimal', 'device', 'dialog', 'display', 'duplicate', 'enabled', 'error',
        'excel', 'folder', 'green', 'highlight', 'information', 'language', 'light', 'local', 'mode',
        'offline', 'page', 'password', 'paste', 'record', 'remove', 'rename', 'restore', 'screen',
        'shortcut', 'source', 'success', 'surface', 'template', 'toolbar', 'warning', 'white',
        'english', 'chinese', 'pinyin', 'candidate', 'composition', 'phrase', 'full', 'double',
        'manufacture', 'production', 'inspection', 'inventory', 'warehouse', 'quality', 'quantity',
        'round', 'bar', 'heat', 'treatment', 'normalized', 'annealed', 'tempered', 'drawing',
        'machining', 'measured', 'nominal', 'tolerance', 'location', 'operator', 'remark', 'serial'
    ];
	const frequentEnglishWords = [...domainEnglishWords, ...(Array.isArray(corpusData.englishWords) ? corpusData.englishWords : [])];
	const comprehensiveEnglishWords = Array.isArray(corpusData.englishDictionaryWords)
	    ? corpusData.englishDictionaryWords.map(word => String(word || '').toLowerCase()).filter(Boolean)
	    : [];

    const domainPinyinCharacters = {
        a: '啊阿呵腌', ai: '爱哎矮挨碍艾', an: '安按案岸暗俺', ang: '昂盎', ao: '奥熬傲凹澳',
        ba: '把八吧巴拔爸罢', bai: '白百摆败拜', ban: '办半班般板版搬', bang: '帮棒邦榜绑', bao: '保报包宝抱暴薄',
        bei: '被北备背倍杯贝', ben: '本奔笨', beng: '崩甭泵蹦', bi: '比必笔毕避闭壁', bian: '边变便编遍扁',
        biao: '表标彪', bie: '别憋', bin: '宾滨彬', bing: '并病兵冰丙', bo: '波播博伯拨薄', bu: '不部步补布',
        ca: '擦', cai: '才采材财菜彩', can: '参残餐灿', cang: '仓藏舱', cao: '草操槽', ce: '测侧策册',
        cen: '岑', ceng: '层曾蹭', cha: '查差茶插察', chai: '拆柴', chan: '产缠禅铲', chang: '长常场厂唱昌',
        chao: '超朝潮炒', che: '车彻撤', chen: '陈沉晨尘称', cheng: '成城程称承乘', chi: '吃持尺迟赤齿',
        chong: '重充冲虫崇', chou: '抽愁丑筹', chu: '出处初除储触', chua: '欻', chuai: '揣', chuan: '传穿船串川',
        chuang: '床窗创', chui: '吹垂锤', chun: '春纯醇', chuo: '戳绰',
        ci: '此次词差刺', cong: '从总聪丛', cou: '凑', cu: '粗促醋', cuan: '窜攒', cui: '催脆翠', cun: '存村寸', cuo: '错措搓',
        da: '大打达答搭', dai: '带代待戴袋', dan: '但单担丹淡蛋', dang: '当党档挡荡', dao: '到道倒导刀',
        de: '的得德', dei: '得', deng: '等灯登邓', di: '地第低底滴', dian: '点电店典垫', diao: '调掉雕吊',
        die: '叠跌蝶', ding: '定订顶丁钉', diu: '丢', dong: '动东懂冬董', dou: '都斗豆抖', du: '度读独毒渡',
        duan: '段短断端', dui: '对队堆', dun: '顿吨盾', duo: '多夺朵躲',
        e: '额俄恶饿', ei: '诶', en: '恩', eng: '嗯', er: '二而儿耳',
        fa: '发法罚乏', fan: '反饭范翻返凡', fang: '方放房防访', fei: '非飞费肥废', fen: '分份粉奋纷',
        feng: '风封丰峰奉', fo: '佛', fou: '否', fu: '服复付父福负附',
        ga: '嘎', gai: '该改盖概', gan: '干感敢赶甘', gang: '钢刚港岗缸', gao: '高告稿搞', ge: '个各格哥割',
        gei: '给', gen: '根跟', geng: '更耕梗', gong: '工公共供功', gou: '够购构沟狗', gu: '故古顾股骨',
        gua: '挂刮瓜', guai: '怪拐乖', guan: '关管官观惯', guang: '光广逛', gui: '规归贵轨柜', gun: '滚棍', guo: '国过果锅',
        ha: '哈', hai: '还海孩害', han: '含汉汗寒韩', hang: '行航杭巷', hao: '好号毫豪', he: '和合河核何',
        hei: '黑', hen: '很恨痕', heng: '横衡恒', hong: '红宏洪烘', hou: '后候厚', hu: '户护湖乎互',
        hua: '化话花画华', huai: '坏怀淮', huan: '换环还欢缓', huang: '黄皇慌', hui: '会回汇灰挥', hun: '混婚魂', huo: '或活火货获',
        ji: '机几及级记计基', jia: '加家价架甲', jian: '件间建见检减', jiang: '将讲降江奖', jiao: '交较教叫角',
        jie: '接节解界结借', jin: '进金近今仅', jing: '经京精境警', jiong: '窘', jiu: '就九久旧酒', ju: '具局据句距',
        juan: '卷捐圈', jue: '决绝觉角', jun: '军均俊',
        ka: '卡', kai: '开凯', kan: '看刊砍', kang: '抗康扛', kao: '考靠烤', ke: '可科克刻客', ken: '肯啃', keng: '坑',
        kong: '空控孔', kou: '口扣', ku: '库苦酷', kua: '跨夸', kuai: '快块筷', kuan: '款宽', kuang: '况矿框', kui: '亏愧盔', kun: '困昆', kuo: '扩阔',
        la: '拉啦辣', lai: '来赖', lan: '栏蓝烂览', lang: '浪郎廊', lao: '老劳牢', le: '了乐勒', lei: '类累雷泪',
        leng: '冷愣', li: '里理力利立例', lia: '俩', lian: '连联练脸链', liang: '量两良亮辆', liao: '了料聊辽', lie: '列裂烈',
        lin: '林临邻淋', ling: '零另令领灵', liu: '六流留刘', long: '龙笼隆', lou: '楼漏', lu: '路录陆炉露',
        luan: '乱卵', lun: '论轮', luo: '落罗络裸', lv: '率绿旅吕', lve: '略掠',
        ma: '吗妈马码麻', mai: '买卖麦埋', man: '满慢漫', mang: '忙盲芒', mao: '毛冒帽猫', me: '么', mei: '没每美煤梅',
        men: '们门闷', meng: '梦猛盟蒙', mi: '米密迷秘', mian: '面棉免', miao: '秒苗妙', mie: '灭', min: '民敏', ming: '名明命',
        miu: '谬', mo: '模末磨默墨', mou: '某谋', mu: '目木母模',
        na: '那拿哪纳', nai: '乃奶耐', nan: '难南男', nang: '囊', nao: '脑闹', ne: '呢', nei: '内', nen: '嫩', neng: '能',
        ni: '你呢泥拟', nian: '年念粘', niang: '娘', niao: '鸟尿', nie: '捏聂', nin: '您', ning: '宁凝', niu: '牛扭', nong: '农浓弄',
        nou: '耨', nu: '怒努', nuan: '暖', nuo: '挪诺', nv: '女', nve: '虐',
        o: '哦噢', ou: '欧偶',
        pa: '怕爬趴', pai: '排派牌拍', pan: '盘判盼', pang: '旁胖', pao: '跑炮泡', pei: '配陪培', pen: '喷盆', peng: '碰朋鹏棚',
        pi: '皮批匹披', pian: '片篇偏', piao: '票飘漂', pie: '撇', pin: '品拼频', ping: '平评瓶屏', po: '破坡迫', pou: '剖', pu: '普铺扑谱',
        qi: '起其期器气七', qia: '恰卡', qian: '前千钱签浅', qiang: '强枪墙', qiao: '桥巧敲乔', qie: '切且', qin: '亲琴勤',
        qing: '请清情轻青', qiong: '穷琼', qiu: '求球秋', qu: '去取区曲', quan: '全权圈', que: '却确缺', qun: '群',
        ran: '然染燃', rang: '让嚷', rao: '绕扰', re: '热惹', ren: '人认任仁', reng: '仍扔', ri: '日', rong: '容荣融',
        rou: '肉柔', ru: '如入乳', ruan: '软', rui: '瑞锐', run: '润', ruo: '若弱',
        sa: '撒洒', sai: '赛塞', san: '三散伞', sang: '桑丧', sao: '扫骚', se: '色', sen: '森', seng: '僧', sha: '啥杀沙',
        shai: '晒筛', shan: '山闪善衫', shang: '上商尚伤', shao: '少绍烧', she: '设社射舍', shei: '谁', shen: '深身神审',
        sheng: '生省声升胜', shi: '是时事十使试', shou: '手收首受', shu: '数书输属术', shua: '刷耍', shuai: '率帅摔',
        shuan: '栓', shuang: '双霜', shui: '水谁税', shun: '顺瞬', shuo: '说硕',
        si: '四思司死丝', song: '送松宋', sou: '搜艘', su: '速素苏诉', suan: '算酸', sui: '随岁碎', sun: '孙损', suo: '所缩锁',
        ta: '他她它塔', tai: '太台态抬', tan: '谈探弹坦', tang: '堂唐糖躺', tao: '套讨逃', te: '特', teng: '疼腾', ti: '体提题替',
        tian: '天填田添', tiao: '条调跳', tie: '铁贴', ting: '听停庭', tong: '同通统桶', tou: '头投透', tu: '图土突途',
        tuan: '团', tui: '退推', tun: '吞屯', tuo: '托脱拖',
        wa: '哇挖瓦', wai: '外歪', wan: '完万晚弯', wang: '望王网往', wei: '为位未围维', wen: '文问温稳',
        weng: '翁', wo: '我握窝', wu: '无五物务误',
        xi: '系西细息喜习', xia: '下夏吓峡', xian: '现先线限显', xiang: '向相想项像', xiao: '小校笑效消',
        xie: '些写谢协鞋', xin: '新心信辛', xing: '行型性星兴', xiong: '雄兄胸', xiu: '修秀休', xu: '需许续序虚',
        xuan: '选宣旋', xue: '学雪血', xun: '寻讯训迅',
        ya: '呀压牙亚', yan: '研眼言验严', yang: '样阳养央', yao: '要药摇', ye: '也业页夜', yi: '一以已意易',
        yin: '因引音银', ying: '应英影营', yo: '哟', yong: '用永拥', you: '有又由右', yu: '与于预余语',
        yuan: '原元员远院', yue: '月越约阅', yun: '云运允',
        za: '杂砸', zai: '在再载', zan: '咱赞暂', zang: '脏藏', zao: '早造糟', ze: '则责', zei: '贼', zen: '怎', zeng: '增赠',
        zha: '查扎炸闸', zhai: '摘宅窄债', zhan: '站展占战', zhang: '张长章涨', zhao: '找照招赵', zhe: '这者着折',
        zhen: '真镇针震', zheng: '正整证争政', zhi: '之只知直制至', zhong: '中种重钟', zhou: '周州轴洲', zhu: '主住注助竹',
        zhua: '抓', zhuai: '拽', zhuan: '转专传赚', zhuang: '装状庄', zhui: '追坠', zhun: '准', zhuo: '着桌捉',
        zi: '子自字资', zong: '总宗综', zou: '走奏', zu: '组足租', zuan: '钻', zui: '最嘴', zun: '尊', zuo: '做作左座'
    };
	const pinyinCharacters = { ...(corpusData.pinyinCharacters || {}) };
	Object.entries(domainPinyinCharacters).forEach(([code, priorityCharacters]) => {
	    const seen = new Set();
	    pinyinCharacters[code] = Array.from(`${priorityCharacters}${pinyinCharacters[code] || ''}`)
	        .filter(character => !seen.has(character) && seen.add(character))
	        .join('');
	});

    const domainPinyinPhrases = {
        nihao: ['你好'], shide: ['是的'], haode: ['好的'], duide: ['对的'], xiexie: ['谢谢'], zaijian: ['再见'], qingwen: ['请问'], qingshuru: ['请输入'], fanshu: ['番薯'],
        zhongwen: ['中文'], zhongguo: ['中国'], hanyu: ['汉语'], pinyin: ['拼音'], quanpin: ['全拼'],
        shuangpin: ['双拼'], sanpin: ['三拼'], shurufa: ['输入法'], xunijianpan: ['虚拟键盘'],
        yingwen: ['英文'], yingyong: ['应用'], shezhi: ['设置'], baocun: ['保存'], lingcunwei: ['另存为'],
        shuju: ['数据'], shujubiao: ['数据表'], biaoge: ['表格'], danyuange: ['单元格'], shuxing: ['属性'],
        geshi: ['格式'], ziti: ['字体'], yanse: ['颜色'], tianchongyanse: ['填充颜色'], zitiyanse: ['字体颜色'],
        duiqifangshi: ['对齐方式'], zuoduiqi: ['左对齐'], juzhong: ['居中'], youduiqi: ['右对齐'],
        wenben: ['文本'], neirong: ['内容'], beizhu: ['备注'], zhuangtai: ['状态'], weizhi: ['位置'],
        chanpin: ['产品'], chanpinhao: ['产品号'], kapian: ['卡片'], kapianhao: ['卡片号'], luhao: ['炉号'],
        gangzhong: ['钢种'], zhijing: ['直径'], shijizhijing: ['实际直径'], changdu: ['长度'], zhongliang: ['重量'],
        yingdu: ['硬度'], midu: ['密度'], gongshi: ['公式'], jisuan: ['计算'], jisuanjieguo: ['计算结果'],
        tianjia: ['添加'], tianjiashuju: ['添加数据'], bianji: ['编辑'], bianjishuju: ['编辑数据'],
        kuaijie: ['快捷'], kuaijiebianji: ['快捷编辑'], shanchu: ['删除'], shanchushuju: ['删除数据'], shanchushuxing: ['删除属性'],
        sousuo: ['搜索'], tihuan: ['替换'], dakai: ['打开'], daochu: ['导出'], daoru: ['导入'],
        yulan: ['预览'], tupian: ['图片'], tupianyulan: ['图片预览'], shangchuan: ['上传'], xiazai: ['下载'],
        queren: ['确认'], quxiao: ['取消'], wancheng: ['完成'], guanbi: ['关闭'], qingkong: ['清空'],
        chexiao: ['撤销'], chongzuo: ['重做'], huifu: ['恢复'], chongzhi: ['重置'], gengming: ['更名'],
        duoxuan: ['多选'], fanxuan: ['反选'], quanxuan: ['全选'], xuanzhong: ['选中'], quxiaoxuanzhong: ['取消选中'],
        dangqian: ['当前'], moren: ['默认'], zidong: ['自动'], zidongbaocun: ['自动保存'], shoudongbaocun: ['手动保存'],
        wenjian: ['文件'], wenjianming: ['文件名称'], liebia: ['列表'], jilu: ['记录'], lishi: ['历史'],
        fangda: ['放大'], suoxiao: ['缩小'], huifusuofang: ['恢复缩放'], gaoliang: ['高亮'], zhuti: ['主题'],
        baitianmoshi: ['白天模式'], yejianmoshi: ['夜间模式'], zhuomianmoshi: ['桌面模式'], xitongjianpan: ['系统键盘'],
        kuaijieduanyu: ['快捷短语'], shangyige: ['上一个'], xiayige: ['下一个'], shangyigebianjikuang: ['上一个编辑框'],
        xiayigebianjikuang: ['下一个编辑框'], yuangbang: ['圆棒'], yuangbangzhongliang: ['圆棒重量'],
        zhenghuo: ['正火'], tuihuo: ['退火'], tiaozhi: ['调质'], cheguang: ['车光'], heipi: ['黑皮'], huapi: ['花皮'],
        gongchang: ['工厂'], shengchan: ['生产'], zhiliang: ['质量'], kucun: ['库存'], cangku: ['仓库'],
        jiankong: ['监控'], caozuo: ['操作'], caozuozhinan: ['操作指南'], guanyu: ['关于'], banben: ['版本'],
        chenggong: ['成功'], shibai: ['失败'], cuowu: ['错误'], jinggao: ['警告'], chongfu: ['重复'],
        meiwenti: ['没问题'], zhidaole: ['知道了'], mingbai: ['明白'], shoudao: ['收到'], mashang: ['马上'],
        jixutianjia: ['继续添加'], yongjiu: ['永久'], tingzhigengxin: ['停止更新'], weihu: ['维护'],
        women: ['我们'], nimen: ['你们'], tamen: ['他们'], keyi: ['可以'], meiyou: ['没有'], yijing: ['已经'],
        xianzai: ['现在'], jintian: ['今天'], mingtian: ['明天'], zuotian: ['昨天'], shijian: ['时间'],
        gongzuo: ['工作'], xiangmu: ['项目'], xitong: ['系统'], xinxi: ['信息'], mingcheng: ['名称']
    };
	const pinyinPhrases = {};
	Object.entries(corpusData.pinyinPhrases || {}).forEach(([code, values]) => {
	    pinyinPhrases[code] = Array.isArray(values) ? values.slice() : [];
	});
	Object.entries(domainPinyinPhrases).forEach(([code, priorityPhrases]) => {
	    const existing = pinyinPhrases[code] || [];
	    pinyinPhrases[code] = [...priorityPhrases, ...existing.filter(value => !priorityPhrases.includes(value))];
	});

    const allSyllables = Object.keys(pinyinCharacters).sort((a, b) => b.length - a.length);
    const syllableSet = new Set(allSyllables);
	const syllablesByFirstLetter = {};
	allSyllables.forEach(syllable => {
	    const firstLetter = syllable[0];
	    if (!syllablesByFirstLetter[firstLetter]) syllablesByFirstLetter[firstLetter] = [];
	    syllablesByFirstLetter[firstLetter].push(syllable);
	});
	const pinyinIntelligence = global.RSDBImeIntelligence?.createPinyinEngine?.(allSyllables) || null;

    const doublePinyinSchemes = {
        xiaohe: {
            name: '小鹤双拼',
            initials: { zh: 'v', ch: 'i', sh: 'u' },
            finals: {
                a: 'a', o: 'o', e: 'e', i: 'i', u: 'u', v: 'v', ai: 'd', ei: 'w', ui: 'v', ao: 'c',
                ou: 'z', iu: 'q', ie: 'p', ve: 't', er: 'r', an: 'j', en: 'f', in: 'b', un: 'y',
                vn: 'y', ang: 'h', eng: 'g', ing: 'k', ong: 's', ia: 'x', ua: 'x', uai: 'k',
                iao: 'n', ian: 'm', iang: 'l', uang: 'l', iong: 's', uan: 'r', uo: 'o'
            }
        },
        natural: {
            name: '自然码双拼',
            initials: { zh: 'v', ch: 'i', sh: 'u' },
            finals: {
                a: 'a', o: 'o', e: 'e', i: 'i', u: 'u', v: 'v', ai: 'l', ei: 'z', ui: 'v', ao: 'k',
                ou: 'b', iu: 'q', ie: 'x', ve: 't', er: 'r', an: 'j', en: 'f', in: 'n', un: 'p',
                vn: 'n', ang: 'h', eng: 'g', ing: 'y', ong: 's', ia: 'w', ua: 'w', uai: 'c',
                iao: 'c', ian: 'm', iang: 'd', uang: 'd', iong: 's', uan: 'r', uo: 'o'
            }
        }
    };

    function normalizeComposition(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[’‘`]/g, "'")
            .replace(/[üǖǘǚǜ]/g, 'v')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/u:/g, 'v')
            .replace(/[^a-zv']/g, '')
            .replace(/'{2,}/g, "'")
            .replace(/^'+/g, '');
    }

    function normalizeCode(value) {
        return normalizeComposition(value).replace(/'/g, '');
    }

    function splitInitial(syllable) {
        if (/^(zh|ch|sh)/.test(syllable)) return [syllable.slice(0, 2), syllable.slice(2)];
        if (/^[bpmfdtnlgkhjqxrzcsyw]/.test(syllable)) return [syllable[0], syllable.slice(1)];
        return ['', syllable];
    }

    function encodeDoublePinyinSyllable(syllable, schemeName) {
        const scheme = doublePinyinSchemes[schemeName];
        if (!scheme) return '';
        const parts = splitInitial(syllable);
        const initial = parts[0];
        const final = parts[1];
        const initialKey = initial ? (scheme.initials[initial] || initial) : (syllable[0] || '');
        const finalKey = scheme.finals[final] || scheme.finals[syllable] || '';
        return initialKey && finalKey ? initialKey + finalKey : '';
    }

    const doublePinyinIndexes = {};
    Object.keys(doublePinyinSchemes).forEach(schemeName => {
        const index = {};
        allSyllables.forEach(syllable => {
            const code = encodeDoublePinyinSyllable(syllable, schemeName);
            if (!code) return;
            if (!index[code]) index[code] = [];
            index[code].push(syllable);
        });
        doublePinyinIndexes[schemeName] = index;
    });

    function decodeDoublePinyin(code, schemeName, limit = 48) {
        const raw = normalizeCode(code);
        const index = doublePinyinIndexes[schemeName];
        if (!index || !raw || raw.length % 2 !== 0) return [];
        let results = [''];
        for (let i = 0; i < raw.length; i += 2) {
            const choices = index[raw.slice(i, i + 2)] || [];
            if (!choices.length) return [];
            const next = [];
            for (const prefix of results) {
                for (const syllable of choices) {
                    next.push(prefix + syllable);
                    if (next.length >= limit) break;
                }
                if (next.length >= limit) break;
            }
            results = next;
        }
        return results;
    }

    function splitFullPinyin(code, maxResults = 18) {
        const raw = normalizeCode(code);
        if (!raw) return [];
        const memo = new Map();
        function walk(offset) {
            if (offset === raw.length) return [[]];
            if (memo.has(offset)) return memo.get(offset);
            const results = [];
            for (const syllable of syllablesByFirstLetter[raw[offset]] || []) {
                if (!raw.startsWith(syllable, offset)) continue;
                const tails = walk(offset + syllable.length);
                for (const tail of tails) {
                    results.push([syllable, ...tail]);
                    if (results.length >= maxResults) break;
                }
                if (results.length >= maxResults) break;
            }
            memo.set(offset, results);
            return results;
        }
        return walk(0).sort((a, b) => a.length - b.length);
    }

	function splitCompositionPinyin(composition, maxResults = 18) {
	    const normalized = normalizeComposition(composition);
	    if (!normalized) return [];
	    const parts = normalized.split("'").filter(Boolean);
	    let results = [[]];
	    for (const part of parts) {
	        const choices = splitFullPinyin(part, maxResults);
	        if (!choices.length) return [];
	        const next = [];
	        for (const prefix of results) {
	            for (const choice of choices) {
	                next.push([...prefix, ...choice]);
	                if (next.length >= maxResults) break;
	            }
	            if (next.length >= maxResults) break;
	        }
	        results = next;
	    }
	    return results;
	}

	function segmentPinyinPartForDisplay(value) {
	    const raw = normalizeCode(value);
	    if (!raw) return [];
	    if (syllableSet.has(raw)) return [raw];
	    const memo = new Map();
	    const isBetter = (candidate, current) => {
	        if (!current) return true;
	        if (candidate.unknown !== current.unknown) return candidate.unknown < current.unknown;
	        if (candidate.syllableScore !== current.syllableScore) return candidate.syllableScore > current.syllableScore;
	        if (candidate.partialCount !== current.partialCount) return candidate.partialCount < current.partialCount;
	        if (candidate.initialCount !== current.initialCount) return candidate.initialCount < current.initialCount;
	        return candidate.tokens.length < current.tokens.length;
	    };
	    function walk(offset) {
	        if (offset >= raw.length) {
	            return { tokens: [], unknown: 0, syllableScore: 0, partialCount: 0, initialCount: 0 };
	        }
	        if (memo.has(offset)) return memo.get(offset);
	        let best = null;
	        for (const syllable of syllablesByFirstLetter[raw[offset]] || []) {
	            if (!raw.startsWith(syllable, offset)) continue;
	            const tail = walk(offset + syllable.length);
	            const candidate = {
	                tokens: [syllable, ...tail.tokens],
	                unknown: tail.unknown,
	                syllableScore: tail.syllableScore + syllable.length * syllable.length,
	                partialCount: tail.partialCount,
	                initialCount: tail.initialCount
	            };
	            if (isBetter(candidate, best)) best = candidate;
	        }
	        const pair = raw.slice(offset, offset + 2);
	        const initial = pair === 'zh' || pair === 'ch' || pair === 'sh'
	            ? pair
	            : (/^[bpmfdtnlgkhjqxrzcsyw]$/.test(raw[offset]) ? raw[offset] : '');
	        if (initial) {
	            const tail = walk(offset + initial.length);
	            const candidate = {
	                tokens: [initial, ...tail.tokens],
	                unknown: tail.unknown,
	                syllableScore: tail.syllableScore,
	                partialCount: tail.partialCount,
	                initialCount: tail.initialCount + 1
	            };
	            if (isBetter(candidate, best)) best = candidate;
	        }
	        const remainder = raw.slice(offset);
	        if (allSyllables.some(syllable => syllable.startsWith(remainder))) {
	            const candidate = {
	                tokens: [remainder],
	                unknown: 0,
	                syllableScore: Math.max(0, remainder.length * remainder.length - 1),
	                partialCount: 1,
	                initialCount: 0
	            };
	            if (isBetter(candidate, best)) best = candidate;
	        }
	        if (!best) {
	            const tail = walk(offset + 1);
	            best = {
	                tokens: [raw[offset], ...tail.tokens],
	                unknown: tail.unknown + 1,
	                syllableScore: tail.syllableScore,
	                partialCount: tail.partialCount,
	                initialCount: tail.initialCount
	            };
	        }
	        memo.set(offset, best);
	        return best;
	    }
	    return walk(0).tokens;
	}

	function formatPinyinComposition(value) {
	    const normalized = normalizeComposition(value);
	    if (!normalized) return '';
	    const intelligentFormatted = pinyinIntelligence?.format(normalized);
	    if (intelligentFormatted) return intelligentFormatted;
	    const formatted = normalized
	        .split("'")
	        .filter(Boolean)
	        .flatMap(part => segmentPinyinPartForDisplay(part))
	        .join("'");
	    return normalized.endsWith("'") ? `${formatted}'` : formatted;
	}

    function encodeDoublePinyin(code, schemeName) {
        const syllables = splitFullPinyin(code, 1)[0] || [];
        if (!syllables.length) return '';
        const encoded = syllables.map(syllable => encodeDoublePinyinSyllable(syllable, schemeName));
        return encoded.every(Boolean) ? encoded.join('') : '';
    }

    const doublePhraseIndexes = {};
    function getDoublePhraseIndex(schemeName) {
		if (doublePhraseIndexes[schemeName]) return doublePhraseIndexes[schemeName];
        const index = {};
        Object.entries(pinyinPhrases).forEach(([fullCode, phrases]) => {
            const encoded = encodeDoublePinyin(fullCode, schemeName);
            if (!encoded) return;
            if (!index[encoded]) index[encoded] = [];
            phrases.forEach(phrase => {
                if (!index[encoded].includes(phrase)) index[encoded].push(phrase);
            });
        });
        doublePhraseIndexes[schemeName] = index;
		return index;
	}

    const pinyinAbbreviations = {};
	Object.entries(corpusData.pinyinAbbreviations || {}).forEach(([abbreviation, phrases]) => {
	    pinyinAbbreviations[abbreviation] = Array.isArray(phrases) ? phrases.slice() : [];
	});
	const domainAbbreviations = {};
    Object.entries(domainPinyinPhrases).forEach(([fullCode, phrases]) => {
        const syllables = splitFullPinyin(fullCode, 1)[0] || [];
        if (syllables.length < 2) return;
        const abbreviation = syllables.map(syllable => syllable[0]).join('');
        if (abbreviation.length < 2) return;
		if (!domainAbbreviations[abbreviation]) domainAbbreviations[abbreviation] = [];
		phrases.forEach(phrase => {
		    if (!domainAbbreviations[abbreviation].includes(phrase)) domainAbbreviations[abbreviation].push(phrase);
		});
    });
	Object.entries(domainAbbreviations).forEach(([abbreviation, priorityPhrases]) => {
	    const existing = pinyinAbbreviations[abbreviation] || [];
	    pinyinAbbreviations[abbreviation] = [...priorityPhrases, ...existing.filter(phrase => !priorityPhrases.includes(phrase))];
	});

    function pushUnique(list, seen, value) {
        if (!value || seen.has(value)) return;
        seen.add(value);
        list.push(value);
    }

	const sortedPhraseCodes = Object.keys(pinyinPhrases).sort();
	const sortedPinyinCodes = Object.keys(pinyinCharacters).sort();
	let unfilteredDictionaryTotals = null;

	function getUnfilteredDictionaryTotals() {
	    if (unfilteredDictionaryTotals) return unfilteredDictionaryTotals;
	    const phraseCount = sortedPhraseCodes.reduce((total, code) => total + (pinyinPhrases[code]?.length || 0), 0);
	    const characterCount = sortedPinyinCodes.reduce((total, code) => total + Array.from(pinyinCharacters[code] || '').length, 0);
	    const chinese = phraseCount + characterCount;
	    const english = sortedComprehensiveEnglishWords.length;
	    unfilteredDictionaryTotals = Object.freeze({ chinese, english, all: chinese + english });
	    return unfilteredDictionaryTotals;
	}

	function lowerBound(sortedValues, target) {
	    let low = 0;
	    let high = sortedValues.length;
	    while (low < high) {
	        const middle = (low + high) >> 1;
	        if (sortedValues[middle] < target) low = middle + 1;
	        else high = middle;
	    }
	    return low;
	}

	function appendPhrasePrefixCandidates(prefix, output, seen, limit) {
	    if (!prefix) return;
	    Object.entries(domainPinyinPhrases)
	        .filter(([code]) => code.startsWith(prefix))
	        .sort((left, right) => left[0].length - right[0].length)
	        .forEach(([, phrases]) => phrases.forEach(value => pushUnique(output, seen, value)));
	    const start = lowerBound(sortedPhraseCodes, prefix);
	    let scannedCodes = 0;
	    for (let index = start; index < sortedPhraseCodes.length; index++) {
	        const code = sortedPhraseCodes[index];
	        if (!code.startsWith(prefix)) break;
	        (pinyinPhrases[code] || []).slice(0, 4).forEach(value => pushUnique(output, seen, value));
	        scannedCodes++;
	        if (output.length >= limit * 2 || scannedCodes >= Math.max(48, limit * 3)) break;
	    }
	}

	function appendCharacterPrefixCandidates(prefix, output, seen, limit) {
	    if (!prefix) return;
	    Object.entries(domainPinyinCharacters)
	        .filter(([code]) => code.startsWith(prefix))
	        .forEach(([, characters]) => Array.from(characters).slice(0, 3).forEach(value => pushUnique(output, seen, value)));
	    const start = lowerBound(sortedPinyinCodes, prefix);
	    let scannedCodes = 0;
	    for (let index = start; index < sortedPinyinCodes.length; index++) {
	        const code = sortedPinyinCodes[index];
	        if (!code.startsWith(prefix)) break;
	        Array.from(pinyinCharacters[code] || '').slice(0, 2).forEach(value => pushUnique(output, seen, value));
	        scannedCodes++;
	        if (output.length >= limit * 2 || scannedCodes >= Math.max(24, limit)) break;
	    }
	}

	function charactersForPinyinPart(part, limit = 8) {
	    const normalized = normalizeCode(part);
	    if (!normalized) return [];
	    const output = [];
	    const seen = new Set();
	    Array.from(domainPinyinCharacters[normalized] || '').forEach(value => pushUnique(output, seen, value));
	    Array.from(pinyinCharacters[normalized] || '').forEach(value => pushUnique(output, seen, value));
	    if (output.length < limit) appendCharacterPrefixCandidates(normalized, output, seen, limit);
	    return output.slice(0, Math.max(1, limit));
	}

	function appendSegmentedCharacterCandidates(composition, output, seen, limit) {
	    const normalized = normalizeComposition(composition);
        const formatted = formatPinyinComposition(normalized);
	    const parts = formatted.split("'").filter(Boolean);
	    if (!parts.length) return;
	    const expectedLength = parts.length;
	    const pushLengthMatched = value => {
	        if (Array.from(value || '').length === expectedLength) pushUnique(output, seen, value);
	    };
        const initialCode = parts.map(part => normalizeCode(part)[0] || '').join('');
	    (pinyinAbbreviations[initialCode] || []).forEach(pushLengthMatched);
        const groupedCodes = [];
        for (const groupSize of [4, 2]) {
            for (let offset = 0; offset + groupSize <= parts.length; offset += groupSize) {
                groupedCodes.push(parts.slice(offset, offset + groupSize).map(part => normalizeCode(part)[0] || '').join(''));
            }
        }
	    groupedCodes.forEach(code => (pinyinAbbreviations[code] || []).forEach(pushLengthMatched));
	    let combinations = [''];
	    const combinationLimit = Math.min(192, Math.max(limit * 2, 72));
	    const charactersPerPart = parts.length >= 8 ? 3 : (parts.length >= 5 ? 4 : 6);
	    for (const part of parts) {
            const code = normalizeCode(part);
            let characters = [];
	        if (syllableSet.has(code)) characters = charactersForPinyinPart(code, charactersPerPart);
	        else if (/^(zh|ch|sh|[a-z])$/.test(code)) characters = candidatesForSingleLetter(code[0], charactersPerPart);
	        else characters = charactersForPinyinPart(code, charactersPerPart);
	        if (!characters.length) characters = candidatesForSingleLetter(code[0], charactersPerPart);
	        if (!characters.length) characters = Array.from(initialFallbackCharacters[code[0]] || '').slice(0, charactersPerPart);
	        if (!characters.length) return;
	        const next = [];
	        for (const prefix of combinations) {
	            for (const character of characters) {
	                next.push(prefix + character);
	                if (next.length >= combinationLimit) break;
	            }
	            if (next.length >= combinationLimit) break;
	        }
	        combinations = next;
	    }
	    combinations.forEach(pushLengthMatched);
	}

	function getExpectedPinyinCandidateLength(composition) {
	    const normalized = normalizeComposition(composition);
	    if (normalized.includes("'")) return normalized.split("'").filter(Boolean).length;
        const formatted = formatPinyinComposition(normalized);
        if (syllableSet.has(normalizeCode(normalized))) return 1;
	    if (!formatted.includes("'")) return 0;
        const parts = formatted.split("'").filter(Boolean);
	    const allMatchable = parts.every(part => {
	        const code = normalizeCode(part);
	        return syllableSet.has(code) || /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])$/.test(code);
	    });
	    if (allMatchable && (parts.length >= 5 || normalizeCode(normalized).length % 2 !== 0)) return parts.length;
        if (!parts.every(part => syllableSet.has(normalizeCode(part)))) return 0;
	    if (normalizeCode(normalized).length % 2 === 0) return 0;
	    return parts.length;
	}

	const initialFallbackCharacters = {
        b: '不把被', p: '怕跑陪', m: '吗没么', f: '发非分', d: '的到都', t: '他她它',
        n: '你那呢', l: '了来里', g: '个给过', k: '可看开', h: '和好还', j: '就家见',
        q: '去请前', x: '想下先', r: '人让如', z: '在这怎', c: '才从此', s: '是所三',
        y: '一有也', w: '我为无', u: '无五我', v: '女绿语',
        // Mandarin syllables that begin with a bare vowel are commonly typed
        // as single-letter initials in abbreviated compositions (for example
        // i'h'g...); keep a small fallback so long explicit compositions do
        // not collapse to an empty candidate bar.
        i: '一已以意', e: '额俄恶饿', o: '哦噢'
    };

	function candidatesForSingleLetter(letter, limit) {
	    const output = [];
        const preferred = initialFallbackCharacters[letter] || '';
        Array.from(preferred).forEach(value => {
            if (!output.includes(value)) output.push(value);
        });
	    const seen = new Set(output);
	    const matchingCodes = sortedPinyinCodes.filter(code => code.startsWith(letter));
	    matchingCodes.sort((left, right) => {
	        if (left === letter) return -1;
	        if (right === letter) return 1;
	        return left.length - right.length || left.localeCompare(right);
	    });
	    matchingCodes.forEach(code => {
	        Array.from(domainPinyinCharacters[code] || '').forEach(value => pushUnique(output, seen, value));
	        Array.from(pinyinCharacters[code] || '').forEach(value => pushUnique(output, seen, value));
	    });
	    return output.slice(0, limit);
	}

    function candidatesForFullCode(code, limit, includePrefixes = true) {
        const composition = normalizeComposition(code);
        const raw = normalizeCode(composition);
        const output = [];
        const seen = new Set();
        (pinyinPhrases[raw] || []).forEach(value => pushUnique(output, seen, value));
		if (includePrefixes && !pinyinPhrases[raw]) appendPhrasePrefixCandidates(raw, output, seen, limit);

        const segmentations = composition.includes("'") ? splitCompositionPinyin(composition) : splitFullPinyin(raw);
		if (!segmentations.length) appendCharacterPrefixCandidates(raw, output, seen, limit);
        for (const syllables of segmentations) {
            if (!syllables.length) continue;
            if (syllables.length === 1) {
                Array.from(pinyinCharacters[syllables[0]] || '').forEach(value => pushUnique(output, seen, value));
                continue;
            }
            let combinations = [''];
            for (const syllable of syllables) {
                const chars = Array.from(pinyinCharacters[syllable] || '').slice(0, 4);
                if (!chars.length) {
                    combinations = [];
                    break;
                }
                const next = [];
                combinations.forEach(prefix => chars.forEach(char => {
                    if (next.length < Math.max(limit * 3, 24)) next.push(prefix + char);
                }));
                combinations = next;
            }
            combinations.forEach(value => pushUnique(output, seen, value));
            if (output.length >= limit * 3) break;
        }
        return output.slice(0, limit);
    }

    function lookupPinyin(code, options = {}) {
        const composition = normalizeComposition(code);
        const raw = normalizeCode(composition);
        if (!raw) return [];
        const limit = Math.max(1, Number(options.limit) || 48);
		if (raw.length === 1 && !composition.includes("'")) {
		    return candidatesForSingleLetter(raw, limit);
		}
        if (!composition.includes("'") && syllableSet.has(raw)) {
            return charactersForPinyinPart(raw, limit).filter(value => Array.from(value).length === 1).slice(0, limit);
        }
        const scheme = options.scheme || 'smart';
        const output = [];
	    const formattedParts = formatPinyinComposition(composition).split("'").filter(Boolean);
	    const hasExplicitSeparators = composition.includes("'");
	    const hasLongSegmentedComposition = formattedParts.length >= 5;
        const isInitialSequence = !composition.includes("'") && raw.length >= 2 && /^[bpmfdtnlgkhjqxrzcsyw]+$/.test(raw);
        if (scheme === 'smart' && isInitialSequence) {
            const initialSeen = new Set();
            (pinyinAbbreviations[raw] || []).forEach(value => pushUnique(output, initialSeen, value));
            const choices = Array.from(raw).map(initial => Array.from(initialFallbackCharacters[initial] || initial).slice(0, 3));
            let combinations = [''];
            choices.forEach(chars => {
                const next = [];
                combinations.forEach(prefix => chars.forEach(char => {
                    if (next.length < Math.max(24, limit)) next.push(prefix + char);
                }));
                combinations = next;
            });
            combinations.forEach(value => pushUnique(output, initialSeen, value));
            return output.slice(0, limit);
        }
		const seen = new Set();
		const abbreviationCandidates = pinyinAbbreviations[raw] || [];
		abbreviationCandidates.slice(0, Math.min(8, limit)).forEach(value => pushUnique(output, seen, value));
		const remoteDictionary = global.RSDBRemoteInputMethod;
		if (remoteDictionary && raw.length >= 2) {
		    remoteDictionary.getCachedChinese(raw).forEach(value => pushUnique(output, seen, value));
		    remoteDictionary.requestChinese(raw, Math.max(limit, 96));
		}
		const pinyinCorrections = (pinyinIntelligence?.getCorrections(composition, 6) || [])
		    .sort((left, right) => {
		        const leftPhraseCount = pinyinPhrases[left.raw]?.length || 0;
		        const rightPhraseCount = pinyinPhrases[right.raw]?.length || 0;
		        return rightPhraseCount - leftPhraseCount
		            || left.distance - right.distance
		            || left.score - right.score;
		    })
		    .slice(0, 4);
		const correctedExpectedLengths = new Set();
		pinyinCorrections.forEach(correction => {
		    if (!correction?.raw) return;
		    correctedExpectedLengths.add(Number(correction.segments) || 0);
		    if (remoteDictionary) {
		        remoteDictionary.getCachedChinese(correction.raw).forEach(value => pushUnique(output, seen, value));
		        remoteDictionary.requestChinese(correction.raw, Math.max(limit, 96));
		    }
		    candidatesForFullCode(correction.value, Math.min(limit, 24), false)
		        .forEach(value => pushUnique(output, seen, value));
		});

		const doubleSchemes = scheme === 'smart' ? Object.keys(doublePinyinSchemes) : (scheme === 'full' ? [] : [scheme]);
		const appendFullCandidates = () => {
		    candidatesForFullCode(composition, limit).forEach(value => pushUnique(output, seen, value));
		};
		const appendDoubleCandidates = () => {
		    if (hasExplicitSeparators || hasLongSegmentedComposition) return;
		    if (raw.length % 2 !== 0) return;
		    const decodedCodes = [];
		    const decodedSeen = new Set();
		    doubleSchemes.forEach(schemeName => {
		        decodeDoublePinyin(raw, schemeName, 32).forEach(fullCode => {
		            if (decodedSeen.has(fullCode)) return;
		            decodedSeen.add(fullCode);
		            decodedCodes.push(fullCode);
		        });
		    });
		    decodedCodes.forEach(fullCode => {
		        (pinyinPhrases[fullCode] || []).forEach(value => pushUnique(output, seen, value));
		    });
		    decodedCodes.forEach(fullCode => {
		        candidatesForFullCode(fullCode, limit, false).forEach(value => pushUnique(output, seen, value));
		    });
		};

		if (scheme === 'smart') {
		    const isCompleteFullPinyin = splitCompositionPinyin(composition, 1).length > 0;
            const hasCompleteFullPrefix = !composition.includes("'") && allSyllables.some(syllable => raw.startsWith(syllable) && syllable.length < raw.length);
		    if (isCompleteFullPinyin) {
		        appendFullCandidates();
		        appendDoubleCandidates();
		    } else if (hasCompleteFullPrefix) {
                appendFullCandidates();
		    } else {
		        appendDoubleCandidates();
		        appendFullCandidates();
		    }
		} else if (scheme === 'full') {
		    appendFullCandidates();
		} else {
		    appendDoubleCandidates();
		}
		appendSegmentedCharacterCandidates(composition, output, seen, limit);
		abbreviationCandidates.slice(Math.min(8, limit)).forEach(value => pushUnique(output, seen, value));
		const expectedLength = getExpectedPinyinCandidateLength(composition);
		const expectedLengths = new Set([expectedLength, ...correctedExpectedLengths].filter(Boolean));
		const filtered = expectedLengths.size
		    ? output.filter(value => expectedLengths.has(Array.from(value).length))
		    : output;
		return filtered.slice(0, limit);
    }

	const sortedFrequentEnglishWords = Array.from(new Set(frequentEnglishWords.map(word => word.toLowerCase())));
	const sortedComprehensiveEnglishWords = Array.from(new Set(comprehensiveEnglishWords)).sort();
	const localEnglishRanks = new Map();
	sortedFrequentEnglishWords.forEach((word, index) => {
	    if (!localEnglishRanks.has(word)) localEnglishRanks.set(word, index);
	});
	let localEnglishDeleteIndex = null;
	const localEnglishCorrectionCache = new Map();
	function localEnglishDeleteVariants(value) {
	    const variants = new Set([value]);
	    for (let index = 0; index < value.length; index++) variants.add(value.slice(0, index) + value.slice(index + 1));
	    return variants;
	}
	function getLocalEnglishDeleteIndex() {
	    if (localEnglishDeleteIndex) return localEnglishDeleteIndex;
	    const index = new Map();
	    sortedFrequentEnglishWords.slice(0, 50000).forEach(word => {
	        if (word.length < 2 || word.length > 24) return;
	        localEnglishDeleteVariants(word).forEach(key => {
	            const values = index.get(key) || [];
	            if (values.length < 24 && !values.includes(word)) values.push(word);
	            index.set(key, values);
	        });
	    });
	    localEnglishDeleteIndex = index;
	    return index;
	}
	function getLocalEnglishCorrections(raw, limit) {
	    const maximumDistance = raw.length >= 5 ? 2 : 1;
	    const cacheKey = `${raw}:${maximumDistance}:${limit}`;
	    const cached = localEnglishCorrectionCache.get(cacheKey);
	    if (cached) return cached.slice();
	    const distance = global.RSDBImeIntelligence?.boundedDamerauDistance;
	    const candidates = new Set();
	    localEnglishDeleteVariants(raw).forEach(key => (getLocalEnglishDeleteIndex().get(key) || []).forEach(word => candidates.add(word)));
	    const result = Array.from(candidates)
	        .filter(word => word !== raw && Math.abs(word.length - raw.length) <= maximumDistance)
	        .map(word => ({ word, distance: distance ? distance(raw, word, maximumDistance) : maximumDistance + 1, rank: localEnglishRanks.get(word) ?? Number.MAX_SAFE_INTEGER }))
	        .filter(item => item.distance <= maximumDistance)
	        .sort((left, right) => left.distance - right.distance || left.rank - right.rank || left.word.localeCompare(right.word))
	        .slice(0, limit)
	        .map(item => item.word);
	    if (localEnglishCorrectionCache.size > 500) localEnglishCorrectionCache.clear();
	    localEnglishCorrectionCache.set(cacheKey, result);
	    return result.slice();
	}
	function getLocalEnglishCompound(raw) {
	    if (raw.length < 8 || raw.length > 64 || localEnglishRanks.has(raw)) return '';
	    const best = new Array(raw.length + 1).fill(null);
	    best[0] = { score: 0, words: [] };
	    for (let end = 1; end <= raw.length; end++) {
	        for (let start = Math.max(0, end - 24); start < end; start++) {
	            const previous = best[start];
	            if (!previous) continue;
	            const word = raw.slice(start, end);
	            const rank = localEnglishRanks.get(word);
	            if (rank == null || (word.length === 1 && word !== 'a' && word !== 'i')) continue;
	            const score = previous.score + Math.log(rank + 2) + 1.4 - Math.min(1.2, word.length * 0.08);
	            if (!best[end] || score < best[end].score) best[end] = { score, words: [...previous.words, word] };
	        }
	    }
	    return best[raw.length]?.words?.length >= 2 ? best[raw.length].words.join(' ') : '';
	}

    function lookupEnglish(prefix, limit = 12) {
        const raw = String(prefix || '').trim().toLowerCase();
        if (!raw) return [];
		const maximum = Math.max(1, limit);
		const output = [];
		const seen = new Set();
		pushUnique(output, seen, raw);
		const remoteDictionary = global.RSDBRemoteInputMethod;
		const remoteWords = remoteDictionary ? remoteDictionary.getCachedEnglish(raw) : [];
		const localQuota = remoteWords.length ? Math.max(6, Math.ceil(maximum * 0.6)) : maximum;
		if (raw.length >= 3) {
		    getLocalEnglishCorrections(raw, Math.min(4, maximum - output.length)).forEach(word => pushUnique(output, seen, word));
		}
		for (const word of sortedFrequentEnglishWords) {
		    if (output.length >= localQuota) break;
		    if (word.startsWith(raw)) pushUnique(output, seen, word);
		}
		if (remoteDictionary) {
		    remoteWords.forEach(word => pushUnique(output, seen, word));
		    remoteDictionary.requestEnglish(raw, Math.max(maximum, 96));
		}
		const segmented = getLocalEnglishCompound(raw);
		if (segmented) pushUnique(output, seen, segmented);
		for (const word of sortedFrequentEnglishWords) {
		    if (output.length >= maximum) break;
		    if (word.startsWith(raw)) pushUnique(output, seen, word);
		}
		const start = lowerBound(sortedComprehensiveEnglishWords, raw);
		for (let index = start; index < sortedComprehensiveEnglishWords.length && output.length < maximum; index++) {
		    const word = sortedComprehensiveEnglishWords[index];
		    if (!word.startsWith(raw)) break;
		    if (word !== raw) pushUnique(output, seen, word);
		}
		return output.slice(0, maximum);
    }

	function browseDictionary(options = {}) {
	    const query = String(options.query || '').trim().toLowerCase();
	    const normalizedPinyin = normalizeCode(query);
	    const category = ['all', 'chinese', 'english'].includes(options.category) ? options.category : 'all';
	    const pageSize = Math.max(10, Math.min(100, Number(options.pageSize) || 30));
	    const page = Math.max(0, Math.floor(Number(options.page) || 0));
	    const offset = page * pageSize;
	    const total = query ? null : getUnfilteredDictionaryTotals()[category];
	    const entries = [];
	    const seen = new Set();
	    let matched = 0;
	    let stopped = false;

	    const addEntry = entry => {
	        const key = `${entry.type}:${entry.text}:${entry.code || ''}`;
	        if (!entry.text || seen.has(key)) return false;
	        seen.add(key);
	        if (matched >= offset && entries.length <= pageSize) entries.push(entry);
	        matched++;
	        if (entries.length > pageSize) stopped = true;
	        return stopped;
	    };

	    const includeChinese = category === 'all' || category === 'chinese';
	    const includeEnglish = category === 'all' || category === 'english';
	    const isLatinQuery = !query || /^[a-zv'\s]+$/.test(query);
	    const remoteDictionary = global.RSDBRemoteInputMethod;
	    if (query && remoteDictionary) {
	        const remoteLimit = Math.min(500, Math.max(pageSize * (page + 2), 96));
	        if (includeChinese && isLatinQuery) {
	            remoteDictionary.getCachedEntries('chinese', normalizedPinyin).forEach(addEntry);
	            remoteDictionary.requestChinese(normalizedPinyin, remoteLimit);
	        }
	        if (includeEnglish && /^[a-z']+$/.test(query)) {
	            remoteDictionary.getCachedEntries('english', query).forEach(addEntry);
	            remoteDictionary.requestEnglish(query, remoteLimit);
	        }
	    }

	    if (includeChinese && !stopped) {
	        if (isLatinQuery) {
	            const prefix = normalizedPinyin;
	            const phraseStart = prefix ? lowerBound(sortedPhraseCodes, prefix) : 0;
	            for (let index = phraseStart; index < sortedPhraseCodes.length && !stopped; index++) {
	                const code = sortedPhraseCodes[index];
	                if (prefix && !code.startsWith(prefix)) break;
	                for (const text of pinyinPhrases[code] || []) {
	                    if (addEntry({ text, code, type: '词语' })) break;
	                }
	            }
	            const characterStart = prefix ? lowerBound(sortedPinyinCodes, prefix) : 0;
	            for (let index = characterStart; index < sortedPinyinCodes.length && !stopped; index++) {
	                const code = sortedPinyinCodes[index];
	                if (prefix && !code.startsWith(prefix)) break;
	                for (const text of Array.from(pinyinCharacters[code] || '')) {
	                    if (addEntry({ text, code, type: '汉字' })) break;
	                }
	            }
	        } else {
	            for (const code of sortedPhraseCodes) {
	                if (stopped) break;
	                for (const text of pinyinPhrases[code] || []) {
	                    if (!text.includes(query)) continue;
	                    if (addEntry({ text, code, type: '词语' })) break;
	                }
	            }
	            for (const code of sortedPinyinCodes) {
	                if (stopped) break;
	                for (const text of Array.from(pinyinCharacters[code] || '')) {
	                    if (!text.includes(query)) continue;
	                    if (addEntry({ text, code, type: '汉字' })) break;
	                }
	            }
	        }
	    }

	    if (includeEnglish && !stopped && (!query || /^[a-z']+$/.test(query))) {
	        const start = query ? lowerBound(sortedComprehensiveEnglishWords, query) : 0;
	        for (let index = start; index < sortedComprehensiveEnglishWords.length && !stopped; index++) {
	            const text = sortedComprehensiveEnglishWords[index];
	            if (query && !text.startsWith(query)) break;
	            addEntry({ text, code: text, type: '英文' });
	        }
	    }

	    return {
	        entries: entries.slice(0, pageSize),
	        page,
	        pageSize,
	        hasMore: entries.length > pageSize,
	        total: Number.isFinite(total) ? total : null,
	        counts: corpusData.counts || {}
	    };
	}

    global.RSDBInputMethodLibrary = Object.freeze({
		englishWords: Object.freeze(sortedFrequentEnglishWords.slice()),
		englishDictionaryWordCount: sortedComprehensiveEnglishWords.length,
        pinyinCharacters: Object.freeze({ ...pinyinCharacters }),
        pinyinPhrases: Object.freeze({ ...pinyinPhrases }),
        pinyinAbbreviations: Object.freeze({ ...pinyinAbbreviations }),
        doublePinyinSchemes: Object.freeze(doublePinyinSchemes),
        lookupEnglish,
        lookupPinyin,
		formatPinyinComposition,
		getPinyinCorrections(value, limit = 4) {
		    return pinyinIntelligence?.getCorrections(value, limit) || [];
		},
		browseDictionary,
        splitFullPinyin,
        encodeDoublePinyin,
        decodeDoublePinyin,
        getPinyinInitials(value) {
            const syllables = splitFullPinyin(value, 1)[0] || [];
            return syllables.map(syllable => syllable[0]).join('');
        },
        isPinyinSyllable(value) {
            return syllableSet.has(normalizeCode(value));
        }
    });
})(window);
