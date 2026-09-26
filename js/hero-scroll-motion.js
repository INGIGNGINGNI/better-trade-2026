/* Motion ตอนเลื่อนจาก Hero ลงไป Ticket (เฉพาะ desktop ผังซ้าย-ขวา)
   scrub ตาม scroll ไม่ pin: ตั้งแต่ hero ชิดขอบบนจอ จนการ์ดบัตรขึ้นมาถึง 55% ของจอ
   - คอลัมน์ข้อความจางและลอยขึ้น (ออกเร็ว)
   - ภาพวิทยากรเลื่อนลงช้ากว่าหน้า + ย่อเล็กน้อย (มีความลึก)
   - กำแพงแยกออกด้านข้าง
   - stock / bitcoin / card / gold บินลงไปรวมที่กึ่งกลาง (แนวนอน) ของการ์ดบัตร Ultimate ขนาดเท่าเดิม แล้วจางหาย
     ไอคอนที่เหลือ (triangle, heart) จางออก
   เริ่มหลัง loader จบ (ไอคอนต้องกระจายเข้าที่ก่อน) ข้ามทั้งหมดถ้าผู้ใช้ตั้งค่าลด motion
   ย้อนกลับ: ลบ <script src="js/hero-scroll-motion.js"> ใน index.html และคลาส .hero.is-scroll-motion ใน style.css */
(() => {
    const LOADER_COMPLETE_EVENT = 'bettertrade:loader-complete';
    const DESKTOP_QUERY = '(min-width: 992px) and (min-aspect-ratio: 6/5) and (prefers-reduced-motion: no-preference)';
    // stock / bitcoin / card / gold บินลงไปรวมที่กึ่งกลาง (แนวนอน) ของการ์ดบัตร Ultimate ขนาดเท่าเดิม แล้วจางหายหลังการ์ด
    const FLIGHTS = ['stock', 'bitcoin', 'card', 'gold'].map(asset => ({ asset, plan: '.ticket__plan--ultimate' }));
    const FADERS = ['triangle', 'heart'];

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const hero = document.getElementById('hero');
    const ticketPlans = document.querySelector('.ticket__plans');
    if (!hero || !ticketPlans) return;

    const q = selector => hero.querySelector(selector);
    const asset = key => hero.querySelector(`[data-hero-asset="${key}"]`);

    /* ระยะที่ไอคอนต้องเลื่อน วัดในพิกัดเอกสาร (หน้าเลื่อนไปด้วยกันทั้ง hero และ ticket ระยะจึงคงที่)
       แล้วหมุนกลับเป็นแกนของ .hero-asset ที่เอียงอยู่ (--rot) เพราะ tween ขยับ .hero-asset__inner ข้างใน */
    /* จุดหมาย: กึ่งกลางแนวนอนของการ์ด (plan) ที่ระดับเดียวกับไอคอนบนหัวการ์ด (ไอคอนอยู่ชิดซ้ายของการ์ด
       ถ้าเล็งที่ไอคอน ไอคอนจะลงเอียงไปทางซ้าย) ไอคอนจึงลงตรงกลางการ์ดแล้วมุดหายหลังขอบบนของการ์ด */
    function flightDelta(node, plan) {
        const from = node.getBoundingClientRect();
        const card = plan.getBoundingClientRect();
        const icon = (plan.querySelector('.ticket__plan-icon') || plan).getBoundingClientRect();
        // การ์ดบัตรอาจยังถูกดันลงด้วย reveal (translateY) อยู่ หักออกให้ได้ตำแหน่งจริง
        const planShift = new DOMMatrixReadOnly(getComputedStyle(plan).transform).m42;
        const dx = (card.left + card.width / 2) - (from.left + from.width / 2);
        const dy = (icon.top + icon.height / 2 - planShift) - (from.top + from.height / 2);
        const rotation = Number.parseFloat(getComputedStyle(node).getPropertyValue('--rot')) || 0;
        const angle = rotation * Math.PI / 180;
        return {
            x: Math.cos(angle) * dx + Math.sin(angle) * dy,
            y: -Math.sin(angle) * dx + Math.cos(angle) * dy,
            rotation: -rotation,
        };
    }

    function setup() {
        const mm = gsap.matchMedia();

        mm.add(DESKTOP_QUERY, () => {
            hero.classList.add('is-scroll-motion');

            const tl = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                    trigger: hero,
                    start: 'top top',
                    endTrigger: ticketPlans,
                    end: 'top 55%',
                    // ผูกกับตำแหน่ง scroll ตรง ๆ (ไม่หน่วง) ไอคอนจึงเลื่อนตามนิ้ว/ล้อทันที
                    // (scrub แบบหน่วงทำให้ไอคอนค้างแล้วค่อยวิ่งตามตอนหยุดเลื่อน)
                    scrub: true,
                    invalidateOnRefresh: true,
                    // ไอคอนต้องลอยข้าม hero ลงไปทับ ticket และอยู่หน้าภาพระหว่างบิน ยกชั้นเฉพาะตอนเริ่มเลื่อน
                    // (ตอนอยู่นิ่ง ไอคอนยังอยู่หลังเนื้อหา/ภาพตามเดิม)
                    onUpdate: self => {
                        const flying = self.progress > 0.02;
                        if (flying === hero.classList.contains('is-icons-flying')) return;
                        hero.classList.toggle('is-icons-flying', flying);
                        // hero-loader.js หยุดการลอย idle ระหว่างบิน (เส้นทางบินจะได้ไม่เอียงตาม float)
                        window.dispatchEvent(new CustomEvent('bettertrade:hero-icons-flying', { detail: { flying } }));
                    },
                },
            });

            tl.to(q('.hero__content'), { y: -90, opacity: 0, duration: 0.45 }, 0)
                .to(q('.hero__speakers img'), { yPercent: 10, scale: 0.94, transformOrigin: '50% 100%', duration: 0.8 }, 0)
                .to(q('.hero__wall--left'), { xPercent: -14, duration: 0.8 }, 0)
                .to(q('.hero__wall--right'), { xPercent: 14, duration: 0.8 }, 0);

            FADERS.forEach(key => {
                const inner = asset(key)?.querySelector('.hero-asset__inner');
                if (inner) tl.to(inner, { y: -120, opacity: 0, duration: 0.4 }, 0.05);
            });

            FLIGHTS.forEach(({ asset: key, plan }, i) => {
                const node = asset(key);
                const target = ticketPlans.querySelector(plan);
                const inner = node?.querySelector('.hero-asset__inner');
                if (!node || !target || !inner) return;

                const delta = () => flightDelta(node, target);
                tl.to(inner, {
                    x: () => delta().x,
                    y: () => delta().y,
                    rotation: () => delta().rotation,
                    ease: 'power1.inOut',
                    duration: 0.8,
                }, 0.12 + i * 0.04)
                    .to(inner, { opacity: 0, duration: 0.1 }, 0.9);
            });

            return () => hero.classList.remove('is-scroll-motion', 'is-icons-flying');
        });
    }

    const loaderDone = !document.body.classList.contains('is-loading') && !document.getElementById('loader');
    if (loaderDone) setup();
    else window.addEventListener(LOADER_COMPLETE_EVENT, setup, { once: true });
})();
