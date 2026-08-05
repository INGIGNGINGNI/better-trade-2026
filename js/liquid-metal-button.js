/**
 * Liquid metal button — vanilla-JS port of the 21st.dev React component.
 *
 * The original is a React/TS/Tailwind/shadcn component. This project is plain
 * HTML + CSS + GSAP, so the port keeps the visual construction and drops the
 * React-specific parts:
 *
 *   useState/useRef  -> plain closure variables
 *   useMemo          -> computed once per instance
 *   useEffect mount  -> mountShader(), with a matching destroy()
 *   lucide-react     -> inline SVG
 *   clsx/twMerge     -> not needed, styles are inline like the original
 *
 * Structure is unchanged: four stacked 3D layers where the shader canvas is the
 * bottom layer and a black pill sits 2px inside it, so the liquid metal only
 * shows through as the rim.
 */

import { ShaderMount } from '../vendor/paper-shaders/shader-mount.js';
import { liquidMetalFragmentShader } from '../vendor/paper-shaders/shaders/liquid-metal.js';

const STYLE_ID = 'liquid-metal-button-style';

function injectStyleOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
    .lmb-shader canvas {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      border-radius: 100px !important;
    }
    @keyframes lmb-ripple {
      0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
      100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
    }
    /* Shown only if WebGL never comes up, so the rim is never just a black edge. */
    .lmb-shader--fallback {
      background: conic-gradient(from 0deg,
        #dfe6f2, #9fb4d8, #ffffff, #b9a7d6, #dfe6f2, #8fa6cc, #ffffff, #dfe6f2);
    }
  `;
    document.head.appendChild(style);
}

const SPARKLES_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
  <path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>
</svg>`;

const EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const TRANSITION = `all 0.8s ${EASE}, width 0.4s ease, height 0.4s ease`;

const SHADOW = {
    rest: '0px 0px 0px 1px rgba(0,0,0,0.3), 0px 36px 14px 0px rgba(0,0,0,0.02), 0px 20px 12px 0px rgba(0,0,0,0.08), 0px 9px 9px 0px rgba(0,0,0,0.12), 0px 2px 5px 0px rgba(0,0,0,0.15)',
    hover: '0px 0px 0px 1px rgba(0,0,0,0.4), 0px 12px 6px 0px rgba(0,0,0,0.05), 0px 8px 5px 0px rgba(0,0,0,0.1), 0px 4px 4px 0px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.2)',
    pressed: '0px 0px 0px 1px rgba(0,0,0,0.5), 0px 1px 2px 0px rgba(0,0,0,0.3)',
};

/** Measure a label with the exact font it will render in. */
function measureLabel(text, fontSize, fontWeight, fontFamily) {
    const probe = document.createElement('span');
    probe.textContent = text;
    probe.style.cssText =
        `position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:-9999px;` +
        `font-size:${fontSize}px;font-weight:${fontWeight};font-family:${fontFamily};`;
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return w;
}

/**
 * @param {object}   opts
 * @param {string}   opts.label      Button text.
 * @param {'text'|'icon'} opts.viewMode
 * @param {number}   [opts.height]   Pill height in px.
 * @param {number}   [opts.width]    Fixed width; omit to size from the label.
 * @param {number}   [opts.paddingX] Horizontal padding used when auto-sizing.
 * @param {number}   [opts.fontSize]
 * @param {number}   [opts.fontWeight]
 * @param {string}   [opts.fontFamily]
 * @param {string}   [opts.textColor] Original used #666; that is only 3.7:1 on
 *                                    black, so the default here is lighter.
 * @param {string}   [opts.pillBackground]
 * @param {string}   [opts.textShadow]
 * @param {string}   [opts.rimPalette] CSS color or gradient blended over the
 *                                    metal shader while preserving its light.
 * @param {number}   [opts.rimPaletteOpacity]
 * @param {number}   [opts.rim]      Thickness of the metal edge in px.
 * @param {number}   [opts.metalShiftRed]  Red-channel dispersion in the metal
 *                                    shader; lower reads as less "chrome".
 * @param {number}   [opts.metalShiftBlue] Same, blue channel.
 * @param {Function} [opts.onClick]
 * @returns {{ el: HTMLElement, destroy: Function }}
 */
export function createLiquidMetalButton(opts = {}) {
    const {
        label = 'Get Started',
        viewMode = 'text',
        height = 42,
        width: fixedWidth,
        paddingX = 30,
        fontSize = 14,
        fontWeight = 400,
        fontFamily = "'FC Minimal'",
        textColor = '#dfe4ee',
        pillBackground = 'linear-gradient(180deg,#202020 0%,#000000 100%)',
        textShadow = '0px 1px 2px rgba(0,0,0,0.5)',
        rimPalette = '',
        rimPaletteOpacity = 1,
        rim = 8,
        metalShiftRed = 0.3,
        metalShiftBlue = 0.3,
        onClick,
    } = opts;

    injectStyleOnce();

    const isIcon = viewMode === 'icon';
    const W = isIcon
        ? height
        : (fixedWidth ?? Math.round(measureLabel(label, fontSize, fontWeight, fontFamily) + paddingX * 2));
    const H = height;

    let isHovered = false;
    let isPressed = false;
    let shaderMount = null;
    let rippleId = 0;

    // --- wrapper + perspective -------------------------------------------------
    const wrap = document.createElement('div');
    wrap.className = 'lmb';
    wrap.style.cssText = 'position:relative;display:inline-block;';

    const persp = document.createElement('div');
    persp.style.cssText = 'perspective:1000px;perspective-origin:50% 50%;';

    const stack = document.createElement('div');
    stack.style.cssText =
        `position:relative;width:${W}px;height:${H}px;transform-style:preserve-3d;transition:${TRANSITION};`;

    const layerBase = (z, tz) =>
        `position:absolute;top:0;left:0;width:${W}px;height:${H}px;` +
        `transform-style:preserve-3d;transition:${TRANSITION};z-index:${z};transform:translateZ(${tz}px);`;

    // --- z30: label ------------------------------------------------------------
    const labelLayer = document.createElement('div');
    labelLayer.style.cssText =
        layerBase(30, 20) +
        'display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none;';
    if (isIcon) {
        labelLayer.innerHTML = SPARKLES_SVG;
        const svg = labelLayer.querySelector('svg');
        svg.style.cssText =
            `color:${textColor};filter:drop-shadow(0px 1px 2px rgba(0,0,0,0.5));transition:all 0.8s ${EASE};`;
    } else {
        const span = document.createElement('span');
        span.textContent = label;
        span.style.cssText =
            `font-size:${fontSize}px;font-family:${fontFamily};font-weight:${fontWeight};color:${textColor};` +
            `text-shadow:${textShadow};white-space:nowrap;transition:all 0.8s ${EASE};`;
        labelLayer.appendChild(span);
    }

    // --- z20: fill pill (inset by `rim`, so the shader shows as the edge) -------
    const pillLayer = document.createElement('div');
    pillLayer.style.cssText = layerBase(20, 10);
    const pill = document.createElement('div');
    pill.style.cssText =
        `width:${W - rim * 2}px;height:${H - rim * 2}px;margin:${rim}px;border-radius:100px;` +
        `background:${pillBackground};` +
        `transition:${TRANSITION}, box-shadow 0.15s cubic-bezier(0.4,0,0.2,1);`;
    pillLayer.appendChild(pill);

    // --- z10: shader canvas ----------------------------------------------------
    const shaderLayer = document.createElement('div');
    shaderLayer.style.cssText = layerBase(10, 0);
    const shaderFrame = document.createElement('div');
    shaderFrame.style.cssText =
        `position:relative;isolation:isolate;overflow:hidden;width:${W}px;height:${H}px;` +
        `border-radius:100px;background:rgb(0 0 0 / 0);` +
        `box-shadow:${SHADOW.rest};transition:${TRANSITION}, box-shadow 0.15s cubic-bezier(0.4,0,0.2,1);`;
    const shaderHost = document.createElement('div');
    shaderHost.className = 'lmb-shader';
    shaderHost.style.cssText =
        `border-radius:100px;overflow:hidden;position:relative;` +
        `width:${W}px;max-width:${W}px;height:${H}px;transition:width 0.4s ease,height 0.4s ease;`;
    shaderFrame.appendChild(shaderHost);
    if (rimPalette) {
        const paletteLayer = document.createElement('div');
        paletteLayer.className = 'lmb-rim-palette';
        paletteLayer.style.cssText =
            `position:absolute;inset:0;z-index:1;border-radius:inherit;pointer-events:none;` +
            `background:${rimPalette};mix-blend-mode:color;opacity:${rimPaletteOpacity};`;
        shaderFrame.appendChild(paletteLayer);
    }
    shaderLayer.appendChild(shaderFrame);

    // --- z40: the real button (transparent hit area + ripples) -----------------
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.style.cssText =
        layerBase(40, 25) +
        'background:transparent;border:none;cursor:pointer;outline:none;overflow:hidden;border-radius:100px;';

    stack.append(labelLayer, pillLayer, shaderLayer, btn);
    persp.appendChild(stack);
    wrap.appendChild(persp);

    // --- state --------------------------------------------------------------
    function applyState() {
        const t = isPressed ? 'translateY(1px) scale(0.98)' : 'translateY(0) scale(1)';
        pillLayer.style.transform = `translateZ(10px) ${t}`;
        shaderLayer.style.transform = `translateZ(0px) ${t}`;
        pill.style.boxShadow = isPressed
            ? 'inset 0px 2px 4px rgba(0,0,0,0.4), inset 0px 1px 2px rgba(0,0,0,0.3)'
            : 'none';
        shaderFrame.style.boxShadow =
            isPressed ? SHADOW.pressed : isHovered ? SHADOW.hover : SHADOW.rest;
    }
    applyState();

    btn.addEventListener('mouseenter', () => {
        isHovered = true; applyState();
        shaderMount?.setSpeed?.(1);
    });
    btn.addEventListener('mouseleave', () => {
        isHovered = false; isPressed = false; applyState();
        shaderMount?.setSpeed?.(0.6);
    });
    btn.addEventListener('mousedown', () => { isPressed = true; applyState(); });
    btn.addEventListener('mouseup', () => { isPressed = false; applyState(); });

    btn.addEventListener('click', e => {
        if (shaderMount?.setSpeed) {
            shaderMount.setSpeed(2.4);
            setTimeout(() => shaderMount?.setSpeed?.(isHovered ? 1 : 0.6), 300);
        }

        const rect = btn.getBoundingClientRect();
        const dot = document.createElement('span');
        const id = rippleId++;
        dot.dataset.rippleId = String(id);
        dot.style.cssText =
            `position:absolute;left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px;` +
            `width:20px;height:20px;border-radius:50%;pointer-events:none;` +
            `background:radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%);` +
            `animation:lmb-ripple 0.6s ease-out;`;
        btn.appendChild(dot);
        setTimeout(() => dot.remove(), 600);

        onClick?.(e);
    });

    // --- shader --------------------------------------------------------------
    function mountShader() {
        try {
            shaderMount = new ShaderMount(
                shaderHost,
                liquidMetalFragmentShader,
                {
                    u_repetition: 4,
                    u_softness: 0.5,
                    u_shiftRed: metalShiftRed,
                    u_shiftBlue: metalShiftBlue,
                    u_distortion: 0,
                    u_contour: 0,
                    u_angle: 45,
                    u_scale: 8,
                    u_shape: 1,
                    u_offsetX: 0.1,
                    u_offsetY: -0.1,
                },
                undefined,
                0.6,
            );
        } catch (err) {
            console.error('[liquid-metal-button] shader failed to mount:', err);
            shaderHost.classList.add('lmb-shader--fallback');
        }
        // WebGL can fail silently; if no canvas appeared, show the CSS rim instead.
        requestAnimationFrame(() => {
            if (!shaderHost.querySelector('canvas')) {
                shaderHost.classList.add('lmb-shader--fallback');
            }
        });
    }
    mountShader();

    return {
        el: wrap,
        button: btn,
        destroy() {
            shaderMount?.destroy?.();
            shaderMount = null;
            wrap.remove();
        },
    };
}
