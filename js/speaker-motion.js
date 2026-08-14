/* Motion สำหรับการ์ด speaker
   โหลดหลัง gsap.min.js / ScrollTrigger.min.js และหลัง speaker-directory.js
   ที่เป็นคนสร้างการ์ดลง DOM

   สองเอฟเฟกต์:
   1. reveal เล่นครั้งเดียวเมื่อการ์ดเข้าหน้าจอ — การ์ดเลื่อนขึ้นจากด้านล่าง
      พร้อม fade/scale เบา ๆ และ stagger ตามลำดับในแถว
   2. pan ภาพในกรอบตาม scroll โดยขยับ --speaker-portrait-drift แยกจาก
      --speaker-portrait-y ที่ใช้จัดหัวให้เสมอกันทุกใบ */
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

    /* reveal เล่นครั้งเดียวเมื่อเข้าหน้าจอ ไม่ scrub ตาม scroll แล้ว
       ค่าเริ่มยังอยู่ด้านล่างเล็กน้อยเพื่อให้เห็นการ์ดลอยขึ้นมาตามคำขอ */
    const REVEAL_FROM = { opacity: 0, y: 64, scale: 0.98 };
    const REVEAL_TO = { opacity: 1, y: 0, scale: 1 };
    const REVEAL_START_LINE = 88;
    const REVEAL_DURATION = 0.72;
    const REVEAL_STAGGER_DELAY = 0.12;
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
            /* ทีละใบเพื่อคุม delay ตามตำแหน่งจริงในแถว ไม่ใช้ scrub แล้ว
               การ์ดจะเล่นเมื่อเข้าหน้าจอครั้งแรกและไม่ย้อน animation ตอน scroll กลับ */
            measured.forEach(({ card, order }) => {
                gsap.fromTo(card, REVEAL_FROM, {
                    ...REVEAL_TO,
                    duration: REVEAL_DURATION,
                    delay: order * REVEAL_STAGGER_DELAY,
                    ease: 'power3.out',
                    clearProps: 'opacity,transform',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top ' + REVEAL_START_LINE + '%',
                        once: true,
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
