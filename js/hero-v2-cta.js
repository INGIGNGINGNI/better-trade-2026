import { createLiquidMetalButton } from './liquid-metal-button.js';

const sharedRegisterOptions = {
    label: 'ลงทะเบียน',
    height: 56,
    fontSize: 20,
    fontWeight: 400,
    fontFamily: "'FC Minimal'",
    textShadow: 'none',
    rimPalette: 'var(--spectrum)',
    paddingX: 48,
    rim: 3,
    metalShiftRed: 0.2,
    metalShiftBlue: 0.2,
};

const compactRegisterOptions = {
    height: 49,
    fontSize: 18,
    paddingX: 42,
};

function goToRegistration() {
    document.getElementById('ticket')?.scrollIntoView({ block: 'start' });
    history.replaceState(null, '', window.location.pathname + window.location.search);

    if (document.body.classList.contains('menu-open')) {
        document.querySelector('.site-header__backdrop')?.click();
    }
}

function mountRegisterButton(target, appearance, onClick) {
    if (!target) return;

    const button = createLiquidMetalButton({
        ...sharedRegisterOptions,
        ...appearance,
        onClick,
    });

    target.replaceChildren(button.el);

    return button;
}

function resolveCssLength(tokenName, fallback) {
    const probe = document.createElement('div');

    probe.style.cssText = [
        'position:absolute',
        'visibility:hidden',
        'pointer-events:none',
        'width:var(' + tokenName + ')',
        'height:0',
        'overflow:hidden',
    ].join(';');

    document.body.appendChild(probe);
    const value = probe.getBoundingClientRect().width;
    probe.remove();

    return Number.isFinite(value) && value > 0 ? value : fallback;
}

// รอ FC Minimal เพื่อให้ความกว้าง pill คำนวณจาก glyph จริง
const ready = document.fonts ? document.fonts.ready : Promise.resolve();
ready.then(() => {
    const headerActionWidth = resolveCssLength('--bt-header-action-width', 120);
    const headerActionHeight = resolveCssLength('--bt-header-action-height', 40);
    const headerActionRim = resolveCssLength('--bt-header-action-rim', 2);
    const heroCtaSlot = document.getElementById('cta-slot');
    const compactHeroCta = window.matchMedia('(max-width: 575px)');
    let heroCtaButton = null;
    let isHeroCtaCompact = null;

    const mountHeroCta = () => {
        const nextCompact = compactHeroCta.matches;

        if (isHeroCtaCompact === nextCompact) return;

        isHeroCtaCompact = nextCompact;
        heroCtaButton?.destroy?.();
        heroCtaButton = mountRegisterButton(heroCtaSlot, {
            ...(nextCompact ? compactRegisterOptions : {}),
            textColor: '#111318',
            pillBackground: 'linear-gradient(180deg, #ffffff 0%, #f3f4f8 55%, #e4e7ee 100%)',
        }, goToRegistration);
    };

    mountHeroCta();
    compactHeroCta.addEventListener('change', mountHeroCta);

    document.querySelectorAll('[data-header-register-cta]').forEach((target) => {
        mountRegisterButton(target, {
            width: headerActionWidth,
            height: headerActionHeight,
            fontSize: 16,
            rim: headerActionRim,
            textColor: '#ffffff',
            pillBackground: 'linear-gradient(180deg, #20242a 0%, #111318 55%, #050607 100%)',
        }, goToRegistration);
    });
});
    
