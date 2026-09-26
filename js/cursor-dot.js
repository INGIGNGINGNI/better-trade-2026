/* จุดเล็ก ๆ วิ่งตามปลายเมาส์ (ตามภาพตัวอย่าง) ไม่แทนเคอร์เซอร์เดิม
   - สีดำบนพื้นสว่าง สีขาวบนพื้นมืด (ดู isDarkAt)
   - ตามแบบหน่วงเล็กน้อย (lerp) ให้ดูลื่น ผู้ที่ตั้งค่าลด motion จะติดปลายเมาส์ทันที
   - เฉพาะอุปกรณ์ที่มีเมาส์ (hover + pointer: fine) มือถือ/แท็บเล็ตไม่แสดง
   - ซ่อนเมื่อเมาส์ออกนอกหน้าต่าง */
(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const EASE = reduced ? 1 : 0.22; // สัดส่วนที่ขยับเข้าหาเมาส์ต่อเฟรม

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);

    /* พื้นใต้เมาส์มืดไหม: ดูทุกชั้นที่ตำแหน่งเมาส์ (elementsFromPoint บนสุดก่อน) รวม ::before/::after
       ชั้นแรกที่มีพื้นทึบ (สีพื้น หรือสีแรกของ gradient เช่นปุ่มดำแบบ liquid metal) ใช้ตัดสินด้วยความสว่าง
       section ที่พื้นเป็นภาพ/วิดีโอมืด ใช้ป้าย data-header-theme / data-journey-theme="dark" ที่มีอยู่แล้ว
       (หรือ data-cursor-theme="dark" ถ้าต้องการกำหนดเพิ่ม) */
    const DARK_MARK = '[data-header-theme="dark"], [data-journey-theme="dark"], [data-cursor-theme="dark"]';
    const firstColor = style => {
        // ตัวอักษรไล่สี (background-clip: text) ไม่ใช่พื้น ข้ามไป
        if ((style.backgroundClip || style.webkitBackgroundClip) === 'text' || style.webkitBackgroundClip === 'text') return null;
        const fromImage = style.backgroundImage.includes('gradient') && style.backgroundImage.match(/rgba?\([^)]*\)/);
        const rgba = (fromImage ? fromImage[0] : style.backgroundColor).match(/[\d.]+/g);
        if (!rgba || (rgba[3] !== undefined && Number(rgba[3]) < 0.5)) return null;
        return rgba.map(Number);
    };
    function isDarkAt(x, y) {
        for (const el of document.elementsFromPoint(x, y)) {
            if (el === dot || el === document.documentElement) continue;
            if (el.matches(DARK_MARK)) return true;
            for (const pseudo of [null, '::before', '::after']) {
                const style = getComputedStyle(el, pseudo);
                if (pseudo && style.content === 'none') continue;
                const rgb = firstColor(style);
                if (rgb) return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255 < 0.5;
            }
        }
        return false;
    }
    // ตรวจพื้นไม่เกินเฟรมละครั้ง ตอนเมาส์ขยับ และตอน scroll (เนื้อหาเลื่อนผ่านใต้เมาส์ที่อยู่นิ่ง)
    let toneFrame = null;
    const requestTone = () => {
        if (toneFrame !== null || !dot.classList.contains('is-visible')) return;
        toneFrame = requestAnimationFrame(() => {
            toneFrame = null;
            dot.classList.toggle('is-on-dark', isDarkAt(targetX, targetY));
        });
    };

    let targetX = -100;
    let targetY = -100;
    let x = targetX;
    let y = targetY;
    let frameId = null;

    const render = () => {
        x += (targetX - x) * EASE;
        y += (targetY - y) * EASE;
        dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        frameId = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1 ? requestAnimationFrame(render) : null;
    };

    window.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse') return;
        targetX = event.clientX;
        targetY = event.clientY;
        if (!dot.classList.contains('is-visible')) {
            // โผล่ครั้งแรก/กลับเข้าหน้าต่าง: วางที่ปลายเมาส์เลย ไม่ลากมาจากที่เดิม
            x = targetX;
            y = targetY;
            dot.classList.add('is-visible');
        }
        requestTone();
        if (frameId === null) frameId = requestAnimationFrame(render);
    }, { passive: true });

    window.addEventListener('scroll', requestTone, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => dot.classList.remove('is-visible'));
})();
