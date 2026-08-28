(function (global) {
    'use strict';

    // Lightweight browser-side pinyin intelligence. The segmentation shape is
    // informed by pinyin-split (ISC); fuzzy lookup uses bounded Damerau edits,
    // while the application dictionaries remain the source of candidate text.
    const INITIAL_PATTERN = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])$/;

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

    function boundedDamerauDistance(left, right, maximum) {
        if (left === right) return 0;
        if (Math.abs(left.length - right.length) > maximum) return maximum + 1;
        const previousPrevious = new Array(right.length + 1).fill(0);
        let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
        for (let row = 1; row <= left.length; row++) {
            const current = [row];
            let rowMinimum = row;
            for (let column = 1; column <= right.length; column++) {
                const substitution = previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1);
                let value = Math.min(previous[column] + 1, current[column - 1] + 1, substitution);
                if (
                    row > 1 && column > 1
                    && left[row - 1] === right[column - 2]
                    && left[row - 2] === right[column - 1]
                ) {
                    value = Math.min(value, previousPrevious[column - 2] + 1);
                }
                current[column] = value;
                rowMinimum = Math.min(rowMinimum, value);
            }
            if (rowMinimum > maximum) return maximum + 1;
            for (let index = 0; index < previous.length; index++) previousPrevious[index] = previous[index];
            previous = current;
        }
        return previous[right.length];
    }

    function createPinyinEngine(sourceSyllables) {
        const syllables = Array.from(new Set((sourceSyllables || [])
            .map(value => normalizeComposition(value).replace(/'/g, ''))
            .filter(Boolean)))
            .sort((left, right) => right.length - left.length || left.localeCompare(right));
        const syllableSet = new Set(syllables);
        const byFirst = {};
        const prefixSet = new Set();
        syllables.forEach(syllable => {
            const first = syllable[0];
            if (!byFirst[first]) byFirst[first] = [];
            byFirst[first].push(syllable);
            for (let length = 1; length < syllable.length; length++) prefixSet.add(syllable.slice(0, length));
        });

        const segmentCache = new Map();
        const correctionCache = new Map();

        function initialAt(raw, offset) {
            const pair = raw.slice(offset, offset + 2);
            if (pair === 'zh' || pair === 'ch' || pair === 'sh') return pair;
            const single = raw[offset] || '';
            return INITIAL_PATTERN.test(single) ? single : '';
        }

        function isBetter(candidate, current) {
            if (!current) return true;
            if (candidate.unknown !== current.unknown) return candidate.unknown < current.unknown;
            if (candidate.partialCount !== current.partialCount) return candidate.partialCount < current.partialCount;
            if (candidate.initialCount !== current.initialCount) return candidate.initialCount < current.initialCount;
            if (candidate.syllableScore !== current.syllableScore) return candidate.syllableScore > current.syllableScore;
            return candidate.tokens.length < current.tokens.length;
        }

        function segmentPart(rawValue) {
            const raw = normalizeComposition(rawValue).replace(/'/g, '');
            if (!raw) return { tokens: [], unknown: 0, partialCount: 0, initialCount: 0, syllableScore: 0 };
            const cached = segmentCache.get(raw);
            if (cached) return cached;
            if (syllableSet.has(raw)) {
                const exact = { tokens: [raw], unknown: 0, partialCount: 0, initialCount: 0, syllableScore: raw.length * raw.length };
                segmentCache.set(raw, exact);
                return exact;
            }
            const memo = new Map();
            function walk(offset) {
                if (offset >= raw.length) return { tokens: [], unknown: 0, partialCount: 0, initialCount: 0, syllableScore: 0 };
                if (memo.has(offset)) return memo.get(offset);
                let best = null;
                for (const syllable of byFirst[raw[offset]] || []) {
                    if (!raw.startsWith(syllable, offset)) continue;
                    const tail = walk(offset + syllable.length);
                    const candidate = {
                        tokens: [syllable, ...tail.tokens],
                        unknown: tail.unknown,
                        partialCount: tail.partialCount,
                        initialCount: tail.initialCount,
                        syllableScore: tail.syllableScore + syllable.length * syllable.length
                    };
                    if (isBetter(candidate, best)) best = candidate;
                }
                const initial = initialAt(raw, offset);
                if (initial) {
                    const tail = walk(offset + initial.length);
                    const candidate = {
                        tokens: [initial, ...tail.tokens],
                        unknown: tail.unknown,
                        partialCount: tail.partialCount,
                        initialCount: tail.initialCount + 1,
                        syllableScore: tail.syllableScore
                    };
                    if (isBetter(candidate, best)) best = candidate;
                }
                const remainder = raw.slice(offset);
                if (prefixSet.has(remainder)) {
                    const candidate = {
                        tokens: [remainder],
                        unknown: 0,
                        partialCount: 1,
                        initialCount: 0,
                        syllableScore: Math.max(0, remainder.length * remainder.length - 1)
                    };
                    if (isBetter(candidate, best)) best = candidate;
                }
                if (!best) {
                    const tail = walk(offset + 1);
                    best = {
                        tokens: [raw[offset], ...tail.tokens],
                        unknown: tail.unknown + 1,
                        partialCount: tail.partialCount,
                        initialCount: tail.initialCount,
                        syllableScore: tail.syllableScore
                    };
                }
                memo.set(offset, best);
                return best;
            }
            const result = walk(0);
            if (segmentCache.size > 1000) segmentCache.clear();
            segmentCache.set(raw, result);
            return result;
        }

        function format(value) {
            const normalized = normalizeComposition(value);
            if (!normalized) return '';
            const formatted = normalized
                .split("'")
                .filter(Boolean)
                .flatMap(part => segmentPart(part).tokens)
                .join("'");
            return normalized.endsWith("'") ? `${formatted}'` : formatted;
        }

        function shouldTryCorrection(analysis, raw) {
            if (!raw || raw.length < 3 || analysis.unknown > 0 || analysis.partialCount > 0) return raw.length >= 3;
            const singleTokens = analysis.tokens.filter(token => token.length === 1).length;
            if (singleTokens >= 2) return true;
            if (analysis.initialCount !== 1 || raw.length < 4) return false;
            const initialIndex = analysis.tokens.findIndex(token => INITIAL_PATTERN.test(token));
            if (initialIndex < 0) return false;
            if (initialIndex === analysis.tokens.length - 1) {
                const previous = analysis.tokens[initialIndex - 1] || '';
                return previous.length <= 3 && raw.length >= 5;
            }
            return true;
        }

        function fuzzySegmentPart(rawValue, limit) {
            const raw = normalizeComposition(rawValue).replace(/'/g, '');
            const exactAnalysis = segmentPart(raw);
            if (!shouldTryCorrection(exactAnalysis, raw)) return [];
            const memo = new Map();
            const keepBest = values => {
                const unique = new Map();
                values.forEach(value => {
                    const key = value.tokens.join("'");
                    const existing = unique.get(key);
                    if (!existing || value.score < existing.score) unique.set(key, value);
                });
                return Array.from(unique.values())
                    .sort((left, right) => left.score - right.score || left.edits - right.edits || left.tokens.length - right.tokens.length)
                    .slice(0, Math.max(8, limit * 3));
            };
            function walk(offset) {
                if (offset === raw.length) return [{ tokens: [], edits: 0, score: 0 }];
                if (memo.has(offset)) return memo.get(offset);
                const candidates = [];
                for (const syllable of syllables) {
                    const minimumLength = Math.max(1, syllable.length - 1);
                    const maximumLength = Math.min(raw.length - offset, syllable.length + 1);
                    for (let length = minimumLength; length <= maximumLength; length++) {
                        const source = raw.slice(offset, offset + length);
                        const distance = boundedDamerauDistance(source, syllable, 1);
                        if (distance > 1) continue;
                        for (const tail of walk(offset + length)) {
                            const edits = distance + tail.edits;
                            if (edits > 1) continue;
                            candidates.push({
                                tokens: [syllable, ...tail.tokens],
                                edits,
                                score: tail.score + distance * 1.1 + 0.04 - Math.min(0.18, syllable.length * 0.02)
                            });
                        }
                    }
                }
                const result = keepBest(candidates);
                memo.set(offset, result);
                return result;
            }
            const exactFormatted = exactAnalysis.tokens.join("'");
            return walk(0)
                .filter(candidate => candidate.edits > 0 && candidate.tokens.join("'") !== exactFormatted)
                .map(candidate => ({
                    value: candidate.tokens.join("'"),
                    raw: candidate.tokens.join(''),
                    segments: candidate.tokens.length,
                    distance: candidate.edits,
                    score: candidate.score
                }))
                .slice(0, limit);
        }

        function getCorrections(value, limit = 4) {
            const normalized = normalizeComposition(value);
            if (!normalized) return [];
            const maximum = Math.max(1, Math.min(8, Number(limit) || 4));
            const cacheKey = `${normalized}:${maximum}`;
            const cached = correctionCache.get(cacheKey);
            if (cached) return cached.map(item => ({ ...item }));
            const parts = normalized.split("'").filter(Boolean);
            let combinations = [{ values: [], distance: 0, score: 0 }];
            for (const part of parts) {
                const exact = segmentPart(part);
                const choices = [
                    { value: exact.tokens.join("'"), raw: part, segments: exact.tokens.length, distance: 0, score: 0 },
                    ...fuzzySegmentPart(part, maximum)
                ];
                const next = [];
                combinations.forEach(prefix => choices.forEach(choice => {
                    if (prefix.distance + choice.distance > 1) return;
                    next.push({
                        values: [...prefix.values, choice.value],
                        distance: prefix.distance + choice.distance,
                        score: prefix.score + choice.score
                    });
                }));
                combinations = next.sort((left, right) => left.score - right.score).slice(0, maximum * 4);
            }
            const exactFormatted = format(normalized).replace(/'+$/g, '');
            const seen = new Set();
            const result = combinations
                .filter(candidate => candidate.distance > 0)
                .map(candidate => {
                    const formatted = candidate.values.filter(Boolean).join("'");
                    return {
                        value: formatted,
                        raw: formatted.replace(/'/g, ''),
                        segments: formatted.split("'").filter(Boolean).length,
                        distance: candidate.distance,
                        score: candidate.score
                    };
                })
                .filter(candidate => candidate.value && candidate.value !== exactFormatted && !seen.has(candidate.value) && seen.add(candidate.value))
                .sort((left, right) => left.distance - right.distance || left.score - right.score || left.segments - right.segments)
                .slice(0, maximum);
            if (correctionCache.size > 500) correctionCache.clear();
            correctionCache.set(cacheKey, result);
            return result.map(item => ({ ...item }));
        }

        return Object.freeze({
            format,
            getCorrections,
            segment(value) {
                return format(value).split("'").filter(Boolean);
            },
            analyze(value) {
                const normalized = normalizeComposition(value);
                const parts = normalized.split("'").filter(Boolean).flatMap(part => segmentPart(part).tokens);
                return { normalized, formatted: format(normalized), parts };
            }
        });
    }

    global.RSDBImeIntelligence = Object.freeze({
        createPinyinEngine,
        boundedDamerauDistance,
        normalizeComposition
    });
})(typeof window !== 'undefined' ? window : globalThis);
