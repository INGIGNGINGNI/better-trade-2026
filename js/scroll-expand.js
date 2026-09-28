/* Scroll-driven expand: section ค่อย ๆ ขยายจากแผงขอบมนจนเต็มจอตามระยะที่เลื่อน
   ต่างจาก reveal-on-scroll.js ตรงที่นี่ไม่ใช่ trigger ยิงครั้งเดียวจบ แต่เป็น "scrub"
   ความคืบหน้าผูกกับตำแหน่งของ section ในจอตลอดเวลา เลื่อนขึ้นก็ย้อนกลับเอง

   JS ทำหน้าที่เดียวคือคำนวณค่า 0-1 แล้วเขียนลง custom property
   ส่วนจะเอาไปทำอะไร (scale, border-radius, อะไรก็ตาม) เป็นเรื่องของ CSS ทั้งหมด
   ตรงนี้จึงไม่ต้องรู้จักหน้าตาของ section เลย และเอาไปใช้กับ section อื่นได้ทันที

   ทำไมไม่ใช้ CSS scroll-driven animation (animation-timeline: view()) ซึ่งไม่ต้องมี JS เลย:
   ยังไม่รองรับครบทุกเบราว์เซอร์ที่หน้านี้ต้องรองรับ ถ้าวันหลังรองรับแล้วถอดไฟล์นี้ทิ้งได้
   โดยไม่ต้องแก้ CSS เพราะทั้งสองทางเขียนค่าลง property ตัวเดียวกัน */
(function () {
    'use strict';

    /* ค่าใน data-scroll-expand คือ "จุดเริ่ม จุดจบ" คิดเป็นสัดส่วนของความสูงจอ
       วัดจากขอบบนของ element เช่น "0.85" = เริ่มตอนขอบบนของมันอยู่ที่ 85% ของความสูงจอ
       ปล่อยว่างไว้ได้ ค่าตั้งต้นคือ 0.5 ถึง 0 (เริ่มครึ่งจอ จบตอนชนขอบบนจอ)
       ตัวเลขตัวที่สองเป็นแค่ "อย่างช้าที่สุด" ดูเงื่อนไขจริงที่ progressOf */
    const targets = [...document.querySelectorAll('[data-scroll-expand]')].map((el) => {
        /* filter(Boolean) สำคัญ: attribute ที่ไม่ใส่ค่า (data-scroll-expand เฉย ๆ) ได้ '' มา
           split แล้วเป็น [''] ซึ่ง Number('') = 0 และ isFinite(0) = true
           จุดเริ่มจึงกลายเป็น 0 แทนที่จะตกไปใช้ค่าตั้งต้น 0.5 ทำให้ span = 0 แล้วค้างที่ 1 ตลอด
           กรองตัวว่างออกก่อน range จึงเป็น [] และ range[0] เป็น undefined ตามที่ควรเป็น */
        const range = (el.getAttribute('data-scroll-expand') || '').trim().split(/[\s,]+/).filter(Boolean).map(Number);
        const start = Number.isFinite(range[0]) ? range[0] : 0.5;
        const end = Number.isFinite(range[1]) ? range[1] : 0;

        /* data-scroll-expand-exit: ย่อกลับตอน section เลื่อนออกทางขอบบนด้วย (กลับด้านของขาเข้า)
           ใส่เฉพาะ section ที่ต้องการ ของเดิมที่ไม่ใส่ยังขยายค้างไว้เหมือนเดิม
           ค่า "only" = มีแต่ขาออก ขาเข้าเต็มจออยู่แล้วตั้งแต่แรก */
        const exit = el.hasAttribute('data-scroll-expand-exit');
        const enterEnabled = el.getAttribute('data-scroll-expand-exit') !== 'only';

        return { el, start, end, exit, enterEnabled };
    });

    if (!targets.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* เครื่องที่ปิด motion ไว้: ข้ามไปสถานะปลายทาง (เต็มจอ) ตั้งแต่แรก ไม่ต้องคำนวณอะไรอีก */
    const settle = () => {
        targets.forEach(({ el }) => {
            el.style.setProperty('--bt-scroll-expand', '1');
            el.style.removeProperty('will-change');
        });
    };

    if (reduceMotion.matches) {
        settle();
        return;
    }

    /* ที่ไม่เริ่มนับตั้งแต่ element โผล่พ้นขอบล่างจอ เพราะช่วงนั้นคนยังอ่านของก่อนหน้าอยู่
       ถ้าเริ่มขยายเลยจะเห็นเป็นของกระดิกอยู่หางตา ไม่ได้อ่านเป็นการเปลี่ยนฉาก

       จุดจบไม่ได้ใช้ค่าที่ตั้งไว้ตรง ๆ แต่เอามาเทียบกับ "จุดที่ element โผล่เต็มตัวพอดี"
       แล้วเลือกอันที่มาถึงก่อน เพราะ element ท้ายหน้าเลื่อนขึ้นไปได้จำกัด
       ใต้มันมีแค่ footer ยิ่งหน้าต่างสูง ยิ่งเลื่อนขึ้นไปได้น้อย
       ถ้าตรึงจุดจบไว้ที่สัดส่วนของความสูงจอเฉย ๆ พอหน้าต่างสูงเกินค่าหนึ่งจะไปไม่ถึง
       แล้วค้างย่ออยู่อย่างนั้นตลอดกาล (แผง CTA ที่จอสูง 1200px เจอเคสนี้พอดี)
       ผูกกับความสูงของตัวมันเองแทน จึงถึงเสมอไม่ว่าหน้าต่างจะสูงแค่ไหน
       ส่วน element ที่สูงกว่าจอ (identity-cards) ค่านี้ติดลบ จุดจบจึงกลับไปเป็นค่าที่ตั้งไว้ */
    const clamp01 = (value) => Math.min(1, Math.max(0, value));

    /* คืน { value, exiting } — exiting = กำลังย่อเพราะเลื่อนออก (CSS ใช้สลับจุดยึดไปขอบล่าง) */
    const progressOf = ({ el, start, end, exit, enterEnabled }) => {
        const box = el.getBoundingClientRect();
        const height = window.innerHeight;
        const startPx = start * height;
        const endPx = Math.max(end * height, height - box.height);
        const span = startPx - endPx;

        if (span <= 0) return { value: 1, exiting: false };

        const enter = enterEnabled ? clamp01((startPx - box.top) / span) : 1;
        if (!exit) return { value: enter, exiting: false };

        /* ขาออกคือภาพสะท้อนของขาเข้า: ใช้ระยะจากขอบล่างของ section ถึงขอบล่างจอ
           แทนระยะจากขอบบนจอถึงขอบบนของ section ด้วยจุดเริ่ม/จุดจบชุดเดียวกัน */
        const leave = clamp01((startPx - (height - box.bottom)) / span);

        return { value: Math.min(enter, leave), exiting: leave < enter };
    };

    let frame = 0;

    const paint = () => {
        frame = 0;

        targets.forEach((target) => {
            const { value: progress, exiting } = progressOf(target);

            target.el.style.setProperty('--bt-scroll-expand', progress.toFixed(4));
            if (target.exit) target.el.toggleAttribute('data-scroll-expand-exiting', exiting);

            /* ยก layer ให้เฉพาะตอนที่กำลังขยับจริง ค้างไว้ตลอดกินหน่วยความจำ compositor เปล่า ๆ
               ปลายทางทั้งสองฝั่ง (0 กับ 1) คือตอนที่ค้างนิ่ง จึงถอดออกได้ */
            if (progress > 0 && progress < 1) {
                target.el.style.setProperty('will-change', 'transform');
            } else {
                target.el.style.removeProperty('will-change');
            }
        });
    };

    /* อ่าน layout ใน rAF เสมอ ไม่อ่านใน handler ของ scroll ตรง ๆ
       เพราะ getBoundingClientRect บังคับให้เบราว์เซอร์คำนวณ layout ให้เดี๋ยวนั้น
       ถ้าเรียกทุก event ที่ยิงมา (บางเครื่องถี่กว่าเฟรม) จะกลายเป็นคอขวดของการเลื่อนเอง */
    const schedule = () => {
        if (frame) return;

        frame = requestAnimationFrame(paint);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    /* เบราว์เซอร์คืนตำแหน่งสกรอลล์เดิมให้ตอนรีเฟรช และการเปิดด้วย #identity-cards ก็กระโดดไปเอง
       ทั้งสองกรณีเกิดหลัง paint() รอบแรกและไม่ได้ยิง scroll event เสมอไป
       ถ้าไม่นับใหม่ตรงนี้ ค่าจะค้างอยู่ที่ของตอนโหลด จนกว่าคนจะขยับสกรอลล์เอง
       pageshow ครอบเคสกลับมาจาก bfcache ด้วย (ย้อนกลับจากหน้าอื่น ไม่ผ่าน load) */
    window.addEventListener('load', schedule);
    window.addEventListener('pageshow', schedule);
    reduceMotion.addEventListener('change', (event) => {
        if (event.matches) {
            if (frame) cancelAnimationFrame(frame);
            frame = 0;
            settle();
            return;
        }

        schedule();
    });

    paint();
})();
