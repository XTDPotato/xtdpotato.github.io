(function (global) {
    'use strict';

    const CACHE_SCHEMA_VERSION = 3;
    const SETTINGS_KEY = 'rsdb_app_settings_v1';
    const COOKIE_KEY = 'rsdb_dictionary_cache_v1';
    const SOURCE_OPTIONS = Object.freeze({
        auto: { name: '镜像优先（自动回退）' },
        gcore: { name: 'jsDelivr Gcore 镜像' },
        fastly: { name: 'jsDelivr Fastly 镜像' },
        jsdelivr: { name: 'jsDelivr 全球 CDN' },
        github: { name: 'GitHub 原始地址' },
        custom: { name: '自定义地址' }
    });
    const SOURCE_PATHS = Object.freeze({
        chinese: {
            name: '中文大型词组',
            repository: 'mozillazg/phrase-pinyin-data',
            ref: 'master',
            path: 'large_pinyin.txt',
            license: 'MIT'
        },
        englishFrequency: {
            name: '英文高频排序',
            repository: 'hermitdave/FrequencyWords',
            ref: 'master',
            path: 'content/2018/en/en_50k.txt',
            license: 'CC BY-SA 4.0 数据'
        },
        englishComprehensive: {
            name: '英文完整词典',
            repository: 'dwyl/english-words',
            ref: 'master',
            path: 'words_alpha.txt',
            license: 'Unlicense'
        }
    });

    function buildJsDelivrUrl(host, source) {
        return `https://${host}/gh/${source.repository}@${source.ref}/${source.path}`;
    }

    function buildGithubUrl(source) {
        return `https://raw.githubusercontent.com/${source.repository}/${source.ref}/${source.path}`;
    }

    const SOURCES = Object.freeze(Object.fromEntries(Object.entries(SOURCE_PATHS).map(([key, source]) => [key, {
        name: source.name,
        url: buildJsDelivrUrl('cdn.jsdelivr.net', source),
        project: source.repository,
        license: source.license
    }])));

    const status = {
        chinese: { state: 'idle', count: 0, error: '', cached: false, sourceName: '' },
        englishFrequency: { state: 'idle', count: 0, error: '', cached: false, sourceName: '' },
        englishComprehensive: { state: 'idle', count: 0, error: '', cached: false, sourceName: '' }
    };
    const resultCache = {
        chinese: new Map(),
        english: new Map()
    };
    const pending = new Set();
    let worker = null;
    let workerUrl = '';
    let preloadStarted = false;
    let configuration = loadStoredConfiguration();

    function normalizeQuery(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[’‘`]/g, "'")
            .replace(/[üǖǘǚǜ]/g, 'v')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/u:/g, 'v')
            .replace(/[^a-zv]/g, '');
    }

    function sanitizeHttpUrl(value) {
        const text = String(value || '').trim();
        if (!text) return '';
        try {
            const parsed = new URL(text, global.location.href);
            return /^https?:$/.test(parsed.protocol) ? parsed.href : '';
        } catch (error) {
            return '';
        }
    }

    function sanitizeConfiguration(value) {
        const sourceMode = Object.prototype.hasOwnProperty.call(SOURCE_OPTIONS, value?.sourceMode)
            ? value.sourceMode : 'auto';
        const rawCustom = value?.customSources && typeof value.customSources === 'object'
            ? value.customSources : {};
        return {
            sourceMode,
            customSources: Object.fromEntries(Object.keys(SOURCE_PATHS).map(key => [key, sanitizeHttpUrl(rawCustom[key])]))
        };
    }

    function loadStoredConfiguration() {
        try {
            const parsed = JSON.parse(global.localStorage.getItem(SETTINGS_KEY) || '{}');
            return sanitizeConfiguration({
                sourceMode: parsed.remoteDictionarySource,
                customSources: parsed.remoteDictionaryCustomSources
            });
        } catch (error) {
            return sanitizeConfiguration({});
        }
    }

    function configurationSignature(value) {
        return JSON.stringify(sanitizeConfiguration(value));
    }

    function cloneStatus() {
        return Object.fromEntries(Object.entries(status).map(([key, value]) => [key, { ...value }]));
    }

    function dispatchStatus() {
        global.dispatchEvent(new CustomEvent('rsdb-remote-dictionary-status', {
            detail: { status: cloneStatus(), configuration: { ...configuration } }
        }));
    }

    function updateStatus(key, next) {
        if (!status[key]) return;
        status[key] = {
            state: next.state || status[key].state,
            count: Number(next.count) || 0,
            error: String(next.error || ''),
            cached: next.cached === true,
            sourceName: String(next.sourceName || '')
        };
        dispatchStatus();
    }

    function writeCacheCookie(message) {
        try {
            const marker = {
                v: CACHE_SCHEMA_VERSION,
                source: configuration.sourceMode,
                savedAt: Number(message.savedAt) || Date.now()
            };
            document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(marker))}; Max-Age=31536000; Path=/; SameSite=Lax`;
        } catch (error) {}
    }

    function remoteWorkerMain() {
        const CACHE_DB_NAME = 'rsdb_remote_dictionary_cache_v1';
        const CACHE_STORE_NAME = 'dictionaries';
        const CACHE_SCHEMA_VERSION = 3;
        const sourcePaths = {
            chinese: { repository: 'mozillazg/phrase-pinyin-data', ref: 'master', path: 'large_pinyin.txt' },
            englishFrequency: { repository: 'hermitdave/FrequencyWords', ref: 'master', path: 'content/2018/en/en_50k.txt' },
            englishComprehensive: { repository: 'dwyl/english-words', ref: 'master', path: 'words_alpha.txt' }
        };
        const data = {
            chineseCodes: [],
            chinesePhrases: new Map(),
            englishFrequency: [],
            englishWords: [],
            englishRanks: new Map(),
            englishDeleteIndex: null,
            englishCorrectionCache: new Map()
        };
        const loads = new Map();
        let configuration = { sourceMode: 'auto', customSources: {} };

        function normalize(value) {
            return String(value || '')
                .toLowerCase()
                .replace(/[’‘`]/g, "'")
                .replace(/[üǖǘǚǜ]/g, 'v')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/u:/g, 'v')
                .replace(/[^a-zv]/g, '');
        }

        function lowerBound(values, target) {
            let low = 0;
            let high = values.length;
            while (low < high) {
                const middle = (low + high) >> 1;
                if (values[middle] < target) low = middle + 1;
                else high = middle;
            }
            return low;
        }

        function boundedDamerauDistance(left, right, maximum) {
            if (left === right) return 0;
            if (Math.abs(left.length - right.length) > maximum) return maximum + 1;
            let previousPrevious = new Array(right.length + 1).fill(0);
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
                previousPrevious = previous;
                previous = current;
            }
            return previous[right.length];
        }

        function oneDeleteVariants(value) {
            const variants = new Set([value]);
            for (let index = 0; index < value.length; index++) {
                variants.add(value.slice(0, index) + value.slice(index + 1));
            }
            return variants;
        }

        function rebuildEnglishRanks() {
            data.englishRanks = new Map();
            data.englishFrequency.forEach((word, index) => {
                if (!data.englishRanks.has(word)) data.englishRanks.set(word, index);
            });
            data.englishDeleteIndex = null;
            data.englishCorrectionCache.clear();
        }

        function ensureEnglishDeleteIndex() {
            if (data.englishDeleteIndex) return data.englishDeleteIndex;
            const index = new Map();
            data.englishFrequency.slice(0, 50000).forEach(word => {
                if (word.length < 2 || word.length > 24) return;
                oneDeleteVariants(word).forEach(key => {
                    const values = index.get(key) || [];
                    if (values.length < 24 && !values.includes(word)) values.push(word);
                    index.set(key, values);
                });
            });
            data.englishDeleteIndex = index;
            return index;
        }

        function suggestEnglishCorrections(query, limit) {
            const maximum = query.length >= 5 ? 2 : 1;
            const cacheKey = `${query}:${maximum}:${limit}`;
            const cached = data.englishCorrectionCache.get(cacheKey);
            if (cached) return cached.slice();
            const deleteIndex = ensureEnglishDeleteIndex();
            const candidates = new Set();
            oneDeleteVariants(query).forEach(key => {
                (deleteIndex.get(key) || []).forEach(word => candidates.add(word));
            });
            const result = Array.from(candidates)
                .filter(word => word !== query && Math.abs(word.length - query.length) <= maximum)
                .map(word => ({
                    word,
                    distance: boundedDamerauDistance(query, word, maximum),
                    rank: data.englishRanks.get(word) ?? Number.MAX_SAFE_INTEGER
                }))
                .filter(item => item.distance <= maximum)
                .sort((left, right) => left.distance - right.distance || left.rank - right.rank || left.word.localeCompare(right.word))
                .slice(0, limit)
                .map(item => item.word);
            if (data.englishCorrectionCache.size > 500) data.englishCorrectionCache.clear();
            data.englishCorrectionCache.set(cacheKey, result);
            return result.slice();
        }

        function segmentEnglishCompound(query) {
            if (query.length < 8 || query.length > 64 || data.englishRanks.has(query)) return '';
            const best = new Array(query.length + 1).fill(null);
            best[0] = { score: 0, words: [] };
            for (let end = 1; end <= query.length; end++) {
                const startMinimum = Math.max(0, end - 24);
                for (let start = startMinimum; start < end; start++) {
                    const previous = best[start];
                    if (!previous) continue;
                    const word = query.slice(start, end);
                    const rank = data.englishRanks.get(word);
                    if (rank == null || (word.length === 1 && word !== 'a' && word !== 'i')) continue;
                    const score = previous.score + Math.log(rank + 2) + 1.4 - Math.min(1.2, word.length * 0.08);
                    if (!best[end] || score < best[end].score) best[end] = { score, words: [...previous.words, word] };
                }
            }
            const result = best[query.length];
            return result?.words?.length >= 2 ? result.words.join(' ') : '';
        }

        function simpleHash(value) {
            let hash = 2166136261;
            const text = String(value || '');
            for (let index = 0; index < text.length; index++) {
                hash ^= text.charCodeAt(index);
                hash = Math.imul(hash, 16777619);
            }
            return (hash >>> 0).toString(36);
        }

        function sourceUrls(key) {
            const source = sourcePaths[key];
            if (!source) return [];
            const jsdelivr = host => `https://${host}/gh/${source.repository}@${source.ref}/${source.path}`;
            const github = `https://raw.githubusercontent.com/${source.repository}/${source.ref}/${source.path}`;
            const custom = String(configuration.customSources?.[key] || '').trim();
            const profiles = {
                auto: [jsdelivr('gcore.jsdelivr.net'), jsdelivr('fastly.jsdelivr.net'), jsdelivr('cdn.jsdelivr.net'), github],
                gcore: [jsdelivr('gcore.jsdelivr.net')],
                fastly: [jsdelivr('fastly.jsdelivr.net')],
                jsdelivr: [jsdelivr('cdn.jsdelivr.net')],
                github: [github],
                custom: custom ? [custom] : []
            };
            return profiles[configuration.sourceMode] || profiles.auto;
        }

        function sourceLabel(url) {
            try {
                const host = new URL(url).hostname;
                if (host === 'gcore.jsdelivr.net') return 'Gcore 镜像';
                if (host === 'fastly.jsdelivr.net') return 'Fastly 镜像';
                if (host === 'cdn.jsdelivr.net') return 'jsDelivr CDN';
                if (host === 'raw.githubusercontent.com') return 'GitHub 原始地址';
                return host;
            } catch (error) {
                return '自定义来源';
            }
        }

        function openCacheDatabase() {
            return new Promise((resolve, reject) => {
                if (!self.indexedDB) {
                    resolve(null);
                    return;
                }
                const request = indexedDB.open(CACHE_DB_NAME, 1);
                request.onupgradeneeded = () => {
                    const database = request.result;
                    if (!database.objectStoreNames.contains(CACHE_STORE_NAME)) {
                        database.createObjectStore(CACHE_STORE_NAME, { keyPath: 'key' });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error('无法打开词库缓存'));
            });
        }

        async function readCache(key) {
            const database = await openCacheDatabase().catch(() => null);
            if (!database) return null;
            return new Promise(resolve => {
                const transaction = database.transaction(CACHE_STORE_NAME, 'readonly');
                const request = transaction.objectStore(CACHE_STORE_NAME).get(key);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => resolve(null);
                transaction.oncomplete = () => database.close();
                transaction.onabort = () => database.close();
            });
        }

        async function writeCache(entry) {
            const database = await openCacheDatabase().catch(() => null);
            if (!database) return;
            await new Promise(resolve => {
                const transaction = database.transaction(CACHE_STORE_NAME, 'readwrite');
                transaction.objectStore(CACHE_STORE_NAME).put(entry);
                transaction.oncomplete = resolve;
                transaction.onerror = resolve;
                transaction.onabort = resolve;
            });
            database.close();
        }

        async function fetchText(url, controller) {
            const timeout = setTimeout(() => controller.abort(), 45000);
            try {
                const response = await fetch(url, {
                    cache: 'default',
                    credentials: 'omit',
                    signal: controller.signal
                });
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return await response.text();
            } catch (error) {
                if (error?.name === 'AbortError') throw new Error('连接超过 45 秒');
                throw error;
            } finally {
                clearTimeout(timeout);
            }
        }

        async function fetchWithFallback(urls) {
            const controllers = urls.map(() => new AbortController());
            try {
                const winner = await Promise.any(urls.map(async (url, index) => ({
                    text: await fetchText(url, controllers[index]),
                    url,
                    index
                })));
                controllers.forEach((controller, index) => {
                    if (index !== winner.index) controller.abort();
                });
                return { text: winner.text, url: winner.url };
            } catch (aggregateError) {
                const reasons = Array.isArray(aggregateError?.errors) ? aggregateError.errors : [];
                const errors = urls.map((url, index) => `${sourceLabel(url)}：${reasons[index]?.message || '加载失败'}`);
                throw new Error(errors.join('；') || '没有可用的词库来源');
            } finally {
                controllers.forEach(controller => controller.abort());
            }
        }

        function postStatus(key, state, count, error, cached, sourceName) {
            self.postMessage({
                type: 'status', key, state, count: count || 0, error: error || '',
                cached: cached === true, sourceName: sourceName || ''
            });
        }

        function parseChinese(text) {
            const phrases = new Map();
            let phraseCount = 0;
            text.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed[0] === '#') return;
                const separator = trimmed.indexOf(':');
                if (separator <= 0) return;
                const word = trimmed.slice(0, separator).trim();
                const readings = trimmed.slice(separator + 1).split(',');
                if (!word) return;
                readings.forEach(reading => {
                    const code = normalize(reading.split('#')[0]);
                    if (!code) return;
                    const values = phrases.get(code) || [];
                    if (!values.includes(word)) {
                        values.push(word);
                        phraseCount++;
                    }
                    phrases.set(code, values);
                });
            });
            return { phrases: Array.from(phrases.entries()), codes: Array.from(phrases.keys()).sort(), count: phraseCount };
        }

        function parseEnglishFrequency(text) {
            return { words: Array.from(new Set(text.split(/\r?\n/)
                .map(line => line.trim().split(/\s+/)[0].toLowerCase())
                .filter(word => /^[a-z]+(?:'[a-z]+)?$/.test(word)))) };
        }

        function parseEnglishComprehensive(text) {
            return { words: Array.from(new Set(text.split(/\r?\n/)
                .map(word => word.trim().toLowerCase())
                .filter(word => /^[a-z]+(?:'[a-z]+)?$/.test(word)))).sort() };
        }

        async function loadDataset(key, parser, forceReload) {
            const urls = sourceUrls(key);
            if (!urls.length) throw new Error('自定义词库地址未填写完整');
            const cacheKey = `${CACHE_SCHEMA_VERSION}:${key}:${configuration.sourceMode}:${simpleHash(urls.join('|'))}`;
            if (!forceReload) {
                const cached = await readCache(cacheKey);
                if (cached?.schemaVersion === CACHE_SCHEMA_VERSION && cached.payload) {
                    return { payload: cached.payload, cached: true, sourceUrl: cached.sourceUrl || urls[0], savedAt: cached.savedAt };
                }
            }
            const fetched = await fetchWithFallback(urls);
            const payload = parser(fetched.text);
            const savedAt = Date.now();
            await writeCache({
                key: cacheKey,
                schemaVersion: CACHE_SCHEMA_VERSION,
                dictionaryKey: key,
                sourceMode: configuration.sourceMode,
                sourceUrl: fetched.url,
                savedAt,
                payload
            });
            self.postMessage({ type: 'cache-marker', savedAt });
            return { payload, cached: false, sourceUrl: fetched.url, savedAt };
        }

        function loadOnce(key, loader) {
            if (loads.has(key)) return loads.get(key);
            const promise = Promise.resolve().then(loader).catch(error => {
                loads.delete(key);
                throw error;
            });
            loads.set(key, promise);
            return promise;
        }

        async function ensureChinese(forceReload = false) {
            if (data.chineseCodes.length && !forceReload) return;
            return loadOnce(`chinese:${forceReload ? 'force' : 'normal'}`, async () => {
                postStatus('chinese', 'loading', 0, '', false, '');
                try {
                    const loaded = await loadDataset('chinese', parseChinese, forceReload);
                    data.chinesePhrases = new Map(loaded.payload.phrases || []);
                    data.chineseCodes = Array.isArray(loaded.payload.codes) ? loaded.payload.codes : [];
                    postStatus('chinese', 'ready', loaded.payload.count || 0, '', loaded.cached, sourceLabel(loaded.sourceUrl));
                } catch (error) {
                    postStatus('chinese', 'error', 0, error?.message, false, '');
                    throw error;
                }
            });
        }

        async function ensureEnglish(forceReload = false) {
            if ((data.englishFrequency.length || data.englishWords.length) && !forceReload) return;
            return loadOnce(`english:${forceReload ? 'force' : 'normal'}`, async () => {
                postStatus('englishFrequency', 'loading', 0, '', false, '');
                postStatus('englishComprehensive', 'loading', 0, '', false, '');
                const results = await Promise.allSettled([
                    loadDataset('englishFrequency', parseEnglishFrequency, forceReload),
                    loadDataset('englishComprehensive', parseEnglishComprehensive, forceReload)
                ]);
                if (results[0].status === 'fulfilled') {
                    const loaded = results[0].value;
                    data.englishFrequency = loaded.payload.words || [];
                    postStatus('englishFrequency', 'ready', data.englishFrequency.length, '', loaded.cached, sourceLabel(loaded.sourceUrl));
                } else {
                    postStatus('englishFrequency', 'error', 0, results[0].reason?.message, false, '');
                }
                if (results[1].status === 'fulfilled') {
                    const loaded = results[1].value;
                    data.englishWords = loaded.payload.words || [];
                    postStatus('englishComprehensive', 'ready', data.englishWords.length, '', loaded.cached, sourceLabel(loaded.sourceUrl));
                } else {
                    postStatus('englishComprehensive', 'error', 0, results[1].reason?.message, false, '');
                }
                rebuildEnglishRanks();
                if (!data.englishFrequency.length && !data.englishWords.length) {
                    throw new Error('英文网络词库均加载失败');
                }
            });
        }

        function queryChinese(query, limit) {
            const output = [];
            const seen = new Set();
            const push = (text, code) => {
                if (!text || seen.has(text) || output.length >= limit) return;
                seen.add(text);
                output.push({ text, code, type: '网络词语' });
            };
            (data.chinesePhrases.get(query) || []).forEach(text => push(text, query));
            const start = lowerBound(data.chineseCodes, query);
            let scanned = 0;
            for (let index = start; index < data.chineseCodes.length && output.length < limit; index++) {
                const code = data.chineseCodes[index];
                if (!code.startsWith(query)) break;
                (data.chinesePhrases.get(code) || []).forEach(text => push(text, code));
                scanned++;
                if (scanned >= Math.max(160, limit * 8)) break;
            }
            return output;
        }

        function queryEnglish(query, limit) {
            const output = [];
            const seen = new Set();
            const push = (word, type = '网络英文') => {
                if (!word || seen.has(word) || output.length >= limit) return;
                seen.add(word);
                output.push({ text: word, code: query, type });
            };
            push(query, '当前输入');
            if (query.length >= 3) {
                suggestEnglishCorrections(query, Math.min(6, limit - output.length))
                    .forEach(word => push(word, '拼写纠错'));
            }
            const prefixQuota = Math.min(limit, 16);
            for (let index = 0; index < data.englishFrequency.length && output.length < prefixQuota; index++) {
                const word = data.englishFrequency[index];
                if (word.startsWith(query)) push(word);
            }
            const segmented = segmentEnglishCompound(query);
            if (segmented) push(segmented, '智能分词');
            const start = lowerBound(data.englishWords, query);
            for (let index = start; index < data.englishWords.length && output.length < limit; index++) {
                const word = data.englishWords[index];
                if (!word.startsWith(query)) break;
                push(word);
            }
            return output;
        }

        self.onmessage = async event => {
            const message = event.data || {};
            try {
                if (message.type === 'configure') {
                    configuration = message.configuration || configuration;
                    return;
                }
                if (message.type === 'preload') {
                    if (message.language === 'all') {
                        await Promise.allSettled([
                            ensureChinese(message.force === true),
                            ensureEnglish(message.force === true)
                        ]);
                    } else if (message.language === 'chinese') {
                        await ensureChinese(message.force === true);
                    } else if (message.language === 'english') {
                        await ensureEnglish(message.force === true);
                    }
                    return;
                }
                if (message.type !== 'query') return;
                const query = normalize(message.query);
                const limit = Math.max(12, Math.min(500, Number(message.limit) || 96));
                if (!query) return;
                if (message.language === 'chinese') {
                    await ensureChinese();
                    self.postMessage({ type: 'result', id: message.id, language: 'chinese', query, limit, items: queryChinese(query, limit) });
                } else if (message.language === 'english') {
                    await ensureEnglish();
                    self.postMessage({ type: 'result', id: message.id, language: 'english', query, limit, items: queryEnglish(query, limit) });
                }
            } catch (error) {
                self.postMessage({ type: 'request-error', id: message.id, language: message.language, query: normalize(message.query), error: error?.message });
            }
        };
    }

    function resetRuntimeState() {
        resultCache.chinese.clear();
        resultCache.english.clear();
        pending.clear();
        Object.keys(status).forEach(key => {
            status[key] = { state: 'idle', count: 0, error: '', cached: false, sourceName: '' };
        });
        dispatchStatus();
    }

    function disposeWorker() {
        if (worker) worker.terminate();
        if (workerUrl) URL.revokeObjectURL(workerUrl);
        worker = null;
        workerUrl = '';
        pending.clear();
    }

    function ensureWorker() {
        if (worker) return worker;
        if (typeof Worker !== 'function' || typeof Blob !== 'function') return null;
        const source = '(' + remoteWorkerMain.toString() + ')();';
        workerUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        worker = new Worker(workerUrl);
        worker.onmessage = event => {
            const message = event.data || {};
            if (message.type === 'status') {
                updateStatus(message.key, message);
                return;
            }
            if (message.type === 'cache-marker') {
                writeCacheCookie(message);
                return;
            }
            if (message.type === 'request-error') {
                pending.delete(message.id);
                return;
            }
            if (message.type !== 'result') return;
            pending.delete(message.id);
            const languageCache = resultCache[message.language];
            if (!languageCache) return;
            const items = Array.isArray(message.items) ? message.items : [];
            languageCache.set(message.query, { limit: Number(message.limit) || items.length, items });
            global.dispatchEvent(new CustomEvent('rsdb-remote-ime-update', {
                detail: { language: message.language, query: message.query }
            }));
        };
        worker.onerror = event => {
            console.warn('网络输入法词库线程异常', event.message || event);
        };
        worker.postMessage({ type: 'configure', configuration });
        return worker;
    }

    function request(language, value, limit) {
        const query = normalizeQuery(value);
        if (!query || !resultCache[language]) return;
        const maximum = Math.max(12, Math.min(500, Number(limit) || 96));
        const cached = resultCache[language].get(query);
        if (cached && cached.limit >= maximum) return;
        const pendingKey = `${language}:${query}:${maximum}`;
        if (pending.has(pendingKey)) return;
        const instance = ensureWorker();
        if (!instance) return;
        pending.add(pendingKey);
        instance.postMessage({ type: 'query', id: pendingKey, language, query, limit: maximum });
    }

    function getCached(language, value) {
        const query = normalizeQuery(value);
        return resultCache[language].get(query)?.items || [];
    }

    function preload(language = 'all') {
        const instance = ensureWorker();
        if (!instance) return;
        if (language === 'all' && preloadStarted) return;
        if (language === 'all') preloadStarted = true;
        instance.postMessage({ type: 'preload', language, force: false });
    }

    function reload(language = 'all') {
        disposeWorker();
        resetRuntimeState();
        preloadStarted = language === 'all';
        const instance = ensureWorker();
        instance?.postMessage({ type: 'preload', language, force: true });
    }

    function configure(nextConfiguration) {
        const next = sanitizeConfiguration(nextConfiguration);
        if (configurationSignature(next) === configurationSignature(configuration)) return false;
        configuration = next;
        disposeWorker();
        resetRuntimeState();
        preloadStarted = true;
        const instance = ensureWorker();
        instance?.postMessage({ type: 'preload', language: 'all', force: false });
        return true;
    }

    global.addEventListener('pagehide', disposeWorker, { once: true });
    global.RSDBRemoteInputMethod = Object.freeze({
        sources: SOURCES,
        sourceOptions: SOURCE_OPTIONS,
        getStatus: cloneStatus,
        getConfiguration() {
            return { sourceMode: configuration.sourceMode, customSources: { ...configuration.customSources } };
        },
        configure,
        preload,
        reload,
        requestChinese(value, limit) {
            request('chinese', value, limit);
        },
        requestEnglish(value, limit) {
            request('english', value, limit);
        },
        getCachedChinese(value) {
            return getCached('chinese', value).map(item => item.text);
        },
        getCachedEnglish(value) {
            return getCached('english', value).map(item => item.text);
        },
        getCachedEntries(language, value) {
            return getCached(language, value).map(item => ({ ...item }));
        }
    });

    setTimeout(() => preload('all'), 0);
})(window);
