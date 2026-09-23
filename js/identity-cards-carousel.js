/* Coverflow carousel ของ section Identity Cards
   ตำแหน่งการ์ดคิดจากเลข index แบบทศนิยมตัวเดียว (pos) แล้ววาดด้วย transform ตรง ๆ
   ไม่ผ่าน state ใด ๆ การวนลูปใช้วิธีพับระยะห่างให้เหลือทางที่สั้นกว่าในวงแหวน
   จึงไม่ต้องโคลน DOM หรือสลับลำดับ node
   วิดีโอเล่นเฉพาะใบที่อยู่กลางเวทีและเฉพาะตอนที่ section อยู่ในจอ ใบอื่นหยุดและถอยกลับเฟรมแรก */
(() => {
    const root = document.querySelector('[data-identity-carousel]');
    if (!root) return;

    const frame = root.querySelector('[data-identity-frame]');
    const cards = [...root.querySelectorAll('[data-identity-card]')];
    if (!frame || !cards.length) return;

    const nameLabel = root.querySelector('[data-identity-name]');
    const indexLabel = root.querySelector('[data-identity-index]');

    const shades = cards.map(card => card.querySelector('[data-identity-shade]'));

    const count = cards.length;
    const ROTATE = 44;
    const MAX_TILT = 82;
    const DEPTH = 0.6;
    const FALLOFF = 0.56;
    const SHADE_STEP = 0.3;
    const SHADE_MAX = 0.6;
    const GAP = 0.05;
    /* เวลาเลื่อนต่อ 1 ใบ ระยะไกลกว่านั้นยืดเวลาแบบรากที่สอง (ไม่ใช่เป็นเท่าตัว)
       การกระโดดหลายใบจึงไม่ช้าเกินไป และปัดเศษให้อยู่ในช่วงที่ยังรู้สึกกระฉับกระเฉง */
    const SETTLE_DURATION = 620;
    const SETTLE_DURATION_MIN = 260;
    const SETTLE_DURATION_MAX = 1000;
    const FLICK_CARDS_MAX = 2;
    const FLICK_SCALE = 0.18;
    const CLICK_SLOP = 6;
    /* ตัวขับหลักของการเลื่อนอัตโนมัติคือ event 'ended' ของวิดีโอใบที่อยู่กลางเวที
       ตัวจับเวลาสองค่านี้เป็นตัวสำรองเผื่อ 'ended' ไม่มา (โหลดไม่สำเร็จ เบราว์เซอร์บล็อก autoplay
       หรือวิดีโอค้างเฟรมสุดท้าย) ถ้ารู้ความยาววิดีโอแล้วจะรอแค่เกินความยาวนิดเดียว
       ยังไม่รู้ค่อยใช้ค่าตั้งต้นที่ยาวกว่า carousel จะได้ไม่ค้างนานโดยไม่จำเป็น */
    const AUTOPLAY_FALLBACK = 8000;
    const AUTOPLAY_GRACE = 1200;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let pos = 0;
    let target = 0;
    let cardWidth = 0;
    let frameId = null;
    let selected = -1;
    let inView = false;
    let drag = null;
    let lastDragDistance = 0;
    let autoplayId = null;
    let focused = false;

    const indexAt = value => ((Math.round(value) % count) + count) % count;

    /* ease-in-out ออกตัวและเข้าจอดนุ่มทั้งสองฝั่ง ต่างจากแบบเดิมที่พุ่งออกตัวทันทีแล้วค่อย ๆ หยุด */
    const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function paint() {
        if (!cardWidth) return;

        const pitch = cardWidth * (1 + GAP);

        cards.forEach((card, index) => {
            /* พับระยะห่างให้เหลือทางที่สั้นกว่าในวงแหวน ใบที่ไกลเกินครึ่งวงจะโผล่อีกฝั่งแทน */
            let offset = ((index - pos) % count + count) % count;
            if (offset > count / 2) offset -= count;

            const distance = Math.abs(offset);
            /* ทั้งมุมเอียงและระยะถอยหลังค่อย ๆ ผ่อนลงเมื่อไกลออกไป ถ้าไล่แบบเส้นตรง
               ใบที่สองจะหุบจนอ่านไม่ออก */
            const ramp = Math.pow(distance, FALLOFF);
            const tilt = Math.min(ROTATE * ramp, MAX_TILT) * Math.sign(offset);

            card.style.transform = `translateX(calc(-50% + ${offset * pitch}px)) `
                + `translateZ(${-DEPTH * cardWidth * ramp}px) rotateY(${-tilt}deg)`;
            /* ใบข้าง ๆ ทึบเต็มเท่าใบกลาง ความจางเหลือไว้เฉพาะช่วงที่ใบถูกย้ายข้ามวงแหวน
               ซึ่งต้องจางหมดก่อนถึงครึ่งวงพอดี ไม่งั้นจะเห็นมันกระโดดไปโผล่อีกฝั่ง */
            card.style.opacity = String(Math.min(1, Math.max(0, count / 2 - distance)));
            card.style.zIndex = String(100 - Math.round(distance));

            /* เงาตกจากใบที่อยู่หน้ากว่า ยิ่งถอยไปหลังยิ่งมืด ไล่จากขอบด้านที่ถูกบัง
               (ใบฝั่งซ้ายโดนบังขอบขวา จึงพลิกภาพไล่เงาด้วย scaleX แทนการเปลี่ยน gradient) */
            const shade = shades[index];
            if (shade) {
                shade.style.opacity = String(Math.min(distance * SHADE_STEP, SHADE_MAX));
                shade.style.transform = offset < 0 ? 'scaleX(-1)' : 'none';
            }
        });
    }

    function syncVideos() {
        cards.forEach((card, index) => {
            const video = card.querySelector('[data-identity-video]');
            if (!video) return;

            const shouldPlay = index === selected && inView && !reduceMotion.matches;

            if (shouldPlay) {
                video.play().catch(() => {});
                return;
            }

            if (!video.paused) video.pause();
            if (video.currentTime) video.currentTime = 0;
        });
    }

    /* ภาพนิ่งวางทับวิดีโอไว้ตลอด และเปิดทางให้วิดีโอเฉพาะตอนที่เล่นจริงแล้วเท่านั้น
       ถ้าซ่อนภาพนิ่งตั้งแต่ตอนสั่งเล่น จะเห็นกรอบดำระหว่างที่ไฟล์ยังโหลดไม่เสร็จ */
    cards.forEach((card, index) => {
        const video = card.querySelector('[data-identity-video]');
        if (!video) return;

        video.addEventListener('playing', () => {
            card.classList.add('is-playing');
            /* รู้ความยาวจริงตอนนี้แล้ว ตั้งเวลาสำรองใหม่ให้รัดกุมกว่าค่าตั้งต้น */
            if (index === selected) scheduleAutoplay();
        });
        video.addEventListener('pause', () => card.classList.remove('is-playing'));

        /* วิดีโอของใบกลางเล่นจบ = หมดเวลาของใบนั้น เลื่อนไปใบถัดไปทันที
           ถ้าจังหวะนั้นผู้ใช้กำลังยุ่งอยู่ ให้ถอยวิดีโอกลับต้นเรื่องไว้เฉย ๆ
           แล้วรอตัวจับเวลาสำรองพาไปต่อเมื่อผู้ใช้ปล่อยมือ */
        video.addEventListener('ended', () => {
            if (index !== selected) return;

            if (canAutoplay()) {
                nudge(1);
                return;
            }

            video.currentTime = 0;
        });
    });

    function select(index) {
        if (index === selected) return;
        selected = index;

        cards.forEach((card, cardIndex) => {
            card.classList.toggle('is-active', cardIndex === index);
        });

        if (nameLabel) nameLabel.textContent = cards[index].dataset.cardName || '';
        if (indexLabel) indexLabel.textContent = String(index + 1).padStart(2, '0');

        syncVideos();
    }

    /* เลื่อนเองได้เมื่อไม่มีใครยุ่งกับมันอยู่ (ชี้เมาส์ค้าง โฟกัสด้วยคีย์บอร์ด หรือกำลังลาก)
       ยังอยู่ในจอ และผู้ใช้ไม่ได้ตั้งค่าไม่เอา motion */
    const canAutoplay = () => inView && !focused && !drag && !reduceMotion.matches;

    function stopAutoplay() {
        clearTimeout(autoplayId);
        autoplayId = null;
    }

    function scheduleAutoplay() {
        stopAutoplay();
        if (!canAutoplay()) return;

        const video = cards[selected]?.querySelector('[data-identity-video]');
        const wait = video && Number.isFinite(video.duration) && video.duration > 0
            ? video.duration * 1000 + AUTOPLAY_GRACE
            : AUTOPLAY_FALLBACK;

        autoplayId = setTimeout(() => nudge(1), wait);
    }

    function settle(next) {
        if (frameId !== null) cancelAnimationFrame(frameId);
        target = next;
        select(indexAt(next));
        scheduleAutoplay();

        if (reduceMotion.matches) {
            pos = next;
            paint();
            frameId = null;
            return;
        }

        const from = pos;
        const delta = next - from;

        if (!delta) {
            frameId = null;
            return;
        }

        const duration = Math.min(SETTLE_DURATION_MAX,
            Math.max(SETTLE_DURATION_MIN, SETTLE_DURATION * Math.sqrt(Math.abs(delta))));
        const startedAt = performance.now();

        const step = now => {
            const progress = Math.min(1, (now - startedAt) / duration);

            pos = from + delta * easeInOut(progress);
            paint();

            if (progress < 1) {
                frameId = requestAnimationFrame(step);
                return;
            }

            pos = target;
            paint();
            frameId = null;
        };

        frameId = requestAnimationFrame(step);
    }

    /* เดินไปหาใบที่เลือกทางที่สั้นกว่า แทนที่จะคลายวงแหวนทั้งวง */
    function goTo(index) {
        settle(index + Math.round((target - index) / count) * count);
    }

    function nudge(by) {
        settle(Math.round(target) + by);
    }

    function measure() {
        const width = cards[0].offsetWidth;
        if (!width || width === cardWidth) return;
        cardWidth = width;
        paint();
    }

    frame.addEventListener('pointerdown', event => {
        if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
        }

        frame.setPointerCapture(event.pointerId);
        stopAutoplay();
        target = pos;
        drag = {
            id: event.pointerId,
            x: event.clientX,
            pos,
            velocity: 0,
            time: performance.now(),
            moved: 0,
        };
    });

    frame.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;

        const pitch = cardWidth * (1 + GAP);
        if (!pitch) return;

        const now = performance.now();
        const previous = pos;
        /* section ถูก scale อยู่ระหว่าง scroll-driven expand (ดู js/scroll-expand.js)
           ระยะที่นิ้วลากมาเป็นพิกเซลบนจอ ส่วน pitch คิดจาก offsetWidth ซึ่งเป็นพิกเซล layout
           ถ้าเอามาหารกันตรง ๆ ตอนที่ scale ยังไม่ถึง 1 การ์ดจะเลื่อนช้ากว่านิ้ว
           หารด้วยอัตราส่วนจริง (rect / layout) ก่อน ทั้งสองค่าจึงอยู่หน่วยเดียวกันเสมอ
           ตอน scale เป็น 1 ค่านี้เท่ากับ 1 พอดี ไม่มีผลอะไร */
        const scale = frame.getBoundingClientRect().width / (frame.offsetWidth || 1);
        const shift = (event.clientX - drag.x) / (scale || 1);

        drag.moved = Math.max(drag.moved, Math.abs(shift));
        pos = drag.pos - shift / pitch;
        /* หน่วยเป็น "ใบต่อวินาที" ใช้คำนวณแรงเหวี่ยงตอนปล่อยนิ้ว */
        drag.velocity = ((pos - previous) / Math.max(now - drag.time, 1)) * 1000;
        drag.time = now;

        select(indexAt(pos));
        paint();
    });

    function endDrag(event) {
        if (!drag || drag.id !== event.pointerId) return;
        const carried = Math.max(-FLICK_CARDS_MAX, Math.min(FLICK_CARDS_MAX, drag.velocity * FLICK_SCALE));
        lastDragDistance = drag.moved;
        drag = null;
        settle(Math.round(pos + carried));
    }

    frame.addEventListener('pointerup', endDrag);
    frame.addEventListener('pointercancel', endDrag);

    frame.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            nudge(-1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            nudge(1);
        }
    });

    /* คลิกใบข้าง ๆ เพื่อดึงมาไว้กลางเวที แต่ต้องไม่ใช่การลากที่จบลงบนใบนั้น */
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            if (lastDragDistance > CLICK_SLOP) return;
            if (index === selected) return;
            goTo(index);
        });
    });

    /* นับเฉพาะโฟกัสที่มาจากคีย์บอร์ด (:focus-visible) เท่านั้นว่าเป็นการใช้งานอยู่
       เพราะการคลิกปุ่มลูกศรด้วยเมาส์ทิ้งโฟกัสค้างไว้ที่ปุ่ม ถ้านับด้วยจะหยุดเลื่อนอัตโนมัติถาวร */
    root.addEventListener('focusin', event => {
        focused = event.target.matches(':focus-visible');

        if (focused) stopAutoplay();
        else scheduleAutoplay();
    });
    root.addEventListener('focusout', () => {
        focused = false;
        scheduleAutoplay();
    });

    if ('IntersectionObserver' in window) {
        /* เลื่อนเร็ว ๆ ครั้งเดียวอาจได้ entry หลายอันใน callback เดียว และเรียงจากเก่าไปใหม่
           ต้องอ่านอันสุดท้ายเท่านั้น ไม่งั้นจะได้สถานะเก่าแล้วสั่งหยุดวิดีโอที่เพิ่งเริ่มเล่น */
        const observer = new IntersectionObserver(entries => {
            inView = entries[entries.length - 1].isIntersecting;
            syncVideos();
            scheduleAutoplay();
        }, { threshold: 0.25 });

        observer.observe(root);
    } else {
        inView = true;
    }

    new ResizeObserver(measure).observe(frame);
    reduceMotion.addEventListener('change', () => {
        syncVideos();
        scheduleAutoplay();
    });

    measure();
    select(0);
    paint();
})();
