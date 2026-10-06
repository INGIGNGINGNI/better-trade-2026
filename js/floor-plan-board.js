/* Floor Plan: การ์ดผังบูธ
   - desktop (≥992px + เมาส์): magnifier (hover zoom) วงกลมลอยตามเมาส์ ดูรายละเอียดบนภาพได้ชัดขึ้น
   - ≤991px / จอสัมผัส: แตะภาพเพื่อเปิดภาพใหญ่ใน modal ซูมด้วยการถ่างนิ้ว แตะสองครั้ง หรือปุ่ม +/−
   แผงรายละเอียดบูธทางขวาเป็น Bootstrap accordion (data-bs-parent เปิดทีละโซนให้เอง) ไม่ต้องมีโค้ดที่นี่ */
(() => {
    const board = document.querySelector('[data-floor-plan-board]');
    if (!board) return;

    // ภาพผังบูธในการ์ด (ภาพรวม 3D อยู่ด้านบนแยกต่างหาก ไม่มี magnifier/modal)
    const activeImage = () => board.querySelector('.floor-plan__image');

    /* กรอบของ "ตัวภาพจริง" ในกล่อง img (ภาพใช้ object-fit: contain จึงอาจมีขอบว่างรอบ ๆ) */
    const contentRect = (img) => {
        const box = img.getBoundingClientRect();
        const ratio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
        const width = Math.min(box.width, box.height * ratio);
        const height = width / ratio;
        return {
            left: box.left + (box.width - width) / 2,
            top: box.top + (box.height - height) / 2,
            width,
            height,
        };
    };

    /* ---------- desktop: magnifier (hover zoom) ---------- */
    const visual = board.querySelector('.floor-plan__visual');
    const lens = board.querySelector('[data-floor-plan-lens]');
    const lensMedia = window.matchMedia('(min-width: 992px) and (hover: hover) and (pointer: fine)');
    const LENS_ZOOM = 2;

    const hideLens = () => lens?.classList.remove('is-visible');

    const moveLens = (event) => {
        if (!lens || !lensMedia.matches) return;
        const img = activeImage();
        if (!img?.complete || !img.naturalWidth) return;

        const rect = contentRect(img);
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            hideLens();
            return;
        }

        const size = lens.offsetWidth;
        const visualBox = visual.getBoundingClientRect();
        // เลนส์อยู่กึ่งกลางปลายเมาส์ แต่ไม่ล้นออกนอกกล่องภาพ
        const left = Math.min(Math.max(event.clientX - visualBox.left - size / 2, 0), visualBox.width - size);
        const top = Math.min(Math.max(event.clientY - visualBox.top - size / 2, 0), visualBox.height - size);

        lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
        lens.style.backgroundSize = `${rect.width * LENS_ZOOM}px ${rect.height * LENS_ZOOM}px`;
        // จุดใต้เมาส์อยู่กลางเลนส์เสมอ (ต่อให้เลนส์ถูกกันไว้ที่ขอบ)
        const centerX = event.clientX - visualBox.left - left;
        const centerY = event.clientY - visualBox.top - top;
        lens.style.backgroundPosition = `${centerX - x * LENS_ZOOM}px ${centerY - y * LENS_ZOOM}px`;
        lens.style.transform = `translate(${left}px, ${top}px)`;
        lens.classList.add('is-visible');
    };

    if (visual && lens) {
        visual.addEventListener('pointermove', (event) => {
            if (event.pointerType === 'mouse') moveLens(event);
        });
        visual.addEventListener('pointerleave', hideLens);
        lensMedia.addEventListener('change', hideLens);
    }

    /* ---------- ≤991px: ภาพใหญ่ใน modal + ซูม ---------- */
    const lightbox = document.querySelector('[data-floor-plan-lightbox]');
    const expand = board.querySelector('[data-floor-plan-expand]');
    if (!lightbox || !expand || typeof lightbox.showModal !== 'function') return;

    const viewport = lightbox.querySelector('[data-floor-plan-lightbox-viewport]');
    const bigImage = lightbox.querySelector('[data-floor-plan-lightbox-image]');
    const closeButton = lightbox.querySelector('[data-floor-plan-lightbox-close]');
    const zoomButtons = Array.from(lightbox.querySelectorAll('[data-floor-plan-zoom]'));
    const MIN_SCALE = 1;
    const MAX_SCALE = 4;
    const STEP = 1.5;
    let scale = 1;

    /* ซูมโดยคงจุดอ้างอิง (กลางจอ หรือจุดที่แตะ/ถ่างนิ้ว) ไว้ที่ตำแหน่งเดิมบนจอ */
    const setScale = (next, focusX = viewport.clientWidth / 2, focusY = viewport.clientHeight / 2) => {
        next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
        const ratio = next / scale;
        const pointX = viewport.scrollLeft + focusX;
        const pointY = viewport.scrollTop + focusY;
        scale = next;
        bigImage.style.width = `${scale * 100}%`;
        viewport.scrollLeft = pointX * ratio - focusX;
        viewport.scrollTop = pointY * ratio - focusY;
        lightbox.classList.toggle('is-zoomed', scale > MIN_SCALE);
        zoomButtons.forEach((button) => {
            const dir = Number(button.dataset.floorPlanZoom);
            button.disabled = dir < 0 ? scale <= MIN_SCALE : scale >= MAX_SCALE;
        });
    };

    const openLightbox = () => {
        const img = activeImage();
        if (!img) return;
        bigImage.src = img.currentSrc || img.src;
        bigImage.alt = img.alt;
        // กรอบใน modal สูงตามสัดส่วนภาพตอนพอดีกรอบ ซูมแล้วกรอบคงขนาด เลื่อนดูภาพข้างในแทน
        viewport.style.aspectRatio = `${img.naturalWidth || img.width} / ${img.naturalHeight || img.height}`;
        scale = 1;
        lightbox.showModal();
        document.documentElement.classList.add('has-floor-plan-lightbox');
        setScale(1, 0, 0);
    };

    expand.addEventListener('click', openLightbox);
    closeButton.addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('close', () => {
        document.documentElement.classList.remove('has-floor-plan-lightbox');
        expand.focus({ preventScroll: true });
    });
    // แตะ overlay สีดำนอก modal (คลิกโดนตัว dialog เองที่ ::backdrop) เพื่อปิด
    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) lightbox.close();
    });

    zoomButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const dir = Number(button.dataset.floorPlanZoom);
            setScale(dir > 0 ? scale * STEP : scale / STEP);
        });
    });

    // แตะสองครั้ง: สลับซูม 2.5 เท่า ณ จุดที่แตะ / กลับขนาดพอดีจอ
    viewport.addEventListener('dblclick', (event) => {
        const box = viewport.getBoundingClientRect();
        setScale(scale > MIN_SCALE ? MIN_SCALE : 2.5, event.clientX - box.left, event.clientY - box.top);
    });

    // ถ่างนิ้วสองนิ้วเพื่อซูม (กันไม่ให้ทั้งหน้าเว็บซูมแทน) นิ้วเดียวยังเลื่อนภาพได้ตามปกติ
    let pinch = null;
    const distance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    viewport.addEventListener('touchstart', (event) => {
        if (event.touches.length !== 2) return;
        const box = viewport.getBoundingClientRect();
        pinch = {
            start: distance(event.touches),
            scale,
            x: (event.touches[0].clientX + event.touches[1].clientX) / 2 - box.left,
            y: (event.touches[0].clientY + event.touches[1].clientY) / 2 - box.top,
        };
    }, { passive: true });
    viewport.addEventListener('touchmove', (event) => {
        if (!pinch || event.touches.length !== 2) return;
        event.preventDefault();
        setScale(pinch.scale * (distance(event.touches) / pinch.start), pinch.x, pinch.y);
    }, { passive: false });
    viewport.addEventListener('touchend', (event) => {
        if (event.touches.length < 2) pinch = null;
    });
})();
