(function () {
    'use strict';

    const DEFAULT_CUSTOM_EFFECT = {
        html: '<div id="effect-root"></div>',
        css: `html, body, #effect-root { position: fixed; inset: 0; margin: 0; overflow: hidden; pointer-events: none; }
.custom-key-burst { position: absolute; width: 18px; height: 18px; border: 3px solid #6750A4; border-radius: 50%; transform: translate(-50%, -50%) scale(.25); animation: custom-key-burst 420ms ease-out forwards; }
@keyframes custom-key-burst { to { opacity: 0; transform: translate(-50%, -50%) scale(3.2); } }`,
        js: `const burst = document.createElement('span');
burst.className = 'custom-key-burst';
burst.style.left = detail.x + 'px';
burst.style.top = detail.y + 'px';
root.appendChild(burst);
setTimeout(() => burst.remove(), 460);`
    };
    const KEYBOARD_STYLE_CSS_EXAMPLE = `.keyboard-key::before {
  border: 1px solid color-mix(in srgb, var(--primary-color) 36%, transparent);
  box-shadow: 0 2px 5px color-mix(in srgb, #000 18%, transparent);
}

.keyboard-key.special::before {
  background: color-mix(in srgb, var(--primary-color) 22%, var(--surface-color));
}

.keyboard-key .key-char {
  font-weight: 700;
}`;
    const DEFAULT_APPEARANCE = {
        keyboardPressEffect: 'material3',
        keyboardSurfaceStyle: 'material3',
        keyboardKeyShape: 'rounded',
        keyboardKeyHeight: 42,
        keyboardKeyGap: 0,
        keyboardKeyRadius: 12,
        keyboardKeyFontSize: 18,
        keyboardSurfaceColor: '',
        keyboardSurfaceColorDark: '',
        keyboardKeyColor: '',
        keyboardKeyColorDark: '',
        keyboardSpecialKeyColor: '',
        keyboardSpecialKeyColorDark: '',
        keyboardKeyTextColor: '',
        keyboardKeyTextColorDark: '',
        keyboardRippleColor: '',
        keyboardRippleColorDark: '',
        keyboardRippleOpacity: 12,
        keyboardPressGlowEnabled: false,
        keyboardPressGlowColor: '#FFFFFF',
        keyboardPressGlowColorDark: '#FFFFFF',
        keyboardPressGlowOpacity: 42,
        keyboardPressGlowSize: 62,
        keyboardCustomStyleCss: '',
        keyboardCustomEffectHtml: DEFAULT_CUSTOM_EFFECT.html,
        keyboardCustomEffectCss: DEFAULT_CUSTOM_EFFECT.css,
        keyboardCustomEffectJs: DEFAULT_CUSTOM_EFFECT.js
    };
    const COLOR_FIELDS = [
        ['keyboardSurfaceColor', 'keyboardSurfaceColorInput', 'keyboardSurfaceColorAuto', '#F7F2FA'],
        ['keyboardKeyColor', 'keyboardKeyColorInput', 'keyboardKeyColorAuto', '#F3EDF7'],
        ['keyboardSpecialKeyColor', 'keyboardSpecialKeyColorInput', 'keyboardSpecialKeyColorAuto', '#E8DEF8'],
        ['keyboardKeyTextColor', 'keyboardKeyTextColorInput', 'keyboardKeyTextColorAuto', '#1D1B20'],
        ['keyboardRippleColor', 'keyboardRippleColorInput', 'keyboardRippleColorAuto', '#6750A4'],
        ['keyboardPressGlowColor', 'keyboardPressGlowColorInput', 'keyboardPressGlowColorAuto', '#FFFFFF']
        ,['keyboardSurfaceColorDark', 'keyboardSurfaceColorDarkInput', 'keyboardSurfaceColorDarkAuto', '#1C1B1F']
        ,['keyboardKeyColorDark', 'keyboardKeyColorDarkInput', 'keyboardKeyColorDarkAuto', '#211F26']
        ,['keyboardSpecialKeyColorDark', 'keyboardSpecialKeyColorDarkInput', 'keyboardSpecialKeyColorDarkAuto', '#36323E']
        ,['keyboardKeyTextColorDark', 'keyboardKeyTextColorDarkInput', 'keyboardKeyTextColorDarkAuto', '#E6E1E5']
        ,['keyboardRippleColorDark', 'keyboardRippleColorDarkInput', 'keyboardRippleColorDarkAuto', '#D0BCFF']
        ,['keyboardPressGlowColorDark', 'keyboardPressGlowColorDarkInput', 'keyboardPressGlowColorDarkAuto', '#FFFFFF']
    ];
    let appearanceDraft = null;
    const pressedPointers = new Map();
    const bounceTimers = new WeakMap();

    function clamp(value, min, max, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : fallback;
    }

    function normalizeAppearance(value = {}) {
        const source = { ...DEFAULT_APPEARANCE, ...(value || {}) };
        const normalized = {
            keyboardPressEffect: ['material3', 'bounce', 'custom'].includes(source.keyboardPressEffect) ? source.keyboardPressEffect : 'material3',
            keyboardSurfaceStyle: ['material3', 'flat'].includes(source.keyboardSurfaceStyle) ? source.keyboardSurfaceStyle : 'material3',
            keyboardKeyShape: ['rounded', 'pill', 'square'].includes(source.keyboardKeyShape) ? source.keyboardKeyShape : 'rounded',
            keyboardKeyHeight: clamp(source.keyboardKeyHeight, 32, 72, 42),
            keyboardKeyGap: clamp(source.keyboardKeyGap, 0, 12, 0),
            keyboardKeyRadius: clamp(source.keyboardKeyRadius, 0, 28, 12),
            keyboardKeyFontSize: clamp(source.keyboardKeyFontSize, 12, 28, 18),
            keyboardRippleOpacity: clamp(source.keyboardRippleOpacity, 4, 32, 12),
            keyboardPressGlowEnabled: source.keyboardPressGlowEnabled === true,
            keyboardPressGlowOpacity: clamp(source.keyboardPressGlowOpacity, 0, 100, 42),
            keyboardPressGlowSize: clamp(source.keyboardPressGlowSize, 20, 100, 62),
            keyboardCustomStyleCss: String(source.keyboardCustomStyleCss || '').slice(0, 50000),
            keyboardCustomEffectHtml: String(source.keyboardCustomEffectHtml || DEFAULT_CUSTOM_EFFECT.html).slice(0, 50000),
            keyboardCustomEffectCss: String(source.keyboardCustomEffectCss || DEFAULT_CUSTOM_EFFECT.css).slice(0, 50000),
            keyboardCustomEffectJs: String(source.keyboardCustomEffectJs || DEFAULT_CUSTOM_EFFECT.js).slice(0, 50000)
        };
        COLOR_FIELDS.forEach(([key]) => {
            const color = String(source[key] || '').trim();
            normalized[key] = /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : '';
        });
        return normalized;
    }

    function hashText(value) {
        let hash = 2166136261;
        const text = String(value || '');
        for (let index = 0; index < text.length; index++) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
    }

    function escapeClosingScript(value) {
        return String(value || '').replace(/<\/script/gi, '<\\/script');
    }

    function hexToRgbChannels(value) {
        const match = /^#([0-9a-f]{6})$/i.exec(String(value || '').trim());
        if (!match) return '';
        const number = Number.parseInt(match[1], 16);
        return `${number >> 16}, ${(number >> 8) & 255}, ${number & 255}`;
    }

    function customEffectSource(settings) {
        const html = settings.keyboardCustomEffectHtml || DEFAULT_CUSTOM_EFFECT.html;
        const css = settings.keyboardCustomEffectCss || DEFAULT_CUSTOM_EFFECT.css;
        const js = escapeClosingScript(settings.keyboardCustomEffectJs || DEFAULT_CUSTOM_EFFECT.js);
        return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{background:transparent!important;} ${css}</style></head><body>${html}<script>
window.addEventListener('message', function (messageEvent) {
    const packet = messageEvent.data;
    if (!packet || packet.type !== 'rsdb-keyboard-effect') return;
    const detail = packet.detail || {};
    const root = document.getElementById('effect-root') || document.body;
    try { (function (detail, root) { ${js}\n }).call(null, detail, root); }
    catch (error) { console.error('Custom keyboard effect failed', error); }
});
</script></body></html>`;
    }

    function ensureCustomEffectFrame(surface, settings) {
        let frame = surface.querySelector(':scope > .keyboard-custom-effect-frame');
        if (settings.keyboardPressEffect !== 'custom') {
            frame?.remove();
            return null;
        }
        if (!frame) {
            frame = document.createElement('iframe');
            frame.className = 'keyboard-custom-effect-frame';
            frame.setAttribute('sandbox', 'allow-scripts');
            frame.setAttribute('aria-hidden', 'true');
            frame.tabIndex = -1;
            frame._rsdbPendingEffects = [];
            frame.addEventListener('load', () => {
                frame.dataset.effectReady = '1';
                const pending = frame._rsdbPendingEffects.splice(0);
                pending.forEach(detail => {
                    frame.contentWindow?.postMessage({ type: 'rsdb-keyboard-effect', detail }, '*');
                });
            });
            surface.appendChild(frame);
        }
        const signature = hashText(`${settings.keyboardCustomEffectHtml}\u0000${settings.keyboardCustomEffectCss}\u0000${settings.keyboardCustomEffectJs}`);
        if (frame.dataset.effectSignature !== signature) {
            frame.dataset.effectSignature = signature;
            frame.dataset.effectReady = '0';
            frame.srcdoc = customEffectSource(settings);
        }
        return frame;
    }

    function updateScopedCustomCss(settings) {
        let style = document.getElementById('rsdbKeyboardCustomStyle');
        if (!style) {
            style = document.createElement('style');
            style.id = 'rsdbKeyboardCustomStyle';
            document.head.appendChild(style);
        }
        const css = settings.keyboardCustomStyleCss.trim();
        style.textContent = css ? `@scope (#virtualKeyboard) { ${css} }` : '';
    }

    function applyAppearanceToSurface(surface, settings, { preview = false } = {}) {
        if (!surface) return;
        const darkMode = document.body?.classList.contains('dark-mode') || document.documentElement.classList.contains('mdui-theme-dark');
        const colorFor = key => darkMode ? (settings[`${key}Dark`] || settings[key]) : settings[key];
        surface.dataset.pressEffect = settings.keyboardPressEffect;
        surface.dataset.surfaceStyle = settings.keyboardSurfaceStyle;
        surface.dataset.keyShape = settings.keyboardKeyShape;
        surface.dataset.pressGlow = settings.keyboardPressGlowEnabled ? 'true' : 'false';
        surface.style.setProperty('--vk-key-height', `${settings.keyboardKeyHeight}px`);
        surface.style.setProperty('--vk-key-gap', `${settings.keyboardKeyGap}px`);
        surface.style.setProperty('--vk-key-radius', `${settings.keyboardKeyRadius}px`);
        surface.style.setProperty('--vk-key-font-size', `${settings.keyboardKeyFontSize}px`);
        surface.style.setProperty('--vk-surface-bg', colorFor('keyboardSurfaceColor') || 'var(--surface-color)');
        surface.style.setProperty('--vk-key-bg', colorFor('keyboardKeyColor') || 'var(--background-color)');
        surface.style.setProperty('--vk-special-key-bg', colorFor('keyboardSpecialKeyColor') || 'var(--keyboard-special-key-bg, #bdbdbd)');
        surface.style.setProperty('--vk-key-text', colorFor('keyboardKeyTextColor') || 'var(--text-color)');
        surface.style.setProperty('--vk-ripple-rgb', hexToRgbChannels(colorFor('keyboardRippleColor')) || 'var(--mdui-color-primary)');
        surface.style.setProperty('--vk-ripple-opacity', String(settings.keyboardRippleOpacity / 100));
        surface.style.setProperty('--vk-press-glow-color', colorFor('keyboardPressGlowColor') || '#FFFFFF');
        surface.style.setProperty('--vk-press-glow-opacity', `${settings.keyboardPressGlowOpacity}%`);
        surface.style.setProperty('--vk-press-glow-size', `${settings.keyboardPressGlowSize}%`);
        decorateKeyboardKeys(surface);
        ensureCustomEffectFrame(surface, settings);
        if (preview) {
            let previewStyle = document.getElementById('rsdbKeyboardPreviewCustomStyle');
            if (!previewStyle) {
                previewStyle = document.createElement('style');
                previewStyle.id = 'rsdbKeyboardPreviewCustomStyle';
                document.head.appendChild(previewStyle);
            }
            const css = settings.keyboardCustomStyleCss.trim().replaceAll('#virtualKeyboard', '#keyboardAppearancePreview');
            previewStyle.textContent = css ? `@scope (#keyboardAppearancePreview) { ${css} }` : '';
        }
    }

    function applyVirtualKeyboardAppearance(settings = appSettings) {
        const normalized = normalizeAppearance(settings);
        const keyboard = document.getElementById('virtualKeyboard');
        applyAppearanceToSurface(keyboard, normalized);
        updateScopedCustomCss(normalized);
    }
    window.applyVirtualKeyboardAppearance = applyVirtualKeyboardAppearance;

    function ensureNativeRipple(key) {
        if (!key || key.classList.contains('empty')) return null;
        let ripple = key.querySelector(':scope > mdui-ripple.keyboard-native-ripple');
        if (!ripple) {
            ripple = document.createElement('mdui-ripple');
            ripple.className = 'keyboard-native-ripple';
            ripple.setAttribute('aria-hidden', 'true');
            key.appendChild(ripple);
        }
        const enabled = key.closest('[data-press-effect]')?.dataset.pressEffect === 'material3';
        ripple.noRipple = !enabled;
        ripple.toggleAttribute('no-ripple', !enabled);
        return ripple;
    }

    function decorateKeyboardKeys(surface) {
        surface?.querySelectorAll('.keyboard-key:not(.empty)').forEach(ensureNativeRipple);
    }

    function materialRipple(key, event) {
        const ripple = ensureNativeRipple(key);
        if (typeof ripple?.startPress !== 'function') return null;
        ripple.startPress(event || undefined);
        return ripple;
    }

    function customEffect(surface, key, event) {
        const settings = surface === document.getElementById('virtualKeyboard')
            ? normalizeAppearance(appSettings) : normalizeAppearance(appearanceDraft || DEFAULT_APPEARANCE);
        const frame = ensureCustomEffectFrame(surface, settings);
        if (!frame?.contentWindow) return;
        const surfaceRect = surface.getBoundingClientRect();
        const keyRect = key.getBoundingClientRect();
        const detail = {
            key: String(key.dataset.keyValue || key.textContent || '').trim().slice(0, 80),
            x: (Number.isFinite(event?.clientX) ? event.clientX : keyRect.left + keyRect.width / 2) - surfaceRect.left,
            y: (Number.isFinite(event?.clientY) ? event.clientY : keyRect.top + keyRect.height / 2) - surfaceRect.top,
            keyX: keyRect.left - surfaceRect.left,
            keyY: keyRect.top - surfaceRect.top,
            keyWidth: keyRect.width,
            keyHeight: keyRect.height,
            pointerType: event?.pointerType || 'preview'
        };
        if (frame.dataset.effectReady === '1') {
            frame.contentWindow.postMessage({ type: 'rsdb-keyboard-effect', detail }, '*');
        } else {
            frame._rsdbPendingEffects ||= [];
            frame._rsdbPendingEffects.push(detail);
        }
    }

    function startPressEffect(surface, key, event) {
        const effect = surface.dataset.pressEffect || 'material3';
        if (effect === 'material3') {
            const ripple = materialRipple(key, event);
            if (event?.pointerId !== undefined && ripple) {
                pressedPointers.set(event.pointerId, { effect, key, ripple });
            }
        }
        else if (effect === 'bounce') {
            const previousTimer = bounceTimers.get(key);
            if (previousTimer) clearTimeout(previousTimer);
            key.classList.add('keyboard-press-active');
            const timer = setTimeout(() => {
                key.classList.remove('keyboard-press-active');
                bounceTimers.delete(key);
            }, 240);
            bounceTimers.set(key, timer);
        } else if (effect === 'custom') customEffect(surface, key, event);
    }

    function releasePressEffect(event) {
        const pressed = pressedPointers.get(event.pointerId);
        if (!pressed) return;
        if (pressed.effect === 'material3' && typeof pressed.ripple?.endPress === 'function') {
            pressed.ripple.endPress();
        }
        pressedPointers.delete(event.pointerId);
    }

    function bindPressSurface(surface) {
        if (!surface || surface.dataset.keyboardPressBound === '1') return;
        surface.dataset.keyboardPressBound = '1';
        surface.addEventListener('pointerdown', event => {
            const key = event.target.closest?.('.keyboard-key:not(.empty)');
            if (!key || !surface.contains(key)) return;
            startPressEffect(surface, key, event);
        }, { capture: true });
        const observer = new MutationObserver(() => decorateKeyboardKeys(surface));
        observer.observe(surface, { childList: true, subtree: true });
        decorateKeyboardKeys(surface);
    }

    function setControlValue(id, value) {
        const control = document.getElementById(id);
        if (!control) return;
        const next = String(value ?? '');
        if (control.tagName === 'MDUI-SEGMENTED-BUTTON-GROUP') {
            control.value = next;
            control.setAttribute('value', next);
            control.querySelectorAll('mdui-segmented-button').forEach(button => {
                if (button.getAttribute('value') === next) button.setAttribute('selected', '');
                else button.removeAttribute('selected');
            });
            return;
        }
        control.value = next;
        if (control.tagName === 'MDUI-SLIDER') control.setAttribute('value', next);
    }

    function readControlValue(id) {
        const control = document.getElementById(id);
        if (!control) return '';
        if (control.tagName === 'MDUI-SEGMENTED-BUTTON-GROUP') {
            return control.querySelector('mdui-segmented-button[selected]')?.getAttribute('value')
                || String(control.value || '')
                || String(control.getAttribute('value') || '');
        }
        if (control.tagName === 'MDUI-SLIDER') {
            return String(control.value || '')
                || String(control.shadowRoot?.querySelector('input[type="range"]')?.value || '')
                || String(control.getAttribute('value') || '');
        }
        return String(control.value ?? control.getAttribute('value') ?? '');
    }

    function fillDialog(settings) {
        appearanceDraft = normalizeAppearance(settings);
        setControlValue('keyboardPressEffectGroup', appearanceDraft.keyboardPressEffect);
        setControlValue('keyboardSurfaceStyleGroup', appearanceDraft.keyboardSurfaceStyle);
        setControlValue('keyboardKeyShapeGroup', appearanceDraft.keyboardKeyShape);
        setControlValue('keyboardKeyHeightSlider', appearanceDraft.keyboardKeyHeight);
        setControlValue('keyboardKeyGapSlider', appearanceDraft.keyboardKeyGap);
        setControlValue('keyboardKeyRadiusSlider', appearanceDraft.keyboardKeyRadius);
        setControlValue('keyboardKeyFontSizeSlider', appearanceDraft.keyboardKeyFontSize);
        setControlValue('keyboardRippleOpacitySlider', appearanceDraft.keyboardRippleOpacity);
        setControlValue('keyboardPressGlowOpacitySlider', appearanceDraft.keyboardPressGlowOpacity);
        setControlValue('keyboardPressGlowSizeSlider', appearanceDraft.keyboardPressGlowSize);
        const pressGlowEnabled = document.getElementById('keyboardPressGlowEnabledSwitch');
        if (pressGlowEnabled) pressGlowEnabled.checked = appearanceDraft.keyboardPressGlowEnabled;
        setControlValue('keyboardCustomStyleCssInput', appearanceDraft.keyboardCustomStyleCss);
        setControlValue('keyboardCustomEffectHtmlInput', appearanceDraft.keyboardCustomEffectHtml);
        setControlValue('keyboardCustomEffectCssInput', appearanceDraft.keyboardCustomEffectCss);
        setControlValue('keyboardCustomEffectJsInput', appearanceDraft.keyboardCustomEffectJs);
        COLOR_FIELDS.forEach(([key, inputId, autoId, fallback]) => {
            const input = document.getElementById(inputId);
            const auto = document.getElementById(autoId);
            if (input) {
                input.value = appearanceDraft[key] || fallback;
                input.setAttribute('value', input.value);
                input.style.setProperty('--picker-button-color', input.value);
            }
            if (auto) auto.checked = !appearanceDraft[key];
        });
        refreshDialogPreview();
    }

    function readDialog() {
        const read = readControlValue;
        const next = normalizeAppearance({
            ...appearanceDraft,
            keyboardPressEffect: read('keyboardPressEffectGroup'),
            keyboardSurfaceStyle: read('keyboardSurfaceStyleGroup'),
            keyboardKeyShape: read('keyboardKeyShapeGroup'),
            keyboardKeyHeight: read('keyboardKeyHeightSlider'),
            keyboardKeyGap: read('keyboardKeyGapSlider'),
            keyboardKeyRadius: read('keyboardKeyRadiusSlider'),
            keyboardKeyFontSize: read('keyboardKeyFontSizeSlider'),
            keyboardRippleOpacity: read('keyboardRippleOpacitySlider'),
            keyboardPressGlowEnabled: document.getElementById('keyboardPressGlowEnabledSwitch')?.checked === true,
            keyboardPressGlowOpacity: read('keyboardPressGlowOpacitySlider'),
            keyboardPressGlowSize: read('keyboardPressGlowSizeSlider'),
            keyboardCustomStyleCss: read('keyboardCustomStyleCssInput'),
            keyboardCustomEffectHtml: read('keyboardCustomEffectHtmlInput'),
            keyboardCustomEffectCss: read('keyboardCustomEffectCssInput'),
            keyboardCustomEffectJs: read('keyboardCustomEffectJsInput')
        });
        COLOR_FIELDS.forEach(([key, inputId, autoId]) => {
            next[key] = document.getElementById(autoId)?.checked ? '' : String(document.getElementById(inputId)?.value || '').toUpperCase();
        });
        return normalizeAppearance(next);
    }

    function refreshDialogPreview() {
        appearanceDraft = readDialog();
        const preview = document.getElementById('keyboardAppearancePreview');
        applyAppearanceToSurface(preview, appearanceDraft, { preview: true });
        const values = [
            ['keyboardKeyHeightValue', appearanceDraft.keyboardKeyHeight],
            ['keyboardKeyGapValue', appearanceDraft.keyboardKeyGap],
            ['keyboardKeyRadiusValue', appearanceDraft.keyboardKeyRadius],
            ['keyboardKeyFontSizeValue', appearanceDraft.keyboardKeyFontSize],
            ['keyboardRippleOpacityValue', appearanceDraft.keyboardRippleOpacity, '%'],
            ['keyboardPressGlowOpacityValue', appearanceDraft.keyboardPressGlowOpacity, '%'],
            ['keyboardPressGlowSizeValue', appearanceDraft.keyboardPressGlowSize, '%']
        ];
        values.forEach(([id, value, suffix = 'px']) => {
            const output = document.getElementById(id);
            if (output) output.textContent = `${value}${suffix}`;
        });
        COLOR_FIELDS.forEach(([, inputId, autoId]) => {
            const input = document.getElementById(inputId);
            if (input) input.disabled = document.getElementById(autoId)?.checked === true;
        });
        const customSection = document.getElementById('keyboardCustomEffectSection');
        if (customSection) customSection.hidden = appearanceDraft.keyboardPressEffect !== 'custom';
    }

    function closeDialog() {
        const dialog = document.getElementById('keyboardAppearanceDialog');
        if (dialog) dialog.open = false;
        appearanceDraft = null;
    }

    function bindSettingsDialog() {
        const item = document.getElementById('settingsKeyboardAppearanceItem');
        const dialog = document.getElementById('keyboardAppearanceDialog');
        item?.addEventListener('click', () => {
            fillDialog(appSettings);
            if (dialog) {
                dialog.style.zIndex = '22000';
                dialog.open = true;
            }
        });
        document.getElementById('keyboardAppearanceCloseBtn')?.addEventListener('click', closeDialog);
        document.getElementById('keyboardAppearanceCancelBtn')?.addEventListener('click', closeDialog);
        document.getElementById('keyboardAppearanceResetBtn')?.addEventListener('click', () => fillDialog(DEFAULT_APPEARANCE));
        document.getElementById('keyboardAppearanceSaveBtn')?.addEventListener('click', () => {
            const next = readDialog();
            saveAppSettings(next);
            closeDialog();
            showSnackbar('键盘外观已保存', 'success');
        });
        dialog?.querySelectorAll('[data-keyboard-appearance-control]').forEach(control => {
            control.addEventListener('input', refreshDialogPreview);
            control.addEventListener('change', refreshDialogPreview);
        });
        document.getElementById('keyboardCustomEffectTestBtn')?.addEventListener('click', () => {
            refreshDialogPreview();
            const preview = document.getElementById('keyboardAppearancePreview');
            const key = preview?.querySelector('.keyboard-key');
            if (preview && key) startPressEffect(preview, key, null);
        });
        document.getElementById('keyboardCustomStyleExampleBtn')?.addEventListener('click', () => {
            setControlValue('keyboardCustomStyleCssInput', KEYBOARD_STYLE_CSS_EXAMPLE);
            refreshDialogPreview();
        });
    }

    bindPressSurface(document.getElementById('virtualKeyboard'));
    bindPressSurface(document.getElementById('keyboardAppearancePreview'));
    document.addEventListener('pointerup', releasePressEffect, { capture: true });
    document.addEventListener('pointercancel', releasePressEffect, { capture: true });
    bindSettingsDialog();
    applyVirtualKeyboardAppearance();
})();
