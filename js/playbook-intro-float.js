/* การ์ดลอยรอบข้อความใน section playbook-intro (personalized-playbook.html)
   พอร์ตพฤติกรรมจาก Parallax Floating ของ fancycomponents.dev มาเป็น vanilla JS
   กลไกเดียวกับต้นฉบับ: แต่ละใบมีค่า depth ของตัวเอง ตำแหน่งเป้าหมายคิดจากตำแหน่งเคอร์เซอร์
   เทียบกับกรอบ แล้วไล่เข้าหาเป้าหมายแบบ lerp ทุกเฟรม ใบที่ depth สูงจึงขยับมากกว่า
   - ถอยออกจากเคอร์เซอร์ (ต้นฉบับใช้ sensitivity ติดลบในตัวอย่าง) ให้อ่านเป็นระยะลึก
   - ระยะขยับสูงสุดมาจาก token ของ section ไม่ได้ฮาร์ดโค้ด ปรับต่อ breakpoint ได้จาก CSS
   - ลูปหยุดเองเมื่อทุกใบเข้าที่แล้ว และไม่เริ่มเลยถ้าอยู่นอกจอ
   - ตัวชี้แบบสัมผัสไม่มีตำแหน่งเคอร์เซอร์ให้ตาม การ์ดจึงอยู่นิ่ง เหลือแค่จังหวะโผล่ตอนเข้าจอ
   ไฟล์นี้ดูแลเฉพาะ section นี้ ไม่ผูกกับเกลียวการ์ดใน hero */
(function () {
    'use strict';

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    /* พลิกหน้า-หลังเองเป็นรอบ ๆ แต่ละใบมีจังหวะเริ่มกับความถี่ของตัวเองจาก token
       หมุนสะสมไปทางเดียว (180 → 360 → 540) ไม่ใช่พลิกไป-กลับ ให้อ่านเป็นการ์ดที่หมุนจริง
       ค่า transform เขียนที่ชั้น flip ชั้นเดียว ไม่ไปยุ่งกับ transform ของอีกสองชั้น */
    function createFlipper(element) {
        const styles = getComputedStyle(element);
        const read = (name, fallback) => {
            const value = parseFloat(styles.getPropertyValue(name));

            return Number.isFinite(value) ? value : fallback;
        };
        const perspective = read('--bt-playbook-intro-float-flip-perspective', 900);
        const delay = Math.max(read('--bt-playbook-intro-float-flip-delay', 2000), 0);
        const period = Math.max(read('--bt-playbook-intro-float-flip-period', 6000), 1200);
        let angle = 0;
        let timer = 0;

        const turn = () => {
            angle += 180;
            element.style.transform = 'perspective(' + perspective + 'px) rotateY(' + angle + 'deg)';
        };

        return {
            start() {
                if (timer || reduceMotion.matches) return;

                // รอบแรกหน่วงตามค่าของใบนั้น รอบถัด ๆ ไปเว้นระยะเท่ากันไปเรื่อย ๆ
                timer = window.setTimeout(function tick() {
                    turn();
                    timer = window.setTimeout(tick, period);
                }, delay);
            },
            stop() {
                if (!timer) return;

                window.clearTimeout(timer);
                timer = 0;
            },
        };
    }

    function initFloat(root) {
        const items = [...root.querySelectorAll('[data-intro-float-item]')].map((element) => ({
            element,
            depth: parseFloat(element.dataset.depth) || 1,
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            written: '',
        }));

        if (!items.length) return;

        const section = root.closest('.playbook-intro') || root;
        const flippers = [...root.querySelectorAll('[data-intro-float-flip]')].map(createFlipper);
        /* การ์ดจะเริ่มกระจายก็ต่อเมื่อข้อความก้อนสุดท้ายของ section fade ขึ้นมาจบแล้ว
           ระบุตัวที่ต้องรอด้วย data-intro-float-after ใน markup ไม่ได้ผูกชื่อคลาสไว้ใน JS */
        const gates = [...section.querySelectorAll('[data-intro-float-after]')];
        let pendingGates = gates.length;
        let released = !pendingGates;
        let amplitude = readAmplitude();
        let bounds = root.getBoundingClientRect();
        let visible = false;
        let previousTime = 0;
        let frameId = 0;

        function readAmplitude() {
            const value = parseFloat(getComputedStyle(root).getPropertyValue('--bt-playbook-intro-float-amplitude'));

            return Number.isFinite(value) ? value : 26;
        }

        const reveal = () => {
            if (!released || !visible || root.classList.contains('is-revealed')) return;

            root.classList.add('is-revealed');
            flippers.forEach((flipper) => flipper.start());
        };

        const release = () => {
            if (released) return;

            released = true;
            reveal();
        };

        // ทุกก้อนที่รอต้องจบครบ การ์ดจึงจะเริ่มกระจาย ก้อนที่ไม่มี transition นับว่าจบทันที
        const resolveGate = () => {
            pendingGates -= 1;
            if (pendingGates <= 0) release();
        };

        /* อ่านเวลาที่ข้อความก้อนนั้นใช้ fade จาก computed style ของตัวมันเอง
           (delay + duration ของ property ที่ช้าที่สุด) แล้วตั้งเวลาตามนั้น
           ไม่ใช้ transitionend เพราะมันยิงตั้งแต่ property แรกจบ ไม่ใช่ตอนจบทั้งหมด
           และไม่ใช้ getAnimations เพราะจังหวะที่คลาสเพิ่งถูกใส่ ลิสต์ยังว่างอยู่ */
        const scheduleFromGate = (gate) => {
            if (released) return;

            const styles = getComputedStyle(gate);
            const toMs = (value) => {
                const text = String(value).trim();

                return (parseFloat(text) || 0) * (text.endsWith('ms') ? 1 : 1000);
            };
            const durations = styles.transitionDuration.split(',');
            const delays = styles.transitionDelay.split(',');
            let total = 0;

            durations.forEach((duration, index) => {
                total = Math.max(total, toMs(duration) + toMs(delays[index % delays.length] || '0s'));
            });

            window.setTimeout(resolveGate, total);
        };

        gates.forEach((gate) => {
            if (!('MutationObserver' in window)) {
                resolveGate();
                return;
            }

            if (gate.classList.contains('is-revealed')) {
                scheduleFromGate(gate);
                return;
            }

            // รอจนกว่า reveal-on-scroll จะติดคลาสให้ข้อความก้อนนี้ แล้วค่อยเริ่มจับเวลาของมัน
            const gateObserver = new MutationObserver(() => {
                if (!gate.classList.contains('is-revealed')) return;

                gateObserver.disconnect();
                scheduleFromGate(gate);
            });

            gateObserver.observe(gate, { attributes: true, attributeFilter: ['class'] });
        });

        const step = (time) => {
            const delta = Math.min((time - previousTime) / 1000, 0.05);

            previousTime = time;

            /* ต้นฉบับขยับเข้าหาเป้าหมายทีละ 5% ต่อเฟรม ที่นี่เขียนเป็นค่าต่อวินาทีแทน
               จังหวะจึงเท่ากันทุกเครื่อง ไม่ได้เร็วขึ้นตามจอที่รีเฟรช 120Hz */
            const blend = 1 - Math.exp(-delta * 3);
            let moving = false;

            items.forEach((item) => {
                item.x += (item.targetX - item.x) * blend;
                item.y += (item.targetY - item.y) * blend;

                if (Math.abs(item.targetX - item.x) > 0.05 || Math.abs(item.targetY - item.y) > 0.05) {
                    moving = true;
                }

                const next = 'translate3d(' + item.x.toFixed(1) + 'px, ' + item.y.toFixed(1) + 'px, 0)';

                if (item.written !== next) {
                    item.element.style.transform = next;
                    item.written = next;
                }
            });

            // เข้าที่ครบทุกใบแล้วก็เลิกวาด ไม่ต้องเดินลูปทิ้งไว้รอเคอร์เซอร์ขยับ
            frameId = moving ? requestAnimationFrame(step) : 0;
        };

        const start = () => {
            if (frameId || !visible) return;

            previousTime = performance.now();
            frameId = requestAnimationFrame(step);
        };

        const stop = () => {
            if (!frameId) return;

            cancelAnimationFrame(frameId);
            frameId = 0;
        };

        const aimAt = (clientX, clientY) => {
            const normalX = clamp(((clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1, -1, 1);
            const normalY = clamp(((clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 - 1, -1, 1);

            items.forEach((item) => {
                item.targetX = -normalX * item.depth * amplitude;
                item.targetY = -normalY * item.depth * amplitude;
            });
            start();
        };

        const rest = () => {
            items.forEach((item) => {
                item.targetX = 0;
                item.targetY = 0;
            });
            start();
        };

        if ('ResizeObserver' in window) {
            new ResizeObserver(() => {
                bounds = root.getBoundingClientRect();
                amplitude = readAmplitude();
            }).observe(root);
        }

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                visible = entry.isIntersecting;
                if (visible) {
                    // กรอบเพิ่งเลื่อนเข้ามา ตำแหน่งบนจอเปลี่ยนไปแล้ว ต้องวัดใหม่ก่อนคิดระยะเคอร์เซอร์
                    bounds = root.getBoundingClientRect();
                    reveal();
                    start();
                } else {
                    stop();
                    // เลื่อนพ้น section แล้วก็หยุดนับรอบ ไม่ปล่อยตัวจับเวลาทำงานทิ้งไว้
                    flippers.forEach((flipper) => flipper.stop());
                }
            }, { threshold: 0.12 }).observe(root);
        } else {
            visible = true;
            released = true;
            reveal();
        }

        /* จับการเคลื่อนไหวที่ระดับ section ไม่ใช่ที่การ์ด เพราะชั้นการ์ดปิด pointer-events ไว้
           (ไม่งั้นมันจะไปบังข้อความกับลิงก์ที่อยู่ด้านหลัง) */
        if (!reduceMotion.matches) {
            section.addEventListener('pointermove', (event) => {
                if (!finePointer.matches) return;

                bounds = root.getBoundingClientRect();
                aimAt(event.clientX, event.clientY);
            }, { passive: true });

            section.addEventListener('pointerleave', rest, { passive: true });
        }

        window.addEventListener('scroll', () => {
            // กรอบขยับตามหน้าเสมอ ค่าที่แคชไว้จึงต้องอัปเดต ไม่งั้นทิศทางจะเพี้ยนหลังเลื่อนหน้า
            if (visible) bounds = root.getBoundingClientRect();
        }, { passive: true });
    }

    document.querySelectorAll('[data-intro-float]').forEach(initFloat);
})();
