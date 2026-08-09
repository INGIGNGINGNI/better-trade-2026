/* Scroll motion สำหรับการ์ด speaker
   โหลดหลัง gsap.min.js / ScrollTrigger.min.js และหลัง speaker-directory.js
   ที่เป็นคนสร้างการ์ดลง DOM

   สองเอฟเฟกต์:
   1. reveal ผูกกับ scroll โดยตรง (scrub) — ล้อเมาส์เป็นคนคุมจังหวะ หยุดล้อภาพก็หยุด
      เป็นสองทาง: เลื่อนขึ้นการ์ดถอยกลับไปตามช่วงเดิม trigger จึงอยู่ครบตลอดอายุแผง
   2. pan ภาพในกรอบตาม scroll โดยขยับ --speaker-portrait-y ที่ speaker-directory.js
      ตั้งไว้ต่อรูป ทำให้การจัดหัวให้เสมอกันทุกใบไม่เสีย */
(() => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    /* Moderators & MC ใช้การ์ดคอมโพเนนต์เดียวกับ Speaker จึงให้ motion ชุดนี้ดูแลด้วย
       ต่างกันแค่ไม่มีแท็บวัน กริดจึงมีชุดเดียวไม่ต้องเลือกว่าแผงไหนกำลังแสดง */
    const section = document.getElementById('speaker');
    const moderatorGrid = document.querySelector('.moderator__grid');
    if (!section && !moderatorGrid) return;

    /* เกณฑ์เดียวกับ hero-v2-scroll-motion.js เพื่อให้ทั้งหน้าเบาลงพร้อมกัน */
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopQuery = window.matchMedia('(min-width: 992px)');
    const saveData = navigator.connection?.saveData === true;

    /* พาราแลกซ์ต่างคอลัมน์ถูกถอดออกแล้ว y จึงว่างให้ reveal ใช้เป็น px ได้ตรง ๆ
       ไม่ต้องหลบไปใช้ yPercent เหมือนตอนที่สอง tween ยังใช้การ์ดใบเดียวกัน */
    /* ไม่จางถึง 0: reveal เป็นสองทาง การ์ดที่เลื่อนย้อนขึ้นจะถอยกลับมาสถานะนี้
       ถ้าปล่อยให้หายสนิทจะรู้สึกเหมือนเนื้อหาโดนลบทิ้ง เหลือเงาไว้บาง ๆ ให้รู้ว่ายังอยู่ */
    const REVEAL_FROM = { opacity: 0.2, y: 56, scale: 0.96 };
    const REVEAL_TO = { opacity: 1, y: 0, scale: 1 };
    /* ช่วง scroll ที่ใช้ reveal หนึ่งใบ วัดจากขอบบนการ์ดเทียบความสูงจอ
       92% → 72% ราว 1 ใน 5 ของจอ: สั้นพอให้แต่ละใบขึ้นจบเป็นตัว ๆ
       ถ้ายาวกว่านี้ช่วงของใบข้าง ๆ จะทับกันจนกลืนเป็นก้อนเดียว */
    const REVEAL_START_LINE = 92;
    const REVEAL_END_LINE = 72;
    /* การ์ดในแถวเดียวกันมีขอบบนตรงกันเป๊ะ ถ้าใช้เส้นเดียวกันหมดจะขึ้นพร้อมกันทั้งแถว
       ยกเส้นของใบถัด ๆ ไปให้สูงขึ้นใบละ 14% ของจอ ใบขวาจึงต้องเลื่อนต่ออีกถึงจะเริ่ม
       มากกว่าครึ่งของช่วง reveal (20%) แปลว่าใบแรกไปได้ 70% แล้วใบที่สองถึงเริ่ม
       และใบที่สามเริ่มหลังใบแรกจบไปแล้ว — เห็นเป็นคิวไล่มาทีละใบชัด ๆ */
    const REVEAL_STAGGER_LINE = 14;
    const REVEAL_SCRUB = 0.6;  // วินาทีที่ภาพตามหลังล้อ กันกระตุกจาก scroll ที่มาเป็นก้อน
    const ROW_TOLERANCE = 8;   // px ที่ยังนับว่าการ์ดสองใบอยู่แถวเดียวกัน กันเศษ subpixel
    const PORTRAIT_DRIFT = 7;  // % ของส่วนภาพที่กรอบ 4:5 ยังไม่ได้ใช้

    let ctx = null;

    const build = () => {
        /* revert คืนค่า inline style ที่ gsap.set ไว้ และ kill ScrollTrigger เดิมทั้งหมด
           ที่สร้างในคอนเท็กซ์นี้ กันไม่ให้ trigger ค้างบนการ์ดของแท็บก่อนหน้า */
        ctx?.revert();
        ctx = null;

        if (reducedQuery.matches || saveData) return;

        /* เฉพาะแผงของวันที่แสดงอยู่ แผงที่ซ่อนเป็น display:none วัดตำแหน่งไม่ได้
           ScrollTrigger จะได้ค่า 0 ทั้งหมดถ้าเผลอเอาไปคำนวณด้วย */
        const visiblePanel = section?.querySelector('.speaker__day-panel:not([hidden])');
        const scopes = [visiblePanel || section, moderatorGrid].filter(Boolean);
        const cards = scopes.flatMap((scope) => Array.from(scope.querySelectorAll('.speaker-card')));
        if (!cards.length) return;

        const withScrub = desktopQuery.matches;

        /* ลำดับในแถวมาจากตำแหน่งที่วัดได้จริง ไม่ใช่ --speaker-column เพราะต่ำกว่า
           1200px CSS สั่ง grid-column: auto ทับ เลขคอลัมน์จึงไม่ตรงกับที่ตาเห็น
           ต้องวัดให้ครบทุกใบก่อนสร้าง tween: fromTo เขียน transform ทันทีที่ถูกสร้าง
           ถ้าวัดสลับกับสร้างจะได้ตำแหน่งที่โดน y ของใบก่อนหน้ากวนไปแล้ว */
        const measured = cards.map((card) => {
            const { top, left } = card.getBoundingClientRect();

            return { card, top, left, order: 0 };
        });
        const rows = new Map();

        measured.forEach((item) => {
            const key = Math.round(item.top / ROW_TOLERANCE);

            rows.set(key, [...(rows.get(key) || []), item]);
        });

        rows.forEach((row) => {
            row.sort((a, b) => a.left - b.left)
                .forEach((item, order) => { item.order = order; });
        });

        ctx = gsap.context(() => {
            /* ทีละใบ ไม่ใช่ batch: จังหวะมาจากตำแหน่งจริงของการ์ดล้วน ๆ
               ease: 'none' เพราะจังหวะเร่ง/ผ่อนควรมาจากมือคนเลื่อน ไม่ใช่จาก easing curve */
            /* ไม่ใช้ once: trigger อยู่ครบตลอด เลื่อนขึ้น-ลงการ์ดจึงเดินตามล้อทั้งสองทาง
               ตอนสลับวันก็ไม่ต้องมีเคสพิเศษ: การ์ดที่เลยช่วงไปแล้วถูกคิด progress 1
               ให้ตั้งแต่ตอนสร้าง trigger (สิ่งที่ ScrollTrigger.batch แบบเดิมทำไม่ได้) */
            measured.forEach(({ card, order }) => {
                const offset = order * REVEAL_STAGGER_LINE;

                gsap.fromTo(card, REVEAL_FROM, {
                    ...REVEAL_TO,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: card,
                        start: `top ${REVEAL_START_LINE - offset}%`,
                        end: `top ${REVEAL_END_LINE - offset}%`,
                        scrub: REVEAL_SCRUB,
                    },
                });
            });

            if (!withScrub) return;

            cards.forEach((card) => {
                if (!card.querySelector('.speaker-card__portrait img')) return;

                /* ขยับเฉพาะ drift ไม่แตะ --speaker-portrait-y ที่เป็นค่าจัดหัวของแต่ละรูป
                   ต่อให้ revert ล้าง drift ทิ้ง object-position ก็ยังกลับไปที่ค่าจัดหัวเดิม */
                gsap.fromTo(
                    card,
                    { '--speaker-portrait-drift': '0%' },
                    {
                        '--speaker-portrait-drift': `${PORTRAIT_DRIFT}%`,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: 1,
                        },
                    },
                );
            });
        });

        ScrollTrigger.refresh();
    };

    build();

    reducedQuery.addEventListener('change', build);
    desktopQuery.addEventListener('change', build);
    document.addEventListener('speaker:daychange', build);

    /* รูปเป็น lazy-load ถึงกรอบจะกันพื้นที่ไว้ด้วย aspect-ratio แล้ว แต่ refresh
       อีกครั้งหลังหน้าโหลดครบกันตำแหน่ง trigger เพี้ยนจาก layout ที่ขยับทีหลัง */
    window.addEventListener('load', () => ScrollTrigger.refresh());
})();
