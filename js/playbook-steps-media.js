/* ตัวอย่างการ์ดตัวตนในขั้นตอนที่ 1 ของ section "How it works" (personalized-playbook.html)
   พอร์ตพฤติกรรมจาก .cr2 ของ dna-quiz-flow
   1) การ์ดเลื่อนเทียบก่อนงาน/หลังงาน — ลาก/กดลูกศรเพื่อเปลี่ยนสัดส่วนที่เห็นของการ์ดแต่ละใบ
   2) persona ผูกกับ slider — ข้ามจุด 50% เมื่อไหร่ ป้ายตระกูลและนิยามจะสลับเป็นของฝั่งที่เห็นมากกว่า
      (ตำแหน่ง ≥ 50 = การ์ดก่อนงานคลุมพื้นที่มากกว่า) สลับเฉพาะตอนข้ามเส้นจริง ไม่ใช่ทุกพิกเซลที่ลาก
   3) intro sweep (ถ้าตั้ง data-sweep-from ต่างจาก data-start) — กวาดหนึ่งรอบตอนเข้าจอครั้งแรก
      ระหว่างกวาดไม่สลับ persona (เหมือนต้นฉบับ) ไม่งั้นข้อความจะกระพริบสองรอบตอนเล่นอัตโนมัติ
      ตอนนี้ขั้นตอนที่ 1 เปิดมาที่การ์ดก่อนงานเต็มใบ แถบชิดขวาสุด จึงตั้งสองค่าเท่ากันและไม่กวาด
   ไฟล์นี้ดูแลเฉพาะ section นี้ ไม่ผูกกับตัวเลื่อนเทียบของ section อื่น */
(function () {
    'use strict';

    const SWEEP_DURATION = 1100;
    const PERSONA_THRESHOLD = 50;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function initCompare(root) {
        const before = root.querySelector('[data-steps-compare-before]');
        const divider = root.querySelector('[data-steps-compare-divider]');
        const handle = root.querySelector('[data-steps-compare-handle]');
        const chipBefore = root.querySelector('[data-steps-compare-chip-before]');
        const chipAfter = root.querySelector('[data-steps-compare-chip-after]');
        const scope = root.closest('.playbook-steps__preview') || document;
        const personas = {
            before: scope.querySelector('[data-steps-persona="before"]'),
            after: scope.querySelector('[data-steps-persona="after"]'),
        };

        if (!before || !divider || !handle) return;

        const startPosition = parseFloat(root.dataset.start || '50');
        const sweepFrom = parseFloat(root.dataset.sweepFrom || String(startPosition));
        let position = startPosition;
        let dragging = false;
        let sweepFrame = 0;
        let activeSide = 'before';

        const paint = () => {
            const x = Math.max(0, Math.min(100, position));

            before.style.clipPath = 'inset(0 ' + (100 - x).toFixed(2) + '% 0 0)';
            divider.style.left = x.toFixed(2) + '%';
            handle.setAttribute('aria-valuenow', String(Math.round(x)));
            // ป้ายฝั่งไหนเหลือพื้นที่น้อยเกินไปก็จางหายไป ไม่ให้ทับเส้นแบ่ง
            if (chipBefore) chipBefore.style.opacity = x > 12 ? '1' : '0';
            if (chipAfter) chipAfter.style.opacity = x < 88 ? '1' : '0';
        };

        const syncPersona = () => {
            const side = position >= PERSONA_THRESHOLD ? 'before' : 'after';

            if (side === activeSide || !personas.before || !personas.after) return;

            activeSide = side;
            Object.entries(personas).forEach(([key, element]) => {
                const isActive = key === side;

                element.classList.toggle('is-active', isActive);
                element.setAttribute('aria-hidden', String(!isActive));
            });
        };

        // การขยับที่มาจากผู้ใช้ (ลาก/คีย์บอร์ด/ดับเบิลคลิก) เท่านั้นที่สลับ persona
        const moveByUser = () => {
            paint();
            syncPersona();
        };

        const stopSweep = () => {
            if (!sweepFrame) return;

            cancelAnimationFrame(sweepFrame);
            sweepFrame = 0;
        };

        const sweep = () => {
            // ตำแหน่งเริ่มกับตำแหน่งพักเท่ากัน (เปิดมาที่ฝั่งก่อนงานเต็มใบ) ก็ไม่ต้องกวาด
            if (reduceMotion.matches || position === startPosition) return;

            const from = position;
            const startedAt = performance.now();

            const step = (now) => {
                const progress = Math.min(1, (now - startedAt) / SWEEP_DURATION);

                position = from + (startPosition - from) * easeInOut(progress);
                paint();
                sweepFrame = progress < 1 ? requestAnimationFrame(step) : 0;
            };

            sweepFrame = requestAnimationFrame(step);
        };

        const fromClientX = (clientX) => {
            const box = root.getBoundingClientRect();

            position = ((clientX - box.left) / Math.max(1, box.width)) * 100;
            moveByUser();
        };

        root.addEventListener('pointerdown', (event) => {
            stopSweep();
            dragging = true;
            if (root.setPointerCapture) {
                try {
                    root.setPointerCapture(event.pointerId);
                } catch (error) {
                    /* เบราว์เซอร์บางตัวไม่ยอม capture ระหว่างลาก ข้ามไปใช้ pointermove ปกติ */
                }
            }
            fromClientX(event.clientX);
        });

        root.addEventListener('pointermove', (event) => {
            if (dragging) fromClientX(event.clientX);
        });

        root.addEventListener('pointerup', () => {
            dragging = false;
        });

        root.addEventListener('pointercancel', () => {
            dragging = false;
        });

        // ดับเบิลคลิกกลับไปตำแหน่งตั้งต้น (ฝั่งก่อนงาน) ของขั้นตอนนี้
        root.addEventListener('dblclick', () => {
            stopSweep();
            position = startPosition;
            moveByUser();
        });

        handle.addEventListener('keydown', (event) => {
            const step = event.shiftKey ? 10 : 4;

            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') position -= step;
            else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') position += step;
            else if (event.key === 'Home') position = 0;
            else if (event.key === 'End') position = 100;
            else return;

            event.preventDefault();
            stopSweep();
            moveByUser();
        });

        /* ตั้งตำแหน่งเริ่มกวาดไว้ตั้งแต่แรก (ยังอยู่นอกจอ) แล้วค่อยกวาดตอนเข้าจอ
           จะได้ไม่เห็นการ์ดกระโดดจากตำแหน่งพักไปตำแหน่งเริ่มหนึ่งเฟรม */
        if (!reduceMotion.matches) position = sweepFrom;
        paint();

        if (!('IntersectionObserver' in window)) {
            position = startPosition;
            paint();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                observer.unobserve(entry.target);
                sweep();
            });
        }, { threshold: 0.3 });

        observer.observe(root);
    }

    document.querySelectorAll('[data-steps-compare]').forEach(initCompare);
})();
