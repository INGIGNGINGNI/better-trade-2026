        import { createLiquidMetalButton } from './liquid-metal-button.js';

        // Wait for FC Minimal so the auto-sized pill matches the real glyph widths.
        const ready = document.fonts ? document.fonts.ready : Promise.resolve();
        ready.then(() => {
            const hero = createLiquidMetalButton({
                label: 'ลงทะเบียน',
                height: 56,
                fontSize: 22,
                fontWeight: 400,
                fontFamily: "'FC Minimal'",
                textColor: '#111318',
                pillBackground: 'linear-gradient(180deg, #ffffff 0%, #f3f4f8 55%, #e4e7ee 100%)',
                textShadow: 'none',
                rimPalette: 'var(--spectrum)',
                paddingX: 48,
                rim: 3,
                metalShiftRed: 0.2,
                metalShiftBlue: 0.2,
                onClick: () => console.log('[cta] register'),
            });
            document.getElementById('cta-slot')?.appendChild(hero.el);

        });
    
