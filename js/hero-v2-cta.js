import { createLiquidMetalButton } from './liquid-metal-button.js?v=3';

const TICKET_SECTION_HREF = '#ticket';
const BUY_TICKET_URL = 'https://www.efin.finance/events/better-trade/better-trade2026/buy-ticket';
const INVESTOR_DNA_URL = 'https://egames.efin.finance/games/investor-dna-quiz';
const PLAYBOOK_HERO_CTA_LABEL = 'ซื้อบัตรพร้อมรับ PERSONALIZED PLAYBOOK';

const sharedRegisterOptions = {
    label: 'ซื้อบัตร',
    href: TICKET_SECTION_HREF,
    height: 56,
    fontSize: 18,
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

/* ป้ายยาว ๆ บนจอแคบ: pill คำนวณความกว้างจากตัวอักษร ถ้ายาวเกินคอลัมน์จะล้นขอบจอ
   จึงวัดพื้นที่จริงของคอลัมน์ที่ slot อยู่ แล้วย่อขนาดตัวอักษรลงตามสัดส่วนที่เกิน */
function fitLabelToColumn(slot, label, options) {
    const fontSize = options.fontSize ?? sharedRegisterOptions.fontSize;
    const paddingX = options.paddingX ?? sharedRegisterOptions.paddingX;
    const column = slot?.closest('[class*="col-"]');

    if (!column) return options;

    /* ซ่อนปุ่มเดิมระหว่างวัด: ตอนย่อจอ ปุ่มที่ยังกว้างเท่าจอก่อนหน้าดันคอลัมน์ให้กว้างตามตัวเอง
       ถ้าวัดตอนนั้นจะได้ความกว้างที่ถูกปุ่มถ่างไว้ ไม่ใช่ความกว้างจริงของคอลัมน์ */
    const previousDisplay = slot.style.display;

    slot.style.display = 'none';
    const columnStyle = getComputedStyle(column);
    const available = column.clientWidth
        - parseFloat(columnStyle.paddingLeft)
        - parseFloat(columnStyle.paddingRight);

    slot.style.display = previousDisplay;
    const textWidth = measureTextWidth(label, fontSize, sharedRegisterOptions.fontWeight, sharedRegisterOptions.fontFamily);

    if (!available || textWidth + paddingX * 2 <= available) return options;

    const ratio = (available - paddingX * 2) / textWidth;

    return { ...options, fontSize: Math.max(12, Math.floor(fontSize * ratio)) };
}

// รอ FC Minimal เพื่อให้ความกว้าง pill คำนวณจาก glyph จริง
const ready = document.fonts ? document.fonts.ready : Promise.resolve();
ready.then(() => {
    const headerActionHeight = resolveCssLength('--bt-header-action-height', 40);
    const headerActionRim = resolveCssLength('--bt-header-action-rim', 2);
    const heroCtaSlot = document.getElementById('cta-slot');
    const playbookCtaSlot = document.getElementById('playbook-cta-slot');
    const ctaTicketSlot = document.getElementById('cta-ticket-slot');
    // Hero และ section What you get ของหน้า personalized-playbook.html
    // (หน้าอื่นไม่มี slot เหล่านี้ จึงข้ามไปเอง)
    const playbookHeroCtaSlot = document.getElementById('playbook-hero-cta-slot');
    const playbookUltimateCtaSlot = document.getElementById('playbook-ultimate-cta-slot');
    const tabletHeroCta = window.matchMedia('(max-width: 767px)');
    const mobileHeroCta = window.matchMedia('(max-width: 575px), (max-width: 1199px) and (max-height: 575px) and (orientation: landscape)');
    let heroCtaButton = null;
    let playbookCtaButton = null;
    let ctaTicketButton = null;
    let playbookHeroCtaButton = null;
    let playbookUltimateCtaButton = null;
    let heroCtaSize = null;
    let heroResponsiveOptions = {};
    let playbookHeroFontSize = null;

    /* ป้ายของปุ่มนี้ยาวที่สุดในเว็บ ปุ่มจึงยืดจนอัตราส่วนเกิน 8:1 แล้วลายโลหะบนขอบ
       จะเห็นรอยต่อกลางปุ่ม (ลายถูกวาดในกล่องทรงจัตุรัส ยิ่งปุ่มยาวยิ่งถูกยืด)
       บีบระยะในของปุ่มนี้ตัวเดียว ปุ่มอื่นทั้งเว็บยังใช้ 48 ตามเดิม
       ส่งค่าเข้า fitLabelToColumn ด้วย การคำนวณย่อฟอนต์จะได้อิงระยะในชุดเดียวกัน */
    const fitPlaybookHeroOptions = () => fitLabelToColumn(
        playbookHeroCtaSlot,
        PLAYBOOK_HERO_CTA_LABEL,
        { ...heroResponsiveOptions, paddingX: 36 },
    );

    const mountPlaybookHeroCta = (fitted = fitPlaybookHeroOptions()) => {
        playbookHeroFontSize = fitted.fontSize ?? sharedRegisterOptions.fontSize;
        playbookHeroCtaButton?.destroy?.();
        playbookHeroCtaButton = mountRegisterButton(playbookHeroCtaSlot, {
            ...fitted,
            label: PLAYBOOK_HERO_CTA_LABEL,
            href: playbookHeroCtaSlot?.dataset.ctaHref || TICKET_SECTION_HREF,
            textColor: '#111318',
            pillBackground: 'linear-gradient(180deg, #ffffff 0%, #f3f4f8 55%, #e4e7ee 100%)',
        });
    };

    const mountHeroCta = () => {
        const nextSize = mobileHeroCta.matches ? 'mobile' : (tabletHeroCta.matches ? 'tablet' : 'default');

        if (heroCtaSize === nextSize) return;

        heroCtaSize = nextSize;
        const responsiveOptions = nextSize === 'mobile'
            ? mobileRegisterOptions
            : (nextSize === 'tablet' ? tabletRegisterOptions : {});

        heroResponsiveOptions = responsiveOptions;
        heroCtaButton?.destroy?.();
        playbookCtaButton?.destroy?.();
        ctaTicketButton?.destroy?.();
        playbookUltimateCtaButton?.destroy?.();
        heroCtaButton = mountRegisterButton(heroCtaSlot, {
            ...responsiveOptions,
            textColor: '#111318',
            pillBackground: 'linear-gradient(180deg, #ffffff 0%, #f3f4f8 55%, #e4e7ee 100%)',
        });
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
        mountPlaybookHeroCta();
        playbookUltimateCtaButton = mountRegisterButton(playbookUltimateCtaSlot, {
            ...responsiveOptions,
            label: 'ซื้อบัตร Ultimate',
            href: playbookUltimateCtaSlot?.dataset.ctaHref || BUY_TICKET_URL,
            target: '_blank',
            rel: 'noopener noreferrer',
            /* ใช้สีดำชุดเดียวกับปุ่มซื้อบัตรใน header (ขนาดยังเป็นชุด CTA เหมือนเดิม) */
            textColor: '#ffffff',
            pillBackground: 'linear-gradient(180deg, #20242a 0%, #111318 55%, #050607 100%)',
        });
    };

    mountHeroCta();
    tabletHeroCta.addEventListener('change', mountHeroCta);
    mobileHeroCta.addEventListener('change', mountHeroCta);

    /* ปุ่มสร้างใหม่ตามข้างบนเฉพาะตอนข้ามช่วงจอ แต่ขนาดตัวอักษรของปุ่ม hero ถูกย่อให้พอดีคอลัมน์
       ณ ตอนสร้าง ย่อจอภายในช่วงเดียวกัน (เช่น 575 -> 375 หรือเปิด inspect) ปุ่มจึงยังกว้างเท่าเดิม
       แล้วดันคอลัมน์ข้อความจน hero ล้นออกขวาจอ วัดใหม่หลังหยุดย่อ-ขยาย ถ้าขนาดที่พอดีเปลี่ยน
       ค่อยสร้างปุ่มนี้ใหม่ปุ่มเดียว (หน่วงไว้ ไม่สร้างซ้ำทุก event ระหว่างลากขอบหน้าต่าง) */
    if (playbookHeroCtaSlot) {
        let refitTimer = 0;

        window.addEventListener('resize', () => {
            clearTimeout(refitTimer);
            refitTimer = setTimeout(() => {
                const fitted = fitPlaybookHeroOptions();

                if ((fitted.fontSize ?? sharedRegisterOptions.fontSize) !== playbookHeroFontSize) {
                    mountPlaybookHeroCta(fitted);
                }
            }, 150);
        });
    }

    // จอ ≤1199px แถบ header แคบลง ปุ่มซื้อบัตรใน header จึงแคบลง 20% จากความกว้างเดิม
    const compactHeaderCta = window.matchMedia('(max-width: 1199px)');
    const HEADER_CTA_COMPACT_RATIO = 0.8;
    const headerCtaButtons = new Map();

    const mountHeaderCtas = () => {
        document.querySelectorAll('[data-header-register-cta]').forEach((target) => {
            // แถบ header ต้องแชร์แถวเดียวกับโลโก้และ nav จึงย่อตัวอักษรลงหนึ่งขั้น
            // ส่วนแถบ CTA ล่างจอ (≤575px) มีที่เหลือในแถบอีกมาก และป้าย "ซื้อบัตร" สั้นกว่า
            // ปุ่ม INVESTOR DNA ที่อยู่ข้างกันมาก จึงเพิ่มระยะในของปุ่มนี้ให้ดูไม่เล็กเกินไป
            const isHeaderRow = Boolean(target.closest('.site-header'));
            const fontSize = isHeaderRow ? 14 : 16;
            const paddingX = isHeaderRow ? 14 : 28;
            // ป้ายย่อเหลือ "ซื้อบัตร" แต่ปุ่มใน header คงความกว้างเดิมของป้าย "ซื้อบัตร Early Bird" (ตัวอักษรอยู่กึ่งกลาง)
            const headerRowBaseWidth = measureTextWidth('ซื้อบัตร Early Bird', fontSize, sharedRegisterOptions.fontWeight, sharedRegisterOptions.fontFamily) + paddingX * 2;
            const headerRowWidth = isHeaderRow
                ? Math.round(headerRowBaseWidth * (compactHeaderCta.matches ? HEADER_CTA_COMPACT_RATIO : 1))
                : undefined;

            headerCtaButtons.get(target)?.destroy?.();
            headerCtaButtons.set(target, mountRegisterButton(target, {
                // หน้าที่ไม่มี section ticket อยู่ในหน้าเดียวกัน ส่งปลายทางเต็มมาทาง data attribute
                href: target.dataset.headerRegisterHref || TICKET_SECTION_HREF,
                height: headerActionHeight,
                width: headerRowWidth,
                fontSize,
                paddingX,
                rim: headerActionRim,
                textColor: '#ffffff',
                pillBackground: 'linear-gradient(180deg, #20242a 0%, #111318 55%, #050607 100%)',
            }));
        });
    };

    mountHeaderCtas();
    compactHeaderCta.addEventListener('change', mountHeaderCtas);
});
    
