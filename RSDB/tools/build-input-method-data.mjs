import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SOURCES = {
    phrases: {
        name: 'mozillazg/phrase-pinyin-data',
        version: 'v0.19.0',
        url: 'https://cdn.jsdelivr.net/gh/mozillazg/phrase-pinyin-data@v0.19.0/pinyin.txt'
    },
    characters: {
        name: 'mozillazg/pinyin-data',
        version: 'v0.15.0',
        url: 'https://cdn.jsdelivr.net/gh/mozillazg/pinyin-data@v0.15.0/pinyin.txt'
    },
    commonWords: {
        name: 'fxsjy/jieba',
        version: 'master',
        url: 'https://cdn.jsdelivr.net/gh/fxsjy/jieba@master/jieba/dict.txt'
    },
    internetWords: {
        name: 'thunlp/THUOCL IT',
        version: 'master',
        url: 'https://cdn.jsdelivr.net/gh/thunlp/THUOCL@master/data/THUOCL_IT.txt'
    },
    idioms: {
        name: 'thunlp/THUOCL chengyu',
        version: 'master',
        url: 'https://cdn.jsdelivr.net/gh/thunlp/THUOCL@master/data/THUOCL_chengyu.txt'
    },
    english: {
        name: 'aparrish/wordfreq-en-25000',
        version: 'main (single published dataset)',
        url: 'https://cdn.jsdelivr.net/gh/aparrish/wordfreq-en-25000@main/wordfreq-en-25000-log.json'
    },
    englishDictionary: {
        name: 'dwyl/english-words',
        version: '8179fe68775df3f553ef19520db065228e65d1d3',
        url: 'https://cdn.jsdelivr.net/gh/dwyl/english-words@8179fe68775df3f553ef19520db065228e65d1d3/words_alpha.txt'
    },
    localNetworkWords: {
        name: 'RSDB network words',
        version: 'local',
        file: 'tools/network-words.txt'
    }
};

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(toolDirectory, '..', 'input-method-data.js');
const networkWordsPath = path.resolve(toolDirectory, 'network-words.txt');
const HAN_WORD_PATTERN = /^\p{Script=Han}{2,20}$/u;
const HAN_CHARACTER_PATTERN = /^\p{Script=Han}$/u;

async function download(url) {
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            console.error(`[dictionary] downloading ${url} (attempt ${attempt})`);
            const response = await fetch(url, {
                headers: { 'user-agent': 'RSDB-input-method-data-builder' },
                signal: AbortSignal.timeout(45000)
            });
            if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
            const content = await response.text();
            console.error(`[dictionary] downloaded ${url} (${Buffer.byteLength(content)} bytes)`);
            return content;
        } catch (error) {
            lastError = error;
            console.error(`[dictionary] failed ${url}: ${error.message}`);
            if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1200));
        }
    }
    throw lastError;
}

function normalizePinyin(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[üǖǘǚǜ]/g, 'v')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/u:/g, 'v')
        .replace(/[^a-zv]/g, '');
}

function decodeCharacterValue(value) {
    const matches = Array.from(String(value || '').matchAll(/U\+([0-9A-F]{4,6})/gi));
    if (!matches.length) return String(value || '');
    return matches.map(match => String.fromCodePoint(Number.parseInt(match[1], 16))).join('');
}

function splitSourceLine(rawLine) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return null;
    const content = line.replace(/\s+#.*$/, '').trim();
    const separator = content.indexOf(':');
    if (separator <= 0) return null;
    return {
        value: content.slice(0, separator).trim(),
        readings: content.slice(separator + 1).trim()
    };
}

function parseCharacterLines(source) {
    const candidates = new Map();
    const pronunciations = new Map();

    source.split(/\r?\n/).forEach(rawLine => {
        const parsed = splitSourceLine(rawLine);
        if (!parsed) return;
        const characters = Array.from(decodeCharacterValue(parsed.value)).filter(character => HAN_CHARACTER_PATTERN.test(character));
        if (!characters.length) return;

        parsed.readings.split(',').forEach(reading => {
            const code = normalizePinyin(reading);
            if (!code) return;
            if (!candidates.has(code)) candidates.set(code, []);
            const codeCandidates = candidates.get(code);
            characters.forEach(character => {
                if (!codeCandidates.includes(character)) codeCandidates.push(character);
                if (!pronunciations.has(character)) pronunciations.set(character, []);
                const characterReadings = pronunciations.get(character);
                if (!characterReadings.includes(code)) characterReadings.push(code);
            });
        });
    });

    return { candidates, pronunciations };
}

function parsePhraseLines(source) {
    const records = [];
    const readingsByWord = new Map();

    source.split(/\r?\n/).forEach(rawLine => {
        const parsed = splitSourceLine(rawLine);
        if (!parsed || !HAN_WORD_PATTERN.test(parsed.value)) return;
        parsed.readings.split(',').forEach(reading => {
            const syllables = reading.trim().split(/\s+/).map(normalizePinyin).filter(Boolean);
            if (syllables.length !== Array.from(parsed.value).length) return;
            const code = syllables.join('');
            if (!code) return;
            const record = { word: parsed.value, code, syllables };
            records.push(record);
            if (!readingsByWord.has(parsed.value)) readingsByWord.set(parsed.value, []);
            const existing = readingsByWord.get(parsed.value);
            if (!existing.some(item => item.code === code)) existing.push(record);
        });
    });

    return { records, readingsByWord };
}

function parseEnglishWords(source) {
    const rows = JSON.parse(source);
    const seen = new Set();
    const words = [];
    rows.forEach(row => {
        const word = String(Array.isArray(row) ? row[0] : '').toLowerCase().trim();
        if (!/^[a-z]+(?:'[a-z]+)?$/.test(word) || seen.has(word)) return;
        seen.add(word);
        words.push(word);
    });
    return words;
}

function parseEnglishDictionary(source) {
    return Array.from(new Set(source
        .split(/\r?\n/)
        .map(word => word.trim().toLowerCase())
        .filter(word => /^[a-z]+(?:'[a-z]+)?$/.test(word))))
        .sort();
}

function parseJiebaWords(source) {
    const records = [];
    source.split(/\r?\n/).forEach(rawLine => {
        const parts = rawLine.trim().split(/\s+/);
        const word = parts[0] || '';
        const frequency = Number(parts[1]) || 1;
        if (!/^\p{Script=Han}{1,20}$/u.test(word)) return;
        records.push({ word, frequency });
    });
    return records;
}

function parseThuoclWords(source) {
    const records = [];
    source.split(/\r?\n/).forEach(rawLine => {
        const parts = rawLine.trim().split(/\s+/);
        const word = parts[0] || '';
        const frequency = Number(parts[1]) || 1;
        if (!HAN_WORD_PATTERN.test(word)) return;
        records.push({ word, frequency });
    });
    return records;
}

function parseLocalNetworkWords(source) {
    const records = [];
    source.split(/\r?\n/).forEach((rawLine, index) => {
        const line = rawLine.replace(/\s+#.*$/, '').trim();
        if (!line || line.startsWith('#')) return;
        const parts = line.split(/\s+/);
        const word = parts[0] || '';
        if (!HAN_WORD_PATTERN.test(word)) return;
        const frequency = Number(parts[1]) || Math.max(1, 100000 - index);
        records.push({ word, frequency });
    });
    return records;
}

function deriveWordReadings(word, phraseReadings, characterReadings) {
    const exact = phraseReadings.get(word);
    if (exact?.length) return exact;
    const syllables = [];
    for (const character of Array.from(word)) {
        const reading = characterReadings.get(character)?.[0];
        if (!reading) return [];
        syllables.push(reading);
    }
    return [{ word, code: syllables.join(''), syllables }];
}

function createWeightedIndex() {
    const entries = new Map();
    let sequence = 0;

    function add(code, value, weight) {
        if (!code || !value) return;
        if (!entries.has(code)) entries.set(code, new Map());
        const values = entries.get(code);
        const existing = values.get(value);
        if (existing) {
            existing.weight = Math.max(existing.weight, Number(weight) || 0);
            return;
        }
        values.set(value, { weight: Number(weight) || 0, sequence: sequence++ });
    }

    function toObject() {
        const output = {};
        Array.from(entries.keys()).sort().forEach(code => {
            output[code] = Array.from(entries.get(code).entries())
                .sort((left, right) => right[1].weight - left[1].weight || left[1].sequence - right[1].sequence)
                .map(([value]) => value);
        });
        return output;
    }

    return { add, toObject };
}

function addWeightedWord(word, weight, phraseIndex, abbreviationIndex, phraseReadings, characterReadings) {
    const readings = deriveWordReadings(word, phraseReadings, characterReadings);
    if (!readings.length) return false;
    readings.forEach(reading => {
        phraseIndex.add(reading.code, word, weight);
        if (reading.syllables.length > 1) {
            const abbreviation = reading.syllables.map(syllable => syllable[0]).join('');
            if (abbreviation.length > 1) abbreviationIndex.add(abbreviation, word, weight);
        }
    });
    return true;
}

function sortCharacterCandidates(characterCandidates, characterFrequency) {
    const output = {};
    Array.from(characterCandidates.keys()).sort().forEach(code => {
        output[code] = characterCandidates.get(code)
            .map((character, index) => ({ character, index, weight: characterFrequency.get(character) || 0 }))
            .sort((left, right) => right.weight - left.weight || left.index - right.index)
            .map(item => item.character)
            .join('');
    });
    return output;
}

const [phraseSource, characterSource, commonWordSource, internetWordSource, idiomSource, englishSource, englishDictionarySource, localNetworkSource] = await Promise.all([
    download(SOURCES.phrases.url),
    download(SOURCES.characters.url),
    download(SOURCES.commonWords.url),
    download(SOURCES.internetWords.url),
    download(SOURCES.idioms.url),
    download(SOURCES.english.url),
    download(SOURCES.englishDictionary.url),
    readFile(networkWordsPath, 'utf8')
]);

const { candidates: characterCandidates, pronunciations: characterReadings } = parseCharacterLines(characterSource);
const { records: phraseRecords, readingsByWord: phraseReadings } = parsePhraseLines(phraseSource);
const commonWordRecords = parseJiebaWords(commonWordSource);
const internetWordRecords = parseThuoclWords(internetWordSource);
const idiomRecords = parseThuoclWords(idiomSource);
const localNetworkWordRecords = parseLocalNetworkWords(localNetworkSource);
const englishWords = parseEnglishWords(englishSource);
const englishDictionaryWords = parseEnglishDictionary(englishDictionarySource);
const phraseIndex = createWeightedIndex();
const abbreviationIndex = createWeightedIndex();
const characterFrequency = new Map();

phraseRecords.forEach((record, index) => {
    const weight = Math.max(1, phraseRecords.length - index);
    phraseIndex.add(record.code, record.word, weight);
    const abbreviation = record.syllables.map(syllable => syllable[0]).join('');
    if (abbreviation.length > 1) abbreviationIndex.add(abbreviation, record.word, weight);
});

const addedCommonWords = new Set();
commonWordRecords.forEach(({ word, frequency }) => {
    if (Array.from(word).length === 1) {
        characterFrequency.set(word, Math.max(characterFrequency.get(word) || 0, frequency));
        return;
    }
    if (addWeightedWord(word, frequency * 10, phraseIndex, abbreviationIndex, phraseReadings, characterReadings)) {
        addedCommonWords.add(word);
    }
});

const addedInternetWords = new Set();
internetWordRecords.forEach(({ word, frequency }) => {
    if (addWeightedWord(word, 20000000 + frequency, phraseIndex, abbreviationIndex, phraseReadings, characterReadings)) {
        addedInternetWords.add(word);
    }
});

const addedIdioms = new Set();
idiomRecords.forEach(({ word, frequency }) => {
    if (addWeightedWord(word, 10000000 + frequency, phraseIndex, abbreviationIndex, phraseReadings, characterReadings)) {
        addedIdioms.add(word);
    }
});

const addedLocalNetworkWords = new Set();
localNetworkWordRecords.forEach(({ word, frequency }) => {
    if (addWeightedWord(word, 50000000 + frequency, phraseIndex, abbreviationIndex, phraseReadings, characterReadings)) {
        addedLocalNetworkWords.add(word);
    }
});

const pinyinCharacters = sortCharacterCandidates(characterCandidates, characterFrequency);
const pinyinPhrases = phraseIndex.toObject();
const pinyinAbbreviations = abbreviationIndex.toObject();
const uniqueCharacters = new Set(Object.values(pinyinCharacters).flatMap(value => Array.from(value)));
const uniquePhrases = new Set(Object.values(pinyinPhrases).flat());

const payload = {
    generatedAt: new Date().toISOString(),
    sources: SOURCES,
    counts: {
        englishWords: new Set([...englishWords, ...englishDictionaryWords]).size,
        englishFrequencyWords: englishWords.length,
        englishDictionaryWords: englishDictionaryWords.length,
        pinyinCodes: Object.keys(pinyinCharacters).length,
        uniqueCharacters: uniqueCharacters.size,
        phraseCodes: Object.keys(pinyinPhrases).length,
        abbreviationCodes: Object.keys(pinyinAbbreviations).length,
        phrases: uniquePhrases.size,
        commonWordsAdded: addedCommonWords.size,
        internetWordsAdded: addedInternetWords.size,
        idiomsAdded: addedIdioms.size,
        localNetworkWordsAdded: addedLocalNetworkWords.size
    },
    englishWords,
    englishDictionaryWords,
    pinyinCharacters,
    pinyinPhrases,
    pinyinAbbreviations
};

const output = `/* Generated by tools/build-input-method-data.mjs. See input-method-NOTICES.md. */\n` +
    `(function(global){'use strict';global.RSDBInputMethodData=${JSON.stringify(payload)};})(window);\n`;

await writeFile(outputPath, output, 'utf8');
console.log(JSON.stringify({ outputPath, bytes: Buffer.byteLength(output), counts: payload.counts }, null, 2));
