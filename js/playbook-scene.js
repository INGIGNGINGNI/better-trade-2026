/* ฉากห้องที่เป็นพื้นหลังร่วมของ hero + intro (personalized-playbook.html)
   ตัวฉากเองตรึงกับจอด้วย background-attachment: fixed จึงไม่ขยับเลยตอนเลื่อนหน้า
   ไฟล์นี้เติมสองอย่างที่ทำให้ฉากไม่ดูเป็นโปสเตอร์แบน ๆ

   1) ชั้นแสงเลื่อนสวนกับฉาก — ฉากหลักยังนิ่ง แต่ลำแสงขยับช้า ๆ ตามระยะที่เลื่อน
      ตาจึงได้สัญญาณความลึกกลับมา โดยไม่ต้องแตะภาพหลักที่จัดรอยต่อไว้แล้ว
   2) สลับม่านไล่สีเมื่อถึง intro — ม่านชุดเดิมออกแบบมาเพื่อ hero ที่ข้อความชิดซ้าย
      พอถึง intro ที่ข้อความอยู่กึ่งกลาง จะค่อย ๆ ไล่เป็นม่านที่สว่างกลาง-เข้มขอบแทน
      (ไขว้ opacity ของม่านสองผืน เพราะ background-image เปลี่ยนค่าแบบไล่ไม่ได้)

   คลาส is-intro จากข้อ 2 ยังถูกใช้ต่อใน CSS เพื่อให้เนื้อหา hero จางหายไปพร้อมกับม่าน
   (ดู .playbook-scene.is-intro .playbook-hero__inner) จึงไม่ต้องคำนวณ opacity ที่นี่

   ทั้งสองอย่างปิดตัวเองเมื่อผู้ใช้ตั้งค่าลด motion */
(() => {
    const scene = document.querySelector('[data-playbook-scene]');
    const light = scene?.querySelector('[data-playbook-scene-light]');
    const intro = document.querySelector('.playbook-intro');

    if (!scene) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    /* สัดส่วนของ intro ที่ต้องโผล่ถึงก่อน ม่านทึบของ intro จึงจะเริ่มแสดง */
    const INTRO_VEIL_RATIO = 0.5;

    /* --- 2) ม่านไล่สี: ติดคลาสตอน intro ครอบพื้นที่จอเกินครึ่ง แล้วปล่อยให้ CSS ไล่เอง --- */
    if (intro && 'IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            scene.classList.toggle('is-intro', entry.intersectionRatio >= INTRO_VEIL_RATIO);
        }, { threshold: [0, INTRO_VEIL_RATIO, 1] }).observe(intro);
    }

    /* --- 1) ชั้นแสง --- */
    if (!light || reduceMotion.matches) return;

    const readTravel = () => {
        const value = parseFloat(getComputedStyle(scene).getPropertyValue('--bt-playbook-scene-light-travel'));

        return Number.isFinite(value) ? value : 56;
    };

    let travel = readTravel();
    let ticking = false;
    let written = '';

    const update = () => {
        ticking = false;

        const rect = scene.getBoundingClientRect();
        const range = window.innerHeight + rect.height;
        // 0 = ฉากเพิ่งโผล่จากก้นจอ, 1 = ฉากเพิ่งพ้นหัวจอ
        const progress = range > 0
            ? Math.min(1, Math.max(0, (window.innerHeight - rect.top) / range))
            : 0;
        const next = 'translate3d(0, ' + ((progress - 0.5) * travel).toFixed(1) + 'px, 0)';

        if (written === next) return;

        light.style.transform = next;
        written = next;
    };

    const requestUpdate = () => {
        if (ticking) return;

        ticking = true;
        requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', () => {
        travel = readTravel();
        requestUpdate();
    });
})();
