/* เกลียวการ์ดตัวตนในคอลัมน์ภาพของ playbook-hero (personalized-playbook.html)
   พอร์ตจาก InfiniteSpiral ของ React Bits มาเป็น vanilla JS ตามโครงของหน้านี้
   หลักการเดียวกับต้นฉบับ: การ์ดทุกใบวางบนเส้นเกลียวเดียว ตำแหน่งบนเกลียวคือค่า progress
   ตัวเดียว แล้วแปลงเป็น x (sin) / z (cos) / ระยะแนวตั้ง ต่อการ์ดในแต่ละเฟรม
   - progress วิ่งตาม target แบบ exponential smoothing ไม่ใช่กระโดดตาม input ตรง ๆ
     การกวาดจึงนุ่มทั้งตอนเล่นเอง ตอนลาก และตอนสกรอลล์
   - ค่ารูปทรง (รัศมี ระยะ จำนวนใบต่อรอบ ฯลฯ) อ่านจาก custom property ของ section
     ไม่ได้ฮาร์ดโค้ดใน JS ขนาดต่อ breakpoint จึงคุมจาก CSS ที่เดียวเหมือน component อื่นในเว็บ
   - หยุดเองเมื่อออกนอกจอ และเมื่อผู้ใช้ปิด motion ในระบบ
   - ลากได้เฉพาะเมาส์ ปล่อยให้นิ้วปัดบนมือถือเป็นการเลื่อนหน้าเหมือนเดิม
   ไฟล์นี้ดูแลเฉพาะ hero ของหน้านี้ ไม่ผูกกับ carousel การ์ดใน section identity-cards */
(function () {
    'use strict';

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;
    const smoothstep = (min, max, value) => {
        const x = clamp((value - min) / (max - min || 1), 0, 1);

        return x * x * (3 - 2 * x);
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    function initSpiral(root) {
        const cards = [...root.querySelectorAll('[data-hero-spiral-card]')];

        if (!cards.length) return;

        const mode = root.dataset.mode || 'auto';
        const autoEnabled = mode === 'auto' || mode === 'all';
        const dragEnabled = mode === 'drag' || mode === 'all';
        const scrollEnabled = mode === 'scroll' || mode === 'all';
        const directionSign = root.dataset.direction === 'down' ? -1 : 1;
        const pauseOnHover = root.dataset.pauseOnHover !== 'false';

        let progress = 0;
        let targetProgress = 0;
        let autoSpeed = 0;
        let hovered = false;
        let visible = true;
        let dragging = false;
        let lastPointerY = 0;
        let previousTime = performance.now();
        let frameId = 0;
        let lastScrollY = window.scrollY;
        let bounds = root.getBoundingClientRect();
        let geometry = readGeometry();

        /* เลิกวนลูปเมื่อเลื่อนถึงจุดที่กำหนด: จำตำแหน่งบนเกลียวของการ์ดแต่ละใบไว้ ณ วินาทีนั้น
           แล้วให้ทุกใบไหลต่อไปทางเดียวจากจุดนั้น ไม่ผ่านการวนรอบอีก เสมือนไพ่ในกองหมดลง
           เลื่อนกลับขึ้นมาเมื่อไหร่ค่อยคืนการวนลูป — ใบที่เลยขอบไปแล้วจะถูกวนกลับมาโผล่
           อีกฝั่งซึ่งเป็นโซนที่จางจนมองไม่เห็นพอดี การคืนค่าจึงไม่มีอาการกระตุก */
        const heroSection = root.closest('.playbook-hero');
        let heroTop = 0;
        let heroHeight = 0;
        let unwrapped = false;
        let freezeProgress = 0;
        const freezeOffsets = cards.map(() => 0);

        function readHeroBox() {
            if (!heroSection) return;

            heroTop = heroSection.offsetTop;
            heroHeight = Math.max(heroSection.offsetHeight, 1);
        }
        /* ค่าที่เขียนลง style ไปแล้วของการ์ดแต่ละใบ ใช้กันการเขียนซ้ำค่าเดิมทุกเฟรม
           โดยเฉพาะ filter ที่แตะทีไรเบราว์เซอร์ต้องวาดการ์ดใบนั้นใหม่ทั้งใบ
           เหลือเพียง transform เท่านั้นที่เปลี่ยนจริงทุกเฟรม */
        const written = cards.map(() => ({ transform: '', opacity: '', filter: '', zIndex: '' }));

        /* ค่ารูปทรงทั้งชุดมาจาก token ของ section ส่วนขนาดการ์ดวัดจากกล่องจริง
           (CSS เป็นคนกำหนดขนาดต่อ breakpoint) อ่านใหม่ทุกครั้งที่กรอบเปลี่ยนขนาด */
        function readGeometry() {
            const styles = getComputedStyle(root);
            const read = (name, fallback) => {
                const value = parseFloat(styles.getPropertyValue(name));

                return Number.isFinite(value) ? value : fallback;
            };

            return {
                speed: read('--bt-playbook-hero-spiral-speed', 0.55),
                radius: read('--bt-playbook-hero-spiral-radius', 170),
                /* เพดานรัศมี คิดเป็นสัดส่วนของความกว้างกรอบ ใช้ค่าที่เล็กกว่าระหว่างนี้กับ radius
                   จอเล็กตั้งค่านี้ให้วงแหวนหดตามความกว้างจอพอดี (CSS ใส่ vw ให้ JS อ่านตรง ๆ ไม่ได้) */
                radiusCap: read('--bt-playbook-hero-spiral-radius-cap', 0.36),
                spacing: read('--bt-playbook-hero-spiral-spacing', 62),
                perspective: read('--bt-playbook-hero-spiral-perspective', 1000),
                cardsPerTurn: Math.max(read('--bt-playbook-hero-spiral-cards-per-turn', 7), 1),
                rotation: read('--bt-playbook-hero-spiral-rotation', 0),
                tilt: read('--bt-playbook-hero-spiral-tilt', 0),
                centerScale: read('--bt-playbook-hero-spiral-center-scale', 1.2),
                edgeFade: read('--bt-playbook-hero-spiral-edge-fade', 0.3),
                edgeBlur: read('--bt-playbook-hero-spiral-edge-blur', 6),
                unwrapAt: read('--bt-playbook-hero-spiral-unwrap-at', 0.8),
                /* 0 = ไม่เร่งตามสกรอลล์ (ต่ำกว่า lg ใช้ค่านี้) ค่าอื่นคูณเข้ากับระยะที่เลื่อน */
                scrollDrive: read('--bt-playbook-hero-spiral-scroll-drive', 1),
                /* กี่เท่าของความสูงการ์ดที่กรอบต้องมี ก่อนจะเริ่มย่อทั้งชุด (2.35 = เกลียวตั้ง, ~1.5 = วงแหวน) */
                fitRows: Math.max(read('--bt-playbook-hero-spiral-fit-rows', 2.35), 1),
                cardWidth: Math.max(cards[0].offsetWidth, 1),
                cardHeight: Math.max(cards[0].offsetHeight, 1),
            };
        }

        const render = (time) => {
            const delta = Math.min((time - previousTime) / 1000, 0.05);

            previousTime = time;

            /* เร่ง-ผ่อนความเร็วอัตโนมัติแทนการเปิด-ปิดทันที เวลาเมาส์เข้า-ออกจึงไม่กระตุก */
            const paused = dragging || (pauseOnHover && hovered);
            const desiredSpeed = autoEnabled && visible && !reduceMotion.matches && !paused
                ? geometry.speed * directionSign
                : 0;

            autoSpeed += (desiredSpeed - autoSpeed) * (1 - Math.exp(-delta * 7));
            targetProgress += autoSpeed * delta;
            progress += (targetProgress - progress) * (1 - Math.exp(-delta * (dragging ? 22 : 11)));

            const count = cards.length;
            const half = count / 2;
            const width = Math.max(bounds.width, 1);
            const height = Math.max(bounds.height, 1);
            /* ย่อทั้งเกลียวลงถ้ากรอบแคบกว่าที่การ์ดชุดนี้ต้องการ สัดส่วนภายในจึงคงเดิมทุกจอ */
            const fit = Math.min(1, width / (geometry.cardWidth * 2.8), height / (geometry.cardHeight * geometry.fitRows));
            const spiralRadius = Math.min(geometry.radius, Math.max(72, width * geometry.radiusCap)) * fit;
            const fadeStart = clamp(1 - geometry.edgeFade, 0, 0.98);

            /* unwrapAt ≤ 0 = ปิดการเลิกวนลูป (≤991 ตั้งค่านี้: วงแหวนอยู่ท้าย hero ยังเห็นเต็มตอนถึงจุดนั้น
               ถ้าปล่อยให้เลิกวนลูป การ์ดจะไหลออกข้างหนึ่งจนหมดทั้งที่คนยังดูอยู่)
               ย่อจอจาก desktop ที่เลิกวนลูปไปแล้ว ก็คืนการวนลูปให้ทันที */
            if (geometry.unwrapAt <= 0) {
                unwrapped = false;
            } else if (heroHeight) {
                // ระยะจากขอบล่างของ section ถึงขอบบนจอ เทียบเป็นสัดส่วนของความสูงจอ
                const sectionBottom = (heroTop + heroHeight - window.scrollY) / Math.max(window.innerHeight, 1);

                if (!unwrapped && sectionBottom <= geometry.unwrapAt) {
                    unwrapped = true;
                    freezeProgress = progress;
                    cards.forEach((_, index) => {
                        freezeOffsets[index] = modulo(index - progress + half, count) - half;
                    });
                } else if (unwrapped && sectionBottom > geometry.unwrapAt + 0.05) {
                    unwrapped = false;
                }
            }

            cards.forEach((card, index) => {
                /* ปกติใบที่เลยปลายด้านหนึ่งไปแล้วจะวนกลับมาโผล่อีกด้าน เกลียวจึงไม่มีหัว-ท้าย
                   แต่หลังเลิกวนลูป ทุกใบไหลต่อจากตำแหน่งที่จำไว้ด้วยระยะเท่ากัน จึงไม่กระโดด */
                let offset = unwrapped
                    ? freezeOffsets[index] - (progress - freezeProgress)
                    : modulo(index - progress + half, count) - half;

                const edge = Math.min(Math.abs(offset) / Math.max(half, 1), 1);
                const opacity = 1 - smoothstep(fadeStart, 1, edge);
                const focus = 1 - Math.min(Math.abs(offset) / Math.max(geometry.cardsPerTurn * 0.65, 1), 1);
                const angle = ((offset * (360 / geometry.cardsPerTurn) + geometry.rotation) * Math.PI) / 180;
                const x = Math.sin(angle) * spiralRadius;
                const z = Math.cos(angle) * spiralRadius;
                // ใบที่อยู่ใกล้ผู้ชม (z มาก) ต้องใหญ่ขึ้นตามระยะ perspective ของเวที
                const depthScale = clamp(geometry.perspective / Math.max(geometry.perspective - z, 1), 0.72, 1.45);
                const scale = (1 + (geometry.centerScale - 1) * focus) * fit * depthScale;
                const depth = (z / Math.max(spiralRadius, 1) + 1) / 2;
                const blur = geometry.edgeBlur * smoothstep(0.35, 1, edge);

                /* ปัดค่าให้หยาบลงก่อนเทียบ: ตำแหน่งละเอียด 0.1px พอสำหรับสายตา ส่วน blur
                   ปัดเป็นขั้นละ 0.5px ค่าจึงเปลี่ยนไม่กี่ครั้งตลอดรอบ ไม่ใช่ทุกเฟรม */
                const nextTransform = 'translate(-50%, -50%) translate3d(' + x.toFixed(1) + 'px, '
                    + (offset * geometry.spacing * fit).toFixed(1) + 'px, 0) rotateZ('
                    + geometry.tilt + 'deg) scale(' + scale.toFixed(3) + ')';
                const nextOpacity = opacity.toFixed(2);
                const nextFilter = blur > 0.25 ? 'blur(' + (Math.round(blur * 2) / 2).toFixed(1) + 'px)' : 'none';
                const nextZIndex = String(Math.round(depth * 1000) + index);
                const state = written[index];

                if (state.transform !== nextTransform) {
                    card.style.transform = nextTransform;
                    state.transform = nextTransform;
                }

                if (state.opacity !== nextOpacity) {
                    card.style.opacity = nextOpacity;
                    state.opacity = nextOpacity;
                }

                if (state.filter !== nextFilter) {
                    card.style.filter = nextFilter;
                    state.filter = nextFilter;
                }

                if (state.zIndex !== nextZIndex) {
                    card.style.zIndex = nextZIndex;
                    state.zIndex = nextZIndex;
                }            });

            frameId = requestAnimationFrame(render);
        };

        readHeroBox();
        window.addEventListener('load', readHeroBox, { once: true });

        if ('ResizeObserver' in window) {
            new ResizeObserver(() => {
                bounds = root.getBoundingClientRect();
                geometry = readGeometry();
                readHeroBox();
            }).observe(root);
        }

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                visible = entry.isIntersecting;
                // ยกเลิกลูปทั้งหมดตอนเลื่อนพ้น hero ไปแล้ว ไม่ให้เสีย GPU ทิ้งไว้เบื้องหลัง
                root.classList.toggle('is-running', visible);
                if (visible && !frameId) {
                    previousTime = performance.now();
                    frameId = requestAnimationFrame(render);
                } else if (!visible && frameId) {
                    cancelAnimationFrame(frameId);
                    frameId = 0;
                }
            }, { threshold: 0.02 }).observe(root);
        }

        if (scrollEnabled) {
            window.addEventListener('scroll', () => {
                const nextScrollY = window.scrollY;
                const scrollDelta = nextScrollY - lastScrollY;

                lastScrollY = nextScrollY;
                if (!visible || !scrollDelta || !geometry.scrollDrive) return;

                /* ตัวหารคือ "ระยะสกรอลล์ต่อหนึ่งใบ" ปกติผูกกับระยะไต่แนวตั้งของเกลียว (spacing x 2)
                   แต่ผังวงแหวนแนวนอนตั้ง spacing เป็น 0 ถ้าปล่อยให้ตัวหารเหลือ 1
                   การเลื่อน 1px จะเท่ากับหมุนไป 1 ใบ เกลียวจึงหมุนติ้วทันทีที่แตะสกรอลล์
                   กรณีนั้นใช้ความสูงการ์ดแทน ให้ยังได้ความรู้สึก "เลื่อนหนึ่งใบต่อหนึ่งช่วงการ์ด"
                   (ค่าปกติที่ spacing > 0 ไม่เปลี่ยน desktop จึงเหมือนเดิมทุกประการ) */
                const perCard = geometry.spacing > 0 ? geometry.spacing * 2 : geometry.cardHeight;

                targetProgress += clamp(
                    (scrollDelta * geometry.scrollDrive * (Math.max(geometry.speed, 0) / 0.55)) / Math.max(perCard, 1),
                    -1.5,
                    1.5,
                );
            }, { passive: true });
        }

        if (pauseOnHover) {
            root.addEventListener('mouseenter', () => {
                hovered = true;
            });
            root.addEventListener('mouseleave', () => {
                hovered = false;
            });
        }

        /* ลากได้เฉพาะเมาส์/ปากกา ถ้าปล่อยให้ลากด้วยนิ้วด้วย การปัดขึ้น-ลงบนมือถือ
           จะกลายเป็นการหมุนเกลียวแทนการเลื่อนหน้า */
        if (dragEnabled) {
            const stopDragging = (event) => {
                if (!dragging) return;

                dragging = false;
                if (root.hasPointerCapture && root.hasPointerCapture(event.pointerId)) {
                    root.releasePointerCapture(event.pointerId);
                }
                root.classList.remove('is-dragging');
            };

            root.classList.add('is-draggable');
            root.addEventListener('pointerdown', (event) => {
                if (event.button !== 0 || !finePointer.matches) return;

                dragging = true;
                lastPointerY = event.clientY;
                targetProgress = progress;
                root.classList.add('is-dragging');
                if (root.setPointerCapture) {
                    try {
                        root.setPointerCapture(event.pointerId);
                    } catch (error) {
                        /* เบราว์เซอร์บางตัวไม่ยอม capture ระหว่างลาก ใช้ pointermove ปกติต่อไป */
                    }
                }
            });
            root.addEventListener('pointermove', (event) => {
                if (!dragging) return;

                targetProgress -= (event.clientY - lastPointerY) / Math.max(geometry.spacing, 1);
                lastPointerY = event.clientY;
            });
            root.addEventListener('pointerup', stopDragging);
            root.addEventListener('pointercancel', stopDragging);
        }

        root.classList.add('is-ready', 'is-running');
        frameId = requestAnimationFrame(render);
    }

    document.querySelectorAll('[data-hero-spiral]').forEach(initSpiral);
})();
