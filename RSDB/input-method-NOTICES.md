# Input Method Dictionary Notices

`input-method-data.js` is a generated offline dictionary used by the RSDB virtual keyboard.

## Chinese character readings

- Project: `mozillazg/pinyin-data`
- Version: `v0.15.0`
- License: MIT
- Source file: `pinyin.txt`
- Repository: `https://github.com/mozillazg/pinyin-data`

The source stores many entries as Unicode code points such as `U+4E00`. The builder decodes those values with `String.fromCodePoint()` so the generated dictionary contains real Unicode Han characters, including extension-plane characters that have Mandarin readings in the source.

## Chinese phrase readings

- Project: `mozillazg/phrase-pinyin-data`
- Version: `v0.19.0`
- License: MIT
- Source file: `pinyin.txt`
- Repository: `https://github.com/mozillazg/phrase-pinyin-data`

## Common Chinese words and frequencies

- Project: `fxsjy/jieba`
- Dataset: `jieba/dict.txt`
- License: MIT
- Repository: `https://github.com/fxsjy/jieba`

Jieba frequencies are used only to pre-sort offline input candidates. The user's locally learned selection frequency remains the highest-priority runtime signal.

## IT words and idioms

- Project: `thunlp/THUOCL`
- Datasets: `data/THUOCL_IT.txt`, `data/THUOCL_chengyu.txt`
- License: MIT
- Repository: `https://github.com/thunlp/THUOCL`

## RSDB network and domain words

- File: `tools/network-words.txt`
- Maintainer: RSDB project

This local overlay contains newer AI, internet, software, product, input-method, and RSDB manufacturing terms that may not yet appear in the upstream dictionaries.

## English word frequency list

- Project: `aparrish/wordfreq-en-25000`
- Dataset: `wordfreq-en-25000-log.json`
- Upstream data: `wordfreq`
- License: Creative Commons Attribution-ShareAlike 4.0 International
- Repository: `https://github.com/aparrish/wordfreq-en-25000`

## Comprehensive English dictionary

- Project: `dwyl/english-words`
- Dataset: `words_alpha.txt`
- Pinned commit: `8179fe68775df3f553ef19520db065228e65d1d3` (January 5, 2025)
- Repository license: Unlicense
- Repository: `https://github.com/dwyl/english-words`

The frequency list remains the first ranking layer. The comprehensive alphabetic dictionary is searched with a sorted prefix index, so uncommon words are available without linearly scanning the entire list on every keystroke.

The generated dictionary preserves the source ordering so common English words remain ahead of rare words. Chinese phrase candidates are pre-sorted using public dictionary frequencies and local domain weights. Full pinyin, initial abbreviations, Xiaohe double pinyin, and Natural Code double pinyin are combined by the RSDB runtime into one smart Pinyin mode. RSDB-specific manufacturing terms and locally learned user choices are applied as higher-priority overlays at runtime.
