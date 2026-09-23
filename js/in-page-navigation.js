(() => {
    const HERO_SKIP_NAVIGATION_EVENT = 'bettertrade:hero-skip-navigation';
    const SECTION_NAVIGATION_EVENT = 'bettertrade:section-navigation';

    /* Smooth scrolling is cancelled whenever something writes the scroll position
       while it is in flight. ScrollTrigger.refresh() does exactly that (it scrolls to 0
       to measure, then restores), and refreshes still happen after the first click:
       the window load event, sections initialising once the loader is gone, and the
       Hero rebuilding itself when the runner video is skipped. The scroll then stops
       wherever it was — usually right at the top of #concept — so the visitor had to
       click the menu a second time. After each navigation, wait for the scroll to
       settle and continue to the target if it did not arrive. */
    const LANDING_TOLERANCE = 2;
    const SETTLE_FRAMES = 8;
    const MAX_CORRECTIONS = 3;
    const MAX_WATCH_MS = 6000;
    const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];

    let cancelLandingWatch = null;

    const scrollTargetIntoView = (target, behavior) => {
        try {
            target.scrollIntoView({ block: 'start', behavior });
        } catch {
            target.scrollIntoView(true);
        }
    };

    const hasLanded = (target) => {
        const scrollMarginTop = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const offset = target.getBoundingClientRect().top - scrollMarginTop;
        if (Math.abs(offset) <= LANDING_TOLERANCE) return true;

        /* A target near the end of the page cannot reach the top of the viewport. */
        const scrollingElement = document.scrollingElement || document.documentElement;
        const maxScrollY = scrollingElement.scrollHeight - scrollingElement.clientHeight;
        return offset > 0 && window.scrollY >= maxScrollY - LANDING_TOLERANCE;
    };

    const watchLanding = (target) => {
        cancelLandingWatch?.();

        const startedAt = performance.now();
        let corrections = 0;
        let stillFrames = 0;
        let lastScrollY = window.scrollY;
        let frame = 0;

        const stop = () => {
            window.cancelAnimationFrame(frame);
            USER_SCROLL_EVENTS.forEach((type) => window.removeEventListener(type, stop, true));
            if (cancelLandingWatch === stop) cancelLandingWatch = null;
        };

        const tick = () => {
            if (performance.now() - startedAt > MAX_WATCH_MS) {
                stop();
                return;
            }

            const scrollY = window.scrollY;
            stillFrames = Math.abs(scrollY - lastScrollY) < 0.5 ? stillFrames + 1 : 0;
            lastScrollY = scrollY;

            if (stillFrames >= SETTLE_FRAMES) {
                if (hasLanded(target) || corrections >= MAX_CORRECTIONS) {
                    stop();
                    return;
                }

                /* Retry smoothly first; if that is interrupted as well, jump so the
                   visitor is never left short of the section they picked. */
                corrections += 1;
                stillFrames = 0;
                scrollTargetIntoView(target, corrections === MAX_CORRECTIONS ? 'instant' : 'smooth');
            }

            frame = window.requestAnimationFrame(tick);
        };

        /* Any input from the visitor means they have taken over the scroll. */
        USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, stop, { capture: true, passive: true }));
        cancelLandingWatch = stop;
        frame = window.requestAnimationFrame(tick);
    };

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');

        /* Component-owned tabs/day switchers calculate their own sticky offsets.
           Let their local handlers scroll them so this generic anchor navigation
           does not immediately override the intended landing position. */
        if (!link || link.matches('[role="tab"], .agenda__day-switch, .speaker__day-switch')) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;

        const target = document.getElementById(hash.slice(1));
        if (!target) return;

        event.preventDefault();

        const navigate = () => {
            target.scrollIntoView({ block: 'start' });
            watchLanding(target);
            history.replaceState(null, '', window.location.pathname + window.location.search);
            window.dispatchEvent(new CustomEvent(SECTION_NAVIGATION_EVENT, {
                detail: { targetId: target.id },
            }));
        };

        /* Any in-page jump taken while the Hero is still pinned has to collapse the
           Hero timeline first, otherwise its pin distance keeps moving the destination
           while the scroll is in flight and the landing position ends up short. The
           Hero owns that decision and reports back through detail.handled. */
        const detail = { target, navigate, handled: false };
        window.dispatchEvent(new CustomEvent(HERO_SKIP_NAVIGATION_EVENT, { detail }));
        if (detail.handled) return;

        navigate();
    });

    /* เข้ามาจากหน้าอื่นด้วย #hash (เช่นเมนูบน personalized-playbook.html ที่ชี้มา index.html#ticket)
       เบราว์เซอร์กระโดดให้ครั้งเดียวตั้งแต่ตอนอ่าน HTML เสร็จ ตอนนั้นรูปที่เป็น lazy กับฟอนต์
       ยังไม่โหลด ความสูงของเนื้อหาด้านบนจึงยังไม่จริง พอโหลดเสร็จของด้านบนสูงขึ้น
       ปลายทางก็ถูกดันหนีลงไป ผู้ใช้เลยค้างอยู่ที่ section ก่อนหน้า
       ใช้ตัวเฝ้าจังหวะลงจอดชุดเดียวกับการคลิกเมนู ให้มันตามไปแก้ตำแหน่งจนกว่าหน้าจะนิ่ง
       (ตัวเฝ้าจะถอนตัวเองทันทีที่ผู้ใช้เลื่อนจอเอง จึงไม่แย่งการควบคุม) */
    const INITIAL_HASH_HOLD_MS = 8000;

    const landOnInitialHash = () => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (!id) return;

        const target = document.getElementById(id);
        if (!target) return;

        const startedAt = performance.now();
        let frame = 0;
        let stopped = false;

        /* รับเฉพาะ event ที่มาจากผู้ใช้จริง (isTrusted) สคริปต์ในหน้ายิง wheel/keydown
           สังเคราะห์ระหว่างที่กำลังเซ็ตตัว ถ้าไม่กรองไว้ ตัวเฝ้าจะถอนตัวตั้งแต่ยังไม่ทันแก้อะไรเลย */
        const stopOnUser = (event) => {
            if (event.isTrusted) stop();
        };

        /* ScrollTrigger วัดตำแหน่งใหม่ทุกครั้งที่ refresh และมักเขียนตำแหน่ง scroll ทับด้วย
           เกาะจังหวะนั้นไว้แล้วเล็งใหม่ ตรงกว่าการรอด้วยตัวจับเวลาอย่างเดียว */
        const realign = () => {
            if (!stopped) scrollTargetIntoView(target, 'instant');
        };

        const stop = () => {
            if (stopped) return;

            stopped = true;
            window.cancelAnimationFrame(frame);
            USER_SCROLL_EVENTS.forEach((type) => window.removeEventListener(type, stopOnUser, true));
            window.ScrollTrigger?.removeEventListener?.('refresh', realign);
        };

        /* เล็งใหม่ทุกเฟรมตลอดช่วงที่หน้ากำลังเซ็ตตัว ไม่ได้นับจำนวนครั้งที่แก้
           เพราะของที่ดันความสูงมาเป็นระลอก (รูป lazy, ฟอนต์, swiper, ScrollTrigger refresh)
           ทยอยมาไม่จบในรอบเดียว
           เฝ้าด้วย rAF ไม่ใช่ ResizeObserver เพราะกล่องของ <html> ไม่ได้โตตามเนื้อหา
           observer จึงไม่ยิงเลยแม้หน้าจะยาวขึ้นหลายพันพิกเซล */
        const tick = () => {
            if (stopped) return;

            if (performance.now() - startedAt > INITIAL_HASH_HOLD_MS) {
                stop();
                return;
            }

            if (!hasLanded(target)) scrollTargetIntoView(target, 'instant');

            frame = window.requestAnimationFrame(tick);
        };

        // ผู้ใช้เลื่อนเองเมื่อไหร่ถือว่าเขารับช่วงต่อแล้ว ถอนตัวทันที
        USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, stopOnUser, { capture: true, passive: true }));
        window.ScrollTrigger?.addEventListener?.('refresh', realign);
        tick();
    };

    const navigateToInitialHash = () => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (!id) return;

        const target = document.getElementById(id);
        if (!target) return;

        const navigate = () => {
            scrollTargetIntoView(target, 'instant');
            landOnInitialHash();
        };

        /* ต้องผ่านทาง Hero เหมือนตอนคลิกเมนู ไม่งั้น Hero จะกาง pin ของตัวเองทีหลัง
           แล้วดันปลายทางหนีลงไปอีกหลายพันพิกเซล (เป็นเหตุผลเดียวกับที่ตัวจัดการคลิกทำ) */
        const detail = { target, navigate, handled: false };
        window.dispatchEvent(new CustomEvent(HERO_SKIP_NAVIGATION_EVENT, { detail }));
        if (detail.handled) return;

        navigate();
    };

    if (window.location.hash) {
        /* เล็งหยาบ ๆ ไว้ก่อนตั้งแต่ DOM พร้อม เพื่อไม่ให้เห็นหน้ากระโดดไกลตอนหลัง
           แล้วค่อยเล็งจริงตอน load เสร็จ ซึ่งเป็นจังหวะที่ Hero กับ ScrollTrigger ตั้งตัวแล้ว */
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', landOnInitialHash, { once: true });
        } else {
            landOnInitialHash();
        }

        if (document.readyState === 'complete') {
            navigateToInitialHash();
        } else {
            window.addEventListener('load', navigateToInitialHash, { once: true });
        }
    }
})();
