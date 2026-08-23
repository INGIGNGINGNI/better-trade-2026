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
    const REVEAL_FROM = { opacity: 0, y: 112, scale: 0.96 };
    const REVEAL_TO = { opacity: 1, y: 0, scale: 1 };
    const REVEAL_DURATION = 0.92;
    const REVEAL_STAGGER_DELAY = 0.1;
    const ROW_TOLERANCE = 8;   // px ที่ยังนับว่าการ์ดสองใบอยู่แถวเดียวกัน กันเศษ subpixel
    const PORTRAIT_DRIFT = 7;  // % ของส่วนภาพที่กรอบ 4:5 ยังไม่ได้ใช้

    let ctx = null;
    let revealObserver = null;

    const build = () => {
        /* revert คืนค่า inline style ที่ gsap.set ไว้ และ kill ScrollTrigger เดิมทั้งหมด
           ที่สร้างในคอนเท็กซ์นี้ กันไม่ให้ trigger ค้างบนการ์ดของแท็บก่อนหน้า */
        revealObserver?.disconnect();
        revealObserver = null;
        ctx?.revert();
        ctx = null;

        if (reducedQuery.matches || saveData) return;

        /* เฉพาะแผงของวันที่แสดงอยู่ แผงที่ซ่อนเป็น display:none วัดตำแหน่งไม่ได้
           ScrollTrigger จะได้ค่า 0 ทั้งหมดถ้าเผลอเอาไปคำนวณด้วย
           ต้องเก็บให้ครบทุกแผงที่ยังโชว์ (querySelectorAll ไม่ใช่ querySelector):
           จอ >767px ตอนนี้ Day 1 กับ Day 2 โชว์พร้อมกันทั้งคู่ ถ้าเอาแค่แผงแรก
           การ์ดของ Day 2 จะไม่ได้ reveal เลย */
        const visiblePanels = section
            ? Array.from(section.querySelectorAll('.speaker__day-panel:not([hidden])'))
            : [];
        const scopes = [...(visiblePanels.length ? visiblePanels : [section]), moderatorGrid].filter(Boolean);
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

        const revealCard = (card, order) => {
            card.classList.add('is-speaker-card-revealed');
            gsap.to(card, {
                ...REVEAL_TO,
                duration: REVEAL_DURATION,
                delay: order * REVEAL_STAGGER_DELAY,
                ease: 'power3.out',
                clearProps: 'opacity,transform',
            });
        };

        measured.forEach(({ card }) => {
            if (card.classList.contains('is-speaker-card-revealed')) return;
            gsap.set(card, REVEAL_FROM);
        });

        if ('IntersectionObserver' in window) {
            revealObserver = new IntersectionObserver((entries) => {
                const arriving = entries
                    .filter(entry => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                arriving.forEach((entry) => {
                    const item = measured.find(({ card }) => card === entry.target);
                    if (!item) return;

                    revealCard(item.card, item.order);
                    revealObserver.unobserve(item.card);
                });
            }, {
                threshold: 0.18,
                rootMargin: '0px 0px -8% 0px',
            });

            measured.forEach(({ card }) => {
                if (!card.classList.contains('is-speaker-card-revealed')) {
                    revealObserver.observe(card);
                }
            });
        } else {
            measured.forEach(({ card, order }) => {
                if (!card.classList.contains('is-speaker-card-revealed')) {
                    revealCard(card, order);
                }
            });
        }

        ctx = gsap.context(() => {
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
