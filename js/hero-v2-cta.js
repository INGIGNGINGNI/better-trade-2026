import { createLiquidMetalButton } from './liquid-metal-button.js?v=3';

const TICKET_SECTION_HREF = '#ticket';
const BUY_TICKET_URL = 'https://www.efin.finance/events/better-trade/better-trade2026/buy-ticket';
const INVESTOR_DNA_URL = 'https://egames.efin.finance/games/investor-dna-quest';

const sharedRegisterOptions = {
    label: 'ซื้อบัตร',
    href: TICKET_SECTION_HREF,
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

const tabletRegisterOptions = {
    height: 46,
    fontSize: 16,
    paddingX: 32,
};

const mobileRegisterOptions = {
    height: 46,
    fontSize: 16,
    paddingX: 24,
};

function createSaveBadge(className) {
    const badge = document.createElement('span');

    badge.className = className;
    badge.textContent = 'SAVE 30%';

    return badge;
}

function mountRegisterButton(target, appearance) {
    if (!target) return;

    const button = createLiquidMetalButton({
        ...sharedRegisterOptions,
        ...appearance,
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

function measureTextWidth(text, fontSize, fontWeight, fontFamily) {
    const probe = document.createElement('span');

    probe.textContent = text;
    probe.style.cssText = [
        'position:absolute',
        'visibility:hidden',
        'white-space:nowrap',
        'font-size:' + fontSize + 'px',
        'font-weight:' + fontWeight,
        'font-family:' + fontFamily,
    ].join(';');

    document.body.appendChild(probe);
    const value = probe.getBoundingClientRect().width;
    probe.remove();

    return value;
}

// รอ FC Minimal เพื่อให้ความกว้าง pill คำนวณจาก glyph จริง
const ready = document.fonts ? document.fonts.ready : Promise.resolve();
ready.then(() => {
    const headerActionHeight = resolveCssLength('--bt-header-action-height', 40);
    const headerActionRim = resolveCssLength('--bt-header-action-rim', 2);
    const heroCtaSlot = document.getElementById('cta-slot');
    const playbookCtaSlot = document.getElementById('playbook-cta-slot');
    const ctaTicketSlot = document.getElementById('cta-ticket-slot');
    const tabletHeroCta = window.matchMedia('(max-width: 767px)');
    const mobileHeroCta = window.matchMedia('(max-width: 575px), (max-width: 1199px) and (max-height: 575px) and (orientation: landscape)');
    let heroCtaButton = null;
    let playbookCtaButton = null;
    let ctaTicketButton = null;
    let heroCtaSize = null;

    const mountHeroCta = () => {
        const nextSize = mobileHeroCta.matches ? 'mobile' : (tabletHeroCta.matches ? 'tablet' : 'default');

        if (heroCtaSize === nextSize) return;

        heroCtaSize = nextSize;
        const responsiveOptions = nextSize === 'mobile'
            ? mobileRegisterOptions
            : (nextSize === 'tablet' ? tabletRegisterOptions : {});
        heroCtaButton?.destroy?.();
        playbookCtaButton?.destroy?.();
        ctaTicketButton?.destroy?.();
        heroCtaButton = mountRegisterButton(heroCtaSlot, {
            ...responsiveOptions,
            textColor: '#111318',
            pillBackground: 'linear-gradient(180deg, #ffffff 0%, #f3f4f8 55%, #e4e7ee 100%)',
        });
        // ป้ายส่วนลดเกาะมุมบนขวาของปุ่ม ชุดเดียวกับกล่อง Early Bird และการ์ด Ticket (สไตล์อยู่ใน css/style.css)
        // ใส่ไว้ใน .lmb (position: relative) เพื่อให้วางตำแหน่งอิงกล่องของปุ่ม
        heroCtaButton?.el.append(createSaveBadge('hero-cta__save'));
        playbookCtaButton = mountRegisterButton(playbookCtaSlot, {
            ...responsiveOptions,
            label: 'ค้นหา INVESTOR DNA',
            href: INVESTOR_DNA_URL,
            target: '_blank',
            rel: 'noopener noreferrer',
            textColor: '#111318',
            pillBackground: 'linear-gradient(180deg, #ffffff 0%, #f3f4f8 55%, #e4e7ee 100%)',
        });
        ctaTicketButton = mountRegisterButton(ctaTicketSlot, {
            ...responsiveOptions,
            label: 'ซื้อบัตร Ultimate 2 วัน 1,750 บาท',
            href: BUY_TICKET_URL,
            target: '_blank',
            rel: 'noopener noreferrer',
            textColor: '#111318',
            pillBackground: 'linear-gradient(180deg, #ffffff 0%, #f3f4f8 55%, #e4e7ee 100%)',
        });
    };

    mountHeroCta();
    tabletHeroCta.addEventListener('change', mountHeroCta);
    mobileHeroCta.addEventListener('change', mountHeroCta);

    document.querySelectorAll('[data-header-register-cta]').forEach((target) => {
        // แถบ header ต้องแชร์แถวเดียวกับโลโก้และ nav จึงย่อตัวอักษรลงหนึ่งขั้น
        // ส่วนแถบ CTA ล่างจอมือถือมีที่พอ คงขนาดให้เท่าปุ่ม --xl ที่อยู่ข้างกัน
        const isHeaderRow = Boolean(target.closest('.site-header'));
        const fontSize = isHeaderRow ? 14 : 16;
        const paddingX = isHeaderRow ? 14 : 16;
        // ป้ายย่อเหลือ "ซื้อบัตร" แต่ปุ่มใน header คงความกว้างเดิมของป้าย "ซื้อบัตร Early Bird" (ตัวอักษรอยู่กึ่งกลาง)
        const headerRowWidth = isHeaderRow
            ? Math.round(measureTextWidth('ซื้อบัตร Early Bird', fontSize, sharedRegisterOptions.fontWeight, sharedRegisterOptions.fontFamily) + paddingX * 2)
            : undefined;

        mountRegisterButton(target, {
            height: headerActionHeight,
            width: headerRowWidth,
            fontSize,
            paddingX,
            rim: headerActionRim,
            textColor: '#ffffff',
            pillBackground: 'linear-gradient(180deg, #20242a 0%, #111318 55%, #050607 100%)',
        });
    });
});
    
