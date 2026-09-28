/* ตัวเลือกการแสดงกำแพงใน hero (ปุ่มวงกลมมุมซ้ายล่าง) สำหรับเทียบแบบ
   both = กำแพงซ้าย-ขวา · right = เฉพาะกำแพงขวา · none = ไม่มีกำแพง
   ค่าที่เลือกเก็บใน localStorage และใส่เป็น data-walls ที่ #hero (CSS ซ่อนกำแพงตามค่า)
   โหลดก่อน js/hero-loader.js เพื่อให้ค่าเริ่มต้นมีผลก่อน loader ปิด/เปิดกำแพง
   แจ้ง hero-loader.js ผ่าน event 'bettertrade:hero-walls-change' ให้วางกำแพงใหม่ */
(() => {
    const STORAGE_KEY = 'bettertrade:hero-walls';
    const MODES = ['both', 'right', 'none'];
    const hero = document.getElementById('hero');
    const root = document.querySelector('[data-wall-switch]');
    if (!hero) return;

    const read = () => {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            return MODES.includes(value) ? value : 'both';
        } catch {
            return 'both';
        }
    };

    const apply = mode => {
        hero.dataset.walls = mode;
        root?.querySelectorAll('[data-wall-mode]').forEach(option => {
            option.setAttribute('aria-checked', String(option.dataset.wallMode === mode));
        });
    };

    apply(read());
    if (!root) return;

    const toggle = root.querySelector('[data-wall-switch-toggle]');
    const panel = root.querySelector('[data-wall-switch-panel]');

    const setOpen = open => {
        root.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
    };

    toggle.addEventListener('click', () => setOpen(panel.hidden));

    root.querySelectorAll('[data-wall-mode]').forEach(option => {
        option.addEventListener('click', () => {
            const mode = option.dataset.wallMode;
            try {
                localStorage.setItem(STORAGE_KEY, mode);
            } catch {
                // private mode / storage ปิด: ใช้ได้เฉพาะหน้านี้
            }
            apply(mode);
            window.dispatchEvent(new CustomEvent('bettertrade:hero-walls-change', { detail: { mode } }));
            setOpen(false);
            toggle.focus();
        });
    });

    document.addEventListener('click', event => {
        if (!panel.hidden && !root.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) {
            setOpen(false);
            toggle.focus();
        }
    });
})();
