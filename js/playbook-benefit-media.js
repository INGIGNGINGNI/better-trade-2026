/* ตัวอย่างหน้าจอใน section "What you get" ของ personalized-playbook.html
   มีสามอย่างที่ต้องใช้ JS
   1) การ์ดเลื่อนเทียบก่อนงาน/หลังงาน — ลาก/กดลูกศรเพื่อเปลี่ยนสัดส่วนที่เห็นของการ์ดแต่ละใบ
   2) intro sweep — กวาดเส้นแบ่งไป-กลับหนึ่งรอบตอนการ์ดเข้าจอครั้งแรก เพื่อบอกว่าการ์ดนี้ลากได้
      (ไม่ใช่ลูกเล่น: before/after slider ที่ไม่ขยับเลย ผู้ใช้มักไม่รู้ว่ามีการ์ดอีกใบซ่อนอยู่)
   3) motion ภายในกรอบ — เติม .is-revealed ให้กรอบตอนเข้าจอครั้งแรก แล้วปล่อยให้ CSS ไล่จังหวะเอง
   ทุกอย่างเล่นครั้งเดียว ไม่เล่นซ้ำเมื่อเลื่อนกลับ และข้ามไปสถานะปลายทางทันทีเมื่อผู้ใช้ปิด motion */
(function () {
    'use strict';

    /* เส้นทางของ intro sweep: ออกจากตำแหน่งพัก กวาดไปสุดฝั่งก่อนงาน แล้วกลับไปสุดฝั่งหลังงาน
       ก่อนกลับมาหยุดที่เดิม หนึ่งรอบ — เห็นทั้งสองใบครบโดยไม่ต้องเล่นซ้ำ
       ความยาวแต่ละช่วงคิดตามระยะทาง ความเร็วจึงสม่ำเสมอตลอดเส้นทาง */
    const SWEEP_PATH = [50, 85, 15, 50];
    const SWEEP_DURATION = 2400;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ออกตัวนุ่มและหยุดนุ่มทั้งสองด้าน (ease-in-out) ให้การกวาดไม่กระชากหัวท้าย
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function observeOnce(elements, onEnter) {
        if (!elements.length) return;

        if (!('IntersectionObserver' in window)) {
            elements.forEach(onEnter);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                observer.unobserve(entry.target);
                onEnter(entry.target);
            });
        }, { threshold: 0.3 });

        elements.forEach((element) => observer.observe(element));
    }

    function initCompare(root) {
        const before = root.querySelector('[data-benefit-compare-before]');
        const divider = root.querySelector('[data-benefit-compare-divider]');
        const handle = root.querySelector('[data-benefit-compare-handle]');
        const chipBefore = root.querySelector('[data-benefit-compare-chip-before]');
        const chipAfter = root.querySelector('[data-benefit-compare-chip-after]');

        if (!before || !divider || !handle) return;

        const startPosition = parseFloat(root.dataset.start || '50');
        let position = startPosition;
        let dragging = false;
        let sweepFrame = 0;

        const paint = () => {
            const x = Math.max(0, Math.min(100, position));

            before.style.clipPath = 'inset(0 ' + (100 - x).toFixed(2) + '% 0 0)';
            divider.style.left = x.toFixed(2) + '%';
            handle.setAttribute('aria-valuenow', String(Math.round(x)));
            // ป้ายฝั่งไหนเหลือพื้นที่น้อยเกินไปก็จางหายไป ไม่ให้ทับเส้นแบ่ง
            if (chipBefore) chipBefore.style.opacity = x > 12 ? '1' : '0';
            if (chipAfter) chipAfter.style.opacity = x < 88 ? '1' : '0';
        };

        // ผู้ใช้แตะเมื่อไหร่ก็หยุดกวาดทันที ไม่ให้แย่งการควบคุมกลางคัน
        const stopSweep = () => {
            if (!sweepFrame) return;

            cancelAnimationFrame(sweepFrame);
            sweepFrame = 0;
        };

        const sweep = () => {
            if (reduceMotion.matches) return;

            const legs = SWEEP_PATH.slice(1).map((to, index) => ({ from: SWEEP_PATH[index], to }));
            const total = legs.reduce((sum, leg) => sum + Math.abs(leg.to - leg.from), 0);

            if (!total) return;

            let leg = 0;
            let startedAt = performance.now();
            let duration = SWEEP_DURATION * (Math.abs(legs[0].to - legs[0].from) / total);

            const step = (now) => {
                const progress = Math.min(1, (now - startedAt) / duration);

                position = legs[leg].from + (legs[leg].to - legs[leg].from) * easeInOut(progress);
                paint();

                if (progress < 1) {
                    sweepFrame = requestAnimationFrame(step);
                    return;
                }

                leg += 1;
                if (leg >= legs.length) {
                    sweepFrame = 0;
                    return;
                }

                startedAt = now;
                duration = SWEEP_DURATION * (Math.abs(legs[leg].to - legs[leg].from) / total);
                sweepFrame = requestAnimationFrame(step);
            };

            sweepFrame = requestAnimationFrame(step);
        };

        const fromClientX = (clientX) => {
            const box = root.getBoundingClientRect();

            position = ((clientX - box.left) / Math.max(1, box.width)) * 100;
            paint();
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

        root.addEventListener('dblclick', () => {
            stopSweep();
            position = 50;
            paint();
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
            paint();
        });

        /* จุดแรกของเส้นทางคือตำแหน่งพัก (เท่ากับ data-start) การ์ดจึงไม่กระโดดตอนเริ่มกวาด */
        if (!reduceMotion.matches) position = SWEEP_PATH[0];
        paint();
        observeOnce([root], sweep);
    }

    document.querySelectorAll('[data-benefit-compare]').forEach(initCompare);
    observeOnce(
        [...document.querySelectorAll('[data-benefit-reveal]')],
        (element) => element.classList.add('is-revealed'),
    );
})();
