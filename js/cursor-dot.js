/* จุดเล็ก ๆ วิ่งตามปลายเมาส์ (ตามภาพตัวอย่าง) ไม่แทนเคอร์เซอร์เดิม
   - สีดำบนพื้นสว่าง สีขาวบนพื้นมืด (ดู isDarkAt)
   - ตามแบบหน่วงเล็กน้อย (lerp) ให้ดูลื่น ผู้ที่ตั้งค่าลด motion จะติดปลายเมาส์ทันที
   - เฉพาะอุปกรณ์ที่มีเมาส์ (hover + pointer: fine) มือถือ/แท็บเล็ตไม่แสดง
   - ซ่อนเมื่อเมาส์ออกนอกหน้าต่าง
   - ชี้ส่วนที่มี data-cursor-label (เช่นวิดีโอใน Concept) จุดขยายเป็นวงกลมพร้อมข้อความนั้น */
(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const EASE = reduced ? 1 : 0.22; // สัดส่วนที่ขยับเข้าหาเมาส์ต่อเฟรม
    const MORPH_EASE = 0.1; // ช้ากว่าปกติตอนลอยออกจากชิ้นต้นทาง (data-cursor-origin) ให้เห็นการเดินทาง
    let ease = EASE;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'cursor-dot__label';
    dot.appendChild(label);
    document.body.appendChild(dot);

    // ข้อความในวงกลมตามส่วนที่ชี้อยู่ ("" = จุดปกติ)
    // data-cursor-origin (selector ภายในส่วนนั้น เช่นปุ่ม play กลางวิดีโอ): วงกลมเริ่มจากตำแหน่ง/ขนาดของชิ้นนั้น
    // แล้วค่อยลอยมาหาเมาส์ (ชิ้นเดิมจางหายด้วย CSS) ดูเหมือนปุ่มกลางวิดีโอกลายเป็นเคอร์เซอร์ Play
    let currentLabel = '';
    const setLabelFrom = el => {
        const host = el?.closest?.('[data-cursor-label]');
        const text = host?.dataset.cursorLabel || '';
        if (text === currentLabel) return;
        currentLabel = text;
        if (text) label.textContent = text;

        const origin = text && host.dataset.cursorOrigin ? host.querySelector(host.dataset.cursorOrigin) : null;
        // ขนาดวงกลมเท่าชิ้นต้นทางตลอดที่อยู่ในส่วนนั้น ออกแล้วคืนขนาดจุดปกติ
        if (origin) dot.style.setProperty('--bt-cursor-dot-size', `${origin.getBoundingClientRect().width}px`);
        else dot.style.removeProperty('--bt-cursor-dot-size');

        if (origin && !reduced && dot.classList.contains('is-visible')) {
            const box = origin.getBoundingClientRect();
            // วางทับชิ้นต้นทางทันที (ปิด transition ชั่วคราว) แล้วลอยตามเมาส์
            dot.classList.add('is-snapping', 'has-label');
            x = box.left + box.width / 2;
            y = box.top + box.height / 2;
            dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            ease = MORPH_EASE;
            void dot.offsetWidth;
            dot.classList.remove('is-snapping');
            if (frameId === null) frameId = requestAnimationFrame(render);
            return;
        }
        dot.classList.toggle('has-label', Boolean(text));
    };

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
            // scroll แล้วส่วนที่อยู่ใต้เมาส์ (ที่นิ่งอยู่) อาจเปลี่ยน ตรวจป้ายข้อความใหม่ด้วย
            setLabelFrom(document.elementFromPoint(targetX, targetY));
            dot.classList.toggle('is-on-dark', isDarkAt(targetX, targetY));
        });
    };

    let targetX = -100;
    let targetY = -100;
    let x = targetX;
    let y = targetY;
    let frameId = null;

    const render = () => {
        x += (targetX - x) * ease;
        y += (targetY - y) * ease;
        dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        const distance = Math.abs(targetX - x) + Math.abs(targetY - y);
        if (distance < 2) ease = EASE; // ถึงเมาส์แล้วกลับมาตามด้วยความเร็วปกติ
        frameId = distance > 0.1 ? requestAnimationFrame(render) : null;
    };

    window.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse') return;
        targetX = event.clientX;
        targetY = event.clientY;
        setLabelFrom(event.target);
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
