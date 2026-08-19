/* Parallax เบา ๆ ให้ภาพพื้นหลังของ section ticket เลื่อนช้ากว่าการ scroll ปกติ
   รูปสูงเกินกรอบที่มองเห็นไว้แล้ว (ดู --bt-ticket-backdrop-parallax-bleed ใน style.css)
   ที่นี่แค่เลื่อน translateY ของรูปตาม scroll โดยไม่โผล่ขอบให้เห็นเพราะ .ticket__backdrop-clip
   ครอบตัดไว้อยู่แล้ว

   trigger ผูกกับ .ticket__backdrop-clip (แค่กรอบสูง ~600px ที่เห็นภาพจริง) ไม่ใช่ทั้ง section
   ticket เพราะ section สูงกว่านั้นมาก (มีการ์ดราคา/สิทธิประโยชน์ต่ออีกยาว) ถ้าผูกกับทั้ง section
   ระยะเลื่อน -bleed ถึง +bleed จะถูกเฉลี่ยไปตลอดความสูงของทั้ง section ทำให้ตอนที่ภาพยัง
   มองเห็นอยู่จริง (แค่ช่วงต้น) มันแทบไม่ขยับเลย สังเกตไม่ออกว่ามี parallax */
(() => {
    const clip = document.querySelector('.ticket__backdrop-clip');
    const backdrop = clip?.querySelector('.ticket__backdrop');
    if (!clip || !backdrop || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    /* วัดจากขนาดจริงแทนที่จะ parse ค่า calc() ของ custom property (อ่านไม่ได้ตรง ๆ)
       ใช้ฟังก์ชันแทนตัวเลขคงที่ ให้ GSAP เรียกวัดใหม่ทุกครั้งที่ ScrollTrigger.refresh()
       (resize/breakpoint เปลี่ยน --bt-ticket-backdrop-height ก็ตามให้เองอัตโนมัติ) */
    const getBleed = () => {
        const clipHeight = clip.getBoundingClientRect().height;
        const backdropHeight = backdrop.getBoundingClientRect().height;
        return Math.max(0, (backdropHeight - clipHeight) / 2);
    };

    gsap.fromTo(backdrop, {
        y: () => -getBleed(),
    }, {
        y: () => getBleed(),
        ease: 'none',
        immediateRender: false,
        scrollTrigger: {
            trigger: clip,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
        },
    });

    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
})();
