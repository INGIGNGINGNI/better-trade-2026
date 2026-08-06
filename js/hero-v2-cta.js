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

function goToRegistration() {
    window.location.hash = 'ticket';

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
}

// รอ FC Minimal เพื่อให้ความกว้าง pill คำนวณจาก glyph จริง
const ready = document.fonts ? document.fonts.ready : Promise.resolve();
ready.then(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const headerActionWidth = Number.parseFloat(rootStyles.getPropertyValue('--bt-header-action-width'));
    const headerActionHeight = Number.parseFloat(rootStyles.getPropertyValue('--bt-header-action-height'));
    const headerActionRim = Number.parseFloat(rootStyles.getPropertyValue('--bt-header-action-rim'));

    mountRegisterButton(document.getElementById('cta-slot'), {
        textColor: '#111318',
        pillBackground: 'linear-gradient(180deg, #ffffff 0%, #f3f4f8 55%, #e4e7ee 100%)',
    }, goToRegistration);

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
    
