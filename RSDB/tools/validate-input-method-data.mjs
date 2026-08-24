import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(toolDirectory, '..');
const context = vm.createContext({ console, performance });
context.window = context;

for (const fileName of ['input-method-data.js', 'input-method-library.js']) {
    const source = await readFile(path.join(projectDirectory, fileName), 'utf8');
    vm.runInContext(source, context, { filename: fileName });
}

const data = context.RSDBInputMethodData;
const library = context.RSDBInputMethodLibrary;
if (!data || !library) throw new Error('Input method data or runtime library failed to load.');

const indexHtml = await readFile(path.join(projectDirectory, 'index.html'), 'utf8');
const inlineScripts = Array.from(indexHtml.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi))
    .filter(match => {
        const openingTag = match[0].slice(0, match[0].indexOf('>') + 1);
        const type = openingTag.match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase();
        return !type || type === 'text/javascript' || type === 'application/javascript';
    });
inlineScripts.forEach((match, index) => {
    try {
        new Function(match[1]);
    } catch (error) {
        throw new Error(`Inline script ${index + 1} failed syntax validation: ${error.message}`);
    }
});

const styleBlocks = Array.from(indexHtml.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi));
const styleSource = styleBlocks.map(match => match[1]).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
let cssBraceBalance = 0;
for (const character of styleSource) {
    if (character === '{') cssBraceBalance += 1;
    if (character === '}') cssBraceBalance -= 1;
    if (cssBraceBalance < 0) throw new Error('CSS contains an unmatched closing brace.');
}
if (cssBraceBalance !== 0) throw new Error(`CSS brace balance is ${cssBraceBalance}.`);

const characters = new Set(Object.values(data.pinyinCharacters).flatMap(value => Array.from(value)));
const invalidCharacters = Array.from(characters).filter(character => !/^\p{Script=Han}$/u.test(character));
const requiredCharacters = { yi: '一', shi: '是', de: '的', zhong: '中', guo: '国' };
const requiredPhrases = {
    shide: '是的',
    rengongzhineng: '人工智能',
    daxingyuyanmoxing: '大型语言模型',
    dayuyanmoxing: '大语言模型',
    neijuan: '内卷',
    tangping: '躺平',
    pofang: '破防'
};

const compositionSamples = {
    hha: "h'ha",
    mang: 'mang',
    mingu: "min'gu",
    shuangp: "shuang'p",
    rgs: "r'g's",
    liru: "li'ru",
    "li'ru": "li'ru"
};

Object.entries(requiredCharacters).forEach(([code, character]) => {
    if (!data.pinyinCharacters[code]?.includes(character)) {
        throw new Error(`Missing character candidate: ${code} -> ${character}`);
    }
});

const samples = {};
Object.entries(requiredPhrases).forEach(([code, phrase]) => {
    const candidates = library.lookupPinyin(code, { scheme: 'smart', limit: 12 });
    samples[code] = candidates;
    if (!candidates.includes(phrase)) throw new Error(`Missing phrase candidate: ${code} -> ${phrase}`);
});

Object.entries(compositionSamples).forEach(([input, expected]) => {
    const actual = library.formatPinyinComposition(input);
    if (actual !== expected) throw new Error(`Composition formatting failed: ${input} -> ${actual}, expected ${expected}`);
});

const partialCandidates = library.lookupPinyin('shuangp', { scheme: 'smart', limit: 24 });
if (!partialCandidates.includes('双拼')) throw new Error("Smart partial-pinyin lookup failed: shuangp -> 双拼");
if (partialCandidates[0] !== '双拼') throw new Error(`Priority partial-pinyin candidate is incorrect: shuangp -> ${partialCandidates[0]}`);
const separatedCandidates = library.lookupPinyin("li'ru", { scheme: 'smart', limit: 24 });
if (!separatedCandidates.includes('例如')) throw new Error("Separated-pinyin lookup failed: li'ru -> 例如");
const liKanCandidates = library.lookupPinyin("li'kan", { scheme: 'smart', limit: 24 });
if (!liKanCandidates.length || liKanCandidates.some(candidate => Array.from(candidate).length !== 2)) {
    throw new Error(`Separated-pinyin returned a candidate with the wrong length: li'kan -> ${liKanCandidates.join(', ')}`);
}
for (const partialCode of ["y'yu", "y'y'y'y'y"]) {
    const candidates = library.lookupPinyin(partialCode, { scheme: 'smart', limit: 24 });
    const expectedLength = partialCode.split("'").length;
    if (!candidates.length || candidates.some(candidate => Array.from(candidate).length !== expectedLength)) {
        throw new Error(`Partial segmented pinyin failed: ${partialCode} -> ${candidates.join(', ')}`);
    }
}
const singleLetterCandidates = library.lookupPinyin('n', { scheme: 'smart', limit: 24 });
if (!singleLetterCandidates.length) throw new Error('Single-letter pinyin prediction failed: n');
const singleLetterACandidates = library.lookupPinyin('a', { scheme: 'smart', limit: 48 });
if (!singleLetterACandidates.length || singleLetterACandidates.some(candidate => Array.from(candidate).length !== 1)) {
    throw new Error(`Single-letter pinyin returned a multi-character candidate: a -> ${singleLetterACandidates.join(', ')}`);
}

const chineseBrowse = library.browseDictionary({ query: 'shuangpin', category: 'chinese', page: 0, pageSize: 12 });
if (!chineseBrowse.entries.some(entry => entry.text === '双拼')) throw new Error('Chinese dictionary browsing failed: shuang -> 双拼');
if (chineseBrowse.entries.length > 12) throw new Error('Chinese dictionary page exceeded requested page size.');
const englishBrowse = library.browseDictionary({ query: 'zyz', category: 'english', page: 0, pageSize: 12 });
if (!englishBrowse.entries.some(entry => entry.text === 'zyzzyva')) throw new Error('English dictionary browsing failed: zyz -> zyzzyva');
if (englishBrowse.entries.length > 12) throw new Error('English dictionary page exceeded requested page size.');

if (invalidCharacters.length) {
    throw new Error(`Non-Han values found in character dictionary: ${invalidCharacters.slice(0, 10).join(' ')}`);
}

const doubleCode = library.encodeDoublePinyin('shide', 'xiaohe');
const doubleStart = performance.now();
const doubleCandidates = library.lookupPinyin(doubleCode, { scheme: 'smart', limit: 12 });
const doubleLookupMilliseconds = Math.round((performance.now() - doubleStart) * 100) / 100;
if (!doubleCandidates.includes('是的')) throw new Error(`Double-pinyin lookup failed: ${doubleCode} -> 是的`);
const xiaoheNihaoCode = library.encodeDoublePinyin('nihao', 'xiaohe');
const naturalNihaoCode = library.encodeDoublePinyin('nihao', 'natural');
const xiaoheNihaoCandidates = library.lookupPinyin(xiaoheNihaoCode, { scheme: 'smart', limit: 24 });
const naturalNihaoCandidates = library.lookupPinyin(naturalNihaoCode, { scheme: 'smart', limit: 24 });
if (!xiaoheNihaoCandidates.includes('你好')) throw new Error(`Smart Xiaohe lookup failed: ${xiaoheNihaoCode} -> 你好`);
if (!naturalNihaoCandidates.includes('你好')) throw new Error(`Smart Natural Code lookup failed: ${naturalNihaoCode} -> 你好`);

const englishStart = performance.now();
const comprehensiveEnglishCandidates = library.lookupEnglish('zyz', 12);
const englishLookupMilliseconds = Math.round((performance.now() - englishStart) * 100) / 100;
if (!comprehensiveEnglishCandidates.includes('zyzzyva')) throw new Error('Comprehensive English lookup failed: zyz -> zyzzyva');
const exactEnglishCandidates = library.lookupEnglish('do', 12);
if (exactEnglishCandidates[0] !== 'do') throw new Error(`English input must be the first candidate: do -> ${exactEnglishCandidates[0]}`);
if (Number(data.counts.englishDictionaryWords || 0) < 300000) throw new Error('Comprehensive English dictionary is unexpectedly small.');

console.log(JSON.stringify({
    counts: data.counts,
    actualUniqueCharacters: characters.size,
    invalidCharacters: invalidCharacters.length,
    samples,
    smartPinyin: {
        compositionSamples,
        partialCandidates,
        separatedCandidates,
        singleLetterCandidates,
        singleLetterACandidates
    },
    dictionaryBrowse: { chinese: chineseBrowse, english: englishBrowse },
    doublePinyin: {
        code: doubleCode,
        candidates: doubleCandidates,
        lookupMilliseconds: doubleLookupMilliseconds,
        xiaoheNihao: { code: xiaoheNihaoCode, candidates: xiaoheNihaoCandidates },
        naturalNihao: { code: naturalNihaoCode, candidates: naturalNihaoCandidates }
    },
    english: {
        candidates: comprehensiveEnglishCandidates,
        exactInputCandidates: exactEnglishCandidates,
        lookupMilliseconds: englishLookupMilliseconds
    },
    indexValidation: {
        inlineScripts: inlineScripts.length,
        styleBlocks: styleBlocks.length,
        cssBraceBalance
    }
}, null, 2));
